// 結局、志向、時代經歷、死因、江湖傳聞。

import type { AmbitionDef, EndingDef, RumorDef } from '../engine/types';

export const endings: EndingDef[] = [
  {
    id: 'tiegu',
    title: '鐵骨丹心',
    priority: 100,
    conditions: { flags: ['defended_to_end'] },
    hint: '在一座孤城最後的時刻，留在城裡。',
    text: [
      {
        if: { flags: ['dead'], notFlags: ['died_young'] },
        text: '你活過了那座城，卻沒有一天忘記它。晚年每逢城破的那一天，你都會朝北方倒一碗酒。',
      },
      {
        if: { flags: ['died_young'] },
        text: '史書不會記下你的名字。但城南那條巷子裡的人，記了一輩子。',
      },
      { text: '你活過了那座城，卻沒有一天忘記它。' },
    ],
  },
  {
    id: 'enyuan',
    title: '恩怨未了',
    priority: 90,
    conditions: { flags: ['blood_feud'], notFlags: ['revenge_done', 'feud_resolved'] },
    hint: '身負血仇，至死未能了結。',
    text: '門檻上那道血痕，你到死都沒能擦掉。疤臉活得好好的，也許還兒孫滿堂。這一生，你始終欠自己一個交代。',
  },
  {
    id: 'zaoshi',
    title: '英年早逝',
    priority: 80,
    conditions: { flags: ['died_young'] },
    hint: '五十歲之前離開人世。',
    text: [
      { if: { minAge: 0, maxAge: 18 }, text: '你還沒來得及長大。那些想做的事、想見的人，都留在了來不及的地方。' },
      { text: '你走得太早了。江湖還很大，你只走了一小段。' },
    ],
  },
  {
    id: 'zongshi',
    title: '一代宗師',
    priority: 70,
    conditions: { minMartial: 4, flags: ['has_disciple'] },
    hint: '武學出神入化，並且後繼有人。',
    text: '你的武功到了出神入化的地步，更難得的是，你把它傳了下去。很多年後，有人練著你教的招式，卻已經不知道你的名字。你想，這樣也好。',
  },
  {
    id: 'renxin',
    title: '妙手仁心',
    priority: 60,
    conditions: { minSkill: { baicao: 3 }, flagMin: { healed: 3 } },
    hint: '醫術精湛，救人無數。',
    text: '你一生救過的人，自己都數不清了。出殯那天，送行的隊伍從街頭排到了街尾，有人哭著說：「我這條命，是大夫給的。」',
  },
  {
    id: 'daxia',
    title: '江湖大俠',
    priority: 50,
    conditions: { minFame: 40, minChivalry: 35 },
    hint: '名滿江湖，且始終行俠仗義。',
    text: '說書人把你的事蹟編成了好幾段，有真有假。可每一段的結尾都一樣：那人路見不平，從沒有轉身走開過。',
  },
  {
    id: 'yinshi',
    title: '逍遙隱士',
    priority: 40,
    conditions: { flags: ['retired'] },
    hint: '晚年主動歸隱山林。',
    text: '山下的朝代換了，你在山上看了好幾年的雲。偶爾有樵夫路過，問你是誰，你只是笑笑。',
  },
  {
    id: 'pingfan',
    title: '平凡一生',
    priority: 30,
    conditions: { maxMartial: 1, notFlags: ['died_young'] },
    hint: '從未真正踏入江湖，安穩地走完一生。',
    text: '你沒有練成什麼絕世武功，也沒有揚名立萬。你只是在亂世裡好好地活著，吃過的苦、愛過的人，都是真的。',
  },
  {
    id: 'guoke',
    title: '江湖過客',
    priority: 0,
    conditions: {},
    hint: '在江湖裡走過一遭。',
    text: '你在江湖裡走了一遭，不算轟轟烈烈，也不算白活。那些相遇過的人，偶爾還會想起你。',
  },
];

