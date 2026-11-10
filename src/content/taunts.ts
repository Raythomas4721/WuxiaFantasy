// 對手的台詞：過招中幾個時刻各喊一句（每場每種最多一次）。
// half：氣血剛掉到一半以下（有第二階段的首領用 phase2 的台詞，不用這個）
// broken：護體被你打破　combo：你一回合連出三招　gloat：把你打到剩三成以下　defeat：倒下時
// 沒寫的對手用 GENERIC。

export type TauntKind = 'half' | 'broken' | 'combo' | 'gloat' | 'defeat';

export const GENERIC: Record<TauntKind, string[]> = {
  half: ['有兩下子……', '你這是哪家的功夫？', '再來！'],
  broken: ['好重的手！', '這一下……'],
  combo: ['這麼快？', '讓我喘口氣！'],
  gloat: ['就這點本事？', '趴下吧。'],
  defeat: ['你……你等著……', '算你狠。'],
};

/** 重逢時的開場白，依上一次的結果：won 你贏了他、lost 你輸了、fled 你突圍逃走。 */
export type RematchKind = 'won' | 'lost' | 'fled';

export const GENERIC_REMATCH: Record<RematchKind, string> = {
  won: '上回輸給你，我一直記著。',
  lost: '又是你？上回還沒吃夠苦頭？',
  fled: '上回讓你跑了。這回可沒那麼便宜。',
};

export const REMATCH: Record<string, Record<RematchKind, string>> = {
  scar: {
    won: '上回讓你撿了便宜。今天，連本帶利一起討回來！',
    lost: '還敢來？上回沒要你的命，是老子心軟。',
    fled: '上回讓你跑了。今天，你跑不了。',
  },
  rival: {
    won: '上次是我大意了。這回，我要你輸得心服口服！',
    lost: '怎麼，還沒認清楚？你這輩子都比不上我。',
    fled: '上回你跑得倒快。',
  },
  xie_lingshuang: {
    won: '上一回輸給你，我回去練了很久。',
    lost: '你又來了。這回，別讓我失望。',
    fled: '上次你收手了。這回，別再留情。',
  },
  bater: {
    won: '上一回你贏了。草原上的狼，不會輸兩次。',
    lost: '你還是來了。我本來不想再對你出手。',
    fled: '上回你走了。這一次，長生天不會再放你走。',
  },
  wumian: {
    won: '……你還活著。那就再來一次。',
    lost: '還沒死心？',
    fled: '跑得了一次，跑不了兩次。',
  },
};

export const TAUNTS: Record<string, Partial<Record<TauntKind, string[]>>> = {
  kid_bully: {
    half: ['你、你敢打我？我告訴我娘去！'],
    combo: ['不算不算！你偷襲！'],
    gloat: ['哭啊，哭了就放過你。'],
    defeat: ['嗚……你等著，我叫我哥來！'],
  },
  bandits: {
    half: ['點子扎手！兄弟們一起上！'],
    broken: ['哎喲，這小子手真黑！'],
    gloat: ['識相的把錢留下，饒你一命！'],
    defeat: ['好漢饒命！錢……錢都給你！'],
  },
  deserters: {
    half: ['他娘的，打仗都沒這麼累……'],
    combo: ['這是練家子，撤、撤！'],
    gloat: ['老子在死人堆裡爬出來的，你算什麼！'],
    defeat: ['別打了……我們只是想回家……'],
  },
  thugs: {
    half: ['你知道這條街是誰罩的嗎？'],
    broken: ['哎喲我的娘！'],
    gloat: ['小子，下回走路看清楚！'],
    defeat: ['大俠饒命，小的有眼不識泰山！'],
  },
  smugglers: {
    half: ['快！把他推下水！'],
    combo: ['這人不簡單，貨不要了！'],
    gloat: ['看見了就別想走。'],
    defeat: ['船……快開船！'],
  },
  constables: {
    half: ['大膽！你敢拒捕？'],
    broken: ['反了，反了！'],
    gloat: ['乖乖跟我們回衙門！'],
    defeat: ['你、你給我記住，海捕文書馬上就下來！'],
  },
  robbers: {
    half: ['風緊，扯呼！'],
    combo: ['是個硬點子！'],
    gloat: ['貨留下，人可以走。'],
    defeat: ['今天栽了，山不轉路轉！'],
  },
  mongol_scout: {
    half: ['（他咬著牙，撥轉馬頭想跑）'],
    gloat: ['（他咧嘴一笑，又搭上一支箭）'],
    defeat: ['（他摔下馬，捂著傷口往草叢裡爬）'],
  },
  tourney: {
    half: ['好！台下的看清楚了，這才叫比武！'],
    broken: ['好功夫！'],
    gloat: ['下去吧，小兄弟，再練幾年。'],
    defeat: ['我服了。這一吊錢，你拿得心安。'],
  },
  senior: {
    half: ['師弟，你這陣子沒偷懶。'],
    combo: ['慢點慢點，這是切磋！'],
    gloat: ['下盤又虛了，跟你說過多少次。'],
    defeat: ['哈，長江後浪推前浪啊。'],
  },
  bandit_chief: {
    half: ['好小子，老子好久沒碰到這麼耐打的了！'],
    broken: ['有種！'],
    gloat: ['黑風寨的地頭，也是你能撒野的？'],
    defeat: ['我……我認栽……寨子……散了吧……'],
  },
  xueyi_assassin: {
    half: ['……'],
    gloat: ['樓裡的帳，從來沒有收不回來的。'],
    defeat: ['血衣樓……不會放過你……'],
  },
  mongol_centurion: {
    half: ['南人裡，也有像樣的戰士。'],
    gloat: ['跪下，可以留你一條命。'],
    defeat: ['長生天……在看著……'],
  },
  fallen_swordsman: {
    half: ['想當年，我也是這樣……一劍一劍練出來的。'],
    broken: ['好劍。'],
    gloat: ['江湖就是這樣，今天是你，明天是我。'],
    defeat: ['也好……這把劍，終於可以放下了。'],
  },
  town_champion: {
    half: ['七場了，你是第一個讓我出汗的。'],
    gloat: ['擂台上，沒有僥倖。'],
    defeat: ['擂主……讓給你了。'],
  },
  escort_robber: {
    half: ['鏢局請的人，倒有幾分硬氣。'],
    gloat: ['為了幾兩銀子賣命，值得嗎？'],
    defeat: ['兄弟們……撤……'],
  },
  famous_blade: {
    half: ['十年了，沒人能逼我拔第二刀。'],
    broken: ['好！'],
    gloat: ['名頭是一刀一刀砍出來的，不是喊出來的。'],
    defeat: ['今日一敗……江湖上，又要多一個名字了。'],
  },
  young_challenger: {
    half: ['不……我不會輸的！'],
    gloat: ['老了就該讓路！'],
    defeat: ['我……還會再來的。'],
  },
  lunwu_wanderer: {
    half: ['好，這趟青冥山沒白來！'],
    defeat: ['佩服。後面幾場，你多保重。'],
  },
  jianfu_examiner: {
    half: ['嗯，根基還算扎實。'],
    combo: ['急什麼？劍府的劍，不是這樣使的。'],
    defeat: ['……可以了。'],
  },
};
