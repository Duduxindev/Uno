/**
 * Operações de Storage Firebase para UNO Game
 * Data: 2025-04-11 21:42:26
 * Desenvolvido por: Duduxindev
 */

const FirebaseStorage = (function() {
    console.log("📦 Inicializando sistema de armazenamento Firebase...");
    
    // Verificar disponibilidade do Firebase
    function isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && firebase.storage;
    }
    
    // Fazer upload de arquivo
    function uploadFile(file, path) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Storage não disponível");
        
        // Referência ao Storage
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(path || `uploads/${Date.now()}_${file.name}`);
        
        // Criar tarefa de upload
        const uploadTask = fileRef.put(file);
        
        // Monitorar progresso
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
                // Progresso
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload em progresso: ${progress.toFixed(2)}%`);
                },
                // Erro
                (error) => {
                    console.error("❌ Erro no upload:", error);
                    reject(error);
                },
                // Concluído
                async () => {
                    try {
                        // Obter URL de download
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        console.log("✅ Upload concluído:", downloadURL);
                        
                        resolve({
                            path: uploadTask.snapshot.ref.fullPath,
                            url: downloadURL,
                            name: file.name,
                            size: file.size,
                            contentType: file.type,
                            created: Date.now()
                        });
                    } catch (error) {
                        console.error("❌ Erro ao obter URL de download:", error);
                        reject(error);
                    }
                }
            );
        });
    }
    
    // Fazer upload de imagem de perfil
    function uploadProfileImage(file, userId) {
        const safeUserId = userId || 'anonymous' + Date.now();
        return uploadFile(file, `profiles/${safeUserId}/avatar.${getFileExtension(file.name)}`);
    }
    
    // Obter URL de download por caminho
    function getDownloadURL(path) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Storage não disponível");
        
        return firebase.storage().ref().child(path).getDownloadURL()
            .then(url => {
                console.log(`✅ URL obtida para ${path}: ${url}`);
                return url;
            })
            .catch(error => {
                console.error(`❌ Erro ao obter URL para ${path}:`, error);
                throw error;
            });
    }
    
    // Excluir arquivo por caminho
    function deleteFile(path) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Storage não disponível");
        
        return firebase.storage().ref().child(path).delete()
            .then(() => {
                console.log(`✅ Arquivo ${path} excluído com sucesso`);
                return true;
            })
            .catch(error => {
                console.error(`❌ Erro ao excluir arquivo ${path}:`, error);
                throw error;
            });
    }
    
    // Listar arquivos em um diretório
    function listFiles(directory) {
        if (!isFirebaseAvailable()) return Promise.reject("Firebase Storage não disponível");
        
        return firebase.storage().ref().child(directory).listAll()
            .then(result => {
                console.log(`✅ Listagem de ${directory} concluída`);
                
                return {
                    items: result.items.map(item => ({
                        name: item.name,
                        fullPath: item.fullPath
                    })),
                    prefixes: result.prefixes.map(prefix => ({
                        name: prefix.name,
                        fullPath: prefix.fullPath
                    }))
                };
            })
            .catch(error => {
                console.error(`❌ Erro ao listar arquivos em ${directory}:`, error);
                throw error;
            });
    }
    
    // Funções utilitárias
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
    
    // API pública
    return {
        uploadFile,
        uploadProfileImage,
        getDownloadURL,
        deleteFile,
        listFiles
    };
})();

// Expor globalmente
window.FirebaseStorage = FirebaseStorage;

console.log("✅ Sistema de armazenamento Firebase inicializado");