/**
 * Enhanced Card Renderer for UNO Game
 * Data: 2025-04-14 14:34:10
 * Desenvolvido por: Duduxindev
 */

class EnhancedCardRenderer {
    constructor() {
        this.cardTemplates = {};
        this.cardElements = {};
    }
    
    // Initialize renderer
    init() {
        // Create card templates
        this.createCardTemplates();
    }
    
    // Create card templates
    createCardTemplates() {
        // Number card template
        this.cardTemplates.number = (card) => `
            <div class="card ${card.color}" data-id="${card.id}" data-color="${card.color}" data-value="${card.value}" data-type="${card.type}">
                <div class="card-inner">
                    <div class="card-corners">
                        <div class="card-corner top-left">${card.value}</div>
                        <div class="card-corner bottom-right">${card.value}</div>
                    </div>
                    <div class="card-center">${card.value}</div>
                    <div class="card-reflection"></div>
                </div>
            </div>
        `;
        
        // Action card template
        this.cardTemplates.action = (card) => {
            let symbol = card.value;
            let symbolClass = '';
            
            // Set symbol based on value
            switch (card.value) {
                case 'skip':
                    symbol = '⊘';
                    symbolClass = 'skip-symbol';
                    break;
                case 'reverse':
                    symbol = '↺';
                    symbolClass = 'reverse-symbol';
                    break;
                case 'draw2':
                    symbol = '+2';
                    symbolClass = 'draw2-symbol';
                    break;
            }
            
            return `
                <div class="card ${card.color}" data-id="${card.id}" data-color="${card.color}" data-value="${card.value}" data-type="${card.type}">
                    <div class="card-inner">
                        <div class="card-corners">
                            <div class="card-corner top-left">${symbol}</div>
                            <div class="card-corner bottom-right">${symbol}</div>
                        </div>
                        <div class="card-center ${symbolClass}">${symbol}</div>
                        <div class="card-reflection"></div>
                    </div>
                </div>
            `;
        };
        
        // Wild card template
        this.cardTemplates.wild = (card) => {
            let symbol = '★';
            let symbolClass = 'wild-symbol';
            
            if (card.value === 'wild-draw-four') {
                symbol = '+4';
                symbolClass = 'wild-draw-four-symbol';
            }
            
            return `
                <div class="card black" data-id="${card.id}" data-color="${card.color}" data-value="${card.value}" data-type="${card.type}">
                    <div class="card-inner">
                        <div class="card-corners">
                            <div class="card-corner top-left">${symbol}</div>
                            <div class="card-corner bottom-right">${symbol}</div>
                        </div>
                        <div class="card-center ${symbolClass}">${symbol}</div>
                        <div class="wild-colors">
                            <div class="wild-color red"></div>
                            <div class="wild-color blue"></div>
                            <div class="wild-color green"></div>
                            <div class="wild-color yellow"></div>
                        </div>
                        <div class="card-reflection"></div>
                    </div>
                </div>
            `;
        };
        
        // Special card template
        this.cardTemplates.special = (card) => {
            let symbol = '⚡';
            let symbolClass = 'special-symbol';
            let backgroundColor = card.color;
            
            // Set symbol based on value
            switch (card.value) {
                case 'swap-hands':
                    symbol = '⇄';
                    symbolClass = 'swap-hands-symbol';
                    break;
                case 'draw-until':
                    symbol = '∞';
                    symbolClass = 'draw-until-symbol';
                    break;
                case 'double-turn':
                    symbol = '⟳⟳';
                    symbolClass = 'double-turn-symbol';
                    break;
                case 'command':
                    symbol = '⚑';
                    symbolClass = 'command-symbol';
                    break;
                case 'shield':
                    symbol = '⛨';
                    symbolClass = 'shield-symbol';
                    break;
                case 'draw-six':
                    symbol = '+6';
                    symbolClass = 'draw-six-symbol';
                    break;
                case 'skip-all':
                    symbol = '⊗';
                    symbolClass = 'skip-all-symbol';
                    break;
                case 'wild-swap':
                    symbol = '⇋';
                    symbolClass = 'wild-swap-symbol';
                    break;
                case 'challenge':
                    symbol = '❗';
                    symbolClass = 'challenge-symbol';
                    break;
            }
            
            return `
                <div class="card ${backgroundColor}" data-id="${card.id}" data-color="${card.color}" data-value="${card.value}" data-type="${card.type}" ${card.rarity ? `data-rarity="${card.rarity}"` : ''}>
                    <div class="card-inner">
                        <div class="card-corners">
                            <div class="card-corner top-left">${symbol}</div>
                            <div class="card-corner bottom-right">${symbol}</div>
                        </div>
                        <div class="card-center ${symbolClass}">${symbol}</div>
                        ${card.rarity === 'rare' ? '<div class="rarity-indicator">RARA</div>' : ''}
                        <div class="card-reflection"></div>
                    </div>
                </div>
            `;
        };
        
        // Legendary card template (for the 99 card)
        this.cardTemplates.legendary = (card) => {
            return `
                <div class="card ${card.color} legendary-card" data-id="${card.id}" data-color="${card.color}" data-value="${card.value}" data-type="${card.type}" data-rarity="${card.rarity}">
                    <div class="card-inner">
                        <div class="legendary-glow"></div>
                        <div class="card-corners">
                            <div class="card-corner top-left">${card.value}</div>
                            <div class="card-corner bottom-right">${card.value}</div>
                        </div>
                        <div class="card-center legendary-symbol">${card.value}</div>
                        <div class="rarity-indicator">LENDÁRIA</div>
                        <div class="legendary-description">${card.description}</div>
                        <div class="card-reflection legendary-reflection"></div>
                    </div>
                </div>
            `;
        };
        
        // Card back template
        this.cardTemplates.back = () => `
            <div class="card back">
                <div class="card-inner">
                    <div class="card-logo">UNO</div>
                    <div class="card-back-pattern"></div>
                </div>
            </div>
        `;
    }
    
