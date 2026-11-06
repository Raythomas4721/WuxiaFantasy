// 錢的用途：市集、置產；行囊裡的信物（設計文件 v0.4 §3.12）。價格與收益都集中在這裡。

import type { GameEffect, ItemDef, MarketItemDef } from '../engine/types';
import { flag, health, xp } from './dsl';

export const MARKET = {
  /** 每回合最多買幾樣。 */
  perTurn: 2,
  /** 每回合的產業收入。 */
  income: { land: 25, shop: 60 },
  /** 有鋪面時，行商方針的收入多幾成。 */
  shopTradeBonus: 0.5,
  /** 贈禮：價格與關係增加。 */
  giftPrice: 40,
  giftRelation: 10,
};

const property = (kind: 'land' | 'shop'): GameEffect => ({ type: 'property', kind, delta: 1 });

export const market: MarketItemDef[] = [
  { id: 'tonic', name: '補藥', price: 30, desc: '健康 +15', effects: [health(15)] },
  {
    id: 'inquire', name: '打聽消息', price: 20, desc: '下一回合必定聽到一位名俠的行蹤',
    requires: { notFlags: ['inquire'] }, effects: [flag('inquire')],
  },
  {
    id: 'connections', name: '打點門路', price: 100, desc: '下一次拜師入門時比較容易（考核的對手降一級，或檢定 +20%）',
    requires: { hasSect: false, notFlags: ['connections'] }, effects: [flag('connections')],
  },
  {
    id: 'manual_changquan', name: '長拳拳譜', price: 80, desc: '長拳經驗 +3（一生限買一次）',
    regions: ['jiangnan', 'xiangyang', 'qingming'], once: true, effects: [xp('changquan', 3)],
  },
  {
    id: 'manual_liuyun', name: '流雲步圖解', price: 120, desc: '流雲步經驗 +3（一生限買一次）',
    regions: ['jiangnan'], once: true, effects: [xp('liuyun', 3)],
  },
  {
    id: 'manual_shoucheng', name: '守城槍譜殘本', price: 120, desc: '守城十八槍經驗 +3（一生限買一次）',
    regions: ['xiangyang'], once: true, effects: [xp('shoucheng', 3)],
  },
  {
    id: 'manual_qinghen', name: '青衡劍譜抄本', price: 200, desc: '青衡十三式經驗 +3（一生限買一次）',
    regions: ['qingming'], once: true, effects: [xp('qinghen', 3)],
  },
  {
    id: 'manual_baicao', name: '本草抄本', price: 100, desc: '百草辨脈術經驗 +3（一生限買一次）',
    regions: ['shu', 'jiangnan'], once: true, effects: [xp('baicao', 3)],
  },
  {
    id: 'land', name: '置產：田地', price: 200, desc: '之後每回合收租 25 文。戰亂可能毀掉產業',
    regions: ['jiangnan', 'shu'], requires: { minAge: 16 }, effects: [property('land')],
  },
  {
    id: 'shop', name: '置產：鋪面', price: 500, desc: '之後每回合收入 60 文；行商多賺五成。戰亂可能毀掉產業',
    regions: ['jiangnan', 'xiangyang'], requires: { minAge: 18 }, effects: [property('shop')],
  },
];

export const propertyRisks = [
  { year: 1273, region: 'xiangyang', text: '襄陽城破。你在襄陽的產業，連同那條街，都在大火裡燒成了白地。' },
  { year: 1276, region: 'jiangnan', text: '元軍南下，江南兵荒馬亂。你在江南的產業被亂兵搶的搶、燒的燒，什麼也沒剩下。' },
];

export const items: Record<string, ItemDef> = {
  bailing: {
    id: 'bailing', name: '白翎箭',
    desc: '巴特爾送你的箭，白色的箭羽已經有些褪色。草原上的人說，互贈箭羽的人，就是一輩子的朋友。',
    ending: '你臨終時手裡握著一支白翎箭。沒有人知道它是誰送的。',
    weight: 5,
  },
  shen_letter: {
    id: 'shen_letter', name: '沈孤舟的信',
    desc: '醉劍臨終託你送往雲棲庵的信，信封已經被你揣得發軟。',
    ending: '那封沒能送到的信，最後和你葬在了一起。',
    weight: 6,
  },
  lunwu_token: {
    id: 'lunwu_token', name: '青冥台木牌',
    desc: '參加青冥論武時發的木牌，上面刻著你的名字。青衡劍府的人認得它。',
    ending: '那塊刻著你名字的青冥台木牌，被你的後人掛在了堂屋的牆上。',
    weight: 3,
  },
  xueyi_ling: {
    id: 'xueyi_ling', name: '血衣令',
    desc: '血衣樓的令牌，入樓時無面客親手交給你的。被正派的人看見，就說不清了。',
    ending: '你死後，人們在你的枕頭底下找到一塊血衣令，沒有人敢碰它。',
    weight: 4,
  },
  yaowang_notes: {
    id: 'yaowang_notes', name: '藥王手札',
    desc: '林鶴年親手寫的醫案，密密麻麻記著幾十年的病例。',
    ending: '你把藥王手札傳給了徒弟，扉頁上多了一行你的字。',
    weight: 4,
  },
  father_relic: {
    id: 'father_relic', name: '父親的遺物',
    desc: '父親生前用的一把舊柴刀。刀柄上的血跡，你一直沒有擦掉。',
    ending: '父親那把舊柴刀，你帶了一輩子。',
    weight: 5,
  },
};
