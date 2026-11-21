/* ASCII reels — procedural ASCII animations on a character grid.
   Pipeline after https://www.avivashishta.com/blog/ascii-reels-eye-roses-sunflower-python
   (density ramp, glyph atlas, soft tone curve, shimmer, bloom, vignette). */
// ---------- grid + glyphs (after avivashishta.com "ASCII reels") ----------
var RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
var EXTRA = "θ×°√·=0123456789abcdefghijklmnopqrstuvwxyz|/\\*~.,:' ";
var CHARS = RAMP;
for (var _k = 0; _k < EXTRA.length; _k++) { if (CHARS.indexOf(EXTRA[_k]) < 0) CHARS += EXTRA[_k]; }
var CI = {};
for (var _j = 0; _j < CHARS.length; _j++) { if (!(CHARS[_j] in CI)) CI[CHARS[_j]] = _j; }

var COLS = 96, ROWS = 68, CW = 8, CH = 14, W = COLS * CW, H = ROWS * CH, U = H / 2, DPR = 2, N = COLS * ROWS;
var TAU = Math.PI * 2, BG = '#0F1A13';
var XS = new Float32Array(N), YS = new Float32Array(N), VIG = new Float32Array(N);
for (var r0 = 0; r0 < ROWS; r0++) for (var c0 = 0; c0 < COLS; c0++) {
  var i0 = r0 * COLS + c0;
  XS[i0] = ((c0 + 0.5) * CW - W / 2) / U;
  YS[i0] = ((r0 + 0.5) * CH - H / 2) / U;
  VIG[i0] = Math.max(0.35, 1 - 0.38 * (XS[i0] * XS[i0] + YS[i0] * YS[i0]) / 1.65);
}
var V = new Float32Array(N), T = new Uint8Array(N), F = new Int16Array(N);

// tones
var TONES = ['#F4EFE6', '#F0C04A', '#7A5432', '#F2C14E', '#A8742C', '#7FB77E', '#F08DA6', '#C2456A', '#FFD0DC', '#E7A3A0', '#E8B44C', '#9A6232', '#C99A82', '#FF5C7A', '#DDE8DA', '#9BD3A2', '#4F8A5E', '#EADBCF', '#D9A35B', '#DCD6C8', '#F6E7C8'];
var WHITE = 0, SEED_LIT = 1, SEED_DARK = 2, PETAL = 3, PETAL_BACK = 4, STEM = 5, ROSE = 6, ROSE_DEEP = 7, ROSE_CENTER = 8,
    EYE_PINK = 9, IRIS_GOLD = 10, IRIS_BROWN = 11, SKIN = 12, HEART = 13, STAR = 14, TEXT = 15, LEAF = 16, LASH = 17, WOOD = 18, STRING = 19, NOTE = 20;

function ss(a, b, t) { var x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); }
function fract(x) { return x - Math.floor(x); }
function hash(n) { return fract(Math.sin(n * 127.1 + 311.7) * 43758.5453); }
function cellAt(X, Y) {
  var c = Math.floor((X * U + W / 2) / CW), r = Math.floor((Y * U + H / 2) / CH);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return -1;
  return r * COLS + c;
}
function putText(str, row, lum, tone) {
  var c = Math.floor((COLS - str.length) / 2);
  for (var k = 0; k < str.length; k++) {
    var ch = str[k]; if (ch === ' ') continue;
    var idx = row * COLS + c + k; if (idx < 0 || idx >= N) continue;
    F[idx] = CI[ch] != null ? CI[ch] : CI['?']; V[idx] = lum; T[idx] = tone;
  }
}
function slopeChar(s) { return Math.abs(s) < 0.35 ? '|' : (s > 0 ? '\\' : '/'); }

// ---------- 1. golden-angle sunflower ----------
var GOLDEN = Math.PI * (3 - Math.sqrt(5));
var NS = 640, RH = 0.3;
var SEED_T = new Float32Array(NS), SEED_R = new Float32Array(NS);
for (var n0 = 0; n0 < NS; n0++) { SEED_T[n0] = n0 * GOLDEN; SEED_R[n0] = RH * Math.sqrt(n0 / NS); }
var ARM_RANK = (function () {
  var vals = [], ord = [], rank = [];
  for (var k = 0; k < 21; k++) { vals.push((k * GOLDEN) % TAU); ord.push(k); }
  ord.sort(function (a, b) { return vals[a] - vals[b]; });
  for (var p = 0; p < 21; p++) rank[ord[p]] = p;
  return rank;
})();
var SUN_TEXT = 'θ = n × 137.508°   r = c·√n';

