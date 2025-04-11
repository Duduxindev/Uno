/**
 * Iniciador de Jogo UNO
 * Data: 2025-04-11 19:58:29
 * Desenvolvido por: Duduxindev
 */
class GameStarter {
    constructor(roomManager) {
        this.roomManager = roomManager;
        this.database = firebase.database();
        
        // Adicionar evento ao botão de iniciar jogo
        const startButton = document.getElementById('start-game-btn');
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }
    }
    
    async startGame() {
        console.log("Iniciando jogo...");
        const startButton = document.getElementById('start-game-btn');
        if (startButton) startButton.disabled = true;
        
        try {
            // Verificar se o usuário é o anfitrião
            const playerInfo = this.roomManager.getCurrentPlayerInfo();
            if (!playerInfo.roomCode || !playerInfo.playerId) {
                this.showError("Você não está em uma sala.");
                if (startButton) startButton.disabled = false;
                return;
            }
            
            const roomRef = this.database.ref(`rooms/${playerInfo.roomCode}`);
            const roomSnapshot = await roomRef.once('value');
            const roomData = roomSnapshot.val();
            
            if (!roomData) {
                this.showError("Sala não encontrada.");
                if (startButton) startButton.disabled = false;
                return;
            }
            
            // Verificar se é o anfitrião
            if (roomData.host !== playerInfo.playerId) {
                this.showError("Apenas o anfitrião pode iniciar o jogo.");
                if (startButton) startButton.disabled = false;
                return;
            }
            
            // Verificar número de jogadores
            const playerCount = Object.keys(roomData.players || {}).length;
            if (playerCount < 2) {
                this.showError("São necessários pelo menos 2 jogadores para iniciar.");
                if (startButton) startButton.disabled = false;
                return;
            }
            
            // Exibir animação de carregamento
            this.showLoading("Iniciando jogo...");
            
            // Ordenar jogadores (host primeiro, depois por ordem de entrada)
            const playersArray = Object.values(roomData.players);
            playersArray.sort((a, b) => {
                if (a.isHost) return -1;
                if (b.isHost) return 1;
                return a.joinedAt - b.joinedAt;
            });
            
            // Criar baralho inicial com base no modo de jogo
            const deck = this.createInitialDeck(roomData.gameMode);
            
            // Distribuir cartas para cada jogador
            const hands = {};
            for (const player of playersArray) {
                const hand = this.drawCards(deck.cards, 7);
                hands[player.id] = hand;
            }
            
            // Virar a primeira carta (não pode ser Wild Draw Four)
            let firstCard;
            do {
                firstCard = this.drawCards(deck.cards, 1)[0];
                
                // Se for Wild Draw Four, colocar de volta no baralho e tentar novamente
                if (firstCard.type === 'wild' && firstCard.value === 'wild-draw-four') {
                    deck.cards.unshift(firstCard);
                    firstCard = null;
                }
            } while (!firstCard);
            
            // Definir cor inicial para cartas curinga
            let initialColor = firstCard.color;
            if (firstCard.type === 'wild') {
                const colors = ['red', 'blue', 'green', 'yellow'];
                initialColor = colors[Math.floor(Math.random() * 4)];
            }
            
            // Criar o estado inicial do jogo
            const gameState = {
                status: 'playing',
                currentPlayerIndex: 0,
                direction: 1,
                hands: hands,
                deck: {
                    cards: deck.cards,
                    discardPile: [firstCard],
                    currentColor: initialColor
                },
                drawStack: 0,
                lastAction: {
                    type: 'gameStart',
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    playerId: playerInfo.playerId
                },
                startedAt: firebase.database.ServerValue.TIMESTAMP,
                gameMode: roomData.gameMode,
                customRules: roomData.customRules || {},
                turn: 0
            };
            
            // Aplicar efeitos da primeira carta (pular, inverter, etc.)
            if (firstCard.type === 'action') {
                switch (firstCard.value) {
                    case 'skip':
                        gameState.currentPlayerIndex = 1 % playersArray.length;
                        break;
                    case 'reverse':
                        gameState.direction = -1;
                        if (playersArray.length === 2) {
                            gameState.currentPlayerIndex = 1;
                        }
                        break;
                    case 'draw2':
                        // Dar 2 cartas para o primeiro jogador
                        const hand = gameState.hands[playersArray[0].id];
                        const additionalCards = this.drawCards(gameState.deck.cards, 2);
                        gameState.hands[playersArray[0].id] = [...hand, ...additionalCards];
                        gameState.currentPlayerIndex = 1 % playersArray.length;
                        break;
                }
            }
            
            // Salvar o estado do jogo e atualizar o status da sala
            await roomRef.child('game').set(gameState);
            await roomRef.child('status').set('playing');
            
            // Notificar os jogadores
            if (this.roomManager.chatManager) {
                this.roomManager.chatManager.sendSystemMessage('O jogo foi iniciado! Boa sorte a todos!');
                
                // Informar de quem é o turno
                const currentPlayer = playersArray[gameState.currentPlayerIndex];
                this.roomManager.chatManager.sendSystemMessage(`É a vez de ${currentPlayer.name}!`);
            }
            
            // Redirecionar para a tela do jogo
            this.redirectToGame();
            
        } catch (error) {
            console.error("Erro ao iniciar jogo:", error);
            this.showError(`Erro ao iniciar jogo: ${error.message}`);
            if (startButton) startButton.disabled = false;
        }
    }
    
    // Método para criar o baralho inicial
    createInitialDeck(gameMode) {
        const cards = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Gerar ID único para carta
        const generateCardId = () => {
            return Math.random().toString(36).substring(2, 10);
        };
        
        // Adicionar cartas numéricas (0-9)
        for (let color of colors) {
            // Cada cor tem apenas um '0'
            cards.push({
                id: `${color}-0-${generateCardId()}`,
                type: 'number',
                color: color,
                value: '0'
            });
            
            // E duas cartas de 1-9
            for (let i = 1; i <= 9; i++) {
                cards.push({
                    id: `${color}-${i}-${generateCardId()}`,
                    type: 'number',
                    color: color,
                    value: i.toString()
                });
                
                cards.push({
                    id: `${color}-${i}-${generateCardId()}`,
                    type: 'number',
                    color: color,
                    value: i.toString()
                });
            }
            
            // Cartas de ação
            for (let i = 0; i < 2; i++) {
                cards.push({
                    id: `${color}-skip-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'skip'
                });
                
                cards.push({
                    id: `${color}-reverse-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'reverse'
                });
                
                cards.push({
                    id: `${color}-draw2-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'draw2'
                });
            }
        }
        
        // Cartas curingas
        for (let i = 0; i < 4; i++) {
            cards.push({
                id: `wild-${generateCardId()}`,
                type: 'wild',
                color: 'black',
                value: 'wild'
            });
            
            cards.push({
                id: `wild-draw4-${generateCardId()}`,
                type: 'wild',
                color: 'black',
                value: 'wild-draw-four'
            });
        }
        
        // Adicionar cartas extras para modos especiais
        if (gameMode === 'wild' || gameMode === 'extreme' || gameMode === 'chaos') {
            // Mais cartas de ação
            for (let color of colors) {
                cards.push({
                    id: `${color}-skip-extra-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'skip'
                });
                
                cards.push({
                    id: `${color}-reverse-extra-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'reverse'
                });
                
                cards.push({
                    id: `${color}-draw2-extra-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'draw2'
                });
            }
            
            // Mais cartas curingas
            for (let i = 0; i < 2; i++) {
                cards.push({
                    id: `wild-extra-${generateCardId()}`,
                    type: 'wild',
                    color: 'black',
                    value: 'wild'
                });
                
                cards.push({
                    id: `wild-draw4-extra-${generateCardId()}`,
                    type: 'wild',
                    color: 'black',
                    value: 'wild-draw-four'
                });
            }
        }
        
        // Adicionar cartas especiais para modo Extreme
        if (gameMode === 'extreme' || gameMode === 'chaos') {
            for (let color of colors) {
                // Carta de troca
                cards.push({
                    id: `${color}-trade-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'trade'
                });
                
                // Carta de espiar
                cards.push({
                    id: `${color}-peek-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'peek'
                });
                
                // Carta de bloqueio
                cards.push({
                    id: `${color}-block-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'block'
                });
            }
        }
        
        // Embaralhar as cartas
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        
        return { cards };
    }
    
    // Comprar cartas do baralho
    drawCards(deck, count) {
        return deck.splice(deck.length - count, count);
    }
    
    // Mostrar mensagem de erro
    showError(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast show error';
            
            setTimeout(() => {
                toast.className = 'toast';
            }, 5000);
        } else {
            alert(message);
        }
    }
    
    // Mostrar animação de carregamento
    showLoading(message) {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        document.body.appendChild(loadingElement);
        
        // Remover após 5 segundos se o redirecionamento não ocorrer
        setTimeout(() => {
            if (document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }
        }, 5000);
    }
    
    // Redirecionar para a tela do jogo
    redirectToGame() {
        showScreen('game-screen');
    }
}

// Inicializar o Game Starter quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // O GameStarter será inicializado após a criação do RoomManager
    window.initGameStarter = (roomManager) => {
        window.gameStarter = new GameStarter(roomManager);
        console.log('Game Starter inicializado');
    };
});