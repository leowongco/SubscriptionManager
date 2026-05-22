// src/components/dashboard/WarningCard.tsx

import { Box, Flex, Text, Badge, VStack } from '@chakra-ui/react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useColorModeValue } from '@/components/ui/color-mode';

interface WarningCardProps {
  account: {
    id: string;
    apple_id: string;
    balance: number;
    currency: string;
    _monthlyBurn?: number;
    _monthsLeft?: number;
    subscriptions?: { id: string; service_name: string; currency: string; base_price?: number }[];
  };
}

function getWarningLevel(monthsLeft: number, isDark: boolean) {
  if (monthsLeft < 0.5) {
    return {
      level: 'critical',
      colorPalette: 'red',
      icon: <Box as={AlertTriangle} w={4} h={4} color={isDark ? "red.500" : "red.600"} />,
    };
  } else if (monthsLeft < 1.5) {
    return {
      level: 'warning',
      colorPalette: 'orange',
      icon: <Box as={AlertTriangle} w={4} h={4} color={isDark ? "orange.500" : "orange.600"} />,
    };
  } else {
    return {
      level: 'normal',
      colorPalette: 'yellow',
      icon: <Box as={TrendingUp} w={4} h={4} color={isDark ? "yellow.500" : "yellow.600"} />,
    };
  }
}

export function WarningCard({ account }: WarningCardProps) {
  const monthsLeft = account._monthsLeft || 0;
  
  // Color mode values
  const textColor = useColorModeValue('gray.900', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');
  
  // Dynamic colors based on warning level
  const getWarningColors = (colorPalette: string) => ({
    bg: useColorModeValue(`${colorPalette}.50`, `${colorPalette}.900/20`),
    border: useColorModeValue(`${colorPalette}.200`, `${colorPalette}.500/50`),
  });
  
  const isDark = useColorModeValue(false, true);
  const warning = getWarningLevel(monthsLeft, isDark);
  const warningColors = getWarningColors(warning.colorPalette);

  return (
    <Box
      p={4}
      rounded="xl"
      border="1px solid"
      borderColor={warningColors.border}
      bg={warningColors.bg}
      backdropFilter="blur(12px)"
      display="flex"
      flexDirection="column"
      gap={2}
      transition="all"
      _hover={{ transform: 'scale(1.02)', shadow: 'lg' }}
    >
      {/* Header */}
      <Flex justify="space-between" alignItems="start" borderBottom="1px solid" borderColor={dividerColor} pb={2}>
        <Flex alignItems="center" gap={2}>
          {warning.icon}
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'base' }} color={textColor} truncate maxW="120px">
            {account.apple_id}
          </Text>
        </Flex>
        <Badge colorPalette={warning.colorPalette}>
          {monthsLeft.toFixed(1)} 月
        </Badge>
      </Flex>

      {/* Balance Info */}
      <Flex justify="space-between" alignItems="center">
        <Text fontSize="xs" color={secondaryTextColor}>
          目前餘額
        </Text>
        <Text fontSize="sm" fontWeight="bold" color={textColor} fontFamily="mono">
          {account.currency} {account.balance.toFixed(2)}
        </Text>
      </Flex>

      {/* Monthly Burn */}
      {account._monthlyBurn && (
        <Flex justify="space-between" alignItems="center">
          <Text fontSize="xs" color={secondaryTextColor}>
            月消耗
          </Text>
          <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('red.600', 'red.400')} fontFamily="mono">
            -{account.currency} {account._monthlyBurn.toFixed(2)}
          </Text>
        </Flex>
      )}

      {/* Subscriptions */}
      {account.subscriptions && account.subscriptions.length > 0 && (
        <VStack align="start" gap={1} mt={2}>
          <Text fontSize="10px" color={mutedTextColor} fontWeight="semibold">
            訂閱服務
          </Text>
          {account.subscriptions.slice(0, 2).map(sub => (
            <Text key={sub.id} fontSize="10px" color={secondaryTextColor} truncate maxW="100%">
              • {sub.service_name}
            </Text>
          ))}
          {account.subscriptions.length > 2 && (
            <Text fontSize="10px" color={mutedTextColor}>
              +{account.subscriptions.length - 2} 更多...
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
}