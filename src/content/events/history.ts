// 宋蒙戰爭的史實大事。大勢不可改變，玩家只能決定自己身在何處、做了什麼。

import type { GameEvent } from '../../engine/types';
import { add, chiv, die, fame, flag, goTo, health, join, meet, money, rel, wuxing, xinxing, xp } from '../dsl';

const HAN_DEAD = flag('dead_han_shouyi');

export const historyEvents: GameEvent[] = [
  {
    id: 'xiangyang_militia',
    kind: 'normal',
    title: '鐵槍韓守義',
    weight: 14,
    conditions: { minAge: 16, maxAge: 55, npcPresent: 'han_shouyi', hasSect: false },
    tags: ['war', 'social'],
    enterEffects: [meet('han_shouyi')],
    text: '城門口豎起了一桿大旗，上面寫著一個「義」字。旗下站著一個鐵塔似的漢子，手裡一桿黑沉沉的鐵槍。他對圍觀的人說：「朝廷的兵守城牆，咱們守的是城裡的人。」他叫韓守義。',
    choices: [
      {
        id: 'enlist',
        text: '投軍',
        outcome: {
          text: '韓守義拍了拍你的肩膀，差點把你拍趴下：「好！明天開始，跟我學槍。」',
          effects: [join('yijun'), rel('han_shouyi', 20), xp('shoucheng', 3), flag('joined_yijun')],
          recap: { weight: 2, text: '{ageCn}歲那年，你投入了鐵槍韓守義的襄陽義軍。' },
        },
      },
      {
        id: 'donate',
        text: '捐出一筆錢糧',
        requires: { minMoney: 50 },
        outcome: { text: '韓守義抱拳謝過，把你的名字記在一本破舊的冊子上。', effects: [money(-50), chiv(5), rel('han_shouyi', 10), fame(2)] },
      },
      {
        id: 'leave',
        text: '搖頭離開',
        outcome: { text: '你擠出人群。身後，韓守義的聲音還在響。', effects: [flag('declined_yijun')] },
      },
    ],
  },
  {
    id: 'xiangyang_call',
    kind: 'normal',
    title: '襄陽告急',
    weight: 10,
    weightMods: [{ if: { ambitions: ['nation'] }, mult: 4 }],
    conditions: { minAge: 18, maxAge: 60, minYear: 1267, maxYear: 1271, not: { regions: ['xiangyang'] } },
    tags: ['war'],
    text: '茶館裡人人都在說襄陽。蒙古大軍把城圍了起來，漢水上全是敵船。有人說，朝廷的援兵一批批地去，又一批批地敗回來。',
    choices: [
      {
        id: 'go',
        text: '收拾行囊，前往襄陽',
        outcome: {
          text: '你趁著夜色，從漢水邊的蘆葦蕩裡摸進了城。守城的兵看見你，愣了半天：「別人都往外逃，你往裡鑽？」',
          effects: [goTo('xiangyang'), flag('went_to_xiangyang'), chiv(5)],
          recap: { weight: 3, text: '{ageCn}歲那年襄陽被圍，別人都往外逃，你收拾行囊進了那座孤城。' },
        },
      },
      {
        id: 'donate',
        text: '捐錢給募兵的義士',
        requires: { minMoney: 30 },
        outcome: { text: '你把錢交給募兵的人。他說，這些錢夠讓十個人吃上一個月。', effects: [money(-30), chiv(3)] },
      },
      {
        id: 'stay',
        text: '這仗打不贏的',
        outcome: { text: '你搖搖頭，把茶喝完。', effects: [flag('stayed_away_xiangyang')] },
      },
    ],
  },
  {
    id: 'siege_xiangyang',
    kind: 'forced',
    title: '圍城',
    priority: 9,
    conditions: { minAge: 10, minYear: 1268, maxYear: 1271, regions: ['xiangyang'] },
    tags: ['war'],
    text: [
      {
        if: { sects: ['yijun'] },
        text: '蒙古大軍在襄陽城外築起了一圈又一圈的堡壘，漢水被鐵索封死。城裡的糧食一天比一天少。韓守義把義軍分成三班，日夜巡城。',
      },
      { text: '蒙古大軍在襄陽城外築起了一圈又一圈的堡壘，漢水被鐵索封死。城裡的糧食一天比一天少，有人開始拆房子當柴燒。' },
    ],
    choices: [
      {
        id: 'wall',
        text: '上城頭守城',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 6,
          martial: true,
          success: {
            text: '你在城頭守了一年又一年，打退了不知多少次攻城。有一天韓守義走過來，拍著你的肩膀說：「好樣的。」',
            effects: [flag('defended_city'), fame(5), chiv(5), rel('han_shouyi', 15), meet('han_shouyi'), xp('shoucheng', 2)],
            recap: { weight: 3, text: '襄陽被圍的那幾年，你一直守在城頭。' },
          },
          failure: {
            text: '一塊投石砸塌了你身邊的垛口。你被埋在碎石裡，醒來時已經躺在傷兵營。',
            effects: [flag('defended_city'), health(-35), chiv(5)],
            recap: { weight: 3, text: '襄陽被圍的那幾年，你在城頭被投石砸傷，傷好了又回到城頭。' },
          },
        },
      },
      {
        id: 'heal',
        text: '在傷兵營救治傷患',
        requires: { minSkill: { baicao: 1 } },
        outcome: {
          text: '傷兵營裡的血腥味，你一輩子都忘不掉。你數不清救活了多少人，只記得那些沒救活的臉。',
          effects: [flag('defended_city'), add('healed', 3), chiv(8), xp('baicao', 2), fame(3)],
          recap: { weight: 3, text: '襄陽被圍的那幾年，你在傷兵營裡救活了數不清的人。' },
        },
      },
      {
        id: 'refugees',
        text: '跟著百衲會照顧城裡的流民',
        requires: { any: [{ sects: ['baina'] }, { flags: ['helped_baina'] }] },
        hidden: true,
        outcome: {
          text: '葛百衲帶著你們挨家挨戶分糧。他說：「城破不破，是天的事。人餓不餓，是咱們的事。」',
          effects: [flag('defended_city'), chiv(6), rel('ge_baina', 15), fame(2)],
          recap: { weight: 3, text: '襄陽被圍的那幾年，你跟著葛百衲在城裡分糧，沒讓一個流民餓死。' },
        },
      },
      {
        id: 'flee',
        text: '趁夜帶著家人突圍出城',
        check: {
          stats: ['danshi', 'wuxing'],
          difficulty: 6,
          success: {
            text: '你們在漢水邊的蘆葦叢裡躲了兩天，才逃出包圍。回頭望去，襄陽城頭的火光一夜沒熄。',
            effects: [goTo('jiangnan'), flag('fled_xiangyang')],
            recap: { weight: 3, text: '襄陽被圍的那幾年，你帶著家人逃出了那座孤城。' },
          },
          failure: {
            text: '突圍時遇上了巡邏的騎兵。你逃出來了，身邊的人卻少了一半。',
            effects: [goTo('jiangnan'), flag('fled_xiangyang'), flag('lost_family_xiangyang'), health(-30)],
            recap: { weight: 4, text: '襄陽被圍時你帶著家人突圍，身邊的人卻在亂軍中少了一半。' },
          },
        },
      },
    ],
  },
  {
    id: 'siege_fall',
    kind: 'forced',
    title: '襄陽城破',
    priority: 10,
    conditions: { minAge: 10, minYear: 1273, maxYear: 1274, regions: ['xiangyang'] },
    tags: ['war'],
    text: '咸淳九年，城中守將開城出降。蒙古兵從城門湧進來時，韓守義帶著義軍退守城南的巷子。他說：「城可以降，人不能。」',
    choices: [
      {
        id: 'last_stand',
        text: '隨韓守義死守城南',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 8,
          martial: true,
          success: {
            text: '巷戰打了一天一夜。韓守義身中十幾箭，鐵槍仍拄在地上，人卻不倒。你殺出重圍時，身邊只剩下三個人。',
            effects: [flag('defended_to_end'), flag('defended_city'), HAN_DEAD, fame(10), chiv(10), health(-30)],
            recap: { weight: 5, text: '襄陽城破那天，你隨鐵槍韓守義死守城南。他戰死了，你活了下來。' },
          },
          failure: [
            {
              if: { flags: ['saved_lu'], minRelation: { lu_ping: 40 } },
              text: '你倒在死人堆裡，意識漸漸模糊。有人把你背了起來，一路狂奔。你認出了那個背影——是陸平。',
              effects: [flag('defended_to_end'), flag('defended_city'), flag('lu_saved_me'), HAN_DEAD, health(-50), fame(8), chiv(10)],
              recap: { weight: 5, text: '襄陽城破那天，你倒在亂軍之中。是當年你救下的陸平，把你從死人堆裡背了出來。' },
            },
            {
              text: '你守在巷口，不知道砍倒了多少人。最後一刻，你看見韓守義的鐵槍倒了下去。',
              effects: [flag('defended_to_end'), flag('defended_city'), HAN_DEAD, fame(10), chiv(10), die('xiangyang')],
              recap: { weight: 5, text: '襄陽城破那天，你隨鐵槍韓守義戰死在城南的巷子裡。' },
            },
          ],
        },
      },
      {
        id: 'escort',
        text: '護著百姓從水門突圍',
        check: {
          stats: ['danshi', 'wuxing'],
          difficulty: 7,
          success: {
            text: '你帶著四十多個百姓，從水門的暗渠裡摸了出去。天亮時回頭，城裡的煙已經遮住了半邊天。',
            effects: [flag('escorted_civilians'), flag('defended_to_end'), flag('defended_city'), HAN_DEAD, goTo('jiangnan'), chiv(12), fame(6)],
            recap: { weight: 5, text: '襄陽城破那天，你帶著四十多個百姓從水門逃了出來。' },
          },
          failure: {
            text: '你帶出了十幾個人，自己卻中了一箭。你咬著牙，一路把他們送到了江邊。',
            effects: [flag('escorted_civilians'), flag('defended_city'), HAN_DEAD, goTo('jiangnan'), health(-40), chiv(10), fame(4)],
            recap: { weight: 5, text: '襄陽城破那天，你帶著十幾個百姓從水門逃出，自己中了一箭。' },
          },
        },
      },
      {
        id: 'surrender',
        text: '混在人群裡出降',
        outcome: {
          text: '你跪在路邊，看著蒙古騎兵一隊一隊地走過。沒有人看你一眼。',
          effects: [flag('surrendered_xiangyang'), HAN_DEAD, xinxing(-1), fame(-3)],
          recap: { weight: 4, text: '襄陽城破那天，你跪在路邊，看著敵軍入城。' },
        },
      },
    ],
  },
  {
    id: 'bater_battlefield',
    kind: 'forced',
    title: '白翎',
    priority: 7,
    conditions: { minAge: 20, minYear: 1258, maxYear: 1273, flags: ['grassland_pact'], regions: ['shu', 'xiangyang'] },
    tags: ['war'],
    text: [
      {
        if: { regions: ['shu'] },
        text: '釣魚城下，一名蒙古百夫長策馬而出，箭無虛發，城頭上的人一個接一個倒下。你看見他的箭袋裡插著一排白色的箭羽。是巴特爾。他也看見了你，拉滿的弓停在半空。',
      },
      { text: '襄陽城外，一名蒙古百夫長策馬而出，箭無虛發，城頭上的人一個接一個倒下。你看見他的箭袋裡插著一排白色的箭羽。是巴特爾。他也看見了你，拉滿的弓停在半空。' },
    ],
    choices: [
      {
        id: 'lower',
        text: '放下兵器，對他搖搖頭',
        outcome: {
          text: '巴特爾的弓慢慢垂了下來。他撥轉馬頭，帶著部下退出了射程。那天晚上，你在城牆下撿到一支白羽箭，箭桿上纏著一張字條，只寫了兩個字：保重。',
          effects: [flag('spared_bater'), flag('bater_met_war'), rel('bater', 20)],
          recap: { weight: 5, text: '兩軍陣前，你和童年的朋友巴特爾都放下了弓。' },
        },
      },
      {
        id: 'shoot',
        text: '拉弓搭箭，搶先出手',
        check: {
          stats: ['danshi', 'gengu'],
          difficulty: 7,
          martial: true,
          success: {
            text: '你的箭先到了。巴特爾從馬上摔下來，到死都沒有把弓拉開。戰後，你在他身上找到一根褪了色的箭羽——和你身上那根一模一樣。',
            effects: [flag('killed_bater'), flag('bater_met_war'), flag('defended_city'), fame(8), xinxing(-1)],
            recap: { weight: 5, text: '兩軍陣前，你親手射殺了童年的朋友巴特爾。' },
          },
          failure: {
            text: '你的箭射偏了。巴特爾的箭擦著你的耳朵飛過，釘在你身後的旗杆上。他沒有再射第二箭。',
            effects: [flag('spared_by_bater'), flag('bater_met_war'), health(-10)],
            recap: { weight: 5, text: '兩軍陣前，巴特爾的箭擦過你的耳邊。他本可以射中的。' },
          },
        },
      },
      {
        id: 'talk',
        text: '趁夜出城，去找他談一談',
        check: {
          stats: ['meili', 'danshi'],
          difficulty: 7,
          success: {
            text: '營帳裡，你們用半生不熟的話聊到天亮。第二天，巴特爾以舊傷復發為由，帶著部下北返了。',
            effects: [flag('bater_left'), flag('bater_met_war'), chiv(5), rel('bater', 20)],
            recap: { weight: 5, text: '兩軍對峙的那一夜，你潛入敵營，勸童年的朋友巴特爾離開了戰場。' },
          },
          failure: {
            text: '你被巡邏的騎兵抓住了。是巴特爾半夜割斷了你的繩子：「走。下次見面，我不會手軟。」',
            effects: [flag('captured_once'), flag('bater_met_war'), health(-30)],
            recap: { weight: 5, text: '你潛入敵營想勸巴特爾退兵，卻被抓住。是他半夜放了你。' },
          },
        },
      },
    ],
  },
  {
    id: 'diaoyu',
    kind: 'forced',
    title: '釣魚城',
    priority: 9,
    conditions: { minAge: 10, minYear: 1259, maxYear: 1260, regions: ['shu'] },
    tags: ['war'],
    text: '開慶元年，蒙古大汗親率大軍攻打合州釣魚城。城建在三面臨江的山上，守軍硬是撐了五個多月。七月，城外傳來消息：大汗死了。',
    choices: [
      {
        id: 'defend',
        text: '上山助守',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 6,
          martial: true,
          success: {
            text: '你在山城上守了五個月。大汗死訊傳來的那天夜裡，城上的人又哭又笑，你也跟著哭了。',
            effects: [flag('defended_city'), flag('diaoyu_defender'), fame(6), chiv(5)],
            recap: { weight: 3, text: '開慶元年，你在釣魚城上守了五個月，等到了蒙古大汗的死訊。' },
          },
          failure: {
            text: '你在一次夜襲中受了重傷，被抬下山時，城頭的鼓聲還沒有停。',
            effects: [flag('defended_city'), flag('diaoyu_defender'), health(-30), chiv(5)],
            recap: { weight: 3, text: '開慶元年，你在釣魚城上受了重傷。' },
          },
        },
      },
      {
        id: 'heal',
        text: '在山下的村子裡救治傷兵和百姓',
        requires: { minSkill: { baicao: 1 } },
        outcome: {
          text: '你的藥箱空了又滿，滿了又空。後來有人說，山下有個大夫，五個月沒有睡過一整夜。',
          effects: [flag('defended_city'), add('healed', 2), chiv(6), fame(3)],
          recap: { weight: 3, text: '釣魚城之戰時，你在山下救治傷兵，五個月沒睡過一整夜。' },
        },
      },
      {
        id: 'hide',
        text: '帶家人躲進深山',
        outcome: { text: '你們在深山裡躲了半年。下山時，聽說蒙古大軍已經退了。', effects: [flag('hid_mountain'), xinxing(1)] },
      },
    ],
  },
  {
    id: 'linan_fall',
    kind: 'forced',
    title: '臨安',
    priority: 9,
    conditions: { minAge: 10, minYear: 1276, maxYear: 1277, regions: ['jiangnan'] },
    tags: ['war'],
    text: '德祐二年，元軍兵臨臨安城下。太后帶著年幼的皇帝出城請降。有人在街頭痛哭，有人默默收起了家裡的宋錢。',
    choices: [
      {
        id: 'resist',
        text: '投奔南下的義軍，繼續抗元',
        check: {
          stats: ['danshi'],
          difficulty: 6,
          success: {
            text: '你跟著義軍一路南撤，打了大大小小十幾仗。三年後，崖山的消息傳來，義軍散了。',
            effects: [flag('joined_resistance'), flag('defended_city'), fame(5), chiv(5)],
            recap: { weight: 3, text: '臨安陷落後，你跟著義軍一路南撤，直到崖山的消息傳來。' },
          },
          failure: {
            text: '第一仗你就中了一刀，被同伴拖著逃進了山裡。',
            effects: [flag('joined_resistance'), flag('defended_city'), health(-35)],
            recap: { weight: 3, text: '臨安陷落後，你投了義軍，第一仗就受了重傷。' },
          },
        },
      },
      {
        id: 'stay',
        text: '留下來，守著家人過日子',
        outcome: { text: '城頭換了旗子，日子還得過下去。', effects: [flag('stayed_linan'), xinxing(1)] },
      },
      {
        id: 'bury',
        text: '關起門來，把家裡的書和兵器都藏好',
        outcome: {
          text: '你把一箱書和一柄劍埋在後院的槐樹下。也許有一天，會有人用得上。',
          effects: [flag('hid_books'), wuxing(1)],
          recap: { weight: 2, text: '臨安陷落那年，你把一箱書和一柄劍埋在了後院的槐樹下。' },
        },
      },
    ],
  },
];
