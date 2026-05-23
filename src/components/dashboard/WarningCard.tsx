// src/components/dashboard/WarningCard.tsx

import { Box, Flex, Text, Badge, VStack } from '@chakra-ui/react';
import { AlertTriangle, TrendingUp } from 'lucide-react';

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

function getWarningLevel(monthsLeft: number) {
  if (monthsLeft < 0.5) {
    return {
      level: 'critical',
      colorPalette: 'red',
    };
  } else if (monthsLeft < 1.5) {
    return {
      level: 'warning',
      colorPalette: 'orange',
    };
  } else {
    return {
      level: 'normal',
      colorPalette: 'yellow',
    };
  }
}

export function WarningCard({ account }: WarningCardProps) {
  const monthsLeft = account._monthsLeft || 0;
  const warning = getWarningLevel(monthsLeft);

  return (
    <Box
      p={4}
      rounded="xl"
      border="1px solid"
      borderColor={`${warning.colorPalette}.emphasized`}
      bg={`${warning.colorPalette}.subtle`}
      backdropFilter="blur(12px)"
      display="flex"
      flexDirection="column"
      gap={2}
      transition="all"
      _hover={{ transform: 'scale(1.02)', shadow: 'lg' }}
    >
      {/* Header */}
      <Flex justify="space-between" alignItems="start" borderBottom="1px solid" borderColor="border.default" pb={2}>
        <Flex alignItems="center" gap={2}>
          {warning.level === 'critical' && (
            <Box as={AlertTriangle} w={4} h={4} color="fg.error" />
          )}
          {warning.level === 'warning' && (
            <Box as={AlertTriangle} w={4} h={4} color="fg.warning" />
          )}
          {warning.level === 'normal' && (
            <Box as={TrendingUp} w={4} h={4} color="fg.warning" />
          )}
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'base' }} color="fg.default" truncate maxW="120px">
            {account.apple_id}
          </Text>
        </Flex>
        <Badge colorPalette={warning.colorPalette}>
          {monthsLeft.toFixed(1)} 月
        </Badge>
      </Flex>

      {/* Balance Info */}
      <Flex justify="space-between" alignItems="center">
        <Text fontSize="xs" color="fg.muted">
          目前餘額
        </Text>
        <Text fontSize="sm" fontWeight="bold" color="fg.default" fontFamily="mono">
          {account.currency} {account.balance.toFixed(2)}
        </Text>
      </Flex>

      {/* Monthly Burn */}
      {account._monthlyBurn && (
        <Flex justify="space-between" alignItems="center">
          <Text fontSize="xs" color="fg.muted">
            月消耗
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="fg.error" fontFamily="mono">
            -{account.currency} {account._monthlyBurn.toFixed(2)}
          </Text>
        </Flex>
      )}

      {/* Subscriptions */}
      {account.subscriptions && account.subscriptions.length > 0 && (
        <VStack align="start" gap={1} mt={2}>
          <Text fontSize="10px" color="fg.muted" fontWeight="semibold">
            訂閱服務
          </Text>
          {account.subscriptions.slice(0, 2).map(sub => (
            <Text key={sub.id} fontSize="10px" color="fg.muted" truncate maxW="100%">
              • {sub.service_name}
            </Text>
          ))}
          {account.subscriptions.length > 2 && (
            <Text fontSize="10px" color="fg.muted">
              +{account.subscriptions.length - 2} 更多...
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
}