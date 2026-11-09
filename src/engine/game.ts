// 遊戲流程：每個公開函式都接收舊狀態、回傳新狀態，不修改傳入的物件。
//
// 一回合：intro → (focus) → event → result → 下一回合 … → ended
// 七歲以前沒有方針，直接進事件。方針選定後會延續，只在新階段、轉折、倦怠或玩家要求時重選。

import { CONTENT } from '../content';
import { checkCondition, currentYear, martialLevel, npcAlive, skillLevel, unmetHints } from './conditions';
import { LEVEL_NAMES, STAT_NAMES, STAT_ORDER } from './describe';
import { applyEffects, killPlayer, withReputation } from './effects';
import { MARKET } from '../content/market';
import { createDuel, endRound, fighterFor, healthAfter, mainSkill, opponentLevel, playCard, yieldDuel } from './duel';
import { DECK, pushDuelReward, pushTask, startingDeck, upgradableIndexes } from './deck';
import { computeEnding } from './ending';
import { Rng } from './rng';
import { eventAllowed, forcedEvent, getEvent, selectEvent } from './select';
import { LIFE_STAGES, stageIndex } from './stages';
import { chineseNumber, eraName, fill, renderText } from './text';
import { adjacent, destinations, rollWorld } from './world';
import { encounterFoes, encounterOpenings, encounterPlaces } from '../content/encounters';
import { STAT_MAX, STAT_POINTS_PER_CHAPTER, perk } from './talents';
import type {
  Check,
  Condition,
  ChoiceView,
  DuelState,
  FocusContext,
  FocusDef,
  GameChoice,
  GameEvent,
  GameState,
  NodeKind,
  Outcome,
  OutcomeSpec,
  Snapshot,
  StatName,
  TurnResult,
  VarSpec,
} from './types';

export const SAVE_VERSION = 1;
const RUMOR_CHANCE = 0.75;
const CHILD_SUMMARY = '你在{place}一天天長大。';
/** 連續第幾次選同一方針開始倦怠，以及每多一次的成長機率折扣（會累乘）。 */
export const FATIGUE_STREAK = 4;
const FATIGUE_MULT = 0.5;

export interface NewGameSetup {
  name: string;
  /** 省略時依種子隨機投胎（一般遊玩都省略；測試可指定）。 */
  background?: string;
  region?: string;
  trait: string;
  seed: number;
}

// ---------- 建立角色 ----------

export function randomName(rng: Rng): string {
  return rng.pick(CONTENT.names.surnames) + rng.pick(CONTENT.names.given);
}

/** 先天特質三選一的候選。解鎖的特質要達成對應結局後才會進入候選池。 */
export function rollTraitOptions(seed: number, achievedEndings: string[]): string[] {
  const rng = new Rng(seed ^ 0x5bd1e995);
  const pool = Object.values(CONTENT.traits)
    .filter((t) => !t.unlockedBy || achievedEndings.includes(t.unlockedBy))
    .map((t) => t.id);
  return rng.sample(pool, 3);
}

export function newGame(setup: NewGameSetup): GameState {
  const rng = new Rng(setup.seed);
  const backgroundId =
    setup.background ??
    rng.weighted(Object.values(CONTENT.backgrounds).map((b) => ({ item: b.id, weight: b.weight ?? 1 })))!;
  const regionId = setup.region ?? rng.pick(Object.values(CONTENT.regions).filter((r) => !r.noBirth).map((r) => r.id));
  const bg = CONTENT.backgrounds[backgroundId];
  if (!bg) throw new Error(`未知出身：${backgroundId}`);
  if (!CONTENT.regions[regionId]) throw new Error(`未知地區：${regionId}`);

  const stats = {} as Record<StatName, number>;
  for (const k of STAT_ORDER) stats[k] = Math.max(1, Math.min(10, rng.int(3, 6) + (bg.statMods[k] ?? 0)));

  const fortuneRoll = rng.next();
  const bodyRoll = rng.next();
  const family: GameState['family'] = {
    siblings: rng.int(0, 3),
    fortune: fortuneRoll < 0.6 ? 'stable' : fortuneRoll < 0.85 ? 'decline' : 'rise',
    body: bodyRoll < 0.75 ? 'healthy' : bodyRoll < 0.88 ? 'weak' : 'illness',
    omen: rng.chance(0.06),
  };

  const s: GameState = {
    version: SAVE_VERSION,
    seed: setup.seed,
    rng: 0,
    phase: 'intro',
    turn: 0,
    prevYear: 0,
    player: {
      name: setup.name.trim() || randomName(rng),
      surname: '',
      birthYear: rng.int(1228, 1233),
      age: 0,
      background: backgroundId,
      birthRegion: regionId,
      region: regionId,
      trait: setup.trait,
      stats,
      fame: 0,
      chivalry: 0,
      alignment: 0,
      health: family.body === 'weak' ? 70 : family.body === 'illness' ? 80 : 100,
      money: bg.money,
      skills: {},
      masters: [],
      alive: true,
      deck: startingDeck(backgroundId, setup.trait),
    },
    family,
    companion: { name: rng.pick(CONTENT.names.childNames), trait: rng.pick(CONTENT.names.personalities) },
    rival: { name: rng.pick(CONTENT.names.surnames) + rng.pick(CONTENT.names.rivalGiven), trait: '' },
    flags: {},
    relations: {},
    fired: {},
    scheduled: [],
    recentTags: [],
    shownRumors: [],
    history: [],
  };
  s.player.surname = s.player.name.slice(0, 1);
  s.prevYear = s.player.birthYear - 1;

  if (family.fortune === 'decline') s.flags.fortune_decline = true;
  if (family.fortune === 'rise') s.flags.fortune_rise = true;
  if (family.body === 'weak') {
    s.flags.weak_body = true;
    s.player.stats.gengu = Math.max(1, s.player.stats.gengu - 1);
  }
  if (family.body === 'illness') s.flags.hidden_illness = true;
  if (family.omen) {
    s.flags.omen = true;
    s.player.stats.fuyuan += 1;
  }
  if (rng.chance(0.05)) s.flags.father_dead = true;
  else if (rng.chance(0.04)) s.flags.mother_dead = true;

  applyEffects(s, bg.effects, rng);
  applyEffects(s, CONTENT.traits[setup.trait]?.effects, rng);
  rollWorld(s, rng);
  s.rng = rng.state;
  return s;
}

