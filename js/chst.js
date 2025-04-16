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
      const chatMessages = document.getElementById('chat-messages');
      const chatInput = document.getElementById('chat-input');
      const sendMessage = document.getElementById('send-message');
      
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
        // Obter informações do usuário
        const userSnapshot = await database.ref(`rooms/${this.roomId}/players/${auth.currentUser.uid}`).once('value');
        const user = userSnapshot.val();
        
        if (!user) return;
        
        // Criar objeto da mensagem
        const message = {
          sender: {
            id: auth.currentUser.uid,
            name: user.name,
            avatar: user.avatar
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
      } catch (error) {
        console.error('Erro ao enviar mensagem de sistema:', error);
      }
    },
  
    // Exibir mensagem na interface
    displayMessage(message) {
      const chatMessages = document.getElementById('chat-messages');
      
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