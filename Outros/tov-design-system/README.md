# Tov

O design system da Tov para produtos digitais: painéis, CRMs e páginas. Ele leva a identidade da marca (preto, branco e o ponto amarelo) para uma interface **moderna, limpa e suave**, com fundo cinza bem claro, cartões brancos muito arredondados, tons pastéis para status e o amarelo usado só como destaque.

## Princípios

1. **O ponto é o destaque.** O amarelo `brand` aparece pouco: na ação mais importante, no item de navegação ativo, na aba selecionada e nas barras de progresso. Se tudo é amarelo, nada se destaca.
2. **Suave, não apagado.** Cantos generosos (`radius-xl` nos cartões, `radius-pill` em selos e barras), sombras quase invisíveis (`shadow-card`) e cores de status sempre em versão `*-soft` de fundo. O contraste do texto continua alto (4,5:1 ou mais).
3. **Camadas claras.** `bg` (cinza) → `surface` (cartão branco) → `surface-muted` (linhas e tiles dentro do cartão). Nunca coloque um cartão com sombra dentro de outro.
4. **Dados primeiro.** Números grandes em Montserrat (`metric`) e rótulos pequenos em Inter (`caption`). Toda barra vem acompanhada do valor escrito.
5. **Direto, com ponto final.** Textos curtos, no infinitivo para ações (“Agendar reunião”) e frases afirmativas.

## Cores

- **Base neutra:** `bg`, `surface`, `surface-muted`, `surface-hover`, `line` (divisórias decorativas) e `line-strong` (borda de campos, 3:1).
- **Texto:** `ink` para texto principal e `ink-muted` para o secundário. Os dois passam de 4,5:1 sobre todas as superfícies.
- **Marca:** `primary` é o preto Tov, usado no botão principal. `brand` é o amarelo Tov (#FFDA0F), sempre com `on-brand` (preto) por cima. `brand-soft` e `brand-ink` servem para fundos amarelados com texto legível. **Nunca use o amarelo como cor de texto sobre fundo claro.**
- **Status:** `info`, `success`, `warning`, `danger` e `violet` (categórica). Cada um tem um par `*-soft` para fundo, e o texto vai na cor cheia.
- **Tema escuro:** todos os tokens têm valor no tema “Escuro”. O amarelo continua o mesmo e o `focus` passa a ser amarelo.

## Tipografia

- **Montserrat** (`--font-display`): títulos (`display`, `h1`–`h3`) e números (`metric`). É a fonte do MIV, geométrica como a logo.
- **Inter** (`--font-sans`): todo o texto de interface (`body-lg`, `body`, `label`, `caption`, `overline`). É neutra e muito legível em tamanhos pequenos.
- As duas vêm do Google Fonts. Carregue `Inter:wght@400;500;600;700` e `Montserrat:wght@600;700;800;900`.
- Porcentagens no padrão brasileiro: vírgula decimal (64,2%).

## Espaço, forma e profundidade

- **Espaçamento** em múltiplos de 4: `space-1` (4px) a `space-12` (48px). O padding de cartões é `space-6`. O gap entre cartões é `space-6` ou `space-8`.
- **Raios:**
  - `radius-sm` (8px): siglas;
  - `radius-md` (12px): botões, campos, navegação e tiles;
  - `radius-lg` (16px): linhas internas;
  - `radius-xl` (24px): cartões e modais;
  - `radius-pill`: selos, barras e avatares.
- **Sombras:** `shadow-card` em cartões, `shadow-pop` em menus e `shadow-modal` em modais. A separação vem principalmente do fundo cinza, não da sombra.
- **Foco:** anel `focus` de 2px com 2px de respiro em todo controle.
- **Alvos de toque:** botões, abas e itens de navegação têm no mínimo 44px de altura.

## Iconografia

São ícones de traço de 1,8px com pontas arredondadas, numa grade de 24px, e herdam `currentColor`. O componente `Icon` traz o conjunto básico. Para ícones novos, use a biblioteca Lucide, que segue a mesma linguagem. Use sempre o ícone acompanhado de texto ou com `aria-label`. Nada de emoji na interface.

## Logos

Os arquivos estão no grupo **Logos**. Para regras completas (área de proteção, redução mínima e usos incorretos), consulte o Manual de Identidade Visual da Tov. Na interface:
- use a logo preta na sidebar clara;
- use a logo branca em fundo `primary`;
- use o símbolo “t.” como favicon e avatar da marca.

## Componentes

`window.Tov` traz os seguintes componentes React (detalhes de cada um ficam no seu README):

| Componente | Para que serve |
| --- | --- |
| `Button` | Ações |
| `Badge` | Status e siglas |
| `Avatar` | Pessoa |
| `Card` | Superfície base |
| `Input` | Campo de formulário |
| `Tabs` | Abas |
| `StatTile` | Dado curto |
| `ProgressBar` | Barra de progresso |
| `ProgressRow` | Linha de indicador do funil |
| `NavItem` | Item da sidebar |
| `Modal` | Janela sobre a tela |
| `Icon` | Ícones de traço |

Para HTML puro, as classes `tv-*` em `components/bundle.css` usam os mesmos tokens.
