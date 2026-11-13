// 自創武學、開宗立派的畫面：取名、收徒，側欄的門派與風雲榜。

import { useState } from 'react';
import { DISCIPLE_TRAITS, SCHOOL_RULES } from '../content/school';
import { getCard } from '../engine/duel';
import {
  ART_PASSIVE, SCHOOL, cleanName, giveName, rankings, recruitDisciple, schoolFame, schoolFameLabel, suggestName,
} from '../engine/school';
import type { DeckTask, Disciple, GameState } from '../engine/types';
import { CardFace } from './DuelView';

type Act = (fn: () => GameState, scroll?: boolean) => void;

const NAME_MAX = 8;

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

/** 一個想拜師的人：根骨、來歷、特質（藏著的特質，眼光不夠看不穿）。 */
function CandidateCard({ d, onPick }: { d: Disciple; onPick: () => void }) {
  const trait = DISCIPLE_TRAITS[d.trait];
  const shown = d.seen || !trait.hidden;
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
      <span className={`candidate-trait ${shown ? '' : 'is-hidden'}`}>
        {shown ? trait.name : trait.hidden!.cover}
      </span>
      <span className="candidate-desc muted small">
        {shown ? trait.desc : `${trait.hidden!.hint}（悟性 ${SCHOOL.seeThroughWuxing} 以上才看得穿）`}
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
  betrayed: '叛出',
  dead: '亡故',
  caught: '廢去武功',
  reformed: '回頭',
};

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
            const trait = DISCIPLE_TRAITS[d.trait];
            const gone = ['left', 'betrayed', 'dead', 'caught'].includes(d.status);
            return (
              <li key={d.id} className={gone ? 'is-gone' : undefined}>
                <details>
                  <summary>
                    <span>{d.name}</span>
                    <span className="muted small">根骨 {d.gengu}・{d.seen || !trait.hidden ? trait.name : trait.hidden.cover}・{STATUS_LABEL[d.status]}</span>
                  </summary>
                  <p className="muted small">
                    {d.origin} 入門 {d.years} 年。
                    {(d.seen || !trait.hidden) && ` ${trait.desc}`}
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

/** 側欄：風雲榜。 */
export function RankBlock({ state }: { state: GameState }) {
  const { rows, myRank } = rankings(state);
  return (
    <section className="status-block rank-block">
      <h4>風雲榜</h4>
      <ol className="rank-list">
        {rows.map((r, i) => (
          <li key={`${r.name}-${i}`} className={r.me ? 'is-me' : undefined}>
            <span className="rank-no">{r.me ? myRank : i + 1}</span>
            <span className="rank-name">
              {r.me ? r.name : r.known ? `${r.title ? `「${r.title}」` : ''}${r.name}` : `「${r.title ?? '無名'}」？？？`}
            </span>
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
  if (myRank === 1) return '江湖風雲榜上，你的名字排在第一。';
  if (myRank <= 10) {
    const above = rows[myRank - 2];
    return `江湖風雲榜上，你排第 ${myRank}，就在${above.known ? above.name : `「${above.title ?? '某人'}」`}後面。`;
  }
  return '江湖風雲榜上，還沒有你的名字。';
}
