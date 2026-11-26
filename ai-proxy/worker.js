/**
 * EVERYDRAY – שרת ביניים לצ'אט ה-AI (Cloudflare Worker)
 * ------------------------------------------------------------
 * האתר שולח לכאן את השיחה + מאגר התרגילים + מצב השיעור שבבנייה,
 * והשרת מעביר אותם ל-Claude ומזרים את התשובה בחזרה לאתר.
 * מפתח ה-API נשמר כסוד (Secret) בשרת בלבד ולעולם לא מגיע לדפדפן.
 *
 * משתני סביבה:
 *   ANTHROPIC_API_KEY  (חובה, Secret) – מפתח ה-API מ-console.anthropic.com
 *   ALLOWED_ORIGINS    (לא חובה)      – כתובות מורשות מופרדות בפסיק. ברירת מחדל: everydray.fit
 *   MODEL              (לא חובה)      – דגם אחר במקום claude-opus-5-5
 */
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5-5';
const MAX_TOKENS = 8000;            // תקרת עלות לכל תשובה
const MAX_MESSAGES = 24;            // כמה הודעות אחרונות נשלחות
const MAX_MESSAGE_CHARS = 4000;
const MAX_CATALOG_CHARS = 60000;
const MAX_CONTEXT_CHARS = 8000;
const DEFAULT_ORIGINS = ['https://everydray.fit', 'https://www.everydray.fit'];

const SYSTEM_PROMPT = `את העוזרת החכמה של EVERYDRAY – אתר שבו מדריכות פילאטיס בונות שיעורים מאפס ומשבצות אותם בלוח שנה.

איך לענות:
- תמיד בעברית, בפנייה בלשון נקבה, בטון חם, מקצועי וקצר. בלי הקדמות מיותרות.
- פורמט פשוט: פסקאות קצרות, רשימות עם "-" או מספור, ו-**הדגשה** במידת הצורך. בלי כותרות עם # ובלי טבלאות.
- כשאת מזכירה תרגיל מהמאגר, כתבי במקום שמו את התג [[ex:מספר]] (למשל: "נתחיל ב-[[ex:54]] ואז [[ex:9]]"). האתר מציג במקום התג את שם התרגיל ככפתור שפותח אותו ומאפשר להוסיף אותו לשיעור. השתמשי רק במספרים שמופיעים במאגר שלמטה – לעולם אל תמציאי מספר.
- כשאת בונה שיעור: חלקי אותו לפתיחה וחימום, חלק מרכזי וסיום ושחרור; ציני משך בדקות לכל תרגיל, וודאי שסכום הדקות שווה למשך המבוקש. התאימי לסוג השיעור (מזרן / רפורמר / משולב), לרמה ולציוד הזמין.
- מותר לתת גם רעיונות מעבר למאגר (וריאציות, קיו מילוליים, דימויים, מעברים בין תרגילים, מוזיקה), אבל סמני בבירור מה לא נמצא במאגר.
- בשאלות על כאב, פציעה, הריון או מצב רפואי – תני עקרונות זהירות כלליים בלבד והמליצי להתייעץ עם רופא/ה או פיזיותרפיסט/ית. אל תאבחני.
- "המצב הנוכחי באתר" מגיע מהאתר עצמו. השתמשי בו כשהמדריכה שואלת על השיעור שהיא בונה או על הלוח שלה, אבל אל תחזרי עליו סתם.`;

function allowedOrigins(env) {
    const list = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    return list.length ? list : DEFAULT_ORIGINS;
}

function json(obj, status, headers) {
    return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}

/* keeps only plain user/assistant text turns, starting and ending with the user */
function sanitizeMessages(input) {
    if (!Array.isArray(input)) return null;
    const out = input
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
        .filter(m => m.content)
        .slice(-MAX_MESSAGES);
    while (out.length && out[0].role !== 'user') out.shift();
    if (!out.length || out[out.length - 1].role !== 'user') return null;
    return out;
}

function errorCode(err) {
    if (err instanceof Anthropic.AuthenticationError) return 'auth';
    if (err instanceof Anthropic.PermissionDeniedError) return 'permission';
    if (err instanceof Anthropic.RateLimitError) return 'rate_limit';
    if (err instanceof Anthropic.BadRequestError) return 'bad_request';
    if (err instanceof Anthropic.APIError) return `api_${err.status || 'error'}`;
    return 'network';
}

export default {
    async fetch(request, env, ctx) {
        const origin = request.headers.get('Origin') || '';
        const allowed = allowedOrigins(env);
        const cors = {
            'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
            'Vary': 'Origin'
        };
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
        if (request.method === 'GET') return json({ ok: true, service: 'everydray-ai', configured: !!env.ANTHROPIC_API_KEY }, 200, cors);
        if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
        if (!allowed.includes(origin)) return json({ error: 'origin_not_allowed' }, 403, cors);
        if (!env.ANTHROPIC_API_KEY) return json({ error: 'missing_api_key' }, 500, cors);

        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'bad_json' }, 400, cors); }
        const messages = sanitizeMessages(body && body.messages);
        if (!messages) return json({ error: 'bad_messages' }, 400, cors);
        const catalog = String((body && body.catalog) || '').slice(0, MAX_CATALOG_CHARS);
        const context = String((body && body.context) || '').slice(0, MAX_CONTEXT_CHARS);

        const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}) });
        const encoder = new TextEncoder();
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const send = obj => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        const work = (async () => {
            try {
                const stream = client.beta.messages.stream({
                    model: env.MODEL || MODEL,
                    max_tokens: MAX_TOKENS,
                    // if a request is declined by a safety classifier, the API retries it on a fallback model
                    betas: ['server-side-fallback-2026-07-01'],
                    fallbacks: 'default',
                    output_config: { effort: 'medium' },
                    // the instructions + exercise catalog rarely change, so they are cached between messages
                    system: [{
                        type: 'text',
                        text: catalog
                            ? `${SYSTEM_PROMPT}\n\n## מאגר התרגילים באתר (מספר | שם | קטגוריה | רמה | דקות | אזורי גוף | ציוד)\n${catalog}`
                            : SYSTEM_PROMPT,
                        cache_control: { type: 'ephemeral' }
                    }],
                    // the live state of the site goes last so it never breaks the cached prefix
                    messages: context
                        ? [...messages, { role: 'system', content: `המצב הנוכחי באתר של המדריכה:\n${context}` }]
                        : messages
                });
                for await (const event of stream) {
                    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                        await send({ type: 'text', text: event.delta.text });
                    }
                }
                const final = await stream.finalMessage();
                await send({ type: 'done', stop_reason: final.stop_reason });
            } catch (err) {
                await send({ type: 'error', code: errorCode(err) });
            } finally {
                await writer.close();
            }
        })();
        if (ctx && ctx.waitUntil) ctx.waitUntil(work);

        return new Response(readable, {
            headers: { ...cors, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' }
        });
    }
};
