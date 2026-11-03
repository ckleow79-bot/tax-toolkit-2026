// UI + visualisation helpers (SVG, tokens via CSS variables).
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const num = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; };
export const pct = (n, dp = 0) => (n * 100).toFixed(dp) + "%";
export const icon = (name) => `<i data-lucide="${name}"></i>`;
export const refreshIcons = () => { try { window.lucide && window.lucide.createIcons(); } catch (e) {} };

export function toast(msg) { const t = h(`<div class="toast" role="status">${esc(msg)}</div>`); document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }

export const WARN = `<div class="warn">${icon("shield-alert")}<span>Do not enter client names, IC numbers or TINs. Inputs stay in this browser only.</span></div>`;
export const TAG = { inforce: "IN FORCE", proposed: "PROPOSED", guide: "LHDN GUIDELINE", pending: "GAZETTE PENDING" };
export const auth = (tag, text) => `<div class="auth"><span class="tag ${tag}">${TAG[tag]}</span><span>${esc(text)}</span></div>`;

// money input field
export const fMoney = (id, label, val, hint = "") => `<div class="field"><label for="${id}">${label}</label><div class="money"><input id="${id}" inputmode="decimal" value="${val}" autocomplete="off"></div>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
export const fDate = (id, label, val, hint = "") => `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="date" value="${val}">${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
export const fNum = (id, label, val, hint = "") => `<div class="field"><label for="${id}">${label}</label><input id="${id}" inputmode="decimal" value="${val}" autocomplete="off">${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
export const fSel = (id, label, opts, val, hint = "") => `<div class="field"><label for="${id}">${label}</label><select id="${id}">${opts.map(([v, l]) => `<option value="${v}"${v === val ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
export const fSw = (id, label, on = false) => `<div class="toggle"><span id="${id}-l">${label}</span><button class="sw" id="${id}" role="switch" aria-checked="${on}" aria-labelledby="${id}-l"></button></div>`;
export const swOn = (el) => el.getAttribute("aria-checked") === "true";
export function bindSw(root, cb) { $$(".sw", root).forEach((b) => b.addEventListener("click", () => { b.setAttribute("aria-checked", !swOn(b)); cb(); })); }
export function seg(id, opts, val, label = "Choose a view") { return `<div class="seg" id="${id}" role="group" aria-label="${esc(label)}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${v === val}">${esc(l)}</button>`).join("")}</div>`; }
export function bindSeg(el, cb) { el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $$("button", el).forEach((x) => x.setAttribute("aria-pressed", x === b)); cb(b.dataset.v); }); }
export const segVal = (el) => $("button[aria-pressed=true]", el).dataset.v;

export function copyBtn(getText) {
  const b = h(`<button class="btn ghost">${icon("copy")}Copy result</button>`);
  b.addEventListener("click", async () => { const t = getText() + "\n\nTax Compliance Toolkit 2026 · position as at 7 Nov 2026 · training tool, not tax advice"; try { await navigator.clipboard.writeText(t); toast("Copied — paste into your working paper"); } catch (e) { prompt("Copy this:", t); } });
  return b;
}
export const printBtn = () => { const b = h(`<button class="btn ghost">${icon("printer")}Print</button>`); b.addEventListener("click", () => window.print()); return b; };

// ---------- SVG helpers ----------
const C = { ink: "var(--bk-ink)", blue: "var(--bk-blue)", coral: "var(--bk-coral)", amber: "var(--bk-amber)", teal: "var(--bk-teal)", violet: "var(--bk-violet)", lime: "var(--bk-lime)",
  success: "var(--bk-success)", muted: "var(--text-muted)", n100: "var(--bk-n-100)", n200: "var(--bk-n-200)", blue100: "var(--bk-blue-100)", coral100: "var(--bk-coral-100)", amber100: "var(--bk-amber-100)", teal100: "var(--bk-teal-100)" };
export { C };
export const cw = () => { const m = document.getElementById("main"); const w = m ? m.clientWidth : 700; return w >= 900 ? 600 : Math.max(290, Math.min(640, w - 72)); };
const fit = (s, px) => { const n = Math.max(4, Math.floor(px / 6.6)); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const short = (n) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 2).replace(/\.?0+$/, "") + "m" : Math.abs(n) >= 1e3 ? Math.round(n / 1e3) + "k" : String(Math.round(n)));
export { short };

