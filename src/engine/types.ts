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
  /** 之前和這個人（對手的身分 who）交過手；有 last 時，上一次的結果要在其中。 */
  fought?: { who: string; last?: ('win' | 'lose' | 'yield')[] };
  /** 這些排程事件都還在等待中（尚未發生也未過期）。 */
  scheduled?: string[];
  /** 行囊裡有這些信物／沒有這些信物。 */
  items?: string[];
  notItems?: string[];
  /** 擁有這種產業。 */
  property?: PropertyKind;
  /** 家產（現金加上產業的價值）至少這麼多。 */
  minWealth?: number;
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
  /** 認識的人（含兒時玩伴）交情都 +delta。 */
  | { type: 'bonds'; delta: number }
  | { type: 'money' | 'health' | 'fame' | 'chivalry' | 'alignment'; delta: number }
  | { type: 'skill'; skill: string; xp: number }
  /** 改以這門武學為主修（觸類旁通：直接追到比原主修低一級）。 */
  | { type: 'mainSkill'; skill: string }
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
  /** 行囊：得到或失去一件信物。 */
  | { type: 'gainItem' | 'loseItem'; item: string }
  /** 置產：在目前所在地區買下（delta > 0）或失去產業。 */
  | { type: 'property'; kind: PropertyKind; delta: number }
  /** 牌庫：加入一張牌，或用 add 換掉 remove（找不到 remove 時只加入）。 */
  | { type: 'card'; add: string; remove?: string }
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
  /** 條件不足時顯示的原因。 */
  hint?: string;
  /** 選了會怎樣（可以選的時候也顯示），例如擇路的招式預覽、兩難的代價。 */
  note?: string;
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
  /** forced：條件符合就必定發生；normal：依權重抽選；node：方針擲出的關卡（小戰、精英、章末首領）。 */
  kind: 'forced' | 'normal' | 'node';
  /** 關卡事件的等級；首領另外標明是第幾章的章末首領（LIFE_STAGES 的索引）。 */
  node?: { tier: 'minor' | 'elite' | 'boss'; stage?: number };
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
  /** 組合式小戰：觸發時抽地點、對手、開場狀況（content/encounters.ts），放進 vars。 */
  encounter?: boolean;
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
  /** 起手牌庫裡，出身給的那一張牌。 */
  card: string;
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
  /** 起手牌庫裡，先天特質給的那一張牌。 */
  card: string;
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
  /** 每段日子的收穫；寫了 if 的只有條件符合才有（例如出身不同，幫家裡做事學到的不同）。 */
  growth: { effect: GameEffect; chance?: number; if?: Condition }[];
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
  /** 合這個志向的方針（方針卡上標「宜」）。 */
  focuses: string[];
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
export type CardTag = '拳' | '劍' | '槍' | '步' | '針' | '指' | '守' | '藥' | '氣';
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
  /** 打出時花掉的錢（文）。 */
  money?: number;
  /** 打出時自己失去的氣血。 */
  selfHp?: number;
  /** 自己氣血不到一半時，傷害再加。 */
  desperate?: number;
  /** 傷害再加上「目前護體 × 這個數」（守城十八槍：守住了才打）。 */
  dmgFromBlock?: number;
  /** 這回合的護體留到下一回合。 */
  fortify?: boolean;
  /** 伏招用：這一擊傷害減半／完全閃過。 */
  halve?: boolean;
  dodge?: boolean;
  /** 點穴：對手這一回合的招式，每一擊傷害 −N。 */
  seal?: number;
  /** 定身：對手這一回合的招式使不出來（絕技封不住，只減半）。 */
  stun?: boolean;
  /** 解穴：從牌堆裡移除 N 張「傷」「心魔」。 */
  cleanse?: number;
  /** 護住穴道：之後 N 次點穴、下毒無效。 */
  ward?: number;
}

export type Rarity = 'common' | 'uncommon' | 'rare';

