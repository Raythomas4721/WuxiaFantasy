// 跑商：行商做久了，有人肯賒一船貨給你，貨走哪條路由你挑，一兩年後回帳。
// 錢多了之後的去處：商會、軍糧、捐城。行商、謀生做越久賺越多，寫在 world.ts 的方針裡。

import type { GameEvent } from '../../engine/types';
import { align, chiv, danshi, fame, flag, later, meili, money, rel, xinxing } from '../dsl';

/** 手上還壓著一船貨的時候，不會再接下一船。 */
const CARGO_OUT = ['cargo_salt', 'cargo_herbs', 'cargo_silk'];

export const tradeEvents: GameEvent[] = [
  {
    id: 'trade_cargo',
    kind: 'normal',
    title: '一船貨',
    weight: 30,
    repeatable: true,
    cooldown: 4,
    maxTimes: 3,
    conditions: { minAge: 18, maxAge: 60, focus: ['trade'], flagMin: { trade_turns: 2 }, notFlags: CARGO_OUT },
    tags: ['trade', 'travel'],
    text: '你在行裡跑了幾年，總算有了點信用。碼頭上的老客商肯賒一船貨給你，貨款等你回來再算。他把三張貨單攤在桌上，讓你自己挑：往北的私鹽、往襄陽的藥材，還是往臨安的綢緞。',
    choices: [
      {
        id: 'salt',
        text: '私鹽。一斤鹽到了北邊，能換三斤米',
        note: '賺得最多，也最容易被官府查扣',
        outcome: {
          text: '你把鹽藏在糧袋底下，跟著一支運糧的車隊往北走。一路上你不敢喝酒，怕說錯話。',
          effects: [flag('cargo_salt'), align(-3), danshi(1), later('cargo_salt_return', 1, 2, 6)],
        },
      },
      {
        id: 'herbs',
        text: '藥材。襄陽城裡缺金創藥',
        note: '賺得不多，城裡的人用得上',
        outcome: {
          text: '貨船逆水走了一個月。船艙裡全是當歸和三七的味道，你睡覺都夢見自己在熬藥。',
          effects: [flag('cargo_herbs'), chiv(1), later('cargo_herbs_return', 1, 2, 6)],
        },
      },
      {
        id: 'silk',
        text: '綢緞。臨安的官宦人家年年都要',
        note: '穩當，看你會不會談價錢',
        outcome: {
          text: '綢緞一匹一匹用油布包好，裝了滿滿一船。順水而下，半個月就到了。',
          effects: [flag('cargo_silk'), later('cargo_silk_return', 1, 2, 6)],
        },
      },
    ],
  },
  {
    id: 'cargo_salt_return',
    kind: 'normal',
    title: '鹽',
    scheduledOnly: true,
    conditions: { flags: ['cargo_salt'] },
    tags: ['trade'],
    text: '車隊走到渡口，前頭忽然停了。官府的人在搜車，一袋一袋地拿刀捅。輪到你那輛車還有七八輛。',
    choices: [
      {
        id: 'bluff',
        text: '神色如常，等他們來搜',
        check: {
          stats: ['danshi', 'meili'],
          difficulty: 6,
          success: {
            text: '搜車的小吏捅了兩袋，捅出來的都是米。你的鹽在北邊賣了好價錢。回來還完貨款，還剩下沉甸甸的一包。',
            effects: [flag('cargo_salt', false), money(220), fame(1)],
            recap: { weight: 2, text: '{ageCn}歲那年，你押著一車私鹽過了官府的關卡，賺了一大筆。' },
          },
          failure: {
            text: '刀尖一拔出來，白花花的鹽就淌了一地。鹽被扣了，你花錢才保住了自己。那船貨的錢，你還了兩年。',
            effects: [flag('cargo_salt', false), money(-40), fame(-1)],
          },
        },
      },
      {
        id: 'detour',
        text: '連夜掉頭，繞小路',
        outcome: {
          text: '小路多走了半個月，鹽受了潮，賣不上價。算下來沒賠，也沒賺多少。',
          effects: [flag('cargo_salt', false), money(60)],
        },
      },
    ],
  },
  {
    id: 'cargo_herbs_return',
    kind: 'normal',
    title: '藥材',
    scheduledOnly: true,
    conditions: { flags: ['cargo_herbs'] },
    tags: ['trade', 'medicine'],
    text: [
      {
        if: { minYear: 1267, maxYear: 1273 },
        text: '貨船到了襄陽外頭才知道，城已經被圍了，進不去。對岸有個軍需官說，藥他全要，價錢隨你開。城牆上，有人在朝這邊揮手。',
      },
      { text: '藥材到了襄陽，城裡的藥鋪搶著要。有個義軍的軍需官找到你，說營裡的傷兵等著用藥，可餉銀還沒到，能不能先賒著。' },
    ],
    choices: [
      {
        id: 'fair',
        text: '照本錢賣給義軍，賒著也行',
        outcome: {
          text: '你只賺了一點船錢。可那之後，襄陽的義軍見了你都喊一聲「藥船來了」。',
          effects: [flag('cargo_herbs', false), flag('fed_army'), money(50), chiv(4), rel('han_shouyi', 10)],
          recap: { weight: 2, text: '{ageCn}歲那年，你把一船藥材照本錢賣給了襄陽的義軍。' },
        },
      },
      {
        id: 'market',
        text: '賣給出價最高的藥鋪',
        outcome: {
          text: '藥鋪的掌櫃當場付了現銀。你數錢的時候，聽見他在後頭跟夥計說，這批貨轉手可以再翻一倍。',
          effects: [flag('cargo_herbs', false), money(150)],
        },
      },
    ],
  },
  {
    id: 'cargo_silk_return',
    kind: 'normal',
    title: '綢緞',
    scheduledOnly: true,
    conditions: { flags: ['cargo_silk'] },
    tags: ['trade'],
    text: '臨安的綢緞莊掌櫃翻了翻你的貨，搖頭說今年的花樣不時興，只肯出八成的價。隔壁街還有兩家綢緞莊，只是你的船明天就得還。',
    choices: [
      {
        id: 'haggle',
        text: '坐下來慢慢談',
        check: {
          stats: ['meili', 'wuxing'],
          difficulty: 5,
          success: {
            text: '你把三家掌櫃請到同一間茶樓，讓他們自己互相加價。散場時，貨賣了一成二的價。',
            effects: [flag('cargo_silk', false), money(170), meili(1)],
            recap: { weight: 2, text: '{ageCn}歲那年，你在臨安的茶樓裡，讓三家綢緞莊替你的貨抬了價。' },
          },
          failure: {
            text: '談到後來，三家掌櫃都不理你了。最後還是賣給了第一家，八成的價。',
            effects: [flag('cargo_silk', false), money(90)],
          },
        },
      },
      {
        id: 'sell',
        text: '八成就八成，見好就收',
        outcome: {
          text: '貨賣了，帳清了，你在臨安住了一晚，吃了一碗從沒吃過的蟹黃麵。',
          effects: [flag('cargo_silk', false), money(110), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'trade_guild',
    kind: 'normal',
    title: '商會',
    weight: 22,
    conditions: { minAge: 25, maxAge: 65, any: [{ property: 'shop' }, { minWealth: 300 }, { flagMin: { trade_turns: 6 } }], notFlags: ['guild_member', 'guild_refused'] },
    tags: ['trade', 'tavern'],
    text: '城裡的商會請你去吃一頓飯。席上坐的都是各行的東家，會首舉著酒杯說：亂世做生意，單打獨鬥活不長。入了會，貨一起走，鏢一起請，有事大家一起扛。入會的份子錢，五十文。',
    choices: [
      {
        id: 'join',
        text: '交份子錢，入會',
        requires: { minMoney: 50 },
        hint: '你身上的錢不夠份子錢',
        note: '之後行商每一趟都多賺一些',
        outcome: {
          text: '你在商會的名冊上按了手印。往後你的貨，跟著商會的大船一起走。',
          effects: [money(-50), flag('guild_member'), fame(2)],
          recap: { weight: 2, text: '{ageCn}歲那年，你入了城裡的商會。' },
        },
      },
      {
        id: 'head',
        text: '「會首這個位子，我坐得起。」',
        requires: { minWealth: 500 },
        hidden: true,
        outcome: {
          text: '你當場認了商會一年的開銷。散席的時候，老會首把印信交到了你手上，嘆了口氣：「這個位子，亂世裡不好坐。」',
          effects: [money(-100), flag('guild_member'), flag('guild_head'), fame(5)],
          recap: { weight: 3, text: '{ageCn}歲那年，你當上了城裡商會的會首。' },
        },
      },
      {
        id: 'refuse',
        text: '吃完飯，客客氣氣地推了',
        outcome: {
          text: '會首也不勉強，只說門一直開著。你走出酒樓時想，自己的生意還是自己扛比較踏實。',
          effects: [flag('guild_refused'), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'donate_walls',
    kind: 'normal',
    title: '捐城',
    weight: 26,
    conditions: { minAge: 20, minYear: 1265, maxYear: 1272, minMoney: 150, notFlags: ['funded_defense'] },
    weightMods: [{ if: { ambitions: ['nation'] }, mult: 2 }, { if: { flags: ['guild_member'] }, mult: 2 }],
    tags: ['war', 'trade', 'village'],
    text: '襄陽的守將派人到各州募捐，城頭要加一道女牆、多造兩百張弩。告示貼在城門口，底下一個人也沒有。有人小聲說：捐了也是給當官的貪了。也有人說：城要是破了，你還做什麼生意。',
    choices: [
      {
        id: 'some',
        text: '捐一百五十文',
        outcome: {
          text: '你的名字被抄在了告示底下，排在第一個。那天下午，告示底下多了好幾個人。',
          effects: [money(-150), flag('funded_defense'), chiv(5), fame(3), align(3)],
          recap: { weight: 3, text: '{ageCn}歲那年，你捐錢替襄陽的城頭造弩。' },
        },
      },
      {
        id: 'all',
        text: '捐三百文，再替他們把消息傳到商會',
        requires: { minMoney: 300 },
        hidden: true,
        outcome: {
          text: '你帶著告示跑了三家商會，替守將湊了一千多文。後來聽說，城頭真的多了一道女牆。城破的時候，那道牆是最後塌的。',
          effects: [money(-300), flag('funded_defense'), flag('funded_defense_big'), chiv(9), fame(6), align(5)],
          recap: { weight: 4, text: '{ageCn}歲那年，你捐出三百文，又替襄陽湊了一千多文，城頭因此多了一道女牆。' },
        },
      },
      {
        id: 'pass',
        text: '看完告示，走開',
        outcome: { text: '你把錢袋按在懷裡走開了。走出很遠，那張告示還在你腦子裡。', effects: [xinxing(-1)] },
      },
    ],
  },
  {
    id: 'late_fortune',
    kind: 'normal',
    title: '散財',
    weight: 30,
    conditions: { minAge: 50, minWealth: 600 },
    tags: ['trade', 'village', 'rest'],
    text: '你算了一夜的帳。這些年攢下的家業，夠子孫吃三輩子。天亮時你推開窗，看見巷口一群孩子蹲在牆根下，拿樹枝在地上寫字。私塾的先生年前就逃難走了，再也沒有回來。',
    choices: [
      {
        id: 'school',
        text: '辦一間義學，請先生，不收束脩',
        requires: { minMoney: 200 },
        hint: '手上的現錢不夠，家業都在田地鋪面上',
        outcome: {
          text: '義學開張那天，來了四十多個孩子，大的十三四歲，小的才剛會走路。先生問你學堂要叫什麼名字，你想了很久，說：就叫「不逃」。',
          effects: [money(-200), flag('built_school'), chiv(6), fame(4), xinxing(1)],
          recap: { weight: 4, text: '{ageCn}歲那年，你拿出家財，在巷口辦了一間不收束脩的義學。' },
        },
      },
      {
        id: 'granary',
        text: '修一座義倉，荒年開倉放糧',
        requires: { minMoney: 150 },
        hint: '手上的現錢不夠，家業都在田地鋪面上',
        outcome: {
          text: '義倉蓋在城外的高地上，大水淹不到。第二年就遇上了荒年。開倉那天，排隊的人從倉門口一直排到了河邊。',
          effects: [money(-150), flag('built_granary'), chiv(5), fame(3), align(3)],
          recap: { weight: 4, text: '{ageCn}歲那年，你修了一座義倉。第二年遇上荒年，排隊領糧的人一直排到了河邊。' },
        },
      },
      {
        id: 'heirs',
        text: '全部留給家裡的人',
        outcome: {
          text: '你把地契、帳本一樣一樣交代清楚。家裡的人都說你想得周到。只是那天之後，你常常站在窗口，看巷口那群孩子。',
          effects: [xinxing(-1), meili(1)],
        },
      },
    ],
  },
];
