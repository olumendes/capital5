import { TransactionType, Transaction } from '@shared/financial-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import TransactionForm from './TransactionForm';

interface TransactionModalProps {
  children?: React.ReactNode;
  initialType?: TransactionType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transactionToEdit?: Transaction | null;
}

export default function TransactionModal({
  children,
  initialType,
  open,
  onOpenChange,
  transactionToEdit
}: TransactionModalProps) {
  const handleSuccess = () => {
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  const isEditing = !!transactionToEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full"
        onInteractOutside={(e) => {
          // Prevenir fechamento acidental em mobile
          if (window.innerWidth < 768) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevenir fechamento acidental com ESC em mobile
          if (window.innerWidth < 768) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? 'Editar Transação'
              : initialType === 'receita' ? 'Nova Receita' : 'Nova Despesa'
            }
          </DialogTitle>
        </DialogHeader>
        <TransactionForm
          initialType={initialType}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          transactionToEdit={transactionToEdit}
        />
      </DialogContent>
    </Dialog>
  );
}
