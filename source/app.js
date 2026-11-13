(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const root = document.documentElement;
// A frame sized to the whole document cannot scroll, so pinned scenes fall back to a static layout there.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || innerHeight > 4200;
if (reduced) root.classList.add('reduced');

/* ------------------------------------------------------------------
   Chart data, transcribed from the report's figures.
   Series order is fixed: Caribbean, Pacific, AIS.
------------------------------------------------------------------ */
const REG = [['Caribbean', '#1E9E92'], ['Pacific', '#E2A100'], ['AIS', '#B02261']];
const RAMP = ['#253A74', '#3A4AA6', '#4565AE', '#6789C4', '#646E84', '#AD7B48', '#F08C2F', '#D96220', '#D4482A', '#A6331F'];
// Figure 1: each run is [rank, start, width] on a 1188-unit track; the boundary between fifth and sixth choice sits at 626.
const FIG1L = ['Climate action / Biodiversity conservation / Nature-based solutions', 'Blue economy', 'Access to energy / Renewable energy transition', 'Digital transformation / Analytics', 'Economic recovery and diversification', 'Technology transfer', 'Social protection and inclusion', 'Finance for development / Private sector development', 'Gender equality / Youth empowerment', 'Parliamentary development / Public sector reform'];
const FIG1 = [[[1,12,198],[2,213,243],[3,458,84],[4,544,69],[5,615,10],[7,627,13]],[[1,104,278],[2,384,89],[3,476,74],[4,552,30],[5,585,40],[6,627,29],[9,658,26],[10,686,45]],[[1,116,75],[2,194,117],[3,314,165],[4,481,72],[5,555,70],[6,627,27],[7,656,27],[9,686,43]],[[2,154,43],[3,199,135],[4,337,87],[5,426,199],[7,627,72],[8,701,29],[9,732,44]],[[1,394,41],[2,438,56],[3,496,27],[4,525,56],[5,583,42],[6,627,279],[7,908,73],[8,983,11],[9,996,11]],[[1,400,11],[4,413,122],[5,537,88],[6,627,122],[7,751,45],[8,798,89],[9,889,61],[10,952,75]],[[1,449,11],[2,463,27],[3,493,57],[4,552,58],[5,612,13],[6,627,59],[7,688,215],[8,905,107],[9,1014,60]],[[1,462,11],[2,475,14],[3,492,10],[4,504,61],[5,567,58],[6,627,45],[7,674,57],[8,733,278],[9,1013,29],[10,1044,44]],[[3,507,11],[4,521,44],[5,567,58],[6,627,61],[7,690,75],[8,767,77],[9,846,280],[10,1128,13]],[[2,569,11],[3,582,29],[5,614,11],[7,627,29],[8,658,30],[9,690,60],[10,753,429]]];
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'last'];
function buildFig1(el) {
  el.classList.add('div');
  let h = '<div class="ramp" aria-hidden="true">First choice <span>' + RAMP.map(c => `<i style="background:${c}"></i>`).join('') + '</span> Last choice</div>';
  FIG1.forEach((runs, i) => {
    const tot = runs.reduce((a, r) => a + r[2], 0), top3 = Math.round(runs.filter(r => r[0] <= 3).reduce((a, r) => a + r[2], 0) / tot * 100);
    const desc = `${FIG1L[i]}: ranked in the top three by about ${top3} percent of responses`;
    h += `<div class="ch-row" tabindex="0" role="img" aria-label="${desc}" data-tip="${desc}" style="--i:${i}"><div class="ch-label">${FIG1L[i]}</div><div class="d-track"><i class="d-mid"></i><div class="d-bars">` +
      runs.map(([k, st, w]) => `<span class="seg" style="left:${(st / 1188 * 100).toFixed(2)}%;width:${(w / 1188 * 100).toFixed(2)}%;background:${RAMP[k - 1]}" data-tip="${FIG1L[i]}, ranked ${ORD[k - 1]} choice: about ${Math.round(w / tot * 100)} percent"></span>`).join('') + '</div></div></div>';
  });
  el.innerHTML = h;
}
const CHARTS = {
  fig2: { step: 10, rows: [
    ['Marine protected areas expansion and management', 6, 11, 5], ['Climate change adaptation', 10, 5, 6],
    ['Sustainable fisheries', 4, 11, 5], ['Climate change mitigation', 10, 5, 2], ['Sustainable tourism', 6, 4, 3],
    ['Marine pollution', 4, 2, 5], ['Access to finance / heavy debt burdens', 5, 1, 3], ['Ocean governance', 3, 3, 1],
    ['New ocean economic sectors', 2, 1, 1], ['Other', 1, 0, 2], ['Dependency on (imported) fossil fuels', 0, 0, 1]] },
  fig4: { step: 10, rows: [
    ['Vertical funds', 18, 16, 7], ['Debt management and fiscal space', 14, 7, 6], ['Domestic resource mobilisation', 11, 6, 6],
    ['Trust funds', 9, 6, 4], ['Mobilizing private finance', 10, 2, 5], ['Development finance assessments', 6, 6, 5],
    ['Remittances and digital remittance service', 4, 6, 3], ['Blended finance', 5, 4, 3], ['Microfinance', 6, 2, 3],
    ['Risk insurance', 4, 2, 0], ['Impact investment', 3, 1, 1], ['Blue bonds', 2, 2, 1], ['Carbon bonds/credits', 1, 0, 1],
    ['Islamic finance instruments (Sukuk)', 0, 0, 1], ['Green bonds', 1, 0, 0]] },
  fig5: { step: 10, rows: [
    ['Technical support', 17, 16, 6], ['Resource mobilization', 18, 10, 7], ['Technical assistance', 9, 13, 4],
    ['Global Policy Network support', 7, 13, 4], ['Global innovation approaches', 8, 11, 4], ['Policy advisory support', 7, 10, 6],
    ['Expert roster', 11, 6, 4], ['Network creation between country offices', 5, 6, 6], ['UNDP SIDS Bulletin', 1, 11, 2],
    ['Knowledge management', 2, 5, 2]] },
  fig8: { step: 10, rows: [
    ['Climate action', 10, 11, 6], ['Blue economy', 8, 12, 7], ['Biodiversity conservation', 8, 10, 3],
    ['Digital transformation', 11, 4, 5], ['Disaster risk reduction', 7, 8, 5], ['Economic recovery and diversification', 8, 6, 5],
    ['Financing for development', 7, 7, 5], ['Renewable energy transition', 6, 7, 5], ['Nature-based solutions', 6, 9, 2],
    ['Youth empowerment', 5, 5, 6], ['Social protection and inclusion', 7, 7, 1], ['Access to energy', 7, 3, 4],
    ['Gender equality', 4, 4, 3], ['Private sector development', 3, 1, 5], ['Public sector reform', 3, 4, 2],
    ['Parliamentary development', 3, 3, 1], ['Data analytics', 4, 1, 2], ['Technology transfer', 0, 2, 3],
    ['Human mobility', 2, 2, 0], ['Urban farming', 2, 0, 1]] },
  fig7: { step: 10, single: 'Number of SIDS', color: '#1F2A5C', rows: [
    ['Document and public records', 36], ['Administrative data', 35], ['Surveys', 31], ['Citizen-reported', 7], ['Other', 5]] }
};

