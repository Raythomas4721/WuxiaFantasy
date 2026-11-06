import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { playLife } from '../src/engine/autoplay';
import {
  DECK, canUpgrade, ensureDeck, pickCard, removeBlocked, removeCard, rewardPool, startingDeck, upgradeCard,
} from '../src/engine/deck';
import { DUEL, REALM, canPlay, createDuel, fighterFor, getCard, legacyDeck, playCard } from '../src/engine/duel';
import { chooseFocus, chooseOption, finishDuel, newGame } from '../src/engine/game';
import { applyEffects } from '../src/engine/effects';
import { Rng } from '../src/engine/rng';
import type { GameState } from '../src/engine/types';

function person(trait = 'guomu', background = 'farmer'): GameState {
  const s = newGame({ name: '測試', trait, seed: 3, background, region: 'jiangnan' });
  s.player.health = 100;
  s.flags = {};
  return s;
}

/** 剛打完一場過招、還沒收招。 */
function afterDuel(won: boolean): GameState {
  let s = person();
  s.player.skills = { changquan: 5 };
  s.player.age = 16;
  s.phase = 'event';
  s.current = { eventId: 'tournament', text: '' };
  s = chooseOption(s, 'fight');
  return { ...s, duel: { ...s.duel!, over: won ? 'win' : 'lose', me: { ...s.duel!.me, used: ['changquan'] } } };
}

describe('起手牌庫', () => {
  it('基本 8 張，加上出身與先天特質各一張', () => {
    const s = person('guomu', 'farmer');
    expect(s.player.deck).toHaveLength(10);
    expect(s.player.deck).toEqual(expect.arrayContaining(['biandan', 'kanpo']));
    expect(s.player.deck!.filter((x) => x === 'punch')).toHaveLength(4);
    expect(startingDeck('merchant', 'jingu')).toEqual(expect.arrayContaining(['qiantong', 'tiebushan']));
  });

  it('童年的選擇會換掉牌：抓週抓了木劍，一張出拳換成拚命', () => {
    let s = person();
    s.phase = 'event';
    s.current = { eventId: 'zhuazhou', text: '' };
    s = chooseOption(s, 'sword');
    expect(s.player.deck).toContain('pinming');
    expect(s.player.deck!.filter((x) => x === 'punch')).toHaveLength(3);
    expect(s.player.deck).toHaveLength(10);
  });

  it('舊存檔沒有牌庫：用武學等級換算一副', () => {
    const s = person();
    s.player.skills = { hanjiang: 12 };
    delete s.player.deck;
    expect(ensureDeck(s).player.deck).toEqual(legacyDeck(s));
  });
});

describe('入門選招', () => {
  it('武學第一次入門時，從該門三招裡挑兩張', () => {
    let s = person();
    applyEffects(s, [{ type: 'skill', skill: 'shoucheng', xp: 2 }], new Rng(1));
    const task = s.deckTasks![0];
    expect(task).toMatchObject({ kind: 'pick', picks: 2, options: CONTENT.skillCards.shoucheng });
    s = pickCard(s, 'juma');
    expect(s.deckTasks![0]).toMatchObject({ picks: 1, options: ['huima', 'qiangzhen'] });
    s = pickCard(s, 'huima');
    expect(s.deckTasks).toBeUndefined();
    expect(s.player.deck).toEqual(expect.arrayContaining(['juma', 'huima']));
    // 已經入門的武學再加經驗，不會再選一次
    applyEffects(s, [{ type: 'skill', skill: 'shoucheng', xp: 5 }], new Rng(1));
    expect(s.deckTasks).toBeUndefined();
  });
});

