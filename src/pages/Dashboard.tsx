import useSWR from 'swr';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Wallet, BellRing } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
        if (!acc.base_price) return sum;
        const rate = RATES[acc.currency] || 1;
        let monthlyPrice = acc.base_price;
        if (acc.cycle === 'yearly') monthlyPrice = acc.base_price / 12;
        return sum + (monthlyPrice * rate);
    }, 0) || 0;

    // Warnings
    const lowBalanceAccounts = accounts?.filter(acc => {
        if (!acc.base_price || acc.base_price <= 0) return false;
        const monthsLeft = acc.balance / acc.base_price;
        return monthsLeft < 2;
    }) || [];

    const upcomingPriceIncreases = services?.filter(s => {
        if (!s.next_price || !s.effective_date) return false;
        const effective = new Date(s.effective_date);
        return effective > new Date(); // still in the future
    }) || [];

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-neutral-900 border border-neutral-800/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-md">總覽儀表板</h2>
                    <p className="text-neutral-400 mt-2 text-lg font-medium">您的訂閱狀況與財務預測，一目瞭然。</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-neutral-900/40 backdrop-blur-xl border border-indigo-500/20 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">總可用餘額</CardTitle>
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                            <Wallet className="h-5 w-5 text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-black text-white drop-shadow-sm flex items-baseline gap-1.5">
                            <span className="text-2xl text-neutral-400 font-medium">HK$</span>
                            {totalBalanceHKD.toFixed(2)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 font-medium">所有蘋果帳號加總</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 backdrop-blur-xl border border-emerald-500/20 shadow-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">預估每月總開支</CardTitle>
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-black text-white drop-shadow-sm flex items-baseline gap-1.5">
                            <span className="text-2xl text-neutral-400 font-medium">HK$</span>
                            {monthlyExpenseHKD.toFixed(2)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 font-medium">基於目前訂閱服務推算</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Low Balance Warnings */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-100 tracking-tight">
                            低餘額警告
                        </h3>
                    </div>

                    {lowBalanceAccounts.length === 0 ? (
                        <div className="text-neutral-500 border border-neutral-800/40 rounded-2xl p-8 text-center bg-neutral-900/20 backdrop-blur-sm">
                            所有帳號餘額充足，一切運作正常。
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {lowBalanceAccounts.map(acc => {
                                const monthsLeft = acc.balance / acc.base_price;
                                return (
                                    <Alert key={acc.id} className="bg-red-950/20 backdrop-blur-md border border-red-900/50 shadow-[0_0_20px_rgba(239,68,68,0.15)] relative overflow-hidden rounded-2xl">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-[pulse_3s_ease-in-out_infinite]"></div>
                                        <div className="relative z-10">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                            <AlertTitle className="text-red-300 font-bold ml-2 text-lg">{acc.apple_id}</AlertTitle>
                                            <AlertDescription className="text-red-300/80 mt-2 pl-7 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                                <span className="font-medium text-red-200">
                                                    {acc.service_name} • <span className="font-mono">{acc.currency} {acc.balance.toFixed(2)}</span>
                                                </span>
                                                <span className={`font-bold px-3 py-1 rounded-full text-xs self-start sm:self-auto shadow-inner ${monthsLeft < 0.1 ? 'bg-red-600 text-white animate-pulse' : 'bg-red-900/60 text-red-200 border border-red-800/50'}`}>
                                                    {monthsLeft < 0.1 ? '⚠️ 即將用盡 (小於 0.1 個月)' : `約 ${monthsLeft.toFixed(1)} 個月可用`}
                                                </span>
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Upcoming Price Increases */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <BellRing className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-100 tracking-tight">
                            即將生效的價格調整
                        </h3>
                    </div>

                    {upcomingPriceIncreases.length === 0 ? (
                        <div className="text-neutral-500 border border-neutral-800/40 rounded-2xl p-8 text-center bg-neutral-900/20 backdrop-blur-sm">
                            目前沒有即將生效的漲價。
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingPriceIncreases.map(s => (
                                <div key={s.id} className="p-5 rounded-2xl border border-orange-900/40 bg-orange-950/20 backdrop-blur-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-orange-500/30 transition-colors shadow-lg">
                                    <div>
                                        <div className="font-bold text-orange-300 text-lg">{s.name}</div>
                                        <div className="text-sm font-medium text-orange-400/80 mt-1 flex items-center gap-2">
                                            <span className="bg-orange-900/50 px-2 py-0.5 rounded border border-orange-800/50">
                                                生效日期
                                            </span>
                                            {new Date(s.effective_date!).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-neutral-500 line-through text-sm font-mono">{s.currency} {s.base_price.toFixed(2)}</span>
                                        <span className="text-orange-400 font-black text-xl font-mono flex items-center gap-1.5 whitespace-nowrap drop-shadow-md">
                                            <TrendingUp className="w-4 h-4 text-orange-500" />
                                            {s.currency} {s.next_price?.toFixed(2)}
                                        </span>
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
