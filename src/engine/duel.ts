// 過招：招式牌（設計文件 §3.11）。
//
// 一回合：抽牌 → 你出牌（攻、守、技立刻生效；伏招蓋著）→ 對手照意圖出手（可能變招），
// 途中觸發你的伏招與他的暗招 → 結算 → 下一回合。手牌會留到下回合，可以攢牌湊連招。
// 公開函式都回傳新的 DuelState，不修改傳入的物件。

import { CONTENT } from '../content';
import { checkCondition, levelFromXp, skillLevel } from './conditions';
import type { Rng } from './rng';
import { growthPassive, talentHp } from './talents';
import { encounterOpenings } from '../content/encounters';
import { fill } from './text';
import type {
  CardDef, CardEffect, CardTag, DuelState, GameState, Intent, IntentKind, OpponentDef, Passive, TrapTrigger,
} from './types';

/** 對手也有境界：玩家境界高了會多內力、多抽牌，同級對手的氣血與出手跟著放大（依等級）。 */
export const FOE_REALM = [1, 1.25, 1.55, 1.65, 1.9, 2.15];

/** 平衡數值集中在這裡。 */
export const DUEL = {
  energy: 3,
  startHand: 5,
  drawPer: 2,
  /** 悟性到這裡，每回合多抽一張。 */
  drawBonusWuxing: 10,
  handMax: 7,
  trapSlots: 2,
  maxRounds: 6,
  exposeMult: 1.5,
  /** 對手每一招的力道浮動 ±25%。 */
  intentSwing: 0.25,
  upgradeMult: 1.35,
  /** 氣血上限 = 30 ＋ 根骨 × 2 ＋ 境界加成（設計文件 v0.5 §3.1）。 */
  playerHp: (gengu: number, level: number) => 30 + gengu * 2 + REALM[Math.min(5, level)].hp,
  foeHp: (level: number) => Math.round((45 + level * 10) * FOE_REALM[Math.min(5, level)]),
  foeAttack: (level: number) => (11 + level * 2.5) * FOE_REALM[Math.min(5, level)],
  foeGuard: (level: number) => 4 + level * 2,
  foeCharge: (level: number) => Math.round(3 + level * 1.5),
  /** 看穿暗招要比對手高出的悟性。 */
  seeTrapsMargin: 3,
  /** 比試（點到為止）輸了，健康最低剩這麼多。 */
  sparFloor: 20,
  /** 生死之戰突圍：剩下的氣血比例再扣這麼多健康。 */
  fleeCost: 15,
};

/**
 * 主修境界帶來的本事（設計文件 v0.5 §2.4）：每回合內力、氣血上限加成、每回合多抽幾張、
 * 一張牌最多能升級幾次。
 */
export const REALM: { energy: number; hp: number; draw: number; upgrades: number }[] = [
  { energy: 3, hp: 0, draw: 0, upgrades: 1 },
  { energy: 3, hp: 0, draw: 0, upgrades: 1 },
  { energy: 3, hp: 5, draw: 0, upgrades: 2 },
  { energy: 4, hp: 10, draw: 0, upgrades: 2 },
  { energy: 4, hp: 15, draw: 1, upgrades: 2 },
  { energy: 5, hp: 20, draw: 1, upgrades: 2 },
];

const TEMPER: Record<OpponentDef['temper'], { weights: Partial<Record<IntentKind, number>>; switch: number }> = {
  brute: { weights: { attack: 3.5, combo: 2, guard: 1.5, charge: 1.5, feint: 0.5 }, switch: 0 },
  veteran: { weights: { attack: 3, combo: 2, guard: 2, charge: 1, feint: 2 }, switch: 0.25 },
  guard: { weights: { attack: 3, combo: 1.5, guard: 3, charge: 1, feint: 1 }, switch: 0.1 },
};

// ---------- 牌 ----------

/** 牌 id 去掉升級記號：「juma++」→「juma」。 */
export function baseCardId(id: string): string {
  return id.replace(/\++$/, '');
}

/** 升級過幾次。 */
export function upgradeCount(id: string): number {
  return id.length - baseCardId(id).length;
}

/** 牌屬於哪一門武學（基本牌、奇招沒有）。 */
export function cardSkill(id: string): string | undefined {
  const base = baseCardId(id);
  return Object.keys(CONTENT.skillCards).find((s) => CONTENT.skillCards[s].includes(base));
}

/** 升級一次：數值 × 1.35；沒有數值可以加的牌，改成少花一點內力，已經不花內力的就多抽一張。 */
function upgradeOnce(c: CardDef): CardDef {
  const up = (n?: number) => (n === undefined ? undefined : Math.round(n * DUEL.upgradeMult));
  const numeric = [c.dmg, c.block, c.bleed, c.heal, c.desperate, c.boostNext?.dmg].some((n) => n !== undefined);
  if (!numeric) return c.cost > 0 ? { ...c, cost: c.cost - 1 } : { ...c, draw: (c.draw ?? 0) + 1 };
  return {
    ...c,
    dmg: up(c.dmg),
    block: up(c.block),
    bleed: up(c.bleed),
    heal: up(c.heal),
    desperate: up(c.desperate),
    chain: c.chain && { ...c.chain, dmg: up(c.chain.dmg)! },
    vsIntent: c.vsIntent && { ...c.vsIntent, dmg: up(c.vsIntent.dmg)! },
    after: c.after && { ...c.after, dmg: up(c.after.dmg), block: up(c.after.block) },
    boostNext: c.boostNext && { ...c.boostNext, dmg: up(c.boostNext.dmg) },
  };
}

