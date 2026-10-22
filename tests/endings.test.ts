import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { playLife } from '../src/engine/autoplay';
import { killPlayer } from '../src/engine/effects';
import { computeEnding } from '../src/engine/ending';
import { newGame, startLife } from '../src/engine/game';

describe('英年早逝', () => {
  it('五十歲前死亡、沒有更優先的結局時，結局是英年早逝，並依死因寫回顧', () => {
    const s = startLife(newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region: 'jiangnan' }));
    s.player.age = 24;
    killPlayer(s, 'illness');
    expect(s.flags.died_of_illness).toBe(true);
    const ending = computeEnding(s);
    expect(ending.id).toBe('zaoshi');
    expect(ending.text).toContain('那場病');
  });

  it('自動遊玩時，早死的人生只會被鐵骨丹心或恩怨未了搶走', () => {
    let zaoshi = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const { state } = playLife(seed);
      if (!state.flags.died_young) continue;
      if (state.ending!.id === 'zaoshi') zaoshi += 1;
      else expect(['tiegu', 'enyuan']).toContain(state.ending!.id);
    }
    expect(zaoshi).toBeGreaterThan(0);
  });
});
