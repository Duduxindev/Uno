/**
 * Sistema de IA para jogadores UNO Game
 * Data: 2025-04-11 21:16:07
 * Desenvolvido por: Duduxindev
 */

class AIPlayer {
    constructor(difficulty = 'normal') {
      this.difficulty = difficulty; // 'easy', 'normal', 'hard'
      this.delayBetweenActions = this.getDelayForDifficulty();
    }
    
    // Obter atraso entre ações com base na dificuldade
    getDelayForDifficulty() {
      switch(this.difficulty) {
        case 'easy': return 2000; // Mais lento
        case 'hard': return 800;  // Mais rápido
        case 'normal':
        default: return 1200;     // Médio
      }
    }
    
    // Escolher ação do jogador IA
    chooseAction(hand, topCard, currentColor, otherPlayers) {
      return new Promise(resolve => {
        // Simular "pensamento" com um atraso
        setTimeout(() => {
          // Verificar cartas jogáveis
          const playableCards = this.getPlayableCards(hand, topCard, currentColor);
          
          // Se não tiver nenhuma carta jogável, comprar
          if (playableCards.length === 0) {
            resolve({ action: 'draw' });
            return;
          }
          
          // Escolher melhor carta com base na dificuldade
          const selectedCard = this.chooseBestCard(playableCards, hand, otherPlayers);
          
          // Se for uma carta curinga, escolher a melhor cor
          if (selectedCard.type === 'wild') {
            const chosenColor = this.chooseBestColor(hand);
            resolve({ 
              action: 'play', 
              card: selectedCard, 
              chosenColor: chosenColor 
            });
          } else {
            resolve({ action: 'play', card: selectedCard });
          }
        }, this.delayBetweenActions);
      });
    }
    
    // Obter cartas jogáveis
    getPlayableCards(hand, topCard, currentColor) {
      return hand.filter(card => {
        // Curingas são sempre jogáveis
        if (card.type === 'wild') {
          return true;
        }
        
        // Mesma cor
        if (card.color === currentColor) {
          return true;
        }
        
        // Mesmo valor/símbolo
        if (card.value === topCard.value) {
          return true;
        }
        
        return false;
      });
    }
    
    // Escolher a melhor carta com base na dificuldade
    chooseBestCard(playableCards, hand, otherPlayers) {
      switch(this.difficulty) {
        case 'easy':
          // IA fácil: escolhe carta aleatória
          return this.chooseRandomCard(playableCards);
          
        case 'hard':
          // IA difícil: estratégia avançada
          return this.chooseStrategicCard(playableCards, hand, otherPlayers);
          
        case 'normal':
        default:
          // IA normal: estratégia básica
          return this.chooseBasicStrategyCard(playableCards, hand);
      }
    }
    
    // Escolher carta aleatória (IA fácil)
    chooseRandomCard(playableCards) {
      return playableCards[Math.floor(Math.random() * playableCards.length)];
    }
    
    // Escolher carta com estratégia básica (IA normal)
    chooseBasicStrategyCard(playableCards, hand) {
      // Priorizar cartas na seguinte ordem:
      // 1. Cartas especiais (+4, +2, Skip, Reverse)
      // 2. Cartas numéricas
      // 3. Curingas regulares
      
      // Verificar se tem cartas especiais
      const specialCards = playableCards.filter(card => {
        return card.value === 'wild-draw-four' ||
               card.value === 'draw2' ||
               card.value === 'skip' ||
               card.value === 'reverse';
      });
      
      if (specialCards.length > 0) {
        return specialCards[Math.floor(Math.random() * specialCards.length)];
      }
      
      // Cartas numéricas
      const numberCards = playableCards.filter(card => card.type === 'number');
      if (numberCards.length > 0) {
        // Escolher carta com valor mais alto
        numberCards.sort((a, b) => parseInt(b.value) - parseInt(a.value));
        return numberCards[0];
      }
      
      // Curingas regulares
      const wildcards = playableCards.filter(card => card.type === 'wild' && card.value === 'wild');
      if (wildcards.length > 0) {
        return wildcards[0];
      }
      
      // Caso não encontre nada (não deve acontecer)
      return playableCards[0];
    }
    
