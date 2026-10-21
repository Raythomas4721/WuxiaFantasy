// 成年之後：恩怨、行醫、家庭、方針事件、晚年。

import type { GameEvent } from '../../engine/types';
import {
  add, align, ambition, chiv, danshi, fame, flag, fuyuan, gengu, goTo, health, later, meet, meili, money,
  rel, train, wuxing, xinxing, xp,
} from '../dsl';

export const adultEvents: GameEvent[] = [
  // ---- 恩怨 ----
  {
    id: 'revenge_chance',
    kind: 'normal',
    title: '疤臉',
    weight: 20,
    repeatable: true,
    cooldown: 5,
    maxTimes: 2,
    conditions: { minAge: 22, maxAge: 60, flags: ['blood_feud'], notFlags: ['revenge_done', 'feud_resolved'] },
    tags: ['feud'],
    text: [
      {
        if: { flags: ['revenge_failed'] },
        text: '你又找到了疤臉。他比上次更老了，背也駝了，正在路邊的茶攤上給孫子餵粥。',
      },
      { text: '多年以後，你在一家客棧裡又看見了那張臉。疤臉老了，鬢角花白，正笑呵呵地哄著膝上的一個孩子。他沒有認出你。' },
    ],
    choices: [
      {
        id: 'kill',
        text: '拔刀上前',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 7,
          martial: true,
          success: {
            text: '你一刀了結了他。四周一片尖叫，那孩子撲在他身上大哭。你走出門外，手一直在抖。',
            effects: [flag('revenge_done'), align(-10), fame(3)],
            recap: { weight: 5, text: '你終於殺了疤臉。他的孩子撲在他身上哭的樣子，你記了一輩子。' },
          },
          failure: {
            text: '疤臉雖老，刀法卻沒丟。你被砍中胸口，倒在血泊裡。他看著你，好像想起了什麼，最後丟下你走了。',
            effects: [health(-40), flag('revenge_failed')],
          },
        },
      },
      {
        id: 'let_go',
        text: '默默看了很久，轉身離開',
        outcome: {
          text: '你在角落坐到天黑，酒一口也沒喝。走出門時，你覺得肩上有什麼東西鬆開了。',
          effects: [flag('feud_resolved'), xinxing(2)],
          recap: { weight: 5, text: '你找到了殺父的仇人，卻在他孩子的笑聲裡放下了刀。' },
        },
      },
      {
        id: 'report',
        text: '暗中蒐集罪證，交給官府',
        check: {
          stats: ['wuxing'],
          difficulty: 6,
          success: {
            text: '你把他當年的罪證一件件交給了官府。秋後問斬那天，你沒有去看。',
            effects: [flag('revenge_done'), chiv(5), fame(2)],
            recap: { weight: 5, text: '你蒐集了疤臉當年的罪證，讓他在刑場上伏了法。' },
          },
          failure: {
            text: '官府收了他的銀子，案子不了了之。',
            effects: [flag('official_failed'), xinxing(-1)],
          },
        },
      },
    ],
  },
  {
    id: 'rival_ruin',
    kind: 'normal',
    title: '落魄',
    weight: 8,
    conditions: { minAge: 32, maxAge: 55, flags: ['rival_bully'] },
    tags: ['village', 'social'],
    text: '你在街角看見一個縮在破棉襖裡的乞丐，臉很眼熟。是{rival}。聽說他家的糧行在戰亂裡被搶光了，他爹也死了。',
    choices: [
      {
        id: 'feed',
        text: '給他一碗熱飯',
        outcome: {
          text: '他捧著碗，手抖得厲害，吃到一半忽然哭了。你什麼也沒說，在他碗裡又添了一勺。',
          effects: [chiv(5), xinxing(1), flag('forgave_rival')],
          recap: { weight: 2, text: '你在街角遇見落魄的{rival}，給了他一碗熱飯。他哭了。' },
        },
      },
      {
        id: 'ignore',
        text: '視而不見',
        outcome: { text: '你從他身邊走過。他也沒有抬頭。', effects: [flag('ignored_rival')] },
      },
      {
        id: 'mock',
        text: '笑他報應',
        outcome: {
          text: '你說了幾句難聽的話。說完了，心裡卻沒有想像中痛快。',
          effects: [align(-5), chiv(-3), flag('mocked_rival')],
        },
      },
    ],
  },
  // ---- 行醫 ----
  {
    id: 'heal_patient',
    kind: 'normal',
    title: '求醫',
    weight: 10,
    repeatable: true,
    cooldown: 2,
    maxTimes: 5,
    conditions: { minAge: 15, any: [{ minSkill: { baicao: 1 } }, { sects: ['yaogu'] }] },
    tags: ['medicine'],
    text: [
      { if: { minYear: 1268, regions: ['xiangyang'] }, text: '一個守城的兵被抬到你面前，大腿上插著半截箭，人已經燒得說不出話。' },
      { if: { flagMin: { healed: 3 } }, text: '天還沒亮，門外已經排了七八個人。最前面的是一個抱著發燒孩子的婦人，孩子的嘴唇已經發紫了。' },
      { text: '一個農婦抱著發燒的孩子跪在你面前。孩子的嘴唇已經發紫了。' },
    ],
    choices: [
      {
        id: 'free',
        text: '分文不取，全力醫治',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          skill: 'baicao',
          success: {
            text: '你守了一夜。天亮時，燒退了。後來每年，總有一籃雞蛋悄悄放在你的門口。',
            effects: [add('healed'), chiv(4), fame(3), xp('baicao', 1)],
          },
          failure: {
            text: '你用盡了所有辦法，還是沒能留住。你坐在門檻上，很久都沒有說話。',
            effects: [xinxing(1), flag('lost_patient')],
            recap: { weight: 1, text: '你第一次眼睜睜地看著病人死在自己手裡。' },
          },
        },
      },
      {
        id: 'paid',
        text: '收下診金再治',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          skill: 'baicao',
          success: { text: '人救回來了。你收下了診金，對方千恩萬謝。', effects: [add('healed'), money(25)] },
          failure: { text: '你沒能救回來。那筆診金，你原封不動地退了回去。', effects: [xinxing(1)] },
        },
      },
      {
        id: 'decline',
        text: '這病你沒把握，讓對方另請高明',
        outcome: { text: '對方哭著走了。你告訴自己，這樣做是對的。', effects: [flag('declined_patient')] },
      },
    ],
  },
  {
    id: 'poison_case',
    kind: 'normal',
    title: '奇毒',
    weight: 8,
    conditions: { minAge: 20, maxAge: 55, any: [{ sects: ['yaogu'] }, { minSkill: { baicao: 3 } }] },
    tags: ['medicine'],
    text: '鎮上一位鄉紳暴斃，臉色青黑。官府說是急病，他的家人卻不信，偷偷請你去看。你掀開白布，一眼就看出那是中毒。',
    choices: [
      {
        id: 'investigate',
        text: '追查下毒的人',
        check: {
          stats: ['wuxing'],
          difficulty: 7,
          skill: 'baicao',
          success: {
            text: '你從毒性一路追到藥鋪的帳本，揪出了下毒的人——是鄉紳的親姪子。消息傳開，人人都說你有一雙看得見真相的眼睛。',
            effects: [fame(8), chiv(5), flag('solved_poison')],
            recap: { weight: 2, text: '你識破了一樁偽裝成急病的毒殺案。' },
          },
          failure: {
            text: '你查到半路，自己也中了暗算，大病了一場。',
            effects: [health(-20), flag('poisoned_once')],
          },
        },
      },
      {
        id: 'tell',
        text: '照實告訴家屬，其餘不管',
        outcome: { text: '家屬謝過你，說剩下的事他們自己會處理。', effects: [xinxing(1), fame(2)] },
      },
      {
        id: 'bribe',
        text: '收下兇手塞來的錢，就說是急病',
        outcome: {
          text: '那包銀子沉甸甸的。夜裡，你夢見那張青黑的臉一直在看著你。',
          effects: [money(80), align(-15), chiv(-10), flag('took_bribe')],
          recap: { weight: 2, text: '你收了兇手的錢，替一樁命案閉上了眼睛。' },
        },
      },
    ],
  },
  // ---- 門派 ----
  {
    id: 'sect_duty',
    kind: 'normal',
    title: '師門差事',
    weight: 8,
    repeatable: true,
    cooldown: 3,
    maxTimes: 3,
    conditions: { minAge: 16, maxAge: 55, hasSect: true },
    tags: ['sect'],
    text: [
      { if: { sects: ['yaogu'] }, text: '藥谷今年的藥材在半路上被人截了，谷裡派你下山去追查。' },
      { if: { sects: ['changfeng'] }, text: '總鏢頭派你去教新來的趟子手扎馬步，還要你順便管管那幾個愛賭錢的。' },
      { if: { sects: ['yijun'] }, text: '韓守義派你去城北，修補被投石砸塌的一段城牆。' },
      { if: { sects: ['baina'] }, text: '葛百衲讓你去城南的流民棚，給新來的人分粥，順便看看有沒有鬧事的。' },
      { text: '門裡交給你一件差事。' },
    ],
    choices: [
      {
        id: 'diligent',
        text: '盡心盡力地辦好',
        outcome: { text: '事情辦得妥妥當當。門裡的老人們看你的眼神，又多了幾分信任。', effects: [add('sect_merit'), xinxing(1), fame(2)] },
      },
      {
        id: 'train',
        text: '一邊辦事，一邊偷空練功',
        outcome: { text: '差事辦得馬馬虎虎，功夫倒是長進了不少。', effects: [train('sect', 3)] },
      },
      {
        id: 'compete',
        text: '找同門比試，爭個高下',
        check: {
          stats: ['gengu'],
          difficulty: 6,
          martial: true,
          success: { text: '你贏了。同門們服氣地拍你的肩：「下回輪到你帶隊。」', effects: [fame(3), add('sect_merit')] },
          failure: { text: '你輸了，還扭傷了手腕。', effects: [health(-10), xinxing(1)] },
        },
      },
    ],
  },
  // ---- 家庭與人情 ----
  {
    id: 'parents_aging',
    kind: 'normal',
    title: '家書',
    weight: 10,
    conditions: { minAge: 24, maxAge: 45, not: { flags: ['father_dead', 'mother_dead'] }, notFlags: ['parent_passed'] },
    tags: ['family'],
    text: [
      { if: { flags: ['mother_dead'] }, text: '家裡捎來一封信，字跡歪歪扭扭，是鄰居代寫的：你爹病了，總念叨著你的名字。' },
      { text: '家裡捎來一封信，字跡歪歪扭扭，是鄰居代寫的：你娘病了，總念叨著你的名字。' },
    ],
    choices: [
      {
        id: 'home',
        text: '立刻回家侍奉',
        outcome: {
          text: '你放下手邊的一切趕回家。三個月後，老人家在你身邊安詳地走了。',
          effects: [goTo('home'), xinxing(2), money(-20), flag('filial'), flag('parent_passed')],
          recap: { weight: 2, text: '{ageCn}歲那年，你放下一切回家，陪著老人家走完了最後一段路。' },
        },
      },
      {
        id: 'money',
        text: '寄錢回家，託人照顧',
        requires: { minMoney: 30 },
        outcome: {
          text: '你寄了一大筆錢回去。半年後收到回信，說老人家走得很安詳，臨終前還在誇你孝順。',
          effects: [money(-30), flag('sent_money_home'), flag('parent_passed')],
        },
      },
      {
        id: 'later',
        text: '手頭的事放不下，回信說過陣子就回去',
        outcome: {
          text: '等你終於回到家，只看見了一座新墳。',
          effects: [flag('regret_parents'), flag('parent_passed'), xinxing(1)],
          recap: { weight: 3, text: '家書說老人家病了，你回信說過陣子就回去。等你回去時，只看見了一座新墳。' },
        },
      },
    ],
  },
  {
    id: 'marriage',
    kind: 'normal',
    title: '說親',
    weight: 9,
    conditions: { minAge: 18, maxAge: 30, notFlags: ['married', 'declined_marriage'] },
    tags: ['family', 'social'],
    text: '媒人第三次上門了，說的是{place}一戶人家，人品端正，模樣也好。家裡人都盼著你點頭。',
    choices: [
      {
        id: 'yes',
        text: '點頭成家',
        outcome: {
          text: '成親那天，鞭炮一直放到了巷口。夜裡，你看著紅燭，忽然覺得這輩子有了著落。',
          effects: [flag('married'), xinxing(1), money(-10)],
          recap: { weight: 2, text: '{ageCn}歲那年，你成了家。' },
        },
      },
      {
        id: 'companion',
        text: '「我心裡已經有人了。」（{companion}）',
        requires: { minRelation: { companion: 40 } },
        hidden: true,
        outcome: {
          text: '你去找{companion}。對方聽完你的話，愣了很久，然後笑著哭了：「我等這句話，等了好多年。」',
          effects: [flag('married'), flag('married_companion'), rel('companion', 30)],
          recap: { weight: 3, text: '{ageCn}歲那年，你和青梅竹馬的{companion}成了親。' },
        },
      },
      {
        id: 'no',
        text: '「我的路還沒走完，不想耽誤人家。」',
        outcome: { text: '媒人搖著頭走了。家裡人嘆了口氣，從此不再提這件事。', effects: [flag('declined_marriage'), danshi(1)] },
      },
    ],
  },
  {
    id: 'companion_leaves',
    kind: 'normal',
    title: '遠行',
    weight: 10,
    conditions: { minAge: 16, maxAge: 22, minRelation: { companion: 10 }, notFlags: ['married_companion'] },
    tags: ['social'],
    text: '{companion}來找你，說要離開家鄉，到外面去闖一闖。臨走前一晚，你們在小時候常去的老地方坐到了半夜。',
    choices: [
      {
        id: 'go',
        text: '跟{companion}一起走',
        outcome: [
          {
            if: { regions: ['jiangnan'] },
            text: '你們搭上一條往上游去的貨船，一路到了襄陽。城牆比你想像的還要高。',
            effects: [goTo('xiangyang'), rel('companion', 20), fuyuan(1), flag('left_with_companion')],
            recap: { weight: 2, text: '{ageCn}歲那年，你和{companion}一起離開家鄉，到了襄陽。' },
          },
          {
            text: '你們順著江水一路往東，到了繁華的江南。{companion}說，這輩子沒見過這麼多人。',
            effects: [goTo('jiangnan'), rel('companion', 20), fuyuan(1), flag('left_with_companion')],
            recap: { weight: 2, text: '{ageCn}歲那年，你和{companion}一起離開家鄉，到了江南。' },
          },
        ],
      },
      {
        id: 'see_off',
        text: '送{companion}一程，約好將來再見',
        outcome: {
          text: '你送到渡口。船開出去很遠了，{companion}還站在船尾朝你揮手。',
          effects: [rel('companion', 10), flag('companion_promise'), later('companion_return', 6, 10)],
        },
      },
      {
        id: 'stay',
        text: '勸{companion}留下',
        check: {
          stats: ['meili'],
          difficulty: 6,
          success: { text: '{companion}想了一夜，最後留了下來：「也是，哪裡都是亂世。」', effects: [rel('companion', 5), flag('companion_stayed')] },
          failure: {
            text: '{companion}還是走了，連聲再見都沒說。',
            effects: [rel('companion', -10), later('companion_return', 8, 12)],
          },
        },
      },
    ],
  },
  {
    id: 'companion_return',
    kind: 'normal',
    title: '重逢',
    scheduledOnly: true,
    tags: ['social'],
    text: '多年不見的{companion}回來了，瘸了一條腿，臉上多了一道疤。{companion}笑著說：「外頭的世道，跟咱們小時候想的不一樣。」',
    choices: [
      {
        id: 'stay',
        text: '留{companion}住下，彼此有個照應',
        outcome: {
          text: '你們又像小時候一樣，常常坐在老地方，一坐就是一下午。',
          effects: [rel('companion', 20), flag('companion_close')],
          recap: { weight: 2, text: '多年後，{companion}拖著一條瘸腿回來，你們又像小時候一樣坐在老地方。' },
        },
      },
      {
        id: 'money',
        text: '塞給{companion}一筆錢',
        requires: { minMoney: 30 },
        outcome: { text: '{companion}推辭了好幾次，最後才收下。', effects: [money(-30), rel('companion', 10)] },
      },
      {
        id: 'listen',
        text: '聽{companion}講外頭的事',
        outcome: { text: '{companion}講了一整夜。有些事，你寧可沒有聽過。', effects: [wuxing(1), rel('companion', 5)] },
      },
    ],
  },
  // ---- 說書人 ----
  {
    id: 'lao_liao',
    kind: 'normal',
    title: '說書人',
    weight: 6,
    repeatable: true,
    cooldown: 4,
    maxTimes: 3,
    conditions: { minAge: 10, npcPresent: 'lao_liao' },
    tags: ['tavern', 'social'],
    text: [
      {
        if: { flagMin: { liao_count: 2 } },
        text: '茶館裡又響起了醒木聲。老廖的鬍子全白了，看見你，他停下來笑道：「這位客官，我說了一輩子別人的故事，什麼時候輪到說你的？」',
      },
      {
        if: { flagMin: { liao_count: 1 } },
        text: '你在另一座城的茶館裡又遇見了那個獨眼的說書人。他用那隻好眼睛看了你一下：「又是你啊。」',
      },
      {
        text: '茶館裡，一個瞎了一隻眼的老說書人一拍醒木：「上回說到——」滿屋子的人都安靜了下來。他講的是江湖上的事：誰在哪裡打了一架，誰為了誰丟了性命。他說得繪聲繪色，好像每一件都親眼見過。',
      },
    ],
    choices: [
      {
        id: 'tip',
        text: '往他碗裡丟幾枚銅錢',
        outcome: {
          text: '老廖側過頭：「客官有故事？下回說給我聽。」',
          effects: [money(-2), add('liao_count'), rel('lao_liao', 10), meet('lao_liao')],
        },
      },
      {
        id: 'challenge',
        text: '指出故事裡的破綻',
        requires: { minStats: { wuxing: 6 } },
        outcome: {
          text: '老廖也不惱，哈哈一笑：「說書的，三分真七分假。真的那三分，才要命。」',
          effects: [add('liao_count'), rel('lao_liao', 5), meet('lao_liao'), wuxing(1)],
        },
      },
      {
        id: 'leave',
        text: '聽完就走',
        outcome: { text: '你放下茶錢，走進了街上的人群。', effects: [add('liao_count'), meet('lao_liao')] },
      },
    ],
  },
  // ---- 奇遇 ----
  {
    id: 'omen_daoist',
    kind: 'normal',
    title: '瘋道人',
    weight: 6,
    rare: true,
    conditions: { minAge: 18, maxAge: 45, flags: ['omen'] },
    tags: ['chance', 'travel'],
    text: '一個披頭散髮的道人攔在你面前，盯著你的臉看了半天，忽然大笑：「是你！是你！那年雪夜我借宿你家，你出生的時候，屋頂上有一道白光！」說完，他手舞足蹈地走了。',
    choices: [
      {
        id: 'chase',
        text: '追上去問個明白',
        check: {
          stats: ['fuyuan'],
          difficulty: 6,
          success: {
            text: '你追了三里路，道人終於停下來，只留下一句話：「等你看破了，再來找我。」',
            effects: [flag('daoist_hint'), wuxing(2)],
            recap: { weight: 2, text: '一個瘋道人說，你出生那夜屋頂上有一道白光。' },
          },
          failure: { text: '你追到山腳，人已經不見了。', effects: [flag('daoist_lost')] },
        },
      },
      {
        id: 'ignore',
        text: '當他是瘋子',
        outcome: { text: '你搖搖頭，繼續趕路。', effects: [flag('ignored_daoist'), xinxing(1)] },
      },
    ],
  },
  {
    id: 'rare_cave',
    kind: 'normal',
    title: '石壁殘劍',
    weight: 3,
    rare: true,
    conditions: { minAge: 15, maxAge: 45, minStats: { fuyuan: 7 } },
    tags: ['chance', 'travel'],
    text: '你在山中避雨，誤入一個山洞。洞壁上刻滿了劍痕，深淺不一，有的已經被青苔蓋住。最深處刻著一行小字：「後來者，看得懂便拿去。」',
    choices: [
      {
        id: 'study',
        text: '留下來參悟',
        check: {
          stats: ['wuxing'],
          difficulty: 7,
          success: {
            text: '你在洞裡待了四十九天。出洞那天，你隨手一揮，洞口的藤蔓齊齊斷成了兩截。',
            effects: [xp('shibi', 9), flag('cave_insight')],
            recap: { weight: 4, text: '你在深山的石洞裡參悟了前人留下的劍意。' },
          },
          failure: {
            text: '你在洞裡待了一個多月，差點餓死，只看懂了最淺的幾道劍痕。',
            effects: [xp('shibi', 3), health(-10)],
          },
        },
      },
      {
        id: 'rubbing',
        text: '把劍痕拓下來，帶走慢慢研究',
        outcome: { text: '你拓了整整一個包袱。往後很多個夜裡，你都對著那些拓片發呆。', effects: [wuxing(1), xp('shibi', 2), flag('cave_rubbing')] },
      },
      {
        id: 'bow',
        text: '在洞口磕三個頭，悄悄離開',
        outcome: { text: '你把青苔重新撥回原處。有些東西，還是留給後來的人吧。', effects: [fuyuan(2), xinxing(1), flag('respected_cave')] },
      },
    ],
  },
  // ---- 方針事件 ----
  {
    id: 'training_plateau',
    kind: 'normal',
    title: '瓶頸',
    weight: 8,
    repeatable: true,
    cooldown: 4,
    maxTimes: 3,
    conditions: { minAge: 13, minMartial: 1 },
    tags: ['martial'],
    text: '這幾個月，你的功夫怎麼練都停在原地。一招一式都對，卻總覺得隔著一層什麼。',
    choices: [
      {
        id: 'grind',
        text: '苦練，一天練足六個時辰',
        check: {
          stats: ['gengu'],
          difficulty: 5,
          success: { text: '某天清晨，那層東西忽然破了。你一拳打出，自己都嚇了一跳。', effects: [train('martial', 3)] },
          failure: { text: '你練傷了筋骨，躺了半個月。', effects: [health(-10), train('martial', 1)] },
        },
      },
      {
        id: 'meditate',
        text: '停下來，靜坐想一想',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: { text: '你坐了三天，想通了一個以前沒想過的道理。', effects: [train('martial', 3), xinxing(1)] },
          failure: { text: '想了三天，什麼也沒想出來。', effects: [train('martial', 1), xinxing(1)] },
        },
      },
      {
        id: 'rest',
        text: '乾脆放下幾天',
        outcome: { text: '你去釣了幾天魚。回來再練時，手腳竟然鬆快了不少。', effects: [health(10), xinxing(1)] },
      },
    ],
  },
  {
    id: 'study_exam',
    kind: 'normal',
    title: '州試',
    weight: 10,
    conditions: { minAge: 15, maxAge: 30, minStats: { wuxing: 5 } },
    tags: ['study'],
    text: '州裡要開科取士了。私塾先生把你叫到跟前：「你的文章，可以去試一試。」',
    choices: [
      {
        id: 'take',
        text: '應考',
        check: {
          stats: ['wuxing'],
          difficulty: 7,
          success: {
            text: '放榜那天，你的名字在榜上。鄉里敲鑼打鼓地送來賀禮。',
            effects: [fame(6), money(30), flag('passed_exam')],
            recap: { weight: 2, text: '{ageCn}歲那年，你考中了州試。' },
          },
          failure: { text: '你落榜了。先生說：「這世道，考中了也未必是福。」', effects: [xinxing(1), flag('failed_exam')] },
        },
      },
      {
        id: 'skip',
        text: '不考了，讀書不一定是為了做官',
        outcome: { text: '先生看了你很久，最後點點頭。', effects: [flag('skipped_exam'), danshi(1)] },
      },
    ],
  },
  {
    id: 'work_wages',
    kind: 'normal',
    title: '工錢',
    weight: 8,
    repeatable: true,
    cooldown: 4,
    maxTimes: 2,
    conditions: { minAge: 13, maxAge: 50 },
    tags: ['work'],
    text: '到了月底，東家說今年生意不好，工錢只能發一半。一起做活的人都看著你。',
    choices: [
      {
        id: 'accept',
        text: '算了，忍一忍',
        outcome: { text: '你拿著半份工錢回家。日子還得過下去。', effects: [xinxing(1), money(10)] },
      },
      {
        id: 'negotiate',
        text: '找東家好好談',
        check: {
          stats: ['meili'],
          difficulty: 6,
          success: { text: '你說得在情在理，東家最後還是把工錢補齊了。', effects: [money(30), meili(1)] },
          failure: { text: '東家翻了臉，把你轟了出去。', effects: [fame(-1)] },
        },
      },
      {
        id: 'strike',
        text: '帶大家一起停工',
        check: {
          stats: ['danshi'],
          difficulty: 6,
          success: { text: '停工三天，東家撐不住了。大家都說，多虧有你。', effects: [money(20), chiv(3), fame(3)] },
          failure: { text: '東家找來打手，帶頭的你被打了一頓。', effects: [health(-10), chiv(3)] },
        },
      },
    ],
  },
  {
    id: 'trade_deal',
    kind: 'normal',
    title: '一批貨',
    weight: 12,
    repeatable: true,
    cooldown: 2,
    maxTimes: 4,
    conditions: { minAge: 15, focus: ['trade'] },
    tags: ['trade'],
    text: '有人急著出手一批川蜀的藥材，價錢只要市價的一半。來路說不清，但這樣的機會不多。',
    choices: [
      {
        id: 'all_in',
        text: '押上全部家當',
        requires: { minMoney: 50 },
        check: {
          stats: ['fuyuan'],
          difficulty: 6,
          success: { text: '貨一到江南就被搶購一空。你數錢數到半夜。', effects: [money(180)] },
          failure: { text: '貨在半路被官府扣了，說是贓物。你血本無歸。', effects: [money(-80)] },
        },
      },
      {
        id: 'careful',
        text: '先買一小批試試',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: { text: '小賺了一筆，也摸清了門路。', effects: [money(50), wuxing(1)] },
          failure: { text: '貨裡摻了一半的爛根，賠了一點。', effects: [money(-15)] },
        },
      },
      {
        id: 'pass',
        text: '來路不明的不碰',
        outcome: { text: '後來聽說那批貨是從死人身上扒下來的。你慶幸自己沒碰。', effects: [xinxing(1), flag('passed_deal')] },
      },
    ],
  },
  {
    id: 'sworn',
    kind: 'normal',
    title: '萍水相逢',
    weight: 10,
    conditions: { minAge: 16, maxAge: 50, notFlags: ['sworn'] },
    tags: ['social', 'tavern'],
    text: '酒樓裡，鄰桌的游俠秦遠替你擋下了一個找碴的醉漢。你們一見如故，從午後一直喝到打烊。',
    choices: [
      {
        id: 'swear',
        text: '撮土為香，結為兄弟',
        outcome: {
          text: '你們在月下對拜了三次。秦遠說：「從今以後，你的事就是我的事。」',
          effects: [flag('sworn'), chiv(3), meili(1), rel('qin_yuan', 40)],
          recap: { weight: 2, text: '{ageCn}歲那年，你和游俠秦遠在月下結為兄弟。' },
        },
      },
      {
        id: 'drink',
        text: '只喝酒，不談別的',
        outcome: { text: '天亮時，秦遠已經走了，桌上留著一壺沒開封的酒。', effects: [meili(1), rel('qin_yuan', 15)] },
      },
    ],
  },
  {
    id: 'sworn_help',
    kind: 'normal',
    title: '兄弟有難',
    weight: 14,
    conditions: { minAge: 22, maxAge: 60, flags: ['sworn'], notFlags: ['sworn_resolved'] },
    tags: ['social', 'feud'],
    text: '秦遠派人捎來口信：他得罪了地方上的豪強，被關在牢裡，三天後就要問斬。',
    choices: [
      {
        id: 'rescue',
        text: '連夜趕去劫牢',
        check: {
          stats: ['danshi', 'gengu'],
          difficulty: 7,
          martial: true,
          success: {
            text: '你打翻了四個獄卒，背著秦遠翻過了城牆。他在你背上笑：「就知道你會來。」',
            effects: [flag('sworn_resolved'), flag('saved_sworn'), chiv(8), fame(6), align(-5), rel('qin_yuan', 30)],
            recap: { weight: 4, text: '結義兄弟秦遠被判問斬，你連夜劫牢，把他背出了城。' },
          },
          failure: {
            text: '你被官兵圍住，身中數刀才逃了出來。三天後，秦遠被斬於市口。',
            effects: [flag('sworn_resolved'), flag('lost_sworn'), health(-35), chiv(5)],
            recap: { weight: 4, text: '你沒能從刑場上救下結義兄弟秦遠。' },
          },
        },
      },
      {
        id: 'bribe',
        text: '散盡家財，上下打點',
        requires: { minMoney: 150 },
        outcome: {
          text: '銀子流水似地花出去，秦遠終於被放了出來。他看著你空空的屋子，一句話也說不出來。',
          effects: [money(-150), flag('sworn_resolved'), flag('saved_sworn'), chiv(5), rel('qin_yuan', 30)],
          recap: { weight: 4, text: '結義兄弟秦遠被判問斬，你散盡家財把他救了出來。' },
        },
      },
      {
        id: 'abandon',
        text: '這事你管不了',
        outcome: {
          text: '行刑那天，你沒有去。很多年後，你仍然記得那天的天氣。',
          effects: [flag('sworn_resolved'), flag('abandoned_sworn'), chiv(-10)],
          recap: { weight: 3, text: '結義兄弟秦遠被判問斬，你沒有去救他。' },
        },
      },
    ],
  },
  {
    id: 'travel_road',
    kind: 'normal',
    title: '路見不平',
    weight: 8,
    repeatable: true,
    cooldown: 3,
    maxTimes: 3,
    conditions: { minAge: 15 },
    tags: ['travel'],
    text: [
      { if: { minYear: 1250 }, text: '官道上，幾個兵痞正在搶一個老漢的驢車。老漢跪在地上磕頭，額頭都磕破了。' },
      { text: '官道上，幾個地痞正在搶一個老漢的驢車。老漢跪在地上磕頭，額頭都磕破了。' },
    ],
    choices: [
      {
        id: 'fight',
        text: '出手',
        check: {
          stats: ['danshi', 'gengu'],
          difficulty: 6,
          martial: true,
          success: { text: '三兩下就把人打跑了。老漢拉著你的手，非要你收下一袋棗子。', effects: [fame(4), chiv(4)] },
          failure: { text: '你寡不敵眾，被打得滿臉是血。好在驢車保住了。', effects: [health(-20), chiv(4)] },
        },
      },
      {
        id: 'trick',
        text: '大喊「官兵來了」',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: { text: '那幫人嚇得一哄而散。你自己都忍不住笑了。', effects: [chiv(3), wuxing(1)] },
          failure: { text: '沒人信你。他們搶了驢車揚長而去。', effects: [chiv(1)] },
        },
      },
      {
        id: 'pass',
        text: '繞路走開',
        outcome: { text: '你繞過了那段路。身後傳來老漢的哭聲。', effects: [chiv(-2), flag('passed_by')] },
      },
    ],
  },
  {
    id: 'crossroad',
    kind: 'normal',
    title: '渡口',
    weight: 9,
    repeatable: true,
    cooldown: 2,
    maxTimes: 6,
    conditions: { minAge: 15, focus: ['travel'] },
    tags: ['travel'],
    text: '你來到渡口。往東是江南，往西是川蜀，往北是襄陽。船家問你要去哪裡。',
    choices: [
      {
        id: 'jiangnan',
        text: '去江南',
        requires: { not: { regions: ['jiangnan'] } },
        hidden: true,
        outcome: { text: '船順流而下，兩岸的稻田一眼望不到邊。', effects: [goTo('jiangnan'), fuyuan(1)] },
      },
      {
        id: 'shu',
        text: '去川蜀',
        requires: { not: { regions: ['shu'] } },
        hidden: true,
        outcome: { text: '你換了三次船，又走了半個月的山路，終於看見了川蜀的群山。', effects: [goTo('shu'), gengu(1)] },
      },
      {
        id: 'xiangyang',
        text: '去襄陽',
        requires: { not: { regions: ['xiangyang'] } },
        hidden: true,
        outcome: { text: '船逆流而上，漢水邊的城牆越來越近。', effects: [goTo('xiangyang'), danshi(1)] },
      },
      {
        id: 'stay',
        text: '哪裡都不去',
        outcome: { text: '你在渡口坐了一下午，看著船來船往，最後還是回去了。', effects: [xinxing(1)] },
      },
    ],
  },
  // ---- 人生轉折 ----
  {
    id: 'ambition_review',
    kind: 'forced',
    title: '初心',
    priority: 6,
    conditions: { minAge: 30, maxAge: 38, hasAmbition: true },
    tags: ['family'],
    text: '{ageCn}歲這年，你在水盆裡看見了自己的第一根白頭髮。少年時說過的那句話，忽然又浮上了心頭。',
    choices: [
      {
        id: 'keep',
        text: '初心不改',
        outcome: { text: '你對著水裡的自己笑了笑。路還長。', effects: [xinxing(1), flag('kept_ambition')] },
      },
      {
        id: 'peace',
        text: '放下執念，只求平安',
        requires: { not: { ambitions: ['peace'] } },
        hidden: true,
        outcome: {
          text: '你把那句話輕輕放下了。',
          effects: [ambition('peace'), flag('changed_ambition')],
          recap: { weight: 2, text: '{ageCn}歲那年，你放下了少年時的志向，只求平安。' },
        },
      },
      {
        id: 'nation',
        text: '立志守護這片山河',
        requires: { minYear: 1250, not: { ambitions: ['nation'] } },
        hidden: true,
        outcome: {
          text: '北邊的消息一天比一天壞。你想，總得有人去。',
          effects: [ambition('nation'), flag('changed_ambition'), danshi(1)],
          recap: { weight: 2, text: '{ageCn}歲那年，你改了志向：要守護這片山河。' },
        },
      },
      {
        id: 'revenge',
        text: '立志報仇雪恨',
        requires: { flags: ['blood_feud'], notFlags: ['revenge_done', 'feud_resolved'], not: { ambitions: ['revenge'] } },
        hidden: true,
        outcome: {
          text: '你把父親留下的那把舊刀磨了一夜。',
          effects: [ambition('revenge'), flag('changed_ambition')],
          recap: { weight: 2, text: '{ageCn}歲那年，你立誓要為父親報仇。' },
        },
      },
      {
        id: 'healer',
        text: '立志行醫救人',
        requires: { minSkill: { baicao: 2 }, not: { ambitions: ['healer'] } },
        hidden: true,
        outcome: {
          text: '你把藥箱擦得乾乾淨淨。這輩子剩下的日子，就拿來救人吧。',
          effects: [ambition('healer'), flag('changed_ambition')],
          recap: { weight: 2, text: '{ageCn}歲那年，你立志用剩下的日子行醫救人。' },
        },
      },
    ],
  },
  {
    id: 'take_disciple',
    kind: 'normal',
    title: '收徒',
    weight: 14,
    conditions: { minAge: 32, maxAge: 70, notFlags: ['has_disciple', 'refused_disciple'], any: [{ minMartial: 3 }, { minSkill: { baicao: 3 } }] },
    tags: ['martial', 'medicine', 'sect'],
    text: '一個少年在你門外跪了三天三夜，說什麼都要拜你為師。他的膝蓋磨破了，眼睛卻亮得驚人。',
    choices: [
      {
        id: 'accept',
        text: '收下他',
        outcome: {
          text: '你扶他起來，給他盛了一碗熱湯。他喝著喝著就哭了。',
          effects: [flag('has_disciple'), xinxing(1), fame(3)],
          recap: { weight: 3, text: '{ageCn}歲那年，你收了第一個徒弟。' },
        },
      },
      {
        id: 'test',
        text: '先考驗他三年',
        check: {
          stats: ['xinxing'],
          difficulty: 5,
          success: {
            text: '三年裡，他挑水、劈柴、熬藥，從沒抱怨過一句。第三年冬天，你終於把一身本事傾囊相授。',
            effects: [flag('has_disciple'), fame(2), xinxing(1)],
            recap: { weight: 3, text: '{ageCn}歲那年，你考驗了一個少年三年，最後收他為徒。' },
          },
          failure: {
            text: '第二年春天，他留下一封信走了。你這才發現，自己對他太嚴了。',
            effects: [flag('lost_disciple')],
            recap: { weight: 2, text: '你把一個想拜師的少年逼走了。' },
          },
        },
      },
      {
        id: 'refuse',
        text: '拒絕',
        outcome: { text: '第四天早上，門外的人不見了。', effects: [flag('refused_disciple')] },
      },
    ],
  },
  {
    id: 'retire_choice',
    kind: 'forced',
    title: '暮年',
    priority: 6,
    conditions: { minAge: 55, maxAge: 66 },
    tags: ['family'],
    text: '這些年，老朋友一個個走了。某天清晨，你坐在院子裡，忽然想好好想一想，剩下的日子該怎麼過。',
    choices: [
      {
        id: 'retire',
        text: '歸隱山林，從此不問世事',
        outcome: {
          text: '你在山腰蓋了間茅屋，種了幾畦菜。山下的事，再也沒有人來告訴你。',
          effects: [flag('retired'), health(10), xinxing(1)],
          recap: { weight: 2, text: '{ageCn}歲那年，你歸隱山林。' },
        },
      },
      {
        id: 'home',
        text: '回到故鄉',
        outcome: {
          text: '故鄉的路變了，口音卻沒變。巷口賣糖糕的換成了當年那家人的孫子。',
          effects: [goTo('home'), flag('returned_home')],
          recap: { weight: 1, text: '{ageCn}歲那年，你回到了故鄉。' },
        },
      },
      {
        id: 'teach',
        text: '開館授徒，把一身本事傳下去',
        requires: { any: [{ minMartial: 2 }, { minSkill: { baicao: 2 } }] },
        outcome: {
          text: '門前掛起了一塊木牌。第一年來了三個孩子，第三年來了三十個。',
          effects: [flag('has_disciple'), flag('opened_school'), fame(5)],
          recap: { weight: 3, text: '{ageCn}歲那年，你開館授徒，把一身本事傳了下去。' },
        },
      },
      {
        id: 'wander',
        text: '還走得動，再闖幾年',
        outcome: { text: '你緊了緊包袱，又上路了。', effects: [flag('still_wandering'), danshi(1)] },
      },
    ],
  },
];
