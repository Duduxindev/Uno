// Sistema de chat para as salas
const Chat = {
  // Referência ao chat atual
  chatRef: null,
  
  // ID da sala atual
  roomId: null,
  
  // Número máximo de mensagens a exibir
  maxMessages: 50,
  
  // Flag para evitar rolagem automática durante leitura
  userScrolling: false,
  
  // Inicializar o chat
  initChat(roomId) {
    this.roomId = roomId;
    this.chatRef = database.ref(`chats/${roomId}`);
    
    this.setupEventListeners();
    this.startListeningToMessages();
  },

  // Configurar event listeners do chat
  setupEventListeners() {
    // Verificar se estamos na página do lobby ou do jogo
    const isLobby = window.location.pathname.includes('lobby.html');
    
    const chatMessagesId = isLobby ? 'lobby-chat-messages' : 'chat-messages';
    const chatInputId = isLobby ? 'lobby-chat-input' : 'chat-input';
    const sendMessageId = isLobby ? 'lobby-send-message' : 'send-message';
    
    const chatMessages = document.getElementById(chatMessagesId);
    const chatInput = document.getElementById(chatInputId);
    const sendMessage = document.getElementById(sendMessageId);
    
    if (!chatMessages || !chatInput || !sendMessage) return;
    
    // Enviar mensagem ao clicar no botão
    sendMessage.addEventListener('click', () => {
      this.sendMessage(chatInput.value.trim());
      chatInput.value = '';
    });
    
    // Enviar mensagem ao pressionar Enter
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage(chatInput.value.trim());
        chatInput.value = '';
      }
    });
    
    // Detectar quando o usuário está rolando manualmente
    chatMessages.addEventListener('scroll', () => {
      const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 10;
      this.userScrolling = !isScrolledToBottom;
    });
  },

  // Começar a ouvir novas mensagens
  startListeningToMessages() {
    this.chatRef.limitToLast(this.maxMessages).on('child_added', (snapshot) => {
      const message = snapshot.val();
      this.displayMessage(message);
    });
  },

  // Enviar mensagem
  async sendMessage(text) {
    if (!text) return;
    
    try {
      // Processar comandos se a mensagem começar com /
      if (text.startsWith('/')) {
        const result = await this.processCommand(text);
        if (result) return; // Comando processado, não enviar como mensagem normal
      }
      
      // Obter informações do usuário
      const userSnapshot = await database.ref(`rooms/${this.roomId}/players/${auth.currentUser.uid}`).once('value');
      const user = userSnapshot.val();
      
      if (!user) return;
      
      // Criar objeto da mensagem
      const message = {
        sender: {
          id: auth.currentUser.uid,
          name: user.name,
          avatar: user.avatar,
          avatarSeed: user.avatarSeed
        },
        text,
        type: 'user',
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };
      
      // Salvar mensagem no Firebase
      await this.chatRef.push(message);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  },

  // Processar comandos de chat
  async processCommand(text) {
    // Separar o comando e os argumentos
    const args = text.slice(1).split(' ');
    const command = args.shift().toLowerCase();
    
    switch (command) {
      case 'ajuda':
      case 'help':
        this.showHelpMessage();
        return true;
      
      case 'regras':
      case 'rules':
        this.showRulesMessage();
        return true;
        
      case 'limpar':
      case 'clear':
        this.clearChatMessages();
        return true;
        
      case 'dado':
      case 'roll':
        const max = parseInt(args[0]) || 6;
        const value = Math.floor(Math.random() * max) + 1;
        this.sendSystemMessage(`🎲 ${auth.currentUser.displayName || 'Jogador'} rolou um dado de ${max} lados e tirou ${value}.`);
        return true;
    }
    
    return false;
  },

  // Mostrar mensagem de ajuda
  showHelpMessage() {
    // Verificar se estamos na página do lobby ou do jogo
    const isLobby = window.location.pathname.includes('lobby.html');
    const chatMessagesId = isLobby ? 'lobby-chat-messages' : 'chat-messages';
    const chatMessages = document.getElementById(chatMessagesId);
    
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message system';
    messageElement.innerHTML = `
      <strong>Comandos disponíveis:</strong><br>
      <code>/help</code> ou <code>/ajuda</code> - Mostra esta mensagem de ajuda<br>
      <code>/rules</code> ou <code>/regras</code> - Mostra as regras do jogo<br>
      <code>/clear</code> ou <code>/limpar</code> - Limpa as mensagens do chat<br>
      <code>/roll [N]</code> ou <code>/dado [N]</code> - Rola um dado de N lados (padrão: 6)
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Rolar para a última mensagem
    if (!this.userScrolling) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  // Mostrar regras do jogo
  showRulesMessage() {
    // Verificar se estamos na página do lobby ou do jogo
    const isLobby = window.location.pathname.includes('lobby.html');
    const chatMessagesId = isLobby ? 'lobby-chat-messages' : 'chat-messages';
    const chatMessages = document.getElementById(chatMessagesId);
    
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message system';
    messageElement.innerHTML = `
      <strong>Regras básicas do UNO:</strong><br>
      - Combine cores ou números para jogar suas cartas<br>
      - Cartas especiais: Pular (Skip), Reverso (Reverse), +2, Coringa (Wild), Coringa +4<br>
      - Quando você tem apenas uma carta, deve gritar "UNO!"<br>
      - Vence quem ficar sem cartas primeiro
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Rolar para a última mensagem
    if (!this.userScrolling) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  // Limpar mensagens de chat
  clearChatMessages() {
    // Verificar se estamos na página do lobby ou do jogo
    const isLobby = window.location.pathname.includes('lobby.html');
    const chatMessagesId = isLobby ? 'lobby-chat-messages' : 'chat-messages';
    const chatMessages = document.getElementById(chatMessagesId);
    
    if (chatMessages) {
      chatMessages.innerHTML = '';
      this.sendSystemMessage('Chat limpo por ' + (auth.currentUser.displayName || 'Jogador'));
    }
  },

  // Enviar mensagem de sistema
  async sendSystemMessage(text) {
    try {
      // Criar objeto da mensagem
      const message = {
        text,
        type: 'system',
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };
      
      // Salvar mensagem no Firebase
      await this.chatRef.push(message);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem de sistema:', error);
      return false;
    }
  },

  // Exibir mensagem na interface
  displayMessage(message) {
    // Verificar se estamos na página do lobby ou do jogo
    const isLobby = window.location.pathname.includes('lobby.html');
    const chatMessagesId = isLobby ? 'lobby-chat-messages' : 'chat-messages';
    
    const chatMessages = document.getElementById(chatMessagesId);
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    
    if (message.type === 'system') {
      messageElement.className = 'chat-message system';
      messageElement.textContent = message.text;
    } else {
      const isCurrentUser = message.sender.id === auth.currentUser.uid;
      messageElement.className = `chat-message ${isCurrentUser ? 'self' : 'other'}`;
      
      if (!isCurrentUser) {
        const senderElement = document.createElement('div');
        senderElement.className = 'chat-message-sender';
        senderElement.textContent = message.sender.name;
        messageElement.appendChild(senderElement);
      }
      
      const textElement = document.createElement('div');
      textElement.className = 'chat-message-text';
      textElement.textContent = message.text;
      messageElement.appendChild(textElement);
      
      // Mostrar timestamp
      if (message.timestamp) {
        const timestamp = new Date(message.timestamp);
        const timeElement = document.createElement('div');
        timeElement.className = 'chat-message-time';
        timeElement.textContent = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageElement.appendChild(timeElement);
      }
    }
    
    chatMessages.appendChild(messageElement);
    
    // Rolar automaticamente para a última mensagem
    if (!this.userScrolling) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  },

  // Limpar listeners quando sair da sala
  cleanup() {
    if (this.chatRef) {
      this.chatRef.off();
    }
  }
};