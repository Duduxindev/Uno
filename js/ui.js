// UI Manager
const UI = {
  elements: {
    preloader: null,
    authSection: null,
    mainMenu: null,
    rulesModal: null,
    settingsModal: null,
    toastContainer: null,
    
    // Formulários
    loginForm: null,
    registerForm: null,
    settingsForm: null,
    
    // Tabs
    tabLogin: null,
    tabRegister: null,
    
    // Botões
    btnPlay: null,
    btnRooms: null,
    btnRules: null,
    btnSettings: null,
    btnLogout: null,
    
    // Campos
    loginEmail: null,
    loginPassword: null,
    registerUsername: null,
    registerEmail: null,
    registerPassword: null,
    registerConfirmPassword: null,
    
    // Game
    gameRoom: null,
    waitingScreen: null,
    gameBoard: null,
    playerHand: null,
    discardPile: null,
    drawPile: null,
    gameStatus: null,
    
    // Modals
    colorPickerModal: null,
    gameOverModal: null,
  },
  
  init: function() {
    // Inicializar elementos
    this.initElements();
    
    // Aplicar event listeners
    this.initEventListeners();
    
    // Verificar página atual
    this.setupCurrentPage();
    
    // Remover preloader
    setTimeout(() => {
      if (this.elements.preloader) {
        this.elements.preloader.classList.add('hidden');
      }
    }, 1000);
  },
  
  initElements: function() {
    // Elementos comuns
    this.elements.preloader = document.getElementById('preloader');
    this.elements.toastContainer = document.getElementById('toast-container');
    
    // Elementos de página específica
    if (document.getElementById('main-menu')) {
      this.setupHomePage();
    } else if (document.getElementById('rooms-section')) {
      this.setupLobbyPage();
    } else if (document.getElementById('game-room-section')) {
      this.setupGamePage();
    }
  },
  
  setupHomePage: function() {
    // Seções
    this.elements.mainMenu = document.getElementById('main-menu');
    this.elements.authSection = document.getElementById('auth-section');
    
    // Modais
    this.elements.rulesModal = document.getElementById('rules-modal');
    this.elements.settingsModal = document.getElementById('settings-modal');
    
    // Formulários
    this.elements.loginForm = document.getElementById('login-form');
    this.elements.registerForm = document.getElementById('register-form');
    this.elements.settingsForm = document.getElementById('settings-form');
    
    // Tabs
    this.elements.tabLogin = document.getElementById('tab-login');
    this.elements.tabRegister = document.getElementById('tab-register');
    
    // Botões
    this.elements.btnPlay = document.getElementById('btn-play');
    this.elements.btnRooms = document.getElementById('btn-rooms');
    this.elements.btnRules = document.getElementById('btn-rules');
    this.elements.btnSettings = document.getElementById('btn-settings');
    
    // Campos
    this.elements.loginEmail = document.getElementById('login-email');
    this.elements.loginPassword = document.getElementById('login-password');
    this.elements.registerUsername = document.getElementById('register-username');
    this.elements.registerEmail = document.getElementById('register-email');
    this.elements.registerPassword = document.getElementById('register-password');
    this.elements.registerConfirmPassword = document.getElementById('register-confirm-password');
  },
  
  setupLobbyPage: function() {
    // Seções
    this.elements.roomsSection = document.getElementById('rooms-section');
    this.elements.roomsList = document.getElementById('rooms-list');
    this.elements.createRoomModal = document.getElementById('create-room-modal');
    this.elements.createRoomForm = document.getElementById('create-room-form');
    
    // Tabs
    this.elements.roomTabs = document.querySelectorAll('.room-tab');
    
    // Botões
    this.elements.btnCreateRoom = document.getElementById('btn-create-room');
    this.elements.btnRefreshRooms = document.getElementById('btn-refresh-rooms');
    
    // Campos
    this.elements.searchRooms = document.getElementById('search-rooms');
  },
  
  setupGamePage: function() {
    // Seções
    this.elements.gameRoom = document.getElementById('game-room-section');
    this.elements.gameBoard = document.getElementById('game-board');
    this.elements.waitingScreen = document.getElementById('waiting-screen');
    
    // Game elements
    this.elements.playerHand = document.getElementById('player-hand');
    this.elements.discardPile = document.getElementById('discard-pile');
    this.elements.drawPile = document.getElementById('draw-pile');
    this.elements.gameStatus = document.getElementById('game-status');
    this.elements.playersList = document.getElementById('players-list');
    
    // Botões
    this.elements.btnStartGame = document.getElementById('btn-start-game');
    this.elements.btnLeaveRoom = document.getElementById('btn-leave-room');
    this.elements.btnDrawCard = document.getElementById('btn-draw');
    this.elements.btnPass = document.getElementById('btn-pass');
    this.elements.btnUno = document.getElementById('btn-uno');
    
    // Modais
    this.elements.colorPickerModal = document.getElementById('color-picker-modal');
    this.elements.gameOverModal = document.getElementById('game-over-modal');
    
    // Chat
    this.elements.chatMessages = document.getElementById('chat-messages');
    this.elements.chatInput = document.getElementById('chat-input');
    this.elements.sendMessage = document.getElementById('send-message');
  },
  
  initEventListeners: function() {
    // Fechar modais em clique fora
    window.addEventListener('click', (e) => {
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });
    
    // Fechar modais em botões de fechar
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        this.closeModal(modal);
      });
    });
    
    // Adicionar event listeners para tabs se existirem
    if (this.elements.tabLogin && this.elements.tabRegister) {
      this.elements.tabLogin.addEventListener('click', () => {
        this.showTab('login');
      });
      
      this.elements.tabRegister.addEventListener('click', () => {
        this.showTab('register');
      });
    }
    
    // Adicionar event listeners para randomização de avatar se existir
    const randomizeAvatarBtn = document.getElementById('randomize-avatar');
    if (randomizeAvatarBtn) {
      randomizeAvatarBtn.addEventListener('click', () => {
        this.randomizeAvatar();
      });
    }
    
    // Adicionar event listeners para upload de avatar se existir
    const uploadAvatarBtn = document.getElementById('upload-avatar');
    const avatarUpload = document.getElementById('avatar-upload');
    
    if (uploadAvatarBtn && avatarUpload) {
      uploadAvatarBtn.addEventListener('click', () => {
        avatarUpload.click();
      });
      
      avatarUpload.addEventListener('change', (e) => {
        this.handleAvatarUpload(e);
      });
    }
    
    // Chat toggle se existir
    const toggleChatBtn = document.getElementById('toggle-chat');
    if (toggleChatBtn) {
      toggleChatBtn.addEventListener('click', () => {
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.classList.toggle('collapsed');
      });
    }
  },
  
  setupCurrentPage: function() {
    const pathname = window.location.pathname;
    
    if (pathname.includes('index.html') || pathname === '/') {
      // Página inicial
      console.log('Página inicial carregada');
    } else if (pathname.includes('lobby.html')) {
      // Página de lobby
      console.log('Página de lobby carregada');
    } else if (pathname.includes('game.html')) {
      // Página de jogo
      console.log('Página de jogo carregada');
    }
  },
  
  // Método para mostrar toast notifications
  showToast: function(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-times-circle"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle"></i>';
        break;
      default:
        icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    this.elements.toastContainer.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Remover toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        this.elements.toastContainer.removeChild(toast);
      }, 300);
    }, duration);
  },
  
  // Método para mostrar/esconder seções
  showSection: function(sectionId) {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
      if (section.id === sectionId) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });
  },
  
  // Método para mostrar tabs
  showTab: function(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.auth-form');
    
    // Atualizar tabs
    tabs.forEach(tab => {
      if (tab.id === `tab-${tabName}`) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Atualizar formulários
    forms.forEach(form => {
      if (form.id === `${tabName}-form`) {
        form.classList.remove('hidden');
      } else {
        form.classList.add('hidden');
      }
    });
    
    // Atualizar título
    const authTitle = document.getElementById('auth-title');
    if (authTitle) {
      authTitle.textContent = tabName === 'login' ? 'Login' : 'Registrar';
    }
  },
  
  // Método para mostrar modal
  showModal: function(modal) {
    if (!modal) return;
    
    modal.style.display = 'block';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  },
  
  // Método para fechar modal
  closeModal: function(modal) {
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  },
  
  // Método para randomizar avatar
  randomizeAvatar: function() {
    const seed = Math.random().toString(36).substring(2, 10);
    const currentAvatar = document.getElementById('current-avatar');
    
    if (currentAvatar) {
      currentAvatar.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
    }
    
    document.getElementById('avatar-seed').value = seed;
    
    // Limpar URL do avatar
    localStorage.removeItem('avatarURL');
    localStorage.setItem('avatar', seed);
  },
  
  // Método para fazer upload de avatar
  handleAvatarUpload: async function(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      this.showToast('Apenas imagens são permitidas', 'error');
      return;
    }
    
    try {
      // Verificar se o usuário está autenticado
      if (!auth.currentUser) {
        this.showToast('Você precisa estar logado para fazer upload de avatar', 'error');
        return;
      }
      
      this.showToast('Fazendo upload do avatar...', 'info');
      
      // Referenciar o arquivo no Storage
      const storageRef = storage.ref(`avatars/${auth.currentUser.uid}`);
      
      // Fazer upload
      const snapshot = await storageRef.put(file);
      
      // Obter URL do arquivo
      const downloadURL = await snapshot.ref.getDownloadURL();
      
      // Atualizar UI
      const currentAvatar = document.getElementById('current-avatar');
      if (currentAvatar) {
        currentAvatar.src = downloadURL;
      }
      
      // Salvar URL no localStorage
      localStorage.setItem('avatarURL', downloadURL);
      localStorage.removeItem('avatar');
      
      this.showToast('Avatar atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao fazer upload de avatar:', error);
      this.showToast('Erro ao fazer upload: ' + error.message, 'error');
    }
  },
  
  // Métodos para UI do jogo
  renderCard: function(card, index, isPlayable = true) {
    const cardElement = document.createElement('div');
    cardElement.className = `uno-card ${card.color || 'wild'}`;
    
    // Adicionar classes especiais baseadas no tipo da carta
    if (card.type === 'number') {
      cardElement.classList.add('number');
    } else if (card.type === 'action') {
      cardElement.classList.add(card.value);
    } else if (card.type === 'wild' || card.type === 'wild-draw-four') {
      cardElement.classList.add(card.value);
    } else if (card.type === 'special') {
      cardElement.classList.add('special');
      cardElement.classList.add(card.value);
    }
    
    // Adicionar conteúdo da carta
    if (card.type === 'number') {
      cardElement.innerHTML = `<span class="card-value">${card.value}</span>`;
    } else if (card.type === 'action') {
      let icon = '';
      switch (card.value) {
        case 'skip':
          icon = '<i class="fas fa-ban"></i>';
          break;
        case 'reverse':
          icon = '<i class="fas fa-sync-alt"></i>';
          break;
        case 'draw-two':
          icon = '+2';
          break;
      }
      cardElement.innerHTML = `<span class="card-value">${icon}</span>`;
    } else if (card.type === 'wild') {
      cardElement.innerHTML = '<div class="wild-colors"></div>';
    } else if (card.type === 'wild-draw-four') {
      cardElement.innerHTML = '<div class="wild-colors"></div><span class="card-value">+4</span>';
    } else if (card.type === 'special' && card.value === 'draw-ninetynine') {
      cardElement.innerHTML = '<span class="card-value">+99</span>';
    }
    
    // Adicionar data attributes
    cardElement.dataset.index = index;
    cardElement.dataset.type = card.type;
    cardElement.dataset.value = card.value;
    if (card.color) cardElement.dataset.color = card.color;
    
    // Adicionar classe se a carta for jogável
    if (isPlayable) {
      cardElement.classList.add('playable');
    } else {
      cardElement.classList.add('not-playable');
    }
    
    return cardElement;
  },
  
  renderCardBack: function() {
    const cardElement = document.createElement('div');
    cardElement.className = 'uno-card back';
    return cardElement;
  },
  
  renderPlayerHand: function(cards, currentColor, topCard) {
    const playerHand = this.elements.playerHand;
    playerHand.innerHTML = '';
    
    if (!cards || cards.length === 0) {
      return;
    }
    
    cards.forEach((card, index) => {
      const isPlayable = canPlayCard(card, topCard, currentColor);
      const cardElement = this.renderCard(card, index, isPlayable);
      playerHand.appendChild(cardElement);
    });
  },
  
  renderDiscardPile: function(card) {
    const discardPile = this.elements.discardPile;
    discardPile.innerHTML = '';
    
    if (!card) {
      return;
    }
    
    const cardElement = this.renderCard(card, 0, false);
    discardPile.appendChild(cardElement);
  },
  
  updateGameStatus: function(status) {
    if (this.elements.gameStatus) {
      this.elements.gameStatus.textContent = status;
    }
  },
  
  showColorPicker: function() {
    this.showModal(this.elements.colorPickerModal);
  },
  
  showGameOver: function(winner, score) {
    // Preencher dados do vencedor
    document.getElementById('winner-avatar-img').src = winner.avatar;
    document.getElementById('winner-name').textContent = winner.name;
    
    // Adicionar estatísticas
    const statsContainer = document.getElementById('game-stats');
    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Pontuação</span>
        <span class="stat-value">${score}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Tempo de Jogo</span>
        <span class="stat-value">${this.calculateGameTime()} min</span>
      </div>
    `;
    
    // Mostrar modal
    this.showModal(this.elements.gameOverModal);
  },
  
  calculateGameTime: function() {
    // Implementação básica, idealmente pegaria a diferença entre timestamps de início e fim
    return '10';
  },
  
  addChatMessage: function(message) {
    if (!this.elements.chatMessages) return;
    
    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-message ${message.type || 'other'}`;
    
    let content = '';
    
    if (message.type !== 'system') {
      content += `<div class="chat-message-sender">${message.sender}</div>`;
    }
    
    content += `<div class="chat-message-content">${message.text}</div>`;
    
    chatContainer.innerHTML = content;
    this.elements.chatMessages.appendChild(chatContainer);
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  },
  
  renderPlayersList: function(players, currentPlayerId) {
    if (!this.elements.playersList) return;
    
    this.elements.playersList.innerHTML = '';
    
    Object.values(players).forEach(player => {
      const playerItem = document.createElement('div');
      playerItem.className = 'player-item';
      
      if (player.id === currentPlayerId) {
        playerItem.classList.add('current');
      }
      
      const hostBadge = player.isHost ? '<div class="player-host-badge">Host</div>' : '';
      
      playerItem.innerHTML = `
        <div class="player-avatar">
          <img src="${player.avatar}" alt="${player.name}">
        </div>
        <div class="player-info">
          <div class="player-name">${player.name} ${hostBadge}</div>
          <div class="player-cards-count">${player.cardsCount} cartas</div>
        </div>
      `;
      
      this.elements.playersList.appendChild(playerItem);
    });
  },
  
  renderOpponents: function(players, currentPlayerId, currentPlayer) {
    const opponentsArea = document.querySelector('.opponents-area');
    
    if (!opponentsArea) return;
    
    opponentsArea.innerHTML = '';
    
    const otherPlayers = Object.values(players).filter(
      player => player.id !== auth.currentUser.uid
    );
    
    otherPlayers.forEach(player => {
      const isCurrentTurn = player.id === currentPlayer;
      
      const opponent = document.createElement('div');
      opponent.className = `opponent ${isCurrentTurn ? 'current-turn' : ''}`;
      
      opponent.innerHTML = `
        <div class="opponent-avatar">
          <img src="${player.avatar}" alt="${player.name}">
        </div>
        <div class="opponent-name">${player.name}</div>
        <div class="opponent-cards">
          ${Array(player.cardsCount).fill().map(() => 
            '<div class="uno-card back"></div>'
          ).join('')}
        </div>
      `;
      
      opponentsArea.appendChild(opponent);
    });
  },
  
  updateCurrentColor: function(color) {
    const colorIndicator = document.querySelector('.color-indicator');
    if (colorIndicator) {
      colorIndicator.style.backgroundColor = `var(--${color})`;
      document.querySelector('.current-color').classList.remove('hidden');
    }
  },
  
  animateCardPlay: function(sourceElementId, targetElementId, callback) {
    const source = document.getElementById(sourceElementId);
    const target = document.getElementById(targetElementId);
    
    if (!source || !target) {
      if (callback) callback();
      return;
    }
    
    // Clone da carta para animação
    const cardClone = source.cloneNode(true);
    document.body.appendChild(cardClone);
    
    // Posições iniciais e finais
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    
    // Posicionar clone
    cardClone.style.position = 'fixed';
    cardClone.style.top = `${sourceRect.top}px`;
    cardClone.style.left = `${sourceRect.left}px`;
    cardClone.style.width = `${sourceRect.width}px`;
    cardClone.style.height = `${sourceRect.height}px`;
    cardClone.style.transition = 'all 0.5s ease-in-out';
        // Posicionar clone
        cardClone.style.position = 'fixed';
        cardClone.style.top = `${sourceRect.top}px`;
        cardClone.style.left = `${sourceRect.left}px`;
        cardClone.style.width = `${sourceRect.width}px`;
        cardClone.style.height = `${sourceRect.height}px`;
        cardClone.style.transition = 'all 0.5s ease-in-out';
        cardClone.style.zIndex = '9999';
        
        // Animar para o destino
        setTimeout(() => {
          cardClone.style.top = `${targetRect.top}px`;
          cardClone.style.left = `${targetRect.left}px`;
          cardClone.style.transform = 'rotate(0deg)';
        }, 50);
        
        // Remover clone após animação
        setTimeout(() => {
          document.body.removeChild(cardClone);
          if (callback) callback();
        }, 550);
      },
      
      animateCardDraw: function(callback) {
        const drawPile = this.elements.drawPile;
        const playerHand = this.elements.playerHand;
        
        if (!drawPile || !playerHand) {
          if (callback) callback();
          return;
        }
        
        // Criar carta temporária para animar
        const tempCard = this.renderCardBack();
        document.body.appendChild(tempCard);
        
        // Posições
        const pileRect = drawPile.getBoundingClientRect();
        const handRect = playerHand.getBoundingClientRect();
        
        // Posicionar carta
        tempCard.style.position = 'fixed';
        tempCard.style.top = `${pileRect.top}px`;
        tempCard.style.left = `${pileRect.left}px`;
        tempCard.style.width = `${pileRect.width}px`;
        tempCard.style.height = `${pileRect.height}px`;
        tempCard.style.transition = 'all 0.5s ease-in-out';
        tempCard.style.zIndex = '9999';
        
        // Animar para a mão
        setTimeout(() => {
          tempCard.style.top = `${handRect.top}px`;
          tempCard.style.left = `${handRect.left}px`;
        }, 50);
        
        // Remover carta temporária
        setTimeout(() => {
          document.body.removeChild(tempCard);
          if (callback) callback();
        }, 550);
      },
      
      highlightCurrentPlayer: function(playerId) {
        const playerItems = document.querySelectorAll('.player-item');
        
        playerItems.forEach(item => {
          const id = item.dataset.playerId;
          if (id === playerId) {
            item.classList.add('current');
          } else {
            item.classList.remove('current');
          }
        });
      },
      
      renderRoomItem: function(room) {
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        roomItem.dataset.roomId = room.id;
        
        // Verificar status da sala
        const statusClass = room.status === 'waiting' ? 'waiting' : 
                            room.status === 'playing' ? 'playing' : 'finished';
        
        // Verificar se é privada
        const lockIcon = room.isPrivate ? 
          '<i class="fas fa-lock room-private-icon"></i>' : '';
        
        // Modo de jogo
        const gameMode = room.gameMode === 'classic' ? 'Clássico' : 
                        room.gameMode === 'special' ? 'Especial' : 'Personalizado';
        
        roomItem.innerHTML = `
          <div class="room-header">
            <div class="room-name">${lockIcon} ${room.name}</div>
            <div class="room-status ${statusClass}">
              ${room.status === 'waiting' ? 'Aguardando' : 
                room.status === 'playing' ? 'Jogando' : 'Finalizado'}
            </div>
          </div>
          <div class="room-details">
            <div class="room-host">
              <img src="${room.host.avatar}" alt="${room.host.name}" class="host-avatar">
              <span>Host: ${room.host.name}</span>
            </div>
            <div class="room-info">
              <div class="room-players">
                <i class="fas fa-users"></i> ${room.playersCount}/${room.maxPlayers}
              </div>
              <div class="room-mode">
                <i class="fas fa-gamepad"></i> ${gameMode}
              </div>
            </div>
          </div>
          <div class="room-actions">
            <button class="btn btn-primary btn-join-room" data-room-id="${room.id}">
              ${room.status === 'waiting' ? 'Entrar' : 'Observar'}
            </button>
          </div>
        `;
        
        return roomItem;
      },
      
      renderRooms: function(rooms) {
        if (!this.elements.roomsList) return;
        
        this.elements.roomsList.innerHTML = '';
        
        if (rooms.length === 0) {
          this.elements.roomsList.innerHTML = `
            <div class="no-rooms">
              <i class="fas fa-search"></i>
              <p>Nenhuma sala encontrada</p>
              <p>Crie uma nova sala para começar a jogar!</p>
            </div>
          `;
          return;
        }
        
        rooms.forEach(room => {
          const roomItem = this.renderRoomItem(room);
          this.elements.roomsList.appendChild(roomItem);
        });
      },
      
      setupTabSwitching: function(tabsId, contentsId) {
        const tabs = document.querySelectorAll(`${tabsId} .tab`);
        const contents = document.querySelectorAll(`${contentsId} .tab-content`);
        
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            const target = tab.dataset.target;
            
            // Atualizar tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Atualizar conteúdos
            contents.forEach(content => {
              if (content.id === target) {
                content.classList.add('active');
              } else {
                content.classList.remove('active');
              }
            });
          });
        });
      }
    };
    
    // Funções auxiliares
    function canPlayCard(card, topCard, currentColor) {
      // Coringas podem ser jogados a qualquer momento
      if (card.type === 'wild' || card.type === 'wild-draw-four' || card.type === 'special') {
        return true;
      }
      
      // Se a cor é a mesma
      if (card.color === currentColor) {
        return true;
      }
      
      // Se o valor é o mesmo
      if (card.value === topCard.value) {
        return true;
      }
      
      return false;
    }