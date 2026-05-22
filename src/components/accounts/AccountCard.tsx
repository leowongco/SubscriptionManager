import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Badge,
} from '@chakra-ui/react';
import { DollarSign, Edit, Trash2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useColorModeValue } from '@/components/ui/color-mode';

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
        currency?: string;
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
    
    // Color mode values
    const cardBg = useColorModeValue('white', 'gray.800');
    const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
    const cardHoverBorderColor = useColorModeValue('gray.300', 'gray.600');
    const textColor = useColorModeValue('gray.900', 'white');
    const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
    const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
    const balanceColor = useColorModeValue('green.600', 'green.400');
    const expenseBg = useColorModeValue('gray.100', 'gray.700');
    const expenseColor = useColorModeValue('orange.600', 'orange.400');

    return (
        <Box
            p={5}
            bg={cardBg}
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor={cardBorderColor}
            rounded="xl"
            shadow="xl"
            overflow="hidden"
            transition="all"
            _hover={{ shadow: '2xl', transform: 'translateY(-2px)' }}
        >
            <VStack align="stretch" gap={4}>
                {/* 頂部：Apple ID 和餘額 */}
                <HStack justify="space-between" align="start">
                    <VStack align="start" gap={1}>
                        <Text fontWeight="bold" fontSize="lg" color={textColor}>
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
                            <Box as={DollarSign} w={4} h={4} color={balanceColor} />
                            <Text fontWeight="bold" fontSize="xl" color={balanceColor}>
                                {formatCurrency(account.balance || 0, account.currency)}
                            </Text>
                        </HStack>
                        <HStack gap={1}>
                            <Text fontSize="xs" color={mutedTextColor}>
                                當前餘額
                            </Text>
                            {account.currency && account.currency !== 'HKD' && (
                                <Badge colorPalette="cyan" fontSize="xs">
                                    {account.currency}
                                </Badge>
                            )}
                        </HStack>
                    </VStack>
                </HStack>

                {/* 訂閱服務列表 */}
                {displaySubscriptions.length > 0 && (
                    <VStack align="stretch" gap={2}>
                        <Text fontSize="sm" color={secondaryTextColor} fontWeight="medium">
                            訂閱服務
                        </Text>
                        {displaySubscriptions.map((sub) => (
                            <HStack key={sub.id} justify="space-between">
                                <Text fontSize="sm" color={secondaryTextColor}>
                                    {sub.service_name}
                                </Text>
                                <Text fontSize="sm" color={mutedTextColor}>
                                    ${sub.base_price?.toFixed(2)}/{sub.cycle === 'yearly' ? '年' : '月'}
                                </Text>
                            </HStack>
                        ))}
                        {remainingCount > 0 && (
                            <Text fontSize="xs" color={mutedTextColor}>
                                +{remainingCount} 更多服務
                            </Text>
                        )}
                    </VStack>
                )}

                {/* 預估月支出 */}
                <HStack justify="space-between" p={2} bg={expenseBg} rounded="md">
                    <HStack gap={2}>
                        <Box as={TrendingUp} w={4} h={4} color={expenseColor} />
                        <Text fontSize="sm" color={secondaryTextColor}>
                            預估月支出
                        </Text>
                    </HStack>
                    <Text fontWeight="bold" color={expenseColor}>
                        {formatCurrency(monthlyExpense, account.currency)}
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
                        aria-label="編輯帳號"
                    >
                        <Box as={Edit} w={4} h={4} />
                    </Button>
                    <Button
                        size="sm"
                        colorPalette="red"
                        variant="ghost"
                        onClick={() => onDelete(account)}
                        aria-label="刪除帳號"
                    >
                        <Box as={Trash2} w={4} h={4} />
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
}