/**
 * Inicializador de jogo para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

class GameStarter {
    constructor() {
      // Referências a elementos do DOM
      this.startLocalGameBtn = document.getElementById('start-local-game-btn');
      this.createRoomBtn = document.getElementById('create-room-btn');
      this.joinRoomBtn = document.getElementById('join-room-btn');
      this.startGameBtn = document.getElementById('start-game-btn');
      
      // Inicializar
      this.init();
    }
    
    // Inicializar GameStarter
    init() {
      this.setupEventListeners();
    }
    
    // Configurar event listeners
    setupEventListeners() {
      // Iniciar jogo local
      if (this.startLocalGameBtn) {
        this.startLocalGameBtn.addEventListener('click', () => this.startLocalGame());
      }
      
      // Criar sala online
      if (this.createRoomBtn) {
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
      }
      
      // Entrar em sala online
      if (this.joinRoomBtn) {
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
      }
      
      // Iniciar jogo online
      if (this.startGameBtn) {
        this.startGameBtn.addEventListener('click', () => this.startOnlineGame());
      }
    }
    
    // Iniciar jogo local
    startLocalGame() {
      try {
        // Obter configurações selecionadas
        const playerCount = parseInt(document.getElementById('player-count').value) || 4;
        
        // Obter modo de jogo selecionado
        const modeElements = document.querySelectorAll('.mode-card');
        let selectedMode = 'normal';
        
        modeElements.forEach(element => {
          if (element.classList.contains('selected')) {
            selectedMode = element.dataset.mode;
          }
        });
        
        // Obter regras personalizadas
        const customRules = {
          stacking: document.getElementById('stacking').checked,
          jumpIn: document.getElementById('jump-in').checked,
          forcePlay: document.getElementById('force-play').checked,
          sevenTrade: document.getElementById('seven-trade').checked,
          zeroRotate: document.getElementById('zero-rotate').checked
        };
        
        // Criar configuração do jogo
        const gameConfig = {
          mode: selectedMode,
          playerCount: playerCount,
          customRules: customRules,
          isOnline: false
        };
        
        // Salvar configuração na sessão
        Storage.saveSession({
          gameConfig: gameConfig,
          isHost: true,
          isOnline: false
        });
        
        // Inicializar jogo
        if (window.gameInitializer) {
          window.gameInitializer.initLocalGame(gameConfig);
        }
        
        // Navegar para tela de jogo
        window.showScreen('game-screen');
        
      } catch (error) {
        console.error("Erro ao iniciar jogo local:", error);
        this.showError(error.message || "Erro ao iniciar jogo.");
      }
    }
    
    // Criar sala online
    async createRoom() {
      try {
        // Obter dados do formulário
        const hostName = document.getElementById('host-name').value.trim();
        if (!hostName) {
          throw new Error("Por favor, informe seu nome.");
        }
        
        const maxPlayers = parseInt(document.getElementById('max-players').value) || 4;
        const gameMode = document.getElementById('room-mode').value || 'normal';
        
        // Obter regras personalizadas
        const customRules = {
          stacking: document.getElementById('room-stacking').checked,
          jumpIn: document.getElementById('room-jump-in').checked,
          forcePlay: document.getElementById('room-force-play').checked,
          sevenTrade: document.getElementById('room-seven-trade').checked,
          zeroRotate: document.getElementById('room-zero-rotate').checked
        };
        
        // Mostrar feedback visual
        this.createRoomBtn.textContent = "Criando sala...";
        this.createRoomBtn.disabled = true;
        
      // Criar objeto do jogador host
      const hostPlayer = new Player(Date.now().toString(), hostName);
      
      // Criar sala
      const room = await roomManager.createRoom(hostPlayer, maxPlayers, gameMode, customRules);
      
      // Mostrar notificação de sucesso
      this.showSuccess(`Sala criada com o código ${room.code}`);
      
      // Navegar para sala de espera
      window.showScreen('waiting-room-screen');
      
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      this.showError(error.message || "Erro ao criar sala.");
      
      // Restaurar botão
      if (this.createRoomBtn) {
        this.createRoomBtn.textContent = "Criar Sala";
        this.createRoomBtn.disabled = false;
      }
    }
  }
  
  // Entrar em sala online
  async joinRoom() {
    try {
      // Obter dados do formulário
      const playerName = document.getElementById('player-name').value.trim();
      if (!playerName) {
        throw new Error("Por favor, informe seu nome.");
      }
      
      const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
      if (!roomCode || roomCode.length !== 4) {
        throw new Error("Código de sala inválido.");
      }
      
      // Mostrar feedback visual
      this.joinRoomBtn.textContent = "Entrando...";
      this.joinRoomBtn.disabled = true;
      
      // Criar objeto do jogador
      const player = new Player(Date.now().toString(), playerName);
      
      // Entrar na sala
      await roomManager.joinRoom(roomCode, player);
      
      // Mostrar notificação de sucesso
      this.showSuccess(`Você entrou na sala ${roomCode}`);
      
      // Navegar para sala de espera
      window.showScreen('waiting-room-screen');
      
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      this.showError(error.message || "Erro ao entrar na sala.");
      
      // Restaurar botão
      if (this.joinRoomBtn) {
        this.joinRoomBtn.textContent = "Entrar na Sala";
        this.joinRoomBtn.disabled = false;
      }
    }
  }
  
  // Iniciar jogo online
  async startOnlineGame() {
    try {
      const session = Storage.getSession();
      
      // Verificar se é o anfitrião
      if (!session.isHost) {
        throw new Error("Apenas o anfitrião pode iniciar o jogo.");
      }
      
      // Obter sala atual
      const room = roomManager.currentRoom;
      if (!room) {
        throw new Error("Sala não encontrada.");
      }
      
      // Verificar número de jogadores
      const playerCount = Object.keys(room.players).length;
      if (playerCount < 2) {
        throw new Error("São necessários pelo menos 2 jogadores para iniciar o jogo.");
      }
      
      // Mostrar feedback visual
      this.startGameBtn.textContent = "Iniciando...";
      this.startGameBtn.disabled = true;
      
      // Criar estado inicial do jogo
      const gameState = this.createInitialGameState(room);
      
      // Iniciar jogo na sala
      await roomManager.startGame(gameState);
      
      // Navegar para tela de jogo
      window.showScreen('game-screen');
      
      // Mostrar notificação de sucesso
      this.showSuccess("Jogo iniciado!");
      
    } catch (error) {
      console.error("Erro ao iniciar jogo online:", error);
      this.showError(error.message || "Erro ao iniciar jogo.");
      
      // Restaurar botão
      if (this.startGameBtn) {
        this.startGameBtn.textContent = "Iniciar Jogo";
        this.startGameBtn.disabled = false;
      }
    }
  }
  
  // Criar estado inicial para jogo online
  createInitialGameState(room) {
    // Obter todas as cartas do baralho
    const deck = this.createDeck(room.gameMode);
    
    // Embaralhar o baralho
    this.shuffleDeck(deck);
    
    // Obter IDs dos jogadores na ordem
    const playerIds = Object.keys(room.players);
    
    // Distribuir 7 cartas para cada jogador
    const hands = {};
    playerIds.forEach(playerId => {
      hands[playerId] = [];
      for (let i = 0; i < 7; i++) {
        hands[playerId].push(deck.pop());
      }
    });
    
    // Escolher primeira carta (que não seja Wild Draw Four)
    let firstCard;
    do {
      firstCard = deck.pop();
      
      // Se for Wild Draw Four, colocar de volta no final
      if (firstCard.type === 'wild' && firstCard.value === 'wild-draw-four') {
        deck.unshift(firstCard);
        firstCard = null;
      }
    } while (!firstCard);
    
    // Determinar cor inicial
    let initialColor = firstCard.color;
    if (firstCard.type === 'wild') {
      const colors = ['red', 'blue', 'green', 'yellow'];
      initialColor = colors[Math.floor(Math.random() * colors.length)];
      firstCard.chosenColor = initialColor;
    }
    
    // Determinar jogador inicial
    let startingPlayerIndex = 0;
    
    // Aplicar efeitos da primeira carta
    if (firstCard.type === 'action') {
      switch (firstCard.value) {
        case 'skip':
          // Pular primeiro jogador
          startingPlayerIndex = 1 % playerIds.length;
          break;
        case 'reverse':
          // Em jogo de 2, funciona como Skip
          if (playerIds.length === 2) {
            startingPlayerIndex = 1;
          }
          break;
        case 'draw2':
          // Primeiro jogador compra 2 e perde a vez
          const player0Id = playerIds[0];
          hands[player0Id].push(...deck.splice(deck.length - 2, 2));
          startingPlayerIndex = 1 % playerIds.length;
          break;
      }
    }
    
    // Construir estado do jogo
    return {
      playerIds: playerIds,
      currentPlayerIndex: startingPlayerIndex,
      direction: 1, // 1 = clockwise, -1 = counter-clockwise
      deck: deck,
      discard: [firstCard],
      hands: hands,
      currentColor: initialColor,
      drawStack: 0,
      turn: 0,
      startedAt: firebase.database.ServerValue.TIMESTAMP,
      lastAction: {
        type: 'gameStart',
        timestamp: firebase.database.ServerValue.TIMESTAMP
      }
    };
  }
  
  // Criar baralho completo
  createDeck(gameMode) {
    const deck = [];
    const colors = ['red', 'blue', 'green', 'yellow'];
    const mode = GameModes.getMode(gameMode);
    
    // Gerar ID único para cada carta
    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    // Adicionar cartas numéricas (0-9)
    for (let color of colors) {
      // Um 0 por cor
      deck.push({
        id: `${color}-0-${generateId()}`,
        type: 'number',
        color: color,
        value: '0'
      });
      
      // Dois de cada 1-9
      for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < 2; j++) {
          deck.push({
            id: `${color}-${i}-${generateId()}`,
            type: 'number',
            color: color,
            value: i.toString()
          });
        }
      }
      
      // Cartas de ação (Skip, Reverse, Draw Two)
      const actionCards = [
        { value: 'skip', count: mode.specialCards.skip },
        { value: 'reverse', count: mode.specialCards.reverse },
        { value: 'draw2', count: mode.specialCards.draw2 }
      ];
      
      for (const action of actionCards) {
        for (let i = 0; i < action.count; i++) {
          deck.push({
            id: `${color}-${action.value}-${generateId()}`,
            type: 'action',
            color: color,
            value: action.value
          });
        }
      }
    }
    
    // Cartas curinga (Wild, Wild Draw Four)
    for (let i = 0; i < mode.specialCards.wild; i++) {
      deck.push({
        id: `wild-${generateId()}`,
        type: 'wild',
        color: 'black',
        value: 'wild'
      });
    }
    
    for (let i = 0; i < mode.specialCards.wildDraw4; i++) {
      deck.push({
        id: `wild-draw-four-${generateId()}`,
        type: 'wild',
        color: 'black',
        value: 'wild-draw-four'
      });
    }
    
    return deck;
  }
  
  // Embaralhar baralho (algoritmo Fisher-Yates)
  shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  
  // Mostrar notificação de sucesso
  showSuccess(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = 'toast show success';
      
      setTimeout(() => {
        toast.className = 'toast';
      }, 3000);
    }
  }
  
  // Mostrar notificação de erro
  showError(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = 'toast show error';
      
      setTimeout(() => {
        toast.className = 'toast';
      }, 5000);
    }
  }
}

// Inicializar GameStarter quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.gameStarter = new GameStarter();
  console.log("✅ Sistema de inicialização de jogo inicializado!");
});