# Setup — Tax Compliance Toolkit 2026

The eight tools work as soon as GitHub Pages is on. The live polls and question wall need a free Firebase project — about 15 minutes, once, on a laptop signed in to your Google account.

**Cost:** nil. Firebase's Spark plan is free and needs no credit card. Its free limits (Firestore: 50,000 reads, 20,000 writes and 20,000 deletes a day; 1 GiB stored) are far above what 35 participants use in a day. If a limit were ever hit, Firebase stops that service until the quota resets — it never charges on Spark. Do not link a billing account; that upgrades the project to the paid Blaze plan.

## Status — done on 3 Nov 2026

These steps are already done for project `tax-toolkit-2026` (ID `tax-toolkit-2026-fc234`):
Firestore created in asia-southeast1 (production mode) · Anonymous sign-in on (auto clean-up after 30 days) · Google sign-in on for the presenter · `ckleow79-bot.github.io` authorised · rules published with the presenter's Google email · web app registered and `firebase-config.js` filled in · GitHub Pages on.

The presenter signs in on `presenter.html` with **Sign in with Google**. Only the Google account named in the published rules (verified email) can open, close and reveal polls or delete questions; any other account can sign in but every control is refused.

To change the presenter: Firestore Database → Rules → change the email in `presenter()` → Publish.

For a new project from scratch: create the project (Analytics off) → Firestore in asia-southeast1, production mode → Authentication: enable Anonymous and Google → add your Pages domain under Authorized domains → paste `firestore.rules` with `PRESENTER_EMAIL` replaced (lower case) → Publish → register a Web app and paste its config into `firebase-config.js` → GitHub Settings → Pages → main / root.

**Rules — last changed in v1.3 (3 Nov 2026), unchanged in v1.4:** question IDs must be Firestore auto-IDs; hidden questions are readable only by the presenter; the question wall accepts posts and upvotes only while the presenter has it open; votes must be one of the poll's options. If you rebuild the project, paste the whole of the current `firestore.rules`.

## Two-device test (5 minutes)

1. Laptop: open `presenter.html` → **Sign in with Google** with the presenter account. The panel shows "Signed in as …".
2. Phone: open the site → **Live**.
3. Presenter: pick *KC1 · RPGT* question 1 → **Open**. Answer on the phone; the presenter shows "1 answer" (no percentages until Reveal).
4. Presenter: **Reveal** — the phone shows the result and the verdict.
5. Presenter: tap **Question wall: closed** to open it. Phone: post a test question and tap ▲. Presenter: it appears in *Moderate questions* → **Delete** it.
6. Presenter: **Show join QR** — this is what goes on the projector at the start.
7. **Clean up after the test:** on each poll you tested, **Clear votes on this poll**; delete the test questions; close the question wall. (If you forget, **Open** will offer to clear old answers.)

If the phone says "Live session not available", check the internet connection and that `firebase-config.js` is filled in. If the presenter's controls show "Not allowed — this Google account is not the presenter account", check the email in the published rules matches the Google account exactly, in lower case.

## On the day

- Projector: `presenter.html` → **Show join QR** while people arrive, then the *Opening* poll.
- Knowledge checks KC1–KC4 follow deck slides 73, 96, 140 and 156; *W2.4 · SVDP* follows slide 242; room checks close each session.
- **Open** → let the room answer (the stage shows only the number of answers) → **Reveal** (it closes the poll, waits a moment for late answers, then shows the result). **Hide** clears the poll from phones.
- Question wall: tap **Question wall** to open it at the start and close it at the end of the day — while closed, nobody can post or upvote. **Show questions** projects the top eight. Moderate from the left panel (all questions, newest first, not projected): **Hide** takes a question off phones and the projector; a question with any client detail — **Delete** it.

## After the training

- Close the question wall. Firestore → delete the `polls` and `questions` collections and the `control/state` document, or delete the whole project.
- The tools keep working without Firebase. To switch live features off, set `firebaseConfig` back to `null`.

## Data and PDPA

- Participants sign in anonymously; no names, emails or phone numbers are collected, and questions carry no author. Firebase Authentication keeps an anonymous account record per device (Firebase deletes anonymous accounts automatically once they are more than 30 days old), and Google's servers log IP addresses as any web service does.
- Stored in Singapore (asia-southeast1) on Google Firebase: poll choices with a timestamp (readable only by the presenter and the person who voted); question text with a timestamp; and, for each question, the anonymous user IDs of the devices that backed it. Those IDs are visible to anyone in the session — they are random and not linked to a name, but they show which questions one device backed.
- Anonymous sign-in means someone could vote again from a private window — acceptable for training polls.
- The knowledge-check answers ship in the site's code (js/polls.js), so a determined participant could read them before Reveal — acceptable for practice questions; do not reuse these polls as an assessed test.
- Calculator inputs never leave the browser. Fonts and icons are served with the site, except one: the design system's font file asks Google Fonts for a Chinese webfont (Noto Sans SC), so each phone's IP address reaches Google Fonts. Removing it is a change to the B & K Academy Design System source, not to this repo.
