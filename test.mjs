// node --test test.mjs
//
// 这个扩展没有构建步骤，也就没有编译器替你发现问题。这里守的全是「不会报错、
// 只会静默失效」的那一类：动作少注册一处就在下拉框里消失或点了没反应，i18n
// 少一个 key 就把源码里硬编码的中文回退文案端给外语用户看。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (file) => readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
const background = read("extension/background.js");
const options = read("extension/options.js");

// 从具名对象字面量里取出 `NAME: "value"` 这样的成对内容
function objectBlock(source, name) {
  const start = source.indexOf(`const ${name} = {`);
  assert.notEqual(start, -1, `源码里找不到 ${name}`);
  const end = source.indexOf("\n};", start);
  return source.slice(start, end);
}
const actionValues = (source) => new Set([...objectBlock(source, "ACTION_TYPES").matchAll(/^\s+\w+:\s*"(\w+)"/gm)].map((m) => m[1]));
const referencedTypes = (block) => new Set([...block.matchAll(/ACTION_TYPES\.(\w+)/g)].map((m) => m[1]));

test("background 和 options 的 ACTION_TYPES 完全一致", () => {
  // 两边各存一份，漂移了不会报错，只会让某个动作在一侧不存在
  const bg = actionValues(background);
  const opt = actionValues(options);
  assert.deepEqual([...bg].sort(), [...opt].sort());
});

test("每个动作都有显示名、分类和后台处理分支", () => {
  const constants = new Set([...objectBlock(options, "ACTION_TYPES").matchAll(/^\s+(\w+):/gm)].map((m) => m[1]));
  const named = referencedTypes(objectBlock(options, "ACTION_NAMES"));
  const categorized = referencedTypes(objectBlock(options, "ACTION_CATEGORIES"));
  const handled = new Set([...background.matchAll(/case ACTION_TYPES\.(\w+):/g)].map((m) => m[1]));

  const missingName = [...constants].filter((c) => !named.has(c));
  const missingCategory = [...constants].filter((c) => !categorized.has(c));
  const missingHandler = [...constants].filter((c) => !handled.has(c));

  assert.deepEqual(missingName, [], "ACTION_NAMES 缺少条目：动作在界面上会显示成原始 id");
  // 不在任何分类里的动作永远不会出现在下拉框里，等于加了个用不到的功能
  assert.deepEqual(missingCategory, [], "ACTION_CATEGORIES 未收录：动作在下拉框里根本选不到");
  assert.deepEqual(missingHandler, [], "executeAction 没有对应 case：动作能选中但点了没反应");
});

// --- i18n ---

const LOCALES = readdirSync(new URL("./extension/_locales", import.meta.url));
const localeKeys = (locale) => new Set(Object.keys(JSON.parse(read(`extension/_locales/${locale}/messages.json`))));
const EN_KEYS = localeKeys("en");

test("代码里静态引用的 i18n key 都存在于 en", () => {
  const used = new Set();
  for (const file of ["extension/background.js", "extension/options.js", "extension/content.js"]) {
    // 只取字面量 key；模板字符串拼出来的（cmd_execute_chain_${n} 之类）跳过
    for (const m of read(file).matchAll(/\bt\(\s*"([\w.]+)"/g)) used.add(m[1]);
  }
  const missing = [...used].filter((k) => !EN_KEYS.has(k));
  assert.deepEqual(missing, [], "代码用到但 _locales/en 里没有的 key");
});

test("语言目录数量没有意外增减", () => {
  assert.equal(LOCALES.length, 18);
});

// 每种语言单独一条用例，失败时一眼看得出是哪一种
for (const locale of LOCALES) {
  test(`_locales/${locale} 的 key 与 en 齐平`, () => {
    const keys = localeKeys(locale);
    assert.deepEqual([...EN_KEYS].filter((k) => !keys.has(k)), [], `${locale} 缺少的 key（用户会看到源码里的硬编码回退文案）`);
    assert.deepEqual([...keys].filter((k) => !EN_KEYS.has(k)), [], `${locale} 多出的 key（en 没有，多半是拼错或已废弃）`);
  });
}

// --- 版本 ---

test("manifest 与 package.json 版本一致", () => {
  // CI 发布时会拿 tag 去比 manifest；package.json 再和 manifest 对齐，
  // 三者才不会各说各话（商店显示 manifest 的，Release 页显示 tag 的）
  const manifest = JSON.parse(read("extension/manifest.json"));
  const pkg = JSON.parse(read("package.json"));
  assert.equal(manifest.version, pkg.version);
});