function buildCharts() {
  $$('.chart').forEach(el => {
    if (el.dataset.chart === 'fig1') return buildFig1(el);
    const c = CHARTS[el.dataset.chart];
    if (!c) return;
    const totals = c.rows.map(r => r.slice(1).reduce((a, b) => a + b, 0));
    const axisMax = Math.ceil(Math.max(...totals) / 5) * 5;
    let h = '';
    if (!c.single) h += '<ul class="ch-legend">' + REG.map(r => `<li><i style="background:${r[1]}"></i>${r[0]}</li>`).join('') + '</ul>';
    c.rows.forEach((r, i) => {
      const vals = r.slice(1), t = totals[i];
      const desc = c.single ? `${r[0]}: ${t}` : `${r[0]}: ` + vals.map((v, k) => `${REG[k][0]} ${v}`).join(', ') + `, total ${t}`;
      h += `<div class="ch-row" tabindex="0" role="img" aria-label="${desc}" data-tip="${desc}" style="--i:${i}"><div class="ch-label">${r[0]}</div>` +
        `<div class="ch-bar"><div class="ch-track" style="--t:${t};--max:${axisMax}">` +
        vals.map((v, k) => v ? `<div class="seg s${k}" style="--n:${v};background:${c.single ? c.color : REG[k][1]}" data-tip="${r[0]}, ${c.single ? c.single : REG[k][0]}: ${v}"><span>${c.single ? '' : v}</span></div>` : '').join('') +
        `</div><span class="ch-total">${t}</span></div></div>`;
    });
    h += '<div class="ch-axis">';
    for (let v = 0; v <= axisMax; v += c.step) h += `<span style="left:${v / axisMax * 100}%">${v}</span>`;
    h += '</div>';
    h += '<details class="ch-table"><summary>View as table</summary><table><thead><tr><th></th>' +
      (c.single ? `<th>${c.single}</th>` : REG.map(r => `<th>${r[0]}</th>`).join('') + '<th>Total</th>') + '</tr></thead><tbody>' +
      c.rows.map((r, i) => `<tr><td>${r[0]}</td>` + r.slice(1).map(v => `<td>${v}</td>`).join('') + (c.single ? '' : `<td>${totals[i]}</td>`) + '</tr>').join('') +
      '</tbody></table></details>';
    el.innerHTML = h;
  });
  fitChartLabels();
}
function fitChartLabels() {
  $$('.ch-track .seg').forEach(s => s.classList.toggle('hide-n', s.offsetWidth < 17));
}
const tip = $('#tip');
function showTip(text, x, y) {
  tip.textContent = text; tip.classList.add('show');
  const w = tip.offsetWidth, hh = tip.offsetHeight;
  tip.style.transform = `translate(${clamp(x - w / 2, 8, innerWidth - w - 8)}px,${Math.max(8, y - hh - 14)}px)`;
}
document.addEventListener('pointermove', e => {
  const t = e.target.closest && e.target.closest('.seg,[data-tip]');
  if (t && t.closest('.chart')) showTip(t.dataset.tip, e.clientX, e.clientY); else tip.classList.remove('show');
});
document.addEventListener('focusin', e => {
  const t = e.target.closest && e.target.closest('.ch-row');
  if (t) { const r = t.getBoundingClientRect(); showTip(t.dataset.tip, r.left + r.width * .6, r.top); }
});
document.addEventListener('focusout', () => tip.classList.remove('show'));

