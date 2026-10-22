// 心事：把進行中的劇情線與志向目標整理給玩家看。

import { CONTENT } from '../content';
import { checkCondition } from './conditions';
import { eventAllowed, getEvent } from './select';
import { fill, renderText } from './text';
import type { GameState, ThreadDef } from './types';

export interface ThreadView {
  id: string;
  title: string;
  text: string;
  /** 選了會提高推進機率的方針。 */
  focuses: string[];
}

export interface AmbitionView {
  name: string;
  goal: string;
  done: boolean;
}

/**
 * 這條線現在選哪些方針能推進：推進事件此刻可以發生、且事件的 tags 與方針相符。
 * 與 select.ts 的方針加權規則相同，所以標示一定屬實；強制與排程事件不受方針影響，不會標示。
 */
export function threadFocuses(s: GameState, thread: ThreadDef): string[] {
  const tags = new Set(
    thread.advances
      .map(getEvent)
      .filter((e) => e.kind === 'normal' && !e.scheduledOnly && eventAllowed(s, e))
      .flatMap((e) => e.tags ?? []),
  );
  return CONTENT.focuses.filter((f) => f.tags.some((t) => tags.has(t))).map((f) => f.id);
}

export function activeThreads(s: GameState): ThreadView[] {
  return CONTENT.threads
    .filter((t) => checkCondition(s, t.conditions))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .map((t) => ({ id: t.id, title: fill(t.title, s), text: renderText(t.text, s), focuses: threadFocuses(s, t) }));
}

export function ambitionView(s: GameState): AmbitionView | undefined {
  const amb = s.player.ambition ? CONTENT.ambitions[s.player.ambition] : undefined;
  if (!amb) return undefined;
  return { name: amb.name, goal: amb.goal, done: checkCondition(s, amb.fulfilled) };
}
