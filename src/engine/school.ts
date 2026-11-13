// 自創武學、開宗立派、弟子、風雲榜。
// 資料（特質、門規、絕招、傳聞）在 content/school.ts；這裡是規則。

import { CONTENT } from '../content';
import { names } from '../content/names';
import {
  ART_IMAGERY, ART_ULTS, ART_WEAPON, DEED_RUMORS, DISCIPLE_BIRTHS, DISCIPLE_CHARACTERS, LEGACY_TRAITS, SCHOOL_RULES, SCHOOL_SUFFIX,
  STAR_DEEDS, STAR_TITLES, type DiscipleBirth, type DiscipleCharacter,
} from '../content/school';
import { checkCondition, currentYear, martialLevel, npcAlive, skillLevel } from './conditions';
import { addToDeck, canUpgrade, doneTask, pushTask, startTask } from './deck';
import { cardSkill, getCard, mainSkill } from './duel';
import { Rng } from './rng';
import type { Disciple, GameState, Passive, RisingStar, SchoolRule } from './types';

export const SCHOOL = {
  /** 每次開山門來幾個人。 */
  candidates: 3,
  /** 聲勢到了這裡，一次可以收兩個。 */
  twoPicksAt: 40,
  /** 聲勢上限。 */
  maxFame: 100,
  /** 出師要學幾年：根骨越好越快。 */
  yearsToGraduate: (gengu: number) => Math.max(3, 8 - Math.floor(gengu / 2)),
  /** 朝三暮四的人每年走掉的機率、體弱的人每年病故的機率。 */
  fickleLeave: 0.12,
  sicklyDie: 0.05,
  /** 心術不正的人學了幾年會帶著東西走；走了以後幾年回來。 */
  treacheryAfter: 2,
  usurpAfter: [3, 5] as [number, number],
  /** 品性惹的麻煩，一生最多幾件。 */
  maxTroubles: 4,
  /** 醫術到了這裡，體弱的弟子調理得好。 */
  healSicklyBaicao: 3,
};

/** 自創武學的被動：過招時跟心法、信物一起列出來。 */
export const ART_PASSIVE = { attackBonus: 2, blockPerRound: 3 };
/** 自創時順手把幾張主修的牌練得更精。 */
const ART_UPGRADES = 3;

const clampFame = (n: number) => Math.max(0, Math.min(SCHOOL.maxFame, Math.round(n)));

export function schoolFame(s: GameState): number {
  return Number(s.flags.school_fame ?? 0);
}

function addFame(s: GameState, delta: number): void {
  s.flags.school_fame = clampFame(schoolFame(s) + delta);
}

export function schoolFameLabel(n: number): string {
  if (n >= 70) return '名震江湖';
  if (n >= 50) return '一方大派';
  if (n >= 30) return '小有名氣';
  if (n >= 15) return '漸有起色';
  return '草創';
}

// ---------- 自創武學 ----------

/** 主修武學的路數：它的招式裡最多的那種。 */
function mainTag(s: GameState): string {
  const skill = mainSkill(s).skill;
  const cards = skill ? CONTENT.skillCards[skill] ?? [] : [];
  const count = new Map<string, number>();
  for (const id of cards) {
    const tag = getCard(id).tag;
    if (tag) count.set(tag, (count.get(tag) ?? 0) + 1);
  }
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '氣';
}

/** 取名的建議：經歷裡的意象 + 兵器字。reroll 換一個。 */
export function suggestName(s: GameState, target: 'art' | 'school', reroll = 0): string {
  const rng = new Rng(s.seed * 31 + s.turn * 7 + reroll * 101 + (target === 'art' ? 1 : 2));
  const pool = ART_IMAGERY.filter((x) => checkCondition(s, x.if)).flatMap((x) => x.words);
  const image = rng.pick(pool);
  if (target === 'art') return image + rng.pick(ART_WEAPON[mainTag(s)] ?? ART_WEAPON.氣);
  return image + rng.pick(SCHOOL_SUFFIX);
}

