// 錢的用途：市集、置產；行囊裡的信物（設計文件 v0.4 §3.12）。價格與收益都集中在這裡。

import type { GameEffect, ItemDef, MarketItemDef } from '../engine/types';
import { align, chiv, fame, flag, health, item, xp } from './dsl';

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
  // 兵器鋪：買一次，往後每場過招都帶著
  { id: 'gear_huwan', name: '鐵護腕', price: 80, desc: '過招時每回合開始護體 2（一生買一次）', requires: { minAge: 12 }, once: true, effects: [item('gear_huwan')] },
  { id: 'gear_yaonang', name: '金創藥囊', price: 100, desc: '過招時回復的氣血 +3（一生買一次）', requires: { minAge: 12 }, once: true, effects: [item('gear_yaonang')] },
  { id: 'gear_bingqi', name: '趁手的兵器', price: 150, desc: '過招時攻擊牌每一擊傷害 +1（一生買一次）', requires: { minAge: 14 }, once: true, effects: [item('gear_bingqi')] },
  { id: 'gear_huxin', name: '護心鏡', price: 220, desc: '過招時氣血上限 +12（一生買一次）', requires: { minAge: 16 }, once: true, effects: [item('gear_huxin')] },
  // 散財：錢換成名聲與良心
  {
    id: 'charity', name: '施粥濟貧', price: 40, desc: '俠義 +3、正邪 +2、名望 +1', requires: { minAge: 14 },
    effects: [chiv(3), align(2), fame(1)],
  },
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
    id: 'land', name: '置產：田地', price: 150, desc: '之後每回合收租 25 文。戰亂可能毀掉產業',
    regions: ['jiangnan', 'shu'], requires: { minAge: 16 }, effects: [property('land')],
  },
  {
    id: 'shop', name: '置產：鋪面', price: 350, desc: '之後每回合收入 60 文；行商多賺五成。戰亂可能毀掉產業',
    regions: ['jiangnan', 'xiangyang'], requires: { minAge: 18 }, effects: [property('shop')],
  },
];

export const propertyRisks = [
  { year: 1273, region: 'xiangyang', text: '襄陽城破。你在襄陽的產業，連同那條街，都在大火裡燒成了白地。' },
  {
    year: 1276, region: 'jiangnan', kinds: ['shop' as const],
    text: '元軍南下，江南兵荒馬亂。你在江南的鋪子被亂兵搶的搶、燒的燒，什麼也沒剩下。田地搬不走，換了朝廷，地契照樣算數。',
  },
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
  gear_huwan: {
    id: 'gear_huwan', name: '鐵護腕',
    desc: '市集鐵匠打的護腕，擋過不少刀。',
    ending: '那副鐵護腕上的刀痕，數也數不清。',
    weight: 1,
    passive: { text: '每回合開始護體 2', effect: { blockPerRound: 2 } },
  },
  gear_yaonang: {
    id: 'gear_yaonang', name: '金創藥囊',
    desc: '一只裝滿金創藥的皮囊，藥鋪掌櫃說，走江湖的人都該有一個。',
    ending: '你的金創藥囊用了一輩子，補了又補。',
    weight: 1,
    passive: { text: '回復的氣血 +3', effect: { healBonus: 3 } },
  },
  gear_bingqi: {
    id: 'gear_bingqi', name: '趁手的兵器',
    desc: '花了大錢請名匠照你的手打的兵器，輕重剛好。',
    ending: '那件請名匠打的兵器，後來傳給了別人。',
    weight: 2,
    passive: { text: '攻擊牌每一擊傷害 +1', effect: { attackBonus: 1 } },
  },
  gear_huxin: {
    id: 'gear_huxin', name: '護心鏡',
    desc: '貼身穿在衣服裡的銅鏡，擋得住暗箭。',
    ending: '那面護心鏡上有一道凹痕，是當年替你擋下的。',
    weight: 2,
    passive: { text: '氣血上限 +12', effect: { maxHp: 12 } },
  },
  father_relic: {
    id: 'father_relic', name: '父親的遺物',
    desc: '父親生前用的一把舊柴刀。刀柄上的血跡，你一直沒有擦掉。',
    ending: '父親那把舊柴刀，你帶了一輩子。',
    weight: 5,
  },
};
