// Firebase loader — returns null when no config is set, so the toolkit works without live features.
import { firebaseConfig } from "../firebase-config.js";
const V = "10.12.5";
let cached = null;
export async function fb() {
  if (!firebaseConfig || !firebaseConfig.apiKey) return null;
  if (cached) return cached;
  const [app, auth, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const a = app.initializeApp(firebaseConfig);
  cached = { auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
  return cached;
}
