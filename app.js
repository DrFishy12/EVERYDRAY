/* =========================================================
   EVERYDRAY – בניית שיעורי פילאטיס ולוח שנה
   כל הנתונים נשמרים בדפדפן (localStorage).
   ========================================================= */
'use strict';

/* ---------- קבועים ---------- */
const STORAGE_KEY = 'everydray_v2';
const LEGACY_LESSONS_KEY = 'everydray_savedLessons';
const LEGACY_CALENDAR_KEY = 'everydray_calendarData';

const CATEGORIES = [
    { name: 'תרגילי חימום', key: 'warm', label: 'חימום', icon: 'sun' },
    { name: 'פילאטיס מזרן', key: 'mat', label: 'מזרן', icon: 'mat' },
    { name: 'פילאטיס מכשיר', key: 'reformer', label: 'רפורמר', icon: 'reformer' },
    { name: 'פילאטיס עם אביזרים', key: 'props', label: 'אביזרים', icon: 'ball' },
    { name: 'פילאטיס מכשירים נוספים', key: 'apparatus', label: 'צ׳ר וקדילאק', icon: 'chair' },
    { name: 'תרגילי מתיחות', key: 'stretch', label: 'מתיחות', icon: 'leaf' }
];
const REST_CATEGORY = 'התאוששות';
const CATEGORY_NAMES = CATEGORIES.map(c => c.name);
const CAT_BY_NAME = {};
CATEGORIES.forEach(c => { CAT_BY_NAME[c.name] = c; });
CAT_BY_NAME[REST_CATEGORY] = { name: REST_CATEGORY, key: 'rest', label: 'מנוחה', icon: 'moon' };
const catInfo = c => CAT_BY_NAME[c] || CAT_BY_NAME['פילאטיס מזרן'];
const catKey = c => catInfo(c).key;
const catLabel = c => (CAT_BY_NAME[c] ? CAT_BY_NAME[c].label : (c || ''));
const CAT_KEY_ORDER = ['warm', 'mat', 'reformer', 'props', 'apparatus', 'stretch', 'rest'];
const CAT_KEY_LABEL = { warm: 'חימום', mat: 'מזרן', reformer: 'רפורמר', props: 'אביזרים', apparatus: 'צ׳ר וקדילאק', stretch: 'מתיחות', rest: 'מנוחה' };

const LEVELS = ['כל הרמות', 'מתחילות', 'בינוניות', 'מתקדמות'];
const EX_LEVELS = ['מתחילות', 'בינוניות', 'מתקדמות'];
const levelRank = l => ({ 'מתחילות': 1, 'בינוניות': 2, 'מתקדמות': 3 }[l] || 1);
const FOCUS_AREAS = ['ליבה ובטן', 'ישבן ורגליים', 'גב ויציבה', 'ידיים וכתפיים', 'גמישות וניידות', 'שיווי משקל', 'נשימה והרפיה'];

const PHASES = [
    { key: 'open', label: 'פתיחה וחימום', short: 'פתיחה', hint: 'נשימה, ניידות והכנת הגוף', icon: 'sun', empty: 'כאן נכנסים תרגילי החימום — לחצי + במאגר או גררי לכאן' },
    { key: 'main', label: 'החלק המרכזי', short: 'מרכזי', hint: 'מזרן, רפורמר ואביזרים', icon: 'lotus', empty: 'כאן נכנס לב השיעור — מזרן, רפורמר, אביזרים' },
    { key: 'close', label: 'סיום ושחרור', short: 'סיום', hint: 'מתיחות, שחרור ונשימה', icon: 'moon', empty: 'כאן נכנסות המתיחות וההרפיה לסיום השיעור' }
];
const PHASE_KEYS = PHASES.map(p => p.key);
const phaseRank = p => { const i = PHASE_KEYS.indexOf(p); return i < 0 ? 1 : i; };
const defaultPhase = cat => (cat === 'תרגילי חימום' ? 'open' : cat === 'תרגילי מתיחות' ? 'close' : 'main');

const LESSON_TYPES = { mixed: 'משולב', mat: 'מזרן', reformer: 'רפורמר' };
const TARGETS = [30, 40, 45, 50, 55, 60, 75, 90];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const DEFAULT_TITLE = 'שיעור פילאטיס בוטיק 🌸';
const VIEWS = ['builder', 'lessons', 'calendar'];

