// Chat.js - Sistema de chat para o jogo
class Chat {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.messagesRef = database.ref(`rooms/${roomCode}/chat`);
    this.currentUser = auth.currentUser;
    
    // Elementos da UI
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-message');
    
    this.initialize();
  }
  
  initialize() {
    // Configurar event listeners
    this.setupEventListeners();
    
    // Carregar mensagens antigas
    this.loadMessages();
    
    // Adicionar mensagem de sistema
    this.addSystemMessage('Bem-vindo ao chat da sala!');
  }
  
  setupEventListeners() {
    // Enviar mensagem com botão
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // Enviar mensagem com Enter
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Verificar se o chat está no final e manter rolagem
    this.chatMessages.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
      
      if (isScrolledToBottom) {
        this.shouldScroll = true;
      } else {
        this.shouldScroll = false;
      }
    });
    
    // Por padrão, auto-rolagem ativada
    this.shouldScroll = true;
  }
  
  loadMessages() {
    // Ouvir por novas mensagens, limitado às últimas 50
    this.messagesRef.limitToLast(50).on('child_added', (snapshot) => {
      const message = snapshot.val();
      this.renderMessage(message);
    });
  }
  
  async sendMessage() {
    try {
      const messageText = this.chatInput.value.trim();
      
      if (!messageText) return;
      
      // Limpar input
      this.chatInput.value = '';
      
      // Verificar se o usuário está autenticado
      if (!this.currentUser) {
        UI.showToast('Você precisa estar logado para enviar mensagens', 'error');
        return;
      }
      
      // Criar objeto de mensagem
      const message = {
        senderId: this.currentUser.uid,
        senderName: this.currentUser.displayName || 'Anônimo',
        senderAvatar: this.getSenderAvatar(),
        text: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };
      
      // Salvar mensagem
      await this.messagesRef.push(message);
      
      // Focar no input
      this.chatInput.focus();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      UI.showToast('Erro ao enviar mensagem: ' + error.message, 'error');
    }
  }
  
  renderMessage(message) {
    // Criar elemento de mensagem
    const messageElement = document.createElement('div');
    
    // Verificar tipo de mensagem
    if (message.system) {
      // Mensagem de sistema
      messageElement.className = 'chat-message system';
      messageElement.innerHTML = `
        <div class="chat-message-content">${message.text}</div>
      `;
    } else {
      // Verificar se é mensagem do usuário atual
      const isCurrentUser = message.senderId === this.currentUser.uid;
      
      // Mensagem normal
      messageElement.className = `chat-message ${isCurrentUser ? 'self' : 'other'}`;
      
      // Formatar a hora
      const timestamp = new Date(message.timestamp);
      const time = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
      
      messageElement.innerHTML = `
        <div class="chat-message-avatar">
          <img src="${message.senderAvatar}" alt="${message.senderName}">
        </div>
        <div class="chat-message-bubble">
          <div class="chat-message-sender">${message.senderName}</div>
          <div class="chat-message-text">${this.formatMessageText(message.text)}</div>
          <div class="chat-message-time">${time}</div>
        </div>
      `;
    }
    
    // Adicionar mensagem ao chat
    this.chatMessages.appendChild(messageElement);
    
    // Rolar para o final se necessário
    if (this.shouldScroll) {
      this.scrollToBottom();
    }
  }
  
  addSystemMessage(text) {
    // Criar mensagem de sistema
    const message = {
      system: true,
      text: text,
      timestamp: Date.now()
    };
    
    // Renderizar mensagem
    this.renderMessage(message);
    
    // Opcionalmente, salvar no Firebase para todos os usuários
    this.messagesRef.push(message);
  }
  
  getSenderAvatar() {
    // Prioridade: 1. avatarURL do localStorage, 2. avatar semente do localStorage, 3. photoURL do usuário, 4. avatar gerado do uid
    const avatarURL = localStorage.getItem('avatarURL');
    const avatarSeed = localStorage.getItem('avatar');
    
    if (avatarURL) {
      return avatarURL;
    } else if (avatarSeed) {
      return `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
    } else if (this.currentUser.photoURL) {
      return this.currentUser.photoURL;
    } else {
      // Gerar um avatar fixo baseado no UID para evitar mudanças
      const fixedSeed = this.currentUser.uid.substring(0, 8);
      return `https://api.dicebear.com/6.x/avataaars/svg?seed=${fixedSeed}`;
    }
  }
  
  formatMessageText(text) {
    // Substituir emojis
    const emojiMap = {
      ':)': '😊',
      ':D': '😃',
      ':(': '😢',
      ':P': '😛',
      '<3': '❤️',
      ':O': '😮',
      ';)': '😉',
      ':*': '😘'
    };
    
    // Substituir texto para emojis
    for (const [emoji, unicode] of Object.entries(emojiMap)) {
      text = text.replace(new RegExp(emoji.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), unicode);
    }
    
    // Escapar HTML para evitar injeção
    text = this.escapeHTML(text);
    
    // Destacar comandos do jogo
    if (text.startsWith('/')) {
      return `<span class="chat-command">${text}</span>`;
    }
    
    return text;
  }
  
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  cleanup() {
    // Remover listener de mensagens
    this.messagesRef.off();
  }
}