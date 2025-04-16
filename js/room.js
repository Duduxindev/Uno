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
          settings: {
            stackDraw2: roomData.gameMode === 'classic' || roomData.stackDraw2,
            stackDraw4: roomData.gameMode === 'classic' || roomData.stackDraw4,
            forcePlay: roomData.gameMode === 'classic' ? false : roomData.forcePlay,
            special99: roomData.gameMode === 'classic' ? false : roomData.special99
          },
          status: 'waiting',
          players: {},
          created_at: firebase.database.ServerValue.TIMESTAMP,
          updated_at: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Adicionar o host como primeiro jogador
        roomInfo.players[auth.currentUser.uid] = {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Jogador',
          avatar: localStorage.getItem('avatar') || auth.currentUser.uid,
          isHost: true,
          isReady: false,
          joined_at: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Salvar a sala no Firebase
        await roomRef.set(roomInfo);
        
        // Inicializar a sala
        this.initRoom(roomId);
        
        UI.showToast('Sala criada com sucesso!', 'success');
        
        return roomId;
      } catch (error) {
        console.error('Erro ao criar sala:', error);
        UI.showToast('Erro ao criar sala!', 'error');
        return null;
      }
    },
  
    // Entrar em uma sala
    async joinRoom() {
      try {
        // Verificar se o jogador já está na sala
        const playerRef = database.ref(`rooms/${this.roomId}/players/${auth.currentUser.uid}`);
        const playerSnapshot = await playerRef.once('value');
        
        if (!playerSnapshot.exists()) {
          // Adicionar o jogador à sala
          await playerRef.set({
            id: auth.currentUser.uid,
            name: auth.currentUser.displayName || 'Jogador',
            avatar: localStorage.getItem('avatar') || auth.currentUser.uid,
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
        UI.showToast('Erro ao entrar na sala!', 'error');
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
        UI.showToast('Erro ao sair da sala!', 'error');
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
      
      // Atualizar código da sala se for privada
      const roomCodeDisplay = document.getElementById('room-code-display');
      const roomCodeText = document.getElementById('room-code-text');
      
      if (room.isPrivate && room.code) {
        roomCodeDisplay.classList.remove('hidden');
        roomCodeText.textContent = room.code;
      } else {
        roomCodeDisplay.classList.add('hidden');
      }
      
      // Mostrar botão de iniciar jogo apenas para o host
      const btnStartGame = document.getElementById('btn-start-game');
      if (this.isHost) {
        btnStartGame.classList.remove('hidden');
        
        // Desabilitar se não há jogadores suficientes
        const playersCount = room.players ? Object.keys(room.players).length : 0;
        btnStartGame.disabled = playersCount < 2;
      } else {
        btnStartGame.classList.add('hidden');
      }
    },
  
    // Configurar event listeners da sala
    setupRoomEventListeners() {
      // Botão para iniciar o jogo
      document.getElementById('btn-start-game').addEventListener('click', () => {
        Game.startGame();
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