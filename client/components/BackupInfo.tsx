import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Info, Download, Upload } from 'lucide-react';

interface BackupInfoProps {
  type: 'export' | 'import';
}

export default function BackupInfo({ type }: BackupInfoProps) {
  if (type === 'export') {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p className="font-medium">💾 Backup Completo disponível!</p>
            <p className="text-sm">
              O formato JSON agora inclui <strong>todos os seus dados</strong>:
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">Transações</Badge>
              <Badge variant="secondary" className="text-xs">Objetivos</Badge>
              <Badge variant="secondary" className="text-xs">Investimentos</Badge>
              <Badge variant="secondary" className="text-xs">Divisão Financeira</Badge>
              <Badge variant="secondary" className="text-xs">Categorias</Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-green-200 bg-green-50">
      <Upload className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="space-y-2">
          <p className="font-medium">📥 Importação Completa disponível!</p>
          <p className="text-sm">
            Agora você pode importar:
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs mt-2">
            <div>
              <Badge variant="outline" className="border-green-300">CSV</Badge>
              <p className="mt-1">Transações bancárias</p>
            </div>
            <div>
              <Badge variant="outline" className="border-green-300">PDF</Badge>
              <p className="mt-1">Faturas de cartão</p>
            </div>
            <div>
              <Badge variant="outline" className="border-green-300">JSON</Badge>
              <p className="mt-1">Backup completo</p>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
