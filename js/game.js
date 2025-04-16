// Lógica do jogo UNO
const Game = {
  // Estado do jogo
  state: {
    gameId: null,
    currentPlayerId: null,
    players: [],
    deck: [],
    discardPile: [],
    currentColor: null,
    direction: 1, // 1 = horário, -1 = anti-horário
    currentPlayerIndex: 0,
    drawCount: 0,
    isGameOver: false,
    winner: null
  },

  // Referência ao Firebase para o jogo atual
  gameRef: null,
  
  // IDs para listeners
  gameStateListener: null,

  // Inicializa um novo jogo
  async initGame(gameId, isHost) {
    this.state.gameId = gameId;
    this.gameRef = database.ref(`games/${gameId}`);
    
    if (isHost) {
      await this.setupNewGame();
    }
    
    this.setupEventListeners();
    this.startListeningToGameChanges();
  },

  // Configura um novo jogo
  async setupNewGame() {
    const deck = await this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);
    
    // Distribuir as cartas iniciais e definir a primeira carta
    const gameState = {
      deck: shuffledDeck,
      discardPile: [],
      currentPlayerIndex: 0,
      direction: 1,
      currentColor: null,
      drawCount: 0,
      gameStarted: false,
      isGameOver: false,
      winner: null,
      lastAction: null,
      created_at: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Colocar a primeira carta no monte de descarte
    let firstCard;
    do {
      firstCard = gameState.deck.pop();
      // A primeira carta não pode ser um coringa ou carta especial
      if (firstCard.type === 'wild' || firstCard.type === 'wild-draw-four' || firstCard.type === 'wild-draw-99') {
        gameState.deck.unshift(firstCard);
        firstCard = null;
      }
    } while (!firstCard);
    
    gameState.discardPile.push(firstCard);
    gameState.currentColor = firstCard.color;
    
    await this.gameRef.set(gameState);
  },

  // Inicia o jogo
  async startGame() {
    // Distribuir 7 cartas para cada jogador
    const gameState = await this.getGameState();
    
    if (gameState.gameStarted) return;
    
    const players = await this.getPlayers();
    
    // Embaralhar a ordem dos jogadores
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
    
    // Distribuir cartas
    for (let player of shuffledPlayers) {
      const playerCards = [];
      for (let i = 0; i < 7; i++) {
        if (gameState.deck.length === 0) {
          // Se o baralho estiver vazio, misture o monte de descarte menos a carta superior
          const topCard = gameState.discardPile.pop();
          gameState.deck = this.shuffleDeck(gameState.discardPile);
          gameState.discardPile = [topCard];
        }
        playerCards.push(gameState.deck.pop());
      }
      
      await database.ref(`games/${this.state.gameId}/players/${player.id}/cards`).set(playerCards);
    }
    
    // Atualizar o status da sala para 'playing'
    await database.ref(`rooms/${this.state.gameId}/status`).set('playing');
    
    // Atualizar estado do jogo
    await this.gameRef.update({
      gameStarted: true,
      currentPlayerIndex: 0,
      lastAction: {
        type: 'game_started',
        playerId: auth.currentUser.uid,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      }
    });
    
    UI.showToast('O jogo começou!', 'success');
  },

  // Criar baralho de UNO
  async createDeck() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const deck = [];
    let cardId = 0;

    // Cartas numéricas (0-9)
    for (let color of colors) {
      // Um zero por cor
      deck.push({
        id: cardId++,
        type: 'number',
        color: color,
        value: 0
      });

      // Dois de cada número de 1-9
      for (let value = 1; value <= 9; value++) {
        for (let i = 0; i < 2; i++) {
          deck.push({
            id: cardId++,
            type: 'number',
            color: color,
            value: value
          });
        }
      }
    }

    // Cartas especiais (pular, reverter, +2)
    const specialCards = ['skip', 'reverse', 'draw-two'];
    for (let color of colors) {
      for (let type of specialCards) {
        for (let i = 0; i < 2; i++) {
          deck.push({
            id: cardId++,
            type: type,
            color: color
          });
        }
      }
    }

    // Cartas coringa e +4
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: cardId++,
        type: 'wild'
      });
      deck.push({
        id: cardId++,
        type: 'wild-draw-four'
      });
    }
    
    // Carta especial +99 (rara ou frequente no No Mercy)
    const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
    const room = roomSnapshot.val();
    
    let chance = 0.01; // Padrão: 1%
    
    if (room && room.settings) {
      if (room.settings.noMercy) {
        chance = 0.05; // No Mercy: 5%
      } else if (room.settings.special99) {
        chance = 0.02; // Personalizado com special99: 2%
      }
    }
    
    if (Math.random() < chance) {
      deck.push({
        id: cardId++,
        type: 'wild-draw-99'
      });
    }

    return deck;
  },

  // Embaralhar baralho
  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Obter estado atual do jogo
  async getGameState() {
    const snapshot = await this.gameRef.once('value');
    return snapshot.val();
  },

  // Obter jogadores do jogo
  async getPlayers() {
    const snapshot = await database.ref(`games/${this.state.gameId}/players`).once('value');
    const playersData = snapshot.val();
    
    if (!playersData) return [];
    
    return Object.keys(playersData).map(playerId => ({
      id: playerId,
      ...playersData[playerId]
    }));
  },

  // Configurar event listeners
  setupEventListeners() {
    // Comprar carta
    UI.elements.btnDraw.addEventListener('click', () => {
      this.drawCard(auth.currentUser.uid);
    });

    // Passar a vez
    UI.elements.btnPass.addEventListener('click', () => {
      this.passTurn(auth.currentUser.uid);
    });

    // Gritar UNO
    UI.elements.btnUno.addEventListener('click', () => {
      this.callUno(auth.currentUser.uid);
    });

    // Selecionar cor para coringa
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        this.selectColor(color);
        UI.closeModal(UI.elements.colorPickerModal);
      });
    });

    // Jogar carta
    UI.elements.playerHand.addEventListener('click', (e) => {
      const cardElement = e.target.closest('.uno-card');
      if (!cardElement || cardElement.classList.contains('back')) return;
      
      const cardId = parseInt(cardElement.dataset.cardId);
      this.playCard(auth.currentUser.uid, cardId);
    });

    // Jogar novamente
    document.getElementById('btn-play-again').addEventListener('click', async () => {
      UI.closeModal(UI.elements.gameOverModal);
      await this.resetGame();
    });

    // Sair do jogo
    document.getElementById('btn-exit-game').addEventListener('click', () => {
      UI.closeModal(UI.elements.gameOverModal);
      window.location.reload();
    });
  },

  // Ouvir mudanças no estado do jogo
  startListeningToGameChanges() {
    this.gameStateListener = this.gameRef.on('value', snapshot => {
      const gameState = snapshot.val();
      if (!gameState) return;
      
      this.updateGameState(gameState);
    });
  },

  // Atualizar estado do jogo na interface
  async updateGameState(gameState) {
    this.state = { ...this.state, ...gameState };
    
    // Verificar se o jogo começou
    if (!gameState.gameStarted) {
      UI.elements.gameBoard.classList.add('hidden');
      UI.elements.waitingScreen.classList.remove('hidden');
      
      const players = await this.getPlayers();
      UI.elements.playersCount.textContent = players.length;
      
      // Atualizar o botão de iniciar jogo (apenas para o host)
      const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
      const room = roomSnapshot.val();
      
      if (room && room.hostId === auth.currentUser.uid) {
        UI.elements.btnStartGame.classList.remove('hidden');
        UI.elements.btnStartGame.disabled = players.length < 2;
      }
      
      return;
    }
    
    // O jogo começou, exibir o tabuleiro
    UI.elements.waitingScreen.classList.add('hidden');
    UI.elements.gameBoard.classList.remove('hidden');
    
    // Atualizar o monte de descarte
    if (gameState.discardPile && gameState.discardPile.length > 0) {
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      UI.updateDiscardPile(topCard);
    }
    
    // Atualizar cor atual
    if (gameState.currentColor) {
      UI.updateCurrentColor(gameState.currentColor);
    }
    
    // Obter todos os jogadores
    const players = await this.getPlayers();
    this.renderPlayers(players, gameState.currentPlayerIndex);
    
    // Verificar se é a vez do jogador atual
    const isCurrentPlayerTurn = players[gameState.currentPlayerIndex].id === auth.currentUser.uid;
    
    // Atualizar a mão do jogador atual
    const currentPlayer = players.find(p => p.id === auth.currentUser.uid);
    if (currentPlayer && currentPlayer.cards) {
      this.renderPlayerHand(currentPlayer.cards, isCurrentPlayerTurn);
    }
    
    // Atualizar status do jogo
    if (gameState.isGameOver) {
      this.handleGameOver(gameState.winner, players);
      return;
    }
    
    // Atualizar mensagem de status
    if (isCurrentPlayerTurn) {
      UI.updateGameStatus('É a sua vez de jogar!');
      UI.elements.btnDraw.classList.remove('hidden');
      
      // Se houver cartas acumuladas, não mostrar o botão de passar
      if (gameState.drawCount > 0) {
        UI.elements.btnPass.classList.add('hidden');
      } else {
        UI.elements.btnPass.classList.remove('hidden');
      }
    } else {
      const currentPlayer = players[gameState.currentPlayerIndex];
      UI.updateGameStatus(`É a vez de ${currentPlayer.name} jogar.`);
      UI.elements.btnDraw.classList.add('hidden');
      UI.elements.btnPass.classList.add('hidden');
    }
    
    // Verificar se o jogador pode chamar UNO
    const playerCards = currentPlayer ? currentPlayer.cards : [];
    if (playerCards && playerCards.length === 2 && isCurrentPlayerTurn) {
      UI.elements.btnUno.classList.remove('hidden');
    } else {
      UI.elements.btnUno.classList.add('hidden');
    }
  },

  // Renderizar jogadores na interface
  renderPlayers(players, currentPlayerIndex) {
    // Renderizar lista de jogadores
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    
    players.forEach((player, index) => {
      const isCurrentPlayer = player.id === auth.currentUser.uid;
      const isCurrentTurn = index === currentPlayerIndex;
      
      const playerElement = document.createElement('div');
      playerElement.className = `player-item ${isCurrentTurn ? 'current' : ''}`;
      
      let hostBadge = '';
      if (player.isHost) {
        hostBadge = '<span class="player-host-badge">Host</span>';
      }
      
      let avatarSrc;
      if (player.avatar) {
        avatarSrc = player.avatar;
      } else {
        const seed = player.avatarSeed || player.id;
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
      
      playerElement.innerHTML = `
        <div class="player-avatar">
          <img src="${avatarSrc}" alt="${player.name}">
        </div>
        <div class="player-info">
          <div class="player-name">${player.name} ${isCurrentPlayer ? '(Você)' : ''} ${hostBadge}</div>
          <div class="player-cards-count">Cartas: ${player.cards ? player.cards.length : 0}</div>
        </div>
      `;
      
      playersList.appendChild(playerElement);
    });
    
    // Renderizar oponentes no tabuleiro
    const opponentsArea = document.querySelector('.opponents-area');
    opponentsArea.innerHTML = '';
    
    const opponents = players.filter(player => player.id !== auth.currentUser.uid);
    
    opponents.forEach((opponent, index) => {
      const isCurrentTurn = players.findIndex(p => p.id === opponent.id) === currentPlayerIndex;
      
      const opponentElement = document.createElement('div');
      opponentElement.className = `opponent ${isCurrentTurn ? 'current-turn' : ''}`;
      
      let avatarSrc;
      if (opponent.avatar) {
        avatarSrc = opponent.avatar;
      } else {
        const seed = opponent.avatarSeed || opponent.id;
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
      
      opponentElement.innerHTML = `
        <div class="opponent-avatar">
          <img src="${avatarSrc}" alt="${opponent.name}">
        </div>
        <div class="opponent-name">${opponent.name}</div>
        <div class="opponent-cards">
          ${Array(opponent.cards ? opponent.cards.length : 0).fill('<div class="uno-card back"></div>').join('')}
        </div>
      `;
      
      opponentsArea.appendChild(opponentElement);
    });
  },

  // Renderizar a mão do jogador
  renderPlayerHand(cards, isCurrentTurn) {
    UI.clearPlayerHand();
    
    if (!cards || cards.length === 0) return;
    
    // Ordenar cartas por cor e valor
    const sortedCards = [...cards].sort((a, b) => {
      // Coringas no final
      if (!a.color && b.color) return 1;
      if (a.color && !b.color) return -1;
      
      // Ordenar por cor
      if (a.color !== b.color) {
        const colorOrder = { red: 1, yellow: 2, green: 3, blue: 4 };
        return colorOrder[a.color] - colorOrder[b.color];
      }
      
      // Ordenar por tipo (números primeiro)
      if (a.type !== b.type) {
        if (a.type === 'number') return -1;
        if (b.type === 'number') return 1;
        return a.type.localeCompare(b.type);
      }
      
      // Ordenar por valor (apenas para cartas numéricas)
      if (a.type === 'number' && b.type === 'number') {
        return a.value - b.value;
      }
      
      return 0;
    });
    
    sortedCards.forEach(card => {
      const cardElement = UI.addCardToPlayerHand(card);
      
      // Verificar se a carta pode ser jogada
      if (isCurrentTurn && this.canPlayCard(card)) {
        cardElement.classList.add('playable');
      }
    });
  },

  // Verificar se uma carta pode ser jogada
  canPlayCard(card) {
    if (!this.state.discardPile || this.state.discardPile.length === 0) {
      return true;
    }
    
    const topCard = this.state.discardPile[this.state.discardPile.length - 1];
    const currentColor = this.state.currentColor || topCard.color;
    
    // Coringas podem sempre ser jogados
    if (card.type === 'wild' || card.type === 'wild-draw-four' || card.type === 'wild-draw-99') {
      return true;
    }
    
    // Mesma cor
    if (card.color === currentColor) {
      return true;
    }
    
    // Mesmo número/tipo
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) {
      return true;
    }
    
    // Mesmo tipo de carta especial
    if (card.type === topCard.type && card.type !== 'number') {
      return true;
    }
    
    // Cartas especiais de empilhamento (+2, +4, +99)
    if (this.state.drawCount > 0) {
      if (topCard.type === 'draw-two' && card.type === 'draw-two') {
        return true;
      }
      if (topCard.type === 'wild-draw-four' && card.type === 'wild-draw-four') {
        return true;
      }
      if (topCard.type === 'wild-draw-99' && (card.type === 'wild-draw-four' || card.type === 'wild-draw-99')) {
        return true;
      }
    }
    
    return false;
  },

  // Jogar uma carta
  async playCard(playerId, cardId) {
    const gameState = await this.getGameState();
    const players = await this.getPlayers();
    const currentPlayerIndex = gameState.currentPlayerIndex;
    
    // Verificar se é a vez do jogador
    if (players[currentPlayerIndex].id !== playerId) {
      UI.showToast('Não é sua vez de jogar!', 'error');
      return;
    }
    
    // Encontrar jogador e carta
    const player = players.find(p => p.id === playerId);
    if (!player || !player.cards) return;
    
    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    
    const card = player.cards[cardIndex];
    
    // Verificar se a carta pode ser jogada
    if (!this.canPlayCard(card)) {
      UI.showToast('Você não pode jogar esta carta!', 'error');
      return;
    }
    
    // Se for uma carta +2 ou +4 sendo empilhada, verificar as regras
    if (gameState.drawCount > 0) {
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      
      // Verificar se empilhamento está permitido
      if (topCard.type === 'draw-two' && card.type === 'draw-two') {
        // Verificar regra de empilhamento de +2
        const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
        const room = roomSnapshot.val();
        
        if (room && room.settings && !room.settings.stackDraw2) {
          UI.showToast('Empilhamento de cartas +2 não está permitido neste jogo!', 'error');
          return;
        }
      } else if (topCard.type === 'wild-draw-four' && card.type === 'wild-draw-four') {
        // Verificar regra de empilhamento de +4
        const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
        const room = roomSnapshot.val();
        
        if (room && room.settings && !room.settings.stackDraw4) {
          UI.showToast('Empilhamento de cartas +4 não está permitido neste jogo!', 'error');
          return;
        }
      } else if (topCard.type === 'draw-two' && card.type !== 'draw-two') {
        UI.showToast('Você deve jogar uma carta +2 ou comprar!', 'error');
        return;
      } else if (topCard.type === 'wild-draw-four' && card.type !== 'wild-draw-four') {
        UI.showToast('Você deve jogar uma carta +4 ou comprar!', 'error');
        return;
      }
    }
    
    // Remover a carta da mão do jogador
    player.cards.splice(cardIndex, 1);
    
    // Atualizar a mão do jogador no Firebase
    await database.ref(`games/${this.state.gameId}/players/${playerId}/cards`).set(player.cards);
    
    // Colocar a carta na pilha de descarte
    gameState.discardPile.push(card);
    
    // Atualizar drawCount para cartas +2, +4 e +99
    if (card.type === 'draw-two') {
      gameState.drawCount += 2;
    } else if (card.type === 'wild-draw-four') {
      gameState.drawCount += 4;
    } else if (card.type === 'wild-draw-99') {
      gameState.drawCount += 99;
    }
    
    // Se for um coringa, abrir seletor de cores
    if (card.type === 'wild' || card.type === 'wild-draw-four' || card.type === 'wild-draw-99') {
      UI.showModal(UI.elements.colorPickerModal);
      // Armazenar temporariamente o estado para atualizar depois de escolher a cor
      this.pendingGameState = gameState;
      return;
    }
    
    // Definir a cor atual
    gameState.currentColor = card.color;
    
    // Aplicar efeitos de cartas especiais
    await this.applyCardEffect(gameState, card);
    
    // Verificar se o jogador venceu
    if (player.cards.length === 0) {
      gameState.isGameOver = true;
      gameState.winner = playerId;
    }
    
    // Atualizar o estado do jogo
    await this.gameRef.update(gameState);
    
    // Registrar a ação
    await this.gameRef.child('lastAction').set({
      type: 'play_card',
      playerId,
      cardType: card.type,
      cardColor: card.color,
      cardValue: card.value,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Verificar se o jogador precisa gritar UNO
    if (player.cards.length === 1) {
      await this.showUnoButton(playerId);
    }
  },

  // Selecionar cor para cartas coringa
  async selectColor(color) {
    if (!this.pendingGameState) return;
    
    this.pendingGameState.currentColor = color;
    
    // Obter a última carta jogada
    const lastCard = this.pendingGameState.discardPile[this.pendingGameState.discardPile.length - 1];
    
    // Aplicar efeitos de cartas especiais
    await this.applyCardEffect(this.pendingGameState, lastCard);
    
    // Verificar se o jogador venceu
    const players = await this.getPlayers();
    const currentPlayer = players[this.pendingGameState.currentPlayerIndex];
    
    if (currentPlayer.cards.length === 0) {
      this.pendingGameState.isGameOver = true;
      this.pendingGameState.winner = currentPlayer.id;
    }
    
    // Atualizar o estado do jogo
    await this.gameRef.update(this.pendingGameState);
    
    // Registrar a ação
    await this.gameRef.child('lastAction').set({
      type: 'select_color',
      playerId: auth.currentUser.uid,
      color,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Limpar o estado pendente
    this.pendingGameState = null;
  },

  // Aplicar efeito de carta especial
  async applyCardEffect(gameState, card) {
    let nextPlayerIndex = this.getNextPlayerIndex(gameState);
    
    switch (card.type) {
      case 'skip':
        // Pular o próximo jogador
        nextPlayerIndex = this.getNextPlayerIndex(gameState, nextPlayerIndex);
        break;
      
      case 'reverse':
        // Inverter a direção do jogo
        gameState.direction *= -1;
        // Em jogos com 2 jogadores, funciona como "pular"
        const players = await this.getPlayers();
        if (players.length === 2) {
          nextPlayerIndex = gameState.currentPlayerIndex;
        } else {
          nextPlayerIndex = this.getNextPlayerIndex(gameState);
        }
        break;
      
      case 'draw-two':
      case 'wild-draw-four':
      case 'wild-draw-99':
        // Se for a última carta jogada pelo jogador, ele venceu. Não aplicar efeito.
        const currentPlayer = (await this.getPlayers())[gameState.currentPlayerIndex];
        if (currentPlayer.cards.length === 0) {
          break;
        }
        
        // O próximo jogador terá que comprar ou empilhar
        break;
      
      default:
        // Para cartas normais, apenas passar a vez
        break;
    }
    
    gameState.currentPlayerIndex = nextPlayerIndex;
  },

  // Obter índice do próximo jogador
  getNextPlayerIndex(gameState, startIndex = null) {
    const players = Object.values(gameState.players || {});
    if (players.length === 0) return 0;
    
    const currentIndex = startIndex !== null ? startIndex : gameState.currentPlayerIndex;
    const nextIndex = (currentIndex + gameState.direction + players.length) % players.length;
    
    return nextIndex;
  },

  // Comprar uma carta
  async drawCard(playerId) {
    const gameState = await this.getGameState();
    const players = await this.getPlayers();
    const currentPlayerIndex = gameState.currentPlayerIndex;
    
    // Verificar se é a vez do jogador
    if (players[currentPlayerIndex].id !== playerId) {
      UI.showToast('Não é sua vez de comprar!', 'error');
      return;
    }
    
    // Encontrar o jogador
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    let cardsToDraw = 1;
    
    // Se houver cartas acumuladas para comprar
    if (gameState.drawCount > 0) {
      cardsToDraw = gameState.drawCount;
      gameState.drawCount = 0;
    }
    
    // Comprar cartas
    const playerCards = player.cards || [];
    
    for (let i = 0; i < cardsToDraw; i++) {
      if (gameState.deck.length === 0) {
        // Se o baralho estiver vazio, misture o monte de descarte menos a carta superior
        const topCard = gameState.discardPile.pop();
        gameState.deck = this.shuffleDeck(gameState.discardPile);
        gameState.discardPile = [topCard];
      }
      
      const card = gameState.deck.pop();
      playerCards.push(card);
    }
    
    // Atualizar a mão do jogador
    await database.ref(`games/${this.state.gameId}/players/${playerId}/cards`).set(playerCards);
    
    // Verificar regra "forçar jogar" do No Mercy
    let mustPass = true;
    const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
    const room = roomSnapshot.val();
    
    if (room && room.settings && room.settings.forcePlay) {
      // Verificar se a carta comprada pode ser jogada
      const drawnCard = playerCards[playerCards.length - 1];
      
      if (cardsToDraw === 1 && this.canPlayCard(drawnCard)) {
        // No modo "forçar jogar", não passar a vez automaticamente
        mustPass = false;
        UI.showToast('Você deve jogar a carta que comprou!', 'info');
      } else {
        // Passar a vez
        gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
      }
    } else if (cardsToDraw === 1) {
      // Em modo normal, verificar se pode jogar e avisar, mas não forçar
      const drawnCard = playerCards[playerCards.length - 1];
      
      if (this.canPlayCard(drawnCard)) {
        UI.showToast('Você pode jogar a carta que comprou!', 'info');
      } else {
        // Passar a vez automaticamente
        gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
      }
      
      mustPass = false;
    } else {
      // Se comprou várias cartas (efeito de +2, +4, +99), passar a vez
      gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
    }
    
    // Atualizar o estado do jogo
    await this.gameRef.update({
      deck: gameState.deck,
      drawCount: gameState.drawCount,
      currentPlayerIndex: gameState.currentPlayerIndex
    });
    
    // Registrar a ação
    await this.gameRef.child('lastAction').set({
      type: 'draw_cards',
      playerId,
      count: cardsToDraw,
      mustPlay: !mustPass && cardsToDraw === 1 && room?.settings?.forcePlay,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    UI.showToast(`Você comprou ${cardsToDraw} carta${cardsToDraw > 1 ? 's' : ''}!`);
  },

  // Passar a vez
  async passTurn(playerId) {
    const gameState = await this.getGameState();
    const players = await this.getPlayers();
    const currentPlayerIndex = gameState.currentPlayerIndex;
    
    // Verificar se é a vez do jogador
    if (players[currentPlayerIndex].id !== playerId) {
      UI.showToast('Não é sua vez de passar!', 'error');
      return;
    }
    
    // Verificar se há cartas acumuladas para comprar
    if (gameState.drawCount > 0) {
      UI.showToast('Você deve comprar as cartas acumuladas!', 'error');
      return;
    }
    
    // Verificar regra "forçar jogar" do No Mercy
    const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
    const room = roomSnapshot.val();
    
    if (room && room.settings && room.settings.forcePlay) {
      // No modo "forçar jogar", verificar se o jogador tem cartas que pode jogar
      const playerCards = players[currentPlayerIndex].cards || [];
      let canPlay = false;
      
      for (const card of playerCards) {
        if (this.canPlayCard(card)) {
          canPlay = true;
          break;
        }
      }
      
      if (canPlay) {
        UI.showToast('Você deve jogar uma carta válida!', 'error');
        return;
      }
    }
    
    // Passar a vez
    gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
    
    // Atualizar o estado do jogo
    await this.gameRef.update({
      currentPlayerIndex: gameState.currentPlayerIndex
    });
    
    // Registrar a ação
    await this.gameRef.child('lastAction').set({
      type: 'pass_turn',
      playerId,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    UI.showToast('Você passou sua vez.');
  },

  // Gritar UNO
  async callUno(playerId) {
    const players = await this.getPlayers();
    const player = players.find(p => p.id === playerId);
    
    if (!player || !player.cards || player.cards.length !== 1) {
      return;
    }
    
    // Registrar que o jogador gritou UNO
    await database.ref(`games/${this.state.gameId}/players/${playerId}/calledUno`).set(true);
    
    // Registrar a ação
    await this.gameRef.child('lastAction').set({
      type: 'call_uno',
      playerId,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Notificar o chat
    Chat.sendSystemMessage(`${player.name} gritou UNO!`);
  },

  // Mostrar botão UNO
  async showUnoButton(playerId) {
    if (playerId !== auth.currentUser.uid) return;
    
    UI.elements.btnUno.classList.remove('hidden');
    
    // No modo No Mercy, o tempo para gritar UNO é menor
    const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
    const room = roomSnapshot.val();
    const isNoMercy = room?.settings?.noMercy;
    const unoTime = isNoMercy ? 2000 : 3000; // 2 segundos no No Mercy, 3 segundos no modo normal
    
    // Iniciar timer para gritar UNO automaticamente após o tempo
    setTimeout(async () => {
      const players = await this.getPlayers();
      const player = players.find(p => p.id === playerId);
      
      if (player && player.cards && player.cards.length === 1 && !player.calledUno) {
        // No modo No Mercy, penalizar quem não gritou UNO
        if (isNoMercy) {
          // Comprar 2 cartas como penalidade
          const gameState = await this.getGameState();
          const playerCards = [...player.cards];
          
          for (let i = 0; i < 2; i++) {
            if (gameState.deck.length === 0) {
              // Se o baralho estiver vazio, misture o monte de descarte menos a carta superior
              const topCard = gameState.discardPile.pop();
              gameState.deck = this.shuffleDeck(gameState.discardPile);
              gameState.discardPile = [topCard];
            }
            
            playerCards.push(gameState.deck.pop());
          }
          
          // Atualizar a mão do jogador e o baralho
          await database.ref(`games/${this.state.gameId}/players/${playerId}/cards`).set(playerCards);
          await this.gameRef.update({ deck: gameState.deck });
          
          // Notificar
          Chat.sendSystemMessage(`${player.name} esqueceu de gritar UNO e comprou 2 cartas como penalidade!`);
          UI.showToast('Você esqueceu de gritar UNO! +2 cartas', 'error');
        } else {
          // Em modo normal, apenas chamar UNO automaticamente
          await this.callUno(playerId);
        }
      }
      
      UI.elements.btnUno.classList.add('hidden');
    }, unoTime);
  },

  // Tratar fim de jogo
  handleGameOver(winnerId, players) {
    const winner = players.find(p => p.id === winnerId);
    if (!winner) return;
    
    // Exibir modal de fim de jogo
    const winnerAvatarImg = document.getElementById('winner-avatar-img');
    const winnerName = document.getElementById('winner-name');
    
    // Definir imagem do vencedor (avatar customizado ou gerado)
    if (winner.avatar) {
      winnerAvatarImg.src = winner.avatar;
    } else {
      const seed = winner.avatarSeed || winner.id;
      winnerAvatarImg.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
    }
    
    winnerName.textContent = winner.name;
    
    // Calcular estatísticas
    const gameStats = document.getElementById('game-stats');
    gameStats.innerHTML = '';
    
    let totalCards = 0;
    players.forEach(player => {
      if (player.cards) {
        totalCards += player.cards.length;
      }
    });
    
    const stats = [
      { label: 'Cartas restantes', value: totalCards },
      { label: 'Jogadores', value: players.length },
      { label: 'Pontos ganhos', value: Math.floor(totalCards * 10 * (1 + Math.random())) }
    ];
    
    stats.forEach(stat => {
      const statElement = document.createElement('div');
      statElement.className = 'stat-item';
      statElement.innerHTML = `
        <div class="stat-value">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
      `;
      gameStats.appendChild(statElement);
    });
    
    // Mostrar modal de fim de jogo
    UI.showModal(UI.elements.gameOverModal);
    
    // Registrar o vencedor no Firebase
    database.ref(`rooms/${this.state.gameId}/lastWinner`).set({
      id: winner.id,
      name: winner.name,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Atualizar status da sala para 'waiting'
    database.ref(`rooms/${this.state.gameId}/status`).set('waiting');
    
    // Notificar o chat
    Chat.sendSystemMessage(`🏆 ${winner.name} venceu o jogo!`);
  },

  // Reiniciar o jogo
  async resetGame() {
    // Verificar se o usuário é o host
    const roomSnapshot = await database.ref(`rooms/${this.state.gameId}`).once('value');
    const room = roomSnapshot.val();
    
    if (room && room.hostId === auth.currentUser.uid) {
      // Resetar estado do jogo
      await this.setupNewGame();
      
      // Notificar jogadores
      Chat.sendSystemMessage('O jogo foi reiniciado pelo host!');
      UI.showToast('Jogo reiniciado com sucesso!', 'success');
    } else {
      UI.showToast('Apenas o host pode reiniciar o jogo!', 'error');
    }
  },

  // Limpar listeners e sair do jogo
  cleanup() {
    if (this.gameStateListener) {
      this.gameRef.off('value', this.gameStateListener);
    }
  }
};