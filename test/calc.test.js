import * as c from "../js/calc.js";
import { parseNum } from "../js/ui.js";
let pass = 0, fail = 0;
const eq = (name, got, exp) => { const ok = typeof exp === "number" ? Math.abs(got - exp) < 0.01 : got === exp; ok ? pass++ : fail++; console.log((ok ? "PASS " : "FAIL ") + name + " — got " + got + (ok ? "" : " expected " + exp)); };
// Keluarga Tan Asset 1 (slide 171)
let a1 = c.rpgt({ person: "citizen", acqDate: "2009-06-01", dispDate: "2026-02-05", dispPrice: 1500000, acqPrice: 300000, acqCosts: 9000 });
eq("A1 gain", a1.gain, 1191000); eq("A1 rate", a1.rate, 0); eq("A1 tax", a1.tax, 0); eq("A1 retention 3%", a1.retention, 45000); eq("A1 return due", c.iso(a1.returnDue), "2026-04-06");
// Asset 2 partnership
let a2 = c.rpgt({ person: "partnership", acqDate: "2022-01-10", dispDate: "2026-03-20", dispPrice: 1000000, dispCosts: 20000, acqPrice: 400000, acqCosts: 12000, enhancement: 38000 });
eq("A2 gain", a2.gain, 530000); eq("A2 sch4", a2.sch4, 0); eq("A2 year", a2.year, 5); eq("A2 rate", a2.rate, 15); eq("A2 tax", a2.tax, 79500); eq("A2 retention", a2.retention, 30000); eq("A2 balance", a2.balance, 49500);
eq("A2 return due", c.iso(a2.returnDue), "2026-05-19"); eq("A2 pay due", c.iso(a2.payDue), "2026-06-18");
// Asset 3 Wei Ming RPC shares
let a3 = c.rpgt({ person: "citizen", asset: "rpc", acqDate: "2023-06-15", dispDate: "2026-08-01", dispPrice: 2400000, dispCosts: 15000, acqPrice: 601800 });
eq("A3 gain", a3.gain, 1798200); eq("A3 sch4", a3.sch4, 179820); eq("A3 year", a3.year, 4); eq("A3 tax", a3.tax, 323676); eq("A3 costs ignored", a3.costsIgnored, 15000); eq("A3 retention", a3.retention, 72000);
eq("A3 return", c.iso(a3.returnDue), "2026-09-30"); eq("A3 pay", c.iso(a3.payDue), "2026-10-30"); eq("A3 form", a3.form, "e-CKHT 1B");
{ const lp = c.rpgt({ person: "citizen", asset: "land", acqDate: "2020-02-29", dispDate: "2023-03-01", dispPrice: 1e6, acqPrice: 5e5 }); eq("leap-day flag", lp.leapDay, true); }
eq("land keeps selling costs", c.rpgt({ person: "citizen", asset: "land", acqDate: "2020-01-01", dispDate: "2026-01-02", dispPrice: 1e6, dispCosts: 10000, acqPrice: 5e5 }).dispPriceNet, 990000);
// Slide 53 Sdn Bhd shop lot
let s53 = c.rpgt({ person: "company", acqDate: "2021-03-05", dispDate: "2026-06-10", dispPrice: 1350000, dispCosts: 36000, acqPrice: 800000, acqCosts: 28000, enhancement: 60000 });
eq("S53 gain", s53.gain, 426000); eq("S53 year6 rate", s53.rate, 10); eq("S53 tax", s53.tax, 42600); eq("S53 retention 3%", s53.retention, 40500);
// Sch 4 slide 40
let s40 = c.rpgt({ person: "citizen", acqDate: "2023-01-01", dispDate: "2026-06-01", dispPrice: 170000, acqPrice: 100000 });
eq("S40 sch4 floor", s40.sch4, 10000);
// Non-citizen RPC example (deck slide 162): gain 2m (RPC 20% cost 1m -> 3m), year 7, Part III 10% after 10% exemption = 180,000
let nc = c.rpgt({ person: "noncitizen", asset: "rpc", acqDate: "2020-01-15", dispDate: "2026-06-15", dispPrice: 3000000, acqPrice: 1000000 });
eq("NC tax", nc.tax, 180000); eq("NC retention 7%", nc.retPct, 7);
// Part II within 3 years retention 5%
eq("Part II yr3 retention", c.retentionRate("II", 3), 5); eq("Part III yr5 rate", c.rpgtRate("III", 5), 30);
eq("Anniversary boundary within 3y", c.holdingYear(c.D("2023-01-10"), c.D("2026-01-10")), 3);
// CGT Asset 3 LLP
let g3 = c.cgt({ person: "llp", acqDate: "2023-06-15", dispDate: "2026-08-01", consideration: 2400000, dispCosts: 15000, acqPrice: 501500 });
eq("CGT gain", g3.gain, 1883500); eq("CGT 10%", g3.opt10, 188350); eq("CGT 2%", g3.opt2, 48000); eq("CGT best", g3.best, "2%"); eq("CGT due", c.iso(g3.due), "2026-09-30");
let kc3 = c.cgt({ person: "company", acqDate: "2019-05-01", dispDate: "2026-05-01", consideration: 3000000, acqPrice: 1000000 });
eq("KC3 2%", kc3.opt2, 60000); eq("KC3 10%", kc3.opt10, 200000);
let post = c.cgt({ person: "company", acqDate: "2024-03-01", dispDate: "2026-05-01", consideration: 3000000, acqPrice: 1000000 });
eq("Post-2024 no 2%", post.opt2, null);
// Stamp duty
eq("SD RM1m", c.stampProperty({ price: 1000000, buyer: "local" }).payable, 24000);
eq("SD RM1.5m", c.stampProperty({ price: 1500000, buyer: "local" }).payable, 44000);
eq("SD RM1.8m", c.stampProperty({ price: 1800000, buyer: "local" }).payable, 56000);
eq("SD RM700k", c.stampProperty({ price: 700000, buyer: "local" }).payable, 15000);
eq("SD RM450k", c.stampProperty({ price: 450000, buyer: "local" }).payable, 8000);
eq("SD RM450k first home", c.stampProperty({ price: 450000, buyer: "local", relief: "firsthome" }).payable, 0);
eq("SD shares 2.4m", c.stampShares(2400000, 0).duty, 7200);
eq("SD loan now 650,100", c.stampLoan(650100).now, 3255); eq("SD loan proposed", c.stampLoan(650100).proposed, 3250.5);
let pen = c.stampPenalty(10000, "2026-03-01", "2026-06-15"); eq("KC4 penalty", pen.penalty, 1000); eq("KC4 due", c.iso(pen.due), "2026-03-31");
eq("Test Q penalty 20k", c.stampPenalty(20000, "2026-01-01", "2026-04-01").penalty, 2000);
// e-Invoice W2.2
eq("W2.2 #1", c.einvStart({ turnover: 8e6 }).start, "2025-07-01");
eq("W2.2 #2", c.einvStart({ turnover: 2e6, testA: true }).start, "2026-07-01");
eq("W2.2 #3", c.einvStart({ turnover: 0, reachedYA: 2026 }).start, "2028-01-01");
eq("W2.2 #4 exempt", c.einvStart({ turnover: 600000 }).exempt, true);
eq("W2.2 #5", c.einvStart({ turnover: 0, testB: true, commence: "2027-02-01" }).start, "2027-02-01");
eq("Phase 4", c.einvStart({ turnover: 3e6 }).phase.n, 4);
// SVDP
eq("UTC 1 Aug 2025 9am", c.utcStamp("2025-08-01", "09:00"), "2025-08-01T01:00:00Z");
eq("Exposure 14 max", c.exposure(14).max, 280000); eq("Exposure 14 min", c.exposure(14).min, 2800);
// Budget
eq("MSME 600k 2026", c.coTax(600000, true, 2026).tax, 99000); eq("MSME 600k 2027", c.coTax(600000, true, 2027).tax, 93000);
eq("MSME 100k saving", c.coTax(100000, true, 2026).tax - c.coTax(100000, true, 2027).tax, 1000);
eq("MSME 1m saving", c.coTax(1e6, true, 2026).tax - c.coTax(1e6, true, 2027).tax, 6000);
for (const [ci, a, b] of [[60000, 2600, 2270], [120000, 14400, 13180], [300000, 59400, 57850], [1200000, 304400, 306700], [2500000, 678400, 696700]]) { const r = c.indCompare(ci); eq("Ind " + ci + " 26", r.t26, a); eq("Ind " + ci + " 27", r.t27, b); }
const be = c.breakEven(); eq("Break-even ~1.085m (within 2k)", Math.abs(be - 1085000) < 2000, true); console.log("  break-even computed:", be);
eq("Payroll 50", c.payroll(50).total, 118650); eq("Payroll full yr", c.payroll(50).fullYear, 203400);
eq("MSME exactly 20% foreign passes", c.msme({ resident: true, capital: 1e6, gbi: 1e7, related: false, foreignPct: 20 }).isMSME, true);
eq("RPC 80%", c.rpcTest(800, 0, 200).isRPC, true); eq("RPC 70%", c.rpcTest(700, 0, 300).isRPC, false);
eq("RPC not controlled", c.rpcTest(800, 0, 200, false).isRPC, false);
{ const base = { person: "citizen", asset: "land", acqDate: "2015-01-01", dispDate: "2026-03-01", dispPrice: 1500000, dispCosts: 0, acqPrice: 300000 };
  eq("s.21B retention all cash = 3%", c.rpgt(base).retention, 45000);
  eq("s.21B retention capped by cash part", c.rpgt({ ...base, cash: 20000 }).retention, 20000);
  eq("Remit if deemed tax notified (0% disposal) = 0", c.rpgt(base).remitIfNotified, 0); }

