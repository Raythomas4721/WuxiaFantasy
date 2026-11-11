import { CONTENT } from '../content';
import { checkCondition, currentYear } from './conditions';
import type { Rng } from './rng';
import type { Condition, GameEvent, GameState } from './types';

/** 平淡歲月的權重：成年後偶爾不發生事件，只以摘要帶過。 */
const QUIET_WEIGHT = 4;
const DEFAULT_WEIGHT = 10;
const FOCUS_MULT = 3;
const RECENT_TAG_MULT = 0.5;
/** 遊歷指定了目的地：當地的事件 ×3，名俠相遇 ×2。 */
const DEST_MULT = 3;
const DEST_NPC_MULT = 2;
/** 推進「心事」的事件：權重 ×3，免得伏筆埋了卻一直等不到。 */
const THREAD_MULT = 3;

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

/** 進行中的心事會推進的事件。 */
function threadEvents(s: GameState): Set<string> {
  return new Set(CONTENT.threads.filter((t) => checkCondition(s, t.conditions)).flatMap((t) => t.advances));
}

function eventWeight(s: GameState, e: GameEvent, pulled: Set<string>): number {
  let w = e.weight ?? DEFAULT_WEIGHT;
  if (pulled.has(e.id)) w *= THREAD_MULT;
  for (const m of e.weightMods ?? []) if (checkCondition(s, m.if)) w *= m.mult;
  const focus = CONTENT.focuses.find((f) => f.id === s.focus);
  const tags = e.tags ?? [];
  if (focus && tags.some((t) => focus.tags.includes(t))) w *= FOCUS_MULT;
  const recent = s.recentTags.flat();
  if (tags.some((t) => recent.includes(t))) w *= RECENT_TAG_MULT;
  if (s.travelDest) {
    if (mentionsRegion(e.conditions, s.travelDest)) w *= DEST_MULT;
    if (e.conditions?.npcPresent) w *= DEST_NPC_MULT;
  }
  return w;
}

function mentionsRegion(c: Condition | undefined, region: string): boolean {
  if (!c) return false;
  return !!c.regions?.includes(region) || !!c.any?.some((x) => mentionsRegion(x, region));
}

/** 這回合必定發生的強制事件（史實大事、立志、論武）。 */
export function forcedEvent(s: GameState): GameEvent | undefined {
  return CONTENT.events
    .filter((e) => e.kind === 'forced' && !e.scheduledOnly && eventAllowed(s, e))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
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

  const forced = forcedEvent(s);
  if (forced) return forced;

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

  const pulled = threadEvents(s);
  const pool: { item: GameEvent | null; weight: number }[] = CONTENT.events
    .filter((e) => e.kind === 'normal' && !e.scheduledOnly && eventAllowed(s, e))
    .map((e) => ({ item: e, weight: eventWeight(s, e, pulled) }));
  if (pool.length === 0) return null;
  if (s.player.age >= 7) pool.push({ item: null, weight: QUIET_WEIGHT });
  return rng.weighted(pool) ?? null;
}
