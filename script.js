document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Login
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = document.getElementById('btnSpinner');

  // DOM Elements - Screens & Navigation
  const loginScreen = document.getElementById('loginScreen');
  const blankDashboardScreen = document.getElementById('blankDashboardScreen');
  const userDisplayEmail = document.getElementById('userDisplayEmail');
  const logoutBtn = document.getElementById('logoutBtn');
  const currentYearSpan = document.getElementById('currentYear');

  // DOM Elements - Modals & Links
  const forgotPassLink = document.getElementById('forgotPassLink');
  const firstAccessLink = document.getElementById('firstAccessLink');
  const modalRecovery = document.getElementById('modalRecovery');
  const modalFirstAccess = document.getElementById('modalFirstAccess');
  const closeRecoveryModal = document.getElementById('closeRecoveryModal');
  const closeFirstAccessModal = document.getElementById('closeFirstAccessModal');
  const recoveryForm = document.getElementById('recoveryForm');
  const firstAccessForm = document.getElementById('firstAccessForm');

  // Set Current Year in Footer
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  /* ==========================================
     1. MOSTRAR / OCULTAR SENHA
     ========================================== */
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    if (isPassword) {
      eyeIcon.classList.add('hidden');
      eyeOffIcon.classList.remove('hidden');
    } else {
      eyeIcon.classList.remove('hidden');
      eyeOffIcon.classList.add('hidden');
    }
  });

  /* ==========================================
     2. VALIDAÇÃO DO FORMULÁRIO DE LOGIN
     ========================================== */
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  emailInput.addEventListener('input', () => {
    emailInput.parentElement.parentElement.classList.remove('invalid');
  });

  passwordInput.addEventListener('input', () => {
    passwordInput.parentElement.parentElement.classList.remove('invalid');
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;

    const emailValue = emailInput.value.trim();
    const passwordValue = passwordInput.value.trim();

    // Validar E-mail
    if (!emailValue || !validateEmail(emailValue)) {
      emailInput.parentElement.parentElement.classList.add('invalid');
      isValid = false;
    } else {
      emailInput.parentElement.parentElement.classList.remove('invalid');
    }

    // Validar Senha
    if (!passwordValue) {
      passwordInput.parentElement.parentElement.classList.add('invalid');
      isValid = false;
    } else {
      passwordInput.parentElement.parentElement.classList.remove('invalid');
    }

    if (!isValid) return;

    // Iniciar animação de login
    setLoadingState(true);

    // Simular autenticação e redirecionar para a tela em branco
    setTimeout(() => {
      setLoadingState(false);

      // Atualizar e-mail na tela pós-login
      if (userDisplayEmail) {
        userDisplayEmail.textContent = emailValue;
      }

      // Transição para a tela em branco pós-login
      loginScreen.classList.add('hidden');
      blankDashboardScreen.classList.remove('hidden');

      showToast('Autenticação realizada com sucesso! Bem-vindo.');
    }, 1200);
  });

  function setLoadingState(loading) {
    if (loading) {
      btnText.textContent = 'Autenticando...';
      btnSpinner.classList.remove('hidden');
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.85';
    } else {
      btnText.textContent = 'Entrar';
      btnSpinner.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }

  /* ==========================================
     3. LOGOUT (VOLTAR PARA A TELA DE LOGIN)
     ========================================== */
  logoutBtn.addEventListener('click', () => {
    blankDashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    passwordInput.value = '';
    showToast('Sessão encerrada.');
  });

  /* ==========================================
     4. CONTROLE DOS MODAIS
     ========================================== */
  // Abrir Modal Recuperar Acesso
  forgotPassLink.addEventListener('click', (e) => {
    e.preventDefault();
    modalRecovery.classList.remove('hidden');
  });

  // Abrir Modal Primeiro Acesso
  firstAccessLink.addEventListener('click', (e) => {
    e.preventDefault();
    modalFirstAccess.classList.remove('hidden');
  });

  // Fechar Modais
  closeRecoveryModal.addEventListener('click', () => {
    modalRecovery.classList.add('hidden');
  });

  closeFirstAccessModal.addEventListener('click', () => {
    modalFirstAccess.classList.add('hidden');
  });

  // Fechar ao clicar fora do card
  window.addEventListener('click', (e) => {
    if (e.target === modalRecovery) modalRecovery.classList.add('hidden');
    if (e.target === modalFirstAccess) modalFirstAccess.classList.add('hidden');
  });

  // Formulário de Recuperação (Webhook n8n)
  recoveryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recoveryEmail = document.getElementById('recoveryEmail').value.trim();
    const recoverySubmitBtn = document.getElementById('recoverySubmitBtn');
    const btnText = recoverySubmitBtn.querySelector('.btn-text');
    const spinner = document.getElementById('recoverySpinner');
    const successBox = document.getElementById('recoverySuccess');

    if (!recoveryEmail) return;

    // Estado de carregamento
    btnText.textContent = 'Enviando...';
    spinner.classList.remove('hidden');
    recoverySubmitBtn.disabled = true;

    try {
      await fetch('https://n8n.srv1077266.hstgr.cloud/webhook/recuperar_senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: recoveryEmail })
      });
    } catch (err) {
      console.warn('Requisição enviada para o webhook:', err);
    } finally {
      btnText.textContent = 'Enviar';
      spinner.classList.add('hidden');
      recoverySubmitBtn.disabled = false;

      // Exibir mensagem de confirmação para o usuário
      successBox.classList.remove('hidden');
      showToast('Pedido de recuperação enviado! Cheque seu e-mail.');

      setTimeout(() => {
        modalRecovery.classList.add('hidden');
        successBox.classList.add('hidden');
        recoveryForm.reset();
      }, 4500);
    }
  });

  // Formulário de Primeiro Acesso (Webhook n8n)
  firstAccessForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const faName = document.getElementById('faName').value.trim();
    const faEmail = document.getElementById('faEmail').value.trim();
    const firstAccessSubmitBtn = document.getElementById('firstAccessSubmitBtn');
    const btnText = firstAccessSubmitBtn.querySelector('.btn-text');
    const spinner = document.getElementById('firstAccessSpinner');
    const successBox = document.getElementById('firstAccessSuccess');

    if (!faName || !faEmail) return;

    // Estado de carregamento
    btnText.textContent = 'Enviando...';
    spinner.classList.remove('hidden');
    firstAccessSubmitBtn.disabled = true;

    try {
      await fetch('https://n8n.srv1077266.hstgr.cloud/webhook/primeiro_acesso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: faName,
          email: faEmail
        })
      });
    } catch (err) {
      console.warn('Requisição enviada para o webhook de primeiro acesso:', err);
    } finally {
      btnText.textContent = 'Enviar';
      spinner.classList.add('hidden');
      firstAccessSubmitBtn.disabled = false;

      // Exibir mensagem de confirmação para o usuário
      successBox.classList.remove('hidden');

      setTimeout(() => {
        modalFirstAccess.classList.add('hidden');
        successBox.classList.add('hidden');
        firstAccessForm.reset();
      }, 4000);
    }
  });

  /* ==========================================
     5. TOAST NOTIFICATIONS
     ========================================== */
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
