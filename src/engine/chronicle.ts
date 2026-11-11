// 一生回顧：把人生紀錄和過招紀錄，按人生階段排成一條時間軸；
// 再算出這一生的過招戰績、江湖名號、和這一生遇見的人。全部只讀 GameState，不改狀態。

import { CONTENT } from '../content';
import { skillLevel } from './conditions';
import { LEVEL_NAMES } from './describe';
import { mainSkill } from './duel';
import { LIFE_STAGES, chapterTitle, stageIndex } from './stages';
import { chineseNumber } from './text';
import type { DuelRecord, GameState, LifeChapter, LifeMoment, StatName } from './types';

/** 每章最多幾件事（不含過招與終章）。 */
const MOMENTS_PER_CHAPTER = 3;
/** 剩不到這麼多氣血還打贏，算「險勝」。 */
const CLOSE_CALL = 0.2;
/** 活到這個歲數，江湖上才會有你的名號。 */
const EPITHET_MIN_AGE = 16;

const TIER_RANK = { boss: 3, elite: 2, minor: 1 } as const;

function pct(x: number): number {
  return Math.max(1, Math.round(x * 100));
}

/** 這一場值不值得寫進一生回顧，越大越值得。 */
function duelWeight(r: DuelRecord): number {
  if (r.result !== 'win') return r.lethal ? 4 : 0;
  let w = TIER_RANK[r.tier ?? 'minor'];
  if (r.lethal) w += 2;
  if (r.low < CLOSE_CALL) w += 2;
  if (r.avenged) w += 3;
  else if ((r.nth ?? 1) >= 2) w += 1;
  return w;
}

const LIFE_STAGE_PREFIX = /^(?:童年|少年|青年|壯年|晚年)時，/;

/** 時間軸上已經標了歲數，回顧開頭的「十一歲那年（夏天），」「晚年時，」就拿掉。 */
function stripAge(text: string): string {
  const t = text.replace(/^[一二三四五六七八九十]+歲那年(?:[春夏秋冬]天)?，/, '');
  return t.replace(LIFE_STAGE_PREFIX, '');
}

/** 句子裡的招式名不帶升級的「＋」。 */
function plainCard(name: string): string {
  return name.replace(/＋+$/, '');
}

function duelLine(r: DuelRecord): string {
  const line = duelLineBase(r);
  return r.ally ? `${line}危急時，${r.ally}出手相助。` : line;
}

function duelLineBase(r: DuelRecord): string {
  if (r.result === 'yield') return `生死關頭被${r.name}逼退，拚著一身傷才逃了出來。`;
  if (r.result === 'lose') return `敗在${r.name}手下。`;
  const again = (r.nth ?? 1) >= 2 ? `第${chineseNumber(r.nth!)}次和${r.name}交手，` : '';
  if (r.avenged) return `${again}終於扳回了上一回的敗局。${r.bestCard && r.bestHit > 0 ? `一記【${plainCard(r.bestCard)}】打出 ${r.bestHit} 點傷。` : ''}`;
  const blow = r.bestCard && r.bestHit > 0 ? `，一記【${plainCard(r.bestCard)}】打出 ${r.bestHit} 點傷` : '';
  if (r.low < CLOSE_CALL) return `和${r.name}一戰，氣血只剩${pct(r.low)}%，硬是撐到最後${blow}。`;
  const rounds = r.rounds <= 2 ? `只用了${chineseNumber(r.rounds)}個回合` : `鏖戰${chineseNumber(r.rounds)}個回合`;
  return `${rounds}擊敗${r.name}${blow}。`;
}

/** 按人生階段分章，每章挑分量最重的幾件事，再加上這一章最值得一提的一場過招。 */
export function lifeChapters(s: GameState): LifeChapter[] {
  const last = stageIndex(s.player.age);
  const chapters: LifeChapter[] = [];
  for (let i = 0; i <= last; i++) {
    const from = LIFE_STAGES[i].from;
    const to = i < last ? LIFE_STAGES[i + 1].from - 1 : s.player.age;
    const moments = chapterMoments(s, i, MOMENTS_PER_CHAPTER);
    if (i === last && !s.player.alive) {
      const cause = CONTENT.deathCauses[s.deathCause ?? 'natural'] ?? s.deathCause ?? '';
      const by = s.deathCause === 'duel' ? s.duels?.at(-1)?.name : undefined;
      moments.push({ age: s.player.age, text: by ? `倒在${by}手下。` : `${cause}。`, kind: 'death' });
    }
    if (moments.length === 0) continue;
    chapters.push({ title: chapterTitle(i), ages: `${from}–${to} 歲`, moments });
  }
  return chapters;
}

