/**
 * Database Error Fix para UNO Game
 * Data: 2025-04-14 14:54:28
 * Desenvolvido por: Duduxindev
 */

// Sistema de fallback para Firebase
class FirebaseFallbackSystem {
    constructor() {
        this.localData = {
            rooms: {},
            users: {},
            stats: {},
            presence: {}
        };
        this.roomCallbacks = new Map();
        this.presenceCallbacks = new Map();
        this.useLocalStorage = true;
        
        // Carregar dados salvos do localStorage, se disponível
        this.loadLocalData();
    }
    
    init() {
        console.log("🛠️ Inicializando sistema de fallback para Firebase...");
        
        // Verificar se o Firebase está funcionando
        this.checkFirebaseConnection();
        
        // Configurar intervalo para verificar conexão periodicamente
        setInterval(() => this.checkFirebaseConnection(), 30000);
        
        // Manter dados sincronizados com localStorage se necessário
        if (this.useLocalStorage) {
            setInterval(() => this.saveLocalData(), 10000);
        }
    }
    
    // Verifica se o Firebase está funcionando
    checkFirebaseConnection() {
        if (typeof firebase === 'undefined') {
            console.error("❌ Firebase não está disponível, usando sistema de fallback local");
            this.patchFirebaseMethods();
            return false;
        }
        
        try {
            const connRef = firebase.database().ref('.info/connected');
            connRef.on('value', (snap) => {
                const connected = snap.val() === true;
                if (!connected) {
                    console.error("❌ Firebase desconectado, usando sistema de fallback local");
                    this.patchFirebaseMethods();
                } else {
                    console.log("✅ Conexão com Firebase restaurada");
                }
            });
            return true;
        } catch (error) {
            console.error("❌ Erro ao verificar conexão Firebase:", error);
            this.patchFirebaseMethods();
            return false;
        }
    }
    
    // Substitui métodos do Firebase por versões locais quando necessário
    patchFirebaseMethods() {
        // Backup das referências originais
        if (!window._originalFirebase) {
            window._originalFirebase = window.firebase;
        }
        
        // Criar um objeto firebase de substituição
        window.firebase = {
            database: () => {
                return {
                    ref: (path) => this.createFallbackRef(path),
                    ServerValue: {
                        TIMESTAMP: Date.now()
                    }
                };
            },
            // Manter outros métodos se necessário
            auth: () => {
                return {
                    signInAnonymously: () => {
                        return Promise.resolve({
                            user: {
                                uid: `local-${Math.random().toString(36).substring(2, 15)}`
                            }
                        });
                    },
                    onAuthStateChanged: (callback) => {
                        // Simular usuário autenticado
                        callback({
                            uid: `local-${Math.random().toString(36).substring(2, 15)}`,
                            isAnonymous: true
                        });
                        return () => {}; // Retorna função de limpeza
                    }
                };
            }
        };
        
        // Notificar aplicação que estamos em modo fallback
        window.isUsingFallbackDb = true;
        
        // Disparar evento para notificar outros componentes
        document.dispatchEvent(new CustomEvent('firebase-fallback-activated'));
    }
    
    // Cria uma referência de fallback que imita a API do Firebase
    createFallbackRef(path) {
        return {
            path: path,
            
            // Métodos para leitura de dados
            once: (eventType) => {
                return Promise.resolve({
                    val: () => this.getDataAtPath(path),
                    exists: () => this.pathExists(path),
                    key: path.split('/').pop()
                });
            },
            
            on: (eventType, callback) => {
                // Registrar callback para atualizações futuras
                if (path.startsWith('rooms/')) {
                    this.roomCallbacks.set(path, callback);
                    
                    // Disparar callback imediatamente com dados atuais
                    callback({
                        val: () => this.getDataAtPath(path),
                        exists: () => this.pathExists(path),
                        key: path.split('/').pop()
                    });
                }
                
                if (path.startsWith('presence/')) {
                    this.presenceCallbacks.set(path, callback);
                    
                    // Disparar callback imediatamente com dados atuais
                    callback({
                        val: () => this.getDataAtPath(path),
                        exists: () => this.pathExists(path),
                        key: path.split('/').pop()
                    });
                }
                
                // Retornar função para remover listener
                return () => {
                    if (path.startsWith('rooms/')) {
                        this.roomCallbacks.delete(path);
                    }
                    if (path.startsWith('presence/')) {
                        this.presenceCallbacks.delete(path);
                    }
                };
            },
            
            // Métodos para escrita de dados
            set: (data) => {
                this.setDataAtPath(path, data);
                return Promise.resolve();
            },
            
            update: (data) => {
                const currentData = this.getDataAtPath(path) || {};
                this.setDataAtPath(path, { ...currentData, ...data });
                return Promise.resolve();
            },
            
            push: (data) => {
                const newId = Math.random().toString(36).substring(2, 15);
                const newPath = `${path}/${newId}`;
                this.setDataAtPath(newPath, data);
                
                return {
                    key: newId,
                    path: newPath
                };
            },
            
            remove: () => {
                this.removeDataAtPath(path);
                return Promise.resolve();
            },
            
            // Método para criar uma sub-referência
            child: (childPath) => {
                return this.createFallbackRef(`${path}/${childPath}`);
            }
        };
    }
    
