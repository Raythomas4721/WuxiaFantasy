import { CONTENT } from '../content';
import { checkCondition, currentYear } from './conditions';
import type { GameState, TextSpec } from './types';

const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 0–99 的中文數字，例如 12 → 十二、30 → 三十。 */
export function chineseNumber(n: number): string {
  if (n < 10) return DIGITS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${tens === 1 ? '' : DIGITS[tens]}十${ones === 0 ? '' : DIGITS[ones]}`;
}

// 年號：start 為元年，from 為開始使用的西元年（處理同年改元）。
const ERAS = [
  { name: '寶慶', start: 1225, from: 1225 },
  { name: '紹定', start: 1228, from: 1228 },
  { name: '端平', start: 1234, from: 1234 },
  { name: '嘉熙', start: 1237, from: 1237 },
  { name: '淳祐', start: 1241, from: 1241 },
  { name: '寶祐', start: 1253, from: 1253 },
  { name: '開慶', start: 1259, from: 1259 },
  { name: '景定', start: 1260, from: 1260 },
  { name: '咸淳', start: 1265, from: 1265 },
  { name: '德祐', start: 1275, from: 1275 },
  { name: '景炎', start: 1276, from: 1277 },
  { name: '祥興', start: 1278, from: 1279 },
  { name: '至元', start: 1264, from: 1280 },
  { name: '元貞', start: 1295, from: 1295 },
  { name: '大德', start: 1297, from: 1297 },
];

export function eraName(year: number): string {
  let era = ERAS[0];
  for (const e of ERAS) if (year >= e.from) era = e;
  const n = year - era.start + 1;
  return `${era.name}${n === 1 ? '元' : chineseNumber(n)}年`;
}

export function pickText(spec: TextSpec, state: GameState): string {
  if (typeof spec === 'string') return spec;
  const hit = spec.find((v) => checkCondition(state, v.if));
  return hit ? hit.text : '';
}

/** 所有事件都能使用的內建變數名稱（內容檢查用）。 */
export const TEMPLATE_KEYS = [
  'name', 'surname', 'companion', 'companionTrait', 'rival', 'age', 'ageCn', 'year', 'yearName', 'region', 'place', 'sect',
];

export function templateVars(state: GameState): Record<string, string> {
  const p = state.player;
  const region = CONTENT.regions[p.region];
  return {
    name: p.name,
    surname: p.surname,
    companion: state.companion.name,
    companionTrait: state.companion.trait,
    rival: state.rival.name,
    age: String(p.age),
    ageCn: chineseNumber(p.age),
    year: String(currentYear(state)),
    yearName: eraName(currentYear(state)),
    region: region?.name ?? p.region,
    place: region?.place ?? p.region,
    sect: p.sect ? CONTENT.sects[p.sect]?.name ?? '' : '',
  };
}

/**
 * 代入變數。extra 是組合式事件抽出的素材，素材本身也可以再引用內建變數（例如 {companion}），
 * 所以最多代換兩輪。
 */
export function fill(text: string, state: GameState, extra?: Record<string, string>): string {
  const vars = { ...templateVars(state), ...extra };
  const once = (t: string) => t.replace(/\{(\w+)\}/g, (m, key: string) => vars[key] ?? m);
  return once(once(text));
}

export function renderText(spec: TextSpec, state: GameState, extra?: Record<string, string>): string {
  return fill(pickText(spec, state), state, extra);
}
