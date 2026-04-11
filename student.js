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

// QR Scanner
const Html5QrcodeScanner = window.Html5QrcodeScanner;

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let currentName = "";

// ✅ AUTH STATE
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;

    // 🔥 Get name from Firestore
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      currentName = snap.data().name;
    }

    // 👤 Profile UI
    document.getElementById("profileEmail").innerText = user.email;
    document.getElementById("profileInitial").innerText =
      user.email.charAt(0).toUpperCase();

  } else {
    window.location.href = "index.html";
  }
});

// 📍 GET LOCATION
function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// 📏 DISTANCE CALCULATION
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

// ✅ QR SCAN SUCCESS
async function onScanSuccess(decodedText) {

  html5QrcodeScanner.clear();
  document.getElementById("status").innerText = "Processing...";

  const data = JSON.parse(decodedText);

  try {
    const position = await getLocation();

    const distance = getDistance(
      position.coords.latitude,
      position.coords.longitude,
      data.teacherLat,
      data.teacherLon
    );

    if (distance <= 100) {

      document.getElementById("status").innerText = "✅ Attendance Marked";

      document.getElementById("result").innerHTML = `
        <h3>${data.subject}</h3>
        <p><b>Duration:</b> ${data.duration}</p>
        <p><b>Time:</b> ${new Date().toLocaleString()}</p>
        <p style="color:green;"><b>✓ Present</b></p>
      `;

      // 🔥 SAVE ATTENDANCE (UPDATED)
     await addDoc(collection(db, "attendance"), {
  name: currentName, // ✅ ADD THIS
  email: currentUser.email,
  subject: data.subject,
  duration: data.duration,
  time: new Date().toLocaleString(),
  distance: distance
      });

    } else {
      document.getElementById("status").innerText = "❌ Too far";

      document.getElementById("result").innerHTML = `
        <p style="color:red;">You are ${Math.round(distance)}m away</p>
      `;
    }

  } catch {
    document.getElementById("status").innerText = "⚠ Allow location";
  }
}

// 🎥 INIT SCANNER (BACK CAMERA)
const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader",
  {
    fps: 10,
    qrbox: 250,
    facingMode: { exact: "environment" } // 🔥 BACK CAMERA
  }
);

html5QrcodeScanner.render(onScanSuccess);

// 🔁 NAVIGATION
window.goToScan = () => window.location.href = "student.html";
window.goToAttendance = () => window.location.href = "attendance.html";

// 🚪 LOGOUT
window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// 🌙 DARK MODE
window.toggleDark = () => {
  document.body.classList.toggle("dark");
};

// 👤 PROFILE DROPDOWN
window.toggleProfile = () => {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
};