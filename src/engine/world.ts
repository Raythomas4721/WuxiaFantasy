// 世界線變數與遊歷目的地（設計文件 v0.4 §2.8、§3.4；v0.5 C4）。
// 開局擲三個江湖變數，寫成世界旗標；中間值不設旗標，事件條件只讀兩端。

import { CONTENT } from '../content';
import { currentYear, npcAlive } from './conditions';
import type { Rng } from './rng';
import type { GameState } from './types';

/** 每個變數的三個值：[兩端, 中間, 另一端]，權重 1:2:1。 */
const WORLD_VARS: { id: string; low: string; high: string }[] = [
  { id: 'xueyi', low: 'quiet', high: 'rampant' }, // 血衣樓：沉寂／尋常／猖獗
  { id: 'plague', low: 'light', high: 'dire' }, // 疫變：輕／重／慘烈
  { id: 'jianfu', low: 'fall', high: 'rise' }, // 劍府氣運：衰／守／興
];

/** 引擎會設定的世界旗標（給內容檢查用）。 */
export const WORLD_FLAGS = WORLD_VARS.flatMap((v) => [`world_${v.id}_${v.low}`, `world_${v.id}_${v.high}`]);

export function rollWorld(s: GameState, rng: Rng): void {
  for (const v of WORLD_VARS) {
    const value = rng.weighted([
      { item: v.low, weight: 1 },
      { item: '', weight: 2 },
      { item: v.high, weight: 1 },
    ]);
    if (value) s.flags[`world_${v.id}_${value}`] = true;
  }
}

// ---------- 遊歷目的地 ----------

/** 相鄰的地區各走一段日子；不相鄰的要經過中間的地區，路上多一場小戰。 */
const ROADS: [string, string][] = [
  ['jiangnan', 'xiangyang'],
  ['xiangyang', 'shu'],
  ['jiangnan', 'qingming'],
  ['xiangyang', 'qingming'],
];

export function adjacent(a: string, b: string): boolean {
  return ROADS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export interface Destination {
  id: string;
  name: string;
  far: boolean;
  hint: string;
}

const LUNWU_YEARS = [1242, 1254, 1266];

/** 「最近聽說……」：名俠行蹤、江湖大事、世界線，都沒有就用地區簡介。 */
function hearsay(s: GameState, region: string): string {
  const year = currentYear(s);
  const near = (y: number, before: number, after = 0) => year >= y - before && year <= y + after;
  if (region === 'qingming' && LUNWU_YEARS.some((y) => near(y, 3))) return '青冥論武就快開了，各派的年輕人都往山上去。';
  if (region === 'xiangyang' && year >= 1267 && year <= 1273) return '蒙古大軍在襄陽城外築堡，城裡正在招人守城。';
  if (region === 'shu' && year >= 1236 && year <= 1241) {
    return s.flags.world_plague_dire ? '川蜀的瘟疫越鬧越兇，聽說一個縣死了一半的人。' : '川蜀鬧瘟疫，藥谷開谷救人，正缺人手。';
  }
  if (region === 'qingming' && s.flags.world_jianfu_rise) return '青衡劍府這幾年人才輩出，山門前天天有人排隊。';
  if (region === 'qingming' && s.flags.world_jianfu_fall) return '聽說青衡劍府出了內鬥，兩位長老在山上拔了劍。';
  // 認識的名俠在那一帶
  const met = Object.values(CONTENT.npcs).find(
    (n) =>
      n.codex &&
      s.flags[`met_${n.id}`] &&
      npcAlive(s, n.id) &&
      n.presence.some((p) => year >= p.from && year <= p.to && p.regions.includes(region)),
  );
  if (met) return `聽說${met.title ? `「${met.title}」` : ''}${met.name}這幾年在那一帶。`;
  return CONTENT.regions[region].desc;
}

/** 選「遊歷」時可以去的地方（不含現在所在地）。 */
export function destinations(s: GameState): Destination[] {
  const here = s.player.region;
  return Object.values(CONTENT.regions)
    .filter((r) => r.id !== here)
    .map((r) => ({ id: r.id, name: r.name, far: !adjacent(here, r.id), hint: hearsay(s, r.id) }));
}