/** 開場的命格敘述，一句一行。 */
export function describeOrigin(s: GameState): string[] {
  const p = s.player;
  const bg = CONTENT.backgrounds[p.background];
  const region = CONTENT.regions[p.birthRegion];
  const trait = CONTENT.traits[p.trait];
  const lines = [`${eraName(p.birthYear)}（${p.birthYear}），你生於${region.place}${bg.origin}。`];

  if (s.flags.father_dead) lines.push('你還沒出生，父親就因病過世了。母親一個人把你拉扯大。');
  else if (s.flags.mother_dead) lines.push('母親生你時難產過世，父親從此再沒有娶。');
  lines.push(
    s.family.siblings === 0 ? '你是家中唯一的孩子。' : `家中還有兄弟姊妹${chineseNumber(s.family.siblings)}人。`,
  );
  lines.push(
    {
      stable: '家境平平，倒也安穩。',
      decline: '家裡的日子看似平穩，長輩卻常常在夜裡嘆氣。',
      rise: '算命先生說，你家這幾年要走運。',
    }[s.family.fortune],
  );
  lines.push(
    {
      healthy: '你生來健壯，哭聲響亮。',
      weak: '你生來體弱，三天兩頭就要喝藥。',
      illness: '接生婆說你哭聲細弱，怕是胎裡帶了病。',
    }[s.family.body],
  );
  if (s.family.omen) lines.push('你出生那夜下著大雪，一位遊方道人在你家借宿，臨走前盯著你看了很久。');
  lines.push(`你天生${trait.name}：${trait.desc}`);
  return lines;
}

// ---------- 回合流程 ----------

function clone(s: GameState): GameState {
  return structuredClone(s);
}

function takeSnapshot(s: GameState): Snapshot {
  const skillLevels: Record<string, number> = {};
  for (const id of Object.keys(s.player.skills)) skillLevels[id] = skillLevel(s, id);
  return {
    stats: { ...s.player.stats },
    money: s.player.money,
    health: s.player.health,
    fame: s.player.fame,
    chivalry: s.player.chivalry,
    skillLevels,
    sect: s.player.sect,
    region: s.player.region,
  };
}

/** 與回合開始時相比的變化，給結果畫面顯示。 */
function describeGains(s: GameState): string[] {
  const before = s.snapshot;
  if (!before) return [];
  const p = s.player;
  const out: string[] = [];
  for (const k of STAT_ORDER) {
    const d = p.stats[k] - before.stats[k];
    if (d !== 0) out.push(`${STAT_NAMES[k]} ${d > 0 ? '+' : ''}${d}`);
  }
  for (const id of Object.keys(p.skills)) {
    const lv = skillLevel(s, id);
    if (lv > (before.skillLevels[id] ?? 0)) out.push(`${CONTENT.skills[id]?.name ?? id}・${LEVEL_NAMES[lv]}`);
  }
  const dm = p.money - before.money;
  if (dm !== 0) out.push(`錢財 ${dm > 0 ? '+' : ''}${dm} 文`);
  const dh = p.health - before.health;
  if (dh !== 0) out.push(`健康 ${dh > 0 ? '+' : ''}${dh}`);
  if (p.fame > before.fame) out.push('名望 ↑');
  if (p.fame < before.fame) out.push('名望 ↓');
  if (p.chivalry > before.chivalry) out.push('俠義 ↑');
  if (p.chivalry < before.chivalry) out.push('俠義 ↓');
  if (p.sect !== before.sect) {
    if (p.sect) out.push(`加入${CONTENT.sects[p.sect].name}`);
    else if (before.sect) out.push(`離開${CONTENT.sects[before.sect].name}`);
  }
  if (p.region !== before.region) out.push(`來到${CONTENT.regions[p.region].name}`);
  return out;
}

