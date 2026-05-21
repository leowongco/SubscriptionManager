import useSWR from 'swr';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet, BellRing, AlertTriangle, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
        <div className="space-y-6 md:space-y-10 max-w-7xl mx-auto pb-10 px-0 sm:px-4">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-neutral-900 border border-neutral-800/80 p-5 md:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 md:w-64 h-48 md:h-64 bg-indigo-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 md:w-64 h-48 md:h-64 bg-purple-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">數據中心儀表板</h2>
                    <p className="text-neutral-400 mt-2 text-xs md:text-sm font-medium max-w-2xl">歡迎回來！以下是您目前的 Apple 訂閱資金概況與系統通知。</p>
                </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* KPI Cards */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-neutral-900/40 backdrop-blur-xl border border-indigo-500/20 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">總可用餘額</CardTitle>
                        <div className="p-2 bg-indigo-500/10 rounded-lg md:rounded-xl">
                            <Wallet className="h-4 w-4 md:h-5 md:w-5 text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl md:text-4xl font-black text-white drop-shadow-sm flex items-baseline gap-1.5">
                            <span className="text-xl md:text-2xl text-neutral-400 font-medium">HK$</span>
                            {totalBalanceHKD.toFixed(2)}
                        </div>
                        <p className="text-[10px] md:text-xs text-neutral-500 mt-2 font-medium">所有蘋果帳號加總</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] md:text-sm font-semibold text-purple-400 uppercase tracking-wider">預估每月總支出</CardTitle>
                        <div className="p-2 bg-purple-500/10 rounded-lg md:rounded-xl">
                            <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-3xl md:text-4xl font-black text-white drop-shadow-sm flex items-baseline gap-1.5">
                            <span className="text-xl md:text-2xl text-neutral-400 font-medium font-mono">≈</span>
                            <span className="text-xl md:text-2xl text-neutral-400 font-medium">HK$</span>
                            {monthlyExpenseHKD.toFixed(2)}
                        </div>
                        <p className="text-[10px] md:text-xs text-neutral-500 mt-2 font-medium">基於目前訂閱服務推算</p>
                    </CardContent>
                </Card>

                {/* 餘額趨勢圖 */}
                <BalanceTrendChart data={balanceTrendData} currency="HK$" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2" id="warnings-section">
                {/* Low Balance Warning */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-100 tracking-tight">低餘額警告</h3>
                    </div>

                    {lowBalanceAccounts.length === 0 ? (
                        <div className="text-neutral-500 border border-neutral-800/40 rounded-2xl p-6 text-center bg-neutral-900/20 backdrop-blur-sm text-sm">
                            所有帳號餘額充足。
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {lowBalanceAccounts.map((acc: any) => (
                                <WarningCard key={acc.id} account={acc} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Price Increases */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <BellRing className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-100 tracking-tight">即將生效的調價</h3>
                    </div>

                    {upcomingPriceIncreases.length === 0 ? (
                        <div className="text-neutral-500 border border-neutral-800/40 rounded-2xl p-6 text-center bg-neutral-900/20 backdrop-blur-sm text-sm">
                            目前無即將生效的漲價。
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingPriceIncreases.map(s => (
                                <div key={s.id} className="p-4 rounded-xl border border-orange-900/30 bg-orange-950/10 backdrop-blur-md flex flex-col gap-3 hover:bg-orange-950/20 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-orange-300 text-sm md:text-md">{s.name}</div>
                                        <div className="text-[10px] font-bold text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded border border-orange-800/50 uppercase">
                                            {new Date(s.effective_date!).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                        <span className="text-xs text-neutral-500 line-through">{s.currency} {(s.base_price ?? 0).toFixed(2)}</span>
                                        <div className="flex items-center gap-1.5 text-orange-400 font-black text-sm md:text-md">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            {s.currency} {s.next_price ? s.next_price.toFixed(2) : '0.00'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
