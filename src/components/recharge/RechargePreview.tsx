import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  SimpleGrid,
  Button,
  Separator,
} from '@chakra-ui/react';
import { CreditCard, Wallet, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { RechargePreview as RechargePreviewType } from '../../types/recharge';

interface RechargePreviewProps {
  previews: RechargePreviewType[];
  totalAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function RechargePreview({
  previews,
  totalAmount,
  onConfirm,
  onCancel,
  loading = false,
}: RechargePreviewProps) {
  if (previews.length === 0) {
    return (
      <Box
        bg="gray.800"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="xl"
        p={6}
      >
        <VStack gap={4}>
          <Icon as={AlertCircle} color="yellow.400" boxSize={8} />
          <Text color="gray.400">
            請先選擇要加值的帳號
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor="gray.700"
      borderRadius="xl"
      overflow="hidden"
    >
      {/* Header */}
      <Box p={6} borderBottom="1px solid" borderColor="gray.700">
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <HStack gap={2}>
              <Icon as={CreditCard} color="blue.400" />
              <Text color="white" fontSize="lg" fontWeight="bold">
                加值預覽
              </Text>
            </HStack>
            <Badge colorPalette="green" variant="solid" fontSize="sm">
              {previews.length} 個帳號
            </Badge>
          </HStack>

          {/* 總金額統計 */}
          <Box
            bg="rgba(72, 187, 120, 0.1)"
            border="1px solid"
            borderColor="green.500"
            borderRadius="lg"
            p={4}
          >
            <HStack justify="space-between">
              <HStack gap={2}>
                <Icon as={Wallet} color="green.400" />
                <Text color="gray.300" fontSize="sm">
                  總加值金額
                </Text>
              </HStack>
              <Text color="green.400" fontSize="xl" fontWeight="bold">
                ${totalAmount.toFixed(2)}
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Box>

      {/* 帳號列表 */}
      <Box p={6}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
          {previews.map((preview) => (
            <Box
              key={preview.account_id}
              p={4}
              bg="gray.900"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.700"
            >
              <VStack gap={2} align="stretch">
                {/* Apple ID */}
                <Text color="white" fontSize="sm" fontWeight="medium">
                  {preview.apple_id || '未知帳號'}
                </Text>

                <Separator borderColor="gray.700" />

                {/* 目前餘額 */}
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="xs">
                    目前餘額
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    ${preview.current_balance.toFixed(2)}
                  </Text>
                </HStack>

                {/* 加值金額 */}
                <HStack justify="space-between">
                  <Text color="blue.400" fontSize="xs">
                    加值金額
                  </Text>
                  <Text color="blue.400" fontSize="sm" fontWeight="medium">
                    +${preview.recharge_amount.toFixed(2)}
                  </Text>
                </HStack>

                <Separator borderColor="gray.700" />

                {/* 加值後餘額 */}
                <HStack justify="space-between">
                  <Text color="green.400" fontSize="xs" fontWeight="medium">
                    加值後餘額
                  </Text>
                  <Text color="green.400" fontSize="sm" fontWeight="bold">
                    ${preview.new_balance.toFixed(2)}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* 操作按鈕 */}
      <Box p={6} borderTop="1px solid" borderColor="gray.700">
        <HStack gap={4} justify="flex-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            borderColor="gray.600"
            color="gray.300"
            _hover={{
              bg: 'gray.700',
              borderColor: 'gray.500',
            }}
          >
            <Icon as={XCircle} mr={2} />
            取消
          </Button>
          <Button
            colorPalette="green"
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            loadingText="處理中..."
          >
            <Icon as={CheckCircle2} mr={2} />
            確認加值
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}