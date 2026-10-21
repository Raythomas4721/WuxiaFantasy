// 瀏覽器存檔。localStorage 可能不可用（無痕模式等），所有讀寫都要能失敗。

import { SAVE_VERSION } from '../engine/game';
import type { GameState } from '../engine/types';

const SAVE_KEY = 'jianghu.save.v1';

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === SAVE_VERSION ? s : null;
  } catch {
    return null;
  }
}

export function saveGame(s: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    // 存不了就算了，遊戲照常進行。
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // 同上
  }
}
