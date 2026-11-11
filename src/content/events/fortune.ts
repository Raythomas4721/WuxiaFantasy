// 錢與信物帶出來的事件（設計文件 v0.4 §3.12、M3）。

import type { GameEvent } from '../../engine/types';
import { align, chiv, dropItem, fame, flag, later, meili, money, property, xinxing } from '../dsl';

export const fortuneEvents: GameEvent[] = [
  // ---- 生意：錢生錢的路 ----
  {
    id: 'partner_offer',
    kind: 'normal',
    title: '合夥',
    weight: 10,
    weightMods: [{ if: { ambitions: ['wealth'] }, mult: 3 }],
    conditions: { minAge: 18, maxAge: 55, minMoney: 50 },
    tags: ['trade', 'work'],
    text: '同鄉的老許在鎮上看中了一間要轉手的鋪面，想開一家綢緞莊。本錢還差一截，他問你要不要入夥：「賺了對半分。賠了……我給你做牛做馬。」',
    choices: [
      {
        id: 'big',
        text: '拿出一百文，做大股東',
        requires: { minMoney: 100 },
        outcome: {
          text: '你把一百文交到他手上。他找人寫了契，按了手印，鄭重其事地收進懷裡。',
          effects: [money(-100), flag('partner_big'), later('partner_return', 3, 5, 8)],
        },
      },
      {
        id: 'small',
        text: '拿出五十文，入個小股',
        outcome: {
          text: '你掏了五十文。他也不嫌少，笑著說：「等著分紅。」',
          effects: [money(-50), later('partner_return', 3, 5, 8)],
        },
      },
      {
        id: 'decline',
        text: '這年頭，錢還是放在自己手上',
        outcome: { text: '他有些失望，還是拱了拱手：「那我再去問問別人。」', effects: [xinxing(1)] },
      },
    ],
  },
  {
    id: 'partner_return',
    kind: 'normal',
    title: '分紅',
    scheduledOnly: true,
    tags: ['trade'],
    text: '幾年過去，老許的綢緞莊開起來了。這天他提著一壺酒來找你，說要跟你算一算這幾年的帳。',
    choices: [
      {
        id: 'cash',
        text: '把本錢連分紅一起拿回來',
        check: {
          stats: ['fuyuan', 'wuxing'],
          difficulty: 5,
          success: [
            {
              if: { flags: ['partner_big'] },
              text: '生意比你想的好。他把一包沉甸甸的銅錢推到你面前：「一文不少，都在這裡。」',
              effects: [money(320), flag('partner_paid')],
              recap: { weight: 2, text: '{ageCn}歲那年，你入股的鋪子賺了錢，分紅是本錢的三倍。' },
            },
            { text: '生意不錯。他把本錢和分紅一起數給你，數了兩遍。', effects: [money(150), flag('partner_paid')] },
          ],
          failure: [
            { if: { flags: ['partner_big'] }, text: '這幾年兵荒馬亂，生意不好做。他東拼西湊，也只還得出一小半。', effects: [money(40)] },
            { text: '這幾年兵荒馬亂，生意不好做。他只還得出幾十個銅板，一臉愧疚。', effects: [money(20)] },
          ],
        },
      },
      {
        id: 'stake',
        text: '錢先不拿，換成鋪子的一份',
        requires: { flags: ['partner_big'] },
        hint: '入大股的人才換得到',
        check: {
          stats: ['fuyuan', 'wuxing'],
          difficulty: 5,
          success: {
            text: '他想了想，找人重寫了一張契：這間鋪子，往後算你一份。從此每到年底，都有人把帳本和錢一起送到你家。',
            effects: [property('shop'), flag('partner_paid')],
            recap: { weight: 3, text: '{ageCn}歲那年，你把入夥的錢換成了鋪子的一份，從此每年都有進帳。' },
          },
          failure: {
            text: '契還沒寫好，鋪子就讓官差以欠稅的名目封了。你的本錢，連同那張紙，一起沒了。',
            effects: [flag('partner_lost')],
          },
        },
      },
    ],
  },
  {
    id: 'rich_client',
    kind: 'normal',
    title: '大主顧',
    weight: 14,
    repeatable: true,
    cooldown: 4,
    maxTimes: 3,
    conditions: { minAge: 18, property: 'shop' },
    tags: ['trade', 'work'],
    text: '城裡一戶大戶人家要辦喜事，管家一口氣在你的鋪子裡訂了三個月的貨，說好了貨到付錢。',
    choices: [
      {
        id: 'honest',
        text: '照市價，一樣一樣挑最好的',
        outcome: { text: '喜事辦得風風光光，管家特地來道謝，說往後府上的貨都在你這裡訂。', effects: [money(120), fame(1)] },
      },
      {
        id: 'gouge',
        text: '他們不差錢，價錢翻一倍',
        outcome: { text: '管家眉頭也沒皺一下就付了。只是那以後，你再也沒見過那戶人家的人。', effects: [money(200), align(-4), chiv(-2)] },
      },
      {
        id: 'poor',
        text: '多訂的那些，便宜賣給街坊',
        outcome: { text: '你少賺了一些。街坊鄰居提起你的鋪子，都說那東家實在。', effects: [money(70), chiv(3), meili(1)] },
      },
    ],
  },
  {
    id: 'good_harvest',
    kind: 'normal',
    title: '豐年',
    weight: 12,
    repeatable: true,
    cooldown: 4,
    maxTimes: 3,
    conditions: { minAge: 16, property: 'land' },
    tags: ['village', 'work'],
    text: '這一年風調雨順，你名下那塊田收了往年兩倍的穀子。佃戶們扛著穀子來交租，一個個笑得合不攏嘴。',
    choices: [
      {
        id: 'sell',
        text: '趁新穀上市，全賣了',
        outcome: { text: '穀價不高，但勝在穩當。', effects: [money(90)] },
      },
      {
        id: 'hoard',
        text: '囤起來，等荒年再賣',
        note: '過幾年才知道值多少',
        outcome: {
          text: '你租了一間倉，把穀子一袋一袋碼進去，鎖上了門。',
          effects: [later('famine_sale', 2, 4, 6)],
        },
      },
      {
        id: 'share',
        text: '今年的租，減一半',
        outcome: { text: '佃戶們愣了半天，有個老佃戶當場給你跪下了。', effects: [money(40), chiv(4), meili(1)] },
      },
    ],
  },
  {
    id: 'famine_sale',
    kind: 'normal',
    title: '荒年',
    scheduledOnly: true,
    tags: ['village', 'work'],
    text: '這一年先旱後蝗，米價一個月翻了三倍。逃荒的人從北邊一路走下來，你的糧倉還是滿的。',
    choices: [
      {
        id: 'high',
        text: '照市價賣',
        outcome: {
          text: '糧一天就賣光了。你數錢的時候，聽見倉外有人在哭。',
          effects: [money(260), align(-4)],
          recap: { weight: 2, text: '{ageCn}歲那年鬧荒，你把豐年囤下的糧高價賣了，賺了一大筆。' },
        },
      },
      {
        id: 'fair',
        text: '照豐年的價錢賣',
        outcome: { text: '買到糧的人千恩萬謝。你少賺了一大半，可那一年，鎮上沒有人餓死。', effects: [money(100), chiv(4), fame(2)] },
      },
      {
        id: 'give',
        text: '開倉放糧',
        outcome: {
          text: '你在倉門口支了一口大鍋，從早煮到晚。三個月後倉空了，鎮上的人說起你，都叫一聲「善人」。',
          effects: [chiv(8), align(4), fame(4)],
          recap: { weight: 3, text: '{ageCn}歲那年鬧荒，你開倉放糧，救了一鎮的人。' },
        },
      },
    ],
  },
  {
    id: 'escort_chief',
    kind: 'normal',
    title: '總鏢頭',
    weight: 25,
    conditions: { minAge: 25, maxAge: 60, sects: ['changfeng'], flagMin: { escort_success: 1 }, notFlags: ['chief_escort'] },
    tags: ['sect', 'work'],
    text: '老總鏢頭的腿傷越來越重，再也騎不了馬了。這天他把鏢局上下叫到堂前，當著所有人的面，把那面跟了他三十年的鏢旗遞到你面前。',
    choices: [
      {
        id: 'accept',
        text: '接過鏢旗',
        outcome: {
          text: '你接過鏢旗，一屋子的鏢師齊聲喊了一句「總鏢頭」。那天晚上你一個人在院子裡坐到天亮，想著這面旗以後要插到哪裡去。',
          effects: [flag('chief_escort'), fame(8)],
          recap: { weight: 5, text: '{ageCn}歲那年，你接過了長風鏢局的鏢旗，當上了總鏢頭。' },
        },
      },
      {
        id: 'decline',
        text: '推給資歷更老的鏢師',
        outcome: {
          text: '你說自己還年輕，把位子讓給了跟著老總鏢頭走了二十年鏢的周師兄。他拍拍你的肩：「這份情，我記著。」',
          effects: [xinxing(2), chiv(3)],
        },
      },
    ],
  },
  {
    id: 'xueyi_exposed',
    kind: 'normal',
    title: '令牌',
    weight: 8,
    conditions: { minAge: 18, items: ['xueyi_ling'] },
    tags: ['feud'],
    text: '一位素有俠名的前輩來你家作客，無意間看見了你行囊裡那塊血衣令。他的臉色一下子變了，手按上了劍柄：「這東西，怎麼會在你這裡？」',
    choices: [
      {
        id: 'smash',
        text: '當著他的面，把令牌砸碎',
        outcome: {
          text: '令牌碎成了兩半。前輩盯著你看了很久，最後鬆開了劍柄：「我就當沒看見。你好自為之。」',
          effects: [dropItem('xueyi_ling'), align(6), xinxing(1)],
        },
      },
      {
        id: 'lie',
        text: '說是從一個死人身上撿來的',
        check: {
          stats: ['meili', 'xinxing'],
          difficulty: 6,
          success: { text: '你說得有鼻子有眼。前輩將信將疑，臨走前還提醒你小心血衣樓的人。', effects: [meili(1)] },
          failure: {
            text: '前輩冷笑一聲，拂袖而去。沒過多久，你身上帶著血衣令的事，就傳遍了半個江湖。',
            effects: [align(-12), fame(-3), flag('exposed_xueyi')],
          },
        },
      },
      {
        id: 'silence',
        text: '不能讓他把這件事說出去',
        requires: { minMartial: 2 },
        outcome: {
          text: '那天夜裡，前輩沒能走出你家的院子。你把他埋在後山，回來時天已經亮了。',
          effects: [align(-18), chiv(-10), flag('silenced_witness')],
          recap: { weight: 4, text: '有人看見了你的血衣令。你讓他永遠閉上了嘴。' },
        },
      },
    ],
  },
];