/** 「juma+」是升級過一次的拒馬，「juma++」是兩次；名字加上同樣數量的「＋」。 */
export function getCard(id: string): CardDef {
  const base = CONTENT.cards[baseCardId(id)];
  if (!base) throw new Error(`未知招式牌：${id}`);
  const n = upgradeCount(id);
  if (n === 0) return base;
  let c = base;
  for (let i = 0; i < n; i++) c = upgradeOnce(c);
  return { ...c, id, name: `${base.name}${'＋'.repeat(n)}` };
}

const TRIGGER_TEXT: Record<TrapTrigger, string> = {
  foeAttack: '對手出手時',
  foeGuard: '對手守勢時',
  foeCharge: '對手蓄勢時',
  foeFeint: '對手虛招時',
};

const tagList = (tags: CardTag[]) => tags.map((t) => `〈${t}〉`).join('');

function effectText(e: CardEffect): string[] {
  const out: string[] = [];
  if (e.dodge) out.push('閃過這一擊');
  if (e.halve) out.push('這一擊傷害減半');
  if (e.dmg) out.push(`傷害 ${e.dmg}${e.hits && e.hits > 1 ? ` × ${e.hits}` : ''}`);
  if (e.block) out.push(`護體 ${e.block}`);
  if (e.heal) out.push(`回復 ${e.heal} 氣血`);
  if (e.draw) out.push(`抽 ${e.draw}`);
  if (e.energy) out.push(`內力 +${e.energy}`);
  if (e.money) out.push(`花 ${e.money} 文`);
  if (e.selfHp) out.push(`自己失去 ${e.selfHp} 氣血`);
  if (e.energyNext) out.push(`下回合內力 +${e.energyNext}`);
  if (e.expose) out.push('對手破綻');
  if (e.bleed) out.push(`內傷 ${e.bleed}`);
  if (e.bleedMult) out.push(`對手內傷 × ${e.bleedMult}`);
  if (e.pierce) out.push('無視護體');
  if (e.breakGuard) out.push('打掉護體');
  if (e.breakTrap) out.push('破除一張暗招');
  if (e.boostNext) {
    const b = e.boostNext;
    out.push(`下一張${tagList(b.tags)}${b.mult ? `傷害 × ${b.mult}` : `傷害 +${b.dmg}`}`);
  }
  return out;
}

/** 牌面上的說明文字。 */
export function cardText(c: CardDef): string {
  if (c.kind === 'curse') {
    const what = [c.onDraw?.energy && `這回合內力 −${c.onDraw.energy}`, c.onDraw?.hp && `失去 ${c.onDraw.hp} 氣血`].filter(Boolean).join('、');
    return `抽到時發作：${what}，然後補抽一張`;
  }
  const parts = effectText(c);
  if (c.desperate) parts.push(`氣血不到一半時 +${c.desperate}`);
  if (c.vsIntent) parts.push(`對手${c.vsIntent.kinds.includes('attack') ? '出手' : '守勢'}時 +${c.vsIntent.dmg}`);
  if (c.chain) parts.push(`連：這回合每出過一張${c.chain.tags ? tagList(c.chain.tags) : '牌'}，傷害 +${c.chain.dmg}`);
  if (c.after) parts.push(`承${tagList(c.after.tags)}：${effectText(c.after).join('、')}`);
  let text = parts.join('；');
  if (c.kind === 'trap' && c.trigger) text = `${TRIGGER_TEXT[c.trigger]}發動：${text}`;
  if (c.exhaust) text += '。用完移出';
  return text;
}

// ---------- 牌庫 ----------

/** v0.4 依等級從 [A, B, C, A, B, C] 拿幾張；只用來把舊存檔換算成持久牌庫。 */
const LEGACY_CARDS_AT_LEVEL = [0, 1, 2, 4, 5, 6];
const LEGACY_BASE = ['punch', 'punch', 'punch', 'parry', 'parry', 'xieli', 'breathe'];

export interface Fighter {
  hp: number;
  wuxing: number;
  level: number;
  deck: string[];
  /** 每回合內力；省略時依等級查 REALM。 */
  energy?: number;
  /** 每回合多抽幾張；省略時依等級查 REALM。 */
  extraDraw?: number;
  /** 身上的錢，給要花錢的牌用。 */
  money?: number;
  /** 開打時的氣血（健康就是血量）；省略時是滿的。 */
  startHp?: number;
}

