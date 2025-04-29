// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDJzk15RFwx7MuHsVeGaBMnkghuY5-c-Hc",
  authDomain: "uno-online-game.firebaseapp.com",
  databaseURL: "https://uno-online-game-default-rtdb.firebaseio.com",
  projectId: "uno-online-game",
  storageBucket: "uno-online-game.appspot.com",
  messagingSenderId: "325148128509",
  appId: "1:325148128509:web:d9d3f4b8b8b8b8b8b8b8b8"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências para serviços do Firebase
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Provedor de autenticação do Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Funções de utilidade para o Firebase
const FirebaseService = {
  // Salas
  rooms: {
    create: async (roomData) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Gerar código único para a sala
        const roomCode = generateRoomCode();
        
        // Obter avatar com garantia de valor
        const avatarUrl = getAvatarUrl(user);
        
        // Dados da sala
        const room = {
          id: roomCode,
          name: roomData.name,
          host: {
            id: user.uid,
            name: user.displayName || 'Anônimo',
            avatar: avatarUrl
          },
          players: {
            [user.uid]: {
              id: user.uid,
              name: user.displayName || 'Anônimo',
              avatar: avatarUrl,
              isHost: true,
              cards: [],
              cardsCount: 0,
              isReady: false
            }
          },
          playersCount: 1,
          maxPlayers: roomData.maxPlayers || 4,
          isPrivate: roomData.isPrivate || false,
          status: 'waiting', // 'waiting', 'playing', 'finished'
          gameMode: roomData.gameMode || 'classic',
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Salvar sala no banco de dados
        await database.ref(`rooms/${roomCode}`).set(room);
        
        return room;
      } catch (error) {
        console.error('Erro ao criar sala:', error);
        throw error;
      }
    },
    
    join: async (roomCode) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData) {
          throw new Error('Sala não encontrada');
        }
        
        // Verificar se a sala está cheia
        if (Object.keys(roomData.players || {}).length >= roomData.maxPlayers) {
          throw new Error('Sala cheia');
        }
        
        // Verificar se o jogo já começou
        if (roomData.status === 'playing') {
          throw new Error('Jogo já em andamento');
        }
        
        // Obter avatar com garantia de valor
        const avatarUrl = getAvatarUrl(user);
        
        // Adicionar jogador à sala
        await database.ref(`rooms/${roomCode}/players/${user.uid}`).set({
          id: user.uid,
          name: user.displayName || 'Anônimo',
          avatar: avatarUrl, // Agora garantimos que avatarUrl nunca será undefined
          isHost: false,
          cards: [],
          cardsCount: 0,
          isReady: false
        });
        
        // Atualizar contador de jogadores
        await database.ref(`rooms/${roomCode}/playersCount`).set(
          Object.keys(roomData.players || {}).length + 1
        );
        
        // Atualizar timestamp
        await database.ref(`rooms/${roomCode}/updatedAt`).set(
          firebase.database.ServerValue.TIMESTAMP
        );
        
        return roomData;
      } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        throw error;
      }
    },
    
    leave: async (roomCode) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData) {
          throw new Error('Sala não encontrada');
        }
        
        // Remover jogador da sala
        await database.ref(`rooms/${roomCode}/players/${user.uid}`).remove();
        
        // Verificar se a sala ficou vazia
        const playersSnapshot = await database.ref(`rooms/${roomCode}/players`).once('value');
        const players = playersSnapshot.val() || {};
        
        if (Object.keys(players).length === 0) {
          // Se a sala ficou vazia, remover a sala
          await database.ref(`rooms/${roomCode}`).remove();
          return null;
        }
        
        // Atualizar contador de jogadores
        await database.ref(`rooms/${roomCode}/playersCount`).set(
          Object.keys(players).length
        );
        
        // Se o jogador era o host, transferir host para outro jogador
        if (roomData.host.id === user.uid) {
          const newHostId = Object.keys(players)[0];
          const newHostData = players[newHostId];
          
          // Atualizar host
          await database.ref(`rooms/${roomCode}/host`).set({
            id: newHostId,
            name: newHostData.name,
            avatar: newHostData.avatar
          });
          
          // Marcar novo host
          await database.ref(`rooms/${roomCode}/players/${newHostId}/isHost`).set(true);
        }
        
        return roomData;
      } catch (error) {
        console.error('Erro ao sair da sala:', error);
        throw error;
      }
    },
    
    list: async (filter = 'all') => {
      try {
        const roomsRef = database.ref('rooms');
        
        // Aplicar filtros
        let query = roomsRef;
        
        if (filter === 'public') {
          query = query.orderByChild('isPrivate').equalTo(false);
        }
        
        const snapshot = await query.once('value');
        const rooms = snapshot.val() || {};
        
        return Object.values(rooms);
      } catch (error) {
        console.error('Erro ao listar salas:', error);
        throw error;
      }
    },
    
    get: async (roomCode) => {
      try {
        const snapshot = await database.ref(`rooms/${roomCode}`).once('value');
        return snapshot.val();
      } catch (error) {
        console.error('Erro ao obter sala:', error);
        throw error;
      }
    },
    
    update: async (roomCode, data) => {
      try {
        await database.ref(`rooms/${roomCode}`).update({
          ...data,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
      } catch (error) {
        console.error('Erro ao atualizar sala:', error);
        throw error;
      }
    }
  },
  
  // Jogo
  game: {
    start: async (roomCode) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData) {
          throw new Error('Sala não encontrada');
        }
        
        // Verificar se o usuário é o host
        if (roomData.host.id !== user.uid) {
          throw new Error('Apenas o host pode iniciar o jogo');
        }
        
        // Verificar se há jogadores suficientes
        if (Object.keys(roomData.players || {}).length < 2) {
          throw new Error('São necessários pelo menos 2 jogadores');
        }
        
        // Inicializar jogo
        const game = initializeGame(roomData);
        
        // Atualizar status da sala
        await database.ref(`rooms/${roomCode}/status`).set('playing');
        
        // Salvar jogo no banco de dados
        await database.ref(`rooms/${roomCode}/game`).set(game);
        
        // Distribuir cartas para os jogadores (secretas)
        const playerIds = Object.keys(roomData.players);
        
        for (const playerId of playerIds) {
          const cards = game.players[playerId].cards;
          const cardsCount = cards.length;
          
          await database.ref(`rooms/${roomCode}/players/${playerId}/cardsCount`).set(cardsCount);
          await database.ref(`rooms/${roomCode}/players/${playerId}/cards`).set(cards);
        }
        
        // Registrar início do jogo no histórico
        await database.ref(`rooms/${roomCode}/gameHistory`).push({
          type: 'gameStart',
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        return game;
      } catch (error) {
        console.error('Erro ao iniciar jogo:', error);
        throw error;
      }
    },
    
    playCard: async (roomCode, cardIndex) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error('Jogo não encontrado');
        }
        
        // Verificar se é a vez do jogador
        if (roomData.game.currentPlayer !== user.uid) {
          throw new Error('Não é sua vez de jogar');
        }
        
        // Obter a carta do jogador
        const playerCards = await database.ref(`rooms/${roomCode}/players/${user.uid}/cards`).once('value');
        const cards = playerCards.val() || [];
        
        if (cardIndex < 0 || cardIndex >= cards.length) {
          throw new Error('Carta inválida');
        }
        
        const card = cards[cardIndex];
        
        // Verificar se a carta pode ser jogada
        const topCard = roomData.game.discardPile[roomData.game.discardPile.length - 1];
        
        if (!canPlayCard(card, topCard, roomData.game.currentColor)) {
          throw new Error('Carta inválida para o jogo atual');
        }
        
        // Remover carta da mão do jogador
        cards.splice(cardIndex, 1);
        
        // Atualizar cartas do jogador
        await database.ref(`rooms/${roomCode}/players/${user.uid}/cards`).set(cards);
        await database.ref(`rooms/${roomCode}/players/${user.uid}/cardsCount`).set(cards.length);
        
        // Adicionar carta ao monte de descarte
        const updatedDiscardPile = [...roomData.game.discardPile, card];
        await database.ref(`rooms/${roomCode}/game/discardPile`).set(updatedDiscardPile);
        
        // Registrar jogada no histórico
        await database.ref(`rooms/${roomCode}/gameHistory`).push({
          type: 'playCard',
          playerId: user.uid,
          playerName: roomData.players[user.uid].name,
          card: card,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Processar efeitos da carta
        await processCardEffects(roomCode, card);
        
        // Verificar se o jogador venceu
        if (cards.length === 0) {
          await endGame(roomCode, user.uid);
          return;
        }
        
        // Verificar se o jogador tem apenas uma carta (UNO)
        if (cards.length === 1) {
          await database.ref(`rooms/${roomCode}/players/${user.uid}/hasCalledUno`).set(false);
        }
        
        // Próximo jogador
        if (!roomData.game.skipTurn) {
          await nextTurn(roomCode);
        } else {
          await database.ref(`rooms/${roomCode}/game/skipTurn`).set(false);
        }
      } catch (error) {
        console.error('Erro ao jogar carta:', error);
        throw error;
      }
    },
    
    drawCard: async (roomCode) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error('Jogo não encontrado');
        }
        
        // Verificar se é a vez do jogador
        if (roomData.game.currentPlayer !== user.uid) {
          throw new Error('Não é sua vez de jogar');
        }
        
        // Obter carta do monte
        const currentDeck = roomData.game.drawPile;
        
        // Verificar se o monte tem cartas
        if (currentDeck.length === 0) {
          // Reciclar o monte de descarte
          const discardPile = roomData.game.discardPile;
          const topCard = discardPile.pop();
          
          // Embaralhar o resto das cartas
          const newDeck = shuffleArray([...discardPile]);
          
          // Atualizar monte e descarte
          await database.ref(`rooms/${roomCode}/game/drawPile`).set(newDeck);
          await database.ref(`rooms/${roomCode}/game/discardPile`).set([topCard]);
          
          // Continuar com a compra
          await drawCardFromDeck(roomCode, user.uid);
        } else {
          await drawCardFromDeck(roomCode, user.uid);
        }
        
        // Registrar compra no histórico
        await database.ref(`rooms/${roomCode}/gameHistory`).push({
          type: 'drawCard',
          playerId: user.uid,
          playerName: roomData.players[user.uid].name,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Próximo jogador
        await nextTurn(roomCode);
      } catch (error) {
        console.error('Erro ao comprar carta:', error);
        throw error;
      }
    },
    
    callUno: async (roomCode) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error('Jogo não encontrado');
        }
        
        // Verificar se o jogador está no jogo
        if (!roomData.players[user.uid]) {
          throw new Error('Jogador não está no jogo');
        }
        
        // Verificar se o jogador tem apenas uma carta
        const playerCards = await database.ref(`rooms/${roomCode}/players/${user.uid}/cards`).once('value');
        const cards = playerCards.val() || [];
        
        if (cards.length === 1) {
          // Marcar que o jogador chamou UNO
          await database.ref(`rooms/${roomCode}/players/${user.uid}/hasCalledUno`).set(true);
          
          // Registrar UNO no histórico
          await database.ref(`rooms/${roomCode}/gameHistory`).push({
            type: 'callUno',
            playerId: user.uid,
            playerName: roomData.players[user.uid].name,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
        } else {
          throw new Error('Você só pode chamar UNO quando tiver apenas uma carta');
        }
      } catch (error) {
        console.error('Erro ao chamar UNO:', error);
        throw error;
      }
    },
    
    catchUno: async (roomCode, targetPlayerId) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error('Jogo não encontrado');
        }
        
        // Verificar se o jogador alvo está no jogo
        if (!roomData.players[targetPlayerId]) {
          throw new Error('Jogador alvo não está no jogo');
        }
        
        // Verificar se o jogador alvo tem apenas uma carta e não chamou UNO
        const targetPlayerSnapshot = await database.ref(`rooms/${roomCode}/players/${targetPlayerId}`).once('value');
        const targetPlayer = targetPlayerSnapshot.val();
        
        if (targetPlayer.cardsCount === 1 && targetPlayer.hasCalledUno === false) {
          // Penalizar o jogador com +2 cartas
          for (let i = 0; i < 2; i++) {
            await drawCardFromDeck(roomCode, targetPlayerId);
          }
          
          // Registrar penalidade no histórico
          await database.ref(`rooms/${roomCode}/gameHistory`).push({
            type: 'penaltyUno',
            playerId: user.uid,
            playerName: roomData.players[user.uid].name,
            targetPlayerId: targetPlayerId,
            targetPlayerName: targetPlayer.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
        } else {
          throw new Error('Este jogador não pode ser penalizado por UNO');
        }
      } catch (error) {
        console.error('Erro ao pegar UNO:', error);
        throw error;
      }
    },
    
    chooseColor: async (roomCode, color) => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuário não autenticado');
        
        // Verificar se a sala existe
        const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData || !roomData.game) {
          throw new Error('Jogo não encontrado');
        }
        
        // Verificar se é a vez do jogador
        if (roomData.game.currentPlayer !== user.uid) {
          throw new Error('Não é sua vez de jogar');
        }
        
        // Verificar se a cor é válida
        const validColors = ['red', 'blue', 'green', 'yellow'];
        if (!validColors.includes(color)) {
          throw new Error('Cor inválida');
        }
        
        // Atualizar cor atual
        await database.ref(`rooms/${roomCode}/game/currentColor`).set(color);
        
        // Registrar escolha de cor no histórico
        await database.ref(`rooms/${roomCode}/gameHistory`).push({
          type: 'chooseColor',
          playerId: user.uid,
          playerName: roomData.players[user.uid].name,
          color: color,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Próximo jogador
        await nextTurn(roomCode);
      } catch (error) {
        console.error('Erro ao escolher cor:', error);
        throw error;
      }
    }
  }
};

