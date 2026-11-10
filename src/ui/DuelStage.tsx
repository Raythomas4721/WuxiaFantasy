// 過招舞台：兩個水墨剪影小人。出招衝上前、受擊閃紅後退、傷害數字飄起來；
// 對手擺出的架勢預告下一招。全部由前後兩個 DuelState 的差異推算，不改引擎。

import { useEffect, useRef, useState } from 'react';
import { getCard } from '../engine/duel';
import { sfx } from './sfx';
import type { DuelState, IntentKind } from '../engine/types';

export type Weapon = 'fist' | 'sword' | 'spear' | 'needle' | 'saber';

interface Float {
  id: number;
  side: 'me' | 'foe';
  text: string;
  kind: 'dmg' | 'heal' | 'block';
  delay: number;
}

type StrikeKind = 'arc' | 'thrust' | 'burst' | 'needle' | 'spark';

/** 打在某一方身上的特效：揮砍的軌跡，或擋格的火花。 */
interface Strike {
  id: number;
  side: 'me' | 'foe';
  kind: StrikeKind;
  delay: number;
}

interface Fx {
  id: number;
  me?: 'lunge' | 'hit';
  foe?: 'lunge' | 'hit';
  floats: Float[];
  strikes: Strike[];
  /** 高光時刻：舞台閃一下、震一下，跳出大字。 */
  highlight?: { text: string; tone: 'red' | 'gold' };
}

/** 這一回合到目前為止打了多少、高光喊過了沒（一氣呵成每回合最多一次）。 */
interface RoundTally {
  round: number;
  dmg: number;
  combo: boolean;
}

/** 高光的大字在打中之後才跳出來。 */
const HIGHLIGHT_DELAY = 220;

/** 一招打掉這麼多（或對手氣血的這個比例）以上，算重擊。 */
const BIG_HIT = 15;
const BIG_HIT_RATIO = 0.25;
/** 一回合三招以上、累積這麼多（或這個比例）以上，算一氣呵成。 */
const COMBO_DMG = 22;
const COMBO_RATIO = 0.3;
/** 打倒對手時剩這個比例以下的氣血，算險勝。 */
const CLOSE_CALL = 0.2;

const SLASH: Record<Weapon, StrikeKind> = { sword: 'arc', saber: 'arc', spear: 'thrust', fist: 'burst', needle: 'needle' };
/** 連擊時每一下的間隔。 */
const HIT_GAP = 170;

const POSE: Partial<Record<IntentKind, string>> = {
  attack: 'pose-raise',
  combo: 'pose-raise',
  feint: 'pose-raise',
  drain: 'pose-raise',
  curse: 'pose-raise',
  guard: 'pose-guard',
  charge: 'pose-charge',
  enrage: 'pose-charge',
  heal: 'pose-rest',
};

let floatId = 0;

