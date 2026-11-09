// 組合式小戰（v0.5 小戰的變化）：地點 × 對手 × 開場狀況，各自抽一個拼成一段遭遇。
// 文字刻意寫短：一句地點、一句狀況。開場狀況會影響過招（見 duel.ts 的 openingFx）。

import type { Condition } from '../engine/types';

export interface EncounterPlace {
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
  { scene: '黃昏的渡口，' },
  { scene: '官道旁的茶棚外，' },
  { scene: '山道的轉彎處，' },
  { scene: '一座沒了香火的破廟前，' },
  { scene: '荒村的井邊，' },
  { scene: '下過雨的河灘上，' },
  { scene: '驛站後頭的馬廄邊，' },
  { scene: '鎮外的亂葬崗旁，' },
  { scene: '竹林深處，', conditions: { regions: ['shu'] } },
  { scene: '襄陽城外的壕溝邊，', conditions: { regions: ['xiangyang'] } },
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
