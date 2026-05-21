// src/components/dashboard/BalanceTrendChart.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface BalanceTrendChartProps {
  data: Array<{
    date: string;
    balance: number;
  }>;
  currency?: string;
}

export function BalanceTrendChart({ data, currency = 'HK$' }: BalanceTrendChartProps) {
  return (
    <Card className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          餘額趨勢
        </CardTitle>
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] md:h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${currency}${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, '餘額']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                name="餘額"
                stroke="#818CF8"
                strokeWidth={2}
                dot={{ fill: '#818CF8', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#6366F1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}