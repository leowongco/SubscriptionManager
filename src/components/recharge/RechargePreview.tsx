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
        bg="bg.panel"
        border="1px solid"
        borderColor="border.default"
        borderRadius="xl"
        p={6}
      >
        <VStack gap={4}>
          <Icon as={AlertCircle} color="fg.warning" boxSize={8} />
          <Text color="fg.muted">
            請先選擇要加值的帳號
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="bg.panel"
      border="1px solid"
      borderColor="border.default"
      borderRadius="xl"
      overflow="hidden"
    >
      {/* Header */}
      <Box p={6} borderBottom="1px solid" borderColor="border.default">
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <HStack gap={2}>
              <Icon as={CreditCard} color="blue.400" />
              <Text color="fg.default" fontSize="lg" fontWeight="bold">
                加值預覽
              </Text>
            </HStack>
            <Badge colorPalette="green" variant="solid" fontSize="sm">
              {previews.length} 個帳號
            </Badge>
          </HStack>

          {/* 總金額統計 */}
          <Box
            bg="bg.subtle"
            border="1px solid"
            borderColor="green.500"
            borderRadius="lg"
            p={4}
          >
            <HStack justify="space-between">
              <HStack gap={2}>
                <Icon as={Wallet} color="fg.success" />
                <Text color="fg.muted" fontSize="sm">
                  總加值金額
                </Text>
              </HStack>
              <Text color="fg.success" fontSize="xl" fontWeight="bold">
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
              bg="bg.subtle"
              borderRadius="lg"
              border="1px solid"
              borderColor="border.default"
            >
              <VStack gap={2} align="stretch">
                {/* Apple ID */}
                <Text color="fg.default" fontSize="sm" fontWeight="medium">
                  {preview.apple_id || '未知帳號'}
                </Text>

                <Separator borderColor="border.default" />

                {/* 目前餘額 */}
                <HStack justify="space-between">
                  <Text color="fg.muted" fontSize="xs">
                    目前餘額
                  </Text>
                  <Text color="fg.muted" fontSize="sm">
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

                <Separator borderColor="border.default" />

                {/* 加值後餘額 */}
                <HStack justify="space-between">
                  <Text color="fg.success" fontSize="xs" fontWeight="medium">
                    加值後餘額
                  </Text>
                  <Text color="fg.success" fontSize="sm" fontWeight="bold">
                    ${preview.new_balance.toFixed(2)}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* 操作按鈕 */}
      <Box p={6} borderTop="1px solid" borderColor="border.default">
        <HStack gap={4} justify="flex-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            borderColor="border.emphasized"
            color="fg.muted"
            _hover={{
              bg: 'bg.hover',
              borderColor: 'border.default',
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
