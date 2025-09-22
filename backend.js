import { auth, initRecaptcha, sendOtp, confirmOtp, saveProfile, getProfile, markAttendance as fbMarkAttendance, markFeePaid } from './firebase.js';

// Render reCAPTCHA on load (uses initRecaptcha from firebase.js)
window.onload = () => {
  try {
    window.recaptchaVerifier = initRecaptcha('recaptcha-container', 'invisible');
  } catch (e) {
    console.warn('Could not initialize reCAPTCHA:', e);
  }
};

// Send OTP (returns Firebase confirmationResult)
export function sendOTP(phoneNumber) {
  const appVerifier = window.recaptchaVerifier || initRecaptcha('recaptcha-container', 'invisible');
  return sendOtp(phoneNumber, appVerifier);
}

// Verify OTP (confirmationResult.confirm -> returns uid)
export async function verifyOTP(confirmationResult, otp) {
  const cred = await confirmOtp(confirmationResult, otp);
  return cred.user.uid;
}

// Create Profile (saves profile document for uid)
export async function createProfile(uid, name, password) {
  return saveProfile(uid, {
    name,
    password,
    feePaid: false,
    attendance: []
  });
}

// Get Student Data
export async function getStudent(uid) {
  return getProfile(uid);
}

// Mark Attendance
export async function markAttendance(uid) {
  return fbMarkAttendance(uid, new Date().toLocaleDateString());
}

// Pay Fee
export async function payFee(uid) {
  const info = { amount: 500, method: "upi", paidAt: new Date().toISOString() };
  return markFeePaid(uid, info);
}
