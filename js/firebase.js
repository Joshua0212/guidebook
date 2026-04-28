// js/firebase.js — Centralized Firebase initialization
// Single source of truth for Firebase config to avoid duplicated init across pages (BUG 1 & 7)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// Centralized Firebase initialization using provided project config
const firebaseConfig = {
  apiKey: "AIzaSyDMCal67khniqGltSa8ebsfDK8I8hSktQc",
  authDomain: "guidebook-fdaf0.firebaseapp.com",
  projectId: "guidebook-fdaf0",
  storageBucket: "guidebook-fdaf0.firebasestorage.app",
  messagingSenderId: "1092779299922",
  appId: "1:1092779299922:web:985d6bbcf2f652f19b3b8b",
  measurementId: "G-SD0DS9Y27M"
};

const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);

// Try anonymous sign-in to satisfy rules that require auth (development convenience)
const auth = getAuth(app);
signInAnonymously(auth).then(() => {
  console.log('Firebase: signed in anonymously');
  window.dispatchEvent(new Event('firebaseReady'));
}).catch((err) => {
  console.warn('Firebase anonymous sign-in failed:', err && err.message ? err.message : err);
  // Still dispatch so the page can attempt unauthenticated reads
  window.dispatchEvent(new Event('firebaseReady'));
});

// Export db for module consumers
export const db = window.db;

// One-line comment: centralized initialization done and event dispatched
