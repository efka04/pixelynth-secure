// /app/db/firebaseconfig.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Fallback values for development if environment variables are not set
const getEnvOrFallback = (key, fallback) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  console.warn(`Environment variable ${key} not found, using fallback value for development`);
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvOrFallback('NEXT_PUBLIC_FIREBASE_API_KEY', 'dummy-api-key-for-development'),
  authDomain: getEnvOrFallback('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'pixelynth-c41ea.firebaseapp.com'),
  projectId: getEnvOrFallback('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'pixelynth-c41ea'),
  storageBucket: getEnvOrFallback('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'pixelynth-c41ea.appspot.com'),
  messagingSenderId: getEnvOrFallback('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '123456789012'),
  appId: getEnvOrFallback('NEXT_PUBLIC_FIREBASE_APP_ID', '1:123456789012:web:abcdef1234567890'),
  measurementId: getEnvOrFallback('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'G-ABCDEFGHIJ')
};

// Ensure only one Firebase app instance is initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };