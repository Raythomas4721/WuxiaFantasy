// 過招舞台：兩個水墨剪影小人。出招衝上前、受擊閃紅後退、傷害數字飄起來；
// 對手擺出的架勢預告下一招。全部由前後兩個 DuelState 的差異推算，不改引擎。

import { useEffect, useRef, useState } from 'react';
import type { DuelState, IntentKind } from '../engine/types';

export type Weapon = 'fist' | 'sword' | 'spear' | 'needle' | 'saber';

interface Float {
  id: number;
  side: 'me' | 'foe';
  text: string;
  kind: 'dmg' | 'heal' | 'block';
  delay: number;
}

interface Fx {
  id: number;
  me?: 'lunge' | 'hit';
  foe?: 'lunge' | 'hit';
  floats: Float[];
}

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
function diff(prev: DuelState, d: DuelState): Fx | undefined {
  const foeLoss = prev.foe.hp - d.foe.hp;
  const meLoss = prev.me.hp - d.me.hp;
  const meGain = d.me.hp - prev.me.hp;
  const blockGain = d.me.block - prev.me.block;
  const roundEnded = d.round !== prev.round || (d.over && !prev.over && meLoss > 0);
  const fx: Fx = { id: ++floatId, floats: [] };
  const float = (side: Float['side'], text: string, kind: Float['kind'], delay = 0) =>
    fx.floats.push({ id: ++floatId, side, text, kind, delay });

  if (roundEnded) {
    // 對手出手：他衝上來，你挨打
    if (meLoss > 0) {
      fx.foe = 'lunge';
      fx.me = 'hit';
      float('me', `−${meLoss}`, 'dmg', 180);
    }
    // 內傷發作、伏招反擊
    if (foeLoss > 0) {
      fx.foe = fx.foe ?? 'hit';
      float('foe', `−${foeLoss}`, 'dmg', meLoss > 0 ? 450 : 0);
    }
  } else {
    if (foeLoss > 0) {
      fx.me = 'lunge';
      fx.foe = 'hit';
      float('foe', `−${foeLoss}`, 'dmg', 150);
    }
    if (meLoss > 0) {
      fx.me = 'hit';
      float('me', `−${meLoss}`, 'dmg', 150);
    }
    if (meGain > 0) float('me', `+${meGain}`, 'heal');
    if (blockGain > 0) float('me', `護 ${blockGain}`, 'block');
  }
  return fx.me || fx.foe || fx.floats.length > 0 ? fx : undefined;
}

export function DuelStage({ d, weapon }: { d: DuelState; weapon: Weapon }) {
  const prev = useRef(d);
  const [fx, setFx] = useState<Fx | undefined>();

  useEffect(() => {
    const p = prev.current;
    prev.current = d;
    if (p === d) return;
    const next = diff(p, d);
    if (next) setFx(next);
  }, [d]);

  const meDown = d.over === 'lose' || d.over === 'yield';
  const foeDown = d.over === 'win';
  // 看不清對手意圖的時候，也看不出他的架勢
  const pose = d.over || !d.clear ? '' : POSE[d.foe.intent.kind] ?? '';

  return (
    <div className="duel-stage" aria-hidden="true">
      <div className="stage-ground" />
      <Figure
        side="me"
        weapon={weapon}
        anim={fx?.me}
        animKey={fx?.id}
        down={meDown}
        block={d.me.block > 0}
        floats={fx?.floats.filter((f) => f.side === 'me') ?? []}
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
      />
    </div>
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
}) {
  return (
    <div className={`fig-slot ${p.side} ${p.big ? 'big' : ''}`}>
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
