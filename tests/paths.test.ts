import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { levelFromXp } from '../src/engine/conditions';
import { mainSkill } from '../src/engine/duel';
import { applyEffects } from '../src/engine/effects';
import { chooseMainSkill, chooseOption, choiceViews, newGame, startLife } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import type { GameState } from '../src/engine/types';

function resultState(): GameState {
  let s = startLife(newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 7, background: 'farmer', region: 'jiangnan' }));
  while (s.phase !== 'result') s = chooseOption(s, choiceViews(s).find((c) => c.enabled)!.id);
  s.deckTasks = undefined;
  return s;
}

describe('主修', () => {
  it('改主修：觸類旁通追到比原主修低一級，之後習武練新的主修', () => {
    const s = resultState();
    s.player.skills = { changquan: 22, liuyun: 1 }; // 長拳 4 級、流雲步 1 級
    const next = chooseMainSkill(s, 'liuyun');
    expect(mainSkill(next).skill).toBe('liuyun');
    expect(levelFromXp(next.player.skills.liuyun)).toBe(3);
    expect(next.player.mainSkill).toBe('liuyun');
    applyEffects(next, [{ type: 'train', kind: 'martial', xp: 2 }], new Rng(1));
    expect(next.player.skills.changquan).toBe(22);
    expect(next.player.skills.liuyun).toBeGreaterThan(12);
  });

  it('觸類旁通每門只有一次：來回切換不會白拿經驗', () => {
    const s = resultState();
    s.player.skills = { changquan: 22, liuyun: 1, shoucheng: 1 };
    let t = chooseMainSkill(s, 'liuyun');
    t = chooseMainSkill(t, 'changquan');
    const xp = t.player.skills.liuyun;
    t = chooseMainSkill(t, 'liuyun');
    expect(t.player.skills.liuyun).toBe(xp);
  });

  it('還沒入門的武學不能當主修', () => {
    const s = resultState();
    s.player.skills = { changquan: 5 };
    expect(() => chooseMainSkill(s, 'hanjiang')).toThrow();
  });
});

describe('兩難的後果', () => {
  it('收錢打斷周家的腿：多年後周家的兒子會上門，心事裡看得到', () => {
    const s = resultState();
    const e = CONTENT.events.find((x) => x.id === 'dirty_job')!;
    const take = e.choices.find((c) => c.id === 'take')!;
    const out = Array.isArray(take.outcome) ? take.outcome[0] : take.outcome!;
    applyEffects(s, out.effects ?? [], new Rng(1));
    expect(s.flags.broke_zhou).toBe(true);
    expect(s.scheduled.some((x) => x.event === 'zhou_son')).toBe(true);
  });
});
