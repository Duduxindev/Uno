// Controlador específico para a página de lobby
const LobbyController = {
  // Inicializar a página de lobby
  init() {
    // CORREÇÃO: Aguardar a inicialização completa do Firebase antes de verificar o usuário
    setTimeout(() => {
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
              // CORREÇÃO: Adicionar catch para garantir que o Lobby seja inicializado
              try {
                // Inicializar o lobby
                Lobby.init();
                
                // Carregar salas recentes do usuário
                this.loadRecentRooms();
              } catch (lobbyError) {
                console.error('Erro ao inicializar lobby:', lobbyError);
                UI.showToast('Erro ao carregar as salas. Recarregando...', 'error');
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
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
    }, 500); // Pequeno atraso para garantir que o Firebase esteja inicializado
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
          UI.showToast('Iniciando jogo...', 'success');
          setTimeout(() => {
            window.location.href = `game.html?roomId=${Room.roomId}`;
          }, 1000);
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
    
    // Botão para copiar link de convite
    const btnInviteLink = document.getElementById('lobby-invite-link');
    if (btnInviteLink) {
      btnInviteLink.addEventListener('click', () => {
        // Criar link de convite com o roomId atual
        const inviteLink = `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}/lobby.html?roomId=${Room.roomId}`;
        UI.copyToClipboard(inviteLink);
        UI.showToast('Link de convite copiado para a área de transferência!', 'success');
      });
    }
  },
  
  // Carregar salas recentes do usuário
  async loadRecentRooms() {
    try {
      // Verificar se o usuário está logado
      if (!auth.currentUser) return;
      
      // Obter as salas recentes do usuário
      const userRoomsRef = database.ref(`users/${auth.currentUser.uid}/rooms`).orderByChild('timestamp').limitToLast(5);
      const userRoomsSnapshot = await userRoomsRef.once('value');
      const userRooms = userRoomsSnapshot.val();
      
      if (!userRooms) return;
      
      // Criar seção de salas recentes se ainda não existir
      let recentRoomsSection = document.querySelector('.recent-rooms-section');
      
      if (!recentRoomsSection) {
        const roomsSection = document.querySelector('.container');
        if (!roomsSection) return;
        
        // Criar seção de salas recentes
        recentRoomsSection = document.createElement('div');
        recentRoomsSection.className = 'recent-rooms-section';
        recentRoomsSection.innerHTML = `
          <h3><i class="fas fa-history"></i> Suas salas recentes</h3>
          <div class="recent-rooms"></div>
        `;
        
        // Inserir após o cabeçalho da seção
        const sectionHeader = document.querySelector('.section-header');
        if (sectionHeader && sectionHeader.nextSibling) {
          roomsSection.insertBefore(recentRoomsSection, sectionHeader.nextSibling);
        } else {
          roomsSection.appendChild(recentRoomsSection);
        }
      }
      
      // Popular lista de salas recentes
      const recentRoomsList = recentRoomsSection.querySelector('.recent-rooms');
      recentRoomsList.innerHTML = '';
      
      // Converter para array e ordenar da mais recente para a mais antiga
      const rooms = Object.entries(userRooms)
        .map(([roomId, room]) => ({
          id: roomId,
          ...room
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
      // Mostrar até 5 salas mais recentes
      for (const room of rooms.slice(0, 5)) {
        const roomElement = document.createElement('div');
        roomElement.className = 'recent-room-item';
        roomElement.innerHTML = `
          <span class="recent-room-name">${room.name}</span>
          <button class="btn btn-sm btn-primary recent-room-join" data-room-id="${room.roomId}">
            <i class="fas fa-sign-in-alt"></i> Entrar
          </button>
        `;
        
        // Adicionar evento para entrar na sala
        const joinButton = roomElement.querySelector('.recent-room-join');
        joinButton.addEventListener('click', () => {
          Lobby.joinRoom(room.roomId);
        });
        
        recentRoomsList.appendChild(roomElement);
      }
      
      // Mostrar a seção de salas recentes
      recentRoomsSection.classList.remove('hidden');
    } catch (error) {
      console.error('Erro ao carregar salas recentes:', error);
      // Não mostrar toast para não confundir o usuário
    }
  }
};

// Inicializar controlador quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  LobbyController.init();
});