/** 自創武學：算出絕招，排一件取名的事。就地修改。 */
export function createArt(s: GameState): void {
  if (s.player.ownArt) return;
  const base = mainSkill(s).skill ?? 'changquan';
  s.player.ownArt = { name: '', base, ult: ART_ULTS[mainTag(s)] ?? 'art_qi', year: currentYear(s) };
  pushTask(s, {
    kind: 'name',
    target: 'art',
    title: '自成一家',
    text: '這一門功夫是你自己的了。替它取個名字吧：往後江湖上提起它，說的就是這幾個字。',
    suggested: suggestName(s, 'art'),
  });
}

/** 開宗立派：立下門規，排一件取名的事，再開山門收第一批弟子。就地修改。 */
export function foundSchool(s: GameState, rule: SchoolRule, rng: Rng): void {
  if (s.school) return;
  s.school = { name: '', rule, founded: currentYear(s), disciples: [], nextId: 1 };
  s.flags.founded_sect = true;
  s.flags[`rule_${rule}`] = true;
  s.flags.school_fame = 5;
  pushTask(s, {
    kind: 'name',
    target: 'school',
    title: '山門',
    text: `門規立下了：「${SCHOOL_RULES[rule].name}」。山門上的匾還空著，替你的門派取個名字吧。`,
    suggested: suggestName(s, 'school'),
  });
  openGate(s, rng);
  // 開了山門，之後的事就排上日程：下一次開山門、有人上門踢館、國難
  const y = currentYear(s);
  s.scheduled.push({ event: 'school_gate', due: y + rng.int(2, 3), expire: y + 8 });
  s.scheduled.push({ event: 'school_challenge', due: y + rng.int(4, 6), expire: y + 12 });
  if (y < 1279) s.scheduled.push({ event: 'school_war', due: Math.max(y + 1, 1258), expire: 1279 });
  // 老了，總要選一個傳人
  s.scheduled.push({ event: 'school_heir', due: Math.max(y + 6, s.player.birthYear + 60), expire: s.player.birthYear + 90 });
}

/** 名字：去掉空白，最多八個字；空的就用建議的。 */
export function cleanName(raw: string, fallback: string): string {
  const name = [...raw.replace(/\s+/g, '')].slice(0, 8).join('');
  return name.length > 0 ? name : fallback;
}

/** 玩家取好名字了。 */
export function giveName(state: GameState, raw: string): GameState {
  const { s, task } = startTask(state, 'name');
  if (task.kind !== 'name') throw new Error('unreachable');
  const name = cleanName(raw, task.suggested);
  if (task.target === 'art' && s.player.ownArt) {
    const art = s.player.ownArt;
    art.name = name;
    s.flags.own_art = true;
    addToDeck(s, art.ult);
    // 融會貫通：主修的幾張牌練得更精
    const deck = s.player.deck ?? [];
    let upgraded = 0;
    for (let i = 0; i < deck.length && upgraded < ART_UPGRADES; i++) {
      if (cardSkill(deck[i]) === art.base && canUpgrade(s, deck[i])) {
        deck[i] = `${deck[i]}+`;
        upgraded += 1;
      }
    }
    const ult = getCard(art.ult);
    note(s, `自創武學「${name}」：絕招【${ult.name}】加進牌庫${upgraded > 0 ? `，${upgraded} 張主修的招式練得更精` : ''}。`);
    s.history.push({
      turn: s.turn, age: s.player.age, year: currentYear(s), title: '自成一家', text: `你自創了一門武學，取名「${name}」。`,
      recap: { weight: 5, text: `${s.player.age}歲那年，你把一生所學熔成了一門自己的功夫，取名「${name}」。` },
    });
    // 自創了武學，過幾年就有開宗立派的機會
    const y = currentYear(s);
    if (!s.flags.founded_sect) s.scheduled.push({ event: 'found_school', due: y + 2, expire: y + 12 });
  } else if (task.target === 'school' && s.school) {
    s.school.name = name;
    note(s, `門派「${name}」，門規「${SCHOOL_RULES[s.school.rule].name}」。`);
    s.history.push({
      turn: s.turn, age: s.player.age, year: currentYear(s), title: '開宗立派', text: `你開宗立派，門派叫「${name}」。`,
      recap: { weight: 6, text: `${s.player.age}歲那年，你開宗立派，山門上的匾寫著「${name}」。` },
    });
  }
  doneTask(s);
  return s;
}

