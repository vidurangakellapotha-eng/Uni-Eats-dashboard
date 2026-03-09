import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDd_tCdK5IJ0CxP9qtbGTnYFWajXJ7S_aE",
    authDomain: "uni-eats-3142b.firebaseapp.com",
    projectId: "uni-eats-3142b",
    storageBucket: "uni-eats-3142b.firebasestorage.app",
    messagingSenderId: "387541660658",
    appId: "1:387541660658:web:28937a377ec777f1e2716b",
    measurementId: "G-XR4Y9R4ZBS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
