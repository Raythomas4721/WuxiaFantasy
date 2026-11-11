import { CONTENT } from '../content';
import { levelFromXp } from '../engine/conditions';
import {
  LEVEL_NAMES, STAT_NAMES, STAT_ORDER, alignmentLabel, chivalryLabel, fameLabel, healthLabel,
} from '../engine/describe';
import { DUEL, REALM, mainSkill } from '../engine/duel';
import { chooseMainSkill } from '../engine/game';
import { activeThreads, ambitionView } from '../engine/threads';
import { DeckList } from './DeckPanel';
import { STAT_PERK2_AT, STAT_PERKS, STAT_PERK_AT, getTalent, talentHp } from '../engine/talents';
import type { GameState } from '../engine/types';
import { ThreadList } from './FocusView';

function relationLabel(v: number): string {
  if (v >= 60) return '生死之交';
  if (v >= 30) return '交情深厚';
  if (v >= 10) return '相識';
  if (v > -10) return '泛泛之交';
  if (v > -40) return '有嫌隙';
  return '仇怨';
}

/** 側欄：屬性、狀態、心事、武學、人物。 */
export function StatusPanel({ state, act }: { state: GameState; act?: (fn: () => GameState) => void }) {
  const p = state.player;
  const threads = activeThreads(state);
  const land = (p.properties ?? []).filter((x) => x.kind === 'land').length;
  const shop = (p.properties ?? []).filter((x) => x.kind === 'shop').length;
  const items = (p.items ?? []).map((id) => CONTENT.items[id]).filter(Boolean);
  const hasThreads = threads.length > 0 || Boolean(ambitionView(state));
  const main = mainSkill(state);
  const realm = REALM[Math.min(5, main.level)];
  const skills = Object.entries(p.skills)
    .map(([id, x]) => ({ id, level: levelFromXp(x) }))
    .filter((s) => s.level > 0)
    .sort((a, b) => b.level - a.level);

  const people: { key: string; name: string; label: string }[] = [];
  people.push({ key: 'companion', name: `${state.companion.name}（兒時玩伴）`, label: relationLabel(state.relations.companion ?? 0) });
  for (const npc of Object.values(CONTENT.npcs)) {
    if (npc.id === 'companion' || npc.id === 'rival') continue;
    const known = state.flags[`met_${npc.id}`] || state.relations[npc.id] !== undefined;
    if (!known) continue;
    const dead = state.flags[`dead_${npc.id}`] || (npc.deathYear !== undefined && p.birthYear + p.age > npc.deathYear);
    const title = npc.title ? `「${npc.title}」` : '';
    people.push({
      key: npc.id,
      name: `${title}${npc.name}${dead ? '（已故）' : ''}`,
      label: relationLabel(state.relations[npc.id] ?? 0),
    });
  }
  if (state.flags.rival_bully) people.push({ key: 'rival', name: `${state.rival.name}（冤家）`, label: relationLabel(state.relations.rival ?? -10) });

  return (
    <div className="status">
      <section className="status-block">
        <div className="stat-grid">
          {STAT_ORDER.map((k) => (
            <div key={k} className={`stat${p.stats[k] >= STAT_PERK2_AT ? ' on2' : p.stats[k] >= STAT_PERK_AT ? ' on' : ''}`}>
              <span className="stat-name">{STAT_NAMES[k]}</span>
              <span className="stat-value">{p.stats[k]}</span>
            </div>
          ))}
        </div>
        <details className="stat-perks">
          <summary>屬性效果（{STAT_PERK_AT} 點、{STAT_PERK2_AT} 點各有一層，最高 15）</summary>
          <ul>
            {STAT_ORDER.map((k) => (
              <li key={k}>
                <b>{STAT_NAMES[k]}</b> {STAT_PERKS[k]}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className="status-block">
        <div className="status-row">
          <span>健康</span>
          <span>
            {healthLabel(p.health)}
            <span className="muted small">
              {' '}（氣血 {Math.round((DUEL.playerHp(p.stats.gengu, main.level) * p.health) / 100)}／{DUEL.playerHp(p.stats.gengu, main.level)}）
            </span>
          </span>
        </div>
        <div className="health-bar" aria-label={`健康 ${p.health}`}>
          <div className="health-fill" style={{ width: `${p.health}%` }} />
        </div>
        <div className="status-row"><span>錢財</span><span>{p.money} 文</span></div>
        {land + shop > 0 && (
          <div className="status-row">
            <span>產業</span>
            <span>{[land > 0 && `田地 ${land}`, shop > 0 && `鋪面 ${shop}`].filter(Boolean).join('、')}</span>
          </div>
        )}
        <div className="status-row"><span>名望</span><span>{fameLabel(p.fame)}</span></div>
        <div className="status-row"><span>俠義</span><span>{chivalryLabel(p.chivalry)}</span></div>
        <div className="status-row"><span>江湖評價</span><span>{alignmentLabel(p.alignment)}</span></div>
        <div className="status-row">
          <span>門派</span>
          <span>{p.sect ? CONTENT.sects[p.sect].name : '無門無派'}</span>
        </div>
        {p.masters.length > 0 && (
          <div className="status-row">
            <span>師父</span>
            <span>{p.masters.map((m) => CONTENT.npcs[m]?.name).join('、')}</span>
          </div>
        )}
      </section>

      {hasThreads && (
        <section className="status-block">
          <h4>心事</h4>
          <ThreadList state={state} threads={threads} compact />
        </section>
      )}

      {items.length > 0 && (
        <section className="status-block">
          <h4>行囊</h4>
          <ul className="plain-list items">
            {items.map((it) => (
              <li key={it.id}>
                <details>
                  <summary>{it.name}</summary>
                  <p className="muted small">{it.desc}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="status-block">
        <h4>武學</h4>
        {skills.length === 0 ? (
          <p className="muted small">尚未習得任何武學</p>
        ) : (
          <ul className="plain-list">
            {skills.map((s) => {
              const martial = CONTENT.skills[s.id].kind === 'martial' && Boolean(CONTENT.skillCards[s.id]);
              const isMain = martial && s.id === main.skill;
              const canSwitch = martial && !isMain && act && state.phase !== 'duel' && state.player.alive;
              return (
                <li key={s.id} className="status-row">
                  <span>
                    {CONTENT.skills[s.id].name}
                    {isMain && <span className="main-badge">主修</span>}
                    {canSwitch && (
                      <button
                        className="main-switch"
                        title="往後習武就練這一門。第一次改成這門時觸類旁通，直接追到比原主修低一級。"
                        onClick={() => act!(() => chooseMainSkill(state, s.id))}
                      >
                        改為主修
                      </button>
                    )}
                  </span>
                  <span className="level">{LEVEL_NAMES[s.level]}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="muted small realm">
          過招時：內力 {realm.energy}・氣血 {DUEL.playerHp(p.stats.gengu, main.level) + talentHp(state)}
          {realm.draw > 0 && `・每回合多抽 ${realm.draw} 張`}
        </p>
        {(p.talents?.length ?? 0) > 0 && (
          <ul className="talent-list">
            {p.talents!.map((id) => {
              const t = getTalent(id);
              return (
                <li key={id} title={t.text}>
                  <b>{t.name}</b> <span className="muted small">{t.text}</span>
                </li>
              );
            })}
          </ul>
        )}
        {p.deck && <DeckList deck={p.deck} />}
      </section>

      <section className="status-block">
        <h4>人物</h4>
        <ul className="plain-list">
          {people.map((x) => (
            <li key={x.key} className="status-row">
              <span>{x.name}</span>
              <span className="muted">{x.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
