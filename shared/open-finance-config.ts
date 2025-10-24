// Configurações de ambiente para Open Finance
export interface OpenFinanceEnvironmentConfig {
  production: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

// Configuração por ambiente
export const OPEN_FINANCE_CONFIG = {
  development: {
    production: false,
    clientId: 'dev_client_id',
    clientSecret: 'dev_client_secret',
    redirectUri: 'http://localhost:5173/auth/callback',
    scopes: ['accounts:read', 'transactions:read'] as string[]
  },
  production: {
    production: true,
    clientId: import.meta.env.VITE_OPEN_FINANCE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_OPEN_FINANCE_CLIENT_SECRET || '',
    redirectUri: import.meta.env.VITE_OPEN_FINANCE_REDIRECT_URI || '',
    scopes: ['accounts:read', 'transactions:read', 'credit-cards:read'] as string[]
  }
};

// URLs reais dos provedores Open Finance
export const PRODUCTION_OPEN_FINANCE_URLS = {
  nubank: {
    authorization: 'https://prod-s0-webapp-proxy.nubank.com.br/api/oauth/token',
    token: 'https://prod-s0-webapp-proxy.nubank.com.br/api/oauth/token',
    accounts: 'https://prod-s0-webapp-proxy.nubank.com.br/api/accounts',
    transactions: 'https://prod-s0-webapp-proxy.nubank.com.br/api/transactions',
    baseUrl: 'https://prod-s0-webapp-proxy.nubank.com.br'
  },
  inter: {
    authorization: 'https://cdpj.partners.bancointer.com.br/oauth/v2/authorize',
    token: 'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
    accounts: 'https://cdpj.partners.bancointer.com.br/banking/v2/accounts',
    transactions: 'https://cdpj.partners.bancointer.com.br/banking/v2/statements',
    baseUrl: 'https://cdpj.partners.bancointer.com.br'
  },
  recargapay: {
    authorization: 'https://api.recargapay.com.br/oauth2/authorize',
    token: 'https://api.recargapay.com.br/oauth2/token',
    accounts: 'https://api.recargapay.com.br/v1/accounts',
    transactions: 'https://api.recargapay.com.br/v1/transactions',
    baseUrl: 'https://api.recargapay.com.br'
  }
} as const;

// Headers padrão para requisições
export const OPEN_FINANCE_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Capital-Financial-App/1.0.0'
};

// Função para obter configuração do ambiente atual
export function getOpenFinanceConfig(): OpenFinanceEnvironmentConfig {
  const env = import.meta.env.MODE;

  // Verificar se o modo produção foi forçado via cookie
  let forcedProduction = false;
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const productionCookie = cookies.find(cookie =>
      cookie.trim().startsWith('capital_production_mode=')
    );
    forcedProduction = productionCookie?.includes('true') || false;
  }

  const useProduction = env === 'production' || forcedProduction;
  return useProduction ? OPEN_FINANCE_CONFIG.production : OPEN_FINANCE_CONFIG.development;
}

// Função para obter URLs do ambiente atual
export function getOpenFinanceUrls() {
  const config = getOpenFinanceConfig();
  return config.production ? PRODUCTION_OPEN_FINANCE_URLS : {
    nubank: {
      authorization: 'https://sandbox.nubank.com.br/oauth2/authorize',
      token: 'https://sandbox.nubank.com.br/oauth2/token',
      accounts: 'https://sandbox.nubank.com.br/accounts',
      transactions: 'https://sandbox.nubank.com.br/transactions',
      baseUrl: 'https://sandbox.nubank.com.br'
    },
    inter: {
      authorization: 'https://sandbox.bancointer.com.br/oauth/v2/authorize',
      token: 'https://sandbox.bancointer.com.br/oauth/v2/token',
      accounts: 'https://sandbox.bancointer.com.br/banking/v2/accounts',
      transactions: 'https://sandbox.bancointer.com.br/banking/v2/statements',
      baseUrl: 'https://sandbox.bancointer.com.br'
    },
    recargapay: {
      authorization: 'https://sandbox.recargapay.com.br/oauth2/authorize',
      token: 'https://sandbox.recargapay.com.br/oauth2/token',
      accounts: 'https://sandbox.recargapay.com.br/v1/accounts',
      transactions: 'https://sandbox.recargapay.com.br/v1/transactions',
      baseUrl: 'https://sandbox.recargapay.com.br'
    }
  };
}
