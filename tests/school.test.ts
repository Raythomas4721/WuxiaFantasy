import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { DISCIPLE_CHARACTERS } from '../src/content/school';
import { autoDeckTask, playLife } from '../src/engine/autoplay';
import { checkCondition } from '../src/engine/conditions';
import { passivesFor } from '../src/engine/duel';
import { chooseOption, newGame } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import {
  STARS, birthOf, characterOf, cleanName, foundSchool, giveName, playerPower, rankings, recruitDisciple, schoolFame, seesThrough,
  setDiscipleStatus, shownCharacter, tickSchool, tickStars,
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
  id: 'x', name: '某甲', gengu: 5, birth: 'poor', character: 'ordinary', origin: '', seen: true, joined: 1270, years: 0, progress: 0, status: 'training', ...over,
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

  it('根骨、出身、品性分開抽：藏著的品性看起來是另一個樣子，要對的屬性才看得穿', () => {
    const s = founder('open');
    const task = s.deckTasks![1];
    if (task.kind !== 'recruit') throw new Error('應該是收徒');
    for (const c of task.candidates) {
      expect(c.birth).toBeDefined();
      expect(c.character).toBeDefined();
      expect(c.seen).toBe(seesThrough(s, characterOf(c)));
    }
    const liar = disciple({ character: 'liar', seen: false });
    expect(shownCharacter(liar).name).toBe('能說會道');
    const traitor = disciple({ character: 'treacherous', seen: false });
    expect(shownCharacter(traitor).name).toBe('勤奮好學');
    s.player.stats.wuxing = 5;
    s.player.stats.meili = 10;
    expect(seesThrough(s, DISCIPLE_CHARACTERS.liar)).toBe(true);
    expect(seesThrough(s, DISCIPLE_CHARACTERS.treacherous)).toBe(false);
  });

  it('根骨奇佳卻不學無術：學得比根骨平平的還慢；舊存檔的弟子換算得過來', () => {
    const s = founder();
    s.school!.disciples = [
      disciple({ id: 'a', gengu: 10, character: 'lazy' }),
      disciple({ id: 'b', gengu: 5, character: 'respectful' }),
    ];
    s.flags.school_trouble = 99; // 先不讓它惹事
    tickSchool(s, 6, new Rng(3));
    const [a, b] = s.school!.disciples;
    expect(b.status).toBe('graduated');
    expect(a.status).toBe('training');
    const old = disciple({ birth: undefined, character: undefined, trait: 'rebel' });
    expect(characterOf(old).id).toBe('treacherous');
    expect(birthOf(old).id).toBe('orphan');
  });

  it('根骨好的出師快、聲勢漲得多；大富大貴年年孝敬', () => {
    const s = founder();
    s.school!.disciples = [
      disciple({ id: 'a', gengu: 10 }),
      disciple({ id: 'b', gengu: 3 }),
      disciple({ id: 'c', gengu: 4, birth: 'rich' }),
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
  });

  it('品性惹事：一次一件，一生有上限', () => {
    const s = founder();
    s.school!.disciples = [disciple({ id: 'a', character: 'violent' }), disciple({ id: 'b', character: 'lazy' })];
    tickSchool(s, 2, new Rng(4));
    const troubles = ['school_brawl', 'school_lazy'].filter((id) => s.flags[`due_${id}`]);
    expect(troubles).toHaveLength(1);
    expect(renderText(CONTENT.events.find((e) => e.id === troubles[0])!.text, s)).toContain('某甲');
  });

  it('欺師滅祖：偷學、叛逃，幾年後回來奪位；叛徒在風雲榜上一年比一年高', () => {
    const s = founder();
    s.school!.disciples = [disciple({ id: 't', name: '某乙', gengu: 8, character: 'treacherous', seen: false })];
    tickSchool(s, 1, new Rng(5));
    expect(s.flags.due_school_peek).toBe(true);
    s.flags.due_school_peek = false;
    tickSchool(s, 3, new Rng(5));
    expect(s.flags.due_school_traitor).toBe(true);
    s.school!.spotlight = 't';
    setDiscipleStatus(s, 'betrayed');
    const before = rankings(s).rows.find((r) => r.kind === 'traitor')!.power;
    s.player.age += 4;
    const after = rankings(s).rows.find((r) => r.kind === 'traitor')!.power;
    expect(after).toBeGreaterThan(before);
    tickSchool(s, 0, new Rng(5));
    expect(s.flags.due_school_usurp).toBe(true);
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
  it('出師的弟子上榜；超過師父時排好「青出於藍」', () => {
    const s = founder();
    s.player.fame = 0;
    s.school!.disciples = [disciple({ id: 'a', name: '某丙', gengu: 10, joined: 1250, status: 'graduated' })];
    expect(rankings(s).rows.some((r) => r.kind === 'disciple' && r.name === '某丙')).toBe(true);
    tickSchool(s, 1, new Rng(6));
    expect(s.flags.due_school_surpass).toBe(true);
  });

  it('江湖新秀會冒出來；你排第一時更常有人出來，名次接近的會下帖挑戰', () => {
    const s = founder();
    s.player.skills.changquan = 400;
    s.player.fame = 90;
    let spawned = 0;
    for (let i = 0; i < 20; i++) {
      tickStars(s, 3, new Rng(100 + i));
      spawned = s.stars!.length;
    }
    expect(spawned).toBeGreaterThan(0);
    expect(s.stars!.length).toBeLessThanOrEqual(STARS.max);
    for (const st of s.stars!) expect(st.power).toBeLessThanOrEqual(STARS.cap);
    // 新人跟你差不多強：榜首不會一直是你
    expect(Math.max(...s.stars!.map((x) => x.power))).toBeGreaterThan(playerPower(s) - 20);
    expect(s.scheduled.some((x) => x.event === 'rank_duel')).toBe(true);
  });

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