/** 比較出招前後的差異，決定這一下要播什麼動作。 */
function diff(prev: DuelState, d: DuelState, weapon: Weapon, tally: RoundTally): Fx | undefined {
  const foeLoss = prev.foe.hp - d.foe.hp;
  const meLoss = prev.me.hp - d.me.hp;
  const meGain = d.me.hp - prev.me.hp;
  const blockGain = d.me.block - prev.me.block;
  const foeBlockLost = prev.foe.block - d.foe.block;
  // 出牌會讓「已出的牌」變多；其他的變化都是結束回合（對手出手、內傷發作）
  const roundEnded = d.me.played.length <= prev.me.played.length;
  const fx: Fx = { id: ++floatId, floats: [], strikes: [] };
  const float = (side: Float['side'], text: string, kind: Float['kind'], delay = 0) =>
    fx.floats.push({ id: ++floatId, side, text, kind, delay });
  const strike = (side: Strike['side'], kind: StrikeKind, delay: number) => fx.strikes.push({ id: ++floatId, side, kind, delay });

  if (roundEnded) {
    // 對手出手：一下一下砍在你身上；有護體的那幾下爆出火花
    const blows = d.log.filter((l) => l.who === 'foe' && /你受了 \d+ 點傷/.test(l.text));
    const dodged = d.log.some((l) => l.who === 'foe' && l.text.includes('撲了個空'));
    let guard = prev.me.block;
    blows.forEach((l, i) => {
      const taken = Number(/受了 (\d+) 點/.exec(l.text)![1]);
      const delay = 120 + i * HIT_GAP;
      if (guard > 0) strike('me', 'spark', delay);
      if (taken > 0) strike('me', 'arc', delay);
      guard = taken > 0 ? 0 : guard;
    });
    if (blows.length > 0 || dodged) fx.foe = 'lunge';
    if (meLoss > 0) {
      fx.me = 'hit';
      float('me', `−${meLoss}`, 'dmg', 180);
    } else if (blows.length > 0) float('me', '格', 'block', 180);
    if (dodged) float('me', '閃', 'block', 180);
    if ((d.foeCrit ?? 0) > (prev.foeCrit ?? 0)) float('me', '要害', 'dmg', 420);
    // 內傷發作、伏招反擊
    if (foeLoss > 0) {
      fx.foe = fx.foe ?? 'hit';
      float('foe', `−${foeLoss}`, 'dmg', meLoss > 0 ? 450 : 0);
    }
    // 高光：耗死對手、伏招閃掉、全部擋下
    if (d.over === 'win' && !prev.over) fx.highlight = { text: '內傷發作', tone: 'red' };
    else if (!d.over && dodged) fx.highlight = { text: '閃得漂亮', tone: 'gold' };
    else if (!d.over && blows.length > 0 && meLoss === 0) fx.highlight = { text: '滴水不漏', tone: 'gold' };
  } else {
    if (foeLoss > 0 || foeBlockLost > 0) {
      // 你出招：多段的牌砍好幾下；砍在護體上的爆火花
      const last = d.me.played[d.me.played.length - 1];
      const hits = Math.min(5, (last && getCard(last).hits) || 1);
      for (let i = 0; i < hits; i++) {
        const delay = 120 + i * HIT_GAP;
        if (foeBlockLost > 0 && (i === 0 || foeLoss === 0)) strike('foe', 'spark', delay);
        if (foeLoss > 0) strike('foe', SLASH[weapon], delay);
      }
      fx.me = 'lunge';
      if (foeLoss > 0) {
        fx.foe = 'hit';
        float('foe', `−${foeLoss}`, 'dmg', 150);
      } else float('foe', '格', 'block', 150);
    }
    if (meLoss > 0) {
      fx.me = 'hit';
      float('me', `−${meLoss}`, 'dmg', 150);
    }
    if (meGain > 0) float('me', `+${meGain}`, 'heal');
    if (blockGain > 0) float('me', `護 ${blockGain}`, 'block');

    // 高光：最後一擊、一招重擊、一回合連出好幾招
    if (foeLoss > 0) tally.dmg += foeLoss;
    const last = d.me.played[d.me.played.length - 1];
    const hits = (last && getCard(last).hits) || 1;
    const attacks = d.me.played.filter((id) => getCard(id).kind === 'attack').length;
    // 打中部位：要害是高光，手腕、膝彎飄一個小字
    const spot = d.lastSpot && d.lastSpot.seq !== prev.lastSpot?.seq ? d.lastSpot : undefined;
    if (spot && spot.kind !== 'crit') float('foe', spot.name, 'block', 320);
    if (d.over === 'win' && !prev.over) {
      fx.highlight = d.me.hp <= d.me.max * CLOSE_CALL ? { text: '險勝', tone: 'gold' } : { text: spot?.kind === 'crit' ? `一擊封喉` : '致命一擊', tone: 'red' };
    } else if (spot?.kind === 'crit') {
      fx.highlight = { text: `爆擊・${spot.name}`, tone: 'red' };
    } else if (foeLoss >= Math.max(BIG_HIT, d.foe.max * BIG_HIT_RATIO)) {
      fx.highlight = { text: hits > 1 ? '連環' : '重擊', tone: 'red' };
    } else if (!tally.combo && attacks >= 3 && foeLoss > 0 && tally.dmg >= Math.max(COMBO_DMG, d.foe.max * COMBO_RATIO)) {
      tally.combo = true;
      fx.highlight = { text: '一氣呵成', tone: 'gold' };
    }
  }
  return fx.me || fx.foe || fx.floats.length > 0 || fx.highlight ? fx : undefined;
}

