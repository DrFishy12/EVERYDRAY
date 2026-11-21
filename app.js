/* =========================================================
   EVERYDRAY – בניית שיעורי פילאטיס ולוח שנה
   כל הנתונים נשמרים בדפדפן (localStorage).
   ========================================================= */
'use strict';

/* ---------- קבועים ---------- */
const STORAGE_KEY = 'everydray_v2';
const LEGACY_LESSONS_KEY = 'everydray_savedLessons';
const LEGACY_CALENDAR_KEY = 'everydray_calendarData';

const CAT = {
    'תרגילי חימום': { key: 'warm', label: 'חימום' },
    'פילאטיס מזרן': { key: 'mat', label: 'מזרן' },
    'פילאטיס מכשיר': { key: 'reformer', label: 'מכשיר' },
    'תרגילי מתיחות': { key: 'stretch', label: 'מתיחות' },
    'התאוששות': { key: 'rest', label: 'מנוחה' }
};
const CATEGORY_LIST = ['תרגילי חימום', 'פילאטיס מזרן', 'פילאטיס מכשיר', 'תרגילי מתיחות'];
const REST_CATEGORY = 'התאוששות';
const LEVELS = ['כל הרמות', 'מתחילות', 'בינוניות', 'מתקדמות'];
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
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    repeat: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
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
const catKey = c => (CAT[c] ? CAT[c].key : 'mat');
const catLabel = c => (CAT[c] ? CAT[c].label : (c || ''));
const isReformer = x => /רפורמר/.test((x && x.equipment) || '');
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
    return { version: 2, lessons: [], events: [], customExercises: [], favorites: [], draft: null, prefs: { view: 'builder', calMode: 'month', lastTime: '18:00', lastGroup: '' } };
}

function normalizeItem(it) {
    if (!it || typeof it !== 'object') return null;
    const base = {
        uid: String(it.uid || it.uniqueId || uid('it')),
        duration: clampDur(it.duration),
        note: String(it.note || '')
    };
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
    const items = l.items.map(normalizeItem).filter(Boolean);
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
        category: CATEGORY_LIST.includes(e.category) ? e.category : 'פילאטיס מזרן',
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
    out.draft = s.draft && typeof s.draft === 'object' ? s.draft : null;
    if (s.prefs && typeof s.prefs === 'object') Object.assign(out.prefs, s.prefs);
    return out;
}

/* המרה מהגרסה הקודמת של האתר (שיעורים + לוח של נובמבר 2026) */
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
    b.items = Array.isArray(d.items) ? d.items.map(normalizeItem).filter(Boolean) : [];
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
    expanded: new Set(),
    openNotes: new Set(),
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
    return typeof ex.id === 'number' ? ex.id : 1000 + state.customExercises.indexOf(ex);
}

function renderChips() {
    const chips = [
        { cat: 'all', label: 'הכל' },
        ...CATEGORY_LIST.map(c => ({ cat: c, label: catLabel(c), key: catKey(c) })),
        { cat: 'fav', label: '★ מועדפים' },
        { cat: 'mine', label: 'התרגילים שלי' }
    ];
    $('#categoryChips').innerHTML = chips.map(c => `
        <button class="chip ${c.key ? 'cat-' + c.key : ''} ${ui.cat === c.cat ? 'active' : ''}" data-action="filter-cat" data-cat="${esc(c.cat)}" aria-pressed="${ui.cat === c.cat}">
            ${c.key ? '<span class="dot"></span>' : ''}${esc(c.label)}
        </button>`).join('');
}

function filteredLibrary() {
    const q = ui.search.trim().toLowerCase();
    return libraryAll().filter(ex => {
        if (ui.cat === 'fav' && !isFav(ex.id)) return false;
        if (ui.cat === 'mine' && !ex.custom) return false;
        if (CATEGORY_LIST.includes(ui.cat) && ex.category !== ui.cat) return false;
        if (!q) return true;
        return [ex.name, ex.target, ex.description, ex.tips, ex.muscles, ex.springs, ex.equipment, ex.category]
            .some(f => String(f || '').toLowerCase().includes(q));
    });
}

