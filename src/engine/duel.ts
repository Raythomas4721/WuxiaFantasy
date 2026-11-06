// 過招：招式牌（設計文件 §3.11）。
//
// 一回合：抽牌 → 你出牌（攻、守、技立刻生效；伏招蓋著）→ 對手照意圖出手（可能變招），
// 途中觸發你的伏招與他的暗招 → 結算 → 下一回合。手牌會留到下回合，可以攢牌湊連招。
// 公開函式都回傳新的 DuelState，不修改傳入的物件。

import { CONTENT } from '../content';
import { checkCondition, levelFromXp, skillLevel } from './conditions';
import type { Rng } from './rng';
import { fill } from './text';
import type {
  CardDef, CardEffect, CardTag, DuelState, GameState, Intent, IntentKind, OpponentDef, TrapTrigger,
} from './types';

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
  playerHp: (gengu: number, level: number) => 28 + gengu * 2 + level * 2,
  foeHp: (level: number) => 45 + level * 10,
  foeAttack: (level: number) => 11 + level * 2.5,
  foeGuard: (level: number) => 4 + level * 2,
  foeCharge: (level: number) => Math.round(3 + level * 1.5),
  /** 看穿暗招要比對手高出的悟性。 */
  seeTrapsMargin: 3,
  /** 健康換算：損失的氣血比例 × 這個數。 */
  healthLoss: 30,
};

const TEMPER: Record<OpponentDef['temper'], { weights: Record<IntentKind, number>; switch: number }> = {
  brute: { weights: { attack: 3.5, combo: 2, guard: 1.5, charge: 1.5, feint: 0.5 }, switch: 0 },
  veteran: { weights: { attack: 3, combo: 2, guard: 2, charge: 1, feint: 2 }, switch: 0.25 },
  guard: { weights: { attack: 3, combo: 1.5, guard: 3, charge: 1, feint: 1 }, switch: 0.1 },
};

// ---------- 牌 ----------

/** 「juma+」是升級過的拒馬：數值 × 1.35，名字加「＋」。 */
export function getCard(id: string): CardDef {
  const upgraded = id.endsWith('+');
  const base = CONTENT.cards[upgraded ? id.slice(0, -1) : id];
  if (!base) throw new Error(`未知招式牌：${id}`);
  if (!upgraded) return base;
  const up = (n?: number) => (n === undefined ? undefined : Math.round(n * DUEL.upgradeMult));
  return {
    ...base,
    id,
    name: `${base.name}＋`,
    dmg: up(base.dmg),
    block: up(base.block),
    bleed: up(base.bleed),
    heal: up(base.heal),
    chain: base.chain && { ...base.chain, dmg: up(base.chain.dmg)! },
    vsIntent: base.vsIntent && { ...base.vsIntent, dmg: up(base.vsIntent.dmg)! },
    after: base.after && { ...base.after, dmg: up(base.after.dmg), block: up(base.after.block) },
  };
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
  if (c.vsIntent) parts.push(`對手${c.vsIntent.kinds.includes('attack') ? '出手' : '守勢'}時 +${c.vsIntent.dmg}`);
  if (c.chain) parts.push(`連：這回合每出過一張${c.chain.tags ? tagList(c.chain.tags) : '牌'}，傷害 +${c.chain.dmg}`);
  if (c.after) parts.push(`承${tagList(c.after.tags)}：${effectText(c.after).join('、')}`);
  let text = parts.join('；');
  if (c.kind === 'trap' && c.trigger) text = `${TRIGGER_TEXT[c.trigger]}發動：${text}`;
  if (c.exhaust) text += '。用完移出';
  return text;
}

// ---------- 牌庫 ----------

/** 每個等級從主修武學的招式清單 [A, B, C, A, B, C] 依序拿幾張。 */
const CARDS_AT_LEVEL = [0, 1, 2, 4, 5, 6];
const BASE_DECK = ['punch', 'punch', 'punch', 'parry', 'parry', 'xieli', 'breathe'];

