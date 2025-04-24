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
  myId: null,
  myIndex: -1,
  hasCalledUno: false,
  canPlay: false,
  hasDrewCard: false,
  gameLogRef: null,
  animationInProgress: false,
  soundEnabled: true,
  
  // Inicializar o jogo
  initGame(roomId, isHost) {
    this.roomId = roomId;
    this.isHost = isHost;
    this.myId = auth.currentUser.uid;
    
    // Carregar configurações de áudio
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    
    // Referência ao jogo no Firebase
    this.gameRef = database.ref(`games/${roomId}`);
    this.gameLogRef = database.ref(`gameLogs/${roomId}`);
    
    // Configurar listeners do jogo
    this.setupGameListeners();
    
    // Verificar se o jogo já está em andamento
    this.gameRef.once('value', snapshot => {
      const gameData = snapshot.val();
      if (gameData && gameData.gameStarted) {
        this.loadGameState(gameData);
      } else if (isHost) {
        document.getElementById('btn-start-game').classList.remove('hidden');
        document.getElementById('waiting-screen').classList.remove('hidden');
      } else {
        document.getElementById('waiting-screen').classList.remove('hidden');
        UI.showToast('Aguardando o host iniciar o jogo...', 'info');
      }
    });
    
    // Configurar event listeners para os controles do jogador
    this.setupPlayerControls();
    
    // Carregar sons do jogo
    this.loadSounds();
  },
  
  // Carregar sons do jogo
  loadSounds() {
    this.sounds = {
      cardPlace: new Audio('sounds/card_place.mp3'),
      cardDraw: new Audio('sounds/card_draw.mp3'),
      uno: new Audio('sounds/uno.mp3'),
      win: new Audio('sounds/win.mp3'),
      lose: new Audio('sounds/lose.mp3'),
      specialCard: new Audio('sounds/special_card.mp3'),
      notification: new Audio('sounds/notification.mp3')
    };
    
    // Ajustar volume
    const volume = localStorage.getItem('volume') || 50;
    const volumeValue = volume / 100;
    
    Object.values(this.sounds).forEach(sound => {
      sound.volume = volumeValue;
    });
  },
  
  // Tocar som
  playSound(soundName) {
    if (this.soundEnabled && this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch(error => {
        console.warn('Erro ao reproduzir som:', error);
      });
    }
  },

  // Carregar o estado atual do jogo
  loadGameState(gameData) {
    try {
      // Esconder tela de espera
      document.getElementById('waiting-screen').classList.add('hidden');
      
      // Mostrar tabuleiro do jogo
      document.getElementById('game-board').classList.remove('hidden');
      
      // Configurar variáveis do jogo
      this.gameStarted = gameData.gameStarted;
      this.currentPlayerIndex = gameData.currentPlayerIndex;
      this.direction = gameData.direction;
      this.drawCount = gameData.drawCount || 0;
      this.currentColor = gameData.currentColor;
      this.currentValue = gameData.currentValue;
      this.players = gameData.players || [];
      
      // Encontrar meu índice na lista de jogadores
      this.myIndex = this.players.findIndex(player => player.id === this.myId);
      
      // Atualizar a cor atual
      if (this.currentColor) {
        UI.updateCurrentColor(this.currentColor);
      }
      
      // Verificar se é minha vez
      this.canPlay = this.currentPlayerIndex === this.myIndex;
      
      // Renderizar jogadores oponentes
      this.renderOpponents();
      
      // Atualizar pilha de descarte
      if (gameData.discardPile && gameData.discardPile.length > 0) {
        const topCard = gameData.discardPile[gameData.discardPile.length - 1];
        UI.updateDiscardPile(topCard);
      }
      
      // Carregar minhas cartas
      this.loadPlayerCards();
      
      // Atualizar status do jogo
      this.updateGameStatus();
      
      // Atualizar elementos visuais (setas de direção, etc)
      this.updateGameDirection();
      
      // Verificar se o jogo acabou
      if (gameData.winner) {
        this.showGameOver(gameData.winner);
      }
    } catch (error) {
      console.error('Erro ao carregar estado do jogo:', error);
      UI.showToast('Erro ao carregar o jogo: ' + error.message, 'error');
    }
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
      
      // Mostrar indicador de carregamento
      UI.showToast('Iniciando jogo...', 'info');
      
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
      
      // Registrar início do jogo no log
      await this.gameLogRef.push({
        type: 'game_start',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        players: players.map(p => ({ id: p.id, name: p.name }))
      });
      
      // Esconder tela de espera
      document.getElementById('waiting-screen').classList.add('hidden');
      
      // Mostrar tabuleiro do jogo
      document.getElementById('game-board').classList.remove('hidden');
      
      UI.showToast('Jogo iniciado!', 'success');
      this.playSound('cardPlace');
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
      handSize: 7,
      uno: false,
      score: 0
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
    
    // Verificar se o modo No Mercy está ativo (chance rara de +99)
    database.ref(`rooms/${this.roomId}`).once('value', snapshot => {
      const room = snapshot.val();
      if (room && room.settings && room.settings.special99) {
        // Adicionar carta especial +99 com chance rara (1% ou 5% no modo No Mercy)
        const chance = room.settings.noMercy ? 0.05 : 0.01;
        if (Math.random() < chance) {
          deck.push({id: cardId++, type: 'wild-draw-99'});
          console.log('Carta +99 adicionada ao deck!');
        }
      }
    });
    
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

  // Carregar minhas cartas
  loadPlayerCards() {
    const cardsRef = database.ref(`rooms/${this.roomId}/players/${this.myId}/cards`);
    cardsRef.once('value', snapshot => {
      const cards = snapshot.val() || [];
      this.myCards = cards;
      
      // Limpar mão atual
      UI.clearPlayerHand();
      
      // Adicionar cada carta
      cards.forEach(card => {
        const cardElement = UI.addCardToPlayerHand(card);
        
        // Adicionar evento de clique
        if (cardElement) {
          cardElement.addEventListener('click', () => {
            this.handleCardClick(card);
          });
        }
      });
    });
  },

  // Configurar listeners do jogo
  setupGameListeners() {
    // Ouvir mudanças no estado do jogo
    this.gameRef.on('value', snapshot => {
      const gameData = snapshot.val();
      if (!gameData) return;
      
      // Atualizar estado do jogo apenas se já estiver inicializado
      if (this.gameStarted) {
        this.updateGameState(gameData);
      } else if (gameData.gameStarted) {
        // O jogo acabou de iniciar
        this.loadGameState(gameData);
      }
    });
    
    // Ouvir mudanças nas minhas cartas
    if (this.myId) {
      database.ref(`rooms/${this.roomId}/players/${this.myId}/cards`).on('value', snapshot => {
        const cards = snapshot.val() || [];
        
        // Atualizar minhas cartas apenas se mudaram
        if (JSON.stringify(cards) !== JSON.stringify(this.myCards)) {
          this.myCards = cards;
          
          // Limpar mão atual
          UI.clearPlayerHand();
          
          // Adicionar cada carta
          cards.forEach(card => {
            const cardElement = UI.addCardToPlayerHand(card);
            
            // Adicionar evento de clique
            if (cardElement) {
              cardElement.addEventListener('click', () => {
                this.handleCardClick(card);
              });
            }
          });
        }
      });
    }
    
    // Ouvir mudanças nos jogadores
    database.ref(`rooms/${this.roomId}/players`).on('value', snapshot => {
      const players = snapshot.val();
      if (!players) return;
      
      // Verificar se algum jogador saiu
      if (this.players && this.players.length > Object.keys(players).length) {
        // Jogador saiu, atualizar estado do jogo
        this.gameRef.once('value', snapshot => {
          const gameData = snapshot.val();
          if (gameData) {
            this.updateGameState(gameData);
          }
        });
      }
    });
    
    // Ouvir adições ao log de jogo
    this.gameLogRef.limitToLast(5).on('child_added', snapshot => {
      const logEntry = snapshot.val();
      if (!logEntry) return;
      
      // Mostrar evento do jogo
      switch (logEntry.type) {
        case 'play':
          if (logEntry.playerId !== this.myId) {
            const playerName = logEntry.playerName || 'Outro jogador';
            let cardDesc = '';
            
            if (logEntry.card) {
              if (logEntry.card.type === 'number') {
                cardDesc = `${logEntry.card.color} ${logEntry.card.value}`;
              } else if (logEntry.card.type === 'wild' || logEntry.card.type === 'wild-draw-four') {
                cardDesc = `${logEntry.card.type} (${logEntry.newColor})`;
              } else {
                cardDesc = `${logEntry.card.color} ${logEntry.card.type}`;
              }
            }
            
            UI.showToast(`${playerName} jogou ${cardDesc}`, 'info');
            this.playSound('cardPlace');
          }
          break;
          
        case 'draw':
          if (logEntry.playerId !== this.myId) {
            const playerName = logEntry.playerName || 'Outro jogador';
            UI.showToast(`${playerName} comprou ${logEntry.count} carta(s)`, 'info');
          }
          break;
          
        case 'uno':
          const playerName = logEntry.playerName || 'Jogador';
          UI.showToast(`${playerName} disse UNO!`, 'warning');
          this.playSound('uno');
          break;
          
        case 'caught':
          if (logEntry.playerId === this.myId) {
            UI.showToast(`Você foi pego sem dizer UNO! +2 cartas.`, 'error');
          } else {
            const playerName = logEntry.playerName || 'Outro jogador';
            const caughtName = logEntry.caughtName || 'Alguém';
            UI.showToast(`${playerName} pegou ${caughtName} sem dizer UNO!`, 'warning');
          }
          break;
      }
    });
  },

  // Atualizar o estado do jogo
  updateGameState(gameData) {
    // Atualizar variáveis do jogo
    this.currentPlayerIndex = gameData.currentPlayerIndex;
    this.direction = gameData.direction;
    this.drawCount = gameData.drawCount || 0;
    this.currentColor = gameData.currentColor;
    this.currentValue = gameData.currentValue;
    
    // Atualizar lista de jogadores se não estiver definida ou se o número mudou
    if (!this.players || this.players.length !== gameData.players.length) {
      this.players = gameData.players || [];
      
      // Encontrar meu índice na lista de jogadores
      this.myIndex = this.players.findIndex(player => player.id === this.myId);
      
      // Renderizar jogadores oponentes
      this.renderOpponents();
    } else {
      // Atualizar informações dos jogadores (tamanho da mão, etc)
      this.players = gameData.players || [];
      this.updateOpponentsInfo();
    }
    
    // Atualizar a cor atual
    if (this.currentColor) {
      UI.updateCurrentColor(this.currentColor);
    }
    
    // Verificar se é minha vez
    const isMyTurn = this.currentPlayerIndex === this.myIndex;
    if (isMyTurn !== this.canPlay) {
      this.canPlay = isMyTurn;
      this.hasDrewCard = false;
      
      if (isMyTurn) {
        this.playSound('notification');
        UI.showToast('É a sua vez!', 'success');
      }
    }
    
    // Atualizar pilha de descarte
    if (gameData.discardPile && gameData.discardPile.length > 0) {
      const topCard = gameData.discardPile[gameData.discardPile.length - 1];
      UI.updateDiscardPile(topCard);
    }
    
    // Atualizar status do jogo
    this.updateGameStatus();
    
    // Atualizar direção do jogo
    this.updateGameDirection();
    
    // Verificar se o jogo acabou
    if (gameData.winner) {
      this.showGameOver(gameData.winner);
    }
  },

  // Renderizar jogadores oponentes
  renderOpponents() {
    const opponentsArea = document.querySelector('.opponents-area');
    if (!opponentsArea) return;
    
    // Limpar área de oponentes
    opponentsArea.innerHTML = '';
    
    // Skip se não houver jogadores
    if (!this.players || !this.players.length) return;
    
    // Calcular posições baseadas no número de oponentes
    const numOpponents = this.players.length - 1; // excluindo o próprio jogador
    
    // Definir classes para posicionamento baseado no número de oponentes
    let positionClasses;
    switch (numOpponents) {
      case 1:
        positionClasses = ['opponent-top'];
        break;
      case 2:
        positionClasses = ['opponent-left', 'opponent-right'];
        break;
      case 3:
        positionClasses = ['opponent-left', 'opponent-top', 'opponent-right'];
        break;
      case 4:
        positionClasses = ['opponent-left', 'opponent-top-left', 'opponent-top-right', 'opponent-right'];
        break;
      case 5:
        positionClasses = ['opponent-left', 'opponent-top-left', 'opponent-top', 'opponent-top-right', 'opponent-right'];
        break;
      default:
        positionClasses = Array(numOpponents).fill('opponent-top');
    }
    
    // Criar elemento para cada oponente na ordem correta baseada na minha posição
    let opponentIndex = 0;
    for (let i = 0; i < this.players.length; i++) {
      // Calcular o índice real no array de jogadores (circular)
      const playerIdx = (this.myIndex + i) % this.players.length;
      const player = this.players[playerIdx];
      
      // Pular o próprio jogador
      if (player.id === this.myId) continue;
      
      // Criar elemento do oponente
      const opponentElement = document.createElement('div');
      opponentElement.className = `opponent ${positionClasses[opponentIndex]} ${this.currentPlayerIndex === playerIdx ? 'current-turn' : ''}`;
      opponentElement.dataset.playerId = player.id;
      
      let avatarSrc;
      if (player.avatar) {
        avatarSrc = player.avatar;
      } else {
        const seed = player.avatarSeed || player.id;
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
      
      opponentElement.innerHTML = `
        <div class="opponent-info">
          <div class="opponent-avatar">
            <img src="${avatarSrc}" alt="${player.name}">
          </div>
          <div class="opponent-name">${player.name}</div>
        </div>
        <div class="opponent-cards">
          ${Array(player.handSize || 0).fill('<div class="uno-card back mini"></div>').join('')}
        </div>
      `;
      
      // Adicionar badge de UNO se aplicável
      if (player.uno) {
        const unoBadge = document.createElement('div');
        unoBadge.className = 'uno-badge';
        unoBadge.textContent = 'UNO!';
        opponentElement.appendChild(unoBadge);
      }
      
      opponentsArea.appendChild(opponentElement);
      opponentIndex++;
    }
  },

  // Atualizar informações dos oponentes
  updateOpponentsInfo() {
    // Skip se não houver jogadores
    if (!this.players || !this.players.length) return;
    
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      
      // Pular o próprio jogador
      if (player.id === this.myId) continue;
      
      // Encontrar elemento do oponente
      const opponentElement = document.querySelector(`.opponent[data-player-id="${player.id}"]`);
      if (!opponentElement) continue;
      
      // Atualizar status de turno atual
      if (this.currentPlayerIndex === i) {
        opponentElement.classList.add('current-turn');
      } else {
        opponentElement.classList.remove('current-turn');
      }
      
      // Atualizar cartas
      const cardsContainer = opponentElement.querySelector('.opponent-cards');
      if (cardsContainer) {
        cardsContainer.innerHTML = Array(player.handSize || 0).fill('<div class="uno-card back mini"></div>').join('');
      }
      
      // Atualizar badge de UNO
      let unoBadge = opponentElement.querySelector('.uno-badge');
      if (player.uno) {
        if (!unoBadge) {
          unoBadge = document.createElement('div');
          unoBadge.className = 'uno-badge';
          unoBadge.textContent = 'UNO!';
          opponentElement.appendChild(unoBadge);
        }
      } else if (unoBadge) {
        unoBadge.remove();
      }
    }
  },

  // Atualizar direção do jogo visualmente
  updateGameDirection() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;
    
    if (this.direction === 1) {
      gameBoard.classList.remove('reverse');
    } else {
      gameBoard.classList.add('reverse');
    }
  },

  // Atualizar status do jogo
  updateGameStatus() {
    let statusText = '';
    
    if (this.canPlay) {
      if (this.drawCount > 0) {
        statusText = `É sua vez! Você deve comprar ${this.drawCount} cartas ou jogar uma carta +${this.drawCount > 4 ? 4 : 2}.`;
      } else {
        statusText = 'É sua vez! Jogue uma carta ou compre do monte.';
      }
    } else if (this.currentPlayerIndex >= 0 && this.players[this.currentPlayerIndex]) {
      statusText = `Vez de ${this.players[this.currentPlayerIndex].name}...`;
    } else {
      statusText = 'Aguardando...';
    }
    
    UI.updateGameStatus(statusText);
    
    // Atualizar botões de controle
    const btnDraw = document.getElementById('btn-draw');
    const btnPass = document.getElementById('btn-pass');
    const btnUno = document.getElementById('btn-uno');
    
    if (btnDraw) btnDraw.disabled = !this.canPlay;
    if (btnPass) btnPass.disabled = !this.canPlay || !this.hasDrewCard;
    if (btnUno) btnUno.disabled = this.myCards.length !== 1;
  },

  // Configurar controles do jogador
  setupPlayerControls() {
    // Botão de comprar carta
    const btnDraw = document.getElementById('btn-draw');
    if (btnDraw) {
      btnDraw.addEventListener('click', () => {
        this.drawCard();
      });
    }
    
    // Botão de passar vez (após comprar)
    const btnPass = document.getElementById('btn-pass');
    if (btnPass) {
      btnPass.addEventListener('click', () => {
        this.passTurn();
      });
    }
    
    // Botão de dizer UNO
    const btnUno = document.getElementById('btn-uno');
    if (btnUno) {
      btnUno.addEventListener('click', () => {
        this.callUno();
      });
    }
    
    // Configurar modal de escolha de cor
    const colorPicker = document.getElementById('color-picker-modal');
    if (colorPicker) {
      const colorOptions = colorPicker.querySelectorAll('.color-option');
      colorOptions.forEach(option => {
        option.addEventListener('click', () => {
          const color = option.getAttribute('data-color');
          this.chooseWildColor(color);
        });
      });
    }
  },

  // Manipular clique em uma carta
  handleCardClick(card) {
    // Verificar se é a vez do jogador
    if (!this.canPlay) {
      UI.showToast('Não é a sua vez!', 'error');
      return;
    }
    
    // Verificar se a carta pode ser jogada
    if (!this.canPlayCard(card)) {
      UI.showToast('Não é possível jogar esta carta!', 'error');
      return;
    }
    
    // Cartas Wild e Wild Draw Four precisam que o jogador escolha uma cor
    if (card.type === 'wild' || card.type === 'wild-draw-four' || card.type === 'wild-draw-99') {
      // Armazenar a carta selecionada temporariamente
      this.selectedCard = card;
      
      // Mostrar modal de escolha de cor
      UI.showModal(UI.elements.colorPickerModal);
      return;
    }
    
    // Jogar a carta
    this.playCard(card);
  },

  // Verificar se uma carta pode ser jogada
  canPlayCard(card) {
    // Se há um acúmulo de Draw (Draw Two/Draw Four), só pode jogar outra Draw
    if (this.drawCount > 0) {
      // Permitir jogar +2 em cima de +2 ou +4 em cima de qualquer acúmulo
      if (this.currentValue === '+2' && card.type === 'draw-two') {
        return true;
      }
      
      if (card.type === 'wild-draw-four') {
        return true;
      }
      
      if (card.type === 'wild-draw-99') {
        return true;
      }
      
      return false;
    }
    
    // Cartas Wild podem ser jogadas em qualquer situação
    if (card.type === 'wild' || card.type === 'wild-draw-four' || card.type === 'wild-draw-99') {
      // Para Wild Draw Four, tecnicamente o jogador não deve ter carta da cor atual
      // Mas vamos permitir na implementação digital e confiar no jogador
      return true;
    }
    
    // Verificar se a cor ou valor combina
    return card.color === this.currentColor || 
           (card.type === 'number' && card.value === this.currentValue) ||
           (card.type === this.currentValue);
  },

  // Jogar uma carta
  async playCard(card) {
    try {
      // Desabilitar interação durante a jogada
      this.canPlay = false;
      
      // Remover a carta da mão do jogador
      const cardIndex = this.myCards.findIndex(c => c.id === card.id);
      if (cardIndex === -1) {
        UI.showToast('Carta não encontrada na mão!', 'error');
        this.canPlay = true;
        return;
      }
      
      // Determinar se precisa chamar UNO
      const needsUno = this.myCards.length === 2;
      
      // Remover a carta da mão
      this.myCards.splice(cardIndex, 1);
      
      // Tocar som
      if (card.type === 'number') {
        this.playSound('cardPlace');
      } else {
        this.playSound('specialCard');
      }
      
      // Atualizar cartas no Firebase
      await database.ref(`rooms/${this.roomId}/players/${this.myId}/cards`).set(this.myCards);
      await database.ref(`rooms/${this.roomId}/players/${this.myId}/handSize`).set(this.myCards.length);
      
      // Verificar se o jogador chamou UNO
      if (needsUno && !this.hasCalledUno) {
        // Definir flag UNO como false
        await database.ref(`rooms/${this.roomId}/players/${this.myId}/uno`).set(false);
      }
      
      // Obter estado atual do jogo
      const gameSnapshot = await this.gameRef.once('value');
      const gameData = gameSnapshot.val();
      
      if (!gameData) {
        UI.showToast('Erro ao obter estado do jogo!', 'error');
        this.canPlay = true;
        return;
      }
      
      // Criar cópia do estado do jogo
      const updatedGameData = { ...gameData };
      
      // Adicionar carta ao topo da pilha de descarte
      updatedGameData.discardPile = [...(updatedGameData.discardPile || []), card];
      
      // Atualizar cor e valor atual
      updatedGameData.currentColor = card.color || updatedGameData.currentColor;
      updatedGameData.currentValue = card.type === 'number' ? card.value : card.type;
      
      // Processar efeitos da carta
      let nextPlayerIndex = this.getNextPlayerIndex(updatedGameData);
      
      switch (card.type) {
        case 'skip':
          // O próximo jogador é pulado
          nextPlayerIndex = this.getNextPlayerIndex(updatedGameData, nextPlayerIndex);
          break;
          
        case 'reverse':
          // Inverter a direção do jogo
          updatedGameData.direction = -updatedGameData.direction;
          
          // Se houver apenas dois jogadores, Reverse age como Skip
          if (this.players.length === 2) {
            nextPlayerIndex = this.currentPlayerIndex;
          } else {
            nextPlayerIndex = this.getPreviousPlayerIndex(updatedGameData);
          }
          break;
          
        case 'draw-two':
          // Adicionar +2 ao acúmulo
          updatedGameData.drawCount = (updatedGameData.drawCount || 0) + 2;
          break;
          
        case 'wild-draw-four':
          // Adicionar +4 ao acúmulo
          updatedGameData.drawCount = (updatedGameData.drawCount || 0) + 4;
          break;
          
        case 'wild-draw-99':
          // Adicionar +99 ao acúmulo (carta especial)
          updatedGameData.drawCount = (updatedGameData.drawCount || 0) + 99;
          break;
      }
      
      // Verificar se o jogador venceu
      if (this.myCards.length === 0) {
        updatedGameData.winner = {
          id: this.myId,
          name: auth.currentUser.displayName || 'Jogador',
          avatar: localStorage.getItem('avatarURL'),
          avatarSeed: localStorage.getItem('avatar')
        };
        
        updatedGameData.gameEnded = true;
        updatedGameData.endedAt = firebase.database.ServerValue.TIMESTAMP;
        
        // Registrar vitória no perfil do jogador
        this.recordGameWin();
      } else {
        // Atualizar índice do próximo jogador
        updatedGameData.currentPlayerIndex = nextPlayerIndex;
      }
      
      // Atualizar timestamp
      updatedGameData.updatedAt = firebase.database.ServerValue.TIMESTAMP;
      
      // Salvar estado atualizado
      await this.gameRef.update(updatedGameData);
      
      // Adicionar entrada ao log
      await this.gameLogRef.push({
        type: 'play',
        playerId: this.myId,
        playerName: auth.currentUser.displayName || 'Jogador',
        card: card,
        newColor: card.color,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Se era uma carta de +2 ou +4, adicionar entrada de log
      if (card.type === 'draw-two' || card.type === 'wild-draw-four' || card.type === 'wild-draw-99') {
        const drawAmount = card.type === 'draw-two' ? 2 : (card.type === 'wild-draw-four' ? 4 : 99);
        
        await this.gameLogRef.push({
          type: 'draw_added',
          playerId: this.myId,
          playerName: auth.currentUser.displayName || 'Jogador',
          amount: drawAmount,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
      }
      
    } catch (error) {
      console.error('Erro ao jogar carta:', error);
      UI.showToast('Erro ao jogar carta: ' + error.message, 'error');
    } finally {
      // Restaurar interação
      this.canPlay = this.currentPlayerIndex === this.myIndex;
      
      // Resetar flag de UNO para a próxima jogada
      this.hasCalledUno = false;
    }
  },

  // Escolher cor para cartas Wild
  async chooseWildColor(color) {
    try {
      // Fechar modal
      UI.closeModal(UI.elements.colorPickerModal);
      
      if (!this.selectedCard) return;
      
      // Definir cor da carta Wild
      const wildCard = { ...this.selectedCard, color };
      
      // Jogar a carta agora com a cor escolhida
      await this.playCard(wildCard);
      
      // Adicionar entrada ao log
      await this.gameLogRef.push({
        type: 'wild_color',
        playerId: this.myId,
        playerName: auth.currentUser.displayName || 'Jogador',
        color: color,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Limpar carta selecionada
      this.selectedCard = null;
    } catch (error) {
      console.error('Erro ao escolher cor:', error);
      UI.showToast('Erro ao escolher cor: ' + error.message, 'error');
    }
  },

  // Comprar uma carta
  async drawCard() {
    try {
      // Verificar se é a vez do jogador
      if (!this.canPlay) {
        UI.showToast('Não é a sua vez!', 'error');
        return;
      }
      
      // Obter estado atual do jogo
      const gameSnapshot = await this.gameRef.once('value');
      const gameData = gameSnapshot.val();
      
      if (!gameData) {
        UI.showToast('Erro ao obter estado do jogo!', 'error');
        return;
      }
      
      // Criar cópia do estado do jogo
      const updatedGameData = { ...gameData };
      
      // Número de cartas a comprar
      const drawAmount = this.drawCount > 0 ? this.drawCount : 1;
      
      // Verificar se há cartas suficientes no baralho
      let deck = updatedGameData.deck || [];
      let discardPile = updatedGameData.discardPile || [];
      
      // Se o baralho estiver quase vazio, reembaralhar a pilha de descarte
      if (deck.length < drawAmount) {
        // Manter a carta do topo da pilha de descarte
        const topCard = discardPile.pop();
        
        // Embaralhar o resto da pilha de descarte e adicionar ao baralho
        deck = [...deck, ...this.shuffleArray(discardPile)];
        
        // Restaurar a pilha de descarte apenas com a carta do topo
        discardPile = [topCard];
        
        // Atualizar no estado do jogo
        updatedGameData.deck = deck;
        updatedGameData.discardPile = discardPile;
      }
      
      // Comprar cartas
      const drawnCards = [];
      for (let i = 0; i < drawAmount; i++) {
        if (deck.length > 0) {
          drawnCards.push(deck.pop());
        }
      }
      
      // Atualizar baralho
      updatedGameData.deck = deck;
      
      // Adicionar as cartas à mão do jogador
      const updatedHand = [...this.myCards, ...drawnCards];
      
      // Tocar som
      this.playSound('cardDraw');
      
      // Resetar acúmulo de Draw se aplicável
      if (this.drawCount > 0) {
        updatedGameData.drawCount = 0;
        updatedGameData.currentPlayerIndex = this.getNextPlayerIndex(updatedGameData);
      } else {
        // Se comprou apenas uma carta voluntariamente, marcar que comprou
        this.hasDrewCard = true;
      }
      
      // Atualizar timestamp
      updatedGameData.updatedAt = firebase.database.ServerValue.TIMESTAMP;
      
      // Salvar estado atualizado do jogo
      await this.gameRef.update(updatedGameData);
      
      // Atualizar cartas do jogador
      await database.ref(`rooms/${this.roomId}/players/${this.myId}/cards`).set(updatedHand);
      await database.ref(`rooms/${this.roomId}/players/${this.myId}/handSize`).set(updatedHand.length);
      
      // Adicionar entrada ao log
      await this.gameLogRef.push({
        type: 'draw',
        playerId: this.myId,
        playerName: auth.currentUser.displayName || 'Jogador',
        count: drawAmount,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      UI.showToast(`Você comprou ${drawAmount} carta(s)!`, 'info');
      
      // Atualizar controles do jogador
      this.updateGameStatus();
      
      // Atualizar mão do jogador
      this.myCards = updatedHand;
    } catch (error) {
      console.error('Erro ao comprar carta:', error);
      UI.showToast('Erro ao comprar carta: ' + error.message, 'error');
    }
  },

  // Passar a vez (após comprar uma carta)
  async passTurn() {
    try {
      // Verificar se é a vez do jogador
      if (!this.canPlay) {
        UI.showToast('Não é a sua vez!', 'error');
        return;
      }
      
      // Verificar se o jogador comprou uma carta
      if (!this.hasDrewCard) {
        UI.showToast('Você precisa comprar uma carta antes de passar!', 'error');
        return;
      }
      
      // Obter estado atual do jogo
      const gameSnapshot = await this.gameRef.once('value');
      const gameData = gameSnapshot.val();
      
      if (!gameData) {
        UI.showToast('Erro ao obter estado do jogo!', 'error');
        return;
      }
      
      // Criar cópia do estado do jogo
      const updatedGameData = { ...gameData };
      
      // Atualizar índice do próximo jogador
      updatedGameData.currentPlayerIndex = this.getNextPlayerIndex(updatedGameData);
      
      // Atualizar timestamp
      updatedGameData.updatedAt = firebase.database.ServerValue.TIMESTAMP;
      
      // Salvar estado atualizado
      await this.gameRef.update(updatedGameData);
      
      // Adicionar entrada ao log
      await this.gameLogRef.push({
        type: 'pass',
        playerId: this.myId,
        playerName: auth.currentUser.displayName || 'Jogador',
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      UI.showToast('Você passou a vez!', 'info');
      
      // Resetar flag de compra
      this.hasDrewCard = false;
    } catch (error) {
      console.error('Erro ao passar a vez:', error);
      UI.showToast('Erro ao passar a vez: ' + error.message, 'error');
    }
  },

  // Chamar "UNO!"
  async callUno() {
    try {
      // Verificar se o jogador tem apenas uma carta
      if (this.myCards.length !== 1) {
        UI.showToast('Você só pode dizer UNO quando tem uma carta!', 'error');
        return;
      }
      
      // Marcar que o jogador chamou UNO
      this.hasCalledUno = true;
      
      // Atualizar flag UNO no Firebase
      await database.ref(`rooms/${this.roomId}/players/${this.myId}/uno`).set(true);
      
      // Adicionar entrada ao log
      await this.gameLogRef.push({
        type: 'uno',
        playerId: this.myId,
        playerName: auth.currentUser.displayName || 'Jogador',
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Tocar som
      this.playSound('uno');
      
      UI.showToast('Você disse UNO!', 'success');
    } catch (error) {
      console.error('Erro ao chamar UNO:', error);
      UI.showToast('Erro ao chamar UNO: ' + error.message, 'error');
    }
  },

  // Pegar jogador que não chamou UNO
  async catchUno(playerId) {
    try {
      // Verificar se o jogador tem apenas uma carta e não chamou UNO
      const playerRef = database.ref(`rooms/${this.roomId}/players/${playerId}`);
      const playerSnapshot = await playerRef.once('value');
      const player = playerSnapshot.val();
      
      if (!player) {
        UI.showToast('Jogador não encontrado!', 'error');
        return;
      }
      
      // Verificar se o jogador tem apenas uma carta e não chamou UNO
      if (player.handSize === 1 && player.uno === false) {
        // Obter estado atual do jogo
        const gameSnapshot = await this.gameRef.once('value');
        const gameData = gameSnapshot.val();
        
        if (!gameData) {
          UI.showToast('Erro ao obter estado do jogo!', 'error');
          return;
        }
        
        // Criar cópia do estado do jogo
        const updatedGameData = { ...gameData };
        
        // Verificar se há cartas suficientes no baralho
        let deck = updatedGameData.deck || [];
        let discardPile = updatedGameData.discardPile || [];
        
        // Se o baralho estiver quase vazio, reembaralhar a pilha de descarte
        if (deck.length < 2) {
          // Manter a carta do topo da pilha de descarte
          const topCard = discardPile.pop();
          
          // Embaralhar o resto da pilha de descarte e adicionar ao baralho
          deck = [...deck, ...this.shuffleArray(discardPile)];
          
          // Restaurar a pilha de descarte apenas com a carta do topo
          discardPile = [topCard];
          
          // Atualizar no estado do jogo
          updatedGameData.deck = deck;
          updatedGameData.discardPile = discardPile;
        }
        
        // Comprar 2 cartas como penalidade
        const drawnCards = [];
        for (let i = 0; i < 2; i++) {
          if (deck.length > 0) {
            drawnCards.push(deck.pop());
          }
        }
        
        // Atualizar baralho
        updatedGameData.deck = deck;
        
        // Obter cartas atuais do jogador
        const playerCardsSnapshot = await database.ref(`rooms/${this.roomId}/players/${playerId}/cards`).once('value');
        const playerCards = playerCardsSnapshot.val() || [];
        
        // Adicionar as cartas à mão do jogador
        const updatedHand = [...playerCards, ...drawnCards];
        
        // Atualizar cartas do jogador
        await database.ref(`rooms/${this.roomId}/players/${playerId}/cards`).set(updatedHand);
        await database.ref(`rooms/${this.roomId}/players/${playerId}/handSize`).set(updatedHand.length);
        await database.ref(`rooms/${this.roomId}/players/${playerId}/uno`).set(false);
        
        // Salvar estado atualizado do jogo
        await this.gameRef.update(updatedGameData);
        
        // Adicionar entrada ao log
        await this.gameLogRef.push({
          type: 'caught',
          playerId: this.myId,
          playerName: auth.currentUser.displayName || 'Jogador',
          caughtId: playerId,
          caughtName: player.name,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        UI.showToast(`Você pegou ${player.name} sem dizer UNO! +2 cartas para ele.`, 'success');
        
        // Registrar estatística
        const catchStatsRef = database.ref(`users/${this.myId}/stats/unosCaught`);
        catchStatsRef.transaction(current => (current || 0) + 1);
      } else {
        UI.showToast('Este jogador não pode ser pego!', 'error');
      }
    } catch (error) {
      console.error('Erro ao pegar UNO:', error);
      UI.showToast('Erro ao pegar UNO: ' + error.message, 'error');
    }
  },

  // Obter índice do próximo jogador
  getNextPlayerIndex(gameData, currentIndex = null) {
    const currentPlayerIndex = currentIndex !== null ? currentIndex : gameData.currentPlayerIndex;
    const direction = gameData.direction || 1;
    const playersCount = gameData.players ? gameData.players.length : 0;
    
    // Calcular próximo índice considerando a direção
    return (currentPlayerIndex + direction + playersCount) % playersCount;
  },

  // Obter índice do jogador anterior
  getPreviousPlayerIndex(gameData) {
    const currentPlayerIndex = gameData.currentPlayerIndex;
    const direction = -(gameData.direction || 1);  // Inverter a direção
    const playersCount = gameData.players ? gameData.players.length : 0;
    
    // Calcular índice anterior considerando a direção
    return (currentPlayerIndex + direction + playersCount) % playersCount;
  },

  // Mostrar tela de fim de jogo
  showGameOver(winner) {
    // Verificar se o modal de fim de jogo existe
    const gameOverModal = document.getElementById('game-over-modal');
    if (!gameOverModal) return;
    
    // Atualizar informações do vencedor
    const winnerAvatarImg = document.getElementById('winner-avatar-img');
    const winnerName = document.getElementById('winner-name');
    
    if (winnerAvatarImg && winnerName) {
      let avatarSrc;
      if (winner.avatar) {
        avatarSrc = winner.avatar;
      } else {
        const seed = winner.avatarSeed || winner.id;
        avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
      
      winnerAvatarImg.src = avatarSrc;
      winnerName.textContent = winner.name;
    }
    
    // Tocar som de vitória ou derrota
    if (winner.id === this.myId) {
      this.playSound('win');
    } else {
      this.playSound('lose');
    }
    
    // Calcular estatísticas do jogo
    database.ref(`rooms/${this.roomId}/players`).once('value', snapshot => {
      const players = snapshot.val();
      if (!players) return;
      
      const gameStats = document.getElementById('game-stats');
      if (gameStats) {
        gameStats.innerHTML = '';
        
        // Criar tabela de estatísticas
        const statsTable = document.createElement('table');
        statsTable.className = 'stats-table';
        
        // Cabeçalho
        const tableHead = document.createElement('thead');
        tableHead.innerHTML = `
          <tr>
            <th>Jogador</th>
            <th>Cartas</th>
            <th>Pontos</th>
          </tr>
        `;
        statsTable.appendChild(tableHead);
        
        // Corpo
        const tableBody = document.createElement('tbody');
        
        // Calcular pontuação (cartas restantes)
        let playerStats = [];
        
        Object.values(players).forEach(player => {
          const cards = player.cards || [];
          const points = cards.reduce((total, card) => {
            if (card.type === 'number') {
              return total + card.value;
            } else if (card.type === 'wild' || card.type === 'wild-draw-four') {
              return total + 50;
            } else {
              return total + 20;
            }
          }, 0);
          
          playerStats.push({
            id: player.id,
            name: player.name,
            cardsCount: cards.length,
            points: points
          });
        });
        
        // Ordenar por pontos (menor é melhor)
        playerStats.sort((a, b) => a.points - b.points);
        
        // Adicionar cada jogador
        playerStats.forEach(player => {
          const row = document.createElement('tr');
          row.className = player.id === winner.id ? 'winner-row' : '';
          
          row.innerHTML = `
            <td>${player.name} ${player.id === this.myId ? '(Você)' : ''}</td>
            <td>${player.cardsCount}</td>
            <td>${player.points}</td>
          `;
          
          tableBody.appendChild(row);
        });
        
        statsTable.appendChild(tableBody);
        gameStats.appendChild(statsTable);
      }
    });
    
    // Configurar botões de ação
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnExitGame = document.getElementById('btn-exit-game');
    
    if (btnPlayAgain) {
      btnPlayAgain.onclick = () => {
        if (this.isHost) {
          this.resetGame();
        } else {
          UI.showToast('Aguardando o host iniciar um novo jogo...', 'info');
        }
        UI.closeModal(gameOverModal);
      };
    }
    
    if (btnExitGame) {
      btnExitGame.onclick = () => {
        UI.closeModal(gameOverModal);
        Room.leaveRoom().then(() => {
          window.location.href = 'lobby.html';
        });
      };
    }
    
    // Mostrar modal
    UI.showModal(gameOverModal);
  },

  // Reiniciar jogo
  async resetGame() {
    if (!this.isHost) {
      UI.showToast('Apenas o host pode reiniciar o jogo!', 'error');
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
      
      // Adicionar entrada ao log do jogo
      await this.gameLogRef.push({
        type: 'game_restart',
        playerId: this.myId,
        playerName: auth.currentUser.displayName || 'Jogador',
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      UI.showToast('Novo jogo iniciado!', 'success');
    } catch (error) {
      console.error('Erro ao reiniciar jogo:', error);
      UI.showToast('Erro ao reiniciar jogo: ' + error.message, 'error');
    }
  },

  // Registrar vitória no perfil do jogador
  async recordGameWin() {
    try {
      if (!auth.currentUser) return;
      
      // Referência para o perfil do usuário
      const userStatsRef = database.ref(`users/${this.myId}/stats`);
      
      // Atualizar estatísticas
      userStatsRef.transaction(stats => {
        stats = stats || {};
        stats.wins = (stats.wins || 0) + 1;
        stats.totalGames = (stats.totalGames || 0) + 1;
        stats.lastWinAt = firebase.database.ServerValue.TIMESTAMP;
        
        return stats;
      });
      
      // Adicionar pontuação (100 pontos por vitória)
      const scoreRef = database.ref(`users/${this.myId}/score`);
      scoreRef.transaction(score => (score || 0) + 100);
      
      // Verificar conquistas
      this.checkAchievements();
      
    } catch (error) {
      console.error('Erro ao registrar vitória:', error);
    }
  },

  // Verificar conquistas do jogador
  async checkAchievements() {
    try {
      const userStatsRef = database.ref(`users/${this.myId}/stats`);
      const userStatsSnapshot = await userStatsRef.once('value');
      const stats = userStatsSnapshot.val() || {};
      
      const achievements = [];
      
      // Verificar conquistas baseadas nas estatísticas
      if ((stats.wins || 0) >= 1) {
        achievements.push({
          id: 'first_win',
          title: 'Primeira Vitória',
          description: 'Venceu seu primeiro jogo!',
          icon: 'trophy'
        });
      }
      
      if ((stats.wins || 0) >= 5) {
        achievements.push({
          id: 'five_wins',
          title: 'Campeão Iniciante',
          description: 'Venceu 5 jogos!',
          icon: 'medal'
        });
      }
      
      // Salvar conquistas obtidas
      for (const achievement of achievements) {
        const achievementRef = database.ref(`users/${this.myId}/achievements/${achievement.id}`);
        const existingAchievement = await achievementRef.once('value');
        
        if (!existingAchievement.exists()) {
          await achievementRef.set({
            ...achievement,
            obtainedAt: firebase.database.ServerValue.TIMESTAMP
          });
          
          // Mostrar notificação
          UI.showToast(`Conquista desbloqueada: ${achievement.title}!`, 'success');
          
          // Adicionar moedas como recompensa
          const coinsRef = database.ref(`users/${this.myId}/coins`);
          coinsRef.transaction(coins => (coins || 0) + 50);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  },

  // Limpar listeners quando sair do jogo
  cleanup() {
    if (this.gameRef) {
      this.gameRef.off();
    }
    
    if (this.gameLogRef) {
      this.gameLogRef.off();
    }
    
    if (this.myId) {
      database.ref(`rooms/${this.roomId}/players/${this.myId}/cards`).off();
    }
    
    clearInterval(this.presenceInterval);
  }
};