function note(s: GameState, text: string): void {
  if (s.result) s.result = { ...s.result, gains: [...s.result.gains, text] };
  else s.notices = [...(s.notices ?? []), text];
}

// ---------- 弟子：出身、品性 ----------

/** 出身與品性（舊存檔只有一個特質，在這裡換算）。 */
export function birthOf(d: Disciple): DiscipleBirth {
  return DISCIPLE_BIRTHS[d.birth ?? LEGACY_TRAITS[d.trait ?? '']?.birth ?? 'poor'] ?? DISCIPLE_BIRTHS.poor;
}

export function characterOf(d: Disciple): DiscipleCharacter {
  return DISCIPLE_CHARACTERS[d.character ?? LEGACY_TRAITS[d.trait ?? '']?.character ?? 'ordinary'] ?? DISCIPLE_CHARACTERS.ordinary;
}

/** 師父看不看得穿這個品性。 */
export function seesThrough(s: GameState, c: DiscipleCharacter): boolean {
  return !c.hidden || c.hidden.see.some((x) => s.player.stats[x.stat] >= x.at);
}

/** 畫面上看到的品性：藏著又沒被看穿的，只看得到它裝出來的樣子。 */
export function shownCharacter(d: Disciple): { name: string; desc: string; hidden: boolean } {
  const c = characterOf(d);
  if (d.seen || !c.hidden) return { name: c.name, desc: c.desc, hidden: false };
  return { name: c.hidden.cover, desc: c.hidden.hint, hidden: true };
}

/** 出師要學到哪裡（換算成年）。 */
export function toGraduate(d: Disciple): number {
  return SCHOOL.yearsToGraduate(d.gengu);
}

/** 學藝的進度：出身、品性讓一年不只算一年。 */
function learnRate(d: Disciple): number {
  return Math.max(0.2, (1 + birthOf(d).learn) * characterOf(d).learnMult);
}

// ---------- 收徒 ----------

/** 開山門：排一件收徒的事。就地修改。 */
export function openGate(s: GameState, rng: Rng): void {
  if (!s.school) return;
  const candidates = rollCandidates(s, rng);
  // 開山第一批、門派有了聲勢：一次收兩個
  const first = s.school.disciples.length === 0;
  const picks = first || schoolFame(s) >= SCHOOL.twoPicksAt ? 2 : 1;
  pushTask(s, {
    kind: 'recruit',
    title: '收徒',
    text: picks > 1
      ? `山門外來了 ${candidates.length} 個想拜師的人。${first ? '開山第一批' : '門派有了聲勢'}，這回你可以收兩個。`
      : `山門外來了 ${candidates.length} 個想拜師的人。你只收得下一個。`,
    candidates,
    picks,
  });
}

/** 根骨：大多是中等，好苗子少見。 */
function rollGengu(rng: Rng): number {
  return rng.weighted([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => ({ item: g, weight: [1, 2, 4, 6, 7, 7, 5, 3, 2, 1][g - 1] })))!;
}

