/**
 * Inicializador de jogo para UNO Game
 * Data: 2025-04-11 21:12:22
 * Desenvolvido por: Duduxindev
 */

class GameInitializer {
    constructor() {
      // Estado atual do jogo
      this.gameState = null;
      this.gameConfig = null;
      this.playerManager = null;
      this.deck = null;
      this.isOnline = false;
      
      // Elementos do DOM
      this.gameScreen = document.getElementById('game-screen');
      this.playerHand = document.getElementById('player-hand');
      this.discardPile = document.getElementById('discard-pile');
      this.drawPile = document.getElementById('draw-pile');
      this.opponentsContainer = document.getElementById('opponents-container');
      this.currentPlayerDisplay = document.getElementById('current-player');
      this.cardsLeftDisplay = document.getElementById('cards-left');
      this.playerNameDisplay = document.getElementById('player-name-display');
      this.cardCountDisplay = document.getElementById('card-count');
      
      // Vincular contexto
      this.initLocalGame = this.initLocalGame.bind(this);
      this.initOnlineGame = this.initOnlineGame.bind(this);
      this.setupEventListeners = this.setupEventListeners.bind(this);
      this.handleCardClick = this.handleCardClick.bind(this);
      this.handleDrawCardClick = this.handleDrawCardClick.bind(this);
      this.handleUnoButtonClick = this.handleUnoButtonClick.bind(this);
      this.handleColorSelection = this.handleColorSelection.bind(this);
      this.renderGameState = this.renderGameState.bind(this);
      this.handleRoomUpdates = this.handleRoomUpdates.bind(this);
      
      // Inicializar
      this.init();
    }
    
    // Inicializar GameInitializer
    init() {
      // Inicializar ao navegar para a tela de jogo
      document.addEventListener('screenChange', (e) => {
        if (e.detail.screen === 'game-screen') {
          this.setupGame();
        }
      });
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Monitorar atualizações da sala (se estiver online)
      this.handleRoomUpdates();
    }
    
    // Configurar jogo ao entrar na tela
    setupGame() {
      // Verificar se já temos dados da sessão
      const session = Storage.getSession();
      
      // Se temos dados da sessão, inicializar jogo
      if (session && session.gameConfig) {
        if (session.isOnline) {
          this.initOnlineGame(session);
        } else {
          this.initLocalGame(session.gameConfig);
        }
      } else if (roomManager.currentRoom && roomManager.currentRoom.status === 'playing') {
        // Se estamos em uma sala online com jogo em andamento
        this.initOnlineGame({
          roomCode: roomManager.currentRoom.code,
          playerId: Storage.getSession().playerId,
          isHost: roomManager.currentRoom.host === Storage.getSession().playerId
        });
      } else {
        // Sem dados, mostrar erro
        this.showError("Dados de jogo não encontrados. Volte e comece um novo jogo.");
        
        // Voltar para tela inicial após 2 segundos
        setTimeout(() => {
          window.showScreen('start-screen');
        }, 2000);
      }
    }
    
    // Inicializar jogo local
    initLocalGame(config) {
      console.log("Inicializando jogo local com configuração:", config);
      
      this.isOnline = false;
      this.gameConfig = config;
      
      // Criar gerenciador de jogadores
      this.playerManager = new PlayerManager();
      
      // Adicionar jogador humano
      const humanPlayer = new Player('player-human', 'Você');
      this.playerManager.addPlayer(humanPlayer);
      
      // Adicionar jogadores AI
      for (let i = 1; i < config.playerCount; i++) {
        const aiPlayer = new Player(`player-ai-${i}`, `Jogador ${i}`, true);
        this.playerManager.addPlayer(aiPlayer);
      }
      
      // Criar e embaralhar baralho
      this.deck = this.createAndShuffleDeck();
      
      // Distribuir cartas
      this.playerManager.dealCards(this.deck);
      
      // Virar primeira carta
      const firstCard = this.drawFirstCard();
      
      // Aplicar efeito da primeira carta (se for carta de ação)
      this.applyFirstCardEffect(firstCard);
      
      // Criar estado inicial do jogo
      this.gameState = {
        deck: this.deck,
        discardPile: [firstCard],
        currentColor: firstCard.type === 'wild' ? this.getRandomColor() : firstCard.color,
        currentPlayerIndex: this.playerManager.currentPlayerIndex,
        direction: this.playerManager.direction,
        drawStack: 0,
        lastAction: {
          type: 'gameStart',
          timestamp: Date.now()
        }
      };
      
      // Renderizar estado inicial
      this.renderGameState();
      
      // Iniciar IA se o primeiro jogador for AI
      this.checkAndPlayAI();
    }
    
    // Inicializar jogo online
    initOnlineGame(session) {
      console.log("Inicializando jogo online com sessão:", session);
      
      this.isOnline = true;
      
      // Verificar se temos uma sala válida
      if (!roomManager.currentRoom || roomManager.currentRoom.status !== 'playing') {
        this.showError("Sala não encontrada ou jogo não iniciado.");
        return;
      }
      
      // Atualizar com o estado atual da sala
      this.updateFromRoom(roomManager.currentRoom);
    }
    
    // Atualizar estado do jogo a partir da sala
    updateFromRoom(room) {
      if (!room || !room.game) return;
      
      const gameData = room.game;
      const playerId = Storage.getSession().playerId;
      
      // Atualizar estado do jogo
      this.gameState = {
        deck: gameData.deck || [],
        discardPile: gameData.discard || [],
        currentColor: gameData.currentColor || 'red',
        currentPlayerIndex: gameData.currentPlayerIndex || 0,
        direction: gameData.direction || 1,
        drawStack: gameData.drawStack || 0,
        lastAction: gameData.lastAction || { type: 'gameStart', timestamp: Date.now() },
        playerIds: gameData.playerIds || [],
        hands: gameData.hands || {}
      };
      
      // Renderizar estado atual
      this.renderGameState();
      
      // Destacar jogador atual
      this.highlightCurrentPlayer();
    }
    
    // Configurar event listeners
    setupEventListeners() {
      // Clique no botão UNO
      const unoButton = document.getElementById('uno-btn');
      if (unoButton) {
        unoButton.addEventListener('click', this.handleUnoButtonClick);
      }
      
      // Clique na pilha de compra
      if (this.drawPile) {
        this.drawPile.addEventListener('click', this.handleDrawCardClick);
      }
      
      // Clique em botões de cor no seletor
      const colorButtons = document.querySelectorAll('.color-btn');
      colorButtons.forEach(button => {
        button.addEventListener('click', () => {
          const color = button.dataset.color;
          this.handleColorSelection(color);
        });
      });
      
      // Expor função global para chamada UNO via chat
      window.callUno = this.handleUnoButtonClick;
    }
    
