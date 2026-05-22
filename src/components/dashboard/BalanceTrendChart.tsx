// src/components/dashboard/BalanceTrendChart.tsx

import { Box, Flex, Text } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useColorModeValue } from '@/components/ui/color-mode';

interface BalanceTrendChartProps {
  data: Array<{
    date: string;
    balance: number;
  }>;
  currency?: string;
}

export function BalanceTrendChart({ data, currency = 'HK$' }: BalanceTrendChartProps) {
  // Color mode values for light/dark mode support
  const cardBg = useColorModeValue('white', 'gray.900/40');
  const cardBorderColor = useColorModeValue('blue.200', 'blue.500/20');
  const titleColor = useColorModeValue('blue.700', 'blue.400');
  const iconBg = useColorModeValue('blue.100', 'blue.500/10');
  const iconColor = useColorModeValue('blue.600', 'blue.400');
  
  // Chart colors - using blue as primary color (Phase 1 unified)
  const gridStroke = useColorModeValue('#E5E7EB', '#374151');
  const axisStroke = useColorModeValue('#6B7280', '#9CA3AF');
  const tooltipBg = useColorModeValue('#FFFFFF', '#1F2937');
  const tooltipBorder = useColorModeValue('#E5E7EB', '#374151');
  const tooltipColor = useColorModeValue('#1F2937', '#F3F4F6');
  const tooltipLabelColor = useColorModeValue('#6B7280', '#9CA3AF');
  
  // Line colors - blue theme
  const lineStroke = useColorModeValue('#3B82F6', '#60A5FA'); // blue.500 / blue.400
  const dotFill = useColorModeValue('#3B82F6', '#60A5FA');
  const activeDotFill = useColorModeValue('#2563EB', '#3B82F6'); // blue.600 / blue.500

  return (
    <Box
      bg={cardBg}
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor={cardBorderColor}
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
        <Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color={titleColor} textTransform="uppercase" letterSpacing="wider">
          餘額趨勢
        </Text>
        <Box p={2} bg={iconBg} rounded={{ base: 'lg', md: 'xl' }}>
          <Box as={TrendingUp} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color={iconColor} />
        </Box>
      </Flex>
      
      <Box p={6} pt={0} position="relative" zIndex={10}>
        <Box h={{ base: '200px', md: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="date"
                stroke={axisStroke}
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke={axisStroke}
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${currency}${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px',
                  color: tooltipColor
                }}
                labelStyle={{ color: tooltipLabelColor }}
                formatter={(value) => [`${currency}${Number(value).toFixed(2)}`, '餘額']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                name="餘額"
                stroke={lineStroke}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: dotFill, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: activeDotFill, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}