/** 想拜師的人：人數看門規，和門下尊師重道、書香出身的大弟子（他們會替你招人）。 */
export function rollCandidates(s: GameState, rng: Rng): Disciple[] {
  const school = s.school!;
  const rule = SCHOOL_RULES[school.rule];
  const helpers = school.disciples.filter(
    (d) => (d.status === 'graduated' || d.status === 'heir') && (characterOf(d).id === 'respectful' || birthOf(d).id === 'scholar'),
  ).length;
  const n = Math.max(2, Math.min(5, SCHOOL.candidates + rule.extraCandidates + Math.min(1, helpers)));
  const used = new Set(school.disciples.map((d) => d.name));
  const out: Disciple[] = [];
  for (let i = 0; i < n; i++) {
    const birth = rng.weighted(Object.values(DISCIPLE_BIRTHS).map((b) => ({ item: b, weight: b.weight * (rule.birthMult[b.id] ?? 1) })))!;
    const character = rng.weighted(Object.values(DISCIPLE_CHARACTERS).map((c) => ({ item: c, weight: c.weight * (rule.characterMult[c.id] ?? 1) })))!;
    let name = '';
    for (let k = 0; k < 10 && (!name || used.has(name)); k++) name = rng.pick(names.surnames) + rng.pick(names.given);
    used.add(name);
    const gengu = Math.max(1, Math.min(birth.genguMax ?? 10, rollGengu(rng) + rule.gengu));
    out.push({
      id: `d${school.nextId + i}`,
      name,
      gengu,
      birth: birth.id,
      character: character.id,
      origin: rng.pick(birth.origin).replaceAll('{name}', name),
      seen: seesThrough(s, character),
      joined: currentYear(s),
      years: 0,
      progress: 0,
      status: 'training',
    });
  }
  return out;
}

/** 收下一個（id），或都不收（null）。 */
export function recruitDisciple(state: GameState, id: string | null): GameState {
  const { s, task } = startTask(state, 'recruit');
  if (task.kind !== 'recruit' || !s.school) throw new Error('unreachable');
  if (id === null) {
    doneTask(s);
    return s;
  }
  const d = task.candidates.find((c) => c.id === id);
  if (!d) throw new Error(`沒有這個人：${id}`);
  s.school.disciples.push({ ...d, joined: currentYear(s) });
  s.school.nextId = Math.max(s.school.nextId, Number(d.id.slice(1)) + 1, s.school.nextId + 1);
  s.flags.has_disciple = true;
  addFame(s, 2);
  const shown = shownCharacter(d);
  if (birthOf(d).id === 'rich') {
    s.player.money += 60;
    note(s, `收下了${d.name}（根骨 ${d.gengu}，${shown.name}）。他家裡送來一份厚禮（+60 文）。`);
  } else {
    note(s, `收下了${d.name}（根骨 ${d.gengu}，${birthOf(d).name}，${shown.name}）。`);
  }
  task.candidates = task.candidates.filter((c) => c.id !== id);
  task.picks -= 1;
  if (task.picks <= 0 || task.candidates.length === 0) doneTask(s);
  return s;
}

// ---------- 歲月：弟子的成長與麻煩 ----------

/** 品性惹的麻煩：哪種品性、多少年後發作、要排哪件事。 */
const TROUBLES: Record<string, { after: number; event: string }> = {
  lazy: { after: 1, event: 'school_lazy' },
  violent: { after: 1, event: 'school_brawl' },
  liar: { after: 1, event: 'school_slander' },
};

const pending = (s: GameState, events: string[]) => events.some((e) => s.flags[`due_${e}`] || s.scheduled.some((x) => x.event === e));

/** 立旗標：這件事下一回合一定發生（事件是強制的，條件是這個旗標）。 */
function raise(s: GameState, event: string): void {
  s.flags[`due_${event}`] = true;
}
const TROUBLE_EVENTS = [...Object.values(TROUBLES).map((t) => t.event), 'school_peek', 'school_traitor', 'school_usurp'];

