import { useState, useEffect, useCallback } from 'react';
import {
  BelvoConnectionState,
  BelvoInstitution,
  BelvoLink,
  BelvoAccount,
  BelvoTransaction,
  BelvoLinkRequest,
  BelvoLogEntry
} from '@shared/belvo-types';
import belvoService from '../services/belvoService';

const STORAGE_KEY = 'belvo-connection-state';

const initialState: BelvoConnectionState = {
  isConnected: false,
  links: [],
  accounts: [],
  transactions: [],
  institutions: [],
  lastSync: null,
  error: null
};

export function useBelvo() {
  const [state, setState] = useState<BelvoConnectionState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar estado do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        setState({ ...initialState, ...parsedState });
      }
    } catch (error) {
      console.error('Erro ao carregar estado do Belvo:', error);
    }
  }, []);

  // Salvar estado no localStorage
  const saveState = useCallback((newState: Partial<BelvoConnectionState>) => {
    const updatedState = { ...state, ...newState };
    setState(updatedState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
  }, [state]);

  // Limpar erro
  const clearError = useCallback(() => {
    saveState({ error: null });
  }, [saveState]);

  // Verificar saúde da API
  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const isHealthy = await belvoService.healthCheck();
      if (isHealthy) {
        saveState({ error: null });
        return true;
      } else {
        saveState({ error: 'API Belvo indisponível no momento' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      saveState({ error: message });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveState]);

  // Carregar instituições disponíveis
  const loadInstitutions = useCallback(async () => {
    setIsLoading(true);
    clearError();
    
    try {
      const institutions = await belvoService.getInstitutions();
      saveState({ institutions });
      return institutions;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar instituições';
      saveState({ error: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveState, clearError]);

  // Criar conexão com banco
  const connectBank = useCallback(async (linkData: BelvoLinkRequest) => {
    setIsLoading(true);
    clearError();
    
    try {
      const link = await belvoService.createLink(linkData);
      
      // Atualizar lista de links
      const updatedLinks = [...state.links, link];
      saveState({ 
        links: updatedLinks,
        isConnected: updatedLinks.length > 0
      });
      
      return link;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao conectar banco';
      saveState({ error: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [state.links, saveState, clearError]);

  // Desconectar banco (deletar link)
  const disconnectBank = useCallback(async (linkId: string) => {
    setIsLoading(true);
    clearError();
    
    try {
      await belvoService.deleteLink(linkId);
      
      // Remover da lista local
      const updatedLinks = state.links.filter(link => link.id !== linkId);
      const updatedAccounts = state.accounts.filter(account => account.link !== linkId);
      const updatedTransactions = state.transactions.filter(
        transaction => !updatedAccounts.some(account => account.id === transaction.account.id)
      );
      
      saveState({ 
        links: updatedLinks,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
        isConnected: updatedLinks.length > 0
      });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao desconectar banco';
      saveState({ error: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [state.links, state.accounts, state.transactions, saveState, clearError]);

  // Sincronizar contas de um link específico
  const syncAccounts = useCallback(async (linkId: string, dateFrom?: string, dateTo?: string) => {
    setIsLoading(true);
    clearError();
    
    try {
      const accounts = await belvoService.getAccounts({
        link: linkId,
        date_from: dateFrom,
        date_to: dateTo,
        save_data: true
      });
      
      // Atualizar contas locais
      const existingAccounts = state.accounts.filter(acc => acc.link !== linkId);
      const updatedAccounts = [...existingAccounts, ...accounts];
      
      saveState({ 
        accounts: updatedAccounts,
        lastSync: new Date().toISOString()
      });
      
      return accounts;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao sincronizar contas';
      saveState({ error: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [state.accounts, saveState, clearError]);

  // Sincronizar transações de um link específico
  const syncTransactions = useCallback(async (
    linkId: string, 
    accountId?: string,
    dateFrom?: string, 
    dateTo?: string
  ) => {
    setIsLoading(true);
    clearError();
    
    try {
      const transactions = await belvoService.getTransactions({
        link: linkId,
        account: accountId,
        date_from: dateFrom,
        date_to: dateTo,
        save_data: true
      });
      
      // Atualizar transações locais
      const existingTransactions = state.transactions.filter(
        trans => accountId ? trans.account.id !== accountId : 
                state.accounts.some(acc => acc.link !== linkId && acc.id === trans.account.id)
      );
      const updatedTransactions = [...existingTransactions, ...transactions];
      
      saveState({ 
        transactions: updatedTransactions,
        lastSync: new Date().toISOString()
      });
      
      return transactions;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao sincronizar transações';
      saveState({ error: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [state.accounts, state.transactions, saveState, clearError]);

  // Sincronização completa de todos os dados
  const syncAll = useCallback(async () => {
    setIsLoading(true);
    clearError();
    
    try {
      const { links, accounts, transactions } = await belvoService.syncAll();
      
      saveState({
        links,
        accounts,
        transactions,
        isConnected: links.length > 0,
        lastSync: new Date().toISOString()
      });
      
      return { links, accounts, transactions };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro na sincronização completa';
      saveState({ error: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [saveState, clearError]);

  // Obter logs
  const getLogs = useCallback((): BelvoLogEntry[] => {
    return belvoService.getLogs();
  }, []);

  // Limpar logs
  const clearLogs = useCallback(() => {
    belvoService.clearLogs();
  }, []);

  // Limpar todos os dados
  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    clearLogs();
  }, [clearLogs]);

  // Estatísticas resumidas
  const getStats = useCallback(() => {
    const totalBalance = state.accounts.reduce((sum, account) => {
      return sum + (account.balance?.current || 0);
    }, 0);

    const totalTransactions = state.transactions.length;
    
    const lastTransactionDate = state.transactions.length > 0 
      ? Math.max(...state.transactions.map(t => new Date(t.accounting_date).getTime()))
      : 0;

    return {
      connectedBanks: state.links.length,
      totalAccounts: state.accounts.length,
      totalBalance,
      totalTransactions,
      lastTransactionDate: lastTransactionDate > 0 ? new Date(lastTransactionDate) : null,
      hasError: !!state.error,
      lastSync: state.lastSync ? new Date(state.lastSync) : null
    };
  }, [state]);

  return {
    // Estado
    ...state,
    isLoading,
    
    // Estatísticas
    stats: getStats(),
    
    // Ações
    checkHealth,
    loadInstitutions,
    connectBank,
    disconnectBank,
    syncAccounts,
    syncTransactions,
    syncAll,
    clearError,
    clearAllData,
    
    // Logs
    getLogs,
    clearLogs
  };
}
