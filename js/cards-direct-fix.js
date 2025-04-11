/**
 * Correção Direta para Cartas
 * Data: 2025-04-11 21:32:49
 * Desenvolvido por: Duduxindev
 */

console.log("🃏 Iniciando correção direta das cartas...");

// Injetar cartas imediatamente
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM carregado, verificando cartas...");
    
    // Verificar a cada segundo por 10 segundos
    let attempts = 0;
    const cardChecker = setInterval(function() {
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen && gameScreen.classList.contains('active')) {
            forceCardGeneration();
        }
        
        attempts++;
        if (attempts >= 10) {
            clearInterval(cardChecker);
        }
    }, 1000);
    
    // Adicionar evento para mudança de tela
    window.showScreen = function(screenId) {
        // Chamar função original primeiro
        if (window.originalShowScreen) {
            window.originalShowScreen(screenId);
        } else {
            // Esconder todas as telas
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            // Mostrar a tela solicitada
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('active');
            }
        }
        
        // Se for tela de jogo, gerar cartas
        if (screenId === 'game-screen') {
            setTimeout(forceCardGeneration, 500);
        }
    };
});

// Gerar cartas forçadamente
function forceCardGeneration() {
    console.log("🔄 Gerando cartas forçadamente...");
    
    const playerHand = document.getElementById('player-hand');
    if (!playerHand) {
        console.log("❌ Mão do jogador não encontrada");
        return;
    }
    
    // Se já tiver cartas, não fazer nada
    if (playerHand.children.length > 0) {
        console.log("✅ Cartas já existem na mão do jogador");
        return;
    }
    
    // Gerar cartas visíveis
    const cards = generateSimpleCards();
    
    // Limpar e adicionar cartas à mão
    playerHand.innerHTML = '';
    cards.forEach(card => {
        playerHand.appendChild(card);
    });
    
    // Atualizar contador
    const cardCounter = document.getElementById('card-count');
    if (cardCounter) {
        cardCounter.textContent = `${cards.length} cartas`;
    }
    
    console.log(`✅ ${cards.length} cartas geradas com sucesso!`);
}

// Gerar conjunto simples de cartas
function generateSimpleCards() {
    const cards = [];
    const colors = ['red', 'blue', 'green', 'yellow'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', 'skip', 'reverse', '+2'];
    
    // Gerar 7 cartas aleatórias
    for (let i = 0; i < 7; i++) {
        // Selecionar cor e valor aleatórios
        const color = colors[Math.floor(Math.random() * colors.length)];
        const value = values[Math.floor(Math.random() * values.length)];
        
        // Criar carta visualmente
        const card = document.createElement('div');
        card.className = `card ${color}`;
        card.style.display = 'block';
        card.style.width = '120px';
        card.style.height = '180px';
        card.style.margin = '0 -15px';
        card.style.position = 'relative';
        card.style.backgroundColor = getColorCode(color);
        card.style.color = (color === 'yellow') ? 'black' : 'white';
        card.style.borderRadius = '10px';
        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        card.style.transition = 'transform 0.3s ease';
        
        // ID e dados para funcionalidade
        card.dataset.id = `${color}-${value}-${Math.random().toString(36).substring(2, 9)}`;
        card.dataset.color = color;
        card.dataset.value = value;
        card.dataset.type = (value >= '0' && value <= '9') ? 'number' : 'action';
        
        // Adicionar conteúdo interno
        card.innerHTML = `
            <div class="card-inner" style="padding: 10px; width: 100%; height: 100%; position: relative;">
                <div class="card-center" style="font-size: 36px; font-weight: bold; text-align: center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    ${value}
                </div>
                <div class="card-corner top-left" style="position: absolute; top: 5px; left: 5px; font-size: 16px; font-weight: bold;">
                    ${value}
                </div>
                <div class="card-corner bottom-right" style="position: absolute; bottom: 5px; right: 5px; font-size: 16px; font-weight: bold; transform: rotate(180deg);">
                    ${value}
                </div>
            </div>
        `;
        
        // Adicionar efeito hover
        card.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-20px)';
            this.style.zIndex = '10';
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        });
        
        card.addEventListener('mouseout', function() {
            this.style.transform = '';
            this.style.zIndex = '';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        });
        
        // Adicionar evento de clique
        card.addEventListener('click', function() {
            playSimpleCard(this);
        });
        
        // Efeito de entrada
        setTimeout(() => {
            card.style.animation = 'card-enter 0.5s forwards';
        }, i * 100);
        
        cards.push(card);
    }
    
    return cards;
}

// Obter código de cor para cada carta
function getColorCode(color) {
    switch(color) {
        case 'red': return '#f44336';
        case 'blue': return '#2196F3';
        case 'green': return '#4CAF50';
        case 'yellow': return '#FFC107';
        default: return '#333333';
    }
}

// Jogar carta (versão simplificada)
function playSimpleCard(cardElement) {
    console.log(`🎮 Jogando carta: ${cardElement.dataset.color} ${cardElement.dataset.value}`);
    
    // Remover carta da mão
    if (cardElement.parentNode) {
        cardElement.parentNode.removeChild(cardElement);
    }
    
    // Atualizar pilha de descarte
    const discardPile = document.getElementById('discard-pile');
    if (discardPile) {
        discardPile.innerHTML = '';
        discardPile.appendChild(cardElement.cloneNode(true));
    }
    
    // Atualizar contador
    const playerHand = document.getElementById('player-hand');
    const cardCount = playerHand ? playerHand.children.length : 0;
    
    const cardCounter = document.getElementById('card-count');
    if (cardCounter) {
        cardCounter.textContent = `${cardCount} carta${cardCount !== 1 ? 's' : ''}`;
    }
    
    // Mostrar mensagem
    showMessage(`Carta ${cardElement.dataset.value} ${cardElement.dataset.color} jogada!`);
}

// Mostrar mensagem
function showMessage(message) {
    console.log("💬 " + message);
    
    // Obter ou criar container de mensagens
    let messagesContainer = document.getElementById('game-messages');
    if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.id = 'game-messages';
        messagesContainer.style.position = 'fixed';
        messagesContainer.style.bottom = '20%';
        messagesContainer.style.left = '0';
        messagesContainer.style.right = '0';
        messagesContainer.style.display = 'flex';
        messagesContainer.style.flexDirection = 'column';
        messagesContainer.style.alignItems = 'center';
        messagesContainer.style.zIndex = '1000';
        
        // Adicionar ao DOM
        document.body.appendChild(messagesContainer);
    }
    
    // Criar elemento de mensagem
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    messageElement.style.color = 'white';
    messageElement.style.padding = '10px 20px';
    messageElement.style.borderRadius = '20px';
    messageElement.style.marginBottom = '10px';
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(20px)';
    messageElement.style.transition = 'opacity 0.3s, transform 0.3s';
    
    // Adicionar ao container
    messagesContainer.appendChild(messageElement);
    
    // Animar entrada
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (messagesContainer.contains(messageElement)) {
                messagesContainer.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}

// Adicionar estilo para animação
const styleElement = document.createElement('style');
styleElement.textContent = `
    @keyframes card-enter {
        from { opacity: 0; transform: translateY(50px) scale(0.8); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    .player-hand {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        min-height: 200px !important;
        padding: 20px !important;
        width: 100% !important;
    }
`;
document.head.appendChild(styleElement);

console.log("✅ Script de correção de cartas carregado!");