/** 一段日子過去：弟子學藝、出師、惹事、離開，門派的聲勢跟著變。就地修改。 */
export function tickSchool(s: GameState, years: number, rng: Rng): void {
  const school = s.school;
  if (!school || !s.player.alive) return;
  const notes: string[] = [];
  const per = (p: number) => 1 - (1 - p) ** years;
  const y = currentYear(s);
  let fame = 0;
  const training = school.disciples.filter((d) => d.status === 'training');
  fame += Math.min(5, training.length);
  for (const d of training) {
    d.years += years;
    d.progress = (d.progress ?? d.years - years) + years * learnRate(d);
    const birth = birthOf(d).id;
    const character = characterOf(d).id;
    if (birth === 'rich') {
      s.player.money += 10 * years;
      fame += 1;
    }
    // 顛倒黑白的人嘴甜，替門派拉人
    if (character === 'liar') fame += 1;
    if (character === 'fickle' && rng.chance(per(SCHOOL.fickleLeave))) {
      d.status = 'left';
      fame -= 3;
      notes.push(`${d.name}留了一封信，說是去別處見識見識。你的招式，他學了七八成。`);
      continue;
    }
    if (birth === 'sickly') {
      if (skillLevel(s, 'baicao') >= SCHOOL.healSicklyBaicao) {
        if (!d.acted) {
          d.acted = true;
          notes.push(`你替${d.name}調理了一年的身子。他第一次跑完了山道，回頭朝你笑。`);
        }
      } else if (rng.chance(per(SCHOOL.sicklyDie))) {
        d.status = 'dead';
        fame -= 1;
        notes.push(`${d.name}沒有熬過那個冬天。他留下的筆記，比誰都寫得仔細。`);
        continue;
      }
    }
    // 品性惹的麻煩：一次一件，一生有上限
    const trouble = TROUBLES[character];
    const troubles = Number(s.flags.school_trouble ?? 0);
    if (trouble && !d.handled && d.years >= trouble.after && troubles < SCHOOL.maxTroubles && !pending(s, TROUBLE_EVENTS)) {
      if (character === 'liar') {
        // 要有一個可以誣賴的師兄弟
        const victim = school.disciples.find((x) => x.id !== d.id && x.status === 'training' && characterOf(x).id !== 'liar');
        if (!victim) continue;
        school.victim = victim.id;
      }
      d.handled = true;
      school.spotlight = d.id;
      s.flags.spot_gifted = d.gengu >= 8;
      s.flags.school_trouble = troubles + 1;
      raise(s, trouble.event);
      continue;
    }
    // 心術不正：先偷學，學夠了就帶著東西走
    if (character === 'treacherous' && !pending(s, TROUBLE_EVENTS)) {
      const stage = d.stage ?? 0;
      if (stage === 0 && d.years >= 1) {
        d.stage = 1;
        school.spotlight = d.id;
        s.flags.spot_seen = Boolean(d.seen);
        raise(s, 'school_peek');
        continue;
      }
      if (stage === 1 && d.years >= SCHOOL.treacheryAfter) {
        d.stage = 2;
        school.spotlight = d.id;
        raise(s, 'school_traitor');
        continue;
      }
    }
    // 品性的問題還沒處理，出不了師：心術不正的人一定會先走到叛逃那一步
    const unresolved = (trouble && !d.handled && Number(s.flags.school_trouble ?? 0) < SCHOOL.maxTroubles) || (character === 'treacherous' && (d.stage ?? 0) < 2);
    if (unresolved) continue;
    if ((d.progress ?? d.years) >= toGraduate(d)) {
      d.status = 'graduated';
      fame += 3 + Math.floor(d.gengu / 2) + (d.gengu >= 8 ? 5 : 0);
      if (d.gengu >= 8) s.flags.school_star = true;
      notes.push(`${d.name}學成出師了。${d.gengu >= 8 ? '頭一回下山，就打出了名堂。' : '他給你磕了三個頭，下山去了。'}`);
    }
  }
  // 出了師的人：尊師重道的留下來幫你帶師弟，書香出身的替門派四處結交
  for (const d of school.disciples) {
    if (d.status !== 'graduated' && d.status !== 'heir') continue;
    if (characterOf(d).id === 'respectful' || birthOf(d).id === 'scholar') fame += 1;
  }
  // 叛出師門的人，幾年後帶著你的功夫回來
  const traitor = traitorOf(s);
  if (traitor && traitor.stage === 3 && y - (traitor.leftYear ?? y) >= SCHOOL.usurpAfter[0] && !pending(s, ['school_usurp'])) {
    traitor.stage = 4;
    raise(s, 'school_usurp');
  }
  addFame(s, fame);
  // 給條件用的旗標：門下有沒有忠心的大弟子、有幾個人上了風雲榜
  s.flags.school_has_loyal = school.disciples.some((d) => (d.status === 'graduated' || d.status === 'heir') && characterOf(d).id === 'respectful');
  s.flags.school_ranked = rankings(s).rows.filter((r) => r.kind === 'disciple').length;
  // 青出於藍：門下有人在風雲榜上超過了你
  if (!s.flags.surpassed && !pending(s, ['school_surpass'])) {
    const me = playerPower(s);
    const top = school.disciples.filter((d) => d.status === 'graduated').sort((a, b) => disciplePower(s, b) - disciplePower(s, a))[0];
    if (top && disciplePower(s, top) > me) {
      school.spotlight = top.id;
      raise(s, 'school_surpass');
    }
  }
  if (notes.length > 0) s.notices = [...(s.notices ?? []), ...notes];
}

