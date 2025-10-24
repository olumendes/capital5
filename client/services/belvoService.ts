import {
  BelvoConfig,
  BelvoInstitution,
  BelvoLink,
  BelvoAccount,
  BelvoTransaction,
  BelvoApiResponse,
  BelvoError,
  BelvoLinkRequest,
  BelvoAccountsRequest,
  BelvoTransactionsRequest,
  BelvoLogEntry
} from '@shared/belvo-types';

class BelvoService {
  private config: BelvoConfig;
  private logs: BelvoLogEntry[] = [];

  constructor() {
    this.config = {
      baseUrl: 'https://sandbox.belvo.com/api',
      secretId: import.meta.env.VITE_BELVO_SECRET_ID || '',
      secretPassword: import.meta.env.VITE_BELVO_SECRET_PASSWORD || '',
      debug: import.meta.env.VITE_BELVO_DEBUG === 'true'
    };

    this.log('info', 'BelvoService', 'Serviço inicializado', { 
      baseUrl: this.config.baseUrl,
      debug: this.config.debug,
      hasCredentials: !!(this.config.secretId && this.config.secretPassword)
    });
  }

  // Sistema de logs
  private log(type: 'success' | 'error' | 'info' | 'debug', operation: string, message: string, data?: any, error?: any) {
    const logEntry: BelvoLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      operation,
      message,
      data,
      error
    };

    this.logs.push(logEntry);

    // Manter apenas os últimos 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Salvar logs no localStorage
    localStorage.setItem('belvo-logs', JSON.stringify(this.logs));