/** 主修武學：等級最高的武學（同級比經驗）。 */
export function mainSkill(s: GameState): { skill?: string; level: number } {
  let best: { skill?: string; level: number; xp: number } = { level: 0, xp: 0 };
  for (const [id, xp] of Object.entries(s.player.skills)) {
    if (CONTENT.skills[id]?.kind !== 'martial' || !CONTENT.skillCards[id]) continue;
    const level = levelFromXp(xp);
    if (level > best.level || (level === best.level && xp > best.xp)) best = { skill: id, level, xp };
  }
  return { skill: best.skill, level: best.level };
}

/**
 * v0.4 的牌庫算法：基本牌 + 主修招式 + 副修各一張 + 醫術 + 特殊牌。
 * 4 級起主修招式全部升級；5 級再拿掉兩張基本牌。v0.5 只用它換算舊存檔。
 */
export function legacyDeck(s: GameState): string[] {
  const { skill, level } = mainSkill(s);
  const deck = [...LEGACY_BASE];
  if (skill && level > 0) {
    const [a, b, c] = CONTENT.skillCards[skill];
    for (const id of [a, b, c, a, b, c].slice(0, LEGACY_CARDS_AT_LEVEL[level])) deck.push(level >= 4 ? `${id}+` : id);
    if (level >= 5) {
      deck.splice(deck.indexOf('punch'), 1);
      deck.splice(deck.indexOf('parry'), 1);
    }
  }
  for (const [id, xp] of Object.entries(s.player.skills)) {
    if (id !== skill && CONTENT.skillCards[id] && levelFromXp(xp) >= 2) deck.push(CONTENT.skillCards[id][0]);
  }
  if (skillLevel(s, 'baicao') >= 2) deck.push('jinchuang');
  for (const sp of CONTENT.specialCards) if (checkCondition(s, sp.if)) deck.push(sp.card);
  return deck;
}

/** 這一場要用的牌：持久牌庫，加上身上的傷與心魔。 */
export function deckFor(s: GameState): string[] {
  const deck = [...(s.player.deck ?? legacyDeck(s))];
  for (let i = 0; i < woundCount(s); i++) deck.push('wound');
  for (let i = 0; i < demonCount(s); i++) deck.push('demon');
  return deck;
}

export function woundCount(s: GameState): number {
  // 健康就是血量，傷已經反映在氣血上；只有傷得很重時才會多一張「傷」
  return s.player.health < 30 ? 1 : 0;
}

/** 心魔：血仇未了一張；走火入魔的傷還沒養好（健康 < 70）一張。 */
export function demonCount(s: GameState): number {
  let n = 0;
  const f = s.flags;
  if (f.blood_feud && !f.revenge_done && !f.feud_resolved) n++;
  if (f.zouhuo && s.player.health < 70) n++;
  return n;
}

export function fighterFor(s: GameState): Fighter {
  const { level } = mainSkill(s);
  const hp = DUEL.playerHp(s.player.stats.gengu, level) + talentHp(s);
  return {
    hp,
    wuxing: s.player.stats.wuxing,
    level,
    deck: deckFor(s),
    money: s.player.money,
    startHp: Math.max(1, Math.round((hp * s.player.health) / 100)),
  };
}

export function opponentLevel(def: OpponentDef, playerLevel: number): number {
  if (typeof def.level === 'number') return def.level;
  const { relative, min = 0, max = 5 } = def.level;
  return Math.max(min, Math.min(max, playerLevel + relative));
}

// ---------- 對戰 ----------

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(d: DuelState, n: number, rng: Rng): void {
  // 傷與心魔不進手牌：當場發作，然後補抽。發作過的等這次抽完才進棄牌，免得洗牌時又被抽到。
  const burned: string[] = [];
  for (let i = 0; i < n && d.me.hand.length < (d.me.handMax ?? DUEL.handMax); i++) {
    if (d.me.deck.length === 0) {
      if (d.me.discard.length === 0) break;
      d.me.deck = shuffle(rng, d.me.discard);
      d.me.discard = [];
    }
    const id = d.me.deck.pop()!;
    const c = getCard(id);
    if (c.kind === 'curse') {
      if (c.onDraw?.energy) d.me.energy = Math.max(0, d.me.energy - c.onDraw.energy);
      if (c.onDraw?.hp) d.me.hp -= c.onDraw.hp;
      d.log.push({ who: 'sys', text: `【${c.name}】${c.flavor}（${cardText(c).replace(/^抽到時發作：|，然後補抽一張$/g, '')}）` });
      burned.push(id);
      i--;
      continue;
    }
    d.me.hand.push(id);
  }
  d.me.discard.push(...burned);
}