/** 挑出這件事要說的那個弟子。就地修改；挑不到就清掉。 */
export function pickSpotlight(s: GameState, pick: 'heir' | 'star' | 'any' | 'traitor', rng: Rng): void {
  const school = s.school;
  if (!school) return;
  if (pick === 'traitor') {
    school.spotlight = traitorOf(s)?.id;
    return;
  }
  const ok = school.disciples.filter((d) => (pick === 'any' ? d.status === 'training' : d.status === 'graduated'));
  // 傳人：尊師重道的優先，再看根骨；心術不正（沒被看穿的）也可能被選上
  const best = [...ok].sort(
    (a, b) => Number(characterOf(b).id === 'respectful') - Number(characterOf(a).id === 'respectful') || b.gengu - a.gengu || a.joined - b.joined,
  );
  const chosen = pick === 'any' ? (ok.length > 0 ? rng.pick(ok) : undefined) : best.find((d) => pick === 'heir' || d.gengu >= 8);
  school.spotlight = chosen?.id;
  s.flags.school_has_heir = pick === 'heir' && Boolean(chosen);
  s.flags.school_has_spotlight = Boolean(chosen);
}

export function spotlightDisciple(s: GameState): Disciple | undefined {
  return s.school?.disciples.find((d) => d.id === s.school!.spotlight);
}

export function victimDisciple(s: GameState): Disciple | undefined {
  return s.school?.disciples.find((d) => d.id === s.school!.victim);
}

/** 這件事說的那個弟子怎麼了。就地修改。 */
export function setDiscipleStatus(s: GameState, status: Disciple['status']): void {
  const d = spotlightDisciple(s);
  if (!d) return;
  if (status === 'reformed') {
    // 回頭的人：留在門下，品性改成尊師重道
    d.status = (d.progress ?? d.years) >= toGraduate(d) ? 'graduated' : 'training';
    d.character = 'respectful';
    d.seen = true;
    d.stage = undefined;
    return;
  }
  d.status = status;
  if (status === 'heir') s.flags.heir_name = d.name;
  if (status === 'betrayed') {
    d.leftYear = currentYear(s);
    d.seen = true;
    // 心術不正的人，幾年後會帶著你的功夫回來
    if (characterOf(d).id === 'treacherous') {
      d.stage = 3;
      s.flags.traitor_out = true;
    }
  }
}

/** 弟子的品性：被看穿、改好了、這件事處理過了。就地修改。 */
export function fixDisciple(s: GameState, fix: 'reveal' | 'reform' | 'handled'): void {
  const d = spotlightDisciple(s);
  if (!d) return;
  if (fix === 'reveal') d.seen = true;
  if (fix === 'reform') {
    d.character = 'ordinary';
    d.seen = true;
  }
  d.handled = true;
}

export function setVictimStatus(s: GameState, status: Disciple['status']): void {
  const d = victimDisciple(s);
  if (d) d.status = status;
}

