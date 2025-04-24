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
  
  if (!loginForm || !registerForm) return;
  
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
  if (googleLoginBtn) {
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
  }
  
  // Verificar estado de autenticação
  auth.onAuthStateChanged((user) => {
    const btnPlay = document.getElementById('btn-play');
    const btnLogout = document.getElementById('btn-logout');
    const userInfo = document.getElementById('user-info');
    
    if (user) {
      // Usuário já logado
      if (btnPlay) {
        btnPlay.textContent = 'Jogar';
      }
      
      // Mostrar informações do usuário e botão de logout
      if (btnLogout) {
        btnLogout.classList.remove('hidden');
      }
      
      if (userInfo) {
        userInfo.classList.remove('hidden');
        
        // Atualizar avatar
        const userAvatar = document.getElementById('header-user-avatar');
        if (userAvatar) {
          const avatarURL = localStorage.getItem('avatarURL');
          const avatarSeed = localStorage.getItem('avatar') || user.uid;
          
          if (avatarURL) {
            userAvatar.src = avatarURL;
          } else {
            userAvatar.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
          }
        }
        
        // Atualizar nome de usuário
        const userName = document.getElementById('header-user-name');
        if (userName) {
          userName.textContent = user.displayName || 'Jogador';
        }
      }
    } else {
      // Usuário não logado
      if (btnPlay) {
        btnPlay.textContent = 'Entrar';
      }
      
      // Esconder informações do usuário e botão de logout
      if (btnLogout) {
        btnLogout.classList.add('hidden');
      }
      
      if (userInfo) {
        userInfo.classList.add('hidden');
      }
    }
  });
  
  // Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await auth.signOut();
        UI.showToast('Logout realizado com sucesso!', 'success');
        
        // Redirecionar para a página inicial se estiver em outra página
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
          window.location.href = 'index.html';
        } else {
          UI.showSection('main-menu');
        }
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        UI.showToast('Erro ao fazer logout: ' + error.message, 'error');
      }
    });
  }
}

// Configurar navegação
function setupNavigation() {
  // Botão para jogar/entrar
  const btnPlay = document.getElementById('btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (auth.currentUser) {
        // Usuário já logado, ir para as salas
        window.location.href = 'lobby.html';
      } else {
        // Usuário não logado, ir para a autenticação
        UI.showSection('auth-section');
      }
    });
  }
  
  // Botão para ir para as salas
  const btnRooms = document.getElementById('btn-rooms');
  if (btnRooms) {
    btnRooms.addEventListener('click', () => {
      if (auth.currentUser) {
        window.location.href = 'lobby.html';
      } else {
        UI.showSection('auth-section');
        UI.showToast('Você precisa entrar para acessar as salas!', 'info');
      }
    });
  }
  
  // Botão para mostrar regras
  const btnRules = document.getElementById('btn-rules');
  if (btnRules) {
    btnRules.addEventListener('click', () => {
      UI.showModal(UI.elements.rulesModal);
    });
  }
  
  // Botão para configurações
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      UI.showModal(UI.elements.settingsModal);
    });
  }
  
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
      
      // Atualizar o header se estiver presente
      const headerUserName = document.getElementById('header-user-name');
      if (headerUserName && auth.currentUser) {
        headerUserName.textContent = auth.currentUser.displayName || 'Jogador';
      }
      
      // Atualizar avatar no header se estiver presente
      updateUserAvatar();
    });
  }
  
  // Preencher configurações ao abrir o modal
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
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
  
  // Visualização da skin do jogador ao clicar no avatar
  const headerUserAvatar = document.getElementById('header-user-avatar');
  if (headerUserAvatar) {
    headerUserAvatar.addEventListener('click', () => {
      UI.showModal(document.getElementById('avatar-preview-modal'));
    });
  }
}

// Função para atualizar o avatar do usuário no header
function updateUserAvatar() {
  const headerUserAvatar = document.getElementById('header-user-avatar');
  if (headerUserAvatar && auth.currentUser) {
    const avatarURL = localStorage.getItem('avatarURL');
    const avatarSeed = localStorage.getItem('avatar') || auth.currentUser.uid;
    
    if (avatarURL) {
      headerUserAvatar.src = avatarURL;
    } else {
      headerUserAvatar.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
    }
  }
}