import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Plus, UserPlus, Trash2, CheckCircle2, Circle, ListPlus } from 'lucide-react';
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
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogCloseTrigger,
    Field,
    NativeSelectRoot,
    NativeSelectField,
} from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';
import { useColorModeValue } from '@/components/ui/color-mode';

interface Subscription {
    id: string;
    account_id: string;
    service_id: string;
    service_name: string;
    group_name: string;
    start_date: string;
    base_price: number;
    currency: string;
    cycle: string;
    members?: Member[];
}

interface Account {
    id: string;
    apple_id: string;
    balance: number;
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

export default function Mapping() {
    const { data: accounts, mutate: mutateAccounts } = useSWR<Account[]>('accounts', api.getAccounts);
    const { data: services } = useSWR<any[]>('services', api.getServices);

    // Color mode values for light/dark mode support
    const headerBg = useColorModeValue('white', 'bg.subtle');
    const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
    const headerTitleColor = useColorModeValue('gray.900', 'white');
    const headerTextColor = useColorModeValue('gray.600', 'gray.300');

    const cardBg = useColorModeValue('white', 'gray.900/40');
    const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
    const textColor = useColorModeValue('gray.900', 'white');
    const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
    const mutedTextColor = useColorModeValue('gray.500', 'gray.500');

    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [accountForm, setAccountForm] = useState<Partial<Account>>({});

    const [isMemberOpen, setIsMemberOpen] = useState(false);
    const [memberForm, setMemberForm] = useState<Partial<Member>>({});
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');

    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const [subscriptionForm, setSubscriptionForm] = useState<Partial<Subscription>>({});
    const [selectedSubAccountId, setSelectedSubAccountId] = useState<string | null>(null);

    const getTodayString = () => new Date().toISOString().split('T')[0];

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (accountForm.id) {
            await api.updateAccount(accountForm);
        } else {
            await api.createAccount(accountForm);
        }
        setIsAccountOpen(false);
    };

