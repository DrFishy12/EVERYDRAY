/* =========================================================
   EVERYDRAY – צ'אט AI
   כפתור עגול בפינה הימנית התחתונה שפותח חלון שיחה.
   עם כתובת שרת (config.js → aiEndpoint) – התשובות מגיעות מ-Claude.
   בלי כתובת – "מצב בסיסי" שעונה מתוך מאגר התרגילים של האתר.
   ========================================================= */
(function () {
    'use strict';

    const CFG = window.EVERYDRAY_CONFIG || {};
    const ENDPOINT = /^https:\/\/\S+$/i.test(String(CFG.aiEndpoint || '').trim()) ? String(CFG.aiEndpoint).trim() : '';
    const STORE_KEY = 'everydray_chat';
    const MAX_KEEP = 40;
    const SUGGESTIONS = [
        'בני לי שיעור רפורמר של 50 דקות לבינוניות עם דגש על ישבן',
        'אילו תרגילים מתאימים למתחילות לחיזוק הבטן?',
        'איך מסבירים את המאה למתחילות?',
        'תני לי משוב על השיעור שאני בונה עכשיו'
    ];

    let msgs = load();
    let busy = false;
    let controller = null;
    let renderTimer = null;
    let fab, panel, body, input, form;

    /* ---------- storage ---------- */
    function load() {
        try {
            const arr = JSON.parse(localStorage.getItem(STORE_KEY));
            return Array.isArray(arr) ? arr.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') : [];
        } catch (e) { return []; }
    }
    function persist() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-MAX_KEEP))); } catch (e) { /* ignore */ }
    }

    /* ---------- formatting ---------- */
    const REF_RE = /\[\[ex:([\w-]+)\]\]/g;
    const refIds = text => {
        const ids = [];
        String(text).replace(REF_RE, (_, id) => { if (findExercise(id) && !ids.includes(id)) ids.push(id); return ''; });
        return ids;
    };
    function inline(s) {
        return s
            .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
            .replace(/\[\[ex:([\w-]+)\]\]/g, (m, id) => {
                const ex = findExercise(id);
                if (!ex) return '';
                const nm = splitName(ex.name);
                return `<button type="button" class="ai-chip cat-${catKey(ex.category)}" data-ai="ex" data-id="${esc(id)}" title="פתיחת התרגיל">${esc(nm.he)}</button>`;
            });
    }
    function format(text) {
        const lines = esc(text).split('\n');
        let html = '';
        let list = null;
        const close = () => { if (list) { html += `</${list}>`; list = null; } };
        lines.forEach(raw => {
            const line = raw.trim();
            const bullet = /^[-•*]\s+(.*)$/.exec(line);
            const num = /^\d+[.)]\s+(.*)$/.exec(line);
            if (bullet || num) {
                const kind = bullet ? 'ul' : 'ol';
                if (list !== kind) { close(); html += `<${kind}>`; list = kind; }
                html += `<li>${inline((bullet || num)[1])}</li>`;
            } else {
                close();
                if (line) html += `<p>${inline(line)}</p>`;
            }
        });
        close();
        return html;
    }

    /* ---------- rendering ---------- */
    function welcomeHtml() {
        return `
            <div class="ai-welcome">
                <div class="ai-welcome-ico">${icon('sparkle', 26)}</div>
                <p class="ai-welcome-title">היי, אני העוזרת החכמה 🌸</p>
                <p class="ai-welcome-text">אפשר לשאול אותי על תרגילים, לבקש שאבנה שיעור, או לקבל משוב על השיעור שאת בונה.</p>
                <div class="ai-sugs">${SUGGESTIONS.map(s => `<button type="button" class="ai-sug" data-ai="sug">${esc(s)}</button>`).join('')}</div>
            </div>`;
    }
    function msgHtml(m, i) {
        if (m.role === 'user') return `<div class="ai-msg user"><div class="ai-bubble">${esc(m.content).replace(/\n/g, '<br>')}</div></div>`;
        if (!m.content && busy && i === msgs.length - 1) {
            return '<div class="ai-msg bot"><div class="ai-bubble ai-typing" aria-label="מקלידה"><i></i><i></i><i></i></div></div>';
        }
        const ids = refIds(m.content);
        const acts = [];
        if (m.draft) acts.push(`<button type="button" class="ai-act primary" data-ai="apply-draft" data-i="${i}">${icon('sparkle', 14)}החלת הטיוטה בשיעור</button>`);
        else if (ids.length >= 2 && !(busy && i === msgs.length - 1)) acts.push(`<button type="button" class="ai-act" data-ai="add-all" data-i="${i}">${icon('plus', 14)}הוספת ${ids.length} התרגילים לשיעור</button>`);
        return `<div class="ai-msg bot ${m.error ? 'error' : ''}"><div class="ai-bubble">${format(m.content)}</div>${acts.length ? `<div class="ai-acts">${acts.join('')}</div>` : ''}</div>`;
    }
    function render() {
        renderTimer = null;
        if (!body) return;
        const nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
        body.innerHTML = msgs.length ? msgs.map(msgHtml).join('') : welcomeHtml();
        if (nearBottom || !busy) body.scrollTop = body.scrollHeight;
        form.querySelector('.ai-send').disabled = busy;
        panel.querySelector('[data-ai="stop"]').hidden = !busy;
    }
    const scheduleRender = () => { if (!renderTimer) renderTimer = setTimeout(render, 40); };

    /* ---------- context sent to the AI ---------- */
    function catalogText() {
        return libraryAll().map(ex => [ex.id, ex.name, catLabel(ex.category), ex.level || '', ex.duration, (ex.focus || []).join(', '), ex.equipment || ''].join(' | ')).join('\n');
    }
    function contextText() {
        const d = new Date();
        const lines = [`היום: ${DAYS[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`];
        const items = builder.items;
        if (items.length) {
            lines.push(`השיעור שבבנייה: "${builder.title}" · ${LESSON_TYPES[builder.type]} · ${builder.level} · יעד ${builder.target} דק׳ · כרגע ${sumDur(items)} דק׳`);
            if (builder.notes) lines.push(`פוקוס: ${builder.notes}`);
            PHASES.forEach(ph => {
                const its = items.filter(it => it.phase === ph.key);
                if (its.length) lines.push(`${ph.label}: ${its.map(it => (it.kind === 'rest' ? 'מנוחה' : `[[ex:${it.exId}]] ${splitName(it.name).he}`) + ` ${it.duration}′${it.note ? ` (${it.note})` : ''}`).join(', ')}`);
            });
        } else {
            lines.push('השיעור שבבנייה ריק כרגע.');
        }
        if (state.lessons.length) lines.push(`שיעורים שמורים (${state.lessons.length}): ${state.lessons.slice(0, 12).map(l => `${l.title} (${sumDur(l.items)}′)`).join(', ')}`);
        const up = upcomingEvents(5);
        if (up.length) lines.push(`בלוח בקרוב: ${up.map(e => `${formatDateShort(e.date)}${e.time ? ' ' + e.time : ''} ${eventTitle(e)}${e.group ? ' – ' + e.group : ''}`).join('; ')}`);
        return lines.join('\n');
    }
    function apiMessages() {
        const out = msgs.filter(m => !m.error && m.content.trim()).map(m => ({ role: m.role, content: m.content }));
        while (out.length && out[0].role !== 'user') out.shift();
        return out.slice(-20);
    }

    /* ---------- sending ---------- */
    async function send(text) {
        text = String(text || '').trim();
        if (!text || busy) return;
        msgs.push({ role: 'user', content: text });
        persist();
        if (!ENDPOINT) {
            busy = true;
            msgs.push({ role: 'assistant', content: '' });
            render();
            await new Promise(r => setTimeout(r, 420));
            msgs[msgs.length - 1] = localAnswer(text);
            busy = false;
            persist();
            render();
            return;
        }
        const bot = { role: 'assistant', content: '' };
        const history = apiMessages();
        msgs.push(bot);
        busy = true;
        render();
        controller = new AbortController();
        try {
            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history, catalog: catalogText(), context: contextText() }),
                signal: controller.signal
            });
            if (!res.ok || !res.body) throw new Error(`http_${res.status}`);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            for (;;) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                let cut;
                while ((cut = buf.indexOf('\n\n')) >= 0) {
                    const chunk = buf.slice(0, cut);
                    buf = buf.slice(cut + 2);
                    const line = chunk.split('\n').find(l => l.startsWith('data: '));
                    if (!line) continue;
                    let ev;
                    try { ev = JSON.parse(line.slice(6)); } catch (e) { continue; }
                    if (ev.type === 'text') { bot.content += ev.text; scheduleRender(); }
                    else if (ev.type === 'done' && ev.stop_reason === 'refusal') { bot.content = bot.content || 'מצטערת, לא אוכל לעזור בבקשה הזו.'; }
                    else if (ev.type === 'done' && ev.stop_reason === 'max_tokens') { bot.content += '\n…(התשובה נקטעה – אפשר לבקש "תמשיכי")'; }
                    else if (ev.type === 'error') throw new Error(ev.code || 'error');
                }
            }
            if (!bot.content.trim()) throw new Error('empty');
        } catch (err) {
            if (err && err.name === 'AbortError') {
                bot.content = bot.content.trim() ? bot.content + '\n…(נעצר)' : 'העצירה בוצעה.';
            } else {
                bot.error = true;
                bot.content = errorText(String(err && err.message));
            }
        } finally {
            busy = false;
            controller = null;
            persist();
            render();
        }
    }
    function errorText(code) {
        if (code === 'rate_limit' || code === 'http_429') return 'יש עומס כרגע. נסי שוב בעוד דקה 🙏';
        if (code === 'auth' || code === 'permission' || code === 'http_500') return 'שרת ה-AI עוד לא מוגדר עד הסוף (מפתח API). בינתיים אפשר להשתמש במאגר ובטיוטה האוטומטית.';
        if (code === 'http_403') return 'השרת לא מאשר בקשות מהכתובת הזו. צריך להוסיף אותה ל-ALLOWED_ORIGINS בשרת.';
        return 'לא הצלחתי להתחבר לעוזרת. בדקי את החיבור לאינטרנט ונסי שוב.';
    }

    /* ---------- basic mode: answers from the exercise library ---------- */
    // order matters: "גמישות של הגב" is about flexibility, "חיזוק הגב" about the back
    const FOCUS_WORDS = [
        [/גמישות|ניידות|מתיחה|מתיחות/, 'גמישות וניידות'], [/נשימה|הרפיה|רגיעה/, 'נשימה והרפיה'], [/איזון|שיווי משקל/, 'שיווי משקל'],
        [/ישבן|רגליים|ירכיים|ירך/, 'ישבן ורגליים'], [/בטן|ליבה/, 'ליבה ובטן'], [/גב|יציבה/, 'גב ויציבה'],
        [/ידיים|כתפיים|זרועות/, 'ידיים וכתפיים']
    ];
    const parseFocus = t => { const f = FOCUS_WORDS.find(([re]) => re.test(t)); return f ? f[1] : ''; };
    const parseLevel = t => (/מתחיל/.test(t) ? 'מתחילות' : /בינוני/.test(t) ? 'בינוניות' : /מתקדמ/.test(t) ? 'מתקדמות' : '');
    const parseType = t => (/משולב|מיקס|שילוב/.test(t) ? 'mixed' : /רפורמר|מכשיר/.test(t) ? 'reformer' : /מזרן/.test(t) ? 'mat' : '');
    function parseCategory(t) {
        if (/חימום/.test(t)) return 'תרגילי חימום';
        if (/מתיחות|מתיחה|שחרור|קירור/.test(t)) return 'תרגילי מתיחות';
        if (/כדור|טבעת|גומי|רולר|משקולות|אביזר/.test(t)) return 'פילאטיס עם אביזרים';
        if (/צ׳ר|צ'ר|קדילאק|בארל|טאואר/.test(t)) return 'פילאטיס מכשירים נוספים';
        if (/רפורמר|מכשיר/.test(t)) return 'פילאטיס מכשיר';
        if (/מזרן/.test(t)) return 'פילאטיס מזרן';
        return '';
    }
    function parseMinutes(t) {
        const m = /(\d{2,3})\s*(?:דק|ד׳|'|min)/.exec(t) || /(?:של|ל-?)\s*(\d{2,3})\b/.exec(t);
        const n = m ? Number(m[1]) : 0;
        return n >= 20 && n <= 120 ? n : 0;
    }
    function findMentioned(t) {
        let best = null;
        let bestLen = 0;
        libraryAll().forEach(ex => {
            const nm = splitName(ex.name);
            [nm.he, nm.en].filter(Boolean).forEach(n => {
                const k = n.toLowerCase();
                if (k.length > 2 && t.includes(k) && k.length > bestLen) { best = ex; bestLen = k.length; }
            });
        });
        return best;
    }

    function howTo(ex) {
        const steps = asList(ex.steps);
        const tips = exTips(ex);
        const parts = [`[[ex:${ex.id}]] · ${ex.level || ''} · ${ex.duration} דק׳`];
        if (ex.setup) parts.push(`**תנוחת מוצא:** ${ex.setup}`);
        if (steps.length) parts.push('**ביצוע:**\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n'));
        else if (ex.description) parts.push(`**ביצוע:** ${ex.description}`);
        if (ex.reps) parts.push(`**חזרות:** ${ex.reps}`);
        if (tips.length) parts.push('**דגשים:**\n' + tips.map(s => `- ${s}`).join('\n'));
        if (ex.easier) parts.push(`**הקלה:** ${ex.easier}`);
        parts.push('אפשר ללחוץ על שם התרגיל לצפייה בהדמיה ובסרטון.');
        return parts.join('\n\n');
    }

    function draftAnswer(t) {
        const opts = {
            type: parseType(t) || builder.type || 'mixed',
            target: parseMinutes(t) || builder.target || 50,
            level: parseLevel(t) || (builder.level !== 'כל הרמות' ? builder.level : 'כל הרמות'),
            focus: parseFocus(t),
            withRest: !/בלי מנוחה|ללא מנוחה/.test(t)
        };
        const items = generateDraft(opts);
        if (!items.length) return { role: 'assistant', content: 'לא הצלחתי להרכיב טיוטה כזו מהמאגר. נסי סוג שיעור או משך אחר.' };
        const lines = [`הרכבתי טיוטה לשיעור **${LESSON_TYPES[opts.type]} · ${opts.target} דק׳** (${opts.level}${opts.focus ? ' · פוקוס: ' + opts.focus : ''}):`];
        PHASES.forEach(ph => {
            const its = items.filter(i => i.phase === ph.key);
            if (!its.length) return;
            lines.push(`\n**${ph.label}** (${sumDur(its)} דק׳)`);
            its.forEach(i => lines.push(i.kind === 'rest' ? `- מנוחה – ${i.duration} דק׳` : `- [[ex:${i.exId}]] – ${i.duration} דק׳`));
        });
        lines.push(`\nסה״כ ${sumDur(items)} דק׳. לחצי על "החלת הטיוטה" כדי להכניס אותה לבונה השיעורים, ושם אפשר לשנות הכל.`);
        return {
            role: 'assistant',
            content: lines.join('\n'),
            draft: { opts, items: items.map(i => ({ kind: i.kind, exId: i.exId || null, duration: i.duration, phase: i.phase })) }
        };
    }

    function lessonFeedback() {
        const items = builder.items;
        if (!items.length) return 'השיעור שבבנייה עדיין ריק. רוצה שאבנה לך טיוטה? כתבי למשל: "בני לי שיעור מזרן של 45 דקות למתחילות".';
        const ex = items.filter(i => i.kind !== 'rest');
        const total = sumDur(items);
        const diff = total - builder.target;
        const out = [`**"${builder.title}"** – ${ex.length} תרגילים, ${total} מתוך ${builder.target} דקות.`];
        const has = k => ex.some(i => i.phase === k);
        const fit = e => !needsProps(e) && (builder.type === 'mat' ? !isMachine(e) : true);
        if (!has('open')) {
            const w = libraryAll().filter(e => e.category === 'תרגילי חימום' && fit(e)).slice(0, 3);
            out.push(`- חסרה **פתיחה וחימום**. אפשר להתחיל ב-${w.map(e => `[[ex:${e.id}]]`).join(', ')}.`);
        }
        if (!has('main')) out.push('- אין עדיין **חלק מרכזי** – זה לב השיעור.');
        if (!has('close')) {
            const s = libraryAll().filter(e => e.category === 'תרגילי מתיחות' && fit(e)).slice(-3);
            out.push(`- חסר **סיום ושחרור**. מומלץ לסיים ב-${s.map(e => `[[ex:${e.id}]]`).join(', ')}.`);
        }
        if (diff > 2) out.push(`- השיעור ארוך ב-${diff} דק׳ מהיעד. אפשר לקצר את התרגילים הארוכים או להסיר אחד.`);
        else if (diff < -2) out.push(`- חסרות ${-diff} דק׳ ליעד. אפשר להוסיף תרגיל או להאריך את החלק המרכזי.`);
        else out.push('- המשך מתאים ליעד ✓');
        const maxLvl = builder.level === 'כל הרמות' ? 3 : levelRank(builder.level);
        const hard = ex.map(i => findExercise(i.exId)).filter(e => e && levelRank(e.level) > maxLvl);
        if (hard.length) out.push(`- תרגילים מעל רמת השיעור (${builder.level}): ${hard.map(e => `[[ex:${e.id}]]`).join(', ')} – כדאי לתת הקלה או להחליף.`);
        const sc = springChanges(items);
        if (sc.used && sc.count > 5) out.push(`- יש ${sc.count} החלפות קפיצים. קיבוץ תרגילים עם אותם קפיצים יחסוך זמן מעבר.`);
        const focusCount = {};
        ex.forEach(i => { const e = findExercise(i.exId); (e && e.focus || []).forEach(f => { focusCount[f] = (focusCount[f] || 0) + 1; }); });
        const top = Object.entries(focusCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
        if (top.length) out.push(`- הדגש של השיעור כרגע: ${top.join(' ו')}.`);
        return out.join('\n');
    }

    function recommend(t, focus, level, cat) {
        let pool = libraryAll().filter(ex => (!focus || (ex.focus || []).includes(focus)) && (!level || ex.level === level) && (!cat || ex.category === cat));
        if (!pool.length) return '';
        // main work first (matching the lesson type); warm-ups and stretches first only for flexibility / breathing requests
        const soft = focus === 'גמישות וניידות' || focus === 'נשימה והרפיה';
        const wantType = parseType(t) || builder.type;
        const rank = ex => {
            const k = catKey(ex.category);
            if (k === 'warm' || k === 'stretch') return soft ? 0 : 3;
            if ((wantType === 'mat' && k === 'mat') || (wantType === 'reformer' && k === 'reformer')) return soft ? 1 : 0;
            if (k === 'mat' || k === 'reformer') return soft ? 2 : 1;
            return soft ? 2 : 2;
        };
        pool = pool.slice().sort((a, b) => rank(a) - rank(b) || exerciseOrder(a) - exerciseOrder(b)).slice(0, 7);
        const what = [cat ? catLabel(cat) : '', focus, level].filter(Boolean).join(' · ');
        return `הנה תרגילים מתאימים${what ? ` (${what})` : ''}:\n` + pool.map(ex => `- [[ex:${ex.id}]] – ${ex.target}, ${ex.duration} דק׳`).join('\n') + '\n\nלחצי על תרגיל להסבר והדמיה, או הוסיפי את כולם לשיעור.';
    }

    function localAnswer(q) {
        const t = q.toLowerCase();
        const reply = content => ({ role: 'assistant', content });
        if (/משוב|תבדקי|בדיקה|מה חסר|השיעור שלי|השיעור שאני/.test(t)) return reply(lessonFeedback());
        if (/(בני|בנה|תבני|הרכיבי|תרכיבי|צרי|תכיני|הכיני|תכנני|טיוטה)/.test(t) && /(שיעור|טיוטה|אימון)/.test(t)) return draftAnswer(t);
        const ex = findMentioned(t);
        if (ex) return reply(howTo(ex));
        const focus = parseFocus(t), level = parseLevel(t), cat = parseCategory(t);
        if (focus || level || cat) {
            const r = recommend(t, focus, level, cat);
            if (r) return reply(r);
        }
        const words = t.split(/[\s,.?!]+/).filter(w => w.length > 2 && !/^(איך|מה|של|את|על|עם|לי|אני|רוצה|תרגיל|תרגילים|אפשר|יש|כל)$/.test(w));
        if (words.length) {
            const hits = libraryAll().map(e => ({ e, n: words.filter(w => exSearchText(e).includes(w)).length })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
            if (hits.length) return reply('מצאתי במאגר:\n' + hits.map(x => `- [[ex:${x.e.id}]] – ${x.e.target}`).join('\n'));
        }
        return reply('אני יכולה לעזור עם:\n- **בניית שיעור** – למשל: "בני לי שיעור רפורמר של 50 דקות לבינוניות"\n- **הסבר תרגיל** – "איך עושים רול אפ?"\n- **המלצות** – "תרגילים לישבן למתחילות"\n- **משוב** – "תני משוב על השיעור שלי"\n\nכרגע אני במצב בסיסי ועונה מתוך מאגר התרגילים של האתר.');
    }

    /* ---------- actions ---------- */
    async function applyDraft(i) {
        const m = msgs[i];
        if (!m || !m.draft) return;
        if (builder.items.length && !(await confirmDialog({ title: 'החלת הטיוטה', message: 'הטיוטה תחליף את התרגילים שכרגע בשיעור שבבנייה. להמשיך?', okLabel: 'החלה' }))) return;
        const items = m.draft.items.map(d => {
            if (d.kind === 'rest') return normalizeItem({ uid: uid('it'), kind: 'rest', duration: d.duration, phase: d.phase });
            const ex = findExercise(d.exId);
            return ex ? Object.assign(makeItemFromExercise(ex), { duration: d.duration, phase: d.phase }) : null;
        }).filter(Boolean);
        applyDraftItems(items, m.draft.opts);
        if (isCompact()) toggle(false);
        toast('הטיוטה נכנסה לשיעור 🌸 עכשיו אפשר להתאים אותה');
    }
    function addAll(i) {
        const m = msgs[i];
        const ids = m ? refIds(m.content) : [];
        if (!ids.length) return;
        ids.forEach(id => addExerciseToLesson(id));
        toast(`נוספו ${ids.length} תרגילים לשיעור 🌸`, { key: 'added' });
    }
    function toggle(open) {
        const show = open == null ? panel.hidden : open;
        panel.hidden = !show;
        fab.classList.toggle('open', show);
        fab.setAttribute('aria-expanded', show);
        document.body.classList.toggle('ai-open', show);
        if (show) {
            render();
            if (!isCompact()) input.focus();
        }
    }
    function clearChat() {
        if (busy && controller) controller.abort();
        msgs = [];
        persist();
        render();
        if (!isCompact()) input.focus();
    }
    function autosize() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    /* ---------- init ---------- */
    function init() {
        fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'ai-fab';
        fab.setAttribute('aria-label', 'פתיחת צ׳אט AI');
        fab.setAttribute('aria-expanded', 'false');
        fab.title = 'העוזרת החכמה';
        fab.innerHTML = `<span class="ai-fab-ico">${icon('sparkle', 22)}</span><span class="ai-fab-txt">AI</span><span class="ai-fab-x">${icon('x', 22)}</span>`;

        panel = document.createElement('section');
        panel.className = 'ai-panel';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'צ׳אט AI');
        panel.innerHTML = `
            <header class="ai-head">
                <div class="ai-avatar">${icon('sparkle', 20)}</div>
                <div class="ai-head-text">
                    <b>העוזרת החכמה</b>
                    <small>${ENDPOINT ? '<span class="ai-dot"></span>AI · מופעלת על ידי Claude' : 'מצב בסיסי · עונה מתוך מאגר התרגילים'}</small>
                </div>
                <button type="button" class="ai-icon" data-ai="clear" title="שיחה חדשה" aria-label="שיחה חדשה">${icon('repeat', 18)}</button>
                <button type="button" class="ai-icon" data-ai="close" title="סגירה" aria-label="סגירה">${icon('x', 18)}</button>
            </header>
            <div class="ai-body" aria-live="polite"></div>
            <form class="ai-form">
                <button type="button" class="ai-stop" data-ai="stop" hidden>עצירה</button>
                <textarea class="ai-input" rows="1" maxlength="2000" placeholder="שאלי אותי על תרגילים, שיעורים ודגשים…" aria-label="הודעה לעוזרת"></textarea>
                <button type="submit" class="ai-send" aria-label="שליחה" title="שליחה"><svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5"/><path d="M11 6l-6 6 6 6"/></svg></button>
            </form>
            <p class="ai-foot">העוזרת יכולה לטעות – בדקי לפני שמעבירים לשיעור.</p>`;
        document.body.append(panel, fab);
        body = panel.querySelector('.ai-body');
        form = panel.querySelector('.ai-form');
        input = panel.querySelector('.ai-input');

        fab.addEventListener('click', () => toggle());
        form.addEventListener('submit', e => {
            e.preventDefault();
            const v = input.value;
            input.value = '';
            autosize();
            send(v);
        });
        input.addEventListener('input', autosize);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey && !isCompact()) { e.preventDefault(); form.requestSubmit(); }
        });
        panel.addEventListener('click', e => {
            const el = e.target.closest('[data-ai]');
            if (!el) return;
            const a = el.dataset.ai;
            if (a === 'close') toggle(false);
            else if (a === 'clear') clearChat();
            else if (a === 'stop') { if (controller) controller.abort(); }
            else if (a === 'sug') send(el.textContent);
            else if (a === 'ex') openExerciseModal(el.dataset.id);
            else if (a === 'add-all') addAll(Number(el.dataset.i));
            else if (a === 'apply-draft') applyDraft(Number(el.dataset.i));
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !panel.hidden && !modalStack.length) toggle(false);
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
