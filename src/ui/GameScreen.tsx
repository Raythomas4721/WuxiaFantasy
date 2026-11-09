import { useState } from 'react';
import { CONTENT } from '../content';
import { currentYear } from '../engine/conditions';
import { FATIGUE_STREAK, chooseOption, choiceViews, describeOrigin, nextTurn, requestFocusChange, startLife, timeStep } from '../engine/game';
import { chapterTitle, stageIndex } from '../engine/stages';
import { chineseNumber, eraName } from '../engine/text';
import type { GameState } from '../engine/types';
import type { LifeUnlocks } from '../save/codex';
import { EndingView } from './EndingView';
import { DeckTaskPanel } from './DeckPanel';
import { DuelView } from './DuelView';
import { NODE_INFO } from '../content/nodes';
import { FocusView } from './FocusView';
import { Tips } from './Tips';
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

    case 'event':
      return <EventView state={state} act={act} />;

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
          <DeckTaskPanel state={state} act={act} />
          <Tips
            tips={[
              {
                id: 'result-next',
                when: state.player.alive && !state.deckTasks?.length,
                text: '主按鈕寫著接下來會發生什麼。健康就是過招時的氣血：帶著傷就會帶著傷上場，過一段日子才會慢慢養回來。',
              },
            ]}
          />
          {/* 牌庫的事要先處理完，才能往下走 */}
          {!(state.player.alive && state.deckTasks?.length) && (
            <div className="actions">
              <NextButton state={state} act={act} />
              <ChangeFocusButton state={state} act={act} />
            </div>
          )}
          <MarketPanel state={state} act={act} />
        </article>
      );
    }

    default:
      return null;
  }
}

const TIER_LABEL = { minor: '⚔ 小戰', elite: '☠ 精英', boss: '章末之戰' } as const;

/** 事件畫面：關卡會標出種類；生死之戰的選項要按兩次才會開打。 */
function EventView({ state, act }: { state: GameState; act: (fn: () => GameState, scroll?: boolean) => void }) {
  const [armed, setArmed] = useState<string | undefined>();
  const e = CONTENT.events.find((x) => x.id === state.current?.eventId);
  return (
    <article className="panel">
      <h2 className="panel-title">
        {e?.title}
        {e?.node && <span className={`node-badge tier-${e.node.tier}`}>{TIER_LABEL[e.node.tier]}</span>}
      </h2>
      <div className="story">
        <p>{state.current?.text}</p>
      </div>
      <Tips
        tips={[
          {
            id: 'event-minor',
            when: e?.node?.tier === 'minor',
            text: '⚔ 小戰：選有「過招」標記的選項就會開打，打贏可以挑一張新招。不想打也可以避開。',
          },
          { id: 'event-elite', when: e?.node?.tier === 'elite', text: '☠ 精英比小戰難打，但打贏給的牌比較好。' },
          {
            id: 'event-odds',
            when: choiceViews(state).some((c) => c.odds),
            text: '選項右邊的「把握很大」「九死一生」是勝算，已經算進你現在的健康。',
          },
        ]}
      />
      <div className="choices">
        {choiceViews(state).map((c) => (
          <button
            key={c.id}
            className={`choice ${c.lethal ? 'lethal' : ''} ${armed === c.id ? 'armed' : ''}`}
            disabled={!c.enabled}
            onClick={() => {
              if (c.lethal && armed !== c.id) {
                setArmed(c.id);
                return;
              }
              setArmed(undefined);
              act(() => chooseOption(state, c.id));
            }}
          >
            <span className="choice-text">{armed === c.id ? '輸了，這一生就到這裡。確定要打？再按一次' : c.text}</span>
            {c.lethal ? <span className="choice-lethal">生死之戰</span> : c.duel && <span className="choice-duel">過招</span>}
            {c.odds && <span className="choice-odds">{c.odds}</span>}
            {c.hint && <span className="choice-hint">{c.hint}</span>}
          </button>
        ))}
      </div>
    </article>
  );
}

/** 結果畫面的主按鈕：直接寫出按下去會發生什麼（同一段日子的下一關，或過幾年之後的第一關）。 */
function NextButton({ state, act }: { state: GameState; act: (fn: () => GameState) => void }) {
  const p = state.player;
  let main: string;
  let sub: string | undefined;
  if (!p.alive) main = '……';
  else if (state.chain) main = '事情還沒完，接著看';
  else if (state.followUp) {
    const next = state.nodeQueue?.[0];
    main = next ? `繼續上路：${NODE_INFO[next].icon} ${NODE_INFO[next].name}` : '看看這段日子還發生了什麼';
    sub = '同一段日子';
  } else {
    const years = timeStep(state);
    const age = chineseNumber(p.age + years);
    const node = state.upcoming && NODE_INFO[state.upcoming.node];
    main = node ? `過${chineseNumber(years)}年：${node.icon} ${node.name}` : `過${chineseNumber(years)}年`;
    const focus = CONTENT.focuses.find((f) => f.id === state.upcoming?.focus);
    sub = focus ? `${age}歲・照「${focus.name}」過日子` : `${age}歲`;
  }
  return (
    <button className="btn btn-primary next-btn" onClick={() => act(() => nextTurn(state))}>
      {main}
      {sub && <small>{sub}</small>}
    </button>
  );
}

/** 結果畫面的次要按鈕：「接下來改做別的事」，下一回合重新選方針。 */
function ChangeFocusButton({ state, act }: { state: GameState; act: (fn: () => GameState) => void }) {
  const focus = CONTENT.focuses.find((f) => f.id === state.focus);
  if (!state.player.alive || state.chain || state.followUp || !focus || !state.focusStreak) return null;
  const weary = state.focusStreak.count >= FATIGUE_STREAK;
  return (
    <button
      className={`btn btn-ghost change-focus ${weary ? 'weary' : ''}`}
      onClick={() => act(() => nextTurn(requestFocusChange(state)))}
    >
      接下來改做別的事
      <small>
        已經「{focus.name}」{chineseNumber(state.focusStreak.count)}段日子{weary ? '，有些倦了' : ''}
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
