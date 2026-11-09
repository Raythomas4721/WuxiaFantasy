import { CONTENT } from '../content';
import { canUpgrade, pickCard, pickTalent, removeBlocked, removeCard, upgradeCard } from '../engine/deck';
import { getTalent } from '../engine/talents';
import { cardSkill, cardText, getCard } from '../engine/duel';
import type { GameState } from '../engine/types';
import { CardFace } from './DuelView';

interface Props {
  state: GameState;
  act: (fn: () => GameState, scroll?: boolean) => void;
}

/** 牌庫裡相同的牌合在一起：id、張數、第一張的位置。 */
function grouped(deck: string[]): { id: string; count: number; index: number }[] {
  const out: { id: string; count: number; index: number }[] = [];
  deck.forEach((id, index) => {
    const g = out.find((x) => x.id === id);
    if (g) g.count += 1;
    else out.push({ id, count: 1, index });
  });
  return out;
}

/** 結果畫面上等著處理的牌庫變化：一次一件。 */
export function DeckTaskPanel({ state, act }: Props) {
  const task = state.deckTasks?.[0];
  if (!task || !state.player.alive) return null;
  const deck = state.player.deck ?? [];
  const left = state.deckTasks!.length - 1;

  return (
    <section className={`deck-task deck-task-${task.kind}`} aria-live="polite">
      <h3 className="deck-task-title">
        {task.title}
        {task.kind === 'pick' && task.picks > 1 && <span className="muted small">　還能挑 {task.picks} 張</span>}
        {left > 0 && <span className="muted small">　（之後還有 {left} 件）</span>}
      </h3>
      <p className="deck-task-text">{task.text}</p>

      {task.kind === 'pick' && (
        <>
          <div className="duel-hand deck-options">
            {task.options.map((id) => (
              <CardFace key={id} card={getCard(id)} onClick={() => act(() => pickCard(state, id), false)} />
            ))}
          </div>
          <div className="actions">
            <button className="btn btn-ghost btn-small" onClick={() => act(() => pickCard(state, null), false)}>
              {task.skipMoney ? `不要了（+${task.skipMoney} 文）` : '不挑了'}
            </button>
          </div>
        </>
      )}

      {task.kind === 'talent' && (
        <div className="talent-options">
          {task.options.map((id) => {
            const t = getTalent(id);
            return (
              <button key={id} className="talent-card" onClick={() => act(() => pickTalent(state, id), false)}>
                <span className="talent-name">{t.name}</span>
                <span className="talent-text">{t.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {task.kind === 'remove' && <RemoveList state={state} deck={deck} act={act} />}

      {task.kind === 'upgrade' && (
        <>
          <ul className="deck-upgrades">
            {grouped(deck)
              .filter((g) => canUpgrade(state, g.id))
              // 武學的牌排前面，基本牌排後面
              .sort((a, b) => Number(Boolean(cardSkill(b.id))) - Number(Boolean(cardSkill(a.id))) || a.index - b.index)
              .map((g) => {
                const before = getCard(g.id);
                const after = getCard(`${g.id}+`);
                return (
                  <li key={g.id}>
                    <button className="deck-upgrade" onClick={() => act(() => upgradeCard(state, g.index), false)}>
                      <span className="deck-upgrade-name">
                        {before.name}
                        {g.count > 1 && <span className="muted small"> × {g.count}</span>}
                      </span>
                      <span className="deck-upgrade-before">{before.cost} 內力・{cardText(before)}</span>
                      <span className="deck-upgrade-after">
                        → {after.name}：{after.cost} 內力・{cardText(after)}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
          <div className="actions">
            <button className="btn btn-ghost btn-small" onClick={() => act(() => upgradeCard(state, null), false)}>
              不升級了
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function RemoveList({ state, deck, act }: { state: GameState; deck: string[] } & Pick<Props, 'act'>) {
  const blocked = removeBlocked(state);
  return (
    <>
      {blocked && <p className="muted small">{blocked}</p>}
      <ul className="deck-chips">
        {grouped(deck).map((g) => {
          const c = getCard(g.id);
          return (
            <li key={g.id}>
              <button
                className={`deck-chip kind-${c.kind}`}
                disabled={Boolean(blocked)}
                title={cardText(c)}
                onClick={() => act(() => removeCard(state, g.index), false)}
              >
                {c.name}
                {g.count > 1 && <span className="muted"> × {g.count}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="actions">
        <button className="btn btn-ghost btn-small" onClick={() => act(() => removeCard(state, null), false)}>
          不刪了
        </button>
      </div>
    </>
  );
}

/** 側欄的牌庫：點開看整副牌。 */
export function DeckList({ deck }: { deck: string[] }) {
  const groups = grouped(deck).sort((a, b) => {
    const order = ['attack', 'guard', 'skill', 'trap', 'curse'];
    return order.indexOf(getCard(a.id).kind) - order.indexOf(getCard(b.id).kind) || a.index - b.index;
  });
  return (
    <details className="deck-list">
      <summary>
        牌庫 <span className="muted small">（{deck.length} 張）</span>
      </summary>
      <ul className="plain-list">
        {groups.map((g) => {
          const c = getCard(g.id);
          const skill = cardSkill(g.id);
          return (
            <li key={g.id}>
              <details>
                <summary className={`deck-row kind-${c.kind}`}>
                  <span>
                    {c.name}
                    {g.count > 1 && <span className="muted"> × {g.count}</span>}
                  </span>
                  <span className="muted small">{skill ? CONTENT.skills[skill].name : `${c.cost} 內力`}</span>
                </summary>
                <p className="muted small">
                  {c.cost} 內力・{cardText(c)}
                </p>
              </details>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
