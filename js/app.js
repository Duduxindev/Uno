// App.js - Controlador principal da aplicação
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar UI
  UI.init();
  
  // Verificar autenticação e configurar evento de state change
  auth.onAuthStateChanged((user) => {
    handleAuthStateChanged(user);
  });
  
  // Configurar event listeners para formulários de autenticação
  setupFormListeners();
});

// Função para lidar com mudanças no estado de autenticação
function handleAuthStateChanged(user) {
  const pathname = window.location.pathname;
  
  if (user) {
    // Usuário está logado
    console.log('Usuário logado:', user.displayName || user.email);
    
    // Atualizar UI com informações do usuário
    updateUserUI(user);
    
    // Redirecionar conforme página atual
    if (pathname.includes('index.html') || pathname === '/') {
      // Na página inicial, mostrar menu principal
      UI.showSection('main-menu');
    }
  } else {
    // Usuário não está logado
    console.log('Nenhum usuário logado');
    
    // Redirecionar para login se estiver em páginas protegidas
    if (pathname.includes('lobby.html') || pathname.includes('game.html')) {
      window.location.href = 'index.html';
    } else if (pathname.includes('index.html') || pathname === '/') {
      // Na página inicial, mostrar tela de autenticação
      UI.showSection('auth-section');
      UI.showTab('login');
    }
  }
}

// Função para configurar eventos dos formulários
function setupFormListeners() {
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
  
  // Botões de menu principal
  setupMainMenuButtons();
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
      UI.showModal(document.getElementById('rules-modal'));
    });
  }
  
  // Botão de configurações
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      UI.showModal(document.getElementById('settings-modal'));
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
      UI.showToast('Preencha todos os campos', 'warning');
      return;
    }
    
    // Mostrar loading
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    
    // Fazer login
    await auth.signInWithEmailAndPassword(email, password);
    
    // Limpar campos
    emailInput.value = '';
    passwordInput.value = '';
    
    // Mostrar menu principal
    UI.showToast('Login realizado com sucesso!', 'success');
    UI.showSection('main-menu');
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
    
    UI.showToast(errorMessage, 'error');
  } finally {
    // Restaurar botão
    const loginButton = document.querySelector('#login-form button[type="submit"]');
    loginButton.disabled = false;
    loginButton.innerHTML = 'Entrar';
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
      UI.showToast('Preencha todos os campos', 'warning');
      return;
    }
    
    if (password !== confirmPassword) {
      UI.showToast('As senhas não coincidem', 'warning');
      return;
    }
    
    if (password.length < 6) {
      UI.showToast('A senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }
    
    // Mostrar loading
    const registerButton = document.querySelector('#register-form button[type="submit"]');
    registerButton.disabled = true;
    registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    // Criar usuário
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
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
    UI.showToast('Registro realizado com sucesso!', 'success');
    UI.showSection('main-menu');
  } catch (error) {
    console.error('Erro no registro:', error);
    
    // Mensagens de erro específicas
    let errorMessage = 'Erro ao registrar. Tente novamente.';
    
    errorMessage = 'Este e-mail já está em uso. Tente outro.';
  } else if (error.code === 'auth/invalid-email') {
    errorMessage = 'E-mail inválido. Verifique o formato.';
  } else if (error.code === 'auth/weak-password') {
    errorMessage = 'Senha fraca. Use uma senha mais forte.';
  }
  
  UI.showToast(errorMessage, 'error');
} finally {
  // Restaurar botão
  const registerButton = document.querySelector('#register-form button[type="submit"]');
  registerButton.disabled = false;
  registerButton.innerHTML = 'Registrar';
}


// Função para lidar com o logout
async function handleLogout() {
try {
  // Mostrar confirmação
  if (confirm('Tem certeza que deseja sair?')) {
    await auth.signOut();
    UI.showToast('Logout realizado com sucesso!', 'success');
    
    // Mostrar tela de autenticação
    UI.showSection('auth-section');
    UI.showTab('login');
  }
} catch (error) {
  console.error('Erro no logout:', error);
  UI.showToast('Erro ao fazer logout: ' + error.message, 'error');
}
}

// Função para atualizar UI com informações do usuário
function updateUserUI(user) {
// Atualizar nome do usuário
const usernameElements = document.querySelectorAll('.username');
usernameElements.forEach(element => {
  element.textContent = user.displayName || 'Jogador';
});

// Atualizar avatar do usuário
const userAvatarElements = document.querySelectorAll('.user-avatar');
userAvatarElements.forEach(element => {
  // Prioridade: 1. avatarURL do localStorage, 2. avatar semente do localStorage, 3. photoURL do usuário, 4. avatar gerado do uid
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
    const fixedSeed = user.uid.substring(0, 8);
    element.src = `https://api.dicebear.com/6.x/avataaars/svg?seed=${fixedSeed}`;
  }
});
}

// Função para login com Google
async function loginWithGoogle() {
try {
  // Mostrar loading
  const googleButton = document.getElementById('login-google');
  if (googleButton) {
    googleButton.disabled = true;
    googleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
  }
  
  // Fazer login com Google
  const result = await auth.signInWithPopup(googleProvider);
  
  // Verificar se é a primeira vez que o usuário loga
  const isNewUser = result.additionalUserInfo.isNewUser;
  
  if (isNewUser) {
    // Gerar avatar aleatório e salvar
    const avatarSeed = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('avatar', avatarSeed);
  }
  
  // Mostrar menu principal
  UI.showToast('Login realizado com sucesso!', 'success');
  UI.showSection('main-menu');
} catch (error) {
  console.error('Erro no login com Google:', error);
  UI.showToast('Erro ao fazer login com Google: ' + error.message, 'error');
} finally {
  // Restaurar botão
  const googleButton = document.getElementById('login-google');
  if (googleButton) {
    googleButton.disabled = false;
    googleButton.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
  }
}
}

// Função para atualizar configurações
async function updateSettings(form) {
try {
  const user = auth.currentUser;
  if (!user) {
    UI.showToast('Você precisa estar logado para atualizar as configurações', 'error');
    return;
  }
  
  // Obter valores do formulário
  const displayName = form.elements['display-name'].value.trim();
  const avatarSeed = form.elements['avatar-seed'].value;
  
  // Validar campos
  if (!displayName) {
    UI.showToast('Digite um nome de exibição', 'warning');
    return;
  }
  
  // Mostrar loading
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
  
  // Atualizar nome de exibição
  await user.updateProfile({
    displayName: displayName
  });
  
  // Salvar avatar
  if (avatarSeed) {
    localStorage.setItem('avatar', avatarSeed);
  }
  
  // Fechar modal e atualizar UI
  UI.closeModal(document.getElementById('settings-modal'));
  updateUserUI(user);
  
  UI.showToast('Configurações atualizadas com sucesso!', 'success');
} catch (error) {
  console.error('Erro ao atualizar configurações:', error);
  UI.showToast('Erro ao atualizar configurações: ' + error.message, 'error');
} finally {
  // Restaurar botão
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = false;
  submitButton.innerHTML = 'Salvar Alterações';
}
}