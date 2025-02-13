

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase Project A (Authentication & Firestore)
const firebaseConfigAuth = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

// Firebase Project B (Storage)
const firebaseConfigStorage = {
  apiKey: process.env.REACT_APP_SECONDARY_API_KEY,
  authDomain: process.env.REACT_APP_SECONDARY_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_SECONDARY_PROJECT_ID,
  storageBucket: process.env.REACT_APP_SECONDARY_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_SECONDARY_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_SECONDARY_APP_ID,
  measurementId: process.env.REACT_APP_SECONDARY_MEASUREMENT_ID,
};

// Initialize Firebase Apps
const authApp = initializeApp(firebaseConfigAuth); // Default app
const storageApp = initializeApp(firebaseConfigStorage, "storageApp"); // Named app for Storage

// Export Authentication & Firestore from Project A
export const auth = getAuth(authApp);
export const db = getFirestore(authApp);

// Export Storage from Project B
export const storage = getStorage(storageApp);
