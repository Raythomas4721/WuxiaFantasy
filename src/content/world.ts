// 世界設定：出身、地區、特質、方針、武學、門派、人物。全部為原創或真實歷史。

import type { BackgroundDef, FocusDef, NpcDef, RegionDef, SectDef, SkillDef, TraitDef } from '../engine/types';
import { add, chiv, danshi, fame, fuyuan, gengu, health, meili, money, rel, train, wuxing, xinxing, xp } from './dsl';

export const backgrounds: Record<string, BackgroundDef> = {
  farmer: {
    id: 'farmer',
    name: '農家子弟',
    origin: '一戶農家',
    desc: '根骨與心性較好，金錢與人脈少。',
    statMods: { gengu: 2, xinxing: 1 },
    money: 10,
    // 亂世裡農家最多。
    weight: 2,
  },
  merchant: {
    id: 'merchant',
    name: '商賈之家',
    origin: '一戶商賈人家',
    desc: '有錢、有人脈，常隨商隊走南闖北。',
    statMods: { meili: 2, fuyuan: 1 },
    money: 120,
  },
  physician: {
    id: 'physician',
    name: '醫者之家',
    origin: '一戶行醫的人家',
    desc: '自幼辨藥識脈，心性沉穩，武學資源少。',
    statMods: { xinxing: 1, wuxing: 1 },
    money: 40,
    effects: [xp('baicao', 2)],
  },
};

export const regions: Record<string, RegionDef> = {
  jiangnan: { id: 'jiangnan', name: '江南', place: '江南嘉興', desc: '富庶繁華，商旅往來，文風鼎盛。' },
  xiangyang: { id: 'xiangyang', name: '襄陽', place: '襄陽', desc: '漢水邊的邊防重鎮，兵荒馬亂，俠客雲集。' },
  shu: { id: 'shu', name: '川蜀', place: '川蜀', desc: '山高林深，藥材豐饒，濟世藥谷就在這裡。' },
};

export const traits: Record<string, TraitDef> = {
  guomu: { id: 'guomu', name: '過目不忘', desc: '讀書、識藥、看招都學得比別人快。', effects: [wuxing(2)] },
  jingu: { id: 'jingu', name: '筋骨強健', desc: '天生一副好身板，吃得起苦。', effects: [gengu(2)] },
  jinshen: { id: 'jinshen', name: '天性謹慎', desc: '凡事三思，不輕易涉險。', effects: [xinxing(1), danshi(-1), health(5)] },
  qingyi: { id: 'qingyi', name: '重情重義', desc: '待人真誠，別人也願意以真心相待。', effects: [chiv(5), meili(1)] },
  linglong: { id: 'linglong', name: '八面玲瓏', desc: '說話得體，三教九流都能打交道。', effects: [meili(2)] },
  duochuan: { id: 'duochuan', name: '命途多舛', desc: '一生風波不斷，卻也總能絕處逢生。', effects: [fuyuan(-1), danshi(2)] },
  yili: { id: 'yili', name: '醫理天分', desc: '對草藥與脈象有種說不出的直覺。', effects: [xp('baicao', 2)] },
  bulu: { id: 'bulu', name: '不露鋒芒', desc: '不愛出頭，卻比誰都看得清楚。', effects: [xinxing(1), wuxing(1)] },
  yudun: { id: 'yudun', name: '天生愚鈍', desc: '學什麼都慢，但一旦學會就不會忘。', effects: [wuxing(-2), xinxing(3)] },
  haojiu: { id: 'haojiu', name: '好酒貪杯', desc: '三碗下肚，天下都是朋友。', effects: [meili(1), danshi(1)] },
  jiachuan: {
    id: 'jiachuan',
    name: '家傳藥方',
    desc: '家中藏著一本前人留下的醫書。（達成「妙手仁心」解鎖）',
    effects: [xp('baicao', 4), xinxing(1)],
    unlockedBy: 'renxin',
  },
  qianshi: {
    id: 'qianshi',
    name: '前世劍意',
    desc: '第一次握劍時，手竟然不覺得陌生。（達成「一代宗師」解鎖）',
    effects: [xp('hanjiang', 3), wuxing(1)],
    unlockedBy: 'zongshi',
  },
  guren: {
    id: 'guren',
    name: '故人信物',
    desc: '襁褓裡藏著一枚斷了半截的鐵槍頭。（達成「鐵骨丹心」解鎖）',
    effects: [danshi(2), fame(5)],
    unlockedBy: 'tiegu',
  },
};

