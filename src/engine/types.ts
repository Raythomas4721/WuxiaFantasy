// 遊戲引擎的所有型別。內容資料（src/content）只依賴這個檔案的型別。

export type StatName = 'gengu' | 'wuxing' | 'fuyuan' | 'xinxing' | 'danshi' | 'meili';
export type FlagValue = boolean | number | string;

/** 事件、選項、結局共用的條件。所有欄位皆為「且」；any / not 用來組合。 */
export interface Condition {
  minAge?: number;
  maxAge?: number;
  /** 年份條件以「上回合之後到本回合」的時間窗判定，避免大步長跳過史實年份。 */
  minYear?: number;
  maxYear?: number;
  backgrounds?: string[];
  regions?: string[];
  traits?: string[];
  notTraits?: string[];
  /** 全部旗標都必須為真。 */
  flags?: string[];
  /** 任一旗標為真即不符合。 */
  notFlags?: string[];
  flagMin?: Record<string, number>;
  flagMax?: Record<string, number>;
  minStats?: Partial<Record<StatName, number>>;
  maxStats?: Partial<Record<StatName, number>>;
  minFame?: number;
  maxFame?: number;
  minChivalry?: number;
  maxChivalry?: number;
  minAlignment?: number;
  maxAlignment?: number;
  minMoney?: number;
  minHealth?: number;
  maxHealth?: number;
  focus?: string[];
  /** 本回合的方針已連續選了至少這麼多次（含本回合）。 */
  minFocusStreak?: number;
  sects?: string[];
  hasSect?: boolean;
  ambitions?: string[];
  hasAmbition?: boolean;
  minRelation?: Record<string, number>;
  maxRelation?: Record<string, number>;
  /** 該人物今年在玩家所在地區且仍在世。 */
  npcPresent?: string;
  npcAlive?: string[];
  minSkill?: Record<string, number>;
  minMartial?: number;
  maxMartial?: number;
  any?: Condition[];
  not?: Condition;
}

export type TextSpec = string | { if?: Condition; text: string }[];

/**
 * 組合式事件的素材。事件觸發時每個變數隨機抽一個值，可在敘述、選項、結果、回顧中以 {名稱} 引用。
 * 寫成條件清單時，所有條件符合的值會合併成同一個池子。
 */
export type VarSpec = string[] | { if?: Condition; values: string[] }[];

export type GameEffect =
  | { type: 'stat'; stat: StatName; delta: number }
  | { type: 'flag'; key: string; value?: FlagValue }
  | { type: 'addFlag'; key: string; delta: number }
  | { type: 'clearFlag'; key: string }
  | { type: 'relation'; npc: string; delta: number }
  | { type: 'money' | 'health' | 'fame' | 'chivalry' | 'alignment'; delta: number }
  | { type: 'skill'; skill: string; xp: number }
  /** 增加某類武學中目前最熟練那一門的經驗；沒有時使用預設武學。 */
  | { type: 'train'; kind: 'martial' | 'medicine' | 'sect'; xp: number }
  | { type: 'joinSect'; sect: string }
  | { type: 'leaveSect' }
  | { type: 'master'; npc: string }
  /** region 為 'home' 時回到出生地。 */
  | { type: 'region'; region: string }
  | { type: 'ambition'; ambition: string }
  | { type: 'schedule'; event: string; after: [number, number]; expire?: number }
  | { type: 'meet'; npc: string }
  /** 中斷連續方針的計數，例如停下來休息之後。 */
  | { type: 'resetStreak' }
  | { type: 'die'; cause: string };

export interface Recap {
  weight: number;
  text: string;
}

export interface Outcome {
  if?: Condition;
  text: TextSpec;
  effects?: GameEffect[];
  recap?: Recap;
}

/** 單一結果，或依條件挑選第一個符合的結果。 */
export type OutcomeSpec = Outcome | Outcome[];

export interface Check {
  stats: StatName[];
  difficulty: number;
  /** 把武學境界算入勝算。 */
  martial?: boolean;
  skill?: string;
  success: OutcomeSpec;
  failure: OutcomeSpec;
}

export interface GameChoice {
  id: string;
  text: string;
  requires?: Condition;
  /** 條件不符時隱藏，而不是顯示為灰色。 */
  hidden?: boolean;
  hint?: string;
  check?: Check;
  outcome?: OutcomeSpec;
}

export interface GameEvent {
  id: string;
  /** forced：條件符合就必定發生；normal：依權重抽選。 */
  kind: 'forced' | 'normal';
  title: string;
  text: TextSpec;
  conditions?: Condition;
  /** 只能透過排程觸發。 */
  scheduledOnly?: boolean;
  priority?: number;
  weight?: number;
  weightMods?: { if: Condition; mult: number }[];
  repeatable?: boolean;
  cooldown?: number;
  maxTimes?: number;
  tags?: string[];
  rare?: boolean;
  vars?: Record<string, VarSpec>;
  enterEffects?: GameEffect[];
  choices: GameChoice[];
}

// ---------- 世界設定 ----------