export interface Fighter {
  hp: number;
  wuxing: number;
  level: number;
  deck: string[];
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
 * 牌庫 = 基本牌 + 主修招式 + 副修各一張 + 醫術 + 特殊牌 + 傷與心魔。
 * 4 級起主修招式全部升級；5 級再拿掉兩張基本牌。
 */
export function deckFor(s: GameState): string[] {
  const { skill, level } = mainSkill(s);
  const deck = [...BASE_DECK];
  if (skill && level > 0) {
    const [a, b, c] = CONTENT.skillCards[skill];
    for (const id of [a, b, c, a, b, c].slice(0, CARDS_AT_LEVEL[level])) deck.push(level >= 4 ? `${id}+` : id);
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
  for (let i = 0; i < woundCount(s); i++) deck.push('wound');
  for (let i = 0; i < demonCount(s); i++) deck.push('demon');
  return deck;
}

export function woundCount(s: GameState): number {
  return s.player.health < 25 ? 2 : s.player.health < 50 ? 1 : 0;
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
  return { hp: DUEL.playerHp(s.player.stats.gengu, level), wuxing: s.player.stats.wuxing, level, deck: deckFor(s) };
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
  for (let i = 0; i < n && d.me.hand.length < DUEL.handMax; i++) {
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
  }
}

function pickIntent(d: DuelState, rng: Rng, except?: IntentKind): Intent {
  const weights = TEMPER[CONTENT.opponents[d.opponent].temper].weights;
  const kind = rng.weighted(
    (Object.keys(weights) as IntentKind[]).filter((k) => k !== except).map((k) => ({ item: k, weight: weights[k] })),
  )!;
  return makeIntent(kind, d.level, rng);
}

export function createDuel(fighter: Fighter, opponentId: string, choiceId: string, rng: Rng, s?: GameState): DuelState {
  const def = CONTENT.opponents[opponentId];
  if (!def) throw new Error(`未知對手：${opponentId}`);
  const easier = s && def.easierWith && checkCondition(s, def.easierWith) ? 1 : 0;
  const level = Math.max(0, opponentLevel(def, fighter.level) - easier);
  const hp = DUEL.foeHp(level);
  const d: DuelState = {
    opponent: opponentId,
    name: s ? fill(def.name, s) : def.name,
    level,
    lethal: Boolean(def.lethal),
    round: 1,
    clear: fighter.wuxing >= def.wuxing,
    seeTraps: fighter.wuxing >= def.wuxing + DUEL.seeTrapsMargin,
    me: {
      hp: fighter.hp, max: fighter.hp, block: 0, exposed: 0, bleed: 0,
      energy: DUEL.energy, energyNext: 0,
      drawPer: DUEL.drawPer + (fighter.wuxing >= DUEL.drawBonusWuxing ? 1 : 0),
      deck: shuffle(rng, fighter.deck), hand: [], discard: [], traps: [], played: [],
    },
    foe: {
      hp, max: hp, block: 0, exposed: 0, bleed: 0, charge: 0,
      intent: { kind: 'attack', value: 0 },
      traps: (def.traps ?? []).map((id) => ({ id, used: false })),
    },
    log: [],
    choiceId,
  };
  d.log.push({ who: 'sys', text: d.lethal ? `你和${d.name}之間，今天只有一個人能站著離開。` : `你和${d.name}拉開了架勢。` });
  d.foe.intent = pickIntent(d, rng);
  drawCards(d, DUEL.startHand, rng);
  return d;
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
  if (e.dmg !== undefined) {
    let dmg = e.dmg;
    if (c.chain) dmg += c.chain.dmg * d.me.played.filter((id) => !c.chain!.tags || c.chain!.tags.includes(getCard(id).tag!)).length;
    if (c.vsIntent && c.vsIntent.kinds.includes(d.foe.intent.kind)) dmg += c.vsIntent.dmg;
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
  if (e.heal) d.me.hp = Math.min(d.me.max, d.me.hp + e.heal);
  if (e.energy) d.me.energy += e.energy;
  if (e.energyNext) d.me.energyNext += e.energyNext;
  if (e.expose) d.foe.exposed = 2;
  if (e.bleed) d.foe.bleed += e.bleed;
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

  if (c.kind === 'trap') {
    d.me.traps.push(id);
    say(d, 'me', `你暗暗蓄勢，布下了【${c.name}】。`);
    return d;
  }

  const e = resolvedEffect(d, c);
  const nums = effectText({ dmg: e.dmg, hits: e.hits, block: e.block, heal: e.heal }).join('、');
  say(d, 'me', `【${c.name}】${c.flavor}${nums ? `（${nums}）` : ''}`);
  applyCardEffect(d, c, e);
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
  if (e.draw) drawCards(d, e.draw, rng);
  d.me.discard.push(id);
  return c;
}

function foeStrike(d: DuelState, intent: Intent, rng: Rng): void {
  const trap = (intent.kind === 'feint' && springTrap(d, 'foeFeint', rng)) || springTrap(d, 'foeAttack', rng);
  const verb = intent.kind === 'feint' ? '虛晃一招，趁你分神時出手' : intent.kind === 'combo' ? '連續出手' : '出手';
  for (let i = 0; i < (intent.hits ?? 1); i++) {
    if (d.foe.hp <= 0) return;
    let dmg = intent.value + d.foe.charge;
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
  }

  checkLowHp(d);
  d.me.block = 0;
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
    checkOver(d);
    if (d.over) return d;
  }
  d.me.energy = DUEL.energy + d.me.energyNext;
  d.me.energyNext = 0;
  d.me.played = [];
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
  const labels: Record<IntentKind, string> = { attack: '出手', combo: '連擊', guard: '守勢', charge: '蓄勢', feint: '虛招' };
  if (!d.clear) return { label: '？', detail: def.tells[it.kind] };
  const value =
    it.kind === 'guard' || it.kind === 'charge' ? `${it.value}` : `${it.value + charge}${it.hits ? ` × ${it.hits}` : ''}`;
  return { label: `${labels[it.kind]} ${value}`, detail: def.tells[it.kind] };
}

/** 損失的氣血換算成健康損失。 */
export function healthLossOf(d: DuelState): number {
  const lost = Math.max(0, d.me.max - Math.max(0, d.me.hp)) / d.me.max;
  return Math.round(lost * DUEL.healthLoss);
}
