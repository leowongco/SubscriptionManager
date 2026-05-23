import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Icon,
  SimpleGrid,
  List,
} from '@chakra-ui/react';
import { CheckCircle2, XCircle, Loader2, TrendingUp } from 'lucide-react';
import type { RechargeProgress as RechargeProgressType } from '../../types/recharge';

interface RechargeProgressProps {
  progress: RechargeProgressType;
}

export default function RechargeProgress({ progress }: RechargeProgressProps) {
  const { total, completed, success, failed, results, isProcessing } = progress;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

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
              <Box
                animation={isProcessing ? 'spin 1s linear infinite' : undefined}
                display="inline-flex"
              >
                <Icon
                  as={isProcessing ? Loader2 : TrendingUp}
                  color={isProcessing ? 'blue.400' : 'fg.success'}
                />
              </Box>
              <Text color="fg.default" fontSize="lg" fontWeight="bold">
                {isProcessing ? '加值進行中...' : '加值完成'}
              </Text>
            </HStack>
            <Badge
              colorPalette={isProcessing ? 'blue' : success === total ? 'green' : 'yellow'}
              variant="solid"
              fontSize="sm"
            >
              {completed} / {total}
            </Badge>
          </HStack>

          {/* 進度條 */}
          <Box>
            <Progress.Root value={percentage} size="lg" colorPalette="blue">
              <Progress.Track bg="bg.muted" borderRadius="full">
                <Progress.Range borderRadius="full" />
              </Progress.Track>
            </Progress.Root>
            <Text color="fg.muted" fontSize="xs" mt={2} textAlign="right">
              {percentage.toFixed(1)}%
            </Text>
          </Box>

          {/* 統計 */}
          <SimpleGrid columns={3} gap={4}>
            <Box
              bg="bg.subtle"
              borderRadius="lg"
              p={3}
              textAlign="center"
            >
              <Text color="fg.muted" fontSize="xs">
                總數
              </Text>
              <Text color="fg.default" fontSize="xl" fontWeight="bold">
                {total}
              </Text>
            </Box>
            <Box
              bg="bg.subtle"
              borderRadius="lg"
              p={3}
              textAlign="center"
              border="1px solid"
              borderColor="green.500"
            >
              <Text color="fg.success" fontSize="xs">
                成功
              </Text>
              <Text color="fg.success" fontSize="xl" fontWeight="bold">
                {success}
              </Text>
            </Box>
            <Box
              bg={failed > 0 ? 'bg.subtle' : 'bg.subtle'}
              borderRadius="lg"
              p={3}
              textAlign="center"
              border={failed > 0 ? '1px solid' : 'none'}
              borderColor={failed > 0 ? 'red.500' : 'transparent'}
            >
              <Text color={failed > 0 ? 'fg.error' : 'fg.muted'} fontSize="xs">
                失敗
              </Text>
              <Text color={failed > 0 ? 'fg.error' : 'fg.muted'} fontSize="xl" fontWeight="bold">
                {failed}
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* 結果列表 */}
      {results.length > 0 && (
        <Box p={6}>
          <Text color="fg.muted" fontSize="sm" fontWeight="medium" mb={3}>
            詳細結果
          </Text>
          <Box maxH="300px" overflowY="auto">
            <List.Root gap={2}>
              {results.map((result) => (
                <List.Item key={result.account_id}>
                  <Box
                    p={3}
                    bg="bg.subtle"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={result.success ? 'green.700' : 'red.700'}
                  >
                    <HStack justify="space-between">
                      <HStack gap={2}>
                        <Icon
                          as={result.success ? CheckCircle2 : XCircle}
                          color={result.success ? 'fg.success' : 'fg.error'}
                        />
                        <Text color="fg.default" fontSize="sm">
                          {result.apple_id || '未知帳號'}
                        </Text>
                      </HStack>
                      {result.success && result.new_balance !== undefined && (
                        <Text color="fg.success" fontSize="sm" fontWeight="medium">
                          餘額: ${result.new_balance.toFixed(2)}
                        </Text>
                      )}
                      {!result.success && result.message && (
                        <Text color="fg.error" fontSize="xs">
                          {result.message}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </List.Item>
              ))}
            </List.Root>
          </Box>
        </Box>
      )}
    </Box>
  );
}
