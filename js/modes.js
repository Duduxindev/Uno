/**
 * Implementação dos modos de jogo UNO
 * Última atualização: 2025-04-11 16:40:23
 * Desenvolvido por: Duduxindev
 */
class GameMode {
    constructor(name, options = {}) {
        this.name = name;
        this.options = this.getDefaultOptions();
        
        // Aplicar opções fornecidas
        for (const [key, value] of Object.entries(options)) {
            if (this.options.hasOwnProperty(key)) {
                this.options[key] = value;
            }
        }
    }
    
    // Opções padrão para todos os modos
    getDefaultOptions() {
        return {
            stacking: false,        // Permitir empilhar cartas +2 e +4
            jumpIn: false,          // Permitir jogar cartas idênticas fora do turno
            forcePlay: false,       // Forçar a jogar a carta comprada se possível
            sevenTrade: false,      // Trocar mãos ao jogar um 7
            zeroRotate: false,      // Rotacionar mãos ao jogar um 0
            drawToMatch: true,      // Comprar até encontrar uma carta jogável
            challengePlus4: true,   // Permitir desafiar cartas +4
            timeLimit: 30,          // Tempo limite para jogar (em segundos)
            maxDrawCount: 1         // Número máximo de cartas que podem ser compradas por turno
        };
    }
    
    // Verificar se uma regra está ativa
    isRuleActive(ruleName) {
        return this.options[ruleName] === true;
    }
    
    // Aplicar efeitos das cartas especiais
    applyCardEffect(game, card, chosenColor = null) {
        // Definir a cor para curinga
        if (card.type === 'wild') {
            game.currentColor = chosenColor || game.currentColor;
        } else {
            game.currentColor = card.color;
        }
        
        // Efeitos de cartas
        switch (card.value) {
            case 'skip':
                // Pular o próximo jogador
                game.skipNextPlayer();
                break;
                
            case 'reverse':
                // Inverter a direção do jogo
                game.reverseDirection();
                
                // Em jogos de 2 jogadores, funciona como Skip
                if (game.players.length === 2) {
                    game.skipNextPlayer();
                }
                break;
                
            case 'draw2':
                // Próximo jogador compra 2 cartas e perde a vez
                if (this.options.stacking && game.checkNextPlayerHasDraw2()) {
                    // Em modo de empilhamento, permite que o próximo jogador responda com outra carta +2
                    game.drawStack += 2;
                } else {
                    // Próximo jogador compra 2 cartas
                    game.nextPlayerDrawCards(2);
                    game.skipNextPlayer();
                }
                break;
                
            case 'wild-draw-four':
                // Próximo jogador compra 4 cartas e perde a vez
                if (this.options.stacking && game.checkNextPlayerHasDraw4()) {
                    // Em modo de empilhamento, permite que o próximo jogador responda com outra carta +4
                    game.drawStack += 4;
                } else {
                    // Próximo jogador compra 4 cartas
                    game.nextPlayerDrawCards(4);
                    game.skipNextPlayer();
                }
                break;
                
            case '7':
                // Regra do Seven: Trocar mãos com outro jogador
                if (this.options.sevenTrade) {
                    // Implementação da troca de mãos fica no jogo
                    game.handleSevenTrade();
                }
                break;
                
            case '0':
                // Regra do Zero: Rotacionar todas as mãos
                if (this.options.zeroRotate) {
                    // Implementação da rotação de mãos fica no jogo
                    game.handleZeroRotate();
                }
                break;
        }
    }
    
    // Serializar para armazenamento/transferência
    toJSON() {
        return {
            name: this.name,
            options: { ...this.options }
        };
    }
    
    // Criar modo de jogo a partir de objeto serializado
    static fromJSON(data) {
        return new GameMode(data.name, data.options);
    }
}

// Modos de jogo pré-definidos
class GameModes {
    static getNormalMode() {
        return new GameMode('normal', {
            stacking: false,
            jumpIn: false,
            forcePlay: false,
            sevenTrade: false,
            zeroRotate: false
        });
    }
    
    static getWildMode() {
        return new GameMode('wild', {
            stacking: true,
            jumpIn: true,
            forcePlay: true,
            sevenTrade: false,
            zeroRotate: false
        });
    }
    
    static getNoMercyMode() {
        return new GameMode('no-mercy', {
            stacking: true,
            jumpIn: false,
            forcePlay: true,
            sevenTrade: false,
            zeroRotate: false,
            challengePlus4: false
        });
    }
    
    static getSevenZeroMode() {
        return new GameMode('seven-zero', {
            stacking: false,
            jumpIn: false,
            forcePlay: false,
            sevenTrade: true,
            zeroRotate: true
        });
    }
    
    static getCustomMode(options) {
        return new GameMode('custom', options);
    }
    
    static getModeByName(name, customOptions = {}) {
        switch (name) {
            case 'normal':
                return this.getNormalMode();
            case 'wild':
                return this.getWildMode();
            case 'no-mercy':
                return this.getNoMercyMode();
            case 'seven-zero':
                return this.getSevenZeroMode();
            case 'custom':
                return this.getCustomMode(customOptions);
            default:
                return this.getNormalMode();
        }
    }
}