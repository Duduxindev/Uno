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

    ifd=${seed}`;
      }
      
      playerElement.innerHTML = `
        <img src="${avatarSrc}" alt="${player.name}">
        <div class="player-name">${player.name} ${player.id === auth.currentUser.uid ? '(Você)' : ''}</div>
        ${player.isHost ? '<div class="host-badge">Host</div>' : ''}
      `;
      
      playersListElement (!this.roomId) {
      // Se não tiver roomId, volta para a página inicial
      window.location.href = 'index.html';
      return;
    }

    // Verificar se usuário está logado
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Inicializar UI
          UI.init();
          
          // Obter informações da sala
          const roomSnapshot = await database.ref(`.appendChild(playerElement);
    });
  },

  // Encerrar jogo (quando ainda não começou)
  async endGame() {
    try {
      // Verificar se érooms/${this.roomId}`).once('value');
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
          if (room o host
      const roomSnapshot = await this.roomRef.once('value');
      const room = roomSnapshot.val();
      
      if (!room || room.hostId !== auth.currentUser.uid) {
        UI.showToast('Apenas o host pode encerrar o jogo!', 'error');
        return false;
      }
      
      if (room.status === 'playing') {
        UI.showToast('Não é possível encerrar um jogo em andamento!', '.status !== 'playing') {
            UI.showToast('O jogo ainda não começou!', 'info');
            setTimeout(() => {
              window.location.href = `lobby.html?roomId=${this.roomId}`;
            }, 1500);
            return;
          }
          
          // Inicializar a sala
          await Room.initRoom(this.roomId);
          
          // Configurar eventos específicos da página do jogo
          this.setupEventListeners();
          
          //error');
        return false;
      }
      
      // Resetar o jogo
      await this.roomRef.update({
        status: 'waiting',
        updated_at: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Resetar o estado do jogo
      await database.ref(`games/${this.room Inicializar jogo
          Game.initGame(this.roomId, this.isHost);
          
          // Atualizar avatar do jogador
          this.updatePlayerAvatar();
        } catch (Id}`).remove();
      
      // Notificar outros jogadores
      Chat.sendSystemMessage('O host encerrou oerror) {
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
    // Botão para sair do jogo jogo.');
      UI.showToast('Jogo encerrado!', 'success');
      
      return true;
    } catch (error) {
      console.error('Erro ao encerrar jogo:', error);
      UI.showToast('Erro ao encerrar jogo: ' + error.message, 'error');
      return false;
    }
  },

  // Configurar event listeners da sala
  setupRoomEventListeners() {
    // Ouvir mudanças na sala
    this.roomRef.on('value', (snapshot) => {
      const room = snapshot.val
    document.getElementById('btn-leave-room').addEventListener('click', async () => {
      try {
        await Room.leaveRoom();
        window.location.href = 'lobby.html';
      } catch (error) {
        console.error('Erro ao sair da sala:', error);
        UI.showToast('Erro ao sair da sala!', 'error');
      }
    });

    // Botão para copiar código();
      if (!room) {
        UI.showToast('A sala foi fechada pelo host!', 'error');
        
        if (window.location.pathname.includes('game.html')) {
          window.location.href = 'lobby.html';
        } else {
          window.location.href = 'index.html';
        }
        return;
      }
      
      
    document.getElementById('copy-room-code').addEventListener// Atualizar informações da sala
      if (window.location.pathname.includes('game.html')) {
        this.updateRoomInfo(room);
        this.renderPlayers(room);
      } else if (window.location.pathname.includes('lobby.html')) {
        this.updateLobbyInfo();('click', () => {
      const code = document.getElementById('room-code-text').textContent;
      UI.copyToClipboard(code);
      UI.showToast('Código copiado para a área de transferência!', 'success');
    });
    
    // Botão para iniciar jogo (em caso de ser host e jogo não iniciado)
    document.getElementById('btn-start-game').addEventListener('click', async () => {
      try {
        // Verificar se há jogadores suficientes
        const roomSnapshot = await database.
      }
    });
  },

  // Limpar event listeners quando sair da sala
  cleanup() {
    clearInterval(this.presref(`rooms/${this.roomId}`).once('value');
        const room = roomSnapshot.val();
        
        if (room && room.players && Object.keys(room.players).length < 2) {
          UI.showToast('É preciso pelo menos 2 jogadores para iniciar!', 'error');
          return;
        }
        
        // Iniciar o jogo
        await Game.startGame();
      } catch (error) {
        enceInterval);
    
    if (this.roomRef) {
      this.roomRef.off();
    }
  }
};