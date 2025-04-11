/**
 * Firebase Fix para UNO Game
 * Data: 2025-04-11 21:29:39
 * Desenvolvido por: Duduxindev
 */

(function() {
    console.log("🔥 Firebase Fix: Iniciando correção da conexão Firebase...");
    
    // Configuração correta do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAvt_YeiVfpMf_9UQMQrXMiHHEOGoVajYw",
        authDomain: "uno-online-duduxindev.firebaseapp.com",
        databaseURL: "https://uno-online-duduxindev-default-rtdb.firebaseio.com",
        projectId: "uno-online-duduxindev",
        storageBucket: "uno-online-duduxindev.appspot.com",
        messagingSenderId: "637465780945",
        appId: "1:637465780945:web:46d7d2f3c4e69f3b6f207c"
    };
    
    // Verificar se o Firebase já está inicializado
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase não encontrado! Carregando do CDN...");
        loadFirebaseScripts();
    } else if (!firebase.apps.length) {
        console.log("⚠️ Firebase não inicializado. Inicializando...");
        try {
            firebase.initializeApp(firebaseConfig);
            setupConnectionMonitoring();
            console.log("✅ Firebase inicializado com sucesso!");
        } catch (error) {
            console.error("❌ Erro ao inicializar Firebase:", error);
            showFirebaseError(error.message);
        }
    } else {
        console.log("✓ Firebase já inicializado. Verificando conexão...");
        setupConnectionMonitoring();
    }
    
    // Carregar scripts do Firebase dinamicamente
    function loadFirebaseScripts() {
        // Array de scripts Firebase necessários
        const firebaseScripts = [
            "https://www.gstatic.com/firebasejs/9.19.1/firebase-app-compat.js",
            "https://www.gstatic.com/firebasejs/9.19.1/firebase-database-compat.js",
            "https://www.gstatic.com/firebasejs/9.19.1/firebase-auth-compat.js"
        ];
        
        let scriptsLoaded = 0;
        
        firebaseScripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                console.log(`✓ Carregado: ${src}`);
                scriptsLoaded++;
                
                // Quando todos os scripts estiverem carregados, inicialize o Firebase
                if (scriptsLoaded === firebaseScripts.length) {
                    setTimeout(() => {
                        try {
                            firebase.initializeApp(firebaseConfig);
                            setupConnectionMonitoring();
                            console.log("✅ Firebase inicializado via carregamento dinâmico!");
                        } catch (error) {
                            console.error("❌ Erro ao inicializar Firebase:", error);
                            showFirebaseError(error.message);
                        }
                    }, 1000);
                }
            };
            
            script.onerror = () => {
                console.error(`❌ Erro ao carregar: ${src}`);
                showFirebaseError(`Não foi possível carregar o Firebase. Verifique sua conexão com a internet.`);
            };
            
            document.head.appendChild(script);
        });
    }
    
    // Configurar monitoramento de conexão
    function setupConnectionMonitoring() {
        if (typeof firebase === 'undefined' || !firebase.database) return;
        
        // Referência para monitorar o estado da conexão
        const connectedRef = firebase.database().ref(".info/connected");
        
        connectedRef.on("value", (snap) => {
            if (snap.val() === true) {
                console.log("🟢 Conectado ao Firebase Database!");
                hideFirebaseError();
                testDatabaseWrite();
            } else {
                console.log("🔴 Desconectado do Firebase Database.");
                showFirebaseError("Conexão com o Firebase perdida. Reconectando...");
            }
        });
    }
    
    // Teste de escrita no banco de dados
    function testDatabaseWrite() {
        if (typeof firebase === 'undefined' || !firebase.database) return;
        
        // Tenta escrever em um local temporário
        firebase.database().ref("_connectionTest").set({
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            client: navigator.userAgent
        })
        .then(() => {
            console.log("✅ Teste de escrita no Firebase bem-sucedido!");
            // Limpar o teste após 5 segundos
            setTimeout(() => {
                firebase.database().ref("_connectionTest").remove();
            }, 5000);
        })
        .catch(error => {
            console.error("❌ Erro no teste de escrita:", error);
            showFirebaseError("Sem permissão para escrever no Firebase Database. Verifique as regras de segurança.");
        });
    }
    
    // Mostrar erro do Firebase
    function showFirebaseError(message) {
        console.error(`🔥 Erro Firebase: ${message}`);
        
        // Criar ou atualizar banner de erro
        let errorBanner = document.getElementById('firebase-error-banner');
        
        if (!errorBanner) {
            errorBanner = document.createElement('div');
            errorBanner.id = 'firebase-error-banner';
            errorBanner.style.position = 'fixed';
            errorBanner.style.top = '0';
            errorBanner.style.left = '0';
            errorBanner.style.right = '0';
            errorBanner.style.backgroundColor = '#f44336';
            errorBanner.style.color = 'white';
            errorBanner.style.padding = '10px 20px';
            errorBanner.style.textAlign = 'center';
            errorBanner.style.zIndex = '9999';
            errorBanner.style.fontWeight = 'bold';
            errorBanner.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            document.body.appendChild(errorBanner);
        }
        
        errorBanner.innerHTML = `
            <span>⚠️ ${message}</span>
            <button onclick="location.reload()" style="margin-left: 20px; padding: 5px 10px; background: white; color: #f44336; border: none; border-radius: 4px; cursor: pointer;">Recarregar</button>
        `;
        
        // Mostrar toast também
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = "Erro de conexão com o Firebase";
            toast.className = 'toast show error';
            
            // Deixar o toast por mais tempo
            setTimeout(() => {
                toast.className = 'toast';
            }, 8000);
        }
    }
    
    // Esconder banner de erro
    function hideFirebaseError() {
        const errorBanner = document.getElementById('firebase-error-banner');
        if (errorBanner) {
            errorBanner.style.display = 'none';
        }
    }
    
    // Exportar utilitários globalmente
    window.firebaseFix = {
        reinitialize: () => {
            try {
                // Reinicializar o Firebase
                if (firebase.apps.length) {
                    firebase.app().delete().then(() => {
                        firebase.initializeApp(firebaseConfig);
                        console.log("✅ Firebase reinicializado!");
                        setupConnectionMonitoring();
                    });
                } else {
                    firebase.initializeApp(firebaseConfig);
                    console.log("✅ Firebase inicializado!");
                    setupConnectionMonitoring();
                }
            } catch (error) {
                console.error("❌ Erro ao reinicializar Firebase:", error);
                showFirebaseError(error.message);
            }
        },
        
        testConnection: () => {
            setupConnectionMonitoring();
            testDatabaseWrite();
        }
    };
    
    console.log("🔥 Firebase Fix: Correção aplicada!");
})();