/**
 * Configuração do Firebase para UNO Game
 * Data: 2025-04-11 21:40:07
 * Desenvolvido por: Duduxindev
 */

console.log("🔥 Iniciando configuração do Firebase...");

// Configuração correta do Firebase
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

// Inicializar Firebase (API de compatibilidade)
try {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase inicializado com sucesso!");
  
  // Monitorar estado da conexão
  firebase.database().ref('.info/connected').on('value', (snapshot) => {
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
  
  // Definir utilidades do Firebase
  window.FirebaseUtil = {
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
  
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error);
  
  // Mostrar erro na interface
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = "Erro ao conectar com o servidor: " + error.message;
    toast.className = 'toast show error';
    
    setTimeout(() => {
      toast.className = 'toast';
    }, 10000);
  }
  
  // Implementar fallback para o FirebaseUtil
  window.FirebaseUtil = {
    generateRoomCode: function() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    },
    
    getRoomRef: function(roomCode) {
      return null;
    },
    
    checkRoomExists: async function() {
      return false;
    },
    
    getServerTimestamp: function() {
      return Date.now();
    }
  };
  
  // Tentar reconexão após 5 segundos
  setTimeout(() => {
    console.log("🔄 Tentando reconectar ao Firebase...");
    location.reload();
  }, 5000);
}

// Verificar conexão após 3 segundos
setTimeout(() => {
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.error("❌ Firebase não inicializado corretamente após verificação!");
    
    // Mostrar erro na interface
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = "Erro ao conectar com o servidor. Recarregando...";
      toast.className = 'toast show error';
    }
    
    // Recarregar a página
    setTimeout(() => {
      location.reload();
    }, 3000);
  }
}, 3000);

console.log("✅ Configuração do Firebase concluída!");