export const ambitions: Record<string, AmbitionDef> = {
  martial: {
    id: 'martial',
    name: '武道至極',
    fulfilled: { minMartial: 4 },
    fulfilledText: '少年時你說要練成天下無敵的武功。這一生，你摸到了那道門檻。',
    unfulfilledText: '少年時你說要練成天下無敵的武功。到老，那句話還掛在心上，像一根拔不掉的刺。',
  },
  chivalry: {
    id: 'chivalry',
    name: '行俠仗義',
    fulfilled: { minChivalry: 35, minFame: 20 },
    fulfilledText: '少年時你說要做個鋤強扶弱的俠客。你做到了，雖然這條路比想像中難走得多。',
    unfulfilledText: '少年時你說要做個鋤強扶弱的俠客。後來，世道把你磨成了另一個人。',
  },
  healer: {
    id: 'healer',
    name: '懸壺濟世',
    fulfilled: { minSkill: { baicao: 3 }, flagMin: { healed: 3 } },
    fulfilledText: '少年時你說要做一個救人的大夫。你做到了。',
    unfulfilledText: '少年時你說要做一個救人的大夫。可這一生，你救過的人，還不如你送走的多。',
  },
  wealth: {
    id: 'wealth',
    name: '富甲一方',
    fulfilled: { minMoney: 500 },
    fulfilledText: '少年時你說要讓家裡再也不愁吃穿。你做到了，家裡的米缸再也沒有空過。',
    unfulfilledText: '少年時你說要賺很多很多錢。亂世裡，錢來得快，去得更快。',
  },
  nation: {
    id: 'nation',
    name: '守護家國',
    fulfilled: { flags: ['defended_city'] },
    fulfilledText: '少年時你說要保家衛國。山河終究沒能守住，但你站上過城頭，沒有後退。',
    unfulfilledText: '少年時你說要保家衛國。可是到最後，你一次也沒有站上城頭。',
  },
  revenge: {
    id: 'revenge',
    name: '報仇雪恨',
    fulfilled: { flags: ['revenge_done'] },
    fulfilledText: '你報了仇。只是報完之後，你才發現，心裡那個洞並沒有填上。',
    unfulfilledText: '你發過誓要報仇。這個誓，你終究沒能兌現。',
  },
  peace: {
    id: 'peace',
    name: '平安一生',
    fulfilled: { notFlags: ['died_young'], minAge: 55 },
    fulfilledText: '你說只想平平安安過一輩子。在這樣的亂世裡，你竟然真的做到了。',
    unfulfilledText: '你說只想平平安安過一輩子。可這世道，連這樣小小的願望都不肯成全。',
  },
};

export const eraLines: { if?: import('../engine/types').Condition; text: string }[] = [
  { if: { flags: ['escorted_civilians'] }, text: '襄陽城破那天，你帶著一群百姓從水門殺了出去。' },
  { if: { flags: ['defended_to_end'] }, text: '襄陽城破那天，你在城南的巷子裡，和鐵槍韓守義站在一起。' },
  { if: { flags: ['surrendered_xiangyang'] }, text: '襄陽城破那天，你跪在路邊，看著敵軍入城。' },
  { if: { flags: ['fled_xiangyang'] }, text: '襄陽被圍的那幾年，你逃出了那座孤城。' },
  { if: { flags: ['joined_resistance'] }, text: '臨安陷落之後，你跟著義軍一路南撤，直到崖山的消息傳來。' },
  { if: { flags: ['diaoyu_defender'] }, text: '開慶元年，你在釣魚城上，等到了蒙古大汗的死訊。' },
  { if: { flags: ['defended_city'] }, text: '宋蒙交戰的那些年，你曾經站上城頭。' },
  { if: { flags: ['stayed_linan'] }, text: '臨安陷落那年，你守著家人，看著城頭換了旗子。' },
  { if: { flags: ['hid_mountain'] }, text: '釣魚城下大汗殞命時，你正帶著家人躲在深山裡。' },
  { if: { flags: ['died_young'] }, text: '你沒能看到這場亂世的結局。' },
  { text: '你這一生，走過了宋蒙交戰的半個世紀，見過太多人來了又走。' },
];

export const deathCauses: Record<string, string> = {
  natural: '壽終正寢',
  illness: '病重不治',
  injury: '傷重不治',
  xiangyang: '戰死於襄陽城南的巷子裡',
};

