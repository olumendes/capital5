import { useState } from 'react';
import { useOpenFinance } from '../hooks/useOpenFinance';
import { OPEN_FINANCE_PROVIDERS, OpenFinanceProvider } from '@shared/open-finance-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import BelvoManager from './BelvoManager';
import {
  Building2,
  CheckCircle,
  Loader2,
  Unplug,
  RefreshCw,
  Shield,
  CreditCard,
  Banknote,
  AlertCircle,
  Settings,
  Globe,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OpenFinanceManagerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function OpenFinanceManager({ children, open, onOpenChange }: OpenFinanceManagerProps) {
  const {
    connections,
    accounts,
    isConnecting,
    isSyncing,
    connectProvider,
    syncProvider,
    disconnectProvider,
    isProviderConnected,
    getEnvironmentInfo
  } = useOpenFinance();

  const environmentInfo = getEnvironmentInfo();
  
  const [selectedProvider, setSelectedProvider] = useState<OpenFinanceProvider | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('traditional');
  const [belvoModalOpen, setBelvoModalOpen] = useState(false);

  const handleConnect = async (provider: OpenFinanceProvider) => {
    setSelectedProvider(provider);
    const success = await connectProvider(provider);
    
    if (success) {
      // Sincronizar automaticamente após conectar
      try {
        const result = await syncProvider(provider);
        setSyncResults(prev => ({ ...prev, [provider]: result }));
      } catch (error) {
        console.error('Erro na sincronização inicial:', error);
      }
    }
    
    setSelectedProvider(null);
  };

  const handleSync = async (provider: OpenFinanceProvider) => {
    try {
      const result = await syncProvider(provider);
      setSyncResults(prev => ({ ...prev, [provider]: result }));
      alert(`✅ Sincronização concluída!\n${result.transactionsImported} transações importadas`);
    } catch (error) {
      alert(`❌ Erro na sincronização: ${error}`);
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Nunca';
    return format(new Date(lastSync), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Building2 className="h-5 w-5" />
            Open Finance - Conectar Bancos
          </DialogTitle>
          <DialogDescription className="text-sm">
            Conecte suas contas bancárias para importação automática de transações
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="traditional">Open Finance Tradicional</TabsTrigger>
            <TabsTrigger value="belvo">
              <Zap className="h-4 w-4 mr-2" />
              Belvo API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traditional" className="space-y-6">
          {/* Informações sobre ambiente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Open Finance Brasil:</strong> Padrão seguro que permite conectar suas contas bancárias
                para importação automática de transações. Seus dados são criptografados e você mantém controle total.
              </AlertDescription>
            </Alert>

            <Alert className={environmentInfo.isProduction ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              <div className="flex items-start gap-2">
                {environmentInfo.isProduction ? <Globe className="h-4 w-4 text-green-600" /> : <Settings className="h-4 w-4 text-orange-600" />}
                <div>
                  <AlertDescription>
                    <strong>Ambiente:</strong> {environmentInfo.isProduction ? 'Produção' : 'Desenvolvimento'}
                    <br />
                    <span className="text-xs">
                      {environmentInfo.isProduction
                        ? environmentInfo.hasCredentials
                          ? '✅ Credenciais configuradas - APIs reais ativas'
                          : '⚠️ Configure as variáveis de ambiente para usar APIs reais'
                        : 'Usando dados simulados para demonstração'
                      }
                    </span>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>

          {/* Lista de Provedores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPEN_FINANCE_PROVIDERS.map((provider) => {
              const isConnected = isProviderConnected(provider.id);
              const connection = connections.find(c => c.provider === provider.id);
              const providerAccounts = accounts.filter(a => a.provider === provider.id);
              const lastSyncResult = syncResults[provider.id];

              return (
                <Card key={provider.id} className={`relative ${isConnected ? 'ring-2 ring-green-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {provider.description}
                          </CardDescription>
                        </div>
                      </div>
                      {isConnected && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectado
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Permissões */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Permissões:</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission === 'ACCOUNTS_READ' && '💳 Contas'}
                            {permission === 'TRANSACTIONS_READ' && '📊 Transações'}
                            {permission === 'CREDIT_CARDS_READ' && '💳 Cartões'}
                            {permission === 'INVESTMENTS_READ' && '📈 Investimentos'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Informações da Conexão */}
                    {isConnected && connection && (
                      <div className="space-y-2">
                        <div className="text-xs">
                          <p><strong>Última sincronização:</strong> {formatLastSync(connection.lastSync)}</p>
                          <p><strong>Contas conectadas:</strong> {providerAccounts.length}</p>
                          {lastSyncResult && (
                            <p><strong>Última importação:</strong> {lastSyncResult.transactionsImported} transações</p>
                          )}
                        </div>
                        
                        {/* Lista de Contas */}
                        {providerAccounts.length > 0 && (
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-xs font-medium mb-1">Contas:</p>
                            {providerAccounts.map((account) => (
                              <div key={account.id} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  {account.type === 'credit_card' && <CreditCard className="h-3 w-3" />}
                                  {account.type !== 'credit_card' && <Banknote className="h-3 w-3" />}
                                  {account.name}
                                </span>
                                <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(account.balance)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2">
                      {!isConnected ? (
                        <Button 
                          onClick={() => handleConnect(provider.id)}
                          disabled={isConnecting && selectedProvider === provider.id}
                          className="flex-1"
                          style={{ backgroundColor: provider.color }}
                        >
                          {isConnecting && selectedProvider === provider.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            <>
                              <Building2 className="h-4 w-4 mr-2" />
                              Conectar
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => handleSync(provider.id)}
                            disabled={isSyncing}
                            className="flex-1"
                          >
                            {isSyncing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sincronizando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sincronizar
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => disconnectProvider(provider.id)}
                            className="px-3"
                          >
                            <Unplug className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Avisos */}
                    {!isConnected && (
                      <Alert className={environmentInfo.isProduction ? "border-blue-200 bg-blue-50" : ""}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {environmentInfo.isProduction
                            ? environmentInfo.hasCredentials
                              ? `Conecte com segurança através do Open Finance. Você será redirecionado para a autenticação oficial do ${provider.name}.`
                              : `⚠️ Ambiente de produção detectado, mas credenciais não configuradas. Configure as variáveis de ambiente.`
                            : `Este é um ambiente de demonstração. Em produção, você seria redirecionado para a autenticação oficial do ${provider.name}.`
                          }
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resumo das Conexões */}
          {connections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo das Conexões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{connections.length}</p>
                    <p className="text-sm text-gray-600">Bancos Conectados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{accounts.length}</p>
                    <p className="text-sm text-gray-600">Contas Vinculadas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {Object.values(syncResults).reduce((sum, result) => sum + (result?.transactionsImported || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-600">Transações Importadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de Fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange?.(false)}>
              Concluir
            </Button>
          </div>
          </TabsContent>

          <TabsContent value="belvo" className="space-y-6">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Belvo:</strong> API robusta que oferece conectividade direta com bancos
                brasileiros como Nubank, Inter, Itaú e outros. Mais estável e confiável
                que o Open Finance tradicional.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Conexões Belvo</CardTitle>
                <CardDescription>
                  Configure suas conexões bancárias através da API Belvo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setBelvoModalOpen(true)} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Abrir Gerenciador Belvo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <BelvoManager
        open={belvoModalOpen}
        onOpenChange={setBelvoModalOpen}
      />
    </Dialog>
  );
}