/** Horizontal waterfall: steps [{label, value, kind:'start'|'minus'|'total'|'tax'}] */
export function waterfall(steps, opts = {}) {
  const W = cw(), rowH = 34, H = steps.length * rowH + 10, L = Math.round(Math.min(190, W * 0.38)), R = Math.round(Math.min(90, W * 0.17));
  const max = Math.max(...steps.map((s) => Math.abs(s.base ?? 0) + Math.abs(s.value)), 1);
  const x = (v) => L + (v / max) * (W - L - R);
  let run = 0, out = "";
  steps.forEach((s, i) => {
    const y = i * rowH + 6; let x0, x1, fill;
    if (s.kind === "start" || s.kind === "total") { x0 = x(0); x1 = x(Math.max(0, s.value)); run = s.value; fill = s.kind === "start" ? C.blue : C.ink; }
    else if (s.kind === "minus") { x1 = x(run); x0 = x(Math.max(0, run - s.value)); run -= s.value; fill = C.n200; }
    else { x0 = x(0); x1 = x(Math.max(0, s.value)); fill = C.coral; }
    out += `<text x="${L - 10}" y="${y + 19}" text-anchor="end" font-size="13" fill="var(--text-body)">${esc(fit(s.label, L - 12))}</text>
      <rect x="${x0}" y="${y + 4}" width="${Math.max(2, x1 - x0)}" height="22" rx="5" fill="${fill}"/>
      <text class="mono" x="${Math.max(x0, x1) + 8}" y="${y + 19}" font-size="12" font-weight="700" fill="var(--text-strong)">${s.kind === "minus" ? "−" : ""}${short(s.value)}</text>`;
  });
  return `<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || "Computation chart")}">${out}</svg>`;
}

/** Column bars [{label, value, color, pop}] */
export function columns(data, opts = {}) {
  const W = Math.min(420, cw()), H = 230, B = 40, T = 30, gap = W < 360 ? 22 : 34;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.1, bw = (W - gap * (data.length + 1)) / data.length;
  let out = `<line x1="0" x2="${W}" y1="${H - B}" y2="${H - B}" stroke="${C.n200}" stroke-width="1.5"/>`;
  data.forEach((d, i) => {
    const bh = (d.value / max) * (H - B - T), x = gap + i * (bw + gap), y = H - B - bh;
    out += `${d.pop ? `<rect x="${x + 4}" y="${y + 4}" width="${bw}" height="${bh}" rx="8" fill="${C.ink}"/>` : ""}
      <rect x="${x}" y="${y}" width="${bw}" height="${Math.max(2, bh)}" rx="8" fill="${d.color || C.blue}" ${d.pop ? `stroke="${C.ink}" stroke-width="2.5"` : ""}/>
      <text class="mono" x="${x + bw / 2}" y="${y - 8}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text-strong)">${esc(d.top || short(d.value))}</text>
      <text x="${x + bw / 2}" y="${H - B + 20}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text-muted)">${esc(d.label)}</text>`;
  });
  return `<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || "Bar chart")}">${out}</svg>`;
}

