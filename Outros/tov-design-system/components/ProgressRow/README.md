# ProgressRow

Linha de indicador do funil, com sigla, nome, descrição, barra e percentual com a fração, em fundo suave dentro de um cartão.

## Regras de uso

- Passe `count` e `total` e a porcentagem é calculada e escrita no padrão brasileiro (64,2%).
- Cada etapa usa um tom: a sigla (`codeTone`) e a barra (`tone`) têm a mesma cor.
- A descrição é cortada com reticências quando não cabe; escreva em até 4 palavras.
