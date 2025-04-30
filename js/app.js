// App.js - Controlador principal da aplicação
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded - initializing app");
  
  // Remover o preloader imediatamente
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }
  
  // Inicializar Firebase
  initFirebase();
  
  // Inicializar UI
  initializeUI();
  
  // Verificar autenticação e configurar evento de state change
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      handleAuthStateChanged(user);
    });
  } else {
    console.error("Firebase auth not available");
  }
  
  // Configurar event listeners para formulários de autenticação
  setupFormListeners();
});

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error("Firebase não está carregado!");
    return;
  }
  
  try {
    // Estas credenciais são apenas exemplos e precisam ser substituídas pelas suas
    const firebaseConfig = {
      apiKey: "AIzaSyDJzk15RFwx7MuHsVeGaBMnkghuY5-c-Hc",
      authDomain: "uno-online-game.firebaseapp.com", 
      databaseURL: "https://uno-online-game-default-rtdb.firebaseio.com",
      projectId: "uno-online-game",
      storageBucket: "uno-online-game.appspot.com",
      messagingSenderId: "325148128509",
      appId: "1:325148128509:web:d9d3f4b8b8b8b8b8b8b8b8"
    };

    // Initialize Firebase se ainda não estiver inicializado
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    console.log("Firebase inicializado com sucesso");
    
    // Definir variáveis globais para acesso fácil
    window.auth = firebase.auth();
    window.database = firebase.database();
    window.storage = firebase.storage();
    window.googleProvider = new firebase.auth.GoogleAuthProvider();
    
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
}

function initializeUI() {
  // Inicializar UI se o objeto UI estiver disponível
  if (typeof UI !== 'undefined') {
    UI.init();
  }
}

// Função para lidar com mudanças no estado de autenticação
function handleAuthStateChanged(user) {
  const pathname = window.location.pathname;
  
  if (user) {
    // Usuário está logado
    console.log('Usuário logado:', user.displayName || user.email || user.uid);
    
    // Atualizar UI com informações do usuário
    updateUserUI(user);
    
    // Redirecionar conforme página atual
    if (pathname.includes('index.html') || pathname === '/' || pathname === '') {
      // Na página inicial, mostrar menu principal
      if (typeof UI !== 'undefined') {
        UI.showSection('main-menu');
      } else {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
      }
    }
  } else {
    // Usuário não está logado
    console.log('Nenhum usuário logado');
    
    // Redirecionar para login se estiver em páginas protegidas
    if (pathname.includes('lobby.html') || pathname.includes('game.html')) {
      window.location.href = 'index.html';
    } else if (pathname.includes('index.html') || pathname === '/' || pathname === '') {
      // Na página inicial, mostrar tela de autenticação
      if (typeof UI !== 'undefined') {
        UI.showSection('auth-section');
        UI.showTab('login');
      } else {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        
        // Mostrar tab de login
        document.getElementById('tab-login').click();
      }
    }
  }
}

// Função para configurar eventos dos formulários
function setupFormListeners() {
  console.log("Configurando event listeners para formulários");
  
  // Formulário de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleLogin();
    });
  }
  
  // Formulário de registro
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleRegister();
    });
  }
  
  // Botão de login com Google
  const googleLoginBtn = document.getElementById('login-google');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
      console.log("Botão de login com Google clicado");
      await loginWithGoogle();
    });
  }
  
  // Configurar tabs de login/registro
  setupTabs();
  
  // Botões de menu principal
  setupMainMenuButtons();
}

// Função para configurar as tabs de login e registro
function setupTabs() {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authTitle = document.getElementById('auth-title');
  
  if (tabLogin && tabRegister && loginForm && registerForm) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      if (authTitle) authTitle.textContent = 'Login';
    });
    
    tabRegister.addEventListener('click', () => {
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      if (authTitle) authTitle.textContent = 'Registrar';
    });
  }
}

// Função para configurar botões do menu principal
function setupMainMenuButtons() {
  // Botão de jogar
  const btnPlay = document.getElementById('btn-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      window.location.href = 'lobby.html';
    });
  }
  
  // Botão de regras
  const btnRules = document.getElementById('btn-rules');
  if (btnRules) {
    btnRules.addEventListener('click', () => {
      showModal(document.getElementById('rules-modal'));
    });
  }
  
  // Botão de configurações
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      // Preencher campos com dados atuais do usuário
      const user = firebase.auth().currentUser;
      if (user) {
        const displayNameInput = document.getElementById('display-name');
        if (displayNameInput) {
          displayNameInput.value = user.displayName || '';
        }
      }
      showModal(document.getElementById('settings-modal'));
    });
  }
  
  // Botão de logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await handleLogout();
    });
  }
}

// Função para mostrar modal
function showModal(modal) {
  if (!modal) return;
  
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // Adicionar evento de fechamento em clique fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
  
  // Configurar botão de fechar
  const closeBtn = modal.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeModal(modal);
    });
  }
}