// Funções auxiliares
function generateRoomCode() {
  let code = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

function getAvatarUrl(user) {
  // Prioridade: 1. avatar URL do localStorage, 2. avatar semente do localStorage, 3. photoURL do usuário, 4. avatar gerado do uid
  const avatarURL = localStorage.getItem('avatarURL');
  const avatarSeed = localStorage.getItem('avatar');
  
  if (avatarURL) {
    return avatarURL;
  } else if (avatarSeed) {
    return `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
  } else if (user && user.photoURL) {
    return user.photoURL;
  } else {
    // Gerar um avatar fixo baseado no UID para evitar mudanças
    // Garantimos que sempre haja um valor, mesmo se o user.uid for undefined
    const fixedSeed = user && user.uid ? user.uid.substring(0, 8) : 'default';
    return `https://api.dicebear.com/6.x/avataaars/svg?seed=${fixedSeed}`;
  }
}

function initializeGame(roomData) {
  // Criar baralho completo
  const deck = createDeck(roomData.gameMode === 'special');
  
  // Embaralhar
  const shuffledDeck = shuffleArray(deck);
  
  // Distribuir cartas para os jogadores
  const players = {};
  const playerIds = Object.keys(roomData.players);
  const cardsPerPlayer = 7;
  
  for (const playerId of playerIds) {
    const playerCards = shuffledDeck.splice(0, cardsPerPlayer);
    players[playerId] = {
      ...roomData.players[playerId],
      cards: playerCards,
      cardsCount: playerCards.length,
      hasCalledUno: false
    };
  }
  
  // Primeira carta do monte de descarte (não pode ser especial)
  let discardPile = [];
  let initialCard;
  
  do {
    initialCard = shuffledDeck.pop();
    // Se for uma carta especial, devolvê-la ao baralho e embaralhar novamente
    if (initialCard.type === 'wild' || initialCard.type === 'wild-draw-four' || initialCard.type === 'special') {
      shuffledDeck.unshift(initialCard);
      shuffleArray(shuffledDeck);
    } else {
      discardPile.push(initialCard);
      break;
    }
  } while (true);
  
  // Definir jogador inicial
  const firstPlayerIndex = Math.floor(Math.random() * playerIds.length);
  const currentPlayer = playerIds[firstPlayerIndex];
  
  // Criar objeto do jogo
  const game = {
    drawPile: shuffledDeck,
    discardPile: discardPile,
    currentPlayer: currentPlayer,
    currentColor: initialCard.color,
    direction: 1, // 1 = horário, -1 = anti-horário
    skipTurn: false,
    gameMode: roomData.gameMode,
    players: players,
    startedAt: firebase.database.ServerValue.TIMESTAMP,
    lastUpdate: firebase.database.ServerValue.TIMESTAMP
  };
  
  return game;
}

function createDeck(includeSpecialCards = false) {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw-two'];
  
  const deck = [];
  
  // Cartas numéricas e de ação (coloridas)
  for (const color of colors) {
    // Um zero por cor
    deck.push({
      type: 'number',
      color: color,
      value: '0'
    });
    
    // Dois de cada dos outros valores
    for (const value of values.slice(1)) {
      // Se é um número ou ação
      const type = isNaN(parseInt(value)) ? 'action' : 'number';
      
      // Duas cartas de cada
      for (let i = 0; i < 2; i++) {
        deck.push({
          type: type,
          color: color,
          value: value
        });
      }
    }
  }
  
  // Cartas coringas (sem cor)
  for (let i = 0; i < 4; i++) {
    deck.push({
      type: 'wild',
      color: null,
      value: 'wild'
    });
    
    deck.push({
      type: 'wild-draw-four',
      color: null,
      value: 'wild-draw-four'
    });
  }
  
  // Cartas especiais para o modo especial
  if (includeSpecialCards) {
    // Carta rara +99 (0.5% de chance)
    if (Math.random() < 0.005) {
      deck.push({
        type: 'special',
        color: null,
        value: 'draw-ninetynine'
      });
    }
  }
  
  return deck;
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function canPlayCard(card, topCard, currentColor) {
  // Coringas podem ser jogados a qualquer momento
  if (card.type === 'wild' || card.type === 'wild-draw-four' || card.type === 'special') {
    return true;
  }
  
  // Se a cor é a mesma
  if (card.color === currentColor) {
    return true;
  }
  
  // Se o valor é o mesmo
  if (card.value === topCard.value) {
    return true;
  }
  
  return false;
}

async function processCardEffects(roomCode, card) {
  // Efeitos de cartas
  switch (card.value) {
    case 'skip':
      // Pular próximo jogador
      await database.ref(`rooms/${roomCode}/game/skipTurn`).set(true);
      await nextTurn(roomCode); // Avança para pular o jogador
      break;
    
    case 'reverse':
      // Inverter direção
      const roomSnapshot = await database.ref(`rooms/${roomCode}/game/direction`).once('value');
      const currentDirection = roomSnapshot.val();
      await database.ref(`rooms/${roomCode}/game/direction`).set(currentDirection * -1);
      break;
    
    case 'draw-two':
      // Próximo jogador compra 2 cartas
      const nextPlayerId = await getNextPlayer(roomCode);
      for (let i = 0; i < 2; i++) {
        await drawCardFromDeck(roomCode, nextPlayerId);
      }
      break;
    
    case 'wild':
      // Escolher cor (já implementado no chooseColor)
      await database.ref(`rooms/${roomCode}/game/awaitingColorChoice`).set(true);
      break;
    
    case 'wild-draw-four':
      // Próximo jogador compra 4 cartas e escolher cor
      const nextPlayerForDrawFour = await getNextPlayer(roomCode);
      for (let i = 0; i < 4; i++) {
        await drawCardFromDeck(roomCode, nextPlayerForDrawFour);
      }
      await database.ref(`rooms/${roomCode}/game/awaitingColorChoice`).set(true);
      break;
    
    case 'draw-ninetynine':
      // Próximo jogador compra 99 cartas
      const nextPlayerForDrawNinetyNine = await getNextPlayer(roomCode);
      for (let i = 0; i < 99; i++) {
        await drawCardFromDeck(roomCode, nextPlayerForDrawNinetyNine);
      }
      await database.ref(`rooms/${roomCode}/game/awaitingColorChoice`).set(true);
      break;
  }
  
  // Atualizar cor atual com base na carta jogada
  if (card.color) {
    await database.ref(`rooms/${roomCode}/game/currentColor`).set(card.color);
  }
}

async function drawCardFromDeck(roomCode, playerId) {
  // Obter o baralho atual
  const deckSnapshot = await database.ref(`rooms/${roomCode}/game/drawPile`).once('value');
  const deck = deckSnapshot.val() || [];
  
  // Verificar se o baralho está vazio
  if (deck.length === 0) {
    // Reciclar o monte de descarte
    const discardPileSnapshot = await database.ref(`rooms/${roomCode}/game/discardPile`).once('value');
    const discardPile = discardPileSnapshot.val() || [];
    
    // Manter apenas a carta de cima no descarte
    const topCard = discardPile.pop();
    
    // Embaralhar o resto e usar como novo monte
    const newDeck = shuffleArray([...discardPile]);
    
    // Atualizar monte e descarte
    await database.ref(`rooms/${roomCode}/game/drawPile`).set(newDeck);
    await database.ref(`rooms/${roomCode}/game/discardPile`).set([topCard]);
    
    // Pegar a primeira carta do novo monte
    const drawnCard = newDeck.pop();
    await database.ref(`rooms/${roomCode}/game/drawPile`).set(newDeck);
    
    // Adicionar carta à mão do jogador
    const playerCardsSnapshot = await database.ref(`rooms/${roomCode}/players/${playerId}/cards`).once('value');
    const playerCards = playerCardsSnapshot.val() || [];
    
    playerCards.push(drawnCard);
    await database.ref(`rooms/${roomCode}/players/${playerId}/cards`).set(playerCards);
    await database.ref(`rooms/${roomCode}/players/${playerId}/cardsCount`).set(playerCards.length);
  } else {
    // Remover carta do topo do monte
    const drawnCard = deck.pop();
    
    // Atualizar monte
    await database.ref(`rooms/${roomCode}/game/drawPile`).set(deck);
    
    // Adicionar carta à mão do jogador
    const playerCardsSnapshot = await database.ref(`rooms/${roomCode}/players/${playerId}/cards`).once('value');
    const playerCards = playerCardsSnapshot.val() || [];
    
    playerCards.push(drawnCard);
    await database.ref(`rooms/${roomCode}/players/${playerId}/cards`).set(playerCards);
    await database.ref(`rooms/${roomCode}/players/${playerId}/cardsCount`).set(playerCards.length);
  }
}

async function getNextPlayer(roomCode) {
  const gameSnapshot = await database.ref(`rooms/${roomCode}/game`).once('value');
  const game = gameSnapshot.val();
  
  if (!game) return null;
  
  const playerIds = Object.keys(game.players);
  const currentPlayerIndex = playerIds.indexOf(game.currentPlayer);
  
  let nextIndex = (currentPlayerIndex + game.direction) % playerIds.length;
  
  // Ajustar para valor positivo se ficar negativo
  if (nextIndex < 0) nextIndex = playerIds.length + nextIndex;
  
  return playerIds[nextIndex];
}

async function nextTurn(roomCode) {
  const nextPlayerId = await getNextPlayer(roomCode);
  
  if (nextPlayerId) {
    await database.ref(`rooms/${roomCode}/game/currentPlayer`).set(nextPlayerId);
    await database.ref(`rooms/${roomCode}/game/lastUpdate`).set(firebase.database.ServerValue.TIMESTAMP);
  }
}

async function endGame(roomCode, winnerId) {
  try {
    // Obter dados da sala
    const roomSnapshot = await database.ref(`rooms/${roomCode}`).once('value');
    const roomData = roomSnapshot.val();
    
    if (!roomData) return;
    
    // Marcar sala como finalizada
    await database.ref(`rooms/${roomCode}/status`).set('finished');
    
    // Registrar vencedor e estatísticas
    await database.ref(`rooms/${roomCode}/game/winner`).set({
      id: winnerId,
      name: roomData.players[winnerId].name,
      avatar: roomData.players[winnerId].avatar
    });
    
    // Calcular pontuação (cartas restantes dos outros jogadores)
    const playerIds = Object.keys(roomData.players);
    let totalScore = 0;
    
    for (const playerId of playerIds) {
      if (playerId !== winnerId) {
        const playerCardsSnapshot = await database.ref(`rooms/${roomCode}/players/${playerId}/cards`).once('value');
        const playerCards = playerCardsSnapshot.val() || [];
        
        let playerScore = 0;
        for (const card of playerCards) {
          if (card.type === 'number') {
            playerScore += parseInt(card.value) || 0;
          } else if (card.type === 'action') {
            playerScore += 20;
          } else if (card.type === 'wild' || card.type === 'wild-draw-four') {
            playerScore += 50;
          } else if (card.type === 'special') {
            playerScore += 99;
          }
        }
        
        totalScore += playerScore;
      }
    }
    
    // Salvar pontuação do vencedor
    await database.ref(`rooms/${roomCode}/game/score`).set(totalScore);
    
    // Registrar fim do jogo no histórico
    await database.ref(`rooms/${roomCode}/gameHistory`).push({
      type: 'gameEnd',
      winnerId: winnerId,
      winnerName: roomData.players[winnerId].name,
      score: totalScore,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Atualizar estatísticas do jogador vencedor
    await updatePlayerStats(winnerId, totalScore);
  } catch (error) {
    console.error('Erro ao finalizar jogo:', error);
    throw error;
  }
}

async function updatePlayerStats(playerId, score) {
  try {
    // Obter estatísticas atuais
    const statsRef = database.ref(`users/${playerId}/stats`);
    const statsSnapshot = await statsRef.once('value');
    const stats = statsSnapshot.val() || {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      highestScore: 0
    };
    
    // Atualizar estatísticas
    stats.gamesPlayed += 1;
    stats.gamesWon += 1;
    stats.totalScore += score;
    
    if (score > stats.highestScore) {
      stats.highestScore = score;
    }
    
    // Salvar estatísticas atualizadas
    await statsRef.set(stats);
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}

// Exportar FirebaseService
window.FirebaseService = FirebaseService;