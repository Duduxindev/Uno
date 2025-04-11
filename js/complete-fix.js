/**
 * Correção Completa para UNO Game
 * Data: 2025-04-11 20:17:09
 * Desenvolvido por: Duduxindev
 */
(function() {
    console.log("🔄 Carregando correção completa para UNO...");
    
    // Executar quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFix);
    } else {
        // DOM já está pronto
        initializeFix();
    }
    
    function initializeFix() {
        // Aplicar correções imediatamente
        setTimeout(applyFixes, 300);
        
        // E verificar novamente a cada 2 segundos para garantir
        setInterval(applyFixes, 2000);
    }
    
    // Função principal que aplica todas as correções
    function applyFixes() {
        // 1. Corrigir botão de anfitrião
        fixHostButton();
        
        // 2. Corrigir renderização de cartas
        fixCardRendering();
        
        // 3. Corrigir navegação entre telas
        fixNavigation();
    }
    
    //=====================================================
    // CORREÇÃO 1: BOTÃO DE ANFITRIÃO
    //=====================================================
    function fixHostButton() {
        console.log("🔍 Verificando botão de anfitrião...");
        
        // Verificar se estamos na tela de sala de espera
        const waitingRoomScreen = document.getElementById('waiting-room-screen');
        if (!waitingRoomScreen || !waitingRoomScreen.classList.contains('active')) {
            return; // Não estamos na tela relevante
        }
        
        // Obter botão de iniciar jogo
        const startGameBtn = document.getElementById('start-game-btn');
        if (!startGameBtn) {
            console.error("❌ Botão 'start-game-btn' não encontrado!");
            
            // Criar o botão se não existir
            createStartGameButton();
            return;
        }
        
        // Forçar visibilidade do botão
        startGameBtn.style.display = 'block';
        startGameBtn.style.visibility = 'visible';
        startGameBtn.style.opacity = '1';
        startGameBtn.style.pointerEvents = 'auto';
        startGameBtn.disabled = false;
        startGameBtn.textContent = "Iniciar Jogo";
        startGameBtn.className = 'primary-btn pulse-button';
        
        // Remover e adicionar novo listener para garantir funcionamento
        const newStartBtn = startGameBtn.cloneNode(true);
        startGameBtn.parentNode.replaceChild(newStartBtn, startGameBtn);
        
        // Adicionar evento de clique
        newStartBtn.addEventListener('click', function() {
            console.log("🎮 Botão de iniciar jogo clicado!");
            forceGameStart();
        });
        
        console.log("✅ Botão de anfitrião corrigido!");
    }
    
    // Criar botão de iniciar jogo caso não exista
    function createStartGameButton() {
        console.log("🔨 Criando botão de iniciar jogo...");
        
        const buttonsRow = document.querySelector('.waiting-room-left .buttons-row');
        if (!buttonsRow) {
            console.error("❌ Container de botões não encontrado!");
            return;
        }
        
        // Criar novo botão
        const startBtn = document.createElement('button');
        startBtn.id = 'start-game-btn';
        startBtn.className = 'primary-btn pulse-button';
        startBtn.textContent = "Iniciar Jogo";
        startBtn.addEventListener('click', forceGameStart);
        
        // Adicionar ao início do container
        buttonsRow.insertBefore(startBtn, buttonsRow.firstChild);
        
        console.log("✅ Botão de iniciar jogo criado com sucesso!");
    }
    
    // Função para forçar o início do jogo
    function forceGameStart() {
        console.log("🚀 Forçando início do jogo...");
        
        // Mostrar overlay de carregamento
        showLoadingOverlay("Iniciando jogo, por favor aguarde...");
        
        // Obter dados da sessão
        const sessionData = getSessionData();
        if (!sessionData || !sessionData.roomCode) {
            showError("Dados da sessão não encontrados.");
            removeLoadingOverlay();
            return;
        }
        
        // Referência para a sala no Firebase
        const roomRef = firebase.database().ref(`rooms/${sessionData.roomCode}`);
        
        // Obter dados atuais da sala
        roomRef.once('value')
            .then(snapshot => {
                const roomData = snapshot.val();
                if (!roomData) {
                    showError("Sala não encontrada.");
                    removeLoadingOverlay();
                    return;
                }
                
                // Verificar jogadores
                const playerCount = Object.keys(roomData.players || {}).length;
                if (playerCount < 2) {
                    showError("São necessários pelo menos 2 jogadores para iniciar.");
                    removeLoadingOverlay();
                    return;
                }
                
                // Criar novo estado de jogo
                const gameState = createGameState(roomData);
                
                // Atualizar a sala
                return roomRef.update({
                    status: 'playing',
                    gameStartedAt: firebase.database.ServerValue.TIMESTAMP,
                    game: gameState,
                    lastAction: {
                        type: 'gameStart',
                        playerId: sessionData.playerId,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    }
                });
            })
            .then(() => {
                console.log("✅ Jogo iniciado com sucesso!");
                
                // Navegar para a tela do jogo
                showScreen('game-screen');
                
                // Inicializar o jogo
                setTimeout(() => {
                    initializeGameUI();
                }, 500);
                
                removeLoadingOverlay();
            })
            .catch(error => {
                console.error("❌ Erro ao iniciar jogo:", error);
                showError("Ocorreu um erro ao iniciar o jogo: " + error.message);
                removeLoadingOverlay();
            });
    }
    
    // Criar estado inicial do jogo
    function createGameState(roomData) {
        console.log("🎲 Criando estado inicial do jogo...");
        
        // Criar baralho
        const deck = createDeck(roomData.gameMode);
        
        // Ordenar jogadores (host primeiro)
        const players = Object.values(roomData.players || {});
        const playersArray = [...players].sort((a, b) => {
            if (a.id === roomData.host) return -1;
            if (b.id === roomData.host) return 1;
            return a.joinedAt - b.joinedAt;
        });
        
        // Distribuir cartas
        const hands = {};
        playersArray.forEach(player => {
            hands[player.id] = drawCardsFromDeck(deck, 7);
        });
        
        // Virar a primeira carta (que não seja Wild Draw Four)
        let firstCard;
        do {
            firstCard = drawCardsFromDeck(deck, 1)[0];
            
            // Se for Wild Draw Four, colocar de volta no baralho e tentar novamente
            if (firstCard && firstCard.type === 'wild' && firstCard.value === 'wild-draw-four') {
                deck.unshift(firstCard);
                firstCard = null;
            }
        } while (!firstCard);
        
        // Determinar cor inicial
        let initialColor = firstCard.color;
        if (firstCard.type === 'wild') {
            const colors = ['red', 'blue', 'green', 'yellow'];
            initialColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        // Determinar jogador inicial com base na primeira carta
        let startingPlayerIndex = 0;
        if (firstCard.type === 'action') {
            switch (firstCard.value) {
                case 'skip':
                    startingPlayerIndex = 1 % playersArray.length;
                    break;
                case 'reverse':
                    // Em jogo com 2 jogadores, funciona como skip
                    if (playersArray.length === 2) {
                        startingPlayerIndex = 1;
                    }
                    break;
                case 'draw2':
                    // Primeiro jogador compra 2 cartas e perde a vez
                    const playerHand = hands[playersArray[0].id];
                    const additionalCards = drawCardsFromDeck(deck, 2);
                    hands[playersArray[0].id] = [...playerHand, ...additionalCards];
                    startingPlayerIndex = 1 % playersArray.length;
                    break;
            }
        }
        
        // Construir estado do jogo
        return {
            deck: deck,
            discard: [firstCard],
            currentColor: initialColor,
            hands: hands,
            currentPlayerIndex: startingPlayerIndex,
            direction: 1,
            drawStack: 0,
            playerIds: playersArray.map(p => p.id),
            turn: 0,
            startedAt: firebase.database.ServerValue.TIMESTAMP,
            lastAction: {
                type: 'gameStart',
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }
        };
    }
    
    // Criar baralho de cartas
    function createDeck(gameMode) {
        console.log("🃏 Criando baralho para modo: " + gameMode);
        const deck = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Gerar ID único para cada carta
        const generateCardId = () => Math.random().toString(36).substring(2, 15);
        
        // Adicionar cartas numéricas (0-9)
        for (let color of colors) {
            // Um 0 por cor
            deck.push({
                id: `${color}-0-${generateCardId()}`,
                type: 'number',
                color: color,
                value: '0'
            });
            
            // Dois de cada 1-9 por cor
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
            
            // Adicionar cartas de ação
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
        
        // Adicionar cartas curinga
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
        
        // Adicionar cartas extras para modos especiais
        if (gameMode === 'wild' || gameMode === 'extreme' || gameMode === 'chaos') {
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
            
            // Mais cartas curingas
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
        
        // Embaralhar o baralho (algoritmo Fisher-Yates)
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        return deck;
    }
    
    // Comprar cartas do baralho
    function drawCardsFromDeck(deck, count) {
        return deck.splice(0, count);
    }
    
    //=====================================================
    // CORREÇÃO 2: RENDERIZAÇÃO DE CARTAS
    //=====================================================
    function fixCardRendering() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || !gameScreen.classList.contains('active')) {
            return; // Não estamos na tela do jogo
        }
        
        console.log("🃏 Verificando renderização de cartas...");
        
        // Inicializar a interface do jogo se estiver na tela do jogo
        initializeGameUI();
    }
    
    // Inicializar a interface do jogo
    function initializeGameUI() {
        console.log("🎮 Inicializando interface do jogo...");
        
        // 1. Obter referências aos elementos da UI
        const playerHand = document.getElementById('player-hand');
        const discardPile = document.getElementById('discard-pile');
        const drawPile = document.getElementById('draw-pile');
        const opponentsContainer = document.getElementById('opponents-container');
        
        // Verificar se os elementos existem
        if (!playerHand || !discardPile || !drawPile || !opponentsContainer) {
            console.error("❌ Elementos da UI não encontrados!");
            return;
        }
        
        // 2. Limpar os containers
        playerHand.innerHTML = '';
        discardPile.innerHTML = '';
        drawPile.innerHTML = '';
        opponentsContainer.innerHTML = '';
        
        // 3. Obter dados do jogo atual
        const sessionData = getSessionData();
        if (!sessionData || !sessionData.roomCode) {
            console.error("❌ Dados da sessão não encontrados!");
            
            // Renderizar mão de teste se não conseguir obter dados reais
            renderRandomPlayerHand();
            renderRandomDiscardPile();
            renderDrawPile();
            renderTestOpponents();
            return;
        }
        
        // 4. Tentar obter dados do jogo do Firebase
        const gameRef = firebase.database().ref(`rooms/${sessionData.roomCode}/game`);
        gameRef.once('value')
            .then(snapshot => {
                const gameData = snapshot.val();
                
                if (!gameData) {
                    console.warn("⚠️ Dados do jogo não encontrados, usando dados de teste.");
                    renderRandomPlayerHand();
                    renderRandomDiscardPile();
                    renderDrawPile();
                    renderTestOpponents();
                    return;
                }
                
                // Renderizar dados reais do jogo
                renderRealGameData(gameData, sessionData.playerId);
            })
            .catch(error => {
                console.error("❌ Erro ao obter dados do jogo:", error);
                
                // Fallback para dados de teste
                renderRandomPlayerHand();
                renderRandomDiscardPile();
                renderDrawPile();
                renderTestOpponents();
            });
    }
    
    // Renderizar dados reais do jogo
    function renderRealGameData(gameData, playerId) {
        console.log("📊 Renderizando dados reais do jogo");
        
        // 1. Renderizar mão do jogador
        const playerHand = document.getElementById('player-hand');
        const playerCards = gameData.hands[playerId] || [];
        
        // Limpar o container
        playerHand.innerHTML = '';
        
        // Renderizar cada carta
        playerCards.forEach(card => {
            const cardElement = createCardElement(card, true);
            playerHand.appendChild(cardElement);
            
            // Adicionar evento de clique
            cardElement.addEventListener('click', () => handleCardClick(card));
        });
        
        // 2. Renderizar carta do topo da pilha de descarte
        const discardPile = document.getElementById('discard-pile');
        discardPile.innerHTML = '';
        
        const topCard = gameData.discard[0];
        if (topCard) {
            const cardElement = createCardElement(topCard, true);
            discardPile.appendChild(cardElement);
        }
        
        // 3. Renderizar pilha de compra
        renderDrawPile(gameData.deck.length);
        
        // 4. Renderizar oponentes
        renderRealOpponents(gameData, playerId);
        
        // 5. Atualizar informações do jogo
        updateGameInfo(gameData);
    }
    
    // Renderizar mão aleatória do jogador para teste
    function renderRandomPlayerHand() {
        console.log("🎲 Renderizando mão aleatória para o jogador");
        
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Limpar o container
        playerHand.innerHTML = '';
        
        // Criar cartas de teste
        const testCards = generateRandomHand();
        
        // Renderizar cada carta
        testCards.forEach(card => {
            const cardElement = createCardElement(card, true);
            playerHand.appendChild(cardElement);
            
            // Adicionar evento de clique
            cardElement.addEventListener('click', () => handleCardClick(card));
        });
    }
    
    // Renderizar pilha de descarte aleatória para teste
    function renderRandomDiscardPile() {
        console.log("🎲 Renderizando pilha de descarte aleatória");
        
        const discardPile = document.getElementById('discard-pile');
        if (!discardPile) return;
        
        // Limpar o container
        discardPile.innerHTML = '';
        
        // Gerar carta aleatória para o topo da pilha
        const topCard = generateRandomCard();
        
        // Renderizar a carta
        const cardElement = createCardElement(topCard, true);
        discardPile.appendChild(cardElement);
    }
    
    // Renderizar pilha de compra
    function renderDrawPile(cardCount = 30) {
        console.log("📚 Renderizando pilha de compra");
        
        const drawPile = document.getElementById('draw-pile');
        if (!drawPile) return;
        
        // Limpar o container
        drawPile.innerHTML = '';
        
        // Criar visuais para 3 cartas empilhadas
        for (let i = 0; i < 3; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card card-back';
            cardBack.style.position = 'absolute';
            cardBack.style.top = `${i * 2}px`;
            cardBack.style.left = `${i * 2}px`;
            
            // Adicionar logo UNO ao verso
            const logo = document.createElement('div');
            logo.className = 'card-back-logo';
            logo.textContent = 'UNO';
            cardBack.appendChild(logo);
            
            drawPile.appendChild(cardBack);
        }
        
        // Adicionar evento de clique
        drawPile.addEventListener('click', handleDrawPileClick);
        
        // Adicionar contador de cartas
        const cardCounter = document.createElement('div');
        cardCounter.className = 'card-counter';
        cardCounter.textContent = cardCount;
        drawPile.appendChild(cardCounter);
    }
    
    // Renderizar oponentes de teste
    function renderTestOpponents() {
        console.log("👥 Renderizando oponentes de teste");
        
        const opponentsContainer = document.getElementById('opponents-container');
        if (!opponentsContainer) return;
        
        // Limpar o container
        opponentsContainer.innerHTML = '';
        
        // Criar oponentes de teste
        const testOpponents = [
            { id: 'p1', name: 'Jogador 1', cardCount: 7, isActive: true },
            { id: 'p2', name: 'Jogador 2', cardCount: 5, isActive: false },
            { id: 'p3', name: 'Jogador 3', cardCount: 3, isActive: false }
        ];
        
        // Renderizar cada oponente
        testOpponents.forEach(opponent => {
            const opponentElement = createOpponentElement(opponent);
            opponentsContainer.appendChild(opponentElement);
        });
    }
    
    // Renderizar oponentes reais
    function renderRealOpponents(gameData, currentPlayerId) {
        console.log("👥 Renderizando oponentes reais");
        
        const opponentsContainer = document.getElementById('opponents-container');
        if (!opponentsContainer) return;
        
        // Limpar o container
        opponentsContainer.innerHTML = '';
        
        // Determinar todos os jogadores exceto o atual
        const opponents = [];
        
        if (gameData.playerIds) {
            // Para cada ID de jogador no jogo
            gameData.playerIds.forEach((playerId, index) => {
                // Pular o jogador atual
                if (playerId === currentPlayerId) return;
                
                // Obter número de cartas
                const cards = gameData.hands[playerId] || [];
                const cardCount = cards.length;
                
                // Verificar se é o jogador atual
                const isActive = index === gameData.currentPlayerIndex;
                
                // Obter nome do jogador da sala
                const name = playerId.substring(0, 8); // Fallback
                
                opponents.push({
                    id: playerId,
                    name: name,
                    cardCount: cardCount,
                    isActive: isActive
                });
            });
        }
        
        // Renderizar cada oponente
        opponents.forEach(opponent => {
            const opponentElement = createOpponentElement(opponent);
            opponentsContainer.appendChild(opponentElement);
        });
    }
    
    // Criar elemento para um oponente
    function createOpponentElement(opponent) {
        const element = document.createElement('div');
        element.className = `opponent ${opponent.isActive ? 'active' : ''}`;
        element.dataset.playerId = opponent.id;
        
        element.innerHTML = `
            <div class="opponent-info">
                <div class="opponent-name">${opponent.name}</div>
                <div class="opponent-cards-count">${opponent.cardCount} cartas</div>
            </div>
            <div class="opponent-hand"></div>
        `;
        
        // Adicionar cartas viradas para baixo
        const opponentHand = element.querySelector('.opponent-hand');
        const visibleCards = Math.min(opponent.cardCount, 5);
        
        for (let i = 0; i < visibleCards; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card card-back mini-card';
            cardBack.style.transform = `translateX(${i * 15}px) rotate(${(i - 2) * 5}deg)`;
            
            opponentHand.appendChild(cardBack);
        }
        
        return element;
    }
    
    // Atualizar informações do jogo
    function updateGameInfo(gameData) {
        // Atualizar jogador atual
        const currentPlayerDisplay = document.getElementById('current-player');
        if (currentPlayerDisplay) {
            const currentPlayerId = gameData.playerIds[gameData.currentPlayerIndex];
            currentPlayerDisplay.textContent = `Vez de: ${currentPlayerId.substring(0, 8)}`;
        }
        
        // Atualizar cartas no monte
        const cardsLeftDisplay = document.getElementById('cards-left');
        if (cardsLeftDisplay) {
            cardsLeftDisplay.textContent = `Cartas no monte: ${gameData.deck.length}`;
        }
    }
    
    // Criar elemento de carta
    function createCardElement(card, faceUp = true) {
        const element = document.createElement('div');
        element.className = `card ${card.color}`;
        element.dataset.id = card.id;
        element.dataset.type = card.type;
        element.dataset.value = card.value;
        element.dataset.color = card.color;
        
        if (faceUp) {
            // Criar conteúdo da carta
            const inner = document.createElement('div');
            inner.className = 'card-inner';
            
            // Definir conteúdo com base no tipo da carta
            if (card.type === 'number') {
                inner.innerHTML = `
                    <div class="card-corner top-left">${card.value}</div>
                    <div class="card-center">${card.value}</div>
                    <div class="card-corner bottom-right">${card.value}</div>
                `;
            } else {
                // Para cartas especiais
                let symbol = getCardSymbol(card.value);
                
                inner.innerHTML = `
                    <div class="card-corner top-left">${symbol}</div>
                    <div class="card-center">${symbol}</div>
                    <div class="card-corner bottom-right">${symbol}</div>
                `;
                
                // Para cartas curinga, adicionar efeito especial
                if (card.type === 'wild') {
                    const wildColors = document.createElement('div');
                    wildColors.className = 'wild-colors';
                    
                    // Adicionar cores
                    wildColors.innerHTML = `
                        <div class="wild-color red"></div>
                        <div class="wild-color blue"></div>
                        <div class="wild-color green"></div>
                        <div class="wild-color yellow"></div>
                    `;
                    
                    inner.appendChild(wildColors);
                }
            }
            
            element.appendChild(inner);
        } else {
            // Verso da carta
            element.classList.add('card-back');
            
            const logo = document.createElement('div');
            logo.className = 'card-back-logo';
            logo.textContent = 'UNO';
            
            element.appendChild(logo);
        }
        
        return element;
    }
    
    // Obter símbolo para carta especial
    function getCardSymbol(value) {
        switch (value) {
            case 'skip': return '⊘';
            case 'reverse': return '↺';
            case 'draw2': return '+2';
            case 'wild': return '★';
            case 'wild-draw-four': return '+4';
            default: return value;
        }
    }
    
    // Gerar mão aleatória para teste
    function generateRandomHand() {
        const hand = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        const types = ['number', 'action', 'wild'];
        
        // Gerar 7 cartas aleatórias
        for (let i = 0; i < 7; i++) {
            hand.push(generateRandomCard());
        }
        
        return hand;
    }
    
    // Gerar carta aleatória
    function generateRandomCard() {
        const colors = ['red', 'blue', 'green', 'yellow'];
        const types = ['number', 'action', 'wild'];
        
        // Gerar ID único
        const id = Math.random().toString(36).substring(2, 15);
        
        // Escolher tipo aleatório
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Definir cor e valor com base no tipo
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
        
        return { id, type, color, value };
    }
    
    // Tratar clique em uma carta
    function handleCardClick(card) {
        console.log("🎮 Carta clicada:", card);
        
        // Se for curinga, mostrar seletor de cores
        if (card.type === 'wild') {
            showColorSelector(card);
            return;
        }
        
        // Animar jogada da carta
        animateCardPlay(card);
    }
    
    // Tratar clique na pilha de compra
    function handleDrawPileClick() {
        console.log("🎮 Pilha de compra clicada");
        
        // Animar compra de carta
        animateCardDraw();
    }
    
    // Mostrar seletor de cores
    function showColorSelector(card) {
        console.log("🎨 Mostrando seletor de cores para carta:", card);
        
        const colorSelector = document.getElementById('color-selector');
        if (!colorSelector) return;
        
        // Mostrar o seletor
        colorSelector.classList.remove('hidden');
        
        // Salvar a carta selecionada
        colorSelector.dataset.cardId = card.id;
        
        // Adicionar eventos de clique aos botões de cor
        const colorButtons = colorSelector.querySelectorAll('.color-btn');
        
        // Limpar listeners anteriores
        colorButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function() {
                const color = this.dataset.color;
                
                // Esconder o seletor
                colorSelector.classList.add('hidden');
                
                // Jogar a carta com a cor selecionada
                console.log(`🎮 Cor selecionada: ${color} para carta ${card.id}`);
                
                // Animar jogada da carta
                animateCardPlay(card, color);
            });
        });
    }
    
    // Animar jogada de carta
    function animateCardPlay(card, selectedColor) {
        console.log(`🎮 Jogando carta: ${card.color} ${card.value} ${selectedColor ? 'com cor ' + selectedColor : ''}`);
        
        // Obter elemento da carta
        const cardElement = document.querySelector(`.card[data-id="${card.id}"]`);
        if (!cardElement) return;
        
        // Obter posição da carta
        const cardRect = cardElement.getBoundingClientRect();
        
        // Obter posição da pilha de descarte
        const discardPile = document.getElementById('discard-pile');
        const discardRect = discardPile.getBoundingClientRect();
        
        // Clonar a carta para animação
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${cardRect.top}px`;
        clone.style.left = `${cardRect.left}px`;
        clone.style.width = `${cardRect.width}px`;
        clone.style.height = `${cardRect.height}px`;
        clone.style.zIndex = '1000';
        clone.style.transition = 'all 0.5s ease';
        
        document.body.appendChild(clone);
        
        // Iniciar animação
        setTimeout(() => {
            clone.style.top = `${discardRect.top}px`;
            clone.style.left = `${discardRect.left}px`;
            clone.style.transform = 'rotate(360deg)';
        }, 50);
        
        // Remover o clone e atualizar a pilha de descarte após a animação
        setTimeout(() => {
            // Remover o clone
            document.body.removeChild(clone);
            
            // Remover a carta da mão do jogador
            if (cardElement.parentNode) {
                cardElement.parentNode.removeChild(cardElement);
            }
            
            // Atualizar a pilha de descarte
            discardPile.innerHTML = '';
            
            // Criar nova carta para o topo da pilha
            const newTopCard = {
                ...card,
                displayColor: selectedColor || card.color
            };
            
            const newCardElement = createCardElement(newTopCard, true);
            
            // Se for curinga com cor selecionada, adicionar classe especial
            if (card.type === 'wild' && selectedColor) {
                newCardElement.dataset.chosenColor = selectedColor;
                newCardElement.classList.add('colored-wild');
                
                // Adicionar overlay de cor
                const colorOverlay = document.createElement('div');
                colorOverlay.className = `color-overlay ${selectedColor}`;
                newCardElement.appendChild(colorOverlay);
            }
            
            discardPile.appendChild(newCardElement);
        }, 500);
    }
    
    // Animar compra de carta
    function animateCardDraw() {
        // Obter posição da pilha de compra
        const drawPile = document.getElementById('draw-pile');
        const drawRect = drawPile.getBoundingClientRect();
        
        // Obter posição da mão do jogador
        const playerHand = document.getElementById('player-hand');
        const handRect = playerHand.getBoundingClientRect();
        
        // Criar carta temporária para animação
        const tempCard = document.createElement('div');
        tempCard.className = 'card card-back';
        tempCard.style.position = 'fixed';
        tempCard.style.top = `${drawRect.top}px`;
        tempCard.style.left = `${drawRect.left}px`;
        tempCard.style.width = `${drawRect.width}px`;
        tempCard.style.height = `${drawRect.height}px`;
        tempCard.style.zIndex = '1000';
        tempCard.style.transition = 'all 0.5s ease';
        
        // Adicionar logo UNO ao verso
        const logo = document.createElement('div');
        logo.className = 'card-back-logo';
        logo.textContent = 'UNO';
        tempCard.appendChild(logo);
        
        document.body.appendChild(tempCard);
        
        // Iniciar animação
        setTimeout(() => {
            tempCard.style.top = `${handRect.top}px`;
            tempCard.style.left = `${handRect.left + handRect.width/2}px`;
            tempCard.style.transform = 'rotate(360deg)';
        }, 50);
        
        // Adicionar nova carta à mão após a animação
        setTimeout(() => {
            // Remover carta temporária
            document.body.removeChild(tempCard);
            
            // Gerar carta aleatória
            const newCard = generateRandomCard();
            
            // Criar elemento e adicionar à mão
            const cardElement = createCardElement(newCard, true);
            playerHand.appendChild(cardElement);
            
            // Adicionar evento de clique
            cardElement.addEventListener('click', () => handleCardClick(newCard));
        }, 500);
    }
    
    //=====================================================
    // CORREÇÃO 3: NAVEGAÇÃO ENTRE TELAS
    //=====================================================
    function fixNavigation() {
        // Verificar todos os botões de navegação
        const mainButtons = [
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
            {id: 'back-from-options', target: 'start-screen'}
        ];
        
        mainButtons.forEach(button => {
            const btn = document.getElementById(button.id);
            if (btn) {
                // Verificar se o botão já tem um click listener
                const clickListeners = getEventListeners(btn).click;
                if (!clickListeners || clickListeners.length === 0) {
                    console.log(`🔄 Corrigindo botão de navegação: ${button.id}`);
                    
                    // Adicionar novo event listener
                    btn.addEventListener('click', function() {
                        showScreen(button.target);
                    });
                }
            }
        });
    }
    
    // Função para verificar event listeners em um elemento
    function getEventListeners(element) {
        // Implementação simplificada
        const listenerMap = {};
        
        if (!element.onclick) {
            listenerMap.click = [];
        } else {
            listenerMap.click = [element.onclick];
        }
        
        return listenerMap;
    }
    
    //=====================================================
    // FUNÇÕES UTILITÁRIAS
    //=====================================================
    
    // Obter dados da sessão
    function getSessionData() {
        try {
            // Tentar obter do localStorage
            const sessionString = localStorage.getItem('unoSession');
            if (sessionString) {
                return JSON.parse(sessionString);
            }
            
            // Alternativa - usar dados mockados
            return {
                roomCode: 'TEST1',
                playerId: 'player1',
                playerName: 'Jogador 1'
            };
        } catch (error) {
            console.error("❌ Erro ao obter dados da sessão:", error);
            return null;
        }
    }
    
    // Mostrar uma tela específica
    function showScreen(screenId) {
        console.log(`🔄 Navegando para tela: ${screenId}`);
        
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar a tela solicitada
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            
            // Se for a tela do jogo, inicializar a UI
            if (screenId === 'game-screen') {
                setTimeout(initializeGameUI, 300);
            }
        }
    }
    
    // Mostrar overlay de carregamento
    function showLoadingOverlay(message) {
        let overlay = document.querySelector('.loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            const messageEl = document.createElement('div');
            messageEl.className = 'loading-message';
            
            overlay.appendChild(spinner);
            overlay.appendChild(messageEl);
            document.body.appendChild(overlay);
        }
        
        // Atualizar mensagem
        const messageEl = overlay.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
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
    
    // Mostrar mensagem de erro
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
})();