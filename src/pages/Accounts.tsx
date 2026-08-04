import { useState, useEffect } from 'react';
import {
    Box,
    Text,
    VStack,
    HStack,
    Button,
    Input,
    SimpleGrid,
    Spinner,
    EmptyState,
    Icon,
    Flex,
    Field,
    NativeSelectRoot,
    NativeSelectField,
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogCloseTrigger,
} from '@/components/ui/dialog';
import { Plus, CreditCard, Search, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { AccountCard } from '@/components/accounts/AccountCard';
import { BalanceAdjustDialog } from '@/components/accounts/BalanceAdjustDialog';
import { toaster } from '@/components/ui/toaster';
import { formatCurrency, REGION_NAMES } from '@/lib/currency';
import { ACCOUNT_TYPES, getAccountTypeMeta, type AccountType } from '@/lib/accountType';

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
    account_type?: AccountType;
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
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newAccountForm, setNewAccountForm] = useState<Partial<Account>>({ balance: 0, account_type: 'apple' });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editAccountForm, setEditAccountForm] = useState<Partial<Account>>({});


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
        setEditAccountForm({ ...account });
        setEditDialogOpen(true);
    };

    // 處理更新帳號
    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updateAccount(editAccountForm);
            toaster.create({
                title: '更新成功',
                description: `「${editAccountForm.apple_id}」已更新`,
                type: 'success',
            });
            setEditDialogOpen(false);
            setEditAccountForm({});
            await loadAccounts();
        } catch (error) {
            console.error('Failed to update account:', error);
            toaster.create({
                title: '更新失敗',
                description: '無法更新帳號，請稍後再試',
                type: 'error',
            });
        }
    };

    // 處理刪除
    const handleDelete = async (account: Account) => {
        const typeLabel = getAccountTypeMeta(account.account_type).label;
        if (!confirm(`確定要刪除${typeLabel} "${account.apple_id}" 嗎？此操作無法復原。`)) {
            return;
        }

        try {
            await api.deleteAccount(account.id);
            toaster.create({
                title: '刪除成功',
                description: `${typeLabel} "${account.apple_id}" 已刪除`,
                type: 'success',
            });
            await loadAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
            toaster.create({
                title: '刪除失敗',
                description: '無法刪除帳號，請稍後再試',
                type: 'error',
            });
        }
    };

    // 處理新增帳號
    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createAccount(newAccountForm);
            toaster.create({
                title: '新增成功',
                description: `「${newAccountForm.apple_id}」已新增`,
                type: 'success',
            });
            setCreateDialogOpen(false);
            setNewAccountForm({ balance: 0, account_type: 'apple', currency: 'HKD' });
            await loadAccounts();
        } catch (error) {
            console.error('Failed to create account:', error);
            toaster.create({
                title: '新增失敗',
                description: '無法新增帳號，請稍後再試',
                type: 'error',
            });
        }
    };

    return (
        <VStack gap={{ base: 6, md: 10 }} maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }} align="stretch">
            {/* Header Section */}
            <Box
                position="relative"
                overflow="hidden"
                rounded={{ base: '2xl', md: '3xl' }}
                bg="bg.panel"
                border="1px solid"
                borderColor="border.default"
                p={{ base: 5, md: 8 }}
                shadow="2xl"
                backdropFilter="blur(20px)"
                transition="all 0.3s"
            >
                <Flex justify="space-between" alignItems="center" flexWrap="wrap" gap={4}>
                    <Box position="relative" zIndex={10}>
                        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="fg.default">
                            Apple ID 管理
                        </Text>
                        <Text color="fg.muted" mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" maxW="2xl">
                            管理所有 Apple ID、查看餘額和訂閱服務
                        </Text>
                    </Box>
                    <HStack gap={3} position="relative" zIndex={10}>
                        <Button colorPalette="blue" variant="outline" rounded="xl" h={12} px={6} shadow="lg" _hover={{ transform: 'scale(1.02)' }} transition="all">
                            <Icon as={CreditCard} />
                            批次加值
                        </Button>
                        
                        {/* 新增 Apple ID Dialog */}
                        <Button
                            onClick={() => {
                                setNewAccountForm({ balance: 0, account_type: 'apple', currency: 'HKD' });
                                setCreateDialogOpen(true);
                            }}
                            colorPalette="accent"
                            rounded="xl"
                            h={12}
                            px={6}
                            shadow="lg"
                            _hover={{ transform: 'scale(1.02)' }}
                            transition="all"
                        >
                            <Icon as={Plus} />
                            新增 Apple ID
                        </Button>
                        
                        <DialogRoot open={createDialogOpen} onOpenChange={(e) => setCreateDialogOpen(e.open)}>
                            <DialogContent maxW="480px" variant="glass">
                                <DialogHeader>
                                    <DialogTitle>新增 Apple ID</DialogTitle>
                                    <DialogCloseTrigger />
                                </DialogHeader>
                                <form onSubmit={handleCreateAccount}>
                                    <VStack gap={5}>
                                        <Field.Root required>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                帳號類型
                                            </Field.Label>
                                            <HStack gap={2} w="full">
                                                {ACCOUNT_TYPES.map(t => (
                                                    <Button
                                                        key={t.value}
                                                        type="button"
                                                        flex={1}
                                                        size="sm"
                                                        h={11}
                                                        rounded="xl"
                                                        variant={newAccountForm.account_type === t.value ? 'solid' : 'outline'}
                                                        colorPalette={newAccountForm.account_type === t.value ? t.colorPalette : 'gray'}
                                                        onClick={() => setNewAccountForm({ ...newAccountForm, account_type: t.value })}
                                                    >
                                                        <Icon as={t.icon} />
                                                        {t.label}
                                                    </Button>
                                                ))}
                                            </HStack>
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                {getAccountTypeMeta(newAccountForm.account_type).fieldLabel}
                                            </Field.Label>
                                            <Input
                                                value={newAccountForm.apple_id || ''}
                                                onChange={e => setNewAccountForm({ ...newAccountForm, apple_id: e.target.value })}
                                                placeholder={getAccountTypeMeta(newAccountForm.account_type).placeholder}
                                                required
                                                bg="bg.subtle"
                                                borderColor="border.default"
                                                rounded="xl"
                                                h={12}
                                                _focus={{
                                                    borderColor: "focus.ring",
                                                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                                }}
                                                fontFamily="mono"
                                                transition="all 0.2s"
                                            />
                                        </Field.Root>

                                        <Field.Root required>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                帳號地區(決定往後加值/扣款貨幣)
                                            </Field.Label>
                                            <NativeSelectRoot>
                                                <NativeSelectField
                                                    value={newAccountForm.currency || 'HKD'}
                                                    onChange={e => setNewAccountForm({ ...newAccountForm, currency: e.target.value })}
                                                    bg="bg.subtle"
                                                    borderColor="border.default"
                                                    rounded="xl"
                                                    h={12}
                                                >
                                                    {Object.entries(REGION_NAMES).map(([code, name]) => (
                                                        <option key={code} value={code}>{name}（{code}）</option>
                                                    ))}
                                                </NativeSelectField>
                                            </NativeSelectRoot>
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                初始餘額
                                            </Field.Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={newAccountForm.balance || ''}
                                                onChange={e => setNewAccountForm({ ...newAccountForm, balance: parseFloat(e.target.value) })}
                                                bg="bg.subtle"
                                                borderColor="border.default"
                                                rounded="xl"
                                                h={12}
                                                _focus={{
                                                    borderColor: "focus.ring",
                                                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                                }}
                                                fontFamily="mono"
                                                transition="all 0.2s"
                                            />
                                        </Field.Root>

                                        <Button
                                            type="submit"
                                            w="full"
                                            colorPalette="blue"
                                            rounded="xl"
                                            h={12}
                                            fontSize="md"
                                            fontWeight="bold"
                                            shadow="lg"
                                            _hover={{ transform: 'scale(1.02)' }}
                                            _active={{ transform: 'scale(0.98)' }}
                                            transition="all 0.2s"
                                        >
                                            儲存帳號
                                        </Button>
                                    </VStack>
                                </form>
                            </DialogContent>
                        </DialogRoot>

                        {/* 編輯帳號 Dialog */}
                        <DialogRoot open={editDialogOpen} onOpenChange={(e) => setEditDialogOpen(e.open)}>
                            <DialogContent maxW="480px" variant="glass">
                                <DialogHeader>
                                    <DialogTitle>編輯帳號</DialogTitle>
                                    <DialogCloseTrigger />
                                </DialogHeader>
                                <form onSubmit={handleUpdateAccount}>
                                    <VStack gap={5}>
                                        <Field.Root required>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                帳號類型
                                            </Field.Label>
                                            <HStack gap={2} w="full">
                                                {ACCOUNT_TYPES.map(t => (
                                                    <Button
                                                        key={t.value}
                                                        type="button"
                                                        flex={1}
                                                        size="sm"
                                                        h={11}
                                                        rounded="xl"
                                                        variant={editAccountForm.account_type === t.value ? 'solid' : 'outline'}
                                                        colorPalette={editAccountForm.account_type === t.value ? t.colorPalette : 'gray'}
                                                        onClick={() => setEditAccountForm({ ...editAccountForm, account_type: t.value })}
                                                    >
                                                        <Icon as={t.icon} />
                                                        {t.label}
                                                    </Button>
                                                ))}
                                            </HStack>
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                {getAccountTypeMeta(editAccountForm.account_type).fieldLabel}
                                            </Field.Label>
                                            <Input
                                                value={editAccountForm.apple_id || ''}
                                                onChange={e => setEditAccountForm({ ...editAccountForm, apple_id: e.target.value })}
                                                placeholder={getAccountTypeMeta(editAccountForm.account_type).placeholder}
                                                required
                                                bg="bg.subtle"
                                                borderColor="border.default"
                                                rounded="xl"
                                                h={12}
                                                fontFamily="mono"
                                                transition="all 0.2s"
                                            />
                                        </Field.Root>

                                        <Field.Root required>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                帳號地區(決定往後加值/扣款貨幣)
                                            </Field.Label>
                                            <NativeSelectRoot>
                                                <NativeSelectField
                                                    value={editAccountForm.currency || 'HKD'}
                                                    onChange={e => setEditAccountForm({ ...editAccountForm, currency: e.target.value })}
                                                    bg="bg.subtle"
                                                    borderColor="border.default"
                                                    rounded="xl"
                                                    h={12}
                                                >
                                                    {Object.entries(REGION_NAMES).map(([code, name]) => (
                                                        <option key={code} value={code}>{name}（{code}）</option>
                                                    ))}
                                                </NativeSelectField>
                                            </NativeSelectRoot>
                                            {(editAccountForm.subscriptions?.length || 0) > 0 &&
                                                editAccountForm.currency !== accounts.find(a => a.id === editAccountForm.id)?.currency && (
                                                <HStack gap={1} color="fg.warning" mt={1.5} align="start">
                                                    <Icon as={AlertCircle} boxSize={3.5} mt="1px" flexShrink={0} />
                                                    <Text fontSize="xs">
                                                        此帳號已有訂閱服務，變更地區不會自動換算現有訂閱的貨幣，請確認底下訂閱項目的計價貨幣一致。
                                                    </Text>
                                                </HStack>
                                            )}
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                餘額
                                            </Field.Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editAccountForm.balance ?? ''}
                                                onChange={e => setEditAccountForm({ ...editAccountForm, balance: parseFloat(e.target.value) })}
                                                bg="bg.subtle"
                                                borderColor="border.default"
                                                rounded="xl"
                                                h={12}
                                                fontFamily="mono"
                                                transition="all 0.2s"
                                            />
                                        </Field.Root>

                                        <Button
                                            type="submit"
                                            w="full"
                                            colorPalette="blue"
                                            rounded="xl"
                                            h={12}
                                            fontSize="md"
                                            fontWeight="bold"
                                            shadow="lg"
                                            _hover={{ transform: 'scale(1.02)' }}
                                            _active={{ transform: 'scale(0.98)' }}
                                            transition="all 0.2s"
                                        >
                                            儲存變更
                                        </Button>
                                    </VStack>
                                </form>
                            </DialogContent>
                        </DialogRoot>
                    </HStack>
                </Flex>
            </Box>

            {/* Filter Section */}
            <Box
                rounded="3xl"
                border="1px solid"
                borderColor="border.default"
                bg="bg.panel"
                backdropFilter="blur(20px)"
                overflow="hidden"
                shadow="xl"
                p={{ base: 4, md: 6 }}
            >
                <VStack gap={4} align="stretch">
                    {/* Search and Filter Buttons */}
                    <HStack gap={4} flexWrap="wrap">
                        <HStack flex={1} minW="200px">
                            <Icon as={Search} color="fg.muted" />
                            <Input
                                placeholder="搜尋 Apple ID 或 Telegram Group..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                variant="flushed"
                                borderColor="border.default"
                            />
                        </HStack>
                        <HStack gap={2}>
                            <Button
                                size="sm"
                                variant={balanceFilter === 'all' ? 'solid' : 'outline'}
                                colorPalette={balanceFilter === 'all' ? 'blue' : 'gray'}
                                onClick={() => setBalanceFilter('all')}
                                rounded="lg"
                            >
                                全部
                            </Button>
                            <Button
                                size="sm"
                                variant={balanceFilter === 'low' ? 'solid' : 'outline'}
                                colorPalette={balanceFilter === 'low' ? 'orange' : 'gray'}
                                onClick={() => setBalanceFilter('low')}
                                rounded="lg"
                            >
                                餘額不足
                            </Button>
                            <Button
                                size="sm"
                                variant={balanceFilter === 'negative' ? 'solid' : 'outline'}
                                colorPalette={balanceFilter === 'negative' ? 'red' : 'gray'}
                                onClick={() => setBalanceFilter('negative')}
                                rounded="lg"
                            >
                                餘額為負
                            </Button>
                        </HStack>
                    </HStack>

                    {/* Statistics */}
                    <HStack gap={6} p={4} bg="bg.subtle" rounded="xl" border="1px solid" borderColor="border.default">
                        <VStack align="start" gap={0}>
                            <Text fontSize="sm" color="fg.muted">總 Apple ID 數</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="fg.default">{accounts.length}</Text>
                        </VStack>
                        <VStack align="start" gap={0}>
                            <Text fontSize="sm" color="fg.muted">總餘額</Text>
                            {(() => {
                                const totalsByCurrency = Object.entries(
                                    accounts.reduce((acc, a) => {
                                        const cur = a.currency || 'HKD';
                                        acc[cur] = (acc[cur] || 0) + (a.balance || 0);
                                        return acc;
                                    }, {} as Record<string, number>)
                                );
                                // 不同帳號可能設定不同地區/貨幣，直接把原始數字加總沒有意義（例如 TRY + HKD），
                                // 所以按貨幣分開列出，而不是硬套一個「$」符號當成同一種貨幣加總。
                                return (
                                    <Text fontSize={totalsByCurrency.length > 1 ? 'lg' : '2xl'} fontWeight="bold" color="fg.success">
                                        {totalsByCurrency.length === 0
                                            ? formatCurrency(0)
                                            : totalsByCurrency.map(([cur, sum]) => formatCurrency(sum, cur)).join(' · ')}
                                    </Text>
                                );
                            })()}
                        </VStack>
                        <VStack align="start" gap={0}>
                            <Text fontSize="sm" color="fg.muted">餘額不足</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="fg.warning">
                                {accounts.filter(a => a.balance >= 0 && a.balance < 100).length}
                            </Text>
                        </VStack>
                        <VStack align="start" gap={0}>
                            <Text fontSize="sm" color="fg.muted">餘額為負</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="fg.error">
                                {accounts.filter(a => a.balance < 0).length}
                            </Text>
                        </VStack>
                    </HStack>
                </VStack>
            </Box>

                {/* 帳戶列表 */}
                {loading ? (
                    <VStack py={12}>
                        <Spinner size="lg" color="blue.400" />
                        <Text color="fg.muted">載入中...</Text>
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
    );
}