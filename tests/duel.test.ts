import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import {
  CRIT, DUEL, canPlay, createDuel, deckFor, endRound, getCard, legacyDeck, playCard, resolvedEffect, yieldDuel, type Fighter,
} from '../src/engine/duel';
import { playSimpleRound } from '../src/engine/duelAI';
import { NODE, chooseOption, choiceViews, finishDuel, newGame } from '../src/engine/game';
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

/** 驗算數字的測試先關掉「打中部位」的運氣，測完還原。 */
const LUCK = { ...CRIT };
function noLuck() {
  beforeEach(() => Object.assign(CRIT, { base: 0, exposed: 0, needle: 0, sharpEye: 0, limb: 0, foe: 0 }));
  afterEach(() => Object.assign(CRIT, LUCK));
}

describe('打中部位', () => {
  afterEach(() => Object.assign(CRIT, LUCK));

  it('打中要害：這一招傷害 ×1.5，記進戰報', () => {
    Object.assign(CRIT, { base: 1, foe: 0 });
    let d = rigged('tourney', ['punch']);
    const hp = d.foe.hp;
    d = playCard(d, 0, new Rng(1));
    expect(d.lastSpot?.kind).toBe('crit');
    expect(hp - d.foe.hp).toBe(Math.round(5 * CRIT.mult));
    expect(d.stats?.crits).toBe(1);
  });

  it('打中手腕，對手下一擊變輕；打中膝彎，他露出破綻', () => {
    Object.assign(CRIT, { base: 0, exposed: 0, needle: 0, sharpEye: 0, limb: 1, foe: 0 });
    const seen = new Set<string>();
    for (let seed = 1; seed < 40 && seen.size < 2; seed++) {
      const d = playCard(rigged('tourney', ['punch']), 0, new Rng(seed));
      seen.add(d.lastSpot!.kind);
      if (d.lastSpot!.kind === 'wrist') expect(d.foe.intent.value).toBe(Math.floor(10 * CRIT.wrist));
      else expect(d.foe.exposed).toBeGreaterThan(0);
    }
    expect(seen).toEqual(new Set(['wrist', 'knee']));
  });

  it('對手也會打中你的要害', () => {
    Object.assign(CRIT, { foe: 1 });
    const d = endRound(rigged('tourney', []), new Rng(1));
    expect(d.foeCrit).toBe(1);
    expect(40 - d.me.hp).toBe(Math.round(10 * CRIT.mult));
  });
});

describe('牌庫', () => {
  it('舊存檔換算：主修武學依等級加入招式，4 級起升級，奇遇牌也算進去', () => {
    expect(legacyDeck(person({ hanjiang: 5 }))).toEqual(expect.arrayContaining(['hanjiang1', 'xietiao']));
    const lv4 = person({ hanjiang: 22 });
    lv4.flags.read_shen_letter = true;
    expect(legacyDeck(lv4)).toContain('hanjiang1+');
    expect(legacyDeck(lv4)).not.toContain('hanjiang1');
    expect(legacyDeck(lv4)).toContain('dudiao');
    expect(getCard('juma+').block).toBe(Math.round(getCard('juma').block! * DUEL.upgradeMult));
  });

  it('上場的牌 = 持久牌庫 + 受傷與血仇帶來的傷、心魔', () => {
    const s = person({ hanjiang: 5 });
    s.player.health = 20;
    s.flags.blood_feud = true;
    const deck = deckFor(s);
    expect(deck.slice(0, s.player.deck!.length)).toEqual(s.player.deck);
    expect(deck.filter((x) => x === 'wound')).toHaveLength(1);
    expect(deck).toContain('demon');
  });
});

describe('過招規則', () => {
  noLuck();
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
    // 健康就是血量：剩一半氣血，健康就剩一半
    expect(s.player.health).toBe(50 + NODE.winHeal); // 剩一半氣血，打贏再喘口氣
  });
});

describe('C3、C4：牌的新效果、心法、敵人的招式', () => {
  noLuck();
  it('反擊：傷害加上目前的護體；鎮守的護體留到下一回合', () => {
    let d = rigged('tourney', ['zhenshou', 'fanji'], { kind: 'guard', value: 1 });
    d = playCard(d, 0, new Rng(1));
    expect(resolvedEffect(d, getCard('fanji')).dmg).toBe(2 + 5);
    d = endRound(d, new Rng(1));
    expect(d.me.block).toBe(5);
  });

  it('首領氣血過半，換一套打法', () => {
    const d = createDuel(fighter(['punch', 'punch', 'punch', 'punch', 'punch']), 'scar_boss', 'x', new Rng(1));
    d.foe.hp = Math.floor(d.foe.max / 2) - 1;
    d.foe.intent = { kind: 'guard', value: 1 };
    const after = endRound(d, new Rng(1));
    expect(after.foe.phase2).toBe(true);
    expect(after.foe.rage).toBeGreaterThan(0);
  });

  it('對手發狠：往後每一擊都更重', () => {
    let d = rigged('tourney', [], { kind: 'enrage', value: 3 });
    d = endRound(d, new Rng(1));
    expect(d.foe.rage).toBe(3);
  });

  it('青衡心訣：每回合第一張〈劍〉傷害 +3', () => {
    const s = person({ qinghen: 5 });
    s.player.sect = 'qinghen';
    const d = createDuel({ ...fighter(['qhqi', 'qhqi', 'qhqi', 'qhqi', 'qhqi']) }, 'tourney', 'x', new Rng(1), s);
    expect(resolvedEffect(d, getCard('qhqi')).dmg).toBe(6 + 3);
    expect(d.me.passive?.names[0]).toContain('青衡心訣');
  });
});
