// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize and return a RecaptchaVerifier instance.
// containerId: element id where recaptcha will render (use 'recaptcha-container' for invisible)
function initRecaptcha(containerId = "recaptcha-container", size = "invisible") {
  const container = document.getElementById(containerId) || containerId;
  // remove existing if present
  try { if (window.recaptchaVerifier) window.recaptchaVerifier.clear(); } catch(e){}
  const verifier = new RecaptchaVerifier(container, { size }, auth);
  window.recaptchaVerifier = verifier;
  return verifier;
}

// Send an OTP to the given phone using Firebase Auth.
// phone must be in E.164 format (+<country><number>).
async function sendOtp(phone, verifier = null) {
  if (!verifier) verifier = initRecaptcha();
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
    // caller should keep confirmationResult to confirm OTP
    return confirmationResult;
  } catch (err) {
    // clear invisible recaptcha on error so it can be retried
    try { verifier.clear(); } catch(e){}
    throw err;
  }
}

// Confirm the OTP code with the confirmationResult returned by sendOtp.
// Returns the signed-in user credential.
async function confirmOtp(confirmationResult, code) {
  return confirmationResult.confirm(code);
}

// Firestore helpers for student profiles and attendance

// Save or overwrite profile at doc with id = uid
async function saveProfile(uid, profile = {}) {
  if (!uid) throw new Error("Missing uid");
  const ref = doc(db, "students", uid);
  await setDoc(ref, profile, { merge: true });
  return true;
}

// Get profile doc for uid
async function getProfile(uid) {
  if (!uid) return null;
  const ref = doc(db, "students", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Mark attendance for uid for a dateString (e.g. '2025-09-22' or locale)
// Uses arrayUnion to avoid overwriting existing entries.
async function markAttendance(uid, dateString) {
  if (!uid) throw new Error("Missing uid");
  const ref = doc(db, "students", uid);
  await updateDoc(ref, { attendance: arrayUnion(dateString) });
  return true;
}

// Mark fee paid for uid
async function markFeePaid(uid, info = { amount: 0, method: "upi", paidAt: new Date().toISOString() }) {
  if (!uid) throw new Error("Missing uid");
  const ref = doc(db, "students", uid);
  await updateDoc(ref, { feePaid: true, feeInfo: info });
  return true;
}

export {
  auth,
  db,
  RecaptchaVerifier,
  initRecaptcha,
  sendOtp,
  confirmOtp,
  saveProfile,
  getProfile,
  markAttendance,
  markFeePaid
};
