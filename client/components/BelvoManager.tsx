import { useState, useEffect } from 'react';
import { useBelvo } from '../hooks/useBelvo';
import { BelvoInstitution, BelvoLinkRequest } from '@shared/belvo-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Building2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Eye,
  Clock,
  CreditCard,
  DollarSign,
  Calendar,
  Settings,
  Activity
} from 'lucide-react';

interface BelvoManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BelvoManager({ open, onOpenChange }: BelvoManagerProps) {
  const {
    isConnected,
    links,
    accounts,
    transactions,
    institutions,
    lastSync,
    error,
    isLoading,
    stats,
    checkHealth,
    loadInstitutions,
    connectBank,
    disconnectBank,
    syncAccounts,
    syncTransactions,
    syncAll,
    clearError,
    clearAllData,
    getLogs,
    clearLogs
  } = useBelvo();

  const [activeTab, setActiveTab] = useState('overview');
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    username2: '',
    password2: ''
  });

  // Carregar instituições quando o modal abrir
  useEffect(() => {
    if (open && institutions.length === 0) {
      loadInstitutions().catch(console.error);
    }
  }, [open, institutions.length, loadInstitutions]);

  // Verificar saúde da API ao abrir
  useEffect(() => {
    if (open) {
      checkHealth();
    }
  }, [open, checkHealth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleConnectBank = async () => {
    if (!selectedInstitution || !credentials.username || !credentials.password) {
      return;
    }

    try {
      const linkRequest: BelvoLinkRequest = {
        institution: selectedInstitution,
        username: credentials.username,
        password: credentials.password,
        access_mode: 'recurrent',
        fetch_resources: ['accounts', 'transactions']
      };

      // Adicionar campos extras se fornecidos
      if (credentials.username2) {
        linkRequest.username2 = credentials.username2;
      }
      if (credentials.password2) {
        linkRequest.password2 = credentials.password2;
      }

      await connectBank(linkRequest);
      
      // Limpar formulário e fechar modal
      setCredentials({ username: '', password: '', username2: '', password2: '' });
      setSelectedInstitution('');
      setConnectModalOpen(false);
      
      // Sincronizar dados automaticamente
      const link = links[links.length - 1];
      if (link) {
        await syncAccounts(link.id);
        await syncTransactions(link.id);
      }
    } catch (error) {
      console.error('Erro ao conectar banco:', error);
    }
  };

  const selectedInstitutionData = institutions.find(inst => inst.id === selectedInstitution);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Belvo Open Finance
          </DialogTitle>
          <DialogDescription>
            Conecte suas contas bancárias para importação automática de dados
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={clearError}
              >
                Dispensar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="connections">Conexões</TabsTrigger>
            <TabsTrigger value="accounts">Contas</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.connectedBanks}</p>
                      <p className="text-sm text-gray-600">Bancos Conectados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                      <p className="text-sm text-gray-600">Contas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(stats.totalBalance)}</p>
                      <p className="text-sm text-gray-600">Saldo Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                      <p className="text-sm text-gray-600">Transações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={() => setConnectModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Conectar Banco
              </Button>
              <Button variant="outline" onClick={syncAll} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sincronizar Tudo
              </Button>
              <Button variant="outline" onClick={() => setLogsModalOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Logs
              </Button>
              <Button variant="destructive" onClick={clearAllData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            </div>

            {/* Last Sync Info */}
            {stats.lastSync && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    Última sincronização: {formatDate(stats.lastSync.toISOString())}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Conexões Bancárias</h3>
              <Button onClick={() => setConnectModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conexão
              </Button>
            </div>

            <div className="space-y-3">
              {links.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Nenhuma conexão bancária configurada</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Conecte seus bancos para importar dados automaticamente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                links.map((link) => (
                  <Card key={link.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{link.institution}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={link.status === 'valid' ? 'default' : 'destructive'}>
                              {link.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Último acesso: {formatDate(link.last_accessed_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncAccounts(link.id)}
                            disabled={isLoading}
                          >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => disconnectBank(link.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Contas Bancárias</h3>
              <Button onClick={syncAll} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {accounts.map((account) => (
                  <Card key={account.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-gray-600">
                            {account.institution.name} • {account.type}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Saldo Atual</p>
                              <p className="font-medium">{formatCurrency(account.balance.current)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Saldo Disponível</p>
                              <p className="font-medium">{formatCurrency(account.balance.available)}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncTransactions(account.link, account.id)}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Transações Recentes</h3>
              <p className="text-sm text-gray-600">{transactions.length} transações</p>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {transactions.slice(0, 50).map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.account.name} • {formatDate(transaction.accounting_date)}
                          </p>
                          {transaction.category && (
                            <Badge variant="secondary" className="mt-1">
                              {transaction.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Saldo: {formatCurrency(transaction.balance)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Logs do Sistema</h3>
              <Button variant="outline" onClick={clearLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Logs
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {getLogs().reverse().map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Badge variant={
                          log.type === 'success' ? 'default' :
                          log.type === 'error' ? 'destructive' :
                          log.type === 'info' ? 'secondary' : 'outline'
                        }>
                          {log.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.operation}</p>
                          <p className="text-sm text-gray-600">{log.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Modal para conectar banco */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar Banco</DialogTitle>
            <DialogDescription>
              Selecione uma instituição e forneça suas credenciais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Instituição</Label>
              <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInstitutionData && (
              <>
                {selectedInstitutionData.form_fields.map((field) => (
                  <div key={field.name}>
                    <Label>{field.label}</Label>
                    <Input
                      type={field.type === 'password' ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={credentials[field.name as keyof typeof credentials] || ''}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        [field.name]: e.target.value
                      }))}
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConnectBank}
              disabled={isLoading || !selectedInstitution || !credentials.username || !credentials.password}
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
