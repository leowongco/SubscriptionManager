import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Badge,
} from '@chakra-ui/react';
import { DollarSign, Edit, Trash2, TrendingUp } from 'lucide-react';

interface Subscription {
    id: string;
    service_name: string;
    base_price: number;
    currency: string;
    cycle: string;
    members?: Array<{ id: string; email: string }>;
}

interface AccountCardProps {
    account: {
        id: string;
        apple_id: string;
        balance: number;
        group_name?: string;
        subscriptions?: Subscription[];
    };
    onAdjustBalance: (account: any) => void;
    onViewDetails: (account: any) => void;
    onEdit: (account: any) => void;
    onDelete: (account: any) => void;
}

export function AccountCard({ account, onAdjustBalance, onViewDetails, onEdit, onDelete }: AccountCardProps) {
    // 計算預估月支出
    const monthlyExpense = account.subscriptions?.reduce((total, sub) => {
        const price = sub.base_price || 0;
        const monthlyPrice = sub.cycle === 'yearly' ? price / 12 : price;
        return total + monthlyPrice;
    }, 0) || 0;

    // 顯示訂閱服務列表（最多 3 個）
    const displaySubscriptions = account.subscriptions?.slice(0, 3) || [];
    const remainingCount = (account.subscriptions?.length || 0) - 3;

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
                {/* 頂部：Apple ID 和餘額 */}
                <HStack justify="space-between" align="start">
                    <VStack align="start" gap={1}>
                        <Text fontWeight="bold" fontSize="lg">
                            {account.apple_id || '未設定 Apple ID'}
                        </Text>
                        {account.group_name && (
                            <Badge colorPalette="purple" fontSize="xs">
                                {account.group_name}
                            </Badge>
                        )}
                    </VStack>
                    <VStack align="end" gap={1}>
                        <HStack gap={1}>
                            <Box as={DollarSign} w={4} h={4} color="green.400" />
                            <Text fontWeight="bold" fontSize="xl" color="green.400">
                                {account.balance?.toFixed(2) || '0.00'}
                            </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">
                            當前餘額
                        </Text>
                    </VStack>
                </HStack>

                {/* 訂閱服務列表 */}
                {displaySubscriptions.length > 0 && (
                    <VStack align="stretch" gap={2}>
                        <Text fontSize="sm" color="gray.400" fontWeight="medium">
                            訂閱服務
                        </Text>
                        {displaySubscriptions.map((sub) => (
                            <HStack key={sub.id} justify="space-between">
                                <Text fontSize="sm" color="gray.300">
                                    {sub.service_name}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    ${sub.base_price?.toFixed(2)}/{sub.cycle === 'yearly' ? '年' : '月'}
                                </Text>
                            </HStack>
                        ))}
                        {remainingCount > 0 && (
                            <Text fontSize="xs" color="gray.500">
                                +{remainingCount} 更多服務
                            </Text>
                        )}
                    </VStack>
                )}

                {/* 預估月支出 */}
                <HStack justify="space-between" p={2} bg="gray.700" rounded="md">
                    <HStack gap={2}>
                        <Box as={TrendingUp} w={4} h={4} color="orange.400" />
                        <Text fontSize="sm" color="gray.400">
                            預估月支出
                        </Text>
                    </HStack>
                    <Text fontWeight="bold" color="orange.400">
                        ${monthlyExpense.toFixed(2)}
                    </Text>
                </HStack>

                {/* 操作按鈕 */}
                <HStack gap={2} flexWrap="wrap">
                    <Button
                        size="sm"
                        colorPalette="blue"
                        variant="outline"
                        onClick={() => onAdjustBalance(account)}
                        flex={1}
                    >
                        調整餘額
                    </Button>
                    <Button
                        size="sm"
                        colorPalette="gray"
                        variant="ghost"
                        onClick={() => onViewDetails(account)}
                    >
                        查看詳情
                    </Button>
                    <Button
                        size="sm"
                        colorPalette="gray"
                        variant="ghost"
                        onClick={() => onEdit(account)}
                    >
                        <Box as={Edit} w={4} h={4} />
                    </Button>
                    <Button
                        size="sm"
                        colorPalette="red"
                        variant="ghost"
                        onClick={() => onDelete(account)}
                    >
                        <Box as={Trash2} w={4} h={4} />
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
}