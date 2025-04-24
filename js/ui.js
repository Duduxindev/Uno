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
    // Referência direta para garantir que o elemento seja encontrado
    const preloader = document.getElementById('preloader');
    
    if (!preloader) return;
    
    // Remover imediatamente em vez de usar transição
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';  // Adiciona visibilidade oculta
      
      // Adiciona classe hidden após a transição de opacidade
      setTimeout(() => {
        preloader.classList.add('hidden');
      }, 300);
    }, 800); // Reduzido de 1500ms para 800ms
  },

  // Configurar os listeners de eventos da UI
  setupEventListeners() {
    // Tabs de autenticação
    if (this.elements.tabLogin && this.elements.tabRegister) {
      this.elements.tabLogin.addEventListener('click', () => this.switchAuthTab('login'));
      this.elements.tabRegister.addEventListener('click', () => this.switchAuthTab('register'));
    }

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

    // Modo de jogo personalizado e No Mercy
    const classicMode = document.getElementById('classic-mode');
    const customMode = document.getElementById('custom-mode');
    const nomercyMode = document.getElementById('nomercy-mode');
    const customRules = document.getElementById('custom-rules');
    const nomercyRules = document.getElementById('nomercy-rules');

    if (classicMode && customMode && nomercyMode && customRules && nomercyRules) {
      classicMode.addEventListener('change', () => {
        customRules.classList.add('hidden');
        nomercyRules.classList.add('hidden');
      });

      customMode.addEventListener('change', () => {
        customRules.classList.remove('hidden');
        nomercyRules.classList.add('hidden');
      });
      
      nomercyMode.addEventListener('change', () => {
        customRules.classList.add('hidden');
        nomercyRules.classList.remove('hidden');
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
        
        // Remover avatarURL se estiver usando avatar gerado
        localStorage.removeItem('avatarURL');
        localStorage.setItem('avatar', seed);
        
        // Atualizar o header do usuário se existir
        this.updateUserAvatar(`https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`);
      });
    }
    
    // Upload de avatar
    const uploadAvatarBtn = document.getElementById('upload-avatar');
    const avatarUploadInput = document.getElementById('avatar-upload');
    
    if (uploadAvatarBtn && avatarUploadInput) {
      uploadAvatarBtn.addEventListener('click', () => {
        avatarUploadInput.click();
      });
      
      avatarUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleAvatarUpload(e.target.files[0]);
        }
      });
    }
  },

  // Tratar upload de avatar
  async handleAvatarUpload(file) {
    if (!file || !auth.currentUser) return;
    
    try {
      // Validar tamanho e tipo
      if (file.size > 2 * 1024 * 1024) { // 2MB max
        this.showToast('A imagem deve ter no máximo 2MB!', 'error');
        return;
      }
      
      if (!file.type.match('image.*')) {
        this.showToast('O arquivo selecionado não é uma imagem!', 'error');
        return;
      }
      
      this.showToast('Enviando imagem...', 'info');
      
      // Redimensionar imagem antes do upload para garantir tamanho adequado
      const img = await this.resizeImage(file, 300, 300);
      
      // Converter para Blob
      const imgBlob = await fetch(img).then(r => r.blob());
      
      // Referência para o storage
      const userId = auth.currentUser.uid;
      const storageRef = storage.ref();
      const avatarRef = storageRef.child(`avatars/${userId}`);
      
      // Fazer upload
      await avatarRef.put(imgBlob);
      
      // Obter URL da imagem
      const avatarURL = await avatarRef.getDownloadURL();
      
      // Atualizar avatar no preview
      document.getElementById('current-avatar').src = avatarURL;
      
      // Salvar URL no localStorage
      localStorage.setItem('avatarURL', avatarURL);
      localStorage.removeItem('avatar'); // Remover seed do avatar gerado
      
      // Atualizar o header do usuário se existir
      this.updateUserAvatar(avatarURL);
      
      this.showToast('Avatar atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      this.showToast('Erro ao fazer upload do avatar: ' + error.message, 'error');
    }
  },

  // Redimensionar imagem para tamanho adequado
  resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = function() {
          let width = img.width;
          let height = img.height;
          
          // Calcular dimensões proporcionais
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          // Criar canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Retornar imagem como data URL
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = function(error) {
          reject(error);
        };
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
    });
  },

  // Atualizar avatar do usuário no header
  updateUserAvatar(avatarURL) {
    const headerAvatar = document.querySelector('.user-avatar img');
    if (headerAvatar) {
      headerAvatar.src = avatarURL;
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
    if (!modal) return;
    
    modal.style.display = 'block';
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  },

  // Fechar um modal
  closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('show');
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
    
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.remove('hidden');
    }
  },

  // Gerar código de sala aleatório
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const roomCodeInput = document.getElementById('room-code');
    if (roomCodeInput) {
      roomCodeInput.value = code;
    }
  },

  // Copiar para a área de transferência
  copyToClipboard(text) {
    // Verificar se a API clipboard está disponível
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .catch(err => {
          console.error('Erro ao copiar texto: ', err);
          this.fallbackCopyToClipboard(text);
        });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  },

  // Método alternativo para copiar para a área de transferência
  fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      document.execCommand('copy');
      this.showToast('Copiado para a área de transferência!', 'success');
    } catch (err) {
      console.error('Falha ao copiar texto', err);
      this.showToast('Não foi possível copiar o texto. Tente novamente.', 'error');
    }
    
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
    
    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);
    } else {
      // Se não existir o container, criar um
      const newContainer = document.createElement('div');
      newContainer.id = 'toast-container';
      newContainer.className = 'toast-container';
      document.body.appendChild(newContainer);
      newContainer.appendChild(toast);
    }
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  // Atualizar a cor atual
  updateCurrentColor(color) {
    const currentColor = document.getElementById('current-color');
    const colorIndicator = document.querySelector('.color-indicator');
    
    if (currentColor && colorIndicator) {
      currentColor.classList.remove('hidden');
      colorIndicator.style.backgroundColor = `var(--${color})`;
    }
  },

  // Atualizar o estado do jogo
  updateGameStatus(message) {
    const gameStatus = document.getElementById('game-status');
    if (gameStatus) {
      gameStatus.textContent = message;
    }
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
    const playerHand = document.getElementById('player-hand');
    if (playerHand) {
      playerHand.innerHTML = '';
    }
  },

  // Adicionar uma carta à mão do jogador
  addCardToPlayerHand(card) {
    const playerHand = document.getElementById('player-hand');
    if (!playerHand) return null;
    
    const cardElement = this.createCardElement(card);
    playerHand.appendChild(cardElement);
    return cardElement;
  },

  // Atualizar a pilha de descarte
  updateDiscardPile(card) {
    const discardPile = document.getElementById('discard-pile');
    if (!discardPile) return;
    
    discardPile.innerHTML = '';
    if (card) {
      const cardElement = this.createCardElement(card);
      discardPile.appendChild(cardElement);
    }
  }
};