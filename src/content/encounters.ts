// 組合式小戰（v0.5 小戰的變化）：地點 × 對手 × 開場狀況，各自抽一個拼成一段遭遇。
// 文字刻意寫短：一句地點、一句狀況。開場狀況會影響過招（見 duel.ts 的 openingFx）。

import type { Condition } from '../engine/types';

export interface EncounterPlace {
  /** 這一場的標題（人生紀錄裡看到的名字）。 */
  name: string;
  /** 一句場景，接在開場狀況前面，結尾帶逗號。 */
  scene: string;
  conditions?: Condition;
}

export interface EncounterFoe {
  opponent: string;
  /** 主詞：「幾個蒙著臉的山賊」。 */
  who: string;
  /** 對峙時他們要什麼。 */
  demand: string;
  win: string;
  lose: string;
  /** 不打的選項與結果。 */
  avoid: string;
  avoided: string;
  conditions?: Condition;
}

export type OpeningId = 'standoff' | 'ambush' | 'spotted';

export interface EncounterOpening {
  id: OpeningId;
  weight: number;
  /** {who}、{demand} 會換成對手的字。 */
  text: string;
  fight: string;
  /** 有寫就取代對手的「不打」選項。 */
  avoid?: string;
  avoided?: string;
  /** 過招開場的提示。 */
  duelNote?: string;
}

export const encounterPlaces: EncounterPlace[] = [
  { name: '野渡', scene: '黃昏的渡口，' },
  { name: '茶棚', scene: '官道旁的茶棚外，' },
  { name: '山彎', scene: '山道的轉彎處，' },
  { name: '破廟', scene: '一座沒了香火的破廟前，' },
  { name: '荒村', scene: '荒村的井邊，' },
  { name: '河灘', scene: '下過雨的河灘上，' },
  { name: '驛站', scene: '驛站後頭的馬廄邊，' },
  { name: '亂葬崗', scene: '鎮外的亂葬崗旁，' },
  { name: '石橋', scene: '清晨起霧的石橋上，' },
  { name: '稻田', scene: '剛收割完的稻田邊，' },
  { name: '柴房', scene: '客棧後院的柴房外，' },
  { name: '空街', scene: '集市散了以後的空街上，' },
  { name: '涼亭', scene: '半山腰的涼亭裡，' },
  { name: '河床', scene: '乾了大半年的河床上，' },
  { name: '蘆葦', scene: '野渡邊的蘆葦叢裡，' },
  { name: '城門', scene: '城門剛關上的護城河邊，' },
  { name: '竹林', scene: '竹林深處，', conditions: { regions: ['shu'] } },
  { name: '棧道', scene: '只容一個人過的棧道上，', conditions: { regions: ['shu'] } },
  { name: '壕溝', scene: '襄陽城外的壕溝邊，', conditions: { regions: ['xiangyang'] } },
  { name: '桑林', scene: '採過了葉的桑林裡，', conditions: { regions: ['jiangnan'] } },
];