/* ------------------------------------------------------------------
   The compass: the report's three-pillar graphic rebuilt as live SVG.
   Units: ring outer radius = 100.
------------------------------------------------------------------ */
const ANG = [0, 120, 240];                 // climate, blue, digital (clockwise from top)
const ARM = 181.8, MED = 71, HALF = 53, RIN = 61.2, UNIT = 720 / 520;
const STOPS = [[0, '#3FA535'], [45, '#34743F'], [90, '#469BD5'], [135, '#4F60B6'], [160, '#7A4A9E'], [180, '#A83C7C'],
  [205, '#E2452C'], [225, '#F25C1F'], [270, '#F9BE0D'], [315, '#71B82D'], [360, '#3FA535']];
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function ringColor(a) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a0, c0] = STOPS[i], [a1, c1] = STOPS[i + 1];
    if (a >= a0 && a <= a1) { const t = (a - a0) / (a1 - a0), A = hex(c0), B = hex(c1); return `rgb(${A.map((v, k) => Math.round(lerp(v, B[k], t))).join(',')})`; }
  }
  return STOPS[0][1];
}
const f2 = v => (Math.round(v * 100) / 100);
const pol = (r, deg) => { const t = (deg - 90) * Math.PI / 180; return [(r * Math.cos(t)).toFixed(2), (r * Math.sin(t)).toFixed(2)]; };
function sector(a0, a1) {
  const [x0, y0] = pol(100, a0), [x1, y1] = pol(100, a1), [x2, y2] = pol(RIN, a1), [x3, y3] = pol(RIN, a0);
  return `M${x0} ${y0}A100 100 0 0 1 ${x1} ${y1}L${x2} ${y2}A${RIN} ${RIN} 0 0 0 ${x3} ${y3}Z`;
}
const MEDS = ['climate', 'blue', 'digital'];
const ARMGRAD = [['#27813A', '#2F9042'], ['#6450AE', '#5762BC'], ['#F28C1E', '#F9C20F']];
const cutPath = (cy, r) => `M-80 -280h160v300h-160zM${f2(-r)} ${f2(cy)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0z`;
let RING_URL;
function ringURL() {
  if (RING_URL !== undefined) return RING_URL;
  try {
    const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const x = cv.getContext('2d'), g = x.createConicGradient(-Math.PI / 2, N / 2, N / 2);
    STOPS.forEach(([a, c]) => g.addColorStop(a / 360, c));
    x.fillStyle = g; x.beginPath(); x.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2); x.arc(N / 2, N / 2, N / 2 * RIN / 100, 0, Math.PI * 2, true); x.fill('evenodd');
    RING_URL = cv.toDataURL('image/png');
  } catch (e) { RING_URL = null; }
  return RING_URL;
}
function compassSVG(p) {
  const SEG = 3, url = ringURL();
  let arcs = '', clips = '';
  for (let k = 0; k < 3; k++) {
    arcs += `<g class="arc" data-k="${k}">`;
    if (url) {
      const [x0, y0] = pol(112, k * 120), [x1, y1] = pol(112, k * 120 + 120);
      clips += `<clipPath id="${p}ac${k}"><path d="M0 0L${x0} ${y0}A112 112 0 0 1 ${x1} ${y1}Z"/></clipPath>`;
      arcs += `<image href="${url}" x="-100" y="-100" width="200" height="200" clip-path="url(#${p}ac${k})"/>`;
    } else for (let a = k * 120; a < k * 120 + 120; a += SEG) { const col = ringColor(a + SEG / 2); arcs += `<path class="sg" d="${sector(a, a + SEG)}" fill="${col}" stroke="${col}" stroke-width=".8"/>`; }
    arcs += '</g>';
  }
  const bars = ANG.map((a, i) => `<g class="armb" transform="rotate(${a})"><rect class="bar" x="${-HALF}" width="${HALF * 2}" y="${-ARM}" height="${ARM}" fill="url(#${p}ag${i})" clip-path="url(#${p}bm${i})"/></g>`).join('');
  const meds = ANG.map((a, i) => `<g class="armm" transform="rotate(${a})"><g class="med" transform="translate(0,${-ARM})"><image href="assets/med-${MEDS[i]}.webp" x="${-MED}" y="${-MED}" width="${MED * 2}" height="${MED * 2}" transform="rotate(${-a})"/></g></g>`).join('');
  const ghost = ANG.map(a => `<g transform="rotate(${a})"><rect class="gbar" x="${-HALF}" width="${HALF * 2}" y="${-ARM}" height="${ARM}"/><circle class="gmed" r="${MED}" transform="translate(0,${-ARM})"/></g>`).join('');
  const labels = ['CLIMATE', 'BLUE', 'DIGITAL'].map((t, i) =>
    `<g transform="rotate(${ANG[i]})"><text font-size="12.5" font-weight="500" fill="#fff" letter-spacing="1.6" text-anchor="middle"><textPath href="#${p}lp" startOffset="50%">${t}</textPath></text></g>`).join('');
  return `<svg viewBox="-260 -260 520 520" xmlns="http://www.w3.org/2000/svg"><defs>` +
    ARMGRAD.map((g, i) => `<linearGradient id="${p}ag${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient>`).join('') +
    clips + [0, 1, 2].map(i => `<clipPath id="${p}bm${i}"><path class="bcut" clip-rule="evenodd" d="${cutPath(-ARM, MED - 1.5)}"/></clipPath>`).join('') +
    `<path id="${p}lp" d="M-76.5 0A76.5 76.5 0 0 1 76.5 0"/></defs>` +
    `<g class="crot"><g class="cbars">${bars}</g><circle class="ccore" r="${RIN + .6}" fill="#fff"/><g class="carcs">${arcs}</g>` +
    `<g class="clab" opacity="0">${labels}</g><g class="cmeds">${meds}</g>` +
    `<g class="ctxt"><text class="coreA" text-anchor="middle" y="4.6" font-size="12.5" font-weight="600" fill="#0F1C3F" letter-spacing="1.6">FINANCE</text>` +
    `<text class="coreB" opacity="0" text-anchor="middle" font-size="12.5" font-weight="600" fill="#0F1C3F" letter-spacing="1.2"><tspan x="0" y="-11.5">FINANCE</tspan><tspan x="0" y="4.6">DATA</tspan><tspan x="0" y="20.7">PARTNERSHIP</tspan></text>` +
    `<text class="coreC" opacity="0" text-anchor="middle" font-weight="600" letter-spacing="1.2"><tspan class="cc1" x="0" y="-3" font-size="13.5"></tspan><tspan class="cc2" x="0" y="14" font-size="13.5"></tspan></text></g>` +
    `<g class="cghost" fill="#fff" opacity="0"><circle r="100"/>${ghost}</g></g></svg>`;
}
const CE = $('#compass');
CE.innerHTML = compassSVG('c');
const q = (c) => $(c, CE), qq = (c) => $$(c, CE);
const C = {
  el: CE, rot: q('.crot'), bcuts: qq('.bcut'), armsB: qq('.cbars .armb'), armsM: qq('.cmeds .armm'), bars: qq('.cbars .bar'), meds: qq('.cmeds .med'), imgs: qq('.cmeds image'),
  ring: q('.carcs'), arcs: qq('.carcs .arc'), lab: q('.clab'), txt: q('.ctxt'), coreA: q('.coreA'), coreB: q('.coreB'), coreC: q('.coreC'), cc1: q('.cc1'), cc2: q('.cc2'), core: q('.ccore'),
  ghost: q('.cghost'), gbars: qq('.cghost .gbar'), gmeds: qq('.cghost .gmed'), dock: $('#dock')
};
// the navigation map shows the whole graphic, labels on
(() => { const m = $('#mapCompass'); if (!m) return; m.innerHTML = compassSVG('m'); $('.clab', m).setAttribute('opacity', 1); $('.coreA', m).setAttribute('opacity', 0); $('.coreB', m).setAttribute('opacity', 1); })();
const cache = new Map();
function set(el, attr, v) { let m = cache.get(el); if (!m) cache.set(el, m = {}); if (m[attr] !== v) { m[attr] = v; el.setAttribute(attr, v); } }

let VW = innerWidth, IH = innerHeight, VH = innerHeight, mobile = false;
const probe = document.createElement('div'); probe.id = 'probe'; document.body.appendChild(probe);

let menuOpen = false, lastTf = '', lastOp = -1, moving = false, restT = 0, lastPlate = -1;
const blank = () => ({ x: 0, y: 0, size: 100, rot: 0, e: [1, 1, 1], d: [1, 1, 1], mo: [1, 1, 1], arc: [1, 1, 1], split: 0, white: 0, lab: 0, coreA: 0, coreB: 0, coreC: 0, plate: 0, op: 1, cr: 3000 });
const S = o => Object.assign(blank(), o);
function mix(a, b, t) {
  const o = {};
  for (const k in a) o[k] = Array.isArray(a[k]) ? a[k].map((v, i) => lerp(v, b[k][i], t)) : lerp(a[k], b[k], t);
  return o;
}
function render(s, intro = 1) {
  const sc = s.size / 506;                                   // px per unit
  const tf = `translate3d(${f2(s.x - 360 * sc / UNIT)}px,${f2(s.y - 360 * sc / UNIT)}px,0) scale(${(sc / UNIT).toFixed(4)})`;
  if (tf !== lastTf) {
    lastTf = tf; C.el.style.transform = tf;
    if (!moving) { moving = true; C.el.style.willChange = 'transform'; }
    clearTimeout(restT); restT = setTimeout(() => { moving = false; C.el.style.willChange = 'auto'; }, 260);
  }
  const op = menuOpen ? 0 : f2(s.op);
  if (op !== lastOp) { lastOp = op; C.el.style.opacity = op; }
  set(C.rot, 'transform', `rotate(${f2(s.rot)})`);
  for (let i = 0; i < 3; i++) {
    const e = clamp(s.e[i]) * (intro < 1 ? ease(clamp((intro - .38 - i * .13) / .42)) : 1);
    const D = ARM * e, ms = Math.min(1, e * 2.2);
    for (const gEl of [C.armsB[i], C.armsM[i]]) { set(gEl, 'opacity', f2(s.d[i])); set(gEl, 'display', e < .004 ? 'none' : 'inline'); }
    set(C.bars[i], 'y', f2(-D)); set(C.bars[i], 'height', f2(D));
    set(C.bcuts[i], 'd', cutPath(-D, Math.max(.01, MED * ms - 1.5)));
    set(C.meds[i], 'transform', `translate(0,${f2(-D)}) scale(${f2(ms)})`);
    set(C.meds[i], 'opacity', f2(s.mo[i]));
    set(C.imgs[i], 'transform', `rotate(${f2(-(ANG[i] + s.rot))})`);
    set(C.gbars[i], 'y', f2(-D)); set(C.gbars[i], 'height', f2(D));
    set(C.gmeds[i], 'transform', `translate(0,${f2(-D)}) scale(${f2(ms)})`);
    const mid = (ANG[i] + 60 - 90) * Math.PI / 180, g = s.split * 15;
    set(C.arcs[i], 'transform', `translate(${f2(g * Math.cos(mid))},${f2(g * Math.sin(mid))})`);
    set(C.arcs[i], 'opacity', f2(s.arc[i]));
  }
  if (intro < 1) { const t = ease(clamp(intro / .55)); set(C.ring, 'transform', `rotate(${f2((1 - t) * -150)})`); set(C.ring, 'opacity', f2(clamp(intro / .3))); set(C.core, 'opacity', f2(clamp(intro / .3))); }
  else if (render.introDone !== true) { set(C.ring, 'transform', 'rotate(0)'); set(C.ring, 'opacity', 1); set(C.core, 'opacity', 1); render.introDone = true; }
  set(C.lab, 'opacity', f2(s.lab * (intro < 1 ? clamp((intro - .5) / .3) : 1)));
  set(C.txt, 'transform', `rotate(${f2(-s.rot)})`);
  set(C.coreA, 'opacity', f2(s.coreA * (intro < 1 ? clamp((intro - .8) / .2) : 1)));
  set(C.coreB, 'opacity', f2(s.coreB));
  set(C.coreC, 'opacity', f2(s.coreC));
  set(C.core, 'fill-opacity', f2(1 - clamp(s.split * 1.6)));
  set(C.ghost, 'opacity', f2(s.white));
  const pl = f2(s.plate); if (pl !== lastPlate) { lastPlate = pl; C.dock.style.setProperty('--plate', pl); }
  if (!hinted && s.plate > .97 && scrollY > 200) { hinted = true; const h = $('#dockHint'); h.classList.add('show'); setTimeout(() => h.classList.remove('show'), 5200); }
}
let hinted = reduced;

