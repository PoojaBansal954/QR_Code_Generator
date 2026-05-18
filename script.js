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

  if (!user) {
    if (currentPage !== "index.html" && currentPage !== "") return;
    return;
  }

  if (currentPage !== "index.html" && currentPage !== "") return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  const role = snap.data().role?.toLowerCase().trim();

  redirectToRolePage(role);

});

function redirectToRolePage(role) {
  if (role === "teacher") {
    window.location.href = "teacher.html";
  } else if (role === "student") {
    window.location.href = "student.html";
  }
}

function getFriendlyError(error) {
  const code = error?.code || "";
  if (code.includes("auth/email-already-in-use")) return "This email is already registered.";
  if (code.includes("auth/invalid-email")) return "Enter a valid email address.";
  if (code.includes("auth/weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("auth/user-not-found")) return "No account found with this email.";
  if (code.includes("auth/wrong-password")) return "Incorrect password.";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Try again later.";
  return error?.message || "An unexpected error occurred.";
}

let isSignup = false;

const nameField = document.getElementById("name");
const roleField = document.getElementById("role");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const status = document.getElementById("status");
const loginBtn = document.getElementById("loginBtn");
const signupLink = document.getElementById("signupLink");

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loginBtn.click();
  }
});

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

      redirectToRolePage(role);

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

      console.log("Login role:", role);

      // clear inputs
      emailField.value = "";
      passwordField.value = "";

      redirectToRolePage(role);

    }
  } 
  catch (error) {
    status.innerText = getFriendlyError(error);
  }
 });

//  LOGOUT

window.forceLogout = async () => {
  await signOut(auth);
  alert("Logged out successfully");
};