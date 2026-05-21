import { Link } from 'react-router-dom';
import { ExternalLink, Eye, Edit, Calendar } from 'lucide-react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
} from '@chakra-ui/react';
import type { TelegramGroup } from '../../types/telegram-groups';

interface GroupCardProps {
  group: TelegramGroup;
  onEdit?: (group: TelegramGroup) => void;
}

const billingCycleLabels = {
  monthly: '每月',
  biannually: '半年',
  yearly: '一年',
};

const billingCycleColors = {
  monthly: 'green',
  biannually: 'blue',
  yearly: 'orange',
};

export default function GroupCard({ group, onEdit }: GroupCardProps) {
  const accountCount = group.account_count || 0;

  return (
    <Box
      p={5}
      bg="gray.800"
      rounded="xl"
      border="1px"
      borderColor="gray.700"
      transition="all 0.2s"
      _hover={{ borderColor: 'gray.600', shadow: 'lg' }}
    >
      <VStack align="stretch" gap={4}>
        {/* 頂部：群組名稱和收費週期 */}
        <HStack justify="space-between" align="start">
          <VStack align="start" gap={1}>
            <Text fontWeight="bold" fontSize="lg" color="white">
              {group.name}
            </Text>
            {group.telegram_link && (
              <HStack gap={1}>
                <Box as={ExternalLink} w={4} h={4} color="blue.400" />
                <a
                  href={group.telegram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Text
                    fontSize="sm"
                    color="blue.400"
                    _hover={{ color: 'blue.300', textDecoration: 'underline' }}
                  >
                    Telegram 群組
                  </Text>
                </a>
              </HStack>
            )}
          </VStack>
          <Badge colorPalette={billingCycleColors[group.billing_cycle_type]} fontSize="xs">
            {billingCycleLabels[group.billing_cycle_type]}
          </Badge>
        </HStack>

        {/* 扣費日和帳號數量 */}
        <HStack gap={4} justify="space-between">
          <HStack gap={2}>
            <Box as={Calendar} w={4} h={4} color="gray.400" />
            <Text fontSize="sm" color="gray.400">
              每月 {group.billing_day} 日扣費
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            {accountCount} 個 Apple ID
          </Text>
        </HStack>

        {/* 收款進度（模擬數據，實際需要從 API 獲取） */}
        <VStack align="stretch" gap={2}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.400">本期收款進度</Text>
            <Text fontSize="sm" color="gray.400">
              0 / {accountCount}
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
              w="0%"
              bg="blue.500"
              rounded="full"
              transition="width 0.3s"
            />
          </Box>
        </VStack>

        {/* 操作按鈕 */}
        <HStack gap={2} flexWrap="wrap">
          <Link to={`/groups/${group.id}`} style={{ flex: 1 }}>
            <Button
              size="sm"
              colorPalette="blue"
              variant="outline"
              width="full"
            >
              <HStack gap={2}>
                <Box as={Eye} w={4} h={4} />
                <Text>查看詳情</Text>
              </HStack>
            </Button>
          </Link>
          {onEdit && (
            <Button
              size="sm"
              colorPalette="gray"
              variant="ghost"
              onClick={() => onEdit(group)}
              aria-label="編輯群組"
            >
              <HStack gap={2}>
                <Box as={Edit} w={4} h={4} />
                <Text>編輯</Text>
              </HStack>
            </Button>
          )}
        </HStack>

        {/* 備註 */}
        {group.notes && (
          <Text fontSize="xs" color="gray.500" mt={2}>
            備註: {group.notes}
          </Text>
        )}
      </VStack>
    </Box>
  );
}