/* ---- named states ---- */
const MODES = {
  all: { rot: 0, e: [1, 1, 1] },
  climate: { rot: 0, e: [1, 0, 0], zoom: 1 },
  blue: { rot: -120, e: [0, 1, 0], zoom: 1 },
  digital: { rot: 120, e: [0, 0, 1], zoom: 1 },
  cd: { rot: 60, e: [.5, 0, .5], zoom: 2 },
  bd: { rot: 180, e: [0, .5, .5], zoom: 2 },
  bc: { rot: -60, e: [.5, .5, 0], zoom: 2 },
  ring: { rot: 0, e: [0, 0, 0], split: .5, k: 1.95 },
  fin: { rot: 0, e: [0, 0, 0], split: .7, arc: [1, .22, .22], k: 1.95 },
  data: { rot: 0, e: [0, 0, 0], split: .7, arc: [.22, 1, .22], k: 1.95 },
  part: { rot: 0, e: [0, 0, 0], split: .7, arc: [.22, .22, 1], k: 1.95 }
};
let DX = 56, DY = 0;
function DOCK(mode) {
  const m = MODES[mode] || MODES.all, base = mobile ? 52 : 66, c = mobile ? 41 : 56, pr = mobile ? 29 : 38;
  DX = c; DY = IH - c;
  // inside a pillar the dock zooms to that pillar's medallion; at an intersection, to the pair
  if (m.zoom === 1) { const sc = (mobile ? 47 : 62) / (MED * 2); return S({ x: c, y: DY + ARM * sc, size: sc * 506, plate: 1, rot: m.rot, e: m.e, cr: pr }); }
  if (m.zoom === 2) { const sc = pr / 153; return S({ x: c, y: DY + 46 * sc, size: sc * 506, plate: 1, rot: m.rot, e: m.e, cr: pr }); }
  return S({ x: c, y: DY, size: base * (m.k || 1), plate: 1, rot: m.rot, e: m.e, arc: m.arc || [1, 1, 1], split: m.split || 0 });
}

/* ------------------------------------------------------------------
   Scroll track: keyframes of compass state placed along the page.
------------------------------------------------------------------ */
let keys = [], scenes = [], sections = [], maxScroll = 1;
const top = el => el.getBoundingClientRect().top + scrollY;
function portalGeom(i) {
  const size = Math.min(VH * .8, VW * (mobile ? 1.1 : .9)), sc = size / 506;
  const px = VW * .5, py = VH * (mobile ? .36 : .4);
  return { size, sc, px, py, cx: px, cy: py + ARM * sc, d0: MED * 2 * sc, r0: .752 * MED * sc };
}
function layout() {
  VW = root.clientWidth; IH = innerHeight; VH = probe.offsetHeight || innerHeight; mobile = VW < 900;
  maxScroll = Math.max(1, root.scrollHeight - IH);
  for (const p of parEls) { const r = p.host.getBoundingClientRect(); p.mid = r.top + scrollY + r.height / 2; }
  keys = []; scenes = [];
  const push = (y, st, e) => keys.push({ y, st, e });
  let prev = 'all';
  sections = $$('[data-mode]').map(el => ({ el, top: top(el), h: el.offsetHeight, mode: el.dataset.mode, name: el.dataset.name || '' }));
  if (reduced) { sections.forEach(s => { if (s.mode === 'white') s.mode = 'all'; if (s.mode === 'final') s.mode = 'all'; }); return; }
  sections.forEach(sec => {
    const { el, top: t0, h, mode } = sec, type = el.dataset.scene;
    if (mode === 'final') {
      push(t0 - .75 * IH, DOCK(prev));
      push(maxScroll, S(mobile ? { x: VW * .5, y: IH * .3, size: VW * .62, lab: 1, coreA: 1 } : { x: VW * .25, y: IH * .5, size: Math.min(IH * .62, VW * .4), lab: 1, coreA: 1 }));
      return;
    }
    if (!type) {
      if (mode !== prev) { push(t0 - .62 * VH, DOCK(prev)); push(t0 - .28 * VH, DOCK(mode)); }
      prev = mode; return;
    }
    const span = Math.max(1, h - VH), at = p => t0 + p * span;
    const scn = { el, type, t0, span, ons: $$('[data-on]', el).map(n => ({ n, r: n.dataset.on.split(',').map(Number) })) };
    scenes.push(scn);
    if (type === 'hero') {
      const H = S(mobile ? { x: VW * .5, y: VH * .27, size: Math.min(VW * .74, VH * .4), lab: 1, coreA: 1 } : { x: VW * .755, y: VH * .52, size: Math.min(VH * .74, VW * .4), lab: 1, coreA: 1 });
      push(0, H); push(at(.2), Object.assign({}, H, { y: H.y - VH * .03 }));
      push(at(.46), DOCK('all'));
    } else if (type === 'pillars') {
      const B = mobile ? { x: VW * .5, y: VH * .27, size: Math.min(VW * .78, VH * .42) } : { x: VW * .7, y: VH * .57, size: Math.min(VH * .84, VW * .5) };
      const st = (e, d, x) => S(Object.assign({ lab: 1 }, B, { e, d }, x || {}));
      push(t0 - .55 * VH, DOCK(prev));
      push(at(0), st([0, 0, 0], [1, 1, 1])); push(at(.17), st([0, 0, 0], [1, 1, 1]));
      push(at(.25), st([1, 0, 0], [1, 1, 1])); push(at(.38), st([1, 0, 0], [1, 1, 1]));
      push(at(.45), st([1, 1, 0], [.45, 1, 1])); push(at(.58), st([1, 1, 0], [.45, 1, 1]));
      push(at(.65), st([1, 1, 1], [.45, .45, 1])); push(at(.78), st([1, 1, 1], [.45, .45, 1]));
      push(at(.85), st([1, 1, 1], [1, 1, 1], { coreA: 1 })); push(at(1) + .1 * VH, st([1, 1, 1], [1, 1, 1], { coreA: 1 }));
      push(at(1) + .5 * VH, DOCK('all'));
    } else if (type === 'portal') {
      const i = +el.dataset.pillar, g = portalGeom(i); scn.g = g; scn.i = i;
      const only = [0, 0, 0]; only[i] = 1;
      const G = x => S(Object.assign({ x: g.cx, y: g.cy, size: g.size, rot: -ANG[i], e: only.slice(), coreC: 1 }, x || {}));
      const gone = [1, 1, 1]; gone[i] = 0;
      push(t0 - .5 * VH, DOCK(prev));
      push(at(.05), G()); push(at(.2), G());
      push(at(.2) + 1, G({ mo: gone })); push(at(.4), G({ mo: gone }));
      const hid = Object.assign(DOCK(mode), { op: 0, plate: 0 });
      push(at(.4) + 1, hid); push(at(.53), hid); push(at(.62), DOCK(mode));
    } else if (type === 'pair') {
      const pr = el.dataset.pair, e = pr === 'cd' ? [1, 0, 1] : pr === 'bd' ? [0, 1, 1] : [1, 1, 0];
      const up = pr === 'bd' ? -.07 : .04;
      const P = S(mobile ? { x: VW * .5, y: VH * (.25 + up * .6), size: Math.min(VW * .7, VH * .38), e, coreB: 1, lab: 1 } : { x: VW * .27, y: VH * (.5 + up), size: Math.min(VH * .78, VW * .44), e, coreB: 1, lab: 1 });
      push(t0 - .5 * VH, DOCK(prev)); push(at(.04), P); push(at(1) + .05 * VH, P); push(at(1) + .5 * VH, DOCK(mode));
    } else if (type === 'white') {
      const W = r => S({ x: VW * .5, y: VH * .54, size: Math.min(VH * .57, VW * .84), white: 1, rot: r });
      push(t0 - .5 * VH, DOCK(prev)); push(at(.06), W(-10)); push(at(1), W(10), 'lin'); push(at(1) + .5 * VH, DOCK('all'));
      sec.mode = 'all';
    } else if (type === 'split') {
      const R = Math.min(VH * .3, VW * (mobile ? .36 : .4)), sz = R / 100 * 506, cy = VH * (mobile ? .42 : .56);
      const A = S({ x: VW * .5, y: cy, size: sz, e: [0, 0, 0], white: 1 }), B = S({ x: VW * .5, y: cy, size: sz, e: [0, 0, 0], split: 1 });
      push(t0 - .5 * VH, DOCK(prev)); push(at(.06), A); push(at(.4), A); push(at(.56), B); push(at(1) + .05 * VH, B); push(at(1) + .5 * VH, DOCK(mode));
    }
    prev = (type === 'white' || type === 'hero' || type === 'pillars') ? 'all' : mode;
  });
  keys.sort((a, b) => a.y - b.y);
}
function stateAt(y) {
  if (!keys.length) return DOCK('all');
  if (y <= keys[0].y) return keys[0].st;
  const last = keys[keys.length - 1];
  if (y >= last.y) return last.st;
  let lo = 0, hi = keys.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (keys[m].y <= y) lo = m; else hi = m; }
  const a = keys[lo], b = keys[hi], t = (y - a.y) / Math.max(1, b.y - a.y);
  return mix(a.st, b.st, b.e === 'lin' ? t : ease(t));
}

