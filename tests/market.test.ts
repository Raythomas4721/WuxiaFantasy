import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';
import { MARKET } from '../src/content/market';
import { wealthOf } from '../src/engine/conditions';
import { createDuel, fighterFor } from '../src/engine/duel';
import { computeEnding } from '../src/engine/ending';
import { chooseFocus, chooseOption, choiceViews, focusOptions, newGame, nextTurn } from '../src/engine/game';
import { buy, marketOffers } from '../src/engine/market';
import { Rng } from '../src/engine/rng';
import type { GameState } from '../src/engine/types';

/** 停在回合結果畫面、身上有錢的成年人。 */
function shopper(region = 'jiangnan', money = 1000, year = 1250): GameState {
  const s = newGame({ name: '測試', trait: Object.keys(CONTENT.traits)[0], seed: 5, background: 'merchant', region });
  s.player.age = year - s.player.birthYear;
  s.prevYear = year - 1;
  s.player.money = money;
  s.player.health = 100;
  s.flags = {};
  s.turn = 10;
  s.phase = 'result';
  s.result = { title: '測試', text: '', gains: [] };
  s.focus = 'work';
  s.focusStreak = { id: 'work', count: 1 };
  s.focusContext = { stage: 3, region, masters: 0 };
  return s;
}

describe('市集', () => {
  it('各地賣的東西不同', () => {
    const jiangnan = marketOffers(shopper('jiangnan')).map((o) => o.id);
    const shu = marketOffers(shopper('shu')).map((o) => o.id);
    expect(jiangnan).toEqual(expect.arrayContaining(['tonic', 'land', 'shop', 'manual_liuyun']));
    expect(shu).toContain('land');
    expect(shu).not.toContain('shop');
  });

  it('每回合最多買兩樣，秘笈一生只能買一次', () => {
    let s = buy(shopper(), 'manual_liuyun');
    expect(s.player.money).toBe(1000 - 120);
    expect(s.player.skills.liuyun).toBe(3);
    s = buy(s, 'tonic');
    expect(marketOffers(s).every((o) => !o.enabled)).toBe(true);
    s = { ...s, turn: s.turn + 1 };
    expect(marketOffers(s).find((o) => o.id === 'manual_liuyun')?.reason).toBe('已經買過了');
    expect(marketOffers(s).find((o) => o.id === 'tonic')?.enabled).toBe(true);
  });

  it('錢不夠就買不了', () => {
    const offer = marketOffers(shopper('jiangnan', 50)).find((o) => o.id === 'land');
    expect(offer?.enabled).toBe(false);
    expect(offer?.reason).toBe('錢不夠');
  });

  it('贈禮給在附近的名俠', () => {
    const s = shopper('shu');
    s.flags.met_lin_henian = true;
    s.relations.lin_henian = 10;
    const after = buy(s, 'gift:lin_henian');
    expect(after.relations.lin_henian).toBe(10 + MARKET.giftRelation);
  });
});

describe('置產', () => {
  it('每回合有收入，算在這一回合的收穫裡', () => {
    const s = buy(shopper(), 'shop');
    expect(s.player.properties).toEqual([{ kind: 'shop', region: 'jiangnan' }]);
    const next = nextTurn(s);
    expect(next.player.money).toBeGreaterThanOrEqual(s.player.money + MARKET.income.shop);
  });

  it('襄陽城破時，襄陽的產業毀於戰火', () => {
    const s = shopper('xiangyang', 1000, 1272);
    s.player.properties = [{ kind: 'shop', region: 'xiangyang' }, { kind: 'land', region: 'jiangnan' }];
    const next = nextTurn(s);
    expect(next.player.properties).toEqual([{ kind: 'land', region: 'jiangnan' }]);
    expect(next.notices?.[0]).toContain('襄陽');
  });

  it('家產算進產業的價值', () => {
    const s = shopper('jiangnan', 100);
    s.player.properties = [{ kind: 'shop', region: 'jiangnan' }];
    expect(wealthOf(s)).toBe(600);
  });
});

describe('打聽消息與打點', () => {
  it('打聽過消息，下一回合必定聽到名俠的行蹤', () => {
    let s = nextTurn(buy(shopper('shu'), 'inquire'));
    for (let i = 0; i < 10 && s.phase !== 'result'; i++) {
      if (s.phase === 'focus') s = chooseFocus(s, focusOptions(s)[0].id);
      else if (s.phase === 'event') s = chooseOption(s, choiceViews(s).find((c) => c.enabled && !c.duel)!.id);
    }
    expect(s.phase).toBe('result');
    expect(s.result?.rumor).toContain('打聽到');
    expect(s.flags.inquire).toBeUndefined();
  });

  it('打點過門路，劍府考官降一級', () => {
    const s = shopper('qingming');
    s.player.skills = { changquan: 12 };
    const plain = createDuel(fighterFor(s), 'jianfu_examiner', 'x', new Rng(1), s).level;
    s.flags.connections = true;
    expect(createDuel(fighterFor(s), 'jianfu_examiner', 'x', new Rng(1), s).level).toBe(plain - 1);
  });
});

describe('行囊', () => {
  it('帶著白翎箭，戰場重逢時可以讓巴特爾認出你', () => {
    const s = shopper('xiangyang', 100, 1268);
    s.phase = 'event';
    s.current = { eventId: 'bater_battlefield', text: '' };
    s.flags.grassland_pact = true;
    expect(choiceViews(s).map((c) => c.id)).not.toContain('arrow');
    s.player.items = ['bailing'];
    expect(choiceViews(s).map((c) => c.id)).toContain('arrow');
  });

  it('結局回顧寫進最重要的一件信物', () => {
    const s = shopper();
    s.player.items = ['lunwu_token', 'bailing'];
    expect(computeEnding(s).keepsake).toBe(CONTENT.items.bailing.ending);
  });
});
