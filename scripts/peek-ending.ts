import { playLife } from '../src/engine/autoplay';
const seeds = process.argv.slice(2).map(Number);
for (const seed of seeds.length ? seeds : [1, 2, 3]) {
  const e = playLife(seed, { preferDuel: true }).state.ending!;
  console.log(`\n== seed ${seed}: ${e.title} / 名號 ${e.epithet ?? '（無）'}`);
  for (const c of e.chapters ?? []) {
    console.log(`  ${c.title}（${c.ages}）`);
    for (const m of c.moments) console.log(`    ${m.age}歲 [${m.kind}] ${m.text}`);
  }
  for (const f of e.feats ?? []) console.log(`  · ${f.label}：${f.value}`);
  console.log('  人：' + (e.people ?? []).map((p) => `${p.name}（${p.note}）`).join('、'));
}