function makeIntent(kind: IntentKind, level: number, rng: Rng): Intent {
  // 每一招的力道有浮動，亮出意圖時就決定
  const swing = 1 + (rng.next() * 2 - 1) * DUEL.intentSwing;
  const a = DUEL.foeAttack(level) * swing;
  switch (kind) {
    case 'attack':
      return { kind, value: Math.round(a) };
    case 'combo':
      return { kind, value: Math.round(a * 0.55), hits: 2 };
    case 'guard':
      return { kind, value: Math.round(DUEL.foeGuard(level) * swing) };
    case 'charge':
      return { kind, value: Math.round(DUEL.foeCharge(level) * swing) };
    case 'feint':
      return { kind, value: Math.round(a * 0.5) };
    case 'drain':
      return { kind, value: Math.round(a * 0.6) };
    case 'enrage':
      return { kind, value: Math.round(2 + level * 0.6) };
    case 'heal':
      return { kind, value: Math.round(DUEL.foeHp(level) * 0.12 * swing) };
    case 'curse':
      return { kind, value: Math.round(a * 0.4) };
  }
}

function pickIntent(d: DuelState, rng: Rng, except?: IntentKind): Intent {
  const def = CONTENT.opponents[d.opponent];
  const weights: Partial<Record<IntentKind, number>> = { ...TEMPER[d.foe.temper ?? def.temper].weights, ...(d.foe.specials ?? def.specials) };
  // 氣血是滿的就不回氣
  if (d.foe.hp >= d.foe.max) delete weights.heal;
  const kind = rng.weighted(
    (Object.keys(weights) as IntentKind[]).filter((k) => k !== except).map((k) => ({ item: k, weight: weights[k]! })),
  )!;
  return makeIntent(kind, d.level, rng);
}

export function createDuel(fighter: Fighter, opponentId: string, choiceId: string, rng: Rng, s?: GameState): DuelState {
  const def = CONTENT.opponents[opponentId];
  if (!def) throw new Error(`未知對手：${opponentId}`);
  const easier = s && def.easierWith && checkCondition(s, def.easierWith) ? 1 : 0;
  const level = Math.max(0, opponentLevel(def, fighter.level) - easier);
  const affix = s ? rollAffix(s, rng) : undefined;
  const hp = Math.round(DUEL.foeHp(level) * (def.hpMult ?? 1) * (affix?.hpMult ?? 1));
  const passive = s ? passivesFor(s, def) : { names: [] };
  const realm = REALM[Math.min(5, fighter.level)];
  const energy = fighter.energy ?? realm.energy;
  const d: DuelState = {
    opponent: opponentId,
    name: `${affix ? affix.name : ''}${s ? fill(def.name, s) : def.name}`,
    level,
    lethal: Boolean(def.lethal),
    round: 1,
    clear: fighter.wuxing >= def.wuxing,
    seeTraps: fighter.wuxing >= def.wuxing + DUEL.seeTrapsMargin,
    me: {
      hp: Math.min(fighter.hp, fighter.startHp ?? fighter.hp), max: fighter.hp, block: 0, exposed: 0, bleed: 0,
      energy, energyMax: energy, energyNext: 0,
      drawPer: DUEL.drawPer + (fighter.wuxing >= DUEL.drawBonusWuxing ? 1 : 0) + (fighter.extraDraw ?? realm.draw) + (passive.drawPer ?? 0),
      handMax: DUEL.handMax + (passive.handMax ?? 0),
      passive,
      deck: shuffle(rng, fighter.deck), hand: [], discard: [], traps: [], played: [],
      money: fighter.money ?? 0, spent: 0, used: [],
    },
    foe: {
      hp, max: hp, block: 0, exposed: 0, bleed: 0, charge: 0, rage: affix?.rage ? affix.rage + level : 0,
      intent: { kind: 'attack', value: 0 },
      traps: [...(def.traps ?? []), ...(affix?.trap ? [affix.trap] : [])].map((id) => ({ id, used: false })),
    },
    log: [],
    choiceId,
  };
  d.log.push({ who: 'sys', text: d.lethal ? `你和${d.name}之間，今天只有一個人能站著離開。` : `你和${d.name}拉開了架勢。` });
  if (affix) d.log.push({ who: 'sys', text: affix.text.replaceAll('{foe}', d.name) });
  if (passive.names.length > 0) d.log.push({ who: 'sys', text: `你運起${passive.names.map((n) => `【${n.split('：')[0]}】`).join('')}。` });
  d.foe.intent = pickIntent(d, rng);
  d.me.energy += passive.firstRoundEnergy ?? 0;
  d.me.block += passive.blockPerRound ?? 0;
  if (passive.openExpose) d.foe.exposed = passive.openExpose;
  // 組合式小戰的開場狀況：被埋伏、搶到先機
  const opening = encounterOpenings.find((o) => o.id === s?.current?.vars?.openingId);
  if (opening?.id === 'ambush') d.me.energy = Math.max(0, d.me.energy - 1);
  if (opening?.id === 'spotted') d.foe.exposed = Math.max(d.foe.exposed, 2);
  if (opening?.duelNote) d.log.push({ who: 'sys', text: opening.duelNote });
  if (passive.bleedStart) d.foe.bleed += passive.bleedStart;
  drawCards(d, DUEL.startHand + (passive.firstRoundDraw ?? 0), rng);
  return d;
}

// ---------- 詞條、心法與信物（v0.5 §4、§6） ----------

