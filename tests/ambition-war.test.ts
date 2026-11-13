import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { playLife } from '../src/engine/autoplay';
import { newGame } from '../src/engine/game';
import { eventAllowed, forcedEvent, getEvent } from '../src/engine/select';
import type { GameState } from '../src/engine/types';

function person(age: number, region = 'jiangnan', birthYear = 1230): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region });
  s.player.birthYear = birthYear;
  s.player.age = age;
  s.prevYear = birthYear + age - 1;
  return s;
}

describe('立志', () => {
  it('除了報仇，每一種志向都看得到、選得了', () => {
    const e = getEvent('ambition');
    const shown = e.choices.filter((c) => !c.hidden).map((c) => c.id);
    for (const id of ['martial', 'chivalry', 'healer', 'wealth', 'nation', 'peace']) expect(shown).toContain(id);
    expect(e.choices.find((c) => c.id === 'revenge')!.hidden).toBe(true);
  });
});

describe('抗蒙的人物', () => {
  it('立志守國的人一定會遇到韓守義；有師門的人也見得到他，只是不能投軍', () => {
    const s = person(25);
    expect(eventAllowed(s, getEvent('xiangyang_militia'))).toBe(false);
    s.player.ambition = 'nation';
    expect(forcedEvent(s)?.id).toBe('xiangyang_militia');
    s.player.sect = 'qinghen';
    expect(eventAllowed(s, getEvent('xiangyang_militia'))).toBe(true);
    const enlist = getEvent('xiangyang_militia').choices.find((c) => c.id === 'enlist')!;
    expect(enlist.requires).toEqual({ hasSect: false });
  });

  it('投了義軍、人在襄陽的，城頭上一定會看見賀雲旗', () => {
    const s = person(1263 - 1230, 'xiangyang');
    s.flags.joined_yijun = true;
    expect(eventAllowed(s, getEvent('he_meet'))).toBe(true);
    expect(getEvent('he_meet').kind).toBe('forced');
  });
});

describe('結局：留下的東西', () => {
  it('一生裡記著風雲榜上最好的名次', () => {
    const r = playLife(4);
    expect(r.state.bestRank).toBeGreaterThanOrEqual(1);
  });
});