function pickRumor(s: GameState, rng: Rng): string | undefined {
  if (s.flags.inquire) {
    delete s.flags.inquire;
    const news = whereabouts(s, rng);
    if (news) return news;
  }
  if (!rng.chance(RUMOR_CHANCE)) return undefined;
  const pool = CONTENT.rumors
    .filter((r) => !s.shownRumors.includes(r.id) && checkCondition(s, r.conditions))
    .map((r) => ({ item: r, weight: r.weight ?? 1 }));
  const r = rng.weighted(pool);
  if (!r) return undefined;
  s.shownRumors.push(r.id);
  return fill(r.text, s);
}

/** 打聽來的消息：一位還活著、此刻有固定行蹤的名俠在哪裡。 */
function whereabouts(s: GameState, rng: Rng): string | undefined {
  const year = currentYear(s);
  const known = Object.values(CONTENT.npcs).filter(
    (n) => n.codex && npcAlive(s, n.id) && n.presence.some((p) => year >= p.from && year <= p.to && !p.regions.includes('*')),
  );
  if (known.length === 0) return undefined;
  const n = rng.pick(known);
  const where = n.presence.find((p) => year >= p.from && year <= p.to)!.regions.map((r) => CONTENT.regions[r]?.name ?? r);
  return `你花錢打聽到：${n.title ? `「${n.title}」` : ''}${n.name}這幾年在${where.join('、')}一帶。`;
}

function pushTags(s: GameState, tags: string[]): void {
  s.recentTags = [...s.recentTags, tags].slice(-2);
}

function setResult(s: GameState, rng: Rng, result: Omit<TurnResult, 'gains' | 'rumor'>): void {
  s.result = { ...result, gains: describeGains(s), rumor: pickRumor(s, rng) };
  s.phase = 'result';
  // 這段日子結束了：預告下一段日子的關卡，讓玩家決定要不要換方針
  s.upcoming = s.player.alive && !s.followUp && !s.chain && s.focus ? { focus: s.focus, node: rollNode(s.focus, rng) } : undefined;
}

// ---------- 關卡（設計文件 v0.5 §1） ----------

/** 平衡數值集中在這裡。 */
export const NODE = {
  /** 一段日子擲幾個關卡。 */
  perPeriod: 2,
  /** 歇：回復多少健康；行醫的人多回一些。 */
  restHeal: 15,
  restHealMedicine: 25,
  /** 每過一年回復多少健康；一段日子最多回復多少。 */
  healPerYear: 25,
  healMax: 60,
  /** 一段日子至少回復多少（少年時一段日子只有一年）。 */
  healMin: 35,
  /** 打贏之後喘口氣，回復的健康。 */
  winHeal: 15,
  /** 同一年接連發生的事件之間回復的健康。 */
  chainHeal: 25,
  /** 健康低於這裡，這段日子有可能病死。 */
  frailHealth: 15,
  /** 晚年的章末首領在幾歲出現。 */
  lastBossAge: 62,
  /** 武館：一張牌多少錢；花錢刪牌的起價與每次加價。 */
  cardPrice: 40,
  removePrice: 50,
  removeStep: 25,
};

export function rollNode(focusId: string, rng: Rng): NodeKind {
  const weights = CONTENT.nodeWeights[focusId] ?? { story: 1 };
  return rng.weighted((Object.entries(weights) as [NodeKind, number][]).map(([item, weight]) => ({ item, weight }))) ?? 'story';
}

/** 這段日子要打的章末首領：剛結束的那一章（晚年在 62 歲）。每章只打一次。 */
export function dueBoss(s: GameState): GameEvent | undefined {
  const stage = stageIndex(s.player.age);
  const k = s.player.age >= NODE.lastBossAge ? 5 : stage - 1;
  if (k < 2 || s.bosses?.includes(k)) return undefined;
  s.bosses = [...(s.bosses ?? []), k];
  return CONTENT.events
    .filter((e) => e.kind === 'node' && e.node?.tier === 'boss' && e.node.stage === k && eventAllowed(s, e))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
}

function pickEncounter(s: GameState, tier: 'minor' | 'elite', rng: Rng): GameEvent | undefined {
  const pool = CONTENT.events
    .filter((e) => e.kind === 'node' && e.node?.tier === tier && eventAllowed(s, e))
    .map((e) => ({ item: e, weight: (e.weightMods ?? []).reduce((w, m) => (checkCondition(s, m.if) ? w * m.mult : w), 1) }));
  return rng.weighted(pool) ?? undefined;
}