function sceneSunflower(t) {
  var cx = 0, cy = -0.16, open = ss(3.6, 7.6, t), rot = t * 0.04;
  var R0 = RH * 0.95, L1 = 0.3 * open, L2 = 0.37 * open, seg1 = TAU / 34, seg2 = TAU / 21;
  var stemTop = cy + R0, stemBot = 0.78, stemG = ss(0.0, 2.0, t);
  for (var i = 0; i < N; i++) {
    var dx = XS[i] - cx, dy = YS[i] - cy, rr = Math.sqrt(dx * dx + dy * dy);
    if (rr < RH) { V[i] = 0.05 + 0.07 * (1 - rr / RH); T[i] = SEED_DARK; continue; }
    if (open > 0) {
      var a = Math.atan2(dy, dx);
      var u1 = (rr - R0) / L1;
      if (u1 >= 0 && u1 < 1) {
        var rel = a - rot, d = rel - Math.round(rel / seg1) * seg1;
        var hw = seg1 * 0.47 * Math.pow(Math.sin(Math.PI * Math.pow(u1, 0.65)), 0.7);
        if (Math.abs(d) < hw) { var e = 1 - Math.abs(d) / hw; V[i] = (0.42 + 0.55 * e) * (1 - 0.35 * u1); T[i] = PETAL; continue; }
      }
      var u2 = (rr - R0) / L2;
      if (u2 >= 0 && u2 < 1) {
        var rel2 = a - rot * 0.8 + seg2 * 0.5, d2 = rel2 - Math.round(rel2 / seg2) * seg2;
        var hw2 = seg2 * 0.42 * Math.pow(Math.sin(Math.PI * Math.pow(u2, 0.6)), 0.7);
        if (Math.abs(d2) < hw2) { var e2 = 1 - Math.abs(d2) / hw2; V[i] = (0.16 + 0.24 * e2) * (1 - 0.3 * u2); T[i] = PETAL_BACK; continue; }
      }
    }
    // leaves
    var Y = YS[i], X = XS[i];
    var lg = ss(1.2, 3.2, t);
    if (lg > 0) {
      var lx = X - 0.1, ly = Y - 0.6, ca = Math.cos(-0.55), sa = Math.sin(-0.55);
      var qx = (lx * ca - ly * sa) / (0.11 * lg), qy = (lx * sa + ly * ca) / (0.035 * lg);
      if (qx * qx + qy * qy < 1) { V[i] = 0.3 + 0.3 * (1 - Math.abs(qy)); T[i] = LEAF; continue; }
      var mx = X + 0.1, my = Y - 0.7, cb = Math.cos(0.55), sb = Math.sin(0.55);
      var px = (mx * cb - my * sb) / (0.1 * lg), py = (mx * sb + my * cb) / (0.033 * lg);
      if (px * px + py * py < 1) { V[i] = 0.3 + 0.3 * (1 - Math.abs(py)); T[i] = LEAF; continue; }
    }
  }
  // stem, typed by slope
  for (var r = 0; r < ROWS; r++) {
    var y = YS[r * COLS];
    if (y < stemTop || y > stemTop + (stemBot - stemTop) * stemG) continue;
    var x = cx + 0.02 * Math.sin(y * 5 + t * 0.7), dxdy = 0.1 * Math.cos(y * 5 + t * 0.7);
    var idx = cellAt(x, y); if (idx < 0 || V[idx] > 0.05) continue;
    F[idx] = CI[slopeChar(dxdy * CH / CW)]; V[idx] = 0.75; T[idx] = STEM;
  }
  // seeds: golden angle + square-root radius
  var shown = Math.floor(NS * Math.pow(ss(0.2, 6.2, t), 0.85));
  for (var s = 0; s < shown; s++) {
    var th = SEED_T[s] + rot, rs = SEED_R[s];
    var k = cellAt(cx + rs * Math.cos(th), cy + rs * Math.sin(th)); if (k < 0) continue;
    var lit = ARM_RANK[s % 21] % 2 === 0;
    var val = (lit ? 0.95 : 0.42) * (0.75 + 0.25 * (1 - rs / RH));
    if (val > V[k] || T[k] === SEED_DARK && !lit && val > V[k]) { V[k] = val; T[k] = lit ? SEED_LIT : SEED_DARK; }
  }
  var typed = SUN_TEXT.slice(0, Math.floor(ss(0.8, 3.6, t) * SUN_TEXT.length));
  putText(typed, ROWS - 5, 0.9, TEXT);
  if (t > 0.8) putText('seeds ' + shown + ' / ' + NS, ROWS - 3, 0.6, TEXT);
}

