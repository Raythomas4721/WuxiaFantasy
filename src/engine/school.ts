// 自創武學、開宗立派、弟子、風雲榜。
// 資料（特質、門規、絕招、傳聞）在 content/school.ts；這裡是規則。

import { CONTENT } from '../content';
import { names } from '../content/names';
import {
  ART_IMAGERY, ART_ULTS, ART_WEAPON, DEED_RUMORS, DISCIPLE_TRAITS, SCHOOL_RULES, SCHOOL_SUFFIX,
} from '../content/school';
import { checkCondition, currentYear, martialLevel, npcAlive, skillLevel } from './conditions';
import { addToDeck, canUpgrade, doneTask, pushTask, startTask } from './deck';
import { cardSkill, getCard, mainSkill } from './duel';
import { Rng } from './rng';
import type { Disciple, GameState, Passive, SchoolRule } from './types';

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
  /** 反骨學了幾年會發作。 */
  rebelAfter: 2,
  /** 師父悟性到了這裡，看得穿藏著的特質。 */
  seeThroughWuxing: 9,
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

/** 想拜師的人：人數看門規和門下能說會道、忠厚老實的大弟子。 */
export function rollCandidates(s: GameState, rng: Rng): Disciple[] {
  const school = s.school!;
  const rule = SCHOOL_RULES[school.rule];
  const helpers = school.disciples.filter((d) => d.status === 'graduated' && (d.trait === 'eloquent' || d.trait === 'honest')).length;
  const n = Math.max(2, Math.min(5, SCHOOL.candidates + rule.extraCandidates + Math.min(1, helpers)));
  const used = new Set(school.disciples.map((d) => d.name));
  const out: Disciple[] = [];
  for (let i = 0; i < n; i++) {
    const trait = rng.weighted(Object.values(DISCIPLE_TRAITS).map((t) => ({ item: t, weight: t.weight * (rule.traitMult[t.id] ?? 1) })))!;
    let name = '';
    for (let k = 0; k < 10 && (!name || used.has(name)); k++) name = rng.pick(names.surnames) + rng.pick(names.given);
    used.add(name);
    const gengu = Math.max(1, Math.min(10, rng.int(trait.gengu[0], trait.gengu[1]) + rule.gengu));
    out.push({
      id: `d${school.nextId + i}`,
      name,
      gengu,
      trait: trait.id,
      origin: rng.pick(trait.origin).replaceAll('{name}', name),
      seen: !trait.hidden || s.player.stats.wuxing >= SCHOOL.seeThroughWuxing,
      joined: currentYear(s),
      years: 0,
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
  s.school.nextId += 1;
  s.flags.has_disciple = true;
  addFame(s, 2);
  const trait = DISCIPLE_TRAITS[d.trait];
  if (d.trait === 'rich') {
    s.player.money += 60;
    note(s, `收下了${d.name}。他家裡送來一份厚禮（+60 文）。`);
  } else {
    note(s, `收下了${d.name}（根骨 ${d.gengu}，${d.seen ? trait.name : trait.hidden!.cover}）。`);
  }
  task.candidates = task.candidates.filter((c) => c.id !== id);
  task.picks -= 1;
  if (task.picks <= 0 || task.candidates.length === 0) doneTask(s);
  return s;
}

// ---------- 歲月：弟子的成長 ----------

/** 一段日子過去：弟子學藝、出師、離開、病故，門派的聲勢跟著變。就地修改。 */
export function tickSchool(s: GameState, years: number, rng: Rng): void {
  const school = s.school;
  if (!school || !s.player.alive) return;
  const notes: string[] = [];
  const per = (p: number) => 1 - (1 - p) ** years;
  let fame = 0;
  const training = school.disciples.filter((d) => d.status === 'training');
  fame += Math.min(5, training.length);
  for (const d of training) {
    d.years += years;
    if (d.trait === 'rich') {
      s.player.money += 10 * years;
      fame += 1;
    }
    if (d.trait === 'eloquent') fame += 2;
    if (d.trait === 'fickle' && rng.chance(per(SCHOOL.fickleLeave))) {
      d.status = 'left';
      fame -= 3;
      notes.push(`${d.name}留了一封信，說是去別處見識見識。你的招式，他學了七八成。`);
      continue;
    }
    if (d.trait === 'sickly') {
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
    if (d.trait === 'rebel' && !d.acted && d.years >= SCHOOL.rebelAfter && !s.scheduled.some((x) => x.event === 'school_traitor')) {
      d.acted = true;
      school.spotlight = d.id;
      const y = currentYear(s);
      s.scheduled.push({ event: 'school_traitor', due: y, expire: y + 6 });
      continue;
    }
    if (d.years >= SCHOOL.yearsToGraduate(d.gengu)) {
      d.status = 'graduated';
      fame += 3 + Math.floor(d.gengu / 2) + (d.trait === 'gifted' ? 5 : 0);
      if (d.gengu >= 8) s.flags.school_star = true;
      notes.push(`${d.name}學成出師了。${d.gengu >= 8 ? '頭一回下山，就打出了名堂。' : '他給你磕了三個頭，下山去了。'}`);
    }
  }
  // 出了師的人：忠厚的留下來幫你帶師弟，能說的替門派四處說好話
  for (const d of school.disciples) {
    if (d.status !== 'graduated' && d.status !== 'heir') continue;
    if (d.trait === 'honest' || d.trait === 'eloquent') fame += 1;
  }
  addFame(s, fame);
  if (notes.length > 0) s.notices = [...(s.notices ?? []), ...notes];
}

/** 挑出這件事要說的那個弟子。就地修改；挑不到就清掉。 */
export function pickSpotlight(s: GameState, pick: 'heir' | 'star' | 'any', rng: Rng): void {
  const school = s.school;
  if (!school) return;
  const ok = school.disciples.filter((d) => (pick === 'any' ? d.status === 'training' : d.status === 'graduated' || d.status === 'reformed'));
  const best = [...ok].sort((a, b) => b.gengu - a.gengu || a.joined - b.joined);
  const chosen = pick === 'any' ? (ok.length > 0 ? rng.pick(ok) : undefined) : best.find((d) => pick === 'heir' || d.gengu >= 8);
  school.spotlight = chosen?.id;
  s.flags.school_has_heir = pick === 'heir' && Boolean(chosen);
  s.flags.school_has_spotlight = Boolean(chosen);
}

export function spotlightDisciple(s: GameState): Disciple | undefined {
  return s.school?.disciples.find((d) => d.id === s.school!.spotlight);
}

/** 這件事說的那個弟子怎麼了。就地修改。 */
export function setDiscipleStatus(s: GameState, status: Disciple['status']): void {
  const d = spotlightDisciple(s);
  if (!d) return;
  d.status = status;
  if (status === 'heir') s.flags.heir_name = d.name;
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
  me?: boolean;
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
  n += schoolFame(s) * 0.15;
  return Math.round(n);
}

/** 風雲榜：還在世的名俠與你，取前 limit 名；你不在前幾名時，另外附在最後。 */
export function rankings(s: GameState, limit = 10): { rows: RankRow[]; myRank: number } {
  const rows: RankRow[] = Object.values(CONTENT.npcs)
    .filter((n) => n.power !== undefined && npcAlive(s, n.id))
    .map((n) => ({ name: n.name, title: n.title, power: n.power!, known: Boolean(s.flags[`met_${n.id}`]) }));
  const me: RankRow = { name: s.player.ownArt?.name ? `${s.player.name}（${s.player.ownArt.name}）` : s.player.name, power: playerPower(s), me: true, known: true };
  rows.push(me);
  rows.sort((a, b) => b.power - a.power || Number(Boolean(b.me)) - Number(Boolean(a.me)));
  const myRank = rows.indexOf(me) + 1;
  const top = rows.slice(0, limit);
  return { rows: myRank > limit ? [...top, me] : top, myRank };
}

// ---------- 傳聞 ----------

/** 還沒聽過、符合條件的一則關於你的傳聞。 */
export function deedRumor(s: GameState, rng: Rng): { id: string; text: string } | undefined {
  const pool = DEED_RUMORS.filter((r) => !s.shownRumors.includes(r.id) && checkCondition(s, r.if));
  return pool.length > 0 ? rng.pick(pool) : undefined;
}