export const encounterFoes: EncounterFoe[] = [
  {
    opponent: 'bandits',
    who: '幾個蒙著臉的山賊',
    demand: '要你留下買路錢',
    win: '山賊們丟下刀，鑽進林子裡跑了。',
    lose: '你被打倒在地，盤纏被搜走了一些。',
    avoid: '丟下幾個錢',
    avoided: '你丟下幾個錢，他們讓開了路。',
  },
  {
    opponent: 'deserters',
    who: '幾個衣甲不整的潰兵',
    demand: '盯著你的包袱',
    win: '潰兵們一哄而散，連刀都不要了。',
    lose: '你寡不敵眾，包袱被搶走了一半。',
    avoid: '往回走，繞遠路',
    avoided: '你繞了好大一圈，天黑才走到下一個鎮子。',
  },
  {
    opponent: 'thugs',
    who: '幾個地痞',
    demand: '說這條路是他們家的',
    win: '地痞們捂著臉跑了，嘴裡還在罵。',
    lose: '你被推進泥坑裡，滿身狼狽。',
    avoid: '賠個笑臉，低頭走過',
    avoided: '他們笑了一陣，放你過去了。',
  },
  {
    opponent: 'smugglers',
    who: '幾個私鹽販子',
    demand: '怕你看見了不該看的',
    win: '鹽販子們扛起貨就跑，掉了一小袋鹽在地上。',
    lose: '你被推進水裡，嗆了好幾口水才爬上岸。',
    avoid: '說自己什麼都沒看見',
    avoided: '他們搜了你的身，罵了幾句，放你走了。',
    conditions: { minAge: 15 },
  },
  {
    opponent: 'constables',
    who: '兩個巡路的官差',
    demand: '說你像告示上的逃犯，要帶你回衙門',
    win: '官差們追了兩條街，追不上，罵罵咧咧地回去了。',
    lose: '你被鐵鍊鎖了幾天，花了錢才出來。',
    avoid: '塞錢了事',
    avoided: '官差掂了掂錢，揮手讓你過去。',
    conditions: { minAge: 15 },
  },
  {
    opponent: 'robbers',
    who: '一夥專劫行商的賊人',
    demand: '要你把馬和貨都留下',
    win: '賊人們見討不到便宜，吹聲口哨撤了。',
    lose: '你身上值錢的東西全被拿走了。',
    avoid: '扔下包袱就跑',
    avoided: '你扔下包袱，頭也不回地跑了。',
    conditions: { minAge: 16 },
  },
  {
    opponent: 'mongol_scout',
    who: '一個落單的蒙古遊騎',
    demand: '正在找落單的人',
    win: '遊騎撥馬逃走了。附近的村民偷偷給你送來一籃雞蛋。',
    lose: '你中了一箭，躲進草叢裡，一直等到天黑。',
    avoid: '伏低身子，等他過去',
    avoided: '你趴了半天，遊騎終於走了。',
    conditions: { minAge: 15, minYear: 1250, maxYear: 1279, regions: ['xiangyang', 'shu'] },
  },
  {
    opponent: 'horse_thieves',
    who: '一夥馬賊',
    demand: '看上了你腳上那雙靴子',
    win: '馬賊們打了聲唿哨，掉頭跑了，揚起的土嗆了你一臉。',
    lose: '你光著腳走了十里路，才找到賣草鞋的。',
    avoid: '把靴子脫下來扔過去',
    avoided: '領頭的把靴子掛在馬鞍上，笑著走了。',
    conditions: { minAge: 15 },
  },
  {
    opponent: 'debt_collectors',
    who: '賭坊追債的打手',
    demand: '一口咬定你就是欠了三個月賭債的那個人',
    win: '打手們躺了一地。帶頭的這才看清你的臉：「認……認錯人了。」',
    lose: '他們搜走了你身上的錢，走的時候還說下個月再來。',
    avoid: '替那個不認識的人把債還了',
    avoided: '他們數了數錢，在帳本上劃了一筆。你始終不知道自己替誰還了債。',
    conditions: { minAge: 16 },
  },
  {
    opponent: 'fake_monks',
    who: '幾個化緣的假和尚',
    demand: '說你印堂發黑，要你捐香油錢消災',
    win: '假和尚們的木魚滾了一地，裡面掉出來的全是銅錢。',
    lose: '你的「災」消了，錢袋也空了。',
    avoid: '捐幾個錢了事',
    avoided: '他們唸了一句誰也聽不懂的經，心滿意足地走了。',
    conditions: { minAge: 14 },
  },
  {
    opponent: 'tomb_robbers',
    who: '幾個滿身是土的盜墓賊',
    demand: '怕你去報官',
    win: '盜墓賊們丟下鏟子跑了。地上有一隻摔成兩半的陶罐，裡面什麼也沒有。',
    lose: '你被扔進了他們剛挖的那個坑，爬了半個時辰才出來。',
    avoid: '發誓什麼都沒看見',
    avoided: '他們盯了你很久，最後扔給你一枚生了鏽的銅錢，算是封口。',
    conditions: { minAge: 16 },
  },
  {
    opponent: 'hired_blades',
    who: '幾個收了錢的刀手',
    demand: '說有人出錢買你一條腿',
    win: '刀手們丟下定金就跑。你始終沒問出來是誰雇的他們。',
    lose: '你保住了腿，卻瘸著走了一個月。',
    avoid: '出雙倍的價錢，請他們回去',
    avoided: '帶頭的掂了掂錢袋：「你這條腿，比雇主想的值錢。」',
    conditions: { minAge: 20, minFame: 20 },
  },
  {
    opponent: 'young_bravos',
    who: '兩個初出江湖的少年',
    demand: '說聽過你的名號，非要跟你討教幾招',
    win: '兩個少年抱拳認輸，硬塞給你一壺酒，說十年後再來。',
    lose: '你輸給了後生。他們倒比你還不好意思。',
    avoid: '推說身上有傷',
    avoided: '少年們有些失望，還是恭恭敬敬地讓開了路。',
    conditions: { minAge: 28, minFame: 25 },
  },
];

export const encounterOpenings: EncounterOpening[] = [
  {
    id: 'standoff',
    weight: 2,
    text: '{who}攔住了你，{demand}。',
    fight: '動手',
  },
  {
    id: 'ambush',
    weight: 1,
    text: '{who}從暗處撲了出來——你被打了個措手不及！',
    fight: '迎上去',
    avoid: '且戰且退，找機會脫身',
    avoided: '你挨了兩下，總算甩掉了他們。',
    duelNote: '你被打了個措手不及（第一回合內力 −1）。',
  },
  {
    id: 'spotted',
    weight: 1,
    text: '你先一步發現了{who}，他們還沒察覺你。',
    fight: '搶先出手',
    avoid: '悄悄繞過去',
    avoided: '你屏住氣，從旁邊繞了過去，誰也沒驚動。',
    duelNote: '你搶到了先機，對手露出破綻。',
  },
];
