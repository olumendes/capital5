import { useState, useEffect } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { TransactionType, Transaction } from '@shared/financial-types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import CategoryModal from './CategoryModal';
import { PlusCircle, DollarSign, CalendarDays } from 'lucide-react';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialType?: TransactionType;
  transactionToEdit?: Transaction | null;
}

export default function TransactionForm({ onSuccess, onCancel, initialType = 'despesa', transactionToEdit }: TransactionFormProps) {
  const { addTransaction, updateTransaction, categories } = useFinancial();
  
  const [formData, setFormData] = useState({
    type: initialType,
    category: '',
    description: '',
    amount: '',
    date: new Date(),
    tags: [] as string[],
    isInstallment: false,
    installments: 1,
    installmentDescription: '',
    isPassiveIncome: false,
    incomeFrequency: 'mensal' as 'diario' | 'semanal' | 'mensal' | 'anual' | 'unico',
    incomeAmountType: 'R$' as 'R$' | '%',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const isEditing = !!transactionToEdit;

  // Efeito para popular o form quando editando
  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        type: transactionToEdit.type,
        category: transactionToEdit.category,
        description: transactionToEdit.description,
        amount: transactionToEdit.amount.toString(),
        date: new Date(transactionToEdit.date),
        tags: transactionToEdit.tags || [],
        isInstallment: false,
        installments: 1,
        installmentDescription: '',
        isPassiveIncome: (transactionToEdit as any).isPassiveIncome || false,
        incomeFrequency: (transactionToEdit as any).incomeFrequency || 'mensal',
        incomeAmountType: (transactionToEdit as any).incomeAmountType || 'R$',
      });
    }
  }, [transactionToEdit]);

  const availableCategories = categories.filter(cat => cat.type === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (!formData.amount || parseAmountValue(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }
    
    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (formData.isInstallment && formData.installments < 2) {
      newErrors.installments = 'Número de parcelas deve ser maior que 1';
    }

    if (formData.isInstallment && formData.installments > 60) {
      newErrors.installments = 'Número máximo de parcelas é 60';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const selectedCategory = categories.find(cat => cat.id === formData.category);
      const totalAmount = parseAmountValue(formData.amount);

      if (isEditing && transactionToEdit) {
        // Atualizar transação existente (não permite parcelamento na edição)
        updateTransaction({
          ...transactionToEdit,
          type: formData.type,
          category: formData.category,
          categoryName: selectedCategory?.name,
          description: formData.description.trim(),
          amount: totalAmount,
          date: formData.date.toISOString().split('T')[0],
          tags: formData.tags,
        });
      } else {
        // Criar nova transação ou parcelamentos
        if (formData.isInstallment) {
          // Criar múltiplas transações parceladas
          const installmentAmount = totalAmount / formData.installments;
          const baseDate = new Date(formData.date);

          for (let i = 0; i < formData.installments; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(installmentDate.getMonth() + i);

            const installmentDescription = formData.installmentDescription
              ? `${formData.installmentDescription} (${i + 1}/${formData.installments})`
              : `${formData.description.trim()} (${i + 1}/${formData.installments})`;

            addTransaction({
              type: formData.type,
              category: formData.category,
              categoryName: selectedCategory?.name,
              description: installmentDescription,
              amount: installmentAmount,
              date: installmentDate.toISOString().split('T')[0],
              source: 'manual',
              tags: [...formData.tags, 'parcelamento'],
              isPassiveIncome: formData.type === 'receita' ? formData.isPassiveIncome : undefined,
              incomeFrequency: formData.type === 'receita' ? formData.incomeFrequency : undefined,
              incomeAmountType: formData.type === 'receita' ? formData.incomeAmountType : undefined,
            } as any);
          }
        } else {
          // Criar transação única
          addTransaction({
            type: formData.type,
            category: formData.category,
            categoryName: selectedCategory?.name,
            description: formData.description.trim(),
            amount: totalAmount,
            date: formData.date.toISOString().split('T')[0],
            source: 'manual',
            tags: formData.tags,
            isPassiveIncome: formData.type === 'receita' ? formData.isPassiveIncome : undefined,
            incomeFrequency: formData.type === 'receita' ? formData.incomeFrequency : undefined,
            incomeAmountType: formData.type === 'receita' ? formData.incomeAmountType : undefined,
          });
        }
      }

      // Reset form apenas se não está editando
      if (!isEditing) {
        setFormData({
          type: initialType,
          category: '',
          description: '',
          amount: '',
          date: new Date(),
          tags: [],
          isInstallment: false,
          installments: 1,
          installmentDescription: '',
          isPassiveIncome: false,
          incomeFrequency: 'mensal',
          incomeAmountType: 'R$',
        });
      }

      onSuccess?.();
    } catch (error) {
      setErrors({ submit: 'Erro ao salvar transação. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatCurrencyInput = (value: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    let numericValue = value.replace(/[^\d.,]/g, '');

    // Permitir apenas uma vírgula ou ponto
    const parts = numericValue.split(/[.,]/);
    if (parts.length > 2) {
      numericValue = parts[0] + ',' + parts[1];
    }

    return numericValue;
  };

  const parseAmountValue = (value: string): number => {
    // Converter vírgula para ponto para parseFloat
    const normalizedValue = value.replace(',', '.');
    return parseFloat(normalizedValue) || 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? 'Modifique os dados da sua transação'
            : 'Adicione uma nova receita ou despesa ao seu controle financeiro'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo da Transação */}
          <div className="space-y-2">
            <Label>Tipo da Transação</Label>
            <RadioGroup 
              value={formData.type} 
              onValueChange={(value: TransactionType) => {
                setFormData(prev => ({ ...prev, type: value, category: '' }));
                setErrors(prev => ({ ...prev, category: '' }));
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receita" id="receita" />
                <Label htmlFor="receita" className="text-green-600 font-medium">
                  💰 Receita
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="despesa" id="despesa" />
                <Label htmlFor="despesa" className="text-red-600 font-medium">
                  💸 Despesa
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">
                Categoria *
              </Label>
              <CategoryModal
                open={categoryModalOpen}
                onOpenChange={(open) => {
                  setCategoryModalOpen(open);
                  // Quando o modal fechar, verificar se a categoria selecionada ainda é válida
                  if (!open && formData.category) {
                    const categoryExists = availableCategories.find(cat => cat.id === formData.category);
                    if (!categoryExists) {
                      setFormData(prev => ({ ...prev, category: '' }));
                    }
                  }
                }}
              >
                <Button type="button" variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Nova Categoria
                </Button>
              </CategoryModal>
            </div>
            <Select
              key={`category-select-${availableCategories.length}`}
              value={formData.category}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, category: value }));
                setErrors(prev => ({ ...prev, category: '' }));
              }}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent
                className="max-h-[60vh] overflow-y-auto"
                position="popper"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição *
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Almoço no restaurante, Salário do mês, etc."
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                setErrors(prev => ({ ...prev, description: '' }));
              }}
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Valor (R$) *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="text"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => {
                  const value = formatCurrencyInput(e.target.value);
                  setFormData(prev => ({ ...prev, amount: value }));
                  setErrors(prev => ({ ...prev, amount: '' }));
                }}
                className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Parcelamento */}
          {!isEditing && (
            <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isInstallment"
                  checked={formData.isInstallment}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      isInstallment: !!checked,
                      installments: checked ? 2 : 1
                    }));
                    setErrors(prev => ({ ...prev, installments: '' }));
                  }}
                />
                <Label htmlFor="isInstallment" className="flex items-center gap-2 font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Parcelar esta transação
                </Label>
              </div>

              {formData.isInstallment && (
                <div className="space-y-3 ml-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="installments">Número de Parcelas *</Label>
                      <Input
                        id="installments"
                        type="number"
                        min="2"
                        max="60"
                        value={formData.installments}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setFormData(prev => ({ ...prev, installments: value }));
                          setErrors(prev => ({ ...prev, installments: '' }));
                        }}
                        className={errors.installments ? 'border-red-500' : ''}
                      />
                      {errors.installments && (
                        <p className="text-sm text-red-500">{errors.installments}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Valor por Parcela</Label>
                      <div className="bg-gray-100 px-3 py-2 rounded-md text-sm">
                        {formData.amount && formData.installments > 0
                          ? formatCurrency(parseAmountValue(formData.amount) / formData.installments)
                          : 'R$ 0,00'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="installmentDescription">Descrição do Parcelamento (opcional)</Label>
                    <Input
                      id="installmentDescription"
                      value={formData.installmentDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, installmentDescription: e.target.value }))}
                      placeholder="Ex: Compra no cartão de crédito"
                    />
                    <p className="text-xs text-gray-500">
                      Se não preenchido, será usado: "{formData.description.trim() || 'Nova transação'}"
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Como funciona:</strong> Serão criadas {formData.installments} transações de {
                        formData.amount ? formatCurrency(parseAmountValue(formData.amount) / formData.installments) : 'R$ 0,00'
                      } cada uma, distribuídas mensalmente a partir da data selecionada.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date">Data da Transação</Label>
            <Input
              id="date"
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Adicionar
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Erro geral */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? 'Salvando...'
                : isEditing ? 'Atualizar Transação' : 'Salvar Transação'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
