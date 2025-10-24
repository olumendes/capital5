import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ExpenseData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface ExpensePieChartProps {
  data: ExpenseData[];
  title?: string;
  description?: string;
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-gray-600">
          Valor: {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(data.value)}
        </p>
        <p className="text-sm text-gray-600">
          Porcentagem: {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpensePieChart({ 
  data, 
  title = "Distribuição de Gastos",
  description = "Por categoria este mês"
}: ExpensePieChartProps) {
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
              📊
            </div>
            <p>Nenhum dado disponível</p>
            <p className="text-sm">Adicione algumas despesas para ver o gráfico</p>
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
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload.percentage.toFixed(1)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
