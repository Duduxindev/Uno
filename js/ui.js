// UI Manager
const UI = {
  elements: {
    preloader: null,
    authSection: null,
    mainMenu: null,
    rulesModal: null,
    settingsModal: null,
    toastContainer: null
  },
  
  init: function() {
    // Primeira prioridade: remover o preloader imediatamente
    this.removePreloader();
    
    try {
      // Inicializar elementos
      this.initElements();
      
      // Aplicar event listeners
      this.initEventListeners();
      
      // Verificar página atual
      this.setupCurrentPage();
      
      console.log("UI inicializada com sucesso");
    } catch (error) {
      console.error('Erro na inicialização da UI:', error);
      // Garantir que o preloader seja removido mesmo em caso de erro
      this.removePreloader();
    }
  },
  
  removePreloader: function() {
    try {
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        preloader.style.display = 'none';
        console.log("Preloader removido com sucesso");
      }
    } catch (error) {
      console.error("Erro ao remover preloader:", error);
    }
  },
  
  initElements: function() {
    // Elementos comuns
    this.elements.toastContainer = document.getElementById('toast-container');
    
    // Elementos de página específica
    if (document.getElementById('main-menu')) {
      this.setupHomePage();
    } else if (document.getElementById('rooms-section')) {
      this.setupLobbyPage();
    } else if (document.querySelector('.game-container')) {
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
    this.elements.btnLogout = document.getElementById('btn-logout');
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
        if (chatContainer) {
          chatContainer.classList.toggle('collapsed');
        }
      });
    }
  },
  
  setupCurrentPage: function() {
    const pathname = window.location.pathname;
    
    if (pathname.includes('index.html') || pathname === '/' || pathname === '') {
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
    try {
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
      
      const toastContainer = this.elements.toastContainer || document.getElementById('toast-container');
      if (toastContainer) {
        toastContainer.appendChild(toast);
        
        // Mostrar toast
        setTimeout(() => {
          toast.classList.add('show');
        }, 10);
        
        // Remover toast
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => {
            if (toastContainer.contains(toast)) {
              toastContainer.removeChild(toast);
            }
          }, 300);
        }, duration);
      }
    } catch (error) {
      console.error('Erro ao mostrar toast:', error);
    }
  },
  
  // Método para mostrar/esconder seções
  showSection: function(sectionId) {
    try {
      const sections = document.querySelectorAll('.section');
      
      sections.forEach(section => {
        if (section.id === sectionId) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      });
    } catch (error) {
      console.error('Erro ao mostrar seção:', error);
    }
  },
  
  // Método para mostrar tabs
  showTab: function(tabName) {
    try {
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
    } catch (error) {
      console.error('Erro ao mostrar tab:', error);
    }
  },
  
  // Método para mostrar modal
  showModal: function(modal) {
    if (!modal) return;
    
    try {
      modal.style.display = 'flex';
      setTimeout(() => {
        modal.classList.add('show');
      }, 10);
    } catch (error) {
      console.error('Erro ao mostrar modal:', error);
    }
  },
  
  // Método para fechar modal
  closeModal: function(modal) {
    if (!modal) return;
    
    try {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    } catch (error) {
      console.error('Erro ao fechar modal:', error);
    }
  },
  
  // Método para randomizar avatar
  randomizeAvatar: function() {
    try {
      const seed = Math.random().toString(36).substring(2, 10);
      const currentAvatar = document.getElementById('current-avatar');
      
      if (currentAvatar) {
        currentAvatar.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
      
      const avatarSeedInput = document.getElementById('avatar-seed');
      if (avatarSeedInput) {
        avatarSeedInput.value = seed;
      }
      
      // Limpar URL do avatar
      localStorage.removeItem('avatarURL');
      localStorage.setItem('avatar', seed);
    } catch (error) {
      console.error('Erro ao randomizar avatar:', error);
    }
  },
  
  // Método para fazer upload de avatar
  handleAvatarUpload: async function(event) {
    try {
      const file = event.target.files[0];
      
      if (!file) return;
      
      if (!file.type.match('image.*')) {
        this.showToast('Apenas imagens são permitidas', 'error');
        return;
      }
      
      // Verificar se o usuário está autenticado e se firebase está disponível
      if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
        this.showToast('Você precisa estar logado para fazer upload de avatar', 'error');
        return;
      }
      
      const auth = firebase.auth();
      const storage = firebase.storage();
      
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
    try {
      if (!card) return null;
      
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
    } catch (error) {
      console.error('Erro ao renderizar carta:', error);
      return null;
    }
  },
  
  renderCardBack: function() {
    const cardElement = document.createElement('div');
    cardElement.className = 'uno-card back';
    return cardElement;
  },
  
  renderPlayerHand: function(cards, currentColor, topCard) {
    try {
      const playerHand = this.elements.playerHand || document.getElementById('player-hand');
      if (!playerHand) return;
      
      playerHand.innerHTML = '';
      
      if (!cards || cards.length === 0 || !Array.isArray(cards)) {
        return;
      }
      
      // Verificar se temos informações necessárias
      if (!topCard || !currentColor) {
        cards.forEach((card, index) => {
          const cardElement = this.renderCard(card, index, true);
          if (cardElement) {
            playerHand.appendChild(cardElement);
          }
        });
        return;
      }
      
      cards.forEach((card, index) => {
        try {
          const isPlayable = canPlayCard(card, topCard, currentColor);
          const cardElement = this.renderCard(card, index, isPlayable);
          if (cardElement) {
            playerHand.appendChild(cardElement);
          }
        } catch (cardError) {
          console.error('Erro ao renderizar carta individual:', cardError);
        }
      });
    } catch (error) {
      console.error('Erro ao renderizar mão do jogador:', error);
    }
  },
  
  renderDiscardPile: function(card) {
    try {
      const discardPile = this.elements.discardPile || document.getElementById('discard-pile');
      if (!discardPile) return;
      
      discardPile.innerHTML = '';
      
      if (!card) {
        return;
      }
      
      const cardElement = this.renderCard(card, 0, false);
      if (cardElement) {
        discardPile.appendChild(cardElement);
      }
    } catch (error) {
      console.error('Erro ao renderizar pilha de descarte:', error);
    }
  },
  
  updateGameStatus: function(status) {
    try {
      const gameStatus = this.elements.gameStatus || document.getElementById('game-status');
      if (gameStatus) {
        gameStatus.textContent = status;
      }
    } catch (error) {
      console.error('Erro ao atualizar status do jogo:', error);
    }
  },
  
  renderRooms: function(rooms) {
    try {
      const roomsList = this.elements.roomsList || document.getElementById('rooms-list');
      if (!roomsList) return;
      
      roomsList.innerHTML = '';
      
      if (!rooms || rooms.length === 0) {
        roomsList.innerHTML = `
          <div class="no-rooms">
            <i class="fas fa-search"></i>
            <p>Nenhuma sala encontrada</p>
            <p>Crie uma nova sala para começar a jogar!</p>
          </div>
        `;
        return;
      }
      
      rooms.forEach(room => {
        try {
          const roomItem = this.renderRoomItem(room);
          if (roomItem) {
            roomsList.appendChild(roomItem);
          }
        } catch (roomError) {
          console.error('Erro ao renderizar sala individual:', roomError);
        }
      });
    } catch (error) {
      console.error('Erro ao renderizar salas:', error);
    }
  },
  
  renderRoomItem: function(room) {
    if (!room || !room.id) return null;
    
    try {
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
      
      // Verificar host
      const host = room.host || { name: 'Desconhecido', avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=default' };
      
      roomItem.innerHTML = `
        <div class="room-header">
          <div class="room-name">${lockIcon} ${room.name || 'Sala sem nome'}</div>
          <div class="room-status ${statusClass}">
            ${room.status === 'waiting' ? 'Aguardando' : 
              room.status === 'playing' ? 'Jogando' : 'Finalizado'}
          </div>
        </div>
        <div class="room-details">
          <div class="room-host">
            <img src="${host.avatar}" alt="${host.name}" class="host-avatar">
            <span>Host: ${host.name}</span>
          </div>
          <div class="room-info">
            <div class="room-players">
              <i class="fas fa-users"></i> ${room.playersCount || 0}/${room.maxPlayers || 4}
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
    } catch (error) {
      console.error('Erro ao renderizar item de sala:', error);
      return null;
    }
  },
  
  renderPlayersList: function(players, currentPlayerId) {
    try {
      const playersList = this.elements.playersList || document.getElementById('players-list');
      if (!playersList) return;
      
      playersList.innerHTML = '';
      
      if (!players) return;
      
      Object.values(players).forEach(player => {
        if (!player) return;
        
        try {
          const playerItem = document.createElement('div');
          playerItem.className = 'waiting-player';
          playerItem.dataset.playerId = player.id;
          
          if (player.id === currentPlayerId) {
            playerItem.classList.add('current');
          }
          
          const hostBadge = player.isHost ? '<div class="waiting-player-host">Host</div>' : '';
          const readyStatus = player.isReady ? '<div class="waiting-player-status">Pronto</div>' : '';
          
          playerItem.innerHTML = `
            <img src="${player.avatar || 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'}" alt="${player.name || 'Jogador'}" class="waiting-player-avatar">
            <div class="waiting-player-name">${player.name || 'Jogador'}</div>
            ${hostBadge}
            ${readyStatus}
          `;
          
          playersList.appendChild(playerItem);
        } catch (playerError) {
          console.error('Erro ao renderizar jogador individual:', playerError);
        }
      });
    } catch (error) {
      console.error('Erro ao renderizar lista de jogadores:', error);
    }
  }
};

// Função auxiliar para verificar se uma carta pode ser jogada
function canPlayCard(card, topCard, currentColor) {
  try {
    if (!card || !topCard) return false;
    
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
  } catch (error) {
    console.error('Erro ao verificar se carta pode ser jogada:', error);
    return false;
  }
}

// Remover preloader imediatamente
document.addEventListener('DOMContentLoaded', function() {
  // Tentar remover o preloader no carregamento do DOM
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    preloader.style.visibility = 'hidden';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
});

// Backup: remover preloader no carregamento da página
window.addEventListener('load', function() {
  // Segunda tentativa de remover o preloader
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    preloader.style.visibility = 'hidden';
    preloader.style.display = 'none';
  }
});