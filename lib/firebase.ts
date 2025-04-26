import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC1Rpv4MfgbjmW7eOxUSUh0dG4r4gpjFi0",
  authDomain: "test-uwu-88e39.firebaseapp.com",
  projectId: "test-uwu-88e39",
  storageBucket: "test-uwu-88e39.firebasestorage.app",
  messagingSenderId: "552431706620",
  appId: "1:552431706620:web:72e0469ce69fefdf009279",
  measurementId: "G-T0F07XVDET",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
