/**
 * Mapping Page - 訂閱關係對應管理
 *
 * 結構說明：
 * - Header Section: 頁面標題與新增帳號按鈕
 * - Account Cards: 帳號卡片列表，每個卡片包含：
 *   - Subscription Dialog: 訂閱管理對話框
 *   - Member Dialog: 成員管理對話框
 *
 * 對話框設計決策：
 * - 對話框與頁面邏輯緊密耦合，不提取為獨立組件
 * - 使用清晰的註釋分隔各個區塊
 * - 統一對話框樣式以保持一致性
 */

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Plus, UserPlus, Trash2, CheckCircle2, Circle, ListPlus, KeyRound, Pencil, TrendingUp, MessageCircle, AlertCircle } from 'lucide-react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Badge,
    Flex,
    Grid,
    SimpleGrid,
    Field,
    NativeSelectRoot,
    NativeSelectField,
    Icon,
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogCloseTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ACCOUNT_TYPES, getAccountTypeMeta, type AccountType } from '@/lib/accountType';
import { REGION_NAMES, getRegionLabel } from '@/lib/currency';

// ============================================================================
// Type Definitions
// ============================================================================

interface Subscription {
    id: string;
    account_id: string;
    service_id: string;
    service_name: string;
    group_name: string;
    service_account?: string;
    telegram_group_id?: string | null;
    start_date: string;
    base_price: number;
    next_price?: number | null;
    effective_date?: string | null;
    currency: string;
    cycle: string;
    members?: Member[];
}

interface Account {
    id: string;
    apple_id: string;
    account_type?: AccountType;
    balance: number;
    currency?: string;
    last_sync_date: string;
    subscriptions?: Subscription[];
}

interface Member {
    id: string;
    subscription_id: string;
    email: string;
    payment_status: number;
    memo: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export default function Mapping() {
    // ========================================================================
    // Data Fetching
    // ========================================================================
    const { data: accounts, mutate: mutateAccounts } = useSWR<Account[]>('accounts', api.getAccounts);
    const { data: services } = useSWR<any[]>('services', api.getServices);
    const { data: telegramGroups } = useSWR<any[]>('telegram-groups', api.getTelegramGroups);

    // ========================================================================
    // Dialog States
    // ========================================================================
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [accountForm, setAccountForm] = useState<Partial<Account>>({});

    const [isMemberOpen, setIsMemberOpen] = useState(false);
    const [memberForm, setMemberForm] = useState<Partial<Member>>({});
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');

    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const [subscriptionForm, setSubscriptionForm] = useState<Partial<Subscription>>({});
    const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null);

    // ========================================================================
    // Helper Functions
    // ========================================================================
    const getTodayString = () => new Date().toISOString().split('T')[0];