/** 照方針擲出的關卡：小戰、精英先打，打完同一段日子再接劇情；歇、悟、武館直接生效。 */
function runNode(s: GameState, rng: Rng, focusId: string, far = false): void {
  // 立志、史實大事、論武這些強制事件優先，這段日子不擲關卡
  if (forcedEvent(s)) {
    s.upcoming = undefined;
    presentEvent(s, rng);
    return;
  }
  // 一段日子擲兩個關卡；這段日子有章末首領的話，首領之後只再擲一個
  const first = s.upcoming?.focus === focusId ? s.upcoming.node : rollNode(focusId, rng);
  s.upcoming = undefined;
  const boss = dueBoss(s);
  s.nodeQueue = boss ? [first] : [first, ...Array.from({ length: NODE.perPeriod - 1 }, () => rollNode(focusId, rng))];
  // 遠路：路上多一場小戰
  if (far) s.nodeQueue.unshift('fight');
  if (boss) {
    s.followUp = true;
    presentEvent(s, rng, boss);
    return;
  }
  continueNodes(s, rng);
}

/** 依序處理這段日子剩下的關卡：遇到要打的就停下來開打，都處理完了才進劇情。 */
function continueNodes(s: GameState, rng: Rng): void {
  while (s.nodeQueue?.length) {
    const node = s.nodeQueue.shift()!;
    const encounter = node === 'fight' || node === 'elite' ? pickEncounter(s, node === 'elite' ? 'elite' : 'minor', rng) : undefined;
    if (encounter) {
      s.followUp = true;
      presentEvent(s, rng, encounter);
      return;
    }
    applyQuietNode(s, node, s.focus ?? '');
  }
  s.nodeQueue = undefined;
  presentEvent(s, rng);
}

/** 不用打的關卡：歇、悟、武館。 */
function applyQuietNode(s: GameState, node: NodeKind, focusId: string): void {
  const notes: string[] = [];
  if (node === 'rest') {
    const heal = focusId === 'medicine' ? NODE.restHealMedicine : NODE.restHeal;
    s.player.health = Math.min(100, s.player.health + heal);
    notes.push(`☕ 你找了個清靜的地方，好好歇了一陣子（健康 +${heal}）。`);
    if ((s.player.deck?.length ?? 0) > DECK.minDeck) {
      pushTask(s, {
        kind: 'remove',
        title: '修心',
        text: `歇著的時候，正好把雜亂的招式理一理。刪一張牌，但這段休養少回 ${DECK.meditateHealth} 點健康。`,
        cost: { health: DECK.meditateHealth },
      });
    }
  } else if (node === 'insight' && upgradableIndexes(s).length > 0) {
    notes.push('☯ 你閉關了一陣子，把一招翻來覆去地練。');
    pushTask(s, { kind: 'upgrade', title: '閉關有得', text: '練到某一天，忽然有了新的體會。升級一張牌。' });
    // 悟性過人：一通百通
    if (perk(s, 'wuxing') && upgradableIndexes(s).length > 1) {
      pushTask(s, { kind: 'upgrade', title: '一通百通', text: '你悟性過人，一招想通了，另一招也跟著通了。再升級一張牌。' });
    }
  } else if (node === 'market') {
    s.dojo = { turn: s.turn };
    notes.push('⚖ 你路過一家武館，館主說，花點錢可以教你一招，也可以幫你把練歪的招式改掉。');
  }
  if (notes.length > 0) s.notices = [...(s.notices ?? []), ...notes];
}

function quietTurn(s: GameState, rng: Rng): void {
  const focus = CONTENT.focuses.find((f) => f.id === s.focus);
  const options = focus ? varPool(s, focus.summary) : [];
  const text = fill(options.length > 0 ? rng.pick(options) : CHILD_SUMMARY, s);
  s.history.push({ turn: s.turn, age: s.player.age, year: currentYear(s), title: '歲月', text });
  pushTags(s, focus?.tags ?? []);
  setResult(s, rng, { title: '歲月', text });
}

function presentEvent(s: GameState, rng: Rng, next?: GameEvent): void {
  const e = next ?? selectEvent(s, rng);
  if (!e) {
    quietTurn(s, rng);
    return;
  }
  const prev = s.fired[e.id];
  s.fired[e.id] = { count: (prev?.count ?? 0) + 1, lastYear: currentYear(s) };
  applyEffects(s, e.enterEffects, rng);
  const vars = rollVars(s, e, rng);
  s.current = { eventId: e.id, text: renderText(e.text, s, vars), vars };
  s.phase = 'event';
}

/** 素材池：純字串全部可用；條件清單則合併所有條件符合的值。 */
function varPool(s: GameState, spec: VarSpec): string[] {
  return spec.flatMap((v) => (typeof v === 'string' ? [v] : checkCondition(s, v.if) ? v.values : []));
}

/** 過招對手：寫成 {foe} 的，從這次事件抽到的素材裡拿。 */
export function opponentOf(s: GameState, duel: { opponent: string }): string {
  const m = /^\{(\w+)\}$/.exec(duel.opponent);
  return m ? s.current?.vars?.[m[1]] ?? duel.opponent : duel.opponent;
}

