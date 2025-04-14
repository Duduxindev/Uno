/**
 * Legendary Card Handler for UNO Game
 * Data: 2025-04-14 14:41:01
 * Desenvolvido por: Duduxindev
 */

class LegendaryCardHandler {
    constructor() {
        this.initialized = false;
        this.legendaryCardFound = false;
    }
    
    // Initialize the handler
    init() {
        if (this.initialized) return;
        
        // Set up event listeners for legendary cards
        this.setupEventListeners();
        
        // Add legendary card checking to game
        this.patchGameInitializer();
        
        this.initialized = true;
        console.log("✅ Legendary Card Handler initialized!");
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Listen for card clicks to check for legendary cards
        document.addEventListener('click', (e) => {
            // Check if clicked element is a legendary card
            if (e.target.closest('.legendary-card')) {
                const card = e.target.closest('.legendary-card');
                this.handleLegendaryCardClick(card);
            }
        });
    }
    
    // Patch the game initializer to handle legendary cards
    patchGameInitializer() {
        if (!window.gameInitializer) return;
        
        // Keep reference to original play card method
        const originalPlayCard = window.gameInitializer.playCard;
        
        // Override play card method to check for legendary cards
        window.gameInitializer.playCard = (card) => {
            // Check if it's a legendary card
            if (card.type === 'legendary' && card.value === '99') {
                this.activateLegendaryCard(card);
                return;
            }
            
            // Otherwise, use original method
            originalPlayCard.call(window.gameInitializer, card);
        };
    }
    
    // Handle legendary card click
    handleLegendaryCardClick(cardElement) {
        if (!cardElement) return;
        
        // Extract card data
        const cardId = cardElement.dataset.id;
        const cardType = cardElement.dataset.type;
        const cardValue = cardElement.dataset.value;
        
        // Check if it's a legendary 99 card
        if (cardType === 'legendary' && cardValue === '99') {
            // Create card object
            const legendaryCard = {
                id: cardId,
                type: cardType,
                color: 'gold',
                value: cardValue,
                rarity: 'legendary',
                effect: 'win'
            };
            
            // Activate the legendary card effect
            this.activateLegendaryCard(legendaryCard);
        }
    }
    
    // Activate legendary card effect
    activateLegendaryCard(card) {
        if (this.legendaryCardFound) return; // Prevent multiple activations
        this.legendaryCardFound = true;
        
        console.log("🌟 LEGENDARY CARD ACTIVATED: 99!");
        
        // Create spectacular visual effect
        this.createLegendaryEffect();
        
        // Play legendary sound effect if sounds are enabled
        this.playLegendarySound();
        
        // Declare victory and end the game
        setTimeout(() => {
            this.declareVictory();
        }, 3000);
    }
    
    // Create spectacular visual effect
    createLegendaryEffect() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'legendary-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = 9999;
        overlay.style.opacity = 0;
        overlay.style.transition = 'opacity 1s ease';
        
        // Create card display
        const cardDisplay = document.createElement('div');
        cardDisplay.className = 'legendary-card-display';
        cardDisplay.style.transform = 'scale(0)';
        cardDisplay.style.transition = 'transform 1s ease';
        
        // Create card image
        const cardImage = document.createElement('div');
        cardImage.className = 'card gold legendary-card';
        cardImage.style.width = '300px';
        cardImage.style.height = '450px';
        cardImage.style.margin = '0 auto';
        cardImage.style.animation = 'legendary-sparkle 1s infinite';
        cardImage.style.boxShadow = '0 0 40px 10px rgba(255, 215, 0, 0.8)';
        
        cardImage.innerHTML = `
            <div class="card-inner">
                <div class="legendary-glow"></div>
                <div class="card-corners">
                    <div class="card-corner top-left" style="font-size: 3rem;">99</div>
                    <div class="card-corner bottom-right" style="font-size: 3rem;">99</div>
                </div>
                <div class="card-center legendary-symbol" style="font-size: 8rem;">99</div>
                <div class="rarity-indicator" style="font-size: 1.5rem; padding: 5px 10px;">LENDÁRIA</div>
                <div class="legendary-description" style="font-size: 1.2rem; padding: 10px;">Carta lendária que garante uma vitória instantânea.</div>
                <div class="card-reflection legendary-reflection"></div>
            </div>
        `;
        
