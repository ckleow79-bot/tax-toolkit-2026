// Tabs 5–8 + home: e-Invoice · SVDP · Budget 2027 · Deadlines
import * as c from "./calc.js";
import { $, $$, h, esc, num, pct, icon, refreshIcons, WARN, auth, fMoney, fDate, fNum, fSel, fSw, swOn, bindSw, seg, bindSeg, segVal, copyBtn, printBtn, waterfall, columns, lines, segbar, tree, C, short, toast, cw } from "./ui.js";

// ================= HOME =================
export const TOOLS = [
  ["regime", "1", "git-branch", "blue", "Which regime?", "Income tax, RPGT, RPC rules or CGT — click through the tree"],
  ["rpgt", "2", "landmark", "teal", "RPGT calculator", "Rate, Sch 4, retention, deadlines + RPC 75% test"],
  ["cgt", "3", "trending-up", "violet", "CGT calculator", "10% of gain vs 2% of gross — see the crossover"],
  ["stamp", "4", "stamp", "amber", "Stamp duty", "Bands, reliefs, shares, loans, late penalty"],
  ["einv", "5", "receipt", "coral", "e-Invoice start & who issues", "RM3m floor, three tests, self-billing finder"],
  ["svdp", "6", "file-check-2", "teal", "SVDP filing helper", "Field sheet for every month, exposure, gap register"],
  ["budget", "7", "calculator", "violet", "Budget 2027", "MSME test, company and individual tax, payroll"],
  ["dates", "8", "calendar-clock", "blue", "Deadline calendar", "Every clock from one date"],
];
export function home(el) {
  el.innerHTML = `<div class="hero"><span class="bk-eyebrow"><span class="bk-chev"></span>KS Leow Tax Consultant · in-house training · 7 Nov 2026</span>
    <h1>Tax Compliance <span class="bk-marker">Toolkit</span> 2026</h1>
    <p class="lead" style="margin:0">Eight interactive tools that follow today's sessions — and stay on your phone for Monday. Plus live polls and questions during the day.</p></div>
    <div class="tiles"><button class="tile live" data-goto="live"><span class="ic" style="background:var(--bk-coral-100);color:var(--bk-coral)">${icon("radio")}</span><b>Join the live session</b><span>Knowledge checks, room checks and the question wall</span></button>
    ${TOOLS.map(([id, n, ic, col, t, s]) => `<button class="tile" data-goto="${id}"><span class="ic" style="background:var(--bk-${col}-100);color:var(--bk-${col === "amber" ? "warning" : col})">${icon(ic)}</span><b>${n} · ${t}</b><span>${s}</span></button>`).join("")}</div>
    <div class="card" style="margin-top:18px"><h3>How to use it</h3><ul class="bk-list"><li>Every result shows its authority line and a status tag — <span class="tag inforce">IN FORCE</span> <span class="tag guide">LHDN GUIDELINE</span> <span class="tag proposed">PROPOSED</span>.</li>
    <li>Tap <b>Copy result</b> to paste a computation into your working paper.</li><li>Inputs stay in this browser. Never type client names, IC numbers or TINs.</li><li>Training tool — always check the facts and the current law before advising.</li></ul></div>`;
}

// ================= 5. E-INVOICE =================
const W22 = [["1", "Sdn Bhd · FY2022 RM8m", { turnover: 8e6 }], ["2", "RM2m · 30% held by a RM50m company", { turnover: 2e6, testA: true }], ["3", "Sole prop · two shops RM1.8m + RM1.5m in YA2026", { turnover: 0, reachedYA: 2026 }],
  ["4", "LLP RM600k · same individual partners as a RM4m LLP", { turnover: 600000 }], ["5", "New subsidiary of a listed group · starts 1 Feb 2027", { turnover: 0, testB: true, commence: "2027-02-01" }], ["6", "Independent Sdn Bhd RM2.5m", { turnover: 2.5e6 }]];
