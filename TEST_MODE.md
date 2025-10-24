# Modo de Teste (Test Mode)

A aplicação agora suporta um modo de teste que permite acessar a ferramenta sem necessidade de fazer login.

## Como Ativar

### Opção 1: Parâmetro de URL
Adicione `?testMode=true` à URL da aplicação:

```
http://localhost:5173/?testMode=true
```

### Opção 2: Variável de Ambiente
Configure a variável de ambiente `VITE_TEST_MODE` como `true`:

```bash
VITE_TEST_MODE=true npm run dev
```

## Funcionamento

Quando o modo de teste está ativado:
- Um usuário fictício é automaticamente criado e autenticado
- Você pode acessar o dashboard sem fazer login
- Email de teste: `test@example.com`
- Nome de teste: `Usuário Teste`

## Desativar

Para desativar o modo de teste, simplesmente remova o parâmetro `?testMode=true` da URL ou defina `VITE_TEST_MODE=false`.

## Nota

Este modo é destinado apenas para testes e desenvolvimento local. Certifique-se de que não está ativado em produção.
