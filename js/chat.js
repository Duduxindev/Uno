/**
 * Sistema de Chat para o UNO
 * Última atualização: 2025-04-11 17:11:13
 * Desenvolvido por: Duduxindev
 */
class ChatManager {
    constructor(roomManager) {
        this.roomManager = roomManager;
        this.currentRoomCode = null;
        this.playerName = null;
        this.playerId = null;
        this.messagesRef = null;
        this.messageListener = null;
        this.maxMessages = 50;
        this.commandHandlers = {};
        
        // Inicializar handlers de comandos
        this.initCommandHandlers();
    }
    
    // Inicializar o chat para uma sala específica
    init(roomCode, playerName, playerId) {
        this.currentRoomCode = roomCode;
        this.playerName = playerName;
        this.playerId = playerId;
        
        // Referência para a coleção de mensagens da sala
        this.messagesRef = database.ref(`rooms/${roomCode}/messages`);
        
        // Parar listener anterior se existir
        if (this.messageListener) {
            this.messagesRef.off('child_added', this.messageListener);
            this.messageListener = null;
        }
        
        // Configurar handlers de UI
        this.setupUIHandlers();
        
        // Adicionar o listener para novas mensagens
        this.startListeningForMessages();
        
        // Enviar mensagem do sistema para informar que o jogador entrou
        this.sendSystemMessage(`${playerName} entrou na sala.`);
        
        console.log(`Chat inicializado para sala ${roomCode} com jogador ${playerName}`);
    }
    
