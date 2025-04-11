/**
 * Correção para Cartas do UNO
 * Data: 2025-04-11 21:28:30
 * Desenvolvido por: Duduxindev
 */

(function() {
    console.log("🃏 Cards Fix: Inicializando correção para cartas...");
    
    // Função para forçar a geração das cartas
    function forceCardsGeneration() {
        console.log("🔄 Tentando gerar cartas forçadamente...");
        
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) {
            console.log("❌ Elemento player-hand não encontrado");
            return;
        }
        
        // Verificar se já existem cartas
        if (playerHand.children.length > 0) {
            console.log("✅ Cartas já existem na mão do jogador");
            return;
        }
        
        // Tentar gerar cartas usando a função do Master Fix
        if (window.unoMasterFix && typeof window.unoMasterFix.generatePlayerCards === 'function') {
            console.log("🔍 Usando função do Master Fix para gerar cartas");
            window.unoMasterFix.generatePlayerCards();
            return;
        }
        
        // Alternativa: Gerar cartas manualmente
        console.log("⚠️ Gerando cartas manualmente com fallback");
        generateCardsManually();
    }
    
    // Gerar cartas manualmente como fallback
    function generateCardsManually() {
        const playerHand = document.getElementById('player-hand');
        if (!playerHand) return;
        
        // Limpar mão atual
        playerHand.innerHTML = '';
        
        // Cores e valores para gerar cartas
        const colors = ['red', 'blue', 'green', 'yellow'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
        
        // Gerar 7 cartas aleatórias
        for (let i = 0; i < 7; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const value = values[Math.floor(Math.random() * values.length)];
            const type = (value >= '0' && value <= '9') ? 'number' : 'action';
            
            // Criar elemento da carta
            const card = document.createElement('div');
            card.className = `card ${color} playable`;
            card.dataset.id = `${color}-${value}-${Math.random().toString(36).substr(2, 9)}`;
            card.dataset.color = color;
            card.dataset.value = value;
            card.dataset.type = type;
            
            // Criar conteúdo interno da carta
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-corners">
                        <div class="card-corner top-left">${value}</div>
                        <div class="card-corner bottom-right">${value}</div>
                    </div>
                    <div class="card-center">${value}</div>
                </div>
            `;
            
            // Adicionar efeito de entrada com atraso
            setTimeout(() => {
                card.classList.add('in-hand');
            }, i * 100);
            
            // Adicionar à mão
            playerHand.appendChild(card);
        }
        
        // Atualizar contador de cartas
        const cardCounter = document.getElementById('card-count');
        if (cardCounter) {
            cardCounter.textContent = '7 cartas';
        }
        
        console.log("✅ Geradas 7 cartas manualmente");
    }
    
    // Executar quando a tela de jogo estiver ativa
    function checkGameScreen() {
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen && gameScreen.classList.contains('active')) {
            console.log("🎮 Tela de jogo detectada, verificando cartas...");
            
            // Dar um tempo para outros scripts carregarem
            setTimeout(forceCardsGeneration, 500);
        }
    }
    
    // Verificar periodicamente a tela de jogo
    setInterval(checkGameScreen, 1000);
    
    // Também verificar quando o DOM estiver completamente carregado
    document.addEventListener('DOMContentLoaded', () => {
        console.log("📄 DOM carregado, configurando observers para cartas...");
        
        // Observer para quando a tela mudar
        document.addEventListener('screenChange', (e) => {
            if (e.detail.screen === 'game-screen') {
                console.log("🔄 Mudança de tela para game-screen detectada");
                setTimeout(forceCardsGeneration, 500);
            }
        });
        
        // Também verificar se já estamos na tela de jogo
        checkGameScreen();
    });
    
    // Debug para verificar CSS das cartas
    function checkCardStyles() {
        console.log("🔍 Verificando estilos CSS das cartas...");
        
        // Verificar cartas na mão do jogador
        const playerHand = document.getElementById('player-hand');
        const cards = playerHand ? playerHand.querySelectorAll('.card') : [];
        
        if (cards.length === 0) {
            console.log("⚠️ Nenhuma carta encontrada para verificar estilos");
            return;
        }
        
        // Verificar estilos de uma carta
        const card = cards[0];
        const styles = window.getComputedStyle(card);
        
        console.log("📊 Estilos da carta:", {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            width: styles.width,
            height: styles.height,
            transform: styles.transform
        });
        
        // Corrigir problemas de visibilidade se necessário
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
            console.log("🔧 Corrigindo problemas de visibilidade das cartas");
            
            cards.forEach(card => {
                card.style.display = 'block';
                card.style.visibility = 'visible';
                card.style.opacity = '1';
            });
        }
    }
    
    // Verificar estilos após 3 segundos para dar tempo do CSS carregar
    setTimeout(checkCardStyles, 3000);
    
    console.log("✅ Cards Fix inicializado com sucesso!");
})();