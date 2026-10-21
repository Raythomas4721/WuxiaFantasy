// 遊戲流程：每個公開函式都接收舊狀態、回傳新狀態，不修改傳入的物件。
//
// 一回合：intro → (focus) → event → result → 下一回合 … → ended
// 七歲以前沒有方針，直接進事件。

import { CONTENT } from '../content';
import { checkCondition, currentYear, martialLevel, skillLevel, unmetHints } from './conditions';
import { LEVEL_NAMES, STAT_NAMES, STAT_ORDER } from './describe';
import { applyEffects, killPlayer } from './effects';
import { computeEnding } from './ending';
import { Rng } from './rng';
import { getEvent, selectEvent } from './select';
import { chineseNumber, eraName, fill, renderText } from './text';
import type {
  Check,
  ChoiceView,
  FocusDef,
  GameState,
  Outcome,
  OutcomeSpec,
  Snapshot,
  StatName,
  TurnResult,
} from './types';

export const SAVE_VERSION = 1;
const RUMOR_CHANCE = 0.75;
const CHILD_SUMMARY = '你在{place}一天天長大。';

export interface NewGameSetup {
  name: string;
  background: string;
  region: string;
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
  const bg = CONTENT.backgrounds[setup.background];
  if (!bg) throw new Error(`未知出身：${setup.background}`);

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
      background: setup.background,
      birthRegion: setup.region,
      region: setup.region,
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
  if (!rng.chance(RUMOR_CHANCE)) return undefined;
  const pool = CONTENT.rumors
    .filter((r) => !s.shownRumors.includes(r.id) && checkCondition(s, r.conditions))
    .map((r) => ({ item: r, weight: r.weight ?? 1 }));
  const r = rng.weighted(pool);
  if (!r) return undefined;
  s.shownRumors.push(r.id);
  return fill(r.text, s);
}

function pushTags(s: GameState, tags: string[]): void {
  s.recentTags = [...s.recentTags, tags].slice(-2);
}

function setResult(s: GameState, rng: Rng, result: Omit<TurnResult, 'gains' | 'rumor'>): void {
  s.result = { ...result, gains: describeGains(s), rumor: pickRumor(s, rng) };
  s.phase = 'result';
}

function quietTurn(s: GameState, rng: Rng): void {
  const focus = CONTENT.focuses.find((f) => f.id === s.focus);
  const text = renderText(focus ? focus.summary : CHILD_SUMMARY, s);
  s.history.push({ turn: s.turn, age: s.player.age, year: currentYear(s), title: '歲月', text });
  pushTags(s, focus?.tags ?? []);
  setResult(s, rng, { title: '歲月', text });
}

function presentEvent(s: GameState, rng: Rng): void {
  const e = selectEvent(s, rng);
  if (!e) {
    quietTurn(s, rng);
    return;
  }
  const prev = s.fired[e.id];
  s.fired[e.id] = { count: (prev?.count ?? 0) + 1, lastYear: currentYear(s) };
  applyEffects(s, e.enterEffects, rng);
  s.current = { eventId: e.id, text: renderText(e.text, s) };
  s.phase = 'event';
}

function beginTurn(s: GameState, rng: Rng): void {
  s.turn += 1;
  s.snapshot = takeSnapshot(s);
  s.focus = undefined;
  s.current = undefined;
  s.result = undefined;
  if (s.player.age < 7) presentEvent(s, rng);
  else s.phase = 'focus';
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

export function chooseFocus(state: GameState, focusId: string): GameState {
  if (state.phase !== 'focus') throw new Error('現在不是選擇方針的時候');
  const focus = focusOptions(state).find((f) => f.id === focusId);
  if (!focus) throw new Error(`無法選擇方針：${focusId}`);
  const s = clone(state);
  const rng = new Rng(s.rng);
  for (const g of focus.growth) {
    if (g.chance === undefined || rng.chance(g.chance)) applyEffects(s, [g.effect], rng);
  }
  s.focus = focusId;
  presentEvent(s, rng);
  s.rng = rng.state;
  return s;
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
      text: fill(c.text, s),
      enabled,
      hint: enabled ? undefined : c.hint ?? (unmetHints(s, c.requires).join('、') || '條件不足'),
      odds: enabled && c.check ? oddsLabel(checkChance(s, c.check)) : undefined,
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
  let spec: OutcomeSpec;
  let check: TurnResult['check'];
  if (choice.check) {
    const ok = rng.chance(checkChance(s, choice.check));
    check = ok ? 'success' : 'failure';
    spec = ok ? choice.check.success : choice.check.failure;
  } else if (choice.outcome) {
    spec = choice.outcome;
  } else {
    throw new Error(`選項沒有結果：${e.id}/${choice.id}`);
  }
  const outcome = resolveOutcome(s, spec);
  applyEffects(s, outcome.effects, rng);
  const text = renderText(outcome.text, s);
  s.history.push({
    turn: s.turn,
    age: s.player.age,
    year: currentYear(s),
    title: e.title,
    choice: fill(choice.text, s),
    text,
    recap: outcome.recap ? { weight: outcome.recap.weight, text: fill(outcome.recap.text, s) } : undefined,
  });
  pushTags(s, e.tags ?? []);
  setResult(s, rng, { title: e.title, text, check });
  s.current = undefined;
  s.rng = rng.state;
  return s;
}

function timeStep(s: GameState): number {
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

/** 結果畫面之後：推進時間、判定壽終，進入下一回合或結局。 */
export function nextTurn(state: GameState): GameState {
  if (state.phase !== 'result') throw new Error('現在不能進入下一回合');
  const s = clone(state);
  const rng = new Rng(s.rng);
  const p = s.player;

  if (p.alive) {
    s.prevYear = currentYear(s);
    p.age += timeStep(s);
    p.health = Math.min(100, p.health + 5);

    let death = 0;
    if (p.age >= 50) death += 0.03 + (p.age - 50) * 0.012;
    if (p.health < 25) death += 0.15;
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
