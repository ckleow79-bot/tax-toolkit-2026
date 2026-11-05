// Presenter view — two windows in the same browser:
//   presenter.html         control window (Keith's laptop screen): controls, poll list, moderation, preview.
//   presenter.html?stage   projector window: the stage only — the LIVE poll (never a preview), the join QR,
//                          or the questions Keith has approved. View mode and approvals sync from the control
//                          window through localStorage (same browser), so nothing extra is written to Firestore.
import { cleanQ } from "./live.js";
import { fb } from "./firebase.js";
import { POLLS, pollById } from "./polls.js";
import { $, $$, esc } from "./ui.js";

const STAGE = new URLSearchParams(location.search).has("stage");
const JOIN = new URL("./#live", location.href).href;
const SHORT = JOIN.replace(/^https?:\/\//, "");
const L = "ABCD";
const short = (p) => (p ? (p.id === "open" ? "Opening" : p.id.toUpperCase()) : "");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const msg = (t, kind = "no") => { $("#msg").innerHTML = t ? `<div class="verdict ${kind}">${t}</div>` : ""; };
let QR = "";
const qrSvg = () => { if (!QR) { try { const q = qrcode(0, "M"); q.addData(JOIN); q.make(); QR = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); } catch (e) { QR = ""; } } return QR; };

// View mode + approved question IDs: the presenter's own browser only (the rules allow no new Firestore fields for this).
const LS = "tct26-presenter";
function loadLocal() {
  try { const v = JSON.parse(localStorage.getItem(LS) || "{}"); return { view: ["poll", "q", "qr"].includes(v.view) ? v.view : "poll", approved: Array.isArray(v.approved) ? v.approved : [] }; }
  catch (e) { return { view: "poll", approved: [] }; }
}
let local = loadLocal();
const bc = typeof BroadcastChannel === "function" ? new BroadcastChannel(LS) : null;
function saveLocal() { try { localStorage.setItem(LS, JSON.stringify(local)); } catch (e) {} try { bc && bc.postMessage(local); } catch (e) {} }
// An approval is tied to the question's ID AND creation time, so a deleted question re-created under the same ID
// (possible from a participant's dev tools while the wall is open) is never projected without a fresh approval.
const akey = (q) => q.id + "@" + (q.at && q.at.toMillis ? q.at.toMillis() : typeof q.at === "number" ? q.at : "x");
const approved = (q) => local.approved.includes(akey(q));
const unapprove = (id) => { local.approved = local.approved.filter((x) => !x.startsWith(id + "@")); saveLocal(); };

if (STAGE) { document.body.classList.add("stage-mode"); document.title = "Projector · Tax Compliance Toolkit 2026"; }

