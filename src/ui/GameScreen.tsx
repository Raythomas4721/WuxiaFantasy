import { useState } from 'react';
import { CONTENT } from '../content';
import { currentYear } from '../engine/conditions';
import { FATIGUE_STREAK, chooseOption, choiceViews, describeOrigin, nextTurn, requestFocusChange, startLife } from '../engine/game';
import { chapterTitle, stageIndex } from '../engine/stages';
import { chineseNumber, eraName } from '../engine/text';
import type { GameState } from '../engine/types';
import type { LifeUnlocks } from '../save/codex';
import { EndingView } from './EndingView';
import { DuelView } from './DuelView';
import { FocusView } from './FocusView';
import { MarketPanel } from './MarketPanel';
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

  const act = (fn: () => GameState, scroll = true) => {
    try {
      const next = fn();
      onChange(next);
      // 過招中出牌不要捲動畫面；進出過招時才捲回頂端
      if (scroll && !(next.phase === 'duel' && state.phase === 'duel')) window.scrollTo({ top: 0, behavior: 'smooth' });
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
          {!showHistory && state.notices && state.notices.length > 0 && (
            <aside className="notice">
              {state.notices.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </aside>
          )}
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

function PhaseView({ state, act }: { state: GameState; act: (fn: () => GameState, scroll?: boolean) => void }) {
  switch (state.phase) {
    case 'intro':
      return (
        <article className="panel">
          <h2 className="panel-title">命格</h2>
          <ul className="fate-tags">
            <li>{CONTENT.backgrounds[state.player.background].name}</li>
            <li>{CONTENT.regions[state.player.birthRegion].name}</li>
            <li>{CONTENT.traits[state.player.trait].name}</li>
          </ul>
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
      return <FocusView state={state} act={act} />;

    case 'duel':
      return <DuelView state={state} act={act} />;

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
                {c.duel && <span className="choice-duel">過招</span>}
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
              {!state.player.alive ? '……' : state.chain ? '接著……' : '歲月流轉'}
            </button>
            <ChangeFocusButton state={state} act={act} />
          </div>
          <MarketPanel state={state} act={act} />
        </article>
      );
    }

    default:
      return null;
  }
}

/** 結果畫面的次要按鈕：下一回合重新選方針。 */
function ChangeFocusButton({ state, act }: { state: GameState; act: (fn: () => GameState) => void }) {
  const focus = CONTENT.focuses.find((f) => f.id === state.focus);
  if (!state.player.alive || state.chain || !focus || !state.focusStreak) return null;
  const weary = state.focusStreak.count >= FATIGUE_STREAK;
  return (
    <button
      className={`btn btn-ghost change-focus ${weary ? 'weary' : ''}`}
      onClick={() => act(() => nextTurn(requestFocusChange(state)))}
    >
      換個活法
      <small>
        目前：{focus.name}・第 {state.focusStreak.count} 回{weary ? '・已倦' : ''}
      </small>
    </button>
  );
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
          {entries.map((h, i) => {
            const stage = stageIndex(h.age);
            const newChapter = i === 0 || stageIndex(entries[i - 1].age) !== stage;
            return (
              <li key={i} className="timeline-entry">
                {newChapter && <h3 className="timeline-chapter">{chapterTitle(stage)}</h3>}
                <div className="timeline-item">
                  <div className="timeline-when">
                    {chineseNumber(h.age)}歲 · {h.year}
                  </div>
                  <div className="timeline-what">
                    <strong>{h.title}</strong>
                    {h.choice && <span className="timeline-choice">{h.choice}</span>}
                    <p>{h.text}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="muted small seed">種子 {state.seed}</p>
    </article>
  );
}