/** 小戰一半的機會、精英一定會帶一個詞條，讓同一種對手打起來不一樣。 */
const AFFIXES: { name: string; text: string; hpMult?: number; rage?: number; trap?: string }[] = [
  { name: '狂暴的', text: '{foe}的眼睛都紅了，一出手就是拚命的打法。（每一擊傷害更重）', rage: 2 },
  { name: '耐打的', text: '{foe}的身板很硬，看起來不好打發。（氣血更多）', hpMult: 1.3 },
  { name: '狡詐的', text: '{foe}的眼神閃爍，像是藏著什麼後手。（多一張暗招）', trap: 'fanshou' },
  { name: '帶傷的', text: '{foe}的身上帶著傷，腳步有點虛。（氣血較少）', hpMult: 0.75 },
];

function rollAffix(s: GameState, rng: Rng): (typeof AFFIXES)[number] | undefined {
  const tier = s.current ? CONTENT.events.find((e) => e.id === s.current!.eventId)?.node?.tier : undefined;
  if (tier !== 'minor' && tier !== 'elite') return undefined;
  if (tier === 'minor' && !rng.chance(0.5)) return undefined;
  return rng.pick(AFFIXES);
}

const MONGOLS = ['mongol_scout', 'mongol_centurion', 'mongol_chiliarch', 'bater'];
const SCARS = ['scar_young', 'scar_old', 'scar_boss'];

/** 心法看門派（同時只能運一門）；信物只要帶在身上就有效。 */
export function passivesFor(s: GameState, def: OpponentDef): Passive {
  const p: Passive = { names: [] };
  switch (s.player.sect) {
    case 'changfeng':
      p.names.push('長風訣：每回合多抽一張，手牌上限 +1');
      p.drawPer = 1;
      p.handMax = 1;
      break;
    case 'yaogu':
      p.names.push('濟世心經：打完回復 10 點健康');
      p.healAfter = 10;
      break;
    case 'yijun':
      p.names.push('鐵脊樁功：每回合開始護體 3');
      p.blockPerRound = 3;
      break;
    case 'qinghen':
      p.names.push('青衡心訣：每回合第一張〈劍〉傷害 +3');
      p.firstTag = { tag: '劍', dmg: 3 };
      break;
    case 'baina':
      p.names.push('百衲心法：每回合第一張〈拳〉傷害 +3');
      p.firstTag = { tag: '拳', dmg: 3 };
      break;
    case 'xueyi':
      p.names.push('夜行心法：第一回合多抽兩張；內傷 +1');
      p.firstRoundDraw = 2;
      p.bleedBonus = 1;
      break;
  }
  const items = s.player.items ?? [];
  if (items.includes('bailing') && MONGOLS.includes(def.id)) {
    p.names.push('白翎箭：對蒙古人，第一回合內力 +1');
    p.firstRoundEnergy = 1;
  }
  if (items.includes('father_relic') && SCARS.includes(def.id)) {
    p.names.push('父親的遺物：對疤臉，每張攻擊牌傷害 +3');
    p.attackBonus = 3;
  }
  if (items.includes('lunwu_token') && s.current?.eventId.startsWith('lunwu')) {
    p.names.push('青冥台木牌：論武時每回合多抽一張');
    p.drawPer = (p.drawPer ?? 0) + 1;
  }
  if (items.includes('yaowang_notes')) {
    p.names.push('藥王手札：回復氣血的牌多回 4');
    p.healBonus = 4;
  }
  if (items.includes('xueyi_ling')) {
    p.names.push('血衣令：內傷 +1');
    p.bleedBonus = (p.bleedBonus ?? 0) + 1;
  }
  growthPassive(s, p);
  return p;
}

/** 首領氣血過半：換一套打法，說一句台詞。 */
function checkPhase(d: DuelState): void {
  const def = CONTENT.opponents[d.opponent];
  if (!def.phase2 || d.foe.phase2 || d.foe.hp <= 0 || d.foe.hp > d.foe.max / 2) return;
  const p = def.phase2;
  d.foe.phase2 = true;
  if (p.temper) d.foe.temper = p.temper;
  if (p.specials) d.foe.specials = { ...def.specials, ...p.specials };
  if (p.traps) d.foe.traps.push(...p.traps.map((id) => ({ id, used: false })));
  if (p.rage) d.foe.rage = (d.foe.rage ?? 0) + p.rage;
  say(d, 'foe', `「${p.line}」${d.name}的打法變了。`);
}

const say = (d: DuelState, who: 'me' | 'foe' | 'sys', text: string) => d.log.push({ who, text: text.replaceAll('{foe}', d.name) });

function hit(target: DuelState['me'] | DuelState['foe'], dmg: number, pierce = false): number {
  let x = target.exposed > 0 ? Math.round(dmg * DUEL.exposeMult) : dmg;
  if (!pierce) {
    const absorbed = Math.min(target.block, x);
    target.block -= absorbed;
    x -= absorbed;
  }
  target.hp -= x;
  return x;
}

