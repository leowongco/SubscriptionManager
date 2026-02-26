import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { PlusCircle, Trash2, CreditCard, Save, QrCode, Clock, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Account {
    id: string;
    apple_id: string;
    google_account: string;
    balance: number;
    currency: string;
}

interface RechargeRow {
    id: string;
    account_id: string;
    amount: number | '';
    gift_card: string;
    date: string;
}

interface HistoryLog {
    id: string;
    account_id: string;
    apple_id: string;
    type: string;
    amount: number;
    created_at: string;
    memo?: string;
}

export default function Recharge() {
    const { data: accounts } = useSWR<Account[]>('accounts', api.getAccounts);
    const { data: history, mutate: mutateHistory } = useSWR<HistoryLog[]>('history', api.getHistory);

    const createEmptyRow = (): RechargeRow => ({
        id: crypto.randomUUID(),
        account_id: '',
        amount: '',
        gift_card: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [rows, setRows] = useState<RechargeRow[]>([createEmptyRow()]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Barcode Dialog State
    const [barcodeOpen, setBarcodeOpen] = useState(false);
    const [barcodeValue, setBarcodeValue] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const addRow = () => {
        setRows([...rows, createEmptyRow()]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof RechargeRow, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty rows
        const validRows = rows.filter(r => r.account_id && r.amount !== '' && Number(r.amount) > 0);

        if (validRows.length === 0) {
            alert('請至少填寫一個有效的加值項目（Apple ID 帳號與餘額金額皆為必填）。');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.batchRecharge(validRows);
            alert(`成功！已處理 ${validRows.length} 筆加值紀錄。`);
            setRows([createEmptyRow()]); // Reset form
            mutateHistory(); // Refresh history table
        } catch (error) {
            console.error(error);
            alert('處理加值時發生錯誤，請稍後再試。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openBarcode = (value: string) => {
        if (!value) return;
        setBarcodeValue(value);
        setBarcodeOpen(true);
    };

    // Calculate Pagination
    const rechargeHistory = useMemo(() => {
        return history?.filter(h => h.type === 'recharge') || [];
    }, [history]);

    const totalPages = Math.ceil(rechargeHistory.length / itemsPerPage);
    const currentHistory = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return rechargeHistory.slice(start, start + itemsPerPage);
    }, [rechargeHistory, currentPage]);

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-neutral-900 border border-neutral-800/80 p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg ring-1 ring-white/20">
                        <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">批次禮品卡加值中心</h2>
                        <p className="text-indigo-200/80 mt-2 text-sm font-medium">同時為多個不同的 Apple ID 執行禮品卡序號自動加值與帳目記錄，支援一鍵產生條碼。</p>
                    </div>
                </div>
            </div>

            {/* Recharge Form Card */}
            <Card className="bg-neutral-900/40 backdrop-blur-xl border-neutral-800/60 shadow-2xl overflow-hidden ring-1 ring-white/5">
                <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <CardHeader className="border-b border-neutral-800/60 pb-5 bg-neutral-950/30">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-indigo-400" />
                        禮品卡加值表單
                    </CardTitle>
                    <CardDescription className="text-neutral-400">請為每張禮品卡填寫詳細資訊。您可以點擊「新增輸入列」同時處理多筆帳單。</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            {rows.map((row, index) => (
                                <div key={row.id} className="grid grid-cols-12 gap-5 items-end bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800/50 relative group transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.1)]">
                                    <div className="absolute -left-3 -top-3 w-8 h-8 bg-neutral-800 border-2 border-neutral-900 text-neutral-400 rounded-full flex items-center justify-center text-xs font-bold font-mono z-10">
                                        {index + 1}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    {/* Account Select */}
                                    <div className="col-span-12 md:col-span-3 space-y-2 relative z-10">
                                        <Label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider ml-1">Apple ID 帳號</Label>
                                        <Select value={row.account_id} onValueChange={(v) => updateRow(row.id, 'account_id', v)}>
                                            <SelectTrigger className="bg-neutral-900/80 border-neutral-700/50 focus:ring-indigo-500/50 rounded-xl h-12 transition-all">
                                                <SelectValue placeholder="請選擇帳號" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-neutral-700 text-neutral-50 rounded-xl shadow-2xl backdrop-blur-3xl">
                                                {accounts?.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 rounded-lg m-1">
                                                        <div className="flex justify-between items-center w-full">
                                                            <span>{acc.apple_id}</span>
                                                            <span className="text-neutral-500 text-xs ml-2 opacity-70 border border-neutral-700 px-1 rounded">{acc.currency}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-2 relative z-10">
                                        <Label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider ml-1">加值日期</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-700/50 focus:border-indigo-500/50 rounded-xl h-12 px-4 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-2 relative z-10">
                                        <Label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider ml-1">金額</Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-sm">$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="500"
                                                value={row.amount}
                                                onChange={(e) => updateRow(row.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))}
                                                className="bg-neutral-900/80 border-neutral-700/50 focus:border-indigo-500/50 rounded-xl h-12 pl-8 font-mono transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Gift Card */}
                                    <div className="col-span-12 md:col-span-4 space-y-2 relative z-10">
                                        <Label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider ml-1">禮品卡序號 / 備註</Label>
                                        <div className="relative flex items-center gap-2">
                                            <Input
                                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                                value={row.gift_card}
                                                onChange={(e) => updateRow(row.id, 'gift_card', e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-700/50 focus:border-indigo-500/50 rounded-xl h-12 uppercase font-mono tracking-wider transition-all"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={!row.gift_card}
                                                onClick={() => openBarcode(row.gift_card)}
                                                className="h-12 w-12 rounded-xl border-neutral-700/50 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30 transition-all text-neutral-400"
                                                title="顯示條碼"
                                            >
                                                <QrCode className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-12 md:col-span-1 flex justify-center pb-1 relative z-10">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRow(row.id)}
                                            disabled={rows.length === 1}
                                            className="h-12 w-12 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center border-t border-neutral-800/60 pt-6 mt-6">
                            <Button
                                type="button"
                                onClick={addRow}
                                variant="outline"
                                className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-xl h-12 px-6 shadow-sm transition-all"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                新增輸入列
                            </Button>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl h-12 px-8 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? '處理中...' : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        確認並提交加值
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            {/* Barcode Modal */}
            <Dialog open={barcodeOpen} onOpenChange={setBarcodeOpen}>
                <DialogContent className="sm:max-w-[450px] bg-neutral-900/90 backdrop-blur-xl border-neutral-800 text-neutral-50 rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex justify-center mb-2">禮品卡條碼</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl mx-auto w-full space-y-4 shadow-inner">
                        <img
                            src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcodeValue)}&code=Code128&translate-esc=on`}
                            alt="Barcode"
                            className="w-full h-auto max-h-[150px] object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="text-black font-mono text-lg tracking-[0.2em] font-bold mt-2 pb-2 text-center w-full border-t border-neutral-200">
                            {barcodeValue}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* History Table */}
            <Card className="bg-neutral-900/40 backdrop-blur-xl border-neutral-800/60 shadow-xl overflow-hidden ring-1 ring-white/5 mt-10">
                <CardHeader className="border-b border-neutral-800/60 pb-5 bg-neutral-950/20 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-neutral-200">
                            <Clock className="w-5 h-5 text-purple-400" />
                            加值歷史紀錄
                        </CardTitle>
                        <CardDescription className="text-neutral-400 mt-1">追蹤最近透過批次表單提交的禮品卡紀錄。</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 px-3 py-1">
                        <Activity className="w-3 h-3 mr-1.5 inline" /> {rechargeHistory.length} 筆
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-neutral-950/50">
                                <TableRow className="border-neutral-800 hover:bg-transparent">
                                    <TableHead className="text-neutral-400 w-[120px] pl-6">日期</TableHead>
                                    <TableHead className="text-neutral-400">Apple ID</TableHead>
                                    <TableHead className="text-neutral-400">禮品卡備註</TableHead>
                                    <TableHead className="text-right text-neutral-400 pr-6">加值金額</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history === undefined ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-neutral-500">
                                            正在讀取歷史資料...
                                        </TableCell>
                                    </TableRow>
                                ) : currentHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-neutral-500">
                                            目前沒有歷史加值紀錄。
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentHistory.map((log) => (
                                        <TableRow key={log.id} className="border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                                            <TableCell className="pl-6 font-mono text-sm text-neutral-400">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="font-medium text-neutral-300">
                                                {log.apple_id}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm uppercase text-neutral-400">
                                                {log.memo || '-'}
                                                {log.memo && (
                                                    <button
                                                        onClick={() => openBarcode(log.memo!)}
                                                        className="ml-3 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded text-xs transition-colors"
                                                    >
                                                        條碼
                                                    </button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <span className="text-emerald-400 font-mono font-bold">
                                                    +{log.amount.toFixed(2)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between border-t border-neutral-800/60 p-4 bg-neutral-950/30">
                        <div className="text-sm text-neutral-500">
                            顯示第 {((currentPage - 1) * itemsPerPage) + 1} 到 {Math.min(currentPage * itemsPerPage, rechargeHistory.length)} 筆，共 {rechargeHistory.length} 筆
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="border-neutral-700 hover:bg-neutral-800 text-neutral-300 h-9"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                上一頁
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="border-neutral-700 hover:bg-neutral-800 text-neutral-300 h-9"
                            >
                                下一頁
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
