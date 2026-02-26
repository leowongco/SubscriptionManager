import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { PlusCircle, Trash2, CreditCard, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function Recharge() {
    const { data: accounts } = useSWR<Account[]>('accounts', api.getAccounts);

    const createEmptyRow = (): RechargeRow => ({
        id: crypto.randomUUID(),
        account_id: '',
        amount: '',
        gift_card: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [rows, setRows] = useState<RechargeRow[]>([createEmptyRow()]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        } catch (error) {
            console.error(error);
            alert('處理加值時發生錯誤，請稍後再試。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <CreditCard className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-50">批次禮品卡加值中心</h2>
                    <p className="text-neutral-400 mt-1">同時為多個不同的 Apple ID 執行禮品卡序號自動加值與帳目記錄。</p>
                </div>
            </div>

            <Card className="bg-neutral-900 border-neutral-800 shadow-xl">
                <CardHeader className="border-b border-neutral-800 pb-4">
                    <CardTitle className="text-lg">禮品卡加值表單</CardTitle>
                    <CardDescription>請為每張禮品卡填寫詳細資訊，您可以動態新增多筆輸入列。</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {rows.map((row) => (
                                <div key={row.id} className="grid grid-cols-12 gap-4 items-end bg-neutral-950/50 p-4 rounded-lg border border-neutral-800/50 relative group">

                                    {/* Account Select */}
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <Label className="text-xs text-neutral-400 uppercase tracking-wider">Apple ID 帳號</Label>
                                        <Select value={row.account_id} onValueChange={(v) => updateRow(row.id, 'account_id', v)}>
                                            <SelectTrigger className="bg-neutral-900 border-neutral-800">
                                                <SelectValue placeholder="請選擇帳號" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                                                {accounts?.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        {acc.apple_id} <span className="text-neutral-500">({acc.currency})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-2">
                                        <Label className="text-xs text-neutral-400 uppercase tracking-wider">加值日期</Label>
                                        <Input
                                            type="date"
                                            value={row.date}
                                            onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                            className="bg-neutral-900 border-neutral-800"
                                            required
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-2">
                                        <Label className="text-xs text-neutral-400 uppercase tracking-wider">金額額度</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="例: 500"
                                            value={row.amount}
                                            onChange={(e) => updateRow(row.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))}
                                            className="bg-neutral-900 border-neutral-800 font-mono"
                                            required
                                        />
                                    </div>

                                    {/* Gift Card */}
                                    <div className="col-span-12 md:col-span-4 space-y-2">
                                        <Label className="text-xs text-neutral-400 uppercase tracking-wider">禮品卡序號 / 備註</Label>
                                        <Input
                                            placeholder="XXXX-XXXX-XXXX-XXXX"
                                            value={row.gift_card}
                                            onChange={(e) => updateRow(row.id, 'gift_card', e.target.value)}
                                            className="bg-neutral-900 border-neutral-800 uppercase font-mono"
                                        />
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-12 md:col-span-1 flex justify-center pb-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRow(row.id)}
                                            disabled={rows.length === 1}
                                            className="text-neutral-500 hover:text-red-400 hover:bg-red-400/10"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center border-t border-neutral-800 pt-6">
                            <Button
                                type="button"
                                onClick={addRow}
                                variant="outline"
                                className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                新增輸入列
                            </Button>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8"
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
        </div>
    );
}
