/**
 * Inicializador do Jogo UNO
 * Data: 2025-04-11 19:58:29
 * Desenvolvido por: Duduxindev
 */
class GameInitializer {
    constructor() {
        this.initialize();
    }
    
    initialize() {
        console.log("Inicializando componentes do jogo...");
        
        // Inicializar RoomManager se não existir
        if (!window.roomManager) {
            window.roomManager = new RoomManager();
            console.log("RoomManager inicializado");
        }
        
        // Inicializar ChatManager se não existir
        if (!window.chatManager) {
            window.chatManager = new ChatManager(window.roomManager);
            window.roomManager.setChatManager(window.chatManager);
            console.log("ChatManager inicializado");
        }
        
        // Inicializar GameStarter se a função existir
        if (window.initGameStarter && window.roomManager) {
            window.initGameStarter(window.roomManager);
            console.log("GameStarter inicializado");
        }
        
        // Adicionar event listeners para o botão de iniciar jogo
        this.setupStartGameButton();
        
        // Inicializar seletor de modos de jogo
        this.initializeModeSelector();
        
        console.log("Componentes do jogo inicializados com sucesso");
    }
    
    setupStartGameButton() {
        const startButton = document.getElementById('start-game-btn');
        if (startButton) {
            console.log("Configurando botão de iniciar jogo");
            
            // Remover event listeners existentes
            const newButton = startButton.cloneNode(true);
            if (startButton.parentNode) {
                startButton.parentNode.replaceChild(newButton, startButton);
            }
            
            // Adicionar novo event listener
            newButton.addEventListener('click', () => {
                console.log("Botão de iniciar jogo clicado");
                if (window.gameStarter) {
                    window.gameStarter.startGame();
                } else {
                    this.showError("GameStarter não inicializado, recarregue a página");
                }
            });
        }
    }
    
    initializeModeSelector() {
        const modeCards = document.querySelectorAll('.mode-card');
        const modeDescription = document.getElementById('mode-description');
        
        if (modeCards.length > 0) {
            console.log("Configurando seletor de modos de jogo");
            
            // Descrições dos modos
            const descriptions = {
                'normal': 'Modo clássico com regras originais do UNO.',
                'wild': 'Mais cartas especiais no baralho e regras de empilhamento.',
                'no-mercy': 'Permite empilhar cartas +2 e +4 sem limites, sem chance de desafio.',
                'seven-zero': 'Carta 7 permite trocar mãos com outro jogador, carta 0 faz todos rotacionarem suas mãos.',
                'extreme': 'Todas as regras especiais ativadas, incluindo cartas exclusivas de bloqueio e troca.',
                'speed': 'Jogo rápido com turnos de 15 segundos e apenas 5 cartas iniciais.',
                'chaos': 'Empilhamento, jump-in e regras caóticas que mudam a cada rodada.',
                'action-only': 'Apenas cartas de ação e especiais, sem cartas numéricas.'
            };
            
            // Adicionar eventos aos cards de modo
            modeCards.forEach(card => {
                card.addEventListener('click', () => {
                    // Remover seleção dos outros cards
                    modeCards.forEach(c => c.classList.remove('selected'));
                    
                    // Selecionar este card
                    card.classList.add('selected');
                    
                    // Atualizar descrição
                    const mode = card.dataset.mode;
                    if (modeDescription && descriptions[mode]) {
                        modeDescription.textContent = descriptions[mode];
                        modeDescription.classList.add('highlight');
                        setTimeout(() => {
                            modeDescription.classList.remove('highlight');
                        }, 500);
                    }
                });
            });
            
            // Selecionar o primeiro modo por padrão
            if (modeCards[0]) {
                modeCards[0].classList.add('selected');
                const defaultMode = modeCards[0].dataset.mode;
                if (modeDescription && descriptions[defaultMode]) {
                    modeDescription.textContent = descriptions[defaultMode];
                }
            }
        }
    }
    
    showError(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast show error';
            
            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        } else {
            alert(message);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.gameInitializer = new GameInitializer();
});