/*
 * הגדרות האתר
 * ------------------------------------------------------------
 * aiEndpoint – כתובת שרת ה-AI (ה-Cloudflare Worker מהתיקייה ai-proxy).
 *   כל עוד הכתובת ריקה, הצ'אט עובד ב"מצב בסיסי" ועונה מתוך מאגר התרגילים של האתר.
 *   אחרי הפריסה (ראו ai-proxy/README.md) מדביקים כאן את הכתובת, למשל:
 *   aiEndpoint: 'https://everydray-ai.<your-account>.workers.dev'
 */
window.EVERYDRAY_CONFIG = {
    aiEndpoint: ''
};