    // Escolher carta com estratégia avançada (IA difícil)
    chooseStrategicCard(playableCards, hand, otherPlayers) {
      // Verificar se algum oponente está com uma carta
      const opponentWithOneCard = otherPlayers.find(p => p.cardCount === 1);
      
      if (opponentWithOneCard) {
        // Priorizar cartas que atrapalham o oponente prestes a vencer
        const blockingCards = playableCards.filter(card => {
          return card.value === 'wild-draw-four' || 
                 card.value === 'draw2' || 
                 card.value === 'skip' || 
                 card.value === 'reverse';
        });
        
        if (blockingCards.length > 0) {
          // Escolher +4 primeiro, depois +2, depois skip/reverse
          blockingCards.sort((a, b) => {
            if (a.value === 'wild-draw-four') return -1;
            if (b.value === 'wild-draw-four') return 1;
            if (a.value === 'draw2') return -1;
            if (b.value === 'draw2') return 1;
            return 0;
          });
          
          return blockingCards[0];
        }
      }
      
      // Verificar qual cor tem mais cartas na mão
      const colorCount = this.countCardColors(hand);
      
      // Tentar jogar da cor mais abundante
      const mostFrequentColor = this.getMostFrequentColor(colorCount);
      
      // Procurar cartas dessa cor
      const sameColorCards = playableCards.filter(card => card.color === mostFrequentColor);
      
      if (sameColorCards.length > 0) {
        // Priorizar cartas especiais
        const specialCards = sameColorCards.filter(card => 
          card.type === 'action' || card.type === 'wild'
        );
        
        if (specialCards.length > 0) {
          return specialCards[0];
        }
        
        // Se não tiver especiais, escolher numérica mais alta
        sameColorCards.sort((a, b) => parseInt(b.value) - parseInt(a.value));
        return sameColorCards[0];
      }
      
      // Se não conseguir otimizar por cor, aplicar estratégia básica
      return this.chooseBasicStrategyCard(playableCards, hand);
    }
    
    // Escolher a melhor cor para cartas curinga
    chooseBestColor(hand) {
      // Contar cartas por cor
      const colorCount = this.countCardColors(hand);
      
      // Escolher a cor mais presente na mão
      const mostFrequentColor = this.getMostFrequentColor(colorCount);
      
      // Se não há uma cor predominante, escolher aleatória
      if (mostFrequentColor === null) {
        const colors = ['red', 'blue', 'green', 'yellow'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      
      return mostFrequentColor;
    }
    
    // Contar cartas por cor
    countCardColors(hand) {
      const colorCount = {
        red: 0,
        blue: 0,
        green: 0,
        yellow: 0
      };
      
      // Contar cartas que não são pretas/curingas
      hand.forEach(card => {
        if (card.color !== 'black' && colorCount.hasOwnProperty(card.color)) {
          colorCount[card.color]++;
        }
      });
      
      return colorCount;
    }
    
    // Obter cor mais frequente
    getMostFrequentColor(colorCount) {
      let mostFrequentColor = null;
      let highestCount = 0;
      
      for (const color in colorCount) {
        if (colorCount[color] > highestCount) {
          highestCount = colorCount[color];
          mostFrequentColor = color;
        }
      }
      
      return mostFrequentColor;
    }
    
    // Decidir se chamar UNO
    decideToCallUno(hand) {
      // Verificar se precisa chamar UNO
      if (hand.length !== 1) {
        return false;
      }
      
      // Probabilidade de chamar UNO depende da dificuldade
      let probability;
      
      switch(this.difficulty) {
        case 'easy': probability = 0.5; break;  // Mais chance de esquecer
        case 'hard': probability = 0.9; break;  // Raro esquecer
        case 'normal':
        default: probability = 0.7; break;      // Esquece às vezes
      }
      
      return Math.random() < probability;
    }
    
    // Decidir se chamar UNO em outro jogador
    decideToCallUnoOnOther(otherPlayersWithOneCard) {
      // Se não há ninguém com uma carta, não fazer nada
      if (otherPlayersWithOneCard.length === 0) {
        return null;
      }
      
      // Probabilidade de pegar outro jogador depende da dificuldade
      let probability;
      
      switch(this.difficulty) {
        case 'easy': probability = 0.3; break;  // Frequentemente não percebe
        case 'hard': probability = 0.9; break;  // Quase nunca deixa passar
        case 'normal':
        default: probability = 0.6; break;      // Percebe às vezes
      }
      
      if (Math.random() < probability) {
        // Escolher um jogador aleaório da lista
        return otherPlayersWithOneCard[Math.floor(Math.random() * otherPlayersWithOneCard.length)];
      }
      
      return null;
    }
  }
  
  // Exportar para uso global
  window.AIPlayer = AIPlayer;
  console.log("✅ Sistema de IA inicializado!");