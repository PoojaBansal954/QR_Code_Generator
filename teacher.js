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


// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
  storageBucket: "attendanceusing-qrcode.firebasestorage.app",
  messagingSenderId: "441995569385",
  appId: "1:441995569385:web:a74f13831444e62d42a878"
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// 🔐 AUTH CHECK + PROFILE LOAD
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (snap.exists()) {
    document.getElementById("name").innerText = snap.data().name;
    document.getElementById("email").innerText = snap.data().email;
  }
});


// 🧭 NAVIGATION
window.goToGenerateQR = () => window.location.href = "teacher.html";
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


// 📦 DROPDOWN
window.toggleMenu = () => {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
};


// 📍 LOCATION
function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}


// 🔳 GENERATE QR + SAVE LECTURE
document.getElementById("generateQRBtn").addEventListener("click", async () => {

  const subject = document.getElementById("subject").value;
  const duration = document.getElementById("duration").value;

  if (!subject || !duration) {
    alert("Please fill all fields ❌");
    return;
  }

  try {
    const position = await getLocation();

    const qrData = {
      subject,
      duration,
      teacherLat: position.coords.latitude,
      teacherLon: position.coords.longitude
    };

    // ✅ SAVE LECTURE
    await addDoc(collection(db, "lectures"), {
      subject,
      duration,
      time: new Date().toLocaleString()
    });

    document.getElementById("qrcode").innerHTML = "";

    QRCode.toCanvas(JSON.stringify(qrData), (err, canvas) => {
      if (!err) {
        document.getElementById("qrcode").appendChild(canvas);
      }
    });

  } catch {
    alert("Location permission required ❌");
  }
});