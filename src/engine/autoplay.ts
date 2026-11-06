// 自動遊玩：給模擬器與測試用。每一輪依種子決定性格（隨性、善、惡），在可選項中挑選。

import { playSimpleRound } from './duelAI';
import {
  chooseFocus, chooseOption, choiceViews, finishDuel, focusOptions, newGame, nextTurn, rollTraitOptions, startLife,
} from './game';
import { CONTENT } from '../content';
import { mainSkill } from './duel';
import { Rng } from './rng';
import type { GameState } from './types';

const MAX_STEPS = 1000;

export interface AutoplayResult {
  state: GameState;
  events: string[];
  /** 每個事件實際顯示的敘述文字，用來量測文字層級的重複。 */
  texts: string[];
  /** 這一生選了幾次方針。 */
  focusPicks: number;
  persona: Persona;
  /** 這一生打過的過招。 */
  duels: { opponent: string; level: number; playerLevel: number; won: boolean; rounds: number }[];
}

export interface AutoplayOptions {
  /** 只要可選就固定選這個方針，用來測試連續同一方針的倦怠機制。 */
  preferFocus?: string;
  /** 指定性格；不指定時依種子隨機決定。 */
  persona?: Persona;
  /** 好鬥：有過招的選項就選它（量測「想打的玩家」用）。 */
  preferDuel?: boolean;
}

export function randomSetup(seed: number) {
  const rng = new Rng(seed);
  // 出身與出生地由 newGame 依種子隨機決定。
  return { name: '', trait: rng.pick(rollTraitOptions(seed, [])), seed };
}

/**
 * 模擬玩家的性格：真人玩家在善惡上通常前後一致，全隨機會讓正邪結局失真。
 * good / evil 會有七成機率挑「俠義＋正邪」變化最大／最小的選項。
 */
export type Persona = 'random' | 'good' | 'evil';

function pickPersona(rng: Rng): Persona {
  const r = rng.next();
  return r < 0.5 ? 'random' : r < 0.8 ? 'good' : 'evil';
}

/** 選項的善惡分數：成功（或唯一）結果裡俠義與正邪變化的總和。 */
function moralScore(s: GameState, choiceId: string): number {
  const event = CONTENT.events.find((e) => e.id === s.current?.eventId);
  const choice = event?.choices.find((c) => c.id === choiceId);
  const spec = choice?.check?.success ?? choice?.outcome;
  const first = Array.isArray(spec) ? spec[spec.length - 1] : spec;
  return (first?.effects ?? []).reduce(
    (sum, e) => sum + (e.type === 'chivalry' || e.type === 'alignment' ? e.delta : 0),
    0,
  );
}

function pickChoice(s: GameState, ids: string[], persona: Persona, rng: Rng): string {
  if (persona === 'random' || !rng.chance(0.7)) return rng.pick(ids);
  const sign = persona === 'good' ? 1 : -1;
  const scored = ids.map((id) => ({ id, score: sign * moralScore(s, id) }));
  const best = Math.max(...scored.map((x) => x.score));
  return rng.pick(scored.filter((x) => x.score === best).map((x) => x.id));
}

export function playLife(seed: number, options: AutoplayOptions = {}): AutoplayResult {
  const policy = new Rng(seed ^ 0x9e3779b9);
  const persona = options.persona ?? pickPersona(new Rng(seed ^ 0x5bd1e995));
  let s = startLife(newGame(randomSetup(seed)));
  const events: string[] = [];
  const texts: string[] = [];
  let focusPicks = 0;
  const duels: AutoplayResult['duels'] = [];
  for (let step = 0; step < MAX_STEPS && s.phase !== 'ended'; step++) {
    if (s.phase === 'focus') {
      const focuses = focusOptions(s);
      const preferred = focuses.find((f) => f.id === options.preferFocus);
      focusPicks += 1;
      s = chooseFocus(s, (preferred ?? policy.pick(focuses)).id);
    } else if (s.phase === 'event') {
      events.push(s.current!.eventId);
      texts.push(s.current!.text);
      const enabled = choiceViews(s).filter((c) => c.enabled);
      const duel = options.preferDuel ? enabled.find((c) => c.duel) : undefined;
      s = chooseOption(s, duel ? duel.id : pickChoice(s, enabled.map((c) => c.id), persona, policy));
    } else if (s.phase === 'duel') {
      // 過招用「直覺」策略打完，再收招
      const rng = new Rng(s.rng);
      let d = s.duel!;
      for (let i = 0; i < 60 && !d.over; i++) d = playSimpleRound(d, rng);
      if (!d.over) d = { ...d, over: 'lose' };
      duels.push({ opponent: d.opponent, level: d.level, playerLevel: mainSkill(s).level, won: d.over === 'win', rounds: d.round });
      s = finishDuel({ ...s, duel: d, rng: rng.state });
    } else if (s.phase === 'result') {
      s = nextTurn(s);
    } else {
      throw new Error(`autoplay 無法處理階段：${s.phase}`);
    }
  }
  if (s.phase !== 'ended') throw new Error(`第 ${seed} 號人生沒有在 ${MAX_STEPS} 步內結束`);
  return { state: s, events, texts, focusPicks, persona, duels };
}
