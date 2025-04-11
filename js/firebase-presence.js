/**
 * Sistema de Presença Online para UNO Game
 * Data: 2025-04-11 21:42:26
 * Desenvolvido por: Duduxindev
 */

const FirebasePresence = (function() {
    console.log("👥 Inicializando sistema de presença Firebase...");
    
    // Referências no banco de dados
    let userStatusRef = null;
    let myConnectionRef = null;
    let userListRef = null;
    
    // Dados do usuário
    let userData = {
        id: null,
        name: 'Anônimo',
        status: 'online',
        lastActive: Date.now(),
        roomId: null
    };
    
    // Callback para quando usuários online mudam
    let onlineUsersCallback = null;
    
    // Inicializar sistema de presença
    function init(userId, userName) {
        if (typeof firebase === 'undefined' || !firebase.database) {
            console.error("❌ Firebase não disponível para inicializar presença");
            return;
        }
        
        // Definir dados do usuário
        userData.id = userId || 'anon_' + Date.now();
        userData.name = userName || 'Jogador ' + Math.floor(Math.random() * 1000);
        
        // Referências no Firebase
        userStatusRef = firebase.database().ref(`/status/${userData.id}`);
        userListRef = firebase.database().ref('/status');
        
        // Verificar estado da conexão
        const connectedRef = firebase.database().ref('.info/connected');
        connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                console.log("🟢 Usuário conectado, configurando presença...");
                setupPresence();
            } else {
                console.log("🔴 Usuário desconectado");
            }
        });
        
        // Configurar listener para usuários online
        setupOnlineUsers();
    }
    
    // Configurar sistema de presença
    function setupPresence() {
        // Garante que o status será 'offline' quando a conexão cair
        myConnectionRef = userStatusRef.onDisconnect();
        myConnectionRef.update({
            status: 'offline',
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Define o status atual como 'online'
        updatePresence('online');
    }
    
    // Atualizar status de presença
    function updatePresence(status, roomId) {
        if (!userStatusRef) return Promise.reject("Sistema de presença não inicializado");
        
        // Atualizar dados locais
        userData.status = status;
        if (roomId !== undefined) userData.roomId = roomId;
        
        // Atualizar no Firebase
        return userStatusRef.update({
            id: userData.id,
            name: userData.name,
            status: status,
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            roomId: userData.roomId
        })
        .then(() => {
            console.log(`✅ Status atualizado para: ${status}`);
            return true;
        })
        .catch(error => {
            console.error("❌ Erro ao atualizar status:", error);
            throw error;
        });
    }
    
    // Configurar listener para usuários online
    function setupOnlineUsers() {
        if (!userListRef) return;
        
        userListRef.on('value', (snapshot) => {
            const users = snapshot.val() || {};
            
            // Processar lista de usuários
            const onlineUsers = Object.values(users).filter(user => 
                user.status === 'online' && user.id !== userData.id
            );
            
            console.log(`👥 ${onlineUsers.length} usuário(s) online`);
            
            // Notificar callback se definido
            if (onlineUsersCallback && typeof onlineUsersCallback === 'function') {
                onlineUsersCallback(onlineUsers);
            }
        });
    }
    
    // Definir callback para quando lista de usuários online mudar
    function onOnlineUsersChanged(callback) {
        onlineUsersCallback = callback;
    }
    
    // Entrar em uma sala
    function enterRoom(roomId) {
        return updatePresence('online', roomId);
    }
    
    // Sair de uma sala
    function leaveRoom() {
        return updatePresence('online', null);
    }
    
    // Definir status ausente (temporariamente indisponível)
    function setAway() {
        return updatePresence('away');
    }
    
    // Definir status como offline explicitamente (logout)
    function setOffline() {
        return updatePresence('offline');
    }
    
    // Obter usuários em uma sala específica
    function getUsersInRoom(roomId) {
        if (!userListRef) return Promise.resolve([]);
        
        return userListRef.once('value')
            .then(snapshot => {
                const users = snapshot.val() || {};
                
                // Filtrar usuários na sala especificada
                const roomUsers = Object.values(users).filter(user => 
                    user.roomId === roomId && user.status === 'online'
                );
                
                return roomUsers;
            })
            .catch(error => {
                console.error(`❌ Erro ao obter usuários na sala ${roomId}:`, error);
                return [];
            });
    }
    
    // Remover listeners e limpar
    function cleanup() {
        if (userStatusRef) {
            userStatusRef.off();
        }
        
        if (userListRef) {
            userListRef.off();
        }
        
        if (myConnectionRef) {
            myConnectionRef.cancel();
        }
        
        console.log("🧹 Presença limpa com sucesso");
    }
    
    // API pública
    return {
        init,
        updatePresence,
        enterRoom,
        leaveRoom,
        setAway,
        setOffline,
        getUsersInRoom,
        onOnlineUsersChanged,
        cleanup
    };
})();

// Expor globalmente
window.FirebasePresence = FirebasePresence;

console.log("✅ Sistema de presença Firebase inicializado");