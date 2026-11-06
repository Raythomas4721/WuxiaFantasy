import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { playLife } from '../src/engine/autoplay';
import { applyEffect, withReputation } from '../src/engine/effects';
import { newGame, startLife } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import type { GameState } from '../src/engine/types';

function fresh(): GameState {
  return startLife(newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 5, background: 'farmer', region: 'jiangnan' }));
}

describe('江湖觀感', () => {
  it('名望和俠義同時上升時，正邪上升俠義的一半', () => {
    const out = withReputation([{ type: 'fame', delta: 4 }, { type: 'chivalry', delta: 5 }]);
    expect(out).toContainEqual({ type: 'alignment', delta: 3 });
  });

  it('已經明寫正邪的結果不另外加', () => {
    const effects = [{ type: 'fame', delta: 4 }, { type: 'chivalry', delta: 5 }, { type: 'alignment', delta: -5 }] as const;
    expect(withReputation([...effects])).toHaveLength(3);
  });

  it('惡名也是名：正邪一次大降 10 以上，名望上升降幅的四分之一', () => {
    expect(withReputation([{ type: 'alignment', delta: -20 }])).toContainEqual({ type: 'fame', delta: 5 });
    expect(withReputation([{ type: 'alignment', delta: -8 }])).toHaveLength(1);
  });
});

describe('正邪規則', () => {
  const rng = new Rng(1);

  it('正邪為負時，正派人物的好感只長一半', () => {
    const s = fresh();
    s.player.alignment = -10;
    applyEffect(s, { type: 'relation', npc: 'lin_henian', delta: 20 }, rng);
    applyEffect(s, { type: 'relation', npc: 'bater', delta: 20 }, rng);
    expect(s.relations.lin_henian).toBe(10);
    expect(s.relations.bater).toBe(20);
  });

  it('壞名聲洗不掉：小善行回升一半，大贖罪照算', () => {
    const s = fresh();
    s.player.alignment = -30;
    applyEffect(s, { type: 'alignment', delta: 10 }, rng);
    expect(s.player.alignment).toBe(-25);
    applyEffect(s, { type: 'alignment', delta: 20 }, rng);
    expect(s.player.alignment).toBe(-5);
  });

  it('惡人性格的人生，正邪明顯比善人低', () => {
    const avg = (persona: 'good' | 'evil') => {
      let sum = 0;
      for (let seed = 1; seed <= 60; seed++) sum += playLife(seed, { persona }).state.player.alignment;
      return sum / 60;
    };
    expect(avg('evil')).toBeLessThan(avg('good') - 20);
  });
});
