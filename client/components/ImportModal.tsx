import { useState, useRef } from 'react';
import { useImport } from '../hooks/useImport';
import { BankType, getBankFormat } from '@shared/bank-formats';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import BackupInfo from './BackupInfo';

interface ImportModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ImportModal({ children, open, onOpenChange }: ImportModalProps) {
  const { importFile, downloadCSVTemplate, isImporting, bankFormats } = useImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankType>('generic');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    importedCount?: number;
    errors?: string[];
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const allowedTypes = ['text/csv', 'application/pdf', 'application/json', '.csv', '.pdf', '.json'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (allowedTypes.includes(file.type) || allowedTypes.includes(fileExtension)) {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      alert('Tipo de arquivo não suportado. Use CSV, PDF ou JSON.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const result = await importFile(selectedFile, selectedBank);
    setImportResult(result);

    if (result.success) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setSelectedBank('generic');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'json':
        return <FileCode className="h-8 w-8 text-blue-600" />;
      default:
        return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange?.(isOpen);
      if (!isOpen) resetModal();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Upload className="h-5 w-5" />
            Importar Transações
          </DialogTitle>
          <DialogDescription className="text-sm">
            Importe transações (CSV/PDF) ou restore backup completo (JSON)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info sobre backup completo */}
          <BackupInfo type="import" />
          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como Importar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Extratos CSV</p>
                  <p className="text-sm text-gray-600">
                    <strong>Formato suportado:</strong> Data, Valor, Identificador, Descrição
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    • Data no formato DD/MM/AAAA (ex: 03/06/2025)<br/>
                    • Valor com vírgula decimal (ex: -85,50 ou 300,00)<br/>
                    • Valores negativos = despesas, positivos = receitas
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium">Faturas PDF</p>
                  <p className="text-sm text-gray-600">
                    <strong>Formatos suportados:</strong> Faturas de cartão de crédito
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    • RecargaPay, Nubank, Itaú e outros bancos<br/>
                    • Extração automática de transações e valores<br/>
                    • PDFs protegidos por senha não são suportados
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> As categorias são detectadas automaticamente baseadas na descrição das transações (Uber = Transporte, Restaurante = Alimentação, etc.)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seletor de Banco */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecione seu Banco</CardTitle>
              <CardDescription>
                Escolha o formato correto para sua instituição financeira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Banco ou Formato</Label>
                <Select value={selectedBank} onValueChange={(value: BankType) => setSelectedBank(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {bankFormats.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        <div className="flex items-center gap-2 py-1">
                          <span className="text-lg">{bank.icon}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{bank.name}</div>
                            <div className="text-xs text-gray-500 truncate">{bank.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBank && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm">
                    <strong>Formato esperado:</strong> {getBankFormat(selectedBank)?.csvFormat.columns.join(', ')}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Data: {getBankFormat(selectedBank)?.csvFormat.dateFormat} |
                    Valor: {getBankFormat(selectedBank)?.csvFormat.valueFormat}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template CSV */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Precisa de um modelo CSV?</h4>
                  <p className="text-sm text-gray-600">
                    Baixe o template específico para {getBankFormat(selectedBank)?.name || 'o banco selecionado'}
                  </p>
                </div>
                <Button variant="outline" onClick={() => downloadCSVTemplate(selectedBank)}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template {getBankFormat(selectedBank)?.icon}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Área de Upload */}
          <Card>
            <CardContent className="pt-6">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors",
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                  selectedFile ? "border-green-500 bg-green-50" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(selectedFile)}
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{selectedFile.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatFileSize(selectedFile.size)} • {getBankFormat(selectedBank)?.name}
                        </p>
                        {selectedFile.name.toLowerCase().includes('.csv') && (
                          <p className="text-xs text-blue-600 mt-1 hidden sm:block">
                            📊 Formato: {getBankFormat(selectedBank)?.csvFormat.columns.join(' → ')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={handleImport} disabled={isImporting} className="w-full">
                      {isImporting ? (
                        <>Importando com {getBankFormat(selectedBank)?.icon}...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Importar como {getBankFormat(selectedBank)?.name} {getBankFormat(selectedBank)?.icon}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium">
                        Arraste o arquivo aqui ou clique para selecionar
                      </p>
                      <p className="text-sm text-gray-600">
                        Suporta CSV, PDF e JSON de backup (máx. 10MB)
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Selecionar Arquivo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.pdf,.json"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isImporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processando arquivo...</span>
                    <span className="text-sm text-gray-600">Aguarde</span>
                  </div>
                  <Progress value={75} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado */}
          {importResult && (
            <Alert className={importResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
              <div className="flex items-start gap-2">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <p className="font-medium">{importResult.message}</p>
                    {importResult.importedCount && (
                      <p className="text-sm mt-1">
                        {importResult.importedCount} transação(ões) adicionada(s) ao seu controle financeiro.
                      </p>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Erros encontrados:</p>
                        <ul className="text-xs mt-1 space-y-1">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-red-700">• {error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li className="text-red-700">... e mais {importResult.errors.length - 5} erro(s)</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              className="flex-1 order-2 sm:order-1"
            >
              {importResult?.success ? 'Concluir' : 'Cancelar'}
            </Button>
            {importResult?.success && (
              <Button
                onClick={resetModal}
                className="flex-1 order-1 sm:order-2"
              >
                Importar Outro Arquivo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
