/**
 * Operações de Database Firebase para UNO Game
 * Data: 2025-04-11 21:42:26
 * Desenvolvido por: Duduxindev
 */

const FirebaseDB = (function() {
    console.log("🗄️ Inicializando sistema de banco de dados Firebase...");
    
    // Cache de dados
    const dataCache = {};
    
    // Referências ativas para listeners
    const activeListeners = {};
    
    // Verificar disponibilidade do Firebase
    function isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && firebase.database;
    }
    
    // Criar uma sala
    function createRoom(roomData) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        // Gerar código de sala se não fornecido
        const roomCode = roomData.code || FirebaseUtil.generateRoomCode();
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        // Definir dados da sala
        return roomRef.set({
            ...roomData,
            code: roomCode,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        })
        .then(() => {
            console.log(`✅ Sala criada com sucesso: ${roomCode}`);
            return { ...roomData, code: roomCode };
        })
        .catch(error => {
            console.error("❌ Erro ao criar sala:", error);
            throw error;
        });
    }
    
    // Obter sala por código
    function getRoom(roomCode) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        return roomRef.once('value')
            .then(snapshot => {
                const roomData = snapshot.val();
                if (!roomData) {
                    throw new Error(`Sala ${roomCode} não encontrada`);
                }
                return roomData;
            })
            .catch(error => {
                console.error(`❌ Erro ao obter sala ${roomCode}:`, error);
                throw error;
            });
    }
    
    // Atualizar sala
    function updateRoom(roomCode, updates) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        // Incluir timestamp de atualização
        const updatesWithTimestamp = {
            ...updates,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        return roomRef.update(updatesWithTimestamp)
            .then(() => {
                console.log(`✅ Sala ${roomCode} atualizada com sucesso`);
                return updatesWithTimestamp;
            })
            .catch(error => {
                console.error(`❌ Erro ao atualizar sala ${roomCode}:`, error);
                throw error;
            });
    }
    
    // Adicionar jogador a uma sala
    function addPlayerToRoom(roomCode, playerData) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        const playerRef = firebase.database().ref(`rooms/${roomCode}/players/${playerData.id}`);
        
        return playerRef.set(playerData)
            .then(() => {
                console.log(`✅ Jogador ${playerData.name} adicionado à sala ${roomCode}`);
                return playerData;
            })
            .catch(error => {
                console.error(`❌ Erro ao adicionar jogador à sala ${roomCode}:`, error);
                throw error;
            });
    }
    
    // Remover jogador de uma sala
    function removePlayerFromRoom(roomCode, playerId) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        const playerRef = firebase.database().ref(`rooms/${roomCode}/players/${playerId}`);
        
        return playerRef.remove()
            .then(() => {
                console.log(`✅ Jogador ${playerId} removido da sala ${roomCode}`);
                return true;
            })
            .catch(error => {
                console.error(`❌ Erro ao remover jogador da sala ${roomCode}:`, error);
                throw error;
            });
    }
    
    // Iniciar jogo em uma sala
    function startGame(roomCode, gameState) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        return roomRef.update({
            status: 'playing',
            game: gameState,
            gameStartedAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        })
        .then(() => {
            console.log(`✅ Jogo iniciado na sala ${roomCode}`);
            return gameState;
        })
        .catch(error => {
            console.error(`❌ Erro ao iniciar jogo na sala ${roomCode}:`, error);
            throw error;
        });
    }
    
    // Atualizar estado do jogo
    function updateGameState(roomCode, updates) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        const gameRef = firebase.database().ref(`rooms/${roomCode}/game`);
        
        return gameRef.update(updates)
            .then(() => {
                console.log(`✅ Estado do jogo atualizado na sala ${roomCode}`);
                return updates;
            })
            .catch(error => {
                console.error(`❌ Erro ao atualizar estado do jogo na sala ${roomCode}:`, error);
                throw error;
            });
    }
    
    // Adicionar mensagem ao chat
    function addChatMessage(roomCode, message) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Database não disponível");
        
        const chatRef = firebase.database().ref(`rooms/${roomCode}/messages`).push();
        
        // Incluir ID e timestamp
        const messageWithMeta = {
            ...message,
            id: chatRef.key,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        return chatRef.set(messageWithMeta)
            .then(() => {
                console.log(`✅ Mensagem adicionada ao chat da sala ${roomCode}`);
                return messageWithMeta;
            })
            .catch(error => {
                console.error(`❌ Erro ao adicionar mensagem ao chat da sala ${roomCode}:`, error);
                throw error;
            });
    }
    
    // Ouvir mudanças em uma sala
    function listenToRoom(roomCode, callback) {
        if (!isFirebaseAvailable()) return () => {}; // retorna função vazia como unsubscribe
        
        const roomRef = firebase.database().ref(`rooms/${roomCode}`);
        
        // Cancelar listener anterior se existir
        if (activeListeners[`room_${roomCode}`]) {
            activeListeners[`room_${roomCode}`]();
        }
        
        // Configurar novo listener
        roomRef.on('value', snapshot => {
            const roomData = snapshot.val();
            if (roomData) {
                // Atualizar cache
                dataCache[`room_${roomCode}`] = roomData;
                
                // Notificar listener
                if (callback && typeof callback === 'function') {
                    callback(roomData);
                }
            }
        }, error => {
            console.error(`❌ Erro ao ouvir mudanças na sala ${roomCode}:`, error);
            if (callback && typeof callback === 'function') {
                callback(null, error);
            }
        });
        
        // Função para cancelar listener
        const unsubscribe = () => {
            roomRef.off('value');
            delete activeListeners[`room_${roomCode}`];
            console.log(`ℹ️ Listener removido da sala ${roomCode}`);
        };
        
        // Armazenar função de cancelamento
        activeListeners[`room_${roomCode}`] = unsubscribe;
        
        return unsubscribe;
    }
    
    // Ouvir mudanças no jogo
    function listenToGameState(roomCode, callback) {
        if (!isFirebaseAvailable()) return () => {}; // retorna função vazia como unsubscribe
        
        const gameRef = firebase.database().ref(`rooms/${roomCode}/game`);
        
        // Cancelar listener anterior se existir
        if (activeListeners[`game_${roomCode}`]) {
            activeListeners[`game_${roomCode}`]();
        }
        
        // Configurar novo listener
        gameRef.on('value', snapshot => {
            const gameData = snapshot.val();
            
            // Notificar listener
            if (callback && typeof callback === 'function') {
                callback(gameData);
            }
        }, error => {
            console.error(`❌ Erro ao ouvir mudanças no jogo da sala ${roomCode}:`, error);
            if (callback && typeof callback === 'function') {
                callback(null, error);
            }
        });
        
        // Função para cancelar listener
        const unsubscribe = () => {
            gameRef.off('value');
            delete activeListeners[`game_${roomCode}`];
            console.log(`ℹ️ Listener removido do jogo da sala ${roomCode}`);
        };
        
        // Armazenar função de cancelamento
        activeListeners[`game_${roomCode}`] = unsubscribe;
        
        return unsubscribe;
    }
    
    // Ouvir mudanças no chat
    function listenToChat(roomCode, callback) {
        if (!isFirebaseAvailable()) return () => {}; // retorna função vazia como unsubscribe
        
        const chatRef = firebase.database().ref(`rooms/${roomCode}/messages`);
        
        // Cancelar listener anterior se existir
        if (activeListeners[`chat_${roomCode}`]) {
            activeListeners[`chat_${roomCode}`]();
        }
        
        // Configurar novo listener
        chatRef.on('child_added', snapshot => {
            const message = snapshot.val();
            
            // Notificar listener
            if (callback && typeof callback === 'function') {
                callback(message);
            }
        }, error => {
            console.error(`❌ Erro ao ouvir mudanças no chat da sala ${roomCode}:`, error);
        });
        
        // Função para cancelar listener
        const unsubscribe = () => {
            chatRef.off('child_added');
            delete activeListeners[`chat_${roomCode}`];
            console.log(`ℹ️ Listener removido do chat da sala ${roomCode}`);
        };
        
        // Armazenar função de cancelamento
        activeListeners[`chat_${roomCode}`] = unsubscribe;
        
        return unsubscribe;
    }
    
    // Remover todos os listeners ativos
    function removeAllListeners() {
        Object.values(activeListeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        
        // Limpar lista
        Object.keys(activeListeners).forEach(key => {
            delete activeListeners[key];
        });
        
        console.log("ℹ️ Todos os listeners do Firebase removidos");
    }
    
    // API pública
    return {
        createRoom,
        getRoom,
        updateRoom,
        addPlayerToRoom,
        removePlayerFromRoom,
        startGame,
        updateGameState,
        addChatMessage,
        listenToRoom,
        listenToGameState,
        listenToChat,
        removeAllListeners
    };
})();

// Expor globalmente
window.FirebaseDB = FirebaseDB;

console.log("✅ Sistema de banco de dados Firebase inicializado");