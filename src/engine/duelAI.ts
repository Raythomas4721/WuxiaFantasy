// 自動出牌：給模擬器與自動遊玩用。
// 「直覺」策略接近一般玩家：看到對手要出手就先防（伏招或護體），剩下的內力拿來打，有連招就先墊招。

import { canPlay, endRound, getCard, playCard, resolvedEffect } from './duel';
import type { Rng } from './rng';
import type { CardDef, DuelState } from './types';

/** 這回合對手預計打過來的總傷害（看不到數字時也照實估，模擬器不作弊太多也無妨）。 */
export function incoming(d: DuelState): number {
  const it = d.foe.intent;
  if (it.kind === 'guard' || it.kind === 'charge') return 0;
  const mult = d.me.exposed > 0 ? 1.5 : 1;
  return (it.value + d.foe.charge) * (it.hits ?? 1) * mult;
}

function trapMatches(d: DuelState, c: CardDef): boolean {
  const k = d.foe.intent.kind;
  if (c.trigger === 'foeAttack') return k === 'attack' || k === 'combo' || k === 'feint';
  if (c.trigger === 'foeFeint') return k === 'feint';
  if (c.trigger === 'foeGuard') return k === 'guard';
  if (c.trigger === 'foeCharge') return k === 'charge';
  return false;
}

function value(d: DuelState, idx: number): number {
  const c = getCard(d.me.hand[idx]);
  const e = resolvedEffect(d, c);
  const need = Math.max(0, incoming(d) - d.me.block - (d.me.traps.length > 0 ? incoming(d) / 2 : 0));
  const hasTrap = d.foe.traps.some((t) => !t.used);
  let v = 0;
  if (c.kind === 'trap') {
    if (!trapMatches(d, c) || d.me.traps.length > 0) return 0.3;
    v = (e.dodge ? need : e.halve ? need / 2 : 0) + (e.dmg ?? 0) + (e.block ? Math.min(e.block, need) : 0) + (e.bleed ?? 0) * 2;
    return v + 1;
  }
  const dmg = (e.dmg ?? 0) * (e.hits ?? 1) * (d.foe.exposed > 0 ? 1.5 : 1);
  v += e.pierce || e.breakGuard ? dmg : Math.max(0, dmg - d.foe.block * 0.5);
  v += Math.min(e.block ?? 0, need) * 1.2;
  v += (e.draw ?? 0) * 2.5 + (e.energy ?? 0) * 3 + (e.energyNext ?? 0) * 2;
  if (e.heal) v += Math.min(e.heal, d.me.max - d.me.hp) * 0.8;
  if (e.expose && d.foe.exposed === 0) v += 5;
  if (e.bleed) v += e.bleed * 2;
  if (e.bleedMult) v += d.foe.bleed * (e.bleedMult - 1) * 2;
  if (e.boostNext) v += 5;
  if (e.breakTrap && hasTrap) v += 6;
  // 墊招：手上有「承」這個路數的牌，先出它
  if (c.tag && d.me.hand.some((id, i) => i !== idx && getCard(id).after?.tags.includes(c.tag!))) v += 3;
  return v / Math.max(1, c.cost);
}

/** 直覺策略：一張一張挑當下最划算的牌，直到沒有值得出的。 */
export function playSimpleRound(state: DuelState, rng: Rng): DuelState {
  let d = state;
  for (let guard = 0; guard < 20 && !d.over; guard++) {
    let best = -1;
    let bestValue = 0.5;
    d.me.hand.forEach((_, i) => {
      if (!canPlay(d, i)) return;
      const v = value(d, i);
      if (v > bestValue) {
        bestValue = v;
        best = i;
      }
    });
    if (best < 0) break;
    d = playCard(d, best, rng);
  }
  return d.over ? d : endRound(d, rng);
}

/** 隨便出牌：給模擬器量測下限。 */
export function playRandomRound(state: DuelState, rng: Rng): DuelState {
  let d = state;
  for (let guard = 0; guard < 20 && !d.over; guard++) {
    const idx = d.me.hand.map((_, i) => i).filter((i) => canPlay(d, i));
    if (idx.length === 0 || rng.chance(0.15)) break;
    d = playCard(d, rng.pick(idx), rng);
  }
  return d.over ? d : endRound(d, rng);
}
