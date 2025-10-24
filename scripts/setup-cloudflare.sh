#!/bin/bash

# Script para configurar e fazer deploy no Cloudflare
# Execute: chmod +x scripts/setup-cloudflare.sh && ./scripts/setup-cloudflare.sh

echo "🚀 Configurando Capital para Cloudflare..."

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler não encontrado. Instalando..."
    npm install -g wrangler
fi

echo "📋 Verificando login no Cloudflare..."
wrangler whoami || {
    echo "🔑 Faça login no Cloudflare:"
    wrangler login
}

# Helper para extrair UUID do database_id
extract_db_id() {
  echo "$1" | sed -n 's/.*database_id = "\([^"]*\)".*/\1/p' | head -n1
}

find_db_id_by_name() {
  local name="$1"
  wrangler d1 list 2>/dev/null | grep -E "\b${name}\b" -m1 | grep -Eo '[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}' | head -n1
}

echo "🗄️ Criando banco de dados D1..."
# Criar banco de produção
PROD_DB_OUTPUT=$(wrangler d1 create capital-db 2>&1)
PROD_DB_ID=$(extract_db_id "$PROD_DB_OUTPUT")

# Fallback: tenta pela listagem
if [ -z "$PROD_DB_ID" ]; then
  PROD_DB_ID=$(find_db_id_by_name "capital-db")
fi

if [ -z "$PROD_DB_ID" ]; then
    echo "❌ Erro ao criar banco de produção. Saída:"
    echo "$PROD_DB_OUTPUT"
    exit 1
fi

echo "✅ Banco de produção criado: $PROD_DB_ID"

# Criar banco de desenvolvimento
DEV_DB_OUTPUT=$(wrangler d1 create capital-db-dev 2>&1)
DEV_DB_ID=$(extract_db_id "$DEV_DB_OUTPUT")

# Fallback: tenta pela listagem
if [ -z "$DEV_DB_ID" ]; then
  DEV_DB_ID=$(find_db_id_by_name "capital-db-dev")
fi

if [ -z "$DEV_DB_ID" ]; then
    echo "❌ Erro ao criar banco de desenvolvimento. Saída:"
    echo "$DEV_DB_OUTPUT"
    exit 1
fi

echo "✅ Banco de desenvolvimento criado: $DEV_DB_ID"

# Atualizar wrangler.toml com os IDs dos bancos
sed -i.bak "s/database_id = \"placeholder\"/database_id = \"$PROD_DB_ID\"/g" wrangler.toml
sed -i.bak "s/database_id = \"placeholder-dev\"/database_id = \"$DEV_DB_ID\"/g" wrangler.toml
# Remover campo 'destination' obsoleto para evitar warnings
sed -i.bak "/^destination\s*=\s*\".*\"$/d" wrangler.toml

echo "✅ wrangler.toml atualizado com IDs dos bancos"

# Executar schema no banco de produção
echo "🗄️ Executando schema no banco de produção..."
wrangler d1 execute capital-db --file=database/schema.sql

# Executar schema no banco de desenvolvimento
echo "🗄️ Executando schema no banco de desenvolvimento..."
wrangler d1 execute capital-db-dev --file=database/schema.sql

echo "✅ Esquemas criados nos bancos"

# Gerar JWT secret aleatório
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

# Configurar variáveis de ambiente
echo "🔧 Configurando variáveis de ambiente..."
wrangler secret put JWT_SECRET --text "$JWT_SECRET"

echo "📦 Fazendo build da aplicação..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo ""
    echo "🎉 Configuração completa!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Execute 'npx wrangler pages deploy dist' para fazer o deploy"
    echo "2. Configure o domínio personalizado no dashboard do Cloudflare (opcional)"
    echo "3. Acesse sua aplicação na URL fornecida pelo Cloudflare"
    echo ""
    echo "🔗 URLs importantes:"
    echo "   Dashboard: https://dash.cloudflare.com"
    echo "   Documentação: https://developers.cloudflare.com/pages/"
    echo ""
    echo "💾 IDs dos bancos (salve para referência):"
    echo "   Produção: $PROD_DB_ID"
    echo "   Desenvolvimento: $DEV_DB_ID"
else
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi
