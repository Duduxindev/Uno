// Lobby.js - Gerencia a interface do lobby
class Lobby {
  constructor() {
    this.rooms = [];
    this.currentFilter = 'all'; // 'all', 'public', 'private'
    this.searchTerm = '';
    this.isLoading = false;
    
    // Referências para elementos DOM
    this.roomsList = document.getElementById('rooms-list');
    this.searchInput = document.getElementById('search-rooms');
    this.filterTabs = document.querySelectorAll('.room-tab');
    this.createRoomBtn = document.getElementById('btn-create-room');
    this.refreshBtn = document.getElementById('btn-refresh-rooms');
    
    // Inicializar a página
    this.initialize();
  }
  
  async initialize() {
    try {
      // Verificar autenticação
      this.checkAuth();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Carregar salas
      await this.loadRooms();
    } catch (error) {
      console.error('Erro ao inicializar lobby:', error);
      UI.showToast('Erro ao inicializar lobby: ' + error.message, 'error');
    }
  }
  
  checkAuth() {
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      window.location.href = 'index.html';
    }
    
    // Atualizar UI do perfil
    this.updateProfileUI();
  }
  
  updateProfileUI() {
    // Atualizar nome do usuário e avatar
    const userDisplay = document.getElementById('user-display');
    const username = document.getElementById('username');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userDisplay && auth.currentUser) {
      // Nome do usuário
      username.textContent = auth.currentUser.displayName || 'Jogador';
      
      // Avatar do usuário
      const avatarURL = localStorage.getItem('avatarURL');
      const avatarSeed = localStorage.getItem('avatar');
      
      if (avatarURL) {
        userAvatar.src = avatarURL;
      } else if (avatarSeed) {
        userAvatar.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
      } else if (auth.currentUser.photoURL) {
        userAvatar.src = auth.currentUser.photoURL;
      } else {
        // Gerar avatar baseado no UID
        const seed = auth.currentUser.uid.substring(0, 8);
        userAvatar.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
    }
  }
  
  setupEventListeners() {
    // Tabs de filtro
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        this.currentFilter = tab.dataset.filter;
        this.filterRooms();
      });
    });
    
    // Pesquisa
    this.searchInput.addEventListener('input', () => {
      this.searchTerm = this.searchInput.value.toLowerCase();
      this.filterRooms();
    });
    
    // Botão de atualizar
    this.refreshBtn.addEventListener('click', () => {
      this.loadRooms();
    });
    
    // Botão de criar sala
    this.createRoomBtn.addEventListener('click', () => {
      UI.showModal(document.getElementById('create-room-modal'));
    });
    
    // Formulário de criação de sala
    const createRoomForm = document.getElementById('create-room-form');
    if (createRoomForm) {
      createRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createRoom();
      });
    }
    
    // Botão de logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
    
    // Botão de voltar
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
    
    // Configurar botões de entrar em sala depois de renderizar as salas
    this.setupJoinButtons();
  }
  
  setupJoinButtons() {
    // Delegação de eventos para botões de entrar em sala
    this.roomsList.addEventListener('click', (e) => {
      const joinButton = e.target.closest('.btn-join-room');
      if (joinButton) {
        const roomId = joinButton.dataset.roomId;
        this.joinRoom(roomId);
      }
    });
  }
  
  async loadRooms() {
    try {
      this.isLoading = true;
      this.showLoading();
      
      // Obter lista de salas
      this.rooms = await FirebaseService.rooms.list();
      
      // Ordenar salas (primeiro aguardando, depois jogando)
      this.rooms.sort((a, b) => {
        if (a.status === 'waiting' && b.status !== 'waiting') return -1;
        if (a.status !== 'waiting' && b.status === 'waiting') return 1;
        return b.updatedAt - a.updatedAt; // Mais recentes primeiro
      });
      
      // Aplicar filtros
      this.filterRooms();
      
      this.isLoading = false;
      this.hideLoading();
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      UI.showToast('Erro ao carregar salas: ' + error.message, 'error');
      
      this.isLoading = false;
      this.hideLoading();
    }
  }
  
  filterRooms() {
    let filteredRooms = [...this.rooms];
    
    // Aplicar filtro de tipo (todas, públicas, privadas)
    if (this.currentFilter === 'public') {
      filteredRooms = filteredRooms.filter(room => !room.isPrivate);
    } else if (this.currentFilter === 'private') {
      filteredRooms = filteredRooms.filter(room => room.isPrivate);
    }
    
    // Aplicar pesquisa
    if (this.searchTerm) {
      filteredRooms = filteredRooms.filter(room => 
        room.name.toLowerCase().includes(this.searchTerm) ||
        room.host.name.toLowerCase().includes(this.searchTerm) ||
        room.id.toLowerCase().includes(this.searchTerm)
      );
    }
    
    // Atualizar UI
    UI.renderRooms(filteredRooms);
    
    // Configurar botões de entrar
    this.setupJoinButtons();
  }
  
  async createRoom() {
    try {
      const roomNameInput = document.getElementById('room-name');
      const maxPlayersInput = document.getElementById('max-players');
      const isPrivateInput = document.getElementById('is-private');
      const gameModeSelect = document.getElementById('game-mode');
      
      // Obter valores do formulário
      const roomName = roomNameInput.value.trim();
      const maxPlayers = parseInt(maxPlayersInput.value) || 4;
      const isPrivate = isPrivateInput.checked;
      const gameMode = gameModeSelect.value;
      
      // Validar campos
      if (!roomName) {
        UI.showToast('Digite um nome para a sala', 'warning');
        return;
      }
      
      if (maxPlayers < 2 || maxPlayers > 10) {
        UI.showToast('O número de jogadores deve ser entre 2 e 10', 'warning');
        return;
      }
      
      // Dados da sala
      const roomData = {
        name: roomName,
        maxPlayers: maxPlayers,
        isPrivate: isPrivate,
        gameMode: gameMode
      };
      
      // Criar sala
      const room = await FirebaseService.rooms.create(roomData);
      
      // Fechar modal
      UI.closeModal(document.getElementById('create-room-modal'));
      
      // Redirecionar para a sala
      window.location.href = `game.html?roomCode=${room.id}`;
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      UI.showToast('Erro ao criar sala: ' + error.message, 'error');
    }
  }
  
  async joinRoom(roomId) {
    try {
      // Verificar se é uma sala privada
      const room = this.rooms.find(r => r.id === roomId);
      
      if (room && room.isPrivate) {
        // Mostrar modal para digitar código da sala
        const codeModal = document.getElementById('room-code-modal');
        const codeInput = document.getElementById('room-code-input');
        const submitCodeBtn = document.getElementById('submit-room-code');
        
        // Limpar campo
        codeInput.value = '';
        
        // Mostrar modal
        UI.showModal(codeModal);
        
        // Focus no input
        setTimeout(() => codeInput.focus(), 300);
        
        // Configurar submit do código
        submitCodeBtn.onclick = async () => {
          const code = codeInput.value.trim();
          
          if (code !== roomId) {
            UI.showToast('Código incorreto', 'error');
            return;
          }
          
          // Fechar modal
          UI.closeModal(codeModal);
          
          // Entrar na sala
          await this.processJoinRoom(roomId);
        };
      } else {
        // Entrar diretamente na sala pública
        await this.processJoinRoom(roomId);
      }
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      UI.showToast('Erro ao entrar na sala: ' + error.message, 'error');
    }
  }
  
  async processJoinRoom(roomId) {
    try {
      // Mostrar loading
      this.showLoading();
      
      // Entrar na sala
      await FirebaseService.rooms.join(roomId);
      
      // Redirecionar para a sala
      window.location.href = `game.html?roomCode=${roomId}`;
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      UI.showToast('Erro ao entrar na sala: ' + error.message, 'error');
      
      this.hideLoading();
    }
  }
  
  async logout() {
    try {
      await auth.signOut();
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      UI.showToast('Erro ao fazer logout: ' + error.message, 'error');
    }
  }
  
  showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('show');
    }
  }
  
  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
    }
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  new Lobby();
});