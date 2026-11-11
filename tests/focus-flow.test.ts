import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { FATIGUE_STREAK, allocateStat, chooseFocus, chooseOption, choiceViews, newGame, nextTurn, requestFocusChange, startLife } from '../src/engine/game';
import { STAT_POINTS_PER_CHAPTER } from '../src/engine/talents';
import { stageIndex } from '../src/engine/stages';
import { activeThreads, threadFocuses } from '../src/engine/threads';
import type { GameState } from '../src/engine/types';
import { validateContent } from '../src/engine/validate';

/** 一個停在結果畫面的人生，之後再依測試需要改寫狀態。 */
function resultState(): GameState {
  let s = startLife(newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 7, background: 'farmer', region: 'jiangnan' }));
  while (s.phase !== 'result') s = chooseOption(s, choiceViews(s).find((c) => c.enabled)!.id);
  return s;
}

/** 在指定年齡、以指定方針過著日子，處境與選方針時相同。 */
function living(age: number, focus: string, streak = 1): GameState {
  const s = structuredClone(resultState());
  s.player.age = age;
  s.prevYear = s.player.birthYear + age - 1;
  s.focus = focus;
  s.focusStreak = { id: focus, count: streak };
  s.pointStage = stageIndex(age);
  s.focusContext = { stage: stageIndex(age), sect: s.player.sect, region: s.player.region, ambition: s.player.ambition, masters: s.player.masters.length };
  return s;
}

describe('方針延續', () => {
  it('同一階段內沿用原方針，不再詢問', () => {
    const s = nextTurn(living(14, 'study'));
    expect(s.phase).not.toBe('focus');
    expect(s.focus).toBe('study');
    expect(s.focusStreak).toEqual({ id: 'study', count: 2 });
  });

  it('進入新的人生階段時重新打算', () => {
    const s = nextTurn(living(18, 'study'));
    expect(s.player.age).toBe(19);
    expect(s.phase).toBe('focus');
    expect(s.focusPrompt?.reason).toBe('stage');
  });

  it('加入門派之後重新打算', () => {
    const before = living(14, 'study');
    before.player.sect = 'changfeng';
    const s = nextTurn(before);
    expect(s.focusPrompt?.reason).toBe('sect');
  });

  it('原方針不能再選時重新打算', () => {
    const s = nextTurn(living(14, 'sect'));
    expect(s.focusPrompt?.reason).toBe('invalid');
  });

  it(`連續第 ${FATIGUE_STREAK} 次時提醒倦怠，照舊之後不再重複提醒`, () => {
    const s = nextTurn(living(14, 'study', FATIGUE_STREAK - 1));
    expect(s.focusPrompt?.reason).toBe('fatigue');
    const kept = chooseFocus(s, 'study');
    expect(kept.focusStreak?.count).toBe(FATIGUE_STREAK);
    expect(kept.focusPrompt).toBeUndefined();
  });

  it('玩家要求時下一回合重新打算', () => {
    const s = nextTurn(requestFocusChange(living(14, 'study')));
    expect(s.focusPrompt?.reason).toBe('manual');
    expect(s.wantsFocusChange).toBeUndefined();
  });
});

describe('心事', () => {
  it('身負血仇時會出現在心事裡', () => {
    const s = living(25, 'work');
    s.flags.blood_feud = true;
    expect(activeThreads(s).map((t) => t.id)).toContain('feud');
    s.flags.revenge_done = true;
    expect(activeThreads(s).map((t) => t.id)).not.toContain('feud');
  });

  it('可能推進的方針與事件加權規則一致', () => {
    const s = living(20, 'work');
    s.player.birthYear = 1230;
    s.prevYear = 1249;
    s.flags.seek_sword = true;
    const sword = CONTENT.threads.find((t) => t.id === 'seek_sword')!;
    expect(threadFocuses(s, sword)).toEqual(expect.arrayContaining(['travel']));
    // 醉劍會自己找上門（排程事件），選什麼方針都一樣，不標示
    s.flags.shen_wine = 1;
    s.scheduled = [{ event: 'shen_wine_2', due: 1252, expire: 1260 }];
    const shen = CONTENT.threads.find((t) => t.id === 'shen')!;
    expect(threadFocuses(s, shen)).toEqual([]);
  });
});

describe('內容', () => {
  it('通過內容檢查', () => {
    expect(validateContent(CONTENT).errors).toEqual([]);
  });
});

describe('屬性點', () => {
  it('進入新的一章給屬性點，分完才能選方針；同一章不重複給', () => {
    const before = living(18, 'study');
    before.pointStage = stageIndex(18);
    let s = nextTurn(before);
    expect(s.phase).toBe('focus');
    expect(s.statPoints).toBe(STAT_POINTS_PER_CHAPTER);
    expect(() => chooseFocus(s, 'study')).toThrow();
    const gengu = s.player.stats.gengu;
    for (let i = 0; i < STAT_POINTS_PER_CHAPTER; i++) s = allocateStat(s, 'gengu');
    expect(s.player.stats.gengu).toBe(gengu + STAT_POINTS_PER_CHAPTER);
    expect(s.statPoints).toBeUndefined();
    s = chooseFocus(s, 'study');
    expect(s.pointStage).toBe(stageIndex(s.player.age));
  });
});
