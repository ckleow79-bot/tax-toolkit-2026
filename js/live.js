// Live session — participant side. Anonymous sign-in; answers and questions carry no names.
import { fb } from "./firebase.js";
import { pollById } from "./polls.js";
import { $, $$, esc, icon, refreshIcons, toast } from "./ui.js";

export async function live(el) {
  el.innerHTML = `<div class="head"><span class="bk-eyebrow" style="color:var(--bk-coral)"><span class="bk-chev" style="background:var(--bk-coral)"></span>Live session</span><h2>Answer along, ask anything</h2>
    <p class="lead">Polls appear here when Keith opens them. Answers and questions are anonymous — no names are collected.</p></div>
    <div class="grid half"><div class="card" id="lv-poll"><p class="sub">Connecting…</p></div>
    <div class="card"><h3>Question wall</h3><p class="sub" style="margin-top:-6px">Ask anonymously. Tap ▲ to back a question you want answered.</p>
      <label class="sub" for="lv-q" style="display:block;margin:8px 0 4px">Your question (no client names)</label><textarea id="lv-q" maxlength="240" placeholder="e.g. Does the 2% CGT option apply to RPS redeemed in 2026?"></textarea><p class="sub" style="margin:6px 0 0">Everyone in the room can read questions — never include client names or details.</p>
      <div class="btns"><button class="btn" id="lv-send">${icon("send")}Post question</button></div><div id="lv-list" style="margin-top:10px"></div></div></div>`;
  refreshIcons();
  const F = await fb().catch(() => null);
  if (!F) { $("#lv-poll", el).innerHTML = `<div class="verdict info">The live session is not connected yet. All eight tools work without it.</div>`; $("#lv-send", el).disabled = true; return; }
  const { auth, db, A, F: S } = F;
  try { if (!auth.currentUser) await A.signInAnonymously(auth); } catch (e) { $("#lv-poll", el).innerHTML = `<div class="verdict no">Could not join the live session (${esc(e.code || "network")}). Check your connection and reload.</div>`; return; }
  const uid = auth.currentUser.uid;
  let state = null, myVote = null, unsubMine = null;

  function renderPoll() {
    const box = $("#lv-poll", el), p = state && state.pollId ? pollById(state.pollId) : null;
    if (!p || (!state.open && !state.reveal)) { box.innerHTML = `<span class="bk-eyebrow"><span class="bk-chev"></span>Waiting</span><h3 style="margin-top:6px">No poll open right now</h3><p class="sub">Keep this page open — the next poll appears automatically.</p>`; return; }
    const counts = p.o.map((_, k) => (state.counts && state.counts[k]) || 0), total = counts.reduce((a, b) => a + b, 0) || 1;
    let html = `<span class="bk-eyebrow"><span class="bk-chev"></span>${esc(p.group)}</span><h3 style="margin:6px 0 14px">${esc(p.q)}</h3>`;
    if (state.reveal) {
      html += p.o.map((o, k) => `<div class="bar ${p.a === k ? "correct" : ""}"><span><b>${"ABCD"[k]}</b> · ${esc(o)} ${myVote === k ? "<span class='tag guide'>YOU</span>" : ""}</span><span class="mono">${Math.round(counts[k] / total * 100)}%</span><div class="track"><div class="fill" style="width:${counts[k] / total * 100}%"></div></div></div>`).join("");
      if (p.a !== null) html += `<div class="verdict ${myVote === p.a ? "ok" : "amber"}" style="margin-top:12px">${myVote === p.a ? "Nice — that's the one." : myVote === null ? "Answer: " + "ABCD"[p.a] : "Not quite — the answer is " + "ABCD"[p.a] + "."} <span class="sub" style="font-weight:400">${esc(p.why || "")}</span></div>`;
    } else {
      html += p.o.map((o, k) => `<button class="poll-opt" data-k="${k}" aria-pressed="${myVote === k}"><span class="k">${"ABCD"[k]}</span>${esc(o)}</button>`).join("");
      html += `<p class="sub">${myVote === null ? "Tap an answer. You can change it until the poll closes." : "Answer saved — you can still change it."}</p>`;
    }
    box.innerHTML = html;
    $$(".poll-opt", box).forEach((b) => b.addEventListener("click", async () => {
      const k = +b.dataset.k; b.disabled = true;
      try { await S.setDoc(S.doc(db, "polls", state.pollId, "votes", uid), { choice: k, at: S.serverTimestamp() }); myVote = k; renderPoll(); } catch (e) { toast("Poll is closed — answer not saved"); renderPoll(); }
    }));
  }
  S.onSnapshot(S.doc(db, "control", "state"), (snap) => {
    const prev = state && state.pollId; state = snap.data() || null;
    if (state && state.pollId !== prev) {
      myVote = null; unsubMine && unsubMine();
      if (state.pollId) {
        unsubMine = S.onSnapshot(S.doc(db, "polls", state.pollId, "votes", uid), (d) => { myVote = d.exists() ? d.data().choice : null; renderPoll(); });
      }
    }
    renderPoll();
  }, () => { $("#lv-poll", el).innerHTML = `<div class="verdict no">Live session unavailable.</div>`; });

  // question wall
  const list = $("#lv-list", el);
  S.onSnapshot(S.query(S.collection(db, "questions"), S.orderBy("at", "desc"), S.limit(100)), (qs) => {
    const items = qs.docs.map((d) => ({ id: d.id, ...d.data() })).filter((q) => !q.hidden).sort((a, b) => (b.up || []).length - (a.up || []).length);
    list.innerHTML = items.length ? items.map((q) => { const mine = (q.up || []).includes(uid); return `<div class="qitem"><button class="vote" data-id="${q.id}" aria-pressed="${mine}" ${mine ? "disabled" : ""} aria-label="Back this question">▲<span>${(q.up || []).length}</span></button><div>${esc(q.text)}</div></div>`; }).join("") : `<p class="sub">No questions yet — be the first.</p>`;
    $$(".vote", list).forEach((b) => b.addEventListener("click", async () => { try { await S.updateDoc(S.doc(db, "questions", b.dataset.id), { up: S.arrayUnion(uid) }); } catch (e) { toast("Could not vote"); } }));
  });
  $("#lv-send", el).addEventListener("click", async () => {
    const t = $("#lv-q", el).value.trim(); if (t.length < 3) return toast("Type a question first");
    try { await S.addDoc(S.collection(db, "questions"), { text: t.slice(0, 240), at: S.serverTimestamp(), up: [], hidden: false }); $("#lv-q", el).value = ""; toast("Question posted"); } catch (e) { toast("Could not post — try again"); }
  });
}