    // Obtém dados de um caminho específico
    getDataAtPath(path) {
        const parts = path.split('/').filter(p => p.length > 0);
        let current = this.localData;
        
        for (const part of parts) {
            if (!current[part]) return null;
            current = current[part];
        }
        
        return current;
    }
    
    // Verifica se um caminho existe
    pathExists(path) {
        return this.getDataAtPath(path) !== null;
    }
    
    // Define dados em um caminho específico
    setDataAtPath(path, data) {
        const parts = path.split('/').filter(p => p.length > 0);
        let current = this.localData;
        
        // Navegar até o penúltimo nível
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        // Definir o valor no último nível
        const lastPart = parts[parts.length - 1];
        current[lastPart] = data;
        
        // Notificar listeners se for uma sala
        if (path.startsWith('rooms/')) {
            this.notifyRoomListeners(path, data);
        }
        
        // Notificar listeners se for dados de presença
        if (path.startsWith('presence/')) {
            this.notifyPresenceListeners(path, data);
        }
        
        // Salvar dados localmente
        if (this.useLocalStorage) {
            this.saveLocalData();
        }
    }
    
    // Remove dados de um caminho específico
    removeDataAtPath(path) {
        const parts = path.split('/').filter(p => p.length > 0);
        let current = this.localData;
        
        // Navegar até o penúltimo nível
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) return;
            current = current[parts[i]];
        }
        
        // Remover o valor no último nível
        const lastPart = parts[parts.length - 1];
        if (current[lastPart] !== undefined) {
            delete current[lastPart];
        }
        
        // Notificar listeners se for uma sala
        if (path.startsWith('rooms/')) {
            this.notifyRoomListeners(path, null);
        }
        
        // Salvar dados localmente
        if (this.useLocalStorage) {
            this.saveLocalData();
        }
    }
    
    // Notificar listeners de salas sobre mudanças
    notifyRoomListeners(changedPath, data) {
        // Notificar callbacks específicos
        if (this.roomCallbacks.has(changedPath)) {
            const callback = this.roomCallbacks.get(changedPath);
            callback({
                val: () => data,
                exists: () => data !== null,
                key: changedPath.split('/').pop()
            });
        }
        
        // Notificar callbacks de níveis superiores
        const parts = changedPath.split('/');
        while (parts.length > 1) {
            parts.pop();
            const parentPath = parts.join('/');
            
            if (this.roomCallbacks.has(parentPath)) {
                const parentCallback = this.roomCallbacks.get(parentPath);
                parentCallback({
                    val: () => this.getDataAtPath(parentPath),
                    exists: () => this.pathExists(parentPath),
                    key: parentPath.split('/').pop()
                });
            }
        }
    }
    
    // Notificar listeners de presença sobre mudanças
    notifyPresenceListeners(changedPath, data) {
        if (this.presenceCallbacks.has(changedPath)) {
            const callback = this.presenceCallbacks.get(changedPath);
            callback({
                val: () => data,
                exists: () => data !== null,
                key: changedPath.split('/').pop()
            });
        }
    }
    
    // Salvar dados em localStorage
    saveLocalData() {
        try {
            localStorage.setItem('uno_fallback_data', JSON.stringify(this.localData));
            localStorage.setItem('uno_fallback_timestamp', Date.now().toString());
        } catch (error) {
            console.error("❌ Erro ao salvar dados localmente:", error);
        }
    }
    
    // Carregar dados do localStorage
    loadLocalData() {
        try {
            const savedData = localStorage.getItem('uno_fallback_data');
            if (savedData) {
                this.localData = JSON.parse(savedData);
                console.log("✅ Dados carregados do armazenamento local");
            }
        } catch (error) {
            console.error("❌ Erro ao carregar dados locais:", error);
        }
    }
    
    // Restaurar Firebase original se disponível
    restoreFirebase() {
        if (window._originalFirebase) {
            window.firebase = window._originalFirebase;
            window.isUsingFallbackDb = false;
            console.log("✅ Firebase original restaurado");
            
            // Disparar evento para notificar outros componentes
            document.dispatchEvent(new CustomEvent('firebase-restored'));
        }
    }
}

