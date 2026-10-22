// 內容檢查：在建置前找出打錯的 id、只讀不寫的旗標、假選項與禁用名稱。

import { TEMPLATE_KEYS } from './text';
import type { Condition, Content, GameEffect, Outcome, OutcomeSpec, TextSpec, VarSpec } from './types';

/** 引擎自己設定的旗標。 */
const ENGINE_FLAGS = ['hidden_illness', 'weak_body', 'omen', 'fortune_decline', 'fortune_rise', 'father_dead', 'mother_dead', 'dead', 'died_young'];

/** 知名武俠作品的專有名稱，遊戲內容不得出現。 */
export const BANNED_NAMES = [
  // 金庸
  '郭靖', '黃蓉', '楊過', '小龍女', '洪七公', '黃藥師', '歐陽鋒', '一燈', '周伯通', '王重陽', '郭襄', '郭芙',
  '李莫愁', '金輪法王', '張無忌', '張翠山', '喬峰', '蕭峰', '段譽', '虛竹', '令狐沖', '韋小寶', '陳家洛', '胡斐',
  '江南七怪', '全真七子', '古墓派', '桃花島', '逍遙派', '星宿派', '日月神教', '明教', '絕情谷', '活死人墓',
  '降龍十八掌', '打狗棒', '九陰真經', '九陽神功', '獨孤九劍', '六脈神劍', '凌波微步', '北冥神功', '玉女心經',
  '蛤蟆功', '一陽指', '彈指神通', '空明拳', '左右互搏', '黯然銷魂', '乾坤大挪移', '吸星大法', '辟邪劍',
  '倚天劍', '屠龍刀', '華山論劍', '天下五絕', '東邪', '西毒', '南帝', '北丐', '中神通', '丐幫', '神鵰', '射鵰',
  // 古龍、梁羽生、溫瑞安
  '李尋歡', '小李飛刀', '楚留香', '陸小鳳', '西門吹雪', '花滿樓', '傅紅雪', '燕南天', '白髮魔女', '練霓裳',
  '七劍下天山', '四大名捕',
];

export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

function walkCondition(c: Condition | undefined, visit: (c: Condition) => void): void {
  if (!c) return;
  visit(c);
  c.any?.forEach((sub) => walkCondition(sub, visit));
  walkCondition(c.not, visit);
}

function outcomesOf(spec: OutcomeSpec | undefined): Outcome[] {
  if (!spec) return [];
  return Array.isArray(spec) ? spec : [spec];
}

function textConditions(spec: TextSpec): Condition[] {
  return typeof spec === 'string' ? [] : spec.flatMap((v) => (v.if ? [v.if] : []));
}

function textStrings(spec: TextSpec): string[] {
  return typeof spec === 'string' ? [spec] : spec.map((v) => v.text);
}

function varStrings(spec: VarSpec): string[] {
  return spec.flatMap((v) => (typeof v === 'string' ? [v] : v.values));
}

function varConditions(spec: VarSpec): Condition[] {
  return spec.flatMap((v) => (typeof v !== 'string' && v.if ? [v.if] : []));
}

/** 找出文字裡引用了、卻沒有定義的 {變數}。 */
function unknownPlaceholders(texts: string[], allowed: Set<string>): string[] {
  const bad = new Set<string>();
  for (const t of texts) for (const m of t.matchAll(/\{(\w+)\}/g)) if (!allowed.has(m[1])) bad.add(m[1]);
  return [...bad];
}

