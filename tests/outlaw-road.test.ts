import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { encounterFoes, encounterPlaces } from '../src/content/encounters';
import { playLife } from '../src/engine/autoplay';
import { checkCondition } from '../src/engine/conditions';
import { newGame } from '../src/engine/game';
import { eventAllowed, getEvent } from '../src/engine/select';
import type { GameEffect, GameState, OutcomeSpec } from '../src/engine/types';

function person(age: number, region = 'jiangnan'): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region });
  s.player.age = age;
  return s;
}

const effectsOf = (spec: OutcomeSpec | undefined): GameEffect[] => (Array.isArray(spec) ? spec : spec ? [spec] : []).flatMap((o) => o.effects ?? []);
const choiceEffects = (eventId: string, choiceId: string) => {
  const c = getEvent(eventId).choices.find((x) => x.id === choiceId)!;
  return [...effectsOf(c.outcome), ...effectsOf(c.check?.success), ...effectsOf(c.duel?.success)];
};
const scheduledBy = (eventId: string, choiceId: string) => choiceEffects(eventId, choiceId).flatMap((e) => (e.type === 'schedule' ? [e.event] : []));

describe('路上的小戰', () => {
  it('組合式小戰用地點當標題，對手和地點都有十種以上', () => {
    expect(encounterFoes.length).toBeGreaterThanOrEqual(12);
    expect(encounterPlaces.length).toBeGreaterThanOrEqual(16);
    const names = encounterPlaces.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    const r = playLife(7, { until: (s) => s.current?.eventId === 'n_road' });
    expect(names).toContain(r.state.current?.title);
    expect(r.state.current!.text).not.toMatch(/[{}]/);
  });

  it('同一種對手很少連著來兩次', () => {
    let fights = 0;
    let repeats = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const minor = playLife(seed).duels.filter((d) => d.tier === 'minor' && d.opponent !== 'kid_bully');
      fights += minor.length;
      repeats += minor.filter((d, i) => i > 0 && d.opponent === minor[i - 1].opponent).length;
    }
    expect(fights).toBeGreaterThan(40);
    expect(repeats / fights).toBeLessThan(0.05);
  });
});

describe('邪道走得到', () => {
  it('走偏了的人一定會等到無面客；入樓就排好之後的事', () => {
    const e = getEvent('xueyi_invite');
    expect(e.kind).toBe('forced');
    const s = person(25);
    s.player.birthYear = 1220;
    s.player.alignment = -10;
    expect(eventAllowed(s, e)).toBe(false);
    s.player.alignment = -20;
    expect(eventAllowed(s, e)).toBe(true);
    expect(scheduledBy('xueyi_invite', 'join')).toEqual(expect.arrayContaining(['xueyi_contract', 'xueyi_rival']));
    expect(scheduledBy('xueyi_contract', 'do')).toContain('xueyi_contract');
  });

  it('做成兩單的人會等到第二張面具', () => {
    const s = person(30);
    s.player.sect = 'xueyi';
    s.flags.xueyi_kills = 1;
    expect(eventAllowed(s, getEvent('xueyi_mask'))).toBe(false);
    s.flags.xueyi_kills = 2;
    expect(eventAllowed(s, getEvent('xueyi_mask'))).toBe(true);
  });

  it('打倒黑風寨寨主之後，寨裡的人會來請你；坐上交椅就有後面的事和結局', () => {
    expect(scheduledBy('n_black_wind', 'fight')).toContain('blackwind_seat');
    expect(scheduledBy('blackwind_seat', 'take')).toEqual(expect.arrayContaining(['blackwind_toll', 'blackwind_siege']));
    const ending = CONTENT.endings.find((x) => x.id === 'shanwang')!;
    const s = person(40);
    expect(checkCondition(s, ending.conditions)).toBe(false);
    s.flags.bandit_lord = true;
    expect(checkCondition(s, ending.conditions)).toBe(true);
    expect(eventAllowed(s, getEvent('blackwind_seat'))).toBe(false);
    // 下山投降、受招安的人不再是寨主
    for (const id of ['surrender', 'amnesty']) {
      expect(choiceEffects('blackwind_siege', id)).toContainEqual({ type: 'flag', key: 'bandit_lord', value: false });
    }
    s.flags.bandit_lord = false;
    expect(checkCondition(s, ending.conditions)).toBe(false);
  });
});

describe('成家的事遇得到', () => {
  it('成親就排好「門上的刀」；說了「別等我」的人也會遇到歸家', () => {
    expect(scheduledBy('marriage', 'yes')).toContain('family_threat');
    expect(scheduledBy('family_farewell', 'promise')).toContain('family_return');
    expect(scheduledBy('family_farewell', 'cold')).toContain('family_return');
  });
});
