// GameController.js - Controla a interface do jogo
class GameController {
  constructor() {
    // Parâmetros da URL
    this.roomCode = this.getRoomCodeFromURL();
    
    // Instância de jogo
    this.game = null;
    
    // Chat
    this.chat = null;
    
    // Elementos da UI
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnLeaveRoom = document.getElementById('btn-leave-room');
    this.btnDrawCard = document.getElementById('btn-draw');
    this.btnPass = document.getElementById('btn-pass');
    this.btnUno = document.getElementById('btn-uno');
    this.colorButtons = document.querySelectorAll('.color-btn');
    
    this.initialize();
  }
  
  async initialize() {
    try {
      // Verificar autenticação
      this.checkAuth();
      
      // Verificar se há código de sala
      if (!this.roomCode) {
        UI.showToast('Código de sala não encontrado', 'error');
        setTimeout(() => {
          window.location.href = 'lobby.html';
        }, 2000);
        return;
      }
      
      // Inicializar jogo
      this.game = new UnoGame(this.roomCode);
      
      // Inicializar chat
      this.chat = new Chat(this.roomCode);
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Atualizar UI do perfil
      this.updateProfileUI();
    } catch (error) {
      console.error('Erro ao inicializar controlador do jogo:', error);
      UI.showToast('Erro ao inicializar jogo: ' + error.message, 'error');
      
      // Redirecionar para o lobby em caso de erro
      setTimeout(() => {
        window.location.href = 'lobby.html';
      }, 3000);
    }
  }
  
  getRoomCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('roomCode');
  }
  
  checkAuth() {
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      window.location.href = 'index.html';
    }
  }
  
  updateProfileUI() {
    // Atualizar nome do usuário e avatar
    const usernameElement = document.getElementById('username');
    const userAvatarElement = document.getElementById('user-avatar');
    
    if (usernameElement && userAvatarElement && auth.currentUser) {
      // Nome do usuário
      usernameElement.textContent = auth.currentUser.displayName || 'Jogador';
      
      // Avatar do usuário
      const avatarURL = localStorage.getItem('avatarURL');
      const avatarSeed = localStorage.getItem('avatar');
      
      if (avatarURL) {
        userAvatarElement.src = avatarURL;
      } else if (avatarSeed) {
        userAvatarElement.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
      } else if (auth.currentUser.photoURL) {
        userAvatarElement.src = auth.currentUser.photoURL;
      } else {
        // Gerar avatar baseado no UID
        const seed = auth.currentUser.uid.substring(0, 8);
        userAvatarElement.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
      }
    }
  }
  
  setupEventListeners() {
    // Botão de iniciar jogo
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => this.startGame());
    }
    
    // Botão de sair da sala
    if (this.btnLeaveRoom) {
      this.btnLeaveRoom.addEventListener('click', () => this.leaveRoom());
    }
    
    // Botão de comprar carta
    if (this.btnDrawCard) {
      this.btnDrawCard.addEventListener('click', () => this.drawCard());
    }
    
    // Botão de passar vez
    if (this.btnPass) {
      this.btnPass.addEventListener('click', () => this.passNextPlayer());
    }
    
    // Botão de UNO
    if (this.btnUno) {
      this.btnUno.addEventListener('click', () => this.callUno());
    }
    
    // Botões de cor
    this.colorButtons.forEach(button => {
      button.addEventListener('click', () => {
        const color = button.dataset.color;
        this.chooseColor(color);
      });
    });
    
    // Escutar teclas
    document.addEventListener('keydown', (e) => {
      // Espaço para comprar carta
      if (e.code === 'Space' && this.game.currentPlayer === auth.currentUser.uid) {
        this.drawCard();
      }
      
      // U para gritar UNO
      if (e.code === 'KeyU') {
        this.callUno();
      }
    });
    
    // Event listener para recarregamento da página
    window.addEventListener('beforeunload', () => {
      // Tentar sair da sala de forma limpa
      try {
        this.game.leaveGame();
      } catch (error) {
        console.error('Erro ao sair da sala:', error);
      }
    });
  }
  
  async startGame() {
    try {
      // Desabilitar botão para evitar cliques múltiplos
      this.btnStartGame.disabled = true;
      
      // Iniciar jogo
      await FirebaseService.game.start(this.roomCode);
      
      // A UI será atualizada automaticamente pelos listeners
      UI.showToast('Jogo iniciado!', 'success');
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error);
      UI.showToast('Erro ao iniciar jogo: ' + error.message, 'error');
      
      // Reabilitar botão
      this.btnStartGame.disabled = false;
    }
  }
  
  async leaveRoom() {
    try {
      // Pedir confirmação
      if (confirm('Tem certeza que deseja sair da sala?')) {
        await this.game.leaveGame();
        
        // Redirecionar para o lobby
        window.location.href = 'lobby.html';
      }
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
      UI.showToast('Erro ao sair da sala: ' + error.message, 'error');
    }
  }
  
  async drawCard() {
    try {
      // Verificar se é a vez do jogador
      if (this.game.currentPlayer !== auth.currentUser.uid) {
        UI.showToast('Não é sua vez de jogar', 'warning');
        return;
      }
      
      // Animação de compra
      UI.animateCardDraw();
      
      // Comprar carta
      await this.game.drawCard();
    } catch (error) {
      console.error('Erro ao comprar carta:', error);
      UI.showToast('Erro ao comprar carta: ' + error.message, 'error');
    }
  }
  
  async passNextPlayer() {
    try {
      // Verificar se é a vez do jogador
      if (this.game.currentPlayer !== auth.currentUser.uid) {
        UI.showToast('Não é sua vez de jogar', 'warning');
        return;
      }
      
      // Comprar carta e passar (mesmo que drawCard, mas com mensagem diferente)
      await this.game.drawCard();
      UI.showToast('Você passou a vez', 'info');
    } catch (error) {
      console.error('Erro ao passar a vez:', error);
      UI.showToast('Erro ao passar a vez: ' + error.message, 'error');
    }
  }
  
  async callUno() {
    try {
      await this.game.callUno();
    } catch (error) {
      console.error('Erro ao chamar UNO:', error);
      UI.showToast('Erro ao chamar UNO: ' + error.message, 'error');
    }
  }
  
  async chooseColor(color) {
    try {
      await this.game.chooseColor(color);
    } catch (error) {
      console.error('Erro ao escolher cor:', error);
      UI.showToast('Erro ao escolher cor: ' + error.message, 'error');
    }
  }
  
  copyRoomCode() {
    try {
      // Copiar código para a área de transferência
      navigator.clipboard.writeText(this.roomCode);
      UI.showToast('Código copiado para a área de transferência!', 'success');
    } catch (error) {
      console.error('Erro ao copiar código:', error);
      UI.showToast('Erro ao copiar código: ' + error.message, 'error');
    }
  }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  new GameController();
});