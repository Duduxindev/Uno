/**
 * Sistema de jogadores para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

class Player {
    constructor(id, name, isAI = false) {
      this.id = id;
      this.name = name;
      this.isAI = isAI;
      this.cards = [];
      this.hasCalledUno = false;
      this.skipTurn = false;
      this.disconnected = false;
      this.avatar = this.generateAvatar();
      this.color = this.generateColor();
      this.joinedAt = Date.now();
    }
    
    // Gerar uma cor aleatória para o jogador
    generateColor() {
      const colors = [
        '#3498db', '#2ecc71', '#e74c3c', '#f1c40f', 
        '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Gerar um avatar aleatório para o jogador
    generateAvatar() {
      // Usar número aleatório como seed para consistência
      const seed = this.id ? this.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) : Math.random();
      return `https://avatars.dicebear.com/api/identicon/${seed}.svg`;
    }
    
    // Adicionar uma carta à mão do jogador
    addCard(card) {
      this.cards.push(card);
      this.hasCalledUno = false;
    }
    
    // Remover uma carta da mão do jogador
    removeCard(cardId) {
      const index = this.cards.findIndex(card => card.id === cardId);
      if (index !== -1) {
        return this.cards.splice(index, 1)[0];
      }
      return null;
    }
    
    // Verificar se o jogador tem uma carta específica
    hasCard(cardId) {
      return this.cards.some(card => card.id === cardId);
    }
    
    // Verificar se o jogador pode jogar uma carta específica na condição atual
    canPlayCard(card, topCard, currentColor) {
      // Curingas podem ser jogados a qualquer momento
      if (card.type === 'wild') {
        return true;
      }
      
      // Mesma cor
      if (card.color === currentColor) {
        return true;
      }
      
      // Mesmo valor/ação
      if (topCard && card.value === topCard.value) {
        return true;
      }
      
      return false;
    }
    
    // Obter cartas jogáveis
    getPlayableCards(topCard, currentColor) {
      return this.cards.filter(card => this.canPlayCard(card, topCard, currentColor));
    }
    
    // Converter para formato para Firebase
    toFirebase() {
      return {
        id: this.id,
        name: this.name,
        isAI: this.isAI,
        avatar: this.avatar,
        color: this.color,
        cardCount: this.cards.length,
        hasCalledUno: this.hasCalledUno,
        disconnected: this.disconnected,
        joinedAt: this.joinedAt
      };
    }
    
    // Criar jogador a partir de dados do Firebase
    static fromFirebase(data) {
      const player = new Player(data.id, data.name, data.isAI);
      player.avatar = data.avatar;
      player.color = data.color;
      player.hasCalledUno = data.hasCalledUno || false;
      player.disconnected = data.disconnected || false;
      player.joinedAt = data.joinedAt || Date.now();
      return player;
    }
  }
  
  // Classe para gerenciar jogadores no jogo
  class PlayerManager {
    constructor() {
      this.players = [];
      this.currentPlayerIndex = 0;
      this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    }
    
    // Adicionar um jogador
    addPlayer(player) {
      this.players.push(player);
      return player;
    }
    
    // Remover um jogador
    removePlayer(playerId) {
      const index = this.players.findIndex(p => p.id === playerId);
      if (index !== -1) {
        return this.players.splice(index, 1)[0];
      }
      return null;
    }
    
    // Obter jogador por ID
    getPlayer(playerId) {
      return this.players.find(p => p.id === playerId);
    }
    
    // Obter jogador atual
    getCurrentPlayer() {
      return this.players[this.currentPlayerIndex];
    }
    
    // Avançar para o próximo jogador
    nextPlayer() {
      // Atualizar índice do jogador atual
      this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
      return this.getCurrentPlayer();
    }
    
    // Inverter direção do jogo
    reverseDirection() {
      this.direction *= -1;
    }
    
    // Distribuir cartas para todos os jogadores
    dealCards(deck, cardsPerPlayer = 7) {
      this.players.forEach(player => {
        for (let i = 0; i < cardsPerPlayer; i++) {
          const card = deck.drawCard();
          if (card) {
            player.addCard(card);
          }
        }
      });
    }
    
    // Verificar se há um vencedor
    checkForWinner() {
      return this.players.find(player => player.cards.length === 0);
    }
  }
  
  console.log("✅ Sistema de jogadores inicializado!");