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


const firebaseConfig = {
  apiKey: "AIzaSyByRlvtD2ifvCImgiHtvMzoDy9d7DSzfMs",
  authDomain: "attendanceusing-qrcode.firebaseapp.com",
  projectId: "attendanceusing-qrcode",
  storageBucket: "attendanceusing-qrcode.firebasestorage.app",
  messagingSenderId: "441995569385",
  appId: "1:441995569385:web:a74f13831444e62d42a878"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

//Create account
window.signup = async function () {
  const name = document.querySelector('#name').value;
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;
  const role = document.querySelector('#role').value;

  if (!name || !email || !password || role === "Select Role") {
    alert("Please fill all fields properly");
    return;
    //       document.querySelector('#name').value = "";
    // document.querySelector('#email').value = "";
    // document.querySelector('#password').value = "";
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role
    });

    // alert("Account Created ✅");

    if (role === "Student") {
      window.location.href = "student.html";
    } else if (role === "Teacher") {
      window.location.href = "teacher.html";
    }
  } catch (error) {
    alert(error.message);
  }
};

document.getElementById("signupBtn").addEventListener("click", signup);

//login
window.login = async function () {
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user data from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();

      if (userData.role === "Student") {
        window.location.href = "student.html";
      } else if (userData.role === "Teacher") {
        window.location.href = "teacher.html";
      }
    }

  } catch (error) {
    alert(error.message);
  }
};

document.getElementById("loginBtn").addEventListener("click", login);