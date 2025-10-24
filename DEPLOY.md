# 🚀 Guia de Deploy - Capital no Cloudflare

Este guia te ajudará a fazer o deploy da aplicação Capital no Cloudflare Pages com banco de dados D1.

## 📋 Pré-requisitos

- Conta no Cloudflare (gratuita)
- Node.js 18+ instalado
- Git instalado

## 🔧 Configuração Automática

### Opção 1: Script Automático (Recomendado)

```bash
# Dar permissão e executar script
chmod +x scripts/setup-cloudflare.sh
./scripts/setup-cloudflare.sh
```

O script vai:
- ✅ Instalar Wrangler (se necessário)
- ✅ Fazer login no Cloudflare
- ✅ Criar bancos D1 de produção e desenvolvimento
- ✅ Configurar schema do banco
- ✅ Gerar JWT secret
- ✅ Fazer build da aplicação

### Opção 2: Configuração Manual

#### 1. Instalar Wrangler CLI

```bash
npm install -g wrangler
```

#### 2. Login no Cloudflare

```bash
wrangler login
```

#### 3. Criar Banco de Dados D1

```bash
# Banco de produção
wrangler d1 create capital-db

# Banco de desenvolvimento
wrangler d1 create capital-db-dev
```

Copie os `database_id` gerados e atualize no `wrangler.toml`.

#### 4. Executar Schema

```bash
# Produção
wrangler d1 execute capital-db --file=database/schema.sql

# Desenvolvimento
wrangler d1 execute capital-db-dev --file=database/schema.sql
```

#### 5. Configurar Variáveis de Ambiente

```bash
# Gerar e configurar JWT secret
wrangler secret put JWT_SECRET
```

## 📦 Deploy

### Deploy Manual

```bash
# Build da aplicação
npm run build

# Deploy no Cloudflare Pages
npx wrangler pages deploy dist
```

### Deploy Automático via Git

1. **Conectar repositório ao Cloudflare Pages:**
   - Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Vá para Pages > Create a project
   - Conecte seu repositório GitHub/GitLab

2. **Configurar build settings:**
   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: (deixe vazio)
   ```

3. **Configurar variáveis de ambiente:**
   - `JWT_SECRET`: Sua chave secreta (gere com `openssl rand -base64 32`)
   - `ENVIRONMENT`: `production`

4. **Configurar Function Invocation Routes:**
   - Na aba Functions, adicione route: `/api/*`

## 🗄️ Gerenciamento do Banco

### Visualizar Dados

```bash
# Listar tabelas
wrangler d1 execute capital-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Ver usuários
wrangler d1 execute capital-db --command="SELECT id, email, name, created_at FROM users LIMIT 10;"

# Ver transações
wrangler d1 execute capital-db --command="SELECT id, description, amount, date FROM transactions ORDER BY date DESC LIMIT 10;"
```

### Backup do Banco

```bash
# Fazer backup
wrangler d1 export capital-db --output=backup.sql

# Restaurar backup
wrangler d1 execute capital-db --file=backup.sql
```

### Reset do Banco

```bash
# ⚠️ CUIDADO: Apaga todos os dados
wrangler d1 execute capital-db --command="DROP TABLE IF EXISTS users, categories, transactions, investments, goals, budget_divisions, budget_categories, budget_allocations, goal_allocations;"

# Recriar schema
wrangler d1 execute capital-db --file=database/schema.sql
```

## 🌐 Configuração de Domínio

### Usar Domínio Próprio

1. **No Cloudflare Dashboard:**
   - Vá para Pages > Seu projeto
   - Aba Custom domains
   - Add custom domain

2. **Configurar DNS:**
   - Adicione registro CNAME apontando para `[seu-projeto].pages.dev`

### Usar Subdomínio Cloudflare

O Cloudflare fornece automaticamente uma URL: `https://[seu-projeto].pages.dev`

## 🔧 Desenvolvimento Local

### Executar com D1 Local

```bash
# Desenvolvimento com banco local
wrangler pages dev dist --d1 DB=capital-db-dev

# Ou usar o comando npm
npm run dev:cloudflare
```

### Testar API Localmente

```bash
# Testar endpoints
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'
```

## 🔍 Monitoramento e Logs

### Visualizar Logs

```bash
# Logs em tempo real
wrangler pages deployment tail

# Logs específicos
wrangler pages deployment list
wrangler pages deployment tail [DEPLOYMENT_ID]
```

### Métricas

- Acesse o dashboard do Cloudflare
- Vá para Analytics & Logs
- Monitore requests, errors e performance

## 🛠️ Troubleshooting

### Erro: "Database not found"

```bash
# Verificar se banco existe
wrangler d1 list

# Verificar wrangler.toml
cat wrangler.toml | grep database_id
```

### Erro: "JWT_SECRET not configured"

```bash
# Configurar secret
wrangler secret put JWT_SECRET
```

### Erro de CORS

Verifique se os headers CORS estão configurados no `server/worker.ts`.

### Build Failures

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📱 Funcionalidades da Aplicação

### ✅ O que funciona após deploy:

- 🔐 Sistema de autenticação (login/registro)
- 💾 Dados salvos na nuvem (D1 Database)
- 📱 Acesso de qualquer dispositivo
- 🔄 Sincronização automática
- 📊 Todas as funcionalidades do Capital
- 🏦 Integração Open Finance/Belvo (configuração adicional)

### 🎯 Benefícios:

- ✅ Dados seguros na nuvem
- ✅ Acesso de qualquer lugar
- ✅ Performance global (CDN)
- ✅ SSL automático
- ✅ Escalabilidade automática
- ✅ Custo baixo/gratuito

## 🆘 Suporte

- [Documentação Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Documentação D1](https://developers.cloudflare.com/d1/)
- [Discord Cloudflare](https://discord.cloudflare.com)
- [Issues no GitHub](seu-repositorio/issues)

---

🎉 **Pronto!** Sua aplicação Capital está rodando na nuvem!
