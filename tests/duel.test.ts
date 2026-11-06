import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import {
  DUEL, canPlay, createDuel, deckFor, endRound, getCard, playCard, resolvedEffect, yieldDuel, type Fighter,
} from '../src/engine/duel';
import { playSimpleRound } from '../src/engine/duelAI';
import { chooseOption, choiceViews, finishDuel, newGame } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import type { DuelState, GameState } from '../src/engine/types';

function person(skills: Record<string, number> = {}): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region: 'jiangnan' });
  s.player.skills = skills;
  s.player.health = 100;
  s.flags = {};
  return s;
}

const fighter = (deck: string[], wuxing = 6): Fighter => ({ hp: 40, wuxing, level: 2, deck });

/** 一場手牌、意圖都指定好的過招。 */
function rigged(opponent: string, hand: string[], intent: DuelState['foe']['intent'] = { kind: 'attack', value: 10 }): DuelState {
  const d = createDuel(fighter(['punch', 'punch', 'punch', 'punch', 'punch', 'parry', 'parry']), opponent, 'x', new Rng(1));
  d.me.hand = hand;
  d.foe.intent = intent;
  d.foe.traps = [];
  return d;
}

describe('牌庫', () => {
  it('主修武學依等級加入招式，4 級起升級', () => {
    expect(deckFor(person({ hanjiang: 5 }))).toEqual(expect.arrayContaining(['hanjiang1', 'xietiao']));
    const lv4 = deckFor(person({ hanjiang: 22 }));
    expect(lv4).toContain('hanjiang1+');
    expect(lv4).not.toContain('hanjiang1');
    expect(getCard('juma+').block).toBe(Math.round(getCard('juma').block! * DUEL.upgradeMult));
  });

  it('受傷、血仇與奇遇會改變牌庫', () => {
    const s = person({ hanjiang: 5 });
    s.player.health = 40;
    s.flags.blood_feud = true;
    s.flags.read_shen_letter = true;
    const deck = deckFor(s);
    expect(deck.filter((x) => x === 'wound')).toHaveLength(1);
    expect(deck).toContain('demon');
    expect(deck).toContain('dudiao');
  });
});

