/**
 * Aplicação Principal
 * Última atualização: 2025-04-11
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o gerenciador de salas
    const game = {
        roomManager: new RoomManager()
    };
    
    // Inicializa a interface do usuário
    const ui = new GameUI(game);
    
    // Mostra a tela inicial
    ui.showScreen('start');
    
    // Verifica se há uma sala salva para reconectar
    const storage = new GameStorage();
    const lastRoom = storage.getLastRoom();
    
    if (lastRoom) {
        // Perguntar se deseja reconectar
        const reconnect = confirm('Você tem um jogo em andamento. Deseja reconectar?');
        
        if (reconnect) {
            document.getElementById('room-code').value = lastRoom;
            ui.showScreen('joinGame');
        } else {
            storage.clearLastRoom();
        }
    }
    
    // Adiciona informações da versão
    addVersionInfo();
});

function addVersionInfo() {
    const versionInfo = document.createElement('div');
    versionInfo.className = 'version-info';
    versionInfo.textContent = 'v1.0.0 - Atualizado em 11/04/2025';
    versionInfo.style.position = 'fixed';
    versionInfo.style.bottom = '5px';
    versionInfo.style.right = '10px';
    versionInfo.style.fontSize = '0.7rem';
    versionInfo.style.opacity = '0.7';
    document.body.appendChild(versionInfo);
}

// Função para gerar cores aleatórias para cartas curingas
function getRandomColor() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Animações de cartas
function animateCard(cardElement, type) {
    if (type === 'play') {
        cardElement.classList.add('card-played');
        setTimeout(() => {
            cardElement.classList.remove('card-played');
        }, 500);
    } else if (type === 'draw') {
        cardElement.classList.add('card-drawn');
        setTimeout(() => {
            cardElement.classList.remove('card-drawn');
        }, 300);
    }
}