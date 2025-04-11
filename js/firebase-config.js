// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBCysz9tEfrvb13YLIexNTwv_WfY_qTZkw",
    authDomain: "uno-game-duduxindev.firebaseapp.com",
    databaseURL: "https://uno-game-duduxindev-default-rtdb.firebaseio.com",
    projectId: "uno-game-duduxindev",
    storageBucket: "uno-game-duduxindev.appspot.com",
    messagingSenderId: "547241018492",
    appId: "1:547241018492:web:9d5c82ce06b051a8123456"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Test connection
console.log("Firebase initialized on " + new Date().toISOString());