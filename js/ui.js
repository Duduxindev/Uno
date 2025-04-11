/**
 * Interface do Usuário para o Jogo UNO
 * Última atualização: 2025-04-11 17:15:44
 * Desenvolvido por: Duduxindev
 */
class GameUI {
    constructor(game) {
        this.game = game;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.cardAnimationEnabled = true;
        this.highlightPlayableCards = true;
        this.activeScreen = null;
        this.colorSelectorVisible = false;
        this.cardToPlayAfterColorSelection = null;
        this.turnTimer = null;
        this.cardPreviewEnabled = true;
        this.lastKnownCards = {};
        
        // Elementos da interface
        this.elements = {
            // Contêineres principais
            screens: {},
            playerHand: document.getElementById('player-hand'),
            opponentsContainer: document.getElementById('opponents-container'),
            discardPile: document.getElementById('discard-pile'),
            drawPile: document.getElementById('draw-pile'),
            
            // Informações do jogo
            currentPlayer: document.getElementById('current-player'),
            cardsLeft: document.getElementById('cards-left'),
            playerNameDisplay: document.getElementById('player-name-display'),
            cardCount: document.getElementById('card-count'),
            cardsPreview: document.getElementById('cards-preview'),
            
            // Seletor de cores
            colorSelector: document.getElementById('color-selector'),
            colorButtons: document.querySelectorAll('.color-btn'),
            
            // Indicador de status
            gameStatusIndicator: document.getElementById('game-status-indicator'),
            
            // Botões e controles
            unoButton: document.getElementById('uno-btn'),
            menuButton: document.getElementById('menu-btn'),
            gameMessages: document.getElementById('game-messages')
        };
        
        // Inicializar os elementos de tela
        document.querySelectorAll('.screen').forEach(screen => {
            this.elements.screens[screen.id] = screen;
        });
        
        // Status do timer
        this.timerRunning = false;
        this.timerDuration = 30; // segundos
        this.timerRemaining = 0;
        this.timerInterval = null;
        
        // Carregar configurações
        this.loadSettings();
        
        // Inicializar
        this.initEventListeners();
    }
    
    // Carregar configurações
    loadSettings() {
        const storage = new GameStorage();
        const settings = storage.getSettings();
        
        this.soundEnabled = settings.soundEffects;
        this.musicEnabled = settings.backgroundMusic;
        this.cardAnimationEnabled = settings.cardAnimation;
        this.highlightPlayableCards = settings.showPlayable !== undefined ? settings.showPlayable : true;
    }
    
