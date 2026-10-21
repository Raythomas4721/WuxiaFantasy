import { CONTENT } from '../content';
import { levelFromXp } from '../engine/conditions';
import {
  LEVEL_NAMES, STAT_NAMES, STAT_ORDER, alignmentLabel, chivalryLabel, fameLabel, healthLabel,
} from '../engine/describe';
import type { GameState } from '../engine/types';

function relationLabel(v: number): string {
  if (v >= 60) return '生死之交';
  if (v >= 30) return '交情深厚';
  if (v >= 10) return '相識';
  if (v > -10) return '泛泛之交';
  if (v > -40) return '有嫌隙';
  return '仇怨';
}

/** 側欄：屬性、狀態、武學、人物。 */
export function StatusPanel({ state }: { state: GameState }) {
  const p = state.player;
  const ambition = p.ambition ? CONTENT.ambitions[p.ambition] : undefined;
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
            <div key={k} className="stat">
              <span className="stat-name">{STAT_NAMES[k]}</span>
              <span className="stat-value">{p.stats[k]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="status-block">
        <div className="status-row">
          <span>健康</span>
          <span>{healthLabel(p.health)}</span>
        </div>
        <div className="health-bar" aria-label={`健康 ${p.health}`}>
          <div className="health-fill" style={{ width: `${p.health}%` }} />
        </div>
        <div className="status-row"><span>錢財</span><span>{p.money} 文</span></div>
        <div className="status-row"><span>名望</span><span>{fameLabel(p.fame)}</span></div>
        <div className="status-row"><span>俠義</span><span>{chivalryLabel(p.chivalry)}</span></div>
        <div className="status-row"><span>江湖評價</span><span>{alignmentLabel(p.alignment)}</span></div>
        {ambition && <div className="status-row"><span>志向</span><span>{ambition.name}</span></div>}
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

      <section className="status-block">
        <h4>武學</h4>
        {skills.length === 0 ? (
          <p className="muted small">尚未習得任何武學</p>
        ) : (
          <ul className="plain-list">
            {skills.map((s) => (
              <li key={s.id} className="status-row">
                <span>{CONTENT.skills[s.id].name}</span>
                <span className="level">{LEVEL_NAMES[s.level]}</span>
              </li>
            ))}
          </ul>
        )}
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
