// 青冥論武（1242、1254、1266，青冥山）與青衡劍府（設計文件 v0.4 §2.7、§3.11）。
// 論武是同一年連打三場：上山報名 → 預賽 → 正賽 → 決賽，用 next() 接續，不推進時間。

import type { Condition, GameEvent, Outcome } from '../../engine/types';
import {
  add, chiv, fame, flag, goTo, item, join, meet, next, rel, wuxing, xinxing, xp,
} from '../dsl';

const FIRST: Condition = { maxYear: 1250 };
const SECOND: Condition = { minYear: 1251, maxYear: 1260 };
const THIRD: Condition = { minYear: 1261 };

const champion: Outcome = {
  text: '最後一招落下，整座青冥台安靜了一瞬，然後爆出震天的喝采。主持論武的老人把一柄青玉劍穗交到你手裡：「這一屆，是你。」',
  effects: [flag('lunwu_champion'), fame(15), chiv(3), meet('xie_lingshuang'), rel('xie_lingshuang', 15)],
  recap: { weight: 6, text: '{ageCn}歲那年，你在青冥論武奪魁。台下的喝采聲，你記了一輩子。' },
};

const finalist: Outcome = {
  text: '你輸了，輸得心服口服。下台的時候，滿山的人卻都在替你鼓掌：能走到決賽的，這一屆只有兩個人。',
  effects: [flag('lunwu_finalist'), fame(6), wuxing(1), meet('xie_lingshuang'), rel('xie_lingshuang', 5)],
  recap: { weight: 4, text: '{ageCn}歲那年，你在青冥論武一路打進了決賽。' },
};

