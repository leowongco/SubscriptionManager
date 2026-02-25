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
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-50">Overview</h2>
                <p className="text-neutral-400 mt-1">Your subscription snapshot and financial projections.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-900/40 to-neutral-900 border-indigo-500/20 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-400">Total Available Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-50">
                            <span className="text-xl text-neutral-500 mr-1">HK$</span>
                            {totalBalanceHKD.toFixed(2)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Across all Apple IDs</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-900/30 to-neutral-900 border-emerald-500/20 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-400">Monthly Projected Expense</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-50">
                            <span className="text-xl text-neutral-500 mr-1">HK$</span>
                            {monthlyExpenseHKD.toFixed(2)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Estimated based on current services</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-neutral-200">
                        <AlertCircle className="w-5 h-5 text-red-500" /> Low Balance Alerts
                    </h3>
                    {lowBalanceAccounts.length === 0 ? (
                        <div className="text-neutral-500 border border-neutral-800/50 rounded-lg p-6 text-center bg-neutral-900/30">
                            All accounts have sufficient balance.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lowBalanceAccounts.map(acc => {
                                const monthsLeft = acc.balance / acc.base_price;
                                return (
                                    <Alert key={acc.id} className="bg-red-950/20 border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-red-500/5 animate-[pulse_2s_ease-in-out_infinite]"></div>
                                        <AlertCircle className="h-4 w-4 text-red-400" />
                                        <AlertTitle className="text-red-400 font-semibold">{acc.apple_id}</AlertTitle>
                                        <AlertDescription className="text-red-300/80 flex justify-between items-center mt-1">
                                            <span>{acc.service_name} • {acc.currency} {acc.balance.toFixed(2)}</span>
                                            <span className="font-bold bg-red-900/50 px-2 py-0.5 rounded text-red-300 text-xs">
                                                {monthsLeft < 0.1 ? 'Almost empty' : `${monthsLeft.toFixed(1)} months left`}
                                            </span>
                                        </AlertDescription>
                                    </Alert>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-neutral-200">
                        <BellRing className="w-5 h-5 text-orange-400" /> Upcoming Price Changes
                    </h3>
                    {upcomingPriceIncreases.length === 0 ? (
                        <div className="text-neutral-500 border border-neutral-800/50 rounded-lg p-6 text-center bg-neutral-900/30">
                            No upcoming price adjustments.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingPriceIncreases.map(s => (
                                <div key={s.id} className="p-4 rounded-xl border border-orange-900/30 bg-orange-950/10 flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-orange-200">{s.name}</div>
                                        <div className="text-sm text-orange-400/70 mt-0.5">
                                            Effective {new Date(s.effective_date!).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-neutral-400 line-through text-xs">{s.currency} {s.base_price}</span>
                                        <span className="text-orange-400 font-bold whitespace-nowrap">➔ {s.currency} {s.next_price}</span>
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
