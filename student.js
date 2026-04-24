import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getFirestore,
  addDoc,
  collection,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔐 GLOBAL STATE
let currentUser = null;
let currentName = "";
let html5QrCode = null;
let scanning = false;

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

  // ❌ Block teacher
  if (role !== "student") {
    window.location.href = "teacher.html";
    return;
  }

  currentName = data.name || "User";

  // 👤 Profile UI
  document.getElementById("profileEmail").innerText = user.email;
  document.getElementById("profileInitial").innerText =
    user.email.charAt(0).toUpperCase();

  // 🎥 Start scanner
  startScanner();
});

// =========================
// 🎥 START SCANNER (BACK CAMERA)
// =========================
async function startScanner() {

  if (scanning) return;

  html5QrCode = new Html5Qrcode("reader");

  try {
    const devices = await Html5Qrcode.getCameras();

    if (!devices || devices.length === 0) {
      document.getElementById("status").innerText = "No camera found ❌";
      return;
    }

    console.log("Cameras:", devices);

    // 🔥 Prefer BACK camera
    const backCamera =
      devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear")
      ) || devices[devices.length - 1];

    console.log("Using camera:", backCamera.label);

    await html5QrCode.start(
      backCamera.id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      onScanSuccess
    );

    scanning = true;

  } catch (err) {
    console.error("Camera error:", err);
    document.getElementById("status").innerText = "Camera error ❌";
  }
}

// =========================
// 🧠 QR SUCCESS HANDLER
// =========================
async function onScanSuccess(decodedText) {

  if (!scanning) return;

  scanning = false;

  try {
    document.getElementById("status").innerText = "Processing...";

    // 🔥 Stop scanner after scan
    await html5QrCode.stop();
    await html5QrCode.clear();

    const data = JSON.parse(decodedText);

    const position = await getLocation();

    const distance = getDistance(
      position.coords.latitude,
      position.coords.longitude,
      data.teacherLat,
      data.teacherLon
    );

    // ❌ Distance check
    if (distance > 100) {
      document.getElementById("status").innerText =
        `❌ Too far (${Math.round(distance)}m)`;

      restartScanner();
      return;
    }

    // ✅ SUCCESS UI
    document.getElementById("status").innerText = "✅ Attendance Marked";

    document.getElementById("result").innerHTML = `
      <h3>${data.subject}</h3>
      <p><b>Time:</b> ${new Date().toLocaleString()}</p>
      <p style="color:green;"><b>✔ Present</b></p>
    `;

    // 🔥 SAVE TO FIRESTORE
    await addDoc(collection(db, "attendance"), {
      name: currentName,
      email: currentUser.email,
      subject: data.subject,
      duration: data.duration,
      time: new Date().toLocaleString(),
      distance: distance
    });

  } catch (err) {
    console.error("Scan error:", err);
    document.getElementById("status").innerText = "❌ Invalid QR";

    restartScanner();
  }
}

// =========================
// 🔁 RESTART SCANNER
// =========================
function restartScanner() {
  setTimeout(() => {
    scanning = false;
    startScanner();
  }, 2000);
}

// =========================
// 📍 LOCATION
// =========================
function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// =========================
// 📏 DISTANCE CALCULATION
// =========================
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// =========================
// 🔁 NAVIGATION
// =========================
window.goToAttendance = () => {
  window.location.href = "attendance.html";
};

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
// 👤 PROFILE DROPDOWN
// =========================
window.toggleProfile = () => {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
};