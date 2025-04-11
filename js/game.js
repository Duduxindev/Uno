/**
 * Lógica Principal do Jogo UNO
 * Última atualização: 2025-04-11 16:40:23
 * Desenvolvido por: Duduxindev
 */
class UnoGame {
    constructor(gameMode = 'normal', customOptions = {}) {
        this.players = [];
        this.deck = new UnoDeck(gameMode);
        this.gameMode = GameModes.getModeByName(gameMode, customOptions);
        this.currentPlayerIndex = 0;
        this.direction = 1; // 1 = sentido horário, -1 = sentido anti-horário
        this.gameStarted = false;
        this.gameEnded = false;
        this.winner = null;
        this.drawStack = 0; // Para regra de empilhamento
        this.currentColor = null;
        this.lastPlayedCard = null;
        this.turnTimeLimit = this.gameMode.options.timeLimit;
        this.turnStartTime = 0;
        this.turnTimerId = null;
        this.eventHandlers = {};
    }
    
    // Adicionar jogador ao jogo
    addPlayer(name, isAI = false) {
        const id = this.players.length;
        const player = new Player(id, name, isAI);
        
        // Definir o primeiro jogador como host
        if (id === 0) {
            player.isHost = true;
        }
        
        this.players.push(player);
        return player;
    }
    
    // Iniciar o jogo
    startGame() {
        if (this.players.length < 2) {
            throw new Error('São necessários pelo menos 2 jogadores para iniciar o jogo.');
        }
        
        // Distribuir 7 cartas para cada jogador
        for (let player of this.players) {
            player.clearHand();
            player.addCards(this.deck.drawCards(7));
        }
        
        // Virar a primeira carta
        const firstCard = this.deck.startGame();
        this.currentColor = this.deck.currentColor;
        this.lastPlayedCard = firstCard;
        
        // Escolher jogador inicial aleatoriamente
        this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
        
        // Aplicar efeito da primeira carta, se for especial
        if (firstCard.type !== 'number') {
            this.gameMode.applyCardEffect(this, firstCard);
        }
        
        this.gameStarted = true;
        this.gameEnded = false;
        this.winner = null;
        this.drawStack = 0;
        
        // Iniciar o timer do turno
        this.startTurnTimer();
        
        // Disparar evento de início do jogo
        this.fireEvent('gameStarted', { firstCard });
        
        // Se for IA, jogar automaticamente
        this.checkAndPlayAI();
        
        return true;
    }
    
    // Jogar uma carta
    playCard(playerId, cardId, chosenColor = null) {
        if (!this.gameStarted || this.gameEnded) {
            return { success: false, error: 'O jogo não está em andamento.' };
        }
        
        const currentPlayer = this.getCurrentPlayer();
        
        // Verificar se é o turno do jogador
        if (currentPlayer.id !== playerId) {
            // Verificar regra de Jump-In
            if (this.gameMode.isRuleActive('jumpIn')) {
                const jumpInResult = this.handleJumpIn(playerId, cardId);
                if (jumpInResult.success) {
                    return jumpInResult;
                }
            }
            
            return { success: false, error: 'Não é o turno deste jogador.' };
        }
        
        // Verificar se o jogador tem a carta
        const player = this.getPlayerById(playerId);
        if (!player.hasCard(cardId)) {
            return { success: false, error: 'Jogador não possui esta carta.' };
        }
        
        // Obter a carta
        const card = player.hand.find(c => c.id === cardId);
        
        // Verificar se a jogada é válida
        if (!this.isValidPlay(card)) {
            return { success: false, error: 'Jogada inválida.' };
        }
        
        // Para cartas +2/+4 em modo de empilhamento
        if (this.drawStack > 0) {
            // Se não for carta de +2 ou +4, não pode jogar
            if (!(card.value === 'draw2' || card.value === 'wild-draw-four')) {
                return { success: false, error: 'Você deve jogar uma carta +2 ou +4, ou comprar as cartas empilhadas.' };
            }
            
            // +2 só pode ser empilhado sobre +2, e +4 sobre qualquer um
            if (card.value === 'draw2' && this.lastPlayedCard.value !== 'draw2') {
                return { success: false, error: 'Você só pode empilhar +2 sobre outra carta +2.' };
            }
        }
        
        // Remover a carta da mão do jogador
        player.removeCard(cardId);
        
        // Adicionar a carta à pilha de descarte
        this.deck.playCard(card, chosenColor);
        this.lastPlayedCard = card;
        
        // Se for carta +2 ou +4, adicionar ao stack
        if (card.value === 'draw2') {
            this.drawStack += 2;
        } else if (card.value === 'wild-draw-four') {
            this.drawStack += 4;
        }
        
        // Aplicar efeito da carta
        this.gameMode.applyCardEffect(this, card, chosenColor);
        
        // Se o jogador ficou sem cartas, terminar o jogo
        if (player.hand.length === 0) {
            this.endGame(player);
            return { success: true, gameEnded: true, winner: player };
        }
        
        // Se o jogador ficou com 1 carta e não chamou UNO, penalizar
        if (player.hand.length === 1 && !player.hasCalledUno) {
            this.penalizeForNotCallingUno(player);
        }
        
        // Passar para o próximo jogador
        this.nextTurn();
        
        // Disparar evento de carta jogada
        this.fireEvent('cardPlayed', { player, card, chosenColor });
        
        return { success: true };
    }
    
