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
  /** 這些事件都還沒發生過。 */
  notFired?: string[];
  /** 這些排程事件都還在等待中（尚未發生也未過期）。 */
  scheduled?: string[];
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
  /** 同一年接著發生的事件：結果畫面之後不推進時間，直接進入這個事件（論武的預賽、正賽、決賽）。 */
  | { type: 'chain'; event: string }
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
  /** 過招：用招式牌打一場，贏了走 success，輸了或認輸走 failure。 */
  duel?: DuelChoice;
  outcome?: OutcomeSpec;
}

export interface DuelChoice {
  opponent: string;
  success: OutcomeSpec;
  failure: OutcomeSpec;
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
  /** 不會被隨機抽成出生地（例如青冥山）。 */
  noBirth?: boolean;
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
  /** 正派人物：玩家正邪 < 0 時，和他的關係增長減半。 */
  righteous?: boolean;
}

export interface AmbitionDef {
  id: string;
  name: string;
  fulfilled: Condition;
  /** 心事欄顯示的具體目標。 */
  goal: string;
  fulfilledText: string;
  unfulfilledText: string;
}

/** 心事：玩家看得到的進行中劇情線。 */
export interface ThreadDef {
  id: string;
  title: string;
  /** 符合時算進行中。 */
  conditions: Condition;
  text: TextSpec;
  /** 會推進這條線的事件；方針卡的「可能推進」由這些事件的 tags 算出。 */
  advances: string[];
  priority?: number;
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

// ---------- 過招：招式牌（設計文件 §3.11） ----------

/** 招式的路數，連招看的是這個。 */
export type CardTag = '拳' | '劍' | '槍' | '步' | '針' | '守' | '藥' | '氣';
/** attack 攻、guard 守、skill 技、trap 伏招（蓋著，對手做某件事時才發動）、curse 傷與心魔。 */
export type CardKind = 'attack' | 'guard' | 'skill' | 'trap' | 'curse';
export type TrapTrigger = 'foeAttack' | 'foeGuard' | 'foeCharge' | 'foeFeint';

/** 一張牌打出（或伏招發動）時的效果。 */
export interface CardEffect {
  dmg?: number;
  hits?: number;
  block?: number;
  draw?: number;
  energy?: number;
  heal?: number;
  /** 對手破綻：受到的傷害 × 1.5，到下回合結束。 */
  expose?: boolean;
  /** 內傷：對手每回合開始失去氣血，可累加。 */
  bleed?: number;
  /** 對手的內傷加倍。 */
  bleedMult?: number;
  pierce?: boolean;
  /** 打掉對手的護體。 */
  breakGuard?: boolean;
  /** 破除對手一張還沒發動的暗招。 */
  breakTrap?: boolean;
  /** 下一張帶這些路數的牌：傷害加值或倍數。 */
  boostNext?: { tags: CardTag[]; dmg?: number; mult?: number };
  /** 下回合多幾點內力。 */
  energyNext?: number;
  /** 伏招用：這一擊傷害減半／完全閃過。 */
  halve?: boolean;
  dodge?: boolean;
}

export interface CardDef extends CardEffect {
  id: string;
  name: string;
  kind: CardKind;
  tag?: CardTag;
  cost: number;
  /** 用完移出這場過招。 */
  exhaust?: boolean;
  /** 對手意圖相符時的額外傷害（讀招的獎勵）。 */
  vsIntent?: { kinds: IntentKind[]; dmg: number };
  /** 承：這回合上一張牌是這個路數時，再加上的效果。 */
  after?: { tags: CardTag[] } & CardEffect;
  /** 連：這回合每已經打出一張（指定路數的）牌，傷害再加。 */
  chain?: { tags?: CardTag[]; dmg: number };
  /** 伏招的發動條件。 */
  trigger?: TrapTrigger;
  /** 傷與心魔：抽到時立刻發作（失去內力或氣血），然後補抽一張。 */
  onDraw?: { energy?: number; hp?: number };
  /** 一句招式描寫，{foe} 代入對手。 */
  flavor: string;
}

export type IntentKind = 'attack' | 'combo' | 'guard' | 'charge' | 'feint';

export interface Intent {
  kind: IntentKind;
  /** attack、combo、feint 的每一擊傷害；guard 的護體；charge 的蓄勢量。 */
  value: number;
  hits?: number;
}

/** 對手的暗招：玩家做了某件事時發動，每場一次。 */
export interface FoeTrapDef {
  id: string;
  name: string;
  /** thirdAttack：你一回合打出第三張攻擊牌；bigHit：你一招打出 12 以上傷害；lowHp：你氣血跌破一半；tag：你打出某路數的牌。 */
  trigger: 'thirdAttack' | 'bigHit' | 'lowHp' | 'tag';
  tag?: CardTag;
  /** 對你造成傷害、抵銷你那一招的傷害、或讓你失去內力。 */
  dmg?: number;
  absorb?: boolean;
  drain?: number;
  /** 發動時的描寫。 */
  text: string;
  /** 看穿時顯示的條件說明。 */
  hint: string;
}

export interface OpponentDef {
  id: string;
  name: string;
  /** 固定等級，或 { relative }：依玩家主修武學等級浮動（比武、宿敵）。 */
  level: number | { relative: number; min?: number; max?: number };
  wuxing: number;
  /** 莽夫多出手、老江湖多虛招又常變招、守將多守勢。 */
  temper: 'brute' | 'veteran' | 'guard';
  /** 生死之戰：沒有回合上限。 */
  lethal?: boolean;
  traps?: string[];
  /** 看不透意圖時顯示的文字。 */
  tells: Record<IntentKind, string>;
}

export interface Content {
  cards: Record<string, CardDef>;
  /** 每門武學的 A、B、C 三招。 */
  skillCards: Record<string, [string, string, string]>;
  /** 奇遇、指點給的特殊牌。 */
  specialCards: { if: Condition; card: string }[];
  opponents: Record<string, OpponentDef>;
  foeTraps: Record<string, FoeTrapDef>;
  backgrounds: Record<string, BackgroundDef>;
  regions: Record<string, RegionDef>;
  traits: Record<string, TraitDef>;
  focuses: FocusDef[];
  skills: Record<string, SkillDef>;
  sects: Record<string, SectDef>;
  npcs: Record<string, NpcDef>;
  ambitions: Record<string, AmbitionDef>;
  threads: ThreadDef[];
  endings: EndingDef[];
  eraLines: { if?: Condition; text: string }[];
  deathCauses: Record<string, string>;
  rumors: RumorDef[];
  events: GameEvent[];
  names: { surnames: string[]; given: string[]; childNames: string[]; rivalGiven: string[]; personalities: string[] };
}

// ---------- 遊戲狀態 ----------

export type Phase = 'intro' | 'focus' | 'event' | 'duel' | 'result' | 'ended';

export interface DuelSide {
  hp: number;
  max: number;
  block: number;
  /** 破綻剩下的回合數。 */
  exposed: number;
  bleed: number;
}

export interface DuelLogLine {
  who: 'me' | 'foe' | 'sys';
  text: string;
}

/** 進行中的過招。存在 GameState 裡，重新整理也能接著打。 */
export interface DuelState {
  opponent: string;
  name: string;
  level: number;
  lethal: boolean;
  round: number;
  /** 悟性夠高，看得到對手意圖的數字。 */
  clear: boolean;
  /** 悟性遠高於對手，看得穿他的暗招。 */
  seeTraps: boolean;
  me: DuelSide & {
    energy: number;
    energyNext: number;
    drawPer: number;
    deck: string[];
    hand: string[];
    discard: string[];
    /** 蓋著的伏招。 */
    traps: string[];
    /** 這回合已打出的牌，連招用。 */
    played: string[];
    boost?: { tags: CardTag[]; dmg?: number; mult?: number };
  };
  foe: DuelSide & {
    charge: number;
    intent: Intent;
    traps: { id: string; used: boolean }[];
  };
  /** 這一回合發生的事。 */
  log: DuelLogLine[];
  over?: 'win' | 'lose' | 'yield';
  /** 觸發這場過招的事件選項。 */
  choiceId: string;
}

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

export type FocusReason = 'stage' | 'invalid' | 'sect' | 'master' | 'ambition' | 'region' | 'manual' | 'fatigue';

export interface FocusContext {
  stage: number;
  sect?: string;
  region: string;
  ambition?: string;
  masters: number;
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
  /** 選方針當下的處境；之後若有變化（轉折）就要重新打算。 */
  focusContext?: FocusContext;
  /** 本回合為何要重選方針。 */
  focusPrompt?: { reason: FocusReason; text: string };
  /** 玩家在結果畫面要求下回合重新打算。 */
  wantsFocusChange?: boolean;
  current?: { eventId: string; text: string; vars?: Record<string, string> };
  duel?: DuelState;
  /** 結果畫面之後，同一年接著發生的事件。 */
  chain?: string;
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
  /** 這個選項會開始一場過招。 */
  duel?: boolean;
}
