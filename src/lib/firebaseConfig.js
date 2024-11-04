// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBVvAGA8eFUwpZD_rcbljENNySSeRsOod8",
  authDomain: "capstone-26095.firebaseapp.com",
  projectId: "capstone-26095",
  storageBucket: "capstone-26095.firebasestorage.app",
  messagingSenderId: "1062250754691",
  appId: "1:1062250754691:web:593b661272644b4acc21b6",
  measurementId: "G-E99QMVF0WJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export { storage };