const ICONS = {
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 7.5h6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    print: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    'chev-right': '<path d="M9 6l6 6-6 6"/>',
    'chev-left': '<path d="M15 6l-6 6 6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    circle: '<circle cx="12" cy="12" r="7.5"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
    grip: '<g fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></g>',
    repeat: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    more: '<g fill="currentColor" stroke="none"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></g>',
    swap: '<path d="M4 8h13l-3.5-3.5"/><path d="M20 16H7l3.5 3.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
    film: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
    mat: '<circle cx="6.5" cy="9" r="2.2"/><path d="M9.2 10.8l4.3 1.4 3.8-3.9"/><path d="M3 15.5h18"/><path d="M5 18.8h14" opacity=".45"/>',
    reformer: '<path d="M3 16h18"/><path d="M5 16v3.5M19 16v3.5"/><rect x="7.5" y="12" width="6.5" height="4" rx="1.2"/><path d="M18 16V9"/><path d="M16.3 9h3.4"/>',
    ball: '<circle cx="12" cy="12" r="8"/><path d="M4.8 9c4.5 2 9.9 2 14.4 0M4.8 15c4.5-2 9.9-2 14.4 0"/>',
    chair: '<path d="M7 3.5v17"/><path d="M7 11h9.5a1.5 1.5 0 0 1 1.5 1.5v8"/><path d="M5 20.5h4M16 20.5h4"/><path d="M10.5 15h7.5"/>',
    leaf: '<path d="M5 19C5 10.5 10 5 19 5c0 9-5.5 14-14 14z"/><path d="M5 19l7.5-7.5"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    lotus: '<circle cx="12" cy="12" r="2.3"/><path d="M12 9.7C10.1 7.5 10.2 4.8 12 3c1.8 1.8 1.9 4.5 0 6.7zM14.3 12c2.2-1.9 4.9-1.8 6.7 0-1.8 1.8-4.5 1.9-6.7 0zM12 14.3c1.9 2.2 1.8 4.9 0 6.7-1.8-1.8-1.9-4.5 0-6.7zM9.7 12C7.5 13.9 4.8 13.8 3 12c1.8-1.8 4.5-1.9 6.7 0z"/>'
};
function icon(name, size = 18) {
    return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------- עזרים ---------- */
const $ = sel => document.querySelector(sel);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const uid = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const clone = obj => JSON.parse(JSON.stringify(obj));
const sumDur = items => items.reduce((s, it) => s + (Number(it.duration) || 0), 0);
const clampDur = n => Math.min(60, Math.max(1, Math.round(Number(n) || 1)));
const isReformer = x => /רפורמר/.test((x && x.equipment) || '');
const isMachine = x => /רפורמר|צ׳ר|צ'ר|קדילאק|טאואר|בארל|קורקטור/.test((x && x.equipment) || '');
const needsProps = x => !!(x && x.equipment) && !/^ללא/.test(x.equipment) && !isMachine(x);
const isCompact = () => window.matchMedia('(max-width: 1024px)').matches;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function safeUrl(u) {
    const s = String(u || '').trim();
    return /^https?:\/\/\S+$/i.test(s) ? s : '';
}
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
/* "המאה (The Hundred)" -> { he: "המאה", en: "The Hundred" } */
function splitName(name) {
    const m = /^(.*?)\s*\(([^()]*[A-Za-z][^()]*)\)\s*$/.exec(String(name || ''));
    return m ? { he: m[1].trim(), en: m[2].trim() } : { he: String(name || ''), en: '' };
}
function nameHtml(name) {
    const n = splitName(name);
    return `<span class="nm-he">${esc(n.he)}</span>${n.en ? `<span class="nm-en">${esc(n.en)}</span>` : ''}`;
}
const levelDots = level => `<span class="lvl lvl-${levelRank(level)}" title="${esc(level || '')}" aria-label="רמה: ${esc(level || '')}"><i></i><i></i><i></i></span>`;

/* ---------- תאריכים ---------- */
const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parseDate(s) {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}
function addDays(s, n) {
    const d = parseDate(s);
    d.setDate(d.getDate() + n);
    return toDateStr(d);
}
const todayStr = () => toDateStr(new Date());
const monthStart = s => s.slice(0, 8) + '01';
function formatDateLong(s) {
    const d = parseDate(s);
    return `יום ${DAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDateMedium(s) {
    const d = parseDate(s);
    return `יום ${DAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]}`;
}
function formatDateShort(s) {
    const d = parseDate(s);
    return `${d.getDate()}.${d.getMonth() + 1}`;
}
function relativeDay(s) {
    const diff = Math.round((parseDate(s) - parseDate(todayStr())) / 86400000);
    if (diff === 0) return 'היום';
    if (diff === 1) return 'מחר';
    if (diff === -1) return 'אתמול';
    return '';
}

/* =========================================================
   נתונים ושמירה
   ========================================================= */
function defaultState() {
    return { version: 3, lessons: [], events: [], customExercises: [], favorites: [], videoOverrides: {}, draft: null, prefs: { view: 'builder', calMode: 'month', lastTime: '18:00', lastGroup: '' } };
}

function normalizeItem(it) {
    if (!it || typeof it !== 'object') return null;
    const base = {
        uid: String(it.uid || it.uniqueId || uid('it')),
        duration: clampDur(it.duration),
        note: String(it.note || '')
    };
    if (PHASE_KEYS.includes(it.phase)) base.phase = it.phase;
    if (it.kind === 'rest' || it.type === 'rest') {
        return Object.assign(base, { kind: 'rest', name: 'הפסקת מנוחה', category: REST_CATEGORY });
    }
    const exId = it.exId != null ? String(it.exId) : (it.id != null ? String(it.id) : null);
    return Object.assign(base, {
        kind: 'exercise',
        exId,
        name: String(it.name || 'תרגיל'),
        category: String(it.category || ''),
        target: String(it.target || ''),
        springs: String(it.springs || ''),
        equipment: String(it.equipment || ''),
        description: String(it.description || ''),
        tips: String(it.tips || ''),
        muscles: String(it.muscles || '')
    });
}

/* כל פריט בשיעור שייך לאחד משלושת חלקי השיעור, והסדר תמיד: פתיחה → מרכזי → סיום */
function normalizePhases(items) {
    if (items.length && items.every(it => PHASE_KEYS.includes(it.phase))) {
        return items.map((it, i) => [it, i])
            .sort((a, b) => phaseRank(a[0].phase) - phaseRank(b[0].phase) || a[1] - b[1])
            .map(x => x[0]);
    }
    // שיעורים מהגרסה הקודמת – מסיקים את החלקים לפי הסדר והקטגוריות, בלי לשנות את הסדר
    const isEx = it => it.kind !== 'rest';
    const firstNonOpen = items.findIndex(it => isEx(it) && defaultPhase(it.category) !== 'open');
    let lastNonClose = -1;
    items.forEach((it, i) => { if (isEx(it) && defaultPhase(it.category) !== 'close') lastNonClose = i; });
    items.forEach((it, i) => {
        if (firstNonOpen === -1 || i < firstNonOpen) it.phase = 'open';
        else if (lastNonClose === -1 || i > lastNonClose) it.phase = 'close';
        else it.phase = 'main';
    });
    return items;
}

function inferType(items) {
    const ex = items.filter(i => i.kind !== 'rest');
    if (!ex.length) return 'mixed';
    const r = ex.filter(isReformer).length;
    if (r === 0) return 'mat';
    if (r === ex.length) return 'reformer';
    return 'mixed';
}
function nearestTarget(total) {
    if (!total) return 50;
    return TARGETS.reduce((best, t) => (Math.abs(t - total) < Math.abs(best - total) ? t : best), TARGETS[0]);
}
function idTime(id) {
    const m = /_(\d{12,})/.exec(String(id || ''));
    return m ? Number(m[1]) : 0;
}

function normalizeLesson(l) {
    if (!l || typeof l !== 'object' || !Array.isArray(l.items)) return null;
    const items = normalizePhases(l.items.map(normalizeItem).filter(Boolean));
    const created = Number(l.createdAt) || idTime(l.id) || Date.now();
    return {
        id: String(l.id || uid('lesson')),
        title: String(l.title || 'שיעור ללא שם'),
        level: LEVELS.includes(l.level) ? l.level : LEVELS[0],
        type: LESSON_TYPES[l.type] ? l.type : inferType(items),
        target: Number(l.target) > 0 ? Number(l.target) : nearestTarget(sumDur(items)),
        notes: String(l.notes || ''),
        items,
        createdAt: created,
        updatedAt: Number(l.updatedAt) || created
    };
}

function normalizeEvent(e) {
    return {
        id: String(e.id || uid('ev')),
        lessonId: e.lessonId ? String(e.lessonId) : null,
        date: e.date,
        time: TIME_RE.test(e.time || '') ? e.time : '',
        group: String(e.group || ''),
        note: String(e.note || ''),
        done: !!e.done,
        title: String(e.title || ''),
        seriesId: e.seriesId ? String(e.seriesId) : null
    };
}

function normalizeCustom(e) {
    return {
        id: String(e.id || uid('c')),
        custom: true,
        name: String(e.name),
        category: CATEGORY_NAMES.includes(e.category) ? e.category : 'פילאטיס מזרן',
        level: EX_LEVELS.includes(e.level) ? e.level : 'מתחילות',
        focus: Array.isArray(e.focus) ? e.focus.filter(f => FOCUS_AREAS.includes(f)) : [],
        target: String(e.target || ''),
        duration: clampDur(e.duration || 4),
        description: String(e.description || ''),
        tips: String(e.tips || ''),
        muscles: String(e.muscles || ''),
        springs: String(e.springs || 'ללא קפיצים'),
        equipment: String(e.equipment || ''),
        videoUrl: safeUrl(e.videoUrl)
    };
}

function normalizeState(s) {
    const out = defaultState();
    if (!s || typeof s !== 'object') return out;
    out.lessons = Array.isArray(s.lessons) ? s.lessons.map(normalizeLesson).filter(Boolean) : [];
    out.events = Array.isArray(s.events) ? s.events.filter(e => e && DATE_RE.test(e.date || '')).map(normalizeEvent) : [];
    out.customExercises = Array.isArray(s.customExercises) ? s.customExercises.filter(e => e && e.name).map(normalizeCustom) : [];
    out.favorites = Array.isArray(s.favorites) ? [...new Set(s.favorites.map(String))] : [];
    if (s.videoOverrides && typeof s.videoOverrides === 'object') {
        Object.keys(s.videoOverrides).forEach(k => { const u = safeUrl(s.videoOverrides[k]); if (u) out.videoOverrides[String(k)] = u; });
    }
    out.draft = s.draft && typeof s.draft === 'object' ? s.draft : null;
    if (s.prefs && typeof s.prefs === 'object') Object.assign(out.prefs, s.prefs);
    return out;
}

/* המרה מהגרסה הראשונה של האתר (שיעורים + לוח של נובמבר 2026) */
function migrateLegacy() {
    let oldLessons = [];
    let oldCal = {};
    try { oldLessons = JSON.parse(localStorage.getItem(LEGACY_LESSONS_KEY)) || []; } catch (e) { /* ignore */ }
    try { oldCal = JSON.parse(localStorage.getItem(LEGACY_CALENDAR_KEY)) || {}; } catch (e) { /* ignore */ }
    const lessons = (Array.isArray(oldLessons) ? oldLessons : []).map(normalizeLesson).filter(Boolean);
    const events = [];
    if (oldCal && typeof oldCal === 'object') {
        Object.keys(oldCal).forEach(day => {
            const d = parseInt(day, 10);
            const title = oldCal[day];
            if (d >= 1 && d <= 30 && title) {
                const match = lessons.find(l => l.title === title);
                events.push({ id: uid('ev'), lessonId: match ? match.id : null, date: `2026-11-${pad(d)}`, time: '', title: String(title) });
            }
        });
    }
    return { lessons, events };
}

function loadState() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object') raw = migrateLegacy();
    return normalizeState(raw);
}

let saveWarned = false;
function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        if (!saveWarned) {
            saveWarned = true;
            toast('לא ניתן לשמור בדפדפן הזה (אולי גלישה בסתר?). השינויים יישמרו רק עד סגירת הדף.', { type: 'warn', timeout: 6000 });
        }
    }
}

const state = loadState();

/* ---------- השיעור שבבנייה ---------- */
function newBuilder() {
    return { editingId: null, title: DEFAULT_TITLE, level: LEVELS[0], type: 'mixed', target: 50, notes: '', items: [], dirty: false };
}
function normalizeBuilder(d) {
    const b = newBuilder();
    if (!d) return b;
    b.editingId = d.editingId && state.lessons.some(l => l.id === d.editingId) ? String(d.editingId) : null;
    b.title = typeof d.title === 'string' ? d.title : DEFAULT_TITLE;
    b.level = LEVELS.includes(d.level) ? d.level : LEVELS[0];
    b.type = LESSON_TYPES[d.type] ? d.type : 'mixed';
    b.target = Number(d.target) > 0 ? Number(d.target) : 50;
    b.notes = String(d.notes || '');
    b.items = Array.isArray(d.items) ? normalizePhases(d.items.map(normalizeItem).filter(Boolean)) : [];
    b.dirty = !!d.dirty;
    return b;
}
let builder = normalizeBuilder(state.draft);
state.draft = builder;

/* ---------- מצב תצוגה ---------- */
const ui = {
    view: VIEWS.includes(state.prefs.view) ? state.prefs.view : 'builder',
    pane: 'library',
    search: '',
    cat: 'all',
    level: 'all',
    focus: 'all',
    expanded: new Set(),
    openMore: new Set(),
    calMode: state.prefs.calMode === 'week' ? 'week' : 'month',
    selectedDate: todayStr(),
    calCursor: monthStart(todayStr()),
    lessonsSearch: '',
    lessonsSort: 'updated',
    newItemUid: null
};

/* =========================================================
   מאגר תרגילים
   ========================================================= */
const libraryAll = () => EXERCISES.concat(state.customExercises);
const findExercise = id => (id == null ? null : libraryAll().find(e => String(e.id) === String(id)));
const isFav = id => state.favorites.includes(String(id));
function exerciseOrder(ex) {
    const i = EXERCISES.indexOf(ex);
    return i >= 0 ? i : 10000 + state.customExercises.indexOf(ex);
}

function renderChips() {
    const all = libraryAll();
    const chips = [
        { cat: 'all', label: 'הכל', count: all.length },
        ...CATEGORIES.map(c => ({ cat: c.name, label: c.label, key: c.key, icon: c.icon, count: all.filter(e => e.category === c.name).length })),
        { cat: 'fav', label: '★ מועדפים', count: state.favorites.length },
        { cat: 'mine', label: 'התרגילים שלי', count: state.customExercises.length }
    ];
    $('#categoryChips').innerHTML = chips.map(c => `
        <button class="chip ${c.key ? 'cat-' + c.key : 'plain'} ${ui.cat === c.cat ? 'active' : ''}" data-action="filter-cat" data-cat="${esc(c.cat)}" aria-pressed="${ui.cat === c.cat}">
            ${c.icon ? `<span class="chip-ico">${icon(c.icon, 13)}</span>` : ''}${esc(c.label)}${c.count ? ` <span class="count">${c.count}</span>` : ''}
        </button>`).join('');
}

function filteredLibrary() {
    const q = ui.search.trim().toLowerCase();
    return libraryAll().filter(ex => {
        if (ui.cat === 'fav' && !isFav(ex.id)) return false;
        if (ui.cat === 'mine' && !ex.custom) return false;
        if (CATEGORY_NAMES.includes(ui.cat) && ex.category !== ui.cat) return false;
        if (ui.level !== 'all' && ex.level !== ui.level) return false;
        if (ui.focus !== 'all' && !(ex.focus || []).includes(ui.focus)) return false;
        if (!q) return true;
        return exSearchText(ex).includes(q);
    });
}

/* ---------- פרטי תרגיל: הסבר מלא, הדמיה וסרטון ---------- */
const asList = v => (Array.isArray(v) ? v.filter(Boolean).map(String) : (v ? [String(v).replace(/^דגש:\s*/, '')] : []));
const exTips = ex => asList(ex && ex.tips);
function exDescription(ex) {
    if (!ex) return '';
    if (ex.steps && ex.steps.length) return [ex.setup].concat(ex.steps).filter(Boolean).join(' ');
    return ex.description || '';
}
const SEARCH_CACHE = new Map();
function exSearchText(ex) {
    if (!ex.custom && SEARCH_CACHE.has(ex.id)) return SEARCH_CACHE.get(ex.id);
    const t = [ex.name, ex.target, exDescription(ex), exTips(ex).join(' '), asList(ex.mistakes).join(' '), ex.muscles, ex.springs, ex.equipment, ex.category, ex.level, (ex.focus || []).join(' ')]
        .join(' ').toLowerCase();
    if (!ex.custom) SEARCH_CACHE.set(ex.id, t);
    return t;
}
const exVideo = ex => safeUrl(state.videoOverrides[String(ex.id)]) || safeUrl(ex.video) || safeUrl(ex.videoUrl) || '';
function videoSearchUrl(ex) {
    const nm = splitName(ex.name);
    const eq = ex.equipment || '';
    const where = /רפורמר/.test(eq) ? 'reformer' : /צ׳ר|צ'ר/.test(eq) ? 'wunda chair' : /קדילאק|טאואר/.test(eq) ? 'cadillac' : /בארל|קורקטור/.test(eq) ? 'barrel' : needsProps(ex) ? '' : 'mat';
    const q = `${nm.en || nm.he} pilates ${where} exercise`.replace(/\s+/g, ' ').trim();
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
function youTubeId(url) {
    const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url || '');
    return m ? m[1] : null;
}
const hasDemo = ex => !!(ex && ex.demo && window.EverydrayDemos && window.EverydrayDemos.has(ex.demo));
const mountDemos = root => { if (window.EverydrayDemos && root) window.EverydrayDemos.mount(root); };

function exerciseDetailHtml(ex, { modal = false } = {}) {
    const id = esc(String(ex.id));
    const steps = asList(ex.steps);
    const tips = exTips(ex);
    const mistakes = asList(ex.mistakes);
    const video = exVideo(ex);
    const ytId = youTubeId(video);
    const videoBtn = ytId
        ? `<button class="btn xs primary" data-action="play-video" data-id="${id}">${icon('play', 13)}צפייה בסרטון</button>`
        : video
            ? `<a class="btn xs primary" href="${esc(video)}" target="_blank" rel="noopener">${icon('play', 13)}צפייה בסרטון</a>`
            : `<a class="btn xs soft" href="${esc(videoSearchUrl(ex))}" target="_blank" rel="noopener" title="חיפוש סרטוני הדגמה ב-YouTube">${icon('film', 14)}סרטוני הדגמה</a>`;
    return `
    <div class="ex-detail ${modal ? 'in-modal' : ''}" data-ex-id="${id}">
        <div class="ex-visual">
            ${hasDemo(ex) ? `<div class="demo-card"><div class="demo" data-demo="${esc(ex.demo)}"></div><span class="demo-label">${icon('sparkle', 12)}הדמיית תנועה</span></div>` : ''}
            <div class="video-row">
                ${videoBtn}
                <button class="link-btn" data-action="set-video" data-id="${id}">${video ? 'החלפת סרטון' : 'קישור לסרטון משלך'}</button>
            </div>
            <div class="video-embed" hidden></div>
        </div>
        <div class="ex-text">
            ${ex.setup ? `<section class="ex-block"><h5>תנוחת מוצא</h5><p>${esc(ex.setup)}</p></section>` : ''}
            ${steps.length
                ? `<section class="ex-block"><h5>ביצוע</h5><ol class="ex-steps">${steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol></section>`
                : ex.description ? `<section class="ex-block"><h5>ביצוע</h5><p>${esc(ex.description)}</p></section>` : ''}
            ${ex.reps ? `<p class="ex-reps">${icon('repeat', 14)}<b>חזרות:</b> ${esc(ex.reps)}</p>` : ''}
            ${tips.length ? `<section class="ex-block tips"><h5>דגשים להדרכה</h5><ul>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>` : ''}
            ${mistakes.length ? `<section class="ex-block mistakes"><h5>טעויות נפוצות</h5><ul>${mistakes.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>` : ''}
            ${ex.easier || ex.harder ? `<div class="ex-mods">${ex.easier ? `<div class="mod easy"><b>הקלה</b><span>${esc(ex.easier)}</span></div>` : ''}${ex.harder ? `<div class="mod hard"><b>התקדמות</b><span>${esc(ex.harder)}</span></div>` : ''}</div>` : ''}
            ${ex.muscles ? `<p class="ex-muscles"><b>שרירים עובדים:</b> ${esc(ex.muscles)}</p>` : ''}
            <div class="ex-meta">
                <span class="pill tag cat-${catKey(ex.category)}">${esc(catLabel(ex.category))}</span>
                <span class="pill">${esc(ex.level || '')}</span>
                <span class="pill">${icon('clock', 13)}${ex.duration} דק׳</span>
                ${ex.springs && !/ללא/.test(ex.springs) ? `<span class="pill springs">קפיצים: ${esc(ex.springs)}</span>` : ''}
                ${ex.equipment ? `<span class="pill">${esc(ex.equipment)}</span>` : ''}
                ${(ex.focus || []).map(f => `<span class="pill rose">${esc(f)}</span>`).join('')}
            </div>
            ${ex.custom ? `<div class="ex-own-actions">
                <button class="btn xs" data-action="edit-custom" data-id="${id}">${icon('pen')}עריכה</button>
                <button class="btn xs ghost" data-action="delete-custom" data-id="${id}">${icon('trash')}מחיקה</button>
            </div>` : ''}
        </div>
    </div>`;
}

function refreshExerciseDetails(id) {
    const ex = findExercise(id);
    if (!ex) return;
    document.querySelectorAll(`.ex-detail[data-ex-id="${CSS.escape(String(id))}"]`).forEach(d => {
        const holder = document.createElement('div');
        holder.innerHTML = exerciseDetailHtml(ex, { modal: d.classList.contains('in-modal') });
        const fresh = holder.firstElementChild;
        d.replaceWith(fresh);
        mountDemos(fresh);
    });
}

function openExerciseModal(id) {
    const ex = findExercise(id);
    if (!ex) return;
    const m = openModal({
        title: ex.name,
        body: exerciseDetailHtml(ex, { modal: true }),
        size: 'wide',
        actions: [
            { label: 'הוספה לשיעור', icon: 'plus', className: 'btn primary', onClick: () => { addExerciseToLesson(ex.id); toast(`נוסף לשיעור: ${splitName(ex.name).he}`, { key: 'added' }); } },
            { label: 'סגירה', className: 'btn ghost' }
        ]
    });
    mountDemos(m.el);
}

function playVideo(el) {
    const ex = findExercise(el.dataset.id);
    const vid = ex && youTubeId(exVideo(ex));
    const box = el.closest('.ex-visual') && el.closest('.ex-visual').querySelector('.video-embed');
    if (!vid || !box) return;
    if (!box.hidden) { box.hidden = true; box.innerHTML = ''; return; }
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${vid}?rel=0&autoplay=1" title="סרטון הדגמה" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    box.hidden = false;
}

function setVideo(id) {
    const ex = findExercise(id);
    if (!ex) return;
    const key = String(id);
    const cur = state.videoOverrides[key] || '';
    const apply = v => {
        if (v) state.videoOverrides[key] = v; else delete state.videoOverrides[key];
        save();
        refreshExerciseDetails(id);
    };
    const actionsList = [{
        label: 'שמירה', className: 'btn primary', onClick: m => {
            const v = m.el.querySelector('#vidUrl').value.trim();
            if (v && !safeUrl(v)) { toast('הקישור צריך להתחיל ב-https://', { type: 'warn' }); return false; }
            apply(v);
            toast(v ? 'הסרטון נשמר לתרגיל 🎬' : 'הקישור הוסר');
            return true;
        }
    }];
    if (cur) actionsList.push({ label: 'הסרת הקישור', className: 'btn ghost', onClick: () => { apply(''); toast('הקישור הוסר — יוצגו שוב סרטוני הדגמה מ-YouTube'); } });
    actionsList.push({ label: 'ביטול', className: 'btn ghost' });
    openModal({
        title: 'סרטון הדגמה לתרגיל',
        body: `
            <p class="muted">הדביקי קישור לסרטון שאת אוהבת להראות למתאמנות (YouTube, Instagram, Vimeo…). סרטוני YouTube יוצגו ישירות כאן באתר. הקישור נשמר במכשיר הזה ונכלל בקובץ הגיבוי.</p>
            <label class="field"><span>${esc(ex.name)}</span><input class="input" id="vidUrl" type="url" dir="ltr" value="${esc(cur)}" placeholder="https://www.youtube.com/watch?v=…"></label>
            <a class="link-btn" href="${esc(videoSearchUrl(ex))}" target="_blank" rel="noopener">${icon('search', 14)}חיפוש סרטונים מתאימים ב-YouTube</a>`,
        actions: actionsList
    });
}

function exerciseCardHtml(ex, counts) {
    const id = String(ex.id);
    const info = catInfo(ex.category);
    const open = ui.expanded.has(id);
    const n = counts[id] || 0;
    const fav = isFav(id);
    const nm = splitName(ex.name);
    return `
    <article class="ex-card cat-${info.key} ${open ? 'open' : ''}" draggable="true" data-ex-id="${esc(id)}">
        <div class="ex-row">
            <span class="cat-bubble" aria-hidden="true">${icon(info.icon, 20)}</span>
            <button class="ex-title" data-action="toggle-ex" data-id="${esc(id)}" aria-expanded="${open}">
                <span class="ex-name"><span class="nm-he">${esc(nm.he)}</span>${nm.en ? `<span class="nm-en">${esc(nm.en)}</span>` : ''}</span>
                <span class="ex-sub">
                    ${levelDots(ex.level)}
                    <span class="sub-dur">${ex.duration} ד׳ ·</span>
                    <span>${esc(ex.target)}</span>
                    ${ex.custom ? '<span class="tag" style="--cat-bg:var(--gold-soft);--cat-color:var(--gold-dark)">שלי</span>' : ''}
                </span>
            </button>
            <div class="ex-side">
                ${n ? `<span class="in-lesson" title="כבר בשיעור">${icon('check', 12)}<span class="in-lesson-text">${n > 1 ? '×' + n : 'בשיעור'}</span></span>` : ''}
                <span class="dur-pill">${ex.duration} ד׳</span>
                <button class="icon-btn sm fav-btn ${fav ? 'on' : ''}" data-action="fav" data-id="${esc(id)}" aria-pressed="${fav}" aria-label="${fav ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}" title="${fav ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}">${icon('star')}</button>
                <button class="add-btn" data-action="add-ex" data-id="${esc(id)}" aria-label="הוספת ${esc(nm.he)} לשיעור" title="הוספה לשיעור">${icon('plus', 18)}</button>
            </div>
        </div>
        <div class="ex-details">${open ? exerciseDetailHtml(ex) : ''}</div>
    </article>`;
}

function renderLibrary() {
    renderChips();
    const list = filteredLibrary();
    const total = libraryAll().length;
    $('#libraryCount').textContent = list.length === total ? `${total} תרגילים · לחצי על תרגיל להסבר מלא` : `מוצגים ${list.length} מתוך ${total} תרגילים`;

    const counts = {};
    builder.items.forEach(it => { if (it.exId) counts[it.exId] = (counts[it.exId] || 0) + 1; });

    const el = $('#exerciseList');
    if (!list.length) {
        let msg = 'לא נמצאו תרגילים מתאימים. נסי לשנות את החיפוש או את הסינון.';
        let extra = '';
        if (ui.cat === 'fav' && !ui.search) msg = 'עוד לא סימנת מועדפים. לחצי על ☆ ליד תרגיל כדי לשמור אותו כאן לגישה מהירה.';
        if (ui.cat === 'mine' && !ui.search) {
            msg = 'עוד אין לך תרגילים משלך. אפשר להוסיף כל תרגיל מהרפרטואר שלך — עם הסבר, דגשים, קפיצים וקישור לסרטון.';
            extra = `<button class="btn sm primary" data-action="new-custom">${icon('plus')}הוספת תרגיל</button>`;
        }
        el.innerHTML = `<div class="lib-empty"><p>${msg}</p>${extra}</div>`;
        return;
    }
    el.innerHTML = list.map(ex => exerciseCardHtml(ex, counts)).join('');
    mountDemos(el);
}

function toggleFav(id) {
    id = String(id);
    const i = state.favorites.indexOf(id);
    if (i >= 0) state.favorites.splice(i, 1); else state.favorites.push(id);
    save();
    renderLibrary();
}

function flashLibraryCard(id) {
    const card = document.querySelector(`.ex-card[data-ex-id="${CSS.escape(String(id))}"]`);
    if (!card) return;
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
}

/* ---------- תרגילים משלי ---------- */
const uniqueValues = field => [...new Set(libraryAll().map(e => e[field]).filter(Boolean))];

function openCustomExerciseModal(id = null) {
    const ex = id ? state.customExercises.find(e => e.id === id) : null;
    const v = ex || { name: '', category: 'פילאטיס מזרן', level: 'מתחילות', focus: [], target: '', duration: 4, springs: 'ללא קפיצים', equipment: 'ללא אביזרים (מזרן)', description: '', tips: '', muscles: '', videoUrl: '' };
    const body = `
        <label class="field"><span>שם התרגיל *</span><input class="input" id="cxName" maxlength="80" value="${esc(v.name)}" placeholder="למשל: גשר על כדור (Bridge on Ball)"></label>
        <div class="form-row">
            <label class="field"><span>קטגוריה</span><select class="input" id="cxCat">${CATEGORIES.map(c => `<option value="${esc(c.name)}" ${c.name === v.category ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></label>
            <label class="field"><span>רמה</span><select class="input" id="cxLevel">${EX_LEVELS.map(l => `<option ${l === v.level ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="form-row">
            <label class="field"><span>משך (דקות)</span><input class="input" id="cxDur" type="number" min="1" max="60" value="${esc(v.duration)}"></label>
            <label class="field"><span>מטרה</span><input class="input" id="cxTarget" maxlength="80" value="${esc(v.target)}" placeholder="למשל: ישבן ויציבות אגן"></label>
        </div>
        <div class="field"><span>אזורי גוף</span>
            <div class="toggle-chips" id="cxFocus">${FOCUS_AREAS.map(f => `<label><input type="checkbox" value="${esc(f)}" ${(v.focus || []).includes(f) ? 'checked' : ''}><span>${esc(f)}</span></label>`).join('')}</div>
        </div>
        <div class="form-row">
            <label class="field"><span>קפיצים</span><input class="input" id="cxSprings" list="dlSprings" maxlength="60" value="${esc(v.springs)}"></label>
            <label class="field"><span>אביזרים / מכשיר</span><input class="input" id="cxEquip" list="dlEquip" maxlength="80" value="${esc(v.equipment)}"></label>
        </div>
        <datalist id="dlSprings">${uniqueValues('springs').map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        <datalist id="dlEquip">${uniqueValues('equipment').map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        <label class="field"><span>הסבר ביצוע</span><textarea class="input" id="cxDesc" rows="3" maxlength="700">${esc(v.description)}</textarea></label>
        <label class="field"><span>דגשים להדרכה <small>(לא חובה)</small></span><textarea class="input" id="cxTips" rows="2" maxlength="300">${esc(v.tips)}</textarea></label>
        <label class="field"><span>שרירים עובדים <small>(לא חובה)</small></span><input class="input" id="cxMuscles" maxlength="140" value="${esc(v.muscles)}"></label>
        <label class="field"><span>קישור לסרטון <small>(לא חובה)</small></span><input class="input" id="cxVideo" type="url" dir="ltr" maxlength="300" value="${esc(v.videoUrl)}" placeholder="https://…"></label>`;

    openModal({
        title: ex ? 'עריכת תרגיל' : 'תרגיל חדש למאגר שלי',
        body,
        actions: [
            {
                label: ex ? 'שמירת שינויים' : 'הוספה למאגר', className: 'btn primary', onClick: m => {
                    const q = s => m.el.querySelector(s);
                    const name = q('#cxName').value.trim();
                    if (!name) { toast('צריך לתת לתרגיל שם', { type: 'warn' }); q('#cxName').focus(); return false; }
                    const video = q('#cxVideo').value.trim();
                    if (video && !safeUrl(video)) { toast('הקישור לסרטון צריך להתחיל ב-https://', { type: 'warn' }); return false; }
                    const data = normalizeCustom({
                        id: ex ? ex.id : uid('c'),
                        name, category: q('#cxCat').value, level: q('#cxLevel').value, duration: q('#cxDur').value,
                        focus: [...m.el.querySelectorAll('#cxFocus input:checked')].map(i => i.value),
                        target: q('#cxTarget').value.trim(), springs: q('#cxSprings').value.trim(), equipment: q('#cxEquip').value.trim(),
                        description: q('#cxDesc').value.trim(), tips: q('#cxTips').value.trim(), muscles: q('#cxMuscles').value.trim(), videoUrl: video
                    });
                    if (ex) {
                        Object.assign(ex, data);
                        toast(`"${name}" עודכן`);
                    } else {
                        state.customExercises.push(data);
                        toast(`"${name}" נוסף למאגר שלך 🌸`, { action: { label: 'הוספה לשיעור', fn: () => addExerciseToLesson(data.id) } });
                    }
                    save();
                    renderLibrary();
                    return true;
                }
            },
            { label: 'ביטול', className: 'btn ghost' }
        ]
    });
}

async function deleteCustomExercise(id) {
    const ex = state.customExercises.find(e => e.id === id);
    if (!ex) return;
    const ok = await confirmDialog({ title: 'מחיקת תרגיל', message: `למחוק את "${esc(ex.name)}" מהמאגר שלך?<br><span class="muted small">שיעורים שכבר כוללים את התרגיל לא ישתנו.</span>`, okLabel: 'מחיקה', danger: true });
    if (!ok) return;
    state.customExercises = state.customExercises.filter(e => e.id !== id);
    state.favorites = state.favorites.filter(f => f !== id);
    ui.expanded.delete(id);
    save();
    renderLibrary();
    toast('התרגיל נמחק מהמאגר');
}

/* =========================================================
   בניית שיעור
   ========================================================= */
function makeItemFromExercise(ex) {
    return normalizeItem({
        uid: uid('it'), kind: 'exercise', exId: String(ex.id), name: ex.name, category: ex.category, target: ex.target,
        duration: ex.duration, springs: ex.springs, equipment: ex.equipment, description: exDescription(ex), tips: exTips(ex).join(' · '), muscles: ex.muscles,
        phase: defaultPhase(ex.category)
    });
}
function itemInfo(it) {
    if (it.kind === 'rest') return it;
    const ex = findExercise(it.exId);
    if (!ex) return Object.assign({}, it, { stepsList: [], tipsList: asList(it.tips) });
    return Object.assign({}, it, {
        description: exDescription(ex) || it.description, setup: ex.setup || '', stepsList: asList(ex.steps),
        tipsList: exTips(ex), reps: ex.reps || '', muscles: ex.muscles || it.muscles
    });
}
const getItem = u => builder.items.find(it => it.uid === u);
const itemIndex = u => builder.items.findIndex(it => it.uid === u);

/* טווח האינדקסים [start, end) של חלק בשיעור */
function phaseBounds(phase) {
    const r = phaseRank(phase);
    let start = builder.items.findIndex(it => phaseRank(it.phase) >= r);
    if (start < 0) start = builder.items.length;
    let end = builder.items.findIndex(it => phaseRank(it.phase) > r);
    if (end < 0) end = builder.items.length;
    return [start, end];
}

function commitBuilder({ dirty = true, library = true } = {}) {
    if (dirty) builder.dirty = true;
    save();
    renderBuilder();
    if (library) renderLibrary();
}

function syncBuilderInputs() {
    $('#lessonTitle').value = builder.title;
    $('#lessonLevel').value = builder.level;
    $('#lessonType').value = builder.type;
    const tSel = $('#lessonTarget');
    if (![...tSel.options].some(o => Number(o.value) === builder.target)) {
        tSel.insertAdjacentHTML('beforeend', `<option value="${builder.target}">${builder.target} דק׳</option>`);
    }
    tSel.value = String(builder.target);
    $('#lessonNotes').value = builder.notes;
    $('#lessonNotes').hidden = !builder.notes;
}

function addExerciseToLesson(id, { phase = null, index = null } = {}) {
    const ex = findExercise(id);
    if (!ex) return;
    const item = makeItemFromExercise(ex);
    if (phase) item.phase = phase;
    const [s, e] = phaseBounds(item.phase);
    const at = index == null ? e : Math.min(Math.max(index, s), e);
    builder.items.splice(at, 0, item);
    ui.newItemUid = item.uid;
    commitBuilder();
    flashLibraryCard(id);
    if (isCompact() && ui.pane === 'library') {
        const badge = $('#paneBadge');
        badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
        const ph = PHASES[phaseRank(item.phase)];
        toast(`נוסף ל${ph.label}: ${splitName(ex.name).he}`, { action: { label: 'לשיעור', fn: () => setPane('lesson') }, timeout: 2200, key: 'added' });
    }
}

function addRest() {
    const item = normalizeItem({ uid: uid('it'), kind: 'rest', duration: clampDur($('#restDuration').value), phase: 'main' });
    const [, e] = phaseBounds('main');
    builder.items.splice(e, 0, item);
    ui.newItemUid = item.uid;
    commitBuilder({ library: false });
}

function removeItem(u) {
    const idx = itemIndex(u);
    if (idx < 0) return;
    const [removed] = builder.items.splice(idx, 1);
    ui.openMore.delete(u);
    commitBuilder();
    toast(`הוסר: ${splitName(removed.name).he}`, {
        action: { label: 'ביטול', fn: () => { builder.items.splice(Math.min(idx, builder.items.length), 0, removed); builder.items = normalizePhases(builder.items); commitBuilder(); } },
        timeout: 4000, key: 'removed'
    });
}

/* חץ למעלה/למטה: מחליף מקום עם השכן, ובקצה של חלק – עובר לחלק הסמוך */
function moveItem(u, dir) {
    const i = itemIndex(u);
    if (i < 0) return;
    const it = builder.items[i];
    const j = i + dir;
    if (j >= 0 && j < builder.items.length && builder.items[j].phase === it.phase) {
        [builder.items[i], builder.items[j]] = [builder.items[j], builder.items[i]];
    } else {
        const r = phaseRank(it.phase) + dir;
        if (r < 0 || r >= PHASES.length) return;
        it.phase = PHASE_KEYS[r];
    }
    ui.newItemUid = u;
    commitBuilder({ library: false });
}

function setItemPhase(u, phase) {
    const i = itemIndex(u);
    if (i < 0 || builder.items[i].phase === phase) return;
    const [it] = builder.items.splice(i, 1);
    const later = phaseRank(phase) > phaseRank(it.phase);
    it.phase = phase;
    const [s, e] = phaseBounds(phase);
    builder.items.splice(later ? s : e, 0, it);
    ui.newItemUid = u;
    commitBuilder({ library: false });
}

function changeDuration(u, delta) {
    const it = getItem(u);
    if (!it) return;
    it.duration = clampDur(it.duration + delta);
    commitBuilder({ library: false });
}

function duplicateItem(u) {
    const i = itemIndex(u);
    if (i < 0) return;
    const copy = Object.assign(clone(builder.items[i]), { uid: uid('it') });
    builder.items.splice(i + 1, 0, copy);
    ui.newItemUid = copy.uid;
    commitBuilder();
}

/* החלפה בתרגיל דומה – אותה קטגוריה, רמה מתאימה ועדיפות לאותו אזור בגוף */
function swapItem(u) {
    const i = itemIndex(u);
    const it = builder.items[i];
    if (!it || it.kind === 'rest') return;
    const inLesson = new Set(builder.items.map(x => x.exId));
    const cur = findExercise(it.exId);
    const maxLvl = builder.level === 'כל הרמות' ? 3 : levelRank(builder.level);
    let pool = libraryAll().filter(ex => ex.category === it.category && !inLesson.has(String(ex.id)));
    const byLevel = pool.filter(ex => levelRank(ex.level) <= maxLvl);
    if (byLevel.length) pool = byLevel;
    if (cur && cur.focus && cur.focus.length) {
        const byFocus = pool.filter(ex => (ex.focus || []).some(f => cur.focus.includes(f)));
        if (byFocus.length) pool = byFocus;
    }
    if (!pool.length) { toast('לא נמצא תרגיל חלופי מאותה קטגוריה', { type: 'warn' }); return; }
    const ex = pool[Math.floor(Math.random() * pool.length)];
    const old = clone(it);
    const fresh = Object.assign(makeItemFromExercise(ex), { uid: it.uid, phase: it.phase });
    builder.items[i] = fresh;
    ui.newItemUid = fresh.uid;
    commitBuilder();
    toast(`הוחלף ב: ${splitName(ex.name).he}`, {
        action: { label: 'ביטול', fn: () => { const k = itemIndex(fresh.uid); if (k >= 0) { builder.items[k] = old; commitBuilder(); } } },
        timeout: 4500, key: 'swap'
    });
}

function springChanges(items) {
    const seq = items.filter(i => i.kind !== 'rest' && i.springs && !/ללא/.test(i.springs)).map(i => i.springs);
    let n = 0;
    for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) n++;
    return { count: n, used: seq.length > 0 };
}

function equipmentNeeded(items) {
    const set = new Set();
    items.forEach(it => {
        if (it.kind === 'rest' || !it.equipment) return;
        it.equipment.split(/\s*\+\s*/).forEach(part => {
            const p = part.trim();
            if (p && !/^ללא/.test(p)) set.add(p);
        });
    });
    return [...set];
}

function distribution(items) {
    const sums = {};
    items.forEach(it => { const k = catKey(it.category); sums[k] = (sums[k] || 0) + it.duration; });
    return CAT_KEY_ORDER.filter(k => sums[k]).map(k => ({ key: k, label: CAT_KEY_LABEL[k], minutes: sums[k] }));
}
function distBarHtml(items) {
    const total = sumDur(items) || 1;
    return `<div class="dist-bar" aria-hidden="true">${distribution(items).map(d => `<span class="cat-${d.key}" style="width:${(d.minutes / total) * 100}%"></span>`).join('')}</div>`;
}

function statusHtml() {
    const editing = builder.editingId ? state.lessons.find(l => l.id === builder.editingId) : null;
    let s = editing ? `<span class="pill gold">${icon('pen', 13)}עריכת שיעור שמור</span>` : `<span class="pill">${icon('sparkle', 13)}שיעור חדש</span>`;
    if (builder.dirty && builder.items.length) s += '<span class="unsaved-dot" aria-hidden="true"></span><span>שינויים שלא נשמרו</span>';
    else if (editing && !builder.dirty) s += `<span class="pill ok">${icon('check', 13)}שמור</span>`;
    return s;
}

function statsHtml(items, target) {
    const total = sumDur(items);
    const exCount = items.filter(i => i.kind !== 'rest').length;
    const diff = total - target;
    let cls = '';
    let note = `נותרו ${target - total} דק׳ ליעד`;
    if (!total) note = `יעד: ${target} דקות`;
    else if (Math.abs(diff) <= 2) { cls = 'ok'; note = diff === 0 ? 'בדיוק ביעד ✓' : `קרוב ליעד ✓ (${diff > 0 ? '+' : ''}${diff})`; }
    else if (diff > 2) { cls = 'over'; note = `חריגה של ${diff} דק׳`; }
    const R = 31;
    const C = 2 * Math.PI * R;
    const pct = target ? Math.min(total / target, 1) : 0;
    const dist = distribution(items);
    return `
        <div class="ring ${cls}" role="img" aria-label="${total} מתוך ${target} דקות">
            <svg width="74" height="74" viewBox="0 0 74 74" aria-hidden="true">
                <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D896AA"/><stop offset="1" stop-color="#8E4C69"/></linearGradient></defs>
                <circle class="ring-track" cx="37" cy="37" r="${R}"/>
                <circle class="ring-bar" cx="37" cy="37" r="${R}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(1)}" ${total ? '' : 'style="opacity:0"'}/>
            </svg>
            <div class="ring-center"><b>${total}</b><small>מתוך ${target}′</small></div>
        </div>
        <div class="stats-body">
            <div class="stats-line"><span><b>${exCount}</b> תרגילים${items.length !== exCount ? ` · ${items.length - exCount} מנוחות` : ''}</span><span class="stats-note ${cls}">${note}</span></div>
            ${dist.length ? distBarHtml(items) + `<div class="legend">${dist.map(d => `<span class="cat-${d.key}"><i></i>${d.label} <b>${d.minutes}′</b></span>`).join('')}</div>` : '<div class="legend">הוסיפי תרגילים כדי לראות את חלוקת הזמן</div>'}
        </div>`;
}

function itemHtml(it, i, start, num) {
    const items = builder.items;
    const isRest = it.kind === 'rest';
    const key = catKey(it.category);
    const nm = splitName(it.name);
    const open = ui.openMore.has(it.uid);
    const u = esc(it.uid);
    const upDisabled = i === 0 && phaseRank(it.phase) === 0;
    const downDisabled = i === items.length - 1 && phaseRank(it.phase) === PHASES.length - 1;
    const springs = !isRest && it.springs && !/ללא/.test(it.springs) ? `<span class="springs">${esc(it.springs)}</span>` : '';
    return `
    <li class="lesson-item cat-${key} ${isRest ? 'rest' : ''} ${ui.newItemUid === it.uid ? 'is-new' : ''}" data-uid="${u}">
        <span class="drag-handle" title="גררי כדי לשנות את הסדר" aria-hidden="true">${icon('grip', 16)}</span>
        <span class="idx">${isRest ? icon('moon', 14) : num}</span>
        <div class="item-main">
            <div class="item-name">${isRest ? 'הפסקת מנוחה' : `${esc(nm.he)}${nm.en ? `<span class="nm-en">${esc(nm.en)}</span>` : ''}`}</div>
            <div class="item-sub">
                <span class="time">דק׳ ${start}–${start + it.duration}</span>
                ${!isRest ? `<span class="tag">${esc(catLabel(it.category))}</span>` : ''}
                ${springs}
                ${it.note && !open ? `<span class="note-preview">${icon('pen', 11)}${esc(it.note)}</span>` : ''}
            </div>
        </div>
        <div class="stepper" aria-label="משך">
            <button data-action="dur-dec" data-uid="${u}" aria-label="פחות דקה">−</button>
            <span>${it.duration} ד׳</span>
            <button data-action="dur-inc" data-uid="${u}" aria-label="עוד דקה">+</button>
        </div>
        <div class="item-actions">
            <button class="icon-btn sm" data-action="move-up" data-uid="${u}" ${upDisabled ? 'disabled' : ''} aria-label="הזזה למעלה" title="למעלה">${icon('up')}</button>
            <button class="icon-btn sm" data-action="move-down" data-uid="${u}" ${downDisabled ? 'disabled' : ''} aria-label="הזזה למטה" title="למטה">${icon('down')}</button>
            <button class="icon-btn sm ${open ? 'on' : ''}" data-action="toggle-more" data-uid="${u}" aria-expanded="${open}" aria-label="אפשרויות: הערה, החלפה, שכפול" title="הערה, החלפה ושכפול">${icon('more')}</button>
            <button class="icon-btn sm danger" data-action="remove-item" data-uid="${u}" aria-label="הסרה מהשיעור" title="הסרה">${icon('x')}</button>
        </div>
        ${open ? `
        <div class="item-more">
            <input class="input sm item-note" data-uid="${u}" maxlength="160" value="${esc(it.note)}" placeholder="הערה: מספר חזרות, וריאציה, החלפת קפיצים…">
            <div class="more-row">
                <span class="more-label">חלק בשיעור:</span>
                <div class="seg mini">${PHASES.map(p => `<button type="button" class="${p.key === it.phase ? 'active' : ''}" data-action="set-phase" data-uid="${u}" data-phase="${p.key}">${p.short}</button>`).join('')}</div>
                <span class="spacer"></span>
                ${!isRest && findExercise(it.exId) ? `<button class="btn xs" data-action="ex-info" data-id="${esc(it.exId)}">${icon('eye')}איך עושים?</button>` : ''}
                ${!isRest ? `<button class="btn xs soft" data-action="swap-item" data-uid="${u}">${icon('swap')}החלפה בתרגיל דומה</button>` : ''}
                <button class="btn xs ghost" data-action="dup-item" data-uid="${u}">${icon('copy')}שכפול</button>
            </div>
        </div>` : ''}
    </li>`;
}

function renderPhases() {
    const items = builder.items;
    const startOf = {};
    let t = 0;
    items.forEach(it => { startOf[it.uid] = t; t += it.duration; });
    let num = 0;
    const numOf = {};
    items.forEach(it => { if (it.kind !== 'rest') numOf[it.uid] = ++num; });

    $('#lessonItems').innerHTML = PHASES.map(ph => {
        const its = items.filter(it => it.phase === ph.key);
        const mins = sumDur(its);
        const exN = its.filter(x => x.kind !== 'rest').length;
        const first = its.length ? startOf[its[0].uid] : 0;
        return `
        <section class="phase ph-${ph.key}" data-phase="${ph.key}">
            <header class="phase-head">
                <span class="phase-ico">${icon(ph.icon, 17)}</span>
                <div class="phase-text">
                    <div class="phase-title">${ph.label}</div>
                    <div class="phase-meta">${its.length ? `${exN} תרגילים · דק׳ ${first}–${first + mins}` : ph.hint}</div>
                </div>
                <span class="phase-time">${mins} דק׳</span>
            </header>
            <ol class="phase-list" data-phase="${ph.key}">
                ${its.map(it => itemHtml(it, items.indexOf(it), startOf[it.uid], numOf[it.uid])).join('')}
                <li class="phase-empty">${ph.empty}</li>
            </ol>
        </section>`;
    }).join('');
}

function renderBuilder() {
    const items = builder.items;
    const total = sumDur(items);
    const exCount = items.filter(i => i.kind !== 'rest').length;
    const editing = builder.editingId ? state.lessons.find(l => l.id === builder.editingId) : null;

    $('#lessonStatus').innerHTML = statusHtml();
    $('#lessonStats').innerHTML = statsHtml(items, builder.target);
    $('#emptyLesson').hidden = items.length > 0;
    const hint = $('#sortHint');
    hint.hidden = items.length < 2;
    hint.innerHTML = `${icon('grip')}גררי את הידית כדי לסדר את השיעור מההתחלה ועד הסוף — גם בין החלקים — או השתמשי בחיצים.`;
    renderPhases();

    if (ui.newItemUid) {
        const li = document.querySelector(`.lesson-item[data-uid="${CSS.escape(ui.newItemUid)}"]`);
        if (li && (!isCompact() || ui.pane === 'lesson')) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        ui.newItemUid = null;
    }

    let checks = '';
    if (exCount) {
        const has = k => items.some(i => i.phase === k && i.kind !== 'rest');
        const diff = total - builder.target;
        const c = [
            { ok: has('open'), label: 'פתיחה וחימום' },
            { ok: has('main'), label: 'חלק מרכזי' },
            { ok: has('close'), label: 'סיום ושחרור' },
            { ok: Math.abs(diff) <= 2, label: 'משך תואם ליעד' }
        ];
        checks = c.map(x => `<span class="check ${x.ok ? 'ok' : ''}">${icon(x.ok ? 'check' : 'circle', 13)}${x.label}</span>`).join('');
        const sc = springChanges(items);
        if (sc.used) checks += `<span class="check info">החלפות קפיצים: ${sc.count}</span>`;
    }
    $('#lessonChecks').innerHTML = checks;

    $('#lessonFoot').innerHTML = editing
        ? `<button class="btn primary" data-action="save-lesson">${icon('check')}עדכון השיעור</button>
           <button class="btn" data-action="save-as-new" title="שמירת עותק כשיעור נפרד">${icon('copy')}שמירה כחדש</button>`
        : `<button class="btn primary single" data-action="save-lesson">שמירת השיעור 🌸</button>`;

    $('#paneBadge').textContent = items.length ? `${exCount} · ${total}′` : '0';
}

function builderAsLesson() {
    return {
        id: builder.editingId || 'draft',
        title: builder.title.trim() || 'שיעור ללא שם',
        level: builder.level, type: builder.type, target: builder.target, notes: builder.notes,
        items: builder.items
    };
}

function saveLesson(asNew = false) {
    if (!builder.items.length) {
        toast('אי אפשר לשמור שיעור ריק — הוסיפי לפחות תרגיל אחד', { type: 'warn' });
        return;
    }
    let title = builder.title.trim() || 'שיעור ללא שם';
    const now = Date.now();
    const existing = builder.editingId && !asNew ? state.lessons.find(l => l.id === builder.editingId) : null;
    if (asNew && builder.editingId) {
        const orig = state.lessons.find(l => l.id === builder.editingId);
        if (orig && orig.title === title) title += ' (עותק)';
    }
    const data = { title, level: builder.level, type: builder.type, target: builder.target, notes: builder.notes.trim(), items: clone(builder.items) };

    if (existing) {
        Object.assign(existing, data, { updatedAt: now });
        state.events.forEach(ev => { if (ev.lessonId === existing.id) ev.title = title; });
        toast(`השיעור "${title}" עודכן 🌸`);
    } else {
        const lesson = Object.assign({ id: uid('lesson') }, data, { createdAt: now, updatedAt: now });
        state.lessons.unshift(lesson);
        builder.editingId = lesson.id;
        toast(`השיעור "${title}" נשמר 🌸`, { action: { label: 'שיבוץ בלוח', fn: () => openScheduleModal({ lessonId: lesson.id }) }, timeout: 5000 });
    }
    builder.title = title;
    $('#lessonTitle').value = title;
    builder.dirty = false;
    save();
    renderAll();
}

async function confirmDiscard(message) {
    if (!builder.dirty || !builder.items.length) return true;
    return confirmDialog({ title: 'יש שינויים שלא נשמרו', message, okLabel: 'להמשיך בכל זאת' });
}

async function newLesson() {
    if (!(await confirmDiscard('בשיעור שבבנייה יש שינויים שלא נשמרו. להתחיל שיעור חדש ולוותר עליהם?'))) return;
    builder = newBuilder();
    state.draft = builder;
    ui.openMore.clear();
    save();
    syncBuilderInputs();
    renderAll();
    setView('builder');
    setPane('library');
    $('#lessonTitle').focus();
    $('#lessonTitle').select();
}

async function clearLesson() {
    if (!builder.items.length) return;
    const ok = await confirmDialog({ title: 'ניקוי השיעור', message: 'להסיר את כל התרגילים מהשיעור שבבנייה?', okLabel: 'ניקוי', danger: true });
    if (!ok) return;
    builder.items = [];
    ui.openMore.clear();
    commitBuilder();
}

/* ---------- טיוטה אוטומטית ---------- */
function generateDraft({ type, target, withRest, level, focus }) {
    const lib = libraryAll();
    const maxLvl = level === 'כל הרמות' ? 2 : levelRank(level);
    const mainCats = type === 'mat' ? ['פילאטיס מזרן', 'פילאטיס עם אביזרים']
        : type === 'reformer' ? ['פילאטיס מכשיר']
            : ['פילאטיס מזרן', 'פילאטיס מכשיר', 'פילאטיס עם אביזרים'];
    const fitsSide = ex => !needsProps(ex) && (type === 'mat' ? !isMachine(ex) : true);
    const fitsMain = ex => (type === 'mixed' ? !/צ׳ר|קדילאק|בארל|קורקטור/.test(ex.equipment) : type === 'reformer' ? isReformer(ex) : !isMachine(ex));
    const withLevel = pool => { const p = pool.filter(ex => levelRank(ex.level) <= maxLvl); return p.length >= 3 ? p : pool; };
    const prioritized = pool => {
        const f = focus ? shuffle(pool.filter(ex => (ex.focus || []).includes(focus))) : [];
        return f.concat(shuffle(pool.filter(ex => !f.includes(ex))));
    };
    const pick = (pool, budget, caps = {}) => {
        const chosen = [];
        const counts = {};
        let used = 0;
        prioritized(pool).forEach(ex => {
            if (used + ex.duration > budget) return;
            if (caps[ex.category] != null && (counts[ex.category] || 0) >= caps[ex.category]) return;
            chosen.push(ex);
            used += ex.duration;
            counts[ex.category] = (counts[ex.category] || 0) + 1;
        });
        return chosen.sort((a, b) => exerciseOrder(a) - exerciseOrder(b));
    };

    const restMin = withRest && target >= 40 ? 2 : 0;
    const warm = pick(withLevel(lib.filter(ex => ex.category === 'תרגילי חימום' && fitsSide(ex))), Math.max(6, Math.round(target * 0.18)));
    const stretch = pick(withLevel(lib.filter(ex => ex.category === 'תרגילי מתיחות' && fitsSide(ex))), Math.max(5, Math.round(target * 0.14)));
    const warmEn = new Set(warm.map(ex => splitName(ex.name).en.toLowerCase()).filter(Boolean));
    let mainPool = lib.filter(ex => mainCats.includes(ex.category) && fitsMain(ex) && !warmEn.has(splitName(ex.name).en.toLowerCase()));
    if (!mainPool.length) mainPool = lib.filter(ex => mainCats.includes(ex.category));
    const caps = { 'פילאטיס עם אביזרים': type === 'mat' ? 2 : 1 };
    let main = pick(withLevel(mainPool), target - sumDur(warm) - sumDur(stretch) - restMin, caps);
    if (type === 'mixed') main = main.filter(e => !isMachine(e)).concat(main.filter(isMachine));

    const toItems = (arr, phase) => arr.map(ex => Object.assign(makeItemFromExercise(ex), { phase }));
    const mainItems = toItems(main, 'main');
    let mainWithRest = mainItems;
    if (restMin && mainItems.length > 2) {
        const half = Math.ceil(mainItems.length / 2);
        mainWithRest = mainItems.slice(0, half).concat([normalizeItem({ uid: uid('it'), kind: 'rest', duration: restMin, phase: 'main' })], mainItems.slice(half));
    }
    const items = toItems(warm, 'open').concat(mainWithRest, toItems(stretch, 'close'));

    // השלמת דקות שנותרו ליעד – הארכה עדינה של תרגילי החלק המרכזי
    let left = target - sumDur(items);
    const growable = mainItems.length ? mainItems : items.filter(i => i.kind !== 'rest');
    for (let round = 0; left > 0 && round < 3 && growable.length; round++) {
        for (const it of growable) { if (left <= 0) break; it.duration += 1; left--; }
    }
    return items;
}

const isAutoTitle = t => { const s = String(t || '').trim(); return !s || s === DEFAULT_TITLE || /^שיעור (מזרן|רפורמר|משולב) · \d+ דק׳$/.test(s); };

/* מכניס רשימת פריטים מוכנה (טיוטה) לבונה השיעורים – משמש גם את צ'אט ה-AI */
function applyDraftItems(items, opts) {
    Object.assign(builder, { items: normalizePhases(items), type: LESSON_TYPES[opts.type] ? opts.type : builder.type, target: Number(opts.target) || builder.target, level: LEVELS.includes(opts.level) ? opts.level : builder.level, editingId: null });
    if (opts.focus && !builder.notes.trim()) builder.notes = `פוקוס: ${opts.focus}`;
    if (isAutoTitle(builder.title)) builder.title = `שיעור ${LESSON_TYPES[builder.type]} · ${builder.target} דק׳`;
    ui.openMore.clear();
    syncBuilderInputs();
    commitBuilder();
    if (ui.view !== 'builder') setView('builder');
    setPane('lesson');
}

function applyDraft(opts) {
    const items = generateDraft(opts);
    if (!items.length) { toast('לא נמצאו מספיק תרגילים במאגר לטיוטה כזו', { type: 'warn' }); return; }
    applyDraftItems(items, opts);
    toast('הטיוטה מוכנה! עכשיו אפשר להחליף, להזיז ולהתאים 🌸', { action: { label: 'טיוטה אחרת', fn: () => applyDraft(opts) }, timeout: 6000 });
}

function openDraftModal() {
    const typeOpts = Object.keys(LESSON_TYPES).map(k => `<option value="${k}" ${k === builder.type ? 'selected' : ''}>${LESSON_TYPES[k]}</option>`).join('');
    const targetOpts = TARGETS.map(t => `<option value="${t}" ${t === builder.target ? 'selected' : ''}>${t} דקות</option>`).join('');
    const levelOpts = LEVELS.map(l => `<option ${l === builder.level ? 'selected' : ''}>${l}</option>`).join('');
    const focusOpts = `<option value="">בלי פוקוס מיוחד</option>` + FOCUS_AREAS.map(f => `<option>${f}</option>`).join('');
    openModal({
        title: '✨ טיוטה אוטומטית',
        body: `
            <p class="muted">המערכת תרכיב טיוטת שיעור מאוזנת — <b>פתיחה וחימום ← חלק מרכזי ← סיום ושחרור</b> — לפי סוג השיעור, הרמה והזמן. אחר כך הכל פתוח לשינויים.</p>
            <div class="form-row">
                <label class="field"><span>סוג השיעור</span><select class="input" id="drType">${typeOpts}</select></label>
                <label class="field"><span>משך השיעור</span><select class="input" id="drTarget">${targetOpts}</select></label>
            </div>
            <div class="form-row">
                <label class="field"><span>רמה</span><select class="input" id="drLevel">${levelOpts}</select></label>
                <label class="field"><span>פוקוס <small>(לא חובה)</small></span><select class="input" id="drFocus">${focusOpts}</select></label>
            </div>
            <label class="check-field"><input type="checkbox" id="drRest" checked> הפסקת מנוחה קצרה באמצע השיעור</label>
            ${builder.items.length ? '<p class="warn-note">שימי לב: הטיוטה תחליף את התרגילים שכרגע בשיעור.</p>' : ''}`,
        actions: [
            {
                label: '✨ הרכבת טיוטה', className: 'btn primary', onClick: m => {
                    const q = s => m.el.querySelector(s);
                    applyDraft({ type: q('#drType').value, target: Number(q('#drTarget').value), level: q('#drLevel').value, focus: q('#drFocus').value, withRest: q('#drRest').checked });
                }
            },
            { label: 'ביטול', className: 'btn ghost' }
        ]
    });
}

/* ---------- סידור בגרירה (עכבר ומגע) ---------- */
function setupSorting() {
    const root = $('#lessonItems');
    let st = null;

    const scrollBox = () => ['#lessonDrop', '#lessonPanel'].map(s => $(s))
        .find(b => b.scrollHeight > b.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(b).overflowY)) || null;

    root.addEventListener('pointerdown', e => {
        const h = e.target.closest('.drag-handle');
        if (!h || e.button > 0) return;
        const li = h.closest('.lesson-item');
        if (!li) return;
        e.preventDefault();
        // the dragged row moves inside the DOM while sorting, which would drop pointer capture,
        // so movement is tracked on the window instead
        if (h.hasPointerCapture && h.hasPointerCapture(e.pointerId)) h.releasePointerCapture(e.pointerId);
        const r = li.getBoundingClientRect();
        st = { li, id: e.pointerId, y: e.clientY, grab: e.clientY - r.top, box: scrollBox(), raf: 0, changed: false };
        li.classList.add('sorting');
        document.body.classList.add('is-sorting');
        place();
        loop();
    });
    window.addEventListener('pointermove', e => {
        if (!st || e.pointerId !== st.id) return;
        e.preventDefault();
        st.y = e.clientY;
        place();
    }, { passive: false });
    const end = e => { if (st && e.pointerId === st.id) finish(); };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    // stop the page from scrolling under the finger while a row is being dragged
    window.addEventListener('touchmove', e => { if (st) e.preventDefault(); }, { passive: false });

    function place() {
        const y = st.y;
        const li = st.li;
        const lists = [...root.querySelectorAll('.phase-list')];
        let list = lists[0];
        let best = Infinity;
        lists.forEach(l => {
            const r = l.closest('.phase').getBoundingClientRect();
            const d = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
            if (d < best) { best = d; list = l; }
        });
        let before = null;
        for (const o of list.querySelectorAll('.lesson-item')) {
            if (o === li) continue;
            const r = o.getBoundingClientRect();
            if (y < r.top + r.height / 2) { before = o; break; }
        }
        if (!before) before = list.querySelector('.phase-empty');
        if (li.parentElement !== list || li.nextElementSibling !== before) {
            list.insertBefore(li, before);
            st.changed = true;
        }
        li.style.transform = 'none';
        const nr = li.getBoundingClientRect();
        li.style.transform = `translateY(${y - st.grab - nr.top}px) scale(1.02)`;
    }

    function loop() {
        if (!st) return;
        const edge = 60;
        let dy = 0;
        if (st.box) {
            const r = st.box.getBoundingClientRect();
            const foot = $('#lessonFoot');
            const bottom = st.box.contains(foot) ? Math.min(r.bottom, foot.getBoundingClientRect().top) : r.bottom;
            if (st.y < r.top + edge) dy = -(r.top + edge - st.y) / 4;
            else if (st.y > bottom - edge) dy = (st.y - (bottom - edge)) / 4;
            dy = Math.max(-18, Math.min(18, dy));
            if (dy) st.box.scrollTop += dy;
        } else {
            const top = $('.topbar').getBoundingClientRect().bottom + 70;
            const bottom = window.innerHeight - (window.matchMedia('(max-width: 760px)').matches ? 100 : 30);
            if (st.y < top) dy = -(top - st.y) / 4;
            else if (st.y > bottom) dy = (st.y - bottom) / 4;
            dy = Math.max(-18, Math.min(18, dy));
            if (dy) window.scrollBy(0, dy);
        }
        if (dy) place();
        st.raf = requestAnimationFrame(loop);
    }

    function finish() {
        cancelAnimationFrame(st.raf);
        const { li, changed } = st;
        st = null;
        li.classList.remove('sorting');
        li.style.transform = '';
        document.body.classList.remove('is-sorting');
        if (!changed) return;
        const byUid = new Map(builder.items.map(it => [it.uid, it]));
        const next = [];
        root.querySelectorAll('.phase-list').forEach(list => {
            const ph = list.dataset.phase;
            list.querySelectorAll('.lesson-item').forEach(el => {
                const it = byUid.get(el.dataset.uid);
                if (it) { it.phase = ph; next.push(it); }
            });
        });
        if (next.length === builder.items.length) builder.items = next;
        ui.newItemUid = li.dataset.uid;
        commitBuilder({ library: false });
    }
}

/* גרירת תרגיל מהמאגר אל השיעור (מחשב) */
function setupLibraryDrop() {
    const drop = $('#lessonDrop');
    let dragExId = null;
    const clear = () => {
        drop.querySelectorAll('.drop-before, .drop-after').forEach(el => el.classList.remove('drop-before', 'drop-after'));
        drop.querySelectorAll('.phase.drop-target').forEach(el => el.classList.remove('drop-target'));
    };
    const target = e => {
        const li = e.target.closest('.lesson-item');
        const phaseEl = e.target.closest('.phase');
        if (li && phaseEl) {
            const r = li.getBoundingClientRect();
            const after = e.clientY > r.top + r.height / 2;
            const i = itemIndex(li.dataset.uid);
            return { phase: phaseEl.dataset.phase, index: after ? i + 1 : i, li, after, phaseEl };
        }
        if (phaseEl) return { phase: phaseEl.dataset.phase, index: null, phaseEl };
        return { phase: null, index: null };
    };
    document.addEventListener('dragstart', e => {
        const card = e.target.closest && e.target.closest('.ex-card');
        if (!card) return;
        dragExId = card.dataset.exId;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', dragExId);
    });
    document.addEventListener('dragend', () => { dragExId = null; clear(); });
    drop.addEventListener('dragover', e => {
        if (!dragExId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        clear();
        const t = target(e);
        if (t.li) t.li.classList.add(t.after ? 'drop-after' : 'drop-before');
        if (t.phaseEl) t.phaseEl.classList.add('drop-target');
    });
    drop.addEventListener('dragleave', e => { if (!drop.contains(e.relatedTarget)) clear(); });
    drop.addEventListener('drop', e => {
        if (!dragExId) return;
        e.preventDefault();
        const t = target(e);
        clear();
        addExerciseToLesson(dragExId, { phase: t.phase, index: t.index });
        dragExId = null;
    });
}

/* =========================================================
   השיעורים שלי
   ========================================================= */
const getLesson = id => state.lessons.find(l => l.id === id);
const lessonStats = l => ({ total: sumDur(l.items), exCount: l.items.filter(i => i.kind !== 'rest').length });
function nextEventFor(lessonId) {
    const t = todayStr();
    return state.events.filter(e => e.lessonId === lessonId && e.date >= t).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] || null;
}
function lastTaughtFor(lessonId) {
    const t = todayStr();
    return state.events.filter(e => e.lessonId === lessonId && (e.date < t || e.done)).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

function renderLessons() {
    $('#lessonsCount').textContent = state.lessons.length;
    const grid = $('#lessonsGrid');
    if (!state.lessons.length) {
        grid.innerHTML = `
            <div class="lessons-empty card">
                <div class="empty-flower">🌸</div>
                <h3>עוד אין שיעורים שמורים</h3>
                <p class="muted">בני את השיעור הראשון שלך מהמאגר — או התחילי מטיוטה אוטומטית — ושמרי אותו כדי לראות אותו כאן.</p>
                <button class="btn primary" data-action="nav" data-view="builder">${icon('sparkle')}לבניית שיעור</button>
            </div>`;
        return;
    }
    const q = ui.lessonsSearch.trim().toLowerCase();
    let list = state.lessons.filter(l => !q || l.title.toLowerCase().includes(q) || l.notes.toLowerCase().includes(q) || l.items.some(i => i.name.toLowerCase().includes(q)));
    const sorters = {
        updated: (a, b) => b.updatedAt - a.updatedAt,
        title: (a, b) => a.title.localeCompare(b.title, 'he'),
        duration: (a, b) => sumDur(a.items) - sumDur(b.items),
        next: (a, b) => {
            const na = nextEventFor(a.id);
            const nb = nextEventFor(b.id);
            if (!na && !nb) return b.updatedAt - a.updatedAt;
            if (!na) return 1;
            if (!nb) return -1;
            return (na.date + na.time).localeCompare(nb.date + nb.time);
        }
    };
    list = list.slice().sort(sorters[ui.lessonsSort] || sorters.updated);
    if (!list.length) {
        grid.innerHTML = '<p class="lessons-empty muted">לא נמצאו שיעורים מתאימים לחיפוש.</p>';
        return;
    }
    grid.innerHTML = list.map(l => {
        const st = lessonStats(l);
        const next = nextEventFor(l.id);
        const last = lastTaughtFor(l.id);
        const editing = builder.editingId === l.id;
        const id = esc(l.id);
        const names = l.items.filter(i => i.kind !== 'rest').map(i => splitName(i.name).he);
        const preview = names.slice(0, 4).join(' · ') + (names.length > 4 ? ` <b>+${names.length - 4}</b>` : '');
        return `
        <article class="lesson-card">
            <div class="lc-head">
                <h3>${esc(l.title)}</h3>
                <div class="lc-tools">
                    ${editing ? '<span class="pill gold">בעריכה</span>' : ''}
                    <button class="icon-btn sm" data-action="dup-lesson" data-id="${id}" title="שכפול" aria-label="שכפול השיעור">${icon('copy')}</button>
                    <button class="icon-btn sm danger" data-action="delete-lesson" data-id="${id}" title="מחיקה" aria-label="מחיקת השיעור">${icon('trash')}</button>
                </div>
            </div>
            <div class="lc-chips">
                <span class="pill rose">${icon('clock', 13)}${st.total} דק׳</span>
                <span class="pill">${st.exCount} תרגילים</span>
                <span class="pill">${esc(LESSON_TYPES[l.type])}</span>
                <span class="pill">${esc(l.level)}</span>
            </div>
            ${l.notes ? `<p class="lc-notes">${esc(l.notes)}</p>` : ''}
            ${preview ? `<p class="lc-preview">${preview}</p>` : ''}
            ${distBarHtml(l.items)}
            <div class="lc-sched">
                ${next ? `<span>📅 שיבוץ הבא: <b>${relativeDay(next.date) || formatDateMedium(next.date)}${next.time ? ' · ' + next.time : ''}</b>${next.group ? ' · ' + esc(next.group) : ''}</span>` : '<span>עדיין לא משובץ בלוח</span>'}
                ${last ? `<span>הועבר לאחרונה: ${formatDateShort(last.date)}${last.group ? ' · ' + esc(last.group) : ''}</span>` : ''}
            </div>
            <div class="lc-actions">
                <button class="btn sm primary" data-action="edit-lesson" data-id="${id}">${icon('pen')}עריכה</button>
                <button class="btn sm gold" data-action="schedule-lesson" data-id="${id}">${icon('calendar')}שיבוץ</button>
                <button class="btn sm" data-action="view-lesson" data-id="${id}">${icon('eye')}צפייה</button>
            </div>
        </article>`;
    }).join('');
}

function loadIntoBuilder(l) {
    builder = newBuilder();
    Object.assign(builder, {
        editingId: l.id, title: l.title, level: l.level, type: l.type, target: l.target, notes: l.notes,
        items: clone(l.items).map(it => Object.assign(it, { uid: uid('it') })), dirty: false
    });
    state.draft = builder;
    ui.openMore.clear();
    save();
    syncBuilderInputs();
}

async function editLesson(id) {
    const l = getLesson(id);
    if (!l) return;
    if (builder.editingId === id) { setView('builder'); setPane('lesson'); return; }
    if (!(await confirmDiscard('בשיעור שבבנייה יש שינויים שלא נשמרו. לפתוח שיעור אחר במקומו?'))) return;
    loadIntoBuilder(l);
    renderAll();
    setView('builder');
    setPane('lesson');
    toast(`"${l.title}" פתוח לעריכה ✏️`);
}

function duplicateLesson(id) {
    const l = getLesson(id);
    if (!l) return;
    const now = Date.now();
    const copy = Object.assign(clone(l), { id: uid('lesson'), title: l.title + ' (עותק)', createdAt: now, updatedAt: now });
    copy.items.forEach(it => { it.uid = uid('it'); });
    state.lessons.unshift(copy);
    save();
    renderAll();
    toast(`נוצר עותק: "${copy.title}"`);
}

async function deleteLesson(id) {
    const l = getLesson(id);
    if (!l) return;
    const t = todayStr();
    const future = state.events.filter(e => e.lessonId === id && e.date >= t);
    let msg = `למחוק את השיעור "${esc(l.title)}"?`;
    if (future.length) msg += `<br><br>השיעור משובץ ב-${future.length} מועדים עתידיים בלוח — גם הם יוסרו. שיעורים שכבר עברו יישארו בהיסטוריה.`;
    const ok = await confirmDialog({ title: 'מחיקת שיעור', message: msg, okLabel: 'מחיקה', danger: true });
    if (!ok) return;
    state.lessons = state.lessons.filter(x => x.id !== id);
    state.events = state.events.filter(e => !(e.lessonId === id && e.date >= t));
    state.events.forEach(e => { if (e.lessonId === id) e.lessonId = null; });
    if (builder.editingId === id) {
        builder.editingId = null;
        builder.dirty = builder.items.length > 0;
    }
    save();
    renderAll();
    toast('השיעור נמחק');
}

/* ---------- תצוגה / הדפסה / העתקה ---------- */
function lessonSheetHtml(lesson, { full = true } = {}) {
    const st = lessonStats(lesson);
    const equip = equipmentNeeded(lesson.items);
    const sc = springChanges(lesson.items);
    const startOf = {};
    let t = 0;
    lesson.items.forEach(it => { startOf[it.uid] = t; t += it.duration; });
    let n = 0;
    const phasesHtml = PHASES.map(ph => {
        const its = lesson.items.filter(i => i.phase === ph.key);
        if (!its.length) return '';
        const rows = its.map(raw => {
            const it = itemInfo(raw);
            const start = startOf[raw.uid];
            const range = `דק׳ ${start}–${start + it.duration} · ${it.duration} דק׳`;
            if (it.kind === 'rest') {
                return `<li class="cat-rest"><div class="sl-head"><span class="sl-name">☁︎ הפסקת מנוחה</span><span class="sl-time">${range}</span></div>${it.note ? `<p class="sl-note">📝 ${esc(it.note)}</p>` : ''}</li>`;
            }
            n++;
            const nm = splitName(it.name);
            const springs = it.springs && !/ללא/.test(it.springs) ? `<span class="springs">קפיצים: ${esc(it.springs)}</span>` : '';
            const equipment = it.equipment && !/^ללא/.test(it.equipment) ? `<span>${esc(it.equipment)}</span>` : '';
            return `
                <li class="cat-${catKey(it.category)}">
                    <div class="sl-head"><span class="sl-name"><span class="num">${n}.</span>${esc(nm.he)}${nm.en ? `<span class="nm-en">${esc(nm.en)}</span>` : ''}</span><span class="sl-time">${range}</span></div>
                    ${springs || equipment ? `<div class="sl-meta">${springs}${equipment}</div>` : ''}
                    ${full && it.setup ? `<p class="sl-desc"><b>תנוחת מוצא:</b> ${esc(it.setup)}</p>` : ''}
                    ${full && it.stepsList.length ? `<ol class="sl-steps">${it.stepsList.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : (full && it.description ? `<p class="sl-desc">${esc(it.description)}</p>` : '')}
                    ${it.reps ? `<p class="sl-reps">חזרות: ${esc(it.reps)}</p>` : ''}
                    ${it.tipsList.length ? `<p class="sl-tips">${esc((full ? it.tipsList : it.tipsList.slice(0, 2)).join(' · '))}</p>` : ''}
                    ${it.note ? `<p class="sl-note">📝 ${esc(it.note)}</p>` : ''}
                </li>`;
        }).join('');
        return `
            <div class="sheet-phase ph-${ph.key}">
                <div class="sheet-phase-head"><span class="phase-ico">${icon(ph.icon, 15)}</span>${ph.label}<span class="sheet-phase-time">${sumDur(its)} דק׳</span></div>
                <ol class="sheet-list">${rows}</ol>
            </div>`;
    }).join('');
    return `
        <div class="sheet">
            <div class="sheet-head">
                <div class="sheet-brand">EVERYDRAY</div>
                <h2>${esc(lesson.title)}</h2>
                <div class="sheet-meta">
                    <span class="pill rose">${st.total} דק׳</span><span class="pill">${st.exCount} תרגילים</span>
                    <span class="pill">${esc(LESSON_TYPES[lesson.type] || '')}</span><span class="pill">${esc(lesson.level || '')}</span>
                    ${sc.used ? `<span class="pill">החלפות קפיצים: ${sc.count}</span>` : ''}
                </div>
            </div>
            ${lesson.notes ? `<div class="sheet-box"><strong>פוקוס השיעור:</strong> ${esc(lesson.notes)}</div>` : ''}
            ${equip.length ? `<div class="sheet-box"><strong>ציוד להכנה:</strong> ${equip.map(esc).join(' · ')}</div>` : ''}
            ${lesson.items.length ? distBarHtml(lesson.items) : ''}
            ${phasesHtml || '<p class="muted">אין עדיין תרגילים בשיעור.</p>'}
        </div>`;
}

function openLessonView(lesson, { fromBuilder = false } = {}) {
    const actions = [];
    if (!fromBuilder) {
        actions.push(
            { label: 'עריכה', icon: 'pen', className: 'btn primary', onClick: () => { editLesson(lesson.id); } },
            { label: 'שיבוץ בלוח', icon: 'calendar', className: 'btn gold', onClick: () => { openScheduleModal({ lessonId: lesson.id }); } }
        );
    }
    actions.push(
        { label: 'הדפסה', icon: 'print', className: 'btn', onClick: () => { printLesson(lesson); return false; } },
        { label: 'העתקה כטקסט', icon: 'copy', className: 'btn', onClick: () => { copyLessonText(lesson); return false; } }
    );
    openModal({ title: fromBuilder ? 'תצוגה מקדימה' : 'תצוגת שיעור', body: lessonSheetHtml(lesson, { full: true }), actions, size: 'wide' });
}

function printLesson(lesson) {
    $('#printArea').innerHTML = lessonSheetHtml(lesson, { full: false });
    window.print();
}

function lessonText(lesson) {
    const st = lessonStats(lesson);
    const lines = [`🌸 ${lesson.title}`, `${LESSON_TYPES[lesson.type] || ''} · ${lesson.level} · ${st.total} דק׳ · ${st.exCount} תרגילים`];
    if (lesson.notes) lines.push(`פוקוס: ${lesson.notes}`);
    const equip = equipmentNeeded(lesson.items);
    if (equip.length) lines.push(`ציוד: ${equip.join(', ')}`);
    let n = 0;
    PHASES.forEach(ph => {
        const its = lesson.items.filter(i => i.phase === ph.key);
        if (!its.length) return;
        lines.push('', `— ${ph.label} (${sumDur(its)} דק׳) —`);
        its.forEach(it => {
            if (it.kind === 'rest') {
                lines.push(`   ☁︎ מנוחה – ${it.duration} דק׳`);
            } else {
                n++;
                const springs = it.springs && !/ללא/.test(it.springs) ? ` | קפיצים: ${it.springs}` : '';
                lines.push(`${n}. ${it.name} – ${it.duration} דק׳${springs}`);
            }
            if (it.note) lines.push(`   📝 ${it.note}`);
        });
    });
    lines.push('', '— EVERYDRAY');
    return lines.join('\n');
}

function copyText(text, okMsg) {
    const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        toast(ok ? okMsg : 'לא הצלחתי להעתיק אוטומטית', ok ? {} : { type: 'warn' });
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast(okMsg), fallback);
    else fallback();
}
const copyLessonText = lesson => copyText(lessonText(lesson), 'השיעור הועתק — אפשר להדביק בוואטסאפ או בפתקים 📋');

/* =========================================================
   לוח שנה
   ========================================================= */
function eventTitle(e) {
    const l = getLesson(e.lessonId);
    return l ? l.title : (e.title || 'שיעור');
}
const typeClass = e => { const l = getLesson(e.lessonId); return l ? `t-${l.type}` : 't-none'; };
const byTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99');
function eventsByDate() {
    const map = {};
    state.events.forEach(e => { (map[e.date] = map[e.date] || []).push(e); });
    Object.values(map).forEach(arr => arr.sort(byTime));
    return map;
}
function upcomingEvents(limit) {
    const t = todayStr();
    return state.events.filter(e => e.date >= t).sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'))).slice(0, limit);
}
function eventClass(e) {
    const c = [typeClass(e)];
    if (e.done) c.push('done');
    if (e.date < todayStr()) c.push('past');
    return c.join(' ');
}

function renderCalendar() {
    const map = eventsByDate();
    document.querySelectorAll('#calModeSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === ui.calMode));
    if (ui.calMode === 'week') renderWeek(map); else renderMonth(map);
    renderDayPanel(map);
    renderUpcoming();
}

function renderMonth(map) {
    const c = parseDate(ui.calCursor);
    const y = c.getFullYear();
    const m = c.getMonth();
    $('#calTitle').textContent = `${MONTHS[m]} ${y}`;
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
    const today = todayStr();
    let html = DAYS_SHORT.map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < cells; i++) {
        const d = new Date(y, m, 1 - firstDow + i);
        const ds = toDateStr(d);
        const evs = map[ds] || [];
        const cls = ['cal-cell'];
        if (d.getMonth() !== m) cls.push('other');
        if (ds === today) cls.push('today');
        if (ds === ui.selectedDate) cls.push('selected');
        if (d.getDay() === 6) cls.push('weekend');
        const label = `${formatDateLong(ds)}${evs.length ? `, ${evs.length} שיעורים` : ''}`;
        html += `
            <div class="${cls.join(' ')}" data-action="select-day" data-date="${ds}" role="button" tabindex="0" aria-label="${esc(label)}">
                <span class="day-num">${d.getDate()}</span>
                <div class="cell-events">
                    ${evs.slice(0, 3).map(e => `<span class="ev-chip ${eventClass(e)}" title="${esc((e.time ? e.time + ' · ' : '') + eventTitle(e))}">${e.time ? `<b>${e.time}</b> ` : ''}${esc(eventTitle(e))}</span>`).join('')}
                    ${evs.length > 3 ? `<span class="ev-more">+${evs.length - 3} נוספים</span>` : ''}
                </div>
            </div>`;
    }
    $('#calBody').innerHTML = `<div class="cal-grid">${html}</div>`;
    renderCalStats(state.events.filter(e => e.date.slice(0, 7) === ui.calCursor.slice(0, 7)), 'החודש');
}

function renderWeek(map) {
    const sel = parseDate(ui.selectedDate);
    const start = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - sel.getDay());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    $('#calTitle').textContent = start.getMonth() === end.getMonth()
        ? `${start.getDate()}–${end.getDate()} ב${MONTHS[end.getMonth()]}`
        : `${start.getDate()} ב${MONTHS[start.getMonth()]} – ${end.getDate()} ב${MONTHS[end.getMonth()]}`;
    const today = todayStr();
    const weekDates = [];
    let html = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const ds = toDateStr(d);
        weekDates.push(ds);
        const evs = map[ds] || [];
        const cls = ['week-col'];
        if (ds === today) cls.push('today');
        if (ds === ui.selectedDate) cls.push('selected');
        html += `
            <div class="${cls.join(' ')}" data-action="select-day" data-date="${ds}">
                <div class="week-col-head"><span>${DAYS[d.getDay()]}</span><b>${d.getDate()}.${d.getMonth() + 1}</b></div>
                ${evs.map(e => `
                    <div class="week-ev ${eventClass(e)}">
                        <span class="we-time">${e.time || 'ללא שעה'}${e.done ? ' ✓' : ''}</span>
                        <span class="we-title">${esc(eventTitle(e))}</span>
                        ${e.group ? `<span class="we-group">${esc(e.group)}</span>` : ''}
                    </div>`).join('')}
                <button class="week-add" data-action="add-event-day" data-date="${ds}" aria-label="שיבוץ שיעור ל${esc(formatDateMedium(ds))}" title="שיבוץ שיעור ליום הזה">${icon('plus', 16)}</button>
            </div>`;
    }
    $('#calBody').innerHTML = `<div class="week-grid">${html}</div>`;
    renderCalStats(state.events.filter(e => weekDates.includes(e.date)), 'השבוע');
}

