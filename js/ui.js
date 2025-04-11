/**
 * Interface do Usuário para o Jogo UNO
 * Última atualização: 2025-04-11 16:40:23
 * Desenvolvido por: Duduxindev
 */
class GameUI {
    constructor(game) {
        this.game = game;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.cardAnimationEnabled = true;
        this.activeScreen = null;
        this.colorSelectorVisible = false;
        this.cardToPlayAfterColorSelection = null;
        this.turnTimer = null;
        
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
            
            // Seletor de cores
            colorSelector: document.getElementById('color-selector'),
            colorButtons: document.querySelectorAll('.color-btn'),
            
            // Botões e controles
            unoButton: document.getElementById('uno-btn'),
            menuButton: document.getElementById('menu-btn'),
            gameMessages: document.getElementById('game-messages')
        };
        
        // Inicializar os elementos de tela
        document.querySelectorAll('.screen').forEach(screen => {
            this.elements.screens[screen.id] = screen;
        });
        
        // Inicializar
        this.initEventListeners();
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
        if (this.game.addEventListener) {
            this.game.addEventListener('cardPlayed', (data) => {
                this.onCardPlayed(data);
            });
            
            this.game.addEventListener('cardDrawn', (data) => {
                this.onCardDrawn(data);
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
        
        // Renderizar cada carta na mão
        player.hand.forEach(card => {
            const cardElement = card.render(true);
            
            // Verificar se a carta pode ser jogada
            const canPlay = isPlayerTurn && this.canPlayCard(card);
            
            if (!canPlay) {
                cardElement.classList.add('disabled');
            } else {
                // Adicionar evento de clique apenas em cartas jogáveis
                cardElement.addEventListener('click', () => {
                    this.playCard(card);
                });
            }
            
            this.elements.playerHand.appendChild(cardElement);
        });
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
            
            const opponentCardCount = document.createElement('div');
            opponentCardCount.className = 'opponent-card-count';
            opponentCardCount.textContent = `${opponent.hand.length} cartas`;
            opponentInfo.appendChild(opponentCardCount);
            
            opponentElement.appendChild(opponentInfo);
            
            // Cartas do oponente (viradas para baixo)
            const opponentHand = document.createElement('div');
            opponentHand.className = 'opponent-hand';
            
            // Mostrar até 7 cartas no máximo
            const visibleCards = Math.min(opponent.hand.length, 7);
            
            for (let j = 0; j < visibleCards; j++) {
                const dummyCard = new UnoCard('number', 'red', '0');
                const cardElement = dummyCard.render(false);
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
            }
            
            this.elements.opponentsContainer.appendChild(opponentElement);
        }
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
            document.querySelector(`.opponent[data-player-id="${currentPlayerIndex}"]`)?.classList.add('active');
        }
    }
    
