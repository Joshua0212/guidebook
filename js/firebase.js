// js/firebase.js — Centralized Firebase initialization
// Single source of truth for Firebase config to avoid duplicated init across pages (BUG 1 & 7)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// NOTE: Placeholder config — replace with real project values in deployment
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);

// Dispatch a custom event so classic scripts can listen if they want (addresses BUG 1)
window.dispatchEvent(new Event('firebaseReady'));

// Also export for module consumers
export const db = window.db;

// One-line comment: centralized initialization done and event dispatched
