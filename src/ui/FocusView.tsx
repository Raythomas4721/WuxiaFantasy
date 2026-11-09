import { useState } from 'react';
import { Tips } from './Tips';
import { CONTENT } from '../content';
import { destinations } from '../engine/world';
import { FATIGUE_STREAK, allocateStat, chooseFocus, focusOptions, streakIfChosen } from '../engine/game';
import { LIFE_STAGES, chapterTitle, stageIndex } from '../engine/stages';
import { chineseNumber } from '../engine/text';
import { activeThreads, ambitionView, type ThreadView } from '../engine/threads';
import { STAT_NAMES, STAT_ORDER } from '../engine/describe';
import { STAT_MAX, STAT_PERKS, STAT_PERK_AT } from '../engine/talents';
import type { FocusDef, GameState, NodeKind } from '../engine/types';

const MAX_THREADS = 4;

const TRAIN_NAMES = { martial: '武學', medicine: '醫術', sect: '門派武學' } as const;
const CN_DIGIT = ['', '一', '兩', '三', '四', '五', '六', '七', '八', '九'];
const CHANCE = (c: number) => (c === 0.5 ? '一半機會' : c < 0.1 ? '偶爾' : `${CN_DIGIT[Math.round(c * 10)] ?? ''}成機會`);

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
  const [travelling, setTravelling] = useState(false);

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
      <Tips
        tips={[
          {
            id: 'focus-points',
            when: Boolean(state.statPoints),
            text: '每進入人生的新一章，有幾點屬性可以自己分配。屬性到 7 以上，會有額外的效果。',
          },
          {
            id: 'focus-intro',
            when: !state.statPoints && p.age >= 7,
            text: '方針決定這段日子怎麼過：每張卡寫了會有什麼收穫、比較常遇到哪種關卡。選了之後會一直照這樣過，想換的時候，在結果畫面按「接下來改做別的事」。',
          },
        ]}
      />

      {state.statPoints ? (
        <StatAllocator state={state} act={act} />
      ) : travelling ? (
        <TravelPicker state={state} act={act} back={() => setTravelling(false)} />
      ) : (
      <>
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
              onClick={() => (f.id === 'travel' ? setTravelling(true) : act(() => chooseFocus(state, f.id)))}
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
      </>
      )}
    </article>
  );
}

/** 每章開場分配屬性點：分完才能選方針。 */
function StatAllocator({ state, act }: Props) {
  const st = state.player.stats;
  return (
    <section className="stat-alloc">
      <h3 className="focus-heading">
        這幾年的歷練，讓你有所長進。還有 <strong>{state.statPoints}</strong> 點可以分配
      </h3>
      <ul className="stat-alloc-list">
        {STAT_ORDER.map((k) => (
          <li key={k} className={st[k] >= STAT_PERK_AT ? 'on' : ''}>
            <span className="stat-alloc-name">
              {STAT_NAMES[k]} <b>{st[k]}</b>
            </span>
            <span className="stat-alloc-perk">{STAT_PERKS[k]}</span>
            <button className="btn btn-small" disabled={st[k] >= STAT_MAX} onClick={() => act(() => allocateStat(state, k))}>
              +1
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 遊歷：挑一個地方去，或隨處走走。 */
function TravelPicker({ state, act, back }: Props & { back: () => void }) {
  const here = CONTENT.regions[state.player.region].name;
  return (
    <>
      <h3 className="focus-heading">你在{here}。這回要往哪裡去？</h3>
      <div className="focus-grid">
        {destinations(state).map((d) => (
          <button key={d.id} className="focus-card" onClick={() => act(() => chooseFocus(state, 'travel', d.id))}>
            <span className="pick-title">
              {d.name}
              {d.far && <span className="focus-note">路遠・多一場小戰</span>}
            </span>
            <span className="pick-desc">最近聽說：{d.hint}</span>
          </button>
        ))}
        <button className="focus-card" onClick={() => act(() => chooseFocus(state, 'travel'))}>
          <span className="pick-title">隨處走走</span>
          <span className="pick-desc">不定方向，走到哪裡算哪裡。</span>
        </button>
      </div>
      <button className="btn btn-ghost" onClick={back}>
        ← 再想想
      </button>
    </>
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
