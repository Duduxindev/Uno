/**
 * Sistema de chat para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

class ChatManager {
    constructor() {
      this.waitingChatInput = document.getElementById('waiting-chat-input');
      this.waitingChatSend = document.getElementById('waiting-chat-send');
      this.waitingChatMessages = document.getElementById('waiting-chat-messages');
      
      this.gameChatInput = document.getElementById('game-chat-input');
      this.gameChatSend = document.getElementById('game-chat-send');
      this.gameChatMessages = document.getElementById('game-chat-messages');
      
      // Mensagens de sistema para comandos
      this.systemCommands = {
        help: "Comandos disponíveis: !help, !uno, !players, !cards",
        uno: "Use !uno para chamar UNO quando tiver apenas uma carta!",
        players: "Use !players para ver quais jogadores estão na sala",
        cards: "Use !cards para ver quantas cartas cada jogador tem"
      };
      
      this.init();
    }
    
    // Inicializar chat
    init() {
      this.setupEventListeners();
      this.handleRoomUpdates();
    }
    
    // Configurar event listeners
    setupEventListeners() {
      // Chat da sala de espera
      if (this.waitingChatSend && this.waitingChatInput) {
        this.waitingChatSend.addEventListener('click', () => this.sendWaitingRoomMessage());
        
        this.waitingChatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.sendWaitingRoomMessage();
          }
        });
      }
      
      // Chat do jogo
      if (this.gameChatSend && this.gameChatInput) {
        this.gameChatSend.addEventListener('click', () => this.sendGameMessage());
        
        this.gameChatInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.sendGameMessage();
          }
        });
      }
    }
    
    // Lidar com atualizações da sala
    handleRoomUpdates() {
      document.addEventListener('roomUpdate', (e) => {
        const room = e.detail.room;
        
        if (room && room.messages) {
          this.updateMessages(room.messages);
        }
      });
    }
    
    // Atualizar mensagens no chat
    updateMessages(messages) {
      // Ordenar mensagens por timestamp
      const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
      
      // Verificar qual tela está ativa
      const waitingRoomActive = document.getElementById('waiting-room-screen').classList.contains('active');
      const gameScreenActive = document.getElementById('game-screen').classList.contains('active');
      
      // Limpar mensagens anteriores
      if (waitingRoomActive && this.waitingChatMessages) {
        this.waitingChatMessages.innerHTML = '';
      }
      
      if (gameScreenActive && this.gameChatMessages) {
        this.gameChatMessages.innerHTML = '';
      }
      
      // Renderizar mensagens
      sortedMessages.forEach(message => {
        const messageElement = this.createMessageElement(message);
        
        if (waitingRoomActive && this.waitingChatMessages) {
          this.waitingChatMessages.appendChild(messageElement.cloneNode(true));
          this.waitingChatMessages.scrollTop = this.waitingChatMessages.scrollHeight;
        }
        
        if (gameScreenActive && this.gameChatMessages) {
          this.gameChatMessages.appendChild(messageElement);
          this.gameChatMessages.scrollTop = this.gameChatMessages.scrollHeight;
        }
      });
    }
    
    // Criar elemento HTML para uma mensagem
    createMessageElement(message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'message';
      
      // Determinar tipo de mensagem
      if (message.type === 'system') {
        messageElement.classList.add('system-message');
        messageElement.textContent = message.text;
      } else {
        // Obter dados da sessão para destacar próprias mensagens
        const session = Storage.getSession();
        const isOwnMessage = session.playerId === message.playerId;
        
        if (isOwnMessage) {
          messageElement.classList.add('own-message');
        }
        
        // Formatar hora
        const timestamp = new Date(message.timestamp);
        const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Construir mensagem
        messageElement.innerHTML = `
          <span class="message-time">${timeString}</span>
          <span class="message-author">${message.playerName}:</span>
          <span class="message-text">${this.formatMessageText(message.text)}</span>
        `;
      }
      
      return messageElement;
    }
    
    // Formatar texto da mensagem (processa emojis, links, etc)
    formatMessageText(text) {
      // Escapar HTML para prevenir XSS
      const escaped = this.escapeHTML(text);
      
      // Substituir emojis
      const withEmojis = this.replaceEmojis(escaped);
      
      // Substituir URLs por links clicáveis
      return this.linkifyUrls(withEmojis);
    }
    
    // Escapar HTML para prevenir XSS
    escapeHTML(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Substituir atalhos por emojis
    replaceEmojis(text) {
      const emojiMap = {
        ':)': '😊', 
        ':(': '😞', 
        ':D': '😃', 
        ':P': '😛', 
        ':O': '😮',
        '<3': '❤️',
        ':+1:': '👍',
        ':uno:': '🃏'
      };
      
      let result = text;
      for (const [shortcut, emoji] of Object.entries(emojiMap)) {
        result = result.replace(new RegExp(shortcut, 'g'), emoji);
      }
      
      return result;
    }
    
    // Converter URLs em links clicáveis
    linkifyUrls(text) {
      // Regex para identificar URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      
      return text.replace(urlRegex, url => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      });
    }
    
    // Enviar mensagem na sala de espera
    sendWaitingRoomMessage() {
      if (!this.waitingChatInput || !this.waitingChatInput.value.trim()) {
        return;
      }
      
      const messageText = this.waitingChatInput.value.trim();
      
      // Verificar se é um comando
      if (messageText.startsWith('!')) {
        this.handleCommand(messageText);
      } else {
        // Enviar mensagem normal
        this.sendMessage(messageText);
      }
      
      // Limpar campo de entrada
      this.waitingChatInput.value = '';
    }
    
    // Enviar mensagem no jogo
    sendGameMessage() {
      if (!this.gameChatInput || !this.gameChatInput.value.trim()) {
        return;
      }
      
      const messageText = this.gameChatInput.value.trim();
      
      // Verificar se é um comando
      if (messageText.startsWith('!')) {
        this.handleCommand(messageText);
      } else {
        // Enviar mensagem normal
        this.sendMessage(messageText);
      }
      
      // Limpar campo de entrada
      this.gameChatInput.value = '';
    }
    
    // Enviar mensagem para a sala
    async sendMessage(text) {
      try {
        // Usar o gerenciador de salas para enviar a mensagem
        await roomManager.sendMessage(text);
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        
        // Mostrar notificação de erro
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = error.message || "Erro ao enviar mensagem.";
          toast.className = 'toast show error';
          
          setTimeout(() => {
            toast.className = 'toast';
          }, 3000);
        }
      }
    }
    
    // Lidar com comandos especiais
    handleCommand(command) {
      const lowerCommand = command.toLowerCase();
      
      // Comandos disponíveis
      if (lowerCommand === '!help') {
        this.addSystemMessage(this.systemCommands.help);
      } 
      else if (lowerCommand === '!uno') {
        this.addSystemMessage(this.systemCommands.uno);
        // Chamar UNO se estiver no jogo
        if (window.callUno && typeof window.callUno === 'function') {
          window.callUno();
        }
      }
      else if (lowerCommand === '!players') {
        this.showPlayersInfo();
      }
      else if (lowerCommand === '!cards') {
        this.showCardsInfo();
      }
      else {
        this.addSystemMessage(`Comando desconhecido. Digite !help para ver os comandos disponíveis.`);
      }
    }
    
    // Adicionar mensagem de sistema
    addSystemMessage(text) {
      // Sala de espera
      if (this.waitingChatMessages) {
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = text;
        
        this.waitingChatMessages.appendChild(messageElement);
        this.waitingChatMessages.scrollTop = this.waitingChatMessages.scrollHeight;
      }
      
      // Jogo
      if (this.gameChatMessages) {
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = text;
        
        this.gameChatMessages.appendChild(messageElement);
        this.gameChatMessages.scrollTop = this.gameChatMessages.scrollHeight;
      }
    }
    
    // Mostrar informações dos jogadores
    showPlayersInfo() {
      if (!roomManager.currentRoom) {
        this.addSystemMessage("Informações não disponíveis.");
        return;
      }
      
      const players = roomManager.currentRoom.players;
      let message = "Jogadores na sala:\n";
      
      Object.values(players).forEach(player => {
        const isHost = roomManager.currentRoom.host === player.id ? " (Anfitrião)" : "";
        message += `- ${player.name}${isHost}\n`;
      });
      
      this.addSystemMessage(message);
    }
    
    // Mostrar informações das cartas
    showCardsInfo() {
      if (!roomManager.currentRoom || roomManager.currentRoom.status !== 'playing') {
        this.addSystemMessage("Informações não disponíveis durante o jogo.");
        return;
      }
      
      const players = roomManager.currentRoom.players;
      const game = roomManager.currentRoom.game;
      
      if (!game || !game.hands) {
        this.addSystemMessage("Informações não disponíveis.");
        return;
      }
      
      let message = "Número de cartas por jogador:\n";
      
      Object.keys(players).forEach(playerId => {
        const playerName = players[playerId].name;
        const cardCount = (game.hands[playerId] || []).length;
        message += `- ${playerName}: ${cardCount} carta(s)\n`;
      });
      
      this.addSystemMessage(message);
    }
  }
  
  // Inicializar o chat quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
    console.log("✅ Sistema de chat inicializado!");
  });