/** 組合式小戰：地點 × 對手 × 開場狀況。 */
function rollEncounter(s: GameState, rng: Rng): Record<string, string> {
  const ok = <T extends { conditions?: Condition }>(xs: T[]) => xs.filter((x) => checkCondition(s, x.conditions));
  const place = rng.pick(ok(encounterPlaces));
  const foe = rng.pick(ok(encounterFoes));
  const opening = rng.weighted(encounterOpenings.map((o) => ({ item: o, weight: o.weight })))!;
  const text = opening.text.replaceAll('{who}', foe.who).replaceAll('{demand}', foe.demand);
  return {
    scene: place.scene,
    opening: text,
    foe: foe.opponent,
    openingId: opening.id,
    fight: opening.fight,
    avoid: opening.avoid ?? foe.avoid,
    avoided: opening.avoided ?? foe.avoided,
    win: foe.win,
    lose: foe.lose,
  };
}

/** 組合式事件：每個變數從符合條件的素材池裡抽一個。 */
function rollVars(s: GameState, e: GameEvent, rng: Rng): Record<string, string> | undefined {
  if (e.encounter) return { ...rollEncounter(s, rng), ...(e.vars ? rollVars(s, { ...e, encounter: false }, rng) : {}) };
  if (!e.vars) return undefined;
  const out: Record<string, string> = {};
  for (const [key, spec] of Object.entries(e.vars)) {
    const pool = varPool(s, spec);
    if (pool.length > 0) out[key] = rng.pick(pool);
  }
  return out;
}

function beginTurn(s: GameState, rng: Rng): void {
  s.turn += 1;
  s.snapshot = takeSnapshot(s);
  s.current = undefined;
  s.result = undefined;
  // 產業收入算在這一回合的收穫裡
  const income = (s.player.properties ?? []).reduce((sum, x) => sum + MARKET.income[x.kind], 0);
  if (income > 0) s.player.money += income;
  if (s.player.age < 7) {
    presentEvent(s, rng);
    return;
  }
  // 每章開場（少年起）給屬性點，在選方針的畫面上分配
  const stage = stageIndex(s.player.age);
  if (stage >= 2 && stage > (s.pointStage ?? 1) && Object.values(s.player.stats).some((v) => v < STAT_MAX)) {
    s.statPoints = (s.statPoints ?? 0) + STAT_POINTS_PER_CHAPTER;
    s.pointStage = stage;
  }
  s.focusPrompt = focusPrompt(s);
  s.wantsFocusChange = undefined;
  if (s.focusPrompt) s.phase = 'focus';
  else runFocus(s, rng, s.focus!);
}

function focusContext(s: GameState): FocusContext {
  const p = s.player;
  return { stage: stageIndex(p.age), sect: p.sect, region: p.region, ambition: p.ambition, masters: p.masters.length };
}

/** 這回合是否要重新選方針；不用的話回傳 undefined，沿用原方針。 */
function focusPrompt(s: GameState): GameState['focusPrompt'] {
  const now = focusContext(s);
  const before = s.focusContext;
  const current = s.focus ? focusOptions(s).find((f) => f.id === s.focus) : undefined;
  const stageText = LIFE_STAGES[now.stage].opening;
  if (!before || !s.focus || before.stage !== now.stage) return { reason: 'stage', text: stageText };
  if (!current) {
    const name = CONTENT.focuses.find((f) => f.id === s.focus)?.name ?? '';
    return { reason: 'invalid', text: `「${name}」的日子，已經過不下去了。往後得另作打算。` };
  }
  if (before.sect !== now.sect) {
    return {
      reason: 'sect',
      text: now.sect ? `拜入${CONTENT.sects[now.sect].name}之後，日子不一樣了。` : '離開師門之後，一切都得重新打算。',
    };
  }
  if (before.masters !== now.masters) return { reason: 'master', text: '有了師父，往後的日子該怎麼過，得重新想想。' };
  if (before.ambition !== now.ambition) {
    const amb = now.ambition ? CONTENT.ambitions[now.ambition] : undefined;
    return { reason: 'ambition', text: amb ? `你立志「${amb.name}」。要怎麼走到那裡？` : '你的心意變了。' };
  }
  if (before.region !== now.region) {
    return { reason: 'region', text: `來到${CONTENT.regions[now.region].name}，人生地不熟，得重新打算。` };
  }
  if (s.wantsFocusChange) return { reason: 'manual', text: '你停下腳步，想了想往後的日子。' };
  if (streakIfChosen(s, s.focus) === FATIGUE_STREAK) {
    return { reason: 'fatigue', text: `「${current.name}」的日子過了好些年，你漸漸有些倦了。也許該換點別的事做？` };
  }
  return undefined;
}

function finish(s: GameState): void {
  s.ending = computeEnding(s);
  s.phase = 'ended';
}

/** 從命格畫面進入第一回合。 */
export function startLife(state: GameState): GameState {
  const s = clone(state);
  const rng = new Rng(s.rng);
  beginTurn(s, rng);
  s.rng = rng.state;
  return s;
}

export function focusOptions(s: GameState): FocusDef[] {
  const child = s.player.age < 13;
  return CONTENT.focuses.filter((f) => Boolean(f.childhood) === child && checkCondition(s, f.conditions));
}

