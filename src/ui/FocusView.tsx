import { CONTENT } from '../content';
import { FATIGUE_STREAK, chooseFocus, focusOptions, streakIfChosen } from '../engine/game';
import { LIFE_STAGES, chapterTitle, stageIndex } from '../engine/stages';
import { chineseNumber } from '../engine/text';
import { activeThreads, ambitionView, type ThreadView } from '../engine/threads';
import { STAT_NAMES } from '../engine/describe';
import type { FocusDef, GameState, NodeKind } from '../engine/types';

const MAX_THREADS = 4;

const TRAIN_NAMES = { martial: '武學', medicine: '醫術', sect: '門派武學' } as const;
const CHANCE = (c: number) => (c >= 0.5 ? '一半機會' : c >= 0.4 ? '四成機會' : '三成機會');

/** 方針的收穫：從 growth 直接算出來，改了內容這裡會跟著變。 */
export function focusGains(f: FocusDef): string {
  return f.growth
    .map(({ effect: e, chance }) => {
      let t = '';
      if (e.type === 'stat') t = `${STAT_NAMES[e.stat]} +${e.delta}`;
      else if (e.type === 'train') t = `${TRAIN_NAMES[e.kind]}進境`;
      else if (e.type === 'money') t = e.delta > 0 ? `錢 +${e.delta}` : `花費 ${-e.delta} 文`;
      else if (e.type === 'fame') t = `名望 +${e.delta}`;
      else if (e.type === 'health') t = `健康 +${e.delta}`;
      else if (e.type === 'addFlag' && e.key === 'sect_merit') t = '師門功勞';
      else return '';
      return chance && chance < 1 ? `${t}（${CHANCE(chance)}）` : t;
    })
    .filter(Boolean)
    .join('、');
}

const NODE_HINT: Partial<Record<NodeKind, string>> = {
  fight: '⚔ 小戰',
  elite: '☠ 精英',
  insight: '☯ 悟招（升級一張牌）',
  market: '⚖ 武館（買牌、刪牌）',
  rest: '☕ 歇息（回健康）',
};

/** 這個方針常遇到的關卡：權重 20 以上的，由多到少。 */
export function focusEncounters(id: string): string {
  const w = CONTENT.nodeWeights[id] ?? {};
  const list = (Object.entries(w) as [NodeKind, number][])
    .filter(([k, v]) => NODE_HINT[k] && v >= 20)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => NODE_HINT[k]);
  return list.length > 0 ? list.join('、') : '多半平平靜靜';
}

interface Props {
  state: GameState;
  act: (fn: () => GameState) => void;
}

/** 重新打算方針：新階段時是章節開場，其他時候說明為何要重選。 */
export function FocusView({ state, act }: Props) {
  const p = state.player;
  const prompt = state.focusPrompt;
  const isChapter = !prompt || prompt.reason === 'stage';
  const threads = activeThreads(state);
  const options = focusOptions(state);

  return (
    <article className="panel">
      {isChapter ? (
        <ChapterHead state={state} />
      ) : (
        <h2 className="panel-title">重新打算</h2>
      )}
      {prompt && !isChapter && (
        <div className="story">
          <p>{prompt.text}</p>
        </div>
      )}

      <ThreadList state={state} threads={threads.slice(0, MAX_THREADS)} />

      <h3 className="focus-heading">{p.age < 13 ? '這幾年，你多半在……' : '接下來這段日子，你打算……'}</h3>
      <div className="focus-grid">
        {options.map((f) => {
          const streak = streakIfChosen(state, f.id);
          const current = state.focus === f.id;
          const advances = threads.filter((t) => t.focuses.includes(f.id));
          return (
            <button
              key={f.id}
              className={`focus-card ${current ? 'current' : ''}`}
              onClick={() => act(() => chooseFocus(state, f.id))}
            >
              <span className="pick-title">
                {f.name}
                {current && <span className="focus-current">照舊</span>}
              </span>
              <span className="pick-desc">{f.desc}</span>
              <span className="focus-line">
                <b>收穫</b>
                {focusGains(f)}
              </span>
              <span className="focus-line">
                <b>常遇</b>
                {focusEncounters(f.id)}
              </span>
              {advances.length > 0 && (
                <span className="focus-advances">可能推進：{advances.map((t) => t.title).join('、')}</span>
              )}
              {streak >= FATIGUE_STREAK ? (
                <span className="focus-warn">
                  連續第 {streak} 回・收穫{streak === FATIGUE_STREAK ? '減半' : '大減'}，小心倦怠
                </span>
              ) : streak === FATIGUE_STREAK - 1 ? (
                <span className="focus-note">已連續 {streak - 1} 回</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </article>
  );
}

function ChapterHead({ state }: { state: GameState }) {
  const p = state.player;
  const index = stageIndex(p.age);
  const stage = LIFE_STAGES[index];
  const prevFrom = LIFE_STAGES[index - 1]?.from ?? 0;
  // 上一階段最重要的一兩件事
  const looking = state.history
    .filter((h) => h.recap && h.age >= prevFrom && h.age < stage.from)
    .sort((a, b) => (b.recap?.weight ?? 0) - (a.recap?.weight ?? 0) || a.turn - b.turn)
    .slice(0, 2)
    .sort((a, b) => a.turn - b.turn)
    .map((h) => h.recap!.text);

  const where = [`如今你在${CONTENT.regions[p.region].name}`];
  if (p.sect) where.push(`是${CONTENT.sects[p.sect].name}的弟子`);
  if (p.masters.length > 0) where.push(`師從${p.masters.map((m) => CONTENT.npcs[m]?.name).join('、')}`);

  return (
    <header className="chapter-head">
      <span className="chapter-age">{chineseNumber(p.age)}歲</span>
      <h2 className="chapter-title">{chapterTitle(index)}</h2>
      <p className="chapter-opening">{stage.opening}</p>
      {looking.length > 0 && (
        <ul className="chapter-looking">
          {looking.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
      {index >= 2 && <p className="chapter-where">{where.join('，')}。</p>}
    </header>
  );
}

/** 心事與志向目標。focus 畫面與側欄共用。 */
export function ThreadList({ state, threads, compact }: { state: GameState; threads: ThreadView[]; compact?: boolean }) {
  const ambition = ambitionView(state);
  if (!ambition && threads.length === 0) return null;
  return (
    <section className={`threads ${compact ? 'compact' : ''}`}>
      {!compact && <h3 className="threads-label">心事</h3>}
      <ul>
        {ambition && (
          <li className={`thread ambition ${ambition.done ? 'done' : ''}`}>
            <span className="thread-title">
              <span className="thread-mark" aria-hidden>{ambition.done ? '●' : '○'}</span>
              志向・{ambition.name}
            </span>
            <span className="thread-text">
              {ambition.goal}
              {ambition.done && '（已達成）'}
            </span>
          </li>
        )}
        {threads.map((t) => (
          <li key={t.id} className="thread">
            <span className="thread-title">{t.title}</span>
            <span className="thread-text">{t.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
