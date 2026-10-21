// 內容總表。新增事件只需在 events/ 下新增或修改檔案，並在這裡匯入。

import type { Content } from '../engine/types';
import { ambitions, deathCauses, endings, eraLines, rumors } from './endings';
import { adultEvents } from './events/adult';
import { childhoodEvents } from './events/childhood';
import { historyEvents } from './events/history';
import { youthEvents } from './events/youth';
import { names } from './names';
import { backgrounds, focuses, npcs, regions, sects, skills, traits } from './world';

export const CONTENT: Content = {
  backgrounds,
  regions,
  traits,
  focuses,
  skills,
  sects,
  npcs,
  ambitions,
  endings,
  eraLines,
  deathCauses,
  rumors,
  events: [...childhoodEvents, ...youthEvents, ...adultEvents, ...historyEvents],
  names,
};
