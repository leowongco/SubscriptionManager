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
      bg="bg.panel"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="blue.emphasized"
      rounded="xl"
      shadow="2xl"
      overflow="hidden"
      position="relative"
      role="group"
    >
      {/* Hover gradient effect */}
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(to bottom right, var(--chakra-colors-blue-500/10), var(--chakra-colors-blue-600/5))"
        opacity={0}
        _groupHover={{ opacity: 1 }}
        transition="opacity 0.5s"
        pointerEvents="none"
      />
      
      <Flex p={6} flexDirection="row" alignItems="center" justifyContent="space-between" pb={2} position="relative" zIndex={10}>
        <Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color="blue.emphasized" textTransform="uppercase" letterSpacing="wider">
          餘額趨勢
        </Text>
        <Box p={2} bg="blue.subtle" rounded={{ base: 'lg', md: 'xl' }}>
          <Box as={TrendingUp} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color="blue.solid" />
        </Box>
      </Flex>
      
      <Box p={6} pt={0} position="relative" zIndex={10}>
        <Box h={{ base: '200px', md: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="border.emphasized" />
              <XAxis
                dataKey="date"
                stroke="fg.muted"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="fg.muted"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${currency}${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--chakra-colors-bg-panel)',
                  border: '1px solid var(--chakra-colors-border-default)',
                  borderRadius: '8px',
                  color: 'var(--chakra-colors-fg-default)'
                }}
                labelStyle={{ color: 'var(--chakra-colors-fg-muted)' }}
                formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, '餘額']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                name="餘額"
                stroke="blue.solid"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'blue.solid', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'blue.solid', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}