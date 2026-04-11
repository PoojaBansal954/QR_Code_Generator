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
  storageBucket: "attendanceusing-qrcode.firebasestorage.app",
  messagingSenderId: "441995569385",
  appId: "1:441995569385:web:a74f13831444e62d42a878"
};

// 🔥 Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ======================
// 🎯 SIGNUP FUNCTION
// ======================
async function signup() {

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  const status = document.getElementById("status");

  // Validation
  if (!name || !email || !password || !role) {
    status.innerText = "⚠ Please fill all fields";
    return;
  }

  try {
    status.innerText = "⏳ Creating account...";

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user data
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role
    });

    status.innerText = "✅ Account created successfully";

    // Redirect
    if (role === "student") {
      window.location.href = "student.html";
    } else {
      window.location.href = "teacher.html";
    }

  } catch (error) {
    status.innerText = error.message;
  }
}


// ======================
// 🎯 LOGIN FUNCTION
// ======================
async function login() {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const status = document.getElementById("status");

  if (!email || !password) {
    status.innerText = "⚠ Enter email & password";
    return;
  }

  try {
    status.innerText = "⏳ Logging in...";

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();

      status.innerText = "✅ Login successful";

      if (userData.role === "student") {
        window.location.href = "student.html";
      } else {
        window.location.href = "teacher.html";
      }
    }

  } catch (error) {
    status.innerText = error.message;
  }
}


// ======================
// 🎯 EVENT LISTENERS
// ======================

// Login button
document.getElementById("loginBtn").addEventListener("click", login);

// Create Account (span click)
document.getElementById("signupLink").addEventListener("click", signup);