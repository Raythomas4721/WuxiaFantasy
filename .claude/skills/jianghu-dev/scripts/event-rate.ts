// 量「這些事件在幾成的人生裡出現」。新增或調整事件之後用它確認真的遇得到。
//
//   npx tsx .claude/skills/jianghu-dev/scripts/event-rate.ts qinghen_junior baina_mantle --runs 300
//   npx tsx .claude/skills/jianghu-dev/scripts/event-rate.ts family_child --flag married
//   npx tsx .claude/skills/jianghu-dev/scripts/event-rate.ts baina_ears --sect baina
//
// --sect / --flag：只看「結束時在這個門派／有這個旗標」的人生（分母變小，看的是「走上這條路的人遇不遇得到」）。
// 「例」是第一個遇到的種子，可以拿去 playLife(seed, { until }) 在瀏覽器裡直接跳到那一幕。

import { CONTENT } from '../../../../src/content';
import { playLife } from '../../../../src/engine/autoplay';

const args = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const optionValues = new Set(['runs', 'seed', 'sect', 'flag'].flatMap((n) => (opt(n) === undefined ? [] : [opt(n)!])));
const ids = args.filter((a) => !a.startsWith('--') && !optionValues.has(a));
const runs = Number(opt('runs') ?? 300);
const baseSeed = Number(opt('seed') ?? 1);
const sect = opt('sect');
const flag = opt('flag');

if (ids.length === 0) {
  console.error('用法：event-rate.ts <事件 id>... [--runs 300] [--seed 1] [--sect 門派 id] [--flag 旗標]');
  process.exit(1);
}
const known = new Set(CONTENT.events.map((e) => e.id));
const unknown = ids.filter((id) => !known.has(id));
if (unknown.length > 0) {
  console.error(`沒有這些事件：${unknown.join('、')}`);
  process.exit(1);
}

const seen = new Map<string, { lives: number; firstSeed?: number }>(ids.map((id) => [id, { lives: 0 }]));
let counted = 0;
for (let i = 0; i < runs; i++) {
  const seed = baseSeed + i;
  const r = playLife(seed);
  if (sect && r.state.player.sect !== sect) continue;
  if (flag && !r.state.flags[flag]) continue;
  counted += 1;
  const fired = new Set(r.events);
  for (const id of ids) {
    if (!fired.has(id)) continue;
    const row = seen.get(id)!;
    row.lives += 1;
    row.firstSeed ??= seed;
  }
}

const scope = [sect && `門派 ${sect}`, flag && `旗標 ${flag}`].filter(Boolean).join('、');
console.log(`${runs} 輪人生${scope ? `，其中符合「${scope}」的 ${counted} 輪` : ''}`);
for (const id of ids) {
  const row = seen.get(id)!;
  const title = CONTENT.events.find((e) => e.id === id)!.title;
  const pct = counted > 0 ? ((row.lives / counted) * 100).toFixed(1) : '0.0';
  console.log(`  ${id}「${title}」 ${row.lives}/${counted}（${pct}%）${row.firstSeed !== undefined ? ` 例：seed ${row.firstSeed}` : ''}`);
}