const ITEMS = [
  ["Rent to an individual landlord not in business", "Tenant self-bills — transactional where a single payment exceeds RM10,000 (from 1 Jan 2026). A tenant still inside its relaxation period (e.g. Phase 4 to 31 Dec 2027) may consolidate.", "SG 8.3(f), 3.6.5(a), 16.2, Ex 14, Table 3.6 item 7 · FAQ Q62"],
  ["Utilities in the landlord's name, paid by the tenant", "Include them in the tenant's self-billed e-Invoice (landlord not in business)", "FAQ Q63"],
  ["Commission to a sales agent or dealer", "Payer self-bills — the agent issues nothing", "SG 9.4 · FAQ Q66"],
  ["Interest to the holding company (not a treasury centre)", "Payer self-bills", "SG 8.3(g), Ex 16"],
  ["Interest from a bank to the public", "The bank (lender) issues", "SG 8.3(g)(i)"],
  ["Single-tier dividend", "No e-Invoice", "GL 1.6.7 · SG 11.1.2"],
  ["Imported services (e.g. UK consultancy)", "Self-bill by end of the month after the earlier of payment or invoice — include service tax", "SG 10.4.7, 10.4.9 · FAQ Q38"],
  ["Imported goods", "Self-bill by end of the 2nd month after customs clearance", "SG 10.4 · FAQ Q38"],
  ["Purchases from an exempt small supplier", "No e-Invoice — keep the supplier's invoice; never self-bill", "FAQ Q27–Q28"],
  ["Refundable tenancy deposit received", "No e-Invoice", "FAQ Q57"],
  ["Group company pays our bill, we repay at cost", "No e-Invoice between the group companies", "SG Example 9"],
  ["Salary and EPF to employees", "No e-Invoice", "GL 1.6.7"],
];
export function einv(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 5 · Sessions 2.1–2.3</span><h2>e-Invoice — start date and who issues</h2>
    <p class="lead">Fix the start date from FY2022 turnover, the RM3m floor and the three anti-fragmentation tests. Then find who issues for any transaction.</p></div>
    ${seg("ei-seg", [["start", "Start date"], ["who", "Who issues?"]], "start")}<div id="ei-body"></div>`;
  const views = {
    start: (b) => { b.innerHTML = `<div class="grid two"><div class="card"><p class="sub" style="margin-top:0">Worksheet W2.2 — tap a client profile to load it</p><div class="field"><select id="ei-w"><option value="">Choose W2.2 profile…</option>${W22.map(([n, l]) => `<option value="${n}">#${n} · ${esc(l)}</option>`).join("")}</select></div><div class="sub" id="ei-wl"></div>
        ${fMoney("ei-t", "FY2022 turnover (audited, else YA2022 return)", "2,000,000", "Sole proprietor: add every business. Pro-rate a changed year-end. New business: enter 0.")}
        ${fSw("ei-a", "(a) Any non-individual shareholder with revenue ≥ RM3m?", true)}${fSw("ei-b", "(b) Subsidiary of a holding company with revenue ≥ RM3m?")}${fSw("ei-c", "(c) Related company or JV (20% or control) with revenue ≥ RM3m?")}
        ${fSel("ei-y", "Reached RM3m in a later YA?", [["", "No"], ["2023", "YA2023"], ["2024", "YA2024"], ["2025", "YA2025"], ["2026", "YA2026"], ["2027", "YA2027"]], "")}
        ${fDate("ei-cm", "Commencement date (new business only)", "")}</div><div class="card result" id="ei-out"></div></div>`;
      const run = () => {
        const i = { turnover: num($("#ei-t").value), testA: swOn($("#ei-a")), testB: swOn($("#ei-b")), testC: swOn($("#ei-c")), reachedYA: $("#ei-y").value ? +$("#ei-y").value : null, commence: $("#ei-cm").value || null };
        const r = c.einvStart(i);
        const steps = [["t", "Turnover"], ["testA", "Test (a)"], ["testB", "Test (b)"], ["testC", "Test (c)"], ["grow", "Later growth"]];
        const path = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0">${steps.map(([k, l]) => `<span class="tag ${r.path.includes(k) ? (r.path[r.path.length - 1] === k && !r.exempt ? "proposed" : "guide") : ""}" style="${r.path.includes(k) ? "" : "background:var(--surface-sunken);color:var(--text-muted)"}">${l}</span>`).join(`<span class="sub">›</span>`)}</div>`;
        // phase timeline
        const t0 = c.D("2024-07-01"), t1 = c.D("2028-04-01"), W = cw(), X = (d) => 20 + (c.D(d) - t0) / (t1 - t0) * (W - 40);
        const marks = [["2024-08-01", "P1"], ["2025-01-01", "P2"], ["2025-07-01", "P3"], ["2026-01-01", "P4"], ["2026-07-01", "Below RM3m"], ["2027-12-31", "Relax ends"]];
        let svg = `<line x1="20" x2="${W - 20}" y1="60" y2="60" stroke="var(--bk-n-200)" stroke-width="3"/>` + marks.map(([d, l], k) => `<circle cx="${X(d)}" cy="60" r="6" fill="${l === "Relax ends" ? "var(--bk-coral)" : "var(--bk-n-300)"}"/><text x="${X(d)}" y="${[80, 94, 80, 94, 106, 80][k]}" text-anchor="middle" font-size="11" fill="var(--text-muted)">${l}</text>`).join("");
        if (r.start) { const x = X(r.start); svg += `<rect x="${x - 58}" y="10" width="116" height="30" rx="8" fill="var(--bk-amber)" stroke="var(--bk-ink)" stroke-width="2.5"/><text x="${x}" y="30" text-anchor="middle" font-size="13" font-weight="800" fill="var(--bk-ink)">${c.fmtDate(c.D(r.start))}</text><line x1="${x}" x2="${x}" y1="40" y2="60" stroke="var(--bk-ink)" stroke-width="2.5"/><circle cx="${x}" cy="60" r="8" fill="var(--bk-ink)"/>`; }
        $("#ei-out").innerHTML = `<span class="label">${r.exempt ? "Result" : "Start date"}</span><div class="bk-hero-num" style="font-size:clamp(2rem,8vw,3.2rem)">${r.exempt ? "Exempt" : c.fmtDate(c.D(r.start))}</div>
          <div class="verdict ${r.exempt ? "ok" : "amber"}" style="margin-top:12px">${esc(r.why)}</div>${path}<svg class="viz" viewBox="0 0 ${W} 110" role="img" aria-label="Phase timeline">${svg}</svg>
          ${r.phase ? `<div class="kpis"><div class="kpi"><b>${r.phase.n <= 4 ? "Phase " + r.phase.n : "1 Jul 2026 cohort"}</b><span>${esc(r.phase.label)}</span></div><div class="kpi"><b>${esc(r.phase.relax)}</b><span>Relaxation period</span></div></div>` : ""}
          <div class="note">Once in, always in (FAQ Q104). A common individual shareholder or director does not make companies related. Run it on the owner's own businesses too.</div>
          ${auth("guide", "GL v4.8 paras 1.5, 1.6.1(e), 1.6.10(a)–(c) · FAQ Q12–Q20, Q100–Q104")}<div class="btns" id="ei-bb"></div>`;
        $("#ei-bb").append(copyBtn(() => `e-Invoice start date\nFY2022 turnover ${c.rm(i.turnover)} · tests a/b/c: ${i.testA ? "fail" : "pass"}/${i.testB ? "fail" : "pass"}/${i.testC ? "fail" : "pass"}\nResult: ${r.exempt ? "Exempt" : c.fmtDate(c.D(r.start))}\n${r.why}\nAuthority: GL v4.8 paras 1.5, 1.6.1(e), 1.6.10`)); refreshIcons();
      };
      bindSw(b, run); b.addEventListener("input", run); b.addEventListener("change", run);
      $("#ei-w").addEventListener("change", (ev) => { if (!ev.target.value) return; const w = W22.find((q) => q[0] === ev.target.value), p = w[2];
        $("#ei-wl").textContent = `Profile ${w[0]}: ${w[1]}`; $("#ei-t").value = (p.turnover || 0).toLocaleString("en-MY");
        $("#ei-a").setAttribute("aria-checked", !!p.testA); $("#ei-b").setAttribute("aria-checked", !!p.testB); $("#ei-c").setAttribute("aria-checked", !!p.testC);
        $("#ei-y").value = p.reachedYA ? String(p.reachedYA) : ""; $("#ei-cm").value = p.commence || ""; run(); });
      run(); },
    who: (b) => { b.innerHTML = `<div class="grid two"><div class="card" id="ei-tree"></div><div class="card"><h3>Quick finder — common transactions</h3><div class="field"><label for="ei-q">Pick a transaction</label><select id="ei-q">${ITEMS.map((it, k) => `<option value="${k}">${esc(it[0])}</option>`).join("")}</select></div><div id="ei-qa"></div></div></div>`;
      tree($("#ei-tree"), [
        { q: "Exempt item? Salary, single-tier dividend, zakat, listed shares, an individual's shares", yes: { title: "No e-Invoice", body: "Outside the e-Invoice scope.", auth: "GL v4.8 para 1.6.7", tag: "guide" }, no: "next" },
        { q: "Interest exception? Bank to public, staff loan, treasury centre, late charge, foreign payor", yes: { title: "The lender issues", body: "Not self-billed.", auth: "SG v4.9 para 8.3(g)(i)–(v)", tag: "guide" }, no: "next" },
        { q: "On the SG 8.3 list? Agent, foreign supplier, platform, individual not in business, interest, insurance claim, redemption", yes: { title: "Buyer self-bills", body: "The buyer issues the e-Invoice on the supplier's behalf and shares the validated copy with the supplier (SG 8.5).", auth: "SG v4.9 paras 8.3(a)–(i), 8.5", tag: "guide" }, no: "next" }],
        { title: "Supplier issues", body: "Not on the list — never self-bill (FAQ Q27–Q28).", auth: "FAQ Q27–Q28", tag: "guide" });
      const qa = () => { const it = ITEMS[+$("#ei-q").value]; $("#ei-qa").innerHTML = `<div class="verdict info" style="margin-top:4px">${esc(it[1])}</div>${auth("guide", it[2])}`; };
      $("#ei-q").addEventListener("change", qa); qa(); },
  };
  const show = (v) => { const old = $("#ei-body", el); const fresh = old.cloneNode(false); old.replaceWith(fresh); views[v](fresh); refreshIcons(); };
  bindSeg($("#ei-seg", el), show); show("start");
}