    // Console logging se debug estiver ativo
    if (this.config.debug) {
      const logMessage = `[Belvo ${type.toUpperCase()}] ${operation}: ${message}`;
      switch (type) {
        case 'error':
          console.error(logMessage, data, error);
          break;
        case 'success':
          console.log(`✅ ${logMessage}`, data);
          break;
        case 'info':
          console.info(`ℹ️ ${logMessage}`, data);
          break;
        case 'debug':
          console.debug(`🔍 ${logMessage}`, data);
          break;
      }
    }
  }

  // Obter logs
  public getLogs(): BelvoLogEntry[] {
    return [...this.logs];
  }

  // Limpar logs
  public clearLogs() {
    this.logs = [];
    localStorage.removeItem('belvo-logs');
    this.log('info', 'clearLogs', 'Logs limpos');
  }

  // Carregar logs do localStorage
  private loadLogs() {
    try {
      const savedLogs = localStorage.getItem('belvo-logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      this.log('error', 'loadLogs', 'Erro ao carregar logs salvos', null, error);
    }
  }

  // Função auxiliar para fazer requisições
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    // Configurar Basic Auth
    const credentials = btoa(`${this.config.secretId}:${this.config.secretPassword}`);
    
    const defaultHeaders = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    this.log('debug', 'makeRequest', `Fazendo requisição para ${endpoint}`, {
      method: config.method || 'GET',
      url,
      headers: config.headers
    });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData: BelvoError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: `HTTP_${response.status}`,
            error_description: response.statusText,
            request_id: response.headers.get('x-request-id') || 'unknown'
          };
        }

        this.log('error', 'makeRequest', `Erro HTTP ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          errorData
        });

        throw new Error(`Belvo API Error: ${errorData.error} - ${errorData.error_description}`);
      }

      const data = await response.json();
      
      this.log('success', 'makeRequest', `Requisição bem-sucedida para ${endpoint}`, {
        status: response.status,
        dataKeys: Object.keys(data)
      });

      return data;
    } catch (error) {
      this.log('error', 'makeRequest', `Erro na requisição para ${endpoint}`, null, error);
      throw error;
    }
  }

  // 1. Listar instituições disponíveis
  async getInstitutions(country: string = 'BR'): Promise<BelvoInstitution[]> {
    try {
      this.log('info', 'getInstitutions', 'Buscando instituições disponíveis', { country });
      
      const response = await this.makeRequest<BelvoApiResponse<BelvoInstitution>>(
        `/institutions/?country=${country}`
      );
      
      this.log('success', 'getInstitutions', `${response.results.length} instituições encontradas`);
      return response.results;
    } catch (error) {
      this.log('error', 'getInstitutions', 'Erro ao buscar instituições', null, error);
      throw error;
    }
  }

  // 2. Criar link com instituição
  async createLink(linkData: BelvoLinkRequest): Promise<BelvoLink> {
    try {
      this.log('info', 'createLink', 'Criando link com instituição', {
        institution: linkData.institution,
        username: linkData.username ? '***' : undefined,
        access_mode: linkData.access_mode
      });

      const response = await this.makeRequest<BelvoLink>('/links/', {
        method: 'POST',
        body: JSON.stringify(linkData),
      });

      this.log('success', 'createLink', 'Link criado com sucesso', {
        linkId: response.id,
        institution: response.institution,
        status: response.status
      });

      return response;
    } catch (error) {
      this.log('error', 'createLink', 'Erro ao criar link', linkData, error);
      throw error;
    }
  }

  // 3. Listar links existentes
  async getLinks(): Promise<BelvoLink[]> {
    try {
      this.log('info', 'getLinks', 'Buscando links existentes');
      
      const response = await this.makeRequest<BelvoApiResponse<BelvoLink>>('/links/');
      
      this.log('success', 'getLinks', `${response.results.length} links encontrados`);
      return response.results;
    } catch (error) {
      this.log('error', 'getLinks', 'Erro ao buscar links', null, error);
      throw error;
    }
  }

  // 4. Deletar link
  async deleteLink(linkId: string): Promise<void> {
    try {
      this.log('info', 'deleteLink', 'Deletando link', { linkId });
      
      await this.makeRequest(`/links/${linkId}/`, {
        method: 'DELETE',
      });
      
      this.log('success', 'deleteLink', 'Link deletado com sucesso', { linkId });
    } catch (error) {
      this.log('error', 'deleteLink', 'Erro ao deletar link', { linkId }, error);
      throw error;
    }
  }

  // 5. Obter contas bancárias
  async getAccounts(request: BelvoAccountsRequest): Promise<BelvoAccount[]> {
    try {
      this.log('info', 'getAccounts', 'Buscando contas bancárias', {
        link: request.link,
        date_from: request.date_from,
        date_to: request.date_to
      });

      const response = await this.makeRequest<BelvoApiResponse<BelvoAccount>>('/accounts/', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      this.log('success', 'getAccounts', `${response.results.length} contas encontradas`);
      return response.results;
    } catch (error) {
      this.log('error', 'getAccounts', 'Erro ao buscar contas', request, error);
      throw error;
    }
  }

  // 6. Listar contas salvas
  async getSavedAccounts(): Promise<BelvoAccount[]> {
    try {
      this.log('info', 'getSavedAccounts', 'Buscando contas salvas');
      
      const response = await this.makeRequest<BelvoApiResponse<BelvoAccount>>('/accounts/');
      
      this.log('success', 'getSavedAccounts', `${response.results.length} contas salvas encontradas`);
      return response.results;
    } catch (error) {
      this.log('error', 'getSavedAccounts', 'Erro ao buscar contas salvas', null, error);
      throw error;
    }
  }

  // 7. Obter transações
  async getTransactions(request: BelvoTransactionsRequest): Promise<BelvoTransaction[]> {
    try {
      this.log('info', 'getTransactions', 'Buscando transações', {
        link: request.link,
        account: request.account,
        date_from: request.date_from,
        date_to: request.date_to
      });

      const response = await this.makeRequest<BelvoApiResponse<BelvoTransaction>>('/transactions/', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      this.log('success', 'getTransactions', `${response.results.length} transações encontradas`);
      return response.results;
    } catch (error) {
      this.log('error', 'getTransactions', 'Erro ao buscar transações', request, error);
      throw error;
    }
  }

  // 8. Listar transações salvas
  async getSavedTransactions(filters?: {
    account?: string;
    date_from?: string;
    date_to?: string;
    amount_gte?: number;
    amount_lte?: number;
  }): Promise<BelvoTransaction[]> {
    try {
      this.log('info', 'getSavedTransactions', 'Buscando transações salvas', filters);
      
      let endpoint = '/transactions/';
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
      }
      
      const response = await this.makeRequest<BelvoApiResponse<BelvoTransaction>>(endpoint);
      
      this.log('success', 'getSavedTransactions', `${response.results.length} transações salvas encontradas`);
      return response.results;
    } catch (error) {
      this.log('error', 'getSavedTransactions', 'Erro ao buscar transações salvas', filters, error);
      throw error;
    }
  }

  // 9. Verificar status de saúde da API
  async healthCheck(): Promise<boolean> {
    try {
      this.log('info', 'healthCheck', 'Verificando status da API');
      
      // Tenta uma requisição simples para verificar conectividade
      await this.makeRequest('/institutions/?page_size=1');
      
      this.log('success', 'healthCheck', 'API disponível e funcionando');
      return true;
    } catch (error) {
      this.log('error', 'healthCheck', 'API indisponível ou com problemas', null, error);
      return false;
    }
  }

  // 10. Sincronização completa (links, contas e transações)
  async syncAll(): Promise<{
    links: BelvoLink[];
    accounts: BelvoAccount[];
    transactions: BelvoTransaction[];
  }> {
    try {
      this.log('info', 'syncAll', 'Iniciando sincronização completa');

      // 1. Buscar todos os links
      const links = await this.getLinks();
      
      // 2. Buscar todas as contas salvas
      const accounts = await this.getSavedAccounts();
      
      // 3. Buscar todas as transações salvas
      const transactions = await this.getSavedTransactions();

      const result = { links, accounts, transactions };
      
      this.log('success', 'syncAll', 'Sincronização completa finalizada', {
        linksCount: links.length,
        accountsCount: accounts.length,
        transactionsCount: transactions.length
      });

      return result;
    } catch (error) {
      this.log('error', 'syncAll', 'Erro na sincronização completa', null, error);
      throw error;
    }
  }
}

// Singleton instance
export const belvoService = new BelvoService();
export default belvoService;
