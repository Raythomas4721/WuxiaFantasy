import { MARKET } from '../content/market';
import { boughtThisTurn, buy, marketOffers, marketOpen } from '../engine/market';
import type { GameState } from '../engine/types';

interface Props {
  state: GameState;
  act: (fn: () => GameState, scroll?: boolean) => void;
}

/** 回合結果畫面上的市集：收合起來，點開才看得到貨物。 */
export function MarketPanel({ state, act }: Props) {
  if (!marketOpen(state)) return null;
  const offers = marketOffers(state);
  if (offers.length === 0) return null;
  const left = MARKET.perTurn - boughtThisTurn(state);

  return (
    <details className="market">
      <summary>
        逛市集
        <span className="muted small">
          　身上 {state.player.money} 文・這回合還能買 {left} 樣
        </span>
      </summary>
      <ul className="market-list">
        {offers.map((o) => (
          <li key={o.id} className="market-item">
            <div className="market-info">
              <span className="market-name">{o.name}</span>
              <span className="market-desc">{o.desc}</span>
            </div>
            <button
              className="btn btn-small"
              disabled={!o.enabled}
              title={o.reason}
              onClick={() => act(() => buy(state, o.id), false)}
            >
              {o.enabled ? `${o.price} 文` : o.reason}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