function renderCalStats(events, label) {
    if (!events.length) {
        $('#calStats').innerHTML = `אין שיעורים משובצים ${label}. בחרי יום ולחצי “שיבוץ שיעור”.`;
        return;
    }
    const done = events.filter(e => e.done).length;
    const minutes = events.reduce((s, e) => { const l = getLesson(e.lessonId); return s + (l ? sumDur(l.items) : 0); }, 0);
    const teaching = minutes >= 120 ? `<b>${Math.round(minutes / 6) / 10}</b> שעות הדרכה` : `<b>${minutes}</b> דק׳ הדרכה`;
    $('#calStats').innerHTML = `${label}: <b>${events.length}</b> ${events.length === 1 ? 'שיעור' : 'שיעורים'}${minutes ? ` · ${teaching}` : ''}${done ? ` · <b>${done}</b> סומנו כהועברו` : ''}`;
}

function eventCardHtml(e) {
    const l = getLesson(e.lessonId);
    const st = l ? lessonStats(l) : null;
    const id = esc(e.id);
    return `
        <div class="event-card ${typeClass(e)} ${e.done ? 'done' : ''}">
            <div class="ec-top">
                <span class="ec-time">${e.time || 'ללא שעה'}</span>
                ${e.seriesId ? `<span class="pill">${icon('repeat', 12)}שבועי</span>` : ''}
                ${e.done ? `<span class="pill ok">${icon('check', 12)}הועבר</span>` : ''}
                <span class="spacer"></span>
                <button class="icon-btn sm danger" data-action="event-delete" data-id="${id}" aria-label="הסרה מהלוח" title="הסרה מהלוח">${icon('trash')}</button>
            </div>
            <div class="ec-title">${esc(eventTitle(e))}</div>
            <div class="ec-meta">${st ? `${st.total} דק׳ · ${st.exCount} תרגילים · ${esc(LESSON_TYPES[l.type])}` : 'השיעור המקורי נמחק מהארכיון'}${e.group ? ` · ${esc(e.group)}` : ''}</div>
            ${e.note ? `<div class="ec-note">📝 ${esc(e.note)}</div>` : ''}
            <div class="ec-actions">
                ${l ? `<button class="btn xs" data-action="event-view" data-id="${id}">${icon('eye')}לשיעור</button>` : ''}
                <button class="btn xs ${e.done ? 'success' : ''}" data-action="event-done" data-id="${id}">${e.done ? `${icon('check')}הועבר` : 'סימון כהועבר'}</button>
                <a class="btn xs ghost" href="${esc(googleCalUrl(e))}" target="_blank" rel="noopener" title="הוספה ל-Google Calendar">${icon('link')}Google</a>
            </div>
        </div>`;
}

