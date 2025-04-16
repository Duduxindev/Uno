// Funções de UI e utilidades
const UI = {
    // Elementos DOM principais
    elements: {
      preloader: document.getElementById('preloader'),
      mainMenu: document.getElementById('main-menu'),
      authSection: document.getElementById('auth-section'),
      roomsSection: document.getElementById('rooms-section'),
      gameRoomSection: document.getElementById('game-room-section'),
      tabLogin: document.getElementById('tab-login'),
      tabRegister: document.getElementById('tab-register'),
      loginForm: document.getElementById('login-form'),
      registerForm: document.getElementById('register-form'),
      roomsList: document.getElementById('rooms-list'),
      createRoomModal: document.getElementById('create-room-modal'),
      joinPrivateRoomModal: document.getElementById('join-private-room-modal'),
      colorPickerModal: document.getElementById('color-picker-modal'),
      gameOverModal: document.getElementById('game-over-modal'),
      rulesModal: document.getElementById('rules-modal'),
      settingsModal: document.getElementById('settings-modal'),
      btnPlay: document.getElementById('btn-play'),
      btnRooms: document.getElementById('btn-rooms'),
      btnRules: document.getElementById('btn-rules'),
      btnSettings: document.getElementById('btn-settings'),
      btnCreateRoom: document.getElementById('btn-create-room'),
      btnJoinByCode: document.getElementById('btn-join-by-code'),
      btnStartGame: document.getElementById('btn-start-game'),
      playerHand: document.getElementById('player-hand'),
      discardPile: document.getElementById('discard-pile'),
      drawPile: document.getElementById('draw-pile'),
      gameStatus: document.getElementById('game-status'),
      gameBoard: document.getElementById('game-board'),
      waitingScreen: document.getElementById('waiting-screen'),
      playersCount: document.getElementById('players-count'),
      playersRequired: document.getElementById('players-required'),
      currentColor: document.getElementById('current-color'),
      colorIndicator: document.querySelector('.color-indicator'),
      btnDraw: document.getElementById('btn-draw'),
      btnPass: document.getElementById('btn-pass'),
      btnUno: document.getElementById('btn-uno'),
      toastContainer: document.getElementById('toast-container')
    },
  
    // Inicializa a UI
    init() {
      this.hidePreloader();
      this.setupEventListeners();
    },
  
    // Esconde o preloader
    hidePreloader() {
      setTimeout(() => {
        this.elements.preloader.style.opacity = '0';
        setTimeout(() => {
          this.elements.preloader.classList.add('hidden');
        }, 300);
      }, 1500);
    },
  
    // Configura os listeners de eventos da UI
    setupEventListeners() {
      // Tabs de autenticação
      this.elements.tabLogin.addEventListener('click', () => this.switchAuthTab('login'));
      this.elements.tabRegister.addEventListener('click', () => this.switchAuthTab('register'));
  
      // Botões do menu principal
      this.elements.btnRules.addEventListener('click', () => this.showModal(this.elements.rulesModal));
      this.elements.btnSettings.addEventListener('click', () => this.showModal(this.elements.settingsModal));
  
      // Fechar modais
      document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.closeModal(e.target.closest('.modal'));
        });
      });
  
      // Clicar fora do modal para fechar
      document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modal);
          }
        });
      });
  
      // Modo de jogo personalizado
      const classicMode = document.getElementById('classic-mode');
      const customMode = document.getElementById('custom-mode');
      const customRules = document.getElementById('custom-rules');
  
      if (classicMode && customMode && customRules) {
        classicMode.addEventListener('change', () => {
          customRules.classList.add('hidden');
        });
  
        customMode.addEventListener('change', () => {
          customRules.classList.remove('hidden');
        });
      }
  
      // Salas privadas
      const roomIsPrivate = document.getElementById('room-is-private');
      const privateCodeContainer = document.getElementById('private-code-container');
  
      if (roomIsPrivate && privateCodeContainer) {
        roomIsPrivate.addEventListener('change', () => {
          if (roomIsPrivate.checked) {
            privateCodeContainer.classList.remove('hidden');
            this.generateRoomCode();
          } else {
            privateCodeContainer.classList.add('hidden');
          }
        });
      }
  
      // Gerar código de sala
      const generateCodeBtn = document.getElementById('generate-code');
      if (generateCodeBtn) {
        generateCodeBtn.addEventListener('click', () => this.generateRoomCode());
      }
  
      // Copiar código de sala
      const copyCodeBtn = document.getElementById('copy-code');
      if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => {
          const roomCode = document.getElementById('room-code').value;
          this.copyToClipboard(roomCode);
          this.showToast('Código copiado para a área de transferência!', 'success');
        });
      }
  
      // Chat toggle
      const toggleChatBtn = document.getElementById('toggle-chat');
      const chatContainer = document.querySelector('.chat-container');
      
      if (toggleChatBtn && chatContainer) {
        toggleChatBtn.addEventListener('click', () => {
          chatContainer.classList.toggle('collapsed');
          toggleChatBtn.querySelector('i').classList.toggle('fa-chevron-down');
          toggleChatBtn.querySelector('i').classList.toggle('fa-chevron-up');
        });
      }
  
      // Avatar aleatório
      const randomizeAvatarBtn = document.getElementById('randomize-avatar');
      const currentAvatar = document.getElementById('current-avatar');
      
      if (randomizeAvatarBtn && currentAvatar) {
        randomizeAvatarBtn.addEventListener('click', () => {
          const seed = Math.random().toString(36).substring(2, 10);
          currentAvatar.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
          document.getElementById('avatar-seed').value = seed;
        });
      }
    },
  
    // Troca entre as abas de login e registro
    switchAuthTab(tab) {
      if (tab === 'login') {
        this.elements.tabLogin.classList.add('active');
        this.elements.tabRegister.classList.remove('active');
        this.elements.loginForm.classList.remove('hidden');
        this.elements.registerForm.classList.add('hidden');
      } else {
        this.elements.tabLogin.classList.remove('active');
        this.elements.tabRegister.classList.add('active');
        this.elements.loginForm.classList.add('hidden');
        this.elements.registerForm.classList.remove('hidden');
      }
    },
  
    // Mostrar um modal
    showModal(modal) {
      modal.style.display = 'block';
      setTimeout(() => {
        modal.style.opacity = '1';
      }, 10);
    },
  
    // Fechar um modal
    closeModal(modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    },
  
    // Mudar de seção
    showSection(sectionId) {
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => {
        section.classList.add('hidden');
      });
      document.getElementById(sectionId).classList.remove('hidden');
    },
  
    // Gerar código de sala aleatório
    generateRoomCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      document.getElementById('room-code').value = code;
    },
  
    // Copiar para a área de transferência
    copyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    },
  
    // Mostrar toast de notificação
    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        ${message}
        <button class="toast-close">&times;</button>
      `;
      
      this.elements.toastContainer.appendChild(toast);
      
      toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
      });
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    },
  
    // Atualizar a cor atual
    updateCurrentColor(color) {
      this.elements.currentColor.classList.remove('hidden');
      this.elements.colorIndicator.style.backgroundColor = `var(--${color})`;
    },
  
    // Atualizar o estado do jogo
    updateGameStatus(message) {
      this.elements.gameStatus.textContent = message;
    },
  
    // Criar um elemento de carta UNO
    createCardElement(card) {
      const cardElement = document.createElement('div');
      
      if (card.type === 'back') {
        cardElement.className = 'uno-card back';
        return cardElement;
      }
      
      let className = 'uno-card';
      
      if (card.color) {
        className += ` ${card.color}`;
      }
      
      if (card.type === 'number') {
        className += ' number';
        cardElement.setAttribute('data-value', card.value);
        cardElement.innerHTML = `<span class="card-value">${card.value}</span>`;
      } else {
        className += ` ${card.type}`;
      }
      
      cardElement.className = className;
      cardElement.dataset.cardId = card.id;
      
      return cardElement;
    },
  
    // Limpar a mão do jogador
    clearPlayerHand() {
      this.elements.playerHand.innerHTML = '';
    },
  
    // Adicionar uma carta à mão do jogador
    addCardToPlayerHand(card) {
      const cardElement = this.createCardElement(card);
      this.elements.playerHand.appendChild(cardElement);
      return cardElement;
    },
  
    // Atualizar a pilha de descarte
    updateDiscardPile(card) {
      this.elements.discardPile.innerHTML = '';
      if (card) {
        const cardElement = this.createCardElement(card);
        this.elements.discardPile.appendChild(cardElement);
      }
    }
  };