function renderLibrary() {
    renderChips();
    const list = filteredLibrary();
    const total = libraryAll().length;
    $('#libraryCount').textContent = list.length === total ? `${total} תרגילים במאגר` : `מוצגים ${list.length} מתוך ${total} תרגילים`;

    const counts = {};
    builder.items.forEach(it => { if (it.exId) counts[it.exId] = (counts[it.exId] || 0) + 1; });

    const el = $('#exerciseList');
    if (!list.length) {
        let msg = 'לא נמצאו תרגילים מתאימים לחיפוש.';
        let extra = '';
        if (ui.cat === 'fav' && !ui.search) msg = 'עוד לא סימנת מועדפים. לחצי על ☆ ליד תרגיל כדי לשמור אותו כאן לגישה מהירה.';
        if (ui.cat === 'mine' && !ui.search) {
            msg = 'עוד אין לך תרגילים משלך. אפשר להוסיף כל תרגיל מהרפרטואר שלך — עם הסבר, דגשים, קפיצים וקישור לסרטון.';
            extra = `<button class="btn sm primary" data-action="new-custom">${icon('plus')}הוספת תרגיל</button>`;
        }
        el.innerHTML = `<div class="lib-empty"><p>${msg}</p>${extra}</div>`;
        return;
    }

    el.innerHTML = list.map(ex => {
        const id = String(ex.id);
        const key = catKey(ex.category);
        const open = ui.expanded.has(id);
        const n = counts[id] || 0;
        const fav = isFav(id);
        return `
        <article class="ex-card cat-${key} ${open ? 'open' : ''}" draggable="true" data-ex-id="${esc(id)}">
            <div class="ex-row">
                <button class="ex-title" data-action="toggle-ex" data-id="${esc(id)}" aria-expanded="${open}">
                    <h4>${esc(ex.name)}</h4>
                    <div class="ex-sub"><span class="tag">${esc(catLabel(ex.category))}</span>${ex.custom ? '<span class="tag" style="--cat-bg:var(--accent-light);--cat-color:var(--accent-dark)">שלי</span>' : ''}<span>${esc(ex.target)}</span></div>
                </button>
                <div class="ex-side">
                    ${n ? `<span class="in-lesson">${n > 1 ? '×' + n + ' ' : ''}בשיעור</span>` : ''}
                    <span class="ex-dur">${ex.duration} ד׳</span>
                    <button class="icon-btn sm fav-btn ${fav ? 'on' : ''}" data-action="fav" data-id="${esc(id)}" aria-pressed="${fav}" aria-label="${fav ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}" title="${fav ? 'הסרה מהמועדפים' : 'הוספה למועדפים'}">${icon('star')}</button>
                    <button class="add-btn" data-action="add-ex" data-id="${esc(id)}" aria-label="הוספת ${esc(ex.name)} לשיעור" title="הוספה לשיעור">${icon('plus')}</button>
                </div>
            </div>
            <div class="ex-details">
                ${ex.description ? `<p class="ex-desc">${esc(ex.description)}</p>` : ''}
                ${ex.tips ? `<p class="ex-tips">${esc(ex.tips)}</p>` : ''}
                ${ex.muscles ? `<p class="ex-muscles"><b>שרירים עובדים:</b> ${esc(ex.muscles)}</p>` : ''}
                <div class="ex-meta">
                    <span class="ex-springs">קפיצים: ${esc(ex.springs || '—')}</span>
                    <span class="ex-equipment">אביזרים: ${esc(ex.equipment || '—')}</span>
                    ${safeUrl(ex.videoUrl) ? `<a href="${esc(safeUrl(ex.videoUrl))}" target="_blank" rel="noopener">צפייה בסרטון הסבר 📺</a>` : ''}
                </div>
                ${ex.custom ? `<div class="ex-own-actions">
                    <button class="btn sm" data-action="edit-custom" data-id="${esc(id)}">${icon('pen')}עריכה</button>
                    <button class="btn sm ghost" data-action="delete-custom" data-id="${esc(id)}">${icon('trash')}מחיקה</button>
                </div>` : ''}
            </div>
        </article>`;
    }).join('');
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
function uniqueValues(field) {
    return [...new Set(libraryAll().map(e => e[field]).filter(Boolean))];
}

function openCustomExerciseModal(id = null) {
    const ex = id ? state.customExercises.find(e => e.id === id) : null;
    const v = ex || { name: '', category: 'פילאטיס מזרן', target: '', duration: 4, springs: 'ללא קפיצים', equipment: 'ללא אביזרים (מזרן)', description: '', tips: '', muscles: '', videoUrl: '' };
    const body = `
        <label class="field"><span>שם התרגיל *</span><input class="input" id="cxName" maxlength="80" value="${esc(v.name)}" placeholder="למשל: גשר על כדור (Bridge on Ball)"></label>
        <div class="form-row">
            <label class="field"><span>קטגוריה</span><select class="input" id="cxCat">${CATEGORY_LIST.map(c => `<option value="${esc(c)}" ${c === v.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
            <label class="field"><span>משך (דקות)</span><input class="input" id="cxDur" type="number" min="1" max="60" value="${esc(v.duration)}"></label>
        </div>
        <label class="field"><span>מטרה</span><input class="input" id="cxTarget" maxlength="80" value="${esc(v.target)}" placeholder="למשל: ישבן ויציבות אגן"></label>
        <div class="form-row">
            <label class="field"><span>קפיצים</span><input class="input" id="cxSprings" list="dlSprings" maxlength="60" value="${esc(v.springs)}"></label>
            <label class="field"><span>אביזרים</span><input class="input" id="cxEquip" list="dlEquip" maxlength="80" value="${esc(v.equipment)}"></label>
        </div>
        <datalist id="dlSprings">${uniqueValues('springs').map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        <datalist id="dlEquip">${uniqueValues('equipment').map(s => `<option value="${esc(s)}">`).join('')}</datalist>
        <label class="field"><span>הסבר ביצוע</span><textarea class="input" id="cxDesc" rows="3" maxlength="600">${esc(v.description)}</textarea></label>
        <label class="field"><span>דגשים להדרכה <small>(לא חובה)</small></span><textarea class="input" id="cxTips" rows="2" maxlength="300">${esc(v.tips)}</textarea></label>
        <label class="field"><span>שרירים עובדים <small>(לא חובה)</small></span><input class="input" id="cxMuscles" maxlength="120" value="${esc(v.muscles)}"></label>
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
                        name, category: q('#cxCat').value, duration: q('#cxDur').value, target: q('#cxTarget').value.trim(),
                        springs: q('#cxSprings').value.trim(), equipment: q('#cxEquip').value.trim(),
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
        duration: ex.duration, springs: ex.springs, equipment: ex.equipment, description: ex.description, tips: ex.tips, muscles: ex.muscles
    });
}
function itemInfo(it) {
    if (it.kind === 'rest') return it;
    const ex = findExercise(it.exId);
    if (!ex) return it;
    return Object.assign({}, it, { description: ex.description || it.description, tips: ex.tips || it.tips, muscles: ex.muscles || it.muscles, videoUrl: ex.videoUrl });
}
const getItem = u => builder.items.find(it => it.uid === u);

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
    $('#notesToggle').hidden = !!builder.notes;
}

