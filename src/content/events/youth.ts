// 少年與初入江湖：立志、拜師、門派、名俠相遇。

import type { GameEvent } from '../../engine/types';
import {
  add, align, ambition, card, chiv, danshi, die, dropItem, fame, flag, fuyuan, goTo, health, item, join, later, leaveSect, master, meet, meili, money, rel, wuxing, xinxing, xp,
} from '../dsl';

export const youthEvents: GameEvent[] = [
  {
    id: 'ambition',
    kind: 'forced',
    title: '少年立志',
    priority: 9,
    conditions: { minAge: 13, maxAge: 16, hasAmbition: false },
    tags: ['family'],
    text: [
      {
        if: { flags: ['father_dead'] },
        text: '{ageCn}歲這年的除夕，你一個人坐在門檻上守歲。母親說，你父親若還在，一定會問你：將來想做什麼樣的人？',
      },
      { text: '{scene}：「你也不小了。將來，想做什麼樣的人？」' },
    ],
    vars: {
      scene: [
        '{ageCn}歲這年的除夕，家裡守歲到半夜。長輩摸著你的頭問',
        '{ageCn}歲這年的元宵，燈會散了，長輩牽著你走在回家的路上，忽然問',
        '{ageCn}歲這年的中秋，一家人坐在院子裡賞月。長輩看著月亮，問你',
        '{ageCn}歲這年清明，你跟著長輩去上墳。在墳前，長輩問你',
      ],
    },
    choices: [
      {
        id: 'martial',
        text: '「我要練成天下無敵的武功。」',
        requires: { minMartial: 1 },
        hidden: true,
        outcome: {
          text: '長輩看了看你手上的繭，嘆了口氣：「那就別怕吃苦。」',
          effects: [ambition('martial'), danshi(1)],
          recap: { weight: 2, text: '{ageCn}歲那年，你說要練成天下無敵的武功。' },
        },
      },
      {
        id: 'chivalry',
        text: '「我要做個鋤強扶弱的俠客。」',
        requires: { any: [{ minChivalry: 5 }, { flags: ['saved_lu'] }, { flags: ['river_hero'] }] },
        hidden: true,
        outcome: {
          text: '長輩笑了：「俠客可不好當。」可你看得出來，那笑裡有幾分驕傲。',
          effects: [ambition('chivalry'), chiv(3)],
          recap: { weight: 2, text: '{ageCn}歲那年，你說要做個鋤強扶弱的俠客。' },
        },
      },
      {
        id: 'healer',
        text: '「我要像那些大夫一樣救人。」',
        requires: { any: [{ backgrounds: ['physician'] }, { minSkill: { baicao: 1 } }, { flags: ['plague_helper'] }] },
        hidden: true,
        outcome: {
          text: '長輩點點頭：「醫者的手，一輩子都放不下。想好了？」你用力點頭。',
          effects: [ambition('healer'), xinxing(1)],
          recap: { weight: 2, text: '{ageCn}歲那年，你說要做一個救人的大夫。' },
        },
      },
      {
        id: 'wealth',
        text: '「我要賺很多很多錢，讓家裡再也不愁吃穿。」',
        requires: { any: [{ backgrounds: ['merchant'] }, { flags: ['fortune_decline'] }, { flags: ['zhua_coin'] }] },
        hidden: true,
        outcome: {
          text: '長輩哈哈大笑：「好！比那些空口說白話的強。」',
          effects: [ambition('wealth'), meili(1)],
          recap: { weight: 2, text: '{ageCn}歲那年，你說要賺很多錢，讓家裡再也不愁吃穿。' },
        },
      },
      {
        id: 'nation',
        text: '「我要從軍，把北邊打來的兵趕回去。」',
        requires: { flags: ['war_seen'] },
        hidden: true,
        outcome: {
          text: '屋裡忽然安靜了。過了很久，長輩才低聲說：「這世道，總得有人去。」',
          effects: [ambition('nation'), danshi(1)],
          recap: { weight: 2, text: '{ageCn}歲那年，你說要從軍保家衛國。' },
        },
      },
      {
        id: 'revenge',
        text: '「我要報仇。」',
        requires: { flags: ['blood_feud'] },
        hidden: true,
        outcome: {
          text: '沒有人接話。燈花爆了一下，你的影子在牆上晃了晃。',
          effects: [ambition('revenge')],
          recap: { weight: 2, text: '{ageCn}歲那年，你發誓要報仇。' },
        },
      },
      {
        id: 'peace',
        text: '「我只想平平安安過一輩子。」',
        outcome: {
          text: '長輩愣了一下，然後笑得很開心：「這比什麼都難得。」',
          effects: [ambition('peace'), xinxing(1)],
          recap: { weight: 1, text: '{ageCn}歲那年，你說只想平平安安過一輩子。' },
        },
      },
    ],
  },
  {
    id: 'old_friend_visit',
    kind: 'normal',
    title: '故人來訪',
    scheduledOnly: true,
    tags: ['social'],
    text: '有人在門外喊你的名字。來人背著一口刀，曬得黝黑，笑起來卻還是當年那副靦腆的模樣。是陸平。他說自己這些年在長風鏢局當趟子手，如今已經是正式的鏢師了。',
    choices: [
      {
        id: 'drink',
        text: '拉他喝酒，聊到天亮',
        outcome: {
          text: '陸平說，當年要不是你擋在前面，他大概早就離開那個鎮子了。臨走前他說：「以後有事，到鏢局找我。」',
          effects: [rel('lu_ping', 20), meili(1), flag('lu_friend')],
          recap: { weight: 2, text: '當年被你救下的陸平回來找你，你們喝酒聊到了天亮。' },
        },
      },
      {
        id: 'join',
        text: '跟他走，到長風鏢局謀個差事',
        requires: { hasSect: false },
        outcome: {
          text: '陸平替你作保。總鏢頭上下打量了你一眼：「先從趟子手做起。」',
          effects: [join('changfeng'), goTo('jiangnan'), xp('liuyun', 2), rel('lu_ping', 25), flag('lu_friend')],
          recap: { weight: 2, text: '{ageCn}歲那年，當年被你救下的陸平回來找你，帶你進了長風鏢局。' },
        },
      },
      {
        id: 'polite',
        text: '寒暄幾句就送客',
        outcome: {
          text: '陸平有些失落，留下一包江南的茶葉就走了。',
          effects: [rel('lu_ping', 5)],
        },
      },
    ],
  },
  // ---- 醉劍沈孤舟 ----
  {
    id: 'shen_wine_1',
    kind: 'normal',
    title: '醉劍',
    weight: 9,
    weightMods: [{ if: { traits: ['haojiu'] }, mult: 3 }, { if: { flags: ['seek_sword'] }, mult: 3 }],
    conditions: { minAge: 14, maxAge: 45, npcPresent: 'shen_guzhou' },
    tags: ['tavern', 'travel'],
    text: '酒肆的角落裡，一個邋遢的中年人趴在桌上，腰間掛著一柄舊劍。掌櫃正揪著他的衣領要酒錢，他眼睛都沒睜開，只嘟囔了一句：「記帳。」',
    choices: [
      {
        id: 'pay',
        text: '替他把酒錢付了',
        requires: { minMoney: 5 },
        outcome: {
          text: '那人抬起頭看了你一眼，眼神清得一點都不像喝醉了。「我叫沈孤舟，」他說，「欠你一碗。」',
          effects: [money(-5), add('shen_wine'), rel('shen_guzhou', 15), meet('shen_guzhou')],
        },
      },
      {
        id: 'ask',
        text: '走過去問他腰上那把劍是不是真的',
        outcome: {
          text: '他斜眼瞧你，用兩根手指夾住筷子，在你面前輕輕一劃。桌上的酒碗整整齊齊地裂成了兩半。掌櫃不再要錢了。',
          effects: [danshi(1), rel('shen_guzhou', 5), meet('shen_guzhou')],
        },
      },
      {
        id: 'mock',
        text: '跟著旁人一起笑他',
        outcome: {
          text: '他也跟著笑，笑完了把剩下的酒一口喝乾，搖搖晃晃地走了。你後來才聽說，那是江湖上有名的「醉劍」沈孤舟。',
          effects: [flag('shen_mocked'), rel('shen_guzhou', -30), meet('shen_guzhou')],
        },
      },
    ],
  },
  {
    id: 'shen_wine_2',
    kind: 'normal',
    title: '再遇醉劍',
    weight: 14,
    conditions: { minAge: 15, maxAge: 50, npcPresent: 'shen_guzhou', flagMin: { shen_wine: 1 }, flagMax: { shen_wine: 1 } },
    tags: ['tavern', 'travel'],
    text: '又是一家酒肆，又是那個趴在桌上的身影。沈孤舟遠遠看見你，舉起空碗晃了晃：「上回欠你一碗，今天換你請。」',
    choices: [
      {
        id: 'drink',
        text: '叫兩罈好酒，陪他喝',
        requires: { minMoney: 10 },
        check: {
          stats: ['wuxing'],
          difficulty: 6,
          success: {
            text: '酒過三巡，他用筷子在桌上比劃了一招劍式。你看得入神，回去之後竟然比劃出了七八分模樣。',
            effects: [money(-10), add('shen_wine'), rel('shen_guzhou', 20), xp('hanjiang', 2)],
          },
          failure: {
            text: '酒過三巡，他用筷子比劃了一招劍式。你只看見筷子的影子一閃，什麼都沒看清。他也不在意，倒頭就睡。',
            effects: [money(-10), add('shen_wine'), rel('shen_guzhou', 20)],
          },
        },
      },
      {
        id: 'talk',
        text: '問他為什麼總是一個人喝悶酒',
        outcome: {
          text: '他沉默了很久，只說了一句：「劍練到最後，身邊就沒人了。」',
          effects: [add('shen_wine'), rel('shen_guzhou', 10), xinxing(1)],
        },
      },
      {
        id: 'refuse',
        text: '這次不想請了',
        outcome: {
          text: '他聳聳肩，招呼掌櫃：「記帳。」',
          effects: [flag('shen_refused'), rel('shen_guzhou', -10)],
        },
      },
    ],
  },
  {
    id: 'shen_wine_3',
    kind: 'normal',
    title: '三碗酒',
    weight: 16,
    conditions: { minAge: 16, maxAge: 55, npcPresent: 'shen_guzhou', flagMin: { shen_wine: 2 } },
    tags: ['tavern', 'travel', 'martial'],
    text: '第三次遇見沈孤舟，是在一個下雨的夜裡。他沒有喝醉，坐在屋簷下擦劍。「三碗酒了，」他說，「我沈孤舟從不收徒弟，但從不欠人情。」',
    choices: [
      {
        id: 'learn',
        text: '「我想學你的劍。」',
        check: {
          stats: ['wuxing', 'xinxing'],
          difficulty: 6,
          success: {
            text: '他教了你一整夜。天亮時雨停了，你一劍刺出，簷下的雨珠竟被劍風逼得倒飛回去。他點點頭：「寒江劍法，你學全了。」',
            effects: [xp('hanjiang', 7), flag('shen_friend'), rel('shen_guzhou', 30)],
            recap: { weight: 3, text: '{ageCn}歲那年的雨夜，醉劍沈孤舟在屋簷下教了你一套寒江劍法。' },
          },
          failure: {
            text: '他教了一夜，你只學會了前三式。他嘆了口氣：「夠用了。剩下的，等你哪天心靜了，自己會懂。」',
            effects: [xp('hanjiang', 4), flag('shen_friend'), rel('shen_guzhou', 25)],
            recap: { weight: 3, text: '{ageCn}歲那年的雨夜，醉劍沈孤舟在屋簷下教了你三式劍法。' },
          },
        },
      },
      {
        id: 'friend',
        text: '「我不要你還什麼，只想交你這個朋友。」',
        outcome: {
          text: '他盯著你看了很久，忽然大笑起來，笑得雨水都濺到了臉上。那一夜，他把這輩子的故事都講給了你聽。',
          effects: [rel('shen_guzhou', 40), flag('shen_friend'), xp('hanjiang', 2), fuyuan(1)],
          recap: { weight: 3, text: '{ageCn}歲那年的雨夜，你和醉劍沈孤舟成了忘年之交。' },
        },
      },
    ],
  },
  {
    id: 'shen_last_request',
    kind: 'forced',
    title: '醉劍的託付',
    priority: 4,
    conditions: { minYear: 1266, maxYear: 1270, flags: ['shen_friend'], notFlags: ['dead_shen_guzhou'] },
    tags: ['social'],
    text: '一個陌生的少年找到你，說有位姓沈的先生快不行了，臨終前只想見你一面。你趕到時，沈孤舟靠在床頭，屋裡全是藥味，沒有酒。他從枕下摸出一封泛黃的信：「替我送到川蜀的雲棲庵，交給一位叫素心的師太。三十年了，我一直沒臉去。」',
    choices: [
      {
        id: 'go',
        text: '接過信，即刻啟程',
        outcome: {
          text: '你一路翻山越嶺，在雲棲庵前把信交到一位白髮師太的手裡。她讀完信，在佛前跪了一整夜。第二天，她讓你轉告：「我早就不怪他了。」可是等你回去時，沈孤舟已經走了。',
          effects: [flag('promise_kept_shen'), flag('dead_shen_guzhou'), goTo('shu'), fame(3), chiv(5), xinxing(1)],
          recap: { weight: 4, text: '沈孤舟臨終前託你送一封信。你把信送到了，卻沒來得及把回話帶給他。' },
        },
      },
      {
        id: 'later',
        text: '收下信，等手頭的事了了再去',
        outcome: {
          text: '他點點頭，什麼也沒說。三天後，他在睡夢中走了。那封信，你一直揣在懷裡。',
          effects: [flag('dead_shen_guzhou'), flag('shen_letter_pending'), item('shen_letter'), later('shen_letter_late', 2, 4)],
        },
      },
      {
        id: 'refuse',
        text: '「這種事，你該自己去。」',
        outcome: {
          text: '他愣了一下，笑了：「你說得對。」他把信扔進了火盆。那是你最後一次見到他。',
          effects: [flag('dead_shen_guzhou'), flag('shen_refused_letter'), rel('shen_guzhou', -20)],
          recap: { weight: 3, text: '沈孤舟臨終前想託你送一封信。你沒有接。' },
        },
      },
    ],
  },
  {
    id: 'shen_letter_late',
    kind: 'normal',
    title: '遲到的信',
    scheduledOnly: true,
    tags: ['travel'],
    text: '你終於找到了雲棲庵。開門的小尼姑說，素心師太去年冬天已經圓寂了。',
    choices: [
      {
        id: 'burn',
        text: '把信燒在師太的墓前',
        outcome: {
          text: '火光裡，你彷彿聽見沈孤舟在笑。你在墓前一直坐到天黑。',
          effects: [flag('promise_late_shen'), dropItem('shen_letter'), xinxing(2)],
          recap: { weight: 3, text: '沈孤舟託你的那封信，你送遲了一年。' },
        },
      },
      {
        id: 'read',
        text: '拆開信來讀',
        outcome: {
          text: '信裡只有一句話，和一式你從沒見過的劍招。你終於明白，那套寒江劍法為什麼總是少了一式。',
          effects: [flag('read_shen_letter'), dropItem('shen_letter'), wuxing(1), xp('hanjiang', 3), card('dudiao')],
          recap: { weight: 3, text: '你拆開了沈孤舟沒能送到的信，在信裡找到了寒江劍法的最後一式。' },
        },
      },
    ],
  },
  // ---- 白翎箭：非商賈出身也有機會遇見 ----
  {
    id: 'border_market',
    kind: 'normal',
    title: '榷場的箭手',
    weight: 8,
    conditions: { minAge: 15, maxAge: 26, maxYear: 1257, notFlags: ['met_bater'] },
    tags: ['travel'],
    text: '你遊歷到淮水邊的一處榷場。一隊蒙古使者的隨從在空地上射箭取樂，為首的年輕人箭無虛發，箭袋裡插著一排白色的箭羽。他注意到人群中的你，用生硬的漢話問：「你，敢不敢？」',
    choices: [
      {
        id: 'compete',
        text: '接下他的弓',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 6,
          success: {
            text: '你們各射十箭，打成了平手。他哈哈大笑，從箭袋裡抽出一根白羽箭送你：「巴特爾。朋友。」',
            effects: [rel('bater', 25), meet('bater'), flag('grassland_pact'), item('bailing'), fame(3)],
            recap: { weight: 3, text: '{ageCn}歲那年，你在淮水邊的榷場和蒙古箭手巴特爾比箭，結成了朋友。' },
          },
          failure: {
            text: '你輸得一塌糊塗。他卻沒笑你，拍拍你的肩膀，送了你一根白羽箭：「巴特爾。下次，再比。」',
            effects: [rel('bater', 15), meet('bater'), flag('grassland_pact'), item('bailing')],
            recap: { weight: 3, text: '{ageCn}歲那年，你在淮水邊的榷場輸給了蒙古箭手巴特爾，他送了你一根白羽箭。' },
          },
        },
      },
      {
        id: 'wine',
        text: '婉拒比箭，請他喝一碗酒',
        requires: { minMoney: 5 },
        outcome: {
          text: '他喝了一口江南的米酒，皺著眉頭說太甜，卻把一整罈都喝光了。臨別時，他送你一根白羽箭。他叫巴特爾。',
          effects: [money(-5), rel('bater', 20), meet('bater'), flag('grassland_pact'), item('bailing')],
          recap: { weight: 3, text: '{ageCn}歲那年，你在淮水邊請蒙古箭手巴特爾喝了一罈米酒。' },
        },
      },
      {
        id: 'leave',
        text: '轉身離開',
        outcome: { text: '身後傳來一陣鬨笑。你沒有回頭。', effects: [flag('ignored_bater')] },
      },
    ],
  },
  // ---- 長風鏢局 ----
  {
    id: 'escort_recruit',
    kind: 'normal',
    title: '鏢局招人',
    weight: 9,
    conditions: { minAge: 15, maxAge: 30, regions: ['jiangnan'], hasSect: false },
    tags: ['work', 'travel'],
    text: '長風鏢局在城門口貼了告示：招趟子手，管吃管住，月錢三百文。告示前圍了一圈人，有個鏢師正讓應徵的人輪流舉石鎖。',
    choices: [
      {
        id: 'lift',
        text: '上前舉石鎖',
        check: {
          stats: ['gengu'],
          difficulty: 5,
          success: {
            text: '你把石鎖舉過頭頂，穩穩放下。鏢師點點頭：「明天卯時來點卯。」',
            effects: [join('changfeng'), xp('liuyun', 2), money(20)],
            recap: { weight: 2, text: '{ageCn}歲那年，你進了長風鏢局當趟子手。' },
          },
          failure: {
            text: '石鎖只抬到胸口就落了地。鏢師搖搖頭：「力氣不夠，過兩年再來。」',
            effects: [xinxing(1), flag('escort_rejected')],
          },
        },
      },
      {
        id: 'pass',
        text: '看看就好',
        outcome: {
          text: '你看了一會兒，轉身走了。走鏢的日子刀口舔血，不是誰都過得了的。',
          effects: [flag('passed_escort')],
        },
      },
    ],
  },
  {
    id: 'escort_mission',
    kind: 'normal',
    title: '護鏢',
    weight: 12,
    repeatable: true,
    cooldown: 2,
    maxTimes: 4,
    conditions: { minAge: 16, maxAge: 50, sects: ['changfeng'] },
    tags: ['sect', 'work', 'travel'],
    vars: {
      cargo: ['一批綢緞', '一箱官銀', '一位富商的家眷', '一車名貴藥材', '一口誰也不許打開的木箱'],
      dest: ['襄陽', '臨安', '成都', '揚州', '鄂州'],
      ambush: [
        '走到半路的山坳裡，林子裡突然響起一聲呼哨，幾十個蒙面人攔住了去路。',
        '渡河時，對岸的蘆葦叢裡忽然衝出十幾條小船，船上全是水寇。',
        '黃昏時分，一群扮成難民的人圍了上來，破衣服底下露出了刀。',
        '夜宿客棧，半夜裡你聞到一股異香——有人在往房裡吹迷煙。',
      ],
    },
    text: '這一趟鏢押的是{cargo}，要送往{dest}。{ambush}',
    choices: [
      {
        id: 'fight',
        text: '拔刀護鏢',
        duel: {
          opponent: 'robbers',
          success: {
            text: '一場惡戰，你砍翻了兩個賊人，其餘的一哄而散。總鏢頭當眾賞了你一錠銀子。',
            effects: [money(40), fame(4), align(2), add('escort_success'), xp('liuyun', 1)],
          },
          failure: {
            text: '你被打得頭破血流，貨也被搶了一半。總鏢頭沒罵你，只說：「人活著就好。」',
            effects: [money(-10)],
          },
        },
      },
      {
        id: 'talk',
        text: '上前搭話，報出鏢局的名號',
        check: {
          stats: ['meili'],
          difficulty: 6,
          success: {
            text: '你抱拳行禮，說了幾句場面話，又塞了一包銀子。對方頭目哈哈大笑，讓開了路。',
            effects: [fame(2), add('escort_success'), meili(1)],
          },
          failure: {
            text: '對方根本不吃這一套。你們拚死才突圍出去。',
            effects: [health(-15)],
          },
        },
      },
      {
        id: 'detour',
        text: '帶著車隊繞小路',
        check: {
          stats: ['wuxing'],
          difficulty: 5,
          success: {
            text: '你帶著車隊鑽進一條獵戶走的小道，多走了三天，總算平安到了。',
            effects: [add('escort_success'), wuxing(1)],
          },
          failure: {
            text: '繞路時，一輛車翻進了山溝，貨全毀了。',
            effects: [money(-20)],
          },
        },
      },
      {
        id: 'embezzle',
        text: '跟賊人談好價錢，把鏢分了',
        check: {
          stats: ['meili', 'danshi'],
          difficulty: 5,
          success: {
            text: '你和賊頭在林子裡分了貨，回去只說是被劫了。總鏢頭盯著你看了很久，什麼也沒說。第二個月，你自己辭了鏢局。從此江湖上都說，長風鏢局出過一個監守自盜的人。',
            effects: [money(150), align(-20), chiv(-8), leaveSect(), flag('broke_with_sect'), flag('betrayed_changfeng')],
            recap: { weight: 4, text: '你在長風鏢局監守自盜，帶著一筆不乾淨的錢離開了鏢局。' },
          },
          failure: {
            text: '賊頭收了錢，轉身就把你賣了。你被五花大綁地送回鏢局，總鏢頭當著所有人的面，把你逐出了門。',
            effects: [align(-15), fame(-5), leaveSect(), flag('broke_with_sect'), flag('expelled')],
            recap: { weight: 4, text: '你在長風鏢局監守自盜，被當眾逐出了門。' },
          },
        },
      },
    ],
  },
  // ---- 濟世藥谷 ----
  {
    id: 'yaogu_entrance',
    kind: 'normal',
    title: '藥谷收徒',
    weight: 12,
    conditions: {
      minAge: 13,
      maxAge: 28,
      regions: ['shu'],
      hasSect: false,
      any: [{ backgrounds: ['physician'] }, { minSkill: { baicao: 1 } }, { flags: ['plague_helper'] }],
    },
    tags: ['medicine'],
    text: '濟世藥谷每三年收一次弟子。考題只有一道：谷口的草棚裡躺著三個病人，一炷香之內，說出他們得的是什麼病。',
    choices: [
      {
        id: 'try',
        text: '進草棚應考',
        requires: { minAlignment: 0 },
        hint: '谷口的弟子認得你，搖了搖頭：「藥谷不收名聲不好的人。」',
        check: {
          stats: ['wuxing', 'xinxing'],
          difficulty: 6,
          skill: 'baicao',
          success: [
            {
              if: { flags: ['plague_helper'] },
              text: '你三個都答對了。林鶴年看了你的答卷，又看了看你的臉，笑了：「當年那個煎藥的孩子？進來吧。」',
              effects: [join('yaogu'), master('lin_henian'), meet('lin_henian'), rel('lin_henian', 20), xp('baicao', 4), item('yaowang_notes')],
              recap: { weight: 3, text: '{ageCn}歲那年，你拜入濟世藥谷，成了藥王林鶴年的弟子。他還記得當年那個煎藥的孩子。' },
            },
            {
              text: '你三個都答對了。一個白鬍子老人接過你的答卷，看了很久：「我是林鶴年。從今天起，你是藥谷的人了。」',
              effects: [join('yaogu'), master('lin_henian'), meet('lin_henian'), rel('lin_henian', 20), xp('baicao', 4), item('yaowang_notes')],
              recap: { weight: 3, text: '{ageCn}歲那年，你通過了考驗，拜入濟世藥谷，成了藥王林鶴年的弟子。' },
            },
          ],
          failure: {
            text: '你只說對了一個。林鶴年看了你的答卷：「底子不夠，心思倒細。三年後再來。」',
            effects: [later('yaogu_retry', 2, 4), flag('yaogu_failed'), meet('lin_henian'), xinxing(1)],
          },
        },
      },
      {
        id: 'hesitate',
        text: '打聽清楚再說',
        outcome: { text: '你在谷口站了半天，終究沒有進去。', effects: [flag('yaogu_hesitated')] },
      },
    ],
  },
  {
    id: 'yaogu_retry',
    kind: 'normal',
    title: '再赴藥谷',
    scheduledOnly: true,
    conditions: { regions: ['shu'], hasSect: false, maxAge: 35 },
    tags: ['medicine'],
    text: '幾年過去，你又站在了藥谷的谷口。草棚還是那個草棚，林鶴年也還記得你。',
    choices: [
      {
        id: 'retry',
        text: '再考一次',
        requires: { minAlignment: 0 },
        hint: '這幾年你在江湖上的名聲，林鶴年也聽說了。',
        check: {
          stats: ['wuxing', 'xinxing'],
          difficulty: 5,
          skill: 'baicao',
          success: {
            text: '這一回，你三個都答對了。林鶴年捋著鬍子：「我就知道你會回來。」',
            effects: [join('yaogu'), master('lin_henian'), rel('lin_henian', 25), xp('baicao', 4), item('yaowang_notes')],
            recap: { weight: 3, text: '{ageCn}歲那年，你第二次叩開濟世藥谷的大門，終於成了藥王林鶴年的弟子。' },
          },
          failure: {
            text: '你又落選了。林鶴年拍拍你的肩：「醫道不是每個人都走得通。去吧，別處也能救人。」',
            effects: [flag('yaogu_final_fail'), xp('baicao', 1)],
          },
        },
      },
      {
        id: 'give_up',
        text: '算了',
        outcome: { text: '你在谷口鞠了一躬，轉身下山。', effects: [flag('gave_up_yaogu')] },
      },
    ],
  },
  // ---- 百衲會 ----
  {
    id: 'baina_meet',
    kind: 'normal',
    title: '百衲翁',
    weight: 9,
    conditions: { minAge: 12, maxAge: 35, npcPresent: 'ge_baina' },
    tags: ['social', 'village'],
    text: '城隍廟前，幾個官差正在驅趕乞丐。一個穿著百衲衣的老乞丐被推倒在地，碗裡的銅錢滾了一地。',
    choices: [
      {
        id: 'help',
        text: '上前扶起老人，幫他撿錢',
        outcome: {
          text: '老人摸著一枚枚銅錢，笑道：「好孩子。」後來你才知道，他就是百衲會的首領葛百衲，襄陽城裡一半的乞丐和流民都聽他的。',
          effects: [chiv(5), rel('ge_baina', 20), meet('ge_baina'), flag('helped_baina')],
        },
      },
      {
        id: 'argue',
        text: '和官差理論',
        check: {
          stats: ['danshi', 'meili'],
          difficulty: 6,
          success: {
            text: '你一番話說得官差啞口無言，悻悻地走了。老乞丐瞇著眼睛看你：「有膽，也有嘴。」他叫葛百衲。',
            effects: [fame(3), chiv(5), rel('ge_baina', 25), meet('ge_baina'), flag('helped_baina')],
          },
          failure: {
            text: '官差把你也一起轟了出去。老乞丐跟你並排坐在牆根下，笑個不停。他叫葛百衲。',
            effects: [health(-15), rel('ge_baina', 25), meet('ge_baina'), flag('helped_baina')],
          },
        },
      },
      {
        id: 'ignore',
        text: '繞開',
        outcome: { text: '你加快腳步走過廟前。', effects: [flag('ignored_baina')] },
      },
    ],
  },
  {
    id: 'baina_join',
    kind: 'normal',
    title: '入會',
    weight: 14,
    conditions: { minAge: 13, maxAge: 40, flags: ['helped_baina'], hasSect: false, npcPresent: 'ge_baina' },
    tags: ['social'],
    text: '葛百衲找到你：「百衲會不是乞丐窩。亂世裡，沒人管的人，得自己管自己。你願不願意來？」',
    choices: [
      {
        id: 'join',
        text: '入會',
        outcome: {
          text: '你接過一件百衲衣。葛百衲說：「每一塊補丁，都是一個人的命。」',
          effects: [join('baina'), master('ge_baina'), xp('shijing', 3), rel('ge_baina', 20)],
          recap: { weight: 2, text: '{ageCn}歲那年，你穿上百衲衣，入了葛百衲的百衲會。' },
        },
      },
      {
        id: 'decline',
        text: '婉拒',
        outcome: { text: '葛百衲也不勉強：「門一直開著。」', effects: [rel('ge_baina', -5), flag('declined_baina')] },
      },
    ],
  },
  {
    id: 'illness_relapse',
    kind: 'forced',
    title: '舊疾',
    priority: 5,
    conditions: { minAge: 17, maxAge: 26, flags: ['hidden_illness'], notFlags: ['illness_cured'] },
    tags: ['medicine'],
    text: '那年冬天，胎裡帶來的病根又發作了。你咳得整夜睡不著，咳出的痰裡帶著血絲。鎮上的大夫搖著頭說：「這回不比從前，再拖下去，怕是要出人命。」',
    choices: [
      {
        id: 'yaogu',
        text: '去川蜀的濟世藥谷求醫',
        check: {
          stats: ['fuyuan'],
          difficulty: 4,
          success: [
            {
              if: { flags: ['saved_by_lin'] },
              text: '林鶴年看見你，笑了：「又是你這條硬命。」他替你施了九天的針，病根竟真的拔除了。',
              effects: [goTo('shu'), flag('illness_cured'), health(30), meet('lin_henian'), rel('lin_henian', 15)],
              recap: { weight: 3, text: '{ageCn}歲那年，藥王林鶴年第二次救了你的命，治好了糾纏半生的舊疾。' },
            },
            {
              text: '藥谷的人說，谷主從不輕易出手。你在谷口等了七天，林鶴年終於出來看了你一眼，親手替你施針。病根拔除了。',
              effects: [goTo('shu'), flag('illness_cured'), health(30), meet('lin_henian'), rel('lin_henian', 15)],
              recap: { weight: 3, text: '{ageCn}歲那年，你千里迢迢到濟世藥谷求醫，治好了糾纏半生的舊疾。' },
            },
          ],
          failure: {
            text: '林鶴年替你施了針：「根治不了，只能養著。」',
            effects: [goTo('shu'), health(-10), meet('lin_henian'), flag('illness_managed')],
          },
        },
      },
      {
        id: 'self',
        text: '自己翻醫書找方子',
        requires: { minSkill: { baicao: 2 } },
        check: {
          stats: ['wuxing'],
          difficulty: 6,
          skill: 'baicao',
          success: {
            text: '你試了十幾個方子，終於找對了路。病好之後，你對醫書上的每一個字都多了幾分敬畏。',
            effects: [flag('illness_cured'), xp('baicao', 2), health(20)],
          },
          failure: {
            text: '藥吃錯了，病反而更重。你在床上躺了整整一個冬天。',
            effects: [health(-25)],
          },
        },
      },
      {
        id: 'endure',
        text: '咬牙硬撐',
        check: {
          stats: ['gengu', 'xinxing'],
          difficulty: 6,
          success: {
            text: '你撐過了那個冬天。從此你知道，這副身子骨經不起太多折騰。',
            effects: [health(-30), xinxing(2), flag('endured_illness')],
          },
          failure: {
            text: '開春的時候，你已經下不了床了。窗外的桃花開得很好，你看了很久，想起小時候答應過的那些事。',
            effects: [die('illness')],
          },
        },
      },
    ],
  },
  {
    id: 'tournament',
    kind: 'normal',
    title: '鎮上比武',
    weight: 9,
    conditions: { minAge: 14, maxAge: 30 },
    tags: ['sparring', 'martial'],
    text: [
      { if: { backgrounds: ['merchant'] }, text: '幾家商號合辦了一場比武，想招幾個護院。長輩的生意夥伴慫恿你也上台試試。' },
      { if: { backgrounds: ['physician'] }, text: '鎮上辦比武，台下缺一個看傷的大夫，主事的人硬是把你拉了過去。' },
      { text: '鎮上的大戶辦了一場比武，贏一場有二十文錢。你擠在人群裡，攥緊了拳頭。' },
    ],
    choices: [
      {
        id: 'fight',
        text: '上台比試',
        duel: {
          opponent: 'tourney',
          success: {
            text: '你連勝三場，台下叫好聲不斷。主事的人把彩頭塞進你手裡，還問你願不願意留下來。',
            effects: [fame(5), money(20), flag('won_tournament')],
            recap: { weight: 1, text: '{ageCn}歲那年，你在鎮上的比武中連勝三場。' },
          },
          failure: {
            text: '第一場你就被人一腳踹下了台。你爬起來拍拍灰，把對方的招式記在了心裡。',
            effects: [xinxing(1)],
          },
        },
      },
      {
        id: 'dirty',
        text: '上台前，在對手的茶裡加點東西',
        check: {
          stats: ['wuxing'],
          difficulty: 4,
          success: {
            text: '對手上台時腳步虛浮，你沒費什麼力氣就贏了。彩頭拿在手裡，卻沒有想像中沉。',
            effects: [fame(3), money(20), align(-8), flag('won_tournament')],
          },
          failure: {
            text: '對手喝了一口就吐了出來，當場揪住你的領子。台下的人都看見了。',
            effects: [fame(-5), align(-10), health(-10)],
          },
        },
      },
      {
        id: 'watch',
        text: '在台下看，琢磨別人的招式',
        outcome: { text: '你看了一整天，回去後把幾個漂亮的招式拆開來練。', effects: [wuxing(1), xp('changquan', 1)] },
      },
      {
        id: 'heal',
        text: '替受傷的人包紮',
        requires: { minSkill: { baicao: 1 } },
        outcome: {
          text: '那天你接了七八個骨頭錯位的、兩個頭破血流的。散場時，不少人過來跟你道謝。',
          effects: [add('healed'), fame(2), meili(1)],
        },
      },
    ],
  },
  {
    id: 'meet_lin_shu',
    kind: 'normal',
    title: '山中採藥人',
    weight: 8,
    conditions: { minAge: 13, maxAge: 40, npcPresent: 'lin_henian', notFlags: ['met_lin_henian'] },
    tags: ['medicine', 'travel'],
    text: '你在山中迷了路，遇見一個背著藥簍的白鬍子老人。他看了看你的臉色：「你最近睡不好，肝火旺。」說著從簍裡抓了一把草給你。',
    choices: [
      {
        id: 'thank',
        text: '道謝，順便請教他草藥的名字',
        outcome: {
          text: '老人一路走一路講，講了一下午。分別時，他說：「我叫林鶴年。有空來藥谷坐坐。」',
          effects: [meet('lin_henian'), rel('lin_henian', 15), xp('baicao', 1)],
        },
      },
      {
        id: 'doubt',
        text: '懷疑他是江湖騙子，婉拒',
        outcome: {
          text: '老人也不惱，把草放在路邊的石頭上就走了。後來你才知道，他就是藥王林鶴年。',
          effects: [meet('lin_henian'), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'border_rumor_bater',
    kind: 'normal',
    title: '草原的信',
    weight: 10,
    conditions: { minAge: 18, maxAge: 35, flags: ['grassland_pact'], maxYear: 1255 },
    tags: ['social', 'trade'],
    text: '一個北邊來的商人輾轉找到你，交給你一個布包。裡面是一張歪歪扭扭的字條，和一根白色的箭羽。字條上只有幾個漢字：「我，百夫長了。你，好嗎？」',
    choices: [
      {
        id: 'reply',
        text: '託商人捎一封回信',
        outcome: {
          text: '你寫了很長的一封信，又覺得寫得太長，刪到只剩一句：「我很好。別打仗。」',
          effects: [rel('bater', 15), flag('wrote_bater')],
        },
      },
      {
        id: 'keep',
        text: '把箭羽收好，不回信',
        outcome: {
          text: '你把兩根箭羽並排放在箱子底。這世道，回信也不知道能不能送到。',
          effects: [xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'bandit_raid',
    kind: 'normal',
    title: '潰兵過境',
    weight: 7,
    conditions: { minAge: 14, maxAge: 32, minYear: 1236, notFlags: ['father_dead'] },
    tags: ['war', 'village'],
    text: '一隊潰散的兵丁闖進了{place}附近的村子，見東西就搶。帶頭的是個臉上有刀疤的漢子，人稱「疤臉」。你家就在村口。',
    choices: [
      {
        id: 'guard',
        text: '抄起扁擔護住家門',
        duel: {
          opponent: 'scar_young',
          success: {
            text: '你守在門口，第一個衝進來的人被你一扁擔砸在肩上。疤臉看了你一眼，罵了一聲，帶人轉去了別家。',
            effects: [fame(5), chiv(5), align(3), flag('drove_bandits'), later('scar_return', 1, 3, 6)],
            recap: { weight: 2, text: '{ageCn}歲那年潰兵進村，你一根扁擔守住了家門。' },
          },
          failure: {
            text: '你被一刀背砸倒在地。父親撲上來護住你，疤臉的刀落了下去。那天之後，家裡的門檻上多了一道洗不掉的血痕。',
            effects: [flag('father_dead'), flag('blood_feud'), item('father_relic'), later('revenge_chance', 6, 14, 20)],
            recap: { weight: 5, text: '{ageCn}歲那年，潰兵疤臉闖進村子，父親為了護你，死在了他的刀下。' },
          },
        },
      },
      {
        id: 'flee',
        text: '帶著家人和鄉親從後山逃走',
        check: {
          stats: ['xinxing', 'meili'],
          difficulty: 5,
          success: {
            text: '你帶著二十幾口人在山洞裡躲了兩夜。回來時房子燒了一半，但人都在。',
            effects: [chiv(5), meili(1), fame(3), later('scar_return', 2, 4, 6)],
          },
          failure: [
            {
              if: { maxStats: { fuyuan: 6 } },
              text: '半路上，父親說祖宗的牌位還在家裡，轉身跑了回去。你們在山洞裡等到天黑，他沒有回來。第二天你在村口找到他，疤臉的人把他的屍首掛在了門框上。',
              effects: [money(-40), flag('father_dead'), flag('blood_feud'), item('father_relic'), later('revenge_chance', 6, 14, 20)],
              recap: { weight: 5, text: '{ageCn}歲那年潰兵進村，父親回頭去拿祖宗牌位，死在了疤臉手裡。' },
            },
            {
              text: '逃得太急，家裡值錢的東西全被搶光了。',
              effects: [money(-40), health(-10), later('scar_return', 2, 4, 6)],
            },
          ],
        },
      },
      {
        id: 'pay',
        text: '把家裡的錢糧都交出去',
        outcome: {
          text: '疤臉掂了掂錢袋，滿意地走了。你看著空蕩蕩的米缸，第一次明白什麼叫亂世。',
          effects: [money(-60), xinxing(1), fame(-1), flag('paid_bandits'), later('scar_return', 1, 3, 6)],
        },
      },
      {
        id: 'guide',
        text: '攔住疤臉，告訴他村東的大戶家裡藏著糧',
        outcome: {
          text: '疤臉咧嘴一笑，丟給你一小袋碎銀，帶人往村東去了。那天夜裡村東起了火。後來村裡的人見了你，都把門關上。',
          effects: [money(30), align(-15), chiv(-10), flag('guided_bandits')],
          recap: { weight: 3, text: '{ageCn}歲那年潰兵進村，你給疤臉指了村東大戶的路，保住了自己的家。' },
        },
      },
    ],
  },
  {
    // 潰兵過境之後：不管當年怎麼應付，疤臉都會回來。這一次你不在家。
    id: 'scar_return',
    kind: 'normal',
    title: '疤臉回來了',
    scheduledOnly: true,
    tags: ['feud', 'war'],
    conditions: { notFlags: ['father_dead', 'blood_feud'] },
    text: [
      {
        if: { flags: ['drove_bandits'] },
        text: '那年你出門在外。疤臉沒有忘記村口那一扁擔，他帶著人回來了，專挑你不在的時候。等你趕回家，門口只剩一地狼藉——父親擋在門口，再也沒有起來。',
      },
      {
        if: { flags: ['paid_bandits'] },
        text: '那年你出門在外。疤臉又來了：上一回嘗到了甜頭，這一回家裡已經拿不出東西給他。等你趕回家，父親倒在空蕩蕩的米缸旁邊。',
      },
      { text: '那年你出門在外。燒過一次的村子，疤臉又來了一次。等你趕回家，鄉親說，父親是為了護著別人家的孩子，倒在了村口。' },
    ],
    choices: [
      {
        id: 'vow',
        text: '跪在墳前立誓：此仇必報',
        note: '志向改為「報仇雪恨」。疤臉多年後會再出現',
        outcome: {
          text: '你把父親那把舊柴刀從灶台邊拿起來。刀柄磨得發亮，是他的手握了幾十年握出來的。',
          effects: [flag('father_dead'), flag('blood_feud'), item('father_relic'), ambition('revenge'), danshi(1), later('revenge_chance', 5, 12, 20)],
          recap: { weight: 5, text: '{ageCn}歲那年，疤臉回頭血洗了你家。你在父親墳前立誓，此仇必報。' },
        },
      },
      {
        id: 'bury',
        text: '把父親葬了，把這筆帳記在心裡',
        note: '志向不變。疤臉多年後會再出現',
        outcome: {
          text: '你守了七天的靈。第八天，你把那把舊柴刀用布包好，帶在身上，什麼也沒說。',
          effects: [flag('father_dead'), flag('blood_feud'), item('father_relic'), xinxing(1), later('revenge_chance', 5, 12, 20)],
          recap: { weight: 5, text: '{ageCn}歲那年，疤臉回頭血洗了你家，父親死在他的刀下。' },
        },
      },
    ],
  },
];