    // Comprar carta
    drawCard(playerId) {
        if (!this.gameStarted || this.gameEnded) {
            return { success: false, error: 'O jogo não está em andamento.' };
        }
        
        const currentPlayer = this.getCurrentPlayer();
        
        // Verificar se é o turno do jogador
        if (currentPlayer.id !== playerId) {
            return { success: false, error: 'Não é o turno deste jogador.' };
        }
        
        const player = this.getPlayerById(playerId);
        
        // Se houver um stack de cartas para comprar
        if (this.drawStack > 0) {
            // Comprar as cartas do stack
            const cards = this.deck.drawCards(this.drawStack);
            player.addCards(cards);
            
            // Resetar o stack
            this.drawStack = 0;
            
            // Passar para o próximo jogador
            this.nextTurn();
            
            // Disparar evento de cartas compradas
            this.fireEvent('cardsDrawn', { player, count: cards.length });
            
            return { success: true, cards: cards };
        }
        
        // Comprar uma carta
        const card = this.deck.drawCard();
        player.addCard(card);
        
        // Atualizar estatísticas
        player.stats.cardsDrawn++;
        
        // Verificar se a carta pode ser jogada
        const canPlay = this.isValidPlay(card);
        
        // Se a regra de jogada forçada estiver ativa e a carta for jogável
        if (this.gameMode.isRuleActive('forcePlay') && canPlay) {
            // Jogar a carta automaticamente
            player.removeCard(card.id);
            this.deck.playCard(card);
            this.lastPlayedCard = card;
            
            // Aplicar efeito da carta
            if (card.type === 'wild') {
                // Para curinga, escolher cor automaticamente
                const chosenColor = this.getAIChosenColor(player);
                this.gameMode.applyCardEffect(this, card, chosenColor);
            } else {
                this.gameMode.applyCardEffect(this, card);
            }
            
            // Disparar evento de carta jogada automaticamente
            this.fireEvent('cardPlayed', { player, card, automatic: true });
            
            // Passar para o próximo jogador
            this.nextTurn();
            
            return { success: true, cardDrawn: card, cardPlayed: true };
        }
        
        // Verificar se a regra de "comprar até encontrar" está ativa
        if (this.gameMode.isRuleActive('drawToMatch') && !canPlay) {
            let drawnCount = 1;
            let drawnCards = [card];
            
            // Comprar até número máximo permitido ou até encontrar carta jogável
            while (drawnCount < this.gameMode.options.maxDrawCount) {
                // Verificar se o jogador tem carta jogável
                const playableCard = player.getPlayableCards(this.lastPlayedCard, this.currentColor).find(c => c);
                
                if (playableCard) {
                    break;
                }
                
                // Comprar outra carta
                const extraCard = this.deck.drawCard();
                player.addCard(extraCard);
                drawnCards.push(extraCard);
                drawnCount++;
                
                // Atualizar estatísticas
                player.stats.cardsDrawn++;
                
                // Se a carta for jogável, parar de comprar
                if (this.isValidPlay(extraCard)) {
                    break;
                }
            }
            
            // Disparar evento de múltiplas cartas compradas
            this.fireEvent('cardsDrawn', { player, count: drawnCount, cards: drawnCards });
            
            // Verificar se a última carta pode ser jogada
            const lastDrawnCard = drawnCards[drawnCards.length - 1];
            if (this.gameMode.isRuleActive('forcePlay') && this.isValidPlay(lastDrawnCard)) {
                // Jogar a carta automaticamente
                player.removeCard(lastDrawnCard.id);
                this.deck.playCard(lastDrawnCard);
                this.lastPlayedCard = lastDrawnCard;
                
                // Aplicar efeito da carta
                if (lastDrawnCard.type === 'wild') {
                    // Para curinga, escolher cor automaticamente
                    const chosenColor = this.getAIChosenColor(player);
                    this.gameMode.applyCardEffect(this, lastDrawnCard, chosenColor);
                } else {
                    this.gameMode.applyCardEffect(this, lastDrawnCard);
                }
                
                // Disparar evento de carta jogada automaticamente
                this.fireEvent('cardPlayed', { player, card: lastDrawnCard, automatic: true });
                
                // Passar para o próximo jogador
                this.nextTurn();
                
                return { success: true, cardsDrawn: drawnCards, cardPlayed: true };
            }
            
            // Passar para o próximo jogador
            this.nextTurn();
            
            return { success: true, cardsDrawn: drawnCards };
        }
        
        // Passar para o próximo jogador se não jogou nenhuma carta
        this.nextTurn();
        
        // Disparar evento de carta comprada
        this.fireEvent('cardDrawn', { player, card });
        
        return { success: true, cardDrawn: card, canPlay };
    }
    