    // Inicializar listeners de eventos
    initEventListeners() {
        // Botão de UNO
        if (this.elements.unoButton) {
            this.elements.unoButton.addEventListener('click', () => {
                this.callUno();
            });
        }
        
        // Botão de menu
        if (this.elements.menuButton) {
            this.elements.menuButton.addEventListener('click', () => {
                this.showGameMenu();
            });
        }
        
        // Pilha de compra
        if (this.elements.drawPile) {
            this.elements.drawPile.addEventListener('click', () => {
                this.drawCard();
            });
        }
        
        // Botões de cor
        if (this.elements.colorButtons) {
            this.elements.colorButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const color = button.dataset.color;
                    this.selectColor(color);
                });
            });
        }
        
        // Listeners para eventos do jogo
        if (this.game && this.game.addEventListener) {
            this.game.addEventListener('cardPlayed', (data) => {
                this.onCardPlayed(data);
            });
            
            this.game.addEventListener('cardDrawn', (data) => {
                this.onCardDrawn(data);
            });
            
            this.game.addEventListener('cardsDrawn', (data) => {
                this.onCardsDrawn(data);
            });
            
            this.game.addEventListener('turnChanged', (data) => {
                this.onTurnChanged(data);
            });
            
            this.game.addEventListener('unoCalled', (data) => {
                this.onUnoCalled(data);
            });
            
            this.game.addEventListener('unoPenalty', (data) => {
                this.onUnoPenalty(data);
            });
            
            this.game.addEventListener('gameEnded', (data) => {
                this.onGameEnded(data);
            });
            
            this.game.addEventListener('playerSkipped', (data) => {
                this.onPlayerSkipped(data);
            });
            
            this.game.addEventListener('directionReversed', (data) => {
                this.onDirectionReversed(data);
            });
            
            this.game.addEventListener('handSwapped', (data) => {
                this.onHandSwapped(data);
            });
            
            this.game.addEventListener('handsRotated', (data) => {
                this.onHandsRotated(data);
            });
            
            this.game.addEventListener('jumpIn', (data) => {
                this.onJumpIn(data);
            });
        }
    }
    
    // Inicializar a interface para um novo jogo
    initializeUI() {
        // Limpar áreas da interface
        if (this.elements.playerHand) {
            this.elements.playerHand.innerHTML = '';
        }
        
        if (this.elements.opponentsContainer) {
            this.elements.opponentsContainer.innerHTML = '';
        }
        
        if (this.elements.discardPile) {
            this.elements.discardPile.innerHTML = '';
        }
        
        if (this.elements.cardsPreview) {
            this.elements.cardsPreview.innerHTML = '';
        }
        
        // Resetar histórico de cartas conhecidas
        this.lastKnownCards = {};
        
        // Criar elementos da pilha de compra
        if (this.elements.drawPile) {
            this.elements.drawPile.innerHTML = '';
            
            // Adicionar algumas cartas viradas para baixo para representar o monte
            for (let i = 0; i < 3; i++) {
                const dummyCard = new UnoCard('number', 'red', '0');
                const cardElement = dummyCard.render(false);
                cardElement.style.position = 'absolute';
                cardElement.style.zIndex = (3 - i).toString();
                cardElement.style.transform = `translateZ(${-i * 2}px) translateX(${i * 2}px) translateY(${i * 2}px)`;
                this.elements.drawPile.appendChild(cardElement);
            }
        }
        
        // Mostrar carta inicial
        if (this.game.lastPlayedCard && this.elements.discardPile) {
            const cardElement = this.game.lastPlayedCard.render(true);
            this.elements.discardPile.appendChild(cardElement);
        }
        
        // Atualizar informações do jogo
        this.updateGameInfo();
        
        // Renderizar mão do jogador
        this.renderPlayerHand();
        
        // Renderizar oponentes
        this.renderOpponents();
        
        // Atualizar destaque do jogador atual
        this.highlightCurrentPlayer();
        
        // Esconder seletor de cores
        this.hideColorSelector();
        
        // Parar timer se estiver rodando
        this.stopTimer();
        
        // Iniciar timer se for o turno do jogador
        if (this.game.currentPlayerIndex === 0) {
            this.startTimer(this.timerDuration);
            this.showStatusMessage('Seu turno!');
        } else {
            this.showStatusMessage(`Vez de ${this.game.players[this.game.currentPlayerIndex].name}`);
        }
        
        // Atualizar estatísticas
        this.updateGameStats();
    }
    
    // Renderizar mão do jogador
    renderPlayerHand() {
        if (!this.elements.playerHand) return;
        
        // Limpar mão atual
        this.elements.playerHand.innerHTML = '';
        
        // Obter jogador humano (índice 0)
        const player = this.game.players[0];
        if (!player) return;
        
        // Definir nome do jogador
        if (this.elements.playerNameDisplay) {
            this.elements.playerNameDisplay.textContent = player.name;
        }
        
        // Definir contagem de cartas
        if (this.elements.cardCount) {
            this.elements.cardCount.textContent = `${player.hand.length} cartas`;
        }
        
        // Verificar se é o turno do jogador
        const isPlayerTurn = this.game.currentPlayerIndex === 0;
        
        // Cartas jogáveis
        const playableCards = isPlayerTurn ? 
            player.getPlayableCards(this.game.lastPlayedCard, this.game.currentColor, this.game.gameMode.options) : 
            [];
        
        // Array para tracking de cartas jogáveis para preview
        const playableCardIds = playableCards.map(card => card.id);
        
        // Renderizar cada carta na mão
        player.hand.forEach(card => {
            const cardElement = card.render(true);
            
            // Verificar se a carta pode ser jogada
            const canPlay = isPlayerTurn && playableCardIds.includes(card.id);
            
            if (canPlay && this.highlightPlayableCards) {
                cardElement.classList.add('playable');
                
                // Adicionar indicador de jogável
                const playIndicator = document.createElement('div');
                playIndicator.className = 'play-indicator';
                playIndicator.textContent = 'Jogável';
                cardElement.appendChild(playIndicator);
            } else if (!isPlayerTurn || !canPlay) {
                cardElement.classList.add('disabled');
            }
            
            // Adicionar evento de clique apenas em cartas jogáveis
            if (canPlay) {
                cardElement.addEventListener('click', () => {
                    this.playCard(card);
                });
            }
            
            this.elements.playerHand.appendChild(cardElement);
        });
        
        // Renderizar preview de cartas jogáveis
        this.renderCardPreview(player, playableCardIds);
    }
    
    // Renderizar preview de cartas jogáveis
    renderCardPreview(player, playableCardIds) {
        if (!this.elements.cardsPreview || !this.cardPreviewEnabled) return;
        
        // Limpar preview atual
        this.elements.cardsPreview.innerHTML = '';
        
        // Mostrar mini-cartas jogáveis
        if (playableCardIds.length > 0) {
            playableCardIds.forEach(cardId => {
                const card = player.hand.find(c => c.id === cardId);
                if (card) {
                    const previewElement = document.createElement('div');
                    previewElement.className = `card-preview ${card.color} playable`;
                    previewElement.style.backgroundColor = this.getCardColor(card.color);
                    
                    // Adicionar evento de clique para selecionar a carta
                    previewElement.addEventListener('click', () => {
                        // Encontrar a carta completa no DOM e simular clique
                        const fullCard = document.querySelector(`.card[data-id="${card.id}"]`);
                        if (fullCard) {
                            fullCard.scrollIntoView({behavior: 'smooth', block: 'center'});
                            fullCard.classList.add('card-highlight');
                            
                            // Remover destaque após 2 segundos
                            setTimeout(() => {
                                fullCard.classList.remove('card-highlight');
                            }, 2000);
                        }
                    });
                    
                    this.elements.cardsPreview.appendChild(previewElement);
                }
            });
        } else if (this.game.currentPlayerIndex === 0) {
            // Adicionar mensagem se não houver cartas jogáveis
            const noCardMsg = document.createElement('div');
            noCardMsg.className = 'no-cards-msg';
            noCardMsg.textContent = 'Compre uma carta';
            this.elements.cardsPreview.appendChild(noCardMsg);
        }
    }
    
    // Obter cor para preview
    getCardColor(color) {
        const colors = {
            'red': '#e81e24',
            'blue': '#0088cc',
            'green': '#00aa55',
            'yellow': '#ffcc00',
            'black': '#333333'
        };
        
        return colors[color] || '#333333';
    }
    
    // Renderizar oponentes
    renderOpponents() {
        if (!this.elements.opponentsContainer) return;
        
        // Limpar oponentes atuais
        this.elements.opponentsContainer.innerHTML = '';
        
        // Renderizar cada oponente (jogadores a partir do índice 1)
        for (let i = 1; i < this.game.players.length; i++) {
            const opponent = this.game.players[i];
            
            // Criar elemento do oponente
            const opponentElement = document.createElement('div');
            opponentElement.className = 'opponent';
            opponentElement.dataset.playerId = opponent.id.toString();
            
            // Destacar jogador atual
            if (this.game.currentPlayerIndex === i) {
                opponentElement.classList.add('active');
            }
            
            // Informações do oponente
            const opponentInfo = document.createElement('div');
            opponentInfo.className = 'opponent-info';
            
            const opponentName = document.createElement('div');
            opponentName.className = 'opponent-name';
            opponentName.textContent = opponent.name;
            opponentInfo.appendChild(opponentName);
            
            // Status do oponente (online/offline, número de cartas)
            const opponentStatus = document.createElement('div');
            opponentStatus.className = 'opponent-status';
            
            // Indicador de status online
            const onlineStatus = document.createElement('div');
            onlineStatus.className = `opponent-online-status ${opponent.isOnline ? '' : 'offline'}`;
            onlineStatus.title = opponent.isOnline ? 'Online' : 'Offline';
            
            // Contador de cartas
            const opponentCardCount = document.createElement('div');
            opponentCardCount.className = 'opponent-card-count';
            opponentCardCount.textContent = `${opponent.hand.length} cartas`;
            
            opponentStatus.appendChild(onlineStatus);
            opponentStatus.appendChild(opponentCardCount);
            
            opponentInfo.appendChild(opponentStatus);
            opponentElement.appendChild(opponentInfo);
            
            // Cartas do oponente (viradas para baixo)
            const opponentHand = document.createElement('div');
            opponentHand.className = 'opponent-hand';
            
            // Mostrar até 7 cartas no máximo
            const visibleCards = Math.min(opponent.hand.length, 7);
            const displayWidth = Math.min(150, opponentElement.offsetWidth - 20);
            const cardSpacing = displayWidth / Math.max(visibleCards, 1);
            
            for (let j = 0; j < visibleCards; j++) {
                const dummyCard = new UnoCard('number', 'red', '0');
                const cardElement = dummyCard.render(false);
                cardElement.style.width = '40px';
                cardElement.style.height = '60px';
                cardElement.style.position = 'relative';
                cardElement.style.marginLeft = j > 0 ? `-${30 - cardSpacing}px` : '0';
                cardElement.style.zIndex = j.toString();
                
                opponentHand.appendChild(cardElement);
            }
            
            opponentElement.appendChild(opponentHand);
            
            // Adicionar badge de UNO se aplicável
            if (opponent.hand.length === 1 && opponent.hasCalledUno) {
                const unoBadge = document.createElement('div');
                unoBadge.className = 'uno-badge';
                unoBadge.textContent = 'UNO';
                opponentElement.appendChild(unoBadge);
            }
            
            // Adicionar evento de clique para acusar não ter chamado UNO
            if (opponent.hand.length === 1 && !opponent.hasCalledUno) {
                opponentElement.addEventListener('click', () => {
                    this.accuseNotCallingUno(opponent.id);
                });
                opponentElement.classList.add('accusable');
                
                // Adicionar tooltip sobre acusar
                const accuseTip = document.createElement('div');
                accuseTip.className = 'accuse-tip';
                accuseTip.textContent = 'Clique para acusar!';
                opponentElement.appendChild(accuseTip);
            }
            
            this.elements.opponentsContainer.appendChild(opponentElement);
            
            // Atualizar a lista de cartas conhecidas
            if (!this.lastKnownCards[opponent.id]) {
                this.lastKnownCards[opponent.id] = opponent.hand.length;
            }
            
            // Animar se o número de cartas mudou
            if (this.lastKnownCards[opponent.id] !== opponent.hand.length) {
                // Destacar mudança de cartas com animação
                const change = opponent.hand.length - this.lastKnownCards[opponent.id];
                
                if (change > 0) {
                    // Jogador comprou cartas
                    this.animateCardChange(opponentElement, `+${change}`, '#FF9800');
                } else if (change < 0) {
                    // Jogador jogou cartas
                    this.animateCardChange(opponentElement, `${change}`, '#4CAF50');
                }
                
                // Atualizar valor conhecido
                this.lastKnownCards[opponent.id] = opponent.hand.length;
            }
        }
    }
    
    // Animar mudança de cartas
    animateCardChange(element, text, color) {
        const animation = document.createElement('div');
        animation.className = 'card-change-animation';
        animation.textContent = text;
        animation.style.position = 'absolute';
        animation.style.top = '50%';
        animation.style.left = '50%';
        animation.style.transform = 'translate(-50%, -50%)';
        animation.style.backgroundColor = color;
        animation.style.color = 'white';
        animation.style.padding = '5px 10px';
        animation.style.borderRadius = '10px';
        animation.style.fontWeight = 'bold';
        animation.style.zIndex = '100';
        animation.style.pointerEvents = 'none';
        animation.style.transition = 'all 0.5s ease-out';
        
        element.appendChild(animation);
        
        // Animar
        setTimeout(() => {
            animation.style.transform = 'translate(-50%, -100px)';
            animation.style.opacity = '0';
        }, 50);
        
        // Remover após a animação
        setTimeout(() => {
            element.removeChild(animation);
        }, 1000);
    }
    
    // Atualizar informações do jogo
    updateGameInfo() {
        // Atualizar jogador atual
        if (this.elements.currentPlayer) {
            const currentPlayer = this.game.getCurrentPlayer();
            this.elements.currentPlayer.textContent = `Vez de: ${currentPlayer.name}`;
        }
        
        // Atualizar número de cartas no monte
        if (this.elements.cardsLeft) {
            this.elements.cardsLeft.textContent = `Cartas no monte: ${this.game.deck.getRemainingCards()}`;
        }
        
        // Atualizar cor atual
        document.documentElement.style.setProperty('--current-color', this.game.currentColor);
    }
    
    // Atualizar estatísticas do jogo
    updateGameStats() {
        const statsContainer = document.getElementById('game-stats-content');
        if (!statsContainer) return;
        
        // Limpar conteúdo atual
        statsContainer.innerHTML = '';
        
        // Adicionar estatísticas gerais
        const generalStats = document.createElement('div');
        generalStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Cor atual:</span>
                <span class="stat-value" style="color: var(--card-${this.game.currentColor})">
                    ${this.game.currentColor.charAt(0).toUpperCase() + this.game.currentColor.slice(1)}
                </span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Direção:</span>
                <span class="stat-value">${this.game.direction === 1 ? 'Horário' : 'Anti-horário'}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Cartas no monte:</span>
                <span class="stat-value">${this.game.deck.getRemainingCards()}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Cartas no descarte:</span>
                <span class="stat-value">${this.game.deck.discardPile.length}</span>
            </div>
        `;
        
        statsContainer.appendChild(generalStats);
        
        // Adicionar estatísticas de cada jogador
        const playersList = document.createElement('div');
        playersList.className = 'players-stats';
        playersList.innerHTML = '<h4 style="margin-top: 10px; margin-bottom: 5px;">Jogadores</h4>';
        
        this.game.players.forEach((player, index) => {
            const playerStat = document.createElement('div');
            playerStat.className = 'stat-item player-stat';
            playerStat.innerHTML = `
                <span class="stat-label">${player.name}${index === 0 ? ' (Você)' : ''}:</span>
                <span class="stat-value">${player.hand.length} cartas</span>
            `;
            
            if (this.game.currentPlayerIndex === index) {
                playerStat.classList.add('current-player-stat');
            }
            
            playersList.appendChild(playerStat);
        });
        
        statsContainer.appendChild(playersList);
    }
    
    // Destacar jogador atual
    highlightCurrentPlayer() {
        // Remover destaque dos oponentes
        const opponentElements = document.querySelectorAll('.opponent');
        opponentElements.forEach(element => {
            element.classList.remove('active');
        });
        
        // Adicionar destaque ao jogador atual
        const currentPlayerIndex = this.game.currentPlayerIndex;
        
        if (currentPlayerIndex === 0) {
            // Destacar área do jogador humano
            document.querySelector('.player-hand-container')?.classList.add('active');
        } else {
            // Destacar oponente correspondente
            document.querySelector('.player-hand-container')?.classList.remove('active');
            document.querySelector(`.opponent[data-player-id="${this.game.players[currentPlayerIndex].id}"]`)?.classList.add('active');
        }
        
        // Atualizar mensagem de status
        if (currentPlayerIndex === 0) {
            this.showStatusMessage('Seu turno!');
            this.startTimer(this.timerDuration);
        } else {
            this.showStatusMessage(`Vez de ${this.game.players[currentPlayerIndex].name}`);
            this.stopTimer();
        }
    }
    
    // Verificar se uma carta pode ser jogada
    canPlayCard(card) {
        // Se houver um stack de cartas para comprar
        if (this.game.drawStack > 0) {
            // Só pode jogar +2 ou +4
            if (card.value !== 'draw2' && card.value !== 'wild-draw-four') {
                return false;
            }
            
            // +2 só pode ser jogado sobre +2
            if (card.value === 'draw2' && this.game.lastPlayedCard.value !== 'draw2') {
                return false;
            }
        }
        
        return this.game.isValidPlay(card);
    }
    
    // Jogar uma carta
    playCard(card) {
        // Verificar se é o turno do jogador
        if (this.game.currentPlayerIndex !== 0) {
            this.showMessage('Não é seu turno!');
            return;
        }
        
        // Verificar se a carta pode ser jogada
        if (!this.canPlayCard(card)) {
            this.showMessage('Jogada inválida!');
            return;
        }
        
        // Se for carta curinga, mostrar seletor de cores
        if (card.type === 'wild') {
            this.showColorSelector(card);
            return;
        }
        
        // Tentar jogar a carta
        const result = this.game.playCard(0, card.id);
        
        if (!result.success) {
            this.showMessage(result.error || 'Erro ao jogar carta!');
            return;
        }
        
        // Reproduzir som de carta jogada
        this.playSound('card-play');
        
        // Atualizar interface
        this.updateAfterCardPlayed(card);
        
        // Parar o timer
        this.stopTimer();
    }
    
    // Comprar uma carta
    drawCard() {
        // Verificar se é o turno do jogador
        if (this.game.currentPlayerIndex !== 0) {
            this.showMessage('Não é seu turno!');
            return;
        }
        
        // Tentar comprar uma carta
        const result = this.game.drawCard(0);
        
        if (!result.success) {
            this.showMessage(result.error || 'Erro ao comprar carta!');
            return;
        }
        
        // Reproduzir som de carta comprada
        this.playSound('card-draw');
        
        // Mostrar animação de compra
        this.animateCardDraw();
        
        // Atualizar interface
        this.renderPlayerHand();
        this.updateGameInfo();
        this.updateGameStats();
        
        // Mostrar mensagem se a carta comprada pode ser jogada
        if (result.canPlay) {
            this.showMessage('Você pode jogar a carta comprada!');
        }
        
        // Se jogou a carta comprada automaticamente, parar o timer
        if (result.cardPlayed) {
            this.stopTimer();
        }
    }
    
    // Animar compra de carta
    animateCardDraw() {
        if (!this.cardAnimationEnabled) return;
        
        // Criar carta animada
        const animCard = document.createElement('div');
        animCard.className = 'card card-back card-animation';
        animCard.style.position = 'absolute';
        animCard.style.top = `${this.elements.drawPile.offsetTop}px`;
        animCard.style.left = `${this.elements.drawPile.offsetLeft}px`;
        animCard.style.zIndex = '100';
        animCard.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        // Adicionar elementos visuais do verso da carta
        const cardPattern = document.createElement('div');
        cardPattern.className = 'card-back-pattern';
        
        const cardBackLogo = document.createElement('div');
        cardBackLogo.className = 'card-back-logo';
        cardBackLogo.textContent = 'UNO';
        
        animCard.appendChild(cardPattern);
        animCard.appendChild(cardBackLogo);
        
        document.body.appendChild(animCard);
        
        // Destino da animação (mão do jogador)
        const handRect = this.elements.playerHand.getBoundingClientRect();
        
                // Atraso antes de iniciar animação
                setTimeout(() => {
                    animCard.style.transform = `translate(${handRect.left - animCard.offsetLeft}px, ${handRect.top - animCard.offsetTop}px) rotate(360deg)`;
                }, 50);
                
                // Remover após animação
                setTimeout(() => {
                    document.body.removeChild(animCard);
                }, 600);
            }
            
            // Chamar UNO
            callUno() {
                const result = this.game.callUno(0);
                
                if (!result.success) {
                    if (result.penalty) {
                        this.showMessage('Penalidade! Você comprou 2 cartas por chamar UNO incorretamente.');
                        this.renderPlayerHand();
                        this.updateGameStats();
                    } else {
                        this.showMessage(result.error || 'Você não pode chamar UNO agora!');
                    }
                    return;
                }
                
                // Reproduzir som de UNO
                this.playSound('uno-call');
                
                // Mostrar efeito visual de UNO
                this.showUnoEffect();
                
                // Atualizar interface
                this.renderPlayerHand();
                this.updateGameStats();
            }
            
            // Acusar outro jogador de não ter chamado UNO
            accuseNotCallingUno(playerId) {
                const result = this.game.accuseNotCallingUno(0, playerId);
                
                if (!result.success) {
                    if (result.penalty) {
                        this.showMessage('Acusação falsa! Você comprou 1 carta como penalidade.');
                        this.renderPlayerHand();
                        this.updateGameStats();
                    } else {
                        this.showMessage(result.error || 'Acusação inválida!');
                    }
                    return;
                }
                
                // Atualizar interface
                this.showMessage(`Penalidade! O jogador comprou 2 cartas por não chamar UNO.`);
                this.renderOpponents();
                this.updateGameStats();
            }
            
            // Mostrar seletor de cores para cartas curinga
            showColorSelector(card) {
                if (!this.elements.colorSelector) return;
                
                this.colorSelectorVisible = true;
                this.cardToPlayAfterColorSelection = card;
                this.elements.colorSelector.classList.remove('hidden');
                
                // Adicionar efeito visual
                this.elements.colorSelector.style.animation = 'pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            }
            
            // Esconder seletor de cores
            hideColorSelector() {
                if (!this.elements.colorSelector) return;
                
                this.colorSelectorVisible = false;
                this.cardToPlayAfterColorSelection = null;
                this.elements.colorSelector.classList.add('hidden');
            }
            
            // Selecionar uma cor para carta curinga
            selectColor(color) {
                if (!this.cardToPlayAfterColorSelection) return;
                
                // Esconder o seletor de cores
                this.hideColorSelector();
                
                // Jogar a carta com a cor selecionada
                const result = this.game.playCard(0, this.cardToPlayAfterColorSelection.id, color);
                
                if (!result.success) {
                    this.showMessage(result.error || 'Erro ao jogar carta!');
                    return;
                }
                
                // Reproduzir som de carta jogada
                this.playSound('card-play');
                
                // Atualizar interface
                this.updateAfterCardPlayed(this.cardToPlayAfterColorSelection, color);
                
                // Parar o timer
                this.stopTimer();
            }
            
            // Atualizar interface após jogar uma carta
            updateAfterCardPlayed(card, chosenColor) {
                // Atualizar pilha de descarte
                if (this.elements.discardPile) {
                    // Adicionar classe para animação
                    const cardElement = card.render(true);
                    cardElement.classList.add('card-played');
                    
                    // Se for curinga, adicionar efeito visual da cor escolhida
                    if (chosenColor) {
                        cardElement.dataset.chosenColor = chosenColor;
                        
                        // Adicionar efeito visual baseado no tipo da carta
                        const effectElement = document.createElement('div');
                        effectElement.className = 'card-effect effect-wild';
                        cardElement.appendChild(effectElement);
                    } else if (card.value === 'draw2' || card.value === 'wild-draw-four') {
                        // Efeito visual para cartas de compra
                        const effectElement = document.createElement('div');
                        effectElement.className = 'card-effect effect-draw';
                        effectElement.textContent = card.value === 'draw2' ? '+2' : '+4';
                        cardElement.appendChild(effectElement);
                    } else if (card.value === 'skip') {
                        // Efeito visual para cartas de pular
                        const effectElement = document.createElement('div');
                        effectElement.className = 'card-effect effect-skip';
                        effectElement.textContent = '⊘';
                        cardElement.appendChild(effectElement);
                    } else if (card.value === 'reverse') {
                        // Efeito visual para cartas de reverter
                        const effectElement = document.createElement('div');
                        effectElement.className = 'card-effect effect-reverse';
                        effectElement.textContent = '↺';
                        cardElement.appendChild(effectElement);
                    }
                    
                    // Limpar e adicionar a nova carta
                    this.elements.discardPile.innerHTML = '';
                    this.elements.discardPile.appendChild(cardElement);
                }
                
                // Atualizar mão do jogador
                this.renderPlayerHand();
                
                // Atualizar informações do jogo
                this.updateGameInfo();
                
                // Atualizar estatísticas
                this.updateGameStats();
                
                // Atualizar destaque do jogador atual
                this.highlightCurrentPlayer();
            }
            
            // Mostrar mensagem de status
            showStatusMessage(message) {
                if (!this.elements.gameStatusIndicator) return;
                
                const statusText = this.elements.gameStatusIndicator.querySelector('.status-text');
                if (statusText) {
                    statusText.textContent = message;
                }
                
                // Mostrar o indicador
                this.elements.gameStatusIndicator.style.display = 'block';
                
                // Se for o turno do jogador, adicionar classe especial
                if (message === 'Seu turno!') {
                    this.elements.gameStatusIndicator.classList.add('your-turn');
                } else {
                    this.elements.gameStatusIndicator.classList.remove('your-turn');
                }
            }
            
            // Iniciar timer
            startTimer(duration) {
                // Parar timer anterior se estiver rodando
                this.stopTimer();
                
                // Se o temporizador está desativado nas configurações, retornar
                if (!this.game.gameMode.options.turnTimer) return;
                
                this.timerRunning = true;
                this.timerDuration = duration;
                this.timerRemaining = duration;
                
                // Atualizar barra de progresso
                const timerProgress = document.querySelector('.timer-progress');
                if (timerProgress) {
                    timerProgress.style.width = '100%';
                    timerProgress.style.transition = `width ${duration}s linear`;
                    
                    // Forçar reflow para reiniciar a animação
                    timerProgress.offsetHeight;
                    
                    // Iniciar a animação
                    timerProgress.style.width = '0%';
                }
                
                // Iniciar intervalo
                this.timerInterval = setInterval(() => {
                    this.timerRemaining--;
                    
                    // Verificar se o tempo acabou
                    if (this.timerRemaining <= 0) {
                        this.handleTimeOut();
                    } else if (this.timerRemaining <= 5) {
                        // Avisar quando estiver acabando o tempo
                        this.playSound('timer-warning');
                    }
                }, 1000);
            }
            
            // Parar timer
            stopTimer() {
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
                
                this.timerRunning = false;
                
                // Pausar a animação da barra de progresso
                const timerProgress = document.querySelector('.timer-progress');
                if (timerProgress) {
                    timerProgress.style.transition = 'none';
                }
            }
            
            // Lidar com timeout do turno
            handleTimeOut() {
                // Parar o timer
                this.stopTimer();
                
                // Mostrar mensagem
                this.showMessage('Tempo esgotado! Comprando carta automaticamente...');
                
                // Comprar carta automaticamente
                this.drawCard();
            }
            
            // Mostrar o menu do jogo
            showGameMenu() {
                // Pausar o timer se estiver rodando
                const timerWasRunning = this.timerRunning;
                if (timerWasRunning) {
                    this.stopTimer();
                }
                
                // Criar menu do jogo
                const menuOverlay = document.createElement('div');
                menuOverlay.className = 'overlay';
                
                const menuContainer = document.createElement('div');
                menuContainer.className = 'game-menu';
                
                const menuTitle = document.createElement('h2');
                menuTitle.className = 'game-menu-title';
                menuTitle.textContent = 'Menu do Jogo';
                
                const menuOptions = document.createElement('div');
                menuOptions.className = 'game-menu-options';
                
                // Botão para continuar o jogo
                const resumeButton = document.createElement('button');
                resumeButton.className = 'game-menu-btn resume-btn';
                resumeButton.textContent = 'Continuar Jogo';
                resumeButton.addEventListener('click', () => {
                    document.body.removeChild(menuOverlay);
                    
                    // Reiniciar o timer se estava rodando
                    if (timerWasRunning && this.game.currentPlayerIndex === 0) {
                        this.startTimer(this.timerRemaining);
                    }
                });
                
                // Botão para ver regras
                const rulesButton = document.createElement('button');
                rulesButton.className = 'game-menu-btn rules-btn';
                rulesButton.textContent = 'Ver Regras';
                rulesButton.addEventListener('click', () => {
                    // Implementar visualização de regras
                    this.showRules();
                });
                
                // Botão para configurações
                const settingsButton = document.createElement('button');
                settingsButton.className = 'game-menu-btn settings-btn';
                settingsButton.textContent = 'Configurações';
                settingsButton.addEventListener('click', () => {
                    // Implementar menu de configurações
                    this.showSettings();
                });
                
                // Botão para sair do jogo
                const quitButton = document.createElement('button');
                quitButton.className = 'game-menu-btn quit-btn';
                quitButton.textContent = 'Sair do Jogo';
                quitButton.addEventListener('click', () => {
                    if (confirm('Tem certeza que deseja sair? O progresso do jogo será perdido.')) {
                        document.body.removeChild(menuOverlay);
                        this.quitGame();
                    }
                });
                
                menuOptions.appendChild(resumeButton);
                menuOptions.appendChild(rulesButton);
                menuOptions.appendChild(settingsButton);
                menuOptions.appendChild(quitButton);
                
                menuContainer.appendChild(menuTitle);
                menuContainer.appendChild(menuOptions);
                menuOverlay.appendChild(menuContainer);
                
                document.body.appendChild(menuOverlay);
            }
            
            // Mostrar regras do jogo
            showRules() {
                const rulesContent = `
                    <h3>Regras Básicas</h3>
                    <p>O objetivo do UNO é ser o primeiro jogador a ficar sem cartas.</p>
                    <p>Você deve jogar uma carta que corresponda à cor, número ou símbolo da carta do topo da pilha.</p>
                    <p>Se não tiver uma carta correspondente, compre uma do monte.</p>
                    
                    <h3>Cartas Especiais</h3>
                    <ul>
                        <li><strong>Pular:</strong> O próximo jogador perde a vez.</li>
                        <li><strong>Inverter:</strong> Inverte a direção do jogo.</li>
                        <li><strong>+2:</strong> O próximo jogador compra 2 cartas e perde a vez.</li>
                        <li><strong>Curinga:</strong> Permite escolher a cor que continuará o jogo.</li>
                        <li><strong>Curinga +4:</strong> O próximo jogador compra 4 cartas, perde a vez e você escolhe a cor.</li>
                    </ul>
                    
                    <h3>Chamando UNO</h3>
                    <p>Quando tiver apenas uma carta, você deve dizer "UNO!" clicando no botão UNO ou digitando "!uno" no chat.</p>
                    <p>Se esquecer de chamar UNO e outro jogador perceber, você deve comprar 2 cartas.</p>
                    
                    <h3>Chat no Jogo</h3>
                    <p>Use o chat para conversar com outros jogadores durante a partida.</p>
                    <p>Digite "!uno" no chat para chamar UNO automaticamente.</p>
                `;
                
                this.showModal('Regras do UNO', rulesContent);
            }
            
            // Mostrar configurações do jogo
            showSettings() {
                const settingsContent = `
                    <div class="settings-container">
                        <div class="setting-item">
                            <label for="sound-setting">Efeitos Sonoros</label>
                            <label class="switch">
                                <input type="checkbox" id="sound-setting" ${this.soundEnabled ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label for="music-setting">Música de Fundo</label>
                            <label class="switch">
                                <input type="checkbox" id="music-setting" ${this.musicEnabled ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label for="animation-setting">Animações de Cartas</label>
                            <label class="switch">
                                <input type="checkbox" id="animation-setting" ${this.cardAnimationEnabled ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="setting-item">
                            <label for="highlight-setting">Destacar Cartas Jogáveis</label>
                            <label class="switch">
                                <input type="checkbox" id="highlight-setting" ${this.highlightPlayableCards ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                `;
                
                const modal = this.showModal('Configurações', settingsContent);
                
                // Adicionar eventos para as configurações
                const soundSetting = modal.querySelector('#sound-setting');
                const musicSetting = modal.querySelector('#music-setting');
                const animationSetting = modal.querySelector('#animation-setting');
                const highlightSetting = modal.querySelector('#highlight-setting');
                
                soundSetting.addEventListener('change', (e) => {
                    this.soundEnabled = e.target.checked;
                    
                    // Salvar configurações
                    const storage = new GameStorage();
                    const settings = storage.getSettings();
                    settings.soundEffects = this.soundEnabled;
                    storage.saveSettings(settings);
                });
                
                musicSetting.addEventListener('change', (e) => {
                    this.musicEnabled = e.target.checked;
                    
                    // Salvar configurações
                    const storage = new GameStorage();
                    const settings = storage.getSettings();
                    settings.backgroundMusic = this.musicEnabled;
                    storage.saveSettings(settings);
                    
                    // Atualizar música de fundo
                    if (this.musicEnabled) {
                        // Iniciar música
                    } else {
                        // Parar música
                    }
                });
                
                animationSetting.addEventListener('change', (e) => {
                    this.cardAnimationEnabled = e.target.checked;
                    
                    // Salvar configurações
                    const storage = new GameStorage();
                    const settings = storage.getSettings();
                    settings.cardAnimation = this.cardAnimationEnabled;
                    storage.saveSettings(settings);
                });
                
                highlightSetting.addEventListener('change', (e) => {
                    this.highlightPlayableCards = e.target.checked;
                    
                    // Salvar configurações
                    const storage = new GameStorage();
                    const settings = storage.getSettings();
                    settings.showPlayable = this.highlightPlayableCards;
                    storage.saveSettings(settings);
                    
                    // Atualizar interface
                    this.renderPlayerHand();
                });
            }
            
            // Mostrar modal genérico
            showModal(title, content) {
                const modalOverlay = document.createElement('div');
                modalOverlay.className = 'overlay';
                
                const modalContainer = document.createElement('div');
                modalContainer.className = 'game-menu';
                
                const modalTitle = document.createElement('h2');
                modalTitle.className = 'game-menu-title';
                modalTitle.textContent = title;
                
                const modalContent = document.createElement('div');
                modalContent.className = 'modal-content';
                modalContent.innerHTML = content;
                
                const closeButton = document.createElement('button');
                closeButton.className = 'game-menu-btn resume-btn';
                closeButton.textContent = 'Fechar';
                closeButton.addEventListener('click', () => {
                    document.body.removeChild(modalOverlay);
                });
                
                modalContainer.appendChild(modalTitle);
                modalContainer.appendChild(modalContent);
                modalContainer.appendChild(closeButton);
                modalOverlay.appendChild(modalContainer);
                
                document.body.appendChild(modalOverlay);
                
                return modalContainer;
            }
            
            // Mostrar efeito de UNO
            showUnoEffect() {
                const unoEffect = document.createElement('div');
                unoEffect.className = 'uno-effect';
                unoEffect.textContent = 'UNO!';
                
                document.body.appendChild(unoEffect);
                
                // Remover o efeito após a animação
                setTimeout(() => {
                    if (document.body.contains(unoEffect)) {
                        document.body.removeChild(unoEffect);
                    }
                }, 2000);
            }
            
            // Mostrar mensagem temporária
            showMessage(message, duration = 3000) {
                if (!this.elements.gameMessages) return;
                
                this.elements.gameMessages.textContent = message;
                this.elements.gameMessages.classList.add('active');
                
                // Remover a mensagem após o tempo definido
                setTimeout(() => {
                    if (this.elements.gameMessages) {
                        this.elements.gameMessages.classList.remove('active');
                    }
                }, duration);
            }
            
            // Reproduzir som
            playSound(soundName) {
                if (!this.soundEnabled) return;
                
                // Implementação básica de sons
                const sounds = {
                    'card-play': 'assets/sounds/card-play.mp3',
                    'card-draw': 'assets/sounds/card-draw.mp3',
                    'uno-call': 'assets/sounds/uno-call.mp3',
                    'game-over': 'assets/sounds/game-over.mp3',
                    'turn-change': 'assets/sounds/turn-change.mp3',
                    'timer-warning': 'assets/sounds/timer-warning.mp3'
                };
                
                const soundFile = sounds[soundName];
                if (!soundFile) return;
                
                // Criar e reproduzir um elemento de áudio
                const audio = new Audio(soundFile);
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Erro ao reproduzir som:', e));
            }
            
            // Sair do jogo
            quitGame() {
                // Exibir tela de menu ou inicial
                window.location.reload(); // Solução simples: recarregar a página
            }
            
            // Handlers para eventos do jogo
            
            // Quando uma carta é jogada
            onCardPlayed(data) {
                // Implementação para atualizar a interface após outro jogador jogar uma carta
                if (data.player.id !== 0) { // Se não for o jogador humano
                    this.renderOpponents();
                    
                    // Atualizar pilha de descarte
                    if (this.elements.discardPile) {
                        const cardElement = data.card.render(true);
                        cardElement.classList.add('card-played');
                        
                        if (data.chosenColor) {
                            cardElement.dataset.chosenColor = data.chosenColor;
                            
                            // Adicionar efeito visual
                            const effectElement = document.createElement('div');
                            effectElement.className = 'card-effect effect-wild';
                            cardElement.appendChild(effectElement);
                        }
                        
                        this.elements.discardPile.innerHTML = '';
                        this.elements.discardPile.appendChild(cardElement);
                    }
                    
                    // Reproduzir som de carta jogada
                    this.playSound('card-play');
                }
                
                // Atualizar informações do jogo
                this.updateGameInfo();
                
                // Atualizar estatísticas
                this.updateGameStats();
                
                // Atualizar destaque do jogador atual
                this.highlightCurrentPlayer();
            }
            
            // Quando uma carta é comprada
            onCardDrawn(data) {
                // Implementação para atualizar a interface após outro jogador comprar uma carta
                if (data.player.id !== 0) { // Se não for o jogador humano
                    this.renderOpponents();
                    
                    // Reproduzir som de carta comprada
                    this.playSound('card-draw');
                }
                
                // Atualizar informações do jogo
                this.updateGameInfo();
                this.updateGameStats();
            }
            
            // Quando várias cartas são compradas
            onCardsDrawn(data) {
                // Implementação para atualizar a interface após outro jogador comprar múltiplas cartas
                if (data.player.id !== 0) { // Se não for o jogador humano
                    this.renderOpponents();
                    
                    // Reproduzir som de carta comprada
                    this.playSound('card-draw');
                    
                    // Mostrar mensagem
                    this.showMessage(`${data.player.name} comprou ${data.count} cartas.`);
                }
                
                // Atualizar informações do jogo
                this.updateGameInfo();
                this.updateGameStats();
            }
            
            // Quando o turno muda
            onTurnChanged(data) {
                // Atualizar informações do jogo
                this.updateGameInfo();
                
                // Atualizar estatísticas
                this.updateGameStats();
                
                // Atualizar destaque do jogador atual
                this.highlightCurrentPlayer();
                
                // Se for o turno do jogador humano, atualizar as cartas jogáveis
                if (data.player.id === 0) {
                    this.renderPlayerHand();
                    
                    // Reproduzir som de troca de turno
                    this.playSound('turn-change');
                    
                    // Mostrar mensagem
                    this.showMessage('Sua vez de jogar!');
                }
            }
            
            // Quando alguém chama UNO
            onUnoCalled(data) {
                // Mostrar mensagem
                this.showMessage(`${data.player.name} chamou UNO!`);
                
                // Atualizar interface
                if (data.player.id === 0) {
                    this.renderPlayerHand();
                } else {
                    this.renderOpponents();
                }
                
                // Reproduzir som de UNO (se não for automático)
                if (!data.automatic) {
                    this.playSound('uno-call');
                    
                    // Mostrar efeito visual
                    this.showUnoEffect();
                }
                
                // Atualizar estatísticas
                this.updateGameStats();
            }
            
            // Quando alguém recebe penalidade por UNO
            onUnoPenalty(data) {
                // Mostrar mensagem
                let message = '';
                
                switch (data.reason) {
                    case 'not-called':
                        message = `${data.player.name} não chamou UNO e comprou 2 cartas!`;
                        break;
                    case 'false-accusation':
                        message = `${data.player.name} fez uma acusação falsa e comprou 1 carta!`;
                        break;
                    case 'not-called-after-play':
                        message = `${data.player.name} esqueceu de chamar UNO e comprou 2 cartas!`;
                        break;
                    default:
                        message = `${data.player.name} recebeu uma penalidade!`;
                }
                
                this.showMessage(message);
                
                // Atualizar interface
                if (data.player.id === 0) {
                    this.renderPlayerHand();
                } else {
                    this.renderOpponents();
                }
                
                // Atualizar estatísticas
                this.updateGameStats();
            }
            
            // Quando um jogador é pulado
            onPlayerSkipped(data) {
                this.showMessage(`${data.player.name} foi pulado!`);
                
                // Reproduzir som
                this.playSound('turn-change');
                
                // Atualizar interface
                this.highlightCurrentPlayer();
                this.updateGameStats();
            }
            
            // Quando a direção do jogo é invertida
            onDirectionReversed(data) {
                this.showMessage('Direção do jogo invertida!');
                
                // Reproduzir som
                this.playSound('turn-change');
                
                // Atualizar estatísticas
                this.updateGameStats();
            }
            
            // Quando as mãos são trocadas (regra do 7)
            onHandSwapped(data) {
                this.showMessage(`${data.player1.name} trocou suas cartas com ${data.player2.name}!`);
                
                // Atualizar interface
                this.renderPlayerHand();
                this.renderOpponents();
                this.updateGameStats();
            }
            
            // Quando as mãos são rotacionadas (regra do 0)
            onHandsRotated(data) {
                this.showMessage('Todas as mãos foram rotacionadas!');
                
                // Atualizar interface
                this.renderPlayerHand();
                this.renderOpponents();
                this.updateGameStats();
            }
            
            // Quando ocorre um Jump-In
            onJumpIn(data) {
                this.showMessage(`${data.player.name} interrompeu o jogo com uma carta idêntica (Jump-In)!`);
                
                // Reproduzir som
                this.playSound('card-play');
                
                // Atualizar interface
                this.renderPlayerHand();
                this.renderOpponents();
                this.updateGameInfo();
                this.updateGameStats();
                this.highlightCurrentPlayer();
            }
            
            // Quando o jogo termina
            onGameEnded(data) {
                // Parar o timer se estiver rodando
                this.stopTimer();
                
                // Mostrar mensagem
                this.showMessage(`${data.winner.name} venceu o jogo!`);
                
                // Reproduzir som de fim de jogo
                this.playSound('game-over');
                
                // Mostrar tela de fim de jogo
                this.showGameOverScreen(data);
            }
            
            // Mostrar tela de fim de jogo
            showGameOverScreen(data) {
                const modalContent = `
                    <div class="game-over">
                        <h3 class="winner-display">${data.winner.name} venceu o jogo!</h3>
                        
                        <div class="stats-container">
                            ${this.game.players.map(player => `
                                <div class="stat-card ${player.id === data.winner.id ? 'winner-card' : ''}">
                                    <div class="stat-player">${player.name} ${player.id === data.winner.id ? '(Vencedor)' : ''}</div>
                                    <div class="stat-item">
                                        <span>Cartas jogadas:</span>
                                        <span>${player.stats.cardsPlayed}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span>Cartas especiais:</span>
                                        <span>${player.stats.specialCardsPlayed}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span>Cartas compradas:</span>
                                        <span>${player.stats.cardsDrawn}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span>UNOs chamados:</span>
                                        <span>${player.stats.uno}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span>Pontuação:</span>
                                        <span>${data.scores[player.id]}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="game-over-buttons">
                            <button id="new-game-btn" class="game-menu-btn resume-btn">Novo Jogo</button>
                            <button id="main-menu-btn" class="game-menu-btn quit-btn">Menu Principal</button>
                        </div>
                    </div>
                `;
                
                const modal = this.showModal('Fim de Jogo', modalContent);
                
                // Adicionar eventos aos botões
                const newGameBtn = modal.querySelector('#new-game-btn');
                const mainMenuBtn = modal.querySelector('#main-menu-btn');
                
                if (newGameBtn) {
                    newGameBtn.addEventListener('click', () => {
                        // Iniciar um novo jogo com os mesmos jogadores
                        this.game.startGame();
                        this.initializeUI();
                        document.querySelector('.overlay').remove();
                    });
                }
                
                if (mainMenuBtn) {
                    mainMenuBtn.addEventListener('click', () => {
                        // Voltar para o menu principal
                        this.quitGame();
                    });
                }
                
                // Salvar estatísticas
                const storage = new GameStorage();
                const isWinner = data.winner.id === 0; // Jogador humano venceu
                
                storage.saveStats({
                    won: isWinner,
                    mode: this.game.gameMode.name,
                    playerCount: this.game.players.length,
                    cardsPlayed: this.game.players[0].stats.cardsPlayed,
                    specialCardsPlayed: this.game.players[0].stats.specialCardsPlayed,
                    unosCalled: this.game.players[0].stats.uno
                });
            }
        }