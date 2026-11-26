/*
 * EVERYDRAY – הדמיות תנועה מונפשות לתרגילים
 * ------------------------------------------------------------
 * כל הדמיה היא דמות פשוטה (מבט מהצד) שזזה בין כמה "תנוחות מפתח".
 * תנוחה מוגדרת בזוויות (במעלות, 0 = ימינה, 90 = למטה, ‎-90 = למעלה):
 *   x,y   – מיקום האגן (או הכתפיים כש-root:'sh')
 *   p,c   – חלק תחתון ועליון של עמוד השדרה, n – ראש
 *   a1,f1 / a2,f2 – זרוע עליונה ואמה (קרובה / רחוקה)
 *   t1,s1 / t2,s2 – ירך ושוק (קרובה / רחוקה)
 *   h1,h2 / ft1,ft2 – יעד לכף יד / כף רגל (במקום זוויות)
 *   rot,px,py – סיבוב כל הגוף סביב נקודה (גלגולים)
 *   car – מיקום עגלת הרפורמר, gr – "נשימה"
 */
(function (global) {
    'use strict';

    const L = { pel: 16, chest: 20, neck: 4, head: 7, up: 17, fore: 16, th: 24, sh: 23 };
    const W = 240;
    const FLOOR = 114;
    const COLORS = {
        body: '#A95E7A', far: '#E5BDCB', eye: '#FFFFFF',
        mat: '#F2DFE6', floor: '#EBDDE2',
        frame: '#E9E1F5', frameLine: '#BCAEDB', carriage: '#D6CBEE', bar: '#8D7BC0',
        wood: '#EAD9C4', woodLine: '#C9AE8C',
        ball: '#F3C7A6', swiss: '#F7DCC8', ring: '#C29440', band: '#5E9A78', roller: '#CDE4D6', weight: '#8A7380', glow: '#F4C2D2'
    };

    const rad = a => a * Math.PI / 180;
    const pt = (p, a, l) => [p[0] + Math.cos(rad(a)) * l, p[1] + Math.sin(rad(a)) * l];
    const rotate = (p, c, a) => {
        const r = rad(a), s = Math.sin(r), co = Math.cos(r), x = p[0] - c[0], y = p[1] - c[1];
        return [c[0] + x * co - y * s, c[1] + x * s + y * co];
    };
    function ik(root, target, l1, l2, bend) {
        const dx = target[0] - root[0], dy = target[1] - root[1];
        const d = Math.min(l1 + l2 - 0.05, Math.max(Math.abs(l1 - l2) + 0.05, Math.hypot(dx, dy) || 0.1));
        const a = Math.atan2(dy, dx);
        const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
        const ang = a + bend * Math.acos(Math.max(-1, Math.min(1, cos)));
        return [[root[0] + Math.cos(ang) * l1, root[1] + Math.sin(ang) * l1], [root[0] + Math.cos(a) * d, root[1] + Math.sin(a) * d]];
    }
    const resolveTarget = (t, J) => (Array.isArray(t) ? t : [J[t.j][0] + (t.dx || 0), J[t.j][1] + (t.dy || 0)]);

    /* ---------- solving a pose into joint positions ---------- */
    function solve(P) {
        const J = {};
        if (P.root === 'sh') {
            J.sh = [P.x, P.y];
            J.mid = pt(J.sh, P.c + 180, L.chest);
            J.hip = pt(J.mid, P.p + 180, L.pel);
        } else {
            J.hip = [P.x, P.y];
            J.mid = pt(J.hip, P.p, L.pel);
            J.sh = pt(J.mid, P.c, L.chest);
        }
        J.head = pt(J.sh, P.n, L.neck + L.head);
        ['1', '2'].forEach(i => {
            if (!P['h' + i]) { J['el' + i] = pt(J.sh, P['a' + i], L.up); J['hd' + i] = pt(J['el' + i], P['f' + i], L.fore); }
            if (!P['ft' + i]) { J['kn' + i] = pt(J.hip, P['t' + i], L.th); J['ft' + i] = pt(J['kn' + i], P['s' + i], L.sh); }
        });
        if (P.rot) {
            const c = [P.px, P.py];
            Object.keys(J).forEach(k => { J[k] = rotate(J[k], c, P.rot); });
        }
        ['1', '2'].forEach(i => {
            if (P['ft' + i]) {
                const [k, f] = ik(J.hip, resolveTarget(P['ft' + i], J), L.th, L.sh, P['kb' + i] != null ? P['kb' + i] : (P.kb != null ? P.kb : -1));
                J['kn' + i] = k; J['ft' + i] = f;
            }
        });
        ['1', '2'].forEach(i => {
            if (P['h' + i]) {
                const [e, h] = ik(J.sh, resolveTarget(P['h' + i], J), L.up, L.fore, P['eb' + i] != null ? P['eb' + i] : (P.eb != null ? P.eb : 1));
                J['el' + i] = e; J['hd' + i] = h;
            }
        });
        if (P.flip) Object.keys(J).forEach(k => { J[k] = [W - J[k][0], J[k][1]]; });
        return J;
    }

    /* ---------- interpolation ---------- */
    const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    function lerpVal(a, b, t) {
        if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
        if (Array.isArray(a) && Array.isArray(b)) return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        if (a && b && typeof a === 'object' && typeof b === 'object' && a.j === b.j) {
            return { j: a.j, dx: lerpVal(a.dx || 0, b.dx || 0, t), dy: lerpVal(a.dy || 0, b.dy || 0, t) };
        }
        return t < 0.5 ? a : b;
    }
    function lerpPose(A, B, t) {
        const out = {};
        new Set(Object.keys(A).concat(Object.keys(B))).forEach(k => {
            out[k] = A[k] === undefined ? B[k] : B[k] === undefined ? A[k] : lerpVal(A[k], B[k], t);
        });
        return out;
    }

    /* ---------- templates ---------- */
    const DEFAULT = { root: 'hip', x: 130, y: 110, p: 180, c: 180, n: 180, a1: 0, f1: 0, t1: 0, s1: 0, fd: -90 };
    const M = 110;   // centreline when lying on the mat
    const R = 97;    // centreline when lying on the reformer carriage
    const S0 = { x: 130, y: M, p: 180, c: 180, n: 180, a1: 0, f1: 0, t1: 0, s1: 0, fd: -90 };
    const PR = Object.assign({}, S0, { fd: 90 });
    const SIT = { x: 98, y: 107, p: -90, c: -90, n: -90, a1: 0, f1: 0, t1: 0, s1: 0, fd: 0 };
    const STAND = { x: 118, y: 66, p: -90, c: -90, n: -90, a1: 90, f1: 90, t1: 90, s1: 90, fd: 0 };
    const HOOK = { ft1: [166, M], ft2: [166, M] };
    const QUAD = { x: 152, y: 86, p: 186, c: 186, n: 160, fd: 90, h1: [114, M + 1], t1: 90, s1: 0 };
    const RS = { x: 165, y: R, p: 180, c: 180, n: 180, a1: 0, f1: 0, t1: 0, s1: 0, fd: -90, car: 108 };
    const legs = (t, s) => ({ t1: t, s1: s, t2: t, s2: s });
    const arms = (a, f) => ({ a1: a, f1: f, a2: a, f2: f });
    const F = (...parts) => Object.assign({}, ...parts);

    const T = {};
    /* --- warm-up & mat --- */
    T.breath = { scene: 'mat', speed: 1900, base: F(SIT, { t1: -6, s1: 172, t2: -2, s2: 176, h1: [112, 80], h2: [110, 82] }), frames: [{ gr: 5 }, { gr: 15, c: -94, h1: [115, 79] }] };
    T['pelvic-tilt'] = { scene: 'mat', speed: 1300, base: F(S0, HOOK, { root: 'sh', x: 94 }), frames: [{ p: 180 }, { p: 170 }] };
    T.bridge = { scene: 'mat', speed: 1700, base: F(S0, HOOK, { root: 'sh', x: 94 }), frames: [{ p: 180, c: 180 }, { p: 150, c: 156 }] };
    T['shoulder-bridge'] = { scene: 'mat', speed: 1200, base: F(S0, HOOK, { root: 'sh', x: 94, p: 150, c: 156 }), frames: [{ ft1: [166, M] }, { ft1: [150, 28] }] };
    T['knee-sway'] = { scene: 'mat', speed: 1500, base: F(S0, HOOK), frames: [{ ft1: [166, M], ft2: [166, M] }, { ft1: [168, M], ft2: [170, M], kb1: -0.35, kb2: -0.45 }] };
    T['chest-lift'] = { scene: 'mat', speed: 1400, base: F(S0, HOOK, { h1: { j: 'head', dx: -2, dy: -3 }, eb: -1 }), frames: [{ c: 180, n: 180 }, { c: 212, n: 226 }] };
    T.scap = { scene: 'mat', speed: 1100, base: F(S0, HOOK, arms(-90, -90)), frames: [{ c: 180 }, { c: 189 }] };
    T['cat-cow'] = { scene: 'mat', speed: 1600, base: QUAD, frames: [{ p: 206, c: 160, n: 118 }, { p: 170, c: 200, n: 206 }] };
    T['bird-dog'] = { scene: 'mat', speed: 1400, base: F(QUAD, { h1: null, a1: 96, f1: 96, a2: 96, f2: 96, t2: 90, s2: 0 }), frames: [{ n: 160 }, { n: 182, a1: 182, f1: 182, t2: 2, s2: 2 }] };
    T['roll-down'] = { scene: 'floor', speed: 1700, base: F(STAND, { ft1: [119, FLOOR - 1], ft2: [117, FLOOR - 1] }), frames: [{}, { x: 112, y: 68, p: 20, c: 82, n: 102 }] };
    T.closing = { scene: 'floor', speed: 1700, base: F(STAND, { ft1: [119, FLOOR - 1], ft2: [117, FLOOR - 1] }), frames: [{ x: 112, y: 68, p: 20, c: 82, n: 102 }, {}, F(arms(-95, -95))] };
    T.plie = { scene: 'floor', speed: 1300, base: F(STAND, { ft1: [124, FLOOR - 1], ft2: [117, FLOOR - 1] }, arms(55, 10)), frames: [{}, { y: 76, x: 116 }] };
    T['seated-twist'] = { scene: 'mat', speed: 1300, base: F(SIT, { a1: -8, f1: -8, a2: 188, f2: 188 }), frames: [{}, { a1: -50, f1: -50, a2: 232, f2: 232, c: -86 }] };
    T.hundred = { scene: 'mat', speed: 330, hold: 0, base: F(S0, legs(-38, -38), { c: 208, n: 220 }), frames: [arms(4, 4), arms(16, 16)] };
    T['dead-bug'] = { scene: 'mat', speed: 1200, base: F(S0, legs(-90, 0), arms(-90, -90)), frames: [{}, { a1: 196, f1: 196, t2: -12, s2: -12 }, {}, { a2: 196, f2: 196, t1: -12, s1: -12 }] };
    T['toe-taps'] = { scene: 'mat', speed: 1000, base: F(S0, legs(-90, 0)), frames: [{}, { t1: -35, s1: 36 }, {}, { t2: -35, s2: 36 }] };
    T['roll-up'] = { scene: 'mat', speed: 1500, base: S0, frames: [arms(190, 190), F({ p: 238, c: 272, n: 300 }, arms(300, 300)), F({ p: 292, c: 326, n: 356 }, arms(358, 358))] };
    T['neck-pull'] = { scene: 'mat', speed: 1500, base: F(S0, { h1: { j: 'head', dx: -2, dy: -3 }, eb: -1 }), frames: [{}, { p: 238, c: 272, n: 300 }, { p: 290, c: 322, n: 352 }] };
    T['roll-over'] = { scene: 'mat', speed: 1600, base: F(S0, { root: 'sh', x: 94 }), frames: [F({ p: 180, c: 180 }, legs(-90, -90)), F({ p: 100, c: 112 }, legs(-186, -186))] };
    T.jackknife = { scene: 'mat', speed: 1400, base: F(S0, { root: 'sh', x: 94 }), frames: [F({ p: 100, c: 112 }, legs(-186, -186)), F({ p: 88, c: 92 }, legs(-90, -90))] };
    T['leg-circle'] = { scene: 'mat', speed: 850, base: F(S0, { t2: 0, s2: 0 }), frames: [{ t1: -90, s1: -90 }, { t1: -60, s1: -60 }, { t1: -78, s1: -78 }, { t1: -108, s1: -108 }] };
    T.corkscrew = { scene: 'mat', speed: 900, base: S0, frames: [legs(-90, -90), legs(-58, -58), legs(-80, -80), legs(-110, -110)] };
    T['rolling-ball'] = { scene: 'mat', speed: 1000, base: { x: 112, y: 104, p: 250, c: 282, n: 312, fd: 0, t1: -62, s1: 96, t2: -60, s2: 98, h1: { j: 'kn1', dx: 5, dy: 8 }, h2: { j: 'kn2', dx: 5, dy: 8 }, px: 110, py: 112 }, frames: [{ rot: 0 }, { rot: -78 }] };
    T['open-leg-rocker'] = { scene: 'mat', speed: 1000, base: F({ x: 112, y: 105, p: 246, c: 258, n: 282, fd: 0, h1: { j: 'ft1', dx: -3, dy: 3 }, h2: { j: 'ft2', dx: -3, dy: 3 }, px: 112, py: 112 }, legs(-52, -52)), frames: [{ rot: 0 }, { rot: -62 }] };
    T.teaser = { scene: 'mat', speed: 1600, base: S0, frames: [F(arms(190, 190), legs(0, 0)), F({ p: 236, c: 244, n: 262 }, arms(320, 320), legs(-42, -42))] };
    T.boomerang = { scene: 'mat', speed: 1200, base: F({ x: 112, y: 106, p: 236, c: 244, n: 262, fd: 0, px: 110, py: 112 }, arms(320, 320), legs(-42, -42)), frames: [{ rot: 0 }, { rot: -95 }, { rot: 0 }, { rot: 0, a1: 150, f1: 150, a2: 150, f2: 150 }] };
    T['single-leg-stretch'] = { scene: 'mat', speed: 650, base: F(S0, { c: 208, n: 222 }, arms(-15, -40)), frames: [{ t1: -122, s1: -20, t2: -20, s2: -20 }, { t1: -20, s1: -20, t2: -122, s2: -20 }] };
    T['criss-cross'] = { scene: 'mat', speed: 750, base: F(S0, { c: 210, n: 222, h1: { j: 'head', dx: -2, dy: -3 }, eb: -1 }), frames: [{ t1: -122, s1: -20, t2: -20, s2: -20, c: 214 }, { t1: -20, s1: -20, t2: -122, s2: -20, c: 206 }] };
    T['double-leg-stretch'] = { scene: 'mat', speed: 1100, base: S0, frames: [F({ c: 212, n: 226 }, legs(-125, -15), arms(-40, -10)), F({ c: 205, n: 216 }, legs(-28, -28), arms(-165, -165))] };
    T.scissors = { scene: 'mat', speed: 650, base: F(S0, { c: 210, n: 224 }, arms(-72, -88)), frames: [{ t1: -100, s1: -100, t2: -12, s2: -12 }, { t1: -12, s1: -12, t2: -100, s2: -100 }] };
    T['lower-lift'] = { scene: 'mat', speed: 1300, base: F(S0, { c: 212, n: 225, h1: { j: 'head', dx: -2, dy: -3 }, eb: -1 }), frames: [legs(-90, -90), legs(-30, -30)] };
    T['spine-stretch'] = { scene: 'mat', speed: 1600, base: F(SIT, { t1: 0, s1: 0 }), frames: [F({ p: -90, c: -90, n: -90 }, arms(0, 0)), F({ p: -78, c: -26, n: 30 }, arms(22, 26))] };
    T.saw = { scene: 'mat', speed: 1400, base: SIT, frames: [{ a1: 0, f1: 0, a2: 180, f2: 180 }, { p: -76, c: -30, n: 20, a1: 26, f1: 30, a2: 226, f2: 226 }] };
    T.swan = { scene: 'mat', speed: 1500, base: F(PR, { h1: [100, M + 1], h2: [100, M + 1], eb: -1 }), frames: [{ c: 182, n: 186 }, { p: 188, c: 222, n: 238 }] };
    T['single-leg-kick'] = { scene: 'mat', speed: 450, base: F(PR, { c: 212, n: 214, h1: [84, M + 1], h2: [84, M + 1], eb: -1 }, legs(0, 0)), frames: [{}, { s1: -128 }, {}, { s2: -128 }] };
    T['double-leg-kick'] = { scene: 'mat', speed: 1000, base: F(PR, { h1: { j: 'mid', dx: 8, dy: -5 }, h2: { j: 'mid', dx: 8, dy: -5 } }), frames: [F({ c: 184, n: 150 }, legs(0, -130)), F({ c: 216, n: 230 }, legs(-4, -4))] };
    T.breaststroke = { scene: 'mat', speed: 1100, base: PR, frames: [F({ c: 184, n: 186 }, arms(200, 80)), F({ c: 214, n: 226 }, arms(196, 196)), F({ c: 220, n: 232 }, arms(12, 12))] };
    T['side-kick'] = { scene: 'mat', speed: 900, base: F(S0, { fd: 0, a1: 210, f1: 330, a2: 0, f2: 0, t2: 0, s2: 0 }), frames: [{ t1: -4, s1: -4 }, { t1: 40, s1: 40 }, { t1: -30, s1: -30 }] };
    T.clam = { scene: 'mat', speed: 1100, base: F(S0, { fd: 0, a1: 210, f1: 330, a2: 0, f2: 0, t2: 42, s2: 150 }), frames: [{ t1: 42, s1: 150 }, { t1: 10, s1: 118 }] };
    T['side-lift'] = { scene: 'mat', speed: 1100, base: F(S0, { fd: 0, a1: 210, f1: 330, a2: 0, f2: 0 }), frames: [legs(0, 0), legs(-14, -14)] };
    T['hip-circles'] = { scene: 'mat', speed: 900, base: F({ x: 108, y: 106, p: 222, c: 228, n: 252, fd: 0, h1: [84, M + 1], h2: [84, M + 1], eb: -1 }), frames: [legs(-45, -45), legs(-24, -24), legs(-40, -40), legs(-66, -66)] };
    T.swimming = { scene: 'mat', speed: 450, base: F(PR, { c: 200, n: 208 }), frames: [{ a1: 206, f1: 206, a2: 186, f2: 186, t1: 2, s1: 2, t2: -12, s2: -12 }, { a1: 186, f1: 186, a2: 206, f2: 206, t1: -12, s1: -12, t2: 2, s2: 2 }] };
    T.plank = { scene: 'mat', speed: 1500, base: { x: 140, y: 86, p: 192, c: 192, n: 196, fd: 90, h1: [105, M + 1], h2: [105, M + 1], ft1: [188, M], ft2: [188, M] }, frames: [{ gr: 4 }, { gr: 9, y: 87 }] };
    T['leg-pull-front'] = { scene: 'mat', speed: 1100, base: { x: 140, y: 86, p: 192, c: 192, n: 196, fd: 90, h1: [105, M + 1], h2: [105, M + 1], ft2: [188, M] }, frames: [{ ft1: [188, M] }, { ft1: [182, 80] }] };
    T['leg-pull-back'] = { scene: 'mat', speed: 1100, base: { root: 'sh', x: 92, y: 80, p: 192, c: 192, n: 196, fd: -90, h1: [86, M + 1], h2: [86, M + 1], ft2: [176, M] }, frames: [{ ft1: [176, M] }, { ft1: [150, 32] }] };
    T['kneeling-side-kick'] = { scene: 'mat', speed: 1000, base: { x: 140, y: 82, p: 196, c: 200, n: 196, fd: 0, h1: [104, M + 1], a2: -120, f2: 200, t2: 90, s2: 0 }, frames: [legs(0, 0), { t1: 30, s1: 30 }, { t1: -30, s1: -30 }] };
    T['side-bend'] = { scene: 'mat', speed: 1500, base: { x: 136, y: 102, fd: 0, p: 218, c: 228, n: 226, h1: [96, M + 1], a2: 120, f2: 100, ft1: [184, M], ft2: [184, M] }, frames: [{}, { y: 84, p: 202, c: 204, n: 200, a2: 205, f2: 205 }] };
    T.rocking = { scene: 'mat', speed: 900, base: F(PR, { c: 222, n: 236, p: 190, h1: { j: 'ft1', dx: 2, dy: 2 }, h2: { j: 'ft2', dx: 2, dy: 2 }, px: 128, py: M }, legs(-30, -150)), frames: [{ rot: 10 }, { rot: -14 }] };
    T['push-up'] = { scene: 'mat', speed: 1100, base: { x: 140, y: 86, p: 192, c: 192, n: 196, fd: 90, h1: [105, M + 1], h2: [105, M + 1], ft1: [188, M], ft2: [188, M], px: 188, py: M, eb: -1 }, frames: [{ rot: 0 }, { rot: -12 }] };
    T['figure4'] = { scene: 'mat', speed: 1500, base: F(S0, { ft2: { j: 'kn1', dx: 2, dy: -2 }, h1: { j: 'kn1', dx: -2, dy: 4 } }), frames: [{ t1: -50, s1: 40 }, { t1: -82, s1: 8 }] };
    T['thread-needle'] = { scene: 'mat', speed: 1500, base: F(QUAD, { h1: null, a2: 96, f2: 96 }), frames: [{ a1: 96, f1: 96 }, { a1: 64, f1: 64, c: 196, n: 140 }, { a1: -92, f1: -92, c: 182 }] };
    T['child-pose'] = { scene: 'mat', speed: 2000, base: { x: 150, y: 96, p: 196, c: 168, n: 150, fd: 90, a1: 180, f1: 180, t1: 0, s1: 180, t2: 0, s2: 180 }, frames: [{ gr: 4 }, { gr: 12, c: 172 }] };
    T['hip-flexor'] = { scene: 'mat', speed: 1600, base: { x: 120, y: 82, p: -90, c: -90, n: -90, fd: 0, a1: 80, f1: 60, ft1: [146, M], kb1: -1, t2: 100, s2: 0 }, frames: [{}, { x: 128, y: 84, t2: 116, a1: -88, f1: -88 }] };
    T.butterfly = { scene: 'mat', speed: 1700, base: F(SIT, { t1: -40, s1: 150, t2: -40, s2: 150, h1: { j: 'ft1', dx: -2, dy: -2 }, h2: { j: 'ft1', dx: -2, dy: -2 } }), frames: [{}, { p: -70, c: -30, n: 10 }] };
    T['knee-sway2'] = T['knee-sway'];

    /* front-view figures (lateral movement) */
    const FRONT = { front: true, x: 120, y: 68, p: -90, c: -90, n: -90, fd: 90, a1: 80, f1: 85, a2: 100, f2: 95, t1: 84, s1: 88, t2: 96, s2: 92 };
    T['side-stretch'] = { scene: 'floor', speed: 1600, base: FRONT, frames: [{}, { c: -112, n: -118, a1: -110, f1: -150, p: -96 }, {}, { c: -68, n: -62, a2: -70, f2: -30, p: -84 }] };
    T.mermaid = { scene: 'mat', speed: 1700, base: F(FRONT, { y: 100, t1: 10, s1: 120, t2: 170, s2: 60, a1: 60, f1: 90 }), frames: [{ a2: -100, f2: -100 }, { c: -60, n: -54, p: -82, a2: -40, f2: -20 }] };
    T['band-walk'] = { scene: 'floor', speed: 900, base: F(FRONT, { y: 72, ft1: [128, FLOOR - 1], ft2: [112, FLOOR - 1], a1: 70, f1: 120, a2: 110, f2: 60, kb1: 1, kb2: -1 }), frames: [{}, { x: 126, ft1: [142, FLOOR - 1] }, { x: 132, ft2: [124, FLOOR - 1], ft1: [142, FLOOR - 1] }], props: [{ type: 'band', from: 'kn1', to: 'kn2' }] };
    T['pull-apart'] = { scene: 'floor', speed: 1200, base: F(FRONT, { h1: [126, 72], h2: [114, 72], eb1: -1, eb2: 1 }), frames: [{}, { h1: [162, 70], h2: [78, 70] }], props: [{ type: 'band', from: 'hd1', to: 'hd2' }] };
    T.splits = { scene: 'reformer', speed: 1600, base: F(FRONT, { x: 150, y: 56, car: 112 }), frames: [{ t1: 70, s1: 72, t2: 110, s2: 108 }, { y: 70, t1: 40, s1: 40, t2: 140, s2: 140, car: 100 }] };
    T.skater = { scene: 'reformer', speed: 1200, base: F(FRONT, { x: 176, y: 60, car: 112, a1: 60, f1: 70, a2: 120, f2: 110 }), frames: [{ ft1: [196, 103], ft2: [160, 101] }, { ft1: [196, 103], ft2: [144, 101], x: 172, y: 64, car: 96 }] };

    /* standing / props */
    T['weights-arms'] = { scene: 'floor', speed: 1000, base: F(STAND, { ft1: [119, FLOOR - 1], ft2: [117, FLOOR - 1] }), frames: [arms(90, 90), arms(88, -60), arms(-60, -60)], props: [{ type: 'weight', at: 'hd1' }, { type: 'weight', at: 'hd2' }] };
    T['ring-arms'] = { scene: 'floor', speed: 1200, base: F(STAND, { ft1: [119, FLOOR - 1], ft2: [117, FLOOR - 1] }), frames: [arms(10, -10), arms(14, -18), arms(-70, -80)], props: [{ type: 'ring', at: 'hd1', w: 'rw' }] };
    T['step-up'] = { scene: 'chair', speed: 1500, base: F(STAND, { x: 104, y: 66, ft1: [122, 70], ft2: [102, FLOOR - 1], kb2: -1 }), frames: [{}, { x: 118, y: 24, ft2: [116, 70] }] };
    T['standing-press'] = { scene: 'chair', speed: 1100, base: F(STAND, { x: 166, y: 66, ft2: [168, FLOOR - 1], h1: [148, 70], h2: [148, 70] }), frames: [{ ft1: [152, 92], pedal: 92 }, { ft1: [150, 104], pedal: 104 }] };

    /* --- reformer --- */
    T.footwork = { scene: 'reformer', speed: 1100, base: F(RS, { ft1: [196, 82], ft2: [196, 82] }), frames: [{ x: 166, car: 108 }, { x: 149, car: 91 }] };
    T['calf-stretch'] = { scene: 'reformer', speed: 1500, base: F(RS, { x: 149, car: 91 }), frames: [{ ft1: [196, 80], ft2: [196, 80] }, { ft1: [194, 89], ft2: [194, 89] }] };
    T.running = { scene: 'reformer', speed: 450, base: F(RS, { x: 150, car: 92 }), frames: [{ ft1: [196, 80], ft2: [192, 88] }, { ft1: [192, 88], ft2: [196, 80] }] };
    T.jumpboard = { scene: 'jump', speed: 600, base: F(RS, { ft1: [203, 84], ft2: [203, 84] }), frames: [{ x: 168, car: 110 }, { x: 146, car: 88, ft1: [190, 84], ft2: [190, 84] }] };
    T['bridging-ref'] = { scene: 'reformer', speed: 1300, base: F(RS, { root: 'sh', x: 128, ft1: [196, 82], ft2: [196, 82] }), frames: [{ p: 180, c: 180 }, { p: 150, c: 156 }, { p: 150, c: 156, x: 116, car: 96 }] };
    T['supine-arms-ref'] = { scene: 'reformer', speed: 1200, straps: 'hands', base: F(RS, legs(-90, 0)), frames: [arms(-90, -90), arms(2, 2)] };
    T['hundred-ref'] = { scene: 'reformer', speed: 330, hold: 0, straps: 'hands', base: F(RS, legs(-38, -38), { c: 208, n: 220 }), frames: [arms(4, 4), arms(16, 16)] };
    T['ab-prep-ref'] = { scene: 'reformer', speed: 1300, straps: 'hands', base: F(RS, legs(-90, 0)), frames: [F({ c: 180, n: 180 }, arms(-80, -80)), F({ c: 210, n: 222 }, arms(8, 8))] };
    T['coordination-ref'] = { scene: 'reformer', speed: 1000, straps: 'hands', base: F(RS, { c: 210, n: 222 }), frames: [F(legs(-120, -10), arms(-40, -95)), F(legs(-32, -32), arms(8, 8))] };
    T['overhead-ref'] = { scene: 'reformer', speed: 1500, straps: 'hands', base: F(RS, { root: 'sh', x: 129 }), frames: [F({ p: 180, c: 180 }, legs(-90, -90), arms(-80, -80)), F({ p: 102, c: 112 }, legs(-188, -188), arms(10, 10))] };
    T['frogs-ref'] = { scene: 'reformer', speed: 1100, straps: 'feet', base: RS, frames: [legs(-50, 46), legs(-30, -30)] };
    T['bicycle-ref'] = { scene: 'reformer', speed: 900, straps: 'feet', base: RS, frames: [{ t1: -110, s1: -10, t2: -30, s2: -30 }, { t1: -30, s1: -30, t2: -110, s2: -10 }] };
    T['hamstring-ref'] = { scene: 'reformer', speed: 1500, straps: 'feet', base: RS, frames: [legs(-90, -90), legs(-30, -30)] };
    T['short-spine-ref'] = { scene: 'reformer', speed: 1500, straps: 'feet', base: F(RS, { root: 'sh', x: 129 }), frames: [F({ p: 180, c: 180 }, legs(-40, -40)), F({ p: 102, c: 112 }, legs(-188, -188)), F({ p: 120, c: 130 }, legs(-150, 60))] };
    T['tick-tock-ref'] = { scene: 'reformer', speed: 900, straps: 'feet', base: F(RS, { root: 'sh', x: 129 }), frames: [F({ p: 150, c: 160 }, legs(-110, -110)), F({ p: 165, c: 170 }, legs(-80, -80)), F({ p: 150, c: 160 }, legs(-130, -130))] };
    T['side-lying-ref'] = { scene: 'reformer', speed: 1100, straps: 'feet', base: F(RS, { fd: 0, a1: 210, f1: 330, a2: 0, f2: 0, t2: 0, s2: 0 }), frames: [{ t1: -40, s1: -40 }, { t1: 0, s1: 0 }] };
    T['rowing-ref'] = { scene: 'reformer', speed: 1300, straps: 'hands', base: F(SIT, { x: 120, y: 94, car: 96, fd: 180, t1: 180, s1: 180, t2: 180, s2: 180, flip: false }), frames: [F({ p: -96, c: -70, n: -40 }, arms(150, -70)), F({ p: -90, c: -90, n: -90 }, arms(-20, -20)), F(arms(-160, -160))] };
    T['kneeling-arms'] = { scene: 'reformer', speed: 1200, straps: 'hands', base: { x: 130, y: 76, p: -90, c: -90, n: -90, fd: 180, t1: 90, s1: 0, t2: 90, s2: 0, car: 100 }, frames: [arms(150, 150), arms(105, 105), arms(60, 60)] };
    T['chest-opener-ref'] = { scene: 'reformer', speed: 1600, straps: 'hands', base: { x: 130, y: 76, p: -90, c: -90, n: -90, fd: 180, t1: 90, s1: 0, t2: 90, s2: 0, car: 100 }, frames: [F(arms(150, 150), { c: -90 }), F(arms(50, 50), { c: -100, n: -110 })] };
    T['thigh-stretch'] = { scene: 'reformer', speed: 1500, straps: 'hands', base: { x: 130, y: 76, p: -90, c: -90, n: -90, fd: 180, t1: 90, s1: 0, t2: 90, s2: 0, car: 100, a1: 140, f1: 140, a2: 140, f2: 140, px: 130, py: 100 }, frames: [{ rot: 0 }, { rot: -24 }] };
    T['long-stretch'] = { scene: 'reformer', speed: 1300, base: { x: 150, y: 84, p: -12, c: -12, n: -14, fd: 90, h1: [198, 77], h2: [198, 77], car: 92 }, frames: [{ ft1: [104, 99], ft2: [104, 99] }, { x: 134, y: 86, car: 74, ft1: [87, 99], ft2: [87, 99] }] };
    T['down-stretch'] = { scene: 'reformer', speed: 1400, base: { x: 132, y: 80, p: -60, c: -30, n: -40, fd: 0, h1: [198, 77], h2: [198, 77], car: 94, t1: 90, s1: 180, t2: 90, s2: 180 }, frames: [{}, { x: 120, car: 82, p: -40, c: -10, n: -60 }] };
    T['up-stretch'] = { scene: 'reformer', speed: 1300, base: { x: 160, y: 58, p: 40, c: 40, n: 60, fd: 90, h1: [198, 77], h2: [198, 77], car: 92 }, frames: [{ ft1: [112, 99], ft2: [112, 99] }, { x: 150, y: 84, p: -12, c: -12, n: -14, car: 76, ft1: [96, 99], ft2: [96, 99] }] };
    T.elephant = { scene: 'reformer', speed: 1300, base: { x: 152, y: 56, p: 40, c: 52, n: 80, fd: 90, h1: [198, 77], h2: [198, 77], car: 100 }, frames: [{ ft1: [120, 100], ft2: [120, 100] }, { car: 84, ft1: [104, 100], ft2: [104, 100], x: 146 }] };
    T['tendon-stretch'] = { scene: 'reformer', speed: 1300, base: { x: 164, y: 54, p: 30, c: 48, n: 82, fd: 90, h1: [198, 77], h2: [198, 77] }, frames: [{ ft1: [140, 100], ft2: [140, 100], car: 112 }, { ft1: [128, 100], ft2: [128, 100], car: 100, x: 160, y: 58 }] };
    T['long-back-stretch'] = { scene: 'reformer', speed: 1300, base: { root: 'sh', x: 178, y: 70, p: -20, c: -25, n: -40, fd: -90, h1: [198, 77], h2: [198, 77], eb: -1 }, frames: [{ ft1: [100, 99], ft2: [100, 99], car: 94 }, { x: 174, y: 82, ft1: [90, 99], ft2: [90, 99], car: 84 }] };
    T['stomach-massage'] = { scene: 'reformer', speed: 1200, base: { x: 160, y: 96, p: -60, c: -40, n: -20, fd: 0, h1: [196, 79], h2: [196, 79], car: 104 }, frames: [{ ft1: [196, 84], ft2: [196, 84] }, { x: 146, car: 90, ft1: [196, 84], ft2: [196, 84] }] };
    T['knee-stretch'] = { scene: 'reformer', speed: 650, base: { x: 158, y: 80, p: -18, c: -10, n: 30, fd: 90, h1: [198, 77], h2: [198, 77] }, frames: [F(legs(110, 180), { car: 120 }), F(legs(140, 180), { car: 106 })] };
    T.scooter = { scene: 'reformer', speed: 1100, base: { x: 168, y: 72, p: -40, c: -20, n: -10, fd: 0, h1: [198, 77], h2: [198, 77], ft2: [176, FLOOR - 1] }, frames: [{ t1: 130, s1: 180, car: 110 }, { t1: 160, s1: 175, car: 90 }] };
    T['lunge-ref'] = { scene: 'reformer', speed: 1400, base: { x: 176, y: 60, p: -90, c: -90, n: -90, fd: 0, a1: 70, f1: 30, a2: 70, f2: 30, ft1: [210, 103] }, frames: [{ ft2: [140, 101], car: 114 }, { y: 72, x: 172, ft2: [118, 101], car: 92 }] };
    T['swan-box'] = { scene: 'box', speed: 1500, base: F(PR, { x: 104, y: 88, flip: true, h1: [44, 79], h2: [44, 79], car: 92 }), frames: [{ c: 182, n: 186 }, { p: 188, c: 222, n: 238 }] };
    T['pull-straps-box'] = { scene: 'box', speed: 1300, straps: 'hands', base: F(PR, { x: 126, y: 88, car: 92 }), frames: [F(arms(110, 110), { c: 186 }), F(arms(6, 6), { c: 206, n: 214 })] };
    T['breaststroke-box'] = { scene: 'box', speed: 1100, base: F(PR, { x: 104, y: 88, flip: true, car: 92 }), frames: [F({ c: 184, n: 186 }, arms(200, 80)), F({ c: 214, n: 226 }, arms(196, 196)), F({ c: 220, n: 232 }, arms(12, 12))] };
    T['backstroke-box'] = { scene: 'box', speed: 1100, straps: 'hands', base: F(S0, { x: 126, y: 88, c: 210, n: 222, car: 92 }), frames: [F(legs(-120, -10), arms(-140, -150)), F(legs(-80, -80), arms(-80, -80)), F(legs(-40, -40), arms(10, 10))] };
    T['teaser-box'] = { scene: 'box', speed: 1500, straps: 'hands', base: F(S0, { x: 126, y: 88, car: 92 }), frames: [F(arms(-150, -150), legs(-30, -30), { c: 200, n: 210 }), F({ p: 236, c: 244, n: 262 }, arms(320, 320), legs(-42, -42))] };
    T['short-box'] = { scene: 'shortbox', speed: 1500, base: F(SIT, { x: 120, y: 84, car: 96, ft1: [160, 99], ft2: [160, 99], h1: { j: 'head', dx: 4, dy: -2 }, eb: 1 }), frames: [{ p: -90, c: -90, n: -90 }, { p: -120, c: -150, n: -140 }] };
    T['snake-ref'] = { scene: 'reformer', speed: 1300, base: { x: 150, y: 70, p: 20, c: 0, n: 10, fd: 90, h1: [198, 77], h2: [198, 77] }, frames: [{ ft1: [110, 99], ft2: [114, 99], car: 92 }, { x: 140, y: 82, p: -10, c: -14, ft1: [96, 99], ft2: [100, 99], car: 78 }] };
    T['star-ref'] = { scene: 'reformer', speed: 1300, base: { x: 150, y: 82, p: -14, c: -14, n: -14, fd: -90, h1: [198, 77], a2: -100, f2: -100 }, frames: [{ ft1: [106, 99], ft2: [106, 99], car: 92 }, { ft1: [96, 99], ft2: [110, 60], car: 82, x: 144 }] };
    T['push-up-ref'] = { scene: 'reformer', speed: 1100, base: { x: 140, y: 82, p: -10, c: -10, n: -6, fd: 90, h1: [196, 103], h2: [196, 103], ft1: [100, 99], ft2: [100, 99], px: 100, py: 99, eb: -1, car: 82 }, frames: [{ rot: 0 }, { rot: 12 }] };

    /* --- other apparatus --- */
    T['chair-footwork'] = { scene: 'chair', speed: 1100, base: { x: 120, y: 66, p: -90, c: -90, n: -90, fd: 0, h1: [104, 70], h2: [104, 70] }, frames: [{ ft1: [152, 90], ft2: [152, 90], pedal: 90 }, { ft1: [158, 104], ft2: [158, 104], pedal: 104 }] };
    T['chair-swan'] = { scene: 'chair', speed: 1400, base: F(PR, { x: 140, y: 66, flip: true }), frames: [F({ c: 196, n: 200 }, { h1: [64, 98], h2: [64, 98], pedal: 104 }), F({ p: 186, c: 222, n: 236 }, { h1: [70, 88], h2: [70, 88], pedal: 90 })] };
    T['cadillac-roll-down'] = { scene: 'cadillac', speed: 1500, bar: true, base: F(SIT, { x: 96, y: 90, ft1: [150, 92], ft2: [150, 92] }), frames: [F({ p: -90, c: -90, n: -90 }, arms(-14, -10)), F({ p: -150, c: -170, n: -150 }, arms(-18, -20))] };
    T['push-through'] = { scene: 'cadillac', speed: 1600, bar: true, base: F(SIT, { x: 96, y: 90, t1: 0, s1: 0, t2: 0, s2: 0 }), frames: [F({ p: -90, c: -90, n: -90 }, arms(-80, -86)), F({ p: -76, c: -26, n: 30 }, arms(22, 26))] };
    T['leg-springs'] = { scene: 'cadillac', speed: 1300, springs: 'feet', base: F(S0, { y: 88, x: 120 }), frames: [legs(-90, -90), legs(-24, -24)] };
    T['arm-springs'] = { scene: 'cadillac', speed: 1200, springs: 'hands', base: F(S0, { y: 88, x: 120, ft1: [152, 88], ft2: [152, 88] }), frames: [arms(-110, -110), arms(0, 0)] };
    T['spine-corrector'] = { scene: 'arc', speed: 1400, base: F(S0, { x: 140, y: M - 2, ft1: [176, M], ft2: [176, M], h1: { j: 'head', dx: -2, dy: -3 }, eb: -1 }), frames: [{ c: 168, n: 166 }, { c: 212, n: 226 }] };
    T['ladder-barrel'] = { scene: 'ladder', speed: 1600, base: F(FRONT, { x: 132, y: 66, ft1: [150, FLOOR - 1], ft2: [128, FLOOR - 1] }), frames: [{ a1: -100, f1: -100, a2: -80, f2: -80 }, { c: -40, n: -30, p: -70, a1: -20, f1: -10, a2: 10, f2: 30 }] };

    /* --- props on the mat --- */
    T['ball-bridge'] = F(T.bridge, { props: [{ type: 'ball', at: 'kn1', dx: -1, dy: 3 }] });
    T['ab-curl-ball'] = F(T['chest-lift'], { props: [{ type: 'ball', at: 'mid', dx: -4, dy: 9, r: 7 }] });
    T['hundred-ring'] = F(T.hundred, { props: [{ type: 'ring', at: 'ft1' }] });
    T['ring-squeeze'] = { scene: 'mat', speed: 900, base: F(S0, HOOK), frames: [{ rw: 12, ft1: [166, M], ft2: [166, M] }, { rw: 8 }], props: [{ type: 'ring', at: 'kn1', w: 'rw' }] };
    T['band-footwork'] = { scene: 'mat', speed: 1200, base: F(S0, { c: 196, n: 200, h1: { j: 'mid', dx: 6, dy: -14 }, h2: { j: 'mid', dx: 6, dy: -14 } }), frames: [legs(-90, 0), legs(-38, -38)], props: [{ type: 'band', from: 'hd1', to: 'ft1' }] };
    T['roller-march'] = { scene: 'mat', speed: 1100, base: F(S0, { y: 100, ft1: [164, M], ft2: [164, M] }), frames: [{}, { ft1: [146, 74] }, {}, { ft2: [146, 74] }], props: [{ type: 'roller', at: 'mid', dx: -2, dy: 8 }] };
    T['roller-chest'] = { scene: 'mat', speed: 1700, base: F(S0, { y: 100, ft1: [164, M], ft2: [164, M] }), frames: [arms(-90, -90), arms(-158, -158)], props: [{ type: 'roller', at: 'mid', dx: -2, dy: 8 }] };
    T['swiss-bridge'] = { scene: 'mat', speed: 1400, base: F(S0, { root: 'sh', x: 92, y: M, kb: -1 }), frames: [{ p: 172, c: 178, ft1: [176, 86], ft2: [176, 86] }, { p: 160, c: 165, ft1: [158, 86], ft2: [158, 86] }], props: [{ type: 'swiss', at: 'ft1', dx: 2, dy: 12 }] };
    T['swiss-pike'] = { scene: 'mat', speed: 1400, base: { x: 140, y: 88, p: 190, c: 190, n: 196, fd: 90, h1: [106, M + 1], h2: [106, M + 1] }, frames: [{ ft1: [184, 86], ft2: [184, 86] }, { x: 126, y: 54, p: 120, c: 118, n: 110, ft1: [150, 86], ft2: [150, 86] }], props: [{ type: 'swiss', at: 'ft1', dx: 4, dy: 13 }] };
    T['ball-back-release'] = { scene: 'mat', speed: 2000, base: { x: 132, y: 72, p: 178, c: 160, n: 140, fd: -90, ft1: [176, M], ft2: [176, M], a1: 160, f1: 150, a2: 160, f2: 150 }, frames: [{ gr: 4 }, { gr: 11, c: 154, n: 134 }], props: [{ type: 'swiss', fixed: [122, 92] }] };
    T['ball-squeeze-bridge'] = T['ball-bridge'];

    /* aliases */
    T.seal = T['rolling-ball'];
    T['semi-circle-ref'] = T['bridging-ref'];
    T['lb-teaser'] = T['teaser-box'];

    /* ---------- drawing ---------- */
    const f1 = n => Math.round(n * 10) / 10;
    const line = (pts, color, w, extra = '') => `<polyline points="${pts.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

    function sceneSvg(scene, P, J, tpl) {
        const s = [];
        const car = P.car != null ? P.car : 100;
        if (scene === 'mat') s.push(`<rect x="14" y="${FLOOR}" width="212" height="5" rx="2.5" fill="${COLORS.mat}"/>`);
        if (scene === 'floor' || scene === 'chair' || scene === 'ladder') s.push(`<rect x="10" y="${FLOOR}" width="220" height="3" rx="1.5" fill="${COLORS.floor}"/>`);
        if (scene === 'reformer' || scene === 'box' || scene === 'shortbox' || scene === 'jump') {
            s.push(`<rect x="10" y="110" width="220" height="7" rx="3.5" fill="${COLORS.frame}" stroke="${COLORS.frameLine}" stroke-width="1"/>`);
            s.push(`<rect x="12" y="74" width="5" height="38" rx="2" fill="${COLORS.frameLine}"/><circle cx="14.5" cy="74" r="3" fill="${COLORS.bar}"/>`);
            s.push(`<rect x="206" y="103" width="22" height="8" rx="2" fill="${COLORS.frame}" stroke="${COLORS.frameLine}" stroke-width="1"/>`);
            if (scene === 'jump') s.push(`<rect x="203" y="68" width="5" height="42" rx="2" fill="${COLORS.bar}"/>`);
            else s.push(`<line x1="200" y1="110" x2="198" y2="78" stroke="${COLORS.bar}" stroke-width="3" stroke-linecap="round"/><circle cx="198" cy="77" r="3.2" fill="${COLORS.bar}"/>`);
            s.push(`<rect x="${f1(car)}" y="101" width="74" height="9" rx="3" fill="${COLORS.carriage}"/>`);
            s.push(`<rect x="${f1(car + 2)}" y="93" width="5" height="9" rx="2" fill="${COLORS.bar}"/>`);
            if (scene === 'box') s.push(`<rect x="${f1(car + 6)}" y="92" width="62" height="10" rx="3" fill="${COLORS.wood}" stroke="${COLORS.woodLine}" stroke-width="1"/>`);
            if (scene === 'shortbox') s.push(`<rect x="${f1(car + 16)}" y="88" width="30" height="14" rx="3" fill="${COLORS.wood}" stroke="${COLORS.woodLine}" stroke-width="1"/>`);
            if (scene !== 'jump') s.push(`<line x1="${f1(car + 12)}" y1="${scene === 'box' ? 92 : 101}" x2="${f1(car + 70)}" y2="${scene === 'box' ? 92 : 101}" stroke="none"/>`);
        }
        if (scene === 'chair') {
            s.push(`<rect x="90" y="70" width="56" height="7" rx="3" fill="${COLORS.wood}" stroke="${COLORS.woodLine}" stroke-width="1"/>`);
            s.push(`<rect x="92" y="77" width="52" height="34" rx="3" fill="#F6EEE4" stroke="${COLORS.woodLine}" stroke-width="1"/>`);
            const py = P.pedal != null ? P.pedal : 96;
            s.push(`<line x1="146" y1="108" x2="172" y2="${f1(py)}" stroke="${COLORS.bar}" stroke-width="3.2" stroke-linecap="round"/>`);
        }
        if (scene === 'cadillac') {
            s.push(`<rect x="16" y="92" width="210" height="8" rx="3" fill="${COLORS.frame}" stroke="${COLORS.frameLine}" stroke-width="1"/>`);
            s.push(`<line x1="24" y1="100" x2="24" y2="${FLOOR}" stroke="${COLORS.frameLine}" stroke-width="3"/><line x1="218" y1="100" x2="218" y2="${FLOOR}" stroke="${COLORS.frameLine}" stroke-width="3"/>`);
            s.push(`<line x1="20" y1="20" x2="20" y2="92" stroke="${COLORS.frameLine}" stroke-width="3"/><line x1="20" y1="20" x2="200" y2="20" stroke="${COLORS.frameLine}" stroke-width="3"/><line x1="200" y1="20" x2="200" y2="92" stroke="${COLORS.frameLine}" stroke-width="3"/>`);
        }
        if (scene === 'arc') {
            s.push(`<rect x="14" y="${FLOOR}" width="212" height="5" rx="2.5" fill="${COLORS.mat}"/>`);
            s.push(`<path d="M86 ${FLOOR} Q112 ${FLOOR - 26} 138 ${FLOOR} Z" fill="${COLORS.wood}" stroke="${COLORS.woodLine}" stroke-width="1"/>`);
        }
        if (scene === 'ladder') {
            s.push(`<path d="M150 ${FLOOR} L150 84 Q150 62 128 62 Q106 62 106 84 L106 ${FLOOR} Z" fill="${COLORS.wood}" stroke="${COLORS.woodLine}" stroke-width="1"/>`);
            s.push(`<line x1="196" y1="${FLOOR}" x2="196" y2="40" stroke="${COLORS.woodLine}" stroke-width="3"/>`);
        }
        return s.join('');
    }

    function propsSvg(list, P, J) {
        return (list || []).map(pr => {
            const at = pr.fixed ? pr.fixed : (J[pr.at] ? [J[pr.at][0] + (pr.dx || 0), J[pr.at][1] + (pr.dy || 0)] : null);
            if (pr.type === 'band' && J[pr.from] && J[pr.to]) return line([J[pr.from], J[pr.to]], COLORS.band, 2);
            if (!at) return '';
            if (pr.type === 'ball') return `<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${pr.r || 6}" fill="${COLORS.ball}"/>`;
            if (pr.type === 'swiss') return `<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${pr.r || 15}" fill="${COLORS.swiss}" stroke="#E9BFA2" stroke-width="1"/>`;
            if (pr.type === 'roller') return `<circle cx="${f1(at[0])}" cy="${f1(at[1])}" r="${pr.r || 6}" fill="${COLORS.roller}" stroke="#9CC3AC" stroke-width="1"/>`;
            if (pr.type === 'weight') return `<rect x="${f1(at[0] - 3.5)}" y="${f1(at[1] - 2.2)}" width="7" height="4.4" rx="1.5" fill="${COLORS.weight}"/>`;
            if (pr.type === 'ring') {
                const w = pr.w ? (P[pr.w] != null ? P[pr.w] : 11) : 11;
                return `<ellipse cx="${f1(at[0])}" cy="${f1(at[1])}" rx="${f1(w / 2 + 1)}" ry="7" fill="none" stroke="${COLORS.ring}" stroke-width="2.2"/>`;
            }
            return '';
        }).join('');
    }

    function figureSvg(J, P, tpl) {
        const bodyC = COLORS.body;
        const farC = P.front ? COLORS.body : COLORS.far;
        const out = [];
        // far limbs
        out.push(line([J.hip, J.kn2, J.ft2], farC, P.front ? 5 : 4.6));
        out.push(line([J.sh, J.el2, J.hd2], farC, P.front ? 4.4 : 4));
        // straps / springs (behind body)
        const pulley = [14.5, 74];
        const top = [P.springs ? 40 : 14.5, P.springs ? 20 : 74];
        if (tpl.straps === 'hands') out.push(line([pulley, J.hd2], '#B9A9D9', 1.2) + line([pulley, J.hd1], '#B9A9D9', 1.2));
        if (tpl.straps === 'feet') out.push(line([pulley, J.ft2], '#B9A9D9', 1.2) + line([pulley, J.ft1], '#B9A9D9', 1.2));
        if (tpl.springs === 'feet') out.push(line([top, J.ft1], '#B9A9D9', 1.2, 'stroke-dasharray="2 2"'));
        if (tpl.springs === 'hands') out.push(line([top, J.hd1], '#B9A9D9', 1.2, 'stroke-dasharray="2 2"'));
        // torso (smooth curve through the mid-back)
        const cx = 2 * J.mid[0] - (J.hip[0] + J.sh[0]) / 2;
        const cy = 2 * J.mid[1] - (J.hip[1] + J.sh[1]) / 2;
        out.push(`<path d="M${f1(J.hip[0])} ${f1(J.hip[1])} Q${f1(cx)} ${f1(cy)} ${f1(J.sh[0])} ${f1(J.sh[1])}" fill="none" stroke="${bodyC}" stroke-width="6.4" stroke-linecap="round"/>`);
        // near limbs
        out.push(line([J.hip, J.kn1, J.ft1], bodyC, 5.2));
        out.push(line([J.sh, J.el1, J.hd1], bodyC, 4.6));
        if (tpl.bar && J.hd1) out.push(`<line x1="${f1(J.hd1[0])}" y1="${f1(J.hd1[1] - 9)}" x2="${f1(J.hd1[0])}" y2="${f1(J.hd1[1] + 9)}" stroke="${COLORS.bar}" stroke-width="3" stroke-linecap="round"/>` + line([[J.hd1[0], J.hd1[1] - 9], [180, 20]], '#B9A9D9', 1.2, 'stroke-dasharray="2 2"'));
        // head + eye (shows which way the face points)
        const fd = P.flip ? 180 - (P.fd || 0) : (P.fd || 0);
        const eye = pt(J.head, fd, 3.4);
        out.push(`<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="${L.head}" fill="${bodyC}"/>`);
        if (!P.front) out.push(`<circle cx="${f1(eye[0])}" cy="${f1(eye[1])}" r="1.5" fill="${COLORS.eye}"/>`);
        // breathing glow
        if (P.gr) out.push(`<circle cx="${f1(J.mid[0])}" cy="${f1(J.mid[1])}" r="${f1(P.gr)}" fill="${COLORS.glow}" opacity="0.35"/>`);
        return out.join('');
    }

    function frameAt(tpl, time) {
        const frames = tpl._frames;
        const n = frames.length;
        const seg = tpl.speed || 1300;
        const hold = tpl.hold != null ? tpl.hold : 260;
        const total = n * (seg + hold);
        const t = ((time % total) + total) % total;
        const i = Math.floor(t / (seg + hold));
        const within = t - i * (seg + hold);
        const k = within < hold ? 0 : ease(Math.min(1, (within - hold) / seg));
        return lerpPose(frames[i], frames[(i + 1) % n], k);
    }

    function prepare(tpl) {
        if (tpl._frames) return tpl;
        const base = Object.assign({}, DEFAULT, tpl.base || {});
        tpl._frames = (tpl.frames && tpl.frames.length ? tpl.frames : [{}]).map(fr => {
            const P = Object.assign({}, base, fr);
            Object.keys(P).forEach(k => { if (P[k] === null) delete P[k]; });
            if (P.a2 === undefined && P.h2 === undefined) { if (P.h1) P.h2 = P.h1; else { P.a2 = P.a1; P.f2 = P.f1; } }
            if (P.t2 === undefined && P.ft2 === undefined) { if (P.ft1) P.ft2 = P.ft1; else { P.t2 = P.t1; P.s2 = P.s1; } }
            if (P.f2 === undefined && P.a2 !== undefined) P.f2 = P.a2;
            if (P.s2 === undefined && P.t2 !== undefined) P.s2 = P.t2;
            return P;
        });
        return tpl;
    }

    function render(key, time) {
        const tpl = T[key];
        if (!tpl) return '';
        prepare(tpl);
        const P = frameAt(tpl, time);
        const J = solve(P);
        return paint(tpl, P, J);
    }
    const UNDER = ['swiss', 'roller'];
    function paint(tpl, P, J) {
        const list = tpl.props || [];
        return sceneSvg(tpl.scene, P, J, tpl)
            + propsSvg(list.filter(p => UNDER.includes(p.type)), P, J)
            + figureSvg(J, P, tpl)
            + propsSvg(list.filter(p => !UNDER.includes(p.type)), P, J);
    }

    /* auto-fit the view box around the movement (2:1), keeping the floor in view */
    const SCENE_X = { reformer: [6, 234], box: [6, 234], shortbox: [6, 234], jump: [6, 234], cadillac: [12, 230], chair: [84, 182], ladder: [98, 204], arc: [80, 145] };
    function viewBox(key) {
        const tpl = T[key];
        if (!tpl) return '0 0 240 124';
        prepare(tpl);
        if (tpl._vb) return tpl._vb;
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
        const fr = tpl._frames;
        for (let i = 0; i < fr.length; i++) {
            for (let k = 0; k < 4; k++) {
                const J = solve(lerpPose(fr[i], fr[(i + 1) % fr.length], k / 4));
                Object.keys(J).forEach(n => {
                    const r = n === 'head' ? L.head + 1 : 3;
                    x0 = Math.min(x0, J[n][0] - r); x1 = Math.max(x1, J[n][0] + r); y0 = Math.min(y0, J[n][1] - r);
                });
            }
        }
        (tpl.props || []).forEach(pr => { if (pr.type === 'swiss') { y0 = Math.min(y0, FLOOR - 32); } });
        const sx = SCENE_X[tpl.scene];
        if (sx) { x0 = Math.min(x0, sx[0]); x1 = Math.max(x1, sx[1]); }
        if (tpl.scene === 'cadillac') y0 = Math.min(y0, 14);
        if (tpl.springs || tpl.straps) { y0 = Math.min(y0, 68); }
        x0 -= 10; x1 += 10; y0 -= 8;
        const y1 = FLOOR + 8;
        let w = x1 - x0, h = y1 - y0;
        if (w / h < 2) { const nw = h * 2; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / 2; y0 -= (nh - h); h = nh; }
        tpl._vb = [x0, y0, w, h].map(v => Math.round(v * 10) / 10).join(' ');
        return tpl._vb;
    }

    /* ---------- animation loop ---------- */
    const active = new Set();
    let raf = 0;
    let last = 0;
    const reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick(now) {
        raf = 0;
        if (now - last > 33) {
            last = now;
            active.forEach(el => {
                if (!el.isConnected) { active.delete(el); return; }
                if (el._paused) return;
                try { el._svg.innerHTML = render(el.dataset.demo, Math.max(0, now - el._start)); } catch (e) { active.delete(el); }
            });
        }
        if (active.size) raf = requestAnimationFrame(tick);
    }
    const io = 'IntersectionObserver' in global ? new IntersectionObserver(entries => {
        entries.forEach(en => { en.target._paused = !en.isIntersecting; });
    }) : null;

    function mount(root) {
        (root || document).querySelectorAll('.demo[data-demo]:not([data-ready])').forEach(el => {
            el.dataset.ready = '1';
            if (!T[el.dataset.demo]) { el.hidden = true; return; }
            el.innerHTML = `<svg viewBox="${viewBox(el.dataset.demo)}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="הדמיית תנועה"></svg>`;
            el._svg = el.firstChild;
            el._start = performance.now();
            el._svg.innerHTML = render(el.dataset.demo, reduced ? 0 : 0);
            if (reduced) return;
            active.add(el);
            if (io) io.observe(el);
            if (!raf) raf = requestAnimationFrame(tick);
        });
    }

    function renderFrame(key, i) {
        const tpl = T[key];
        if (!tpl) return '';
        prepare(tpl);
        const P = tpl._frames[i % tpl._frames.length];
        return paint(tpl, P, solve(P));
    }
    const frameCount = key => (T[key] ? prepare(T[key])._frames.length : 0);

    global.EverydrayDemos = { mount, has: key => !!T[key], render, renderFrame, frameCount, viewBox, keys: () => Object.keys(T) };
})(window);
