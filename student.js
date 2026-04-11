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
let html5QrCode;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) currentName = snap.data().name;

  document.getElementById("profileEmail").innerText = user.email;
  document.getElementById("profileInitial").innerText =
    user.email.charAt(0).toUpperCase();

  startScanner(); 
});

function startScanner() {
  html5QrCode = new Html5Qrcode("reader");

  Html5Qrcode.getCameras().then(devices => {
    if (!devices || devices.length === 0) {
      document.getElementById("status").innerText = "No camera found";
      return;
    }

    const backCamera =
      devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear")
      ) || devices[0];

    html5QrCode.start(
      backCamera.id,
      {
        fps: 10,
        qrbox: 250
      },
      onScanSuccess
    ).catch(err => {
      console.error(err);
      document.getElementById("status").innerText = "Camera error";
    });

  });
}

async function onScanSuccess(decodedText) {
  try {
    document.getElementById("status").innerText = "Processing...";

    const data = JSON.parse(decodedText);

    const position = await getLocation();

    const distance = getDistance(
      position.coords.latitude,
      position.coords.longitude,
      data.teacherLat,
      data.teacherLon
    );

    if (distance > 100) {
      document.getElementById("status").innerText = "Too far";
      return;
    }

    document.getElementById("status").innerText = "Attendance marked";

    await addDoc(collection(db, "attendance"), {
      name: currentName,
      email: currentUser.email,
      subject: data.subject,
      duration: data.duration,
      time: new Date().toLocaleString(),
      distance: distance
    });

  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Invalid QR";
  }
}

function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

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

window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};