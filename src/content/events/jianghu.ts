// 正邪與門派：血衣樓、逐出師門、師命與良知（設計文件 v0.4 §3.10）。

import type { GameEvent } from '../../engine/types';
import {
  add, align, chiv, danshi, die, fame, flag, health, item, join, later, leaveSect, master, meet, money, rel, wuxing, xinxing, xp,
} from '../dsl';

export const jianghuEvents: GameEvent[] = [
  {
    id: 'wumian_witness',
    kind: 'normal',
    title: '白面具',
    weight: 5,
    weightMods: [{ if: { flags: ['world_xueyi_rampant'] }, mult: 2 }, { if: { flags: ['world_xueyi_quiet'] }, mult: 0.4 }],
    conditions: { minAge: 16, maxAge: 50, minYear: 1245, minAlignment: 0, not: { sects: ['xueyi'] }, notFired: ['xueyi_invite'] },
    tags: ['feud', 'tavern', 'travel'],
    enterEffects: [meet('wumian')],
    text: '你在客棧借宿的那一夜，隔壁住著一位赴宴歸來的掌門。三更時分，你被一聲極輕的悶響驚醒。推開窗，對面的屋簷上站著一個人，月光照在他臉上：那是一張沒有五官的白面具。他朝你這邊偏了偏頭，像是在記住你。',
    choices: [
      {
        id: 'chase',
        text: '翻上屋頂追他',
        check: {
          stats: ['danshi', 'gengu'],
          difficulty: 7,
          success: {
            text: '你追了三條街，一把扯下他的一截袖子。他回頭看了你一眼，消失在夜色裡。那截黑袖子的裡襯，縫著一道血紅的布條。',
            effects: [fame(4), chiv(3), rel('wumian', -30), flag('wumian_marked')],
            recap: { weight: 3, text: '{ageCn}歲那年，你在客棧的屋頂上追過血衣樓的無面客，扯下了他一截袖子。' },
          },
          failure: {
            text: '你剛翻上屋簷，一根細針擦著你的耳朵釘進了瓦裡。等你回過神，屋頂上已經空無一人。',
            effects: [health(-15), rel('wumian', -10)],
          },
        },
      },
      {
        id: 'save',
        text: '先去隔壁救人',
        check: {
          stats: ['xinxing'],
          difficulty: 6,
          skill: 'baicao',
          success: {
            text: '掌門的胸口插著一根細如牛毛的針。你按住傷口，喊醒了整間客棧。天亮時他還活著，握著你的手，說不出話。',
            effects: [chiv(6), fame(3), align(3)],
            recap: { weight: 2, text: '{ageCn}歲那年，你從血衣樓的針下救回了一位掌門。' },
          },
          failure: {
            text: '你趕到時，掌門已經沒了氣息。床頭放著一件疊得整整齊齊的血衣。',
            effects: [xinxing(1)],
          },
        },
      },
      {
        id: 'hide',
        text: '關上窗，當作什麼也沒看見',
        outcome: { text: '你一夜沒睡。第二天，整條街都在傳，那位掌門死在了自己的床上。', effects: [flag('ignored_wumian')] },
      },
    ],
  },
  // ---- 血衣樓 ----
  {
    id: 'xueyi_invite',
    kind: 'normal',
    title: '無面客',
    weight: 30,
    weightMods: [{ if: { flags: ['world_xueyi_rampant'] }, mult: 2 }, { if: { flags: ['world_xueyi_quiet'] }, mult: 0.4 }],
    conditions: {
      minAge: 18,
      maxAge: 50,
      minYear: 1240,
      notFlags: ['broke_with_xueyi'],
      not: { sects: ['xueyi'] },
      any: [
        { maxAlignment: -30 },
        { flags: ['blood_feud'], notFlags: ['revenge_done', 'feud_resolved'], maxHealth: 40 },
      ],
    },
    tags: ['feud', 'tavern'],
    enterEffects: [meet('wumian')],
    text: [
      {
        if: { flags: ['blood_feud'], notFlags: ['revenge_done', 'feud_resolved'] },
        text: '那天夜裡，你房裡的燈自己滅了。黑暗中有人坐在桌邊，臉上是一張沒有五官的白面具。「疤臉在哪裡，樓裡查得到。」那人的聲音很輕，「你只要點個頭。」',
      },
      { text: '那天夜裡，你房裡的燈自己滅了。黑暗中有人坐在桌邊，臉上是一張沒有五官的白面具。「你做的那些事，樓裡都知道。」那人的聲音很輕，「這世上容不下你的地方越來越多了。血衣樓容得下。」' },
    ],
    choices: [
      {
        id: 'join',
        text: '接過他放在桌上的血衣令',
        outcome: [
          {
            if: { hasSect: true },
            text: '你接過令牌，第二天就不辭而別。從此師門的名冊上，劃掉了你的名字。',
            effects: [join('xueyi'), master('wumian'), xp('yeyu', 3), align(-15), rel('wumian', 20), flag('broke_with_sect'), item('xueyi_ling'), later('xueyi_exposed', 3, 8, 12)],
            recap: { weight: 4, text: '{ageCn}歲那年，你背棄師門，接下了血衣樓的令牌。' },
          },
          {
            text: '令牌是冰的。無面客站起身：「從今天起，你沒有名字了。」',
            effects: [join('xueyi'), master('wumian'), xp('yeyu', 3), align(-15), rel('wumian', 20), item('xueyi_ling'), later('xueyi_exposed', 3, 8, 12)],
            recap: { weight: 4, text: '{ageCn}歲那年，你接下了血衣樓的令牌。' },
          },
        ],
      },
      {
        id: 'refuse',
        text: '「我還沒走到那一步。」',
        outcome: {
          text: '面具後面好像笑了一下。等你重新點亮燈，桌邊已經沒有人了。',
          effects: [rel('wumian', -10), xinxing(1), flag('refused_xueyi')],
        },
      },
      {
        id: 'expose',
        text: '假意答應，轉頭就把他的行蹤告訴官府和各派',
        check: {
          stats: ['danshi', 'wuxing'],
          difficulty: 6,
          success: {
            text: '官兵圍住那間破廟時，無面客已經走了，卻留下了一屋子血衣樓的帳冊。江湖上都說，是你讓血衣樓第一次吃了虧。',
            effects: [align(20), fame(6), chiv(4), rel('wumian', -40), flag('exposed_xueyi'), flag('xueyi_enemy')],
            recap: { weight: 3, text: '你設局揭出了血衣樓的帳冊，從此成了血衣樓的眼中釘。' },
          },
          failure: {
            text: '你還沒走出巷口，一根細針已經釘進了你的肩膀。你躺了一個月，才勉強下得了床。',
            effects: [health(-30), rel('wumian', -40), flag('xueyi_enemy')],
          },
        },
      },
    ],
  },
  {
    id: 'xueyi_contract',
    kind: 'normal',
    title: '血衣令',
    weight: 18,
    weightMods: [{ if: { flags: ['world_xueyi_rampant'] }, mult: 2 }, { if: { flags: ['world_xueyi_quiet'] }, mult: 0.4 }],
    repeatable: true,
    cooldown: 2,
    maxTimes: 3,
    conditions: { minAge: 18, maxAge: 60, sects: ['xueyi'] },
    tags: ['feud', 'sect'],
    vars: {
      target: [
        '一個欠了賭債不還的鹽商',
        '一個逼死了佃戶女兒的縣丞',
        '一個鏢局的鏢頭，委託人沒說為什麼',
        '一個在茶館裡說錯了話的書生',
        '一個準備去官府告發血衣樓的帳房先生',
      ],
    },
    text: '令牌底下壓著一張紙條，紙條上只有一個地名，和{target}。',
    choices: [
      {
        id: 'do',
        text: '照辦',
        duel: {
          opponent: 'bodyguard',
          success: {
            text: '你回來的時候，天還沒亮。令牌底下多了一包銀子。你洗了很久的手。',
            effects: [money(120), align(-12), fame(4), xp('yeyu', 2), add('xueyi_kills')],
          },
          failure: {
            text: '目標身邊有護衛。你帶著一身傷逃了回來，無面客看著你，什麼也沒說。',
            effects: [health(-10), align(-5)],
          },
        },
      },
      {
        id: 'spare',
        text: '放走目標，回去說失手了',
        check: {
          stats: ['wuxing'],
          difficulty: 6,
          success: {
            text: '你讓那人連夜出城，又在現場留下了打鬥的痕跡。無面客聽完你的回報，只說了一句：「下不為例。」',
            effects: [chiv(5), xinxing(1), add('xueyi_mercy')],
          },
          failure: {
            text: '那人出城後到處跟人說是你放了他。消息傳回樓裡，有人在你的茶裡下了點東西——不致命，只是提醒。',
            effects: [health(-20), rel('wumian', -30), flag('xueyi_suspect')],
          },
        },
      },
      {
        id: 'quit',
        text: '把令牌放回桌上，退出血衣樓',
        check: {
          stats: ['danshi'],
          difficulty: 7,
          success: {
            text: '無面客看著那塊令牌，很久才開口：「你是第一個活著走出去的。」你走出門的時候，背上全是冷汗。',
            effects: [leaveSect(), flag('broke_with_sect'), flag('broke_with_xueyi'), align(20), xinxing(2)],
            recap: { weight: 5, text: '你把血衣令放回桌上，活著走出了血衣樓。' },
          },
          failure: [
            {
              if: { maxHealth: 45 },
              text: '你剛轉身，就聽見一聲極輕的風響。你倒下的時候想：原來夜雨針真的不疼。',
              effects: [die('xueyi')],
            },
            {
              text: '你逃出來了，背上卻中了三根針。從此你每換一個地方住，都會先看看屋頂。',
              effects: [leaveSect(), flag('broke_with_sect'), flag('broke_with_xueyi'), flag('hunted_by_xueyi'), health(-35), align(10)],
              recap: { weight: 5, text: '你背叛了血衣樓，從此一生都在躲他們的追殺。' },
            },
          ],
        },
      },
    ],
  },
  // ---- 門派與正邪 ----
  {
    id: 'sect_expel',
    kind: 'forced',
    title: '逐出師門',
    priority: 4,
    conditions: { minAge: 16, hasSect: true, not: { sects: ['xueyi'] }, maxAlignment: -30 },
    tags: ['sect'],
    vars: {
      hall: [
        { if: { sects: ['yaogu'] }, values: ['林鶴年把你叫到藥廬，桌上攤著一張寫滿你名字的狀子'] },
        { if: { sects: ['changfeng'] }, values: ['總鏢頭在大堂上擺了一張空椅子，所有鏢師都站在兩邊'] },
        { if: { sects: ['yijun'] }, values: ['韓守義在校場上點了你的名，身後站著幾個你得罪過的人'] },
        { if: { sects: ['baina'] }, values: ['葛百衲把百衲會的老人都叫到了城隍廟'] },
      ],
    },
    text: '你在外面做的那些事，終於傳回了門裡。{hall}。「門裡容不下你這樣的人。」',
    choices: [
      {
        id: 'repent',
        text: '跪下認錯，任憑處置',
        outcome: {
          text: '你在祖師像前跪了三天三夜。最後，他們讓你留了下來，只是從此再也沒人讓你帶隊。',
          effects: [align(20), fame(-5), xinxing(2), flag('repented')],
          recap: { weight: 3, text: '你在師門面前跪了三天三夜，求來了一個重新做人的機會。' },
        },
      },
      {
        id: 'leave',
        text: '不必他們趕，你自己走',
        outcome: {
          text: '你把門派的信物放在桌上，頭也不回地走出大門。身後有人說了一句「好自為之」，你沒有回頭。',
          effects: [leaveSect(), flag('broke_with_sect'), flag('expelled'), danshi(1)],
          recap: { weight: 4, text: '{ageCn}歲那年，你被逐出了師門。' },
        },
      },
      {
        id: 'expose',
        text: '當眾揭出門裡更不乾淨的事',
        check: {
          stats: ['meili', 'danshi'],
          difficulty: 7,
          success: {
            text: '你一件一件說出來，滿堂的人臉色越來越難看。最後被趕出去的，是那個寫狀子的人。',
            effects: [fame(6), align(10), flag('exposed_sect')],
          },
          failure: {
            text: '沒有人信你。你被當眾逐出了門，連帶著還多了一條「誣陷同門」的罪名。',
            effects: [leaveSect(), flag('broke_with_sect'), flag('expelled'), fame(-5)],
            recap: { weight: 4, text: '{ageCn}歲那年，你被逐出了師門。' },
          },
        },
      },
    ],
  },
  {
    id: 'sect_order',
    kind: 'normal',
    title: '師命',
    weight: 10,
    conditions: { minAge: 20, maxAge: 50, sects: ['yaogu', 'changfeng', 'yijun', 'baina'] },
    tags: ['sect'],
    vars: {
      order: [
        { if: { sects: ['yaogu'] }, values: ['谷裡新配了一味藥，還沒人試過。長老要你先拿到山下，給那些付不起藥錢的流民吃'] },
        { if: { sects: ['changfeng'] }, values: ['這一趟鏢押的是官府要的「逃犯」。你掀開車簾，裡面是一家老小，最小的孩子才五歲'] },
        { if: { sects: ['yijun'] }, values: ['為了不讓蒙古人在城外就地取糧，韓守義下令燒掉城北的村子。可村裡還有幾個不肯走的老人'] },
        { if: { sects: ['baina'] }, values: ['有個大戶出錢，要百衲會的人去砸一家米鋪。會裡的長老已經收了錢'] },
      ],
    },
    text: '{order}。這是門裡交代下來的事。',
    choices: [
      {
        id: 'obey',
        text: '師命難違',
        outcome: {
          text: '你照做了。事情辦完那天晚上，你一個人喝了很多酒。',
          effects: [add('sect_merit'), chiv(-6), xinxing(-1), flag('obeyed_order')],
          recap: { weight: 2, text: '師門交代下來一件你心裡不願意做的事。你還是做了。' },
        },
      },
      {
        id: 'defy',
        text: '當面抗命',
        outcome: {
          text: '你說了「不」。滿堂的人都看著你。那天之後，你離開了師門。江湖上有人說你忘恩負義，也有人說你是條漢子。',
          effects: [leaveSect(), flag('broke_with_sect'), flag('defied_order'), chiv(8), align(-5), fame(3)],
          recap: { weight: 4, text: '師門要你做一件你認為不對的事。你當面抗命，從此離開了師門。' },
        },
      },
      {
        id: 'secret',
        text: '表面答應，暗中把事情辦砸',
        check: {
          stats: ['wuxing'],
          difficulty: 6,
          success: {
            text: '事情「出了差錯」，誰也怪不到你頭上。只有你自己知道，那幾個人因此活了下來。',
            effects: [chiv(5), wuxing(1), flag('quiet_defiance')],
          },
          failure: {
            text: '你做的手腳被人看穿了。這比當面抗命更讓人難堪——你被趕出了師門。',
            effects: [leaveSect(), flag('broke_with_sect'), flag('expelled'), chiv(5), fame(-2)],
            recap: { weight: 4, text: '你暗中違抗師命，被發現後逐出了師門。' },
          },
        },
      },
    ],
  },
];
