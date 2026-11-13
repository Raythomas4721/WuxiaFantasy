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
  he_yunqi: {
    won: '上回你削了我的纓。今天，我是來還的。',
    lost: '十年還沒到，你就又來了。',
    fled: '上回你走了。我說過，槍不追逃兵。',
  },
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
  traitor_disciple: {
    half: ['師父，這一招你沒教過我吧？'],
    broken: ['你還是比我快……'],
    gloat: ['你老了，師父。'],
    defeat: ['師父……我錯了。'],
  },
  water_fort: {
    half: ['有船衝寨！放箭！'],
    combo: ['攔住那條頭船！'],
    gloat: ['沉了它！'],
    defeat: ['鐵索……鐵索斷了！'],
  },
  he_yunqi: {
    broken: ['好。守軍裡還有會用槍的。'],
    combo: ['這幾下，是韓守義教的？'],
    gloat: ['回去。再練十年。'],
    defeat: ['……這條纓，總算有人削斷了。'],
  },
  garrison: {
    half: ['這夥賊人有章法！'],
    combo: ['頂住！盾牌頂住！'],
    gloat: ['放下兵器，饒你不死！'],
    defeat: ['鳴金！退下山去！'],
  },
  horse_thieves: {
    half: ['這人扎手！'],
    broken: ['我的馬！'],
    gloat: ['靴子留下，人可以走。'],
    defeat: ['撤！風緊！'],
  },
  debt_collectors: {
    half: ['欠債還錢，天經地義！'],
    combo: ['等等……你到底是不是姓賈的？'],
    gloat: ['下個月，連本帶利。'],
    defeat: ['認錯人了，認錯人了！'],
  },
  fake_monks: {
    half: ['施主，你這是造孽！'],
    broken: ['我的木魚！'],
    gloat: ['善哉，善哉。'],
    defeat: ['貧僧……貧僧不幹了！'],
  },
  tomb_robbers: {
    half: ['這人比墓裡的還難纏！'],
    gloat: ['坑是現成的。'],
    defeat: ['東西都給你，別報官！'],
  },
  hired_blades: {
    half: ['雇主沒說你這麼能打。'],
    combo: ['這價錢開低了！'],
    gloat: ['別怪我，拿錢辦事。'],
    defeat: ['定金還你，這單不接了。'],
  },
  young_bravos: {
    half: ['好厲害！再來！'],
    broken: ['師兄，他破了我的招！'],
    gloat: ['前輩……您是不是讓著我們？'],
    defeat: ['受教了！十年後再來討教！'],
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
  zhou_son: {
    half: ['我練了十年，就是為了今天！'],
    gloat: ['疼嗎？我爹也疼。'],
    defeat: ['……你打吧。我爹的腿，也是這樣斷的。'],
  },
  manual_fiend: {
    half: ['好……好！這本書果然沒騙我！'],
    gloat: ['你也想練？可惜，書只有一本。'],
    defeat: ['書上……沒寫……這一招……'],
  },
  flying_thief: {
    half: ['追了我三條街，你屬狗的？'],
    gloat: ['還追？腿都軟了吧。'],
    defeat: ['東西……還你就是了。'],
  },
  tyrant_coach: {
    half: ['哪來的野小子，敢管老爺的事！'],
    gloat: ['在這鎮上，老爺說了算。'],
    defeat: ['我……我只是混口飯吃……'],
  },
  river_pirate: {
    half: ['在水上跟我打？你找錯地方了！'],
    gloat: ['江裡的魚，今晚有得吃了。'],
    defeat: ['船……船給你……'],
  },
  wanted_poisoner: {
    half: ['可惜了，這麼好的身手。'],
    combo: ['急什麼？毒總要慢慢發作的。'],
    gloat: ['覺得手腳發麻了吧？'],
    defeat: ['這筆賞錢……便宜你了。'],
  },
  iron_monk: {
    half: ['好！這一路上，你是第一個。'],
    gloat: ['招牌，貧僧收下了。'],
    defeat: ['阿彌陀佛……貧僧輸得心服。'],
  },
  impostor: {
    half: ['原來真的這麼難打……'],
    gloat: ['江湖上只認名字，不認臉。'],
    defeat: ['我……我只是想活得像你一樣……'],
  },
  old_peer: {
    half: ['哈！你也老了！'],
    broken: ['這一下，還有當年的味道。'],
    gloat: ['服不服老？'],
    defeat: ['好……這一場，我等了一輩子。'],
  },
  deserter_captain: {
    half: ['一個老頭子，也敢擋道？'],
    gloat: ['這村子，今天歸我了。'],
    defeat: ['撤……都撤……'],
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