// ---------- 2. roses rising ----------
var ROSES = [
  { x: -0.52, top: -0.16, st: 0.6, ph: 0.4, s: 0.85, side: 1 },
  { x: -0.27, top: -0.46, st: 0.0, ph: 1.9, s: 1.0, side: -1 },
  { x: 0.02, top: -0.64, st: 0.35, ph: 3.1, s: 1.12, side: 1 },
  { x: 0.29, top: -0.38, st: 0.9, ph: 4.4, s: 0.95, side: -1 },
  { x: 0.54, top: -0.08, st: 0.25, ph: 5.6, s: 0.82, side: 1 }
];
var SEG5 = TAU / 5;
function stemX(rz, y) { return rz.x + 0.05 * Math.sin((1 - y) * 2.6 + rz.ph); }
function stemD(rz, y) { return -0.13 * Math.cos((1 - y) * 2.6 + rz.ph); }

function sceneRoses(t) {
  var live = [];
  for (var q = 0; q < 5; q++) {
    var rz = ROSES[q], g = ss(rz.st, rz.st + 2.8, t);
    var topNow = 1.04 + (rz.top - 1.04) * g;
    var o = ss(rz.st + 2.3, rz.st + 5.3, t);
    var Rb = 0.16 * rz.s * (0.3 + 0.7 * o);
    var ly = 1.04 - (1.04 - rz.top) * 0.42;
    live.push({ rz: rz, g: g, top: topNow, o: o, Rb: Rb, bx: stemX(rz, topNow), bud: g > 0.6, ly: ly, lx: stemX(rz, ly), lg: ss(rz.st + 1.2, rz.st + 2.6, t) });
  }
  for (var i = 0; i < N; i++) {
    var X = XS[i], Y = YS[i];
    for (var p = 0; p < 5; p++) {
      var L = live[p];
      // leaf
      if (L.lg > 0) {
        var ox = X - (L.lx + L.rz.side * 0.07), oy = Y - (L.ly - 0.02), an = -0.6 * L.rz.side;
        var ca = Math.cos(an), sa = Math.sin(an);
        var qx = (ox * ca - oy * sa) / (0.085 * L.lg), qy = (ox * sa + oy * ca) / (0.028 * L.lg);
        if (qx * qx + qy * qy < 1) { V[i] = 0.28 + 0.3 * (1 - Math.abs(qy)); T[i] = LEAF; }
      }
      if (!L.bud) continue;
      var dx = X - L.bx, dy = (Y - L.top) / 0.88;
      if (dx > L.Rb || dx < -L.Rb || dy > L.Rb || dy < -L.Rb) continue;
      var rr = Math.sqrt(dx * dx + dy * dy); if (rr > L.Rb) continue;
      var a = Math.atan2(dy, dx), val = -1, tone = ROSE;
      for (var l = 0; l < 5; l++) {
        var rl = L.Rb * (1 - l * 0.17); if (rr >= rl) continue;
        var off = l * 0.63 + L.rz.ph + t * 0.04 * (l % 2 ? 1 : -1);
        var rel = a - off, d = rel - Math.round(rel / SEG5) * SEG5;
        var rho = rl * (0.8 + 0.2 * Math.cos(d * 5));
        if (rr < rho) {
          var cup = rr / rho, crease = 0.5 + 0.5 * Math.cos(d * 2.5);
          var sh = (0.06 + 0.94 * Math.pow(cup, 1.6)) * Math.pow(crease, 1.5);
          val = 0.06 + 0.92 * sh; tone = sh > 0.5 ? ROSE : ROSE_DEEP;
        }
      }
      if (rr < L.Rb * 0.2) { val = 0.2 + 0.55 * fract(a / TAU + rr / L.Rb * 6 - t * 0.12); tone = ROSE_CENTER; }
      if (val >= 0) { V[i] = val; T[i] = tone; }
    }
  }
  // stems: | / \ chosen by slope, so they look hand-typed
  for (var s = 0; s < 5; s++) {
    var Ls = live[s];
    for (var r = 0; r < ROWS; r++) {
      var y = YS[r * COLS];
      if (y < Ls.top + (Ls.bud ? Ls.Rb * 0.55 : 0) || y > 1.04) continue;
      var idx = cellAt(stemX(Ls.rz, y), y); if (idx < 0) continue;
      F[idx] = CI[slopeChar(stemD(Ls.rz, y) * CH / CW)]; V[idx] = 0.72; T[idx] = STEM;
    }
  }
  // loose petals drifting upward
  var pf = ss(1.5, 3.5, t);
  if (pf > 0) {
    var glyphs = "~*'`";
    for (var k = 0; k < 28; k++) {
      var h1 = hash(k + 1), h2 = hash(k + 41), h3 = hash(k + 83);
      var px = h1 * 1.5 - 0.75 + 0.05 * Math.sin(t * 1.2 + k);
      var py = 1.1 - fract(h2 + t * 0.05 * (0.6 + h3)) * 2.3;
      var pi = cellAt(px, py); if (pi < 0 || V[pi] > 0.1) continue;
      F[pi] = CI[glyphs[k % 4]]; V[pi] = 0.55 * pf; T[pi] = k % 3 ? ROSE : ROSE_CENTER;
    }
  }
}

