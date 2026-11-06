// npm run simulate -- --runs 2000 --seed 42
// 用隨機策略自動跑大量人生，輸出事件覆蓋率、結局分布與名俠相遇率。

import { CONTENT } from '../src/content';
import { playLife, type AutoplayResult } from '../src/engine/autoplay';
import { martialLevel } from '../src/engine/conditions';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}

const runs = arg('runs', 2000);
const baseSeed = arg('seed', 1);

const eventCount = new Map<string, number>();
const endingCount = new Map<string, number>();
const ambitionCount = new Map<string, { total: number; fulfilled: number }>();
const metCount = new Map<string, number>();
let totalAge = 0;
let youngDeaths = 0;
let totalTurns = 0;
let totalEvents = 0;
let totalFocusPicks = 0;
const maxMartial: number[] = [];
const youngDeathCauses = new Map<string, number>();
const alignments: number[] = [];
const fames: number[] = [];
const chivalries: number[] = [];
const finalMoney: number[] = [];
const propertyOwners = { land: 0, shop: 0 };
const itemHolders = new Map<string, number>();
const distinctEndingsFirstFive: number[] = [];
const allDuels: AutoplayResult['duels'] = [];

for (let i = 0; i < runs; i++) {
  const { state, events, focusPicks, duels } = playLife(baseSeed + i);
  allDuels.push(...duels);
  totalFocusPicks += focusPicks;
  for (const id of events) eventCount.set(id, (eventCount.get(id) ?? 0) + 1);
  const ending = state.ending!;
  endingCount.set(ending.title, (endingCount.get(ending.title) ?? 0) + 1);
  if (ending.ambition) {
    const a = ambitionCount.get(ending.ambition.name) ?? { total: 0, fulfilled: 0 };
    a.total += 1;
    if (ending.ambition.fulfilled) a.fulfilled += 1;
    ambitionCount.set(ending.ambition.name, a);
  }
  for (const npc of Object.values(CONTENT.npcs)) {
    if (npc.codex && state.flags[`met_${npc.id}`]) metCount.set(npc.name, (metCount.get(npc.name) ?? 0) + 1);
  }
  totalAge += state.player.age;
  if (state.flags.died_young) {
    youngDeaths += 1;
    const cause = state.deathCause ?? 'natural';
    youngDeathCauses.set(cause, (youngDeathCauses.get(cause) ?? 0) + 1);
  }
  alignments.push(state.player.alignment);
  fames.push(state.player.fame);
  chivalries.push(state.player.chivalry);
  finalMoney.push(state.player.money);
  for (const kind of ['land', 'shop'] as const) if (state.player.properties?.some((x) => x.kind === kind)) propertyOwners[kind]++;
  for (const id of state.player.items ?? []) itemHolders.set(id, (itemHolders.get(id) ?? 0) + 1);
  totalTurns += state.turn;
  totalEvents += events.length;
  maxMartial.push(martialLevel(state));
}

// 連玩五輪能看到幾種結局（以連續五個種子為一組）
for (let g = 0; g + 5 <= runs; g += 5) {
  const titles = new Set<string>();
  for (let i = g; i < g + 5; i++) titles.add(playLife(baseSeed + i).state.ending!.id);
  distinctEndingsFirstFive.push(titles.size);
  if (distinctEndingsFirstFive.length >= 100) break;
}

const pct = (n: number) => `${((n / runs) * 100).toFixed(1).padStart(5)}%`;
const line = (s = '') => console.log(s);

line(`模擬 ${runs} 輪人生（種子 ${baseSeed}–${baseSeed + runs - 1}）`);
line(`平均壽命 ${(totalAge / runs).toFixed(1)} 歲・五十歲前死亡 ${pct(youngDeaths)}・平均 ${(totalTurns / runs).toFixed(1)} 回合・平均 ${(totalEvents / runs).toFixed(1)} 個事件・平均選方針 ${(totalFocusPicks / runs).toFixed(1)} 次`);
line(`連玩五輪平均看到 ${(distinctEndingsFirstFive.reduce((a, b) => a + b, 0) / distinctEndingsFirstFive.length).toFixed(2)} 種結局`);

line('\n【結局分布】');
for (const en of [...CONTENT.endings].sort((a, b) => b.priority - a.priority)) {
  const n = endingCount.get(en.title) ?? 0;
  // v0.4 目標：江湖過客 ≤ 20%，其他結局 2%～25%（設計文件 v0.4 §6.3）
  const max = en.priority === 0 ? 0.2 : 0.25;
  const flagMark = n === 0 ? '  ← 從未出現' : n / runs > max ? '  ← 偏高' : n / runs < 0.02 ? '  ← 偏低' : '';
  line(`  ${en.title.padEnd(6, '　')} ${pct(n)}${flagMark}`);
}

line('\n【志向】選擇率 / 圓滿率');
for (const a of Object.values(CONTENT.ambitions)) {
  const x = ambitionCount.get(a.name) ?? { total: 0, fulfilled: 0 };
  line(`  ${a.name.padEnd(4, '　')} ${pct(x.total)} / ${x.total ? ((x.fulfilled / x.total) * 100).toFixed(0) : '-'}%`);
}