function addExerciseToLesson(id, index = null) {
    const ex = findExercise(id);
    if (!ex) return;
    const item = makeItemFromExercise(ex);
    if (index == null || index >= builder.items.length) builder.items.push(item);
    else builder.items.splice(Math.max(0, index), 0, item);
    ui.newItemUid = item.uid;
    commitBuilder();
    flashLibraryCard(id);
    if (isCompact() && ui.pane === 'library') {
        const badge = $('#paneBadge');
        badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
        toast(`נוסף לשיעור: ${ex.name}`, { action: { label: 'לשיעור', fn: () => setPane('lesson') }, timeout: 2200, key: 'added' });
    }
}

function addRest() {
    const minutes = clampDur($('#restDuration').value);
    const item = normalizeItem({ uid: uid('it'), kind: 'rest', duration: minutes });
    builder.items.push(item);
    ui.newItemUid = item.uid;
    commitBuilder({ library: false });
}

function removeItem(u) {
    const idx = builder.items.findIndex(it => it.uid === u);
    if (idx < 0) return;
    const [removed] = builder.items.splice(idx, 1);
    ui.openNotes.delete(u);
    commitBuilder();
    toast(`הוסר: ${removed.name}`, {
        action: { label: 'ביטול', fn: () => { builder.items.splice(Math.min(idx, builder.items.length), 0, removed); commitBuilder(); } },
        timeout: 4000
    });
}

function moveItem(u, delta) {
    const i = builder.items.findIndex(it => it.uid === u);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= builder.items.length) return;
    [builder.items[i], builder.items[j]] = [builder.items[j], builder.items[i]];
    commitBuilder({ library: false });
}

function changeDuration(u, delta) {
    const it = getItem(u);
    if (!it) return;
    it.duration = clampDur(it.duration + delta);
    commitBuilder({ library: false });
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
    const order = ['warm', 'mat', 'reformer', 'stretch', 'rest'];
    const labels = { warm: 'חימום', mat: 'מזרן', reformer: 'מכשיר', stretch: 'מתיחות', rest: 'מנוחה' };
    const sums = {};
    items.forEach(it => { const k = catKey(it.category); sums[k] = (sums[k] || 0) + it.duration; });
    return order.filter(k => sums[k]).map(k => ({ key: k, label: labels[k], minutes: sums[k] }));
}

function distBarHtml(items) {
    const total = sumDur(items) || 1;
    return `<div class="dist-bar" aria-hidden="true">${distribution(items).map(d => `<span class="cat-${d.key}" style="width:${(d.minutes / total) * 100}%"></span>`).join('')}</div>`;
}

