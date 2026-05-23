import useSWR from 'swr';
import { api } from '@/lib/api';
import { Box, Flex, VStack, Text, Grid, EmptyState, Icon } from '@chakra-ui/react';
import { TrendingUp, Wallet, BellRing, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WarningCard } from '@/components/dashboard/WarningCard';
import { BalanceTrendChart } from '@/components/dashboard/BalanceTrendChart';
import { EXCHANGE_RATES } from '@/lib/currency';

export default function Dashboard() {
    const { data: accounts } = useSWR<any[]>('accounts', api.getAccounts);
    const { data: services } = useSWR<any[]>('services', api.getServices);
    
    // ========================================
    // Data Calculations
    // ========================================
    
    /**
     * Total balance across all accounts (converted to HKD)
     * Sums up each account's balance multiplied by its currency exchange rate
     */
    const totalBalanceHKD = accounts?.reduce((sum, acc) => {
        const rate = EXCHANGE_RATES[acc.currency] || 1;
        return sum + (acc.balance * rate);
    }, 0) || 0;

    /**
     * Estimated monthly expense across all subscriptions (converted to HKD)
     * - For monthly subscriptions: use base_price directly
     * - For yearly subscriptions: divide by 12 to get monthly equivalent
     */
    const monthlyExpenseHKD = accounts?.reduce((sum, acc) => {
        if (!acc.subscriptions || acc.subscriptions.length === 0) return sum;

        const accMonthlyBurn = acc.subscriptions.reduce((subSum: number, sub: any) => {
            const rate = EXCHANGE_RATES[sub.currency] || 1;
            let monthlyPrice = sub.base_price || 0;
            if (sub.cycle === 'yearly') monthlyPrice = monthlyPrice / 12;
            return subSum + (monthlyPrice * rate);
        }, 0);

        return sum + accMonthlyBurn;
    }, 0) || 0;

    // ========================================
    // Warning Data Calculations
    // ========================================
    
    /**
     * Accounts with low balance (less than 2 months of runway)
     * Attaches _monthlyBurn and _monthsLeft for display purposes
     */
    const lowBalanceAccounts = accounts?.filter(acc => {
        if (!acc.subscriptions || acc.subscriptions.length === 0) return false;

        // Calculate total monthly burn for this account
        const totalMonthlyBurn = acc.subscriptions.reduce((sum: number, sub: any) => {
            let monthlyPrice = sub.base_price || 0;
            if (sub.cycle === 'yearly') monthlyPrice = monthlyPrice / 12;
            return sum + monthlyPrice;
        }, 0);

        if (totalMonthlyBurn <= 0) return false;

        const monthsLeft = acc.balance / totalMonthlyBurn;
        // Attach calculated data for easy render
        acc._monthlyBurn = totalMonthlyBurn;
        acc._monthsLeft = monthsLeft;

        return monthsLeft < 2;
    }) || [];

    /**
     * Services with upcoming price increases (effective date in the future)
     */
    const upcomingPriceIncreases = services?.filter(s => {
        if (!s.next_price || !s.effective_date) return false;
        const effective = new Date(s.effective_date);
        return effective > new Date(); // still in the future
    }) || [];

    // ========================================
    // Chart Data
    // ========================================
    
    /**
     * Mock trend data for balance chart
     * TODO: Replace with real API data in production
     */
    const balanceTrendData = [
        { date: '12月', balance: 1200 },
        { date: '1月', balance: 1350 },
        { date: '2月', balance: 1180 },
        { date: '3月', balance: 1420 },
        { date: '4月', balance: 1280 },
        { date: '5月', balance: totalBalanceHKD },
    ];

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
                <Box position="relative" zIndex={10}>
                    <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="fg.default" textShadow="md">
                        數據中心儀表板
                    </Text>
                    <Text color="fg.muted" mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" maxW="2xl">
                        歡迎回來！以下是您目前的 Apple 訂閱資金概況與系統通知。
                    </Text>
                </Box>
            </Box>

            {/* Quick Actions */}
            <QuickActions />

            {/* KPI Cards */}
            <Grid gap={{ base: 4, md: 6 }} templateColumns={{ md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}>
                {/* Total Balance Card */}
                <Box
                    bg="bg.panel"
                    backdropFilter="blur(20px)"
                    border="1px solid"
                    borderColor="blue.emphasized"
                    rounded="xl"
                    shadow="2xl"
                    overflow="hidden"
                    position="relative"
                    role="group"
                >
                    <Box
                        position="absolute"
                        inset={0}
                        bg="linear-gradient(to bottom right, var(--chakra-colors-blue-500/10), var(--chakra-colors-blue-600/5))"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.5s"
                        pointerEvents="none"
                    />
                    <Flex p={6} flexDirection="row" alignItems="center" justifyContent="space-between" pb={2}>
                        <Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color="blue.emphasized" textTransform="uppercase" letterSpacing="wider">
                            總可用餘額
                        </Text>
                        <Box p={2} bg="blue.subtle" rounded={{ base: 'lg', md: 'xl' }}>
                            <Box as={Wallet} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color="blue.solid" />
                        </Box>
                    </Flex>
                    <Box p={6} pt={0} position="relative" zIndex={10}>
                        <Flex fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" color="fg.default" textShadow="sm" alignItems="baseline" gap={1.5}>
                            <Text fontSize={{ base: 'xl', md: '2xl' }} color="fg.muted" fontWeight="medium">HK$</Text>
                            {totalBalanceHKD.toFixed(2)}
                        </Flex>
                        <Text fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" mt={2} fontWeight="medium">
                            所有蘋果帳號加總
                        </Text>
                    </Box>
                </Box>

                {/* Monthly Expense Card */}
                <Box
                    bg="bg.panel"
                    backdropFilter="blur(20px)"
                    border="1px solid"
                    borderColor="blue.emphasized"
                    rounded="xl"
                    shadow="2xl"
                    overflow="hidden"
                    position="relative"
                    role="group"
                >
                    <Box
                        position="absolute"
                        inset={0}
                        bg="linear-gradient(to bottom right, var(--chakra-colors-blue-500/10), var(--chakra-colors-blue-600/5))"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.5s"
                        pointerEvents="none"
                    />
                    <Flex p={6} flexDirection="row" alignItems="center" justifyContent="space-between" pb={2}>
                        <Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color="blue.emphasized" textTransform="uppercase" letterSpacing="wider">
                            預估每月總支出
                        </Text>
                        <Box p={2} bg="blue.subtle" rounded={{ base: 'lg', md: 'xl' }}>
                            <Box as={TrendingDown} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color="blue.solid" />
                        </Box>
                    </Flex>
                    <Box p={6} pt={0} position="relative" zIndex={10}>
                        <Flex fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" color="fg.default" textShadow="sm" alignItems="baseline" gap={1.5}>
                            <Text fontSize={{ base: 'xl', md: '2xl' }} color="fg.muted" fontWeight="medium">≈</Text>
                            <Text fontSize={{ base: 'xl', md: '2xl' }} color="fg.muted" fontWeight="medium">HK$</Text>
                            {monthlyExpenseHKD.toFixed(2)}
                        </Flex>
                        <Text fontSize={{ base: '10px', md: 'xs' }} color="fg.muted" mt={2} fontWeight="medium">
                            基於目前訂閱服務推算
                        </Text>
                    </Box>
                </Box>

                {/* Balance Trend Chart */}
                <BalanceTrendChart data={balanceTrendData} currency="HK$" />
            </Grid>

            <Grid gap={6} templateColumns={{ lg: 'repeat(2, 1fr)' }} id="warnings-section">
                {/* Low Balance Warning */}
                <VStack gap={5} align="stretch">
                    <Flex alignItems="center" gap={3} borderBottom="1px solid" borderColor="border.default" pb={3}>
                        <Box p={2} bg="red.subtle" rounded="lg">
                            <Box as={AlertTriangle} w={5} h={5} color="fg.error" />
                        </Box>
                        <Text fontSize="xl" fontWeight="bold" color="fg.emphasized" letterSpacing="tight">
                            低餘額警告
                        </Text>
                    </Flex>

                    {lowBalanceAccounts.length === 0 ? (
                        <EmptyState.Root size="sm">
                            <EmptyState.Content>
                                <EmptyState.Indicator>
                                    <Icon as={CheckCircle} />
                                </EmptyState.Indicator>
                                <VStack textAlign="center" gap={1}>
                                    <EmptyState.Title>所有帳號餘額充足</EmptyState.Title>
                                </VStack>
                            </EmptyState.Content>
                        </EmptyState.Root>
                    ) : (
                        <Grid gap={3} templateColumns={{ md: 'repeat(2, 1fr)' }}>
                            {lowBalanceAccounts.map((acc: any) => (
                                <WarningCard key={acc.id} account={acc} />
                            ))}
                        </Grid>
                    )}
                </VStack>

                {/* Upcoming Price Increases */}
                <VStack gap={5} align="stretch">
                    <Flex alignItems="center" gap={3} borderBottom="1px solid" borderColor="border.default" pb={3}>
                        <Box p={2} bg="orange.subtle" rounded="lg">
                            <Box as={BellRing} w={5} h={5} color="fg.warning" />
                        </Box>
                        <Text fontSize="xl" fontWeight="bold" color="fg.emphasized" letterSpacing="tight">
                            即將生效的調價
                        </Text>
                    </Flex>

                    {upcomingPriceIncreases.length === 0 ? (
                        <EmptyState.Root size="sm">
                            <EmptyState.Content>
                                <EmptyState.Indicator>
                                    <Icon as={CheckCircle} />
                                </EmptyState.Indicator>
                                <VStack textAlign="center" gap={1}>
                                    <EmptyState.Title>目前無即將生效的漲價</EmptyState.Title>
                                </VStack>
                            </EmptyState.Content>
                        </EmptyState.Root>
                    ) : (
                        <VStack gap={3} align="stretch">
                            {upcomingPriceIncreases.map(s => (
                                <Box
                                    key={s.id}
                                    p={4}
                                    rounded="xl"
                                    border="1px solid"
                                    borderColor="orange.emphasized"
                                    bg="orange.subtle"
                                    backdropFilter="blur(12px)"
                                    display="flex"
                                    flexDirection="column"
                                    gap={3}
                                    _hover={{ bg: "orange.muted" }}
                                    transition="all"
                                >
                                    <Flex justify="space-between" alignItems="start">
                                        <Text fontWeight="bold" color="orange.emphasized" fontSize={{ base: 'sm', md: 'md' }}>{s.name}</Text>
                                        <Text
                                            fontSize="10px"
                                            fontWeight="bold"
                                            color="orange.emphasized"
                                            bg="orange.subtle"
                                            px={2}
                                            py={0.5}
                                            rounded="sm"
                                            border="1px solid"
                                            borderColor="orange.emphasized"
                                            textTransform="uppercase"
                                        >
                                            {new Date(s.effective_date!).toLocaleDateString()}
                                        </Text>
                                    </Flex>
                                    <Flex justify="space-between" alignItems="center" bg="bg.muted" p={2} rounded="lg" border="1px solid" borderColor="border.muted">
                                        <Text fontSize="xs" color="fg.muted" textDecoration="line-through">
                                            {s.currency} {(s.base_price ?? 0).toFixed(2)}
                                        </Text>
                                        <Flex alignItems="center" gap={1.5} color="fg.warning" fontWeight="black" fontSize={{ base: 'sm', md: 'md' }}>
                                            <Box as={TrendingUp} w={3.5} h={3.5} />
                                            {s.currency} {s.next_price ? s.next_price.toFixed(2) : '0.00'}
                                        </Flex>
                                    </Flex>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </VStack>
            </Grid>
        </VStack>
    );
}
