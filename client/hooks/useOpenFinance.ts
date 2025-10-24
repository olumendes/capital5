import { useState, useCallback, useEffect } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import {
  OpenFinanceProvider,
  OpenFinanceConnection,
  OpenFinanceAccount,
  OpenFinanceTransaction,
  OpenFinanceSyncResult,
  getProvider
} from '@shared/open-finance-types';
import { DEFAULT_CATEGORIES } from '@shared/financial-types';
import { getOpenFinanceConfig } from '@shared/open-finance-config';
import { openFinanceService } from '../services/openFinanceService';

export function useOpenFinance() {
  const { addTransaction, categories } = useFinancial();
  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [accounts, setAccounts] = useState<OpenFinanceAccount[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authState, setAuthState] = useState<{provider?: OpenFinanceProvider, state?: string, codeVerifier?: string}>({});

  const config = getOpenFinanceConfig();
  const isProduction = config.production;

  // Conectar com provedor Open Finance
  const connectProvider = useCallback(async (provider: OpenFinanceProvider): Promise<boolean> => {
    setIsConnecting(true);

    try {
      const providerInfo = getProvider(provider);
      if (!providerInfo) {
        throw new Error('Provedor não encontrado');
      }

      if (isProduction) {
        // Produção: iniciar fluxo OAuth2 real
        const authResponse = await openFinanceService.getAuthorizationUrl(provider);

        // Armazenar estado para callback
        setAuthState({
          provider,
          state: authResponse.state,
          codeVerifier: authResponse.codeVerifier
        });

        // Redirecionar para autorização
        window.location.href = authResponse.authorizationUrl;
        return true;
      } else {
        // Desenvolvimento: usar dados simulados
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newConnection: OpenFinanceConnection = {
          id: crypto.randomUUID(),
          provider,
          providerName: providerInfo.name,
          isConnected: true,
          lastSync: new Date().toISOString(),
          accessToken: `mock_token_${Date.now()}`,
          refreshToken: `mock_refresh_${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          permissions: providerInfo.permissions,
          status: 'connected'
        };

        setConnections(prev => [...prev.filter(c => c.provider !== provider), newConnection]);

        const mockAccounts = generateMockAccounts(provider, newConnection.id);
        setAccounts(prev => [...prev.filter(a => a.provider !== provider), ...mockAccounts]);

        return true;
      }
    } catch (error) {
      console.error('Erro ao conectar provedor:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isProduction]);

  // Sincronizar dados do provedor
  const syncProvider = useCallback(async (provider: OpenFinanceProvider): Promise<OpenFinanceSyncResult> => {
    setIsSyncing(true);

    try {
      const connection = connections.find(c => c.provider === provider);
      if (!connection || !connection.isConnected) {
        throw new Error('Provedor não conectado');
      }

      let importedCount = 0;
      let accountsUpdated = 0;

      if (isProduction && connection.accessToken) {
        // Produção: buscar dados reais
        try {
          // Verificar se token não expirou
          if (connection.expiresAt && new Date() > new Date(connection.expiresAt)) {
            if (connection.refreshToken) {
              const tokenResponse = await openFinanceService.refreshAccessToken(provider, connection.refreshToken);

              // Atualizar connection com novo token
              const updatedConnection = {
                ...connection,
                accessToken: tokenResponse.accessToken,
                refreshToken: tokenResponse.refreshToken,
                expiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString()
              };

              setConnections(prev => prev.map(c =>
                c.provider === provider ? updatedConnection : c
              ));
            } else {
              throw new Error('Token expirado e sem refresh token');
            }
          }

          // Buscar contas
          const fetchedAccounts = await openFinanceService.getAccounts(provider, connection.accessToken);
          setAccounts(prev => [...prev.filter(a => a.provider !== provider), ...fetchedAccounts]);
          accountsUpdated = fetchedAccounts.length;

          // Buscar transações dos últimos 90 dias para cada conta
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          for (const account of fetchedAccounts) {
            const transactions = await openFinanceService.getTransactions(
              provider,
              connection.accessToken,
              account.id,
              startDate,
              endDate
            );

            transactions.forEach(transaction => {
              const category = mapOpenFinanceCategory(transaction.description, transaction.merchantName);
              const categoryInfo = categories.find(cat => cat.id === category) ||
                                  DEFAULT_CATEGORIES.find(cat => cat.id === category);

              addTransaction({
                type: transaction.type === 'credit' ? 'receita' : 'despesa',
                category,
                categoryName: categoryInfo?.name,
                description: transaction.description,
                amount: transaction.amount,
                date: transaction.date,
                source: 'open-finance',
                sourceDetails: {
                  bank: getProvider(provider)?.name,
                  account: account.id,
                  fileName: `open-finance-${provider}`
                },
                tags: ['open-finance', provider]
              });

              importedCount++;
            });
          }
        } catch (apiError) {
          console.error('Erro na API do Open Finance:', apiError);
          throw apiError;
        }
      } else {
        // Desenvolvimento: usar dados simulados
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockTransactions = generateMockTransactions(provider);

        mockTransactions.forEach(transaction => {
          const category = mapOpenFinanceCategory(transaction.description, transaction.merchantName);
          const categoryInfo = categories.find(cat => cat.id === category) ||
                              DEFAULT_CATEGORIES.find(cat => cat.id === category);

          addTransaction({
            type: transaction.type === 'credit' ? 'receita' : 'despesa',
            category,
            categoryName: categoryInfo?.name,
            description: transaction.description,
            amount: Math.abs(transaction.amount),
            date: transaction.date,
            source: 'open-finance',
            sourceDetails: {
              bank: getProvider(transaction.provider)?.name,
              account: transaction.accountId,
              fileName: `open-finance-${transaction.provider}`
            },
            tags: ['open-finance', provider]
          });

          importedCount++;
        });

        accountsUpdated = accounts.filter(a => a.provider === provider).length;
      }

      // Atualizar última sincronização
      setConnections(prev => prev.map(c =>
        c.provider === provider
          ? { ...c, lastSync: new Date().toISOString() }
          : c
      ));

      return {
        provider,
        accountsUpdated,
        transactionsImported: importedCount,
        lastSync: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [connections, accounts, addTransaction, categories, isProduction]);

  // Desconectar provedor
  const disconnectProvider = useCallback((provider: OpenFinanceProvider) => {
    setConnections(prev => prev.filter(c => c.provider !== provider));
    setAccounts(prev => prev.filter(a => a.provider !== provider));
  }, []);

  // Verificar se provedor está conectado
  const isProviderConnected = useCallback((provider: OpenFinanceProvider) => {
    return connections.some(c => c.provider === provider && c.isConnected);
  }, [connections]);

  // Processar callback de autorização OAuth2
  const handleAuthCallback = useCallback(async (code: string, state: string) => {
    if (!authState.provider || authState.state !== state || !authState.codeVerifier) {
      throw new Error('Estado de autorização inválido');
    }

    try {
      const tokenResponse = await openFinanceService.exchangeCodeForToken(
        authState.provider,
        code,
        authState.codeVerifier
      );

      const providerInfo = getProvider(authState.provider)!;

      const newConnection: OpenFinanceConnection = {
        id: crypto.randomUUID(),
        provider: authState.provider,
        providerName: providerInfo.name,
        isConnected: true,
        lastSync: new Date().toISOString(),
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString(),
        permissions: providerInfo.permissions,
        status: 'connected'
      };

      setConnections(prev => [...prev.filter(c => c.provider !== authState.provider), newConnection]);

      // Buscar contas após conexão
      const fetchedAccounts = await openFinanceService.getAccounts(authState.provider, tokenResponse.accessToken);
      setAccounts(prev => [...prev.filter(a => a.provider !== authState.provider), ...fetchedAccounts]);

      // Limpar estado de autorização
      setAuthState({});

      return true;
    } catch (error) {
      console.error('Erro ao processar callback:', error);
      setAuthState({});
      throw error;
    }
  }, [authState]);

  // Verificar se está em ambiente de produção
  const getEnvironmentInfo = useCallback(() => {
    return {
      isProduction,
      hasCredentials: !!(config.clientId && config.clientSecret),
      redirectUri: config.redirectUri
    };
  }, [isProduction, config]);

  return {
    connections,
    accounts,
    isConnecting,
    isSyncing,
    connectProvider,
    syncProvider,
    disconnectProvider,
    isProviderConnected,
    handleAuthCallback,
    getEnvironmentInfo
  };
}

// Gerar contas mock para demonstração
function generateMockAccounts(provider: OpenFinanceProvider, connectionId: string): OpenFinanceAccount[] {
  const baseAccounts = {
    nubank: [
      {
        type: 'checking' as const,
        name: 'Conta do Nubank',
        number: '**** 1234',
        balance: 2500.00
      },
      {
        type: 'credit_card' as const,
        name: 'NuCard',
        number: '**** 5678',
        balance: -850.30
      }
    ],
    inter: [
      {
        type: 'checking' as const,
        name: 'Conta Corrente Inter',
        number: '**** 9876',
        balance: 1800.50
      },
      {
        type: 'savings' as const,
        name: 'Poupança Inter',
        number: '**** 5432',
        balance: 5000.00
      }
    ],
    recargapay: [
      {
        type: 'credit_card' as const,
        name: 'Cartão RecargaPay',
        number: '**** 3456',
        balance: -432.75
      }
    ]
  };

  return baseAccounts[provider].map(account => ({
    id: crypto.randomUUID(),
    provider,
    ...account,
    currency: 'BRL',
    lastUpdate: new Date().toISOString()
  }));
}

// Gerar transações mock para demonstração
function generateMockTransactions(provider: OpenFinanceProvider): OpenFinanceTransaction[] {
  const mockData = {
    nubank: [
      { description: 'Pagamento recebido - João Silva', amount: -500.00, type: 'credit' as const, merchantName: 'PIX' },
      { description: 'Uber', amount: 25.50, type: 'debit' as const, merchantName: 'Uber' },
      { description: 'Supermercado Extra', amount: 89.90, type: 'debit' as const, merchantName: 'Extra' },
      { description: 'Netflix', amount: 29.90, type: 'debit' as const, merchantName: 'Netflix' }
    ],
    inter: [
      { description: 'TED Recebida - Maria Santos', amount: -800.00, type: 'credit' as const, merchantName: 'TED' },
      { description: 'Compra débito - Farmácia', amount: 45.30, type: 'debit' as const, merchantName: 'Drogaria Araujo' },
      { description: 'PIX Enviado - Carlos Lima', amount: 100.00, type: 'debit' as const, merchantName: 'PIX' },
      { description: 'Rendimento Poupança', amount: -12.50, type: 'credit' as const, merchantName: 'Inter' }
    ],
    recargapay: [
      { description: 'Conversa Afiada Bar E', amount: 24.50, type: 'debit' as const, merchantName: 'Bar' },
      { description: 'Uber Trip', amount: 18.90, type: 'debit' as const, merchantName: 'Uber' },
      { description: 'Pagamento da Fatura', amount: -200.00, type: 'credit' as const, merchantName: 'RecargaPay' }
    ]
  };

  const today = new Date();
  return mockData[provider].map((transaction, index) => ({
    id: crypto.randomUUID(),
    accountId: crypto.randomUUID(),
    provider,
    date: new Date(today.getTime() - (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    externalId: `ext_${Date.now()}_${index}`,
    ...transaction
  }));
}

// Mapear categorias baseado na descrição Open Finance
function mapOpenFinanceCategory(description: string, merchantName?: string): string {
  const lowerDesc = description.toLowerCase();
  const lowerMerchant = merchantName?.toLowerCase() || '';

  if (lowerDesc.includes('uber') || lowerMerchant.includes('uber')) return 'transporte';
  if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify')) return 'entretenimento';
  if (lowerDesc.includes('supermercado') || lowerDesc.includes('extra') || lowerDesc.includes('mercado')) return 'alimentacao';
  if (lowerDesc.includes('farmacia') || lowerDesc.includes('drogaria')) return 'saude';
  if (lowerDesc.includes('bar') || lowerDesc.includes('restaurante')) return 'alimentacao';
  if (lowerDesc.includes('pagamento recebido') || lowerDesc.includes('ted recebida') || lowerDesc.includes('rendimento')) return 'salario';
  if (lowerDesc.includes('pix enviado') || lowerDesc.includes('transferencia')) return 'outros-despesas';
  
  return 'outros-despesas';
}
