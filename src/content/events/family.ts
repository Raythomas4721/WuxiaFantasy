// 成家之後的事。{spouse} 是你的另一半：和玩伴成親的是玩伴的名字，其他人是「家裡那口子」。

import type { GameEvent } from '../../engine/types';
import { chiv, danshi, fame, flag, health, later, meili, money, wuxing, xinxing } from '../dsl';

export const familyEvents: GameEvent[] = [
  {
    id: 'family_farewell',
    kind: 'normal',
    title: '臨行',
    weight: 14,
    conditions: { minAge: 20, maxAge: 50, flags: ['married'], notFlags: ['spouse_passed'] },
    tags: ['family', 'travel', 'martial', 'trade'],
    text: '你又要出遠門了。{spouse}一句話也沒問，只是連夜把你的衣裳補了一遍，乾糧包了三層。天沒亮，你提著包袱走到門口，發現門檻上放著一雙新做的鞋。',
    choices: [
      {
        id: 'promise',
        text: '「年底之前，我一定回來。」',
        outcome: {
          text: '{spouse}點了點頭，沒有抬頭看你。你穿上那雙鞋，走出很遠才敢回頭。門還開著。',
          effects: [xinxing(1), flag('promise_home'), later('family_return', 1, 3, 8)],
        },
      },
      {
        id: 'cold',
        text: '「江湖路遠，別等我。」',
        outcome: {
          text: '你說得很硬，怕說軟了就走不了。{spouse}把鞋塞進你的包袱：「等不等，是我的事。」',
          effects: [danshi(1)],
        },
      },
      {
        id: 'stay',
        text: '把包袱放下：「這一趟，不去了。」',
        outcome: {
          text: '你們在灶台邊坐到天亮，吃完了那包本來要帶上路的乾糧。那件要去辦的事，後來是別人辦的。',
          effects: [xinxing(1), health(5), fame(-1)],
        },
      },
    ],
  },
  {
    id: 'family_return',
    kind: 'normal',
    title: '歸家',
    scheduledOnly: true,
    conditions: { flags: ['married'], notFlags: ['spouse_passed'] },
    tags: ['family'],
    text: '你答應過年底之前回來。這一年的最後一場雪下起來的時候，你離家還有三百里，手上的事還沒有了結。',
    choices: [
      {
        id: 'rush',
        text: '把事情放下，連夜趕路',
        outcome: {
          text: '你在除夕的鞭炮聲裡推開了家門，一身的雪。{spouse}愣在灶台邊，手裡的碗掉在了地上。那一頓年夜飯，你記了一輩子。',
          effects: [xinxing(2), health(-5), flag('kept_home_promise')],
          recap: { weight: 3, text: '{ageCn}歲那年，你頂著大雪連夜趕路，在除夕夜推開了家門。' },
        },
      },
      {
        id: 'letter',
        text: '託人帶一封信和一些錢回去',
        requires: { minMoney: 20 },
        outcome: {
          text: '信是開春才送到的。後來你聽說，{spouse}把那封信壓在枕頭底下，錢一文也沒動。',
          effects: [money(-20), fame(1)],
        },
      },
      {
        id: 'forget',
        text: '事情要緊，過了年再說',
        outcome: {
          text: '你回到家時桃花都開了。桌上擺著兩副碗筷，其中一副落了灰。{spouse}什麼也沒說，只是把飯熱了一遍。',
          effects: [fame(2), xinxing(-1)],
        },
      },
    ],
  },
  {
    id: 'family_child',
    kind: 'normal',
    title: '添丁',
    weight: 16,
    conditions: { minAge: 19, maxAge: 40, flags: ['married'], notFlags: ['has_child', 'spouse_passed'] },
    tags: ['family', 'village', 'rest'],
    text: '孩子是半夜生的，哭聲大得整條巷子都聽得見。穩婆把一團皺巴巴的小東西放進你懷裡，你的兩隻手，忽然不知道該怎麼放。{spouse}累得睜不開眼，還在問：「叫什麼名字？」',
    choices: [
      {
        id: 'peace',
        text: '「叫『安』。這世道，平安就好。」',
        outcome: {
          text: '你抱著孩子在屋裡走了一夜。天亮時你發現，自己這些年第一次有了怕的東西。',
          effects: [flag('has_child'), xinxing(2), later('family_child_grown', 17, 21, 12)],
          recap: { weight: 3, text: '{ageCn}歲那年，你有了孩子，取名叫「安」。' },
        },
      },
      {
        id: 'brave',
        text: '「叫『毅』。亂世裡，骨頭要硬。」',
        outcome: {
          text: '孩子在你懷裡蹬了一腳，力氣不小。你笑了，笑完又有點擔心。',
          effects: [flag('has_child'), danshi(1), xinxing(1), later('family_child_grown', 17, 21, 12)],
          recap: { weight: 3, text: '{ageCn}歲那年，你有了孩子，取名叫「毅」。' },
        },
      },
      {
        id: 'learn',
        text: '「叫『明』。多讀書，把這世道看明白。」',
        outcome: {
          text: '你說完自己也覺得好笑：一個走江湖的，倒盼著孩子去讀書。{spouse}閉著眼睛笑了。',
          effects: [flag('has_child'), wuxing(1), xinxing(1), later('family_child_grown', 17, 21, 12)],
          recap: { weight: 3, text: '{ageCn}歲那年，你有了孩子，取名叫「明」。' },
        },
      },
    ],
  },
  {
    id: 'family_threat',
    kind: 'normal',
    title: '門上的刀',
    weight: 14,
    conditions: {
      minAge: 22,
      maxAge: 60,
      flags: ['married'],
      notFlags: ['spouse_passed'],
      any: [{ minFame: 30 }, { maxAlignment: -20 }, { flags: ['xueyi_enemy'] }, { flags: ['blood_feud'] }],
    },
    tags: ['family', 'feud'],
    text: '你回家時，大門上釘著一把短刀，刀上穿著一張紙，只有四個字：「你有家人。」{spouse}把刀拔下來藏在灶膛裡，怕你看見。你還是看見了。',
    choices: [
      {
        id: 'move',
        text: '連夜搬家，換個地方過日子',
        requires: { minMoney: 30 },
        outcome: {
          text: '你們只帶了一個包袱，天亮前出了城。新的地方沒人認得你。{spouse}說，這樣也好，清靜。',
          effects: [money(-30), xinxing(1), fame(-2)],
        },
      },
      {
        id: 'confront',
        text: '順著那把刀，找出是誰釘的',
        duel: {
          opponent: 'thugs',
          success: {
            text: '你找到了那幾個人，也找到了雇他們的人。你把那把短刀原樣釘回了他的門上。從那以後，再也沒有人敢碰你家的門。',
            effects: [fame(3), danshi(1), flag('home_defended')],
            recap: { weight: 2, text: '{ageCn}歲那年，有人把刀釘在你家門上。你把那把刀原樣釘了回去。' },
          },
          failure: {
            text: '你被人抬回了家。{spouse}替你包紮的時候手一直在抖，卻一句埋怨也沒有。',
            effects: [xinxing(1)],
          },
        },
      },
      {
        id: 'guard',
        text: '哪裡也不去，從此在家裡守著',
        outcome: {
          text: '你推掉了所有外面的事，每天坐在院子裡磨刀。一個月過去，什麼也沒發生。也許對方只是想讓你出不了門。',
          effects: [xinxing(1), fame(-1), health(5)],
        },
      },
    ],
  },
  {
    id: 'family_child_grown',
    kind: 'normal',
    title: '孩子的路',
    weight: 16,
    conditions: { minAge: 40, maxAge: 66, flags: ['has_child'], notFlags: ['child_path'] },
    tags: ['family', 'martial', 'study', 'rest'],
    text: '孩子長得比你還高了。這天夜裡，孩子在院子裡等你，憋了半天才開口：「我想出去闖一闖。像你當年那樣。」',
    choices: [
      {
        id: 'teach',
        text: '「先把我這身本事學全了再走。」',
        requires: { minMartial: 3 },
        hint: '你自己的武學還不夠教人',
        outcome: {
          text: '你教了三年，比當年教誰都嚴。孩子出門那天，你把跟了自己半輩子的兵器遞了過去，手鬆開得很慢。',
          effects: [flag('child_path'), flag('has_disciple'), flag('taught_child'), xinxing(1), fame(2)],
          recap: { weight: 4, text: '{ageCn}歲那年，你把一身武藝傳給了自己的孩子，又把用了半輩子的兵器交到孩子手上。' },
        },
      },
      {
        id: 'bless',
        text: '「去吧。記得家在哪裡。」',
        outcome: {
          text: '你把攢下的盤纏全塞進了孩子的包袱。孩子走到巷口回頭揮手，你這才明白，當年站在門口送你的人是什麼心情。',
          effects: [flag('child_path'), xinxing(2), money(-20)],
          recap: { weight: 3, text: '{ageCn}歲那年，孩子說要出去闖一闖。你站在門口，一直看到巷口沒有人了。' },
        },
      },
      {
        id: 'forbid',
        text: '「我走過的路，不想讓你再走一遍。」',
        outcome: {
          text: '孩子沒有再說話。半個月後的一個早上，床是空的，桌上留了一張字條：「等我混出個樣子，就回來。」',
          effects: [flag('child_path'), flag('child_left'), xinxing(-1), danshi(1)],
          recap: { weight: 3, text: '{ageCn}歲那年，你不許孩子走江湖。孩子留下一張字條，自己走了。' },
        },
      },
    ],
  },
  {
    id: 'family_sickbed',
    kind: 'normal',
    title: '病榻',
    weight: 20,
    conditions: { minAge: 48, flags: ['married'], notFlags: ['spouse_passed', 'spouse_recovered'] },
    tags: ['family', 'medicine', 'rest'],
    text: '入冬以後，{spouse}咳得一天比一天厲害，後來連床也下不了了。大夫把你拉到門外，壓低了聲音：「準備準備吧。也許撐得過這個冬天，也許撐不過。」',
    choices: [
      {
        id: 'stay',
        text: '什麼事都放下，守在床邊',
        check: {
          stats: ['fuyuan', 'xinxing'],
          difficulty: 5,
          skill: 'baicao',
          success: {
            text: '你餵藥、擦身、整夜整夜地坐著。開春那天，{spouse}自己坐了起來，說想喝一碗你煮的粥。你煮糊了，兩個人都吃完了。',
            effects: [flag('spouse_recovered'), xinxing(2), health(-5)],
            recap: { weight: 4, text: '{ageCn}歲那年的冬天，你什麼事都放下，把{spouse}從病榻上守了回來。' },
          },
          failure: {
            text: '你守了一整個冬天。最後那個夜裡，{spouse}握著你的手說：「這輩子，沒跟錯人。」天亮時，那隻手涼了。',
            effects: [flag('spouse_passed'), xinxing(2), health(-10)],
            recap: { weight: 5, text: '{ageCn}歲那年的冬天，{spouse}走了。你守到了最後一刻。' },
          },
        },
      },
      {
        id: 'doctor',
        text: '散盡家財，去請最好的大夫',
        requires: { minMoney: 80 },
        outcome: {
          text: '你把能賣的都賣了，請來了三百里外的名醫。藥吃了兩個月，{spouse}的臉上終於有了血色。家裡空了，人還在。',
          effects: [money(-80), flag('spouse_recovered'), chiv(2)],
          recap: { weight: 4, text: '{ageCn}歲那年，你散盡家財，請名醫治好了{spouse}的病。' },
        },
      },
      {
        id: 'away',
        text: '外面的事放不下，託鄰居照看',
        outcome: {
          text: '你回來的時候，屋裡已經收拾乾淨了。鄰居說，最後那幾天，{spouse}一直望著門。',
          effects: [flag('spouse_passed'), fame(2), xinxing(-2), meili(-1)],
          recap: { weight: 5, text: '{ageCn}歲那年，{spouse}病重時你不在家。你回來時，已經來不及了。' },
        },
      },
    ],
  },
];