    // Chamar UNO
    callUno(playerId) {
        if (!this.gameStarted || this.gameEnded) {
            return { success: false, error: 'O jogo não está em andamento.' };
        }
        
        const player = this.getPlayerById(playerId);
        
        if (!player) {
            return { success: false, error: 'Jogador não encontrado.' };
        }
        
        // Verificar se o jogador tem apenas uma carta
        if (player.hand.length !== 1) {
            // Penalizar jogador que chama UNO erroneamente
            if (player.hand.length > 1) {
                player.addCards(this.deck.drawCards(2));
                this.fireEvent('unoPenalty', { player, reason: 'called-prematurely' });
                return { success: false, error: 'Você não tem apenas uma carta.', penalty: true };
            }
            return { success: false, error: 'Você não tem apenas uma carta.' };
        }
        
        // Marcar que o jogador chamou UNO
        player.callUno();
        
        // Disparar evento de UNO chamado
        this.fireEvent('unoCalled', { player });
        
        return { success: true };
    }
    
    // Acusar outro jogador de não ter chamado UNO
    accuseNotCallingUno(accuserId, accusedId) {
        if (!this.gameStarted || this.gameEnded) {
            return { success: false, error: 'O jogo não está em andamento.' };
        }
        
        const accuser = this.getPlayerById(accuserId);
        const accused = this.getPlayerById(accusedId);
        
        if (!accuser || !accused) {
            return { success: false, error: 'Jogador não encontrado.' };
        }
        
        // Verificar se o acusado tem apenas uma carta e não chamou UNO
        if (accused.hand.length === 1 && !accused.hasCalledUno) {
            // Penalizar o jogador acusado
            accused.addCards(this.deck.drawCards(2));
            
            // Disparar evento de penalidade por não chamar UNO
            this.fireEvent('unoPenalty', { player: accused, accuser, reason: 'not-called' });
            
            return { success: true, penalty: true };
        }
        
        // Penalizar o acusador erroneamente
        accuser.addCards(this.deck.drawCards(1));
        
        // Disparar evento de penalidade por acusação falsa
        this.fireEvent('unoPenalty', { player: accuser, accused, reason: 'false-accusation' });
        
        return { success: false, error: 'Acusação improcedente.', penalty: true };
    }
    
    // Verificar se uma jogada é válida
    isValidPlay(card) {
        const topCard = this.lastPlayedCard;
        
        // Wild cards podem ser jogadas a qualquer momento
        if (card.type === 'wild') {
            return true;
        }
        
        // Mesma cor
        if (card.color === this.currentColor) {
            return true;
        }
        
        // Mesmo valor/símbolo
        if (card.value === topCard.value) {
            return true;
        }
        
        return false;
    }
    
