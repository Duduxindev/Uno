// Aplicação principal
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar a UI (corrigido para garantir execução)
  try {
    UI.init();
    console.log("UI inicializado com sucesso!");
  } catch(error) {
    console.error("Erro ao inicializar UI:", error);
    // Em caso de erro, remover preloader manualmente
    document.getElementById('preloader').style.display = 'none';
  }
  
  // Configurar autenticação
  setupAuth();
  
  // Configurar navegação
  setupNavigation();
});

// Configurar autenticação
function setupAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const googleLoginBtn = document.getElementById('google-login');
  
  // Login com email/senha
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
      UI.showToast('Login realizado com sucesso!', 'success');
      UI.showSection('main-menu');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      UI.showToast('Erro ao fazer login: ' + error.message, 'error');
    }
  });
  
  // Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validar dados
    if (password !== confirmPassword) {
      UI.showToast('As senhas não coincidem!', 'error');
      return;
    }
    
    try {
      // Criar usuário
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Configurar nome de usuário
      await userCredential.user.updateProfile({
        displayName: username
      });
      
      // Gerar avatar aleatório
      const avatarSeed = Math.random().toString(36).substring(2, 10);
      localStorage.setItem('avatar', avatarSeed);
      
      UI.showToast('Conta criada com sucesso!', 'success');
      UI.showSection('main-menu');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      UI.showToast('Erro ao criar conta: ' + error.message, 'error');
    }
  });
  
  // Login com Google
  googleLoginBtn.addEventListener('click', async () => {
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      
      // Verificar se o usuário já tem um avatar
      if (!localStorage.getItem('avatar')) {
        const avatarSeed = Math.random().toString(36).substring(2, 10);
        localStorage.setItem('avatar', avatarSeed);
      }
      
      UI.showToast(`Bem-vindo, ${user.displayName}!`, 'success');
      UI.showSection('main-menu');
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      UI.showToast('Erro ao fazer login com Google: ' + error.message, 'error');
    }
  });
  
  // Verificar estado de autenticação
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Usuário já logado
      document.getElementById('btn-play').textContent = 'Jogar';
    } else {
      // Usuário não logado
      document.getElementById('btn-play').textContent = 'Entrar';
    }
  });
}

// Configurar navegação
function setupNavigation() {
  // Botão para jogar/entrar
  document.getElementById('btn-play').addEventListener('click', () => {
    if (auth.currentUser) {
      // Usuário já logado, ir para as salas
      UI.showSection('rooms-section');
      Lobby.init();
    } else {
      // Usuário não logado, ir para a autenticação
      UI.showSection('auth-section');
    }
  });
  
  // Botão para ir para as salas
  document.getElementById('btn-rooms').addEventListener('click', () => {
    if (auth.currentUser) {
      UI.showSection('rooms-section');
      Lobby.init();
    } else {
      UI.showSection('auth-section');
      UI.showToast('Você precisa entrar para acessar as salas!', 'info');
    }
  });
  
  // Formulário de configurações
  const settingsForm = document.getElementById('settings-form');
  
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Salvar configurações
      const username = document.getElementById('username').value.trim();
      const avatarSeed = document.getElementById('avatar-seed').value;
      
      if (username && auth.currentUser) {
        await auth.currentUser.updateProfile({
          displayName: username
        });
      }
      
      if (avatarSeed) {
        localStorage.setItem('avatar', avatarSeed);
      }
      
      // Salvar configurações de áudio
      localStorage.setItem('soundEnabled', document.getElementById('sound-enabled').checked);
      localStorage.setItem('musicEnabled', document.getElementById('music-enabled').checked);
      localStorage.setItem('volume', document.getElementById('volume').value);
      
      UI.closeModal(UI.elements.settingsModal);
      UI.showToast('Configurações salvas com sucesso!', 'success');
    });
  }
  
  // Preencher configurações ao abrir o modal
  document.getElementById('btn-settings').addEventListener('click', () => {
    if (auth.currentUser) {
      document.getElementById('username').value = auth.currentUser.displayName || '';
    }
    
    const avatarURL = localStorage.getItem('avatarURL');
    const avatarSeed = localStorage.getItem('avatar') || 'default';
    
    if (avatarURL) {
      document.getElementById('current-avatar').src = avatarURL;
    } else {
      document.getElementById('current-avatar').src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
    }
    
    document.getElementById('sound-enabled').checked = localStorage.getItem('soundEnabled') !== 'false';
    document.getElementById('music-enabled').checked = localStorage.getItem('musicEnabled') !== 'false';
    document.getElementById('volume').value = localStorage.getItem('volume') || 50;
  });
}