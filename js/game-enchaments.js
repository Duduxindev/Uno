/**
 * Game Enhancements for UNO Game
 * Created: 2025-04-11 17:02:35
 * Developer: Duduxindev
 */

// Enhanced room manager to fix joining issues
class EnhancedRoomManager extends RoomManager {
    constructor() {
        super();
        this.lastRoomSnapshot = null;
        this.isHost = false;
        this.chatSystem = new ChatSystem(this);
    }
    
    // Override createRoom to add chat initialization
    async createRoom(hostName, gameMode, maxPlayers, customRules) {
        const result = await super.createRoom(hostName, gameMode, maxPlayers, customRules);
        
        if (result.success) {
            this.isHost = true;
            // Initialize chat system
            this.chatSystem.initialize(result.roomCode, hostName, result.playerId);
            // Add welcome message
            this.chatSystem.sendSystemMessage(`Sala criada por ${hostName}. Aguardando jogadores...`);
        }
        
        return result;
    }
    
    // Override joinRoom to add chat initialization
    async joinRoom(roomCode, playerName) {
        const result = await super.joinRoom(roomCode, playerName);
        
        if (result.success) {
            // Initialize chat system
            this.chatSystem.initialize(result.roomCode, playerName, result.playerId);
            // Add welcome message
            this.chatSystem.sendSystemMessage(`${playerName} entrou na sala.`);
        }
        
        return result;
    }
    
    // Override leaveRoom to handle chat cleanup
    async leaveRoom() {
        // Send leave message before leaving
        if (this.currentRoomCode && this.currentPlayerId) {
            const playerName = this.getPlayerName();
            if (playerName) {
                this.chatSystem.sendSystemMessage(`${playerName} saiu da sala.`);
            }
        }
        
        // Cleanup chat
        this.chatSystem.cleanup();
        
        // Call parent implementation
        return await super.leaveRoom();
    }
    
    // Get player name from current room data
    getPlayerName() {
        if (!this.lastRoomSnapshot || !this.currentPlayerId) return '';
        
        const playerData = this.lastRoomSnapshot?.players?.[this.currentPlayerId];
        return playerData?.name || '';
    }
    
    // Enhanced observe room to store snapshot
    observeRoom(roomCode, callback) {
        const handlerId = super.observeRoom(roomCode, (roomData) => {
            this.lastRoomSnapshot = roomData;
            callback(roomData);
        });
        
        return handlerId;
    }
    
    // Enhanced start game
    async startGame() {
        if (!this.currentRoomCode || !this.currentPlayerId) {
            return { success: false, error: 'Você não está em uma sala.' };
        }
        
        try {
            // Verify if room exists
            const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
            const roomData = roomSnapshot.val();
            
            if (!roomData) {
                return { success: false, error: 'Sala não encontrada.' };
            }
            
            // Verify if user is host
            if (roomData.host !== this.currentPlayerId) {
                return { success: false, error: 'Apenas o anfitrião pode iniciar o jogo.' };
            }
            
            // Check if there are enough players
            const playerCount = Object.keys(roomData.players || {}).length;
            if (playerCount < 2) {
                return { success: false, error: 'São necessários pelo menos 2 jogadores para iniciar.' };
            }
            
            // Update room status
            await this.roomsRef.child(`${this.currentRoomCode}/status`).set('playing');
            await this.roomsRef.child(`${this.currentRoomCode}/gameStartedAt`).set(firebase.database.ServerValue.TIMESTAMP);
            
            // Initialize game state
            const gameState = this.initializeGameState(roomData);
            await this.roomsRef.child(`${this.currentRoomCode}/gameState`).set(gameState);
            
            // Notify through chat
            this.chatSystem.sendSystemMessage('O jogo começou!');
            
            return { success: true, gameState };
        } catch (error) {
            console.error('Erro ao iniciar jogo:', error);
            return { success: false, error: 'Falha ao iniciar o jogo. Tente novamente.' };
        }
    }
    