    // Tratar clique em uma carta
    handleCardClick(cardElement) {
      // Verificar se é um jogo online e se é a vez do jogador
      if (this.isOnline) {
        const playerId = Storage.getSession().playerId;
        const currentPlayerId = this.gameState.playerIds[this.gameState.currentPlayerIndex];
        
        if (playerId !== currentPlayerId) {
          this.showError("Não é sua vez de jogar.");
          return;
        }
      }
      
      // Obter dados da carta
      const cardId = cardElement.dataset.id;
      const cardColor = cardElement.dataset.color;
      const cardValue = cardElement.dataset.value;
      const cardType = cardElement.dataset.type;
      
      const card = {
        id: cardId,
        color: cardColor,
        value: cardValue,
        type: cardType
      };
      
      // Verificar se a carta é jogável
      if (!this.isCardPlayable(card)) {
        this.showError("Esta carta não pode ser jogada agora.");
        return;
      }
      
      // Se for curinga, mostrar seletor de cores
      if (card.type === 'wild') {
        this.showColorSelector(card);
        return;
      }
      
      // Jogar a carta
      this.playCard(card);
    }
    
    // Tratar clique na pilha de compra
    handleDrawCardClick() {
      // Verificar se é um jogo online e se é a vez do jogador
      if (this.isOnline) {
        const playerId = Storage.getSession().playerId;
        const currentPlayerId = this.gameState.playerIds[this.gameState.currentPlayerIndex];
        
        if (playerId !== currentPlayerId) {
          this.showError("Não é sua vez de jogar.");
          return;
        }
        
        // Enviar solicitação para comprar carta
        this.drawCardOnline();
        return;
      }
      
      // Verificar se é a vez do jogador humano
      if (this.playerManager.currentPlayerIndex !== 0) {
        this.showError("Não é sua vez de jogar.");
        return;
      }
      
      // Comprar carta
      const drawnCard = this.drawCard();
      
      // Verificar se conseguimos comprar
      if (!drawnCard) {
        this.showError("Não há mais cartas no baralho.");
        return;
      }
      
      const player = this.playerManager.getCurrentPlayer();
      player.addCard(drawnCard);
      
      // Mostrar mensagem
      this.showMessage("Você comprou uma carta.");
      
      // Verificar se a carta comprada pode ser jogada
      if (this.isCardPlayable(drawnCard) && this.gameConfig.customRules.forcePlay) {
        // Se a regra de força de jogo estiver ativa, jogar automaticamente
        this.showMessage("A carta comprada foi jogada automaticamente!");
        this.playCard(drawnCard);
      } else {
        // Atualizar mão do jogador
        this.renderPlayerHand();
        
        // Avançar para o próximo jogador
        this.nextTurn();
      }
    }
    
