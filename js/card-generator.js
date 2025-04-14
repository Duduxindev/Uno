/**
 * Enhanced Card Generator System for UNO Game
 * Data: 2025-04-14 14:34:10
 * Desenvolvido por: Duduxindev
 */

class CardGenerator {
    constructor() {
        this.standardColors = ['red', 'blue', 'green', 'yellow'];
        this.specialColors = ['purple', 'orange', 'teal', 'pink'];
        this.idCounter = 0;
    }

    // Generate a completely unique ID for each card
    generateCardId() {
        this.idCounter++;
        return `card-${Date.now()}-${this.idCounter}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create a complete deck based on game mode
    createDeck(gameMode = 'normal', includeSpecialCards = true) {
        let cards = [];
        
        // Add standard cards (numbers, skips, reverses, +2, etc)
        cards = cards.concat(this.generateStandardCards());
        
        // Add wild cards
        cards = cards.concat(this.generateWildCards());
        
        // Add mode-specific cards
        if (includeSpecialCards) {
            cards = cards.concat(this.generateModeSpecificCards(gameMode));
        }
        
        // Add rare special cards with very low probability
        cards = cards.concat(this.generateRareCards());
        
        // Shuffle the deck thoroughly using Fisher-Yates algorithm
        return this.shuffleDeck(cards);
    }

    // Generate standard UNO cards
    generateStandardCards() {
        const cards = [];
        
        // For each color (red, blue, green, yellow)
        this.standardColors.forEach(color => {
            // Add one 0 card
            cards.push({
                id: this.generateCardId(),
                type: 'number',
                color: color,
                value: '0'
            });
            
            // Add two of each 1-9 cards
            for (let num = 1; num <= 9; num++) {
                for (let i = 0; i < 2; i++) {
                    cards.push({
                        id: this.generateCardId(),
                        type: 'number',
                        color: color,
                        value: num.toString()
                    });
                }
            }
            
            // Add action cards (Skip, Reverse, Draw 2)
            for (let i = 0; i < 2; i++) {
                cards.push({
                    id: this.generateCardId(),
                    type: 'action',
                    color: color,
                    value: 'skip'
                });
                
                cards.push({
                    id: this.generateCardId(),
                    type: 'action',
                    color: color,
                    value: 'reverse'
                });
                
                cards.push({
                    id: this.generateCardId(),
                    type: 'action',
                    color: color,
                    value: 'draw2'
                });
            }
        });
        
        return cards;
    }

    // Generate wild cards
    generateWildCards() {
        const cards = [];
        
        // Add 4 Wild cards
        for (let i = 0; i < 4; i++) {
            cards.push({
                id: this.generateCardId(),
                type: 'wild',
                color: 'black',
                value: 'wild'
            });
        }
        
        // Add 4 Wild Draw 4 cards
        for (let i = 0; i < 4; i++) {
            cards.push({
                id: this.generateCardId(),
                type: 'wild',
                color: 'black',
                value: 'wild-draw-four'
            });
        }
        
        return cards;
    }

    // Generate mode-specific cards
    generateModeSpecificCards(gameMode) {
        const cards = [];
        
        switch(gameMode) {
            case 'wild':
            case 'extreme':
            case 'chaos':
                // Add extra action cards
                this.standardColors.forEach(color => {
                    cards.push({
                        id: this.generateCardId(),
                        type: 'action',
                        color: color,
                        value: 'skip'
                    });
                    
                    cards.push({
                        id: this.generateCardId(),
                        type: 'action',
                        color: color,
                        value: 'reverse'
                    });
                    
                    cards.push({
                        id: this.generateCardId(),
                        type: 'action',
                        color: color,
                        value: 'draw2'
                    });
                });
                
                // Add extra wild cards
                for (let i = 0; i < 2; i++) {
                    cards.push({
                        id: this.generateCardId(),
                        type: 'wild',
                        color: 'black',
                        value: 'wild'
                    });
                    
                    cards.push({
                        id: this.generateCardId(),
                        type: 'wild',
                        color: 'black',
                        value: 'wild-draw-four'
                    });
                }
                
                // For extreme mode, add new card types
                if (gameMode === 'extreme') {
                    // Add swap hands card
                    cards.push({
                        id: this.generateCardId(),
                        type: 'special',
                        color: 'black',
                        value: 'swap-hands'
                    });
                    
                    // Add draw-until color card
                    cards.push({
                        id: this.generateCardId(),
                        type: 'special',
                        color: 'black',
                        value: 'draw-until'
                    });
                    
                    // Add color cards
                    this.standardColors.forEach(color => {
                        cards.push({
                            id: this.generateCardId(),
                            type: 'special',
                            color: color,
                            value: 'double-turn'
                        });
                    });
                }
                break;
                
            case 'action-only':
                // Add only action cards, no number cards
                this.standardColors.forEach(color => {
                    for (let i = 0; i < 4; i++) {
                        cards.push({
                            id: this.generateCardId(),
                            type: 'action',
                            color: color,
                            value: 'skip'
                        });
                        
                        cards.push({
                            id: this.generateCardId(),
                            type: 'action',
                            color: color,
                            value: 'reverse'
                        });
                        
                        cards.push({
                            id: this.generateCardId(),
                            type: 'action',
                            color: color,
                            value: 'draw2'
                        });
                    }
                });
                
                // Add extra wild cards
                for (let i = 0; i < 4; i++) {
                    cards.push({
                        id: this.generateCardId(),
                        type: 'wild',
                        color: 'black',
                        value: 'wild'
                    });
                    
                    cards.push({
                        id: this.generateCardId(),
                        type: 'wild',
                        color: 'black',
                        value: 'wild-draw-four'
                    });
                }
                break;
                
            case 'insane':
                // New mode with lots of special cards
                for (let i = 0; i < 2; i++) {
                    cards.push({
                        id: this.generateCardId(),
                        type: 'special',
                        color: 'black',
                        value: 'draw-six'
                    });
                    
                    cards.push({
                        id: this.generateCardId(),
                        type: 'special',
                        color: 'black',
                        value: 'skip-all'
                    });
                    
                    cards.push({
                        id: this.generateCardId(),
                        type: 'special',
                        color: 'black',
                        value: 'wild-swap'
                    });
                }
                break;
                
            default:
                // No extra cards for normal mode
                break;
        }
        
        return cards;
    }

    // Generate rare special cards
    generateRareCards() {
        const cards = [];
        
        // Special rare card: Command card (force another player to discard a color)
        if (Math.random() < 0.05) { // 5% chance
            cards.push({
                id: this.generateCardId(),
                type: 'special',
                color: 'black',
                value: 'command',
                rarity: 'rare'
            });
        }
        
        // Special rare card: Shield card (block any draw card effects)
        if (Math.random() < 0.03) { // 3% chance
            cards.push({
                id: this.generateCardId(),
                type: 'special',
                color: 'black',
                value: 'shield',
                rarity: 'rare'
            });
        }
        
        // Add the ultra-rare "99" card with 0.0000001% chance
        if (Math.random() < 0.000000001) { // Ultra rare chance
            cards.push({
                id: this.generateCardId(),
                type: 'legendary',
                color: 'gold',
                value: '99',
                rarity: 'legendary',
                description: 'Carta lendária que garante uma vitória instantânea.',
                effect: 'win'
            });
        }
        
        return cards;
    }

    // Randomly distribute initial cards to players
    distributeCards(players, deck, cardsPerPlayer = 7) {
        // Make a copy of the deck to avoid modifying the original
        const deckCopy = [...deck];
        
        // Give cards to each player
        players.forEach(player => {
            const playerCards = [];
            
            for (let i = 0; i < cardsPerPlayer; i++) {
                // Get a random card from the deck
                const randomIndex = Math.floor(Math.random() * deckCopy.length);
                const card = deckCopy.splice(randomIndex, 1)[0];
                
                if (card) {
                    playerCards.push(card);
                }
            }
            
            player.cards = playerCards;
        });
        
        // Return the remaining deck
        return deckCopy;
    }

    // Shuffle the deck thoroughly
    shuffleDeck(cards) {
        // Make a copy to avoid modifying the original
        const shuffled = [...cards];
        
        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Extra shuffle for more randomness
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }
}

// Initialize CardGenerator globally when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cardGenerator = new CardGenerator();
    console.log("✅ Sistema de geração de cartas aleatórias inicializado!");
});