// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth/web-extension";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnku55NLI3mtw5r_VVkU8_6l3L33OratM",
  authDomain: "idleidle-banana.firebaseapp.com",
  projectId: "idleidle-banana",
  storageBucket: "idleidle-banana.firebasestorage.app",
  messagingSenderId: "302394912964",
  appId: "1:302394912964:web:41bccd328bf47c6eb45991",
  measurementId: "G-GM9M72LZMV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();