// ---------- 過招 ----------

export function artPassive(s: GameState, p: Passive): void {
  const art = s.player.ownArt;
  if (!art?.name) return;
  p.names.push(`${art.name}：自成一家，攻擊牌傷害 +${ART_PASSIVE.attackBonus}、每回合開始護體 ${ART_PASSIVE.blockPerRound}`);
  p.attackBonus = (p.attackBonus ?? 0) + ART_PASSIVE.attackBonus;
  p.blockPerRound = (p.blockPerRound ?? 0) + ART_PASSIVE.blockPerRound;
}

// ---------- 風雲榜 ----------

export interface RankRow {
  name: string;
  title?: string;
  power: number;
  kind: 'me' | 'npc' | 'disciple' | 'traitor' | 'star';
  /** 沒見過的人只看得到稱號。 */
  known: boolean;
}

/** 你在江湖上的分量：武學境界、名望，再加上幾件人人都知道的大事。 */
export function playerPower(s: GameState): number {
  const f = s.flags;
  let n = martialLevel(s) * 12 + Math.min(100, s.player.fame) * 0.5;
  if (f.lunwu_champion) n += 10;
  if (f.wumian_defeated) n += 8;
  if (f.beat_he) n += 6;
  if (f.own_art) n += 8;
  if (f.usurper_defeated) n += 8;
  n += Number(f.stars_beaten ?? 0) * 4;
  n += schoolFame(s) * 0.15;
  return Math.round(n);
}

/** 出師的弟子在江湖上的分量：根骨，加上入門以來的年數。 */
export function disciplePower(s: GameState, d: Disciple): number {
  const years = Math.min(15, currentYear(s) - d.joined);
  return Math.round(20 + d.gengu * 4 + years * 2);
}

/** 叛出師門的人：帶著你的功夫在外面闖，一年比一年強。 */
function traitorPower(s: GameState, d: Disciple): number {
  const years = Math.min(15, currentYear(s) - (d.leftYear ?? d.joined));
  return Math.round(35 + d.gengu * 4 + years * 3);
}

/** 風雲榜：還在世的名俠、新冒出來的人、你的弟子、叛徒，和你。取前 limit 名；你不在前幾名時，另外附在最後。 */
export function rankings(s: GameState, limit = 10): { rows: RankRow[]; myRank: number } {
  const rows: RankRow[] = Object.values(CONTENT.npcs)
    .filter((n) => n.power !== undefined && npcAlive(s, n.id))
    .map((n) => ({ name: n.name, title: n.title, power: n.power!, kind: 'npc' as const, known: Boolean(s.flags[`met_${n.id}`]) }));
  for (const st of s.stars ?? []) rows.push({ name: st.name, title: st.title, power: Math.round(st.power), kind: 'star', known: true });
  const school = s.school;
  for (const d of school?.disciples ?? []) {
    if (d.status === 'graduated' || d.status === 'heir') {
      rows.push({ name: d.name, title: school!.name || undefined, power: disciplePower(s, d), kind: 'disciple', known: true });
    } else if (d.status === 'betrayed' && characterOf(d).id === 'treacherous') {
      rows.push({ name: d.name, title: '叛出師門', power: traitorPower(s, d), kind: 'traitor', known: true });
    }
  }
  const name = s.player.ownArt?.name ? `${s.player.name}（${s.player.ownArt.name}）` : s.player.name;
  const me: RankRow = { name, power: playerPower(s), kind: 'me', known: true };
  rows.push(me);
  rows.sort((a, b) => b.power - a.power || Number(b.kind === 'me') - Number(a.kind === 'me'));
  const myRank = rows.indexOf(me) + 1;
  const top = rows.slice(0, limit);
  return { rows: myRank > limit ? [...top, me] : top, myRank };
}

/** 叛徒現在在榜上的分量（欺師滅祖那一戰用）。 */
export function traitorOf(s: GameState): Disciple | undefined {
  return s.school?.disciples.find((d) => d.status === 'betrayed' && characterOf(d).id === 'treacherous');
}

