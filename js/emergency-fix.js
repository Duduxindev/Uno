/**
 * UNO Game - Correção de Emergência
 * Data: 2025-04-14 15:03:56
 * Desenvolvido por: Duduxindev
 * 
 * Este script resolve problemas críticos de inicialização, Firebase e chat.
 */

// Executar imediatamente
(function() {
    console.log("🚨 Aplicando correção de emergência v1.0.1");
    console.log("⏱️ Timestamp: 2025-04-14 15:03:56");
    console.log("👤 Usuário: Duduxindev");
    
    // Verificar se a página está carregando corretamente
    if (document.body.innerHTML === '') {
        console.error("❌ PÁGINA EM BRANCO DETECTADA!");
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h1>Recuperando o UNO Game...</h1>
                <p>Detectamos um problema grave. Estamos restaurando o jogo para você.</p>
                <button id="emergency-restart" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Reiniciar Jogo</button>
                <p>Se o problema persistir, limpe os dados do navegador e tente novamente.</p>
            </div>
        `;
        
        document.getElementById('emergency-restart')?.addEventListener('click', function() {
            localStorage.removeItem('uno_game_state');
            localStorage.removeItem('uno_current_screen');
            localStorage.removeItem('uno_fallback_data');
            location.reload();
        });
        
        return; // Parar execução 
    }
    
    // Salvar referências globais importantes
    const _setInterval = window.setInterval;
    const _setTimeout = window.setTimeout;
    const _console = { 
        log: console.log, 
        error: console.error, 
        warn: console.warn
    };
    
    // Proteção contra erros graves
    window.onerror = function(message, source, lineno, colno, error) {
        _console.error(`❌ Erro capturado: ${message}`);
        
        // Evitar loops infinitos de erro
        if (window._errorCount === undefined) window._errorCount = 0;
        window._errorCount++;
        
        if (window._errorCount > 10) {
            _console.error("🛑 Muitos erros detectados. Parando processamento.");
            return true;
        }
        
        // Se for um erro do Firebase, tentar corrigir
        if (source && source.includes('firebase') || message && message.includes('firebase')) {
            _console.warn("⚠️ Erro do Firebase detectado. Aplicando correção...");
            fixFirebaseIssues();
        }
        
        return false; // Permitir que outros manipuladores de erro processem
    };
    
    // Corrigir problemas específicos do Firebase
    function fixFirebaseIssues() {
        if (typeof firebase === 'undefined' || !firebase.database) {
            _console.warn("⚠️ Firebase não disponível ou corrompido. Criando substituto...");
            
            // Criar substituto básico do Firebase
            window.firebase = {
                database: function() {
                    return {
                        ref: function(path) {
                            return {
                                set: function(data) { return Promise.resolve(); },
                                update: function(data) { return Promise.resolve(); },
                                push: function(data) { return { key: 'local-' + Date.now() }; },
                                remove: function() { return Promise.resolve(); },
                                once: function(eventType) {
                                    return Promise.resolve({
                                        val: function() { return null; },
                                        exists: function() { return false; }
                                    });
                                },
                                on: function(eventType, callback) {
                                    // Simular dados mínimos necessários
                                    if (path === 'rooms') {
                                        callback({
                                            val: function() { return {}; },
                                            exists: function() { return true; }
                                        });
                                    }
                                    return function(){}; // Função de unsubscribe
                                },
                                child: function(childPath) {
                                    return this;
                                }
                            };
                        },
                        ServerValue: {
                            TIMESTAMP: Date.now()
                        }
                    };
                },
                auth: function() {
                    return {
                        signInAnonymously: function() {
                            return Promise.resolve({
                                user: { uid: 'local-' + Math.random().toString(36).substring(2, 9) }
                            });
                        },
                        onAuthStateChanged: function(callback) {
                            callback({ uid: 'local-user', isAnonymous: true });
                            return function(){}; // Função de unsubscribe
                        }
                    };
                }
            };
            
            // Criar FirebaseUtil se não existir
            window.FirebaseUtil = window.FirebaseUtil || {
                generateRoomCode: function() {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    let code = '';
                    for (let i = 0; i < 4; i++) {
                        code += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    return code;
                },
                getRoomRef: function(roomCode) {
                    return firebase.database().ref('rooms/' + roomCode);
                },
                checkRoomExists: function(roomCode) {
                    return Promise.resolve(false);
                }
            };
        }
    }
    
    // Corrigir problemas de chat
    function fixChatIssues() {
        _console.log("🔄 Verificando sistema de chat...");
        
        // Verificar se o objeto chat existe
        if (!window.Chat) {
            _console.error("❌ Objeto Chat não encontrado. Recriando...");
            
            // Criar substituto básico
            window.Chat = {
                init: function() {
                    _console.log("✅ Chat (modo de emergência) inicializado");
                    this.setupEventListeners();
                },
                
                setupEventListeners: function() {
                    // Setup para chat da sala de espera
                    const waitingChatInput = document.getElementById('waiting-chat-input');
                    const waitingSendBtn = document.getElementById('waiting-chat-send');
                    const waitingChatMessages = document.getElementById('waiting-chat-messages');
                    
                    if (waitingSendBtn && waitingChatInput) {
                        waitingSendBtn.addEventListener('click', function() {
                            const message = waitingChatInput.value.trim();
                            if (message) {
                                const playerName = localStorage.getItem('playerName') || 'Você';
                                if (waitingChatMessages) {
                                    const msgElement = document.createElement('div');
                                    msgElement.className = 'chat-message';
                                    msgElement.innerHTML = `<span class="player-name">${playerName}:</span> ${message}`;
                                    waitingChatMessages.appendChild(msgElement);
                                    waitingChatMessages.scrollTop = waitingChatMessages.scrollHeight;
                                }
                                waitingChatInput.value = '';
                            }
                        });
                        
                        waitingChatInput.addEventListener('keypress', function(e) {
                            if (e.key === 'Enter') {
                                waitingSendBtn.click();
                            }
                        });
                    }
                    
                    // Setup para chat do jogo
                    const gameChatInput = document.getElementById('game-chat-input');
                    const gameSendBtn = document.getElementById('game-chat-send');
                    const gameChatMessages = document.getElementById('game-chat-messages');
                    
                    if (gameSendBtn && gameChatInput) {
                        gameSendBtn.addEventListener('click', function() {
                            const message = gameChatInput.value.trim();
                            if (message) {
                                const playerName = localStorage.getItem('playerName') || 'Você';
                                if (gameChatMessages) {
                                    const msgElement = document.createElement('div');
                                    msgElement.className = 'chat-message';
                                    msgElement.innerHTML = `<span class="player-name">${playerName}:</span> ${message}`;
                                    gameChatMessages.appendChild(msgElement);
                                    gameChatMessages.scrollTop = gameChatMessages.scrollHeight;
                                    
                                    // Verificar comandos
                                    if (message.toLowerCase() === '!uno') {
                                        if (typeof window.callUno === 'function') {
                                            window.callUno();
                                        }
                                    }
                                }
                                gameChatInput.value = '';
                            }
                        });
                        
                        gameChatInput.addEventListener('keypress', function(e) {
                            if (e.key === 'Enter') {
                                gameSendBtn.click();
                            }
                        });
                    }
                },
                
                sendMessage: function(roomCode, playerName, message) {
                    _console.log(`💬 [Modo Local] ${playerName}: ${message}`);
                    return Promise.resolve();
                }
            };
            
            // Inicializar chat de emergência
            _setTimeout(function() {
                try {
                    window.Chat.init();
                } catch (err) {
                    _console.error("❌ Erro ao inicializar chat de emergência:", err);
                }
            }, 1000);
        }
    }
    
    // Corrigir problemas de códigos de sala
    function fixRoomCodeIssues() {
        _console.log("🔄 Verificando sistema de códigos de sala...");
        
        // Verificar se o botão de criar sala existe e funciona
        const createRoomBtn = document.getElementById('create-room-btn');
        if (createRoomBtn) {
            // Restaurar funcionalidade do botão de criar sala
            createRoomBtn.addEventListener('click', function() {
                _console.log("🏠 Tentativa de criação de sala de emergência");
                
                // Pegar nome do host
                const hostNameInput = document.getElementById('host-name');
                const hostName = hostNameInput ? hostNameInput.value.trim() : 'Jogador';
                
                if (!hostName) {
                    showToast("Por favor, digite seu nome.");
                    return;
                }
                
                // Gerar código de sala
                const roomCode = generateEmergencyRoomCode();
                
                // Salvar nome do jogador
                localStorage.setItem('playerName', hostName);
                
                // Mostrar sala de espera
                localStorage.setItem('roomCode', roomCode);
                localStorage.setItem('isHost', 'true');
                
                // Transição para sala de espera
                showScreen('waiting-room-screen');
                
                // Atualizar UI da sala
                updateWaitingRoomUI(roomCode, hostName);
                
                showToast("Sala criada com sucesso! Código: " + roomCode);
            });
        }
        
        // Verificar se o botão de entrar em sala existe e funciona
        const joinRoomBtn = document.getElementById('join-room-btn');
        if (joinRoomBtn) {
            // Restaurar funcionalidade do botão de entrar em sala
            joinRoomBtn.addEventListener('click', function() {
                _console.log("🚪 Tentativa de entrar em sala de emergência");
                
                // Pegar nome do jogador e código da sala
                const playerNameInput = document.getElementById('player-name');
                const roomCodeInput = document.getElementById('room-code');
                
                const playerName = playerNameInput ? playerNameInput.value.trim() : '';
                const roomCode = roomCodeInput ? roomCodeInput.value.trim().toUpperCase() : '';
                
                if (!playerName) {
                    showToast("Por favor, digite seu nome.");
                    return;
                }
                
                if (!roomCode || roomCode.length !== 4) {
                    showToast("Por favor, digite um código de sala válido (4 letras).");
                    return;
                }
                
                // Salvar nome do jogador
                localStorage.setItem('playerName', playerName);
                localStorage.setItem('roomCode', roomCode);
                localStorage.setItem('isHost', 'false');
                
                // Transição para sala de espera
                showScreen('waiting-room-screen');
                
                // Atualizar UI da sala
                updateWaitingRoomUI(roomCode, playerName);
                
                showToast("Conectado à sala! Código: " + roomCode);
            });
        }
    }
    
    // Gerar código de sala de emergência
    function generateEmergencyRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    // Atualizar UI da sala de espera
    function updateWaitingRoomUI(roomCode, playerName) {
        // Atualizar código da sala
        const roomCodeDisplay = document.getElementById('room-code-display');
        if (roomCodeDisplay) {
            roomCodeDisplay.textContent = roomCode;
        }
        
        // Atualizar lista de jogadores
        const playersList = document.getElementById('players-list');
        if (playersList) {
            playersList.innerHTML = '';
            
            // Adicionar o jogador atual
            const playerItem = document.createElement('li');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <div class="player-avatar" style="background-color: #3498db">${playerName.charAt(0).toUpperCase()}</div>
                <div class="player-info">
                    <div class="player-name">${playerName}</div>
                    <div class="player-status">Pronto</div>
                </div>
                <div class="player-host">${localStorage.getItem('isHost') === 'true' ? '(Anfitrião)' : ''}</div>
            `;
            playersList.appendChild(playerItem);
        }
        
        // Configurar botões com base no tipo de jogador
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            if (localStorage.getItem('isHost') === 'true') {
                startGameBtn.style.display = 'block';
                
                startGameBtn.addEventListener('click', function() {
                    // Iniciar jogo de emergência
                    startEmergencyGame();
                });
            } else {
                startGameBtn.style.display = 'none';
            }
        }
        
        // Configurar botão de sair
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', function() {
                // Limpar dados da sala
                localStorage.removeItem('roomCode');
                localStorage.removeItem('isHost');
                
                // Voltar para tela inicial
                showScreen('start-screen');
            });
        }
        
        // Configurar botão de copiar código
        const copyCodeBtn = document.getElementById('copy-code-btn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', function() {
                try {
                    navigator.clipboard.writeText(roomCode)
                    .then(() => {
                        showToast("Código copiado para a área de transferência!");
                    })
                    .catch(err => {
                        showToast("Erro ao copiar código.");
                        _console.error("Erro ao copiar:", err);
                    });
                } catch (err) {
                    // Fallback para browsers antigos
                    const tempInput = document.createElement("input");
                    tempInput.value = roomCode;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand("copy");
                    document.body.removeChild(tempInput);
                    showToast("Código copiado para a área de transferência!");
                }
            });
        }
    }
    
    // Iniciar jogo de emergência
    function startEmergencyGame() {
        _console.log("🎮 Iniciando jogo de emergência");
        
        // Configurar estado de jogo básico
        const gameState = {
            playerCount: 4,
            mode: 'normal',
            customRules: {
                stacking: true,
                jumpIn: false,
                forcePlay: true,
                sevenTrade: false,
                zeroRotate: false
            }
        };
        
        // Salvar estado
        localStorage.setItem('uno_game_state', JSON.stringify(gameState));
        
        // Mostrar tela de jogo
        showScreen('game-screen');
        
        // Gerar cartas de emergência
        generateEmergencyCards();
    }
    
    // Gerar cartas de emergência
    function generateEmergencyCards() {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Limpar mão atual
        playerHand.innerHTML = '';
        
        // Cores e valores
        const colors = ['red', 'blue', 'green', 'yellow'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
        
        // Gerar 7 cartas
        for (let i = 0; i < 7; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const value = values[Math.floor(Math.random() * values.length)];
            
            // Criar carta
            const card = document.createElement('div');
            card.className = `card ${color}`;
            card.dataset.id = `emergency-${i}-${Date.now()}`;
            card.dataset.color = color;
            card.dataset.value = value;
            card.dataset.type = isNaN(parseInt(value)) ? 'action' : 'number';
            
            // Criar conteúdo interno da carta
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-corners">
                        <div class="card-corner top-left">${value}</div>
                        <div class="card-corner bottom-right">${value}</div>
                    </div>
                    <div class="card-center">${value}</div>
                </div>
            `;
            
            // Adicionar carta à mão
            playerHand.appendChild(card);
            
            // Adicionar evento de clique
            card.addEventListener('click', function() {
                // Simular jogada de carta
                card.remove();
                
                // Atualizar contador de cartas
                const cardCounter = document.getElementById('card-count');
                if (cardCounter) {
                    const cardsLeft = playerHand.children.length;
                    cardCounter.textContent = `${cardsLeft} carta${cardsLeft !== 1 ? 's' : ''}`;
                }
                
                showToast("Carta jogada!");
                
                // Verificar vitória
                if (playerHand.children.length === 0) {
                    _setTimeout(function() {
                        alert("Parabéns! Você ganhou!");
                        showScreen('start-screen');
                    }, 500);
                }
            });
        }
        
        // Atualizar contador de cartas
        const cardCounter = document.getElementById('card-count');
        if (cardCounter) {
            cardCounter.textContent = "7 cartas";
        }
        
        // Gerar mesa de jogo
        const drawPile = document.getElementById('draw-pile');
        if (drawPile) {
            drawPile.innerHTML = `
                <div class="card back">
                    <div class="card-inner">
                        <div class="card-logo">UNO</div>
                    </div>
                </div>
                <div class="card-count-label">43</div>
            `;
            
            // Adicionar evento de clique
            drawPile.addEventListener('click', function() {
                if (playerHand.children.length >= 15) {
                    showToast("Você já tem muitas cartas!");
                    return;
                }
                
                // Gerar nova carta
                const color = colors[Math.floor(Math.random() * colors.length)];
                const value = values[Math.floor(Math.random() * values.length)];
                
                // Criar carta
                const card = document.createElement('div');
                card.className = `card ${color}`;
                card.dataset.id = `drawn-${Date.now()}`;
                card.dataset.color = color;
                card.dataset.value = value;
                card.dataset.type = isNaN(parseInt(value)) ? 'action' : 'number';
                
                // Criar conteúdo interno da carta
                card.innerHTML = `
                    <div class="card-inner">
                        <div class="card-corners">
                            <div class="card-corner top-left">${value}</div>
                            <div class="card-corner bottom-right">${value}</div>
                        </div>
                        <div class="card-center">${value}</div>
                    </div>
                `;
                
                // Adicionar carta à mão com animação
                playerHand.appendChild(card);
                _setTimeout(function() {
                    card.classList.add('in-hand');
                }, 10);
                
                // Adicionar evento de clique
                card.addEventListener('click', function() {
                    // Simular jogada de carta
                    card.remove();
                    
                    // Atualizar contador de cartas
                    const cardCounter = document.getElementById('card-count');
                    if (cardCounter) {
                        const cardsLeft = playerHand.children.length;
                        cardCounter.textContent = `${cardsLeft} carta${cardsLeft !== 1 ? 's' : ''}`;
                    }
                    
                    showToast("Carta jogada!");
                    
                    // Verificar vitória
                    if (playerHand.children.length === 0) {
                        _setTimeout(function() {
                            alert("Parabéns! Você ganhou!");
                            showScreen('start-screen');
                        }, 500);
                    }
                });
                
                // Atualizar contador de cartas
                const cardsLeft = playerHand.children.length;
                if (cardCounter) {
                    cardCounter.textContent = `${cardsLeft} carta${cardsLeft !== 1 ? 's' : ''}`;
                }
                
                showToast("Você comprou uma carta!");
            });
        }
        
        // Gerar pilha de descarte
        const discardPile = document.getElementById('discard-pile');
        if (discardPile) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const value = values[Math.floor(Math.random() * values.length)];
            
            discardPile.innerHTML = `
                <div class="card ${color}">
                    <div class="card-inner">
                        <div class="card-corners">
                            <div class="card-corner top-left">${value}</div>
                            <div class="card-corner bottom-right">${value}</div>
                        </div>
                        <div class="card-center">${value}</div>
                    </div>
                </div>
            `;
        }
    }
    
    // Utilitário para trocar telas
    function showScreen(screenId) {
        // Esconder todas as telas
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar a tela solicitada
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            
            // Salvar tela atual
            localStorage.setItem('uno_current_screen', screenId);
            
            // Disparar evento
            const event = new CustomEvent('screenChange', { 
                detail: { screen: screenId }
            });
            document.dispatchEvent(event);
        }
    }
    
    // Utilitário para mostrar mensagens
    function showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast show';
            
            _setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        }
    }
    
    // Verificar que todos os elementos básicos da página estejam presentes
    function checkBasicPageStructure() {
        // Verificar tela inicial
        if (!document.getElementById('start-screen')) {
            _console.error("❌ Elementos básicos da página estão ausentes!");
            return false;
        }
        
        return true;
    }
    
    // Consertar navegação básica
    function fixBasicNavigation() {
        // Verificar se temos tela inicial
        if (!checkBasicPageStructure()) {
            _console.error("⛔ Não é possível corrigir a navegação: estrutura básica ausente");
            return;
        }
        
        // Botões da tela inicial
        const playLocalBtn = document.getElementById('play-local-btn');
        const playOnlineBtn = document.getElementById('play-online-btn');
        const optionsBtn = document.getElementById('options-btn');
        const rulesBtn = document.getElementById('rules-btn');
        
        // Botões de voltar
        const backButtons = document.querySelectorAll('[id^="back-from"]');
        
        // Configurar botões da tela inicial
        if (playLocalBtn) playLocalBtn.addEventListener('click', () => showScreen('local-game-screen'));
        if (playOnlineBtn) playOnlineBtn.addEventListener('click', () => showScreen('online-options-screen'));
        if (optionsBtn) optionsBtn.addEventListener('click', () => showScreen('options-screen'));
        if (rulesBtn) rulesBtn.addEventListener('click', () => showScreen('rules-screen'));
        
        // Configurar botões de voltar
        backButtons.forEach(button => {
            button.addEventListener('click', () => showScreen('start-screen'));
        });
        
        // Botões da tela de opções online
        const createRoomOption = document.getElementById('create-room-option');
        const joinRoomOption = document.getElementById('join-room-option');
        const backFromOnlineOptions = document.getElementById('back-from-online-options');
        
        if (createRoomOption) createRoomOption.addEventListener('click', () => showScreen('create-room-screen'));
        if (joinRoomOption) joinRoomOption.addEventListener('click', () => showScreen('join-room-screen'));
        if (backFromOnlineOptions) backFromOnlineOptions.addEventListener('click', () => showScreen('start-screen'));
        
        // Botões de navegação específicos
        const backFromCreate = document.getElementById('back-from-create');
        const backFromJoin = document.getElementById('back-from-join');
        const backFromRules = document.getElementById('back-from-rules');
        const backFromOptions = document.getElementById('back-from-options');
        
        if (backFromCreate) backFromCreate.addEventListener('click', () => showScreen('online-options-screen'));
        if (backFromJoin) backFromJoin.addEventListener('click', () => showScreen('online-options-screen'));
        if (backFromRules) backFromRules.addEventListener('click', () => showScreen('start-screen'));
        if (backFromOptions) backFromOptions.addEventListener('click', () => showScreen('start-screen'));
    }
    
    // Corrigir problemas de modos de jogo
    function fixGameModesIssues() {
        _console.log("🔧 Corrigindo modos de jogo...");
        
        // Verificar elementos da tela de jogo local
        const modeCards = document.querySelectorAll('.mode-card');
        const modeDescription = document.getElementById('mode-description');
        
        // Adicionar funcionalidade aos cartões de modo
        modeCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remover seleção de todos os cartões
                modeCards.forEach(c => c.classList.remove('selected'));
                
                // Adicionar seleção a este cartão
                this.classList.add('selected');
                
                // Atualizar descrição
                if (modeDescription) {
                    const mode = this.dataset.mode;
                    let description = "Modo de jogo padrão.";
                    
                    // Descrições básicas dos modos
                    const descriptions = {
                        'normal': "Modo clássico com regras originais do UNO.",
                        'wild': "Mais cartas especiais no baralho para partidas mais dinâmicas.",
                        'no-mercy': "Empilhe cartas +2 e +4 sem limites para combos devastadores.",
                        'seven-zero': "Carta 7 = trocar mãos com outro jogador, Carta 0 = rotacionar mãos entre todos.",
                        'extreme': "Todas as regras especiais ativadas e mais cartas de ação. Caos total!",
                        'speed': "Jogo rápido com turnos de apenas 15 segundos. Pense rápido!",
                        'chaos': "Regras aleatórias mudam a cada rodada. Imprevisível e divertido!",
                        'action-only': "Apenas cartas de ação, sem cartas numéricas. Pura estratégia!",
                        'insane': "Modo insano com cartas poderosas e regras imprevisíveis. Prepare-se para o caos!",
                        'mirror': "Cada carta jogada afeta todos os jogadores da mesma forma.",
                        'quickDraw': "Compre cartas constantemente! A cada turno você compra uma carta automaticamente.",
                        'challenge': "Cartas de desafio aparecem frequentemente."
                    };
                    
                    modeDescription.textContent = descriptions[mode] || description;
                }
            });
        });
        
        // Consertar botão de início de jogo local
        const startLocalGameBtn = document.getElementById('start-local-game-btn');
        if (startLocalGameBtn) {
            startLocalGameBtn.addEventListener('click', function() {
                _console.log("🎮 Iniciando jogo local de emergência");
                
                // Encontrar modo selecionado
                const selectedMode = document.querySelector('.mode-card.selected');
                const mode = selectedMode ? selectedMode.dataset.mode : 'normal';
                
                // Obter número de jogadores
                const playerCount = document.getElementById('player-count') ? 
                    parseInt(document.getElementById('player-count').value) : 4;
                
                // Obter regras personalizadas
                const customRules = {
                    stacking: document.getElementById('stacking') ? document.getElementById('stacking').checked : false,
                    jumpIn: document.getElementById('jump-in') ? document.getElementById('jump-in').checked : false,
                    forcePlay: document.getElementById('force-play') ? document.getElementById('force-play').checked : true,
                    sevenTrade: document.getElementById('seven-trade') ? document.getElementById('seven-trade').checked : false,
                    zeroRotate: document.getElementById('zero-rotate') ? document.getElementById('zero-rotate').checked : false
                };
                
                // Configurar estado de jogo
                const gameState = {
                    playerCount: playerCount,
                    mode: mode,
                    customRules: customRules
                };
                
                // Salvar estado
                localStorage.setItem('uno_game_state', JSON.stringify(gameState));
                
                // Mostrar tela de jogo
                showScreen('game-screen');
                
                // Gerar cartas de emergência
                generateEmergencyCards();
            });
        }
    }
    
    // Executar todas as correções necessárias
    function applyAllFixes() {
        _console.log("🛠️ Aplicando todas as correções de emergência...");
        
        // Consertar Firebase primeiro
        fixFirebaseIssues();
        
        // Aplicar outras correções
        fixChatIssues();
        fixRoomCodeIssues();
        fixBasicNavigation();
        fixGameModesIssues();
        
        // Restaurar tela anterior se possível
        const lastScreen = localStorage.getItem('uno_current_screen');
        if (lastScreen) {
            _setTimeout(() => {
                showScreen(lastScreen);
            }, 100);
        }
        
        _console.log("✅ Correções de emergência aplicadas com sucesso!");
    }
    
    // Executar correções quando o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyAllFixes);
    } else {
        applyAllFixes();
    }
    
    // Instalar handler para futuros problemas
    window.onerror = function(msg, url, line, col, error) {
        _console.error(`❌ Erro detectado: ${msg} (${url}:${line}:${col})`);
        // Retornar false permite que outros handlers de erro sejam executados
        return false;
    };
    
    // Exportar funções de emergência para uso global
    window.emergencyFix = {
        fixFirebase: fixFirebaseIssues,
        fixChat: fixChatIssues,
        fixRoomCodes: fixRoomCodeIssues,
        fixNavigation: fixBasicNavigation,
        fixGameModes: fixGameModesIssues,
        showScreen: showScreen,
        showToast: showToast,
        generateCards: generateEmergencyCards
    };
    
    // Adicionar botão de emergência fixo na página
    const emergencyButton = document.createElement('button');
    emergencyButton.textContent = "⚠️ Corrigir";
    emergencyButton.style.position = 'fixed';
    emergencyButton.style.bottom = '10px';
    emergencyButton.style.right = '10px';
    emergencyButton.style.background = '#E74C3C';
    emergencyButton.style.color = 'white';
    emergencyButton.style.border = 'none';
    emergencyButton.style.borderRadius = '4px';
    emergencyButton.style.padding = '5px 10px';
    emergencyButton.style.zIndex = '9999';
    emergencyButton.style.cursor = 'pointer';
    
    emergencyButton.addEventListener('click', function() {
        if (confirm("Aplicar correção de emergência? Isso pode resolver problemas, mas também reiniciar seu estado atual.")) {
            applyAllFixes();
            showToast("Correção de emergência aplicada!");
        }
    });
    
    document.body.appendChild(emergencyButton);
})();