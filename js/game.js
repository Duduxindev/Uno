// Game Logic
class UnoGame {
  constructor(roomCode, gameMode = 'classic') {
    this.roomCode = roomCode;
    this.gameMode = gameMode;
    this.players = {};
    this.currentPlayer = null;
    this.direction = 1; // 1 = clockwise, -1 = counterclockwise
    this.drawPile = [];
    this.discardPile = [];
    this.currentColor = null;
    this.gameStatus = 'waiting'; // waiting, playing, finished
    this.winner = null;
    this.skipTurn = false;
    this.awaitingColorChoice = false;
    
    // Listeners
    this.roomRef = null;
    this.gameRef = null;
    this.playerRef = null;
    
    // Referência ao usuário atual
    this.currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    
    this.initialize();
  }
  
  async initialize() {
    try {
      // Referenciar sala no Firebase
      this.roomRef = database.ref(`rooms/${this.roomCode}`);
      this.gameRef = database.ref(`rooms/${this.roomCode}/game`);
      this.playerRef = database.ref(`rooms/${this.roomCode}/players/${this.currentUserId}`);
      
      // Configurar listeners
      this.setupGameListeners();
      
      // Carregar dados iniciais do jogo
      await this.loadGameData();
    } catch (error) {
      console.error('Erro ao inicializar jogo:', error);
      UI.showToast('Erro ao inicializar jogo: ' + error.message, 'error');
    }
  }
  
  async loadGameData() {
    try {
      const roomSnapshot = await this.roomRef.once('value');
      const roomData = roomSnapshot.val();
      
      if (!roomData) {
        throw new Error('Sala não encontrada');
      }
      
      // Atualizar dados da sala
      this.players = roomData.players || {};
      this.gameStatus = roomData.status || 'waiting';
      this.gameMode = roomData.gameMode || 'classic';
      
      // Se o jogo estiver em andamento, carregar dados do jogo
      if (this.gameStatus === 'playing' && roomData.game) {
        this.currentPlayer = roomData.game.currentPlayer;
        this.direction = roomData.game.direction;
        this.drawPile = roomData.game.drawPile;
        this.discardPile = roomData.game.discardPile;
        this.currentColor = roomData.game.currentColor;
        this.skipTurn = roomData.game.skipTurn || false;
        this.awaitingColorChoice = roomData.game.awaitingColorChoice || false;
      }
      
      // Renderizar UI inicial
      this.updateUI();
    } catch (error) {
      console.error('Erro ao carregar dados do jogo:', error);
      UI.showToast('Erro ao carregar dados do jogo: ' + error.message, 'error');
    }
  }
  
  setupGameListeners() {
    // Ouvir mudanças na sala
    this.roomRef.on('value', (snapshot) => {
      const roomData = snapshot.val();
      
      if (!roomData) {
        // Sala foi removida
        UI.showToast('A sala foi encerrada pelo host', 'warning');
        window.location.href = 'lobby.html';
        return;
      }
      
      // Atualizar dados da sala
      this.players = roomData.players || {};
      this.gameStatus = roomData.status || 'waiting';
      
      // Verificar se o jogo começou
      if (this.gameStatus === 'playing' && roomData.game) {
        if (!this.isGameStarted) {
          this.isGameStarted = true;
          UI.showToast('O jogo começou!', 'success');
          UI.showSection('game-board');
        }
        
        // Atualizar dados do jogo
        this.currentPlayer = roomData.game.currentPlayer;
        this.direction = roomData.game.direction;
        this.drawPile = roomData.game.drawPile;
        this.discardPile = roomData.game.discardPile;
        this.currentColor = roomData.game.currentColor;
        this.skipTurn = roomData.game.skipTurn || false;
        this.awaitingColorChoice = roomData.game.awaitingColorChoice || false;
      }
      
      // Verificar se o jogo acabou
      if (this.gameStatus === 'finished' && roomData.game?.winner) {
        this.winner = roomData.game.winner;
        this.showGameResults(roomData.game.winner, roomData.game.score);
      }
      
      // Atualizar UI
      this.updateUI();
    });
    
    // Ouvir mudanças nas cartas do jogador atual
    if (this.currentUserId) {
      this.playerRef.on('value', (snapshot) => {
        const playerData = snapshot.val();
        if (playerData && playerData.cards) {
          this.updatePlayerHand(playerData.cards);
        }
      });
    }
    
    // Ouvir eventos do jogo
    this.gameRef.child('gameHistory').limitToLast(1).on('child_added', (snapshot) => {
      const event = snapshot.val();
      this.handleGameEvent(event);
    });
  }
  
