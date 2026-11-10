// 擇路與兩難：少年時選一條練武的路；幾件有真正代價的抉擇，後果會在多年後找上門。

import type { GameEvent } from '../../engine/types';
import { align, card, chiv, fame, flag, gengu, health, later, mainSkill, money, rel, train, xinxing, xp } from '../dsl';

export const pathEvents: GameEvent[] = [
  // ---------- 擇路 ----------
  {
    id: 'choose_path',
    kind: 'forced',
    title: '擇路',
    priority: -5,
    conditions: { minAge: 13, maxAge: 16 },
    tags: ['martial'],
    text: '{ageCn}歲這年，你的拳腳在同齡的孩子裡已經不算差了。村口武館的師傅、住在村尾的退伍老兵、常來{place}歇腳的鏢師，都說過你是塊料子。練武這條路，往哪個方向走？',
    choices: [
      {
        id: 'fist',
        text: '跟武館的師傅，把長拳練紮實',
        note: '拳：一拳接一拳，招式便宜，越打越快。入門可挑：衝拳、紮馬、連環拳',
        outcome: {
          text: '師傅讓你每天對著木樁打三百拳。打到第一百天，木樁裂了一道縫，師傅才第一次對你點了點頭。',
          effects: [xp('changquan', 4), mainSkill('changquan'), flag('path_fist')],
          recap: { weight: 2, text: '少年時，你決定把長拳練到底。' },
        },
      },
      {
        id: 'spear',
        text: '跟村尾的老兵學槍',
        note: '槍：守得住，也打得穿護體。入門可挑：拒馬、回馬槍、突槍',
        outcome: {
          text: '老兵年輕時在襄陽守過城，左手只剩三根指頭。他把一桿白蠟桿丟給你：「槍是守城用的。先學會不退，再學怎麼殺人。」',
          effects: [xp('shoucheng', 3), mainSkill('shoucheng'), flag('path_spear')],
          recap: { weight: 2, text: '少年時，你跟村尾的老兵學了槍。' },
        },
      },
      {
        id: 'steps',
        text: '跟鏢師學輕功',
        note: '輕功：閃身、繞步，抽牌多、讓人打不著。入門可挑：閃身、繞步、飛燕',
        outcome: {
          text: '鏢師笑你腳底下太沉，要你在牆頭上來回走，走到不看腳下為止。你摔了一個月，第二個月，你在牆頭上睡了一個午覺。',
          effects: [xp('liuyun', 3), mainSkill('liuyun'), flag('path_steps')],
          recap: { weight: 2, text: '少年時，你跟過路的鏢師學了輕功。' },
        },
      },
      {
        id: 'wait',
        text: '不急著定，先把身子底子打好',
        note: '根骨 +1。劍法、暗器這些路，要靠以後的機緣（醉劍、劍府、深山石洞……）',
        outcome: {
          text: '你每天天不亮就去挑水、劈柴、爬後山。練什麼還沒想好，身子倒是先結實了。',
          effects: [gengu(1)],
        },
      },
    ],
  },

  // ---------- 兩難：一筆好買賣 ----------
  {
    id: 'dirty_job',
    kind: 'normal',
    title: '一筆好買賣',
    weight: 6,
    conditions: { minAge: 18, maxAge: 45, minMartial: 1 },
    tags: ['jianghu'],
    text: '{place}米行的東家派人來找你。城東有個賣布的姓周，欠了東家的債，地契卻怎麼也不肯交出來。「打斷他一條腿就行。」來人把一袋錢擱在桌上，「八十文，事成再給四十。」',
    choices: [
      {
        id: 'take',
        text: '收下錢，今晚就去',
        note: '錢財 +120；但周家的人會記住你',
        outcome: {
          text: '那天夜裡，你踹開了周家的門。賣布的男人抱著腿在地上滾，他十來歲的兒子縮在門邊，一聲不吭地看著你。你走的時候，那孩子還在看著。',
          effects: [money(120), align(-10), chiv(-6), flag('broke_zhou'), later('zhou_son', 8, 12, 20)],
          recap: { weight: 3, text: '你收了米行東家的錢，打斷了賣布的周家男人一條腿。他兒子在門邊看著。' },
        },
      },
      {
        id: 'warn',
        text: '收下訂金，連夜去給周家報信',
        note: '會挨一頓打；周家會記住你的好',
        outcome: {
          text: '你把訂金塞給周家，讓他們連夜出城。第二天米行的人找上門，你挨了一頓好打。東家放話說，{place}再沒有你的飯吃。',
          effects: [health(-15), chiv(6), align(3), flag('saved_zhou'), later('zhou_thanks', 6, 10, 20)],
          recap: { weight: 2, text: '你替賣布的周家通風報信，自己挨了米行一頓打。' },
        },
      },
      {
        id: 'refuse',
        text: '把錢推回去',
        outcome: {
          text: '來人冷笑一聲，把錢收了回去。後來你聽說，周家男人的腿還是斷了——他們找了別人。',
          effects: [xinxing(1)],
        },
      },
    ],
  },
  {
    id: 'zhou_son',
    kind: 'normal',
    title: '門邊的孩子',
    scheduledOnly: true,
    tags: ['feud'],
    conditions: { flags: ['broke_zhou'], notFlags: ['zhou_settled'] },
    text: '有個年輕人在你家門口站了一整天。等你出來，他慢慢抬起頭：「你不記得我了吧？那年冬天，你踹開我家的門，打斷了我爹的腿。我爹拖著那條腿，又熬了五年。」他從背後抽出一根齊眉棍。',
    choices: [
      {
        id: 'fight',
        text: '拿起兵器',
        duel: {
          opponent: 'zhou_son',
          success: {
            text: '他倒在地上，棍子斷成兩截。你本可以再補一腳，卻轉身走了。這筆帳，你們算是各自扛著了。',
            effects: [flag('zhou_settled'), fame(1)],
            recap: { weight: 3, text: '當年在門邊看著的孩子長大了，上門找你算帳。你又贏了，卻一點也不痛快。' },
          },
          failure: {
            text: '他的棍子落在你的膝蓋上，你聽見骨頭響了一聲。「這下扯平了。」他扔下棍子，頭也不回地走了。',
            effects: [flag('zhou_settled'), gengu(-1)],
            recap: { weight: 3, text: '當年被你打斷腿的周家男人，兒子長大後上門，也打斷了你的腿。' },
          },
        },
      },
      {
        id: 'kneel',
        text: '跪下認錯，把當年那筆錢還給他',
        requires: { minMoney: 120 },
        outcome: {
          text: '你跪在門口，把一袋錢放在地上。他看了你很久，沒有撿那袋錢，轉身走了。走出很遠，你聽見他在哭。',
          effects: [money(-120), align(8), xinxing(2), flag('zhou_settled')],
          recap: { weight: 3, text: '你跪在周家兒子面前，想把當年的髒錢還回去。他沒有收。' },
        },
      },
      {
        id: 'shut',
        text: '關上門，不理他',
        note: '牌庫永久多一張「心魔」',
        outcome: {
          text: '你關上門。他在門外站到天黑才走。從那以後，你總覺得背後有人看著你，夜裡常常夢見那扇被踹開的門。',
          effects: [flag('zhou_settled'), card('demon')],
        },
      },
    ],
  },
  {
    id: 'zhou_thanks',
    kind: 'normal',
    title: '一匹好布',
    scheduledOnly: true,
    tags: ['social'],
    conditions: { flags: ['saved_zhou'] },
    text: '一輛馬車停在你家門口。下來的是周家的兒子，已經是個體面的布商了。「當年要不是您報信，我爹的腿就沒了。」他留下一匹好布和一包銀子，說什麼也不肯收回去。',
    choices: [
      {
        id: 'accept',
        text: '收下這份心意',
        outcome: {
          text: '那匹布你一直捨不得用。後來有人問起，你只說是一個老朋友送的。',
          effects: [money(80), fame(2), chiv(2)],
          recap: { weight: 2, text: '當年你替周家報信挨的那頓打，多年後換來了一匹好布。' },
        },
      },
      {
        id: 'decline',
        text: '只收下那匹布，銀子讓他帶回去',
        outcome: {
          text: '他拗不過你，只好把銀子收了回去。臨走前他說，周家布莊的門，往後永遠為你開著。',
          effects: [chiv(3), fame(3)],
          recap: { weight: 2, text: '當年你替周家報信挨的那頓打，多年後換來了一匹好布和一個朋友。' },
        },
      },
    ],
  },

  // ---------- 兩難：殘卷 ----------
  {
    id: 'forbidden_manual',
    kind: 'normal',
    title: '殘卷',
    weight: 5,
    conditions: { minAge: 20, maxAge: 50, minMartial: 2 },
    tags: ['martial', 'adventure'],
    text: '你在一座荒廟的佛像肚子裡，摸出一卷發黃的冊子。上面的運功法門邪得很：專走逆脈，練成了一日千里，練岔了……書頁邊角上，有前一個主人用血寫的四個字：「不可再練」。',
    choices: [
      {
        id: 'practice',
        text: '照著練',
        note: '主修武學大進；牌庫永久多一張「心魔」',
        outcome: {
          text: '你照著冊子練了一個冬天。功力確實一日千里——只是夜裡常常驚醒，夢裡有個聲音一直在笑。',
          effects: [train('martial', 8), card('demon'), flag('read_manual')],
          recap: { weight: 3, text: '你練了荒廟裡那卷邪門的殘卷。功力大進，心裡卻從此多了一個聲音。' },
        },
      },
      {
        id: 'burn',
        text: '把它燒了',
        outcome: {
          text: '你把殘卷丟進火裡。火苗竄起來的時候，你好像聽見一聲嘆息。',
          effects: [xinxing(2), chiv(1)],
        },
      },
      {
        id: 'sell',
        text: '拿去黑市賣掉',
        note: '錢財 +100；不知道會落到誰手裡',
        outcome: {
          text: '黑市的掌櫃翻了兩頁，眼睛就亮了，二話不說給了你一大袋錢。',
          effects: [money(100), flag('sold_manual'), later('manual_fiend', 4, 8, 15)],
        },
      },
    ],
  },
  {
    id: 'manual_fiend',
    kind: 'normal',
    title: '魔頭',
    scheduledOnly: true,
    tags: ['jianghu'],
    conditions: { flags: ['sold_manual'] },
    text: '江湖上出了一個魔頭，一夜之間連挑三家武館，死了十幾個人。倖存的人說，他出手的路數邪得很，專走逆脈——你一聽就知道，是那卷殘卷。',
    choices: [
      {
        id: 'hunt',
        text: '去找他，了結這件事',
        duel: {
          opponent: 'manual_fiend',
          success: {
            text: '魔頭倒下的時候，懷裡掉出那卷殘卷，比你賣出去時又多了幾頁血跡。你把它燒了，這一次，看著它燒完。',
            effects: [fame(6), chiv(4), flag('fiend_slain')],
            recap: { weight: 4, text: '你親手了結了練殘卷的魔頭。那卷殘卷，是你當年賣出去的。' },
          },
          failure: {
            text: '你敗了，拚著一身傷逃了出來。魔頭沒有追你，只是在背後笑：「這本書，寫得真好。」',
            effects: [chiv(-2)],
          },
        },
      },
      {
        id: 'ignore',
        text: '這不關你的事',
        outcome: {
          text: '你什麼也沒做。後來魔頭死在一個不知名的劍客手裡，可那十幾條人命，誰也還不回來了。',
          effects: [xinxing(-2), align(-3)],
          recap: { weight: 2, text: '你賣出去的那卷殘卷，後來害死了十幾個人。' },
        },
      },
    ],
  },

  // ---------- 兩難：頂罪 ----------
  {
    id: 'scapegoat',
    kind: 'normal',
    title: '頂罪',
    weight: 6,
    conditions: { minAge: 16, maxAge: 35, minRelation: { companion: 5 } },
    tags: ['social'],
    text: '{companion}半夜敲開你的門，渾身發抖：跟縣尉家的少爺起了爭執，失手把人推下了石階，人到現在還沒醒。「官差天一亮就會找來……我家裡還有老娘……」',
    choices: [
      {
        id: 'take',
        text: '替{companion}頂下來',
        note: '健康 −25、名望下降；{companion}會記一輩子',
        outcome: {
          text: '你去衙門自首，說人是你推的。挨了四十大板，在大牢裡關了大半年。出來那天，{companion}在門口等你，什麼話也沒說，跪下來給你磕了三個頭。',
          effects: [health(-25), fame(-3), rel('companion', 40), flag('took_blame'), later('companion_repays', 6, 12, 20)],
          recap: { weight: 4, text: '你替{companion}頂了罪，在大牢裡關了大半年。' },
        },
      },
      {
        id: 'flee',
        text: '湊一筆盤纏，送{companion}連夜逃走',
        requires: { minMoney: 30 },
        outcome: {
          text: '你把全部的積蓄塞給{companion}，送到渡口。船開的時候，{companion}一直回頭看你。',
          effects: [money(-30), rel('companion', 15), align(-3), flag('companion_fled')],
          recap: { weight: 2, text: '{companion}出事那晚，你湊了盤纏，送{companion}連夜坐船走了。' },
        },
      },
      {
        id: 'refuse',
        text: '這件事，你幫不了',
        outcome: {
          text: '你關上門。天亮的時候，你聽見官差把{companion}帶走了。後來在街上遇見，{companion}看了你一眼，就像沒看見你一樣。',
          effects: [rel('companion', -40), flag('abandoned_companion')],
          recap: { weight: 3, text: '{companion}出事那晚來敲你的門，你沒有開。' },
        },
      },
    ],
  },
  {
    id: 'companion_repays',
    kind: 'normal',
    title: '那半年的牢',
    scheduledOnly: true,
    tags: ['social'],
    conditions: { flags: ['took_blame'] },
    text: '{companion}托人帶話，約你在{place}最好的酒樓見面。這些年{companion}跑船做買賣，已經是個掌櫃了。酒過三巡，{companion}把一個沉甸甸的匣子推到你面前：「那半年的牢，我欠你一輩子。」',
    choices: [
      {
        id: 'accept',
        text: '收下，兩個人喝到天亮',
        outcome: {
          text: '你們喝到天亮，說起小時候的事，笑得像兩個傻子。',
          effects: [money(100), rel('companion', 10), xinxing(1)],
          recap: { weight: 3, text: '當年替{companion}頂罪的那半年，{companion}記了一輩子。' },
        },
      },
      {
        id: 'decline',
        text: '把匣子推回去：「這酒，比錢好。」',
        outcome: {
          text: '{companion}愣了很久，最後笑著罵了你一句，又叫了一罈酒。',
          effects: [rel('companion', 20), chiv(2), fame(1)],
          recap: { weight: 3, text: '{companion}要還你當年頂罪的情，你只收了一罈酒。' },
        },
      },
    ],
  },
];
