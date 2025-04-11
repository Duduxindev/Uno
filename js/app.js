/**
 * Aplicação Principal - UNO Game
 * Última atualização: 2025-04-11 16:21:47
 * Desenvolvido por: Duduxindev
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar gerenciadores
    const roomManager = new RoomManager();
    
    // Verificar se há uma sessão ativa
    checkActiveSession(roomManager);
    
    // Configurar listeners de eventos
    setupEventListeners(roomManager);
    
    // Aplicar configurações salvas
    applySettings();
});

// Verificar se o jogador já está em uma sala
async function checkActiveSession(roomManager) {
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
            // Iniciar jogo ou reconectar (implementação adicional necessária)
        }
    }
}

// Configurar listeners de eventos para todos os botões e interações
function setupEventListeners(roomManager) {
    // === NAVEGAÇÃO ENTRE TELAS ===
    
    // Menu Principal
    document.getElementById('play-local-btn').addEventListener('click', () => {
        showScreen('local-game-screen');
    });
    
    document.getElementById('play-online-btn').addEventListener('click', () => {
        showScreen('online-options-screen');
    });
    
    document.getElementById('options-btn').addEventListener('click', () => {
        showScreen('options-screen');
    });
    
    document.getElementById('rules-btn').addEventListener('click', () => {
        showScreen('rules-screen');
    });
    
    // Botões de Voltar
    document.getElementById('back-from-local').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    document.getElementById('back-from-online-options').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    document.getElementById('back-from-create').addEventListener('click', () => {
        showScreen('online-options-screen');
    });
    
    document.getElementById('back-from-join').addEventListener('click', () => {
        showScreen('online-options-screen');
    });
    
    document.getElementById('back-from-rules').addEventListener('click', () => {
        showScreen('start-screen');
    });
    
    document.getElementById('back-from-options').addEventListener('click', () => {
        // Salvar configurações ao sair
        saveSettings();
        showScreen('start-screen');
    });
    
    // === CONFIGURAÇÃO DE JOGO LOCAL ===
    
    // Seleção de modo
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remover seleção anterior
            modeCards.forEach(c => c.classList.remove('selected'));
            // Adicionar seleção ao card clicado
            card.classList.add('selected');
        });
    });
    
    // Slider de número de jogadores
    const playerCountSlider = document.getElementById('player-count');
    const playerCountValue = document.getElementById('player-count-value');
    
    playerCountSlider.addEventListener('input', () => {
        playerCountValue.textContent = `${playerCountSlider.value} Jogadores`;
    });
    
    // Iniciar jogo local
    document.getElementById('start-local-game-btn').addEventListener('click', () => {
        startLocalGame();
    });
    
    // === JOGOS ONLINE ===
    
    // Opções de jogo online
    document.getElementById('create-room-option').addEventListener('click', () => {
        showScreen('create-room-screen');
    });
    
    document.getElementById('join-room-option').addEventListener('click', () => {
        showScreen('join-room-screen');
    });
    
    // Criar sala
    document.getElementById('create-room-btn').addEventListener('click', async () => {
        await createRoom(roomManager);
    });
    
    // Entrar em sala
    document.getElementById('join-room-btn').addEventListener('click', async () => {
        await joinRoom(roomManager);
    });
    
    // Copiar código da sala
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        copyRoomCode();
    });
    
    // Sair da sala
    document.getElementById('leave-room-btn').addEventListener('click', async () => {
        await leaveRoom(roomManager);
    });
    
    // Iniciar jogo online
    document.getElementById('start-game-btn').addEventListener('click', async () => {
        await startOnlineGame(roomManager);
    });
    
    // === OPÇÕES ===
    
    // Toggle de modo escuro
    document.getElementById('dark-mode').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });
}

// Mostrar uma tela específica e esconder as outras
function showScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar a tela desejada
    document.getElementById(screenId).classList.add('active');
}

// Mostrar notificação toast
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
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
    
    // Aqui você integraria a lógica do jogo local
    // Este é um stub para demonstração
    showToast(`Iniciando jogo local no modo ${settings.gameMode} com ${settings.playerCount} jogadores`);
    
    // Simular carregamento do jogo
    setTimeout(() => {
        showScreen('game-screen');
        // Inicializar jogo local (código não incluído nesta demonstração)
    }, 1000);
}

// Criar sala online
async function createRoom(roomManager) {
    const hostName = document.getElementById('host-name').value.trim();
    
    if (!hostName) {
        showToast('Por favor, insira seu nome');
        return;
    }
    
    // Obter configurações da sala
    const gameMode = document.getElementById('room-mode').value;
    const maxPlayers = document.getElementById('max-players').value;
    
    // Obter regras personalizadas
    const customRules = {
        stacking: document.getElementById('room-stacking').checked,
        jumpIn: document.getElementById('room-jump-in').checked,
        forcePlay: document.getElementById('room-force-play').checked,
        sevenTrade: document.getElementById('room-seven-trade').checked,
        zeroRotate: document.getElementById('room-zero-rotate').checked
    };
    
    // Mostrar indicador de carregamento
    showToast('Criando sala...');
    
    // Criar sala no Firebase
    const result = await roomManager.createRoom(hostName, gameMode, maxPlayers, customRules);
    
    if (result.success) {
        // Iniciar observação da sala
        roomManager.observeRoom(result.roomCode, updateWaitingRoom);
        
        // Redirecionar para sala de espera
        showScreen('waiting-room-screen');
    } else {
        showToast(result.error || 'Erro ao criar sala');
    }
}

// Entrar em sala existente
async function joinRoom(roomManager) {
    const playerName = document.getElementById('player-name').value.trim();
    const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
    
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
    const result = await roomManager.joinRoom(roomCode, playerName);
    
    if (result.success) {
        // Iniciar observação da sala
        roomManager.observeRoom(result.roomCode, updateWaitingRoom);
        
        // Redirecionar para sala de espera
        showScreen('waiting-room-screen');
    } else {
        showToast(result.error || 'Erro ao entrar na sala');
    }
}

// Atualizar interface da sala de espera
function updateWaitingRoom(roomData) {
    if (!roomData) return;
    
    // Atualizar código da sala
    document.getElementById('room-code-display').textContent = roomData.code;
    
    // Atualizar modo e contagem de jogadores
    document.getElementById('room-mode-display').textContent = getModeName(roomData.gameMode);
    
    const playerCount = Object.keys(roomData.players || {}).length;
    document.getElementById('room-players-count').textContent = `${playerCount}/${roomData.maxPlayers}`;
    
    // Atualizar lista de jogadores
    const playersList = document.getElementById('players-list');
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
    
    if (roomData.host === currentPlayerId) {
        startGameBtn.style.display = 'block';
        startGameBtn.disabled = playerCount < 2;
    } else {
        startGameBtn.style.display = 'none';
    }
    
    // Atualizar mensagem de espera
    const waitingMessage = document.getElementById('waiting-message');
    if (playerCount < 2) {
        waitingMessage.style.display = 'block';
        waitingMessage.querySelector('p').textContent = 'Aguardando jogadores entrarem na sala...';
    } else if (roomData.host === currentPlayerId) {
        waitingMessage.style.display = 'block';
        waitingMessage.querySelector('p').textContent = 'Você pode iniciar o jogo quando estiver pronto!';
    } else {
        waitingMessage.style.display = 'block';
        waitingMessage.querySelector('p').textContent = 'Aguardando o anfitrião iniciar o jogo...';
    }
}

// Sair da sala
async function leaveRoom(roomManager) {
    // Mostrar indicador de carregamento
    showToast('Saindo da sala...');
    
    const result = await roomManager.leaveRoom();
    
    if (result.success) {
        showScreen('online-options-screen');
    } else {
        showToast(result.error || 'Erro ao sair da sala');
    }
}

// Iniciar jogo online
async function startOnlineGame(roomManager) {
    // Mostrar indicador de carregamento
    showToast('Iniciando jogo...');
    
    const result = await roomManager.startGame();
    
    if (result.success) {
        showScreen('game-screen');
        // Inicializar jogo online (código não incluído nesta demonstração)
    } else {
        showToast(result.error || 'Erro ao iniciar jogo');
    }
}

// Copiar código da sala para a área de transferência
function copyRoomCode() {
    const roomCode = document.getElementById('room-code-display').textContent;
    
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
function applySettings() {
    // Carregar configurações do localStorage
    const settings = JSON.parse(localStorage.getItem('unoSettings') || '{}');
    
    // Aplicar modo escuro se habilitado
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode').checked = true;
    }
    
    // Aplicar outras configurações aos elementos da interface
    if (settings.soundEffects !== undefined) {
        document.getElementById('sound-effects').checked = settings.soundEffects;
    }
    
    if (settings.backgroundMusic !== undefined) {
        document.getElementById('background-music').checked = settings.backgroundMusic;
    }
    
    if (settings.cardAnimation !== undefined) {
        document.getElementById('card-animation').checked = settings.cardAnimation;
    }
    
    if (settings.autoUno !== undefined) {
        document.getElementById('auto-uno').checked = settings.autoUno;
    }
    
    if (settings.turnTimer !== undefined) {
        document.getElementById('turn-timer').checked = settings.turnTimer;
    }
}

// Salvar configurações
function saveSettings() {
    const settings = {
        darkMode: document.getElementById('dark-mode').checked,
        soundEffects: document.getElementById('sound-effects').checked,
        backgroundMusic: document.getElementById('background-music').checked,
        cardAnimation: document.getElementById('card-animation').checked,
        autoUno: document.getElementById('auto-uno').checked,
        turnTimer: document.getElementById('turn-timer').checked
    };
    
    localStorage.setItem('unoSettings', JSON.stringify(settings));
    showToast('Configurações salvas!');
}