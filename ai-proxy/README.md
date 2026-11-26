# הפעלת צ'אט ה-AI באתר EVERYDRAY

הצ'אט באתר כבר עובד ב"מצב בסיסי" ועונה מתוך מאגר התרגילים. כדי שיענה עם בינה מלאכותית אמיתית (Claude),
צריך שרת קטן שמחזיק את מפתח ה-API בסוד. אסור לשים את המפתח בקוד האתר, כי כל מי שנכנס לאתר יוכל לראות אותו.

השרת הוא Cloudflare Worker: חינמי (עד 100,000 בקשות ביום), בלי התקנות, ולוקח בערך 10 דקות.

---

## שלב 1 – מפתח API של Anthropic

1. נכנסים ל-<https://console.anthropic.com> ונרשמים.
2. **Plans & Billing** – מוסיפים אמצעי תשלום וטוענים קרדיט (אפשר להתחיל ב-5$).
3. **Limits** – מומלץ להגדיר תקרת הוצאה חודשית (למשל 20$), כדי שלא יהיו הפתעות.
4. **API Keys → Create Key** – יוצרים מפתח ומעתיקים אותו (מתחיל ב-`sk-ant-`). שומרים אותו בצד; לא מדביקים אותו בשום קובץ באתר.

## שלב 2 – יצירת השרת ב-Cloudflare

1. נכנסים ל-<https://dash.cloudflare.com> ונרשמים בחינם.
2. בתפריט: **Workers & Pages → Create → Create Worker**.
3. נותנים שם `everydray-ai` ולוחצים **Deploy**.
4. לוחצים **Edit code**, מוחקים את כל הקוד שמופיע שם, ומדביקים במקומו את **כל** התוכן של הקובץ
   `ai-proxy/dist/worker.js` (בגיטהאב: פותחים את הקובץ → כפתור Copy raw file).
5. לוחצים **Deploy**.

## שלב 3 – הוספת המפתח כסוד

1. בעמוד ה-Worker: **Settings → Variables and Secrets → Add**.
2. סוג: **Secret**, שם: `ANTHROPIC_API_KEY`, ערך: המפתח משלב 1.
3. לוחצים **Deploy**.

לבדיקה: פותחים בדפדפן את כתובת ה-Worker (למשל `https://everydray-ai.שם-החשבון.workers.dev`).
אם הכל תקין יופיע: `{"ok":true,"service":"everydray-ai","configured":true}`.

## שלב 4 – חיבור האתר לשרת

בקובץ `config.js` שבתיקייה הראשית של האתר, מדביקים את כתובת ה-Worker:

```js
window.EVERYDRAY_CONFIG = {
    aiEndpoint: 'https://everydray-ai.שם-החשבון.workers.dev'
};
```

שומרים, ואחרי דקה-שתיים הצ'אט באתר יעבור למצב "AI · מופעלת על ידי Claude".
(אפשר גם פשוט לשלוח את הכתובת ל-Claude Code, והוא יעדכן ויעלה את זה לאתר.)

---

## כמה זה עולה?

הצ'אט משתמש ב-**Claude Opus 5.5** (4$ למיליון טוקנים נכנסים, 20$ למיליון יוצאים).
ההנחיות ומאגר התרגילים נשמרים במטמון בין שאלות (Prompt Caching), כך ששאלה רגילה עולה **בערך 2–5 סנט**.
תשובה אחת מוגבלת בשרת ל-8,000 טוקנים, כך שאין תשובות "בורחות".

## אבטחה

- המפתח נשמר רק ב-Cloudflare כסוד, והאתר לא רואה אותו.
- השרת מקבל בקשות רק מהדפדפן באתר `everydray.fit`. אפשר לשנות את זה במשתנה `ALLOWED_ORIGINS` (רשימה מופרדת בפסיקים).
- הצ'אט פתוח לכל מי שנכנס לאתר, ולכן חשוב להגדיר תקרת הוצאה ב-Anthropic (שלב 1.3).
  אפשר להוסיף גם הגבלת קצב ב-Cloudflare: **Security → WAF → Rate limiting rules**.
- אם Claude מסרב לבקשה בגלל מסנני הבטיחות, השרת מנסה אוטומטית דגם חלופי (Server-side fallback).

## למפתחות – פריסה משורת הפקודה

```bash
cd ai-proxy
npm install
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

אחרי שינוי ב-`worker.js` מריצים `npm run build` כדי לעדכן את `dist/worker.js` (הקובץ להדבקה בממשק של Cloudflare).

הקובץ `dist/worker.js` כולל את ספריית `@anthropic-ai/sdk` (רישיון Apache 2.0, ראו `dist/THIRD_PARTY_LICENSES.txt`).
