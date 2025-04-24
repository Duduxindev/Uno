// Controlador específico para a página de lobby
const LobbyController = {
  // Inicializar a página de lobby
  initconsole.error('Erro ao iniciar o jogo:', error);
        UI.showToast('Erro ao iniciar o jogo!', 'error');
      }
    });
    
    // Botão para encerrar jogo
    document.getElementById('btn-end-game').addEventListener('click', async () => {
      try {
        await Room.endGame();
      } catch (error) {
        console.error('Erro ao encerrar o jogo:', error);
        UI.showToast('Erro ao encerrar o jogo!',() {
    // Verificar se usuário está logado
    auth.onAuthStateChanged((user) => {
      if (user) {
        try {
          // Inicializar UI
          UI.init();
          
          // Verificar se veio com roomId na URL
          const urlParams = new URLSearchParams(window.location.search);
          const roomId = urlParams.get('roomId');
          
          if (roomId) {
            // Entrar na sala especificada
             'error');
      }
    });
    
    // Toggle para o chat
    const toggleChatBtn = document.getElementById('toggle-chat');
    constRoom.initRoom(roomId);
          } else {
            // Inicializar o lobby
            Lobby.init();
          }
          
          // Configurar eventos específicos da página de lobby
          this.setupEventListeners();
        } catch (error) {
          console.error('Erro ao inicializar lobby:', error);
          UI.showToast('Erro ao carregar o lobby!', 'error');
           chatContainer = document.querySelector('.chat-container');
    
    if (toggleChatBtn && chatContainer) {
      toggleChatBtn.addEventListener('click', () => {
        chatContainer.classList.toggle('collapsed');
        const icon = toggleChatBtn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-chevron-down');
          icon.classList.toggle
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1500);
        }
      } else {
        ('fa-chevron-up');
        }
      });
    }
  },
  
  // Atualizar avatar do jogador
  updatePlayerAvatar() {
    const// Redirecionar para a página de login
        window.location.href = 'index.html';
      }
    });
  },

  // Configurar event listeners específicos
  setupEventListeners() {
    // Botão para voltar ao menu
    const btnBackToMenu = document.getElementById('btn-back-to-menu playerAvatarImg = document.getElementById('player-avatar-img');
    const playerName = document.getElementById('player-name');
    
    if (playerAvatarImg && playerName) {
      // Obter avatar do usuário
      let avatarSrc;
      const avatarURL = localStorage.getItem('avatarURL');');
    if (btnBackToMenu) {
      btnBackToMenu.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    // Botão para s
      const avatarSeed = localStorage.getItem('avatar');
      
      if (avatarURL) {
        avatarSrc = avatarURL;
      } else if (avatarSeed) {
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
      } else if (auth.currentUser.photoURL) {
        avatarSrc = auth.currentUser.photoURL;
      } else {
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${authair da sala (na seção de lobby de sala)
    const btnLeaveRoom = document.getElementById('lobby-btn-leave-room');
    if (btnLeaveRoom) {
      btnLeaveRoom.addEventListener('click', async () => {
        try {
          await Room.leaveRoom();
          UI.showSection('rooms-section');
          Lobby.loadRooms();
        } catch (error) {
          console.error.currentUser.uid}`;
      }
      
      playerAvatarImg.src = avatarSrc;
      playerName.textContent = auth.currentUser.displayName || ('Erro ao sair da sala:', error);
          UI.showToast('Erro ao sair da sala!', 'error');
        }
      });
    }

    // Botão para iniciar jogo
    const btnStartGame = document.getElementById('lobby-btn-start-game');
    if (btnStartGame) {
      btnStartGame.addEventListener('click', async () => {
        try {
          //'Você';
    }
  }
};

// Inicializar controlador quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  GameController.init();
});