    // Penalizar jogador por não chamar UNO
    penalizeForNotCallingUno(player) {
        if (this.gameMode.options.autoUno) {
            // Se o UNO automático estiver ativado, chamar UNO automaticamente
            player.callUno();
            this.fireEvent('unoCalled', { player, automatic: true });
        } else {
            // Caso contrário, penalizar o jogador
            player.addCards(this.deck.drawCards(2));
            this.fireEvent('unoPenalty', { player, reason: 'not-called-after-play' });
        }
    }
    
    // Passar para o próximo jogador
    nextTurn() {
        // Resetar o timer do turno atual
        this.clearTurnTimer();
        
        // Atualizar o índice do jogador atual
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        
        // Iniciar o timer do novo turno
        this.startTurnTimer();
        
        // Disparar evento de troca de turno
        this.fireEvent('turnChanged', { player: this.getCurrentPlayer() });
        
        // Se for IA, jogar automaticamente
        this.checkAndPlayAI();
    }
    
    // Verificar se o próximo jogador tem +2 (para regra de empilhamento)
    checkNextPlayerHasDraw2() {
        const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        const nextPlayer = this.players[nextPlayerIndex];
        
        return nextPlayer.hand.some(card => card.value === 'draw2');
    }
    
    // Verificar se o próximo jogador tem +4 (para regra de empilhamento)
    checkNextPlayerHasDraw4() {
        const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        const nextPlayer = this.players[nextPlayerIndex];
        
        return nextPlayer.hand.some(card => card.value === 'wild-draw-four');
    }
    
    // Fazer o próximo jogador comprar cartas
    nextPlayerDrawCards(count) {
        const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        const nextPlayer = this.players[nextPlayerIndex];
        
        const cards = this.deck.drawCards(count);
        nextPlayer.addCards(cards);
        nextPlayer.stats.cardsDrawn += count;
        
        // Disparar evento de cartas compradas
        this.fireEvent('cardsDrawn', { player: nextPlayer, count, reason: 'penalty' });
    }
    
