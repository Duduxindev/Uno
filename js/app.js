/**
 * Aplicação Principal - UNO Game
 * Última atualização: 2025-04-11 16:37:23
 * Desenvolvido por: Duduxindev
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Inicializando UNO Game...");
    
    // Inicializar gerenciadores
    const roomManager = new RoomManager();
    const storage = new GameStorage();
    
    // Verificar se há uma sessão ativa
    checkActiveSession(roomManager);
    
    // Configurar listeners de eventos
    setupEventListeners(roomManager);
    
    // Aplicar configurações salvas
    applySettings(storage);
});

// Verificar se o jogador já está em uma sala
async function checkActiveSession(roomManager) {
    try {
        const result = await roomManager.reconnectToRoom();
        
        if (result.success) {
            // Mostrar toast de reconexão
            showToast(`Reconectado à sala ${result.roomCode}`);
            
            // Redirecionar para a sala de espera ou jogo
            if (result.room.status === 'waiting') {
                // Atualizar interface da sala de espera
                updateWaitingRoom(result.room);
                showScreen('waiting-room-screen');
                
                // Iniciar observação da sala
                roomManager.observeRoom(result.roomCode, updateWaitingRoom);
            } else if (result.room.status === 'playing') {
                // Redirecionar para o jogo
                showScreen('game-screen');
                // Iniciar jogo ou reconectar
            }
        }
    } catch (error) {
        console.error("Erro ao verificar sessão ativa:", error);
    }
}

// Configurar listeners de eventos para todos os botões e interações
function setupEventListeners(roomManager) {
    console.log("Configurando event listeners...");
    
    // === NAVEGAÇÃO ENTRE TELAS ===
    
    // Menu Principal
    document.getElementById('play-local-btn').addEventListener('click', () => {
        console.log("Botão 'Jogar no Dispositivo' clicado");
        showScreen('local-game-screen');
    });
    
    document.getElementById('play-online-btn').addEventListener('click', () => {
        console.log("Botão 'Jogar Online' clicado");
        showScreen('online-options-screen');
    });
    
    document.getElementById('options-btn').addEventListener('click', () => {
        console.log("Botão 'Opções' clicado");
        showScreen('options-screen');
    });
    
    document.getElementById('rules-btn').addEventListener('click', () => {
        console.log("Botão 'Regras' clicado");
        showScreen('rules-screen');
    });
    
    // Botões de Voltar
    document.getElementById('back-from-local').addEventListener('click', () => {
        console.log("Voltando da tela local");
        showScreen('start-screen');
    });
    
    document.getElementById('back-from-online-options').addEventListener('click', () => {
        console.log("Voltando das opções online");
        showScreen('start-screen');
    });
    
    document.getElementById('back-from-create').addEventListener('click', () => {
        console.log("Voltando da criação de sala");
        showScreen('online-options-screen');
    });
    
    document.getElementById('back-from-join').addEventListener('click', () => {
        console.log("Voltando da tela de entrar em sala");
        showScreen('online-options-screen');
    });
    
    document.getElementById('back-from-rules').addEventListener('click', () => {
        console.log("Voltando das regras");
        showScreen('start-screen');
    });
    
    document.getElementById('back-from-options').addEventListener('click', () => {
        console.log("Voltando das opções");
        // Salvar configurações ao sair
        saveSettings();
        showScreen('start-screen');
    });
    
    // === CONFIGURAÇÃO DE JOGO LOCAL ===
    
    // Seleção de modo
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            console.log(`Modo ${card.dataset.mode} selecionado`);
            // Remover seleção anterior
            modeCards.forEach(c => c.classList.remove('selected'));
            // Adicionar seleção ao card clicado
            card.classList.add('selected');
        });
    });
    
    // Slider de número de jogadores
    const playerCountSlider = document.getElementById('player-count');
    const playerCountValue = document.getElementById('player-count-value');
    
    if (playerCountSlider && playerCountValue) {
        playerCountSlider.addEventListener('input', () => {
            playerCountValue.textContent = `${playerCountSlider.value} Jogadores`;
        });
    }
    
    // Iniciar jogo local
    document.getElementById('start-local-game-btn').addEventListener('click', () => {
        console.log("Iniciando jogo local");
        startLocalGame();
    });
    
    // === JOGOS ONLINE ===
    
    // Opções de jogo online
    document.getElementById('create-room-option').addEventListener('click', () => {
        console.log("Opção criar sala selecionada");
        showScreen('create-room-screen');
    });
    
    document.getElementById('join-room-option').addEventListener('click', () => {
        console.log("Opção entrar em sala selecionada");
        showScreen('join-room-screen');
    });
    
    // Criar sala
    document.getElementById('create-room-btn').addEventListener('click', async () => {
        console.log("Botão criar sala clicado");
        await createRoom(roomManager);
    });
    
    // Entrar em sala
    document.getElementById('join-room-btn').addEventListener('click', async () => {
        console.log("Botão entrar em sala clicado");
        await joinRoom(roomManager);
    });
    
    // Copiar código da sala
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        console.log("Botão copiar código clicado");
        copyRoomCode();
    });
    
    // Sair da sala
    document.getElementById('leave-room-btn').addEventListener('click', async () => {
        console.log("Botão sair da sala clicado");
        await leaveRoom(roomManager);
    });
    
    // Iniciar jogo online
    document.getElementById('start-game-btn').addEventListener('click', async () => {
        console.log("Botão iniciar jogo online clicado");
        await startOnlineGame(roomManager);
    });
    
    // === OPÇÕES ===
    
    // Toggle de modo escuro
    const darkModeToggle = document.getElementById('dark-mode');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            console.log("Modo escuro alterado:", e.target.checked);
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        });
    }
}

// Mostrar uma tela específica e esconder as outras
function showScreen(screenId) {
    console.log(`Mostrando tela: ${screenId}`);
    
    // Verificar se a tela existe
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
        console.error(`Tela não encontrada: ${screenId}`);
        return;
    }
    
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar a tela desejada
    targetScreen.classList.add('active');
}

// Mostrar notificação toast
function showToast(message, duration = 3000) {
    console.log(`Toast: ${message}`);
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Obter configurações de jogo do modo selecionado
function getGameSettings() {
    const selectedMode = document.querySelector('.mode-card.selected');
    
    if (!selectedMode) {
        showToast('Selecione um modo de jogo');
        return null;
    }
    
    const gameMode = selectedMode.dataset.mode;
    const playerCount = parseInt(document.getElementById('player-count').value);
    
    // Obter regras personalizadas
    const customRules = {
        stacking: document.getElementById('stacking').checked,
        jumpIn: document.getElementById('jump-in').checked,
        forcePlay: document.getElementById('force-play').checked,
        sevenTrade: document.getElementById('seven-trade').checked,
        zeroRotate: document.getElementById('zero-rotate').checked
    };
    
    return { gameMode, playerCount, customRules };
}

// Iniciar jogo local
function startLocalGame() {
    const settings = getGameSettings();
    
    if (!settings) return;
    
    console.log(`Iniciando jogo local: ${settings.gameMode} com ${settings.playerCount} jogadores`);
    showToast(`Iniciando jogo local no modo ${settings.gameMode} com ${settings.playerCount} jogadores`);
    
    // Simular carregamento do jogo
    setTimeout(() => {
        showScreen('game-screen');
        // Inicializar jogo local (código a ser implementado)
    }, 1000);
}

// Criar sala online
async function createRoom(roomManager) {
    const hostNameInput = document.getElementById('host-name');
    if (!hostNameInput) {
        console.error("Elemento 'host-name' não encontrado");
        return;
    }
    
    const hostName = hostNameInput.value.trim();
    
    if (!hostName) {
        showToast('Por favor, insira seu nome');
        return;
    }
    
    // Obter configurações da sala
    const gameModeSelect = document.getElementById('room-mode');
    const maxPlayersSelect = document.getElementById('max-players');
    
    if (!gameModeSelect || !maxPlayersSelect) {
        console.error("Elementos de configuração da sala não encontrados");
        return;
    }
    
    const gameMode = gameModeSelect.value;
    const maxPlayers = maxPlayersSelect.value;
    
    // Obter regras personalizadas
    const customRules = {
        stacking: document.getElementById('room-stacking')?.checked || false,
        jumpIn: document.getElementById('room-jump-in')?.checked || false,
        forcePlay: document.getElementById('room-force-play')?.checked || false,
        sevenTrade: document.getElementById('room-seven-trade')?.checked || false,
        zeroRotate: document.getElementById('room-zero-rotate')?.checked || false
    };
    
    // Mostrar indicador de carregamento
    showToast('Criando sala...');
    
    // Criar sala no Firebase
    try {
        const result = await roomManager.createRoom(hostName, gameMode, maxPlayers, customRules);
        
        if (result.success) {
            console.log(`Sala criada com sucesso: ${result.roomCode}`);
            // Iniciar observação da sala
            roomManager.observeRoom(result.roomCode, updateWaitingRoom);
            
            // Redirecionar para sala de espera
            showScreen('waiting-room-screen');
        } else {
            showToast(result.error || 'Erro ao criar sala');
        }
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        showToast('Erro ao criar sala. Tente novamente.');
    }
}

// Entrar em sala existente
async function joinRoom(roomManager) {
    const playerNameInput = document.getElementById('player-name');
    const roomCodeInput = document.getElementById('room-code');
    
    if (!playerNameInput || !roomCodeInput) {
        console.error("Elementos para entrar na sala não encontrados");
        return;
    }
    
    const playerName = playerNameInput.value.trim();
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    
    if (!playerName) {
        showToast('Por favor, insira seu nome');
        return;
    }
    
    if (!roomCode) {
        showToast('Por favor, insira o código da sala');
        return;
    }
    
    // Mostrar indicador de carregamento
    showToast('Entrando na sala...');
    
    // Entrar na sala
    try {
        const result = await roomManager.joinRoom(roomCode, playerName);
        
        if (result.success) {
            console.log(`Entrou na sala com sucesso: ${result.roomCode}`);
            // Iniciar observação da sala
            roomManager.observeRoom(result.roomCode, updateWaitingRoom);
            
            // Redirecionar para sala de espera
            showScreen('waiting-room-screen');
        } else {
            showToast(result.error || 'Erro ao entrar na sala');
        }
    } catch (error) {
        console.error("Erro ao entrar na sala:", error);
        showToast('Erro ao entrar na sala. Tente novamente.');
    }
}

// Atualizar interface da sala de espera
function updateWaitingRoom(roomData) {
    if (!roomData) {
        console.log("Dados da sala não disponíveis");
        return;
    }
    
    console.log("Atualizando sala de espera:", roomData);
    
    // Atualizar código da sala
    const roomCodeDisplay = document.getElementById('room-code-display');
    if (roomCodeDisplay) {
        roomCodeDisplay.textContent = roomData.code;
    }
    
    // Atualizar modo e contagem de jogadores
    const roomModeDisplay = document.getElementById('room-mode-display');
    if (roomModeDisplay) {
        roomModeDisplay.textContent = getModeName(roomData.gameMode);
    }
    
    const playerCount = Object.keys(roomData.players || {}).length;
    const roomPlayersCount = document.getElementById('room-players-count');
    if (roomPlayersCount) {
        roomPlayersCount.textContent = `${playerCount}/${roomData.maxPlayers}`;
    }
    
    // Atualizar lista de jogadores
    const playersList = document.getElementById('players-list');
    if (!playersList) {
        console.error("Lista de jogadores não encontrada");
        return;
    }
    
    playersList.innerHTML = '';
    
    const currentPlayerId = localStorage.getItem('unoPlayerId');
    
    // Converter objeto de jogadores em array para poder classificá-los
    let playersArray = Object.values(roomData.players || {});
    
    // Ordenar: host primeiro, depois por ordem de entrada
    playersArray.sort((a, b) => {
        if (a.isHost) return -1;
        if (b.isHost) return 1;
        return a.joinedAt - b.joinedAt;
    });
    
    // Adicionar jogadores à lista
    playersArray.forEach(player => {
        const li = document.createElement('li');
        
        // Destacar jogador atual
        if (player.id === currentPlayerId) {
            li.classList.add('current-player');
        }
        
        // Criar avatar com inicial do nome
        const avatar = document.createElement('div');
        avatar.className = 'player-avatar';
        avatar.textContent = player.name.charAt(0).toUpperCase();
        
        // Nome do jogador
        const name = document.createElement('span');
        name.className = 'player-name';
        name.textContent = player.name + (player.id === currentPlayerId ? ' (Você)' : '');
        
        li.appendChild(avatar);
        li.appendChild(name);
        
        // Badge de host
        if (player.isHost) {
            const hostBadge = document.createElement('span');
            hostBadge.className = 'host-badge';
            hostBadge.textContent = 'Anfitrião';
            li.appendChild(hostBadge);
        }
        
        playersList.appendChild(li);
    });
    
    // Mostrar/esconder botão de iniciar jogo
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        if (roomData.host === currentPlayerId) {
            startGameBtn.style.display = 'block';
            startGameBtn.disabled = playerCount < 2;
        } else {
            startGameBtn.style.display = 'none';
        }
    }
    
    // Atualizar mensagem de espera
    const waitingMessage = document.getElementById('waiting-message');
    if (waitingMessage) {
        if (playerCount < 2) {
            waitingMessage.style.display = 'block';
            const messageParagraph = waitingMessage.querySelector('p');
            if (messageParagraph) {
                messageParagraph.textContent = 'Aguardando jogadores entrarem na sala...';
            }
        } else if (roomData.host === currentPlayerId) {
            waitingMessage.style.display = 'block';
            const messageParagraph = waitingMessage.querySelector('p');
            if (messageParagraph) {
                messageParagraph.textContent = 'Você pode iniciar o jogo quando estiver pronto!';
            }
        } else {
            waitingMessage.style.display = 'block';
            const messageParagraph = waitingMessage.querySelector('p');
            if (messageParagraph) {
                messageParagraph.textContent = 'Aguardando o anfitrião iniciar o jogo...';
            }
        }
    }
}

// Sair da sala
async function leaveRoom(roomManager) {
    console.log("Saindo da sala...");
    // Mostrar indicador de carregamento
    showToast('Saindo da sala...');
    
    try {
        const result = await roomManager.leaveRoom();
        
        if (result.success) {
            console.log("Saiu da sala com sucesso");
            showScreen('online-options-screen');
        } else {
            showToast(result.error || 'Erro ao sair da sala');
        }
    } catch (error) {
        console.error("Erro ao sair da sala:", error);
        showToast('Erro ao sair da sala. Tente novamente.');
    }
}

// Iniciar jogo online
async function startOnlineGame(roomManager) {
    console.log("Iniciando jogo online...");
    // Mostrar indicador de carregamento
    showToast('Iniciando jogo...');
    
    try {
        const result = await roomManager.startGame();
        
        if (result.success) {
            console.log("Jogo iniciado com sucesso");
            showScreen('game-screen');
            // Inicializar jogo online (implementação adicional necessária)
        } else {
            showToast(result.error || 'Erro ao iniciar jogo');
        }
    } catch (error) {
        console.error("Erro ao iniciar jogo:", error);
        showToast('Erro ao iniciar jogo. Tente novamente.');
    }
}

// Copiar código da sala para a área de transferência
function copyRoomCode() {
    const roomCodeDisplay = document.getElementById('room-code-display');
    if (!roomCodeDisplay) {
        console.error("Elemento de código da sala não encontrado");
        return;
    }
    
    const roomCode = roomCodeDisplay.textContent;
    
    // Criar elemento temporário
    const temp = document.createElement('textarea');
    temp.value = roomCode;
    document.body.appendChild(temp);
    
    // Selecionar e copiar
    temp.select();
    document.execCommand('copy');
    
    // Remover elemento temporário
    document.body.removeChild(temp);
    
    showToast('Código copiado para a área de transferência!');
}

// Obter nome amigável do modo de jogo
function getModeName(mode) {
    const modeNames = {
        'normal': 'Normal',
        'wild': 'Wild',
        'no-mercy': 'No Mercy',
        'seven-zero': 'Seven-Zero'
    };
    
    return modeNames[mode] || mode;
}

// Aplicar configurações salvas
function applySettings(storage) {
    console.log("Aplicando configurações...");
    // Carregar configurações do localStorage
    const settings = storage ? storage.getSettings() : 
        JSON.parse(localStorage.getItem('unoSettings') || '{}');
    
    // Aplicar modo escuro se habilitado
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
    
    // Aplicar outras configurações
    const elements = {
        soundEffects: document.getElementById('sound-effects'),
        backgroundMusic: document.getElementById('background-music'),
        cardAnimation: document.getElementById('card-animation'),
        autoUno: document.getElementById('auto-uno'),
        turnTimer: document.getElementById('turn-timer')
    };
    
    for (const [key, element] of Object.entries(elements)) {
        if (element && settings[key] !== undefined) {
            element.checked = settings[key];
        }
    }
}

// Salvar configurações
function saveSettings() {
    console.log("Salvando configurações...");
    const settings = {
        darkMode: document.getElementById('dark-mode')?.checked || false,
        soundEffects: document.getElementById('sound-effects')?.checked || true,
        backgroundMusic: document.getElementById('background-music')?.checked || true,
        cardAnimation: document.getElementById('card-animation')?.checked || true,
        autoUno: document.getElementById('auto-uno')?.checked || false,
        turnTimer: document.getElementById('turn-timer')?.checked || true
    };
    
    localStorage.setItem('unoSettings', JSON.stringify(settings));
    showToast('Configurações salvas!');
}