export const skills: Record<string, SkillDef> = {
  changquan: { id: 'changquan', name: '長拳', kind: 'martial', desc: '鄉間武師都會的傳統拳法，紮根基用。' },
  hanjiang: { id: 'hanjiang', name: '寒江劍法', kind: 'martial', desc: '醉劍沈孤舟的劍法，出劍如寒江夜雨。' },
  liuyun: { id: 'liuyun', name: '流雲步', kind: 'martial', desc: '長風鏢局的輕功，走鏢逃命兩相宜。' },
  shoucheng: { id: 'shoucheng', name: '守城十八槍', kind: 'martial', desc: '襄陽義軍在城頭練出來的槍法，只求不退。' },
  shijing: { id: 'shijing', name: '市井十三拳', kind: 'martial', desc: '百衲會的拳路，招招都是街頭打架打出來的。' },
  shibi: { id: 'shibi', name: '石壁殘劍', kind: 'martial', desc: '深山石洞裡前人刻下的劍意，不知出自誰手。' },
  baicao: { id: 'baicao', name: '百草辨脈術', kind: 'medicine', desc: '辨藥、診脈、施針的醫術根基。' },
};

export const sects: Record<string, SectDef> = {
  changfeng: { id: 'changfeng', name: '長風鏢局', desc: '江南最大的鏢局，規矩是鏢在人在。', skill: 'liuyun' },
  yaogu: { id: 'yaogu', name: '濟世藥谷', desc: '川蜀深山中的醫家，谷主林鶴年人稱藥王。', skill: 'baicao' },
  yijun: { id: 'yijun', name: '襄陽義軍', desc: '鐵槍韓守義召集的民間義軍，守城也守人。', skill: 'shoucheng' },
  baina: { id: 'baina', name: '百衲會', desc: '乞丐與流民的互助會，亂世裡自己管自己。', skill: 'shijing' },
};

export const npcs: Record<string, NpcDef> = {
  shen_guzhou: {
    id: 'shen_guzhou',
    name: '沈孤舟',
    title: '醉劍',
    desc: '不屬任何門派的浪人劍客，終日醉醺醺，劍法卻快得看不清。從不收徒。',
    deathYear: 1270,
    presence: [{ from: 1235, to: 1270, regions: ['jiangnan', 'shu'] }],
    codex: true,
  },
  lin_henian: {
    id: 'lin_henian',
    name: '林鶴年',
    title: '藥王',
    desc: '濟世藥谷谷主。嘉熙年間川蜀大疫，他開谷救人，三天三夜沒合眼。',
    deathYear: 1278,
    presence: [{ from: 1228, to: 1278, regions: ['shu'] }],
    codex: true,
  },
  han_shouyi: {
    id: 'han_shouyi',
    name: '韓守義',
    title: '鐵槍',
    desc: '襄陽義軍統領，鐵塔似的漢子。他說：朝廷的兵守城牆，咱們守的是城裡的人。',
    deathYear: 1273,
    presence: [{ from: 1250, to: 1273, regions: ['xiangyang'] }],
    codex: true,
  },
  bater: {
    id: 'bater',
    name: '巴特爾',
    title: '白翎箭',
    desc: '蒙古神箭手，箭袋裡總插著一排白色的箭羽。',
    presence: [],
    codex: true,
  },
  lao_liao: {
    id: 'lao_liao',
    name: '老廖',
    title: '說書人',
    desc: '瞎了一隻眼的說書人，走遍天下茶館。他說：說書的，三分真七分假。',
    deathYear: 1295,
    presence: [{ from: 1228, to: 1295, regions: ['*'] }],
    codex: true,
  },
  ge_baina: {
    id: 'ge_baina',
    name: '葛百衲',
    title: '百衲翁',
    desc: '百衲會首領，穿著一身百衲衣的老乞丐。襄陽城裡一半的流民都聽他的。',
    deathYear: 1274,
    presence: [{ from: 1235, to: 1274, regions: ['xiangyang'] }],
    codex: true,
  },
  lu_ping: {
    id: 'lu_ping',
    name: '陸平',
    desc: '童年時在私塾外被人冤枉偷錢的少年。',
    presence: [],
    codex: false,
  },
  qin_yuan: { id: 'qin_yuan', name: '秦遠', desc: '在酒樓裡結識的游俠。', presence: [], codex: false },
  companion: { id: 'companion', name: '兒時玩伴', desc: '', presence: [], codex: false },
  rival: { id: 'rival', name: '宿敵', desc: '', presence: [], codex: false },
};

