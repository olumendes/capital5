// Tipos para integração com Open Finance brasileiro

export type OpenFinanceProvider = 'nubank' | 'inter' | 'recargapay';

export interface OpenFinanceConnection {
  id: string;
  provider: OpenFinanceProvider;
  providerName: string;
  isConnected: boolean;
  lastSync?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  permissions: OpenFinancePermission[];
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  error?: string;
}

export type OpenFinancePermission = 
  | 'ACCOUNTS_READ'
  | 'TRANSACTIONS_READ'
  | 'CREDIT_CARDS_READ'
  | 'INVESTMENTS_READ';

export interface OpenFinanceAccount {
  id: string;
  provider: OpenFinanceProvider;
  type: 'checking' | 'savings' | 'credit_card' | 'investment';
  name: string;
  number: string;
  balance: number;
  currency: string;
  lastUpdate: string;
}

export interface OpenFinanceTransaction {
  id: string;
  accountId: string;
  provider: OpenFinanceProvider;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
  merchantName?: string;
  externalId: string;
}

export interface OpenFinanceAuthRequest {
  provider: OpenFinanceProvider;
  redirectUri: string;
  permissions: OpenFinancePermission[];
}

export interface OpenFinanceAuthResponse {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export interface OpenFinanceTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface OpenFinanceSyncResult {
  provider: OpenFinanceProvider;
  accountsUpdated: number;
  transactionsImported: number;
  lastSync: string;
  errors?: string[];
}

// URLs dos ambientes Open Finance (simulação)
export const OPEN_FINANCE_URLS = {
  nubank: {
    authorization: 'https://auth.nubank.com.br/oauth2/authorize',
    token: 'https://auth.nubank.com.br/oauth2/token',
    accounts: 'https://api.nubank.com.br/accounts',
    transactions: 'https://api.nubank.com.br/transactions'
  },
  inter: {
    authorization: 'https://cdpj.partners.bancointer.com.br/oauth/v2/authorize',
    token: 'https://cdpj.partners.bancointer.com.br/oauth/v2/token',
    accounts: 'https://cdpj.partners.bancointer.com.br/banking/v2/accounts',
    transactions: 'https://cdpj.partners.bancointer.com.br/banking/v2/transactions'
  },
  recargapay: {
    authorization: 'https://api.recargapay.com.br/oauth2/authorize',
    token: 'https://api.recargapay.com.br/oauth2/token',
    accounts: 'https://api.recargapay.com.br/v1/accounts',
    transactions: 'https://api.recargapay.com.br/v1/transactions'
  }
} as const;

// Configurações dos provedores
export const OPEN_FINANCE_PROVIDERS = [
  {
    id: 'nubank' as const,
    name: 'Nubank',
    description: 'Banco digital roxinho',
    icon: '💜',
    color: '#8A05BE',
    permissions: ['ACCOUNTS_READ', 'TRANSACTIONS_READ', 'CREDIT_CARDS_READ'] as OpenFinancePermission[]
  },
  {
    id: 'inter' as const,
    name: 'Banco Inter',
    description: 'Banco digital laranja',
    icon: '🧡',
    color: '#FF7A00',
    permissions: ['ACCOUNTS_READ', 'TRANSACTIONS_READ', 'INVESTMENTS_READ'] as OpenFinancePermission[]
  },
  {
    id: 'recargapay' as const,
    name: 'RecargaPay',
    description: 'Cartão de crédito digital',
    icon: '🔷',
    color: '#0066FF',
    permissions: ['ACCOUNTS_READ', 'TRANSACTIONS_READ', 'CREDIT_CARDS_READ'] as OpenFinancePermission[]
  }
] as const;

export function getProvider(id: OpenFinanceProvider) {
  return OPEN_FINANCE_PROVIDERS.find(p => p.id === id);
}
