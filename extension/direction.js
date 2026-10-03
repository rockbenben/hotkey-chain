// Text direction, shared by the extension's own pages.
//
// The options page mirrored RTL locales but the side panel never did, so the
// same Arabic strings laid out left-to-right in one surface and right-to-left
// in the other. One definition so the two cannot drift.
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

function applyTextDirection(locale) {
  let lang = locale;
  if (!lang || lang === "auto") {
    try {
      lang = chrome.i18n.getUILanguage() || "en";
    } catch {
      lang = "en";
    }
  }
  const base = String(lang).toLowerCase().split(/[-_]/)[0];
  document.documentElement.setAttribute("dir", RTL_LOCALES.has(base) ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", base || "en");
}
