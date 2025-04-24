// Controlador específico para a página do jogo
const GameController = {
  // Referências para o jogo e sala
  roomId: null,
  isHost: false,

  // Inicializar a página do jogo
  init() {
    // Obter ID da sala da URL
    const urlParams = new URLSearchParams(window.location.search);
    this.roomId = urlParams.get('roomId');

    if (!this.roomId) {
      // Se não tiver roomId, volta para a página inicial
      UI.showToast('ID da sala não encontrado!', 'error');
      setTimeout(() => {
        window.location.href = 'lobby.html';
      }, 1500);
      return;
    }

    // Verificar se usuário está logado
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Inicializar UI
          UI.init();
          
          // Obter informações da sala
          const roomSnapshot = await database.ref(`rooms/${this.roomId}`).once('value');
          const room = roomSnapshot.val();
          
          if (!room) {
            UI.showToast('Sala não encontrada!', 'error');
            setTimeout(() => {
              window.location.href = 'lobby.html';
            }, 1500);
            return;
          }
          
          // Verificar se é o host
          this.isHost = room.hostId === auth.currentUser.uid;
          
          // Verificar se o jogo já começou
          if (room.status !== 'playing' && !room.players[auth.currentUser.uid]) {
            UI.showToast('O jogo ainda não começou ou você não é um jogador desta sala!', 'info');
            setTimeout(() => {
              window.location.href = `lobby.html?roomId=${this.roomId}`;
            }, 1500);
            return;
          }
          
          // Inicializar a sala
          await Room.initRoom(this.roomId);
          
          // Configurar eventos específicos da página do jogo
          this.setupEventListeners();
          
          // Inicializar jogo se Game estiver definido
          if (typeof Game !== 'undefined') {
            Game.initGame(this.roomId, this.isHost);
          } else {
            console.error('Game object is not defined!');
            UI.showToast('Erro ao carregar o jogo. A função do jogo não está definida!', 'error');
          }
          
          // Atualizar avatar do jogador
          this.updatePlayerAvatar();
          
          // Registrar estatística de jogo
          this.registerGameStarted();
        } catch (error) {
          console.error('Erro ao inicializar jogo:', error);
          UI.showToast('Erro ao carregar o jogo!', 'error');
          
          setTimeout(() => {
            window.location.href = 'lobby.html';
          }, 1500);
        }
      } else {
        // Redirecionar para a página de login
        window.location.href = 'index.html';
      }
    });
  },

  // Configurar event listeners específicos
  setupEventListeners() {
    // Botão para sair do jogo
    document.getElementById('btn-leave-room').addEventListener('click', async () => {
      try {
        await Room.leaveRoom();
        window.location.href = 'lobby.html';
      } catch (error) {
        console.error('Erro ao sair da sala:', error);
        UI.showToast('Erro ao sair da sala!', 'error');
      }
    });

    // Botão para copiar código
    document.getElementById('copy-room-code').addEventListener('click', () => {
      const code = document.getElementById('room-code-text').textContent;
      UI.copyToClipboard(code);
      UI.showToast('Código copiado para a área de transferência!', 'success');
    });
    
    // Botão para iniciar jogo (em caso de ser host e jogo não iniciado)
    document.getElementById('btn-start-game').addEventListener('click', async () => {
      try {
        // Verificar se há jogadores suficientes
        const roomSnapshot = await database.ref(`rooms/${this.roomId}`).once('value');
        const room = roomSnapshot.val();
        
        if (room && room.players && Object.keys(room.players).length < 2) {
          UI.showToast('É preciso pelo menos 2 jogadores para iniciar!', 'error');
          return;
        }
        
        // Iniciar o jogo
        if (typeof Game !== 'undefined' && Game.startGame) {
          await Game.startGame();
        } else {
          console.error('Game.startGame function is not defined!');
          UI.showToast('Erro ao iniciar o jogo. A função não está definida!', 'error');
        }
      } catch (error) {
        console.error('Erro ao iniciar o jogo:', error);
        UI.showToast('Erro ao iniciar o jogo!', 'error');
      }
    });
    
    // Botão para encerrar jogo
    document.getElementById('btn-end-game').addEventListener('click', async () => {
      try {
        await Room.endGame();
      } catch (error) {
        console.error('Erro ao encerrar o jogo:', error);
        UI.showToast('Erro ao encerrar o jogo!', 'error');
      }
    });
    
    // Toggle para o chat
    const toggleChatBtn = document.getElementById('toggle-chat');
    const chatContainer = document.querySelector('.chat-container');
    
    if (toggleChatBtn && chatContainer) {
      toggleChatBtn.addEventListener('click', () => {
        chatContainer.classList.toggle('collapsed');
        const icon = toggleChatBtn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-chevron-down');
          icon.classList.toggle('fa-chevron-up');
        }
      });
    }
  },
  
  // Atualizar avatar do jogador
  updatePlayerAvatar() {
    const playerAvatarImg = document.getElementById('player-avatar-img');
    const playerName = document.getElementById('player-name');
    
    if (playerAvatarImg && playerName) {
      // Obter avatar do usuário
      let avatarSrc;
      const avatarURL = localStorage.getItem('avatarURL');
      const avatarSeed = localStorage.getItem('avatar');
      
      if (avatarURL) {
        avatarSrc = avatarURL;
      } else if (avatarSeed) {
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
      } else if (auth.currentUser.photoURL) {
        avatarSrc = auth.currentUser.photoURL;
      } else {
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${auth.currentUser.uid}`;
      }
      
      playerAvatarImg.src = avatarSrc;
      playerName.textContent = auth.currentUser.displayName || 'Você';
    }
  },
  
  // Registrar estatística de jogo iniciado
  async registerGameStarted() {
    try {
      if (!auth.currentUser) return;
      
      // Incrementar contador de jogos
      const statsRef = database.ref(`users/${auth.currentUser.uid}/stats`);
      const statsSnapshot = await statsRef.once('value');
      const stats = statsSnapshot.val() || {};
      
      // Incrementar valor ou inicializar
      const gamesPlayed = (stats.gamesPlayed || 0) + 1;
      
      await statsRef.update({
        gamesPlayed,
        lastGameAt: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (error) {
      console.error('Erro ao registrar estatísticas:', error);
      // Silenciosamente falha - não crítico
    }
  }
};

// Inicializar controlador quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  GameController.init();
});