/** 若這回合選了此方針，會是連續第幾次。 */
export function streakIfChosen(s: GameState, focusId: string): number {
  return s.focusStreak?.id === focusId ? s.focusStreak.count + 1 : 1;
}

export function chooseFocus(state: GameState, focusId: string, dest?: string): GameState {
  if (state.phase !== 'focus') throw new Error('現在不是選擇方針的時候');
  if (state.statPoints) throw new Error('先把屬性點分配完');
  if (!focusOptions(state).some((f) => f.id === focusId)) throw new Error(`無法選擇方針：${focusId}`);
  if (dest && (focusId !== 'travel' || !destinations(state).some((d) => d.id === dest))) throw new Error(`去不了：${dest}`);
  const s = clone(state);
  const rng = new Rng(s.rng);
  s.focusContext = focusContext(s);
  s.focusPrompt = undefined;
  let far = false;
  if (dest) {
    far = !adjacent(s.player.region, dest);
    s.player.region = dest;
    s.travelDest = dest;
    s.focusContext = focusContext(s);
    const name = CONTENT.regions[dest].name;
    s.notices = [...(s.notices ?? []), far ? `你往${name}去。路很遠，一路上不太平。` : `你收拾行囊，往${name}去。`];
  }
  runFocus(s, rng, focusId, far);
  s.rng = rng.state;
  return s;
}

/** 選方針之前，分配一點屬性點。 */
export function allocateStat(state: GameState, stat: StatName): GameState {
  if (state.phase !== 'focus' || !state.statPoints) throw new Error('現在沒有屬性點可以分配');
  if (state.player.stats[stat] >= STAT_MAX) throw new Error('這個屬性已經到頂了');
  const s = clone(state);
  s.player.stats[stat] += 1;
  s.statPoints = (s.statPoints ?? 1) - 1;
  if (s.statPoints <= 0) s.statPoints = undefined;
  return s;
}

/** 結果畫面上的「接下來改做別的事」：下一回合重新選方針。 */
export function requestFocusChange(state: GameState): GameState {
  if (state.phase !== 'result') throw new Error('現在不能改變方針');
  return { ...state, wantsFocusChange: true };
}

/** 照方針過一段日子：成長（連續太久會遞減），然後抽事件。 */
function runFocus(s: GameState, rng: Rng, focusId: string, far = false): void {
  const focus = CONTENT.focuses.find((f) => f.id === focusId);
  if (!focus) throw new Error(`未知方針：${focusId}`);
  const streak = streakIfChosen(s, focusId);
  // 連續做同一件事，收穫會越來越少：第四次起每多一次，成長機率再打一次折。
  const fatigue = streak >= FATIGUE_STREAK ? FATIGUE_MULT ** (streak - FATIGUE_STREAK + 1) : 1;
  for (const g of focus.growth) {
    if (!rng.chance((g.chance ?? 1) * fatigue)) continue;
    applyEffects(s, [g.effect], rng);
    if (focusId === 'trade' && g.effect.type === 'money' && g.effect.delta > 0 && s.player.properties?.some((x) => x.kind === 'shop')) {
      s.player.money += Math.round(g.effect.delta * MARKET.shopTradeBonus);
    }
  }
  s.focus = focusId;
  s.focusStreak = { id: focusId, count: streak };
  runNode(s, rng, focusId, far);
}

/** 檢定的勝算；打點過門路的人，拜師入門的檢定 +20%。 */
function choiceChance(s: GameState, check: Check): number {
  const joins = [check.success].flat().some((o) => o.effects?.some((e) => e.type === 'joinSect'));
  const bonus = joins && s.flags.connections ? 0.2 : 0;
  return Math.min(0.95, checkChance(s, check) + bonus);
}

export function checkChance(s: GameState, check: Check): number {
  const avg = check.stats.reduce((sum, k) => sum + s.player.stats[k], 0) / check.stats.length;
  let value = avg;
  if (check.martial) value += martialLevel(s) * 1.5;
  if (check.skill) value += skillLevel(s, check.skill) * 1.5;
  return Math.max(0.05, Math.min(0.95, 0.5 + (value - check.difficulty) * 0.12));
}

export function oddsLabel(p: number): string {
  if (p >= 0.75) return '把握很大';
  if (p >= 0.5) return '有幾分把握';
  if (p >= 0.3) return '勉強一試';
  return '九死一生';
}

export function choiceViews(s: GameState): ChoiceView[] {
  if (s.phase !== 'event' || !s.current) return [];
  const e = getEvent(s.current.eventId);
  const views: ChoiceView[] = [];
  for (const c of e.choices) {
    const enabled = checkCondition(s, c.requires);
    if (!enabled && c.hidden) continue;
    views.push({
      id: c.id,
      text: fill(c.text, s, s.current.vars),
      enabled,
      hint: enabled ? undefined : c.hint ?? (unmetHints(s, c.requires).join('、') || '條件不足'),
      odds: enabled && c.check ? oddsLabel(choiceChance(s, c.check)) : enabled && c.duel ? duelOdds(s, opponentOf(s, c.duel)) : undefined,
      duel: Boolean(c.duel),
      lethal: c.duel ? Boolean(CONTENT.opponents[opponentOf(s, c.duel)]?.lethal) : undefined,
    });
  }
  return views;
}

