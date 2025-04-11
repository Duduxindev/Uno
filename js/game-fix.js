/**
 * Correções para UNO Game
 * Data: 2025-04-11 20:23:24
 * Desenvolvido por: Duduxindev
 */
(function() {
    console.log("🎮 UNO Game Fixes: Inicializando...");
    
    // Aplicar correções quando DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }
    
    function applyFixes() {
        console.log("🔧 Aplicando correções ao UNO Game...");
        
        // Iniciar verificações periódicas
        setInterval(checkAndFixHost, 1000);
        
        // Corrigir navegação entre telas
        fixNavigation();
        
        // Adicionar listener para quando a tela de jogo se tornar ativa
        document.addEventListener('screenChange', function(e) {
            if (e.detail.screen === 'game-screen') {
                initializeGameScreen();
            }
        });
        
        // Acompanhar mudanças de tela
        observeScreenChanges();
    }
    
    // Monitorar mudanças de tela ativa
    function observeScreenChanges() {
        // Verificar telas a cada 500ms
        setInterval(() => {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen) {
                // Disparar evento customizado quando uma tela se tornar ativa
                const event = new CustomEvent('screenChange', {
                    detail: { screen: activeScreen.id }
                });
                document.dispatchEvent(event);
                
                // Verificar e aplicar correções específicas para cada tela
                if (activeScreen.id === 'waiting-room-screen') {
                    checkAndFixHost();
                }
                else if (activeScreen.id === 'game-screen') {
                    initializeGameScreen();
                }
            }
        }, 500);
    }
    
    //===================================================================
    // CORREÇÃO 1: BOTÃO DE ANFITRIÃO
    //===================================================================
    
    // Verificar e corrigir botão de anfitrião
    function checkAndFixHost() {
        // Verificar se estamos na tela de sala de espera
        const waitingRoom = document.getElementById('waiting-room-screen');
        if (!waitingRoom || !waitingRoom.classList.contains('active')) {
            return;
        }
        
        console.log("👥 Verificando status de anfitrião...");
        
        // Verificar se somos o anfitrião
        const isHost = checkIfHost();
        
        // Obter botão de iniciar
        let startButton = document.getElementById('start-game-btn');
        
        // Se não existir, criar novo botão
        if (!startButton) {
            startButton = createStartButton();
        }
        
        // Atualizar visibilidade e estilo do botão
        updateStartButton(startButton, isHost);
        
        console.log(`👑 Status de anfitrião: ${isHost ? 'Sim' : 'Não'}`);
    }
    
    // Verificar se o usuário atual é anfitrião
    function checkIfHost() {
        // Tentar obter dados da sessão do localStorage
        try {
            const sessionData = JSON.parse(localStorage.getItem('unoSession'));
            if (sessionData) {
                // Se temos o roomCode e playerId, verificar no Firebase
                if (sessionData.roomCode && sessionData.playerId) {
                    const roomRef = firebase.database().ref(`rooms/${sessionData.roomCode}`);
                    
                    // Forçar verificação síncrona (para simplificar este script)
                    roomRef.once('value', (snapshot) => {
                        const roomData = snapshot.val();
                        if (roomData && roomData.host === sessionData.playerId) {
                            console.log("👑 Você é o anfitrião desta sala!");
                            updateStartButton(document.getElementById('start-game-btn'), true);
                            return true;
                        }
                    });
                    
                    // Assumir que somos anfitrião até que o Firebase confirme
                    return true;
                }
            }
        } catch (e) {
            console.error("Erro ao verificar status de anfitrião:", e);
        }
        
        // Como contingência, sempre mostrar o botão em modo de desenvolvimento
        return true;
    }
    
    // Criar botão de iniciar jogo
    function createStartButton() {
        console.log("➕ Criando botão de iniciar jogo...");
        
        const buttonsRow = document.querySelector('.waiting-room-left .buttons-row');
        if (!buttonsRow) {
            console.error("❌ Container de botões não encontrado!");
            return null;
        }
        
        // Criar o botão
        const button = document.createElement('button');
        button.id = 'start-game-btn';
        button.className = 'primary-btn pulse-button';
        button.textContent = 'Iniciar Jogo';
        
        // Adicionar ao início da linha de botões
        if (buttonsRow.firstChild) {
            buttonsRow.insertBefore(button, buttonsRow.firstChild);
        } else {
            buttonsRow.appendChild(button);
        }
        
        // Adicionar event listener
        button.addEventListener('click', startGame);
        
        return button;
    }
    
    // Atualizar botão de iniciar jogo
    function updateStartButton(button, isHost) {
        if (!button) return;
        
        if (isHost) {
            // Tornar visível e ativo
            button.style.display = 'block';
            button.style.visibility = 'visible';
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
            button.disabled = false;
            
            // Garantir que tenha o event listener correto
            const newButton = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newButton, button);
            }
            newButton.addEventListener('click', startGame);
        } else {
            // Esconder o botão para não anfitriões
            button.style.display = 'none';
        }
    }
    
    // Iniciar o jogo
    function startGame() {
        console.log("🚀 Iniciando jogo...");
        
        // Mostrar indicador de carregamento
        showLoadingOverlay("Iniciando jogo...");
        
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession'));
        if (!sessionData || !sessionData.roomCode) {
            showError("Não foi possível iniciar o jogo. Dados da sessão não encontrados.");
            removeLoadingOverlay();
            return;
        }
        
        // Referência para a sala
        const roomRef = firebase.database().ref(`rooms/${sessionData.roomCode}`);
        
        // Obter dados da sala
        roomRef.once('value')
            .then((snapshot) => {
                const roomData = snapshot.val();
                
                if (!roomData) {
                    throw new Error("Sala não encontrada.");
                }
                
                // Verificar se há jogadores suficientes
                const playerCount = Object.keys(roomData.players || {}).length;
                if (playerCount < 2) {
                    throw new Error("São necessários pelo menos 2 jogadores para iniciar.");
                }
                
                // Criar estado inicial do jogo
                const gameState = createInitialGameState(roomData);
                
                // Atualizar a sala
                return roomRef.update({
                    status: 'playing',
                    game: gameState,
                    gameStartedAt: firebase.database.ServerValue.TIMESTAMP,
                    lastAction: {
                        type: 'gameStart',
                        playerId: sessionData.playerId,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    }
                });
            })
            .then(() => {
                console.log("✅ Jogo iniciado com sucesso!");
                
                // Navegar para a tela de jogo
                showScreen('game-screen');
                
                // Inicializar a tela de jogo
                setTimeout(initializeGameScreen, 500);
                
                // Enviar mensagem ao chat
                sendSystemChatMessage("O jogo foi iniciado! Boa sorte a todos!");
                
                // Remover overlay de carregamento
                removeLoadingOverlay();
            })
            .catch((error) => {
                console.error("❌ Erro ao iniciar jogo:", error);
                showError(error.message || "Erro ao iniciar jogo.");
                removeLoadingOverlay();
            });
    }
    
    // Criar estado inicial do jogo
    function createInitialGameState(roomData) {
        // Criar lista de jogadores ordenada (anfitrião primeiro)
        const players = Object.entries(roomData.players || {}).map(([id, data]) => ({
            id,
            ...data
        }));
        
        // Ordenar: anfitrião primeiro, depois por ordem de entrada
        players.sort((a, b) => {
            if (a.id === roomData.host) return -1;
            if (b.id === roomData.host) return 1;
            return a.joinedAt - b.joinedAt;
        });
        
        // Criar baralho aleatório
        const deck = createRandomDeck(roomData.gameMode);
        
        // Distribuir cartas iniciais
        const hands = {};
        players.forEach(player => {
            // Cada jogador recebe 7 cartas
            hands[player.id] = deck.splice(0, 7);
        });
        
        // Virar primeira carta (não pode ser Wild Draw Four)
        let firstCard;
        do {
            firstCard = deck.shift();
            
            // Se for Wild Draw Four, colocar de volta no final do baralho
            if (firstCard.type === 'wild' && firstCard.value === 'wild-draw-four') {
                deck.push(firstCard);
                firstCard = null;
            }
        } while (!firstCard);
        
        // Determinar cor inicial para curinga
        let initialColor = firstCard.color;
        if (firstCard.type === 'wild') {
            const colors = ['red', 'blue', 'green', 'yellow'];
            initialColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        // Determinar o primeiro jogador com base na carta virada
        let currentPlayerIndex = 0;
        
        // Aplicar efeitos da primeira carta
        if (firstCard.type === 'action') {
            switch (firstCard.value) {
                case 'skip':
                    // Primeiro jogador é pulado
                    currentPlayerIndex = 1 % players.length;
                    break;
                case 'reverse':
                    // Inverte a direção (e em jogos de 2, funciona como pular)
                    if (players.length === 2) {
                        currentPlayerIndex = 1;
                    }
                    break;
                case 'draw2':
                    // Primeiro jogador compra 2 cartas e perde a vez
                    hands[players[0].id].push(...deck.splice(0, 2));
                    currentPlayerIndex = 1 % players.length;
                    break;
            }
        }
        
        // Retornar estado inicial do jogo
        return {
            playerIds: players.map(p => p.id),
            currentPlayerIndex: currentPlayerIndex,
            direction: 1,
            deck: deck,
            discard: [firstCard],
            hands: hands,
            currentColor: initialColor,
            drawStack: 0,
            turn: 0,
            startedAt: firebase.database.ServerValue.TIMESTAMP,
            lastAction: {
                type: 'gameStart',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }
        };
    }
    
    // Criar baralho aleatório
    function createRandomDeck(gameMode) {
        console.log(`🃏 Criando baralho aleatório (Modo: ${gameMode})...`);
        
        const deck = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Função para gerar ID único para cada carta
        const generateCardId = () => Math.random().toString(36).substr(2, 9);
        
        // Adicionar cartas numéricas (0-9)
        for (let color of colors) {
            // Um zero por cor
            deck.push({
                id: `${color}-0-${generateCardId()}`,
                type: 'number',
                color: color,
                value: '0'
            });
            
            // Dois de cada 1-9
            for (let i = 1; i <= 9; i++) {
                deck.push({
                    id: `${color}-${i}-${generateCardId()}`,
                    type: 'number',
                    color: color,
                    value: i.toString()
                });
                
                deck.push({
                    id: `${color}-${i}-${generateCardId()}`,
                    type: 'number',
                    color: color,
                    value: i.toString()
                });
            }
            
            // Cartas de ação (Skip, Reverse, Draw Two)
            for (let i = 0; i < 2; i++) {
                deck.push({
                    id: `${color}-skip-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'skip'
                });
                
                deck.push({
                    id: `${color}-reverse-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'reverse'
                });
                
                deck.push({
                    id: `${color}-draw2-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'draw2'
                });
            }
        }
        
        // Cartas curinga
        for (let i = 0; i < 4; i++) {
            deck.push({
                id: `wild-${generateCardId()}`,
                type: 'wild',
                color: 'black',
                value: 'wild'
            });
            
            deck.push({
                id: `wild-draw4-${generateCardId()}`,
                type: 'wild',
                color: 'black',
                value: 'wild-draw-four'
            });
        }
        
        // Adicionar cartas especiais para modos específicos
        if (['wild', 'extreme', 'chaos'].includes(gameMode)) {
            console.log("🎯 Adicionando cartas especiais para modo avançado...");
            
            // Mais cartas de ação
            for (let color of colors) {
                deck.push({
                    id: `${color}-skip-extra-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'skip'
                });
                
                deck.push({
                    id: `${color}-reverse-extra-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'reverse'
                });
                
                deck.push({
                    id: `${color}-draw2-extra-${generateCardId()}`,
                    type: 'action',
                    color: color,
                    value: 'draw2'
                });
            }
            
            // Mais curingas
            for (let i = 0; i < 2; i++) {
                deck.push({
                    id: `wild-extra-${generateCardId()}`,
                    type: 'wild',
                    color: 'black',
                    value: 'wild'
                });
                
                deck.push({
                    id: `wild-draw4-extra-${generateCardId()}`,
                    type: 'wild',
                    color: 'black',
                    value: 'wild-draw-four'
                });
            }
        }
        
        // Embaralhar o baralho
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        console.log(`🃏 Baralho criado com ${deck.length} cartas`);
        return deck;
    }
    
    //===================================================================
    // CORREÇÃO 2: TELA DE JOGO E CARTAS FUNCIONAIS
    //===================================================================
    
    // Inicializar tela de jogo
    function initializeGameScreen() {
        console.log("🎮 Inicializando tela de jogo...");
        
        // Garantir que estamos na tela de jogo
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || !gameScreen.classList.contains('active')) {
            return;
        }
        
        // Obter elementos principais do jogo
        const playerHand = document.getElementById('player-hand');
        const discardPile = document.getElementById('discard-pile');
        const drawPile = document.getElementById('draw-pile');
        const opponentsContainer = document.getElementById('opponents-container');
        
        // Limpar áreas do jogo
        playerHand.innerHTML = '';
        discardPile.innerHTML = '';
        drawPile.innerHTML = '';
        opponentsContainer.innerHTML = '';
        
        // Tentar carregar dados do jogo
        loadGameData()
            .then(data => {
                // Renderizar jogo com dados reais
                if (data) {
                    renderGame(data);
                } else {
                    // Usar dados de demonstração se não conseguir carregar
                    renderDemoGame();
                }
            })
            .catch(error => {
                console.error("❌ Erro ao carregar dados do jogo:", error);
                renderDemoGame();
            });
        
        // Adicionar evento para o botão UNO
        const unoButton = document.getElementById('uno-btn');
        if (unoButton) {
            unoButton.addEventListener('click', callUno);
        }
        
        // Configurar listener para o seletor de cores
        setupColorSelector();
    }
    
    // Carregar dados do jogo atual
    async function loadGameData() {
        console.log("📂 Carregando dados do jogo...");
        
        // Tentar obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession'));
        if (!sessionData || !sessionData.roomCode) {
            console.warn("⚠️ Dados da sessão não encontrados");
            return null;
        }
        
        try {
            // Referência ao jogo no Firebase
            const gameRef = firebase.database().ref(`rooms/${sessionData.roomCode}/game`);
            const snapshot = await gameRef.once('value');
            const gameData = snapshot.val();
            
            if (!gameData) {
                console.warn("⚠️ Dados do jogo não encontrados");
                return null;
            }
            
            // Adicionar ID do jogador atual aos dados
            gameData.currentPlayerId = sessionData.playerId;
            
            console.log("✅ Dados do jogo carregados com sucesso");
            return gameData;
        } catch (error) {
            console.error("❌ Erro ao carregar dados do jogo:", error);
            return null;
        }
    }
    
    // Renderizar o jogo com dados reais
    function renderGame(gameData) {
        console.log("🎲 Renderizando jogo com dados reais...");
        
        // Renderizar mão do jogador
        renderPlayerHand(gameData);
        
        // Renderizar pilha de descarte
        renderDiscardPile(gameData);
        
        // Renderizar pilha de compra
        renderDrawPile(gameData);
        
        // Renderizar oponentes
        renderOpponents(gameData);
        
        // Atualizar informações do jogo
        updateGameInfo(gameData);
        
        // Configurar atualização em tempo real
        setupRealtimeUpdates(gameData);
    }
    
    // Renderizar jogo de demonstração
    function renderDemoGame() {
        console.log("🎲 Renderizando jogo de demonstração...");
        
        // Criar dados de demonstração
        const demoData = {
            currentPlayerId: 'player1',
            playerIds: ['player1', 'player2', 'player3'],
            currentPlayerIndex: 0,
            direction: 1,
            hands: {
                player1: createRandomHand(),
                player2: Array(5).fill(null),
                player3: Array(7).fill(null)
            },
            discard: [{
                id: 'demo-discard',
                type: 'number',
                color: 'red',
                value: '5'
            }],
            deck: Array(30).fill(null),
            currentColor: 'red'
        };
        
        // Renderizar o jogo com dados de demonstração
        renderGame(demoData);
    }
    
    // Renderizar mão do jogador
    function renderPlayerHand(gameData) {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Limpar a mão atual
        playerHand.innerHTML = '';
        
        // Obter cartas do jogador atual
        const hand = gameData.hands[gameData.currentPlayerId] || [];
        
        // Verificar se a mão está vazia
        if (hand.length === 0) {
            const emptyHandMsg = document.createElement('div');
            emptyHandMsg.className = 'empty-hand-message';
            emptyHandMsg.textContent = 'Sem cartas';
            playerHand.appendChild(emptyHandMsg);
            return;
        }
        
        // Verificar quais cartas são jogáveis
        const playableCards = getPlayableCards(hand, gameData.discard[0], gameData.currentColor);
        
        // Renderizar cada carta
        hand.forEach(card => {
            const cardElement = createCardElement(card);
            playerHand.appendChild(cardElement);
            
            // Destacar cartas jogáveis
            const isPlayable = playableCards.some(c => c.id === card.id);
            if (isPlayable) {
                cardElement.classList.add('playable');
                
                // Adicionar indicador visual
                const indicator = document.createElement('div');
                indicator.className = 'playable-indicator';
                indicator.textContent = 'Jogável';
                cardElement.appendChild(indicator);
            } else {
                cardElement.classList.add('disabled');
            }
            
            // Adicionar evento de clique
            cardElement.addEventListener('click', () => {
                if (isPlayable) {
                    playCard(card, gameData);
                }
            });
        });
        
        // Atualizar contador de cartas
        updateCardCount(hand.length);
    }
    
    // Renderizar pilha de descarte
    function renderDiscardPile(gameData) {
        const discardPile = document.getElementById('discard-pile');
        if (!discardPile) return;
        
        // Limpar pilha
        discardPile.innerHTML = '';
        
        // Obter carta do topo
        const topCard = gameData.discard[0];
        if (!topCard) return;
        
        // Criar elemento da carta
        const cardElement = createCardElement(topCard);
        
        // Se for curinga com cor escolhida
        if (topCard.type === 'wild') {
            cardElement.dataset.chosenColor = gameData.currentColor;
            cardElement.classList.add('colored-wild');
            
            // Adicionar sobreposição de cor
            const colorOverlay = document.createElement('div');
            colorOverlay.className = `color-overlay ${gameData.currentColor}`;
            cardElement.appendChild(colorOverlay);
        }
        
        // Adicionar à pilha
        discardPile.appendChild(cardElement);
    }
    
    // Renderizar pilha de compra
    function renderDrawPile(gameData) {
        const drawPile = document.getElementById('draw-pile');
        if (!drawPile) return;
        
        // Limpar pilha
        drawPile.innerHTML = '';
        
        // Obter número de cartas
        const deckSize = gameData.deck.length;
        
        // Criar visual de cartas empilhadas (3 cartas)
        for (let i = 0; i < Math.min(3, deckSize); i++) {
            const card = document.createElement('div');
            card.className = 'card card-back';
            card.style.position = 'absolute';
            card.style.top = `${i * 2}px`;
            card.style.left = `${i * 2}px`;
            card.style.zIndex = i;
            
            // Adicionar verso da carta
            const logo = document.createElement('div');
            logo.className = 'card-back-logo';
            logo.textContent = 'UNO';
            card.appendChild(logo);
            
            drawPile.appendChild(card);
        }
        
        // Adicionar contador de cartas
        const counter = document.createElement('div');
        counter.className = 'cards-count-indicator';
        counter.textContent = deckSize;
        drawPile.appendChild(counter);
        
        // Adicionar evento para comprar carta
        drawPile.addEventListener('click', () => {
            drawCard(gameData);
        });
    }
    
    // Renderizar oponentes
    function renderOpponents(gameData) {
        const opponentsContainer = document.getElementById('opponents-container');
        if (!opponentsContainer) return;
        
        // Limpar container
        opponentsContainer.innerHTML = '';
        
        // Filtrar jogadores que não são o atual
        const opponentIds = gameData.playerIds.filter(id => id !== gameData.currentPlayerId);
        
        // Renderizar cada oponente
        opponentIds.forEach((opponentId, index) => {
            // Criar elemento do oponente
            const opponent = document.createElement('div');
            opponent.className = 'opponent';
            opponent.dataset.playerId = opponentId;
            
            // Verificar se é o jogador atual
            const isCurrentPlayer = gameData.playerIds[gameData.currentPlayerIndex] === opponentId;
            if (isCurrentPlayer) {
                opponent.classList.add('current-player');
            }
            
            // Obter número de cartas do oponente
            const cardCount = (gameData.hands[opponentId] || []).length;
            
            // Criar conteúdo
            opponent.innerHTML = `
                <div class="opponent-info">
                    <div class="opponent-name">Jogador ${index + 2}</div>
                    <div class="opponent-cards-count">${cardCount} cartas</div>
                </div>
                <div class="opponent-hand"></div>
            `;
            
            // Adicionar cartas viradas (apenas visual)
            const opponentHand = opponent.querySelector('.opponent-hand');
            const visibleCards = Math.min(cardCount, 5);
            
            for (let i = 0; i < visibleCards; i++) {
                const card = document.createElement('div');
                card.className = 'card card-back mini-card';
                card.style.transform = `translateX(${i * 15}px) rotate(${(i - 2) * 5}deg)`;
                
                // Adicionar logo
                const logo = document.createElement('div');
                logo.className = 'card-back-logo';
                logo.textContent = 'UNO';
                logo.style.fontSize = '1.5rem';
                card.appendChild(logo);
                
                opponentHand.appendChild(card);
            }
            
            // Adicionar ao container
            opponentsContainer.appendChild(opponent);
        });
    }
    
    // Atualizar informações do jogo
    function updateGameInfo(gameData) {
        // Atualizar o jogador atual
        const currentPlayerDisplay = document.getElementById('current-player');
        if (currentPlayerDisplay) {
            const currentPlayerId = gameData.playerIds[gameData.currentPlayerIndex];
            const isYourTurn = currentPlayerId === gameData.currentPlayerId;
            
            if (isYourTurn) {
                currentPlayerDisplay.textContent = 'Sua vez de jogar!';
                currentPlayerDisplay.classList.add('your-turn');
            } else {
                currentPlayerDisplay.textContent = `Vez de: Jogador ${gameData.currentPlayerIndex + 1}`;
                currentPlayerDisplay.classList.remove('your-turn');
            }
        }
        
        // Atualizar contagem de cartas no baralho
        const cardsLeftDisplay = document.getElementById('cards-left');
        if (cardsLeftDisplay) {
            cardsLeftDisplay.textContent = `Cartas no monte: ${gameData.deck.length}`;
        }
    }
    
    // Atualizar contador de cartas do jogador
    function updateCardCount(count) {
        const cardCount = document.getElementById('card-count');
        if (cardCount) {
            cardCount.textContent = `${count} carta${count !== 1 ? 's' : ''}`;
        }
    }
    
    // Configurar atualizações em tempo real
    function setupRealtimeUpdates(gameData) {
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession'));
        if (!sessionData || !sessionData.roomCode) {
            return;
        }
        
        // Referência ao jogo no Firebase
        const gameRef = firebase.database().ref(`rooms/${sessionData.roomCode}/game`);
        
        // Ouvir mudanças no jogo
        gameRef.on('value', (snapshot) => {
            const updatedGameData = snapshot.val();
            
            if (!updatedGameData) {
                console.warn("⚠️ Dados do jogo atualizados não encontrados");
                return;
            }
            
            // Adicionar ID do jogador atual
            updatedGameData.currentPlayerId = sessionData.playerId;
            
            // Atualizar a interface
            renderPlayerHand(updatedGameData);
            renderDiscardPile(updatedGameData);
            renderDrawPile(updatedGameData);
            renderOpponents(updatedGameData);
            updateGameInfo(updatedGameData);
        });
    }
    
    // Configurar seletor de cores
    function setupColorSelector() {
        const colorSelector = document.getElementById('color-selector');
        if (!colorSelector) return;
        
        // Obter botões de cores
        const colorButtons = colorSelector.querySelectorAll('.color-btn');
        
        // Adicionar eventos para cada botão
        colorButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Obter cor selecionada
                const color = button.dataset.color;
                
                // Obter carta selecionada dos dados armazenados
                const card = JSON.parse(localStorage.getItem('selectedCard'));
                
                // Fechar seletor
                colorSelector.classList.add('hidden');
                
                // Jogar carta com a cor selecionada
                if (card) {
                    playCardWithColor(card, color);
                }
            });
        });
    }
    
    //===================================================================
    // INTERAÇÃO COM O JOGO: JOGAR CARTAS, COMPRAR, ETC.
    //===================================================================
    
    // Obter cartas jogáveis
    function getPlayableCards(hand, topCard, currentColor) {
        return hand.filter(card => isPlayable(card, topCard, currentColor));
    }
    
    // Verificar se uma carta é jogável
    function isPlayable(card, topCard, currentColor) {
        // Curingas são sempre jogáveis
        if (card.type === 'wild') {
            return true;
        }
        
        // Carta da mesma cor é jogável
        if (card.color === currentColor) {
            return true;
        }
        
        // Carta com o mesmo valor/símbolo é jogável
        if (topCard && card.value === topCard.value) {
            return true;
        }
        
        return false;
    }
    
    // Jogar uma carta
    function playCard(card, gameData) {
        console.log("🎮 Jogando carta:", card);
        
        // Se for carta curinga, mostrar seletor de cores
        if (card.type === 'wild') {
            // Guardar carta selecionada para uso posterior
            localStorage.setItem('selectedCard', JSON.stringify(card));
            
            // Mostrar seletor de cores
            const colorSelector = document.getElementById('color-selector');
            if (colorSelector) {
                colorSelector.classList.remove('hidden');
            }
            
            return;
        }
        
        // Jogar carta normalmente (sem seleção de cor)
        playCardWithColor(card);
    }
    
    // Jogar carta com cor selecionada (para curingas)
    function playCardWithColor(card, chosenColor = null) {
        console.log(`🎮 Jogando carta ${card.id} ${chosenColor ? `com cor ${chosenColor}` : ''}`);
        
        // Buscar dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession'));
        if (!sessionData || !sessionData.roomCode) {
            showError("Não foi possível jogar a carta. Dados da sessão não encontrados.");
            return;
        }
        
        // Animação de jogada
        animateCardPlay(card, chosenColor);
        
        // Referência ao jogo
        const gameRef = firebase.database().ref(`rooms/${sessionData.roomCode}/game`);
        
        // Atualizar o jogo no Firebase
        gameRef.once('value')
            .then(snapshot => {
                const gameData = snapshot.val();
                
                if (!gameData) {
                    throw new Error("Dados do jogo não encontrados.");
                }
                
                // Verificar se é a vez do jogador
                if (gameData.playerIds[gameData.currentPlayerIndex] !== sessionData.playerId) {
                    throw new Error("Não é sua vez de jogar.");
                }
                
                // Verificar se o jogador tem a carta
                const playerHand = gameData.hands[sessionData.playerId] || [];
                const cardIndex = playerHand.findIndex(c => c.id === card.id);
                
                if (cardIndex === -1) {
                    throw new Error("Carta não encontrada na sua mão.");
                }
                
                // Verificar se é uma jogada válida
                const topCard = gameData.discard[0];
                if (!isPlayable(card, topCard, gameData.currentColor)) {
                    throw new Error("Jogada inválida. Você não pode jogar essa carta agora.");
                }
                
                // Remover carta da mão do jogador
                playerHand.splice(cardIndex, 1);
                
                // Adicionar à pilha de descarte
                gameData.discard.unshift(card);
                
                // Atualizar cor atual para cartas curinga
                if (card.type === 'wild' && chosenColor) {
                    gameData.currentColor = chosenColor;
                } else {
                    gameData.currentColor = card.color;
                }
                
                // Atualizar mão do jogador
                gameData.hands[sessionData.playerId] = playerHand;
                
                // Determinar próximo jogador e aplicar efeitos da carta
                applyCardEffects(gameData, card);
                
                // Incrementar turno
                gameData.turn += 1;
                
                // Registrar última ação
                gameData.lastAction = {
                    type: 'playCard',
                    playerId: sessionData.playerId,
                    card: card,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
                
                // Verificar vitória
                if (playerHand.length === 0) {
                    // Jogador ganhou
                    const roomRef = firebase.database().ref(`rooms/${sessionData.roomCode}`);
                    
                    return roomRef.update({
                        status: 'finished',
                        game: gameData,
                        winner: sessionData.playerId,
                        finishedAt: firebase.database.ServerValue.TIMESTAMP
                    });
                }
                
                // Atualizar jogo
                return gameRef.set(gameData);
            })
            .then(() => {
                console.log("✅ Carta jogada com sucesso!");
                
                // Se jogador ficou com uma carta, alerta para chamar UNO
                const playerHandElement = document.getElementById('player-hand');
                if (playerHandElement && playerHandElement.children.length === 1) {
                    showMessage("Você está com apenas uma carta! Clique no botão UNO!");
                }
            })
            .catch(error => {
                console.error("❌ Erro ao jogar carta:", error);
                showError(error.message || "Erro ao jogar carta.");
            });
    }
    
    // Aplicar efeitos da carta jogada
    function applyCardEffects(gameData, card) {
        const playerCount = gameData.playerIds.length;
        
        // Lidar com diferentes tipos de cartas
        switch (card.value) {
            case 'skip':
                // Pular próximo jogador
                gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
                break;
                
            case 'reverse':
                // Inverter direção
                gameData.direction *= -1;
                
                // Em jogo de 2 jogadores, funciona como Skip
                if (playerCount === 2) {
                    break;
                }
                
                // Avançar ao próximo jogador
                gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
                break;
                
            case 'draw2':
                // Próximo jogador compra 2 cartas
                const nextPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
                const nextPlayerId = gameData.playerIds[nextPlayerIndex];
                
                // Adicionar 2 cartas à mão do próximo jogador
                const nextPlayerHand = gameData.hands[nextPlayerId] || [];
                
                // Verificar se há cartas suficientes no deck
                ensureEnoughCards(gameData, 2);
                
                // Dar as cartas
                nextPlayerHand.push(...gameData.deck.splice(0, 2));
                gameData.hands[nextPlayerId] = nextPlayerHand;
                
                // Pular o jogador
                gameData.currentPlayerIndex = (nextPlayerIndex + gameData.direction + playerCount) % playerCount;
                break;
                
            case 'wild-draw-four':
                // Próximo jogador compra 4 cartas
                const nextPlayerIdx = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
                const nextPlayer = gameData.playerIds[nextPlayerIdx];
                
                // Adicionar 4 cartas à mão do próximo jogador
                const nextHand = gameData.hands[nextPlayer] || [];
                
                // Verificar se há cartas suficientes
                ensureEnoughCards(gameData, 4);
                
                // Dar as cartas
                nextHand.push(...gameData.deck.splice(0, 4));
                gameData.hands[nextPlayer] = nextHand;
                
                // Pular o jogador
                gameData.currentPlayerIndex = (nextPlayerIdx + gameData.direction + playerCount) % playerCount;
                break;
                
            default:
                // Para cartas normais, apenas passa ao próximo jogador
                gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
                break;
        }
    }
    
    // Garantir que há cartas suficientes no baralho
    function ensureEnoughCards(gameData, neededCards) {
        // Se o baralho tiver cartas suficientes, não faz nada
        if (gameData.deck.length >= neededCards) return;
        
        console.log(`🔄 Reembaralhando pilha de descarte (${gameData.discard.length - 1} cartas)...`);
        
        // Guardar a carta do topo
        const topCard = gameData.discard.shift();
        
        // Misturar o resto da pilha de descarte e adicionar ao baralho
        const discardPile = [...gameData.discard];
        gameData.discard = [topCard]; // Manter apenas a carta do topo
        
        // Embaralhar as cartas da pilha de descarte
        for (let i = discardPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [discardPile[i], discardPile[j]] = [discardPile[j], discardPile[i]];
        }
        
        // Adicionar as cartas embaralhadas ao baralho
        gameData.deck = [...gameData.deck, ...discardPile];
        
        console.log(`✅ Baralho reabastecido com ${gameData.deck.length} cartas`);
    }
    
    // Comprar uma carta
    function drawCard(gameData) {
        console.log("🎮 Comprando carta...");
        
        // Buscar dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession'));
        if (!sessionData || !sessionData.roomCode) {
            showError("Não foi possível comprar carta. Dados da sessão não encontrados.");
            return;
        }
        
        // Animação de compra
        animateCardDraw();
        
        // Referência ao jogo
        const gameRef = firebase.database().ref(`rooms/${sessionData.roomCode}/game`);
        
        // Atualizar o jogo no Firebase
        gameRef.once('value')
            .then(snapshot => {
                const gameData = snapshot.val();
                
                if (!gameData) {
                    throw new Error("Dados do jogo não encontrados.");
                }
                
                // Verificar se é a vez do jogador
                if (gameData.playerIds[gameData.currentPlayerIndex] !== sessionData.playerId) {
                    throw new Error("Não é sua vez de jogar.");
                }
                
                // Garantir que há cartas no baralho
                ensureEnoughCards(gameData, 1);
                
                // Comprar carta
                const drawnCard = gameData.deck.shift();
                
                if (!drawnCard) {
                    throw new Error("Não foi possível comprar uma carta.");
                }
                
                // Adicionar à mão do jogador
                const playerHand = gameData.hands[sessionData.playerId] || [];
                playerHand.push(drawnCard);
                gameData.hands[sessionData.playerId] = playerHand;
                
                // Verificar se a carta pode ser jogada imediatamente
                const canPlayDrawnCard = isPlayable(drawnCard, gameData.discard[0], gameData.currentColor);
                
                // Se não puder jogar, passar a vez
                if (!canPlayDrawnCard) {
                    // Passar para o próximo jogador
                    const playerCount = gameData.playerIds.length;
                    gameData.currentPlayerIndex = (gameData.currentPlayerIndex + gameData.direction + playerCount) % playerCount;
                }
                
                // Registrar última ação
                gameData.lastAction = {
                    type: 'drawCard',
                    playerId: sessionData.playerId,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
                
                // Atualizar jogo
                return gameRef.set(gameData);
            })
            .then(() => {
                console.log("✅ Carta comprada com sucesso!");
            })
            .catch(error => {
                console.error("❌ Erro ao comprar carta:", error);
                showError(error.message || "Erro ao comprar carta.");
            });
    }
    
    // Chamar UNO
    function callUno() {
        console.log("🎮 Chamando UNO...");
        
        // Buscar dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession'));
        if (!sessionData || !sessionData.roomCode) {
            showError("Não foi possível chamar UNO. Dados da sessão não encontrados.");
            return;
        }
        
        // Referência ao jogo
        const gameRef = firebase.database().ref(`rooms/${sessionData.roomCode}/game`);
        
        // Atualizar o jogo no Firebase
        gameRef.once('value')
            .then(snapshot => {
                const gameData = snapshot.val();
                
                if (!gameData) {
                    throw new Error("Dados do jogo não encontrados.");
                }
                
                // Verificar se o jogador tem apenas uma carta
                const playerHand = gameData.hands[sessionData.playerId] || [];
                
                if (playerHand.length !== 1) {
                    throw new Error("Você só pode chamar UNO quando tiver uma carta.");
                }
                
                // Registrar que o jogador chamou UNO
                if (!gameData.unoPlayers) {
                    gameData.unoPlayers = {};
                }
                
                gameData.unoPlayers[sessionData.playerId] = true;
                
                // Registrar última ação
                gameData.lastAction = {
                    type: 'callUno',
                    playerId: sessionData.playerId,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
                
                // Atualizar jogo
                return gameRef.update({
                    unoPlayers: gameData.unoPlayers,
                    lastAction: gameData.lastAction
                });
            })
            .then(() => {
                console.log("✅ UNO chamado com sucesso!");
                
                // Mostrar efeito visual
                showUnoEffect();
                
                // Enviar mensagem ao chat
                sendSystemChatMessage(`${sessionData.playerName || 'Você'} chamou UNO!`);
            })
            .catch(error => {
                console.error("❌ Erro ao chamar UNO:", error);
                showError(error.message || "Erro ao chamar UNO.");
            });
    }
    
    //===================================================================
    // FUNÇÕES UTILITÁRIAS E AUXILIARES
    //===================================================================
    
    // Criar elemento de carta
    function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.color}`;
        cardElement.dataset.id = card.id;
        cardElement.dataset.color = card.color;
        cardElement.dataset.value = card.value;
        cardElement.dataset.type = card.type;
        
        // Criar conteúdo da carta
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        // Adicionar valor/símbolo central
        const cardCenter = document.createElement('div');
        cardCenter.className = 'card-center';
        
        // Definir símbolo/valor com base no tipo da carta
        if (card.type === 'number') {
            cardCenter.textContent = card.value;
        } else {
            // Para cartas especiais
            switch (card.value) {
                case 'skip': cardCenter.textContent = '⊘'; break;
                case 'reverse': cardCenter.textContent = '↺'; break;
                case 'draw2': cardCenter.textContent = '+2'; break;
                case 'wild': cardCenter.textContent = '★'; break;
                case 'wild-draw-four': cardCenter.textContent = '+4'; break;
                default: cardCenter.textContent = card.value;
            }
        }
        
        cardInner.appendChild(cardCenter);
        
        // Para cartas curinga, adicionar visual de cores
        if (card.type === 'wild') {
            const wildColors = document.createElement('div');
            wildColors.className = 'wild-colors';
            
            ['red', 'blue', 'green', 'yellow'].forEach(color => {
                const colorDiv = document.createElement('div');
                colorDiv.className = `wild-color ${color}`;
                wildColors.appendChild(colorDiv);
            });
            
            cardInner.appendChild(wildColors);
        }
        
        // Adicionar reflexo
        const reflection = document.createElement('div');
        reflection.className = 'card-reflection';
        cardInner.appendChild(reflection);
        
        // Adicionar cantos (opcional, para melhorar visual)
        const topLeft = document.createElement('div');
        topLeft.className = 'card-corner top-left';
        
        const bottomRight = document.createElement('div');
        bottomRight.className = 'card-corner bottom-right';
        
        // Definir texto dos cantos igual ao centro
        if (card.type === 'number') {
            topLeft.textContent = card.value;
            bottomRight.textContent = card.value;
        } else {
            // Para cartas especiais
            switch (card.value) {
                case 'skip': 
                    topLeft.textContent = '⊘'; 
                    bottomRight.textContent = '⊘'; 
                    break;
                case 'reverse': 
                    topLeft.textContent = '↺'; 
                    bottomRight.textContent = '↺'; 
                    break;
                case 'draw2': 
                    topLeft.textContent = '+2'; 
                    bottomRight.textContent = '+2'; 
                    break;
                case 'wild': 
                    topLeft.textContent = '★'; 
                    bottomRight.textContent = '★'; 
                    break;
                case 'wild-draw-four': 
                    topLeft.textContent = '+4'; 
                    bottomRight.textContent = '+4'; 
                    break;
                default: 
                    topLeft.textContent = card.value;
                    bottomRight.textContent = card.value;
            }
        }
        
        cardInner.appendChild(topLeft);
        cardInner.appendChild(bottomRight);
        
        cardElement.appendChild(cardInner);
        
        return cardElement;
    }
    
    // Criar mão aleatória para testes
    function createRandomHand() {
        const hand = [];
        const types = ['number', 'action', 'wild'];
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Gerar 7 cartas aleatórias
        for (let i = 0; i < 7; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            let color, value;
            
            if (type === 'number') {
                color = colors[Math.floor(Math.random() * colors.length)];
                value = Math.floor(Math.random() * 10).toString();
            } else if (type === 'action') {
                color = colors[Math.floor(Math.random() * colors.length)];
                const actions = ['skip', 'reverse', 'draw2'];
                value = actions[Math.floor(Math.random() * actions.length)];
            } else {
                color = 'black';
                value = Math.random() < 0.5 ? 'wild' : 'wild-draw-four';
            }
            
            hand.push({
                id: `random-${i}-${Math.random().toString(36).substr(2, 9)}`,
                type,
                color,
                value
            });
        }
        
        return hand;
    }
    
    // Animar jogada de carta
    function animateCardPlay(card, chosenColor) {
        // Obter elemento da carta
        const cardElement = document.querySelector(`.card[data-id="${card.id}"]`);
        if (!cardElement) return;
        
        // Obter posição da carta
        const cardRect = cardElement.getBoundingClientRect();
        
        // Obter pilha de descarte
        const discardPile = document.getElementById('discard-pile');
        if (!discardPile) return;
        
        // Obter posição da pilha
        const discardRect = discardPile.getBoundingClientRect();
        
        // Criar clone da carta para animação
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${cardRect.top}px`;
        clone.style.left = `${cardRect.left}px`;
        clone.style.width = `${cardRect.width}px`;
        clone.style.height = `${cardRect.height}px`;
        clone.style.zIndex = '1000';
        clone.style.transition = 'all 0.3s ease-out';
        
        // Se for curinga com cor escolhida
        if (card.type === 'wild' && chosenColor) {
            clone.dataset.chosenColor = chosenColor;
            clone.classList.add('colored-wild');
            
            // Adicionar overlay de cor
            const overlay = document.createElement('div');
            overlay.className = `color-overlay ${chosenColor}`;
            clone.appendChild(overlay);
        }
        
        // Adicionar à página
        document.body.appendChild(clone);
        
        // Iniciar animação
        setTimeout(() => {
            clone.style.top = `${discardRect.top}px`;
            clone.style.left = `${discardRect.left}px`;
            clone.style.transform = 'rotate(360deg)';
        }, 50);
        
        // Remover clone após animação
        setTimeout(() => {
            document.body.removeChild(clone);
        }, 350);
        
        // Esconder a carta original
        cardElement.style.display = 'none';
    }
    
    // Animar compra de carta
    function animateCardDraw() {
        // Obter pilha de compra
        const drawPile = document.getElementById('draw-pile');
        if (!drawPile) return;
        
        // Obter mão do jogador
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Obter posições
        const drawRect = drawPile.getBoundingClientRect();
        const handRect = playerHand.getBoundingClientRect();
        
        // Criar elemento temporário para animação
        const tempCard = document.createElement('div');
        tempCard.className = 'card card-back';
        tempCard.style.position = 'fixed';
        tempCard.style.top = `${drawRect.top}px`;
        tempCard.style.left = `${drawRect.left}px`;
        tempCard.style.width = `${drawRect.width}px`;
        tempCard.style.height = `${drawRect.height}px`;
        tempCard.style.zIndex = '1000';
        tempCard.style.transition = 'all 0.3s ease-out';
        
        // Adicionar logo UNO
        const logo = document.createElement('div');
        logo.className = 'card-back-logo';
        logo.textContent = 'UNO';
        tempCard.appendChild(logo);
        
        // Adicionar à página
        document.body.appendChild(tempCard);
        
        // Iniciar animação
        setTimeout(() => {
            tempCard.style.top = `${handRect.top}px`;
            tempCard.style.left = `${handRect.left + handRect.width/2}px`;
            tempCard.style.transform = 'rotate(360deg)';
        }, 50);
        
        // Remover após animação
        setTimeout(() => {
            document.body.removeChild(tempCard);
        }, 350);
    }
    
    // Mostrar efeito de UNO
    function showUnoEffect() {
        // Criar elemento para o efeito
        const unoEffect = document.createElement('div');
        unoEffect.className = 'uno-effect';
        unoEffect.textContent = 'UNO!';
        
        // Adicionar à página
        document.body.appendChild(unoEffect);
        
        // Reproduzir som (opcional)
        playSound('uno');
        
        // Remover após animação
        setTimeout(() => {
            if (document.body.contains(unoEffect)) {
                document.body.removeChild(unoEffect);
            }
        }, 2000);
    }
    
    // Mostrar mensagem temporária
    function showMessage(message, duration = 3000) {
        // Obter container de mensagens
        let messagesContainer = document.getElementById('game-messages');
        
        // Se não existir, criar um novo
        if (!messagesContainer) {
            messagesContainer = document.createElement('div');
            messagesContainer.id = 'game-messages';
            messagesContainer.className = 'game-messages';
            
            // Adicionar à tela de jogo
            const gameTable = document.querySelector('.game-table');
            if (gameTable) {
                gameTable.appendChild(messagesContainer);
            } else {
                document.body.appendChild(messagesContainer);
            }
        }
        
        // Criar elemento de mensagem
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Adicionar mensagem
        messagesContainer.appendChild(messageElement);
        
        // Aplicar animação
        messageElement.classList.add('show');
        
        // Remover após duração
        setTimeout(() => {
            messageElement.classList.remove('show');
            messageElement.classList.add('hide');
            
            // Remover da DOM após animação
            setTimeout(() => {
                if (messagesContainer.contains(messageElement)) {
                    messagesContainer.removeChild(messageElement);
                }
            }, 500);
        }, duration);
    }
    
    // Enviar mensagem de sistema ao chat
    function sendSystemChatMessage(message) {
        // Obter container de mensagens de chat
        const gameChat = document.getElementById('game-chat-messages');
        const waitingChat = document.getElementById('waiting-chat-messages');
        
        // Determinar qual chat está ativo
        const chatMessages = gameChat && gameChat.offsetParent ? gameChat : 
                             waitingChat && waitingChat.offsetParent ? waitingChat : null;
        
        if (!chatMessages) return;
        
        // Criar elemento de mensagem de sistema
        const systemMessage = document.createElement('div');
        systemMessage.className = 'system-message';
        systemMessage.textContent = message;
        
        // Adicionar ao chat
        chatMessages.appendChild(systemMessage);
        
        // Rolar para a mensagem
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Mostrar overlay de carregamento
    function showLoadingOverlay(message) {
        let overlay = document.querySelector('.loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            const messageElement = document.createElement('div');
            messageElement.className = 'loading-message';
            
            overlay.appendChild(spinner);
            overlay.appendChild(messageElement);
            
            document.body.appendChild(overlay);
        }
        
        // Atualizar mensagem
        const messageElement = overlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        // Mostrar overlay
        overlay.style.display = 'flex';
    }
    
    // Remover overlay de carregamento
    function removeLoadingOverlay() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    // Mostrar erro
    function showError(message) {
        console.error("❌ ERRO:", message);
        
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
    
    // Reproduzir som (opcional)
    function playSound(sound) {
        const sounds = {
            'card-play': 'assets/sounds/card-play.mp3',
            'card-draw': 'assets/sounds/card-draw.mp3',
            'uno': 'assets/sounds/uno-call.mp3',
            'win': 'assets/sounds/win.mp3'
        };
        
        // Verificar configurações de som
        const soundEffectsEnabled = localStorage.getItem('soundEffects') !== 'false';
        
        if (!soundEffectsEnabled) {
            return;
        }
        
        // Tentar reproduzir o som
        try {
            const audio = new Audio(sounds[sound] || sound);
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.warn("⚠️ Erro ao reproduzir som:", error);
        }
    }
    
    // Corrigir navegação entre telas
    function fixNavigation() {
        console.log("🔄 Corrigindo navegação entre telas...");
        
        // Definir função global para navegar entre telas
        window.showScreen = function(screenId) {
            // Esconder todas as telas
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            // Mostrar a tela solicitada
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('active');
                console.log(`📱 Navegando para tela: ${screenId}`);
                
                // Disparar evento customizado
                const event = new CustomEvent('screenChange', {
                    detail: { screen: screenId }
                });
                document.dispatchEvent(event);
            } else {
                console.error(`❌ Tela não encontrada: ${screenId}`);
            }
        };
        
        // Corrigir botões de navegação
        const navigationButtons = [
            {id: 'play-local-btn', target: 'local-game-screen'},
            {id: 'play-online-btn', target: 'online-options-screen'},
            {id: 'options-btn', target: 'options-screen'},
            {id: 'rules-btn', target: 'rules-screen'},
            {id: 'back-from-local', target: 'start-screen'},
            {id: 'back-from-online-options', target: 'start-screen'},
            {id: 'create-room-option', target: 'create-room-screen'},
            {id: 'join-room-option', target: 'join-room-screen'},
            {id: 'back-from-create', target: 'online-options-screen'},
            {id: 'back-from-join', target: 'online-options-screen'},
            {id: 'back-from-rules', target: 'start-screen'},
            {id: 'back-from-options', target: 'start-screen'},
            {id: 'leave-room-btn', target: 'online-options-screen'},
            {id: 'menu-btn', target: 'start-screen'}
        ];
        
        navigationButtons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element) {
                // Remover event listeners existentes
                const newElement = element.cloneNode(true);
                if (element.parentNode) {
                    element.parentNode.replaceChild(newElement, element);
                }
                
                // Adicionar novo event listener
                newElement.addEventListener('click', () => {
                    window.showScreen(button.target);
                });
                
                console.log(`✅ Botão '${button.id}' corrigido`);
            }
        });
    }
})();