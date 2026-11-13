import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { newGame } from '../src/engine/game';
import { eventAllowed, getEvent } from '../src/engine/select';
import { focusGains } from '../src/ui/FocusView';
import type { GameEffect, GameState, OutcomeSpec } from '../src/engine/types';

function person(age: number): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'merchant', region: 'jiangnan' });
  s.player.age = age;
  return s;
}

const effectsOf = (spec: OutcomeSpec | undefined): GameEffect[] => (Array.isArray(spec) ? spec : spec ? [spec] : []).flatMap((o) => o.effects ?? []);

describe('第二章的首領', () => {
  it('氣血打了折，第二階段裡沒有誤放的設定', () => {
    for (const id of ['flying_thief', 'town_champion', 'tyrant_coach', 'rival_boss']) {
      const o = CONTENT.opponents[id];
      expect(o.hpMult).toBeLessThan(1);
      expect(o.phase2 && 'hpMult' in o.phase2).toBe(false);
    }
  });
});

describe('做生意', () => {
  const trade = CONTENT.focuses.find((f) => f.id === 'trade')!;

  it('行商跑得越久賺得越多，方針卡上合成一筆', () => {
    const s = person(25);
    expect(focusGains(trade, s)).toContain('錢 +35');
    s.flags.trade_turns = 3;
    expect(focusGains(trade, s)).toContain('錢 +55');
    s.flags.trade_turns = 6;
    s.flags.guild_member = true;
    expect(focusGains(trade, s)).toContain('錢 +95');
    expect(focusGains(trade, s).match(/錢 \+/g)).toHaveLength(1);
  });

  it('田地、鋪面的價錢一生認真做買賣就買得起', () => {
    const price = (id: string) => CONTENT.market.find((m) => m.id === id)!.price;
    expect(price('land')).toBeLessThanOrEqual(150);
    expect(price('shop')).toBeLessThanOrEqual(350);
  });

  it('一船貨：挑了哪條路，就排好那條路的回帳；手上有貨時不再接', () => {
    for (const [choice, ret] of [['salt', 'cargo_salt_return'], ['herbs', 'cargo_herbs_return'], ['silk', 'cargo_silk_return']]) {
      const c = getEvent('trade_cargo').choices.find((x) => x.id === choice)!;
      expect(effectsOf(c.outcome)).toContainEqual(expect.objectContaining({ type: 'schedule', event: ret }));
      // 回帳的每個結果都把貨清掉
      for (const rc of getEvent(ret).choices) {
        for (const o of [rc.outcome, rc.check?.success, rc.check?.failure].filter(Boolean)) {
          expect(effectsOf(o)).toContainEqual(expect.objectContaining({ type: 'flag', value: false }));
        }
      }
    }
    const s = person(25);
    s.focus = 'trade';
    s.flags.trade_turns = 2;
    expect(eventAllowed(s, getEvent('trade_cargo'))).toBe(true);
    s.flags.cargo_herbs = true;
    expect(eventAllowed(s, getEvent('trade_cargo'))).toBe(false);
  });

  it('有錢的人晚年有地方花錢，結局也記得', () => {
    const s = person(55);
    expect(eventAllowed(s, getEvent('late_fortune'))).toBe(false);
    s.player.money = 700;
    expect(eventAllowed(s, getEvent('late_fortune'))).toBe(true);
    const fujia = CONTENT.endings.find((e) => e.id === 'fujia')!;
    const variants = Array.isArray(fujia.text) ? fujia.text : [];
    for (const f of ['built_school', 'built_granary', 'funded_defense_big', 'guild_head']) {
      expect(variants.some((v) => v.if?.flags?.includes(f))).toBe(true);
    }
  });
});
