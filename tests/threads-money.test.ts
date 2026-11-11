import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { checkCondition, wealthOf } from '../src/engine/conditions';
import { newGame, nextTurn } from '../src/engine/game';
import { eventAllowed, getEvent } from '../src/engine/select';
import type { GameState } from '../src/engine/types';

function person(region = 'jiangnan'): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 3, background: 'farmer', region });
  s.player.age = 25;
  return s;
}

const choiceEffects = (eventId: string, choiceId: string) => {
  const c = getEvent(eventId).choices.find((x) => x.id === choiceId)!;
  const o = c.outcome ?? c.check?.success;
  return Array.isArray(o) ? o.flatMap((x) => x.effects) : o!.effects;
};

describe('伏筆收得回來', () => {
  it('醉劍：請過酒，他會自己找上門，不必剛好在江南、蜀中', () => {
    expect(choiceEffects('shen_wine_1', 'pay')).toContainEqual(expect.objectContaining({ type: 'schedule', event: 'shen_wine_2' }));
    const s = person('xiangyang');
    s.flags.shen_wine = 1;
    expect(eventAllowed(s, getEvent('shen_wine_2'))).toBe(true);
  });

  it('藥谷再考：人不在蜀中也會動身回去', () => {
    const s = person('xiangyang');
    expect(eventAllowed(s, getEvent('yaogu_retry'))).toBe(true);
  });

  it('立志守國的人，韓守義的募兵會找到他', () => {
    const s = person('jiangnan');
    s.player.ambition = 'nation';
    s.player.age = 1255 - s.player.birthYear;
    expect(eventAllowed(s, getEvent('xiangyang_militia'))).toBe(true);
  });
});

describe('錢生得出錢', () => {
  it('江南的田地撐得過元軍南下，鋪面撐不過', () => {
    let s = person('jiangnan');
    s.player.properties = [{ kind: 'land', region: 'jiangnan' }, { kind: 'shop', region: 'jiangnan' }];
    s.player.age = 1275 - s.player.birthYear;
    s.phase = 'result';
    s = nextTurn(s);
    expect(s.player.properties?.map((x) => x.kind)).toEqual(['land']);
  });

  it('有鋪面才有大主顧，有田才有豐年', () => {
    const s = person();
    expect(eventAllowed(s, getEvent('rich_client'))).toBe(false);
    s.player.properties = [{ kind: 'shop', region: 'jiangnan' }, { kind: 'land', region: 'jiangnan' }];
    expect(eventAllowed(s, getEvent('rich_client'))).toBe(true);
    expect(eventAllowed(s, getEvent('good_harvest'))).toBe(true);
  });

  it('富甲一方的結局與志向同一條線：家產六百文', () => {
    const s = person();
    s.player.money = 600;
    expect(wealthOf(s)).toBe(600);
    expect(checkCondition(s, CONTENT.ambitions.wealth.fulfilled)).toBe(true);
    expect(checkCondition(s, CONTENT.endings.find((e) => e.id === 'fujia')!.conditions)).toBe(true);
  });
});
