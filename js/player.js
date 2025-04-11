/**
 * Classe do Jogador
 * Última atualização: 2025-04-11 16:26:03
 * Desenvolvido por: Duduxindev
 */
class Player {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.isAI = isAI;
        this.isHost = false;
        this.isReady = true;
        this.hasCalledUno = false;
        this.stats = {
            cardsPlayed: 0,
            specialCardsPlayed: 0,
            cardsDrawn: 0,
            uno: 0
        };
    }
    
    // Adicionar carta à mão
    addCard(card) {
        this.hand.push(card);
        // Resetar status de UNO se o jogador tiver mais de uma carta
        if (this.hand.length > 1) {
            this.hasCalledUno = false;
        }
    }
    
    // Adicionar várias cartas à mão
    addCards(cards) {
        this.hand = [...this.hand, ...cards];
        // Resetar status de UNO se o jogador tiver mais de uma carta
        if (this.hand.length > 1) {
            this.hasCalledUno = false;
        }
    }
    
    // Remover carta da mão
    removeCard(cardId) {
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            const card = this.hand[cardIndex];
            this.hand.splice(cardIndex, 1);
            
            // Atualizar estatísticas
            this.stats.cardsPlayed++;
            if (card.type !== 'number') {
                this.stats.specialCardsPlayed++;
            }
            
            return card;
        }
        return null;
    }
    
    // Verificar se o jogador tem determinada carta
    hasCard(cardId) {
        return this.hand.some(card => card.id === cardId);
    }
    
    // Obter número de cartas na mão
    getCardCount() {
        return this.hand.length;
    }
    
    // Chamar UNO
    callUno() {
        if (this.hand.length === 1) {
            this.hasCalledUno = true;
            this.stats.uno++;
            return true;
        }
        return false;
    }
    
    // Verificar cartas jogáveis
    getPlayableCards(topCard, currentColor, gameRules) {
        return this.hand.filter(card => {
            // Curingas sempre podem ser jogados
            if (card.type === 'wild') {
                return true;
            }
            
            // Mesma cor
            if (card.color === currentColor) {
                return true;
            }
            
            // Mesmo valor/símbolo
            if (topCard && card.value === topCard.value) {
                return true;
            }
            
            // Regra de Jump-In (carta idêntica)
            if (gameRules && gameRules.jumpIn && 
                topCard && card.color === topCard.color && card.value === topCard.value) {
                return true;
            }
            
            return false;
        });
    }
    
    // Limpar mão (para começar um novo jogo)
    clearHand() {
        this.hand = [];
        this.hasCalledUno = false;
    }
    
    // Trocar mão com outro jogador (regra do 7)
    swapHandWith(otherPlayer) {
        const tempHand = this.hand;
        this.hand = otherPlayer.hand;
        otherPlayer.hand = tempHand;
        
        // Resetar status de UNO para ambos os jogadores
        this.hasCalledUno = false;
        otherPlayer.hasCalledUno = false;
    }
    
    // Serializar jogador para armazenamento/transferência
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            handCount: this.hand.length,
            isAI: this.isAI,
            isHost: this.isHost,
            isReady: this.isReady,
            hasCalledUno: this.hasCalledUno,
            stats: { ...this.stats }
        };
    }
    
    // Versão simplificada para outros jogadores (sem mostrar as cartas)
    toPublicJSON() {
        return {
            id: this.id,
            name: this.name,
            cardCount: this.hand.length,
            isAI: this.isAI,
            isHost: this.isHost,
            isReady: this.isReady,
            hasCalledUno: this.hasCalledUno
        };
    }
}