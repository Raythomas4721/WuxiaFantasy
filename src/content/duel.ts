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

  // ---- 出身的牌 ----
  biandan: card({
    id: 'biandan', name: '扁擔掃', kind: 'attack', tag: '槍', cost: 1, dmg: 4, breakGuard: true,
    flavor: '你像在田埂上挑擔那樣一掄，把{foe}護在身前的手掃開了。',
  }),
  qiantong: card({
    id: 'qiantong', name: '錢可通神', kind: 'skill', cost: 0, money: 5, draw: 2, exhaust: true,
    flavor: '你朝旁邊看熱鬧的人拋了一把銅錢，趁亂多看了{foe}兩眼。',
  }),

  // ---- 奇招：不分門派，人人都可能拿到 ----
  jieli: card({
    id: 'jieli', name: '借力', kind: 'trap', tag: '守', cost: 1, trigger: 'foeAttack', halve: true, dmg: 4,
    flavor: '你順著{foe}的來勢一引，借他自己的力道送了回去。',
  }),
  xuhuang: card({ id: 'xuhuang', name: '虛晃', kind: 'skill', cost: 0, expose: true, exhaust: true, flavor: '你肩頭一晃，{foe}跟著動了一下，露出了破綻。' }),
  pinming: card({ id: 'pinming', name: '拚命', kind: 'attack', tag: '拳', cost: 1, dmg: 12, selfHp: 4, flavor: '你不閃不避，硬是挨著{foe}的拳頭撞了進去。' }),
  kanpo: card({ id: 'kanpo', name: '看破', kind: 'skill', tag: '氣', cost: 0, breakTrap: true, draw: 1, exhaust: true, flavor: '你盯著{foe}看了一眼，看穿了他藏著的後手。' }),
  tiebushan: card({ id: 'tiebushan', name: '鐵布衫', kind: 'guard', tag: '守', cost: 1, block: 8, flavor: '你運氣一頂，渾身的筋肉繃得像鐵。' }),
  liusanfen: card({ id: 'liusanfen', name: '留三分', kind: 'guard', tag: '守', cost: 1, block: 5, energyNext: 1, flavor: '你出手只用七分力，留著三分等下一招。' }),
  tingshen: card({
    id: 'tingshen', name: '挺身', kind: 'guard', tag: '守', cost: 1, block: 6, boostNext: { tags: ['拳', '劍', '槍', '針'], dmg: 3 },
    flavor: '你挺身站到前面，一步也不退。',
  }),
  zhouxuan: card({ id: 'zhouxuan', name: '周旋', kind: 'skill', cost: 1, draw: 1, expose: true, flavor: '你一邊遊走一邊說話，{foe}被你繞得心浮氣躁。' }),
  juechu: card({ id: 'juechu', name: '絕處', kind: 'attack', tag: '拳', cost: 1, dmg: 5, desperate: 8, flavor: '退無可退，你反而撲了上去。' }),
  cangfeng: card({
    id: 'cangfeng', name: '藏鋒', kind: 'skill', tag: '氣', cost: 1, block: 4, boostNext: { tags: ['拳', '劍', '槍', '針'], dmg: 5 },
    flavor: '你收斂起氣勢，像是怯了。{foe}沒看見你袖子裡握緊的拳頭。',
  }),
  bengong: card({ id: 'bengong', name: '笨功夫', kind: 'attack', tag: '拳', cost: 1, dmg: 7, flavor: '一招練了一萬遍，就不笨了。' }),
  zuibu: card({
    id: 'zuibu', name: '醉步', kind: 'trap', tag: '步', cost: 1, trigger: 'foeAttack', halve: true, draw: 1,
    flavor: '你腳下一個踉蹌，{foe}那一招就從你耳邊擦了過去。',
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
    id: 'jiangxin', name: '江心月', rarity: 'uncommon', kind: 'trap', tag: '劍', cost: 2, trigger: 'foeAttack', halve: true, dmg: 9,
    flavor: '{foe}的招式走了一半的空，你的劍像江心的月影，從他想不到的地方遞了過去。',
  }),

  // ---- 守城十八槍：守住了，才有反擊 ----
  juma: card({ id: 'juma', name: '拒馬', kind: 'guard', tag: '槍', cost: 1, block: 8, flavor: '你橫槍一攔，像城頭的拒馬。' }),
  huima: card({
    id: 'huima', name: '回馬槍', kind: 'trap', tag: '槍', cost: 1, trigger: 'foeAttack', dmg: 7, block: 4,
    flavor: '你佯裝敗退，{foe}追上來的那一刻，回身就是一槍。',
  }),
  qiangzhen: card({
    id: 'qiangzhen', name: '槍陣', rarity: 'uncommon', kind: 'attack', tag: '槍', cost: 2, dmg: 7, block: 7, after: { tags: ['守', '槍'], dmg: 4 },
    flavor: '你的槍影連成一片，攻守都在其中。',
  }),

  // ---- 流雲步：身法帶起招式 ----
  shanshen: card({ id: 'shanshen', name: '閃身', kind: 'guard', tag: '步', cost: 1, block: 5, draw: 1, flavor: '你腳下一錯，閃到了{foe}的側面。' }),
  raobu: card({
    id: 'raobu', name: '繞步', kind: 'trap', tag: '步', cost: 1, trigger: 'foeAttack', block: 7, dmg: 4,
    flavor: '{foe}一招遞到，你腳下一繞，只被帶到一點衣角，還順勢回了一腳。',
  }),
  tayun: card({
    id: 'tayun', name: '踏雲', rarity: 'uncommon', kind: 'skill', tag: '步', cost: 1, draw: 1, boostNext: { tags: ['劍', '拳', '槍'], dmg: 4 },
    flavor: '你足尖一點，身形拔起，下一招挾著落下的勢頭。',
  }),

  // ---- 市井十三拳：不講究，只求贏 ----
  satu: card({
    id: 'satu', name: '撒土', kind: 'skill', tag: '拳', cost: 0, expose: true, breakTrap: true, exhaust: true,
    flavor: '你抓起一把土朝{foe}臉上撒去。他藏著的後手，也跟著亂了。',
  }),
  ditang: card({ id: 'ditang', name: '地趟', kind: 'attack', tag: '拳', cost: 1, dmg: 5, block: 6, flavor: '你就地一滾，掃向{foe}的腳踝。' }),
  baoshuai: card({
    id: 'baoshuai', name: '抱摔', rarity: 'uncommon', kind: 'attack', tag: '拳', cost: 2, dmg: 13, breakGuard: true, after: { tags: ['拳'], dmg: 3 },
    flavor: '你撲進{foe}懷裡，攔腰把他摔在地上。',
  }),

  // ---- 石壁殘劍：劍意無鋒 ----
  wufeng: card({ id: 'wufeng', name: '無鋒', kind: 'attack', tag: '劍', cost: 1, dmg: 8, pierce: true, flavor: '你的劍沒有鋒，卻穿過了{foe}的守勢。' }),
  jianyi: card({
    id: 'jianyi', name: '劍意', kind: 'skill', tag: '氣', cost: 1, block: 5, boostNext: { tags: ['劍'], mult: 2 },
    flavor: '你想起石壁上那道刻痕，劍意忽然通了。',
  }),
  canjian: card({ id: 'canjian', name: '殘劍', rarity: 'uncommon', kind: 'attack', tag: '劍', cost: 2, dmg: 15, pierce: true, flavor: '半截劍招，卻比整招更狠。' }),

  // ---- 青衡十三式：法度嚴謹，一式接一式 ----
  qhqi: card({ id: 'qhqi', name: '青衡起式', kind: 'attack', tag: '劍', cost: 1, dmg: 6, block: 3, flavor: '你劍尖朝天，起手就是劍府的規矩。' }),
  liancheng: card({
    id: 'liancheng', name: '連城', kind: 'attack', tag: '劍', cost: 1, dmg: 4, chain: { tags: ['劍'], dmg: 3 },
    flavor: '一式未老，一式又生，劍光連成了一道牆。',
  }),
  hanyi: card({
    id: 'hanyi', name: '寒衣', rarity: 'uncommon', kind: 'trap', tag: '劍', cost: 1, trigger: 'foeAttack', halve: true, expose: true,
    flavor: '{foe}的招式撞上你的劍，像撞上一層冰，力道散了一半，門戶也開了。',
  }),

  // ---- 夜雨針：中者到天亮才覺得疼 ----
  yeyuzhen: card({ id: 'yeyuzhen', name: '夜雨針', kind: 'attack', tag: '針', cost: 1, dmg: 2, hits: 2, bleed: 3, flavor: '你袖口一抖，幾點寒光沒入{foe}的身上。' }),
  wusheng: card({
    id: 'wusheng', name: '無聲', kind: 'trap', tag: '針', cost: 1, trigger: 'foeGuard', bleed: 4,
    flavor: '{foe}收招回護的那一刻，一根細針已經釘進他的穴道。',
  }),
  tougu: card({ id: 'tougu', name: '透骨', rarity: 'uncommon', kind: 'attack', tag: '針', cost: 2, dmg: 6, bleedMult: 2, flavor: '針入三分，{foe}體內的傷一齊發作。' }),

  // ==== C3：每門武學補到 8 張 ====
  // 長拳：攢拳 → 連環 → 收勢，連招越長越痛
  zanquan: card({ id: 'zanquan', name: '攢拳', kind: 'attack', tag: '拳', cost: 1, dmg: 3, draw: 1, flavor: '你一拳一拳地攢著勁，越打越順。' }),
  tiequan: card({ id: 'tiequan', name: '鐵拳', rarity: 'uncommon', kind: 'attack', tag: '拳', cost: 1, dmg: 7, breakGuard: true, flavor: '你一拳砸碎了{foe}的架子。' }),
  shoushi: card({
    id: 'shoushi', name: '收勢', rarity: 'uncommon', kind: 'attack', tag: '拳', cost: 1, dmg: 4, chain: { tags: ['拳'], dmg: 4 }, block: 3,
    flavor: '一套拳打到最後，所有的勁都收在這一下。',
  }),
  paoquan: card({ id: 'paoquan', name: '炮拳', rarity: 'uncommon', kind: 'attack', tag: '拳', cost: 2, dmg: 16, flavor: '你的拳像炮一樣轟了出去。' }),
  yiqi: card({
    id: 'yiqi', name: '一氣呵成', rarity: 'rare', kind: 'skill', tag: '氣', cost: 1, draw: 2, boostNext: { tags: ['拳'], mult: 2 },
    flavor: '你深吸一口氣，接下來的一拳，要把這口氣全打出去。',
  }),

  // 寒江劍法：看準了再出手（讀招、伏招）
  diaoxue: card({ id: 'diaoxue', name: '獨釣', kind: 'trap', tag: '劍', cost: 1, trigger: 'foeAttack', block: 6, draw: 1, flavor: '你像江邊垂釣的人，一動不動，等{foe}自己送上來。' }),
  hanyu: card({
    id: 'hanyu', name: '寒雨', kind: 'attack', tag: '劍', cost: 1, dmg: 3, hits: 2, vsIntent: { kinds: ['guard', 'charge'], dmg: 2 },
    flavor: '劍光像冬夜的冷雨，一點一點地落在{foe}身上。',
  }),
  yezhou: card({
    id: 'yezhou', name: '夜舟', rarity: 'uncommon', kind: 'trap', tag: '劍', cost: 1, trigger: 'foeCharge', dmg: 15,
    flavor: '{foe}閉目蓄勢的那一刻，你的劍像夜裡的小舟，無聲無息地到了。',
  }),
  gujian: card({
    id: 'gujian', name: '孤劍', rarity: 'uncommon', kind: 'attack', tag: '劍', cost: 2, dmg: 9, vsIntent: { kinds: ['attack', 'combo', 'feint'], dmg: 9 },
    flavor: '{foe}出手的同時，你的劍也到了。只是你的比較快。',
  }),
  qianshan: card({
    id: 'qianshan', name: '千山暮雪', rarity: 'rare', kind: 'attack', tag: '劍', cost: 2, dmg: 9, expose: true, after: { tags: ['劍'], dmg: 9 },
    flavor: '一劍遞出，像千山同時落了雪。',
  }),

  // 守城十八槍：守住了，才有反擊（護體轉傷害）
  tuqiang: card({ id: 'tuqiang', name: '突槍', kind: 'attack', tag: '槍', cost: 1, dmg: 6, after: { tags: ['守', '槍'], dmg: 3 }, flavor: '你從守勢裡猛地一槍突了出去。' }),
  zhenshou: card({ id: 'zhenshou', name: '鎮守', kind: 'guard', tag: '守', cost: 1, block: 5, fortify: true, flavor: '你像釘在城頭上一樣，一步不退。（護體留到下回合）' }),
  fanji: card({
    id: 'fanji', name: '反擊', rarity: 'uncommon', kind: 'attack', tag: '槍', cost: 1, dmg: 2, dmgFromBlock: 1,
    flavor: '你擋下了{foe}所有的招式，然後把這些力道全部還給他。',
  }),
  tiebi: card({ id: 'tiebi', name: '鐵壁', rarity: 'uncommon', kind: 'guard', tag: '槍', cost: 2, block: 14, fortify: true, flavor: '你把長槍往地上一頓，像一道鐵壁。' }),
  huitian: card({
    id: 'huitian', name: '回天', rarity: 'rare', kind: 'attack', tag: '槍', cost: 2, dmg: 4, dmgFromBlock: 2,
    flavor: '城頭上守了一年又一年的那股勁，全在這一槍裡。',
  }),

  // 流雲步：身法帶起招式（抽牌、引）
  feiyan: card({ id: 'feiyan', name: '飛燕', kind: 'guard', tag: '步', cost: 0, block: 3, flavor: '你身子一輕，像燕子一樣掠了開去。' }),
  zhuiyun: card({ id: 'zhuiyun', name: '追雲', kind: 'attack', tag: '步', cost: 1, dmg: 6, after: { tags: ['步'], dmg: 6 }, flavor: '你借著身法的勢頭，一掌拍在{foe}的背上。' }),
  yunzhong: card({ id: 'yunzhong', name: '雲中', rarity: 'uncommon', kind: 'guard', tag: '步', cost: 1, block: 5, draw: 2, flavor: '你在{foe}身邊繞來繞去，他連你的衣角都碰不到。' }),
  huanying: card({
    id: 'huanying', name: '幻影', rarity: 'uncommon', kind: 'trap', tag: '步', cost: 1, trigger: 'foeAttack', halve: true, draw: 1, energyNext: 1,
    flavor: '{foe}打中的只是你的影子。',
  }),
  wuying: card({ id: 'wuying', name: '無影', rarity: 'rare', kind: 'skill', tag: '步', cost: 1, draw: 2, energyNext: 2, flavor: '你的身形一晃就不見了。等{foe}找到你，你已經準備好了。' }),

  // 市井十三拳：不講究，只求贏（破守、亂打）
  saotui: card({ id: 'saotui', name: '掃腿', kind: 'attack', tag: '拳', cost: 1, dmg: 4, breakGuard: true, flavor: '你一腿掃向{foe}的腳踝，他的架子就散了。' }),
  dingtou: card({ id: 'dingtou', name: '頭槌', kind: 'attack', tag: '拳', cost: 1, dmg: 8, selfHp: 2, flavor: '你一頭撞在{foe}的鼻樑上，自己也眼冒金星。' }),
  luanquan: card({ id: 'luanquan', name: '亂拳', rarity: 'uncommon', kind: 'attack', tag: '拳', cost: 2, dmg: 3, hits: 4, flavor: '你不管章法，一拳接一拳地往{foe}身上招呼。' }),
  shuaiwan: card({ id: 'shuaiwan', name: '摔碗', rarity: 'uncommon', kind: 'skill', tag: '拳', cost: 1, draw: 2, expose: true, flavor: '你抄起桌上的碗砸了過去，趁亂摸到了更趁手的東西。' }),
  gundi: card({
    id: 'gundi', name: '滾地十三路', rarity: 'rare', kind: 'attack', tag: '拳', cost: 2, dmg: 12, block: 10, breakGuard: true,
    flavor: '你在地上連滾帶打，{foe}從來沒見過這種打法。',
  }),

  // 石壁殘劍：劍意無鋒（穿透、倍數）
  bihen: card({ id: 'bihen', name: '壁痕', kind: 'attack', tag: '劍', cost: 1, dmg: 5, pierce: true, flavor: '你照著石壁上那道刻痕，一劍劃了過去。' }),
  jingzuo: card({ id: 'jingzuo', name: '面壁', kind: 'skill', tag: '氣', cost: 0, block: 3, energyNext: 1, flavor: '你閉上眼睛，彷彿又回到了那個石洞。' }),
  duanjian: card({
    id: 'duanjian', name: '斷劍', rarity: 'uncommon', kind: 'attack', tag: '劍', cost: 1, dmg: 7, pierce: true, after: { tags: ['氣'], dmg: 7 },
    flavor: '劍斷了，劍意還在。',
  }),
  jianxin: card({ id: 'jianxin', name: '劍心', rarity: 'uncommon', kind: 'skill', tag: '氣', cost: 2, draw: 2, energyNext: 2, flavor: '你的心裡忽然只剩下一把劍。' }),
  kaishan: card({ id: 'kaishan', name: '開山', rarity: 'rare', kind: 'attack', tag: '劍', cost: 3, dmg: 26, pierce: true, flavor: '石壁上最後那一道刻痕，原來是這樣劈出來的。' }),

  // 青衡十三式：一式接一式（承、連）
  qhcheng: card({ id: 'qhcheng', name: '承式', kind: 'attack', tag: '劍', cost: 1, dmg: 5, after: { tags: ['劍'], block: 5 }, flavor: '上一式的劍勢還沒散，這一式已經接上了。' }),
  qhshou: card({ id: 'qhshou', name: '守式', kind: 'guard', tag: '劍', cost: 1, block: 6, boostNext: { tags: ['劍'], dmg: 3 }, flavor: '你劍尖斜指，守得滴水不漏。' }),
  qhzhuan: card({ id: 'qhzhuan', name: '轉式', rarity: 'uncommon', kind: 'attack', tag: '劍', cost: 0, dmg: 3, draw: 1, flavor: '你手腕一轉，劍招已經換了。' }),
  qhluo: card({ id: 'qhluo', name: '落霜', rarity: 'uncommon', kind: 'attack', tag: '劍', cost: 2, dmg: 6, chain: { tags: ['劍'], dmg: 4 }, flavor: '劍光落下，像一層薄霜。' }),
  shisan: card({
    id: 'shisan', name: '十三式歸一', rarity: 'rare', kind: 'attack', tag: '劍', cost: 2, dmg: 4, hits: 3, after: { tags: ['劍'], dmg: 3 },
    flavor: '十三式在這一刻合成了一式。',
  }),

  // 夜雨針：內傷疊加，慢慢磨死對手
  xiyu: card({ id: 'xiyu', name: '細雨', kind: 'attack', tag: '針', cost: 0, dmg: 1, bleed: 2, flavor: '一根細針，{foe}根本沒感覺。' }),
  mengyu: card({ id: 'mengyu', name: '濛雨', kind: 'guard', tag: '針', cost: 1, block: 5, bleed: 2, flavor: '你一邊擋，一邊在{foe}身上留下了幾個針眼。' }),
  duanchang: card({ id: 'duanchang', name: '斷腸', rarity: 'uncommon', kind: 'attack', tag: '針', cost: 1, bleed: 6, flavor: '這根針，到天亮才會讓{foe}疼得打滾。' }),
  fengxue: card({ id: 'fengxue', name: '封穴', rarity: 'uncommon', kind: 'skill', tag: '針', cost: 1, expose: true, bleed: 3, flavor: '你的針封住了{foe}的一處要穴。' }),
  yebuxie: card({ id: 'yebuxie', name: '夜雨不歇', rarity: 'rare', kind: 'skill', tag: '針', cost: 2, bleedMult: 3, flavor: '雨下了一整夜。{foe}身上的每一個針眼都在發作。' }),

  // ---- 醫術 ----
  yunqi: card({ id: 'yunqi', name: '運氣療傷', kind: 'skill', tag: '氣', cost: 1, heal: 6, exhaust: true, flavor: '你退開半步，一口真氣在胸口轉了一圈，疼得輕了些。' }),
  jinchuang: card({ id: 'jinchuang', name: '金創藥', kind: 'skill', tag: '藥', cost: 1, heal: 8, exhaust: true, flavor: '你抽空往傷口上抹了一把藥。' }),

  // ---- 傷與心魔 ----
  wound: card({ id: 'wound', name: '傷', kind: 'curse', cost: 0, onDraw: { energy: 1, hp: 2 }, flavor: '舊傷一陣抽痛，手上慢了半拍。' }),
  demon: card({ id: 'demon', name: '心魔', kind: 'curse', cost: 0, onDraw: { hp: 3 }, flavor: '你的心裡忽然一亂，一口真氣走岔了。' }),

  // ---- 特殊牌 ----
  dudiao: card({
    id: 'dudiao', name: '獨釣寒江', rarity: 'rare', kind: 'attack', tag: '劍', cost: 3, dmg: 24, exhaust: true,
    flavor: '沈孤舟信裡的那一式。天地間只剩一江寒水，和你的一劍。',
  }),
};