export function DuelStage({ d, weapon }: { d: DuelState; weapon: Weapon }) {
  const prev = useRef(d);
  const tally = useRef<RoundTally>({ round: d.round, dmg: 0, combo: false });
  const [fx, setFx] = useState<Fx | undefined>();

  useEffect(() => {
    const p = prev.current;
    prev.current = d;
    if (p === d) return;
    // 新的一回合：重新累計
    if (tally.current.round !== d.round) tally.current = { round: d.round, dmg: 0, combo: false };
    const next = diff(p, d, weapon, tally.current);
    if (next) {
      setFx(next);
      playSounds(next);
    }
  }, [d, weapon]);

  const meDown = d.over === 'lose' || d.over === 'yield';
  const foeDown = d.over === 'win';
  // 看不清對手意圖的時候，也看不出他的架勢
  const pose = d.over || !d.clear ? '' : POSE[d.foe.intent.kind] ?? '';

  return (
    // 有高光時換 key 重掛舞台，讓震動與閃光重播
    <div key={fx?.highlight ? fx.id : 'stage'} className={`duel-stage ${fx?.highlight ? 'stage-hl' : ''}`} aria-hidden="true">
      <div className="stage-ground" />
      {fx?.highlight && (
        <>
          <div className="stage-flash" />
          <div className={`stage-highlight tone-${fx.highlight.tone}`}>{fx.highlight.text}</div>
        </>
      )}
      <Figure
        side="me"
        weapon={weapon}
        anim={fx?.me}
        animKey={fx?.id}
        down={meDown}
        block={d.me.block > 0}
        floats={fx?.floats.filter((f) => f.side === 'me') ?? []}
        strikes={fx?.strikes.filter((x) => x.side === 'me') ?? []}
      />
      <Figure
        side="foe"
        weapon="saber"
        pose={pose}
        anim={fx?.foe}
        animKey={fx?.id}
        down={foeDown}
        block={d.foe.block > 0}
        big={d.lethal}
        floats={fx?.floats.filter((f) => f.side === 'foe') ?? []}
        strikes={fx?.strikes.filter((x) => x.side === 'foe') ?? []}
      />
    </div>
  );
}

const STRIKE_SOUND: Record<Exclude<StrikeKind, 'spark'>, () => void> = {
  arc: sfx.slash,
  thrust: sfx.thrust,
  burst: sfx.punch,
  needle: sfx.needle,
};

/** 照特效的時間點配音：兵器聲、受擊聲、擋格聲；回血、護體各一聲。 */
function playSounds(fx: Fx): void {
  const later = (ms: number, fn: () => void) => (ms > 0 ? setTimeout(fn, ms) : fn());
  for (const s of fx.strikes) {
    if (s.kind === 'spark') later(s.delay, sfx.parry);
    else {
      later(s.delay, STRIKE_SOUND[s.kind]);
      later(s.delay + 50, sfx.hit);
    }
  }
  const struck = fx.strikes.some((s) => s.kind !== 'spark');
  // 內傷發作、伏招反擊這類沒有揮砍的傷害
  if (!struck && fx.floats.some((f) => f.kind === 'dmg')) later(fx.floats.find((f) => f.kind === 'dmg')!.delay, sfx.hit);
  if (fx.floats.some((f) => f.kind === 'heal')) sfx.heal();
  if (fx.floats.some((f) => f.kind === 'block' && f.text.startsWith('護'))) sfx.guard();
  if (fx.highlight) later(HIGHLIGHT_DELAY, sfx.highlight);
}

/** 火花往八個方向飛。 */
const SPARK_ANGLES = [-160, -125, -95, -60, 150, 120, 175, -175];

function StrikeFx({ s }: { s: Strike }) {
  const style = { '--d': `${s.delay}ms` } as React.CSSProperties;
  if (s.kind === 'spark') {
    return (
      <span className="spark" style={style}>
        {SPARK_ANGLES.map((a, i) => (
          <i key={i} style={{ '--a': `${a}deg`, '--len': `${18 + (i % 3) * 8}px` } as React.CSSProperties} />
        ))}
      </span>
    );
  }
  return (
    <svg className={`strike strike-${s.kind}`} style={style} viewBox="0 0 120 120">
      {s.kind === 'arc' && (
        <>
          <path d="M12 104 Q22 30 108 12" pathLength={1} />
          <path className="strike-core" d="M12 104 Q22 30 108 12" pathLength={1} />
        </>
      )}
      {s.kind === 'thrust' && (
        <>
          <path d="M-20 60 L118 54" pathLength={1} />
          <path className="strike-core" d="M-20 60 L118 54" pathLength={1} />
        </>
      )}
      {s.kind === 'burst' && (
        <>
          <circle cx="58" cy="56" r="20" pathLength={1} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d="M58 30 L58 18" pathLength={1} transform={`rotate(${a} 58 56)`} />
          ))}
        </>
      )}
      {s.kind === 'needle' &&
        [40, 56, 72].map((y, i) => <path key={y} d={`M-10 ${y - i * 4} L100 ${y}`} pathLength={1} className="strike-core" />)}
    </svg>
  );
}

