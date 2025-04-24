// Controlador do jogo UNO
const Game = {
  // Propriedades do jogo
  roomId: null,
  gameRef: null,
  isHost: false,
  gameStarted: false,
  currentPlayerIndex: 0,
  direction: 1,
  drawCount: 0,
  currentColor: null,
  currentValue: null,
  players: [],
  deck: [],
  discardPile: [],
  myCards: [],

  // Inicializar o jogo
  initGame(roomId, isHost) {
    this.roomId = roomId;
    this.isHost = isHost;
    
    // Referência ao jogo no Firebase
    this.gameRef = database.ref(`games/${roomId}`);
    
    // Configurar listeners do jogo
    this.setupGameListeners();
    
    // Verificar se o jogo já está em andamento
    this.gameRef.once('value', snapshot => {
      const gameData = snapshot.val();
      if (gameData && gameData.gameStarted) {
        this.loadGameState(gameData);
      } else if (isHost) {
        document.getElementById('btn-start-game').classList.remove('hidden');
      } else {
        UI.showToast('Aguardando o host iniciar o jogo...', 'info');
      }
    });
    
    // Configurar event listeners para os controles do jogador
    this.setupPlayerControls();
  },

  // Carregar o estado atual do jogo
  loadGameState(gameData) {
    // Implementação da lógica de carregamento do estado do jogo
  },

  // Iniciar o jogo
  async startGame() {
    if (!this.isHost) {
      UI.showToast('Apenas o host pode iniciar o jogo!', 'error');
      return;
    }
    
    try {
      // Obter informações da sala
      const roomSnapshot = await database.ref(`rooms/${this.roomId}`).once('value');
      const room = roomSnapshot.val();
      
      if (!room || !room.players || Object.keys(room.players).length < 2) {
        UI.showToast('É necessário pelo menos 2 jogadores para iniciar!', 'error');
        return;
      }
      
      // Atualizar status da sala
      await database.ref(`rooms/${this.roomId}/status`).set('playing');
      
      // Configurar o jogo
      const players = this.preparePlayersList(room.players);
      const { deck, hands } = this.dealInitialCards(players.length);
      
      // Definir a primeira carta da pilha de descarte
      let discardPile = [];
      let topCard;
      
      // Garantir que a primeira carta não seja uma especial
      do {
        topCard = deck.pop();
      } while (topCard.type !== 'number');
      
      discardPile.push(topCard);
      
      // Definir o estado inicial do jogo
      const initialGameState = {
        gameStarted: true,
        currentPlayerIndex: 0,
        direction: 1,
        drawCount: 0,
        currentColor: topCard.color,
        currentValue: topCard.value,
        discardPile: discardPile,
        deck: deck,
        players: players,
        startedAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      
      // Salvar o estado inicial do jogo
      await this.gameRef.set(initialGameState);
      
      // Distribuir as cartas para os jogadores
      const promises = players.map((player, index) => {
        return database.ref(`rooms/${this.roomId}/players/${player.id}/cards`).set(hands[index]);
      });
      
      await Promise.all(promises);
      
      UI.showToast('Jogo iniciado!', 'success');
    } catch (error) {
      console.error('Erro ao iniciar o jogo:', error);
      UI.showToast('Erro ao iniciar o jogo: ' + error.message, 'error');
    }
  },

  // Preparar a lista de jogadores
  preparePlayersList(players) {
    // Converter o objeto de jogadores em um array
    const playersList = Object.values(players).map(player => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      avatarSeed: player.avatarSeed,
      handSize: 7
    }));
    
    // Embaralhar jogadores para ordem aleatória
    const shuffledPlayers = this.shuffleArray([...playersList]);
    
    return shuffledPlayers;
  },

  // Embaralhar um array
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  // Criar e embaralhar o baralho
  createDeck() {
    const deck = [];
    const colors = ['red', 'blue', 'green', 'yellow'];
    let cardId = 0;
    
    // Adicionar cartas numeradas (0-9)
    for (const color of colors) {
      // Adicionar um 0 para cada cor
      deck.push({id: cardId++, type: 'number', color, value: 0});
      
      // Adicionar dois de cada número de 1-9 para cada cor
      for (let i = 1; i <= 9; i++) {
        deck.push({id: cardId++, type: 'number', color, value: i});
        deck.push({id: cardId++, type: 'number', color, value: i});
      }
    }
    
    // Adicionar cartas especiais (Skip, Reverse, Draw Two)
    for (const color of colors) {
      // Duas de cada tipo para cada cor
      for (let i = 0; i < 2; i++) {
        deck.push({id: cardId++, type: 'skip', color});
        deck.push({id: cardId++, type: 'reverse', color});
        deck.push({id: cardId++, type: 'draw-two', color});
      }
    }
    
    // Adicionar cartas Wild e Wild Draw Four
    for (let i = 0; i < 4; i++) {
      deck.push({id: cardId++, type: 'wild'});
      deck.push({id: cardId++, type: 'wild-draw-four'});
    }
    
    // Embaralhar o baralho
    return this.shuffleArray(deck);
  },

  // Distribuir cartas iniciais
  dealInitialCards(numPlayers) {
    const deck = this.createDeck();
    const hands = [];
    
    // Criar mão para cada jogador
    for (let i = 0; i < numPlayers; i++) {
      const hand = [];
      for (let j = 0; j < 7; j++) {
        hand.push(deck.pop());
      }
      hands.push(hand);
    }
    
    return { deck, hands };
  },

  // Configurar listeners do jogo
  setupGameListeners() {
    // Implementação dos listeners para mudanças no estado do jogo
  },

  // Configurar controles do jogador
  setupPlayerControls() {
    // Implementação dos controles do jogador (botões de jogo)
  },

  // Limpar listeners quando sair do jogo
  cleanup() {
    if (this.gameRef) {
      this.gameRef.off();
    }
  }
};