// ---------- 3. eye that zooms into a heart ----------
var EW = 0.66, EHU = 0.36, EHL = 0.24;
var LASH_U = [], LASH_L = [];
for (var lk = 0; lk < 24; lk++) { LASH_U.push(-0.92 + 1.84 * (lk + 0.5) / 24 + (hash(lk + 7) - 0.5) * 0.03); LASH_L.push(3 + Math.floor(hash(lk + 19) * 4)); }
var sv = 0, stone = HEART;

function space(sx, sy, t, cs, pulse) {
  sv = 0; stone = HEART;
  var hs = 1 + 0.07 * pulse;
  var hx = sx * 2.0 / hs, hy = (-sy * 2.0 + 0.2) / hs;
  var q = hx * hx + hy * hy - 1, f = q * q * q - hx * hx * hy * hy * hy;
  if (f < 0) {
    var depth = Math.sqrt(Math.min(1, -f * 2.5));
    var hl = Math.exp(-((hx + 0.5) * (hx + 0.5) + (hy - 0.62) * (hy - 0.62)) / 0.05);
    sv = 0.2 + 0.62 * depth + 0.45 * hl; stone = hl > 0.45 ? ROSE_CENTER : HEART; return;
  }
  if (f < 0.5) { var gl = 1 - f / 0.5; sv = gl * gl * 0.3 * (0.55 + 0.45 * pulse); stone = HEART; }
  // stars anchored in space coords
  var G = 7, gx = Math.floor(sx * G), gy = Math.floor(sy * G);
  var hh = hash(gx * 57.3 + gy * 131.1);
  if (hh > 0.72) {
    var spx = (gx + hash(gx * 3.1 + gy * 7.7)) / G, spy = (gy + hash(gx * 9.3 + gy * 2.9)) / G;
    if (Math.abs(sx - spx) < cs * 0.5 && Math.abs(sy - spy) < cs * (CH / CW) * 0.5) {
      var tw = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3 + hh * 40));
      if (tw > sv) { sv = tw; stone = STAR; }
    }
  }
}

