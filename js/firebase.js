// Configuração do Firebase
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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar instâncias do Firebase
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Configurar Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();