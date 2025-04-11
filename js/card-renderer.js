/**
 * Renderizador de cartas para UNO Game
 * Data: 2025-04-11 21:08:44
 * Desenvolvido por: Duduxindev
 */

class CardRenderer {
    constructor() {
      this.cardTemplates = {};
      this.cardElements = {};
    }
    
    // Inicializar renderizador
    init() {
      // Criar templates de cartas
      this.createCardTemplates();
    }
    
    // Criar templates de cartas
    createCardTemplates() {
      // Template para carta numérica
      this.cardTemplates.number = (card) => `
        <div class="card ${card.color}" data-id="${card.id}" data-color="${card.color}" data-value="${card.value}" data-type="${card.type}">
          <div class="card-inner">
            <div class="card-corners">
              <div class="card-corner top-left">${card.value}</div>
              <div class="card-corner bottom-right">${card.value}</div>
            </div>
            <div class="card-center">${card.value}</div>
          </div>
        </div>
      `;
      
      // Template para carta de ação
      this.cardTemplates.action = (card) => {
        let symbol = card.value;
        let symbolClass = '';
        
        // Definir símbolo com base no valor
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
            </div>
          </div>
        `;
      };
      
      // Template para carta curinga
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
            </div>
          </div>
        `;
      };
      
      // Template para verso da carta
      this.cardTemplates.back = () => `
        <div class="card back">
          <div class="card-inner">
            <div class="card-logo">UNO</div>
          </div>
        </div>
      `;
    }
    
    // Renderizar uma carta
    renderCard(card, isPlayable = false, showBack = false) {
      // Se é para mostrar o verso
      if (showBack) {
        return this.cardTemplates.back();
      }
      
      // Selecionar template baseado no tipo de carta
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
        default:
          cardHtml = this.cardTemplates.back();
      }
      
      // Converter HTML para elemento DOM
      const template = document.createElement('template');
      template.innerHTML = cardHtml.trim();
      const cardElement = template.content.firstChild;
      
      // Aplicar classe jogável se necessário
      if (isPlayable) {
        cardElement.classList.add('playable');
        
        // Adicionar indicador visual
        const indicator = document.createElement('div');
        indicator.className = 'playable-indicator';
        indicator.textContent = 'Jogável';
        cardElement.appendChild(indicator);
      }
      
      // Armazenar referência ao elemento
      this.cardElements[card.id] = cardElement;
      
      return cardElement;
    }
    
    // Renderizar múltiplas cartas
    renderCards(cards, container, isPlayable = (card) => false, showBack = false) {
      // Limpar container
      container.innerHTML = '';
      
      // Renderizar cada carta
      cards.forEach((card, index) => {
        const cardPlayable = isPlayable(card);
        const cardElement = this.renderCard(card, cardPlayable, showBack);
        
        // Adicionar efeito de entrada
        setTimeout(() => {
          cardElement.classList.add('in-hand');
        }, index * 100);
        
        container.appendChild(cardElement);
      });
    }
    
    // Renderizar carta do topo da pilha de descarte
    renderTopCard(card, container) {
      // Limpar container
      container.innerHTML = '';
      
      // Renderizar a carta
      const cardElement = this.renderCard(card);
      
      // Adicionar classe para efeito visual
      cardElement.classList.add('top-card');
      
      // Se a carta tem cor escolhida (para curingas)
      if (card.chosenColor) {
        cardElement.dataset.chosenColor = card.chosenColor;
        cardElement.classList.add('colored-wild');
        
        // Adicionar overlay de cor
        const overlay = document.createElement('div');
        overlay.className = `color-overlay ${card.chosenColor}`;
        cardElement.appendChild(overlay);
      }
      
      container.appendChild(cardElement);
    }
    
    // Animar carta sendo jogada
    animateCardPlay(cardElement, destination, callback) {
      // Se não há elemento de carta ou destino, não fazer nada
      if (!cardElement || !destination) {
        if (callback) callback();
        return;
      }
      
      // Obter posições
      const cardRect = cardElement.getBoundingClientRect();
      const destRect = destination.getBoundingClientRect();
      
      // Criar clone para animar
      const clone = cardElement.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.top = `${cardRect.top}px`;
      clone.style.left = `${cardRect.left}px`;
      clone.style.width = `${cardRect.width}px`;
      clone.style.height = `${cardRect.height}px`;
      clone.style.zIndex = '1000';
      clone.style.transition = 'all 0.3s ease-out';
      
      // Adicionar à página
      document.body.appendChild(clone);
      
      // Esconder carta original
      cardElement.style.opacity = '0';
      
      // Animar para o destino
      setTimeout(() => {
        clone.style.top = `${destRect.top}px`;
        clone.style.left = `${destRect.left}px`;
        clone.style.transform = 'rotate(360deg)';
      }, 50);
      
      // Remover clone após animação
      setTimeout(() => {
        document.body.removeChild(clone);
        if (callback) callback();
      }, 350);
    }
    
    // Animar compra de carta
    animateCardDraw(source, destination, card, isPlayable = false, callback) {
      // Se não há fonte ou destino, não fazer nada
      if (!source || !destination) {
        if (callback) callback();
        return;
      }
      
      // Obter posições
      const sourceRect = source.getBoundingClientRect();
      const destRect = destination.getBoundingClientRect();
      
      // Criar elemento da carta
      const cardElement = document.createElement('div');
      cardElement.className = 'card back';
      cardElement.style.position = 'fixed';
      cardElement.style.top = `${sourceRect.top}px`;
      cardElement.style.left = `${sourceRect.left}px`;
      cardElement.style.width = `${sourceRect.width}px`;
      cardElement.style.height = `${sourceRect.height}px`;
      cardElement.style.zIndex = '1000';
      cardElement.style.transition = 'all 0.3s ease-out';
      
      // Adicionar à página
      document.body.appendChild(cardElement);
      
      // Animar para o destino
      setTimeout(() => {
        cardElement.style.top = `${destRect.top}px`;
        cardElement.style.left = `${destRect.left}px`;
      }, 50);
      
      // Remover clone após animação e renderizar carta real
      setTimeout(() => {
        document.body.removeChild(cardElement);
        
        // Criar carta real
        if (card) {
          const realCard = this.renderCard(card, isPlayable);
          destination.appendChild(realCard);
          
          // Efeito de entrada
          setTimeout(() => {
            realCard.classList.add('in-hand');
          }, 50);
        }
        
        if (callback) callback();
      }, 350);
    }
  }
  
  // Inicializar renderizador de cartas globalmente
  document.addEventListener('DOMContentLoaded', () => {
    window.cardRenderer = new CardRenderer();
    window.cardRenderer.init();
    console.log("✅ Renderizador de cartas inicializado!");
  });