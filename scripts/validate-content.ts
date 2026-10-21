// npm run validate — 檢查內容資料。

import { CONTENT } from '../src/content';
import { validateContent } from '../src/engine/validate';

const { errors, warnings } = validateContent(CONTENT);

for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✗ ${e}`);

console.log(`\n事件 ${CONTENT.events.length} 個、結局 ${CONTENT.endings.length} 種、傳聞 ${CONTENT.rumors.length} 則`);
if (errors.length > 0) {
  console.log(`內容檢查失敗：${errors.length} 個錯誤`);
  process.exit(1);
}
console.log('內容檢查通過');
