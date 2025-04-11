/**
 * Sistema de UI para UNO Game
 * Data: 2025-04-11 21:16:07
 * Desenvolvido por: Duduxindev
 */

class UIManager {
    constructor() {
      // Elementos de configuração do modo
      this.modeCards = document.querySelectorAll('.mode-card');
      this.modeDescription = document.getElementById('mode-description');
      
      // Elementos da sala de espera
      this.roomCodeDisplay = document.getElementById('room-code-display');
      this.roomModeDisplay = document.getElementById('room-mode-display');
      this.roomPlayersCount = document.getElementById('room-players-count');
      this.playersList = document.getElementById('players-list');
      this.copyCodeBtn = document.getElementById('copy-code-btn');
      
      // Elementos de navegação
      this.backButtons = document.querySelectorAll('[id^="back-from-"]');
      
      // Inicializar
      this.init();
    }
    
    // Inicializar UI Manager
    init() {
      this.setupModeSelector();
      this.setupSliders();
      this.setupBackButtons();
      this.setupCopyButton();
      this.setupRoomUpdates();
      this.setupDarkModeToggle();
      this.loadSettings();
    }
    
    // Configurar seletor de modo
    setupModeSelector() {
      this.modeCards.forEach(card => {
        card.addEventListener('click', () => {
          // Remover classe selecionada de todos os cards
          this.modeCards.forEach(c => c.classList.remove('selected'));
          
          // Adicionar classe selecionada ao card clicado
          card.classList.add('selected');
          
          // Atualizar descrição
          const mode = card.dataset.mode;
          const description = GameModes.getModeDescription(mode);
          
          if (this.modeDescription) {
            this.modeDescription.textContent = description;
            this.modeDescription.classList.add('highlight');
            
            // Remover destaque após um tempo
            setTimeout(() => {
              this.modeDescription.classList.remove('highlight');
            }, 1000);
          }
        });
      });
    }
    
    // Configurar sliders
    setupSliders() {
      const playerCount = document.getElementById('player-count');
      const playerCountValue = document.getElementById('player-count-value');
      
      if (playerCount && playerCountValue) {
        playerCount.addEventListener('input', () => {
          playerCountValue.textContent = `${playerCount.value} Jogadores`;
        });
      }
    }
    
