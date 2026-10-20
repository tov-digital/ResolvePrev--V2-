# NavItem

Item da sidebar com ícone, rótulo e contador opcional; o item ativo ganha fundo amarelo suave e um traço amarelo à esquerda.

## Regras de uso

- Ícone de traço com 20px e rótulo curto, sempre um substantivo (“Dashboard”, “Usuários”).
- Só um item com `active` por vez. Ele recebe `aria-current="page"`.
- Contadores em `ink-muted` à direita, só quando ajudam (pendências).
