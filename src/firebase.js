import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAJuJ8DKdnn75WgvyXnKV3PJwp4BbwMvCc",
    authDomain: "trail-f142f.firebaseapp.com",
    projectId: "trail-f142f",
    storageBucket: "trail-f142f.firebasestorage.app",
    messagingSenderId: "472625893135",
    appId: "1:472625893135:web:0096c358c7589df975f87a",
    measurementId: "G-8NTM6KGK8J"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// Initialize persistence in a separate file or after auth usage
// to avoid circular dependencies