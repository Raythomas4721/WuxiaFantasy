// 武學心得：每門武學到了登堂入室（2）、爐火純青（3）、出神入化（4），各二選一。
// 選了就永久生效，在過招裡跟心法、信物一起列出來。數值改了要跑 npm run simulate。

import type { Passive, TalentDef } from '../engine/types';

type Effect = Omit<Passive, 'names'>;

function pair(skill: string, level: number, a: [string, string, string, Effect], b: [string, string, string, Effect]): TalentDef[] {
  return [a, b].map(([id, name, text, effect]) => ({ id, skill, level, name, text, effect }));
}

export const talents: TalentDef[] = [
  // 長拳：拳越連越重
  ...pair('changquan', 2,
    ['cq_jin', '拳勁', '〈拳〉每一擊傷害 +2', { tagDmg: { 拳: 2 } }],
    ['cq_ma', '紮穩馬步', '每回合開始護體 4', { blockPerRound: 4 }]),
  ...pair('changquan', 3,
    ['cq_gu', '一鼓作氣', '第一回合內力 +1、多抽 1 張', { firstRoundEnergy: 1, firstRoundDraw: 1 }],
    ['cq_ying', '硬橋硬馬', '氣血上限 +10', { maxHp: 10 }]),
  ...pair('changquan', 4,
    ['cq_dao', '拳拳到肉', '攻擊牌傷害 +3', { attackBonus: 3 }],
    ['cq_mian', '連綿不絕', '每回合多抽 1 張', { drawPer: 1 }]),

  // 寒江劍法：讀對手、伏招
  ...pair('hanjiang', 2,
    ['hj_qing', '劍走輕靈', '〈劍〉每一擊傷害 +2', { tagDmg: { 劍: 2 } }],
    ['hj_jing', '靜水', '自己的伏招發動時，多抽 1 張', { trapDraw: 1 }]),
  ...pair('hanjiang', 3,
    ['hj_ying', '寒江照影', '自己的伏招發動時，對手失 6 氣血', { trapDmg: 6 }],
    ['hj_xian', '先機', '開場時對手露出破綻 2 回合', { openExpose: 2 }]),
  ...pair('hanjiang', 4,
    ['hj_zhou', '孤舟', '每回合第一張〈劍〉傷害 +6', { firstTag: { tag: '劍', dmg: 6 } }],
    ['hj_shan', '千山', '手牌上限 +2、每回合多抽 1 張', { handMax: 2, drawPer: 1 }]),

  // 守城十八槍：先守後打
  ...pair('shoucheng', 2,
    ['sc_shi', '槍勢', '〈槍〉每一擊傷害 +2', { tagDmg: { 槍: 2 } }],
    ['sc_lei', '壁壘', '守招的護體 +3', { guardBonus: 3 }]),
  ...pair('shoucheng', 3,
    ['sc_jian', '城堅', '回合結束時保留一半護體', { retainBlock: 0.5 }],
    ['sc_bing', '長兵', '每回合開始護體 5', { blockPerRound: 5 }]),
  ...pair('shoucheng', 4,
    ['sc_shan', '不動如山', '氣血上限 +15、每回合開始護體 3', { maxHp: 15, blockPerRound: 3 }],
    ['sc_huima', '回馬', '自己的伏招發動時，對手失 8 氣血', { trapDmg: 8 }]),

  // 流雲步：快、多抽
  ...pair('liuyun', 2,
    ['ly_qing', '身輕', '每回合多抽 1 張', { drawPer: 1 }],
    ['ly_bu', '步法', '守招的護體 +3', { guardBonus: 3 }]),
  ...pair('liuyun', 3,
    ['ly_qiang', '搶先', '第一回合內力 +2', { firstRoundEnergy: 2 }],
    ['ly_you', '雲遊', '自己的伏招發動時，多抽 2 張', { trapDraw: 2 }]),
  ...pair('liuyun', 4,
    ['ly_kong', '凌空', '攻擊牌傷害 +2、每回合多抽 1 張', { attackBonus: 2, drawPer: 1 }],
    ['ly_hu', '飄忽', '開場時對手露出破綻 3 回合', { openExpose: 3 }]),

  // 市井十三拳：耐打、拼命
  ...pair('shijing', 2,
    ['sj_lan', '下三濫', '〈拳〉每一擊傷害 +2', { tagDmg: { 拳: 2 } }],
    ['sj_pi', '皮粗肉厚', '氣血上限 +10', { maxHp: 10 }]),
  ...pair('shijing', 3,
    ['sj_ming', '搏命', '氣血低於一半時，攻擊牌傷害 +4', { desperateBonus: 4 }],
    ['sj_po', '撒潑', '開場時對手露出破綻 2 回合', { openExpose: 2 }]),
  ...pair('shijing', 4,
    ['sj_si', '打不死', '氣血上限 +20', { maxHp: 20 }],
    ['sj_gun', '滾地', '每回合第一張〈拳〉傷害 +6', { firstTag: { tag: '拳', dmg: 6 } }]),

  // 石壁殘劍：重劍、穿透
  ...pair('shibi', 2,
    ['sb_yi', '劍意', '〈劍〉每一擊傷害 +2', { tagDmg: { 劍: 2 } }],
    ['sb_bi', '面壁', '第一回合多抽 2 張', { firstRoundDraw: 2 }]),
  ...pair('shibi', 3,
    ['sb_can', '殘意', '攻擊牌傷害 +2', { attackBonus: 2 }],
    ['sb_shui', '心如止水', '每回合開始護體 4', { blockPerRound: 4 }]),
  ...pair('shibi', 4,
    ['sb_kai', '開山', '每回合第一張〈劍〉傷害 +8', { firstTag: { tag: '劍', dmg: 8 } }],
    ['sb_ming', '劍心通明', '每回合多抽 1 張、第一回合內力 +1', { drawPer: 1, firstRoundEnergy: 1 }]),

  // 青衡十三式：一式接一式
  ...pair('qinghen', 2,
    ['qh_cheng', '起承', '〈劍〉每一擊傷害 +2', { tagDmg: { 劍: 2 } }],
    ['qh_shou', '守中', '守招的護體 +3', { guardBonus: 3 }]),
  ...pair('qinghen', 3,
    ['qh_zhuan', '轉合', '每回合第一張〈劍〉傷害 +5', { firstTag: { tag: '劍', dmg: 5 } }],
    ['qh_yi', '寒衣', '自己的伏招發動時，對手失 6 氣血', { trapDmg: 6 }]),
  ...pair('qinghen', 4,
    ['qh_shisan', '十三式', '〈劍〉每一擊傷害 +4', { tagDmg: { 劍: 4 } }],
    ['qh_zong', '劍府正宗', '每回合多抽 1 張、手牌上限 +1', { drawPer: 1, handMax: 1 }]),

  // 夜雨針：內傷
  ...pair('yeyu', 2,
    ['yy_du', '淬毒', '內傷 +1', { bleedBonus: 1 }],
    ['yy_an', '暗器', '〈針〉每一擊傷害 +2', { tagDmg: { 針: 2 } }]),
  ...pair('yeyu', 3,
    ['yy_xue', '封穴', '開場時對手就帶著 3 點內傷', { bleedStart: 3 }],
    ['yy_sheng', '無聲', '自己的伏招發動時，多抽 1 張、對手失 4 氣血', { trapDraw: 1, trapDmg: 4 }]),
  ...pair('yeyu', 4,
    ['yy_yu', '夜雨', '內傷 +2', { bleedBonus: 2 }],
    ['yy_qian', '千針', '〈針〉每一擊傷害 +3、每回合多抽 1 張', { tagDmg: { 針: 3 }, drawPer: 1 }]),

  // 洗塵功：打不倒
  ...pair('xichen', 2,
    ['xc_gu', '筋骨', '氣血上限 +10', { maxHp: 10 }],
    ['xc_xi', '調息', '每回合開始回 2 氣血', { regen: 2 }]),
  ...pair('xichen', 3,
    ['xc_ding', '入定', '每回合開始護體 4', { blockPerRound: 4 }],
    ['xc_shui', '心如止水', '前兩次點穴、下毒無效；回復的氣血 +2', { resist: 2, healBonus: 2 }]),
  ...pair('xichen', 4,
    ['xc_chen', '不染塵', '回合結束時保留一半護體；打完多回復 6 點健康', { retainBlock: 0.5, healAfter: 6 }],
    ['xc_zhong', '暮鼓晨鐘', '〈氣〉每一擊傷害 +3、每回合多抽 1 張', { tagDmg: { 氣: 3 }, drawPer: 1 }]),

  // 渡江篙：借力
  ...pair('dujiang', 2,
    ['dj_li', '借力', '自己的伏招發動時，對手失 5 氣血', { trapDmg: 5 }],
    ['dj_wen', '船頭站得穩', '守招的護體 +3', { guardBonus: 3 }]),
  ...pair('dujiang', 3,
    ['dj_kuai', '快篙', '第一回合內力 +1、多抽 1 張', { firstRoundEnergy: 1, firstRoundDraw: 1 }],
    ['dj_shui', '識水性', '開場時對手露出破綻 2 回合', { openExpose: 2 }]),
  ...pair('dujiang', 4,
    ['dj_lang', '逐浪', '每回合多抽 1 張、手牌上限 +1', { drawPer: 1, handMax: 1 }],
    ['dj_zhong', '篙重千鈞', '〈槍〉每一擊傷害 +3', { tagDmg: { 槍: 3 } }]),

  // 拂星指：封住對手的招，自己不怕點穴
  ...pair('fuxing', 2,
    ['fx_li', '指力', '〈指〉每一擊傷害 +2', { tagDmg: { 指: 2 } }],
    ['fx_hu', '護穴', '前兩次點穴、下毒無效', { resist: 2 }]),
  ...pair('fuxing', 3,
    ['fx_shen', '認穴', '點穴多封 2', { sealBonus: 2 }],
    ['fx_kan', '看穴', '開場時對手露出破綻 2 回合', { openExpose: 2 }]),
  ...pair('fuxing', 4,
    ['fx_xing', '星落', '每回合第一張〈指〉傷害 +6', { firstTag: { tag: '指', dmg: 6 } }],
    ['fx_yi', '醫者', '每回合開始護體 4、回復的氣血 +3', { blockPerRound: 4, healBonus: 3 }]),
];
