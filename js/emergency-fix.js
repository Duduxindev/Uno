/**
 * Correção de Emergência para o UNO Game
 * Data: 2025-04-11 20:06:43
 * Desenvolvido por: Duduxindev
 */
(function() {
    console.log("🔧 CORREÇÃO DE EMERGÊNCIA: Iniciando...");
    
    // Esperar o DOM carregar completamente
    document.addEventListener('DOMContentLoaded', function() {
        // Dar um tempo para outros scripts carregarem
        setTimeout(fixEverything, 500);
    });
    
    // Função principal de correção
    function fixEverything() {
        console.log("🔧 Aplicando correções...");
        
        // 1. Corrigir todos os botões
        fixAllButtons();
        
        // 2. Corrigir renderização de cartas
        ensureCardsRender();
        
        // 3. Corrigir inicialização de jogo
        fixGameStart();
        
        console.log("✅ Correções aplicadas!");
    }
    
    // 1. Corrigir funcionamento dos botões
    function fixAllButtons() {
        console.log("🔘 Corrigindo botões...");
        
        // Limpar e recriar todos os event listeners dos botões principais
        const buttonMappings = [
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
        
        buttonMappings.forEach(button => {
            const btnElement = document.getElementById(button.id);
            if (btnElement) {
                // Criar uma cópia limpa do botão (sem event listeners)
                const newBtn = btnElement.cloneNode(true);
                if (btnElement.parentNode) {
                    btnElement.parentNode.replaceChild(newBtn, btnElement);
                }
                
                // Adicionar novo event listener direto
                newBtn.addEventListener('click', function() {
                    showScreen(button.target);
                    console.log(`Navegando para: ${button.target}`);
                });
                console.log(`✅ Botão '${button.id}' corrigido`);
            }
        });
        
        // Função para navegar entre telas
        window.showScreen = function(screenId) {
            // Esconder todas as telas
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            // Mostrar a tela solicitada
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('active');
            }
        };
    }
    
    // 2. Garantir que as cartas sejam renderizadas
    function ensureCardsRender() {
        console.log("🃏 Corrigindo renderização de cartas...");
        
        // Implementar renderizador de cartas direto
        window.directCardRenderer = {
            renderCard: function(cardData, container, faceUp = true) {
                console.log(`Renderizando carta: ${cardData.color} ${cardData.value}`);
                
                // Criar elemento da carta
                const card = document.createElement('div');
                card.className = `card ${cardData.color}`;
                card.dataset.id = cardData.id || `${cardData.color}-${cardData.value}-${Math.random().toString(36).substr(2, 9)}`;
                card.dataset.color = cardData.color;
                card.dataset.value = cardData.value;
                card.dataset.type = cardData.type || 'unknown';
                
                if (faceUp) {
                    // Criar corpo da carta
                    const inner = document.createElement('div');
                    inner.className = 'card-inner';
                    
                    // Valor/símbolo central da carta
                    const center = document.createElement('div');
                    center.className = 'card-center';
                    
                    // Configurar o conteúdo com base no tipo de carta
                    if (cardData.type === 'number') {
                        center.textContent = cardData.value;
                    } else {
                        // Para cartas especiais
                        switch(cardData.value) {
                            case 'skip': center.textContent = '⊘'; break;
                            case 'reverse': center.textContent = '↺'; break;
                            case 'draw2': center.textContent = '+2'; break;
                            case 'wild': center.textContent = '★'; break;
                            case 'wild-draw-four': center.textContent = '+4'; break;
                            default: center.textContent = cardData.value;
                        }
                    }
                    
                    inner.appendChild(center);
                    card.appendChild(inner);
                } else {
                    // Verso da carta
                    card.classList.add('card-back');
                    
                    const logo = document.createElement('div');
                    logo.className = 'card-back-logo';
                    logo.textContent = 'UNO';
                    
                    card.appendChild(logo);
                }
                
                // Adicionar a carta ao container
                if (container) {
                    container.appendChild(card);
                }
                
                return card;
            },
            
            renderPlayerHand: function() {
                console.log("Renderizando mão do jogador");
                
                // Verificar se temos dados de cartas no localStorage (para debug)
                let testCards = [
                    {color: 'red', value: '7', type: 'number'},
                    {color: 'blue', value: '4', type: 'number'},
                    {color: 'green', value: 'skip', type: 'action'},
                    {color: 'yellow', value: 'reverse', type: 'action'},
                    {color: 'red', value: 'draw2', type: 'action'},
                    {color: 'black', value: 'wild', type: 'wild'},
                    {color: 'black', value: 'wild-draw-four', type: 'wild'}
                ];
                
                // Obter container da mão do jogador
                const playerHand = document.getElementById('player-hand');
                if (playerHand) {
                    // Limpar container
                    playerHand.innerHTML = '';
                    
                    // Renderizar cartas
                    testCards.forEach(card => {
                        this.renderCard(card, playerHand, true);
                    });
                }
            },
            
            // Método para renderizar a pilha de descarte
            renderDiscardPile: function() {
                console.log("Renderizando pilha de descarte");
                
                // Carta de exemplo para o descarte
                const topCard = {color: 'blue', value: '5', type: 'number'};
                
                // Obter container da pilha de descarte
                const discardPile = document.getElementById('discard-pile');
                if (discardPile) {
                    // Limpar container
                    discardPile.innerHTML = '';
                    
                    // Renderizar carta no topo
                    this.renderCard(topCard, discardPile, true);
                }
            },
            
            // Método para renderizar a pilha de compra
            renderDrawPile: function() {
                console.log("Renderizando pilha de compra");
                
                // Obter container da pilha de compra
                const drawPile = document.getElementById('draw-pile');
                if (drawPile) {
                    // Limpar container
                    drawPile.innerHTML = '';
                    
                    // Adicionar 3 cartas empilhadas para representar o monte
                    for (let i = 0; i < 3; i++) {
                        const card = this.renderCard({color: 'back', value: 'back'}, null, false);
                        card.style.position = 'absolute';
                        card.style.top = `${i * 2}px`;
                        card.style.left = `${i * 2}px`;
                        drawPile.appendChild(card);
                    }
                }
            }
        };
        
        // Adicionar teste de renderização ao botão de jogo
        const playLocalBtn = document.getElementById('play-local-btn');
        if (playLocalBtn) {
            playLocalBtn.addEventListener('click', function() {
                setTimeout(() => {
                    // Renderizar cartas de teste ao entrar na tela de jogo local
                    window.directCardRenderer.renderPlayerHand();
                    window.directCardRenderer.renderDiscardPile();
                    window.directCardRenderer.renderDrawPile();
                }, 500);
            });
        }
    }
    
    // 3. Corrigir inicialização do jogo
    function fixGameStart() {
        console.log("🎮 Corrigindo inicialização do jogo...");
        
        // Obter botão de iniciar jogo
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            // Criar cópia limpa do botão
            const newStartBtn = startGameBtn.cloneNode(true);
            if (startGameBtn.parentNode) {
                startGameBtn.parentNode.replaceChild(newStartBtn, startGameBtn);
            }
            
            // Adicionar fix direto para iniciar jogo
            newStartBtn.addEventListener('click', function() {
                console.log("🚀 Tentando iniciar jogo...");
                
                // Desabilitar botão para evitar múltiplos cliques
                newStartBtn.disabled = true;
                newStartBtn.textContent = "Iniciando...";
                
                // Mostrar um overlay de carregamento
                showLoadingOverlay("Iniciando jogo, por favor aguarde...");
                
                // Tentar iniciar o jogo diretamente
                startGameDirectly()
                    .then(result => {
                        if (result.success) {
                            console.log("✅ Jogo iniciado com sucesso!");
                            showScreen('game-screen');
                            
                            // Renderizar cartas de exemplo
                            window.directCardRenderer.renderPlayerHand();
                            window.directCardRenderer.renderDiscardPile();
                            window.directCardRenderer.renderDrawPile();
                            
                            // Remover overlay
                            removeLoadingOverlay();
                        } else {
                            console.error("❌ Falha ao iniciar jogo:", result.error);
                            showError(result.error || "Falha ao iniciar jogo. Tente novamente.");
                            newStartBtn.disabled = false;
                            newStartBtn.textContent = "Iniciar Jogo";
                            removeLoadingOverlay();
                        }
                    })
                    .catch(error => {
                        console.error("❌ Erro ao iniciar jogo:", error);
                        showError("Ocorreu um erro ao iniciar o jogo. Tente novamente.");
                        newStartBtn.disabled = false;
                        newStartBtn.textContent = "Iniciar Jogo";
                        removeLoadingOverlay();
                    });
            });
            
            console.log("✅ Botão de iniciar jogo corrigido");
        } else {
            console.error("❌ Botão 'start-game-btn' não encontrado!");
        }
    }
    
    // Iniciar jogo diretamente com Firebase
    async function startGameDirectly() {
        try {
            // 1. Verificar se estamos em uma sala e somos o anfitrião
            const sessionData = getSessionData();
            if (!sessionData || !sessionData.roomCode || !sessionData.playerId) {
                return { success: false, error: "Dados da sessão não encontrados. Recarregue a página." };
            }
            
            // 2. Obter dados da sala
            const roomRef = firebase.database().ref(`rooms/${sessionData.roomCode}`);
            const roomSnapshot = await roomRef.once('value');
            const roomData = roomSnapshot.val();
            
            if (!roomData) {
                return { success: false, error: "Sala não encontrada. Crie uma nova sala." };
            }
            
            // 3. Verificar se somos o anfitrião
            if (roomData.host !== sessionData.playerId) {
                return { success: false, error: "Apenas o anfitrião pode iniciar o jogo." };
            }
            
            // 4. Verificar se há jogadores suficientes
            const playerCount = Object.keys(roomData.players || {}).length;
            if (playerCount < 2) {
                return { success: false, error: "São necessários pelo menos 2 jogadores para iniciar o jogo." };
            }
            
            // 5. Criar estado inicial do jogo
            const gameState = createInitialGameState(roomData);
            
            // 6. Atualizar o estado da sala
            await roomRef.child('status').set('playing');
            await roomRef.child('game').set(gameState);
            
            return { success: true, gameState };
        } catch (error) {
            console.error("Erro ao iniciar jogo:", error);
            return { success: false, error: `Erro ao iniciar jogo: ${error.message}` };
        }
    }
    
    // Criar estado inicial do jogo
    function createInitialGameState(roomData) {
        // Criar baralho
        const deck = createDeck(roomData.gameMode);
        
        // Obter jogadores
        const players = Object.values(roomData.players || {});
        
        // Distribuir cartas
        const hands = {};
        players.forEach(player => {
            hands[player.id] = drawCardsFromDeck(deck, 7);
        });
        
        // Virar a primeira carta (que não seja Wild Draw Four)
        let firstCard;
        do {
            firstCard = drawCardsFromDeck(deck, 1)[0];
            
            // Se for Wild Draw Four, colocar de volta no baralho e tentar novamente
            if (firstCard.type === 'wild' && firstCard.value === 'wild-draw-four') {
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
        
        // Construir estado do jogo
        return {
            deck: deck,
            discard: [firstCard],
            currentColor: initialColor,
            hands: hands,
            currentPlayerIndex: 0,
            direction: 1,
            drawStack: 0,
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
        
        // Embaralhar o baralho
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
    
    // Obter dados da sessão
    function getSessionData() {
        try {
            // Tentar obter do localStorage
            const sessionData = localStorage.getItem('unoSession');
            if (sessionData) {
                return JSON.parse(sessionData);
            }
            
            // Alternativa - tentar obter da memória
            if (window.roomManager && window.roomManager.getCurrentPlayerInfo) {
                return window.roomManager.getCurrentPlayerInfo();
            }
            
            return null;
        } catch (error) {
            console.error("Erro ao obter dados da sessão:", error);
            return null;
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