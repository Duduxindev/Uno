/**
 * Gerenciamento de Cartas do UNO
 */
class UnoCard {
    constructor(type, color, value) {
        this.type = type;     // 'number', 'action', 'wild'
        this.color = color;   // 'red', 'blue', 'green', 'yellow', 'black'
        this.value = value;   // '0'-'9', 'skip', 'reverse', 'draw2', 'wild', 'wild-draw-four'
        this.id = `${color}-${value}-${Math.random().toString(36).substring(2, 8)}`;
    }
    
    canPlayOn(topCard, currentColor) {
        // Curinga (Wild) e Curinga +4 (Wild Draw Four) podem ser jogados em qualquer carta
        if (this.type === 'wild') {
            return true;
        }
        
        // Se a cor da carta corresponder à cor atual
        if (this.color === currentColor) {
            return true;
        }
        
        // Se o valor da carta corresponder ao valor da carta de topo
        if (this.value === topCard.value) {
            return true;
        }
        
        return false;
    }
    
    render(faceUp = true) {
        const card = document.createElement('div');
        card.className = `card ${this.color}`;
        card.dataset.id = this.id;
        
        if (faceUp) {
            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';
            
            if (this.type === 'number') {
                const cardValue = document.createElement('div');
                cardValue.className = 'card-value';
                cardValue.textContent = this.value;
                cardInner.appendChild(cardValue);
            } else {
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
            
            card.appendChild(cardInner);
        } else {
            card.classList.add('card-back');
            const cardBackLogo = document.createElement('div');
            cardBackLogo.className = 'card-back-logo';
            cardBackLogo.textContent = 'UNO';
            card.appendChild(cardBackLogo);
        }
        
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
    
    initDeck() {
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        // Adicionar cartas numéricas (0-9)
        for (let color of colors) {
            // Cada baralho tem apenas um '0' de cada cor
            this.cards.push(new UnoCard('number', color, '0'));
            
            // E duas cartas de 1-9 de cada cor
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
        
        // Modos de jogo especiais
        if (this.gameMode === 'wild') {
            // Adiciona mais cartas especiais
            for (let color of colors) {
                this.cards.push(new UnoCard('action', color, 'skip'));
                this.cards.push(new UnoCard('action', color, 'reverse'));
                this.cards.push(new UnoCard('action', color, 'draw2'));
            }
            
            // Mais curingas
            for (let i = 0; i < 2; i++) {
                this.cards.push(new UnoCard('wild', 'black', 'wild'));
                this.cards.push(new UnoCard('wild', 'black', 'wild-draw-four'));
            }
        }
        
        // Embaralhar o baralho
        this.shuffle();
    }
    
    shuffle() {
        // Algoritmo de Fisher-Yates para embaralhar
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    drawCard() {
        // Se o baralho estiver vazio, reabasteça com a pilha de descarte
        if (this.cards.length === 0) {
            this.reshuffle();
        }
        
        // Retorna a carta do topo do baralho
        return this.cards.pop();
    }
    
    drawCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.drawCard());
        }
        return cards;
    }
    
    playCard(card, chosenColor = null) {
        this.discardPile.unshift(card);
        
        // Se for um curinga, atualize a cor atual
        if (card.type === 'wild' && chosenColor) {
            this.currentColor = chosenColor;
        } else {
            this.currentColor = card.color;
        }
    }
    
    getTopCard() {
        return this.discardPile[0];
    }
    
    reshuffle() {
        if (this.discardPile.length <= 1) return;
        
        // Mantém a carta de topo na pilha de descarte
        const topCard = this.discardPile.shift();
        
        // Adiciona o restante da pilha de descarte ao baralho
        this.cards = [...this.discardPile];
        this.discardPile = [topCard];
        
        // Embaralha o baralho
        this.shuffle();
    }
    
    getRemainingCards() {
        return this.cards.length;
    }
    
    startGame() {
        // Vira a primeira carta para iniciar o jogo
        const startingCard = this.drawCard();
        
        // Se a primeira carta for um curinga, escolha uma cor aleatória
        if (startingCard.type === 'wild') {
            const colors = ['red', 'blue', 'green', 'yellow'];
            this.currentColor = colors[Math.floor(Math.random() * colors.length)];
        } else {
            this.currentColor = startingCard.color;
        }
        
        this.discardPile = [startingCard];
        return startingCard;
    }
}