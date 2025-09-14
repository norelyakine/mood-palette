// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; 
import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAmUpkzypD5tMwl6gDMMgVBljyjkam0odY",
  authDomain: "mood-palette-pj.firebaseapp.com",
  databaseURL: "https://mood-palette-pj-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "mood-palette-pj",
  storageBucket: "mood-palette-pj.firebasestorage.app",
  messagingSenderId: "596275542720",
  appId: "1:596275542720:web:4e5915656a4b88f3584b25",
  measurementId: "G-WGEFR6PX9W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export const rtdb = getDatabase(app); 

export const auth = getAuth(app); // <-- added
