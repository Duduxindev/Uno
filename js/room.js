/**
 * Sistema de Salas
 */
class GameRoom {
    constructor(code, hostId, gameMode = 'normal', maxPlayers = 4) {
        this.code = code;
        this.hostId = hostId;
        this.players = [];
        this.gameMode = gameMode;
        this.maxPlayers = maxPlayers;
        this.customRules = {};
        this.status = 'waiting'; // waiting, playing, ended
        this.game = null;
    }
    
    addPlayer(id, name) {
        if (this.players.length >= this.maxPlayers) {
            return { success: false, error: "Sala cheia" };
        }
        
        if (this.players.some(p => p.id === id)) {
            return { success: false, error: "Já existe um jogador com este ID" };
        }
        
        this.players.push({
            id,
            name,
            isReady: id === this.hostId // Host já está pronto
        });
        
        return { success: true, playerId: id };
    }
    
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        
        if (index === -1) {
            return { success: false, error: "Jogador não encontrado" };
        }
        
        this.players.splice(index, 1);
        
        // Se o host saiu, atribui host ao próximo jogador
        if (playerId === this.hostId && this.players.length > 0) {
            this.hostId = this.players[0].id;
        }
        
        return { success: true };
    }
    
    setPlayerReady(playerId, isReady) {
        const player = this.players.find(p => p.id === playerId);
        
        if (!player) {
            return { success: false, error: "Jogador não encontrado" };
        }
        
        player.isReady = isReady;
        return { success: true };
    }
    
    areAllPlayersReady() {
        return this.players.length >= 2 && this.players.every(p => p.isReady);
    }
    
    setCustomRules(rules) {
        this.customRules = rules;
        return { success: true };
    }
    
    startGame() {
        if (this.status !== 'waiting') {
            return { success: false, error: "O jogo já começou ou terminou" };
        }
        
        if (!this.areAllPlayersReady()) {
            return { success: false, error: "Nem todos os jogadores estão prontos" };
        }
        
        this.status = 'playing';
        this.game = new UnoGame(this.gameMode, this.customRules);
        
        // Adiciona jogadores
        this.players.forEach(player => {
            this.game.addPlayer(player.name);
        });
        
        // Preenche com IA se necessário
        while (this.game.players.length < 2) {
            const aiName = `IA ${this.game.players.length + 1}`;
            this.game.addPlayer(aiName, true);
        }
        
        this.game.startGame();
        
        return { success: true };
    }
    
    endGame() {
        if (this.status !== 'playing') {
            return { success: false, error: "O jogo não está ativo" };
        }
        
        this.status = 'ended';
        return { success: true };
    }
    
    getRoomState() {
        return {
            code: this.code,
            hostId: this.hostId,
            players: this.players,
            gameMode: this.gameMode,
            customRules: this.customRules,
            status: this.status,
            maxPlayers: this.maxPlayers
        };
    }
    
    getGameState(forPlayerId) {
        if (this.status !== 'playing' || !this.game) {
            return null;
        }
        
        return this.game.getGameState(forPlayerId);
    }
}

class RoomManager {
    constructor() {
        this.rooms = {};
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Verifica se o código já existe
        if (this.rooms[code]) {
            return this.generateRoomCode();
        }
        
        return code;
    }
    
    createRoom(hostId, hostName, gameMode = 'normal', maxPlayers = 4) {
        const roomCode = this.generateRoomCode();
        const room = new GameRoom(roomCode, hostId, gameMode, maxPlayers);
        
        // Adiciona o host como jogador
        room.addPlayer(hostId, hostName);
        
        this.rooms[roomCode] = room;
        
        return { success: true, roomCode };
    }
    
    joinRoom(roomCode, playerId, playerName) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room) {
            return { success: false, error: "Sala não encontrada" };
        }
        
        if (room.status !== 'waiting') {
            return { success: false, error: "O jogo já começou ou terminou" };
        }
        
        return room.addPlayer(playerId, playerName);
    }
    
    leaveRoom(roomCode, playerId) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room) {
            return { success: false, error: "Sala não encontrada" };
        }
        
        const result = room.removePlayer(playerId);
        
        // Se a sala ficou vazia, remove-a
        if (room.players.length === 0) {
            delete this.rooms[roomCode];
        }
        
        return result;
    }
    
    startGame(roomCode, playerId) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room) {
            return { success: false, error: "Sala não encontrada" };
        }
        
        if (playerId !== room.hostId) {
            return { success: false, error: "Apenas o anfitrião pode iniciar o jogo" };
        }
        
        return room.startGame();
    }
    
    endGame(roomCode, playerId) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room) {
            return { success: false, error: "Sala não encontrada" };
        }
        
        if (playerId !== room.hostId) {
            return { success: false, error: "Apenas o anfitrião pode encerrar o jogo" };
        }
        
        return room.endGame();
    }
    
    getRoomState(roomCode) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room) {
            return null;
        }
        
        return room.getRoomState();
    }
    
    getGameState(roomCode, playerId) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room || room.status !== 'playing') {
            return null;
        }
        
        return room.getGameState(playerId);
    }
    
    playCard(roomCode, playerId, cardId, chosenColor) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room || room.status !== 'playing' || !room.game) {
            return { success: false, error: "Jogo não encontrado" };
        }
        
        return room.game.playCard(playerId, cardId, chosenColor);
    }
    
    drawCard(roomCode, playerId) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room || room.status !== 'playing' || !room.game) {
            return { success: false, error: "Jogo não encontrado" };
        }
        
        return room.game.drawCard(playerId);
    }
    
    callUno(roomCode, playerId) {
        roomCode = roomCode.toUpperCase();
        const room = this.rooms[roomCode];
        
        if (!room || room.status !== 'playing' || !room.game) {
            return { success: false, error: "Jogo não encontrado" };
        }
        
        return room.game.callUno(playerId);
    }
}