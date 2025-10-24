import { useState } from "react";
import { useFinancial } from "../contexts/FinancialContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { DollarSign } from "lucide-react";

export default function FGTSBalance() {
  const { fgtsBalance, updateFGTSBalance, isLoading } = useFinancial();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState(fgtsBalance.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const numAmount = parseFloat(amount.replace(",", ".")) || 0;
      await updateFGTSBalance(numAmount);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar FGTS:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-600" />
          Saldo FGTS
        </CardTitle>
        <CardDescription>Fundo de Garantia do Tempo de Serviço</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-3xl font-bold text-amber-700">
            {formatCurrency(fgtsBalance)}
          </div>
          <p className="text-sm text-amber-600">
            ℹ️ Saldo não contabilizado no total, mas pode ser usado para
            simulações
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Atualizar Saldo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar Saldo FGTS</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fgts-amount">Saldo FGTS (R$)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fgts-amount"
                      type="text"
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.,]/g, "");
                        setAmount(value);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting || isLoading}
                    className="flex-1"
                  >
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