function renderDayPanel(map) {
    const ds = ui.selectedDate;
    const evs = map[ds] || [];
    const rel = relativeDay(ds);
    $('#dayPanel').innerHTML = `
        <div class="day-head">
            <h3>${esc(formatDateLong(ds))}</h3>
            ${rel ? `<span class="pill gold">${rel}</span>` : ''}
        </div>
        ${evs.length ? evs.map(eventCardHtml).join('') : '<p class="day-empty">אין שיעורים מתוכננים ליום הזה.</p>'}
        <button class="btn primary block" data-action="add-event-day" data-date="${ds}">${icon('plus')}שיבוץ שיעור ליום הזה</button>`;
}

function renderUpcoming() {
    const list = upcomingEvents(8);
    const t = todayStr();
    if (!list.length) {
        $('#upcomingList').innerHTML = '<p class="day-empty">אין שיעורים קרובים בלוח.</p>';
        return;
    }
    $('#upcomingList').innerHTML = `<div class="up-list">${list.map(e => {
        const d = parseDate(e.date);
        const rel = relativeDay(e.date);
        return `
            <button class="up-item ${typeClass(e)} ${e.date === t ? 'is-today' : ''}" data-action="select-day" data-date="${e.date}">
                <span class="up-date"><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()].slice(0, 3)}׳</small></span>
                <span class="up-info">
                    <b>${esc(eventTitle(e))}</b>
                    <small>${rel || 'יום ' + DAYS[d.getDay()]}${e.time ? ' · ' + e.time : ''}${e.group ? ' · ' + esc(e.group) : ''}</small>
                </span>
            </button>`;
    }).join('')}</div>`;
}

