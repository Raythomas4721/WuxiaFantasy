import { useEffect, useRef, useState } from 'react';
import { CONTENT } from '../content';
import { LEVEL_NAMES } from '../engine/describe';
import { DUEL, canPlay, cardSkill, cardText, getCard, intentText, mainSkill, previewRound, resolvedEffect } from '../engine/duel';
import { DuelStage, type Weapon } from './DuelStage';
import { setSfxEnabled, sfx, sfxEnabled } from './sfx';
import { Tips, type TipDef } from './Tips';
import { duelEndRound, duelPlay, duelYield, finishDuel } from '../engine/game';
import type { CardDef, CardKind, DuelState, GameState, IntentKind, TrapTrigger } from '../engine/types';

/** 小人手上拿什麼：看主修的武學。 */
const WEAPON: Record<string, Weapon> = {
  hanjiang: 'sword', shibi: 'sword', qinghen: 'sword', shoucheng: 'spear', yeyu: 'needle',
};

const KIND_LABEL: Record<CardKind, string> = { attack: '攻', guard: '守', skill: '技', trap: '伏', curse: '傷' };

interface Props {
  state: GameState;
  act: (fn: () => GameState) => void;
}

/** 過招：上方對手與意圖，中間戰況，下方你的狀態與手牌。 */
export function DuelView({ state, act }: Props) {
  const d = state.duel!;
  const intent = intentText(d);
  const press = useLongPress(d.me.hand.join('|'));
  const [pile, setPile] = useState<Pile>();

  return (
    <article className="panel duel">
      <header className="duel-head">
        <span className="duel-round">{d.lethal ? `生死之戰・第 ${d.round} 回合` : `第 ${d.round}／${DUEL.maxRounds} 回合`}</span>
        <SoundToggle />
      </header>

      <section className="duel-side foe">
        <div className="duel-name">
          <strong>{d.name}</strong>
          <span className="muted small">{LEVEL_NAMES[d.level]}</span>
        </div>
        <HpBar side={d.foe} />
        <Statuses block={d.foe.block} exposed={d.foe.exposed} bleed={d.foe.bleed} charge={d.foe.charge} rage={d.foe.rage} phase2={d.foe.phase2} />
        {d.foe.traps.length > 0 && (
          <ul className="duel-traps foe-traps">
            {d.foe.traps.map((t, i) => {
              const def = CONTENT.foeTraps[t.id];
              if (t.used) return <li key={i} className="used">【{def.name}】已發動</li>;
              return d.seeTraps ? (
                <li key={i} title={def.hint}>暗招【{def.name}】：{def.hint}</li>
              ) : (
                <li key={i}>暗招 ？　他似乎藏著後手</li>
              );
            })}
          </ul>
        )}
        {!d.over && <IntentBadge d={d} detail={intent.detail} />}
      </section>

      <DuelStage d={d} weapon={WEAPON[mainSkill(state).skill ?? ''] ?? 'fist'} />

      <DuelLog d={d} />

      <section className="duel-side me">
        <div className="duel-name">
          <strong>你</strong>
          <span className="duel-energy" aria-label={`內力 ${d.me.energy}`}>
            內力
            {Array.from({ length: Math.max(d.me.energy, d.me.energyMax ?? DUEL.energy) }, (_, i) => (
              <i key={i} className={`orb ${i < d.me.energy ? 'on' : ''}`} />
            ))}
          </span>
        </div>
        <HpBar side={d.me} />
        <Statuses block={d.me.block} exposed={d.me.exposed} boost={d.me.boost} />
        {d.me.passive && d.me.passive.names.length > 0 && (
          <ul className="duel-passives">
            {d.me.passive.names.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        {d.me.traps.length > 0 && (
          <ul className="duel-traps my-traps">
            {d.me.traps.map((id, i) => {
              const c = getCard(id);
              return <li key={i} title={cardText(c)}>伏招【{c.name}】：{cardText(c)}</li>;
            })}
          </ul>
        )}
      </section>

      {d.over ? (
        <DuelOver d={d} prevBest={Math.max(0, ...(state.duels ?? []).map((r) => r.bestHit))} first={!state.duels?.length} onFinish={() => act(() => finishDuel(state))} />
      ) : (
        <>
          <IntentMini d={d} />
          <Tips tips={duelTips(d)} />
          {press.peek !== undefined && d.me.hand[press.peek] && (
            <CardPeek d={d} index={press.peek} onClose={press.close} />
          )}
          <div
            className="duel-hand"
            {...press.handlers}
            onClickCapture={(ev) => {
              if (press.swallow(ev)) return;
              flyCard(ev.target as HTMLElement);
            }}
          >
            {d.me.hand.map((id, i) => (
              <HandCard key={`${id}-${i}`} d={d} card={getCard(id)} playable={canPlay(d, i)} onPlay={() => act(() => duelPlay(state, i))} />
            ))}
          </div>
          {pile && <PileView d={d} pile={pile} onPick={setPile} />}
          <RoundPreviewLine d={d} />
          <div className="duel-actions">
            <span className="pile-buttons small">
              {(['deck', 'discard', 'gone'] as const).map((p) => (
                <button
                  key={p}
                  className={`pile-btn ${pile === p ? 'on' : ''}`}
                  onClick={() => setPile(pile === p ? undefined : p)}
                  aria-pressed={pile === p}
                >
                  {PILE_LABEL[p]} {pileCards(d, p).length}
                </button>
              ))}
              <span className="muted">手牌 {d.me.hand.length}／{d.me.handMax ?? DUEL.handMax}</span>
            </span>
            <button
              className="btn btn-ghost btn-small"
              title={d.lethal ? '保住性命，但傷得更重' : undefined}
              onClick={() => act(() => duelYield(state))}
            >
              {d.lethal ? '突圍' : '認輸'}
            </button>
            <button className="btn btn-primary" onClick={() => act(() => duelEndRound(state))}>
              結束回合
            </button>
          </div>
        </>
      )}
    </article>
  );
}

const STRIKES: IntentKind[] = ['attack', 'combo', 'feint', 'drain', 'curse'];

// ---------- 回合預告、看牌堆 ----------

/** 按「結束回合」之前，先告訴你這樣結束會受多少傷。 */
function RoundPreviewLine({ d }: { d: DuelState }) {
  const p = previewRound(d);
  const change = p.mayChange ? '（他有時會臨時變招，實際可能不一樣）' : '';
  let text: string;
  let tone = '';
  if (p.hidden) {
    text = '看不透他這一手，不知道結束回合會受多少傷。';
  } else if (p.verdict) {
    text = p.verdict === 'win' ? `最後一回合：照現在的氣血比例，結束時算你贏${p.taken > 0 ? `（還會受 ${p.taken} 傷）` : ''}。` : '最後一回合：照現在的氣血比例，結束時算你輸，還得再打一點。';
    tone = p.verdict === 'win' ? 'safe' : 'danger';
  } else if (p.down) {
    text = `這樣結束回合，你會被打倒（受 ${p.taken} 傷）！先擋一擋。`;
    tone = 'danger';
  } else if (p.taken === 0) {
    text = STRIKES.includes(d.foe.intent.kind) ? '這樣結束回合，他這一下傷不到你。' : '他這回合不出手，放心進攻。';
    tone = 'safe';
  } else {
    text = `這樣結束回合，預計受 ${p.taken} 傷${d.me.block > 0 ? `（護體 ${d.me.block} 已算進去）` : ''}，剩 ${Math.max(0, d.me.hp - p.taken)}／${d.me.max}。`;
    tone = p.taken >= d.me.hp * 0.5 ? 'warn' : '';
  }
  return (
    <p className={`round-preview ${tone}`} aria-live="polite">
      {text}
      {!p.hidden && !p.verdict && change && <span className="muted">{change}</span>}
    </p>
  );
}

type Pile = 'deck' | 'discard' | 'gone';
const PILE_LABEL: Record<Pile, string> = { deck: '抽牌堆', discard: '棄牌', gone: '已移出' };
const PILE_NOTE: Record<Pile, string> = {
  deck: '還沒抽到的牌。順序是洗過的，這裡照名稱排。抽完了會把棄牌洗回來。',
  discard: '打過的牌。抽牌堆抽完時，會洗一洗變成新的抽牌堆。',
  gone: '「用完移出」的牌，這場不會再回來；下一場又會在牌組裡。',
};

function pileCards(d: DuelState, p: Pile): string[] {
  return p === 'deck' ? d.me.deck : p === 'discard' ? d.me.discard : d.me.gone ?? [];
}

/** 牌堆裡有哪些牌：同名的併在一起算張數。 */
function PileView({ d, pile, onPick }: { d: DuelState; pile: Pile; onPick: (p?: Pile) => void }) {
  const counts = new Map<string, number>();
  for (const id of pileCards(d, pile)) counts.set(id, (counts.get(id) ?? 0) + 1);
  const rows = [...counts].sort(([a], [b]) => getCard(a).name.localeCompare(getCard(b).name, 'zh-Hant'));
  return (
    <section className="pile-view" aria-label={PILE_LABEL[pile]}>
      <header className="pile-head">
        <strong>{PILE_LABEL[pile]}</strong>
        <span className="muted small">{PILE_NOTE[pile]}</span>
        <button className="tip-off" onClick={() => onPick(undefined)}>
          收起
        </button>
      </header>
      {rows.length === 0 ? (
        <p className="muted small">沒有牌。</p>
      ) : (
        <ul>
          {rows.map(([id, n]) => {
            const c = getCard(id);
            return (
              <li key={id} className={`pile-row kind-${c.kind}`}>
                <span className="pile-name">
                  <span className="card-cost">{c.cost}</span>
                  {c.name}
                  {n > 1 && <span className="pile-count">×{n}</span>}
                </span>
                <span className="pile-text">{cardText(c)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** 過招的指點：由上往下，挑第一則符合、還沒看過的。 */
function duelTips(d: DuelState): TipDef[] {
  const hand = d.me.hand.map((id) => getCard(id));
  const strike = STRIKES.includes(d.foe.intent.kind);
  const combo = hand.find((c) => c.after && hand.some((o) => o !== c && o.tag && c.after!.tags.includes(o.tag)));
  return [
    {
      id: 'duel-lethal',
      when: d.lethal,
      text: '這是生死之戰：輸了，這一生就到這裡。真的撐不住就按「突圍」，保住性命，但傷得更重。',
    },
    {
      id: 'duel-basics',
      when: true,
      text: '點手牌出招。牌左上角的數字是要花的內力，也就是「你」旁邊發光的珠子。內力用完就按「結束回合」，換對手出手。',
    },
    {
      id: 'duel-hints',
      when: d.me.hand.some((id, i) => canPlay(d, i) && cardHint(d, getCard(id), resolvedEffect(d, getCard(id)))),
      text: '有些牌上方會亮起小標籤：「擋這招」「伏這招」「連招」「破防」「致勝」……代表這張牌現在出，剛好對得上局面。拿不定主意時，先出亮著的牌。',
    },
    {
      id: 'duel-longpress',
      when: TOUCH && d.me.hand.length > 0,
      text: '手機上看不清楚一張牌在幹嘛？長按它，會跳出完整說明和「為什麼現在適合出」，放開不會打出去。',
    },
    {
      id: 'duel-crit',
      when: d.lastSpot !== undefined,
      text: '出招有機會打中特定部位：打中要害是「爆擊」，傷害 ×1.6；打中手腕，他下一擊會變輕；打中膝彎，他會露出破綻。對手有破綻時、用暗器時，比較容易打中要害。',
    },
    {
      id: 'duel-intent',
      when: d.clear && strike,
      text: '對手那一格的印章是他的下一招。「攻 12」代表你按「結束回合」之後，他會打你 12 點。',
    },
    {
      id: 'duel-guard',
      when: strike && hand.some((c) => c.kind === 'guard'),
      text: '對手要出手了——先出〈守〉牌疊護體，他的攻擊會先打在護體上。護體到回合結束就散了。',
    },
    {
      id: 'duel-trap',
      when: strike && hand.some((c) => c.kind === 'trap'),
      text: '「伏」是伏招：先打出去埋著，等對手出手時自動發動，例如把他這一擊減半。',
    },
    {
      id: 'duel-unclear',
      when: !d.clear,
      text: '「看不透」：你還看不清這個對手要做什麼，只能從他的動作猜。悟性越高，越看得清。',
    },
    {
      id: 'duel-combo',
      when: Boolean(combo),
      text: combo ? `「${combo.name}」接在〈${combo.after!.tags.join('、')}〉之後出會更強：先出那一路的牌，再出它。` : '',
    },
    {
      id: 'duel-foe-block',
      when: d.foe.block > 0,
      text: '對手有護體：你的攻擊要先打掉護體，才傷得到他。有的招式能破防，或直接無視護體。',
    },
    {
      id: 'duel-yield',
      when: !d.lethal && d.me.hp < d.me.max * 0.4,
      text: '撐不住可以「認輸」：比試輸了只是受傷，不會死。',
    },
  ];
}

function SoundToggle() {
  const [on, setOn] = useState(sfxEnabled());
  return (
    <button
      className="sound-toggle"
      aria-pressed={on}
      title={on ? '關掉音效' : '打開音效'}
      onClick={() => {
        setSfxEnabled(!on);
        setOn(!on);
        if (!on) sfx.guard();
      }}
    >
      {on ? '音效：開' : '音效：關'}
    </button>
  );
}

/** 對手的意圖：印章字 + 大數字，一眼看懂。 */
const SEAL: Record<IntentKind, string> = {
  attack: '攻', combo: '連', feint: '虛', guard: '守', charge: '蓄', drain: '穴', enrage: '狠', heal: '氣', curse: '毒',
};
const INTENT_NAME: Record<IntentKind, string> = {
  attack: '出手', combo: '連擊', feint: '虛招', guard: '守勢', charge: '蓄勢', drain: '點穴', enrage: '發狠', heal: '回氣', curse: '下毒',
};

function IntentBadge({ d, detail }: { d: DuelState; detail: string }) {
  const it = d.foe.intent;
  if (!d.clear) {
    return (
      <div className="duel-intent intent-unknown">
        <span className="intent-seal">？</span>
        <span className="intent-body">
          <span className="intent-name">看不透</span>
          <span className="intent-detail">{detail}</span>
        </span>
      </div>
    );
  }
  const strike = ['attack', 'combo', 'feint', 'drain', 'curse'].includes(it.kind);
  const per = it.value + (strike ? d.foe.charge + (d.foe.rage ?? 0) : 0);
  const big = strike ? `${per}${it.hits ? `×${it.hits}` : ''}` : it.kind === 'guard' ? `${it.value}` : `+${it.value}`;
  return (
    <div className={`duel-intent intent-${it.kind}`}>
      <span className="intent-seal">{SEAL[it.kind]}</span>
      <span className="intent-num">{big}</span>
      <span className="intent-body">
        <span className="intent-name">{INTENT_NAME[it.kind]}</span>
        <span className="intent-detail">{detail}</span>
      </span>
    </div>
  );
}

/** 手機上手牌離對手很遠：在手牌正上方放一條精簡的意圖列（桌機用 CSS 藏起來）。 */
function IntentMini({ d }: { d: DuelState }) {
  const it = d.foe.intent;
  const strike = ['attack', 'combo', 'feint', 'drain', 'curse'].includes(it.kind);
  const per = it.value + (strike ? d.foe.charge + (d.foe.rage ?? 0) : 0);
  const big = !d.clear ? '' : strike ? `${per}${it.hits ? `×${it.hits}` : ''}` : it.kind === 'guard' ? `${it.value}` : `+${it.value}`;
  return (
    <div className={`intent-mini intent-${d.clear ? it.kind : 'unknown'}`} aria-hidden="true">
      <span className="intent-seal">{d.clear ? SEAL[it.kind] : '？'}</span>
      {big && <span className="intent-num">{big}</span>}
      <span className="intent-name">{d.clear ? INTENT_NAME[it.kind] : '看不透'}</span>
      <span className="intent-mini-foe">
        {d.name}　{Math.max(0, d.foe.hp)}／{d.foe.max}
        {d.foe.block > 0 && `・護 ${d.foe.block}`}
      </span>
    </div>
  );
}

/** 戰況：預設只看最近三行。 */
const LOG_SHOWN = 3;

function DuelLog({ d }: { d: DuelState }) {
  const [all, setAll] = useState(false);
  const lines = all ? d.log : d.log.slice(-LOG_SHOWN);
  const hidden = d.log.length - lines.length;
  return (
    <div className="duel-log-wrap">
      <ol className="duel-log" aria-live="polite">
        {lines.map((l, i) => (
          <li key={d.log.length - lines.length + i} className={`log-${l.who}`}>{l.text}</li>
        ))}
      </ol>
      {(hidden > 0 || all) && d.log.length > LOG_SHOWN && (
        <button className="log-toggle" onClick={() => setAll(!all)}>
          {all ? '收起' : `看前面 ${hidden} 行`}
        </button>
      )}
    </div>
  );
}

/** 出牌：把點下去的牌複製一張，飛向舞台中央再消失。 */
function flyCard(target: HTMLElement): void {
  const card = target.closest('button.duel-card') as HTMLButtonElement | null;
  if (!card || card.disabled) return;
  sfx.card();
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const from = card.getBoundingClientRect();
  const stage = document.querySelector('.duel-stage')?.getBoundingClientRect();
  const clone = card.cloneNode(true) as HTMLElement;
  clone.classList.add('card-fly');
  Object.assign(clone.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  if (stage) {
    clone.style.setProperty('--dx', `${stage.left + stage.width / 2 - (from.left + from.width / 2)}px`);
    clone.style.setProperty('--dy', `${stage.top + stage.height / 2 - (from.top + from.height / 2)}px`);
  }
  document.body.appendChild(clone);
  const remove = () => clone.remove();
  clone.addEventListener('animationend', remove);
  setTimeout(remove, 800);
}

function HpBar({ side }: { side: { hp: number; max: number } }) {
  const pct = Math.max(0, Math.min(100, (side.hp / side.max) * 100));
  return (
    <div className="duel-hp">
      <div className="health-bar">
        <div className="health-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="small">
        氣血 {Math.max(0, side.hp)}／{side.max}
      </span>
    </div>
  );
}

function Statuses(p: {
  block: number; exposed: number; bleed?: number; charge?: number; rage?: number; phase2?: boolean; boost?: DuelState['me']['boost'];
}) {
  const tags: string[] = [];
  if (p.phase2) tags.push('換了打法');
  if (p.rage) tags.push(`狠勁 +${p.rage}`);
  if (p.block > 0) tags.push(`護體 ${p.block}`);
  if (p.exposed > 0) tags.push('破綻');
  if (p.bleed) tags.push(`內傷 ${p.bleed}`);
  if (p.charge) tags.push(`蓄勢 +${p.charge}`);
  if (p.boost) tags.push(`下一張${p.boost.tags.map((t) => `〈${t}〉`).join('')}${p.boost.mult ? `× ${p.boost.mult}` : `+${p.boost.dmg}`}`);
  if (tags.length === 0) return null;
  return (
    <ul className="duel-status">
      {tags.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** 一張牌的牌面：過招的手牌、戰後選牌、牌庫都用它。 */
export function CardFace({ card, disabled, onClick, note, hint, className = '' }: {
  hint?: Hint;
  card: CardDef;
  disabled?: boolean;
  onClick?: () => void;
  note?: string;
  className?: string;
}) {
  const skill = cardSkill(card.id);
  return (
    <button
      className={`duel-card kind-${card.kind} rarity-${card.rarity ?? 'common'} ${hint ? `hint hint-${hint.kind}` : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={hint?.why}
    >
      {hint && <span className="card-hint">{hint.label}</span>}
      <span className="card-top">
        <span className="card-cost">{card.cost}</span>
        <span className="card-name">{card.name}</span>
        <span className="card-kind">
          {KIND_LABEL[card.kind]}
          {card.tag && `〈${card.tag}〉`}
        </span>
      </span>
      <span className="card-text">{cardText(card)}</span>
      {(skill || card.rarity) && (
        <span className="card-skill">
          {skill && CONTENT.skills[skill].name}
          {card.rarity && <span className={`card-rarity ${card.rarity}`}>{card.rarity === 'rare' ? '絕' : '良'}</span>}
        </span>
      )}
      {note && <span className="card-boost">{note}</span>}
    </button>
  );
}

/** 手牌提示：這張牌現在出，剛好對得上局面。不改難度，只是讓人一眼看出該出什麼。 */
interface Hint {
  kind: 'kill' | 'combo' | 'break' | 'counter' | 'defend' | 'setup';
  label: string;
  why: string;
}

const TRAP_FITS: Record<TrapTrigger, IntentKind[]> = {
  foeAttack: ['attack', 'combo', 'feint', 'drain', 'curse'],
  foeFeint: ['feint'],
  foeGuard: ['guard'],
  foeCharge: ['charge'],
};

function cardHint(d: DuelState, card: CardDef, e: ReturnType<typeof resolvedEffect>): Hint | undefined {
  const it = d.foe.intent;
  const prev = d.me.played.length > 0 ? getCard(d.me.played[d.me.played.length - 1]) : undefined;
  // 這一招就能打倒對手
  if (card.kind === 'attack' && e.dmg) {
    const raw = e.dmg * (e.hits ?? 1) * (d.foe.exposed > 0 ? DUEL.exposeMult : 1);
    const dealt = e.pierce || e.breakGuard ? raw : raw - d.foe.block;
    if (dealt >= d.foe.hp) return { kind: 'kill', label: '致勝', why: '這一招打得倒他' };
  }
  if (card.after && prev?.tag && card.after.tags.includes(prev.tag)) {
    return { kind: 'combo', label: '連招', why: `接在〈${prev.tag}〉之後，這張有加成` };
  }
  if (d.foe.block > 0 && card.kind === 'attack' && (card.breakGuard || card.pierce)) {
    return { kind: 'break', label: '破防', why: '對手有護體，這張可以破防或無視護體' };
  }
  if (!d.clear) return undefined;
  if (card.vsIntent?.kinds.includes(it.kind)) return { kind: 'counter', label: '克制', why: '正好克制對手這一招' };
  const strike = TRAP_FITS.foeAttack.includes(it.kind);
  if (card.kind === 'trap' && card.trigger && TRAP_FITS[card.trigger].includes(it.kind) && d.me.traps.length < DUEL.trapSlots) {
    return { kind: 'defend', label: '伏這招', why: '先埋下伏招，對手這一招出手時自動發動' };
  }
  if (strike && card.kind === 'guard' && (e.block ?? 0) > 0 && d.me.block < it.value + d.foe.charge) {
    return { kind: 'defend', label: '擋這招', why: '對手要出手了，先疊護體' };
  }
  // 墊招：手上有接在這一路之後的牌，而且內力夠兩張一起出
  const follow = card.tag
    ? d.me.hand.map((id) => getCard(id)).find((o) => o !== card && o.after?.tags.includes(card.tag!) && card.cost + o.cost <= d.me.energy)
    : undefined;
  if (follow) return { kind: 'setup', label: '先出', why: `先出這張，再出「${follow.name}」有連招加成` };
  return undefined;
}

/** 手牌上的附註與提示：這回合的實際傷害、伏招滿了沒、現在適不適合出。 */
function handInfo(d: DuelState, card: CardDef, playable: boolean): { note?: string; hint?: Hint } {
  const e = resolvedEffect(d, card);
  const boosted = card.kind === 'attack' && e.dmg !== undefined && e.dmg !== card.dmg;
  const trapsFull = card.kind === 'trap' && d.me.traps.length >= DUEL.trapSlots;
  const note = boosted ? `這回合：傷害 ${e.dmg}` : trapsFull ? `伏招已滿（最多 ${DUEL.trapSlots} 張）` : undefined;
  return { note, hint: playable ? cardHint(d, card, e) : undefined };
}

function HandCard({ d, card, playable, onPlay }: { d: DuelState; card: CardDef; playable: boolean; onPlay: () => void }) {
  const { note, hint } = handInfo(d, card, playable);
  return <CardFace card={card} disabled={!playable} onClick={onPlay} note={note} hint={hint} />;
}

/** 觸控裝置（沒有滑鼠可以移上去看說明）。 */
const TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;
const LONG_PRESS_MS = 450;
/** 手指移動超過這麼多像素就當作在捲動，不算長按。 */
const PRESS_SLOP = 10;

/**
 * 手牌長按：按住不放一下子，就打開那張牌的說明，放開時不會出牌。
 * 只認觸控和觸控筆；滑鼠照舊用移上去的提示。手牌一變（出了牌、換回合）就關掉。
 */
function useLongPress(handKey: string) {
  const [peek, setPeek] = useState<number>();
  const timer = useRef<number>();
  const start = useRef<{ x: number; y: number }>();
  const fired = useRef(false);
  useEffect(() => setPeek(undefined), [handKey]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const cancel = () => {
    window.clearTimeout(timer.current);
    start.current = undefined;
  };
  const handlers = {
    onPointerDown(ev: React.PointerEvent<HTMLDivElement>) {
      if (ev.pointerType === 'mouse') return;
      const card = (ev.target as HTMLElement).closest('.duel-card');
      const index = card ? Array.from(ev.currentTarget.children).indexOf(card) : -1;
      if (index < 0) return;
      fired.current = false;
      start.current = { x: ev.clientX, y: ev.clientY };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        fired.current = true;
        navigator.vibrate?.(12);
        setPeek(index);
      }, LONG_PRESS_MS);
    },
    onPointerMove(ev: React.PointerEvent<HTMLDivElement>) {
      const s = start.current;
      if (s && Math.hypot(ev.clientX - s.x, ev.clientY - s.y) > PRESS_SLOP) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onContextMenu(ev: React.MouseEvent) {
      if (start.current || fired.current) ev.preventDefault();
    },
  };
  /** 長按之後放開的那一下 click 吞掉，不要出牌。 */
  const swallow = (ev: React.MouseEvent) => {
    if (!fired.current) return false;
    fired.current = false;
    ev.preventDefault();
    ev.stopPropagation();
    return true;
  };
  return { peek, close: () => setPeek(undefined), handlers, swallow };
}

/** 長按手牌跳出的說明：完整效果、這回合的實際數字、為什麼現在適合（或不能）出。 */
function CardPeek({ d, index, onClose }: { d: DuelState; index: number; onClose: () => void }) {
  const card = getCard(d.me.hand[index]);
  const playable = canPlay(d, index);
  const { note, hint } = handInfo(d, card, playable);
  const skill = cardSkill(card.id);
  const blocked = !playable && (card.cost > d.me.energy ? `內力不夠：要 ${card.cost}，你只剩 ${d.me.energy}` : '現在打不出去');
  return (
    <div className="card-peek" role="dialog" aria-label={`【${card.name}】說明`} onClick={onClose}>
      <div className="peek-head">
        <span className="card-cost">{card.cost}</span>
        <strong>{card.name}</strong>
        <span className="muted small">
          {KIND_LABEL[card.kind]}
          {card.tag && `〈${card.tag}〉`}
          {skill && `・${CONTENT.skills[skill].name}`}
        </span>
      </div>
      <p className="peek-text">{cardText(card)}</p>
      {note && <p className="peek-note">{note}</p>}
      {hint && (
        <p className={`peek-hint hint-${hint.kind}`}>
          <span className="peek-label">{hint.label}</span>
          {hint.why}
        </p>
      )}
      {blocked && <p className="peek-blocked">{blocked}</p>}
      {card.flavor && <p className="peek-flavor">{card.flavor.replace(/{foe}/g, d.name)}</p>}
      <span className="peek-close">點一下關閉</span>
    </div>
  );
}

/** 一般過招打完，看一眼結局就自動收招；生死之戰要自己按。 */
const AUTO_FINISH_MS = 2200;

function DuelOver({ d, prevBest, first, onFinish }: { d: DuelState; prevBest: number; first: boolean; onFinish: () => void }) {
  const finish = useRef(onFinish);
  finish.current = onFinish;
  useEffect(() => {
    if (d.over === 'win') sfx.win();
    else sfx.lose();
  }, [d.over]);
  useEffect(() => {
    if (d.lethal) return;
    const t = setTimeout(() => finish.current(), AUTO_FINISH_MS);
    return () => clearTimeout(t);
  }, [d.lethal]);
  const text = {
    win: `你勝過了${d.name}。`,
    lose: d.lethal ? `你倒在了${d.name}的面前。` : `你敗給了${d.name}。`,
    yield: d.lethal ? `你拚著一身傷，從${d.name}手下突圍而出。` : `你向${d.name}認輸了。`,
  }[d.over!];
  const st = d.stats;
  const low = st ? Math.max(0, Math.round((st.lowHp / d.me.max) * 100)) : undefined;
  const record = !first && st && st.bestHit > prevBest;
  const rm = d.rematch;
  const again = !rm
    ? undefined
    : d.over === 'win'
      ? rm.last === 'win' ? '你又一次勝過了他。' : '這一回，你扳回了上一次的敗局。'
      : d.over === 'lose' && rm.last === 'lose' ? '你又一次敗在他手下。' : undefined;
  return (
    <div className={`duel-over ${d.over}`}>
      <p>{text}</p>
      {again && <p className={`duel-again ${d.over === 'win' && rm?.last !== 'win' ? 'avenged' : ''}`}>{again}</p>}
      {st && (
        <ul className="duel-report">
          <li>{d.round} 回合</li>
          {(st.crits ?? 0) > 0 && <li className="crit">爆擊 {st.crits} 次</li>}
          {st.bestHit > 0 && (
            <li className={record ? 'record' : undefined}>
              最重一擊【{st.bestCard}】{st.bestHit}
              {record && <span className="record-tag">生平最重</span>}
            </li>
          )}
          {low !== undefined && low < 100 && <li className={low < 20 ? 'close' : undefined}>最險時剩 {low}% 氣血</li>}
        </ul>
      )}
      <button className="btn btn-primary" onClick={onFinish}>
        收招
      </button>
    </div>
  );
}