/** 某一章分量最重的幾件事（照時間排），加上這一章最值得一提的一場過招。章節開場的「回首」也用它。 */
export function chapterMoments(s: GameState, i: number, limit: number): LifeMoment[] {
  const last = stageIndex(s.player.age);
  const from = LIFE_STAGES[i].from;
  const to = i < last ? LIFE_STAGES[i + 1].from - 1 : s.player.age;
  const inStage = (age: number) => age >= from && age <= to;
  const moments: (LifeMoment & { turn: number })[] = s.history
    .filter((h) => h.recap && inStage(h.age))
    .sort((a, b) => (b.recap!.weight - a.recap!.weight) || a.turn - b.turn)
    .slice(0, limit)
    .map((h) => ({ age: h.age, turn: h.turn, text: stripAge(h.recap!.text), kind: 'story' as const }));

  const duel = (s.duels ?? [])
    .filter((r) => inStage(r.age) && duelWeight(r) >= 2)
    .sort((a, b) => duelWeight(b) - duelWeight(a) || b.bestHit - a.bestHit)[0];
  // 打死你的那一場由終章交代，不重複
  if (duel && !(duel.result === 'lose' && !s.player.alive && s.deathCause === 'duel' && duel === s.duels!.at(-1))) {
    // 同一件事裡打的那一場，戰況附在那件事底下
    const same = moments.find((m) => m.turn === duel.turn);
    if (same) same.detail = duelLine(duel);
    else moments.push({ age: duel.age, turn: duel.turn, text: duelLine(duel), kind: 'duel' });
  }
  moments.sort((a, b) => a.turn - b.turn);
  return moments.map(({ turn: _turn, ...m }) => m);
}

/** 這一生的過招：戰績、擊倒的強敵、最重的一擊、最險的一勝、武學境界。 */
export function lifeFeats(s: GameState): { label: string; value: string }[] {
  const feats: { label: string; value: string }[] = [];
  const rs = s.duels ?? [];
  const main = mainSkill(s);
  if (main.skill) feats.push({ label: '武學', value: `${CONTENT.skills[main.skill].name}・${LEVEL_NAMES[main.level]}` });
  const med = skillLevel(s, 'baicao');
  if (med >= 2) feats.push({ label: '醫術', value: `${CONTENT.skills.baicao.name}・${LEVEL_NAMES[med]}` });
  if (rs.length === 0) return feats;

  const wins = rs.filter((r) => r.result === 'win');
  feats.push({ label: '過招', value: `${rs.length} 場，勝 ${wins.length} 場` });

  const strong = [...new Set(wins.filter((r) => r.tier === 'boss' || r.tier === 'elite' || r.lethal).map((r) => r.name))];
  if (strong.length > 0) {
    const more = strong.length > 3 ? ` 等 ${strong.length} 人` : '';
    feats.push({ label: '擊倒的強敵', value: strong.slice(0, 3).join('、') + more });
  }

  const best = [...rs].sort((a, b) => b.bestHit - a.bestHit)[0];
  if (best && best.bestHit > 0) {
    feats.push({ label: '最重的一擊', value: `【${best.bestCard ?? '？'}】${best.bestHit} 點（${best.age} 歲，對${best.name}）` });
  }

  const crits = rs.reduce((n, r) => n + (r.crits ?? 0), 0);
  if (crits > 0) feats.push({ label: '打中要害', value: `${crits} 次` });

  // 宿敵：交手兩次以上的人
  const byWho = new Map<string, DuelRecord[]>();
  for (const r of rs) if (r.who) byWho.set(r.who, [...(byWho.get(r.who) ?? []), r]);
  const rivals = [...byWho.values()]
    .filter((list) => list.length >= 2)
    .map((list) => {
      const won = list.filter((r) => r.result === 'win').length;
      return `${list[list.length - 1].name}（交手 ${list.length} 次，勝 ${won} 次）`;
    });
  if (rivals.length > 0) feats.push({ label: '宿敵', value: rivals.join('、') });

  const close = wins.filter((r) => r.low < CLOSE_CALL).sort((a, b) => a.low - b.low)[0];
  if (close) feats.push({ label: '最險的一勝', value: `剩 ${pct(close.low)}% 氣血勝${close.name}（${close.age} 歲）` });
  return feats;
}

const WEAPON_WORD: Record<string, { noun: string; plain: string; grit: string }> = {
  hanjiang: { noun: '劍', plain: '劍客', grit: '孤' },
  shibi: { noun: '劍', plain: '劍客', grit: '孤' },
  qinghen: { noun: '劍', plain: '劍客', grit: '孤' },
  shoucheng: { noun: '槍', plain: '槍手', grit: '鐵' },
  yeyu: { noun: '針', plain: '暗器手', grit: '冷' },
  fuxing: { noun: '指', plain: '點穴手', grit: '靈' },
  liuyun: { noun: '影', plain: '飛客', grit: '孤' },
  changquan: { noun: '拳', plain: '拳師', grit: '鐵' },
  shijing: { noun: '拳', plain: '拳師', grit: '鐵' },
};

