import { CONTENT } from '../content';
import { checkCondition, currentYear } from './conditions';
import type { Rng } from './rng';
import type { GameEvent, GameState } from './types';

/** 平淡歲月的權重：成年後偶爾不發生事件，只以摘要帶過。 */
const QUIET_WEIGHT = 4;
const DEFAULT_WEIGHT = 10;
const FOCUS_MULT = 3;
const RECENT_TAG_MULT = 0.5;

const EVENTS_BY_ID = new Map(CONTENT.events.map((e) => [e.id, e]));

export function getEvent(id: string): GameEvent {
  const e = EVENTS_BY_ID.get(id);
  if (!e) throw new Error(`未知事件：${id}`);
  return e;
}

/** 次數、冷卻與條件都允許此事件發生。 */
export function eventAllowed(s: GameState, e: GameEvent): boolean {
  const fired = s.fired[e.id];
  if (fired) {
    if (!e.repeatable) return false;
    if (e.maxTimes !== undefined && fired.count >= e.maxTimes) return false;
    if (e.cooldown !== undefined && currentYear(s) - fired.lastYear < e.cooldown) return false;
  }
  return checkCondition(s, e.conditions);
}

function eventWeight(s: GameState, e: GameEvent): number {
  let w = e.weight ?? DEFAULT_WEIGHT;
  for (const m of e.weightMods ?? []) if (checkCondition(s, m.if)) w *= m.mult;
  const focus = CONTENT.focuses.find((f) => f.id === s.focus);
  const tags = e.tags ?? [];
  if (focus && tags.some((t) => focus.tags.includes(t))) w *= FOCUS_MULT;
  const recent = s.recentTags.flat();
  if (tags.some((t) => recent.includes(t))) w *= RECENT_TAG_MULT;
  return w;
}

/**
 * 依優先序決定本回合的事件：
 * 1. 強制事件（史實大事、立志等），依 priority 由高到低
 * 2. 到期的排程事件（長期伏筆的回收）
 * 3. 一般事件，以權重 × 方針加成抽選；可能抽到「平淡歲月」
 * 回傳 null 代表本回合以歲月摘要帶過。會移除已觸發或過期的排程。
 */
export function selectEvent(s: GameState, rng: Rng): GameEvent | null {
  const year = currentYear(s);

  const forced = CONTENT.events
    .filter((e) => e.kind === 'forced' && !e.scheduledOnly && eventAllowed(s, e))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  if (forced.length > 0) return forced[0];

  s.scheduled = s.scheduled.filter((x) => x.expire >= year);
  const dueIndex = s.scheduled
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => x.due <= year)
    .sort((a, b) => a.x.due - b.x.due)
    .find(({ x }) => {
      const e = EVENTS_BY_ID.get(x.event);
      return e !== undefined && eventAllowed(s, e);
    });
  if (dueIndex) {
    s.scheduled.splice(dueIndex.i, 1);
    return getEvent(dueIndex.x.event);
  }

  const pool: { item: GameEvent | null; weight: number }[] = CONTENT.events
    .filter((e) => e.kind === 'normal' && !e.scheduledOnly && eventAllowed(s, e))
    .map((e) => ({ item: e, weight: eventWeight(s, e) }));
  if (pool.length === 0) return null;
  if (s.player.age >= 7) pool.push({ item: null, weight: QUIET_WEIGHT });
  return rng.weighted(pool) ?? null;
}
