// 過招用的招式牌、對手與暗招（設計文件 §3.11）。數值調整後要跑 npm run duel-sim。

import type { CardDef, Condition, FoeTrapDef, IntentKind, OpponentDef } from '../engine/types';

const card = (c: CardDef) => c;

export const cards: Record<string, CardDef> = {
  // ---- 基本牌：每個人都有 ----
  punch: card({ id: 'punch', name: '出拳', kind: 'attack', tag: '拳', cost: 1, dmg: 5, flavor: '你一拳搗向{foe}的胸口。' }),
  parry: card({ id: 'parry', name: '招架', kind: 'guard', tag: '守', cost: 1, block: 5, flavor: '你沉肘護住要害。' }),
  breathe: card({ id: 'breathe', name: '調息', kind: 'skill', tag: '氣', cost: 0, energy: 1, exhaust: true, flavor: '你吐出一口濁氣，內息一轉。' }),
  xieli: card({
    id: 'xieli', name: '卸力', kind: 'trap', tag: '守', cost: 1, trigger: 'foeAttack', halve: true,
    flavor: '你順著來勢一帶，把{foe}的力道卸去了一半。',
  }),

  // ---- 長拳：拳拳相連，越打越快 ----
  chongquan: card({ id: 'chongquan', name: '衝拳', kind: 'attack', tag: '拳', cost: 1, dmg: 10, flavor: '你踏步衝拳，正中{foe}的肋下。' }),
  lianhuan: card({
    id: 'lianhuan', name: '連環拳', kind: 'attack', tag: '拳', cost: 1, dmg: 4, chain: { tags: ['拳'], dmg: 3 },
    flavor: '你的拳頭一記接著一記，{foe}只能連連後退。',
  }),
  zhama: card({
    id: 'zhama', name: '紮馬', kind: 'guard', tag: '守', cost: 1, block: 7, boostNext: { tags: ['拳'], dmg: 3 },
    flavor: '你沉腰紮馬，穩住了下盤，拳勁蓄在腰間。',
  }),

  // ---- 寒江劍法：看準了再出手 ----
  hanjiang1: card({
    id: 'hanjiang1', name: '寒江一式', kind: 'attack', tag: '劍', cost: 1, dmg: 6, vsIntent: { kinds: ['attack', 'combo'], dmg: 4 },
    flavor: '{foe}出手的那一瞬，你的劍已經點到他的手腕。',
  }),
  xietiao: card({ id: 'xietiao', name: '斜挑', kind: 'attack', tag: '劍', cost: 1, dmg: 4, expose: true, flavor: '你的劍尖斜斜一挑，{foe}的門戶大開。' }),
  jiangxin: card({
    id: 'jiangxin', name: '江心月', kind: 'trap', tag: '劍', cost: 2, trigger: 'foeAttack', halve: true, dmg: 9,
    flavor: '{foe}的招式走了一半的空，你的劍像江心的月影，從他想不到的地方遞了過去。',
  }),

  // ---- 守城十八槍：守住了，才有反擊 ----
  juma: card({ id: 'juma', name: '拒馬', kind: 'guard', tag: '槍', cost: 1, block: 8, flavor: '你橫槍一攔，像城頭的拒馬。' }),
  huima: card({
    id: 'huima', name: '回馬槍', kind: 'trap', tag: '槍', cost: 1, trigger: 'foeAttack', dmg: 7, block: 4,
    flavor: '你佯裝敗退，{foe}追上來的那一刻，回身就是一槍。',
  }),
  qiangzhen: card({
    id: 'qiangzhen', name: '槍陣', kind: 'attack', tag: '槍', cost: 2, dmg: 7, block: 7, after: { tags: ['守', '槍'], dmg: 4 },
    flavor: '你的槍影連成一片，攻守都在其中。',
  }),

  // ---- 流雲步：身法帶起招式 ----
  shanshen: card({ id: 'shanshen', name: '閃身', kind: 'guard', tag: '步', cost: 1, block: 5, draw: 1, flavor: '你腳下一錯，閃到了{foe}的側面。' }),
  raobu: card({
    id: 'raobu', name: '繞步', kind: 'trap', tag: '步', cost: 1, trigger: 'foeAttack', block: 7,
    flavor: '{foe}一招遞到，你腳下一繞，只被帶到一點衣角。',
  }),
  tayun: card({
    id: 'tayun', name: '踏雲', kind: 'skill', tag: '步', cost: 1, draw: 1, boostNext: { tags: ['劍', '拳', '槍'], dmg: 4 },
    flavor: '你足尖一點，身形拔起，下一招挾著落下的勢頭。',
  }),

  // ---- 市井十三拳：不講究，只求贏 ----
  satu: card({
    id: 'satu', name: '撒土', kind: 'skill', tag: '拳', cost: 0, expose: true, breakTrap: true, exhaust: true,
    flavor: '你抓起一把土朝{foe}臉上撒去。他藏著的後手，也跟著亂了。',
  }),
  ditang: card({ id: 'ditang', name: '地趟', kind: 'attack', tag: '拳', cost: 1, dmg: 5, block: 6, flavor: '你就地一滾，掃向{foe}的腳踝。' }),
  baoshuai: card({
    id: 'baoshuai', name: '抱摔', kind: 'attack', tag: '拳', cost: 2, dmg: 13, breakGuard: true, after: { tags: ['拳'], dmg: 3 },
    flavor: '你撲進{foe}懷裡，攔腰把他摔在地上。',
  }),

  // ---- 石壁殘劍：劍意無鋒 ----
  wufeng: card({ id: 'wufeng', name: '無鋒', kind: 'attack', tag: '劍', cost: 1, dmg: 8, pierce: true, flavor: '你的劍沒有鋒，卻穿過了{foe}的守勢。' }),
  jianyi: card({
    id: 'jianyi', name: '劍意', kind: 'skill', tag: '氣', cost: 1, block: 5, boostNext: { tags: ['劍'], mult: 2 },
    flavor: '你想起石壁上那道刻痕，劍意忽然通了。',
  }),
  canjian: card({ id: 'canjian', name: '殘劍', kind: 'attack', tag: '劍', cost: 2, dmg: 15, pierce: true, flavor: '半截劍招，卻比整招更狠。' }),

  // ---- 青衡十三式：法度嚴謹，一式接一式 ----
  qhqi: card({ id: 'qhqi', name: '青衡起式', kind: 'attack', tag: '劍', cost: 1, dmg: 6, block: 3, flavor: '你劍尖朝天，起手就是劍府的規矩。' }),
  liancheng: card({
    id: 'liancheng', name: '連城', kind: 'attack', tag: '劍', cost: 1, dmg: 4, chain: { tags: ['劍'], dmg: 3 },
    flavor: '一式未老，一式又生，劍光連成了一道牆。',
  }),
  hanyi: card({
    id: 'hanyi', name: '寒衣', kind: 'trap', tag: '劍', cost: 1, trigger: 'foeAttack', halve: true, expose: true,
    flavor: '{foe}的招式撞上你的劍，像撞上一層冰，力道散了一半，門戶也開了。',
  }),

  // ---- 夜雨針：中者到天亮才覺得疼 ----
  yeyuzhen: card({ id: 'yeyuzhen', name: '夜雨針', kind: 'attack', tag: '針', cost: 1, dmg: 2, hits: 2, bleed: 3, flavor: '你袖口一抖，幾點寒光沒入{foe}的身上。' }),
  wusheng: card({
    id: 'wusheng', name: '無聲', kind: 'trap', tag: '針', cost: 1, trigger: 'foeGuard', bleed: 4,
    flavor: '{foe}收招回護的那一刻，一根細針已經釘進他的穴道。',
  }),
  tougu: card({ id: 'tougu', name: '透骨', kind: 'attack', tag: '針', cost: 2, dmg: 6, bleedMult: 2, flavor: '針入三分，{foe}體內的傷一齊發作。' }),

  // ---- 醫術 ----
  jinchuang: card({ id: 'jinchuang', name: '金創藥', kind: 'skill', tag: '藥', cost: 1, heal: 8, exhaust: true, flavor: '你抽空往傷口上抹了一把藥。' }),

  // ---- 傷與心魔 ----
  wound: card({ id: 'wound', name: '傷', kind: 'curse', cost: 0, onDraw: { energy: 1, hp: 2 }, flavor: '舊傷一陣抽痛，手上慢了半拍。' }),
  demon: card({ id: 'demon', name: '心魔', kind: 'curse', cost: 0, onDraw: { hp: 3 }, flavor: '你的心裡忽然一亂，一口真氣走岔了。' }),

  // ---- 特殊牌 ----
  dudiao: card({
    id: 'dudiao', name: '獨釣寒江', kind: 'attack', tag: '劍', cost: 3, dmg: 24, exhaust: true,
    flavor: '沈孤舟信裡的那一式。天地間只剩一江寒水，和你的一劍。',
  }),
};