/* ---- per-frame update ---- */
const spine = $('#spineFill'), where = $('#dockWhere');
let lastMask = 'none', lastClip = 'none', coreFor = -1, lastSp = '';
const CORE_NAMES = [['CLIMATE', 'ACTION', 13.5, '#1F6B2E'], ['BLUE', 'ECONOMY', 13.5, '#4F49AE'], ['DIGITAL', 'TRANSFORMATION', 9.6, '#D9531A']];
let parEls = [], curName = '', introT0 = performance.now(), introOn = !reduced && scrollY < 40;
function update(y) {
  // compass
  let st;
  if (reduced) {
    const mid = y + IH * .5; let m = 'all';
    for (const s of sections) if (s.top <= mid) m = s.mode;
    st = DOCK(m);
  } else st = stateAt(y);
  let intro = 1;
  if (introOn) { intro = clamp((performance.now() - introT0 - 250) / 2600); if (intro >= 1 || y > 60) { introOn = false; intro = 1; } }
  render(st, intro);
  // scenes
  let mask = 'none', clip = 'none';
  if (!reduced) for (const sc of scenes) {
    if (y < sc.t0 - VH * 1.2 || y > sc.t0 + sc.span + VH * 1.2) continue;
    const p = (y - sc.t0) / sc.span;
    const pv = clamp(p).toFixed(3); if (pv !== sc.pv) { sc.pv = pv; if (sc.type === 'hero') sc.el.style.setProperty('--p', pv); }
    for (const o of sc.ons) o.n.classList.toggle('on', p >= o.r[0] && p < o.r[1]);
    if (sc.type === 'portal') {
      if (coreFor !== sc.i) { coreFor = sc.i; const n = CORE_NAMES[sc.i]; C.cc1.textContent = n[0]; C.cc2.textContent = n[1]; C.cc2.setAttribute('font-size', n[2]); C.coreC.setAttribute('fill', n[3]); }
      const g = sc.g, t = clamp((p - .22) / .3), tt = t * t * (3 - 2 * t);
      const R = Math.hypot(Math.max(g.px, VW - g.px), Math.max(g.py, VH - g.py)) * 1.04;
      const r = p < .2 ? 0 : g.r0 * Math.pow(R / g.r0, tt);
      const s = sc.el.style;
      s.setProperty('--px', g.px.toFixed(1) + 'px'); s.setProperty('--py', g.py.toFixed(1) + 'px'); s.setProperty('--d0', g.d0.toFixed(1) + 'px');
      s.setProperty('--r', r.toFixed(1) + 'px'); s.setProperty('--rs', (Math.max(r, g.r0) / g.r0).toFixed(3));
      s.setProperty('--pv', p >= .2 && tt < 1 ? 1 : 0);
      s.setProperty('--io', p < .2 ? 0 : (1 - clamp((p - .205) / .07)).toFixed(3));
      s.setProperty('--ps', (1.22 - .22 * clamp((p - .2) / .55)).toFixed(4));
      s.setProperty('--sh', clamp((p - .42) / .16).toFixed(3));
      if (p >= .2 && tt < 1) {   // the growing porthole passes in front of the compass
        const k = (st.size / 506) / UNIT, lr = (Math.max(r, g.r0) / .752) / k;
        mask = `radial-gradient(circle at ${((g.px - st.x) / k + 360).toFixed(1)}px ${((g.py - st.y) / k + 360).toFixed(1)}px, transparent ${lr.toFixed(1)}px, #000 ${(lr + .7).toFixed(1)}px)`;
      }
    } else if (sc.type === 'split') {
      sc.el.style.setProperty('--mo', (1 - clamp((p - .4) / .14)).toFixed(3));
    }
  }
  if (mask === 'none' && st.cr < 2500) {   // docked and zoomed: crop to the dock's disc
    const k = (st.size / 506) / UNIT;
    clip = `circle(${(st.cr / k).toFixed(1)}px at ${((DX - st.x) / k + 360).toFixed(1)}px ${((DY - st.y) / k + 360).toFixed(1)}px)`;
  }
  if (clip !== lastClip) { lastClip = clip; C.el.style.clipPath = clip; }
  if (mask !== lastMask) { lastMask = mask; C.el.style.webkitMaskImage = mask; C.el.style.maskImage = mask; }
  // spine + dock label
  const sp = clamp(y / maxScroll).toFixed(3); if (sp !== lastSp) { lastSp = sp; spine.style.setProperty('--sp', sp); }
  const mid = y + IH * .5; let nm = sections.length ? sections[0].name : '';
  for (const s of sections) if (s.top <= mid) nm = s.name; else break;
  if (nm !== curName) { curName = nm; where.textContent = nm; }
  // parallax
  if (!reduced) for (const p of parEls) {
    if (!p.vis) continue;
    const d = (p.mid - y) - IH / 2;
    p.el.style.transform = `translate3d(0,${(-d * p.k).toFixed(1)}px,0)`;
  }
}
let ys = scrollY, raf = 0;
function tick() {
  raf = 0;
  const y = scrollY, d = y - ys;
  ys = Math.abs(d) < .4 ? y : ys + d * .2;
  update(ys);
  if (ys !== y || introOn) raf = requestAnimationFrame(tick);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
addEventListener('scroll', kick, { passive: true });
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); fitChartLabels(); ys = scrollY; kick(); }, 120); });

