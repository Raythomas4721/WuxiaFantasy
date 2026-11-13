// 自創武學與開宗立派的資料：弟子的出身與品性、門規、取名的素材、自創絕招、江湖上關於你的傳聞。
// 規則在 engine/school.ts。數值改了要跑 npm run simulate。

import type { Condition } from '../engine/types';

/** 出身：看得到。影響學得快慢、入門的禮、門派的進帳。 */
export interface DiscipleBirth {
  id: string;
  name: string;
  desc: string;
  weight: number;
  /** 學藝快慢的加減（1 是一年算一年）。 */
  learn: number;
  /** 根骨上限（體弱的人）。 */
  genguMax?: number;
  /** 拜師那天的樣子；{name} 是弟子的名字。 */
  origin: string[];
}

export const DISCIPLE_BIRTHS: Record<string, DiscipleBirth> = {
  rich: {
    id: 'rich',
    name: '大富大貴',
    desc: '入門帶一份厚禮，往後年年有孝敬，門派的進帳也跟著多；只是吃不了苦，學得慢一點。',
    weight: 2,
    learn: -0.15,
    origin: [
      '{name}是坐著轎子來的，身後跟著兩個挑禮的家丁。',
      '{name}穿的那件袍子，夠尋常人家吃一年。他說家裡開了三間當鋪。',
    ],
  },
  poor: {
    id: 'poor',
    name: '寒門',
    desc: '尋常人家的孩子。',
    weight: 5,
    learn: 0,
    origin: [
      '{name}是莊稼人的孩子，進門先把院子掃了一遍，才來給你磕頭。',
      '{name}是挑柴的，一擔柴少說一百五十斤，他挑上山來，臉不紅氣不喘。',
      '{name}的爹是你從前救過的人。他說，爹臨死前交代，要他來給你磕頭。',
    ],
  },
  orphan: {
    id: 'orphan',
    name: '孤兒',
    desc: '無家可歸，師門就是他的家。學得比誰都勤。',
    weight: 3,
    learn: 0.15,
    origin: [
      '{name}是在山門外的石階上睡了三夜，才被守門的弟子發現的。',
      '{name}說自己是在街上長大的。他的手上全是繭，指節上有疤。',
    ],
  },
  scholar: {
    id: 'scholar',
    name: '書香門第',
    desc: '讀過書，懂道理，下山以後替門派結交了不少人。',
    weight: 2,
    learn: 0,
    origin: [
      '{name}背著一箱書上山，說是考了三次州試都沒中，想換條路走。',
      '{name}一見面就把你這些年的事說了一遍，比你自己記得還清楚。',
    ],
  },
  sickly: {
    id: 'sickly',
    name: '體弱多病',
    desc: '身子骨弱，根骨好不到哪裡去。師父要是懂醫術，能把他調理好；不懂的話，可能留不住。',
    weight: 2,
    learn: 0,
    genguMax: 5,
    origin: [
      '{name}說話說到一半就咳了起來，可是你讓他背的口訣，他聽一遍就背下來了。',
      '{name}是被他娘背上山的。他娘說，大夫說這孩子活不過二十，只求你收下他。',
    ],
  },
};

/** 品性：跟根骨無關。有些藏著，看起來是另一個樣子，要師父有眼光才看得穿。 */
export interface DiscipleCharacter {
  id: string;
  name: string;
  desc: string;
  weight: number;
  /** 學藝快慢的倍數。 */
  learnMult: number;
  /** 藏著的品性：看起來是 cover，see 是看得穿要的屬性。 */
  hidden?: { cover: string; hint: string; see: { stat: 'wuxing' | 'meili' | 'xinxing'; at: number }[] };
}

export const DISCIPLE_CHARACTERS: Record<string, DiscipleCharacter> = {
  respectful: {
    id: 'respectful',
    name: '尊師重道',
    desc: '一輩子不會離開師門。出師以後會留下來，幫你帶師弟。',
    weight: 3,
    learnMult: 1,
  },
  ordinary: {
    id: 'ordinary',
    name: '安分守己',
    desc: '不惹事，也不出挑。',
    weight: 5,
    learnMult: 1,
  },
  fickle: {
    id: 'fickle',
    name: '朝三暮四',
    desc: '心定不下來。今年拜你為師，明年可能就去拜別人了。',
    weight: 2,
    learnMult: 1.1,
  },
  lazy: {
    id: 'lazy',
    name: '不學無術',
    desc: '根骨再好也不肯練。放著不管，可能一輩子出不了師；管得動的話，是另一回事。',
    weight: 2,
    learnMult: 0.35,
  },
  violent: {
    id: 'violent',
    name: '好勇鬥狠',
    desc: '打起架來比誰都兇，替門派接戰的時候用得上；只是常在山下惹事，仇家會找上門。',
    weight: 2,
    learnMult: 1,
  },
  liar: {
    id: 'liar',
    name: '顛倒黑白',
    desc: '嘴甜，替門派拉來不少人；可是他會在你面前搬弄是非，害老實的師兄弟被趕走。',
    weight: 2,
    learnMult: 1,
    hidden: { cover: '能說會道', hint: '他的話好聽得有點過頭。', see: [{ stat: 'meili', at: 9 }, { stat: 'xinxing', at: 10 }] },
  },
  treacherous: {
    id: 'treacherous',
    name: '心術不正',
    desc: '學得比誰都快。他想要的不是你的功夫，是你的位子。',
    weight: 2,
    learnMult: 1.3,
    hidden: { cover: '勤奮好學', hint: '他問的，都是你還沒教的東西。', see: [{ stat: 'wuxing', at: 9 }] },
  },
};

