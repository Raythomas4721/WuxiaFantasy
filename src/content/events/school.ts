// 自成一家與開宗立派：自創武學、立門規、收徒、踢館、叛徒、國難、傳人。
// 規則在 engine/school.ts（弟子怎麼長、聲勢怎麼漲）；{art}{school}{disciple}{heir} 由引擎代入。

import type { GameEvent } from '../../engine/types';
import { add, align, chiv, createArt, disciple, fame, flag, foundSchool, health, later, money, recruit, spotlight, train, xinxing } from '../dsl';

export const schoolEvents: GameEvent[] = [
  {
    id: 'own_art',
    kind: 'forced',
    title: '自成一家',
    priority: 2,
    conditions: { minAge: 35, maxAge: 75, minMartial: 4, notFlags: ['own_art', 'declined_art'] },
    tags: ['martial'],
    text: [
      {
        if: { flags: ['defended_city'] },
        text: '這些年你在城頭上打過、在死人堆裡爬過。有一天夜裡練功，你忽然發現自己使出來的招式，已經不是任何一本譜上的樣子了。那是城頭教你的。',
      },
      {
        if: { minFame: 50 },
        text: '來找你比武的人越來越多。他們學你的起手式，學你的步法，可你自己知道，這些年你早就不照著師父教的打了。你使的，是你自己的東西。',
      },
      { text: '這一天你在院子裡練功，練著練著停了下來。你發現自己這幾年使的招式，有一半是從別處學來的，有一半是從生死關頭裡逼出來的，早就分不清哪一招是哪一門的了。' },
    ],
    choices: [
      {
        id: 'create',
        text: '閉關，把這一生所學熔成一門自己的功夫',
        note: '得到一張自己的絕招，過招時多一層被動；自己取名',
        outcome: {
          text: '你關上門，三個月沒有出來。出關那天，你在院子裡從頭到尾打了一遍。打完，院子裡的落葉都還在原地，一片也沒有飛起來。',
          effects: [createArt(), xinxing(1), fame(3)],
        },
      },
      {
        id: 'decline',
        text: '師父傳下來的東西，守住就好',
        outcome: {
          text: '你把那些念頭都收了起來，照著師父教的又打了一遍。打完你想：一個人能把別人的東西練到頭，也就夠了。',
          effects: [flag('declined_art'), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'found_school',
    kind: 'normal',
    title: '開宗立派',
    weight: 40,
    conditions: { minAge: 38, maxAge: 78, flags: ['own_art'], minFame: 15, notFlags: ['founded_sect', 'declined_school'] },
    tags: ['martial', 'sect'],
    text: '想跟你學「{art}」的人，已經在你家門外排了好幾回隊。老朋友勸你：與其一個一個教，不如開一個山門。開山門，先要立門規。立了，就改不了了。',
    choices: [
      {
        id: 'open',
        text: '門規：不問出身',
        note: '誰來都收：來的人多，什麼樣的都有',
        outcome: {
          text: '你在山門口立了一塊石碑，上面只刻了四個字。第一個來拜師的，是個光著腳的孩子。',
          effects: [foundSchool('open'), chiv(3)],
        },
      },
      {
        id: 'strict',
        text: '門規：寧缺毋濫',
        note: '只收好苗子：來的人少，根骨都不差',
        outcome: {
          text: '你讓人在山門外擺了一塊三百斤的石鎖。舉得起來的，才進得了門。',
          effects: [foundSchool('strict'), fame(2)],
        },
      },
      {
        id: 'city',
        text: '門規：城在人在',
        note: '國難當頭，門下弟子要下山；肯來的都是有血性的',
        outcome: {
          text: '你把門規寫在山門正中。有人看了扭頭就走，也有人看了，當場就跪下了。',
          effects: [foundSchool('city'), chiv(5)],
        },
      },
      {
        id: 'decline',
        text: '「我教不了人。這門功夫，跟著我走就好。」',
        outcome: {
          text: '門外的人等了幾天，慢慢都散了。你照舊一個人練功。只是有時候，你會想起排在最後的那個孩子。',
          effects: [flag('declined_school'), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'school_gate',
    kind: 'normal',
    title: '開山門',
    weight: 30,
    repeatable: true,
    cooldown: 3,
    maxTimes: 6,
    conditions: { flags: ['founded_sect'], maxAge: 80 },
    weightMods: [{ if: { flagMin: { school_fame: 40 } }, mult: 1.5 }],
    tags: ['sect', 'martial', 'village'],
    text: [
      { if: { flagMin: { school_fame: 50 } }, text: '「{school}」的名頭傳出去了。開山門那天，山道上擠滿了人，有人連夜趕了三百里路。' },
      { if: { flagMin: { school_fame: 20 } }, text: '又到了開山門的日子。「{school}」漸漸有了點名氣，這回來拜師的人比上回多。' },
      { text: '又到了開山門的日子。「{school}」還沒什麼名氣，山門外稀稀落落站著幾個人。' },
    ],
    choices: [
      {
        id: 'open',
        text: '開門，看看這回來的是什麼人',
        outcome: { text: '你走出山門，一個一個看過去。', effects: [recruit(), later('school_gate', 3, 5, 10)] },
      },
      {
        id: 'close',
        text: '這幾年先把門下的弟子教好',
        outcome: { text: '你讓人把山門關了。門裡的弟子這一年練得格外勤。', effects: [add('school_fame', 2), later('school_gate', 3, 5, 10)] },
      },
    ],
  },
  {
    id: 'school_challenge',
    kind: 'normal',
    title: '踢館',
    weight: 22,
    repeatable: true,
    cooldown: 5,
    maxTimes: 3,
    conditions: { flags: ['founded_sect'], minAge: 43, maxAge: 80 },
    enterEffects: [spotlight('star')],
    tags: ['sect', 'martial', 'sparring'],
    text: '別派的一位掌門帶著七八個弟子上了山，把一封帖子拍在你的桌上：「{art}？沒聽過。今天來，就是想看看這門功夫，配不配開山門。」門下的弟子都站了起來。',
    choices: [
      {
        id: 'self',
        text: '親自下場',
        duel: {
          opponent: 'sect_champion',
          success: {
            text: '三十招之後，對方的掌門抱拳認輸，親手把那封帖子撕了。這件事傳下山，第二個月來拜師的人多了一倍。',
            effects: [add('school_fame', 8), fame(3)],
            recap: { weight: 2, text: '{ageCn}歲那年，有人上山踢館。你親自下場，讓對方撕了帖子。' },
          },
          failure: {
            text: '你輸了半招。對方的掌門走的時候說：「功夫是好功夫，只是還沒練成。」門下的弟子低著頭，一個也沒說話。',
            effects: [add('school_fame', -6)],
          },
        },
      },
      {
        id: 'star',
        text: '「{disciple}，你去。」',
        requires: { flags: ['school_has_spotlight'] },
        hidden: true,
        outcome: {
          text: '{disciple}只用了你教的頭三招。對方的掌門看著自己被挑飛的兵器，半晌才說：「徒弟都這樣，師父不用比了。」',
          effects: [add('school_fame', 12), fame(2), xinxing(1)],
          recap: { weight: 3, text: '{ageCn}歲那年，有人上山踢館。你的弟子{disciple}替你接下了這一戰。' },
        },
      },
      {
        id: 'refuse',
        text: '閉門不見',
        outcome: {
          text: '對方在山門外罵了一個下午才走。山下開始有人說，「{school}」的掌門是個不敢出門的。',
          effects: [add('school_fame', -4), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'school_traitor',
    kind: 'forced',
    // 引擎立了旗標就一定發生（排在史實大事後面）
    priority: 3,
    title: '叛徒',
    conditions: { flags: ['founded_sect', 'due_school_traitor'] },
    enterEffects: [flag('due_school_traitor', false)],
    tags: ['sect', 'feud'],
    text: '天還沒亮，守夜的弟子跑來敲你的門：藏經的屋子被人撬開了，你親手寫的那本「{art}」不見了。山門的鎖是從裡面打開的。不見的，還有{disciple}。',
    choices: [
      {
        id: 'chase',
        text: '追下山去',
        duel: {
          opponent: 'traitor_disciple',
          success: {
            text: '你在渡口追上了他。他把那本冊子扔進了江裡，自己跪在地上。你看著他，想起他拜師那天的樣子。你沒有殺他，只是廢了他的武功，讓他走了。',
            effects: [disciple('caught'), add('school_fame', 3), xinxing(1)],
            recap: { weight: 3, text: '{ageCn}歲那年，弟子{disciple}偷了「{art}」的秘笈叛逃。你親手追了回來，廢了他的武功。' },
          },
          failure: {
            text: '他學你的功夫，學得比你想的還好。你看著他的船消失在霧裡。後來江湖上出了一門功夫，跟「{art}」有七分像，名字卻不一樣。',
            effects: [disciple('betrayed'), flag('art_stolen'), add('school_fame', -8)],
            recap: { weight: 3, text: '{ageCn}歲那年，弟子{disciple}偷了「{art}」的秘笈叛逃。你沒有追上他。' },
          },
        },
      },
      {
        id: 'forgive',
        text: '讓人帶話給他：東西可以拿走，人可以回來',
        check: {
          stats: ['meili', 'xinxing'],
          difficulty: 6,
          success: {
            text: '三天後，{disciple}自己回來了，把冊子放在你的門口，在雨裡跪了一夜。從那以後，他是門下練功最苦的一個。',
            effects: [disciple('reformed'), add('school_fame', 4), xinxing(2)],
            recap: { weight: 3, text: '{ageCn}歲那年，弟子{disciple}偷了秘笈叛逃。你讓人帶話叫他回來，他回來了。' },
          },
          failure: {
            text: '話帶到了，他沒有回來。後來聽說，他在別的山頭也開了一個門派。',
            effects: [disciple('betrayed'), flag('art_stolen'), add('school_fame', -6)],
          },
        },
      },
      {
        id: 'let_go',
        text: '由他去',
        outcome: {
          text: '你讓人把藏經屋的門重新釘好。那天晚上，你又把「{art}」從頭寫了一遍。寫完才發現，有幾招跟以前不一樣了。',
          effects: [disciple('betrayed'), flag('art_stolen'), add('school_fame', -4), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'school_war',
    kind: 'normal',
    title: '山門與城門',
    weight: 40,
    conditions: { flags: ['founded_sect'], minYear: 1258, maxYear: 1279, notFired: ['school_war'] },
    weightMods: [{ if: { flags: ['rule_city'] }, mult: 3 }],
    enterEffects: [spotlight('any')],
    tags: ['war', 'sect'],
    text: [
      {
        if: { flags: ['rule_city'] },
        text: '蒙古兵打到了離山門三百里的地方。弟子們都看著山門正中那四個字：「城在人在」。沒有一個人開口問。',
      },
      { text: '蒙古兵打到了離山門三百里的地方。山下的城在招人守城，也有人勸你封山，保住門派的香火。弟子們都在等你開口。' },
    ],
    choices: [
      {
        id: 'defend',
        text: '帶弟子下山守城',
        outcome: [
          {
            if: { flags: ['school_has_spotlight'] },
            text: '你們守了四十天。城保住了。回山的時候，隊伍裡少了{disciple}。你把他的兵器掛在了山門上。',
            effects: [disciple('dead'), add('school_fame', 15), chiv(6), fame(4), flag('school_fought'), flag('defended_city')],
            recap: { weight: 4, text: '{ageCn}歲那年，你帶著「{school}」的弟子下山守城。{disciple}沒有回來。' },
          },
          {
            text: '你們守了四十天。城保住了，門下的弟子一個也沒少。山下的百姓扛著米上山，說要謝「{school}」。',
            effects: [add('school_fame', 15), chiv(6), fame(4), flag('school_fought'), flag('defended_city')],
            recap: { weight: 4, text: '{ageCn}歲那年，你帶著「{school}」的弟子下山守城，守住了。' },
          },
        ],
      },
      {
        id: 'seal',
        text: '封山，保住門派的香火',
        outcome: {
          text: '你讓人把山門封了，收留了一批逃上山的難民。仗打完了，「{school}」還在。只是山下有人說，那一年山上沒有一個人下來。',
          effects: [add('school_fame', 2), chiv(1), flag('school_sealed'), health(5)],
        },
      },
      {
        id: 'disband',
        text: '遣散弟子，各自逃生',
        outcome: {
          text: '你把弟子一個一個送下了山。最後一個走的時候回頭喊：「師父，等仗打完了，我們還回來。」後來回來的，不到一半。',
          effects: [add('school_fame', -15), xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'school_heir',
    kind: 'normal',
    title: '傳人',
    weight: 40,
    conditions: { flags: ['founded_sect'], minAge: 60, notFlags: ['heir_chosen'] },
    enterEffects: [spotlight('heir')],
    tags: ['sect', 'rest', 'family'],
    text: '你的頭髮全白了。這天你把門下的弟子都叫到了院子裡，看了他們很久。掌門的位子，總要交給一個人。',
    choices: [
      {
        id: 'disciple',
        text: '「{disciple}，往後這個門，你來守。」',
        requires: { flags: ['school_has_heir'] },
        hint: '門下還沒有學成出師的弟子',
        outcome: {
          text: '{disciple}跪在地上，接過了你的劍。你拍了拍他的肩膀：「門規你知道。剩下的，你自己看著辦。」',
          effects: [disciple('heir'), flag('heir_chosen'), flag('heir_disciple'), xinxing(1)],
          recap: { weight: 5, text: '{ageCn}歲那年，你把「{school}」掌門的位子傳給了弟子{disciple}。' },
        },
      },
      {
        id: 'child',
        text: '傳給自己的孩子',
        requires: { flags: ['has_child'] },
        hidden: true,
        outcome: {
          text: '有幾個弟子低下了頭。你知道他們在想什麼。可那是你的孩子，你想讓這個門，一直姓你的姓。',
          effects: [flag('heir_chosen'), flag('heir_child'), add('school_fame', -5)],
          recap: { weight: 4, text: '{ageCn}歲那年，你把「{school}」傳給了自己的孩子。' },
        },
      },
      {
        id: 'end',
        text: '「{school}到我為止。你們各自下山，開自己的門。」',
        outcome: {
          text: '弟子們哭著下了山。很多年後，江湖上有好幾個門派，祖師爺都是同一個人。',
          effects: [flag('heir_chosen'), flag('school_ends'), xinxing(2)],
          recap: { weight: 5, text: '{ageCn}歲那年，你讓「{school}」到你為止，弟子們各自下山開了自己的門。' },
        },
      },
    ],
  },
  // ==================== 品性惹的事 ====================
  {
    id: 'school_lazy',
    kind: 'forced',
    // 引擎立了旗標就一定發生（排在史實大事後面）
    priority: 3,
    title: '不肯練',
    conditions: { flags: ['founded_sect', 'due_school_lazy'] },
    enterEffects: [flag('due_school_lazy', false)],
    tags: ['sect'],
    text: [
      {
        if: { flags: ['spot_gifted'] },
        text: '論根骨，{disciple}是你門下最好的，你當年看他一眼就知道。可他入門這幾年，早課沒去過幾回，倒是山下的賭坊、酒樓，個個都認得他。師兄弟們都在看你怎麼辦。',
      },
      { text: '{disciple}入門這幾年，早課沒去過幾回，倒是山下的賭坊、酒樓，個個都認得他。師兄弟們都在看你怎麼辦。' },
    ],
    choices: [
      {
        id: 'strict',
        text: '嚴加管教：從明天起，他的早課你親自盯',
        check: {
          stats: ['xinxing', 'danshi'],
          difficulty: 6,
          success: {
            text: '你盯了他整整一年，他恨了你整整一年。第二年開春，他第一個到了練武場，什麼也沒說，只是把你教的那一套從頭到尾打了一遍。打得比誰都好。',
            effects: [{ type: 'discipleFix', fix: 'reform' }, xinxing(1), add('school_fame', 2)],
            recap: { weight: 3, text: '{ageCn}歲那年，你把不肯練功的弟子{disciple}親手管教了過來。' },
          },
          failure: {
            text: '你盯了他三個月。第四個月的一個晚上，他翻牆走了，帶走了你掛在牆上的那把劍。',
            effects: [disciple('left'), add('school_fame', -3)],
          },
        },
      },
      {
        id: 'leave',
        text: '由他去。功夫是自己的，不想練，誰也逼不了',
        outcome: {
          text: '你沒有再提這件事。他照樣下山喝酒，照樣不去早課。有時候你看著他，覺得可惜，又說不上來可惜的是他，還是你自己。',
          effects: [{ type: 'discipleFix', fix: 'handled' }, add('school_fame', -2)],
        },
      },
      {
        id: 'expel',
        text: '逐出師門',
        outcome: {
          text: '他下山的時候還在笑，說這種破門派他早就不想待了。門下的弟子那天起得特別早。',
          effects: [disciple('left'), add('school_fame', 2)],
        },
      },
    ],
  },
  {
    id: 'school_brawl',
    kind: 'forced',
    // 引擎立了旗標就一定發生（排在史實大事後面）
    priority: 3,
    title: '惹事',
    conditions: { flags: ['founded_sect', 'due_school_brawl'] },
    enterEffects: [flag('due_school_brawl', false)],
    tags: ['sect', 'feud'],
    text: '山下的米行掌櫃被人抬上了山，一條腿打斷了。說是為了一句閒話，{disciple}在米行門口跟人動了手。掌櫃的兒子站在山門外，手裡攥著狀紙：要麼{school}給個交代，要麼他去報官。',
    choices: [
      {
        id: 'protect',
        text: '護短：「我的弟子，輪不到外人來管。」',
        outcome: {
          text: '那家人沒敢報官。山下從此沒人敢惹{school}的弟子，也從此沒什麼人上山拜師了。{disciple}倒是越來越兇。',
          effects: [{ type: 'discipleFix', fix: 'handled' }, add('school_fame', -3), chiv(-3), align(-3)],
        },
      },
      {
        id: 'apologize',
        text: '帶著他下山，登門賠罪',
        check: {
          stats: ['meili', 'xinxing'],
          difficulty: 5,
          success: {
            text: '你讓他在米行門口跪了一個時辰，又替掌櫃請了大夫。回山的路上，他一直沒說話。後來他再也沒有在山下動過手，倒是常常一個人去米行幫忙扛米。',
            effects: [{ type: 'discipleFix', fix: 'reform' }, chiv(3), money(-30), add('school_fame', 2)],
            recap: { weight: 2, text: '{ageCn}歲那年，你的弟子{disciple}在山下打傷了人。你帶著他登門賠罪。' },
          },
          failure: {
            text: '他跪下了，可是眼睛一直瞪著掌櫃的兒子。人家收了賠的錢，關上了門。你知道，這件事還沒完。',
            effects: [{ type: 'discipleFix', fix: 'handled' }, money(-30), chiv(1)],
          },
        },
      },
      {
        id: 'cripple',
        text: '當著掌櫃的面，廢了他的武功',
        outcome: {
          text: '你出手很快。{disciple}倒在地上，看著你，像是不認得你了。掌櫃的兒子撕了狀紙，一句話也沒說。那天晚上，你一個人在後山坐到天亮。',
          effects: [disciple('caught'), chiv(4), add('school_fame', -1), xinxing(1)],
          recap: { weight: 3, text: '{ageCn}歲那年，你的弟子{disciple}在山下打傷了人。你當眾廢了他的武功。' },
        },
      },
    ],
  },
  {
    id: 'school_slander',
    kind: 'forced',
    // 引擎立了旗標就一定發生（排在史實大事後面）
    priority: 3,
    title: '告狀',
    conditions: { flags: ['founded_sect', 'due_school_slander'] },
    enterEffects: [flag('due_school_slander', false)],
    tags: ['sect'],
    text: '{disciple}半夜來敲你的門，說話的時候眼眶是紅的：他親眼看見{victim}偷偷把門裡的劍譜抄了一份，賣給了山下的人。他說他本來不想說，可是他不能看著師父被人騙。',
    choices: [
      {
        id: 'believe',
        text: '把{victim}叫來，逐出師門',
        outcome: {
          text: '{victim}走的時候一句話也沒有說，只是在山門口跪下，給你磕了三個頭。{disciple}站在你身後，替你嘆了一口氣。',
          effects: [{ type: 'victim', status: 'left' }, add('school_fame', -3)],
        },
      },
      {
        id: 'investigate',
        text: '先不聲張，自己去查',
        check: {
          stats: ['wuxing', 'xinxing'],
          difficulty: 6,
          success: {
            text: '你查了半個月。劍譜一頁也沒少，山下也沒有人收過什麼劍譜。倒是{disciple}這幾年，在每個師兄弟背後都說過類似的話。你把他叫到院子裡，他還想說什麼，你只說了一句：「下山吧。」',
            effects: [{ type: 'discipleFix', fix: 'reveal' }, disciple('left'), add('school_fame', 3), xinxing(1)],
            recap: { weight: 3, text: '{ageCn}歲那年，弟子{disciple}誣賴師弟。你查清楚了，把他逐出了師門。' },
          },
          failure: {
            text: '你查了半個月，什麼也沒查出來。兩個人你都留下了，只是從那以後，他們再也不在一張桌上吃飯。',
            effects: [{ type: 'discipleFix', fix: 'handled' }, add('school_fame', -1)],
          },
        },
      },
      {
        id: 'both',
        text: '兩個都罰：一個多嘴，一個不知避嫌',
        outcome: {
          text: '兩個人一起在後山挑了一個月的水。{victim}挑得一聲不吭；{disciple}挑到第三天，就開始跟別的師兄弟說，師父老糊塗了。',
          effects: [{ type: 'discipleFix', fix: 'handled' }, xinxing(1)],
        },
      },
    ],
  },

  // ==================== 欺師滅祖 ====================
  {
    id: 'school_peek',
    kind: 'forced',
    // 引擎立了旗標就一定發生（排在史實大事後面）
    priority: 3,
    title: '手稿',
    conditions: { flags: ['founded_sect', 'due_school_peek'] },
    enterEffects: [flag('due_school_peek', false)],
    tags: ['sect'],
    text: [
      {
        if: { flags: ['spot_seen'] },
        text: '你書房裡那疊「{art}」的手稿，被人翻過了。翻得很小心，每一頁都放回了原位，只是順序錯了兩頁。你沒有想太久：當年{disciple}來拜師的時候，你就看出他心術不正了。',
      },
      { text: '你書房裡那疊「{art}」的手稿，被人翻過了。翻得很小心，每一頁都放回了原位，只是順序錯了兩頁。翻的是後面那幾頁，你還沒教給任何人的那幾頁。' },
    ],
    choices: [
      {
        id: 'question',
        text: '把所有弟子叫到院子裡，一個一個問',
        check: {
          stats: ['wuxing', 'meili'],
          difficulty: 5,
          success: {
            text: '問到{disciple}的時候，他答得太快了。你讓他把昨天晚上做了什麼再說一遍，他說的跟剛才差了一個字。你看著他，他也看著你。那天下午，他就下山了。',
            effects: [{ type: 'discipleFix', fix: 'reveal' }, disciple('left'), add('school_fame', 1)],
            recap: { weight: 3, text: '{ageCn}歲那年，你發現弟子{disciple}偷看你的手稿，當天就把他逐出了師門。' },
          },
          failure: {
            text: '每個人都說得清清楚楚。你看不出是誰。手稿你收進了箱子，箱子上了鎖。',
            effects: [xinxing(1)],
          },
        },
      },
      {
        id: 'watch',
        text: '裝作沒發現，暗中盯著',
        outcome: {
          text: '第三天夜裡，你看見{disciple}的影子進了書房。你沒有出聲。你想知道，他到底想要什麼。',
          effects: [{ type: 'discipleFix', fix: 'reveal' }],
        },
      },
      {
        id: 'trust',
        text: '也許只是有人想多學一點。手稿就留在桌上',
        outcome: {
          text: '手稿又被翻過幾回，你都裝作不知道。你想起自己年輕的時候，也偷看過師父的東西。',
          effects: [add('school_fame', 1)],
        },
      },
    ],
  },
  {
    id: 'school_usurp',
    kind: 'forced',
    // 一生的高潮：排在「暮年」之前、史實大事之後
    priority: 7,
    title: '欺師滅祖',
    conditions: { flags: ['founded_sect', 'traitor_out', 'due_school_usurp'], notFlags: ['usurper_defeated', 'usurped'] },
    enterEffects: [flag('due_school_usurp', false), spotlight('traitor')],
    tags: ['sect', 'feud'],
    text: '{disciple}回來了。他身後跟著幾十個人，穿的衣服上繡著「{art}」三個字。他站在山門口，朝你拱了拱手，客客氣氣的，跟當年拜師那天一樣：「師父，這門功夫在你手上，可惜了。這個位子，該換人坐了。」門下的弟子都看著你。',
    choices: [
      {
        id: 'fight',
        text: '「我教你的，今天收回來。」',
        duel: {
          opponent: 'usurper',
          success: {
            text: '他倒在山門口的石階上，就倒在他當年跪著拜師的地方。他帶來的人一哄而散。你沒有殺他，只是廢了他的武功，讓人把他抬下了山。那天晚上你在燈下坐了很久，把「{art}」最後那幾頁燒了。',
            effects: [disciple('caught'), flag('usurper_defeated'), add('school_fame', 10), fame(6)],
            recap: { weight: 6, text: '{ageCn}歲那年，叛出師門的{disciple}回來奪位。你在山門口親手清理了門戶。' },
          },
          failure: {
            text: '他太熟悉你了：你每一招要往哪裡走，他都知道。你輸了。他沒有殺你，只是把掌門的劍從你手上拿走，掛在了自己腰上。「師父老了，」他對門下的弟子說，「往後，聽我的。」',
            effects: [flag('usurped'), add('school_fame', -25), health(-20)],
            recap: { weight: 6, text: '{ageCn}歲那年，叛出師門的{disciple}回來奪位。你輸了，他坐上了掌門的位子。' },
          },
        },
      },
      {
        id: 'together',
        text: '你沒有開口，門下的大弟子已經擋在了你前面',
        requires: { flags: ['school_has_loyal'] },
        hidden: true,
        outcome: {
          text: '他們一個接一個走出來，站成一排，擋在你和他之間。都是你一手教出來的人。{disciple}看了他們很久，最後笑了一聲，轉身下了山。那是你這一生，最驕傲的一天。',
          effects: [flag('usurper_defeated'), add('school_fame', 8), xinxing(2)],
          recap: { weight: 6, text: '{ageCn}歲那年，叛出師門的{disciple}回來奪位。你門下的弟子站成一排，擋在了你前面。' },
        },
      },
      {
        id: 'yield',
        text: '把掌門的劍放在地上，自己下山',
        outcome: {
          text: '你走過他身邊的時候，他低聲說了一句：「師父，你本來可以殺了我的。」你沒有回頭。山下的人說，那天的{school}，換了一個掌門，也換了一個名字。',
          effects: [flag('usurped'), add('school_fame', -15), xinxing(2)],
          recap: { weight: 6, text: '{ageCn}歲那年，叛出師門的{disciple}回來奪位。你把掌門的劍放在地上，自己下了山。' },
        },
      },
    ],
  },

  // ==================== 青出於藍 ====================
  {
    id: 'school_surpass',
    kind: 'forced',
    // 引擎立了旗標就一定發生（排在史實大事後面）
    priority: 3,
    title: '青出於藍',
    conditions: { flags: ['founded_sect', 'due_school_surpass'], notFlags: ['surpassed'] },
    enterEffects: [flag('due_school_surpass', false)],
    tags: ['sect', 'martial'],
    text: '這一年的風雲榜傳上山來，{disciple}的名字，排在了你的前面。門下的弟子拿著那張紙，不知道該不該拿給你看。最後是{disciple}自己拿進來的，放在桌上，站在一邊，等你開口。',
    choices: [
      {
        id: 'proud',
        text: '大笑三聲：「好！這才是我的徒弟！」',
        outcome: {
          text: '那天晚上你讓廚房殺了兩隻雞，跟門下的弟子喝到半夜。{disciple}喝醉了，抱著你哭。你拍著他的背，想起很多年前，你也這樣抱過你的師父。',
          effects: [flag('surpassed'), xinxing(2), add('school_fame', 5)],
          recap: { weight: 4, text: '{ageCn}歲那年，你的弟子{disciple}在風雲榜上超過了你。你大笑三聲。' },
        },
      },
      {
        id: 'seclude',
        text: '心裡有點不是滋味。你又閉關了一次',
        outcome: {
          text: '你在後山閉關了半年。出關那天，{disciple}在洞口等你，手裡端著一碗熱粥。你們在洞口過了三招，誰也沒贏誰。你忽然覺得，這樣也很好。',
          effects: [flag('surpassed'), train('martial', 4), fame(2)],
        },
      },
      {
        id: 'pass',
        text: '「掌門的位子，往後你來坐。」',
        requires: { notFlags: ['heir_chosen'] },
        hidden: true,
        outcome: {
          text: '{disciple}跪下來推了三次，你都沒有收回。交印那天，你把門規又念了一遍，然後搬到了後山的小屋裡，每天只是種菜、看他教徒弟。',
          effects: [flag('surpassed'), disciple('heir'), flag('heir_chosen'), flag('heir_disciple'), xinxing(2)],
          recap: { weight: 5, text: '{ageCn}歲那年，你的弟子{disciple}在風雲榜上超過了你。你把掌門的位子傳給了他。' },
        },
      },
    ],
  },

  // ==================== 風雲榜上的新面孔 ====================
  {
    id: 'rank_duel',
    kind: 'normal',
    title: '下帖',
    scheduledOnly: true,
    conditions: { minAge: 22, maxAge: 72 },
    tags: ['martial', 'sparring'],
    text: '{star}派人送來一封帖子，字寫得很張揚：風雲榜上的名次，是說書人排的；誰高誰低，打一場就知道。下個月初一，城外的老槐樹下，不見不散。',
    choices: [
      {
        id: 'accept',
        text: '赴約',
        duel: {
          opponent: 'rising_star',
          success: {
            text: '老槐樹下圍了上百個看熱鬧的人。打完了，{star}把兵器插回鞘裡，朝你深深一揖：「榜上說得不對。我差得遠。」第二年的風雲榜，他的名字往下掉了一大截。',
            effects: [{ type: 'star', result: 'win' }, fame(5)],
            recap: { weight: 3, text: '{ageCn}歲那年，風雲榜上的新秀{star}下帖挑戰。你在老槐樹下贏了他。' },
          },
          failure: {
            text: '你輸了半招。{star}沒有笑，只是收起兵器說：「前輩，再過十年，我未必贏得了你。」看熱鬧的人散了，這件事卻傳得很遠。',
            effects: [{ type: 'star', result: 'lose' }, fame(-2)],
          },
        },
      },
      {
        id: 'decline',
        text: '把帖子壓在茶碗底下，不去',
        outcome: {
          text: '初一那天，{star}在老槐樹下等了一整天。後來江湖上傳，說你怕了。你聽了，只是笑笑。',
          effects: [{ type: 'star', result: 'decline' }, fame(-1), xinxing(1)],
        },
      },
    ],
  },
];