export interface BackgroundDef {
  id: string;
  name: string;
  /** 開場敘述用，例如「一戶農家」。 */
  origin: string;
  desc: string;
  statMods: Partial<Record<StatName, number>>;
  money: number;
  /** 隨機投胎時的相對機率，預設 1。 */
  weight?: number;
  effects?: GameEffect[];
}

export interface RegionDef {
  id: string;
  name: string;
  place: string;
  desc: string;
}

export interface TraitDef {
  id: string;
  name: string;
  desc: string;
  effects: GameEffect[];
  /** 達成此結局後才會出現在候選中。 */
  unlockedBy?: string;
}

export interface FocusDef {
  id: string;
  name: string;
  desc: string;
  childhood?: boolean;
  conditions?: Condition;
  tags: string[];
  growth: { effect: GameEffect; chance?: number }[];
  /** 平淡歲月的摘要，從符合條件的句子裡隨機挑一句。 */
  summary: VarSpec;
}

export interface SkillDef {
  id: string;
  name: string;
  kind: 'martial' | 'medicine';
  desc: string;
}

export interface SectDef {
  id: string;
  name: string;
  desc: string;
  skill?: string;
}

export interface NpcDef {
  id: string;
  name: string;
  title?: string;
  desc: string;
  deathYear?: number;
  presence: { from: number; to: number; regions: string[] }[];
  /** 是否列入江湖傳聞錄的名俠圖鑑。 */
  codex: boolean;
}

export interface AmbitionDef {
  id: string;
  name: string;
  fulfilled: Condition;
  fulfilledText: string;
  unfulfilledText: string;
}

export interface EndingDef {
  id: string;
  title: string;
  priority: number;
  conditions: Condition;
  text: TextSpec;
  hint: string;
}

export interface RumorDef {
  id: string;
  conditions?: Condition;
  text: string;
  weight?: number;
}

export interface Content {
  backgrounds: Record<string, BackgroundDef>;
  regions: Record<string, RegionDef>;
  traits: Record<string, TraitDef>;
  focuses: FocusDef[];
  skills: Record<string, SkillDef>;
  sects: Record<string, SectDef>;
  npcs: Record<string, NpcDef>;
  ambitions: Record<string, AmbitionDef>;
  endings: EndingDef[];
  eraLines: { if?: Condition; text: string }[];
  deathCauses: Record<string, string>;
  rumors: RumorDef[];
  events: GameEvent[];
  names: { surnames: string[]; given: string[]; childNames: string[]; rivalGiven: string[]; personalities: string[] };
}

// ---------- 遊戲狀態 ----------

export type Phase = 'intro' | 'focus' | 'event' | 'result' | 'ended';

export interface Player {
  name: string;
  surname: string;
  birthYear: number;
  age: number;
  background: string;
  birthRegion: string;
  region: string;
  trait: string;
  stats: Record<StatName, number>;
  fame: number;
  chivalry: number;
  alignment: number;
  health: number;
  money: number;
  /** 武學 id → 經驗值；境界由經驗值換算。 */
  skills: Record<string, number>;
  sect?: string;
  masters: string[];
  ambition?: string;
  alive: boolean;
}

export interface PersonRef {
  name: string;
  trait: string;
}

export interface HistoryEntry {
  turn: number;
  age: number;
  year: number;
  title: string;
  choice?: string;
  text: string;
  recap?: Recap;
}

export interface TurnResult {
  title: string;
  text: string;
  gains: string[];
  check?: 'success' | 'failure';
  rumor?: string;
}

export interface Snapshot {
  stats: Record<StatName, number>;
  money: number;
  health: number;
  fame: number;
  chivalry: number;
  skillLevels: Record<string, number>;
  sect?: string;
  region: string;
}

export interface EndingResult {
  id: string;
  title: string;
  text: string;
  ambition?: { name: string; fulfilled: boolean; text: string };
  eraLine: string;
  deathLine: string;
  recaps: string[];
}

export interface GameState {
  version: number;
  seed: number;
  rng: number;
  phase: Phase;
  turn: number;
  prevYear: number;
  player: Player;
  family: { siblings: number; fortune: 'stable' | 'decline' | 'rise'; body: 'healthy' | 'weak' | 'illness'; omen: boolean };
  companion: PersonRef;
  rival: PersonRef;
  flags: Record<string, FlagValue>;
  relations: Record<string, number>;
  fired: Record<string, { count: number; lastYear: number }>;
  scheduled: { event: string; due: number; expire: number }[];
  recentTags: string[][];
  shownRumors: string[];
  focus?: string;
  /** 連續選同一方針的次數，用於邊際遞減與倦怠事件。 */
  focusStreak?: { id: string; count: number };
  current?: { eventId: string; text: string; vars?: Record<string, string> };
  result?: TurnResult;
  history: HistoryEntry[];
  snapshot?: Snapshot;
  deathCause?: string;
  ending?: EndingResult;
}

export interface ChoiceView {
  id: string;
  text: string;
  enabled: boolean;
  hint?: string;
  odds?: string;
}
