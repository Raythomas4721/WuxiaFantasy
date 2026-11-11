import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { choiceViews, newGame, startLife } from '../src/engine/game';
import type { GameState } from '../src/engine/types';

function born(flag?: 'father_dead' | 'mother_dead'): GameState {
  for (let seed = 1; seed < 500; seed++) {
    const s = startLife(newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed, background: 'farmer', region: 'jiangnan' }));
    if (s.current?.eventId !== 'zhuazhou') continue;
    if (flag ? s.flags[flag] : !s.flags.father_dead && !s.flags.mother_dead) return s;
  }
  throw new Error('找不到合適的種子');
}

describe('早逝的雙親不會在童年出現', () => {
  it('母親難產過世：抓週爬回父親懷裡', () => {
    const s = born('mother_dead');
    const none = choiceViews(s).find((c) => c.id === 'none')!;
    expect(none.text).toContain('父親懷裡');
    expect(s.current!.text).not.toContain('母親');
  });

  it('父親生前過世：童年裡由母親照料', () => {
    const s = born('father_dead');
    expect(s.current!.text).not.toContain('父親');
  });

  it('雙親都在：照原本的寫法', () => {
    const s = born();
    expect(choiceViews(s).find((c) => c.id === 'none')!.text).toContain('母親懷裡');
  });
});
