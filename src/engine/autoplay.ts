// 自動遊玩：給模擬器與測試用。每一輪依種子決定性格（隨性、善、惡），在可選項中挑選。

import { playSimpleRound } from './duelAI';
import {
  allocateStat, chooseMainSkill,
  chooseFocus, chooseOption, choiceViews, finishDuel, focusOptions, newGame, nextTurn, rollTraitOptions, startLife,
} from './game';
import { CONTENT } from '../content';
import { pickCard, pickTalent, removeBlocked, removeCard, upgradableIndexes, upgradeCard } from './deck';
import { STAT_MAX, STAT_PERK_AT } from './talents';
import { baseCardId, cardSkill, getCard, mainSkill, yieldDuel } from './duel';
import { DOJO_REMOVE, buy, buyDojo, dojoOffers, marketOffers, removePrice } from './market';
import { Rng } from './rng';
import type { GameState, StatName } from './types';

/** 模擬玩家分配屬性點：先把根骨、膽識、心性補到有效果，再補根骨。 */
const STAT_PREF: StatName[] = ['gengu', 'danshi', 'xinxing', 'wuxing', 'fuyuan', 'meili'];
function autoStat(s: GameState): StatName | undefined {
  const st = s.player.stats;
  return STAT_PREF.find((k) => st[k] < STAT_PERK_AT) ?? STAT_PREF.find((k) => st[k] < STAT_MAX);
}

const MAX_STEPS = 3000;
const SWORDS = ['hanjiang', 'qinghen', 'shibi'];

export interface AutoplayResult {
  state: GameState;
  events: string[];
  /** 每個事件實際顯示的敘述文字，用來量測文字層級的重複。 */
  texts: string[];
  /** 這一生選了幾次方針。 */
  focusPicks: number;
  persona: Persona;
  /** 這一生打過的過招。 */
  duels: { opponent: string; level: number; playerLevel: number; won: boolean; rounds: number; tier?: string; lethal: boolean; over: string }[];
}

export interface AutoplayOptions {
  /** 只要可選就固定選這個方針，用來測試連續同一方針的倦怠機制。 */
  preferFocus?: string;
  /** 指定性格；不指定時依種子隨機決定。 */
  persona?: Persona;
  /** 好鬥：有過招的選項就選它（量測「想打的玩家」用）。 */
  preferDuel?: boolean;
  /** 走到這個狀態就停下（測試、在瀏覽器裡直接跳到某個畫面用）。 */
  until?: (s: GameState) => boolean;
}

export function randomSetup(seed: number) {
  const rng = new Rng(seed);
  // 出身與出生地由 newGame 依種子隨機決定。
  return { name: '', trait: rng.pick(rollTraitOptions(seed, [])), seed };
}

/**
 * 模擬玩家的性格：真人玩家在善惡上通常前後一致，全隨機會讓正邪結局失真。
 * good / evil 會有七成機率挑「俠義＋正邪」變化最大／最小的選項。
 */
export type Persona = 'random' | 'good' | 'evil';

function pickPersona(rng: Rng): Persona {
  const r = rng.next();
  return r < 0.5 ? 'random' : r < 0.8 ? 'good' : 'evil';
}

/** 選項的善惡分數：成功（或唯一）結果裡俠義與正邪變化的總和。 */
function moralScore(s: GameState, choiceId: string): number {
  const event = CONTENT.events.find((e) => e.id === s.current?.eventId);
  const choice = event?.choices.find((c) => c.id === choiceId);
  const spec = choice?.check?.success ?? choice?.outcome;
  const first = Array.isArray(spec) ? spec[spec.length - 1] : spec;
  return (first?.effects ?? []).reduce(
    (sum, e) => sum + (e.type === 'chivalry' || e.type === 'alignment' ? e.delta : 0),
    0,
  );
}

function pickChoice(s: GameState, ids: string[], persona: Persona, rng: Rng): string {
  if (persona === 'random' || !rng.chance(0.7)) return rng.pick(ids);
  const sign = persona === 'good' ? 1 : -1;
  const scored = ids.map((id) => ({ id, score: sign * moralScore(s, id) }));
  const best = Math.max(...scored.map((x) => x.score));
  return rng.pick(scored.filter((x) => x.score === best).map((x) => x.id));
}

/** 模擬玩家照志向會偏好的方針。 */
const AMBITION_FOCUS: Record<string, string[]> = {
  martial: ['martial'],
  chivalry: ['travel', 'social'],
  healer: ['medicine', 'study'],
  wealth: ['work', 'trade'],
  nation: ['martial', 'travel'],
  revenge: ['martial'],
  peace: ['rest', 'work'],
};

/** 選牌的偏好：主修武學的牌最好，其次是其他武學的牌，再來是奇招；基本牌最不想要。 */
function cardScore(s: GameState, id: string): number {
  const main = mainSkill(s).skill;
  const skill = cardSkill(id);
  if (skill && skill === main) return 3;
  if (skill) return 2;
  if (id === 'punch' || id === 'parry' || baseCardId(id) === 'xieli') return 0;
  return 1;
}

/** 模擬玩家處理牌庫變化：挑主修的牌、刪基本牌、升級主修的牌。 */
export function autoDeckTask(s: GameState): GameState {
  const task = s.deckTasks![0];
  const deck = s.player.deck ?? [];
  if (task.kind === 'pick') {
    const best = [...task.options].sort((a, b) => cardScore(s, b) - cardScore(s, a))[0];
    // 牌庫夠大了，又沒有本門的牌，就不拿
    return pickCard(s, deck.length >= 24 && cardScore(s, best) < 2 ? null : best);
  }
  if (task.kind === 'talent') return pickTalent(s, task.options[0]);
  if (task.kind === 'remove') {
    const at = ['punch', 'parry'].map((id) => deck.indexOf(id)).find((i) => i >= 0);
    const affordable = task.cost?.health ? s.player.health > 50 : true;
    return removeCard(s, at !== undefined && !removeBlocked(s) && affordable ? at : null);
  }
  const idx = upgradableIndexes(s).sort((a, b) => cardScore(s, deck[b]) - cardScore(s, deck[a]) || getCard(deck[b]).cost - getCard(deck[a]).cost);
  return upgradeCard(s, idx.length > 0 ? idx[0] : null);
}