export function resolveOutcome(s: GameState, spec: OutcomeSpec): Outcome {
  if (!Array.isArray(spec)) return spec;
  const hit = spec.find((o) => checkCondition(s, o.if));
  if (!hit) throw new Error('沒有符合條件的結果');
  return hit;
}

export function chooseOption(state: GameState, choiceId: string): GameState {
  if (state.phase !== 'event' || !state.current) throw new Error('現在沒有事件可以選擇');
  const e = getEvent(state.current.eventId);
  const choice = e.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`未知選項：${choiceId}`);
  if (!checkCondition(state, choice.requires)) throw new Error(`條件不足：${choiceId}`);

  const s = clone(state);
  const rng = new Rng(s.rng);
  if (choice.duel) {
    s.duel = createDuel(fighterFor(s), opponentOf(s, choice.duel), choice.id, rng, s);
    s.phase = 'duel';
    s.rng = rng.state;
    return s;
  }
  let spec: OutcomeSpec;
  let check: TurnResult['check'];
  if (choice.check) {
    const ok = rng.chance(choiceChance(s, choice.check));
    check = ok ? 'success' : 'failure';
    spec = ok ? choice.check.success : choice.check.failure;
  } else if (choice.outcome) {
    spec = choice.outcome;
  } else {
    throw new Error(`選項沒有結果：${e.id}/${choice.id}`);
  }
  applyChoiceOutcome(s, rng, e, choice, spec, check);
  s.rng = rng.state;
  return s;
}

/** 套用選項的結果：效果、人生紀錄、結果畫面。 */
function applyChoiceOutcome(
  s: GameState, rng: Rng, e: GameEvent, choice: GameChoice, spec: OutcomeSpec, check: TurnResult['check'], afterDuel = false,
): void {
  const outcome = resolveOutcome(s, spec);
  // 過招的傷已經算在剩下的氣血裡，結果裡的健康損失不再重複扣
  const effects = afterDuel ? outcome.effects?.filter((x) => !(x.type === 'health' && x.delta < 0)) : outcome.effects;
  applyEffects(s, withReputation(effects), rng);
  const vars = s.current?.vars;
  const text = renderText(outcome.text, s, vars);
  s.history.push({
    turn: s.turn,
    age: s.player.age,
    year: currentYear(s),
    title: e.title,
    choice: fill(choice.text, s, vars),
    text,
    recap: outcome.recap ? { weight: outcome.recap.weight, text: fill(outcome.recap.text, s, vars) } : undefined,
  });
  pushTags(s, e.tags ?? []);
  setResult(s, rng, { title: e.title, text, check });
  s.current = undefined;
}

// ---------- 過招 ----------

/**
 * 選項上的勝算提示：主修武學和對手的等級差，再算進你現在的健康（開打時的氣血）
 * 和對手的耐打程度（精英、生死之戰的對手氣血比較少）、打點過的門路。
 */
export function duelScore(s: GameState, opponentId: string): number {
  const def = CONTENT.opponents[opponentId];
  const mine = mainSkill(s).level;
  const easier = def.easierWith && checkCondition(s, def.easierWith) ? 1 : 0;
  let score = mine - Math.max(0, opponentLevel(def, mine) - easier);
  const h = s.player.health;
  score += h >= 70 ? 0 : h >= 45 ? -0.5 : h >= 25 ? -1 : -2;
  score += (1 - (def.hpMult ?? 1)) * 2;
  return score;
}

function duelOdds(s: GameState, opponentId: string): string {
  const score = duelScore(s, opponentId);
  if (score >= 1) return '把握很大';
  if (score >= 0) return '有幾分把握';
  if (score >= -1) return '勉強一試';
  return '九死一生';
}

function duelStep(state: GameState, step: (d: DuelState, rng: Rng) => DuelState): GameState {
  if (state.phase !== 'duel' || !state.duel) throw new Error('現在沒有在過招');
  const s = clone(state);
  const rng = new Rng(s.rng);
  s.duel = step(s.duel!, rng);
  s.rng = rng.state;
  return s;
}

export function duelPlay(state: GameState, handIndex: number): GameState {
  return duelStep(state, (d, rng) => playCard(d, handIndex, rng));
}

export function duelEndRound(state: GameState): GameState {
  return duelStep(state, (d, rng) => endRound(d, rng));
}

export function duelYield(state: GameState): GameState {
  return duelStep(state, (d) => yieldDuel(d));
}

