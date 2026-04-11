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

const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

function renderTable(snapshot) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    tableBody.innerHTML += `
      <tr>
        <td>${data.name || "N/A"}</td>
        <td>${data.email}</td>
        <td>${data.subject}</td>
        <td>${data.duration}</td>
        <td>${data.time}</td>
        <td>${Math.round(data.distance || 0)} m</td>
      </tr>
    `;
  });
}

function generateStats(snapshot) {

  const stats = {};
  let totalLectures = 0;
  let totalAttended = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const subject = data.subject;

    totalLectures++;
    totalAttended++;

    if (!stats[subject]) {
      stats[subject] = { total: 0, attended: 0 };
    }

    stats[subject].total++;
    stats[subject].attended++;
  });

  renderStats(stats, totalLectures, totalAttended);
}

function renderStats(stats, totalLectures, totalAttended) {

  const container = document.getElementById("statsContainer");
  container.innerHTML = "";

  const percent = totalLectures === 0 ? 0 :
    Math.round((totalAttended / totalLectures) * 100);

  container.innerHTML += `
    <div class="card">
      <h3>Total Lectures</h3>
      <p>${totalLectures}</p>
    </div>

    <div class="card">
      <h3>Attended</h3>
      <p>${totalAttended}</p>
    </div>

    <div class="card">
      <h3>Attendance %</h3>
      <p>${percent}%</p>
    </div>
  `;

  for (let subject in stats) {
    const { total, attended } = stats[subject];

    const p = total === 0 ? 0 :
      Math.round((attended / total) * 100);

    container.innerHTML += `
      <div class="card">
        <h4>${subject}</h4>
        <p>${attended} / ${total}</p>
        <p>${p}%</p>
      </div>
    `;
  }
}

async function loadStudent(email) {
  const q = query(
    collection(db, "attendance"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);

  renderTable(snapshot);
  generateStats(snapshot);
}

async function loadAll() {
  const snapshot = await getDocs(collection(db, "attendance"));

  renderTable(snapshot);
  generateStats(snapshot);
}

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  const emailEl = document.getElementById("profileEmail");
  const initialEl = document.getElementById("profileInitial");

  if (emailEl) emailEl.innerText = user.email;
  if (initialEl) initialEl.innerText = user.email.charAt(0).toUpperCase();

  const docSnap = await getDoc(doc(db, "users", user.uid));

  if (!docSnap.exists()) return;

  const role = docSnap.data().role;

  if (role === "student") {

    loadStudent(user.email);

    // hide search safely
    const searchInput = document.getElementById("searchEmail");
    const searchBtn = document.getElementById("searchBtn");

    if (searchInput) searchInput.style.display = "none";
    if (searchBtn) searchBtn.style.display = "none";

  } else {
    loadAll();
  }
});

const searchBtn = document.getElementById("searchBtn");

if (searchBtn) {
  searchBtn.addEventListener("click", async () => {

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
}

window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};