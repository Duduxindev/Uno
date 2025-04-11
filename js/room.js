/**
 * Sistema de salas para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

class Room {
    constructor(code, host, maxPlayers = 4, gameMode = 'normal', customRules = {}) {
      this.code = code;
      this.host = host;
      this.players = {}; // Mapeado por ID do jogador
      this.maxPlayers = maxPlayers;
      this.gameMode = gameMode;
      this.customRules = customRules;
      this.status = 'waiting'; // 'waiting', 'playing', 'finished'
      this.createdAt = Date.now();
      this.updatedAt = Date.now();
      this.game = null;
      this.messages = [];
    }
    
    // Adicionar um jogador à sala
    addPlayer(player) {
      // Verificar se a sala está cheia
      if (Object.keys(this.players).length >= this.maxPlayers) {
        throw new Error("A sala está cheia.");
      }
      
      // Verificar se o jogador já está na sala
      if (this.players[player.id]) {
        throw new Error("Jogador já está na sala.");
      }
      
      // Adicionar jogador
      this.players[player.id] = player;
      this.updatedAt = Date.now();
      
      return player;
    }
    
    // Remover um jogador da sala
    removePlayer(playerId) {
      // Verificar se o jogador está na sala
      if (!this.players[playerId]) {
        throw new Error("Jogador não encontrado na sala.");
      }
      
      // Remover jogador
      const player = this.players[playerId];
      delete this.players[playerId];
      this.updatedAt = Date.now();
      
      // Se o host saiu, definir um novo host
      if (this.host === playerId && Object.keys(this.players).length > 0) {
        this.host = Object.keys(this.players)[0];
      }
      
      return player;
    }
    
    // Obter um jogador da sala
    getPlayer(playerId) {
      return this.players[playerId];
    }
    
    // Verificar se a sala está cheia
    isFull() {
      return Object.keys(this.players).length >= this.maxPlayers;
    }
    
    // Verificar se um jogador é o anfitrião
    isHost(playerId) {
      return this.host === playerId;
    }
    
    // Iniciar o jogo
    startGame(gameState) {
      // Verificar se há jogadores suficientes
      if (Object.keys(this.players).length < 2) {
        throw new Error("São necessários pelo menos 2 jogadores para iniciar o jogo.");
      }
      
      // Verificar se a sala já está jogando
      if (this.status === 'playing') {
        throw new Error("O jogo já foi iniciado.");
      }
      
      // Atualizar status
      this.status = 'playing';
      this.game = gameState;
      this.updatedAt = Date.now();
    }
    
    // Finalizar o jogo
    endGame(winner) {
      this.status = 'finished';
      this.game.winner = winner;
      this.game.finishedAt = Date.now();
      this.updatedAt = Date.now();
    }
    
    // Adicionar mensagem ao chat
    addMessage(message) {
      this.messages.push(message);
      
      // Manter apenas as últimas 50 mensagens
      if (this.messages.length > 50) {
        this.messages.shift();
      }
      
      this.updatedAt = Date.now();
      return message;
    }
    
    // Converter para formato para Firebase
    toFirebase() {
      const playersForFirebase = {};
      
      // Converter jogadores para formato Firebase
      Object.keys(this.players).forEach(playerId => {
        playersForFirebase[playerId] = this.players[playerId].toFirebase();
      });
      
      return {
        code: this.code,
        host: this.host,
        players: playersForFirebase,
        maxPlayers: this.maxPlayers,
        gameMode: this.gameMode,
        customRules: this.customRules,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        game: this.game,
        messages: this.messages
      };
    }
    
    // Criar sala a partir de dados do Firebase
    static fromFirebase(data) {
      const room = new Room(
        data.code,
        data.host,
        data.maxPlayers,
        data.gameMode,
        data.customRules
      );
      
      room.status = data.status;
      room.createdAt = data.createdAt;
      room.updatedAt = data.updatedAt;
      room.game = data.game;
      room.messages = data.messages || [];
      
      // Converter jogadores de volta do Firebase
      if (data.players) {
        Object.keys(data.players).forEach(playerId => {
          room.players[playerId] = Player.fromFirebase(data.players[playerId]);
        });
      }
      
      return room;
    }
  }
  
  // Classe para gerenciar salas online
  class RoomManager {
    constructor() {
      this.currentRoom = null;
      this.roomListener = null;
    }
    
    // Criar uma nova sala
    async createRoom(host, maxPlayers, gameMode, customRules) {
      try {
        // Gerar código para a sala
        const roomCode = FirebaseUtil.generateRoomCode();
        
        // Criar sala
        const room = new Room(roomCode, host.id, maxPlayers, gameMode, customRules);
        room.addPlayer(host);
        
        // Salvar sala no Firebase
        await firebase.database().ref(`rooms/${roomCode}`).set(room.toFirebase());
        
        // Configurar listener para mudanças na sala
        this.setupRoomListener(roomCode);
        
        // Salvar dados da sessão
        Storage.saveSession({
          roomCode: roomCode,
          playerId: host.id,
          isHost: true
        });
        
        this.currentRoom = room;
        
        return room;
      } catch (error) {
        console.error("Erro ao criar sala:", error);
        throw error;
      }
    }
    
    // Entrar em uma sala existente
    async joinRoom(roomCode, player) {
      try {
        // Verificar se a sala existe
        const roomExists = await FirebaseUtil.checkRoomExists(roomCode);
        if (!roomExists) {
          throw new Error(`Sala ${roomCode} não encontrada.`);
        }
        
        // Obter dados da sala
        const snapshot = await firebase.database().ref(`rooms/${roomCode}`).once('value');
        const roomData = snapshot.val();
        
        // Verificar se a sala está cheia
        if (Object.keys(roomData.players || {}).length >= roomData.maxPlayers) {
          throw new Error("A sala está cheia.");
        }
        
        // Verificar status da sala
        if (roomData.status !== 'waiting') {
          throw new Error("Esta sala já está jogando ou finalizada.");
        }
        
        // Adicionar jogador à sala
        const playerFirebase = player.toFirebase();
        await firebase.database().ref(`rooms/${roomCode}/players/${player.id}`).set(playerFirebase);
        
        // Configurar listener para mudanças na sala
        this.setupRoomListener(roomCode);
        
        // Salvar dados da sessão
        Storage.saveSession({
          roomCode: roomCode,
          playerId: player.id,
          isHost: false
        });
        
        // Converter roomData para objeto Room
        this.currentRoom = Room.fromFirebase(roomData);
        
        return this.currentRoom;
      } catch (error) {
        console.error("Erro ao entrar na sala:", error);
        throw error;
      }
    }
    
    // Sair da sala atual
    async leaveRoom() {
      try {
        const session = Storage.getSession();
        
        if (!session.roomCode || !session.playerId) {
          throw new Error("Sessão não encontrada.");
        }
        
        // Remover jogador da sala
        await firebase.database().ref(`rooms/${session.roomCode}/players/${session.playerId}`).remove();
        
        // Se era o host e o jogo não estava em andamento, excluir a sala
        if (session.isHost && this.currentRoom && this.currentRoom.status === 'waiting') {
          await firebase.database().ref(`rooms/${session.roomCode}`).remove();
        }
        
        // Remover listener da sala
        this.removeRoomListener();
        
        // Limpar dados da sessão
        Storage.clearSession();
        
        this.currentRoom = null;
        
        return true;
      } catch (error) {
        console.error("Erro ao sair da sala:", error);
        throw error;
      }
    }
    
    // Iniciar o jogo na sala atual
    async startGame(gameState) {
      try {
        const session = Storage.getSession();
        
        if (!session.roomCode || !session.isHost) {
          throw new Error("Apenas o anfitrião pode iniciar o jogo.");
        }
        
        // Verificar se a sala existe
        const roomExists = await FirebaseUtil.checkRoomExists(session.roomCode);
        if (!roomExists) {
          throw new Error("Sala não encontrada.");
        }
        
        // Atualizar status da sala para 'playing'
        await firebase.database().ref(`rooms/${session.roomCode}`).update({
          status: 'playing',
          game: gameState,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        return true;
      } catch (error) {
        console.error("Erro ao iniciar jogo:", error);
        throw error;
      }
    }
    
    // Configurar listener para mudanças na sala
    setupRoomListener(roomCode) {
      // Remover listener anterior se existir
      this.removeRoomListener();
      
      // Criar novo listener
      this.roomListener = firebase.database().ref(`rooms/${roomCode}`).on('value', snapshot => {
        const roomData = snapshot.val();
        
        // Verificar se a sala ainda existe
        if (!roomData) {
          console.log(`Sala ${roomCode} não existe mais.`);
          
          // Mostrar notificação ao usuário
          const toast = document.getElementById('toast');
          if (toast) {
            toast.textContent = "A sala foi encerrada pelo anfitrião.";
            toast.className = 'toast show error';
            
            setTimeout(() => {
              toast.className = 'toast';
            }, 5000);
          }
          
          // Redirecionar para a tela inicial
          if (window.showScreen) {
            window.showScreen('start-screen');
          }
          
          // Limpar dados da sessão
          Storage.clearSession();
          
          this.removeRoomListener();
          this.currentRoom = null;
          return;
        }
        
        // Atualizar sala atual
        this.currentRoom = Room.fromFirebase(roomData);
        
        // Disparar evento de atualização da sala
        const event = new CustomEvent('roomUpdate', {
          detail: { room: this.currentRoom }
        });
        document.dispatchEvent(event);
        
        // Verificar se o jogo foi iniciado
        if (this.currentRoom.status === 'playing' && window.location.hash !== '#game') {
          if (window.showScreen) {
            window.showScreen('game-screen');
          }
        }
      });
    }
    
    // Remover listener da sala
    removeRoomListener() {
      const session = Storage.getSession();
      
      if (session.roomCode && this.roomListener) {
        firebase.database().ref(`rooms/${session.roomCode}`).off('value', this.roomListener);
        this.roomListener = null;
      }
    }
    
    // Enviar mensagem para o chat da sala
    async sendMessage(message) {
      try {
        const session = Storage.getSession();
        
        if (!session.roomCode || !session.playerId) {
          throw new Error("Sessão não encontrada.");
        }
        
        // Criar objeto de mensagem
        const messageObj = {
          id: Date.now().toString(),
          playerId: session.playerId,
          playerName: this.currentRoom.players[session.playerId].name,
          text: message,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Adicionar mensagem ao chat da sala
        await firebase.database().ref(`rooms/${session.roomCode}/messages`).push(messageObj);
        
        return messageObj;
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        throw error;
      }
    }
  }
  
  // Inicializar gerenciador de salas global
  const roomManager = new RoomManager();
  
  console.log("✅ Sistema de salas inicializado!");