/** 每門 8 張：前四張凡（前三張是入門挑選的範圍）、三張良、一張絕。 */
export const skillCards: Record<string, string[]> = {
  changquan: ['chongquan', 'zhama', 'lianhuan', 'zanquan', 'tiequan', 'shoushi', 'paoquan', 'yiqi'],
  hanjiang: ['hanjiang1', 'xietiao', 'diaoxue', 'hanyu', 'jiangxin', 'yezhou', 'gujian', 'qianshan'],
  shoucheng: ['juma', 'huima', 'tuqiang', 'zhenshou', 'qiangzhen', 'fanji', 'tiebi', 'huitian'],
  liuyun: ['shanshen', 'raobu', 'feiyan', 'zhuiyun', 'tayun', 'yunzhong', 'huanying', 'wuying'],
  shijing: ['satu', 'ditang', 'saotui', 'dingtou', 'baoshuai', 'luanquan', 'shuaiwan', 'gundi'],
  shibi: ['wufeng', 'jianyi', 'bihen', 'jingzuo', 'canjian', 'duanjian', 'jianxin', 'kaishan'],
  qinghen: ['qhqi', 'liancheng', 'qhcheng', 'qhshou', 'hanyi', 'qhzhuan', 'qhluo', 'shisan'],
  yeyu: ['yeyuzhen', 'wusheng', 'xiyu', 'mengyu', 'tougu', 'duanchang', 'fengxue', 'yebuxie'],
};