function selectDay(ds) {
    if (!DATE_RE.test(ds || '')) return;
    ui.selectedDate = ds;
    if (monthStart(ds) !== ui.calCursor) ui.calCursor = monthStart(ds);
    if (ui.view !== 'calendar') setView('calendar');
    renderCalendar();
    if (isCompact()) $('#dayPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function calShift(dir) {
    if (ui.calMode === 'week') {
        ui.selectedDate = addDays(ui.selectedDate, dir * 7);
        ui.calCursor = monthStart(ui.selectedDate);
    } else {
        const c = parseDate(ui.calCursor);
        ui.calCursor = toDateStr(new Date(c.getFullYear(), c.getMonth() + dir, 1));
        const t = todayStr();
        ui.selectedDate = monthStart(t) === ui.calCursor ? t : ui.calCursor;
    }
    renderCalendar();
}

function openScheduleModal({ lessonId = null, date = null } = {}) {
    if (!state.lessons.length) {
        toast('עדיין אין שיעורים שמורים — שמרי שיעור ואז אפשר לשבץ אותו בלוח', { type: 'warn', action: { label: 'לבניית שיעור', fn: () => setView('builder') } });
        return;
    }
    const selId = lessonId || (builder.editingId && getLesson(builder.editingId) ? builder.editingId : state.lessons[0].id);
    const sorted = state.lessons.slice().sort((a, b) => b.updatedAt - a.updatedAt);
    const opts = sorted.map(l => `<option value="${esc(l.id)}" ${l.id === selId ? 'selected' : ''}>${esc(l.title)} · ${sumDur(l.items)} דק׳</option>`).join('');
    const dateVal = date || (ui.selectedDate >= todayStr() ? ui.selectedDate : todayStr());
    openModal({
        title: 'שיבוץ שיעור בלוח 📅',
        body: `
            <label class="field"><span>שיעור</span><select class="input" id="schLesson">${opts}</select></label>
            <div class="form-row">
                <label class="field"><span>תאריך</span><input class="input" type="date" id="schDate" value="${dateVal}" required></label>
                <label class="field"><span>שעה</span><input class="input" type="time" id="schTime" value="${esc(state.prefs.lastTime || '')}"></label>
            </div>
            <label class="field"><span>קבוצה / מיקום <small>(לא חובה)</small></span><input class="input" id="schGroup" maxlength="60" placeholder="למשל: קבוצת בוקר · סטודיו מרכז" value="${esc(state.prefs.lastGroup || '')}"></label>
            <label class="field"><span>חזרה</span>
                <select class="input" id="schRepeat">
                    <option value="1">חד־פעמי</option>
                    <option value="4">כל שבוע · 4 שבועות</option>
                    <option value="8">כל שבוע · 8 שבועות</option>
                    <option value="12">כל שבוע · 12 שבועות</option>
                </select>
            </label>
            <label class="field"><span>הערה <small>(לא חובה)</small></span><input class="input" id="schNote" maxlength="120" placeholder="למשל: להביא כדורים קטנים"></label>`,
        actions: [
            {
                label: 'שיבוץ', icon: 'calendar', className: 'btn primary', onClick: m => {
                    const q = s => m.el.querySelector(s);
                    const lesson = getLesson(q('#schLesson').value);
                    const d = q('#schDate').value;
                    if (!lesson) { toast('בחרי שיעור', { type: 'warn' }); return false; }
                    if (!DATE_RE.test(d)) { toast('בחרי תאריך', { type: 'warn' }); q('#schDate').focus(); return false; }
                    const time = TIME_RE.test(q('#schTime').value) ? q('#schTime').value : '';
                    const group = q('#schGroup').value.trim();
                    const note = q('#schNote').value.trim();
                    const repeat = parseInt(q('#schRepeat').value, 10) || 1;
                    const seriesId = repeat > 1 ? uid('series') : null;
                    for (let k = 0; k < repeat; k++) {
                        state.events.push(normalizeEvent({ id: uid('ev'), lessonId: lesson.id, date: addDays(d, 7 * k), time, group, note, title: lesson.title, seriesId }));
                    }
                    state.prefs.lastTime = time;
                    state.prefs.lastGroup = group;
                    ui.selectedDate = d;
                    ui.calCursor = monthStart(d);
                    save();
                    renderAll();
                    const msg = repeat > 1
                        ? `"${lesson.title}" שובץ ל-${repeat} שבועות, החל מ${formatDateMedium(d)} 🌸`
                        : `"${lesson.title}" שובץ ל${formatDateMedium(d)}${time ? ' בשעה ' + time : ''} 🌸`;
                    toast(msg, ui.view !== 'calendar' ? { action: { label: 'ללוח', fn: () => setView('calendar') }, timeout: 5000 } : {});
                    return true;
                }
            },
            { label: 'ביטול', className: 'btn ghost' }
        ]
    });
}

function toggleEventDone(id) {
    const e = state.events.find(x => x.id === id);
    if (!e) return;
    e.done = !e.done;
    save();
    renderCalendar();
    renderLessons();
    if (e.done) toast('כל הכבוד! השיעור סומן כהועבר ✓');
}

async function deleteEvent(id) {
    const e = state.events.find(x => x.id === id);
    if (!e) return;
    const later = e.seriesId ? state.events.filter(x => x.seriesId === e.seriesId && x.date > e.date) : [];
    if (later.length) {
        const choice = await choiceDialog({
            title: 'הסרת שיבוץ',
            message: `"${esc(eventTitle(e))}" הוא שיבוץ שבועי חוזר. מה להסיר?`,
            choices: [
                { value: 'one', label: 'רק את המועד הזה', className: 'btn' },
                { value: 'series', label: `את זה ואת ${later.length} הבאים`, className: 'btn danger' }
            ]
        });
        if (!choice) return;
        if (choice === 'series') state.events = state.events.filter(x => !(x.seriesId === e.seriesId && x.date >= e.date));
        else state.events = state.events.filter(x => x.id !== id);
    } else {
        const ok = await confirmDialog({ title: 'הסרת שיבוץ', message: `להסיר את "${esc(eventTitle(e))}" מ${formatDateMedium(e.date)}?`, okLabel: 'הסרה', danger: true });
        if (!ok) return;
        state.events = state.events.filter(x => x.id !== id);
    }
    save();
    renderAll();
    toast('השיבוץ הוסר מהלוח');
}

/* ---------- ייצוא ליומן ---------- */
function eventDuration(e) {
    const l = getLesson(e.lessonId);
    return l ? (sumDur(l.items) || l.target || 55) : 55;
}
function eventRange(e) {
    const [h, mi] = e.time.split(':').map(Number);
    const d = parseDate(e.date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi);
    return { start, end: new Date(start.getTime() + eventDuration(e) * 60000) };
}
const icsLocal = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsDate = s => s.replace(/-/g, '');
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const eventSummary = e => `${eventTitle(e)}${e.group ? ' · ' + e.group : ''}`;
function eventDescription(e) {
    const l = getLesson(e.lessonId);
    const parts = [];
    if (e.note) parts.push(`הערה: ${e.note}`);
    if (l) parts.push(lessonText(l));
    return parts.join('\n\n').slice(0, 1500);
}
function foldLine(line) {
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;
    const out = [];
    let cur = '';
    let len = 0;
    for (const ch of line) {
        const l = enc.encode(ch).length;
        if (len + l > (out.length ? 74 : 75)) { out.push(cur); cur = ''; len = 0; }
        cur += ch;
        len += l;
    }
    out.push(cur);
    return out.join('\r\n ');
}
function googleCalUrl(e) {
    let dates;
    if (e.time) { const r = eventRange(e); dates = `${icsLocal(r.start)}/${icsLocal(r.end)}`; }
    else dates = `${icsDate(e.date)}/${icsDate(addDays(e.date, 1))}`;
    const p = new URLSearchParams({ action: 'TEMPLATE', text: eventSummary(e), dates, details: eventDescription(e) });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
function download(name, content, mime) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function exportICS() {
    if (!state.events.length) { toast('אין עדיין שיעורים בלוח לייצוא', { type: 'warn' }); return; }
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EVERYDRAY//Pilates Planner//HE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:EVERYDRAY – שיעורי פילאטיס'];
    state.events.forEach(e => {
        lines.push('BEGIN:VEVENT', `UID:${e.id}@everydray.fit`, `DTSTAMP:${stamp}`);
        if (e.time) { const r = eventRange(e); lines.push(`DTSTART:${icsLocal(r.start)}`, `DTEND:${icsLocal(r.end)}`); }
        else lines.push(`DTSTART;VALUE=DATE:${icsDate(e.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`);
        lines.push(`SUMMARY:${icsEsc(eventSummary(e))}`, `DESCRIPTION:${icsEsc(eventDescription(e))}`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    download('everydray-calendar.ics', lines.map(foldLine).join('\r\n'), 'text/calendar;charset=utf-8');
    toast('קובץ היומן ירד — אפשר לייבא אותו ל-Google Calendar או ליומן של האייפון 📅', { timeout: 5000 });
}

/* ---------- גיבוי ---------- */
function exportBackup() {
    const data = { app: 'everydray', version: 3, exportedAt: new Date().toISOString(), lessons: state.lessons, events: state.events, customExercises: state.customExercises, favorites: state.favorites, videoOverrides: state.videoOverrides };
    download(`everydray-backup-${todayStr()}.json`, JSON.stringify(data, null, 2), 'application/json');
    toast('קובץ הגיבוי ירד 💾 שמרי אותו במקום בטוח');
}
function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        let data;
        try { data = JSON.parse(reader.result); } catch (e) { data = null; }
        if (!data || (!Array.isArray(data.lessons) && !Array.isArray(data.events))) {
            toast('הקובץ לא תקין — בחרי קובץ גיבוי של EVERYDRAY', { type: 'warn' });
            return;
        }
        const incoming = normalizeState(data);
        const lessonIds = new Set(state.lessons.map(l => l.id));
        const eventIds = new Set(state.events.map(e => e.id));
        const exIds = new Set(state.customExercises.map(e => e.id));
        const newLessons = incoming.lessons.filter(l => !lessonIds.has(l.id));
        const newEvents = incoming.events.filter(e => !eventIds.has(e.id));
        const newEx = incoming.customExercises.filter(e => !exIds.has(e.id));
        if (!newLessons.length && !newEvents.length && !newEx.length) { toast('כל הנתונים שבקובץ כבר קיימים כאן ✓'); return; }
        const ok = await confirmDialog({
            title: 'ייבוא גיבוי',
            message: `נמצאו בקובץ <b>${newLessons.length}</b> שיעורים, <b>${newEvents.length}</b> שיבוצים ו-<b>${newEx.length}</b> תרגילים שעוד לא קיימים כאן.<br>הם יתווספו לנתונים הקיימים — שום דבר לא יימחק.`,
            okLabel: 'ייבוא'
        });
        if (!ok) return;
        state.lessons.push(...newLessons);
        state.events.push(...newEvents);
        state.customExercises.push(...newEx);
        state.favorites = [...new Set(state.favorites.concat(incoming.favorites))];
        state.videoOverrides = Object.assign({}, incoming.videoOverrides, state.videoOverrides);
        save();
        renderAll();
        toast('הגיבוי יובא בהצלחה 🌸');
    };
    reader.readAsText(file);
}

/* =========================================================
   חלונות, הודעות וניווט
   ========================================================= */
const modalStack = [];
function openModal({ title, body, actions = [], size = '', onClose = null }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
        <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
            <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="סגירה">${icon('x')}</button></div>
            <div class="modal-body">${body}</div>
            ${actions.length ? '<div class="modal-actions"></div>' : ''}
        </div>`;
    const api = { el: wrap, close };
    let closed = false;
    const prevFocus = document.activeElement;
    function close() {
        if (closed) return;
        closed = true;
        wrap.remove();
        const i = modalStack.indexOf(api);
        if (i >= 0) modalStack.splice(i, 1);
        if (!modalStack.length) document.body.classList.remove('modal-open');
        if (onClose) onClose();
        if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
    }
    const actionsEl = wrap.querySelector('.modal-actions');
    actions.forEach(a => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = a.className || 'btn';
        b.innerHTML = (a.icon ? icon(a.icon) : '') + esc(a.label);
        b.addEventListener('click', () => {
            const r = a.onClick ? a.onClick(api) : undefined;
            if (r !== false) close();
        });
        actionsEl.appendChild(b);
    });
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-close]').addEventListener('click', close);
    wrap.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.matches('input:not([type=checkbox])') && actionsEl) {
            e.preventDefault();
            actionsEl.querySelector('button').click();
        }
    });
    document.getElementById('toastRoot').innerHTML = '';
    document.getElementById('modalRoot').appendChild(wrap);
    document.body.classList.add('modal-open');
    modalStack.push(api);
    const first = wrap.querySelector('.modal-body input:not([type=hidden]):not([type=checkbox]), .modal-body select, .modal-body textarea') || (actionsEl && actionsEl.querySelector('button'));
    if (first && !(isCompact() && first.matches('input, textarea'))) first.focus();
    return api;
}

function confirmDialog({ title = 'אישור', message, okLabel = 'אישור', danger = false }) {
    return new Promise(resolve => {
        let done = false;
        const finish = v => { if (!done) { done = true; resolve(v); } };
        openModal({
            title,
            body: `<p>${message}</p>`,
            actions: [
                { label: okLabel, className: danger ? 'btn danger' : 'btn primary', onClick: () => finish(true) },
                { label: 'ביטול', className: 'btn ghost', onClick: () => finish(false) }
            ],
            onClose: () => finish(false)
        });
    });
}

function choiceDialog({ title, message, choices }) {
    return new Promise(resolve => {
        let done = false;
        const finish = v => { if (!done) { done = true; resolve(v); } };
        openModal({
            title,
            body: `<p>${message}</p>`,
            actions: choices.map(c => ({ label: c.label, className: c.className, onClick: () => finish(c.value) }))
                .concat([{ label: 'ביטול', className: 'btn ghost', onClick: () => finish(null) }]),
            onClose: () => finish(null)
        });
    });
}

function toast(msg, { type = 'info', action = null, timeout = 3200, key = null } = {}) {
    const root = document.getElementById('toastRoot');
    if (key) root.querySelectorAll(`.toast[data-key="${key}"]`).forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = `toast ${type === 'warn' ? 'warn' : ''}`;
    if (key) el.dataset.key = key;
    el.innerHTML = `<span>${esc(msg)}</span>`;
    const remove = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
    if (action) {
        const b = document.createElement('button');
        b.textContent = action.label;
        b.addEventListener('click', () => { remove(); action.fn(); });
        el.appendChild(b);
    }
    root.appendChild(el);
    while (root.children.length > 3) root.firstElementChild.remove();
    setTimeout(remove, timeout);
}

function renderHero() {
    const h = new Date().getHours();
    const greet = h >= 5 && h < 12 ? 'בוקר טוב' : h >= 12 && h < 17 ? 'צהריים טובים' : h >= 17 && h < 22 ? 'ערב טוב' : 'לילה טוב';
    $('#heroGreeting').textContent = `${greet} 🌸`;
    const t = todayStr();
    const d = parseDate(t);
    const ws = toDateStr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()));
    const we = addDays(ws, 6);
    const week = state.events.filter(e => e.date >= ws && e.date <= we).length;
    const next = upcomingEvents(1)[0];
    $('#heroStats').innerHTML = `
        <button class="stat-pill" data-action="nav" data-view="lessons"><span class="stat-ico">${icon('book', 15)}</span><span><b>${state.lessons.length}</b> ${state.lessons.length === 1 ? 'שיעור שמור' : 'שיעורים שמורים'}</span></button>
        <button class="stat-pill" data-action="nav" data-view="calendar"><span class="stat-ico">${icon('calendar', 15)}</span><span><b>${week}</b> ${week === 1 ? 'שיעור' : 'שיעורים'} השבוע</span></button>
        ${next ? `<button class="stat-pill accent" data-action="select-day" data-date="${next.date}"><span class="stat-ico">${icon('clock', 15)}</span><span>הבא: <b>${relativeDay(next.date) || formatDateShort(next.date)}${next.time ? ' · ' + next.time : ''}</b> · ${esc(eventTitle(next))}</span></button>` : ''}`;
}

function setView(v) {
    if (!VIEWS.includes(v)) v = 'builder';
    const changed = ui.view !== v;
    ui.view = v;
    state.prefs.view = v;
    save();
    document.body.dataset.view = v;
    document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === `view-${v}`));
    document.querySelectorAll('.nav-btn').forEach(b => {
        const on = b.dataset.view === v;
        b.classList.toggle('active', on);
        if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (v === 'lessons') renderLessons();
    if (v === 'calendar') renderCalendar();
    if (v === 'builder') renderHero();
    if (changed) window.scrollTo({ top: 0 });
}

function setPane(p) {
    ui.pane = p === 'lesson' ? 'lesson' : 'library';
    $('#builderGrid').dataset.pane = ui.pane;
    document.querySelectorAll('.pane-switch button').forEach(b => {
        const on = b.dataset.pane === ui.pane;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on);
    });
    if (isCompact()) window.scrollTo({ top: 0 });
}

function renderAll() {
    $('#lessonsCount').textContent = state.lessons.length;
    renderHero();
    renderLibrary();
    renderBuilder();
    renderLessons();
    renderCalendar();
}

/* =========================================================
   אירועים
   ========================================================= */
const actions = {
    'nav': el => setView(el.dataset.view),
    'pane': el => setPane(el.dataset.pane),
    'toggle-ex': el => {
        const id = el.dataset.id;
        const open = !ui.expanded.has(id);
        if (open) ui.expanded.add(id); else ui.expanded.delete(id);
        const card = el.closest('.ex-card');
        const box = card.querySelector('.ex-details');
        const ex = findExercise(id);
        box.innerHTML = open && ex ? exerciseDetailHtml(ex) : '';
        card.classList.toggle('open', open);
        el.setAttribute('aria-expanded', open);
        if (open) mountDemos(box);
    },
    'ex-info': el => openExerciseModal(el.dataset.id),
    'play-video': el => playVideo(el),
    'set-video': el => setVideo(el.dataset.id),
    'add-ex': el => addExerciseToLesson(el.dataset.id),
    'fav': el => toggleFav(el.dataset.id),
    'filter-cat': el => { ui.cat = el.dataset.cat; renderLibrary(); $('#exerciseList').scrollTop = 0; },
    'new-custom': () => openCustomExerciseModal(),
    'edit-custom': el => openCustomExerciseModal(el.dataset.id),
    'delete-custom': el => deleteCustomExercise(el.dataset.id),

    'add-rest': () => addRest(),
    'dur-inc': el => changeDuration(el.dataset.uid, 1),
    'dur-dec': el => changeDuration(el.dataset.uid, -1),
    'move-up': el => moveItem(el.dataset.uid, -1),
    'move-down': el => moveItem(el.dataset.uid, 1),
    'toggle-more': el => {
        const u = el.dataset.uid;
        if (ui.openMore.has(u)) ui.openMore.delete(u); else ui.openMore.add(u);
        renderBuilder();
        const input = document.querySelector(`.item-note[data-uid="${CSS.escape(u)}"]`);
        if (input && !isCompact()) input.focus();
    },
    'set-phase': el => setItemPhase(el.dataset.uid, el.dataset.phase),
    'swap-item': el => swapItem(el.dataset.uid),
    'dup-item': el => duplicateItem(el.dataset.uid),
    'remove-item': el => removeItem(el.dataset.uid),
    'toggle-notes': () => { const n = $('#lessonNotes'); n.hidden = !n.hidden; if (!n.hidden) n.focus(); },
    'open-draft': () => openDraftModal(),
    'clear-lesson': () => clearLesson(),
    'new-lesson': () => newLesson(),
    'save-lesson': () => saveLesson(false),
    'save-as-new': () => saveLesson(true),
    'preview-builder': () => openLessonView(builderAsLesson(), { fromBuilder: true }),

    'view-lesson': el => { const l = getLesson(el.dataset.id); if (l) openLessonView(l); },
    'edit-lesson': el => editLesson(el.dataset.id),
    'schedule-lesson': el => openScheduleModal({ lessonId: el.dataset.id }),
    'dup-lesson': el => duplicateLesson(el.dataset.id),
    'delete-lesson': el => deleteLesson(el.dataset.id),

    'cal-prev': () => calShift(-1),
    'cal-next': () => calShift(1),
    'cal-today': () => { ui.selectedDate = todayStr(); ui.calCursor = monthStart(ui.selectedDate); renderCalendar(); },
    'cal-mode': el => { ui.calMode = el.dataset.mode; state.prefs.calMode = ui.calMode; save(); renderCalendar(); },
    'select-day': el => selectDay(el.dataset.date),
    'add-event-day': el => { ui.selectedDate = el.dataset.date; renderCalendar(); openScheduleModal({ date: el.dataset.date }); },
    'event-view': el => { const e = state.events.find(x => x.id === el.dataset.id); const l = e && getLesson(e.lessonId); if (l) openLessonView(l); },
    'event-done': el => toggleEventDone(el.dataset.id),
    'event-delete': el => deleteEvent(el.dataset.id),
    'export-ics': () => exportICS(),

    'export-backup': () => exportBackup(),
    'import-backup': () => $('#importFile').click()
};

function bindEvents() {
    document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        if (!el || el.disabled) return;
        const fn = actions[el.dataset.action];
        if (fn) fn(el, e);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modalStack.length) { modalStack[modalStack.length - 1].close(); return; }
        const el = e.target;
        if ((e.key === 'Enter' || e.key === ' ') && el.matches && el.matches('[role="button"][data-action]')) {
            e.preventDefault();
            el.click();
        }
        if (e.key === '/' && !modalStack.length && !/INPUT|TEXTAREA|SELECT/.test(el.tagName) && ui.view === 'builder') {
            e.preventDefault();
            setPane('library');
            $('#searchInput').focus();
        }
    });

    let searchTimer = null;
    document.addEventListener('input', e => {
        const t = e.target;
        if (t.id === 'searchInput') {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { ui.search = t.value; renderLibrary(); }, 120);
        } else if (t.id === 'lessonTitle') {
            builder.title = t.value;
            builder.dirty = true;
            save();
            $('#lessonStatus').innerHTML = statusHtml();
        } else if (t.id === 'lessonNotes') {
            builder.notes = t.value;
            builder.dirty = true;
            save();
        } else if (t.classList.contains('item-note')) {
            const it = getItem(t.dataset.uid);
            if (it) { it.note = t.value; builder.dirty = true; save(); }
        } else if (t.id === 'lessonsSearch') {
            ui.lessonsSearch = t.value;
            renderLessons();
        }
    });

    document.addEventListener('change', e => {
        const t = e.target;
        if (t.id === 'lessonLevel') { builder.level = t.value; commitBuilder({ library: false }); }
        else if (t.id === 'lessonType') { builder.type = t.value; commitBuilder({ library: false }); }
        else if (t.id === 'lessonTarget') { builder.target = Number(t.value) || 50; commitBuilder({ library: false }); }
        else if (t.id === 'levelFilter') { ui.level = t.value; renderLibrary(); }
        else if (t.id === 'focusFilter') { ui.focus = t.value; renderLibrary(); }
        else if (t.id === 'lessonsSort') { ui.lessonsSort = t.value; renderLessons(); }
        else if (t.id === 'importFile') { importBackup(t.files && t.files[0]); t.value = ''; }
        else if (t.id === 'lessonNotes' && !t.value.trim()) { t.hidden = true; }
    });

    window.addEventListener('storage', e => {
        if (e.key === STORAGE_KEY) toast('הנתונים עודכנו בלשונית אחרת — רענני את הדף כדי לראות את הגרסה העדכנית', { timeout: 6000 });
    });
}

/* =========================================================
   אתחול
   ========================================================= */
function init() {
    document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));
    $('#lessonLevel').innerHTML = LEVELS.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
    $('#lessonType').innerHTML = Object.keys(LESSON_TYPES).map(k => `<option value="${k}">${LESSON_TYPES[k]}</option>`).join('');
    $('#lessonTarget').innerHTML = TARGETS.map(t => `<option value="${t}">${t} דק׳</option>`).join('');
    $('#levelFilter').innerHTML = `<option value="all">כל הרמות</option>` + EX_LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');
    $('#focusFilter').innerHTML = `<option value="all">כל אזורי הגוף</option>` + FOCUS_AREAS.map(f => `<option value="${f}">${f}</option>`).join('');
    $('#lessonsSort').value = ui.lessonsSort;

    syncBuilderInputs();
    bindEvents();
    setupSorting();
    setupLibraryDrop();
    renderAll();
    setView(ui.view);
    save();
}

document.addEventListener('DOMContentLoaded', init);
