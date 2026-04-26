import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// 🔥 Firebase
const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// =========================
// 🔐 AUTH CHECK
// =========================
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    window.location.href = "index.html";
    return;
  }

  const data = snap.data();
  const role = data.role?.toLowerCase().trim();

  // ❌ Block non-teacher
  if (role !== "teacher") {
    window.location.href = "student.html";
    return;
  }

  // 👤 UI (safe)
  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");

  if (nameEl) nameEl.innerText = data.name;
  if (emailEl) emailEl.innerText = data.email;
});

// =========================
// 🚪 LOGOUT
// =========================
window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

window.goToAttendance = () => {
  window.location.href = "attendance.html";
};


// =========================
// 🌙 DARK MODE
// =========================
window.toggleDark = () => {
  document.body.classList.toggle("dark");
};

// =========================
// 👤 MENU
// =========================
window.toggleMenu = () => {
  const menu = document.getElementById("menu");
  if (menu) {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
};

// =========================
// 📍 LOCATION
// =========================
function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// =========================
// ⏳ QR TIMER
// =========================
let qrTimeout = null;

function startExpiryTimer(expiryTime) {

  clearInterval(qrTimeout);

  const timerEl = document.getElementById("qrTimer");

  if (!timerEl) return;

  qrTimeout = setInterval(() => {

    const remaining = expiryTime - Date.now();

    if (remaining <= 0) {
      timerEl.innerText = "QR Expired ❌";
      clearInterval(qrTimeout);

      const qrBox = document.getElementById("qrcode");
      if (qrBox) qrBox.innerHTML = "";

      return;
    }

    const seconds = Math.floor(remaining / 1000);
    timerEl.innerText = `Expires in ${seconds}s`;

  }, 1000);
}

// =========================
// 🚀 INIT AFTER DOM LOAD
// =========================
document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("generateQRBtn");

  if (!btn) {
    console.error("generateQRBtn not found");
    return;
  }

  btn.addEventListener("click", generateQR);
});

// =========================
// 🎯 GENERATE QR
// =========================
async function generateQR() {

  const subject = document.getElementById("subject")?.value.trim();
  const duration = document.getElementById("duration")?.value.trim();

  if (!subject || !duration) {
    alert("Please fill all fields ❌");
    return;
  }

  try {

    const position = await getLocation();

    const expiryTime = Date.now() + 2 * 60 * 1000;

    const qrData = {
      subject,
      duration,
      teacherLat: position.coords.latitude,
      teacherLon: position.coords.longitude,
      expiry: expiryTime
    };

    // 🔥 Save lecture
    await addDoc(collection(db, "lectures"), {
      subject,
      duration,
      createdBy: currentUser.email,
      time: new Date().toLocaleString(),
      expiry: expiryTime
    });

    // 🎥 Generate QR
    const qrBox = document.getElementById("qrcode");
    if (qrBox) qrBox.innerHTML = "";

    if (typeof QRCode === "undefined") {
      alert("QR library missing ❌");
      return;
    }

    QRCode.toCanvas(JSON.stringify(qrData), (err, canvas) => {
      if (!err && qrBox) {
        qrBox.appendChild(canvas);
      }
    });

    startExpiryTimer(expiryTime);

  } catch (err) {
    console.error(err);
    alert("Location permission required ❌");
  }
}