// ================= 6. SVDP =================
const LS = "tct26-gaps";
const loadGaps = () => { try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch (e) { return []; } };
const saveGaps = (g) => { try { localStorage.setItem(LS, JSON.stringify(g)); } catch (e) {} };
export function svdp(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 6 · Session 2.4 · W2.4</span><h2>SVDP filing helper</h2>
    <p class="lead">Pick the gap, set the months — get the field sheet for every month, the batch UTC timestamp, the exposure if nothing is done, and a gap register you can copy.</p></div>
    <div class="grid two"><div class="card">${WARN}
      ${fSel("sv-k", "What is the gap?", [["rent", "Rent to an individual landlord — never self-billed"], ["conso", "Monthly consolidated sales e-Invoice — never issued"], ["wrong", "e-Invoice issued with wrong data"]], "rent")}
      <div class="row2">${fDate("sv-st", "Client's e-Invoice start date", "2025-01-01", "Never back-date before this")}${fMoney("sv-a", "Amount per month", "12,000")}</div>
      <div class="row2"><div class="field"><label for="sv-f">First month</label><input id="sv-f" type="month" value="2025-07"></div><div class="field"><label for="sv-t">Last month</label><input id="sv-t" type="month" value="2026-08"></div></div>
      <div class="row2">${fNum("sv-d", "Day paid / transaction day", "1", "Rent: day the rent is paid (firm practice). 31 = last day of the month.")}${fSel("sv-tin", "Landlord's TIN", [["no", "Not given — MyKad only"], ["yes", "Given (IG…)"]], "no")}</div>
      <div class="note" id="sv-why"></div></div>
    <div><div class="card result" id="sv-out"></div><div class="card"><h3>Gap register</h3><div id="sv-reg"></div><div class="btns"><button class="btn" id="sv-add">${icon("plus")}Add this gap</button><button class="btn ghost" id="sv-csv">${icon("copy")}Copy as table</button><button class="btn ghost" id="sv-clr">${icon("trash-2")}Clear</button></div></div></div></div>`;
  let sel = 0;
  const months = () => { const f = $("#sv-f").value, t = $("#sv-t").value; if (!f || !t) return []; const out = []; let d = c.D(f + "-01"); const end = c.D(t + "-01"); while (d <= end && out.length < 60) { out.push(d); d = c.addMonths(d, 1); } return out; };
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const lab = (d) => `${MON[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  function sheet(kind, m, amt, day, tin) {
    const y = m.getUTCFullYear(), mo = m.getUTCMonth(), mm = String(mo + 1).padStart(2, "0"), yy = String(y).slice(2);
    if (kind === "rent") { const dd = c.iso(new Date(Date.UTC(y, mo, Math.min(day, new Date(Date.UTC(y, mo + 1, 0)).getUTCDate())))); return { date: dd, rows: [["Document type · version", "Self-billed Invoice · SVDP 1.3"], ["e-Invoice number", `SB-RENT-${yy}${mm}`], ["Date issued", `Override » ${c.fmtDate(c.D(dd))} — transaction date`], ["Supplier (landlord)", `NRIC · MyKad no. · TIN ${tin === "yes" ? "his IG… TIN" : "EI00000000010"}`], ["Supplier SST · MSIC · activity", "NA · 00000 · NA"], ["Buyer", "Client — from the profile"], ["Line", `036 Self-billed – Others · rent ${MON[mo]} ${y} · 1 × ${c.rm(amt)}`], ["Tax type", "06 Not applicable"], ["Batch issue date (UTC)", c.utcStamp(dd, "09:00")]] }; }
    if (kind === "conso") { const due = c.iso(new Date(Date.UTC(y, mo + 1, 7))); return { date: due, rows: [["Document type · version", "Invoice · SVDP 1.3"], ["e-Invoice number", `CONSO-${yy}${mm}`], ["Date issued", `Override » ${c.fmtDate(c.D(due))} — 7th of the next month, when it was due`], ["Buyer", "General Public · EI00000000010 · NA"], ["Line", `004 Consolidated e-Invoice · receipts for ${MON[mo]} ${y} (give the range) · ${c.rm(amt)}`], ["Rule", "One document per month — never a multi-month lump sum (SG 17.6)"], ["Batch issue date (UTC)", c.utcStamp(due, "09:00")]] }; }
    const dd = c.iso(new Date(Date.UTC(y, mo, Math.min(day, new Date(Date.UTC(y, mo + 1, 0)).getUTCDate()))));
    return { date: dd, rows: [["Step 1 — credit note", "Credit Note · SVDP 1.3 · today's date · search the original UUID · reverse every line in full"], ["Step 2 — reissue", `Invoice · SVDP 1.3 · back-dated to ${c.fmtDate(c.D(dd))} · correct data`], ["Bill reference", "Quote both UUIDs — original, then credit note"], ["Found within 72 hours?", "Cancel and reissue instead — no SVDP needed (GL 2.3.6)"], ["Batch issue date (UTC) — reissue", c.utcStamp(dd, "09:00")]] };
  }
  function run() {
    const kind = $("#sv-k").value, amt = num($("#sv-a").value), day = Math.max(1, Math.min(31, num($("#sv-d").value) || 1)), tin = $("#sv-tin").value, start = $("#sv-st").value ? c.D($("#sv-st").value) : null;
    const ms = months(); const gaps = ms.filter((m) => !start || c.addMonths(m, 1) > start);
    sel = Math.min(sel, Math.max(0, ms.length - 1));
    $("#sv-why").innerHTML = kind === "rent" ? "Self-billed by the tenant (SG 8.3(f); FAQ Q62). Jul–Dec 2025 could have been consolidated (SG 3.6.5(a)); from 1 Jan 2026 a single payment above RM10,000 must be issued on its own (Table 3.6 item 7) — one per month is permitted throughout." : kind === "conso" ? "Missed months: one consolidated e-Invoice per month, back-dated to when it was due (SG 17.6, Ex 23). After relaxation, transactions above RM10,000 need their own e-Invoice (Ex 24)." : "Wrong buyer details, amount or classification code: reverse with a note, then reissue in SVDP 1.3 (FAQ Q127, Q130; LHDN SPK 14 Oct 2026 Topic 2 slide 16).";
    if (!ms.length) { $("#sv-out").innerHTML = `<div class="verdict no">Set the first and last month.</div>`; return; }
    const ex = c.exposure(gaps.length), m = ms[sel], s = sheet(kind, m, amt, day, tin), before = start && c.addMonths(m, 1) <= start;
    $("#sv-out").innerHTML = `<span class="label">Months to disclose</span><div class="bk-hero-num">${gaps.length}<span class="bk-unit">documents</span></div>
      <div class="sub">Tap a month to see its field sheet. Red = gap · grey = before the start date.</div>
      <div class="months">${ms.map((d, k) => { const pre = start && c.addMonths(d, 1) <= start; return `<button data-k="${k}" class="${pre ? "" : "gap"} ${k === sel ? "sel" : ""}" ${pre ? 'style="opacity:.5"' : ""}>${lab(d)}</button>`; }).join("")}</div>
      ${before ? `<div class="verdict info">Before the client's start date — nothing to disclose for this month.</div>` : `<table class="sheet"><tr><th colspan="2">Field sheet — ${MON[m.getUTCMonth()]} ${m.getUTCFullYear()}</th></tr>${s.rows.map((r, k) => `<tr class="${/Date issued|version|UTC/.test(r[0]) ? "hl" : ""}"><td>${esc(r[0])}</td><td class="${/UTC/.test(r[0]) ? "mono" : ""}">${esc(r[1])}</td></tr>`).join("")}</table>`}
      <h3 style="margin-top:16px">Exposure if nothing is done</h3>
      ${(() => { const W = cw(), x0 = Math.max(4, ex.min / Math.max(ex.max, 1) * W); return `<svg class="viz" viewBox="0 0 ${W} 70" role="img" aria-label="Exposure range"><rect x="0" y="20" width="${W}" height="22" rx="11" fill="var(--bk-n-100)"/><rect x="${x0}" y="20" width="${W - x0}" height="22" rx="11" fill="var(--bk-coral)"/>
      <text class="mono" x="0" y="62" font-size="13" font-weight="700" fill="var(--text-strong)">${c.rm(ex.min)}</text><text class="mono" x="${W}" y="62" text-anchor="end" font-size="13" font-weight="700" fill="var(--text-strong)">${c.rm(ex.max)}</text><text x="${W / 2}" y="14" text-anchor="middle" font-size="12" fill="var(--text-muted)">${gaps.length} × RM200 to RM20,000</text></svg>`; })()}
      <div class="note">No penalty on a compliant disclosure (SG 17.3) — protection is lost if the SVDP e-Invoices are themselves wrong, or for fraud, wilful default or negligence (17.4). Window closes 31 Dec 2027.</div>
      ${auth("guide", "SG v4.9 paras 8.3(f), 17.1–17.6 · FAQ Q123–Q133 · HASiL notice 15 Oct 2026 (back-dating) · ITA s.120(1)(d)")}<div class="btns" id="sv-b"></div>`;
    $("#sv-b").append(copyBtn(() => `SVDP field sheet — ${MON[m.getUTCMonth()]} ${m.getUTCFullYear()}\n` + s.rows.map((r) => `${r[0]}: ${r[1]}`).join("\n") + `\nMonths to disclose: ${gaps.length} · exposure ${c.rm(ex.min)}–${c.rm(ex.max)}`), printBtn());
    $$(".months button", el).forEach((b) => b.addEventListener("click", () => { sel = +b.dataset.k; run(); }));
    refreshIcons();
  }
  function reg() {
    const g = loadGaps();
    $("#sv-reg").innerHTML = g.length ? `<table class="sheet"><tr><th>Gap</th><th>What · months · count · route</th></tr>${g.map((x, k) => `<tr><td>G${k + 1}</td><td>${esc(x.what)}<br><span class="sub">${esc(x.months)} · ${x.count} · ${esc(x.route)}</span></td></tr>`).join("")}</table><div class="sub" style="margin-top:8px">Total ${g.reduce((a, x) => a + x.count, 0)} items · exposure ${c.rm(g.reduce((a, x) => a + x.count, 0) * 200)} to ${c.rm(g.reduce((a, x) => a + x.count, 0) * 20000)}</div>` : `<p class="sub">No gaps yet. Set up a gap above and tap “Add this gap”. Saved in this browser only.</p>`;
  }
  $("#sv-add", el).addEventListener("click", () => { const k = $("#sv-k"); const ms = months(), start = $("#sv-st").value ? c.D($("#sv-st").value) : null; const cnt = ms.filter((m) => !start || c.addMonths(m, 1) > start).length;
    const g = loadGaps(); g.push({ what: k.options[k.selectedIndex].text, months: `${$("#sv-f").value} to ${$("#sv-t").value}`, count: cnt, route: k.value === "wrong" ? "Note + SVDP reissue" : "SVDP 1.3, back-dated" }); saveGaps(g); reg(); toast("Added to the gap register"); });
  $("#sv-csv", el).addEventListener("click", async () => { const g = loadGaps(); const t = "Gap\tWhat\tMonths\tCount\tRoute\n" + g.map((x, k) => `G${k + 1}\t${x.what}\t${x.months}\t${x.count}\t${x.route}`).join("\n"); try { await navigator.clipboard.writeText(t); toast("Copied — paste into Excel"); } catch (e) { prompt("Copy:", t); } });
  $("#sv-clr", el).addEventListener("click", () => { saveGaps([]); reg(); });
  el.addEventListener("input", run); el.addEventListener("change", run);
  run(); reg();
}

// ================= 7. BUDGET 2027 =================
export function budget(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 7 · Session 3</span><h2>Budget 2027 — what it means for the client</h2>
    <p class="lead">Every figure here is <span class="tag proposed">PROPOSED</span> until the Finance Act is gazetted. Use it for planning conversations, not filing.</p></div>
    ${seg("bg-seg", [["msme", "MSME test"], ["co", "Company tax"], ["ind", "Individual tax"], ["pay", "Payroll"]], "msme")}<div id="bg-body"></div>`;
  const views = {
    msme: (b) => { b.innerHTML = `<div class="grid two"><div class="card">${fSw("ms-r", "Resident, and incorporated (company) or registered (LLP) in Malaysia", true)}
        ${fMoney("ms-c", "Paid-up capital (LLP: contribution) at the start of the basis period", "1,000,000")}${fMoney("ms-g", "Gross business income for the basis period", "12,000,000")}
        ${fSw("ms-l", "More than 50% link with a related company whose capital exceeds RM2.5m (any of the 3 limbs)")}${fNum("ms-f", "% held by foreign companies or non-citizen individuals", "10", "Exactly 20% still qualifies")}</div><div class="card result" id="ms-out"></div></div>`;
      const run = () => { const r = c.msme({ resident: swOn($("#ms-r")), capital: num($("#ms-c").value), gbi: num($("#ms-g").value), related: swOn($("#ms-l")), foreignPct: num($("#ms-f").value) });
        const tests = [["Resident · incorporated / registered", swOn($("#ms-r"))], ["Capital ≤ RM2.5m", num($("#ms-c").value) <= 2.5e6], ["Gross business income ≤ RM50m", num($("#ms-g").value) <= 50e6], ["No >50% related-company link", !swOn($("#ms-l"))], ["Foreign ≤ 20%", num($("#ms-f").value) <= 20]];
        $("#ms-out").innerHTML = `<div class="verdict ${r.isMSME ? "ok" : "no"}"><span class="bk-coin ${r.isMSME ? "" : "bk-coin--paper"}">${r.isMSME ? "✓" : "✗"}</span>${r.isMSME ? "MSME — 15% / 17% now · 14% / 16% from YA2027 (proposed)" : "Not an MSME — 24% flat"}</div>
          <div class="tree">${tests.map(([t, ok], k) => `<div class="tq ${ok ? "done" : ""}"><span class="bk-coin ${ok ? "bk-coin--blue" : "bk-coin--paper"}">${k + 1}</span><div><div class="q" style="color:${ok ? "var(--text-strong)" : "var(--bk-danger)"}">${t} ${ok ? "" : "— fails"}</div></div></div>`).join("")}</div>
          <div class="note">Tested every basis period. The minimum-wage exemption uses a different test — sales below RM50m.</div>${auth("inforce", r.authority)}`; };
      bindSw(b, run); b.addEventListener("input", run); run(); },
    co: (b) => { b.innerHTML = `<div class="grid two"><div class="card">${fMoney("co-ci", "Chargeable income", "600,000")}${fSw("co-m", "MSME (passes para 2A)", true)}<div class="note">Re-run the YA2027 CP204 on the new bands only if the client accepts the risk — otherwise revise in month 6 (CP204A in months 6, 9, 11).</div></div><div class="card result" id="co-out"></div></div>`;
      const run = () => { const ci = num($("#co-ci").value), m = swOn($("#co-m")); const a = c.coTax(ci, m, 2026).tax, z = c.coTax(ci, m, 2027).tax;
        const pts = []; for (let x = 0; x <= 1e6; x += 50000) pts.push([x, c.coTax(x, true, 2026).tax - c.coTax(x, true, 2027).tax]);
        $("#co-out").innerHTML = `<span class="label">Saving YA2027 vs YA2026</span><div class="bk-hero-num">${c.rm(a - z)}</div><div class="sub">${m ? "MSME bands 14% / 16% (proposed)" : "Non-MSME — 24% unchanged"}</div>
          ${columns([{ label: "YA2026", value: a, color: C.n200 }, { label: "YA2027", value: z, color: C.blue, pop: true }], { label: "Company tax compared" })}
          ${m ? `<h3>The saving caps at RM6,000</h3>${lines([{ color: C.teal, points: pts }], { label: "Saving by chargeable income", markers: [{ x: 600000, label: "RM600k cap", color: C.muted }], dots: [{ x: Math.min(ci, 1e6), y: Math.min(6000, c.coTax(Math.min(ci, 1e6), true, 2026).tax - c.coTax(Math.min(ci, 1e6), true, 2027).tax), color: C.coral }] })}` : ""}
          ${auth("proposed", "ITA Sch 1 para 2A · Lampiran 11 (CT-01)")}`; };
      bindSw(b, run); b.addEventListener("input", run); run(); },
    ind: (b) => { b.innerHTML = `<div class="grid two"><div class="card">${fMoney("in-ci", "Chargeable income (before the extra RM3,000 self relief)", "120,000")}<div class="note">YA2027 (proposed): 18% for RM70,001–100,000, new 24% band to RM150,000, and 30% from RM1m instead of RM2m. Self relief RM9,000 → RM12,000. Before rebates.</div></div><div class="card result" id="in-out"></div></div>`;
      const be = c.breakEven();
      const run = () => { const ci = num($("#in-ci").value), r = c.indCompare(ci); const pts = []; for (let x = 0; x <= 2.5e6; x += 25000) pts.push([x, c.indCompare(x).diff]);
        $("#in-out").innerHTML = `<span class="label">${r.diff >= 0 ? "Saves" : "Pays more"}</span><div class="bk-hero-num" style="color:${r.diff >= 0 ? "var(--bk-success)" : "var(--bk-danger)"}">${c.rm(Math.abs(r.diff))}</div>
          <div class="kpis"><div class="kpi"><b>${c.rm(r.t26)}</b><span>YA2026 tax</span></div><div class="kpi"><b>${c.rm(r.t27)}</b><span>YA2027 tax (proposed)</span></div><div class="kpi"><b>~${c.rm(Math.round(be / 1000) * 1000)}</b><span>Break-even</span></div></div>
          ${lines([{ color: C.blue, points: pts }], { label: "Saving by income", markers: [{ x: be, label: "Break-even ~RM1.085m", color: C.coral }], dots: [{ x: Math.min(ci, 2.5e6), y: c.indCompare(Math.min(ci, 2.5e6)).diff, color: C.ink }] })}
          <div class="legend"><span>Above zero = saves · below zero = pays more</span></div>
          ${ci > be ? `<div class="note">Above the break-even: review bonus and director-fee timing — remuneration received by 31 Dec 2026 is taxed at YA2026 bands (s.25).</div>` : ""}${auth("proposed", r.authority)}<div class="btns" id="in-b"></div>`;
        $("#in-b").append(copyBtn(() => `Individual — chargeable income ${c.rm(ci)}\nYA2026 tax ${c.rm(r.t26)}\nYA2027 tax (proposed, with +RM3,000 relief) ${c.rm(r.t27)}\nDifference ${r.diff >= 0 ? "saves" : "pays more"} ${c.rm(Math.abs(r.diff))}\nAuthority: ${r.authority}`)); refreshIcons(); };
      b.addEventListener("input", run); run(); },
    pay: (b) => { b.innerHTML = `<div class="grid two"><div class="card">${fNum("py-w", "Workers on minimum wage", "50")}${fNum("py-m", "Months in 2027 at RM2,000 (June to December = 7)", "7")}${fSw("py-x", "MSME with sales below RM50m (exempted)")}<div class="note">RM1,700 → RM2,000 from June 2027. Employer EPF 13% assumed (local, under 60). SOCSO / EIS extra.</div></div><div class="card result" id="py-out"></div></div>`;
      const run = () => { const ex = swOn($("#py-x")), r = c.payroll(num($("#py-w").value), num($("#py-m").value));
        $("#py-out").innerHTML = ex ? `<div class="verdict ok">Exempted for now — MSME with sales below RM50m. Review when the exemption ends.</div>${auth("proposed", "Speech para 32 · Act 732")}` :
          `<span class="label">Extra cost in 2027</span><div class="bk-hero-num">${c.rm(r.total)}</div>${waterfall([{ label: "Extra wages", value: r.wages, kind: "start" }, { label: "Employer EPF 13%", value: r.epf, kind: "tax" }], { label: "Payroll cost" })}
          <div class="kpis"><div class="kpi"><b>${c.rm(r.fullYear)}</b><span>Full year (12 months)</span></div><div class="kpi"><b>${c.rm(Math.round(r.total * 0.24))}</b><span>Tax relief at 24% (approx.)</span></div></div>${auth("proposed", "Speech para 32 · National Wages Consultative Council Act 2011 (Act 732)")}`; };
      bindSw(b, run); b.addEventListener("input", run); run(); },
  };
  const show = (v) => { const old = $("#bg-body", el); const fresh = old.cloneNode(false); old.replaceWith(fresh); views[v](fresh); refreshIcons(); };
  bindSeg($("#bg-seg", el), show); show("msme");
}

// ================= 8. DEADLINES =================
const CAL = [["2026-12-01", "YA2027 CP204 due (31 Dec year-end) — decide whether to estimate on the proposed MSME rates", "Companies", "inforce"],
  ["2026-12-31", "TAeF 3.0 — unaccepted appointment offers lapse", "Firm and clients", "guide"], ["2026-12-31", "Current ACA window for QCE ends · HNWI income timing (s.25)", "All", "inforce"],
  ["2027-01-01", "Tax-agent appointments electronic only (TAeF 3.0, s.152A(3B))", "All", "inforce"], ["2027-01-01", "Stamp duty self-assessment Phase 2 — property transfers", "Conveyancing", "inforce"],
  ["2027-01-01", "e-Notices served in MyTax · platform e-Invoice measures", "All", "proposed"], ["2027-06-01", "Minimum wage RM2,000 (non-exempt employers)", "Employers", "proposed"],
  ["2027-12-31", "e-Invoice relaxation and SVDP end", "All", "guide"], ["2028-01-01", "Stamp duty self-assessment Phase 3 — all other instruments", "All", "inforce"],
  ["2028-01-01", "Cashless salary rule (YA2028, non-MSME)", "Employers", "proposed"]];
export function dates(el) {
  const today = c.iso(new Date());
  el.innerHTML = `<div class="head"><span class="bk-eyebrow"><span class="bk-chev"></span>Tool 8 · all sessions</span><h2>Deadline calendar</h2><p class="lead">Enter one date — see every clock that starts from it, and how many days are left.</p></div>
    <div class="grid two"><div class="card">${fSel("dl-e", "What happened?", [["prop", "Disposal of land (SPA signed)"], ["rpc", "Disposal of RPC shares by an individual"], ["cgt", "Disposal of unlisted shares by a company / LLP"], ["stamp", "Instrument executed (stamp duty)"]], "prop")}
      ${fDate("dl-d", "Date", "2026-03-20")}${fDate("dl-t", "Today (for days left)", today)}</div><div class="card result" id="dl-out"></div></div>
    <div class="card"><h3>Compliance calendar 2026 – 2028</h3><div class="clocks">${CAL.map(([d, w, who, t]) => `<div class="clock ${c.D(d) < c.D(today) ? "past" : ""}"><span class="d">${c.fmtDate(c.D(d))}</span><span class="w"><b>${esc(w)}</b> · ${who} <span class="tag ${t}">${{ inforce: "IN FORCE", proposed: "PROPOSED", guide: "LHDN GUIDELINE" }[t]}</span></span></div>`).join("")}</div><div class="sub" style="margin-top:8px">Tags per item: IN FORCE = law or gazetted · LHDN GUIDELINE = LHDN position · PROPOSED = Budget 2027, not yet law.</div>${auth("inforce", "ITA s.107C(2), s.152A(3B) · Stamp Act ss.35A, 36 (Act 863) · GL v4.8 · Budget 2027 (proposed items)")}</div>`;
  const run = () => { const e = $("#dl-e").value, d = $("#dl-d").value, t = $("#dl-t").value; if (!d || !t) return; const D0 = c.D(d), T = c.D(t);
    const clocks = { prop: [[30, "Stamp the transfer (buyer)"], [60, "e-CKHT 1A (disposer) + e-CKHT 2A and retention (acquirer)"], [90, "RPGT payment"]],
      rpc: [[30, "Stamp the share transfer (buyer, DS2)"], [60, "e-CKHT 1B (disposer) + e-CKHT 2A and retention (acquirer)"], [90, "RPGT payment"]],
      cgt: [[30, "Stamp the share transfer (buyer, DS2)"], [60, "e-CKM return and CGT payment"]], stamp: [[30, "Stamp the instrument — penalty from day 31"]] }[e];
    const items = clocks.map(([n, w]) => { const due = c.addDays(D0, n); return { due, w, n, left: Math.round((due - T) / 864e5) }; });
    if (e === "stamp") { const due = items[0].due; items.push({ due: c.addMonths(due, 3), w: "After this date the penalty rises to the higher of RM100 or 20%", n: null, left: Math.round((c.addMonths(due, 3) - T) / 864e5) }); }
    const W = cw(), maxD = Math.max(...items.map((i) => (i.due - D0) / 864e5)), X = (dd) => 30 + (dd / maxD) * (W - 80), tx = (T - D0) / 864e5;
    let svg = `<line x1="30" x2="${W - 50}" y1="50" y2="50" stroke="var(--bk-n-200)" stroke-width="4" stroke-linecap="round"/><circle cx="30" cy="50" r="7" fill="var(--bk-blue)"/><text x="30" y="80" font-size="12" font-weight="700" fill="var(--text-strong)">Day 0</text>`;
    items.forEach((i, k) => { const x = X((i.due - D0) / 864e5); svg += `<circle cx="${x}" cy="50" r="8" fill="${i.left < 0 ? "var(--bk-n-300)" : i.left <= 14 ? "var(--bk-coral)" : "var(--bk-amber)"}" stroke="var(--bk-ink)" stroke-width="2"/><text class="mono" x="${x}" y="${k % 2 ? 84 : 28}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-strong)">${i.n ? "Day " + i.n : "+3 mths"}</text>`; });
    if (tx >= 0 && tx <= maxD) svg += `<line x1="${X(tx)}" x2="${X(tx)}" y1="36" y2="64" stroke="var(--bk-ink)" stroke-width="3"/><text x="${X(tx)}" y="100" text-anchor="middle" font-size="11" fill="var(--text-muted)">today</text>`;
    $("#dl-out").innerHTML = `<svg class="viz" viewBox="0 0 ${W} 104" role="img" aria-label="Deadline timeline">${svg}</svg><div class="clocks" style="margin-top:12px">${items.map((i) => `<div class="clock ${i.left < 0 ? "past" : i.left <= 14 ? "soon" : ""}"><span class="d">${c.fmtDate(i.due)}</span><span class="w"><b>${esc(i.w)}</b><br><span class="sub">${i.left < 0 ? `${-i.left} days ago` : i.left === 0 ? "Today" : `${i.left} days left`}</span></span></div>`).join("")}</div>
      <div class="note">${e === "stamp" ? "The clock runs from the date the instrument is executed (or first received in Malaysia if executed abroad)." : "The clocks run from the disposal date — the agreement (SPA) date (para 15). Amend an RPGT return within 6 months. Under self-assessment the return is a deemed assessment."}</div>${auth("inforce", "RPGTA ss.13, 21B · Ops Guideline 2/2026 · ITA ss.65C, 103 · Stamp Act ss.36, 47A")}`; };
  el.addEventListener("input", run); el.addEventListener("change", run); run();
}
