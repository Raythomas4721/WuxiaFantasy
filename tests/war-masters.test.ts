import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { checkCondition } from '../src/engine/conditions';
import { newGame } from '../src/engine/game';
import { eventAllowed, forcedEvent, getEvent } from '../src/engine/select';
import type { GameEffect, GameState, OutcomeSpec } from '../src/engine/types';

function person(age: number, region = 'xiangyang', birthYear = 1230): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region });
  s.player.birthYear = birthYear;
  s.player.age = age;
  s.prevYear = birthYear + age - 1;
  return s;
}

const effectsOf = (spec: OutcomeSpec | undefined): GameEffect[] => (Array.isArray(spec) ? spec : spec ? [spec] : []).flatMap((o) => o.effects ?? []);
const outcomesOf = (eventId: string) =>
  getEvent(eventId).choices.flatMap((c) => [c.outcome, c.check?.success, c.check?.failure, c.duel?.success, c.duel?.failure].filter(Boolean).map((o) => ({ choice: c.id, effects: effectsOf(o) })));
const choiceEffects = (eventId: string, choiceId: string) => outcomesOf(eventId).filter((o) => o.choice === choiceId).flatMap((o) => o.effects);

describe('三位大師的武功', () => {
  it('洗塵功、渡江篙各有八張牌、三個境界各兩個心得', () => {
    for (const skill of ['xichen', 'dujiang']) {
      expect(CONTENT.skills[skill].kind).toBe('martial');
      expect(CONTENT.skillCards[skill]).toHaveLength(8);
      for (const id of CONTENT.skillCards[skill]) expect(CONTENT.cards[id]).toBeDefined();
      for (const level of [2, 3, 4]) expect(CONTENT.talents.filter((t) => t.skill === skill && t.level === level)).toHaveLength(2);
    }
    expect(CONTENT.cards.duanying.rarity).toBe('rare');
  });

  it('第一次相遇就排好學藝和後面的大事', () => {
    const scheduled = (id: string, choice: string) => choiceEffects(id, choice).flatMap((e) => (e.type === 'schedule' ? [e.event] : []));
    expect(scheduled('wuyan_meet', 'chores')).toEqual(expect.arrayContaining(['wuyan_teach', 'wuyan_gate']));
    expect(scheduled('ruan_meet', 'ask')).toEqual(expect.arrayContaining(['ruan_teach', 'ruan_run']));
    // 賀雲旗的夜談緊接在城下那一幕之後
    expect(choiceEffects('he_meet', 'ask')).toContainEqual({ type: 'chain', event: 'he_talk' });
    expect(choiceEffects('wuyan_teach', 'learn')).toContainEqual(expect.objectContaining({ type: 'skill', skill: 'xichen' }));
    expect(choiceEffects('ruan_teach', 'learn')).toContainEqual(expect.objectContaining({ type: 'skill', skill: 'dujiang' }));
    expect(choiceEffects('he_talk', 'listen')).toContainEqual(expect.objectContaining({ type: 'card', add: 'duanying' }));
  });

  it('不肯站船頭，阮青篙就不會再出現', () => {
    const s = person(40);
    s.relations.ruan_qinggao = 30;
    expect(eventAllowed(s, getEvent('ruan_run'))).toBe(true);
    s.flags.ruan_lost = true;
    s.flags.dead_ruan_qinggao = true;
    for (const id of ['ruan_run', 'ruan_teach', 'ruan_meet']) expect(eventAllowed(s, getEvent(id))).toBe(false);
  });
});

describe('襄陽最後的夜襲與崖山', () => {
  it('夜襲排在城破之前，而且每個結果都接著城破', () => {
    const s = person(43);
    expect(forcedEvent(s)?.id).toBe('burn_trebuchet');
    for (const o of outcomesOf('burn_trebuchet')) expect(o.effects).toContainEqual({ type: 'chain', event: 'siege_fall' });
  });

  it('熟水性的人、說動了賀雲旗的人，夜襲多一條路', () => {
    const e = getEvent('burn_trebuchet');
    const water = e.choices.find((c) => c.id === 'water')!;
    const password = e.choices.find((c) => c.id === 'password')!;
    const s = person(43);
    expect(water.hidden && password.hidden).toBe(true);
    expect(checkCondition(s, water.requires)).toBe(false);
    expect(checkCondition(s, password.requires)).toBe(false);
    s.flags.he_turned = true;
    expect(checkCondition(s, password.requires)).toBe(true);
  });

  it('1279 年人人都會聽到崖山；去了、渡了人的各有結局', () => {
    const s = person(49, 'jiangnan');
    expect(forcedEvent(s)?.id).toBe('yashan');
    const ending = (id: string) => CONTENT.endings.find((x) => x.id === id)!;
    expect(checkCondition(s, ending('yashan').conditions)).toBe(false);
    s.flags.at_yashan = true;
    // 光是去了不算；這場仗裡出過力的人才以崖山作結
    expect(checkCondition(s, ending('yashan').conditions)).toBe(false);
    s.flags.defended_city = true;
    expect(checkCondition(s, ending('yashan').conditions)).toBe(true);
    // 只在崖山渡過人不算「擺渡人」；衝過水寨的才是
    s.flags.ferried_refugees = true;
    expect(checkCondition(s, ending('baidu').conditions)).toBe(false);
    s.flags.ran_blockade = true;
    expect(checkCondition(s, ending('baidu').conditions)).toBe(true);
    // 崖山人人都會遇到，所以排在各條路自己的結局後面，免得蓋過它們
    for (const id of ['tiegu', 'zhiji', 'zongshi', 'renxin']) expect(ending(id).priority).toBeGreaterThan(ending('yashan').priority);
  });
});