  updateUI() {
    // Verificar estado do jogo
    if (this.gameStatus === 'waiting') {
      // Mostrar tela de espera
      UI.showSection('waiting-screen');
      
      // Renderizar lista de jogadores
      UI.renderPlayersList(this.players, this.currentPlayer);
      
      // Mostrar botão de iniciar apenas para o host
      const isHost = this.players[this.currentUserId]?.isHost || false;
      const btnStart = document.getElementById('btn-start-game');
      if (btnStart) {
        btnStart.style.display = isHost ? 'block' : 'none';
        
        // Habilitar botão apenas se tiver pelo menos 2 jogadores
        const playersCount = Object.keys(this.players).length;
        btnStart.disabled = playersCount < 2;
        
        if (playersCount < 2) {
          btnStart.title = 'É necessário pelo menos 2 jogadores para começar';
        } else {
          btnStart.title = 'Iniciar jogo';
        }
      }
    } else if (this.gameStatus === 'playing') {
      // Mostrar tela do jogo
      UI.showSection('game-board');
      
      // Atualizar mesa de jogo
      this.updateGameBoard();
      
      // Verificar se é a vez do jogador atual
      this.checkPlayerTurn();
    }
  }
  
  updateGameBoard() {
    // Verificar se temos todas as informações necessárias
    if (!this.discardPile || !this.currentColor) return;
    
    // Renderizar monte de descarte
    const topCard = this.discardPile[this.discardPile.length - 1];
    if (topCard) {
      UI.renderDiscardPile(topCard);
    }
    
    // Atualizar indicador de cor atual
    UI.updateCurrentColor(this.currentColor);
    
    // Renderizar oponentes
    UI.renderOpponents(this.players, this.currentUserId, this.currentPlayer);
    
    // Atualizar status do jogo
    if (this.currentPlayer === this.currentUserId) {
      UI.updateGameStatus('Sua vez de jogar!');
    } else if (this.players[this.currentPlayer]) {
      UI.updateGameStatus(`Vez de ${this.players[this.currentPlayer].name}`);
    }
    
    // Mostrar/esconder botão de UNO
    const btnUno = document.getElementById('btn-uno');
    if (btnUno) {
      const playerCards = this.players[this.currentUserId]?.cards || [];
      btnUno.disabled = playerCards.length !== 2; // Habilitado apenas quando o jogador tem 2 cartas
    }
    
    // Verificar se precisa escolher cor
    if (this.awaitingColorChoice && this.currentPlayer === this.currentUserId) {
      UI.showColorPicker();
    }
  }
  
  updatePlayerHand(cards = []) {
    // Verificar se temos as informações necessárias
    if (!cards || !this.discardPile || !this.currentColor) return;
    
    // Obter carta do topo
    const topCard = this.discardPile[this.discardPile.length - 1];
    
    // Renderizar mão do jogador
    UI.renderPlayerHand(cards, this.currentColor, topCard);
    
    // Adicionar event listeners às cartas
    this.setupCardListeners();
  }
  
  setupCardListeners() {
    const cardElements = document.querySelectorAll('#player-hand .uno-card');
    
    cardElements.forEach(card => {
      card.addEventListener('click', () => {
        // Verificar se é a vez do jogador
        if (this.currentPlayer !== this.currentUserId) {
          UI.showToast('Não é sua vez de jogar', 'warning');
          return;
        }
        
        // Verificar se a carta é jogável
        if (card.classList.contains('not-playable')) {
          UI.showToast('Esta carta não pode ser jogada agora', 'warning');
          return;
        }
        
        // Jogar a carta
        const cardIndex = parseInt(card.dataset.index);
        this.playCard(cardIndex);
      });
    });
  }
  
  async playCard(cardIndex) {
    try {
      // Chamar a função do Firebase Service
      await FirebaseService.game.playCard(this.roomCode, cardIndex);
      
      // A UI será atualizada automaticamente pelos listeners
    } catch (error) {
      console.error('Erro ao jogar carta:', error);
      UI.showToast('Erro ao jogar carta: ' + error.message, 'error');
    }
  }
  
  async drawCard() {
    try {
      // Verificar se é a vez do jogador
      if (this.currentPlayer !== this.currentUserId) {
        UI.showToast('Não é sua vez de jogar', 'warning');
        return;
      }
      
      // Chamar a função do Firebase Service
      await FirebaseService.game.drawCard(this.roomCode);
      
      // A UI será atualizada automaticamente pelos listeners
    } catch (error) {
      console.error('Erro ao comprar carta:', error);
      UI.showToast('Erro ao comprar carta: ' + error.message, 'error');
    }
  }
  
  async callUno() {
    try {
      // Chamar a função do Firebase Service
      await FirebaseService.game.callUno(this.roomCode);
      
      // Mostrar animação/efeito sonoro de UNO
      this.showUnoAnimation();
    } catch (error) {
      console.error('Erro ao chamar UNO:', error);
      UI.showToast('Erro ao chamar UNO: ' + error.message, 'error');
    }
  }
  
