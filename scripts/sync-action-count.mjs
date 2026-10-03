// 把「N+ 个动作」这个数字从代码里的单一事实源同步到所有会写它的地方。
//
// 为什么要生成而不是手写：这个数字出现在 **7 类文件、30 处**（含 18 个语言的
// extDescription 与 18 语言的商店长描述）。每加一个动作都要记得回来改 30 处 ——
// 人一定记不住，实测就已经停在 102 而实际是 103 了。
//
// 用法：
//   node scripts/sync-action-count.mjs           # 写入
//   node scripts/sync-action-count.mjs --check    # 只检查，不一致就退出码 1（给 CI 用）
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const REPO = new URL("..", import.meta.url);

// —— 单一事实源：ACTION_TYPES 的值个数 ——
const bg = readFileSync(new URL("extension/background.js", REPO), "utf8");
const atStart = bg.indexOf("const ACTION_TYPES = {");
const atBlock = bg.slice(atStart, bg.indexOf("\n};", atStart));
const COUNT = [...atBlock.matchAll(/^\s+[A-Z][A-Z0-9_]*:\s*"([a-z][a-z0-9_]*)"/gm)].length;
if (!COUNT) throw new Error("没能从 ACTION_TYPES 数出动作数量");

// —— 单一事实源 2：语言文件的 key 数量（README 里写了「N+ keys each」）——
const enPath = new URL("extension/_locales/en/messages.json", REPO);
const COUNT_KEYS = Object.keys(JSON.parse(readFileSync(enPath, "utf8"))).length;

// 每个语言里「动作」怎么写 —— 只在后面跟着这些词时才替换，避免误伤别的数字。
// ⚠️ 这份词表必须覆盖**每种语言实际用的那个词**，否则那个语言会被静默跳过：
// 实测 tr 写 `işlem`、vi 写 `thao tác`、hi 写 `एक्शन`（都不是下面已有的 eylem / hành động /
// क्रिया），于是这 4 种语言的数字一直停在 102+ 而代码已是 103，`--check` 却报「一致」。
// 泰语还要额外注意语序：`การกระทำ 103+ อย่าง` 里跟在数字后面的是 `อย่าง`，
// 而下面的正则只认「数字在前」，所以 `อย่าง` 也得进表（`การกระทำ` 进表没用）。
const ACTION_WORDS = [
  "actions", "action", "个动作", "个浏览器动作", "項動作", "種動作", "アクション", "동작",
  "acciones", "ações", "azioni", "Aktionen", "действий", "tindakan", "eylem", "hành động",
  "การกระทำ", "รายการ", "akcji", "إجراء", "क्रिया",
  "işlem", "thao tác", "एक्शन", "อย่าง",
];
const KEY_WORDS = ["keys", "条 key", "個 key", "キー", "키", "claves", "chaves", "chiavi", "Schlüssel", "ключ", "kunci", "anahtar", "khóa", "คีย์", "klucz", "مفتاح", "कुंजी"];
const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ACTION_RE = ACTION_WORDS.map(esc).join("|");
const KEY_RE = KEY_WORDS.map(esc).join("|");
// 一个数字后面可能**同时**在窗口内出现动作词和 key 词（例如
// 「103+ 个动作，每种语言 537+ 条 key」）。所以不能用「两个正则各扫一遍」——
// 那样同一个数字会被两边都认领，来回震荡、不幂等（实测踩过）。
// 正确做法：对每个「数字+」，看它后面**最近**的那个计数词属于哪一类，只替换那一次。
const NUM_TAIL_RE = new RegExp(`(\\d+)\\+([^\\n]{0,60})`, "g");

function nearestClass(tail) {
  let best = null;
  for (const [cls, words] of [
    ["action", ACTION_WORDS],
    ["key", KEY_WORDS],
  ]) {
    for (const w of words) {
      const i = tail.indexOf(w);
      if (i >= 0 && (best === null || i < best.i)) best = { i, cls };
    }
  }
  return best && best.cls;
}

const TARGETS = [
  "README.md",
  "README.zh.md",
  "CHROMEWEBSTORE.md",
  "docs/store-listing.md",
  "descriptions.json",
  "package.json",
  ...readdirSync(new URL("extension/_locales", REPO)).map((l) => `extension/_locales/${l}/messages.json`),
];

let changedFiles = 0;
let changedSpots = 0;
const stale = [];

for (const rel of TARGETS) {
  const url = new URL(rel, REPO);
  let text;
  try {
    text = readFileSync(url, "utf8");
  } catch {
    continue;
  }
  let hits = 0;
  const next = text.replace(NUM_TAIL_RE, (full, n, tail) => {
    const cls = nearestClass(tail);
    if (!cls) return full; // 后面没有计数词，不是我们要管的数字
    const value = cls === "action" ? COUNT : COUNT_KEYS;
    if (Number(n) === value) return full;
    hits++;
    stale.push(`${rel} [${cls === "action" ? "动作" : "key"}]: ${n}+ → ${value}+`);
    return `${value}+${tail}`;
  });
  if (hits) {
    changedFiles++;
    changedSpots += hits;
    if (!process.argv.includes("--check")) writeFileSync(url, next, "utf8");
  }
}

if (process.argv.includes("--check")) {
  if (changedSpots) {
    console.error(`❌ 文档里的数字与代码不一致（代码里：${COUNT} 个动作、${COUNT_KEYS} 个 key）：`);
    for (const s of stale) console.error("   " + s);
    console.error("\n跑一次 `node scripts/sync-action-count.mjs` 并把它一起提交。");
    process.exit(1);
  }
  console.log(`✓ ${TARGETS.length} 个文件里的数字都与代码一致（${COUNT} 个动作、${COUNT_KEYS} 个 key）`);
} else {
  console.log(`代码里：${COUNT} 个动作、${COUNT_KEYS} 个 key；更新了 ${changedSpots} 处（${changedFiles} 个文件）`);
  for (const s of stale) console.log("   " + s);
}
