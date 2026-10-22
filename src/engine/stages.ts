// 人生階段：每進入一個新階段就是新的一章，也是重新打算方針的時候。

export interface LifeStage {
  from: number;
  name: string;
  /** 進入此階段時，方針畫面的開場白。 */
  opening: string;
}

export const LIFE_STAGES: LifeStage[] = [
  { from: 0, name: '襁褓', opening: '' },
  { from: 7, name: '童年', opening: '七歲了，該懂點事了。' },
  { from: 13, name: '少年', opening: '十三歲。孩子的日子，一轉眼就過去了。' },
  { from: 19, name: '青年', opening: '你已經是個大人了，往後的路得自己走。' },
  { from: 30, name: '壯年', opening: '三十而立。回頭看，已經走了好長一段路。' },
  { from: 50, name: '晚年', opening: '鬢角白了。剩下的日子，你想怎麼過？' },
];

export function stageIndex(age: number): number {
  let i = 0;
  while (i + 1 < LIFE_STAGES.length && age >= LIFE_STAGES[i + 1].from) i++;
  return i;
}

const CHAPTER_NUMBERS = ['一', '二', '三', '四', '五', '六'];

/** 「第三章・少年」 */
export function chapterTitle(index: number): string {
  return `第${CHAPTER_NUMBERS[index] ?? index + 1}章・${LIFE_STAGES[index].name}`;
}
