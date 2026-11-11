import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { playLife } from '../src/engine/autoplay';
import { canQuickDuel, duelQuick, finishDuel, newGame, timeStep } from '../src/engine/game';
import { eventAllowed, getEvent } from '../src/engine/select';
import type { GameState } from '../src/engine/types';

/** 找一場正在打的過招：tier 是關卡種類。 */
function duelOf(tier: string, lethal = false): GameState {
  for (let seed = 1; seed <= 80; seed++) {
    const r = playLife(seed, {
      until: (s) => s.phase === 'duel' && getEvent(s.current!.eventId).node?.tier === tier && Boolean(s.duel?.lethal) === lethal,
    });
    if (r.state.phase === 'duel') return r.state;
  }
  throw new Error(`找不到 ${tier} 的過招`);
}

describe('速戰速決', () => {
  it('不比你強的小戰可以速戰速決，打完停在結局', () => {
    let s: GameState | undefined;
    for (let seed = 1; seed <= 80 && !s; seed++) {
      const r = playLife(seed, { until: (x) => canQuickDuel(x) });
      if (r.state.phase === 'duel') s = r.state;
    }
    expect(s).toBeDefined();
    const done = duelQuick(s!);
    expect(done.phase).toBe('duel');
    expect(done.duel!.over).toBeDefined();
    expect(canQuickDuel(done)).toBe(false);
    expect(finishDuel(done).phase).toBe('result');
  });

  it('首領戰不能速戰速決', () => {
    const s = duelOf('boss');
    expect(canQuickDuel(s)).toBe(false);
    expect(() => duelQuick(s)).toThrow();
  });
});

describe('童年', () => {
  const kid = (age: number, background: string, region: string) => {
    const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background, region });
    s.player.age = age;
    return s;
  };

  it('七歲以前每兩年一段日子，多一件幼年的事', () => {
    expect(timeStep(kid(0, 'farmer', 'jiangnan'))).toBe(2);
    expect(eventAllowed(kid(4, 'farmer', 'jiangnan'), getEvent('kid_lost'))).toBe(true);
    expect(eventAllowed(kid(9, 'farmer', 'jiangnan'), getEvent('kid_lost'))).toBe(false);
  });

  it('出身、出生地不同，童年的事也不同', () => {
    expect(eventAllowed(kid(9, 'farmer', 'jiangnan'), getEvent('kid_famine'))).toBe(true);
    expect(eventAllowed(kid(9, 'merchant', 'jiangnan'), getEvent('kid_famine'))).toBe(false);
    expect(eventAllowed(kid(9, 'merchant', 'jiangnan'), getEvent('kid_ledger'))).toBe(true);
    expect(eventAllowed(kid(9, 'farmer', 'xiangyang'), getEvent('kid_wall'))).toBe(true);
    expect(eventAllowed(kid(9, 'farmer', 'xiangyang'), getEvent('kid_flood'))).toBe(false);
  });

  it('兒時玩伴的相遇有好幾種場面', () => {
    const openings = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const r = playLife(seed, { until: (s) => s.current?.eventId === 'meet_companion' });
      if (r.state.current?.eventId === 'meet_companion') {
        expect(r.state.current.text).not.toMatch(/[{}]/);
        openings.add(r.state.current.text.slice(0, 4));
      }
    }
    expect(openings.size).toBeGreaterThanOrEqual(3);
  });
});
