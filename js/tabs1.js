// Tabs 1–4: Which regime · RPGT · CGT · Stamp duty
import * as c from "./calc.js";
import { $, $$, h, esc, num, pct, icon, refreshIcons, WARN, auth, fMoney, fDate, fNum, fSel, fSw, swOn, bindSw, seg, bindSeg, segVal, copyBtn, printBtn, waterfall, columns, lines, segbar, gauge, tree, C, short } from "./ui.js";
const go = (t) => `<button class="btn" data-goto="${t}">${icon("arrow-right")}Open the ${t.toUpperCase()} calculator</button>`;
const goBtn = (tab, label) => `<button class="btn" data-goto="${tab}">${icon("arrow-right")}${label}</button>`;

// ================= 1. WHICH REGIME =================
export function regime(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 1 · Session 1.0</span><h2>Which regime applies?</h2>
    <p class="lead">Answer the questions in order. The path lights up and lands on the regime — with the authority to quote in your regime memo.</p></div>
    ${seg("rg-seg", [["land", "Land or property"], ["shares", "Shares in a company with land"]], "land", "Asset type")}
    <div class="grid two"><div class="card" id="rg-tree"></div>
    <div class="card"><h3>Why order matters</h3><ul class="bk-list"><li>A trading gain is never RPGT — RPGTA s.2 'gain' excludes income-taxable gains, so the s.4(a) question comes first.</li>
    <li>An RPGT clearance does not close the s.4(a) question — <i>KPHDN v Kristal Penaga</i> (HC, July 2026).</li><li>Compulsory acquisition is not a sale — <i>Wiramuda</i> (FC 2023); <i>Lush Development</i> (CA, 19 Oct 2026) applies it to closed years.</li>
    <li>Evidence of intention must exist at acquisition, not be written at audit (ITA Sch 5 para 13; RPGTA s.18).</li></ul>
    <h3 style="margin-top:18px">Badges of trade — what LHDN tests</h3>
    <table class="comp"><tr><td>Intention at acquisition</td><td>Board minutes, loan purpose</td></tr><tr><td>Period of ownership</td><td>Alf Properties: 10+ years</td></tr><tr><td>Frequency</td><td>Mount Pleasure: 5 dealings</td></tr><tr><td>Work done to sell</td><td>Subdivision, layout plans</td></tr><tr><td>Reason for sale</td><td>Forced sale vs planned exit</td></tr></table>
    ${auth("inforce", "ITA ss.4(a), 4(aa), 4C · RPGTA s.2, s.3 · Sch 2 para 3(1)(f) · CCH ¶3-110A")}</div></div>`;
  const LAND = [
    { q: "Compensation on compulsory acquisition — even of stock?", yes: { title: "Not income · RPGT no gain no loss", body: "Compensation has no profit element (<i>Wiramuda</i>, FC 2023). For RPGT, compulsory acquisition is no gain no loss under Sch 2 para 3(1)(f). If s.4C tax was paid on compensation, check refund rights (<i>Lush Development</i>, CA 19 Oct 2026).", auth: "Wiramuda [2023] 4 MLJ 753 · RPGTA Sch 2 para 3(1)(f)", tag: "inforce" }, no: "next" },
    { q: "Held as stock, or bought with an intention to trade?", hint: "Badges of trade: intention, period, frequency, work done to sell, reason for sale.", yes: { title: "Business income — ITA s.4(a)", body: "Taxed in the annual return (Form B / P / C) at scale rates, 24% or MSME bands. Not RPGT. Watch e-Invoice and CP500 / CP204 once in business.", auth: "ITA s.4(a) · RPGTA s.2 'gain'", tag: "inforce" }, no: "next" },
    { q: "Malaysian land (any disposer) — or RPC shares sold by an individual or partnership?", yes: { title: "RPGT — RPGTA s.3", body: `e-CKHT 1A (land) or 1B (RPC shares) within 60 days, tax within 90 days. Rate by Part I / II / III and year of disposal.<div class="btns">${goBtn("rpgt", "Compute the RPGT")}</div>`, auth: "RPGTA s.3, Sch 5 · Ops Guideline 2/2026", tag: "inforce" }, no: "next" },
    { q: "Company / LLP / trust / co-op disposing of unlisted shares or a foreign asset?", yes: { title: "CGT — ITA s.4(aa)", body: `Domestic unlisted shares: e-CKM and payment within 60 days. Foreign assets: Form C (exempt with economic substance to 2030).<div class="btns">${goBtn("cgt", "Compute the CGT")}</div>`, auth: "ITA s.4(aa), s.65C · Sch 1 Part XXI", tag: "inforce" }, no: "next" }];
  const LAND_F = { title: "None — capital receipt outside all four", body: "Record the reasoning in the regime memo and keep the acquisition evidence for the life of the asset.", auth: "Firm practice — regime memo on every disposal file", tag: "guide" };
  const SH = [
    { q: "Shares held as trading stock (a share dealer)?", yes: { title: "Business income — s.4(a)", body: "Not RPGT, not CGT.", auth: "ITA s.4(a)", tag: "inforce" }, no: "next" },
    { q: "Company never an RPC while the shares were held?", hint: "RPC = land and RPC shares at market value ≥ 75% of total tangible assets.", yes: { title: "Individual: outside tax · company: CGT", body: `Individuals and partnerships of individuals: outside CGT. Company / LLP / trust / co-op: CGT 10% of gain, or 2% of gross price for shares bought before 1 Jan 2024.<div class="btns">${goBtn("cgt", "Compute the CGT")}</div>`, auth: "ITA s.4(aa) · CGT Guidelines 2025 para 1.5", tag: "inforce" }, no: "next" },
    { q: "Seller a citizen / PR individual or a partnership?", yes: { title: "RPGT Part I — para 34A · e-CKHT 1B", body: `Year 6 onwards 0%. Individuals get the Sch 4 exemption; a partnership does not.<div class="btns">${goBtn("rpgt", "Compute the RPGT")}</div>`, auth: "RPGTA Sch 2 para 34A · Sch 5 Part I", tag: "inforce" }, no: "next" },
    { q: "Seller a non-citizen individual?", yes: { title: "RPGT Part III — 30% to year 5, then 10%", body: `Retention 7%.<div class="btns">${goBtn("rpgt", "Compute the RPGT")}</div>`, auth: "RPGTA Sch 2 para 34A · Sch 5 Part III", tag: "inforce" }, no: "next" }];
  const SH_F = { title: "Company / LLP / trust / co-op — CGT 10% or 2% · e-CKM", body: `A foreign company selling Malaysian RPC shares is also within CGT (Q&A Q17).<div class="btns">${goBtn("cgt", "Compute the CGT")}</div>`, auth: "ITA s.4(aa), s.15C · CGT Q&A 2024 Q17", tag: "inforce" };
  const draw = (v) => { const old = $("#rg-tree", el); const fresh = old.cloneNode(false); old.replaceWith(fresh); v === "land" ? tree(fresh, LAND, LAND_F) : tree(fresh, SH, SH_F); };
  draw("land"); bindSeg($("#rg-seg", el), (v) => { draw(v); });
}

// ================= 2. RPGT =================
export function rpgt(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 2 · Sessions 1.1–1.2</span><h2>RPGT calculator</h2>
    <p class="lead">Rate by Schedule 5 Part and year of disposal, Sch 4 exemption, the 3 / 5 / 7% retention and both deadlines — with the computation drawn out.</p></div>
    ${seg("rp-seg", [["land", "Land / property"], ["rpc", "RPC shares"]], "land", "Asset type")}
    <div class="grid two"><div><div class="card">${WARN}
      <div class="btns" style="margin:0 0 14px"><button class="btn ghost" data-pre="a2">Keluarga Tan · Asset 2</button><button class="btn ghost" data-pre="a3">Asset 3 · Wei Ming</button><button class="btn ghost" data-pre="s53">Sdn Bhd shop lot</button></div>
      ${fSel("rp-p", "Disposer", c.RPGT_PERSONS.map((p) => [p.id, `${p.label} — Part ${p.cat}`]), "partnership")}
      <div class="row2">${fDate("rp-ad", "Acquisition date", "2022-01-10", "SPA / transfer date")}${fDate("rp-dd", "Disposal date", "2026-03-20", "SPA date (para 15)")}</div>
      <div class="row2">${fMoney("rp-dp", "Disposal price", "1,000,000")}${fMoney("rp-dc", "Disposal costs", "20,000", "Agent, legal on sale")}</div>
      <div class="row2">${fMoney("rp-ap", "Acquisition price", "400,000", "Para 35(2) cost for a partnership")}${fMoney("rp-ac", "Acquisition costs", "12,000", "Legal, stamp duty on purchase")}</div>
      ${fMoney("rp-en", "Enhancement", "38,000", "Renovation, title defence — not quit rent, interest, repairs")}
    </div>
    </div>
    <div><div class="card result" id="rp-out"></div>
    <div class="card"><h3>RPC test — is it a real property company?</h3><p class="sub">Market value of land, not book value. Intangibles excluded.</p>
      ${fMoney("rc-l", "Land at market value", "8,000,000")}${fMoney("rc-s", "Shares in other RPCs (acquisition price)", "0")}${fMoney("rc-o", "Other tangible assets (cash, receivables, plant)", "2,000,000")}
      <div id="rc-out"></div>
      <h3 style="margin-top:14px">Deemed price — shares held when it became an RPC</h3><p class="sub">A ÷ B × C (para 34A(2)(a))</p>
      <div class="row2">${fNum("rc-a", "A · number of shares held", "300,000")}${fNum("rc-b", "B · total issued shares", "1,000,000")}</div>${fMoney("rc-c", "C · defined value at that date", "6,000,000")}<div id="rc-dp"></div>
    </div>
    </div></div>`;
  const P = { a2: ["partnership", "2022-01-10", "2026-03-20", 1000000, 20000, 400000, 12000, 38000, "land"], a3: ["citizen", "2023-06-15", "2026-08-01", 2400000, 15000, 601800, 0, 0, "rpc"], s53: ["company", "2021-03-05", "2026-06-10", 1350000, 36000, 800000, 28000, 60000, "land"] };
  const ids = ["rp-p", "rp-ad", "rp-dd", "rp-dp", "rp-dc", "rp-ap", "rp-ac", "rp-en"];
  let asset = "land";
  function run() {
    const g = (id) => $("#" + id, el).value;
    if (!g("rp-ad") || !g("rp-dd")) return;
    if (asset === "rpc" && ["company", "llp", "trust", "foreignco"].includes(g("rp-p"))) { $("#rp-out", el).innerHTML = `<div class="verdict info"><span class="bk-coin bk-coin--paper">!</span>Not RPGT — since 1 Jan 2024 a company, LLP, trust body or co-operative selling RPC shares is within CGT, not para 34A.</div><p>Use the CGT calculator: 10% of the gain, or 2% of gross for shares bought before 2024. e-CKM within 60 days, no retention.</p><div class="btns">${goBtn("cgt", "Open the CGT calculator")}</div>${auth("inforce", "ITA s.4(aa) · CGT Guidelines 2025 para 1.5 · CGT Q&A 2024 Q17")}`; refreshIcons(); return; }
    const r = c.rpgt({ person: g("rp-p"), asset, acqDate: g("rp-ad"), dispDate: g("rp-dd"), dispPrice: num(g("rp-dp")), dispCosts: num(g("rp-dc")), acqPrice: num(g("rp-ap")), acqCosts: num(g("rp-ac")), enhancement: num(g("rp-en")) });
    if (c.D(g("rp-dd")) <= c.D(g("rp-ad"))) { $("#rp-out", el).innerHTML = `<div class="verdict no">Disposal date must be after the acquisition date.</div>`; return; }
    const T = c.RPGT_TABLE[r.cat], years = (c.D(g("rp-dd")) - c.D(g("rp-ad"))) / (365.25 * 864e5);
    const tl = segbar([{ w: 3, color: C.coral100, label: T[0] + "%", sub: "Years 1–3" }, { w: 1, color: C.amber100, label: T[3] + "%", sub: "Year 4" }, { w: 1, color: C.amber100, label: T[4] + "%", sub: "Year 5" }, { w: 1.5, color: C.teal100, label: T[5] + "%", sub: "Year 6 +" }],
      { pos: Math.min(years, 6.4) / 6.5, label: `${r.yearLabel} · ${r.rate}%` }, { label: "Rate by year of disposal" });
    const steps = [{ label: "Disposal (net)", value: r.dispPriceNet, kind: "start" }, { label: "Cost + enhancement", value: r.acqPriceTotal, kind: "minus" }];
    if (r.sch4) steps.push({ label: "Sch 4", value: r.sch4, kind: "minus" });
    steps.push({ label: "Chargeable", value: r.chargeable, kind: "total" }, { label: `RPGT ${r.rate}%`, value: r.tax, kind: "tax" });
    const notes = [];
    if (r.loss) notes.push(asset === "rpc" ? "A loss on RPC shares (para 34A) is not an allowable loss — Sch 2 para 33(d)." : "Allowable loss — set it against RPGT gains (s.7).");
    if (r.person.id === "partnership") notes.push("No Sch 4 exemption for a partnership. Its cost is the partner's cost plus permitted expenses (para 35(2)), not market value at contribution.");
    if (r.cat === "I" && r.year >= 6) notes.push("0% — but still file e-CKHT within 60 days. Keep the private residence election (s.8) for a short-hold sale.");
    notes.push("From 1 Jan 2026 the acquirer remits the lesser of: full price, the retention %, or the deemed tax the disposer notifies before remittance.");
    $("#rp-out", el).innerHTML = `<span class="label">RPGT payable</span><div class="bk-hero-num">${c.rm(r.tax)}<span class="bk-unit">${r.rate}%</span></div>
      <div class="sub">Part ${r.cat} · ${r.yearLabel} · ${esc(r.person.label)}</div>${tl}
      <div class="kpis"><div class="kpi"><b>${c.rm(r.gain)}</b><span>Gain</span></div><div class="kpi"><b>${c.rm(r.sch4)}</b><span>Sch 4 exemption</span></div><div class="kpi"><b>${c.rm(r.retention)}</b><span>Buyer retains ${r.retPct}%</span></div>
      <div class="kpi"><b>${r.refundable ? c.rm(r.refundable) + " refund" : c.rm(r.balance)}</b><span>${r.refundable ? "Retention exceeds tax" : "Balance to pay"}</span></div></div>
      ${waterfall(steps, { label: "RPGT computation" })}
      <h3 style="margin-top:14px">Deadlines</h3><div class="clocks"><div class="clock soon"><span class="d">${c.fmtDate(r.returnDue)}</span><span class="w"><b>${r.form} + acquirer's e-CKHT 2A and retention</b> — 60 days</span></div><div class="clock"><span class="d">${c.fmtDate(r.payDue)}</span><span class="w"><b>RPGT payment</b> — 90 days, even if appealed</span></div></div>
      ${notes.map((n) => `<div class="note">${n}</div>`).join("")}${auth("inforce", r.authority)}<div class="btns" id="rp-btns"></div>`;
    const b = $("#rp-btns", el);
    b.append(copyBtn(() => `RPGT — ${r.person.label} (Part ${r.cat})\nAcquired ${g("rp-ad")} · disposed ${g("rp-dd")} · ${r.yearLabel}\nDisposal price net ${c.rm(r.dispPriceNet)}\nLess acquisition + costs + enhancement ${c.rm(r.acqPriceTotal)}\nGain ${c.rm(r.gain)}\nSch 4 exemption ${c.rm(r.sch4)}\nChargeable gain ${c.rm(r.chargeable)}\nRPGT @ ${r.rate}% ${c.rm(r.tax)}\nRetention ${r.retPct}% ${c.rm(r.retention)}\n${r.form} by ${c.fmtDate(r.returnDue)} · pay by ${c.fmtDate(r.payDue)}\nAuthority: ${r.authority}`), printBtn());
    refreshIcons();
  }
  function rpc() {
    const t = c.rpcTest(num($("#rc-l", el).value), num($("#rc-s", el).value), num($("#rc-o", el).value));
    $("#rc-out", el).innerHTML = `${gauge(t.ratio, 0.75, "RPC ratio")}<div class="verdict ${t.isRPC ? "no" : "ok"}">${t.isRPC ? "RPC — ratio at least 75%. Individuals and partnerships selling its shares pay RPGT under para 34A; companies, LLPs, trusts and co-ops pay CGT." : "Not an RPC at this test date."}</div><div class="sub">Status ends only on a disposal that takes the ratio below 75% — cash growth alone does not end it (para 34A(6) proviso).</div>`;
    $("#rc-dp", el).innerHTML = `<div class="kpi" style="margin-top:6px"><b>${c.rm(c.rpcDeemedPrice(num($("#rc-a", el).value), num($("#rc-b", el).value), num($("#rc-c", el).value)))}</b><span>Deemed acquisition price, at the date it became an RPC</span></div>`;
  }
  el.addEventListener("input", (e) => { if (e.target.id.startsWith("rc-")) rpc(); else run(); });
  el.addEventListener("change", run);
  bindSeg($("#rp-seg", el), (v) => { asset = v; run(); });
  $$("[data-pre]", el).forEach((b) => b.addEventListener("click", () => { const p = P[b.dataset.pre]; ids.forEach((id, k) => { $("#" + id, el).value = typeof p[k] === "number" ? p[k].toLocaleString("en-MY") : p[k]; });
    asset = p[8]; $$("#rp-seg button", el).forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === asset)); run(); }));
  run(); rpc();
}

