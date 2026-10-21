// 自動遊玩：給模擬器與測試用。策略是在可選項中隨機挑選。

import { CONTENT } from '../content';
import { chooseFocus, chooseOption, choiceViews, focusOptions, newGame, nextTurn, rollTraitOptions, startLife } from './game';
import { Rng } from './rng';
import type { GameState } from './types';

const MAX_STEPS = 1000;

export interface AutoplayResult {
  state: GameState;
  events: string[];
}

export function randomSetup(seed: number) {
  const rng = new Rng(seed);
  return {
    name: '',
    background: rng.pick(Object.keys(CONTENT.backgrounds)),
    region: rng.pick(Object.keys(CONTENT.regions)),
    trait: rng.pick(rollTraitOptions(seed, [])),
    seed,
  };
}

export function playLife(seed: number): AutoplayResult {
  const policy = new Rng(seed ^ 0x9e3779b9);
  let s = startLife(newGame(randomSetup(seed)));
  const events: string[] = [];
  for (let step = 0; step < MAX_STEPS && s.phase !== 'ended'; step++) {
    if (s.phase === 'focus') {
      s = chooseFocus(s, policy.pick(focusOptions(s)).id);
    } else if (s.phase === 'event') {
      events.push(s.current!.eventId);
      const options = choiceViews(s).filter((c) => c.enabled);
      s = chooseOption(s, policy.pick(options).id);
    } else if (s.phase === 'result') {
      s = nextTurn(s);
    } else {
      throw new Error(`autoplay 無法處理階段：${s.phase}`);
    }
  }
  if (s.phase !== 'ended') throw new Error(`第 ${seed} 號人生沒有在 ${MAX_STEPS} 步內結束`);
  return { state: s, events };
}
