# ResolvePrev | Soluções Previdenciárias

Portal de acesso moderno e responsivo para o sistema do escritório **ResolvePrev Soluções Previdenciárias**, desenvolvido com foco em alta performance, usabilidade e design sofisticado.

---

## 🎨 Design System & Estética
- **Cor Principal**: Branco (`#FFFFFF`) para cards e elementos principais.
- **Paleta de Cores**:
  - **Primary**: Azul Oceano (`#1E5080`)
  - **Secondary**: Verde Oliva/Lima (`#A3CA5C`)
  - **Tertiary**: Azul Celeste (`#268DC4`)
  - **Neutral**: Grafite Escuro (`#17202A`)
- **Tipografia**: [Inter](https://fonts.google.com/specimen/Inter) (Headlines, Body e Labels).
- **Ativos Visuais**: Foto oficial da fachada em alta resolução (`Fachada.webp`) com filtro suave e logomarca corporativa (`resolveprev-logo.png`).

---

## ✨ Funcionalidades
1. **Formulário de Login**:
   - Campos com ícones decorativos para **E-mail** e **Senha**.
   - Botão para **mostrar/ocultar senha** (toggle com ícone de olho).
   - Opção de **"Lembrar acesso"**.
   - Animação de carregamento (*spinner*) no botão "Entrar".

2. **Integração com Webhook (Recuperação de Senha)**:
   - Modal interativo para solicitação de redefinição de senha.
   - Disparo automático de requisição `POST` via `fetch` para o webhook do **n8n**:
     `https://n8n.srv1077266.hstgr.cloud/webhook/recuperar_senha`
   - Mensagem de confirmação clara e notificação do tipo *Toast*.

3. **Modal de Primeiro Acesso**:
   - Formulário para solicitação de cadastro inicial e ativação de conta.

4. **Tela Pós-Login**:
   - Transição suave pós-autenticação para o painel em branco preparado para o recebimento dos próximos módulos.
   - Cabeçalho funcional com identificação do usuário logado e botão de **"Sair"** (Logout).

---

## 📂 Estrutura de Arquivos

```
ResolvePrev/
├── assets/
│   └── images/
│       ├── Fachada.webp          # Imagem de fundo oficial
│       └── resolveprev-logo.png  # Logomarca oficial ResolvePrev
├── index.html                    # Estrutura HTML5 semântica
├── styles.css                    # Estilização CSS3 Vanilla (Design System)
├── script.js                    # Lógica de interatividade e integrações
├── README.md                     # Documentação do projeto
├── LICENSE                       # Licença do projeto
└── .gitignore                    # Arquivos ignorados pelo Git
```

---

## 🚀 Como Executar Localmente

Não requer instalação de dependências pesadas. Basta abrir o arquivo `index.html` em qualquer navegador web moderno:

1. Clone o repositório:
   ```bash
   git clone https://github.com/tov-digital/ResolvePrev.git
   ```
2. Navegue até a pasta do projeto e abra o `index.html` no seu navegador.
3. (Opcional) Para rodar através de um servidor HTTP local:
   ```bash
   npx serve -p 8085 .
   ```

---

## 📄 Licença
Este projeto está sob a licença MIT - consulte o arquivo [LICENSE](file:///c:/Users/User/OneDrive/Desktop/Meus%20Documentos/Projetos/ResolvePrev/LICENSE) para mais detalhes.

© 2026 ResolvePrev. Todos os direitos reservados.
