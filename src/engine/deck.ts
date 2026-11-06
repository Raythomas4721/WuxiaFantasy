// 持久牌庫（設計文件 v0.5 §2）：起手牌庫、戰後選牌、入門選招、修心刪牌、閉關升級。
//
// 牌庫的變化先排進 s.deckTasks，在結果畫面一件一件處理。公開的 GameState 函式都回傳新狀態。

import { CONTENT } from '../content';
import { levelFromXp, skillLevel } from './conditions';
import { REALM, baseCardId, cardSkill, getCard, legacyDeck, mainSkill, upgradeCount } from './duel';
import type { Rng } from './rng';
import type { DeckTask, GameState } from './types';

/** 平衡數值集中在這裡。 */
export const DECK = {
  /** 起手牌庫的基本 8 張；再加出身、先天特質各一張。 */
  base: ['punch', 'punch', 'punch', 'punch', 'parry', 'parry', 'parry', 'xieli'],
  /** 戰後三選一。 */
  rewardOptions: 3,
  /** 戰後選牌跳過拿的錢。 */
  skipMoney: 10,
  /** 武學入門時，從該門招式裡挑幾張。 */
  entryPicks: 2,
  /** 這一場打出過某門武學的牌，那門武學加幾點經驗。 */
  duelXp: 1,
  /** 修心刪牌的代價：這段休養少回的健康。 */
  meditateHealth: 15,
  /** 牌庫最少留幾張。 */
  minDeck: 8,
  /** 精英、首領的獎勵裡，武學的牌權重再乘上這個數。 */
  eliteSkillBoost: 2,
  bossSkillBoost: 3,
  /** 獎勵池的權重：主修武學、其他已入門的武學、奇招。 */
  weights: { main: 4, other: 2, common: 1 },
};

// ---------- 起手牌庫與舊存檔 ----------

/** 基本 8 張 + 出身 1 張 + 先天特質 1 張。 */
export function startingDeck(background: string, trait: string): string[] {
  const deck = [...DECK.base];
  const bg = CONTENT.backgrounds[background]?.card;
  const tr = CONTENT.traits[trait]?.card;
  if (bg) deck.push(bg);
  if (tr) deck.push(tr);
  return deck;
}

/** v0.4 的存檔沒有牌庫：用當時的武學等級換算一副。就地修改。 */
export function ensureDeck(s: GameState): GameState {
  if (!s.player.deck) s.player.deck = legacyDeck(s);
  return s;
}

/** 牌庫加一張；有 remove 時換掉一張（優先換沒升級過的）。就地修改。 */
export function addToDeck(s: GameState, add: string, remove?: string): void {
  const deck = s.player.deck ?? (s.player.deck = legacyDeck(s));
  if (remove) {
    const exact = deck.indexOf(remove);
    const at = exact >= 0 ? exact : deck.findIndex((id) => baseCardId(id) === remove);
    if (at >= 0) {
      deck[at] = add;
      return;
    }
  }
  deck.push(add);
}

/** 武學第一次入門：從該門的招式裡挑兩張。就地修改。 */
export function noteSkillGain(s: GameState, skill: string, beforeXp: number): void {
  const cards = CONTENT.skillCards[skill];
  if (!cards || levelFromXp(beforeXp) > 0 || skillLevel(s, skill) === 0) return;
  const name = CONTENT.skills[skill]?.name ?? skill;
  pushTask(s, {
    kind: 'pick',
    title: `${name}入門`,
    text: `你在${name}上總算摸到了門徑。挑兩招記在心裡，往後就靠它們了。`,
    options: [...cards],
    picks: DECK.entryPicks,
  });
}

export function pushTask(s: GameState, task: DeckTask): void {
  s.deckTasks = [...(s.deckTasks ?? []), task];
}

// ---------- 獎勵 ----------

/** 獎勵池：已入門武學的招式（主修權重高）、奇招；會醫術的再加金創藥。 */
export function rewardPool(s: GameState): { id: string; weight: number }[] {
  const main = mainSkill(s).skill;
  const pool = new Map<string, number>();
  const add = (id: string, w: number) => pool.set(id, Math.max(pool.get(id) ?? 0, w));
  for (const [skill, cards] of Object.entries(CONTENT.skillCards)) {
    if (skillLevel(s, skill) === 0) continue;
    for (const id of cards) add(id, skill === main ? DECK.weights.main : DECK.weights.other);
  }
  for (const id of CONTENT.commonCards) add(id, DECK.weights.common);
  if (skillLevel(s, 'baicao') > 0) add('jinchuang', DECK.weights.common);
  return [...pool].map(([id, weight]) => ({ id, weight }));
}

/** 不重複地抽 n 張；skillBoost 讓武學的牌更容易出現（精英、首領）。 */
export function rewardOptions(s: GameState, rng: Rng, n = DECK.rewardOptions, skillBoost = 1): string[] {
  const pool = rewardPool(s).map((x) => ({ ...x, weight: x.weight * (cardSkill(x.id) ? skillBoost : 1) }));
  const out: string[] = [];
  while (out.length < n && pool.length > 0) {
    const id = rng.weighted(pool.map((x) => ({ item: x.id, weight: x.weight })))!;
    out.push(id);
    pool.splice(pool.findIndex((x) => x.id === id), 1);
  }
  return out;
}

