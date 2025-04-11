/**
 * Gerenciamento de Salas com Firebase
 * Última atualização: 2025-04-11 17:11:13
 * Desenvolvido por: Duduxindev
 */
class RoomManager {
    constructor() {
        this.currentRoomCode = null;
        this.currentPlayerId = null;
        this.roomsRef = database.ref('rooms');
        this.eventHandlers = {};
        this.chatManager = new ChatManager(this);
        this.connectionTimeout = 10000; // 10 segundos
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.heartbeatInterval = null;
    }
    
    // Gerar código de sala aleatório
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return code;
    }
    
    // Gerar ID de jogador único
    generatePlayerId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Criar uma nova sala
    async createRoom(hostName, gameMode, maxPlayers, customRules) {
        // Validar nome
        if (!hostName || hostName.trim() === '') {
            return { success: false, error: 'Nome do anfitrião é obrigatório.' };
        }
        
        try {
            // Gerar código de sala único
            let roomCode = this.generateRoomCode();
            let roomExists = true;
            
            // Verificar se o código já existe
            while (roomExists) {
                const snapshot = await this.roomsRef.child(roomCode).once('value');
                roomExists = snapshot.exists();
                if (roomExists) {
                    roomCode = this.generateRoomCode();
                }
            }
            
            // Criar ID do host
            const hostId = this.generatePlayerId();
            
            // Criar objeto da sala
            const room = {
                code: roomCode,
                host: hostId,
                gameMode: gameMode,
                maxPlayers: parseInt(maxPlayers),
                customRules: customRules,
                status: 'waiting',
                players: {},
                messages: {},
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastActivity: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Adicionar o host aos jogadores
            room.players[hostId] = {
                id: hostId,
                name: hostName,
                isHost: true,
                isReady: true,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                isOnline: true,
                lastHeartbeat: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Salvar a sala no Firebase
            await this.roomsRef.child(roomCode).set(room);
            this.currentRoomCode = roomCode;
            this.currentPlayerId = hostId;
            
            // Salvar localmente
            const storage = new GameStorage();
            storage.saveSessionInfo(roomCode, hostId);
            storage.savePlayerName(hostName);
            
            // Inicializar chat
            this.chatManager.init(roomCode, hostName, hostId);
            
            // Iniciar heartbeat para manter presença
            this.startHeartbeat();
            
            // Adicionar mensagem de boas-vindas ao chat
            setTimeout(() => {
                this.chatManager.sendSystemMessage(`Bem-vindo à sala ${roomCode}! Compartilhe este código com seus amigos para que eles possam entrar.`);
            }, 1000);
            
            return { 
                success: true, 
                roomCode: roomCode, 
                playerId: hostId 
            };
        } catch (error) {
            console.error('Erro ao criar sala:', error);
            return { 
                success: false, 
                error: 'Falha ao criar sala. Tente novamente.' 
            };
        }
    }
    
    // Entrar em uma sala existente
    async joinRoom(roomCode, playerName) {
        // Validar nome e código
        if (!playerName || playerName.trim() === '') {
            return { success: false, error: 'Nome do jogador é obrigatório.' };
        }
        
        if (!roomCode || roomCode.trim() === '') {
            return { success: false, error: 'Código da sala é obrigatório.' };
        }
        
        roomCode = roomCode.toUpperCase();
        
        try {
            // Verificar se a sala existe
            const roomSnapshot = await this.roomsRef.child(roomCode).once('value');
            const roomData = roomSnapshot.val();
            
            if (!roomData) {
                return { 
                    success: false, 
                    error: 'Sala não encontrada. Verifique o código e tente novamente.' 
                };
            }
            
            // Verificar se a sala está disponível
            if (roomData.status !== 'waiting') {
                return { 
                    success: false, 
                    error: 'Esta sala já começou o jogo ou foi encerrada.' 
                };
            }
            
            // Verificar se a sala está cheia
            const playerCount = Object.keys(roomData.players || {}).length;
            if (playerCount >= roomData.maxPlayers) {
                return { 
                    success: false, 
                    error: 'Esta sala está cheia.' 
                };
            }
            
            // Gerar ID do jogador
            const playerId = this.generatePlayerId();
            
            // Adicionar jogador à sala
            const playerData = {
                id: playerId,
                name: playerName,
                isHost: false,
                isReady: true,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                isOnline: true,
                lastHeartbeat: firebase.database.ServerValue.TIMESTAMP
            };
            
            await this.roomsRef.child(`${roomCode}/players/${playerId}`).set(playerData);
            await this.roomsRef.child(`${roomCode}/lastActivity`).set(firebase.database.ServerValue.TIMESTAMP);
            
            this.currentRoomCode = roomCode;
            this.currentPlayerId = playerId;
            
            // Salvar localmente
            const storage = new GameStorage();
            storage.saveSessionInfo(roomCode, playerId);
            storage.savePlayerName(playerName);
            
            // Inicializar chat
            this.chatManager.init(roomCode, playerName, playerId);
            
            // Iniciar heartbeat para manter presença
            this.startHeartbeat();
            
            return { 
                success: true, 
                roomCode: roomCode, 
                playerId: playerId 
            };
        } catch (error) {
            console.error('Erro ao entrar na sala:', error);
            return { 
                success: false, 
                error: 'Falha ao entrar na sala. Tente novamente.' 
            };
        }
    }
    
    // Sair de uma sala
    async leaveRoom() {
        if (!this.currentRoomCode || !this.currentPlayerId) {
            return { success: false, error: 'Você não está em uma sala.' };
        }
        
        try {
            // Parar heartbeat
            this.stopHeartbeat();
            
            // Verificar se a sala existe
            const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
            const roomData = roomSnapshot.val();
            
            if (!roomData) {
                // Limpar dados locais
                this.clearLocalData();
                return { success: true };
            }
            
            // Enviar mensagem informando que o jogador saiu
            const playerName = roomData.players[this.currentPlayerId]?.name || "Jogador";
            this.chatManager.sendSystemMessage(`${playerName} saiu da sala.`);
            
            // Remover jogador da sala
            await this.roomsRef.child(`${this.currentRoomCode}/players/${this.currentPlayerId}`).remove();
            
            // Verificar se a sala ficou vazia
            const playerCountSnapshot = await this.roomsRef.child(`${this.currentRoomCode}/players`).once('value');
            const players = playerCountSnapshot.val() || {};
            const playerCount = Object.keys(players).length;
            
            if (playerCount === 0) {
                // Se a sala ficou vazia, removê-la
                await this.roomsRef.child(this.currentRoomCode).remove();
            } else if (roomData.host === this.currentPlayerId) {
                // Se o host saiu, transferir para outro jogador
                const newHostId = Object.keys(players)[0];
                await this.roomsRef.child(`${this.currentRoomCode}/host`).set(newHostId);
                await this.roomsRef.child(`${this.currentRoomCode}/players/${newHostId}/isHost`).set(true);
                
                // Enviar mensagem sobre transferência de host
                const newHostName = players[newHostId]?.name || "Novo anfitrião";
                this.chatManager.sendSystemMessage(`${newHostName} é o novo anfitrião da sala.`);
            }
            
            // Atualizar timestamp de última atividade
            if (playerCount > 0) {
                await this.roomsRef.child(`${this.currentRoomCode}/lastActivity`).set(firebase.database.ServerValue.TIMESTAMP);
            }
            
            // Limpar dados locais
            this.clearLocalData();
            
            // Limpar chat
            this.chatManager.cleanup();
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao sair da sala:', error);
            return { success: false, error: 'Falha ao sair da sala. Tente novamente.' };
        }
    }
    
        // Iniciar jogo
        async startGame() {
            if (!this.currentRoomCode || !this.currentPlayerId) {
                return { success: false, error: 'Você não está em uma sala.' };
            }
            
            try {
                // Verificar se a sala existe
                const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
                const roomData = roomSnapshot.val();
                
                if (!roomData) {
                    return { success: false, error: 'Sala não encontrada.' };
                }
                
                // Verificar se é o host
                if (roomData.host !== this.currentPlayerId) {
                    return { success: false, error: 'Apenas o anfitrião pode iniciar o jogo.' };
                }
                
                // Verificar se há jogadores suficientes
                const playerCount = Object.keys(roomData.players || {}).length;
                if (playerCount < 2) {
                    return { success: false, error: 'São necessários pelo menos 2 jogadores para iniciar.' };
                }
                
                // Verificar se todos os jogadores estão online
                const players = roomData.players;
                const offlinePlayers = [];
                
                for (const playerId in players) {
                    if (!players[playerId].isOnline) {
                        offlinePlayers.push(players[playerId].name);
                    }
                }
                
                if (offlinePlayers.length > 0) {
                    return { 
                        success: false, 
                        error: `Alguns jogadores estão offline: ${offlinePlayers.join(', ')}. Aguarde eles reconectarem ou remova-os da sala.` 
                    };
                }
                
                // Configurar o jogo
                const gameConfig = {
                    gameMode: roomData.gameMode,
                    customRules: roomData.customRules,
                    players: Object.values(roomData.players).map(p => ({
                        id: p.id,
                        name: p.name,
                        isAI: false
                    })),
                    startTime: firebase.database.ServerValue.TIMESTAMP
                };
                
                // Atualizar status da sala e adicionar configuração do jogo
                await this.roomsRef.child(`${this.currentRoomCode}/status`).set('playing');
                await this.roomsRef.child(`${this.currentRoomCode}/gameStartedAt`).set(firebase.database.ServerValue.TIMESTAMP);
                await this.roomsRef.child(`${this.currentRoomCode}/gameConfig`).set(gameConfig);
                
                // Enviar mensagem do sistema sobre início do jogo
                this.chatManager.sendSystemMessage('O jogo foi iniciado! Boa sorte a todos!');
                
                return { success: true, gameConfig };
            } catch (error) {
                console.error('Erro ao iniciar jogo:', error);
                return { success: false, error: 'Falha ao iniciar o jogo. Tente novamente.' };
            }
        }
        
        // Observar mudanças em uma sala
        observeRoom(roomCode, callback) {
            if (!roomCode) return null;
            
            const roomRef = this.roomsRef.child(roomCode);
            
            // Criar um identificador único para este listener
            const handlerId = 'room_' + Date.now();
            
            // Salvar a referência ao listener
            const handler = roomRef.on('value', snapshot => {
                const roomData = snapshot.val();
                
                // Se a sala não existir mais
                if (!roomData) {
                    console.log(`Sala ${roomCode} não existe mais.`);
                    this.stopObserving(handlerId);
                    this.clearLocalData();
                    
                    // Redirecionar para tela inicial após alguns segundos
                    setTimeout(() => {
                        window.location.reload();
                    }, 5000);
                    
                    return;
                }
                
                callback(roomData);
            });
            
            this.eventHandlers[handlerId] = {
                ref: roomRef,
                event: 'value',
                handler: handler
            };
            
            return handlerId;
        }
        
        // Observar mudanças no jogo
        observeGame(roomCode, callback) {
            if (!roomCode) return null;
            
            const gameRef = this.roomsRef.child(`${roomCode}/game`);
            
            // Criar um identificador único para este listener
            const handlerId = 'game_' + Date.now();
            
            // Salvar a referência ao listener
            const handler = gameRef.on('value', snapshot => {
                const gameData = snapshot.val();
                callback(gameData);
            });
            
            this.eventHandlers[handlerId] = {
                ref: gameRef,
                event: 'value',
                handler: handler
            };
            
            return handlerId;
        }
        
        // Parar de observar mudanças
        stopObserving(handlerId) {
            if (this.eventHandlers[handlerId]) {
                const { ref, event, handler } = this.eventHandlers[handlerId];
                ref.off(event, handler);
                delete this.eventHandlers[handlerId];
            }
        }
        
        // Atualizar status de presença do jogador
        async updatePresence(isOnline = true) {
            if (!this.currentRoomCode || !this.currentPlayerId) return;
            
            try {
                const now = firebase.database.ServerValue.TIMESTAMP;
                
                await this.roomsRef.child(`${this.currentRoomCode}/players/${this.currentPlayerId}/isOnline`).set(isOnline);
                await this.roomsRef.child(`${this.currentRoomCode}/players/${this.currentPlayerId}/lastHeartbeat`).set(now);
            } catch (error) {
                console.error('Erro ao atualizar presença:', error);
            }
        }
        
        // Iniciar heartbeat para manter presença
        startHeartbeat() {
            // Parar heartbeat anterior se existir
            this.stopHeartbeat();
            
            // Atualizar presença imediatamente
            this.updatePresence(true);
            
            // Configurar heartbeat a cada 30 segundos
            this.heartbeatInterval = setInterval(() => {
                this.updatePresence(true);
            }, 30000);
            
            // Configurar evento para quando o usuário fechar a página
            window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        }
        
        // Parar heartbeat
        stopHeartbeat() {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }
            
            window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        }
        
        // Tratar evento de fechar a página
        handleBeforeUnload() {
            this.updatePresence(false);
        }
        
        // Verificar jogadores offline
        async checkOfflinePlayers() {
            if (!this.currentRoomCode || !this.currentPlayerId) return;
            
            try {
                const now = Date.now();
                const roomRef = this.roomsRef.child(this.currentRoomCode);
                
                // Obter dados da sala
                const roomSnapshot = await roomRef.once('value');
                const roomData = roomSnapshot.val();
                
                if (!roomData || !roomData.players) return;
                
                // Verificar se o usuário atual é o host
                if (roomData.host !== this.currentPlayerId) return;
                
                // Verificar cada jogador
                for (const playerId in roomData.players) {
                    const player = roomData.players[playerId];
                    
                    // Pular se for o host
                    if (playerId === this.currentPlayerId) continue;
                    
                    // Verificar se o último heartbeat foi há mais de 1 minuto
                    if (player.lastHeartbeat && (now - player.lastHeartbeat > 60000)) {
                        // Jogador offline há mais de 1 minuto
                        if (player.isOnline) {
                            // Marcar como offline
                            await roomRef.child(`players/${playerId}/isOnline`).set(false);
                            
                            // Enviar mensagem sobre jogador offline
                            this.chatManager.sendSystemMessage(`${player.name} está offline.`);
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar jogadores offline:', error);
            }
        }
        
        // Remover jogador da sala (apenas para o host)
        async removePlayer(playerId) {
            if (!this.currentRoomCode || !this.currentPlayerId) {
                return { success: false, error: 'Você não está em uma sala.' };
            }
            
            try {
                // Verificar se a sala existe
                const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
                const roomData = roomSnapshot.val();
                
                if (!roomData) {
                    return { success: false, error: 'Sala não encontrada.' };
                }
                
                // Verificar se é o host
                if (roomData.host !== this.currentPlayerId) {
                    return { success: false, error: 'Apenas o anfitrião pode remover jogadores.' };
                }
                
                // Verificar se o jogador existe
                if (!roomData.players[playerId]) {
                    return { success: false, error: 'Jogador não encontrado.' };
                }
                
                // Não pode remover a si mesmo
                if (playerId === this.currentPlayerId) {
                    return { success: false, error: 'Você não pode remover a si mesmo. Use a opção de sair da sala.' };
                }
                
                // Obter nome do jogador
                const playerName = roomData.players[playerId].name;
                
                // Remover jogador
                await this.roomsRef.child(`${this.currentRoomCode}/players/${playerId}`).remove();
                
                // Enviar mensagem do sistema
                this.chatManager.sendSystemMessage(`${playerName} foi removido da sala pelo anfitrião.`);
                
                return { success: true, playerName };
            } catch (error) {
                console.error('Erro ao remover jogador:', error);
                return { success: false, error: 'Falha ao remover jogador. Tente novamente.' };
            }
        }
        
        // Recuperar sala atual se estiver armazenada localmente
        async reconnectToRoom() {
            // Obter informações da sessão
            const storage = new GameStorage();
            const sessionInfo = storage.getSessionInfo();
            
            if (!sessionInfo || !sessionInfo.roomCode || !sessionInfo.playerId) {
                return { success: false };
            }
            
            const roomCode = sessionInfo.roomCode;
            const playerId = sessionInfo.playerId;
            
            try {
                // Verificar se a sala ainda existe
                const roomSnapshot = await this.roomsRef.child(roomCode).once('value');
                const roomData = roomSnapshot.val();
                
                if (!roomData) {
                    storage.clearSessionInfo();
                    return { success: false };
                }
                
                // Verificar se o jogador ainda está na sala
                const playerSnapshot = await this.roomsRef.child(`${roomCode}/players/${playerId}`).once('value');
                
                if (!playerSnapshot.exists()) {
                    storage.clearSessionInfo();
                    return { success: false };
                }
                
                const playerData = playerSnapshot.val();
                
                // Atualizar dados locais
                this.currentRoomCode = roomCode;
                this.currentPlayerId = playerId;
                
                // Atualizar status do jogador
                await this.roomsRef.child(`${roomCode}/players/${playerId}/isOnline`).set(true);
                await this.roomsRef.child(`${roomCode}/players/${playerId}/lastHeartbeat`).set(firebase.database.ServerValue.TIMESTAMP);
                
                // Iniciar heartbeat
                this.startHeartbeat();
                
                // Inicializar chat
                this.chatManager.init(roomCode, playerData.name, playerId);
                
                // Enviar mensagem sobre reconexão
                this.chatManager.sendSystemMessage(`${playerData.name} reconectou à sala.`);
                
                return { 
                    success: true, 
                    roomCode: roomCode, 
                    playerId: playerId,
                    playerName: playerData.name,
                    room: roomData
                };
            } catch (error) {
                console.error('Erro ao reconectar à sala:', error);
                storage.clearSessionInfo();
                return { success: false };
            }
        }
        
        // Limpar dados locais
        clearLocalData() {
            const storage = new GameStorage();
            storage.clearSessionInfo();
            
            this.currentRoomCode = null;
            this.currentPlayerId = null;
        }
        
        // Obter dados do jogador atual
        getCurrentPlayerInfo() {
            return {
                roomCode: this.currentRoomCode,
                playerId: this.currentPlayerId
            };
        }
        
        // Enviar ação de jogo
        async sendGameAction(action, data) {
            if (!this.currentRoomCode || !this.currentPlayerId) {
                return { success: false, error: 'Você não está em uma sala.' };
            }
            
            try {
                const actionData = {
                    action,
                    playerId: this.currentPlayerId,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    ...data
                };
                
                // Enviar ação para o Firebase
                await this.roomsRef.child(`${this.currentRoomCode}/gameActions`).push(actionData);
                
                return { success: true };
            } catch (error) {
                console.error('Erro ao enviar ação de jogo:', error);
                return { success: false, error: 'Falha ao enviar ação. Tente novamente.' };
            }
        }
        
        // Observar ações do jogo
        observeGameActions(roomCode, callback) {
            if (!roomCode) return null;
            
            const actionsRef = this.roomsRef.child(`${roomCode}/gameActions`);
            
            // Criar um identificador único para este listener
            const handlerId = 'actions_' + Date.now();
            
            // Salvar a referência ao listener
            const handler = actionsRef.on('child_added', snapshot => {
                const action = snapshot.val();
                callback(action);
            });
            
            this.eventHandlers[handlerId] = {
                ref: actionsRef,
                event: 'child_added',
                handler: handler
            };
            
            return handlerId;
        }
    }