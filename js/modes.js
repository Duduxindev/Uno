/**
 * Modos de Jogo
 */
class GameMode {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.rules = {};
    }
    
    getRules() {
        return this.rules;
    }
    
    applyCardEffect(game, card, chosenColor = null) {
        // Lógica padrão para aplicar efeitos de cartas
        switch(card.value) {
            case 'skip':
                return this.applySkipEffect(game);
            case 'reverse':
                return this.applyReverseEffect(game);
            case 'draw2':
                return this.applyDraw2Effect(game);
            case 'wild':
                return this.applyWildEffect(game, chosenColor);
            case 'wild-draw-four':
                return this.applyWildDraw4Effect(game, chosenColor);
            default:
                return this.applyNumberEffect(game, card);
        }
    }
    
    applySkipEffect(game) {
        const nextPlayerId = game.getNextPlayerId();
        game.players[nextPlayerId].gotSkipped();
        game.advanceToNextPlayer(); // Avança uma vez mais para pular o próximo jogador
        return { skipped: nextPlayerId };
    }
    
    applyReverseEffect(game) {
        game.reverseDirection();
        
        // Em jogos de 2 jogadores, reverse funciona como skip
        if (game.players.length === 2) {
            game.advanceToNextPlayer(); // Pula o próximo jogador
            return { reversed: true, skipped: game.getNextPlayerId() };
        }
        
        return { reversed: true };
    }
    
    applyDraw2Effect(game) {
        const nextPlayerId = game.getNextPlayerId();
        const drawnCards = game.deck.drawCards(2);
        game.players[nextPlayerId].addCards(drawnCards);
        game.players[nextPlayerId].gotSkipped();
        game.advanceToNextPlayer(); // Pula o jogador que comprou
        return { playerDrawn: nextPlayerId, count: 2 };
    }
    
    applyWildEffect(game, chosenColor) {
        if (!chosenColor) {
            throw new Error("Uma cor deve ser escolhida para curinga");
        }
        return { colorChanged: chosenColor };
    }
    
    applyWildDraw4Effect(game, chosenColor) {
        if (!chosenColor) {
            throw new Error("Uma cor deve ser escolhida para curinga +4");
        }
        
        const nextPlayerId = game.getNextPlayerId();
        const drawnCards = game.deck.drawCards(4);
        game.players[nextPlayerId].addCards(drawnCards);
        game.players[nextPlayerId].gotSkipped();
        game.advanceToNextPlayer(); // Pula o jogador que comprou
        
        return { 
            colorChanged: chosenColor, 
            playerDrawn: nextPlayerId, 
            count: 4 
        };
    }
    
    applyNumberEffect(game, card) {
        // Cartas numéricas não têm efeito especial no modo normal
        return { number: card.value };
    }
}

class NormalMode extends GameMode {
    constructor() {
        super('normal', 'Regras padrão do UNO.');
        
        this.rules = {
            stacking: false,              // Não permite empilhar +2/+4
            forcePlay: false,             // Não força jogar a carta comprada
            jumpIn: false,                // Não permite jump-in
            sevenZero: false,             // Sem regras especiais para 7 e 0
            drawToMatch: true             // Compra até encontrar uma carta jogável
        };
    }
}

class WildMode extends GameMode {
    constructor() {
        super('wild', 'Mais cartas especiais no baralho.');
        
        this.rules = {
            stacking: false,
            forcePlay: false,
            jumpIn: false,
            sevenZero: false,
            drawToMatch: true
        };
    }
}

class NoMercyMode extends GameMode {
    constructor() {
        super('no-mercy', 'Sem limitações para cartas +2 e +4, possibilitando grandes sequências.');
        
        this.rules = {
            stacking: true,               // Permite empilhar +2/+4
            forcePlay: false,
            jumpIn: false,
            sevenZero: false,
            drawToMatch: true
        };
    }
    
    applyDraw2Effect(game) {
        // Verifica se o próximo jogador tem um +2 para empilhar
        const nextPlayerId = game.getNextPlayerId();
        const nextPlayer = game.players[nextPlayerId];
        
        if (this.rules.stacking && nextPlayer.hasCardType('action', 'draw2')) {
            // Não faz nada agora, permite que o próximo jogador empilhe
            game.drawStack = (game.drawStack || 0) + 2;
            return { stacked: true, drawStack: game.drawStack };
        } else if (game.drawStack) {
            // Se já havia um stack, o jogador deve comprar todas as cartas acumuladas
            const drawnCards = game.deck.drawCards(game.drawStack + 2);
            nextPlayer.addCards(drawnCards);
            nextPlayer.gotSkipped();
            game.advanceToNextPlayer();
            
            const stackTotal = game.drawStack + 2;
            game.drawStack = 0; // Reseta o stack
            
            return { playerDrawn: nextPlayerId, count: stackTotal };
        } else {
            // Comportamento normal: próximo jogador compra 2 cartas
            return super.applyDraw2Effect(game);
        }
    }
    
