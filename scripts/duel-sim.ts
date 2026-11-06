// npm run duel-sim -- --fights 500 [--quick]
// 用三種出牌策略自動打大量過招，輸出設計文件 §3.11 的勝率表。
//   隨便：亂出；直覺：自動遊玩用的策略；精算：窮舉這回合的出牌順序（只用來量測技術上限，很慢）。

import { CONTENT } from '../src/content';
import { DECK } from '../src/engine/deck';
import { DUEL, canPlay, createDuel, endRound, playCard, type Fighter } from '../src/engine/duel';
import { playRandomRound, playSimpleRound } from '../src/engine/duelAI';
import { Rng } from '../src/engine/rng';
import type { DuelState, OpponentDef } from '../src/engine/types';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}
const N = arg('fights', 500);
const QUICK = process.argv.includes('--quick');
// 調數值用：FOE_HP=50,8 FOE_ATK=10,2 PLAYER_HP=30 npm run duel-sim
const env = (k: string) => process.env[k]?.split(',').map(Number);
const [hpB, hpP] = env('FOE_HP') ?? [];
if (hpB !== undefined) DUEL.foeHp = (L) => hpB + L * hpP;
const [atB, atP] = env('FOE_ATK') ?? [];
if (atB !== undefined) DUEL.foeAttack = (L) => atB + L * atP;
const [phB] = env('PLAYER_HP') ?? [];
const [, phP] = env('PLAYER_HP') ?? [];
const [swing] = env('SWING') ?? [];
if (swing !== undefined) DUEL.intentSwing = swing;
if (phB !== undefined) DUEL.playerHp = (g, L) => phB + g * 2 + L * (phP ?? 3);

// 模擬用的對手：固定等級、照性格出招，沒有暗招。
for (const temper of ['brute', 'veteran', 'guard'] as const) {
  for (let L = 0; L <= 5; L++) {
    const id = `sim_${temper}_${L}`;
    CONTENT.opponents[id] = { ...CONTENT.opponents.tourney, id, name: `L${L}`, level: L, temper, traps: [] } as OpponentDef;
  }
}

/**
 * 一副「典型」的持久牌庫（v0.5 §2）：起手 10 張；入門挑兩招；之後每升一級多拿一兩張本門的牌、
 * 升級幾張、修心刪掉幾張基本牌。真正的分布看 npm run simulate。
 */
const REWARDS_AT_LEVEL = [0, 0, 1, 2, 4, 5];
function fighter(skill: string, level: number, opts: { wounds?: number; demons?: number; gengu?: number; wuxing?: number } = {}): Fighter {
  const deck = [...DECK.base, 'tiebushan', 'kanpo'];
  const [a, b, c] = CONTENT.skillCards[skill];
  if (level > 0) deck.push(a, b, ...[c, a, b, c, a].slice(0, REWARDS_AT_LEVEL[level]));
  // 閉關升級本門的牌（每級一張）、修心刪掉出拳
  let ups = Math.max(0, level - 1);
  for (let i = deck.length - 1; i >= 0 && ups > 0; i--) {
    if (CONTENT.skillCards[skill].includes(deck[i])) {
      deck[i] += '+';
      ups--;
    }
  }
  for (let i = 0; i < Math.max(0, level - 2); i++) deck.splice(deck.indexOf('punch'), 1);
  for (let i = 0; i < (opts.wounds ?? 0); i++) deck.push('wound');
  for (let i = 0; i < (opts.demons ?? 0); i++) deck.push('demon');
  return { hp: DUEL.playerHp(opts.gengu ?? 6, level), wuxing: opts.wuxing ?? 6, level, deck };
}

/** 不會變招、不洗牌的假亂數，讓精算策略評估出牌時不偷看真正的亂數。 */
const calm = { state: 0, next: () => 0.999, int: (a: number) => a, chance: () => false, pick: <T>(xs: readonly T[]) => xs[0], weighted: <T>(xs: { item: T }[]) => xs[xs.length - 1]?.item, sample: <T>(xs: readonly T[]) => [...xs] } as unknown as Rng;

function score(d: DuelState): number {
  if (d.over === 'win') return 10000 + d.me.hp;
  if (d.over === 'lose') return -10000;
  return d.me.hp * 1.0 - d.foe.hp * 1.0 + d.me.traps.length * 3 + d.me.hand.length * 1.5 + d.foe.bleed * 2;
}

function playSmartRound(state: DuelState, rng: Rng): DuelState {
  let best: number[] = [];
  let bestScore = -Infinity;
  const seen = new Set<string>();
  const search = (d: DuelState, seq: number[]) => {
    const key = [...d.me.hand].sort().join(',') + '|' + d.me.energy + '|' + d.me.traps.join(',') + '|' + d.me.played.join(',');
    if (seen.has(key)) return;
    seen.add(key);
    const after = d.over ? d : endRound(d, calm);
    const sc = score(after);
    if (sc > bestScore) {
      bestScore = sc;
      best = seq;
    }
    if (d.over) return;
    d.me.hand.forEach((_, i) => {
      if (canPlay(d, i)) search(playCard(d, i, calm), [...seq, i]);
    });
  };
  search(state, []);
  let d = state;
  for (const i of best) d = playCard(d, i, rng);
  return d.over ? d : endRound(d, rng);
}