function sceneEye(t) {
  var lock = ss(2.0, 2.6, t);
  var gx = (1 - lock) * 0.07 * Math.sin(t * 1.6), gy = (1 - lock) * 0.035 * Math.sin(t * 2.2 + 1);
  var b = 1 - 0.97 * Math.exp(-Math.pow((t - 1.25) / 0.09, 2));
  var zp = ss(2.6, 7.2, t);
  var zoom = 1.05 * Math.exp(Math.pow(zp, 1.15) * Math.log(9 / 1.05));
  var Rp = 0.075 + 0.075 * ss(2.6, 6.4, t), Ri = 0.24;
  var m = ss(5.0, 6.9, t);
  var ph = fract(t * 66 / 60);
  var pulse = Math.exp(-Math.pow((ph - 0.05) / 0.045, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.24) / 0.05, 2));
  var k = 1.25 / (zoom * Rp), cs = k * CW / U;
  for (var i = 0; i < N; i++) {
    var X = gx + XS[i] / zoom, Y = gy + YS[i] / zoom, xn = X / EW, ax = Math.abs(xn);
    var q = ax < 1 ? Math.pow(1 - xn * xn, 0.85) : 0;
    var yl = EHL * q, yuOpen = -EHU * q, yu = yl + (yuOpen - yl) * b;
    var v = 0, tone = SKIN;
    if (ax < 1 && Y > yu && Y < yl) {
      var ix = X - gx, iy = Y - gy, dI = Math.sqrt(ix * ix + iy * iy);
      if (dI < Rp) {
        v = 0.015; tone = WHITE;
        if (m > 0) { space(ix / Rp * 1.25, iy / Rp * 1.25, t, cs, pulse); v += sv * m; tone = stone; }
      } else if (dI < Ri) {
        var rn = (dI - Rp) / (Ri - Rp), an = Math.atan2(iy, ix);
        var f1 = 0.5 + 0.5 * Math.sin(an * 41 + 3 * Math.sin(an * 7) + rn * 2);
        var f2 = 0.5 + 0.5 * Math.sin(an * 23 + 1.7 + 5 * rn);
        var jag = 0.5 + 0.06 * Math.sin(an * 17), ring = Math.exp(-Math.pow((rn - jag) / 0.08, 2));
        var pit = Math.pow(0.5 + 0.5 * Math.sin(an * 11 + rn * 9), 14);
        v = (0.32 + 0.38 * (0.6 * f1 + 0.4 * f2) + 0.35 * ring) * (1 - 0.85 * ss(0.84, 1, rn)) * (0.45 + 0.55 * ss(0, 0.14, rn)) * (1 - 0.5 * pit);
        tone = rn < 0.45 ? IRIS_GOLD : IRIS_BROWN;
      } else {
        var sp = Math.sqrt(Math.max(0, 1 - xn * xn * 0.85 - (Y / 0.5) * (Y / 0.5)));
        v = 0.3 + 0.45 * sp; tone = ax > 0.62 ? EYE_PINK : WHITE;
        var vein = Math.pow(1 - Math.abs(Math.sin(X * 38 + Math.sin(Y * 27 + X * 9) * 2.2)), 10) * ss(0.35, 0.9, ax);
        v *= 1 - 0.6 * vein;
        var cxn = (xn + 0.9) / 0.09, cyn = (Y - 0.02) / 0.06;
        if (cxn * cxn + cyn * cyn < 1) { v = 0.5; tone = EYE_PINK; }
      }
      v *= 0.3 + 0.7 * ss(0, 0.1, Y - yu); // lid shadow
      // window catchlight on the cornea
      if (X > gx - 0.11 && X < gx - 0.04 && Y > gy - 0.125 && Y < gy - 0.065 && m < 0.9) {
        if (Math.abs(X - (gx - 0.075)) > 0.004 && Math.abs(Y - (gy - 0.095)) > 0.003) { v = 1 - m; tone = WHITE; }
      }
    } else {
      var dist;
      if (ax < 1) dist = Y < yu ? yu - Y : Y - yl; else dist = Math.sqrt((Math.abs(X) - EW) * (Math.abs(X) - EW) + Y * Y);
      v = 0.06 + 0.3 * Math.exp(-dist * 2.4);
      if (ax < 1.08) { var foldY = yuOpen - 0.09 * Math.sqrt(Math.max(0, 1 - xn * xn)); v *= 1 - 0.6 * Math.exp(-Math.pow((Y - foldY) / 0.02, 2)); }
      var browY = -0.58 + 0.1 * xn * xn - 0.04 * xn;
      if (ax < 1.12 && Math.abs(Y - browY) < 0.035 * (1 - 0.45 * ax)) { v = 0.32 + 0.25 * hash(Math.floor(X * 90) + Math.floor(Y * 60) * 13); }
      tone = SKIN;
    }
    V[i] = v; T[i] = tone;
  }
  // lashes: strands bent outward and curled
  if (zoom < 3 && m < 0.5) {
    for (var s = 0; s < 24; s++) {
      var u = LASH_U[s], qq = Math.pow(1 - u * u, 0.85);
      var px = u * EW, py = EHL * qq + (-EHU * qq - EHL * qq) * b, ang = u * 1.15, sg = u < 0 ? -1 : 1;
      for (var j = 0; j < LASH_L[s]; j++) {
        ang += 0.12 * sg; px += Math.sin(ang) * 0.022; py -= Math.cos(ang) * 0.022;
        var idx = cellAt((px - gx) * zoom, (py - gy) * zoom); if (idx < 0) continue;
        var slope = (Math.sin(ang) / Math.max(0.05, Math.cos(ang))) * CH / CW;
        F[idx] = CI[Math.abs(slope) < 0.35 ? '|' : (slope > 0 ? '/' : '\\')]; V[idx] = 0.6 * (1 - 0.3 * j / LASH_L[s]); T[idx] = LASH;
      }
    }
  }
}