function Figure(p: {
  side: 'me' | 'foe';
  weapon: Weapon;
  pose?: string;
  anim?: 'lunge' | 'hit';
  animKey?: number;
  down: boolean;
  block: boolean;
  big?: boolean;
  floats: Float[];
  strikes: Strike[];
}) {
  return (
    <div className={`fig-slot ${p.side} ${p.big ? 'big' : ''}`}>
      {p.strikes.length > 0 && (
        <div className="fx-layer">
          {p.strikes.map((s) => (
            <StrikeFx key={s.id} s={s} />
          ))}
        </div>
      )}
      {p.floats.map((f) => (
        <span key={f.id} className={`stage-float float-${f.kind}`} style={{ animationDelay: `${f.delay}ms` }}>
          {f.text}
        </span>
      ))}
      {/* key 換了就重播動畫 */}
      <div key={p.animKey} className={`fig-anim ${p.anim ?? ''} ${p.down ? 'down' : ''}`}>
        {p.block && <span className="fig-aura" />}
        <div className="fig-flip">
          <InkFigure weapon={p.weapon} pose={p.pose ?? ''} side={p.side} />
        </div>
      </div>
    </div>
  );
}

/** 水墨剪影：頭、髮髻、長袍、腰帶、雙腿、持兵器的手。面向右；對手用 CSS 翻過來。 */
function InkFigure({ weapon, pose, side }: { weapon: Weapon; pose: string; side: 'me' | 'foe' }) {
  return (
    <svg className={`ink-fig ${pose}`} viewBox="0 0 90 120" width="112" height="150">
      <g fill="currentColor">
        {/* 後手 */}
        <path d="M33 36 Q24 46 21 56 L25 58 Q29 48 37 41 Z" opacity="0.85" />
        {/* 頭與髮髻 */}
        <circle cx="41" cy="20" r="9" />
        <circle cx="38" cy="9" r="4" />
        {/* 長袍：下擺被風吹開 */}
        <path d="M31 31 Q41 26 51 31 L57 76 Q50 81 43 78 Q34 82 22 79 Z" />
        {/* 雙腿 */}
        <path d="M30 78 L25 112 L32 113 L40 84 L47 113 L54 112 L49 78 Z" />
        {/* 腰帶 */}
        <rect x="30" y="47" width="23" height="4" rx="1" className={`sash sash-${side}`} />
        {/* 前手與兵器：一起轉 */}
        <g className="arm">
          <path d="M47 34 L63 47 L60 51 L44 40 Z" />
          <Weapon kind={weapon} />
        </g>
      </g>
    </svg>
  );
}

function Weapon({ kind }: { kind: Weapon }) {
  switch (kind) {
    case 'sword':
      return (
        <g>
          <rect x="58" y="46" width="7" height="2.5" rx="1" />
          <path d="M63 47 L88 26 L89 27.5 L64 49 Z" />
        </g>
      );
    case 'spear':
      return (
        <g>
          <path d="M38 62 L86 18 L87.5 19.5 L39.5 63.5 Z" />
          <path d="M84 16 L90 12 L88 20 Z" />
          <circle cx="83" cy="21" r="2" className="tassel" />
        </g>
      );
    case 'saber':
      return <path d="M61 48 Q74 40 84 26 Q80 40 64 52 Z" />;
    case 'needle':
      return (
        <g strokeWidth="1.2" stroke="currentColor">
          <line x1="64" y1="47" x2="74" y2="42" />
          <line x1="64" y1="49" x2="75" y2="47" />
          <line x1="64" y1="51" x2="74" y2="52" />
        </g>
      );
    default:
      return <circle cx="63" cy="49" r="4.5" />;
  }
}
