import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { chooseOption, choiceViews, finishDuel, newGame, nextTurn } from '../src/engine/game';
import type { GameState } from '../src/engine/types';

/** 某一年、正要面對某個事件的人。 */
function at(year: number, eventId: string, skills: Record<string, number> = { changquan: 12 }): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 11, background: 'farmer', region: 'jiangnan' });
  s.player.age = year - s.player.birthYear;
  s.prevYear = year - 1;
  s.player.skills = skills;
  s.flags = {};
  s.phase = 'event';
  s.current = { eventId, text: '' };
  return s;
}

const win = (s: GameState) => finishDuel({ ...s, duel: { ...s.duel!, over: 'win' } });

describe('青冥論武', () => {
  it('報名之後，預賽、正賽、決賽都在同一年接著打', () => {
    let s = chooseOption(at(1254, 'lunwu'), 'enter');
    const { age } = s.player;
    const turn = s.turn;
    expect(s.chain).toBe('lunwu_prelim');

    s = nextTurn(s);
    expect(s.current?.eventId).toBe('lunwu_prelim');
    expect(s.player.age).toBe(age);
    expect(s.turn).toBe(turn);

    s = nextTurn(win(chooseOption(s, 'fight')));
    expect(s.current?.eventId).toBe('lunwu_main');
    expect(choiceViews(s).map((c) => c.id)).toEqual(['disciple', 'yield']);

    s = nextTurn(win(chooseOption(s, 'disciple')));
    expect(s.current?.eventId).toBe('lunwu_final');
    // 第二屆的決賽對手是謝凌霜
    expect(choiceViews(s).map((c) => c.id)).toEqual(['second', 'yield']);
    s = chooseOption(s, 'second');
    expect(s.duel?.opponent).toBe('xie_lingshuang');

    s = win(s);
    expect(s.flags.lunwu_champion).toBe(true);
    expect(s.chain).toBeUndefined();
    // 打完照常推進時間
    expect(nextTurn(s).player.age).toBeGreaterThan(age);
  });

  it('身邊有宿敵時，正賽的對手是他', () => {
    const s = at(1266, 'lunwu_main');
    s.flags.rival_bully = true;
    expect(choiceViews(s).map((c) => c.id)).toEqual(['rival', 'yield']);
    expect(chooseOption(s, 'rival').duel?.opponent).toBe('rival_lunwu');
  });

  it('沒練過武只能看熱鬧', () => {
    const view = choiceViews(at(1254, 'lunwu', {})).find((c) => c.id === 'enter');
    expect(view?.enabled).toBe(false);
  });

  it('青冥山不會是出生地', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = newGame({ name: '', trait: Object.keys(CONTENT.traits)[0], seed });
      expect(s.player.birthRegion).not.toBe('qingming');
    }
  });
});
