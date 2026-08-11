document.addEventListener('DOMContentLoaded', async () => {
  // Inicialização do Supabase Client
  const SUPABASE_URL = 'https://jqyxtrzcwgropuqchwiz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeXh0cnpjd2dyb3B1cWNod2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjIzMDgsImV4cCI6MjEwMjAzODMwOH0.m9ZpiTanwhl5SzzAfJoTs1x9KekWuFqB0C3d__0mIbA';

  const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

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
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const userDisplayName = document.getElementById('userDisplayName');
  const userAvatar = document.getElementById('userAvatar');
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

  // Toggle da Sidebar Retrátil
  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Verificar sessão ativa do Supabase ao carregar
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      showDashboard(session.user);
    }
  }

  function showDashboard(user) {
    let name = '';

    if (typeof user === 'object' && user !== null) {
      name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
    } else if (typeof user === 'string') {
      name = user.split('@')[0] || 'Usuário';
    }

    // Formatar nome com primeira letra maiúscula
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    const initialLetter = formattedName.charAt(0).toUpperCase();

    if (userDisplayName) {
      userDisplayName.textContent = formattedName;
    }
    if (userAvatar) {
      userAvatar.textContent = initialLetter;
    }

    loginScreen.classList.add('hidden');
    blankDashboardScreen.classList.remove('hidden');
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
     2. VALIDAÇÃO E AUTENTICAÇÃO DE LOGIN (SUPABASE)
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

  loginForm.addEventListener('submit', async (e) => {
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

    if (supabase) {
      // Autenticação real via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue
      });

      setLoadingState(false);

      if (error) {
        showToast(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
        return;
      }

      showDashboard(data.user);
      showToast('Autenticação realizada com sucesso! Bem-vindo.');
    } else {
      // Fallback de demonstração caso o SDK não carregue
      setTimeout(() => {
        setLoadingState(false);
        showDashboard(emailValue);
        showToast('Autenticação realizada com sucesso! (Modo Demo)');
      }, 1000);
    }
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
  logoutBtn.addEventListener('click', async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
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

  // Fechar ao clicar fora do card ou pressionar ESC
  window.addEventListener('click', (e) => {
    if (e.target === modalRecovery) modalRecovery.classList.add('hidden');
    if (e.target === modalFirstAccess) modalFirstAccess.classList.add('hidden');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalRecovery.classList.add('hidden');
      modalFirstAccess.classList.add('hidden');
    }
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
     5. ALTERNÂNCIA DE VISUALIZAÇÃO CRM (KANBAN x LISTA)
     ========================================== */
  const viewKanbanBtn = document.getElementById('viewKanbanBtn');
  const viewListBtn = document.getElementById('viewListBtn');
  const crmKanbanView = document.getElementById('crmKanbanView');
  const crmListView = document.getElementById('crmListView');

  if (viewKanbanBtn && viewListBtn && crmKanbanView && crmListView) {
    viewKanbanBtn.addEventListener('click', () => {
      viewKanbanBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      crmKanbanView.classList.remove('hidden');
      crmListView.classList.add('hidden');
    });

    viewListBtn.addEventListener('click', () => {
      viewListBtn.classList.add('active');
      viewKanbanBtn.classList.remove('active');
      crmListView.classList.remove('hidden');
      crmKanbanView.classList.add('hidden');
    });
  }

  /* ==========================================
     6. GERENCIAMENTO DE CARDS E FLUXO DO CRM (SUPABASE)
     ========================================== */
  const modalAddCard = document.getElementById('modalAddCard');
  const closeAddCardModal = document.getElementById('closeAddCardModal');
  const addCardForm = document.getElementById('addCardForm');
  const cardStageInput = document.getElementById('cardStageInput');
  let currentUserId = null;

  // Clique no '+' cria o card instantaneamente com dados padrão (Sem Pop-up)
  const crmKanbanBoard = document.getElementById('crmKanbanView');
  if (crmKanbanBoard) {
    crmKanbanBoard.addEventListener('click', async (e) => {
      const btnAdd = e.target.closest('.btn-add-card');
      if (btnAdd) {
        const column = btnAdd.closest('.kanban-column');
        const stage = column ? column.dataset.stage : 'novo';
        
        // Dados Padrão para novo card
        const defaultData = {
          nome: 'Novo Cliente',
          telefone: '(11) 99999-9999',
          data_requerimento: new Date().toISOString().split('T')[0],
          status: stage
        };

        if (supabase) {
          if (!currentUserId) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
              currentUserId = session.user.id;
            }
          }

          if (!currentUserId) {
            showToast('Erro: Faça login para adicionar cards.');
            return;
          }

          const { error } = await supabase.from('oportunidades_crm').insert([{
            ...defaultData,
            user_id: currentUserId
          }]);

          if (error) {
            showToast('Erro ao criar card: ' + error.message);
            return;
          }

          loadUserCards();
          showToast('Novo card adicionado!');
        }
      }
    });
  }

  // Atualizar a renderização do CRM com os cards do usuário logado
  async function loadUserCards() {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;
    currentUserId = session.user.id;

    // Buscar oportunidades atreladas exclusivamente ao usuário logado
    const { data: cards, error } = await supabase
      .from('oportunidades_crm')
      .select('*')
      .eq('user_id', currentUserId)
      .order('criado_em', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar oportunidades:', error.message);
      return;
    }

    renderKanbanCards(cards || []);
  }

  // Gerenciamento do Modal de Confirmação de Exclusão
  const modalDeleteConfirm = document.getElementById('modalDeleteConfirm');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteCardName = document.getElementById('deleteCardName');
  let cardToDelete = null;
  let cardElementToDelete = null;

  function openDeleteModal(card, cardElement) {
    cardToDelete = card;
    cardElementToDelete = cardElement;
    if (deleteCardName) deleteCardName.textContent = `"${card.nome}"`;
    if (modalDeleteConfirm) modalDeleteConfirm.classList.remove('hidden');
  }

  function closeDeleteConfirmModal() {
    cardToDelete = null;
    cardElementToDelete = null;
    if (modalDeleteConfirm) modalDeleteConfirm.classList.add('hidden');
  }

  if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteConfirmModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);

  window.addEventListener('click', (e) => {
    if (e.target === modalDeleteConfirm) closeDeleteConfirmModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalDeleteConfirm) closeDeleteConfirmModal();
  });

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (cardToDelete) {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Excluindo...';

        if (supabase) {
          await supabase.from('oportunidades_crm').delete().eq('id', cardToDelete.id);
        }

        if (cardElementToDelete) cardElementToDelete.remove();
        loadUserCards(); // Atualiza contadores das colunas

        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Sim, Excluir';
        closeDeleteConfirmModal();
        showToast('Oportunidade excluída com sucesso.');
      }
    });
  }

  function renderKanbanCards(cards) {
    // Limpar containers das 5 colunas
    const stages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
    stages.forEach(stage => {
      const column = document.querySelector(`.kanban-column[data-stage="${stage}"]`);
      if (column) {
        const container = column.querySelector('.kanban-cards-container');
        const countSpan = column.querySelector('.column-count');
        container.innerHTML = '';
        
        const stageCards = cards.filter(c => c.status === stage);
        countSpan.textContent = stageCards.length;

        stageCards.forEach(card => {
          container.appendChild(createCardElement(card));
        });
      }
    });
  }

  function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'kanban-card';
    cardDiv.dataset.id = card.id;

    // Formatação da Data (DD/MM/AA) e Lógica de Cores por Período
    let formattedDate = '--/--/--';
    let dateStatusClass = 'date-gray'; // Padrão: Cinza

    if (card.data_requerimento) {
      const [year, month, day] = card.data_requerimento.split('-').map(Number);
      formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;

      // Cálculo de diferença em dias em relação à data atual (sem horário)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const targetDate = new Date(year, month - 1, day);
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        dateStatusClass = 'date-purple'; // A data já passou -> Roxo
      } else if (diffDays <= 7) {
        dateStatusClass = 'date-red';    // A data está a 7 ou menos dias -> Vermelho
      } else if (diffDays <= 30) {
        dateStatusClass = 'date-yellow'; // A data está entre 30 e 7 dias -> Amarelo
      } else {
        dateStatusClass = 'date-gray';   // Outras datas -> Cinza
      }
    }

    // Formatação do Link para WhatsApp (apenas números)
    const rawPhone = card.telefone ? card.telefone.replace(/\D/g, '') : '';
    const whatsappUrl = rawPhone ? `https://wa.me/55${rawPhone}` : '#';

    cardDiv.innerHTML = `
      <div class="card-top-row">
        <h5 class="card-client-name">${escapeHtml(card.nome)}</h5>
        <button class="btn-delete-card" title="Excluir Oportunidade" aria-label="Excluir card">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
      <div class="card-detail-item">
        <a href="${whatsappUrl}" target="_blank" class="whatsapp-link" title="Abrir conversa no WhatsApp">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          ${escapeHtml(card.telefone || 'Sem telefone')}
        </a>
      </div>
      <div class="card-detail-item card-date-badge ${dateStatusClass}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        Req: ${formattedDate}
        <span class="date-dot" title="Status da Data"></span>
      </div>
    `;

    // Evento de Exclusão do Card com Modal Customizado
    const btnDelete = cardDiv.querySelector('.btn-delete-card');
    btnDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(card, cardDiv);
    });

    return cardDiv;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }



  // Carregar os cards ao exibir o Dashboard
  const originalShowDashboard = showDashboard;
  showDashboard = function(user) {
    originalShowDashboard(user);
    loadUserCards();
  };

  /* ==========================================
     6. TOAST NOTIFICATIONS
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
