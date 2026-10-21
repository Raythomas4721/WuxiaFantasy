import { CONTENT } from '../content';
import { checkCondition, currentYear } from './conditions';
import { chineseNumber, eraName, fill, renderText } from './text';
import type { EndingResult, GameState } from './types';

const RECAP_COUNT = 4;

/**
 * 結局 = 稱號（優先序最高且條件符合者）+ 志向圓滿／遺憾 + 時代經歷 + 人生回顧。
 * 清單最後一個結局沒有條件，保證一定有結果。
 */
export function computeEnding(s: GameState): EndingResult {
  const sorted = [...CONTENT.endings].sort((a, b) => b.priority - a.priority);
  const def = sorted.find((e) => checkCondition(s, e.conditions)) ?? sorted[sorted.length - 1];

  const amb = s.player.ambition ? CONTENT.ambitions[s.player.ambition] : undefined;
  const ambition = amb
    ? (() => {
        const fulfilled = checkCondition(s, amb.fulfilled);
        return { name: amb.name, fulfilled, text: fill(fulfilled ? amb.fulfilledText : amb.unfulfilledText, s) };
      })()
    : undefined;

  const era = CONTENT.eraLines.find((l) => checkCondition(s, l.if));
  const cause = CONTENT.deathCauses[s.deathCause ?? 'natural'] ?? s.deathCause ?? '';
  const year = currentYear(s);

  const recaps = s.history
    .filter((h) => h.recap)
    .sort((a, b) => (b.recap?.weight ?? 0) - (a.recap?.weight ?? 0) || a.turn - b.turn)
    .slice(0, RECAP_COUNT)
    .sort((a, b) => a.turn - b.turn)
    .map((h) => h.recap?.text ?? '');

  return {
    id: def.id,
    title: def.title,
    text: renderText(def.text, s),
    ambition,
    eraLine: era ? fill(era.text, s) : '',
    deathLine: `${eraName(year)}（${year}），你${cause}，享年${chineseNumber(s.player.age)}歲。`,
    recaps,
  };
}
