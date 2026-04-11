import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// 🔥 Firebase
const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 📋 TABLE RENDER
function renderTable(snapshot) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    tableBody.innerHTML += `
      <tr>
        <td>${data.name || "N/A"}</td>   <!-- ✅ Name -->
        <td>${data.email}</td>          <!-- ✅ Email -->
        <td>${data.subject}</td>
        <td>${data.duration}</td>
        <td>${data.time}</td>
        <td>${Math.round(data.distance)} m</td>
      </tr>
    `;
  });
}

// 📊 STATS CALCULATION
function generateStats(snapshot) {

  const stats = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const subject = data.subject;

    if (!stats[subject]) {
      stats[subject] = { total: 0, attended: 0 };
    }

    stats[subject].attended += 1;
  });

  // ❗ Since we don’t have lectures collection,
  // we assume total = attended (can upgrade later)
  Object.keys(stats).forEach(sub => {
    stats[sub].total = stats[sub].attended;
  });

  renderStats(stats);
}

// 🎯 RENDER STATS UI
function renderStats(stats) {
  const container = document.getElementById("statsContainer");
  container.innerHTML = "";

  for (let subject in stats) {
    const { total, attended } = stats[subject];

    const percent = total === 0 ? 0 :
      Math.round((attended / total) * 100);

    container.innerHTML += `
      <div class="card">
        <h3>${subject}</h3>
        <p>Total: ${total}</p>
        <p>Attended: ${attended}</p>
        <p><b>${percent}%</b></p>
      </div>
    `;
  }
}

// 👨‍🎓 STUDENT DATA
async function loadStudent(email) {
  const q = query(
    collection(db, "attendance"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);

  renderTable(snapshot);
  generateStats(snapshot);
}

// 👩‍🏫 TEACHER DATA
async function loadAll() {
  const snapshot = await getDocs(collection(db, "attendance"));

  renderTable(snapshot);
  generateStats(snapshot);
}

// 🔐 AUTH + PROFILE
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // 👤 Profile UI
  document.getElementById("profileEmail").innerText = user.email;
  document.getElementById("profileInitial").innerText =
    user.email.charAt(0).toUpperCase();

  // 🔍 Role check
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  const role = docSnap.data().role;

  if (role === "student") {

    loadStudent(user.email);

    // hide search
    document.getElementById("searchEmail").style.display = "none";
    document.getElementById("searchBtn").style.display = "none";

  } else {
    loadAll();
  }
});

// 🔍 SEARCH (Teacher)
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
  generateStats(snapshot);
});

// 🚪 LOGOUT
window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};