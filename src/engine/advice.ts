// 方針卡上的「宜」：照眼下的處境，說一句這個方針此刻為什麼值得選。每張卡最多一句，依重要性先後。

import { CONTENT } from '../content';
import { allies } from '../content/allies';
import { checkCondition } from './conditions';
import { FATIGUE_STREAK, streakIfChosen } from './game';
import { STAT_NAMES } from './describe';
import { STAT_PERK2_AT, STAT_PERK_AT, allyRelation } from './talents';
import type { FocusDef, GameState } from './types';

/** 健康低於這裡，建議休養。 */
const LOW_HEALTH = 55;
/** 一次最多標幾張，標太多就等於沒標。 */
const MAX_ADVISED = 3;
/** 交情差這麼多以內，建議結交。 */
const ALLY_GAP = 15;

export function focusAdvice(s: GameState, options: FocusDef[]): Record<string, string> {
  const out: Record<string, string> = {};
  // 已經做到倦了的不建議
  const ids = new Set(options.filter((f) => streakIfChosen(s, f.id) < FATIGUE_STREAK).map((f) => f.id));
  const set = (id: string, text: string) => {
    if (ids.has(id) && !out[id] && Object.keys(out).length < MAX_ADVISED) out[id] = text;
  };
  const p = s.player;

  // 身子撐不住了
  if (p.health < LOW_HEALTH) {
    set('rest', `健康只剩 ${p.health}，歇一陣子再上路`);
    set('medicine', `健康只剩 ${p.health}，行醫也能順便調養`);
  }

  // 志向
  const amb = p.ambition ? CONTENT.ambitions[p.ambition] : undefined;
  if (amb && !checkCondition(s, amb.fulfilled)) for (const id of amb.focuses) set(id, `合你的志向「${amb.name}」`);

  // 屬性差一點就有新效果
  for (const f of options) {
    for (const g of f.growth) {
      if (g.effect.type !== 'stat' || (g.if && !checkCondition(s, g.if))) continue;
      const v = p.stats[g.effect.stat];
      if (v === STAT_PERK_AT - 1 || v === STAT_PERK2_AT - 1) set(f.id, `${STAT_NAMES[g.effect.stat]}再 1 點就有新效果`);
    }
  }

  // 差一點就買得起的兵器、護具
  if (p.age >= 12) {
    const gear = CONTENT.market
      .filter((m) => m.id.startsWith('gear_') && !s.boughtOnce?.includes(m.id) && checkCondition(s, m.requires))
      .sort((a, b) => a.price - b.price)[0];
    if (gear && p.money < gear.price) {
      const text = `再攢 ${gear.price - p.money} 文，就買得起${gear.name}`;
      set('work', text);
      set('trade', text);
    }
  }

  // 交情快到援手的門檻
  for (const a of allies) {
    const known = a.who === 'companion' || s.flags[`met_${a.who}`];
    if (!known) continue;
    const gap = allyRelation(s, a.minRelation) - (s.relations[a.who] ?? 0);
    if (gap <= 0 || gap > ALLY_GAP) continue;
    const name = a.who === 'companion' ? s.companion.name : CONTENT.npcs[a.who]?.name ?? a.who;
    set('social', `再多些交情，${name}就肯在生死關頭出手`);
    set('kid_play', `再多些交情，${name}長大後會出手相助`);
  }

  return out;
}