export const rumors: RumorDef[] = [
  { id: 'r_caizhou', conditions: { minYear: 1233, maxYear: 1234 }, text: '聽說北邊的金國快撐不住了，蒙古人和朝廷的兵聯手圍了蔡州。' },
  { id: 'r_jin_fall', conditions: { minYear: 1234, maxYear: 1235 }, text: '金國亡了。有人說，朝廷要趁機收復中原的故都。' },
  { id: 'r_war_begin', conditions: { minYear: 1235, maxYear: 1238 }, text: '蒙古人翻臉了，說朝廷背盟，大軍分幾路南下。' },
  { id: 'r_plague', conditions: { minYear: 1237, maxYear: 1241, not: { regions: ['shu'] } }, text: '川蜀大疫。聽說有個叫濟世藥谷的地方開谷救人，谷主林鶴年三天三夜沒合眼。' },
  { id: 'r_mengong', conditions: { minYear: 1239, maxYear: 1242 }, text: '聽說孟珙將軍收復了襄陽。' },
  { id: 'r_escort', conditions: { minYear: 1240, maxYear: 1265 }, text: '長風鏢局又接了一趟去川蜀的鏢。鏢頭說，這年頭路上的潰兵比山賊還多。' },
  { id: 'r_shen', conditions: { minYear: 1241, maxYear: 1262 }, text: '江湖上傳說，有個醉醺醺的劍客一劍斬斷了十八個水寇的船槳。' },
  { id: 'r_qingming', conditions: { minYear: 1242, maxYear: 1248 }, text: '青冥山上，各派的年輕人又在比武了。聽說青衡劍府的大弟子奪了魁。' },
  { id: 'r_xueyi', conditions: { minYear: 1251, maxYear: 1254 }, text: '一夜之間，三位掌門遇刺身亡。江湖上的人都在悄悄說三個字：血衣樓。' },
  { id: 'r_han', conditions: { minYear: 1252, maxYear: 1262, not: { regions: ['xiangyang'] } }, text: '襄陽城門口豎起了一面「義」字旗。聽說是個使鐵槍的漢子在招人。' },
  { id: 'r_diaoyu', conditions: { minYear: 1259, maxYear: 1261, not: { regions: ['shu'] } }, text: '蒙古大汗死在了釣魚城下！北邊的大軍都撤了。' },
  { id: 'r_kublai', conditions: { minYear: 1260, maxYear: 1264 }, text: '聽說蒙古那邊換了新大汗，正在北邊和自家兄弟打仗。' },
  { id: 'r_jia', conditions: { minYear: 1264, maxYear: 1268 }, text: '朝廷裡的丞相說邊關太平無事。茶館裡沒有人敢接話。' },
  { id: 'r_siege', conditions: { minYear: 1268, maxYear: 1272, not: { regions: ['xiangyang'] } }, text: '襄陽被圍了。漢水上全是蒙古人的船。' },
  { id: 'r_xy_fall', conditions: { minYear: 1273, maxYear: 1275, not: { regions: ['xiangyang'] } }, text: '襄陽……降了。' },
  { id: 'r_han_dead', conditions: { minYear: 1273, maxYear: 1278 }, text: '聽說那個使鐵槍的韓守義，到死都沒有跪下。' },
  { id: 'r_yangtze', conditions: { minYear: 1275, maxYear: 1276 }, text: '元軍順江而下，沿江的城池一座接一座地失守。' },
  { id: 'r_linan', conditions: { minYear: 1276, maxYear: 1278, not: { regions: ['jiangnan'] } }, text: '臨安降了。有人說，幾位大臣帶著小皇帝逃往了南方的海上。' },
  { id: 'r_yashan', conditions: { minYear: 1279, maxYear: 1281 }, text: '崖山一戰，宋朝亡了。聽說海上漂滿了屍體。' },
  { id: 'r_yuan', conditions: { minYear: 1280, maxYear: 1300 }, text: '改朝換代了。街上的人照舊吃飯、做工、娶親，只是說話小聲了些。' },
  { id: 'r_liao_late', conditions: { minYear: 1281, maxYear: 1295 }, text: '說書的老廖還在講襄陽城的故事，只是不敢再說北邊人的壞話了。' },
  { id: 'r_cave', text: '聽說有人在深山裡見過一面刻滿劍痕的石壁。', weight: 0.5 },
  { id: 'r_baina', text: '百衲會的人說，亂世裡乞丐比官兵還講義氣。', weight: 0.5 },
  { id: 'r_daoist', text: '有個瘋道人到處跟人說，天上的星星亂了。', weight: 0.5 },
  { id: 'r_changfeng', text: '長風鏢局的規矩只有一條：鏢在人在。', weight: 0.5 },
  { id: 'r_lu', conditions: { flags: ['saved_lu'] }, text: '聽說長風鏢局出了個叫陸平的鏢師，走鏢從不失手。', weight: 1.5 },
  { id: 'r_bater', conditions: { flags: ['grassland_pact'], minYear: 1250 }, text: '北邊來的商人說，蒙古軍中有個神箭手，箭羽是白色的。', weight: 1.5 },
];
