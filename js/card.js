/**
 * Implementação das Cartas UNO
 * Última atualização: 2025-04-11 16:14:10
 * Desenvolvido por: Duduxindev
 */
class UnoCard {
    constructor(type, color, value) {
        this.type = type;      // 'number', 'action', 'wild'
        this.color = color;    // 'red', 'blue', 'green', 'yellow', 'black'
        this.value = value;    // '0'-'9', 'skip', 'reverse', 'draw2', 'wild', 'wild-draw-four'
        this.id = `${color}-${value}-${Math.random().toString(36).substring(2, 8)}`;
    }
    
    // Verificar se a carta pode ser jogada sobre outra
    canPlayOn(topCard, currentColor) {
        // Wild cards podem ser jogadas em qualquer situação
        if (this.type === 'wild') {
            return true;
        }
        
        // Se a cor da carta for a mesma da cor atual
        if (this.color === currentColor) {
            return true;
        }
        
        // Se o valor da carta for o mesmo da carta de topo
        if (this.value === topCard.value) {
            return true;
        }
        
        return false;
    }
    
    // Renderizar a carta na interface
    render(faceUp = true) {
        const card = document.createElement('div');
        card.className = `card ${this.color}`;
        card.dataset.id = this.id;
        card.dataset.type = this.type;
        card.dataset.value = this.value;
        card.dataset.color = this.color;
        
        if (faceUp) {
            // Renderiza frente da carta
            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';
            
            if (this.type === 'number') {
                // Carta numérica
                const cardValue = document.createElement('div');
                cardValue.className = 'card-value';
                cardValue.textContent = this.value;
                cardInner.appendChild(cardValue);
            } else {
                // Carta especial
                let symbol = '';
                
                switch(this.value) {
                    case 'skip':
                        symbol = '⊘';
                        break;
                    case 'reverse':
                        symbol = '⇄';
                        break;
                    case 'draw2':
                        symbol = '+2';
                        break;
                    case 'wild':
                        symbol = '★';
                        break;
                    case 'wild-draw-four':
                        symbol = '+4';
                        break;
                }
                
                const cardSymbol = document.createElement('div');
                cardSymbol.className = 'card-symbol';
                cardSymbol.textContent = symbol;
                cardInner.appendChild(cardSymbol);
            }
            
            // Adiciona reflexo
            const cardReflection = document.createElement('div');
            cardReflection.className = 'card-reflection';
            cardInner.appendChild(cardReflection);
            
            card.appendChild(cardInner);
        } else {
            // Renderiza verso da carta
            card.classList.add('card-back');
            
            const cardPattern = document.createElement('div');
            cardPattern.className = 'card-back-pattern';
            
            const cardBackLogo = document.createElement('div');
            cardBackLogo.className = 'card-back-logo';
            cardBackLogo.textContent = 'UNO';
            
            card.appendChild(cardPattern);
            card.appendChild(cardBackLogo);
        }
        
        return card;
    }
    
    // Serializar a carta para armazenamento/transferência
    toJSON() {
        return {
            type: this.type,
            color: this.color,
            value: this.value,
            id: this.id
        };
    }
    
    // Criar carta a partir de objeto serializado
    static fromJSON(data) {
        const card = new UnoCard(data.type, data.color, data.value);
        card.id = data.id;
        return card;
    }
}

class UnoDeck {
    constructor(gameMode = 'normal') {
        this.cards = [];
        this.discardPile = [];
        this.currentColor = null;
        this.gameMode = gameMode;
        this.initDeck();
    }
    
