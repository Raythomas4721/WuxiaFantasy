import { CONTENT } from '../content';
import { LEVEL_NAMES } from '../engine/describe';
import { DUEL, canPlay, cardSkill, cardText, getCard, intentText, resolvedEffect } from '../engine/duel';
import { duelEndRound, duelPlay, duelYield, finishDuel } from '../engine/game';
import type { CardDef, CardKind, DuelState, GameState } from '../engine/types';

const KIND_LABEL: Record<CardKind, string> = { attack: '攻', guard: '守', skill: '技', trap: '伏', curse: '傷' };

interface Props {
  state: GameState;
  act: (fn: () => GameState) => void;
}

/** 過招：上方對手與意圖，中間戰況，下方你的狀態與手牌。 */
export function DuelView({ state, act }: Props) {
  const d = state.duel!;
  const intent = intentText(d);

  return (
    <article className="panel duel">
      <header className="duel-head">
        <span className="duel-round">{d.lethal ? `生死之戰・第 ${d.round} 回合` : `第 ${d.round}／${DUEL.maxRounds} 回合`}</span>
      </header>

      <section className="duel-side foe">
        <div className="duel-name">
          <strong>{d.name}</strong>
          <span className="muted small">{LEVEL_NAMES[d.level]}</span>
        </div>
        <HpBar side={d.foe} />
        <Statuses block={d.foe.block} exposed={d.foe.exposed} bleed={d.foe.bleed} charge={d.foe.charge} />
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
        {!d.over && (
          <div className={`duel-intent intent-${d.foe.intent.kind}`}>
            <span className="intent-label">{intent.label}</span>
            <span className="intent-detail">{intent.detail}</span>
          </div>
        )}
      </section>

      <ol className="duel-log" aria-live="polite">
        {d.log.map((l, i) => (
          <li key={i} className={`log-${l.who}`}>{l.text}</li>
        ))}
      </ol>

      <section className="duel-side me">
        <div className="duel-name">
          <strong>你</strong>
          <span className="duel-energy" aria-label={`內力 ${d.me.energy}`}>
            內力 {'●'.repeat(Math.max(0, d.me.energy))}
            {'○'.repeat(Math.max(0, (d.me.energyMax ?? DUEL.energy) - d.me.energy))}
          </span>
        </div>
        <HpBar side={d.me} />
        <Statuses block={d.me.block} exposed={d.me.exposed} boost={d.me.boost} />
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
        <DuelOver d={d} onFinish={() => act(() => finishDuel(state))} />
      ) : (
        <>
          <div className="duel-hand">
            {d.me.hand.map((id, i) => (
              <HandCard key={`${id}-${i}`} d={d} card={getCard(id)} playable={canPlay(d, i)} onPlay={() => act(() => duelPlay(state, i))} />
            ))}
          </div>
          <div className="duel-actions">
            <span className="muted small">
              牌庫 {d.me.deck.length}・棄牌 {d.me.discard.length}・手牌 {d.me.hand.length}／{DUEL.handMax}
            </span>
            <button className="btn btn-ghost btn-small" onClick={() => act(() => duelYield(state))}>
              認輸
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

function Statuses(p: { block: number; exposed: number; bleed?: number; charge?: number; boost?: DuelState['me']['boost'] }) {
  const tags: string[] = [];
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
export function CardFace({ card, disabled, onClick, note, className = '' }: {
  card: CardDef;
  disabled?: boolean;
  onClick?: () => void;
  note?: string;
  className?: string;
}) {
  const skill = cardSkill(card.id);
  return (
    <button className={`duel-card kind-${card.kind} ${className}`} disabled={disabled} onClick={onClick}>
      <span className="card-top">
        <span className="card-cost">{card.cost}</span>
        <span className="card-name">{card.name}</span>
        <span className="card-kind">
          {KIND_LABEL[card.kind]}
          {card.tag && `〈${card.tag}〉`}
        </span>
      </span>
      <span className="card-text">{cardText(card)}</span>
      {skill && <span className="card-skill">{CONTENT.skills[skill].name}</span>}
      {note && <span className="card-boost">{note}</span>}
    </button>
  );
}

function HandCard({ d, card, playable, onPlay }: { d: DuelState; card: CardDef; playable: boolean; onPlay: () => void }) {
  const e = resolvedEffect(d, card);
  const boosted = card.kind === 'attack' && e.dmg !== undefined && e.dmg !== card.dmg;
  const trapsFull = card.kind === 'trap' && d.me.traps.length >= DUEL.trapSlots;
  const note = boosted ? `這回合：傷害 ${e.dmg}` : trapsFull ? `伏招已滿（最多 ${DUEL.trapSlots} 張）` : undefined;
  return <CardFace card={card} disabled={!playable} onClick={onPlay} note={note} />;
}

function DuelOver({ d, onFinish }: { d: DuelState; onFinish: () => void }) {
  const text = { win: `你勝過了${d.name}。`, lose: `你敗給了${d.name}。`, yield: `你向${d.name}認輸了。` }[d.over!];
  return (
    <div className={`duel-over ${d.over}`}>
      <p>{text}</p>
      <button className="btn btn-primary" onClick={onFinish}>
        收招
      </button>
    </div>
  );
}
