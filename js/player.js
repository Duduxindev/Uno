/**
 * Gerenciamento de Jogadores
 */
class Player {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.isAI = isAI;
        this.calledUno = false;
        this.stats = {
            cardsPlayed: 0,
            cardsDrawn: 0,
            specialCardsPlayed: 0,
            skipped: 0,
            uno: 0
        };
    }
    
    addCard(card) {
        this.hand.push(card);
        this.calledUno = false;
    }
    
    addCards(cards) {
        this.hand = [...this.hand, ...cards];
        this.calledUno = false;
        this.stats.cardsDrawn += cards.length;
    }
    
    playCard(cardId) {
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        
        if (cardIndex === -1) {
            return null;
        }
        
        const card = this.hand[cardIndex];
        this.hand.splice(cardIndex, 1);
        this.stats.cardsPlayed++;
        
        if (card.type === 'action' || card.type === 'wild') {
            this.stats.specialCardsPlayed++;
        }
        
        // Verificar se o jogador tem apenas uma carta e não chamou UNO
        if (this.hand.length === 1 && !this.calledUno) {
            // O jogador está em perigo de ser penalizado se não chamar UNO
        }
        
        return card;
    }
    
    callUno() {
        this.calledUno = true;
        this.stats.uno++;
    }
    
    gotSkipped() {
        this.stats.skipped++;
    }
    
    getPlayableCards(topCard, currentColor) {
        return this.hand.filter(card => card.canPlayOn(topCard, currentColor));
    }
    
    hasPlayableCard(topCard, currentColor) {
        return this.getPlayableCards(topCard, currentColor).length > 0;
    }
    
    hasCardType(type, value = null) {
        return this.hand.some(card => {
            if (value) {
                return card.type === type && card.value === value;
            }
            return card.type === type;
        });
    }
    
    getCardCount() {
        return this.hand.length;
    }
    
    sortHand() {
        // Ordena a mão por cor e valor
        this.hand.sort((a, b) => {
            // Primeiro, agrupar por cor
            if (a.color !== b.color) {
                // Colocamos as cartas pretas (curingas) no final
                if (a.color === 'black') return 1;
                if (b.color === 'black') return -1;
                
                // Ordem das cores: vermelho, amarelo, verde, azul
                const colorOrder = {red: 0, yellow: 1, green: 2, blue: 3};
                return colorOrder[a.color] - colorOrder[b.color];
            }
            
            // Depois, ordenamos por tipo
            if (a.type !== b.type) {
                const typeOrder = {number: 0, action: 1, wild: 2};
                return typeOrder[a.type] - typeOrder[b.type];
            }
            
            // Por fim, ordenamos por valor (para números)
            if (a.type === 'number') {
                return parseInt(a.value) - parseInt(b.value);
            }
            
            // Para cartas de ação, ordem: pular, inverter, +2
            if (a.type === 'action') {
                const actionOrder = {skip: 0, reverse: 1, draw2: 2};
                return actionOrder[a.value] - actionOrder[b.value];
            }
            
            // Para curingas, ordem: wild, wild-draw-four
            if (a.type === 'wild') {
                if (a.value === 'wild') return -1;
                if (b.value === 'wild') return 1;
                return 0;
            }
            
            return 0;
        });
    }
    
    // Método para IA jogar automaticamente
    playAI(game) {
        if (!this.isAI) return null;
        
        const topCard = game.deck.getTopCard();
        const currentColor = game.deck.currentColor;
        const playableCards = this.getPlayableCards(topCard, currentColor);
        
        // Se não tem cartas jogáveis, compra uma
        if (playableCards.length === 0) {
            return { action: 'draw' };
        }
        
        // Estratégia: priorizar cartas numéricas, depois ação, depois curinga
        let card = null;
        
        // Primeira tentativa: encontrar carta numérica da mesma cor
        card = playableCards.find(c => c.type === 'number' && c.color === currentColor);
        if (card) return { action: 'play', cardId: card.id };
        
        // Segunda tentativa: encontrar qualquer carta numérica
        card = playableCards.find(c => c.type === 'number');
        if (card) return { action: 'play', cardId: card.id };
        
        // Terceira tentativa: encontrar carta de ação da mesma cor
        card = playableCards.find(c => c.type === 'action' && c.color === currentColor);
        if (card) return { action: 'play', cardId: card.id };
        
        // Quarta tentativa: encontrar qualquer carta de ação
        card = playableCards.find(c => c.type === 'action');
        if (card) return { action: 'play', cardId: card.id };
        
        // Por fim, usa curinga se tiver
        card = playableCards.find(c => c.type === 'wild');
        if (card) {
            // Escolhe a cor mais comum em sua mão
            const colors = {red: 0, blue: 0, green: 0, yellow: 0};
            this.hand.forEach(c => {
                if (c.color !== 'black') {
                    colors[c.color]++;
                }
            });
            
            let chosenColor = 'red';
            let maxCount = 0;
            
            for (const [color, count] of Object.entries(colors)) {
                if (count > maxCount) {
                    maxCount = count;
                    chosenColor = color;
                }
            }
            
            return { 
                action: 'play', 
                cardId: card.id, 
                chosenColor: chosenColor 
            };
        }
        
        // Se chegar aqui, não tem jogada (não deveria acontecer)
        return { action: 'draw' };
    }
}