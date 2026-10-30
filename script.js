document.addEventListener('DOMContentLoaded', async () => {
  // Inicialização do Supabase Client
  const SUPABASE_URL = 'https://jqyxtrzcwgropuqchwiz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeXh0cnpjd2dyb3B1cWNod2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjIzMDgsImV4cCI6MjEwMjAzODMwOH0.m9ZpiTanwhl5SzzAfJoTs1x9KekWuFqB0C3d__0mIbA';

  const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  // Estado da aba atual (Comercial, Operação, Judicial) — Tabela unificada 'crm'
  window.currentTab = 'comercial';
  function getCurrentTable() {
    return 'crm';
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

      // Atualiza visibilidade dos chips de status no painel de filtros
      if (typeof updateFilterStatusOptionsVisibility === 'function') {
        updateFilterStatusOptionsVisibility();
      }

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
    'planejamento': 'dot-planejamento',
    'documentacao': 'dot-documentacao',
    'na_fila': 'dot-na_fila',
    'requerido': 'dot-requerido',
    'concedido': 'dot-concedido',
    'exigencia': 'dot-exigencia',
    'negado': 'dot-negado'
  };

  const backToAdminBtn = document.getElementById('backToAdminBtn');

  function getRoleAllowedTabs(role, userId) {
    if (userId === ADMIN_USER_ID || role === 'admin') {
      return ['comercial', 'operacao', 'judicial'];
    }
    if (role === 'operador_juridico' || role === 'supervisor_juridico' || role === 'advogado') {
      return ['operacao', 'judicial'];
    }
    // Operador Comercial / Supervisor Comercial / usuario / default
    return ['comercial'];
  }

  function updateNavigationByRole(profile, userId) {
    const role = profile ? (profile.role || 'operador_comercial') : 'operador_comercial';
    const allowedTabs = getRoleAllowedTabs(role, userId);

    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    navItems.forEach(item => {
      const tabName = item.dataset.tab;
      if (allowedTabs.includes(tabName)) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });

    // Se a aba atualmente ativa não é permitida para o perfil, muda para a primeira aba permitida
    if (!allowedTabs.includes(window.currentTab)) {
      window.currentTab = allowedTabs[0];

      navItems.forEach(nav => {
        if (nav.dataset.tab === window.currentTab) {
          nav.classList.add('active');
        } else {
          nav.classList.remove('active');
        }
      });

      // Atualiza títulos do cabeçalho
      if (crmTitle && crmSubtitle) {
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
      }

      // Ocultar/Exibir colunas do Kanban com base na nova aba
      document.querySelectorAll('.kanban-column').forEach(col => {
        if (col.dataset.tab === window.currentTab) {
          col.classList.remove('hidden');
        } else {
          col.classList.add('hidden');
        }
      });

      // Ocultar/Exibir opções no dropdown de status
      document.querySelectorAll('.status-option').forEach(opt => {
        if (opt.dataset.tab === window.currentTab) {
          opt.classList.remove('hidden');
        } else {
          opt.classList.add('hidden');
        }
      });

      // Atualiza visibilidade dos chips de status no painel de filtros
      if (typeof updateFilterStatusOptionsVisibility === 'function') {
        updateFilterStatusOptionsVisibility();
      }
    }
  }

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

    // Atualiza navegação por perfil
    updateNavigationByRole(userProfile, userId);

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

  window.__tovShowDashboard = showDashboard;
  window.__tovShowAdmin = showAdminPanel;

  // Toggle da Sidebar Admin
  if (toggleAdminSidebarBtn && adminSidebar) {
    toggleAdminSidebarBtn.addEventListener('click', () => {
      adminSidebar.classList.toggle('collapsed');
    });
  }

  // Alternância de Abas Admin
  const adminNavItems = document.querySelectorAll('[data-admin-tab]');
  const adminTabDashboard = document.getElementById('adminTabDashboard');
  const adminTabUsers = document.getElementById('adminTabUsers');
  const adminTabFinancial = document.getElementById('adminTabFinancial');

  adminNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.dataset.adminTab;

      adminNavItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      if (targetTab === 'dashboard') {
        if (adminTabDashboard) adminTabDashboard.classList.remove('hidden');
        if (adminTabUsers) adminTabUsers.classList.add('hidden');
        if (adminTabFinancial) adminTabFinancial.classList.add('hidden');
      } else if (targetTab === 'users') {
        if (adminTabDashboard) adminTabDashboard.classList.add('hidden');
        if (adminTabUsers) adminTabUsers.classList.remove('hidden');
        if (adminTabFinancial) adminTabFinancial.classList.add('hidden');
      } else if (targetTab === 'financial') {
        if (adminTabDashboard) adminTabDashboard.classList.add('hidden');
        if (adminTabUsers) adminTabUsers.classList.add('hidden');
        if (adminTabFinancial) adminTabFinancial.classList.remove('hidden');
        if (typeof window.renderFinancialData === 'function') {
          window.renderFinancialData();
        }
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
        .from('crm')
        .select('*', { count: 'exact', head: true })
        .in('status', ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta', 'planejamento']);

      const { count: countOperacao } = await supabase
        .from('crm')
        .select('*', { count: 'exact', head: true })
        .in('status', ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido']);

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


      // Gráfico de Requerimentos por Mês (Próximos 12 meses na seção Operação)
      await loadOperacaoRequerimentosChart();

      // Métricas e Gráfico da Seção Marketing
      await loadMarketingDashboardData();
      await loadMarketingEvolucaoChart();

      // Métricas e Funil da Seção Comercial
      await loadCommercialDashboardData();
    } catch (e) {
      console.error('Erro ao carregar métricas admin:', e);
    }
  }

  // Variável para guardar a instância do gráfico do Chart.js
  let operacaoRequerimentosChartInstance = null;

  async function loadOperacaoRequerimentosChart() {
    const canvas = document.getElementById('operacaoRequerimentosChart');
    const loadingOverlay = document.getElementById('chartLoadingState');
    const statTotalEl = document.getElementById('chartStatTotalNext12');
    const statPeakEl = document.getElementById('chartStatPeakMonth');
    if (!canvas || !supabase) return;

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    try {
      // 1. Gerar os próximos 12 meses (incluindo o mês atual)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0 a 11

      const monthNamesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthNamesFullPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

      const months = []; // [{ key: 'YYYY-MM', label: 'Mês/AA', fullLabel: 'Mês YYYY', count: 0 }]
      for (let i = 0; i < 12; i++) {
        const d = new Date(currentYear, currentMonth + i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${m}`;
        const label = `${monthNamesPt[d.getMonth()]}/${String(y).slice(-2)}`;
        const fullLabel = `${monthNamesFullPt[d.getMonth()]} de ${y}`;
        months.push({ key, label, fullLabel, count: 0 });
      }

      const minDateStr = `${months[0].key}-01`;
      // Fim do 12º mês
      const lastMonthObj = new Date(currentYear, currentMonth + 12, 0); // Último dia do 12º mês
      const maxDateStr = `${lastMonthObj.getFullYear()}-${String(lastMonthObj.getMonth() + 1).padStart(2, '0')}-${String(lastMonthObj.getDate()).padStart(2, '0')}`;

      // 2. Buscar linhas da tabela crm (status de Operação) com data_requerimento no intervalo
      const { data: rows, error } = await supabase
        .from('crm')
        .select('data_requerimento')
        .in('status', ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'])
        .not('data_requerimento', 'is', null)
        .gte('data_requerimento', minDateStr)
        .lte('data_requerimento', maxDateStr);

      if (error) {
        console.warn('Erro ao consultar datas de requerimento:', error);
      }

      // Mapear contagem por mês
      const monthMap = new Map();
      months.forEach(m => monthMap.set(m.key, m));

      let totalNext12 = 0;
      if (rows && rows.length > 0) {
        rows.forEach(r => {
          if (!r.data_requerimento) return;
          // Formato esperado YYYY-MM-DD
          const ym = r.data_requerimento.slice(0, 7);
          if (monthMap.has(ym)) {
            monthMap.get(ym).count += 1;
            totalNext12 += 1;
          }
        });
      }

      // Encontrar mês com pico
      let maxMonth = months[0];
      months.forEach(m => {
        if (m.count > maxMonth.count) {
          maxMonth = m;
        }
      });

      if (statTotalEl) statTotalEl.textContent = totalNext12.toLocaleString('pt-BR');
      if (statPeakEl) {
        statPeakEl.textContent = maxMonth.count > 0 ? `${maxMonth.label} (${maxMonth.count})` : '—';
      }

      // 3. Renderizar com Chart.js
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js ainda não carregado.');
        return;
      }

      const labels = months.map(m => m.label);
      const values = months.map(m => m.count);

      // Obter cores do sistema ou gradiente moderno
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(30, 80, 128, 0.28)');
      gradient.addColorStop(0.7, 'rgba(30, 80, 128, 0.04)');
      gradient.addColorStop(1, 'rgba(30, 80, 128, 0)');

      if (operacaoRequerimentosChartInstance) {
        operacaoRequerimentosChartInstance.destroy();
      }

      operacaoRequerimentosChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Requerimentos Agendados',
            data: values,
            fill: true,
            backgroundColor: gradient,
            borderColor: '#0a0a0a',
            borderWidth: 2.5,
            pointBackgroundColor: '#0a0a0a',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#0a0a0a',
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 3,
            tension: 0.35
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              titleFont: {
                family: 'Inter, sans-serif',
                size: 13,
                weight: '700'
              },
              bodyFont: {
                family: 'Inter, sans-serif',
                size: 12,
                weight: '500'
              },
              padding: { top: 10, right: 14, bottom: 10, left: 14 },
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: function (items) {
                  const idx = items[0].dataIndex;
                  return months[idx].fullLabel;
                },
                label: function (item) {
                  const count = item.raw;
                  return `${count} ${count === 1 ? 'requerimento' : 'requerimentos'}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'Inter, sans-serif',
                  size: 11,
                  weight: '600'
                },
                color: '#64748B'
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                font: {
                  family: 'Inter, sans-serif',
                  size: 11,
                  weight: '500'
                },
                color: '#94A3B8',
                stepSize: 1
              },
              grid: {
                color: '#F1F5F9',
                borderDash: [4, 4]
              },
              border: {
                display: false
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Erro ao renderizar gráfico de requerimentos:', err);
    } finally {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
  }

  /* ==========================================================================
     MÓDULO DE MARKETING - DASHBOARD ADMIN
     ========================================================================== */

  // Estado do Filtro de Período de Marketing
  const nowMkt = new Date();
  let mktFilterStartDate = new Date(nowMkt.getFullYear(), nowMkt.getMonth(), 1);
  let mktFilterEndDate = new Date(nowMkt.getFullYear(), nowMkt.getMonth() + 1, 0, 23, 59, 59, 999);

  let mktCalViewYear = nowMkt.getFullYear();
  let mktCalViewMonth = nowMkt.getMonth(); // 0-11
  let mktSelectingStart = null; // Data temporária ao selecionar primeiro clique no calendário

  // Instância do Gráfico Histórico de Marketing
  let marketingEvolucaoChartInstance = null;

  function formatShortDate(d) {
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatISODate(d) {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 1. Atualizar display textual do período
  function updateMarketingDateRangeDisplay() {
    const displayEl = document.getElementById('mktDateRangeDisplay');
    if (displayEl) {
      displayEl.textContent = `${formatShortDate(mktFilterStartDate)} até ${formatShortDate(mktFilterEndDate)}`;
    }
  }

  // Estado da visualização do calendário ('days' | 'months' | 'years')
  let mktCalCurrentView = 'days';

  // 2. Renderizar Calendário Visual do Filtro de Período
  function renderMarketingCalendar() {
    const monthLabelEl = document.getElementById('mktCalMonthLabel');
    const yearLabelEl = document.getElementById('mktCalYearLabel');
    const monthBtn = document.getElementById('mktCalMonthBtn');
    const yearBtn = document.getElementById('mktCalYearBtn');
    const daysView = document.getElementById('mktCalDaysView');
    const monthsView = document.getElementById('mktCalMonthsView');
    const yearsView = document.getElementById('mktCalYearsView');
    const gridEl = document.getElementById('mktCalendarGrid');

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthShortNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    if (monthLabelEl) monthLabelEl.textContent = monthNames[mktCalViewMonth];
    if (yearLabelEl) yearLabelEl.textContent = mktCalViewYear;

    if (monthBtn) monthBtn.classList.toggle('active', mktCalCurrentView === 'months');
    if (yearBtn) yearBtn.classList.toggle('active', mktCalCurrentView === 'years');

    // Alternar visibilidade das visões
    if (daysView) daysView.classList.toggle('hidden', mktCalCurrentView !== 'days');
    if (monthsView) monthsView.classList.toggle('hidden', mktCalCurrentView !== 'months');
    if (yearsView) yearsView.classList.toggle('hidden', mktCalCurrentView !== 'years');

    // Renderizar visão de meses
    if (mktCalCurrentView === 'months' && monthsView) {
      monthsView.innerHTML = '';
      monthShortNames.forEach((shortName, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'mkt-cal-picker-item';
        if (idx === mktCalViewMonth) item.classList.add('active');
        item.textContent = shortName;
        item.title = monthNames[idx];
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          mktCalViewMonth = idx;
          mktCalCurrentView = 'days';
          renderMarketingCalendar();
        });
        monthsView.appendChild(item);
      });
      return;
    }

    // Renderizar visão de anos
    if (mktCalCurrentView === 'years' && yearsView) {
      yearsView.innerHTML = '';
      const currentYear = new Date().getFullYear();
      const startYear = Math.min(2020, mktCalViewYear - 4);
      const endYear = Math.max(currentYear + 2, mktCalViewYear + 4);

      for (let y = startYear; y <= endYear; y++) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'mkt-cal-picker-item';
        if (y === mktCalViewYear) item.classList.add('active');
        item.textContent = y;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          mktCalViewYear = y;
          mktCalCurrentView = 'days'; // Retorna direto para a visão de dias do mês atual
          renderMarketingCalendar();
        });
        yearsView.appendChild(item);
      }
      return;
    }

    // Renderizar visão padrão de dias do mês
    if (!gridEl) return;
    gridEl.innerHTML = '';

    // Primeiro dia do mês
    const firstDayDate = new Date(mktCalViewYear, mktCalViewMonth, 1);
    let startDayIndex = firstDayDate.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const daysInMonth = new Date(mktCalViewYear, mktCalViewMonth + 1, 0).getDate();

    // Células vazias antes do primeiro dia
    for (let i = 0; i < startDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'mkt-cal-day empty';
      gridEl.appendChild(emptyCell);
    }

    const startISO = formatISODate(mktFilterStartDate);
    const endISO = formatISODate(mktFilterEndDate);
    const selStartISO = mktSelectingStart ? formatISODate(mktSelectingStart) : null;

    // Células com os dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(mktCalViewYear, mktCalViewMonth, d);
      const cellISO = formatISODate(cellDate);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mkt-cal-day';
      btn.textContent = d;
      btn.dataset.date = cellISO;

      if (!mktSelectingStart) {
        // Modo intervalo definido
        const isStart = cellISO === startISO;
        const isEnd = cellISO === endISO;
        const inRange = cellISO >= startISO && cellISO <= endISO;

        if (inRange) btn.classList.add('in-range');
        if (isStart) btn.classList.add('range-start');
        if (isEnd) btn.classList.add('range-end');
      } else {
        // Usuário clicou na primeira data e está escolhendo a segunda
        if (cellISO === selStartISO) {
          btn.classList.add('range-start', 'range-end');
        }
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCalendarDayClick(cellDate);
      });

      gridEl.appendChild(btn);
    }
  }

  // Manipulação de clique em dia do calendário
  async function handleCalendarDayClick(date) {
    if (!mktSelectingStart) {
      // Primeiro clique: define data inicial
      mktSelectingStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      renderMarketingCalendar();
    } else {
      // Segundo clique: define fim do intervalo
      let d1 = mktSelectingStart;
      let d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (d1 > d2) {
        const tmp = d1;
        d1 = d2;
        d2 = tmp;
      }

      mktFilterStartDate = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 0, 0, 0, 0);
      mktFilterEndDate = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 23, 59, 59, 999);
      mktSelectingStart = null;
      mktCalCurrentView = 'days';

      updateMarketingDateRangeDisplay();
      renderMarketingCalendar();

      // Fechar dropdown
      const dropdown = document.getElementById('mktDatePickerDropdown');
      const wrapper = document.getElementById('mktDatePickerWrapper');
      if (dropdown) dropdown.classList.add('hidden');
      if (wrapper) wrapper.classList.remove('open');

      // Recalcular métricas
      await loadMarketingDashboardData();
    }
  }

  // Configuração dos eventos do Datepicker
  function setupMarketingDatePickerEvents() {
    const trigger = document.getElementById('mktDatePickerTrigger');
    const dropdown = document.getElementById('mktDatePickerDropdown');
    const wrapper = document.getElementById('mktDatePickerWrapper');
    const btnPrev = document.getElementById('mktCalPrevMonth');
    const btnNext = document.getElementById('mktCalNextMonth');
    const monthBtn = document.getElementById('mktCalMonthBtn');
    const yearBtn = document.getElementById('mktCalYearBtn');

    if (monthBtn) {
      monthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mktCalCurrentView = (mktCalCurrentView === 'months') ? 'days' : 'months';
        renderMarketingCalendar();
      });
    }

    if (yearBtn) {
      yearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mktCalCurrentView = (mktCalCurrentView === 'years') ? 'days' : 'years';
        renderMarketingCalendar();
      });
    }

    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
          dropdown.classList.remove('hidden');
          if (wrapper) wrapper.classList.add('open');
          mktCalViewYear = mktFilterStartDate.getFullYear();
          mktCalViewMonth = mktFilterStartDate.getMonth();
          mktSelectingStart = null;
          mktCalCurrentView = 'days';
          renderMarketingCalendar();
        } else {
          dropdown.classList.add('hidden');
          if (wrapper) wrapper.classList.remove('open');
          mktCalCurrentView = 'days';
        }
      });

      document.addEventListener('click', (e) => {
        if (wrapper && !wrapper.contains(e.target)) {
          dropdown.classList.add('hidden');
          wrapper.classList.remove('open');
          mktSelectingStart = null;
          mktCalCurrentView = 'days';
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mktCalCurrentView === 'years') {
          mktCalViewYear -= 9;
        } else if (mktCalCurrentView === 'months') {
          mktCalViewYear--;
        } else {
          mktCalViewMonth--;
          if (mktCalViewMonth < 0) {
            mktCalViewMonth = 11;
            mktCalViewYear--;
          }
        }
        renderMarketingCalendar();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mktCalCurrentView === 'years') {
          mktCalViewYear += 9;
        } else if (mktCalCurrentView === 'months') {
          mktCalViewYear++;
        } else {
          mktCalViewMonth++;
          if (mktCalViewMonth > 11) {
            mktCalViewMonth = 0;
            mktCalViewYear++;
          }
        }
        renderMarketingCalendar();
      });
    }

    // Botões de Ação Rápida
    const quickBtns = document.querySelectorAll('.mkt-cal-quick-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const type = btn.dataset.range;
        const now = new Date();

        if (type === 'this_month') {
          mktFilterStartDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          mktFilterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (type === 'this_year') {
          mktFilterStartDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          mktFilterEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (type === 'all_time') {
          mktFilterStartDate = new Date(2020, 0, 1, 0, 0, 0, 0);
          mktFilterEndDate = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999);
        }

        mktSelectingStart = null;
        mktCalViewYear = mktFilterStartDate.getFullYear();
        mktCalViewMonth = mktFilterStartDate.getMonth();

        updateMarketingDateRangeDisplay();
        renderMarketingCalendar();

        if (dropdown) dropdown.classList.add('hidden');
        if (wrapper) wrapper.classList.remove('open');

        await loadMarketingDashboardData();
      });
    });
  }

  // Helper para buscar todos os registros superando o limite padrão de 1000 linhas do PostgREST/Supabase
  async function fetchAllCrmRows(tableName, selectCols, startISO, endISO) {
    if (!supabase) return [];
    const PAGE_SIZE = 1000;
    let from = 0;
    let allRows = [];
    while (true) {
      let query = supabase
        .from(tableName)
        .select(selectCols)
        .order('criado_em', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (startISO) query = query.gte('criado_em', startISO);
      if (endISO) query = query.lte('criado_em', endISO);

      const { data, error } = await query;
      if (error) {
        console.warn(`Erro ao carregar linhas da tabela ${tableName}:`, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return allRows;
  }

  // Helper para obter dados da tabela 'financeiro' (Supabase com fallback no localStorage)
  async function fetchFinanceiroRecords() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('financeiro')
          .select('*')
          .order('data', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data;
        } else if (error) {
          console.warn('Aviso ao consultar Supabase financeiro em Marketing:', error);
        }
      } catch (err) {
        console.error('Erro na conexão Supabase financeiro em Marketing:', err);
      }
    }

    try {
      const rawRec = localStorage.getItem('resolveprev_fin_receitas');
      const rawDesp = localStorage.getItem('resolveprev_fin_despesas');
      const recs = rawRec ? JSON.parse(rawRec).map(r => ({ ...r, tipo: 'receita' })) : [];
      const desps = rawDesp ? JSON.parse(rawDesp).map(d => ({ ...d, tipo: 'despesa' })) : [];
      return [...recs, ...desps];
    } catch (e) {
      return [];
    }
  }

  // 3. Buscar Registros de Todas as 3 Tabelas no Período Selecionado
  async function loadMarketingDashboardData() {
    if (!supabase) return;

    const statInvestEl = document.getElementById('statMktInvestimento');
    const statLeadsEl = document.getElementById('statMktLeads');
    const statCplEl = document.getElementById('statMktCPL');
    const statQualEl = document.getElementById('statMktQualificados');
    const statMqlEl = document.getElementById('statMktMQL');

    try {
      const startISO = mktFilterStartDate.toISOString();
      const endISO = mktFilterEndDate.toISOString();

      const startDayISO = formatISODate(mktFilterStartDate);
      const endDayISO = formatISODate(mktFilterEndDate);

      // Consultar a tabela unificada crm no período baseado em criado_em e a planilha financeiro
      const [allRows, rowsFinanceiro] = await Promise.all([
        fetchAllCrmRows('crm', 'id, status, criado_em', startISO, endISO),
        fetchFinanceiroRecords()
      ]);

      // Total de Leads = todas as linhas da tabela crm no período
      const totalLeads = allRows.length;

      // Qualificados = todas as linhas das 3 tabelas, exceto status 'planejamento' e 'desqualificado'
      const totalQualificados = allRows.filter(r => {
        const s = (r.status || '').toLowerCase().trim();
        return s !== 'desqualificado' && s !== 'planejamento';
      }).length;

      // 1. Investimento: soma dos valores da planilha 'financeiro' cuja categoria for 'Tráfego' e a data estiver dentro do intervalo
      const rowsTrafego = rowsFinanceiro.filter(item => {
        const cat = (item.categoria || '').trim().toLowerCase();
        if (cat !== 'tráfego' && cat !== 'trafego') return false;
        if (!item.data) return false;
        const itemDateISO = item.data.includes('T') ? item.data.split('T')[0] : item.data;
        return itemDateISO >= startDayISO && itemDateISO <= endDayISO;
      });

      const totalInvestimento = rowsTrafego.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);

      if (statInvestEl) {
        statInvestEl.textContent = totalInvestimento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }

      // 2. Leads: valor inteiro
      if (statLeadsEl) statLeadsEl.textContent = totalLeads.toLocaleString('pt-BR');

      // 3. CPL = Investimento / Leads
      if (statCplEl) {
        if (totalLeads > 0) {
          const cpl = totalInvestimento / totalLeads;
          statCplEl.textContent = cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else {
          statCplEl.textContent = (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
      }

      // 4. Qualificados: valor inteiro
      if (statQualEl) statQualEl.textContent = totalQualificados.toLocaleString('pt-BR');

      // 5. MQL = (Qualificados / Leads) * 100
      if (statMqlEl) {
        if (totalLeads > 0) {
          const mqlPercent = (totalQualificados / totalLeads) * 100;
          statMqlEl.textContent = `${mqlPercent.toFixed(1).replace('.', ',')}%`;
        } else {
          statMqlEl.textContent = '0%';
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de marketing:', err);
    }
  }

  // 4. Gráfico Histórico de Evolução de Marketing (12 meses, não obedece ao filtro de período)
  let mktAvailableYears = [];
  let mktSelectedYear = new Date().getFullYear();
  let mktSelectedMetric = 'leads';

  async function populateMarketingYearSelector() {
    const yearSelect = document.getElementById('mktChartYearSelect');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const yearsSet = new Set([currentYear, currentYear - 1]);

    // Buscar anos presentes em criado_em da tabela unificada crm
    try {
      const { data: rows } = await supabase
        .from('crm')
        .select('criado_em')
        .order('criado_em', { ascending: true })
        .limit(1);

      if (rows && rows[0] && rows[0].criado_em) {
        const y = new Date(rows[0].criado_em).getFullYear();
        if (!isNaN(y) && y > 2000) yearsSet.add(y);
      }
    } catch (e) {
      // fallback gracioso
    }

    mktAvailableYears = Array.from(yearsSet).sort((a, b) => b - a);

    yearSelect.innerHTML = '';
    mktAvailableYears.forEach(year => {
      const opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      if (year === mktSelectedYear) opt.selected = true;
      yearSelect.appendChild(opt);
    });

    yearSelect.addEventListener('change', async () => {
      mktSelectedYear = parseInt(yearSelect.value, 10);
      await loadMarketingEvolucaoChart();
    });

    const metricSelect = document.getElementById('mktChartMetricSelect');
    if (metricSelect) {
      metricSelect.addEventListener('change', async () => {
        mktSelectedMetric = metricSelect.value;
        await loadMarketingEvolucaoChart();
      });
    }
  }

  async function loadMarketingEvolucaoChart() {
    const canvas = document.getElementById('marketingEvolucaoChart');
    const loadingOverlay = document.getElementById('mktChartLoadingState');
    const chartTitleEl = document.getElementById('mktChartTitle');
    if (!canvas || !supabase) return;

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    try {
      const year = mktSelectedYear;
      const startYearISO = new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
      const endYearISO = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

      // Consultar registros de todo o ano selecionado na tabela unificada crm com paginação completa e financeiro
      const [allYearRows, rowsFinanceiro] = await Promise.all([
        fetchAllCrmRows('crm', 'status, criado_em', startYearISO, endYearISO),
        fetchFinanceiroRecords()
      ]);

      // Inicializar agregadores dos 12 meses (0 = Janeiro a 11 = Dezembro)
      const monthlyLeads = new Array(12).fill(0);
      const monthlyQualificados = new Array(12).fill(0);
      const monthlyInvestimento = new Array(12).fill(0);

      allYearRows.forEach(row => {
        if (!row.criado_em) return;
        const d = new Date(row.criado_em);
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          monthlyLeads[m]++;
          const s = (row.status || '').toLowerCase().trim();
          if (s !== 'desqualificado' && s !== 'planejamento') {
            monthlyQualificados[m]++;
          }
        }
      });

      // Calcular investimento mensal em Tráfego
      rowsFinanceiro.forEach(item => {
        const cat = (item.categoria || '').trim().toLowerCase();
        if (cat !== 'tráfego' && cat !== 'trafego') return;
        if (!item.data) return;
        const itemDate = new Date(item.data.includes('T') ? item.data : `${item.data}T00:00:00`);
        if (!isNaN(itemDate.getTime()) && itemDate.getFullYear() === year) {
          const m = itemDate.getMonth();
          if (m >= 0 && m < 12) {
            monthlyInvestimento[m] += parseFloat(item.valor) || 0;
          }
        }
      });

      const monthNamesPt = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const monthNamesShortPt = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];

      // Determinar valores, labels e formatação conforme a métrica
      let chartData = [];
      let yUnitPrefix = '';
      let yUnitSuffix = '';
      let chartColor = '#0a0a0a';
      let metricName = 'Leads';

      switch (mktSelectedMetric) {
        case 'leads':
          chartData = monthlyLeads;
          yUnitPrefix = '';
          yUnitSuffix = '';
          chartColor = '#0a0a0a';
          metricName = 'Leads';
          break;
        case 'investimento':
          chartData = monthlyInvestimento;
          yUnitPrefix = 'R$ ';
          yUnitSuffix = '';
          chartColor = '#D97706';
          metricName = 'Investimento';
          break;
        case 'cpl':
          chartData = monthlyLeads.map((leads, idx) => {
            if (leads === 0) return 0;
            return parseFloat((monthlyInvestimento[idx] / leads).toFixed(2));
          });
          yUnitPrefix = 'R$ ';
          yUnitSuffix = '';
          chartColor = '#7C3AED';
          metricName = 'CPL';
          break;
        case 'qualificados':
          chartData = monthlyQualificados;
          yUnitPrefix = '';
          yUnitSuffix = '';
          chartColor = '#16A34A';
          metricName = 'Qualificados';
          break;
        case 'mql':
          chartData = monthlyLeads.map((leads, idx) => {
            if (leads === 0) return 0;
            return parseFloat(((monthlyQualificados[idx] / leads) * 100).toFixed(1));
          });
          yUnitPrefix = '';
          yUnitSuffix = '%';
          chartColor = '#0F766E';
          metricName = 'MQL (%)';
          break;
      }

      if (chartTitleEl) {
        chartTitleEl.textContent = `Evolução Mensal: ${metricName} (${year})`;
      }

      // Renderizar ou atualizar gráfico Chart.js
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js ainda não carregado.');
        return;
      }

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 320);
      gradient.addColorStop(0, hexToRgba(chartColor, 0.25));
      gradient.addColorStop(0.7, hexToRgba(chartColor, 0.04));
      gradient.addColorStop(1, hexToRgba(chartColor, 0));

      if (marketingEvolucaoChartInstance) {
        marketingEvolucaoChartInstance.destroy();
      }

      marketingEvolucaoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthNamesShortPt,
          datasets: [{
            label: metricName,
            data: chartData,
            fill: true,
            backgroundColor: gradient,
            borderColor: chartColor,
            borderWidth: 2.5,
            pointBackgroundColor: chartColor,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: chartColor,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 3,
            tension: 0.35
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              titleFont: {
                family: 'Inter, sans-serif',
                size: 13,
                weight: '700'
              },
              bodyFont: {
                family: 'Inter, sans-serif',
                size: 12,
                weight: '500'
              },
              padding: { top: 10, right: 14, bottom: 10, left: 14 },
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: function (items) {
                  const idx = items[0].dataIndex;
                  return `${monthNamesPt[idx]} de ${year}`;
                },
                label: function (item) {
                  const val = item.raw;
                  if (mktSelectedMetric === 'investimento' || mktSelectedMetric === 'cpl') {
                    return `${metricName}: R$ XX`;
                  }
                  if (mktSelectedMetric === 'mql') {
                    return `${metricName}: ${val.toFixed(1).replace('.', ',')}%`;
                  }
                  return `${metricName}: ${val.toLocaleString('pt-BR')}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'Inter, sans-serif',
                  size: 11,
                  weight: '600'
                },
                color: '#64748B'
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  family: 'Inter, sans-serif',
                  size: 11,
                  weight: '500'
                },
                color: '#94A3B8',
                callback: function (val) {
                  if (mktSelectedMetric === 'investimento' || mktSelectedMetric === 'cpl') {
                    return `${yUnitPrefix}${val}`;
                  }
                  if (mktSelectedMetric === 'mql') {
                    return `${val}${yUnitSuffix}`;
                  }
                  return Number.isInteger(val) ? val.toLocaleString('pt-BR') : '';
                }
              },
              grid: {
                color: '#F1F5F9',
                borderDash: [4, 4]
              },
              border: {
                display: false
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Erro ao renderizar gráfico de evolução de marketing:', err);
    } finally {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
  }

  // Utilitário simples para cor RGBA
  function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Inicializar Datepicker e Seletores de Marketing ao carregar
  updateMarketingDateRangeDisplay();
  renderMarketingCalendar();
  setupMarketingDatePickerEvents();
  populateMarketingYearSelector();

  /* ==========================================================================
     MÓDULO COMERCIAL - DASHBOARD ADMIN (FUNIL DE PERFORMANCE)
     ========================================================================== */

  // Estado do Filtro de Período Comercial (Idêntico ao de Marketing)
  const nowCom = new Date();
  let comFilterStartDate = new Date(nowCom.getFullYear(), nowCom.getMonth(), 1);
  let comFilterEndDate = new Date(nowCom.getFullYear(), nowCom.getMonth() + 1, 0, 23, 59, 59, 999);

  let comCalViewYear = nowCom.getFullYear();
  let comCalViewMonth = nowCom.getMonth(); // 0-11
  let comSelectingStart = null;
  let comCalCurrentView = 'days'; // 'days' | 'months' | 'years'

  function updateCommercialDateRangeDisplay() {
    const displayEl = document.getElementById('comDateRangeDisplay');
    if (displayEl) {
      displayEl.textContent = `${formatShortDate(comFilterStartDate)} até ${formatShortDate(comFilterEndDate)}`;
    }
  }

  function renderCommercialCalendar() {
    const monthLabelEl = document.getElementById('comCalMonthLabel');
    const yearLabelEl = document.getElementById('comCalYearLabel');
    const monthBtn = document.getElementById('comCalMonthBtn');
    const yearBtn = document.getElementById('comCalYearBtn');
    const daysView = document.getElementById('comCalDaysView');
    const monthsView = document.getElementById('comCalMonthsView');
    const yearsView = document.getElementById('comCalYearsView');
    const gridEl = document.getElementById('comCalendarGrid');

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthShortNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    if (monthLabelEl) monthLabelEl.textContent = monthNames[comCalViewMonth];
    if (yearLabelEl) yearLabelEl.textContent = comCalViewYear;

    if (monthBtn) monthBtn.classList.toggle('active', comCalCurrentView === 'months');
    if (yearBtn) yearBtn.classList.toggle('active', comCalCurrentView === 'years');

    if (daysView) daysView.classList.toggle('hidden', comCalCurrentView !== 'days');
    if (monthsView) monthsView.classList.toggle('hidden', comCalCurrentView !== 'months');
    if (yearsView) yearsView.classList.toggle('hidden', comCalCurrentView !== 'years');

    // Visão de Meses
    if (comCalCurrentView === 'months' && monthsView) {
      monthsView.innerHTML = '';
      monthShortNames.forEach((shortName, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'mkt-cal-picker-item';
        if (idx === comCalViewMonth) item.classList.add('active');
        item.textContent = shortName;
        item.title = monthNames[idx];
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          comCalViewMonth = idx;
          comCalCurrentView = 'days';
          renderCommercialCalendar();
        });
        monthsView.appendChild(item);
      });
      return;
    }

    // Visão de Anos
    if (comCalCurrentView === 'years' && yearsView) {
      yearsView.innerHTML = '';
      const currentYear = new Date().getFullYear();
      const startYear = Math.min(2020, comCalViewYear - 4);
      const endYear = Math.max(currentYear + 2, comCalViewYear + 4);

      for (let y = startYear; y <= endYear; y++) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'mkt-cal-picker-item';
        if (y === comCalViewYear) item.classList.add('active');
        item.textContent = y;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          comCalViewYear = y;
          comCalCurrentView = 'days';
          renderCommercialCalendar();
        });
        yearsView.appendChild(item);
      }
      return;
    }

    // Visão de Dias
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const firstDayDate = new Date(comCalViewYear, comCalViewMonth, 1);
    let startDayIndex = firstDayDate.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    const daysInMonth = new Date(comCalViewYear, comCalViewMonth + 1, 0).getDate();

    for (let i = 0; i < startDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'mkt-cal-day empty';
      gridEl.appendChild(emptyCell);
    }

    const startISO = formatISODate(comFilterStartDate);
    const endISO = formatISODate(comFilterEndDate);
    const selStartISO = comSelectingStart ? formatISODate(comSelectingStart) : null;

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(comCalViewYear, comCalViewMonth, d);
      const cellISO = formatISODate(cellDate);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mkt-cal-day';
      btn.textContent = d;
      btn.dataset.date = cellISO;

      if (!comSelectingStart) {
        const isStart = cellISO === startISO;
        const isEnd = cellISO === endISO;
        const inRange = cellISO >= startISO && cellISO <= endISO;

        if (inRange) btn.classList.add('in-range');
        if (isStart) btn.classList.add('range-start');
        if (isEnd) btn.classList.add('range-end');
      } else {
        if (cellISO === selStartISO) {
          btn.classList.add('range-start', 'range-end');
        }
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCommercialCalendarDayClick(cellDate);
      });

      gridEl.appendChild(btn);
    }
  }

  async function handleCommercialCalendarDayClick(date) {
    if (!comSelectingStart) {
      comSelectingStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      renderCommercialCalendar();
    } else {
      let d1 = comSelectingStart;
      let d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (d1 > d2) {
        const tmp = d1;
        d1 = d2;
        d2 = tmp;
      }

      comFilterStartDate = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 0, 0, 0, 0);
      comFilterEndDate = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 23, 59, 59, 999);
      comSelectingStart = null;
      comCalCurrentView = 'days';

      updateCommercialDateRangeDisplay();
      renderCommercialCalendar();

      const dropdown = document.getElementById('comDatePickerDropdown');
      const wrapper = document.getElementById('comDatePickerWrapper');
      if (dropdown) dropdown.classList.add('hidden');
      if (wrapper) wrapper.classList.remove('open');

      await loadCommercialDashboardData();
    }
  }

  function setupCommercialDatePickerEvents() {
    const trigger = document.getElementById('comDatePickerTrigger');
    const dropdown = document.getElementById('comDatePickerDropdown');
    const wrapper = document.getElementById('comDatePickerWrapper');
    const btnPrev = document.getElementById('comCalPrevMonth');
    const btnNext = document.getElementById('comCalNextMonth');
    const monthBtn = document.getElementById('comCalMonthBtn');
    const yearBtn = document.getElementById('comCalYearBtn');

    if (monthBtn) {
      monthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        comCalCurrentView = (comCalCurrentView === 'months') ? 'days' : 'months';
        renderCommercialCalendar();
      });
    }

    if (yearBtn) {
      yearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        comCalCurrentView = (comCalCurrentView === 'years') ? 'days' : 'years';
        renderCommercialCalendar();
      });
    }

    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
          dropdown.classList.remove('hidden');
          if (wrapper) wrapper.classList.add('open');
          comCalViewYear = comFilterStartDate.getFullYear();
          comCalViewMonth = comFilterStartDate.getMonth();
          comSelectingStart = null;
          comCalCurrentView = 'days';
          renderCommercialCalendar();
        } else {
          dropdown.classList.add('hidden');
          if (wrapper) wrapper.classList.remove('open');
          comCalCurrentView = 'days';
        }
      });

      document.addEventListener('click', (e) => {
        if (wrapper && !wrapper.contains(e.target)) {
          dropdown.classList.add('hidden');
          wrapper.classList.remove('open');
          comSelectingStart = null;
          comCalCurrentView = 'days';
        }
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (comCalCurrentView === 'years') {
          comCalViewYear -= 9;
        } else if (comCalCurrentView === 'months') {
          comCalViewYear--;
        } else {
          comCalViewMonth--;
          if (comCalViewMonth < 0) {
            comCalViewMonth = 11;
            comCalViewYear--;
          }
        }
        renderCommercialCalendar();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (comCalCurrentView === 'years') {
          comCalViewYear += 9;
        } else if (comCalCurrentView === 'months') {
          comCalViewYear++;
        } else {
          comCalViewMonth++;
          if (comCalViewMonth > 11) {
            comCalViewMonth = 0;
            comCalViewYear++;
          }
        }
        renderCommercialCalendar();
      });
    }

    const quickBtns = document.querySelectorAll('.com-cal-quick-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const type = btn.dataset.range;
        const now = new Date();

        if (type === 'this_month') {
          comFilterStartDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          comFilterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (type === 'this_year') {
          comFilterStartDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          comFilterEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (type === 'all_time') {
          comFilterStartDate = new Date(2020, 0, 1, 0, 0, 0, 0);
          comFilterEndDate = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999);
        }

        comSelectingStart = null;
        comCalViewYear = comFilterStartDate.getFullYear();
        comCalViewMonth = comFilterStartDate.getMonth();
        comCalCurrentView = 'days';

        updateCommercialDateRangeDisplay();
        renderCommercialCalendar();

        if (dropdown) dropdown.classList.add('hidden');
        if (wrapper) wrapper.classList.remove('open');

        await loadCommercialDashboardData();
      });
    });
  }

  // Carregar e calcular métricas do Funil de Performance Comercial
  async function loadCommercialDashboardData() {
    if (!supabase) return;

    const loadingOverlay = document.getElementById('comFunnelLoadingState');
    const totalLeadsBadge = document.getElementById('comFunnelLeadsCount');

    const fillCAR = document.getElementById('funnelFillCAR');
    const valCAR = document.getElementById('funnelValCAR');
    const ratioCAR = document.getElementById('funnelRatioCAR');

    const fillCR = document.getElementById('funnelFillCR');
    const valCR = document.getElementById('funnelValCR');
    const ratioCR = document.getElementById('funnelRatioCR');

    const fillMBR = document.getElementById('funnelFillMBR');
    const valMBR = document.getElementById('funnelValMBR');
    const ratioMBR = document.getElementById('funnelRatioMBR');

    const fillSR = document.getElementById('funnelFillSR');
    const valSR = document.getElementById('funnelValSR');
    const ratioSR = document.getElementById('funnelRatioSR');

    const fillCLR = document.getElementById('funnelFillCLR');
    const valCLR = document.getElementById('funnelValCLR');
    const ratioCLR = document.getElementById('funnelRatioCLR');

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    try {
      const startISO = comFilterStartDate.toISOString();
      const endISO = comFilterEndDate.toISOString();

      // Buscar registros da tabela unificada crm no período selecionado (baseado estritamente em criado_em)
      const rawRows = await fetchAllCrmRows('crm', 'id, status, criado_em', startISO, endISO);

      // Regra obrigatória: 'desqualificado' e 'planejamento' devem ser totalmente desconsiderados de qualquer cálculo
      const validRows = rawRows.filter(r => {
        const s = (r.status || '').toLowerCase().trim();
        return s !== 'desqualificado' && s !== 'planejamento';
      });

      // Total de leads válidos no período
      const totalLeads = validRows.length;
      if (totalLeadsBadge) totalLeadsBadge.textContent = totalLeads.toLocaleString('pt-BR');

      // Helper para checar status
      const getStatus = (r) => (r.status || '').toLowerCase().trim();

      // 1. CAR (Contact Attempt Rate):
      // Numerador: leads com qualquer status diferente de "novo"
      // Denominador: total de leads
      const leadsNotNovo = validRows.filter(r => getStatus(r) !== 'novo');
      const numCAR = leadsNotNovo.length;
      const denCAR = totalLeads;
      const pctCAR = denCAR > 0 ? (numCAR / denCAR) * 100 : 0;

      // 2. CR (Contact Rate):
      // Numerador: leads com status diferente de "novo" e "qualificacao"
      // Denominador: leads com status diferente de "novo" (leadsNotNovo)
      const leadsEffectiveContact = validRows.filter(r => {
        const s = getStatus(r);
        return s !== 'novo' && s !== 'qualificacao';
      });
      const numCR = leadsEffectiveContact.length;
      const denCR = numCAR;
      const pctCR = denCR > 0 ? (numCR / denCR) * 100 : 0;

      // 3. MBR (Meeting Booking Rate):
      // Numerador: leads com status diferente de "novo", "qualificacao", "acompanhamento" e "recuperacao"
      // Denominador: leads com status diferente de "novo" e "qualificacao" (leadsEffectiveContact)
      const excludeMBR = ['novo', 'qualificacao', 'acompanhamento', 'recuperacao'];
      const leadsBookedMeeting = validRows.filter(r => !excludeMBR.includes(getStatus(r)));
      const numMBR = leadsBookedMeeting.length;
      const denMBR = numCR;
      const pctMBR = denMBR > 0 ? (numMBR / denMBR) * 100 : 0;

      // 4. SR (Show Rate):
      // Numerador: ((leads com status diferente de "novo", "qualificacao", "acompanhamento" e "recuperacao") - leads com status "no_show")
      // Denominador: leads com status diferente de "novo", "qualificacao", "acompanhamento" e "recuperacao" (leadsBookedMeeting)
      const leadsNoShow = validRows.filter(r => getStatus(r) === 'no_show');
      const numNoShow = leadsNoShow.length;
      const denSR = numMBR; // leads com status diferente de "novo", "qualificacao", "acompanhamento" e "recuperacao"
      const numSR = Math.max(0, denSR - numNoShow);
      const pctSR = denSR > 0 ? (numSR / denSR) * 100 : 0;

      // 5. CLR (Close Rate):
      // Numerador: total de registros com status de Operação (documentacao, na_fila, requerido, exigencia, concedido)
      // Denominador: total de SR (leads que compareceram: numSR)
      const operacaoStatuses = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
      const validOperacaoRows = validRows.filter(r => operacaoStatuses.includes(getStatus(r)));
      const numCLR = validOperacaoRows.length;
      const denCLR = numSR; // Total de comparecimentos (SR)
      const pctCLR = denCLR > 0 ? (numCLR / denCLR) * 100 : 0;

      // Formatação e Renderização no DOM
      const formatPct = (val) => `${val.toFixed(1).replace('.', ',')}%`;

      if (valCAR) valCAR.textContent = formatPct(pctCAR);
      if (ratioCAR) ratioCAR.textContent = `${numCAR.toLocaleString('pt-BR')} / ${denCAR.toLocaleString('pt-BR')}`;
      if (fillCAR) fillCAR.style.width = `${Math.min(100, Math.max(0, pctCAR))}%`;

      if (valCR) valCR.textContent = formatPct(pctCR);
      if (ratioCR) ratioCR.textContent = `${numCR.toLocaleString('pt-BR')} / ${denCR.toLocaleString('pt-BR')}`;
      if (fillCR) fillCR.style.width = `${Math.min(100, Math.max(0, pctCR))}%`;

      if (valMBR) valMBR.textContent = formatPct(pctMBR);
      if (ratioMBR) ratioMBR.textContent = `${numMBR.toLocaleString('pt-BR')} / ${denMBR.toLocaleString('pt-BR')}`;
      if (fillMBR) fillMBR.style.width = `${Math.min(100, Math.max(0, pctMBR))}%`;

      if (valSR) valSR.textContent = formatPct(pctSR);
      if (ratioSR) ratioSR.textContent = `${numSR.toLocaleString('pt-BR')} / ${denSR.toLocaleString('pt-BR')}`;
      if (fillSR) fillSR.style.width = `${Math.min(100, Math.max(0, pctSR))}%`;

      if (valCLR) valCLR.textContent = formatPct(pctCLR);
      if (ratioCLR) ratioCLR.textContent = `${numCLR.toLocaleString('pt-BR')} / ${denCLR.toLocaleString('pt-BR')}`;
      if (fillCLR) fillCLR.style.width = `${Math.min(100, Math.max(0, pctCLR))}%`;

    } catch (err) {
      console.error('Erro ao carregar dados do funil comercial:', err);
    } finally {
      if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
  }

  // Inicializar Datepicker e Funil Comercial ao carregar
  updateCommercialDateRangeDisplay();
  renderCommercialCalendar();
  setupCommercialDatePickerEvents();

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

  function getRoleBadgeText(role, userId) {
    if (userId === ADMIN_USER_ID || role === 'admin') return '★ Administrador';
    if (role === 'supervisor_comercial') return '● Supervisor Comercial';
    if (role === 'operador_juridico' || role === 'advogado') return '● Operador Jurídico';
    if (role === 'supervisor_juridico') return '● Supervisor Jurídico';
    return '● Operador Comercial';
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
      const role = u.role || (u.id === ADMIN_USER_ID ? 'admin' : 'operador_comercial');
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
            <span class="status-pill ${role === 'admin' || u.id === ADMIN_USER_ID ? 'status-admin' : 'status-user'}">
              ${getRoleBadgeText(role, u.id)}
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
  window.switchAdminTab = function (tabName) {
    if (tabName === 'users') {
      const usersNavBtn = document.querySelector('[data-admin-tab="users"]');
      if (usersNavBtn) usersNavBtn.click();
    } else if (tabName === 'crm') {
      if (switchToCrmBtn) switchToCrmBtn.click();
    }
  };

  window.openEditUserModal = function (userId) {
    const user = cachedUsersList.find(u => u.id === userId);
    if (!user) return;
    document.getElementById('adminEditUserId').value = user.id;
    document.getElementById('adminEditName').value = user.full_name || user.nome || user.name || '';
    document.getElementById('adminEditEmail').value = user.email || '';
    document.getElementById('adminEditPassword').value = '';
    let roleVal = user.role || 'operador_comercial';
    if (roleVal === 'usuario') roleVal = 'operador_comercial';
    if (roleVal === 'advogado') roleVal = 'operador_juridico';
    document.getElementById('adminEditRole').value = roleVal;

    document.getElementById('modalAdminEditUser').classList.remove('hidden');
  };

  window.openDeleteUserModal = function (userId) {
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
      const role = roleInput ? roleInput.value : 'operador_comercial';
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

  /* ==========================================================================
     MÓDULO FINANCEIRO (RECEITAS, DESPESAS E INDICADORES - SUPABASE)
     ========================================================================== */
  function initFinancialModule() {
    const STORAGE_KEY_RECEITAS = 'resolveprev_fin_receitas';
    const STORAGE_KEY_DESPESAS = 'resolveprev_fin_despesas';

    // Elementos de Indicadores
    const finStatReceitasTotal = document.getElementById('finStatReceitasTotal');
    const finStatDespesasTotal = document.getElementById('finStatDespesasTotal');
    const finStatLucroLiquido = document.getElementById('finStatLucroLiquido');
    const finStatMargemLiquida = document.getElementById('finStatMargemLiquida');

    // Tabelas
    const finReceitasTableBody = document.getElementById('finReceitasTableBody');
    const finDespesasTableBody = document.getElementById('finDespesasTableBody');

    // Botões de Abertura de Modal
    const btnNovaReceita = document.getElementById('btnNovaReceita');
    const btnNovaDespesa = document.getElementById('btnNovaDespesa');

    // Modais
    const modalAddReceita = document.getElementById('modalAddReceita');
    const modalAddDespesa = document.getElementById('modalAddDespesa');
    const closeAddReceitaModal = document.getElementById('closeAddReceitaModal');
    const closeAddDespesaModal = document.getElementById('closeAddDespesaModal');

    // Formulários
    const addReceitaForm = document.getElementById('addReceitaForm');
    const addDespesaForm = document.getElementById('addDespesaForm');
    const recValorInput = document.getElementById('recValor');
    const despValorInput = document.getElementById('despValor');
    const recDataInput = document.getElementById('recData');
    const despDataInput = document.getElementById('despData');
    const submitReceitaBtn = document.getElementById('submitReceitaBtn');
    const submitDespesaBtn = document.getElementById('submitDespesaBtn');

    // Formatador de Moeda para Inputs
    function setupCurrencyInput(input) {
      if (!input) return;
      input.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val) {
          e.target.value = '';
          return;
        }
        val = (parseInt(val, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        e.target.value = val;
      });
    }

    setupCurrencyInput(recValorInput);
    setupCurrencyInput(despValorInput);

    function parseCurrencyValue(str) {
      if (!str) return 0;
      const cleaned = str.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    function formatBRL(num) {
      return (num || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDateBR(dateStr) {
      if (!dateStr) return '--';
      // Tratar caso venha formato ISO ou YYYY-MM-DD
      const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const anoCurto = parts[0].slice(-2);
        return `${parts[2]}/${parts[1]}/${anoCurto}`;
      }
      return dateStr;
    }

    // Cache local de itens
    let financialItems = [];

    // Estado do Filtro de Data do Financeiro (Padrão: Este Mês)
    const nowFin = new Date();
    let finFilterStartDate = new Date(nowFin.getFullYear(), nowFin.getMonth(), 1, 0, 0, 0, 0);
    let finFilterEndDate = new Date(nowFin.getFullYear(), nowFin.getMonth() + 1, 0, 23, 59, 59, 999);
    let finCalViewYear = nowFin.getFullYear();
    let finCalViewMonth = nowFin.getMonth();
    let finSelectingStart = null;
    let finCalCurrentView = 'days'; // 'days' | 'months' | 'years'

    function updateFinancialDateRangeDisplay() {
      const displayEl = document.getElementById('finDateRangeDisplay');
      if (displayEl) {
        displayEl.textContent = `${formatShortDate(finFilterStartDate)} até ${formatShortDate(finFilterEndDate)}`;
      }
    }

    function renderFinancialCalendar() {
      const monthLabelEl = document.getElementById('finCalMonthLabel');
      const yearLabelEl = document.getElementById('finCalYearLabel');
      const monthBtn = document.getElementById('finCalMonthBtn');
      const yearBtn = document.getElementById('finCalYearBtn');
      const daysView = document.getElementById('finCalDaysView');
      const monthsView = document.getElementById('finCalMonthsView');
      const yearsView = document.getElementById('finCalYearsView');
      const gridEl = document.getElementById('finCalendarGrid');

      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const monthShortNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];

      if (monthLabelEl) monthLabelEl.textContent = monthNames[finCalViewMonth];
      if (yearLabelEl) yearLabelEl.textContent = finCalViewYear;

      if (monthBtn) monthBtn.classList.toggle('active', finCalCurrentView === 'months');
      if (yearBtn) yearBtn.classList.toggle('active', finCalCurrentView === 'years');

      if (daysView) daysView.classList.toggle('hidden', finCalCurrentView !== 'days');
      if (monthsView) monthsView.classList.toggle('hidden', finCalCurrentView !== 'months');
      if (yearsView) yearsView.classList.toggle('hidden', finCalCurrentView !== 'years');

      // Visão de Meses
      if (finCalCurrentView === 'months' && monthsView) {
        monthsView.innerHTML = '';
        monthShortNames.forEach((shortName, idx) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'mkt-cal-picker-item';
          if (idx === finCalViewMonth) item.classList.add('active');
          item.textContent = shortName;
          item.title = monthNames[idx];
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            finCalViewMonth = idx;
            finCalCurrentView = 'days';
            renderFinancialCalendar();
          });
          monthsView.appendChild(item);
        });
        return;
      }

      // Visão de Anos
      if (finCalCurrentView === 'years' && yearsView) {
        yearsView.innerHTML = '';
        const currentYear = new Date().getFullYear();
        const startYear = Math.min(2020, finCalViewYear - 4);
        const endYear = Math.max(currentYear + 2, finCalViewYear + 4);

        for (let y = startYear; y <= endYear; y++) {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'mkt-cal-picker-item';
          if (y === finCalViewYear) item.classList.add('active');
          item.textContent = y;
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            finCalViewYear = y;
            finCalCurrentView = 'days';
            renderFinancialCalendar();
          });
          yearsView.appendChild(item);
        }
        return;
      }

      // Visão de Dias
      if (!gridEl) return;
      gridEl.innerHTML = '';

      const firstDayDate = new Date(finCalViewYear, finCalViewMonth, 1);
      let startDayIndex = firstDayDate.getDay() - 1;
      if (startDayIndex === -1) startDayIndex = 6;

      const daysInMonth = new Date(finCalViewYear, finCalViewMonth + 1, 0).getDate();

      for (let i = 0; i < startDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'mkt-cal-day empty';
        gridEl.appendChild(emptyCell);
      }

      const startISO = formatISODate(finFilterStartDate);
      const endISO = formatISODate(finFilterEndDate);
      const selStartISO = finSelectingStart ? formatISODate(finSelectingStart) : null;

      for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(finCalViewYear, finCalViewMonth, d);
        const cellISO = formatISODate(cellDate);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mkt-cal-day';
        btn.textContent = d;
        btn.dataset.date = cellISO;

        if (!finSelectingStart) {
          const isStart = cellISO === startISO;
          const isEnd = cellISO === endISO;
          const inRange = cellISO >= startISO && cellISO <= endISO;

          if (inRange) btn.classList.add('in-range');
          if (isStart) btn.classList.add('range-start');
          if (isEnd) btn.classList.add('range-end');
        } else {
          if (cellISO === selStartISO) {
            btn.classList.add('range-start', 'range-end');
          }
        }

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleFinancialCalendarDayClick(cellDate);
        });

        gridEl.appendChild(btn);
      }
    }

    async function handleFinancialCalendarDayClick(date) {
      if (!finSelectingStart) {
        finSelectingStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        renderFinancialCalendar();
      } else {
        let d1 = finSelectingStart;
        let d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (d1 > d2) {
          const tmp = d1;
          d1 = d2;
          d2 = tmp;
        }

        finFilterStartDate = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 0, 0, 0, 0);
        finFilterEndDate = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 23, 59, 59, 999);
        finSelectingStart = null;
        finCalCurrentView = 'days';

        updateFinancialDateRangeDisplay();
        renderFinancialCalendar();

        const dropdown = document.getElementById('finDatePickerDropdown');
        const wrapper = document.getElementById('finDatePickerWrapper');
        if (dropdown) dropdown.classList.add('hidden');
        if (wrapper) wrapper.classList.remove('open');

        await renderFinancialData(true);
      }
    }

    function setupFinancialDatePickerEvents() {
      const trigger = document.getElementById('finDatePickerTrigger');
      const dropdown = document.getElementById('finDatePickerDropdown');
      const wrapper = document.getElementById('finDatePickerWrapper');
      const btnPrev = document.getElementById('finCalPrevMonth');
      const btnNext = document.getElementById('finCalNextMonth');
      const monthBtn = document.getElementById('finCalMonthBtn');
      const yearBtn = document.getElementById('finCalYearBtn');

      if (monthBtn) {
        monthBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          finCalCurrentView = (finCalCurrentView === 'months') ? 'days' : 'months';
          renderFinancialCalendar();
        });
      }

      if (yearBtn) {
        yearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          finCalCurrentView = (finCalCurrentView === 'years') ? 'days' : 'years';
          renderFinancialCalendar();
        });
      }

      if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = dropdown.classList.contains('hidden');
          if (isHidden) {
            dropdown.classList.remove('hidden');
            if (wrapper) wrapper.classList.add('open');
            finCalViewYear = finFilterStartDate.getFullYear();
            finCalViewMonth = finFilterStartDate.getMonth();
            finSelectingStart = null;
            finCalCurrentView = 'days';
            renderFinancialCalendar();
          } else {
            dropdown.classList.add('hidden');
            if (wrapper) wrapper.classList.remove('open');
            finCalCurrentView = 'days';
          }
        });

        document.addEventListener('click', (e) => {
          if (wrapper && !wrapper.contains(e.target)) {
            dropdown.classList.add('hidden');
            wrapper.classList.remove('open');
            finSelectingStart = null;
            finCalCurrentView = 'days';
          }
        });
      }

      if (btnPrev) {
        btnPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          if (finCalCurrentView === 'years') {
            finCalViewYear -= 9;
          } else if (finCalCurrentView === 'months') {
            finCalViewYear--;
          } else {
            finCalViewMonth--;
            if (finCalViewMonth < 0) {
              finCalViewMonth = 11;
              finCalViewYear--;
            }
          }
          renderFinancialCalendar();
        });
      }

      if (btnNext) {
        btnNext.addEventListener('click', (e) => {
          e.stopPropagation();
          if (finCalCurrentView === 'years') {
            finCalViewYear += 9;
          } else if (finCalCurrentView === 'months') {
            finCalViewYear++;
          } else {
            finCalViewMonth++;
            if (finCalViewMonth > 11) {
              finCalViewMonth = 0;
              finCalViewYear++;
            }
          }
          renderFinancialCalendar();
        });
      }

      const quickBtns = document.querySelectorAll('.fin-cal-quick-btn');
      quickBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const type = btn.dataset.range;
          const now = new Date();

          if (type === 'this_month') {
            finFilterStartDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            finFilterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          } else if (type === 'this_year') {
            finFilterStartDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            finFilterEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          } else if (type === 'all_time') {
            finFilterStartDate = new Date(2020, 0, 1, 0, 0, 0, 0);
            finFilterEndDate = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999);
          }

          finSelectingStart = null;
          finCalCurrentView = 'days';
          finCalViewYear = finFilterStartDate.getFullYear();
          finCalViewMonth = finFilterStartDate.getMonth();

          updateFinancialDateRangeDisplay();
          renderFinancialCalendar();

          if (dropdown) dropdown.classList.add('hidden');
          if (wrapper) wrapper.classList.remove('open');

          await renderFinancialData(true);
        });
      });
    }

    // Buscar dados do Supabase (com fallback no localStorage)
    async function fetchFinancialRecords() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('financeiro')
            .select('*')
            .order('data', { ascending: false });

          if (!error && Array.isArray(data)) {
            financialItems = data;
            return financialItems;
          } else if (error) {
            console.warn('Aviso ao consultar Supabase financeiro:', error);
          }
        } catch (err) {
          console.error('Erro na conexão Supabase financeiro:', err);
        }
      }

      // Fallback para localStorage
      try {
        const rawRec = localStorage.getItem(STORAGE_KEY_RECEITAS);
        const rawDesp = localStorage.getItem(STORAGE_KEY_DESPESAS);
        const recs = rawRec ? JSON.parse(rawRec).map(r => ({ ...r, tipo: 'receita' })) : [];
        const desps = rawDesp ? JSON.parse(rawDesp).map(d => ({ ...d, tipo: 'despesa' })) : [];
        financialItems = [...recs, ...desps];
      } catch (e) {
        financialItems = [];
      }
      return financialItems;
    }

    // Ordem dos status para alternância cíclica
    const STATUS_CYCLE = ['Pendente', 'Pago', 'Atrasado'];

    function getNextStatus(currentStatus) {
      let st = currentStatus || 'Pendente';
      if (st === 'Recebido') st = 'Pago';
      if (st === 'A Pagar') st = 'Pendente';

      const idx = STATUS_CYCLE.indexOf(st);
      if (idx === -1 || idx === STATUS_CYCLE.length - 1) {
        return STATUS_CYCLE[0];
      }
      return STATUS_CYCLE[idx + 1];
    }

    // Helper para gerar o botão de status somente com ícone
    function renderStatusBadge(item) {
      let status = item.status || 'Pendente';

      // Normalização de nomes legados
      if (status === 'Recebido') status = 'Pago';
      if (status === 'A Pagar') status = 'Pendente';

      let iconClass = 'ti ti-clock';
      let badgeClass = 'fin-badge-pendente';
      let titleText = 'Pendente (Clique para alterar)';

      if (status === 'Pago') {
        iconClass = 'ti ti-check';
        badgeClass = 'fin-badge-pago';
        titleText = 'Pago (Clique para alterar)';
      } else if (status === 'Atrasado') {
        iconClass = 'ti ti-alert-triangle';
        badgeClass = 'fin-badge-atrasado';
        titleText = 'Atrasado (Clique para alterar)';
      }

      return `
        <button type="button" class="fin-badge-status ${badgeClass} btn-toggle-fin-status" data-id="${item.id}" title="${titleText}">
          <i class="${iconClass}"></i>
        </button>
      `;
    }

    // Renderizar Tabelas e Atualizar Indicadores
    async function renderFinancialData(skipFetch = false) {
      if (!skipFetch) {
        await fetchFinancialRecords();
      }

      // Observação: O status definido (Pendente, Pago ou Atrasado) é respeitado conforme registrado no banco/localStorage

      // Filtrar pelo período selecionado no calendário
      const startISO = formatISODate(finFilterStartDate);
      const endISO = formatISODate(finFilterEndDate);

      const filteredItems = financialItems.filter(item => {
        if (!item.data) return true;
        const itemISO = item.data.substring(0, 10);
        return itemISO >= startISO && itemISO <= endISO;
      });

      const receitas = filteredItems.filter(item => item.tipo === 'receita');
      const despesas = filteredItems.filter(item => item.tipo === 'despesa');

      // 1. Renderizar Tabela de Receitas
      if (finReceitasTableBody) {
        if (receitas.length === 0) {
          finReceitasTableBody.innerHTML = `
            <tr>
              <td colspan="6" class="fin-empty-cell">
                <div class="fin-empty-state">
                  <i class="ti ti-receipt-2 fin-empty-icon"></i>
                  <p class="fin-empty-text">Nenhuma receita registrada no período</p>
                  <span class="fin-empty-subtext">Clique em "Nova Receita" ou amplie o filtro de datas</span>
                </div>
              </td>
            </tr>
          `;
        } else {
          finReceitasTableBody.innerHTML = receitas.map(item => {
            const desc = item.descricao || '';
            const safeDesc = desc.replace(/"/g, '&quot;');
            return `
            <tr>
              <td><span class="fin-desc-text" title="${safeDesc}">${desc}</span></td>
              <td><span style="color: var(--text-secondary);">${item.categoria || ''}</span></td>
              <td>${formatDateBR(item.data)}</td>
              <td><span class="fin-val-receita">${formatBRL(parseFloat(item.valor) || 0)}</span></td>
              <td class="fin-status-cell">
                ${renderStatusBadge(item)}
              </td>
              <td>
                <div class="fin-actions-cell">
                  <button type="button" class="btn-edit-fin-row" data-id="${item.id}" title="Editar Receita">
                    <i class="ti ti-pencil"></i>
                  </button>
                  <button type="button" class="btn-delete-fin-row" data-id="${item.id}" title="Excluir Receita">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
          }).join('');
        }
      }

      // 2. Renderizar Tabela de Despesas
      if (finDespesasTableBody) {
        if (despesas.length === 0) {
          finDespesasTableBody.innerHTML = `
            <tr>
              <td colspan="6" class="fin-empty-cell">
                <div class="fin-empty-state">
                  <i class="ti ti-receipt-off fin-empty-icon"></i>
                  <p class="fin-empty-text">Nenhuma despesa registrada no período</p>
                  <span class="fin-empty-subtext">Clique em "Nova Despesa" ou amplie o filtro de datas</span>
                </div>
              </td>
            </tr>
          `;
        } else {
          finDespesasTableBody.innerHTML = despesas.map(item => {
            const desc = item.descricao || '';
            const safeDesc = desc.replace(/"/g, '&quot;');
            return `
            <tr>
              <td><span class="fin-desc-text" title="${safeDesc}">${desc}</span></td>
              <td><span style="color: var(--text-secondary);">${item.categoria || ''}</span></td>
              <td>${formatDateBR(item.data)}</td>
              <td><span class="fin-val-despesa">${formatBRL(parseFloat(item.valor) || 0)}</span></td>
              <td class="fin-status-cell">
                ${renderStatusBadge(item)}
              </td>
              <td>
                <div class="fin-actions-cell">
                  <button type="button" class="btn-edit-fin-row" data-id="${item.id}" title="Editar Despesa">
                    <i class="ti ti-pencil"></i>
                  </button>
                  <button type="button" class="btn-delete-fin-row" data-id="${item.id}" title="Excluir Despesa">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
          }).join('');
        }
      }

      // 3. Calcular e Atualizar Indicadores
      const totalReceitas = receitas.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);
      const totalDespesas = despesas.reduce((acc, cur) => acc + (parseFloat(cur.valor) || 0), 0);
      const lucroLiquido = totalReceitas - totalDespesas;
      const margemLiquida = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100) : 0;

      if (finStatReceitasTotal) finStatReceitasTotal.textContent = formatBRL(totalReceitas);
      if (finStatDespesasTotal) finStatDespesasTotal.textContent = formatBRL(totalDespesas);
      if (finStatLucroLiquido) {
        finStatLucroLiquido.textContent = formatBRL(lucroLiquido);
        if (lucroLiquido < 0) {
          finStatLucroLiquido.style.color = '#DC2626';
        } else if (lucroLiquido > 0) {
          finStatLucroLiquido.style.color = '#16A34A';
        } else {
          finStatLucroLiquido.style.color = 'var(--text-main)';
        }
      }
      if (finStatMargemLiquida) {
        finStatMargemLiquida.textContent = `${margemLiquida.toFixed(1).replace('.', ',')}%`;
      }
    }

    // Abertura dos Modais de Criação
    if (btnNovaReceita && modalAddReceita) {
      btnNovaReceita.addEventListener('click', () => {
        if (addReceitaForm) addReceitaForm.reset();
        if (recDataInput) recDataInput.value = new Date().toISOString().split('T')[0];
        modalAddReceita.classList.remove('hidden');
      });
    }

    if (btnNovaDespesa && modalAddDespesa) {
      btnNovaDespesa.addEventListener('click', () => {
        if (addDespesaForm) addDespesaForm.reset();
        if (despDataInput) despDataInput.value = new Date().toISOString().split('T')[0];
        modalAddDespesa.classList.remove('hidden');
      });
    }

    // Fechamento dos Modais
    if (closeAddReceitaModal && modalAddReceita) {
      closeAddReceitaModal.addEventListener('click', () => modalAddReceita.classList.add('hidden'));
    }
    if (closeAddDespesaModal && modalAddDespesa) {
      closeAddDespesaModal.addEventListener('click', () => modalAddDespesa.classList.add('hidden'));
    }

    [modalAddReceita, modalAddDespesa].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.add('hidden');
        });
      }
    });

    // Salvar Nova Receita
    if (addReceitaForm) {
      addReceitaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = document.getElementById('recDescricao').value.trim();
        const cat = document.getElementById('recCategoria').value;
        const dt = document.getElementById('recData').value;
        const val = parseCurrencyValue(document.getElementById('recValor').value);
        const st = document.getElementById('recStatus').value;

        if (!desc || isNaN(val) || val <= 0) {
          showToast('Preencha uma descrição e um valor válido.');
          return;
        }

        const registro = {
          tipo: 'receita',
          descricao: desc,
          categoria: cat,
          data: dt || new Date().toISOString().split('T')[0],
          valor: val,
          status: st || 'Recebido'
        };

        if (submitReceitaBtn) submitReceitaBtn.disabled = true;

        let salvo = false;
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('financeiro')
              .insert([registro])
              .select();

            if (!error && data && data.length > 0) {
              salvo = true;
            } else if (error) {
              console.error('Erro ao salvar receita no Supabase:', error);
            }
          } catch (err) {
            console.error('Falha de conexão com Supabase:', err);
          }
        }

        // Se falhar no Supabase ou offline, salva localmente
        if (!salvo) {
          registro.id = 'rec_' + Date.now();
          const raw = localStorage.getItem(STORAGE_KEY_RECEITAS);
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(registro);
          localStorage.setItem(STORAGE_KEY_RECEITAS, JSON.stringify(list));
        }

        if (submitReceitaBtn) submitReceitaBtn.disabled = false;
        modalAddReceita.classList.add('hidden');
        addReceitaForm.reset();
        await renderFinancialData();
        showToast('Receita cadastrada com sucesso!');
      });
    }

    // Salvar Nova Despesa
    if (addDespesaForm) {
      addDespesaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const desc = document.getElementById('despDescricao').value.trim();
        const cat = document.getElementById('despCategoria').value;
        const dt = document.getElementById('despData').value;
        const val = parseCurrencyValue(document.getElementById('despValor').value);
        const st = document.getElementById('despStatus').value;

        if (!desc || isNaN(val) || val <= 0) {
          showToast('Preencha uma descrição e um valor válido.');
          return;
        }

        const registro = {
          tipo: 'despesa',
          descricao: desc,
          categoria: cat,
          data: dt || new Date().toISOString().split('T')[0],
          valor: val,
          status: st || 'A Pagar'
        };

        if (submitDespesaBtn) submitDespesaBtn.disabled = true;

        let salvo = false;
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('financeiro')
              .insert([registro])
              .select();

            if (!error && data && data.length > 0) {
              salvo = true;
            } else if (error) {
              console.error('Erro ao salvar despesa no Supabase:', error);
            }
          } catch (err) {
            console.error('Falha de conexão com Supabase:', err);
          }
        }

        // Se falhar no Supabase ou offline, salva localmente
        if (!salvo) {
          registro.id = 'desp_' + Date.now();
          const raw = localStorage.getItem(STORAGE_KEY_DESPESAS);
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(registro);
          localStorage.setItem(STORAGE_KEY_DESPESAS, JSON.stringify(list));
        }

        if (submitDespesaBtn) submitDespesaBtn.disabled = false;
        modalAddDespesa.classList.add('hidden');
        addDespesaForm.reset();
        await renderFinancialData();
        showToast('Despesa cadastrada com sucesso!');
      });
    }

    // Modal de Edição de Lançamento Financeiro
    const modalEditFinanceiro = document.getElementById('modalEditFinanceiro');
    const closeEditFinanceiroModal = document.getElementById('closeEditFinanceiroModal');
    const editFinanceiroForm = document.getElementById('editFinanceiroForm');
    const editFinValorInput = document.getElementById('editFinValor');
    const editFinModalTitle = document.getElementById('editFinModalTitle');
    const submitEditFinanceiroBtn = document.getElementById('submitEditFinanceiroBtn');

    setupCurrencyInput(editFinValorInput);

    if (closeEditFinanceiroModal && modalEditFinanceiro) {
      closeEditFinanceiroModal.addEventListener('click', () => modalEditFinanceiro.classList.add('hidden'));
    }

    if (modalEditFinanceiro) {
      modalEditFinanceiro.addEventListener('click', (e) => {
        if (e.target === modalEditFinanceiro) modalEditFinanceiro.classList.add('hidden');
      });
    }

    function openEditFinanceiroModal(item) {
      if (!modalEditFinanceiro || !item) return;
      document.getElementById('editFinId').value = item.id;
      document.getElementById('editFinTipo').value = item.tipo || 'receita';
      const catSelect = document.getElementById('editFinCategoria');
      if (catSelect) {
        catSelect.innerHTML = '';
        const isDespesa = item.tipo === 'despesa';
        const optionsList = isDespesa
          ? ['Tráfego', 'Ferramentas', 'Impostos']
          : ['Requerimento', 'Planejamento', 'Cálculo'];

        // Se o item já tiver uma categoria legada/diferente (ex: 'Honorários'), adiciona ela também para não perder
        if (item.categoria && !optionsList.includes(item.categoria)) {
          optionsList.unshift(item.categoria);
        }

        optionsList.forEach(opt => {
          const optEl = document.createElement('option');
          optEl.value = opt;
          optEl.textContent = opt;
          catSelect.appendChild(optEl);
        });

        catSelect.value = item.categoria || optionsList[0];
      }

      const dateVal = item.data ? (item.data.includes('T') ? item.data.split('T')[0] : item.data) : '';
      document.getElementById('editFinData').value = dateVal;

      const numVal = parseFloat(item.valor) || 0;
      if (editFinValorInput) {
        editFinValorInput.value = numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      const statusSelect = document.getElementById('editFinStatus');
      if (statusSelect) {
        statusSelect.value = item.status || (item.tipo === 'despesa' ? 'A Pagar' : 'Pendente');
      }

      if (editFinModalTitle) {
        editFinModalTitle.textContent = item.tipo === 'despesa' ? 'Editar Despesa' : 'Editar Receita';
      }

      modalEditFinanceiro.classList.remove('hidden');
    }

    if (editFinanceiroForm) {
      editFinanceiroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editFinId').value;
        const tipo = document.getElementById('editFinTipo').value;
        const desc = document.getElementById('editFinDescricao').value.trim();
        const cat = document.getElementById('editFinCategoria').value.trim();
        const dt = document.getElementById('editFinData').value;
        const val = parseCurrencyValue(document.getElementById('editFinValor').value);
        const st = document.getElementById('editFinStatus').value;

        if (!desc || isNaN(val) || val <= 0) {
          showToast('Preencha uma descrição e um valor válido.');
          return;
        }

        if (submitEditFinanceiroBtn) submitEditFinanceiroBtn.disabled = true;

        const updatePayload = {
          descricao: desc,
          categoria: cat,
          data: dt,
          valor: val,
          status: st
        };

        let salvo = false;
        if (supabase && !id.startsWith('rec_') && !id.startsWith('desp_')) {
          try {
            const { error } = await supabase
              .from('financeiro')
              .update(updatePayload)
              .eq('id', id);

            if (!error) salvo = true;
            else console.error('Erro ao atualizar no Supabase:', error);
          } catch (err) {
            console.error('Falha de conexão com Supabase:', err);
          }
        }

        // Atualizar no localStorage caso esteja lá
        try {
          const rawRec = localStorage.getItem(STORAGE_KEY_RECEITAS);
          if (rawRec) {
            const listRec = JSON.parse(rawRec);
            const idx = listRec.findIndex(item => item.id === id);
            if (idx !== -1) {
              listRec[idx] = { ...listRec[idx], ...updatePayload };
              localStorage.setItem(STORAGE_KEY_RECEITAS, JSON.stringify(listRec));
              salvo = true;
            }
          }
          const rawDesp = localStorage.getItem(STORAGE_KEY_DESPESAS);
          if (rawDesp) {
            const listDesp = JSON.parse(rawDesp);
            const idx = listDesp.findIndex(item => item.id === id);
            if (idx !== -1) {
              listDesp[idx] = { ...listDesp[idx], ...updatePayload };
              localStorage.setItem(STORAGE_KEY_DESPESAS, JSON.stringify(listDesp));
              salvo = true;
            }
          }
        } catch (err) { }

        if (submitEditFinanceiroBtn) submitEditFinanceiroBtn.disabled = false;
        modalEditFinanceiro.classList.add('hidden');
        await renderFinancialData();
        showToast('Lançamento atualizado com sucesso!');
      });
    }

    // Ações de clique nas tabelas (Alterar Status, Editar e Deletar)
    document.addEventListener('click', async (e) => {
      // 0. Botão de Alterar Status (Cicla entre Pendente -> Pago -> Atrasado)
      const statusBtn = e.target.closest('.btn-toggle-fin-status');
      if (statusBtn) {
        const id = statusBtn.dataset.id;
        const item = financialItems.find(it => String(it.id) === String(id));
        if (item) {
          const nextStatus = getNextStatus(item.status);
          item.status = nextStatus;

          // Atualizar no Supabase
          if (supabase && !String(id).startsWith('rec_') && !String(id).startsWith('desp_')) {
            try {
              await supabase
                .from('financeiro')
                .update({ status: nextStatus })
                .eq('id', id);
            } catch (err) {
              console.error('Erro ao atualizar status no Supabase:', err);
            }
          }

          // Atualizar no localStorage
          try {
            const rawRec = localStorage.getItem(STORAGE_KEY_RECEITAS);
            if (rawRec) {
              const listRec = JSON.parse(rawRec);
              const idx = listRec.findIndex(r => String(r.id) === String(id));
              if (idx !== -1) {
                listRec[idx].status = nextStatus;
                localStorage.setItem(STORAGE_KEY_RECEITAS, JSON.stringify(listRec));
              }
            }
            const rawDesp = localStorage.getItem(STORAGE_KEY_DESPESAS);
            if (rawDesp) {
              const listDesp = JSON.parse(rawDesp);
              const idx = listDesp.findIndex(d => String(d.id) === String(id));
              if (idx !== -1) {
                listDesp[idx].status = nextStatus;
                localStorage.setItem(STORAGE_KEY_DESPESAS, JSON.stringify(listDesp));
              }
            }
          } catch (err) { }

          await renderFinancialData(true);
        }
        return;
      }

      // 1. Botão de Editar
      const editBtn = e.target.closest('.btn-edit-fin-row');
      if (editBtn) {
        const id = editBtn.dataset.id;
        const item = financialItems.find(it => String(it.id) === String(id));
        if (item) {
          openEditFinanceiroModal(item);
        }
        return;
      }

      // 2. Botão de Deletar
      const deleteBtn = e.target.closest('.btn-delete-fin-row');
      if (!deleteBtn) return;
      const id = deleteBtn.dataset.id;
      if (!id) return;

      if (!confirm('Deseja realmente remover este lançamento financeiro?')) {
        return;
      }

      deleteBtn.disabled = true;

      let removido = false;
      if (supabase && !id.startsWith('rec_') && !id.startsWith('desp_')) {
        try {
          const { error } = await supabase
            .from('financeiro')
            .delete()
            .eq('id', id);

          if (!error) {
            removido = true;
          } else {
            console.error('Erro ao remover no Supabase:', error);
          }
        } catch (err) {
          console.error('Falha ao excluir no Supabase:', err);
        }
      }

      // Remover do localStorage caso esteja lá
      try {
        const rawRec = localStorage.getItem(STORAGE_KEY_RECEITAS);
        if (rawRec) {
          const listRec = JSON.parse(rawRec).filter(item => item.id !== id);
          localStorage.setItem(STORAGE_KEY_RECEITAS, JSON.stringify(listRec));
        }
        const rawDesp = localStorage.getItem(STORAGE_KEY_DESPESAS);
        if (rawDesp) {
          const listDesp = JSON.parse(rawDesp).filter(item => item.id !== id);
          localStorage.setItem(STORAGE_KEY_DESPESAS, JSON.stringify(listDesp));
        }
      } catch (err) { }

      await renderFinancialData();
      showToast('Lançamento removido com sucesso!');
    });

    // Inicializar Datepicker e Render Inicial
    setupFinancialDatePickerEvents();
    updateFinancialDateRangeDisplay();
    renderFinancialCalendar();
    renderFinancialData();
    window.renderFinancialData = renderFinancialData;
  }

  initFinancialModule();

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
    if (typeof updateFilterStatusOptionsVisibility === 'function') {
      updateFilterStatusOptionsVisibility();
    }
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
  const listBulkBar = document.getElementById('listBulkBar');
  const bulkBarCount = document.getElementById('bulkBarCount');
  const btnBulkAssign = document.getElementById('btnBulkAssign');
  const btnBulkDeselect = document.getElementById('btnBulkDeselect');
  const modalBulkAssign = document.getElementById('modalBulkAssign');
  const closeBulkAssignModal = document.getElementById('closeBulkAssignModal');
  const cancelBulkAssignBtn = document.getElementById('cancelBulkAssignBtn');
  const confirmBulkAssignBtn = document.getElementById('confirmBulkAssignBtn');
  const bulkAssignUserList = document.getElementById('bulkAssignUserList');
  const bulkAssignDesc = document.getElementById('bulkAssignDesc');
  const bulkAssignBtnText = document.getElementById('bulkAssignBtnText');
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

  if (btnBulkAssign) btnBulkAssign.addEventListener('click', openBulkAssignModal);
  if (closeBulkAssignModal) closeBulkAssignModal.addEventListener('click', closeBulkAssignModalFn);
  if (cancelBulkAssignBtn) cancelBulkAssignBtn.addEventListener('click', closeBulkAssignModalFn);

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
  let currentUserEmail = null;

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
          doc_rg_cnh: 'Pendente',
          doc_certidao: 'Pendente',
          doc_cnis: 'Pendente',
          doc_carteira_trabalho: 'Pendente',
          doc_carteira_digital: 'Pendente'
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
          table: 'crm'
        },
        () => {
          loadUserCards();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Sincronização em tempo real ativa no Supabase (tabela crm).');
        }
      });
  }

  // Atualizar a renderização do CRM (Níveis de Acesso por Cargo / Perfil)
  async function loadUserCards() {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return;
    currentUserId = session.user.id;
    currentUserEmail = session.user.email || null;

    subscribeRealtimeUpdates();

    // Obter perfil do usuário para checar permissões
    let isAdmin = currentUserId === ADMIN_USER_ID;
    let userRole = 'operador_comercial';
    let userProfile = null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (profile) {
        userProfile = profile;
        userRole = profile.role || 'operador_comercial';
        if (profile.role === 'admin' || profile.is_admin === true) {
          isAdmin = true;
        }
      }
    } catch (e) { /* fallback */ }

    if (isAdmin) userRole = 'admin';

    // Atualiza visibilidade de abas no menu conforme perfil
    updateNavigationByRole(userProfile, currentUserId);

    let tabStages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
    if (window.currentTab === 'operacao') {
      tabStages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
    } else if (window.currentTab === 'judicial') {
      tabStages = ['negado', 'planejamento'];
    }

    let query = supabase.from(getCurrentTable()).select('*').in('status', tabStages);

    // Quem vê TODOS os cards da aba: Administradores e Supervisores
    const canSeeAllCards = isAdmin || userRole === 'supervisor_comercial' || userRole === 'supervisor_juridico';

    // Operadores (operador_comercial, operador_juridico e legacy usuario/advogado) vêem apenas cards atribuídos a eles
    // Na aba judicial os registros são visíveis independentemente de user_id
    if (!canSeeAllCards && window.currentTab !== 'judicial') {
      query = query.eq('user_id', currentUserId);
    }

    // Carrega todos os registros paginados (superando o limite de 1000 do Supabase)
    const PAGE_SIZE = 1000;
    let from = 0;
    let cards = [];
    while (true) {
      let pageQuery = query.order('criado_em', { ascending: false }).range(from, from + PAGE_SIZE - 1);
      const { data, error } = await pageQuery;
      if (error) {
        console.warn('Erro ao carregar oportunidades:', error.message);
        break;
      }
      if (!data || data.length === 0) break;
      cards.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    allUserCards = cards || [];

    // Carregar cache de perfis (para exibição de operador atribuído e filtros)
    window.crmProfilesCache = window.crmProfilesCache || [];
    if (window.crmProfilesCache.length === 0) {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) window.crmProfilesCache = profiles;
      } catch (e) { /* fallback */ }
    }

    // Atualiza filtro de operador se for admin/supervisor
    if (canSeeAllCards) {
      const opDivider = document.getElementById('filterOperatorDivider');
      const opSection = document.getElementById('filterOperatorSection');
      const opSelect = document.getElementById('filterOperatorSelect');

      if (opDivider) opDivider.style.display = 'block';
      if (opSection) opSection.style.display = 'flex'; // ou block

      if (opSelect) {
        const uniqueUserIds = [...new Set(allUserCards.map(c => c.user_id).filter(Boolean))];

        window.crmProfilesCache = window.crmProfilesCache || [];
        if (window.crmProfilesCache.length === 0) {
          const { data: profiles } = await supabase.from('profiles').select('*');
          if (profiles) window.crmProfilesCache = profiles;
        }

        const currentSelected = opSelect.value;
        opSelect.innerHTML = '<option value="">Todos</option><option value="unassigned">Não atribuído</option>';

        uniqueUserIds.forEach(uId => {
          const prof = window.crmProfilesCache.find(p => p.id === uId);
          const name = prof ? getUserDisplayName(prof) : 'Usuário Desconhecido';
          const opt = document.createElement('option');
          opt.value = uId;
          opt.textContent = name;
          opSelect.appendChild(opt);
        });

        if (uniqueUserIds.includes(currentSelected) || currentSelected === 'unassigned') {
          opSelect.value = currentSelected;
        }
      }
    } else {
      const opDivider = document.getElementById('filterOperatorDivider');
      const opSection = document.getElementById('filterOperatorSection');
      if (opDivider) opDivider.style.display = 'none';
      if (opSection) opSection.style.display = 'none';
    }

    const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
    filterAndRenderCards(searchTerm);
  }

  /* ==========================================
     PAINEL DE FILTROS
     ========================================== */
  const filterPanel = document.getElementById('filterPanel');
  const filterDropWrapper = document.getElementById('filterDropdownWrapper');
  const filterApplyBtn = document.getElementById('filterApplyBtn');
  const filterClearBtn = document.getElementById('filterClearBtn');
  const filterActiveBadge = document.getElementById('filterActiveBadge');

  // Estado ativo dos filtros (aplicados ao clicar em "Aplicar")
  let activeStatusFilters = []; // array de strings e.g. ['novo','proposta']
  let activeDateFilter = ''; // string e.g. 'menos7'
  let activeOperatorFilter = ''; // string, id do operador
  let activeSortMode = 'nome'; // 'nome' | 'data_requerimento' | 'created_at' | 'updated_at'
  let activeProductFilter = 'Aposentadoria'; // 'Aposentadoria' (padrão) | 'Salário-Maternidade'

  // Dropdown e lógica de Produto
  const crmProductBtnEl = document.getElementById('crmProductBtn');
  const productPanel = document.getElementById('productPanel');
  const productDropWrapper = document.getElementById('productDropdownWrapper');
  const crmProductBtnLabel = document.getElementById('crmProductBtnLabel');

  if (crmProductBtnEl && productPanel) {
    crmProductBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (filterPanel) filterPanel.classList.add('hidden');
      if (sortPanel) sortPanel.classList.add('hidden');
      const isHidden = productPanel.classList.toggle('hidden');
      if (productDropWrapper) {
        productDropWrapper.classList.toggle('open', !isHidden);
      }
    });

    document.querySelectorAll('.product-option-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedProduct = btn.dataset.product || 'Aposentadoria';
        activeProductFilter = selectedProduct;

        // Atualiza estilo active nas opções
        document.querySelectorAll('.product-option-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Atualiza rótulo do botão
        if (crmProductBtnLabel) {
          crmProductBtnLabel.textContent = selectedProduct;
        }

        // Fecha o dropdown
        productPanel.classList.add('hidden');
        if (productDropWrapper) productDropWrapper.classList.remove('open');

        // Re-renderiza cards de acordo com o produto selecionado
        const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
        filterAndRenderCards(searchTerm);
      });
    });
  }

  // Dropdown e lógica de Ordenação
  const crmSortBtnEl = document.getElementById('crmSortBtn');
  const sortPanel = document.getElementById('sortPanel');
  const sortDropWrapper = document.getElementById('sortDropdownWrapper');

  if (crmSortBtnEl && sortPanel) {
    crmSortBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (filterPanel) filterPanel.classList.add('hidden');
      if (productPanel) {
        productPanel.classList.add('hidden');
        if (productDropWrapper) productDropWrapper.classList.remove('open');
      }
      sortPanel.classList.toggle('hidden');
    });

    document.querySelectorAll('.sort-option-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedSort = btn.dataset.sort;
        if (!selectedSort) return;
        activeSortMode = selectedSort;

        // Atualiza estilo visual active do dropdown
        document.querySelectorAll('.sort-option-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Fecha o dropdown
        sortPanel.classList.add('hidden');

        // Re-renderiza cards com a nova ordenação
        const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
        filterAndRenderCards(searchTerm);
      });
    });
  }

  // Atualiza as opções de status exibidas no painel de filtros conforme a aba ativa
  function updateFilterStatusOptionsVisibility() {
    const tab = window.currentTab || 'comercial';
    document.querySelectorAll('.filter-chip-status').forEach(chip => {
      if (chip.dataset.tab === tab) {
        chip.style.display = '';
      } else {
        chip.style.display = 'none';
        const cb = chip.querySelector('.filter-status-cb');
        if (cb) cb.checked = false;
      }
    });
  }
  window.updateFilterStatusOptionsVisibility = updateFilterStatusOptionsVisibility;

  // Toggle do painel
  const crmFilterBtnEl = document.getElementById('crmFilterBtn');
  if (crmFilterBtnEl && filterPanel) {
    crmFilterBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (productPanel) {
        productPanel.classList.add('hidden');
        if (productDropWrapper) productDropWrapper.classList.remove('open');
      }
      if (sortPanel) sortPanel.classList.add('hidden');
      updateFilterStatusOptionsVisibility();
      filterPanel.classList.toggle('hidden');
    });
  }

  // Fechar painel pelo botão X
  const filterCloseBtnEl = document.getElementById('filterCloseBtn');
  if (filterCloseBtnEl && filterPanel) {
    filterCloseBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      filterPanel.classList.add('hidden');
    });
  }

  // Fechar painéis ao clicar fora
  document.addEventListener('click', (e) => {
    if (filterPanel && !filterPanel.classList.contains('hidden')) {
      if (!filterDropWrapper?.contains(e.target) && !crmFilterBtnEl?.contains(e.target)) {
        filterPanel.classList.add('hidden');
      }
    }
    if (sortPanel && !sortPanel.classList.contains('hidden')) {
      if (!sortDropWrapper?.contains(e.target) && !crmSortBtnEl?.contains(e.target)) {
        sortPanel.classList.add('hidden');
      }
    }
    if (productPanel && !productPanel.classList.contains('hidden')) {
      if (!productDropWrapper?.contains(e.target) && !crmProductBtnEl?.contains(e.target)) {
        productPanel.classList.add('hidden');
        if (productDropWrapper) productDropWrapper.classList.remove('open');
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
    const count = activeStatusFilters.length + (activeDateFilter ? 1 : 0) + (activeOperatorFilter ? 1 : 0);
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
      // Lê checkboxes de status da aba ativa
      const tab = window.currentTab || 'comercial';
      activeStatusFilters = Array.from(document.querySelectorAll(`.filter-chip-status[data-tab="${tab}"] .filter-status-cb`))
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      // Lê radio de data (requerimento seleção única)
      const checkedRadio = document.querySelector('.filter-date-radio:checked');
      activeDateFilter = checkedRadio ? checkedRadio.value : '';

      // Lê select de operador
      const opSelect = document.getElementById('filterOperatorSelect');
      activeOperatorFilter = opSelect ? opSelect.value : '';

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

      const opSelect = document.getElementById('filterOperatorSelect');
      if (opSelect) opSelect.value = '';
      activeOperatorFilter = '';

      updateFilterBadge();
      const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
      filterAndRenderCards(searchTerm);
    });
  }

  /* ==========================================
     FILTRO PRINCIPAL — busca + status + data
     ========================================== */
  function filterAndRenderCards(searchTerm) {
    let filtered = allUserCards.filter(card => {
      const cardStatus = card.status || (window.currentTab === 'comercial' ? 'novo' : 'documentacao');

      // Se houver filtros de status selecionados no painel
      if (activeStatusFilters.length > 0) {
        return activeStatusFilters.includes(cardStatus);
      }

      // Se nenhum filtro de status estiver selecionado (comportamento padrão por aba)
      if (window.currentTab === 'comercial') {
        const normalStages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
        return normalStages.includes(cardStatus);
      } else if (window.currentTab === 'operacao') {
        const operacaoStages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
        return operacaoStages.includes(cardStatus);
      } else if (window.currentTab === 'judicial') {
        const judicialStages = ['negado', 'planejamento'];
        return judicialStages.includes(cardStatus);
      }
    });

    // 1. Filtro de texto (nome / telefone)
    if (searchTerm) {
      const cleanSearchTerm = searchTerm.replace(/\D/g, '');
      filtered = filtered.filter(card => {
        const nameMatch = card.nome && card.nome.toLowerCase().includes(searchTerm);
        const rawPhone = card.telefone ? card.telefone.replace(/\D/g, '') : '';
        const phoneFormattedMatch = card.telefone && card.telefone.toLowerCase().includes(searchTerm);
        const phoneDigitsMatch = cleanSearchTerm && rawPhone.includes(cleanSearchTerm);
        return nameMatch || phoneFormattedMatch || phoneDigitsMatch;
      });
    }

    // 2. Filtro de Produto ('Aposentadoria' | 'Salário-Maternidade')
    // 'Aposentadoria' puxa a base atual existente (padrão).
    // 'Salário-Maternidade' ainda não possui planilhas criadas no momento.
    if (activeProductFilter === 'Salário-Maternidade') {
      filtered = filtered.filter(card => {
        const cardProd = (card.produto || card.tipo_beneficio || card.beneficio || '').toLowerCase();
        return cardProd.includes('maternidade');
      });
    } else {
      // 'Aposentadoria' ou padrão: exibe toda a base atual existente
      filtered = filtered.filter(card => {
        const cardProd = (card.produto || card.tipo_beneficio || card.beneficio || '').toLowerCase();
        return !cardProd.includes('maternidade');
      });
    }

    // 3. Filtro de data de requerimento (seleção única)
    if (activeDateFilter) {
      filtered = filtered.filter(card => {
        const diff = daysDiff(card.data_requerimento);
        if (diff === null) return false;
        switch (activeDateFilter) {
          case 'vencidos': return diff < 0;                  // data já passou (Roxo)
          case 'menos7': return diff >= 0 && diff <= 7;   // em até uma semana (Vermelho)
          case 'menos30': return diff > 7 && diff <= 30;   // entre 8 e 30 dias (Amarelo)
          case 'menos365': return diff > 30 && diff <= 365; // entre 31 e 365 dias (Azul)
          default: return true;
        }
      });
    }

    // 4. Filtro de operador
    if (activeOperatorFilter) {
      if (activeOperatorFilter === 'unassigned') {
        filtered = filtered.filter(card => !card.user_id);
      } else {
        filtered = filtered.filter(card => String(card.user_id) === activeOperatorFilter);
      }
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
      return sortCardsByActiveMode(a, b);
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
        if (diff < 0) dateClass = 'date-purple';
        else if (diff <= 7) dateClass = 'date-red';
        else if (diff <= 30) dateClass = 'date-yellow';
        else if (diff <= 365) dateClass = 'date-blue';
        else dateClass = 'date-gray';
      }

      // ---- WhatsApp link ----
      const rawPhone = card.telefone ? card.telefone.replace(/\D/g, '') : '';
      const waUrl = rawPhone ? `https://web.whatsapp.com/send/?phone=55${rawPhone}` : '#';

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

      // ---- Operador atribuído ----
      let operatorHtml = '';
      if (card.user_id) {
        const profile = (window.crmProfilesCache || []).find(p => p.id === card.user_id);
        const opName = profile ? getUserDisplayName(profile) : 'Atribuído';
        const opInitial = opName.charAt(0).toUpperCase();
        operatorHtml = `
          <div class="list-assignee-badge" title="${escapeHtml(opName)}">
            <span class="list-assignee-avatar">${escapeHtml(opInitial)}</span>
            <span class="list-assignee-name">${escapeHtml(opName)}</span>
          </div>
        `;
      }

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
        <td class="list-assignee">${operatorHtml}</td>
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
  const btnOptPerdido = document.getElementById('btnOptPerdido');
  const btnOptRecuperacao = document.getElementById('btnOptRecuperacao');
  const btnOptNoShow = document.getElementById('btnOptNoShow');
  const btnOptNegado = document.getElementById('btnOptNegado');
  const btnOptDeletar = document.getElementById('btnOptDeletar');

  function openDeleteModal(card, cardElement) {
    cardToDelete = card;
    cardElementToDelete = cardElement;
    if (deleteCardName) deleteCardName.textContent = card.nome ? `"${card.nome}"` : 'este cliente';
    if (modalDeleteConfirm) modalDeleteConfirm.classList.remove('hidden');
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

  // Ações das opções de insucesso (Desqualificado, Recusado, Perdido, Recuperação, No-Show, Triagem/Negado)
  async function triggerInsuccessWebhook(actionLabel, actionValue) {
    if (!cardToDelete) return;

    const targetCard = cardToDelete;
    const cardElToRem = cardElementToDelete;
    const oldStatus = targetCard.status;
    const oldAtualizadoEm = targetCard.atualizado_em;
    const nowIso = new Date().toISOString();

    cardToDelete = null;
    cardElementToDelete = null;

    // Atualiza estado local e interface imediatamente sem precisar de F5
    targetCard.status = actionValue;
    targetCard.atualizado_em = nowIso;

    const staysInCurrentTab =
      (window.currentTab === 'judicial' && ['negado', 'planejamento'].includes(actionValue)) ||
      (window.currentTab === 'comercial' && ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'].includes(actionValue)) ||
      (window.currentTab === 'operacao' && ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'].includes(actionValue));

    if (!staysInCurrentTab) {
      allUserCards = allUserCards.filter(c => c.id !== targetCard.id);
      if (cardElToRem) cardElToRem.remove();
    }

    const searchTerm = crmSearchInput ? crmSearchInput.value.toLowerCase().trim() : '';
    filterAndRenderCards(searchTerm);

    // Atualiza exclusivamente a coluna 'status' na tabela unificada CRM (sem acionar webhook)
    if (supabase && targetCard.id && actionValue) {
      const { error } = await supabase
        .from(getCurrentTable())
        .update({
          status: actionValue,
          atualizado_em: nowIso
        })
        .eq('id', targetCard.id);

      if (error) {
        console.error('Erro ao atualizar status na tabela CRM:', error);
        targetCard.status = oldStatus;
        targetCard.atualizado_em = oldAtualizadoEm;
        if (!staysInCurrentTab && !allUserCards.some(c => c.id === targetCard.id)) {
          allUserCards.push(targetCard);
        }
        filterAndRenderCards(searchTerm);
        showToast('Erro ao alterar status: ' + error.message);
      } else {
        showToast(`Status alterado para "${actionLabel}".`);
      }
    }
  }

  if (btnOptDesqualificado) {
    btnOptDesqualificado.addEventListener('click', () => requestStatusChangeConfirmation('Desqualificado', 'desqualificado'));
  }
  if (btnOptRecusado) {
    btnOptRecusado.addEventListener('click', () => requestStatusChangeConfirmation('Recusado', 'recusado'));
  }
  if (btnOptPerdido) {
    btnOptPerdido.addEventListener('click', () => requestStatusChangeConfirmation('Perdido', 'perdido'));
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
        const nowIso = new Date().toISOString();
        const { error } = await supabase
          .from(getCurrentTable())
          .update({
            data_requerimento: newDate,
            atualizado_em: nowIso
          })
          .eq('id', cardToUpdateDate.id);

        if (!error && cardToUpdateDate) {
          cardToUpdateDate.atualizado_em = nowIso;
        }

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

  // Função auxiliar para ordenar cards por data de requerimento e nome
  function getCardSortWeight(card) {
    if (!card.data_requerimento) return 999999;
    const diff = daysDiff(card.data_requerimento);
    if (diff === null) return 999999;
    // Se diff < 0 (data já passou): prioridade máxima, mais recente primeiro (ex: -1 antes de -2)
    // Se diff >= 0 (futuro/hoje): da mais próxima para a mais distante (0, 1, 2...)
    return diff < 0 ? diff : (100000 + diff);
  }

  // Função de ordenação dinâmica dos cards baseada no activeSortMode
  function sortCardsByActiveMode(a, b) {
    if (activeSortMode === 'nome') {
      const nameA = (a.nome || '').trim();
      const nameB = (b.nome || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    }

    if (activeSortMode === 'data_requerimento') {
      const weightA = getCardSortWeight(a);
      const weightB = getCardSortWeight(b);
      if (weightA !== weightB) {
        if (weightA < 0 && weightB < 0) {
          return weightB - weightA;
        }
        return weightA - weightB;
      }
      const nameA = (a.nome || '').trim();
      const nameB = (b.nome || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    }

    if (activeSortMode === 'created_at') {
      const getCreatedTime = (item) => {
        const val = item.criado_em || item.created_at;
        return val ? new Date(val).getTime() : 0;
      };
      const timeA = getCreatedTime(a);
      const timeB = getCreatedTime(b);
      if (timeA !== timeB) return timeB - timeA; // mais recentes primeiro (do mais recente para o mais antigo)
      const nameA = (a.nome || '').trim();
      const nameB = (b.nome || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    }

    if (activeSortMode === 'updated_at') {
      const getUpdateTime = (item) => {
        const val = item.atualizado_em || item.updated_at || item.created_at;
        return val ? new Date(val).getTime() : 0;
      };
      const timeA = getUpdateTime(a);
      const timeB = getUpdateTime(b);
      if (timeA !== timeB) return timeB - timeA; // atualizados recentemente primeiro
      const nameA = (a.nome || '').trim();
      const nameB = (b.nome || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
    }

    return sortCardsByDateAndName(a, b);
  }

  function sortCardsByDateAndName(a, b) {
    const weightA = getCardSortWeight(a);
    const weightB = getCardSortWeight(b);
    if (weightA !== weightB) {
      if (weightA < 0 && weightB < 0) {
        // Ambas no passado: mais recente primeiro (ex: -1 > -5 -> retorno negativo para vir antes)
        return weightB - weightA;
      }
      return weightA - weightB;
    }
    const nameA = (a.nome || '').trim();
    const nameB = (b.nome || '').trim();
    return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
  }

  function renderKanbanCards(cards) {
    let stages = [];
    if (window.currentTab === 'comercial') {
      stages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
    } else if (window.currentTab === 'operacao') {
      stages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
    } else if (window.currentTab === 'judicial') {
      stages = ['negado', 'planejamento'];
    }

    stages.forEach(stage => {
      // Pega apenas a coluna da tab atual
      const column = document.querySelector(`.kanban-column[data-stage="${stage}"][data-tab="${window.currentTab}"]`);
      if (column) {
        const container = column.querySelector('.kanban-cards-container');
        const countSpan = column.querySelector('.column-count');
        container.innerHTML = '';

        // Filtrar cards da coluna e ordenar
        const stageCards = cards.filter(c => c.status === stage).sort(sortCardsByActiveMode);

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
      } else if (diffDays <= 365) {
        dateStatusClass = 'date-blue';   // A data está entre 365 e 30 dias -> Azul
      } else {
        dateStatusClass = 'date-gray';   // Acima de 365 dias -> Cinza
      }
    }

    // Formatação do Link para WhatsApp (apenas números)
    const rawPhone = card.telefone ? card.telefone.replace(/\D/g, '') : '';
    const whatsappUrl = rawPhone ? `https://web.whatsapp.com/send/?phone=55${rawPhone}` : '#';

    cardDiv.innerHTML = `
      <div class="card-top-row">
        <h5 class="card-client-name" title="${escapeHtml(card.nome)}">${escapeHtml(card.nome)}</h5>
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
  const concedidoClienteInput = document.getElementById('concedidoCliente');
  const concedidoCategoriaInput = document.getElementById('concedidoCategoria');
  const concedidoRMIInput = document.getElementById('concedidoRMI');
  const concedidoParcelasInput = document.getElementById('concedidoParcelas');
  const concedidoAtrasoDiasInput = document.getElementById('concedidoAtrasoDias');
  const concedidoRetroativoInput = document.getElementById('concedidoRetroativo');
  const concedidoPrimeiroPagamentoInput = document.getElementById('concedidoPrimeiroPagamento');

  let concedidoCardTarget = null;
  let concedidoNewStatusTarget = null;

  function parseBRLValue(val) {
    if (!val) return 0;
    const clean = String(val).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  function formatBRLValue(num) {
    return (num || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Recalcular retroativo automaticamente: (((RMI / 30) * atraso em dias) * 30%)
  function calculateConcedidoRetroativo() {
    if (!concedidoRetroativoInput) return 0;
    const rmi = parseBRLValue(concedidoRMIInput ? concedidoRMIInput.value : 0);
    const dias = parseInt(concedidoAtrasoDiasInput ? concedidoAtrasoDiasInput.value : 0, 10) || 0;

    let retroativo = 0;
    if (rmi > 0 && dias > 0) {
      retroativo = ((rmi / 30) * dias) * 0.30;
    }
    concedidoRetroativoInput.value = formatBRLValue(retroativo);
    return retroativo;
  }

  if (concedidoRMIInput) {
    concedidoRMIInput.addEventListener('input', (e) => {
      let clean = String(e.target.value || '').replace(/\D/g, '');
      if (!clean) {
        e.target.value = '';
      } else {
        const numberVal = parseFloat(clean) / 100;
        e.target.value = numberVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      }
      calculateConcedidoRetroativo();
    });
  }

  if (concedidoAtrasoDiasInput) {
    concedidoAtrasoDiasInput.addEventListener('input', () => {
      calculateConcedidoRetroativo();
    });
  }

  function openConcedidoModal(card, newStatus) {
    concedidoCardTarget = card;
    concedidoNewStatusTarget = newStatus;

    if (concedidoClienteInput) concedidoClienteInput.value = card.nome || '';
    if (concedidoCategoriaInput) concedidoCategoriaInput.value = 'Honorários';
    if (concedidoRMIInput) concedidoRMIInput.value = '';
    if (concedidoParcelasInput) concedidoParcelasInput.value = '';
    if (concedidoAtrasoDiasInput) concedidoAtrasoDiasInput.value = '';
    if (concedidoRetroativoInput) concedidoRetroativoInput.value = formatBRLValue(0);
    if (concedidoPrimeiroPagamentoInput) {
      concedidoPrimeiroPagamentoInput.value = new Date().toISOString().split('T')[0];
    }

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

      const clienteNome = concedidoClienteInput ? concedidoClienteInput.value.trim() : (concedidoCardTarget.nome || '');
      const categoria = concedidoCategoriaInput ? concedidoCategoriaInput.value.trim() : 'Honorários';
      const rmi = parseBRLValue(concedidoRMIInput ? concedidoRMIInput.value : 0);
      const parcelas = parseInt(concedidoParcelasInput ? concedidoParcelasInput.value : 0, 10);
      const atrasoDias = parseInt(concedidoAtrasoDiasInput ? concedidoAtrasoDiasInput.value : 0, 10) || 0;
      const retroativo = calculateConcedidoRetroativo();
      const primeiroPagamentoStr = concedidoPrimeiroPagamentoInput ? concedidoPrimeiroPagamentoInput.value : '';

      if (!rmi || rmi <= 0) {
        showToast('Por favor, informe um valor de RMI válido.');
        if (concedidoRMIInput) concedidoRMIInput.focus();
        return;
      }

      if (!parcelas || parcelas < 1) {
        showToast('Por favor, informe um número de parcelas válido (mínimo 1).');
        if (concedidoParcelasInput) concedidoParcelasInput.focus();
        return;
      }

      if (!primeiroPagamentoStr) {
        showToast('Por favor, selecione a data do primeiro pagamento.');
        if (concedidoPrimeiroPagamentoInput) concedidoPrimeiroPagamentoInput.focus();
        return;
      }

      confirmConcedidoBtn.disabled = true;
      const btnSpan = confirmConcedidoBtn.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'Salvando...';

      // Cálculo do valor por parcela: (((RMI * 3) + Retroativo) / Parcelas)
      const valorTotal = (rmi * 3) + retroativo;
      const valorParcela = parseFloat((valorTotal / parcelas).toFixed(2));

      // Gerar linhas da planilha financeiro
      const registrosFinanceiro = [];
      const [pAno, pMes, pDia] = primeiroPagamentoStr.split('-').map(num => parseInt(num, 10));

      for (let i = 0; i < parcelas; i++) {
        // Cada outra linha adicionará um mês
        const dataParcela = new Date(pAno, (pMes - 1) + i, pDia);
        // Garantir formato YYYY-MM-DD
        const anoStr = dataParcela.getFullYear();
        const mesStr = String(dataParcela.getMonth() + 1).padStart(2, '0');
        const diaStr = String(dataParcela.getDate()).padStart(2, '0');
        const dataFormatada = `${anoStr}-${mesStr}-${diaStr}`;

        registrosFinanceiro.push({
          tipo: 'receita',
          descricao: parcelas > 1 ? `${clienteNome} (${i + 1}/${parcelas})` : clienteNome,
          categoria: categoria,
          data: dataFormatada,
          valor: valorParcela,
          status: 'Pendente'
        });
      }

      // 1. Salvar no Supabase (tabela financeiro)
      let salvoSupabase = false;
      if (supabase) {
        try {
          const { error: finError } = await supabase
            .from('financeiro')
            .insert(registrosFinanceiro);

          if (!finError) {
            salvoSupabase = true;
          } else {
            console.error('Erro ao registrar no financeiro:', finError);
          }
        } catch (err) {
          console.error('Falha de conexão com Supabase:', err);
        }
      }

      // Se não salvou no Supabase (offline), salva no localStorage
      if (!salvoSupabase) {
        try {
          const raw = localStorage.getItem('resolveprev_fin_receitas');
          const list = raw ? JSON.parse(raw) : [];
          registrosFinanceiro.forEach((reg, idx) => {
            list.unshift({ ...reg, id: `rec_${Date.now()}_${idx}` });
          });
          localStorage.setItem('resolveprev_fin_receitas', JSON.stringify(list));
        } catch (e) {
          console.warn('Erro ao salvar localmente no financeiro:', e);
        }
      }

      // Se a aba financeiro estiver ativa ou carregada, atualizar os dados
      if (typeof window.renderFinancialData === 'function') {
        window.renderFinancialData();
      }

      // 2. Mover o card para o novo status (Concedido)
      const cardToUpdate = concedidoCardTarget;
      const newStatus = concedidoNewStatusTarget;
      closeConcedidoModalWindow();

      await changeCardStatus(cardToUpdate, newStatus);
      showToast(`Benefício concedido! ${parcelas} parcela(s) registrada(s) no Financeiro.`);

      confirmConcedidoBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = 'Salvar';
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
      waBtn.href = `https://web.whatsapp.com/send/?phone=55${digits}`;
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

  const sheetPhoneCopyBtn = document.getElementById('sheetPhoneCopyBtn');
  if (sheetPhoneCopyBtn && sheetPhone) {
    sheetPhoneCopyBtn.addEventListener('click', () => {
      const phoneVal = sheetPhone.value ? sheetPhone.value.trim() : '';
      if (!phoneVal) {
        showToast('Nenhum telefone para copiar.');
        return;
      }

      navigator.clipboard.writeText(phoneVal).then(() => {
        sheetPhoneCopyBtn.classList.add('copied');
        sheetPhoneCopyBtn.title = 'Telefone copiado!';
        const originalSvg = sheetPhoneCopyBtn.innerHTML;
        sheetPhoneCopyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
        showToast('Telefone copiado para a área de transferência!');

        setTimeout(() => {
          sheetPhoneCopyBtn.classList.remove('copied');
          sheetPhoneCopyBtn.title = 'Copiar número de telefone';
          sheetPhoneCopyBtn.innerHTML = originalSvg;
        }, 2000);
      }).catch(() => {
        // Fallback caso clipboard API falhe
        try {
          const tempInput = document.createElement('input');
          tempInput.value = phoneVal;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast('Telefone copiado para a área de transferência!');
        } catch (err) {
          showToast('Não foi possível copiar o telefone.');
        }
      });
    });
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
      const v = e.target.value; // YYYY-MM-DD from type="date"

      const elIdade = document.getElementById('respIdade');
      if (elIdade) {
        elIdade.value = calculateAge(v);
      }

      const statIdade = document.getElementById('statIdade');
      if (statIdade) statIdade.textContent = v ? calculateAge(v) : '-';

      const statAniversario = document.getElementById('statAniversario');
      if (statAniversario) {
        if (v && v.length >= 10) {
          const parts = v.split('-');
          if (parts.length === 3) statAniversario.value = `${parts[2]}/${parts[1]}`;
          else statAniversario.value = '';
        } else {
          statAniversario.value = '';
        }
      }
    });
  }

  const statAniversario = document.getElementById('statAniversario');
  if (statAniversario) {
    statAniversario.addEventListener('focus', (e) => {
      if (sheetDataNascimento && sheetDataNascimento.value && sheetDataNascimento.value.length >= 10) {
        const parts = sheetDataNascimento.value.split('-');
        if (parts.length === 3) {
          e.target.value = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
    });

    statAniversario.addEventListener('blur', (e) => {
      const val = e.target.value.trim();
      if (!val) return;
      const parts = val.split('/');
      if (sheetDataNascimento) {
        let year = new Date().getFullYear();
        let day = '';
        let month = '';

        if (parts.length >= 2) {
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
        }

        if (parts.length === 3) {
          if (parts[2].length === 2) year = (parseInt(parts[2]) > 50 ? '19' : '20') + parts[2];
          else year = parts[2];
        } else if (parts.length === 2 && sheetDataNascimento.value && sheetDataNascimento.value.length >= 10) {
          year = sheetDataNascimento.value.split('-')[0];
        } else if (parts.length < 2) {
          if (sheetDataNascimento.value && sheetDataNascimento.value.length >= 10) {
            const p = sheetDataNascimento.value.split('-');
            e.target.value = `${p[2]}/${p[1]}`;
          }
          return;
        }

        const newVal = `${year}-${month}-${day}`;
        if (sheetDataNascimento.value !== newVal) {
          sheetDataNascimento.value = newVal;
          sheetDataNascimento.dispatchEvent(new Event('input'));
          saveClientData(true);
        }

        e.target.value = `${day}/${month}`;
      }
    });

    statAniversario.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.target.blur();
      }
    });
  }

  if (sheetClientNameInput) {
    const saveClientNameChange = async () => {
      if (!currentActiveCard || !supabase) return;
      const newName = sheetClientNameInput.value.trim();
      if (!newName || newName === currentActiveCard.nome) return;

      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from(getCurrentTable())
        .update({
          nome: newName,
          atualizado_em: nowIso
        })
        .eq('id', currentActiveCard.id);

      if (error) {
        showToast('Erro ao atualizar nome: ' + error.message);
        sheetClientNameInput.value = currentActiveCard.nome || '';
        return;
      }

      currentActiveCard.nome = newName;
      currentActiveCard.atualizado_em = nowIso;
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

      // Atualizar Responsável no botão de Atribuição
      const sheetAssigneeName = document.getElementById('sheetAssigneeName');
      const sheetAssigneeAvatar = document.getElementById('sheetAssigneeAvatar');
      const sheetReassignBtnEl = document.getElementById('sheetReassignBtn');
      if (sheetAssigneeName) {
        if (card.user_id) {
          const profile = (window.crmProfilesCache || []).find(p => p.id === card.user_id);
          const opName = profile ? getUserDisplayName(profile) : 'Atribuído';
          sheetAssigneeName.textContent = opName;
          if (sheetAssigneeAvatar) {
            sheetAssigneeAvatar.textContent = opName.charAt(0).toUpperCase();
          }
          if (sheetReassignBtnEl) sheetReassignBtnEl.title = `Atribuído a: ${opName} (Clique para alterar)`;
        } else {
          sheetAssigneeName.textContent = 'Não atribuído';
          if (sheetAssigneeAvatar) {
            sheetAssigneeAvatar.textContent = '+';
          }
          if (sheetReassignBtnEl) sheetReassignBtnEl.title = 'Clique para atribuir a um usuário';
        }
      }

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
          // Se for link do Google e tivermos o email do usuário logado no CRM,
          // anexamos authuser=<email> para o Google abrir diretamente com a conta correta
          if (currentUserEmail && driveUrl.includes('google.com')) {
            try {
              const urlObj = new URL(driveUrl);
              urlObj.searchParams.set('authuser', currentUserEmail);
              driveUrl = urlObj.toString();
            } catch (e) {
              const separator = driveUrl.includes('?') ? '&' : '?';
              driveUrl = `${driveUrl}${separator}authuser=${encodeURIComponent(currentUserEmail)}`;
            }
          }

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
      let isoDateNascimento = '';
      if (card.data_nascimento) {
        let rawDate = card.data_nascimento.split('T')[0];
        if (rawDate.includes('/')) {
          const p = rawDate.split('/');
          if (p.length === 3) {
            if (p[2].length === 4) isoDateNascimento = `${p[2]}-${p[1]}-${p[0]}`;
            else if (p[0].length === 4) isoDateNascimento = `${p[0]}-${p[1]}-${p[2]}`;
          }
        } else if (rawDate.includes('-')) {
          const p = rawDate.split('-');
          if (p.length === 3) {
            if (p[2].length === 4) isoDateNascimento = `${p[2]}-${p[1]}-${p[0]}`;
            else if (p[0].length === 4) isoDateNascimento = `${p[0]}-${p[1]}-${p[2]}`;
          }
        }
      }
      if (elDataNascimento) {
        elDataNascimento.value = isoDateNascimento;
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
      if (elIdade) elIdade.value = calculateAge(isoDateNascimento);

      // Atualizar stats do topo
      const statIdade = document.getElementById('statIdade');
      if (statIdade) statIdade.textContent = isoDateNascimento ? calculateAge(isoDateNascimento) : '-';

      const statAniversario = document.getElementById('statAniversario');
      if (statAniversario) {
        if (isoDateNascimento && isoDateNascimento.length >= 10) {
          const parts = isoDateNascimento.split('-'); // YYYY-MM-DD
          if (parts.length === 3) statAniversario.value = `${parts[2]}/${parts[1]}`;
          else statAniversario.value = '';
        } else {
          statAniversario.value = '';
        }
      }

      updateServicoMilitarUI(card.servico_militar || 'Não');

      const elJaContribuiu = document.getElementById('respJaContribuiu');
      if (elJaContribuiu) elJaContribuiu.value = card.ja_contribuiu || 'Sim - e continuo contribuindo.';

      const elTempoContribuicao = document.getElementById('respTempoContribuicao');
      if (elTempoContribuicao) elTempoContribuicao.value = card.tempo_contribuicao !== undefined && card.tempo_contribuicao !== null ? card.tempo_contribuicao : '';

      const elTipoTrabalho = document.getElementById('respTipoTrabalho');
      if (elTipoTrabalho) elTipoTrabalho.value = card.tipo_trabalho || 'Emprego de carteira assinada (CLT)';

      const elSolicitouBeneficio = document.getElementById('respSolicitouBeneficio');
      if (elSolicitouBeneficio) elSolicitouBeneficio.value = card.solicitou_beneficio || 'Não - nunca tentei aposentar.';

      const elExerceuAtividadeEspecial = document.getElementById('respExerceuAtividadeEspecial');
      if (elExerceuAtividadeEspecial) elExerceuAtividadeEspecial.value = card.exerceu_atividade_especial || 'Sim - já trabalhei nessas atividades.';

      const elDetalhes = document.getElementById('respDetalhes');
      if (elDetalhes) elDetalhes.value = card.detalhes || '';

      if (typeof initQualificationForm === 'function') {
        initQualificationForm();
      };

      // Preencher campos da guia Documentos (Etiquetas de Status e Lista Eventuais)
      renderDocumentBadges(card);
      renderEventualDocs(card);
      updateSheetNotesBadge(card);

      // Atualizar estado visual do botão Etiqueta (Status)
      updateStatusTagUI(card.status || 'novo');

      // Atualizar botão de agendamento de reunião
      const btnAgendar = document.getElementById('modalBtnAgendarReuniao');
      if (btnAgendar) {
        let reuniaoFormatada = '';
        let isReuniaoFutura = false;

        const dataReuniaoRaw = card.data_reuniao || card._reuniaoIso;
        if (dataReuniaoRaw) {
          try {
            const dt = new Date(dataReuniaoRaw);
            const agora = new Date();
            // Só consideramos ativa/vermelha se a data e horário inicial da reunião ainda não passaram
            if (!isNaN(dt.getTime()) && dt > agora) {
              isReuniaoFutura = true;
              const dStr = String(dt.getDate()).padStart(2, '0');
              const mStr = String(dt.getMonth() + 1).padStart(2, '0');
              const hStr = String(dt.getHours()).padStart(2, '0');
              const minStr = String(dt.getMinutes()).padStart(2, '0');
              reuniaoFormatada = `${dStr}/${mStr} - ${hStr}:${minStr}`;
            }
          } catch (e) { }
        }

        if (isReuniaoFutura && reuniaoFormatada) {
          btnAgendar.innerHTML = `<i class="ti ti-calendar-check" style="font-size:16px" aria-hidden="true"></i>${reuniaoFormatada}`;
          btnAgendar.title = `Reunião agendada para: ${reuniaoFormatada}`;
          btnAgendar.classList.add('btn-reuniao-agendada');
        } else {
          btnAgendar.innerHTML = `<i class="ti ti-calendar-plus" style="font-size:16px" aria-hidden="true"></i>Agendar reunião`;
          btnAgendar.title = `Agendar reunião`;
          btnAgendar.classList.remove('btn-reuniao-agendada');
        }
      }

      // Atualizar estado do botão de Comissão de SDR (apenas clicável em Operação)
      updateSdrCommissionUI(card);

      // Resetar para a aba 'Documentos' se estiver em Operação, caso contrário 'Respostas'
      switchTab(window.currentTab === 'operacao' ? 'documentos' : 'respostas');

      document.querySelectorAll('#clientAnswersForm select').forEach(sel => sel.dispatchEvent(new Event('change')));
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
  const docStatusOrder = ['Pendente', 'Solicitado', 'Validar', 'Recebido', 'Corrigir'];
  const docStatusClasses = {
    'Pendente': 'badge-pendente',
    'Solicitado': 'badge-solicitado',
    'Validar': 'badge-validar',
    'Recebido': 'badge-recebido',
    'Corrigir': 'badge-corrigir'
  };

  const obrigatorioKeys = ['doc_cnis', 'doc_rg_cnh', 'doc_carteira_trabalho', 'doc_carteira_digital', 'doc_certidao'];

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

      // Encontrar o próximo status no ciclo: Pendente -> Solicitado -> Validar -> Recebido -> Corrigir -> Pendente
      const currentIndex = docStatusOrder.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % docStatusOrder.length;
      const newStatus = docStatusOrder[nextIndex];

      // Atualizar UI instantaneamente
      updateBadgeUI(badge, newStatus);
      currentActiveCard[docKey] = newStatus;
      updateDocsCounters();

      const nowIso = new Date().toISOString();
      currentActiveCard.atualizado_em = nowIso;

      // Gravar alteração na coluna correspondente da tabela no Supabase
      const { error } = await supabase
        .from(getCurrentTable())
        .update({
          [docKey]: newStatus,
          atualizado_em: nowIso
        })
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
          <button type="button" class="btn-remove-doc" data-eventual-index="${index}" title="Excluir documento" aria-label="Excluir documento">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
          <button type="button" class="doc-status-badge ${docStatusClasses[status] || 'badge-pendente'}" data-eventual-index="${index}" data-status="${escapeHtml(status)}">
            <span class="doc-badge-dot"></span> ${escapeHtml(status)}
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

    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from(getCurrentTable())
      .update({
        eventuais: updatedDocsArray,
        atualizado_em: nowIso
      })
      .eq('id', currentActiveCard.id);

    if (error) {
      showToast('Erro ao atualizar documentos eventuais: ' + error.message);
      return;
    }

    currentActiveCard.eventuais = updatedDocsArray;
    currentActiveCard.atualizado_em = nowIso;
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

  // Salvamento Automático das Informações (Ficha + Respostas)
  async function saveClientData(showToastMsg = true) {
    if (!currentActiveCard || !supabase) return;

    const nameEl = document.getElementById('sheetClientNameInput');
    const updatedNome = nameEl ? nameEl.value.trim() : (sheetClientNameInput ? sheetClientNameInput.value.trim() : '');
    const updatedPhone = sheetPhone ? sheetPhone.value.trim() : '';

    if (!updatedNome) {
      if (showToastMsg) showToast('O nome do cliente é obrigatório.');
      return;
    }

    let rawDataNascimento = sheetDataNascimento ? sheetDataNascimento.value : '';

    const updatedData = {
      nome: updatedNome,
      telefone: updatedPhone,
      email: sheetEmail ? sheetEmail.value.trim() : '',
      profissao: sheetProfissao ? sheetProfissao.value.trim() : '',
      estado_civil: sheetEstadoCivil ? sheetEstadoCivil.value : '',
      rg: sheetRg ? sheetRg.value.trim() : '',
      cpf: sheetCpf ? sheetCpf.value.trim() : '',
      data_nascimento: rawDataNascimento,
      cep: sheetCep ? sheetCep.value.trim() : '',
      endereco: sheetEndereco ? sheetEndereco.value.trim() : '',
      complemento: sheetComplemento ? sheetComplemento.value.trim() : '',
      uf: sheetUf ? sheetUf.value : '',
      cidade: sheetCidade ? sheetCidade.value.trim() : '',
      bairro: sheetBairro ? sheetBairro.value.trim() : '',
      comissao_sdr: document.getElementById('sdrCommissionSwitch') ? document.getElementById('sdrCommissionSwitch').checked : (currentActiveCard.comissao_sdr || false)
    };

    if (rawDataNascimento && rawDataNascimento.length === 10) {
      let oldRaw = currentActiveCard.data_nascimento ? currentActiveCard.data_nascimento.split('T')[0] : '';

      if (rawDataNascimento !== oldRaw) {
        const genero = currentActiveCard.genero || currentActiveCard.sexo || '';
        const generoUpper = typeof genero === 'string' ? genero.toUpperCase() : '';

        let anosParaAdd = 0;
        if (generoUpper.includes('HOMEM') || generoUpper.includes('MASC') || generoUpper === 'M') {
          anosParaAdd = 65;
        } else if (generoUpper.includes('MULHER') || generoUpper.includes('FEM') || generoUpper === 'F') {
          anosParaAdd = 62;
        }

        if (anosParaAdd > 0) {
          const parts = rawDataNascimento.split('-');
          if (parts.length === 3) {
            const reqYear = parseInt(parts[0], 10) + anosParaAdd;
            updatedData.data_requerimento = `${reqYear}-${parts[1]}-${parts[2]}`;
          }
        }
      }
    }

    const respJaContribuiu = document.getElementById('respJaContribuiu');
    const respTempoContribuicao = document.getElementById('respTempoContribuicao');
    const respTipoTrabalho = document.getElementById('respTipoTrabalho');
    const respSolicitouBeneficio = document.getElementById('respSolicitouBeneficio');
    const respExerceuAtividadeEspecial = document.getElementById('respExerceuAtividadeEspecial');
    const respDetalhes = document.getElementById('respDetalhes');

    const updatedAnswers = {
      servico_militar: document.getElementById('respServicoMilitar') ? document.getElementById('respServicoMilitar').value : 'Não',
      ja_contribuiu: respJaContribuiu ? respJaContribuiu.value : '',
      tempo_contribuicao: respTempoContribuicao && respTempoContribuicao.value !== '' ? parseInt(respTempoContribuicao.value, 10) : null,
      tipo_trabalho: respTipoTrabalho ? respTipoTrabalho.value : '',
      solicitou_beneficio: respSolicitouBeneficio ? respSolicitouBeneficio.value : '',
      exerceu_atividade_especial: respExerceuAtividadeEspecial ? respExerceuAtividadeEspecial.value : '',
      detalhes: respDetalhes ? respDetalhes.value.trim() : ''
    };

    const finalData = {
      ...updatedData,
      ...updatedAnswers,
      atualizado_em: new Date().toISOString()
    };

    const { error } = await supabase
      .from(getCurrentTable())
      .update(finalData)
      .eq('id', currentActiveCard.id);

    if (error) {
      if (showToastMsg) showToast('Erro ao salvar dados: ' + error.message);
      return;
    }

    Object.assign(currentActiveCard, finalData);
    loadUserCards(); // Atualiza kanban (como o nome pode ter mudado)
    if (showToastMsg) showToast('Dados salvos automaticamente!');
  }

  // Previne os submits dos formulários
  if (clientSheetForm) {
    clientSheetForm.addEventListener('submit', (e) => e.preventDefault());
    clientSheetForm.addEventListener('focusout', () => saveClientData(true));
    clientSheetForm.addEventListener('change', (e) => {
      if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'radio') {
        saveClientData(true);
      }
    });
  }

  const clientAnswersForm = document.getElementById('clientAnswersForm');
  if (clientAnswersForm) {
    clientAnswersForm.addEventListener('submit', (e) => e.preventDefault());
    clientAnswersForm.addEventListener('focusout', () => saveClientData(true));
    clientAnswersForm.addEventListener('change', (e) => {
      if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'radio') {
        saveClientData(true);
      }
    });
  }

  function updateStatusTagUI(stage) {
    if (sheetStatusText) sheetStatusText.textContent = stageLabels[stage] || 'Novo';
    if (sheetStatusDot) {
      sheetStatusDot.className = 'status-tag-dot ' + (stageDotClasses[stage] || 'dot-novo');
    }

    // Atualizar próxima etapa
    const nextStepLabel = document.getElementById('nextStepLabel');
    if (nextStepLabel) {
      let stages = [];
      if (window.currentTab === 'comercial') {
        stages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
      } else if (window.currentTab === 'operacao') {
        stages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
      } else if (window.currentTab === 'judicial') {
        stages = ['negado', 'planejamento'];
      }

      const currentIndex = stages.indexOf(stage);
      if (currentIndex !== -1 && currentIndex < stages.length - 1) {
        const nextStage = stages[currentIndex + 1];
        nextStepLabel.textContent = 'Próxima etapa: ' + (stageLabels[nextStage] || nextStage);
      } else if (currentIndex === stages.length - 1) {
        nextStepLabel.textContent = 'Última etapa';
      } else {
        nextStepLabel.textContent = 'Próxima etapa: Indisponível';
      }
    }
  }

  function closeClientSheet() {
    saveClientData(false); // Salva os dados silenciosamente ao fechar
    currentActiveCard = null;
    closeNotesSidebar();
    const menuToHide = document.getElementById('statusDropdownMenu'); if (menuToHide) menuToHide.classList.add('hidden');
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
      const nowIso = new Date().toISOString();
      currentActiveCard.atualizado_em = nowIso;
      const { error } = await supabase
        .from(getCurrentTable())
        .update({
          notas_internas: notes,
          atualizado_em: nowIso
        })
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
  // Toggle do Dropdown de Etiqueta (Status)
  const statusBtnEl = document.getElementById('sheetStatusDropdownBtn');
  const statusMenuEl = document.getElementById('statusDropdownMenu');
  if (statusBtnEl && statusMenuEl) {
    statusBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      statusMenuEl.classList.toggle('hidden');
    });
  }

  // Seleção de nova opção de Status (Movimentação de Coluna)
  document.querySelectorAll('.status-option').forEach(option => {
    option.addEventListener('click', async (e) => {
      e.stopPropagation();
      const newStatus = option.dataset.status;
      if (!newStatus || !currentActiveCard) return;

      const menuToHide = document.getElementById('statusDropdownMenu'); if (menuToHide) menuToHide.classList.add('hidden');

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
    const menuToHide = document.getElementById('statusDropdownMenu');
    if (menuToHide && !e.target.closest('.status-dropdown-wrapper')) {
      menuToHide.classList.add('hidden');
    }
  });

  // Botão e Dropdown Encerrar (Insucesso / Deletar Card)
  const sheetCloseLeadBtn = document.getElementById('sheetCloseLeadBtn');
  const closeLeadMenu = document.getElementById('closeLeadMenu');
  const closeLeadDropdownWrapper = document.getElementById('closeLeadDropdownWrapper');
  const closeLeadDeleteBtn = document.getElementById('closeLeadDeleteBtn');

  if (sheetCloseLeadBtn && closeLeadMenu) {
    sheetCloseLeadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLeadMenu.classList.toggle('hidden');
    });
  }

  // Opções de insucesso (Desqualificado, Recusado, Recuperação, No-Show, Negado)
  document.querySelectorAll('.close-lead-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (closeLeadMenu) closeLeadMenu.classList.add('hidden');
      if (!currentActiveCard) return;

      const actionLabel = btn.dataset.actionLabel;
      const actionValue = btn.dataset.actionValue;
      const targetCard = currentActiveCard;
      const cardEl = document.querySelector(`.kanban-card[data-id="${targetCard.id}"]`);

      closeClientSheet();
      cardToDelete = targetCard;
      cardElementToDelete = cardEl;
      requestStatusChangeConfirmation(actionLabel, actionValue);
    });
  });

  // Opção de Deletar card direto do dropdown Encerrar
  if (closeLeadDeleteBtn) {
    closeLeadDeleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (closeLeadMenu) closeLeadMenu.classList.add('hidden');
      if (!currentActiveCard) return;

      const targetCard = currentActiveCard;
      const cardEl = document.querySelector(`.kanban-card[data-id="${targetCard.id}"]`);

      closeClientSheet();
      cardToDelete = targetCard;
      cardElementToDelete = cardEl;
      if (deleteCardName) deleteCardName.textContent = `"${targetCard.nome}"`;
      if (modalDeleteConfirm) modalDeleteConfirm.classList.remove('hidden');
    });
  }

  // Fechar dropdown de Encerrar ao clicar fora
  window.addEventListener('click', (e) => {
    if (closeLeadMenu && !e.target.closest('#closeLeadDropdownWrapper')) {
      closeLeadMenu.classList.add('hidden');
    }
  });

  // Controle de Comissão de SDR com Switch (Off/On)
  const sdrCommissionBtn = document.getElementById('sdrCommissionBtn');
  const sdrCommissionSwitch = document.getElementById('sdrCommissionSwitch');

  function updateSdrCommissionUI(card) {
    if (!sdrCommissionBtn || !sdrCommissionSwitch) return;

    // Desbloqueado para uso na aba Comercial e Operação
    sdrCommissionSwitch.disabled = false;
    sdrCommissionBtn.dataset.disabled = 'false';
    sdrCommissionBtn.classList.remove('disabled');
    sdrCommissionBtn.title = 'Clique para alternar a Comissão de SDR';

    // Padrão OFF (false), a não ser que card.comissao_sdr seja explicitamente true
    const isChecked = card ? Boolean(card.comissao_sdr) : false;
    sdrCommissionSwitch.checked = isChecked;
  }

  if (sdrCommissionSwitch) {
    sdrCommissionSwitch.addEventListener('change', async (e) => {
      const isChecked = sdrCommissionSwitch.checked;

      if (currentActiveCard) {
        currentActiveCard.comissao_sdr = isChecked;
        if (supabase) {
          try {
            const { error } = await supabase
              .from(getCurrentTable())
              .update({ comissao_sdr: isChecked, atualizado_em: new Date().toISOString() })
              .eq('id', currentActiveCard.id);

            if (error) {
              console.error('Erro ao salvar comissao_sdr no banco:', error);
              showToast('Erro ao salvar comissão no banco: ' + error.message);
            } else {
              showToast(`Comissão de SDR ${isChecked ? 'ativada' : 'desativada'} com sucesso!`);
            }
          } catch (err) {
            console.warn('Erro ao atualizar comissao_sdr:', err);
          }
        }
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
        const nowIso = new Date().toISOString();
        const { error } = await supabase
          .from(getCurrentTable())
          .update({
            user_id: profile.id,
            atualizado_em: nowIso
          })
          .eq('id', currentActiveCard.id);

        if (error) {
          showToast('Erro ao atribuir: ' + error.message);
          return;
        }

        currentActiveCard.user_id = profile.id;
        currentActiveCard.atualizado_em = nowIso;

        const sheetAssigneeName = document.getElementById('sheetAssigneeName');
        const sheetAssigneeAvatar = document.getElementById('sheetAssigneeAvatar');
        const sheetReassignBtnEl = document.getElementById('sheetReassignBtn');
        if (sheetAssigneeName) {
          sheetAssigneeName.textContent = displayName;
          if (sheetAssigneeAvatar) {
            sheetAssigneeAvatar.textContent = displayName.charAt(0).toUpperCase();
          }
          if (sheetReassignBtnEl) sheetReassignBtnEl.title = `Atribuído a: ${displayName} (Clique para alterar)`;
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

  // window.addEventListener('click', (e) => {
  //   if (e.target === modalClientSheet) closeClientSheet();
  // });


  // window.addEventListener('keydown', (e) => {
  //   if (e.key === 'Escape' && modalClientSheet) closeClientSheet();
  // });

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
  // ==================== LÓGICA DO MODAL: ADD INFO QUESTION ====================
  const modalAddInfo = document.getElementById('modalAddInfo');
  const closeAddInfoModal = document.getElementById('closeAddInfoModal');
  const confirmAddInfoBtn = document.getElementById('confirmAddInfoBtn');
  const addInfoDynamicFields = document.getElementById('addInfoDynamicFields');
  const btnAddInfoList = document.querySelectorAll('.btn-add-info');

  function openAddInfoModal(fieldId, originalLabel) {
    if (!modalAddInfo) return;

    // Configuração das perguntas dinâmicas por campo
    const questionsConfig = {
      'respTempoContribuicao': [
        { id: 'addInfoMilitar', label: 'Prestou serviço militar?', type: 'textarea' }
      ],
      'respSolicitouBeneficio': [
        { id: 'addInfoMotivoNegativa', label: 'Se tentou e foi negado, qual foi o motivo da negativa?', type: 'textarea' },
        { id: 'addInfoNovoPedido', label: 'Foi feito um novo pedido ou protocolado algum processo?', type: 'textarea' }
      ],
      'respJaContribuiu': [
        { id: 'addInfoTempoParou', label: 'Há quanto tempo parou de contribuir?', type: 'textarea' },
        { id: 'addInfoQualidadeSegurado', label: 'Você sabe se ainda tem qualidade de segurado?', type: 'textarea' },
        { id: 'addInfo120Contribuicoes', label: 'Sabe se fez mais de 120 contribuições sem interrupção?', type: 'textarea' },
        { id: 'addInfo12MesesSem', label: 'Sabe se ficou um período maior que 12 meses sem contribuir?', type: 'textarea' }
      ],
      'respExerceuAtividadeEspecial': [
        { id: 'addInfoAtivEspecial1', label: 'Por quanto tempo, e qual era a atividade?', type: 'textarea' },
        { id: 'addInfoAtivEspecial2', label: 'As empresas ainda existem, caso precise fazer alguma correção ou pedir documentos?', type: 'textarea' },
        { id: 'addInfoAtivEspecial3', label: 'Sabe a classificação de exposição aos agentes nocivos?', type: 'textarea' },
        { id: 'addInfoAtivEspecial4', label: 'Sabe se o uso de EPIs neutraliza a exposição a ponto de anular o direito?', type: 'textarea' }
      ]
    };

    let fields = questionsConfig[fieldId];

    if (fieldId === 'respTipoTrabalho') {
      const selectEl = document.getElementById(fieldId);
      const val = selectEl ? selectEl.value : '';
      if (val === 'Emprego de carteira assinada (CLT)') {
        fields = [
          { id: 'addInfoCLT1', label: 'Como CLT, com o que você trabalhava?', type: 'textarea' },
          { id: 'addInfoCLT2', label: 'Alguém já analisou o seu CNIS pra ver se todo o período em que trabalhou como CLT está registrado corretamente?', type: 'textarea' },
          { id: 'addInfoCLT3', label: 'Você sabe se tem alguma contribuição que foi registrada com valor errado ou abaixo de um salário mínimo?', type: 'textarea' },
          { id: 'addInfoCLT4', label: 'Você sabe se tem alguma data de entrada, saída ou de intervalo que precisa ser corrigida ?', type: 'textarea' }
        ];
      } else if (val === 'Empresário / Autônomo / MEI') {
        fields = [
          { id: 'addInfoMEI1', label: 'Como autônomo, com o que você trabalhava, e suas contribuições eram no carnê, ou como MEI?', type: 'textarea' },
          { id: 'addInfoMEI2', label: 'Alguém já analisou como essas contribuições aparecem no seu CNIS, se existe alguma lacuna ou se algo não foi contabilizado?', type: 'textarea' },
          { id: 'addInfoMEI3', label: 'Você sabe se tem alguma contribuição duplicada?', type: 'textarea' },
          { id: 'addInfoMEI4', label: 'Você sabe se todas as contribuições foram feitas no código correto?', type: 'textarea' }
        ];
      } else if (val === 'Trabalhador rural') {
        fields = [
          { id: 'addInfoRural1', label: 'Na roça, para quem você trabalhava?', type: 'textarea' },
          { id: 'addInfoRural2', label: 'As terras eram da sua família, e se sim, sabe quantos hectares ?', type: 'textarea' },
          { id: 'addInfoRural3', label: 'Você tem algum registro documental desse tempo de trabalho e que você produzia na terra?', type: 'textarea' },
          { id: 'addInfoRural4', label: 'Ainda existem testemunhas vivas do seu trabalho rural?', type: 'textarea' },
          { id: 'addInfoRural5', label: 'Você tem algum registro documental da sua relação com a terra?', type: 'textarea' }
        ];
      } else if (val === 'Servidor público') {
        return; // Modal is blocked
      } else {
        // "Outro" or any other unmapped value
        fields = [
          { id: 'addInfoGeneric', label: originalLabel || 'Pergunta selecionada', type: 'textarea' }
        ];
      }
    }

    if (!fields || fields.length === 0) {
      // Fallback para uma pergunta genérica se não estiver mapeado
      fields = [
        { id: 'addInfoGeneric', label: originalLabel || 'Pergunta selecionada', type: 'textarea' }
      ];
    }

    // Gerar o HTML dos campos dinâmicos
    if (addInfoDynamicFields) {
      let html = '';

      const generateExpandableNoteHTML = (text) => {
        return `
          <div style="position: sticky; top: 0; z-index: 10; background-color: #fffbeb; color: #b45309; padding: 0.75rem; border-radius: 6px; border: 1px solid #fde68a; font-size: 0.9rem; font-weight: 500; margin-bottom: 1rem; display: flex; align-items: flex-start; gap: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style="flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start;">
              <span class="note-content" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; transition: all 0.3s;">
                ${text}
              </span>
              <button type="button" onclick="event.preventDefault(); const c = this.previousElementSibling; if(c.style.webkitLineClamp === '1') { c.style.webkitLineClamp = 'unset'; this.textContent = 'ver menos'; } else { c.style.webkitLineClamp = '1'; this.textContent = 'ver mais...'; }" style="background: none; border: none; color: #b45309; font-size: 0.8rem; font-weight: bold; cursor: pointer; padding: 0; margin-top: 4px; text-decoration: underline;">ver mais...</button>
            </div>
          </div>
        `;
      };

      if (fieldId === 'respJaContribuiu') {
        html += generateExpandableNoteHTML('Se o cliente não tiver qualidade de segurado, não terá o direito de pedir a aposentadoria, mesmo que tenha a idade e o tempo de contribuição necessários.');
      } else if (fieldId === 'respTipoTrabalho') {
        const selectEl = document.getElementById(fieldId);
        const val = selectEl ? selectEl.value : '';
        let noteText = '';
        if (val === 'Emprego de carteira assinada (CLT)' || val === 'Empresário / Autônomo / MEI') {
          noteText = 'Se o INSS exigir correção de alguma dessas informações do CNIS, o tempo poderá se alongar por mais 6 meses até uma nova tentativa.';
        } else if (val === 'Trabalhador rural') {
          noteText = 'Sem a documentação correta, é quase impossível, no administrativo, o INSS aprovar a aposentadoria rural, e no judicial, levará, em média, de 3 a 4 anos.';
        }

        if (noteText) {
          html += generateExpandableNoteHTML(noteText);
        }
      } else if (fieldId === 'respExerceuAtividadeEspecial') {
        html += generateExpandableNoteHTML('Sem a documentação correta, é quase impossível, no administrativo, o INSS transformar o tempo especial em tempo regular adicionando os 40%, e no judicial, levará, em média, de 3 a 4 anos.');
      }

      html += fields.map(field => {
        return `
          <div class="sheet-field-group" style="margin-bottom: 1rem;">
            <label for="${field.id}" style="display: block; font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-dark);">${escapeHtml(field.label)}</label>
            <textarea id="${field.id}" class="sheet-input" placeholder="Digite sua resposta aqui..." rows="4" style="width: 100%; resize: vertical; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-light); font-size: 0.95rem; font-family: inherit; background-color: #f8fafc; transition: all 0.2s;"></textarea>
          </div>
        `;
      }).join('');

      addInfoDynamicFields.innerHTML = html;
    }

    modalAddInfo.classList.remove('hidden');
    // Focar no primeiro campo gerado
    const firstInput = addInfoDynamicFields.querySelector('textarea, input');
    if (firstInput) firstInput.focus();
  }

  function closeAddInfoModalHandler() {
    if (!modalAddInfo) return;
    modalAddInfo.classList.add('hidden');
  }

  btnAddInfoList.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const flexContainer = btn.parentElement;
      const label = flexContainer ? flexContainer.querySelector('label') : null;
      const fieldId = label ? label.getAttribute('for') : null;
      const questionText = label ? label.textContent.trim() : 'Pergunta selecionada';

      if (fieldId === 'respTipoTrabalho') {
        const selectEl = document.getElementById(fieldId);
        if (selectEl && selectEl.value === 'Servidor público') {
          showToast('Adição de informações extras bloqueada para Servidor público.');
          return;
        }
      }

      openAddInfoModal(fieldId, questionText);
    });
  });

  function updateAddInfoButtonsVisibility() {
    const rules = {
      'respSolicitouBeneficio': 'Não - nunca tentei aposentar.',
      'respJaContribuiu': 'Sim - e continuo contribuindo.',
      'respTipoTrabalho': 'Outro',
      'respExerceuAtividadeEspecial': 'Não - nunca trabalhei com isso.'
    };

    Object.keys(rules).forEach(id => {
      const selectEl = document.getElementById(id);
      if (!selectEl) return;
      const group = selectEl.closest('.sheet-field-group');
      if (group) {
        const btn = group.querySelector('.btn-add-info');
        if (btn) {
          if (selectEl.value === rules[id]) {
            btn.style.opacity = '0.3';
            btn.style.pointerEvents = 'none';
          } else {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
          }
        }
      }
    });
  }

  ['respSolicitouBeneficio', 'respJaContribuiu', 'respTipoTrabalho', 'respExerceuAtividadeEspecial'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updateAddInfoButtonsVisibility);
    }
  });

  updateAddInfoButtonsVisibility();

  if (closeAddInfoModal) {
    closeAddInfoModal.addEventListener('click', closeAddInfoModalHandler);
  }
  if (confirmAddInfoBtn) {
    confirmAddInfoBtn.addEventListener('click', () => {
      if (!addInfoDynamicFields) return;

      const respDetalhes = document.getElementById('respDetalhes');
      if (!respDetalhes) return;

      let newInfoText = '';
      let hasEmptyFields = false;

      // Coleta todos os inputs do modal
      const inputs = addInfoDynamicFields.querySelectorAll('textarea, input');

      inputs.forEach(input => {
        const val = input.value.trim();
        if (!val) {
          hasEmptyFields = true;
          return;
        }

        const label = addInfoDynamicFields.querySelector(`label[for="${input.id}"]`);
        const questionText = label ? label.textContent.trim() : 'Informação Adicional';

        if (newInfoText) newInfoText += '\n\n';
        newInfoText += `${questionText}\nR: ${val}`;
      });

      if (!newInfoText && hasEmptyFields) {
        showToast('Por favor, preencha o campo antes de adicionar.');
        return;
      }

      if (newInfoText) {
        let currentDetalhes = respDetalhes.value.trim();
        if (currentDetalhes) {
          respDetalhes.value = currentDetalhes + '\n\n' + newInfoText;
        } else {
          respDetalhes.value = newInfoText;
        }

        showToast('Informação transferida para os detalhes!');
        closeAddInfoModalHandler();
      }
    });
  }

  // window.addEventListener('click', (e) => {
  //   if (e.target === modalAddInfo) closeAddInfoModalHandler();
  // });
  // window.addEventListener('keydown', (e) => {
  //   if (e.key === 'Escape' && modalAddInfo && !modalAddInfo.classList.contains('hidden')) {
  //     closeAddInfoModalHandler();
  //   }
  // });

  // ==================== LÓGICA DO MODAL: EXPANDIR DETALHES ====================
  const btnExpandDetalhes = document.getElementById('btnExpandDetalhes');
  const modalExpandDetalhes = document.getElementById('modalExpandDetalhes');
  const closeExpandDetalhesModal = document.getElementById('closeExpandDetalhesModal');
  const expandedDetalhesTextarea = document.getElementById('expandedDetalhesTextarea');
  const respDetalhesInput = document.getElementById('respDetalhes');

  function openExpandDetalhesModal() {
    if (!modalExpandDetalhes || !expandedDetalhesTextarea || !respDetalhesInput) return;
    expandedDetalhesTextarea.value = respDetalhesInput.value;
    modalExpandDetalhes.classList.remove('hidden');
    expandedDetalhesTextarea.focus();
  }

  function closeExpandDetalhesModalHandler() {
    if (!modalExpandDetalhes) return;
    modalExpandDetalhes.classList.add('hidden');
    // Ensure we save when closing
    if (respDetalhesInput) {
      respDetalhesInput.dispatchEvent(new Event('change'));
    }
  }

  if (btnExpandDetalhes) {
    btnExpandDetalhes.addEventListener('click', openExpandDetalhesModal);
  }

  if (closeExpandDetalhesModal) {
    closeExpandDetalhesModal.addEventListener('click', closeExpandDetalhesModalHandler);
  }

  if (expandedDetalhesTextarea && respDetalhesInput) {
    expandedDetalhesTextarea.addEventListener('input', () => {
      respDetalhesInput.value = expandedDetalhesTextarea.value;
    });
  }

  // window.addEventListener('click', (e) => {
  //   if (e.target === modalExpandDetalhes) closeExpandDetalhesModalHandler();
  // });
  // window.addEventListener('keydown', (e) => {
  //   if (e.key === 'Escape' && modalExpandDetalhes && !modalExpandDetalhes.classList.contains('hidden')) {
  //     closeExpandDetalhesModalHandler();
  //   }
  // });

  function updateServicoMilitarUI(val) {
    const btn = document.getElementById('btnServicoMilitar');
    const label = document.getElementById('labelServicoMilitar');
    const text = document.getElementById('textServicoMilitar');
    const input = document.getElementById('respServicoMilitar');

    if (!btn || !label || !text || !input) return;

    if (val === 'Sim') {
      btn.style.background = 'var(--bg-success)';
      label.style.color = 'var(--text-success)';
      text.style.color = 'var(--text-success)';
      text.textContent = 'Sim';
      input.value = 'Sim';
    } else {
      btn.style.background = '#FEE2E2';
      label.style.color = '#B91C1C';
      text.style.color = '#B91C1C';
      text.textContent = 'Não';
      input.value = 'Não';
    }
  }

  const btnServicoMilitar = document.getElementById('btnServicoMilitar');
  if (btnServicoMilitar) {
    btnServicoMilitar.addEventListener('click', () => {
      const input = document.getElementById('respServicoMilitar');
      const newVal = input && input.value === 'Sim' ? 'Não' : 'Sim';
      updateServicoMilitarUI(newVal);
      saveClientData(true);
    });
  }



  // --- Aes dos botes no rodap do modal ---
  const modalBtnEnviarMensagem = document.getElementById('modalBtnEnviarMensagem');
  if (modalBtnEnviarMensagem) {
    modalBtnEnviarMensagem.addEventListener('click', () => {
      if (!currentActiveCard || !currentActiveCard.telefone) {
        showToast('Telefone no informado.');
        return;
      }
      const digits = currentActiveCard.telefone.replace(/\D/g, '');
      if (digits) {
        window.open(`https://web.whatsapp.com/send/?phone=55${digits}`, '_blank');
      } else {
        showToast('Telefone invlido.');
      }
    });
  }

  // ==============================================================================
  // AGENDAMENTO DE REUNIÃO (INTEGRAÇÃO VIA N8N + GOOGLE CALENDAR)
  // ==============================================================================
  const N8N_CONSULTA_URL = 'https://n8n.srv1077266.hstgr.cloud/webhook/consultar_disponibilidade_agenda';
  const N8N_AGENDAMENTO_URL = 'https://n8n.srv1077266.hstgr.cloud/webhook/agendamento_reuniao';
  const REUNIAO_CONVIDADOS = ['caiomvigreja@gmail.com', 'carlasovie@gmail.com'];

  const modalBtnAgendarReuniao = document.getElementById('modalBtnAgendarReuniao');
  const modalAgendarReuniao = document.getElementById('modalAgendarReuniao');
  const closeAgendarReuniaoModal = document.getElementById('closeAgendarReuniaoModal');
  const cancelAgendarReuniaoBtn = document.getElementById('cancelAgendarReuniaoBtn');
  const agendarReuniaoForm = document.getElementById('agendarReuniaoForm');
  const agendarReuniaoData = document.getElementById('agendarReuniaoData');
  const agendarReuniaoHorarioSlot = document.getElementById('agendarReuniaoHorarioSlot');
  const agendarReuniaoLoadingSlots = document.getElementById('agendarReuniaoLoadingSlots');
  const agendarReuniaoAvisoStatus = document.getElementById('agendarReuniaoAvisoStatus');
  const agendarReuniaoSubtitulo = document.getElementById('agendarReuniaoSubtitulo');

  function fecharModalAgendamento() {
    if (modalAgendarReuniao) {
      modalAgendarReuniao.classList.add('hidden');
    }
  }

  function resetarCamposAgendamento() {
    if (agendarReuniaoData) agendarReuniaoData.value = '';
    if (agendarReuniaoHorarioSlot) {
      agendarReuniaoHorarioSlot.innerHTML = '<option value="" disabled selected>Selecione primeiro uma data acima...</option>';
      agendarReuniaoHorarioSlot.disabled = true;
      agendarReuniaoHorarioSlot.style.cursor = 'not-allowed';
      agendarReuniaoHorarioSlot.style.backgroundColor = 'var(--surface-muted)';
    }
    if (agendarReuniaoLoadingSlots) agendarReuniaoLoadingSlots.classList.add('hidden');
    if (agendarReuniaoAvisoStatus) agendarReuniaoAvisoStatus.textContent = '';
  }

  // Gera slots padrão de 30min entre 09:00 e 17:00
  function gerarSlotsBase(dataStr) {
    const slots = [];
    for (let h = 9; h <= 16; h++) {
      ['00', '30'].forEach(min => {
        const horaStr = String(h).padStart(2, '0');
        const start = `${dataStr}T${horaStr}:${min}:00`;
        let fimHora = h;
        let fimMin = '30';
        if (min === '30') {
          fimHora = h + 1;
          fimMin = '00';
        }
        const end = `${dataStr}T${String(fimHora).padStart(2, '0')}:${fimMin}:00`;
        slots.push({
          label: `${horaStr}:${min} às ${String(fimHora).padStart(2, '0')}:${fimMin}`,
          hora: horaStr,
          minuto: min,
          start,
          end
        });
      });
    }
    return slots;
  }

  async function carregarHorariosDisponiveis(dataEscolhida) {
    if (!agendarReuniaoHorarioSlot) return;
    if (agendarReuniaoLoadingSlots) agendarReuniaoLoadingSlots.classList.remove('hidden');
    if (agendarReuniaoAvisoStatus) agendarReuniaoAvisoStatus.textContent = '';

    agendarReuniaoHorarioSlot.disabled = true;
    agendarReuniaoHorarioSlot.style.cursor = 'wait';
    agendarReuniaoHorarioSlot.innerHTML = '<option value="" disabled selected>Consultando disponibilidade na agenda...</option>';

    const slots = gerarSlotsBase(dataEscolhida);
    let busyList = [];

    try {
      const resp = await fetch(N8N_CONSULTA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataEscolhida,
          timeMin: `${dataEscolhida}T00:00:00-03:00`,
          timeMax: `${dataEscolhida}T23:59:59-03:00`
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.busy)) {
          busyList = data.busy;
        } else if (Array.isArray(data)) {
          busyList = data;
        }
      }
    } catch (err) {
      console.warn('Aviso: n8n indisponível para FreeBusy, liberando horários padrão:', err);
    } finally {
      if (agendarReuniaoLoadingSlots) agendarReuniaoLoadingSlots.classList.add('hidden');
    }

    // Exibir apenas os horários realmente DISPONÍVEIS
    agendarReuniaoHorarioSlot.innerHTML = '<option value="" disabled selected>Selecione o horário desejado...</option>';
    let countDisponiveis = 0;

    slots.forEach(slot => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();

      const isBusy = busyList.some(b => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return (slotStart < bEnd && slotEnd > bStart);
      });

        // Se estiver ocupado na agenda, não exibe como opção
        if (!isBusy) {
          const opt = document.createElement('option');
          opt.value = `${slot.hora}:${slot.minuto}`;
          opt.textContent = `${slot.label}`;
          agendarReuniaoHorarioSlot.appendChild(opt);
          countDisponiveis++;
        }
      });

    agendarReuniaoHorarioSlot.disabled = false;
    agendarReuniaoHorarioSlot.style.cursor = 'pointer';
    agendarReuniaoHorarioSlot.style.backgroundColor = 'var(--bg-input)';

    if (agendarReuniaoAvisoStatus) {
      if (countDisponiveis === 0) {
        agendarReuniaoAvisoStatus.textContent = 'Não há horários livres nesta data.';
        agendarReuniaoAvisoStatus.style.color = '#ef4444';
      } else {
        agendarReuniaoAvisoStatus.textContent = `${countDisponiveis} horários livres encontrados.`;
        agendarReuniaoAvisoStatus.style.color = '#10B981';
      }
    }
  }

  if (agendarReuniaoData) {
    agendarReuniaoData.addEventListener('change', () => {
      const val = agendarReuniaoData.value;
      if (val) {
        carregarHorariosDisponiveis(val);
      } else {
        resetarCamposAgendamento();
      }
    });
  }

  if (modalBtnAgendarReuniao) {
    modalBtnAgendarReuniao.addEventListener('click', () => {
      if (!currentActiveCard) {
        showToast('Nenhum card selecionado.');
        return;
      }
      if (agendarReuniaoSubtitulo) {
        agendarReuniaoSubtitulo.textContent = currentActiveCard.nome
          ? `Cliente: ${currentActiveCard.nome}`
          : 'Selecione data e horário para a reunião';
      }
      resetarCamposAgendamento();
      if (modalAgendarReuniao) {
        modalAgendarReuniao.classList.remove('hidden');
        if (agendarReuniaoData) agendarReuniaoData.focus();
      }
    });
  }

  if (closeAgendarReuniaoModal) {
    closeAgendarReuniaoModal.addEventListener('click', fecharModalAgendamento);
  }
  if (cancelAgendarReuniaoBtn) {
    cancelAgendarReuniaoBtn.addEventListener('click', fecharModalAgendamento);
  }
  if (modalAgendarReuniao) {
    modalAgendarReuniao.addEventListener('click', (e) => {
      if (e.target === modalAgendarReuniao) {
        fecharModalAgendamento();
      }
    });
  }

  if (agendarReuniaoForm) {
    agendarReuniaoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentActiveCard) {
        showToast('Nenhum card ativo.');
        return;
      }

      const dataVal = agendarReuniaoData ? agendarReuniaoData.value.trim() : '';
      const horarioSlotVal = agendarReuniaoHorarioSlot ? agendarReuniaoHorarioSlot.value.trim() : '';

      if (!dataVal || !horarioSlotVal) {
        showToast('Por favor, selecione data e um horário disponível.');
        return;
      }

      const [horaVal, minVal] = horarioSlotVal.split(':');
      const horarioFormatado = `${horaVal}:${minVal}`;

      // Formatar exibição no botão: dd/mm - 23:59
      let formatted = `${dataVal} - ${horarioFormatado}`;
      const parts = dataVal.split('-');
      if (parts.length === 3) {
        const [ano, mes, dia] = parts;
        formatted = `${dia}/${mes} - ${horarioFormatado}`;
      }

      // Duração de 30 minutos
      let fimHora = parseInt(horaVal, 10);
      let fimMin = '30';
      if (minVal === '30') {
        fimHora = fimHora + 1;
        fimMin = '00';
      }
      const fimHorarioFormatado = `${String(fimHora).padStart(2, '0')}:${fimMin}`;

      // Montar timestamps ISO com timezone local (ex: 2026-10-30T14:30:00.000-03:00)
      const dataHoraObj = new Date(`${dataVal}T${horarioFormatado}:00`);
      let isoComTimezone = '';
      let isoFimComTimezone = '';
      if (!isNaN(dataHoraObj.getTime())) {
        const tzo = -dataHoraObj.getTimezoneOffset();
        const dif = tzo >= 0 ? '+' : '-';
        const pad = (num) => String(Math.floor(Math.abs(num))).padStart(2, '0');
        const tzString = `${dif}${pad(tzo / 60)}:${pad(tzo % 60)}`;
        isoComTimezone = `${dataVal}T${horarioFormatado}:00.000${tzString}`;
        isoFimComTimezone = `${dataVal}T${fimHorarioFormatado}:00.000${tzString}`;
      } else {
        isoComTimezone = `${dataVal}T${horarioFormatado}:00.000-03:00`;
        isoFimComTimezone = `${dataVal}T${fimHorarioFormatado}:00.000-03:00`;
      }

      const submitBtn = document.getElementById('confirmAgendarReuniaoBtn');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ti ti-loader" style="animation: spin 1s linear infinite;" aria-hidden="true"></i> Agendando...`;
      }

      // 1. Disparar Webhook do n8n para criar na Google Agenda com convidados
      const clientName = (currentActiveCard.nome || 'Cliente').trim();
      const payload = {
        id: currentActiveCard.id,
        nome: clientName,
        titulo: clientName,
        telefone: currentActiveCard.telefone || '',
        data_reuniao: isoComTimezone,
        data_fim_reuniao: isoFimComTimezone,
        data_hora: isoComTimezone,
        data_horario_formatado: formatted,
        convidados: REUNIAO_CONVIDADOS,
        descricao: `Reunião agendada com o cliente ${clientName}.\nTelefone: ${currentActiveCard.telefone || 'Não informado'}\nID CRM: ${currentActiveCard.id || ''}`
      };

      try {
        await fetch(N8N_AGENDAMENTO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Webhook agendamento enviado com aviso de rede:', err);
      }

      // 2. Persistir na tabela crm no Supabase
      try {
        if (typeof supabase !== 'undefined' && currentActiveCard.id) {
          await supabase
            .from('crm')
            .update({ data_reuniao: isoComTimezone })
            .eq('id', currentActiveCard.id);
        }
      } catch (dbErr) {
        console.warn('Erro ao salvar data_reuniao na tabela crm:', dbErr);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }

      // 3. Atualizar objeto e interface
      currentActiveCard._reuniaoAgendada = formatted;
      currentActiveCard._reuniaoIso = isoComTimezone;
      currentActiveCard.data_reuniao = isoComTimezone;
      if (modalBtnAgendarReuniao) {
        modalBtnAgendarReuniao.innerHTML = `<i class="ti ti-calendar-check" style="font-size:16px" aria-hidden="true"></i>${formatted}`;
        modalBtnAgendarReuniao.title = `Reunião agendada para: ${formatted}`;
        modalBtnAgendarReuniao.classList.add('btn-reuniao-agendada');
      }

      fecharModalAgendamento();
      showToast('Reunião agendada com sucesso!');
    });
  }

  const modalBtnMoverEtapa = document.getElementById('modalBtnMoverEtapa');
  if (modalBtnMoverEtapa) {
    modalBtnMoverEtapa.addEventListener('click', async () => {
      if (!currentActiveCard) return;

      let stages = [];
      if (window.currentTab === 'comercial') {
        stages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
      } else if (window.currentTab === 'operacao') {
        stages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
      } else if (window.currentTab === 'judicial') {
        stages = ['negado', 'planejamento'];
      }

      const currentIndex = stages.indexOf(currentActiveCard.status);
      if (currentIndex === -1 || currentIndex === stages.length - 1) {
        showToast('O card j est na ltima etapa.');
        return;
      }

      const targetStage = stages[currentIndex + 1];

      if (targetStage === 'proposta') {
        openProposalModal(currentActiveCard, targetStage);
        closeModal(modalClientSheet);
        return;
      }
      if (targetStage === 'concedido' && window.currentTab === 'operacao') {
        openConcedidoModal(currentActiveCard, targetStage);
        closeModal(modalClientSheet);
        return;
      }

      await changeCardStatus(currentActiveCard, targetStage);
      closeModal(modalClientSheet);
    });
  }


  // --- Custom Select para Formulrio de Qualificao ---
  function initCustomSelects() {
    const selects = document.querySelectorAll('#clientAnswersForm select');
    if (selects.length === 0) return;

    if (!document.getElementById('custom-select-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-select-styles';
      style.innerHTML = `
        .custom-select-container { position: relative; width: 100%; cursor: pointer; }
        .custom-select-trigger {
          display: flex; justify-content: space-between; align-items: center;
          padding: 4px 0; font-size: 14px; color: var(--text-primary);
          background: transparent; border: none;
        }
        .custom-select-trigger:hover { opacity: 0.8; }
        .custom-select-menu {
          position: absolute; top: 100%; left: 0; width: 100%; min-width: 200px;
          background-color: #FFFFFF; border: 1px solid var(--border-light);
          border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.12);
          padding: 0.4rem; z-index: 120; max-height: 250px; overflow-y: auto;
          display: none; flex-direction: column; gap: 2px; margin-top: 4px;
          animation: fadeIn 0.15s ease-out;
        }
        .custom-select-menu.show { display: flex; }
        .custom-select-option {
          padding: 0.55rem 0.75rem; font-size: 13.6px; font-weight: 500;
          color: var(--color-neutral); border-radius: 8px; cursor: pointer;
          transition: background-color 0.15s;
        }
        .custom-select-option:hover, .custom-select-option.selected {
          background-color: var(--color-primary-light); color: var(--color-primary); font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }

    selects.forEach(select => {
      if (select.dataset.customized) return;
      select.dataset.customized = 'true';
      select.style.display = 'none';

      const container = document.createElement('div');
      container.className = 'custom-select-container';

      const trigger = document.createElement('div');
      trigger.className = 'custom-select-trigger';

      const textSpan = document.createElement('span');
      textSpan.textContent = select.options[select.selectedIndex]?.text || 'Selecione...';

      trigger.appendChild(textSpan);

      const menu = document.createElement('div');
      menu.className = 'custom-select-menu';

      Array.from(select.options).forEach((opt, idx) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'custom-select-option';
        optionEl.textContent = opt.text;
        if (select.selectedIndex === idx) optionEl.classList.add('selected');

        optionEl.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = opt.value;
          textSpan.textContent = opt.text;

          Array.from(menu.children).forEach(c => c.classList.remove('selected'));
          optionEl.classList.add('selected');

          menu.classList.remove('show');
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        menu.appendChild(optionEl);
      });

      container.appendChild(trigger);
      container.appendChild(menu);
      select.parentNode.insertBefore(container, select.nextSibling);

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShowing = menu.classList.contains('show');
        document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.remove('show'));
        if (!isShowing) {
          menu.classList.add('show');
          setTimeout(() => {
            const form = document.getElementById('clientAnswersForm');
            if (form && menu.classList.contains('show')) {
              const menuRect = menu.getBoundingClientRect();
              const formRect = form.getBoundingClientRect();
              if (menuRect.bottom > formRect.bottom) {
                form.scrollBy({ top: (menuRect.bottom - formRect.bottom) + 30, behavior: 'smooth' });
              }
            }
          }, 60);
        }
      });

      select.addEventListener('change', () => {
        textSpan.textContent = select.options[select.selectedIndex]?.text || 'Selecione...';
        Array.from(menu.children).forEach((c, idx) => {
          c.classList.toggle('selected', idx === select.selectedIndex);
        });
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.remove('show'));
    });
  }

  initCustomSelects();

  const btnVoltarQualificacao = document.getElementById('btnVoltarQualificacao');
  if (btnVoltarQualificacao) {
    btnVoltarQualificacao.addEventListener('click', () => {
      const qView = document.getElementById('qualificacaoView');
      const pView = document.getElementById('perguntasView');
      if (qView && pView) {
        pView.style.display = 'none';
        qView.style.display = 'block';
      }
    });
  }

  document.querySelectorAll('.sheet-field-group label').forEach(label => {
    label.addEventListener('click', (e) => {
      const group = label.closest('.sheet-field-group');
      if (group) {
        const btn = group.querySelector('.btn-add-info');
        if (btn && btn.style.pointerEvents !== 'none') {
          e.preventDefault();
          const fieldId = label.getAttribute('for');
          if (window.openAddInfoModal) {
            window.openAddInfoModal(fieldId, label.textContent);
          }
        }
      }
    });
  });

  const originalOpenAddInfoModal = typeof openAddInfoModal !== 'undefined' ? openAddInfoModal : null;

  const customTitles = {
    'respJaContribuiu': 'Qualidade de Segurado'
  };

  const questionsConfigOverride = {
    'respTempoContribuicao': [
      { id: 'addInfoMilitar', label: 'Prestou serviço militar?', type: 'textarea' }
    ],
    'respSolicitouBeneficio': [
      { id: 'addInfoMotivoNegativa', label: 'Se tentou e foi negado, qual foi o motivo da negativa?', type: 'textarea' },
      { id: 'addInfoNovoPedido', label: 'Foi feito um novo pedido ou protocolado algum processo?', type: 'textarea' }
    ],
    'respJaContribuiu': [
      { id: 'addInfoTempoParou', label: 'Há quanto tempo parou de contribuir?', type: 'textarea' },
      { id: 'addInfoQualidadeSegurado', label: 'Você sabe se ainda tem qualidade de segurado?', type: 'textarea' },
      { id: 'addInfo120Contribuicoes', label: 'Sabe se fez mais de 120 contribuições sem interrupção?', type: 'textarea' },
      { id: 'addInfo12MesesSem', label: 'Sabe se ficou um período maior que 12 meses sem contribuir?', type: 'textarea' }
    ],
    'respExerceuAtividadeEspecial': [
      { id: 'addInfoAtivEspecial1', label: 'Por quanto tempo, e qual era a atividade?', type: 'textarea' },
      { id: 'addInfoAtivEspecial2', label: 'As empresas ainda existem, caso precise fazer alguma correção ou pedir documentos?', type: 'textarea' },
      { id: 'addInfoAtivEspecial3', label: 'Sabe a classificação de exposição aos agentes nocivos?', type: 'textarea' },
      { id: 'addInfoAtivEspecial4', label: 'Sabe se o uso de EPIs neutraliza a exposição a ponto de anular o direito?', type: 'textarea' }
    ]
  };

  window.openAddInfoModal = function (fieldId, originalLabel) {
    const qView = document.getElementById('qualificacaoView');
    const pView = document.getElementById('perguntasView');
    const pTitle = document.getElementById('perguntasViewTitle');
    const pList = document.getElementById('perguntasViewList');

    if (qView && pView && pTitle && pList) {
      qView.style.display = 'none';
      pView.style.display = 'flex';

      const btnVoltar = document.getElementById('btnVoltarPerguntas');
      if (btnVoltar) {
        btnVoltar.onclick = () => {
          qView.style.display = 'block';
          pView.style.display = 'none';
        };
      }

      // Set Title
      if (customTitles[fieldId]) {
        pTitle.querySelector('span').textContent = customTitles[fieldId];
      } else {
        pTitle.querySelector('span').textContent = 'Perguntas';
      }

      // Populate list
      pList.innerHTML = '';
      const questions = questionsConfigOverride[fieldId] || [];

      if (questions.length === 0) {
        const div = document.createElement('div');
        div.style.padding = '10px 14px';
        div.style.border = '1px solid var(--border)';
        div.style.borderRadius = '8px';
        div.style.fontSize = '13px';
        div.style.color = 'var(--text-secondary)';
        div.textContent = 'Nenhuma pergunta adicional para este campo.';
        pList.appendChild(div);
      } else {
        let activeItem = null;
        questions.forEach((q, idx) => {
          const container = document.createElement('div');
          container.style.marginBottom = '8px';
          container.style.border = '1px solid var(--border)';
          container.style.borderRadius = '8px';
          container.style.overflow = 'hidden';
          container.style.transition = 'all 0.2s';

          const header = document.createElement('div');
          header.style.padding = '10px 14px';
          header.style.cursor = 'pointer';
          header.style.fontSize = '13px';
          header.style.color = 'var(--text-primary)';
          header.style.transition = 'all 0.2s';
          header.style.whiteSpace = 'nowrap';
          header.style.overflow = 'hidden';
          header.style.textOverflow = 'ellipsis';
          header.textContent = q.label;

          header.onmouseover = () => {
            if (activeItem !== container) {
              container.style.background = 'var(--surface-hover)';
              container.style.borderColor = 'var(--primary)';
            }
          };
          header.onmouseout = () => {
            if (activeItem !== container) {
              container.style.background = 'transparent';
              container.style.borderColor = 'var(--border)';
            }
          };

          const body = document.createElement('div');
          body.style.display = 'none';
          body.style.padding = '0 14px 14px 14px';
          body.style.flexDirection = 'column';

          const inputCont = document.createElement('div');
          inputCont.style.display = 'flex';
          inputCont.style.alignItems = 'center';
          inputCont.style.border = '1px solid #cbd5e1';
          inputCont.style.borderRadius = '6px';
          inputCont.style.padding = '4px 4px 4px 12px';
          inputCont.style.background = 'white';

          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'Nova observação...';
          input.style.flexGrow = '1';
          input.style.border = 'none';
          input.style.outline = 'none';
          input.style.fontSize = '13px';
          input.style.fontFamily = 'inherit';
          input.style.background = 'transparent';
          input.style.color = 'var(--text-primary)';

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.title = 'Enviar para Detalhes do caso';
          btn.style.background = '#2563eb'; // blue
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
          btn.style.width = '32px';
          btn.style.height = '32px';
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
          btn.style.cursor = 'pointer';
          btn.style.transition = '0.2s';
          btn.innerHTML = '<i class="ti ti-send" style="font-size: 16px;"></i>';

          btn.onclick = (e) => {
            e.stopPropagation();
            const respDetalhes = document.getElementById('respDetalhes');
            const textVal = input.value.trim();

            if (textVal) {
              let currentVal = respDetalhes.value;
              if (currentVal && !currentVal.endsWith('\n\n')) {
                currentVal += '\n\n';
              }
              respDetalhes.value = currentVal + "P: " + q.label + "\nR: " + textVal + "\n";

              const icon = btn.querySelector('i');
              icon.className = 'ti ti-check';
              setTimeout(() => {
                icon.className = 'ti ti-send';
                input.value = '';
              }, 1000);
            }
          };

          inputCont.appendChild(input);
          inputCont.appendChild(btn);
          body.appendChild(inputCont);

          container.appendChild(header);
          container.appendChild(body);

          header.onclick = () => {
            if (activeItem && activeItem !== container) {
              activeItem.querySelector('div:nth-child(2)').style.display = 'none';
              activeItem.querySelector('div:first-child').style.whiteSpace = 'nowrap';
              activeItem.style.borderColor = 'var(--border)';
              activeItem.style.background = 'transparent';
            }

            if (body.style.display === 'none') {
              body.style.display = 'flex';
              header.style.whiteSpace = 'normal'; // Expand text
              container.style.borderColor = 'var(--primary)';
              container.style.background = 'var(--surface-hover)';
              activeItem = container;
            } else {
              body.style.display = 'none';
              header.style.whiteSpace = 'nowrap';
              container.style.borderColor = 'var(--border)';
              container.style.background = 'transparent';
              activeItem = null;
            }
          };

          pList.appendChild(container);
        });
      }
    } else if (originalOpenAddInfoModal) {
      originalOpenAddInfoModal(fieldId, originalLabel);
    }
  };


  // --- Ajuda Detalhes Modal Logic ---
  const btnAjudaDetalhes = document.getElementById('btnAjudaDetalhes');
  const modalAjudaDetalhes = document.getElementById('modalAjudaDetalhes');
  const closeAjudaDetalhesModal = document.getElementById('closeAjudaDetalhesModal');

  if (btnAjudaDetalhes && modalAjudaDetalhes) {
    btnAjudaDetalhes.addEventListener('click', () => {
      modalAjudaDetalhes.classList.remove('hidden');
    });
  }

  if (closeAjudaDetalhesModal && modalAjudaDetalhes) {
    closeAjudaDetalhesModal.addEventListener('click', () => {
      modalAjudaDetalhes.classList.add('hidden');
    });
  }

  if (modalAjudaDetalhes) {
    modalAjudaDetalhes.addEventListener('click', (e) => {
      if (e.target === modalAjudaDetalhes) {
        modalAjudaDetalhes.classList.add('hidden');
      }
    });
  }

});

// ==================== LÓGICA DO FORMULÁRIO DE QUALIFICAÇÃO (TELA ÚNICA COM EVOLUÇÃO %) ====================

// Função para atualizar a barra de progresso única e o badge em porcentagem
function updateTrackingBar() {
  updateQualificationProgress();
}

function updateQualificationProgress() {
  const form = document.getElementById('clientAnswersForm');
  if (!form) return;

  // Perguntas base (10 perguntas / subperguntas principais)
  const baseQuestions = [
    document.getElementById('respJaContribuiu'),
    document.getElementById('respRecebeBeneficio'),
    document.getElementById('respSolicitouBeneficio'),
    document.getElementById('respSabeAposentar'),
    document.getElementById('respPrioridade'),
    document.getElementById('respModalidade'),
    document.getElementById('respTipoTrabalho'),
    document.getElementById('respExerceuAtividadeEspecial'),
    document.getElementById('respConsequencias'),
    document.getElementById('respFazerSozinho')
  ];

  let totalCount = 0;
  let filledCount = 0;

  baseQuestions.forEach(el => {
    if (el) {
      totalCount += 1;
      if (el.value && el.value.trim() !== '') {
        filledCount += 1;
      }
    }
  });

  // Campos condicionais atualmente ativos/visíveis
  const visibleConditionals = form.querySelectorAll('.qual-conditional-block, .qual-nested-conditional');
  visibleConditionals.forEach(block => {
    if (block.style.display !== 'none' && window.getComputedStyle(block).display !== 'none') {
      const inputs = block.querySelectorAll('textarea, select, input:not([type="hidden"])');
      inputs.forEach(input => {
        totalCount += 1;
        if (input.value && input.value.trim() !== '') {
          filledCount += 1;
        }
      });
    }
  });

  const pct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  const badge = document.getElementById('stepCounterBadge');
  if (badge) {
    badge.textContent = `${pct}%`;
  }

  const fill = document.getElementById('formProgressBarFill');
  if (fill) {
    fill.style.width = `${pct}%`;
    if (pct === 100) {
      fill.style.background = '#10b981';
    } else {
      fill.style.background = 'var(--fill-accent)';
    }
  }

  updateSubquestionToggleIndicators();
}

// Mantido para compatibilidade se invocado externamente
function updateStepView() {
  updateQualificationProgress();
}

function goToStep(step) {
  // Tela única: rolagem para o início ou foco
  const formEl = document.getElementById('clientAnswersForm');
  if (formEl) formEl.scrollTop = 0;
  updateQualificationProgress();
}

// Atualização e descarte imediato dos blocos condicionais
function updateAllConditionals() {
  updateQ1Conditionals();
  updateQ2Conditionals();
  updateQ3Conditionals();
  updateQ4Conditionals();
  updateQ7Conditionals();
  updateQ8Conditionals();
  updateQ9Conditionals();
  updateQualificationProgress();
}

// 1: Já contribuiu?
function updateQ1Conditionals() {
  const val = document.getElementById('respJaContribuiu')?.value || '';
  const simBox = document.getElementById('cond_q1_sim_box');
  const outroBox = document.getElementById('cond_q1_outro_box');
  const faz = document.getElementById('cond_q1_faz');
  const tempo = document.getElementById('cond_q1_tempo');
  const qualidade = document.getElementById('cond_q1_qualidade');

  if (val === 'Sim - e continuo contribuindo.') {
    if (simBox) simBox.style.display = 'block';
    if (outroBox) outroBox.style.display = 'none';
    if (tempo) tempo.value = '';
    if (qualidade) qualidade.value = '';
  } else if (val !== '') {
    if (simBox) simBox.style.display = 'none';
    if (outroBox) outroBox.style.display = 'flex';
    if (faz) faz.value = '';
  } else {
    if (simBox) simBox.style.display = 'none';
    if (outroBox) outroBox.style.display = 'none';
    if (faz) faz.value = '';
    if (tempo) tempo.value = '';
    if (qualidade) qualidade.value = '';
  }
  updateQualificationProgress();
}

// Subpergunta: Recebe algum benefício?
function updateQ2Conditionals() {
  const val = document.getElementById('respRecebeBeneficio')?.value || '';
  const box = document.getElementById('cond_q2_box');
  const qual = document.getElementById('cond_q2_qual');
  const vantagem = document.getElementById('cond_q2_vantagem');

  if (val === 'Sim') {
    if (box) box.style.display = 'flex';
  } else {
    if (box) box.style.display = 'none';
    if (qual) qual.value = '';
    if (vantagem) vantagem.value = '';
  }
  updateQualificationProgress();
}

// 2: Já solicitou?
function updateQ3Conditionals() {
  const val = document.getElementById('respSolicitouBeneficio')?.value || '';
  const box = document.getElementById('cond_q3_box');
  const judicial = document.getElementById('cond_q3_judicial');

  if (val && val !== 'Não - nunca tentei aposentar.') {
    if (box) box.style.display = 'block';
  } else {
    if (box) box.style.display = 'none';
    if (judicial) judicial.value = '';
  }
  updateQualificationProgress();
}

// Subpergunta: Já sabe quando vai poder se aposentar e quanto vai receber?
function updateQ4Conditionals() {
  const val = document.getElementById('respSabeAposentar')?.value || '';
  const box = document.getElementById('cond_q4_box');
  const quem = document.getElementById('cond_q4_quem_falou');
  const contratou = document.getElementById('cond_q4_contratou');
  const carac = document.getElementById('cond_q4_caracteristica');

  if (val === 'Sim') {
    if (box) box.style.display = 'flex';
  } else {
    if (box) box.style.display = 'none';
    if (quem) quem.value = '';
    if (contratou) contratou.value = '';
    if (carac) carac.value = '';
  }
  updateQualificationProgress();
}

// 3: Tipo de trabalho:
function updateQ7Conditionals() {
  const val = document.getElementById('respTipoTrabalho')?.value || '';
  const cltBox = document.getElementById('cond_q7_clt_box');
  const meiBox = document.getElementById('cond_q7_mei_box');
  const ruralBox = document.getElementById('cond_q7_rural_box');

  const cltCnis = document.getElementById('cond_q7_clt_cnis');
  const cltAliq = document.getElementById('cond_q7_clt_aliquota');
  const cltErro = document.getElementById('cond_q7_clt_erro');

  const meiCarne = document.getElementById('cond_q7_mei_carne');
  const meiCod = document.getElementById('cond_q7_mei_codigo');
  const meiDup = document.getElementById('cond_q7_mei_duplicada');
  const meiLac = document.getElementById('cond_q7_mei_lacuna');

  const ruralTerra = document.getElementById('cond_q7_rural_terra');
  const ruralHec = document.getElementById('cond_q7_rural_hectares');
  const ruralDocsProd = document.getElementById('cond_q7_rural_docs_prod');
  const ruralDocsFam = document.getElementById('cond_q7_rural_docs_fam');
  const ruralTest = document.getElementById('cond_q7_rural_testemunhas');

  if (val === 'Emprego de carteira assinada (CLT)') {
    if (cltBox) cltBox.style.display = 'flex';
    if (meiBox) meiBox.style.display = 'none';
    if (ruralBox) ruralBox.style.display = 'none';
    if (meiCarne) meiCarne.value = '';
    if (meiCod) meiCod.value = '';
    if (meiDup) meiDup.value = '';
    if (meiLac) meiLac.value = '';
    if (ruralTerra) ruralTerra.value = '';
    if (ruralHec) ruralHec.value = '';
    if (ruralDocsProd) ruralDocsProd.value = '';
    if (ruralDocsFam) ruralDocsFam.value = '';
    if (ruralTest) ruralTest.value = '';
  } else if (val === 'Empresário / Autônomo / MEI') {
    if (cltBox) cltBox.style.display = 'none';
    if (meiBox) meiBox.style.display = 'flex';
    if (ruralBox) ruralBox.style.display = 'none';
    if (cltCnis) cltCnis.value = '';
    if (cltAliq) cltAliq.value = '';
    if (cltErro) cltErro.value = '';
    if (ruralTerra) ruralTerra.value = '';
    if (ruralHec) ruralHec.value = '';
    if (ruralDocsProd) ruralDocsProd.value = '';
    if (ruralDocsFam) ruralDocsFam.value = '';
    if (ruralTest) ruralTest.value = '';
  } else if (val === 'Trabalhador rural') {
    if (cltBox) cltBox.style.display = 'none';
    if (meiBox) meiBox.style.display = 'none';
    if (ruralBox) ruralBox.style.display = 'flex';
    if (cltCnis) cltCnis.value = '';
    if (cltAliq) cltAliq.value = '';
    if (cltErro) cltErro.value = '';
    if (meiCarne) meiCarne.value = '';
    if (meiCod) meiCod.value = '';
    if (meiDup) meiDup.value = '';
    if (meiLac) meiLac.value = '';
  } else {
    if (cltBox) cltBox.style.display = 'none';
    if (meiBox) meiBox.style.display = 'none';
    if (ruralBox) ruralBox.style.display = 'none';
    if (cltCnis) cltCnis.value = '';
    if (cltAliq) cltAliq.value = '';
    if (cltErro) cltErro.value = '';
    if (meiCarne) meiCarne.value = '';
    if (meiCod) meiCod.value = '';
    if (meiDup) meiDup.value = '';
    if (meiLac) meiLac.value = '';
    if (ruralTerra) ruralTerra.value = '';
    if (ruralHec) ruralHec.value = '';
    if (ruralDocsProd) ruralDocsProd.value = '';
    if (ruralDocsFam) ruralDocsFam.value = '';
    if (ruralTest) ruralTest.value = '';
  }
  updateQualificationProgress();
}

// 4: Atividade especial?
function updateQ8Conditionals() {
  const val = document.getElementById('respExerceuAtividadeEspecial')?.value || '';
  const box = document.getElementById('cond_q8_box');
  const tempo = document.getElementById('cond_q8_tempo');
  const ppps = document.getElementById('cond_q8_ppps');
  const emp = document.getElementById('cond_q8_empresas');
  const ag = document.getElementById('cond_q8_agentes');

  if (val === 'Sim - já trabalhei nessas atividades.') {
    if (box) box.style.display = 'flex';
  } else {
    if (box) box.style.display = 'none';
    if (tempo) tempo.value = '';
    if (ppps) ppps.value = '';
    if (emp) emp.value = '';
    if (ag) ag.value = '';
  }
  updateQualificationProgress();
}

// Subpergunta Outros: Consequências
function updateQ9Conditionals() {
  const val = document.getElementById('respConsequencias')?.value || '';
  const simBox = document.getElementById('cond_q9_sim_box');
  const naoBox = document.getElementById('cond_q9_nao_box');
  const simFuturo = document.getElementById('cond_q9_sim_futuro');
  const naoAtraso = document.getElementById('cond_q9_nao_atraso');
  const naoRenda = document.getElementById('cond_q9_nao_renda_menor');

  if (val === 'Sim') {
    if (simBox) simBox.style.display = 'flex';
    if (naoBox) naoBox.style.display = 'none';
    if (naoAtraso) naoAtraso.value = '';
    if (naoRenda) naoRenda.value = '';
  } else if (val === 'Não') {
    if (simBox) simBox.style.display = 'none';
    if (naoBox) naoBox.style.display = 'flex';
    if (simFuturo) simFuturo.value = '';
  } else {
    if (simBox) simBox.style.display = 'none';
    if (naoBox) naoBox.style.display = 'none';
    if (simFuturo) simFuturo.value = '';
    if (naoAtraso) naoAtraso.value = '';
    if (naoRenda) naoRenda.value = '';
  }
  updateQualificationProgress();
}

// Inicializar ou resetar o formulário de qualificação
function initQualificationForm() {
  updateAllConditionals();
  updateQualificationProgress();
}

// Compilar todas as respostas respondidas com a nova hierarquia (1, Sub / 2, Subs / 3 / 4 / Outros: Subs)
function compileQualificationSummary() {
  const blocks = [];

  // 1. Já contribuiu?
  const q1 = document.getElementById('respJaContribuiu');
  if (q1 && q1.value) {
    let block = `1. Já contribuiu?\nR: ${q1.value}`;
    if (q1.value === 'Sim - e continuo contribuindo.') {
      const faz = document.getElementById('cond_q1_faz')?.value.trim();
      if (faz) {
        block += `\n- O que você faz?\nR: ${faz}`;
      }
    } else {
      const tempo = document.getElementById('cond_q1_tempo')?.value.trim();
      if (tempo) {
        block += `\n- Quanto tempo sem contribuir?\nR: ${tempo}`;
      }
      const qual = document.getElementById('cond_q1_qualidade')?.value.trim();
      if (qual) {
        block += `\n- Sabe se tem qualidade de segurado?\nR: ${qual}`;
      }
    }
    blocks.push(block);
  }

  // Subpergunta: Recebe algum benefício?
  const q1a = document.getElementById('respRecebeBeneficio');
  if (q1a && q1a.value) {
    let block = `- Recebe algum benefício?\nR: ${q1a.value}`;
    if (q1a.value === 'Sim') {
      const qual = document.getElementById('cond_q2_qual')?.value.trim();
      if (qual) {
        block += `\n  - Qual?\n  R: ${qual}`;
      }
      const vantagem = document.getElementById('cond_q2_vantagem')?.value.trim();
      if (vantagem) {
        block += `\n  - Entende a vantagem da aposentadoria em relação a esse benefício?\n  R: ${vantagem}`;
      }
    }
    blocks.push(block);
  }

  // 2. Já solicitou?
  const q2 = document.getElementById('respSolicitouBeneficio');
  if (q2 && q2.value) {
    let block = `2. Já solicitou?\nR: ${q2.value}`;
    if (q2.value !== 'Não - nunca tentei aposentar.') {
      const judicial = document.getElementById('cond_q3_judicial')?.value.trim();
      if (judicial) {
        block += `\n- E levou pro judicial ou fez uma nova tentativa?\nR: ${judicial}`;
      }
    }
    blocks.push(block);
  }

  // Subpergunta: Já sabe quando vai poder se aposentar e quanto vai receber?
  const q2a = document.getElementById('respSabeAposentar');
  if (q2a && q2a.value) {
    let block = `- Já sabe quando vai poder se aposentar e quanto vai receber?\nR: ${q2a.value}`;
    if (q2a.value === 'Sim') {
      const quem = document.getElementById('cond_q4_quem_falou')?.value.trim();
      if (quem) {
        block += `\n  - Quem te falou?\n  R: ${quem}`;
      }
      const contratou = document.getElementById('cond_q4_contratou')?.value.trim();
      if (contratou) {
        block += `\n  - E você já contratou essa pessoa para cuidar da sua aposentadoria?\n  R: ${contratou}`;
      }
      const carac = document.getElementById('cond_q4_caracteristica')?.value.trim();
      if (carac) {
        block += `\n  - E qual a característica mais importante que um profissional tem que ter pra você deixar ele cuidar da sua aposentadoria?\n  R: ${carac}`;
      }
    }
    blocks.push(block);
  }

  // Subpergunta: O que é mais importante para você: se aposentar mais rápido ou se aposentar com uma renda maior?
  const q2b = document.getElementById('respPrioridade');
  if (q2b && q2b.value.trim()) {
    blocks.push(`- O que é mais importante para você: se aposentar mais rápido ou se aposentar com uma renda maior?\nR: ${q2b.value.trim()}`);
  }

  // Subpergunta: O senhor sabe qual das 8 modalidades de aposentadoria é a ideal para fazer você (prioridade)?
  const q2c = document.getElementById('respModalidade');
  if (q2c && q2c.value.trim()) {
    blocks.push(`- O senhor sabe qual das 8 modalidades de aposentadoria é a ideal para fazer você (prioridade)?\nR: ${q2c.value.trim()}`);
  }

  // 3. Tipo de trabalho:
  const q3 = document.getElementById('respTipoTrabalho');
  if (q3 && q3.value) {
    let block = `3. Tipo de trabalho:\nR: ${q3.value}`;
    if (q3.value === 'Emprego de carteira assinada (CLT)') {
      const cnis = document.getElementById('cond_q7_clt_cnis')?.value.trim();
      if (cnis) block += `\n- E você sabe se todos os registros constam no CNIS?\nR: ${cnis}`;
      const aliq = document.getElementById('cond_q7_clt_aliquota')?.value.trim();
      if (aliq) block += `\n- Sabe se as empresas fizeram as contribuições na alíquota correta?\nR: ${aliq}`;
      const erro = document.getElementById('cond_q7_clt_erro')?.value.trim();
      if (erro) block += `\n- Sabe se tem algum dado que foi inserido errado no CNIS, como valor ou data?\nR: ${erro}`;
    } else if (q3.value === 'Empresário / Autônomo / MEI') {
      const carne = document.getElementById('cond_q7_mei_carne')?.value.trim();
      if (carne) block += `\n- Contribuiu no carnê ou MEI?\nR: ${carne}`;
      const cod = document.getElementById('cond_q7_mei_codigo')?.value.trim();
      if (cod) block += `\n- Sabe se todas as contribuições foram no código e na alíquota corretas?\nR: ${cod}`;
      const dup = document.getElementById('cond_q7_mei_duplicada')?.value.trim();
      if (dup) block += `\n- Alguém já analisou se tem alguma contribuição duplicada?\nR: ${dup}`;
      const lac = document.getElementById('cond_q7_mei_lacuna')?.value.trim();
      if (lac) block += `\n- Sabe se tem alguma lacuna contributiva ou se o INSS está considerando mesmo todas as suas contribuições?\nR: ${lac}`;
    } else if (q3.value === 'Trabalhador rural') {
      const terra = document.getElementById('cond_q7_rural_terra')?.value.trim();
      if (terra) block += `\n- De quem era a terra?\nR: ${terra}`;
      const hec = document.getElementById('cond_q7_rural_hectares')?.value.trim();
      if (hec) block += `\n- Quantos hectares a terra tinha?\nR: ${hec}`;
      const prod = document.getElementById('cond_q7_rural_docs_prod')?.value.trim();
      if (prod) block += `\n- Você tem documentos que comprovem a sua atividade produtiva?\nR: ${prod}`;
      const fam = document.getElementById('cond_q7_rural_docs_fam')?.value.trim();
      if (fam) block += `\n- Você tem documentos que comprovem a relação da sua família com a terra?\nR: ${fam}`;
      const test = document.getElementById('cond_q7_rural_testemunhas')?.value.trim();
      if (test) block += `\n- Existem testemunhas vivas se for necessário?\nR: ${test}`;
    }
    blocks.push(block);
  }

  // 4. Atividade especial?
  const q4 = document.getElementById('respExerceuAtividadeEspecial');
  if (q4 && q4.value) {
    let block = `4. Atividade especial?\nR: ${q4.value}`;
    if (q4.value === 'Sim - já trabalhei nessas atividades.') {
      const tempo = document.getElementById('cond_q8_tempo')?.value.trim();
      if (tempo) block += `\n- Por quanto tempo exerceu?\nR: ${tempo}`;
      const ppps = document.getElementById('cond_q8_ppps')?.value.trim();
      if (ppps) block += `\n- Você tem os PPPs ou LTCATs?\nR: ${ppps}`;
      const emp = document.getElementById('cond_q8_empresas')?.value.trim();
      if (emp) block += `\n- As empresas ainda existem caso precise pedir ou complementar documentação?\nR: ${emp}`;
      const ag = document.getElementById('cond_q8_agentes')?.value.trim();
      if (ag) block += `\n- Alguém já analisou a classificação dos agentes nocivos, impacto do exercício da função, uso de EPIs e etc?\nR: ${ag}`;
    }
    blocks.push(block);
  }

  // 5. Outros: (Consequências e Apoio Profissional)
  const q5SubA = document.getElementById('respConsequencias');
  const q5SubB = document.getElementById('respFazerSozinho');
  const hasOutrosAnswers = !!(q5SubA?.value || q5SubB?.value?.trim());

  if (hasOutrosAnswers) {
    let outrosBlock = '5. Outros:';
    if (q5SubA && q5SubA.value) {
      outrosBlock += `\n- Após recapitular as pendências, você sabe quais seriam as consequências de fazer isso de forma incorreta?\nR: ${q5SubA.value}`;
      if (q5SubA.value === 'Sim') {
        const fut = document.getElementById('cond_q9_sim_futuro')?.value.trim();
        if (fut) outrosBlock += `\n  - E como isso mudaria os seus planos de futuro?\n  R: ${fut}`;
      } else if (q5SubA.value === 'Não') {
        const atr = document.getElementById('cond_q9_nao_atraso')?.value.trim();
        if (atr) outrosBlock += `\n  - Sua aposentadoria pode atrasar por no mínimo mais 6 meses depois de completar a idade, podendo chegar a 3, 4 anos de atraso, como isso mudaria os seus planos?\n  R: ${atr}`;
        const ren = document.getElementById('cond_q9_nao_renda_menor')?.value.trim();
        if (ren) outrosBlock += `\n  - Se você descobrisse que sua renda pode ser menor do que você tem direito por alguma informação ter sido enviada errada pro INSS, como você se sentiria?\n  R: ${ren}`;
      }
    }
    if (q5SubB && q5SubB.value.trim()) {
      outrosBlock += `\n- Você acha que conseguiria fazer isso sozinho ou precisaria da ajuda de um profissional especialista para antecipar todos esses problemas e garantir que você vai se aposentar o quanto antes, com a maior renda possível, e que não vai ter negativa do INSS?\nR: ${q5SubB.value.trim()}`;
    }
    blocks.push(outrosBlock);
  }

  if (blocks.length === 0) return '';
  return `=== QUALIFICAÇÃO DO CLIENTE ===\n\n` + blocks.join('\n\n');
}


// Sincronizar as respostas da qualificação na caixa de texto 'Detalhes do caso'
function syncQualificationToDetails(isFinal = false) {
  const detalhesField = document.getElementById('respDetalhes');
  if (!detalhesField) return;

  const summary = compileQualificationSummary();
  if (!summary) {
    if (isFinal && typeof showToast === 'function') {
      showToast('Nenhuma resposta preenchida para salvar.');
    }
    return;
  }

  let currentVal = detalhesField.value.trim();
  const qualRegex = /=== QUALIFICAÇÃO DO CLIENTE ===[\s\S]*?(?=\n\n===|\n\n[A-Z]|$)/;

  if (qualRegex.test(currentVal)) {
    currentVal = currentVal.replace(qualRegex, summary).trim();
  } else if (currentVal) {
    currentVal = currentVal + '\n\n' + summary;
  } else {
    currentVal = summary;
  }

  detalhesField.value = currentVal;
  detalhesField.dispatchEvent(new Event('input', { bubbles: true }));
  detalhesField.dispatchEvent(new Event('change', { bubbles: true }));

  if (typeof saveClientData === 'function') {
    saveClientData(true);
  }

  if (isFinal) {
    if (typeof showToast === 'function') {
      showToast('Qualificação salva em Detalhes do caso!');
    }
    const btnFin = document.getElementById('btnFinalizarStep');
    if (btnFin) {
      const originalHtml = btnFin.innerHTML;
      btnFin.innerHTML = '<i class="ti ti-check" style="font-size: 16px;"></i>Salvo!';
      btnFin.style.background = '#059669';
      setTimeout(() => {
        btnFin.innerHTML = originalHtml;
        btnFin.style.background = '#10b981';
      }, 2000);
    }
  }
}

// Atualizar indicadores visuais dos toggles de subperguntas
function updateSubquestionToggleIndicators() {
  // Q1 (Subperguntas: Recebe benefício? + Condicionais de Q1)
  const btnQ1 = document.querySelector('.qual-sub-toggle[data-target="subgroup_q1"]');
  if (btnQ1) {
    const q1Ans = document.getElementById('respRecebeBeneficio')?.value;
    const q1Qual = document.getElementById('cond_q2_qual')?.value?.trim();
    const q1Vant = document.getElementById('cond_q2_vantagem')?.value?.trim();
    const q1Faz = document.getElementById('cond_q1_faz')?.value?.trim();
    const q1Tempo = document.getElementById('cond_q1_tempo')?.value?.trim();
    const q1Qualidade = document.getElementById('cond_q1_qualidade')?.value?.trim();
    const hasQ1 = !!(q1Ans || q1Qual || q1Vant || q1Faz || q1Tempo || q1Qualidade);
    // btnQ1.classList.toggle('has-answers', hasQ1);
  }

  // Q2 (Subperguntas: Aposentadoria, Prioridade, Modalidade + Condicional Q2)
  const btnQ2 = document.querySelector('.qual-sub-toggle[data-target="subgroup_q2"]');
  if (btnQ2) {
    const q2Apos = document.getElementById('respSabeAposentar')?.value;
    const q2Prio = document.getElementById('respPrioridade')?.value?.trim();
    const q2Mod = document.getElementById('respModalidade')?.value?.trim();
    const q2Quem = document.getElementById('cond_q4_quem_falou')?.value?.trim();
    const q2Judicial = document.getElementById('cond_q3_judicial')?.value?.trim();
    const hasQ2 = !!(q2Apos || q2Prio || q2Mod || q2Quem || q2Judicial);
    // btnQ2.classList.toggle('has-answers', hasQ2);
  }

  // Q3 (Subperguntas: Condicionais de CLT, MEI, Rural)
  const btnQ3 = document.querySelector('.qual-sub-toggle[data-target="subgroup_q3"]');
  if (btnQ3) {
    const q3Cnis = document.getElementById('cond_q7_clt_cnis')?.value?.trim();
    const q3Aliq = document.getElementById('cond_q7_clt_aliquota')?.value?.trim();
    const q3Erro = document.getElementById('cond_q7_clt_erro')?.value?.trim();
    const q3Carne = document.getElementById('cond_q7_mei_carne')?.value?.trim();
    const q3Codigo = document.getElementById('cond_q7_mei_codigo')?.value?.trim();
    const q3Dup = document.getElementById('cond_q7_mei_duplicada')?.value?.trim();
    const q3Lac = document.getElementById('cond_q7_mei_lacuna')?.value?.trim();
    const q3Terra = document.getElementById('cond_q7_rural_terra')?.value?.trim();
    const q3Hec = document.getElementById('cond_q7_rural_hectares')?.value?.trim();
    const q3Prod = document.getElementById('cond_q7_rural_docs_prod')?.value?.trim();
    const q3Fam = document.getElementById('cond_q7_rural_docs_fam')?.value?.trim();
    const q3Test = document.getElementById('cond_q7_rural_testemunhas')?.value?.trim();
    const hasQ3 = !!(q3Cnis || q3Aliq || q3Erro || q3Carne || q3Codigo || q3Dup || q3Lac || q3Terra || q3Hec || q3Prod || q3Fam || q3Test);
    // btnQ3.classList.toggle('has-answers', hasQ3);
  }

  // Q4 (Subperguntas: Condicionais de Atividade Especial)
  const btnQ4 = document.querySelector('.qual-sub-toggle[data-target="subgroup_q4"]');
  if (btnQ4) {
    const q4Tempo = document.getElementById('cond_q8_tempo')?.value?.trim();
    const q4Ppps = document.getElementById('cond_q8_ppps')?.value?.trim();
    const q4Empresas = document.getElementById('cond_q8_empresas')?.value?.trim();
    const q4Agentes = document.getElementById('cond_q8_agentes')?.value?.trim();
    const hasQ4 = !!(q4Tempo || q4Ppps || q4Empresas || q4Agentes);
    // btnQ4.classList.toggle('has-answers', hasQ4);
  }

  // Q5 (Subperguntas: Consequências e Apoio Profissional)
  const btnQ5 = document.querySelector('.qual-sub-toggle[data-target="subgroup_q5"]');
  if (btnQ5) {
    const q5Cons = document.getElementById('respConsequencias')?.value;
    const q5Faz = document.getElementById('respFazerSozinho')?.value?.trim();
    const q5Fut = document.getElementById('cond_q9_sim_futuro')?.value?.trim();
    const q5Atr = document.getElementById('cond_q9_nao_atraso')?.value?.trim();
    const q5Renda = document.getElementById('cond_q9_nao_renda_menor')?.value?.trim();
    const hasQ5 = !!(q5Cons || q5Faz || q5Fut || q5Atr || q5Renda);
    // btnQ5.classList.toggle('has-answers', hasQ5);
  }
}

// Configurar o comportamento de acordeão exclusivo dos toggles (quando um abre, os outros recolhem)
function setupSubquestionToggles() {
  const toggles = document.querySelectorAll('.qual-sub-toggle');
  toggles.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (!target) return;

      const isCurrentlyCollapsed = target.classList.contains('collapsed');

      // Fechar todos os contêineres e desativar todos os botões de toggle (comportamento acordeão exclusivo)
      document.querySelectorAll('.qual-subquestions-container').forEach(c => {
        c.classList.add('collapsed');
      });
      toggles.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-expanded', 'false');
      });

      // Se estava recolhido, abrir apenas este
      if (isCurrentlyCollapsed) {
        target.classList.remove('collapsed');
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    };
  });
}

// Salvar em Detalhes do caso e limpar o formulário (preservando as perguntas numeradas pré-preenchidas 1, 2, 3 e 4)
function saveAndClearQualificationForm() {
  // 1. Sincronizar respostas preenchidas para 'Detalhes do caso'
  syncQualificationToDetails(true);

  // 2. Limpar todas as sub-perguntas e campos condicionais, mantendo as perguntas numeradas pré-preenchidas
  const preservedNumberedIds = [
    'respJaContribuiu',
    'respSolicitouBeneficio',
    'respTipoTrabalho',
    'respExerceuAtividadeEspecial'
  ];

  const form = document.getElementById('clientAnswersForm');
  if (form) {
    // Limpar selects que NÃO são perguntas numeradas
    form.querySelectorAll('select').forEach(sel => {
      if (!preservedNumberedIds.includes(sel.id)) {
        sel.value = '';
      }
    });

    // Limpar todos os textareas
    form.querySelectorAll('textarea').forEach(tx => {
      tx.value = '';
    });

    // Limpar inputs de texto extras (se houver)
    form.querySelectorAll('input:not([type="hidden"])').forEach(inp => {
      if (!preservedNumberedIds.includes(inp.id)) {
        inp.value = '';
      }
    });
  }

  // 3. Atualizar condicionais (os selects preservados manterão seus blocos abertos se aplicável, sub-condicionais fecharão)
  updateAllConditionals();

  // 4. Atualizar barra de porcentagem e indicadores dos toggles
  updateQualificationProgress();

  // Recolher todos os contêineres de subperguntas (acordeão fechado por padrão)
  document.querySelectorAll('.qual-subquestions-container').forEach(c => c.classList.add('collapsed'));
  document.querySelectorAll('.qual-sub-toggle').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-expanded', 'false'); });

  // 5. Salvar ficha do cliente no banco
  if (typeof saveClientData === 'function') {
    saveClientData(true);
  }

  // 6. Feedback visual no botão de reload
  const btn = document.getElementById('btnReloadForm') || document.getElementById('btnConfirmQual');
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      icon.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      icon.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        icon.style.transition = 'none';
        icon.style.transform = 'none';
      }, 500);
    }
    btn.style.transform = 'scale(0.9)';
    btn.style.borderColor = 'var(--text-accent)';
    setTimeout(() => {
      btn.style.transform = 'none';
      btn.style.borderColor = 'var(--border)';
    }, 250);
  }

  if (typeof showToast === 'function') {
    showToast('Respostas inseridas em Detalhes do caso e formulário limpo!');
  }
}

// Mantido para compatibilidade
function finalizeQualificationForm() {
  saveAndClearQualificationForm();
}
function resetQualificationFormAnswers() {
  saveAndClearQualificationForm();
}

// Configuração dos Event Listeners do formulário de qualificação
function setupQualificationEventListeners() {
  const btnConfirm = document.getElementById('btnConfirmQual') || document.getElementById('btnReloadForm');
  const btnFinLegacy = document.getElementById('btnFinalizarStep');
  const form = document.getElementById('clientAnswersForm');

  if (btnConfirm) {
    btnConfirm.onclick = () => {
      saveAndClearQualificationForm();
    };
  }

  if (btnFinLegacy) {
    btnFinLegacy.onclick = () => {
      saveAndClearQualificationForm();
    };
  }

  // Inicializar toggles das subperguntas
  setupSubquestionToggles();

  // Atualização em tempo real de progresso e sincronização
  if (form) {
    form.addEventListener('input', () => {
      updateQualificationProgress();
    });
    form.addEventListener('change', () => {
      updateQualificationProgress();
    });
  }

  // Listeners de mudança nas perguntas condicionais
  const conditionMap = {
    'respJaContribuiu': updateQ1Conditionals,
    'respRecebeBeneficio': updateQ2Conditionals,
    'respSolicitouBeneficio': updateQ3Conditionals,
    'respSabeAposentar': updateQ4Conditionals,
    'respTipoTrabalho': updateQ7Conditionals,
    'respExerceuAtividadeEspecial': updateQ8Conditionals,
    'respConsequencias': updateQ9Conditionals
  };

  Object.entries(conditionMap).forEach(([id, handler]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', handler);
    }
  });

  initQualificationForm();
}

document.addEventListener('DOMContentLoaded', () => {
  setupQualificationEventListeners();
});
