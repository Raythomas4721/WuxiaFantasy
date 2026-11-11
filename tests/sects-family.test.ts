import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { checkCondition } from '../src/engine/conditions';
import { newGame } from '../src/engine/game';
import { eventAllowed, forcedEvent, getEvent } from '../src/engine/select';
import { renderText } from '../src/engine/text';
import type { GameEffect, GameState, OutcomeSpec } from '../src/engine/types';

function person(age: number, region = 'jiangnan'): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region });
  s.player.age = age;
  return s;
}

const effectsOf = (spec: OutcomeSpec | undefined): GameEffect[] => (Array.isArray(spec) ? spec : spec ? [spec] : []).flatMap((o) => o.effects ?? []);
/** 某個事件所有選項的成功（或唯一）結果裡排了哪些事。 */
const scheduledBy = (eventId: string, choiceId: string) => {
  const c = getEvent(eventId).choices.find((x) => x.id === choiceId)!;
  return [...effectsOf(c.outcome), ...effectsOf(c.check?.success), ...effectsOf(c.duel?.success)]
    .flatMap((e) => (e.type === 'schedule' ? [e.event] : []));
};

describe('入了門派之後有自己的事', () => {
  it('劍府、義軍、百衲會各有三件以上專屬的事', () => {
    for (const sect of ['qinghen', 'yijun', 'baina']) {
      const own = CONTENT.events.filter((e) => e.id.startsWith(`${sect}_`) && e.conditions?.sects?.includes(sect));
      expect(own.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('入門的那一刻就排好之後的事', () => {
    expect(scheduledBy('xiangyang_militia', 'enlist')).toEqual(expect.arrayContaining(['yijun_watch', 'yijun_squad']));
    expect(scheduledBy('baina_join', 'join')).toEqual(expect.arrayContaining(['baina_ears', 'baina_refugees']));
    const exam = getEvent('jianfu_exam');
    const all = exam.choices.flatMap((c) => [...effectsOf(c.outcome), ...effectsOf(c.check?.success), ...effectsOf(c.duel?.success)]);
    expect(all).toContainEqual(expect.objectContaining({ type: 'schedule', event: 'qinghen_junior' }));
  });

  it('不是這個門派的人遇不到', () => {
    const s = person(25);
    expect(eventAllowed(s, getEvent('qinghen_elders'))).toBe(false);
    s.player.sect = 'qinghen';
    expect(eventAllowed(s, getEvent('qinghen_elders'))).toBe(true);
    expect(eventAllowed(s, getEvent('baina_ears'))).toBe(false);
  });

  it('圍城時義軍一定遇到斷糧；有功勞的百衲會弟子一定等到傳衣', () => {
    const y = person(1269 - 1230, 'xiangyang');
    y.player.birthYear = 1230;
    y.player.sect = 'yijun';
    y.prevYear = 1268;
    y.fired.siege_xiangyang = { count: 1, lastYear: 1268 };
    expect(forcedEvent(y)?.id).toBe('yijun_grain');

    const b = person(1264 - 1230, 'xiangyang');
    b.player.birthYear = 1230;
    b.player.sect = 'baina';
    expect(eventAllowed(b, getEvent('baina_mantle'))).toBe(false);
    b.flags.sect_merit = 1;
    expect(eventAllowed(b, getEvent('baina_mantle'))).toBe(true);
    b.flags.baina_chief = true;
    expect(checkCondition(b, CONTENT.endings.find((e) => e.id === 'baina')!.conditions)).toBe(true);
  });
});

describe('成家之後', () => {
  it('成親就排好添丁與臨行；孩子出生就排好長大的那一天', () => {
    expect(scheduledBy('marriage', 'yes')).toEqual(expect.arrayContaining(['family_child', 'family_farewell']));
    expect(scheduledBy('marriage', 'companion')).toEqual(expect.arrayContaining(['family_child', 'family_farewell']));
    for (const c of getEvent('family_child').choices) expect(scheduledBy('family_child', c.id)).toContain('family_child_grown');
  });

  it('另一半：和玩伴成親的是玩伴的名字', () => {
    const s = person(30);
    s.flags.married = true;
    expect(renderText(getEvent('family_farewell').text, s)).toContain('家裡那口子');
    s.flags.married_companion = true;
    const text = renderText(getEvent('family_farewell').text, s);
    expect(text).toContain(s.companion.name);
    expect(text).not.toMatch(/[{}]/);
  });

  it('另一半走了之後，不再出現有他的事', () => {
    const s = person(50);
    s.flags.married = true;
    expect(eventAllowed(s, getEvent('family_sickbed'))).toBe(true);
    s.flags.spouse_passed = true;
    for (const id of ['family_sickbed', 'family_farewell', 'family_threat', 'family_child']) expect(eventAllowed(s, getEvent(id))).toBe(false);
  });

  it('把武藝傳給孩子，也算後繼有人', () => {
    const teach = getEvent('family_child_grown').choices.find((c) => c.id === 'teach')!;
    expect(effectsOf(teach.outcome)).toContainEqual(expect.objectContaining({ type: 'flag', key: 'has_disciple' }));
  });
});
