import { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { TransactionType } from '@shared/financial-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PlusCircle, Palette } from 'lucide-react';

interface CategoryModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_ICONS = [
  '💰', '💸', '🍽️', '🚗', '🏠', '⚕️', '📚', '🎬', '🛍️', '🔧',
  '💼', '💻', '📈', '🎯', '🎮', '🏋️', '🎨', '📱', '🧳', '💊',
  '⛽', '🛒', '🍔', '☕', '🍕', '🍺', '🎪', '📰', '🚌', '✈️'
];

const DEFAULT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#C026D3', '#DB2777', '#E11D48', '#F43F5E'
];

export default function CategoryModal({ children, open, onOpenChange }: CategoryModalProps) {
  const { addCategory } = useFinancial();
  const [formData, setFormData] = useState({
    name: '',
    type: 'despesa' as TransactionType,
    icon: '💰',
    color: '#EF4444'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da categoria é obrigatório';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      addCategory({
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon,
        color: formData.color
      });

      // Reset form
      setFormData({
        name: '',
        type: 'despesa',
        icon: '💰',
        color: '#EF4444'
      });

      onOpenChange?.(false);
    } catch (error) {
      setErrors({ submit: 'Erro ao criar categoria. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      type: 'despesa',
      icon: '💰',
      color: '#EF4444'
    });
    setErrors({});
    onOpenChange?.(false);
  };

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
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>
            Crie uma categoria personalizada para organizar suas transações
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Criar Nova Categoria
            </CardTitle>
            <CardDescription>
              Adicione uma categoria personalizada para organizar suas transações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome da Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoryName">
                  Nome da Categoria *
                </Label>
                <Input
                  id="categoryName"
                  placeholder="Ex: Gasolina, Medicamentos, Freelances..."
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <RadioGroup 
                  value={formData.type} 
                  onValueChange={(value: TransactionType) => {
                    setFormData(prev => ({ ...prev, type: value }));
                  }}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="receita" id="cat-receita" />
                    <Label htmlFor="cat-receita" className="text-green-600 font-medium">
                      💰 Receita
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="despesa" id="cat-despesa" />
                    <Label htmlFor="cat-despesa" className="text-red-600 font-medium">
                      💸 Despesa
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Ícone */}
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                  {DEFAULT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`p-2 text-2xl rounded-lg border-2 transition-colors ${
                        formData.icon === icon 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Cor
                </Label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        formData.color === color 
                          ? 'border-gray-800 scale-110' 
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{formData.icon}</span>
                    <div>
                      <p className="font-medium">{formData.name || 'Nome da categoria'}</p>
                      <p className="text-sm text-gray-600">
                        Tipo: {formData.type === 'receita' ? 'Receita' : 'Despesa'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Erro geral */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Categoria'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
