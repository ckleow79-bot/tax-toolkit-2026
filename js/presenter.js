// Presenter view — controls the live poll and shows results / questions on the projector.
import { fb } from "./firebase.js";
import { POLLS, pollById } from "./polls.js";
import { $, $$, esc } from "./ui.js";

const JOIN = new URL("./#live", location.href).href;
const msg = (t, kind = "no") => { $("#msg").innerHTML = t ? `<div class="verdict ${kind}">${t}</div>` : ""; };
const code = (e) => esc((e && e.code) || (e && e.message) || "network");

let F = null;
try { F = await fb(); } catch (e) { F = false; }
if (F === false) { $("#stage").innerHTML = `<div class="verdict no">Live features could not load — check the internet connection (gstatic.com must be reachable), then reload.</div>`; $("#login").hidden = true; }
else if (!F) { $("#stage").innerHTML = `<div class="verdict info">Firebase is not configured yet — see SETUP.md.</div>`; $("#login").hidden = true; }
else {
  const { auth, db, A, F: S } = F;
  let state = {}, votes = [], qs = [], view = "poll", sel = POLLS[0].id, unsub = null, started = false;
  $("#go").onclick = async () => { try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); } catch (e) { $("#err").textContent = "Sign-in failed: " + ((e && e.code) || (e && e.message)); } };
  $("#out").onclick = async () => { try { await A.signOut(auth); } finally { location.reload(); } };
  A.onAuthStateChanged(auth, (u) => {
    const ok = !!(u && !u.isAnonymous); $("#login").hidden = ok; $("#ctl").hidden = !ok;
    if (ok) { $("#who").textContent = u.email || ""; if (!started) { started = true; start(); } }
  });
  const denied = (e) => e && e.code === "permission-denied"
    ? msg("Not allowed — this Google account is not the presenter account in the security rules. Sign out and use the presenter account.")
    : msg("Could not save (" + code(e) + "). Check the connection and try again.");
  const setState = (patch) => S.setDoc(S.doc(db, "control", "state"), { ...state, ...patch, updatedAt: S.serverTimestamp() }).then(() => { msg(""); return true; }, (e) => { denied(e); return false; });

  function list() {
    let g = "", html = "";
    POLLS.forEach((p) => { if (p.group !== g) { g = p.group; html += `<h4>${esc(g)}</h4>`; } html += `<button data-id="${esc(p.id)}" class="${p.id === sel ? "on" : ""}">${esc(p.q.length > 70 ? p.q.slice(0, 68) + "…" : p.q)}${state.pollId === p.id && state.open ? " · LIVE" : ""}</button>`; });
    $("#plist").innerHTML = html;
    $$("#plist button").forEach((b) => (b.onclick = () => { sel = b.dataset.id; view = "poll"; watch(sel); list(); render(); }));
    $("#wall").textContent = state.wall ? "Question wall: OPEN — tap to close" : "Question wall: closed — tap to open";
    $("#wall").setAttribute("aria-pressed", String(!!state.wall));
  }
  // Moderation list — every question, newest first, kept off the projected stage.
  function modList() {
    const ts = (q) => (q.at && q.at.toMillis ? q.at.toMillis() : typeof q.at === "number" ? q.at : Infinity);
    const items = [...qs].sort((a, b) => ts(b) - ts(a));
    $("#mod").innerHTML = items.length ? items.map((q) => `<div class="mq${q.hidden ? " hid" : ""}"><span>${esc(q.text)}</span><small>▲${(q.up || []).length}${q.hidden ? " · hidden" : ""}</small><div><button class="iconbtn" data-hide="${esc(q.id)}" data-to="${q.hidden ? "0" : "1"}">${q.hidden ? "Unhide" : "Hide"}</button><button class="iconbtn" data-del="${esc(q.id)}">Delete</button></div></div>`).join("") : `<p class="sub">No questions yet.</p>`;
    $$("#mod [data-hide]").forEach((b) => (b.onclick = () => S.updateDoc(S.doc(db, "questions", b.dataset.hide), { hidden: b.dataset.to === "1" }).catch(denied)));
    $$("#mod [data-del]").forEach((b) => (b.onclick = () => { if (confirm("Delete this question for everyone?")) S.deleteDoc(S.doc(db, "questions", b.dataset.del)).catch(denied); }));
  }
  function watch(id) { unsub && unsub(); votes = []; unsub = S.onSnapshot(S.collection(db, "polls", id, "votes"), (q) => { votes = q.docs.map((d) => ({ id: d.id, ...d.data() })); render(); }, denied); }
  const tally = (p) => p.o.map((_, k) => votes.filter((v) => v.choice === k).length);
  function render() {
    const st = $("#stage");
    if (view === "qr") { const qr = qrcode(0, "M"); qr.addData(JOIN); qr.make(); st.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>Join the live session</span><h2>Scan to join</h2><div class="qr">${qr.createSvgTag({ cellSize: 14, margin: 2 })}</div><p class="mono" style="font-size:20px;margin-top:16px">${esc(JOIN)}</p>`; return; }
    if (view === "q") { const items = qs.filter((q) => !q.hidden).sort((a, b) => (b.up || []).length - (a.up || []).length).slice(0, 8);
      st.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>Question wall</span><h2>Top questions</h2>${items.map((q) => `<div class="top-q"><b>▲${(q.up || []).length}</b><span>${esc(q.text)}</span></div>`).join("") || "<p class='sub'>No questions yet.</p>"}`; return; }
    const p = pollById(sel), counts = tally(p), sum = counts.reduce((a, b) => a + b, 0), total = sum || 1, live = state.pollId === sel;
    const showRes = live && state.reveal;
    const status = live ? (state.open ? "· OPEN" : state.reveal ? "· REVEALED" : "· CLOSED") : "· not live";
    const opts = showRes
      ? p.o.map((o, k) => `<div class="bar ${p.a === k ? "correct" : ""}"><span><b>${"ABCD"[k]}</b> · ${esc(o)}</span><span class="mono">${Math.round(counts[k] / total * 100)}%</span><div class="track"><div class="fill" style="width:${counts[k] / total * 100}%"></div></div></div>`).join("")
      : p.o.map((o, k) => `<div class="bar"><span><b>${"ABCD"[k]}</b> · ${esc(o)}</span></div>`).join(""); // no percentages before Reveal — they sway the room
    st.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>${esc(p.group)} ${status}</span><h2>${esc(p.q)}</h2>${opts}
      <p class="count">${sum} answer${sum === 1 ? "" : "s"}${showRes && p.a !== null ? ` · answer ${"ABCD"[p.a]} — ${esc(p.why)}` : ""}</p>`;
  }
  async function clearVotes(id, list) { for (const v of list) await S.deleteDoc(S.doc(db, "polls", id, "votes", v.id)); }
  function start() {
    S.onSnapshot(S.doc(db, "control", "state"), (d) => { state = d.data() || {}; list(); render(); }, denied);
    S.onSnapshot(S.collection(db, "questions"), (q) => { qs = q.docs.map((d) => ({ id: d.id, ...d.data() })); modList(); if (view === "q") render(); }, denied);
    watch(sel); list(); render();
    $("#open").onclick = async () => {
      const p = pollById(sel);
      if (votes.length && !(state.pollId === sel && state.open)) {
        if (confirm(`This poll already has ${votes.length} answer(s) — e.g. from rehearsal.\n\nOK = clear them and start fresh.\nCancel = keep them and reopen.`)) { try { await clearVotes(sel, votes); } catch (e) { return denied(e); } }
      }
      setState({ pollId: sel, open: true, reveal: false, counts: [], n: p.o.length });
    };
    $("#close").onclick = () => setState({ open: false });
    $("#reveal").onclick = async () => {
      if (state.pollId === sel && state.open) { if (!(await setState({ open: false }))) return; await new Promise((r) => setTimeout(r, 1500)); }
      const p = pollById(sel); setState({ pollId: sel, open: false, reveal: true, counts: tally(p), n: p.o.length });
    };
    $("#hide").onclick = () => setState({ pollId: null, open: false, reveal: false });
    $("#wall").onclick = () => setState({ wall: !state.wall });
    $("#view-poll").onclick = () => { view = "poll"; render(); }; $("#view-q").onclick = () => { view = "q"; render(); }; $("#view-qr").onclick = () => { view = "qr"; render(); };
    $("#reset").onclick = async () => { if (!confirm("Clear all votes on this poll?")) return; try { await clearVotes(sel, votes); } catch (e) { return denied(e); } if (state.pollId === sel) setState({ counts: [], reveal: false }); };
  }
}