export const lunwuEvents: GameEvent[] = [
  {
    id: 'lunwu',
    kind: 'forced',
    title: '青冥論武',
    priority: 5,
    repeatable: true,
    maxTimes: 3,
    conditions: {
      minAge: 13,
      any: [
        { minYear: 1242, maxYear: 1242 },
        { minYear: 1254, maxYear: 1254 },
        { minYear: 1266, maxYear: 1266 },
      ],
    },
    tags: ['martial', 'sparring'],
    text: [
      {
        if: FIRST,
        text: '青冥山上要辦論武了。這是頭一回，各門各派的年輕弟子都要上青冥台，比一比誰的功夫最好。山下的客棧住滿了背刀佩劍的人。',
      },
      {
        if: SECOND,
        text: '十二年過去，青冥論武又要開了。上一屆的事蹟還在茶館裡被人說著，這一屆的人已經在山道上排成了長龍。',
      },
      { text: '第三屆青冥論武。江湖上的人說，這也許是最後一屆了——北邊的仗越打越近，誰知道十二年後還有沒有江湖。' },
    ],
    choices: [
      {
        id: 'enter',
        text: '上山報名',
        requires: { minMartial: 1 },
        hint: '至少要練過一門武學',
        outcome: {
          text: '你在報名的冊子上寫下自己的名字。執事看了你一眼，在名字旁邊畫了一個小圈。',
          effects: [add('lunwu_entered'), meet('xie_lingshuang'), item('lunwu_token'), next('lunwu_prelim')],
        },
      },
      {
        id: 'watch',
        text: '上山看熱鬧',
        outcome: {
          text: '你擠在青冥台下看了三天。主持論武的是青衡劍府的謝凌霜，一身素白，從頭到尾沒說幾句話。台上的人出手之快，你有一大半沒看清楚；看清楚的那一小半，夠你想上好幾年。',
          effects: [wuxing(1), flag('lunwu_watched')],
        },
      },
      {
        id: 'skip',
        text: '不湊這個熱鬧',
        outcome: { text: '你照常過日子。過了幾個月，才從說書人嘴裡聽到這一屆的結果。', effects: [xinxing(1)] },
      },
    ],
  },
  {
    id: 'lunwu_prelim',
    kind: 'normal',
    title: '論武・預賽',
    scheduledOnly: true,
    repeatable: true,
    tags: ['martial', 'sparring'],
    text: '預賽在山腰的平台上，一天要比幾十場。和你抽到同一組的，是個風塵僕僕的江湖客，腰上的刀鞘磨得發亮。',
    choices: [
      {
        id: 'fight',
        text: '上台',
        duel: {
          opponent: 'lunwu_wanderer',
          success: { text: '那人收刀抱拳：「後生可畏。」你過了預賽，名字被寫上了青冥台的木牌。', effects: [fame(2), next('lunwu_main')] },
          failure: {
            text: '你輸了。那人扶你起來，說：「別急，看完再走，台上那些人的功夫，夠你學十年。」你留下來看完了整場論武。',
            effects: [wuxing(1), flag('lunwu_watched')],
          },
        },
      },
      {
        id: 'quit',
        text: '看了幾場，覺得自己還差得遠，悄悄下山',
        outcome: { text: '你沒有上台。下山的路上，你一直在想剛才看到的那幾招。', effects: [xinxing(1), wuxing(1)] },
      },
    ],
  },
  {
    id: 'lunwu_main',
    kind: 'normal',
    title: '論武・正賽',
    scheduledOnly: true,
    repeatable: true,
    tags: ['martial', 'sparring'],
    text: [
      {
        if: { flags: ['rival_bully'], notFlags: ['rival_settled'], fought: { who: 'rival', last: ['win'] } },
        text: '正賽抽籤的結果出來了。你的對手，是{rival}。上回交手是你贏了，他當時咬著牙認了——可他現在看你的眼神，一點也不像認了。「青冥台上，天下人都看著。這回不一樣。」',
      },
      {
        if: { flags: ['rival_bully'], notFlags: ['rival_settled'], fought: { who: 'rival', last: ['lose', 'yield'] } },
        text: '正賽抽籤的結果出來了。你的對手，是{rival}。從小到大，你在他手下就沒贏過。他站在台的另一頭，對你笑了笑：「又是你？我都替你累了。」',
      },
      {
        if: { flags: ['rival_bully'], notFlags: ['rival_settled'] },
        text: '正賽抽籤的結果出來了。你的對手，是{rival}。他站在台的另一頭，對你笑了笑：「我等這一天，等很久了。」',
      },
      { text: '正賽的對手是青衡劍府的一名弟子，年紀和你差不多，出劍前規規矩矩地行了一禮。' },
    ],
    choices: [
      {
        id: 'rival',
        text: '這一次，把帳算清楚',
        requires: { flags: ['rival_bully'], notFlags: ['rival_settled'] },
        hidden: true,
        duel: {
          opponent: 'rival_lunwu',
          success: [
            {
              if: { fought: { who: 'rival', last: ['lose', 'yield'] } },
              text: '{rival}倒在台上，半天爬不起來。從小到大，這是你第一次贏他——偏偏是在天下人面前。台下有人認出了他，竊竊私語。你沒有看他，轉身走下了台。',
              effects: [fame(5), flag('beat_rival_lunwu'), flag('rival_settled'), rel('rival', -10), next('lunwu_final')],
              recap: { weight: 4, text: '{ageCn}歲那年，你在青冥台上第一次贏了{rival}，當著天下人的面。' },
            },
            {
              text: '{rival}倒在台上，半天爬不起來。台下有人認出了他，竊竊私語。你沒有看他，轉身走下了台。',
              effects: [fame(5), flag('beat_rival_lunwu'), flag('rival_settled'), rel('rival', -10), next('lunwu_final')],
              recap: { weight: 4, text: '{ageCn}歲那年，你在青冥台上當著天下人的面，打敗了{rival}。' },
            },
          ],
          failure: {
            text: '你輸了。{rival}站在你面前，笑得很大聲。整座青冥台都聽得見。',
            effects: [flag('lost_to_rival'), fame(1), xinxing(1)],
            recap: { weight: 3, text: '{ageCn}歲那年，你在青冥台上輸給了{rival}。' },
          },
        },
      },
      {
        id: 'disciple',
        text: '還禮，出手',
        requires: { any: [{ notFlags: ['rival_bully'] }, { flags: ['rival_settled'] }] },
        hidden: true,
        duel: {
          opponent: 'jianfu_disciple',
          success: { text: '劍府弟子的劍被你挑飛了。他愣了一下，竟然笑著向你行禮：「受教了。」', effects: [fame(4), next('lunwu_final')] },
          failure: { text: '劍府弟子的劍法嚴謹得像一堵牆，你怎麼也找不到縫。你輸了，卻覺得學到了不少。', effects: [fame(1), wuxing(1)] },
        },
      },
      {
        id: 'yield',
        text: '拱手認輸',
        outcome: { text: '你抱拳下台。有人噓你，也有人說你知進退。', effects: [xinxing(1)] },
      },
    ],
  },
  {
    id: 'lunwu_final',
    kind: 'normal',
    title: '論武・決賽',
    scheduledOnly: true,
    repeatable: true,
    tags: ['martial', 'sparring'],
    text: [
      { if: FIRST, text: '決賽。你的對手是青衡劍府的大弟子，劍府這一代最被看好的人。他的劍還沒出鞘，台下已經有人在押他贏了。' },
      {
        if: { ...SECOND, notFlags: ['dead_xie_lingshuang'] },
        text: '決賽。你的對手是謝凌霜——青衡劍府的新掌門，人稱「寒衣劍主」。她一身素白，劍尖斜指地面，看你的眼神像在看一個學生。',
      },
      { text: '決賽。你的對手是青衡劍府這一代的新秀，聽說是謝凌霜親手教出來的。台下，謝凌霜本人也在看著。' },
    ],
    choices: [
      {
        id: 'first',
        text: '拔劍',
        requires: FIRST,
        hidden: true,
        duel: { opponent: 'jianfu_senior', success: champion, failure: finalist },
      },
      {
        id: 'second',
        text: '拔劍',
        requires: { ...SECOND, notFlags: ['dead_xie_lingshuang'] },
        hidden: true,
        duel: { opponent: 'xie_lingshuang', success: champion, failure: finalist },
      },
      {
        id: 'third',
        text: '拔劍',
        requires: { any: [THIRD, { ...SECOND, flags: ['dead_xie_lingshuang'] }] },
        hidden: true,
        duel: { opponent: 'jianfu_heir', success: champion, failure: finalist },
      },
      {
        id: 'yield',
        text: '能走到這裡就夠了，拱手認輸',
        outcome: {
          text: '你收起兵器，向對手深深一揖。全場愣了一下，然後有人帶頭鼓起掌來。',
          effects: [flag('lunwu_finalist'), fame(4), xinxing(2)],
          recap: { weight: 3, text: '{ageCn}歲那年，你打進了青冥論武的決賽，卻在最後一場拱手認輸。' },
        },
      },
    ],
  },
  // ---- 青衡劍府 ----
  {
    id: 'jianfu_exam',
    kind: 'normal',
    title: '劍府考核',
    weight: 30,
    weightMods: [
      { if: { flags: ['world_jianfu_rise'] }, mult: 1.5 },
      { if: { flags: ['world_jianfu_fall'] }, mult: 0.5 },
      { if: { flags: ['seek_sword'] }, mult: 2 },
    ],
    repeatable: true,
    cooldown: 3,
    maxTimes: 2,
    conditions: {
      minAge: 13, maxAge: 30, hasSect: false, minAlignment: 0,
      any: [{ regions: ['qingming'] }, { flags: ['lunwu_watched'] }, { flagMin: { lunwu_entered: 1 } }, { flags: ['seek_sword'] }],
    },
    tags: ['martial', 'sect'],
    text: [
      { if: { regions: ['qingming'], flags: ['world_jianfu_fall'] }, text: '青衡劍府的山門冷冷清清。聽說劍府內鬥，走了不少人，這回開山門，考官的臉色也不太好看。考的只有一件事：和考官過幾招。' },
      { if: { regions: ['qingming'], flags: ['world_jianfu_rise'] }, text: '青衡劍府的山門前人山人海。這幾年劍府名聲正盛，各地的少年都想進來。考的只有一件事：和考官過幾招。' },
      { if: { regions: ['qingming'] }, text: '青衡劍府的山門前排著長隊。劍府三年開一次山門，考的只有一件事：和考官過幾招。' },
      { text: '你一直忘不了青冥台上的那些劍。聽說青衡劍府又開山門收人了，你收拾行囊，上了青冥山。山門前排著長隊，考的只有一件事：和考官過幾招。' },
    ],
    choices: [
      {
        id: 'take',
        text: '排進隊伍裡',
        duel: {
          opponent: 'jianfu_examiner',
          success: {
            text: '考官收劍，點了點頭。三天後，你換上了劍府的青衫。入門那天，掌門謝凌霜從你們面前走過，只說了一句：「劍府的劍，不為自己出。」',
            effects: [join('qinghen'), goTo('qingming'), xp('qinghen', 4), meet('xie_lingshuang'), rel('xie_lingshuang', 10)],
            recap: { weight: 4, text: '{ageCn}歲那年，你考進了青衡劍府。' },
          },
          failure: { text: '考官搖搖頭：「底子不差，火候不夠。三年後再來。」', effects: [flag('jianfu_failed'), wuxing(1)] },
        },
      },
      {
        id: 'leave',
        text: '看了一眼長隊，轉身下山',
        outcome: { text: '劍府的規矩太多。你想，自己大概不是那塊料。', effects: [xinxing(1)] },
      },
    ],
  },
];