/** 舊存檔的弟子只有一個特質：換算成出身和品性。 */
export const LEGACY_TRAITS: Record<string, { birth: string; character: string }> = {
  rich: { birth: 'rich', character: 'ordinary' },
  gifted: { birth: 'poor', character: 'respectful' },
  fickle: { birth: 'poor', character: 'fickle' },
  rebel: { birth: 'orphan', character: 'treacherous' },
  honest: { birth: 'poor', character: 'respectful' },
  eloquent: { birth: 'scholar', character: 'ordinary' },
  sickly: { birth: 'sickly', character: 'ordinary' },
};

export interface SchoolRuleDef {
  id: 'open' | 'strict' | 'city';
  name: string;
  /** 開宗時選門規的說明。 */
  desc: string;
  /** 每次開山門多來幾個人。 */
  extraCandidates: number;
  /** 出身、品性出現的倍數。 */
  birthMult: Partial<Record<string, number>>;
  characterMult: Partial<Record<string, number>>;
  /** 根骨的加減。 */
  gengu: number;
}

export const SCHOOL_RULES: Record<string, SchoolRuleDef> = {
  open: {
    id: 'open',
    name: '不問出身',
    desc: '誰來都收：窮人、孤兒、有前科的。來的人多，什麼樣的都有。',
    extraCandidates: 1,
    birthMult: { orphan: 2, sickly: 1.5, rich: 0.5 },
    characterMult: { violent: 1.5, treacherous: 1.3 },
    gengu: 0,
  },
  strict: {
    id: 'strict',
    name: '寧缺毋濫',
    desc: '只收好苗子。來的人少，根骨都不差；可是根骨好的人，心氣也高。',
    extraCandidates: -1,
    birthMult: { sickly: 0.2 },
    characterMult: { lazy: 1.5, treacherous: 1.5 },
    gengu: 2,
  },
  city: {
    id: 'city',
    name: '城在人在',
    desc: '門下弟子，國難當頭要下山。肯來的人都是有血性的，只是這樣的門派，總有人回不來。',
    extraCandidates: 0,
    birthMult: { rich: 0.5 },
    characterMult: { respectful: 2, violent: 1.5, fickle: 0.4, lazy: 0.5 },
    gengu: 1,
  },
};

/** 風雲榜上的新面孔：稱號與成名的方式。 */
export const STAR_TITLES = [
  '快刀', '白袍', '鐵掌', '青衫劍', '斷魂槍', '小孟嘗', '北地狂生', '無影腳', '雙鉤', '烏衣', '赤手', '一葦',
  '寒星', '鬼見愁', '笑面', '銀槍', '短笛', '鐵算盤', '霜刃', '踏雪',
];

export const STAR_DEEDS = [
  '一年之內挑了七家武館，沒有一家撐過十招。',
  '在漢水邊一個人擋住了一夥潰兵，第二天就傳遍了三個州。',
  '上了青冥山，跟謝凌霜過了三十招才落敗。下山時，沒有人敢笑他。',
  '在蒙古人的營外待了三天，帶回來一個被擄走的知府。',
  '單人匹馬上了一座山寨，下山時身後跟著一百多個放下了刀的人。',
  '說是哪一派都不收他，他就一家一家地打過去。',
];

/** 武學取名的素材：意象（依經歷）＋兵器字＋字尾。 */
export const ART_IMAGERY: { if?: Condition; words: string[] }[] = [
  { if: { flags: ['defended_city'] }, words: ['孤城', '不退', '城頭'] },
  { if: { flags: ['at_yashan'] }, words: ['滄海', '崖山', '潮生'] },
  { if: { flags: ['ran_blockade'] }, words: ['破浪', '渡江'] },
  { if: { flags: ['beat_he'] }, words: ['斷纓'] },
  { if: { flags: ['heard_he'] }, words: ['斷纓'] },
  { if: { flags: ['wuyan_spoke'] }, words: ['啞鐘', '洗心'] },
  { if: { flags: ['revenge_done'] }, words: ['血痕', '了恩'] },
  { if: { flags: ['bandit_lord'] }, words: ['黑風', '橫山'] },
  { if: { sects: ['xueyi'] }, words: ['無面', '夜雨'] },
  { if: { flags: ['read_shen_letter'] }, words: ['寒江', '獨釣'] },
  { if: { maxAlignment: -30 }, words: ['修羅', '血衣'] },
  { if: { minChivalry: 40 }, words: ['俠骨', '赤心'] },
  { words: ['歸一', '無名', '逍遙', '雲水', '問心', '長河', '孤鴻', '晚照'] },
];