/** Line chart: series [{color, points:[[x,y]], label, dash}] markers [{x, label}] */
export function lines(series, opts = {}) {
  const W = cw(), H = 260, L = 50, R = 16, T = 16, B = 34;
  const xs = series.flatMap((s) => s.points.map((p) => p[0])), ys = series.flatMap((s) => s.points.map((p) => p[1]));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(0, ...ys), y1 = Math.max(...ys) * 1.08 || 1;
  const X = (v) => L + (v - x0) / (x1 - x0) * (W - L - R), Y = (v) => H - B - (v - y0) / (y1 - y0) * (H - T - B);
  let out = "";
  for (let k = 0; k <= 4; k++) { const v = y0 + (y1 - y0) * k / 4; out += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${C.n100}"/><text class="mono" x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--text-muted)">${(opts.yfmt || short)(v)}</text>`; }
  if (y0 < 0) out += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" stroke="${C.ink}" stroke-width="1.5"/>`;
  for (let k = 0; k <= 4; k++) { const v = x0 + (x1 - x0) * k / 4; out += `<text class="mono" x="${X(v)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${(opts.xfmt || short)(v)}</text>`; }
  (opts.markers || []).forEach((m) => { out += `<line x1="${X(m.x)}" x2="${X(m.x)}" y1="${T}" y2="${H - B}" stroke="${m.color || C.coral}" stroke-width="2" stroke-dasharray="5 4"/><text x="${X(m.x) + 6}" y="${T + 12}" font-size="12" font-weight="700" fill="${m.color || C.coral}">${esc(m.label)}</text>`; });
  series.forEach((s) => { out += `<polyline fill="none" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="7 5"' : ""} points="${s.points.map((p) => X(p[0]) + "," + Y(p[1])).join(" ")}"/>`; });
  (opts.dots || []).forEach((d) => { out += `<circle cx="${X(d.x)}" cy="${Y(d.y)}" r="7" fill="${d.color || C.ink}" stroke="#fff" stroke-width="2.5"/>`; });
  return `<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || "Line chart")}">${out}</svg>`;
}

/** Segmented bar: segs [{w, color, label, sub}] marker {pos (0-1), label} */
export function segbar(segs, marker, opts = {}) {
  const W = cw(), H = opts.h || 96, top = 28, bh = 34, tot = segs.reduce((a, s) => a + s.w, 0);
  let x = 0, out = "";
  segs.forEach((s, i) => { const w = s.w / tot * W; out += `<rect x="${x + 1}" y="${top}" width="${w - 2}" height="${bh}" rx="6" fill="${s.color}"/>${w > s.label.length * 8 ? `<text x="${x + w / 2}" y="${top + 22}" text-anchor="middle" font-size="13" font-weight="800" fill="${s.text || "var(--bk-ink)"}">${esc(s.label)}</text>` : ""}${s.sub && w > s.sub.length * 6.2 ? `<text x="${x + w / 2}" y="${top + bh + 18}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${esc(s.sub)}</text>` : ""}`; x += w; });
  if (marker) { const mx = Math.max(6, Math.min(W - 6, marker.pos * W)); out += `<path d="M${mx - 8},4 L${mx + 8},4 L${mx},18 Z" fill="${C.ink}"/><line x1="${mx}" x2="${mx}" y1="18" y2="${top + bh + 4}" stroke="${C.ink}" stroke-width="2.5"/><text x="${Math.min(W - 4, Math.max(4, mx))}" y="${H - 2}" text-anchor="${mx < 90 ? "start" : mx > W - 90 ? "end" : "middle"}" font-size="12" font-weight="800" fill="${C.ink}">${esc(marker.label)}</text>`; }
  return `<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || "Timeline")}">${out}</svg>`;
}

/** Gauge 0..1 with threshold */
export function gauge(v, threshold, label) {
  const W = 300, H = 170, cx = 150, cy = 150, r = 120, a = (t) => Math.PI * (1 - Math.min(1, Math.max(0, t)));
  const P = (t, rr = r) => [cx + rr * Math.cos(a(t)), cy - rr * Math.sin(a(t))];
  const arc = (t0, t1, col, w = 22) => { const [x0, y0] = P(t0), [x1, y1] = P(t1); return `<path d="M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="butt"/>`; };
  const [tx, ty] = P(threshold, r + 22), [nx, ny] = P(v, r - 30);
  return `<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${arc(0, threshold, C.teal100)}${arc(threshold, 1, C.coral100)}${arc(0, Math.min(v, 1), v >= threshold ? C.coral : C.teal, 10)}
    <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="${C.ink}"/>
    <text x="${tx}" y="${ty}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-muted)">${Math.round(threshold * 100)}%</text>
    <text class="mono" x="${cx}" y="${cy - 34}" text-anchor="middle" font-size="26" font-weight="700" fill="var(--text-strong)">${(v * 100).toFixed(1)}%</text></svg>`;
}

/** Interactive yes/no decision tree. nodes: [{q, hint, yes:{out}|"next", no:{out}|"next"}], final out */
export function tree(container, nodes, final, onOutcome) {
  const answers = [];
  function render() {
    let html = `<div class="tree">`, ended = null;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], a = answers[i], active = i === answers.length && !ended;
      const cls = ended ? "dim" : a !== undefined ? "done" : active ? "" : "dim";
      html += `<div class="tq ${cls}"><span class="bk-coin ${a !== undefined ? "bk-coin--blue" : ""}">${i + 1}</span><div><div class="q">${esc(n.q)}</div>
        ${ended ? "" : `<div class="bk-chips" data-i="${i}"><button class="bk-chip" data-a="yes" data-on="${a === "yes"}" ${cls === "dim" ? "disabled" : ""}>Yes</button><button class="bk-chip" data-a="no" data-on="${a === "no"}" ${cls === "dim" ? "disabled" : ""}>No</button></div>`}
        ${n.hint && active ? `<div class="hintq">${esc(n.hint)}</div>` : ""}</div></div>`;
      if (a !== undefined) { const br = n[a]; if (br !== "next") { ended = br; } }
      if (ended) break;
    }
    if (!ended && answers.length === nodes.length) ended = final;
    html += `</div>`;
    if (ended) html += `<div class="card bk-pop outcome bk-anim-pop" style="border-color:var(--bk-ink)"><span class="bk-eyebrow"><span class="bk-chev"></span>Outcome</span><h4>${esc(ended.title)}</h4><div>${ended.body}</div>${ended.auth ? auth(ended.tag || "inforce", ended.auth) : ""}<div class="btns"><button class="btn ghost" data-reset>${icon("rotate-ccw")}Start again</button></div></div>`;
    container.innerHTML = html;
    refreshIcons();
    onOutcome && onOutcome(ended, answers);
  }
  container.addEventListener("click", (e) => {
    const b = e.target.closest(".bk-chip"); if (b && !b.disabled) { const i = +b.parentElement.dataset.i; answers.length = i; answers[i] = b.dataset.a; render(); }
    if (e.target.closest("[data-reset]")) { answers.length = 0; render(); }
  });
  render();
}
