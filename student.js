const Html5QrcodeScanner = window.Html5QrcodeScanner;

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection
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
  storageBucket: "attendanceusing-qrcode.firebasestorage.app",
  messagingSenderId: "441995569385",
  appId: "1:441995569385:web:a74f13831444e62d42a878"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

//  Get location
function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error)
    );
  });
}

// Distance calculation
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

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

//  QR SUCCESS
async function onScanSuccess(decodedText) {

  html5QrcodeScanner.clear();

  document.getElementById("status").innerText = "Processing attendance...";

  const data = JSON.parse(decodedText);

  try {
    const position = await getLocation();

    const studentLat = position.coords.latitude;
    const studentLon = position.coords.longitude;

    //  USE DYNAMIC LOCATION FROM QR
    const teacherLat = data.teacherLat;
    const teacherLon = data.teacherLon;

    const distance = getDistance(
      studentLat,
      studentLon,
      teacherLat,
      teacherLon
    );

    if (distance <= 100) {

      document.getElementById("status").innerText = " Attendance Marked";

      document.getElementById("result").innerHTML = `
        <h3>${data.subject}</h3>
        <p><b>Duration:</b> ${data.duration}</p>
        <p><b>Time:</b> ${new Date().toLocaleString()}</p>
        <p style="color:green;"><b>✓ Present</b></p>
      `;

      await addDoc(collection(db, "attendance"), {
        email: auth.currentUser.email,
        subject: data.subject,
        duration: data.duration,
        time: new Date().toLocaleString(),
        distance: distance
      });

    } else {
      document.getElementById("status").innerText = "❌ Too far from class";

      document.getElementById("result").innerHTML = `
        <p style="color:red;"><b>Attendance Not Marked</b></p>
        <p style="color:red; font-size:12px;">
          You are ${Math.round(distance)}m away.
        </p>
      `;
    }

  } catch (error) {
    document.getElementById("status").innerText = "⚠ Location required";

    document.getElementById("result").innerHTML = `
      <p style="color:orange;"><b>Location permission denied</b></p>
    `;
  }
}

// ignore errors
function onScanError(errorMessage) {}

const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader",
  { fps: 10, qrbox: 250 }
);

html5QrcodeScanner.render(onScanSuccess, onScanError);


window.goToScan = function () {
  window.location.href = "student.html";
};

window.goToAttendance = function () {
  window.location.href = "attendance.html";
};

window.logout = function () {
  isLoggingOut = true;

  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};