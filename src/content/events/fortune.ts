// 錢與信物帶出來的事件（設計文件 v0.4 §3.12、M3）。

import type { GameEvent } from '../../engine/types';
import { align, chiv, dropItem, fame, flag, meili, xinxing } from '../dsl';

export const fortuneEvents: GameEvent[] = [
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