export interface CardDef extends CardEffect {
  id: string;
  name: string;
  /** 凡、良、絕（v0.5 §5）；省略是凡。 */
  rarity?: Rarity;
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

/** 前五種人人都會；後四種是對手的特殊招式（v0.5 §6）：吸走內力、越打越狠、回氣、下毒。 */
export type IntentKind = 'attack' | 'combo' | 'guard' | 'charge' | 'feint' | 'drain' | 'enrage' | 'heal' | 'curse';

export interface Intent {
  kind: IntentKind;
  /** attack、combo、feint 的每一擊傷害；guard 的護體；charge 的蓄勢量。 */
  value: number;
  hits?: number;
  /** 首領絕技的名字：蓄勢（charge）時是預告，出手時是那一招本身。 */
  sig?: string;
  /** 蓄勢預告時：下回合絕技每一擊的傷害（不含蓄勢加成）。 */
  next?: number;
}

/** 故人援手：交情夠深的人，首領戰、生死之戰裡出手幫你一次。 */
export interface AllyDef {
  /** 人物 id；companion 是兒時玩伴。 */
  who: string;
  minRelation: number;
  kind: 'strike' | 'guard' | 'heal';
  line: string;
}

/** 首領的招牌絕技：先蓄勢一回合（預告），下一回合打出來。 */
export interface SignatureDef {
  name: string;
  /** 蓄勢時的動作描寫，{foe} 會代換成對手名字。 */
  tell: string;
  /** 每一擊是平常出手的幾倍。 */
  mult: number;
  /** 連擊幾下（不寫就是一下）。 */
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
  /** 首領的招牌絕技。 */
  signature?: SignatureDef;
  /** 同一個人在不同時期的對手（例如疤臉年輕時、當上首領、老了）共用同一個身分，重逢時記得上一次。 */
  who?: string;
  /** 固定等級，或 { relative }：依玩家主修武學等級浮動（比武、宿敵）。 */
  level: number | { relative: number; min?: number; max?: number };
  wuxing: number;
  /** 莽夫多出手、老江湖多虛招又常變招、守將多守勢。 */
  temper: 'brute' | 'veteran' | 'guard';
  /** 生死之戰：沒有回合上限。 */
  lethal?: boolean;
  /** 氣血倍數（精英、生死之戰的對手）。 */
  hpMult?: number;
  /** 特殊招式與權重。 */
  specials?: Partial<Record<'drain' | 'enrage' | 'heal' | 'curse', number>>;
  /** 首領的第二階段：氣血過半時換一套打法，說一句台詞。 */
  phase2?: { line: string; temper?: 'brute' | 'veteran' | 'guard'; traps?: string[]; specials?: Partial<Record<'drain' | 'enrage' | 'heal' | 'curse', number>>; rage?: number };
  /** 符合條件時，對手降一級（打點、信物）。 */
  easierWith?: Condition;
  traps?: string[];
  /** 看不透意圖時顯示的文字。 */
  tells: Record<IntentKind, string>;
}

/** 行囊裡的劇情信物：不能買賣。 */
export interface ItemDef {
  id: string;
  name: string;
  /** 來歷，點開時顯示。 */
  desc: string;
  /** 結局回顧用的一句話；權重越高越優先。 */
  ending: string;
  weight: number;
  /** 帶在身上，過招時的效果（市集買的兵器、護具）。 */
  passive?: { text: string; effect: Omit<Passive, 'names'> };
}

/** 市集的貨物。 */
export interface MarketItemDef {
  id: string;
  name: string;
  price: number;
  desc: string;
  /** 在哪些地區買得到；省略表示各地都有。 */
  regions?: string[];
  /** 一生限買一次。 */
  once?: boolean;
  requires?: Condition;
  effects: GameEffect[];
}

export interface Content {
  cards: Record<string, CardDef>;
  /** 每門武學的招式；前三張是入門時挑選的範圍。 */
  skillCards: Record<string, string[]>;
  /** 武學心得：境界突破時二選一。 */
  talents: TalentDef[];
  /** 獎勵池裡不分門派的奇招。 */
  commonCards: string[];
  /** v0.4 奇遇給的特殊牌，只用來換算舊存檔。 */
  specialCards: { if: Condition; card: string }[];
  opponents: Record<string, OpponentDef>;
  foeTraps: Record<string, FoeTrapDef>;
  items: Record<string, ItemDef>;
  market: MarketItemDef[];
  /** 戰亂毀掉產業：某一年，某地區的產業全沒了。 */
  /** 戰亂毀掉產業；kinds 沒寫就是全部（田地搬不走，有些戰亂只燒得掉鋪面）。 */
  propertyRisks: { year: number; region: string; text: string; kinds?: PropertyKind[] }[];
  backgrounds: Record<string, BackgroundDef>;
  regions: Record<string, RegionDef>;
  traits: Record<string, TraitDef>;
  focuses: FocusDef[];
  /** 方針 → 關卡權重。 */
  nodeWeights: Record<string, Partial<Record<NodeKind, number>>>;
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

/** 心法與信物在過招裡的被動效果（v0.5 §4）。 */
export interface Passive {
  /** 顯示用：效果的來源與說明。 */
  names: string[];
  drawPer?: number;
  handMax?: number;
  blockPerRound?: number;
  firstTag?: { tag: CardTag; dmg: number };
  attackBonus?: number;
  firstRoundEnergy?: number;
  firstRoundDraw?: number;
  bleedBonus?: number;
  healBonus?: number;
  /** 打完回復的健康（濟世心經）。 */
  healAfter?: number;
  /** 這個路數的牌，每一擊傷害 +N。 */
  tagDmg?: Partial<Record<CardTag, number>>;
  /** 守招（guard）的護體 +N。 */
  guardBonus?: number;
  /** 自己的伏招發動時：多抽 N 張、對手失 N 氣血。 */
  trapDraw?: number;
  trapDmg?: number;
  /** 回合結束時保留的護體比例。 */
  retainBlock?: number;
  /** 開場時對手的破綻回合數、內傷。 */
  openExpose?: number;
  bleedStart?: number;
  /** 氣血上限 +N。 */
  maxHp?: number;
  /** 氣血低於一半時，攻擊牌傷害 +N。 */
  desperateBonus?: number;
  /** 前 N 次點穴、下毒無效（心性）。 */
  resist?: number;
  /** 每回合開始回 N 氣血（根骨 10）。 */
  regen?: number;
  /** 點穴多封 N（拂星指心得）。 */
  sealBonus?: number;
  /** 「傷」「心魔」發作不扣氣血（心性 10）。 */
  curseNoHp?: number;
  /** 爆擊率加成（福緣 10），0.05 = 5%。 */
  critBonus?: number;
}

/** 武學心得（v0.5 培育）：某門武學到了某個境界，二選一。 */
export interface TalentDef {
  id: string;
  skill: string;
  level: number;
  name: string;
  text: string;
  effect: Omit<Passive, 'names'>;
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
    /** 每回合的內力（由境界決定）；舊存檔沒有時用 DUEL.energy。 */
    energyMax?: number;
    energyNext: number;
    drawPer: number;
    deck: string[];
    hand: string[];
    discard: string[];
    /** 蓋著的伏招。 */
    traps: string[];
    /** 這場用完移出的牌。 */
    gone?: string[];
    /** 這回合已打出的牌，連招用。 */
    played: string[];
    boost?: { tags: CardTag[]; dmg?: number; mult?: number };
    /** 身上能花的錢、這場已經花掉的錢（錢可通神）。 */
    money?: number;
    spent?: number;
    /** 這場打出過哪些武學的牌，收招時各加一點經驗。 */
    used?: string[];
    /** 手牌上限（長風訣 +1）。 */
    handMax?: number;
    /** 心法與信物帶來的被動效果。 */
    passive?: Passive;
    /** 護體留到下一回合。 */
    fortify?: boolean;
  };
  foe: DuelSide & {
    charge: number;
    /** 越打越狠：每一擊多出的傷害。 */
    rage?: number;
    /** 第二階段已經開始。 */
    phase2?: boolean;
    /** 這場已經喊過的台詞種類。 */
    said?: string[];
    /** 連續出手（攻擊類意圖）的回合數，太多就要換氣。 */
    streak?: number;
    /** 這回合被點了穴：每一擊 −sealed；stunned 是被定住，這一招使不出來。 */
    sealed?: number;
    stunned?: boolean;
    /** 第二階段換過的打法。 */
    temper?: 'brute' | 'veteran' | 'guard';
    /** 絕技：下回合要打出來了；上一次打出絕技是第幾回合。 */
    sig?: { ready: boolean; last: number };
    specials?: Partial<Record<'drain' | 'enrage' | 'heal' | 'curse', number>>;
    intent: Intent;
    traps: { id: string; used: boolean }[];
  };
  /** 這一回合發生的事。 */
  log: DuelLogLine[];
  /** 這場會出手幫你的故人（已經出過手就是 used）。 */
  ally?: { who: string; name: string; kind: AllyDef['kind']; line: string; used?: boolean };
  /** 跟這個人交過手：之前打過幾次、上一次的結果。 */
  rematch?: { times: number; wins: number; last: 'win' | 'lose' | 'yield' };
  /** 對手打中你要害的次數（畫面靠它變化知道是新的一下）。 */
  foeCrit?: number;
  /** 最近一次打中的部位（seq 每次加一，畫面靠它知道是新的一下）。 */
  lastSpot?: { kind: 'crit' | 'wrist' | 'knee'; name: string; seq: number };
  /** 這場的戰報：最重的一擊、氣血最低到哪裡。舊存檔沒有。 */
  stats?: DuelStats;
  over?: 'win' | 'lose' | 'yield';
  /** 觸發這場過招的事件選項。 */
  choiceId: string;
}

export interface DuelStats {
  bestHit: number;
  /** 打中要害的次數。 */
  crits?: number;
  bestCard?: string;
  /** 你的氣血最低到過多少。 */
  lowHp: number;
}

/** 一場過招的紀錄，結局的一生回顧用。 */
export interface DuelRecord {
  turn: number;
  age: number;
  name: string;
  /** 對手 id 和不帶詞條的名字（「黑風寨的寨主」而不是「狡詐的黑風寨的寨主」）。 */
  opponent?: string;
  baseName?: string;
  /** 對手的身分（只有會重逢的人才有）。 */
  who?: string;
  /** 和這個人的第幾次交手。 */
  nth?: number;
  /** 上一次輸了或逃了，這一次打贏。 */
  avenged?: boolean;
  tier?: 'minor' | 'elite' | 'boss';
  lethal: boolean;
  result: 'win' | 'lose' | 'yield';
  rounds: number;
  bestHit: number;
  bestCard?: string;
  /** 打中要害的次數。 */
  crits?: number;
  /** 危急時出手相助的故人。 */
  ally?: string;
  /** 氣血最低時剩幾成（0–1）。 */
  low: number;
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
  /** 自己選的主修武學；習武時練它。沒選時以境界最高的那門為主修。 */
  mainSkill?: string;
  /** 已經觸類旁通過的武學（每門一次）。 */
  caughtUp?: string[];
  /** 江湖名號：成名的地方固定下來；新的一章才可能改口。 */
  epithet?: { name: string; place: string; stage: number };
  alive: boolean;
  /** 跟著你一輩子的牌庫（設計文件 v0.5 §2）。舊存檔沒有，讀檔時從武學等級換算。 */
  deck?: string[];
  /** 選過的武學心得。 */
  talents?: string[];
  /** 行囊裡的信物 id。舊存檔沒有這個欄位。 */
  items?: string[];
  /** 產業：種類與所在地區。 */
  properties?: { kind: PropertyKind; region: string }[];
}

export type PropertyKind = 'land' | 'shop';

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
  /** 這件事之後，江湖上開始（或改口）叫你這個名號。 */
  epithet?: { name: string; prev?: string };
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
  /** 最重要的一件信物的回顧。 */
  keepsake?: string;
  /** 江湖人給的名號。活得太短就沒有。 */
  epithet?: string;
  /** 一生回顧：按章節排的時間軸。 */
  chapters?: LifeChapter[];
  /** 這一生的過招。 */
  feats?: { label: string; value: string }[];
  /** 這一生的人。 */
  people?: { name: string; note: string }[];
}

