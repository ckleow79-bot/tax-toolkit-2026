# Setup — Tax Compliance Toolkit 2026

The eight tools work as soon as GitHub Pages is on. The live polls and question wall need a free Firebase project — about 15 minutes, once, on a laptop signed in to your Google account.

**Cost:** nil. Firebase's Spark plan is free and needs no credit card. Its free limits (Firestore: 50,000 reads, 20,000 writes and 20,000 deletes a day; 1 GiB stored) are far above what 35 participants use in a day. If a limit were ever hit, Firebase stops that service until the quota resets — it never charges on Spark. Do not link a billing account; that upgrades the project to the paid Blaze plan.

## Status — done on 3 Nov 2026

Steps A–F below are already done for project `tax-toolkit-2026` (ID `tax-toolkit-2026-fc234`):
Firestore created in asia-southeast1 (production mode) · Anonymous sign-in on (auto clean-up after 30 days) · Google sign-in on for the presenter · `ckleow79-bot.github.io` authorised · rules published with the presenter's Google email · web app registered and `firebase-config.js` filled in · GitHub Pages on.

The presenter signs in on `presenter.html` with **Sign in with Google**. Only the Google account named in the published rules (verified email) can open, close and reveal polls or delete questions; any other account can sign in but every control is refused.

To change the presenter: Firestore Database → Rules → change the email in `presenter()` → Publish.

For a new project from scratch: create the project (Analytics off) → Firestore in asia-southeast1, production mode → Authentication: enable Anonymous and Google → add your Pages domain under Authorized domains → paste `firestore.rules` with `PRESENTER_EMAIL` replaced (lower case) → Publish → register a Web app and paste its config into `firebase-config.js` → GitHub Settings → Pages → main / root.

## G. Test with two devices (5 minutes)

1. Laptop: open `presenter.html` → **Sign in with Google** with the presenter account.
2. Phone: open the site → **Live**.
3. Presenter: pick *KC1 · RPGT* question 1 → **Open**. Answer on the phone; the presenter shows "1 answer".
4. Presenter: **Reveal** — the phone shows the result and the verdict.
5. Phone: post a test question and tap ▲. Presenter: **Show questions** → it appears → **Delete** it.
6. Presenter: **Show join QR** — this is what goes on the projector at the start.

If the phone says "not connected", check step E. If the presenter's controls are refused, check the email in the published rules matches the Google account exactly, in lower case.

## On the day

- Projector: `presenter.html` → **Show join QR** while people arrive, then the *Opening* poll.
- Knowledge checks KC1–KC4 follow deck slides 73, 96, 140 and 156; *W2.4 · SVDP* follows slide 242; room checks close each session.
- **Open** → let the room answer → **Reveal** (it closes the poll, waits a moment for late answers, then shows the result). **Hide** clears the poll from phones.
- Question wall: **Show questions** before each break. A question with any client detail: **Delete** it (Hide only hides it from the projector list — it stays readable on phones).

## After the training

- Firestore → delete the `polls` and `questions` collections, or delete the whole project.
- The tools keep working without Firebase. To switch live features off, set `firebaseConfig` back to `null`.

## Data and PDPA

- Participants sign in anonymously; no names, emails or phone numbers are collected, and questions carry no author.
- Stored: poll choices (readable only by the presenter and the person who voted), question text and upvote counts, in Singapore (asia-southeast1) on Google Firebase.
- Anonymous sign-in means someone could vote again from a private window — acceptable for training polls.
- Calculator inputs never leave the browser. Fonts and icons are served with the site; the design system also requests a Chinese webfont from Google Fonts, which sees the device's IP address.
