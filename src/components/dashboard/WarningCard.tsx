// src/components/dashboard/WarningCard.tsx

import { Box, Flex, Text, Badge, VStack, Grid } from '@chakra-ui/react';
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
      color: 'red',
      bgColor: 'rgba(127, 29, 29, 0.2)',
      borderColor: 'rgba(220, 38, 38, 0.5)',
      textColor: 'red.300',
      badgeBg: 'rgba(220, 38, 38, 1)',
      icon: <Box as={AlertTriangle} w={4} h={4} color="red.500" />,
    };
  } else if (monthsLeft < 1.5) {
    return {
      level: 'warning',
      color: 'orange',
      bgColor: 'rgba(124, 45, 18, 0.2)',
      borderColor: 'rgba(234, 88, 12, 0.5)',
      textColor: 'orange.300',
      badgeBg: 'rgba(234, 88, 12, 1)',
      icon: <Box as={AlertTriangle} w={4} h={4} color="orange.500" />,
    };
  } else {
    return {
      level: 'normal',
      color: 'yellow',
      bgColor: 'rgba(113, 63, 18, 0.2)',
      borderColor: 'rgba(202, 138, 4, 0.5)',
      textColor: 'yellow.300',
      badgeBg: 'rgba(202, 138, 4, 1)',
      icon: <Box as={TrendingUp} w={4} h={4} color="yellow.500" />,
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
      borderColor={warning.borderColor}
      bg={warning.bgColor}
      backdropFilter="blur(12px)"
      display="flex"
      flexDirection="column"
      gap={2}
      transition="all"
      _hover={{ transform: 'scale(1.02)', shadow: 'lg' }}
    >
      {/* Header */}
      <Flex justify="space-between" alignItems="start" borderBottom="1px solid rgba(38, 38, 38, 0.4)" pb={2}>
        <Flex alignItems="center" gap={2}>
          {warning.icon}
          <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'base' }} truncate maxW="120px">
            {account.apple_id}
          </Text>
        </Flex>
        <Badge bg={warning.badgeBg} color="white">
          {monthsLeft.toFixed(1)} 月
        </Badge>
      </Flex>

      {/* Stats */}
      <Grid templateColumns="repeat(2, 1fr)" gap={2} fontSize="xs">
        <VStack align="start" gap={0}>
          <Text color="gray.500">餘額</Text>
          <Text fontWeight="bold" color={warning.textColor}>
            {account.currency} {account.balance.toFixed(2)}
          </Text>
        </VStack>
        <VStack align="start" gap={0}>
          <Text color="gray.500">月支出</Text>
          <Text fontWeight="bold" color={warning.textColor}>
            {account.currency} {(account._monthlyBurn || 0).toFixed(2)}
          </Text>
        </VStack>
      </Grid>

      {/* Subscriptions */}
      {account.subscriptions && account.subscriptions.length > 0 && (
        <Box mt={2} pt={2} borderTop="1px solid rgba(38, 38, 38, 0.4)">
          <Text fontSize="xs" color="gray.500" mb={1}>訂閱服務</Text>
          <VStack gap={1} align="stretch">
            {account.subscriptions.slice(0, 3).map((sub) => (
              <Flex key={sub.id} justify="space-between" alignItems="center" fontSize="xs">
                <Text color="gray.400" truncate maxW="120px">
                  {sub.service_name}
                </Text>
                <Text fontFamily="mono" color="gray.300">
                  {sub.currency} {(sub.base_price || 0).toFixed(2)}
                </Text>
              </Flex>
            ))}
            {account.subscriptions.length > 3 && (
              <Text fontSize="xs" color="gray.500">
                +{account.subscriptions.length - 3} 更多...
              </Text>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}