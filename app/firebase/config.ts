import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBLkXQVbvaxr-UjbvtS37Q3ta267qHBfvI",
  authDomain: "pinball-72235.firebaseapp.com",
  databaseURL:
    "https://pinball-72235-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "pinball-72235",
  storageBucket: "pinball-72235.firebasestorage.app",
  messagingSenderId: "347694209389",
  appId: "1:347694209389:web:609e615da80670c405a264",
  measurementId: "G-XFKKYMDDNY",
};

const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const auth = getAuth(app);
export const realtimeDatabase = getDatabase(app);
