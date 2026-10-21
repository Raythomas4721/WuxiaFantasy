import { useState } from 'react';
import { CONTENT } from '../content';
import { currentYear } from '../engine/conditions';
import {
  chooseFocus, chooseOption, choiceViews, describeOrigin, focusOptions, nextTurn, startLife,
} from '../engine/game';
import { chineseNumber, eraName } from '../engine/text';
import type { GameState } from '../engine/types';
import type { LifeUnlocks } from '../save/codex';
import { EndingView } from './EndingView';
import { StatusPanel } from './StatusPanel';

interface Props {
  state: GameState;
  unlocks: LifeUnlocks | null;
  onChange: (s: GameState) => void;
  onNewLife: () => void;
  onCodex: () => void;
  onExit: () => void;
}

export function GameScreen({ state, unlocks, onChange, onNewLife, onCodex, onExit }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const p = state.player;
  const year = currentYear(state);

  const act = (fn: () => GameState) => {
    try {
      onChange(fn());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
    }
  };

  if (state.phase === 'ended' && state.ending) {
    return (
      <EndingView state={state} unlocks={unlocks} onNewLife={onNewLife} onCodex={onCodex} onExit={onExit} />
    );
  }

  return (
    <div className="game">
      <header className="game-header">
        <div className="game-title">
          <span className="player-name">{p.name}</span>
          <span className="header-meta">
            {eraName(year)}（{year}）· {chineseNumber(p.age)}歲 · {CONTENT.regions[p.region].name}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-small" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? '返回' : '人生紀錄'}
          </button>
          <button className="btn btn-ghost btn-small" onClick={onExit}>
            標題
          </button>
        </div>
      </header>

      <div className="game-body">
        <aside className="game-side">
          <details className="side-details" open>
            <summary>{p.name} 的狀態</summary>
            <StatusPanel state={state} />
          </details>
        </aside>

        <main className="game-main">
          {showHistory ? (
            <HistoryPanel state={state} />
          ) : (
            <PhaseView state={state} act={act} />
          )}
        </main>
      </div>
    </div>
  );
}

function PhaseView({ state, act }: { state: GameState; act: (fn: () => GameState) => void }) {
  switch (state.phase) {
    case 'intro':
      return (
        <article className="panel">
          <h2 className="panel-title">命格</h2>
          <div className="story">
            {describeOrigin(state).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => act(() => startLife(state))}>
              開始這一生
            </button>
          </div>
        </article>
      );

    case 'focus':
      return (
        <article className="panel">
          <h2 className="panel-title">
            {state.player.age < 13 ? '這兩年，你多半在……' : '這段日子，你打算……'}
          </h2>
          <div className="focus-grid">
            {focusOptions(state).map((f) => (
              <button key={f.id} className="focus-card" onClick={() => act(() => chooseFocus(state, f.id))}>
                <span className="pick-title">{f.name}</span>
                <span className="pick-desc">{f.desc}</span>
              </button>
            ))}
          </div>
        </article>
      );

    case 'event': {
      const e = CONTENT.events.find((x) => x.id === state.current?.eventId);
      return (
        <article className="panel">
          <h2 className="panel-title">{e?.title}</h2>
          <div className="story">
            <p>{state.current?.text}</p>
          </div>
          <div className="choices">
            {choiceViews(state).map((c) => (
              <button
                key={c.id}
                className="choice"
                disabled={!c.enabled}
                onClick={() => act(() => chooseOption(state, c.id))}
              >
                <span className="choice-text">{c.text}</span>
                {c.odds && <span className="choice-odds">{c.odds}</span>}
                {c.hint && <span className="choice-hint">{c.hint}</span>}
              </button>
            ))}
          </div>
        </article>
      );
    }

    case 'result': {
      const r = state.result;
      if (!r) return null;
      return (
        <article className="panel">
          <h2 className="panel-title">
            {r.title}
            {r.check && <span className={`check-badge ${r.check}`}>{r.check === 'success' ? '成' : '敗'}</span>}
          </h2>
          <div className="story">
            <p>{r.text}</p>
          </div>
          {r.gains.length > 0 && (
            <ul className="gains">
              {r.gains.map((g, i) => (
                <li key={i} className={g.includes('-') || g.includes('↓') ? 'loss' : ''}>
                  {g}
                </li>
              ))}
            </ul>
          )}
          {r.rumor && (
            <aside className="rumor">
              <span className="rumor-label">江湖傳聞</span>
              <p>{r.rumor}</p>
            </aside>
          )}
          <div className="actions">
            <button className="btn btn-primary" onClick={() => act(() => nextTurn(state))}>
              {state.player.alive ? '歲月流轉' : '……'}
            </button>
          </div>
        </article>
      );
    }

    default:
      return null;
  }
}

function HistoryPanel({ state }: { state: GameState }) {
  const entries = [...state.history].reverse();
  return (
    <article className="panel">
      <h2 className="panel-title">人生紀錄</h2>
      {entries.length === 0 ? (
        <p className="muted">這一生才剛開始。</p>
      ) : (
        <ol className="timeline">
          {entries.map((h, i) => (
            <li key={i} className="timeline-item">
              <div className="timeline-when">
                {chineseNumber(h.age)}歲 · {h.year}
              </div>
              <div className="timeline-what">
                <strong>{h.title}</strong>
                {h.choice && <span className="timeline-choice">{h.choice}</span>}
                <p>{h.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="muted small seed">種子 {state.seed}</p>
    </article>
  );
}