    const handleSubscriptionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.addSubscription({
                account_id: selectedSubAccountId,
                service_id: subscriptionForm.service_id,
                start_date: subscriptionForm.start_date,
                group_name: subscriptionForm.group_name
            } as any);
            setSubscriptionForm({});
            setIsSubscriptionOpen(false);
            mutateAccounts();
        } catch (error) {
            console.error('Failed to add subscription:', error);
            alert('新增失敗');
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

    const deleteAccount = async (id: string) => {
        if (confirm('確定要刪除此帳號及所有關聯成員嗎？')) {
            await api.deleteAccount(id);
            mutateAccounts();
        }
    };

    const deleteMember = async (id: string) => {
        if (confirm('確定要移除此成員嗎？')) {
            await api.deleteMember(id);
            mutateAccounts();
        }
    };

    return (
        <VStack gap={{ base: 6, md: 10 }} maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }} align="stretch">
            {/* Header Section */}
            <Box
                position="relative"
                overflow="hidden"
                rounded={{ base: '2xl', md: '3xl' }}
                bg={headerBg}
                border="1px solid"
                borderColor={headerBorderColor}
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
                        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color={headerTitleColor} textShadow="md">
                            訂閱關係對應
                        </Text>
                        <Text color={headerTextColor} mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium">
                            管理 Apple ID、獨立服務、與成員的繳費關係。
                        </Text>
                    </Box>

                    <DialogRoot open={isAccountOpen} onOpenChange={(e) => setIsAccountOpen(e.open)}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => setAccountForm({ balance: 0 })}
                                w={{ base: 'full', md: 'auto' }}
                                position="relative"
                                zIndex={10}
                                colorPalette="green"
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
                        </DialogTrigger>
                        <DialogContent
                            maxW="450px"
                            w="92vw"
                            bg="gray.900/90"
                            backdropFilter="blur(40px)"
                            color="gray.50"
                            borderColor="gray.700"
                            rounded="2xl"
                            shadow="2xl"
                            p={{ base: 5, md: 6 }}
                        >
                            <DialogHeader>
                                <DialogTitle fontSize="xl" fontWeight="bold">
                                    {accountForm.id ? '編輯帳號' : '新增帳號'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAccountSubmit}>
                                <VStack gap={{ base: 4, md: 5 }} pt={4}>
                                    <Field.Root>
                                        <Field.Label fontSize={{ base: '10px', md: 'sm' }} color="gray.300" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            Apple ID (付款帳號)
                                        </Field.Label>
                                        <Input
                                            value={accountForm.apple_id || ''}
                                            onChange={e => setAccountForm({ ...accountForm, apple_id: e.target.value })}
                                            required
                                            bg="gray.950/50"
                                            borderColor="gray.800"
                                            rounded="xl"
                                            h={{ base: 11, md: 12 }}
                                            _focus={{ borderColor: 'emerald.500/50' }}
                                            fontFamily="mono"
                                            fontSize={{ base: 'xs', md: 'sm' }}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label fontSize={{ base: '10px', md: 'sm' }} color="gray.300" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            初始餘額
                                        </Field.Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={accountForm.balance || ''}
                                            onChange={e => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) })}
                                            bg="gray.950/50"
                                            borderColor="gray.800"
                                            rounded="xl"
                                            h={{ base: 11, md: 12 }}
                                            _focus={{ borderColor: 'emerald.500/50' }}
                                            fontFamily="mono"
                                            fontSize={{ base: 'xs', md: 'sm' }}
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
                                        transition="all"
                                    >
                                        儲存帳號
                                    </Button>
                                </VStack>
                            </form>
                            <DialogCloseTrigger />
                        </DialogContent>
                    </DialogRoot>
                </Flex>
            </Box>

            {!accounts && (
                <Text color="gray.500" textAlign="center" animation="pulse">
                    讀取關係資料中...
                </Text>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={{ base: 5, md: 6 }}>
                {accounts?.map(account => (
                    <Box
                        key={account.id}
                        bg="gray.900/40"
                        backdropFilter="blur(20px)"
                        border="1px solid"
                        borderColor="gray.700"
                        shadow="xl"
                        overflow="hidden"
                        position="relative"
                        rounded="xl"
                        _hover={{ shadow: '2xl', borderColor: 'emerald.500/30' }}
                        transition="all"
                        display="flex"
                        flexDirection="column"
                    >
                        {/* Hover gradient overlay */}
                        <Box
                            position="absolute"
                            inset={0}
                            bg="linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), rgba(20, 184, 166, 0.05))"
                            opacity={0}
                            _groupHover={{ opacity: 1 }}
                            transition="opacity"
                            pointerEvents="none"
                        />
                        
                        {/* Top gradient bar */}
                        <Box h={1} w="full" bg="linear-gradient(to right, var(--chakra-colors-emerald-500), var(--chakra-colors-teal-500))" />

                        {/* Header */}
                        <Box
                            pb={4}
                            position="relative"
                            zIndex={10}
                            borderBottom="1px solid"
                            borderColor="gray.700"
                            bg="gray.950/40"
                            px={5}
                            pt={4}
                        >
                            <Flex justify="space-between" alignItems="start">
                                <Box minW={0} pr={2}>
                                    <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="white" display="flex" alignItems="center" gap={2} textShadow="md" truncate>
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
                                            <Text color="gray.500" fontSize="10px">
                                                無啟用中訂閱
                                            </Text>
                                        )}
                                    </Box>
                                </Box>
                                <VStack align="end" flexShrink={0}>
                                    <Text fontSize="10px" color="gray.500" fontWeight="semibold" letterSpacing="wider" fontFamily="mono">
                                        {account.subscriptions?.[0]?.currency || '$'}
                                    </Text>
                                    <Text
                                        fontSize={{ base: 'xl', md: '2xl' }}
                                        fontWeight="black"
                                        color="gray.100"
                                        fontFamily="mono"
                                        textShadow="sm"
                                        cursor="pointer"
                                        _hover={{ color: 'emerald.400' }}
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
                                <DialogRoot
                                    open={isSubscriptionOpen && selectedSubAccountId === account.id}
                                    onOpenChange={(open) => {
                                        if (!open) setIsSubscriptionOpen(false);
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            h={7}
                                            px={2}
                                            borderColor="emerald.500/20"
                                            color="emerald.400"
                                            _hover={{ bg: 'emerald.500/10' }}
                                            fontSize="10px"
                                            onClick={() => {
                                                setSelectedSubAccountId(account.id);
                                                setSubscriptionForm({ start_date: getTodayString() });
                                                setIsSubscriptionOpen(true);
                                            }}
                                        >
                                            <Box as={ListPlus} w={3.5} h={3.5} mr={1} /> 管理訂閱
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent
                                        maxW="450px"
                                        w="92vw"
                                        bg="gray.900/95"
                                        backdropFilter="blur(40px)"
                                        borderColor="gray.700"
                                        color="gray.50"
                                        rounded="2xl"
                                        shadow="2xl"
                                        p={{ base: 5, md: 6 }}
                                    >
                                        <DialogHeader>
                                            <DialogTitle fontSize="xl" fontWeight="bold">
                                                訂閱管理 - {account.apple_id}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <VStack gap={4} pt={2}>
                                            <Box
                                                bg="gray.950/50"
                                                rounded="xl"
                                                border="1px solid"
                                                borderColor="gray.700"
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
                                                            bg="gray.900/50"
                                                            p={2}
                                                            rounded="lg"
                                                            border="1px solid"
                                                            borderColor="gray.700"
                                                            mb={2}
                                                            _last={{ mb: 0 }}
                                                        >
                                                            <Box>
                                                                <Text fontSize="sm" fontWeight="semibold" color="emerald.300">
                                                                    {sub.service_name}{' '}
                                                                    <Text as="span" fontSize="10px" color="gray.300" fontWeight="normal">
                                                                        ({sub.group_name})
                                                                    </Text>
                                                                </Text>
                                                                <Text fontSize="10px" color="gray.500" fontFamily="mono">
                                                                    {sub.currency} {sub.base_price} / {sub.cycle === 'yearly' ? '年' : '月'}
                                                                    <Badge ml={2} bg="gray.800" fontSize="10px" color="gray.300">
                                                                        每月 {new Date(sub.start_date).getDate()} 日扣
                                                                    </Badge>
                                                                </Text>
                                                            </Box>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                color="gray.500"
                                                                _hover={{ color: 'red.400', bg: 'red.500/10' }}
                                                                onClick={() => removeSubscription(sub.id)}
                                                                aria-label="移除訂閱"
                                                            >
                                                                <Box as={Trash2} w={4} h={4} />
                                                            </Button>
                                                        </Flex>
                                                    ))
                                                ) : (
                                                    <Text textAlign="center" fontSize="xs" color="gray.500" py={4}>
                                                        無訂閱項目
                                                    </Text>
                                                )}
                                            </Box>

                                            <Box as="form" onSubmit={handleSubscriptionSubmit} w="full">
                                                <VStack gap={4} pt={2} borderTop="1px solid" borderColor="gray.700">
                                                    <Grid templateColumns="2" gap={4}>
                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="gray.300" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                新增服務
                                                            </Field.Label>
                                                            <NativeSelectRoot>
                                                                <NativeSelectField
                                                                    value={subscriptionForm.service_id}
                                                                    onChange={v => setSubscriptionForm({ ...subscriptionForm, service_id: v.target.value })}
                                                                    bg="gray.950/50"
                                                                    borderColor="gray.800"
                                                                    rounded="xl"
                                                                    h={10}
                                                                    fontSize="xs"
                                                                >
                                                                    <option value="">選擇服務</option>
                                                                    {services?.map(s => (
                                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                                    ))}
                                                                </NativeSelectField>
                                                            </NativeSelectRoot>
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="gray.300" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                群組名稱
                                                            </Field.Label>
                                                            <Input
                                                                value={subscriptionForm.group_name || ''}
                                                                onChange={e => setSubscriptionForm({ ...subscriptionForm, group_name: e.target.value })}
                                                                required
                                                                placeholder="如：家庭方案、用戶群..."
                                                                bg="gray.950/50"
                                                                borderColor="gray.800"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="xs"
                                                            />
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="gray.300" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                扣款起始日
                                                            </Field.Label>
                                                            <Input
                                                                type="date"
                                                                value={subscriptionForm.start_date?.split('T')[0] || ''}
                                                                onChange={e => setSubscriptionForm({ ...subscriptionForm, start_date: e.target.value })}
                                                                required
                                                                bg="gray.950/50"
                                                                borderColor="gray.800"
                                                                rounded="xl"
                                                                h={10}
                                                                fontSize="xs"
                                                            />
                                                        </Field.Root>
                                                    </Grid>

                                                    <Button
                                                        type="submit"
                                                        w="full"
                                                        bg="emerald.600/20"
                                                        color="emerald.400"
                                                        border="1px solid"
                                                        borderColor="emerald.500/30"
                                                        _hover={{ bg: 'emerald.500', color: 'white' }}
                                                        rounded="xl"
                                                        h={10}
                                                        fontSize="sm"
                                                        fontWeight="bold"
                                                    >
                                                        加入訂閱
                                                    </Button>
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
                            bg="gray.900/20"
                        >
                            {(account.subscriptions?.length || 0) === 0 && (
                                <Text color="gray.500" fontSize="xs" textAlign="center" py={4}>
                                    無啟用中訂閱，請先「管理訂閱」新增服務。
                                </Text>
                            )}
                            {account.subscriptions?.map(sub => (
                                <Box key={sub.id} mb={6} _last={{ mb: 0 }}>
                                    <Flex justify="space-between" alignItems="center" borderBottom="1px solid" borderColor="gray.700" pb={2} mb={3}>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="sm" fontWeight="bold" color="white" letterSpacing="wide">
                                                {sub.service_name}
                                            </Text>
                                            <Text fontSize="10px" color="emerald.400/80" fontFamily="mono">
                                                {sub.group_name}
                                            </Text>
                                        </VStack>
                                        <DialogRoot
                                            open={isMemberOpen && selectedSubscriptionId === sub.id}
                                            onOpenChange={(open) => {
                                                if (!open) setIsMemberOpen(false);
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    h={6}
                                                    px={2}
                                                    color="emerald.400"
                                                    _hover={{ color: 'emerald.300', bg: 'emerald.500/10' }}
                                                    fontSize="10px"
                                                    onClick={() => {
                                                        setSelectedSubscriptionId(sub.id);
                                                        setMemberForm({ payment_status: 0 });
                                                        setIsMemberOpen(true);
                                                    }}
                                                >
                                                    <Box as={UserPlus} w={3} h={3} mr={1} /> 加人
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent
                                                maxW="400px"
                                                w="92vw"
                                                bg="gray.900/90"
                                                backdropFilter="blur(40px)"
                                                borderColor="gray.700"
                                                color="gray.50"
                                                rounded="2xl"
                                                shadow="2xl"
                                                p={{ base: 5, md: 6 }}
                                            >
                                                <DialogHeader>
                                                    <DialogTitle fontSize="xl" fontWeight="bold">
                                                        新增 {sub.service_name} 成員
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleMemberSubmit}>
                                                    <VStack gap={{ base: 4, md: 5 }} pt={4}>
                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="gray.300" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                電子郵件 (Email) / 代號
                                                            </Field.Label>
                                                            <Input
                                                                value={memberForm.email || ''}
                                                                onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                                                                required
                                                                bg="gray.950/50"
                                                                borderColor="gray.800"
                                                                rounded="xl"
                                                                h={{ base: 11, md: 12 }}
                                                                _focus={{ borderColor: 'emerald.500/50' }}
                                                                fontFamily="mono"
                                                                fontSize={{ base: 'xs', md: 'sm' }}
                                                            />
                                                        </Field.Root>

                                                        <Field.Root>
                                                            <Field.Label fontSize={{ base: '10px', md: 'xs' }} color="gray.300" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                                備註 (選填)
                                                            </Field.Label>
                                                            <Input
                                                                value={memberForm.memo || ''}
                                                                onChange={e => setMemberForm({ ...memberForm, memo: e.target.value })}
                                                                bg="gray.950/50"
                                                                borderColor="gray.800"
                                                                rounded="xl"
                                                                h={{ base: 11, md: 12 }}
                                                                fontSize="xs"
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
                                                            transition="all"
                                                        >
                                                            儲存成員
                                                        </Button>
                                                    </VStack>
                                                </form>
                                                <DialogCloseTrigger />
                                            </DialogContent>
                                        </DialogRoot>
                                    </Flex>

                                    <VStack gap={1.5}>
                                        {sub.members?.length === 0 && (
                                            <Text fontSize="9px" color="gray.500" textAlign="center" py={2} bg="gray.950/30" rounded="lg" border="1px solid" borderColor="gray.700">
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
                                                bg="gray.950/50"
                                                rounded="lg"
                                                border="1px solid"
                                                borderColor="gray.700"
                                                _hover={{ borderColor: 'emerald.500/30', bg: 'gray.900/80' }}
                                                transition="all"
                                            >
                                                <HStack gap={2} overflow="hidden">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        p={0}
                                                        minW="auto"
                                                        h="auto"
                                                        color={member.payment_status ? 'emerald.500' : 'gray.600'}
                                                        _hover={{ color: member.payment_status ? 'emerald.400' : 'gray.500' }}
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
                                                        <Text fontSize="xs" fontWeight="bold" color="gray.300" fontFamily="mono" letterSpacing="tighter" truncate>
                                                            {member.email}
                                                        </Text>
                                                        {member.memo && (
                                                            <Text fontSize="9px" color="gray.500" truncate>
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
                                                    color="gray.500"
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
                            borderColor="gray.700"
                            justify="space-between"
                            bg="gray.950/60"
                            backdropFilter="blur(10px)"
                            position="relative"
                            zIndex={10}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                color="emerald.400"
                                _hover={{ color: 'emerald.300', bg: 'emerald.500/10' }}
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
                                color="gray.500"
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