export interface LifeMoment {
  age: number;
  text: string;
  kind: 'story' | 'duel' | 'death';
  /** 同一件事裡那場過招的戰況。 */
  detail?: string;
}

export interface LifeChapter {
  title: string;
  ages: string;
  moments: LifeMoment[];
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
  /** 遊歷指定的目的地：這段日子該地區的事件與名俠更容易遇到。 */
  travelDest?: string;
  /** 還沒分配的屬性點（每章開場給）。 */
  statPoints?: number;
  /** 已經給過屬性點的最後一章（LIFE_STAGES 的索引）。 */
  pointStage?: number;
  current?: { eventId: string; text: string; vars?: Record<string, string> };
  duel?: DuelState;
  /** 結果畫面之後，同一年接著發生的事件。 */
  chain?: string;
  /** 市集：這一回合已經買了幾樣；一生限買一次的東西。 */
  market?: { turn: number; bought: number };
  boughtOnce?: string[];
  /** 關卡打完之後，同一段日子還有一件劇情事件要發生。 */
  followUp?: boolean;
  /** 這段日子還沒處理的關卡。 */
  nodeQueue?: NodeKind[];
  /** 結果畫面預告的下一段日子：照哪個方針、會遇到什麼關卡。 */
  upcoming?: { focus: string; node: NodeKind };
  /** 已經打過章末首領的章節。 */
  bosses?: number[];
  /** 武館：哪一回合開門、這回合買過牌沒有、一生花錢刪過幾張牌。 */
  dojo?: { turn: number; bought?: boolean };
  dojoRemovals?: number;
  /** 等著玩家處理的牌庫變化：戰後選牌、入門選招、修心刪牌、閉關升級。 */
  deckTasks?: DeckTask[];
  /** 要提醒玩家的事（例如產業毀於戰火），下一次行動後清掉。 */
  notices?: string[];
  result?: TurnResult;
  history: HistoryEntry[];
  snapshot?: Snapshot;
  deathCause?: string;
  ending?: EndingResult;
  /** 打過的每一場過招。 */
  duels?: DuelRecord[];
}

/** 結果畫面上等著處理的牌庫變化，一次處理一件。 */
export type DeckTask =
  /** 從 options 裡挑 picks 張加入牌庫；可以跳過，跳過拿 skipMoney 文。 */
  | { kind: 'pick'; title: string; text: string; options: string[]; picks: number; skipMoney?: number }
  /** 刪一張牌，代價是健康或錢。 */
  | { kind: 'remove'; title: string; text: string; cost?: { health?: number; money?: number } }
  /** 升級一張牌。 */
  | { kind: 'upgrade'; title: string; text: string }
  /** 武學心得二選一。 */
  | { kind: 'talent'; title: string; text: string; options: string[] };

/** 方針擲出的關卡（設計文件 v0.5 §1.2）：小戰、精英、劇情、武館、休養、閉關。 */
export type NodeKind = 'fight' | 'elite' | 'story' | 'market' | 'rest' | 'insight';

export interface ChoiceView {
  id: string;
  text: string;
  enabled: boolean;
  hint?: string;
  note?: string;
  odds?: string;
  /** 這個選項會開始一場過招。 */
  duel?: boolean;
  /** 生死之戰：輸了這一生就結束。 */
  lethal?: boolean;
}