// ---------- 4. guitar + floating notes ----------
var GA = 0.55, GDX = -Math.sin(GA), GDY = -Math.cos(GA), GPX = Math.cos(GA), GPY = -Math.sin(GA);
var GO = { x: 0.22 + 0.32 * GDX, y: 0.52 + 0.32 * GDY };            // upper-bout centre; u runs up the neck
var SH = { x: GO.x - 0.07 * GDX, y: GO.y - 0.07 * GDY };            // soundhole
var NOTE_SPRITES = [
  ["  |\\", "  | \\", "  |", "@@|"],
  ["  |", "  |", "  |", "@@|"],
  ["  |===|", "  |   |", "  |   |", "@@| @@|"],
  ["  |\\", "  |\\\\", "  | \\", "@@|"]
];
var SMALL_NOTE = [" |\\", " |", "@|"];
var GPAT = [0, 2, 3, 4, 5, 4, 3, 2];
var PLUCKS = [];
for (var pk = 0, tq = 1.6; tq < 10.6; pk++, tq += 0.45) PLUCKS.push({ tp: tq, str: GPAT[pk % 8], sp: pk % 4, lane: Math.floor(hash(pk + 3) * 5), h: hash(pk + 17) });
function ribbonY(x, t) { return SH.y - 0.26 - (x - SH.x) * 1.05 + 0.06 * Math.sin(x * 7 - t * 1.8); }
function drawSprite(sp, x, y, lum, tone) {
  if (lum < 0.03) return;
  var c0 = Math.floor((x * U + W / 2) / CW), r0 = Math.floor((y * U + H / 2) / CH) - (sp.length - 1);
  for (var r = 0; r < sp.length; r++) for (var c = 0; c < sp[r].length; c++) {
    var ch = sp[r][c]; if (ch === ' ') continue;
    var cc = c0 + c, rr = r0 + r; if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS) continue;
    var idx = rr * COLS + cc; F[idx] = CI[ch]; V[idx] = lum; T[idx] = tone;
  }
}

function sceneGuitar(t) {
  var reveal = -0.68 + 1.7 * ss(0, 1.6, t);
  var exc = [0, 0, 0, 0, 0, 0];
  for (var p = 0; p < PLUCKS.length; p++) { var pl = PLUCKS[p]; if (t >= pl.tp) { var e = Math.exp(-(t - pl.tp) * 2.5); if (e > exc[pl.str]) exc[pl.str] = e; } }
  var glow = Math.max(exc[0], exc[1], exc[2], exc[3], exc[4], exc[5]);
  for (var i = 0; i < N; i++) {
    var px = XS[i] - GO.x, py = YS[i] - GO.y, u = px * GDX + py * GDY, w = px * GPX + py * GPY;
    if (u > reveal) continue;
    if (u < 0.2) {
      // body: two bouts joined with a smooth union
      var a1 = u + 0.32, d1 = Math.sqrt(a1 * a1 + w * w) - 0.27, d2 = Math.sqrt(u * u + w * w) - 0.2;
      var hh = Math.min(1, Math.max(0, 0.5 + 0.5 * (d2 - d1) / 0.1)), d = d2 + (d1 - d2) * hh - 0.1 * hh * (1 - hh);
      if (d < 0) {
        var sh = Math.sqrt((u + 0.07) * (u + 0.07) + w * w);
        if (sh < 0.07) { V[i] = 0.03; T[i] = SEED_DARK; continue; }
        if (sh < 0.098) { V[i] = (sh < 0.078 || sh > 0.09) ? 0.75 : 0.45 + 0.3 * (0.5 + 0.5 * Math.sin(Math.atan2(w, u + 0.07) * 24)); T[i] = PETAL; continue; }
        if (d > -0.018) { V[i] = 0.72; T[i] = WHITE; continue; }
        if (Math.abs(u + 0.4) < 0.024 && Math.abs(w) < 0.1) { var sad = Math.abs(u + 0.39) < 0.01; V[i] = sad ? 0.8 : 0.12; T[i] = sad ? WHITE : SEED_DARK; continue; }
        var rad = Math.min(1, -d / 0.22), grain = 0.5 + 0.5 * Math.sin(w * 90 + 1.5 * Math.sin(u * 9));
        V[i] = 0.2 + 0.3 * rad + 0.12 * grain + 0.1 * glow * rad; T[i] = WOOD; continue;
      }
    }
    if (u >= 0.18 && u < 0.8) { var hw = 0.052 - 0.012 * (u - 0.18) / 0.62; if (Math.abs(w) < hw) { V[i] = 0.1; T[i] = SEED_DARK; continue; } }
    else if (u >= 0.8 && u < 0.97) {
      var hw2 = 0.05 + 0.02 * (u - 0.8) / 0.17;
      if (Math.abs(w) < hw2) { var nut = u < 0.815; V[i] = nut ? 0.8 : 0.3; T[i] = nut ? WHITE : WOOD; continue; }
      for (var g = 0; g < 3; g++) { var pu = 0.845 + g * 0.05, aw = Math.abs(w) - 0.085; if ((u - pu) * (u - pu) + aw * aw < 0.00035) { V[i] = 0.8; T[i] = STRING; } }
    }
  }
  // six strings, bridge to nut; a plucked string shivers and brightens
  for (var k = 0; k < 6; k++) {
    var wb = -0.06 + 0.024 * k, wn = -0.04 + 0.016 * k, A = exc[k];
    for (var s = 0; s <= 1; s += 0.004) {
      var uu = -0.39 + 1.19 * s; if (uu > reveal) break;
      var ww = wb + (wn - wb) * s + A * 0.016 * Math.sin(Math.PI * s) * Math.sin(t * 60 + k * 1.7);
      var si = cellAt(GO.x + uu * GDX + ww * GPX, GO.y + uu * GDY + ww * GPY); if (si < 0) continue;
      F[si] = CI['\\']; V[si] = 0.45 + 0.5 * A; T[si] = STRING;
    }
  }
  // frets at L·(1 − 2^(−n/12))
  for (var n = 1; n <= 12; n++) {
    var uf = 0.8 - 1.19 * (1 - Math.pow(2, -n / 12)); if (uf > reveal) continue;
    var hwf = 0.052 - 0.012 * (uf - 0.18) / 0.62;
    for (var q = -hwf; q <= hwf; q += 0.006) { var fi = cellAt(GO.x + uf * GDX + q * GPX, GO.y + uf * GDY + q * GPY); if (fi < 0) continue; F[fi] = CI['=']; V[fi] = 0.5; T[fi] = WHITE; }
  }
  // a five-line staff ribbon unfurling from the soundhole
  var rg = ss(1.2, 3.4, t), x0 = 0.16, x1 = x0 + (0.84 - x0) * rg;
  for (var x = x0; x < x1; x += 0.006) {
    var yc = ribbonY(x, t), dydx = -1.05 + 0.42 * Math.cos(x * 7 - t * 1.8), sl = dydx * CW / CH;
    var chr = Math.abs(sl) < 0.3 ? '-' : (Math.abs(sl) > 2.2 ? '|' : (sl < 0 ? '/' : '\\'));
    var edge = ss(x0, x0 + 0.12, x) * (1 - ss(0.7, 0.84, x));
    for (var k2 = 0; k2 < 5; k2++) { var ri = cellAt(x, yc + (k2 - 2) * 0.045); if (ri < 0 || F[ri] >= 0 || V[ri] > 0.05) continue; F[ri] = CI[chr]; V[ri] = 0.32 * edge; T[ri] = TEXT; }
  }
  // every pluck releases a note that rides the staff, plus a few that drift free
  for (var p2 = 0; p2 < PLUCKS.length; p2++) {
    var pl2 = PLUCKS[p2], age = t - pl2.tp; if (age < 0 || age > 4.6) continue;
    var pr = age / 4.6, ep = 1 - Math.pow(1 - pr, 1.6);
    var nx = x0 + 0.02 + ep * 0.62;
    var ny = ribbonY(nx, t) + (pl2.lane - 2) * 0.045 - ep * 0.06 + 0.02 * Math.sin(age * 3 + pl2.h * 6);
    drawSprite(NOTE_SPRITES[pl2.sp], nx, ny, 0.95 * ss(0, 0.06, pr) * (1 - ss(0.75, 1, pr)), pl2.sp % 2 ? NOTE : SEED_LIT);
    if (pl2.h > 0.45) {
      var fx = SH.x + 0.08 + pl2.h * 0.5 + 0.05 * Math.sin(age * 2 + p2), fy = SH.y - 0.32 - age * 0.28;
      drawSprite(SMALL_NOTE, fx, fy, 0.6 * ss(0, 0.1, pr) * (1 - ss(0.6, 0.9, pr)), NOTE);
    }
  }
}

