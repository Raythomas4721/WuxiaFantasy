// 幼年與童年（0–12 歲）。

import type { GameEvent } from '../../engine/types';
import {
  chiv, danshi, fame, flag, fuyuan, gengu, health, later, meet, meili, money, rel, wuxing, xinxing, xp,
} from '../dsl';

export const childhoodEvents: GameEvent[] = [
  {
    id: 'zhuazhou',
    kind: 'forced',
    title: '抓週',
    priority: 10,
    conditions: { maxAge: 0 },
    tags: ['family'],
    text: [
      {
        if: { backgrounds: ['merchant'] },
        text: '你滿週歲，家裡擺了三桌酒。紅漆托盤上放著一柄小木劍、一支湖筆、一副小算盤和一包藥材。父親的生意夥伴們笑著下注，賭你會抓什麼。',
      },
      {
        if: { backgrounds: ['physician'] },
        text: '你滿週歲那天，藥鋪提早關了門。父親在藥櫃前鋪了一塊布，擺上木劍、毛筆、銅錢，還有一株曬乾的當歸。',
      },
      {
        text: '你滿週歲那天，母親在竹蓆上擺了幾樣東西：一柄削好的小木劍、一支禿了毛的筆、幾枚銅錢，還有一把從田埂上摘來的野草。鄰居們圍在門口看熱鬧。',
      },
    ],
    choices: [
      {
        id: 'sword',
        text: '抓木劍',
        outcome: {
          text: '你一把抓住木劍，揮得虎虎生風，差點打翻了酒碗。大人們哄堂大笑：「這孩子將來是個練武的料。」',
          effects: [gengu(1), flag('zhua_sword')],
        },
      },
      {
        id: 'brush',
        text: '抓毛筆',
        outcome: {
          text: '你抓起毛筆，在自己臉上畫了一道黑。一屋子的人都笑出了眼淚。',
          effects: [wuxing(1), flag('zhua_brush')],
        },
      },
      {
        id: 'coin',
        text: '抓銅錢',
        outcome: {
          text: '你攥緊銅錢不放，誰來拿都不給。長輩搖頭笑道：「守得住財，也算本事。」',
          effects: [meili(1), money(10), flag('zhua_coin')],
        },
      },
      {
        id: 'herb',
        text: '抓那把草藥',
        outcome: {
          text: '你抓起那把草，放在鼻子前聞了又聞，竟然一聲也沒哭。',
          effects: [xp('baicao', 1), xinxing(1), flag('zhua_herb')],
        },
      },
      {
        id: 'none',
        text: '什麼都不抓，爬回母親懷裡',
        outcome: {
          text: '你什麼也沒抓，爬回母親懷裡睡著了。有人說這孩子沒出息，母親卻說：「平平安安就好。」',
          effects: [fuyuan(1), flag('zhua_none')],
        },
      },
    ],
  },
  {
    id: 'illness_onset',
    kind: 'forced',
    title: '夜半高燒',
    priority: 5,
    conditions: { minAge: 1, maxAge: 6, flags: ['hidden_illness'] },
    tags: ['family'],
    text: '{ageCn}歲那年冬天，你發了一場高燒，七天七夜不退。郎中把了脈，皺著眉說這是胎裡帶來的病根：「這一回治得好，根卻除不掉。」',
    choices: [
      {
        id: 'endure',
        text: '咬牙喝下每一碗苦藥',
        outcome: {
          text: '藥苦得你直掉眼淚，你卻一碗也沒有吐。燒退了，大人都說你比他們還能忍。',
          effects: [xinxing(1), health(-5), flag('illness_managed')],
        },
      },
      {
        id: 'cry',
        text: '哭鬧著不肯喝藥',
        outcome: {
          text: '你把藥碗打翻了三次。燒最後還是退了，你卻瘦了一大圈，此後每逢換季就咳個不停。',
          effects: [health(-15), flag('illness_worse')],
        },
      },
      {
        id: 'family_recipe',
        text: '父親連夜翻遍醫書，配出一帖方子',
        requires: { backgrounds: ['physician'] },
        hidden: true,
        outcome: {
          text: '父親守了你三夜。燒退後，他摸著你的頭說：「這病根，將來得你自己學會治。」',
          effects: [xp('baicao', 1), flag('illness_managed')],
          recap: { weight: 1, text: '{ageCn}歲那年你大病一場，父親說，這病根將來得你自己學會治。' },
        },
      },
    ],
  },
  {
    id: 'war_news',
    kind: 'forced',
    title: '北方來的人',
    priority: 8,
    conditions: { minYear: 1235, maxYear: 1238 },
    tags: ['war'],
    text: [
      {
        if: { regions: ['xiangyang'] },
        text: '這一年，蒙古兵南下的消息傳遍了襄陽。沒過多久，城裡的駐軍譁變，大火燒了好幾天。你被大人抱著擠在逃難的人群裡，回頭只看見半邊天都是紅的。',
      },
      {
        if: { regions: ['shu'] },
        text: '這一年，蒙古大軍攻破成都的消息一路傳來。山道上全是扶老攜幼的人。有一家逃難的人借住在你家柴房，他們的孩子餓得連哭的力氣都沒有。',
      },
      {
        text: '這一年，北邊又打起仗來了。嘉興城外的碼頭擠滿了從淮河一帶逃來的人。他們的口音你聽不懂，但你看得出來，他們都餓著肚子。',
      },
    ],
    choices: [
      {
        id: 'share',
        text: '把自己的半塊餅分給一個逃難的孩子',
        outcome: {
          text: '那孩子愣了一下，狼吞虎嚥地吃完，衝你咧嘴一笑。你後來才知道，那是他三天來吃的第一口東西。',
          effects: [chiv(5), flag('shared_bread'), flag('war_seen')],
          recap: { weight: 2, text: '{ageCn}歲那年的戰亂裡，你把半塊餅分給了一個逃難的孩子。' },
        },
      },
      {
        id: 'cling',
        text: '緊緊抓著大人的衣角，一聲不吭',
        outcome: {
          text: '你不哭也不鬧，只是緊緊抓著大人的衣角。很多年後，你仍會在夢裡聞到那天的煙味。',
          effects: [xinxing(1), flag('war_seen')],
        },
      },
      {
        id: 'watch',
        text: '偷偷溜到城門口去看',
        outcome: {
          text: '你從大人腿邊鑽了出去，看見城門下躺著一排受傷的兵。你沒有怕，只是看了很久很久。',
          effects: [danshi(1), health(-5), flag('war_seen')],
        },
      },
    ],
  },
  {
    id: 'meet_companion',
    kind: 'forced',
    title: '兒時玩伴',
    priority: 3,
    conditions: { minAge: 3, maxAge: 8 },
    tags: ['social'],
    vars: { toy: ['竹蜻蜓', '泥娃娃', '小木馬', '撥浪鼓', '剛撿到的漂亮石子'] },
    text: '隔壁搬來一戶人家，家裡的孩子叫{companion}，比你大半歲，{companionTrait}。第一次見面，{companion}就搶走了你手裡的{toy}。',
    choices: [
      {
        id: 'fight',
        text: '撲上去搶回來',
        outcome: {
          text: '你們在泥地裡滾成一團，最後兩個人都哭了，又一起被大人拎回家。第二天，{companion}把{toy}還給你，還多送了一隻草編的蚱蜢。',
          effects: [danshi(1), rel('companion', 15)],
        },
      },
      {
        id: 'give',
        text: '乾脆送給對方，再教對方怎麼玩',
        outcome: {
          text: '{companion}看著你，臉一下子紅了。從那天起，你身後總跟著一條小尾巴。',
          effects: [meili(1), rel('companion', 25)],
        },
      },
      {
        id: 'tell',
        text: '跑去告訴大人',
        outcome: {
          text: '大人把{companion}訓了一頓。你拿回了{toy}，{companion}卻好幾天都不跟你說話。後來還是你先拿了顆糖去和好。',
          effects: [xinxing(1), rel('companion', 5)],
        },
      },
    ],
  },
  {
    id: 'family_decline',
    kind: 'forced',
    title: '家道中落',
    priority: 4,
    conditions: { minAge: 8, maxAge: 12, flags: ['fortune_decline'] },
    tags: ['family'],
    text: [
      {
        if: { backgrounds: ['merchant'] },
        text: '家裡押了一大筆錢的貨船在江上翻了。債主一個接一個上門，家裡的東西被搬走了一半。',
      },
      {
        if: { backgrounds: ['physician'] },
        text: '一位官老爺的家眷吃了家裡開的藥，病沒好反而重了。官司打了半年，藥鋪的招牌被摘了下來。',
      },
      { text: '連著兩年大旱，田裡顆粒無收。家裡把最後一頭牛也賣了，從此一天只吃兩頓。' },
    ],
    choices: [
      {
        id: 'work',
        text: '不再去私塾，跟著大人做活',
        outcome: {
          text: '你每天天沒亮就起身。手上起了繭，你卻覺得自己一下子長大了。',
          effects: [money(20), gengu(1), xinxing(1), flag('left_school')],
        },
      },
      {
        id: 'study',
        text: '求家人讓你繼續讀書，夜裡再幫忙',
        outcome: {
          text: '白天讀書，夜裡做活，你常常趴在桌上就睡著了。先生知道後，免了你半年的束脩。',
          effects: [wuxing(1), health(-10), flag('kept_school')],
          recap: { weight: 1, text: '家道中落那年，你白天讀書、夜裡做活，硬是沒有放下書本。' },
        },
      },
      {
        id: 'secret',
        text: '偷偷到碼頭打零工，不讓家人知道',
        outcome: {
          text: '你在碼頭搬貨，被工頭剋扣工錢也不敢吭聲。拿回家的那串銅錢，大人捧在手裡看了很久，什麼都沒說。',
          effects: [danshi(1), money(30), flag('street_work')],
        },
      },
    ],
  },
  {
    id: 'family_rise',
    kind: 'forced',
    title: '時來運轉',
    priority: 4,
    conditions: { minAge: 8, maxAge: 12, flags: ['fortune_rise'] },
    tags: ['family'],
    text: [
      {
        if: { backgrounds: ['merchant'] },
        text: '家裡押對了一批川蜀的藥材，戰事一起，價錢翻了十倍。',
      },
      {
        if: { backgrounds: ['physician'] },
        text: '家裡治好了知州大人的老毛病。知州親筆題了一塊匾，求醫的人從此排到了街口。',
      },
      { text: '家裡在自家田邊挖到一罈前朝的銀錠。一夜之間，你家成了村裡的富戶。' },
    ],
    choices: [
      {
        id: 'martial',
        text: '求長輩請一位武師來教你',
        outcome: {
          text: '請來的武師是個退伍的老兵。他教你扎馬步，一扎就是半個時辰。',
          effects: [money(50), xp('changquan', 4), flag('saw_martial')],
        },
      },
      {
        id: 'tutor',
        text: '求長輩請一位好先生',
        outcome: {
          text: '先生學問很好，脾氣也很大。你背錯一個字，手心就挨一下戒尺。',
          effects: [money(50), wuxing(2)],
        },
      },
      {
        id: 'social',
        text: '什麼都不要，跟著長輩學怎麼應酬',
        outcome: {
          text: '你看著大人在酒桌上周旋，慢慢學會了什麼話該說、什麼話不該說。',
          effects: [money(100), meili(1)],
        },
      },
    ],
  },
  {
    id: 'school_dispute',
    kind: 'normal',
    title: '私塾外的爭執',
    weight: 14,
    conditions: { minAge: 7, maxAge: 12 },
    tags: ['study', 'social'],
    text: '你在私塾外看見幾個孩子圍著一個瘦小的少年。帶頭的{rival}是鎮上糧行老闆的兒子，一口咬定那少年偷了他的書錢。被圍住的少年叫陸平，緊抿著嘴，一句話也不說。',
    choices: [
      {
        id: 'mediate',
        text: '把雙方分開，問清楚怎麼回事',
        outcome: {
          text: '你把兩邊隔開，一句一句地問。事情沒有問出結果，但那群孩子也沒再動手。陸平離開前，回頭看了你一眼。',
          effects: [xinxing(1), rel('lu_ping', 10), flag('mediated')],
        },
      },
      {
        id: 'stand',
        text: '直接擋在陸平前面',
        check: {
          stats: ['danshi', 'gengu'],
          difficulty: 5,
          success: {
            text: '「要打就打我。」你張開雙手擋在前面。{rival}愣了一下，罵罵咧咧地帶人走了。陸平低聲說了句謝謝，耳根都紅了。',
            effects: [danshi(1), chiv(5), rel('lu_ping', 30), flag('saved_lu'), flag('rival_bully'), later('old_friend_visit', 8, 12)],
            recap: { weight: 3, text: '{ageCn}歲那年，你在私塾外替一個叫陸平的少年擋下了一群人。' },
          },
          failure: {
            text: '你被推倒在地，鼻血流了一臉，卻始終沒有讓開。最後是先生出來，才把人趕走。陸平扶你起來，一路陪你走回家。',
            effects: [health(-10), danshi(1), chiv(5), rel('lu_ping', 35), flag('saved_lu'), flag('rival_bully'), later('old_friend_visit', 8, 12)],
            recap: { weight: 3, text: '{ageCn}歲那年，你在私塾外替一個叫陸平的少年挨了一頓打。' },
          },
        },
      },
      {
        id: 'observe',
        text: '先不出聲，找出真正拿錢的人',
        requires: { minStats: { wuxing: 6 } },
        outcome: {
          text: '你注意到{rival}身後的小跟班一直捂著袖口。你當眾點破，銅錢從他袖子裡掉了出來。圍觀的孩子一哄而散，{rival}狠狠地瞪了你一眼。',
          effects: [wuxing(1), rel('lu_ping', 25), flag('keen_eye'), flag('saved_lu'), flag('rival_bully'), later('old_friend_visit', 8, 12)],
          recap: { weight: 2, text: '{ageCn}歲那年，你在私塾外揪出了真正的小偷，替陸平洗清了冤屈。' },
        },
      },
      {
        id: 'leave',
        text: '不關自己的事，繞路回家',
        outcome: {
          text: '你低著頭繞過人群。走出很遠，還聽得見後面的推搡聲。',
          effects: [flag('walked_away')],
          recap: { weight: 1, text: '{ageCn}歲那年，你看見有人在私塾外被欺負，繞路走開了。這件事你一直沒有忘記。' },
        },
      },
    ],
  },
  {
    id: 'village_martial',
    kind: 'normal',
    title: '廟口的拳師',
    weight: 10,
    conditions: { minAge: 7, maxAge: 14 },
    tags: ['martial', 'village'],
    text: '廟口來了一位走江湖的拳師，每天清早在空地上打一套長拳，打完了就賣跌打膏藥。你蹲在牆邊，一連看了好幾天。',
    choices: [
      {
        id: 'peek',
        text: '躲在牆後偷學',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: {
            text: '你把每一招都記在心裡，回家對著柴堆比劃。幾天後，拳師路過時看了你一眼，竟然點了點頭。',
            effects: [xp('changquan', 3), flag('saw_martial')],
          },
          failure: {
            text: '你學得手忙腳亂，被拳師逮個正著。他沒有生氣，只糾正了你兩個姿勢，就收攤走了。',
            effects: [xp('changquan', 1), flag('saw_martial')],
          },
        },
      },
      {
        id: 'pay',
        text: '拿出攢下的錢，求他正式教你',
        requires: { minMoney: 20 },
        outcome: {
          text: '拳師掂了掂銅錢，笑道：「錢我收了，苦你可得吃。」他在鎮上多留了一個月。',
          effects: [money(-20), xp('changquan', 5), gengu(1), flag('saw_martial')],
          recap: { weight: 1, text: '{ageCn}歲那年，你用攢下的錢跟一位走江湖的拳師學了一個月的長拳。' },
        },
      },
      {
        id: 'bored',
        text: '看了幾天就膩了，跑去河邊摸魚',
        outcome: {
          text: '你覺得打拳不如摸魚有趣。摸魚時，你摸到一塊溫潤的小石頭，從此一直帶在身上。',
          effects: [fuyuan(1), flag('lucky_stone')],
        },
      },
    ],
  },
  {
    id: 'river_rescue',
    kind: 'normal',
    title: '河邊的呼救',
    weight: 8,
    conditions: { minAge: 8, maxAge: 13 },
    tags: ['village', 'social'],
    text: '夏天，你和{companion}在河邊玩水。上游忽然傳來呼救聲，一個小孩被沖進了深水處，岸邊一個大人也沒有。',
    choices: [
      {
        id: 'jump',
        text: '跳下去救人',
        check: {
          stats: ['danshi', 'gengu'],
          difficulty: 6,
          success: {
            text: '你游到那孩子身邊，拽著他的衣領，一點一點划回岸邊。孩子的父母後來提著一籃雞蛋上門道謝。',
            effects: [chiv(8), fame(3), danshi(1), flag('river_hero')],
            recap: { weight: 2, text: '{ageCn}歲那年夏天，你跳進河裡救起了一個溺水的孩子。' },
          },
          failure: {
            text: '你抓住了孩子，自己卻被暗流捲走。{companion}找來大人，把你們兩個都撈了上來。你吐了半天的水，病了半個月。',
            effects: [health(-25), chiv(8), flag('river_hero'), rel('companion', 10)],
            recap: { weight: 2, text: '{ageCn}歲那年夏天，你為了救一個溺水的孩子，自己差點沒能上岸。' },
          },
        },
      },
      {
        id: 'call',
        text: '讓{companion}去叫大人，自己沿岸追著指方向',
        outcome: {
          text: '你一路追著喊。大人趕到時，孩子剛好被沖到淺灘。大家都說，虧你腦子清楚。',
          effects: [xinxing(1), chiv(4), rel('companion', 10)],
        },
      },
      {
        id: 'run',
        text: '嚇得拉著{companion}跑回家',
        outcome: {
          text: '後來聽說那孩子被路過的漁夫救了。你鬆了一口氣，卻好幾天都不敢再去河邊。',
          effects: [flag('river_fled')],
        },
      },
    ],
  },
  {
    id: 'merchant_caravan',
    kind: 'normal',
    title: '北上的商隊',
    weight: 30,
    conditions: { minAge: 9, maxAge: 13, backgrounds: ['merchant'] },
    tags: ['travel', 'trade'],
    text: '這一回，家裡的商隊北上淮水邊的榷場，也帶上了你。空地上，一個和你差不多大的蒙古少年正在射靶，十箭有九箭中紅心。他看見你盯著他，挑釁似地把弓遞了過來。',
    choices: [
      {
        id: 'compete',
        text: '接過弓，和他比一場',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 5,
          success: {
            text: '你只中了三箭，卻有一箭射落了他掛在靶上的小旗。少年大笑，拍著你的肩膀說了一串你聽不懂的話，最後拔下一根白色的箭羽塞給你。他叫巴特爾。',
            effects: [gengu(1), rel('bater', 30), meet('bater'), flag('grassland_pact')],
            recap: { weight: 3, text: '{ageCn}歲那年，在北方的榷場，一個叫巴特爾的蒙古少年送了你一根白色的箭羽。' },
          },
          failure: {
            text: '你連弓都拉不滿，箭歪歪地插在土裡。少年笑得在地上打滾，笑完了卻手把手地教你拉弓。臨別時，他塞給你一根白色的箭羽。他叫巴特爾。',
            effects: [rel('bater', 20), meet('bater'), flag('grassland_pact')],
            recap: { weight: 3, text: '{ageCn}歲那年，在北方的榷場，一個叫巴特爾的蒙古少年教你拉弓，送了你一根白色的箭羽。' },
          },
        },
      },
      {
        id: 'cake',
        text: '拿出隨身的糖糕，跟他換弓來看看',
        outcome: {
          text: '他咬了一口糖糕，眼睛一下子亮了。你們用手比劃了一整個下午。臨別時，他送你一根白色的箭羽。他叫巴特爾。',
          effects: [meili(1), rel('bater', 25), meet('bater'), flag('grassland_pact')],
          recap: { weight: 3, text: '{ageCn}歲那年，你用一塊糖糕換來了蒙古少年巴特爾的友誼，和一根白色的箭羽。' },
        },
      },
      {
        id: 'hide',
        text: '躲回貨車上',
        outcome: {
          text: '你縮回貨車裡，聽著外面的笑聲。回程路上，長輩說：「下回別怕。草原上的孩子，也是孩子。」',
          effects: [xinxing(1), flag('hid_from_bater')],
        },
      },
    ],
  },
  {
    id: 'physician_test',
    kind: 'normal',
    title: '辨藥',
    weight: 25,
    conditions: { minAge: 7, maxAge: 12, backgrounds: ['physician'] },
    tags: ['medicine', 'family'],
    text: '父親把十二味藥材排在桌上，蒙住了你的眼睛：「聞、嘗、摸。說錯三樣，今天不准吃飯。」',
    choices: [
      {
        id: 'smell',
        text: '憑鼻子一樣一樣地聞',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: {
            text: '你只錯了一樣。父親難得地笑了，把一本手抄的藥書塞進你懷裡。',
            effects: [xp('baicao', 3), wuxing(1)],
          },
          failure: {
            text: '你錯了五樣，餓著肚子在藥櫃前背到半夜。',
            effects: [xp('baicao', 1), xinxing(1)],
          },
        },
      },
      {
        id: 'cheat',
        text: '偷偷掀開布角看',
        outcome: {
          text: '你全答對了。父親沉默了一會兒，說：「藥會騙人，病不會。你騙得了我，騙不了病。」那一夜你沒有睡著。',
          effects: [xp('baicao', 1), xinxing(1), flag('father_lesson')],
          recap: { weight: 1, text: '{ageCn}歲那年辨藥時你作了弊，父親說：「你騙得了我，騙不了病。」' },
        },
      },
      {
        id: 'ask',
        text: '求父親先教你怎麼分辨',
        outcome: {
          text: '父親愣了一下，然後一樣一樣地講給你聽。那天晚上，藥鋪的燈一直亮到三更。',
          effects: [xp('baicao', 2), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'plague',
    kind: 'forced',
    title: '藥谷疫變',
    priority: 8,
    conditions: { minYear: 1237, maxYear: 1240, regions: ['shu'], minAge: 4 },
    tags: ['medicine', 'war'],
    text: '戰亂過後，川蜀爆發了一場大瘟疫。濟世藥谷的谷主林鶴年下令開谷，弟子們在山下搭起一排排草棚，日夜熬藥。你家附近也有人病倒了。',
    choices: [
      {
        id: 'help',
        text: '去草棚幫忙熬藥、送水',
        check: {
          stats: ['gengu'],
          difficulty: 4,
          success: {
            text: '你在草棚裡跑了一個多月。有天夜裡，一個白鬍子老人蹲在你身邊看你煎藥，說：「火候對了。」後來你才知道，他就是林鶴年。',
            effects: [rel('lin_henian', 25), meet('lin_henian'), flag('plague_helper'), xp('baicao', 2), chiv(5)],
            recap: { weight: 2, text: '{ageCn}歲那年川蜀大疫，你在藥谷的草棚裡幫忙煎了一個多月的藥。' },
          },
          failure: {
            text: '第十天，你自己也倒下了。迷迷糊糊中，有人一根一根地替你下針。醒來時，林鶴年坐在床邊：「小傢伙，命挺硬。」',
            effects: [health(-30), rel('lin_henian', 30), meet('lin_henian'), flag('plague_helper'), flag('saved_by_lin')],
            recap: { weight: 3, text: '{ageCn}歲那年的瘟疫裡，藥王林鶴年親手把你從鬼門關拉了回來。' },
          },
        },
      },
      {
        id: 'with_father',
        text: '跟著父親一起去救人',
        requires: { backgrounds: ['physician'] },
        hidden: true,
        outcome: {
          text: '你跟在父親身後，記下每一個病人的脈象。林鶴年經過時看了你的藥方一眼，提筆改了一味藥，又把方子還給你：「其餘的都對。」',
          effects: [xp('baicao', 3), rel('lin_henian', 30), meet('lin_henian'), flag('plague_helper'), chiv(5)],
          recap: { weight: 2, text: '{ageCn}歲那年川蜀大疫，你跟著父親救人，藥王林鶴年改過你寫的藥方。' },
        },
      },
      {
        id: 'donate',
        text: '把家裡存的米偷偷送去草棚',
        outcome: {
          text: '你扛著半袋米走了十幾里山路。藥谷的弟子收下米，問你的名字，你沒說就跑了。',
          effects: [chiv(8), money(-10), rel('lin_henian', 10), flag('plague_donor')],
        },
      },
      {
        id: 'hide',
        text: '聽大人的話，關緊門窗躲在家裡',
        outcome: {
          text: '你在家裡關了兩個月。等門再打開時，巷子裡少了好幾戶人家。',
          effects: [xinxing(1), flag('plague_hid')],
        },
      },
    ],
  },
  {
    id: 'bully_returns',
    kind: 'normal',
    title: '冤家路窄',
    weight: 12,
    conditions: { minAge: 15, maxAge: 24, flags: ['rival_bully'] },
    tags: ['martial', 'village'],
    text: '{rival}長大了，仗著家裡有錢在鎮上橫行，身邊總跟著幾個打手。這天他在街上攔住你，笑嘻嘻地說：「當年的帳，還沒算呢。」',
    choices: [
      {
        id: 'fight',
        text: '拉開架勢，跟他打',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 6,
          martial: true,
          success: {
            text: '不出三招，{rival}就被你按倒在地。圍觀的人拍手叫好。他爬起來，連一句狠話都不敢撂。',
            effects: [fame(4), chiv(3), flag('beat_rival'), rel('rival', -20)],
          },
          failure: {
            text: '你被他的打手圍住，打得爬不起來。{rival}蹲下來拍拍你的臉：「記住了。」',
            effects: [health(-20), flag('humiliated'), rel('rival', -10)],
            recap: { weight: 1, text: '{ageCn}歲那年，你被{rival}的打手打得爬不起來。' },
          },
        },
      },
      {
        id: 'bow',
        text: '低頭賠個不是',
        outcome: {
          text: '你咬著牙說了聲對不住。{rival}得意洋洋地走了。那天晚上，你在後院把一截木樁打斷了。',
          effects: [xinxing(2), fame(-2), flag('swallowed_pride')],
        },
      },
      {
        id: 'reason',
        text: '直接找上糧行，當面講理',
        requires: { minStats: { meili: 6 } },
        outcome: {
          text: '你當著一屋子夥計把事情說清楚。糧行老闆臉上掛不住，回頭就把{rival}關在家裡半個月。',
          effects: [meili(1), rel('rival', -10), fame(2)],
        },
      },
    ],
  },
];
