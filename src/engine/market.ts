// 市集（設計文件 v0.4 §3.12）：在回合結果畫面打開，每回合最多買兩樣。

import { CONTENT } from '../content';
import { MARKET } from '../content/market';
import { checkCondition, npcPresent } from './conditions';
import { DECK, rewardOptions } from './deck';
import { cardText, getCard } from './duel';
import { applyEffects } from './effects';
import { NODE } from './game';
import { Rng } from './rng';
import type { GameEffect, GameState } from './types';

export interface Offer {
  id: string;
  name: string;
  price: number;
  desc: string;
  enabled: boolean;
  /** 買不了的原因。 */
  reason?: string;
}

const GIFT = 'gift:';

/** 這一回合已經買了幾樣。 */
export function boughtThisTurn(s: GameState): number {
  return s.market?.turn === s.turn ? s.market.bought : 0;
}

export function marketOpen(s: GameState): boolean {
  return s.phase === 'result' && s.player.alive && s.player.age >= 12 && !s.chain;
}

export function marketOffers(s: GameState): Offer[] {
  if (!marketOpen(s)) return [];
  const p = s.player;
  const full = boughtThisTurn(s) >= MARKET.perTurn;
  const offers: Offer[] = [];
  const add = (id: string, name: string, price: number, desc: string, blocked?: string) =>
    offers.push({
      id, name, price, desc,
      enabled: !blocked && !full && p.money >= price,
      reason: blocked ?? (full ? `這回合已經買了 ${MARKET.perTurn} 樣` : p.money < price ? '錢不夠' : undefined),
    });

  for (const item of CONTENT.market) {
    if (item.regions && !item.regions.includes(p.region)) continue;
    if (!checkCondition(s, item.requires)) continue;
    add(item.id, item.name, item.price, item.desc, item.once && s.boughtOnce?.includes(item.id) ? '已經買過了' : undefined);
  }
  // 贈禮：見過、此刻又在附近的名俠
  for (const npc of Object.values(CONTENT.npcs)) {
    if (!npc.codex || !s.flags[`met_${npc.id}`] || !npcPresent(s, npc.id)) continue;
    add(`${GIFT}${npc.id}`, `贈禮給${npc.name}`, MARKET.giftPrice, `${npc.name}就在附近。關係 +${MARKET.giftRelation}`);
  }
  return offers;
}

function effectsOf(id: string): { name: string; effects: GameEffect[]; once: boolean } {
  if (id.startsWith(GIFT)) {
    const npc = id.slice(GIFT.length);
    return { name: `給${CONTENT.npcs[npc].name}的禮`, effects: [{ type: 'relation', npc, delta: MARKET.giftRelation }], once: false };
  }
  const item = CONTENT.market.find((x) => x.id === id);
  if (!item) throw new Error(`市集沒有這樣東西：${id}`);
  return { name: item.name, effects: item.effects, once: Boolean(item.once) };
}

export function buy(state: GameState, offerId: string): GameState {
  const offer = marketOffers(state).find((o) => o.id === offerId);
  if (!offer?.enabled) throw new Error(`買不了：${offerId}`);
  const s = structuredClone(state);
  const rng = new Rng(s.rng);
  const { name, effects, once } = effectsOf(offerId);
  s.player.money -= offer.price;
  applyEffects(s, effects, rng);
  s.market = { turn: s.turn, bought: boughtThisTurn(s) + 1 };
  if (once) s.boughtOnce = [...(s.boughtOnce ?? []), offerId];
  if (s.result) s.result = { ...s.result, gains: [...s.result.gains, `買了${name}（${offer.price} 文）`] };
  s.rng = rng.state;
  return s;
}

// ---------- 武館（設計文件 v0.5 §2.2、§2.3）：方針擲到 ⚖ 的那段日子才開 ----------

const CARD = 'card:';
export const DOJO_REMOVE = 'dojo_remove';

export function dojoOpen(s: GameState): boolean {
  return marketOpen(s) && s.dojo?.turn === s.turn;
}

/** 武館教的三招（同一回合固定不變）、花錢刪牌。每回合只能學一招。 */
export function dojoOffers(s: GameState): Offer[] {
  if (!dojoOpen(s)) return [];
  const p = s.player;
  const bought = Boolean(s.dojo?.bought);
  const cards = rewardOptions(s, new Rng((s.seed * 7919 + s.turn * 104729) >>> 0), DECK.rewardOptions, DECK.eliteSkillBoost);
  const offers: Offer[] = cards.map((id) => {
    const c = getCard(id);
    return {
      id: `${CARD}${id}`,
      name: `學「${c.name}」`,
      price: NODE.cardPrice,
      desc: `${c.cost} 內力・${cardText(c)}`,
      enabled: !bought && p.money >= NODE.cardPrice,
      reason: bought ? '這回合已經學過一招' : p.money < NODE.cardPrice ? '錢不夠' : undefined,
    };
  });
  const price = removePrice(s);
  const busy = Boolean(s.deckTasks?.length);
  const small = (p.deck?.length ?? 0) <= DECK.minDeck;
  offers.push({
    id: DOJO_REMOVE,
    name: '請館主改掉一招',
    price,
    desc: '從牌庫刪一張牌。每刪一次，下次就更貴。',
    enabled: !busy && !small && p.money >= price,
    reason: busy ? '先把手上的事處理完' : small ? `牌庫至少要留 ${DECK.minDeck} 張` : p.money < price ? '錢不夠' : undefined,
  });
  return offers;
}

export function removePrice(s: GameState): number {
  return NODE.removePrice + NODE.removeStep * (s.dojoRemovals ?? 0);
}

export function buyDojo(state: GameState, offerId: string): GameState {
  const offer = dojoOffers(state).find((o) => o.id === offerId);
  if (!offer?.enabled) throw new Error(`買不了：${offerId}`);
  const s = structuredClone(state);
  if (offerId === DOJO_REMOVE) {
    // 先排一件刪牌的事，刪了才付錢、才算次數
    s.deckTasks = [
      ...(s.deckTasks ?? []),
      { kind: 'remove', title: '武館', text: `館主說，哪一招練歪了，他幫你改掉。刪一張牌，${offer.price} 文。`, cost: { money: offer.price } },
    ];
    return s;
  }
  const id = offerId.slice(CARD.length);
  s.player.money -= offer.price;
  s.player.deck = [...(s.player.deck ?? []), id];
  s.dojo = { turn: s.turn, bought: true };
  if (s.result) s.result = { ...s.result, gains: [...s.result.gains, `牌庫 +${getCard(id).name}（${offer.price} 文）`] };
  return s;
}
