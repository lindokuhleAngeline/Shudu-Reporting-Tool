import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase Project A (Authentication & Firestore)
const firebaseConfigAuth = {
  apiKey: "AIzaSyBMnINLGA3KSFlvni4DrRFTE2sUMbDxRYc",
  authDomain: "shudu-report.firebaseapp.com",
  projectId: "shudu-report",
  storageBucket: "shudu-report.firebasestorage.app",
  messagingSenderId: "634378997852",
  appId: "1:634378997852:web:fbcf992fc91c1726dcd699",
  measurementId: "G-JQP9KT53PV",
};

// Firebase Project B (Storage)
const firebaseConfigStorage = {
  apiKey: "AIzaSyDDCzPsz-Qst1A8uJAwBq5mrZZDYRUEhC0",

  authDomain: "carerunners-bdd1a.firebaseapp.com",

  projectId: "carerunners-bdd1a",

  storageBucket: "carerunners-bdd1a.appspot.com",

  messagingSenderId: "1047923854966",

  appId: "1:1047923854966:web:6220e42db55c0166f6d957",

  measurementId: "G-S1DD8BDNZK",
};

// Initialize Firebase Apps
const authApp = initializeApp(firebaseConfigAuth); // Default app
const storageApp = initializeApp(firebaseConfigStorage, "storageApp"); // Named app for Storage

// Export Authentication & Firestore from Project A
export const auth = getAuth(authApp);
export const db = getFirestore(authApp);

// Export Storage from Project B
export const storage = getStorage(storageApp);
