import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { opponents } from '../src/content/duel';
import { checkCondition } from '../src/engine/conditions';
import { dueBoss, newGame } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import { eventAllowed, getEvent } from '../src/engine/select';
import { renderText } from '../src/engine/text';
import type { GameState } from '../src/engine/types';

function person(age: number): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region: 'jiangnan' });
  s.player.age = age;
  return s;
}

describe('章末首領每一輪不一樣', () => {
  it('每一章都有三個以上尋常首領，各有絕技', () => {
    for (const stage of [2, 3, 4, 5]) {
      const generic = CONTENT.events.filter((e) => e.node?.tier === 'boss' && e.node.stage === stage && !e.priority && !e.conditions);
      expect(generic.length).toBeGreaterThanOrEqual(3);
      for (const e of generic) {
        const foe = e.choices.find((c) => c.duel)!.duel!.opponent;
        expect(opponents[foe].signature).toBeDefined();
      }
    }
  });

  it('沒有切身恩怨時隨機挑；有血仇時一定是疤臉', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const s = person(64);
      s.bosses = [2, 3, 4];
      seen.add(dueBoss(s, new Rng(seed))!.id);
    }
    expect(seen.size).toBe(3);

    const feud = person(52);
    feud.bosses = [2, 3];
    feud.flags.blood_feud = true;
    for (let seed = 1; seed <= 10; seed++) {
      const s = structuredClone(feud);
      expect(dueBoss(s, new Rng(seed))!.id).toBe('b_scar_revenge');
    }
  });

  it('冒名的人報的是你的名字', () => {
    const s = person(50);
    const text = renderText(getEvent('b_impostor').text, s);
    expect(text).toContain(s.player.name);
    expect(text).not.toMatch(/[{}]/);
  });
});

describe('鏢局線與晚年', () => {
  it('鏢局招人不限江南；陸平會回來邀你押鏢', () => {
    const s = person(20);
    s.player.region = 'shu';
    expect(eventAllowed(s, getEvent('escort_recruit'))).toBe(true);
    const drink = getEvent('old_friend_visit').choices.find((c) => c.id === 'drink')!;
    expect((drink.outcome as { effects: unknown[] }).effects).toContainEqual(expect.objectContaining({ type: 'schedule', event: 'escort_invite' }));
  });

  it('當上總鏢頭的人，結局是鏢行天下而不是宗師', () => {
    const rank = (id: string) => CONTENT.endings.find((e) => e.id === id)!.priority;
    expect(rank('biaoxing')).toBeGreaterThan(rank('zongshi'));
  });

  it('晚年的事五十歲以後才有；白頭要和玩伴有交情', () => {
    const young = person(40);
    young.relations.companion = 50;
    expect(eventAllowed(young, getEvent('late_companion'))).toBe(false);
    const old = person(56);
    expect(eventAllowed(old, getEvent('late_companion'))).toBe(false);
    old.relations.companion = 50;
    expect(eventAllowed(old, getEvent('late_companion'))).toBe(true);
    expect(checkCondition(old, getEvent('late_gratitude').conditions)).toBe(false);
    old.player.chivalry = 35;
    expect(checkCondition(old, getEvent('late_gratitude').conditions)).toBe(true);
  });
});