/** 打法、為人都沒有特色時，看最突出的屬性取字。福緣不好取字，就用平實的稱呼。 */
const STAT_WORD: Partial<Record<StatName, string>> = { gengu: '鐵', wuxing: '巧', danshi: '猛', xinxing: '靜', meili: '玉' };
/** 最突出的屬性至少要到這裡，才拿來取字。 */
const STAT_WORD_AT = 6;

const PLACE_WORD: Record<string, string> = { jiangnan: '江南', xiangyang: '襄陽', shu: '川蜀', qingming: '青冥' };

/** 江湖名號：地方 + 為人或打法 + 兵器，例如「襄陽快劍」「江南義拳」。place 是成名的地方（不給就用現在所在地）。 */
export function epithet(s: GameState, fixedPlace?: string): string | undefined {
  const p = s.player;
  if (p.age < EPITHET_MIN_AGE) return undefined;
  const place = fixedPlace ?? PLACE_WORD[p.region] ?? '';
  const main = mainSkill(s);
  const med = skillLevel(s, 'baicao');
  if (med >= 3 && med > main.level) return `${place}${p.chivalry >= 30 ? '仁心' : '妙手'}`;
  if (!main.skill || main.level <= 1) return p.fame >= 30 ? `${place}名士` : undefined;

  const w = WEAPON_WORD[main.skill] ?? WEAPON_WORD.changquan;
  const wins = (s.duels ?? []).filter((r) => r.result === 'win');
  const quick = wins.filter((r) => r.rounds <= 2).length;
  const close = wins.filter((r) => r.low < CLOSE_CALL).length;
  const killer = wins.filter((r) => r.lethal).length;
  let adj = '';
  if (p.alignment <= -30) adj = '鬼';
  else if (p.chivalry >= 40) adj = '義';
  else if (wins.length >= 4 && quick * 2 >= wins.length) adj = '快';
  else if (close >= 2) adj = w.grit;
  else if (killer >= 3) adj = '斷';
  else if (p.fame >= 60) adj = '一';
  else {
    const [top, value] = (Object.entries(p.stats) as [StatName, number][]).sort((a, b) => b[1] - a[1])[0];
    if (value >= STAT_WORD_AT) adj = STAT_WORD[top] ?? '';
  }
  return adj ? `${place}${adj}${w.noun}` : `${place}${w.plain}`;
}

/** 名望「小有名氣」以上，或打倒過首領、強敵，江湖上才會開始叫你的名號。 */
const RENOWN_FAME = 10;

function renowned(s: GameState): boolean {
  if (s.player.fame >= RENOWN_FAME) return true;
  return (s.duels ?? []).some((r) => r.result === 'win' && (r.tier === 'boss' || r.tier === 'elite' || r.lethal));
}

/**
 * 人生中途的名號：第一次夠格就給；之後要到新的一章，算出來的名號不一樣了才改口。
 * 成名的地方固定，不會因為搬家就一直變。有變化時回傳新舊名號。就地修改。
 */
export function updateEpithet(s: GameState): { name: string; prev?: string } | undefined {
  const p = s.player;
  const stage = stageIndex(p.age);
  if (!p.epithet) {
    if (!renowned(s)) return undefined;
    const name = epithet(s);
    if (!name) return undefined;
    p.epithet = { name, place: PLACE_WORD[p.region] ?? '', stage };
    return { name };
  }
  if (stage <= p.epithet.stage) return undefined;
  const name = epithet(s, p.epithet.place);
  if (!name || name === p.epithet.name) return undefined;
  const prev = p.epithet.name;
  p.epithet = { ...p.epithet, name, stage };
  return { name, prev };
}

function relationNote(v: number): string | undefined {
  if (v >= 60) return '生死之交';
  if (v >= 30) return '交情不淺';
  if (v <= -40) return '結了深仇';
  if (v <= -15) return '心存芥蒂';
  return undefined;
}

/** 這一生的人：師父、玩伴、對頭，和交情（或仇）夠深的名俠。 */
export function lifePeople(s: GameState): { name: string; note: string }[] {
  const out: { name: string; note: string }[] = [];
  for (const id of s.player.masters) {
    const npc = CONTENT.npcs[id];
    if (npc) out.push({ name: npc.name, note: '師父' });
  }
  const comp = relationNote(s.relations.companion ?? 0);
  out.push({ name: s.companion.name, note: comp ? `兒時玩伴，${comp}` : '兒時玩伴' });
  const rival = s.relations.rival ?? 0;
  if (rival !== 0) out.push({ name: s.rival.name, note: rival > 0 ? '從前的對頭，後來和解了' : '從小的對頭' });

  const others = Object.entries(s.relations)
    .filter(([id]) => CONTENT.npcs[id] && !s.player.masters.includes(id))
    .map(([id, v]) => ({ id, v, note: relationNote(v) }))
    .filter((x) => x.note)
    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
    .slice(0, 4);
  for (const x of others) out.push({ name: CONTENT.npcs[x.id].name, note: x.note! });
  return out;
}