    // Initialize game state
    initializeGameState(roomData) {
        // Create deck based on game mode
        const deck = new UnoDeck(roomData.gameMode);
        
        // Get player IDs in order
        const playerIds = Object.keys(roomData.players);
        
        // Deal 7 cards to each player
        const playerHands = {};
        playerIds.forEach(playerId => {
            playerHands[playerId] = deck.drawCards(7).map(card => card.toJSON());
        });
        
        // Get first card for discard pile (cannot be special card)
        let firstCard;
        do {
            firstCard = deck.drawCard();
            // If it's a wild card, put it back and draw again
            if (firstCard.type === 'wild') {
                deck.cards.push(firstCard);
                firstCard = deck.drawCard();
            }
        } while (firstCard.type === 'wild');
        
        // Set initial color
        const currentColor = firstCard.color;
        
        // Create initial game state
        return {
            deck: deck.cards.map(card => card.toJSON()),
            discardPile: [firstCard.toJSON()],
            playerHands,
            currentPlayer: playerIds[Math.floor(Math.random() * playerIds.length)],
            direction: 1, // 1 = clockwise, -1 = counterclockwise
            currentColor,
            drawStack: 0,
            lastAction: {
                type: 'gameStart',
                timestamp: Date.now()
            },
            playerOrder: playerIds
        };
    }
    