let F = null;
try { F = await fb(); } catch (e) { F = false; }
if (F === false) { $("#stage").innerHTML = `<div class="verdict no">Live features could not load — check the internet connection (gstatic.com must be reachable), then reload.</div>`; $("#login").hidden = true; }
else if (!F) { $("#stage").innerHTML = `<div class="verdict info">Firebase is not configured yet — see SETUP.md.</div>`; $("#login").hidden = true; }
else {
  const { auth, db, A, F: S } = F;
  let state = {}, liveVotes = [], selVotes = [], qs = [], sel = POLLS[0].id, started = false, firstState = true, choice = false, tab = "polls";
  let unsubSel = null, unsubLive = null, liveId = undefined, paint = () => {};

  const signIn = async () => { try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); } catch (e) { const er = $("#err"); if (er) er.textContent = "Sign-in did not finish — " + (((e && e.code) || "").includes("popup") ? "the pop-up was closed or blocked." : "check the connection and try again."); } };
  $("#go").onclick = signIn;
  const denied = (e) => e && e.code === "permission-denied"
    ? msg("Not allowed — this Google account is not the presenter account in the security rules. Sign out and use the presenter account.")
    : msg("Could not save — no connection to the live service. Check the Wi-Fi and try again.");
  const setState = (patch) => S.setDoc(S.doc(db, "control", "state"), { ...state, ...patch, updatedAt: S.serverTimestamp() }).then(() => { msg(""); return true; }, (e) => { denied(e); return false; });
  const tally = (p, list) => p.o.map((_, k) => list.filter((v) => v.choice === k).length);
  const upN = (q) => (q.up || []).length;
  const ts = (q) => (q.at && q.at.toMillis ? q.at.toMillis() : typeof q.at === "number" ? q.at : Infinity);

  // Votes on the LIVE poll (stage counts, Reveal) and on the SELECTED poll (preview, re-open check) are watched separately.
  function watchLiveVotes() {
    const id = state.pollId || null; if (id === liveId) return; liveId = id;
    unsubLive && unsubLive(); unsubLive = null; liveVotes = [];
    if (id) unsubLive = S.onSnapshot(S.collection(db, "polls", id, "votes"), (q) => { liveVotes = q.docs.map((d) => ({ id: d.id, ...d.data() })); paint(); }, () => {});
  }
  function watchSel() {
    unsubSel && unsubSel(); selVotes = [];
    unsubSel = S.onSnapshot(S.collection(db, "polls", sel, "votes"), (q) => { selVotes = q.docs.map((d) => ({ id: d.id, ...d.data() })); paint(); }, denied);
  }

  // ---------- stage markup (shared by the projector window and the control preview) ----------
  function joinScreen() {
    return `<div class="st-join"><span class="bk-eyebrow"><span class="bk-chev"></span>Join the live session</span><h2>Scan to join</h2><div class="qr qr-big">${qrSvg()}</div><p class="mono st-url">${esc(SHORT)}</p><p class="st-sub">Scan with your phone camera — polls and the question wall open on your phone.</p></div>`;
  }
  function questionsScreen() {
    const items = qs.filter((q) => !q.hidden && approved(q)).sort((a, b) => upN(b) - upN(a) || ts(a) - ts(b)).slice(0, 8);
    return `<span class="bk-eyebrow"><span class="bk-chev"></span>Question wall</span><h2>Top questions</h2>${items.map((q) => `<div class="top-q"><b>▲${upN(q)}</b><span>${esc(cleanQ(q.text))}</span></div>`).join("") || "<p class='st-sub'>Questions appear here once Keith has read them.</p>"}`;
  }
  function pollScreen(p, live, votes) {
    const showRes = live && state.reveal;
    const counts = showRes && Array.isArray(state.counts) && state.counts.length ? p.o.map((_, k) => state.counts[k] || 0) : tally(p, votes);
    const sum = counts.reduce((a, b) => a + b, 0), total = sum || 1;
    const st = !live ? ["st-off", "Not on screen"] : state.open ? ["st-open", "Poll open — answer on your phone"] : state.reveal ? ["st-res", "Results"] : ["st-closed", "Poll closed — results next"];
    const opts = showRes
      ? p.o.map((o, k) => `<div class="bar ${p.a === k ? "correct" : ""}"><span><b>${L[k]}</b> · ${esc(o)}${p.a === k ? `<span class="ok-tag">✓ Correct</span>` : ""}</span><span class="mono">${Math.round(counts[k] / total * 100)}%</span><div class="track"><div class="fill" style="width:${counts[k] / total * 100}%"></div></div></div>`).join("")
      : p.o.map((o, k) => `<div class="opt"><b>${L[k]}</b> · ${esc(o)}</div>`).join(""); // no percentages before Reveal — they sway the room
    return `<div class="st-head"><div><span class="st-status ${st[0]}">${st[1]}</span><div class="st-group">${esc(p.group)} · ${esc(short(p))}</div></div>
      <div class="st-corner"><div class="qr">${qrSvg()}</div><span class="mono">${esc(SHORT)}</span></div></div>
      <h2>${esc(p.q)}</h2>${opts}<p class="count">${plural(sum, "answer")}</p>${showRes && p.a !== null ? `<p class="cite">Answer ${L[p.a]} · ${esc(p.why || "")}</p>` : ""}`;
  }
  // What the projector window shows right now — only ever the live poll.
  function projectorHTML() {
    if (local.view === "qr") return joinScreen();
    if (local.view === "q") return questionsScreen();
    const p = state.pollId ? pollById(state.pollId) : null;
    return p ? pollScreen(p, true, liveVotes) : joinScreen();
  }

  // ---------- projector window ----------
  function stageSignIn() {
    $("#stage").innerHTML = `<div class="st-join"><h2>Projector window</h2><p class="st-sub">Sign in with the presenter account (normally this happens on its own once the control window is signed in).</p><button class="btn" id="go2">Sign in with Google</button><p class="sub" id="err"></p></div>`;
    $("#go2").onclick = signIn;
  }
  function startStage() {
    // Shrink the type (never below about 60%) only when a long poll would run off the screen.
    const fit = () => { const st = $("#stage"); let f = 1; st.style.setProperty("--fit", "1"); while (st.scrollHeight > st.clientHeight + 1 && f > 0.6) { f -= 0.04; st.style.setProperty("--fit", f.toFixed(2)); } };
    const paintStage = () => { $("#stage").innerHTML = projectorHTML(); fit(); };
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(fit, 150); });
    paint = paintStage;
    window.addEventListener("storage", (e) => { if (e.key === LS) { local = loadLocal(); paintStage(); } });
    if (bc) bc.onmessage = () => { local = loadLocal(); paintStage(); };
    S.onSnapshot(S.doc(db, "control", "state"), (d) => { state = d.data() || {}; watchLiveVotes(); paintStage(); }, () => {});
    S.onSnapshot(S.collection(db, "questions"), (q) => { qs = q.docs.map((d) => ({ id: d.id, ...d.data() })); if (local.view === "q") paintStage(); }, () => {});
    const hint = document.createElement("button"); hint.className = "fs-hint"; hint.textContent = "Press F for full screen";
    const fs = () => { try { const r = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); r && r.catch && r.catch(() => {}); } catch (e) {} };
    hint.onclick = fs; document.body.appendChild(hint); setTimeout(() => hint.remove(), 8000);
    document.addEventListener("keydown", (e) => { if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) { hint.remove(); fs(); } });
    paintStage();
  }

  // ---------- control window ----------
  function nextPoll(id) { const i = POLLS.findIndex((p) => p.id === id); return i >= 0 && i < POLLS.length - 1 ? POLLS[i + 1] : null; }
  function select(id) { if (id === sel) return; sel = id; choice = false; watchSel(); paint(); }

  function controls() {
    const p = pollById(sel), live = state.pollId ? pollById(state.pollId) : null, selLive = live && live.id === sel;
    const nxt = nextPoll(live ? live.id : sel);
    // what is on the projector
    const where = local.view === "qr" ? "Join QR" : local.view === "q" ? `Top questions — ${plural(qs.filter((q) => !q.hidden && approved(q)).length, "approved question")}` :
      live ? `${short(live)} · ${state.open ? "poll OPEN" : state.reveal ? "results shown" : "poll closed"} · ${plural(liveVotes.length, "answer")}` : "Join screen (no live poll)";
    $("#now").innerHTML = `<span class="lbl">On the projector now</span><b>${esc(where)}</b>${live && local.view !== "poll" ? `<br><span class="sub">Live poll ${esc(short(live))} is ${state.open ? "open on phones" : state.reveal ? "showing results on phones" : "closed"}.</span>` : ""}`;
    // the next logical step gets the solid button: Open → Reveal → Next poll
    const step = live && state.open ? "reveal" : live && state.reveal && selLive ? "next" : "open";
    const ob = $("#open"), rb = $("#reveal"), cb = $("#close"), hb = $("#hide"), nb = $("#next");
    ob.disabled = !!(selLive && state.open);
    ob.textContent = selLive && state.open ? `${short(p)} is open` : selLive || selVotes.length ? `Reopen ${short(p)}` : `Open ${short(p)}`;
    rb.disabled = !live || !!state.reveal; rb.textContent = live ? (state.reveal ? `Revealed ${short(live)} ✓` : `Reveal live poll (${short(live)})`) : "Reveal live poll";
    cb.disabled = !(live && state.open); cb.textContent = live ? `Close live poll (${short(live)})` : "Close live poll";
    hb.disabled = !live;
    ob.className = step === "open" ? "btn" : "btn ghost"; rb.className = step === "reveal" ? "btn" : "btn ghost";
    nb.hidden = !(step === "next" && nxt); if (nxt) { nb.textContent = `Next poll ▸ ${short(nxt)}`; nb.title = nxt.q; }
    nb.className = "btn";
    // re-open choice: keeping answers is the default; clearing is a separate, explicit choice
    $("#choice").innerHTML = choice ? `<div class="choice"><b>${short(p)} already has ${plural(selVotes.length, "answer")}</b> (e.g. from rehearsal, or before you closed it).<div class="ctl"><button class="btn" id="keep">Reopen — keep the answers</button><button class="btn ghost" id="wipe">Clear and restart</button><button class="iconbtn" id="nochoice">Cancel</button></div></div>` : "";
    if (choice) { $("#keep").onclick = () => doOpen(false); $("#wipe").onclick = () => doOpen(true); $("#nochoice").onclick = () => { choice = false; paint(); }; }
    ["poll", "q", "qr"].forEach((v) => $("#view-" + v).setAttribute("aria-pressed", String(local.view === v)));
    // poll list
    let g = "", html = "";
    POLLS.forEach((x) => { if (x.group !== g) { g = x.group; html += `<h4>${esc(g)}</h4>`; } html += `<button data-id="${esc(x.id)}" class="${x.id === sel ? "on" : ""}"><span class="id">${esc(short(x))}</span>${esc(x.q.length > 64 ? x.q.slice(0, 62) + "…" : x.q)}${state.pollId === x.id ? `<span class="lv">${state.open ? "LIVE" : state.reveal ? "RESULTS" : "ON SCREEN"}</span>` : ""}</button>`; });
    $("#plist").innerHTML = html;
    $$("#plist button").forEach((b) => (b.onclick = () => select(b.dataset.id)));
    $("#wall").textContent = state.wall ? "Question wall: OPEN — tap to close" : "Question wall: closed — tap to open";
    $("#wall").setAttribute("aria-pressed", String(!!state.wall));
    const pend = qs.filter((q) => !q.hidden && !approved(q)).length;
    $("#badge").textContent = pend ? `${pend} new` : "";
    $("#tab-polls").setAttribute("aria-selected", String(tab === "polls")); $("#tab-qs").setAttribute("aria-selected", String(tab === "qs"));
    $("#pane-polls").hidden = tab !== "polls"; $("#pane-qs").hidden = tab !== "qs";
  }
  // Moderation: to review (newest first), approved, hidden.
  function modList() {
    const pend = qs.filter((q) => !q.hidden && !approved(q)).sort((a, b) => ts(b) - ts(a));
    const appr = qs.filter((q) => !q.hidden && approved(q)).sort((a, b) => upN(b) - upN(a));
    const hid = qs.filter((q) => q.hidden).sort((a, b) => ts(b) - ts(a));
    const item = (q, kind) => `<div class="mq${kind === "new" ? " new" : kind === "hid" ? " hid" : ""}"><span>${esc(cleanQ(q.text))}</span><small>▲${upN(q)}${kind === "hid" ? " · hidden from phones" : kind === "ok" ? " · approved for the projector" : " · new"}</small><div>${
      kind === "new" ? `<button class="iconbtn ok" data-ok="${esc(q.id)}">Approve</button>` : kind === "ok" ? `<button class="iconbtn" data-unok="${esc(q.id)}">Unapprove</button>` : ""}<button class="iconbtn" data-hide="${esc(q.id)}" data-to="${kind === "hid" ? "0" : "1"}">${kind === "hid" ? "Unhide" : "Hide"}</button><button class="iconbtn" data-del="${esc(q.id)}">Delete</button></div></div>`;
    $("#mod").innerHTML = !qs.length ? `<p class="sub">No questions yet.</p>` :
      `<div class="h4">${pend.length ? `${pend.length} new — review` : "Nothing new to review"}</div>${pend.map((q) => item(q, "new")).join("")}` +
      (appr.length ? `<div class="h4">Approved for the projector (${appr.length})</div>${appr.map((q) => item(q, "ok")).join("")}` : "") +
      (hid.length ? `<div class="h4">Hidden (${hid.length})</div>${hid.map((q) => item(q, "hid")).join("")}` : "");
    $$("#mod [data-ok]").forEach((b) => (b.onclick = () => { const q = qs.find((x) => x.id === b.dataset.ok); if (q && !approved(q)) { local.approved.push(akey(q)); saveLocal(); } paint(); }));
    $$("#mod [data-unok]").forEach((b) => (b.onclick = () => { unapprove(b.dataset.unok); paint(); }));
    $$("#mod [data-hide]").forEach((b) => (b.onclick = () => { const hide = b.dataset.to === "1"; if (hide) unapprove(b.dataset.hide); S.updateDoc(S.doc(db, "questions", b.dataset.hide), { hidden: hide }).catch(denied); }));
    $$("#mod [data-del]").forEach((b) => (b.onclick = () => { if (confirm("Delete this question for everyone?")) { unapprove(b.dataset.del); S.deleteDoc(S.doc(db, "questions", b.dataset.del)).catch(denied); } }));
  }
  function preview() {
    const label = $("#pvlabel"), st = $("#stage");
    if (local.view !== "poll") { label.className = "pvlabel on"; label.textContent = "On the projector"; st.className = "stage"; st.innerHTML = projectorHTML(); return; }
    const p = pollById(sel), live = state.pollId === sel;
    label.className = live ? "pvlabel on" : "pvlabel pv";
    label.textContent = live ? "On the projector — live poll" : `PREVIEW — not on screen${state.pollId ? ` · projector shows ${short(pollById(state.pollId))}` : " · projector shows the join screen"}`;
    st.className = live ? "stage" : "stage pv";
    st.innerHTML = pollScreen(p, live, live ? liveVotes : selVotes) + (!live && selVotes.length ? `<p class="cite" style="color:var(--bk-warning)">${plural(selVotes.length, "answer")} already stored on this poll.</p>` : "");
  }

  async function clearVotes(id, list) { for (const v of list) await S.deleteDoc(S.doc(db, "polls", id, "votes", v.id)); }
  function doOpen(clear) {
    const p = pollById(sel), list = selVotes.slice(); choice = false;
    (async () => {
      if (clear) { try { await clearVotes(sel, list); } catch (e) { return denied(e); } }
      if (local.view !== "poll") { local.view = "poll"; saveLocal(); }
      await setState({ pollId: sel, open: true, reveal: false, counts: [], n: p.o.length });
    })();
    paint();
  }
  // One read of a collection from the server (not the local cache).
  const readOnce = (ref) => new Promise((res, rej) => {
    let u = null; const t = setTimeout(() => { u && u(); rej({ code: "unavailable" }); }, 15000);
    u = S.onSnapshot(ref, { includeMetadataChanges: true }, (q) => { if (q.metadata && q.metadata.fromCache) return; clearTimeout(t); res(q); setTimeout(() => u && u(), 0); }, (e) => { clearTimeout(t); rej(e); });
  });

  function startControl() {
    paint = () => { controls(); modList(); preview(); };
    S.onSnapshot(S.doc(db, "control", "state"), (d) => {
      state = d.data() || {};
      if (firstState) { firstState = false; if (state.pollId && pollById(state.pollId) && state.pollId !== sel) { sel = state.pollId; watchSel(); } } // after a reload, select the live poll
      watchLiveVotes(); paint();
    }, denied);
    S.onSnapshot(S.collection(db, "questions"), (q) => { qs = q.docs.map((d) => ({ id: d.id, ...d.data() })); paint(); }, denied);
    window.addEventListener("storage", (e) => { if (e.key === LS) { local = loadLocal(); paint(); } });
    watchSel(); paint();
    $("#proj").onclick = () => { const w = window.open("presenter.html?stage", "tct26-projector", "popup,width=1280,height=720"); if (!w) msg("The browser blocked the projector window — allow pop-ups for this site, then try again.", "amber"); };
    $("#out").onclick = async () => { if (!confirm("Sign out of the presenter view?\n\nPolls stay as they are; you will need to sign in again to control them.")) return; try { await A.signOut(auth); } finally { location.reload(); } };
    $("#open").onclick = () => {
      if (state.pollId === sel && state.open) return;
      if (selVotes.length) { choice = true; paint(); return; }
      doOpen(false);
    };
    $("#close").onclick = () => { if (state.pollId && state.open) setState({ open: false }); };
    $("#reveal").onclick = async () => {
      const id = state.pollId; if (!id || state.reveal) return;  // acts only on the live poll, never on a previewed one
      const rb = $("#reveal"); rb.disabled = true;
      if (state.open) { if (!(await setState({ open: false }))) return paint(); rb.textContent = "Collecting late answers…"; await new Promise((r) => setTimeout(r, 1500)); }
      if (state.pollId !== id) return paint();
      const p = pollById(id); await setState({ pollId: id, open: false, reveal: true, counts: tally(p, liveVotes), n: p.o.length });
    };
    $("#hide").onclick = () => setState({ pollId: null, open: false, reveal: false });
    $("#next").onclick = () => { const n = nextPoll(state.pollId || sel); if (n) select(n.id); };
    $("#wall").onclick = () => setState({ wall: !state.wall });
    ["poll", "q", "qr"].forEach((v) => ($("#view-" + v).onclick = () => { local.view = v; saveLocal(); paint(); }));
    $("#tab-polls").onclick = () => { tab = "polls"; paint(); }; $("#tab-qs").onclick = () => { tab = "qs"; paint(); };
    $("#reset").onclick = async () => {
      if (!selVotes.length) return msg(`${short(pollById(sel))} has no votes to clear.`, "info");
      if (!confirm(`Delete the ${plural(selVotes.length, "vote")} on ${short(pollById(sel))}?`)) return;
      try { await clearVotes(sel, selVotes.slice()); } catch (e) { return denied(e); }
      if (state.pollId === sel) setState({ counts: [], reveal: false });
    };
    $("#reset-all").onclick = async () => {
      if (!confirm(`Clear all rehearsal votes?\n\nThis deletes every vote on all ${POLLS.length} polls, resets question approvals and takes the poll off the screen. Do it after rehearsal — not during the session.`)) return;
      const b = $("#reset-all"); b.disabled = true; b.textContent = "Clearing…"; let n = 0;
      try {
        for (const p of POLLS) { const q = await readOnce(S.collection(db, "polls", p.id, "votes")); for (const d of q.docs) { await S.deleteDoc(S.doc(db, "polls", p.id, "votes", d.id)); n++; } }
        await setState({ pollId: null, open: false, reveal: false, counts: [] });
        local.approved = []; local.view = "poll"; saveLocal(); // rehearsal approvals must not carry into the live day
        msg(`Cleared ${plural(n, "rehearsal vote")} on ${POLLS.length} polls, and reset question approvals.`, "ok");
      } catch (e) { denied(e); }
      b.disabled = false; b.textContent = "Clear all rehearsal votes";
    };
  }

  A.onAuthStateChanged(auth, (u) => {
    const ok = !!(u && !u.isAnonymous);
    if (STAGE) { if (ok) { if (!started) { started = true; startStage(); } } else if (!started) stageSignIn(); return; }
    $("#login").hidden = ok; $("#ctl").hidden = !ok; $("#ctlbar").hidden = !ok;
    if (ok) { $("#who").textContent = u.email || ""; if (!started) { started = true; startControl(); } }
  });
}
