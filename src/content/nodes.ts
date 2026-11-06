// 方針就是路線（設計文件 v0.5 §1.2）：每段日子先依方針擲一個關卡，再發生劇情事件。
// story 表示這段日子沒有額外的關卡，直接進劇情。數字是相對權重，改了要跑 npm run simulate。

import type { NodeKind } from '../engine/types';

export const nodeWeights: Record<string, Partial<Record<NodeKind, number>>> = {
  // 童年：偶爾跟巷口的孩子打一架，當作教學
  kid_study: { story: 100 },
  kid_play: { fight: 25, story: 75 },
  kid_help: { story: 100 },
  kid_martial: { fight: 45, insight: 15, story: 40 },
  // 十三歲以後
  martial: { fight: 55, elite: 10, insight: 25, story: 10 },
  travel: { fight: 40, elite: 25, market: 15, story: 20 },
  sect: { fight: 45, elite: 10, insight: 30, story: 15 },
  work: { fight: 35, market: 35, story: 30 },
  trade: { fight: 35, elite: 5, market: 45, story: 15 },
  medicine: { fight: 25, rest: 45, story: 30 },
  social: { fight: 40, elite: 10, market: 20, story: 30 },
  study: { fight: 20, insight: 50, story: 30 },
  rest: { fight: 15, rest: 65, story: 20 },
};

export const NODE_INFO: Record<NodeKind, { icon: string; name: string }> = {
  fight: { icon: '⚔', name: '小戰' },
  elite: { icon: '☠', name: '精英' },
  story: { icon: '✎', name: '事' },
  market: { icon: '⚖', name: '武館' },
  rest: { icon: '☕', name: '歇' },
  insight: { icon: '☯', name: '悟' },
};
