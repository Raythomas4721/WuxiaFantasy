// 開場引導：情境第一次出現時，在旁邊「指點」一句。每則只出現一次；
// 也可以「不用再提示」全部關掉。看過哪些記在 localStorage（讀寫失敗就當作沒看過）。

import { useState } from 'react';

const KEY = 'jianghu.tips.v1';
const OFF = '__off__';

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    // 存不了就只在這次有效
  }
}

export interface TipDef {
  id: string;
  when: boolean;
  text: string;
}

/** 從一串候選裡，挑第一則情境符合、還沒看過的提示顯示。一次只顯示一則。 */
export function Tips({ tips }: { tips: TipDef[] }) {
  const [seen, setSeen] = useState(readSeen);
  if (seen.has(OFF)) return null;
  const tip = tips.find((t) => t.when && !seen.has(t.id));
  if (!tip) return null;
  const mark = (ids: string[]) => {
    const next = new Set(seen);
    ids.forEach((id) => next.add(id));
    writeSeen(next);
    setSeen(next);
  };
  return (
    <aside className="tip" role="note">
      <span className="tip-label">指點</span>
      <p className="tip-text">{tip.text}</p>
      <span className="tip-actions">
        <button className="btn btn-small" onClick={() => mark([tip.id])}>
          知道了
        </button>
        <button className="tip-off" onClick={() => mark([tip.id, OFF])}>
          不用再提示
        </button>
      </span>
    </aside>
  );
}
