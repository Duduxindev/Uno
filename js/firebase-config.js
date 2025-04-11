/**
 * Configuração do Firebase
 * Última atualização: 2025-04-11 16:31:26
 * Desenvolvido por: Duduxindev
 */

// Firebase Configuration
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
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  
  // Initialize Anonymous Auth
  const auth = firebase.auth();
  auth.signInAnonymously().catch(error => {
    console.error("Erro na autenticação anônima:", error);
  });
  
  // Test connection
  console.log("Firebase inicializado em " + new Date().toISOString());