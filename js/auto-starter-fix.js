/**
 * Correção Automática Final para UNO Game
 * Data: 2025-04-11 20:43:56
 * Desenvolvido por: Duduxindev
 */
(function() {
    console.log("🎮 UNO Auto-Start Fix: Inicializando...");
    
    // Contagem regressiva para iniciar
    let countdownInterval = null;
    let countdownValue = 0;
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoStartFix);
    } else {
        initAutoStartFix();
    }
    
    function initAutoStartFix() {
        console.log("🛠️ Aplicando correções finais ao UNO...");
        
        // Monitorar telas
        observeScreenChanges();
        
        // Verificar periodicamente o status da sala e jogadores
        setInterval(checkRoomStatus, 2000);
        
        // Corrigir jogabilidade das cartas a cada segundo
        setInterval(fixCardPlayability, 1000);
        
        // Monitorar mudanças nos jogadores para auto-início
        setupAutoStart();
        
        // Forçar o botão de anfitrião (em caso de falha anterior)
        forceHostButton();
    }
    
    //===================================================================
    // CORREÇÃO 1: JOGABILIDADE DAS CARTAS
    //===================================================================
    
    // Corrigir jogabilidade das cartas
    function fixCardPlayability() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || !gameScreen.classList.contains('active')) {
            return; // Não estamos na tela de jogo
        }
        
        // Obter mão do jogador
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Verificar se há cartas na mão
        if (playerHand.children.length === 0) {
            // Tentar render as cartas se ainda não existirem
            generatePlayerCards();
            return;
        }
        
        // Obter todas as cartas da mão
        const cards = playerHand.querySelectorAll('.card');
        
        // Se não há eventos de clique, adicionar
        cards.forEach(card => {
            // Verificar se já tem evento de clique (usando data attribute)
            if (card.dataset.hasClickEvent !== 'true') {
                // Adicionar evento de clique
                card.addEventListener('click', function() {
                    playCard(this);
                });
                
                // Marcar como tendo evento
                card.dataset.hasClickEvent = 'true';
                
                // Adicionar classe de jogável se não for disabled
                if (!card.classList.contains('disabled')) {
                    card.classList.add('playable');
                    
                    // Adicionar indicador visual
                    if (!card.querySelector('.playable-indicator')) {
                        const indicator = document.createElement('div');
                        indicator.className = 'playable-indicator';
                        indicator.textContent = 'Jogável';
                        card.appendChild(indicator);
                    }
                }
            }
        });
    }
    
    // Gerar cartas para o jogador (caso não existam)
    function generatePlayerCards() {
        console.log("🃏 Gerando cartas para o jogador...");
        
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Verificar se já existem cartas
        if (playerHand.children.length > 0) return;
        
        // Tentar obter cartas do jogo real
        loadRealPlayerCards()
            .then(cards => {
                if (cards && cards.length > 0) {
                    renderPlayerCards(cards);
                } else {
                    // Usar cartas aleatórias como fallback
                    renderRandomCards();
                }
            })
            .catch(error => {
                console.error("❌ Erro ao carregar cartas reais:", error);
                renderRandomCards();
            });
    }
    
    // Carregar cartas reais do jogador
    async function loadRealPlayerCards() {
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode || !sessionData.playerId) {
            return null;
        }
        
        try {
            // Obter mão do jogador do Firebase
            const snapshot = await firebase.database()
                .ref(`rooms/${sessionData.roomCode}/game/hands/${sessionData.playerId}`)
                .once('value');
                
            return snapshot.val() || [];
        } catch (error) {
            console.error("❌ Erro ao carregar cartas do Firebase:", error);
            return null;
        }
    }
    
    // Renderizar cartas aleatórias
    function renderRandomCards() {
        console.log("🎲 Renderizando cartas aleatórias...");
        
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Limpar mão atual
        playerHand.innerHTML = '';
        
        // Gerar 7 cartas aleatórias
        const cards = generateRandomCards(7);
        
        // Renderizar cartas
        renderPlayerCards(cards);
    }
    
    // Renderizar cartas do jogador
    function renderPlayerCards(cards) {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Limpar mão atual
        playerHand.innerHTML = '';
        
        // Determinar topCard e currentColor para jogabilidade
        let topCard = null;
        let currentColor = 'red'; // Cor padrão
        
        // Tentar obter do discard pile
        const discardPile = document.getElementById('discard-pile');
        if (discardPile && discardPile.firstChild) {
            const topCardElement = discardPile.firstChild;
            topCard = {
                color: topCardElement.dataset.color,
                value: topCardElement.dataset.value,
                type: topCardElement.dataset.type
            };
            
            // Ajustar a cor atual
            currentColor = topCardElement.dataset.chosenColor || topCard.color;
        }
        
        // Renderizar cada carta
        cards.forEach((card, index) => {
            // Verificar se é jogável
            const isPlayable = isCardPlayable(card, topCard, currentColor);
            
            // Criar elemento da carta
            const cardElement = createCardElement(card, isPlayable);
            
            // Aplicar efeito de entrada com atraso
            setTimeout(() => {
                cardElement.classList.add('in-hand');
            }, index * 100);
            
            // Adicionar à mão
            playerHand.appendChild(cardElement);
        });
        
        // Atualizar contador de cartas
        const cardCounter = document.getElementById('card-count');
        if (cardCounter) {
            cardCounter.textContent = `${cards.length} carta${cards.length !== 1 ? 's' : ''}`;
        }
    }
    
    // Verificar se uma carta é jogável
    function isCardPlayable(card, topCard, currentColor) {
        // Curingas são sempre jogáveis
        if (card.type === 'wild') {
            return true;
        }
        
        // Mesma cor
        if (card.color === currentColor) {
            return true;
        }
        
        // Mesmo valor/símbolo
        if (topCard && card.value === topCard.value) {
            return true;
        }
        
        return false;
    }
    
    // Criar elemento da carta
    function createCardElement(card, isPlayable = true) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.color}`;
        
        if (isPlayable) {
            cardElement.classList.add('playable');
        } else {
            cardElement.classList.add('disabled');
        }
        
        cardElement.dataset.id = card.id || `${card.color}-${card.value}-${Math.random().toString(36).substr(2, 9)}`;
        cardElement.dataset.color = card.color;
        cardElement.dataset.value = card.value;
        cardElement.dataset.type = card.type || (card.value >= 0 && card.value <= 9 ? 'number' : 'action');
        
        // Criar conteúdo da carta
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        // Valor central
        const cardCenter = document.createElement('div');
        cardCenter.className = 'card-center';
        
        // Definir símbolo/valor com base no tipo da carta
        if (card.type === 'number' || (card.value >= 0 && card.value <= 9)) {
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
        if (card.type === 'wild' || card.value === 'wild' || card.value === 'wild-draw-four') {
            const wildColors = document.createElement('div');
            wildColors.className = 'wild-colors';
            
            ['red', 'blue', 'green', 'yellow'].forEach(color => {
                const colorDiv = document.createElement('div');
                colorDiv.className = `wild-color ${color}`;
                wildColors.appendChild(colorDiv);
            });
            
            cardInner.appendChild(wildColors);
        }
        
        // Adicionar cantos (opcional, para melhorar visual)
        const topLeft = document.createElement('div');
        topLeft.className = 'card-corner top-left';
        
        const bottomRight = document.createElement('div');
        bottomRight.className = 'card-corner bottom-right';
        
        // Definir texto dos cantos igual ao centro
        topLeft.textContent = cardCenter.textContent;
        bottomRight.textContent = cardCenter.textContent;
        
        cardInner.appendChild(topLeft);
        cardInner.appendChild(bottomRight);
        
        // Adicionar indicador de jogável se aplicável
        if (isPlayable) {
            const indicator = document.createElement('div');
            indicator.className = 'playable-indicator';
            indicator.textContent = 'Jogável';
            cardElement.appendChild(indicator);
        }
        
        cardElement.appendChild(cardInner);
        
        // Adicionar evento de clique
        cardElement.addEventListener('click', function() {
            playCard(this);
        });
        cardElement.dataset.hasClickEvent = 'true';
        
        return cardElement;
    }
    
    // Gerar cartas aleatórias
    function generateRandomCards(count) {
        const cards = [];
        const types = ['number', 'number', 'number', 'action', 'wild'];  // Mais cartas numéricas
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Array de valores específicos para evitar duplicatas exatas
        const usedValues = new Set();
        
        for (let i = 0; i < count; i++) {
            // Escolher tipo aleatório com mais peso para numéricas
            const typeIndex = Math.floor(Math.random() * types.length);
            const type = types[typeIndex];
            
            let color, value;
            let cardKey;
            
            // Tentar criar uma carta única
            do {
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
                
                // Criar chave única para esta carta
                cardKey = `${color}-${value}`;
            } while (usedValues.has(cardKey) && usedValues.size < 40); // Evitar duplicatas quando possível
            
            // Adicionar à lista de valores usados
            usedValues.add(cardKey);
            
            // Criar ID único para a carta
            const id = `random-${i}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Adicionar à mão
            cards.push({
                id,
                type,
                color,
                value
            });
        }
        
        return cards;
    }
    
    // Jogar uma carta
    function playCard(cardElement) {
        // Verificar se é uma carta válida e jogável
        if (!cardElement || cardElement.classList.contains('disabled')) {
            console.log("⚠️ Carta não jogável");
            showMessage("Esta carta não pode ser jogada agora");
            return;
        }
        
        console.log("🎮 Jogando carta:", cardElement.dataset.color, cardElement.dataset.value);
        
        // Obter dados da carta
        const card = {
            id: cardElement.dataset.id,
            color: cardElement.dataset.color,
            value: cardElement.dataset.value,
            type: cardElement.dataset.type
        };
        
        // Se for curinga, mostrar seletor de cores
        if (card.type === 'wild' || card.value === 'wild' || card.value === 'wild-draw-four') {
            showColorSelector(card, cardElement);
            return;
        }
        
        // Tentar jogar a carta
        playCardWithColor(card, null, cardElement);
    }
    
    // Mostrar seletor de cores
    function showColorSelector(card, cardElement) {
        console.log("🎨 Mostrando seletor de cores");
        
        // Obter seletor de cores
        const colorSelector = document.getElementById('color-selector');
        if (!colorSelector) {
            // Se não existe, jogar com cor aleatória
            const colors = ['red', 'blue', 'green', 'yellow'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            playCardWithColor(card, randomColor, cardElement);
            return;
        }
        
        // Guardar referência ao elemento da carta para uso posterior
        colorSelector.dataset.cardId = card.id;
        
        // Configurar botões de cores
        const colorButtons = colorSelector.querySelectorAll('.color-btn');
        colorButtons.forEach(button => {
            // Remover event listeners anteriores
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Adicionar novo event listener
            newButton.addEventListener('click', function() {
                const color = newButton.dataset.color;
                colorSelector.classList.add('hidden');
                playCardWithColor(card, color, cardElement);
            });
        });
        
        // Mostrar seletor
        colorSelector.classList.remove('hidden');
    }
    
    // Jogar carta com cor selecionada
    function playCardWithColor(card, chosenColor, cardElement) {
        console.log(`🎮 Jogando carta ${card.value} ${card.color} ${chosenColor ? `com cor ${chosenColor}` : ''}`);
        
        // Animar jogada
        animateCardPlay(cardElement, chosenColor);
        
        // Atualizar pilha de descarte
        updateDiscardPile(card, chosenColor);
        
        // Remover carta da mão
        if (cardElement && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement);
        }
        
        // Atualizar contador de cartas
        const playerHand = document.getElementById('player-hand');
        const cardCount = playerHand ? playerHand.children.length : 0;
        
        const cardCounter = document.getElementById('card-count');
        if (cardCounter) {
            cardCounter.textContent = `${cardCount} carta${cardCount !== 1 ? 's' : ''}`;
        }
        
        // Verificar vitória
        if (cardCount === 0) {
            showMessage("PARABÉNS! Você venceu!", 5000);
            
            // Mostrar overlay de vitória
            showVictoryOverlay();
        } else if (cardCount === 1) {
            // Mostrar alerta de UNO
            showMessage("Você está com apenas uma carta! UNO!", 3000);
        }
        
        // Tentar atualizar dados no Firebase (se estiver online)
        updateFirebaseGameState(card, chosenColor);
    }
    
    // Animar jogada de carta
    function animateCardPlay(cardElement, chosenColor) {
        if (!cardElement) return;
        
        // Obter posições
        const cardRect = cardElement.getBoundingClientRect();
        
        // Obter pilha de descarte
        const discardPile = document.getElementById('discard-pile');
        if (!discardPile) return;
        
        const discardRect = discardPile.getBoundingClientRect();
        
        // Criar clone para animação
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${cardRect.top}px`;
        clone.style.left = `${cardRect.left}px`;
        clone.style.width = `${cardRect.width}px`;
        clone.style.height = `${cardRect.height}px`;
        clone.style.zIndex = '1000';
        clone.style.transition = 'all 0.3s ease-out';
        
        // Para curingas, adicionar cor escolhida
        if (chosenColor && (cardElement.dataset.type === 'wild' || cardElement.dataset.value === 'wild' || cardElement.dataset.value === 'wild-draw-four')) {
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
            if (document.body.contains(clone)) {
                document.body.removeChild(clone);
            }
        }, 350);
    }
    
    // Atualizar pilha de descarte
    function updateDiscardPile(card, chosenColor) {
        const discardPile = document.getElementById('discard-pile');
        if (!discardPile) return;
        
        // Limpar pilha atual
        discardPile.innerHTML = '';
        
        // Criar elemento da carta
        const cardElement = createCardElement(card, false);
        cardElement.classList.remove('disabled');
        cardElement.classList.remove('playable');
        
        // Para curingas, aplicar cor escolhida
        if (chosenColor && (card.type === 'wild' || card.value === 'wild' || card.value === 'wild-draw-four')) {
            cardElement.dataset.chosenColor = chosenColor;
            cardElement.classList.add('colored-wild');
            
            // Adicionar overlay de cor
            const overlay = document.createElement('div');
            overlay.className = `color-overlay ${chosenColor}`;
            cardElement.appendChild(overlay);
        }
        
        // Adicionar à pilha
        discardPile.appendChild(cardElement);
    }
    
    // Atualizar estado do jogo no Firebase
    function updateFirebaseGameState(card, chosenColor) {
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode || !sessionData.playerId) {
            return;
        }
        
        // Referência ao jogo
        const gameRef = firebase.database().ref(`rooms/${sessionData.roomCode}/game`);
        
        // Tentar atualizar o estado do jogo
        gameRef.once('value')
            .then(snapshot => {
                const gameData = snapshot.val();
                
                if (!gameData) {
                    return;
                }
                
                // Verificar se é a vez do jogador
                if (gameData.playerIds[gameData.currentPlayerIndex] !== sessionData.playerId) {
                    showMessage("Não é sua vez de jogar!");
                    return;
                }
                
                // Verificar se o jogador tem a carta
                const playerHand = gameData.hands[sessionData.playerId] || [];
                const cardIndex = playerHand.findIndex(c => c.id === card.id);
                
                if (cardIndex === -1) {
                    return;
                }
                
                // Remover carta da mão do jogador
                playerHand.splice(cardIndex, 1);
                
                // Adicionar à pilha de descarte
                gameData.discard.unshift(card);
                
                // Atualizar cor atual para cartas curinga
                if ((card.type === 'wild' || card.value === 'wild' || card.value === 'wild-draw-four') && chosenColor) {
                    gameData.currentColor = chosenColor;
                } else {
                    gameData.currentColor = card.color;
                }
                
                // Atualizar mão do jogador
                gameData.hands[sessionData.playerId] = playerHand;
                
                // Aplicar efeitos da carta
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
                    return firebase.database().ref(`rooms/${sessionData.roomCode}`).update({
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
                console.log("✅ Estado do jogo atualizado com sucesso no Firebase");
            })
            .catch(error => {
                console.error("❌ Erro ao atualizar estado do jogo:", error);
            });
    }
    
    // Aplicar efeitos da carta
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
        
        console.log(`🔄 Reembaralhando pilha de descarte...`);
        
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
    
    // Mostrar overlay de vitória
    function showVictoryOverlay() {
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        
        // Adicionar conteúdo
        overlay.innerHTML = `
            <div class="victory-content">
                <h1>VITÓRIA!</h1>
                <p>Parabéns! Você venceu o jogo!</p>
                <button class="primary-btn back-to-menu-btn">Voltar ao Menu</button>
            </div>
        `;
        
        // Adicionar à página
        document.body.appendChild(overlay);
        
        // Adicionar evento ao botão
        const backButton = overlay.querySelector('.back-to-menu-btn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                // Remover overlay
                document.body.removeChild(overlay);
                
                // Voltar ao menu
                showScreen('start-screen');
            });
        }
    }
    
    //===================================================================
    // CORREÇÃO 2: BOTÃO DE ANFITRIÃO NO MODO ONLINE
    //===================================================================
    
    // Forçar exibição do botão de anfitrião
    function forceHostButton() {
        console.log("👑 Verificando botão de anfitrião...");
        
        // Verificar a cada 2 segundos se estamos na sala de espera
        setInterval(() => {
            const waitingRoom = document.getElementById('waiting-room-screen');
            if (!waitingRoom || !waitingRoom.classList.contains('active')) {
                return; // Não estamos na tela de sala de espera
            }
            
            // Obter dados da sessão
            const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
            if (!sessionData.roomCode) {
                return;
            }
            
            // Verificar se somos o anfitrião
            firebase.database().ref(`rooms/${sessionData.roomCode}`).once('value')
                .then(snapshot => {
                    const roomData = snapshot.val();
                    
                    if (!roomData) {
                        return;
                    }
                    
                    const isHost = roomData.host === sessionData.playerId;
                    
                    // Obter botão de iniciar jogo
                    const startButton = document.getElementById('start-game-btn');
                    if (!startButton) {
                        // Criar botão se não existir
                        createStartButton(isHost);
                        return;
                    }
                    
                    // Atualizar visibilidade do botão
                    updateStartButtonVisibility(startButton, isHost);
                })
                .catch(error => {
                    console.error("❌ Erro ao verificar status de anfitrião:", error);
                });
        }, 2000);
    }
    
    // Criar botão de iniciar jogo
    function createStartButton(isHost) {
        console.log("➕ Criando botão de iniciar jogo...");
        
        // Obter container de botões
        const buttonsRow = document.querySelector('.waiting-room-left .buttons-row');
        if (!buttonsRow) {
            return;
        }
        
        // Criar botão
        const startButton = document.createElement('button');
        startButton.id = 'start-game-btn';
        startButton.className = 'primary-btn pulse-button';
        startButton.textContent = 'Iniciar Jogo';
        
        // Configurar visibilidade inicial
        updateStartButtonVisibility(startButton, isHost);
        
        // Adicionar evento de clique
        startButton.addEventListener('click', startGame);
        
        // Adicionar ao início dos botões
        if (buttonsRow.firstChild) {
            buttonsRow.insertBefore(startButton, buttonsRow.firstChild);
        } else {
            buttonsRow.appendChild(startButton);
        }
    }
    
    // Atualizar visibilidade do botão de iniciar
    function updateStartButtonVisibility(button, isHost) {
        if (!button) return;
        
        if (isHost) {
            // Mostrar e habilitar
            button.style.display = 'block';
            button.style.visibility = 'visible';
            button.style.opacity = '1';
            button.disabled = false;
            button.style.pointerEvents = 'auto';
            
            // Aplicar estilos para destaque
            button.style.backgroundColor = '#27AE60';
            button.style.boxShadow = '0 4px 10px rgba(39, 174, 96, 0.3)';
            
            // Adicionar evento de clique (garantindo um único listener)
            const newButton = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newButton, button);
            }
            newButton.addEventListener('click', startGame);
        } else {
            // Esconder para jogadores normais
            button.style.display = 'none';
        }
    }
    
    // Iniciar o jogo
    function startGame() {
        console.log("🚀 Iniciando jogo...");
        
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode) {
            showError("Não foi possível iniciar o jogo. Dados da sessão não encontrados.");
            return;
        }
        
        // Mostrar overlay de carregamento
        showLoadingOverlay("Iniciando jogo...");
        
        // Referência à sala
        const roomRef = firebase.database().ref(`rooms/${sessionData.roomCode}`);
        
        // Verificar sala e iniciar jogo
        roomRef.once('value')
            .then(snapshot => {
                const roomData = snapshot.val();
                
                if (!roomData) {
                    throw new Error("Sala não encontrada");
                }
                
                // Verificar se há jogadores suficientes
                const playerCount = Object.keys(roomData.players || {}).length;
                if (playerCount < 2) {
                    throw new Error("São necessários pelo menos 2 jogadores para iniciar o jogo");
                }
                
                // Criar estado inicial do jogo
                const gameState = createInitialGameState(roomData);
                
                // Atualizar sala
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
                
                // Exibir mensagem de sucesso
                showMessage("Jogo iniciado! Prepare-se para jogar!", 3000);
                
                // Remover overlay de carregamento
                removeLoadingOverlay();
            })
            .catch(error => {
                console.error("❌ Erro ao iniciar jogo:", error);
                showError(error.message || "Erro ao iniciar o jogo");
                removeLoadingOverlay();
            });
    }
    
    // Criar estado inicial do jogo
    function createInitialGameState(roomData) {
        console.log("🎲 Criando estado inicial do jogo...");
        
        // Obter jogadores e ordenar (anfitrião primeiro)
        const players = Object.entries(roomData.players || {}).map(([id, data]) => ({
            id,
            ...data
        }));
        
        players.sort((a, b) => {
            if (a.id === roomData.host) return -1;
            if (b.id === roomData.host) return 1;
            return a.joinedAt - b.joinedAt;
        });
        
        // Criar baralho
        const deck = createRandomDeck(roomData.gameMode);
        
        // Distribuir cartas
        const hands = {};
        players.forEach(player => {
            hands[player.id] = deck.splice(0, 7);
        });
        
        // Escolher primeira carta (que não seja Wild Draw Four)
        let firstCard;
        do {
            firstCard = deck.shift();
            
            // Se for Wild Draw Four, colocar de volta no final
            if (firstCard && (firstCard.type === 'wild' || firstCard.value === 'wild-draw-four')) {
                deck.push(firstCard);
                firstCard = null;
            }
        } while (!firstCard);
        
        // Determinar cor inicial
        let initialColor = firstCard.color;
        if (firstCard.type === 'wild' || firstCard.value === 'wild') {
            const colors = ['red', 'blue', 'green', 'yellow'];
            initialColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        // Determinar jogador inicial
        let startingPlayerIndex = 0;
        
        // Aplicar efeitos da primeira carta
        if (firstCard.type === 'action' || 
            firstCard.value === 'skip' || 
            firstCard.value === 'reverse' || 
            firstCard.value === 'draw2') {
            
            switch (firstCard.value) {
                case 'skip':
                    // Pular primeiro jogador
                    startingPlayerIndex = 1 % players.length;
                    break;
                case 'reverse':
                    // Em jogo de 2, funciona como Skip
                    if (players.length === 2) {
                        startingPlayerIndex = 1;
                    }
                    break;
                case 'draw2':
                    // Primeiro jogador compra 2 e perde a vez
                    hands[players[0].id].push(...deck.splice(0, 2));
                    startingPlayerIndex = 1 % players.length;
                    break;
            }
        }
        
        // Construir estado do jogo
        return {
            playerIds: players.map(p => p.id),
            currentPlayerIndex: startingPlayerIndex,
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
            
            // Cartas de ação
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
            console.log("🃏 Adicionando cartas especiais para modo " + gameMode);
            
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
        
        return deck;
    }
    
    //===================================================================
    // CORREÇÃO 3: AUTO-INICIAR COM SALA CHEIA
    //===================================================================
    
    // Configurar auto-início do jogo
    function setupAutoStart() {
        console.log("⏱️ Configurando auto-início do jogo...");
        
        // Verificar a cada 2 segundos se a sala está cheia
        setInterval(checkIfRoomIsFull, 2000);
    }
    
    // Verificar se a sala está cheia para auto-iniciar
    function checkIfRoomIsFull() {
        // Verificar se estamos na sala de espera
        const waitingRoom = document.getElementById('waiting-room-screen');
        if (!waitingRoom || !waitingRoom.classList.contains('active')) {
            // Não estamos na tela de sala de espera, cancelar contagem se estiver em andamento
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                countdownValue = 0;
            }
            return;
        }
        
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode) {
            return;
        }
        
        // Verificar se somos o anfitrião
        firebase.database().ref(`rooms/${sessionData.roomCode}`).once('value')
            .then(snapshot => {
                const roomData = snapshot.val();
                
                if (!roomData) {
                    return;
                }
                
                // Verificar se somos o anfitrião
                const isHost = roomData.host === sessionData.playerId;
                
                if (!isHost) {
                    return; // Apenas o anfitrião controla o auto-início
                }
                
                // Verificar se a sala está cheia
                const currentPlayers = Object.keys(roomData.players || {}).length;
                const maxPlayers = roomData.maxPlayers || 4;
                
                if (currentPlayers >= maxPlayers) {
                    // Sala está cheia, iniciar contagem regressiva
                    startCountdown();
                } else if (currentPlayers >= 2) {
                    // Sala tem pelo menos 2 jogadores, mostrar botão
                    showHostButton();
                } else {
                    // Não há jogadores suficientes, cancelar contagem se estiver em andamento
                    if (countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                        countdownValue = 0;
                        
                        // Remover mensagem de contagem
                        const waitingMessage = document.getElementById('waiting-message');
                        if (waitingMessage) {
                            waitingMessage.innerHTML = '<p>Aguardando jogadores entrarem na sala...</p>';
                        }
                    }
                }
            })
            .catch(error => {
                console.error("❌ Erro ao verificar status da sala:", error);
            });
    }
    
    // Iniciar contagem regressiva para auto-início
    function startCountdown() {
        // Se já tem uma contagem em andamento, não iniciar outra
        if (countdownInterval) {
            return;
        }
        
        console.log("⏱️ Iniciando contagem regressiva para auto-início...");
        
        // Iniciar com 10 segundos
        countdownValue = 10;
        
        // Atualizar mensagem
        updateCountdownMessage();
        
        // Iniciar intervalo
        countdownInterval = setInterval(() => {
            // Decrementar contador
            countdownValue--;
            
            // Atualizar mensagem
            updateCountdownMessage();
            
            // Verificar se chegou a zero
            if (countdownValue <= 0) {
                // Parar contagem
                clearInterval(countdownInterval);
                countdownInterval = null;
                
                // Iniciar jogo
                startGame();
            }
        }, 1000);
    }
    
    // Atualizar mensagem de contagem regressiva
    function updateCountdownMessage() {
        const waitingMessage = document.getElementById('waiting-message');
        if (waitingMessage) {
            waitingMessage.innerHTML = `
                <p>Sala completa! O jogo começará automaticamente em ${countdownValue} segundo${countdownValue !== 1 ? 's' : ''}...</p>
                <div class="countdown-bar">
                    <div class="countdown-progress" style="width: ${(countdownValue / 10) * 100}%"></div>
                </div>
            `;
        }
    }
    
    // Mostrar botão de anfitrião
    function showHostButton() {
        const startButton = document.getElementById('start-game-btn');
        if (startButton) {
            startButton.style.display = 'block';
            startButton.style.visibility = 'visible';
            startButton.style.opacity = '1';
            startButton.disabled = false;
            startButton.style.pointerEvents = 'auto';
        }
    }
    
    //===================================================================
    // FUNÇÕES DE MONITORAMENTO E UTILIDADES
    //===================================================================
    
    // Verificar status da sala
    function checkRoomStatus() {
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode) {
            return;
        }
        
        // Verificar status da sala
        firebase.database().ref(`rooms/${sessionData.roomCode}/status`).once('value')
            .then(snapshot => {
                const status = snapshot.val();
                
                if (status === 'playing') {
                    // Jogo já iniciou, verificar se estamos na tela de jogo
                    const gameScreen = document.getElementById('game-screen');
                    const waitingRoomScreen = document.getElementById('waiting-room-screen');
                    
                    if (waitingRoomScreen && waitingRoomScreen.classList.contains('active')) {
                        // Estamos na sala de espera, mas o jogo já começou
                        console.log("🎮 Jogo já iniciado, redirecionando para tela de jogo...");
                        
                        // Navegar para tela de jogo
                        showScreen('game-screen');
                        
                        // Mostrar mensagem
                        showMessage("O jogo foi iniciado!", 3000);
                    }
                }
            })
            .catch(error => {
                console.error("❌ Erro ao verificar status da sala:", error);
            });
    }
    
    // Observar mudanças de tela
    function observeScreenChanges() {
        // Verificar telas a cada segundo
        setInterval(() => {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen) {
                // Verificar se mudamos para a tela de jogo
                if (activeScreen.id === 'game-screen') {
                    // Garantir que as cartas são renderizadas
                    setTimeout(generatePlayerCards, 500);
                }
            }
        }, 1000);
    }
    
    // Mostrar overlay de carregamento
    function showLoadingOverlay(message) {
        // Verificar se já existe um overlay
        let overlay = document.querySelector('.loading-overlay');
        
        if (!overlay) {
            // Criar novo overlay
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            
            // Adicionar spinner
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            overlay.appendChild(spinner);
            
            // Adicionar mensagem
            const messageElement = document.createElement('div');
            messageElement.className = 'loading-message';
            overlay.appendChild(messageElement);
            
            // Adicionar à página
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
    
    // Mostrar mensagem na tela
    function showMessage(message, duration = 3000) {
        console.log("💬 " + message);
        
        // Obter container de mensagens ou criar um novo
        let messagesContainer = document.getElementById('game-messages');
        
        if (!messagesContainer) {
            messagesContainer = document.createElement('div');
            messagesContainer.id = 'game-messages';
            messagesContainer.className = 'game-messages';
            
            // Adicionar à página
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
        
        // Adicionar à página
        messagesContainer.appendChild(messageElement);
        
        // Adicionar classe de exibição
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 10);
        
        // Configurar remoção após duração
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
    
    // Mostrar erro
    function showError(message) {
        console.error("❌ ERRO:", message);
        
        // Obter toast
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast show error';
            
            // Remover após 5 segundos
            setTimeout(() => {
                toast.className = 'toast';
            }, 5000);
        } else {
            // Fallback para alert
            alert(message);
        }
    }
    
    // Função global para navegar entre telas
    function showScreen(screenId) {
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar tela solicitada
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            console.log(`📱 Navegando para tela: ${screenId}`);
            
            // Inicializações específicas
            if (screenId === 'game-screen') {
                // Inicializar tela de jogo
                setTimeout(generatePlayerCards, 500);
            }
        } else {
            console.error(`❌ Tela não encontrada: ${screenId}`);
        }
    }
    
    // Exportar função global
    window.showScreen = showScreen;
})();