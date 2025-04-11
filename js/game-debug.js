/**
 * Ferramentas de depuração para o jogo UNO
 * Última atualização: 2025-04-11 16:43:14
 * Desenvolvido por: Duduxindev
 */
class GameDebugger {
    constructor(game) {
        this.game = game;
        this.isDebugMode = false;
        this.logHistory = [];
        this.maxLogHistory = 100;
    }
    
    // Ativar/desativar modo de depuração
    toggleDebugMode() {
        this.isDebugMode = !this.isDebugMode;
        console.log(`Modo de depuração ${this.isDebugMode ? 'ativado' : 'desativado'}`);
        
        if (this.isDebugMode) {
            this.setupDebugInterface();
        } else {
            this.removeDebugInterface();
        }
        
        return this.isDebugMode;
    }
    
    // Configurar interface de depuração
    setupDebugInterface() {
        // Verificar se a interface já existe
        if (document.getElementById('debug-panel')) {
            return;
        }
        
        // Criar painel de depuração
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            max-height: 500px;
            background-color: rgba(0, 0, 0, 0.8);
            color: #fff;
            border-radius: 5px;
            padding: 10px;
            z-index: 9999;
            font-family: monospace;
            font-size: 12px;
            overflow-y: auto;
        `;
        
        // Cabeçalho do painel
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>UNO Debug Panel</strong>
                <button id="close-debug" style="background: none; border: none; color: white; cursor: pointer;">X</button>
            </div>
        `;
        
        // Controles de depuração
        const controls = document.createElement('div');
        controls.innerHTML = `
            <div style="margin-bottom: 10px;">
                <button id="show-all-cards" class="debug-btn">Ver Todas as Cartas</button>
                <button id="dump-game-state" class="debug-btn">Dump Estado</button>
                <button id="clear-logs" class="debug-btn">Limpar Logs</button>
            </div>
        `;
        
        // Área de logs
        const logArea = document.createElement('div');
        logArea.id = 'debug-log';
        logArea.style.cssText = `
            border-top: 1px solid #555;
            padding-top: 10px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        // Adicionar estilo para botões
        const style = document.createElement('style');
        style.textContent = `
            .debug-btn {
                background-color: #444;
                color: white;
                border: none;
                padding: 5px 8px;
                margin-right: 5px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            }
            .debug-btn:hover {
                background-color: #666;
            }
            .debug-log-entry {
                margin-bottom: 5px;
                border-bottom: 1px dotted #555;
                padding-bottom: 5px;
            }
            .debug-log-time {
                color: #aaa;
                font-size: 10px;
            }
        `;
        
        // Montar o painel
        debugPanel.appendChild(header);
        debugPanel.appendChild(controls);
        debugPanel.appendChild(logArea);
        document.head.appendChild(style);
        document.body.appendChild(debugPanel);
        
        // Adicionar eventos
        document.getElementById('close-debug').addEventListener('click', () => {
            this.toggleDebugMode();
        });
        
        document.getElementById('show-all-cards').addEventListener('click', () => {
            this.showAllCards();
        });
        
        document.getElementById('dump-game-state').addEventListener('click', () => {
            this.dumpGameState();
        });
        
        document.getElementById('clear-logs').addEventListener('click', () => {
            this.clearLogs();
        });
        
        // Adicionar eventos para o jogo
        this.setupGameListeners();
        
        // Mostrar estado inicial
        this.log('Modo de depuração ativado');
        this.logGameStatus();
    }
    
    // Remover interface de depuração
    removeDebugInterface() {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            document.body.removeChild(debugPanel);
        }
    }
    
    // Configurar listeners de eventos do jogo
    setupGameListeners() {
        if (!this.game || !this.game.addEventListener) {
            this.log('ERRO: Objeto game não possui método addEventListener');
            return;
        }
        
        // Eventos do jogo
        const events = [
            'cardPlayed', 'cardDrawn', 'turnChanged', 'unoCalled', 
            'unoPenalty', 'gameStarted', 'gameEnded', 'playerSkipped',
            'directionReversed', 'handSwapped', 'handsRotated', 'jumpIn'
        ];
        
        events.forEach(event => {
            this.game.addEventListener(event, (data) => {
                this.log(`Evento: ${event}`, data);
            });
        });
    }
    
    // Registrar mensagem no log
    log(message, data = null) {
        if (!this.isDebugMode) return;
        
        const time = new Date().toLocaleTimeString();
        const logEntry = { time, message, data };
        
        // Adicionar ao histórico
        this.logHistory.push(logEntry);
        
        // Limitar o tamanho do histórico
        if (this.logHistory.length > this.maxLogHistory) {
            this.logHistory.shift();
        }
        
        // Adicionar à interface
        const logArea = document.getElementById('debug-log');
        if (logArea) {
            const entryElement = document.createElement('div');
            entryElement.className = 'debug-log-entry';
            
            let content = `<span class="debug-log-time">[${time}]</span> ${message}`;
            
            if (data) {
                // Converter objetos para string JSON formatada e truncada
                let dataString = JSON.stringify(data, null, 2);
                if (dataString.length > 300) {
                    dataString = dataString.substring(0, 300) + '... (truncado)';
                }
                content += `<pre style="margin-top: 5px; font-size: 10px;">${dataString}</pre>`;
                
                // Log no console para debug avançado
                console.log(`[UNO Debug] ${message}`, data);
            }
            
            entryElement.innerHTML = content;
            logArea.appendChild(entryElement);
            
            // Scroll para o final
            logArea.scrollTop = logArea.scrollHeight;
        }
    }
    
    // Limpar logs
    clearLogs() {
        this.logHistory = [];
        const logArea = document.getElementById('debug-log');
        if (logArea) {
            logArea.innerHTML = '';
        }
        this.log('Logs limpos');
    }
    
    // Mostrar status atual do jogo
    logGameStatus() {
        if (!this.game) {
            this.log('ERRO: Objeto game não definido');
            return;
        }
        
        this.log('Status do Jogo', {
            gameStarted: this.game.gameStarted,
            gameEnded: this.game.gameEnded,
            currentPlayerIndex: this.game.currentPlayerIndex,
            direction: this.game.direction,
            playerCount: this.game.players.length,
            currentColor: this.game.currentColor,
            drawStack: this.game.drawStack,
            cardsInDeck: this.game.deck?.cards?.length || 0,
            cardsInDiscard: this.game.deck?.discardPile?.length || 0
        });
    }
    
    // Mostrar todas as cartas
    showAllCards() {
        if (!this.game) {
            this.log('ERRO: Objeto game não definido');
            return;
        }
        
        const playerCards = {};
        
        this.game.players.forEach(player => {
            playerCards[player.name] = player.hand.map(card => ({
                id: card.id,
                type: card.type,
                color: card.color,
                value: card.value
            }));
        });
        
        this.log('Cartas dos Jogadores', playerCards);
        
        // Mostrar carta do topo
        if (this.game.lastPlayedCard) {
            this.log('Carta do Topo', {
                id: this.game.lastPlayedCard.id,
                type: this.game.lastPlayedCard.type,
                color: this.game.lastPlayedCard.color,
                value: this.game.lastPlayedCard.value
            });
        }
    }
    
    // Exportar estado do jogo
    dumpGameState() {
        if (!this.game) {
            this.log('ERRO: Objeto game não definido');
            return;
        }
        
        const gameState = this.game.toJSON ? this.game.toJSON() : 'Método toJSON não implementado';
        
        this.log('Estado Completo do Jogo', gameState);
        
        // Copiar para a área de transferência
        const stateStr = JSON.stringify(gameState, null, 2);
        navigator.clipboard.writeText(stateStr).then(() => {
            this.log('Estado do jogo copiado para a área de transferência');
        }).catch(err => {
            this.log('Erro ao copiar para a área de transferência', err);
        });
        
        // Também salvar no console
        console.log('[UNO Debug] Estado completo do jogo:', gameState);
    }
    
    // Adicionar carta específica à mão do jogador (para testes)
    addCardToPlayer(playerId, cardType, cardColor, cardValue) {
        if (!this.game) {
            this.log('ERRO: Objeto game não definido');
            return false;
        }
        
        const player = this.game.getPlayerById(playerId);
        
        if (!player) {
            this.log(`ERRO: Jogador com ID ${playerId} não encontrado`);
            return false;
        }
        
        // Criar nova carta
        const card = new UnoCard(cardType, cardColor, cardValue);
        
        // Adicionar à mão do jogador
        player.addCard(card);
        
        this.log(`Carta adicionada ao jogador ${player.name}`, {
            card: {
                id: card.id,
                type: card.type,
                color: card.color,
                value: card.value
            }
        });
        
        return true;
    }
}

// Inicializar debugger com atalho de teclado
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+D para ativar/desativar depuração
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        if (window.gameDebugger) {
            window.gameDebugger.toggleDebugMode();
        } else if (window.game) {
            window.gameDebugger = new GameDebugger(window.game);
            window.gameDebugger.toggleDebugMode();
        } else {
            console.log('Objeto game não encontrado. Depuração não pode ser inicializada.');
        }
    }
});