/** 戰後選牌：精英的獎勵多半是武學的牌；首領給的牌已經升級過一次。就地修改。 */
export function pushDuelReward(s: GameState, rng: Rng, foeName: string, tier?: 'minor' | 'elite' | 'boss'): void {
  const boost = tier === 'boss' ? DECK.bossSkillBoost : tier === 'elite' ? DECK.eliteSkillBoost : 1;
  let options = rewardOptions(s, rng, DECK.rewardOptions, boost);
  if (tier === 'boss') options = options.map((id) => `${id}+`);
  if (options.length === 0) return;
  pushTask(s, {
    kind: 'pick',
    title: `勝過${foeName}`,
    text:
      tier === 'boss'
        ? '這一戰之後，你對武學的體會又深了一層。挑一招，它已經比從前更精純了。'
        : '這一場打下來，你對武學又多了一分體會。挑一招記下來，或者把這份心得放下。',
    options,
    picks: 1,
    skipMoney: DECK.skipMoney,
  });
}

// ---------- 刪牌與升級 ----------

export function canUpgrade(s: GameState, id: string): boolean {
  if (getCard(id).kind === 'curse') return false;
  return upgradeCount(id) < REALM[Math.min(5, mainSkill(s).level)].upgrades;
}

export function upgradableIndexes(s: GameState): number[] {
  return (s.player.deck ?? []).flatMap((id, i) => (canUpgrade(s, id) ? [i] : []));
}

/** 現在能不能刪牌；不能的話回傳原因。 */
export function removeBlocked(s: GameState): string | undefined {
  const task = s.deckTasks?.[0];
  if ((s.player.deck?.length ?? 0) <= DECK.minDeck) return `牌庫至少要留 ${DECK.minDeck} 張`;
  if (task?.kind !== 'remove') return '現在不能刪牌';
  if (task.cost?.health && s.player.health <= task.cost.health) return '身子太虛，靜不下心';
  if (task.cost?.money && s.player.money < task.cost.money) return '錢不夠';
  return undefined;
}

function startTask(state: GameState, kind: DeckTask['kind']): { s: GameState; task: DeckTask } {
  const task = state.deckTasks?.[0];
  if (!task || task.kind !== kind) throw new Error('現在沒有這件事要處理');
  const s = structuredClone(state);
  ensureDeck(s);
  return { s, task: s.deckTasks![0] };
}

function doneTask(s: GameState): void {
  s.deckTasks = s.deckTasks!.slice(1);
  if (s.deckTasks.length === 0) s.deckTasks = undefined;
}

function noteGain(s: GameState, text: string): void {
  if (s.result) s.result = { ...s.result, gains: [...s.result.gains, text] };
}

/** 選牌：cardId 為 null 表示跳過（戰後選牌跳過拿一點錢）。 */
export function pickCard(state: GameState, cardId: string | null): GameState {
  const { s, task } = startTask(state, 'pick');
  if (task.kind !== 'pick') throw new Error('unreachable');
  if (cardId === null) {
    if (task.skipMoney) {
      s.player.money += task.skipMoney;
      noteGain(s, `錢財 +${task.skipMoney} 文`);
    }
    doneTask(s);
    return s;
  }
  if (!task.options.includes(cardId)) throw new Error(`不能選這張牌：${cardId}`);
  s.player.deck!.push(cardId);
  noteGain(s, `牌庫 +${getCard(cardId).name}`);
  task.options = task.options.filter((x) => x !== cardId);
  task.picks -= 1;
  if (task.picks <= 0 || task.options.length === 0) doneTask(s);
  return s;
}

/** 刪掉牌庫裡第 index 張；null 表示不刪了。 */
export function removeCard(state: GameState, index: number | null): GameState {
  const { s, task } = startTask(state, 'remove');
  if (task.kind !== 'remove') throw new Error('unreachable');
  if (index !== null) {
    const blocked = removeBlocked(state);
    if (blocked) throw new Error(blocked);
    const id = s.player.deck![index];
    if (id === undefined) throw new Error(`牌庫沒有第 ${index} 張`);
    s.player.deck!.splice(index, 1);
    if (task.cost?.health) s.player.health -= task.cost.health;
    if (task.cost?.money) {
      s.player.money -= task.cost.money;
      s.dojoRemovals = (s.dojoRemovals ?? 0) + 1;
    }
    noteGain(s, `牌庫 −${getCard(id).name}`);
  }
  doneTask(s);
  return s;
}

/** 升級牌庫裡第 index 張；null 表示不升級了。 */
export function upgradeCard(state: GameState, index: number | null): GameState {
  const { s } = startTask(state, 'upgrade');
  if (index !== null) {
    const id = s.player.deck![index];
    if (id === undefined || !canUpgrade(s, id)) throw new Error(`這張牌不能升級：${id}`);
    s.player.deck![index] = `${id}+`;
    noteGain(s, `${getCard(id).name} → ${getCard(`${id}+`).name}`);
  }
  doneTask(s);
  return s;
}
