import useSWR from 'swr';
import { api } from '@/lib/api';
import { Box, Flex, VStack, Text, Grid } from '@chakra-ui/react';
import { TrendingUp, Wallet, BellRing, AlertTriangle, TrendingDown } from 'lucide-react';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { WarningCard } from '@/components/dashboard/WarningCard';
import { BalanceTrendChart } from '@/components/dashboard/BalanceTrendChart';

// Simple mock exchange rates to HKD for demonstration
const RATES: Record<string, number> = {
    HKD: 1,
    TWD: 0.24,
    TRY: 0.23,
    ARS: 0.0076,
    USD: 7.82
};

export default function Dashboard() {
    const { data: accounts } = useSWR<any[]>('accounts', api.getAccounts);
    const { data: services } = useSWR<any[]>('services', api.getServices);

    // Calculations
    const totalBalanceHKD = accounts?.reduce((sum, acc) => {
        const rate = RATES[acc.currency] || 1;
        return sum + (acc.balance * rate);
    }, 0) || 0;

    const monthlyExpenseHKD = accounts?.reduce((sum, acc) => {
        if (!acc.subscriptions || acc.subscriptions.length === 0) return sum;

        const accMonthlyBurn = acc.subscriptions.reduce((subSum: number, sub: any) => {
            const rate = RATES[sub.currency] || 1;
            let monthlyPrice = sub.base_price || 0;
            if (sub.cycle === 'yearly') monthlyPrice = monthlyPrice / 12;
            return subSum + (monthlyPrice * rate);
        }, 0);

        return sum + accMonthlyBurn;
    }, 0) || 0;

    // Warnings
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
        // Also attach calculated data for easy render
        acc._monthlyBurn = totalMonthlyBurn;
        acc._monthsLeft = monthsLeft;

        return monthsLeft < 2;
    }) || [];

    const upcomingPriceIncreases = services?.filter(s => {
        if (!s.next_price || !s.effective_date) return false;
        const effective = new Date(s.effective_date);
        return effective > new Date(); // still in the future
    }) || [];

    // Mock trend data - in real app, this would come from API
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
                bg="linear-gradient(to right, rgba(67, 56, 202, 0.4), rgba(88, 28, 135, 0.2), rgba(23, 23, 23, 1))"
                border="1px solid rgba(38, 38, 38, 0.8)"
                p={{ base: 5, md: 8 }}
                shadow="2xl"
                backdropFilter="blur(20px)"
                transition="all 0.3s"
            >
                <Box
                    position="absolute"
                    top={0}
                    right={0}
                    mt={{ base: -16, md: -16 }}
                    mr={{ base: -16, md: -16 }}
                    w={{ base: 48, md: 64 }}
                    h={{ base: 48, md: 64 }}
                    bg="rgba(99, 102, 241, 0.1)"
                    filter="blur(80px)"
                    rounded="full"
                    pointerEvents="none"
                />
                <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    mb={{ base: -16, md: -16 }}
                    ml={{ base: -16, md: -16 }}
                    w={{ base: 48, md: 64 }}
                    h={{ base: 48, md: 64 }}
                    bg="rgba(168, 85, 247, 0.1)"
                    filter="blur(80px)"
                    rounded="full"
                    pointerEvents="none"
                />

                <Box position="relative" zIndex={10}>
                    <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="white" textShadow="0 2px 4px rgba(0,0,0,0.3)">
                        數據中心儀表板
                    </Text>
                    <Text color="gray.400" mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" maxW="2xl">
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
                    bg="rgba(23, 23, 23, 0.4)"
                    backdropFilter="blur(20px)"
                    border="1px solid rgba(99, 102, 241, 0.2)"
                    rounded="xl"
                    shadow="2xl"
                    overflow="hidden"
                    position="relative"
                    role="group"
                >
                    <Box
                        position="absolute"
                        inset={0}
                        bg="linear-gradient(to bottom right, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.5s"
                        pointerEvents="none"
                    />
                    <Flex p={6} flexDirection="row" alignItems="center" justifyContent="space-between" pb={2}>
                        <Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color="indigo.400" textTransform="uppercase" letterSpacing="wider">
                            總可用餘額
                        </Text>
                        <Box p={2} bg="rgba(99, 102, 241, 0.1)" rounded={{ base: 'lg', md: 'xl' }}>
                            <Box as={Wallet} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color="indigo.400" />
                        </Box>
                    </Flex>
                    <Box p={6} pt={0} position="relative" zIndex={10}>
                        <Flex fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" color="white" textShadow="0 1px 2px rgba(0,0,0,0.2)" alignItems="baseline" gap={1.5}>
                            <Text fontSize={{ base: 'xl', md: '2xl' }} color="gray.400" fontWeight="medium">HK$</Text>
                            {totalBalanceHKD.toFixed(2)}
                        </Flex>
                        <Text fontSize={{ base: '10px', md: 'xs' }} color="gray.500" mt={2} fontWeight="medium">
                            所有蘋果帳號加總
                        </Text>
                    </Box>
                </Box>

                {/* Monthly Expense Card */}
                <Box
                    bg="rgba(23, 23, 23, 0.4)"
                    backdropFilter="blur(20px)"
                    border="1px solid rgba(168, 85, 247, 0.2)"
                    rounded="xl"
                    shadow="2xl"
                    overflow="hidden"
                    position="relative"
                    role="group"
                >
                    <Box
                        position="absolute"
                        inset={0}
                        bg="linear-gradient(to bottom right, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.05))"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.5s"
                        pointerEvents="none"
                    />
                    <Flex p={6} flexDirection="row" alignItems="center" justifyContent="space-between" pb={2}>
                        <Text fontSize={{ base: '10px', md: 'sm' }} fontWeight="semibold" color="purple.400" textTransform="uppercase" letterSpacing="wider">
                            預估每月總支出
                        </Text>
                        <Box p={2} bg="rgba(168, 85, 247, 0.1)" rounded={{ base: 'lg', md: 'xl' }}>
                            <Box as={TrendingDown} h={{ base: 4, md: 5 }} w={{ base: 4, md: 5 }} color="purple.400" />
                        </Box>
                    </Flex>
                    <Box p={6} pt={0} position="relative" zIndex={10}>
                        <Flex fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" color="white" textShadow="0 1px 2px rgba(0,0,0,0.2)" alignItems="baseline" gap={1.5}>
                            <Text fontSize={{ base: 'xl', md: '2xl' }} color="gray.400" fontWeight="medium">≈</Text>
                            <Text fontSize={{ base: 'xl', md: '2xl' }} color="gray.400" fontWeight="medium">HK$</Text>
                            {monthlyExpenseHKD.toFixed(2)}
                        </Flex>
                        <Text fontSize={{ base: '10px', md: 'xs' }} color="gray.500" mt={2} fontWeight="medium">
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
                    <Flex alignItems="center" gap={3} borderBottom="1px solid rgba(38, 38, 38, 0.6)" pb={3}>
                        <Box p={2} bg="rgba(239, 68, 68, 0.1)" rounded="lg">
                            <Box as={AlertTriangle} w={5} h={5} color="red.500" />
                        </Box>
                        <Text fontSize="xl" fontWeight="bold" color="gray.100" letterSpacing="tight">
                            低餘額警告
                        </Text>
                    </Flex>

                    {lowBalanceAccounts.length === 0 ? (
                        <Box
                            color="gray.500"
                            border="1px solid rgba(38, 38, 38, 0.4)"
                            rounded="2xl"
                            p={6}
                            textAlign="center"
                            bg="rgba(23, 23, 23, 0.2)"
                            backdropFilter="blur(4px)"
                            fontSize="sm"
                        >
                            所有帳號餘額充足。
                        </Box>
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
                    <Flex alignItems="center" gap={3} borderBottom="1px solid rgba(38, 38, 38, 0.6)" pb={3}>
                        <Box p={2} bg="rgba(249, 115, 22, 0.1)" rounded="lg">
                            <Box as={BellRing} w={5} h={5} color="orange.400" />
                        </Box>
                        <Text fontSize="xl" fontWeight="bold" color="gray.100" letterSpacing="tight">
                            即將生效的調價
                        </Text>
                    </Flex>

                    {upcomingPriceIncreases.length === 0 ? (
                        <Box
                            color="gray.500"
                            border="1px solid rgba(38, 38, 38, 0.4)"
                            rounded="2xl"
                            p={6}
                            textAlign="center"
                            bg="rgba(23, 23, 23, 0.2)"
                            backdropFilter="blur(4px)"
                            fontSize="sm"
                        >
                            目前無即將生效的漲價。
                        </Box>
                    ) : (
                        <VStack gap={3} align="stretch">
                            {upcomingPriceIncreases.map(s => (
                                <Box
                                    key={s.id}
                                    p={4}
                                    rounded="xl"
                                    border="1px solid rgba(154, 52, 18, 0.3)"
                                    bg="rgba(124, 45, 18, 0.1)"
                                    backdropFilter="blur(12px)"
                                    display="flex"
                                    flexDirection="column"
                                    gap={3}
                                    _hover={{ bg: 'rgba(124, 45, 18, 0.2)' }}
                                    transition="all"
                                >
                                    <Flex justify="space-between" alignItems="start">
                                        <Text fontWeight="bold" color="orange.300" fontSize={{ base: 'sm', md: 'md' }}>{s.name}</Text>
                                        <Text
                                            fontSize="10px"
                                            fontWeight="bold"
                                            color="orange.400"
                                            bg="rgba(154, 52, 18, 0.3)"
                                            px={2}
                                            py={0.5}
                                            rounded="sm"
                                            border="1px solid rgba(154, 52, 18, 0.5)"
                                            textTransform="uppercase"
                                        >
                                            {new Date(s.effective_date!).toLocaleDateString()}
                                        </Text>
                                    </Flex>
                                    <Flex justify="space-between" alignItems="center" bg="rgba(0,0,0,0.2)" p={2} rounded="lg" border="1px solid rgba(255,255,255,0.05)">
                                        <Text fontSize="xs" color="gray.500" textDecoration="line-through">
                                            {s.currency} {(s.base_price ?? 0).toFixed(2)}
                                        </Text>
                                        <Flex alignItems="center" gap={1.5} color="orange.400" fontWeight="black" fontSize={{ base: 'sm', md: 'md' }}>
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