export function playLife(seed: number, options: AutoplayOptions = {}): AutoplayResult {
  const policy = new Rng(seed ^ 0x9e3779b9);
  const persona = options.persona ?? pickPersona(new Rng(seed ^ 0x5bd1e995));
  let s = startLife(newGame(randomSetup(seed)));
  const events: string[] = [];
  const texts: string[] = [];
  let focusPicks = 0;
  const duels: AutoplayResult['duels'] = [];
  for (let step = 0; step < MAX_STEPS && s.phase !== 'ended' && !options.until?.(s); step++) {
    if (s.phase === 'focus' && s.statPoints) {
      const k = autoStat(s);
      s = k ? allocateStat(s, k) : { ...s, statPoints: undefined };
      continue;
    }
    if (s.phase === 'focus') {
      const focuses = focusOptions(s);
      // 有志向的人，一半的時候會照志向過日子
      const wanted = s.player.ambition && policy.chance(0.5) ? AMBITION_FOCUS[s.player.ambition] ?? [] : [];
      const fits = focuses.filter((f) => wanted.includes(f.id));
      const preferred = focuses.find((f) => f.id === options.preferFocus) ?? (fits.length > 0 ? policy.pick(fits) : undefined);
      focusPicks += 1;
      s = chooseFocus(s, (preferred ?? policy.pick(focuses)).id);
    } else if (s.phase === 'event') {
      events.push(s.current!.eventId);
      texts.push(s.current!.text);
      const enabled = choiceViews(s).filter((c) => c.enabled);
      const node = CONTENT.events.find((e) => e.id === s.current!.eventId)?.node;
      if (node) {
        // 關卡：身子撐得住就打，撐不住就繞開；生死之戰要更有把握
        const need = enabled.find((c) => c.duel)?.lethal ? 70 : node.tier === 'minor' ? 40 : 55;
        const fight = enabled.find((c) => c.duel);
        s = chooseOption(s, fight && (options.preferDuel || s.player.health >= need) ? fight.id : enabled.find((c) => !c.duel)!.id);
        continue;
      }
      const duel = options.preferDuel ? enabled.find((c) => c.duel) : undefined;
      s = chooseOption(s, duel ? duel.id : pickChoice(s, enabled.map((c) => c.id), persona, policy));
    } else if (s.phase === 'duel') {
      // 過招用「直覺」策略打完，再收招
      const rng = new Rng(s.rng);
      let d = s.duel!;
      for (let i = 0; i < 60 && !d.over; i++) {
        // 生死之戰打不過就突圍
        if (d.lethal && d.me.hp < d.me.max * 0.3 && d.foe.hp > d.foe.max * 0.35) {
          d = yieldDuel(d);
          break;
        }
        d = playSimpleRound(d, rng);
      }
      if (!d.over) d = { ...d, over: 'lose' };
      const tier = CONTENT.events.find((e) => e.id === s.current?.eventId)?.node?.tier;
      duels.push({
        opponent: d.opponent, level: d.level, playerLevel: mainSkill(s).level, won: d.over === 'win', rounds: d.round,
        tier, lethal: d.lethal, over: d.over ?? "lose",
      });
      s = finishDuel({ ...s, duel: d, rng: rng.state });
    } else if (s.phase === 'result') {
      for (let i = 0; i < 10 && s.deckTasks?.length; i++) s = autoDeckTask(s);
      // 學到了劍法就改練劍（玩家多半會這樣做）
      const sword = SWORDS.find((k) => (s.player.skills[k] ?? 0) > 0);
      if (sword && !SWORDS.includes(mainSkill(s).skill ?? '')) s = chooseMainSkill(s, sword);
      // 市集：立志發財的人只買產業；其他人一半的回合會買一樣買得起的東西
      const offers = marketOffers(s).filter((o) => o.enabled);
      const saver = s.player.ambition === 'wealth';
      const wanted = saver ? offers.filter((o) => o.id === 'land' || o.id === 'shop') : offers;
      if (wanted.length > 0 && (saver || policy.chance(0.5))) s = buy(s, policy.pick(wanted).id);
      // 武館：錢夠就學一招本門的牌，有出拳就花錢改掉
      const dojo = dojoOffers(s).filter((o) => o.enabled && s.player.money >= o.price + 30);
      const learn = dojo.filter((o) => o.id !== DOJO_REMOVE).sort((a, b) => cardScore(s, b.id.slice(5)) - cardScore(s, a.id.slice(5)))[0];
      if (learn && cardScore(s, learn.id.slice(5)) >= 2) s = buyDojo(s, learn.id);
      if (dojo.some((o) => o.id === DOJO_REMOVE) && s.player.deck?.includes('punch') && s.player.money >= removePrice(s) + 30) {
        s = buyDojo(s, DOJO_REMOVE);
      }
      for (let i = 0; i < 10 && s.deckTasks?.length; i++) s = autoDeckTask(s);
      s = nextTurn(s);
    } else {
      throw new Error(`autoplay 無法處理階段：${s.phase}`);
    }
  }
  if (s.phase !== 'ended' && !options.until?.(s)) throw new Error(`第 ${seed} 號人生沒有在 ${MAX_STEPS} 步內結束`);
  return { state: s, events, texts, focusPicks, persona, duels };
}
