// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIbsgEFv7_rsWQJd6iAxkW16skrVPSd80",
  authDomain: "parcelmanagement-c3ba4.firebaseapp.com",
  projectId: "parcelmanagement-c3ba4",
  storageBucket: "parcelmanagement-c3ba4.firebasestorage.app",
  messagingSenderId: "865375984442",
  appId: "1:865375984442:web:fba77276fb1ad5ab4d8e03",
  measurementId: "G-DRDXXEJFCS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);