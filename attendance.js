import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getDoc,
  doc
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
const auth = getAuth();

//  Render table
function renderTable(snapshot) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    tableBody.innerHTML += `
      <tr>
        <td>${data.email}</td>
        <td>${data.subject}</td>
        <td>${data.duration}</td>
        <td>${data.time}</td>
        <td>${Math.round(data.distance)} m</td>
      </tr>
    `;
  });
}

// 👨‍🎓 Load student attendance
async function loadStudent(email) {
  const q = query(
    collection(db, "attendance"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);
  renderTable(snapshot);
}

// Load all (teacher)
async function loadAll() {
  const snapshot = await getDocs(collection(db, "attendance"));
  renderTable(snapshot);
}

//  AUTH CHECK + ROLE DETECTION
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // 🔍 Get role from Firestore
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  const role = docSnap.data().role;

  
  if (role === "student") {
    loadStudent(user.email);

    // hide search for students
    document.getElementById("searchEmail").style.display = "none";
    document.getElementById("searchBtn").style.display = "none";

  } else if (role === "teacher") {
    loadAll();
  }

});

// 🔍 SEARCH (Teacher only)
document.getElementById("searchBtn").addEventListener("click", async () => {

  const email = document.getElementById("searchEmail").value;

  if (!email) {
    alert("Enter email");
    return;
  }

  const q = query(
    collection(db, "attendance"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);
  renderTable(snapshot);
});

//  LOGOUT
window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};