// Função para fechar modal
function closeModal(modal) {
  if (!modal) return;
  
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

// Função para lidar com o login
async function handleLogin() {
  try {
    // Obter valores do formulário
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validar campos
    if (!email || !password) {
      showToast('Preencha todos os campos', 'warning');
      return;
    }
    
    // Mostrar loading
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    if (loginButton) {
      loginButton.disabled = true;
      loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    }
    
    // Fazer login
    await firebase.auth().signInWithEmailAndPassword(email, password);
    
    // Limpar campos
    emailInput.value = '';
    passwordInput.value = '';
    
    // Mostrar menu principal
    showToast('Login realizado com sucesso!', 'success');
    
    // Atualizar UI (handleAuthStateChanged será chamado automaticamente)
  } catch (error) {
    console.error('Erro no login:', error);
    
    // Mensagens de erro específicas
    let errorMessage = 'Erro ao fazer login. Tente novamente.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado. Verifique seu e-mail.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Senha incorreta. Tente novamente.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'E-mail inválido. Verifique o formato.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
    }
    
    showToast(errorMessage, 'error');
  } finally {
    // Restaurar botão
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.innerHTML = 'Entrar';
    }
  }
}

// Função para lidar com o registro
async function handleRegister() {
  try {
    // Obter valores do formulário
    const usernameInput = document.getElementById('register-username');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validar campos
    if (!username || !email || !password || !confirmPassword) {
      showToast('Preencha todos os campos', 'warning');
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('As senhas não coincidem', 'warning');
      return;
    }
    
    if (password.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }
    
    // Mostrar loading
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    if (registerButton) {
      registerButton.disabled = true;
      registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    }
    
    // Criar usuário
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    
    // Atualizar perfil
    await userCredential.user.updateProfile({
      displayName: username
    });
    
    // Gerar avatar aleatório e salvar
    const avatarSeed = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('avatar', avatarSeed);
    
    // Limpar campos
    usernameInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';
    confirmPasswordInput.value = '';
    
    // Mostrar menu principal
    showToast('Registro realizado com sucesso!', 'success');
    
    // Atualizar UI (handleAuthStateChanged será chamado automaticamente)
  } catch (error) {
    console.error('Erro no registro:', error);
    
    // Mensagens de erro específicas
    let errorMessage = 'Erro ao registrar. Tente novamente.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este e-mail já está em uso. Tente outro.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'E-mail inválido. Verifique o formato.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha fraca. Use uma senha mais forte.';
    }
    
    showToast(errorMessage, 'error');
  } finally {
    // Restaurar botão
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    if (registerButton) {
      registerButton.disabled = false;
      registerButton.innerHTML = 'Registrar';
    }
  }
}

// Função para lidar com o logout
async function handleLogout() {
  try {
    // Mostrar confirmação
    if (confirm('Tem certeza que deseja sair?')) {
      await firebase.auth().signOut();
      showToast('Logout realizado com sucesso!', 'success');
      
      // Atualizar UI (handleAuthStateChanged será chamado automaticamente)
    }
  } catch (error) {
    console.error('Erro no logout:', error);
    showToast('Erro ao fazer logout: ' + error.message, 'error');
  }
}

// Função para atualizar UI com informações do usuário
function updateUserUI(user) {
  if (!user) return;
  
  // Atualizar nome do usuário
  const usernameElements = document.querySelectorAll('.username');
  usernameElements.forEach(element => {
    element.textContent = user.displayName || 'Jogador';
  });
  
  // Atualizar avatar do usuário
  const userAvatarElements = document.querySelectorAll('.user-avatar');
  userAvatarElements.forEach(element => {
    const avatarURL = localStorage.getItem('avatarURL');
    const avatarSeed = localStorage.getItem('avatar');
    
    if (avatarURL) {
      element.src = avatarURL;
    } else if (avatarSeed) {
      element.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`;
    } else if (user.photoURL) {
      element.src = user.photoURL;
    } else {
      // Gerar um avatar fixo baseado no UID para evitar mudanças
      const fixedSeed = user.uid ? user.uid.substring(0, 8) : 'default';
      element.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${fixedSeed}`;
    }
  });
}

// Função para login com Google
async function loginWithGoogle() {
  try {
    console.log("Iniciando login com Google");
    
    // Verificar se o googleProvider está disponível
    if (!window.googleProvider) {
      window.googleProvider = new firebase.auth.GoogleAuthProvider();
    }
    
    // Mostrar loading
    const googleButton = document.getElementById('login-google');
    if (googleButton) {
      googleButton.disabled = true;
      googleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    }
    
    // Fazer login com Google
    const result = await firebase.auth().signInWithPopup(window.googleProvider);
    console.log("Login com Google bem-sucedido", result);
    
    // Verificar se é a primeira vez que o usuário loga
    if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
      // Gerar avatar aleatório e salvar
      const avatarSeed = Math.random().toString(36).substring(2, 10);
      localStorage.setItem('avatar', avatarSeed);
    }
    
    // Mostrar menu principal
    showToast('Login com Google realizado com sucesso!', 'success');
    
    // Atualizar UI (handleAuthStateChanged será chamado automaticamente)
  } catch (error) {
    console.error('Erro no login com Google:', error);
    showToast('Erro ao fazer login com Google: ' + error.message, 'error');
  } finally {
    // Restaurar botão
    const googleButton = document.getElementById('login-google');
    if (googleButton) {
      googleButton.disabled = false;
      googleButton.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
    }
  }
}

// Função para mostrar toast
function showToast(message, type = 'info', duration = 3000) {
  // Usar o objeto UI se disponível, caso contrário usar implementação própria
  if (typeof UI !== 'undefined' && UI.showToast) {
    UI.showToast(message, type, duration);
    return;
  }
  
  // Implementação própria
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-times-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Mostrar toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remover toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, duration);
}