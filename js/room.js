/**
 * Gerenciamento de Salas com Firebase
 * Última atualização: 2025-04-11 16:21:47
 * Desenvolvido por: Duduxindev
 */
class RoomManager {
    constructor() {
        this.currentRoomCode = null;
        this.currentPlayerId = null;
        this.roomsRef = database.ref('rooms');
        this.eventHandlers = {};
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
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            lastActivity: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Adicionar o host aos jogadores
        room.players[hostId] = {
            id: hostId,
            name: hostName,
            isHost: true,
            isReady: true,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Salvar a sala no Firebase
        try {
            await this.roomsRef.child(roomCode).set(room);
            this.currentRoomCode = roomCode;
            this.currentPlayerId = hostId;
            
            // Salvar localmente
            localStorage.setItem('unoCurrentRoom', roomCode);
            localStorage.setItem('unoPlayerId', hostId);
            
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
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await this.roomsRef.child(`${roomCode}/players/${playerId}`).set(playerData);
            await this.roomsRef.child(`${roomCode}/lastActivity`).set(firebase.database.ServerValue.TIMESTAMP);
            
            this.currentRoomCode = roomCode;
            this.currentPlayerId = playerId;
            
            // Salvar localmente
            localStorage.setItem('unoCurrentRoom', roomCode);
            localStorage.setItem('unoPlayerId', playerId);
            
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
            // Verificar se a sala existe
            const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
            const roomData = roomSnapshot.val();
            
            if (!roomData) {
                // Limpar dados locais
                this.clearLocalData();
                return { success: true };
            }
            
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
            }
            
            // Atualizar timestamp de última atividade
            if (playerCount > 0) {
                await this.roomsRef.child(`${this.currentRoomCode}/lastActivity`).set(firebase.database.ServerValue.TIMESTAMP);
            }
            
            // Limpar dados locais
            this.clearLocalData();
            
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
            
            // Atualizar status da sala
            await this.roomsRef.child(`${this.currentRoomCode}/status`).set('playing');
            await this.roomsRef.child(`${this.currentRoomCode}/gameStartedAt`).set(firebase.database.ServerValue.TIMESTAMP);
            
            return { success: true };
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
            callback(roomData);
        });
        
        // Armazenar o handler para poder removê-lo depois
        this.eventHandlers[handlerId] = {
            ref: roomRef,
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
    
    // Recuperar sala atual se estiver armazenada localmente
    async reconnectToRoom() {
        const roomCode = localStorage.getItem('unoCurrentRoom');
        const playerId = localStorage.getItem('unoPlayerId');
        
        if (!roomCode || !playerId) {
            return { success: false };
        }
        
        try {
            // Verificar se a sala ainda existe
            const roomSnapshot = await this.roomsRef.child(roomCode).once('value');
            const roomData = roomSnapshot.val();
            
            if (!roomData) {
                this.clearLocalData();
                return { success: false };
            }
            
            // Verificar se o jogador ainda está na sala
            const playerSnapshot = await this.roomsRef.child(`${roomCode}/players/${playerId}`).once('value');
            
            if (!playerSnapshot.exists()) {
                this.clearLocalData();
                return { success: false };
            }
            
            // Atualizar dados locais
            this.currentRoomCode = roomCode;
            this.currentPlayerId = playerId;
            
            return { 
                success: true, 
                roomCode: roomCode, 
                playerId: playerId,
                room: roomData
            };
        } catch (error) {
            console.error('Erro ao reconectar à sala:', error);
            this.clearLocalData();
            return { success: false };
        }
    }
    
    // Limpar dados locais
    clearLocalData() {
        localStorage.removeItem('unoCurrentRoom');
        localStorage.removeItem('unoPlayerId');
        
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
}