export function canPlay(d: DuelState, handIndex: number): boolean {
  const c = getCard(d.me.hand[handIndex]);
  if (d.over || c.kind === 'curse' || c.cost > d.me.energy) return false;
  if (c.money && (d.me.money ?? 0) < c.money) return false;
  if (c.kind === 'trap' && d.me.traps.length >= DUEL.trapSlots) return false;
  return true;
}

/** 這張牌現在打出去的實際效果：算進承、連、讀招與蓄勢加成。給畫面預覽與自動出牌用。 */
export function resolvedEffect(d: DuelState, c: CardDef): CardEffect {
  const e: CardEffect = { ...c };
  const prev = d.me.played.length > 0 ? getCard(d.me.played[d.me.played.length - 1]) : undefined;
  if (c.after && prev?.tag && c.after.tags.includes(prev.tag)) {
    const { tags: _tags, ...bonus } = c.after;
    for (const [k, v] of Object.entries(bonus) as [keyof CardEffect, unknown][]) {
      if (typeof v === 'number') (e[k] as number | undefined) = ((e[k] as number | undefined) ?? 0) + v;
      else (e as Record<string, unknown>)[k] = v;
    }
  }
  if (c.dmgFromBlock) e.dmg = (e.dmg ?? 0) + d.me.block * c.dmgFromBlock;
  const pas = d.me.passive;
  if (pas?.guardBonus && c.kind === 'guard' && e.block) e.block += pas.guardBonus;
  if (e.dmg !== undefined) {
    let dmg = e.dmg;
    if (pas?.attackBonus && c.kind === 'attack') dmg += pas.attackBonus;
    if (c.tag && pas?.tagDmg?.[c.tag]) dmg += pas.tagDmg[c.tag]!;
    if (pas?.desperateBonus && c.kind === 'attack' && d.me.hp < d.me.max / 2) dmg += pas.desperateBonus;
    if (pas?.firstTag && c.tag === pas.firstTag.tag && !d.me.played.some((id) => getCard(id).tag === pas.firstTag!.tag)) dmg += pas.firstTag.dmg;
    if (c.chain) dmg += c.chain.dmg * d.me.played.filter((id) => !c.chain!.tags || c.chain!.tags.includes(getCard(id).tag!)).length;
    if (c.vsIntent && c.vsIntent.kinds.includes(d.foe.intent.kind)) dmg += c.vsIntent.dmg;
    if (c.desperate && d.me.hp < d.me.max / 2) dmg += c.desperate;
    const b = d.me.boost;
    if (b && c.tag && b.tags.includes(c.tag)) dmg = (dmg + (b.dmg ?? 0)) * (b.mult ?? 1);
    e.dmg = dmg;
  }
  return e;
}

function foeTrap(d: DuelState, trigger: string, match?: (t: { id: string }) => boolean) {
  return d.foe.traps.find((t) => !t.used && CONTENT.foeTraps[t.id].trigger === trigger && (!match || match(t)));
}

function springFoeTrap(d: DuelState, t: { id: string; used: boolean }): void {
  const def = CONTENT.foeTraps[t.id];
  t.used = true;
  say(d, 'foe', `【${def.name}】${def.text}`);
  if (def.dmg) hit(d.me, def.dmg);
  if (def.drain) d.me.energy = Math.max(0, d.me.energy - def.drain);
}

function checkLowHp(d: DuelState): void {
  if (d.me.hp >= d.me.max / 2) return;
  const t = foeTrap(d, 'lowHp');
  if (t) springFoeTrap(d, t);
}

function checkOver(d: DuelState): void {
  if (d.over) return;
  if (d.foe.hp <= 0) d.over = 'win';
  else if (d.me.hp <= 0) d.over = 'lose';
}

function applyCardEffect(d: DuelState, c: CardDef, e: CardEffect): void {
  if (e.breakGuard) d.foe.block = 0;
  if (e.dmg) {
    for (let i = 0; i < (e.hits ?? 1); i++) {
      const big = foeTrap(d, 'bigHit');
      if (big && e.dmg >= 12) {
        springFoeTrap(d, big);
        continue;
      }
      hit(d.foe, e.dmg, e.pierce);
    }
  }
  if (e.block) d.me.block += e.block;
  if (e.heal) d.me.hp = Math.min(d.me.max, d.me.hp + e.heal + (d.me.passive?.healBonus ?? 0));
  if (e.fortify) d.me.fortify = true;
  if (e.energy) d.me.energy += e.energy;
  if (e.energyNext) d.me.energyNext += e.energyNext;
  if (e.expose) d.foe.exposed = 2;
  if (e.bleed) d.foe.bleed += e.bleed + (d.me.passive?.bleedBonus ?? 0);
  if (e.bleedMult) d.foe.bleed *= e.bleedMult;
  if (e.breakTrap) {
    const t = d.foe.traps.find((x) => !x.used);
    if (t) {
      t.used = true;
      say(d, 'sys', `你破了${d.name}藏著的【${CONTENT.foeTraps[t.id].name}】。`);
    }
  }
  if (e.boostNext) d.me.boost = e.boostNext;
  else if (e.dmg && d.me.boost && c.tag && d.me.boost.tags.includes(c.tag)) d.me.boost = undefined;
}

