// 执行进度 HUD 的文案（18 种语言）。
//
// 背景：链在后台跑，用户只知道「有事发生」（徽章一个 ▶），不知道到哪一步。
// 新增页内进度 HUD + 徽章 current/total 后，需要三句状态文案。
import { readFileSync, writeFileSync } from "node:fs";

const LOCALES = [
  "ar", "de", "en", "es", "fr", "hi", "id", "it",
  "ja", "ko", "pl", "pt_BR", "ru", "th", "tr", "vi",
  "zh_CN", "zh_TW",
];

const TRANSLATIONS = {
  progress_starting: {
    en: "Starting…",
    zh_CN: "准备中…",
    zh_TW: "準備中…",
    ja: "開始中…",
    ko: "시작 중…",
    es: "Iniciando…",
    fr: "Démarrage…",
    de: "Startet…",
    pt_BR: "Iniciando…",
    ru: "Запуск…",
    it: "Avvio…",
    ar: "جارٍ البدء…",
    hi: "शुरू हो रहा है…",
    id: "Memulai…",
    tr: "Başlatılıyor…",
    vi: "Đang bắt đầu…",
    th: "กำลังเริ่ม…",
    pl: "Uruchamianie…",
  },
  progress_done: {
    en: "Done",
    zh_CN: "已完成",
    zh_TW: "已完成",
    ja: "完了",
    ko: "완료",
    es: "Hecho",
    fr: "Terminé",
    de: "Fertig",
    pt_BR: "Concluído",
    ru: "Готово",
    it: "Fatto",
    ar: "تم",
    hi: "पूर्ण",
    id: "Selesai",
    tr: "Bitti",
    vi: "Xong",
    th: "เสร็จแล้ว",
    pl: "Gotowe",
  },
  progress_failed: {
    en: "Finished with errors",
    zh_CN: "执行完成，但有错误",
    zh_TW: "執行完成，但有錯誤",
    ja: "完了しましたがエラーがあります",
    ko: "완료했지만 오류가 있습니다",
    es: "Terminado con errores",
    fr: "Terminé avec des erreurs",
    de: "Mit Fehlern beendet",
    pt_BR: "Concluído com erros",
    ru: "Завершено с ошибками",
    it: "Terminato con errori",
    ar: "انتهى مع وجود أخطاء",
    hi: "त्रुटियों के साथ पूर्ण",
    id: "Selesai dengan error",
    tr: "Hatalarla bitti",
    vi: "Hoàn tất nhưng có lỗi",
    th: "เสร็จแล้วแต่มีข้อผิดพลาด",
    pl: "Zakończono z błędami",
  },
};

let added = 0;
for (const locale of LOCALES) {
  const filePath = new URL(`../extension/_locales/${locale}/messages.json`, import.meta.url);
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  for (const [key, translations] of Object.entries(TRANSLATIONS)) {
    const text = translations[locale] || translations.en;
    if (!data[key]) added++;
    data[key] = { ...(data[key] || {}), message: text };
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
console.log(`${LOCALES.length} 种语言已写入：新增 ${added} 条`);
console.log("涉及的 key：" + Object.keys(TRANSLATIONS).join(", "));