        // Create message
        const message = document.createElement('div');
        message.className = 'legendary-message';
        message.style.color = '#FFD700';
        message.style.fontSize = '2.5rem';
        message.style.fontWeight = 'bold';
        message.style.textAlign = 'center';
        message.style.marginTop = '30px';
        message.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
        message.innerHTML = 'CARTA 99 LENDÁRIA!<br>Vitória Instantânea!';
        
        // Add components
        cardDisplay.appendChild(cardImage);
        cardDisplay.appendChild(message);
        overlay.appendChild(cardDisplay);
        
        // Add to page
        document.body.appendChild(overlay);
        
        // Create sparkle effect
        this.createSparkleEffect(overlay);
        
        // Animate
        setTimeout(() => {
            overlay.style.opacity = 1;
            cardDisplay.style.transform = 'scale(1)';
        }, 100);
    }
    
    // Create sparkle effect
    createSparkleEffect(container) {
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'legendary-sparkle';
                sparkle.style.position = 'absolute';
                sparkle.style.width = `${Math.random() * 10 + 5}px`;
                sparkle.style.height = sparkle.style.width;
                sparkle.style.backgroundColor = '#FFD700';
                sparkle.style.borderRadius = '50%';
                sparkle.style.opacity = Math.random() * 0.7 + 0.3;
                sparkle.style.top = `${Math.random() * 100}%`;
                sparkle.style.left = `${Math.random() * 100}%`;
                sparkle.style.boxShadow = '0 0 10px 2px rgba(255, 215, 0, 0.8)';
                
                const duration = Math.random() * 2000 + 1000;
                sparkle.style.animation = `sparkle ${duration}ms ease forwards`;
                
                container.appendChild(sparkle);
                
                // Remove after animation
                setTimeout(() => {
                    if (container.contains(sparkle)) {
                        container.removeChild(sparkle);
                    }
                }, duration);
            }, Math.random() * 3000); // Random start time
        }
    }
    
    // Play legendary sound
    playLegendarySound() {
        // Check if sound effects are enabled
        const soundEffectsEnabled = document.getElementById('sound-effects')?.checked !== false;
        
        if (soundEffectsEnabled) {
            const audio = new Audio();
            audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-completed-2068.mp3';
            audio.volume = 0.7;
            audio.play().catch(e => console.log("Could not play legendary sound:", e));
        }
    }
    
    // Declare victory
    declareVictory() {
        // Create victory overlay
        const victoryOverlay = document.createElement('div');
        victoryOverlay.className = 'victory-overlay';
        
        const victoryContent = document.createElement('div');
        victoryContent.className = 'victory-content';
        
        victoryContent.innerHTML = `
            <h1>VITÓRIA EXTRAORDINÁRIA!</h1>
            <p>Você encontrou e jogou a raríssima carta 99!</p>
            <p>Esta carta tem apenas 0.0000001% de chance de aparecer.</p>
            <p>Você foi extremamente sortudo!</p>
            <button class="back-to-menu-btn">Voltar ao Menu</button>
        `;
        
        victoryOverlay.appendChild(victoryContent);
        document.body.appendChild(victoryOverlay);
        
        // Add event listener to return to menu
        const backToMenuBtn = victoryOverlay.querySelector('.back-to-menu-btn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                victoryOverlay.remove();
                window.showScreen('start-screen');
                
                // Reset legendary card found flag
                this.legendaryCardFound = false;
                
                // Clear session if online
                const session = window.Storage?.getSession();
                if (session && session.isOnline && session.roomCode) {
                    // Clean up room
                    window.roomManager?.leaveRoom();
                }
                
                // Reset session
                window.Storage?.clearSession();
            });
        }
    }
}

// Initialize LegendaryCardHandler globally when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.legendaryCardHandler = new LegendaryCardHandler();
    window.legendaryCardHandler.init();
});