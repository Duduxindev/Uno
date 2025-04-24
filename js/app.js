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
  
  // Verificar estado de autenticação e configurar header do usuário
  auth.onAuthStateChanged((user) => {
    updateUserHeader(user);
    
    if (user) {
      // Usuário já logado
      if (document.getElementById('btn-play')) {
        document.getElementById('btn-play').textContent = 'Jogar';
      }
    } else {
      // Usuário não logado
      if (document.getElementById('btn-play')) {
        document.getElementById('btn-play').textContent = 'Entrar';
      }
    }
  });
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
        if (!localStorage.getItem('avatar') && !localStorage.getItem('avatarURL')) {
          // Se for login pelo Google, usar a foto do perfil como avatar
          if (user.photoURL) {
            localStorage.setItem('avatarURL', user.photoURL);
          } else {
            // Ou gerar avatar aleatório
            const avatarSeed = Math.random().toString(36).substring(2, 10);
            localStorage.setItem('avatar', avatarSeed);
          }
        }
        
        UI.showToast(`Bem-vindo, ${user.displayName}!`, 'success');
        UI.showSection('main-menu');
      } catch (error) {
        console.error('Erro ao fazer login com Google:', error);
        UI.showToast('Erro ao fazer login com Google: ' + error.message, 'error');
      }
    });
  }
}

// Atualizar o header do usuário baseado no estado de autenticação
function updateUserHeader(user) {
  // Remover header existente se houver
  const existingHeader = document.querySelector('.user-header');
  if (existingHeader) {
    existingHeader.remove();
  }
  
  // Adicionar novo header se o usuário estiver logado
  if (user) {
    const header = document.createElement('div');
    header.className = 'user-header';
    
    // Obter avatar do usuário - CORRIGIDO PARA PERSISTÊNCIA
    let avatarSrc = '';
    // Prioridade: 1. avatar URL do localStorage, 2. avatar do localStorage, 3. photoURL do usuário, 4. avatar gerado do uid
    const avatarURL = localStorage.getItem('avatarURL');
    const avatarSeed = localStorage.getItem('avatar');
    
    if (avatarURL) {
      avatarSrc = avatarURL;
    } else if (avatarSeed) {
      avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
    } else if (user.photoURL) {
      avatarSrc = user.photoURL;
      // Salvar para manter consistência
      localStorage.setItem('avatarURL', user.photoURL);
    } else {
      // Gerar um avatar fixo baseado no UID para evitar mudanças
      const fixedSeed = user.uid.substring(0, 8);
      avatarSrc = `https://api.dicebear.com/6.x/avataaars/svg?seed=${fixedSeed}`;
      localStorage.setItem('avatar', fixedSeed);
    }
    
    header.innerHTML = `
      <div class="user-info">
        <div class="user-avatar">
          <img src="${avatarSrc}" alt="Avatar">
        </div>
        <div class="user-name">${user.displayName || 'Usuário'}</div>
      </div>
      <button id="btn-logout" class="btn btn-danger btn-logout">
        <i class="fas fa-sign-out-alt"></i> Sair
      </button>
    `;
    
    document.body.appendChild(header);
    
    // Adicionar event listener para o botão de logout
    document.getElementById('btn-logout').addEventListener('click', logout);
  }
}

// Função para logout
async function logout() {
  try {
    await auth.signOut();
    UI.showToast('Logout realizado com sucesso!', 'success');
    
    // Redirecionar para a página inicial
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    UI.showToast('Erro ao fazer logout: ' + error.message, 'error');
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
        try {
          // CORREÇÃO: Usar window.location.href em vez de window.location para confiabilidade
          window.location.href = 'lobby.html';
        } catch (error) {
          console.error('Erro ao redirecionar:', error);
          UI.showToast('Erro ao redirecionar para o lobby', 'error');
        }
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
        try {
          window.location.href = 'lobby.html';
        } catch (error) {
          console.error('Erro ao redirecionar:', error);
          UI.showToast('Erro ao redirecionar para o lobby', 'error');
        }
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
        
        // Atualizar header do usuário
        updateUserHeader(auth.currentUser);
      }
      
      if (avatarSeed) {
        localStorage.setItem('avatar', avatarSeed);
        localStorage.removeItem('avatarURL'); // Remover URL se existir para usar o seed
      }
      
      // Salvar configurações de áudio
      localStorage.setItem('soundEnabled', document.getElementById('sound-enabled').checked);
      localStorage.setItem('musicEnabled', document.getElementById('music-enabled').checked);
      localStorage.setItem('volume', document.getElementById('volume').value);
      
      UI.closeModal(UI.elements.settingsModal);
      UI.showToast('Configurações salvas com sucesso!', 'success');
      
      // Atualizar header com novos dados
      updateUserHeader(auth.currentUser);
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
}