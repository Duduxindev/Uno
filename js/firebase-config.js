/**
 * Configuração do Firebase para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

// Inicializar Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAvt_YeiVfpMf_9UQMQrXMiHHEOGoVajYw",
  authDomain: "uno-online-duduxindev.firebaseapp.com",
  databaseURL: "https://uno-online-duduxindev-default-rtdb.firebaseio.com",
  projectId: "uno-online-duduxindev",
  storageBucket: "uno-online-duduxindev.appspot.com",
  messagingSenderId: "637465780945",
  appId: "1:637465780945:web:46d7d2f3c4e69f3b6f207c"
};

// Inicializar Firebase com compat API (para compatibilidade com versões anteriores)
firebase.initializeApp(firebaseConfig);

// Verificar conexão com o Firebase
firebase.database().ref('.info/connected').on('value', function(snapshot) {
  const isConnected = snapshot.val();
  console.log(`📡 Firebase: ${isConnected ? 'Conectado' : 'Desconectado'}`);
  
  // Mostrar mensagem de erro se desconectado
  if (!isConnected) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = "Conexão com o servidor perdida. Reconectando...";
      toast.className = 'toast show warning';
      
      setTimeout(() => {
        toast.className = 'toast';
      }, 5000);
    }
  }
});

// Funções utilitárias para o Firebase
const FirebaseUtil = {
  // Gerar um ID aleatório de 4 caracteres para salas
  generateRoomCode: function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
  
  // Criar uma referência a uma sala específica
  getRoomRef: function(roomCode) {
    return firebase.database().ref(`rooms/${roomCode}`);
  },
  
  // Verificar se uma sala existe
  checkRoomExists: async function(roomCode) {
    try {
      const snapshot = await firebase.database().ref(`rooms/${roomCode}`).once('value');
      return snapshot.exists();
    } catch (error) {
      console.error("Erro ao verificar sala:", error);
      return false;
    }
  },
  
  // Obter timestamp do servidor
  getServerTimestamp: function() {
    return firebase.database.ServerValue.TIMESTAMP;
  }
};

console.log("✅ Firebase configurado com sucesso!");