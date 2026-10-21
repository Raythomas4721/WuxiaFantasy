// 數值轉成給玩家看的文字。隱藏軸（名望、俠義、正邪）只顯示描述，不顯示數字。

import type { StatName } from './types';

export const STAT_NAMES: Record<StatName, string> = {
  gengu: '根骨',
  wuxing: '悟性',
  fuyuan: '福緣',
  xinxing: '心性',
  danshi: '膽識',
  meili: '魅力',
};

export const STAT_ORDER: StatName[] = ['gengu', 'wuxing', 'fuyuan', 'xinxing', 'danshi', 'meili'];

export const LEVEL_NAMES = ['不入流', '初窺門徑', '登堂入室', '爐火純青', '出神入化', '返璞歸真'];

export function fameLabel(fame: number): string {
  if (fame < 10) return '默默無聞';
  if (fame < 30) return '小有名氣';
  if (fame < 60) return '名動一方';
  return '天下皆知';
}

export function chivalryLabel(v: number): string {
  if (v <= -20) return '唯利是圖';
  if (v < 5) return '明哲保身';
  if (v < 20) return '心存善念';
  if (v < 40) return '急公好義';
  return '俠骨丹心';
}

export function alignmentLabel(v: number): string {
  if (v <= -40) return '江湖視為邪道';
  if (v < -10) return '亦正亦邪';
  if (v < 20) return '尋常百姓';
  return '正道中人';
}

export function healthLabel(h: number): string {
  if (h >= 80) return '康健';
  if (h >= 55) return '尚可';
  if (h >= 30) return '虛弱';
  return '病重';
}

export function moneyLabel(m: number): string {
  return `${m} 文`;
}
