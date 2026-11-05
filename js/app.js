// Router and shell.
import { $, $$, h, icon, refreshIcons } from "./ui.js";
import { regime, rpgt, cgt, stamp } from "./tabs1.js";
import { home, einv, svdp, budget, dates, TOOLS } from "./tabs2.js";
import { live } from "./live.js";

// Home tile subtitles as the plain question each tool answers (shell copy; tool titles and order stay in tabs2.js).
const ASKS = {
  regime: "Is this sale income tax, RPGT or CGT?",
  rpgt: "How much RPGT does my client pay? Is the company an RPC?",
  cgt: "How much CGT on a share sale — 10% of the gain or 2% of the price?",
  stamp: "How much stamp duty — and what if it is stamped late?",
  einv: "When must my client start e-Invoicing, and who issues?",
  svdp: "Missed e-Invoices? What to file for each month under SVDP",
  budget: "What does Budget 2027 change for my SME client?",
  dates: "When is each return and payment due from this date?",
};
TOOLS.forEach((t) => { if (ASKS[t[0]]) t[5] = ASKS[t[0]]; });

function homeShell(el) {
  home(el);
  const lead = $(".hero .lead", el);
  if (lead) lead.insertAdjacentHTML("afterend", `<p class="start">New? Start with <a href="#regime">1 · Which regime</a>, then <a href="#rpgt">2 · RPGT</a>.</p><p>Use it to check your working — ask your senior before sending figures to a client.</p>`);
}

const BUILD = { home: homeShell, regime, rpgt, cgt, stamp, einv, svdp, budget, dates, live };
const built = new Set();
const nav = $("#nav");
nav.innerHTML = `<button role="tab" data-t="home"><span class="n">${icon("home")}</span>Home</button><button role="tab" class="live" data-t="live"><span class="dot"></span>Live</button>` +
  TOOLS.map(([id, n, , , t]) => `<button role="tab" data-t="${id}"><span class="n">${n}</span>${t.replace(" calculator", "").replace("e-Invoice start & who issues", "e-Invoice")}</button>`).join("");

// "← All tools" sits above every tool panel (the Home pill scrolls out of view in the nav).
const back = $("#back");

function show(id) {
  if (!Object.hasOwn(BUILD, id)) id = "home";
  $$(".tab").forEach((s) => s.classList.toggle("on", s.id === "t-" + id));
  $$("#nav button").forEach((b) => b.setAttribute("aria-selected", b.dataset.t === id));
  if (back) back.hidden = id === "home";
  if (!built.has(id)) { built.add(id); try { BUILD[id]($("#t-" + id)); } catch (e) { console.error(e); $("#t-" + id).innerHTML = `<div class="verdict no">This tool could not load. Please reload the page.</div>`; } }
  refreshIcons();
  const btn = $(`#nav button[data-t="${id}"]`); btn && btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
}
nav.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) location.hash = b.dataset.t; });
document.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (g) { location.hash = g.dataset.goto; window.scrollTo({ top: 0, behavior: "smooth" }); } });
window.addEventListener("hashchange", () => { show(location.hash.slice(1)); window.scrollTo({ top: 0 }); });
show(location.hash.slice(1) || "home");

// larger text toggle (remembered per browser) — scales the root font size, so every rem size grows
const big = $("#bigtext");
const root = document.documentElement;
const setBig = (on) => { root.classList.toggle("big", on); big.setAttribute("aria-pressed", on); try { localStorage.setItem("tct26-big", on ? "1" : "0"); } catch (e) {} };
try { setBig(localStorage.getItem("tct26-big") === "1"); } catch (e) {}
big.addEventListener("click", () => { setBig(!root.classList.contains("big")); window.dispatchEvent(new Event("resize")); });
$("#ver").textContent = " · v1.4";

// Offline: the service worker (registered in index.html) says when every file is saved; tell the user once.
if ("serviceWorker" in navigator) {
  const sw = navigator.serviceWorker;
  sw.addEventListener("message", (e) => {
    if (!e.data || e.data.type !== "tct26-offline-ready") return;
    try { if (localStorage.getItem("tct26-offline-told") === "1") return; localStorage.setItem("tct26-offline-told", "1"); } catch (err) { return; }
    const t = h(`<div class="toast" role="status">Saved for offline use — the eight tools now work without signal</div>`);
    document.body.appendChild(t); setTimeout(() => t.remove(), 6000);
  });
  try { sw.startMessages(); } catch (e) {}
  // ask the worker to fetch anything still missing from the offline copy (e.g. after a dropped first visit)
  sw.ready.then((reg) => reg.active && reg.active.postMessage({ type: "tct26-topup" })).catch(() => {});
}
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { const s = document.querySelector(".tab.on"); const i = s && s.querySelector("input"); i && i.dispatchEvent(new Event("input", { bubbles: true })); }, 250); });
import("./live.js").then((m) => m.watchLive()).catch(() => {});
