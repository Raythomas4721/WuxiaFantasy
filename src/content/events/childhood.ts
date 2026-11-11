// 幼年與童年（0–12 歲）。

import type { GameEvent } from '../../engine/types';
import {
  card, chiv, danshi, fame, flag, fuyuan, gengu, health, item, later, meet, meili, money, rel, wuxing, xinxing, xp,
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
        text: '你滿週歲，家裡擺了三桌酒。紅漆托盤上放著一柄小木劍、一支湖筆、一副小算盤和一包藥材。{father}的生意夥伴們笑著下注，賭你會抓什麼。',
      },
      {
        if: { backgrounds: ['physician'] },
        text: '你滿週歲那天，藥鋪提早關了門。{father}在藥櫃前鋪了一塊布，擺上木劍、毛筆、銅錢，還有一株曬乾的當歸。',
      },
      {
        text: '你滿週歲那天，{mother}在竹蓆上擺了幾樣東西：一柄削好的小木劍、一支禿了毛的筆、幾枚銅錢，還有一把從田埂上摘來的野草。鄰居們圍在門口看熱鬧。',
      },
    ],
    choices: [
      {
        id: 'sword',
        text: '抓木劍',
        outcome: {
          text: '你一把抓住木劍，揮得虎虎生風，差點打翻了酒碗。大人們哄堂大笑：「這孩子將來是個練武的料。」',
          effects: [gengu(1), flag('zhua_sword'), card('pinming', 'punch')],
        },
      },
      {
        id: 'brush',
        text: '抓毛筆',
        outcome: {
          text: '你抓起毛筆，在自己臉上畫了一道黑。一屋子的人都笑出了眼淚。',
          effects: [wuxing(1), flag('zhua_brush'), card('kanpo', 'punch')],
        },
      },
      {
        id: 'coin',
        text: '抓銅錢',
        outcome: {
          text: '你攥緊銅錢不放，誰來拿都不給。長輩搖頭笑道：「守得住財，也算本事。」',
          effects: [meili(1), money(10), flag('zhua_coin'), card('zhouxuan', 'punch')],
        },
      },
      {
        id: 'herb',
        text: '抓那把草藥',
        outcome: {
          text: '你抓起那把草，放在鼻子前聞了又聞，竟然一聲也沒哭。',
          effects: [xp('baicao', 1), xinxing(1), flag('zhua_herb'), card('jinchuang', 'punch')],
        },
      },
      {
        id: 'none',
        text: '什麼都不抓，爬回{mother}懷裡',
        outcome: {
          text: '你什麼也沒抓，爬回{mother}懷裡睡著了。有人說這孩子沒出息，{mother}卻說：「平平安安就好。」',
          effects: [fuyuan(1), flag('zhua_none'), card('liusanfen', 'punch')],
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
        text: '{father}連夜翻遍醫書，配出一帖方子',
        requires: { backgrounds: ['physician'] },
        hidden: true,
        outcome: {
          text: '{father}守了你三夜。燒退後，{father}摸著你的頭說：「這病根，將來得你自己學會治。」',
          effects: [xp('baicao', 1), flag('illness_managed')],
          recap: { weight: 1, text: '{ageCn}歲那年你大病一場，{father}說，這病根將來得你自己學會治。' },
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
    vars: {
      toy: ['竹蜻蜓', '泥娃娃', '小木馬', '撥浪鼓', '剛撿到的漂亮石子'],
      scene: [
        '隔壁搬來一戶人家，家裡的孩子叫{companion}，比你大半歲，{companionTrait}。第一次見面，{companion}就搶走了你手裡的{toy}。',
        '廟會上人擠人，你被擠到了戲台底下。那裡已經蹲著一個孩子，叫{companion}，{companionTrait}。{companion}看了你一眼，伸手就拿走了你手裡的{toy}。',
        '{mother}帶你去河邊洗衣裳。洗衣的人裡有一個也帶著孩子，叫{companion}，比你大半歲，{companionTrait}。大人們還在說話，{companion}已經把你的{toy}搶了過去。',
        '村口的大樹下，總有個孩子一個人蹲著看螞蟻。大人說那是新搬來那戶人家的，叫{companion}，{companionTrait}。你湊過去看，{companion}頭也不抬，一把抓走了你手裡的{toy}。',
      ],
    },
    text: '{scene}',
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
          effects: [xinxing(1), rel('lu_ping', 10), flag('mediated'), card('jieli', 'parry')],
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
            effects: [danshi(1), chiv(5), rel('lu_ping', 30), flag('saved_lu'), flag('rival_bully'), later('old_friend_visit', 8, 12), card('tingshen', 'parry')],
            recap: { weight: 3, text: '{ageCn}歲那年，你在私塾外替一個叫陸平的少年擋下了一群人。' },
          },
          failure: {
            text: '你被推倒在地，鼻血流了一臉，卻始終沒有讓開。最後是先生出來，才把人趕走。陸平扶你起來，一路陪你走回家。',
            effects: [health(-10), danshi(1), chiv(5), rel('lu_ping', 35), flag('saved_lu'), flag('rival_bully'), later('old_friend_visit', 8, 12), card('tiebushan', 'parry')],
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
          effects: [wuxing(1), rel('lu_ping', 25), flag('keen_eye'), flag('saved_lu'), flag('rival_bully'), later('old_friend_visit', 8, 12), card('kanpo', 'parry')],
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
          effects: [fuyuan(1), flag('lucky_stone'), card('zuibu', 'punch')],
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
            effects: [gengu(1), rel('bater', 30), meet('bater'), flag('grassland_pact'), item('bailing')],
            recap: { weight: 3, text: '{ageCn}歲那年，在北方的榷場，一個叫巴特爾的蒙古少年送了你一根白色的箭羽。' },
          },
          failure: {
            text: '你連弓都拉不滿，箭歪歪地插在土裡。少年笑得在地上打滾，笑完了卻手把手地教你拉弓。臨別時，他塞給你一根白色的箭羽。他叫巴特爾。',
            effects: [rel('bater', 20), meet('bater'), flag('grassland_pact'), item('bailing')],
            recap: { weight: 3, text: '{ageCn}歲那年，在北方的榷場，一個叫巴特爾的蒙古少年教你拉弓，送了你一根白色的箭羽。' },
          },
        },
      },
      {
        id: 'cake',
        text: '拿出隨身的糖糕，跟他換弓來看看',
        outcome: {
          text: '他咬了一口糖糕，眼睛一下子亮了。你們用手比劃了一整個下午。臨別時，他送你一根白色的箭羽。他叫巴特爾。',
          effects: [meili(1), rel('bater', 25), meet('bater'), flag('grassland_pact'), item('bailing')],
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
    text: '{father}把十二味藥材排在桌上，蒙住了你的眼睛：「聞、嘗、摸。說錯三樣，今天不准吃飯。」',
    choices: [
      {
        id: 'smell',
        text: '憑鼻子一樣一樣地聞',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: {
            text: '你只錯了一樣。{father}難得地笑了，把一本手抄的藥書塞進你懷裡。',
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
          text: '你全答對了。{father}沉默了一會兒，說：「藥會騙人，病不會。你騙得了我，騙不了病。」那一夜你沒有睡著。',
          effects: [xp('baicao', 1), xinxing(1), flag('father_lesson')],
          recap: { weight: 1, text: '{ageCn}歲那年辨藥時你作了弊，{father}說：「你騙得了我，騙不了病。」' },
        },
      },
      {
        id: 'ask',
        text: '求{father}先教你怎麼分辨',
        outcome: {
          text: '{father}愣了一下，然後一樣一樣地講給你聽。那天晚上，藥鋪的燈一直亮到三更。',
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
    text: [
      { if: { flags: ['world_plague_dire'] }, text: '戰亂過後，川蜀爆發了一場百年不遇的大瘟疫。村子一個接一個空了，路邊的屍首來不及埋。濟世藥谷的谷主林鶴年下令開谷，弟子們在山下搭起草棚，日夜熬藥。你家隔壁的一家五口，已經病倒了三個。' },
      { if: { flags: ['world_plague_light'] }, text: '戰亂過後，川蜀鬧起了瘟疫。幸好濟世藥谷的谷主林鶴年早有準備，下令開谷，弟子們在山下搭起草棚熬藥，疫情還沒傳開就被壓住了大半。你家附近也有人病倒了。' },
      { text: '戰亂過後，川蜀爆發了一場大瘟疫。濟世藥谷的谷主林鶴年下令開谷，弟子們在山下搭起一排排草棚，日夜熬藥。你家附近也有人病倒了。' },
    ],
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
        text: '跟著{father}一起去救人',
        requires: { backgrounds: ['physician'] },
        hidden: true,
        outcome: {
          text: '你跟在{father}身後，記下每一個病人的脈象。林鶴年經過時看了你的藥方一眼，提筆改了一味藥，又把方子還給你：「其餘的都對。」',
          effects: [xp('baicao', 3), rel('lin_henian', 30), meet('lin_henian'), flag('plague_helper'), chiv(5)],
          recap: { weight: 2, text: '{ageCn}歲那年川蜀大疫，你跟著{father}救人，藥王林鶴年改過你寫的藥方。' },
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
  // ---- 幼年（七歲以前）----
  {
    id: 'kid_lost',
    kind: 'normal',
    title: '走失',
    weight: 10,
    conditions: { minAge: 2, maxAge: 6 },
    tags: ['family'],
    vars: { fair: ['元宵的燈會', '三月的廟會', '趕集的日子', '端午的龍舟會'] },
    text: '{fair}上，你鬆開了大人的手，去追一隻滾遠的燈籠。等你抱著燈籠回過頭，四周全是不認得的腿。',
    choices: [
      {
        id: 'wait',
        text: '站在原地不動，等大人回來找',
        outcome: {
          text: '你抱著燈籠站了很久，腿都麻了，就是不肯挪一步。{mother}找到你的時候，哭得比你還厲害。',
          effects: [xinxing(1)],
        },
      },
      {
        id: 'walk',
        text: '自己認路走回家',
        check: {
          stats: ['wuxing', 'fuyuan'],
          difficulty: 5,
          success: {
            text: '你記得來的時候經過一座石橋、一棵歪脖子樹。天黑前，你自己走到了家門口。全家人都嚇傻了。',
            effects: [danshi(1), wuxing(1)],
            recap: { weight: 1, text: '很小的時候，你在人堆裡走丟了，自己認路走回了家。' },
          },
          failure: {
            text: '你越走越遠，最後蹲在一座不認得的橋上哭。一個挑擔子的貨郎把你送了回去。',
            effects: [danshi(1), health(-5)],
          },
        },
      },
      {
        id: 'candy',
        text: '跟著捏糖人的老頭走',
        outcome: {
          text: '老頭捏了一隻糖老虎給你，一路問你家在哪裡，把你送到了巷口。他走的時候，你才想起忘了問他叫什麼。',
          effects: [fuyuan(1), meili(1)],
        },
      },
    ],
  },
  {
    id: 'kid_stories',
    kind: 'normal',
    title: '夏夜',
    weight: 10,
    conditions: { minAge: 2, maxAge: 6 },
    tags: ['family'],
    text: '夏天的夜裡熱得睡不著，巷子裡的孩子都搬了竹蓆到曬穀場上乘涼。隔壁的老奶奶搖著蒲扇問：「今天想聽哪一段？」',
    choices: [
      {
        id: 'hero',
        text: '「要聽大俠的！」',
        outcome: {
          text: '她講了一個使劍的人，一個人守住一座橋的故事。你聽得忘了打蚊子。第二天，你撿了根樹枝，在院子裡比劃了一整天。',
          effects: [danshi(1), flag('saw_martial')],
        },
      },
      {
        id: 'healer',
        text: '「要聽神醫的！」',
        outcome: {
          text: '她講了一個走方郎中用一根針救活死人的故事。你聽完，把院子裡的草一棵一棵拔起來聞，被{mother}打了手心。',
          effects: [xinxing(1), xp('baicao', 1)],
        },
      },
      {
        id: 'ghost',
        text: '「要聽鬼故事！」',
        outcome: {
          text: '別的孩子都鑽進了大人懷裡，只有你睜大眼睛聽到最後，還追問：「然後呢？」老奶奶笑得直搖頭，說這孩子膽子是鐵打的。',
          effects: [danshi(1), fuyuan(1)],
        },
      },
      {
        id: 'sleep',
        text: '還沒聽完就睡著了',
        outcome: { text: '你在蒲扇的風裡睡著了。那是你這輩子睡得最沉的幾個夜晚。', effects: [health(5), xinxing(1)] },
      },
    ],
  },
  // ---- 童年（七到十二歲）----
  {
    id: 'kid_kite',
    kind: 'normal',
    title: '紙鳶',
    weight: 11,
    conditions: { minAge: 7, maxAge: 12 },
    tags: ['social', 'village'],
    text: '清明前後，你和{companion}糊了一隻紙鳶，放得比誰都高。一陣怪風吹來，線斷了，紙鳶掛在了祠堂的屋脊上。看祠堂的老頭出了名的兇。',
    choices: [
      {
        id: 'climb',
        text: '爬上去拿',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 5,
          success: {
            text: '你踩著牆邊的老樹翻上了屋頂，拿到紙鳶，還順便看了一眼全村的屋頂。{companion}在底下看得嘴都合不上。',
            effects: [danshi(1), gengu(1), rel('companion', 8)],
          },
          failure: {
            text: '瓦片滑了，你連人帶紙鳶摔進了草垛。看祠堂的老頭提著掃帚追了你們半條街。',
            effects: [health(-8), danshi(1), rel('companion', 8)],
          },
        },
      },
      {
        id: 'pole',
        text: '找兩根竹竿接起來勾',
        outcome: {
          text: '你把兩根晾衣竿用草繩綁在一起，試到第七次，把紙鳶勾了下來。{companion}說，你這腦袋不去讀書可惜了。',
          effects: [wuxing(1), rel('companion', 5)],
        },
      },
      {
        id: 'ask',
        text: '硬著頭皮去敲祠堂的門',
        outcome: {
          text: '老頭瞪了你半天，一聲不吭地搬來梯子，把紙鳶拿下來還給你，還塞了你們一人一塊麥芽糖。原來他只是長得兇。',
          effects: [meili(1), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'kid_dog',
    kind: 'normal',
    title: '黃狗',
    weight: 10,
    conditions: { minAge: 7, maxAge: 12 },
    tags: ['village', 'medicine', 'work'],
    text: '柴堆後面躲著一條瘦得皮包骨的黃狗，後腿上有一道很深的口子，像是被人用鋤頭砍的。牠看見你，往後縮了縮，喉嚨裡嗚嗚地響。',
    choices: [
      {
        id: 'keep',
        text: '偷偷拿飯餵牠，養在柴房',
        outcome: {
          text: '你每天把自己的飯省下半碗。過了一個月，牠的腿好了，從此你走到哪裡，牠就跟到哪裡。',
          effects: [xinxing(1), fuyuan(1), flag('kid_dog')],
          recap: { weight: 1, text: '{ageCn}歲那年，你撿了一條受傷的黃狗，把自己的飯省下來餵牠。' },
        },
      },
      {
        id: 'heal',
        text: '找草藥替牠包紮，等牠好了就放走',
        outcome: {
          text: '你嚼爛了止血的草葉，敷在傷口上。牠疼得直抖，卻沒有咬你。傷好的那天，牠在村口回頭看了你很久。',
          effects: [xp('baicao', 1), chiv(2)],
        },
      },
      {
        id: 'away',
        text: '怕牠咬人，拿棍子把牠趕走',
        outcome: { text: '牠一瘸一拐地走了。那天晚上下了很大的雨。', effects: [danshi(1)] },
      },
    ],
  },
  {
    id: 'kid_ruler',
    kind: 'normal',
    title: '戒尺',
    weight: 14,
    conditions: { minAge: 7, maxAge: 12, focus: ['kid_study'] },
    tags: ['study'],
    text: '先生的硯台不知被誰打翻了，墨汁潑了半本書。先生氣得鬍子都在抖，戒尺往桌上一拍，指著你：「昨天最後一個走的，是不是你？」不是你。可是你知道是誰。',
    choices: [
      {
        id: 'take',
        text: '伸出手，替那個人挨這幾下',
        outcome: {
          text: '你挨了十下戒尺，手腫了三天。放學後，打翻硯台的那個孩子追上來，把他最寶貝的一顆彈珠塞進了你手裡。',
          effects: [xinxing(1), chiv(3), meili(1), health(-3)],
        },
      },
      {
        id: 'argue',
        text: '「不是我。先生可以看看我的袖口，一點墨都沒有。」',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: {
            text: '先生愣了一下，真的把每個人的袖口都看了一遍。事情查清楚了。那天以後，先生講到難的地方，總會先問你一句。',
            effects: [wuxing(1), danshi(1)],
          },
          failure: {
            text: '先生說你頂嘴，多打了五下。你咬著牙沒哭，心裡把那幾句話又想了一遍，覺得自己沒說錯。',
            effects: [danshi(1), health(-5)],
          },
        },
      },
      {
        id: 'tell',
        text: '把真正打翻硯台的人說出來',
        outcome: {
          text: '那個孩子挨了打，從此見了你就繞路走。先生倒是誇了你一句誠實。',
          effects: [xinxing(1), meili(-1), wuxing(1)],
        },
      },
    ],
  },
  {
    id: 'kid_peddler',
    kind: 'normal',
    title: '貨郎',
    weight: 10,
    conditions: { minAge: 7, maxAge: 12 },
    tags: ['village', 'social', 'work'],
    vars: { thing: ['一面磨得發亮的小銅鏡', '一把牛角小刀', '一本缺了封皮的畫冊', '一只會叫的陶哨'] },
    text: '搖著撥浪鼓的貨郎又來了，擔子一放下，全村的孩子都圍了上去。你一眼就看中了{thing}，可是你口袋裡一文錢也沒有。',
    choices: [
      {
        id: 'work',
        text: '問貨郎：「我幫你挑一天擔子，換不換？」',
        outcome: {
          text: '你跟著他走了三個村子，肩膀磨破了皮。傍晚他把東西遞給你，又多給了兩文錢：「小小年紀，知道東西要拿力氣換，難得。」',
          effects: [gengu(1), xinxing(1), money(2)],
        },
      },
      {
        id: 'bargain',
        text: '拿自己攢的寶貝跟他換',
        check: {
          stats: ['meili'],
          difficulty: 5,
          success: {
            text: '你把攢了一年的彈珠、蟬蛻全擺了出來，說得天花亂墜。貨郎被你逗笑了，東西給了你，寶貝一樣也沒收。',
            effects: [meili(1), fuyuan(1)],
          },
          failure: { text: '貨郎看了看你那堆寶貝，搖搖頭，挑起擔子走了。你追著看了很遠。', effects: [xinxing(1)] },
        },
      },
      {
        id: 'steal',
        text: '趁他不注意，摸走',
        check: {
          stats: ['danshi', 'fuyuan'],
          difficulty: 6,
          success: {
            text: '你得手了。可是那東西藏在枕頭底下，你一次也不敢拿出來玩。',
            effects: [danshi(1), chiv(-3)],
          },
          failure: {
            text: '貨郎一把抓住了你的手腕。他沒有打你，只是把你送回了家。那天晚上，你跪到了半夜。',
            effects: [chiv(-2), xinxing(1), health(-3)],
          },
        },
      },
    ],
  },
  // ---- 出身不同的童年 ----
  {
    id: 'kid_famine',
    kind: 'normal',
    title: '荒年',
    weight: 14,
    conditions: { minAge: 7, maxAge: 12, backgrounds: ['farmer'] },
    tags: ['village', 'work', 'family'],
    text: '這一年先是不下雨，後來又鬧蝗蟲。田裡收上來的穀子，交完租就不剩多少了。入冬以後，家裡的粥一天比一天稀，稀得照得見人影。',
    choices: [
      {
        id: 'forage',
        text: '天天上山挖野菜、掏鳥蛋',
        outcome: {
          text: '你認得了哪種草能吃、哪種吃了會拉肚子，手上全是被荊棘劃的口子。靠著你背回來的那些東西，一家人撐到了開春。',
          effects: [gengu(1), xinxing(1), health(-5)],
          recap: { weight: 2, text: '{ageCn}歲那年鬧荒，你天天上山挖野菜，一家人撐到了開春。' },
        },
      },
      {
        id: 'share',
        text: '把自己那碗粥，分一半給{companion}',
        outcome: {
          text: '{companion}家裡已經斷了三天的糧。你把碗推過去，說自己吃過了。那年冬天你瘦得只剩一把骨頭，{companion}一輩子都記得那半碗粥。',
          effects: [chiv(4), rel('companion', 20), health(-10)],
          recap: { weight: 2, text: '{ageCn}歲那年鬧荒，你把自己的半碗粥分給了{companion}。' },
        },
      },
      {
        id: 'steal',
        text: '半夜去挖地主家地裡的芋頭',
        check: {
          stats: ['danshi', 'fuyuan'],
          difficulty: 5,
          success: {
            text: '你背回了半筐芋頭。{father}看著那筐芋頭，一句話也沒說，只是把最大的那個放進了你的碗裡。',
            effects: [danshi(1), health(5)],
          },
          failure: {
            text: '看田的狗追了你二里地，你摔進了溝裡，芋頭一個也沒帶回來。',
            effects: [danshi(1), health(-10)],
          },
        },
      },
    ],
  },
  {
    id: 'kid_ledger',
    kind: 'normal',
    title: '少了一箱',
    weight: 14,
    conditions: { minAge: 7, maxAge: 12, backgrounds: ['merchant'] },
    tags: ['work', 'village', 'study'],
    text: '你跟著夥計到碼頭點貨。船上卸下來四十箱瓷器，帳本上記的卻是四十一箱。管事的老夥計笑呵呵地說：「小東家數錯了吧？」你又數了一遍。沒有數錯。',
    choices: [
      {
        id: 'speak',
        text: '當著所有人的面說出來',
        outcome: {
          text: '碼頭上一下子安靜了。老夥計的臉漲得通紅。那箱瓷器當天晚上就「找到」了，他卻從此沒再對你笑過。',
          effects: [danshi(1), wuxing(1), meili(-1)],
        },
      },
      {
        id: 'father',
        text: '什麼也不說，回家悄悄告訴{father}',
        outcome: {
          text: '{father}聽完，摸了摸你的頭：「看得見，還沉得住氣。這比會算帳要緊。」過了半個月，那個老夥計自己辭了工。',
          effects: [xinxing(1), wuxing(1)],
          recap: { weight: 1, text: '{ageCn}歲那年，你在碼頭上數出帳本少了一箱貨。' },
        },
      },
      {
        id: 'trace',
        text: '自己順著車轍去找那一箱',
        check: {
          stats: ['wuxing', 'danshi'],
          difficulty: 5,
          success: {
            text: '你順著車轍找到了一間柴房，那箱瓷器就藏在稻草底下。{father}賞了你一串錢，說這是你這輩子賺的第一筆。',
            effects: [wuxing(1), danshi(1), money(15), flag('keen_eye')],
          },
          failure: { text: '車轍到了大路上就亂了。你白白曬了一下午。', effects: [gengu(1)] },
        },
      },
    ],
  },
  // ---- 出生地不同的童年 ----
  {
    id: 'kid_wall',
    kind: 'normal',
    title: '城牆上',
    weight: 13,
    conditions: { minAge: 7, maxAge: 12, regions: ['xiangyang'] },
    tags: ['martial', 'village', 'social'],
    text: '襄陽的孩子都愛往城牆上跑。這天你溜上城頭，一個缺了兩根手指的老兵正靠著垛口擦槍。他看了你一眼，沒有趕你：「小鬼，知道城外是哪裡嗎？」',
    choices: [
      {
        id: 'spear',
        text: '「教我使槍！」',
        outcome: {
          text: '他把一根削尖的木棍塞到你手裡，教你怎麼站、怎麼刺。「守城的槍沒有花樣，就一條：別退。」你在城頭上刺了一個下午的風。',
          effects: [xp('shoucheng', 1), gengu(1), flag('saw_martial')],
          recap: { weight: 1, text: '{ageCn}歲那年，襄陽城頭的一個老兵教你刺了一下午的槍。' },
        },
      },
      {
        id: 'listen',
        text: '坐下來聽他講城外的事',
        outcome: {
          text: '他指著北邊，一座山一座山地講給你聽，哪裡打過仗，哪裡埋著他的弟兄。太陽下山的時候，你覺得那片地方離你好近。',
          effects: [xinxing(1), wuxing(1), flag('war_seen')],
        },
      },
      {
        id: 'run',
        text: '吐吐舌頭，跑了',
        outcome: { text: '你一溜煙跑下了城牆。背後傳來他的笑聲。', effects: [danshi(1)] },
      },
    ],
  },
  {
    id: 'kid_flood',
    kind: 'normal',
    title: '大水',
    weight: 13,
    conditions: { minAge: 7, maxAge: 12, regions: ['jiangnan'] },
    tags: ['village', 'work', 'family'],
    text: '梅雨下了整整四十天，河水漫過了堤，一夜之間街上就能行船了。你家搬到了閣樓上。窗外，鄰居家的雞籠、木盆、門板，一樣一樣地漂過去。',
    choices: [
      {
        id: 'boat',
        text: '撐著木盆出去，幫鄰居撈東西',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 5,
          success: {
            text: '你撐著一只大木盆，來來回回撈了一整天，連隔壁阿婆的貓都救了回來。水退以後，半條街的人都認得你了。',
            effects: [danshi(1), chiv(4), meili(1)],
            recap: { weight: 1, text: '{ageCn}歲那年發大水，你撐著一只木盆，替半條街的人撈東西。' },
          },
          failure: {
            text: '木盆翻了，你嗆了好幾口水，是鄰居把你拉上來的。你發了兩天的燒。',
            effects: [health(-10), chiv(3)],
          },
        },
      },
      {
        id: 'fish',
        text: '在窗口垂一根線釣魚',
        outcome: {
          text: '田裡的魚全游到街上來了。你從閣樓的窗口釣了三天，一家人頓頓有魚吃。大人說，這孩子天塌下來也餓不死。',
          effects: [fuyuan(1), xinxing(1)],
        },
      },
      {
        id: 'read',
        text: '反正出不了門，把家裡的書翻出來看',
        outcome: {
          text: '家裡只有三本書，你翻來覆去看了一個月，連哪一頁有蟲蛀的洞都記得。',
          effects: [wuxing(1)],
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
        duel: {
          opponent: 'rival',
          success: {
            text: '不出三招，{rival}就被你按倒在地。圍觀的人拍手叫好。他爬起來，連一句狠話都不敢撂。',
            effects: [fame(4), chiv(3), flag('beat_rival'), rel('rival', -20)],
          },
          failure: {
            text: '你被他的打手圍住，打得爬不起來。{rival}蹲下來拍拍你的臉：「記住了。」',
            effects: [flag('humiliated'), rel('rival', -10)],
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
