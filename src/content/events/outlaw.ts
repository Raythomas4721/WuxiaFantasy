// 邪道的兩條路：
// 一、血衣樓入樓之後的事（入樓本身在 jianghu.ts）。
// 二、黑風寨：打倒寨主之後，寨裡的人請你坐那把交椅。

import type { GameEvent } from '../../engine/types';
import { add, align, chiv, fame, flag, goTo, later, leaveSect, money, rel, xinxing } from '../dsl';

export const outlawEvents: GameEvent[] = [
  // ==================== 血衣樓 ====================
  {
    id: 'xueyi_rival',
    kind: 'normal',
    title: '同行',
    scheduledOnly: true,
    conditions: { sects: ['xueyi'] },
    tags: ['feud', 'sect'],
    text: '樓裡的單子向來一人一張。這一回你趕到地方，目標已經倒在血泊裡，屋樑上坐著一個戴斗笠的人，手裡晃著一塊跟你一模一樣的令牌。「這一單我替你做了。賞錢，也替你領了。」他笑了笑，「樓裡不養慢的人。」',
    choices: [
      {
        id: 'kill',
        text: '「樓裡也不養多嘴的人。」',
        duel: {
          opponent: 'xueyi_assassin',
          success: {
            text: '你把他的令牌和你的疊在一起交了回去。無面客看了一眼，只說：「兩塊令牌，往後領兩份錢。」',
            effects: [align(-8), fame(3), money(60), add('xueyi_kills'), rel('wumian', 10)],
            recap: { weight: 2, text: '{ageCn}歲那年，樓裡有人搶你的單子。後來那個人的令牌，也歸了你。' },
          },
          failure: {
            text: '他沒有殺你，只在你肩上留了一根針。「記著，是我讓你活的。」',
            effects: [rel('wumian', -10), fame(-2)],
          },
        },
      },
      {
        id: 'yield',
        text: '轉身就走，這一單讓給他',
        outcome: {
          text: '你走出很遠，還聽得見他在屋樑上笑。那天夜裡你想了很久：自己到底是慢，還是不夠狠。',
          effects: [xinxing(1), chiv(1)],
        },
      },
      {
        id: 'report',
        text: '回去，原原本本告訴無面客',
        check: {
          stats: ['meili', 'wuxing'],
          difficulty: 5,
          success: {
            text: '無面客聽完，把一枚針放在了桌上。三天後，樓裡少了一個戴斗笠的人。沒有人再提起他。',
            effects: [rel('wumian', 15), align(-5)],
          },
          failure: {
            text: '無面客聽完，只問了一句：「所以，那一單是誰做成的？」你答不上來。',
            effects: [rel('wumian', -10)],
          },
        },
      },
    ],
  },
  {
    id: 'xueyi_mask',
    kind: 'forced',
    title: '第二張面具',
    priority: 4,
    conditions: { minAge: 24, sects: ['xueyi'], npcAlive: ['wumian'], flagMin: { xueyi_kills: 2 } },
    tags: ['feud', 'sect'],
    text: '無面客第一次約你在白天見面。桌上放著一張白面具，跟他臉上那張一模一樣。「樓裡向來有兩張面具，另一張空了十一年。」他把面具推到你面前，「戴上它，往後的單子由你來派。你的名字、你的臉，從此就沒有了。」',
    choices: [
      {
        id: 'wear',
        text: '戴上面具',
        outcome: {
          text: '面具貼上臉的時候是涼的，很快就跟皮膚一樣暖了。從那天起，江湖上有了兩個無面客，沒有人分得清誰是誰。',
          effects: [flag('xueyi_lord'), align(-20), fame(8), rel('wumian', 20), money(100)],
          recap: { weight: 5, text: '{ageCn}歲那年，你戴上了血衣樓的第二張面具。從此江湖上再也沒有你的名字。' },
        },
      },
      {
        id: 'decline',
        text: '「我只認令牌，不認面具。」',
        outcome: {
          text: '無面客把面具收了回去。「也好。戴上的人，沒有一個摘得下來。」那是你唯一一次聽見他嘆氣。',
          effects: [xinxing(1), rel('wumian', 5), flag('declined_mask')],
        },
      },
      {
        id: 'strike',
        text: '趁他伸手推面具的這一刻出手',
        duel: {
          opponent: 'wumian',
          success: {
            text: '他臉上的面具裂成兩半，掉在了地上。你沒有去看面具底下那張臉。樓裡的帳冊，你一把火全燒了。',
            effects: [flag('wumian_defeated'), flag('xueyi_free'), flag('broke_with_xueyi'), flag('broke_with_sect'), leaveSect(), align(25), fame(8), chiv(4)],
            recap: { weight: 5, text: '{ageCn}歲那年，無面客要把第二張面具給你。你打碎了他臉上的那一張，燒了血衣樓的帳冊。' },
          },
          failure: {
            text: '你只看見他的袖子動了一下。醒來時你躺在城外的亂葬崗，懷裡的令牌不見了。',
            effects: [flag('broke_with_xueyi'), flag('broke_with_sect'), flag('hunted_by_xueyi'), leaveSect(), rel('wumian', -40)],
          },
        },
      },
    ],
  },

  // ==================== 黑風寨 ====================
  {
    id: 'blackwind_seat',
    kind: 'normal',
    title: '交椅',
    scheduledOnly: true,
    conditions: { minAge: 16, notFlags: ['bandit_lord'] },
    tags: ['feud', 'travel'],
    text: '黑風寨的寨主被你綁下山之後，寨裡亂了一個冬天。開春時，一個獨眼的老嘍囉帶著十幾個人找到了你，把那把鬼頭刀橫放在你腳邊。「寨裡還有兩百多張嘴，一半是活不下去才上山的。沒人領著，不是餓死，就是被別的山頭吞掉。」他抬起那隻獨眼，「能打倒寨主的人，才坐得了那把交椅。」',
    choices: [
      {
        id: 'take',
        text: '拿起那把刀，跟他們上山',
        outcome: [
          {
            if: { hasSect: true },
            text: '你上山的消息傳回了師門。名冊上你的名字被劃掉的那天，你正坐在聚義廳的虎皮交椅上，底下跪了一地的人。',
            effects: [
              leaveSect(), flag('broke_with_sect'), flag('bandit_lord'), align(-15), fame(3), money(40),
              later('blackwind_toll', 1, 3, 8), later('blackwind_siege', 6, 10, 14),
            ],
            recap: { weight: 5, text: '{ageCn}歲那年，你離開師門，坐上了黑風寨的交椅。' },
          },
          {
            text: '聚義廳的虎皮交椅比你想的硬。底下跪了一地的人，喊你「大王」。你花了很久才聽慣這兩個字。',
            effects: [
              flag('bandit_lord'), align(-15), fame(3), money(40),
              later('blackwind_toll', 1, 3, 8), later('blackwind_siege', 6, 10, 14),
            ],
            recap: { weight: 5, text: '{ageCn}歲那年，你坐上了黑風寨的交椅。' },
          },
        ],
      },
      {
        id: 'disband',
        text: '打開寨裡的糧倉分了，讓他們回家種地',
        outcome: {
          text: '糧分了三天。有人領了糧就走，有人走到山腳又回頭看。老嘍囉最後一個走，把鬼頭刀留在了空蕩蕩的聚義廳裡。',
          effects: [chiv(4), align(8), fame(2), xinxing(1)],
          recap: { weight: 2, text: '{ageCn}歲那年，黑風寨的人請你當寨主。你打開糧倉，把寨子散了。' },
        },
      },
      {
        id: 'militia',
        text: '帶他們下山，編成護村的鄉勇',
        check: {
          stats: ['meili', 'danshi'],
          difficulty: 6,
          success: {
            text: '你跟七個村子的里正談了一個月。秋收時，當年搶糧的人守在了糧倉外面。村民一開始繞著他們走，後來會端一碗水過去。',
            effects: [chiv(6), fame(5), align(10), flag('blackwind_militia')],
            recap: { weight: 3, text: '{ageCn}歲那年，你把黑風寨的人帶下山，編成了護村的鄉勇。' },
          },
          failure: {
            text: '下山的路上跑了一半的人。剩下的那一半，村子裡沒有人敢收。你把自己的盤纏分了，看著他們各自散去。',
            effects: [chiv(2), money(-20)],
          },
        },
      },
    ],
  },
  {
    id: 'blackwind_toll',
    kind: 'normal',
    title: '買路錢',
    scheduledOnly: true,
    conditions: { flags: ['bandit_lord'] },
    tags: ['feud', 'trade'],
    text: '探子來報，一支三十輛車的商隊明天過山，押車的只有十來個人。聚義廳裡的人都在看你。獨眼的老嘍囉說：「大王，寨裡的糧只夠吃到月底。」',
    choices: [
      {
        id: 'rob',
        text: '「一輛也別放過。」',
        outcome: {
          text: '車上是綢緞和藥材，寨裡吃了三個月的飽飯。有個押車的夥計不肯鬆手，被你的人推下了山溝。你是事後才聽說的。',
          effects: [money(90), align(-12), fame(3), add('bandit_raids')],
        },
      },
      {
        id: 'toll',
        text: '「十抽三。收了錢，保他們平安過山。」',
        outcome: {
          text: '商隊的掌櫃數錢的手一直在抖，過了山卻回頭朝你拱了拱手。半年後，走這條路的商隊反倒多了起來：都說黑風寨收了錢，是真的管事。',
          effects: [money(40), align(-3), fame(4), xinxing(1), flag('bandit_rules')],
          recap: { weight: 3, text: '{ageCn}歲那年，你替黑風寨立了規矩：十抽三，收了錢就保人過山。' },
        },
      },
      {
        id: 'pass',
        text: '「放他們過去。寨裡的糧，我另想辦法。」',
        check: {
          stats: ['danshi', 'meili'],
          difficulty: 6,
          success: {
            text: '底下有人罵你婦人之仁。你把自己那份口糧搬出來，擺在聚義廳中間。沒有人再說話。',
            effects: [chiv(4), align(6), money(-20)],
          },
          failure: {
            text: '當天夜裡，有七八個人偷偷下山，自己把那支商隊劫了。你這個大王，第一次發現自己管不住人。',
            effects: [fame(-2), align(-4)],
          },
        },
      },
    ],
  },
  {
    id: 'blackwind_siege',
    kind: 'normal',
    title: '圍山',
    scheduledOnly: true,
    conditions: { flags: ['bandit_lord'] },
    tags: ['feud'],
    text: '官兵圍了山。這一回來的不是縣裡的差役，是州裡調來的一營兵，把下山的路全堵死了。帶兵的都頭在山腳喊話：只要寨主一個人下山，其餘的人既往不咎。',
    choices: [
      {
        id: 'fight',
        text: '「想要我的頭，自己上來拿。」',
        duel: {
          opponent: 'garrison',
          success: {
            text: '官兵攻了三天，丟下幾十具屍首退了。從此方圓百里，再沒有哪個衙門敢提「黑風寨」三個字。',
            effects: [flag('bandit_king'), fame(8), align(-8)],
            recap: { weight: 5, text: '{ageCn}歲那年，一營官兵圍了黑風寨。三天後，退的是官兵。' },
          },
          failure: {
            text: '寨子燒了一夜。你帶著十幾個人從後山的斷崖爬了下去，回頭只看見半邊天都是紅的。',
            effects: [flag('bandit_lord', false), flag('bandit_fallen'), fame(-3), money(-30)],
            recap: { weight: 4, text: '{ageCn}歲那年，官兵燒了黑風寨。你從後山的斷崖逃了出來。' },
          },
        },
      },
      {
        id: 'surrender',
        text: '把刀插在聚義廳前，一個人走下山',
        outcome: {
          text: '都頭倒是說話算話，山上的人都放了。你在牢裡關了三年。出來那天，牢門外站著那個獨眼的老嘍囉，手裡提著一壺酒。',
          effects: [flag('bandit_lord', false), flag('bandit_redeemed'), chiv(8), align(18), xinxing(2), fame(2)],
          recap: { weight: 5, text: '{ageCn}歲那年，官兵圍山。你一個人走下山，換了寨裡兩百多人的命。' },
        },
      },
      {
        id: 'amnesty',
        text: '「我帶人去襄陽守城，換一紙招安。」',
        requires: { maxYear: 1272 },
        hint: '已經沒有城可以守了',
        outcome: {
          text: '都頭把你的話報了上去。一個月後，黑風寨兩百多人換上號衣，開往襄陽。城頭的老兵看著這群人直搖頭，後來才知道，他們比誰都不怕死。',
          effects: [flag('bandit_lord', false), flag('amnestied'), goTo('xiangyang'), chiv(5), align(12), fame(5)],
          recap: { weight: 5, text: '{ageCn}歲那年，你帶著黑風寨的人受了招安，開往襄陽守城。' },
        },
      },
    ],
  },
];