export function validateContent(content: Content): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const eventIds = new Set<string>();
  const conditions: { where: string; c: Condition }[] = [];
  const effects: { where: string; e: GameEffect }[] = [];

  for (const e of content.events) {
    if (eventIds.has(e.id)) errors.push(`事件 id 重複：${e.id}`);
    eventIds.add(e.id);
    const w = `事件 ${e.id}`;
    if (e.conditions) conditions.push({ where: w, c: e.conditions });
    textConditions(e.text).forEach((c) => conditions.push({ where: w, c }));
    e.weightMods?.forEach((m) => conditions.push({ where: w, c: m.if }));
    e.enterEffects?.forEach((x) => effects.push({ where: w, e: x }));

    const strings: string[] = [...textStrings(e.text)];
    for (const spec of Object.values(e.vars ?? {})) {
      strings.push(...varStrings(spec));
      varConditions(spec).forEach((c) => conditions.push({ where: w, c }));
      if (varStrings(spec).length === 0) errors.push(`${w}：有一組素材是空的`);
    }
    for (const ch of e.choices) {
      strings.push(ch.text);
      for (const o of [...outcomesOf(ch.outcome), ...outcomesOf(ch.check?.success), ...outcomesOf(ch.check?.failure)]) {
        strings.push(...textStrings(o.text));
        if (o.recap) strings.push(o.recap.text);
      }
    }
    const allowed = new Set([...TEMPLATE_KEYS, ...Object.keys(e.vars ?? {})]);
    for (const key of unknownPlaceholders(strings, allowed)) errors.push(`${w}：文字引用了未定義的變數 {${key}}`);

    if (e.choices.length < 2) errors.push(`${w}：選項少於 2 個`);
    if (!e.choices.some((c) => !c.requires)) errors.push(`${w}：沒有任何無條件的選項，可能卡住`);
    const choiceIds = new Set<string>();
    for (const ch of e.choices) {
      const cw = `${w} / ${ch.id}`;
      if (choiceIds.has(ch.id)) errors.push(`${cw}：選項 id 重複`);
      choiceIds.add(ch.id);
      if (ch.requires) conditions.push({ where: cw, c: ch.requires });
      if (!ch.check && !ch.outcome) errors.push(`${cw}：沒有結果`);
      const outs = [...outcomesOf(ch.outcome), ...outcomesOf(ch.check?.success), ...outcomesOf(ch.check?.failure)];
      for (const o of outs) {
        if (!o.effects || o.effects.length === 0) errors.push(`${cw}：結果沒有任何效果（假選項）`);
        if (o.if) conditions.push({ where: cw, c: o.if });
        textConditions(o.text).forEach((c) => conditions.push({ where: cw, c }));
        o.effects?.forEach((x) => effects.push({ where: cw, e: x }));
      }
      for (const spec of [ch.outcome, ch.check?.success, ch.check?.failure]) {
        if (Array.isArray(spec) && spec[spec.length - 1].if) errors.push(`${cw}：條件結果清單的最後一項必須沒有條件`);
      }
    }
  }

  const builtIns = new Set(TEMPLATE_KEYS);
  for (const f of content.focuses) {
    const w = `方針 ${f.id}`;
    if (f.conditions) conditions.push({ where: w, c: f.conditions });
    f.growth.forEach((g) => effects.push({ where: w, e: g.effect }));
    varConditions(f.summary).forEach((c) => conditions.push({ where: w, c }));
    if (varStrings(f.summary).length === 0) errors.push(`${w}：沒有任何歲月摘要`);
    for (const key of unknownPlaceholders(varStrings(f.summary), builtIns)) errors.push(`${w}：文字引用了未定義的變數 {${key}}`);
  }
  const otherTexts = [
    ...content.endings.flatMap((en) => textStrings(en.text)),
    ...Object.values(content.ambitions).flatMap((a) => [a.fulfilledText, a.unfulfilledText]),
    ...content.eraLines.map((l) => l.text),
    ...content.rumors.map((r) => r.text),
  ];
  for (const key of unknownPlaceholders(otherTexts, builtIns)) errors.push(`結局／志向／傳聞：文字引用了未定義的變數 {${key}}`);
  for (const b of Object.values(content.backgrounds)) b.effects?.forEach((e) => effects.push({ where: `出身 ${b.id}`, e }));
  for (const t of Object.values(content.traits)) t.effects.forEach((e) => effects.push({ where: `特質 ${t.id}`, e }));
  for (const en of content.endings) {
    conditions.push({ where: `結局 ${en.id}`, c: en.conditions });
    textConditions(en.text).forEach((c) => conditions.push({ where: `結局 ${en.id}`, c }));
  }
  for (const a of Object.values(content.ambitions)) conditions.push({ where: `志向 ${a.id}`, c: a.fulfilled });
  for (const l of content.eraLines) if (l.if) conditions.push({ where: '時代經歷', c: l.if });
  for (const r of content.rumors) if (r.conditions) conditions.push({ where: `傳聞 ${r.id}`, c: r.conditions });

  const last = [...content.endings].sort((a, b) => a.priority - b.priority)[0];
  if (Object.keys(last.conditions).length > 0) errors.push('優先序最低的結局必須沒有條件，作為保底');
  if (content.eraLines[content.eraLines.length - 1]?.if) errors.push('時代經歷的最後一項必須沒有條件');

  // ---- 引用檢查 ----
  const has = (rec: Record<string, unknown>, id: string) => Object.prototype.hasOwnProperty.call(rec, id);
  const focusIds = new Set(content.focuses.map((f) => f.id));
  const setFlags = new Set<string>(ENGINE_FLAGS);
  const readFlags = new Map<string, string>();

  for (const { where, e } of effects) {
    switch (e.type) {
      case 'flag':
      case 'addFlag':
        setFlags.add(e.key);
        break;
      case 'relation':
        if (!has(content.npcs, e.npc)) errors.push(`${where}：未知人物 ${e.npc}`);
        break;
      case 'meet':
        if (!has(content.npcs, e.npc)) errors.push(`${where}：未知人物 ${e.npc}`);
        setFlags.add(`met_${e.npc}`);
        break;
      case 'master':
        if (!has(content.npcs, e.npc)) errors.push(`${where}：未知人物 ${e.npc}`);
        break;
      case 'skill':
        if (!has(content.skills, e.skill)) errors.push(`${where}：未知武學 ${e.skill}`);
        break;
      case 'joinSect':
        if (!has(content.sects, e.sect)) errors.push(`${where}：未知門派 ${e.sect}`);
        setFlags.add(`joined_${e.sect}`);
        break;
      case 'region':
        if (e.region !== 'home' && !has(content.regions, e.region)) errors.push(`${where}：未知地區 ${e.region}`);
        break;
      case 'ambition':
        if (!has(content.ambitions, e.ambition)) errors.push(`${where}：未知志向 ${e.ambition}`);
        break;
      case 'schedule':
        if (!eventIds.has(e.event)) errors.push(`${where}：排程了不存在的事件 ${e.event}`);
        break;
      case 'die':
        if (!has(content.deathCauses, e.cause)) errors.push(`${where}：未知死因 ${e.cause}`);
        break;
      default:
        break;
    }
  }

  for (const { where, c: root } of conditions) {
    walkCondition(root, (c) => {
      for (const f of [...(c.flags ?? []), ...(c.notFlags ?? []), ...Object.keys(c.flagMin ?? {}), ...Object.keys(c.flagMax ?? {})]) {
        if (!readFlags.has(f)) readFlags.set(f, where);
      }
      c.backgrounds?.forEach((b) => !has(content.backgrounds, b) && errors.push(`${where}：未知出身 ${b}`));
      c.regions?.forEach((r) => !has(content.regions, r) && errors.push(`${where}：未知地區 ${r}`));
      [...(c.traits ?? []), ...(c.notTraits ?? [])].forEach((t) => !has(content.traits, t) && errors.push(`${where}：未知特質 ${t}`));
      c.sects?.forEach((s) => !has(content.sects, s) && errors.push(`${where}：未知門派 ${s}`));
      c.ambitions?.forEach((a) => !has(content.ambitions, a) && errors.push(`${where}：未知志向 ${a}`));
      c.focus?.forEach((f) => !focusIds.has(f) && errors.push(`${where}：未知方針 ${f}`));
      Object.keys(c.minSkill ?? {}).forEach((s) => !has(content.skills, s) && errors.push(`${where}：未知武學 ${s}`));
      const npcRefs = [...Object.keys(c.minRelation ?? {}), ...Object.keys(c.maxRelation ?? {}), ...(c.npcAlive ?? [])];
      if (c.npcPresent) npcRefs.push(c.npcPresent);
      npcRefs.forEach((n) => !has(content.npcs, n) && errors.push(`${where}：未知人物 ${n}`));
    });
  }

  for (const [f, where] of readFlags) {
    // dead_<npc> 由內容設定，也可能只靠 deathYear；只要對應人物存在就接受。
    if (f.startsWith('dead_') && has(content.npcs, f.slice(5))) continue;
    if (!setFlags.has(f)) errors.push(`${where}：讀取了從未被設定的旗標 ${f}`);
  }

  // ---- 禁用名稱 ----
  const allText = JSON.stringify(content);
  for (const name of BANNED_NAMES) {
    if (allText.includes(name)) errors.push(`出現禁用名稱：${name}`);
  }

  // ---- 提醒 ----
  const scheduled = new Set(effects.flatMap(({ e }) => (e.type === 'schedule' ? [e.event] : [])));
  for (const e of content.events) {
    if (e.scheduledOnly && !scheduled.has(e.id)) warnings.push(`事件 ${e.id} 只能被排程，但沒有任何地方排程它`);
  }

  return { errors, warnings };
}
