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

  // Dicionários Globais de Estágios
  const stageLabels = {
    'novo': 'Novo',
    'qualificacao': 'Qualificação',
    'acompanhamento': 'Acompanhamento',
    'reuniao': 'Reunião',
    'proposta': 'Proposta'
  };

  const stageDotClasses = {
    'novo': 'dot-novo',
    'qualificacao': 'dot-qualificacao',
    'acompanhamento': 'dot-acompanhamento',
    'reuniao': 'dot-reuniao',
    'proposta': 'dot-proposta'
  };

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

    // Carregar automaticamente os cards do CRM do usuário logado ao exibir o dashboard
    loadUserCards();
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
        
        // Dados Padrão para novo card (Documentos Obrigatórios iniciam como 'Pendente')
        const defaultData = {
          nome: 'Novo Cliente',
          telefone: '(11) 99999-9999',
          data_requerimento: new Date().toISOString().split('T')[0],
          status: stage,
          doc_procuracoes: 'Pendente',
          doc_rg_cnh: 'Pendente',
          doc_certidao: 'Pendente',
          doc_cnis: 'Pendente',
          doc_carteira_trabalho: 'Pendente'
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

  let allUserCards = []; // Armazena a lista de cards carregados para pesquisa instantânea

  // Pesquisa em tempo real (Filtra Nome ou Sequência de Telefone sem limitações)
  const crmSearchInput = document.getElementById('crmSearchInput');
  if (crmSearchInput) {
    crmSearchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      filterAndRenderCards(searchTerm);
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

    allUserCards = cards || [];
    const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
    filterAndRenderCards(searchTerm);
  }

  function filterAndRenderCards(searchTerm) {
    if (!searchTerm) {
      renderKanbanCards(allUserCards);
      return;
    }

    // Normalizar termo de pesquisa (remover caracteres especiais para facilitar busca por telefone)
    const cleanSearchTerm = searchTerm.replace(/\D/g, '');

    const filtered = allUserCards.filter(card => {
      // 1. Busca por Nome (primeiro nome, sobrenome ou qualquer pedaço)
      const nameMatch = card.nome && card.nome.toLowerCase().includes(searchTerm);

      // 2. Busca por Telefone (comparando tanto a string formatada quanto apenas os dígitos limpos)
      const rawPhone = card.telefone ? card.telefone.replace(/\D/g, '') : '';
      const phoneFormattedMatch = card.telefone && card.telefone.toLowerCase().includes(searchTerm);
      const phoneDigitsMatch = cleanSearchTerm && rawPhone.includes(cleanSearchTerm);

      return nameMatch || phoneFormattedMatch || phoneDigitsMatch;
    });

    renderKanbanCards(filtered);
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

    // Clique no Card para Abrir Ficha do Cliente (ignora cliques no botão de exclusão e no link do WhatsApp)
    cardDiv.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-card') || e.target.closest('.whatsapp-link')) return;
      openClientSheetModal(card);
    });

    // Evento de Exclusão do Card com Modal Customizado
    const btnDelete = cardDiv.querySelector('.btn-delete-card');
    if (btnDelete) {
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteModal(card, cardDiv);
      });
    }

    return cardDiv;
  }

  /* ==========================================
     GERENCIAMENTO DO MODAL: FICHA DO CLIENTE (A4 E GUIAS)
     ========================================== */
  const modalClientSheet = document.getElementById('modalClientSheet');
  const closeClientSheetModal = document.getElementById('closeClientSheetModal');
  const browserTabs = document.querySelectorAll('.browser-tab');
  const tabContentFicha = document.getElementById('tabContentFicha');
  const tabContentDocumentos = document.getElementById('tabContentDocumentos');
  const sheetClientNameInput = document.getElementById('sheetClientNameInput');
  const clientSheetForm = document.getElementById('clientSheetForm');
  const sheetPhone = document.getElementById('sheetPhone');
  const sheetEmail = document.getElementById('sheetEmail');
  const sheetProfissao = document.getElementById('sheetProfissao');
  const sheetEstadoCivil = document.getElementById('sheetEstadoCivil');
  const sheetRg = document.getElementById('sheetRg');
  const sheetCpf = document.getElementById('sheetCpf');
  const sheetCep = document.getElementById('sheetCep');
  const sheetEndereco = document.getElementById('sheetEndereco');
  const sheetComplemento = document.getElementById('sheetComplemento');
  const sheetUf = document.getElementById('sheetUf');
  const sheetCidade = document.getElementById('sheetCidade');
  const sheetBairro = document.getElementById('sheetBairro');
  const saveClientSheetBtn = document.getElementById('saveClientSheetBtn');

  // Máscaras de entrada em tempo real
  if (sheetPhone) {
    sheetPhone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 10) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
      } else if (v.length > 0) {
        v = v.replace(/^(\d*)$/, '($1');
      }
      e.target.value = v;
    });
  }

  if (sheetCpf) {
    sheetCpf.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  if (sheetCep) {
    sheetCep.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 8) v = v.slice(0, 8);
      v = v.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2-$3');
      e.target.value = v;
    });
  }

  if (sheetRg) {
    sheetRg.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }

  function openClientSheetModal(card) {
    try {
      currentActiveCard = card;
      
      // Preencher Nome (Título editável)
      const inputName = document.getElementById('sheetClientNameInput');
      if (inputName) inputName.value = card.nome || '';
      
      // Preencher demais campos da Ficha com segurança
      const elPhone = document.getElementById('sheetPhone');
      if (elPhone) elPhone.value = card.telefone || '';

      const elEmail = document.getElementById('sheetEmail');
      if (elEmail) elEmail.value = card.email || '';

      const elProfissao = document.getElementById('sheetProfissao');
      if (elProfissao) elProfissao.value = card.profissao || '';

      const elEstadoCivil = document.getElementById('sheetEstadoCivil');
      if (elEstadoCivil) elEstadoCivil.value = card.estado_civil || '';

      const elRg = document.getElementById('sheetRg');
      if (elRg) elRg.value = card.rg || '';

      const elCpf = document.getElementById('sheetCpf');
      if (elCpf) elCpf.value = card.cpf || '';

      const elCep = document.getElementById('sheetCep');
      if (elCep) elCep.value = card.cep || '';

      const elEndereco = document.getElementById('sheetEndereco');
      if (elEndereco) elEndereco.value = card.endereco || '';

      const elComplemento = document.getElementById('sheetComplemento');
      if (elComplemento) elComplemento.value = card.complemento || '';

      const elUf = document.getElementById('sheetUf');
      if (elUf) elUf.value = card.uf || '';

      const elCidade = document.getElementById('sheetCidade');
      if (elCidade) elCidade.value = card.cidade || '';

      const elBairro = document.getElementById('sheetBairro');
      if (elBairro) elBairro.value = card.bairro || '';

      // Preencher campos da guia Respostas
      const elJaContribuiu = document.getElementById('respJaContribuiu');
      if (elJaContribuiu) elJaContribuiu.value = card.ja_contribuiu || '';

      const elTempoContribuicao = document.getElementById('respTempoContribuicao');
      if (elTempoContribuicao) elTempoContribuicao.value = card.tempo_contribuicao !== undefined && card.tempo_contribuicao !== null ? card.tempo_contribuicao : '';

      const elTipoTrabalho = document.getElementById('respTipoTrabalho');
      if (elTipoTrabalho) elTipoTrabalho.value = card.tipo_trabalho || '';

      const elSolicitouBeneficio = document.getElementById('respSolicitouBeneficio');
      if (elSolicitouBeneficio) elSolicitouBeneficio.value = card.solicitou_beneficio || '';

      const elDetalhes = document.getElementById('respDetalhes');
      if (elDetalhes) elDetalhes.value = card.detalhes || '';

      // Preencher campos da guia Documentos (Etiquetas de Status e Lista Eventuais)
      renderDocumentBadges(card);
      renderEventualDocs(card);
      updateSheetNotesBadge(card);

      // Atualizar estado visual do botão Etiqueta (Status)
      updateStatusTagUI(card.status || 'novo');

      // Resetar para a aba 'Respostas' ativa por padrão (primeira guia)
      switchTab('respostas');

      const modal = document.getElementById('modalClientSheet');
      if (modal) modal.classList.remove('hidden');
    } catch (err) {
      console.error('Erro ao abrir ficha do cliente:', err);
    }
  }

  // Sequência de rotação de status das etiquetas ao clicar
  const docStatusOrder = ['Pendente', 'Solicitado', 'Validar', 'Recebido'];
  const docStatusClasses = {
    'Pendente': 'badge-pendente',
    'Solicitado': 'badge-solicitado',
    'Validar': 'badge-validar',
    'Recebido': 'badge-recebido'
  };

  const obrigatorioKeys = ['doc_procuracoes', 'doc_rg_cnh', 'doc_certidao', 'doc_cnis', 'doc_carteira_trabalho'];

  function updateDocsCounters() {
    if (!currentActiveCard) return;

    // 1. Contagem dos Obrigatórios (Total: 5)
    let obgRecebidos = 0;
    obrigatorioKeys.forEach(key => {
      if (currentActiveCard[key] === 'Recebido') {
        obgRecebidos++;
      }
    });
    const countObgEl = document.getElementById('countObrigatorios');
    if (countObgEl) countObgEl.textContent = `${obgRecebidos}/5`;

    // 2. Contagem dos Eventuais (Total dinâmico)
    let eventuaisList = currentActiveCard.eventuais;
    if (typeof eventuaisList === 'string') {
      try { eventuaisList = JSON.parse(eventuaisList); } catch (e) { eventuaisList = []; }
    }
    if (!Array.isArray(eventuaisList)) eventuaisList = [];

    let evtRecebidos = 0;
    eventuaisList.forEach(item => {
      if (item.status === 'Recebido') {
        evtRecebidos++;
      }
    });
    const countEvtEl = document.getElementById('countEventuais');
    if (countEvtEl) countEvtEl.textContent = `${evtRecebidos}/${eventuaisList.length}`;
  }

  function renderDocumentBadges(card) {
    document.querySelectorAll('.doc-status-badge').forEach(badge => {
      const docKey = badge.dataset.docKey;
      if (!docKey) return;

      const currentStatus = card[docKey] || 'Pendente';
      updateBadgeUI(badge, currentStatus);
    });
    updateDocsCounters();
  }

  function updateBadgeUI(badge, status) {
    badge.dataset.status = status;
    badge.className = `doc-status-badge ${docStatusClasses[status] || 'badge-pendente'}`;
    badge.innerHTML = `<span class="doc-badge-dot"></span> ${status}`;
  }

  // Evento de clique nas etiquetas de documentos para rotação automática
  document.querySelectorAll('.doc-status-badge').forEach(badge => {
    badge.addEventListener('click', async () => {
      if (!currentActiveCard || !supabase) return;

      const docKey = badge.dataset.docKey;
      const currentStatus = badge.dataset.status || 'Pendente';
      
      // Encontrar o próximo status no ciclo: Pendente -> Solicitado -> Validar -> Recebido -> Pendente
      const currentIndex = docStatusOrder.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % docStatusOrder.length;
      const newStatus = docStatusOrder[nextIndex];

      // Atualizar UI instantaneamente
      updateBadgeUI(badge, newStatus);
      currentActiveCard[docKey] = newStatus;
      updateDocsCounters();

      // Gravar alteração na coluna correspondente da tabela no Supabase
      const { error } = await supabase
        .from('oportunidades_crm')
        .update({ [docKey]: newStatus })
        .eq('id', currentActiveCard.id);

      if (error) {
        showToast('Erro ao atualizar documento: ' + error.message);
        // Reverter UI em caso de falha
        updateBadgeUI(badge, currentStatus);
        currentActiveCard[docKey] = currentStatus;
        updateDocsCounters();
      }
    });
  });

  // Alternância (Toggle Acordeão) da Categoria 'Obrigatórios'
  const toggleObrigatoriosBtn = document.getElementById('toggleObrigatoriosBtn');
  const listObrigatoriosContent = document.getElementById('listObrigatoriosContent');

  if (toggleObrigatoriosBtn && listObrigatoriosContent) {
    toggleObrigatoriosBtn.addEventListener('click', () => {
      const isExpanded = toggleObrigatoriosBtn.getAttribute('aria-expanded') === 'true';
      toggleObrigatoriosBtn.setAttribute('aria-expanded', !isExpanded);
      listObrigatoriosContent.classList.toggle('collapsed', isExpanded);
    });
  }

  // Alternância (Toggle Acordeão) da Categoria 'Eventuais'
  const toggleEventuaisBtn = document.getElementById('toggleEventuaisBtn');
  const listEventuaisContent = document.getElementById('listEventuaisContent');

  if (toggleEventuaisBtn && listEventuaisContent) {
    toggleEventuaisBtn.addEventListener('click', () => {
      const isExpanded = toggleEventuaisBtn.getAttribute('aria-expanded') === 'true';
      toggleEventuaisBtn.setAttribute('aria-expanded', !isExpanded);
      listEventuaisContent.classList.toggle('collapsed', isExpanded);
    });
  }

  /* ==========================================
     LÓGICA DA CATEGORIA 'EVENTUAIS' (DINÂMICA VIA JSONB)
     ========================================== */
  const newEventualDocName = document.getElementById('newEventualDocName');
  const addEventualDocBtn = document.getElementById('addEventualDocBtn');
  const eventualDocsDynamicList = document.getElementById('eventualDocsDynamicList');

  // Renderizar a lista de documentos eventuais do card ativo
  function renderEventualDocs(card) {
    if (!eventualDocsDynamicList) return;
    eventualDocsDynamicList.innerHTML = '';

    let docs = card.eventuais;
    if (typeof docs === 'string') {
      try { docs = JSON.parse(docs); } catch (e) { docs = []; }
    }
    if (!Array.isArray(docs)) docs = [];

    if (docs.length === 0) {
      eventualDocsDynamicList.innerHTML = `
        <div style="font-size: 0.84rem; color: #94A3B8; font-style: italic; padding: 0.35rem 0;">
          Nenhum documento eventual adicionado.
        </div>
      `;
      return;
    }

    docs.forEach((docItem, index) => {
      const docName = docItem.nome || 'Documento sem nome';
      const status = docItem.status || 'Pendente';

      const itemDiv = document.createElement('div');
      itemDiv.className = 'doc-item';
      itemDiv.innerHTML = `
        <span class="doc-name">${escapeHtml(docName)}</span>
        <div class="doc-item-actions">
          <button type="button" class="doc-status-badge ${docStatusClasses[status] || 'badge-pendente'}" data-eventual-index="${index}" data-status="${escapeHtml(status)}">
            <span class="doc-badge-dot"></span> ${escapeHtml(status)}
          </button>
          <button type="button" class="btn-remove-doc" data-eventual-index="${index}" title="Excluir documento" aria-label="Excluir documento">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;

      // Evento de clique para alternar o status do documento eventual
      const badgeBtn = itemDiv.querySelector('.doc-status-badge');
      badgeBtn.addEventListener('click', async () => {
        const currentIndex = docStatusOrder.indexOf(status);
        const nextIndex = (currentIndex + 1) % docStatusOrder.length;
        const newStatus = docStatusOrder[nextIndex];

        docs[index].status = newStatus;
        await saveEventualDocsToSupabase(docs);
      });

      // Evento de clique para remover o documento eventual
      const removeBtn = itemDiv.querySelector('.btn-remove-doc');
      removeBtn.addEventListener('click', async () => {
        docs.splice(index, 1);
        await saveEventualDocsToSupabase(docs);
      });

      eventualDocsDynamicList.appendChild(itemDiv);
    });
  }

  // Função auxiliar para salvar a lista de eventuais no Supabase
  async function saveEventualDocsToSupabase(updatedDocsArray) {
    if (!currentActiveCard || !supabase) return;

    const { error } = await supabase
      .from('oportunidades_crm')
      .update({ eventuais: updatedDocsArray })
      .eq('id', currentActiveCard.id);

    if (error) {
      showToast('Erro ao atualizar documentos eventuais: ' + error.message);
      return;
    }

    currentActiveCard.eventuais = updatedDocsArray;
    renderEventualDocs(currentActiveCard);
    updateDocsCounters();
  }

  // Adicionar Novo Documento Eventual
  if (addEventualDocBtn && newEventualDocName) {
    const handleAddEventual = async () => {
      const docTitle = newEventualDocName.value.trim();
      if (!docTitle) {
        showToast('Digite o nome do documento.');
        return;
      }

      let docs = currentActiveCard.eventuais;
      if (typeof docs === 'string') {
        try { docs = JSON.parse(docs); } catch (e) { docs = []; }
      }
      if (!Array.isArray(docs)) docs = [];

      docs.push({
        nome: docTitle,
        status: 'Pendente'
      });

      newEventualDocName.value = '';
      await saveEventualDocsToSupabase(docs);
      showToast('Documento eventual adicionado!');
    };

    addEventualDocBtn.addEventListener('click', handleAddEventual);
    newEventualDocName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddEventual();
      }
    });
  }

  // Salvamento das informações da Ficha no Supabase
  if (clientSheetForm) {
    clientSheetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentActiveCard || !supabase) return;

      const updatedNome = sheetClientNameInput ? sheetClientNameInput.value.trim() : '';
      const updatedPhone = sheetPhone ? sheetPhone.value.trim() : '';

      if (!updatedNome) {
        showToast('O nome do cliente é obrigatório.');
        return;
      }

      if (saveClientSheetBtn) {
        saveClientSheetBtn.disabled = true;
        saveClientSheetBtn.innerHTML = 'Salvando...';
      }

      const updatedData = {
        nome: updatedNome,
        telefone: updatedPhone,
        email: sheetEmail ? sheetEmail.value.trim() : '',
        profissao: sheetProfissao ? sheetProfissao.value.trim() : '',
        estado_civil: sheetEstadoCivil ? sheetEstadoCivil.value : '',
        rg: sheetRg ? sheetRg.value.trim() : '',
        cpf: sheetCpf ? sheetCpf.value.trim() : '',
        cep: sheetCep ? sheetCep.value.trim() : '',
        endereco: sheetEndereco ? sheetEndereco.value.trim() : '',
        complemento: sheetComplemento ? sheetComplemento.value.trim() : '',
        uf: sheetUf ? sheetUf.value : '',
        cidade: sheetCidade ? sheetCidade.value.trim() : '',
        bairro: sheetBairro ? sheetBairro.value.trim() : ''
      };

      const { error } = await supabase
        .from('oportunidades_crm')
        .update(updatedData)
        .eq('id', currentActiveCard.id);

      if (saveClientSheetBtn) {
        saveClientSheetBtn.disabled = false;
        saveClientSheetBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Salvar Ficha do Cliente
        `;
      }

      if (error) {
        showToast('Erro ao salvar ficha: ' + error.message);
        return;
      }

      // Atualizar objeto local ativo e recarregar os cards no Kanban
      Object.assign(currentActiveCard, updatedData);
      loadUserCards();
      showToast('Ficha do cliente salva com sucesso!');
    });
  }

  // Salvamento das informações da guia RESPOSTAS no Supabase
  const clientAnswersForm = document.getElementById('clientAnswersForm');
  const saveClientAnswersBtn = document.getElementById('saveClientAnswersBtn');

  if (clientAnswersForm) {
    clientAnswersForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentActiveCard || !supabase) return;

      if (saveClientAnswersBtn) {
        saveClientAnswersBtn.disabled = true;
        saveClientAnswersBtn.innerHTML = 'Salvando...';
      }

      const respJaContribuiu = document.getElementById('respJaContribuiu');
      const respTempoContribuicao = document.getElementById('respTempoContribuicao');
      const respTipoTrabalho = document.getElementById('respTipoTrabalho');
      const respSolicitouBeneficio = document.getElementById('respSolicitouBeneficio');
      const respDetalhes = document.getElementById('respDetalhes');

      const updatedAnswers = {
        ja_contribuiu: respJaContribuiu ? respJaContribuiu.value : '',
        tempo_contribuicao: respTempoContribuicao && respTempoContribuicao.value !== '' ? parseInt(respTempoContribuicao.value, 10) : null,
        tipo_trabalho: respTipoTrabalho ? respTipoTrabalho.value : '',
        solicitou_beneficio: respSolicitouBeneficio ? respSolicitouBeneficio.value : '',
        detalhes: respDetalhes ? respDetalhes.value.trim() : ''
      };

      const { error } = await supabase
        .from('oportunidades_crm')
        .update(updatedAnswers)
        .eq('id', currentActiveCard.id);

      if (saveClientAnswersBtn) {
        saveClientAnswersBtn.disabled = false;
        saveClientAnswersBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Salvar Respostas
        `;
      }

      if (error) {
        showToast('Erro ao salvar respostas: ' + error.message);
        return;
      }

      Object.assign(currentActiveCard, updatedAnswers);
      showToast('Respostas salvas com sucesso!');
    });
  }

  function updateStatusTagUI(stage) {
    if (sheetStatusText) sheetStatusText.textContent = stageLabels[stage] || 'Novo';
    if (sheetStatusDot) {
      sheetStatusDot.className = 'status-tag-dot ' + (stageDotClasses[stage] || 'dot-novo');
    }
  }

  function closeClientSheet() {
    currentActiveCard = null;
    closeNotesSidebar();
    if (statusDropdownMenu) statusDropdownMenu.classList.add('hidden');
    if (modalClientSheet) modalClientSheet.classList.add('hidden');
  }

  /* ==========================================
     SISTEMA DE OBSERVAÇÕES INTERNAS (SLIDE SIDEBAR)
     ========================================== */
  const sheetNotesBtn = document.getElementById('sheetNotesBtn');
  const notesSidebarDrawer = document.getElementById('notesSidebarDrawer');
  const notesSidebarOverlay = document.getElementById('notesSidebarOverlay');
  const closeNotesSidebarBtn = document.getElementById('closeNotesSidebarBtn');
  const notesSidebarBody = document.getElementById('notesSidebarBody');
  const addNoteForm = document.getElementById('addNoteForm');
  const newNoteInput = document.getElementById('newNoteInput');

  function openNotesSidebar() {
    if (notesSidebarDrawer) notesSidebarDrawer.classList.remove('hidden');
    if (notesSidebarOverlay) notesSidebarOverlay.classList.remove('hidden');
    if (currentActiveCard) {
      renderInternalNotes(currentActiveCard);
    }
    setTimeout(() => {
      if (newNoteInput) newNoteInput.focus();
    }, 150);
  }

  function closeNotesSidebar() {
    if (notesSidebarDrawer) notesSidebarDrawer.classList.add('hidden');
    if (notesSidebarOverlay) notesSidebarOverlay.classList.add('hidden');
  }

  if (sheetNotesBtn) sheetNotesBtn.addEventListener('click', openNotesSidebar);
  if (closeNotesSidebarBtn) closeNotesSidebarBtn.addEventListener('click', closeNotesSidebar);
  if (notesSidebarOverlay) notesSidebarOverlay.addEventListener('click', closeNotesSidebar);

  // Formatação de data/hora no padrão (Ex: 11/08, 18:34)
  function formatNoteDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}, ${hours}:${minutes}`;
  }

  const sheetNotesCountBadge = document.getElementById('sheetNotesCountBadge');

  function updateSheetNotesBadge(card) {
    if (!sheetNotesCountBadge) return;

    let notes = card ? card.notas_internas : [];
    if (typeof notes === 'string') {
      try { notes = JSON.parse(notes); } catch (e) { notes = []; }
    }
    if (!Array.isArray(notes)) notes = [];

    const count = notes.length;
    if (count > 0) {
      sheetNotesCountBadge.textContent = count > 99 ? '99+' : count;
      sheetNotesCountBadge.classList.remove('hidden');
    } else {
      sheetNotesCountBadge.textContent = '0';
      sheetNotesCountBadge.classList.add('hidden');
    }
  }

  // Renderizar Notas Internas
  function renderInternalNotes(card) {
    updateSheetNotesBadge(card);
    if (!notesSidebarBody) return;
    notesSidebarBody.innerHTML = '';

    let notes = card.notas_internas;
    if (typeof notes === 'string') {
      try { notes = JSON.parse(notes); } catch (e) { notes = []; }
    }
    if (!Array.isArray(notes)) notes = [];

    if (notes.length === 0) {
      notesSidebarBody.innerHTML = `
        <div class="notes-empty-state">
          Nenhuma observação registrada ainda.
        </div>
      `;
      return;
    }

    notes.forEach(note => {
      const author = note.usuario || 'Usuário';
      const timeStr = formatNoteDate(note.created_at || note.data_hora);
      const textContent = note.texto || '';

      const cardDiv = document.createElement('div');
      cardDiv.className = 'note-card';
      cardDiv.innerHTML = `
        <div class="note-author-row">
          <span class="note-author-name">${escapeHtml(author)}</span>
          <span class="note-timestamp">${escapeHtml(timeStr)}</span>
        </div>
        <div class="note-text-box">
          ${escapeHtml(textContent)}
        </div>
      `;
      notesSidebarBody.appendChild(cardDiv);
    });

    // Rolar para a última nota (base da gaveta)
    notesSidebarBody.scrollTop = notesSidebarBody.scrollHeight;
  }

  // Adicionar Nova Nota Interna
  const sendNoteBtn = document.getElementById('sendNoteBtn');

  const handleAddNote = async () => {
    if (!newNoteInput) return;
    const text = newNoteInput.value.trim();
    if (!text || !currentActiveCard) return;

    let notes = currentActiveCard.notas_internas;
    if (typeof notes === 'string') {
      try { notes = JSON.parse(notes); } catch (e) { notes = []; }
    }
    if (!Array.isArray(notes)) notes = [];

    // Obter o nome do usuário logado (Perfil ou Metadata)
    let userName = 'Usuário';
    if (userDisplayName && userDisplayName.textContent && userDisplayName.textContent.trim() !== '' && userDisplayName.textContent.trim() !== 'Carregando...') {
      userName = userDisplayName.textContent.trim();
    } else if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário';
        }
      } catch (err) {
        console.warn('Erro ao obter sessão de usuário:', err);
      }
    }

    const newNote = {
      texto: text,
      usuario: userName,
      created_at: new Date().toISOString()
    };

    notes.push(newNote);
    newNoteInput.value = '';

    // Atualiza estado local e UI instantaneamente
    currentActiveCard.notas_internas = notes;
    renderInternalNotes(currentActiveCard);

    // Gravação no Supabase em segundo plano
    if (supabase) {
      const { error } = await supabase
        .from('oportunidades_crm')
        .update({ notas_internas: notes })
        .eq('id', currentActiveCard.id);

      if (error) {
        showToast('Erro ao salvar no banco: ' + error.message);
      }
    }
  };

  if (sendNoteBtn) {
    sendNoteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handleAddNote();
    });
  }

  if (newNoteInput) {
    newNoteInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        await handleAddNote();
      }
    });
  }

  // Toggle do Dropdown de Etiqueta (Status)
  if (sheetStatusDropdownBtn && statusDropdownMenu) {
    sheetStatusDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      statusDropdownMenu.classList.toggle('hidden');
    });
  }

  // Seleção de nova opção de Status (Movimentação de Coluna)
  document.querySelectorAll('.status-option').forEach(option => {
    option.addEventListener('click', async (e) => {
      e.stopPropagation();
      const newStatus = option.dataset.status;
      if (!newStatus || !currentActiveCard) return;

      if (statusDropdownMenu) statusDropdownMenu.classList.add('hidden');

      if (newStatus !== currentActiveCard.status) {
        currentActiveCard.status = newStatus;
        updateStatusTagUI(newStatus);

        if (supabase) {
          const { error } = await supabase
            .from('oportunidades_crm')
            .update({ status: newStatus })
            .eq('id', currentActiveCard.id);

          if (error) {
            showToast('Erro ao atualizar estágio: ' + error.message);
            return;
          }

          loadUserCards(); // Atualiza o Kanban movendo o card de coluna
          showToast(`Estágio alterado para "${stageLabels[newStatus]}"`);
        }
      }
    });
  });

  // Fechar dropdown de status ao clicar em qualquer outro lugar da tela
  window.addEventListener('click', (e) => {
    if (statusDropdownMenu && !e.target.closest('.status-dropdown-wrapper')) {
      statusDropdownMenu.classList.add('hidden');
    }
  });

  // Ação de Lixeira dentro da Ficha do Cliente
  if (sheetDeleteBtn) {
    sheetDeleteBtn.addEventListener('click', () => {
      if (currentActiveCard) {
        const cardToDel = currentActiveCard;
        const cardEl = document.querySelector(`.kanban-card[data-id="${cardToDel.id}"]`);
        closeClientSheet();
        openDeleteModal(cardToDel, cardEl);
      }
    });
  }

  // Ação de Atribuição a Outro Usuário (Dropdown estilo Print)
  const modalReassignUser = document.getElementById('modalReassignUser');
  const closeReassignModal = document.getElementById('closeReassignModal');
  const reassignSearchInput = document.getElementById('reassignSearchInput');
  const reassignUserList = document.getElementById('reassignUserList');
  let cachedProfiles = [];

  if (sheetReassignBtn) {
    sheetReassignBtn.addEventListener('click', () => {
      if (currentActiveCard) {
        openReassignModal();
      }
    });
  }

  if (reassignSearchInput) {
    reassignSearchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      renderReassignUserList(term);
    });
  }

  async function openReassignModal() {
    if (reassignSearchInput) reassignSearchInput.value = '';
    if (modalReassignUser) modalReassignUser.classList.remove('hidden');

    if (!supabase) return;
    reassignUserList.innerHTML = '<div class="loading-users-spinner" style="font-size:0.85rem; color:#64748B; text-align:center; padding:1rem;">Carregando usuários...</div>';

    // Buscar todos os usuários cadastrados na tabela 'profiles' do Supabase
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error || !profiles || profiles.length === 0) {
      reassignUserList.innerHTML = '<div style="font-size:0.85rem; color:#64748B; text-align:center; padding:1rem;">Nenhum usuário encontrado.</div>';
      return;
    }

    cachedProfiles = profiles;
    renderReassignUserList('');
  }

  function renderReassignUserList(searchTerm) {
    reassignUserList.innerHTML = '';

    const filtered = cachedProfiles.filter(p => {
      const name = (p.nome_completo || p.email || '').toLowerCase();
      return name.includes(searchTerm);
    });

    if (filtered.length === 0) {
      reassignUserList.innerHTML = '<div style="font-size:0.85rem; color:#64748B; text-align:center; padding:1rem;">Nenhuma pessoa encontrada.</div>';
      return;
    }

    // Separar Usuário Logado ('Eu') e Outros Usuários
    const currentUserProfile = filtered.find(p => p.id === currentUserId);
    const otherUsers = filtered.filter(p => p.id !== currentUserId);

    // Seção 'Eu'
    if (currentUserProfile) {
      const euHeader = document.createElement('div');
      euHeader.className = 'reassign-section-title';
      euHeader.textContent = 'Eu';
      reassignUserList.appendChild(euHeader);

      reassignUserList.appendChild(createUserItemElement(currentUserProfile));
    }

    // Seção 'Outras Pessoas' (Se houver)
    if (otherUsers.length > 0) {
      if (currentUserProfile) {
        const othersHeader = document.createElement('div');
        othersHeader.className = 'reassign-section-title';
        othersHeader.style.marginTop = '0.5rem';
        othersHeader.textContent = 'Outras Pessoas';
        reassignUserList.appendChild(othersHeader);
      }

      otherUsers.forEach(profile => {
        reassignUserList.appendChild(createUserItemElement(profile));
      });
    }
  }

  function createUserItemElement(profile) {
    const displayName = profile.nome_completo || profile.email || 'Usuário';
    const initial = displayName.charAt(0).toUpperCase();

    const itemDiv = document.createElement('div');
    itemDiv.className = 'reassign-user-item';
    itemDiv.innerHTML = `
      <div class="user-avatar-circle">${initial}</div>
      <div class="user-item-name">${escapeHtml(displayName)}</div>
    `;

    // Reatribuição Instantânea ao Clicar
    itemDiv.addEventListener('click', async () => {
      if (currentActiveCard && supabase) {
        const { error } = await supabase
          .from('oportunidades_crm')
          .update({ user_id: profile.id })
          .eq('id', currentActiveCard.id);

        if (error) {
          showToast('Erro ao atribuir: ' + error.message);
          return;
        }

        closeReassignUserModal();
        closeClientSheet();
        loadUserCards(); // Atualiza o funil
        showToast(`Oportunidade atribuída a ${displayName}!`);
      }
    });

    return itemDiv;
  }

  function closeReassignUserModal() {
    if (modalReassignUser) modalReassignUser.classList.add('hidden');
  }

  if (closeReassignModal) closeReassignModal.addEventListener('click', closeReassignUserModal);

  window.addEventListener('click', (e) => {
    if (e.target === modalReassignUser) closeReassignUserModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalReassignUser) closeReassignUserModal();
  });

  const tabContentRespostas = document.getElementById('tabContentRespostas');

  function switchTab(targetTab) {
    browserTabs.forEach(tab => {
      if (tab.dataset.tab === targetTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (targetTab === 'ficha') {
      if (tabContentFicha) tabContentFicha.classList.remove('hidden');
      if (tabContentRespostas) tabContentRespostas.classList.add('hidden');
      if (tabContentDocumentos) tabContentDocumentos.classList.add('hidden');
    } else if (targetTab === 'respostas') {
      if (tabContentRespostas) tabContentRespostas.classList.remove('hidden');
      if (tabContentFicha) tabContentFicha.classList.add('hidden');
      if (tabContentDocumentos) tabContentDocumentos.classList.add('hidden');
    } else if (targetTab === 'documentos') {
      if (tabContentDocumentos) tabContentDocumentos.classList.remove('hidden');
      if (tabContentFicha) tabContentFicha.classList.add('hidden');
      if (tabContentRespostas) tabContentRespostas.classList.add('hidden');
    }
  }

  // Alternância de Guias (Tabs)
  browserTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  if (closeClientSheetModal) closeClientSheetModal.addEventListener('click', closeClientSheet);

  window.addEventListener('click', (e) => {
    if (e.target === modalClientSheet) closeClientSheet();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalClientSheet) closeClientSheet();
  });

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

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