/** 過招結束後收招：損失的氣血換算成健康，再走事件的成功或失敗結果。 */
export function finishDuel(state: GameState): GameState {
  if (state.phase !== 'duel' || !state.duel?.over || !state.current) throw new Error('過招還沒結束');
  const s = clone(state);
  const rng = new Rng(s.rng);
  const d = s.duel!;
  const e = getEvent(s.current!.eventId);
  const choice = e.choices.find((c) => c.id === d.choiceId)!;
  const won = d.over === 'win';
  // 健康就是血量：打完之後，健康 = 剩下的氣血比例；生死之戰打輸就死了
  // 打贏了喘口氣，回一點健康（生死之戰之外的輸贏都不會低於比試的底線）
  const health = healthAfter(d) + (won && healthAfter(d) > 0 ? NODE.winHeal : 0);
  s.player.health = Math.min(100, health);
  if (health <= 0) killPlayer(s, 'duel');
  // 濟世心經：打完回一點健康
  if (s.player.alive && d.me.passive?.healAfter) s.player.health = Math.min(100, s.player.health + d.me.passive.healAfter);
  if (d.me.spent) s.player.money = Math.max(0, s.player.money - d.me.spent);
  // 用什麼就精什麼：打出過哪門武學的牌，那門武學就多一點經驗
  applyEffects(s, (d.me.used ?? []).map((skill) => ({ type: 'skill' as const, skill, xp: DECK.duelXp })), rng);
  s.duel = undefined;
  applyChoiceOutcome(s, rng, e, choice, won ? choice.duel!.success : choice.duel!.failure, won ? 'success' : 'failure', true);
  if (!s.player.alive) {
    s.followUp = undefined;
    s.upcoming = undefined;
    s.history.push({ turn: s.turn, age: s.player.age, year: currentYear(s), title: '終章', text: `你${CONTENT.deathCauses[s.deathCause ?? 'duel']}。` });
  }
  if (won && s.player.alive) pushDuelReward(s, rng, d.name, e.node?.tier);
  s.rng = rng.state;
  return s;
}

export function timeStep(s: GameState): number {
  const age = s.player.age;
  if (s.flags.retired || s.flags.returned_home) return 5;
  if (age < 6) return 3;
  if (age === 6) return 1;
  if (age < 13) return 2;
  if (age < 19) return 1;
  if (age < 30) return 2;
  if (age < 50) return 3;
  return 4;
}

/** 戰亂毀掉產業：這段時間裡發生的城破，當地產業全沒了。 */
function loseProperties(s: GameState): void {
  const year = currentYear(s);
  for (const risk of CONTENT.propertyRisks) {
    if (risk.year <= s.prevYear || risk.year > year) continue;
    const before = s.player.properties ?? [];
    const after = before.filter((x) => x.region !== risk.region);
    if (after.length === before.length) continue;
    s.player.properties = after;
    s.notices = [...(s.notices ?? []), risk.text];
    s.history.push({ turn: s.turn, age: s.player.age, year: risk.year, title: '產業', text: risk.text });
  }
}

/** 結果畫面之後：推進時間、判定壽終，進入下一回合或結局。 */
export function nextTurn(state: GameState): GameState {
  if (state.phase !== 'result') throw new Error('現在不能進入下一回合');
  const s = clone(state);
  const rng = new Rng(s.rng);
  const p = s.player;

  // 同一年接著發生的事件、關卡打完之後的劇情：不推進時間
  if (p.alive && (s.chain || s.followUp)) {
    const next = s.chain ? getEvent(s.chain) : undefined;
    // 同一年接連幾場（論武的預賽、正賽、決賽）：中間能喘口氣
    if (s.chain) p.health = Math.min(100, p.health + NODE.chainHeal);
    s.chain = undefined;
    s.followUp = undefined;
    s.deckTasks = undefined;
    s.snapshot = takeSnapshot(s);
    s.result = undefined;
    if (!next && s.nodeQueue?.length) continueNodes(s, rng);
    else presentEvent(s, rng, next);
    s.rng = rng.state;
    return s;
  }

  s.notices = undefined;
  s.travelDest = undefined;
  // 沒處理的牌庫變化就算放下了（畫面上會先要玩家處理完）
  s.deckTasks = undefined;
  if (p.alive) {
    s.prevYear = currentYear(s);
    const years = timeStep(s);
    p.age += years;
    // 傷會隨著歲月慢慢好起來（健康就是血量，v0.5 §3.1）
    p.health = Math.min(100, p.health + Math.max(NODE.healMin, Math.min(NODE.healMax, NODE.healPerYear * years)));
    loseProperties(s);

    let death = 0;
    if (p.age >= 50) death += 0.03 + (p.age - 50) * 0.012;
    if (p.health < NODE.frailHealth) death += 0.15;
    if (p.age >= 85) death = 1;
    if (rng.chance(death)) {
      killPlayer(s, p.age >= 50 && p.health >= 25 ? 'natural' : 'illness');
      s.history.push({
        turn: s.turn + 1,
        age: p.age,
        year: currentYear(s),
        title: '終章',
        text: `你${CONTENT.deathCauses[s.deathCause ?? 'natural']}。`,
      });
    }
  }

  if (p.alive) beginTurn(s, rng);
  else finish(s);
  s.rng = rng.state;
  return s;
}
