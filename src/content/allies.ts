// 故人援手：交情夠深的人，會在首領戰、生死之戰裡出手幫你一次。
// who 是人物 id（companion 是兒時玩伴）；kind：strike 重創對手、guard 擋在你前面、heal 替你回氣血。
// line 裡的 {foe} 代換成對手名字，{companion} 代換成玩伴的名字。

import type { AllyDef } from '../engine/types';

export const allies: AllyDef[] = [
  {
    who: 'qin_yuan',
    minRelation: 40,
    kind: 'strike',
    line: '秦遠從人群裡衝了出來，一劍逼退了{foe}：「我兄弟，你也敢動？」',
  },
  {
    who: 'shen_guzhou',
    minRelation: 40,
    kind: 'strike',
    line: '一道劍光從斜裡掠過。沈孤舟拎著酒葫蘆站到你身邊：「喝了你那麼多酒，總得還一點。」',
  },
  {
    who: 'han_shouyi',
    minRelation: 40,
    kind: 'strike',
    line: '一桿鐵槍從你身後刺了出去，韓守義擋在你前面：「站起來！跟我守過城的人，不跪著死。」',
  },
  {
    who: 'ge_baina',
    minRelation: 40,
    kind: 'strike',
    line: '一群叫花子從兩頭湧了出來，葛百衲拄著拐杖站在最前面：「動他？先問問百衲會。」',
  },
  {
    who: 'lin_henian',
    minRelation: 40,
    kind: 'heal',
    line: '一根銀針扎進你的穴道，林鶴年的聲音在你耳邊響起：「撐住，死不了。」',
  },
  {
    who: 'lu_ping',
    minRelation: 40,
    kind: 'guard',
    line: '陸平帶著幾個人衝了進來，擋在你前面：「當年你替我擋過一回，這回換我！」',
  },
  {
    who: 'lao_liao',
    minRelation: 40,
    kind: 'strike',
    line: '說書的老廖不知道從哪裡冒了出來，朝{foe}臉上撒了一把石灰：「說書的，也會兩下子！」',
  },
  {
    who: 'bater',
    minRelation: 50,
    kind: 'guard',
    line: '一支白翎箭釘在{foe}腳前。巴特爾騎在馬上，遠遠朝你舉了舉弓。',
  },
  {
    who: 'companion',
    minRelation: 50,
    kind: 'guard',
    line: '{companion}不知道從哪裡衝了出來，抄起一根門閂擋在你前面：「小時候說好的，誰欺負你，我就跟誰拚命！」',
  },
];
