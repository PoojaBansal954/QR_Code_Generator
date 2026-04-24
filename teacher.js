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

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 GLOBAL STATE
let currentUser = null;

// =========================
// 🔐 AUTH + ROLE PROTECTION
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

  // ❌ Block students
  if (role !== "teacher") {
    window.location.href = "student.html";
    return;
  }

  // 👤 UI
  document.getElementById("name").innerText = data.name;
  document.getElementById("email").innerText = data.email;
});

// =========================
// 🔁 NAVIGATION
// =========================
window.goToGenerateQR = () => window.location.href = "teacher.html";
window.goToAttendance = () => window.location.href = "attendance.html";

// =========================
// 🚪 LOGOUT
// =========================
window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// =========================
// 🌙 DARK MODE
// =========================
window.toggleDark = () => {
  document.body.classList.toggle("dark");
};

// =========================
// 👤 DROPDOWN MENU
// =========================
window.toggleMenu = () => {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};

// =========================
// 📍 GET LOCATION
// =========================
function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// =========================
// ⏳ QR EXPIRY TIMER (NEW)
// =========================
let qrTimeout = null;

function startExpiryTimer(expiryTime) {

  clearInterval(qrTimeout);

  const timerEl = document.getElementById("qrTimer");

  qrTimeout = setInterval(() => {

    const remaining = expiryTime - Date.now();

    if (remaining <= 0) {
      timerEl.innerText = "QR Expired ❌";
      clearInterval(qrTimeout);
      document.getElementById("qrcode").innerHTML = "";
      return;
    }

    const seconds = Math.floor(remaining / 1000);
    timerEl.innerText = `Expires in ${seconds}s`;

  }, 1000);
}

// =========================
// 🎯 GENERATE QR
// =========================
document.getElementById("generateQRBtn").addEventListener("click", async () => {

  const subject = document.getElementById("subject").value.trim();
  const duration = document.getElementById("duration").value.trim();

  if (!subject || !duration) {
    alert("Please fill all fields ❌");
    return;
  }

  try {

    const position = await getLocation();

    // ⏳ Expiry: 2 minutes
    const expiryTime = Date.now() + 2 * 60 * 1000;

    const qrData = {
      subject,
      duration,
      teacherLat: position.coords.latitude,
      teacherLon: position.coords.longitude,
      expiry: expiryTime // 🔥 IMPORTANT
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
    document.getElementById("qrcode").innerHTML = "";

    QRCode.toCanvas(JSON.stringify(qrData), (err, canvas) => {
      if (!err) {
        document.getElementById("qrcode").appendChild(canvas);
      }
    });

    // ⏳ Start timer UI
    startExpiryTimer(expiryTime);

  } catch (err) {
    console.error(err);
    alert("Location permission required ❌");
  }
});