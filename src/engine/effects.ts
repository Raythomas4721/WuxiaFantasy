import { CONTENT } from '../content';
import { currentYear } from './conditions';
import type { Rng } from './rng';
import type { GameEffect, GameState } from './types';

const STAT_MIN = 1;
const STAT_MAX = 15;
const DEFAULT_SKILL = { martial: 'changquan', medicine: 'baicao' } as const;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function bestSkillOfKind(s: GameState, kind: 'martial' | 'medicine'): string {
  let best: string = DEFAULT_SKILL[kind];
  let bestXp = -1;
  for (const [id, xp] of Object.entries(s.player.skills)) {
    if (CONTENT.skills[id]?.kind === kind && xp > bestXp) {
      best = id;
      bestXp = xp;
    }
  }
  return best;
}

export function killPlayer(s: GameState, cause: string): void {
  if (!s.player.alive) return;
  s.player.alive = false;
  s.deathCause = cause;
  s.flags.dead = true;
  if (s.player.age < 50) s.flags.died_young = true;
}

/** 就地修改傳入的狀態；呼叫端負責先複製。 */
export function applyEffect(s: GameState, e: GameEffect, rng: Rng): void {
  const p = s.player;
  switch (e.type) {
    case 'stat':
      p.stats[e.stat] = clamp(p.stats[e.stat] + e.delta, STAT_MIN, STAT_MAX);
      break;
    case 'flag':
      s.flags[e.key] = e.value ?? true;
      break;
    case 'addFlag': {
      const cur = s.flags[e.key];
      s.flags[e.key] = (typeof cur === 'number' ? cur : cur ? 1 : 0) + e.delta;
      break;
    }
    case 'clearFlag':
      delete s.flags[e.key];
      break;
    case 'relation':
      s.relations[e.npc] = clamp((s.relations[e.npc] ?? 0) + e.delta, -100, 100);
      break;
    case 'money':
      p.money = Math.max(0, p.money + e.delta);
      break;
    case 'health':
      p.health = clamp(p.health + e.delta, 0, 100);
      if (p.health <= 0) killPlayer(s, 'injury');
      break;
    case 'fame':
      p.fame = clamp(p.fame + e.delta, 0, 100);
      break;
    case 'chivalry':
      p.chivalry = clamp(p.chivalry + e.delta, -100, 100);
      break;
    case 'alignment':
      p.alignment = clamp(p.alignment + e.delta, -100, 100);
      break;
    case 'skill':
      p.skills[e.skill] = (p.skills[e.skill] ?? 0) + e.xp;
      break;
    case 'train': {
      // 悟性高的人學得快一些。
      const bonus = p.stats.wuxing >= 8 ? 1 : 0;
      let skill: string | undefined;
      if (e.kind === 'sect') skill = p.sect ? CONTENT.sects[p.sect]?.skill : undefined;
      else skill = bestSkillOfKind(s, e.kind);
      if (skill) p.skills[skill] = (p.skills[skill] ?? 0) + e.xp + bonus;
      break;
    }
    case 'joinSect':
      p.sect = e.sect;
      s.flags[`joined_${e.sect}`] = true;
      break;
    case 'leaveSect':
      p.sect = undefined;
      break;
    case 'master':
      if (!p.masters.includes(e.npc)) p.masters.push(e.npc);
      break;
    case 'region':
      p.region = e.region === 'home' ? p.birthRegion : e.region;
      break;
    case 'ambition':
      p.ambition = e.ambition;
      break;
    case 'schedule': {
      const due = currentYear(s) + rng.int(e.after[0], e.after[1]);
      s.scheduled.push({ event: e.event, due, expire: due + (e.expire ?? 8) });
      break;
    }
    case 'meet':
      s.flags[`met_${e.npc}`] = true;
      break;
    case 'resetStreak':
      s.focusStreak = undefined;
      break;
    case 'die':
      killPlayer(s, e.cause);
      break;
  }
}

export function applyEffects(s: GameState, effects: GameEffect[] | undefined, rng: Rng): void {
  for (const e of effects ?? []) applyEffect(s, e, rng);
}
