// 自創武學、開宗立派的畫面：取名、收徒，側欄的門派與風雲榜。

import { useState } from 'react';
import { SCHOOL_RULES } from '../content/school';
import { getCard } from '../engine/duel';
import {
  ART_PASSIVE, birthOf, cleanName, giveName, rankings, recruitDisciple, schoolFame, schoolFameLabel, shownCharacter, suggestName,
  toGraduate, type RankRow,
} from '../engine/school';
import type { DeckTask, Disciple, GameState } from '../engine/types';
import { CardFace } from './DuelView';

type Act = (fn: () => GameState, scroll?: boolean) => void;

const NAME_MAX = 8;
/** 根骨到了這裡，標「根骨奇佳」。 */
const GIFTED_AT = 8;

/** 取名：自己打，或用建議的、換一個建議。 */
export function NameTask({ state, task, act }: { state: GameState; task: Extract<DeckTask, { kind: 'name' }>; act: Act }) {
  const [reroll, setReroll] = useState(0);
  const [value, setValue] = useState(task.suggested);
  const art = state.player.ownArt;
  const name = cleanName(value, task.suggested);
  return (
    <div className="name-task">
      {task.target === 'art' && art && (
        <div className="name-preview">
          <CardFace card={getCard(art.ult)} />
          <p className="muted small">
            過招時多一層「{name}」：攻擊牌傷害 +{ART_PASSIVE.attackBonus}、每回合開始護體 {ART_PASSIVE.blockPerRound}。
          </p>
        </div>
      )}
      <label className="name-field">
        <span className="muted small">{task.target === 'art' ? '武學的名字' : '門派的名字'}（最多 {NAME_MAX} 個字）</span>
        <input
          type="text"
          value={value}
          maxLength={NAME_MAX * 2}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') act(() => giveName(state, value), false);
          }}
          aria-label={task.target === 'art' ? '武學的名字' : '門派的名字'}
        />
      </label>
      <div className="actions">
        <button className="btn" onClick={() => act(() => giveName(state, value), false)}>
          就叫「{name}」
        </button>
        <button
          className="btn btn-ghost btn-small"
          onClick={() => {
            const next = reroll + 1;
            setReroll(next);
            setValue(suggestName(state, task.target, next));
          }}
        >
          換一個建議
        </button>
      </div>
    </div>
  );
}

/** 一個想拜師的人：根骨、出身、品性（藏著的品性只看得到它裝出來的樣子）。 */
function CandidateCard({ d, onPick }: { d: Disciple; onPick: () => void }) {
  const birth = birthOf(d);
  const character = shownCharacter(d);
  return (
    <button className="candidate" onClick={onPick}>
      <span className="candidate-head">
        <span className="candidate-name">{d.name}</span>
        <span className="candidate-gengu" title="根骨：越高學得越快，出師時門派的聲勢漲得越多">
          根骨 <b>{d.gengu}</b>
          <span className="gengu-bar" aria-hidden="true">
            <span style={{ width: `${d.gengu * 10}%` }} />
          </span>
        </span>
      </span>
      <span className="candidate-origin">{d.origin}</span>
      <span className="candidate-tags">
        {d.gengu >= GIFTED_AT && <span className="candidate-trait is-gifted">根骨奇佳</span>}
        {birth.id !== 'poor' && <span className="candidate-trait is-birth">{birth.name}</span>}
        <span className={`candidate-trait ${character.hidden ? 'is-hidden' : ''}`}>{character.name}</span>
      </span>
      <span className="candidate-desc muted small">
        {birth.id !== 'poor' && `${birth.desc} `}
        {character.desc}
      </span>
    </button>
  );
}

export function RecruitTask({ state, task, act }: { state: GameState; task: Extract<DeckTask, { kind: 'recruit' }>; act: Act }) {
  return (
    <>
      <div className="candidates">
        {task.candidates.map((d) => (
          <CandidateCard key={d.id} d={d} onPick={() => act(() => recruitDisciple(state, d.id), false)} />
        ))}
      </div>
      <div className="actions">
        <button className="btn btn-ghost btn-small" onClick={() => act(() => recruitDisciple(state, null), false)}>
          不收了
        </button>
      </div>
    </>
  );
}

