/**
 * Autenticação Firebase para UNO Game
 * Data: 2025-04-11 21:42:26
 * Desenvolvido por: Duduxindev
 */

const FirebaseAuth = (function() {
    console.log("🔐 Inicializando sistema de autenticação Firebase...");
    
    // Estado de autenticação
    let currentUser = null;
    let authStateListeners = [];
    
    // Inicializar quando o Firebase estiver disponível
    function init() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error("❌ Firebase Auth não disponível. Tentando novamente em 2 segundos...");
            setTimeout(init, 2000);
            return;
        }
        
        // Configurar listener de estado de autenticação
        firebase.auth().onAuthStateChanged(user => {
            currentUser = user;
            
            if (user) {
                console.log(`✅ Usuário autenticado: ${user.uid} (${user.isAnonymous ? 'anônimo' : user.email})`);
            } else {
                console.log("ℹ️ Usuário não autenticado");
                // Autenticar anonimamente para facilitar
                signInAnonymously();
            }
            
            // Notificar listeners
            notifyAuthStateChange(user);
        });
    }
    
    // Autenticar anonimamente
    function signInAnonymously() {
        if (typeof firebase === 'undefined' || !firebase.auth) return Promise.reject("Firebase Auth não disponível");
        
        return firebase.auth().signInAnonymously()
            .then(result => {
                console.log("✅ Autenticação anônima bem-sucedida");
                return result.user;
            })
            .catch(error => {
                console.error("❌ Erro na autenticação anônima:", error);
                
                // Mostrar erro
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = "Erro de autenticação: " + error.message;
                    toast.className = 'toast show error';
                    
                    setTimeout(() => {
                        toast.className = 'toast';
                    }, 5000);
                }
                
                throw error;
            });
    }
    
    // Registrar usuário com email
    function signUpWithEmail(email, password, displayName) {
        if (typeof firebase === 'undefined' || !firebase.auth) return Promise.reject("Firebase Auth não disponível");
        
        return firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(result => {
                // Atualizar perfil
                return result.user.updateProfile({
                    displayName: displayName
                }).then(() => {
                    console.log("✅ Usuário registrado e perfil atualizado");
                    return result.user;
                });
            })
            .catch(error => {
                console.error("❌ Erro no registro:", error);
                throw error;
            });
    }
    
    // Login com email
    function signInWithEmail(email, password) {
        if (typeof firebase === 'undefined' || !firebase.auth) return Promise.reject("Firebase Auth não disponível");
        
        return firebase.auth().signInWithEmailAndPassword(email, password)
            .then(result => {
                console.log("✅ Login bem-sucedido");
                return result.user;
            })
            .catch(error => {
                console.error("❌ Erro no login:", error);
                throw error;
            });
    }
    
    // Logout
    function signOut() {
        if (typeof firebase === 'undefined' || !firebase.auth) return Promise.reject("Firebase Auth não disponível");
        
        return firebase.auth().signOut()
            .then(() => {
                console.log("✅ Logout bem-sucedido");
            })
            .catch(error => {
                console.error("❌ Erro no logout:", error);
                throw error;
            });
    }
    
    // Obter usuário atual
    function getCurrentUser() {
        return currentUser;
    }
    
    // Adicionar listener de estado de autenticação
    function onAuthStateChanged(callback) {
        authStateListeners.push(callback);
        
        // Chamar imediatamente com o estado atual
        if (callback && typeof callback === 'function') {
            callback(currentUser);
        }
        
        // Retornar função para remover listener
        return () => {
            const index = authStateListeners.indexOf(callback);
            if (index !== -1) {
                authStateListeners.splice(index, 1);
            }
        };
    }
    
    // Notificar listeners de mudança de estado
    function notifyAuthStateChange(user) {
        authStateListeners.forEach(listener => {
            if (listener && typeof listener === 'function') {
                listener(user);
            }
        });
    }
    
    // Inicializar
    init();
    
    // API pública
    return {
        signInAnonymously,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        getCurrentUser,
        onAuthStateChanged
    };
})();

// Expor globalmente
window.FirebaseAuth = FirebaseAuth;

console.log("✅ Sistema de autenticação Firebase inicializado");