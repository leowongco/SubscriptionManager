import { Calendar, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
import type { BillingCycle, MemberPayment } from '../../types/telegram-groups';

interface BillingCycleCardProps {
  cycle: BillingCycle;
  memberPayments?: MemberPayment[];
}

const statusLabels = {
  active: '進行中',
  completed: '已完成',
  refunded: '已退款',
};

const statusColors = {
  active: 'blue',
  completed: 'green',
  refunded: 'orange',
};

export default function BillingCycleCard({ cycle, memberPayments = [] }: BillingCycleCardProps) {
  const paidCount = memberPayments.filter((p) => p.paid).length;
  const totalCount = memberPayments.length;
  const progressPercent = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
  const totalAmount = cycle.amount_per_member * totalCount;
  const collectedAmount = cycle.amount_per_member * paidCount;

  return (
    <Box
      p={5}
      bg="gray.800"
      rounded="xl"
      border="1px"
      borderColor="gray.700"
      transition="all 0.2s"
      _hover={{ borderColor: 'gray.600' }}
    >
      <VStack align="stretch" gap={4}>
        {/* 頂部：日期範圍和狀態 */}
        <HStack justify="space-between" align="start">
          <VStack align="start" gap={1}>
            <HStack gap={2}>
              <Box as={Calendar} w={4} h={4} color="gray.400" />
              <Text fontSize="sm" color="gray.400">
                {cycle.start_date} ~ {cycle.end_date}
              </Text>
            </HStack>
          </VStack>
          <Badge colorPalette={statusColors[cycle.status]} fontSize="xs">
            {statusLabels[cycle.status]}
          </Badge>
        </HStack>

        {/* 金額信息 */}
        <HStack justify="space-between" p={3} bg="gray.700" rounded="md">
          <VStack align="start" gap={1}>
            <Text fontSize="xs" color="gray.500">
              每人金額
            </Text>
            <HStack gap={1}>
              <Box as={DollarSign} w={4} h={4} color="green.400" />
              <Text fontWeight="bold" color="green.400">
                ${cycle.amount_per_member.toFixed(2)}
              </Text>
            </HStack>
          </VStack>
          <VStack align="end" gap={1}>
            <Text fontSize="xs" color="gray.500">
              總金額
            </Text>
            <Text fontWeight="bold" color="white">
              ${totalAmount.toFixed(2)}
            </Text>
          </VStack>
        </HStack>

        {/* 收款進度 */}
        <VStack align="stretch" gap={2}>
          <HStack justify="space-between">
            <HStack gap={2}>
              <Box as={Users} w={4} h={4} color="gray.400" />
              <Text fontSize="sm" color="gray.400">
                收款進度
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.400">
              {paidCount} / {totalCount} 人
            </Text>
          </HStack>
          <Box
            w="full"
            h="8px"
            bg="gray.700"
            rounded="full"
            overflow="hidden"
          >
            <Box
              h="full"
              w={`${progressPercent}%`}
              bg="green.500"
              rounded="full"
              transition="width 0.3s"
            />
          </Box>
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.500">
              已收: ${collectedAmount.toFixed(2)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              未收: ${(totalAmount - collectedAmount).toFixed(2)}
            </Text>
          </HStack>
        </VStack>

        {/* 成員付款狀態列表（最多顯示 5 個） */}
        {memberPayments.length > 0 && (
          <VStack align="stretch" gap={2}>
            <Text fontSize="sm" color="gray.400" fontWeight="medium">
              成員付款狀態
            </Text>
            {memberPayments.slice(0, 5).map((payment) => (
              <HStack
                key={payment.id}
                justify="space-between"
                p={2}
                bg="gray.700"
                rounded="md"
              >
                <Text fontSize="sm" color="gray.300">
                  {payment.member?.email || `成員 ${payment.member_id}`}
                </Text>
                <HStack gap={1}>
                  {payment.paid ? (
                    <>
                      <Box as={CheckCircle} w={4} h={4} color="green.400" />
                      <Text fontSize="xs" color="green.400">
                        已付款
                      </Text>
                    </>
                  ) : (
                    <>
                      <Box as={XCircle} w={4} h={4} color="red.400" />
                      <Text fontSize="xs" color="red.400">
                        未付款
                      </Text>
                    </>
                  )}
                </HStack>
              </HStack>
            ))}
            {memberPayments.length > 5 && (
              <Text fontSize="xs" color="gray.500">
                +{memberPayments.length - 5} 更多成員
              </Text>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}