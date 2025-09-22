// Enhanced interactions: toast UI, localStorage persistence, OTP countdown, validation, nicer flows.

const loginForm = document.getElementById("login-form");
const profileForm = document.getElementById("profile-form");
const dashboard = document.getElementById("dashboard");

const phoneInput = document.getElementById("phone");
const otpInput = document.getElementById("otp");
const nameInput = document.getElementById("name");
const passwordInput = document.getElementById("password");

const sendOtpBtn = document.getElementById("send-otp");
const verifyOtpBtn = document.getElementById("verify-otp");
const saveProfileBtn = document.getElementById("save-profile");
const payFeeBtn = document.getElementById("pay-fee");
const scanQrBtn = document.getElementById("scan-qr");

const studentNameEl = document.getElementById("student-name");
const feeStatusEl = document.getElementById("fee-status");
const attendanceListEl = document.getElementById("attendance-list");

const STORAGE_KEY = "lib_student_profile";
const OTP_KEY = "lib_otp_code";

let studentData = {
  name: "",
  feePaid: false,
  attendance: [],
};

// simple toast helper (non-blocking)
function showToast(msg, ms = 2500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.zIndex = 9999;
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.background = "rgba(15,23,42,0.9)";
  t.style.color = "white";
  t.style.padding = "10px 14px";
  t.style.marginTop = "8px";
  t.style.borderRadius = "8px";
  t.style.boxShadow = "0 8px 30px rgba(2,6,23,0.2)";
  t.style.fontSize = "0.95rem";
  t.style.opacity = "0";
  t.style.transition = "transform 220ms ease, opacity 220ms ease";
  t.style.transform = "translateY(-6px)";
  container.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateY(0)"; });
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(-6px)";
    setTimeout(() => t.remove(), 240);
  }, ms);
}

// Persist/load profile
function saveProfileToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studentData));
  } catch (e) {
    console.warn("Could not save profile:", e);
  }
}
function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// UI updates
function updateFeeUI() {
  const status = studentData.feePaid ? "Paid" : "Not Paid";
  feeStatusEl.innerHTML = `Fee status: <strong>${status}</strong>`;
  payFeeBtn.textContent = studentData.feePaid ? "Fee Paid ✓" : "Pay ₹500 via UPI";
  if (studentData.feePaid) {
    payFeeBtn.disabled = true;
    payFeeBtn.style.opacity = "0.9";
  } else {
    payFeeBtn.disabled = false;
  }
}

function updateAttendanceUI() {
  attendanceListEl.innerHTML = "";
  if (!studentData.attendance || studentData.attendance.length === 0) {
    const p = document.createElement("p");
    p.className = "help";
    p.textContent = "No attendance recorded yet.";
    attendanceListEl.appendChild(p);
    return;
  }
  // show latest first
  [...studentData.attendance].reverse().forEach(date => {
    const li = document.createElement("li");
    li.textContent = date;
    attendanceListEl.appendChild(li);
  });
}

// helpers
function isValidPhone(v) {
  const s = (v || "").replace(/\D/g, "");
  return s.length >= 10 && s.length <= 15;
}

// OTP flow with countdown
let otpTimer = null;
function startOtpCountdown(seconds = 60) {
  let remaining = seconds;
  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = `Resend OTP (${remaining}s)`;
  otpTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(otpTimer);
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = "Send OTP";
    } else {
      sendOtpBtn.textContent = `Resend OTP (${remaining}s)`;
    }
  }, 1000);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// event handlers

// send OTP
sendOtpBtn.addEventListener("click", () => {
  const phone = phoneInput.value.trim();
  if (!isValidPhone(phone)) {
    showToast("Enter a valid phone number.");
    phoneInput.focus();
    return;
  }
  const otp = generateOtp();
  // store OTP in sessionStorage (mock)
  sessionStorage.setItem(OTP_KEY, otp);
  // start countdown and enable verify
  startOtpCountdown(60);
  verifyOtpBtn.disabled = false;
  showToast("OTP sent (mock). Check console in devtools.");
  // show OTP in console for dev/test
  console.info(`Mock OTP for ${phone}:`, otp);
});

// verify OTP
verifyOtpBtn.addEventListener("click", () => {
  const entered = otpInput.value.trim();
  const stored = sessionStorage.getItem(OTP_KEY);
  if (!stored) {
    showToast("Please request an OTP first.");
    return;
  }
  if (!entered) {
    showToast("Enter the OTP.");
    otpInput.focus();
    return;
  }
  if (entered === stored || entered === "000000") { // allow 000000 as dev master OTP
    // proceed to profile or dashboard
    sessionStorage.removeItem(OTP_KEY);
    loginForm.classList.add("hidden");
    // if profile exists, directly go to dashboard
    const existing = loadProfileFromStorage();
    if (existing && existing.name) {
      studentData = existing;
      studentNameEl.textContent = studentData.name;
      profileForm.classList.add("hidden");
      dashboard.classList.remove("hidden");
      updateAttendanceUI();
      updateFeeUI();
      showToast(`Welcome back, ${studentData.name}`);
    } else {
      profileForm.classList.remove("hidden");
      showToast("OTP verified. Create your profile.");
    }
  } else {
    showToast("Incorrect OTP. Try again.");
  }
});

// save profile
saveProfileBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const pw = passwordInput.value.trim();
  if (!name || !pw) {
    showToast("Please fill all fields.");
    return;
  }
  studentData.name = name;
  studentData.feePaid = studentData.feePaid || false;
  studentData.attendance = studentData.attendance || [];
  saveProfileToStorage();
  profileForm.classList.add("hidden");
  dashboard.classList.remove("hidden");
  studentNameEl.textContent = studentData.name;
  updateAttendanceUI();
  updateFeeUI();
  showToast("Profile saved.");
});

// pay fee (mock)
payFeeBtn.addEventListener("click", () => {
  // simulate payment
  payFeeBtn.disabled = true;
  payFeeBtn.textContent = "Processing...";
  setTimeout(() => {
    studentData.feePaid = true;
    saveProfileToStorage();
    updateFeeUI();
    showToast("Payment successful (mock).");
  }, 900);
});

// scan QR (mock)
scanQrBtn.addEventListener("click", () => {
  if (!studentData.name) {
    showToast("Please login/create profile first.");
    return;
  }
  const today = new Date().toLocaleDateString();
  if (!studentData.attendance.includes(today)) {
    studentData.attendance.push(today);
    saveProfileToStorage();
    updateAttendanceUI();
    showToast("Attendance marked for today.");
  } else {
    showToast("Already marked present today.");
  }
});

// init: check stored profile
(function init() {
  // initialize legacy reCAPTCHA verifier if firebase global is available (per request)
  try {
    if (window.firebase && firebase.auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          console.log("reCAPTCHA verified");
        }
      });
      console.log("reCAPTCHA initialized (legacy firebase.auth.RecaptchaVerifier).");
    }
  } catch (e) {
    console.warn('reCAPTCHA init skipped or not available:', e);
  }

  const existing = loadProfileFromStorage();
  if (existing && existing.name) {
    studentData = existing;
    loginForm.classList.add("hidden");
    profileForm.classList.add("hidden");
    dashboard.classList.remove("hidden");
    studentNameEl.textContent = studentData.name;
    updateAttendanceUI();
    updateFeeUI();
  } else {
    // ensure buttons state
    verifyOtpBtn.disabled = true;
    sendOtpBtn.disabled = false;
  }
})();