    // Configurar os handlers de UI
    setupUIHandlers() {
        // Handlers para sala de espera
        const waitingChatInput = document.getElementById('waiting-chat-input');
        const waitingSendBtn = document.getElementById('waiting-chat-send');
        
        if (waitingChatInput && waitingSendBtn) {
            // Limpar event listeners anteriores (caso existam)
            const newWaitingChatInput = waitingChatInput.cloneNode(true);
            const newWaitingSendBtn = waitingSendBtn.cloneNode(true);
            
            waitingChatInput.parentNode.replaceChild(newWaitingChatInput, waitingChatInput);
            waitingSendBtn.parentNode.replaceChild(newWaitingSendBtn, waitingSendBtn);
            
            // Adicionar novos event listeners
            newWaitingChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(newWaitingChatInput.value, 'waiting');
                    newWaitingChatInput.value = '';
                }
            });
            
            newWaitingSendBtn.addEventListener('click', () => {
                this.sendMessage(newWaitingChatInput.value, 'waiting');
                newWaitingChatInput.value = '';
            });
        }
        
        // Handlers para jogo
        const gameChatInput = document.getElementById('game-chat-input');
        const gameSendBtn = document.getElementById('game-chat-send');
        
        if (gameChatInput && gameSendBtn) {
            // Limpar event listeners anteriores (caso existam)
            const newGameChatInput = gameChatInput.cloneNode(true);
            const newGameSendBtn = gameSendBtn.cloneNode(true);
            
            gameChatInput.parentNode.replaceChild(newGameChatInput, gameChatInput);
            gameSendBtn.parentNode.replaceChild(newGameSendBtn, gameSendBtn);
            
            // Adicionar novos event listeners
            newGameChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(newGameChatInput.value, 'game');
                    newGameChatInput.value = '';
                }
            });
            
            newGameSendBtn.addEventListener('click', () => {
                this.sendMessage(newGameChatInput.value, 'game');
                newGameChatInput.value = '';
            });
        }
    }
    
    // Iniciar a escuta de novas mensagens
    startListeningForMessages() {
        // Limitar a quantidade de mensagens carregadas inicialmente
        this.messagesRef.limitToLast(this.maxMessages).on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.displayMessage(message);
        });
    }
    
    // Enviar uma mensagem
    sendMessage(text, context = 'waiting') {
        // Verificar se o texto está vazio
        text = text.trim();
        if (!text) return;
        
        // Verificar se é um comando
        if (text.startsWith('!')) {
            this.handleCommand(text.substring(1), context);
            return;
        }
        
        // Criar objeto da mensagem
        const message = {
            senderId: this.playerId,
            senderName: this.playerName,
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'user'
        };
        
        // Adicionar a mensagem ao Firebase
        this.messagesRef.push(message);
    }
    
    // Enviar uma mensagem do sistema
    sendSystemMessage(text, context = null) {
        const message = {
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            type: 'system'
        };
        
        this.messagesRef.push(message);
    }
    
    // Exibir uma mensagem na interface
    displayMessage(message) {
        // Determinar em quais contêineres exibir a mensagem
        const containers = [];
        
        const waitingContainer = document.getElementById('waiting-chat-messages');
        const gameContainer = document.getElementById('game-chat-messages');
        
        if (waitingContainer) containers.push(waitingContainer);
        if (gameContainer) containers.push(gameContainer);
        
        // Formatar a data
        const messageDate = message.timestamp ? new Date(message.timestamp) : new Date();
        const timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        containers.forEach(container => {
            // Criar o elemento da mensagem
            if (message.type === 'system') {
                // Mensagem do sistema
                const systemMsg = document.createElement('div');
                systemMsg.className = 'system-message';
                systemMsg.textContent = message.text;
                container.appendChild(systemMsg);
            } else if (message.type === 'user') {
                // Mensagem de usuário
                const msgElement = document.createElement('div');
                msgElement.className = `chat-message ${message.senderId === this.playerId ? 'self' : 'other'}`;
                
                // Se for uma mensagem de UNO, adicionar estilo especial
                if (message.text.toLowerCase() === '!uno') {
                    msgElement.classList.add('uno-message-container');
                }
                
                const senderElement = document.createElement('div');
                senderElement.className = 'message-sender';
                senderElement.textContent = message.senderName || 'Anônimo';
                
                const textElement = document.createElement('div');
                textElement.className = 'message-text';
                
                // Se for uma mensagem de UNO, estilizar diferente
                if (message.text.toLowerCase() === '!uno') {
                    textElement.innerHTML = '<span class="uno-message">UNO!</span>';
                } else {
                    textElement.textContent = message.text;
                }
                
                const timeElement = document.createElement('div');
                timeElement.className = 'message-time';
                timeElement.textContent = timeString;
                
                msgElement.appendChild(senderElement);
                msgElement.appendChild(textElement);
                msgElement.appendChild(timeElement);
                
                container.appendChild(msgElement);
            }
            
            // Rolar para a mensagem mais recente
            container.scrollTop = container.scrollHeight;
        });
    }
    
    // Inicializar handlers de comandos
    initCommandHandlers() {
        // Comando UNO
        this.commandHandlers['uno'] = (args, context) => {
            // Exibir mensagem especial de UNO
            const message = {
                senderId: this.playerId,
                senderName: this.playerName,
                text: '!uno',
                timestamp: Date.now(),
                type: 'user'
            };
            
            // Adicionar a mensagem ao Firebase
            this.messagesRef.push(message);
            
            // Chamar funcionalidade de UNO do jogo
            if (window.game) {
                window.game.callUno(this.playerId);
            } else {
                console.log("Funcionalidade UNO chamada via chat, mas o jogo não está disponível");
            }
        };
        
        // Comando de ajuda
        this.commandHandlers['help'] = (args, context) => {
            this.sendSystemMessage("Comandos disponíveis: !uno, !help");
        };
    }
    
    // Tratar comandos
    handleCommand(command, context) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Verificar se o comando existe
        if (this.commandHandlers[cmd]) {
            this.commandHandlers[cmd](args, context);
        } else {
            // Comando não reconhecido
            this.sendSystemMessage(`Comando desconhecido: !${cmd}. Use !help para ver os comandos disponíveis.`);
        }
    }
    
    // Parar de ouvir por mensagens
    stopListening() {
        if (this.messagesRef && this.messageListener) {
            this.messagesRef.off('child_added', this.messageListener);
            this.messageListener = null;
        }
    }
    
    // Limpar ao sair da sala
    cleanup() {
        this.stopListening();
        this.currentRoomCode = null;
        this.playerName = null;
        this.playerId = null;
        this.messagesRef = null;
    }
}