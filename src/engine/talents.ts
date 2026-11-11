// 培育：武學心得（境界突破二選一）與屬性的戰鬥效果（每章分配屬性點）。

import { CONTENT } from '../content';
import type { GameState, Passive, StatName, TalentDef } from './types';

/** 屬性到了這個數值，就有額外的效果。 */
export const STAT_PERK_AT = 7;
/** 每章開場給的屬性點（少年、青年、壯年、晚年）。 */
export const STAT_POINTS_PER_CHAPTER = 2;
export const STAT_MAX = 10;
/** 第二階：屬性到 10 有更強的效果；之後（靠經歷長到 15）每多一點再加強一些。 */
export const STAT_PERK2_AT = 10;

/** 每個屬性的效果說明（給分配畫面用）。 */
export const STAT_PERKS: Record<StatName, string> = {
  gengu: '每點氣血上限 +2；10：每回合回 2 氣血，之後每點再多回 1',
  wuxing: `${STAT_PERK_AT}：閉關時多升級一張牌；10：每回合多抽 1 張`,
  danshi: `${STAT_PERK_AT}：每場第一回合內力 +1；10：氣血不到一半時攻擊 +3，之後每點再 +1`,
  xinxing: `${STAT_PERK_AT}：每場第一次被點穴、下毒無效；10：「傷」「心魔」不再扣氣血，之後每點多擋一次點穴、下毒`,
  fuyuan: `${STAT_PERK_AT}：戰後獎勵比較容易出良、絕；10：戰後多一張可選、爆擊 +5%，之後每點爆擊再 +1%`,
  meili: `${STAT_PERK_AT}：武館學招、改招便宜兩成；10：交情 25 的故人就肯出手相助，之後每點門檻再低 3`,
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

/** 第二階：沒到 10 是 0；10 是 1，之後每多一點 +1。 */
export function perk2(s: GameState, stat: StatName): number {
  const v = s.player.stats[stat];
  return v >= STAT_PERK2_AT ? v - STAT_PERK2_AT + 1 : 0;
}

/** 故人出手相助要的交情：魅力 10 起降 15，之後每點再降 3（最低 10）。 */
export function allyRelation(s: GameState, base: number): number {
  const k = perk2(s, 'meili');
  return k ? Math.max(10, base - 15 - (k - 1) * 3) : base;
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
  const gengu = perk2(s, 'gengu');
  if (gengu) {
    const n = gengu + 1;
    p.names.push(`筋骨如鐵：每回合回 ${n} 氣血`);
    mergePassive(p, { regen: n });
  }
  const danshi = perk2(s, 'danshi');
  if (danshi) {
    const n = danshi + 2;
    p.names.push(`越戰越勇：氣血不到一半時攻擊 +${n}`);
    mergePassive(p, { desperateBonus: n });
  }
  const xinxing = perk2(s, 'xinxing');
  if (xinxing) {
    p.names.push(xinxing > 1 ? `心定如水：「傷」「心魔」不扣氣血，再多擋 ${xinxing - 1} 次點穴、下毒` : '心定如水：「傷」「心魔」不扣氣血');
    mergePassive(p, { curseNoHp: 1, resist: xinxing - 1 });
  }
  const fuyuan = perk2(s, 'fuyuan');
  if (fuyuan) {
    const n = fuyuan + 4;
    p.names.push(`福星高照：爆擊 +${n}%`);
    mergePassive(p, { critBonus: n / 100 });
  }
}

/** 心得加的氣血上限（算氣血時用）。 */
export function talentHp(s: GameState): number {
  return (s.player.talents ?? []).reduce((n, id) => n + (BY_ID.get(id)?.effect.maxHp ?? 0), 0);
}