line('\n【名俠相遇率】');
for (const npc of Object.values(CONTENT.npcs).filter((n) => n.codex)) {
  const n = metCount.get(npc.name) ?? 0;
  line(`  ${npc.name.padEnd(4, '　')} ${pct(n)}${n / runs < 0.2 ? '  ← 低於 20%' : ''}`);
}

line('\n【武學境界分布】');
for (let lv = 0; lv <= 5; lv++) line(`  ${lv} 級 ${pct(maxMartial.filter((m) => m === lv).length)}`);
line(`  4 級以上 ${pct(maxMartial.filter((m) => m >= 4).length)}（目標 ≥ 25%）`);

line('\n【五十歲前的死因】');
for (const [cause, n] of [...youngDeathCauses].sort((a, b) => b[1] - a[1])) {
  line(`  ${CONTENT.deathCauses[cause] ?? cause} ${pct(n)}`);
}

const quantiles = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return [0.1, 0.5, 0.9, 0.99].map((q) => s[Math.min(s.length - 1, Math.floor(q * s.length))]).join(' / ');
};
line('\n【隱藏軸】（結局時，P10 / P50 / P90 / P99）');
line(`  名望 ${quantiles(fames)}`);
line(`  俠義 ${quantiles(chivalries)}`);
line(`  正邪 ${quantiles(alignments)}`);

line('\n【正邪分布】（結局時）');
line(`  ≤ −30（邪）     ${pct(alignments.filter((a) => a <= -30).length)}`);
line(`  −29～29（尋常） ${pct(alignments.filter((a) => a > -30 && a < 30).length)}`);
line(`  ≥ 30（正）      ${pct(alignments.filter((a) => a >= 30).length)}`);

line('\n【錢】（結局時）');
const sortedMoney = [...finalMoney].sort((a, b) => a - b);
const avgMoney = Math.round(finalMoney.reduce((a, b) => a + b, 0) / runs);
line(`  平均 ${avgMoney} 文・中位數 ${sortedMoney[Math.floor(runs / 2)]} 文・≥ 500 文 ${pct(finalMoney.filter((m) => m >= 500).length)}`);
line(`  結局時有田地 ${pct(propertyOwners.land)}・有鋪面 ${pct(propertyOwners.shop)}`);
line('  結局時行囊裡的信物：' + Object.values(CONTENT.items).map((it) => `${it.name} ${pct(itemHolders.get(it.id) ?? 0).trim()}`).join('、'));

line('\n【過招】（§3.11）');
const dpct = (w: number, n: number) => (n ? `${Math.round((w / n) * 100)}%` : '-');
const tally = (key: (d: AutoplayResult['duels'][number]) => string | number) => {
  const m = new Map<string | number, { n: number; w: number }>();
  for (const d of allDuels) {
    const x = m.get(key(d)) ?? { n: 0, w: 0 };
    x.n++;
    if (d.won) x.w++;
    m.set(key(d), x);
  }
  return m;
};
line(
  `  平均每輪 ${(allDuels.length / runs).toFixed(2)} 場・勝率 ${dpct(allDuels.filter((d) => d.won).length, allDuels.length)}・平均 ${(allDuels.reduce((s, d) => s + d.rounds, 0) / Math.max(1, allDuels.length)).toFixed(1)} 回合`,
);
const byDiff = [...tally((d) => Math.max(-3, Math.min(3, d.playerLevel - d.level)))].sort((a, b) => Number(a[0]) - Number(b[0]));
line('  等級差（玩家 − 對手）：' + byDiff.map(([k, x]) => `${Number(k) > 0 ? '+' : ''}${k} ${dpct(x.w, x.n)}（${x.n} 場）`).join('、'));
line('  對手：' + [...tally((d) => d.opponent)].map(([k, x]) => `${k} ${dpct(x.w, x.n)}（${x.n} 場）`).join('、'));

// 好鬥的玩家：有過招的選項就選它。隨機選選項的模擬玩家常常臨陣退出，這組數字比較接近想打的真人。
{
  const n = Math.max(100, Math.round(runs / 4));
  let duels = 0;
  let wins = 0;
  let champ = 0;
  const ends = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const r = playLife(baseSeed + i, { preferDuel: true });
    duels += r.duels.length;
    wins += r.duels.filter((d) => d.won).length;
    if (r.state.flags.lunwu_champion) champ++;
    ends.set(r.state.ending!.title, (ends.get(r.state.ending!.title) ?? 0) + 1);
  }
  line(`  好鬥玩家（有過招就打，${n} 輪）：每輪 ${(duels / n).toFixed(2)} 場・勝率 ${dpct(wins, duels)}・論武奪魁 ${((champ / n) * 100).toFixed(1)}%`);
  line('    結局：' + [...ends].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${((v / n) * 100).toFixed(1)}%`).join('、'));
}

line('\n【事件觸發率】（每輪人生中出現的比例）');
const rows = CONTENT.events.map((e) => ({ id: e.id, title: e.title, n: eventCount.get(e.id) ?? 0 }));
rows.sort((a, b) => b.n - a.n);
for (const r of rows) line(`  ${pct(r.n)}  ${r.title}（${r.id}）`);

const never = rows.filter((r) => r.n === 0);
if (never.length > 0) {
  line(`\n⚠ 從未觸發的事件：${never.map((r) => r.id).join('、')}`);
}
