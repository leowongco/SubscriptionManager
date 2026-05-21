import { useState, useEffect } from 'react';
import {
    Container,
    Text,
    VStack,
    HStack,
    Button,
    Input,
    SimpleGrid,
    Spinner,
    EmptyState,
    Icon,
} from '@chakra-ui/react';
import { Plus, CreditCard, Search, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { AccountCard } from '@/components/accounts/AccountCard';
import { BalanceAdjustDialog } from '@/components/accounts/BalanceAdjustDialog';
import { toaster } from '@/components/ui/toaster';
import { formatCurrency } from '@/lib/currency';

interface Subscription {
    id: string;
    service_name: string;
    base_price: number;
    currency: string;
    cycle: string;
    members?: Array<{ id: string; email: string }>;
}

interface Account {
    id: string;
    apple_id: string;
    balance: number;
    currency?: string;
    group_name?: string;
    subscriptions?: Subscription[];
}

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterGroup] = useState('');
    const [balanceFilter, setBalanceFilter] = useState<'all' | 'low' | 'negative'>('all');

    // Dialog 狀態
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    // 載入數據
    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await api.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to load accounts:', error);
            toaster.create({
                title: '載入失敗',
                description: '無法載入 Apple ID 列表',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    // 餘額調整
    const handleAdjustBalance = async (accountId: string, data: { adjustment_amount: number; reason: string; operator: string }) => {
        try {
            const account = accounts.find(a => a.id === accountId);
            await api.adjustAccountBalance(accountId, data);
            toaster.create({
                title: '調整成功',
                description: `餘額已${data.adjustment_amount >= 0 ? '增加' : '減少'} ${formatCurrency(Math.abs(data.adjustment_amount), account?.currency)}`,
                type: 'success',
            });
            await loadAccounts(); // 重新載入數據
        } catch (error) {
            console.error('Failed to adjust balance:', error);
            toaster.create({
                title: '調整失敗',
                description: '無法調整餘額，請稍後再試',
                type: 'error',
            });
            throw error;
        }
    };

    // 篩選帳戶
    const filteredAccounts = accounts.filter((account) => {
        // 搜尋篩選
        const matchesSearch = !searchQuery ||
            account.apple_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.group_name?.toLowerCase().includes(searchQuery.toLowerCase());

        // Telegram Group 篩選
        const matchesGroup = !filterGroup || account.group_name === filterGroup;

        // 餘額篩選
        let matchesBalance = true;
        if (balanceFilter === 'low') {
            matchesBalance = account.balance >= 0 && account.balance < 100;
        } else if (balanceFilter === 'negative') {
            matchesBalance = account.balance < 0;
        }

        return matchesSearch && matchesGroup && matchesBalance;
    });


    // 處理調整餘額按鈕點擊
    const openAdjustDialog = (account: Account) => {
        setSelectedAccount(account);
        setAdjustDialogOpen(true);
    };

    // 處理查看詳情
    const handleViewDetails = (account: Account) => {
        // TODO: 導航到詳情頁面或打開詳情對話框
        console.log('View details:', account);
    };

    // 處理編輯
    const handleEdit = (account: Account) => {
        // TODO: 打開編輯對話框
        console.log('Edit:', account);
    };

    // 處理刪除
    const handleDelete = async (account: Account) => {
        if (!confirm(`確定要刪除 Apple ID "${account.apple_id}" 嗎？此操作無法復原。`)) {
            return;
        }

        try {
            await api.deleteAccount(account.id);
            toaster.create({
                title: '刪除成功',
                description: `Apple ID "${account.apple_id}" 已刪除`,
                type: 'success',
            });
            await loadAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
            toaster.create({
                title: '刪除失敗',
                description: '無法刪除 Apple ID，請稍後再試',
                type: 'error',
            });
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            <VStack align="stretch" gap={6}>
                {/* 頁面標題 */}
                <HStack justify="space-between" flexWrap="wrap" gap={4}>
                    <VStack align="start" gap={1}>
                        <Text fontSize="2xl" fontWeight="bold">
                            Apple ID 管理
                        </Text>
                        <Text color="gray.400" fontSize="sm">
                            管理所有 Apple ID、查看餘額和訂閱服務
                        </Text>
                    </VStack>
                    <HStack gap={3}>
                        <Button colorPalette="blue" variant="outline">
                            <Icon as={CreditCard} />
                            批次加值
                        </Button>
                        <Button colorPalette="blue">
                            <Icon as={Plus} />
                            新增 Apple ID
                        </Button>
                    </HStack>
                </HStack>

                {/* 篩選區 */}
                <HStack gap={4} flexWrap="wrap">
                    <HStack flex={1} minW="200px">
                        <Icon as={Search} color="gray.400" />
                        <Input
                            placeholder="搜尋 Apple ID 或 Telegram Group..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            variant="flushed"
                        />
                    </HStack>
                    <HStack gap={2}>
                        <Button
                            size="sm"
                            variant={balanceFilter === 'all' ? 'solid' : 'outline'}
                            colorPalette={balanceFilter === 'all' ? 'blue' : 'gray'}
                            onClick={() => setBalanceFilter('all')}
                        >
                            全部
                        </Button>
                        <Button
                            size="sm"
                            variant={balanceFilter === 'low' ? 'solid' : 'outline'}
                            colorPalette={balanceFilter === 'low' ? 'orange' : 'gray'}
                            onClick={() => setBalanceFilter('low')}
                        >
                            餘額不足
                        </Button>
                        <Button
                            size="sm"
                            variant={balanceFilter === 'negative' ? 'solid' : 'outline'}
                            colorPalette={balanceFilter === 'negative' ? 'red' : 'gray'}
                            onClick={() => setBalanceFilter('negative')}
                        >
                            餘額為負
                        </Button>
                    </HStack>
                </HStack>

                {/* 統計信息 */}
                <HStack gap={6} p={4} bg="gray.800" rounded="lg">
                    <VStack align="start" gap={0}>
                        <Text fontSize="sm" color="gray.400">總 Apple ID 數</Text>
                        <Text fontSize="2xl" fontWeight="bold">{accounts.length}</Text>
                    </VStack>
                    <VStack align="start" gap={0}>
                        <Text fontSize="sm" color="gray.400">總餘額</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.400">
                            ${accounts.reduce((sum, a) => sum + (a.balance || 0), 0).toFixed(2)}
                        </Text>
                    </VStack>
                    <VStack align="start" gap={0}>
                        <Text fontSize="sm" color="gray.400">餘額不足</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="orange.400">
                            {accounts.filter(a => a.balance >= 0 && a.balance < 100).length}
                        </Text>
                    </VStack>
                    <VStack align="start" gap={0}>
                        <Text fontSize="sm" color="gray.400">餘額為負</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="red.400">
                            {accounts.filter(a => a.balance < 0).length}
                        </Text>
                    </VStack>
                </HStack>

                {/* 帳戶列表 */}
                {loading ? (
                    <VStack py={12}>
                        <Spinner size="lg" color="blue.400" />
                        <Text color="gray.400">載入中...</Text>
                    </VStack>
                ) : filteredAccounts.length === 0 ? (
                    <EmptyState.Root>
                        <EmptyState.Content>
                            <EmptyState.Indicator>
                                <Icon as={AlertCircle} />
                            </EmptyState.Indicator>
                            <VStack textAlign="center" gap={2}>
                                <EmptyState.Title>
                                    {searchQuery || balanceFilter !== 'all'
                                        ? '沒有符合條件的 Apple ID'
                                        : '尚未新增 Apple ID'}
                                </EmptyState.Title>
                                <EmptyState.Description>
                                    {searchQuery || balanceFilter !== 'all'
                                        ? '請調整篩選條件'
                                        : '點擊上方「新增 Apple ID」按鈕開始'}
                                </EmptyState.Description>
                            </VStack>
                        </EmptyState.Content>
                    </EmptyState.Root>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                        {filteredAccounts.map((account) => (
                            <AccountCard
                                key={account.id}
                                account={account}
                                onAdjustBalance={openAdjustDialog}
                                onViewDetails={handleViewDetails}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </SimpleGrid>
                )}

                {/* 餘額調整對話框 */}
                <BalanceAdjustDialog
                    open={adjustDialogOpen}
                    onOpenChange={setAdjustDialogOpen}
                    account={selectedAccount}
                    onConfirm={handleAdjustBalance}
                />
            </VStack>
        </Container>
    );
}