    // Configurar botões de voltar
    setupBackButtons() {
      this.backButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Obter tela de destino do ID do botão (back-from-X)
          const sourceScreen = button.id.replace('back-from-', '');
          
          // Determinar tela para voltar
          let targetScreen;
          
          switch(sourceScreen) {
            case 'local':
              targetScreen = 'start-screen';
              break;
            case 'online-options':
              targetScreen = 'start-screen';
              break;
            case 'create':
            case 'join':
              targetScreen = 'online-options-screen';
              break;
            case 'waiting-room':
              // Perguntar se realmente quer sair
              this.showConfirmDialog(
                "Tem certeza que deseja sair da sala?",
                () => this.leaveRoom()
              );
              return;
            case 'rules':
            case 'options':
              targetScreen = 'start-screen';
              break;
            default:
              targetScreen = 'start-screen';
          }
          
          // Mudar para a tela de destino
          showScreen(targetScreen);
        });
      });
    }
    
    // Configurar botão de copiar código
    setupCopyButton() {
      if (this.copyCodeBtn && this.roomCodeDisplay) {
        this.copyCodeBtn.addEventListener('click', () => {
          const code = this.roomCodeDisplay.textContent;
          
          // Copiar para a área de transferência
          navigator.clipboard.writeText(code)
            .then(() => {
              // Feedback visual
              this.copyCodeBtn.textContent = 'Copiado!';
              
              setTimeout(() => {
                this.copyCodeBtn.textContent = 'Copiar';
              }, 2000);
            })
            .catch(err => {
              console.error('Erro ao copiar código:', err);
            });
        });
      }
    }
    
    // Configurar updates da sala
    setupRoomUpdates() {
      document.addEventListener('roomUpdate', (e) => {
        const room = e.detail.room;
        
        if (room) {
          this.updateRoomUI(room);
        }
      });
    }
    
    // Configurar toggle de modo escuro
    setupDarkModeToggle() {
      const darkModeToggle = document.getElementById('dark-mode');
      
      if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
          const isDarkMode = darkModeToggle.checked;
          
          // Aplicar modo escuro
          document.body.classList.toggle('dark-mode', isDarkMode);
          
          // Salvar configuração
          const settings = Storage.getSettings();
          settings.darkMode = isDarkMode;
          Storage.saveSettings(settings);
        });
      }
    }
    
    // Carregar configurações salvas
    loadSettings() {
      const settings = Storage.getSettings();
      
      // Aplicar configurações
      document.body.classList.toggle('dark-mode', settings.darkMode);
      
      // Aplicar configurações aos elementos de UI
      const darkModeToggle = document.getElementById('dark-mode');
      if (darkModeToggle) {
        darkModeToggle.checked = settings.darkMode;
      }
      
      const soundEffects = document.getElementById('sound-effects');
      if (soundEffects) {
        soundEffects.checked = settings.soundEffects;
      }
      
      const backgroundMusic = document.getElementById('background-music');
      if (backgroundMusic) {
        backgroundMusic.checked = settings.backgroundMusic;
      }
      
      const cardAnimation = document.getElementById('card-animation');
      if (cardAnimation) {
        cardAnimation.checked = settings.cardAnimation;
      }
      
      const autoUno = document.getElementById('auto-uno');
      if (autoUno) {
        autoUno.checked = settings.autoUno;
      }
      
      const turnTimer = document.getElementById('turn-timer');
      if (turnTimer) {
        turnTimer.checked = settings.turnTimer;
      }
      
      const showPlayable = document.getElementById('show-playable');
      if (showPlayable) {
        showPlayable.checked = settings.showPlayable;
      }
    }
    
    // Atualizar UI da sala
    updateRoomUI(room) {
      // Verificar se estamos na tela de sala de espera
      const waitingRoomScreen = document.getElementById('waiting-room-screen');
      if (!waitingRoomScreen || !waitingRoomScreen.classList.contains('active')) {
        return;
      }
      
      // Atualizar código da sala
      if (this.roomCodeDisplay) {
        this.roomCodeDisplay.textContent = room.code;
      }
      
      // Atualizar modo
      if (this.roomModeDisplay) {
        const modeName = GameModes.getMode(room.gameMode).name;
        this.roomModeDisplay.textContent = modeName;
      }
      
      // Atualizar contagem de jogadores
      if (this.roomPlayersCount) {
        const currentPlayers = Object.keys(room.players).length;
        this.roomPlayersCount.textContent = `${currentPlayers}/${room.maxPlayers}`;
      }
      
      // Atualizar lista de jogadores
      this.updatePlayersList(room);
      
      // Configurar botão iniciar jogo
      this.updateStartGameButton(room);
      
      // Atualizar mensagem de espera
      this.updateWaitingMessage(room);
    }
    
    // Atualizar lista de jogadores
    updatePlayersList(room) {
      if (!this.playersList) return;
      
      // Limpar lista
      this.playersList.innerHTML = '';
      
      // Organizar jogadores (host primeiro)
      const players = Object.entries(room.players).map(([id, player]) => ({
        id,
        ...player
      }));
      
      players.sort((a, b) => {
        if (a.id === room.host) return -1;
        if (b.id === room.host) return 1;
        return a.joinedAt - b.joinedAt;
      });
      
      // Adicionar cada jogador à lista
      players.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.className = 'player-item';
        
        // Adicionar coroa para o host
        const isHost = player.id === room.host;
        
        playerItem.innerHTML = `
          <div class="player-avatar" style="background-color: ${player.color || '#3498db'}">
            ${player.name.charAt(0).toUpperCase()}
          </div>
          <div class="player-info">
            <span class="player-name">${player.name} ${isHost ? '<span class="host-badge">Anfitrião</span>' : ''}</span>
          </div>
        `;
        
        this.playersList.appendChild(playerItem);
      });
    }
    
    // Atualizar botão de iniciar jogo
    updateStartGameButton(room) {
      const startGameBtn = document.getElementById('start-game-btn');
      if (!startGameBtn) return;
      
      const session = Storage.getSession();
      const isHost = session.playerId === room.host;
      
      // Mostrar botão apenas para o host
      if (isHost) {
        startGameBtn.style.display = 'block';
        
        // Habilitar se tiver pelo menos 2 jogadores
        const playerCount = Object.keys(room.players).length;
        startGameBtn.disabled = playerCount < 2;
        
        // Atualizar texto do botão
        if (playerCount < 2) {
          startGameBtn.textContent = 'Aguardando mais jogadores...';
          startGameBtn.classList.remove('pulse-button');
        } else {
          startGameBtn.textContent = 'Iniciar Jogo';
          startGameBtn.classList.add('pulse-button');
        }
      } else {
        startGameBtn.style.display = 'none';
      }
    }
    
    // Atualizar mensagem de espera
    updateWaitingMessage(room) {
      const waitingMessage = document.getElementById('waiting-message');
      if (!waitingMessage) return;
      
      const playerCount = Object.keys(room.players).length;
      const maxPlayers = room.maxPlayers;
      const session = Storage.getSession();
      const isHost = session.playerId === room.host;
      
      if (playerCount < 2) {
        waitingMessage.innerHTML = '<p>Aguardando mais jogadores entrarem na sala...</p>';
      } else if (playerCount === maxPlayers) {
        waitingMessage.innerHTML = `
          <p>Sala completa! ${isHost ? 'Você pode iniciar o jogo.' : 'Aguardando o anfitrião iniciar o jogo.'}</p>
        `;
      } else {
        waitingMessage.innerHTML = `
          <p>${isHost ? 'Você pode iniciar o jogo ou aguardar mais jogadores.' : 'Aguardando o anfitrião iniciar o jogo.'}</p>
        `;
      }
    }
    
    // Sair da sala
    leaveRoom() {
      // Mostrar feedback visual
      const leaveRoomBtn = document.getElementById('leave-room-btn');
      if (leaveRoomBtn) {
        leaveRoomBtn.textContent = 'Saindo...';
        leaveRoomBtn.disabled = true;
      }
      
      // Sair da sala
      roomManager.leaveRoom()
        .then(() => {
          // Navegação para tela inicial
          showScreen('start-screen');
          
          // Mostrar mensagem de sucesso
          this.showSuccess('Você saiu da sala');
        })
        .catch(error => {
          console.error('Erro ao sair da sala:', error);
          this.showError(error.message || 'Erro ao sair da sala');
          
          // Restaurar botão
          if (leaveRoomBtn) {
            leaveRoomBtn.textContent = 'Sair da Sala';
            leaveRoomBtn.disabled = false;
          }
        });
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
    
    // Mostrar mensagem de sucesso
    showSuccess(message) {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = message;
        toast.className = 'toast show success';
        
        setTimeout(() => {
          toast.className = 'toast';
        }, 3000);
      }
    }
    
    // Mostrar mensagem de erro
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
  }
  
  // Inicializar UI Manager quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
    console.log("✅ Sistema de UI inicializado!");
  });