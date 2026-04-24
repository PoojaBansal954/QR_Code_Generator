import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getFirestore,
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
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

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {

  // ❌ If NOT logged in → stay on login page
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) return;

  const role = snap.data().role?.toLowerCase().trim();

  console.log("AUTO LOGIN ROLE:", role);

  const currentPage = window.location.pathname;

  // ✅ ONLY redirect if user is on login page
  if (currentPage.includes("index.html") || currentPage === "/") {

    if (role === "student") {
      window.location.href = "student.html";

    } else if (role === "teacher") {
      window.location.href = "teacher.html";
    }
  }
});

// 🔄 MODE CONTROL
let isSignup = false;

// UI Elements
const nameField = document.getElementById("name");
const roleField = document.getElementById("role");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const status = document.getElementById("status");
const loginBtn = document.getElementById("loginBtn");
const signupLink = document.getElementById("signupLink");

// =========================
// 🔄 TOGGLE LOGIN / SIGNUP
// =========================
signupLink.addEventListener("click", () => {

  isSignup = !isSignup;

  if (isSignup) {
    nameField.style.display = "block";
    roleField.style.display = "block";
    loginBtn.innerText = "Create Account";
    signupLink.innerText = "Already have an account? Login";
  } else {
    nameField.style.display = "none";
    roleField.style.display = "none";
    loginBtn.innerText = "Login";
    signupLink.innerText = "Don't have an account? Create Account";
  }

  status.innerText = "";
});

// =========================
// 🚀 MAIN BUTTON (LOGIN / SIGNUP)
// =========================
loginBtn.addEventListener("click", async () => {

  const email = emailField.value.trim();
  const password = passwordField.value.trim();

  if (!email || !password) {
    status.innerText = "⚠ Enter email & password";
    return;
  }

  try {

    // =========================
    // 🔐 SIGNUP FLOW
    // =========================
    if (isSignup) {

      const name = nameField.value.trim();
      const role = roleField.value.trim().toLowerCase();

      if (!name || !role) {
        status.innerText = "⚠ Fill all fields";
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Save user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: role
      });

      status.innerText = "✅ Account created";

      // Redirect
      if (role === "student") {
        window.location.href = "student.html";
      } else if (role === "teacher") {
        window.location.href = "teacher.html";
      } else {
        status.innerText = "❌ Invalid role";
      }

    }

    // =========================
    // 🔐 LOGIN FLOW
    // =========================
    else {

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        status.innerText = "❌ User data missing";
        return;
      }

      const role = snap.data().role?.toLowerCase().trim();

      status.innerText = "✅ Login successful";

      // 🔥 STRICT ROLE CHECK
      if (role === "student") {
        window.location.href = "student.html";

      } else if (role === "teacher") {
        window.location.href = "teacher.html";

      } else {
        status.innerText = "❌ Invalid role in database";
      }
    }

  } catch (error) {
    status.innerText = error.message;
  }

});