    // Inicializar o baralho com todas as cartas
    initDeck() {
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Adicionar cartas numéricas (0-9)
        for (let color of colors) {
            // Cada cor tem apenas um '0'
            this.cards.push(new UnoCard('number', color, '0'));
            
            // E duas cartas de 1-9
            for (let i = 1; i <= 9; i++) {
                this.cards.push(new UnoCard('number', color, i.toString()));
                this.cards.push(new UnoCard('number', color, i.toString()));
            }
            
            // Adicionar cartas de ação (Skip, Reverse, Draw Two)
            for (let i = 0; i < 2; i++) {
                this.cards.push(new UnoCard('action', color, 'skip'));
                this.cards.push(new UnoCard('action', color, 'reverse'));
                this.cards.push(new UnoCard('action', color, 'draw2'));
            }
        }
        
        // Adicionar cartas curinga (Wild e Wild Draw Four)
        for (let i = 0; i < 4; i++) {
            this.cards.push(new UnoCard('wild', 'black', 'wild'));
            this.cards.push(new UnoCard('wild', 'black', 'wild-draw-four'));
        }
        
        // Adicionar cartas extras para modo Wild
        if (this.gameMode === 'wild') {
            for (let color of colors) {
                this.cards.push(new UnoCard('action', color, 'skip'));
                this.cards.push(new UnoCard('action', color, 'reverse'));
                this.cards.push(new UnoCard('action', color, 'draw2'));
            }
            
            // Mais cartas curinga
            for (let i = 0; i < 2; i++) {
                this.cards.push(new UnoCard('wild', 'black', 'wild'));
                this.cards.push(new UnoCard('wild', 'black', 'wild-draw-four'));
            }
        }
        
        // Embaralhar o baralho
        this.shuffle();
    }
    
    // Embaralhar o baralho
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    // Comprar uma carta
    drawCard() {
        // Se o baralho estiver vazio, reabastecer com a pilha de descarte
        if (this.cards.length === 0) {
            this.reshuffle();
        }
        
        return this.cards.pop();
    }
    
    // Comprar múltiplas cartas
    drawCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.drawCard());
        }
        return cards;
    }
    
    // Jogar uma carta
    playCard(card, chosenColor = null) {
        this.discardPile.unshift(card);
        
        // Se for um curinga, atualizar a cor atual
        if (card.type === 'wild' && chosenColor) {
            this.currentColor = chosenColor;
        } else {
            this.currentColor = card.color;
        }
    }
    
    // Obter a carta do topo da pilha de descarte
    getTopCard() {
        return this.discardPile[0];
    }
    
    // Reabastecer o baralho com a pilha de descarte
    reshuffle() {
        if (this.discardPile.length <= 1) return;
        
        // Manter a carta de topo na pilha de descarte
        const topCard = this.discardPile.shift();
        
        // Resto da pilha vai para o baralho
        this.cards = [...this.discardPile];
        this.discardPile = [topCard];
        
        // Embaralhar o baralho
        this.shuffle();
    }
    
    // Obter o número de cartas restantes no baralho
    getRemainingCards() {
        return this.cards.length;
    }
    
    // Iniciar o jogo virando a primeira carta
    startGame() {
        // Virar a primeira carta para iniciar o jogo
        let firstCard = this.drawCard();
        
        // Se a primeira carta for um curinga, escolher uma cor aleatória
        if (firstCard.type === 'wild') {
            const colors = ['red', 'blue', 'green', 'yellow'];
            this.currentColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Para simplicidade, se a primeira carta for um curinga +4, substituímos por um curinga normal
            if (firstCard.value === 'wild-draw-four') {
                firstCard = new UnoCard('wild', 'black', 'wild');
            }
        } else {
            this.currentColor = firstCard.color;
        }
        
        this.discardPile = [firstCard];
        return firstCard;
    }
    
    // Serializar o baralho para armazenamento/transferência
    toJSON() {
        return {
            cards: this.cards.map(card => card.toJSON()),
            discardPile: this.discardPile.map(card => card.toJSON()),
            currentColor: this.currentColor,
            gameMode: this.gameMode
        };
    }
    
    // Criar baralho a partir de objeto serializado
    static fromJSON(data) {
        const deck = new UnoDeck(data.gameMode);
        deck.cards = data.cards.map(cardData => UnoCard.fromJSON(cardData));
        deck.discardPile = data.discardPile.map(cardData => UnoCard.fromJSON(cardData));
        deck.currentColor = data.currentColor;
        return deck;
    }
}