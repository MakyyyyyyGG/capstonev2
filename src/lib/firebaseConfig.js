// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDq-g9VmInzZ55ytqiVhYhJr0hHcVhPV3Q",
  authDomain: "capstone-b0ac1.firebaseapp.com",
  projectId: "capstone-b0ac1",
  storageBucket: "capstone-b0ac1.firebasestorage.app",
  messagingSenderId: "729105799300",
  appId: "1:729105799300:web:2094880d23731f5e0e8ad1",
  measurementId: "G-NY29SSNM4K",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export { storage };
