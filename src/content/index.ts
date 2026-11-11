// 內容總表。新增事件只需在 events/ 下新增或修改檔案，並在這裡匯入。

import type { Content } from '../engine/types';
import { cards, commonCards, foeTraps, opponents, skillCards, specialCards } from './duel';
import { ambitions, deathCauses, endings, eraLines, rumors } from './endings';
import { items, market, propertyRisks } from './market';
import { adultEvents } from './events/adult';
import { childhoodEvents } from './events/childhood';
import { historyEvents } from './events/history';
import { familyEvents } from './events/family';
import { fortuneEvents } from './events/fortune';
import { jianghuEvents } from './events/jianghu';
import { lunwuEvents } from './events/lunwu';
import { nodeEvents } from './events/nodes';
import { pathEvents } from './events/paths';
import { sectEvents } from './events/sects';
import { nodeWeights } from './nodes';
import { youthEvents } from './events/youth';
import { names } from './names';
import { talents } from './talents';
import { threads } from './threads';
import { backgrounds, focuses, npcs, regions, sects, skills, traits } from './world';

export const CONTENT: Content = {
  cards,
  skillCards,
  talents,
  commonCards,
  specialCards,
  opponents,
  foeTraps,
  items,
  market,
  propertyRisks,
  backgrounds,
  regions,
  traits,
  focuses,
  nodeWeights,
  skills,
  sects,
  npcs,
  ambitions,
  threads,
  endings,
  eraLines,
  deathCauses,
  rumors,
  events: [...childhoodEvents, ...youthEvents, ...adultEvents, ...jianghuEvents, ...lunwuEvents, ...fortuneEvents, ...historyEvents, ...nodeEvents, ...pathEvents, ...sectEvents, ...familyEvents],
  names,
};
