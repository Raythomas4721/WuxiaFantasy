// 方針擲出的關卡（設計文件 v0.5 §1）：路上的小戰、精英、章末首領。
// 這些事件不會被一般抽選選到，只由 game.ts 依關卡種類挑出來。

import type { GameEvent } from '../../engine/types';
import { align, chiv, fame, flag, money, rel, xinxing } from '../dsl';

const AVOID = '繞開，不惹這個麻煩';

export const nodeEvents: GameEvent[] = [
  // ---------- 小戰 ----------
  {
    id: 'n_kid_scuffle',
    kind: 'node',
    node: { tier: 'minor' },
    title: '巷口',
    repeatable: true,
    conditions: { minAge: 7, maxAge: 12 },
    text: '巷口的孩子王帶著兩個跟班攔住了你，伸手要你把身上的零錢交出來。',
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
    text: '路邊的破廟裡竄出幾個潰兵，衣甲不整，手裡的刀卻是真的。他們盯著你的包袱，一步一步逼了過來。',
    choices: [
      {
        id: 'fight',
        text: '拔出兵器',
        duel: {
          opponent: 'deserters',
          success: { text: '幾個潰兵丟下刀，一哄而散。你在破廟裡找到他們搶來的一點碎銀。', effects: [money(15)] },
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
    text: '山道上橫著一根大木頭。你剛停下腳步，兩邊的林子裡就跳出了幾個蒙著臉的山賊。「此山是我開——」',
    choices: [
      {
        id: 'fight',
        text: '不等他說完就動手',
        duel: {
          opponent: 'bandits',
          success: { text: '山賊們沒料到你這麼硬，丟下幾句狠話就跑了。被他們攔住的商客千恩萬謝。', effects: [money(10), chiv(1)] },
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
    text: '半夜的渡口，幾個私鹽販子正在卸貨。他們看見你，互相使了個眼色：看見了，就不能讓你走。',
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
    text: '城門口的官差把你攔了下來，說你長得像告示上的逃犯。說是盤查，其實就是要錢。',
    choices: [
      {
        id: 'fight',
        text: '不給，硬闖過去',
        duel: {
          opponent: 'constables',
          success: { text: '你闖過了城門。官差們追了兩條街，追不上，罵罵咧咧地回去了。', effects: [align(-1)] },
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
    text: '遠處揚起一陣塵土，是蒙古人的遊騎。他們在村子外面打轉，像是在找落單的人。',
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
    text: '鎮上廟會搭了個擂台，贏一場給一吊錢。台上站著一個膀大腰圓的漢子，正朝台下招手。',
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
    text: '一連幾個村子都被黑風寨洗劫過。寨主是個使鬼頭刀的大漢，聽說官府懸賞了五十兩，卻沒人敢接。你在村口看見了那張發黃的告示。',
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
    repeatable: true,
    maxTimes: 2,
    conditions: { minAge: 18 },
    text: '客棧的屋頂上有人。你推開窗，看見一個黑衣人正要翻進隔壁的房間——那裡住著一個帶著孩子的寡婦。黑衣人的衣角，有一塊暗紅的血漬。',
    choices: [
      {
        id: 'fight',
        text: '翻上屋頂攔住他',
        duel: {
          opponent: 'xueyi_assassin',
          success: {
            text: '黑衣人捂著傷口跳下屋頂，消失在夜色裡。隔壁的寡婦抱著孩子，一夜沒敢閤眼。',
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
    text: '酒館角落裡坐著一個落魄的劍客，酒錢付不出來，掌櫃要報官。他抬頭看了你一眼：「你是練家子。陪我打一場，贏了，這把劍歸你；輸了，酒錢你付。」',
    choices: [
      {
        id: 'fight',
        text: '好，打一場',
        duel: {
          opponent: 'fallen_swordsman',
          success: {
            text: '他看著指在喉前的劍尖，笑了：「好。」劍你沒有收，酒錢你替他付了。他走之前，教了你一句話。',
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
    text: '{rival}在鎮口等你。這幾年他拜了個師父，聽說練得很苦。「從小到大，你總是擋我的路。今天，我們把帳算清楚。」鎮上的人圍了一圈。',
    choices: [
      {
        id: 'fight',
        text: '接下這一戰',
        duel: {
          opponent: 'rival_boss',
          success: {
            text: '{rival}倒在地上，喘著氣，好半天才說了一句：「……我服了。」從那以後，鎮上再也沒人敢欺負陸平那樣的孩子。',
            effects: [fame(4), flag('rival_beaten'), rel('rival', 10)],
            recap: { weight: 3, text: '十八歲前，你在鎮口和{rival}了結了從小結下的梁子。' },
          },
          failure: { text: '你輸了。{rival}居高臨下地看著你，冷笑一聲，帶著人走了。', effects: [fame(-1), rel('rival', -5)] },
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
  // 第五章・壯年（30～49）
  {
    id: 'b_scar_revenge',
    kind: 'node',
    node: { tier: 'boss', stage: 4 },
    title: '了斷',
    priority: 20,
    conditions: { flags: ['blood_feud'], notFlags: ['revenge_done', 'feud_resolved'] },
    text: '你終於找到了疤臉。他老了，頭髮白了一半，那道疤卻還是一樣猙獰。他認出了你，慢慢把刀抽了出來：「我等你很多年了。」',
    choices: [
      {
        id: 'fight',
        text: '了結這筆血債',
        duel: {
          opponent: 'scar_boss',
          success: {
            text: '疤臉倒在血泊裡。你站了很久，久到天都黑了。這麼多年背在身上的東西，忽然輕了。',
            effects: [flag('revenge_done'), flag('revenge_by_hand'), fame(3), align(-5)],
            recap: { weight: 5, text: '你終於親手了結了疤臉。' },
          },
          failure: { text: '你被疤臉一刀劈開了胸口，拚著最後一口氣逃了出來。', effects: [] },
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
];
