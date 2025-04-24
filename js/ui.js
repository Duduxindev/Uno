// Tratar upload de avatar
async handleAvatarUpload(file) {
  if (!file || !auth.currentUser) return;
  
  try {
    // Validar tamanho e tipo
    if (file.size > 2 * 1024 * 1024) { // 2MB max
      this.showToast('A imagem deve ter no máximo 2MB!', 'error');
      return;
    }
    
    if (!file.type.match('image.*')) {
      this.showToast('O arquivo selecionado não é uma imagem!', 'error');
      return;
    }
    
    this.showToast('Enviando imagem...', 'info');
    
    // Redimensionar imagem antes do upload para garantir tamanho adequado
    const img = await this.resizeImage(file, 300, 300);
    
    // Converter para Blob
    const imgBlob = await fetch(img).then(r => r.blob());
    
    // Referência para o storage
    const userId = auth.currentUser.uid;
    const storageRef = storage.ref();
    const avatarRef = storageRef.child(`avatars/${userId}`);
    
    // Fazer upload
    await avatarRef.put(imgBlob);
    
    // Obter URL da imagem
    const avatarURL = await avatarRef.getDownloadURL();
    
    // Atualizar avatar no preview
    document.getElementById('current-avatar').src = avatarURL;
    
    // Salvar URL no localStorage
    localStorage.setItem('avatarURL', avatarURL);
    localStorage.removeItem('avatar'); // Remover seed do avatar gerado
    
    // Atualizar o header do usuário se existir
    this.updateUserAvatar(avatarURL);
    
    this.showToast('Avatar atualizado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    this.showToast('Erro ao fazer upload do avatar: ' + error.message, 'error');
  }
},

// Redimensionar imagem para tamanho adequado
resizeImage(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        
        // Calcular dimensões proporcionais
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        // Criar canvas para redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Retornar imagem como data URL
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = function(error) {
        reject(error);
      };
    };
    
    reader.onerror = function(error) {
      reject(error);
    };
  });
},

// Atualizar avatar do usuário no header
updateUserAvatar(avatarURL) {
  const headerAvatar = document.querySelector('.user-avatar img');
  if (headerAvatar) {
    headerAvatar.src = avatarURL;
  }
}