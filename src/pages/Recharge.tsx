import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import {
    Plus,
    Trash2,
    History as HistoryIcon,
    CreditCard,
    Barcode,
    Users,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface RechargeRow {
    id: string;
    account_id: string;
    amount: number;
    date: string;
    gift_card?: string;
}

export default function Recharge() {
    const { data: accounts } = useSWR<any[]>('accounts', api.getAccounts);
    const { data: history, mutate: mutateHistory } = useSWR<any[]>('history', api.getHistory);

    const [rows, setRows] = useState<RechargeRow[]>([
        { id: Math.random().toString(), account_id: '', amount: 0, date: new Date().toISOString().split('T')[0] }
    ]);
    const [loading, setLoading] = useState(false);
    const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
    const [selectedGiftCard, setSelectedGiftCard] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(), account_id: '', amount: 0, date: new Date().toISOString().split('T')[0] }]);
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
        setLoading(true);
        try {
            for (const row of rows) {
                if (row.account_id && row.amount > 0) {
                    await api.rechargeAccount({
                        account_id: row.account_id,
                        amount: row.amount,
                        memo: row.gift_card || 'Batch recharge'
                    });
                }
            }
            setRows([{ id: Math.random().toString(), account_id: '', amount: 0, date: new Date().toISOString().split('T')[0] }]);
            mutateHistory();
        } finally {
            setLoading(false);
        }
    };

    const historyData = useMemo(() => {
        if (!history) return [];
        const start = (currentPage - 1) * itemsPerPage;
        return history.slice(start, start + itemsPerPage);
    }, [history, currentPage]);

    const totalPages = Math.ceil((history?.length || 0) / itemsPerPage);

    return (
        <div className="space-y-6 md:space-y-10 max-w-6xl mx-auto pb-10 px-0 sm:px-4">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-neutral-900 border border-neutral-800/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 md:w-64 h-48 md:h-64 bg-blue-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 md:w-64 h-48 md:h-64 bg-indigo-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-blue-400" />
                        批次加值中心
                    </h2>
                    <p className="text-neutral-400 mt-2 text-xs md:text-sm font-medium">快速為多個 Apple ID 批量登錄禮品卡充值紀錄。</p>
                </div>
            </div>

            {/* Recharge Form Card */}
            <Card className="bg-neutral-900/40 backdrop-blur-xl border-neutral-800/60 shadow-2xl overflow-hidden ring-1 ring-white/5 rounded-2xl md:rounded-3xl">
                <CardHeader className="border-b border-neutral-800/50 bg-neutral-950/20 px-6 py-4 md:py-6">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg md:text-xl font-bold text-neutral-100 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-500" /> 加值項目單
                        </CardTitle>
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 font-mono text-[10px] md:text-xs">{rows.length} 筆記錄</Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 md:pt-8 px-4 md:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                        <div className="space-y-5 md:space-y-6">
                            {rows.map((row, index) => (
                                <div key={row.id} className="grid grid-cols-12 gap-4 md:gap-5 items-end bg-neutral-950/50 p-5 md:p-6 rounded-xl md:rounded-2xl border border-neutral-800/50 relative group transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.1)]">
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    {/* Account Select */}
                                    <div className="col-span-12 md:col-span-3 space-y-1.5 md:space-y-2 relative z-10">
                                        <Label className="text-[10px] md:text-xs text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <Users className="w-3 h-3" /> 付款帳號 (Apple ID)
                                        </Label>
                                        <Select
                                            value={row.account_id}
                                            onValueChange={(val) => updateRow(row.id, 'account_id', val)}
                                        >
                                            <SelectTrigger className="bg-neutral-900/80 border-neutral-800 focus:ring-blue-500/50 rounded-xl h-11 md:h-12 transition-all text-xs">
                                                <SelectValue placeholder="請選擇帳號..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50 rounded-xl shadow-2xl">
                                                {accounts?.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="cursor-pointer hover:bg-neutral-800 rounded-lg text-xs md:text-sm">
                                                        {acc.apple_id} <span className="text-[10px] opacity-50 ml-1">({acc.currency})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-6 md:col-span-2 space-y-1.5 md:space-y-2 relative z-10">
                                        <Label className="text-[10px] md:text-xs text-neutral-500 font-bold uppercase tracking-wider">加值日期</Label>
                                        <Input
                                            type="date"
                                            value={row.date}
                                            onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                            className="bg-neutral-900/80 border-neutral-800 focus:border-blue-500/50 rounded-xl h-11 md:h-12 transition-all text-xs"
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-6 md:col-span-2 space-y-1.5 md:space-y-2 relative z-10">
                                        <Label className="text-[10px] md:text-xs text-neutral-500 font-bold uppercase tracking-wider">加值金額</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={row.amount || ''}
                                                onChange={(e) => updateRow(row.id, 'amount', parseFloat(e.target.value))}
                                                className="bg-neutral-900/80 border-neutral-800 focus:border-blue-500/50 rounded-xl h-11 md:h-12 pl-3 transition-all font-mono text-xs md:text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Gift Card */}
                                    <div className="col-span-12 md:col-span-4 space-y-1.5 md:space-y-2 relative z-10">
                                        <Label className="text-[10px] md:text-xs text-neutral-500 font-bold uppercase tracking-wider">禮品卡序號 / 備註</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="輸入序號..."
                                                value={row.gift_card || ''}
                                                onChange={(e) => updateRow(row.id, 'gift_card', e.target.value)}
                                                className="bg-neutral-900/80 border-neutral-800 focus:border-blue-500/50 rounded-xl h-11 md:h-12 transition-all font-mono text-xs md:text-sm"
                                            />
                                            {row.gift_card && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedGiftCard(row.gift_card || '');
                                                        setIsBarcodeOpen(true);
                                                    }}
                                                    className="shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20"
                                                >
                                                    <Barcode className="w-5 h-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeRow(row.id)}
                                        className="absolute -top-2.5 -right-2.5 md:top-3 md:right-3 p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-400 hover:border-red-500/30 rounded-full md:rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-xl md:shadow-none z-20"
                                        title="移除此列"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-neutral-800/50 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addRow}
                                className="w-full md:w-auto border-neutral-800 hover:bg-neutral-800 hover:text-white rounded-xl h-11 md:h-12 px-6 font-bold transition-all text-xs md:text-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" /> 增添一行
                            </Button>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Button
                                    type="submit"
                                    disabled={loading || rows.length === 0}
                                    className="flex-1 md:flex-none md:min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl h-11 md:h-12 font-black shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-xs md:text-sm"
                                >
                                    {loading ? '提交中...' : '確認並執行批次扣款'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Barcode Modal */}
            <Dialog open={isBarcodeOpen} onOpenChange={setIsBarcodeOpen}>
                <DialogContent className="w-[92vw] max-w-[400px] bg-neutral-900/95 backdrop-blur-3xl text-neutral-50 border-neutral-800/80 rounded-2xl shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Barcode className="w-6 h-6 text-blue-500" /> 禮品卡條碼
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl mt-4 shadow-inner">
                        <img
                            src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(selectedGiftCard)}&code=Code128&translate-esc=on`}
                            alt="Gift Card Barcode"
                            className="max-w-full"
                        />
                        <div className="mt-4 text-neutral-950 font-mono font-black tracking-widest text-lg">
                            {selectedGiftCard}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* History Table */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
                    <h3 className="text-xl md:text-2xl font-bold text-neutral-100 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-neutral-800 rounded-lg">
                            <HistoryIcon className="w-5 h-5 text-neutral-400" />
                        </div>
                        歷史加值紀錄
                    </h3>
                </div>

                <Card className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 shadow-2xl overflow-hidden rounded-2xl md:rounded-3xl">
                    <div className="overflow-x-auto min-w-full custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-neutral-950/40">
                                <TableRow className="border-neutral-800/60 hover:bg-transparent">
                                    <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">日期</TableHead>
                                    <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">帳號</TableHead>
                                    <TableHead className="text-right text-neutral-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">餘額變動</TableHead>
                                    <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] md:text-xs hidden md:table-cell">變動後餘額</TableHead>
                                    <TableHead className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] md:text-xs min-w-[120px]">備註</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!history ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-neutral-500 italic text-sm">讀取中...</TableCell>
                                    </TableRow>
                                ) : historyData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-neutral-500 italic text-sm">暫無加值紀錄</TableCell>
                                    </TableRow>
                                ) : (
                                    historyData.map((item, idx) => (
                                        <TableRow key={idx} className="border-neutral-800/40 hover:bg-neutral-800/30 transition-colors group">
                                            <TableCell className="font-mono text-[10px] md:text-xs text-neutral-400">
                                                {format(new Date(item.created_at), 'yyyy/MM/dd HH:mm')}
                                            </TableCell>
                                            <TableCell className="font-bold text-neutral-200 text-xs md:text-sm">
                                                <div className="max-w-[100px] md:max-w-none truncate" title={item.apple_id}>
                                                    {item.apple_id?.split('@')[0]}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-black text-xs md:text-sm font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                                                    +{item.amount_changed.toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-[10px] md:text-xs text-neutral-500 hidden md:table-cell">
                                                {item.balance_after.toFixed(2)} {item.currency}
                                            </TableCell>
                                            <TableCell className="text-[10px] md:text-xs text-neutral-500 font-medium max-w-[120px] md:max-w-none truncate">
                                                {item.memo}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-4 pb-6">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-neutral-400 font-mono text-sm">
                            第 {currentPage} 頁，共 {totalPages} 頁
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
