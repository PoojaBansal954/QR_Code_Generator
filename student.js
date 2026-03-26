const Html5QrcodeScanner = window.Html5QrcodeScanner;
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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

function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error)
    );
  });
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function onScanSuccess(decodedText) {

  html5QrcodeScanner.clear();

  const data = JSON.parse(decodedText);

  document.getElementById("result").innerText = decodedText;

  try {
    const position = await getLocation();

    const studentLat = position.coords.latitude;
    const studentLon = position.coords.longitude;

    const teacherLat = 28.6139;
    const teacherLon = 77.2090;

    const distance = getDistance(
      studentLat,
      studentLon,
      teacherLat,
      teacherLon
    );

    if (distance <= 50) {

      alert("Attendance Marked ✅");

      await addDoc(collection(db, "attendance"), {
        subject: data.subject,
        duration: data.duration,
        time: new Date().toLocaleString(),
        distance: distance
      });

    } else {
      alert("Too far ❌");
    }

  } catch (error) {
    alert("Location permission required ❌");
  }
}

    function onScanError(errorMessage) {
      // ignore errors
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 }
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);

