// npm run simulate -- --runs 2000 --seed 42
// 用隨機策略自動跑大量人生，輸出事件覆蓋率、結局分布與名俠相遇率。

import { CONTENT } from '../src/content';
import { playLife } from '../src/engine/autoplay';
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
const maxMartial: number[] = [];
const distinctEndingsFirstFive: number[] = [];

for (let i = 0; i < runs; i++) {
  const { state, events } = playLife(baseSeed + i);
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
  if (state.flags.died_young) youngDeaths += 1;
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
line(`平均壽命 ${(totalAge / runs).toFixed(1)} 歲・五十歲前死亡 ${pct(youngDeaths)}・平均 ${(totalTurns / runs).toFixed(1)} 回合・平均 ${(totalEvents / runs).toFixed(1)} 個事件`);
line(`連玩五輪平均看到 ${(distinctEndingsFirstFive.reduce((a, b) => a + b, 0) / distinctEndingsFirstFive.length).toFixed(2)} 種結局`);

line('\n【結局分布】');
for (const en of [...CONTENT.endings].sort((a, b) => b.priority - a.priority)) {
  const n = endingCount.get(en.title) ?? 0;
  const flagMark = n / runs > 0.3 && en.priority > 0 ? '  ← 偏高' : n === 0 ? '  ← 從未出現' : '';
  line(`  ${en.title.padEnd(6, '　')} ${pct(n)}${flagMark}`);
}

line('\n【志向】選擇率 / 圓滿率');
for (const a of Object.values(CONTENT.ambitions)) {
  const x = ambitionCount.get(a.name) ?? { total: 0, fulfilled: 0 };
  line(`  ${a.name.padEnd(4, '　')} ${pct(x.total)} / ${x.total ? ((x.fulfilled / x.total) * 100).toFixed(0) : '-'}%`);
}

line('\n【名俠相遇率】');
for (const npc of Object.values(CONTENT.npcs).filter((n) => n.codex)) {
  line(`  ${npc.name.padEnd(4, '　')} ${pct(metCount.get(npc.name) ?? 0)}`);
}

line('\n【武學境界分布】');
for (let lv = 0; lv <= 5; lv++) line(`  ${lv} 級 ${pct(maxMartial.filter((m) => m === lv).length)}`);

line('\n【事件觸發率】（每輪人生中出現的比例）');
const rows = CONTENT.events.map((e) => ({ id: e.id, title: e.title, n: eventCount.get(e.id) ?? 0 }));
rows.sort((a, b) => b.n - a.n);
for (const r of rows) line(`  ${pct(r.n)}  ${r.title}（${r.id}）`);

const never = rows.filter((r) => r.n === 0);
if (never.length > 0) {
  line(`\n⚠ 從未觸發的事件：${never.map((r) => r.id).join('、')}`);
}