describe('過招規則', () => {
  it('同樣的種子打出同樣的過招', () => {
    const run = () => {
      const rng = new Rng(42);
      let d = createDuel(fighter(deckFor(person({ changquan: 5 }))), 'tourney', 'x', rng);
      for (let i = 0; i < 30 && !d.over; i++) d = playSimpleRound(d, rng);
      return d;
    };
    expect(run()).toEqual(run());
    expect(run().over).toBeDefined();
  });

  it('開場抽 5 張，打出去的牌扣內力', () => {
    const d = createDuel(fighter(deckFor(person({ changquan: 5 }))), 'tourney', 'x', new Rng(7));
    expect(d.me.hand).toHaveLength(DUEL.startHand);
    const r = rigged('tourney', ['punch']);
    const after = playCard(r, 0, new Rng(1));
    expect(after.me.energy).toBe(DUEL.energy - 1);
    expect(after.foe.hp).toBe(r.foe.hp - 5);
  });

  it('連招：紮馬之後的拳更重，連環拳越打越重', () => {
    let d = rigged('tourney', ['zhama', 'chongquan', 'lianhuan']);
    d = playCard(d, 0, new Rng(1));
    expect(resolvedEffect(d, getCard('chongquan')).dmg).toBe(10 + 3);
    d = playCard(d, 0, new Rng(1));
    // 這回合已出過一張〈拳〉（衝拳），紮馬是〈守〉
    expect(resolvedEffect(d, getCard('lianhuan')).dmg).toBe(4 + 3);
  });

  it('讀招：對手要出手時，寒江一式更重', () => {
    expect(resolvedEffect(rigged('tourney', [], { kind: 'attack', value: 10 }), getCard('hanjiang1')).dmg).toBe(10);
    expect(resolvedEffect(rigged('tourney', [], { kind: 'guard', value: 6 }), getCard('hanjiang1')).dmg).toBe(6);
  });

  it('伏招：蓋著不生效，對手出手時才發動', () => {
    let d = rigged('scar_young', ['huima']);
    d = playCard(d, 0, new Rng(1));
    expect(d.me.traps).toEqual(['huima']);
    const foeHp = d.foe.hp;
    d = endRound(d, new Rng(1));
    expect(d.me.traps).toEqual([]);
    expect(d.foe.hp).toBe(foeHp - 7);
    // 回馬槍給了 4 點護體，所以只吃 6 點
    expect(d.me.hp).toBe(40 - 6);
  });

  it('伏招最多蓋兩張', () => {
    let d = rigged('tourney', ['xieli', 'huima', 'raobu']);
    d.me.energy = 5;
    d = playCard(d, 0, new Rng(1));
    d = playCard(d, 0, new Rng(1));
    expect(canPlay(d, 0)).toBe(false);
  });

  it('對手的暗招：一回合出第三張攻擊牌，疤臉反手一刀', () => {
    let d = rigged('scar_young', ['punch', 'punch', 'punch']);
    d.foe.traps = [{ id: 'fanshou', used: false }];
    d = playCard(d, 0, new Rng(1));
    d = playCard(d, 0, new Rng(1));
    expect(d.me.hp).toBe(40);
    d = playCard(d, 0, new Rng(1));
    expect(d.me.hp).toBe(40 - 8);
    expect(d.foe.traps[0].used).toBe(true);
  });

  it('撒土破除暗招', () => {
    let d = rigged('scar_young', ['satu', 'punch', 'punch', 'punch']);
    d.me.energy = 3;
    d.foe.traps = [{ id: 'fanshou', used: false }];
    for (let i = 0; i < 4; i++) d = playCard(d, 0, new Rng(1));
    expect(d.me.hp).toBe(40);
  });

  it('傷抽到時發作：少一點內力，然後補抽', () => {
    let d = rigged('tourney', []);
    d.me.deck = ['punch', 'wound'];
    d.me.discard = [];
    d = endRound({ ...d, foe: { ...d.foe, intent: { kind: 'guard', value: 1 } } }, new Rng(1));
    expect(d.me.hand).toEqual(['punch']);
    expect(d.me.energy).toBe(DUEL.energy - 1);
    expect(d.me.discard).toContain('wound');
  });

  it('點到為止：六回合後比剩下的氣血比例', () => {
    let d = rigged('tourney', [], { kind: 'guard', value: 1 });
    d.round = DUEL.maxRounds;
    d.foe.hp = d.foe.max - 1;
    d = endRound(d, new Rng(1));
    expect(d.over).toBe('win');
  });

  it('認輸', () => {
    expect(yieldDuel(rigged('tourney', [])).over).toBe('yield');
  });
});

describe('事件裡的過招', () => {
  it('選了過招的選項就開打，打完走成功或失敗的結果', () => {
    let s = person({ changquan: 5 });
    s.player.age = 16;
    s.phase = 'event';
    s.current = { eventId: 'tournament', text: '' };
    const view = choiceViews(s).find((c) => c.id === 'fight')!;
    expect(view.duel).toBe(true);
    expect(view.odds).toBeDefined();

    s = chooseOption(s, 'fight');
    expect(s.phase).toBe('duel');
    expect(s.duel?.opponent).toBe('tourney');

    s = finishDuel({ ...s, duel: { ...s.duel!, over: 'win', me: { ...s.duel!.me, hp: s.duel!.me.max / 2 } } });
    expect(s.phase).toBe('result');
    expect(s.result?.check).toBe('success');
    expect(s.flags.won_tournament).toBe(true);
    expect(s.player.health).toBe(100 - DUEL.healthLoss / 2);
  });
});
