// 培育：武學心得（境界突破二選一）與屬性的戰鬥效果（每章分配屬性點）。

import { CONTENT } from '../content';
import type { GameState, Passive, StatName, TalentDef } from './types';

/** 屬性到了這個數值，就有額外的效果。 */
export const STAT_PERK_AT = 7;
/** 每章開場給的屬性點（少年、青年、壯年、晚年）。 */
export const STAT_POINTS_PER_CHAPTER = 2;
export const STAT_MAX = 10;

/** 每個屬性的效果說明（給分配畫面用）。 */
export const STAT_PERKS: Record<StatName, string> = {
  gengu: '每點氣血上限 +2',
  wuxing: `${STAT_PERK_AT} 以上：閉關時多升級一張牌；10：每回合多抽 1 張`,
  danshi: `${STAT_PERK_AT} 以上：每場第一回合內力 +1`,
  xinxing: `${STAT_PERK_AT} 以上：每場第一次被點穴、下毒無效`,
  fuyuan: `${STAT_PERK_AT} 以上：戰後獎勵比較容易出良、絕`,
  meili: `${STAT_PERK_AT} 以上：武館學招、改招便宜兩成`,
};

const BY_ID = new Map(CONTENT.talents.map((t) => [t.id, t]));

export function getTalent(id: string): TalentDef {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`未知心得：${id}`);
  return t;
}

/** 某門武學某個境界的兩個心得。 */
export function talentChoices(skill: string, level: number): TalentDef[] {
  return CONTENT.talents.filter((t) => t.skill === skill && t.level === level);
}

export function perk(s: GameState, stat: StatName): boolean {
  return s.player.stats[stat] >= STAT_PERK_AT;
}

/** 把 add 疊進 p：數值相加，路數加成合併，第一張的加成同路數相加、不同路數取大的。 */
export function mergePassive(p: Passive, add: Omit<Passive, 'names'>): void {
  for (const [k, v] of Object.entries(add) as [keyof Passive, unknown][]) {
    if (typeof v === 'number') {
      const cur = (p[k] as number | undefined) ?? 0;
      (p as unknown as Record<string, number>)[k] = k === 'retainBlock' ? Math.max(cur, v) : cur + v;
    } else if (k === 'tagDmg') {
      const into = (p.tagDmg ??= {});
      for (const [tag, n] of Object.entries(v as Record<string, number>)) into[tag as keyof typeof into] = (into[tag as keyof typeof into] ?? 0) + n;
    } else if (k === 'firstTag') {
      const f = v as NonNullable<Passive['firstTag']>;
      if (!p.firstTag) p.firstTag = { ...f };
      else if (p.firstTag.tag === f.tag) p.firstTag = { tag: f.tag, dmg: p.firstTag.dmg + f.dmg };
      else if (f.dmg > p.firstTag.dmg) p.firstTag = { ...f };
    }
  }
}

/** 心得與屬性帶進過招的效果。 */
export function growthPassive(s: GameState, p: Passive): void {
  for (const id of s.player.talents ?? []) {
    const t = BY_ID.get(id);
    if (!t) continue;
    p.names.push(`${t.name}：${t.text}`);
    mergePassive(p, t.effect);
  }
  if (perk(s, 'danshi')) {
    p.names.push('膽識過人：第一回合內力 +1');
    mergePassive(p, { firstRoundEnergy: 1 });
  }
  if (perk(s, 'xinxing')) {
    p.names.push('心如磐石：第一次被點穴、下毒無效');
    mergePassive(p, { resist: 1 });
  }
}

/** 心得加的氣血上限（算氣血時用）。 */
export function talentHp(s: GameState): number {
  return (s.player.talents ?? []).reduce((n, id) => n + (BY_ID.get(id)?.effect.maxHp ?? 0), 0);
}
