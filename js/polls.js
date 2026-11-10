// Live polls — knowledge checks follow deck slides 73, 96, 142, 158 (MASTER v8) (answers per the deck). `a` = index of the correct option; null = opinion poll.
export const POLLS = [
  { id: "open", group: "Opening", q: "Which of these lands on your desk most often?", o: ["RPGT on property", "CGT on shares", "Stamp duty", "e-Invoice"], a: null },
  { id: "kc1-1", group: "KC1 · RPGT", q: "A partnership sells a shop lot in year 5. Rate?", o: ["20% — Part II", "15% — Part I (the partnership is the disposer)", "0% — the partners are individuals", "30% — Part III"], a: 1, why: "Sch 5 Part I · Sch 2 para 35" },
  { id: "kc1-2", group: "KC1 · RPGT", q: "Mr Lim transfers land to his own company for shares. When are his shares acquired?", o: ["When he first bought the land", "On the transfer date — para 34 shares", "When the company was incorporated", "When he later sells the shares"], a: 1, why: "RPGTA Sch 2 para 34" },
  { id: "kc1-3", group: "KC1 · RPGT", q: "From 1 Jan 2026, what must the acquirer remit?", o: ["Always 3% of the price", "The lowest of: the cash paid, 3/5/7% of the price, or the deemed tax notified (if notified before payment)", "Nothing if the disposer is a citizen", "10% of the price"], a: 1, why: "RPGTA s.21B(1), (1D) · Ops Guideline 2/2026" },
  { id: "kc2-1", group: "KC2 · RPC", q: "Is the 75% test done on book value or market value of land?", o: ["Book value", "Market value — 'defined value'", "Original cost", "Whichever is lower"], a: 1, why: "RPGTA Sch 2 para 34A(6)" },
  { id: "kc2-2", group: "KC2 · RPC", q: "Cash grows and the ratio falls to 70% with no disposal. Still an RPC?", o: ["No — it stops at once", "Yes — status ends only on a disposal that takes it below 75%", "Only if the ratio stays down for a year", "Only with LHDN approval"], a: 1, why: "RPGTA Sch 2 para 34A(6) proviso" },
  { id: "kc2-3", group: "KC2 · RPC", q: "A Sdn Bhd sells shares in an RPC in 2026. Which tax?", o: ["RPGT Part II", "CGT under ITA s.4(aa) — e-CKM", "Business income", "No tax"], a: 1, why: "CGT Guidelines (21 Sep 2026) para 1.5" },
  { id: "kc3-1", group: "KC3 · CGT", q: "A sole proprietor sells unlisted shares at a gain. CGT?", o: ["Yes — 10% of the gain", "No — individuals, including sole props, are outside CGT", "Yes — 2% of the price", "Only if held under 5 years"], a: 1, why: "ITA s.4(aa)" },
  { id: "kc3-2", group: "KC3 · CGT", q: "Shares bought 2019 for RM1m, sold 2026 for RM3m. Which option gives the lower tax?", o: ["10% of the RM2m gain = RM200,000", "2% of RM3m = RM60,000", "24% of the gain", "Exempt"], a: 1, why: "ITA Sch 1 Part XXI" },
  { id: "kc3-3", group: "KC3 · CGT", q: "Foreign gain exempt under P.U.(A) 75/2024 — report it?", o: ["No — exempt means no reporting", "Yes — in Form C as exempt income", "Only if above RM1m", "Report it in e-CKM"], a: 1, why: "CGT Q&A 2024 Q31" },
  { id: "kc4-1", group: "KC4 · Stamp duty", q: "Shop lot sold to a citizen for RM1.0m. Transfer duty?", o: ["RM40,000", "RM24,000", "RM30,000", "RM10,000"], a: 1, why: "Stamp Act First Sch Item 32(a)" },
  { id: "kc4-2", group: "KC4 · Stamp duty", q: "Land moves between two sister companies, both 95% held by HoldCo. Relief?", o: ["s.15 reconstruction relief", "s.15A — apply to the Collector; clawback if association ends within 2 years", "Automatic exemption, no application", "No relief available"], a: 1, why: "Stamp Act s.15A" },
  { id: "kc4-3", group: "KC4 · Stamp duty", q: "SPA signed 1 Mar, stamped 15 Jun, duty RM10,000. Penalty?", o: ["RM50", "RM1,000", "RM2,000", "Nil"], a: 1, why: "Stamp Act s.47A(1)" },
  { id: "svdp-1", group: "W2.4 · SVDP", q: "August 2025 rent, paid on 1 Aug 2025, filed today under the SVDP. Which version and issue date?", o: ["v1.1 · today's date", "SVDP 1.3 · back-dated to 1 Aug 2025", "SVDP 1.3 · today's date", "v1.0 · 31 Aug 2025"], a: 1, why: "SG 17.5 (versions) · LHDN SDK update, mid-Oct 2026 (back-dating)" },
  { id: "rc-1", group: "Room check", q: "Session 1 — property and capital gains. How are you feeling?", o: ["Got it", "Mostly — a few gaps", "Need a recap"], a: null },
  { id: "rc-2", group: "Room check", q: "Session 2 — e-Invoice and SVDP. How are you feeling?", o: ["Got it", "Mostly — a few gaps", "Need a recap"], a: null },
  { id: "rc-3", group: "Room check", q: "Session 3 — Budget 2027. How are you feeling?", o: ["Got it", "Mostly — a few gaps", "Need a recap"], a: null },
];
export const pollById = (id) => POLLS.find((p) => p.id === id);

// Vary the position of the correct answer (deterministic, same for presenter and participants).
for (const p of POLLS) {
  if (p.a === null) continue;
  let hsh = 0; for (const ch of p.id) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
  const k = hsh % p.o.length; p.o = p.o.slice(k).concat(p.o.slice(0, k)); p.a = (p.a - k + p.o.length) % p.o.length;
}
