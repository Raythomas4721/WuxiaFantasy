import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { createDuel, endRound, fighterFor } from '../src/engine/duel';
import { newGame } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import { allyRelation, perk2 } from '../src/engine/talents';
import type { GameState } from '../src/engine/types';

function person(stats: Partial<GameState['player']['stats']>): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region: 'jiangnan' });
  s.player.skills = { changquan: 6 };
  s.player.health = 100;
  s.player.talents = [];
  Object.assign(s.player.stats, { gengu: 5, danshi: 5, xinxing: 5, fuyuan: 5, meili: 5 }, stats);
  return s;
}

describe('屬性第二階（10 點起）', () => {
  it('沒到 10 沒有第二階；10 起每點再加強', () => {
    const s = person({ gengu: 9, danshi: 10, xinxing: 12 });
    expect(perk2(s, 'gengu')).toBe(0);
    expect(perk2(s, 'danshi')).toBe(1);
    expect(perk2(s, 'xinxing')).toBe(3);
  });

  it('根骨、膽識、心性、福緣帶進過招', () => {
    const s = person({ gengu: 11, danshi: 10, xinxing: 11, fuyuan: 10 });
    const d = createDuel(fighterFor(s), 'senior', 'x', new Rng(1), s);
    const p = d.me.passive!;
    expect(p.regen).toBe(3);
    expect(p.desperateBonus).toBe(3);
    expect(p.curseNoHp).toBe(1);
    expect(p.resist).toBe(2); // 7 點一次 + 11 點多一次
    expect(p.critBonus).toBeCloseTo(0.05);
  });

  it('根骨 10：下一回合開始回氣血，不超過上限', () => {
    const s = person({ gengu: 10 });
    const d = createDuel(fighterFor(s), 'senior', 'x', new Rng(1), s);
    d.me.hp = d.me.max - 30;
    d.foe.intent = { kind: 'guard', value: 0 };
    d.foe.traps = [];
    const next = endRound(d, new Rng(2));
    expect(next.me.hp).toBe(d.me.max - 30 + 2);
  });

  it('心性 10：抽到「傷」「心魔」不扣氣血', () => {
    const s = person({ xinxing: 10 });
    const d = createDuel(fighterFor(s), 'senior', 'x', new Rng(1), s);
    d.foe.intent = { kind: 'guard', value: 0 };
    d.foe.traps = [];
    d.me.deck = [...d.me.deck, 'wound', 'demon', 'demon'];
    d.me.hand = [];
    const hp = d.me.hp;
    const next = endRound(d, new Rng(2));
    expect(next.me.hp).toBe(hp);
  });

  it('魅力 10：故人出手的交情門檻從 40 降到 25，之後每點再低 3', () => {
    expect(allyRelation(person({ meili: 9 }), 40)).toBe(40);
    expect(allyRelation(person({ meili: 10 }), 40)).toBe(25);
    expect(allyRelation(person({ meili: 12 }), 40)).toBe(19);
    expect(allyRelation(person({ meili: 15 }), 40)).toBe(10);
  });
});