function renderBuilder() {
    const items = builder.items;
    const total = sumDur(items);
    const exCount = items.filter(i => i.kind !== 'rest').length;
    const target = builder.target;

    /* status line */
    const editing = builder.editingId ? state.lessons.find(l => l.id === builder.editingId) : null;
    let status = editing ? `<span class="pill gold">${icon('pen', 13)}עריכת שיעור שמור</span>` : '<span class="pill">שיעור חדש</span>';
    if (builder.dirty && items.length) status += '<span class="unsaved-dot" aria-hidden="true"></span><span>שינויים שלא נשמרו</span>';
    else if (editing && !builder.dirty) status += `<span class="pill ok">${icon('check', 13)}שמור</span>`;
    $('#lessonStatus').innerHTML = status;

    /* stats */
    const diff = total - target;
    let cls = '';
    let note = `נותרו ${target - total} דק׳ ליעד`;
    if (!total) note = `יעד: ${target} דק׳`;
    else if (Math.abs(diff) <= 2) { cls = 'ok'; note = diff === 0 ? 'בדיוק ביעד ✓' : `קרוב ליעד ✓ (${diff > 0 ? '+' : ''}${diff})`; }
    else if (diff > 2) { cls = 'over'; note = `חריגה של ${diff} דק׳ מהיעד`; }
    const pct = Math.min(100, target ? (total / target) * 100 : 0);
    const dist = distribution(items);
    $('#lessonStats').innerHTML = `
        <div class="stats-top">
            <div class="stats-time">${total} <small>/ ${target} דק׳ · ${exCount} תרגילים</small></div>
            <div class="stats-note ${cls}">${note}</div>
        </div>
        <div class="progress ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${total}"><span style="width:${pct}%"></span></div>
        ${dist.length ? distBarHtml(items) + `<div class="legend">${dist.map(d => `<span class="cat-${d.key}"><i></i>${d.label} <b>${d.minutes}′</b></span>`).join('')}</div>` : ''}`;

    /* items */
    const list = $('#lessonItems');
    let t = 0;
    list.innerHTML = items.map((raw, i) => {
        const it = raw;
        const start = t;
        t += it.duration;
        const key = catKey(it.category);
        const isRest = it.kind === 'rest';
        const showNote = ui.openNotes.has(it.uid);
        const springs = !isRest && it.springs && !/ללא/.test(it.springs) ? `<span class="springs">${esc(it.springs)}</span>` : '';
        return `
        <li class="lesson-item cat-${key} ${isRest ? 'rest' : ''} ${ui.newItemUid === it.uid ? 'is-new' : ''}" data-uid="${esc(it.uid)}">
            <span class="drag-handle" title="גררי לשינוי הסדר">${icon('grip', 16)}</span>
            <span class="idx">${i + 1}</span>
            <div class="item-main">
                <div class="item-name">${isRest ? '🌸 ' : ''}${esc(it.name)}</div>
                <div class="item-sub">
                    <span>דק׳ ${start}–${t}</span>
                    ${!isRest ? `<span class="tag">${esc(catLabel(it.category))}</span>` : ''}
                    ${springs}
                    ${it.note && !showNote ? `<span class="note-preview">📝 ${esc(it.note)}</span>` : ''}
                </div>
            </div>
            <div class="stepper" aria-label="משך">
                <button data-action="dur-dec" data-uid="${esc(it.uid)}" aria-label="פחות דקה">−</button>
                <span>${it.duration} ד׳</span>
                <button data-action="dur-inc" data-uid="${esc(it.uid)}" aria-label="עוד דקה">+</button>
            </div>
            <div class="item-actions">
                <button class="icon-btn sm" data-action="move-up" data-uid="${esc(it.uid)}" ${i === 0 ? 'disabled' : ''} aria-label="הזזה למעלה" title="למעלה">${icon('up')}</button>
                <button class="icon-btn sm" data-action="move-down" data-uid="${esc(it.uid)}" ${i === items.length - 1 ? 'disabled' : ''} aria-label="הזזה למטה" title="למטה">${icon('down')}</button>
                <button class="icon-btn sm ${it.note ? 'has-note' : ''}" data-action="toggle-note" data-uid="${esc(it.uid)}" aria-label="הערה לתרגיל" title="הערה (חזרות, וריאציה, קפיצים…)">${icon('pen')}</button>
                <button class="icon-btn sm danger" data-action="remove-item" data-uid="${esc(it.uid)}" aria-label="הסרה מהשיעור" title="הסרה">${icon('x')}</button>
            </div>
            ${showNote ? `<div class="note-row"><input class="input item-note" data-uid="${esc(it.uid)}" maxlength="160" value="${esc(it.note)}" placeholder="הערה: מספר חזרות, וריאציה, החלפת קפיצים…"></div>` : ''}
        </li>`;
    }).join('');
    $('#emptyLesson').hidden = items.length > 0;

    if (ui.newItemUid) {
        const li = list.querySelector(`[data-uid="${CSS.escape(ui.newItemUid)}"]`);
        if (li && !isCompact()) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        ui.newItemUid = null;
    }

    /* checks */
    const ex = items.filter(i => i.kind !== 'rest');
    let checks = '';
    if (ex.length) {
        const c = [
            { ok: catKey(ex[0].category) === 'warm', label: 'פתיחה בחימום' },
            { ok: catKey(ex[ex.length - 1].category) === 'stretch', label: 'סיום במתיחות' },
            { ok: Math.abs(diff) <= 2, label: 'משך תואם ליעד' }
        ];
        checks = c.map(x => `<span class="check ${x.ok ? 'ok' : ''}">${icon(x.ok ? 'check' : 'circle', 13)}${x.label}</span>`).join('');
        const sc = springChanges(items);
        if (sc.used) checks += `<span class="check info">החלפות קפיצים: ${sc.count}</span>`;
    }
    $('#lessonChecks').innerHTML = checks;

    /* footer */
    $('#lessonFoot').innerHTML = editing
        ? `<button class="btn primary" data-action="save-lesson">${icon('check')}עדכון השיעור</button>
           <button class="btn" data-action="save-as-new" title="שמירת עותק כשיעור נפרד">${icon('copy')}שמירה כחדש</button>`
        : `<button class="btn primary single" data-action="save-lesson">שמירת השיעור 🌸</button>`;

    /* mobile pane badge */
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
    ui.openNotes.clear();
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
    ui.openNotes.clear();
    commitBuilder();
}

