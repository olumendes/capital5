import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface MonthlyBarChartProps {
  data: MonthlyData[];
  title?: string;
  description?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
};

export default function MonthlyBarChart({ 
  data, 
  title = "Evolução Mensal",
  description = "Receitas vs Despesas nos últimos meses"
}: MonthlyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              📈
            </div>
            <p>Nenhum dado disponível</p>
            <p className="text-sm">Adicione algumas transações para ver o gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="receitas" 
                name="Receitas"
                fill="#10B981" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="despesas" 
                name="Despesas"
                fill="#EF4444" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