/* ---- reveal on scroll, counters, parallax visibility ---- */
function countUp(el) {
  const to = +el.dataset.count, t0 = performance.now(), dur = 1500;
  const step = now => { const t = clamp((now - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function observe() {
  if (reduced || !('IntersectionObserver' in window)) { $$('.rv').forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el); el.classList.add('in');
    (el.matches('[data-count]') ? [el] : $$('[data-count]', el)).forEach(countUp);
  }), { threshold: .14, rootMargin: '0px 0px -7% 0px' });
  $$('.rv').forEach(e => io.observe(e));
  parEls = $$('[data-par]').map(el => { const host = el.parentElement, r = host.getBoundingClientRect(); return { el, host, k: +el.dataset.par, vis: false, mid: r.top + scrollY + r.height / 2 }; });
  // a parallax picture gets its own layer only while it is on screen
  const po = new IntersectionObserver(es => es.forEach(e => { const p = parEls.find(q => q.host === e.target); if (p) { p.vis = e.isIntersecting; p.el.style.willChange = p.vis ? 'transform' : 'auto'; } }), { rootMargin: '20% 0px' });
  parEls.forEach(p => po.observe(p.host));
}

/* ---- contents menu ---- */
const menu = $('#menu'), veil = document.createElement('div'); veil.id = 'veil'; document.body.appendChild(veil);
let lastFocus = null;
function openMenu() {
  lastFocus = document.activeElement; menu.hidden = false; menu.scrollTop = 0;
  const mc = $('#mapCompass'), r = mc.getBoundingClientRect(), d = C.dock.getBoundingClientRect();
  if (!reduced) {
    const sc = ((mobile ? 52 : 66) / 506 * 520) / r.width;
    mc.style.transition = 'none';
    mc.style.transform = `translate(${(d.left + d.width / 2 - r.left - r.width / 2).toFixed(1)}px,${(d.top + d.height / 2 - r.top - r.height / 2).toFixed(1)}px) scale(${sc.toFixed(4)})`;
    mc.getBoundingClientRect();
    mc.style.transition = 'transform .95s cubic-bezier(.2,.7,.1,1)'; mc.style.transform = 'none';
  }
  menuOpen = true; C.el.style.opacity = 0;
  menu.classList.add('open'); C.dock.setAttribute('aria-expanded', 'true');
  const mid = scrollY + IH * .5; let cur = null, best = -1;
  $$('.map a[href]:not(.hot)').forEach(a => { const t = a.getAttribute('href') === '#top' ? document.body : $(a.getAttribute('href')); if (!t) return; const y = a.getAttribute('href') === '#top' ? 0 : top(t); if (y <= mid + 2 && y >= best) { best = y; cur = a; } });
  $$('.map a').forEach(a => a.classList.toggle('cur', a === cur));
  setTimeout(() => $('#menuClose').focus(), 60);
}
function closeMenu(refocus = true) {
  menu.classList.remove('open'); C.dock.setAttribute('aria-expanded', 'false');
  menuOpen = false; kick();
  setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, 720);
  if (refocus && lastFocus) lastFocus.focus();
}
C.dock.addEventListener('click', () => (menu.classList.contains('open') ? closeMenu() : openMenu()));
$('#menuClose').addEventListener('click', () => closeMenu());
addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  if (e.key === 'Tab' && menu.classList.contains('open')) {
    const f = $$('a,button', menu), a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
});
function jump(id, far) {
  const t = id === '#top' ? document.body : $(id); if (!t) return;
  const sect = id === '#top' || t.matches('section,header,footer');
  const y = id === '#top' ? 0 : Math.max(0, top(t) + (t.dataset.scene === 'pair' ? VH * .25 : sect ? 0 : -IH * .16));
  const go = () => { scrollTo(0, y); ys = y; layout(); kick(); if (t.focus && id !== '#top') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } };
  if (reduced || !far) { reduced ? go() : scrollTo({ top: y, behavior: 'smooth' }); return; }
  veil.classList.add('on'); setTimeout(() => { go(); setTimeout(() => veil.classList.remove('on'), 80); }, 290);
}
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute('href'); if (id.length < 2) return;
  e.preventDefault();
  const inMenu = !!a.closest('.menu');
  if (inMenu) closeMenu(false);
  const t = id === '#top' ? null : $(id), dist = Math.abs((t ? top(t) : 0) - scrollY);
  jump(id, inMenu || dist > IH * 2.5);
});
$('#toTop').addEventListener('click', () => jump('#top', true));

