import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CRIT, createDuel, endRound, playCard, type Fighter } from '../src/engine/duel';
import { Rng } from '../src/engine/rng';
import type { DuelState } from '../src/engine/types';

const fighter = (deck: string[]): Fighter => ({ hp: 60, wuxing: 6, level: 2, deck });

function rigged(hand: string[], intent: DuelState['foe']['intent']): DuelState {
  const d = createDuel(fighter(['punch', 'punch', 'punch', 'punch', 'punch', 'parry', 'parry']), 'senior', 'x', new Rng(1));
  d.me.hand = hand;
  d.me.energy = 5;
  d.foe.intent = intent;
  d.foe.traps = [];
  d.foe.charge = 0;
  return d;
}

/** 不讓對手變招、不爆擊，只看點穴本身。 */
class Calm extends Rng {
  override next(): number {
    return 0.999999;
  }
}

const LUCK = { ...CRIT };
beforeEach(() => Object.assign(CRIT, { base: 0, exposed: 0, needle: 0, sharpEye: 0, limb: 0, foe: 0 }));
afterEach(() => Object.assign(CRIT, LUCK));

describe('拂星指', () => {
  it('點穴：對手這一招每一擊都減輕，下回合解開', () => {
    const d = rigged(['fx_dian'], { kind: 'combo', value: 6, hits: 2 });
    const hp = d.me.hp;
    const after = endRound(playCard(d, 0, new Calm(1)), new Calm(2));
    expect(hp - after.me.hp).toBe((6 - 3) * 2);
    expect(after.foe.sealed).toBe(0);
  });

  it('定身：對手這一招使不出來', () => {
    const d = rigged(['fx_ding'], { kind: 'attack', value: 15 });
    const hp = d.me.hp;
    const after = endRound(playCard(d, 0, new Calm(1)), new Calm(2));
    expect(after.me.hp).toBe(hp);
    expect(after.foe.stunned).toBe(false);
  });

  it('定身封不住絕技，只卸掉一半', () => {
    const d = rigged(['fx_ding'], { kind: 'attack', value: 20, sig: '鎮門一式' });
    const played = playCard(d, 0, new Calm(1));
    expect(played.foe.stunned).toBeFalsy();
    expect(played.foe.sealed).toBe(10);
  });

  it('解穴：移除一張「傷」，下一次點穴無效', () => {
    const d = rigged(['fx_jie'], { kind: 'drain', value: 4 });
    d.me.discard = ['wound', 'punch'];
    const played = playCard(d, 0, new Calm(1));
    expect(played.me.discard).not.toContain('wound');
    const after = endRound(played, new Calm(2));
    expect(after.me.energy).toBe(after.me.energyMax ?? 3);
  });
});