const STATUS_LABEL: Record<Disciple['status'], string> = {
  training: '學藝',
  graduated: '出師',
  heir: '傳人',
  left: '離去',
  betrayed: '叛出師門',
  dead: '亡故',
  caught: '廢去武功',
  reformed: '回頭',
};

/** 學藝的進度：幾成。 */
function progressText(d: Disciple): string {
  if (d.status !== 'training') return STATUS_LABEL[d.status];
  const p = Math.min(9, Math.floor(((d.progress ?? d.years) / toGraduate(d)) * 10));
  return p <= 0 ? '剛入門' : `學了${'一二三四五六七八九'[p - 1]}成`;
}

/** 側欄：門派、弟子。 */
export function SchoolBlock({ state }: { state: GameState }) {
  const school = state.school;
  if (!school) return null;
  const fame = schoolFame(state);
  const order: Disciple['status'][] = ['heir', 'graduated', 'reformed', 'training', 'left', 'betrayed', 'caught', 'dead'];
  const disciples = [...school.disciples].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <section className="status-block school-block">
      <h4>{school.name || '門派'}</h4>
      <div className="status-row"><span>門規</span><span>{SCHOOL_RULES[school.rule].name}</span></div>
      <div className="status-row">
        <span>聲勢</span>
        <span>{schoolFameLabel(fame)}（{fame}）</span>
      </div>
      {disciples.length === 0 ? (
        <p className="muted small">門下還沒有弟子。</p>
      ) : (
        <ul className="plain-list disciples">
          {disciples.map((d) => {
            const birth = birthOf(d);
            const character = shownCharacter(d);
            const gone = ['left', 'betrayed', 'dead', 'caught'].includes(d.status);
            return (
              <li key={d.id} className={gone ? 'is-gone' : undefined}>
                <details>
                  <summary>
                    <span>{d.name}</span>
                    <span className="muted small">根骨 {d.gengu}・{character.name}・{progressText(d)}</span>
                  </summary>
                  <p className="muted small">
                    {d.origin} 出身{birth.name}，入門 {d.years} 年。{character.desc}
                  </p>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function rankName(r: RankRow): string {
  if (r.kind === 'me') return r.name;
  if (r.kind === 'disciple') return `${r.title ? `「${r.title}」` : ''}${r.name}`;
  if (r.kind === 'traitor') return `${r.name}（叛出師門）`;
  if (!r.known) return `「${r.title ?? '無名'}」？？？`;
  return `${r.title ? `「${r.title}」` : ''}${r.name}`;
}

/** 側欄：風雲榜。你的弟子、叛徒、新冒出來的人都標出來。 */
export function RankBlock({ state }: { state: GameState }) {
  const { rows, myRank } = rankings(state);
  return (
    <section className="status-block rank-block">
      <h4>風雲榜</h4>
      <ol className="rank-list">
        {rows.map((r, i) => (
          <li key={`${r.kind}-${r.name}-${i}`} className={`is-${r.kind}`}>
            <span className="rank-no">{r.kind === 'me' ? myRank : i + 1}</span>
            <span className="rank-name">{rankName(r)}</span>
            {r.kind === 'star' && <span className="rank-tag">新秀</span>}
            {r.kind === 'disciple' && <span className="rank-tag">門下</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 章節開頭的一行：你在風雲榜上排第幾。 */
export function rankLine(state: GameState): string | undefined {
  const { myRank, rows } = rankings(state);
  if (state.player.age < 16) return undefined;
  if (myRank === 1) {
    const next = rows[1];
    return next ? `江湖風雲榜上，你的名字排在第一。緊跟在後面的，是${rankName(next)}。` : '江湖風雲榜上，你的名字排在第一。';
  }
  if (myRank <= 10) return `江湖風雲榜上，你排第 ${myRank}，就在${rankName(rows[myRank - 2])}後面。`;
  return '江湖風雲榜上，還沒有你的名字。';
}
