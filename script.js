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
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

//  Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


onAuthStateChanged(auth, async (user) => {

  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage !== "index.html" && currentPage !== "") return;

  //  If user not logged in → do nothing
  if (!user) return;

  //  ONLY redirect if explicitly logged in now
  const justLoggedIn = sessionStorage.getItem("justLoggedIn");

  if (!justLoggedIn) {
    return;
  }

  sessionStorage.removeItem("justLoggedIn");

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  const role = snap.data().role?.toLowerCase().trim();

  if (role === "teacher") {
    window.location.href = "teacher.html";
  } else if (role === "student") {
    window.location.href = "student.html";
  }

});

let isSignup = false;

const nameField = document.getElementById("name");
const roleField = document.getElementById("role");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const status = document.getElementById("status");
const loginBtn = document.getElementById("loginBtn");
const signupLink = document.getElementById("signupLink");

// TOGGLE LOGIN / SIGNUP

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

//  LOGIN / SIGNUP

loginBtn.addEventListener("click", async () => {

  const email = emailField.value.trim();
  const password = passwordField.value.trim();

  if (!email || !password) {
    status.innerText = "⚠ Enter email & password";
    return;
  }

  try {

    //  SIGNUP

    if (isSignup) {

      const name = nameField.value.trim();
      const role = roleField.value?.trim().toLowerCase();

      if (!name) {
        status.innerText = "⚠ Enter your name";
        return;
      }

      if (!role) {
        status.innerText = "⚠ Select a role";
        return;
      }

      if (role !== "student" && role !== "teacher") {
        status.innerText = "⚠ Invalid role";
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role
      });


      // clear fields
      emailField.value = "";
      passwordField.value = "";
      nameField.value = "";
      roleField.value = "";

      sessionStorage.setItem("justLoggedIn", "true");

    }

    // LOGIN

    else {

  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    status.innerText = "User data missing";
    return;
  }

  const role = snap.data().role?.toLowerCase().trim();

  if (!role || (role !== "student" && role !== "teacher")) {
    status.innerText = "Invalid role";
    return;
  }

  sessionStorage.setItem("justLoggedIn", "true");

  console.log("Login role:", role);

  // clear inputs
  emailField.value = "";
  passwordField.value = "";


    }
  } 
  catch (error) {
    sessionStorage.removeItem("justLoggedIn");
    status.innerText = error.message;
  }
 });

//  LOGOUT

window.forceLogout = async () => {
  await signOut(auth);
  alert("Logged out successfully");
};