// ---------- 江湖新秀 ----------

export const STARS = {
  /** 幾歲起，江湖上開始有新面孔跟你比。 */
  fromAge: 22,
  /** 每段日子冒出新人的機率；你排第一時更常有人出來挑戰。 */
  chance: 0.18,
  chanceAtTop: 0.5,
  /** 同時在榜上的新人最多幾個。 */
  max: 5,
  /** 新人每年長多少、最多長到哪裡、成名多少年後退隱。 */
  growth: 0.8,
  cap: 118,
  retire: 25,
  /** 名次跟你差多少以內，會下帖挑戰。 */
  challengeGap: 12,
  /** 贏了，對方的分量掉多少。 */
  beatDrop: 18,
};

/** 一段日子過去：新人變強、老人退隱、有人冒出來、有人找你挑戰。就地修改。 */
export function tickStars(s: GameState, years: number, rng: Rng): void {
  if (!s.player.alive || s.player.age < STARS.fromAge) return;
  const y = currentYear(s);
  const stars = (s.stars ??= []);
  for (const st of stars) if (st.fought !== 'win') st.power = Math.min(STARS.cap, st.power + STARS.growth * years);
  const retired = stars.filter((st) => y - st.since > STARS.retire);
  s.stars = stars.filter((st) => y - st.since <= STARS.retire);
  for (const st of retired) s.notices = [...(s.notices ?? []), `「${st.title}」${st.name}退出了江湖。聽說回鄉種地去了。`];
  const { myRank } = rankings(s);
  const me = playerPower(s);
  if (s.stars.length < STARS.max && rng.chance(myRank === 1 ? STARS.chanceAtTop : STARS.chance)) {
    const used = new Set([...s.stars.map((x) => x.title), ...(s.retiredTitles ?? [])]);
    const titles = STAR_TITLES.filter((t) => !used.has(t));
    if (titles.length > 0) {
      const title = rng.pick(titles);
      const name = rng.pick(names.surnames) + rng.pick(names.given);
      // 新人總是跟你差不多，有時候比你強一截
      const power = Math.max(60, me) + rng.int(-6, 12);
      s.stars.push({ id: `star${y}${title}`, name, title, power, since: y });
      s.retiredTitles = [...(s.retiredTitles ?? []), title];
      s.notices = [...(s.notices ?? []), `江湖上冒出一個「${title}」${name}，${rng.pick(STAR_DEEDS)}風雲榜上，多了一個名字。`];
    }
  }
  // 名次跟你差不多、還沒交過手的人，會下帖挑戰
  if (!pending(s, ['rank_duel']) && s.player.age <= 70) {
    const rival = s.stars.find((st) => !st.fought && Math.abs(st.power - me) <= STARS.challengeGap);
    if (rival) {
      s.starSpot = rival.id;
      s.scheduled.push({ event: 'rank_duel', due: y, expire: y + 4 });
    }
  }
}

export function spotStar(s: GameState): RisingStar | undefined {
  return s.stars?.find((x) => x.id === s.starSpot);
}

/** 跟新人打完了。就地修改。 */
export function settleStar(s: GameState, result: 'win' | 'lose' | 'decline'): void {
  const st = spotStar(s);
  if (!st) return;
  st.fought = result;
  if (result === 'win') {
    st.power -= STARS.beatDrop;
    s.flags.stars_beaten = Number(s.flags.stars_beaten ?? 0) + 1;
  } else st.power += result === 'lose' ? 5 : 3;
}

// ---------- 傳聞 ----------

/** 還沒聽過、符合條件的一則關於你的傳聞。 */
export function deedRumor(s: GameState, rng: Rng): { id: string; text: string } | undefined {
  const pool = DEED_RUMORS.filter((r) => !s.shownRumors.includes(r.id) && checkCondition(s, r.if));
  return pool.length > 0 ? rng.pick(pool) : undefined;
}
