// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlYzl1Kzd5pY0gZYRghsrGkbCfLm6iTqk",
  authDomain: "uno-game-duduxindev.firebaseapp.com",
  databaseURL: "https://uno-game-duduxindev-default-rtdb.firebaseio.com",
  projectId: "uno-game-duduxindev",
  storageBucket: "uno-game-duduxindev.firebasestorage.app",
  messagingSenderId: "1020680045987",
  appId: "1:1020680045987:web:f8e762882f180fd6b9c616",
  measurementId: "G-HYKE1R16G5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);