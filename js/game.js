/**
 * Gerenciamento do Jogo
 */
class UnoGame {
    constructor(gameMode = 'normal', customRules = {}) {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.direction = 1; // 1 para sentido horário, -1 para anti-horário
        this.isGameOver = false;
        this.winner = null;
        this.deck = new UnoDeck(gameMode);
        this.gameMode = createGameMode(gameMode, customRules);
        this.drawStack = 0; // Para modos com empilhamento
        this.eventListeners = {};
        this.colorSelectCallback = null;
        this.playerChoiceCallback = null;
        this.unoButtonTimeout = null;
        this.unoCallRequired = false;
    }
    
    // Adiciona um ouvinte para eventos do jogo
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
    
    // Dispara um evento
    emit(eventName, data) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => callback(data));
        }
    }
    
    // Adiciona um jogador ao jogo
    addPlayer(name, isAI = false) {
        const id = this.players.length;
        const player = new Player(id, name, isAI);
        this.players.push(player);
        return player;
    }
    
    // Distribui as cartas para os jogadores
    dealCards() {
        // Cada jogador recebe 7 cartas
        this.players.forEach(player => {
            const cards = this.deck.drawCards(7);
            player.addCards(cards);
            player.sortHand();
        });
    }
    
    // Inicia o jogo
    startGame() {
        if (this.players.length < 2) {
            throw new Error("Precisa de pelo menos 2 jogadores para iniciar o jogo");
        }
        
        // Distribui as cartas iniciais
        this.dealCards();
        
        // Vira a primeira carta para iniciar
        const startingCard = this.deck.startGame();
        
        // Se a primeira carta for uma carta especial, aplica seu efeito
        if (startingCard.type !== 'number') {
            // Para cartas especiais na inicialização, simplificamos os efeitos
            if (startingCard.value === 'skip') {
                this.advanceToNextPlayer(); // Pula o primeiro jogador
            } else if (startingCard.value === 'reverse') {
                this.reverseDirection(); // Inverte a direção de jogo
            }
            // Ignoramos +2, +4 e wild na inicialização para simplicidade
        }
        
        // Emite evento de início de jogo
        this.emit('gameStart', {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.getCardCount(),
                isAI: p.isAI
            })),
            startingCard: startingCard,
            currentColor: this.deck.currentColor,
            currentPlayer: this.currentPlayerIndex
        });
        
        // Se o primeiro jogador for IA, faz seu movimento
        this.playAITurnIfNeeded();
    }
    
    // Obtém o jogador atual
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    // Obtém o ID do próximo jogador
    getNextPlayerId() {
        return (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
    }
    
    // Avança para o próximo jogador
    advanceToNextPlayer() {
        this.currentPlayerIndex = this.getNextPlayerId();
        this.emit('playerChanged', {
            currentPlayer: this.currentPlayerIndex
        });
        
        // Verifica se o próximo jogador é IA e faz sua jogada
        this.playAITurnIfNeeded();
    }
    
    // Inverte a direção do jogo
    reverseDirection() {
        this.direction *= -1;
        this.emit('directionChanged', {
            direction: this.direction
        });
    }
    
    // Faz a IA jogar quando for sua vez
    playAITurnIfNeeded() {
        const currentPlayer = this.getCurrentPlayer();
        
        if (currentPlayer.isAI && !this.isGameOver) {
            // Pequeno atraso para simular "pensamento" da IA
            setTimeout(() => {
                const aiMove = currentPlayer.playAI(this);
                
                if (aiMove.action === 'draw') {
                    this.drawCard(currentPlayer.id);
                } else if (aiMove.action === 'play') {
                    this.playCard(currentPlayer.id, aiMove.cardId, aiMove.chosenColor);
                    
                    // IA decide se chama UNO
                    if (currentPlayer.getCardCount() === 1) {
                        // 90% de chance da IA chamar UNO
                        if (Math.random() < 0.9) {
                            this.callUno(currentPlayer.id);
                        }
                    }
                }
            }, 1000); // Atraso de 1 segundo
        }
    }
    
    // Joga uma carta
    playCard(playerId, cardId, chosenColor = null) {
        // Verifica se é a vez do jogador
        if (playerId !== this.currentPlayerIndex) {
            // Verifica regra de jump-in (interrupção com carta idêntica)
            if (this.gameMode.rules.jumpIn) {
                const topCard = this.deck.getTopCard();
                const player = this.players[playerId];
                const card = player.hand.find(c => c.id === cardId);
                
                if (card && topCard.value === card.value && topCard.color === card.color) {
                    // Permite jogada fora de turno para jump-in
                    this.currentPlayerIndex = playerId;
                } else {
                    return { success: false, error: "Não é a sua vez" };
                }
            } else {
                return { success: false, error: "Não é a sua vez" };
            }
        }
        
        const player = this.players[playerId];
        const topCard = this.deck.getTopCard();
        const currentColor = this.deck.currentColor;
        
        // Encontra a carta na mão do jogador
        const card = player.hand.find(c => c.id === cardId);
        
        if (!card) {
            return { success: false, error: "Carta não encontrada" };
        }
        
        // Verifica se a carta pode ser jogada
        if (!card.canPlayOn(topCard, currentColor)) {
            return { success: false, error: "Jogada inválida" };
        }
        
        // Verifica se curinga precisa de cor selecionada
        if (card.type === 'wild' && !chosenColor) {
            // Armazena callback para quando a cor for escolhida
            this.colorSelectCallback = (color) => {
                this.playCard(playerId, cardId, color);
            };
            
            this.emit('colorSelectRequired', {
                playerId: playerId,
                cardId: cardId
            });
            
            return { success: true, waitingForColor: true };
        }
        
        // Joga a carta
        const playedCard = player.playCard(cardId);
        this.deck.playCard(playedCard, chosenColor);
        
        // Aplica efeitos da carta
        const effect = this.gameMode.applyCardEffect(this, playedCard, chosenColor);
        
        // Verifica se o jogador precisa escolher outro jogador (para carta 7)
        if (effect.requiresPlayerChoice) {
            this.playerChoiceCallback = (chosenPlayerId) => {
                this.applySevenSwap(playerId, chosenPlayerId);
            };
            
            this.emit('playerChoiceRequired', {
                playerId: playerId,
                effect: effect
            });
            
            // Não avança para o próximo jogador ainda
            return { success: true, waitingForPlayerChoice: true };
        }
        
        // Verifica se o jogador ganhou o jogo
        if (player.getCardCount() === 0) {
            this.endGame(playerId);
            return { success: true, gameOver: true, winner: playerId };
        }
        
        // Verifica se o jogador precisa chamar UNO
        if (player.getCardCount() === 1) {
            this.unoCallRequired = true;
            
            // Dá alguns segundos para o jogador chamar UNO
            this.unoButtonTimeout = setTimeout(() => {
                if (this.unoCallRequired && !player.calledUno) {
                    // Jogador não chamou UNO, é penalizado
                    const penaltyCards = this.deck.drawCards(2);
                    player.addCards(penaltyCards);
                    
                    this.emit('unoPenalty', {
                        playerId: playerId,
                        cardCount: penaltyCards.length
                    });
                    
                    this.unoCallRequired = false;
                }
            }, 3000); // 3 segundos para chamar UNO
        }
        
        // Avança para o próximo jogador se não houve empilhamento
        if (!effect.stacked) {
            this.advanceToNextPlayer();
        }
        
        // Emite evento de carta jogada
        this.emit('cardPlayed', {
            playerId: playerId,
            card: playedCard,
            effect: effect,
            currentColor: this.deck.currentColor,
            cardsLeft: player.getCardCount()
        });
        
        return { success: true };
    }
    
    // Aplica o efeito de troca de mãos da carta 7
    applySevenSwap(currentPlayerId, targetPlayerId) {
        if (currentPlayerId === targetPlayerId) {
            return { success: false, error: "Não pode trocar cartas consigo mesmo" };
        }
        
        const currentPlayer = this.players[currentPlayerId];
        const targetPlayer = this.players[targetPlayerId];
        
        // Troca as mãos
        const tempHand = [...currentPlayer.hand];
        currentPlayer.hand = [...targetPlayer.hand];
        targetPlayer.hand = tempHand;
        
        // Emite evento de troca
        this.emit('handsSwapped', {
            player1: currentPlayerId,
            player2: targetPlayerId,
            player1Cards: currentPlayer.getCardCount(),
            player2Cards: targetPlayer.getCardCount()
        });
        
        // Avança para o próximo jogador
        this.advanceToNextPlayer();
        
        return { success: true };
    }
    
    // Compra uma carta
    drawCard(playerId) {
        // Verifica se é a vez do jogador
        if (playerId !== this.currentPlayerIndex) {
            return { success: false, error: "Não é a sua vez" };
        }
        
        const player = this.players[playerId];
        const topCard = this.deck.getTopCard();
        const currentColor = this.deck.currentColor;
        
        // Se houver um stack de +2/+4, o jogador deve comprar todas
        if (this.drawStack > 0) {
            const drawnCards = this.deck.drawCards(this.drawStack);
            player.addCards(drawnCards);
            
            this.emit('cardsDrawn', {
                playerId: playerId,
                count: this.drawStack,
                cardCount: player.getCardCount()
            });
            
            this.drawStack = 0;
            this.advanceToNextPlayer();
            
            return { success: true, drawnCards: drawnCards.length };
        }
        
        // Verifica se o jogador já tem uma carta que pode jogar
        if (player.hasPlayableCard(topCard, currentColor)) {
            return { success: false, error: "Você já tem uma carta que pode jogar" };
        }
        
        // Compra uma carta
        const drawnCard = this.deck.drawCard();
        player.addCard(drawnCard);
        
        // Emite evento de carta comprada
        this.emit('cardDrawn', {
            playerId: playerId,
            card: drawnCard,
            cardCount: player.getCardCount()
        });
        
        // Verifica se a carta comprada pode ser jogada
        if (drawnCard.canPlayOn(topCard, currentColor)) {
            if (this.gameMode.rules.forcePlay) {
                // O jogador deve jogar a carta comprada
                return this.playCard(playerId, drawnCard.id);
            }
            
            // Permite ao jogador escolher se quer jogar a carta comprada
            return { 
                success: true, 
                canPlayDrawnCard: true, 
                drawnCard: drawnCard 
            };
        }
        
        // Se não pode jogar a carta comprada, verifica regra de compra até encontrar
        if (this.gameMode.rules.drawToMatch) {
            // Avança para o próximo jogador
            this.advanceToNextPlayer();
        }
        
        return { success: true };
    }
    
    // Jogador chama UNO
    callUno(playerId) {
        const player = this.players[playerId];
        
        if (player.getCardCount() !== 1) {
            // Jogador chamou UNO sem ter uma carta, penalização
            if (player.getCardCount() > 1) {
                const penaltyCards = this.deck.drawCards(2);
                player.addCards(penaltyCards);
                
                this.emit('unoPenalty', {
                    playerId: playerId,
                    cardCount: penaltyCards.length,
                    reason: 'chamada-antecipada'
                });
                
                return { success: false, error: "Chamou UNO cedo demais!" };
            }
            
            return { success: false, error: "Você só pode chamar UNO quando tiver uma carta" };
        }
        
        player.callUno();
        this.unoCallRequired = false;
        
        if (this.unoButtonTimeout) {
            clearTimeout(this.unoButtonTimeout);
            this.unoButtonTimeout = null;
        }
        
        this.emit('unoCalled', {
            playerId: playerId
        });
        
        return { success: true };
    }
    
    // Denuncia que jogador não chamou UNO
    callOutMissingUno(callerPlayerId, targetPlayerId) {
        const targetPlayer = this.players[targetPlayerId];
        
        if (targetPlayer.getCardCount() !== 1 || targetPlayer.calledUno) {
            // Denúncia errada, penaliza o denunciante
            const caller = this.players[callerPlayerId];
            const penaltyCards = this.deck.drawCards(2);
            caller.addCards(penaltyCards);
            
            this.emit('unoPenalty', {
                playerId: callerPlayerId,
                cardCount: penaltyCards.length,
                reason: 'denúncia-errada'
            });
            
            return { success: false, error: "Denúncia errada!" };
        }
        
        // Denúncia correta, penaliza o alvo
        const penaltyCards = this.deck.drawCards(2);
        targetPlayer.addCards(penaltyCards);
        
        this.emit('unoPenalty', {
            playerId: targetPlayerId,
            calledBy: callerPlayerId,
            cardCount: penaltyCards.length,
            reason: 'não-chamou-uno'
        });
        
        return { success: true };
    }
    
    // Finaliza o jogo
    endGame(winnerId) {
        this.isGameOver = true;
        this.winner = winnerId;
        
        // Calcula pontuação
        const scores = this.calculateScores();
        
        this.emit('gameOver', {
            winner: winnerId,
            scores: scores,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cards: p.hand,
                stats: p.stats
            }))
        });
    }
    
    // Calcula pontuação final
    calculateScores() {
        const scores = this.players.map(player => {
            let score = 0;
            
            if (player.id !== this.winner) {
                player.hand.forEach(card => {
                    if (card.type === 'number') {
                        score += parseInt(card.value);
                    } else if (card.type === 'action') {
                        score += 20;
                    } else if (card.type === 'wild') {
                        score += 50;
                    }
                });
            }
            
            return {
                playerId: player.id,
                score: score
            };
        });
        
        return scores;
    }
    
    // Obtém estado atual do jogo
    getGameState(forPlayerId = null) {
        const state = {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.getCardCount(),
                isAI: p.isAI,
                isCurrentPlayer: p.id === this.currentPlayerIndex
            })),
            currentPlayer: this.currentPlayerIndex,
            direction: this.direction,
            topCard: this.deck.getTopCard(),
            currentColor: this.deck.currentColor,
            drawPileCount: this.deck.getRemainingCards(),
            drawStack: this.drawStack
        };
        
        // Adiciona cartas do jogador solicitante
        if (forPlayerId !== null) {
            const player = this.players[forPlayerId];
            state.hand = player.hand;
            state.playableCards = player.getPlayableCards(state.topCard, state.currentColor);
        }
        
        return state;
    }
}