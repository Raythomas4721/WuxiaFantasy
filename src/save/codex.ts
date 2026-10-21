// 江湖傳聞錄：跨輪保留的結局、名俠、奇遇紀錄，以及因緣解鎖。

import { CONTENT } from '../content';
import type { GameState } from '../engine/types';

const CODEX_KEY = 'jianghu.codex.v1';
const RECORDED_LIMIT = 200;

export interface Codex {
  lives: number;
  endings: Record<string, number>;
  npcs: string[];
  rare: string[];
  /** 已記錄的人生（種子），避免重新整理後重複計算。 */
  recorded: number[];
}

export interface LifeUnlocks {
  newEnding: boolean;
  newNpcs: string[];
  newRare: string[];
  newTraits: string[];
}

export const emptyCodex = (): Codex => ({ lives: 0, endings: {}, npcs: [], rare: [], recorded: [] });

export function loadCodex(): Codex {
  try {
    const raw = localStorage.getItem(CODEX_KEY);
    return raw ? { ...emptyCodex(), ...(JSON.parse(raw) as Partial<Codex>) } : emptyCodex();
  } catch {
    return emptyCodex();
  }
}

export function saveCodex(c: Codex): void {
  try {
    localStorage.setItem(CODEX_KEY, JSON.stringify(c));
  } catch {
    // 圖鑑存不了不影響遊戲。
  }
}

export function achievedEndings(c: Codex): string[] {
  return Object.keys(c.endings);
}

export function isRecorded(c: Codex, s: GameState): boolean {
  return c.recorded.includes(s.seed);
}

/** 一生結束時呼叫：回傳新的圖鑑與這一輪新解鎖的項目。 */
export function recordLife(c: Codex, s: GameState): { codex: Codex; unlocks: LifeUnlocks } {
  const endingId = s.ending?.id;
  const newEnding = Boolean(endingId && !c.endings[endingId]);

  const met = Object.values(CONTENT.npcs)
    .filter((n) => n.codex && s.flags[`met_${n.id}`])
    .map((n) => n.id);
  const newNpcs = met.filter((id) => !c.npcs.includes(id));

  const rareFired = CONTENT.events.filter((e) => e.rare && s.fired[e.id]).map((e) => e.id);
  const newRare = rareFired.filter((id) => !c.rare.includes(id));

  const newTraits = newEnding
    ? Object.values(CONTENT.traits)
        .filter((t) => t.unlockedBy === endingId)
        .map((t) => t.id)
    : [];

  const codex: Codex = {
    lives: c.lives + 1,
    endings: endingId ? { ...c.endings, [endingId]: (c.endings[endingId] ?? 0) + 1 } : c.endings,
    npcs: [...c.npcs, ...newNpcs],
    rare: [...c.rare, ...newRare],
    recorded: [...c.recorded, s.seed].slice(-RECORDED_LIMIT),
  };
  return { codex, unlocks: { newEnding, newNpcs, newRare, newTraits } };
}
