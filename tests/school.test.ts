import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { DISCIPLE_TRAITS } from '../src/content/school';
import { autoDeckTask, playLife } from '../src/engine/autoplay';
import { checkCondition } from '../src/engine/conditions';
import { passivesFor } from '../src/engine/duel';
import { chooseOption, newGame } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import {
  SCHOOL, cleanName, foundSchool, giveName, rankings, recruitDisciple, schoolFame, tickSchool,
} from '../src/engine/school';
import { renderText } from '../src/engine/text';
import type { Disciple, GameState } from '../src/engine/types';

/** 走到「自成一家」那一刻。 */
function atOwnArt(): GameState {
  for (let seed = 1; seed <= 40; seed++) {
    const r = playLife(seed, { until: (s) => s.current?.eventId === 'own_art' });
    if (r.state.current?.eventId === 'own_art') return r.state;
  }
  throw new Error('找不到自成一家');
}

function founder(rule: 'open' | 'strict' | 'city' = 'open'): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 5, background: 'farmer', region: 'jiangnan' });
  s.player.age = 45;
  foundSchool(s, rule, new Rng(1));
  return s;
}

const disciple = (over: Partial<Disciple>): Disciple => ({
  id: 'x', name: '某甲', gengu: 5, trait: 'honest', origin: '', seen: true, joined: 1270, years: 0, status: 'training', ...over,
});

describe('自創武學', () => {
  it('自己取名；得到絕招、過招時多一層以武學命名的被動', () => {
    let s = chooseOption(atOwnArt(), 'create');
    const task = s.deckTasks!.find((t) => t.kind === 'name')!;
    expect(task.kind === 'name' && task.target).toBe('art');
    // 前面可能還有別的事（升級、心得），先處理掉
    while (s.deckTasks?.[0] && s.deckTasks[0].kind !== 'name') s = autoDeckTask(s);
    s = giveName(s, '  寒 江 孤 城 劍  ');
    expect(s.player.ownArt!.name).toBe('寒江孤城劍');
    expect(s.flags.own_art).toBe(true);
    expect(s.player.deck).toContain(s.player.ownArt!.ult);
    expect(passivesFor(s, CONTENT.opponents.bandits).names.some((n) => n.startsWith('寒江孤城劍'))).toBe(true);
    // 自創了，過幾年就有開宗立派的機會
    expect(s.scheduled.some((x) => x.event === 'found_school')).toBe(true);
  });

  it('名字最多八個字；空的就用建議的', () => {
    expect(cleanName('一二三四五六七八九十', '甲')).toBe('一二三四五六七八');
    expect(cleanName('   ', '歸一劍')).toBe('歸一劍');
  });
});

describe('開宗立派與弟子', () => {
  it('開宗：立門規、取名、開山第一批收兩個', () => {
    let s = founder('open');
    expect(s.deckTasks!.map((t) => t.kind)).toEqual(['name', 'recruit']);
    s = giveName(s, '不逃門');
    expect(s.school!.name).toBe('不逃門');
    const task = s.deckTasks![0];
    if (task.kind !== 'recruit') throw new Error('應該是收徒');
    expect(task.picks).toBe(2);
    expect(task.candidates.length).toBeGreaterThanOrEqual(3);
    for (const c of task.candidates) expect(c.gengu).toBeGreaterThanOrEqual(1);
    s = recruitDisciple(s, task.candidates[0].id);
    s = recruitDisciple(s, s.deckTasks![0].kind === 'recruit' ? s.deckTasks![0].candidates[0].id : null);
    expect(s.school!.disciples).toHaveLength(2);
    expect(s.deckTasks).toBeUndefined();
    expect(s.flags.has_disciple).toBe(true);
  });

  it('反骨藏著：悟性不夠看不穿', () => {
    expect(DISCIPLE_TRAITS.rebel.hidden).toBeDefined();
    const s = founder('open');
    const task = s.deckTasks![1];
    if (task.kind !== 'recruit') throw new Error('應該是收徒');
    for (const c of task.candidates) expect(c.seen).toBe(!DISCIPLE_TRAITS[c.trait].hidden || s.player.stats.wuxing >= SCHOOL.seeThroughWuxing);
  });

  it('根骨好的出師快、聲勢漲得多；大富大貴年年孝敬；反骨學了幾年會叛逃', () => {
    const s = founder();
    s.school!.disciples = [
      disciple({ id: 'a', gengu: 10, trait: 'gifted' }),
      disciple({ id: 'b', gengu: 3, trait: 'honest' }),
      disciple({ id: 'c', gengu: 4, trait: 'rich' }),
      disciple({ id: 'd', gengu: 7, trait: 'rebel' }),
    ];
    const money = s.player.money;
    const fame = schoolFame(s);
    tickSchool(s, 3, new Rng(2));
    const [a, b] = s.school!.disciples;
    expect(a.status).toBe('graduated');
    expect(b.status).toBe('training');
    expect(s.flags.school_star).toBe(true);
    expect(s.player.money).toBe(money + 30);
    expect(schoolFame(s)).toBeGreaterThan(fame + 10);
    expect(s.scheduled.some((x) => x.event === 'school_traitor')).toBe(true);
    expect(s.school!.spotlight).toBe('d');
    expect(renderText(CONTENT.events.find((e) => e.id === 'school_traitor')!.text, s)).toContain('某甲');
  });

  it('開宗就排好開山門、踢館、國難與傳人；聲勢夠了才是「開宗立派」結局', () => {
    const s = founder();
    for (const id of ['school_gate', 'school_challenge', 'school_heir']) expect(s.scheduled.some((x) => x.event === id)).toBe(true);
    const ending = CONTENT.endings.find((e) => e.id === 'kaizong')!;
    expect(checkCondition(s, ending.conditions)).toBe(false);
    s.flags.school_fame = 45;
    expect(checkCondition(s, ending.conditions)).toBe(true);
  });
});

describe('風雲榜', () => {
  it('名俠都在榜上；你的名次隨武學與名望往上爬', () => {
    const s = founder();
    s.player.fame = 0;
    const low = rankings(s).myRank;
    s.player.skills.changquan = 400;
    s.player.fame = 80;
    s.flags.own_art = true;
    expect(rankings(s).myRank).toBeLessThan(low);
    expect(rankings(s).rows.length).toBeLessThanOrEqual(11);
  });
});
