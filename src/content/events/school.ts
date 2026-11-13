// 自成一家與開宗立派：自創武學、立門規、收徒、踢館、叛徒、國難、傳人。
// 規則在 engine/school.ts（弟子怎麼長、聲勢怎麼漲）；{art}{school}{disciple}{heir} 由引擎代入。

import type { GameEvent } from '../../engine/types';
import { add, chiv, createArt, disciple, fame, flag, foundSchool, health, later, recruit, spotlight, xinxing } from '../dsl';

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
    kind: 'normal',
    title: '叛徒',
    scheduledOnly: true,
    conditions: { flags: ['founded_sect'] },
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
];