export const skillCards: Record<string, [string, string, string]> = {
  changquan: ['chongquan', 'zhama', 'lianhuan'],
  hanjiang: ['hanjiang1', 'xietiao', 'jiangxin'],
  shoucheng: ['juma', 'huima', 'qiangzhen'],
  liuyun: ['shanshen', 'raobu', 'tayun'],
  shijing: ['satu', 'ditang', 'baoshuai'],
  shibi: ['wufeng', 'jianyi', 'canjian'],
  qinghen: ['qhqi', 'liancheng', 'hanyi'],
  yeyu: ['yeyuzhen', 'wusheng', 'tougu'],
};

export const specialCards: { if: Condition; card: string }[] = [
  { if: { flags: ['read_shen_letter'] }, card: 'dudiao' },
  // 跟韓守義守過城、交情深厚：他親手教的拒馬
  { if: { flags: ['defended_city'], minRelation: { han_shouyi: 30 } }, card: 'juma+' },
];

export const foeTraps: Record<string, FoeTrapDef> = {
  fanshou: {
    id: 'fanshou', name: '反手刀', trigger: 'thirdAttack', dmg: 8,
    text: '你搶攻太急，{foe}反手一刀劈在你的肩上。', hint: '一回合打出第三張攻擊牌時，他會反手一刀',
  },
  weiou: {
    id: 'weiou', name: '打手', trigger: 'lowHp', dmg: 8,
    text: '你一露疲態，{foe}的打手就從兩邊圍了上來。', hint: '你的氣血跌破一半時，他的打手會圍上來',
  },
  tiebu: {
    id: 'tiebu', name: '硬功', trigger: 'bigHit', absorb: true,
    text: '你那一招結結實實打在{foe}身上，他卻像沒事一樣。', hint: '一招打出 12 以上的傷害，會被他硬接下來',
  },
  yuanbing: {
    id: 'yuanbing', name: '援兵', trigger: 'lowHp', dmg: 8,
    text: '援兵趕到了，一桿長槍從旁邊刺了過來。', hint: '你的氣血跌破一半時，他們的援兵會趕到',
  },
  huijian: {
    id: 'huijian', name: '回劍', trigger: 'thirdAttack', dmg: 8,
    text: '你搶攻太急，{foe}回劍一刺，正中你的肩頭。', hint: '一回合打出第三張攻擊牌時，他會回劍反刺',
  },
  shuangjiang: {
    id: 'shuangjiang', name: '霜降', trigger: 'bigHit', absorb: true,
    text: '{foe}衣袖一拂，你那一招的勁力被化得無影無蹤。', hint: '一招打出 12 以上的傷害，會被她化開',
  },
  huishen: {
    id: 'huishen', name: '回身箭', trigger: 'tag', tag: '步', dmg: 10,
    text: '你身形一動，{foe}頭也不回，反手就是一箭。', hint: '你打出〈步〉的牌時，他會回身一箭',
  },
};

