// Gerenciador de Lobby
const Lobby = {
  // Inicializar lobby
  init() {
    this.setupEventListeners();
    this.loadRooms();
  },

  // Configurar event listeners do lobby
  setupEventListeners() {
    // Tabs de salas públicas/privadas
    document.getElementById('tab-public-rooms').addEventListener('click', () => {
      this.switchRoomTab('public');
    });
    
    document.getElementById('tab-private-rooms').addEventListener('click', () => {
      this.switchRoomTab('private');
    });
    
    // Botão para criar sala
    document.getElementById('btn-create-room').addEventListener('click', () => {
      UI.showModal(UI.elements.createRoomModal);
    });
    
    // Botão para voltar ao menu
    document.getElementById('btn-back-to-menu').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    
    // Formulário para criar sala
    document.getElementById('create-room-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateRoom();
    });
    
    // Botão para entrar por código
    document.getElementById('btn-join-by-code').addEventListener('click', () => {
      UI.showModal(UI.elements.joinPrivateRoomModal);
    });
    
    // Formulário para entrar em sala privada
    document.getElementById('join-private-room-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleJoinPrivateRoom();
    });
    
    // Botão para atualizar salas
    document.getElementById('btn-refresh-rooms').addEventListener('click', () => {
      this.loadRooms();
    });
    
    // Pesquisa de salas
    document.getElementById('room-search').addEventListener('input', (e) => {
      this.filterRooms(e.target.value);
    });

    // Modo No Mercy
    const nomercyMode = document.getElementById('nomercy-mode');
    const customMode = document.getElementById('custom-mode');
    const classicMode = document.getElementById('classic-mode');
    const customRules = document.getElementById('custom-rules');
    const nomercyRules = document.getElementById('nomercy-rules');
    
    if (nomercyMode && customRules && nomercyRules) {
      nomercyMode.addEventListener('change', () => {
        customRules.classList.add('hidden');
        nomercyRules.classList.remove('hidden');
      });
      
      customMode.addEventListener('change', () => {
        customRules.classList.remove('hidden');
        nomercyRules.classList.add('hidden');
      });
      
      classicMode.addEventListener('change', () => {
        customRules.classList.add('hidden');
        nomercyRules.classList.add('hidden');
      });
    }
  },

  // Trocar entre abas de salas públicas/privadas
  switchRoomTab(tab) {
    const tabPublic = document.getElementById('tab-public-rooms');
    const tabPrivate = document.getElementById('tab-private-rooms');
    
    if (tab === 'public') {
      tabPublic.classList.add('active');
      tabPrivate.classList.remove('active');
      this.loadRooms(false);
    } else {
      tabPublic.classList.remove('active');
      tabPrivate.classList.add('active');
      this.loadRooms(true);
    }
  },

  // Carregar salas do Firebase
  async loadRooms(isPrivate = false) {
    try {
      // Mostrar carregamento
      UI.elements.roomsList.innerHTML = '<div class="loading">Carregando salas...</div>';
      
      // Consultar salas
      const roomsRef = database.ref('rooms');
      const roomsSnapshot = await roomsRef
        .orderByChild('updated_at')
        .limitToLast(50)
        .once('value');
      
      const rooms = [];
      roomsSnapshot.forEach(snapshot => {
        const room = snapshot.val();
        if (room && room.isPrivate === isPrivate && room.status !== 'closed') {
          rooms.push({
            ...room,
            id: snapshot.key
          });
        }
        return false;
      });
      
      // Ordenar por atualização mais recente
      rooms.sort((a, b) => b.updated_at - a.updated_at);
      
      // Renderizar salas
      this.renderRooms(rooms);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      UI.showToast('Erro ao carregar salas: ' + error.message, 'error');
      UI.elements.roomsList.innerHTML = '<div class="error-message">Erro ao carregar salas. Tente novamente.</div>';
    }
  },

  // Renderizar lista de salas
  renderRooms(rooms) {
    if (!rooms || rooms.length === 0) {
      UI.elements.roomsList.innerHTML = '<div class="no-rooms-message">Nenhuma sala disponível no momento. Crie uma nova sala!</div>';
      return;
    }
    
    UI.elements.roomsList.innerHTML = '';
    
    rooms.forEach(room => {
      const playersCount = room.players ? Object.keys(room.players).length : 0;
      const isPlaying = room.status === 'playing';
      const canJoin = playersCount < room.maxPlayers && !isPlaying;
      
      let modeLabel = 'Clássico';
      let modeIcon = '<i class="fas fa-star"></i>';
      
      if (room.gameMode === 'nomercy') {
        modeLabel = 'No Mercy';
        modeIcon = '<i class="fas fa-skull"></i>';
      } else if (room.gameMode === 'custom') {
        modeLabel = 'Personalizado';
        modeIcon = '<i class="fas fa-sliders-h"></i>';
      }
      
      const roomCard = document.createElement('div');
      roomCard.className = 'room-card';
      roomCard.innerHTML = `
        <div class="room-card-header">
          <h3 class="room-card-title">${room.name}</h3>
          <span class="room-card-status ${isPlaying ? 'playing' : 'waiting'}">${isPlaying ? 'Em jogo' : 'Aguardando'}</span>
        </div>
        <div class="room-card-info">
          <div class="room-card-info-item">
            <i class="fas fa-users"></i> ${playersCount}/${room.maxPlayers} jogadores
          </div>
          <div class="room-card-info-item">
            ${modeIcon} ${modeLabel}
          </div>
          ${room.isPrivate ? 
            `<div class="room-card-info-item">
              <i class="fas fa-lock"></i> Sala Privada
            </div>` : ''}
        </div>
        <div class="room-card-actions">
          <button class="btn btn-primary btn-join-room" data-room-id="${room.id}" ${canJoin ? '' : 'disabled'}>
            ${canJoin ? 'Entrar' : (isPlaying ? 'Em jogo' : 'Sala cheia')}
          </button>
        </div>
      `;
      
      // Adicionar evento ao botão de entrar
      const btnJoin = roomCard.querySelector('.btn-join-room');
      if (canJoin) {
        btnJoin.addEventListener('click', () => {
          this.joinRoom(room.id);
        });
      }
      
      UI.elements.roomsList.appendChild(roomCard);
    });
  },

  // Filtrar salas por pesquisa
  filterRooms(query) {
    const roomCards = document.querySelectorAll('.room-card');
    const normalizedQuery = query.toLowerCase().trim();
    
    roomCards.forEach(card => {
      const roomName = card.querySelector('.room-card-title').textContent.toLowerCase();
      
      if (roomName.includes(normalizedQuery)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
    
    // Mostrar mensagem se nenhuma sala for encontrada
    const visibleRooms = Array.from(roomCards).filter(card => card.style.display !== 'none').length;
    
    if (visibleRooms === 0) {
      const noRoomsElement = document.querySelector('.no-rooms-message') || document.createElement('div');
      noRoomsElement.className = 'no-rooms-message';
      noRoomsElement.textContent = 'Nenhuma sala encontrada com este nome.';
      
      if (!document.querySelector('.no-rooms-message')) {
        UI.elements.roomsList.appendChild(noRoomsElement);
      }
    } else {
      const noRoomsElement = document.querySelector('.no-rooms-message');
      if (noRoomsElement) {
        noRoomsElement.remove();
      }
    }
  },

  // Entrar em uma sala
  async joinRoom(roomId) {
    try {
      // CORREÇÃO: Garantir que roomId é válido
      if (!roomId) {
        UI.showToast('ID da sala inválido!', 'error');
        return;
      }

      // Verificar se a sala existe e tem espaço
      const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
      const room = roomSnapshot.val();
      
      if (!room) {
        UI.showToast('Sala não encontrada!', 'error');
        return;
      }
      
      const playersCount = room.players ? Object.keys(room.players).length : 0;
      
      if (playersCount >= room.maxPlayers) {
        UI.showToast('Sala cheia!', 'error');
        return;
      }
      
      if (room.status === 'playing') {
        UI.showToast('Jogo já em andamento!', 'error');
        return;
      }
      
      // CORREÇÃO: Usar timeout para garantir que o redirecionamento aconteça
      if (window.location.pathname.includes('lobby.html')) {
        // CORREÇÃO: Garantir que Room.initRoom é executado corretamente
        try {
          await Room.initRoom(roomId);
          UI.showToast('Entrando na sala...', 'success');
        } catch (error) {
          console.error('Erro ao inicializar sala:', error);
          UI.showToast('Erro ao entrar na sala. Tentando novamente...', 'error');
          setTimeout(() => this.joinRoom(roomId), 1000);
        }
      } else {
        // CORREÇÃO: Salvar o roomId em localStorage para recuperação em caso de erro
        localStorage.setItem('pendingRoomId', roomId);
        UI.showToast('Redirecionando para a sala...', 'info');
        // Se não, redirecionar para a página de lobby com o ID da sala
        setTimeout(() => {
          window.location.href = `lobby.html?roomId=${roomId}`;
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      UI.showToast('Erro ao entrar na sala: ' + error.message, 'error');
    }
  },

  // Entrar em sala privada por código
  async handleJoinPrivateRoom() {
    try {
      const codeInput = document.getElementById('private-room-code');
      const code = codeInput.value.trim().toUpperCase();
      
      if (!code) {
        UI.showToast('Digite o código da sala!', 'error');
        return;
      }
      
      // Procurar sala pelo código
      const roomsRef = database.ref('rooms');
      const roomsSnapshot = await roomsRef
        .orderByChild('code')
        .equalTo(code)
        .once('value');
      
      const rooms = [];
      roomsSnapshot.forEach(snapshot => {
        rooms.push({
          id: snapshot.key,
          ...snapshot.val()
        });
        return false;
      });
      
      if (rooms.length === 0) {
        UI.showToast('Sala não encontrada!', 'error');
        return;
      }
      
      const room = rooms[0];
      
      // Verificar se a sala tem espaço
      const playersCount = room.players ? Object.keys(room.players).length : 0;
      
      if (playersCount >= room.maxPlayers) {
        UI.showToast('Sala cheia!', 'error');
        return;
      }
      
      if (room.status === 'playing') {
        UI.showToast('Jogo já em andamento!', 'error');
        return;
      }
      
      // Fechar modal
      UI.closeModal(UI.elements.joinPrivateRoomModal);
      
      // Entrar na sala
      this.joinRoom(room.id);
    } catch (error) {
      console.error('Erro ao entrar na sala privada:', error);
      UI.showToast('Erro ao entrar na sala: ' + error.message, 'error');
    }
  },

  // Criar uma nova sala
  async handleCreateRoom() {
    try {
      // Obter dados do formulário
      const name = document.getElementById('room-name').value.trim();
      const capacity = document.getElementById('room-capacity').value;
      const isPrivate = document.getElementById('room-is-private').checked;
      const code = isPrivate ? document.getElementById('room-code').value.trim() : null;
      const gameMode = document.querySelector('input[name="game-mode"]:checked').value;
      
      // Regras personalizadas
      const stackDraw2 = document.getElementById('rule-stack-draw2').checked;
      const stackDraw4 = document.getElementById('rule-stack-draw4').checked;
      const forcePlay = document.getElementById('rule-force-play').checked;
      const special99 = document.getElementById('rule-special99').checked;
      
      // Validar dados
      if (!name) {
        UI.showToast('Digite um nome para a sala!', 'error');
        return;
      }
      
      if (isPrivate && !code) {
        UI.showToast('Gere um código para a sala privada!', 'error');
        return;
      }
      
      UI.showToast('Criando sala...', 'info');
      
      // CORREÇÃO: Adicionar mais informações de feedback
      try {
        // Criar sala
        const roomData = {
          name,
          capacity,
          isPrivate,
          code,
          gameMode,
          stackDraw2,
          stackDraw4,
          forcePlay,
          special99
        };
        
        const roomId = await Room.createRoom(roomData);
        
        if (roomId) {
          // Fechar modal
          UI.closeModal(UI.elements.createRoomModal);
          
          // Limpar formulário
          document.getElementById('create-room-form').reset();
          
          // CORREÇÃO: Melhorar o processo de entrada na sala
          UI.showToast('Sala criada! Entrando na sala...', 'success');
          
          // Garantir tempo para o Firebase sincronizar
          setTimeout(async () => {
            try {
              // Ir para a sala
              await this.joinRoom(roomId);
            } catch (joinError) {
              console.error('Erro ao entrar na sala após criação:', joinError);
              // Última tentativa - recarregar a página com o roomId na URL
              window.location.href = `lobby.html?roomId=${roomId}`;
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Erro específico ao criar sala:', error);
        UI.showToast('Falha ao criar sala. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      UI.showToast('Erro ao criar sala: ' + error.message, 'error');
    }
  }
};