type Policy = 'random' | 'simple' | 'smart';
const ROUND = { random: playRandomRound, simple: playSimpleRound, smart: playSmartRound };
const NAME = { random: '隨便', simple: '直覺', smart: '精算' };

function fight(seed: number, f: Fighter, foe: string, policy: Policy) {
  const rng = new Rng(seed);
  let d = createDuel(f, foe, 'sim', rng);
  for (let i = 0; i < 60 && !d.over; i++) d = ROUND[policy](d, rng);
  return { won: d.over === 'win', rounds: d.round, ko: d.foe.hp <= 0 || d.me.hp <= 0 };
}

const pct = (w: number, n = N) => `${Math.round((w / n) * 100)}%`.padStart(5);
const rate = (n: number, f: (i: number) => boolean) => {
  let w = 0;
  for (let i = 0; i < n; i++) if (f(i)) w++;
  return pct(w, n);
};
const temper = (i: number) => (['brute', 'veteran', 'guard'] as const)[i % 3];
const skills = Object.keys(CONTENT.skillCards);
const diffs = [-2, -1, 0, 1, 2];
const smartN = Math.max(50, Math.round(N / 5));

console.log(`各 ${N} 場（精算 ${smartN} 場）；玩家主修 2 級、根骨與悟性 6；對手性格輪流（莽夫、老江湖、守將）`);
console.log('\n【等級差】表頭是「玩家等級 − 對手等級」');
console.log('策略  武學         ' + diffs.map((x) => (x > 0 ? `+${x}` : `${x}`).padStart(5)).join(''));
for (const p of (QUICK ? ['simple'] : ['random', 'simple', 'smart']) as Policy[]) {
  for (const sk of p === 'simple' ? skills : ['hanjiang']) {
    const n = p === 'smart' ? smartN : N;
    const row = diffs
      .map((dx) => rate(n, (i) => fight(i * 7919 + 1, fighter(sk, 2 + Math.max(0, dx)), `sim_${temper(i)}_${2 - Math.min(0, dx)}`, p).won))
      .join('');
    console.log(`${NAME[p]}  ${sk.padEnd(10)}  ${row}`);
  }
}

console.log('\n【雙方同級】寒江劍法：隨便 / 直覺 / 精算・直覺平均回合・擊倒率');
for (let L = 0; L <= 5; L++) {
  let wr = 0, w = 0, ws = 0, r = 0, ko = 0;
  for (let i = 0; i < N; i++) {
    const foe = `sim_${temper(i)}_${L}`;
    const x = fight(i * 31 + 5, fighter('hanjiang', L), foe, 'simple');
    if (x.won) w++;
    r += x.rounds;
    if (x.ko) ko++;
    if (fight(i * 31 + 5, fighter('hanjiang', L), foe, 'random').won) wr++;
    if (!QUICK && i < smartN && fight(i * 31 + 5, fighter('hanjiang', L), foe, 'smart').won) ws++;
  }
  console.log(`  ${L} 級  ${pct(wr)} /${pct(w)} /${QUICK ? '    -' : pct(ws, smartN)}   ${(r / N).toFixed(1)} 回合  擊倒 ${pct(ko)}`);
}

console.log('\n【對手性格】同級 2 級，各武學直覺勝率：莽夫 / 老江湖 / 守將');
for (const sk of skills) {
  const row = (['brute', 'veteran', 'guard'] as const).map((t) => rate(N, (i) => fight(i * 17 + 9, fighter(sk, 2), `sim_${t}_2`, 'simple').won)).join(' /');
  console.log(`  ${sk.padEnd(10)} ${row}`);
}

console.log('\n【傷與心魔】寒江 2 級、同級、直覺出牌');
for (const [w, dm] of [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]]) {
  console.log(`  傷 ${w}・心魔 ${dm}：${rate(N, (i) => fight(i * 13 + 3, fighter('hanjiang', 2, { wounds: w, demons: dm }), `sim_${temper(i)}_2`, 'simple').won)}`);
}

console.log('\n【劇情對手】主修寒江、直覺出牌');
for (const [foe, lv] of [['scar_young', 0], ['scar_young', 1], ['rival', 1], ['rival', 2], ['scar_old', 2], ['scar_old', 3], ['bater', 2], ['bater', 3], ['bater', 4]] as const) {
  console.log(`  ${foe.padEnd(10)} 玩家 ${lv} 級：${rate(N, (i) => fight(i * 101 + 7, fighter('hanjiang', lv), foe, 'simple').won)}`);
}
