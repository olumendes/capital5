# Configuração do Open Finance para Produção

Este documento explica como configurar o sistema Capital para usar APIs reais do Open Finance em ambiente de produção.

## 📋 Pré-requisitos

### 1. Registro no Open Finance Brasil
Antes de usar em produção, você precisa:

- Registrar sua aplicação no **Diretório Central do Open Finance Brasil**
- Obter certificados digitais válidos
- Configurar credenciais OAuth2 para cada instituição financeira

### 2. Instituições Suportadas

O sistema está configurado para trabalhar com:

- **Nubank** - Banco digital
- **Banco Inter** - Banco digital laranja  
- **RecargaPay** - Cartão de crédito digital

## 🔧 Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Configure as seguintes variáveis:

```env
# Credenciais da sua aplicação registrada
VITE_OPEN_FINANCE_CLIENT_ID=sua_client_id_aqui
VITE_OPEN_FINANCE_CLIENT_SECRET=sua_client_secret_aqui

# URL de callback (deve ser registrada na instituição)
VITE_OPEN_FINANCE_REDIRECT_URI=https://seu-dominio.com/auth/callback
```

### 2. URLs de Callback

Certifique-se de que as seguintes URLs estão registradas em cada instituição:

- **Produção**: `https://seu-dominio.com/auth/callback`
- **Staging**: `https://staging.seu-dominio.com/auth/callback`
- **Desenvolvimento**: `http://localhost:5173/auth/callback`

### 3. Certificados (Produção)

Para ambiente de produção real, você precisará:

1. **Certificado de Transporte (TLS)**
   - Usado para comunicação HTTPS
   - Emitido por autoridade certificadora reconhecida

2. **Certificado de Assinatura (JWS)**
   - Usado para assinar requisições JWT
   - Específico do Open Finance Brasil

## 🚀 Deploy para Produção

### 1. Build da Aplicação

```bash
npm run build
```

### 2. Configuração do Servidor

Certifique-se de que seu servidor:

- Suporta HTTPS (obrigatório)
- Tem as variáveis de ambiente configuradas
- Pode acessar as APIs das instituições financeiras

### 3. Domínio e SSL

- Configure um domínio válido
- Instale certificado SSL/TLS
- Configure redirects HTTP → HTTPS

## 🔒 Segurança

### Boas Práticas

1. **Nunca exponha credenciais** no código fonte
2. **Use HTTPS** em todas as comunicações
3. **Valide tokens** antes de usar
4. **Implemente rate limiting** nas requisições
5. **Monitore logs** de autenticação
6. **Rotacione credenciais** periodicamente

### Variáveis Sensíveis

- `CLIENT_SECRET`: Nunca exponha no frontend
- Tokens de acesso: Armazene de forma segura
- Dados do usuário: Criptografe quando necessário

## 📊 Monitoramento

### Logs Importantes

Monitore os seguintes eventos:

- Tentativas de conexão com bancos
- Falhas de autenticação
- Erros de sincronização
- Renovação de tokens

### Métricas Sugeridas

- Taxa de sucesso de conexões
- Tempo de resposta das APIs
- Volume de transações sincronizadas
- Erros por instituição

## 🧪 Teste em Produção

### 1. Ambiente de Sandbox

Antes de usar dados reais:

1. Use ambientes de sandbox das instituições
2. Teste fluxo completo de OAuth2
3. Valide importação de transações
4. Verifique tratamento de erros

### 2. Testes de Integração

```bash
# Teste as configurações
npm run test:integration

# Teste específico do Open Finance
npm run test:openfinance
```

## 🔧 Troubleshooting

### Problemas Comuns

**Erro: "Credenciais inválidas"**
- Verifique `CLIENT_ID` e `CLIENT_SECRET`
- Confirme se credenciais estão ativas na instituição

**Erro: "Redirect URI inválida"**
- Verifique se URL está registrada na instituição
- Confirme protocolo (HTTPS obrigatório em produção)

**Erro: "Token expirado"**
- Sistema renova automaticamente
- Verifique se `REFRESH_TOKEN` está válido

**Erro: "Permissão negada"**
- Confirme escopos solicitados
- Verifique se usuário autorizou todas as permissões

### Logs de Debug

Para ativar logs detalhados:

```env
VITE_DEBUG_OPEN_FINANCE=true
VITE_LOG_LEVEL=debug
```

## 📞 Suporte

### Recursos Oficiais

- [Open Finance Brasil](https://openbanking-brasil.github.io/areadesenvolvedor/)
- [Documentação Técnica](https://openbanking-brasil.github.io/specs-seguranca/)
- [Ambiente de Testes](https://web.conformance.directory.openbankingbrasil.org.br/)

### Contato com Instituições

- **Nubank**: Acesse o portal de desenvolvedores
- **Banco Inter**: Entre em contato com a equipe de APIs
- **RecargaPay**: Consulte a documentação da API

## 📈 Próximos Passos

Após configurar produção:

1. Implemente monitoramento avançado
2. Configure alertas de falha
3. Adicione métricas de negócio
4. Otimize performance das sincronizações
5. Implemente cache inteligente
6. Adicione suporte a mais instituições

---

**⚠️ Importante**: Este sistema implementa as especificações do Open Finance Brasil. Certifique-se de estar em conformidade com as regulamentações do Banco Central do Brasil antes de usar em produção.
