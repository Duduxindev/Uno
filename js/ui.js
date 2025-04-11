/**
 * Interface do Usuário
 */
class GameUI {
    constructor(game) {
        this.game = game;
        this.storage = new GameStorage();
        this.screens = {
            start: document.getElementById('start-screen'),
            createGame: document.getElementById('create-game-screen'),
            joinGame: document.getElementById('join-game-screen'),
            waitingRoom: document.getElementById('waiting-room-screen'),
            game: document.getElementById('game-screen'),
            rules: document.getElementById('rules-screen'),
            options: document.getElementById('options-screen'),
            gameOver: document.getElementById('game-over-screen')
        };
        
        this.elements = {
            // Elementos do jogo
            playerHand: document.getElementById('player-hand'),
            discardPile: document.getElementById('discard-pile'),
            drawPile: document.getElementById('draw-pile'),
            opponentsContainer: document.getElementById('opponents-container'),
            currentPlayer: document.getElementById('current-player'),
            cardsLeft: document.getElementById('cards-left'),
            playerNameDisplay: document.getElementById('player-name-display'),
            cardCount: document.getElementById('card-count'),
            colorSelector: document.getElementById('color-selector'),
            gameMessages: document.getElementById('game-messages'),
            unoBtn: document.getElementById('uno-btn'),
            
            // Elementos da sala de espera
            playersList: document.getElementById('players-list'),
            roomCodeDisplay: document.getElementById('room-code-display'),
            roomModeDisplay: document.getElementById('room-mode-display'),
            
            // Elementos de estatísticas
            winnerName: document.getElementById('winner-name'),
            gameStatsContainer: document.getElementById('game-stats-container')
        };
        
        this.currentScreen = null;
        this.currentPlayerId = null;
        this.roomCode = null;
        
        this.applySettings();
        this.setupEventListeners();
    }
    
    applySettings() {
        const settings = this.storage.getSettings();
        
        // Aplica modo escuro se configurado
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Atualiza as opções na tela de configurações
        document.getElementById('sound-effects').checked = settings.soundEffects;
        document.getElementById('background-music').checked = settings.backgroundMusic;
        document.getElementById('card-animation').checked = settings.cardAnimation;
        document.getElementById('dark-mode').checked = settings.darkMode;
        document.getElementById('auto-uno').checked = settings.autoUno;
        document.getElementById('turn-timer').checked = settings.turnTimer;
    }
    
