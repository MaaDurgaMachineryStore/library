// firebase.js

// Import Firebase (CDN style for plain HTML/JS projects)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.2.0/firebase-firestore.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAVcQjztnHUAZCF9MJodeoL7fh0s8X9V4I",
  authDomain: "otp-9984.firebaseapp.com",
  projectId: "otp-9984",
  storageBucket: "otp-9984.firebasestorage.app",
  messagingSenderId: "452360755693",
  appId: "1:452360755693:web:818b2b715cc05164a16fe4",
  measurementId: "G-GL7RQXPNKB"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ----------------------
// Recaptcha + OTP Helpers
// ----------------------
function initRecaptcha(containerId = "recaptcha-container", size = "invisible") {
  const container = document.getElementById(containerId) || containerId;
  try { if (window.recaptchaVerifier) window.recaptchaVerifier.clear(); } catch (e) {}
  const verifier = new RecaptchaVerifier(container, { size }, auth);
  window.recaptchaVerifier = verifier;
  return verifier;
}

async function sendOtp(phone, verifier = null) {
  if (!verifier) verifier = initRecaptcha();
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
    return confirmationResult; // Keep this to confirm OTP later
  } catch (err) {
    try { verifier.clear(); } catch (e) {}
    throw err;
  }
}

async function confirmOtp(confirmationResult, code) {
  return confirmationResult.confirm(code);
}

// ----------------------
// Firestore Helpers
// ----------------------
async function saveProfile(uid, profile = {}) {
  const ref = doc(db, "students", uid);
  await setDoc(ref, profile, { merge: true });
  return true;
}

async function getProfile(uid) {
  const ref = doc(db, "students", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function markAttendance(uid, dateString) {
  const ref = doc(db, "students", uid);
  await updateDoc(ref, { attendance: arrayUnion(dateString) });
  return true;
}

async function markFeePaid(uid, info = { amount: 0, method: "upi", paidAt: new Date().toISOString() }) {
  const ref = doc(db, "students", uid);
  await updateDoc(ref, { feePaid: true, feeInfo: info });
  return true;
}

export {
  auth,
  db,
  initRecaptcha,
  sendOtp,
  confirmOtp,
  saveProfile,
  getProfile,
  markAttendance,
  markFeePaid
};