    // Comprar carta no modo online
    async drawCardOnline() {
      try {
        const session = Storage.getSession();
        const roomCode = session.roomCode;
        const playerId = session.playerId;
        
        // Verificar se temos um estado de jogo válido
        if (!this.gameState || !this.gameState.deck || this.gameState.deck.length === 0) {
          throw new Error("Não há mais cartas no baralho.");
        }
        
        // Referência à sala
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        // Obter dados atuais do jogo
        const snapshot = await roomRef.once('value');
        const roomData = snapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error("Dados do jogo não encontrados.");
        }
        
        const gameData = roomData.game;
        
        // Verificar se é a vez do jogador
        if (gameData.playerIds[gameData.currentPlayerIndex] !== playerId) {
          throw new Error("Não é sua vez de jogar.");
        }
        
        // Garantir que temos cartas suficientes
        this.ensureEnoughCards(gameData);
        
        // Comprar carta
        const drawnCard = gameData.deck.pop();
        
        // Adicionar à mão do jogador
        const playerHand = gameData.hands[playerId] || [];
        playerHand.push(drawnCard);
        gameData.hands[playerId] = playerHand;
        
        // Verificar se a carta pode ser jogada
        const isPlayable = this.isCardPlayable(drawnCard, gameData.discard[0], gameData.currentColor);
        
        // Se a regra de força de jogo estiver ativa e a carta for jogável
        if (isPlayable && roomData.customRules && roomData.customRules.forcePlay) {
          // Jogar a carta automaticamente
          
          // Remover a carta da mão
          const cardIndex = playerHand.findIndex(c => c.id === drawnCard.id);
          playerHand.splice(cardIndex, 1);
          
          // Adicionar à pilha de descarte
          gameData.discard.unshift(drawnCard);
          
          // Atualizar cor atual se for curinga
          if (drawnCard.type === 'wild') {
            // Escolher cor aleatória para cartas curinga
            const colors = ['red', 'blue', 'green', 'yellow'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            gameData.currentColor = randomColor;
            drawnCard.chosenColor = randomColor;
          } else {
            gameData.currentColor = drawnCard.color;
          }
          
          // Aplicar efeitos da carta
          this.applyCardEffectsOnline(gameData, drawnCard);
          
          // Registrar última ação
          gameData.lastAction = {
            type: 'playDrawnCard',
            playerId: playerId,
            card: drawnCard,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          };
          
          // Mostrar mensagem no client
          this.showMessage("Carta comprada e jogada automaticamente!");
        } else {
          // Avançar para o próximo jogador
          gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + gameData.playerIds.length) % gameData.playerIds.length;
          
          // Registrar última ação
          gameData.lastAction = {
            type: 'drawCard',
            playerId: playerId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          };
          
          // Mostrar mensagem no client
          this.showMessage("Você comprou uma carta.");
        }
        
        // Incrementar turno
        gameData.turn = (gameData.turn || 0) + 1;
        
        // Atualizar o jogo
        await roomRef.child('game').set(gameData);
        
      } catch (error) {
        console.error("Erro ao comprar carta:", error);
        this.showError(error.message || "Erro ao comprar carta.");
      }
    }
    
    // Garantir que há cartas suficientes no baralho
    ensureEnoughCards(gameData) {
      // Se o baralho está vazio ou tem poucas cartas
      if (!gameData.deck || gameData.deck.length < 5) {
        // Se não há pilha de descarte, criar novo baralho
        if (!gameData.discard || gameData.discard.length <= 1) {
          gameData.deck = this.createAndShuffleDeck();
          return;
        }
        
        // Guardar carta do topo
        const topCard = gameData.discard.shift();
        
        // Embaralhar resto da pilha de descarte
        const discardPile = [...gameData.discard];
        gameData.discard = [topCard];
        
        // Adicionar cartas embaralhadas ao baralho
        for (let i = discardPile.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [discardPile[i], discardPile[j]] = [discardPile[j], discardPile[i]];
        }
        
        // Adicionar ao baralho
        gameData.deck = [...(gameData.deck || []), ...discardPile];
      }
    }
    
    // Tratar clique no botão UNO
    handleUnoButtonClick() {
      if (this.isOnline) {
        this.callUnoOnline();
        return;
      }
      
      const humanPlayer = this.playerManager.players[0];
      
      // Verificar se o jogador tem apenas uma carta
      if (humanPlayer.cards.length === 1) {
        humanPlayer.hasCalledUno = true;
        this.showMessage("UNO! Você anunciou que tem apenas uma carta.");
      } else if (humanPlayer.cards.length === 0) {
        this.showError("Você não tem cartas.");
      } else {
        this.showError("Você só pode chamar UNO quando tiver uma carta.");
      }
    }
    
    // Chamar UNO no modo online
    async callUnoOnline() {
      try {
        const session = Storage.getSession();
        const roomCode = session.roomCode;
        const playerId = session.playerId;
        
        // Referência à sala
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        // Obter dados atuais do jogo
        const snapshot = await roomRef.once('value');
        const roomData = snapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error("Dados do jogo não encontrados.");
        }
        
        const gameData = roomData.game;
        
        // Verificar se o jogador está no jogo
        if (!gameData.hands[playerId]) {
          throw new Error("Jogador não encontrado no jogo.");
        }
        
        const playerHand = gameData.hands[playerId];
        
        // Verificar se o jogador tem apenas uma carta
        if (playerHand.length === 1) {
          // Marcar que o jogador chamou UNO
          await roomRef.child('game').child('unoStatus').child(playerId).set(true);
          
          // Registrar última ação
          await roomRef.child('game').child('lastAction').set({
            type: 'callUno',
            playerId: playerId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
          
          // Mostrar mensagem
          this.showMessage("UNO! Você anunciou que tem apenas uma carta.");
          
        } else if (playerHand.length === 0) {
          this.showError("Você não tem cartas.");
        } else {
          this.showError("Você só pode chamar UNO quando tiver uma carta.");
        }
        
      } catch (error) {
        console.error("Erro ao chamar UNO:", error);
        this.showError(error.message || "Erro ao chamar UNO.");
      }
    }
    
    // Tratar seleção de cor para cartas curinga
    handleColorSelection(color) {
      // Obter carta selecionada do armazenamento local
      const selectedCardJson = localStorage.getItem('selectedCard');
      if (!selectedCardJson) {
        this.showError("Nenhuma carta selecionada.");
        return;
      }
      
      const selectedCard = JSON.parse(selectedCardJson);
      
      // Esconder seletor de cores
      const colorSelector = document.getElementById('color-selector');
      if (colorSelector) {
        colorSelector.classList.add('hidden');
      }
      
      // Adicionar cor escolhida à carta
      selectedCard.chosenColor = color;
      
      // Jogar a carta
      this.playCard(selectedCard);
      
      // Limpar carta selecionada
      localStorage.removeItem('selectedCard');
    }
    
    // Mostrar seletor de cores
    showColorSelector(card) {
      // Armazenar carta selecionada
      localStorage.setItem('selectedCard', JSON.stringify(card));
      
      // Mostrar seletor
      const colorSelector = document.getElementById('color-selector');
      if (colorSelector) {
        colorSelector.classList.remove('hidden');
      }
    }
    
    // Verificar se uma carta pode ser jogada
    isCardPlayable(card, topCard = null, currentColor = null) {
      // Se não foi especificado, usar carta do topo da pilha de descarte
      if (!topCard) {
        topCard = this.gameState.discardPile[0];
      }
      
      // Se não foi especificada, usar cor atual
      if (!currentColor) {
        currentColor = this.gameState.currentColor;
      }
      
      // Cartas curinga são sempre jogáveis
      if (card.type === 'wild') {
        return true;
      }
      
      // Mesma cor
      if (card.color === currentColor) {
        return true;
      }
      
      // Mesmo valor/símbolo
      if (card.value === topCard.value) {
        return true;
      }
      
      return false;
    }
    
    // Jogar uma carta
    playCard(card) {
      if (this.isOnline) {
        this.playCardOnline(card);
        return;
      }
      
      const player = this.playerManager.getCurrentPlayer();
      const isHumanPlayer = player.id === 'player-human';
      
      // Remover carta da mão do jogador
      player.removeCard(card.id);
      
      // Adicionar à pilha de descarte
      this.gameState.discardPile.unshift(card);
      
      // Atualizar cor atual
      if (card.type === 'wild') {
        this.gameState.currentColor = card.chosenColor || this.getRandomColor();
      } else {
        this.gameState.currentColor = card.color;
      }
      
      // Exibir mensagem de jogada
      if (isHumanPlayer) {
        this.showMessage(`Você jogou ${this.getCardName(card)}.`);
      } else {
        this.showMessage(`${player.name} jogou ${this.getCardName(card)}.`);
      }
      
      // Verificar se o jogador precisa chamar UNO
      if (player.cards.length === 1 && !player.hasCalledUno) {
        if (isHumanPlayer) {
          // Para jogador humano, lembrar de chamar UNO
          this.showMessage("Você está com apenas uma carta! Não esqueça de clicar UNO!");
        } else {
          // Para IA, probabilidade de chamar UNO
          const callsUno = Math.random() < 0.7; // 70% de chance
          
          if (callsUno) {
            player.hasCalledUno = true;
            this.showMessage(`${player.name} grita "UNO!"`);
          }
        }
      }
      
      // Verificar vitória
      if (player.cards.length === 0) {
        if (isHumanPlayer) {
          this.showMessage("PARABÉNS! Você venceu!");
        } else {
          this.showMessage(`${player.name} venceu o jogo!`);
        }
        
        // Registrar estatísticas
        this.saveGameStats(player);
        
        // Reiniciar jogo após 3 segundos
        setTimeout(() => {
          this.showConfirmDialog("Iniciar novo jogo?", () => {
            this.initLocalGame(this.gameConfig);
          }, () => {
            window.showScreen('start-screen');
          });
        }, 3000);
        
        return;
      }
      
      // Aplicar efeitos da carta
      this.applyCardEffects(card);
      
      // Atualizar interface
      this.renderGameState();
      
      // Verificar e jogar IA
      setTimeout(() => {
        this.checkAndPlayAI();
      }, 500);
    }
    
    // Jogar carta no modo online
    async playCardOnline(card) {
      try {
        const session = Storage.getSession();
        const roomCode = session.roomCode;
        const playerId = session.playerId;
        
        // Referência à sala
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        // Obter dados atuais do jogo
        const snapshot = await roomRef.once('value');
        const roomData = snapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error("Dados do jogo não encontrados.");
        }
        
        const gameData = roomData.game;
        
        // Verificar se é a vez do jogador
        if (gameData.playerIds[gameData.currentPlayerIndex] !== playerId) {
          throw new Error("Não é sua vez de jogar.");
        }
        
        // Verificar se o jogador tem a carta
        const playerHand = gameData.hands[playerId] || [];
        const cardIndex = playerHand.findIndex(c => c.id === card.id);
        
        if (cardIndex === -1) {
          throw new Error("Carta não encontrada na sua mão.");
        }
        
        // Verificar se a carta é jogável
        if (!this.isCardPlayable(card, gameData.discard[0], gameData.currentColor)) {
          throw new Error("Esta carta não pode ser jogada agora.");
        }
        
        // Remover carta da mão
        playerHand.splice(cardIndex, 1);
        
        // Adicionar à pilha de descarte
        gameData.discard.unshift(card);
        
        // Atualizar cor atual para cartas curinga
        if (card.type === 'wild') {
          gameData.currentColor = card.chosenColor || this.getRandomColor();
        } else {
          gameData.currentColor = card.color;
        }
        
        // Atualizar mão do jogador
        gameData.hands[playerId] = playerHand;
        
        // Verificar UNO
        const needsToCallUno = playerHand.length === 1;
        const hasCalledUno = (gameData.unoStatus && gameData.unoStatus[playerId]) || false;
        
        if (needsToCallUno && !hasCalledUno) {
          // Jogador não chamou UNO
          // Em um jogo real, aqui verificaria se outro jogador "pegou" ele
        }
        
        // Verificar vitória
        if (playerHand.length === 0) {
          // Atualizar status da sala
          await roomRef.update({
            status: 'finished',
            winner: playerId,
            finishedAt: firebase.database.ServerValue.TIMESTAMP
          });
          
          // Registrar última ação
          gameData.lastAction = {
            type: 'gameWin',
            playerId: playerId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          };
          
          // Salvar jogo atualizado
          await roomRef.child('game').set(gameData);
          
          // Mostrar mensagem de vitória no cliente
          this.showMessage("PARABÉNS! Você venceu!");
          
          return;
        }
        
        // Aplicar efeitos da carta
        this.applyCardEffectsOnline(gameData, card);
        
        // Registrar última ação
        gameData.lastAction = {
          type: 'playCard',
          playerId: playerId,
          card: card,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Incrementar turno
        gameData.turn = (gameData.turn || 0) + 1;
        
        // Atualizar o jogo
        await roomRef.child('game').set(gameData);
        
        // Mostrar mensagem no cliente
        this.showMessage(`Você jogou ${this.getCardName(card)}.`);
        
      } catch (error) {
        console.error("Erro ao jogar carta:", error);
        this.showError(error.message || "Erro ao jogar carta.");
      }
    }
    
    // Aplicar efeitos de carta no modo online
    applyCardEffectsOnline(gameData, card) {
      const playerCount = gameData.playerIds.length;
      
      // Aplicar efeitos com base no valor da carta
      switch (card.value) {
        case 'skip':
          // Pular próximo jogador
          gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
          break;
          
        case 'reverse':
          // Inverter direção
          gameData.direction *= -1;
          
          // Em jogo de 2 jogadores, funciona como Skip
          if (playerCount === 2) {
            break;
          }
          
          // Passar para o próximo jogador na nova direção
          gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
          break;
          
        case 'draw2':
          // Próximo jogador compra 2 cartas
          const nextPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
          const nextPlayerId = gameData.playerIds[nextPlayerIndex];
          
          // Garantir que temos cartas suficientes
          this.ensureEnoughCards(gameData);
          
          // Próximo jogador compra 2 cartas
          const nextPlayerHand = gameData.hands[nextPlayerId] || [];
          nextPlayerHand.push(...gameData.deck.splice(0, 2));
          gameData.hands[nextPlayerId] = nextPlayerHand;
          
          // Pular o jogador
          gameData.currentPlayerIndex = (nextPlayerIndex + gameData.direction + playerCount) % playerCount;
          break;
          
        case 'wild-draw-four':
          // Próximo jogador compra 4 cartas
          const nextIdx = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
          const nextPlayer = gameData.playerIds[nextIdx];
          
          // Garantir que temos cartas suficientes
          this.ensureEnoughCards(gameData);
          
          // Próximo jogador compra 4 cartas
          const nextHand = gameData.hands[nextPlayer] || [];
          nextHand.push(...gameData.deck.splice(0, 4));
          gameData.hands[nextPlayer] = nextHand;
          
          // Pular o jogador
          gameData.currentPlayerIndex = (nextIdx + gameData.direction + playerCount) % playerCount;
          break;
          
        default:
          // Para cartas normais (números), apenas avança para o próximo jogador
          gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
          break;
      }
      
      // Regras especiais baseadas no modo de jogo
      const customRules = roomManager.currentRoom.customRules || {};
      
      // Regra do Sete: Trocar mãos
      if (card.value === '7' && customRules.sevenTrade) {
        const currentPlayerId = gameData.playerIds[gameData.currentPlayerIndex];
        
        // Selecionar outro jogador para trocar
        let otherPlayerIndex;
        if (playerCount === 2) {
          // Em jogo de 2, troca automaticamente com o outro
          otherPlayerIndex = (gameData.currentPlayerIndex + 1) % playerCount;
        } else {
          // Em jogo com mais, escolher aleatório (poderia ser baseado em escolha do jogador)
          do {
            otherPlayerIndex = Math.floor(Math.random() * playerCount);
          } while (otherPlayerIndex === gameData.currentPlayerIndex);
        }
        
        const otherPlayerId = gameData.playerIds[otherPlayerIndex];
        
        // Trocar mãos
        const currentHand = gameData.hands[currentPlayerId] || [];
        const otherHand = gameData.hands[otherPlayerId] || [];
        
        gameData.hands[currentPlayerId] = otherHand;
        gameData.hands[otherPlayerId] = currentHand;
      }
      
      // Regra do Zero: Rotacionar mãos
      if (card.value === '0' && customRules.zeroRotate) {
        // Cria um array com os IDs dos jogadores na ordem de rotação
        const rotation = [];
        for (let i = 0; i < playerCount; i++) {
          rotation.push(gameData.playerIds[i]);
        }
        
        // Obtém todas as mãos na ordem atual
        const hands = rotation.map(id => gameData.hands[id] || []);
        
        // Rotaciona as mãos (na direção do jogo)
        if (gameData.direction === 1) {
          // Sentido horário
          const lastHand = hands.pop();
          hands.unshift(lastHand);
        } else {
          // Sentido anti-horário
          const firstHand = hands.shift();
          hands.push(firstHand);
        }
        
        // Atualiza as mãos de cada jogador
        for (let i = 0; i < playerCount; i++) {
          gameData.hands[rotation[i]] = hands[i];
        }
      }
    }
    
    // Aplicar efeitos da carta jogada
    applyCardEffects(card) {
      // Aplicar efeitos com base no valor da carta
      switch (card.value) {
        case 'skip':
          // Pular próximo jogador
          this.playerManager.nextPlayer();
          this.showMessage(`${this.playerManager.getCurrentPlayer().name} perde a vez!`);
          break;
          
        case 'reverse':
          // Inverter direção do jogo
          this.playerManager.reverseDirection();
          this.showMessage("Direção do jogo invertida!");
          
          // Em jogo de 2 jogadores, funciona como Skip
          if (this.playerManager.players.length === 2) {
            break;
          }
          break;
          
        case 'draw2':
          // Próximo jogador compra 2 cartas
          const nextPlayer = this.playerManager.nextPlayer();
          
          for (let i = 0; i < 2; i++) {
            const drawnCard = this.drawCard();
            if (drawnCard) {
              nextPlayer.addCard(drawnCard);
            }
          }
          
          this.showMessage(`${nextPlayer.name} compra 2 cartas e perde a vez!`);
          
          // Pular a vez do jogador
          this.playerManager.nextPlayer();
          break;
          
        case 'wild-draw-four':
          // Próximo jogador compra 4 cartas
          const next = this.playerManager.nextPlayer();
          
          for (let i = 0; i < 4; i++) {
            const drawnCard = this.drawCard();
            if (drawnCard) {
              next.addCard(drawnCard);
            }
          }
          
          this.showMessage(`${next.name} compra 4 cartas e perde a vez!`);
          
          // Pular a vez do jogador
          this.playerManager.nextPlayer();
          break;
          
        default:
          // Para cartas normais (números), apenas avança para o próximo jogador
          this.playerManager.nextPlayer();
          break;
      }
      
      // Regras especiais baseadas no modo de jogo
      const customRules = this.gameConfig.customRules;
      
      // Regra do Sete: Trocar mãos
      if (card.value === '7' && customRules.sevenTrade) {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        
        // Selecionar outro jogador para trocar
        let otherPlayer;
        if (this.playerManager.players.length === 2) {
          // Em jogo de 2, troca automaticamente com o outro
          otherPlayer = this.playerManager.players[currentPlayer.id === 'player-human' ? 1 : 0];
        } else {
          // Em jogo com mais, escolher aleatório (poderia ser baseado em escolha do jogador)
          do {
            const randomIndex = Math.floor(Math.random() * this.playerManager.players.length);
            otherPlayer = this.playerManager.players[randomIndex];
          } while (otherPlayer.id === currentPlayer.id);
        }
        
        // Trocar mãos
        const tempCards = [...currentPlayer.cards];
        currentPlayer.cards = [...otherPlayer.cards];
        otherPlayer.cards = tempCards;
        
        this.showMessage(`${currentPlayer.name} troca as cartas com ${otherPlayer.name}!`);
      }
      
      // Regra do Zero: Rotacionar mãos
      if (card.value === '0' && customRules.zeroRotate) {
        // Rotacionar mãos na direção do jogo
        const players = this.playerManager.players;
        const hands = players.map(p => [...p.cards]);
        
        if (this.playerManager.direction === 1) {
          // Sentido horário
          const lastHand = hands.pop();
          hands.unshift(lastHand);
        } else {
          // Sentido anti-horário
          const firstHand = hands.shift();
          hands.push(firstHand);
        }
        
        // Atualizar mãos dos jogadores
        for (let i = 0; i < players.length; i++) {
          players[i].cards = hands[i];
        }
        
        this.showMessage("Todas as mãos foram rotacionadas!");
      }
    }
    
    // Verificar e jogar IA se for a vez de um jogador AI
    checkAndPlayAI() {
      const currentPlayer = this.playerManager.getCurrentPlayer();
      
      // Se não for jogador AI, não fazer nada
      if (!currentPlayer.isAI) {
        return;
      }
      
      // Pequeno atraso para simular "pensamento" da IA
      setTimeout(() => {
        this.playAI(currentPlayer);
      }, 1000);
    }
    
    // Lógica de jogada da IA
    playAI(aiPlayer) {
      // Verificar cartas jogáveis
      const playableCards = aiPlayer.cards.filter(card => this.isCardPlayable(card));
      
      // Se não tiver cartas jogáveis, comprar
      if (playableCards.length === 0) {
        this.showMessage(`${aiPlayer.name} compra uma carta.`);
        
        const drawnCard = this.drawCard();
        if (drawnCard) {
          aiPlayer.addCard(drawnCard);
          
          // Verificar se a carta comprada pode ser jogada
          if (this.isCardPlayable(drawnCard) && this.gameConfig.customRules.forcePlay) {
            this.showMessage(`${aiPlayer.name} joga a carta comprada!`);
            this.playCard(drawnCard);
            return;
          }
        }
        
        // Renderizar estado atual
        this.renderGameState();
        
        // Passar para o próximo jogador
        this.nextTurn();
        return;
      }
      
      // Lógica para escolher a melhor carta
      let selectedCard = this.chooseAICard(playableCards);
      
      // Se for uma carta curinga, escolher a cor predominante na mão
      if (selectedCard.type === 'wild') {
        selectedCard.chosenColor = this.getPreferredColor(aiPlayer.cards);
      }
      
      // Jogar a carta selecionada
      this.playCard(selectedCard);
    }
    
    // Escolher a melhor carta para a IA jogar
    chooseAICard(playableCards) {
      // Prioridade: 
      // 1. Cartas de ação (+4, +2, Skip, Reverse)
      // 2. Cartas numéricas mais altas
      // 3. Curingas regulares
      
      // Verificar cartas de ação especiais
      const specialCards = playableCards.filter(card => {
        return card.value === 'wild-draw-four' ||
               card.value === 'draw2' ||
               card.value === 'skip' ||
               card.value === 'reverse';
      });
      
      // Se tiver cartas especiais, escolher uma aleatoriamente
      if (specialCards.length > 0) {
        return specialCards[Math.floor(Math.random() * specialCards.length)];
      }
      
      // Separar cartas numéricas e curingas
      const numberCards = playableCards.filter(card => card.type === 'number');
      const wildCards = playableCards.filter(card => card.type === 'wild' && card.value === 'wild');
      
      // Preferir cartas numéricas, ordenadas pelo valor (maior primeiro)
      if (numberCards.length > 0) {
        numberCards.sort((a, b) => parseInt(b.value) - parseInt(a.value));
        return numberCards[0];
      }
      
      // Se só tiver curingas, escolher um
      if (wildCards.length > 0) {
        return wildCards[0];
      }
      
      // Fallback: escolher uma carta aleatória
      return playableCards[Math.floor(Math.random() * playableCards.length)];
    }
    
    // Obter cor predominante na mão do jogador
    getPreferredColor(cards) {
      const colorCount = {
        red: 0,
        blue: 0,
        green: 0,
        yellow: 0
      };
      
      // Contar cartas de cada cor
      cards.forEach(card => {
        if (card.color !== 'black') {
          colorCount[card.color]++;
        }
      });
      
      // Encontrar cor com mais cartas
      let maxColor = 'red';
      let maxCount = 0;
      
      for (const color in colorCount) {
        if (colorCount[color] > maxCount) {
          maxCount = colorCount[color];
          maxColor = color;
        }
      }
      
      // Se não tiver nenhuma cor predominante, escolher aleatória
      if (maxCount === 0) {
        const colors = ['red', 'blue', 'green', 'yellow'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      
      return maxColor;
    }
    
    // Avançar para o próximo turno
    nextTurn() {
      // Verificar IA
      this.checkAndPlayAI();
    }
    
    // Tratar atualizações da sala
    handleRoomUpdates() {
      document.addEventListener('roomUpdate', (e) => {
        const room = e.detail.room;
        
        // Verificar se a sala está em modo de jogo
        if (room && room.status === 'playing' && this.isOnline) {
          this.updateFromRoom(room);
        }
      });
    }
    
    // Renderizar estado atual do jogo
    renderGameState() {
      // Atualizar mão do jogador
      this.renderPlayerHand();
      
      // Atualizar oponentes
      this.renderOpponents();
      
      // Atualizar pilha de descarte
      this.renderDiscardPile();
      
      // Atualizar pilha de compra
      this.renderDrawPile();
      
      // Atualizar informações de jogo
      this.updateGameInfo();
      
      // Destacar jogador atual
      this.highlightCurrentPlayer();
    }
    
    // Renderizar mão do jogador
    renderPlayerHand() {
      // No modo online, renderizar mão do jogador atual
      if (this.isOnline) {
        const playerId = Storage.getSession().playerId;
        
        if (this.gameState && this.gameState.hands && this.gameState.hands[playerId]) {
          const playerHand = this.gameState.hands[playerId];
          const topCard = this.gameState.discardPile[0];
          const currentColor = this.gameState.currentColor;
          
          // Verificar quais cartas são jogáveis
          const isPlayable = (card) => {
            const isCurrentPlayer = playerId === this.gameState.playerIds[this.gameState.currentPlayerIndex];
            return isCurrentPlayer && this.isCardPlayable(card, topCard, currentColor);
          };
          
          // Renderizar mão do jogador
          if (this.playerHand) {
            // Usar o cardRenderer para criar os elementos HTML das cartas
            this.playerHand.innerHTML = '';
            
            playerHand.forEach((card, index) => {
              const cardElem = cardRenderer.renderCard(card, isPlayable(card));
              
              // Adicionar efeito de entrada
              setTimeout(() => {
                cardElem.classList.add('in-hand');
              }, index * 50);
              
              // Adicionar evento de clique
              cardElem.addEventListener('click', () => {
                this.handleCardClick(cardElem);
              });
              
              this.playerHand.appendChild(cardElem);
            });
            
            // Atualizar contador de cartas
            if (this.cardCountDisplay) {
              this.cardCountDisplay.textContent = `${playerHand.length} carta${playerHand.length !== 1 ? 's' : ''}`;
            }
            
            // Atualizar nome do jogador
            if (this.playerNameDisplay) {
              const playerName = roomManager.currentRoom.players[playerId].name;
              this.playerNameDisplay.textContent = playerName;
            }
          }
          
          return;
        }
      }
      
      // Para modo local
      if (!this.isOnline && this.playerManager) {
        const humanPlayer = this.playerManager.players[0];
        
        if (this.playerHand) {
          // Verificar quais cartas são jogáveis
          const isCurrentPlayer = this.playerManager.currentPlayerIndex === 0;
          const topCard = this.gameState.discardPile[0];
          const currentColor = this.gameState.currentColor;
          
          const isPlayable = (card) => {
            return isCurrentPlayer && this.isCardPlayable(card, topCard, currentColor);
          };
          
          // Renderizar mão do jogador
          this.playerHand.innerHTML = '';
          
          humanPlayer.cards.forEach((card, index) => {
            const cardElem = cardRenderer.renderCard(card, isPlayable(card));
            
            // Adicionar efeito de entrada
            setTimeout(() => {
              cardElem.classList.add('in-hand');
            }, index * 50);
            
            // Adicionar evento de clique
            cardElem.addEventListener('click', () => {
              this.handleCardClick(cardElem);
            });
            
            this.playerHand.appendChild(cardElem);
          });
          
          // Atualizar contador de cartas
          if (this.cardCountDisplay) {
            this.cardCountDisplay.textContent = `${humanPlayer.cards.length} carta${humanPlayer.cards.length !== 1 ? 's' : ''}`;
          }
        }
      }
    }
    
    // Renderizar oponentes
    renderOpponents() {
      if (!this.opponentsContainer) return;
      
      this.opponentsContainer.innerHTML = '';
      
      // No modo online, renderizar todos os jogadores exceto o atual
      if (this.isOnline) {
        const playerId = Storage.getSession().playerId;
        const room = roomManager.currentRoom;
        
        if (!room || !this.gameState || !this.gameState.playerIds) return;
        
        // Renderizar jogadores na ordem
        this.gameState.playerIds.forEach((id, index) => {
          // Não mostrar o próprio jogador
          if (id === playerId) return;
          
          const player = room.players[id];
          if (!player) return;
          
          const cardCount = (this.gameState.hands[id] || []).length;
          const isCurrentPlayer = index === this.gameState.currentPlayerIndex;
          
          // Criar elemento do oponente
          const opponentElem = document.createElement('div');
          opponentElem.className = 'opponent';
          opponentElem.dataset.id = id;
          
          if (isCurrentPlayer) {
            opponentElem.classList.add('current-player');
          }
          
          // Adicionar avatar e informações
          opponentElem.innerHTML = `
            <div class="opponent-avatar" style="background-color: ${player.color || '#3498db'}">
              ${player.name.charAt(0).toUpperCase()}
            </div>
            <div class="opponent-info">
              <div class="opponent-name">${player.name}</div>
              <div class="opponent-card-count">${cardCount} carta${cardCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="opponent-cards">
              ${Array(cardCount).fill('<div class="card back"></div>').join('')}
            </div>
          `;
          
          this.opponentsContainer.appendChild(opponentElem);
        });
        
        return;
      }
      
      // Para modo local, mostrar jogadores AI
      if (!this.isOnline && this.playerManager) {
        // Renderizar jogadores AI
        for (let i = 1; i < this.playerManager.players.length; i++) {
          const player = this.playerManager.players[i];
          const isCurrentPlayer = i === this.playerManager.currentPlayerIndex;
          
          // Criar elemento do oponente
          const opponentElem = document.createElement('div');
          opponentElem.className = 'opponent';
          opponentElem.dataset.id = player.id;
          
          if (isCurrentPlayer) {
            opponentElem.classList.add('current-player');
          }
          
          // Adicionar avatar e informações
          opponentElem.innerHTML = `
            <div class="opponent-avatar" style="background-color: ${player.color}">
              ${player.name.charAt(0).toUpperCase()}
            </div>
            <div class="opponent-info">
              <div class="opponent-name">${player.name}</div>
              <div class="opponent-card-count">${player.cards.length} carta${player.cards.length !== 1 ? 's' : ''}</div>
            </div>
            <div class="opponent-cards">
              ${Array(player.cards.length).fill('<div class="card back"></div>').join('')}
            </div>
          `;
          
          this.opponentsContainer.appendChild(opponentElem);
        }
      }
    }
    
    // Renderizar pilha de descarte
    renderDiscardPile() {
      if (!this.discardPile || !this.gameState || !this.gameState.discardPile || this.gameState.discardPile.length === 0) {
        return;
      }
      
      // Obter carta do topo
      const topCard = this.gameState.discardPile[0];
      
      // Limpar pilha de descarte
      this.discardPile.innerHTML = '';
      
      // Criar elemento da carta
      const cardElem = cardRenderer.renderCard(topCard);
      
      // Adicionar à pilha
      this.discardPile.appendChild(cardElem);
      
      // Se for curinga com cor escolhida, aplicar cor
      if (topCard.type === 'wild' && topCard.chosenColor) {
        cardElem.classList.add('colored-wild');
        cardElem.dataset.chosenColor = topCard.chosenColor;
        
        // Adicionar overlay de cor
        const overlay = document.createElement('div');
        overlay.className = `color-overlay ${topCard.chosenColor}`;
        cardElem.appendChild(overlay);
      }
    }
    
    // Renderizar pilha de compra
    renderDrawPile() {
      if (!this.drawPile) return;
      
      // Limpar pilha de compra
      this.drawPile.innerHTML = '';
      
      // Adicionar cartas de verso
      const cardCount = this.isOnline ? 
        (this.gameState.deck ? this.gameState.deck.length : 0) : 
        this.deck.cards.length;
      
      // Criar pilha de cartas
      const cardElem = document.createElement('div');
      cardElem.className = 'card back';
      
      const cardLabel = document.createElement('div');
      cardLabel.className = 'card-count-label';
      cardLabel.textContent = cardCount;
      
      this.drawPile.appendChild(cardElem);
      this.drawPile.appendChild(cardLabel);
      
      // Atualizar contador de cartas no display
      if (this.cardsLeftDisplay) {
        this.cardsLeftDisplay.textContent = `Cartas no monte: ${cardCount}`;
      }
    }
    
    // Atualizar informações do jogo
    updateGameInfo() {
      // Atualizar jogador atual
      if (this.currentPlayerDisplay) {
        let currentPlayerName = '';
        
        if (this.isOnline) {
          const currentPlayerId = this.gameState.playerIds[this.gameState.currentPlayerIndex];
          const room = roomManager.currentRoom;
          
          if (room && room.players[currentPlayerId]) {
            currentPlayerName = room.players[currentPlayerId].name;
          }
        } else if (this.playerManager) {
          currentPlayerName = this.playerManager.getCurrentPlayer().name;
        }
        
        this.currentPlayerDisplay.textContent = `Vez de: ${currentPlayerName}`;
      }
    }
    
    // Destacar jogador atual
    highlightCurrentPlayer() {
      // Remover destaque de todos os jogadores
      document.querySelectorAll('.opponent').forEach(elem => {
        elem.classList.remove('current-player');
      });
      
      // Adicionar destaque ao jogador atual
      if (this.isOnline) {
        const currentPlayerId = this.gameState.playerIds[this.gameState.currentPlayerIndex];
        const playerElem = document.querySelector(`.opponent[data-id="${currentPlayerId}"]`);
        
        if (playerElem) {
          playerElem.classList.add('current-player');
        }
        
        // Verificar se é a vez do jogador humano
        const session = Storage.getSession();
        const isPlayerTurn = currentPlayerId === session.playerId;
        
        // Atualizar status de turno
        const statusIndicator = document.getElementById('game-status-indicator');
        const statusText = statusIndicator ? statusIndicator.querySelector('.status-text') : null;
        
        if (statusIndicator) {
          if (isPlayerTurn) {
            statusIndicator.classList.add('your-turn');
            if (statusText) statusText.textContent = 'Seu turno!';
          } else {
            statusIndicator.classList.remove('your-turn');
            if (statusText) statusText.textContent = `Turno de ${roomManager.currentRoom.players[currentPlayerId].name}`;
          }
        }
      } else if (this.playerManager) {
        const currentPlayerIndex = this.playerManager.currentPlayerIndex;
        
        // Se não for o jogador humano, destacar o AI correspondente
        if (currentPlayerIndex !== 0) {
          const playerElem = document.querySelector(`.opponent[data-id="player-ai-${currentPlayerIndex}"]`);
          
          if (playerElem) {
            playerElem.classList.add('current-player');
          }
          
          // Atualizar status de turno
          const statusIndicator = document.getElementById('game-status-indicator');
          const statusText = statusIndicator ? statusIndicator.querySelector('.status-text') : null;
          
          if (statusIndicator) {
            statusIndicator.classList.remove('your-turn');
            if (statusText) statusText.textContent = `Turno de ${this.playerManager.getCurrentPlayer().name}`;
          }
        } else {
          // Turno do jogador humano
          const statusIndicator = document.getElementById('game-status-indicator');
          const statusText = statusIndicator ? statusIndicator.querySelector('.status-text') : null;
          
          if (statusIndicator) {
            statusIndicator.classList.add('your-turn');
            if (statusText) statusText.textContent = 'Seu turno!';
          }
        }
      }
    }
    
    // Criar e embaralhar baralho
    createAndShuffleDeck() {
      // Implementar de acordo com o modo de jogo
      const mode = GameModes.getMode(this.gameConfig.mode);
      const cards = [];
      
      const colors = ['red', 'blue', 'green', 'yellow'];
      
      // Adicionar cartas numéricas (0-9)
      for (let color of colors) {
        // Um 0 por cor
        cards.push({
          id: `${color}-0-${this.generateId()}`,
          type: 'number',
          color: color,
          value: '0'
        });
        
        // Dois de cada 1-9
        for (let i = 1; i <= 9; i++) {
          for (let j = 0; j < 2; j++) {
            cards.push({
              id: `${color}-${i}-${this.generateId()}`,
              type: 'number',
              color: color,
              value: i.toString()
            });
          }
        }
        
        // Cartas de ação
        for (let i = 0; i < 2; i++) {
          cards.push({
            id: `${color}-skip-${this.generateId()}`,
            type: 'action',
            color: color,
            value: 'skip'
          });
          
          cards.push({
            id: `${color}-reverse-${this.generateId()}`,
            type: 'action',
            color: color,
            value: 'reverse'
          });
          
          cards.push({
            id: `${color}-draw2-${this.generateId()}`,
            type: 'action',
            color: color,
            value: 'draw2'
          });
        }
      }
      
      // Cartas curinga
      for (let i = 0; i < 4; i++) {
        cards.push({
          id: `wild-${this.generateId()}`,
          type: 'wild',
          color: 'black',
          value: 'wild'
        });
        
        cards.push({
          id: `wild-draw4-${this.generateId()}`,
          type: 'wild',
          color: 'black',
          value: 'wild-draw-four'
        });
      }
      
      // Adicionar cartas especiais para modos específicos
      if (['wild', 'extreme', 'chaos'].includes(this.gameConfig.mode)) {
        // Mais cartas de ação
        for (let color of colors) {
          cards.push({
            id: `${color}-skip-extra-${this.generateId()}`,
            type: 'action',
            color: color,
            value: 'skip'
          });
          
          cards.push({
            id: `${color}-reverse-extra-${this.generateId()}`,
            type: 'action',
            color: color,
            value: 'reverse'
          });
          
          cards.push({
            id: `${color}-draw2-extra-${this.generateId()}`,
            type: 'action',
            color: color,
            value: 'draw2'
          });
        }
        
        // Mais curingas
        for (let i = 0; i < 2; i++) {
          cards.push({
            id: `wild-extra-${this.generateId()}`,
            type: 'wild',
            color: 'black',
            value: 'wild'
          });
          
          cards.push({
            id: `wild-draw4-extra-${this.generateId()}`,
            type: 'wild',
            color: 'black',
            value: 'wild-draw-four'
          });
        }
      }
      
      // Embaralhar baralho
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      
      return {
        cards: cards,
        drawCard: function() {
          return this.cards.pop();
        },
        addCard: function(card) {
          this.cards.unshift(card);
        },
        cardsLeft: function() {
          return this.cards.length;
        }
      };
    }
    
    // Virar primeira carta
    drawFirstCard() {
      // Escolher primeira carta (que não seja Wild Draw Four)
      let firstCard;
      
      do {
        firstCard = this.deck.drawCard();
        
        // Se for Wild Draw Four, colocar de volta no final
        if (firstCard.type === 'wild' && firstCard.value === 'wild-draw-four') {
          this.deck.addCard(firstCard);
          firstCard = null;
        }
      } while (!firstCard);
      
      // Se for curinga, escolher cor aleatória
      if (firstCard.type === 'wild') {
        firstCard.chosenColor = this.getRandomColor();
      }
      
      return firstCard;
    }
    
    // Aplicar efeito da primeira carta
    applyFirstCardEffect(firstCard) {
      // Se for carta de ação, aplicar efeito
      if (firstCard.type === 'action') {
        switch (firstCard.value) {
          case 'skip':
            // Pular primeiro jogador
            this.playerManager.nextPlayer();
            break;
            
          case 'reverse':
            // Inverter direção (em jogo de 2 jogadores, funciona como Skip)
            this.playerManager.reverseDirection();
            
            if (this.playerManager.players.length === 2) {
              this.playerManager.nextPlayer();
            }
            break;
            
          case 'draw2':
            // Primeiro jogador compra 2 cartas e perde a vez
            const player = this.playerManager.getCurrentPlayer();
            
            for (let i = 0; i < 2; i++) {
              const drawnCard = this.deck.drawCard();
              if (drawnCard) {
                player.addCard(drawnCard);
              }
            }
            
            this.playerManager.nextPlayer();
            break;
        }
      }
    }
    
    // Comprar carta
    drawCard() {
      // Verificar se há cartas no baralho
      if (this.deck.cardsLeft() === 0) {
        // Se não há cartas, embaralhar pilha de descarte
        this.recycleDiscardPile();
        
        // Se ainda não há cartas, retornar nulo
        if (this.deck.cardsLeft() === 0) {
          return null;
        }
      }
      
      return this.deck.drawCard();
    }
    
    // Reciclar pilha de descarte
    recycleDiscardPile() {
      // Verificar se há cartas na pilha de descarte
      if (this.gameState.discardPile.length <= 1) {
        return;
      }
      
      // Guardar a carta do topo
      const topCard = this.gameState.discardPile.shift();
      
      // Adicionar o resto das cartas ao baralho
      const discardPile = [...this.gameState.discardPile];
      this.gameState.discardPile = [topCard];
      
      // Embaralhar e adicionar ao baralho
      for (let i = discardPile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [discardPile[i], discardPile[j]] = [discardPile[j], discardPile[i]];
      }
      
      // Adicionar ao baralho
      discardPile.forEach(card => {
        this.deck.addCard(card);
      });
    }
    
    // Gerar cor aleatória
    getRandomColor() {
      const colors = ['red', 'blue', 'green', 'yellow'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Gerar ID aleatório
    generateId() {
      return Math.random().toString(36).substr(2, 9);
    }
    
    // Obter nome da carta para exibição
    getCardName(card) {
      let cardName = '';
      
      // Determinar nome com base no tipo e valor
      if (card.type === 'number') {
        cardName = `${card.value} ${this.getColorName(card.color)}`;
      } else if (card.type === 'action') {
        switch (card.value) {
          case 'skip':
            cardName = `Pular ${this.getColorName(card.color)}`;
            break;
          case 'reverse':
            cardName = `Inverter ${this.getColorName(card.color)}`;
            break;
          case 'draw2':
            cardName = `+2 ${this.getColorName(card.color)}`;
            break;
        }
      } else if (card.type === 'wild') {
        if (card.value === 'wild') {
          cardName = 'Curinga';
          if (card.chosenColor) {
            cardName += ` (${this.getColorName(card.chosenColor)})`;
          }
        } else if (card.value === 'wild-draw-four') {
          cardName = '+4 Curinga';
          if (card.chosenColor) {
            cardName += ` (${this.getColorName(card.chosenColor)})`;
          }
        }
      }
      
      return cardName;
    }
    
    // Obter nome da cor
    getColorName(color) {
      switch (color) {
        case 'red': return 'Vermelho';
        case 'blue': return 'Azul';
        case 'green': return 'Verde';
        case 'yellow': return 'Amarelo';
        default: return color;
      }
    }
    
    // Salvar estatísticas do jogo
    saveGameStats(winner) {
      // Obter estatísticas atuais
      const stats = Storage.getStats();
      
      // Incrementar jogos jogados
      stats.gamesPlayed += 1;
      
      // Se o vencedor é o jogador humano, incrementar jogos ganhos
      const isHumanWinner = winner.id === 'player-human';
      if (isHumanWinner) {
        stats.gamesWon += 1;
      }
      
      // Salvar estatísticas atualizadas
      Storage.saveStats(stats);
      
      // Adicionar jogo ao histórico
      const gameHistory = {
        timestamp: Date.now(),
        mode: this.gameConfig.mode,
        winner: winner.name,
        isHumanWinner: isHumanWinner,
        playerCount: this.playerManager.players.length
      };
      
      Storage.addGameToHistory(gameHistory);
    }
    
    // Mostrar mensagem de jogo
    showMessage(text, duration = 3000) {
      // Criar container para mensagens se não existir
      let messagesContainer = document.getElementById('game-messages');
      
      if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.id = 'game-messages';
        messagesContainer.className = 'game-messages';
        
        // Adicionar ao centro da tela de jogo
        const centerArea = document.querySelector('.center-area');
        if (centerArea) {
          centerArea.appendChild(messagesContainer);
        } else {
          this.gameScreen.appendChild(messagesContainer);
        }
      }
      
      // Criar elemento de mensagem
      const messageElement = document.createElement('div');
      messageElement.className = 'game-message';
      messageElement.textContent = text;
      
      // Adicionar ao container
      messagesContainer.appendChild(messageElement);
      
      // Animar entrada
      setTimeout(() => {
        messageElement.classList.add('show');
      }, 10);
      
      // Remover após duração
      setTimeout(() => {
        messageElement.classList.remove('show');
        messageElement.classList.add('hide');
        
        setTimeout(() => {
          if (messagesContainer.contains(messageElement)) {
            messagesContainer.removeChild(messageElement);
          }
        }, 500);
      }, duration);
    }
    
    // Mostrar erro
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
    
    // Mostrar diálogo de confirmação
    showConfirmDialog(message, onConfirm, onCancel) {
      // Criar overlay
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      
      // Criar diálogo
      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';
      
      // Adicionar mensagem
      const messageElem = document.createElement('p');
      messageElem.textContent = message;
      dialog.appendChild(messageElem);
      
      // Adicionar botões
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'confirm-buttons';
      
      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = 'Sim';
      confirmBtn.className = 'primary-btn';
      confirmBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
      });
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Não';
      cancelBtn.className = 'secondary-btn';
      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      });
      
      buttonsContainer.appendChild(confirmBtn);
      buttonsContainer.appendChild(cancelBtn);
      dialog.appendChild(buttonsContainer);
      
      // Adicionar diálogo ao overlay
      overlay.appendChild(dialog);
      
      // Adicionar overlay à página
      document.body.appendChild(overlay);
    }
  }
  
  // Inicializar GameInitializer quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    window.gameInitializer = new GameInitializer();
    console.log("✅ Sistema de inicialização de jogo inicializado!");
  });