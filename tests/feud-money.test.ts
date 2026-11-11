import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { createDuel, fighterFor } from '../src/engine/duel';
import { withReputation } from '../src/engine/effects';
import { newGame } from '../src/engine/game';
import { buy } from '../src/engine/market';
import { Rng } from '../src/engine/rng';
import { allyRelation } from '../src/engine/talents';
import type { GameState } from '../src/engine/types';

function person(): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region: 'jiangnan' });
  s.player.skills = { changquan: 6 };
  s.player.health = 100;
  s.player.age = 20;
  return s;
}

const raid = CONTENT.events.find((e) => e.id === 'bandit_raid')!;
const effectsOf = (choice: string) => {
  const c = raid.choices.find((x) => x.id === choice)!;
  const o = c.duel?.success ?? c.outcome ?? c.check?.success;
  return (Array.isArray(o) ? o.flatMap((x) => x.effects) : o!.effects);
};

describe('疤臉會回來', () => {
  it('守住家門、交錢、逃走，疤臉幾年後都會回來', () => {
    for (const id of ['guard', 'pay', 'flee']) {
      expect(effectsOf(id)).toContainEqual(expect.objectContaining({ type: 'schedule', event: 'scar_return' }));
    }
  });

  it('疤臉回來之後，結下血仇，多年後找得到他', () => {
    const ret = CONTENT.events.find((e) => e.id === 'scar_return')!;
    for (const c of ret.choices) {
      const fx = (c.outcome as { effects: unknown[] }).effects;
      expect(fx).toContainEqual(expect.objectContaining({ type: 'flag', key: 'blood_feud' }));
      expect(fx).toContainEqual(expect.objectContaining({ type: 'schedule', event: 'revenge_chance' }));
    }
  });
});

describe('正邪', () => {
  it('沒人看見的善行，正邪也會上升（俠義的三分之一）', () => {
    expect(withReputation([{ type: 'chivalry', delta: 6 }])).toContainEqual({ type: 'alignment', delta: 2 });
  });

  it('正道中人：故人出手的交情門檻低 10', () => {
    const s = person();
    s.player.alignment = 25;
    expect(allyRelation(s, 40)).toBe(30);
  });
});

describe('錢買得到東西', () => {
  it('買了護心鏡，過招時氣血上限 +12', () => {
    const s = person();
    s.phase = 'result';
    s.player.money = 300;
    const before = fighterFor(s).hp;
    const after = buy(s, 'gear_huxin');
    expect(after.player.money).toBe(80);
    expect(fighterFor(after).hp).toBe(before + 12);
  });

  it('趁手的兵器帶進過招', () => {
    const s = person();
    s.player.items = ['gear_bingqi'];
    const d = createDuel(fighterFor(s), 'senior', 'x', new Rng(1), s);
    expect(d.me.passive?.attackBonus).toBe(1);
  });
});
