// 自創武學與開宗立派的資料：弟子的特質、門規、取名的素材、自創絕招、江湖上關於你的傳聞。
// 規則在 engine/school.ts。數值改了要跑 npm run simulate。

import type { Condition } from '../engine/types';

export interface DiscipleTrait {
  id: string;
  name: string;
  /** 收徒時看到的說明。 */
  desc: string;
  /** 藏著的特質：悟性不夠的師父看不穿，只看得到 cover 那個樣子。 */
  hidden?: { cover: string; hint: string };
  gengu: [number, number];
  weight: number;
  /** 拜師那天的樣子；{name} 是弟子的名字。 */
  origin: string[];
}

export const DISCIPLE_TRAITS: Record<string, DiscipleTrait> = {
  rich: {
    id: 'rich',
    name: '大富大貴',
    desc: '家裡有錢。拜師帶一份厚禮，往後年年有孝敬；只是吃不了苦，學得慢。',
    gengu: [2, 6],
    weight: 3,
    origin: [
      '{name}是坐著轎子來的，身後跟著兩個挑禮的家丁。',
      '{name}穿的那件袍子，夠尋常人家吃一年。他說家裡開了三間當鋪。',
    ],
  },
  gifted: {
    id: 'gifted',
    name: '根骨奇佳',
    desc: '天生練武的材料，學得比誰都快。出師那天，整個江湖都會知道你的門下出了人物。',
    gengu: [8, 10],
    weight: 2,
    origin: [
      '{name}在山門外的石階上跪了一夜，膝蓋底下的青石都濕了，人卻一點也不晃。',
      '{name}是挑柴的，一擔柴少說一百五十斤，他挑上山來，臉不紅氣不喘。',
    ],
  },
  fickle: {
    id: 'fickle',
    name: '朝三暮四',
    desc: '聰明，什麼都學得快，可是心定不下來。今年拜你為師，明年可能就去拜別人了。',
    gengu: [5, 8],
    weight: 3,
    origin: [
      '{name}一進門就把你的招式比劃了兩下，竟然有模有樣。他說前年在別派學過半年。',
      '{name}說話很快，眼睛一直在看你牆上掛的兵器。',
    ],
  },
  rebel: {
    id: 'rebel',
    name: '反骨',
    desc: '根骨好、心氣高，可是不服人。等他覺得學夠了，可能會帶著你的東西走。',
    hidden: { cover: '沉默寡言', hint: '他看你的眼神裡，好像藏著什麼。' },
    gengu: [6, 9],
    weight: 2,
    origin: [
      '{name}不太說話，問什麼答什麼。你讓他打一套拳，他打得乾淨利落。',
      '{name}說自己是孤兒，在街上長大的。他的手上全是繭，指節上有疤。',
    ],
  },
  honest: {
    id: 'honest',
    name: '忠厚老實',
    desc: '根骨平平，學得不快，可是一輩子不會離開師門。出師以後會留下來幫你帶師弟。',
    gengu: [3, 6],
    weight: 4,
    origin: [
      '{name}是莊稼人的孩子，進門先把院子掃了一遍，才來給你磕頭。',
      '{name}的爹是你從前救過的人。他說，爹臨死前交代，要他來給你當牛做馬。',
    ],
  },
  eloquent: {
    id: 'eloquent',
    name: '能說會道',
    desc: '武功一般，嘴上功夫一流。走到哪裡都替門派說好話，往後來拜師的人會變多。',
    gengu: [3, 6],
    weight: 3,
    origin: [
      '{name}一見面就把你這些年的事說了一遍，比你自己記得還清楚，還多了好幾段你沒做過的。',
      '{name}是說書人的徒弟，說膩了書，想來學點真本事。',
    ],
  },
  sickly: {
    id: 'sickly',
    name: '體弱多病',
    desc: '身子骨弱，可是悟性極高。師父要是懂醫術，能把他調理好；不懂的話，可能留不住。',
    gengu: [1, 4],
    weight: 2,
    origin: [
      '{name}說話說到一半就咳了起來，可是你讓他背的口訣，他聽一遍就背下來了。',
      '{name}是被他娘背上山的。他娘說，大夫說這孩子活不過二十，只求你收下他，讓他活得像個人。',
    ],
  },
};

export interface SchoolRuleDef {
  id: 'open' | 'strict' | 'city';
  name: string;
  /** 開宗時選門規的說明。 */
  desc: string;
  /** 每次開山門多來幾個人。 */
  extraCandidates: number;
  /** 各種特質出現的倍數。 */
  traitMult: Partial<Record<string, number>>;
  /** 根骨的加減。 */
  gengu: number;
}

export const SCHOOL_RULES: Record<string, SchoolRuleDef> = {
  open: {
    id: 'open',
    name: '不問出身',
    desc: '誰來都收：窮人、孤兒、有前科的。來的人多，什麼樣的都有。',
    extraCandidates: 1,
    traitMult: { honest: 1.5, sickly: 1.5, rebel: 1.5, rich: 0.5 },
    gengu: 0,
  },
  strict: {
    id: 'strict',
    name: '寧缺毋濫',
    desc: '只收好苗子。來的人少，根骨都不差。',
    extraCandidates: -1,
    traitMult: { gifted: 3, sickly: 0.2, rich: 0.5 },
    gengu: 2,
  },
  city: {
    id: 'city',
    name: '城在人在',
    desc: '門下弟子，國難當頭要下山。肯來的人都是有血性的，只是這樣的門派，總有人回不來。',
    extraCandidates: 0,
    traitMult: { honest: 2, fickle: 0.4, rich: 0.6 },
    gengu: 1,
  },
};

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
  { id: 'd_motou', if: { maxAlignment: -45, minFame: 22 }, text: '鎮上的孩子不睡覺，大人就說：「再哭，{renown}來了。」孩子馬上就不哭了。' },
];
