// 快捷键徽章文案（18 种语言）。
//
// 背景：徽章原来按槽位写死「快捷键: Ctrl+Shift+1」，即使用户在
// chrome://extensions/shortcuts 里改过或清空过、或 Chrome 因冲突没分配，
// 界面上照旧显示那个按不出来的组合。改成读 chrome.commands.getAll() 的真实值后：
//   • 有分配 → 「快捷键: <真实值>」（用 {key} 占位）
//   • 有命令但没分配到 → 「未设置快捷键」（明说，不显示假的）
//   • 压根没有对应命令 → 仍显示 omnibox 提示
//
// 同时删掉按槽位猜的 4 个 key：shortcut_badge_default / _slot1 / _slot2 / _slot3
import { readFileSync, writeFileSync } from "node:fs";

const LOCALES = [
  "ar", "de", "en", "es", "fr", "hi", "id", "it",
  "ja", "ko", "pl", "pt_BR", "ru", "th", "tr", "vi",
  "zh_CN", "zh_TW",
];

const TRANSLATIONS = {
  shortcut_badge_withKey: {
    en: "Shortcut: {key}",
    zh_CN: "快捷键: {key}",
    zh_TW: "快速鍵: {key}",
    ja: "ショートカット: {key}",
    ko: "단축키: {key}",
    es: "Atajo: {key}",
    fr: "Raccourci : {key}",
    de: "Tastenkürzel: {key}",
    pt_BR: "Atalho: {key}",
    ru: "Сочетание: {key}",
    it: "Scorciatoia: {key}",
    ar: "اختصار: {key}",
    hi: "शॉर्टकट: {key}",
    id: "Pintasan: {key}",
    tr: "Kısayol: {key}",
    vi: "Phím tắt: {key}",
    th: "คีย์ลัด: {key}",
    pl: "Skrót: {key}",
  },
  shortcut_badge_unset: {
    en: "No shortcut",
    zh_CN: "未设置快捷键",
    zh_TW: "未設定快速鍵",
    ja: "ショートカット未設定",
    ko: "단축키 없음",
    es: "Sin atajo",
    fr: "Aucun raccourci",
    de: "Kein Tastenkürzel",
    pt_BR: "Sem atalho",
    ru: "Нет сочетания",
    it: "Nessuna scorciatoia",
    ar: "لا يوجد اختصار",
    hi: "कोई शॉर्टकट नहीं",
    id: "Tanpa pintasan",
    tr: "Kısayol yok",
    vi: "Chưa đặt phím tắt",
    th: "ยังไม่ได้ตั้งคีย์ลัด",
    pl: "Brak skrótu",
  },
};

const REMOVE = ["shortcut_badge_default", "shortcut_badge_slot1", "shortcut_badge_slot2", "shortcut_badge_slot3"];

let added = 0;
let removed = 0;
for (const locale of LOCALES) {
  const filePath = new URL(`../extension/_locales/${locale}/messages.json`, import.meta.url);
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  for (const [key, translations] of Object.entries(TRANSLATIONS)) {
    const text = translations[locale] || translations.en;
    if (!data[key]) added++;
    data[key] = { ...(data[key] || {}), message: text };
  }
  for (const key of REMOVE) {
    if (key in data) {
      delete data[key];
      removed++;
    }
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
console.log(`${LOCALES.length} 种语言：新增 ${added} 条，删除 ${removed} 条`);
console.log("新增 key：" + Object.keys(TRANSLATIONS).join(", "));
console.log("删除 key：" + REMOVE.join(", "));