    // Render a card
    renderCard(card, isPlayable = false, showBack = false) {
        // If showing the back
        if (showBack) {
            return this.cardTemplates.back();
        }
        
        // Select template based on card type
        let cardHtml = '';
        
        switch (card.type) {
            case 'number':
                cardHtml = this.cardTemplates.number(card);
                break;
            case 'action':
                cardHtml = this.cardTemplates.action(card);
                break;
            case 'wild':
                cardHtml = this.cardTemplates.wild(card);
                break;
            case 'special':
                cardHtml = this.cardTemplates.special(card);
                break;
            case 'legendary':
                cardHtml = this.cardTemplates.legendary(card);
                break;
            default:
                cardHtml = this.cardTemplates.back();
        }
        
        // Convert HTML to DOM element
        const template = document.createElement('template');
        template.innerHTML = cardHtml.trim();
        const cardElement = template.content.firstChild;
        
        // Apply playable class if needed
        if (isPlayable) {
            cardElement.classList.add('playable');
            
            // Add visual indicator
            const indicator = document.createElement('div');
            indicator.className = 'playable-indicator';
            indicator.textContent = 'Jogável';
            cardElement.appendChild(indicator);
        }
        
        // Add animations for special cards
        if (card.type === 'legendary') {
            this.addLegendaryAnimations(cardElement);
        } else if (card.rarity === 'rare') {
            this.addRareAnimations(cardElement);
        }
        
        // Store reference to element
        this.cardElements[card.id] = cardElement;
        
        return cardElement;
    }
    
    // Add animations for legendary cards
    addLegendaryAnimations(cardElement) {
        // Pulsating glow effect
        const glow = cardElement.querySelector('.legendary-glow');
        if (glow) {
            setInterval(() => {
                glow.style.opacity = 0.6 + (Math.sin(Date.now() / 500) * 0.4);
            }, 50);
        }
        
        // Floating effect
        cardElement.style.animation = 'float 3s ease-in-out infinite';
        
        // Sparkle effects
        this.addSparkles(cardElement);
    }
    
    // Add animations for rare cards
    addRareAnimations(cardElement) {
        // Subtle glow effect
        cardElement.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.7)';
        
