// 撰寫內容用的簡寫。只依賴型別，不依賴引擎實作。

import type { GameEffect, StatName } from '../engine/types';

export const stat = (stat: StatName, delta: number): GameEffect => ({ type: 'stat', stat, delta });
export const gengu = (d: number) => stat('gengu', d);
export const wuxing = (d: number) => stat('wuxing', d);
export const fuyuan = (d: number) => stat('fuyuan', d);
export const xinxing = (d: number) => stat('xinxing', d);
export const danshi = (d: number) => stat('danshi', d);
export const meili = (d: number) => stat('meili', d);

export const flag = (key: string, value: boolean | number | string = true): GameEffect => ({ type: 'flag', key, value });
export const add = (key: string, delta = 1): GameEffect => ({ type: 'addFlag', key, delta });
export const rel = (npc: string, delta: number): GameEffect => ({ type: 'relation', npc, delta });
export const money = (delta: number): GameEffect => ({ type: 'money', delta });
export const health = (delta: number): GameEffect => ({ type: 'health', delta });
export const fame = (delta: number): GameEffect => ({ type: 'fame', delta });
export const chiv = (delta: number): GameEffect => ({ type: 'chivalry', delta });
export const align = (delta: number): GameEffect => ({ type: 'alignment', delta });
export const xp = (skill: string, n: number): GameEffect => ({ type: 'skill', skill, xp: n });
export const train = (kind: 'martial' | 'medicine' | 'sect', n: number): GameEffect => ({ type: 'train', kind, xp: n });
export const join = (sect: string): GameEffect => ({ type: 'joinSect', sect });
export const master = (npc: string): GameEffect => ({ type: 'master', npc });
export const goTo = (region: string): GameEffect => ({ type: 'region', region });
export const ambition = (id: string): GameEffect => ({ type: 'ambition', ambition: id });
export const later = (event: string, min: number, max: number, expire?: number): GameEffect => ({
  type: 'schedule',
  event,
  after: [min, max],
  expire,
});
export const meet = (npc: string): GameEffect => ({ type: 'meet', npc });
export const resetStreak = (): GameEffect => ({ type: 'resetStreak' });
export const die = (cause: string): GameEffect => ({ type: 'die', cause });
