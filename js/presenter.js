// Presenter view — controls the live poll and shows results / questions on the projector.
import { fb } from "./firebase.js";
import { POLLS, pollById } from "./polls.js";
import { $, $$, esc } from "./ui.js";

const JOIN = new URL("./#live", location.href).href;
const F = await fb();
if (!F) { $("#stage").innerHTML = `<div class="verdict info">Firebase is not configured yet — see SETUP.md.</div>`; $("#login").hidden = true; }
else {
  const { auth, db, A, F: S } = F;
  let state = {}, votes = [], qs = [], view = "poll", sel = POLLS[0].id, unsub = null;
  $("#go").onclick = async () => { try { await A.signInWithEmailAndPassword(auth, $("#em").value.trim(), $("#pw").value); } catch (e) { $("#err").textContent = "Sign-in failed: " + (e.code || e.message); } };
  $("#out").onclick = () => A.signOut(auth);
  A.onAuthStateChanged(auth, (u) => { const ok = u && !u.isAnonymous; $("#login").hidden = ok; $("#ctl").hidden = !ok; if (ok) start(); });
  const setState = (patch) => S.setDoc(S.doc(db, "control", "state"), { ...state, ...patch, updatedAt: S.serverTimestamp() }).catch((e) => alert("Not allowed: " + e.code));
  function list() {
    let g = "", html = "";
    POLLS.forEach((p) => { if (p.group !== g) { g = p.group; html += `<h4>${esc(g)}</h4>`; } html += `<button data-id="${p.id}" class="${p.id === sel ? "on" : ""}">${esc(p.q.length > 70 ? p.q.slice(0, 68) + "…" : p.q)}${state.pollId === p.id && state.open ? " · LIVE" : ""}</button>`; });
    $("#plist").innerHTML = html;
    $$("#plist button").forEach((b) => (b.onclick = () => { sel = b.dataset.id; view = "poll"; watch(sel); list(); render(); }));
  }
  function watch(id) { unsub && unsub(); votes = []; unsub = S.onSnapshot(S.collection(db, "polls", id, "votes"), (q) => { votes = q.docs.map((d) => ({ id: d.id, ...d.data() })); render(); }); }
  function render() {
    const st = $("#stage");
    if (view === "qr") { const qr = qrcode(0, "M"); qr.addData(JOIN); qr.make(); st.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>Join the live session</span><h2>Scan to join</h2><div class="qr">${qr.createSvgTag({ cellSize: 14, margin: 2 })}</div><p class="mono" style="font-size:20px;margin-top:16px">${esc(JOIN)}</p>`; return; }
    if (view === "q") { const items = qs.filter((q) => !q.hidden).sort((a, b) => (b.up || []).length - (a.up || []).length).slice(0, 8);
      st.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>Question wall</span><h2>Top questions</h2>${items.map((q) => `<div class="top-q"><b>▲${(q.up || []).length}</b><span style="flex:1">${esc(q.text)}</span><button class="iconbtn" data-hide="${q.id}">Hide</button><button class="iconbtn" data-del="${q.id}">Delete</button></div>`).join("") || "<p class='sub'>No questions yet.</p>"}`;
      $$("[data-hide]").forEach((b) => (b.onclick = () => S.updateDoc(S.doc(db, "questions", b.dataset.hide), { hidden: true })));
      $$("[data-del]").forEach((b) => (b.onclick = () => { if (confirm("Delete this question for everyone?")) S.deleteDoc(S.doc(db, "questions", b.dataset.del)); })); return; }
    const p = pollById(sel), counts = p.o.map((_, k) => votes.filter((v) => v.choice === k).length), total = votes.length || 1, live = state.pollId === sel;
    const showAns = live && state.reveal;
    st.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>${esc(p.group)} ${live ? (state.open ? "· OPEN" : state.reveal ? "· REVEALED" : "· CLOSED") : "· not live"}</span><h2>${esc(p.q)}</h2>
      ${p.o.map((o, k) => `<div class="bar ${showAns && p.a === k ? "correct" : ""}"><span><b>${"ABCD"[k]}</b> · ${esc(o)}</span><span class="mono">${Math.round(counts[k] / total * 100)}%</span><div class="track"><div class="fill" style="width:${counts[k] / total * 100}%"></div></div></div>`).join("")}
      <p class="count">${votes.length} answer${votes.length === 1 ? "" : "s"}${showAns && p.a !== null ? ` · answer ${"ABCD"[p.a]} — ${esc(p.why)}` : ""}</p>`;
  }
  function start() {
    S.onSnapshot(S.doc(db, "control", "state"), (d) => { state = d.data() || {}; list(); render(); });
    S.onSnapshot(S.collection(db, "questions"), (q) => { qs = q.docs.map((d) => ({ id: d.id, ...d.data() })); if (view === "q") render(); });
    watch(sel); list(); render();
    $("#open").onclick = () => setState({ pollId: sel, open: true, reveal: false, counts: [] });
    $("#close").onclick = () => setState({ open: false });
    $("#reveal").onclick = async () => { if (state.pollId === sel && state.open) { await setState({ open: false }); await new Promise((r) => setTimeout(r, 1500)); } const p = pollById(sel); const counts = p.o.map((_, k) => votes.filter((v) => v.choice === k).length); setState({ pollId: sel, open: false, reveal: true, counts }); };
    $("#hide").onclick = () => setState({ pollId: null, open: false, reveal: false });
    $("#view-poll").onclick = () => { view = "poll"; render(); }; $("#view-q").onclick = () => { view = "q"; render(); }; $("#view-qr").onclick = () => { view = "qr"; render(); };
    $("#reset").onclick = async () => { if (!confirm("Clear all votes on this poll?")) return; for (const v of votes) await S.deleteDoc(S.doc(db, "polls", sel, "votes", v.id)); if (state.pollId === sel) setState({ counts: [], reveal: false }); };
  }
}
