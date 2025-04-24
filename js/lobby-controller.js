// Controlador específico para a página de lobby
const LobbyController = {
    // Inicializar a página de lobby
    init() {
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
              Room.initRoom(roomId);
            } else {
              // Inicializar o lobby
              Lobby.init();
            }
            
            // Configurar eventos específicos da página de lobby
            this.setupEventListeners();
          } catch (error) {
            console.error('Erro ao inicializar lobby:', error);
            UI.showToast('Erro ao carregar o lobby!', 'error');
            
            setTimeout(() => {
              window.location.href = 'index.html';
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
      // Botão para voltar ao menu
      const btnBackToMenu = document.getElementById('btn-back-to-menu');
      if (btnBackToMenu) {
        btnBackToMenu.addEventListener('click', () => {
          window.location.href = 'index.html';
        });
      }
  
      // Botão para sair da sala (na seção de lobby de sala)
      const btnLeaveRoom = document.getElementById('lobby-btn-leave-room');
      if (btnLeaveRoom) {
        btnLeaveRoom.addEventListener('click', async () => {
          try {
            await Room.leaveRoom();
            UI.showSection('rooms-section');
            Lobby.loadRooms();
          } catch (error) {
            console.error('Erro ao sair da sala:', error);
            UI.showToast('Erro ao sair da sala!', 'error');
          }
        });
      }
  
      // Botão para iniciar jogo
      const btnStartGame = document.getElementById('lobby-btn-start-game');
      if (btnStartGame) {
        btnStartGame.addEventListener('click', async () => {
          try {
            // Verificar se há jogadores suficientes
            const roomSnapshot = await database.ref(`rooms/${Room.roomId}`).once('value');
            const room = roomSnapshot.val();
            
            if (room && room.players && Object.keys(room.players).length < 2) {
              UI.showToast('É preciso pelo menos 2 jogadores para iniciar!', 'error');
              return;
            }
            
            // Atualizar status da sala para 'playing'
            await database.ref(`rooms/${Room.roomId}/status`).set('playing');
            
            // Configurar jogo se necessário
            if (!await database.ref(`games/${Room.roomId}`).once('value').then(snap => snap.exists())) {
              // Configurar novo jogo
              const gameRef = database.ref(`games/${Room.roomId}`);
              const initialGameState = {
                gameStarted: true,
                currentPlayerIndex: 0,
                direction: 1,
                drawCount: 0,
                created_at: firebase.database.ServerValue.TIMESTAMP
              };
              
              await gameRef.set(initialGameState);
            }
            
            // Redirecionar para a página do jogo
            window.location.href = `game.html?roomId=${Room.roomId}`;
          } catch (error) {
            console.error('Erro ao iniciar o jogo:', error);
            UI.showToast('Erro ao iniciar o jogo!', 'error');
          }
        });
      }
      
      // Botão para copiar código da sala
      const btnCopyCode = document.getElementById('lobby-copy-code');
      if (btnCopyCode) {
        btnCopyCode.addEventListener('click', () => {
          const code = document.getElementById('lobby-room-code').textContent;
          UI.copyToClipboard(code);
          UI.showToast('Código copiado para a área de transferência!', 'success');
        });
      }
    }
  };
  
  // Inicializar controlador quando a página carregar
  document.addEventListener('DOMContentLoaded', () => {
    LobbyController.init();
  });