    setupEventListeners() {
        // Botões do menu principal
        document.getElementById('create-game-btn').addEventListener('click', () => this.showScreen('createGame'));
        document.getElementById('join-game-btn').addEventListener('click', () => this.showScreen('joinGame'));
        document.getElementById('options-btn').addEventListener('click', () => this.showScreen('options'));
        document.getElementById('rules-btn').addEventListener('click', () => this.showScreen('rules'));
        
        // Botões da tela de criar jogo
        document.getElementById('create-room-btn').addEventListener('click', () => this.createGame());
        document.getElementById('back-from-create').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('game-mode').addEventListener('change', (e) => {
            const customRulesDiv = document.getElementById('custom-rules');
            if (e.target.value === 'custom') {
                customRulesDiv.classList.remove('hidden');
            } else {
                customRulesDiv.classList.add('hidden');
            }
        });
        
        // Botões da tela de entrar no jogo
        document.getElementById('join-room-btn').addEventListener('click', () => this.joinGame());
        document.getElementById('back-from-join').addEventListener('click', () => this.showScreen('start'));
        
        // Botões da sala de espera
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('leave-room-btn').addEventListener('click', () => this.leaveRoom());
        
        // Botões do jogo
        document.getElementById('uno-btn').addEventListener('click', () => this.callUno());
        document.getElementById('menu-btn').addEventListener('click', () => this.openGameMenu());
        document.getElementById('draw-pile').addEventListener('click', () => this.drawCard());
        
        // Botões da tela de fim de jogo
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('return-main-btn').addEventListener('click', () => this.returnToMainMenu());
        
        // Botões da tela de regras e opções
        document.getElementById('back-from-rules').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('back-from-options').addEventListener('click', () => {
            this.saveSettings();
            this.showScreen('start');
        });
        
        // Opções de cores para cartas especiais
        const colorButtons = document.querySelectorAll('.color-btn');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                this.selectColor(color);
            });
        });
        
        // Switch toggles para opções
        const toggles = document.querySelectorAll('.switch input');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.updateSettings();
            });
        });
        
        // Carregar nome do jogador se salvo
        const savedName = this.storage.getPlayerName();
        if (savedName) {
            document.getElementById('player-name').value = savedName;
            document.getElementById('join-player-name').value = savedName;
        }
    }
    
    updateSettings() {
        const settings = {
            soundEffects: document.getElementById('sound-effects').checked,
            backgroundMusic: document.getElementById('background-music').checked,
            cardAnimation: document.getElementById('card-animation').checked,
            darkMode: document.getElementById('dark-mode').checked,
            autoUno: document.getElementById('auto-uno').checked,
            turnTimer: document.getElementById('turn-timer').checked
        };
        
        // Aplica modo escuro imediatamente
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        this.storage.updateSettings(settings);
    }
    
    saveSettings() {
        this.updateSettings();
    }
    
    showScreen(screenName) {
        // Esconde todas as telas
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostra a tela selecionada
        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;
    }
    
    showMessage(message, duration = 3000) {
        const messagesElement = this.elements.gameMessages;
        messagesElement.textContent = message;
        messagesElement.classList.add('active');
        
        setTimeout(() => {
            messagesElement.classList.remove('active');
        }, duration);
    }
    
    createGame() {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Por favor, insira seu nome');
            return;
        }
        
        const gameMode = document.getElementById('game-mode').value;
        const playerCount = parseInt(document.getElementById('player-count').value);
        
        // Salva nome do jogador
        this.storage.setPlayerName(playerName);
        
        // Configura regras personalizadas se for modo personalizado
        let customRules = {};
        if (gameMode === 'custom') {
            customRules = {
                stacking: document.getElementById('stacking').checked,
                jumpIn: document.getElementById('jump-in').checked,
                forcePlay: document.getElementById('force-play').checked,
                sevenZero: document.getElementById('seven-trade').checked && document.getElementById('zero-rotate').checked
            };
        }
        
        // Gera ID do jogador
        this.currentPlayerId = Math.random().toString(36).substring(2, 10);
        
        // Cria a sala
        const result = this.game.roomManager.createRoom(
            this.currentPlayerId,
            playerName,
            gameMode,
            playerCount
        );
        
        if (result.success) {
            this.roomCode = result.roomCode;
            this.updateWaitingRoom();
            this.showScreen('waitingRoom');
            
            // Salva código da sala
            this.storage.setLastRoom(this.roomCode);
        } else {
            alert(`Erro ao criar sala: ${result.error}`);
        }
    }
    
    joinGame() {
        const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
        const playerName = document.getElementById('join-player-name').value.trim();
        
        if (!roomCode) {
            alert('Por favor, insira o código da sala');
            return;
        }
        
        if (!playerName) {
            alert('Por favor, insira seu nome');
            return;
        }
        
        // Salva nome do jogador
        this.storage.setPlayerName(playerName);
        
        // Gera ID do jogador
        this.currentPlayerId = Math.random().toString(36).substring(2, 10);
        
        // Entra na sala
        const result = this.game.roomManager.joinRoom(
            roomCode,
            this.currentPlayerId,
            playerName
        );
        
        if (result.success) {
            this.roomCode = roomCode;
            this.updateWaitingRoom();
            this.showScreen('waitingRoom');
            
            // Salva código da sala
            this.storage.setLastRoom(this.roomCode);
        } else {
            alert(`Erro ao entrar na sala: ${result.error}`);
        }
    }
    
    updateWaitingRoom() {
        const roomState = this.game.roomManager.getRoomState(this.roomCode);
        
        if (!roomState) {
            alert('Erro: Sala não encontrada');
            this.showScreen('start');
            return;
        }
        
        // Atualiza informações da sala
        this.elements.roomCodeDisplay.textContent = roomState.code;
        this.elements.roomModeDisplay.textContent = this.getModeName(roomState.gameMode);
        
        // Atualiza lista de jogadores
        this.elements.playersList.innerHTML = '';
        roomState.players.forEach(player => {
            const playerItem = document.createElement('li');
            playerItem.className = 'player-item';
            
            const playerAvatar = document.createElement('div');
            playerAvatar.className = 'player-avatar';
            playerAvatar.textContent = player.name.charAt(0).toUpperCase();
            
            const playerName = document.createElement('div');
            playerName.className = 'player-name';
            playerName.textContent = player.name;
            
            playerItem.appendChild(playerAvatar);
            playerItem.appendChild(playerName);
            
            if (player.id === roomState.hostId) {
                const hostBadge = document.createElement('span');
                hostBadge.className = 'host-badge';
                hostBadge.textContent = 'Anfitrião';
                playerItem.appendChild(hostBadge);
            }
            
            this.elements.playersList.appendChild(playerItem);
        });
        
        // Mostra ou esconde botão de iniciar jogo
        const startGameBtn = document.getElementById('start-game-btn');
        if (this.currentPlayerId === roomState.hostId) {
            startGameBtn.style.display = 'block';
            startGameBtn.disabled = roomState.players.length < 2;
        } else {
            startGameBtn.style.display = 'none';
        }
    }
    
    getModeName(mode) {
        const modeNames = {
            'normal': 'Normal',
            'wild': 'Wild',
            'no-mercy': 'No Mercy',
            'progressive': 'Progressivo',
            'seven-zero': 'Sete-Zero',
            'custom': 'Personalizado'
        };
        
        return modeNames[mode] || mode;
    }
    
    startGame() {
        const result = this.game.roomManager.startGame(this.roomCode, this.currentPlayerId);
        
        if (result.success) {
            this.setupGameListeners();
            this.updateGameUI();
            this.showScreen('game');
        } else {
            alert(`Erro ao iniciar o jogo: ${result.error}`);
        }
    }
    
    leaveRoom() {
        this.game.roomManager.leaveRoom(this.roomCode, this.currentPlayerId);
        this.storage.clearLastRoom();
        this.showScreen('start');
    }
    
    setupGameListeners() {
        const room = this.game.roomManager.rooms[this.roomCode];
        if (!room || !room.game) return;
        
        const game = room.game;
        
        // Ouvinte para quando uma carta é jogada
        game.on('cardPlayed', (data) => {
            this.updateGameUI();
            
            // Exibe mensagem sobre a jogada
            if (data.playerId === this.currentPlayerId) {
                this.showMessage('Você jogou uma carta!');
            } else {
                const playerName = room.players.find(p => p.id === data.playerId)?.name;
                this.showMessage(`${playerName} jogou uma carta!`);
            }
            
            // Efeitos visuais específicos
            if (data.effect.reversed) {
                this.showMessage('Direção do jogo invertida!');
            } else if (data.effect.colorChanged) {
                this.showMessage(`Cor mudada para ${this.getColorName(data.effect.colorChanged)}`);
            } else if (data.effect.skipped) {
                const skippedName = room.players.find(p => p.id === data.effect.skipped)?.name;
                this.showMessage(`${skippedName} foi pulado!`);
            } else if (data.effect.playerDrawn) {
                const drawnName = room.players.find(p => p.id === data.effect.playerDrawn)?.name;
                this.showMessage(`${drawnName} comprou ${data.effect.count} cartas!`);
            }
        });
        
        // Ouvinte para quando cartas são compradas
        game.on('cardDrawn', (data) => {
            this.updateGameUI();
            
            if (data.playerId === this.currentPlayerId) {
                this.showMessage('Você comprou uma carta');
            } else {
                const playerName = room.players.find(p => p.id === data.playerId)?.name;
                this.showMessage(`${playerName} comprou uma carta`);
            }
        });
        
        // Ouvinte para quando múltiplas cartas são compradas
        game.on('cardsDrawn', (data) => {
            this.updateGameUI();
            
            if (data.playerId === this.currentPlayerId) {
                this.showMessage(`Você comprou ${data.count} cartas`);
            } else {
                const playerName = room.players.find(p => p.id === data.playerId)?.name;
                this.showMessage(`${playerName} comprou ${data.count} cartas`);
            }
        });
        
        // Ouvinte para quando um jogador chama UNO
        game.on('unoCalled', (data) => {
            const playerName = room.players.find(p => p.id === data.playerId)?.name;
            this.showMessage(`${playerName} gritou UNO!`, 2000);
        });
        
        // Ouvinte para quando um jogador recebe penalidade por não chamar UNO
        game.on('unoPenalty', (data) => {
            const playerName = room.players.find(p => p.id === data.playerId)?.name;
            
            if (data.reason === 'não-chamou-uno') {
                const callerName = room.players.find(p => p.id === data.calledBy)?.name;
                this.showMessage(`${callerName} flagrou ${playerName} sem chamar UNO! +2 cartas`, 3000);
            } else if (data.reason === 'denúncia-errada') {
                this.showMessage(`${playerName} fez uma denúncia errada! +2 cartas`, 3000);
            } else if (data.reason === 'chamada-antecipada') {
                this.showMessage(`${playerName} chamou UNO cedo demais! +2 cartas`, 3000);
            } else {
                this.showMessage(`${playerName} não chamou UNO! +2 cartas`, 3000);
            }
            
            this.updateGameUI();
        });
        
        // Ouvinte para quando mãos são trocadas (regra do sete)
        game.on('handsSwapped', (data) => {
            const player1Name = room.players.find(p => p.id === data.player1)?.name;
            const player2Name = room.players.find(p => p.id === data.player2)?.name;
            
            this.showMessage(`${player1Name} trocou as cartas com ${player2Name}!`, 3000);
            this.updateGameUI();
        });
        
        // Ouvinte para quando todas as mãos são rotacionadas (regra do zero)
        game.on('handsRotated', () => {
            this.showMessage('Todas as cartas foram passadas!', 3000);
            this.updateGameUI();
        });
        
        // Ouvinte para quando o jogador atual muda
        game.on('playerChanged', () => {
            this.updateGameUI();
        });
        
        // Ouvinte para quando a direção do jogo muda
        game.on('directionChanged', () => {
            this.updateGameUI();
        });
        
        // Ouvinte para quando o jogo termina
        game.on('gameOver', (data) => {
            const winnerName = room.players.find(p => p.id === data.winner)?.name;
            document.getElementById('winner-name').textContent = winnerName;
            
            // Preenche estatísticas
            this.updateGameOverStats(data);
            
            setTimeout(() => {
                this.showScreen('gameOver');
            }, 1500);
            
            // Atualiza estatísticas locais
            const playerStats = data.players.find(p => p.id === this.currentPlayerId);
            if (playerStats) {
                this.storage.updateStats({
                    won: data.winner === this.currentPlayerId,
                    mode: room.gameMode,
                    playerCount: room.players.length,
                    cardsPlayed: playerStats.stats.cardsPlayed,
                    specialCardsPlayed: playerStats.stats.specialCardsPlayed,
                    unosCalled: playerStats.stats.uno
                });
            }
        });
        
        // Ouvinte para quando o jogador precisa escolher uma cor
        game.on('colorSelectRequired', (data) => {
            if (data.playerId === this.currentPlayerId) {
                this.elements.colorSelector.classList.remove('hidden');
            }
        });
        
        // Ouvinte para quando o jogador precisa escolher outro jogador
        game.on('playerChoiceRequired', (data) => {
            if (data.playerId === this.currentPlayerId) {
                this.showPlayerChoiceDialog();
            }
        });
    }
    
    updateGameUI() {
        const gameState = this.game.roomManager.getGameState(this.roomCode, this.currentPlayerId);
        if (!gameState) return;
        
        // Atualiza mão do jogador
        this.renderPlayerHand(gameState.hand, gameState.playableCards);
        
        // Atualiza contagem de cartas
        this.elements.cardCount.textContent = `${gameState.hand.length} cartas`;
        
        // Atualiza pilha de descarte
        this.renderDiscardPile(gameState.topCard);
        
        // Atualiza contagem de cartas no monte
        this.elements.cardsLeft.textContent = `Cartas no monte: ${gameState.drawPileCount}`;
        
        // Atualiza nome e info do jogador atual
        const currentPlayerName = gameState.players.find(p => p.id === gameState.currentPlayer)?.name;
        this.elements.currentPlayer.textContent = `Vez de: ${currentPlayerName}`;
        
        // Destaca o jogador atual
        this.highlightCurrentPlayer(gameState.currentPlayer);
        
        // Atualiza oponentes
        this.renderOpponents(gameState.players);
        
        // Atualiza nome do jogador
        this.elements.playerNameDisplay.textContent = gameState.players.find(p => p.id === this.currentPlayerId)?.name;
        
        // Ativa/desativa botão de UNO baseado na quantidade de cartas
        if (gameState.hand.length === 2) {
            this.elements.unoBtn.classList.add('active');
        } else {
            this.elements.unoBtn.classList.remove('active');
        }
        
        // Exibe cor atual
        document.documentElement.style.setProperty('--current-color-highlight', this.getColorValue(gameState.currentColor));
    }
    
    renderPlayerHand(cards, playableCards) {
        this.elements.playerHand.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = card.render(true);
            
            // Verifica se a carta pode ser jogada
            const isPlayable = playableCards.some(c => c.id === card.id);
            if (!isPlayable) {
                cardElement.classList.add('disabled');
            }
            
            // Adiciona evento de clique para jogar a carta
            cardElement.addEventListener('click', () => {
                if (isPlayable) {
                    this.playCard(card.id);
                }
            });
            
            this.elements.playerHand.appendChild(cardElement);
        });
    }
    
    renderDiscardPile(topCard) {
        this.elements.discardPile.innerHTML = '';
        
        if (topCard) {
            const cardElement = topCard.render(true);
            this.elements.discardPile.appendChild(cardElement);
        }
    }
    
    renderOpponents(players) {
        this.elements.opponentsContainer.innerHTML = '';
        
        // Filtra o jogador atual
        const opponents = players.filter(p => p.id !== this.currentPlayerId);
        
        opponents.forEach(opponent => {
            const opponentElement = document.createElement('div');
            opponentElement.className = 'opponent';
            opponentElement.dataset.id = opponent.id;
            
            if (opponent.isCurrentPlayer) {
                opponentElement.classList.add('active');
            }
            
            const opponentInfo = document.createElement('div');
            opponentInfo.className = 'opponent-info';
            
            const opponentName = document.createElement('div');
            opponentName.className = 'opponent-name';
            opponentName.textContent = opponent.name;
            
            const opponentCardCount = document.createElement('div');
            opponentCardCount.className = 'opponent-card-count';
            opponentCardCount.textContent = `${opponent.cardCount} cartas`;
            
            opponentInfo.appendChild(opponentName);
            opponentInfo.appendChild(opponentCardCount);
            
            const opponentHand = document.createElement('div');
            opponentHand.className = 'opponent-hand';
            
            // Cria cartas viradas para baixo para o oponente
            for (let i = 0; i < Math.min(opponent.cardCount, 7); i++) {
                const dummyCard = new UnoCard('number', 'red', '0');
                const cardElement = dummyCard.render(false);
                opponentHand.appendChild(cardElement);
            }
            
            opponentElement.appendChild(opponentInfo);
            opponentElement.appendChild(opponentHand);
            
            this.elements.opponentsContainer.appendChild(opponentElement);
        });
    }
    
    highlightCurrentPlayer(currentPlayerId) {
        // Remove destaque de todos os jogadores
        document.querySelectorAll('.opponent').forEach(el => {
            el.classList.remove('active');
        });
        
        // Adiciona destaque ao jogador atual
        const currentPlayerElement = document.querySelector(`.opponent[data-id="${currentPlayerId}"]`);
        if (currentPlayerElement) {
            currentPlayerElement.classList.add('active');
        }
        
        // Destaca a área do jogador ou oponente
        if (currentPlayerId === this.currentPlayerId) {
            this.elements.playerHand.parentElement.classList.add('active-turn');
        } else {
            this.elements.playerHand.parentElement.classList.remove('active-turn');
        }
    }
    
    playCard(cardId) {
        const gameState = this.game.roomManager.getGameState(this.roomCode, this.currentPlayerId);
        if (!gameState) return;
        
        // Verifica se é a vez do jogador
        if (gameState.currentPlayer !== this.currentPlayerId) {
            this.showMessage('Não é a sua vez!');
            return;
        }
        
        // Encontra a carta na mão do jogador
        const card = gameState.hand.find(c => c.id === cardId);
        if (!card) return;
        
        // Verifica se é curinga ou curinga +4
        if (card.type === 'wild') {
            // Mostra seletor de cor
            this.selectedCardId = cardId;
            this.elements.colorSelector.classList.remove('hidden');
        } else {
            // Joga a carta diretamente
            const result = this.game.roomManager.playCard(this.roomCode, this.currentPlayerId, cardId);
            
            if (!result.success) {
                this.showMessage(result.error || 'Jogada inválida');
            }
        }
    }
    
    selectColor(color) {
        if (!this.selectedCardId) return;
        
        // Esconde seletor de cor
        this.elements.colorSelector.classList.add('hidden');
        
        // Joga a carta com a cor selecionada
        const result = this.game.roomManager.playCard(
            this.roomCode, 
            this.currentPlayerId, 
            this.selectedCardId, 
            color
        );
        
        if (!result.success) {
            this.showMessage(result.error || 'Jogada inválida');
        }
        
        this.selectedCardId = null;
    }
    
    drawCard() {
        const gameState = this.game.roomManager.getGameState(this.roomCode, this.currentPlayerId);
        if (!gameState) return;
        
        // Verifica se é a vez do jogador
        if (gameState.currentPlayer !== this.currentPlayerId) {
            this.showMessage('Não é a sua vez!');
            return;
        }
        
        const result = this.game.roomManager.drawCard(this.roomCode, this.currentPlayerId);
        
        if (!result.success) {
            this.showMessage(result.error || 'Não é possível comprar agora');
        } else if (result.canPlayDrawnCard) {
            this.showMessage('Você pode jogar a carta que comprou');
        }
    }
    
    callUno() {
        const result = this.game.roomManager.callUno(this.roomCode, this.currentPlayerId);
        
        if (!result.success) {
            this.showMessage(result.error || 'Não é possível chamar UNO agora');
        } else {
            // Efeito visual e sonoro para UNO
            const unoEffect = document.createElement('div');
            unoEffect.className = 'uno-effect';
            unoEffect.textContent = 'UNO!';
            document.body.appendChild(unoEffect);
            
            setTimeout(() => {
                document.body.removeChild(unoEffect);
            }, 1500);
            
            // Reproduz som se habilitado
            if (this.storage.getSettings().soundEffects) {
                // Código para reproduzir som de UNO
            }
        }
    }
    
    openGameMenu() {
        // Cria menu do jogo
        const gameMenuOverlay = document.createElement('div');
        gameMenuOverlay.className = 'overlay';
        gameMenuOverlay.classList.add('active');
        
        const gameMenu = document.createElement('div');
        gameMenu.className = 'game-menu';
        gameMenu.classList.add('active');
        
        const gameMenuTitle = document.createElement('h3');
        gameMenuTitle.className = 'game-menu-title';
        gameMenuTitle.textContent = 'Menu do Jogo';
        
        const gameMenuOptions = document.createElement('div');
        gameMenuOptions.className = 'game-menu-options';
        
        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'game-menu-btn resume-btn';
        resumeBtn.textContent = 'Continuar Jogo';
        resumeBtn.addEventListener('click', () => {
            document.body.removeChild(gameMenuOverlay);
            document.body.removeChild(gameMenu);
        });
        
        const quitBtn = document.createElement('button');
        quitBtn.className = 'game-menu-btn quit-btn';
        quitBtn.textContent = 'Sair do Jogo';
        quitBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair do jogo?')) {
                this.leaveRoom();
                document.body.removeChild(gameMenuOverlay);
                document.body.removeChild(gameMenu);
            }
        });
        
        gameMenuOptions.appendChild(resumeBtn);
        gameMenuOptions.appendChild(quitBtn);
        
        gameMenu.appendChild(gameMenuTitle);
        gameMenu.appendChild(gameMenuOptions);
        
        document.body.appendChild(gameMenuOverlay);
        document.body.appendChild(gameMenu);
        
        gameMenuOverlay.addEventListener('click', () => {
            document.body.removeChild(gameMenuOverlay);
            document.body.removeChild(gameMenu);
        });
    }
    
    showPlayerChoiceDialog() {
        const gameState = this.game.roomManager.getGameState(this.roomCode, this.currentPlayerId);
        if (!gameState) return;
        
        // Filtra o jogador atual
        const opponents = gameState.players.filter(p => p.id !== this.currentPlayerId);
        
        // Cria diálogo de seleção de jogador
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.classList.add('active');
        
        const dialog = document.createElement('div');
        dialog.className = 'color-selector'; // Reutiliza o estilo do seletor de cor
        dialog.classList.remove('hidden');
        
        const title = document.createElement('h3');
        title.textContent = 'Escolha um jogador para trocar as cartas:';
        
        const playersList = document.createElement('div');
        playersList.className = 'players-choice';
        playersList.style.display = 'flex';
        playersList.style.flexDirection = 'column';
        playersList.style.gap = '10px';
        playersList.style.marginTop = '15px';
        
        opponents.forEach(opponent => {
            const playerBtn = document.createElement('button');
            playerBtn.className = 'primary-btn';
            playerBtn.textContent = opponent.name;
            playerBtn.style.width = '100%';
            playerBtn.addEventListener('click', () => {
                this.choosePlayerForSwap(opponent.id);
                document.body.removeChild(overlay);
                document.body.removeChild(dialog);
            });
            
            playersList.appendChild(playerBtn);
        });
        
        dialog.appendChild(title);
        dialog.appendChild(playersList);
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
    }
    
    choosePlayerForSwap(targetPlayerId) {
        const room = this.game.roomManager.rooms[this.roomCode];
        if (!room || !room.game) return;
        
        room.game.playerChoiceCallback(targetPlayerId);
    }
    
    updateGameOverStats(data) {
        const statsContainer = this.elements.gameStatsContainer;
        statsContainer.innerHTML = '';
        
        // Adiciona estatísticas para cada jogador
        data.players.forEach(player => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            
            const playerName = document.createElement('div');
            playerName.className = 'stat-player';
            playerName.textContent = player.name;
            
            const score = document.createElement('div');
            score.className = 'stat-item';
            
            const scoreLabel = document.createElement('span');
            scoreLabel.textContent = 'Pontuação:';
            
            const scoreValue = document.createElement('span');
            // Encontra a pontuação deste jogador
            const playerScore = data.scores.find(s => s.playerId === player.id);
            scoreValue.textContent = playerScore ? playerScore.score : '0';
            
            score.appendChild(scoreLabel);
            score.appendChild(scoreValue);
            
            const cardsPlayed = document.createElement('div');
            cardsPlayed.className = 'stat-item';
            cardsPlayed.innerHTML = `<span>Cartas jogadas:</span><span>${player.stats.cardsPlayed}</span>`;
            
            const specialCards = document.createElement('div');
            specialCards.className = 'stat-item';
            specialCards.innerHTML = `<span>Cartas especiais:</span><span>${player.stats.specialCardsPlayed}</span>`;
            
            const unosCalled = document.createElement('div');
            unosCalled.className = 'stat-item';
            unosCalled.innerHTML = `<span>UNOs chamados:</span><span>${player.stats.uno}</span>`;
            
            statCard.appendChild(playerName);
            statCard.appendChild(score);
            statCard.appendChild(cardsPlayed);
            statCard.appendChild(specialCards);
            statCard.appendChild(unosCalled);
            
            // Destaca o vencedor
            if (player.id === data.winner) {
                statCard.style.border = '2px solid var(--accent-color)';
                statCard.style.boxShadow = '0 0 10px var(--accent-color)';
            }
            
            statsContainer.appendChild(statCard);
        });
    }
    
    restartGame() {
        // Reinicia o jogo com os mesmos jogadores
        const result = this.game.roomManager.startGame(this.roomCode, this.currentPlayerId);
        
        if (result.success) {
            this.setupGameListeners();
            this.updateGameUI();
            this.showScreen('game');
        } else {
            alert(`Erro ao reiniciar o jogo: ${result.error}`);
            this.showScreen('waitingRoom');
        }
    }
    
    returnToMainMenu() {
        this.leaveRoom();
        this.showScreen('start');
    }
    
    getColorName(color) {
        const colorNames = {
            'red': 'Vermelho',
            'blue': 'Azul',
            'green': 'Verde',
            'yellow': 'Amarelo'
        };
        
        return colorNames[color] || color;
    }
    
    getColorValue(color) {
        const colorValues = {
            'red': 'var(--card-red)',
            'blue': 'var(--card-blue)',
            'green': 'var(--card-green)',
            'yellow': 'var(--card-yellow)'
        };
        
        return colorValues[color] || 'transparent';
    }
}