    // Pular o próximo jogador
    skipNextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        
        // Disparar evento de jogador pulado
        this.fireEvent('playerSkipped', { player: this.getCurrentPlayer() });
    }
    
    // Inverter a direção do jogo
    reverseDirection() {
        this.direction *= -1;
        
        // Disparar evento de direção invertida
        this.fireEvent('directionReversed', { newDirection: this.direction });
    }
    
    // Tratar regra do Seven (trocar mãos)
    handleSevenTrade() {
        const currentPlayer = this.getCurrentPlayer();
        
        // Perguntar com quem o jogador quer trocar (para IA, escolher aleatoriamente)
        let targetPlayerIndex;
        
        if (currentPlayer.isAI) {
            // IA escolhe aleatoriamente
            do {
                targetPlayerIndex = Math.floor(Math.random() * this.players.length);
            } while (targetPlayerIndex === this.currentPlayerIndex);
        } else {
            // Para jogador humano, perguntar
            // (Implementação depende da interface, aqui usamos aleatório como fallback)
            do {
                targetPlayerIndex = Math.floor(Math.random() * this.players.length);
            } while (targetPlayerIndex === this.currentPlayerIndex);
        }
        
        const targetPlayer = this.players[targetPlayerIndex];
        
        // Trocar as mãos
        currentPlayer.swapHandWith(targetPlayer);
        
        // Disparar evento de troca de mãos
        this.fireEvent('handSwapped', { player1: currentPlayer, player2: targetPlayer });
    }
    
    // Tratar regra do Zero (rotacionar mãos)
    handleZeroRotate() {
        // Salvar as mãos atuais
        const hands = this.players.map(player => [...player.hand]);
        
        // Rotacionar as mãos na direção do jogo
        for (let i = 0; i < this.players.length; i++) {
            const nextIndex = (i + this.direction + this.players.length) % this.players.length;
            this.players[nextIndex].hand = hands[i];
            this.players[nextIndex].hasCalledUno = false;
        }
        
        // Disparar evento de rotação de mãos
        this.fireEvent('handsRotated', { direction: this.direction });
    }
    
    // Tratar regra de Jump-In
    handleJumpIn(playerId, cardId) {
        const player = this.getPlayerById(playerId);
        
        if (!player) {
            return { success: false, error: 'Jogador não encontrado.' };
        }
        
        // Verificar se o jogador tem a carta
        if (!player.hasCard(cardId)) {
            return { success: false, error: 'Jogador não possui esta carta.' };
        }
        
        // Obter a carta
        const card = player.hand.find(c => c.id === cardId);
        
        // Verificar se é uma carta idêntica à do topo
        if (!(card.color === this.lastPlayedCard.color && card.value === this.lastPlayedCard.value)) {
            return { success: false, error: 'Jump-In só é permitido com cartas idênticas.' };
        }
        
        // Remover a carta da mão do jogador
        player.removeCard(cardId);
        
        // Adicionar a carta à pilha de descarte
        this.deck.playCard(card);
        this.lastPlayedCard = card;
        
        // Resetar o timer do turno atual
        this.clearTurnTimer();
        
        // Atualizar o jogador atual
        this.currentPlayerIndex = player.id;
        
        // Aplicar efeito da carta
        this.gameMode.applyCardEffect(this, card);
        
        // Se o jogador ficou sem cartas, terminar o jogo
        if (player.hand.length === 0) {
            this.endGame(player);
            return { success: true, gameEnded: true, winner: player };
        }
        
        // Se o jogador ficou com 1 carta e não chamou UNO, penalizar
        if (player.hand.length === 1 && !player.hasCalledUno) {
            this.penalizeForNotCallingUno(player);
        }
        
        // Passar para o próximo jogador
        this.nextTurn();
        
        // Disparar evento de Jump-In
        this.fireEvent('jumpIn', { player, card });
        
        return { success: true };
    }
    
    // Finalizar o jogo
    endGame(winner) {
        this.gameEnded = true;
        this.winner = winner;
        this.clearTurnTimer();
        
        // Calcular pontuação final (cartas restantes dos oponentes)
        const scores = {};
        let totalPoints = 0;
        
        for (const player of this.players) {
            if (player.id === winner.id) {
                scores[player.id] = 0;
                continue;
            }
            
            let points = 0;
            for (const card of player.hand) {
                if (card.type === 'number') {
                    points += parseInt(card.value);
                } else if (card.type === 'action') {
                    points += 20;
                } else if (card.type === 'wild') {
                    points += 50;
                }
            }
            
            scores[player.id] = points;
            totalPoints += points;
        }
        
        // Disparar evento de fim de jogo
        this.fireEvent('gameEnded', { winner, scores, totalPoints });
        
        return { winner, scores, totalPoints };
    }
    
    // Iniciar o timer do turno
    startTurnTimer() {
        if (!this.gameMode.options.turnTimer || this.turnTimeLimit <= 0) {
            return;
        }
        
        this.turnStartTime = Date.now();
        
        this.turnTimerId = setTimeout(() => {
            // Tempo esgotado, jogador atual deve comprar uma carta e passar
            const currentPlayer = this.getCurrentPlayer();
            
            if (currentPlayer.isAI) {
                // IA nunca deve chegar aqui, mas por precaução
                return;
            }
            
            // Comprar uma carta automaticamente
            const card = this.deck.drawCard();
            currentPlayer.addCard(card);
            currentPlayer.stats.cardsDrawn++;
            
            // Disparar evento de tempo esgotado
            this.fireEvent('turnTimeout', { player: currentPlayer, cardDrawn: card });
            
            // Passar para o próximo jogador
            this.nextTurn();
        }, this.turnTimeLimit * 1000);
    }
    
    // Limpar o timer do turno
    clearTurnTimer() {
        if (this.turnTimerId) {
            clearTimeout(this.turnTimerId);
            this.turnTimerId = null;
        }
    }
    
    // Obter o tempo restante do turno atual (em segundos)
    getRemainingTurnTime() {
        if (!this.gameMode.options.turnTimer || this.turnTimeLimit <= 0 || !this.turnStartTime) {
            return 0;
        }
        
        const elapsed = (Date.now() - this.turnStartTime) / 1000;
        return Math.max(0, this.turnTimeLimit - elapsed);
    }
    
    // Verificar e jogar AI automaticamente
    checkAndPlayAI() {
        const currentPlayer = this.getCurrentPlayer();
        
        if (currentPlayer.isAI) {
            // Pequeno delay para simular "pensamento" da IA
            setTimeout(() => {
                this.playAI(currentPlayer);
            }, 1000);
        }
    }
    
    // Lógica da IA
    playAI(aiPlayer) {
        if (this.gameEnded || this.getCurrentPlayer().id !== aiPlayer.id) {
            return;
        }
        
        // Se houver um stack de cartas para comprar, verificar se tem carta para empilhar
        if (this.drawStack > 0) {
            // Procurar por cartas +2/+4 para empilhar
            let stackCard = null;
            
            // Primeiro tentar +2 se a carta do topo for +2
            if (this.lastPlayedCard.value === 'draw2') {
                stackCard = aiPlayer.hand.find(c => c.value === 'draw2');
            }
            
            // Se não encontrou +2 ou a carta do topo não é +2, tentar +4
            if (!stackCard) {
                stackCard = aiPlayer.hand.find(c => c.value === 'wild-draw-four');
            }
            
            if (stackCard) {
                // Jogar a carta
                const chosenColor = stackCard.type === 'wild' ? this.getAIChosenColor(aiPlayer) : null;
                this.playCard(aiPlayer.id, stackCard.id, chosenColor);
                return;
            }
            
            // Se não tem carta para empilhar, comprar as cartas
            this.drawCard(aiPlayer.id);
            return;
        }
        
        // Verificar cartas jogáveis
        const playableCards = aiPlayer.getPlayableCards(this.lastPlayedCard, this.currentColor);
        
        if (playableCards.length > 0) {
            // Estratégia simples: jogar a primeira carta jogável
            // Em uma implementação mais avançada, poderia escolher a "melhor" carta
            const cardToPlay = playableCards[0];
            
            // Se é uma carta curinga, escolher uma cor
            if (cardToPlay.type === 'wild') {
                const chosenColor = this.getAIChosenColor(aiPlayer);
                this.playCard(aiPlayer.id, cardToPlay.id, chosenColor);
            } else {
                this.playCard(aiPlayer.id, cardToPlay.id);
            }
            
            // Se ficou com uma carta, chamar UNO automaticamente
            if (aiPlayer.hand.length === 1) {
                aiPlayer.callUno();
                this.fireEvent('unoCalled', { player: aiPlayer, automatic: true });
            }
        } else {
            // Comprar uma carta
            this.drawCard(aiPlayer.id);
        }
    }
    
    // IA escolhe uma cor para cartas curinga
    getAIChosenColor(aiPlayer) {
        // Contar cartas por cor na mão do jogador
        const colorCounts = {
            red: 0,
            blue: 0,
            green: 0,
            yellow: 0
        };
        
        for (const card of aiPlayer.hand) {
            if (card.color !== 'black') {
                colorCounts[card.color]++;
            }
        }
        
        // Escolher a cor com mais cartas
        let maxCount = 0;
        let chosenColor = 'red'; // Cor padrão
        
        for (const [color, count] of Object.entries(colorCounts)) {
            if (count > maxCount) {
                maxCount = count;
                chosenColor = color;
            }
        }
        
        return chosenColor;
    }
    
    // Obter jogador atual
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    // Obter jogador pelo ID
    getPlayerById(id) {
        return this.players.find(player => player.id === id);
    }
    
    // Adicionar listeners de eventos
    addEventListener(event, callback) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        
        this.eventHandlers[event].push(callback);
    }
    
    // Remover listeners de eventos
    removeEventListener(event, callback) {
        if (!this.eventHandlers[event]) {
            return;
        }
        
        this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
    }
    
    // Disparar evento
    fireEvent(event, data) {
        if (!this.eventHandlers[event]) {
            return;
        }
        
        for (const callback of this.eventHandlers[event]) {
            callback(data);
        }
    }
    
    // Serializar jogo para armazenamento/transferência
    toJSON() {
        return {
            players: this.players.map(player => player.toJSON()),
            deck: this.deck.toJSON(),
            gameMode: this.gameMode.toJSON(),
            currentPlayerIndex: this.currentPlayerIndex,
            direction: this.direction,
            gameStarted: this.gameStarted,
            gameEnded: this.gameEnded,
            winner: this.winner ? this.winner.id : null,
            drawStack: this.drawStack,
            currentColor: this.currentColor,
            lastPlayedCard: this.lastPlayedCard ? this.lastPlayedCard.toJSON() : null
        };
    }
}