  async catchUno(targetPlayerId) {
    try {
      // Chamar a função do Firebase Service
      await FirebaseService.game.catchUno(this.roomCode, targetPlayerId);
      
      // A UI será atualizada automaticamente pelos listeners
    } catch (error) {
      console.error('Erro ao penalizar jogador:', error);
      UI.showToast('Erro ao penalizar jogador: ' + error.message, 'error');
    }
  }
  
  async chooseColor(color) {
    try {
      // Verificar se é a vez do jogador
      if (this.currentPlayer !== this.currentUserId) {
        UI.showToast('Não é sua vez de jogar', 'warning');
        return;
      }
      
      // Chamar a função do Firebase Service
      await FirebaseService.game.chooseColor(this.roomCode, color);
      
      // Fechar modal de escolha de cor
      UI.closeModal(document.getElementById('color-picker-modal'));
    } catch (error) {
      console.error('Erro ao escolher cor:', error);
      UI.showToast('Erro ao escolher cor: ' + error.message, 'error');
    }
  }
  
  checkPlayerTurn() {
    // Habilitar/desabilitar botões de ação com base na vez do jogador
    const isPlayerTurn = this.currentPlayer === this.currentUserId;
    
    const btnDraw = document.getElementById('btn-draw');
    if (btnDraw) {
      btnDraw.disabled = !isPlayerTurn;
    }
    
    const btnPass = document.getElementById('btn-pass');
    if (btnPass) {
      btnPass.disabled = !isPlayerTurn;
    }
    
    // Atualizar destaque do jogador atual
    UI.highlightCurrentPlayer(this.currentPlayer);
  }
  
  handleGameEvent(event) {
    // Processar eventos do jogo
    switch (event.type) {
      case 'gameStart':
        UI.showToast('O jogo começou!', 'success');
        break;
      
      case 'playCard':
        UI.showToast(`${event.playerName} jogou uma carta`, 'info');
        // Efeitos sonoros e animações
        this.playCardSound(event.card);
        break;
      
      case 'drawCard':
        if (event.playerId !== this.currentUserId) {
          UI.showToast(`${event.playerName} comprou uma carta`, 'info');
        }
        break;
      
      case 'callUno':
        UI.showToast(`${event.playerName} gritou UNO!`, 'warning');
        this.playUnoSound();
        break;
      
      case 'penaltyUno':
        UI.showToast(`${event.playerName} pegou ${event.targetPlayerName} sem dizer UNO! (+2 cartas)`, 'warning');
        break;
      
      case 'chooseColor':
        UI.showToast(`${event.playerName} escolheu a cor ${this.translateColor(event.color)}`, 'info');
        break;
      
      case 'gameEnd':
        UI.showToast(`${event.winnerName} venceu o jogo!`, 'success');
        break;
    }
  }
  
  translateColor(color) {
    const colors = {
      'red': 'vermelha',
      'blue': 'azul',
      'green': 'verde',
      'yellow': 'amarela'
    };
    
    return colors[color] || color;
  }
  
  showUnoAnimation() {
    const unoOverlay = document.createElement('div');
    unoOverlay.className = 'uno-overlay';
    unoOverlay.innerHTML = '<div class="uno-text">UNO!</div>';
    
    document.body.appendChild(unoOverlay);
    
    setTimeout(() => {
      unoOverlay.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      unoOverlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(unoOverlay);
      }, 500);
    }, 1500);
  }
  
  showGameResults(winner, score) {
    // Mostrar modal de fim de jogo
    UI.showGameOver(winner, score);
  }
  
  playCardSound(card) {
    let sound = new Audio();
    
    if (card.type === 'action' && card.value === 'skip') {
      sound.src = 'sounds/skip.mp3';
    } else if (card.type === 'action' && card.value === 'reverse') {
      sound.src = 'sounds/reverse.mp3';
    } else if (card.type === 'action' && card.value === 'draw-two') {
      sound.src = 'sounds/draw-two.mp3';
    } else if (card.type === 'wild') {
      sound.src = 'sounds/wild.mp3';
    } else if (card.type === 'wild-draw-four') {
      sound.src = 'sounds/draw-four.mp3';
    } else if (card.type === 'special' && card.value === 'draw-ninetynine') {
      sound.src = 'sounds/special.mp3';
    } else {
      sound.src = 'sounds/card.mp3';
    }
    
    sound.volume = 0.3;
    sound.play();
  }
  
  playUnoSound() {
    const sound = new Audio('sounds/uno.mp3');
    sound.volume = 0.5;
    sound.play();
  }
  
  leaveGame() {
    // Limpar listeners
    if (this.roomRef) this.roomRef.off();
    if (this.gameRef) this.gameRef.off();
    if (this.playerRef) this.playerRef.off();
    
    // Sair da sala
    return FirebaseService.rooms.leave(this.roomCode);
  }
}