    // Play a card
    async playCard(cardId, chosenColor = null) {
        if (!this.currentRoomCode || !this.currentPlayerId) {
            return { success: false, error: 'Você não está em uma sala.' };
        }
        
        try {
            // Get current game state
            const gameStateRef = this.roomsRef.child(`${this.currentRoomCode}/gameState`);
            const snapshot = await gameStateRef.once('value');
            const gameState = snapshot.val();
            
            if (!gameState) {
                return { success: false, error: 'Estado do jogo não encontrado.' };
            }
            
            // Check if it's the player's turn
            if (gameState.currentPlayer !== this.currentPlayerId) {
                return { success: false, error: 'Não é sua vez de jogar.' };
            }
            
            // Get player hand
            const playerHand = gameState.playerHands[this.currentPlayerId];
            
            // Find card in player's hand
            const cardIndex = playerHand.findIndex(card => card.id === cardId);
            if (cardIndex === -1) {
                return { success: false, error: 'Carta não encontrada na sua mão.' };
            }
            
            const card = playerHand[cardIndex];
            
            // Check if card can be played
            const topCard = gameState.discardPile[0];
            if (!this.canPlayCard(card, topCard, gameState.currentColor, gameState.drawStack)) {
                return { success: false, error: 'Esta carta não pode ser jogada agora.' };
            }
            
            // Remove card from hand
            playerHand.splice(cardIndex, 1);
            
            // Add to discard pile
            gameState.discardPile.unshift(card);
            
            // Update color for wild cards
            if (card.type === 'wild' && chosenColor) {
                gameState.currentColor = chosenColor;
            } else {
                gameState.currentColor = card.color;
            }
            
            // Apply card effects
            await this.applyCardEffects(gameState, card, chosenColor);
            
            // Check if player has won
            if (playerHand.length === 0) {
                // Game over, player wins
                await this.endGame(this.currentPlayerId);
                return { success: true, gameOver: true, winner: this.currentPlayerId };
            }
            
            // Record last action
            gameState.lastAction = {
                type: 'playCard',
                player: this.currentPlayerId,
                card: card,
                timestamp: Date.now()
            };
            
            // Update game state
            await gameStateRef.set(gameState);
            
            // Notify about card played
            const playerName = this.getPlayerName();
            let cardDescription;
            
            if (card.type === 'number') {
                cardDescription = `${card.color} ${card.value}`;
            } else if (card.type === 'action') {
                const actionNames = {
                    'skip': 'Pular',
                    'reverse': 'Inverter',
                    'draw2': '+2'
                };
                cardDescription = `${card.color} ${actionNames[card.value]}`;
            } else if (card.type === 'wild') {
                const wildNames = {
                    'wild': 'Curinga',
                    'wild-draw-four': 'Curinga +4'
                };
                cardDescription = `${wildNames[card.value]} (${chosenColor})`;
            }
            
            this.chatSystem.sendSystemMessage(`${playerName} jogou ${cardDescription}.`);
            
            // Check if player has one card left
            if (playerHand.length === 1) {
                this.chatSystem.sendSystemMessage(`${playerName} está com UNO!`);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao jogar carta:', error);
            return { success: false, error: 'Falha ao jogar carta. Tente novamente.' };
        }
    }
    
    // Apply effects of played cards
    async applyCardEffects(gameState, card, chosenColor) {
        const playerOrder = gameState.playerOrder;
        const currentPlayerIndex = playerOrder.indexOf(gameState.currentPlayer);
        
        switch (card.value) {
            case 'skip':
                // Skip next player
                const skipIndex = (currentPlayerIndex + gameState.direction + playerOrder.length) % playerOrder.length;
                gameState.currentPlayer = playerOrder[(skipIndex + gameState.direction + playerOrder.length) % playerOrder.length];
                break;
                
            case 'reverse':
                // Reverse direction
                gameState.direction *= -1;
                
                // In a 2-player game, it acts like a skip
                if (playerOrder.length === 2) {
                    // Skip next player (which is the only other player)
                    gameState.currentPlayer = gameState.currentPlayer;
                } else {
                    // Move to next player in new direction
                    gameState.currentPlayer = playerOrder[(currentPlayerIndex + gameState.direction + playerOrder.length) % playerOrder.length];
                }
                break;
                
            case 'draw2':
                // Next player draws 2 cards
                const draw2Index = (currentPlayerIndex + gameState.direction + playerOrder.length) % playerOrder.length;
                const draw2PlayerId = playerOrder[draw2Index];
                
                // Check if stacking is enabled in room settings
                const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
                const room = roomSnapshot.val();
                
                if (room.customRules?.stacking) {
                    // Check if next player has a draw2 card to stack
                    gameState.drawStack += 2;
                } else {
                    // Draw 2 cards from deck to next player's hand
                    for (let i = 0; i < 2; i++) {
                        if (gameState.deck.length === 0) {
                            this.reshuffleDeck(gameState);
                        }
                        gameState.playerHands[draw2PlayerId].push(gameState.deck.pop());
                    }
                    
                    // Skip next player
                    gameState.currentPlayer = playerOrder[(draw2Index + gameState.direction + playerOrder.length) % playerOrder.length];
                }
                break;
                
            case 'wild-draw-four':
                // Next player draws 4 cards
                const draw4Index = (currentPlayerIndex + gameState.direction + playerOrder.length) % playerOrder.length;
                const draw4PlayerId = playerOrder[draw4Index];
                
                // Check if stacking is enabled in room settings
                const roomData = await this.roomsRef.child(this.currentRoomCode).once('value');
                const roomSettings = roomData.val();
                
                if (roomSettings.customRules?.stacking) {
                    // Check if next player has a wild-draw-four card to stack
                    gameState.drawStack += 4;
                } else {
                    // Draw 4 cards from deck to next player's hand
                    for (let i = 0; i < 4; i++) {
                        if (gameState.deck.length === 0) {
                            this.reshuffleDeck(gameState);
                        }
                        gameState.playerHands[draw4PlayerId].push(gameState.deck.pop());
                    }
                    
                    // Skip next player
                    gameState.currentPlayer = playerOrder[(draw4Index + gameState.direction + playerOrder.length) % playerOrder.length];
                }
                break;
                
            default:
                // Regular card or wild, move to next player
                gameState.currentPlayer = playerOrder[(currentPlayerIndex + gameState.direction + playerOrder.length) % playerOrder.length];
        }
    }
    
    // Check if a card can be played
    canPlayCard(card, topCard, currentColor, drawStack) {
        // If there's a draw stack, can only play +2 or +4
        if (drawStack > 0) {
            if (card.value === 'draw2' && topCard.value === 'draw2') {
                return true;
            }
            
            if (card.value === 'wild-draw-four') {
                return true;
            }
            
            return false;
        }
        
        // Wild cards can always be played
        if (card.type === 'wild') {
            return true;
        }
        
        // Match color
        if (card.color === currentColor) {
            return true;
        }
        
        // Match value
        if (card.value === topCard.value) {
            return true;
        }
        
        return false;
    }
    
    // Reshuffle discard pile into deck
    reshuffleDeck(gameState) {
        // Keep the top card
        const topCard = gameState.discardPile.shift();
        
        // Shuffle the rest back into the deck
        gameState.deck = gameState.discardPile.slice();
        gameState.discardPile = [topCard];
        
        // Shuffle the deck
        for (let i = gameState.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
        }
    }
    
    // Draw card from deck
    async drawCard() {
        if (!this.currentRoomCode || !this.currentPlayerId) {
            return { success: false, error: 'Você não está em uma sala.' };
        }
        
        try {
            // Get current game state
            const gameStateRef = this.roomsRef.child(`${this.currentRoomCode}/gameState`);
            const snapshot = await gameStateRef.once('value');
            const gameState = snapshot.val();
            
            if (!gameState) {
                return { success: false, error: 'Estado do jogo não encontrado.' };
            }
            
            // Check if it's the player's turn
            if (gameState.currentPlayer !== this.currentPlayerId) {
                return { success: false, error: 'Não é sua vez de jogar.' };
            }
            
            // If there's a draw stack, draw that many cards
            if (gameState.drawStack > 0) {
                const drawCount = gameState.drawStack;
                
                // Draw cards from deck
                const playerHand = gameState.playerHands[this.currentPlayerId];
                for (let i = 0; i < drawCount; i++) {
                    if (gameState.deck.length === 0) {
                        this.reshuffleDeck(gameState);
                    }
                    playerHand.push(gameState.deck.pop());
                }
                
                // Reset draw stack
                gameState.drawStack = 0;
                
                // Move to next player
                const playerOrder = gameState.playerOrder;
                const currentPlayerIndex = playerOrder.indexOf(gameState.currentPlayer);
                gameState.currentPlayer = playerOrder[(currentPlayerIndex + gameState.direction + playerOrder.length) % playerOrder.length];
                
                // Record last action
                gameState.lastAction = {
                    type: 'drawStack',
                    player: this.currentPlayerId,
                    cardCount: drawCount,
                    timestamp: Date.now()
                };
                
                // Update game state
                await gameStateRef.set(gameState);
                
                // Notify about cards drawn
                const playerName = this.getPlayerName();
                this.chatSystem.sendSystemMessage(`${playerName} comprou ${drawCount} cartas.`);
                
                return { success: true, drawnCards: drawCount };
            }
            
            // Draw one card
            const playerHand = gameState.playerHands[this.currentPlayerId];
            if (gameState.deck.length === 0) {
                this.reshuffleDeck(gameState);
            }
            
            const drawnCard = gameState.deck.pop();
            playerHand.push(drawnCard);
            
            // Check if drawn card can be played
            const canPlay = this.canPlayCard(drawnCard, gameState.discardPile[0], gameState.currentColor, 0);
            
            // Check force play rule
            const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
            const room = roomSnapshot.val();
            
            if (room.customRules?.forcePlay && canPlay) {
                // Card must be played immediately
                return { 
                    success: true, 
                    drawnCard, 
                    canPlay, 
                    mustPlay: true 
                };
            }
            
            // Move to next player
            const playerOrder = gameState.playerOrder;
            const currentPlayerIndex = playerOrder.indexOf(gameState.currentPlayer);
            gameState.currentPlayer = playerOrder[(currentPlayerIndex + gameState.direction + playerOrder.length) % playerOrder.length];
            
            // Record last action
            gameState.lastAction = {
                type: 'drawCard',
                player: this.currentPlayerId,
                card: drawnCard,
                timestamp: Date.now()
            };
            
            // Update game state
            await gameStateRef.set(gameState);
            
            // Notify about card drawn
            const playerName = this.getPlayerName();
            this.chatSystem.sendSystemMessage(`${playerName} comprou uma carta.`);
            
            return { success: true, drawnCard, canPlay };
        } catch (error) {
            console.error('Erro ao comprar carta:', error);
            return { success: false, error: 'Falha ao comprar carta. Tente novamente.' };
        }
    }
    
    // End the game
    async endGame(winnerId) {
        try {
            // Update room status
            await this.roomsRef.child(`${this.currentRoomCode}/status`).set('completed');
            await this.roomsRef.child(`${this.currentRoomCode}/gameEndedAt`).set(firebase.database.ServerValue.TIMESTAMP);
            await this.roomsRef.child(`${this.currentRoomCode}/winner`).set(winnerId);
            
            // Calculate final scores
            const gameStateRef = this.roomsRef.child(`${this.currentRoomCode}/gameState`);
            const snapshot = await gameStateRef.once('value');
            const gameState = snapshot.val();
            
            if (gameState) {
                const scores = {};
                let totalPoints = 0;
                
                // Calculate scores for each player
                for (const playerId in gameState.playerHands) {
                    if (playerId === winnerId) {
                        scores[playerId] = 0;
                    } else {
                        const hand = gameState.playerHands[playerId];
                        let points = 0;
                        
                        hand.forEach(card => {
                            if (card.type === 'number') {
                                points += parseInt(card.value);
                            } else if (card.type === 'action') {
                                points += 20;
                            } else if (card.type === 'wild') {
                                points += 50;
                            }
                        });
                        
                        scores[playerId] = points;
                        totalPoints += points;
                    }
                }
                
                // Save scores
                await this.roomsRef.child(`${this.currentRoomCode}/finalScores`).set({
                    scores,
                    totalPoints,
                    winner: winnerId
                });
            }
            
            // Get winner name
            const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
            const roomData = roomSnapshot.val();
            const winnerName = roomData.players[winnerId]?.name || 'Jogador desconhecido';
            
            // Notify through chat
            this.chatSystem.sendSystemMessage(`${winnerName} venceu o jogo! Parabéns!`);
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao finalizar jogo:', error);
            return { success: false, error: 'Falha ao finalizar o jogo.' };
        }
    }
    
    // Call UNO
    async callUno() {
        if (!this.currentRoomCode || !this.currentPlayerId) {
            return { success: false, error: 'Você não está em uma sala.' };
        }
        
        try {
            // Get current game state
            const gameStateRef = this.roomsRef.child(`${this.currentRoomCode}/gameState`);
            const snapshot = await gameStateRef.once('value');
            const gameState = snapshot.val();
            
            if (!gameState) {
                return { success: false, error: 'Estado do jogo não encontrado.' };
            }
            
            // Get player hand
            const playerHand = gameState.playerHands[this.currentPlayerId];
            
            // Check if player has exactly one card
            if (playerHand.length !== 1) {
                // Penalize player for false UNO call
                if (playerHand.length > 1) {
                    // Draw 2 cards for false UNO
                    for (let i = 0; i < 2; i++) {
                        if (gameState.deck.length === 0) {
                            this.reshuffleDeck(gameState);
                        }
                        playerHand.push(gameState.deck.pop());
                    }
                    
                    // Record last action
                    gameState.lastAction = {
                        type: 'falseUno',
                        player: this.currentPlayerId,
                        timestamp: Date.now()
                    };
                    
                    // Update game state
                    await gameStateRef.set(gameState);
                    
                    // Notify about false UNO
                    const playerName = this.getPlayerName();
                    this.chatSystem.sendSystemMessage(`${playerName} chamou UNO incorretamente e comprou 2 cartas!`);
                    
                    return { success: false, error: 'Você não tem apenas uma carta. Penalidade aplicada.' };
                }
                
                return { success: false, error: 'Você não tem apenas uma carta.' };
            }
            
            // Record UNO called
            gameState.unoCalled = this.currentPlayerId;
            
            // Record last action
            gameState.lastAction = {
                type: 'callUno',
                player: this.currentPlayerId,
                timestamp: Date.now()
            };
            
            // Update game state
            await gameStateRef.set(gameState);
            
            // Notify about UNO
            const playerName = this.getPlayerName();
            this.chatSystem.sendSystemMessage(`${playerName} chamou UNO!`);
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao chamar UNO:', error);
            return { success: false, error: 'Falha ao chamar UNO. Tente novamente.' };
        }
    }
    
    // Challenge player for not calling UNO
    async challengeUno(targetPlayerId) {
        if (!this.currentRoomCode || !this.currentPlayerId) {
            return { success: false, error: 'Você não está em uma sala.' };
        }
        
        try {
            // Get current game state
            const gameStateRef = this.roomsRef.child(`${this.currentRoomCode}/gameState`);
            const snapshot = await gameStateRef.once('value');
            const gameState = snapshot.val();
            
            if (!gameState) {
                return { success: false, error: 'Estado do jogo não encontrado.' };
            }
            
            // Check if target player exists
            if (!gameState.playerHands[targetPlayerId]) {
                return { success: false, error: 'Jogador não encontrado.' };
            }
            
            // Get target player hand
            const targetHand = gameState.playerHands[targetPlayerId];
            
            // Check if target player has exactly one card and hasn't called UNO
            if (targetHand.length === 1 && gameState.unoCalled !== targetPlayerId) {
                // Penalize player for not calling UNO
                for (let i = 0; i < 2; i++) {
                    if (gameState.deck.length === 0) {
                        this.reshuffleDeck(gameState);
                    }
                    targetHand.push(gameState.deck.pop());
                }
                
                // Record last action
                gameState.lastAction = {
                    type: 'challengeUno',
                    challenger: this.currentPlayerId,
                    target: targetPlayerId,
                    successful: true,
                    timestamp: Date.now()
                };
                
                // Update game state
                await gameStateRef.set(gameState);
                
                // Get player names
                const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
                const roomData = roomSnapshot.val();
                const challengerName = roomData.players[this.currentPlayerId]?.name || 'Jogador desconhecido';
                const targetName = roomData.players[targetPlayerId]?.name || 'Jogador desconhecido';
                
                // Notify about successful challenge
                this.chatSystem.sendSystemMessage(`${challengerName} acusou ${targetName} de não ter chamado UNO! ${targetName} comprou 2 cartas.`);
                
                return { success: true };
            } else {
                // Penalize challenger for false accusation
                const challengerHand = gameState.playerHands[this.currentPlayerId];
                if (gameState.deck.length === 0) {
                    this.reshuffleDeck(gameState);
                }
                challengerHand.push(gameState.deck.pop());
                
                // Record last action
                gameState.lastAction = {
                    type: 'challengeUno',
                    challenger: this.currentPlayerId,
                    target: targetPlayerId,
                    successful: false,
                    timestamp: Date.now()
                };
                
                // Update game state
                await gameStateRef.set(gameState);
                
                // Get player names
                const roomSnapshot = await this.roomsRef.child(this.currentRoomCode).once('value');
                const roomData = roomSnapshot.val();
                const challengerName = roomData.players[this.currentPlayerId]?.name || 'Jogador desconhecido';
                const targetName = roomData.players[targetPlayerId]?.name || 'Jogador desconhecido';
                
                // Notify about failed challenge
                this.chatSystem.sendSystemMessage(`${challengerName} acusou ${targetName} incorretamente! ${challengerName} comprou 1 carta.`);
                
                return { success: false, error: 'Acusação inválida. Penalidade aplicada.' };
            }
        } catch (error) {
            console.error('Erro ao desafiar UNO:', error);
            return { success: false, error: 'Falha ao desafiar UNO. Tente novamente.' };
        }
    }
}

// Enhance UI
function enhanceGameUI() {
    // Add CSS enhancements
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Enhanced card display */
        .card {
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                        box-shadow 0.3s ease,
                        margin 0.2s ease;
        }
        
        .player-hand .card:hover {
            transform: translateY(-30px) scale(1.05);
            z-index: 10;
            box-shadow: 0 15px 25px rgba(0, 0, 0, 0.3);
        }
        
        /* Card count badges for opponents */
        .opponent {
            position: relative;
        }
        
        .card-count-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background-color: #e81e24;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        
        /* Card animations */
        @keyframes cardDraw {
            0% { transform: translateY(-50px) scale(0.8); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        .card-drawn {
            animation: cardDraw 0.5s forwards;
        }
        
        @keyframes cardPlay {
            0% { transform: translateY(0); }
            50% { transform: translateY(-100px) scale(1.1) rotate(5deg); }
            100% { transform: translateY(0) scale(1) rotate(0); }
        }
        
        .card-played {
            animation: cardPlay 0.8s forwards;
        }
        
        /* Current player indicator */
        .current-player-indicator {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ffcc00;
            color: #333;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            z-index: 5;
        }
        
        /* Card amount warning (when player has few cards) */
        .few-cards {
            animation: pulse 1.5s infinite;
        }
        
        .one-card {
            animation: pulse 0.8s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(232, 30, 36, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(232, 30, 36, 0); }
            100% { box-shadow: 0 0 0 0 rgba(232, 30, 36, 0); }
        }
        
        /* Enhanced draw pile */
        .draw-pile {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .draw-pile:hover {
            transform: scale(1.05);
        }
        
        .draw-pile:active {
            transform: scale(0.95);
        }
        
        /* Game message enhancements */
        .game-messages {
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 20px;
            padding: 8px 15px;
            color: white;
            font-weight: 500;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        /* Turn indicator */
        .turn-indicator {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary-color);
            text-align: center;
            padding: 10px;
            margin-bottom: 10px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: var(--radius);
            box-shadow: var(--shadow-sm);
        }
        
        .dark-mode .turn-indicator {
            background-color: rgba(0, 0, 0, 0.2);
        }
    `;
    
    document.head.appendChild(styleElement);
    
    // Enhance card display by overriding the render method
    const originalRender = UnoCard.prototype.render;
    UnoCard.prototype.render = function(faceUp = true) {
        const card = originalRender.call(this, faceUp);
        
        // Add data attributes for enhanced interaction
        card.dataset.cardId = this.id;
        card.dataset.cardType = this.type;
        card.dataset.cardColor = this.color;
        card.dataset.cardValue = this.value;
        
        return card;
    };
    
    // Add functions to window object for debug access
    window.playCardById = function(cardId, chosenColor) {
        if (window.roomManager && window.roomManager.playCard) {
            window.roomManager.playCard(cardId, chosenColor)
                .then(result => {
                    console.log('Play card result:', result);
                })
                .catch(err => {
                    console.error('Error playing card:', err);
                });
        } else {
            console.error('Room manager not available');
        }
    };
    
    window.drawCard = function() {
        if (window.roomManager && window.roomManager.drawCard) {
            window.roomManager.drawCard()
                .then(result => {
                    console.log('Draw card result:', result);
                })
                .catch(err => {
                    console.error('Error drawing card:', err);
                });
        } else {
            console.error('Room manager not available');
        }
    };
    
    window.callUno = function() {
        if (window.roomManager && window.roomManager.callUno) {
            window.roomManager.callUno()
                .then(result => {
                    console.log('Call UNO result:', result);
                })
                .catch(err => {
                    console.error('Error calling UNO:', err);
                });
        } else {
            console.error('Room manager not available');
        }
    };
    
    // Override app.js initialization to use enhanced room manager
    // The original initialization happens in DOMContentLoaded
    window.addEventListener('load', function() {
        // Replace RoomManager with EnhancedRoomManager after initialization
        if (window.roomManager && window.roomManager instanceof RoomManager) {
            console.log('Enhancing room manager...');
            
            // Create enhanced room manager with same state
            const enhancedManager = new EnhancedRoomManager();
            enhancedManager.currentRoomCode = window.roomManager.currentRoomCode;
            enhancedManager.currentPlayerId = window.roomManager.currentPlayerId;
            enhancedManager.eventHandlers = window.roomManager.eventHandlers;
            
            // Replace global reference
            window.roomManager = enhancedManager;
            
            console.log('Room manager enhanced successfully');
        } else {
            console.log('Creating new enhanced room manager...');
            window.roomManager = new EnhancedRoomManager();
        }
        
        console.log('Game enhancements applied');
    });
}

// Call enhancement function
enhanceGameUI();