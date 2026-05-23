import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCw_YvFN_zDXVWaZjwAMyprZ2Q_uBj22dg",
  authDomain: "retro-dash-c9615.firebaseapp.com",
  projectId: "retro-dash-c9615",
  storageBucket: "retro-dash-c9615.firebasestorage.app",
  messagingSenderId: "791875894614",
  appId: "1:791875894614:web:456e22f9834f20458deaf7",
  measurementId: "G-9QK9HQ6623"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Standard configuration for Google Sign-In
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, db, auth, googleProvider };
