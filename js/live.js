// Live session — participant side. Anonymous sign-in; answers and questions carry no names.
import { fb } from "./firebase.js";
import { pollById } from "./polls.js";
import { $, $$, esc, icon, refreshIcons, toast } from "./ui.js";

const L = "ABCD", MAX = 240, DRAFT = "tct26-qdraft", MINE = "tct26-myq";
// Knowledge-check group → the tool that works the same point (shown after Reveal).
const TOOL = { KC1: ["rpgt", "RPGT calculator"], KC2: ["rpgt", "RPC 75% test in the RPGT tool"], KC3: ["cgt", "CGT calculator"], KC4: ["stamp", "Stamp duty tool"], "W2.4": ["svdp", "SVDP filing helper"] };
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

// Plain words instead of raw error codes.
function plain(e) {
  const c = String((e && e.code) || "");
  if (!navigator.onLine || /unavailable|deadline|network/i.test(c)) return "no signal";
  if (c === "permission-denied") return "not allowed right now";
  if (c === "resource-exhausted") return "the live service is busy";
  return "something went wrong";
}
// Question text: drop zero-width and bidi-control characters (RTL/LTR overrides etc.), collapse spaces.
const INVIS = /[­؜᠎​-‏‪-‮⁠-⁤⁦-⁯﻿]/g;
export const cleanQ = (t) => String(t || "").replace(INVIS, "").replace(/\s+/g, " ").trim();
export const hasWords = (t) => t.length >= 3 && /[\p{L}\p{N}]/u.test(t);
const norm = (t) => cleanQ(t).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
// Soft check only — a nudge, not a block.
export const looksLikeClient = (t) =>
  /\b(sdn\.?\s*bhd|bhd|berhad|plt|llp)\b/i.test(t) ||
  /\b(mr|mrs|ms|mdm|madam|encik|puan|cik|tuan|dato'?|datuk|en\.|pn\.)\s+[a-z]{2,}/i.test(t) ||
  /(^|\D)\d{6}-?\d{2}-?\d{4}(\D|$)/.test(t);

// One anonymous sign-in shared by the Live tab and the global watcher (waits for a saved session first,
// so a reload keeps the same anonymous ID and the phone still sees its own vote).
let anonP = null;
function ensureAnon(F) {
  if (!anonP) anonP = (async () => {
    const { auth, A } = F;
    if (auth.authStateReady) await Promise.race([auth.authStateReady(), new Promise((r) => setTimeout(r, 4000))]);
    if (!auth.currentUser) await A.signInAnonymously(auth);
    return auth.currentUser.uid;
  })().catch((e) => { anonP = null; throw e; });
  return anonP;
}

// Styles for live-only states (disabled buttons, banners, pills, the poll-open cue). Tokens only.
function css() {
  if (document.getElementById("lv-css")) return;
  const s = document.createElement("style"); s.id = "lv-css";
  s.textContent = `
#t-live .btn:disabled{background:var(--surface-sunken);color:var(--text-muted);border:var(--bw-base) solid var(--border-base);cursor:not-allowed;transform:none;box-shadow:none}
#t-live textarea{width:100%}
#t-live .vote:disabled:not([aria-pressed="true"]){opacity:.4;cursor:not-allowed}
.lv-note{background:var(--bk-blue-100);color:var(--text-strong);border-radius:var(--r-sm);padding:10px 12px;font-size:var(--fs-sm);font-weight:600;margin:8px 0}
.lv-note:empty{display:none}
.lv-off{background:var(--bk-amber-100);color:var(--text-strong);border-radius:var(--r-md);padding:12px 14px;font-weight:600;margin-bottom:14px}
.lv-row{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-top:6px}
.lv-count{font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--text-muted);white-space:nowrap}
.lv-count.near{color:var(--bk-warning);font-weight:700}
.lv-pill{display:inline-flex;align-items:center;gap:4px;background:var(--bk-success-100);color:var(--text-strong);border:1.5px solid var(--bk-success);border-radius:var(--r-pill);padding:2px 10px;font-size:13px;font-weight:700;margin-right:6px}
.lv-ok{display:inline-block;background:var(--bk-success);color:#fff;border-radius:var(--r-pill);padding:1px 8px;font-size:12px;font-weight:700;margin-left:4px}
.lv-ask{background:var(--bk-amber-100);color:var(--text-strong);border-radius:var(--r-md);padding:12px;margin-top:10px;font-weight:600;font-size:var(--fs-sm)}
.lv-ask:empty{display:none}
.lv-ask .btns{margin-top:8px}
.lv-why{font-weight:400;font-size:var(--fs-sm);margin-top:6px;color:var(--text-body)}
.lv-why a{font-weight:700;cursor:pointer}
.lv-mine{font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-left:6px}
.lv-cue{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:60;border:0;background:var(--bk-coral);color:#fff;font-weight:700;font-size:16px;padding:14px 22px;border-radius:var(--r-pill);box-shadow:var(--shadow-lg);cursor:pointer;max-width:calc(100vw - 32px)}
@keyframes lv-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--bk-coral) 70%,transparent)}100%{box-shadow:0 0 0 12px transparent}}
.nav button.live.lv-pulse{background:var(--bk-coral);color:#fff;animation:lv-pulse 1.2s ease-out infinite}
@media (prefers-reduced-motion:reduce){.nav button.live.lv-pulse{animation:none}}`;
  document.head.appendChild(s);
}

// ---------- Global cue: a poll or the question wall opens while the participant is on another tab ----------
// app.js calls this once: import("./live.js").then((m) => m.watchLive());
export function watchLive(onChange) {
  css();
  let prev = null, started = false, wallNew = false, cue = null;
  const onLive = () => location.hash.slice(1) === "live";
  const btn = () => document.querySelector('#nav button[data-t="live"]');
  const drop = () => { cue && cue.remove(); cue = null; };
  const show = (text) => {
    drop(); cue = document.createElement("button"); cue.className = "lv-cue"; cue.setAttribute("role", "status"); cue.textContent = text;
    cue.onclick = () => { drop(); location.hash = "live"; window.scrollTo({ top: 0 }); };
    document.body.appendChild(cue); const me = cue; setTimeout(() => { if (cue === me) drop(); }, 12000);
  };
  const pulse = () => { const b = btn(); if (b) b.classList.toggle("lv-pulse", !onLive() && !!((prev && prev.open && prev.pollId) || wallNew)); };
  window.addEventListener("hashchange", () => { if (onLive()) { wallNew = false; drop(); } pulse(); });
  const go = async () => {
    if (started) return; started = true;
    const F = await fb().catch(() => null);
    if (!F) { started = false; return; }
    try { await ensureAnon(F); } catch (e) { started = false; return; }
    F.F.onSnapshot(F.F.doc(F.db, "control", "state"), (snap) => {
      const s = (snap && snap.data && snap.data()) || {};
      const ev = {
        pollOpened: !!(s.open && s.pollId && !(prev && prev.open && prev.pollId === s.pollId)),
        wallOpened: !!(prev && s.wall && !prev.wall),          // not on first load: the wall stays open for hours
        revealed: !!(prev && s.reveal && s.pollId && !(prev.reveal && prev.pollId === s.pollId)),
      };
      if (!s.wall) wallNew = false;
      if (ev.wallOpened && !onLive()) wallNew = true;
      prev = s;
      if (!onLive()) { if (ev.pollOpened) show("Poll open — tap to answer"); else if (ev.wallOpened) show("Question wall open — tap to ask"); else if (ev.revealed) show("Results are in — tap to see"); }
      if (!(s.open && s.pollId) && cue && cue.textContent.startsWith("Poll open")) drop();
      pulse();
      try { onChange && onChange(s, ev); } catch (e) {}
    }, () => { started = false; });
  };
  window.addEventListener("online", go);
  const later = () => setTimeout(go, 800);
  if (document.readyState === "complete") later(); else window.addEventListener("load", later, { once: true });
}

// ---------- Live tab ----------
let teardown = null;
export async function live(el) {
  teardown && teardown();
  const offs = []; let dead = false, timer = null;
  const on = (t, ev, f) => { t.addEventListener(ev, f); offs.push(() => t.removeEventListener(ev, f)); };
  teardown = () => { dead = true; clearTimeout(timer); offs.forEach((f) => { try { f(); } catch (e) {} }); offs.length = 0; };
  css();
  el.innerHTML = `<div class="head"><span class="bk-eyebrow" style="color:var(--bk-coral)"><span class="bk-chev" style="background:var(--bk-coral)"></span>Live session</span><h2>Answer along, ask anything</h2>
    <p class="lead">Polls appear here when Keith opens them. Answers and questions are anonymous — no names are collected.</p></div>
    <div id="lv-net" aria-live="polite"></div>
    <div class="grid half"><div class="card" id="lv-poll" aria-live="polite"><p class="sub">Connecting…</p></div>
    <div class="card"><h3>Question wall</h3><p class="sub" style="margin-top:-6px">Ask anonymously. Tap ▲ to back a question you want answered.</p>
      <div class="lv-note" id="lv-wall" role="status"></div>
      <label class="sub" for="lv-q" style="display:block;margin:8px 0 4px">Your question (no client names)</label><textarea id="lv-q" maxlength="${MAX}" placeholder="e.g. Does the 2% CGT option apply to RPS redeemed in 2026?"></textarea>
      <div class="lv-row"><span class="sub">Everyone in the room can read questions — never include client names or details. Keith sees only the text — not who sent it.</span><span class="lv-count" id="lv-cnt" aria-live="polite">0 / ${MAX}</span></div>
      <div class="lv-ask" id="lv-ask" role="alert"></div>
      <div class="btns"><button class="btn" id="lv-send">${icon("send")}Post question</button></div><div id="lv-list" style="margin-top:10px"></div></div></div>`;
  refreshIcons();
  const send = $("#lv-send", el), ta = $("#lv-q", el), box = $("#lv-poll", el), list = $("#lv-list", el), ask = $("#lv-ask", el);
  let state = null, gotState = false, stale = false, broken = false, myVote = null, pending = false, unsubMine = null, sending = false, wasOpen = false;
  let uid = null, S = null, db = null, items = [];
  const notes = {}; // lasting per-poll messages (e.g. a late answer the server refused)
  const offline = () => !navigator.onLine || stale;

  // draft + counter
  ta.value = store.get(DRAFT, "") || "";
  const count = () => { const n = ta.value.length, c = $("#lv-cnt", el); c.textContent = `${n} / ${MAX}`; c.classList.toggle("near", n >= MAX - 20); };
  count();
  on(ta, "input", () => { store.set(DRAFT, ta.value); count(); ask.innerHTML = ""; });

  let fbFailed = false; // the browser keeps a failed module import for the life of the page, so only a reload retries it
  const retry = () => { if (dead) return; if (fbFailed) location.reload(); else live(el); };
  function fail(text) {
    broken = true; clearTimeout(timer);
    box.innerHTML = `<div class="verdict no">${text}</div><div class="btns" style="margin-top:0"><button class="btn ghost" id="lv-retry">Try again</button></div><p class="sub">All eight tools still work without the live session.</p>`;
    $("#lv-retry", el).onclick = retry; renderWall();
  }
  function renderNet() {
    $("#lv-net", el).innerHTML = offline() && !broken ? `<div class="lv-off" role="status">No signal — you're offline. A poll answer you tap now sends automatically when the signal is back.</div>` : "";
  }
  on(window, "online", () => { if (broken || !gotState) { if (!fbFailed || location.hash.slice(1) === "live") retry(); } else { renderNet(); renderPoll(); renderWall(); } });
  on(window, "offline", () => { renderNet(); renderPoll(); renderWall(); });

  function renderWall() {
    const open = !!(state && state.wall);
    if (open) wasOpen = true;
    const can = open && !offline() && !broken && !!S;
    send.disabled = !can || sending; send.setAttribute("aria-disabled", String(send.disabled));
    $("#lv-wall", el).textContent = broken ? "" : open ? (offline() ? "No signal — your draft is kept here; post it when you're back online." : "") :
      (wasOpen || items.length) ? "Wall closed — Keith is going through the questions." : "The question wall opens when Keith asks for questions — you can draft yours now.";
    renderList();
  }
  function renderList() {
    if (!S) return;
    const open = !!(state && state.wall), mine = store.get(MINE, []);
    list.innerHTML = items.length ? items.map((q) => { const up = q.up || [], me = up.includes(uid); return `<div class="qitem"><button class="vote" data-id="${esc(q.id)}" aria-pressed="${me}" ${me || !open ? "disabled" : ""} aria-label="${me ? "You backed this question" : open ? "Back this question" : "Backing is closed"} (${up.length} so far)">▲<span>${up.length}</span></button><div>${esc(q.text)}${mine.includes(q.id) ? `<span class="lv-mine">· yours</span>` : ""}</div></div>`; }).join("") : `<p class="sub">No questions yet${open ? " — be the first." : "."}</p>`;
    $$(".vote", list).forEach((b) => b.addEventListener("click", () => back(b.dataset.id, b)));
  }
  async function back(id, b) {
    if (b) b.disabled = true;
    try { await S.updateDoc(S.doc(db, "questions", id), { up: S.arrayUnion(uid) }); return true; }
    catch (e) { if (b) b.disabled = false; toast(e && e.code === "permission-denied" ? "The question wall is closed" : "Could not back it — " + plain(e)); return false; }
  }

  function renderPoll() {
    if (dead || broken || !gotState) return;
    const p = state && state.pollId ? pollById(state.pollId) : null, note = p && notes[p.id] ? `<div class="verdict amber" style="margin-top:12px">${esc(notes[p.id])}</div>` : "";
    if (!p) {
      box.innerHTML = stale && !state ? `<span class="bk-eyebrow"><span class="bk-chev"></span>Waiting for signal</span><h3 style="margin-top:6px">Can't see Keith's polls yet</h3><p class="sub">The poll appears here as soon as your phone reconnects.</p>`
        : `<span class="bk-eyebrow"><span class="bk-chev"></span>Waiting</span><h3 style="margin-top:6px">No poll open right now</h3><p class="sub">Keep this page open — the next poll appears automatically.</p>`;
      return;
    }
    if (!state.open && !state.reveal) { box.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>${esc(p.group)}</span><h3 style="margin-top:6px">Poll closed — results coming</h3><p class="sub">${myVote === null ? "No answer recorded from this phone." : pending ? `Your answer ${L[myVote]} is still waiting for signal — it may arrive too late to count.` : "Your answer: " + L[myVote] + "."}</p>${note}`; return; }
    const n = p.o.length, counts = p.o.map((_, k) => (state.counts && state.counts[k]) || 0), total = counts.slice(0, n).reduce((a, b) => a + b, 0) || 1;
    let html = `<span class="bk-eyebrow"><span class="bk-chev"></span>${esc(p.group)}</span><h3 style="margin:6px 0 14px">${esc(p.q)}</h3>`;
    if (state.reveal) {
      html += p.o.map((o, k) => `<div class="bar ${p.a === k ? "correct" : ""}"><span><b>${L[k]}</b> · ${esc(o)}${p.a === k ? `<span class="lv-ok">✓ Correct</span>` : ""} ${myVote === k ? "<span class='tag guide'>YOU</span>" : ""}</span><span class="mono">${Math.round(counts[k] / total * 100)}%</span><div class="track"><div class="fill" style="width:${counts[k] / total * 100}%"></div></div></div>`).join("");
      if (p.a !== null) {
        const t = TOOL[(p.group || "").split(" ")[0]];
        html += `<div class="verdict ${myVote === p.a ? "ok" : "amber"}" style="margin-top:12px;display:block">${myVote === p.a ? "Nice — that's the one." : myVote === null ? "The answer is " + L[p.a] + "." : "Not quite — the answer is " + L[p.a] + "."}
          <div class="lv-why">Why: <b>${L[p.a]} · ${esc(p.o[p.a])}</b>${p.why ? ` — ${esc(p.why)}` : ""}${t ? `<br><a data-goto="${t[0]}">Work it through in the ${esc(t[1])} →</a>` : ""}</div></div>`;
      } else html += `<p class="sub">Thanks — that's how the room sees it.</p>`;
      html += note;
    } else {
      html += p.o.map((o, k) => `<button class="poll-opt" data-k="${k}" aria-pressed="${myVote === k}"><span class="k">${L[k]}</span>${esc(o)}</button>`).join("");
      html += `<p class="sub">${myVote === null ? "Tap an answer. You can change it until the poll closes." :
        pending ? (offline() ? `Waiting for signal — your answer ${L[myVote]} will send automatically.` : `Sending your answer ${L[myVote]}…`) :
        `<span class="lv-pill">Saved ✓</span>Your answer ${L[myVote]} is in — you can change it until the poll closes.`}</p>${note}`;
    }
    box.innerHTML = html;
    $$(".poll-opt", box).forEach((b) => b.addEventListener("click", async () => {
      const k = +b.dataset.k, pid = state.pollId; $$(".poll-opt", box).forEach((x) => (x.disabled = true));
      delete notes[pid];
      setTimeout(() => renderPoll(), 2500); // never leave the options locked if no snapshot arrives
      try { await S.setDoc(S.doc(db, "polls", pid, "votes", uid), { choice: k, at: S.serverTimestamp() }); try { navigator.vibrate && navigator.vibrate(25); } catch (e) {} }
      catch (e) {
        notes[pid] = e && e.code === "permission-denied" ? `Your answer ${L[k]} reached Keith after the poll closed, so it was not counted.` : `Your answer ${L[k]} did not send (${plain(e)}). Tap it again to retry.`;
        toast(e && e.code === "permission-denied" ? "Poll is closed — answer not counted" : "Answer not sent — " + plain(e));
      }
      renderPoll();
    }));
  }

  function askBox(text, actions) {
    ask.innerHTML = `${esc(text)}<div class="btns">${actions.map(([l], i) => `<button class="btn${i ? " ghost" : ""}" data-a="${i}">${esc(l)}</button>`).join("")}</div>`;
    $$("[data-a]", ask).forEach((b) => (b.onclick = () => { ask.innerHTML = ""; actions[+b.dataset.a][1](); }));
  }
  const clearDraft = () => { ta.value = ""; store.set(DRAFT, ""); count(); };
  async function post(force = {}) {
    const t = cleanQ(ta.value);
    if (!hasWords(t)) { ta.value = t; count(); return toast("Type a question first"); }
    if (!(state && state.wall)) return toast("The question wall is closed right now");
    if (offline()) return toast("No signal — your question is kept as a draft");
    if (!force.client && looksLikeClient(t)) return askBox("This looks like it names a client — everyone will see it.", [["Edit", () => ta.focus()], ["Post anyway", () => post({ ...force, client: true })]]);
    const dup = items.find((q) => norm(q.text) === norm(t));
    if (dup) {
      if ((dup.up || []).includes(uid)) return askBox("Already on the wall — and you've backed it.", [["OK", clearDraft]]);
      return askBox("Already on the wall — back it instead?", [["Back it ▲", async () => { if (await back(dup.id)) { clearDraft(); toast("Backed — thanks"); } }], ["Edit mine", () => ta.focus()]]);
    }
    if (sending) return; sending = true; renderWall();
    try {
      const ref = await S.addDoc(S.collection(db, "questions"), { text: t.slice(0, MAX), at: S.serverTimestamp(), up: [], hidden: false });
      if (ref && ref.id) store.set(MINE, [...store.get(MINE, []), ref.id].slice(-50));
      clearDraft(); toast("Question posted");
    } catch (e) { toast(e && e.code === "permission-denied" ? "The question wall is closed — your draft is kept" : "Could not post — " + plain(e) + ". Your draft is kept."); }
    sending = false; renderWall();
  }
  on(send, "click", () => post());
  renderWall();

  // connect
  timer = setTimeout(() => { if (!gotState && !dead) { broken = true; box.innerHTML = `<div class="verdict amber">Still connecting — hall Wi-Fi may be slow.</div><div class="btns" style="margin-top:0"><button class="btn ghost" id="lv-retry">Try again</button></div><p class="sub">All eight tools still work without the live session.</p>`; $("#lv-retry", el).onclick = retry; renderWall(); } }, 8000);
  const F = await fb().catch(() => false);
  if (dead) return;
  if (F === null) { clearTimeout(timer); box.innerHTML = `<div class="verdict info">The live session is switched off for this copy of the toolkit. All eight tools still work.</div>`; send.disabled = true; return; }
  if (F === false) { fbFailed = true; return fail("Can't reach the live session — check your Wi-Fi or mobile data."); }
  ({ db } = F); S = F.F;
  try { uid = await ensureAnon(F); } catch (e) { if (!dead) fail("Could not join the live session — " + plain(e) + ". Check your Wi-Fi or mobile data."); return; }
  if (dead) return;

  offs.push(S.onSnapshot(S.doc(db, "control", "state"), { includeMetadataChanges: true }, (snap) => {
    if (dead) return;
    const prev = state && state.pollId;
    stale = !!(snap.metadata && snap.metadata.fromCache);
    state = (snap.exists && snap.exists() ? snap.data() : null) || null;
    if (!gotState || broken) { gotState = true; broken = false; clearTimeout(timer); }
    if ((state && state.pollId) !== prev || !unsubMine) {
      myVote = null; pending = false; unsubMine && unsubMine(); unsubMine = null;
      if (state && state.pollId) {
        unsubMine = S.onSnapshot(S.doc(db, "polls", state.pollId, "votes", uid), { includeMetadataChanges: true },
          (d) => { myVote = d.exists() ? d.data().choice : null; pending = !!(d.metadata && d.metadata.hasPendingWrites); renderPoll(); },
          () => {});
      }
    }
    renderNet(); renderPoll(); renderWall();
  }, (e) => { if (!dead) fail("Live session unavailable — " + plain(e) + "."); }));
  offs.push(() => unsubMine && unsubMine());

  // Question wall — stable order (oldest first), so a tap never lands on a question that just moved.
  offs.push(S.onSnapshot(S.query(S.collection(db, "questions"), S.where("hidden", "==", false), S.limit(200)), (qs) => {
    if (dead) return;
    const ts = (q) => (q.at && q.at.toMillis ? q.at.toMillis() : typeof q.at === "number" ? q.at : Infinity);
    items = qs.docs.map((d) => ({ id: d.id, ...d.data() })).filter((q) => !q.hidden).sort((a, b) => ts(a) - ts(b));
    renderWall();
  }, (e) => { if (!dead) list.innerHTML = `<p class="sub">Question wall unavailable — ${plain(e)}.</p>`; }));
}
