// Router and shell.
import { $, $$, icon, refreshIcons } from "./ui.js";
import { regime, rpgt, cgt, stamp } from "./tabs1.js";
import { home, einv, svdp, budget, dates, TOOLS } from "./tabs2.js";
import { live } from "./live.js";

const BUILD = { home, regime, rpgt, cgt, stamp, einv, svdp, budget, dates, live };
const built = new Set();
const nav = $("#nav");
nav.innerHTML = `<button role="tab" data-t="home"><span class="n">${icon("home")}</span>Home</button><button role="tab" class="live" data-t="live"><span class="dot"></span>Live</button>` +
  TOOLS.map(([id, n, , , t]) => `<button role="tab" data-t="${id}"><span class="n">${n}</span>${t.replace(" calculator", "").replace("e-Invoice start & who issues", "e-Invoice")}</button>`).join("");

function show(id) {
  if (!Object.hasOwn(BUILD, id)) id = "home";
  $$(".tab").forEach((s) => s.classList.toggle("on", s.id === "t-" + id));
  $$("#nav button").forEach((b) => b.setAttribute("aria-selected", b.dataset.t === id));
  if (!built.has(id)) { built.add(id); try { BUILD[id]($("#t-" + id)); } catch (e) { console.error(e); $("#t-" + id).innerHTML = `<div class="verdict no">This tool could not load. Please reload the page.</div>`; } }
  refreshIcons();
  const btn = $(`#nav button[data-t="${id}"]`); btn && btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
}
nav.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) location.hash = b.dataset.t; });
document.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (g) { location.hash = g.dataset.goto; window.scrollTo({ top: 0, behavior: "smooth" }); } });
window.addEventListener("hashchange", () => show(location.hash.slice(1)));
show(location.hash.slice(1) || "home");

// larger text toggle (remembered per browser)
const big = $("#bigtext");
const setBig = (on) => { document.body.classList.toggle("big", on); big.setAttribute("aria-pressed", on); try { localStorage.setItem("tct26-big", on ? "1" : "0"); } catch (e) {} };
try { setBig(localStorage.getItem("tct26-big") === "1"); } catch (e) {}
big.addEventListener("click", () => setBig(!document.body.classList.contains("big")));
$("#ver").textContent = " · v1.3";
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { const s = document.querySelector(".tab.on"); const i = s && s.querySelector("input"); i && i.dispatchEvent(new Event("input", { bubbles: true })); }, 250); });
