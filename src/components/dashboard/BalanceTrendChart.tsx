// src/components/dashboard/BalanceTrendChart.tsx

import { Box, Flex, Text } from '@chakra-ui/react';
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
    <Box
      bg="rgba(23, 23, 23, 0.4)"
      backdropFilter="blur(20px)"
      border="1px solid rgba(38, 38, 38, 0.6)"
      rounded="xl"
      shadow="2xl"
    >
      <Flex p={6} flexDirection="row" alignItems="center" justifyContent="space-between" pb={2}>
        <Text fontSize="sm" fontWeight="semibold" color="indigo.400" textTransform="uppercase" letterSpacing="wider">
          餘額趨勢
        </Text>
        <Box p={2} bg="rgba(99, 102, 241, 0.1)" rounded="lg">
          <Box as={TrendingUp} h={4} w={4} color="indigo.400" />
        </Box>
      </Flex>
      <Box p={6} pt={0}>
        <Box h={{ base: '200px', md: '250px' }}>
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
                strokeDasharray="5 5"
                dot={{ fill: '#818CF8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#6366F1', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}