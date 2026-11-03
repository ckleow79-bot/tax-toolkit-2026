// Tax Compliance Toolkit 2026 — calculation engine (pure functions, no DOM).
// Position as at 7 Nov 2026. Every rule mirrors the training deck; authority in each result.

export const AS_AT = "7 Nov 2026";

// ---------- dates ----------
export const D = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const iso = (dt) => dt.toISOString().slice(0, 10);
export const addDays = (dt, n) => new Date(dt.getTime() + n * 86400000);
export const addYears = (dt, n) => { const r = new Date(dt.getTime()); r.setUTCFullYear(r.getUTCFullYear() + n); return r; };
export const addMonths = (dt, n) => { const r = new Date(dt.getTime()); const day = r.getUTCDate(); r.setUTCDate(1); r.setUTCMonth(r.getUTCMonth() + n);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate(); r.setUTCDate(Math.min(day, last)); return r; };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (dt) => `${dt.getUTCDate()} ${MON[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
export const rm = (n, dp = 0) => (n < 0 ? "(" : "") + "RM" + Math.abs(n).toLocaleString("en-MY", { minimumFractionDigits: dp, maximumFractionDigits: dp }) + (n < 0 ? ")" : "");
const r2 = (n) => Math.round(n * 100) / 100;

// ---------- RPGT ----------
export const RPGT_PERSONS = [
  { id: "citizen", label: "Malaysian citizen or PR individual", cat: "I", individual: true },
  { id: "soleprop", label: "Sole proprietor (taxed as the individual)", cat: "I", individual: true },
  { id: "partnership", label: "Partnership (the partnership is the disposer)", cat: "I", individual: false },
  { id: "estate_cit", label: "Executor of a citizen / PR estate", cat: "I", individual: false },
  { id: "company", label: "Company incorporated in Malaysia", cat: "II", individual: false },
  { id: "llp", label: "LLP or co-operative", cat: "II", individual: false },
  { id: "trust", label: "Trustee of a trust", cat: "II", individual: false },
  { id: "society", label: "Society registered under the Societies Act", cat: "II", individual: false },
  { id: "noncitizen", label: "Non-citizen, non-PR individual", cat: "III", individual: true },
  { id: "estate_non", label: "Executor of a non-citizen estate", cat: "III", individual: false },
  { id: "foreignco", label: "Company not incorporated in Malaysia", cat: "III", individual: false },
];
export const RPGT_TABLE = { // Sch 5 from 1 Jan 2022
  I: [30, 30, 30, 20, 15, 0], II: [30, 30, 30, 20, 15, 10], III: [30, 30, 30, 30, 30, 10] };

/** Year of disposal counted from acquisition: disposal on or before the nth anniversary = within n years. */
export function holdingYear(acq, disp) {
  let k = 0; while (addYears(acq, k + 1) < disp) k++;
  return k + 1; // 1-based
}
export const rpgtRate = (cat, year) => RPGT_TABLE[cat][Math.min(year, 6) - 1];
export const retentionRate = (cat, year) => (cat === "I" ? 3 : cat === "II" ? (year <= 3 ? 5 : 3) : 7);
export const yearLabel = (y) => (y <= 3 ? "Within 3 years" : y === 4 ? "4th year" : y === 5 ? "5th year" : `${y}th year (6th year onwards)`);

export function rpgt(i) {
  const p = RPGT_PERSONS.find((x) => x.id === i.person);
  const acq = D(i.acqDate), disp = D(i.dispDate);
  const year = holdingYear(acq, disp);
  const dispPrice = i.dispPrice - (i.dispCosts || 0);
  const acqPrice = i.acqPrice + (i.acqCosts || 0) + (i.enhancement || 0);
  const gain = dispPrice - acqPrice;
  const sch4 = p.individual && gain > 0 ? Math.min(gain, Math.max(10000, r2(gain * 0.1))) : 0;
  const chargeable = Math.max(0, gain - sch4);
  const rate = rpgtRate(p.cat, year);
  const tax = r2(chargeable * rate / 100);
  const retPct = retentionRate(p.cat, year);
  const cash = i.cash === undefined || i.cash === null || isNaN(i.cash) ? i.dispPrice : i.cash;
  const retention = r2(Math.min(cash, i.dispPrice * retPct / 100)); // s.21B(1): lower of the whole of the money (cash part) and the %
  return {
    person: p, cat: p.cat, year, yearLabel: yearLabel(year), dispPriceNet: dispPrice, acqPriceTotal: acqPrice, gain, sch4, chargeable, rate, tax,
    retPct, retention, remitIfNotified: r2(Math.min(retention, tax)), balance: r2(tax - Math.min(tax, retention)), refundable: r2(Math.max(0, retention - tax)),
    returnDue: addDays(disp, 60), payDue: addDays(disp, 90),
    form: i.asset === "rpc" ? "e-CKHT 1B" : "e-CKHT 1A", loss: gain < 0,
    authority: "RPGTA Sch 2 paras 4–7, Sch 4 para 2, Sch 5 Part " + p.cat + ", s.21B · Ops Guideline 2/2026",
  };
}

// ---------- RPC ----------
export function rpcTest(landMV, rpcShares, otherTangible, controlled = true) {
  const defined = landMV + rpcShares, total = defined + otherTangible;
  const ratio = total > 0 ? defined / total : 0;
  return { defined, total, ratio, controlled, isRPC: controlled && ratio >= 0.75, authority: "RPGTA Sch 2 para 34A(6) — a controlled company; market value of land, intangibles excluded" };
}
export const rpcDeemedPrice = (A, B, C) => (B > 0 ? r2(A / B * C) : 0);

// ---------- CGT ----------
export const CGT_PERSONS = [
  { id: "company", label: "Company (resident or foreign)", inside: true },
  { id: "llp", label: "LLP", inside: true }, { id: "trust", label: "Trust body", inside: true },
  { id: "coop", label: "Co-operative society", inside: true },
  { id: "individual", label: "Individual / sole proprietor", inside: false },
  { id: "partnership", label: "Partnership of individuals", inside: false },
];
export function cgt(i) {
  const p = CGT_PERSONS.find((x) => x.id === i.person);
  const acq = D(i.acqDate), disp = D(i.dispDate);
  const badDates = disp <= acq, preCGT = disp < D("2024-01-01");
  const preAcq = acq < D("2024-01-01");
  const exemptWindow = disp >= D("2024-01-01") && disp <= D("2024-02-29");
  const dispPrice = i.consideration - (i.dispCosts || 0);
  const gain = dispPrice - (i.acqPrice + (i.acqCosts || 0));
  const opt10 = r2(Math.max(0, gain) * 0.10);
  const opt2 = preAcq ? r2(i.consideration * 0.02) : null;
  const best = opt2 !== null && opt2 < opt10 ? "2%" : "10%";
  return {
    person: p, inside: p.inside, preAcq, exemptWindow, badDates, preCGT, gain, opt10, opt2, best, tax: exemptWindow || preCGT || badDates ? 0 : (best === "2%" ? opt2 : opt10),
    breakEvenGain: r2(i.consideration * 0.2), due: addDays(disp, 60),
    authority: "ITA s.4(aa), s.65E, Sch 1 Part XXI · CGT Guidelines 2025 para 15",
  };
}

// ---------- Stamp duty ----------
export function ladderProperty(value) { // Item 32(a): per RM100 or part
  const v = Math.ceil(value / 100) * 100;
  const bands = [[100000, 1], [400000, 2], [500000, 3], [Infinity, 4]];
  let left = v, duty = 0; const parts = [];
  for (const [w, r] of bands) { const a = Math.min(left, w); if (a <= 0) break; duty += a * r / 100; parts.push({ amount: a, rate: r, duty: a * r / 100 }); left -= a; }
  return { value: v, duty, parts };
}
export function stampProperty(i) {
  const value = Math.max(i.price || 0, i.mv || 0);
  const lad = ladderProperty(value);
  let duty = lad.duty, note = "Ad valorem — Item 32(a), greater of price or market value", relief = 0;
  if (i.buyer === "foreign_res") { duty = Math.ceil(value / 100) * 100 * 0.08; note = "Foreign buyer, residential — flat 8% (from 1 Jan 2026)"; }
  else if (i.buyer === "foreign_nonres") { duty = Math.ceil(value / 100) * 100 * 0.04; note = "Foreign buyer, non-residential — flat 4% (from 1 Jan 2024)"; }
  else if (i.relief === "firsthome" && value <= 500000) { relief = duty; note = "First home, citizen, up to RM500,000 — 100% exempt (gazetted to SPAs by 31 Dec 2027; LHDN proposes cutting to 31 Dec 2026)"; }
  else if (i.relief === "firsthome2027" && value <= 750000) {
    const first = ladderProperty(Math.min(value, 500000)).duty; relief = first + (duty - first) * 0.5;
    note = "First home 2027–2030 (SD-01, PROPOSED): first RM500,000 exempt, 50% on the balance up to RM750,000"; }
  else if (i.relief === "family") { const first = ladderProperty(Math.min(value, 1000000)).duty; relief = first + (duty - first) * 0.5;
    note = "Parent–child / grandparent–grandchild (citizens): first RM1m exempt, 50% remission on the balance"; }
  else if (i.relief === "spouse") { relief = duty; note = "Husband–wife transfer by way of gift — exempt"; }
  else if (i.relief === "firsthome" || i.relief === "firsthome2027") note += " · relief not available above the price cap";
  return { value, ladder: lad, duty, relief, payable: Math.max(0, duty - relief), note, authority: "Stamp Act 1949 First Sch Item 32(a) · reliefs per orders under s.80" };
}
export const stampShares = (price, value) => { const base = Math.max(price || 0, value || 0); return { base, duty: Math.ceil(base / 1000) * 3, authority: "Stamp Act First Sch Item 32(b) — RM3 per RM1,000 or part, greater of price or value (NTA, land at MV)" }; };
export const stampLoan = (amt) => ({ now: Math.ceil(amt / 1000) * 5, proposed: r2(amt * 0.005), authority: "Item 27 — RM5 per RM1,000 or part; Budget 2027 LB-04 exact 0.5% (PROPOSED from 1 Jan 2027)" });
export function stampPenalty(duty, exec, stamped) {
  const due = addDays(D(exec), 30), s = D(stamped);
  if (s <= due || duty <= 0) return { due, late: s > due, penalty: 0, band: s <= due ? "On time" : "No duty — no penalty" };
  const within3 = s <= addMonths(due, 3);
  return { due, late: true, band: within3 ? "Up to 3 months late" : "More than 3 months late",
    penalty: within3 ? Math.max(50, r2(duty * 0.1)) : Math.max(100, r2(duty * 0.2)), authority: "Stamp Act s.47A(1) (from 1 Jan 2025)" };
}

// ---------- e-Invoice start date ----------
export const PHASES = [
  { n: 1, label: "More than RM100m", start: "2024-08-01", relax: "Ended 31 Jan 2025" },
  { n: 2, label: "More than RM25m – RM100m", start: "2025-01-01", relax: "Ended 30 Jun 2025" },
  { n: 3, label: "More than RM5m – RM25m", start: "2025-07-01", relax: "Ended 31 Dec 2025" },
  { n: 4, label: "From RM3m up to RM5m", start: "2026-01-01", relax: "To 31 Dec 2027" },
  { n: 5, label: "Below RM3m — not exempt", start: "2026-07-01", relax: "To 31 Dec 2027" },
];
/** i: {turnover, testA, testB, testC, reachedYA (number|null), commence (iso|null)} */
export function einvStart(i) {
  const steps = [];
  const later = (a, b) => (b && D(b) > D(a) ? b : a);
  if (i.turnover !== null && i.turnover > 100e6) return { phase: PHASES[0], start: PHASES[0].start, why: "FY2022 turnover above RM100m — Phase 1", path: ["t"] };
  if (i.turnover !== null && i.turnover > 25e6) return { phase: PHASES[1], start: PHASES[1].start, why: "FY2022 turnover above RM25m up to RM100m — Phase 2", path: ["t"] };
  if (i.turnover !== null && i.turnover > 5e6) return { phase: PHASES[2], start: PHASES[2].start, why: "FY2022 turnover above RM5m up to RM25m — Phase 3", path: ["t"] };
  if (i.turnover !== null && i.turnover >= 3e6) return { phase: PHASES[3], start: PHASES[3].start, why: "FY2022 turnover from RM3m up to RM5m — Phase 4", path: ["t"] };
  steps.push("t");
  for (const [k, lab] of [["testA", "test (a) — a non-individual shareholder with revenue of RM3m or more"], ["testB", "test (b) — subsidiary of a holding company with RM3m or more"], ["testC", "test (c) — related company or JV (20% or control) with RM3m or more"]]) {
    steps.push(k);
    if (i[k]) { const s = later("2026-07-01", i.commence); return { phase: PHASES[4], start: s, why: `Below RM3m but fails ${lab} — 1 Jul 2026, or commencement if later`, path: steps }; }
  }
  steps.push("grow");
  if (i.reachedYA) {
    if (i.reachedYA <= 2025) return { phase: PHASES[4], start: "2026-07-01", why: `Reached RM3m in YA${i.reachedYA} (YA2023–YA2025) — 1 Jul 2026`, path: steps };
    const s = `${i.reachedYA + 2}-01-01`;
    return { phase: null, start: s, why: `Reached RM3m in YA${i.reachedYA} — 1 January of the second year after: ${fmtDate(D(s))}`, path: steps };
  }
  return { phase: null, start: null, exempt: true, why: "Below RM3m and passes all three tests — exempt; may stop issuing, no application (FAQ Q15–Q20)", path: steps };
}

// ---------- SVDP ----------
export function utcStamp(isoDate, hhmm = "09:00") { // MYT = UTC+8
  const [h, m] = hhmm.split(":").map(Number); const dt = new Date(D(isoDate).getTime() + (h * 60 + m - 480) * 60000);
  return dt.toISOString().replace(".000Z", "Z");
}
export const exposure = (count) => ({ min: count * 200, max: count * 20000, authority: "ITA s.120(1)(d) — fine RM200 to RM20,000, or up to 6 months' imprisonment, or both, per offence" });

// ---------- Budget 2027 ----------
export function msme(i) {
  const fails = [];
  if (!i.resident) fails.push("Not resident / not incorporated or registered in Malaysia (PR 8/2025 para 5.2)");
  if (i.capital > 2.5e6) fails.push("Paid-up capital above RM2.5m at the start of the basis period (5.3.1)");
  if (i.gbi > 50e6) fails.push("Gross business income above RM50m (5.3.2)");
  if (i.related) fails.push("More than 50% link with a related company whose capital exceeds RM2.5m (5.3.3(a))");
  if (i.foreignPct > 20) fails.push("More than 20% held by foreign companies or non-citizen individuals (5.3.3(b))");
  return { isMSME: fails.length === 0, fails, authority: "ITA Sch 1 Part I para 2A · PR 8/2025 paras 5.2–5.3.3" };
}
export function coTax(ci, isMSME, ya) {
  if (!isMSME) return { tax: r2(ci * 0.24), parts: [{ amount: ci, rate: 24 }] };
  const [r1, r2_] = ya === 2027 ? [14, 16] : [15, 17];
  const a = Math.min(ci, 150000), b = Math.min(Math.max(ci - 150000, 0), 450000), c = Math.max(ci - 600000, 0);
  return { tax: r2(a * r1 / 100 + b * r2_ / 100 + c * 0.24), parts: [{ amount: a, rate: r1 }, { amount: b, rate: r2_ }, { amount: c, rate: 24 }] };
}
export const IND_2026 = [[5000, 0], [15000, 1], [15000, 3], [15000, 6], [20000, 11], [30000, 19], [300000, 25], [200000, 26], [1400000, 28], [Infinity, 30]];
export const IND_2027 = [[5000, 0], [15000, 1], [15000, 3], [15000, 6], [20000, 11], [30000, 18], [50000, 24], [250000, 25], [200000, 26], [400000, 28], [Infinity, 30]];
export function indTax(ci, table) { let left = Math.max(0, ci), t = 0; for (const [w, r] of table) { const a = Math.min(left, w); if (a <= 0) break; t += a * r / 100; left -= a; } return r2(t); }
export function indCompare(ci) { // ci = chargeable income before the extra RM3,000 self relief
  const t26 = indTax(ci, IND_2026), t27 = indTax(ci - 3000, IND_2027);
  return { t26, t27, diff: r2(t26 - t27), authority: "ITA Sch 1 Part I · Lampiran 1–2 (PROPOSED) · before rebates" };
}
export function breakEven() { let lo = 400000, hi = 2000000; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (indCompare(m).diff > 0) lo = m; else hi = m; } return Math.round(lo); }
export function payroll(workers, months = 7, epf = 13, inc = 300) {
  const wages = workers * inc * months; const e = r2(wages * epf / 100);
  return { wages, epf: e, total: r2(wages + e), fullYear: r2(workers * inc * 12 * (1 + epf / 100)) };
}