export const focuses: FocusDef[] = [
  // ---- 童年（7–12 歲）----
  {
    id: 'kid_study',
    name: '上私塾',
    desc: '跟著先生讀書識字。',
    childhood: true,
    tags: ['study'],
    growth: [{ effect: wuxing(1), chance: 0.5 }],
    summary: [
      '這兩年你在私塾讀書。先生搖頭晃腦念的那些句子，你已經能背上大半。',
      '你在私塾裡坐了兩年，學會了寫自己的名字，也學會了趁先生打瞌睡時偷看窗外。',
      '先生說你的字寫得像雞爪子，可你背書比誰都快。',
      '你每天提著書箱上學，路過河邊總要停下來看一會兒魚。',
    ],
  },
  {
    id: 'kid_play',
    name: '四處玩耍',
    desc: '和玩伴上山下河。',
    childhood: true,
    tags: ['social', 'village'],
    growth: [
      { effect: danshi(1), chance: 0.4 },
      { effect: meili(1), chance: 0.3 },
      { effect: rel('companion', 8) },
    ],
    summary: [
      '你和{companion}這兩年幾乎踏遍了附近每一座山頭、每一條河。',
      '你和{companion}在後山找到一個樹洞，把撿來的寶貝全藏在裡面。',
      '你跟著{companion}爬樹掏鳥窩，摔下來好幾次，膝蓋上的疤一直沒好。',
      '這兩年你是巷子裡的孩子王，{companion}是你的頭號跟班。',
    ],
  },
  {
    id: 'kid_help',
    name: '幫家裡做事',
    desc: '下田、看店或在藥鋪打下手。',
    childhood: true,
    tags: ['work', 'village', 'medicine'],
    growth: [
      { effect: gengu(1), chance: 0.4 },
      { effect: xinxing(1), chance: 0.3 },
      { effect: money(5) },
    ],
    summary: [
      {
        if: { backgrounds: ['physician'] },
        values: [
          '這兩年你在藥鋪裡打下手，切藥、碾藥、看火，手上總帶著一股藥香。',
          '你學會了包藥，一張紙、一根繩，包得方方正正。',
          '你幫著曬藥材，每次要下雨，總是你第一個衝出去收。',
        ],
      },
      {
        if: { backgrounds: ['merchant'] },
        values: [
          '這兩年你在鋪子裡幫忙招呼客人，算盤打得比帳房先生還快。',
          '你學會了看秤，誰想在秤桿上動手腳，你一眼就看得出來。',
          '你跟著夥計去碼頭點貨，一整船的貨數得清清楚楚。',
        ],
      },
      {
        if: { not: { backgrounds: ['physician', 'merchant'] } },
        values: [
          '這兩年你跟著大人下田，手上長了繭，個子也竄高了一截。',
          '你學會了插秧、放牛、看天色。大人說，你看雲比老農還準。',
          '農忙時你從早到晚泡在田裡，農閒時就幫著劈柴挑水。',
        ],
      },
    ],
  },
  {
    id: 'kid_martial',
    name: '偷偷練武',
    desc: '照著看來的招式自己比劃。',
    childhood: true,
    conditions: { any: [{ flags: ['saw_martial'] }, { minMartial: 1 }] },
    tags: ['martial'],
    growth: [{ effect: train('martial', 2) }, { effect: gengu(1), chance: 0.3 }],
    summary: [
      '你天天在後院對著柴堆比劃拳腳。大人們笑你，你也不在乎。',
      '你把木棍當劍、把柴堆當敵人，一個人在後院打得滿頭大汗。',
      '你偷偷在床底下藏了一根木棍，每天天沒亮就起來練。',
    ],
  },
  // ---- 十三歲以後 ----
  {
    id: 'study',
    name: '讀書',
    desc: '悟性增長，可能遇到書院與科舉的機會。',
    tags: ['study'],
    growth: [{ effect: wuxing(1), chance: 0.5 }],
    summary: [
      '這段日子你埋首書卷。窗外的世道越來越亂，書裡的道理卻越讀越明白。',
      '你抄完了一整部書，手腕痠得抬不起來。',
      '你在書院裡和同窗爭論了好幾夜，誰也說服不了誰。',
      '你讀到一句話，反覆想了好幾天，好像想通了什麼，又好像沒有。',
    ],
  },
  {
    id: 'martial',
    name: '習武',
    desc: '武學與根骨增長，容易遇到切磋與比武。',
    tags: ['martial', 'sparring'],
    growth: [{ effect: train('martial', 2) }, { effect: gengu(1), chance: 0.3 }],
    summary: [
      '你每天聞雞起舞，一套功夫翻來覆去練了上千遍。',
      '冬練三九，夏練三伏。你的手上、腳上，全是厚厚的繭。',
      '你在河邊練功，練到河對岸的漁夫都認得你了。',
      '你把一招拆成十招，再把十招合回一招。',
    ],
  },
  {
    id: 'work',
    name: '謀生',
    desc: '賺取錢財，磨練心性。',
    tags: ['work', 'village'],
    growth: [{ effect: money(20) }, { effect: xinxing(1), chance: 0.3 }],
    summary: [
      '這段日子你踏踏實實地做活，攢下了一點積蓄。',
      '你在碼頭扛了一陣子貨，肩膀上磨出了一層厚皮。',
      '你在鄰鎮的作坊做工，學會了一門手藝。',
      '日子過得平平淡淡，每天出門做活，天黑回家吃飯。',
    ],
  },
  {
    id: 'trade',
    name: '行商',
    desc: '走南闖北做買賣，有賺有賠。',
    conditions: { any: [{ backgrounds: ['merchant'] }, { minAge: 18 }] },
    tags: ['trade', 'travel'],
    growth: [{ effect: money(15) }, { effect: meili(1), chance: 0.3 }],
    summary: [
      '你跟著貨船走了幾趟，見識了不少地方，也學會了怎麼跟人討價還價。',
      '這一趟生意不賺不賠，倒是結識了幾個客商。',
      '你學會了看行情：哪裡缺糧、哪裡缺鹽，價錢就往哪裡跑。',
    ],
  },
  {
    id: 'travel',
    name: '遊歷',
    desc: '行走四方，可能遇見奇人奇事，也可以換個地方生活。',
    conditions: { minAge: 15 },
    tags: ['travel', 'tavern', 'chance'],
    growth: [{ effect: fuyuan(1), chance: 0.3 }, { effect: money(-5) }],
    summary: [
      '你背著包袱走了很遠的路。山川、渡口、客棧，一處一處都記在了心裡。',
      '你在一座不知名的小鎮住了一個月，走的時候，客棧老闆娘還塞給你兩個饅頭。',
      '你爬上一座高山，在山頂看了一整夜的星星。',
      '你走過被戰火燒過的村子，也走過歌舞昇平的城鎮。這世道，真是什麼樣子都有。',
    ],
  },
  {
    id: 'social',
    name: '結交',
    desc: '結識朋友，經營人情。',
    tags: ['social', 'tavern'],
    growth: [{ effect: meili(1), chance: 0.5 }, { effect: fame(1) }],
    summary: [
      '這段日子你結識了不少朋友，酒喝了不少，人情也欠了不少。',
      '你在茶樓裡認識了幾個說得上話的人，三天兩頭聚在一起。',
      '誰家有紅白喜事都會請你，你也總是到。',
    ],
  },
  {
    id: 'medicine',
    name: '行醫',
    desc: '精進醫術、救治病人。',
    conditions: { any: [{ minSkill: { baicao: 1 } }, { sects: ['yaogu'] }] },
    tags: ['medicine'],
    growth: [{ effect: train('medicine', 2) }, { effect: fame(1) }, { effect: add('healed', 1), chance: 0.3 }],
    summary: [
      '你背著藥箱走鄉串戶。認得你的人越來越多，叫你一聲大夫。',
      '你在破廟裡給窮人義診了一個月，藥錢都是自己貼的。',
      '你把這些年看過的病例整理成冊，越寫越厚。',
    ],
  },
  {
    id: 'sect',
    name: '師門事務',
    desc: '為門派辦事，精進門派武學。',
    conditions: { hasSect: true },
    tags: ['sect'],
    growth: [{ effect: train('sect', 2) }, { effect: add('sect_merit', 1), chance: 0.4 }],
    summary: [
      '你為{sect}奔走了一段日子，門裡的人越來越把你當自己人。',
      '門裡的大小事你都插得上手，同門有事也愛來找你商量。',
      '你在{sect}待得久了，連看門的老頭都會拉著你聊兩句。',
    ],
  },
  {
    id: 'rest',
    name: '休養',
    desc: '調養身體，遠離是非。',
    tags: ['rest'],
    growth: [{ effect: health(25) }, { effect: xinxing(1), chance: 0.3 }],
    summary: [
      '你閉門休養了一段日子。身子好了些，心也靜了些。',
      '你在院子裡種了幾盆花，每天看它們長一點點。',
      '你睡了很多覺，喝了很多茶，什麼也沒想。',
    ],
  },
];
