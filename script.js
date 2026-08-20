document.addEventListener('DOMContentLoaded', async () => {
  // Inicialização do Supabase Client
  const SUPABASE_URL = 'https://jqyxtrzcwgropuqchwiz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeXh0cnpjd2dyb3B1cWNod2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjIzMDgsImV4cCI6MjEwMjAzODMwOH0.m9ZpiTanwhl5SzzAfJoTs1x9KekWuFqB0C3d__0mIbA';

  const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  // Estado da aba atual (Comercial vs Operação)
  window.currentTab = 'comercial';
  function getCurrentTable() {
    if (window.currentTab === 'comercial') return 'oportunidades_crm';
    if (window.currentTab === 'operacao') return 'operacao_crm';
    if (window.currentTab === 'judicial') return 'insucessos_crm';
    return 'oportunidades_crm';
  }

  function getUserDisplayName(profile) {
    if (!profile) return 'Usuário';
    if (typeof profile === 'string') {
      if (profile.includes('@')) {
        const handle = profile.split('@')[0];
        return handle
          .replace(/[._-]/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      return profile;
    }
    const name = profile.full_name || profile.nome_completo || profile.nome || profile.name ||
                 profile.user_metadata?.full_name || profile.user_metadata?.name ||
                 profile.raw_user_meta_data?.full_name || profile.raw_user_meta_data?.name;

    if (name && typeof name === 'string' && name.trim() !== '') {
      return name.trim();
    }

    if (profile.email && typeof profile.email === 'string') {
      const handle = profile.email.split('@')[0];
      if (handle) {
        return handle
          .replace(/[._-]/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    return 'Usuário';
  }
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

  // Alternância de Abas (Comercial / Operação)
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const crmTitle = document.querySelector('.crm-title');
  const crmSubtitle = document.querySelector('.crm-subtitle');
  
  navItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Atualiza aba ativa visualmente
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Atualiza o estado
      window.currentTab = item.dataset.tab;
      
      // Sempre que abrir uma aba do menu, restaura a visão para Kanban por padrão e limpa os filtros
      resetFilters();
      const vKanbanBtn = document.getElementById('viewKanbanBtn');
      const vListBtn = document.getElementById('viewListBtn');
      const vKanbanView = document.getElementById('crmKanbanView');
      const vListView = document.getElementById('crmListView');
      if (vKanbanBtn && vListBtn && vKanbanView && vListView) {
        vKanbanBtn.classList.add('active');
        vListBtn.classList.remove('active');
        vKanbanView.classList.remove('hidden');
        vListView.classList.add('hidden');
      }

      // Atualiza títulos
      if (window.currentTab === 'comercial') {
        crmTitle.textContent = 'Comercial';
        crmSubtitle.textContent = 'CRM / Funil de Vendas';
      } else if (window.currentTab === 'operacao') {
        crmTitle.textContent = 'Operação';
        crmSubtitle.textContent = 'Gestão de Requerimentos';
      } else if (window.currentTab === 'judicial') {
        crmTitle.textContent = 'Judicial';
        crmSubtitle.textContent = 'Processos de Requerimentos Negados';
      }
      
      // Exibe/Oculta colunas do Kanban com base na aba
      document.querySelectorAll('.kanban-column').forEach(col => {
        if (col.dataset.tab === window.currentTab) {
          col.classList.remove('hidden');
        } else {
          col.classList.add('hidden');
        }
      });

      // Exibe/Oculta opções no dropdown de status do card
      document.querySelectorAll('.status-option').forEach(opt => {
        if (opt.dataset.tab === window.currentTab) {
          opt.classList.remove('hidden');
        } else {
          opt.classList.add('hidden');
        }
      });
      
      // Recarrega os dados para a aba atual
      await loadUserCards();
    });
  });

  // ID do Usuário Administrador
  const ADMIN_USER_ID = '91a1904c-8f54-4943-bc8c-0b97cbcdcd26';

  // Verificar sessão ativa do Supabase em segundo plano (Sem bloquear ouvintes do DOM)
  async function checkActiveSession() {
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          await handleUserRedirect(session.user);
        }
      } catch (e) {
        console.warn('Erro ao verificar sessão inicial:', e);
      }
    }
  }

  async function handleUserRedirect(user) {
    if (!user) return;
    let isAdmin = false;
    let userProfile = null;

    const userId = typeof user === 'object' ? user.id : null;
    if (userId === ADMIN_USER_ID) {
      isAdmin = true;
    }

    if (userId && supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          userProfile = profile;
          if (profile.role === 'admin' || profile.is_admin === true || profile.id === ADMIN_USER_ID) {
            isAdmin = true;
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar profile:', err);
      }
    }

    if (isAdmin) {
      await showAdminPanel(user, userProfile);
    } else {
      await showDashboard(user);
    }
  }

  // Dicionários Globais de Estágios
  const stageLabels = {
    'novo': 'Novo',
    'qualificacao': 'Qualificação',
    'acompanhamento': 'Acompanhamento',
    'reuniao': 'Reunião',
    'proposta': 'Proposta',
    'planejamento': 'Planejamento',
    'documentacao': 'Documentação',
    'na_fila': 'Na Fila',
    'requerido': 'Requerido',
    'concedido': 'Concedido',
    'exigencia': 'Exigência',
    'negado': 'Negado'
  };

  const stageDotClasses = {
    'novo': 'dot-novo',
    'qualificacao': 'dot-qualificacao',
    'acompanhamento': 'dot-acompanhamento',
    'reuniao': 'dot-reuniao',
    'proposta': 'dot-proposta',
    'documentacao': 'dot-documentacao',
    'na_fila': 'dot-na_fila',
    'requerido': 'dot-requerido',
    'concedido': 'dot-concedido',
    'exigencia': 'dot-exigencia',
    'negado': 'dot-negado'
  };

  const backToAdminBtn = document.getElementById('backToAdminBtn');

  async function showDashboard(user) {
    let displayName = '';
    let userProfile = null;

    if (typeof user === 'object' && user !== null) {
      if (user.id && supabase) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            userProfile = profile;
            displayName = getUserDisplayName(profile);
          }
        } catch (e) { /* fallback abaixo */ }
      }

      if (!displayName) {
        displayName = getUserDisplayName(user);
      }
    } else if (typeof user === 'string') {
      displayName = getUserDisplayName(user);
    }

    if (!displayName) displayName = 'Usuário';

    const initialLetter = displayName.charAt(0).toUpperCase();

    if (userDisplayName) {
      userDisplayName.textContent = displayName;
    }
    if (userAvatar) {
      userAvatar.textContent = initialLetter;
    }

    // Checar se é admin para exibir o botão exclusivo de retorno ao Painel Gerencial
    const userId = typeof user === 'object' ? user.id : null;
    const isAdmin = userId === ADMIN_USER_ID || (userProfile && (userProfile.role === 'admin' || userProfile.is_admin === true));

    if (backToAdminBtn) {
      if (isAdmin) {
        backToAdminBtn.classList.remove('hidden');
      } else {
        backToAdminBtn.classList.add('hidden');
      }
    }

    loginScreen.classList.add('hidden');
    if (adminDashboardScreen) adminDashboardScreen.classList.add('hidden');
    blankDashboardScreen.classList.remove('hidden');

    // Carregar automaticamente os cards do CRM do usuário logado ao exibir o dashboard
    loadUserCards();
  }

  // Listener para retornar ao Painel Gerencial (Admin Apenas)
  if (backToAdminBtn) {
    backToAdminBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const user = session ? session.user : currentAdminUser;
      await showAdminPanel(user);
    });
  }

  /* ==========================================
     LÓGICA DO PAINEL DE ADMINISTRADOR
     ========================================== */
  const adminDashboardScreen = document.getElementById('adminDashboardScreen');
  const adminDisplayName = document.getElementById('adminDisplayName');
  const adminAvatar = document.getElementById('adminAvatar');
  const toggleAdminSidebarBtn = document.getElementById('toggleAdminSidebarBtn');
  const adminSidebar = document.getElementById('adminSidebar');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const switchToCrmBtn = document.getElementById('switchToCrmBtn');
  const refreshAdminDataBtn = document.getElementById('refreshAdminDataBtn');
  const adminUserSearchInput = document.getElementById('adminUserSearchInput');
  const btnOpenCreateUserModal = document.getElementById('btnOpenCreateUserModal');

  let currentAdminUser = null;
  let cachedUsersList = [];

  async function showAdminPanel(user, profile) {
    currentAdminUser = user;
    let displayName = getUserDisplayName(profile || user);
    if (!displayName || displayName === 'Usuário') displayName = 'Administrador';

    if (adminDisplayName) adminDisplayName.textContent = displayName;
    if (adminAvatar) adminAvatar.textContent = displayName.charAt(0).toUpperCase();

    loginScreen.classList.add('hidden');
    blankDashboardScreen.classList.add('hidden');
    if (adminDashboardScreen) adminDashboardScreen.classList.remove('hidden');

    await loadAdminDashboardData();
    await loadAdminUsersTable();
  }

  // Toggle da Sidebar Admin
  if (toggleAdminSidebarBtn && adminSidebar) {
    toggleAdminSidebarBtn.addEventListener('click', () => {
      adminSidebar.classList.toggle('collapsed');
    });
  }

  // Alternância de Abas Admin
  const adminNavItems = document.querySelectorAll('[data-admin-tab]');
  const adminHeaderTitle = document.getElementById('adminHeaderTitle');
  const adminHeaderSubtitle = document.getElementById('adminHeaderSubtitle');
  const adminTabDashboard = document.getElementById('adminTabDashboard');
  const adminTabUsers = document.getElementById('adminTabUsers');

  adminNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.dataset.adminTab;

      adminNavItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      if (targetTab === 'dashboard') {
        adminTabDashboard.classList.remove('hidden');
        adminTabUsers.classList.add('hidden');
        if (adminHeaderTitle) adminHeaderTitle.textContent = 'Dashboard de Administração';
        if (adminHeaderSubtitle) adminHeaderSubtitle.textContent = 'Visão geral do banco de dados e métricas do sistema';
      } else if (targetTab === 'users') {
        adminTabDashboard.classList.add('hidden');
        adminTabUsers.classList.remove('hidden');
        if (adminHeaderTitle) adminHeaderTitle.textContent = 'Gerenciamento de Usuários';
        if (adminHeaderSubtitle) adminHeaderSubtitle.textContent = 'Cadastre, edite e gerencie o acesso dos usuários';
      }
    });
  });

  // Alternar para visão regular do CRM
  if (switchToCrmBtn) {
    switchToCrmBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (currentAdminUser) {
        await showDashboard(currentAdminUser);
      }
    });
  }

  // Botão de Atualizar Métricas
  if (refreshAdminDataBtn) {
    refreshAdminDataBtn.addEventListener('click', async () => {
      refreshAdminDataBtn.style.opacity = '0.6';
      await loadAdminDashboardData();
      await loadAdminUsersTable(adminUserSearchInput ? adminUserSearchInput.value.trim() : '');
      refreshAdminDataBtn.style.opacity = '1';
      showToast('Dados atualizados com sucesso!');
    });
  }

  // Logout Admin
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      if (adminDashboardScreen) adminDashboardScreen.classList.add('hidden');
      blankDashboardScreen.classList.add('hidden');
      loginScreen.classList.remove('hidden');
      passwordInput.value = '';
      showToast('Sessão encerrada.');
    });
  }

  // 1. Aba Dashboard - Carregar Estatísticas do Banco de Dados
  async function loadAdminDashboardData() {
    if (!supabase) return;
    try {
      const { count: countProfiles } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: countComercial } = await supabase
        .from('oportunidades_crm')
        .select('*', { count: 'exact', head: true });

      const { count: countOperacao } = await supabase
        .from('operacao_crm')
        .select('*', { count: 'exact', head: true });

      const profilesTotal = countProfiles || 0;
      const comercialTotal = countComercial || 0;
      const operacaoTotal = countOperacao || 0;
      const grandTotal = profilesTotal + comercialTotal + operacaoTotal;

      const statTotalProfiles = document.getElementById('statTotalProfiles');
      const statTotalComercial = document.getElementById('statTotalComercial');
      const statTotalOperacao = document.getElementById('statTotalOperacao');
      const statTotalRecords = document.getElementById('statTotalRecords');

      if (statTotalProfiles) statTotalProfiles.textContent = profilesTotal.toLocaleString('pt-BR');
      if (statTotalComercial) statTotalComercial.textContent = comercialTotal.toLocaleString('pt-BR');
      if (statTotalOperacao) statTotalOperacao.textContent = operacaoTotal.toLocaleString('pt-BR');
      if (statTotalRecords) statTotalRecords.textContent = grandTotal.toLocaleString('pt-BR');

      const summaryBody = document.getElementById('dbTablesSummaryBody');
      if (summaryBody) {
        summaryBody.innerHTML = `
          <tr>
            <td><strong>profiles</strong></td>
            <td>Contas de Usuários, perfis e permissões do sistema</td>
            <td><strong>${profilesTotal.toLocaleString('pt-BR')}</strong></td>
            <td><span class="status-pill status-online">● Operacional</span></td>
            <td><button class="btn-secondary" onclick="window.switchAdminTab('users')">Gerenciar</button></td>
          </tr>
          <tr>
            <td><strong>oportunidades_crm</strong></td>
            <td>Funil de Vendas CRM - Oportunidades Comerciais</td>
            <td><strong>${comercialTotal.toLocaleString('pt-BR')}</strong></td>
            <td><span class="status-pill status-online">● Operacional</span></td>
            <td><button class="btn-secondary" onclick="window.switchAdminTab('crm')">Visualizar CRM</button></td>
          </tr>
          <tr>
            <td><strong>operacao_crm</strong></td>
            <td>Gestão e Acompanhamento de Casos Operacionais</td>
            <td><strong>${operacaoTotal.toLocaleString('pt-BR')}</strong></td>
            <td><span class="status-pill status-online">● Operacional</span></td>
            <td><button class="btn-secondary" onclick="window.switchAdminTab('crm')">Visualizar Operação</button></td>
          </tr>
        `;
      }
    } catch (e) {
      console.error('Erro ao carregar métricas admin:', e);
    }
  }

  // 2. Aba Usuários - Tabela de Usuários e Ações
  async function loadAdminUsersTable(query = '') {
    if (!supabase) return;
    const tableBody = document.getElementById('adminUsersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">Carregando usuários...</td></tr>`;

    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      cachedUsersList = users || [];

      renderUsersTable(cachedUsersList, query);
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--danger-color);">Erro ao carregar usuários da base.</td></tr>`;
    }
  }

  function renderUsersTable(users, query = '') {
    const tableBody = document.getElementById('adminUsersTableBody');
    if (!tableBody) return;

    const filtered = users.filter(u => {
      if (!query) return true;
      const q = query.toLowerCase();
      const name = getUserDisplayName(u).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      const id = (u.id || '').toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q) || id.includes(q);
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    // Ordenação alfabética pelo nome de exibição do usuário
    const sorted = [...filtered].sort((a, b) => {
      const nameA = getUserDisplayName(a);
      const nameB = getUserDisplayName(b);
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    });

    tableBody.innerHTML = sorted.map(u => {
      const name = getUserDisplayName(u);
      const email = u.email || 'Não informado';
      const role = u.role || (u.id === ADMIN_USER_ID ? 'admin' : 'usuario');
      const initial = name.charAt(0).toUpperCase();
      const shortId = u.id ? `${u.id.substring(0, 8)}...` : '--';

      const isCurrentAdmin = u.id === ADMIN_USER_ID;

      return `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-cell-avatar">${initial}</div>
              <div class="user-cell-info">
                <span class="user-cell-name">${escapeHtml(name)}</span>
              </div>
            </div>
          </td>
          <td>${escapeHtml(email)}</td>
          <td>
            <span class="status-pill ${role === 'admin' ? 'status-admin' : 'status-user'}">
              ${role === 'admin' ? '★ Administrador' : '● Usuário'}
            </span>
          </td>
          <td><span class="user-cell-id" title="${escapeHtml(u.id)}">${escapeHtml(shortId)}</span></td>
          <td>
            <div class="table-actions">
              <button class="btn-action-icon" onclick="window.openEditUserModal('${u.id}')" title="Editar Usuário">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              ${!isCurrentAdmin ? `
              <button class="btn-action-icon danger" onclick="window.openDeleteUserModal('${u.id}')" title="Excluir Usuário">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Busca em tempo real na tabela de usuários
  if (adminUserSearchInput) {
    adminUserSearchInput.addEventListener('input', (e) => {
      renderUsersTable(cachedUsersList, e.target.value.trim());
    });
  }

  // Globais para ações da tabela
  window.switchAdminTab = function(tabName) {
    if (tabName === 'users') {
      const usersNavBtn = document.querySelector('[data-admin-tab="users"]');
      if (usersNavBtn) usersNavBtn.click();
    } else if (tabName === 'crm') {
      if (switchToCrmBtn) switchToCrmBtn.click();
    }
  };

  window.openEditUserModal = function(userId) {
    const user = cachedUsersList.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('adminEditUserId').value = user.id;
    document.getElementById('adminEditName').value = user.full_name || user.nome || user.name || '';
    document.getElementById('adminEditEmail').value = user.email || '';
    document.getElementById('adminEditPassword').value = '';
    document.getElementById('adminEditRole').value = user.role || 'usuario';

    document.getElementById('modalAdminEditUser').classList.remove('hidden');
  };

  window.openDeleteUserModal = function(userId) {
    const user = cachedUsersList.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('adminDeleteUserId').value = user.id;
    document.getElementById('deleteUserName').textContent = user.full_name || user.nome || user.name || 'Usuário';
    document.getElementById('deleteUserEmail').textContent = user.email || 'Sem e-mail';

    document.getElementById('modalAdminDeleteUser').classList.remove('hidden');
  };

  // Abrir Modal de Criar Usuário
  if (btnOpenCreateUserModal) {
    btnOpenCreateUserModal.addEventListener('click', () => {
      const form = document.getElementById('adminCreateUserForm');
      if (form) form.reset();
      document.getElementById('modalAdminCreateUser').classList.remove('hidden');
    });
  }

  // Fechar Modais do Admin
  const closeAdminCreateUserModal = document.getElementById('closeAdminCreateUserModal');
  const closeAdminEditUserModal = document.getElementById('closeAdminEditUserModal');
  const closeAdminDeleteUserModal = document.getElementById('closeAdminDeleteUserModal');
  const cancelAdminDeleteUserBtn = document.getElementById('cancelAdminDeleteUserBtn');

  if (closeAdminCreateUserModal) {
    closeAdminCreateUserModal.addEventListener('click', () => {
      document.getElementById('modalAdminCreateUser').classList.add('hidden');
    });
  }
  if (closeAdminEditUserModal) {
    closeAdminEditUserModal.addEventListener('click', () => {
      document.getElementById('modalAdminEditUser').classList.add('hidden');
    });
  }
  if (closeAdminDeleteUserModal) {
    closeAdminDeleteUserModal.addEventListener('click', () => {
      document.getElementById('modalAdminDeleteUser').classList.add('hidden');
    });
  }
  if (cancelAdminDeleteUserBtn) {
    cancelAdminDeleteUserBtn.addEventListener('click', () => {
      document.getElementById('modalAdminDeleteUser').classList.add('hidden');
    });
  }

  // Função Auxiliar para invocar a Supabase Edge Function 'admin-manage-user'
  async function callAdminManageUserApi(action, payload) {
    if (!supabase || !supabase.functions) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session ? session.access_token : null;

      const invokeOptions = {
        body: { action, ...payload }
      };

      if (accessToken) {
        invokeOptions.headers = {
          Authorization: `Bearer ${accessToken}`
        };
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-user', invokeOptions);

      if (error) {
        console.warn('Edge Function admin-manage-user retornou erro:', error);
        return { success: false, error: error.message || 'Falha na comunicação com a Edge Function' };
      }

      if (data && data.error) {
        return { success: false, error: data.error };
      }

      return { success: true, data };
    } catch (e) {
      console.warn('Falha na chamada da Edge Function:', e);
      return { success: false, error: e.message };
    }
  }

  // Submit Criar Usuário
  const adminCreateUserForm = document.getElementById('adminCreateUserForm');
  if (adminCreateUserForm) {
    adminCreateUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('adminNewName') || document.getElementById('adminCreateName');
      const emailInput = document.getElementById('adminNewEmail') || document.getElementById('adminCreateEmail');
      const passwordInput = document.getElementById('adminNewPassword') || document.getElementById('adminCreatePassword');
      const roleInput = document.getElementById('adminNewRole') || document.getElementById('adminCreateRole');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';
      const role = roleInput ? roleInput.value : 'usuario';
      const submitBtn = document.getElementById('adminCreateUserSubmitBtn');
      const spinner = document.getElementById('adminCreateUserSpinner');
      const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;

      if (!name || !email || !password) return;

      btnText.textContent = 'Criando...';
      spinner.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        let newUserId = 'usr_' + Date.now();
        let apiHandled = false;

        // 1. Tentar criar via Edge Function (Auth + Profiles)
        const edgeRes = await callAdminManageUserApi('createUser', { name, email, password, role });
        if (edgeRes && edgeRes.success) {
          apiHandled = true;
          if (edgeRes.data && edgeRes.data.user && edgeRes.data.user.id) {
            newUserId = edgeRes.data.user.id;
          }
        } else if (edgeRes && edgeRes.error) {
          const isNetworkOrNotDeployed = 
            edgeRes.error.toLowerCase().includes('failed to send') ||
            edgeRes.error.toLowerCase().includes('functions_fetch_error') ||
            edgeRes.error.toLowerCase().includes('not found') ||
            edgeRes.error.toLowerCase().includes('indisponível');

          if (!isNetworkOrNotDeployed) {
            showToast(`Erro ao criar no Auth: ${edgeRes.error}`);
            return;
          }
        }

        // 2. Fallback local se a Edge Function não estiver ativa
        if (!apiHandled && supabase) {
          const createPayload = {
            id: newUserId,
            full_name: name,
            nome: name,
            email: email,
            role: role
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(createPayload, { onConflict: 'id' });

          if (profileError) {
            await supabase
              .from('profiles')
              .upsert({ id: newUserId, full_name: name, email: email, role: role }, { onConflict: 'id' });
          }
        }

        // Adicionar localmente para atualização imediata da UI
        cachedUsersList.unshift({
          id: newUserId,
          full_name: name,
          nome: name,
          email: email,
          role: role
        });

        if (apiHandled) {
          showToast('Usuário criado com sucesso no Auth e Profiles!');
        } else {
          showToast('Usuário registrado na tabela de perfis.');
        }

        document.getElementById('modalAdminCreateUser').classList.add('hidden');
        adminCreateUserForm.reset();
        await loadAdminUsersTable(adminUserSearchInput ? adminUserSearchInput.value.trim() : '');
        await loadAdminDashboardData();
      } catch (err) {
        console.error('Erro ao criar usuário:', err);
        showToast(`Erro ao criar usuário: ${err.message || 'Falha na requisição'}`);
      } finally {
        if (btnText) btnText.textContent = 'Criar Usuário';
        if (spinner) spinner.classList.add('hidden');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Submit Editar Usuário (com alteração de Senha no Auth)
  const adminEditUserForm = document.getElementById('adminEditUserForm');
  if (adminEditUserForm) {
    adminEditUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('adminEditUserId').value;
      const name = document.getElementById('adminEditName').value.trim();
      const email = document.getElementById('adminEditEmail').value.trim();
      const newPassword = document.getElementById('adminEditPassword').value.trim();
      const role = document.getElementById('adminEditRole').value;
      const submitBtn = document.getElementById('adminEditUserSubmitBtn');
      const spinner = document.getElementById('adminEditUserSpinner');
      const btnText = submitBtn.querySelector('.btn-text');

      if (!userId || !name || !email) return;

      btnText.textContent = 'Salvando...';
      spinner.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        let edgeHandled = false;

        // 1. Tentar atualizar via Edge Function (Auth + Profiles, incluindo troca de senha)
        const edgeRes = await callAdminManageUserApi('updateUser', {
          userId,
          name,
          email,
          password: newPassword,
          role
        });

        if (edgeRes && edgeRes.success) {
          edgeHandled = true;
        } else if (edgeRes && edgeRes.error) {
          const isNetworkOrNotDeployed = 
            edgeRes.error.toLowerCase().includes('failed to send') ||
            edgeRes.error.toLowerCase().includes('functions_fetch_error') ||
            edgeRes.error.toLowerCase().includes('not found') ||
            edgeRes.error.toLowerCase().includes('indisponível');

          if (!isNetworkOrNotDeployed) {
            showToast(`Erro Supabase Auth: ${edgeRes.error}`);
            return;
          }
        }

        // 2. Fallback caso a Edge Function não esteja ativa
        if (!edgeHandled && supabase) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          const updatePayload = { id: userId };

          if (existingProfile) {
            if ('full_name' in existingProfile) updatePayload.full_name = name;
            if ('nome' in existingProfile) updatePayload.nome = name;
            if ('name' in existingProfile) updatePayload.name = name;
            if ('email' in existingProfile) updatePayload.email = email;
            if ('role' in existingProfile) updatePayload.role = role;
            if ('updated_at' in existingProfile) updatePayload.updated_at = new Date().toISOString();
          } else {
            updatePayload.full_name = name;
            updatePayload.nome = name;
            updatePayload.email = email;
            updatePayload.role = role;
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .upsert(updatePayload, { onConflict: 'id' });

          if (updateError) {
            await supabase
              .from('profiles')
              .update({ full_name: name, email: email, role: role })
              .eq('id', userId);
          }

          // Se for a própria sessão do admin logado, atualizar via SDK cliente
          if (newPassword) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user && session.user.id === userId) {
              await supabase.auth.updateUser({ password: newPassword });
            }
          }
        }

        // Atualizar lista em memória e re-renderizar para resposta imediata na UI
        const cachedUser = cachedUsersList.find(u => u.id === userId);
        if (cachedUser) {
          cachedUser.full_name = name;
          cachedUser.nome = name;
          cachedUser.email = email;
          cachedUser.role = role;
        }

        if (edgeHandled) {
          showToast(newPassword ? 'Perfil e nova senha salvos com sucesso no Supabase Auth!' : 'Perfil do usuário atualizado com sucesso!');
        } else {
          showToast(newPassword ? 'Perfil salvo no banco. Publicar Edge Function para sincronizar a nova senha de outros usuários no Auth.' : 'Perfil do usuário atualizado com sucesso!');
        }

        document.getElementById('modalAdminEditUser').classList.add('hidden');
        adminEditUserForm.reset();
        await loadAdminUsersTable(adminUserSearchInput ? adminUserSearchInput.value.trim() : '');
      } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        showToast(`Erro ao atualizar usuário: ${err.message || 'Falha na requisição'}`);
      } finally {
        btnText.textContent = 'Salvar Alterações';
        spinner.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  }

  // Submit Excluir Usuário
  const confirmAdminDeleteUserBtn = document.getElementById('confirmAdminDeleteUserBtn');
  if (confirmAdminDeleteUserBtn) {
    confirmAdminDeleteUserBtn.addEventListener('click', async () => {
      const userId = document.getElementById('adminDeleteUserId').value;
      const spinner = document.getElementById('adminDeleteUserSpinner');
      const btnText = confirmAdminDeleteUserBtn.querySelector('.btn-text');

      if (!userId) return;

      btnText.textContent = 'Excluindo...';
      spinner.classList.remove('hidden');
      confirmAdminDeleteUserBtn.disabled = true;

      try {
        let edgeHandled = false;

        // 1. Tentar excluir via Edge Function (Auth + Profiles)
        const edgeRes = await callAdminManageUserApi('deleteUser', { userId });
        if (edgeRes && edgeRes.success) {
          edgeHandled = true;
        }

        // 2. Fallback para exclusão na tabela profiles
        if (!edgeHandled && supabase) {
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

          if (error) throw error;
        }

        cachedUsersList = cachedUsersList.filter(u => u.id !== userId);

        showToast('Usuário excluído com sucesso.');
        document.getElementById('modalAdminDeleteUser').classList.add('hidden');
        await loadAdminUsersTable(adminUserSearchInput ? adminUserSearchInput.value.trim() : '');
        await loadAdminDashboardData();
      } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        showToast(`Erro ao excluir usuário: ${err.message || 'Falha na operação'}`);
      } finally {
        btnText.textContent = 'Confirmar';
        spinner.classList.add('hidden');
        confirmAdminDeleteUserBtn.disabled = false;
      }
    });
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

      await handleUserRedirect(data.user);
      showToast('Autenticação realizada com sucesso! Bem-vindo.');
    } else {
      // Fallback de demonstração caso o SDK não carregue
      setTimeout(async () => {
        setLoadingState(false);
        await handleUserRedirect({ id: emailValue === 'admin@resolveprev.com' ? ADMIN_USER_ID : 'user_demo', email: emailValue });
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
  async function performLogout() {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) { console.warn('Erro ao deslogar do Supabase:', e); }
    }

    blankDashboardScreen.classList.add('hidden');
    if (adminDashboardScreen) adminDashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');

    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.setAttribute('type', 'password');
    }
    if (eyeIcon) eyeIcon.classList.remove('hidden');
    if (eyeOffIcon) eyeOffIcon.classList.add('hidden');

    setLoadingState(false);
    showToast('Sessão encerrada.');
  }

  if (logoutBtn) logoutBtn.addEventListener('click', performLogout);
  if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', performLogout);

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

  // DOM Elements - User Profile Edit Modal
  const modalUserProfile = document.getElementById('modalUserProfile');
  const closeUserProfileModal = document.getElementById('closeUserProfileModal');
  const userProfileForm = document.getElementById('userProfileForm');
  const userProfileBadge = document.getElementById('userProfileBadge');
  const adminProfileBadge = document.getElementById('adminProfileBadge');

  async function openUserProfileModal() {
    if (!supabase) {
      showToast('Sistema de autenticação indisponível.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        showToast('Sessão expirada. Faça login novamente.');
        return;
      }
      const user = session.user;
      let currentName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      let currentEmail = user.email || '';

      // Tentar pegar do profile no Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        currentName = profile.full_name || profile.nome || profile.name || currentName;
        currentEmail = profile.email || currentEmail;
      }

      if (!currentName) {
        currentName = getUserDisplayName(user);
      }

      document.getElementById('upName').value = currentName;
      document.getElementById('upEmail').value = currentEmail;
      document.getElementById('upPassword').value = '';

      modalUserProfile.classList.remove('hidden');
    } catch (err) {
      console.error('Erro ao carregar dados do perfil:', err);
      showToast('Erro ao carregar seus dados.');
    }
  }

  if (userProfileBadge) {
    userProfileBadge.addEventListener('click', openUserProfileModal);
  }
  if (adminProfileBadge) {
    adminProfileBadge.addEventListener('click', openUserProfileModal);
  }
  if (closeUserProfileModal) {
    closeUserProfileModal.addEventListener('click', () => {
      modalUserProfile.classList.add('hidden');
    });
  }

  if (userProfileForm) {
    userProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!supabase) return;

      const newName = document.getElementById('upName').value.trim();
      const newEmail = document.getElementById('upEmail').value.trim();
      const newPassword = document.getElementById('upPassword').value.trim();
      const submitBtn = document.getElementById('userProfileSubmitBtn');
      const btnText = submitBtn.querySelector('.btn-text');
      const spinner = document.getElementById('userProfileSpinner');

      if (!newName || !newEmail) {
        showToast('Por favor, preencha o Nome e o E-mail.');
        return;
      }

      if (newPassword && newPassword.length < 6) {
        showToast('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }

      btnText.textContent = 'Salva...';
      spinner.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          throw new Error('Sessão inválida.');
        }

        const userId = session.user.id;
        const updateAttrs = {
          email: newEmail,
          data: { full_name: newName, name: newName }
        };
        if (newPassword) {
          updateAttrs.password = newPassword;
        }

        // 1. Atualizar no Auth via Supabase SDK
        const { error: authError } = await supabase.auth.updateUser(updateAttrs);
        if (authError) {
          console.warn('Aviso auth.updateUser:', authError);
        }

        // 2. Atualizar na tabela profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        let profilePayload = {
          id: userId,
          email: newEmail,
          updated_at: new Date().toISOString()
        };

        if (existingProfile) {
          profilePayload = { ...existingProfile, ...profilePayload };
          if ('full_name' in existingProfile) profilePayload.full_name = newName;
          if ('nome' in existingProfile) profilePayload.nome = newName;
          if ('name' in existingProfile) profilePayload.name = newName;
        } else {
          profilePayload.full_name = newName;
          profilePayload.nome = newName;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });

        if (profileError) {
          console.warn('Erro upsert profile:', profileError);
          await supabase
            .from('profiles')
            .update({ full_name: newName, email: newEmail })
            .eq('id', userId);
        }

        // Atualizar visualmente o nome e inicial na interface
        const initialLetter = newName.charAt(0).toUpperCase();
        if (userDisplayName) userDisplayName.textContent = newName;
        if (userAvatar) userAvatar.textContent = initialLetter;
        const adminDisplayName = document.getElementById('adminDisplayName');
        const adminAvatar = document.getElementById('adminAvatar');
        if (adminDisplayName) adminDisplayName.textContent = newName;
        if (adminAvatar) adminAvatar.textContent = initialLetter;

        showToast('Dados cadastrais atualizados com sucesso!');
        modalUserProfile.classList.add('hidden');
      } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        showToast(`Erro ao atualizar dados: ${err.message || 'Falha na operação'}`);
      } finally {
        btnText.textContent = 'Salvar Alterações';
        spinner.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  }

  // Fechar ao clicar fora do card ou pressionar ESC
  window.addEventListener('click', (e) => {
    if (e.target === modalRecovery) modalRecovery.classList.add('hidden');
    if (e.target === modalFirstAccess) modalFirstAccess.classList.add('hidden');
    if (e.target === modalUserProfile) modalUserProfile.classList.add('hidden');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalRecovery.classList.add('hidden');
      modalFirstAccess.classList.add('hidden');
      if (modalUserProfile) modalUserProfile.classList.add('hidden');
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

  // Função auxiliar para resetar todos os filtros ativos (status, datas e pesquisa)
  function resetFilters() {
    document.querySelectorAll('.filter-status-cb').forEach(cb => cb.checked = false);
    const anyDateRadio = document.querySelector('.filter-date-radio[value=""]');
    if (anyDateRadio) anyDateRadio.checked = true;
    if (crmSearchInput) crmSearchInput.value = '';
    activeStatusFilters = [];
    activeDateFilter = '';
    updateFilterBadge();
  }

  /* ==========================================
     5. ALTERNÂNCIA DE VISUALIZAÇÃO CRM (KANBAN x LISTA)
     ========================================== */
  const viewKanbanBtn = document.getElementById('viewKanbanBtn');
  const viewListBtn = document.getElementById('viewListBtn');
  const crmKanbanView = document.getElementById('crmKanbanView');
  const crmListView = document.getElementById('crmListView');

  if (viewKanbanBtn && viewListBtn && crmKanbanView && crmListView) {
    viewKanbanBtn.addEventListener('click', () => {
      resetFilters();
      viewKanbanBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      crmKanbanView.classList.remove('hidden');
      crmListView.classList.add('hidden');
      filterAndRenderCards('');
    });

    viewListBtn.addEventListener('click', () => {
      resetFilters();
      viewListBtn.classList.add('active');
      viewKanbanBtn.classList.remove('active');
      crmListView.classList.remove('hidden');
      crmKanbanView.classList.add('hidden');
      // Renderiza a visualização em lista com os dados sem filtros
      filterAndRenderCards('');
    });
  }


  /* ==========================================
     BULK ACTION BAR — SELEÇÃO EM MASSA
     ========================================== */
  const listBulkBar       = document.getElementById('listBulkBar');
  const bulkBarCount      = document.getElementById('bulkBarCount');
  const btnBulkAssign     = document.getElementById('btnBulkAssign');
  const btnBulkDeselect   = document.getElementById('btnBulkDeselect');
  const modalBulkAssign   = document.getElementById('modalBulkAssign');
  const closeBulkAssignModal  = document.getElementById('closeBulkAssignModal');
  const cancelBulkAssignBtn   = document.getElementById('cancelBulkAssignBtn');
  const confirmBulkAssignBtn  = document.getElementById('confirmBulkAssignBtn');
  const bulkAssignUserList    = document.getElementById('bulkAssignUserList');
  const bulkAssignDesc        = document.getElementById('bulkAssignDesc');
  const bulkAssignBtnText     = document.getElementById('bulkAssignBtnText');
  let selectedBulkUserId = null;

  // Atualiza visibilidade da barra de ações em massa
  function updateBulkBar() {
    const checkboxes = document.querySelectorAll('.list-row-checkbox');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    if (listBulkBar) {
      if (checkedCount > 0) {
        listBulkBar.classList.remove('hidden');
        if (bulkBarCount) bulkBarCount.textContent = checkedCount;
      } else {
        listBulkBar.classList.add('hidden');
      }
    }
  }

  // Select All checkbox handler (delegado)
  document.addEventListener('change', (e) => {
    if (e.target.id === 'listSelectAll') {
      const checked = e.target.checked;
      document.querySelectorAll('.list-row-checkbox').forEach(cb => {
        cb.checked = checked;
        cb.closest('tr').classList.toggle('selected-row', checked);
      });
      updateBulkBar();
    } else if (e.target.classList.contains('list-row-checkbox')) {
      // Atualiza estado do "select all" conforme checkboxes individuais
      const all = document.querySelectorAll('.list-row-checkbox');
      const allChecked = Array.from(all).every(cb => cb.checked);
      const selectAll = document.getElementById('listSelectAll');
      if (selectAll) selectAll.checked = allChecked;
      updateBulkBar();
    }
  });

  // Botão "Limpar Seleção"
  if (btnBulkDeselect) {
    btnBulkDeselect.addEventListener('click', () => {
      document.querySelectorAll('.list-row-checkbox').forEach(cb => {
        cb.checked = false;
        cb.closest('tr').classList.remove('selected-row');
      });
      const selectAll = document.getElementById('listSelectAll');
      if (selectAll) selectAll.checked = false;
      if (listBulkBar) listBulkBar.classList.add('hidden');
    });
  }

  // Abre modal de atribuição em massa
  async function openBulkAssignModal() {
    if (!modalBulkAssign) return;
    const count = Array.from(document.querySelectorAll('.list-row-checkbox')).filter(cb => cb.checked).length;
    if (bulkAssignDesc) bulkAssignDesc.textContent = `Selecione o usuário para receber ${count} oportunidade(s) selecionada(s):`;
    selectedBulkUserId = null;
    if (confirmBulkAssignBtn) confirmBulkAssignBtn.disabled = true;
    if (bulkAssignBtnText) bulkAssignBtnText.textContent = 'Confirmar Atribuição';

    // Carrega usuários do Supabase (tabela auth.users via admin, ou profiles)
    if (bulkAssignUserList) {
      bulkAssignUserList.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#94A3B8;font-size:0.85rem;">Carregando usuários...</div>';
      let users = [];
      if (supabase) {
        try {
          // Tenta buscar da tabela profiles (caso exista) ou auth.users
          const { data, error } = await supabase.from('profiles').select('id, full_name, email');
          if (!error && data && data.length > 0) {
            users = data;
          }
        } catch (e) { /* fallback abaixo */ }

        // Fallback: busca via RPC se disponível, ou exibe mensagem
        if (users.length === 0) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            users = [{ id: session.user.id, full_name: userDisplayName ? userDisplayName.textContent : 'Você', email: session.user.email }];
          }
        }
      }

      if (users.length === 0) {
        bulkAssignUserList.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#94A3B8;font-size:0.85rem;">Nenhum usuário encontrado.</div>';
      } else {
        bulkAssignUserList.innerHTML = '';
        users.forEach(u => {
          const name = getUserDisplayName(u);
          const initial = name.charAt(0).toUpperCase();
          const opt = document.createElement('div');
          opt.className = 'bulk-assign-user-option';
          opt.dataset.userId = u.id;
          opt.innerHTML = `
            <div class="bulk-assign-avatar">${escapeHtml(initial)}</div>
            <div>
              <div class="bulk-assign-user-name">${escapeHtml(name)}</div>
              <div class="bulk-assign-user-email">${escapeHtml(u.email || '')}</div>
            </div>
          `;
          opt.addEventListener('click', () => {
            bulkAssignUserList.querySelectorAll('.bulk-assign-user-option').forEach(el => el.classList.remove('selected'));
            opt.classList.add('selected');
            selectedBulkUserId = u.id;
            if (confirmBulkAssignBtn) confirmBulkAssignBtn.disabled = false;
          });
          bulkAssignUserList.appendChild(opt);
        });
      }
    }

    modalBulkAssign.classList.remove('hidden');
  }

  function closeBulkAssignModalFn() {
    if (modalBulkAssign) modalBulkAssign.classList.add('hidden');
    selectedBulkUserId = null;
  }

  if (btnBulkAssign)       btnBulkAssign.addEventListener('click', openBulkAssignModal);
  if (closeBulkAssignModal) closeBulkAssignModal.addEventListener('click', closeBulkAssignModalFn);
  if (cancelBulkAssignBtn)  cancelBulkAssignBtn.addEventListener('click', closeBulkAssignModalFn);

  window.addEventListener('click', (e) => {
    if (e.target === modalBulkAssign) closeBulkAssignModalFn();
  });

  // Confirmar atribuição em massa
  if (confirmBulkAssignBtn) {
    confirmBulkAssignBtn.addEventListener('click', async () => {
      if (!selectedBulkUserId) return;

      // Coletar IDs das linhas selecionadas
      const selectedIds = Array.from(document.querySelectorAll('.list-row-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.closest('tr')?.dataset.id)
        .filter(Boolean);

      if (selectedIds.length === 0) {
        closeBulkAssignModalFn();
        return;
      }

      if (bulkAssignBtnText) bulkAssignBtnText.textContent = 'Atribuindo...';
      confirmBulkAssignBtn.disabled = true;

      if (supabase) {
        const { error } = await supabase
          .from(getCurrentTable())
          .update({ user_id: selectedBulkUserId, atualizado_em: new Date().toISOString() })
          .in('id', selectedIds);

        if (error) {
          showToast('Erro ao atribuir: ' + error.message);
        } else {
          showToast(`${selectedIds.length} oportunidade(s) atribuída(s) com sucesso!`);
          // Atualiza dados locais e re-renderiza
          await loadUserCards();
          // Limpa seleção
          if (btnBulkDeselect) btnBulkDeselect.click();
        }
      }

      closeBulkAssignModalFn();
      confirmBulkAssignBtn.disabled = false;
      if (bulkAssignBtnText) bulkAssignBtnText.textContent = 'Confirmar Atribuição';
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
        const defaultStage = window.currentTab === 'comercial' ? 'novo' : 'documentacao';
        const stage = column ? column.dataset.stage : defaultStage;
        
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

          const { error } = await supabase.from(getCurrentTable()).insert([{
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

  // Inicializa os ouvintes de Drag & Drop para as colunas do Kanban
  setupKanbanDragAndDrop();

  // Realtime Subscriptions (Sincronização em Tempo Real com o Supabase)
  let realtimeChannel = null;

  function subscribeRealtimeUpdates() {
    if (!supabase || realtimeChannel) return;

    realtimeChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oportunidades_crm'
        },
        () => {
          if (window.currentTab === 'comercial') {
            loadUserCards();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'operacao_crm'
        },
        () => {
          if (window.currentTab === 'operacao') {
            loadUserCards();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insucessos_crm'
        },
        () => {
          if (window.currentTab === 'judicial') {
            loadUserCards();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Sincronização em tempo real ativa no Supabase.');
        }
      });
  }

  // Atualizar a renderização do CRM (Visão Total para Administradores)
  async function loadUserCards() {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;
    currentUserId = session.user.id;

    subscribeRealtimeUpdates();

    // Checar se o usuário atual é Administrador (ID específico ou role 'admin')
    let isAdmin = currentUserId === ADMIN_USER_ID;
    if (!isAdmin) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', currentUserId)
          .maybeSingle();

        if (profile && (profile.role === 'admin' || profile.is_admin === true)) {
          isAdmin = true;
        }
      } catch (e) { /* fallback */ }
    }

    let query = supabase.from(getCurrentTable()).select('*');

    // Se for usuário comum, filtrar apenas os cards atrelados a ele
    if (!isAdmin) {
      query = query.eq('user_id', currentUserId);
    }

    const { data: cards, error } = await query.order('criado_em', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar oportunidades:', error.message);
      return;
    }

    allUserCards = cards || [];
    const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
    filterAndRenderCards(searchTerm);
  }

  /* ==========================================
     PAINEL DE FILTROS
     ========================================== */
  const filterPanel       = document.getElementById('filterPanel');
  const filterDropWrapper = document.getElementById('filterDropdownWrapper');
  const filterApplyBtn    = document.getElementById('filterApplyBtn');
  const filterClearBtn    = document.getElementById('filterClearBtn');
  const filterActiveBadge = document.getElementById('filterActiveBadge');

  // Estado ativo dos filtros (aplicados ao clicar em "Aplicar")
  let activeStatusFilters = []; // array de strings e.g. ['novo','proposta']
  let activeDateFilter    = ''; // string e.g. 'menos7'

  // Toggle do painel
  const crmFilterBtnEl = document.getElementById('crmFilterBtn');
  if (crmFilterBtnEl && filterPanel) {
    crmFilterBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPanel.classList.toggle('hidden');
    });
  }

  // Fechar painel ao clicar fora
  document.addEventListener('click', (e) => {
    if (filterPanel && !filterPanel.classList.contains('hidden')) {
      if (!filterDropWrapper?.contains(e.target)) {
        filterPanel.classList.add('hidden');
      }
    }
  });

  // Função auxiliar: calcula diferença em dias entre hoje e a data do card
  function daysDiff(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(year, month - 1, day); target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / 86400000); // positivo = futuro, negativo = passado
  }

  // Atualiza badge de filtros ativos no botão
  function updateFilterBadge() {
    const count = activeStatusFilters.length + (activeDateFilter ? 1 : 0);
    if (filterActiveBadge) {
      if (count > 0) {
        filterActiveBadge.textContent = count;
        filterActiveBadge.classList.remove('hidden');
        if (crmFilterBtnEl) crmFilterBtnEl.style.borderColor = 'var(--color-primary)';
        if (crmFilterBtnEl) crmFilterBtnEl.style.color = 'var(--color-primary)';
      } else {
        filterActiveBadge.classList.add('hidden');
        if (crmFilterBtnEl) crmFilterBtnEl.style.borderColor = '';
        if (crmFilterBtnEl) crmFilterBtnEl.style.color = '';
      }
    }
  }

  // Botão "Aplicar Filtros"
  if (filterApplyBtn) {
    filterApplyBtn.addEventListener('click', () => {
      // Lê checkboxes de status
      activeStatusFilters = Array.from(document.querySelectorAll('.filter-status-cb'))
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      // Lê radio de data
      const checkedRadio = document.querySelector('.filter-date-radio:checked');
      activeDateFilter = checkedRadio ? checkedRadio.value : '';

      updateFilterBadge();
      filterPanel.classList.add('hidden');

      // Re-renderiza com os filtros aplicados
      const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
      filterAndRenderCards(searchTerm);
    });
  }

  // Botão "Limpar tudo"
  if (filterClearBtn) {
    filterClearBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-status-cb').forEach(cb => cb.checked = false);
      const anyDateRadio = document.querySelector('.filter-date-radio[value=""]');
      if (anyDateRadio) anyDateRadio.checked = true;
      activeStatusFilters = [];
      activeDateFilter = '';
      updateFilterBadge();
      const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
      filterAndRenderCards(searchTerm);
    });
  }

  /* ==========================================
     FILTRO PRINCIPAL — busca + status + data
     ========================================== */
  function filterAndRenderCards(searchTerm) {
    const isPlanejamentoSelected = activeStatusFilters.includes('planejamento');

    let filtered = allUserCards.filter(card => {
      const cardStatus = card.status || (window.currentTab === 'comercial' ? 'novo' : 'documentacao');

      if (window.currentTab === 'comercial') {
        // Se o filtro 'planejamento' estiver ativado, a lista DEVE conter apenas cartões com status 'planejamento'
        if (isPlanejamentoSelected) {
          return cardStatus === 'planejamento';
        }
        // Se NÃO estiver com o filtro 'planejamento' ativado, oculta completamente as linhas de 'planejamento'
        const normalStages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
        return normalStages.includes(cardStatus);
      } else if (window.currentTab === 'operacao') {
        const operacaoStages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
        return operacaoStages.includes(cardStatus);
      } else if (window.currentTab === 'judicial') {
        return cardStatus === 'negado';
      }
    });

    // 1. Filtro de texto (nome / telefone)
    if (searchTerm) {
      const cleanSearchTerm = searchTerm.replace(/\D/g, '');
      filtered = filtered.filter(card => {
        const nameMatch = card.nome && card.nome.toLowerCase().includes(searchTerm);
        const rawPhone  = card.telefone ? card.telefone.replace(/\D/g, '') : '';
        const phoneFormattedMatch = card.telefone && card.telefone.toLowerCase().includes(searchTerm);
        const phoneDigitsMatch    = cleanSearchTerm && rawPhone.includes(cleanSearchTerm);
        return nameMatch || phoneFormattedMatch || phoneDigitsMatch;
      });
    }

    // 2. Filtro de outros status (se houver seleções adicionais e não for apenas planejamento)
    if (activeStatusFilters.length > 0 && !isPlanejamentoSelected) {
      filtered = filtered.filter(card => activeStatusFilters.includes(card.status || 'novo'));
    }

    // 3. Filtro de data de requerimento
    if (activeDateFilter) {
      filtered = filtered.filter(card => {
        const diff = daysDiff(card.data_requerimento);
        if (diff === null) return false;
        switch (activeDateFilter) {
          case 'mais30':  return diff > 30;           // mais de 30 dias no futuro
          case 'menos30': return diff >= 0 && diff <= 30; // até 30 dias no futuro
          case 'menos7':  return diff >= 0 && diff <= 7;  // até 7 dias no futuro
          case 'vencidos': return diff < 0;            // data já passou
          default: return true;
        }
      });
    }

    renderKanbanCards(filtered);

    // Também atualiza a lista se a visualização em lista estiver visível
    if (crmListView && !crmListView.classList.contains('hidden')) {
      renderListView(filtered);
    }
  }


  /* ==========================================
     VISUALIZAÇÃO EM LISTA — RENDER
     ========================================== */
  function renderListView(cards) {
    const tbody = document.getElementById('crmListTbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Ordenação
    const sorted = [...cards].sort((a, b) => {
      if (window.currentTab === 'operacao') {
        const da = a.data_requerimento ? new Date(a.data_requerimento).getTime() : Infinity;
        const db = b.data_requerimento ? new Date(b.data_requerimento).getTime() : Infinity;
        return da - db;
      } else {
        // Comercial: ordenação invertida por status na lista (proposta -> novo)
        const order = { proposta: 1, reuniao: 2, acompanhamento: 3, qualificacao: 4, novo: 5 };
        const oA = order[a.status] || 99;
        const oB = order[b.status] || 99;
        if (oA !== oB) return oA - oB;
        // fallback para data
        const da = new Date(a.atualizado_em || a.criado_em || 0).getTime();
        const db = new Date(b.atualizado_em || b.criado_em || 0).getTime();
        return db - da;
      }
    });

    if (sorted.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Nenhuma oportunidade encontrada.</td></tr>`;
      return;
    }

    sorted.forEach(card => {
      // ---- Inicial do avatar ----
      const initial = (card.nome || 'C').charAt(0).toUpperCase();

      // ---- Formatação de Data ----
      let formattedDate = '—';
      let dateClass = 'date-gray';
      if (card.data_requerimento) {
        const [year, month, day] = card.data_requerimento.split('-').map(Number);
        formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const target = new Date(year, month - 1, day); target.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target - today) / 86400000);
        if (diff < 0)      dateClass = 'date-purple';
        else if (diff <= 7)  dateClass = 'date-red';
        else if (diff <= 30) dateClass = 'date-yellow';
        else                 dateClass = 'date-gray';
      }

      // ---- WhatsApp link ----
      const rawPhone = card.telefone ? card.telefone.replace(/\D/g, '') : '';
      const waUrl = rawPhone ? `https://wa.me/55${rawPhone}` : '#';

      // ---- Status badge ----
      const statusLabels = { 
        novo: 'Novo', qualificacao: 'Qualificação', acompanhamento: 'Acompanhamento', reuniao: 'Reunião', proposta: 'Proposta', planejamento: 'Planejamento',
        documentacao: 'Documentação', na_fila: 'Na Fila', requerido: 'Requerido', exigencia: 'Exigência', concedido: 'Concedido'
      };
      const statusLabel = statusLabels[card.status] || card.status || 'Novo';
      const statusClass = `list-status-${card.status || 'novo'}`;

      // ---- Contagem de notas ----
      let notasCount = 0;
      if (card.notas_internas) {
        try {
          const notas = typeof card.notas_internas === 'string' ? JSON.parse(card.notas_internas) : card.notas_internas;
          notasCount = Array.isArray(notas) ? notas.length : 0;
        } catch (e) { notasCount = 0; }
      }
      const badgeHidden = notasCount === 0 ? 'hidden' : '';

      const tr = document.createElement('tr');
      tr.className = 'list-row';
      tr.dataset.id = card.id;

      tr.innerHTML = `
        <td class="td-check">
          <label class="list-checkbox-label" onclick="event.stopPropagation()">
            <input type="checkbox" class="list-checkbox list-row-checkbox">
            <span class="list-checkbox-custom"></span>
          </label>
        </td>
        <td>
          <div class="td-name">
            <div class="list-avatar">${escapeHtml(initial)}</div>
            <span class="list-client-name">${escapeHtml(card.nome || 'Sem nome')}</span>
          </div>
        </td>
        <td>
          <a href="${waUrl}" target="_blank" class="list-phone-link" onclick="event.stopPropagation()" title="Abrir no WhatsApp">
            ${escapeHtml(card.telefone || '—')}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </a>
        </td>
        <td class="list-profession">${escapeHtml(card.profissao || '—')}</td>
        <td>
          <span class="list-date-badge ${dateClass}">
            <span class="list-date-dot"></span>
            ${escapeHtml(formattedDate)}
          </span>
        </td>
        <td>
          <span class="list-status-badge ${statusClass}">
            <span class="status-dot"></span>
            ${escapeHtml(statusLabel)}
          </span>
        </td>
        <td class="td-notes">
          <button class="list-notes-btn" title="Observações internas" data-id="${card.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="list-notes-badge ${badgeHidden}">${notasCount}</span>
          </button>
        </td>
      `;

      // Clique na linha → abre ficha do cliente (ignora checkbox e botão de notas)
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.list-notes-btn') || e.target.closest('.list-checkbox-label') || e.target.closest('.list-phone-link')) return;
        openClientSheetModal(card);
      });

      // Checkbox individual → toggle classe selected-row
      const rowCheckbox = tr.querySelector('.list-row-checkbox');
      if (rowCheckbox) {
        rowCheckbox.addEventListener('change', () => {
          tr.classList.toggle('selected-row', rowCheckbox.checked);
        });
      }

      // Botão de notas → abre diretamente a sidebar de notas internas
      const notesBtn = tr.querySelector('.list-notes-btn');
      if (notesBtn) {
        notesBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openClientSheetModal(card);
          // Pequeno delay para o modal abrir antes de acionar o drawer de notas
          setTimeout(() => {
            const sheetNotesBtn = document.getElementById('sheetNotesBtn');
            if (sheetNotesBtn) sheetNotesBtn.click();
          }, 80);
        });
      }

      tbody.appendChild(tr);
    });
  }



  // Gerenciamento do Modal de Confirmação de Exclusão
  const modalDeleteConfirm = document.getElementById('modalDeleteConfirm');
  const closeDeleteModal = document.getElementById('closeDeleteModal');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteCardName = document.getElementById('deleteCardName');
  let cardToDelete = null;
  let cardElementToDelete = null;

  const modalDeleteOptions = document.getElementById('modalDeleteOptions');
  const closeDeleteOptionsModal = document.getElementById('closeDeleteOptionsModal');
  const deleteOptionsCardName = document.getElementById('deleteOptionsCardName');
  const btnOptDesqualificado = document.getElementById('btnOptDesqualificado');
  const btnOptRecusado = document.getElementById('btnOptRecusado');
  const btnOptRecuperacao = document.getElementById('btnOptRecuperacao');
  const btnOptNoShow = document.getElementById('btnOptNoShow');
  const btnOptNegado = document.getElementById('btnOptNegado');
  const btnOptDeletar = document.getElementById('btnOptDeletar');

  function openDeleteModal(card, cardElement) {
    cardToDelete = card;
    cardElementToDelete = cardElement;
    if (deleteOptionsCardName) deleteOptionsCardName.textContent = card.nome ? `"${card.nome}"` : 'este cliente';
    if (modalDeleteOptions) modalDeleteOptions.classList.remove('hidden');
  }

  function closeDeleteOptionsModalFn() {
    if (modalDeleteOptions) modalDeleteOptions.classList.add('hidden');
  }

  function closeDeleteConfirmModal() {
    cardToDelete = null;
    cardElementToDelete = null;
    if (modalDeleteConfirm) modalDeleteConfirm.classList.add('hidden');
    closeDeleteOptionsModalFn();
  }

  if (closeDeleteOptionsModal) closeDeleteOptionsModal.addEventListener('click', closeDeleteOptionsModalFn);

  // Modal de Confirmação de Ação Webhook
  const modalWebhookConfirm = document.getElementById('modalWebhookConfirm');
  const closeWebhookConfirmModal = document.getElementById('closeWebhookConfirmModal');
  const cancelWebhookConfirmBtn = document.getElementById('cancelWebhookConfirmBtn');
  const confirmWebhookConfirmBtn = document.getElementById('confirmWebhookConfirmBtn');
  const webhookConfirmCardName = document.getElementById('webhookConfirmCardName');
  const webhookConfirmActionName = document.getElementById('webhookConfirmActionName');

  let pendingWebhookAction = null; // { label, value }

  function closeWebhookConfirmModalFn() {
    pendingWebhookAction = null;
    if (modalWebhookConfirm) modalWebhookConfirm.classList.add('hidden');
  }

  if (closeWebhookConfirmModal) closeWebhookConfirmModal.addEventListener('click', closeWebhookConfirmModalFn);
  if (cancelWebhookConfirmBtn) cancelWebhookConfirmBtn.addEventListener('click', closeWebhookConfirmModalFn);

  window.addEventListener('click', (e) => {
    if (e.target === modalWebhookConfirm) closeWebhookConfirmModalFn();
  });

  // Abre modal de confirmação para a ação de status
  function requestStatusChangeConfirmation(actionLabel, actionValue) {
    if (!cardToDelete) return;
    pendingWebhookAction = { label: actionLabel, value: actionValue };
    closeDeleteOptionsModalFn();

    if (webhookConfirmCardName) webhookConfirmCardName.textContent = cardToDelete.nome ? `"${cardToDelete.nome}"` : 'este cliente';
    if (webhookConfirmActionName) webhookConfirmActionName.textContent = actionLabel;
    if (modalWebhookConfirm) modalWebhookConfirm.classList.remove('hidden');
  }

  // Ao clicar em 'Confirmar' no modal de ação
  if (confirmWebhookConfirmBtn) {
    confirmWebhookConfirmBtn.addEventListener('click', async () => {
      if (!pendingWebhookAction || !cardToDelete) return;
      const { label, value } = pendingWebhookAction;
      closeWebhookConfirmModalFn();
      await triggerInsuccessWebhook(label, value);
    });
  }

  // Ações das opções de status (Desqualificado, Recusado, Recuperação, No-Show) -> Solicita Confirmação
  async function triggerInsuccessWebhook(actionLabel, actionValue) {
    if (!cardToDelete) return;

    const targetCard = cardToDelete;
    const cardElToRem = cardElementToDelete;

    // Monta o payload incluindo a ação/status selecionado e todas as informações existentes do card/linha
    const payload = {
      opcao_selecionada: actionValue,
      status_selecionado: actionLabel,
      tabela_origem: getCurrentTable(),
      data_envio: new Date().toISOString(),
      ...targetCard
    };

    // Remove o card da lista local e atualiza a interface imediatamente sem precisar de F5
    allUserCards = allUserCards.filter(c => c.id !== targetCard.id);
    if (cardElToRem) cardElToRem.remove();
    const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
    filterAndRenderCards(searchTerm);

    try {
      showToast(`Enviando dados para processamento (${actionLabel})...`);

      const response = await fetch('https://n8n.srv1077266.hstgr.cloud/webhook/insucessos-rp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(`Enviado com sucesso (${actionLabel})!`);
      } else {
        showToast(`Webhook acionado, retorno: ${response.status}`);
      }
    } catch (err) {
      console.error('Erro ao chamar webhook:', err);
      showToast('Erro ao conectar com o webhook.');
    }

    cardToDelete = null;
    cardElementToDelete = null;
  }

  if (btnOptDesqualificado) {
    btnOptDesqualificado.addEventListener('click', () => requestStatusChangeConfirmation('Desqualificado', 'desqualificado'));
  }
  if (btnOptRecusado) {
    btnOptRecusado.addEventListener('click', () => requestStatusChangeConfirmation('Recusado', 'recusado'));
  }
  if (btnOptRecuperacao) {
    btnOptRecuperacao.addEventListener('click', () => requestStatusChangeConfirmation('Recuperação', 'recuperacao'));
  }
  if (btnOptNoShow) {
    btnOptNoShow.addEventListener('click', () => requestStatusChangeConfirmation('No-Show', 'no_show'));
  }
  if (btnOptNegado) {
    btnOptNegado.addEventListener('click', () => requestStatusChangeConfirmation('Negado', 'negado'));
  }

  // Clicou em 'Deletar' na lista de opções: remove o registro do banco de dados (Supabase)
  if (btnOptDeletar) {
    btnOptDeletar.addEventListener('click', () => {
      closeDeleteOptionsModalFn();
      if (deleteCardName && cardToDelete) deleteCardName.textContent = `"${cardToDelete.nome}"`;
      if (modalDeleteConfirm) modalDeleteConfirm.classList.remove('hidden');
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!cardToDelete || !supabase) return;

      const targetCardId = cardToDelete.id;
      const cardElToRem = cardElementToDelete;
      closeDeleteConfirmModal();

      const { error } = await supabase
        .from(getCurrentTable())
        .delete()
        .eq('id', targetCardId);

      if (error) {
        showToast('Erro ao excluir do banco de dados: ' + error.message);
        return;
      }

      allUserCards = allUserCards.filter(c => c.id !== targetCardId);
      if (cardElToRem) cardElToRem.remove();
      const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
      filterAndRenderCards(searchTerm);
      showToast('Card excluído da base de dados com sucesso!');

      cardToDelete = null;
      cardElementToDelete = null;
    });
  }

  if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteConfirmModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);

  window.addEventListener('click', (e) => {
    if (e.target === modalDeleteConfirm) closeDeleteConfirmModal();
    if (e.target === modalDeleteOptions) closeDeleteOptionsModalFn();
    if (e.target === modalDatePicker) closeDatePickerModalFn();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalDeleteConfirm) closeDeleteConfirmModal();
      if (modalDeleteOptions) closeDeleteOptionsModalFn();
      if (modalDatePicker) closeDatePickerModalFn();
    }
  });

  /* ==========================================
     MODAL DE EDIÇÃO DA DATA DE REQUERIMENTO
     ========================================== */
  let cardToUpdateDate = null;
  const modalDatePicker = document.getElementById('modalDatePicker');
  const closeDatePickerModal = document.getElementById('closeDatePickerModal');
  const cancelDatePickerBtn = document.getElementById('cancelDatePickerBtn');
  const saveDatePickerBtn = document.getElementById('saveDatePickerBtn');
  const datePickerInput = document.getElementById('datePickerInput');
  const datePickerClientName = document.getElementById('datePickerClientName');

  function openDatePickerModal(card) {
    cardToUpdateDate = card;
    if (datePickerClientName) datePickerClientName.textContent = card.nome ? `"${card.nome}"` : 'este cliente';
    if (datePickerInput) {
      datePickerInput.value = card.data_requerimento || new Date().toISOString().split('T')[0];
    }
    if (modalDatePicker) modalDatePicker.classList.remove('hidden');
  }

  function closeDatePickerModalFn() {
    cardToUpdateDate = null;
    if (modalDatePicker) modalDatePicker.classList.add('hidden');
  }

  if (closeDatePickerModal) closeDatePickerModal.addEventListener('click', closeDatePickerModalFn);
  if (cancelDatePickerBtn) cancelDatePickerBtn.addEventListener('click', closeDatePickerModalFn);

  if (saveDatePickerBtn) {
    saveDatePickerBtn.addEventListener('click', async () => {
      if (!cardToUpdateDate || !datePickerInput) return;
      const newDate = datePickerInput.value;
      if (!newDate) {
        showToast('Por favor, selecione uma data válida.');
        return;
      }

      saveDatePickerBtn.disabled = true;
      saveDatePickerBtn.textContent = 'Salvando...';

      if (supabase) {
        const { error } = await supabase
          .from(getCurrentTable())
          .update({ data_requerimento: newDate })
          .eq('id', cardToUpdateDate.id);

        if (error) {
          showToast('Erro ao atualizar data: ' + error.message);
          saveDatePickerBtn.disabled = false;
          saveDatePickerBtn.textContent = 'Salvar Data';
          return;
        }
      }

      saveDatePickerBtn.disabled = false;
      saveDatePickerBtn.textContent = 'Salvar Data';
      closeDatePickerModalFn();

      loadUserCards(); // Atualiza os cards
      showToast('Data de requerimento atualizada com sucesso!');
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (cardToDelete) {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Excluindo...';

        if (supabase) {
          await supabase.from(getCurrentTable()).delete().eq('id', cardToDelete.id);
        }

        if (cardElementToDelete) cardElementToDelete.remove();
        loadUserCards(); // Atualiza contadores das colunas

        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Excluir';
        closeDeleteConfirmModal();
        showToast('Oportunidade excluída com sucesso.');
      }
    });
  }

  function renderKanbanCards(cards) {
    let stages = [];
    if (window.currentTab === 'comercial') {
      stages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
    } else if (window.currentTab === 'operacao') {
      stages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
    } else if (window.currentTab === 'judicial') {
      stages = ['negado'];
    }

    stages.forEach(stage => {
      // Pega apenas a coluna da tab atual
      const column = document.querySelector(`.kanban-column[data-stage="${stage}"][data-tab="${window.currentTab}"]`);
      if (column) {
        const container = column.querySelector('.kanban-cards-container');
        const countSpan = column.querySelector('.column-count');
        container.innerHTML = '';
        
        // Filtrar cards da coluna e ordenar
        const stageCards = cards.filter(c => c.status === stage).sort((a, b) => {
          if (window.currentTab === 'operacao') {
            const da = a.data_requerimento ? new Date(a.data_requerimento).getTime() : Infinity;
            const db = b.data_requerimento ? new Date(b.data_requerimento).getTime() : Infinity;
            return da - db;
          } else {
            const dateA = new Date(a.atualizado_em || a.criado_em || 0).getTime();
            const dateB = new Date(b.atualizado_em || b.criado_em || 0).getTime();
            return dateB - dateA;
          }
        });

        countSpan.textContent = stageCards.length;

        stageCards.forEach(card => {
          container.appendChild(createCardElement(card));
        });
      }
    });

    setupKanbanDragAndDrop();
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
          ${escapeHtml(card.telefone || 'Sem telefone')}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </a>
      </div>
      <div class="card-detail-item card-date-badge ${dateStatusClass}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
        </svg>
        ${formattedDate}
        <span class="date-dot" title="Status da Data"></span>
      </div>
    `;

    cardDiv.setAttribute('draggable', 'true');

    // Eventos de Drag & Drop do Card
    cardDiv.addEventListener('dragstart', (e) => {
      cardDiv.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    cardDiv.addEventListener('dragend', () => {
      cardDiv.classList.remove('dragging');
      document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
    });

    // Clique no Card para Abrir Ficha do Cliente (ignora cliques no botão de exclusão, no link do WhatsApp e na etiqueta de data)
    cardDiv.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-card') || e.target.closest('.whatsapp-link') || e.target.closest('.card-date-badge')) return;
      openClientSheetModal(card);
    });

    // Evento de Alteração de Data via Pop-up de Calendário
    const dateBadge = cardDiv.querySelector('.card-date-badge');
    if (dateBadge) {
      dateBadge.title = "Clique para alterar a data de requerimento";
      dateBadge.style.cursor = "pointer";
      dateBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        openDatePickerModal(card);
      });
    }

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

  /* Setup Global de Drag & Drop para as Colunas do Kanban */
  function setupKanbanDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
      const container = column.querySelector('.kanban-cards-container');
      const targetStage = column.dataset.stage;
      if (!container || !targetStage) return;

      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        column.classList.add('drag-over');
      });

      column.addEventListener('dragleave', (e) => {
        // Remove destaque apenas se saiu da coluna inteira
        if (!column.contains(e.relatedTarget)) {
          column.classList.remove('drag-over');
        }
      });

      column.addEventListener('drop', async (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');
        const cardId = e.dataTransfer.getData('text/plain');
        if (!cardId) return;

        const cardObj = allUserCards.find(c => String(c.id) === String(cardId));
        if (!cardObj || cardObj.status === targetStage) return;

        // Se a coluna destino for 'proposta', abre o pop-up de confirmação de canal
        if (targetStage === 'proposta') {
          openProposalModal(cardObj, targetStage);
          return;
        }

        // Se a coluna destino for 'concedido' na aba Operação, abre o pop-up de cobrança
        if (targetStage === 'concedido' && window.currentTab === 'operacao') {
          openConcedidoModal(cardObj, targetStage);
          return;
        }

        // Para outras colunas, executa a mudança diretamente
        await changeCardStatus(cardObj, targetStage);
      });
    });
  }

  /* Função genérica para alterar o status do card */
  async function changeCardStatus(cardObj, newStage) {
    const oldStage = cardObj.status;
    const oldAtualizadoEm = cardObj.atualizado_em;
    const nowIso = new Date().toISOString();

    cardObj.status = newStage;
    cardObj.atualizado_em = nowIso;
    
    const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
    filterAndRenderCards(searchTerm);

    if (currentActiveCard && currentActiveCard.id === cardObj.id) {
      updateStatusTagUI(newStage);
    }

    if (supabase) {
      const { error } = await supabase
        .from(getCurrentTable())
        .update({ 
          status: newStage,
          atualizado_em: nowIso
        })
        .eq('id', cardObj.id);

      if (error) {
        console.error('Erro Supabase ao atualizar status:', error);
        cardObj.status = oldStage;
        cardObj.atualizado_em = oldAtualizadoEm;
        filterAndRenderCards(searchTerm);
        if (currentActiveCard && currentActiveCard.id === cardObj.id) {
          updateStatusTagUI(oldStage);
        }
        showToast('Erro ao mover card: ' + error.message);
      } else {
        showToast(`Status alterado para "${stageLabels[newStage] || newStage}".`);
      }
    }
  }

  /* ==========================================
     GERENCIAMENTO DO MODAL DE PROPOSTA & WEBHOOK
     ========================================== */
  const modalProposalConfirm = document.getElementById('modalProposalConfirm');
  const closeProposalModal = document.getElementById('closeProposalModal');
  const cancelProposalBtn = document.getElementById('cancelProposalBtn');
  const confirmProposalBtn = document.getElementById('confirmProposalBtn');
  const proposalClientName = document.getElementById('proposalClientName');
  let proposalCardTarget = null;
  let proposalNewStatusTarget = null;

  // Toggle de seleção visual entre Email e Whatsapp
  const proposalEmailLabel = document.getElementById('proposalOptionEmailLabel');
  const proposalWhatsappLabel = document.getElementById('proposalOptionWhatsappLabel');
  const proposalRadios = document.querySelectorAll('input[name="proposalChannel"]');

  proposalRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (proposalEmailLabel) proposalEmailLabel.classList.toggle('active', radio.value === 'Email' && radio.checked);
      if (proposalWhatsappLabel) proposalWhatsappLabel.classList.toggle('active', radio.value === 'Whatsapp' && radio.checked);
    });
  });

  function openProposalModal(card, newStatus) {
    proposalCardTarget = card;
    proposalNewStatusTarget = newStatus;
    if (proposalClientName) proposalClientName.textContent = `"${card.nome}"`;
    
    // Reseta para Email por padrão
    const defaultRadio = document.querySelector('input[name="proposalChannel"][value="Email"]');
    if (defaultRadio) {
      defaultRadio.checked = true;
      if (proposalEmailLabel) proposalEmailLabel.classList.add('active');
      if (proposalWhatsappLabel) proposalWhatsappLabel.classList.remove('active');
    }

    if (modalProposalConfirm) modalProposalConfirm.classList.remove('hidden');
  }

  function closeProposalModalWindow() {
    proposalCardTarget = null;
    proposalNewStatusTarget = null;
    if (modalProposalConfirm) modalProposalConfirm.classList.add('hidden');
  }

  if (closeProposalModal) closeProposalModal.addEventListener('click', closeProposalModalWindow);
  if (cancelProposalBtn) cancelProposalBtn.addEventListener('click', closeProposalModalWindow);

  window.addEventListener('click', (e) => {
    if (e.target === modalProposalConfirm) closeProposalModalWindow();
  });

  if (confirmProposalBtn) {
    confirmProposalBtn.addEventListener('click', async () => {
      if (!proposalCardTarget || !proposalNewStatusTarget) return;

      const canalEnvio = 'Sistema';

      confirmProposalBtn.disabled = true;
      const btnSpan = confirmProposalBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Enviando...';

      // 1. Acionar Webhook com os dados completos da Ficha e o Canal de Envio
      const webhookPayload = {
        canal_envio: canalEnvio,
        id: proposalCardTarget.id,
        nome: proposalCardTarget.nome,
        cpf: proposalCardTarget.cpf,
        rg: proposalCardTarget.rg,
        data_nascimento: proposalCardTarget.data_nascimento,
        nome_mae: proposalCardTarget.nome_mae,
        telefone: proposalCardTarget.telefone,
        email: proposalCardTarget.email,
        cep: proposalCardTarget.cep,
        endereco: proposalCardTarget.endereco,
        numero: proposalCardTarget.numero,
        complemento: proposalCardTarget.complemento,
        bairro: proposalCardTarget.bairro,
        cidade: proposalCardTarget.cidade,
        estado: proposalCardTarget.estado,
        uf: proposalCardTarget.uf,
        estado_civil: proposalCardTarget.estado_civil,
        profissao: proposalCardTarget.profissao,
        nit_pis: proposalCardTarget.nit_pis,
        senha_meu_inss: proposalCardTarget.senha_meu_inss,
        data_requerimento: proposalCardTarget.data_requerimento,
        status: proposalNewStatusTarget,
        criado_em: proposalCardTarget.criado_em
      };

      try {
        await fetch('https://n8n.srv1077266.hstgr.cloud/webhook/proposta_rp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });
      } catch (webhookErr) {
        console.warn('Erro ao acionar webhook:', webhookErr);
      }

      // 2. Alterar status do card no CRM e Supabase
      const cardToUpdate = proposalCardTarget;
      const newStatus = proposalNewStatusTarget;
      closeProposalModalWindow();

      await changeCardStatus(cardToUpdate, newStatus);
      showToast(`Proposta enviada com sucesso!`);

      confirmProposalBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = 'Enviar';
    });
  }

  // ================= MODAL CONCEDIDO =================
  const modalConcedido = document.getElementById('modalConcedido');
  const closeConcedidoModal = document.getElementById('closeConcedidoModal');
  const cancelConcedidoBtn = document.getElementById('cancelConcedidoBtn');
  const confirmConcedidoBtn = document.getElementById('confirmConcedidoBtn');
  const concedidoClientName = document.getElementById('concedidoClientName');
  
  let concedidoCardTarget = null;
  let concedidoNewStatusTarget = null;

  function formatCurrencyBRL(value) {
    let clean = String(value || '').replace(/\D/g, '');
    if (!clean) return '';
    const numberVal = parseFloat(clean) / 100;
    return numberVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const concedidoValorRendaInput = document.getElementById('concedidoValorRenda');
  if (concedidoValorRendaInput) {
    concedidoValorRendaInput.addEventListener('input', (e) => {
      e.target.value = formatCurrencyBRL(e.target.value);
    });
  }

  function openConcedidoModal(card, newStatus) {
    concedidoCardTarget = card;
    concedidoNewStatusTarget = newStatus;
    if (concedidoClientName) concedidoClientName.textContent = `"${card.nome}"`;
    
    if (concedidoValorRendaInput) concedidoValorRendaInput.value = '';
    document.getElementById('concedidoMesesAtraso').value = '';
    document.getElementById('concedidoDataCobranca').value = '';
    document.getElementById('concedidoNumeroParcelas').value = '';

    if (modalConcedido) modalConcedido.classList.remove('hidden');
  }

  function closeConcedidoModalWindow() {
    concedidoCardTarget = null;
    concedidoNewStatusTarget = null;
    if (modalConcedido) modalConcedido.classList.add('hidden');
  }

  if (closeConcedidoModal) closeConcedidoModal.addEventListener('click', closeConcedidoModalWindow);
  if (cancelConcedidoBtn) cancelConcedidoBtn.addEventListener('click', closeConcedidoModalWindow);

  window.addEventListener('click', (e) => {
    if (e.target === modalConcedido) closeConcedidoModalWindow();
  });

  if (confirmConcedidoBtn) {
    confirmConcedidoBtn.addEventListener('click', async () => {
      if (!concedidoCardTarget || !concedidoNewStatusTarget) return;

      const valorRenda = document.getElementById('concedidoValorRenda').value;
      const mesesAtraso = document.getElementById('concedidoMesesAtraso').value;
      const dataCobranca = document.getElementById('concedidoDataCobranca').value;
      const numeroParcelas = document.getElementById('concedidoNumeroParcelas').value;

      confirmConcedidoBtn.disabled = true;
      const btnSpan = confirmConcedidoBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Enviando...';

      const webhookPayload = {
        valor_renda: valorRenda,
        meses_atraso: mesesAtraso,
        data_cobranca: dataCobranca,
        numero_parcelas: numeroParcelas,
        id: concedidoCardTarget.id,
        nome: concedidoCardTarget.nome,
        cpf: concedidoCardTarget.cpf,
        rg: concedidoCardTarget.rg,
        data_nascimento: concedidoCardTarget.data_nascimento,
        nome_mae: concedidoCardTarget.nome_mae,
        telefone: concedidoCardTarget.telefone,
        email: concedidoCardTarget.email,
        cep: concedidoCardTarget.cep,
        endereco: concedidoCardTarget.endereco,
        numero: concedidoCardTarget.numero,
        complemento: concedidoCardTarget.complemento,
        bairro: concedidoCardTarget.bairro,
        cidade: concedidoCardTarget.cidade,
        estado: concedidoCardTarget.estado,
        uf: concedidoCardTarget.uf,
        estado_civil: concedidoCardTarget.estado_civil,
        profissao: concedidoCardTarget.profissao,
        nit_pis: concedidoCardTarget.nit_pis,
        senha_meu_inss: concedidoCardTarget.senha_meu_inss,
        data_requerimento: concedidoCardTarget.data_requerimento,
        status: concedidoNewStatusTarget,
        criado_em: concedidoCardTarget.criado_em
      };

      try {
        await fetch('https://n8n.srv1077266.hstgr.cloud/webhook/cobranca_rp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });
      } catch (webhookErr) {
        console.warn('Erro ao acionar webhook de cobrança:', webhookErr);
      }

      const cardToUpdate = concedidoCardTarget;
      const newStatus = concedidoNewStatusTarget;
      closeConcedidoModalWindow();

      await changeCardStatus(cardToUpdate, newStatus);
      showToast(`Benefício concedido! Cobrança gerada.`);

      confirmConcedidoBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = 'Enviar';
    });
  }

  function getStageLabel(stage) {
    return stageLabels[stage] || stage;
  }

  /* ==========================================
     GERENCIAMENTO DO MODAL: FICHA DO CLIENTE (A4 E GUIAS)
     ========================================== */
  let currentActiveCard = null;
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
  const sheetDataNascimento = document.getElementById('sheetDataNascimento');
  const sheetCep = document.getElementById('sheetCep');
  const sheetEndereco = document.getElementById('sheetEndereco');
  const sheetComplemento = document.getElementById('sheetComplemento');
  const sheetUf = document.getElementById('sheetUf');
  const sheetCidade = document.getElementById('sheetCidade');
  const sheetBairro = document.getElementById('sheetBairro');
  const saveClientSheetBtn = document.getElementById('saveClientSheetBtn');

  function updateSheetPhoneWaLink(phoneVal) {
    const waBtn = document.getElementById('sheetPhoneWaBtn');
    if (!waBtn) return;
    const digits = phoneVal ? phoneVal.replace(/\D/g, '') : '';
    if (digits) {
      waBtn.href = `https://wa.me/55${digits}`;
      waBtn.target = '_blank';
      waBtn.onclick = null;
      waBtn.title = `Abrir conversa no WhatsApp (${phoneVal})`;
    } else {
      waBtn.removeAttribute('href');
      waBtn.title = 'Telefone não informado';
      waBtn.onclick = (e) => {
        e.preventDefault();
        showToast('Telefone não informado.');
      };
    }
  }

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
      updateSheetPhoneWaLink(v);
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

  function calculateAge(birthDateString) {
    if (!birthDateString) return '—';
    let raw = String(birthDateString).trim();
    if (raw.includes('T')) raw = raw.split('T')[0];

    let year, month, day;
    if (raw.includes('-')) {
      const parts = raw.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        } else {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }
      }
    } else if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        } else if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        }
      }
    }

    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) return '—';

    const today = new Date();
    let age = today.getFullYear() - year;
    const monthDiff = (today.getMonth() + 1) - month;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
      age--;
    }

    return (age >= 0 && age < 130) ? `${age} anos` : '—';
  }

  if (sheetDataNascimento) {
    sheetDataNascimento.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 8) v = v.slice(0, 8);
      if (v.length > 4) {
        v = v.replace(/^(\d{2})(\d{2})(\d{1,4})$/, '$1/$2/$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{1,2})$/, '$1/$2');
      }
      e.target.value = v;

      const elIdade = document.getElementById('respIdade');
      if (elIdade) {
        elIdade.value = calculateAge(v);
      }
    });
  }

  if (sheetClientNameInput) {
    const saveClientNameChange = async () => {
      if (!currentActiveCard || !supabase) return;
      const newName = sheetClientNameInput.value.trim();
      if (!newName || newName === currentActiveCard.nome) return;

      const { error } = await supabase
        .from(getCurrentTable())
        .update({ nome: newName })
        .eq('id', currentActiveCard.id);

      if (error) {
        showToast('Erro ao atualizar nome: ' + error.message);
        sheetClientNameInput.value = currentActiveCard.nome || '';
        return;
      }

      currentActiveCard.nome = newName;
      loadUserCards();
      showToast('Nome atualizado com sucesso!');
    };

    sheetClientNameInput.addEventListener('blur', saveClientNameChange);
    sheetClientNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sheetClientNameInput.blur();
      }
    });
  }

  function openClientSheetModal(card) {
    try {
      currentActiveCard = card;
      
      // Preencher Nome (Título editável)
      const inputName = document.getElementById('sheetClientNameInput');
      if (inputName) inputName.value = card.nome || '';
      
      // Preencher etiqueta e botão de código / Google Drive (Guia Documentos)
      const docsCardCodeTag = document.getElementById('docsCardCodeTag');
      if (docsCardCodeTag) {
        docsCardCodeTag.textContent = card.codigo || 'RP00';
      }

      const docsCardCodeBtn = document.getElementById('docsCardCodeBtn');
      if (docsCardCodeBtn) {
        let driveUrl = card.drive_link ? card.drive_link.trim() : '';
        if (driveUrl && !driveUrl.startsWith('http://') && !driveUrl.startsWith('https://')) {
          driveUrl = 'https://' + driveUrl;
        }

        if (driveUrl) {
          docsCardCodeBtn.href = driveUrl;
          docsCardCodeBtn.target = '_blank';
          docsCardCodeBtn.title = `Abrir Google Drive (${card.codigo || 'Pasta'})`;
          docsCardCodeBtn.onclick = null;
        } else {
          docsCardCodeBtn.removeAttribute('href');
          docsCardCodeBtn.title = 'Link do Google Drive não cadastrado para este card';
          docsCardCodeBtn.onclick = (e) => {
            e.preventDefault();
            showToast('Link do Google Drive não cadastrado.');
          };
        }
      }
      
      // Preencher demais campos da Ficha com segurança
      const elPhone = document.getElementById('sheetPhone');
      if (elPhone) {
        elPhone.value = card.telefone || '';
        updateSheetPhoneWaLink(card.telefone || '');
      }

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

      const elDataNascimento = document.getElementById('sheetDataNascimento');
      if (elDataNascimento) {
        let rawDate = card.data_nascimento ? card.data_nascimento.split('T')[0] : '';
        if (rawDate.includes('-')) {
          const parts = rawDate.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            rawDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        elDataNascimento.value = rawDate;
      }

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
      const elIdade = document.getElementById('respIdade');
      if (elIdade) elIdade.value = calculateAge(card.data_nascimento);

      const elJaContribuiu = document.getElementById('respJaContribuiu');
      if (elJaContribuiu) elJaContribuiu.value = card.ja_contribuiu || '';

      const elTempoContribuicao = document.getElementById('respTempoContribuicao');
      if (elTempoContribuicao) elTempoContribuicao.value = card.tempo_contribuicao !== undefined && card.tempo_contribuicao !== null ? card.tempo_contribuicao : '';

      const elTipoTrabalho = document.getElementById('respTipoTrabalho');
      if (elTipoTrabalho) elTipoTrabalho.value = card.tipo_trabalho || '';

      const elSolicitouBeneficio = document.getElementById('respSolicitouBeneficio');
      if (elSolicitouBeneficio) elSolicitouBeneficio.value = card.solicitou_beneficio || '';

      const elExerceuAtividadeEspecial = document.getElementById('respExerceuAtividadeEspecial');
      if (elExerceuAtividadeEspecial) elExerceuAtividadeEspecial.value = card.exerceu_atividade_especial || '';

      const elDetalhes = document.getElementById('respDetalhes');
      if (elDetalhes) elDetalhes.value = card.detalhes || '';

      // Preencher campos da guia Documentos (Etiquetas de Status e Lista Eventuais)
      renderDocumentBadges(card);
      renderEventualDocs(card);
      updateSheetNotesBadge(card);

      // Atualizar estado visual do botão Etiqueta (Status)
      updateStatusTagUI(card.status || 'novo');

      // Resetar para a aba 'Documentos' se estiver em Operação, caso contrário 'Respostas'
      switchTab(window.currentTab === 'operacao' ? 'documentos' : 'respostas');

      const btnObr = document.getElementById('toggleObrigatoriosBtn');
      const listObr = document.getElementById('listObrigatoriosContent');
      if (btnObr && listObr) {
        btnObr.setAttribute('aria-expanded', 'false');
        listObr.classList.add('collapsed');
      }

      const btnEv = document.getElementById('toggleEventuaisBtn');
      const listEv = document.getElementById('listEventuaisContent');
      if (btnEv && listEv) {
        btnEv.setAttribute('aria-expanded', 'false');
        listEv.classList.add('collapsed');
      }

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
        .from(getCurrentTable())
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
      eventualDocsDynamicList.innerHTML = '';
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
      .from(getCurrentTable())
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

      const nameEl = document.getElementById('sheetClientNameInput');
      const updatedNome = nameEl ? nameEl.value.trim() : (sheetClientNameInput ? sheetClientNameInput.value.trim() : '');
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
        data_nascimento: sheetDataNascimento ? sheetDataNascimento.value : '',
        cep: sheetCep ? sheetCep.value.trim() : '',
        endereco: sheetEndereco ? sheetEndereco.value.trim() : '',
        complemento: sheetComplemento ? sheetComplemento.value.trim() : '',
        uf: sheetUf ? sheetUf.value : '',
        cidade: sheetCidade ? sheetCidade.value.trim() : '',
        bairro: sheetBairro ? sheetBairro.value.trim() : ''
      };

      const { error } = await supabase
        .from(getCurrentTable())
        .update(updatedData)
        .eq('id', currentActiveCard.id);

      if (saveClientSheetBtn) {
        saveClientSheetBtn.disabled = false;
        saveClientSheetBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Salvar
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
      const respExerceuAtividadeEspecial = document.getElementById('respExerceuAtividadeEspecial');
      const respDetalhes = document.getElementById('respDetalhes');

      const updatedAnswers = {
        ja_contribuiu: respJaContribuiu ? respJaContribuiu.value : '',
        tempo_contribuicao: respTempoContribuicao && respTempoContribuicao.value !== '' ? parseInt(respTempoContribuicao.value, 10) : null,
        tipo_trabalho: respTipoTrabalho ? respTipoTrabalho.value : '',
        solicitou_beneficio: respSolicitouBeneficio ? respSolicitouBeneficio.value : '',
        exerceu_atividade_especial: respExerceuAtividadeEspecial ? respExerceuAtividadeEspecial.value : '',
        detalhes: respDetalhes ? respDetalhes.value.trim() : ''
      };

      const { error } = await supabase
        .from(getCurrentTable())
        .update(updatedAnswers)
        .eq('id', currentActiveCard.id);

      if (saveClientAnswersBtn) {
        saveClientAnswersBtn.disabled = false;
        saveClientAnswersBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Salvar
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
        .from(getCurrentTable())
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
        if (newStatus === 'proposta') {
          openProposalModal(currentActiveCard, newStatus);
          return;
        }

        if (newStatus === 'concedido' && window.currentTab === 'operacao') {
          openConcedidoModal(currentActiveCard, newStatus);
          return;
        }

        await changeCardStatus(currentActiveCard, newStatus);
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
      const name = getUserDisplayName(p).toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(searchTerm) || email.includes(searchTerm);
    });

    // Excluir o próprio usuário logado ('Eu') e listar apenas os outros usuários
    const otherUsers = filtered.filter(p => p.id !== currentUserId);

    if (otherUsers.length === 0) {
      reassignUserList.innerHTML = '<div style="font-size:0.85rem; color:#64748B; text-align:center; padding:1rem;">Nenhum usuário encontrado.</div>';
      return;
    }

    // Seção 'Usuários'
    const usersHeader = document.createElement('div');
    usersHeader.className = 'reassign-section-title';
    usersHeader.textContent = 'Usuários';
    reassignUserList.appendChild(usersHeader);

    otherUsers.forEach(profile => {
      reassignUserList.appendChild(createUserItemElement(profile));
    });
  }

  function createUserItemElement(profile) {
    const displayName = getUserDisplayName(profile);
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
          .from(getCurrentTable())
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

  // Inicializar verificação de sessão após registrar todos os ouvintes do DOM
  checkActiveSession();
});
