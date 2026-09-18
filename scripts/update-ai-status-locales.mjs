// 订正 AI 相关的说明文案（18 种语言）。
//
// 原文写的是「需要 Chrome 128+ 并在 chrome://flags 里开启 prompt-api-for-gemini-nano /
// optimization-guide-on-device-model」—— 那是 2024 年 Prompt API 还在实验期时的做法。
// 按 Chrome 官方文档与 Prompt API 规范（webmachinelearning/prompt-api）现在的状态：
//   • API 全局名是 LanguageModel（旧 window.ai.languageModel 已非文档形式）
//   • LanguageModel.availability() 返回 available / downloadable / downloading / unavailable
//   • 已稳定，不需要任何 chrome://flags
//   • 但硬件门槛不低：桌面版 Chrome（Android/iOS 不支持）、约 22 GB 可用磁盘、
//     显存 >4 GB 或 16 GB 内存 + 4 核以上；首次使用才下载模型
//   • 扩展里应移除已过期的 origin trial 权限 aiLanguageModelOriginTrial（本仓库没有，无需处理）
//
// 所以这里把三个 key 改成与现状一致的说明，并顺手去掉「去开 flag」这类会误导用户的指引。
import { readFileSync, writeFileSync } from "node:fs";

const LOCALES = [
  "ar", "de", "en", "es", "fr", "hi", "id", "it",
  "ja", "ko", "pl", "pt_BR", "ru", "th", "tr", "vi",
  "zh_CN", "zh_TW",
];

