// 抗蒙的人與事：三位大師（啞鐘和尚無言、船家女阮青篙、降將賀雲旗），襄陽最後的夜襲，崖山。
// 史實大事（圍城、城破、臨安）在 history.ts。這裡的事不改變大勢，只決定你站在哪裡。
//
// 排程的原則：大師的後續都由第一次相遇排上日程，再用年份條件等到對的時候才發生；
// 賀雲旗的夜談緊接在城下那一幕之後（那幾年強制的大事太多，排程會被擠掉）；
// 只有「夜襲」「崖山」是強制的。夜襲和城破在同一段年份，所以夜襲的每個結果都直接接城破。

import type { GameEvent } from '../../engine/types';
import { align, card, chiv, danshi, fame, flag, gengu, goTo, health, later, meet, money, next, rel, xinxing, xp } from '../dsl';

export const warEvents: GameEvent[] = [
  // ==================== 啞鐘和尚 無言：洗塵功 ====================
  {
    id: 'wuyan_meet',
    kind: 'normal',
    title: '啞鐘',
    weight: 14,
    conditions: { minAge: 15, maxAge: 55, npcPresent: 'wuyan' },
    weightMods: [{ if: { maxHealth: 60 }, mult: 2 }],
    tags: ['travel', 'rest', 'medicine', 'martial'],
    enterEffects: [meet('wuyan')],
    text: '山腰有一座苦竹寺。你上山借宿，天沒亮就被一陣很悶的聲音吵醒。鐘樓上，一個乾瘦的老和尚正用掌心去推那口幾千斤的銅鐘。鐘沒有鐘槌，也不響，只是微微一晃。知客僧說，這口鐘四十年沒有響過，敲鐘的無言師父，也四十年沒有說過一個字。',
    choices: [
      {
        id: 'push',
        text: '走上鐘樓，學著他的樣子去推',
        check: {
          stats: ['gengu', 'xinxing'],
          difficulty: 5,
          success: {
            text: '你推了一個早上，鐘紋絲不動。老和尚看了你很久，伸出一根手指，在你胸口輕輕點了一下。你這才發現，自己一直憋著氣。他蘸著茶水在石階上寫了兩個字：「再來。」',
            effects: [rel('wuyan', 20), xp('xichen', 2), later('wuyan_teach', 1, 3, 10), later('wuyan_gate', 4, 8, 30)],
          },
          failure: {
            text: '你使出了吃奶的力氣，鐘沒動，自己倒閃了腰。老和尚替你揉了半天，還是一個字也沒說，眼睛裡卻有一點笑意。',
            effects: [rel('wuyan', 10), health(-3), later('wuyan_teach', 2, 4, 10), later('wuyan_gate', 4, 8, 30)],
          },
        },
      },
      {
        id: 'chores',
        text: '留下來住幾天，幫寺裡挑水劈柴',
        outcome: {
          text: '你挑了七天的水。第七天，你發現水缸旁邊多了一雙草鞋，大小正合你的腳。知客僧說，那是無言師父夜裡編的。',
          effects: [rel('wuyan', 15), health(8), xinxing(1), later('wuyan_teach', 1, 3, 10), later('wuyan_gate', 4, 8, 30)],
        },
      },
      {
        id: 'leave',
        text: '住一夜就下山',
        outcome: { text: '你下山時回頭看了一眼。鐘樓上那個人影還在推，一下，又一下。', effects: [health(3)] },
      },
    ],
  },
  {
    id: 'wuyan_teach',
    kind: 'normal',
    title: '洗塵',
    scheduledOnly: true,
    conditions: { npcAlive: ['wuyan'], notFlags: ['wuyan_gone'] },
    tags: ['rest', 'martial'],
    text: '你又上了苦竹寺。無言和尚領你到後山的溪邊，指了指水裡的一塊石頭：石頭被水沖了不知多少年，圓得沒有一個稜角。他蘸水在石上寫：「功是洗出來的，不是練出來的。」寫完，他盤腿坐進了冰冷的溪水裡，拍了拍身邊的位置。',
    choices: [
      {
        id: 'learn',
        text: '坐進溪水裡，在寺裡住下來',
        outcome: {
          text: '你在溪水裡坐了一個秋天。起初冷得牙關打戰，後來有一天，你發現水是暖的。老和尚把一卷手抄的《洗塵功》放在你膝上，封皮上只有一行小字：「不傷人，只是打不倒。」',
          effects: [xp('xichen', 5), gengu(1), health(15), rel('wuyan', 20), xinxing(1)],
          recap: { weight: 3, text: '{ageCn}歲那年，苦竹寺的啞鐘和尚教了你洗塵功。他一個字也沒說。' },
        },
      },
      {
        id: 'breath',
        text: '只學吐納的法門，學完就走',
        outcome: {
          text: '他教了你三天怎麼喘氣。你這才知道，自己喘了這麼多年的氣，原來一直是錯的。',
          effects: [xp('xichen', 2), health(8), rel('wuyan', 8)],
        },
      },
      {
        id: 'decline',
        text: '搖搖頭：你學的是殺人的本事，坐不住',
        outcome: {
          text: '老和尚點點頭，一個人在溪水裡坐著。你走出很遠，還聽得見水聲。',
          effects: [danshi(1)],
        },
      },
    ],
  },
  {
    id: 'wuyan_gate',
    kind: 'normal',
    title: '山門',
    scheduledOnly: true,
    conditions: { minYear: 1255, maxYear: 1277, npcAlive: ['wuyan'], minRelation: { wuyan: 20 }, notFlags: ['wuyan_gone'] },
    tags: ['war', 'martial'],
    text: '你趕到苦竹寺時，山門外已經圍了一隊蒙古兵。寺裡躲著三百多個從山下逃上來的百姓。百夫長的話由通譯喊了三遍：把人交出來，寺可以不燒。無言和尚一個人站在山門前的石階上，還是不說話。他回頭看了你一眼。',
    choices: [
      {
        id: 'stand',
        text: '走過去，站到他身邊',
        duel: {
          opponent: 'mongol_centurion',
          success: {
            text: '百夫長的刀落了地，兵退到了山腳。老和尚看著石階上的血，站了很久。然後，你聽見了他四十年來的第一句話，聲音啞得像生了鏽：「殺生是罪。這個罪，老衲跟你一起擔。」',
            effects: [flag('wuyan_spoke'), flag('held_temple_gate'), rel('wuyan', 25), chiv(6), fame(5), xp('xichen', 2)],
            recap: { weight: 5, text: '{ageCn}歲那年，你和啞鐘和尚守住了苦竹寺的山門。四十年沒開口的老和尚，對你說了一句話。' },
          },
          failure: {
            text: '你倒在石階上。老和尚把你拖進山門，自己走了出去。那天傍晚，四十年沒響過的鐘響了一聲，整座山都聽見了。蒙古兵不知為什麼退了。老和尚的禪房，從此是空的。',
            effects: [flag('wuyan_gone'), flag('dead_wuyan'), flag('held_temple_gate'), chiv(4), xinxing(2)],
            recap: { weight: 5, text: '{ageCn}歲那年，苦竹寺的啞鐘響了一聲。老和尚沒有再回來。' },
          },
        },
      },
      {
        id: 'backhill',
        text: '帶寺裡的人從後山走，把空寺留給他們燒',
        check: {
          stats: ['danshi', 'fuyuan'],
          difficulty: 6,
          success: {
            text: '三百多人，一個不少地翻過了後山。回頭看時，苦竹寺已經是一片火。老和尚最後一個下山，在你掌心寫了幾個字。寫完他忽然開了口，像是忘了自己四十年不說話：「寺燒了，可以再蓋。」',
            effects: [flag('wuyan_spoke'), flag('saved_temple_people'), rel('wuyan', 20), chiv(8), fame(3)],
            recap: { weight: 5, text: '{ageCn}歲那年，你帶著苦竹寺裡的三百多人翻過後山。寺燒了，人都活著。' },
          },
          failure: {
            text: '山路太窄，走散了幾十個人。老和尚在火光裡站了一夜，把走散的人一個一個找了回來，只是再也沒有回頭看那座寺。',
            effects: [flag('saved_temple_people'), rel('wuyan', 10), chiv(4)],
          },
        },
      },
      {
        id: 'ransom',
        text: '拿錢出來，跟百夫長買這三百條命',
        requires: { minMoney: 60 },
        hint: '你身上的錢不夠',
        outcome: {
          text: '百夫長收了錢，又叫人抬走了大殿裡的銅佛，沒有動人。老和尚看著空了的佛座，忽然笑了，說了四十年來的第一句話：「佛本來就不在那裡。」',
          effects: [money(-60), flag('wuyan_spoke'), rel('wuyan', 15), chiv(5)],
          recap: { weight: 4, text: '{ageCn}歲那年，你花錢從蒙古兵手裡買下了苦竹寺三百多人的命。' },
        },
      },
    ],
  },

  // ==================== 船家女 阮青篙：渡江篙 ====================
  {
    id: 'ruan_meet',
    kind: 'normal',
    title: '擺渡',
    weight: 14,
    conditions: { minAge: 15, maxAge: 55, npcPresent: 'ruan_qinggao' },
    tags: ['travel', 'trade', 'work', 'martial'],
    enterEffects: [meet('ruan_qinggao')],
    text: '漢水上最快的渡船是一個女人撐的。別人過江要一炷香，她只要半炷。船到江心，一個客人嫌船錢貴，想賴帳，還伸手去推她。她頭也沒回，竹篙往後一點，那人就坐進了水裡。她把篙伸過去讓他抓住：「船錢照舊，撈人另算。」',
    choices: [
      {
        id: 'ask',
        text: '付了船錢，問她這一手是怎麼練的',
        outcome: {
          text: '她收了錢，打量了你兩眼：「想學？腳下是晃的，手上才不會硬。哪天你在我船頭站得住一天，再說。」她叫阮青篙。',
          effects: [money(-3), rel('ruan_qinggao', 15), later('ruan_teach', 1, 3, 10), later('ruan_run', 3, 6, 30)],
        },
      },
      {
        id: 'help',
        text: '江面上有兩條船朝這邊靠過來，是水匪。幫她',
        duel: {
          opponent: 'smugglers',
          success: {
            text: '你守船尾，她守船頭，一根篙點翻了三個人。上岸時她沒有收你的船錢：「水上的規矩，一條船上打過架的，就是一條船上的人。」她叫阮青篙。',
            effects: [rel('ruan_qinggao', 25), fame(2), chiv(2), later('ruan_teach', 1, 2, 10), later('ruan_run', 3, 6, 30)],
          },
          failure: {
            text: '你被人一槳拍進了江裡。是她把你撈上來的，還多收了一份撈人的錢。「心是好的，」她說，「就是不識水性。」',
            effects: [rel('ruan_qinggao', 10), money(-5), later('ruan_teach', 2, 4, 10), later('ruan_run', 3, 6, 30)],
          },
        },
      },
      {
        id: 'quiet',
        text: '坐船過江，什麼也不問',
        outcome: { text: '船靠了岸。你回頭時，她已經又撐到了江心，篙尖帶起的水在太陽底下亮了一下。', effects: [rel('ruan_qinggao', 3)] },
      },
    ],
  },
  {
    id: 'ruan_teach',
    kind: 'normal',
    title: '船頭',
    scheduledOnly: true,
    conditions: { npcAlive: ['ruan_qinggao'], notFlags: ['ruan_lost'] },
    tags: ['travel', 'martial'],
    text: '阮青篙讓你站在船頭，不許扶任何東西，然後把船撐進了漢水最急的那一段。你第一天掉下去十七次。傍晚她坐在船尾補網，頭也不抬：「你總想站穩。水上沒有穩這回事，只有順著它。」',
    choices: [
      {
        id: 'learn',
        text: '第二天接著站',
        outcome: {
          text: '你站了一個月。有一天浪打過來，你的腳自己就讓開了。她把一根青竹篙扔給你：「篙法只有一句話：他來多少力，你借多少力。剩下的，是水教的，不是我教的。」',
          effects: [xp('dujiang', 5), rel('ruan_qinggao', 20)],
          recap: { weight: 3, text: '{ageCn}歲那年，漢水上的阮青篙教了你渡江篙。你在她船頭掉下去過不知多少次。' },
        },
      },
      {
        id: 'swap',
        text: '「我也教你一手。換。」',
        requires: { minMartial: 2 },
        hint: '你自己的本事還不夠拿來換',
        outcome: {
          text: '她學你的招式學得比你學她的快。分手時她說：「你的功夫是站在地上打的，好看。我的是站在船上打的，活命用。」說完自己先笑了。',
          effects: [xp('dujiang', 4), rel('ruan_qinggao', 25), xinxing(1)],
          recap: { weight: 3, text: '{ageCn}歲那年，你和漢水上的阮青篙換了一手功夫。' },
        },
      },
      {
        id: 'decline',
        text: '爬上岸，認了：自己不是水上的人',
        outcome: { text: '她笑得差點把網扯破。「旱鴨子也有旱鴨子的活法。」她還是請你喝了一碗魚湯。', effects: [rel('ruan_qinggao', 5)] },
      },
    ],
  },
  {
    id: 'ruan_run',
    kind: 'normal',
    title: '水路',
    scheduledOnly: true,
    conditions: { minYear: 1267, maxYear: 1272, npcAlive: ['ruan_qinggao'], minRelation: { ruan_qinggao: 20 }, notFlags: ['ruan_lost'] },
    tags: ['war', 'travel'],
    text: '襄陽被圍的第三年，城裡的鹽和布都斷了。阮青篙找到你時，眼睛底下全是青的。她湊了一百條輕船、三千個水上討生活的人，要趁漢水漲水的那一夜，衝過蒙古人橫江的鐵索和水寨，把東西送進城。「一百條船，進得去三十條就算贏。」她把一根篙遞過來，「頭船缺一個站船頭的。」',
    choices: [
      {
        id: 'bow',
        text: '接過篙，站上頭船的船頭',
        duel: {
          opponent: 'water_fort',
          success: {
            text: '鐵索是你和她一起砸斷的。天亮時，三十七條船靠上了襄陽的水門，城頭上的人哭成了一片。阮青篙坐在船舷上，手抖得握不住篙，卻在笑：「三十七條。多了七條。」',
            effects: [flag('ran_blockade'), goTo('xiangyang'), chiv(8), fame(8), rel('ruan_qinggao', 25), xp('dujiang', 2), meet('han_shouyi'), rel('han_shouyi', 10)],
            recap: { weight: 5, text: '{ageCn}歲那年，你站在頭船的船頭，和阮青篙一起衝過水寨，把三十七條船的鹽和布送進了襄陽。' },
          },
          failure: {
            text: '頭船在鐵索前被火箭點著了。你抱著半截篙在江裡漂了一夜。後來才知道，進城的只有十一條船。阮青篙在下游找到了你，什麼也沒說，只是把你拖上了她那條燒黑了一半的船。',
            effects: [flag('ran_blockade_failed'), chiv(4), fame(3), rel('ruan_qinggao', 15)],
            recap: { weight: 4, text: '{ageCn}歲那年，你跟著阮青篙衝水寨。頭船燒了，進城的只有十一條。' },
          },
        },
      },
      {
        id: 'fire',
        text: '「我帶幾條火船，在上游替你引開水寨的兵。」',
        check: {
          stats: ['wuxing', 'danshi'],
          difficulty: 6,
          success: {
            text: '上游的火光燒紅了半條江，水寨的兵全往那邊去了。你游回岸上時，聽見下游傳來鐵索斷掉的聲音。那一夜進城的船，有三十三條。',
            effects: [flag('ran_blockade'), chiv(6), fame(5), rel('ruan_qinggao', 20)],
            recap: { weight: 4, text: '{ageCn}歲那年，你在漢水上游放火船引開守軍，讓三十三條船衝進了襄陽。' },
          },
          failure: {
            text: '風向變了，火船燒得太早。水寨的兵沒有動。那一夜進城的船不到二十條，回來的人更少。',
            effects: [flag('ran_blockade_failed'), chiv(3), rel('ruan_qinggao', 5)],
          },
        },
      },
      {
        id: 'refuse',
        text: '「這是去送死。」',
        outcome: {
          text: '她點點頭，把篙收了回去：「是送死。可城裡的人在等鹽。」半個月後消息傳來：進去了二十幾條船。撐頭船的那個女人，沒有人再見過。',
          effects: [flag('ruan_lost'), flag('dead_ruan_qinggao'), xinxing(-1)],
          recap: { weight: 4, text: '{ageCn}歲那年，阮青篙請你站她的船頭，你沒有去。後來，沒有人再見過她。' },
        },
      },
    ],
  },

  // ==================== 降將 賀雲旗：斷纓槍 ====================
  {
    id: 'he_meet',
    kind: 'normal',
    title: '城下',
    weight: 16,
    conditions: { minAge: 18, minYear: 1261, maxYear: 1273, regions: ['xiangyang', 'shu'], npcAlive: ['he_yunqi'] },
    weightMods: [{ if: { sects: ['yijun'] }, mult: 2 }, { if: { ambitions: ['nation'] }, mult: 1.5 }],
    tags: ['war', 'martial', 'sect'],
    enterEffects: [meet('he_yunqi')],
    text: '城外來了一員蒙古軍的將領，單人獨騎，槍上繫著一條舊紅纓。他在城下連挑了守軍三員將，每一個都只用了一槍。城頭有老兵認了出來，聲音都變了：那是賀雲旗，十年前大宋槍術第一的統制。他勒住馬，抬頭朝城上喊：「還有誰？」',
    choices: [
      {
        id: 'duel',
        text: '提著兵器，一個人出城',
        duel: {
          opponent: 'he_yunqi',
          success: {
            text: '你削斷了他槍上的紅纓。他低頭看著落在地上的那截纓，沒有再出槍。「剛才那一槍，叫斷纓。」他撥轉馬頭，「你既然接得住，它就是你的了。」',
            effects: [card('duanying'), flag('beat_he'), fame(8), rel('he_yunqi', 15), next('he_talk')],
            recap: { weight: 5, text: '{ageCn}歲那年，你一個人出城，削斷了斷纓槍賀雲旗槍上的紅纓。' },
          },
          failure: {
            text: '他的槍尖停在你喉嚨前一寸。「回去。再練十年。」他沒有殺你。城頭上鴉雀無聲。',
            effects: [flag('lost_to_he'), fame(2), danshi(1), next('he_talk')],
            recap: { weight: 3, text: '{ageCn}歲那年，你一個人出城挑戰賀雲旗。他的槍尖停在了你的喉嚨前。' },
          },
        },
      },
      {
        id: 'ask',
        text: '問那個老兵：他為什麼降',
        outcome: {
          text: '老兵沉默了很久。「他當年守的那座城，斷糧八個月，朝廷的援兵一個也沒有來。城破那天，他拿自己一個人的降，換了滿城的命。」老兵往城下吐了口唾沫，「然後朝廷把他留在臨安的一家老小，全殺了。」',
          effects: [flag('know_he_story'), xinxing(1), rel('he_yunqi', 5), next('he_talk')],
        },
      },
      {
        id: 'arrow',
        text: '趁他抬頭喊話，從城頭放一支冷箭',
        check: {
          stats: ['wuxing', 'fuyuan'],
          difficulty: 7,
          success: {
            text: '箭釘進了他的左肩。他看也沒看，反手把箭拔了出來，朝城頭舉了舉，像是在謝你：「這才是打仗。」那之後一個月，他沒有再來城下。',
            effects: [flag('he_wounded'), fame(3), align(-3)],
          },
          failure: {
            text: '他頭一偏，箭擦著他的耳朵飛了過去。他抬頭看著你站的那個垛口，看了很久，像是要記住你的臉。',
            effects: [align(-3), rel('he_yunqi', -10)],
          },
        },
      },
    ],
  },
  {
    id: 'he_talk',
    kind: 'normal',
    title: '廢村',
    scheduledOnly: true,
    conditions: { maxYear: 1275, npcAlive: ['he_yunqi'] },
    tags: ['war'],
    text: [
      {
        if: { flags: ['beat_he'] },
        text: '當天夜裡，有人從城下射上來一封箭書，指名給你：兩軍之間有一座廢村，不帶兵器，一個人來。你到的時候，賀雲旗坐在一口枯井邊，身邊放著兩碗酒。他槍上的紅纓還是斷的，沒有換。',
      },
      { text: '當天夜裡，有人從城下射上來一封箭書，指名給你：兩軍之間有一座廢村，不帶兵器，一個人來。你到的時候，賀雲旗坐在一口枯井邊，身邊放著兩碗酒。' },
    ],
    choices: [
      {
        id: 'persuade',
        text: '「回來吧。城裡還有人記得你守過的那座城。」',
        check: {
          stats: ['meili', 'xinxing'],
          difficulty: 7,
          success: {
            text: '他很久沒有說話。「我回不去了。」他把酒喝完，站起來，「可我能讓攻城的時候，北門的雲梯晚到半個時辰。就半個時辰。」他走進夜色裡，沒有回頭。',
            effects: [flag('he_turned'), rel('he_yunqi', 30), chiv(4), xinxing(1)],
            recap: { weight: 4, text: '{ageCn}歲那年，你在兩軍之間的廢村見了降將賀雲旗。他沒有回來，卻答應了你一件事。' },
          },
          failure: {
            text: '「你守的那個朝廷，殺了我全家。」他把酒倒在地上，「我守過了。該你們了。」',
            effects: [rel('he_yunqi', -5), xinxing(1)],
          },
        },
      },
      {
        id: 'listen',
        text: '端起酒，聽他把話說完',
        outcome: {
          text: '他講了一夜。講他守的那座城，講城裡最後吃的是什麼，講臨安的那道旨意。天快亮時，他撿起一根樹枝，把那一槍在地上畫給你看。「斷纓這一槍，總得有個宋人會。別跟人說，是我教的。」',
          effects: [card('duanying'), flag('heard_he'), rel('he_yunqi', 20), xinxing(2)],
          recap: { weight: 4, text: '{ageCn}歲那年，降將賀雲旗在一座廢村裡，把他的那一槍畫在了地上給你看。' },
        },
      },
      {
        id: 'ambush',
        text: '你沒有一個人來。動手',
        duel: {
          opponent: 'he_yunqi',
          success: {
            text: '他倒在枯井邊，酒碗還端在手裡，一滴也沒有灑。「早該有人來了。」他看著你，「我原以為，會是韓守義。」',
            effects: [flag('killed_he'), flag('dead_he_yunqi'), fame(6), align(-8), chiv(-3)],
            recap: { weight: 5, text: '{ageCn}歲那年，你在一座廢村裡設伏，殺了降將賀雲旗。他沒有帶兵器。' },
          },
          failure: {
            text: '他空著手，還是把你們都打倒了。他撿起自己的酒碗，喝完：「我沒帶槍。下一回，我會帶。」',
            effects: [rel('he_yunqi', -30), align(-5), fame(-3)],
          },
        },
      },
    ],
  },

  // ==================== 襄陽最後的夜襲 ====================
  {
    id: 'burn_trebuchet',
    kind: 'forced',
    title: '夜襲',
    // 比「襄陽城破」先發生；每個結果都直接接城破
    priority: 11,
    conditions: { minAge: 16, minYear: 1273, maxYear: 1274, regions: ['xiangyang'] },
    tags: ['war'],
    text: '城外架起了七座誰也沒見過的巨砲，是西域來的匠人造的，一塊石頭有三百斤。對岸樊城的城樓，一砲就塌了半邊。再過幾天，這些砲就要轉過來對著襄陽。義軍在城頭點人：今夜出城，燒砲。點到名的人，沒有一個問回不回得來。',
    choices: [
      {
        id: 'go',
        text: '走出去，站進那一列人裡',
        duel: {
          opponent: 'mongol_centurion',
          success: {
            text: '你們燒掉了四座。火光裡，你看見那些西域匠人跪在地上，朝著燒塌的砲架磕頭。回城的路上沒有人說話。城牆因此多撐了三個月。也只是三個月。',
            effects: [flag('burned_trebuchets'), chiv(6), fame(6), next('siege_fall')],
            recap: { weight: 5, text: '{ageCn}歲那年，你夜裡出城，燒掉了四座砸塌樊城的巨砲。襄陽多守了三個月。' },
          },
          failure: {
            text: '只燒掉了一座。出城的人，回來的不到一半。你是被人拖回來的。',
            effects: [flag('night_raid'), chiv(4), fame(2), next('siege_fall')],
            recap: { weight: 4, text: '{ageCn}歲那年，你夜裡出城燒砲。出城的人，回來的不到一半。' },
          },
        },
      },
      {
        id: 'water',
        text: '「從水路摸過去。砲營靠江的那一面沒有柵欄。」',
        requires: { minSkill: { dujiang: 2 } },
        hidden: true,
        outcome: {
          text: '你們貼著江邊的蘆葦摸了過去，上岸的地方離砲架只有三十步。七座砲燒掉了六座，守砲的兵到天亮都以為火是從營裡燒起來的。襄陽多守了半年。也只是半年。',
          effects: [flag('burned_trebuchets'), chiv(7), fame(8), xp('dujiang', 1), next('siege_fall')],
          recap: { weight: 5, text: '{ageCn}歲那年，你帶人從水路摸進砲營，燒掉了六座巨砲。襄陽多守了半年。' },
        },
      },
      {
        id: 'password',
        text: '賀雲旗送來過一張紙條，上面是今夜砲營的口令',
        requires: { flags: ['he_turned'] },
        hidden: true,
        outcome: {
          text: '口令是對的。你們像換防的兵一樣走進了砲營，七座砲一座也沒剩。後來聽說，賀雲旗因為「守營不力」被奪了前鋒的印，他一句也沒有辯。',
          effects: [flag('burned_trebuchets'), chiv(6), fame(8), rel('he_yunqi', 10), next('siege_fall')],
          recap: { weight: 5, text: '{ageCn}歲那年，你拿著降將賀雲旗送來的口令走進砲營，把七座巨砲全燒了。' },
        },
      },
      {
        id: 'stay',
        text: '留在城頭，守著被砸開的那個缺口',
        outcome: {
          text: '你搬了一夜的石頭和沙袋。天快亮時，北邊的天紅了一小片，很快又暗了下去。出城的人，回來的不到一半。',
          effects: [chiv(2), xinxing(1), next('siege_fall')],
        },
      },
    ],
  },

  // ==================== 崖山 ====================
  {
    id: 'yashan',
    kind: 'forced',
    title: '崖山',
    priority: 9,
    conditions: { minAge: 30, minYear: 1279, maxYear: 1279 },
    tags: ['war'],
    text: [
      {
        if: { flags: ['defended_city'] },
        text: '襄陽城破，已經是六年前的事了。這一年春天，消息傳到你這裡：最後的朝廷退到了南海邊一個叫崖山的地方，一千多條船用鐵索連成了一座水上的城。幾十萬軍民擠在船上，淡水已經斷了十天。蒙古人的船隊，就停在海口。',
      },
      { text: '這一年春天，消息傳到你這裡：最後的朝廷退到了南海邊一個叫崖山的地方，一千多條船用鐵索連成了一座水上的城。幾十萬軍民擠在船上，淡水已經斷了十天。蒙古人的船隊，就停在海口。' },
    ],
    choices: [
      {
        id: 'go',
        text: '收拾兵器，往南走。趕得上就打最後一仗',
        check: {
          stats: ['gengu', 'danshi'],
          difficulty: 7,
          martial: true,
          success: {
            text: '你趕到的那天，海上起了大霧。你跳上一條鎖在鐵索上的船，從早上砍到黃昏。日落時，那些連在一起的船再也分不開，一條接一條地沉。你抱著一塊船板漂了兩天兩夜，被一個老漁夫撈了起來。他什麼也沒問。',
            effects: [flag('at_yashan'), goTo('jiangnan'), chiv(8), fame(6), health(-20)],
            recap: { weight: 6, text: '{ageCn}歲那年，你趕到了崖山，在鐵索連著的船上打了最後一仗。你是被漁夫從海裡撈起來的。' },
          },
          failure: {
            text: '你趕到海邊時，仗已經打完了。海面上漂著的東西，一眼望不到頭。你在岸邊站了三天，幫著漁民把能撈的人撈上來，活的不多。',
            effects: [flag('at_yashan'), goTo('jiangnan'), chiv(6), xinxing(1)],
            recap: { weight: 6, text: '{ageCn}歲那年，你趕到崖山時，仗已經打完了。你在海邊撈了三天的人。' },
          },
        },
      },
      {
        id: 'ferry',
        text: '找船。仗你幫不上，逃到海邊的百姓，接得走幾個是幾個',
        check: {
          stats: ['fuyuan', 'meili'],
          difficulty: 6,
          skill: 'dujiang',
          success: {
            text: '你湊了十一條漁船，在海邊來回了九趟。最後一趟，船上擠得連篙都撐不開，一個抱孩子的女人問你叫什麼名字。你說，撐船的。',
            effects: [flag('ferried_refugees'), goTo('jiangnan'), chiv(10), fame(4)],
            recap: { weight: 6, text: '{ageCn}歲那年，朝廷在崖山覆滅。你湊了十一條漁船，在海邊來回了九趟。' },
          },
          failure: {
            text: '你只找到兩條船，來回了三趟，風浪就起來了。你站在岸上，看著還沒接走的人，一直站到天黑。',
            effects: [flag('ferried_refugees'), goTo('jiangnan'), chiv(6), xinxing(-1)],
            recap: { weight: 5, text: '{ageCn}歲那年，朝廷在崖山覆滅。你只找到兩條船，接走了能接的人。' },
          },
        },
      },
      {
        id: 'write',
        text: '哪裡也不去。把這些年見過的人、守過的城，一筆一筆寫下來',
        outcome: {
          text: '你寫了一個春天。寫城頭上那些連名字都沒留下的人，寫他們吃過什麼、說過什麼笑話。寫完你把那疊紙包了三層油布，埋在了院子裡的樹下。朝廷沒有了，總得有人記得。',
          effects: [flag('wrote_memoir'), xinxing(2), fame(2)],
          recap: { weight: 4, text: '{ageCn}歲那年，朝廷在崖山覆滅。你把這些年見過的人和事寫了下來，埋在樹下。' },
        },
      },
      {
        id: 'drink',
        text: '朝南邊倒一碗酒，什麼也不說',
        outcome: {
          text: '酒滲進土裡，很快就乾了。第二天，你照常起來過日子。日子還是要過的。',
          effects: [xinxing(1)],
        },
      },
    ],
  },
];
