import { useState } from 'react';
import { useInvestments } from '../contexts/InvestmentContext';
import { INVESTMENT_OPTIONS, InvestmentType, getInvestmentOption } from '@shared/investment-types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { PlusCircle, TrendingUp } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface InvestmentFormProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function InvestmentForm({ children, open, onOpenChange }: InvestmentFormProps) {
  const { addInvestment } = useInvestments();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    type: '' as InvestmentType | '',
    name: '',
    quantity: '',
    totalInvested: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const handleTypeChange = (type: string) => {
    const investmentType = type as InvestmentType;
    const option = getInvestmentOption(investmentType);
    
    setFormData(prev => ({
      ...prev,
      type: investmentType,
      name: option ? `${option.name} (${option.symbol})` : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.quantity || !formData.totalInvested) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseFloat(formData.quantity.replace(',', '.'));
    const totalInvested = parseFloat(formData.totalInvested.replace(',', '.'));

    if (isNaN(quantity) || isNaN(totalInvested) || quantity <= 0 || totalInvested <= 0) {
      toast({
        title: "Valores inválidos",
        description: "Quantidade e valor investido devem ser números positivos",
        variant: "destructive"
      });
      return;
    }

    // Calcular preço por unidade baseado no total investido
    const purchasePrice = totalInvested / quantity;

    console.log('Adicionando investimento:', { type: formData.type, name: formData.name, quantity, purchasePrice });
    addInvestment({
      type: formData.type,
      name: formData.name,
      quantity,
      purchasePrice,
      purchaseDate: formData.purchaseDate
    });

    // Reset form
    setFormData({
      type: '',
      name: '',
      quantity: '',
      totalInvested: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "Investimento adicionado",
      description: "Investimento cadastrado com sucesso!"
    });

    onOpenChange?.(false);
  };

  const selectedOption = formData.type ? getInvestmentOption(formData.type) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Adicionar Investimento
          </DialogTitle>
          <DialogDescription>
            Registre um novo investimento para acompanhar sua rentabilidade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Investimento */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Investimento *</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de investimento" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {INVESTMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{option.icon}</span>
                      <div>
                        <p className="font-medium">{option.name}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome personalizado */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome (opcional)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome personalizado para o investimento"
            />
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantidade * {selectedOption && `(em ${selectedOption.unit})`}
            </Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder={selectedOption ? `Ex: 0.001 ${selectedOption.unit}` : "Quantidade"}
            />
          </div>

          {/* Valor Total Investido */}
          <div className="space-y-2">
            <Label htmlFor="totalInvested">
              Valor Total Investido * (R$)
            </Label>
            <Input
              id="totalInvested"
              type="number"
              step="any"
              min="0"
              value={formData.totalInvested}
              onChange={(e) => setFormData(prev => ({ ...prev, totalInvested: e.target.value }))}
              placeholder="Ex: 1000,00"
            />
            {formData.quantity && formData.totalInvested && (() => {
              const quantity = parseFloat(formData.quantity.replace(',', '.'));
              const totalInvested = parseFloat(formData.totalInvested.replace(',', '.'));

              if (!isNaN(quantity) && !isNaN(totalInvested) && quantity > 0) {
                const pricePerUnit = totalInvested / quantity;
                return (
                  <p className="text-xs text-gray-500">
                    💡 Preço por {selectedOption?.unit || 'unidade'}: R$ {
                      pricePerUnit.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8
                      })
                    }
                  </p>
                );
              }
              return null;
            })()}
          </div>

          {/* Data de Compra */}
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Data de Compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
            />
          </div>

          {/* Informações do investimento selecionado */}
          {selectedOption && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-1">
                {selectedOption.icon} {selectedOption.name}
              </h4>
              <p className="text-sm text-blue-700">{selectedOption.description}</p>
              <p className="text-xs text-blue-600 mt-1">
                Unidade: {selectedOption.unit} • Símbolo: {selectedOption.symbol}
              </p>
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                💡 <strong>Como calcular:</strong> Informe quanto você comprou (quantidade) e quanto gastou no total (valor investido).
                O sistema calculará automaticamente o preço por unidade.
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange?.(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Investimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
