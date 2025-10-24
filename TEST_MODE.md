# Modo de Teste (Test Mode)

A aplicação agora suporta um modo de teste que permite acessar a ferramenta sem necessidade de fazer login.

## Como Ativar

### Opção 1: Parâmetro de URL (Recomendado)
Adicione `?testMode=true` à URL da aplicação. Funciona em qualquer rota:

```
http://localhost:5173/?testMode=true
http://localhost:5173/capital?testMode=true
https://seu-dominio.com/?testMode=true
```

**Nota:** Após ativar pela URL, o test mode persiste durante toda a sessão do navegador. Você pode navegar para outras rotas sem precisar adicionar o parâmetro novamente.

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
- O teste mode persiste durante a sessão (até fechar o navegador ou fazer logout)

## Desativar

Existem duas formas de desativar o modo de teste:

1. **Fazer logout** através da interface da aplicação (limpa a sessão)
2. **Fechar o navegador** (a sessão é perdida)
3. **Limpar sessionStorage** no console do navegador:
   ```javascript
   sessionStorage.removeItem('testMode');
   ```

## Nota

Este modo é destinado apenas para testes e desenvolvimento local. Certifique-se de que não está ativado em produção.