const tells = (t: Partial<Record<IntentKind, string>>): Record<IntentKind, string> => ({
  attack: '他沉肩坐馬，要出重手。',
  combo: '他的招式連綿，一招接著一招。',
  guard: '他收招回護，等你先動。',
  charge: '他閉目調息，氣勢越來越沉。',
  feint: '他的眼神一直在找你的破綻。',
  ...t,
});

export const opponents: Record<string, OpponentDef> = {
  scar_young: {
    id: 'scar_young', name: '疤臉', level: 1, wuxing: 4, temper: 'brute', traps: ['fanshou'],
    tells: tells({ attack: '他把刀舉過頭頂，想一刀劈死你。', combo: '他的刀亂劈亂砍，毫無章法，卻又快又狠。' }),
  },
  tourney: {
    id: 'tourney', name: '擂台上的對手', level: { relative: 0, min: 1, max: 4 }, wuxing: 5, temper: 'guard',
    tells: tells({ guard: '他抱拳守住門戶，一副不急不躁的樣子。' }),
  },
  rival: {
    id: 'rival', name: '{rival}', level: { relative: -1, min: 1, max: 3 }, wuxing: 4, temper: 'brute', traps: ['weiou'],
    tells: tells({ attack: '他咬著牙，一拳就朝你臉上招呼過來。', guard: '他往打手身後一縮。' }),
  },
  senior: {
    id: 'senior', name: '同門師兄', level: { relative: 0, min: 1, max: 5 }, wuxing: 6, temper: 'guard',
    tells: tells({ guard: '他守得滴水不漏，一副「你先來」的樣子。', feint: '他嘴角帶笑，手上的招式卻虛虛實實。' }),
  },
  thugs: {
    id: 'thugs', name: '攔路的惡徒', level: { relative: -1, min: 0, max: 3 }, wuxing: 3, temper: 'brute',
    tells: tells({ attack: '帶頭的那個掄起棍子就朝你頭上砸。', combo: '幾個人一擁而上，拳腳亂飛。' }),
  },
  robbers: {
    id: 'robbers', name: '劫鏢的賊人', level: { relative: 0, min: 1, max: 4 }, wuxing: 5, temper: 'veteran', traps: ['weiou'],
    tells: tells({ feint: '賊頭子虛晃一刀，眼睛卻盯著鏢車。', charge: '賊人們慢慢圍成一圈，等著一擁而上。' }),
  },
  jailers: {
    id: 'jailers', name: '獄卒與官兵', level: { relative: 0, min: 2, max: 4 }, wuxing: 4, temper: 'guard', traps: ['yuanbing'],
    tells: tells({ guard: '官兵們結成盾陣，把牢門堵得死死的。', attack: '一個獄卒舉著鐵尺撲了上來。' }),
  },
  bodyguard: {
    id: 'bodyguard', name: '目標的護衛', level: { relative: 0, min: 1, max: 4 }, wuxing: 6, temper: 'guard', traps: ['tiebu'],
    tells: tells({ guard: '護衛把主人擋在身後，寸步不讓。' }),
  },
  lunwu_wanderer: {
    id: 'lunwu_wanderer', name: '江湖客', level: { relative: -1, min: 1, max: 4 }, wuxing: 5, temper: 'brute',
    tells: tells({ attack: '他把刀舉過肩，一副要硬碰硬的樣子。' }),
  },
  rival_lunwu: {
    id: 'rival_lunwu', name: '{rival}', level: { relative: 0, min: 2, max: 4 }, wuxing: 5, temper: 'veteran',
    tells: tells({ feint: '他的拳頭虛晃，眼睛卻一直盯著你的下盤。', attack: '他咬著牙，一副拚命的樣子。' }),
  },
  jianfu_disciple: {
    id: 'jianfu_disciple', name: '劍府弟子', level: { relative: 0, min: 2, max: 4 }, wuxing: 6, temper: 'guard', traps: ['huijian'],
    tells: tells({ guard: '他的劍守在中線，一絲不亂。', attack: '他的劍尖一抖，直刺而來。' }),
  },
  jianfu_examiner: {
    id: 'jianfu_examiner', name: '劍府考官', level: { relative: 0, min: 1, max: 3 }, wuxing: 7, temper: 'guard',
    easierWith: { any: [{ items: ['lunwu_token'] }, { flags: ['connections'] }] },
    tells: tells({ guard: '考官只守不攻，像是在等你露出本事。' }),
  },
  jianfu_senior: {
    id: 'jianfu_senior', name: '劍府大弟子', level: 2, wuxing: 7, temper: 'veteran', traps: ['huijian'],
    tells: tells({ attack: '他的劍勢沉了下來，下一劍會很重。', feint: '他的劍尖輕輕點著，虛實難辨。' }),
  },
  xie_lingshuang: {
    id: 'xie_lingshuang', name: '謝凌霜', level: 3, wuxing: 9, temper: 'veteran', traps: ['huijian', 'shuangjiang'],
    tells: tells({
      attack: '她的劍忽然停住了。你知道，下一劍會很快。',
      combo: '她手腕一翻，劍光碎成了一片。',
      guard: '她垂劍而立，衣袂不動。',
      charge: '她閉上了眼睛。台下的人都屏住了呼吸。',
      feint: '她看著你，嘴角似乎有一點笑意。',
    }),
  },
  jianfu_heir: {
    id: 'jianfu_heir', name: '劍府新秀', level: 3, wuxing: 8, temper: 'guard', traps: ['huijian', 'shuangjiang'],
    tells: tells({ guard: '他的劍法和謝凌霜如出一轍，守得滴水不漏。' }),
  },
  scar_old: {
    id: 'scar_old', name: '疤臉', level: 2, wuxing: 6, temper: 'veteran', lethal: true, traps: ['fanshou', 'tiebu'],
    tells: tells({ feint: '他的刀尖低垂，看起來破綻百出，像是故意的。' }),
  },
  bater: {
    id: 'bater', name: '巴特爾', level: 3, wuxing: 7, temper: 'veteran', lethal: true, traps: ['huishen'],
    tells: tells({
      attack: '他把弓拉成了滿月。',
      combo: '他從箭袋裡一次抽出了三支箭。',
      guard: '他撥馬退開，拉開了距離。',
      charge: '他屏住呼吸，箭尖一動也不動地對著你。',
      feint: '他的箭在你和你身後的人之間來回游移。',
    }),
  },
};
