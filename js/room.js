// Gerenciador de salas
const Room = {
  // Referência à sala atual
  roomRef: null,
  
  // ID da sala atual
  roomId: null,
  
  // Flag se o usuário é o host
  isHost: false,
  
  // Inicializar sala
  async initRoom(roomId) {
    this.roomId = roomId;
    this.roomRef = database.ref(`rooms/${roomId}`);
    
    // Verificar se a sala existe
    const roomSnapshot = await this.roomRef.once('value');
    const room = roomSnapshot.val();
    
    if (!room) {
      UI.showToast('Sala não encontrada!', 'error');
      UI.showSection('main-menu');
      return;
    }
    
    // Verificar se é o host
    this.isHost = room.hostId === auth.currentUser.uid;
    
    // Entrar na sala
    await this.joinRoom();
    
    // Inicializar o jogo
    Game.initGame(roomId, this.isHost);
    
    // Inicializar o chat
    Chat.initChat(roomId);
    
    // Atualizar informações da sala
    this.updateRoomInfo(room);
    this.renderPlayers(room);
    
    // Configurar event listeners
    this.setupRoomEventListeners();
    
    // Mostrar a seção do jogo
    UI.showSection('game-room-section');
  },

  // Criar uma nova sala
  async createRoom(roomData) {
    try {
      // Gerar ID único para a sala
      const roomRef = database.ref('rooms').push();
      const roomId = roomRef.key;
      
      // Dados da sala
      const roomInfo = {
        id: roomId,
        name: roomData.name,
        hostId: auth.currentUser.uid,
        maxPlayers: parseInt(roomData.capacity),
        isPrivate: roomData.isPrivate,
        code: roomData.isPrivate ? roomData.code : null,
        gameMode: roomData.gameMode,
        settings: this.getSettingsForMode(roomData),
        status: 'waiting',
        players: {},
        created_at: firebase.database.ServerValue.TIMESTAMP,
        updated_at: firebase.database.ServerValue.TIMESTAMP
      };
      
      // Adicionar o host como primeiro jogador
      const avatarURL = localStorage.getItem('avatarURL');
      const avatarSeed = localStorage.getItem('avatar');
      
      roomInfo.players[auth.currentUser.uid] = {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'Jogador',
        avatar: avatarURL || undefined,
        avatarSeed: !avatarURL ? (avatarSeed || auth.currentUser.uid) : undefined,
        isHost: true,
        isReady: false,
        joined_at: firebase.database.ServerValue.TIMESTAMP
      };
      
      // Salvar a sala no Firebase
      await roomRef.set(roomInfo);
      
      // Inicializar a sala - vai direto para a tela da sala
      this.initRoom(roomId);
      
      UI.showToast('Sala criada com sucesso!', 'success');
      
      return roomId;
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      UI.showToast('Erro ao criar sala: ' + error.message, 'error');
      return null;
    }
  },

  // Configurar regras com base no modo
  getSettingsForMode(roomData) {
    if (roomData.gameMode === 'classic') {
      return {
        stackDraw2: false,
        stackDraw4: false,
        forcePlay: false,
        special99: false,
        noMercy: false
      };
    } else if (roomData.gameMode === 'nomercy') {
      return {
        stackDraw2: true,
        stackDraw4: true,
        forcePlay: true,
        special99: true,
        noMercy: true
      };
    } else { // custom
      return {
        stackDraw2: roomData.stackDraw2,
        stackDraw4: roomData.stackDraw4,
        forcePlay: roomData.forcePlay,
        special99: roomData.special99,
        noMercy: false
      };
    }
  },

  // Entrar em uma sala
  async joinRoom() {
    try {
      // Verificar se o jogador já está na sala
      const playerRef = database.ref(`rooms/${this.roomId}/players/${auth.currentUser.uid}`);
      const playerSnapshot = await playerRef.once('value');
      
      if (!playerSnapshot.exists()) {
        // Adicionar o jogador à sala com suporte a avatar customizado
        const avatarURL = localStorage.getItem('avatarURL');
        const avatarSeed = localStorage.getItem('avatar');
        
        await playerRef.set({
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Jogador',
          avatar: avatarURL || undefined,
          avatarSeed: !avatarURL ? (avatarSeed || auth.currentUser.uid) : undefined,
          isHost: false,
          isReady: false,
          joined_at: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Notificar outros jogadores
        Chat.sendSystemMessage(`${auth.currentUser.displayName || 'Novo jogador'} entrou na sala.`);
      }
      
      // Atualizar status de presença
      this.updatePresence();
      
      return true;
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      UI.showToast('Erro ao entrar na sala: ' + error.message, 'error');
      return false;
    }
  },

  // Sair da sala
  async leaveRoom() {
    try {
      if (!this.roomId) return;
      
      // Remover jogador da sala
      await database.ref(`rooms/${this.roomId}/players/${auth.currentUser.uid}`).remove();
      
      // Se era o host, verificar se há outros jogadores para transferir o host
      if (this.isHost) {
        const roomSnapshot = await this.roomRef.once('value');
        const room = roomSnapshot.val();
        
        if (room && room.players) {
          const players = Object.values(room.players);
          
          if (players.length > 0) {
            // Transferir host para o jogador mais antigo
            const newHost = players.sort((a, b) => a.joined_at - b.joined_at)[0];
            await database.ref(`rooms/${this.roomId}/players/${newHost.id}/isHost`).set(true);
            await database.ref(`rooms/${this.roomId}/hostId`).set(newHost.id);
            
            // Notificar outros jogadores
            Chat.sendSystemMessage(`${newHost.name} é o novo host.`);
          } else {
            // Se não há outros jogadores, remover a sala
            await this.roomRef.remove();
          }
        }
      }
      
      // Notificar outros jogadores
      Chat.sendSystemMessage(`${auth.currentUser.displayName || 'Jogador'} saiu da sala.`);
      
      // Limpar referências
      this.roomRef = null;
      this.roomId = null;
      this.isHost = false;
      
      // Limpar listeners do jogo
      Game.cleanup();
      
      // Limpar listeners do chat
      Chat.cleanup();
      
      return true;
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
      UI.showToast('Erro ao sair da sala: ' + error.message, 'error');
      return false;
    }
  },

  // Atualizar presença do jogador
  updatePresence() {
    const presenceRef = database.ref(`rooms/${this.roomId}/players/${auth.currentUser.uid}/lastActive`);
    
    // Atualizar timestamp a cada 30 segundos
    this.presenceInterval = setInterval(() => {
      presenceRef.set(firebase.database.ServerValue.TIMESTAMP);
    }, 30000);
    
    // Configurar limpeza quando o usuário sair
    database.ref('.info/connected').on('value', (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }
      
      presenceRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
    });
  },

  // Atualizar informações da sala
  updateRoomInfo(room) {
    // Atualizar título da sala
    document.getElementById('room-title').textContent = room.name;
    
    // Adicionar informações do modo de jogo
    let modeText = "";
    if (room.gameMode === 'classic') {
      modeText = "Modo Clássico";
    } else if (room.gameMode === 'nomercy') {
      modeText = "Modo No Mercy";
    } else {
      modeText = "Modo Personalizado";
    }
    
    // Adicionar modo ao título se não existir
    const modeInfo = document.querySelector('.room-mode-info');
    if (modeInfo) {
      modeInfo.textContent = ` (${modeText})`;
    } else {
      const titleEl = document.getElementById('room-title');
      const modeSpan = document.createElement('span');
      modeSpan.className = 'room-mode-info';
      modeSpan.textContent = ` (${modeText})`;
      titleEl.appendChild(modeSpan);
    }
    
    // Atualizar código da sala se for privada
    const roomCodeDisplay = document.getElementById('room-code-display');
    const roomCodeText = document.getElementById('room-code-text');
    
    if (room.isPrivate && room.code) {
      roomCodeDisplay.classList.remove('hidden');
      roomCodeText.textContent = room.code;
    } else {
      roomCodeDisplay.classList.add('hidden');
    }
    
    // Mostrar botões de iniciar/encerrar jogo apenas para o host
    const btnStartGame = document.getElementById('btn-start-game');
    const btnEndGame = document.getElementById('btn-end-game');
    
    if (this.isHost) {
      btnStartGame.classList.remove('hidden');
      btnEndGame.classList.remove('hidden');
      
      // Desabilitar se não há jogadores suficientes
      const playersCount = room.players ? Object.keys(room.players).length : 0;
      btnStartGame.disabled = playersCount < 2;
    } else {
      btnStartGame.classList.add('hidden');
      btnEndGame.classList.add('hidden');
    }
  },

  // Renderizar lista de jogadores na sala
  renderPlayers(room) {
    if (!room || !room.players) return;
    
    const players = Object.values(room.players);
    const playersContainer = document.querySelector('.players-container');
    
    // Limpar container
    playersContainer.innerHTML = '';
    
    // Título
    const title = document.createElement('h3');
    title.textContent = 'Jogadores';
    playersContainer.appendChild(title);
    
    // Container para previews de jogadores
    const previewsContainer = document.createElement('div');
    previewsContainer.className = 'player-previews';
    
    // Adicionar cada jogador
    players.forEach(player => {
      const playerPreview = document.createElement('div');
      playerPreview.className = `player-preview ${player.isHost ? 'host' : ''}`;
      
      let avatarSrc;
      if (player.avatar) {
        // Avatar customizado
        avatarSrc = player.avatar;
      } else {
        // Avatar gerado
        const seed = player.avatarSeed || player.id;
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
      
      playerPreview.innerHTML = `
        <img src="${avatarSrc}" alt="${player.name}">
        <div class="player-name">${player.name}</div>
        ${player.isHost ? '<div class="host-badge">Host</div>' : ''}
      `;
      
      previewsContainer.appendChild(playerPreview);
    });
    
    playersContainer.appendChild(previewsContainer);
  },

  // Encerrar jogo (quando ainda não começou)
  async endGame() {
    try {
      // Verificar se é o host
      const roomSnapshot = await this.roomRef.once('value');
      const room = roomSnapshot.val();
      
      if (!room || room.hostId !== auth.currentUser.uid) {
        UI.showToast('Apenas o host pode encerrar o jogo!', 'error');
        return false;
      }
      
      if (room.status === 'playing') {
        UI.showToast('Não é possível encerrar um jogo em andamento!', 'error');
        return false;
      }
      
      // Resetar o jogo
      await this.roomRef.update({
        status: 'waiting',
        updated_at: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Resetar o estado do jogo
      await database.ref(`games/${this.roomId}`).remove();
      
      // Notificar outros jogadores
      Chat.sendSystemMessage('O host encerrou o jogo.');
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
    // Botão para iniciar o jogo
    document.getElementById('btn-start-game').addEventListener('click', () => {
      Game.startGame();
    });
    
    // Botão para encerrar o jogo (antes de começar)
    document.getElementById('btn-end-game').addEventListener('click', async () => {
      await this.endGame();
    });
    
    // Botão para sair da sala
    document.getElementById('btn-leave-room').addEventListener('click', async () => {
      await this.leaveRoom();
      UI.showSection('main-menu');
    });
    
    // Botão para copiar código da sala
    document.getElementById('copy-room-code').addEventListener('click', () => {
      const roomCode = document.getElementById('room-code-text').textContent;
      UI.copyToClipboard(roomCode);
      UI.showToast('Código copiado para a área de transferência!', 'success');
    });
    
    // Ouvir mudanças na sala
    this.roomRef.on('value', (snapshot) => {
      const room = snapshot.val();
      if (!room) {
        UI.showToast('A sala foi fechada pelo host!', 'error');
        UI.showSection('main-menu');
        return;
      }
      
      this.updateRoomInfo(room);
      this.renderPlayers(room);
    });
  },

  // Limpar event listeners quando sair da sala
  cleanup() {
    clearInterval(this.presenceInterval);
    
    if (this.roomRef) {
      this.roomRef.off();
    }
  }
};