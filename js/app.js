/**
 * Aplicação Principal UNO Game
 * Data: 2025-04-11 21:16:07
 * Desenvolvido por: Duduxindev
 */

class UnoApp {
    constructor() {
      // Estado da aplicação
      this.version = '2.0.0';
      this.lastUpdated = '2025-04-11 21:16:07';
      this.developer = 'Duduxindev';
      
      // Referências aos botões de navegação
      this.playLocalBtn = document.getElementById('play-local-btn');
      this.playOnlineBtn = document.getElementById('play-online-btn');
      this.optionsBtn = document.getElementById('options-btn');
      this.rulesBtn = document.getElementById('rules-btn');
      
      // Inicializar
      this.init();
    }
    
    // Inicializar aplicação
    init() {
      console.log(`🎮 UNO Game v${this.version} inicializado!`);
      console.log(`🕒 Atualizado em: ${this.lastUpdated}`);
      console.log(`👨‍💻 Desenvolvido por: ${this.developer}`);
      
      // Verificar sessão atual
      this.checkCurrentSession();
      
      // Configurar eventos de navegação
      this.setupNavigation();
      
      // Atualizar informações de versão
      this.updateVersionInfo();
      
      // Mostrar tela inicial
      showScreen('start-screen');
    }
    
    // Verificar se há uma sessão de jogo em andamento
    checkCurrentSession() {
      const session = Storage.getSession();
      
      // Se tem uma sala em andamento, verificar status
      if (session.roomCode) {
        console.log("📌 Sessão em andamento detectada:", session);
        
        // Verificar se a sala ainda existe
        firebase.database().ref(`rooms/${session.roomCode}`).once('value')
          .then(snapshot => {
            const roomData = snapshot.val();
            
            // Se a sala existe e está em andamento
            if (roomData && roomData.status === 'playing') {
              console.log("🎮 Jogo em andamento detectado. Redirecionando...");
              
              // Configurar listener da sala
              if (roomManager) {
                roomManager.setupRoomListener(session.roomCode);
              }
              
              // Redirecionar para a tela de jogo
              setTimeout(() => {
                showScreen('game-screen');
              }, 500);
            } else if (roomData && roomData.status === 'waiting') {
              console.log("🔄 Sala de espera detectada. Redirecionando...");
              
              // Configurar listener da sala
              if (roomManager) {
                roomManager.setupRoomListener(session.roomCode);
              }
              
              // Redirecionar para a sala de espera
              setTimeout(() => {
                showScreen('waiting-room-screen');
              }, 500);
            } else {
              // Sala não existe mais ou está finalizada
              console.log("⚠️ Sessão expirada. Limpando dados...");
              Storage.clearSession();
            }
          })
          .catch(error => {
            console.error("❌ Erro ao verificar sessão:", error);
            Storage.clearSession();
          });
      }
    }
    
    // Configurar eventos de navegação
    setupNavigation() {
      // Jogar local
      if (this.playLocalBtn) {
        this.playLocalBtn.addEventListener('click', () => {
          showScreen('local-game-screen');
        });
      }
      
      // Jogar online
      if (this.playOnlineBtn) {
        this.playOnlineBtn.addEventListener('click', () => {
          showScreen('online-options-screen');
        });
      }
      
      // Opções
      if (this.optionsBtn) {
        this.optionsBtn.addEventListener('click', () => {
          showScreen('options-screen');
        });
      }
      
      // Regras
      if (this.rulesBtn) {
        this.rulesBtn.addEventListener('click', () => {
          showScreen('rules-screen');
        });
      }
      
      // Criar sala
      const createRoomOption = document.getElementById('create-room-option');
      if (createRoomOption) {
        createRoomOption.addEventListener('click', () => {
          showScreen('create-room-screen');
        });
      }
      
      // Entrar em sala
      const joinRoomOption = document.getElementById('join-room-option');
      if (joinRoomOption) {
        joinRoomOption.addEventListener('click', () => {
          showScreen('join-room-screen');
        });
      }
      
      // Botão menu durante o jogo
      const menuBtn = document.getElementById('menu-btn');
      if (menuBtn) {
        menuBtn.addEventListener('click', () => {
          this.showGameMenu();
        });
      }
    }
    
    // Atualizar informações de versão
    updateVersionInfo() {
      const versionInfo = document.querySelector('.version-info');
      
      if (versionInfo) {
        versionInfo.innerHTML = `
          v${this.version} - Atualizado em ${this.lastUpdated}<br>
          Desenvolvido por ${this.developer}
        `;
      }
    }
    
    // Mostrar menu durante o jogo
    showGameMenu() {
      // Criar overlay
      const overlay = document.createElement('div');
      overlay.className = 'game-menu-overlay';
      
      // Criar menu
      const menu = document.createElement('div');
      menu.className = 'game-menu';
      
      // Adicionar título
      const title = document.createElement('h2');
      title.textContent = 'Menu';
      menu.appendChild(title);
      
      // Adicionar opções
      const options = [
        { text: 'Continuar Jogo', action: () => document.body.removeChild(overlay) },
        { text: 'Opções', action: () => {
          document.body.removeChild(overlay);
          showScreen('options-screen');
        }},
        { text: 'Ver Regras', action: () => {
          document.body.removeChild(overlay);
          showScreen('rules-screen');
        }},
        { text: 'Sair do Jogo', action: () => {
          this.showConfirmDialog(
            "Tem certeza que deseja sair do jogo?",
            () => {
              document.body.removeChild(overlay);
              this.exitCurrentGame();
            },
            () => {}
          );
        }}
      ];
      
      options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'menu-option';
        button.textContent = option.text;
        button.addEventListener('click', option.action);
        menu.appendChild(button);
      });
      
      // Adicionar menu ao overlay
      overlay.appendChild(menu);
      
      // Adicionar evento de clique no overlay para fechar
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
        }
      });
      
      // Adicionar à página
      document.body.appendChild(overlay);
    }
    
    // Sair do jogo atual
    exitCurrentGame() {
      const session = Storage.getSession();
      
      // Se estiver em uma sala online
      if (session.isOnline && session.roomCode) {
        // Sair da sala
        roomManager.leaveRoom()
          .then(() => {
            showScreen('start-screen');
          })
          .catch(error => {
            console.error("❌ Erro ao sair da sala:", error);
            // Forçar saída mesmo com erro
            Storage.clearSession();
            showScreen('start-screen');
          });
      } else {
        // Jogo local, apenas limpar sessão e voltar ao menu
        Storage.clearSession();
        showScreen('start-screen');
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
  
  // Inicializar aplicação quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    window.unoApp = new UnoApp();
  });