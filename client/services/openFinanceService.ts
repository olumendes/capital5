import { 
  OpenFinanceProvider, 
  OpenFinanceConnection, 
  OpenFinanceAccount,
  OpenFinanceTransaction,
  OpenFinanceAuthResponse,
  OpenFinanceTokenResponse
} from '@shared/open-finance-types';
import { 
  getOpenFinanceConfig, 
  getOpenFinanceUrls, 
  OPEN_FINANCE_HEADERS 
} from '@shared/open-finance-config';

class OpenFinanceService {
  private config = getOpenFinanceConfig();
  private urls = getOpenFinanceUrls();

  // Gerar URL de autorização OAuth2
  async getAuthorizationUrl(provider: OpenFinanceProvider): Promise<OpenFinanceAuthResponse> {
    const providerUrls = this.urls[provider];
    const state = crypto.randomUUID();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authorizationUrl = `${providerUrls.authorization}?${params.toString()}`;

    return {
      authorizationUrl,
      state,
      codeVerifier
    };
  }

  // Trocar código por token de acesso
  async exchangeCodeForToken(
    provider: OpenFinanceProvider,
    code: string,
    codeVerifier: string
  ): Promise<OpenFinanceTokenResponse> {
    const providerUrls = this.urls[provider];

    const response = await fetch(providerUrls.token, {
      method: 'POST',
      headers: {
        ...OPEN_FINANCE_HEADERS,
        'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao obter token: ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type
    };
  }

  // Renovar token de acesso
  async refreshAccessToken(
    provider: OpenFinanceProvider,
    refreshToken: string
  ): Promise<OpenFinanceTokenResponse> {
    const providerUrls = this.urls[provider];

    const response = await fetch(providerUrls.token, {
      method: 'POST',
      headers: {
        ...OPEN_FINANCE_HEADERS,
        'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao renovar token: ${error}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type
    };
  }

  // Buscar contas do usuário
  async getAccounts(
    provider: OpenFinanceProvider,
    accessToken: string
  ): Promise<OpenFinanceAccount[]> {
    const providerUrls = this.urls[provider];

    const response = await fetch(providerUrls.accounts, {
      headers: {
        ...OPEN_FINANCE_HEADERS,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao buscar contas: ${error}`);
    }

    const data = await response.json();
    
    // Mapear resposta específica do provedor para formato padrão
    return this.mapAccountsResponse(provider, data);
  }

  // Buscar transações de uma conta
  async getTransactions(
    provider: OpenFinanceProvider,
    accessToken: string,
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<OpenFinanceTransaction[]> {
    const providerUrls = this.urls[provider];
    
    const params = new URLSearchParams();
    if (startDate) params.append('fromDate', startDate);
    if (endDate) params.append('toDate', endDate);
    
    const url = `${providerUrls.transactions}/${accountId}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        ...OPEN_FINANCE_HEADERS,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao buscar transações: ${error}`);
    }

    const data = await response.json();
    
    // Mapear resposta específica do provedor para formato padrão
    return this.mapTransactionsResponse(provider, accountId, data);
  }

  // Mapear contas baseado no provedor
  private mapAccountsResponse(provider: OpenFinanceProvider, data: any): OpenFinanceAccount[] {
    switch (provider) {
      case 'nubank':
        return data.accounts?.map((account: any) => ({
          id: account.accountId,
          provider,
          type: this.mapAccountType(account.accountType),
          name: account.productName || account.accountType,
          number: account.accountNumber || '**** ****',
          balance: account.availableBalance || 0,
          currency: account.currency || 'BRL',
          lastUpdate: new Date().toISOString()
        })) || [];

      case 'inter':
        return data.data?.map((account: any) => ({
          id: account.resourceId,
          provider,
          type: this.mapAccountType(account.accountSubType),
          name: account.productName || account.accountSubType,
          number: account.maskedPan || '**** ****',
          balance: parseFloat(account.balances?.[0]?.amount || '0'),
          currency: account.balances?.[0]?.currency || 'BRL',
          lastUpdate: new Date().toISOString()
        })) || [];

      case 'recargapay':
        return data.accounts?.map((account: any) => ({
          id: account.id,
          provider,
          type: 'credit_card' as const,
          name: account.name || 'Cartão RecargaPay',
          number: account.maskedNumber || '**** ****',
          balance: -Math.abs(account.currentBalance || 0),
          currency: 'BRL',
          lastUpdate: new Date().toISOString()
        })) || [];

      default:
        return [];
    }
  }

  // Mapear transações baseado no provedor
  private mapTransactionsResponse(
    provider: OpenFinanceProvider, 
    accountId: string, 
    data: any
  ): OpenFinanceTransaction[] {
    switch (provider) {
      case 'nubank':
        return data.transactions?.map((transaction: any) => ({
          id: transaction.transactionId,
          accountId,
          provider,
          date: transaction.bookingDateTime.split('T')[0],
          description: transaction.remittanceInformation || transaction.additionalInformation,
          amount: Math.abs(parseFloat(transaction.amount)),
          type: parseFloat(transaction.amount) > 0 ? 'credit' : 'debit',
          merchantName: transaction.merchantName,
          externalId: transaction.transactionId
        })) || [];

      case 'inter':
        return data.transactions?.map((transaction: any) => ({
          id: transaction.transactionId,
          accountId,
          provider,
          date: transaction.valueDate,
          description: transaction.remittanceInformation,
          amount: Math.abs(parseFloat(transaction.transactionAmount?.amount || '0')),
          type: parseFloat(transaction.transactionAmount?.amount || '0') > 0 ? 'credit' : 'debit',
          merchantName: transaction.merchantName,
          externalId: transaction.transactionId
        })) || [];

      case 'recargapay':
        return data.transactions?.map((transaction: any) => ({
          id: transaction.id,
          accountId,
          provider,
          date: transaction.date,
          description: transaction.description,
          amount: Math.abs(transaction.amount),
          type: transaction.amount > 0 ? 'credit' : 'debit',
          merchantName: transaction.merchant,
          externalId: transaction.id
        })) || [];

      default:
        return [];
    }
  }

  // Mapear tipo de conta
  private mapAccountType(accountType: string): OpenFinanceAccount['type'] {
    const type = accountType.toLowerCase();
    
    if (type.includes('current') || type.includes('corrente')) return 'checking';
    if (type.includes('savings') || type.includes('poupanca')) return 'savings';
    if (type.includes('credit') || type.includes('cartao')) return 'credit_card';
    if (type.includes('investment') || type.includes('investimento')) return 'investment';
    
    return 'checking';
  }

  // Gerar code verifier para PKCE
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Gerar code challenge para PKCE
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export const openFinanceService = new OpenFinanceService();