    // ========================================================================
    // Account Handlers
    // ========================================================================
    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (accountForm.id) {
            await api.updateAccount(accountForm);
        } else {
            await api.createAccount(accountForm);
        }
        setIsAccountOpen(false);
    };

    const deleteAccount = async (id: string) => {
        if (confirm('確定要刪除此帳號及所有關聯成員嗎？')) {
            await api.deleteAccount(id);
            mutateAccounts();
        }
    };

    // ========================================================================
    // Subscription Handlers
    // ========================================================================
    const handleSubscriptionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (subscriptionForm.id) {
                await api.updateSubscription(subscriptionForm.id, {
                    start_date: subscriptionForm.start_date,
                    group_name: subscriptionForm.group_name,
                    telegram_group_id: subscriptionForm.telegram_group_id || null,
                    service_account: subscriptionForm.service_account || null,
                    next_price: subscriptionForm.next_price || null,
                    effective_date: subscriptionForm.effective_date || null
                });
            } else {
                await api.addSubscription({
                    account_id: selectedSubAccountId,
                    service_id: subscriptionForm.service_id,
                    start_date: subscriptionForm.start_date,
                    group_name: subscriptionForm.group_name,
                    telegram_group_id: subscriptionForm.telegram_group_id || null,
                    service_account: subscriptionForm.service_account || null,
                    next_price: subscriptionForm.next_price || null,
                    effective_date: subscriptionForm.effective_date || null
                } as any);
            }
            setSubscriptionForm({});
            setIsSubscriptionOpen(false);
            mutateAccounts();
        } catch (error) {
            console.error('Failed to save subscription:', error);
            alert('儲存失敗');
        }
    };

    const removeSubscription = async (subId: string) => {
        if (!confirm('確定要移除此項訂閱嗎？')) return;
        try {
            await api.removeSubscription(subId);
            mutateAccounts();
        } catch (error) {
            console.error('Failed to remove subscription', error);
        }
    };

    // ========================================================================
    // Member Handlers
    // ========================================================================
    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (memberForm.id) {
            await api.updateMember({ ...memberForm, subscription_id: selectedSubscriptionId });
        } else {
            await api.createMember({ ...memberForm, subscription_id: selectedSubscriptionId });
        }
        setIsMemberOpen(false);
        mutateAccounts();
    };

    const togglePaymentStatus = async (member: Member) => {
        await api.updateMember({ ...member, payment_status: member.payment_status ? 0 : 1 });
        mutateAccounts();
    };

    const deleteMember = async (id: string) => {
        if (confirm('確定要移除此成員嗎？')) {
            await api.deleteMember(id);
            mutateAccounts();
        }
    };

    // ========================================================================
    // Render
    // ========================================================================
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
                p={{ base: 6, md: 8 }}
                shadow="2xl"
                backdropFilter="blur(20px)"
            >
                <Flex
                    justify="space-between"
                    alignItems={{ base: 'start', md: 'center' }}
                    flexDirection={{ base: 'column', md: 'row' }}
                    gap={6}
                >
                    <Box position="relative" zIndex={10}>
                        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="fg.emphasized">
                            訂閱關係對應
                        </Text>
                        <Text color="fg.muted" mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium">
                            管理 Apple ID、獨立服務、與成員的繳費關係。
                        </Text>
                    </Box>

                    {/* ──────────────────────────────────────────────────────────────── */}
                    {/* Account Dialog - 新增/編輯 Apple ID */}
                    {/* ──────────────────────────────────────────────────────────────── */}
                    <Button
                        onClick={() => {
                            setAccountForm({ balance: 0, account_type: 'apple', currency: 'HKD' });
                            setIsAccountOpen(true);
                        }}
                        w={{ base: 'full', md: 'auto' }}
                        position="relative"
                        zIndex={10}
                        colorPalette="accent"
                        rounded="xl"
                        h={{ base: 11, md: 12 }}
                        px={6}
                        shadow="lg"
                        _hover={{ transform: 'scale(1.02)' }}
                        transition="all"
                    >
                        <Box as={Plus} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} mr={2} />
                        新增帳號
                    </Button>
                    
                    <DialogRoot open={isAccountOpen} onOpenChange={(e) => setIsAccountOpen(e.open)}>
                        <DialogContent maxW="480px" variant="glass">
                            <DialogHeader>
                                <DialogTitle>
                                    {accountForm.id ? '編輯帳號' : '新增帳號'}
                                </DialogTitle>
                                <DialogCloseTrigger />
                            </DialogHeader>
                            <form onSubmit={handleAccountSubmit}>
                                <VStack gap={{ base: 4, md: 5 }}>
                                    <Field.Root required>
                                        <Field.Label fontSize={{ base: '10px', md: 'sm' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            帳號類型
                                        </Field.Label>
                                        <HStack gap={2} w="full">
                                            {ACCOUNT_TYPES.map(t => (
                                                <Button
                                                    key={t.value}
                                                    type="button"
                                                    flex={1}
                                                    size="sm"
                                                    h={{ base: 10, md: 11 }}
                                                    rounded="xl"
                                                    variant={accountForm.account_type === t.value ? 'solid' : 'outline'}
                                                    colorPalette={accountForm.account_type === t.value ? t.colorPalette : 'gray'}
                                                    onClick={() => setAccountForm({ ...accountForm, account_type: t.value })}
                                                >
                                                    <Box as={t.icon} w={3.5} h={3.5} />
                                                    {t.label}
                                                </Button>
                                            ))}
                                        </HStack>
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label fontSize={{ base: '10px', md: 'sm' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            {getAccountTypeMeta(accountForm.account_type).fieldLabel}
                                        </Field.Label>
                                        <Input
                                            value={accountForm.apple_id || ''}
                                            onChange={e => setAccountForm({ ...accountForm, apple_id: e.target.value })}
                                            placeholder={getAccountTypeMeta(accountForm.account_type).placeholder}
                                            required
                                            bg="bg.subtle"
                                            borderColor="border.emphasized"
                                            rounded="xl"
                                            h={{ base: 11, md: 12 }}
                                            _focus={{
                                                borderColor: "focus.ring",
                                                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                            }}
                                            fontFamily="mono"
                                            fontSize={{ base: 'xs', md: 'sm' }}
                                            transition="all 0.2s"
                                        />
                                    </Field.Root>

                                    <Field.Root required>
                                        <Field.Label fontSize={{ base: '10px', md: 'sm' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            帳號地區(決定往後加值/扣款貨幣)
                                        </Field.Label>
                                        <NativeSelectRoot>
                                            <NativeSelectField
                                                value={accountForm.currency || 'HKD'}
                                                onChange={e => setAccountForm({ ...accountForm, currency: e.target.value })}
                                                bg="bg.subtle"
                                                borderColor="border.emphasized"
                                                rounded="xl"
                                                h={{ base: 11, md: 12 }}
                                                fontSize={{ base: 'xs', md: 'sm' }}
                                            >
                                                {Object.entries(REGION_NAMES).map(([code, name]) => (
                                                    <option key={code} value={code}>{name}（{code}）</option>
                                                ))}
                                            </NativeSelectField>
                                        </NativeSelectRoot>
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label fontSize={{ base: '10px', md: 'sm' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            初始餘額
                                        </Field.Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={accountForm.balance || ''}
                                            onChange={e => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) })}
                                            bg="bg.subtle"
                                            borderColor="border.emphasized"
                                            rounded="xl"
                                            h={{ base: 11, md: 12 }}
                                            _focus={{
                                                borderColor: "focus.ring",
                                                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                            }}
                                            fontFamily="mono"
                                            fontSize={{ base: 'xs', md: 'sm' }}
                                            transition="all 0.2s"
                                        />
                                    </Field.Root>

                                    <Button
                                        type="submit"
                                        w="full"
                                        colorPalette="green"
                                        rounded="xl"
                                        h={{ base: 11, md: 12 }}
                                        fontSize={{ base: 'sm', md: 'md' }}
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
                </Flex>
            </Box>

            {!accounts && (
                <Text color="fg.muted" textAlign="center" animation="pulse">
                    讀取關係資料中...
                </Text>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={{ base: 5, md: 6 }}>
                {accounts?.map(account => (
                    <Box
                        key={account.id}
                        bg="bg.panel"
                        backdropFilter="blur(20px)"
                        border="1px solid"
                        borderColor="border.default"
                        shadow="xl"
                        overflow="hidden"
                        position="relative"
                        rounded="xl"
                        _hover={{ shadow: '2xl', borderColor: 'green.500/30' }}
                        transition="all"
                        display="flex"
                        flexDirection="column"
                    >
                        {/* Hover gradient overlay */}
                        <Box
                            position="absolute"
                            inset={0}
                            bg="green.500/5"
                            opacity={0}
                            _groupHover={{ opacity: 1 }}
                            transition="opacity"
                            pointerEvents="none"
                        />
                        
                        {/* Top gradient bar */}
                        <Box h={1} w="full" bgGradient="to-r" gradientFrom="green.500" gradientTo="teal.500" />

                        {/* Header */}
                        <Box
                            pb={4}
                            position="relative"
                            zIndex={10}
                            borderBottom="1px solid"
                            borderColor="border.default"
                            bg="bg.muted"
                            px={5}
                            pt={4}
                        >
                            <Flex justify="space-between" alignItems="start">
                                <Box minW={0} pr={2}>
                                    <Badge colorPalette={getAccountTypeMeta(account.account_type).colorPalette} fontSize="xs" fontWeight="bold" px={2} py={0.5} rounded="md" mb={1.5}>
                                        <Box as={getAccountTypeMeta(account.account_type).icon} w={3} h={3} mr={1} display="inline-block" verticalAlign="middle" />
                                        {getAccountTypeMeta(account.account_type).label}
                                    </Badge>
                                    <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="fg.default" display="flex" alignItems="center" gap={2} truncate>
                                        {account.apple_id}
                                    </Text>
                                    <Box mt={1}>
                                        {(account.subscriptions?.length || 0) > 0 ? (
                                            <Flex flexWrap="wrap" gap={1} mt={1}>
                                                {account.subscriptions?.map((sub: Subscription) => (
                                                    <Badge
                                                        key={sub.id}
                                                        colorPalette="green"
                                                        variant="subtle"
                                                        fontSize="10px"
                                                        px={1.5}
                                                        py={0.5}
                                                    >
                                                        {sub.service_name} ({sub.group_name})
                                                    </Badge>
                                                ))}
                                            </Flex>
                                        ) : (
                                            <Text color="fg.muted" fontSize="10px">
                                                無啟用中訂閱
                                            </Text>
                                        )}
                                    </Box>
                                </Box>
                                <VStack align="end" flexShrink={0}>
                                    <Text fontSize="10px" color="fg.muted" fontWeight="semibold" letterSpacing="wider" fontFamily="mono">
                                        {account.subscriptions?.[0]?.currency || '$'}
                                    </Text>
                                    <Text
                                        fontSize={{ base: 'xl', md: '2xl' }}
                                        fontWeight="black"
                                        color="fg.default"
                                        fontFamily="mono"
                                       
                                        cursor="pointer"
                                        _hover={{ color: 'green.400' }}
                                        transition="color"
                                        onClick={() => {
                                            const newBal = prompt('Update Balance:', account.balance.toString());
                                            if (newBal !== null) {
                                                api.updateAccount({ ...account, balance: parseFloat(newBal) }).then(() => mutateAccounts());
                                            }
                                        }}
                                    >
                                        {typeof account.balance === 'number' ? account.balance.toFixed(2) : '0.00'}
                                    </Text>
                                </VStack>
                            </Flex>

                            <Flex mt={4} gap={2} alignItems="center" justify="space-between">
                                {/* ──────────────────────────────────────────────────────────────── */}
                                {/* Subscription Dialog - 管理訂閱服務 */}
                                {/* ──────────────────────────────────────────────────────────────── */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    h={7}
                                    px={2}
                                    borderColor="green.500/20"
                                    color="green.400"
                                    _hover={{ bg: 'green.500/10' }}
                                    fontSize="10px"
                                    onClick={() => {
                                        setSelectedSubAccountId(account.id);
                                        setSubscriptionForm({ start_date: getTodayString() });
                                        setIsSubscriptionOpen(true);
                                    }}
                                >
                                    <Box as={ListPlus} w={3.5} h={3.5} mr={1} /> 管理訂閱
                                </Button>
                                
                                <DialogRoot
                                    open={isSubscriptionOpen && selectedSubAccountId === account.id}
                                    onOpenChange={(e) => {
                                        if (!e.open) setIsSubscriptionOpen(false);
                                    }}
                                >
                                    <DialogContent maxW="480px" variant="glass">
                                        <DialogHeader>
                                            <DialogTitle>
                                                訂閱管理 - {account.apple_id}
                                            </DialogTitle>
                                            <DialogCloseTrigger />
                                        </DialogHeader>
                                        <VStack gap={4}>
                                            <Box
                                                bg="bg.subtle"
                                                rounded="xl"
                                                border="1px solid"
                                                borderColor="border.default"
                                                p={3}
                                                maxH="200px"
                                                overflowY="auto"
                                                w="full"
                                            >
                                                {(account.subscriptions?.length || 0) > 0 ? (
                                                    account.subscriptions?.map((sub: Subscription) => (
                                                        <Flex
                                                            key={sub.id}
                                                            justify="space-between"
                                                            alignItems="center"
                                                            bg="bg.muted"
                                                            p={2}
                                                            rounded="lg"
                                                            border="1px solid"
                                                            borderColor="border.default"
                                                            mb={2}
                                                            _last={{ mb: 0 }}
                                                        >
                                                            <Box>
                                                                <Text fontSize="sm" fontWeight="semibold" color="green.300">
                                                                    {sub.service_name}{' '}
                                                                    <Text as="span" fontSize="10px" color="fg.muted" fontWeight="normal">
                                                                        ({sub.group_name})
                                                                    </Text>
                                                                </Text>
                                                                <Text fontSize="10px" color="fg.muted" fontFamily="mono">
                                                                    {sub.currency} {sub.base_price} / {sub.cycle === 'yearly' ? '年' : '月'}
                                                                    <Badge ml={2} bg="bg.muted" fontSize="10px" color="fg.muted">
                                                                        每月 {new Date(sub.start_date).getDate()} 日扣
                                                                    </Badge>
                                                                </Text>
                                                                {sub.service_account && (
                                                                    <Badge mt={1} colorPalette="orange" fontSize="10px" fontFamily="mono">
                                                                        <Box as={KeyRound} w={2.5} h={2.5} mr={1} display="inline-block" verticalAlign="middle" />
                                                                        登入用：{sub.service_account}
                                                                    </Badge>
                                                                )}
                                                                {sub.next_price && sub.effective_date && (
                                                                    <Badge mt={1} ml={1} colorPalette="yellow" fontSize="10px" fontFamily="mono">
                                                                        <Box as={TrendingUp} w={2.5} h={2.5} mr={1} display="inline-block" verticalAlign="middle" />
                                                                        {new Date(sub.effective_date).toLocaleDateString()} 起調至 {sub.currency} {sub.next_price}
                                                                    </Badge>
                                                                )}
                                                                {(sub as any).telegram_group_name && (
                                                                    <Badge mt={1} ml={1} colorPalette="blue" fontSize="10px" fontFamily="mono">
                                                                        <Box as={MessageCircle} w={2.5} h={2.5} mr={1} display="inline-block" verticalAlign="middle" />
                                                                        {(sub as any).telegram_group_name}
                                                                    </Badge>
                                                                )}
                                                            </Box>
                                                            <HStack gap={0}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    color="fg.muted"
                                                                    _hover={{ color: 'green.400', bg: 'green.500/10' }}
                                                                    onClick={() => setSubscriptionForm({ ...sub })}
                                                                    aria-label="編輯訂閱"
                                                                >
                                                                    <Box as={Pencil} w={4} h={4} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    color="fg.muted"
                                                                    _hover={{ color: 'red.400', bg: 'red.500/10' }}
                                                                    onClick={() => removeSubscription(sub.id)}
                                                                    aria-label="移除訂閱"
                                                                >
                                                                    <Box as={Trash2} w={4} h={4} />
                                                                </Button>
                                                            </HStack>
                                                        </Flex>
                                                    ))
                                                ) : (
                                                    <Text textAlign="center" fontSize="xs" color="fg.muted" py={4}>
                                                        無訂閱項目
                                                    </Text>
                                                )}
                                            </Box>

                                            <Box as="form" onSubmit={handleSubscriptionSubmit} w="full">
                                                <VStack gap={4} pt={2} borderTop="1px solid" borderColor="border.default">
                                                    <Grid templateColumns="2" gap={4}>
                                                        <Field.Root disabled={!!subscriptionForm.id}>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                {subscriptionForm.id ? '服務(不可變更)' : '新增服務'}
                                                            </Field.Label>
                                                            <NativeSelectRoot disabled={!!subscriptionForm.id}>
                                                                <NativeSelectField
                                                                    value={subscriptionForm.service_id}
                                                                    onChange={v => {
                                                                        const selected = services?.find(s => s.id === v.target.value);
                                                                        setSubscriptionForm({
                                                                            ...subscriptionForm,
                                                                            service_id: v.target.value,
                                                                            // 新增訂閱時，預設繼承服務目前登記的調價計畫，之後可在下方獨立覆寫
                                                                            next_price: selected?.next_price ?? null,
                                                                            effective_date: selected?.effective_date ?? null,
                                                                        });
                                                                    }}
                                                                    bg="bg.subtle"
                                                                    borderColor="border.emphasized"
                                                                    rounded="xl"
                                                                    h={10}
                                                                    fontSize="xs"
                                                                >
                                                                    <option value="">選擇服務</option>
                                                                    {services
                                                                        ?.filter(s => s.currency === (account.currency || 'HKD'))
                                                                        .map(s => (
                                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                                        ))}
                                                                </NativeSelectField>
                                                            </NativeSelectRoot>
                                                            <Text fontSize="10px" color="fg.muted" mt={1}>
                                                                僅顯示 {getRegionLabel(account.currency)} 計價的服務，此帳號地區決定扣款貨幣
                                                            </Text>
                                                            {services && services.filter(s => s.currency === (account.currency || 'HKD')).length === 0 && (
                                                                <HStack gap={1} color="fg.warning" mt={0.5} align="start">
                                                                    <Icon as={AlertCircle} boxSize={3} mt="1px" flexShrink={0} />
                                                                    <Text fontSize="10px">
                                                                        目前沒有 {getRegionLabel(account.currency)} 計價的服務，請先到「服務與定價管理」新增
                                                                    </Text>
                                                                </HStack>
                                                            )}
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                群組名稱
                                                            </Field.Label>
                                                            <Input
                                                                value={subscriptionForm.group_name || ''}
                                                                onChange={e => setSubscriptionForm({ ...subscriptionForm, group_name: e.target.value })}
                                                                required
                                                                placeholder="如：家庭方案、用戶群..."
                                                                bg="bg.subtle"
                                                                borderColor="border.emphasized"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="xs"
                                                            />
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                Telegram 收款群組(選填)
                                                            </Field.Label>
                                                            <NativeSelectRoot>
                                                                <NativeSelectField
                                                                    value={subscriptionForm.telegram_group_id || ''}
                                                                    onChange={e => setSubscriptionForm({ ...subscriptionForm, telegram_group_id: e.target.value || null })}
                                                                    bg="bg.subtle"
                                                                    borderColor="border.emphasized"
                                                                    rounded="xl"
                                                                    h={10}
                                                                    fontSize="xs"
                                                                >
                                                                    <option value="">不關聯任何群組</option>
                                                                    {telegramGroups?.map(g => (
                                                                        <option key={g.id} value={g.id}>{g.name}</option>
                                                                    ))}
                                                                </NativeSelectField>
                                                            </NativeSelectRoot>
                                                            <Text fontSize="10px" color="fg.muted" mt={1}>
                                                                關聯後，這筆訂閱的成員才會出現在「Telegram 群組管理」的收款週期裡
                                                            </Text>
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                服務登入帳號(選填)
                                                            </Field.Label>
                                                            <Input
                                                                value={subscriptionForm.service_account || ''}
                                                                onChange={e => setSubscriptionForm({ ...subscriptionForm, service_account: e.target.value })}
                                                                placeholder="與 Apple ID 不同時填寫，如 Google 帳號"
                                                                bg="bg.subtle"
                                                                borderColor="border.emphasized"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="xs"
                                                                fontFamily="mono"
                                                            />
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                扣款起始日
                                                            </Field.Label>
                                                            <Input
                                                                type="date"
                                                                value={subscriptionForm.start_date?.split('T')[0] || ''}
                                                                onChange={e => setSubscriptionForm({ ...subscriptionForm, start_date: e.target.value })}
                                                                required
                                                                bg="bg.subtle"
                                                                borderColor="border.emphasized"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="xs"
                                                            />
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                調漲後價格(選填)
                                                            </Field.Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={subscriptionForm.next_price ?? ''}
                                                                onChange={e => setSubscriptionForm({ ...subscriptionForm, next_price: e.target.value ? parseFloat(e.target.value) : null })}
                                                                placeholder="此帳號調漲後的價格"
                                                                bg="bg.subtle"
                                                                borderColor="border.emphasized"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="xs"
                                                                fontFamily="mono"
                                                            />
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                調漲生效日(選填)
                                                            </Field.Label>
                                                            <Input
                                                                type="date"
                                                                value={subscriptionForm.effective_date?.split('T')[0] || ''}
                                                                onChange={e => setSubscriptionForm({ ...subscriptionForm, effective_date: e.target.value || null })}
                                                                bg="bg.subtle"
                                                                borderColor="border.emphasized"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="xs"
                                                            />
                                                        </Field.Root>
                                                    </Grid>
                                                    <Text fontSize="10px" color="fg.muted" alignSelf="start">
                                                        不同帳號訂閱同一服務的調漲時間可能不同，這裡設定的是「這個帳號」自己的調價計畫，跟「服務與定價管理」裡的預設值互相獨立。
                                                    </Text>

                                                    <HStack w="full" gap={2}>
                                                        {subscriptionForm.id && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                colorPalette="gray"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="sm"
                                                                onClick={() => setSubscriptionForm({ start_date: getTodayString() })}
                                                            >
                                                                取消編輯
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="submit"
                                                            flex={1}
                                                            bg="green.600/20"
                                                            color="green.400"
                                                            border="1px solid"
                                                            borderColor="green.500/30"
                                                            _hover={{ bg: 'green.500', color: 'white' }}
                                                            rounded="xl"
                                                            h={10}
                                                            fontSize="sm"
                                                            fontWeight="bold"
                                                        >
                                                            {subscriptionForm.id ? '儲存變更' : '加入訂閱'}
                                                        </Button>
                                                    </HStack>
                                                </VStack>
                                            </Box>
                                        </VStack>
                                        <DialogCloseTrigger />
                                    </DialogContent>
                                </DialogRoot>
                            </Flex>
                        </Box>

                        {/* Content */}
                        <Box
                            flex={1}
                            px={4}
                            py={3}
                            position="relative"
                            zIndex={10}
                            bg="bg.subtle"
                            maxH="560px"
                            overflowY="auto"
                        >
                            {(account.subscriptions?.length || 0) === 0 && (
                                <Text color="fg.muted" fontSize="xs" textAlign="center" py={4}>
                                    無啟用中訂閱，請先「管理訂閱」新增服務。
                                </Text>
                            )}
                            {account.subscriptions?.map(sub => (
                                <Box key={sub.id} mb={6} _last={{ mb: 0 }}>
                                    <Flex justify="space-between" alignItems="center" borderBottom="1px solid" borderColor="border.default" pb={2} mb={3}>
                                        <VStack align="start" gap={0.5}>
                                            <Text fontSize="sm" fontWeight="bold" color="fg.default" letterSpacing="wide">
                                                {sub.service_name}
                                            </Text>
                                            <Text fontSize="10px" color="green.400" fontFamily="mono">
                                                {sub.group_name}
                                            </Text>
                                            {sub.service_account && (
                                                <Badge colorPalette="orange" fontSize="10px" fontFamily="mono" px={1.5}>
                                                    <Box as={KeyRound} w={2.5} h={2.5} mr={1} display="inline-block" verticalAlign="middle" />
                                                    登入用：{sub.service_account}
                                                </Badge>
                                            )}
                                            {sub.next_price && sub.effective_date && (
                                                <Badge colorPalette="yellow" fontSize="10px" fontFamily="mono" px={1.5}>
                                                    <Box as={TrendingUp} w={2.5} h={2.5} mr={1} display="inline-block" verticalAlign="middle" />
                                                    {new Date(sub.effective_date).toLocaleDateString()} 起調至 {sub.currency} {sub.next_price}
                                                </Badge>
                                            )}
                                            {(sub as any).telegram_group_name && (
                                                <Badge colorPalette="blue" fontSize="10px" fontFamily="mono" px={1.5}>
                                                    <Box as={MessageCircle} w={2.5} h={2.5} mr={1} display="inline-block" verticalAlign="middle" />
                                                    {(sub as any).telegram_group_name}
                                                </Badge>
                                            )}
                                        </VStack>
                                        {/* ──────────────────────────────────────────────────────────────── */}
                                        {/* Member Dialog - 新增成員 */}
                                        {/* ──────────────────────────────────────────────────────────────── */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            h={6}
                                            px={2}
                                            color="green.400"
                                            _hover={{ color: 'green.300', bg: 'green.500/10' }}
                                            fontSize="10px"
                                            onClick={() => {
                                                setSelectedSubscriptionId(sub.id);
                                                setMemberForm({ payment_status: 0 });
                                                setIsMemberOpen(true);
                                            }}
                                        >
                                            <Box as={UserPlus} w={3} h={3} mr={1} /> 加人
                                        </Button>
                                        
                                        <DialogRoot
                                            open={isMemberOpen && selectedSubscriptionId === sub.id}
                                            onOpenChange={(e) => {
                                                if (!e.open) setIsMemberOpen(false);
                                            }}
                                        >
                                            <DialogContent maxW="420px" variant="glass">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        新增 {sub.service_name} 成員
                                                    </DialogTitle>
                                                    <DialogCloseTrigger />
                                                </DialogHeader>
                                                <form onSubmit={handleMemberSubmit}>
                                                    <VStack gap={{ base: 4, md: 5 }}>
                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                電子郵件 (Email) / 代號
                                                            </Field.Label>
                                                            <Input
                                                                value={memberForm.email || ''}
                                                                onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                                                                required
                                                                bg="bg.subtle"
                                                                borderColor="border.emphasized"
                                                                rounded="xl"
                                                                h={{ base: 11, md: 12 }}
                                                                _focus={{
                                                                    borderColor: "focus.ring",
                                                                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                                                }}
                                                                fontFamily="mono"
                                                                fontSize={{ base: 'xs', md: 'sm' }}
                                                                transition="all 0.2s"
                                                            />
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                備註 (選填)
                                                            </Field.Label>
                                                            <Input
                                                                value={memberForm.memo || ''}
                                                                onChange={e => setMemberForm({ ...memberForm, memo: e.target.value })}
                                                                bg="bg.subtle"
                                                                borderColor="border.emphasized"
                                                                rounded="xl"
                                                                h={{ base: 11, md: 12 }}
                                                                fontSize="xs"
                                                                _focus={{
                                                                    borderColor: "focus.ring",
                                                                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                                                }}
                                                                transition="all 0.2s"
                                                            />
                                                        </Field.Root>

                                                        <Checkbox
                                                            checked={memberForm.payment_status === 1}
                                                            onCheckedChange={(e) => setMemberForm({ ...memberForm, payment_status: e.checked ? 1 : 0 })}
                                                        >
                                                            初始狀態為「已繳費」
                                                        </Checkbox>

                                                        <Button
                                                            type="submit"
                                                            w="full"
                                                            colorPalette="green"
                                                            rounded="xl"
                                                            h={{ base: 11, md: 12 }}
                                                            fontSize={{ base: 'sm', md: 'md' }}
                                                            fontWeight="bold"
                                                            shadow="lg"
                                                            _hover={{ transform: 'scale(1.02)' }}
                                                            _active={{ transform: 'scale(0.98)' }}
                                                            transition="all 0.2s"
                                                        >
                                                            儲存成員
                                                        </Button>
                                                    </VStack>
                                                </form>
                                            </DialogContent>
                                        </DialogRoot>
                                    </Flex>

                                    <VStack gap={1.5}>
                                        {sub.members?.length === 0 && (
                                            <Text fontSize="9px" color="fg.muted" textAlign="center" py={2} bg="bg.muted" rounded="lg" border="1px solid" borderColor="border.default">
                                                尚無成員
                                            </Text>
                                        )}
                                        {sub.members?.map(member => (
                                            <Flex
                                                key={member.id}
                                                justify="space-between"
                                                alignItems="center"
                                                py={1.5}
                                                px={3}
                                                bg="bg.muted"
                                                rounded="lg"
                                                border="1px solid"
                                                borderColor="border.default"
                                                _hover={{ borderColor: 'green.500/30', bg: 'bg.hover' }}
                                                transition="all"
                                            >
                                                <HStack gap={2} overflow="hidden">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        p={0}
                                                        minW="auto"
                                                        h="auto"
                                                        color={member.payment_status ? 'green.500' : 'gray.600'}
                                                        _hover={{ color: member.payment_status ? 'green.400' : 'gray.500' }}
                                                        onClick={() => togglePaymentStatus(member)}
                                                        aria-label={member.payment_status ? '標記為未繳費' : '標記為已繳費'}
                                                    >
                                                        <Box
                                                            as={member.payment_status ? CheckCircle2 : Circle}
                                                            w={4}
                                                            h={4}
                                                        />
                                                    </Button>
                                                    <VStack align="start" gap={0} truncate>
                                                        <Text fontSize="xs" fontWeight="bold" color="fg.muted" fontFamily="mono" letterSpacing="tighter" truncate>
                                                            {member.email}
                                                        </Text>
                                                        {member.memo && (
                                                            <Text fontSize="9px" color="fg.muted" truncate>
                                                                {member.memo}
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                </HStack>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    p={1.5}
                                                    minW="auto"
                                                    h="auto"
                                                    color="fg.muted"
                                                    _hover={{ color: 'red.400', bg: 'red.500/10' }}
                                                    onClick={() => deleteMember(member.id)}
                                                    aria-label="刪除成員"
                                                >
                                                    <Box as={Trash2} w={3.5} h={3.5} />
                                                </Button>
                                            </Flex>
                                        ))}
                                    </VStack>
                                </Box>
                            ))}
                        </Box>

                        {/* Footer */}
                        <HStack
                            p={4}
                            borderTop="1px solid"
                            borderColor="border.default"
                            justify="space-between"
                            bg="bg.muted"
                            backdropFilter="blur(10px)"
                            position="relative"
                            zIndex={10}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                color="green.400"
                                _hover={{ color: 'green.300', bg: 'green.500/10' }}
                                fontSize={{ base: '10px', md: 'xs' }}
                                fontWeight="bold"
                                letterSpacing="wider"
                                onClick={() => {
                                    setAccountForm({ ...account });
                                    setIsAccountOpen(true);
                                }}
                            >
                                編輯帳號
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                color="fg.muted"
                                _hover={{ color: 'red.400', bg: 'red.500/10' }}
                                fontSize={{ base: '10px', md: 'xs' }}
                                fontWeight="bold"
                                letterSpacing="wider"
                                onClick={() => deleteAccount(account.id)}
                            >
                                移除帳號卡
                            </Button>
                        </HStack>
                    </Box>
                ))}
            </SimpleGrid>
        </VStack>
    );
}
