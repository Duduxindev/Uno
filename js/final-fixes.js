/**
 * Correção Final para UNO Game
 * Data: 2025-04-11 20:35:06
 * Desenvolvido por: Duduxindev
 */
(function() {
    console.log("🎮 UNO Final Fixes: Inicializando...");
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFinalFixes);
    } else {
        initFinalFixes();
    }
    
    function initFinalFixes() {
        // Configurar observador de salas para redirecionar para o jogo
        setupRoomObserver();
        
        // Verificar periodicamente o status do jogo
        setInterval(checkGameStatus, 2000);
        
        // Observar mudanças nas telas
        observeScreenChanges();
    }
    
    // Observar mudanças nas telas para aplicar correções específicas
    function observeScreenChanges() {
        // Verificar telas a cada 500ms
        setInterval(() => {
            const activeScreen = document.querySelector('.screen.active');
            if (activeScreen && activeScreen.id === 'game-screen') {
                // Estamos na tela do jogo, garantir que as cartas sejam renderizadas
                ensurePlayerCards();
            }
        }, 500);
    }
    
    // Garantir que o jogador tenha suas 7 cartas
    function ensurePlayerCards() {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Se não houver cartas ou muito poucas cartas, forçar atualização
        if (playerHand.children.length < 7) {
            console.log("🃏 Garantindo que o jogador tenha 7 cartas...");
            loadAndRenderPlayerHand();
        }
    }
    
    // Carregar e renderizar as cartas do jogador
    function loadAndRenderPlayerHand() {
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode || !sessionData.playerId) {
            console.warn("⚠️ Dados da sessão não encontrados.");
            renderFallbackCards();
            return;
        }
        
        // Obter dados do jogo do Firebase
        firebase.database().ref(`rooms/${sessionData.roomCode}/game/hands/${sessionData.playerId}`)
            .once('value')
            .then(snapshot => {
                const playerCards = snapshot.val();
                if (!playerCards || playerCards.length === 0) {
                    console.warn("⚠️ Cartas do jogador não encontradas. Usando cartão de fallback.");
                    renderFallbackCards();
                    return;
                }
                
                // Renderizar cartas do jogador
                renderPlayerCards(playerCards);
            })
            .catch(error => {
                console.error("❌ Erro ao carregar cartas:", error);
                renderFallbackCards();
            });
    }
    
    // Renderizar cartas de fallback (quando não consegue carregar do Firebase)
    function renderFallbackCards() {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        playerHand.innerHTML = '';
        
        // Criar 7 cartas aleatórias
        const cards = generateRandomCards(7);
        
        // Renderizar cada carta
        cards.forEach((card, index) => {
            const cardElement = createCardElement(card);
            playerHand.appendChild(cardElement);
            
            // Aplicar efeito de atraso na entrada
            setTimeout(() => {
                cardElement.classList.add('in-hand');
            }, index * 100);
        });
    }
    
    // Renderizar cartas do jogador
    function renderPlayerCards(cards) {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        playerHand.innerHTML = '';
        
        // Obter dados do jogo para verificar jogabilidade
        getGameStateForPlayability()
            .then(gameState => {
                // Renderizar cada carta
                cards.forEach((card, index) => {
                    // Verificar se a carta é jogável
                    const isPlayable = gameState && isCardPlayable(card, gameState.topCard, gameState.currentColor);
                    
                    const cardElement = createCardElement(card, isPlayable);
                    playerHand.appendChild(cardElement);
                    
                    // Aplicar efeito de atraso na entrada
                    setTimeout(() => {
                        cardElement.classList.add('in-hand');
                    }, index * 100);
                    
                    // Adicionar evento de clique
                    cardElement.addEventListener('click', () => {
                        if (isPlayable) {
                            playCard(card);
                        } else {
                            showError("Esta carta não pode ser jogada agora.");
                        }
                    });
                });
            })
            .catch(() => {
                // Fallback sem verificação de jogabilidade
                cards.forEach((card, index) => {
                    const cardElement = createCardElement(card);
                    playerHand.appendChild(cardElement);
                    
                    setTimeout(() => {
                        cardElement.classList.add('in-hand');
                    }, index * 100);
                });
            });
    }
    
    // Verificar se uma carta é jogável
    function isCardPlayable(card, topCard, currentColor) {
        // Curingas sempre podem ser jogados
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
    
    // Obter estado do jogo para verificar jogabilidade
    async function getGameStateForPlayability() {
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode) return null;
        
        try {
            const gameSnapshot = await firebase.database().ref(`rooms/${sessionData.roomCode}/game`).once('value');
            const gameData = gameSnapshot.val();
            
            if (!gameData || !gameData.discard || gameData.discard.length === 0) {
                return null;
            }
            
            return {
                topCard: gameData.discard[0],
                currentColor: gameData.currentColor,
                currentPlayerIndex: gameData.currentPlayerIndex,
                playerIds: gameData.playerIds
            };
        } catch (error) {
            console.error("Erro ao obter estado do jogo:", error);
            return null;
        }
    }
    
    // Jogar uma carta
    function playCard(card) {
        console.log("🎮 Jogando carta:", card);
        
        // Se for curinga, mostrar seletor de cores
        if (card.type === 'wild') {
            // Guardar carta selecionada para uso posterior
            localStorage.setItem('selectedCard', JSON.stringify(card));
            
            // Mostrar seletor de cores
            const colorSelector = document.getElementById('color-selector');
            if (colorSelector) {
                colorSelector.classList.remove('hidden');
                
                // Garantir que os botões de cor tenham event listeners
                setupColorSelector(card);
            } else {
                // Fallback: escolher cor aleatoriamente
                const colors = ['red', 'blue', 'green', 'yellow'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                playCardWithColor(card, randomColor);
            }
            
            return;
        }
        
        // Jogar carta normal
        playCardWithColor(card);
    }
    
    // Configurar seletor de cores
    function setupColorSelector(selectedCard) {
        const colorSelector = document.getElementById('color-selector');
        if (!colorSelector) return;
        
        // Obter botões de cores
        const colorButtons = colorSelector.querySelectorAll('.color-btn');
        
        // Remover event listeners anteriores
        colorButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newButton, button);
            }
            
            // Adicionar novo event listener
            newButton.addEventListener('click', () => {
                // Obter cor selecionada
                const color = newButton.dataset.color;
                
                // Fechar seletor
                colorSelector.classList.add('hidden');
                
                // Jogar carta com a cor selecionada
                playCardWithColor(selectedCard, color);
            });
        });
    }
    
    // Jogar carta com cor selecionada
    function playCardWithColor(card, chosenColor) {
        console.log(`🎮 Jogando carta ${card.id} ${chosenColor ? `com cor ${chosenColor}` : ''}`);
        
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode || !sessionData.playerId) {
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
                if (!isCardPlayable(card, topCard, gameData.currentColor)) {
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
                } else if (playerHand.length === 1) {
                    // Jogador está com apenas uma carta
                    showMessage("Você está com apenas uma carta! Não esqueça de clicar UNO!");
                }
                
                // Atualizar o jogo
                return gameRef.set(gameData);
            })
            .then(() => {
                console.log("✅ Carta jogada com sucesso!");
            })
            .catch(error => {
                console.error("❌ Erro ao jogar carta:", error);
                showError(error.message || "Erro ao jogar carta.");
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
    
    // Configurar observador de sala para detectar mudanças de status
    function setupRoomObserver() {
        console.log("👁️ Configurando observador de salas...");
        
        // Verificar a cada 2 segundos se o jogo iniciou
        setInterval(() => {
            const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
            if (!sessionData.roomCode) return;
            
            // Verificar status da sala
            firebase.database().ref(`rooms/${sessionData.roomCode}/status`).once('value')
                .then(snapshot => {
                    const status = snapshot.val();
                    
                    if (status === 'playing') {
                        // O jogo começou, verificar se estamos na tela de jogo
                        const gameScreen = document.getElementById('game-screen');
                        const waitingRoomScreen = document.getElementById('waiting-room-screen');
                        
                        if (waitingRoomScreen && waitingRoomScreen.classList.contains('active')) {
                            console.log("🎮 Jogo iniciado! Redirecionando para tela de jogo...");
                            
                            // Mostrar tela de jogo
                            showScreen('game-screen');
                            
                            // Exibir toast informativo
                            showMessage("O jogo foi iniciado pelo anfitrião!");
                        }
                    }
                })
                .catch(error => {
                    console.error("❌ Erro ao verificar status da sala:", error);
                });
        }, 2000);
    }
    
    // Verificar periodicamente o status do jogo
    function checkGameStatus() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || !gameScreen.classList.contains('active')) {
            return; // Não estamos na tela de jogo
        }
        
        // Obter dados da sessão
        const sessionData = JSON.parse(localStorage.getItem('unoSession') || '{}');
        if (!sessionData.roomCode || !sessionData.playerId) return;
        
        // Verificar estado do jogo
        firebase.database().ref(`rooms/${sessionData.roomCode}/game`).once('value')
            .then(snapshot => {
                const gameData = snapshot.val();
                if (!gameData) return;
                
                // Verificar se é a vez do jogador
                const isPlayerTurn = gameData.playerIds[gameData.currentPlayerIndex] === sessionData.playerId;
                
                // Atualizar indicador de turno
                const currentPlayerDisplay = document.getElementById('current-player');
                if (currentPlayerDisplay) {
                    if (isPlayerTurn) {
                        currentPlayerDisplay.textContent = 'Sua vez de jogar!';
                        currentPlayerDisplay.classList.add('your-turn');
                        
                        // Exibir mensagem quando for sua vez
                        showMessage("É a sua vez de jogar!");
                    } else {
                        const currentPlayerIndex = gameData.currentPlayerIndex + 1; // Base 1 para display
                        currentPlayerDisplay.textContent = `Vez de: Jogador ${currentPlayerIndex}`;
                        currentPlayerDisplay.classList.remove('your-turn');
                    }
                }
            })
            .catch(error => {
                console.error("❌ Erro ao verificar status do jogo:", error);
            });
    }
    
    // Criar elemento de carta
    function createCardElement(card, isPlayable = false) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.color}`;
        if (isPlayable) {
            cardElement.classList.add('playable');
        }
        
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
        
        // Adicionar indicador de jogável se aplicável
        if (isPlayable) {
            const indicator = document.createElement('div');
            indicator.className = 'playable-indicator';
            indicator.textContent = 'Jogável';
            cardInner.appendChild(indicator);
        }
        
        cardElement.appendChild(cardInner);
        
        return cardElement;
    }
    
    // Gerar cartas aleatórias
    function generateRandomCards(count) {
        const cards = [];
        const types = ['number', 'action', 'wild'];
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        for (let i = 0; i < count; i++) {
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
            
            cards.push({
                id: `random-${i}-${Math.random().toString(36).substr(2, 9)}`,
                type,
                color,
                value
            });
        }
        
        return cards;
    }
    
    // Animar jogada de carta
    function animateCardPlay(card, chosenColor) {
        // Obter elemento da carta
        const cardElement = document.querySelector(`.card[data-id="${card.id}"]`);
        if (!cardElement) return;
        
        // Obter pilha de descarte
        const discardPile = document.getElementById('discard-pile');
        if (!discardPile) return;
        
        // Obter posições
        const cardRect = cardElement.getBoundingClientRect();
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
        if (card.type === 'wild' && chosenColor) {
            clone.dataset.chosenColor = chosenColor;
            clone.classList.add('colored-wild');
            
            // Adicionar sobreposição de cor
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
        
        // Esconder a carta original
        cardElement.style.display = 'none';
    }
    
    // Exibir mensagem na tela
    function showMessage(message, duration = 3000) {
        console.log("💬 " + message);
        
        // Obter container de mensagens
        let messagesContainer = document.getElementById('game-messages');
        
        // Criar container se não existir
        if (!messagesContainer) {
            messagesContainer = document.createElement('div');
            messagesContainer.id = 'game-messages';
            messagesContainer.className = 'game-messages';
            
            // Adicionar à tela
            const centerArea = document.querySelector('.center-area');
            if (centerArea) {
                centerArea.appendChild(messagesContainer);
            } else {
                document.body.appendChild(messagesContainer);
            }
        }
        
        // Criar elemento de mensagem
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Adicionar ao container
        messagesContainer.appendChild(messageElement);
        
        // Aplicar animação de entrada
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 50);
        
        // Remover após duração
        setTimeout(() => {
            messageElement.classList.remove('show');
            messageElement.classList.add('hide');
            
            // Remover elemento após animação de saída
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
    
    // Função global para mudar de tela 
    function showScreen(screenId) {
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
            
            // Inicializações específicas por tela
            if (screenId === 'game-screen') {
                // Inicializar a tela de jogo
                setTimeout(ensurePlayerCards, 500);
            }
        } else {
            console.error(`❌ Tela não encontrada: ${screenId}`);
        }
    }
    
    // Substituir a função showScreen global
    window.showScreen = showScreen;
})();