/* ---- UNDP's office network, drawn with the report's island outlines ---- */
(() => {
  const net = $('#offices'), hubs = $('#hubs'), cos = $('#cos'); if (!net || !hubs) return;
  const RC = { car: '#1E9E92', pac: '#E2A100', ais: '#B02261' }, RN = { car: 'Caribbean', pac: 'Pacific', ais: 'AIS' };
  const SP = { bvi: 'British Virgin Islands', 'st-kitts-and-nevis': 'St. Kitts and Nevis', 'st-vincent': 'St. Vincent and the Grenadines', 'sao-tome': 'São Tomé and Príncipe', curacao: 'Curaçao', 'timor-leste': 'Timor-Leste', 'guinea-bissau': 'Guinea-Bissau', bahamas: 'The Bahamas', 'antigua-and-barbuda': 'Antigua and Barbuda', 'trinidad-and-tobago': 'Trinidad and Tobago', 'turks-and-caicos': 'Turks and Caicos Islands' };
  const nm = id => SP[id] || id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const HUBS = [['jamaica', 'car', ['bermuda', 'cayman-islands', 'turks-and-caicos', 'bahamas']], ['trinidad-and-tobago', 'car', ['aruba', 'curacao', 'sint-maarten']], ['barbados', 'car', ['bvi', 'anguilla', 'st-kitts-and-nevis', 'antigua-and-barbuda', 'montserrat', 'dominica', 'saint-lucia', 'st-vincent', 'grenada']], ['mauritius', 'ais', ['seychelles']], ['samoa', 'pac', ['niue', 'cook-islands', 'tokelau']], ['fiji', 'pac', ['palau', 'micronesia', 'marshall-islands', 'nauru', 'kiribati', 'tuvalu', 'solomon-islands', 'vanuatu', 'tonga']]];
  const COS = [['car', ['cuba', 'haiti', 'dominican-republic', 'belize', 'guyana', 'suriname']], ['pac', ['papua-new-guinea', 'timor-leste']], ['ais', ['cabo-verde', 'guinea-bissau', 'maldives', 'bahrain', 'sao-tome', 'comoros', 'singapore']]];
  const cnt = { m: 0, c: 0, s: 0 }, el = { m: $('#cMCO'), c: $('#cCO'), s: $('#cSIDS') };
  const bump = k => { cnt[k]++; el[k].textContent = cnt[k]; if (k !== 's') { cnt.s++; el.s.textContent = cnt.s; } };
  const rnd = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
  function node(id, cls, reg, role) {
    const n = document.createElement('div'); n.className = 'isl ' + cls; n.dataset.reg = reg; n.style.setProperty('--c', RC[reg]); n.dataset.tip = `${nm(id)}: ${role}`;
    n.innerHTML = `<img src="assets/isl/${id}.webp" alt="" loading="lazy" style="--bd:${rnd(4.5, 7.5)}s;--dl:-${rnd(0, 6)}s"><b>${nm(id)}</b>`;
    return n;
  }
  const cards = HUBS.map(([h, reg, sats]) => {
    const c = document.createElement('div'); c.className = 'hub-card'; c.dataset.reg = reg; c.style.setProperty('--c', RC[reg]);
    const n = sats.length, R = 37, cx = 50, cy = 46, pts = sats.map((_, i) => { const a = (n === 1 ? 0 : (n === 4 ? -45 : -90) + i * 360 / n) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
    c.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="orbit" cx="${cx}" cy="${cy}" r="${R}"/>${pts.map(([x, y]) => { const dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy); return `<line class="ln" pathLength="1" x1="${cx + dx / L * 15}" y1="${cy + dy / L * 15}" x2="${x - dx / L * 7}" y2="${y - dy / L * 7}"/>`; }).join('')}</svg>`;
    const hn = node(h, 'hub', reg, `multi-country office (${RN[reg]}), also covering ${n} other SIDS`); hn.style.left = cx + '%'; hn.style.top = cy + '%';
    hn.insertAdjacentHTML('beforeend', `<small>Multi-country office, +${n} SIDS</small>`); c.appendChild(hn);
    const sn = sats.map((sid, i) => { const x = node(sid, 'sat', reg, `covered by the ${nm(h)} multi-country office`); x.style.left = pts[i][0] + '%'; x.style.top = pts[i][1] + '%'; c.appendChild(x); return x; });
    hubs.appendChild(c);
    c._play = () => { hn.classList.add('in'); bump('m'); const lines = $$('.ln', c); sn.forEach((x, i) => { setTimeout(() => { lines[i].style.strokeDashoffset = 0; }, 380 + i * 120); setTimeout(() => { x.classList.add('in'); bump('s'); }, 760 + i * 120); }); };
    return c;
  });
  const groups = COS.map(([reg, list]) => {
    const g = document.createElement('div'); g.className = 'co-group'; g.dataset.reg = reg; g.style.setProperty('--c', RC[reg]); g.innerHTML = `<h5>${RN[reg]}</h5><div class="co-tiles"></div>`;
    const t = $('.co-tiles', g), ns = list.map(id => { const x = node(id, '', reg, `country office (${RN[reg]})`); t.appendChild(x); return x; }); cos.appendChild(g);
    g._play = () => ns.forEach((x, i) => setTimeout(() => { x.classList.add('in'); bump('c'); }, i * 140)); return g;
  });
  const lg = $('#netLegend');
  [['all', 'All regions', '#0F1C3F'], ['car', 'Caribbean', RC.car], ['pac', 'Pacific', RC.pac], ['ais', 'AIS', RC.ais]].forEach(([k, l, c]) => {
    const b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--c', c); b.innerHTML = `<i></i>${l}`; b.setAttribute('aria-pressed', k === 'all');
    b.onclick = () => { net.classList.remove('f-car', 'f-pac', 'f-ais'); if (k !== 'all') net.classList.add('f-' + k); $$('button', lg).forEach(x => x.setAttribute('aria-pressed', x === b)); }; lg.appendChild(b);
  });
  net.addEventListener('pointermove', e => { const t = e.target.closest('.isl'); if (t) showTip(t.dataset.tip, e.clientX, e.clientY); });
  const all = [...cards, ...groups];
  if (reduced || !('IntersectionObserver' in window)) { all.forEach(c => { $$('.isl', c).forEach(n => n.classList.add('in')); $$('.ln', c).forEach(l => { l.style.strokeDashoffset = 0; }); }); return; }
  el.m.textContent = el.c.textContent = el.s.textContent = '0';
  const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target._play(); o.unobserve(e.target); } }), { threshold: .35 }); all.forEach(c => o.observe(c));
})();

/* ---- Digital Readiness Assessment wheel (Figure 3) ---- */
(() => {
  const W = $('#wheel'); if (!W) return;
  const P = [['People', ['Usage and adoption', 'Skill and literacy', 'Civic engagement', 'Cultural norms'], 'M18 22a6 6 0 1 0 0-.1M30 22a6 6 0 1 0 0-.1M8 40c0-7 5-11 10-11s10 4 10 11M22 40c0-7 4-11 8-11s10 4 10 11'],
    ['Connectivity', ['Physical infrastructure', 'Access enablers'], 'M24 24m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M14 14m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M34 14m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M24 36m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M16 16l5 5M32 16l-5 5M24 28v5'],
    ['Government', ['Implementation capacity and systems', 'Digital public services and platforms', 'Leadership and strategy'], 'M8 22L24 10l16 12M12 20v18h24V20M20 38v-9h8v9'],
    ['Regulation', ['Cybersecurity', 'Consumer protection', 'Fair market competition', 'Emerging technologies'], 'M10 10h28v28H10zM16 24l6 6 11-12'],
    ['Economy', ['Standards of responsibility', 'Innovation ecosystem', 'Financial services', 'Business'], 'M8 30h10l8 4 12-6M18 30V22h14v6M24 14a5 5 0 1 0 .1 0M24 11v6']];
  W.setAttribute('viewBox', '0 0 600 600');
  W.innerHTML = `<defs><linearGradient id="wCore" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EE5A24"/><stop offset="1" stop-color="#F7A81C"/></linearGradient>
    <linearGradient id="wBand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5FB878"/><stop offset=".42" stop-color="#62AEE0"/><stop offset=".72" stop-color="#8A74C6"/><stop offset="1" stop-color="#EE7D58"/></linearGradient>
    <path id="wArc1" d="M142,300 A158,158 0 0,1 458,300"/><path id="wArc2" d="M174,300 A126,126 0 0,1 426,300"/></defs>
    <g class="wspin"><circle cx="300" cy="300" r="270" fill="none" stroke="#0F1C3F" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="2 9"/></g>
    <circle cx="300" cy="300" r="215" fill="none" stroke="#0F1C3F" stroke-width="1.6"/>
    <text font-weight="700" font-size="14" letter-spacing="2.2" fill="#0F1C3F"><textPath href="#wArc1" startOffset="50%" text-anchor="middle">DIGITAL PUBLIC INFRASTRUCTURE</textPath></text>
    <circle cx="300" cy="300" r="116" fill="none" stroke="url(#wBand)" stroke-width="68"/>
    <text font-weight="700" font-size="12" letter-spacing="1.5" fill="#fff"><textPath href="#wArc2" startOffset="50%" text-anchor="middle">PRINCIPLES OF DIGITAL INCLUSION</textPath></text>
    <circle cx="300" cy="300" r="80" fill="url(#wCore)" stroke="#fff" stroke-width="2.5"/>
    <g text-anchor="middle" fill="#fff" font-weight="700" letter-spacing=".5"><text x="300" y="286" font-size="12.5">INCLUSIVE</text><text x="300" y="304" font-size="12.5">WHOLE-OF-SOCIETY</text><text x="300" y="321" font-size="10.5">DIGITAL TRANSFORMATION</text></g>
    <g font-size="11.5" fill="#fff" text-anchor="middle" font-weight="600"><text x="300" y="412">Protection of</text><text x="300" y="426">human rights</text><text x="186" y="322">Universal</text><text x="186" y="336">access</text><text x="414" y="322">Fostering</text><text x="414" y="336">trust</text></g>
    <g font-size="12" fill="#0F1C3F" text-anchor="middle"><text x="118" y="300">Data</text><text x="118" y="315">exchange</text><text x="482" y="308">Payments</text><text x="300" y="488">Identification</text></g>
    <g id="wnodes"></g>`;
  const g = $('#wnodes'), panel = $('#wpanel'), tabs = $('#wtabs'); let cur = 0, timer = null, stopped = false;
  P.forEach((p, i) => {
    const a = (-90 + i * 72) * Math.PI / 180, x = 300 + 215 * Math.cos(a), y = 300 + 215 * Math.sin(a);
    const n = document.createElementNS('http://www.w3.org/2000/svg', 'g'); n.setAttribute('class', 'wnode'); n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button'); n.setAttribute('aria-label', p[0]);
    n.innerHTML = `<circle class="bgc" cx="${x}" cy="${y}" r="39"/><g transform="translate(${x - 20},${y - 28}) scale(.84)" fill="none" stroke="#0F1C3F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${p[2]}"/></g><text x="${x}" y="${y + 24}" text-anchor="middle" font-size="8.6" font-weight="700" letter-spacing=".5" fill="#0F1C3F">${p[0].toUpperCase()}</text>`;
    const pick = () => { sel(i); stop(); stopped = true; };
    n.addEventListener('click', pick); n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }); g.appendChild(n);
    const b = document.createElement('button'); b.type = 'button'; b.textContent = p[0]; b.onclick = pick; tabs.appendChild(b);
  });
  function sel(i) {
    cur = i; $$('.wnode', g).forEach((n, k) => n.classList.toggle('on', k === i)); $$('button', tabs).forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    panel.innerHTML = `<small>Pillar ${i + 1} of 5</small><h4>${P[i][0]}</h4><ul>${P[i][1].map(x => `<li>${x}</li>`).join('')}</ul>`;
  }
  function stop() { clearInterval(timer); timer = null; }
  sel(0);
  if (!reduced && 'IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !timer && !stopped) timer = setInterval(() => sel((cur + 1) % 5), 2800); else if (!e.isIntersecting) stop(); }), { threshold: .4 }).observe(W);
})();

/* ---- unit dots ---- */
$$('.udots').forEach(d => { const n = +d.dataset.n, k = +d.dataset.k; d.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < k ? 'k' : ''}" style="transition-delay:${i < k ? i * 28 : 0}ms"></i>`).join(''); d.setAttribute('role', 'img'); d.setAttribute('aria-label', `${k} of ${n}`); });

/* ---- screen recordings of the SIDS Data Platform ---- */
(() => {
  const ok = 'IntersectionObserver' in window;
  const tryPlay = v => { const p = v.play(); if (p && p.catch) p.catch(() => { v.controls = true; }); };
  $$('.autovid').forEach(v => { if (!ok || reduced) { v.controls = true; return; } new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) tryPlay(v); else v.pause(); }), { threshold: .3 }).observe(v); });
  const P = $('#player'); if (!P) return;
  const V = [['portfolio', 'UNDP SIDS portfolio', 'Projects and funding by region and SDG'], ['indicators', 'Development indicators', 'Key indicators across all 58 SIDS'], ['profile', 'Country profiles', 'Each country against regional averages'], ['geo', 'Geospatial data', 'High-resolution layers such as wind potential and population']];
  const v = $('#plv'), tabs = $('#pltabs'), pp = $('#plpp'); let cur = 0, inview = false, paused = reduced;
  V.forEach(([k, l, d], i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.innerHTML = `<i class="pbar"></i>${l}<small>${d}</small>`; b.onclick = () => sel(i, true); tabs.appendChild(b); });
  const bars = $$('.pbar', tabs);
  function setPP() { pp.textContent = paused ? 'Play' : 'Pause'; pp.setAttribute('aria-label', paused ? 'Play' : 'Pause'); }
  function sel(i, user) {
    cur = i; $$('button', tabs).forEach((b, k) => b.setAttribute('aria-selected', k === i)); bars.forEach((b, k) => b.style.setProperty('--p', k < i ? 1 : 0));
    v.classList.add('swap');
    setTimeout(() => { v.poster = `assets/vid/${V[i][0]}.webp`; v.src = `assets/vid/${V[i][0]}.mp4`; v.load(); v.classList.remove('swap'); if (inview && (!paused || user)) { paused = false; setPP(); tryPlay(v); } }, user ? 150 : 300);
  }
  pp.onclick = () => { paused = !paused; setPP(); if (paused) v.pause(); else tryPlay(v); };
  v.addEventListener('timeupdate', () => { if (v.duration) bars[cur].style.setProperty('--p', (v.currentTime / v.duration).toFixed(3)); });
  v.addEventListener('ended', () => sel((cur + 1) % V.length));
  sel(0); setPP();
  if (ok) new IntersectionObserver(es => es.forEach(e => { inview = e.isIntersecting; if (inview && !paused) tryPlay(v); else v.pause(); }), { threshold: .35 }).observe(P);
})();

/* ---- looping animations only run while their section is on screen ---- */
if ('IntersectionObserver' in window) {
  const lo = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '10% 0px' });
  $$('#offices,#wheel,.hero').forEach(el => lo.observe(el));
}

/* ---- go ---- */
buildCharts();
layout();
observe();
update(ys);
kick();
addEventListener('load', () => { layout(); fitChartLabels(); ys = scrollY; kick(); if (location.hash && $(location.hash)) jump(location.hash, true); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); fitChartLabels(); kick(); });
if ('ResizeObserver' in window) { let h0 = 0; new ResizeObserver(() => { const h = root.scrollHeight; if (Math.abs(h - h0) > 4) { h0 = h; layout(); kick(); } }).observe(document.body); }
})();