// ================= 3. CGT =================
export function cgt(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 3 · Session 1.3</span><h2>CGT on unlisted shares</h2>
    <p class="lead">10% of the gain, or 2% of the gross price for shares bought before 1 Jan 2024 — see which wins, and why the line crosses at a 20% gain.</p></div>
    <div class="grid two"><div class="card">${WARN}
      <div class="btns" style="margin:0 0 14px"><button class="btn ghost" data-pre="a3">Asset 3 · Tan Holdings PLT</button><button class="btn ghost" data-pre="kc">KC3 · RM1m to RM3m</button></div>
      ${fSel("cg-p", "Disposer", c.CGT_PERSONS.map((p) => [p.id, p.label]), "llp")}
      <div class="row2">${fDate("cg-ad", "Acquisition date", "2023-06-15")}${fDate("cg-dd", "Disposal date", "2026-08-01")}</div>
      ${fMoney("cg-g", "Gross consideration", "2,400,000", "Cash plus money's worth — shareholder loans assumed count")}
      <div class="row2">${fMoney("cg-dc", "Disposal costs", "15,000", "Incidental costs of disposal and defending title")}${fMoney("cg-ap", "Acquisition price + costs", "501,500", "Include incidental costs of acquisition and enhancement")}</div>
      <div class="note">Connected persons, gifts or non-arm's-length: market value applies — LHDN accepts NTA (s.65E(8); Q&A Q12, Q23).</div></div>
    <div class="card result" id="cg-out"></div></div>`;
  const P = { a3: ["llp", "2018-01-01", "2026-08-01", 2400000, 15000, 501500], kc: ["company", "2019-05-01", "2026-05-01", 3000000, 0, 1000000] };
  function run() {
    const g = (id) => $("#" + id, el).value;
    const r = c.cgt({ person: g("cg-p"), acqDate: g("cg-ad"), dispDate: g("cg-dd"), consideration: num(g("cg-g")), dispCosts: num(g("cg-dc")), acqPrice: num(g("cg-ap")) });
    const out = $("#cg-out", el);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g("cg-ad")) || !/^\d{4}-\d{2}-\d{2}$/.test(g("cg-dd"))) { out.innerHTML = `<div class="verdict info">Enter both the acquisition date and the disposal date.</div>`; return; }
    if (!r.inside) { out.innerHTML = `<div class="verdict info"><span class="bk-coin bk-coin--paper">!</span>Outside CGT — individuals, sole proprietors and partnerships of individuals are not chargeable persons.</div><p>If the company is an RPC, the sale is RPGT under para 34A instead.</p><div class="btns">${goBtn("rpgt", "Check RPGT")}</div>${auth("inforce", "ITA s.4(aa) · CGT Guidelines 2025 para 4 · Q&A Q2")}`; refreshIcons(); return; }
    if (r.badDates) { out.innerHTML = `<div class="verdict no">Disposal date must be after the acquisition date.</div>`; return; }
    if (r.preCGT) { out.innerHTML = `<div class="verdict info">Disposal before 1 Jan 2024 — not within CGT (CGT applies to disposals from 1 Jan 2024).</div>${auth("inforce", "Finance (No. 2) Act 2023 · CGT Guidelines 2025 para 1.2")}`; return; }
    const gp = num(g("cg-g")), gainPct = gp > 0 ? Math.max(0, r.gain) / gp : 0;
    const bars = [{ label: "10% of gain", value: r.opt10, color: C.blue, pop: r.best === "10%" }];
    if (r.opt2 !== null) bars.push({ label: "2% of gross", value: r.opt2, color: C.teal, pop: r.best === "2%" });
    const pts10 = [], pts2 = []; for (let k = 0; k <= 60; k += 5) { pts10.push([k, k * 0.1]); pts2.push([k, 2]); }
    out.innerHTML = `${r.exemptWindow ? `<div class="verdict ok">Disposal 1 Jan – 29 Feb 2024 — exempt (P.U.(A) 410/2023).</div>` : ""}<span class="label">CGT payable</span><div class="bk-hero-num">${c.rm(r.tax)}<span class="bk-unit">${r.best}</span></div>
      <div class="sub">${r.preAcq ? "Acquired before 1 Jan 2024 — you may elect 2% of gross" : "Acquired on or after 1 Jan 2024 — 10% of chargeable income only"}</div>
      ${columns(bars, { label: "CGT options compared" })}
      ${r.opt2 !== null ? `<h3>Where the lines cross</h3><p class="sub">Tax as % of price. Your gain is <b>${pct(gainPct, 1)}</b> of the price — above 20%, elect 2%.</p>${lines([{ color: C.blue, points: pts10 }, { color: C.teal, points: pts2, dash: true }], { label: "Break-even chart", xfmt: (v) => v + "%", yfmt: (v) => v.toFixed(1) + "%", markers: [{ x: 20, label: "20% break-even", color: C.muted }, { x: Math.min(60, gainPct * 100), label: "You", color: C.coral }] })}<div class="legend"><span><i style="background:var(--bk-blue)"></i>10% of gain</span><span><i style="background:var(--bk-teal)"></i>2% of gross</span></div>` : ""}
      <div class="kpis"><div class="kpi"><b>${c.rm(r.gain)}</b><span>Gain</span></div><div class="kpi"><b>${r.due && !isNaN(r.due) ? c.fmtDate(r.due) : "—"}</b><span>e-CKM and payment — 60 days</span></div><div class="kpi"><b>None</b><span>Retention under CGT</span></div></div>
      <div class="note">Losses: same-year set-off against CGT gains, then 10 YAs — never against business income (s.65E(5)–(6)).</div>${auth("inforce", r.authority)}<div class="btns" id="cg-b"></div>`;
    $("#cg-b", el).append(copyBtn(() => `CGT — ${r.person.label}\nAcquired ${g("cg-ad")} · disposed ${g("cg-dd")}\nGain ${c.rm(r.gain)}\nOption 10% of gain ${c.rm(r.opt10)}${r.opt2 !== null ? `\nOption 2% of gross ${c.rm(r.opt2)}` : ""}\nCGT ${c.rm(r.tax)} (${r.best})\ne-CKM and payment by ${r.due && !isNaN(r.due) ? c.fmtDate(r.due) : "—"}\nAuthority: ${r.authority}`), printBtn());
    refreshIcons();
  }
  el.addEventListener("input", run); el.addEventListener("change", run);
  $$("[data-pre]", el).forEach((b) => b.addEventListener("click", () => { const p = P[b.dataset.pre]; ["cg-p", "cg-ad", "cg-dd", "cg-g", "cg-dc", "cg-ap"].forEach((id, k) => { $("#" + id, el).value = typeof p[k] === "number" ? p[k].toLocaleString("en-MY") : p[k]; }); run(); }));
  run();
}

// ================= 4. STAMP DUTY =================
export function stamp(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 4 · Session 1.4</span><h2>Stamp duty calculator</h2>
    <p class="lead">Property bands, reliefs, share transfers, loans and the s.47A late-stamping ladder — each drawn so you can see where the duty comes from.</p></div>
    ${seg("sd-seg", [["prop", "Property transfer"], ["shares", "Share transfer"], ["loan", "Loan"], ["late", "Late stamping"]], "prop", "Stamp duty topic")}
    <div id="sd-body"></div>`;
  const views = {
    prop: (body) => { body.innerHTML = `<div class="grid two"><div class="card">${WARN}${fMoney("sp-p", "Price", "1,000,000")}${fMoney("sp-m", "Market value", "0", "Duty on the greater of price or value")}
        ${fSel("sp-b", "Buyer", [["local", "Citizen / PR / Malaysian company"], ["foreign_res", "Foreign buyer — residential"], ["foreign_nonres", "Foreign buyer — non-residential"]], "local")}
        ${fSel("sp-r", "Relief", [["none", "No relief"], ["firsthome", "First home — citizen, up to RM500,000"], ["firsthome2027", "First home 2027–2030 (SD-01, proposed)"], ["family", "Parent–child / grandparent–grandchild (citizens)"], ["spouse", "Husband–wife gift"]], "none")}
        <div class="note">Stamp within 30 days of execution. Exemption and remission claims always go through formal assessment.</div></div><div class="card result" id="sp-out"></div></div>`;
      const run = () => { const r = c.stampProperty({ price: num($("#sp-p").value), mv: num($("#sp-m").value), buyer: $("#sp-b").value, relief: $("#sp-r").value });
        const parts = r.ladder.parts, cols = [C.blue100, C.teal100, C.amber100, C.coral100];
        const bar = $("#sp-b").value === "local" && parts.length ? segbar(parts.map((p, i) => ({ w: Math.max(p.amount, r.value * 0.06), color: cols[i], label: p.rate + "%", sub: c.rm(p.duty) })), null, { label: "Duty by band", h: 80 }) : "";
        const tag = $("#sp-r").value === "firsthome2027" ? "proposed" : "inforce";
        $("#sp-out").innerHTML = `<span class="label">Stamp duty payable</span><div class="bk-hero-num">${c.rm(r.payable)}</div><div class="sub">On ${c.rm(r.value)}${r.relief ? ` · relief ${c.rm(r.relief)}` : ""}</div>
          ${bar ? `<h3 style="margin-top:14px">How the value fills the bands</h3>${bar}` : ""}
          <table class="comp">${$("#sp-b").value === "local" ? parts.map((p) => `<tr><td>${c.rm(p.amount)} @ ${p.rate}%</td><td>${c.rm(p.duty)}</td></tr>`).join("") : ""}<tr><td>Duty</td><td>${c.rm(r.duty)}</td></tr>${r.relief ? `<tr><td>Less relief</td><td>(${c.rm(r.relief)})</td></tr>` : ""}<tr class="tot"><td>Payable</td><td>${c.rm(r.payable)}</td></tr></table>
          <div class="note">${esc(r.note)}</div>${auth(tag, r.authority)}<div class="btns" id="sp-b2"></div>`;
        $("#sp-b2").append(copyBtn(() => `Stamp duty — property transfer\nValue ${c.rm(r.value)}\nDuty ${c.rm(r.duty)}${r.relief ? `\nRelief ${c.rm(r.relief)}` : ""}\nPayable ${c.rm(r.payable)}\n${r.note}\nAuthority: ${r.authority}`)); refreshIcons(); };
      body.addEventListener("input", run); body.addEventListener("change", run); run(); },
    shares: (body) => { body.innerHTML = `<div class="grid two"><div class="card">${WARN}${fMoney("ss-p", "Price in the share sale agreement", "2,400,000")}${fMoney("ss-v", "Value — NTA with land at market value", "0", "LHDN charges on the higher")}
        <div class="note">RPC shares: 0.3% duty against up to 4% on the land — which is why para 34A brings the gain back into RPGT.</div></div><div class="card result" id="ss-out"></div></div>`;
      const run = () => { const r = c.stampShares(num($("#ss-p").value), num($("#ss-v").value)); const land = c.ladderProperty(r.base).duty;
        $("#ss-out").innerHTML = `<span class="label">Stamp duty — form DS2</span><div class="bk-hero-num">${c.rm(r.duty)}<span class="bk-unit">0.3%</span></div><div class="sub">On ${c.rm(r.base)} · paid by the buyer</div>
          ${columns([{ label: "Shares 0.3%", value: r.duty, color: C.teal, pop: true }, { label: "Same value as land", value: land, color: C.coral }], { label: "Shares vs land duty" })}${auth("inforce", r.authority)}`; };
      body.addEventListener("input", run); run(); },
    loan: (body) => { body.innerHTML = `<div class="grid two"><div class="card">${WARN}${fMoney("sl-a", "Loan amount", "650,100")}<div class="note">Hire purchase and Shariah goods financing: RM10 (from 1 Jan 2025). FX loans from Malaysian banks: cap RM2,000 / RM5,000 proposed (SD-04).</div></div><div class="card result" id="sl-out"></div></div>`;
      const run = () => { const r = c.stampLoan(num($("#sl-a").value)); $("#sl-out").innerHTML = `<span class="label">Loan agreement duty</span><div class="kpis"><div class="kpi"><b>${c.rm(r.now)}</b><span>Now — RM5 per RM1,000 or part</span></div><div class="kpi"><b>${c.rm(r.proposed, 2)}</b><span>From 1 Jan 2027 — exact 0.5% (LB-04)</span></div></div><div class="note">Time refinancings and new FX facilities for execution on or after 1 Jan 2027.</div>${auth("inforce", "Now: Stamp Act First Sch Item 27 — RM5 per RM1,000 or part")}${auth("proposed", "From 1 Jan 2027: exact 0.5% (Budget 2027 LB-04)")}`; };
      body.addEventListener("input", run); run(); },
    late: (body) => { body.innerHTML = `<div class="grid two"><div class="card">${fMoney("sk-d", "Duty", "10,000")}<div class="row2">${fDate("sk-e", "Execution date", "2026-03-01")}${fDate("sk-s", "Stamped on", "2026-06-15")}</div>
        <div class="note">Self-assessment offences: no return RM200–RM2,000 (s.72C); incorrect return — penalty equal to the duty undercharged (s.72D). The Collector may reduce or remit (s.47A(2)).</div></div><div class="card result" id="sk-out"></div></div>`;
      const run = () => { const e = $("#sk-e").value, s = $("#sk-s").value; if (!e || !s) return; const r = c.stampPenalty(num($("#sk-d").value), e, s);
        const span = (c.D(s) - c.D(e)) / 864e5, total = Math.max(span, 150);
        const bar = segbar([{ w: 30, color: C.teal100, label: "On time", sub: "Day 1–30" }, { w: (c.addMonths(r.due, 3) - r.due) / 864e5, color: C.amber100, label: "10% / RM50", sub: "Up to 3 months late" }, { w: Math.max(20, total - 30 - (c.addMonths(r.due, 3) - r.due) / 864e5), color: C.coral100, label: "20% / RM100", sub: "Later" }],
          { pos: Math.min(span, total) / total, label: `Stamped day ${Math.round(span)}` }, { label: "Late stamping ladder" });
        $("#sk-out").innerHTML = `<span class="label">Late stamping penalty</span><div class="bk-hero-num">${c.rm(r.penalty)}</div><div class="sub">${r.band} · due ${c.fmtDate(r.due)}</div>${bar}${auth("inforce", "Stamp Act 1949 s.47A(1) — from 1 Jan 2025")}`; };
      body.addEventListener("input", run); body.addEventListener("change", run); run(); },
  };
  const show = (v) => { const old = $("#sd-body", el); const fresh = old.cloneNode(false); old.replaceWith(fresh); views[v](fresh); refreshIcons(); };
  bindSeg($("#sd-seg", el), show);
  show("prop");
}
