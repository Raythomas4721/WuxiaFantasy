// 方針擲出的關卡（設計文件 v0.5 §1）：路上的小戰、精英、章末首領。
// 這些事件不會被一般抽選選到，只由 game.ts 依關卡種類挑出來。

import type { GameEvent } from '../../engine/types';
import { align, chiv, fame, flag, money, rel, xinxing } from '../dsl';

const AVOID = '繞開，不惹這個麻煩';

export const nodeEvents: GameEvent[] = [
  // ---------- 小戰 ----------
  // 組合式：地點 × 對手 × 開場狀況（content/encounters.ts），比固定的小戰常出現
  {
    id: 'n_road',
    kind: 'node',
    node: { tier: 'minor' },
    title: '途中',
    repeatable: true,
    encounter: true,
    weightMods: [{ if: { minAge: 13 }, mult: 4 }],
    conditions: { minAge: 13 },
    text: '{scene}{opening}',
    choices: [
      {
        id: 'fight',
        text: '{fight}',
        duel: {
          opponent: '{foe}',
          success: { text: '{win}', effects: [money(8)] },
          failure: { text: '{lose}', effects: [money(-5)] },
        },
      },
      { id: 'avoid', text: '{avoid}', outcome: { text: '{avoided}', effects: [] } },
    ],
  },
  {
    id: 'n_kid_scuffle',
    kind: 'node',
    node: { tier: 'minor' },
    title: '巷口',
    repeatable: true,
    conditions: { minAge: 7, maxAge: 12 },
    text: '{open}',
    vars: {
      open: [
        '巷口的孩子王帶著兩個跟班攔住了你，伸手要你把身上的零錢交出來。',
        '放學回家的路上，隔壁村的孩子王帶著兩個跟班把你堵在橋頭，說這座橋是他們的，過橋要給一個銅板。',
        '你在河邊抓魚，一個高你半個頭的孩子走過來，一腳把你的魚簍踢進了河裡。他身後的兩個跟班哄笑起來，伸手要你把零錢交出來。',
        '巷子裡，孩子王正帶著兩個跟班搶一個小孩的糖葫蘆。他看見你，揚了揚下巴：「看什麼看？把錢拿出來。」',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '跟他打一架',
        duel: {
          opponent: 'kid_bully',
          success: { text: '你把他按在地上，他哭著跑回家了。那兩個跟班跑得比他還快。', effects: [] },
          failure: { text: '你被揍得鼻青臉腫，零錢也沒保住。回家還挨了一頓罵。', effects: [money(-3)] },
        },
      },
      { id: 'avoid', text: '把零錢給他', outcome: { text: '你把零錢交了出去。他得意洋洋地走了。', effects: [money(-3)] } },
    ],
  },
  {
    id: 'n_deserters',
    kind: 'node',
    node: { tier: 'minor' },
    title: '潰兵',
    repeatable: true,
    conditions: { minAge: 13 },
    text: '{open}',
    vars: {
      open: [
        '路邊的破廟裡竄出幾個潰兵，衣甲不整，手裡的刀卻是真的。他們盯著你的包袱，一步一步逼了過來。',
        '天快黑時，你在河灘上撞見一夥潰兵正圍著火堆烤一隻偷來的雞。領頭的抬起頭，看見你的包袱，慢慢站了起來。',
        '幾個穿著破號衣的人從玉米地裡鑽出來，攔住了你的去路。「打仗打散了，借點盤纏回家。」說是借，刀已經抽出來了。',
        '驛道邊的茶棚被砸得稀爛，掌櫃抱著頭蹲在地上。幾個潰兵一邊翻他的錢匣，一邊斜眼打量你。',
        '下著大雨，你躲進一座廢棄的祠堂。裡面已經有人了——五六個潰兵，刀就擱在膝蓋上。',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '拔出兵器',
        duel: {
          opponent: 'deserters',
          success: { text: '幾個潰兵丟下刀，一哄而散。你在他們扔下的包袱裡找到一點碎銀。', effects: [money(15)] },
          failure: { text: '你寡不敵眾，包袱被搶走了，人總算逃了出來。', effects: [money(-15)] },
        },
      },
      { id: 'avoid', text: AVOID, outcome: { text: '你繞了好大一圈山路，天黑才走到下一個鎮子。', effects: [] } },
    ],
  },
  {
    id: 'n_bandits',
    kind: 'node',
    node: { tier: 'minor' },
    title: '山道',
    repeatable: true,
    conditions: { minAge: 13 },
    text: '{open}',
    vars: {
      open: [
        '山道上橫著一根大木頭。你剛停下腳步，兩邊的林子裡就跳出了幾個蒙著臉的山賊。「此山是我開——」',
        '一聲鑼響，山坳裡湧出一群拿著柴刀、鋤頭的人，臉上抹著鍋灰。帶頭的扯著嗓子喊：「留下買路錢！」聲音卻在發抖。',
        '你在山腰的涼亭歇腳，賣涼茶的老漢忽然朝林子裡吹了聲口哨。幾個山賊從亭子後面繞了出來——那老漢是放哨的。',
        '一輛翻倒的貨車橫在路中間，車夫不見了，只有幾隻雞在路上亂跑。你剛走近，車底下就鑽出兩個人，林子裡又跳出三個。',
        '山道越走越窄。拐過一個彎，前面站著一排人，最左邊那個正用一塊破布擦刀，看都沒看你一眼：「識相的，自己把包袱扔過來。」',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '不等他說完就動手',
        duel: {
          opponent: 'bandits',
          success: { text: '山賊們沒料到你這麼硬，丟下幾句狠話就跑了。', effects: [money(10), chiv(1)] },
          failure: { text: '你被打得滾下山坡，撿回一條命，身上的錢卻全沒了。', effects: [money(-20)] },
        },
      },
      { id: 'avoid', text: '丟下一點買路錢', outcome: { text: '你扔下一串銅錢，山賊們讓開了路。', effects: [money(-10)] } },
    ],
  },
  {
    id: 'n_smugglers',
    kind: 'node',
    node: { tier: 'minor' },
    title: '夜渡',
    repeatable: true,
    conditions: { minAge: 15, regions: ['jiangnan'] },
    text: '{open}',
    vars: {
      open: [
        '半夜的渡口，幾個私鹽販子正在卸貨。他們看見你，互相使了個眼色：看見了，就不能讓你走。',
        '你搭的夜船半路停了。船家和幾個人在船尾嘀咕，一袋一袋地往岸上搬鹽。他們回頭時，看見你醒著。',
        '蘆葦蕩裡有火光。你走近一看，幾個人正把麻袋裡的私鹽倒進酒罈子裡。領頭的那個慢慢把手伸向了腰間。',
        '鹽倉後巷裡，一個私鹽販子正在跟人點銀子。你們同時看見了對方，他身後的幾個夥計抄起了扁擔。',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '那就看看誰走不了',
        duel: {
          opponent: 'smugglers',
          success: { text: '鹽販子們跳上船跑了，留下兩袋鹽。你把鹽賣給了鎮上的雜貨鋪。', effects: [money(20)] },
          failure: { text: '你被推進河裡，嗆了好幾口水才爬上岸。', effects: [] },
        },
      },
      { id: 'avoid', text: '舉起雙手，說自己什麼都沒看見', outcome: { text: '他們搜了你的身，拿走了幾個錢，才放你走。', effects: [money(-10)] } },
    ],
  },
  {
    id: 'n_constables',
    kind: 'node',
    node: { tier: 'minor' },
    title: '盤查',
    repeatable: true,
    conditions: { minAge: 15 },
    text: '{open}',
    vars: {
      open: [
        '城門口的官差把你攔了下來，說你長得像告示上的逃犯。說是盤查，其實就是要錢。',
        '你剛進城，就被兩個官差堵在巷子裡。「最近城裡丟了東西，外地人都得搜身。」其中一個的手，已經伸向你的錢袋。',
        '茶館裡，一個醉醺醺的捕頭把鐵尺往桌上一拍，說你坐的是他的位子，要你賠他一壺酒錢。周圍的人都低下了頭。',
        '關卡前排著長隊。輪到你的時候，守卡的官差把你的路引翻來覆去看了半天：「這印是假的吧？」他身後幾個人笑著圍了上來。',
        '一個官差攔住你，說你腰間的兵器沒有報官，按律要充公，要不就拿錢來贖。他的同伴已經從兩邊靠了過來。',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '不給，硬闖過去',
        duel: {
          opponent: 'constables',
          success: { text: '你甩開他們，鑽進了人群。官差們追了兩條街，追不上，罵罵咧咧地回去了。', effects: [align(-1)] },
          failure: { text: '你被鐵鍊鎖住，在牢裡關了幾天，花了錢才出來。', effects: [money(-25), align(-1)] },
        },
      },
      { id: 'avoid', text: '塞錢了事', outcome: { text: '你塞了錢。官差掂了掂，揮手讓你過去。', effects: [money(-15)] } },
    ],
  },
  {
    id: 'n_mongol_scouts',
    kind: 'node',
    node: { tier: 'minor' },
    title: '遊騎',
    repeatable: true,
    conditions: { minAge: 15, minYear: 1250, maxYear: 1279, regions: ['xiangyang', 'shu'] },
    text: '{open}',
    vars: {
      open: [
        '遠處揚起一陣塵土，是蒙古人的遊騎。他們在村子外面打轉，像是在找落單的人。',
        '河對岸的山坡上，幾個騎馬的人一動不動地看著村子。是蒙古遊騎。其中一個發現了你，撥轉馬頭涉水過來。',
        '你在打穀場上聽見了馬蹄聲。幾個蒙古遊騎衝進村子，一個人彎腰從馬上撈起一隻雞，大笑著朝你衝過來。',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '趁他落單，截住他',
        duel: {
          opponent: 'mongol_scout',
          success: { text: '遊騎撥馬逃走了。村裡的人知道了，偷偷給你送來一籃雞蛋。', effects: [fame(1), chiv(2)] },
          failure: { text: '你中了一箭，躲進蘆葦叢裡，一直等到天黑。', effects: [] },
        },
      },
      { id: 'avoid', text: '躲進蘆葦叢裡', outcome: { text: '你在蘆葦叢裡趴了半天，遊騎終於走了。', effects: [] } },
    ],
  },
  {
    id: 'n_tourney',
    kind: 'node',
    node: { tier: 'minor' },
    title: '擂台',
    repeatable: true,
    conditions: { minAge: 13 },
    text: '{open}',
    vars: {
      open: [
        '鎮上廟會搭了個擂台，贏一場給一吊錢。台上站著一個膀大腰圓的漢子，正朝台下招手。',
        '鎮上的大戶給老太爺做壽，在院子裡擺了個擂台，贏一場賞一吊錢。台上那人已經連贏了四場，正光著膀子喝酒。',
        '集市的空地上圍了一圈人。一個賣藝的漢子把銅鑼敲得震天響：「哪位好漢上來走兩招？打贏我，這吊錢拿走！」',
        '縣城的武館開館比武，誰都能上台，贏一場給一吊錢。你抽到的對手是個瘦高個，手長腳長，站在那裡像一根竹竿。',
        '漁村過節，沙灘上用漁網圍了個場子比摔跤，贏一場給一吊錢。一個黑黝黝的漁家漢子站在中間，咧嘴朝你笑。',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '跳上擂台',
        duel: {
          opponent: 'tourney',
          success: { text: '台下一片叫好。主事的人把一吊錢塞進你手裡。', effects: [money(20), fame(1)] },
          failure: { text: '你被摔下了擂台，台下一陣哄笑。', effects: [] },
        },
      },
      { id: 'avoid', text: '在台下看熱鬧', outcome: { text: '你在台下看了一下午，看出了好幾個人的破綻。', effects: [] } },
    ],
  },
  {
    id: 'n_sect_spar',
    kind: 'node',
    node: { tier: 'minor' },
    title: '同門切磋',
    repeatable: true,
    conditions: { minAge: 13, hasSect: true },
    text: '{sect}的練武場上，一位師兄朝你招了招手：「來，陪我過幾招。」',
    choices: [
      {
        id: 'fight',
        text: '抱拳上場',
        duel: {
          opponent: 'senior',
          success: { text: '師兄收了招，拍拍你的肩：「進步了。」', effects: [] },
          failure: { text: '師兄點到為止，指出了你剛才的三個破綻。', effects: [] },
        },
      },
      { id: 'avoid', text: '推說身子不舒服', outcome: { text: '師兄笑了笑，找別人去了。', effects: [] } },
    ],
  },

  // ---------- 精英 ----------
  {
    id: 'n_black_wind',
    kind: 'node',
    node: { tier: 'elite' },
    title: '黑風寨',
    repeatable: true,
    maxTimes: 2,
    conditions: { minAge: 16 },
    text: '{open}',
    vars: {
      open: [
        '一連幾個村子都被黑風寨洗劫過。寨主是個使鬼頭刀的大漢，聽說官府懸賞了五十兩，卻沒人敢接。你在村口看見了那張發黃的告示。',
        '黑風寨的人又下山了。這回他們搶了米行的糧，還綁走了掌櫃的女兒。村口貼著懸賞寨主的告示，墨跡還是濕的。',
        '你在茶棚聽人說，黑風寨的寨主使一把鬼頭刀，去年一個人砍翻了官府派去的十幾個兵，懸賞已經漲到五十兩。說話的人說到一半，指了指牆上的告示，壓低了聲音。',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '揭下告示，上山',
        duel: {
          opponent: 'bandit_chief',
          success: {
            text: '寨主的鬼頭刀落在地上。你把他綁下山，交給了官府。村民們放了一整夜的鞭炮。',
            effects: [money(50), fame(3), chiv(3)],
            recap: { weight: 2, text: '{ageCn}歲那年，你單槍匹馬上了黑風寨。' },
          },
          failure: { text: '你被寨主一刀劈下了山崖，掛在樹上才撿回一條命。', effects: [] },
        },
      },
      { id: 'avoid', text: '這不是你一個人管得了的事', outcome: { text: '你轉身走了。那張告示在風裡嘩嘩作響。', effects: [] } },
    ],
  },
  {
    id: 'n_xueyi_hunt',
    kind: 'node',
    node: { tier: 'elite' },
    title: '夜行人',
    weightMods: [{ if: { flags: ['world_xueyi_rampant'] }, mult: 2 }, { if: { flags: ['world_xueyi_quiet'] }, mult: 0.4 }],
    repeatable: true,
    maxTimes: 2,
    conditions: { minAge: 18 },
    text: '{open}',
    vars: {
      open: [
        '客棧的屋頂上有人。你推開窗，看見一個黑衣人正要翻進隔壁的房間——那裡住著一個帶著孩子的寡婦。黑衣人的衣角，有一塊暗紅的血漬。',
        '半夜，你被一聲極輕的響動驚醒。客棧院子裡站著一個黑衣人，正把一根細針對準隔壁屋的窗紙——那裡住著一對帶著孩子的母子。黑衣人的衣角，有一塊暗紅的血漬。',
        '客棧隔壁住著一個帶孩子的婦人，聽說她丈夫得罪了血衣樓。今晚，她房頂上多了一個黑影，衣角帶著暗紅的血漬。',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '翻上屋頂攔住他',
        duel: {
          opponent: 'xueyi_assassin',
          success: {
            text: '黑衣人捂著傷口跳下屋頂，消失在夜色裡。隔壁的母子抱在一起，一夜沒敢閤眼。',
            effects: [fame(2), chiv(5)],
          },
          failure: { text: '你被他一刀劃開了手臂。他沒有追殺你，只是冷冷地看了你一眼，走了。', effects: [] },
        },
      },
      { id: 'avoid', text: '關上窗，當作沒看見', outcome: { text: '你關上了窗。那一夜，隔壁很安靜。太安靜了。', effects: [xinxing(-1)] } },
    ],
  },
  {
    id: 'n_mongol_raid',
    kind: 'node',
    node: { tier: 'elite' },
    title: '劫掠',
    repeatable: true,
    maxTimes: 2,
    conditions: { minAge: 16, minYear: 1250, maxYear: 1279, regions: ['xiangyang', 'shu'] },
    text: '一隊蒙古騎兵衝進了村子，帶頭的百夫長指揮手下把糧食和年輕人往車上趕。村民們哭喊著，沒人敢動。',
    choices: [
      {
        id: 'fight',
        text: '衝上去，擒賊先擒王',
        duel: {
          opponent: 'mongol_centurion',
          success: {
            text: '百夫長從馬上摔了下來，騎兵們丟下車子就跑。被抓的年輕人一個個跑回了家。',
            effects: [fame(4), chiv(5), align(3)],
            recap: { weight: 2, text: '{ageCn}歲那年，你從蒙古騎兵手裡搶回了一村子的人。' },
          },
          failure: { text: '你被騎兵的馬撞倒在地。等你醒來，村子已經空了。', effects: [] },
        },
      },
      { id: 'avoid', text: '帶著還沒被抓的人往山裡逃', outcome: { text: '你帶著十幾個人躲進了山裡。回頭看，村子裡冒起了黑煙。', effects: [chiv(2)] } },
    ],
  },
  {
    id: 'n_fallen_sword',
    kind: 'node',
    node: { tier: 'elite' },
    title: '落魄劍客',
    repeatable: true,
    maxTimes: 2,
    conditions: { minAge: 18 },
    text: '{open}',
    vars: {
      open: [
        '酒館角落裡坐著一個落魄的劍客，酒錢付不出來，掌櫃要報官。他抬頭看了你一眼：「你是練家子。陪我打一場，贏了，這把劍歸你；輸了，酒錢你付。」',
        '雪夜的客棧裡，一個衣衫單薄的劍客縮在火盆邊，酒錢付不出來，店小二要趕他出去。他按住腰間的劍，看向你：「你是練家子吧？陪我打一場。贏了，這把劍歸你；輸了，酒錢你付。」',
        '渡口的小酒鋪裡，一個鬍子拉碴的劍客跟掌櫃吵了起來，他身上一個銅板也沒有。他看見你背著兵器，眼睛一亮：「兄弟，跟你賭一場。贏了，這把劍歸你；輸了，酒錢你付。」',
      ],
    },
    choices: [
      {
        id: 'fight',
        text: '好，打一場',
        duel: {
          opponent: 'fallen_swordsman',
          success: {
            text: '他看著指在喉前的劍尖，笑了：「好。」劍你沒有收，帳你替他付了。他走之前，教了你一句話。',
            effects: [money(-10), fame(2), xinxing(1)],
          },
          failure: { text: '你替他付了酒錢。他喝完最後一口，說你的劍太急了。', effects: [money(-10)] },
        },
      },
      { id: 'avoid', text: '替他付了酒錢，不打', outcome: { text: '你付了酒錢。他朝你舉了舉空碗，什麼都沒說。', effects: [money(-10), chiv(1)] } },
    ],
  },

  // ---------- 章末首領 ----------
  // 第三章・少年（13～18）
  {
    id: 'b_rival',
    kind: 'node',
    node: { tier: 'boss', stage: 2 },
    title: '冤家',
    priority: 10,
    conditions: { flags: ['rival_bully'] },
    text: [
      {
        if: { fought: { who: 'rival', last: ['win'] } },
        text: '{rival}在鎮口等你。小時候在街上那一架，他被你打得灰頭土臉，這件事他記了好幾年。這幾年他拜了個師父，聽說練得很苦。「上回是我大意，不算數。今天，我們把帳算清楚。」鎮上的人圍了一圈。',
      },
      {
        if: { fought: { who: 'rival', last: ['lose', 'yield'] } },
        text: '{rival}在鎮口等你。小時候他在街上把你揍得爬不起來，這幾年又拜了師父，更不把你放在眼裡了。「從小到大你就沒贏過我。今天，讓全鎮的人都看清楚。」鎮上的人圍了一圈。',
      },
      { text: '{rival}在鎮口等你。這幾年他拜了個師父，聽說練得很苦。「從小到大，你總是擋我的路。今天，我們把帳算清楚。」鎮上的人圍了一圈。' },
    ],
    choices: [
      {
        id: 'fight',
        text: '接下這一戰',
        duel: {
          opponent: 'rival_boss',
          success: [
            {
              if: { fought: { who: 'rival', last: ['lose', 'yield'] } },
              text: '{rival}倒在地上，喘著氣，不敢相信地看著你。小時候那個被他揍得爬不起來的孩子，今天把他打倒了。好半天，他才說了一句：「……我服了。」從那以後，鎮上再也沒人敢欺負陸平那樣的孩子。',
              effects: [fame(4), flag('rival_beaten'), rel('rival', 10)],
              recap: { weight: 3, text: '十八歲前，你在鎮口打倒了從小欺負你的{rival}。' },
            },
            {
              text: '{rival}倒在地上，喘著氣，好半天才說了一句：「……我服了。」從那以後，鎮上再也沒人敢欺負陸平那樣的孩子。',
              effects: [fame(4), flag('rival_beaten'), rel('rival', 10)],
              recap: { weight: 3, text: '十八歲前，你在鎮口和{rival}了結了從小結下的梁子。' },
            },
          ],
          failure: [
            {
              if: { fought: { who: 'rival', last: ['lose', 'yield'] } },
              text: '你又輸了。{rival}居高臨下地看著你：「跟小時候一樣。」他冷笑一聲，帶著人走了。',
              effects: [fame(-1), rel('rival', -5)],
            },
            {
              if: { fought: { who: 'rival', last: ['win'] } },
              text: '你輸了。{rival}居高臨下地看著你，笑得很痛快：「這下扯平了。」他帶著人走了。',
              effects: [fame(-1), rel('rival', -5)],
            },
            { text: '你輸了。{rival}居高臨下地看著你，冷笑一聲，帶著人走了。', effects: [fame(-1), rel('rival', -5)] },
          ],
        },
      },
      { id: 'avoid', text: '不跟他一般見識，轉身就走', outcome: { text: '你轉身走了。背後傳來一陣哄笑。', effects: [fame(-2), xinxing(1)] } },
    ],
  },
  {
    id: 'b_town_final',
    kind: 'node',
    node: { tier: 'boss', stage: 2 },
    title: '少年擂',
    priority: 0,
    text: '縣裡辦了一場少年擂，十八歲以下的都能上台。你一路打進了決賽。對面是連守七場的擂主，台下坐滿了人。',
    choices: [
      {
        id: 'fight',
        text: '上台',
        duel: {
          opponent: 'town_champion',
          success: {
            text: '擂主跌下台的那一刻，全場都站了起來。你的名字，一夜之間傳遍了整個縣城。',
            effects: [fame(4), money(30)],
            recap: { weight: 2, text: '少年時，你在縣裡的少年擂上奪了魁。' },
          },
          failure: { text: '你拚到了最後一口氣，還是輸了。擂主扶你起來，說你明年一定能贏。', effects: [fame(1)] },
        },
      },
      { id: 'avoid', text: '認輸下台', outcome: { text: '你抱拳認輸。台下有人可惜，有人起鬨。', effects: [] } },
    ],
  },
  {
    id: 'b_temple_thief',
    kind: 'node',
    node: { tier: 'boss', stage: 2 },
    title: '飛賊',
    priority: 0,
    text: '廟會那一夜，城隍廟的功德箱被人撬了。你看見一條黑影翻上牆頭，想也沒想就追了上去。追過三條街、兩座屋頂，那人終於在一條死巷裡停了下來，回頭看你。',
    choices: [
      {
        id: 'fight',
        text: '把東西交出來',
        duel: {
          opponent: 'flying_thief',
          success: {
            text: '飛賊被你按在牆角，懷裡的銅錢叮叮噹噹掉了一地。廟祝提著燈籠趕來，非要分你一點香油錢。',
            effects: [fame(3), chiv(3), money(20)],
            recap: { weight: 2, text: '少年時，你在廟會的夜裡追了三條街，抓住了一個飛賊。' },
          },
          failure: { text: '他一腳踹在你胸口，借力翻上牆頭，眨眼就不見了。', effects: [fame(1)] },
        },
      },
      { id: 'avoid', text: '巷子太黑，算了', outcome: { text: '你在巷口站了一會兒，轉身回去了。', effects: [] } },
    ],
  },
  {
    id: 'b_bully_coach',
    kind: 'node',
    node: { tier: 'boss', stage: 2 },
    title: '教頭',
    priority: 0,
    text: '鎮上的錢老爺家養著一個武教頭，專替老爺收「平安錢」。這天他把一個不肯交錢的貨郎打翻在地，擔子踩得稀爛。街上的人都低著頭走過去，只有你停了下來。',
    choices: [
      {
        id: 'fight',
        text: '「住手。」',
        duel: {
          opponent: 'tyrant_coach',
          success: {
            text: '教頭摔進了路邊的水溝裡，爬起來時臉都綠了。那天以後，錢老爺家的平安錢，再也沒人去收。',
            effects: [fame(3), chiv(4), align(2)],
            recap: { weight: 2, text: '少年時，你當街打翻了惡霸家的教頭。' },
          },
          failure: { text: '你被打得鼻青臉腫。貨郎扶著你回家，一路上一直在道謝。', effects: [chiv(2)] },
        },
      },
      { id: 'avoid', text: '低頭走過去', outcome: { text: '你低著頭走過去了。貨郎的哭聲，你在巷口還聽得見。', effects: [chiv(-2)] } },
    ],
  },
  // 第四章・青年（19～29）
  {
    id: 'b_sect_trial',
    kind: 'node',
    node: { tier: 'boss', stage: 3 },
    title: '師門大比',
    priority: 10,
    conditions: { hasSect: true },
    text: '{sect}三年一次的大比，你一路贏到了最後一場。對面是同門裡公認的第一人，師父坐在堂上，看不出在想什麼。',
    choices: [
      {
        id: 'fight',
        text: '請師兄賜教',
        duel: {
          opponent: 'sect_champion',
          success: {
            text: '師兄收劍行禮，堂上的師父點了點頭。從那天起，門裡的人見了你都改了稱呼。',
            effects: [fame(4), flag('sect_first'), { type: 'addFlag', key: 'sect_merit', delta: 2 }],
            recap: { weight: 3, text: '青年時，你在{sect}的大比上奪了第一。' },
          },
          failure: { text: '你輸了，輸得心服口服。師兄伸手拉你起來：「再過三年，就不一定了。」', effects: [{ type: 'addFlag', key: 'sect_merit', delta: 1 }] },
        },
      },
      { id: 'avoid', text: '自認不敵，退出大比', outcome: { text: '你退出了大比。師父沒說什麼，只是嘆了口氣。', effects: [] } },
    ],
  },
  {
    id: 'b_escort_ambush',
    kind: 'node',
    node: { tier: 'boss', stage: 3 },
    title: '劫道',
    priority: 0,
    text: '你搭著一支商隊趕路。走到一處峽谷，前後都被人堵住了。劫道的賊首騎著一匹黑馬，點名要商隊交出貨，再交出「那個多管閒事的」——就是你。',
    choices: [
      {
        id: 'fight',
        text: '走到前面去',
        duel: {
          opponent: 'escort_robber',
          success: {
            text: '賊首跌下馬，他的手下一哄而散。商隊的東家拉著你的手，說以後你就是他的貴人。',
            effects: [fame(3), money(40), chiv(3)],
            recap: { weight: 2, text: '青年時，你在峽谷裡一個人擋下了一夥劫道的賊。' },
          },
          failure: { text: '貨被劫走了，你被打得半死。商隊的人把你抬到下一個鎮子，就散了。', effects: [] },
        },
      },
      { id: 'avoid', text: '趁亂溜走', outcome: { text: '你趁亂鑽進了林子。後面傳來商隊的哭喊聲。', effects: [chiv(-3)] } },
    ],
  },
  {
    id: 'b_river_pirate',
    kind: 'node',
    node: { tier: 'boss', stage: 3 },
    title: '江上',
    priority: 0,
    text: '你搭的夜船行到江心，四面忽然冒出幾條快艇，一夥水寇攀著船舷爬了上來。船老大跪在甲板上直磕頭。水寇的頭子赤著上身，提著一把魚叉，一眼就看見了你腰上的兵器。',
    choices: [
      {
        id: 'fight',
        text: '擋在船客前面',
        duel: {
          opponent: 'river_pirate',
          success: {
            text: '水寇頭子翻身落進江裡，他的手下跟著跳船逃了。天亮靠岸時，一船的人都要請你吃飯。',
            effects: [fame(3), chiv(3), money(30)],
            recap: { weight: 2, text: '青年時，你在夜船上一個人打退了一夥水寇。' },
          },
          failure: { text: '你被一網兜住，扔進了江裡。等你游上岸，船早就被洗劫一空。', effects: [] },
        },
      },
      { id: 'avoid', text: '交出盤纏，不惹事', outcome: { text: '你把錢袋扔了過去。水寇頭子掂了掂，咧嘴一笑，走了。', effects: [money(-20)] } },
    ],
  },
  {
    id: 'b_bounty',
    kind: 'node',
    node: { tier: 'boss', stage: 3 },
    title: '懸賞',
    priority: 0,
    text: '城門口貼著一張懸賞榜：一個綽號「毒手書生」的人，半年裡在三個縣毒死了七戶人家。賞錢不少，榜貼了三個月，沒人敢揭。你順著線索追到一間山寺，他正坐在廊下搖著扇子，好像早就在等你。',
    choices: [
      {
        id: 'fight',
        text: '揭榜拿人',
        duel: {
          opponent: 'wanted_poisoner',
          success: {
            text: '你把他捆了送到縣衙。縣太爺親手把賞錢交給你，還要請你當捕頭。',
            effects: [fame(4), chiv(3), money(80)],
            recap: { weight: 2, text: '青年時，你揭了懸賞榜，親手拿下了毒手書生。' },
          },
          failure: { text: '你中了毒，在山寺裡躺了七天才爬得起來。他早就不知去向了。', effects: [] },
        },
      },
      { id: 'avoid', text: '這錢不好賺，算了', outcome: { text: '你轉身下山。那張懸賞榜，後來又貼了很久。', effects: [] } },
    ],
  },
  // 第五章・壯年（30～49）
  {
    id: 'b_scar_revenge',
    kind: 'node',
    node: { tier: 'boss', stage: 4 },
    title: '了斷',
    priority: 20,
    conditions: { flags: ['blood_feud'], notFlags: ['revenge_done', 'feud_resolved'] },
    text: [
      {
        if: { fought: { who: 'scar', last: ['yield'] } },
        text: '你又找到了疤臉。上一回你被他逼得拚命突圍，胸口那道傷到現在陰天還會疼。他看見你，咧嘴笑了：「命真硬。這回，別再跑了。」',
      },
      {
        if: { fought: { who: 'scar', last: ['lose'] } },
        text: '你終於找到了疤臉。他老了，頭髮白了一半。當年在村口，你被他一刀背砸倒，眼睜睜看著那把刀落下去。他瞇著眼認了半天：「當年門口那個小崽子？」他慢慢把刀抽了出來，「我等你很多年了。」',
      },
      { text: '你終於找到了疤臉。他老了，頭髮白了一半，那道疤卻還是一樣猙獰。他認出了你，慢慢把刀抽了出來：「我等你很多年了。」' },
    ],
    choices: [
      {
        id: 'fight',
        text: '了結這筆血債',
        duel: {
          opponent: 'scar_boss',
          success: [
            {
              if: { fought: { who: 'scar', last: ['lose', 'yield'] } },
              text: '疤臉倒在血泊裡。當年你在他刀下站都站不起來，今天，是他再也站不起來了。你站了很久，久到天都黑了。這麼多年背在身上的東西，忽然輕了。',
              effects: [flag('revenge_done'), flag('revenge_by_hand'), fame(3), align(-5)],
              recap: { weight: 5, text: '你終於親手了結了疤臉。當年敗在他刀下的那一筆，一起算清了。' },
            },
            {
              text: '疤臉倒在血泊裡。你站了很久，久到天都黑了。這麼多年背在身上的東西，忽然輕了。',
              effects: [flag('revenge_done'), flag('revenge_by_hand'), fame(3), align(-5)],
              recap: { weight: 5, text: '你終於親手了結了疤臉。' },
            },
          ],
          failure: [
            {
              if: { fought: { who: 'scar', last: ['yield'] } },
              text: '又一次。疤臉的刀劈開了你的胸口，你拚著最後一口氣逃了出來。背後傳來他的笑聲：「下回早點來，我老了，等不了你幾年了。」',
              effects: [],
            },
            { text: '你被疤臉一刀劈開了胸口，拚著最後一口氣逃了出來。', effects: [] },
          ],
        },
      },
      {
        id: 'avoid',
        text: '看著他老去的樣子，放下刀',
        outcome: {
          text: '你把刀插回鞘裡，轉身走了。疤臉在背後喊了你一聲，你沒有回頭。',
          effects: [flag('feud_resolved'), xinxing(2), align(5)],
          recap: { weight: 4, text: '你找到了疤臉，最後卻放下了刀。' },
        },
      },
    ],
  },
  {
    id: 'b_mongol_war',
    kind: 'node',
    node: { tier: 'boss', stage: 4 },
    title: '鐵騎',
    priority: 10,
    conditions: { minYear: 1258, maxYear: 1279 },
    text: '蒙古大軍南下，一個千夫長帶著騎兵包圍了你所在的鎮子。鎮上的人都看著你——這些年，大家都知道你是練過的。',
    choices: [
      {
        id: 'fight',
        text: '帶著鎮上的青壯迎戰',
        duel: {
          opponent: 'mongol_chiliarch',
          success: {
            text: '千夫長倒下了，騎兵們潰退。鎮上的人把你抬起來，一路抬到了祠堂。',
            effects: [fame(6), chiv(6), align(5), flag('defended_town')],
            recap: { weight: 4, text: '蒙古大軍南下時，你帶著鎮上的人打退了一個千夫長的騎兵。' },
          },
          failure: { text: '你身中數箭，被鎮上的人拚死拖了回來。', effects: [] },
        },
      },
      {
        id: 'avoid',
        text: '帶著老弱婦孺從後山撤走',
        outcome: { text: '你帶著一百多人翻過了後山。鎮子燒了三天三夜。', effects: [chiv(4), fame(2)] },
      },
    ],
  },
  {
    id: 'b_xueyi_doom',
    kind: 'node',
    node: { tier: 'boss', stage: 4 },
    title: '血衣樓之禍',
    priority: 15,
    conditions: {
      any: [{ flags: ['joined_xueyi'] }, { flags: ['exposed_xueyi'] }, { flags: ['silenced_witness'] }, { flags: ['wumian_marked'] }, { items: ['xueyi_ling'] }],
    },
    text: [
      {
        if: { flags: ['wumian_marked'], notFlags: ['joined_xueyi'] },
        text: '那天夜裡，你家的燈全熄了。院子中央站著一個人，臉上是一張沒有五官的白面具，左邊的袖子短了一截。「當年屋頂上，你扯走了我的東西。」他的聲音很輕，「我來拿回來。」',
      },
      { text: '那天夜裡，你家的燈全熄了。院子中央站著一個人，臉上是一張沒有五官的白面具。血衣樓的事，從來沒有了結的時候——今天，他是來收帳的。' },
    ],
    choices: [
      {
        id: 'fight',
        text: '拔出兵器，迎上去',
        duel: {
          opponent: 'wumian',
          success: {
            text: '白面具裂成了兩半，面具後面是一張你從沒見過的、普通得不能再普通的臉。血衣樓從此再也沒有派人來過。',
            effects: [flag('wumian_defeated'), fame(6), flag('xueyi_free')],
            recap: { weight: 5, text: '壯年時，你在自家院子裡打敗了血衣樓的無面客。' },
          },
          failure: { text: '你倒在院子裡。白面具俯下身看了你很久，最後轉身走了。', effects: [] },
        },
      },
      {
        id: 'avoid',
        text: '從後門逃走，從此隱姓埋名',
        outcome: {
          text: '你翻過後牆，一路往南逃。從那以後，你再也不敢用自己的名字。',
          effects: [fame(-5), flag('fled_xueyi'), { type: 'region', region: 'shu' }],
        },
      },
    ],
  },
  {
    id: 'b_famous_blade',
    kind: 'node',
    node: { tier: 'boss', stage: 4 },
    title: '刀客',
    priority: 0,
    text: '一個成名多年的刀客聽說了你的名字，專程找上門來。「江湖上都說你厲害。我來看看，是不是真的。」',
    choices: [
      {
        id: 'fight',
        text: '請',
        duel: {
          opponent: 'famous_blade',
          success: {
            text: '刀客收刀入鞘，深深看了你一眼：「名不虛傳。」從那以後，再也沒人質疑你的名頭。',
            effects: [fame(6)],
            recap: { weight: 3, text: '壯年時，一位成名的刀客找上門來，敗在你手下。' },
          },
          failure: { text: '刀客的刀停在你的頸邊。「還差一點。」他說完就走了。', effects: [fame(-2)] },
        },
      },
      { id: 'avoid', text: '閉門不見', outcome: { text: '你閉門不見。刀客在門外站了一夜，第二天走了。江湖上開始有人說你怕了。', effects: [fame(-3)] } },
    ],
  },
  {
    id: 'b_iron_monk',
    kind: 'node',
    node: { tier: 'boss', stage: 4 },
    title: '頭陀',
    priority: 0,
    text: '一個雲遊的鐵頭陀這兩年一路往南，見到有名號的人就上門比試，贏了就把人家的招牌扛走。他的禪杖上已經掛了十幾塊。這一天，他站在了你的門口。',
    choices: [
      {
        id: 'fight',
        text: '請大師進門',
        duel: {
          opponent: 'iron_monk',
          success: {
            text: '頭陀合掌退了三步，把禪杖上的招牌一塊一塊卸下來：「這些，請施主替貧僧還回去。」',
            effects: [fame(6)],
            recap: { weight: 3, text: '壯年時，一個扛走了十幾塊招牌的鐵頭陀，在你門前栽了跟頭。' },
          },
          failure: { text: '頭陀把你的名字刻在一塊木板上，掛上了禪杖。', effects: [fame(-2)] },
        },
      },
      { id: 'avoid', text: '閉門不見', outcome: { text: '頭陀在門口唸了一夜的經，天亮就走了。江湖上開始有人說你怕了。', effects: [fame(-3)] } },
    ],
  },
  {
    id: 'b_impostor',
    kind: 'node',
    node: { tier: 'boss', stage: 4 },
    title: '冒名',
    priority: 0,
    text: '這兩年江湖上出了好幾樁命案，兇手留下的話都一樣：「要報仇，來找{name}。」你找了大半年，終於在一間客棧堵到了他。那人轉過身，衣著、兵器，連站的樣子都學得跟你一模一樣。',
    choices: [
      {
        id: 'fight',
        text: '拆穿他',
        duel: {
          opponent: 'impostor',
          success: {
            text: '你把他押到苦主面前，一樁一樁地對質。這件事傳開以後，江湖上提起你的名字，多了幾分敬意。',
            effects: [fame(5), align(3)],
            recap: { weight: 3, text: '壯年時，有人冒你的名頭殺人。你找了大半年，親手拆穿了他。' },
          },
          failure: { text: '他從窗口逃了。那些命案，有一半人到現在還算在你頭上。', effects: [fame(-2), align(-3)] },
        },
      },
      { id: 'avoid', text: '清者自清，隨他去', outcome: { text: '你沒有去找他。可是江湖上的人，不是每個都分得清。', effects: [fame(-3), align(-4)] } },
    ],
  },
  // 第六章・晚年
  {
    id: 'b_young_challenger',
    kind: 'node',
    node: { tier: 'boss', stage: 5 },
    title: '後生',
    priority: 0,
    text: '一個年輕人找上門來，一進門就跪下磕了三個頭，然後站起來拔出了兵器：「晚輩久仰。請前輩指教。」他的眼睛很亮，像很多年前的你。',
    choices: [
      {
        id: 'fight',
        text: '起身指教',
        duel: {
          opponent: 'young_challenger',
          success: {
            text: '你點到為止。年輕人愣了很久，又跪下磕了三個頭。臨走前，你把這些年琢磨出來的幾句話告訴了他。',
            effects: [fame(4), xinxing(1)],
            recap: { weight: 3, text: '晚年時，一個年輕人上門挑戰。你贏了，然後把一身所學的心得告訴了他。' },
          },
          failure: { text: '你輸了。你哈哈大笑，笑得咳了起來。江湖，終究是年輕人的。', effects: [xinxing(2)] },
        },
      },
      { id: 'avoid', text: '擺擺手，說自己老了', outcome: { text: '你擺擺手，請他喝了一杯茶。他喝完，有點失望地走了。', effects: [] } },
    ],
  },
  {
    id: 'b_old_peer',
    kind: 'node',
    node: { tier: 'boss', stage: 5 },
    title: '故人',
    priority: 0,
    text: '一個白頭髮的老人拄著兵器找上門來。你看了半天才認出他：年輕時跟你交過手，那一場沒分出勝負，兩個人約好了「下回再打」。這一等，就是幾十年。',
    choices: [
      {
        id: 'fight',
        text: '「來，把那一場打完。」',
        duel: {
          opponent: 'old_peer',
          success: {
            text: '你們打完了，兩個人都坐在地上喘氣。他哈哈大笑，從背上解下一罈酒：「輸給你，不冤。」那一夜，你們喝到天亮。',
            effects: [fame(2), xinxing(1)],
            recap: { weight: 3, text: '晚年時，年輕時的老對手找上門來。你們把幾十年前那一場打完了，又喝了一整夜的酒。' },
          },
          failure: { text: '他贏了，卻比你還累。他從背上解下一罈酒：「這下扯平了。」那一夜，你們喝到天亮。', effects: [xinxing(1)] },
        },
      },
      {
        id: 'avoid',
        text: '「都這把年紀了，喝酒吧。」',
        outcome: { text: '他愣了一下，笑了，把兵器靠在門邊。那一場，終究是沒打完。', effects: [xinxing(1)] },
      },
    ],
  },
  {
    id: 'b_village_raid',
    kind: 'node',
    node: { tier: 'boss', stage: 5 },
    title: '老將',
    priority: 0,
    text: '一夥亂兵闖進了你住的鎮子，挨家挨戶地搶。鎮上的年輕人躲的躲、逃的逃。你從牆上取下那件好些年沒碰過的兵器，一個人站到了街心。',
    choices: [
      {
        id: 'fight',
        text: '站在街心',
        duel: {
          opponent: 'deserter_captain',
          success: {
            text: '亂兵的頭目倒在你腳下，其餘的人一鬨而散。躲在門後的鄉親們一個一個走出來，看你的眼神，像在看一尊廟裡的神。',
            effects: [fame(4), chiv(5), align(3)],
            recap: { weight: 3, text: '晚年時，亂兵進了鎮子。你一個人站在街心，把他們擋了回去。' },
          },
          failure: { text: '你被打倒在地。亂兵搶完了東西，臨走前看了你一眼，沒再動手。', effects: [chiv(2)] },
        },
      },
      { id: 'avoid', text: '帶著鄰居躲進地窖', outcome: { text: '你們在地窖裡躲了一天一夜。出來時，半條街都燒了。', effects: [chiv(-1)] } },
    ],
  },
];