    applyWildDraw4Effect(game, chosenColor) {
        if (!chosenColor) {
            throw new Error("Uma cor deve ser escolhida para curinga +4");
        }
        
        // Verifica se o próximo jogador tem um +4 para empilhar
        const nextPlayerId = game.getNextPlayerId();
        const nextPlayer = game.players[nextPlayerId];
        
        if (this.rules.stacking && nextPlayer.hasCardType('wild', 'wild-draw-four')) {
            // Não faz nada agora, permite que o próximo jogador empilhe
            game.drawStack = (game.drawStack || 0) + 4;
            return { 
                colorChanged: chosenColor, 
                stacked: true, 
                drawStack: game.drawStack 
            };
        } else if (game.drawStack) {
            // Se já havia um stack, o jogador deve comprar todas as cartas acumuladas
            const drawnCards = game.deck.drawCards(game.drawStack + 4);
            nextPlayer.addCards(drawnCards);
            nextPlayer.gotSkipped();
            game.advanceToNextPlayer();
            
            const stackTotal = game.drawStack + 4;
            game.drawStack = 0; // Reseta o stack
            
            return { 
                colorChanged: chosenColor, 
                playerDrawn: nextPlayerId, 
                count: stackTotal 
            };
        } else {
            // Comportamento normal: próximo jogador compra 4 cartas
            return super.applyWildDraw4Effect(game, chosenColor);
        }
    }
}

class ProgressiveMode extends GameMode {
    constructor() {
        super('progressive', 'Cartas +2 e +4 podem ser empilhadas, acumulando o efeito.');
        
        this.rules = {
            stacking: true,
            forcePlay: true,              // Força jogar carta comprada quando possível
            jumpIn: false,
            sevenZero: false,
            drawToMatch: true
        };
    }
    
    // Usa mesma lógica de empilhamento do NoMercyMode
    applyDraw2Effect(game) {
        return NoMercyMode.prototype.applyDraw2Effect.call(this, game);
    }
    
    applyWildDraw4Effect(game, chosenColor) {
        return NoMercyMode.prototype.applyWildDraw4Effect.call(this, game, chosenColor);
    }
}

class SevenZeroMode extends GameMode {
    constructor() {
        super('seven-zero', 'A carta 7 faz trocar mãos com outro jogador e a carta 0 faz todos passarem suas mãos.');
        
        this.rules = {
            stacking: false,
            forcePlay: false,
            jumpIn: false,
            sevenZero: true,              // Regras especiais para 7 e 0
            drawToMatch: true
        };
    }
    
    applyNumberEffect(game, card) {
        if (this.rules.sevenZero) {
            if (card.value === '7') {
                return this.applySevenEffect(game);
            } else if (card.value === '0') {
                return this.applyZeroEffect(game);
            }
        }
        
        return super.applyNumberEffect(game, card);
    }
    
    applySevenEffect(game) {
        // O jogador atual troca as cartas com outro jogador de sua escolha
        return { specialNumber: '7', requiresPlayerChoice: true };
    }
    
    applyZeroEffect(game) {
        // Todos os jogadores passam suas mãos no sentido do jogo
        const hands = game.players.map(player => [...player.hand]);
        
        if (game.direction === 1) {
            // Sentido horário
            const firstHand = hands.shift();
            hands.push(firstHand);
        } else {
            // Sentido anti-horário
            const lastHand = hands.pop();
            hands.unshift(lastHand);
        }
        
        // Atribui as novas mãos aos jogadores
        game.players.forEach((player, index) => {
            player.hand = hands[index];
        });
        
        return { specialNumber: '0', handsRotated: true };
    }
}

class CustomMode extends GameMode {
    constructor(customRules) {
        super('custom', 'Modo de jogo personalizado com regras customizadas.');
        
        this.rules = {
            stacking: customRules.stacking || false,
            forcePlay: customRules.forcePlay || false,
            jumpIn: customRules.jumpIn || false,
            sevenZero: customRules.sevenZero || false,
            drawToMatch: true
        };
    }
    
    applyDraw2Effect(game) {
        if (this.rules.stacking) {
            return NoMercyMode.prototype.applyDraw2Effect.call(this, game);
        }
        return super.applyDraw2Effect(game);
    }
    
    applyWildDraw4Effect(game, chosenColor) {
        if (this.rules.stacking) {
            return NoMercyMode.prototype.applyWildDraw4Effect.call(this, game, chosenColor);
        }
        return super.applyWildDraw4Effect(game, chosenColor);
    }
    
    applyNumberEffect(game, card) {
        if (this.rules.sevenZero) {
            return SevenZeroMode.prototype.applyNumberEffect.call(this, game, card);
        }
        return super.applyNumberEffect(game, card);
    }
}

// Factory para criar o modo adequado
function createGameMode(mode, customRules = {}) {
    switch(mode) {
        case 'normal':
            return new NormalMode();
        case 'wild':
            return new WildMode();
        case 'no-mercy':
            return new NoMercyMode();
        case 'progressive':
            return new ProgressiveMode();
        case 'seven-zero':
            return new SevenZeroMode();
        case 'custom':
            return new CustomMode(customRules);
        default:
            return new NormalMode();
    }
}