// ---- UX round 5 Nov 2026 ----
// Money parsing
for (const [inp, exp] of [["850k", 850000], ["1.2m", 1200000], ["3.3 million", 3300000], ["RM 1,200,000.50", 1200000.5], ["1,000,000", 1000000], ["rm4.2 million", 4200000], ["2bn", 2e9]]) eq("parse " + inp, parseNum(inp, { money: true }).value, exp);
for (const inp of ["1e9", "abc", "😀", "-5", "20000000000", "12x"]) eq("reject " + inp, parseNum(inp, { money: true }).ok, false);
eq("blank is empty", parseNum("", { money: true }).empty, true);
eq("reject 1,2,3", parseNum("1,2,3", { money: true }).ok, false); eq("accept 1,250,000.50", parseNum("1,250,000.50", { money: true }).value, 1250000.5); eq("accept RM 1,200k", parseNum("RM 1,200k", { money: true }).value, 1200000);
eq("int check", parseNum("1.5", { int: true }).ok, false); eq("max check", parseNum("8", { max: 7 }).ok, false); eq("percent sign", parseNum("10%").value, 10);
// e-Invoice: empty turnover prompts, GL v4.8 para 1.5 new-business path
eq("einv blank turnover -> missing", c.einvStart({ turnover: null }).missing, true);
eq("einv blank turnover not exempt", !!c.einvStart({ turnover: null }).exempt, false);
eq("new biz 2027 >=3m -> 1 Jan 2029 (FAQ Q14(b))", c.einvStart({ turnover: 0, commence: "2027-03-15", firstYear: 4e6 }).start, "2029-01-01");
eq("new biz Mar 2026 >=3m -> 1 Jan 2028 (Warung Salima)", c.einvStart({ turnover: 0, commence: "2026-01-01", firstYear: 3.12e6 }).start, "2028-01-01");
eq("new biz 2026 -> GL 1.5 conflict note", /GL v4.8 para 1.5/.test(c.einvStart({ turnover: 0, commence: "2026-01-01", firstYear: 3.12e6 }).note || ""), true);
eq("new biz Sep 2026 >=3m -> 1 Jan 2028", c.einvStart({ turnover: 0, commence: "2026-09-01", firstYear: 5e6 }).start, "2028-01-01");
eq("new biz 2024 >=3m -> 1 Jul 2026", c.einvStart({ turnover: 0, commence: "2024-05-01", firstYear: 3.5e6 }).start, "2026-07-01");
eq("new biz 2027 <3m reached YA2028 -> 1 Jan 2030", c.einvStart({ turnover: 0, commence: "2027-03-15", firstYear: 1e6, reachedYA: 2028 }).start, "2030-01-01");
eq("new biz <3m never reached -> exempt", c.einvStart({ turnover: 0, commence: "2027-03-15", firstYear: 1e6 }).exempt, true);
eq("new biz >=3m no date -> missing", c.einvStart({ turnover: 0, firstYear: 4e6 }).missing, true);
eq("tests off by default: RM1.8m -> exempt", c.einvStart({ turnover: 1.8e6 }).exempt, true);
// SVDP month range
{ const r = c.svdpMonths("2026-01", "2027-03", "2025-01-01", "2026-11-05"); eq("SVDP excludes future months", r.count, 11); eq("SVDP future count", r.future, 4); }
eq("SVDP reversed", c.svdpMonths("2026-08", "2025-07", null, "2026-11-05").reversed, true);
{ const r = c.svdpMonths("2019-01", "2026-10", null, "2026-11-05"); eq("SVDP 60 cap", r.capped, true); eq("SVDP 60 count", r.count, 60); }
eq("SVDP before start not counted", c.svdpMonths("2024-11", "2025-02", "2025-01-15", "2026-11-05").count, 2);
{ const r = c.svdpMonths("2020-01", "2026-11", "2025-01-01", "2026-11-10"); eq("SVDP cap ignores pre-start months", r.count, 23); eq("SVDP skipped", r.skipped, 60); eq("SVDP not capped", r.capped, false); }
// RPC ratio display and headroom
{ const t = c.rpcTest(7499, 0, 2501); eq("RPC 74.99% shown 74.99", t.pct2, 74.99); eq("RPC 74.99% not RPC", t.isRPC, false); }
{ const t = c.rpcTest(749999, 0, 250001); eq("RPC 74.9999% truncates to 74.99", t.pct2, 74.99); }
eq("RPC headroom 700/300 -> 200", c.rpcTest(700, 0, 300).headroom, 200); eq("RPC margin 800/200 -> 200", c.rpcTest(800, 0, 200).headroom, 200);
eq("RPC all zero -> empty", c.rpcTest(0, 0, 0).empty, true);
eq("Deemed B=0 error", !!c.rpcDeemed(1, 0, 5).error, true); eq("Deemed A>B error", !!c.rpcDeemed(5, 2, 5).error, true); eq("Deemed all zero error", !!c.rpcDeemed(0, 0, 0).error, true);
eq("Deemed 300k/1m x 6m", c.rpcDeemed(300000, 1000000, 6000000).price, 1800000);
// CGT loss: no 2% election, no tax
{ const l = c.cgt({ person: "company", acqDate: "2020-01-01", dispDate: "2026-05-01", consideration: 800000, acqPrice: 1000000 }); eq("CGT loss tax 0", l.tax, 0); eq("CGT loss best not 2%", l.best, "10%"); eq("CGT loss flag", l.loss, true); }
eq("CGT authority para 15 (rate) + 16", /para 15 \(rate\), para 16/.test(c.cgt({ person: "company", acqDate: "2020-01-01", dispDate: "2026-05-01", consideration: 1, acqPrice: 0 }).authority), true);
// MSME: sole proprietor / partnership
eq("MSME sole prop -> not company", c.msme({ form: "soleprop", resident: true, capital: 0, gbi: 1e6, related: false, foreignPct: 0 }).notCompany, true);
eq("MSME partnership -> not company", c.msme({ form: "partnership", resident: true, capital: 0, gbi: 1e6, related: false, foreignPct: 0 }).notCompany, true);
eq("Co tax 120k YA2026", c.coTax(120000, true, 2026).tax, 18000); eq("Co tax 120k YA2027", c.coTax(120000, true, 2027).tax, 16800);
// Dates and money formatting safety
eq("D year 0050 stays 50", c.D("0050-06-01").getUTCFullYear(), 50); eq("rm NaN -> dash", c.rm(NaN), "—"); eq("rm Infinity -> dash", c.rm(Infinity), "—");
// e-Invoice new-business guard (review E1)
const nb = (o) => c.einvStart({ testA: false, testB: false, testC: false, reachedYA: null, ...o });
eq("NB: FY2022 revenue -> first-year ignored (exempt)", nb({ turnover: 2e6, firstYear: 4e6, commence: "2024-03-01" }).exempt, true);
eq("NB: FY2022 revenue -> note shown", !!nb({ turnover: 2e6, firstYear: 4e6, commence: "2024-03-01" }).note, true);
eq("NB: commenced 2022 -> note shown", !!nb({ turnover: 0, firstYear: 4e6, commence: "2022-12-31" }).note, true);
eq("NB: commenced 1 Feb 2027, RM4m, passes tests -> 1 Jan 2029", nb({ turnover: 0, firstYear: 4e6, commence: "2027-02-01" }).start, "2029-01-01");
eq("NB: reached RM3m YA2028 -> 1 Jan 2030", nb({ turnover: 0, firstYear: 1e6, commence: "2027-02-01", reachedYA: 2028 }).start, "2030-01-01");
{ const fs = await import("node:fs"); const src = ["js/ui.js", "js/tabs1.js", "js/tabs2.js", "js/calc.js"].map((f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8")).join("\n");
  eq("as-at date is interpolated, not literal", /"[^"`\n]*\$\{AS_AT\}/.test(src), false); }
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
