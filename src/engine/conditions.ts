import { CONTENT } from '../content';
import type { Condition, GameState, StatName } from './types';
import { STAT_NAMES } from './describe';

export function currentYear(s: GameState): number {
  return s.player.birthYear + s.player.age;
}

/** 本回合涵蓋的最早年份：上回合之後的第一年。 */
export function windowStart(s: GameState): number {
  return Math.min(s.prevYear + 1, currentYear(s));
}

const LEVEL_XP = [1, 5, 12, 22, 36];

/** 經驗值換算境界：0 不入流 … 5 返璞歸真。 */
export function levelFromXp(xp: number): number {
  return LEVEL_XP.filter((t) => xp >= t).length;
}

export function skillLevel(s: GameState, skill: string): number {
  return levelFromXp(s.player.skills[skill] ?? 0);
}

export function martialLevel(s: GameState): number {
  let best = 0;
  for (const [id, xp] of Object.entries(s.player.skills)) {
    if (CONTENT.skills[id]?.kind === 'martial') best = Math.max(best, levelFromXp(xp));
  }
  return best;
}

export function flagNum(s: GameState, key: string): number {
  const v = s.flags[key];
  if (typeof v === 'number') return v;
  return v ? 1 : 0;
}

export function hasFlag(s: GameState, key: string): boolean {
  const v = s.flags[key];
  return typeof v === 'number' ? v > 0 : Boolean(v);
}

export function npcAlive(s: GameState, id: string): boolean {
  const npc = CONTENT.npcs[id];
  if (!npc || hasFlag(s, `dead_${id}`)) return false;
  return npc.deathYear === undefined || currentYear(s) <= npc.deathYear;
}

export function npcPresent(s: GameState, id: string): boolean {
  const npc = CONTENT.npcs[id];
  if (!npc || !npcAlive(s, id)) return false;
  const y = currentYear(s);
  return npc.presence.some(
    (p) => y >= p.from && y <= p.to && (p.regions.includes('*') || p.regions.includes(s.player.region)),
  );
}

function within(v: number, min?: number, max?: number): boolean {
  return (min === undefined || v >= min) && (max === undefined || v <= max);
}

export function checkCondition(s: GameState, c?: Condition): boolean {
  if (!c) return true;
  const p = s.player;
  const y = currentYear(s);

  if (!within(p.age, c.minAge, c.maxAge)) return false;
  if (c.minYear !== undefined && y < c.minYear) return false;
  if (c.maxYear !== undefined && windowStart(s) > c.maxYear) return false;
  if (c.backgrounds && !c.backgrounds.includes(p.background)) return false;
  if (c.regions && !c.regions.includes(p.region)) return false;
  if (c.traits && !c.traits.includes(p.trait)) return false;
  if (c.notTraits && c.notTraits.includes(p.trait)) return false;
  if (c.flags && !c.flags.every((f) => hasFlag(s, f))) return false;
  if (c.notFlags && c.notFlags.some((f) => hasFlag(s, f))) return false;
  if (c.flagMin && !Object.entries(c.flagMin).every(([k, v]) => flagNum(s, k) >= v)) return false;
  if (c.flagMax && !Object.entries(c.flagMax).every(([k, v]) => flagNum(s, k) <= v)) return false;
  if (c.minStats && !Object.entries(c.minStats).every(([k, v]) => p.stats[k as StatName] >= (v ?? 0))) return false;
  if (c.maxStats && !Object.entries(c.maxStats).every(([k, v]) => p.stats[k as StatName] <= (v ?? 99))) return false;
  if (!within(p.fame, c.minFame, c.maxFame)) return false;
  if (!within(p.chivalry, c.minChivalry, c.maxChivalry)) return false;
  if (!within(p.alignment, c.minAlignment, c.maxAlignment)) return false;
  if (c.minMoney !== undefined && p.money < c.minMoney) return false;
  if (!within(p.health, c.minHealth, c.maxHealth)) return false;
  if (c.focus && (!s.focus || !c.focus.includes(s.focus))) return false;
  if (c.sects && (!p.sect || !c.sects.includes(p.sect))) return false;
  if (c.hasSect !== undefined && Boolean(p.sect) !== c.hasSect) return false;
  if (c.ambitions && (!p.ambition || !c.ambitions.includes(p.ambition))) return false;
  if (c.hasAmbition !== undefined && Boolean(p.ambition) !== c.hasAmbition) return false;
  if (c.minRelation && !Object.entries(c.minRelation).every(([k, v]) => (s.relations[k] ?? 0) >= v)) return false;
  if (c.maxRelation && !Object.entries(c.maxRelation).every(([k, v]) => (s.relations[k] ?? 0) <= v)) return false;
  if (c.npcPresent && !npcPresent(s, c.npcPresent)) return false;
  if (c.npcAlive && !c.npcAlive.every((id) => npcAlive(s, id))) return false;
  if (c.minSkill && !Object.entries(c.minSkill).every(([k, v]) => skillLevel(s, k) >= v)) return false;
  if (!within(martialLevel(s), c.minMartial, c.maxMartial)) return false;
  if (c.any && !c.any.some((sub) => checkCondition(s, sub))) return false;
  if (c.not && checkCondition(s, c.not)) return false;
  return true;
}

/** 條件不符時給玩家看的提示，只涵蓋玩家能理解並努力達成的部分。 */
export function unmetHints(s: GameState, c?: Condition): string[] {
  if (!c) return [];
  const hints: string[] = [];
  for (const [k, v] of Object.entries(c.minStats ?? {})) {
    if (s.player.stats[k as StatName] < (v ?? 0)) hints.push(`需要${STAT_NAMES[k as StatName]} ${v}`);
  }
  if (c.minMoney !== undefined && s.player.money < c.minMoney) hints.push(`需要 ${c.minMoney} 文錢`);
  for (const [k, v] of Object.entries(c.minSkill ?? {})) {
    if (skillLevel(s, k) < v) hints.push(`需要${CONTENT.skills[k]?.name ?? k}更純熟`);
  }
  if (c.minMartial !== undefined && martialLevel(s) < c.minMartial) hints.push('武學境界不足');
  if (c.hasSect === false && s.player.sect) hints.push('你已有門派');
  return hints;
}
