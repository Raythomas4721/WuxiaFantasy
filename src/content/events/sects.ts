// 入了門派之後才有的事：青衡劍府、襄陽義軍、百衲會。
// 長風鏢局的護鏢在 youth.ts、濟世藥谷的看診在 adult.ts、血衣樓在 jianghu.ts。

import type { GameEvent } from '../../engine/types';
import { add, align, chiv, danshi, fame, flag, gengu, health, later, meili, money, rel, wuxing, xinxing, xp } from '../dsl';

export const sectEvents: GameEvent[] = [
  // ==================== 青衡劍府 ====================
  {
    id: 'qinghen_elders',
    kind: 'normal',
    title: '兩位長老',
    weight: 16,
    conditions: { minAge: 16, maxAge: 55, sects: ['qinghen'], maxYear: 1275 },
    tags: ['sect', 'martial'],
    text: [
      {
        if: { flags: ['world_jianfu_fall'] },
        text: '劍府的議事堂裡，兩位長老當著所有弟子的面拔了劍。執法的莫長老說，門規第一條是「劍不為己出」，北邊的仗是朝廷的事，劍府的人一個也不許下山。傳功的顧長老把劍拍在案上：「山下的人都快死光了，你守著這座山給誰看？」堂上沒有人敢出聲。兩個人都看向了你。',
      },
      {
        text: '這幾年，劍府裡有一件事誰也不敢大聲說。執法的莫長老認定門規第一條是「劍不為己出」，北邊的仗再大，劍府的人也不許下山。傳功的顧長老私下卻對弟子們說：「山下的人都快死光了，守著這座山給誰看？」這天晚課之後，兩位長老各派了人來，問你怎麼想。',
      },
    ],
    choices: [
      {
        id: 'keep',
        text: '站在莫長老這邊：門規不能破',
        outcome: {
          text: '你說，劍府立派三百年，靠的就是這一條規矩。莫長老點了點頭。顧長老看了你很久，什麼也沒說，轉身走了。',
          effects: [xinxing(1), add('sect_merit', 1), flag('jianfu_keep')],
        },
      },
      {
        id: 'descend',
        text: '站在顧長老這邊：劍該下山',
        outcome: {
          text: '你說，劍不為己出，那為百姓出，算不算？顧長老大笑。莫長老鐵青著臉：「好。你要下山，就別說是劍府叫你去的。」',
          effects: [chiv(4), danshi(1), flag('jianfu_descend'), later('qinghen_descend', 1, 3, 8)],
          recap: { weight: 2, text: '{ageCn}歲那年，青衡劍府為了該不該下山起了爭執。你說，劍該下山。' },
        },
      },
      {
        id: 'ask',
        text: '哪邊都不站，上劍閣去問掌門',
        outcome: {
          text: '謝凌霜聽你說完，只問了一句：「你自己的劍，想往哪裡去？」你答不上來。她說：「答得上來的那天，再來告訴我。」',
          effects: [wuxing(1), rel('xie_lingshuang', 10)],
        },
      },
    ],
  },
  {
    id: 'qinghen_descend',
    kind: 'normal',
    title: '下山',
    scheduledOnly: true,
    conditions: { sects: ['qinghen'] },
    tags: ['sect', 'war'],
    text: '顧長老真的點了十二個弟子下山，你是其中一個。你們在漢水邊的一處渡口，遇上了被潰兵堵住的幾百個逃難百姓。渡船只有三條，潰兵要先搶船。',
    choices: [
      {
        id: 'hold',
        text: '十二把劍排成一列，守住渡口',
        duel: {
          opponent: 'deserters',
          success: {
            text: '潰兵退了。三條船來回渡了一整夜，天亮時最後一個老人上了船。有人問你們是哪裡來的，你想起莫長老的話，只說：「路過的。」',
            effects: [chiv(6), fame(4), align(3), add('sect_merit', 1), xp('qinghen', 2)],
            recap: { weight: 3, text: '{ageCn}歲那年，你和十一個同門下了青冥山，在漢水的渡口守了一整夜。' },
          },
          failure: {
            text: '潰兵太多了。你們護著一部分人上了船，剩下的，你不敢回頭看。回山的路上，沒有人說話。',
            effects: [chiv(3), xinxing(1)],
          },
        },
      },
      {
        id: 'talk',
        text: '上前跟潰兵的頭目談：船讓老弱先上',
        check: {
          stats: ['meili', 'danshi'],
          difficulty: 6,
          success: {
            text: '你一個人走到他們中間，把劍插在地上。那個頭目盯著劍看了很久，揮了揮手。老弱先上了船，一個人也沒死。',
            effects: [chiv(6), fame(3), meili(1)],
            recap: { weight: 3, text: '{ageCn}歲那年，你在漢水的渡口把劍插在地上，一個人說退了一夥潰兵。' },
          },
          failure: {
            text: '話還沒說完，那邊已經動了手。你們邊打邊護著人上船，亂成一團。',
            effects: [health(-15), chiv(3)],
          },
        },
      },
    ],
  },
  {
    id: 'qinghen_junior',
    kind: 'normal',
    title: '師弟',
    weight: 14,
    conditions: { minAge: 18, maxAge: 55, sects: ['qinghen'] },
    tags: ['sect', 'social'],
    text: '半夜，你在藏劍閣外撞見了一個小師弟，懷裡揣著一卷劍譜的抄本。他撲通一聲跪下了：山下有人出高價收劍府的劍譜，他娘病得快死了，等著錢抓藥。按門規，私傳劍譜，要廢去武功，逐出山門。',
    choices: [
      {
        id: 'report',
        text: '門規就是門規，帶他去見執法長老',
        outcome: {
          text: '他被廢了一條手臂的經脈，趕下了山。臨走時他沒有看你。執法長老說你做得對。你一夜沒睡。',
          effects: [add('sect_merit', 2), chiv(-3), xinxing(1), flag('reported_junior')],
        },
      },
      {
        id: 'pay',
        text: '把劍譜放回去，藥錢你來出',
        requires: { minMoney: 40 },
        outcome: {
          text: '你把攢下的錢全塞給了他。他哭著磕了三個頭。半年後他娘的病好了，他在山門口等你，說這輩子都是你的人。',
          effects: [money(-40), chiv(5), meili(1), flag('saved_junior')],
          recap: { weight: 2, text: '{ageCn}歲那年，你替一個偷劍譜的師弟出了藥錢，把這件事瞞了下來。' },
        },
      },
      {
        id: 'blame',
        text: '「劍譜是我拿出來看的。」替他扛下',
        outcome: {
          text: '你在祖師堂前跪了三天，挨了三十杖。師弟每天夜裡偷偷來給你送水，一句話也說不出來。',
          effects: [health(-15), chiv(6), xinxing(1), add('sect_merit', -1), flag('saved_junior')],
          recap: { weight: 2, text: '{ageCn}歲那年，你替一個偷劍譜的師弟頂了罪，在祖師堂前跪了三天。' },
        },
      },
    ],
  },
  {
    id: 'qinghen_question',
    kind: 'normal',
    title: '寒衣',
    weight: 14,
    conditions: { minAge: 20, maxAge: 60, sects: ['qinghen'], minSkill: { qinghen: 3 }, npcAlive: ['xie_lingshuang'] },
    tags: ['sect', 'martial'],
    text: '下雪的夜裡，掌門謝凌霜忽然派人叫你上劍閣。她一身素白，站在窗前看雪，沒有回頭：「你的十三式，我都看過了。招式沒有錯。我只問你一件事：你的劍，為什麼而出？」',
    choices: [
      {
        id: 'guard',
        text: '「為了護住身後的人。」',
        outcome: {
          text: '她轉過身來，第一次正眼看你：「那就別只練進招。」那一夜，她把十三式裡所有的守勢，一式一式重新教了你一遍。',
          effects: [xp('qinghen', 3), chiv(3), rel('xie_lingshuang', 15), flag('xie_approved')],
          recap: { weight: 3, text: '{ageCn}歲那年的雪夜，掌門謝凌霜問你的劍為什麼而出。你說，為了護住身後的人。' },
        },
      },
      {
        id: 'way',
        text: '「為了看看劍的盡頭在哪裡。」',
        outcome: {
          text: '她沉默了一會兒：「我年輕時也這麼說。」她拔出劍，在雪地上走了一趟第十三式。你這才知道，自己以前練的只是個樣子。',
          effects: [xp('qinghen', 4), wuxing(1), rel('xie_lingshuang', 10), flag('xie_approved')],
          recap: { weight: 3, text: '{ageCn}歲那年的雪夜，掌門謝凌霜在雪地上，把第十三式走給你一個人看。' },
        },
      },
      {
        id: 'unknown',
        text: '「弟子不知道。」',
        outcome: {
          text: '她竟然笑了一下，很淡：「不知道，才學得下去。知道得太早的人，劍都死了。」她讓你每個月上劍閣一次，什麼也不教，只陪她看雪。',
          effects: [xinxing(2), xp('qinghen', 2), rel('xie_lingshuang', 20), flag('xie_approved')],
        },
      },
    ],
  },

  // ==================== 襄陽義軍 ====================
  {
    id: 'yijun_watch',
    kind: 'normal',
    title: '城頭',
    weight: 16,
    conditions: { minAge: 16, sects: ['yijun'], regions: ['xiangyang'], maxYear: 1272 },
    tags: ['sect', 'war'],
    text: '輪到你守夜。三更時分，城牆底下傳來壓低的哭聲：幾十個從北邊逃來的百姓，拖著孩子，求你放下繩梯。軍令寫得明白，入夜之後，一個人也不許放進城——上個月才有奸細混在難民裡，燒了半座糧倉。',
    choices: [
      {
        id: 'open',
        text: '放下繩梯，一個一個盤問了再拉上來',
        check: {
          stats: ['wuxing', 'xinxing'],
          difficulty: 6,
          success: {
            text: '你問了一整夜，問出兩個答不上家鄉話的人，當場綁了。其餘的人天亮前都上了城。韓守義聽完，只說了一句：「下回先叫醒我。」',
            effects: [chiv(6), fame(2), rel('han_shouyi', 10), add('sect_merit', 1)],
            recap: { weight: 2, text: '{ageCn}歲那年守夜，你違了軍令放難民上城，還從裡面揪出了兩個奸細。' },
          },
          failure: {
            text: '人都拉上來了。三天後，城西的馬料場起了火。查不出是誰放的，韓守義罰你餵了一個月的馬，沒有再多說什麼。',
            effects: [chiv(4), rel('han_shouyi', -5), add('sect_merit', -1)],
          },
        },
      },
      {
        id: 'order',
        text: '軍令如山，不開',
        outcome: {
          text: '你握著槍站到天亮。底下的哭聲後來沒有了。太陽出來時，城下只剩幾個包袱。',
          effects: [add('sect_merit', 1), chiv(-4), xinxing(1)],
        },
      },
      {
        id: 'down',
        text: '自己縋下城去，把他們帶到水門外的蘆葦蕩裡躲著',
        check: {
          stats: ['danshi', 'gengu'],
          difficulty: 6,
          success: {
            text: '你帶著他們在蘆葦蕩裡躲到天亮，等開了城門才一起進來。軍令一條也沒破，人一個也沒少。',
            effects: [chiv(5), danshi(1), fame(2), rel('han_shouyi', 10)],
          },
          failure: {
            text: '蘆葦蕩裡有敵軍的哨騎。你拚了命才把人帶回城下，自己背上挨了一刀。',
            effects: [health(-20), chiv(5)],
          },
        },
      },
    ],
  },
  {
    id: 'yijun_grain',
    kind: 'forced',
    title: '斷糧',
    priority: 5,
    conditions: { minAge: 16, sects: ['yijun'], regions: ['xiangyang'], minYear: 1268, maxYear: 1272 },
    tags: ['sect', 'war', 'work'],
    text: '城被圍了這麼久，義軍的糧只夠再吃十天。官倉裡還有糧，可那是朝廷的兵的；城裡幾家大戶的地窖也是滿的。韓守義把幾個信得過的人叫到一起：「都說說，怎麼辦。」',
    choices: [
      {
        id: 'borrow',
        text: '我去跟大戶借，立字據，城在就還',
        check: {
          stats: ['meili', 'xinxing'],
          difficulty: 6,
          success: {
            text: '你一家一家地去敲門，磨了三天嘴皮子，借出了兩個月的糧。有個老東家說：「不是信字據，是信你這個人。」',
            effects: [add('sect_merit', 2), fame(3), meili(1)],
            recap: { weight: 2, text: '襄陽被圍的那幾年，你一家一家敲門，替義軍借來了兩個月的糧。' },
          },
          failure: { text: '門一扇也沒敲開。大戶們說，城破了，字據找誰兌去？', effects: [xinxing(1)] },
        },
      },
      {
        id: 'raid',
        text: '我帶人夜裡出城，去劫敵營的糧車',
        duel: {
          opponent: 'mongol_centurion',
          success: {
            text: '你們放火燒了三座營帳，趕回了十二車糧。城頭上的人看見火光，敲了一夜的鼓。',
            effects: [add('sect_merit', 2), fame(5), xp('shoucheng', 2), flag('raid_hero')],
            recap: { weight: 3, text: '襄陽被圍的那幾年，你帶人夜襲敵營，趕回了十二車糧。' },
          },
          failure: { text: '敵營早有防備。你們丟下了三個弟兄才撤回來，一粒糧也沒帶回。', effects: [add('sect_merit', -1)] },
        },
      },
      {
        id: 'share',
        text: '先把我的口糧減半，分給帶傷的弟兄',
        outcome: {
          text: '你說完，屋裡一個接一個的人都說了同樣的話。那十天的糧，硬是吃了一個月。',
          effects: [health(-10), chiv(5), rel('han_shouyi', 10)],
        },
      },
    ],
  },
  {
    id: 'yijun_squad',
    kind: 'normal',
    title: '十個人',
    weight: 14,
    conditions: { minAge: 20, sects: ['yijun'], npcAlive: ['han_shouyi'], minSkill: { shoucheng: 2 } },
    tags: ['sect', 'war'],
    text: '韓守義把十個新兵交給你帶。最大的十七歲，最小的才十四，槍比人還高。他拍拍你的肩：「教會他們一件事就行。你自己挑是哪一件。」',
    choices: [
      {
        id: 'hard',
        text: '教他們「不退」：往死裡練',
        outcome: {
          text: '你每天天不亮就把他們踢起來。三個月後，十桿槍刺出去像一個人。他們恨透了你，也只服你。',
          effects: [gengu(1), add('sect_merit', 1), flag('yijun_captain'), flag('squad_hard'), later('yijun_squad_fate', 2, 5, 10)],
          recap: { weight: 2, text: '{ageCn}歲那年，韓守義交給你十個新兵。你教會了他們不退。' },
        },
      },
      {
        id: 'live',
        text: '教他們「活著」：先學怎麼躲箭、怎麼撤',
        outcome: {
          text: '別的隊練刺槍，你的隊練趴下、練翻牆、練背著人跑。有人笑你帶了一隊逃兵。你說，死人守不了城。',
          effects: [xinxing(1), chiv(3), flag('yijun_captain'), later('yijun_squad_fate', 2, 5, 10)],
          recap: { weight: 2, text: '{ageCn}歲那年，韓守義交給你十個新兵。你教他們的第一件事，是怎麼活下來。' },
        },
      },
      {
        id: 'refuse',
        text: '「我帶不了別人的命。」',
        outcome: { text: '韓守義看了你一眼，沒有勉強，把人交給了別人。', effects: [xinxing(1)] },
      },
    ],
  },
  {
    id: 'yijun_squad_fate',
    kind: 'normal',
    title: '那十個人',
    scheduledOnly: true,
    conditions: { flags: ['yijun_captain'] },
    tags: ['war'],
    text: [
      {
        if: { flags: ['squad_hard'] },
        text: '很多年後你才把那十個人的下落一個一個打聽清楚。城破那天，他們守的那段城牆是最後才丟的。十個人，沒有一個退下來。',
      },
      { text: '很多年後你才把那十個人的下落一個一個打聽清楚。城破那天，他們照你教的，背著傷兵從水門撤了出去。十個人，活下來七個。' },
    ],
    choices: [
      {
        id: 'stone',
        text: '替他們立一塊碑，把十個名字都刻上去',
        outcome: {
          text: '你一筆一筆地刻。刻到最小的那個孩子的名字時，鑿子停了很久。',
          effects: [xinxing(2), chiv(3)],
          recap: { weight: 3, text: '你替當年帶過的十個新兵立了一塊碑，十個名字都刻在上面。' },
        },
      },
      {
        id: 'visit',
        text: '一家一家，去看他們的家人',
        outcome: {
          text: '你走了大半年。有的人家已經找不到了，有的老人拉著你的手，問孩子最後吃得飽不飽。你都說：吃得飽。',
          effects: [chiv(5), meili(1), money(-20)],
          recap: { weight: 3, text: '你花了大半年，一家一家去看當年帶過的那十個新兵的家人。' },
        },
      },
    ],
  },

  // ==================== 百衲會 ====================
  {
    id: 'baina_ears',
    kind: 'normal',
    title: '耳目',
    weight: 16,
    conditions: { minAge: 15, maxAge: 60, sects: ['baina'] },
    tags: ['sect', 'social', 'village'],
    text: '百衲會的耳朵長在每一條巷子裡。這天，幾個小乞丐氣喘吁吁地跑來：城南的破窯裡來了一夥人牙子，半個月裡已經拐走了六個孩子，今晚就要裝船運走。',
    choices: [
      {
        id: 'storm',
        text: '點齊人手，今晚就去把窯端了',
        duel: {
          opponent: 'thugs',
          success: {
            text: '六個孩子一個不少。你們把人牙子捆成一串，扔在縣衙門口。第二天滿城都在傳：叫花子辦了官差辦不了的事。',
            effects: [chiv(6), fame(4), align(3), add('sect_merit', 2)],
            recap: { weight: 3, text: '{ageCn}歲那年，你帶著百衲會的人端了一窩人牙子，救回了六個孩子。' },
          },
          failure: {
            text: '那夥人比你想的狠。你們搶回了四個孩子，另外兩個，船已經開了。',
            effects: [chiv(4), add('sect_merit', 1)],
          },
        },
      },
      {
        id: 'trace',
        text: '先別動，摸清楚是誰在替他們撐腰',
        check: {
          stats: ['wuxing', 'meili'],
          difficulty: 6,
          success: {
            text: '你讓小乞丐們盯了三天，盯出了縣衙裡的一個師爺。孩子救回來了，那個師爺也進了大牢。葛百衲說：「這才是百衲會的打法。」',
            effects: [chiv(6), fame(3), wuxing(1), rel('ge_baina', 10), add('sect_merit', 2)],
            recap: { weight: 3, text: '{ageCn}歲那年，你靠著百衲會的耳目，揪出了替人牙子撐腰的師爺。' },
          },
          failure: { text: '你盯得太久。等你動手時，船已經走了一半。', effects: [chiv(2), xinxing(1)] },
        },
      },
      {
        id: 'sell',
        text: '把消息賣給苦主的家人',
        outcome: {
          text: '你收了錢，消息也是真的。孩子救沒救回來，你沒有再去打聽。葛百衲知道了，三天沒跟你說話。',
          effects: [money(50), chiv(-5), rel('ge_baina', -10)],
        },
      },
    ],
  },
  {
    id: 'baina_refugees',
    kind: 'normal',
    title: '流民',
    weight: 14,
    conditions: { minAge: 15, maxAge: 60, sects: ['baina'] },
    tags: ['sect', 'village', 'work'],
    text: '又一批流民湧進了城，少說有三四百人，在城隍廟前的空地上擠著過夜。地頭上的潑皮已經在挨個收「地皮錢」，官差站在一邊看。會裡的存糧，只夠自己人吃到開春。',
    choices: [
      {
        id: 'feed',
        text: '開會裡的糧，先讓孩子吃上一口',
        outcome: {
          text: '會裡有人罵你敗家。可是到了開春，那三四百人裡，有一半穿上了百衲衣。葛百衲說，會就是這樣一個人一個人湊起來的。',
          effects: [chiv(6), rel('ge_baina', 10), add('sect_merit', 1), health(-5)],
          recap: { weight: 2, text: '{ageCn}歲那年，你開了百衲會的存糧，分給城隍廟前的流民。' },
        },
      },
      {
        id: 'teach',
        text: '糧不能動，但教他們在這座城裡活下去的門道',
        outcome: {
          text: '哪條街的鋪子肯施粥、哪個碼頭缺短工、哪個官差收了錢就不找麻煩，你一樣一樣教給他們。這些事，比一碗粥頂用得久。',
          effects: [chiv(3), meili(1), wuxing(1)],
        },
      },
      {
        id: 'thugs',
        text: '先去把收地皮錢的潑皮趕走',
        duel: {
          opponent: 'thugs',
          success: {
            text: '潑皮們抱著頭跑了。流民裡有個老人顫巍巍地要給你磕頭，你趕緊扶住了他。',
            effects: [chiv(5), fame(3), align(2)],
          },
          failure: { text: '你被打得爬不起來。那些流民默默地把你抬到了廟裡，用最後一點乾淨的布替你包紮。', effects: [chiv(3)] },
        },
      },
    ],
  },
  {
    id: 'baina_mantle',
    kind: 'forced',
    title: '百衲衣',
    priority: 4,
    conditions: { minAge: 25, sects: ['baina'], npcAlive: ['ge_baina'], minYear: 1262, flagMin: { sect_merit: 1 } },
    tags: ['sect', 'social'],
    text: '葛百衲老了，拐杖換成了兩根。這天他把你叫到破廟後面，從神像底下拖出一只木箱，裡面是他穿了四十年的那件百衲衣：「每一塊補丁，都是一個人的命。我背不動了。你來背，還是讓它跟我一起進土裡？」',
    choices: [
      {
        id: 'accept',
        text: '接過百衲衣',
        outcome: {
          text: '那件衣裳比你想的重得多。你穿上它走出破廟，滿院子的人都站了起來。從今以後，他們的死活，都是你的事了。',
          effects: [flag('baina_chief'), fame(6), chiv(4), rel('ge_baina', 20)],
          recap: { weight: 5, text: '{ageCn}歲那年，你從葛百衲手裡接過了那件百衲衣，成了百衲會的當家。' },
        },
      },
      {
        id: 'other',
        text: '「會裡有比我更合適的人。」',
        outcome: {
          text: '你說了一個名字。葛百衲想了很久，點了點頭：「你看人比我準。」那個人接了衣裳，你站在他身後，替他擋了很多年的風。',
          effects: [xinxing(2), chiv(3), add('sect_merit', 1)],
        },
      },
      {
        id: 'disband',
        text: '「仗要打過來了。讓大家各自逃命吧。」',
        outcome: {
          text: '葛百衲閉上眼睛，很久才說：「也好。」那件百衲衣，後來和他葬在了一起。',
          effects: [flag('baina_dissolved'), xinxing(1)],
          recap: { weight: 3, text: '{ageCn}歲那年，葛百衲要把百衲會交給你。你勸他，讓大家各自逃命去。' },
        },
      },
    ],
  },
];

