import { describe, expect, it } from 'vitest';
import { playLife } from '../src/engine/autoplay';

describe('一生回顧', () => {
  it('每場過招都有紀錄，結局按章節排出時間軸、戰績與名號', () => {
    const { state } = playLife(3, { preferDuel: true });
    const e = state.ending!;
    expect(state.duels!.length).toBeGreaterThan(0);
    expect(state.duels!.every((r) => r.low >= 0 && r.low <= 1)).toBe(true);
    expect(e.chapters!.length).toBeGreaterThan(1);
    // 章節照年紀往下排，每章裡的事也照年紀排
    const ages = e.chapters!.flatMap((c) => c.moments.map((m) => m.age));
    expect([...ages].sort((a, b) => a - b)).toEqual(ages);
    // 最後一件事是終章
    expect(e.chapters!.at(-1)!.moments.at(-1)!.kind).toBe('death');
    expect(e.feats!.some((f) => f.label === '過招')).toBe(true);
    expect(e.epithet).toBeTruthy();
    expect(e.people!.length).toBeGreaterThan(0);
  });
});
