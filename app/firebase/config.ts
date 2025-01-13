import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLkXQVbvaxr-UjbvtS37Q3ta267qHBfvI",
  authDomain: "pinball-72235.firebaseapp.com",
  projectId: "pinball-72235",
  storageBucket: "pinball-72235.firebasestorage.app",
  messagingSenderId: "347694209389",
  appId: "1:347694209389:web:609e615da80670c405a264",
  measurementId: "G-XFKKYMDDNY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ref = collection(db, 'Users');

getDocs(ref)
  .then((snapshot) => {
    const fruits = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(fruits);
  })
  .catch((error) => {
    console.error(error);
  });

export const database = getFirestore(app);