import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { focusAdvice } from '../src/engine/advice';
import { applyEffects } from '../src/engine/effects';
import { focusOptions, newGame } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import type { GameState } from '../src/engine/types';

function adult(): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 5, background: 'farmer', region: 'jiangnan' });
  s.player.age = 20;
  s.player.health = 100;
  s.player.money = 0;
  s.player.stats = { gengu: 5, wuxing: 5, fuyuan: 5, xinxing: 5, danshi: 5, meili: 5 };
  s.relations = {};
  return s;
}

describe('方針卡的「宜」', () => {
  it('身子虛了，宜休養', () => {
    const s = adult();
    s.player.health = 30;
    expect(focusAdvice(s, focusOptions(s)).rest).toContain('健康只剩 30');
  });

  it('立了志向，合志向的方針會標出來', () => {
    const s = adult();
    s.player.ambition = 'wealth';
    expect(focusAdvice(s, focusOptions(s)).work).toContain('富甲一方');
  });

  it('沒錢時，謀生標出還差多少買得起護具', () => {
    const s = adult();
    s.player.money = 50;
    expect(focusAdvice(s, focusOptions(s)).work).toBe('再攢 30 文，就買得起鐵護腕');
  });

  it('玩伴交情快到援手門檻，宜結交', () => {
    const s = adult();
    s.relations.companion = 40;
    expect(focusAdvice(s, focusOptions(s)).social).toContain(s.companion.name);
  });

  it('結交：認識的人交情都會加', () => {
    const s = adult();
    s.flags.met_shen_guzhou = true;
    applyEffects(s, [{ type: 'bonds', delta: 4 }], new Rng(1));
    expect(s.relations.companion).toBe(4);
    expect(s.relations.shen_guzhou).toBe(4);
    expect(s.relations.han_shouyi ?? 0).toBe(0);
  });
});