export function playCard(state: DuelState, handIndex: number, rng: Rng): DuelState {
  if (!canPlay(state, handIndex)) throw new Error('這張牌現在打不出去');
  const d = structuredClone(state);
  const id = d.me.hand.splice(handIndex, 1)[0];
  const c = getCard(id);
  d.me.energy -= c.cost;
  const skill = cardSkill(id);
  if (skill && !(d.me.used ??= []).includes(skill)) d.me.used.push(skill);
  if (c.money) {
    d.me.money = (d.me.money ?? 0) - c.money;
    d.me.spent = (d.me.spent ?? 0) + c.money;
  }

  if (c.kind === 'trap') {
    d.me.traps.push(id);
    say(d, 'me', `你暗暗蓄勢，布下了【${c.name}】。`);
    return d;
  }

  const e = resolvedEffect(d, c);
  const nums = effectText({ dmg: e.dmg, hits: e.hits, block: e.block, heal: e.heal }).join('、');
  say(d, 'me', `【${c.name}】${c.flavor}${nums ? `（${nums}）` : ''}`);
  applyCardEffect(d, c, e);
  if (c.selfHp) d.me.hp -= c.selfHp;
  d.me.played.push(id);
  if (!c.exhaust) d.me.discard.push(id);
  if (e.draw) drawCards(d, e.draw, rng);

  // 對手的暗招
  const attacks = d.me.played.filter((x) => getCard(x).kind === 'attack').length;
  const third = c.kind === 'attack' && attacks === 3 ? foeTrap(d, 'thirdAttack') : undefined;
  if (third) springFoeTrap(d, third);
  const byTag = c.tag ? foeTrap(d, 'tag', (t) => CONTENT.foeTraps[t.id].tag === c.tag) : undefined;
  if (byTag) springFoeTrap(d, byTag);
  checkLowHp(d);
  checkOver(d);
  return d;
}

/** 發動符合條件的第一張伏招；回傳它，讓呼叫者處理閃避與減半。 */
function springTrap(d: DuelState, trigger: TrapTrigger, rng: Rng): CardDef | undefined {
  const i = d.me.traps.findIndex((id) => getCard(id).trigger === trigger);
  if (i < 0) return undefined;
  const id = d.me.traps.splice(i, 1)[0];
  const c = getCard(id);
  const e = resolvedEffect({ ...d, me: { ...d.me, played: [] } }, c);
  say(d, 'me', `【伏・${c.name}】${c.flavor}`);
  applyCardEffect(d, c, { ...e, dodge: undefined, halve: undefined });
  const pas = d.me.passive;
  if (e.draw || pas?.trapDraw) drawCards(d, (e.draw ?? 0) + (pas?.trapDraw ?? 0), rng);
  if (pas?.trapDmg) {
    d.foe.hp -= pas.trapDmg;
    say(d, 'me', `伏招得手，${d.name}又失了 ${pas.trapDmg} 氣血。`);
  }
  d.me.discard.push(id);
  return c;
}

function foeStrike(d: DuelState, intent: Intent, rng: Rng): void {
  const trap = (intent.kind === 'feint' && springTrap(d, 'foeFeint', rng)) || springTrap(d, 'foeAttack', rng);
  const verb = intent.kind === 'feint' ? '虛晃一招，趁你分神時出手' : intent.kind === 'combo' ? '連續出手' : '出手';
  for (let i = 0; i < (intent.hits ?? 1); i++) {
    if (d.foe.hp <= 0) return;
    let dmg = intent.value + d.foe.charge + (d.foe.rage ?? 0);
    if (trap?.dodge) {
      if (i === 0) say(d, 'foe', `${d.name}${verb}，卻撲了個空。`);
      continue;
    }
    if (trap?.halve) dmg = Math.ceil(dmg / 2);
    const taken = hit(d.me, dmg);
    say(d, 'foe', `${d.name}${verb}${(intent.hits ?? 1) > 1 ? `（第 ${i + 1} 下）` : ''}，你受了 ${taken} 點傷。`);
  }
  d.foe.charge = 0;
  if (intent.kind === 'feint') d.me.exposed = 2;
}

/** 心性過人：點穴、下毒無效（次數用完為止）。 */
function resisted(d: DuelState): boolean {
  const p = d.me.passive;
  if (!p?.resist) return false;
  p.resist -= 1;
  say(d, 'me', '你心神一定，沒讓那一下得逞。');
  return true;
}

