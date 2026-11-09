import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { DUEL } from '../src/engine/duel';
import { NODE, chooseFocus, chooseOption, choiceViews, dueBoss, finishDuel, newGame, nextTurn } from '../src/engine/game';
import type { GameState } from '../src/engine/types';

/** 1260 年、沒有強制事件擋路、正在選方針的成年人。 */
function adult(): GameState {
  const s = newGame({ name: '測試', trait: 'guomu', seed: 3, background: 'farmer', region: 'jiangnan' });
  s.player.age = 1260 - s.player.birthYear;
  s.prevYear = 1259;
  s.player.health = 100;
  s.player.skills = { changquan: 12 };
  s.player.ambition = 'peace';
  s.flags = {};
  s.bosses = [2, 3, 4];
  for (const e of CONTENT.events) if (e.kind === 'forced') s.fired[e.id] = { count: 1, lastYear: 0 };
  s.phase = 'focus';
  return s;
}

/** 開打之後直接決定勝負，剩下 hpRatio 的氣血。 */
function endDuel(s: GameState, over: 'win' | 'lose' | 'yield', hpRatio: number): GameState {
  const d = s.duel!;
  return finishDuel({ ...s, duel: { ...d, over, me: { ...d.me, hp: Math.round(d.me.max * hpRatio) } } });
}

/** 暫時把習武的關卡權重固定，讓第二個關卡不受亂數影響。 */
function withWeights<T>(w: Record<string, number>, fn: () => T): T {
  const old = CONTENT.nodeWeights.martial;
  CONTENT.nodeWeights.martial = w;
  try {
    return fn();
  } finally {
    CONTENT.nodeWeights.martial = old;
  }
}

describe('關卡', () => {
  it('擲到小戰：先打一場，打完同一段日子再接劇情，時間不往前走', () => {
    let s = adult();
    s.upcoming = { focus: 'martial', node: 'fight' };
    s = withWeights({ story: 100 }, () => chooseFocus(s, 'martial'));
    expect(CONTENT.events.find((e) => e.id === s.current!.eventId)?.node?.tier).toBe('minor');
    expect(s.followUp).toBe(true);
    s = chooseOption(s, 'fight');
    s = endDuel(s, 'win', 0.6);
    expect(Math.abs(s.player.health - 60 - NODE.winHeal)).toBeLessThanOrEqual(1);
    expect(s.deckTasks?.[0].kind).toBe('pick');
    const age = s.player.age;
    s = nextTurn(s);
    expect(s.player.age).toBe(age);
    expect(s.followUp).toBeUndefined();
    expect(['event', 'result']).toContain(s.phase);
  });

  it('結果畫面會預告下一段日子的關卡', () => {
    let s = adult();
    s.upcoming = { focus: 'martial', node: 'insight' };
    s = withWeights({ insight: 100 }, () => chooseFocus(s, 'martial'));
    while (s.phase === 'event') s = chooseOption(s, choiceViews(s).find((c) => c.enabled && !c.duel)!.id);
    expect(s.upcoming?.focus).toBe('martial');
  });

  it('章末首領：進入新的一章時，打上一章的首領；每章只打一次', () => {
    const s = adult();
    s.player.age = 52; // 剛進晚年：打壯年的章末首領
    s.bosses = [2, 3];
    s.flags.blood_feud = true;
    expect(dueBoss(s)?.id).toBe('b_scar_revenge');
    expect(dueBoss(s)).toBeUndefined();
  });
});

describe('健康就是血量', () => {
  function duelWith(opponent: string): GameState {
    const s = adult();
    s.phase = 'event';
    s.current = { eventId: opponent === 'scar_boss' ? 'b_scar_revenge' : 'n_tourney', text: '' };
    s.flags.blood_feud = true;
    return chooseOption(s, 'fight');
  }

  it('開打時的氣血 = 上限 × 健康', () => {
    const s = adult();
    s.player.health = 50;
    s.phase = 'event';
    s.current = { eventId: 'n_tourney', text: '' };
    const d = chooseOption(s, 'fight').duel!;
    expect(d.me.hp).toBe(Math.round(d.me.max / 2));
  });

  it('比試輸了只是受傷，健康不會低於比試的底線', () => {
    const s = endDuel(duelWith('tourney'), 'lose', 0);
    expect(s.player.alive).toBe(true);
    expect(s.player.health).toBe(DUEL.sparFloor);
  });

  it('生死之戰：選項上有標示；輸了就死，突圍能活但傷得更重', () => {
    const s = adult();
    s.phase = 'event';
    s.current = { eventId: 'b_scar_revenge', text: '' };
    s.flags.blood_feud = true;
    expect(choiceViews(s).find((c) => c.id === 'fight')?.lethal).toBe(true);

    const dead = endDuel(duelWith('scar_boss'), 'lose', 0);
    expect(dead.player.alive).toBe(false);
    expect(dead.deathCause).toBe('duel');

    const fled = endDuel(duelWith('scar_boss'), 'yield', 0.4);
    expect(fled.player.alive).toBe(true);
    expect(Math.abs(fled.player.health - 25)).toBeLessThanOrEqual(1);
  });
});

describe('勝算提示', () => {
  it('算進健康：同一個對手，健康低的時候勝算比較差', () => {
    const s = adult();
    s.phase = 'event';
    s.current = { eventId: 'n_tourney', text: '' };
    const odds = () => choiceViews(s).find((c) => c.id === 'fight')?.odds;
    expect(odds()).toBe('有幾分把握');
    s.player.health = 20;
    expect(odds()).toBe('九死一生');
  });
});

describe('遊歷目的地與世界線', () => {
  it('指定目的地：直接到那裡；路遠多一場小戰', () => {
    const near = chooseFocus(adult(), 'travel', 'xiangyang');
    expect(near.player.region).toBe('xiangyang');
    expect(near.travelDest).toBe('xiangyang');
    const far = chooseFocus(adult(), 'travel', 'shu');
    expect(far.player.region).toBe('shu');
    // 第一個關卡一定是路上的小戰
    expect(CONTENT.events.find((e) => e.id === far.current!.eventId)?.node?.tier).toBe('minor');
    expect(() => chooseFocus(adult(), 'martial', 'shu')).toThrow();
  });

  it('開局擲出的世界線旗標只會是兩端的值', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const s = newGame({ name: '測試', trait: 'guomu', seed, background: 'farmer', region: 'jiangnan' });
      for (const k of Object.keys(s.flags)) if (k.startsWith('world_')) seen.add(k);
    }
    expect([...seen].every((k) => /^world_(xueyi_(rampant|quiet)|plague_(light|dire)|jianfu_(rise|fall))$/.test(k))).toBe(true);
    expect(seen.size).toBeGreaterThan(3);
  });
});
