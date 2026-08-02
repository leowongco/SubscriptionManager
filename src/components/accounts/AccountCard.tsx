import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Badge,
    Icon,
} from '@chakra-ui/react';
import { DollarSign, Edit, Trash2, TrendingUp } from 'lucide-react';
import { formatCurrency, getRegionLabel } from '@/lib/currency';
import { getAccountTypeMeta, type AccountType } from '@/lib/accountType';

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
        account_type?: AccountType;
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
    const typeMeta = getAccountTypeMeta(account.account_type);

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
            bg="bg.panel"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="border.default"
            borderLeftWidth="4px"
            borderLeftColor={`${typeMeta.colorPalette}.solid`}
            rounded="xl"
            shadow="xl"
            overflow="hidden"
            transition="all"
            _hover={{ shadow: '2xl', transform: 'translateY(-2px)' }}
        >
            <VStack align="stretch" gap={4}>
                {/* 頂部：帳號類型徽章 + 識別碼 + 餘額 */}
                <HStack justify="space-between" align="start">
                    <VStack align="start" gap={1.5}>
                        <Badge colorPalette={typeMeta.colorPalette} fontSize="xs" fontWeight="bold" px={2} py={0.5} rounded="md">
                            <Icon as={typeMeta.icon} boxSize={3} mr={1} />
                            {typeMeta.label}
                        </Badge>
                        <Text fontWeight="bold" fontSize="lg" color="fg.default">
                            {account.apple_id || '未設定帳號'}
                        </Text>
                        {account.group_name && (
                            <Badge colorPalette="purple" fontSize="xs">
                                {account.group_name}
                            </Badge>
                        )}
                    </VStack>
                    <VStack align="end" gap={1}>
                        <HStack gap={1}>
                            <Box as={DollarSign} w={4} h={4} color="fg.success" />
                            <Text fontWeight="bold" fontSize="xl" color="fg.success">
                                {formatCurrency(account.balance || 0, account.currency)}
                            </Text>
                        </HStack>
                        <HStack gap={1}>
                            <Text fontSize="xs" color="fg.muted">
                                當前餘額
                            </Text>
                            <Badge colorPalette="cyan" fontSize="xs">
                                {getRegionLabel(account.currency)}
                            </Badge>
                        </HStack>
                    </VStack>
                </HStack>

                {/* 訂閱服務列表 */}
                {displaySubscriptions.length > 0 && (
                    <VStack align="stretch" gap={2}>
                        <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                            訂閱服務
                        </Text>
                        {displaySubscriptions.map((sub) => (
                            <HStack key={sub.id} justify="space-between">
                                <Text fontSize="sm" color="fg.muted">
                                    {sub.service_name}
                                </Text>
                                <Text fontSize="sm" color="fg.muted">
                                    {formatCurrency(sub.base_price || 0, sub.currency)}/{sub.cycle === 'yearly' ? '年' : '月'}
                                </Text>
                            </HStack>
                        ))}
                        {remainingCount > 0 && (
                            <Text fontSize="xs" color="fg.muted">
                                +{remainingCount} 更多服務
                            </Text>
                        )}
                    </VStack>
                )}

                {/* 預估月支出 */}
                <HStack justify="space-between" p={2} bg="bg.subtle" rounded="md">
                    <HStack gap={2}>
                        <Box as={TrendingUp} w={4} h={4} color="fg.warning" />
                        <Text fontSize="sm" color="fg.muted">
                            預估月支出
                        </Text>
                    </HStack>
                    <Text fontWeight="bold" color="fg.warning">
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