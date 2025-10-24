# 💰 Capital - Controle Financeiro Pessoal

Sistema completo de controle financeiro pessoal com sincronização na nuvem, integração Open Finance e analytics avançados.

## ✨ Funcionalidades

### 💾 **Dados na Nuvem**
- ✅ Sincronização automática
- ✅ Acesso de qualquer dispositivo  
- ✅ Backup seguro no Cloudflare D1
- ✅ Autenticação segura com JWT

### 📊 **Controle Financeiro**
- ✅ Transações de receitas e despesas
- ✅ Categorização automática e manual
- ✅ Filtros avançados por período, categoria, valor
- ✅ Gráficos e análises visuais
- ✅ Resumos mensais e anuais

### 🎯 **Planejamento**
- ✅ Sistema de objetivos/metas
- ✅ Divisão financeira personalizada
- ✅ Orçamento por categoria
- ✅ Alocação de gastos para objetivos

### 💼 **Investimentos**
- ✅ Carteira de investimentos
- ✅ Controle de compra/venda
- ✅ Acompanhamento de rentabilidade
- ✅ Diferentes tipos de ativos

### 🏦 **Open Finance**
- ✅ Integração com Belvo API
- ✅ Conexão direta com bancos (Nubank, Inter, Itaú, etc.)
- ✅ Importação automática de transações
- ✅ Detecção de duplicatas

### 📤 **Importação/Exportação**
- ✅ CSV de bancos (Nubank, Inter, RecargaPay)
- ✅ PDFs de faturas
- ✅ Exportação para CSV, PDF, JSON
- ✅ Backup completo dos dados

## 🚀 Deploy no Cloudflare (Recomendado)

### Setup Automático

```bash
# Clone o repositório
git clone <seu-repositorio>
cd Capital

# Instale dependências
npm install

# Execute o script de configuração automática
chmod +x scripts/setup-cloudflare.sh
./scripts/setup-cloudflare.sh

# Deploy
npm run cf:deploy
```

### Comandos Úteis

```bash
# Deploy rápido
npm run cf:deploy

# Desenvolvimento local com D1
npm run cf:dev

# Criar backup do banco
npm run cf:backup

# Ver logs em tempo real
npm run cf:logs
```

**📖 [Guia Completo de Deploy](DEPLOY.md)**

## 💻 Desenvolvimento Local

### Requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone e instale
git clone <seu-repositorio>
cd Capital
npm install

# Executar localmente
npm run dev
```

### Estrutura do Projeto

```
Capital/
├── client/                 # Frontend React + TypeScript
│   ├── components/         # Componentes reutilizáveis
│   ├── contexts/          # Contextos React (Auth, Financial, etc.)
│   ├── hooks/             # Hooks customizados
│   ├── pages/             # Páginas da aplicação
│   └── services/          # Serviços API
├── server/                # Backend Cloudflare Workers
│   ├── routes/            # Rotas da API
│   ├── services/          # Serviços de banco
│   └── utils/             # Utilitários (auth, etc.)
├── shared/                # Tipos e utilitários compartilhados
├── database/              # Schema SQLite/D1
└── scripts/               # Scripts de deploy e configuração
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Recharts** - Gráficos e visualizações
- **Date-fns** - Manipulação de datas
- **Lucide React** - Ícones

### Backend
- **Cloudflare Workers** - Servidor edge
- **D1 Database** - SQLite na edge
- **JWT** - Autenticação
- **TypeScript** - API tipada

### Integração
- **Belvo API** - Open Finance
- **CSV Parser** - Importação de dados

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Para Cloudflare (wrangler.toml)
JWT_SECRET="sua-chave-jwt-super-secreta"
ENVIRONMENT="production"

# Para Belvo (opcional)
VITE_BELVO_SECRET_ID="seu-belvo-secret-id"
VITE_BELVO_SECRET_PASSWORD="sua-belvo-password"
```

### Banco de Dados

O schema é criado automaticamente no setup. Estrutura:

- **users** - Usuários e autenticação
- **categories** - Categorias de transações
- **transactions** - Transações financeiras  
- **investments** - Carteira de investimentos
- **goals** - Objetivos financeiros
- **budget_divisions** - Divisão do orçamento
- **budget_categories** - Categorias do orçamento

## 📱 Como Usar

### 1. **Primeiro Acesso**
- Crie sua conta ou faça login
- Dados ficam salvos automaticamente na nuvem

### 2. **Adicionar Transações**
- Clique em "Nova Transação"
- Preencha valor, categoria, descrição e data
- Ou importe de CSV/conecte seu banco

### 3. **Conectar Bancos (Opcional)**
- Acesse Open Finance > Belvo
- Conecte Nubank, Inter, Itaú ou outros
- Sincronização automática de transações

### 4. **Definir Objetivos**
- Aba "Objetivos" 
- Crie metas financeiras
- Aloque gastos para objetivos

### 5. **Analisar Dados**
- Aba "Análises" para gráficos
- Use filtros por período
- Exporte relatórios

## 🔒 Segurança

- ✅ Autenticação JWT segura
- ✅ Dados criptografados em trânsito (HTTPS)
- ✅ Banco na edge (baixa latência)
- ✅ CORS configurado
- ✅ Validação de dados

## 🌍 Acesso Global

Deployed no Cloudflare:
- ⚡ Performance global (200+ data centers)
- 🔒 SSL automático
- 📱 PWA ready
- 🚀 Edge computing

## 📊 Performance

- Lighthouse Score: 95+
- Carregamento inicial: < 2s
- Funciona offline (após primeiro acesso)
- Otimizado para mobile

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Roadmap

- [ ] App mobile nativo (React Native)
- [ ] Integração PIX
- [ ] Inteligência artificial para categorização
- [ ] Relatórios avançados
- [ ] Multi-moeda
- [ ] Compartilhamento familiar

## 🆘 Suporte

- 📖 [Documentação Completa](DEPLOY.md)
- 💬 [Discord/Telegram](#)
- 🐛 [Reportar Bug](issues)
- 💡 [Sugerir Feature](issues)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**🎉 Feito com ❤️ para o controle financeiro pessoal**

> ⭐ Se este projeto te ajudou, deixe uma estrela no GitHub!