/* ---------- טיוטה אוטומטית ---------- */
function generateDraft({ type, target, withRest }) {
    const lib = libraryAll();
    const mainCats = type === 'mat' ? ['פילאטיס מזרן'] : type === 'reformer' ? ['פילאטיס מכשיר'] : ['פילאטיס מזרן', 'פילאטיס מכשיר'];
    const fitsMain = ex => (type === 'mixed' ? true : type === 'reformer' ? isReformer(ex) : !isReformer(ex));
    const fitsSide = ex => (type === 'mat' ? !isReformer(ex) : true);

    const pick = (pool, budget) => {
        const chosen = [];
        let used = 0;
        shuffle(pool).forEach(ex => {
            if (used + ex.duration <= budget) { chosen.push(ex); used += ex.duration; }
        });
        return chosen.sort((a, b) => exerciseOrder(a) - exerciseOrder(b));
    };

    const restMin = withRest && target >= 40 ? 2 : 0;
    const warm = pick(lib.filter(ex => ex.category === 'תרגילי חימום' && fitsSide(ex)), Math.max(6, Math.round(target * 0.18)));
    const stretch = pick(lib.filter(ex => ex.category === 'תרגילי מתיחות' && fitsSide(ex)), Math.max(5, Math.round(target * 0.15)));
    let mainPool = lib.filter(ex => mainCats.includes(ex.category) && fitsMain(ex));
    if (!mainPool.length) mainPool = lib.filter(ex => mainCats.includes(ex.category));
    const mainBudget = target - sumDur(warm) - sumDur(stretch) - restMin;
    let main = pick(mainPool, mainBudget);
    if (type === 'mixed') {
        // משולב: קודם מזרן ואז מכשיר
        main = main.filter(e => !isReformer(e)).concat(main.filter(isReformer));
    }

    const toItems = arr => arr.map(makeItemFromExercise);
    const mainItems = toItems(main);
    let items = toItems(warm);
    if (restMin && mainItems.length > 2) {
        const half = Math.ceil(mainItems.length / 2);
        items = items.concat(mainItems.slice(0, half), [normalizeItem({ uid: uid('it'), kind: 'rest', duration: restMin })], mainItems.slice(half));
    } else {
        items = items.concat(mainItems);
    }
    items = items.concat(toItems(stretch));

    // השלמת דקות שנותרו ליעד – הארכה עדינה של תרגילי החלק המרכזי
    let left = target - sumDur(items);
    const growable = mainItems.length ? mainItems : items.filter(i => i.kind !== 'rest');
    for (let round = 0; left > 0 && round < 3 && growable.length; round++) {
        for (const it of growable) { if (left <= 0) break; it.duration += 1; left--; }
    }
    return items;
}

function isAutoTitle(t) {
    const s = String(t || '').trim();
    return !s || s === DEFAULT_TITLE || /^שיעור (מזרן|רפורמר|משולב) · \d+ דק׳$/.test(s);
}

function applyDraft(opts) {
    const items = generateDraft(opts);
    if (!items.length) { toast('לא נמצאו מספיק תרגילים במאגר לטיוטה כזו', { type: 'warn' }); return; }
    builder.items = items;
    builder.type = opts.type;
    builder.target = opts.target;
    builder.editingId = null;
    if (isAutoTitle(builder.title)) builder.title = `שיעור ${LESSON_TYPES[opts.type]} · ${opts.target} דק׳`;
    ui.openNotes.clear();
    syncBuilderInputs();
    commitBuilder();
    setPane('lesson');
    toast('הטיוטה מוכנה! עכשיו אפשר להחליף, להזיז ולהתאים 🌸', { action: { label: 'טיוטה אחרת', fn: () => applyDraft(opts) }, timeout: 6000 });
}

function openDraftModal() {
    const typeOpts = Object.keys(LESSON_TYPES).map(k => `<option value="${k}" ${k === builder.type ? 'selected' : ''}>${LESSON_TYPES[k]}</option>`).join('');
    const targetOpts = TARGETS.map(t => `<option value="${t}" ${t === builder.target ? 'selected' : ''}>${t} דקות</option>`).join('');
    openModal({
        title: '✨ טיוטה אוטומטית',
        body: `
            <p class="muted">המערכת תרכיב טיוטת שיעור מאוזנת — <b>חימום ← חלק מרכזי ← מתיחות</b> — לפי סוג השיעור והזמן. אחרי זה הכל פתוח לשינויים: להחליף תרגילים, להזיז, לקצר ולהאריך.</p>
            <div class="form-row">
                <label class="field"><span>סוג השיעור</span><select class="input" id="drType">${typeOpts}</select></label>
                <label class="field"><span>משך השיעור</span><select class="input" id="drTarget">${targetOpts}</select></label>
            </div>
            <label class="check-field"><input type="checkbox" id="drRest" checked> הפסקת מנוחה קצרה באמצע השיעור</label>
            ${builder.items.length ? '<p class="warn-note">שימי לב: הטיוטה תחליף את התרגילים שכרגע בשיעור.</p>' : ''}`,
        actions: [
            {
                label: '✨ הרכבת טיוטה', className: 'btn primary', onClick: m => {
                    applyDraft({ type: m.el.querySelector('#drType').value, target: Number(m.el.querySelector('#drTarget').value), withRest: m.el.querySelector('#drRest').checked });
                }
            },
            { label: 'ביטול', className: 'btn ghost' }
        ]
    });
}

/* ---------- גרירה ושחרור ---------- */
let drag = null;
function setupDragAndDrop() {
    const drop = $('#lessonDrop');
    const list = $('#lessonItems');
    const clearMarks = () => list.querySelectorAll('.drop-before, .drop-after').forEach(el => el.classList.remove('drop-before', 'drop-after'));

    document.addEventListener('pointerdown', e => {
        const h = e.target.closest('.drag-handle');
        if (h) h.closest('.lesson-item').draggable = true;
    });
    document.addEventListener('dragstart', e => {
        const li = e.target.closest && e.target.closest('.lesson-item');
        if (li && li.draggable) {
            drag = { type: 'item', uid: li.dataset.uid };
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', li.dataset.uid);
            return;
        }
        const card = e.target.closest && e.target.closest('.ex-card');
        if (card) {
            drag = { type: 'ex', id: card.dataset.exId };
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', card.dataset.exId);
        }
    });
    document.addEventListener('dragend', () => {
        list.querySelectorAll('.lesson-item').forEach(li => { li.draggable = false; li.classList.remove('dragging'); });
        clearMarks();
        drop.classList.remove('drag-over');
        drag = null;
    });

    const dropIndex = e => {
        const li = e.target.closest('.lesson-item');
        if (!li) return { index: builder.items.length, li: null, after: true };
        const rect = li.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        const i = builder.items.findIndex(it => it.uid === li.dataset.uid);
        return { index: after ? i + 1 : i, li, after };
    };

    drop.addEventListener('dragover', e => {
        if (!drag) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = drag.type === 'ex' ? 'copy' : 'move';
        drop.classList.add('drag-over');
        clearMarks();
        const { li, after } = dropIndex(e);
        if (li) li.classList.add(after ? 'drop-after' : 'drop-before');
    });
    drop.addEventListener('dragleave', e => {
        if (!drop.contains(e.relatedTarget)) { drop.classList.remove('drag-over'); clearMarks(); }
    });
    drop.addEventListener('drop', e => {
        if (!drag) return;
        e.preventDefault();
        let { index } = dropIndex(e);
        if (drag.type === 'ex') {
            addExerciseToLesson(drag.id, index);
        } else {
            const from = builder.items.findIndex(it => it.uid === drag.uid);
            if (from >= 0) {
                const [moved] = builder.items.splice(from, 1);
                if (index > from) index--;
                builder.items.splice(index, 0, moved);
                commitBuilder({ library: false });
            }
        }
        drop.classList.remove('drag-over');
        clearMarks();
    });
}

/* =========================================================
   השיעורים שלי
   ========================================================= */
