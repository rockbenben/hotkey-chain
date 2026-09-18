import fs from "fs";
import path from "path";

const LOCALES_DIR = "extension/_locales";
const locales = fs.readdirSync(LOCALES_DIR);

const TRANSLATIONS = {
  tmpl_workflowAiResearch: {
    en: "AI Extraction & Summarize Workflow",
    zh_CN: "AI 提取与总结工作流",
    zh_TW: "AI 擷取與總結工作流程",
    ja: "AI抽出＆要約ワークフロー",
    ko: "AI 추출 및 요약 워크플로",
    es: "Flujo de trabajo de extracción y resumen con IA",
    fr: "Workflow d'extraction et de résumé IA",
    de: "KI-Extraktions- und Zusammenfassungs-Workflow",
    pt_BR: "Fluxo de trabalho de extração e resumo com IA",
    ru: "Рабочий процесс извлечения и обобщения с ИИ",
    it: "Flusso di lavoro di estrazione e riassunto con IA",
    ar: "سير عمل استخراج وتلخيص الذكاء الاصطناعي",
    hi: "एआई निष्कर्षण और सारांश वर्कफ़्लो",
    id: "Alur Kerja Ekstraksi & Ringkasan AI",
    tr: "Yapay Zeka Çıkarma ve Özetleme İş Akışı",
    vi: "Quy trình trích xuất & tóm tắt bằng AI",
    th: "เวิร์กโฟลว์การสกัดและสรุปด้วย AI",
    pl: "Przepływ pracy ekstrakcji i podsumowania AI"
  },
  tmpl_workflowAiResearch_desc: {
    en: "Extract links, generate core summary with AI, and copy formatted markdown to clipboard",
    zh_CN: "自动提取网页链接并由端侧 AI 智能总结要点，格式化写入剪贴板",
    zh_TW: "自動擷取網頁連結並由端側 AI 智慧總結要點，格式化寫入剪貼簿",
    ja: "ページのリンクを抽出し、AIで要約を生成してクリップボードに整形コピーします",
    ko: "페이지 링크를 추출하고 AI 요약을 생성하여 클립보드에 서식 복사합니다",
    es: "Extrae enlaces, genera un resumen con IA y copia el resultado con formato al portapapeles",
    fr: "Extrait les liens, génère un résumé IA et copie le markdown formaté dans le presse-papiers",
    de: "Extrahiert Links, erstellt eine KI-Zusammenfassung und kopiert formatiertes Markdown in die Zwischenablage",
    pt_BR: "Extrai links, gera resumo com IA e copia markdown formatado para a área de transferência",
    ru: "Извлекает ссылки, генерирует сводку с помощью ИИ и копирует форматированный Markdown в буфер обмена",
    it: "Estrae link, genera un riassunto con l'IA e copia il markdown formattato negli appunti",
    ar: "استخراج الروابط وإنشاء ملخص بالذكاء الاصطناعي ونسخ ماركداون إلى الحافظة",
    hi: "लिंक निकालें, एआई के साथ सारांश उत्पन्न करें और स्वरूपित मार्कडाउन क्लिपबोर्ड में कॉपी करें",
    id: "Ekstrak tautan, buat ringkasan dengan AI, dan salin markdown berformat ke papan klip",
    tr: "Bağlantıları çıkarın, yapay zeka ile özet oluşturun ve biçimlendirilmiş markdown'u panoya kopyalayın",
    vi: "Trích xuất liên kết, tạo tóm tắt bằng AI và sao chép markdown đã định dạng vào khay nhớ tạm",
    th: "สกัดลิงก์ สร้างบทสรุปด้วย AI และคัดลอกมาร์กดาวน์ลงคลิปบอร์ด",
    pl: "Wyodrębnia linki, generuje podsumowanie AI i kopiuje sformatowany markdown do schowka"
  },
  tmpl_workflowAiResearch_done: {
    en: "AI research summary copied to clipboard",
    zh_CN: "AI 提取总结完成并已写入剪贴板",
    zh_TW: "AI 擷取總結完成並已寫入剪貼簿",
    ja: "AIリサーチ要約をクリップボードにコピーしました",
    ko: "AI 연구 요약이 클립보드에 복사되었습니다",
    es: "Resumen de investigación con IA copiado al portapapeles",
    fr: "Résumé de recherche IA copié dans le presse-papiers",
    de: "KI-Forschungszusammenfassung in die Zwischenablage kopiert",
    pt_BR: "Resumo de pesquisa com IA copiado para a área de transferência",
    ru: "Сводка исследования ИИ скопирована в буфер обмена",
    it: "Riassunto della ricerca IA copiato negli appunti",
    ar: "تم نسخ ملخص بحث الذكاء الاصطناعي إلى الحافظة",
    hi: "एआई शोध सारांश क्लिपबोर्ड में कॉपी किया गया",
    id: "Ringkasan riset AI disalin ke papan klip",
    tr: "Yapay zeka araştırma özeti panoya kopyalandı",
    vi: "Đã sao chép tóm tắt nghiên cứu AI vào khay nhớ tạm",
    th: "คัดลอกบทสรุปการวิจัย AI ไปยังคลิปบอร์ดแล้ว",
    pl: "Podsumowanie badań AI skopiowane do schowka"
  },
  tmpl_workflowReadLater: {
    en: "Read Later & Archiving Pipeline",
    zh_CN: "稍后读与正文归档流水线",
    zh_TW: "稍後讀與正文歸檔流水線",
    ja: "後で読む＆アーカイブパイプライン",
    ko: "나중에 읽기 및 본문 아카이브 파이프라인",
    es: "Flujo de lectura posterior y archivado",
    fr: "Pipeline de lecture ultérieure et archivage",
    de: "Später lesen & Archivierungs-Pipeline",
    pt_BR: "Pipeline de ler mais tarde e arquivamento",
    ru: "Конвейер отложенного чтения и архивации",
    it: "Pipeline Leggi più tardi e archiviazione",
    ar: "مسار القراءة لاحقاً والأرشفة",
    hi: "बाद में पढ़ें और पुरालेख पाइपलाइन",
    id: "Pipeline Baca Nanti & Pengarsipan",
    tr: "Daha Sonra Oku ve Arşivleme İş Akışı",
    vi: "Quy trình Đọc sau & Lưu trữ tài liệu",
    th: "ไปป์ไลน์อ่านภายหลังและเก็บถาวร",
    pl: "Potok Przeczytaj później i archiwizacja"
  },
  tmpl_workflowReadLater_desc: {
    en: "Extract clean page Markdown to clipboard and bookmark the tab in one smooth step",
    zh_CN: "将当前网页提取为干净的 Markdown 存入剪贴板，同时加入书签备忘",
    zh_TW: "將目前網頁擷取為乾淨的 Markdown 存入剪貼簿，同時加入書籤備忘",
    ja: "WebページをMarkdown形式でクリップボードに保存し、同時にブックマークへ追加します",
    ko: "웹페이지를 깔끔한 Markdown으로 클립보드에 저장하고 북마크에 추가합니다",
    es: "Extrae Markdown limpio al portapapeles y guarda la pestaña en marcadores en un solo paso",
    fr: "Extrait le contenu en Markdown propre dans le presse-papiers et ajoute la page aux favoris",
    de: "Extrahiert sauberes Markdown in die Zwischenablage und setzt gleichzeitig ein Lesezeichen",
    pt_BR: "Extrai Markdown limpo para a área de transferência e adiciona aos favoritos",
    ru: "Извлекает чистый Markdown в буфер обмена и добавляет страницу в закладки",
    it: "Estrae Markdown pulito negli appunti e aggiunge la pagina ai preferiti",
    ar: "استخراج ماركداون نظيف إلى الحافظة وإضافة الصفحة إلى الإشارات المرجعية",
    hi: "साफ मार्कडाउन क्लिपबोर्ड में निकालें और एक ही चरण में बुकमार्क जोड़ें",
    id: "Ekstrak Markdown bersih ke papan klip dan tambahkan ke bookmark sekaligus",
    tr: "Temiz Markdown'u panoya kopyalayın ve sekmeyi tek adımda yer imlerine ekleyin",
    vi: "Trích xuất Markdown sạch vào khay nhớ tạm và đánh dấu trang cùng lúc",
    th: "สกัด Markdown ลงคลิปบอร์ดและเพิ่มลงในบุ๊กมาร์กได้ในขั้นตอนเดียว",
    pl: "Wyodrębnia czysty Markdown do schowka i dodaje kartę do zakładek w jednym kroku"
  },
  tmpl_workflowReadLater_done: {
    en: "Content saved as Markdown and page bookmarked",
    zh_CN: "正文已存为 Markdown 并加入书签",
    zh_TW: "正文已存為 Markdown 並加入書籤",
    ja: "コンテンツをMarkdownとして保存し、ブックマークに追加しました",
    ko: "본문이 Markdown으로 저장되고 북마크에 추가되었습니다",
    es: "Contenido guardado como Markdown y página agregada a marcadores",
    fr: "Contenu enregistré en Markdown et page ajoutée aux favoris",
    de: "Inhalt als Markdown gespeichert und Lesezeichen hinzugefügt",
    pt_BR: "Conteúdo salvo como Markdown e página adicionada aos favoritos",
    ru: "Содержимое сохранено в Markdown, страница добавлена в закладки",
    it: "Contenuto salvato come Markdown e pagina aggiunta ai preferiti",
    ar: "تم حفظ المحتوى كماركداون وإضافة الصفحة إلى الإشارات المرجعية",
    hi: "सामग्री को मार्कडाउन के रूप में सहेजा गया और बुकमार्क जोड़ा गया",
    id: "Konten disimpan sebagai Markdown dan halaman ditambahkan ke bookmark",
    tr: "İçerik Markdown olarak kaydedildi ve sayfa yer imlerine eklendi",
    vi: "Nội dung đã được lưu dạng Markdown và trang đã được đánh dấu",
    th: "บันทึกเนื้อหาเป็น Markdown และเพิ่มบุ๊กมาร์กแล้ว",
    pl: "Zawartość zapisana jako Markdown i strona dodana do zakładek"
  }
};

let updated = 0;
for (const locale of locales) {
  const filePath = path.join(LOCALES_DIR, locale, "messages.json");
  if (!fs.existsSync(filePath)) continue;

  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const [key, transMap] of Object.entries(TRANSLATIONS)) {
    const message = transMap[locale] || transMap["en"];
    content[key] = { message };
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf8");
  updated++;
}

console.log(`Successfully updated ${updated} locales with workflow template keys.`);