/** 結束回合：對手出手，結算，然後抽牌進入下一回合。 */
export function endRound(state: DuelState, rng: Rng): DuelState {
  if (state.over) return state;
  const d = structuredClone(state);
  d.log = [];
  const temper = TEMPER[CONTENT.opponents[d.opponent].temper];

  let intent = d.foe.intent;
  if (rng.chance(temper.switch)) {
    intent = pickIntent(d, rng, intent.kind);
    say(d, 'foe', `${d.name}忽然變招！`);
  }
  d.foe.block = 0;
  switch (intent.kind) {
    case 'attack':
    case 'combo':
    case 'feint':
      foeStrike(d, intent, rng);
      break;
    case 'guard':
      d.foe.block = intent.value;
      say(d, 'foe', `${d.name}收招回護（護體 ${intent.value}）。`);
      springTrap(d, 'foeGuard', rng);
      break;
    case 'charge':
      d.foe.charge += intent.value;
      say(d, 'foe', `${d.name}凝神蓄勢，下一擊會更重（+${intent.value}）。`);
      springTrap(d, 'foeCharge', rng);
      break;
    case 'drain':
      foeStrike(d, intent, rng);
      if (resisted(d)) break;
      d.me.energyNext -= 1;
      say(d, 'foe', `${d.name}那一下拍在你的穴道上，你的內息一滯（下回合內力 −1）。`);
      break;
    case 'enrage':
      d.foe.rage = (d.foe.rage ?? 0) + intent.value;
      say(d, 'foe', `${d.name}怒吼一聲，出手越來越狠（往後每一擊 +${intent.value}）。`);
      break;
    case 'heal':
      d.foe.hp = Math.min(d.foe.max, d.foe.hp + intent.value);
      say(d, 'foe', `${d.name}退開幾步，調勻了氣息（回復 ${intent.value} 氣血）。`);
      break;
    case 'curse':
      foeStrike(d, intent, rng);
      if (resisted(d)) break;
      d.me.discard.push('wound');
      say(d, 'foe', `${d.name}的兵刃上淬了東西，傷口火辣辣地疼（你的牌堆裡多了一張「傷」）。`);
      break;
  }

  checkLowHp(d);
  checkPhase(d);
  if (d.me.fortify) d.me.fortify = undefined;
  else d.me.block = Math.floor(d.me.block * (d.me.passive?.retainBlock ?? 0));
  d.me.exposed = Math.max(0, d.me.exposed - 1);
  d.foe.exposed = Math.max(0, d.foe.exposed - 1);
  checkOver(d);
  if (d.over) return d;

  // 點到為止：回合用完，比剩下的氣血比例
  if (!d.lethal && d.round >= DUEL.maxRounds) {
    d.over = d.me.hp / d.me.max >= d.foe.hp / d.foe.max ? 'win' : 'lose';
    say(d, 'sys', d.over === 'win' ? '幾個回合下來，明眼人都看得出是你佔了上風。' : `幾個回合下來，明眼人都看得出是${d.name}佔了上風。`);
    return d;
  }

  // 下一回合
  d.round += 1;
  if (d.foe.bleed > 0) {
    d.foe.hp -= d.foe.bleed;
    say(d, 'sys', `${d.name}的內傷發作，失去 ${d.foe.bleed} 氣血。`);
    checkPhase(d);
    checkOver(d);
    if (d.over) return d;
  }
  d.me.energy = (d.me.energyMax ?? DUEL.energy) + d.me.energyNext;
  d.me.energyNext = 0;
  d.me.energy = Math.max(0, d.me.energy);
  d.me.played = [];
  d.me.block += d.me.passive?.blockPerRound ?? 0;
  drawCards(d, d.me.drawPer, rng);
  d.foe.intent = pickIntent(d, rng);
  return d;
}

export function yieldDuel(state: DuelState): DuelState {
  const d = structuredClone(state);
  d.over = 'yield';
  say(d, 'me', '你收招後退，拱手認輸。');
  return d;
}

/** 意圖顯示：悟性夠就看得到數字，否則只有一句描述。 */
export function intentText(d: DuelState): { label: string; detail: string } {
  const it = d.foe.intent;
  const def = CONTENT.opponents[d.opponent];
  const charge = d.foe.charge;
  const labels: Record<IntentKind, string> = {
    attack: '出手', combo: '連擊', guard: '守勢', charge: '蓄勢', feint: '虛招', drain: '點穴', enrage: '發狠', heal: '回氣', curse: '下毒',
  };
  if (!d.clear) return { label: '？', detail: def.tells[it.kind] };
  const value =
    it.kind === 'guard' || it.kind === 'charge' ? `${it.value}` : `${it.value + charge}${it.hits ? ` × ${it.hits}` : ''}`;
  return { label: `${labels[it.kind]} ${value}`, detail: def.tells[it.kind] };
}

/**
 * 健康就是血量（設計文件 v0.5 §3）：打完之後，健康 = 剩下的氣血比例。
 * 比試最低剩 10；生死之戰突圍再扣 15（最低 5）；生死之戰打輸回傳 0（死）。
 */
export function healthAfter(d: DuelState): number {
  const left = Math.round((Math.max(0, d.me.hp) / d.me.max) * 100);
  if (!d.lethal) return Math.max(DUEL.sparFloor, Math.min(100, left));
  if (d.over === 'lose') return 0;
  if (d.over === 'yield') return Math.max(5, left - DUEL.fleeCost);
  return Math.max(1, Math.min(100, left));
}