/** 主修武學的路數 → 武學名裡的兵器字。 */
export const ART_WEAPON: Record<string, string[]> = {
  劍: ['劍', '劍法', '劍訣'],
  槍: ['槍', '槍法'],
  拳: ['拳', '拳譜'],
  步: ['步', '身法'],
  針: ['針', '針訣'],
  指: ['指', '指法'],
  氣: ['功', '心法', '掌'],
  守: ['功', '樁'],
};

export const SCHOOL_SUFFIX = ['門', '派', '堂', '莊', '館', '宗'];

/** 主修路數 → 自創的絕招。 */
export const ART_ULTS: Record<string, string> = {
  劍: 'art_jian',
  槍: 'art_qiang',
  拳: 'art_quan',
  步: 'art_bu',
  針: 'art_zhen',
  指: 'art_zhi',
  氣: 'art_qi',
  守: 'art_qi',
};

/** 江湖上關於你的傳聞：{renown} 是你的名號（還沒有名號時是「姓某的那個人」），{art}、{school} 是你的武學與門派。 */
export const DEED_RUMORS: { id: string; if: Condition; text: string }[] = [
  { id: 'd_art', if: { flags: ['own_art'] }, text: '茶館裡有人在爭：「{art}」到底是哪一家的功夫？有人說是{renown}自己悟出來的，馬上有人搖頭：自己悟出一門功夫？那是宗師才做得到的事。' },
  { id: 'd_school', if: { flags: ['founded_sect'] }, text: '聽說{renown}開了山門，叫「{school}」。山門外排隊拜師的人，從石階一直排到了山腳。' },
  { id: 'd_school_big', if: { flags: ['founded_sect'], flagMin: { school_fame: 50 } }, text: '各派掌門議事，頭一回給「{school}」也留了一把椅子。有老掌門不服，散會時卻是第一個去跟{renown}敬酒的。' },
  { id: 'd_star', if: { flags: ['school_star'] }, text: '江湖上冒出一個後生，一連挑了三家武館。人家問他師承，他只說了兩個字：「{school}」。' },
  { id: 'd_he', if: { flags: ['beat_he'] }, text: '襄陽城頭的老兵喝醉了，就會說那一天：一個人出城，削斷了斷纓槍的紅纓。說書人說那人是{renown}，老兵說他沒看清臉。' },
  { id: 'd_pao', if: { flags: ['burned_trebuchets'] }, text: '聽說蒙古人那幾座巨砲，是被一夥不要命的人夜裡燒掉的。帶頭的，有人說是{renown}。' },
  { id: 'd_blockade', if: { flags: ['ran_blockade'] }, text: '漢水上的船家都說，那一夜衝進襄陽的頭船上，站著一個不要命的人。有人說是{renown}，有人說是個撐船的女人。也許兩個都在。' },
  { id: 'd_wumian', if: { flags: ['wumian_defeated'] }, text: '聽說血衣樓的無面客，面具被人打碎了。江湖上一下子少了很多人睡不著覺。據說動手的是{renown}。' },
  { id: 'd_lunwu', if: { flags: ['lunwu_champion'] }, text: '青冥台上那塊奪魁的木牌，這一屆刻的是{renown}的名字。刻字的老匠人說，刻到一半手抖了一下，所以那個字有點歪。' },
  { id: 'd_bandit', if: { flags: ['bandit_lord'] }, text: '黑風寨換了寨主。商隊過山時都在說，新寨主是個叫{renown}的人，收錢公道，不收錢的時候，比老寨主還狠。' },
  { id: 'd_xueyi', if: { flags: ['xueyi_lord'] }, text: '有人說江湖上有兩個無面客。也有人說，那第二個，原本是個有名有姓的人。' },
  { id: 'd_walls', if: { flags: ['funded_defense_big'] }, text: '襄陽城頭新起的那道女牆，磚上刻了捐錢的人名。排在最前面的，是{renown}。' },
  { id: 'd_temple', if: { flags: ['held_temple_gate'] }, text: '山裡的人說，苦竹寺的山門那天沒有破，是因為有個人跟啞鐘和尚一起站在石階上。那人是誰，寺裡的和尚都不肯說。' },
  { id: 'd_traitor', if: { flags: ['traitor_out'], notFlags: ['usurper_defeated', 'usurped'] }, text: '江湖上冒出一個人，自稱是「{art}」的正宗傳人，說他師父老了、糊塗了。這話傳到你耳朵裡的時候，已經傳了三個州。' },
  { id: 'd_usurper', if: { flags: ['usurper_defeated'] }, text: '聽說{renown}親手清理了門戶。說書的講到逆徒倒在山門石階上那一段，茶館裡沒有一個人出聲。' },
  { id: 'd_stars', if: { flagMin: { stars_beaten: 2 } }, text: '風雲榜上的後生，一個接一個去找{renown}，一個接一個回來。回來的人都說同一句話：榜上排的，太保守了。' },
  { id: 'd_motou', if: { maxAlignment: -45, minFame: 22 }, text: '鎮上的孩子不睡覺，大人就說：「再哭，{renown}來了。」孩子馬上就不哭了。' },
];