const TRANSLATIONS = {
  ai_notSupported: {
    en: "This browser cannot run Chrome's built-in AI (Gemini Nano). It needs desktop Chrome (Windows/macOS/Linux/Chromebook Plus), about 22 GB free disk, and either over 4 GB VRAM or 16 GB RAM.",
    zh_CN: "当前浏览器无法运行 Chrome 内置 AI（Gemini Nano）。需要桌面版 Chrome（Windows/macOS/Linux/Chromebook Plus）、约 22 GB 可用磁盘空间，以及显存 >4 GB 或 16 GB 内存。",
    zh_TW: "目前瀏覽器無法執行 Chrome 內建 AI（Gemini Nano）。需要桌面版 Chrome（Windows/macOS/Linux/Chromebook Plus）、約 22 GB 可用磁碟空間，以及顯示記憶體 >4 GB 或 16 GB 記憶體。",
    ja: "このブラウザでは Chrome 内蔵 AI（Gemini Nano）を実行できません。デスクトップ版 Chrome（Windows/macOS/Linux/Chromebook Plus）、約 22 GB の空き容量、および VRAM 4 GB 超またはメモリ 16 GB が必要です。",
    ko: "이 브라우저에서는 Chrome 내장 AI(Gemini Nano)를 실행할 수 없습니다. 데스크톱 Chrome(Windows/macOS/Linux/Chromebook Plus), 약 22GB의 여유 공간, 그리고 VRAM 4GB 초과 또는 16GB RAM이 필요합니다.",
    es: "Este navegador no puede ejecutar la IA integrada de Chrome (Gemini Nano). Requiere Chrome de escritorio (Windows/macOS/Linux/Chromebook Plus), unos 22 GB de disco libre y más de 4 GB de VRAM o 16 GB de RAM.",
    fr: "Ce navigateur ne peut pas exécuter l'IA intégrée de Chrome (Gemini Nano). Il faut Chrome pour ordinateur (Windows/macOS/Linux/Chromebook Plus), environ 22 Go d'espace disque libre, et plus de 4 Go de VRAM ou 16 Go de RAM.",
    de: "Dieser Browser kann Chromes integrierte KI (Gemini Nano) nicht ausführen. Erfordert Chrome für Desktop (Windows/macOS/Linux/Chromebook Plus), ca. 22 GB freien Speicher und entweder über 4 GB VRAM oder 16 GB RAM.",
    pt_BR: "Este navegador não pode executar a IA integrada do Chrome (Gemini Nano). Requer Chrome para desktop (Windows/macOS/Linux/Chromebook Plus), cerca de 22 GB livres e mais de 4 GB de VRAM ou 16 GB de RAM.",
    ru: "Этот браузер не может запустить встроенный ИИ Chrome (Gemini Nano). Нужен Chrome для компьютера (Windows/macOS/Linux/Chromebook Plus), около 22 ГБ свободного места и либо более 4 ГБ видеопамяти, либо 16 ГБ ОЗУ.",
    it: "Questo browser non può eseguire l'IA integrata di Chrome (Gemini Nano). Richiede Chrome per desktop (Windows/macOS/Linux/Chromebook Plus), circa 22 GB liberi e oltre 4 GB di VRAM o 16 GB di RAM.",
    ar: "لا يستطيع هذا المتصفح تشغيل الذكاء الاصطناعي المدمج في Chrome (Gemini Nano). يتطلب Chrome لسطح المكتب (Windows/macOS/Linux/Chromebook Plus) وحوالي 22 غيغابايت مساحة حرة، وذاكرة رسوميات أكبر من 4 غيغابايت أو ذاكرة عشوائية 16 غيغابايت.",
    hi: "यह ब्राउज़र Chrome के अंतर्निहित AI (Gemini Nano) को नहीं चला सकता। इसके लिए डेस्कटॉप Chrome (Windows/macOS/Linux/Chromebook Plus), लगभग 22 GB खाली जगह, और 4 GB से अधिक VRAM या 16 GB RAM चाहिए।",
    id: "Browser ini tidak dapat menjalankan AI bawaan Chrome (Gemini Nano). Diperlukan Chrome desktop (Windows/macOS/Linux/Chromebook Plus), sekitar 22 GB ruang kosong, dan VRAM di atas 4 GB atau RAM 16 GB.",
    tr: "Bu tarayıcı Chrome'un yerleşik yapay zekâsını (Gemini Nano) çalıştıramaz. Masaüstü Chrome (Windows/macOS/Linux/Chromebook Plus), yaklaşık 22 GB boş alan ve 4 GB üzeri VRAM ya da 16 GB RAM gerekir.",
    vi: "Trình duyệt này không thể chạy AI tích hợp của Chrome (Gemini Nano). Cần Chrome máy tính (Windows/macOS/Linux/Chromebook Plus), khoảng 22 GB dung lượng trống, và VRAM trên 4 GB hoặc RAM 16 GB.",
    th: "เบราว์เซอร์นี้ไม่สามารถรัน AI ในตัวของ Chrome (Gemini Nano) ได้ ต้องใช้ Chrome บนเดสก์ท็อป (Windows/macOS/Linux/Chromebook Plus) พื้นที่ว่างราว 22 GB และ VRAM มากกว่า 4 GB หรือแรม 16 GB",
    pl: "Ta przeglądarka nie może uruchomić wbudowanej sztucznej inteligencji Chrome (Gemini Nano). Wymaga Chrome na komputer (Windows/macOS/Linux/Chromebook Plus), około 22 GB wolnego miejsca oraz ponad 4 GB VRAM lub 16 GB RAM.",
  },
  ai_statusGuide: {
    en: "Requirements:\n1. Desktop Chrome on Windows, macOS, Linux or Chromebook Plus (not Android/iOS)\n2. About 22 GB free on the profile drive; over 4 GB VRAM, or 16 GB RAM with 4+ cores\n3. The model downloads on first use — watch progress at chrome://on-device-internals\n4. An unmetered connection for that first download; nothing is sent to any server afterwards",
    zh_CN: "使用条件：\n1. 桌面版 Chrome（Windows / macOS / Linux / Chromebook Plus），不支持 Android / iOS\n2. 配置文件所在磁盘约 22 GB 可用空间；显存 >4 GB，或 16 GB 内存 + 4 核以上\n3. 首次使用才会下载模型，进度见 chrome://on-device-internals\n4. 首次下载需要非计费网络；之后不再向任何服务器发送数据",
    zh_TW: "使用條件：\n1. 桌面版 Chrome（Windows / macOS / Linux / Chromebook Plus），不支援 Android / iOS\n2. 設定檔所在磁碟約 22 GB 可用空間；顯示記憶體 >4 GB，或 16 GB 記憶體 + 4 核心以上\n3. 首次使用才會下載模型，進度見 chrome://on-device-internals\n4. 首次下載需要非計費網路；之後不再向任何伺服器傳送資料",
    ja: "利用条件：\n1. デスクトップ版 Chrome（Windows / macOS / Linux / Chromebook Plus）。Android / iOS は非対応\n2. プロファイルのドライブに約 22 GB の空き容量。VRAM 4 GB 超、または 16 GB RAM + 4 コア以上\n3. モデルは初回利用時にダウンロードされます。進捗は chrome://on-device-internals で確認\n4. 初回ダウンロードには従量制でない回線が必要。以降はどのサーバーにもデータを送信しません",
    ko: "사용 조건:\n1. 데스크톱 Chrome(Windows / macOS / Linux / Chromebook Plus). Android / iOS는 지원하지 않습니다\n2. 프로필 드라이브에 약 22GB 여유 공간. VRAM 4GB 초과 또는 16GB RAM + 4코어 이상\n3. 모델은 처음 사용할 때 내려받습니다. 진행 상황은 chrome://on-device-internals에서 확인\n4. 첫 다운로드에는 종량제가 아닌 네트워크가 필요합니다. 이후에는 어떤 서버로도 데이터를 보내지 않습니다",
    es: "Requisitos:\n1. Chrome de escritorio en Windows, macOS, Linux o Chromebook Plus (no Android/iOS)\n2. Unos 22 GB libres en la unidad del perfil; más de 4 GB de VRAM, o 16 GB de RAM con 4 o más núcleos\n3. El modelo se descarga en el primer uso: consulta el progreso en chrome://on-device-internals\n4. Conexión no medida para esa primera descarga; después no se envía nada a ningún servidor",
    fr: "Configuration requise :\n1. Chrome pour ordinateur sous Windows, macOS, Linux ou Chromebook Plus (pas Android/iOS)\n2. Environ 22 Go libres sur le disque du profil ; plus de 4 Go de VRAM, ou 16 Go de RAM avec 4 cœurs ou plus\n3. Le modèle se télécharge à la première utilisation — suivez la progression sur chrome://on-device-internals\n4. Une connexion non limitée pour ce premier téléchargement ; ensuite, rien n'est envoyé à un serveur",
    de: "Voraussetzungen:\n1. Chrome für Desktop unter Windows, macOS, Linux oder Chromebook Plus (nicht Android/iOS)\n2. Ca. 22 GB frei auf dem Profil-Laufwerk; über 4 GB VRAM oder 16 GB RAM mit 4+ Kernen\n3. Das Modell wird bei der ersten Nutzung geladen – Fortschritt unter chrome://on-device-internals\n4. Für diesen ersten Download eine Verbindung ohne Datenlimit; danach werden keine Daten an Server gesendet",
    pt_BR: "Requisitos:\n1. Chrome para desktop no Windows, macOS, Linux ou Chromebook Plus (não Android/iOS)\n2. Cerca de 22 GB livres na unidade do perfil; mais de 4 GB de VRAM, ou 16 GB de RAM com 4+ núcleos\n3. O modelo é baixado no primeiro uso — acompanhe em chrome://on-device-internals\n4. Conexão não medida para esse primeiro download; depois nada é enviado a servidor algum",
    ru: "Требования:\n1. Chrome для компьютера на Windows, macOS, Linux или Chromebook Plus (не Android/iOS)\n2. Около 22 ГБ свободно на диске профиля; более 4 ГБ видеопамяти или 16 ГБ ОЗУ и 4+ ядра\n3. Модель скачивается при первом использовании — прогресс на chrome://on-device-internals\n4. Для первой загрузки нужен безлимитный интернет; дальше данные никуда не отправляются",
    it: "Requisiti:\n1. Chrome per desktop su Windows, macOS, Linux o Chromebook Plus (non Android/iOS)\n2. Circa 22 GB liberi sull'unità del profilo; oltre 4 GB di VRAM, oppure 16 GB di RAM con 4+ core\n3. Il modello si scarica al primo utilizzo: controlla l'avanzamento su chrome://on-device-internals\n4. Connessione non a consumo per quel primo download; poi nulla viene inviato a un server",
    ar: "المتطلبات:\n1. Chrome لسطح المكتب على Windows أو macOS أو Linux أو Chromebook Plus (ليس Android/iOS)\n2. نحو 22 غيغابايت مساحة حرة على قرص الملف الشخصي؛ ذاكرة رسوميات أكبر من 4 غيغابايت أو 16 غيغابايت ذاكرة عشوائية مع 4 أنوية فأكثر\n3. يُنزَّل النموذج عند أول استخدام — تابع التقدم على chrome://on-device-internals\n4. اتصال غير محدود ببيانات لهذا التنزيل الأول؛ بعد ذلك لا تُرسل أي بيانات إلى أي خادم",
    hi: "आवश्यकताएँ:\n1. Windows, macOS, Linux या Chromebook Plus पर डेस्कटॉप Chrome (Android/iOS नहीं)\n2. प्रोफ़ाइल ड्राइव पर लगभग 22 GB खाली जगह; 4 GB से अधिक VRAM, या 4+ कोर के साथ 16 GB RAM\n3. मॉडल पहले उपयोग पर डाउनलोड होता है — प्रगति chrome://on-device-internals पर देखें\n4. उस पहले डाउनलोड के लिए अनमीटर्ड कनेक्शन; उसके बाद किसी सर्वर पर कुछ नहीं भेजा जाता",
    id: "Persyaratan:\n1. Chrome desktop di Windows, macOS, Linux, atau Chromebook Plus (bukan Android/iOS)\n2. Sekitar 22 GB kosong di drive profil; VRAM di atas 4 GB, atau RAM 16 GB dengan 4+ inti\n3. Model diunduh saat pertama dipakai — pantau di chrome://on-device-internals\n4. Koneksi tanpa batas kuota untuk unduhan pertama itu; setelahnya tidak ada data yang dikirim ke server",
    tr: "Gereksinimler:\n1. Windows, macOS, Linux veya Chromebook Plus üzerinde masaüstü Chrome (Android/iOS değil)\n2. Profil sürücüsünde yaklaşık 22 GB boş alan; 4 GB üzeri VRAM veya 4+ çekirdekli 16 GB RAM\n3. Model ilk kullanımda indirilir — ilerlemeyi chrome://on-device-internals adresinden izleyin\n4. Bu ilk indirme için kotasız bir bağlantı; sonrasında hiçbir sunucuya veri gönderilmez",
    vi: "Yêu cầu:\n1. Chrome máy tính trên Windows, macOS, Linux hoặc Chromebook Plus (không phải Android/iOS)\n2. Khoảng 22 GB trống trên ổ chứa hồ sơ; VRAM trên 4 GB, hoặc RAM 16 GB với 4 nhân trở lên\n3. Mô hình được tải ở lần dùng đầu tiên — theo dõi tiến độ tại chrome://on-device-internals\n4. Kết nối không giới hạn dung lượng cho lần tải đầu; sau đó không gửi dữ liệu tới máy chủ nào",
    th: "ข้อกำหนด:\n1. Chrome บนเดสก์ท็อปสำหรับ Windows, macOS, Linux หรือ Chromebook Plus (ไม่ใช่ Android/iOS)\n2. พื้นที่ว่างราว 22 GB บนไดรฟ์โปรไฟล์; VRAM มากกว่า 4 GB หรือแรม 16 GB พร้อม 4 คอร์ขึ้นไป\n3. โมเดลจะดาวน์โหลดเมื่อใช้ครั้งแรก — ดูความคืบหน้าที่ chrome://on-device-internals\n4. ต้องใช้อินเทอร์เน็ตแบบไม่จำกัดปริมาณสำหรับการดาวน์โหลดครั้งแรก หลังจากนั้นจะไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์ใด",
    pl: "Wymagania:\n1. Chrome na komputer z Windows, macOS, Linux lub Chromebook Plus (nie Android/iOS)\n2. Około 22 GB wolnego miejsca na dysku profilu; ponad 4 GB VRAM lub 16 GB RAM i 4+ rdzenie\n3. Model pobiera się przy pierwszym użyciu — postęp na chrome://on-device-internals\n4. Do tego pierwszego pobrania potrzebne łącze bez limitu; później nic nie jest wysyłane do żadnego serwera",
  },
  hint_aiRequirement: {
    en: "Runs on Chrome's built-in Gemini Nano (Prompt API) — everything stays on your device. Needs desktop Chrome with enough GPU or RAM; no API key and no flags required.",
    zh_CN: "依赖 Chrome 内置的 Gemini Nano（Prompt API），全程在本机运行。需要桌面版 Chrome 且有足够的显存或内存；无需 API Key，也无需开启任何 flag。",
    zh_TW: "依賴 Chrome 內建的 Gemini Nano（Prompt API），全程在本機執行。需要桌面版 Chrome 且有足夠的顯示記憶體或記憶體；無需 API Key，也無需開啟任何 flag。",
    ja: "Chrome 内蔵の Gemini Nano（Prompt API）で動作し、すべて端末内で完結します。十分な GPU またはメモリを備えたデスクトップ版 Chrome が必要です。API キーもフラグも不要です。",
    ko: "Chrome 내장 Gemini Nano(Prompt API)에서 실행되며 모든 처리가 기기 안에서 이뤄집니다. 충분한 GPU 또는 RAM을 갖춘 데스크톱 Chrome이 필요합니다. API 키와 플래그는 필요하지 않습니다.",
    es: "Funciona con la IA integrada de Chrome (Gemini Nano) y todo se procesa en tu dispositivo. Requiere Chrome de escritorio con suficiente GPU o RAM; no necesita clave de API ni flags.",
    fr: "Fonctionne sur le Gemini Nano intégré à Chrome — tout reste sur votre appareil. Nécessite Chrome pour ordinateur avec assez de GPU ou de RAM ; ni clé d'API ni flag requis.",
    de: "Läuft auf Chromes integriertem Gemini Nano – alles bleibt auf Ihrem Gerät. Erfordert Chrome für Desktop mit ausreichend GPU oder RAM; weder API-Schlüssel noch Flags nötig.",
    pt_BR: "Roda no Gemini Nano integrado do Chrome — tudo fica no seu dispositivo. Requer Chrome para desktop com GPU ou RAM suficiente; sem chave de API e sem flags.",
    ru: "Работает на встроенном в Chrome Gemini Nano — всё остаётся на вашем устройстве. Нужен Chrome для компьютера с достаточной видеопамятью или ОЗУ; API-ключ и флаги не требуются.",
    it: "Funziona sul Gemini Nano integrato in Chrome: tutto resta sul tuo dispositivo. Richiede Chrome per desktop con GPU o RAM sufficienti; nessuna chiave API e nessun flag.",
    ar: "يعمل على Gemini Nano المدمج في Chrome، وكل شيء يبقى على جهازك. يتطلب Chrome لسطح المكتب بذاكرة رسوميات أو ذاكرة عشوائية كافية؛ دون مفتاح API ودون أي علامات.",
    hi: "Chrome के अंतर्निहित Gemini Nano (Prompt API) पर चलता है — सब कुछ आपके डिवाइस पर ही रहता है। पर्याप्त GPU या RAM वाला डेस्कटॉप Chrome चाहिए; न API key और न कोई flag।",
    id: "Berjalan di Gemini Nano bawaan Chrome — semuanya tetap di perangkat Anda. Perlu Chrome desktop dengan GPU atau RAM yang memadai; tanpa API key dan tanpa flag.",
    tr: "Chrome'un yerleşik Gemini Nano'su (Prompt API) üzerinde çalışır — her şey cihazınızda kalır. Yeterli GPU veya RAM'e sahip masaüstü Chrome gerekir; API anahtarı ve flag gerekmez.",
    vi: "Chạy trên Gemini Nano tích hợp của Chrome — mọi thứ đều ở lại trên máy bạn. Cần Chrome máy tính với GPU hoặc RAM đủ; không cần API key và không cần flag.",
    th: "ทำงานบน Gemini Nano ที่มีมาใน Chrome — ข้อมูลทั้งหมดอยู่บนเครื่องของคุณ ต้องใช้ Chrome บนเดสก์ท็อปที่มี GPU หรือแรมเพียงพอ ไม่ต้องใช้ API key และไม่ต้องเปิด flag ใด ๆ",
    pl: "Działa na wbudowanym w Chrome Gemini Nano — wszystko zostaje na Twoim urządzeniu. Wymaga Chrome na komputer z odpowiednim GPU lub RAM; bez klucza API i bez flag.",
  },
  ai_contentTooLong: {
    en: "The content is too long for the on-device model. Select a shorter passage and try again.",
    zh_CN: "内容超出了端侧模型的处理上限。请少选一点文字后重试。",
    zh_TW: "內容超出端側模型的處理上限。請少選一點文字後重試。",
    ja: "内容がオンデバイスモデルの上限を超えています。選択範囲を短くして再試行してください。",
    ko: "내용이 온디바이스 모델의 한도를 초과했습니다. 더 짧게 선택한 뒤 다시 시도하세요.",
    es: "El contenido es demasiado largo para el modelo local. Selecciona un fragmento más corto e inténtalo de nuevo.",
    fr: "Le contenu est trop long pour le modèle local. Sélectionnez un passage plus court et réessayez.",
    de: "Der Inhalt ist zu lang für das On-Device-Modell. Markiere einen kürzeren Abschnitt und versuche es erneut.",
    pt_BR: "O conteúdo é longo demais para o modelo local. Selecione um trecho mais curto e tente novamente.",
    ru: "Содержимое слишком велико для локальной модели. Выделите фрагмент покороче и повторите.",
    it: "Il contenuto è troppo lungo per il modello locale. Seleziona un passaggio più breve e riprova.",
    ar: "المحتوى أطول من الحد الذي يستطيع النموذج المحلي معالجته. حدِّد مقطعًا أقصر ثم أعد المحاولة.",
    hi: "सामग्री ऑन-डिवाइस मॉडल के लिए बहुत लंबी है। छोटा हिस्सा चुनें और फिर प्रयास करें।",
    id: "Konten terlalu panjang untuk model di perangkat. Pilih bagian yang lebih pendek lalu coba lagi.",
    tr: "İçerik cihaz üstü model için çok uzun. Daha kısa bir bölüm seçip yeniden deneyin.",
    vi: "Nội dung quá dài so với mô hình trên thiết bị. Hãy chọn đoạn ngắn hơn rồi thử lại.",
    th: "เนื้อหายาวเกินขีดจำกัดของโมเดลบนอุปกรณ์ โปรดเลือกข้อความให้สั้นลงแล้วลองใหม่",
    pl: "Treść jest za długa dla modelu lokalnego. Zaznacz krótszy fragment i spróbuj ponownie.",
  },
  // 诊断卡里的「AI 输出语言」标题（后面的语言名与来源用技术标识，不翻译）
  ai_diag_language: {
    en: "AI output language",
    zh_CN: "AI 输出语言",
    zh_TW: "AI 輸出語言",
    ja: "AI 出力言語",
    ko: "AI 출력 언어",
    es: "Idioma de salida de la IA",
    fr: "Langue de sortie de l'IA",
    de: "KI-Ausgabesprache",
    pt_BR: "Idioma de saída da IA",
    ru: "Язык вывода ИИ",
    it: "Lingua di output dell'IA",
    ar: "لغة مخرجات الذكاء الاصطناعي",
    hi: "AI आउटपुट भाषा",
    id: "Bahasa keluaran AI",
    tr: "AI çıktı dili",
    vi: "Ngôn ngữ đầu ra của AI",
    th: "ภาษาที่ AI ใช้ส่งออก",
    pl: "Język wyjściowy AI",
  },
  // 动作级语言会覆盖全局界面语言 —— 用户「选了自动却出日语」多半是这里没注意到
  hint_actionLangOverrides: {
    en: "A language set on the action overrides the global interface language; choosing Auto follows the interface language (see the diagnostic behind the CPU icon in the toolbar).",
    zh_CN: "动作里指定了语言时会覆盖全局界面语言；选「自动」则跟随界面语言（见工具栏 CPU 图标的诊断）。",
    zh_TW: "動作中指定語言時會覆寫全域介面語言；選「自動」則跟隨介面語言（見工具列 CPU 圖示的診斷）。",
    ja: "アクションで言語を指定するとグローバルなインターフェース言語を上書きします。「自動」を選ぶとインターフェース言語に従います（ツールバーの CPU アイコンの診断を参照）。",
    ko: "동작에서 언어를 지정하면 전역 인터페이스 언어를 덮어씁니다. 「자동」을 선택하면 인터페이스 언어를 따릅니다(툴바의 CPU 아이콘 진단 참조).",
    es: "El idioma definido en la acción anula el idioma global de la interfaz; si eliges Automático, se sigue el idioma de la interfaz (consulta el diagnóstico del icono de CPU en la barra de herramientas).",
    fr: "Une langue définie sur l'action remplace la langue globale de l'interface ; en choisissant Auto, c'est la langue de l'interface qui s'applique (voir le diagnostic derrière l'icône CPU de la barre d'outils).",
    de: "Eine in der Aktion festgelegte Sprache überschreibt die globale Oberflächensprache; bei „Automatisch“ gilt die Oberflächensprache (siehe Diagnose hinter dem CPU-Symbol in der Symbolleiste).",
    pt_BR: "Um idioma definido na ação substitui o idioma global da interface; ao escolher Automático, vale o idioma da interface (veja o diagnóstico no ícone de CPU da barra de ferramentas).",
    ru: "Язык, заданный в действии, переопределяет глобальный язык интерфейса; при выборе «Авто» используется язык интерфейса (см. диагностику по значку ЦП на панели инструментов).",
    it: "Una lingua impostata sull'azione sostituisce la lingua globale dell'interfaccia; scegliendo Automatico vale la lingua dell'interfaccia (vedi la diagnostica dietro l'icona CPU nella barra degli strumenti).",
    ar: "اللغة المحددة في الإجراء تلغي لغة الواجهة العامة؛ واختيار «تلقائي» يتبع لغة الواجهة (راجع التشخيص خلف أيقونة المعالج في شريط الأدوات).",
    hi: "क्रिया में चुनी भाषा वैश्विक इंटरफ़ेस भाषा को ओवरराइड करती है; 「स्वतः」 चुनने पर इंटरफ़ेस भाषा मानी जाती है (टूलबार के CPU आइकन के निदान देखें)।",
    id: "Bahasa yang disetel pada tindakan akan menimpa bahasa antarmuka global; memilih Otomatis berarti mengikuti bahasa antarmuka (lihat diagnostik di ikon CPU bilah alat).",
    tr: "Eylemde ayarlanan dil genel arayüz dilini geçersiz kılar; Otomatik seçilirse arayüz dili geçerlidir (araç çubuğundaki CPU simgesinin tanılamasına bakın).",
    vi: "Ngôn ngữ đặt trên hành động sẽ ghi đè ngôn ngữ giao diện toàn cục; chọn Tự động nghĩa là theo ngôn ngữ giao diện (xem chẩn đoán ở biểu tượng CPU trên thanh công cụ).",
    th: "ภาษาที่ตั้งในแอ็กชันจะแทนที่ภาษาอินเทอร์เฟซส่วนกลาง การเลือก 「อัตโนมัติ」 หมายถึงใช้ภาษาของอินเทอร์เฟซ (ดูการวินิจฉัยที่ไอคอน CPU บนแถบเครื่องมือ)",
    pl: "Język ustawiony w akcji zastępuje globalny język interfejsu; wybranie „Automatycznie” oznacza język interfejsu (patrz diagnostyka pod ikoną CPU na pasku narzędzi).",
  },
  // 「自动」的真实含义是「跟随浏览器界面语言」——原措辞「跟随系统 / 界面语言」
  // 容易让人以为跟随系统区域设置，实际是 Chrome 的 UI 语言，两者可以不同。
  opt_lang_auto: {
    en: "Auto (follow the browser UI language)",
    zh_CN: "自动（跟随浏览器界面语言）",
    zh_TW: "自動（跟隨瀏覽器介面語言）",
    ja: "自動（ブラウザの UI 言語に従う）",
    ko: "자동 (브라우저 UI 언어 따름)",
    es: "Automático (seguir el idioma de la interfaz del navegador)",
    fr: "Auto (suivre la langue de l'interface du navigateur)",
    de: "Automatisch (Browser-Oberflächensprache folgen)",
    pt_BR: "Automático (seguir o idioma da interface do navegador)",
    ru: "Авто (следовать языку интерфейса браузера)",
    it: "Automatico (segui la lingua dell'interfaccia del browser)",
    ar: "تلقائي (اتّباع لغة واجهة المتصفح)",
    hi: "स्वतः (ब्राउज़र UI भाषा का पालन करें)",
    id: "Otomatis (ikuti bahasa antarmuka browser)",
    tr: "Otomatik (tarayıcı arayüz dilini izle)",
    vi: "Tự động (theo ngôn ngữ giao diện trình duyệt)",
    th: "อัตโนมัติ (ตามภาษาของอินเทอร์เฟซเบราว์เซอร์)",
    pl: "Automatycznie (zgodnie z językiem interfejsu przeglądarki)",
  },
};

let updated = 0;
let added = 0;
for (const locale of LOCALES) {
  const filePath = new URL(`../extension/_locales/${locale}/messages.json`, import.meta.url);
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  for (const [key, translations] of Object.entries(TRANSLATIONS)) {
    const text = translations[locale] || translations.en;
    if (!data[key]) added++;
    else if (data[key].message !== text) updated++;
    data[key] = { ...(data[key] || {}), message: text };
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
console.log(`${LOCALES.length} 种语言已更新：新增 ${added} 条，订正 ${updated} 条`);
console.log("涉及的 key：" + Object.keys(TRANSLATIONS).join(", "));