/** 獎勵池裡不分門派的奇招（設計文件 v0.5 §5）。 */
export const commonCards: string[] = [
  'breathe', 'xieli', 'jieli', 'xuhuang', 'pinming', 'kanpo', 'tiebushan', 'liusanfen', 'tingshen', 'zhouxuan', 'juechu', 'cangfeng',
  'bengong', 'zuibu', 'yunqi',
];

/** v0.4 的奇遇牌。v0.5 起改由事件直接加進牌庫，這張表只用來換算舊存檔。 */
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
  drain: '他的手指併攏，盯著你身上的穴道。',
  enrage: '他的臉漲紅了，像是被激怒了。',
  heal: '他往後退了半步，想喘口氣。',
  curse: '他的兵刃上泛著一層奇怪的光。',
  ...t,
});

export const opponents: Record<string, OpponentDef> = {
  scar_young: {
    id: 'scar_young', name: '疤臉', who: 'scar', level: 1, wuxing: 4, temper: 'brute', traps: ['fanshou'],
    tells: tells({ attack: '他把刀舉過頭頂，想一刀劈死你。', combo: '他的刀亂劈亂砍，毫無章法，卻又快又狠。' }),
  },
  tourney: {
    id: 'tourney', name: '擂台上的對手', level: { relative: 0, min: 1, max: 4 }, wuxing: 5, temper: 'guard',
    tells: tells({ guard: '他抱拳守住門戶，一副不急不躁的樣子。' }),
  },
  rival: {
    id: 'rival', name: '{rival}', who: 'rival', level: { relative: -1, min: 1, max: 3 }, wuxing: 4, temper: 'brute', traps: ['weiou'],
    tells: tells({ attack: '他咬著牙，一拳就朝你臉上招呼過來。', guard: '他往打手身後一縮。' }),
  },
  senior: {
    id: 'senior', name: '同門師兄', level: { relative: 0, min: 1, max: 5 }, wuxing: 6, temper: 'guard', specials: { drain: 0.5 },
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
    id: 'bodyguard', name: '目標的護衛', level: { relative: 0, min: 1, max: 4 }, wuxing: 6, temper: 'guard', hpMult: 0.78, traps: ['tiebu'], lethal: true,
    tells: tells({ guard: '護衛把主人擋在身後，寸步不讓。' }),
  },
  lunwu_wanderer: {
    id: 'lunwu_wanderer', name: '江湖客', level: { relative: -1, min: 1, max: 4 }, wuxing: 5, temper: 'brute',
    tells: tells({ attack: '他把刀舉過肩，一副要硬碰硬的樣子。' }),
  },
  rival_lunwu: {
    id: 'rival_lunwu', name: '{rival}', who: 'rival', level: { relative: 0, min: 2, max: 4 }, wuxing: 5, temper: 'veteran',
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
    id: 'xie_lingshuang', name: '謝凌霜', who: 'xie_lingshuang', level: 3, wuxing: 9, temper: 'veteran', specials: { drain: 1 }, phase2: { line: '寒衣。', specials: { drain: 2 }, traps: ['shuangjiang'] }, traps: ['huijian', 'shuangjiang'],
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
  // ---- 路上的小戰（設計文件 v0.5 §1.2、§6）----
  kid_bully: {
    id: 'kid_bully', name: '巷口的孩子王', level: 0, wuxing: 3, temper: 'brute',
    tells: tells({ attack: '他擼起袖子，一拳就要揮過來。', guard: '他抱著頭往後縮。', charge: '他吸了一大口氣，臉漲得通紅。' }),
  },
  deserters: {
    id: 'deserters', name: '潰兵', level: { relative: -1, min: 0, max: 4 }, wuxing: 3, temper: 'brute',
    tells: tells({ attack: '他掄起一把缺了口的刀，眼睛都紅了。', combo: '幾個潰兵亂哄哄地撲了上來。' }),
  },
  bandits: {
    id: 'bandits', name: '山賊', level: { relative: -1, min: 0, max: 4 }, wuxing: 4, temper: 'veteran', specials: { enrage: 0.5 },
    tells: tells({ feint: '帶頭的山賊吹了聲口哨，林子裡好像還有人。', charge: '山賊們慢慢圍了上來。' }),
  },
  smugglers: {
    id: 'smugglers', name: '私鹽販子', level: { relative: -1, min: 1, max: 4 }, wuxing: 5, temper: 'veteran', specials: { curse: 1 }, traps: ['fanshou'],
    tells: tells({ feint: '他一手按著鹽袋，一手在袖子裡摸著什麼。' }),
  },
  constables: {
    id: 'constables', name: '官差', level: { relative: -1, min: 1, max: 4 }, wuxing: 4, temper: 'guard', specials: { drain: 1 }, traps: ['yuanbing'],
    tells: tells({ guard: '官差們橫著鐵尺，把路堵住了。', attack: '一個官差抖開鐵鍊就朝你套過來。' }),
  },
  mongol_scout: {
    id: 'mongol_scout', name: '蒙古遊騎', level: { relative: -1, min: 1, max: 5 }, wuxing: 5, temper: 'brute', traps: ['huishen'],
    tells: tells({ attack: '他在馬上彎弓搭箭。', combo: '他撥馬繞著你轉，箭一支接一支。', guard: '他撥馬拉開了距離。' }),
  },
  // ---- 精英 ----
  bandit_chief: {
    id: 'bandit_chief', name: '黑風寨的寨主', level: { relative: 0, min: 1, max: 5 }, wuxing: 6, temper: 'veteran', specials: { enrage: 1.5 }, hpMult: 0.75, traps: ['fanshou'],
    tells: tells({ attack: '他把鬼頭刀往肩上一扛，咧嘴笑了。', feint: '他的刀尖晃來晃去，像在逗你。' }),
  },
  xueyi_assassin: {
    id: 'xueyi_assassin', name: '血衣樓的刺客', level: { relative: 0, min: 1, max: 5 }, wuxing: 7, temper: 'veteran', specials: { curse: 1.5, drain: 1 }, hpMult: 0.75, traps: ['huijian'],
    tells: tells({ attack: '他手裡的短刃反著握，貼在小臂上。', feint: '他的身形一晃，好像同時從兩邊過來。', charge: '他屏住了呼吸，連影子都不動了。' }),
  },
  mongol_centurion: {
    id: 'mongol_centurion', name: '蒙古百夫長', level: { relative: 0, min: 2, max: 5 }, wuxing: 6, temper: 'guard', specials: { enrage: 1.5 }, hpMult: 0.75, traps: ['yuanbing'],
    tells: tells({ guard: '他身後的騎兵排成了一列。', attack: '他舉起了彎刀。' }),
  },
  fallen_swordsman: {
    id: 'fallen_swordsman', name: '落魄劍客', level: { relative: 0, min: 1, max: 5 }, wuxing: 7, temper: 'veteran', specials: { heal: 1, drain: 1 }, hpMult: 0.75, traps: ['huijian'],
    tells: tells({ attack: '他的劍很舊，握劍的手卻很穩。', guard: '他垂著劍，像是根本懶得出手。' }),
  },
  // ---- 章末首領（§1.1）----
  rival_boss: {
    id: 'rival_boss', name: '{rival}', who: 'rival', level: { relative: 0, min: 1, max: 4 }, wuxing: 5, temper: 'veteran', specials: { enrage: 1 }, phase2: { line: '我不會再輸給你了！', temper: 'brute', rage: 3 }, traps: ['weiou', 'fanshou'],
    tells: tells({ attack: '他這幾年練得很苦，拳頭比從前硬多了。', feint: '他嘴上罵著，眼睛卻在找你的破綻。' }),
  },
  town_champion: {
    id: 'town_champion', name: '連守七場的擂主', level: { relative: 0, min: 1, max: 4 }, wuxing: 6, temper: 'guard', specials: { heal: 1 }, phase2: { line: '好，那我也不留手了。', temper: 'veteran', traps: ['fanshou'] }, traps: ['tiebu'],
    tells: tells({ guard: '他穩穩站在擂台中央，等你過去。' }),
  },
  sect_champion: {
    id: 'sect_champion', name: '同門裡的第一人', level: { relative: 0, min: 2, max: 5 }, wuxing: 7, temper: 'guard', specials: { drain: 1 }, phase2: { line: '師父沒教過你這一招吧？', temper: 'veteran', traps: ['huijian'] }, traps: ['huijian'],
    tells: tells({ guard: '他的架勢一絲不亂，是師父手把手教出來的。' }),
  },
  escort_robber: {
    id: 'escort_robber', name: '劫鏢的賊首', level: { relative: 0, min: 2, max: 5 }, wuxing: 6, temper: 'veteran', specials: { curse: 1 }, phase2: { line: '兄弟們，一起上！', specials: { curse: 1, enrage: 1.5 } }, traps: ['weiou', 'fanshou'],
    tells: tells({ feint: '他吹了一聲口哨，兩邊的林子裡都有了動靜。' }),
  },
  famous_blade: {
    id: 'famous_blade', name: '成名的刀客', level: { relative: 0, min: 2, max: 5 }, wuxing: 7, temper: 'veteran', specials: { enrage: 1 }, phase2: { line: '你逼我拔出第二把刀。', temper: 'brute', rage: 4 }, traps: ['tiebu'],
    tells: tells({ attack: '他的刀還在鞘裡，殺氣已經到了。' }),
  },
  mongol_chiliarch: {
    id: 'mongol_chiliarch', name: '蒙古千夫長', level: { relative: 0, min: 2, max: 5 }, wuxing: 7, temper: 'guard', specials: { enrage: 1 }, phase2: { line: '放箭！', specials: { enrage: 1.5, curse: 1 } }, hpMult: 0.78, lethal: true, traps: ['yuanbing', 'huishen'],
    tells: tells({ guard: '他身後是一整列騎兵。', attack: '他舉起了彎刀，騎兵們跟著發出了吼聲。' }),
  },
  scar_boss: {
    id: 'scar_boss', name: '疤臉', who: 'scar', level: { relative: 0, min: 2, max: 5 }, wuxing: 6, temper: 'veteran', specials: { curse: 1 }, phase2: { line: '當年我也是這樣殺了你爹的。', temper: 'brute', rage: 4 }, hpMult: 0.78, lethal: true, traps: ['fanshou', 'tiebu'],
    tells: tells({ feint: '他的刀尖低垂，看起來破綻百出，像是故意的。', attack: '他咧開嘴，那道疤跟著扭了起來。' }),
  },
  zhou_son: {
    id: 'zhou_son', name: '周家的兒子', level: { relative: 0, min: 1, max: 5 }, wuxing: 6, temper: 'brute', specials: { enrage: 1 },
    tells: tells({ attack: '他握棍的手指節發白，像是把這一下練了十年。', enrage: '他咬著牙，眼眶紅了。' }),
  },
  manual_fiend: {
    id: 'manual_fiend', name: '練殘卷的魔頭', level: { relative: 1, min: 2, max: 5 }, wuxing: 7, temper: 'brute', specials: { drain: 1 }, hpMult: 0.9,
    tells: tells({ attack: '他周身的氣脈逆著走，出手的路數邪得讓人頭皮發麻。', drain: '他的指尖泛著青黑色。' }),
  },
  young_challenger: {
    id: 'young_challenger', name: '上門挑戰的年輕人', level: { relative: 0, min: 1, max: 5 }, wuxing: 7, temper: 'brute', specials: { enrage: 1 }, phase2: { line: '前輩，晚輩要拚命了！', rage: 3 },
    tells: tells({ attack: '他出手又快又急，像當年的你。' }),
  },
  wumian: {
    id: 'wumian', name: '無面客', who: 'wumian', level: { relative: 0, min: 2, max: 5 }, wuxing: 9, temper: 'veteran', lethal: true, hpMult: 0.85,
    traps: ['huijian'], specials: { curse: 1.5, drain: 1 },
    phase2: { line: '……', specials: { curse: 2, drain: 1.5 }, rage: 3 },
    tells: tells({
      attack: '白面具後面沒有聲音。他的刀已經不在鞘裡了。',
      curse: '他的指縫間有幾點寒光。',
      drain: '他的手指像一條蛇，朝你的穴道遊了過來。',
      feint: '你分不清哪一個影子才是他。',
    }),
  },
  scar_old: {
    id: 'scar_old', name: '疤臉', who: 'scar', level: 2, wuxing: 6, temper: 'veteran', specials: { curse: 1 }, phase2: { line: '你跟你爹一樣，都不知道什麼時候該逃。', temper: 'brute', rage: 3 }, hpMult: 0.78, lethal: true, traps: ['fanshou', 'tiebu'],
    tells: tells({ feint: '他的刀尖低垂，看起來破綻百出，像是故意的。' }),
  },
  bater: {
    id: 'bater', name: '巴特爾', who: 'bater', level: 3, wuxing: 7, temper: 'veteran', phase2: { line: '你是我遇過最難纏的人。', temper: 'brute', rage: 3 }, hpMult: 0.78, lethal: true, traps: ['huishen'],
    tells: tells({
      attack: '他把弓拉成了滿月。',
      combo: '他從箭袋裡一次抽出了三支箭。',
      guard: '他撥馬退開，拉開了距離。',
      charge: '他屏住呼吸，箭尖一動也不動地對著你。',
      feint: '他的箭在你和你身後的人之間來回游移。',
    }),
  },
};