const getLesson = id => state.lessons.find(l => l.id === id);
function lessonStats(l) {
    return { total: sumDur(l.items), exCount: l.items.filter(i => i.kind !== 'rest').length };
}
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
            const na = nextEventFor(a.id), nb = nextEventFor(b.id);
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
                <span class="pill">${st.total} דק׳</span>
                <span class="pill">${st.exCount} תרגילים</span>
                <span class="pill">${esc(LESSON_TYPES[l.type])}</span>
                <span class="pill">${esc(l.level)}</span>
            </div>
            ${l.notes ? `<p class="lc-notes">${esc(l.notes)}</p>` : ''}
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
    ui.openNotes.clear();
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
    let t = 0;
    let n = 0;
    const rows = lesson.items.map(raw => {
        const it = itemInfo(raw);
        const start = t;
        t += it.duration;
        const key = catKey(it.category);
        if (it.kind === 'rest') {
            return `<li class="cat-rest"><div class="sl-head"><span class="sl-name">🌸 ${esc(it.name)}</span><span class="sl-time">דק׳ ${start}–${t} · ${it.duration} דק׳</span></div>${it.note ? `<p class="sl-note">📝 ${esc(it.note)}</p>` : ''}</li>`;
        }
        n++;
        const springs = it.springs && !/ללא/.test(it.springs) ? `<span class="springs">קפיצים: ${esc(it.springs)}</span>` : '';
        const equipment = it.equipment && !/^ללא/.test(it.equipment) ? `<span>${esc(it.equipment)}</span>` : '';
        return `
            <li class="cat-${key}">
                <div class="sl-head"><span class="sl-name"><span class="num">${n}.</span>${esc(it.name)}</span><span class="sl-time">דק׳ ${start}–${t} · ${it.duration} דק׳</span></div>
                ${springs || equipment ? `<div class="sl-meta">${springs}${equipment}</div>` : ''}
                ${full && it.description ? `<p class="sl-desc">${esc(it.description)}</p>` : ''}
                ${it.tips ? `<p class="sl-tips">${esc(it.tips)}</p>` : ''}
                ${it.note ? `<p class="sl-note">📝 ${esc(it.note)}</p>` : ''}
            </li>`;
    }).join('');
    return `
        <div class="sheet">
            <div class="sheet-head">
                <div class="sheet-brand">EVERYDRAY</div>
                <h2>${esc(lesson.title)}</h2>
                <div class="sheet-meta">
                    <span class="pill">${st.total} דק׳</span><span class="pill">${st.exCount} תרגילים</span>
                    <span class="pill">${esc(LESSON_TYPES[lesson.type] || '')}</span><span class="pill">${esc(lesson.level || '')}</span>
                    ${sc.used ? `<span class="pill">החלפות קפיצים: ${sc.count}</span>` : ''}
                </div>
            </div>
            ${lesson.notes ? `<div class="sheet-box"><strong>פוקוס השיעור:</strong> ${esc(lesson.notes)}</div>` : ''}
            ${equip.length ? `<div class="sheet-box"><strong>ציוד להכנה:</strong> ${equip.map(esc).join(' · ')}</div>` : ''}
            ${lesson.items.length ? distBarHtml(lesson.items) : ''}
            <ol class="sheet-list">${rows || '<li>אין עדיין תרגילים בשיעור.</li>'}</ol>
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
    lines.push('');
    let n = 0;
    lesson.items.forEach(it => {
        if (it.kind === 'rest') {
            lines.push(`   ☁︎ מנוחה – ${it.duration} דק׳`);
        } else {
            n++;
            const springs = it.springs && !/ללא/.test(it.springs) ? ` | קפיצים: ${it.springs}` : '';
            lines.push(`${n}. ${it.name} – ${it.duration} דק׳${springs}`);
        }
        if (it.note) lines.push(`   📝 ${it.note}`);
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
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => toast(okMsg), fallback);
    } else {
        fallback();
    }
}
const copyLessonText = lesson => copyText(lessonText(lesson), 'השיעור הועתק — אפשר להדביק בוואטסאפ או בפתקים 📋');

/* =========================================================
   לוח שנה
   ========================================================= */
function eventTitle(e) {
    const l = getLesson(e.lessonId);
    return l ? l.title : (e.title || 'שיעור');
}
const byTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99');
function eventsByDate() {
    const map = {};
    state.events.forEach(e => { (map[e.date] = map[e.date] || []).push(e); });
    Object.values(map).forEach(arr => arr.sort(byTime));
    return map;
}
function eventClass(e) {
    const classes = [];
    if (e.done) classes.push('done');
    if (!getLesson(e.lessonId)) classes.push('orphan');
    if (e.date < todayStr()) classes.push('past');
    return classes.join(' ');
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

    const monthEvents = state.events.filter(e => e.date.slice(0, 7) === ui.calCursor.slice(0, 7));
    renderCalStats(monthEvents, 'החודש');
}

function renderWeek(map) {
    const sel = parseDate(ui.selectedDate);
    const start = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - sel.getDay());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    $('#calTitle').textContent = start.getMonth() === end.getMonth()
        ? `${start.getDate()}–${end.getDate()} ב${MONTHS[end.getMonth()]} ${end.getFullYear()}`
        : `${start.getDate()} ב${MONTHS[start.getMonth()]} – ${end.getDate()} ב${MONTHS[end.getMonth()]}`;
    const today = todayStr();
    let html = '';
    const weekDates = [];
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
        <div class="event-card ${e.done ? 'done' : ''}">
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
                ${l ? `<button class="btn sm" data-action="event-view" data-id="${id}">${icon('eye')}לשיעור</button>` : ''}
                <button class="btn sm ${e.done ? 'success' : ''}" data-action="event-done" data-id="${id}">${e.done ? `${icon('check')}הועבר` : 'סימון כהועבר'}</button>
                <a class="btn sm ghost" href="${esc(googleCalUrl(e))}" target="_blank" rel="noopener" title="הוספה ל-Google Calendar">${icon('link')}Google</a>
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
    const t = todayStr();
    const list = state.events.filter(e => e.date >= t).sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'))).slice(0, 8);
    if (!list.length) {
        $('#upcomingList').innerHTML = '<p class="day-empty">אין שיעורים קרובים בלוח.</p>';
        return;
    }
    $('#upcomingList').innerHTML = `<div class="up-list">${list.map(e => {
        const d = parseDate(e.date);
        const rel = relativeDay(e.date);
        return `
            <button class="up-item ${e.date === t ? 'is-today' : ''}" data-action="select-day" data-date="${e.date}">
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
    if (window.matchMedia('(max-width: 1024px)').matches) {
        $('#dayPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function calShift(dir) {
    if (ui.calMode === 'week') {
        ui.selectedDate = addDays(ui.selectedDate, dir * 7);
        ui.calCursor = monthStart(ui.selectedDate);
    } else {
        const c = parseDate(ui.calCursor);
        const next = new Date(c.getFullYear(), c.getMonth() + dir, 1);
        ui.calCursor = toDateStr(next);
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
    const end = new Date(start.getTime() + eventDuration(e) * 60000);
    return { start, end };
}
const icsLocal = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsDate = s => s.replace(/-/g, '');
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function eventSummary(e) {
    return `${eventTitle(e)}${e.group ? ' · ' + e.group : ''}`;
}
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
        const limit = out.length ? 74 : 75;
        if (len + l > limit) { out.push(cur); cur = ''; len = 0; }
        cur += ch;
        len += l;
    }
    out.push(cur);
    return out.join('\r\n ');
}
function googleCalUrl(e) {
    const dates = e.time
        ? (() => { const r = eventRange(e); return `${icsLocal(r.start)}/${icsLocal(r.end)}`; })()
        : `${icsDate(e.date)}/${icsDate(addDays(e.date, 1))}`;
    const p = new URLSearchParams({ action: 'TEMPLATE', text: eventSummary(e), dates, details: eventDescription(e) });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
function download(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
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
        if (e.time) {
            const r = eventRange(e);
            lines.push(`DTSTART:${icsLocal(r.start)}`, `DTEND:${icsLocal(r.end)}`);
        } else {
            lines.push(`DTSTART;VALUE=DATE:${icsDate(e.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`);
        }
        lines.push(`SUMMARY:${icsEsc(eventSummary(e))}`, `DESCRIPTION:${icsEsc(eventDescription(e))}`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    download('everydray-calendar.ics', lines.map(foldLine).join('\r\n'), 'text/calendar;charset=utf-8');
    toast('קובץ היומן ירד — אפשר לייבא אותו ל-Google Calendar או ליומן של האייפון 📅', { timeout: 5000 });
}

/* ---------- גיבוי ---------- */
function exportBackup() {
    const data = { app: 'everydray', version: 2, exportedAt: new Date().toISOString(), lessons: state.lessons, events: state.events, customExercises: state.customExercises, favorites: state.favorites };
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
        if (!newLessons.length && !newEvents.length && !newEx.length) {
            toast('כל הנתונים שבקובץ כבר קיימים כאן ✓');
            return;
        }
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
        if (ui.expanded.has(id)) ui.expanded.delete(id); else ui.expanded.add(id);
        const card = el.closest('.ex-card');
        card.classList.toggle('open', ui.expanded.has(id));
        el.setAttribute('aria-expanded', ui.expanded.has(id));
    },
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
    'toggle-note': el => {
        const u = el.dataset.uid;
        if (ui.openNotes.has(u)) ui.openNotes.delete(u); else ui.openNotes.add(u);
        renderBuilder();
        const input = document.querySelector(`.item-note[data-uid="${CSS.escape(u)}"]`);
        if (input) input.focus();
    },
    'remove-item': el => removeItem(el.dataset.uid),
    'toggle-notes': () => { $('#lessonNotes').hidden = false; $('#notesToggle').hidden = true; $('#lessonNotes').focus(); },
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
        if (e.key === 'Escape' && modalStack.length) {
            modalStack[modalStack.length - 1].close();
            return;
        }
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
            renderBuilderStatusOnly();
        } else if (t.id === 'lessonNotes') {
            builder.notes = t.value;
            builder.dirty = true;
            save();
        } else if (t.classList.contains('item-note')) {
            const it = getItem(t.dataset.uid);
            if (it) {
                it.note = t.value;
                builder.dirty = true;
                save();
                const btn = document.querySelector(`[data-action="toggle-note"][data-uid="${CSS.escape(t.dataset.uid)}"]`);
                if (btn) btn.classList.toggle('has-note', !!t.value);
            }
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
        else if (t.id === 'lessonsSort') { ui.lessonsSort = t.value; renderLessons(); }
        else if (t.id === 'importFile') { importBackup(t.files && t.files[0]); t.value = ''; }
        else if (t.id === 'lessonNotes' && !t.value.trim()) { t.hidden = true; $('#notesToggle').hidden = false; }
    });

    window.addEventListener('storage', e => {
        if (e.key === STORAGE_KEY) toast('הנתונים עודכנו בלשונית אחרת — רענני את הדף כדי לראות את הגרסה העדכנית', { timeout: 6000 });
    });
}

function renderBuilderStatusOnly() {
    const editing = builder.editingId ? getLesson(builder.editingId) : null;
    let status = editing ? `<span class="pill gold">${icon('pen', 13)}עריכת שיעור שמור</span>` : '<span class="pill">שיעור חדש</span>';
    if (builder.dirty && builder.items.length) status += '<span class="unsaved-dot" aria-hidden="true"></span><span>שינויים שלא נשמרו</span>';
    $('#lessonStatus').innerHTML = status;
}

/* =========================================================
   אתחול
   ========================================================= */
function init() {
    document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));
    $('#lessonLevel').innerHTML = LEVELS.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
    $('#lessonType').innerHTML = Object.keys(LESSON_TYPES).map(k => `<option value="${k}">${LESSON_TYPES[k]}</option>`).join('');
    $('#lessonTarget').innerHTML = TARGETS.map(t => `<option value="${t}">${t} דק׳</option>`).join('');
    $('#lessonsSort').value = ui.lessonsSort;

    syncBuilderInputs();
    bindEvents();
    setupDragAndDrop();
    renderAll();
    setView(ui.view);
    save();
}

document.addEventListener('DOMContentLoaded', init);