var SCENES = [
  { key: 'sunflower', fn: sceneSunflower, dur: 12, still: 9.5, label: 'Sunflower', title: 'Golden-angle sunflower', formula: 'θ = n · 137.508°,  r = c·√n', aria: 'A sunflower drawn in ASCII characters, its seeds spiralling out at the golden angle' },
  { key: 'roses', fn: sceneRoses, dur: 11, still: 8.5, label: 'Roses', title: 'Roses rising', formula: 'sh = (0.06 + 0.94·cup^1.6) · crease^1.5', aria: 'Five pink ASCII roses growing on typed stems' },
  { key: 'eye', fn: sceneEye, dur: 13, still: 10.2, label: 'Eye → Heart', title: 'An eye that zooms into a heart', formula: '(x² + y² − 1)³ − x²y³ < 0', aria: 'An ASCII eye that zooms through its pupil into a beating heart among stars' },
  { key: 'guitar', fn: sceneGuitar, dur: 13, still: 6.2, label: 'Guitar', title: 'Guitar & floating notes', formula: 'fretₙ = L · (1 − 2^(−n/12))', aria: 'An acoustic guitar drawn in ASCII, its strings shivering as music notes float away along a wavy staff' }
];

// ---------- player ----------
(function () {
  var cv = document.getElementById('reel');
  var titleEl = document.getElementById('reel-title');
  var formulaEl = document.getElementById('reel-formula');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
  var params = new URLSearchParams(location.search);
  var autoplay = params.get('autoplay') !== '0';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var si = 0, t = 0, last = 0, ctx, atlas, small, sctx, vig, raf;
  var start = params.get('scene');
  for (var s = 0; s < SCENES.length; s++) if (SCENES[s].key === start) si = s;

  function syncUI() {
    var sc = SCENES[si];
    titleEl.textContent = sc.title;
    formulaEl.textContent = sc.formula;
    cv.setAttribute('aria-label', sc.aria);
    buttons.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === si)); });
  }

  function setup() {
    cv.width = W * DPR; cv.height = H * DPR;
    ctx = cv.getContext('2d');
    atlas = document.createElement('canvas');
    atlas.width = CHARS.length * CW * DPR; atlas.height = TONES.length * CH * DPR;
    var ac = atlas.getContext('2d');
    ac.font = (12 * DPR) + 'px "JetBrains Mono", ui-monospace, monospace';
    ac.textAlign = 'center'; ac.textBaseline = 'middle';
    for (var tt = 0; tt < TONES.length; tt++) {
      ac.fillStyle = TONES[tt];
      for (var c = 0; c < CHARS.length; c++) ac.fillText(CHARS[c], (c + 0.5) * CW * DPR, (tt + 0.5) * CH * DPR + DPR);
    }
    small = document.createElement('canvas'); small.width = COLS * 2; small.height = ROWS * 2;
    sctx = small.getContext('2d');
    vig = document.createElement('canvas'); vig.width = W * DPR; vig.height = H * DPR;
    var vc = vig.getContext('2d');
    var g = vc.createRadialGradient(W * DPR / 2, H * DPR / 2, H * DPR * 0.28, W * DPR / 2, H * DPR / 2, H * DPR * 0.68);
    g.addColorStop(0, 'rgba(15,26,19,0)'); g.addColorStop(1, 'rgba(15,26,19,0.75)');
    vc.fillStyle = g; vc.fillRect(0, 0, vig.width, vig.height);

    if (reduce) { still(); return; }
    raf = requestAnimationFrame(loop);
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    var dt = last ? (now - last) / 1000 : 0;
    if (last && dt < 1 / 31) return;
    last = now;
    step(Math.min(dt, 0.1));
  }

  function step(dt) {
    var sc = SCENES[si];
    t += dt;
    if (t > sc.dur) {
      t = 0;
      if (autoplay) { si = (si + 1) % SCENES.length; sc = SCENES[si]; syncUI(); }
    }
    frame(sc, t);
  }

  function still() { var sc = SCENES[si]; t = sc.still; frame(sc, t); }

  function frame(sc, tm) {
    V.fill(0); T.fill(0); F.fill(-1);
    sc.fn(tm);
    var fade = reduce ? 1 : ss(0, 0.7, tm) * (1 - ss(sc.dur - 0.7, sc.dur, tm));
    if (fade < 1) for (var z = 0; z < N; z++) V[z] *= fade;
    draw();
  }

  function draw() {
    var R = RAMP.length, cw = CW * DPR, ch = CH * DPR;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W * DPR, H * DPR);
    for (var i = 0; i < N; i++) {
      var f = F[i], v = V[i], ci, a;
      if (f >= 0) { a = v * VIG[i]; if (a < 0.03) continue; ci = f; }
      else {
        if (v <= 0.004) continue;
        var l = (1 - Math.exp(-2 * Math.pow(v, 1.2))) / 0.8647;           // soft tone curve
        l += (Math.random() + Math.random() + Math.random() - 1.5) * 0.07;  // shimmer
        l *= VIG[i];
        if (l <= 0.02) continue; if (l > 1) l = 1;
        ci = Math.round(l * (R - 1)); if (ci === 0) continue; a = l;
      }
      ctx.globalAlpha = 0.35 + 0.65 * (a > 1 ? 1 : a);
      ctx.drawImage(atlas, ci * cw, T[i] * ch, cw, ch, (i % COLS) * cw, ((i / COLS) | 0) * ch, cw, ch);
    }
    // bloom: blurred downscaled copy added back
    ctx.globalAlpha = 1;
    sctx.clearRect(0, 0, small.width, small.height);
    sctx.drawImage(cv, 0, 0, small.width, small.height);
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3;
    ctx.drawImage(small, 0, 0, W * DPR, H * DPR);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(vig, 0, 0);
  }

  buttons.forEach(function (b, k) {
    b.addEventListener('click', function () {
      si = k; t = 0; syncUI();
      if (reduce && ctx) still();
    });
  });

  syncUI();
  var go = function () { setup(); };
  if (document.fonts && document.fonts.load) document.fonts.load('24px "JetBrains Mono"').then(go, go); else go();
})();
