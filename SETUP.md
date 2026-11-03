# Setup — Tax Compliance Toolkit 2026

The eight tools work as soon as GitHub Pages is on. The live polls and question wall need a free Firebase project — about 15 minutes, once, on a laptop signed in to your Google account.

**Cost:** nil. Firebase's Spark plan is free and needs no credit card. Its free limits (Firestore: 50,000 reads, 20,000 writes and 20,000 deletes a day; 1 GiB stored) are far above what 35 participants use in a day. If a limit were ever hit, Firebase stops that service until the quota resets — it never charges on Spark. Do not link a billing account; that upgrades the project to the paid Blaze plan.

## A. Create the project

1. Open <https://console.firebase.google.com> → **Create a project** (or **Add project**).
2. Name: `tax-toolkit-2026` → accept the terms → Continue.
3. Turn **Google Analytics off** → **Create project**.

## B. Create the database

1. Left menu **Build → Firestore Database → Create database**.
2. Location: **asia-southeast1 (Singapore)** — this cannot be changed later.
3. **Start in production mode** → **Create**.

## C. Turn on sign-in

1. **Build → Authentication → Get started → Sign-in method**.
2. **Anonymous** → Enable → Save (participants).
3. **Email/Password** → enable the first switch only → Save (you, the presenter).
4. **Users** tab → **Add user** → your email **in lower case** and a strong password → Add user.
5. **Settings → Authorized domains → Add domain** → `ckleow79-bot.github.io`.
6. **Settings → User actions** → if "Enable create (sign-up)" is shown, **untick it**, so no one else can create an email/password account.

## D. Paste the security rules

1. **Firestore Database → Rules** → delete everything.
2. Paste the whole of `firestore.rules` from this repo.
3. Replace `PRESENTER_EMAIL` with the email from C4, **in lower case**, keeping the quotes.
4. **Publish**.

## E. Connect the website

1. Gear icon → **Project settings → General** → *Your apps* → **`</>` (Web)**.
2. Nickname `toolkit` → do **not** tick Firebase Hosting → **Register app**.
3. Copy the `firebaseConfig = { … }` object.
4. In GitHub open `firebase-config.js` → pencil (Edit) → replace `null` with the object, so the line reads `export const firebaseConfig = { apiKey: "…", … };` → **Commit changes**.

The web config is designed to be public — the rules in step D are what protect the data.

## F. Turn on GitHub Pages

1. Repo **Settings → Pages** → Source **Deploy from a branch** → Branch **main**, folder **/ (root)** → **Save**.
2. After a minute or two the site is live at `https://ckleow79-bot.github.io/tax-toolkit-2026/`; the presenter view is `…/tax-toolkit-2026/presenter.html`.

Free GitHub Pages needs a public repository, so the toolkit's pages and code are readable by anyone with the link. No client data is in it.

## G. Test with two devices (5 minutes)

1. Laptop: open `presenter.html` → sign in.
2. Phone: open the site → **Live**.
3. Presenter: pick *KC1 · RPGT* question 1 → **Open**. Answer on the phone; the presenter shows "1 answer".
4. Presenter: **Reveal** — the phone shows the result and the verdict.
5. Phone: post a test question and tap ▲. Presenter: **Show questions** → it appears → **Delete** it.
6. Presenter: **Show join QR** — this is what goes on the projector at the start.

If the phone says "not connected", check step E. If votes are refused, check the email in step D matches C4 exactly, in lower case.

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