    // Verificar se uma carta pode ser jogada
    canPlayCard(card) {
        // Se houver um stack de cartas para comprar
        if (this.game.drawStack > 0) {
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
                        
                        // Atualizar interface
                        this.renderPlayerHand();
                        this.updateGameInfo();
                        
                        // Mostrar mensagem se a carta comprada pode ser jogada
                        if (result.canPlay) {
                            this.showMessage('Você pode jogar a carta comprada!');
                        }
                    }
                    
                    // Chamar UNO
                    callUno() {
                        const result = this.game.callUno(0);
                        
                        if (!result.success) {
                            if (result.penalty) {
                                this.showMessage('Penalidade! Você comprou 2 cartas por chamar UNO incorretamente.');
                                this.renderPlayerHand();
                            } else {
                                this.showMessage(result.error || 'Você não pode chamar UNO agora!');
                            }
                            return;
                        }
                        
                        // Reproduzir som de UNO
                        this.playSound('uno-call');
                        
                        // Mostrar efeito visual de UNO
                        this.showUnoEffect();
                    }
                    
                    // Acusar outro jogador de não ter chamado UNO
                    accuseNotCallingUno(playerId) {
                        const result = this.game.accuseNotCallingUno(0, playerId);
                        
                        if (!result.success) {
                            if (result.penalty) {
                                this.showMessage('Acusação falsa! Você comprou 1 carta como penalidade.');
                                this.renderPlayerHand();
                            } else {
                                this.showMessage(result.error || 'Acusação inválida!');
                            }
                            return;
                        }
                        
                        // Atualizar interface
                        this.showMessage(`Penalidade! O jogador comprou 2 cartas por não chamar UNO.`);
                        this.renderOpponents();
                    }
                    
                    // Mostrar seletor de cores para cartas curinga
                    showColorSelector(card) {
                        if (!this.elements.colorSelector) return;
                        
                        this.colorSelectorVisible = true;
                        this.cardToPlayAfterColorSelection = card;
                        this.elements.colorSelector.classList.remove('hidden');
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
                        
                        // Jogar a carta com a cor selecionada
                        const result = this.game.playCard(0, this.cardToPlayAfterColorSelection.id, color);
                        
                        // Esconder o seletor de cores
                        this.hideColorSelector();
                        
                        if (!result.success) {
                            this.showMessage(result.error || 'Erro ao jogar carta!');
                            return;
                        }
                        
                        // Reproduzir som de carta jogada
                        this.playSound('card-play');
                        
                        // Atualizar interface
                        this.updateAfterCardPlayed(this.cardToPlayAfterColorSelection, color);
                    }
                    
                    // Atualizar interface após jogar uma carta
                    updateAfterCardPlayed(card, chosenColor) {
                        // Atualizar pilha de descarte
                        if (this.elements.discardPile) {
                            // Adicionar classe para animação
                            const cardElement = card.render(true);
                            cardElement.classList.add('card-played');
                            
                            // Se for curinga, adicionar a cor escolhida
                            if (chosenColor) {
                                cardElement.dataset.chosenColor = chosenColor;
                            }
                            
                            // Limpar e adicionar a nova carta
                            this.elements.discardPile.innerHTML = '';
                            this.elements.discardPile.appendChild(cardElement);
                        }
                        
                        // Atualizar mão do jogador
                        this.renderPlayerHand();
                        
                        // Atualizar informações do jogo
                        this.updateGameInfo();
                        
                        // Atualizar destaque do jogador atual
                        this.highlightCurrentPlayer();
                    }
                    
                    // Mostrar o menu do jogo
                    showGameMenu() {
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
                            <p>Quando tiver apenas uma carta, você deve dizer "UNO!" clicando no botão UNO.</p>
                            <p>Se esquecer de chamar UNO e outro jogador perceber, você deve comprar 2 cartas.</p>
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
                            </div>
                        `;
                        
                        const modal = this.showModal('Configurações', settingsContent);
                        
                        // Adicionar eventos para as configurações
                        const soundSetting = modal.querySelector('#sound-setting');
                        const musicSetting = modal.querySelector('#music-setting');
                        const animationSetting = modal.querySelector('#animation-setting');
                        
                        soundSetting.addEventListener('change', (e) => {
                            this.soundEnabled = e.target.checked;
                        });
                        
                        musicSetting.addEventListener('change', (e) => {
                            this.musicEnabled = e.target.checked;
                        });
                        
                        animationSetting.addEventListener('change', (e) => {
                            this.cardAnimationEnabled = e.target.checked;
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
                            document.body.removeChild(unoEffect);
                        }, 2000);
                    }
                    
                    // Mostrar mensagem temporária
                    showMessage(message, duration = 3000) {
                        if (!this.elements.gameMessages) return;
                        
                        this.elements.gameMessages.textContent = message;
                        this.elements.gameMessages.classList.add('active');
                        
                        // Remover a mensagem após o tempo definido
                        setTimeout(() => {
                            this.elements.gameMessages.classList.remove('active');
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
                            'turn-change': 'assets/sounds/turn-change.mp3'
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
                                }
                                
                                this.elements.discardPile.innerHTML = '';
                                this.elements.discardPile.appendChild(cardElement);
                            }
                            
                            // Reproduzir som de carta jogada
                            this.playSound('card-play');
                        }
                        
                        // Atualizar informações do jogo
                        this.updateGameInfo();
                        
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
                    }
                    
                    // Quando o turno muda
                    onTurnChanged(data) {
                        // Atualizar informações do jogo
                        this.updateGameInfo();
                        
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
                        }
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
                    }
                    
                    // Quando o jogo termina
                    onGameEnded(data) {
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
                                        <div class="stat-card">
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
                                document.body.querySelector('.overlay').remove();
                            });
                        }
                        
                        if (mainMenuBtn) {
                            mainMenuBtn.addEventListener('click', () => {
                                // Voltar para o menu principal
                                this.quitGame();
                            });
                        }
                    }
                }