describe('戰後選牌', () => {
  it('打贏了三選一；獎勵池只有已入門的武學與奇招', () => {
    const s = finishDuel(afterDuel(true));
    const task = s.deckTasks?.at(-1);
    expect(task?.kind).toBe('pick');
    if (task?.kind !== 'pick') return;
    expect(task.options).toHaveLength(DECK.rewardOptions);
    expect(new Set(task.options).size).toBe(DECK.rewardOptions);
    const allowed = new Set([...CONTENT.skillCards.changquan, ...CONTENT.commonCards]);
    expect(task.options.every((id) => allowed.has(id))).toBe(true);
    expect(rewardPool(s).some((x) => CONTENT.skillCards.hanjiang.includes(x.id))).toBe(false);

    const picked = pickCard(s, task.options[0]);
    expect(picked.player.deck).toHaveLength(s.player.deck!.length + 1);
    expect(picked.result?.gains.at(-1)).toContain(getCard(task.options[0]).name);
  });

  it('跳過選牌拿 10 文；打輸了沒有選牌', () => {
    const s = finishDuel(afterDuel(true));
    expect(pickCard(s, null).player.money).toBe(s.player.money + DECK.skipMoney);
    expect(finishDuel(afterDuel(false)).deckTasks).toBeUndefined();
  });

  it('用什麼就精什麼：打出過長拳的牌，長拳經驗 +1', () => {
    const before = afterDuel(false);
    expect(finishDuel(before).player.skills.changquan).toBe(before.player.skills.changquan + DECK.duelXp);
  });
});

describe('修心與閉關', () => {
  it('休養時可以修心刪一張牌，代價是健康', () => {
    let s = person();
    s.player.age = 20;
    s.phase = 'focus';
    s = chooseFocus(s, 'rest');
    expect(s.deckTasks?.[0].kind).toBe('remove');
    const health = s.player.health;
    const after = removeCard(s, 0);
    expect(after.player.deck).toHaveLength(s.player.deck!.length - 1);
    expect(after.player.health).toBe(health - DECK.meditateHealth);
    // 不刪也可以，什麼都不變
    expect(removeCard(s, null).player.deck).toEqual(s.player.deck);
  });

  it('牌庫不能刪到少於 8 張', () => {
    const s = person();
    s.player.deck = s.player.deck!.slice(0, DECK.minDeck);
    s.deckTasks = [{ kind: 'remove', title: '', text: '', cost: {} }];
    expect(removeBlocked(s)).toBeDefined();
    expect(() => removeCard(s, 0)).toThrow();
  });

  it('升級：登堂入室以前每張牌只能升一次，之後能升兩次', () => {
    const s = person();
    s.player.skills = { changquan: 1 };
    expect(canUpgrade(s, 'punch')).toBe(true);
    expect(canUpgrade(s, 'punch+')).toBe(false);
    s.player.skills = { changquan: 5 };
    expect(canUpgrade(s, 'punch+')).toBe(true);
    expect(canUpgrade(s, 'punch++')).toBe(false);
    expect(canUpgrade(s, 'wound')).toBe(false);

    s.deckTasks = [{ kind: 'upgrade', title: '', text: '' }];
    const i = s.player.deck!.indexOf('punch');
    expect(upgradeCard(s, i).player.deck![i]).toBe('punch+');
  });

  it('沒有數值可加的牌，升級改成少花內力或多抽一張', () => {
    expect(getCard('xieli+').cost).toBe(0);
    expect(getCard('breathe+').draw).toBe(1);
    expect(getCard('punch++').dmg).toBe(Math.round(Math.round(5 * DUEL.upgradeMult) * DUEL.upgradeMult));
    expect(getCard('punch++').name).toBe('出拳＋＋');
  });
});

describe('境界', () => {
  it('境界決定內力與氣血上限', () => {
    const s = person();
    s.player.skills = { changquan: 12 }; // 爐火純青
    const f = fighterFor(s);
    expect(f.hp).toBe(30 + s.player.stats.gengu * 2 + REALM[3].hp);
    const d = createDuel(f, 'tourney', 'x', new Rng(1));
    expect(d.me.energy).toBe(4);
    expect(d.me.energyMax).toBe(4);
  });

  it('錢可通神：身上沒錢打不出去，打了收招時扣錢', () => {
    const s = person('guomu', 'merchant');
    const d = createDuel({ ...fighterFor(s), money: 3 }, 'tourney', 'x', new Rng(1));
    d.me.hand = ['qiantong'];
    expect(canPlay(d, 0)).toBe(false);
    const rich = { ...d, me: { ...d.me, money: 50 } };
    expect(playCard(rich, 0, new Rng(1)).me.spent).toBe(5);
  });
});

describe('自動遊玩', () => {
  it('同樣的種子，牌庫也一樣；結局時牌庫有長大', () => {
    const a = playLife(11, { preferDuel: true });
    const b = playLife(11, { preferDuel: true });
    expect(a.state.player.deck).toEqual(b.state.player.deck);
    expect(a.state.player.deck!.length).toBeGreaterThanOrEqual(10);
  });
});
