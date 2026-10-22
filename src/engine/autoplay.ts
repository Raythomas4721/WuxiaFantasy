// 自動遊玩：給模擬器與測試用。預設策略是在可選項中隨機挑選。

import { rollTraitOptions, chooseFocus, chooseOption, choiceViews, focusOptions, newGame, nextTurn, startLife } from './game';
import { Rng } from './rng';
import type { GameState } from './types';

const MAX_STEPS = 1000;

export interface AutoplayResult {
  state: GameState;
  events: string[];
  /** 每個事件實際顯示的敘述文字，用來量測文字層級的重複。 */
  texts: string[];
}

export interface AutoplayOptions {
  /** 只要可選就固定選這個方針，用來測試連續同一方針的倦怠機制。 */
  preferFocus?: string;
}

export function randomSetup(seed: number) {
  const rng = new Rng(seed);
  // 出身與出生地由 newGame 依種子隨機決定。
  return { name: '', trait: rng.pick(rollTraitOptions(seed, [])), seed };
}

export function playLife(seed: number, options: AutoplayOptions = {}): AutoplayResult {
  const policy = new Rng(seed ^ 0x9e3779b9);
  let s = startLife(newGame(randomSetup(seed)));
  const events: string[] = [];
  const texts: string[] = [];
  for (let step = 0; step < MAX_STEPS && s.phase !== 'ended'; step++) {
    if (s.phase === 'focus') {
      const focuses = focusOptions(s);
      const preferred = focuses.find((f) => f.id === options.preferFocus);
      s = chooseFocus(s, (preferred ?? policy.pick(focuses)).id);
    } else if (s.phase === 'event') {
      events.push(s.current!.eventId);
      texts.push(s.current!.text);
      const enabled = choiceViews(s).filter((c) => c.enabled);
      s = chooseOption(s, policy.pick(enabled).id);
    } else if (s.phase === 'result') {
      s = nextTurn(s);
    } else {
      throw new Error(`autoplay 無法處理階段：${s.phase}`);
    }
  }
  if (s.phase !== 'ended') throw new Error(`第 ${seed} 號人生沒有在 ${MAX_STEPS} 步內結束`);
  return { state: s, events, texts };
}