// Inicializar sistema de fallback quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseFallback = new FirebaseFallbackSystem();
    window.firebaseFallback.init();
    
    // Adicionar botões de diagnóstico e controle ao menu de opções
    setTimeout(addDatabaseControls, 1000);
});

// Adicionar controles de diagnóstico e recuperação ao menu de opções
function addDatabaseControls() {
    const optionsContainer = document.querySelector('.options-container');
    if (!optionsContainer) return;
    
    // Criar grupo de opções para banco de dados
    const dbGroup = document.createElement('div');
    dbGroup.className = 'option-group';
    dbGroup.innerHTML = `
        <h3>Banco de Dados</h3>
        <div class="option-item">
            <label for="db-status">Status do Firebase</label>
            <span id="db-status-indicator" class="${window.isUsingFallbackDb ? 'status-offline' : 'status-online'}">
                ${window.isUsingFallbackDb ? 'Offline (Modo Local)' : 'Online'}
            </span>
        </div>
        <div class="option-item">
            <label for="force-local">Forçar Modo Local</label>
            <label class="switch">
                <input type="checkbox" id="force-local" ${window.isUsingFallbackDb ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        <div class="option-item">
            <button id="check-connection" class="db-action-btn">Verificar Conexão</button>
        </div>
        <div class="option-item">
            <button id="clear-local-data" class="db-action-btn warning">Limpar Dados Locais</button>
        </div>
    `;
    
    // Adicionar ao container
    optionsContainer.appendChild(dbGroup);
    
    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
        .status-online {
            color: #27AE60;
            font-weight: bold;
        }
        
        .status-offline {
            color: #E74C3C;
            font-weight: bold;
        }
        
        .db-action-btn {
            background-color: #3498DB;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .db-action-btn:hover {
            background-color: #2980B9;
        }
        
        .db-action-btn.warning {
            background-color: #E74C3C;
        }
        
        .db-action-btn.warning:hover {
            background-color: #C0392B;
        }
    `;
    document.head.appendChild(style);
    
    // Adicionar lógica aos controles
    const forceLocalCheckbox = document.getElementById('force-local');
    if (forceLocalCheckbox) {
        forceLocalCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Forçar modo local
                window.firebaseFallback.patchFirebaseMethods();
                updateDbStatusIndicator(true);
            } else {
                // Tentar restaurar Firebase
                window.firebaseFallback.restoreFirebase();
                window.firebaseFallback.checkFirebaseConnection();
                updateDbStatusIndicator(window.isUsingFallbackDb);
            }
        });
    }
    
    // Botão de verificar conexão
    const checkConnectionBtn = document.getElementById('check-connection');
    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener('click', () => {
            const isOffline = window.firebaseFallback.checkFirebaseConnection();
            updateDbStatusIndicator(isOffline);
            
            // Mostrar mensagem de resultado
            showToast(isOffline ? 
                "Conexão falhou, usando modo local" : 
                "Conexão com Firebase estabelecida!");
        });
    }
    
    // Botão de limpar dados locais
    const clearLocalDataBtn = document.getElementById('clear-local-data');
    if (clearLocalDataBtn) {
        clearLocalDataBtn.addEventListener('click', () => {
            if (confirm("Tem certeza que deseja limpar todos os dados locais? Isso não pode ser desfeito.")) {
                localStorage.removeItem('uno_fallback_data');
                localStorage.removeItem('uno_fallback_timestamp');
                window.firebaseFallback.localData = {
                    rooms: {},
                    users: {},
                    stats: {},
                    presence: {}
                };
                showToast("Dados locais limpos com sucesso!");
            }
        });
    }
    
    // Função para atualizar indicador de status
    function updateDbStatusIndicator(isOffline) {
        const indicator = document.getElementById('db-status-indicator');
        if (indicator) {
            indicator.className = isOffline ? 'status-offline' : 'status-online';
            indicator.textContent = isOffline ? 'Offline (Modo Local)' : 'Online';
        }
    }
    
    // Função para mostrar mensagem toast
    function showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast show';
            
            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        }
    }
    
    // Registrar listeners para eventos de mudança de estado
    document.addEventListener('firebase-fallback-activated', () => {
        updateDbStatusIndicator(true);
    });
    
    document.addEventListener('firebase-restored', () => {
        updateDbStatusIndicator(false);
    });
}

// Função para detectar erro do Firebase e aplicar correção automaticamente
function detectAndFixFirebaseError() {
    console.log("🔍 Verificando erros de Firebase...");
    
    // Verificar se firebase está disponível
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase não está definido! Aplicando correção...");
        
        // Inicializar fallback imediatamente se ainda não foi feito
        if (!window.firebaseFallback) {
            window.firebaseFallback = new FirebaseFallbackSystem();
            window.firebaseFallback.init();
        } else {
            window.firebaseFallback.patchFirebaseMethods();
        }
        
        return true;
    }
    
    // Testar função básica do Firebase
    try {
        const testRef = firebase.database().ref('_test_connection');
        testRef.set({
            timestamp: Date.now(),
            test: true
        }).then(() => {
            console.log("✅ Firebase está funcionando corretamente!");
            return false;
        }).catch(error => {
            console.error("❌ Erro ao testar Firebase:", error);
            
            // Inicializar fallback
            if (!window.firebaseFallback) {
                window.firebaseFallback = new FirebaseFallbackSystem();
            }
            window.firebaseFallback.patchFirebaseMethods();
            
            return true;
        });
    } catch (error) {
        console.error("❌ Erro ao acessar Firebase:", error);
        
        // Inicializar fallback
        if (!window.firebaseFallback) {
            window.firebaseFallback = new FirebaseFallbackSystem();
        }
        window.firebaseFallback.patchFirebaseMethods();
        
        return true;
    }
}

// Executar detecção e correção imediatamente
detectAndFixFirebaseError();

// Verificar novamente após pequeno atraso para garantir
setTimeout(detectAndFixFirebaseError, 2000);

// Configurar verificação periódica
setInterval(detectAndFixFirebaseError, 60000);

// Corrigir funções do FirebaseUtil se necessário
setTimeout(() => {
    if (!window.FirebaseUtil || typeof window.FirebaseUtil !== 'object') {
        console.error("❌ FirebaseUtil não está disponível! Criando substituto...");
        
        window.FirebaseUtil = {
            generateRoomCode: function() {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                let code = '';
                for (let i = 0; i < 4; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return code;
            },
            
            getRoomRef: function(roomCode) {
                return firebase.database().ref(`rooms/${roomCode}`);
            },
            
            checkRoomExists: async function(roomCode) {
                try {
                    const snapshot = await firebase.database().ref(`rooms/${roomCode}`).once('value');
                    return snapshot.exists();
                } catch (error) {
                    console.error("Erro ao verificar sala:", error);
                    return false;
                }
            },
            
            getServerTimestamp: function() {
                return firebase.database && firebase.database.ServerValue ? 
                    firebase.database.ServerValue.TIMESTAMP : Date.now();
            }
        };
        
        console.log("✅ FirebaseUtil substituto criado com sucesso!");
    }
}, 1000);

console.log("✅ Sistema de detecção e correção de erros de banco de dados inicializado!");

// Adicionar detecção de erro no carregamento do Firebase
window.addEventListener('error', function(e) {
    // Verificar se o erro está relacionado ao Firebase
    if (e.message && (
        e.message.includes('firebase') || 
        e.message.includes('FirebaseError') || 
        e.filename && e.filename.includes('firebase')
    )) {
        console.error("📢 Erro relacionado ao Firebase detectado!", e.message);
        
        // Ativar sistema de fallback
        if (window.firebaseFallback) {
            window.firebaseFallback.patchFirebaseMethods();
            console.log("⚠️ Sistema de fallback ativado automaticamente devido a erro");
        }
    }
}, true);

// Adicionar observador de rede para detectar perda de conectividade
window.addEventListener('offline', function() {
    console.log("📢 Conexão de rede perdida.");
    // Ativar sistema de fallback automaticamente
    if (window.firebaseFallback) {
        window.firebaseFallback.patchFirebaseMethods();
        console.log("⚠️ Sistema de fallback ativado automaticamente devido à perda de conexão");
    }
});

// Tentar restaurar conexão quando a rede voltar
window.addEventListener('online', function() {
    console.log("📢 Conexão de rede restaurada. Tentando reconectar ao Firebase...");
    
    // Tentar restaurar Firebase após um breve delay
    setTimeout(() => {
        if (window.firebaseFallback) {
            if (window._originalFirebase) {
                window.firebase = window._originalFirebase;
            }
            
            // Verificar se a conexão está realmente funcionando
            detectAndFixFirebaseError();
        }
    }, 2000);
});