        // Subtle float
        cardElement.style.animation = 'float-subtle 4s ease-in-out infinite';
    }
    
    // Add sparkle effects
    addSparkles(cardElement) {
        // Create sparkle container
        const sparkleContainer = document.createElement('div');
        sparkleContainer.className = 'sparkle-container';
        cardElement.appendChild(sparkleContainer);
        
        // Create periodic sparkles
        setInterval(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            
            // Random position
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            
            // Add to container
            sparkleContainer.appendChild(sparkle);
            
            // Remove after animation
            setTimeout(() => {
                if (sparkleContainer.contains(sparkle)) {
                    sparkleContainer.removeChild(sparkle);
                }
            }, 1000);
        }, 300);
    }
    
    // Render multiple cards
    renderCards(cards, container, isPlayable = (card) => false, showBack = false) {
        // Clear container
        container.innerHTML = '';
        
        // Render each card
        cards.forEach((card, index) => {
            const cardPlayable = isPlayable(card);
            const cardElement = this.renderCard(card, cardPlayable, showBack);
            
            // Add entrance effect
            setTimeout(() => {
                cardElement.classList.add('in-hand');
            }, index * 100);
            
            container.appendChild(cardElement);
        });
    }
    
    // Render top card of the discard pile
    renderTopCard(card, container) {
        // Clear container
        container.innerHTML = '';
        
        // Render the card
        const cardElement = this.renderCard(card);
        
        // Add class for visual effect
        cardElement.classList.add('top-card');
        
        // If card has chosen color (for wilds)
        if (card.chosenColor) {
            cardElement.dataset.chosenColor = card.chosenColor;
            cardElement.classList.add('colored-wild');
            
            // Add color overlay
            const overlay = document.createElement('div');
            overlay.className = `color-overlay ${card.chosenColor}`;
            cardElement.appendChild(overlay);
        }
        
        container.appendChild(cardElement);
    }
    
    // Animate card being played
    animateCardPlay(cardElement, destination, callback) {
        // If no card element or destination, do nothing
        if (!cardElement || !destination) {
            if (callback) callback();
            return;
        }
        
        // Get positions
        const cardRect = cardElement.getBoundingClientRect();
        const destRect = destination.getBoundingClientRect();
        
        // Create clone to animate
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${cardRect.top}px`;
        clone.style.left = `${cardRect.left}px`;
        clone.style.width = `${cardRect.width}px`;
        clone.style.height = `${cardRect.height}px`;
        clone.style.zIndex = '1000';
        clone.style.transition = 'all 0.3s ease-out';
        
        // Add to page
        document.body.appendChild(clone);
        
        // Hide original card
        cardElement.style.opacity = '0';
        
        // Animate to destination
        setTimeout(() => {
            clone.style.top = `${destRect.top}px`;
            clone.style.left = `${destRect.left}px`;
            clone.style.transform = 'rotate(360deg)';
        }, 50);
        
        // Remove clone after animation
        setTimeout(() => {
            document.body.removeChild(clone);
            if (callback) callback();
        }, 350);
    }
    
    // Animate drawing a card
    animateCardDraw(source, destination, card, isPlayable = false, callback) {
        // If no source or destination, do nothing
        if (!source || !destination) {
            if (callback) callback();
            return;
        }
        
        // Get positions
        const sourceRect = source.getBoundingClientRect();
        const destRect = destination.getBoundingClientRect();
        
        // Create card element
        const cardElement = document.createElement('div');
        cardElement.className = 'card back';
        cardElement.style.position = 'fixed';
        cardElement.style.top = `${sourceRect.top}px`;
        cardElement.style.left = `${sourceRect.left}px`;
        cardElement.style.width = `${sourceRect.width}px`;
        cardElement.style.height = `${sourceRect.height}px`;
        cardElement.style.zIndex = '1000';
        cardElement.style.transition = 'all 0.3s ease-out';
        
        // Add to page
        document.body.appendChild(cardElement);
        
        // Animate to destination
        setTimeout(() => {
            cardElement.style.top = `${destRect.top}px`;
            cardElement.style.left = `${destRect.left}px`;
        }, 50);
        
        // Remove clone after animation and render real card
        setTimeout(() => {
            document.body.removeChild(cardElement);
            
            // Create real card
            if (card) {
                const realCard = this.renderCard(card, isPlayable);
                destination.appendChild(realCard);
                
                // Entrance effect
                setTimeout(() => {
                    realCard.classList.add('in-hand');
                }, 50);
            }
            
            if (callback) callback();
        }, 350);
    }
}

// Initialize EnhancedCardRenderer globally when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedCardRenderer = new EnhancedCardRenderer();
    window.enhancedCardRenderer.init();
    console.log("✅ Renderizador de cartas aprimorado inicializado!");
});