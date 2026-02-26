import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Plus, UserPlus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Account {
    id: string;
    apple_id: string;
    google_account: string;
    balance: number;
    service_id: string;
    service_name: string;
    base_price: number;
    currency: string;
    cycle: string;
    start_date?: string;
    last_sync_date: string;
}

interface Member {
    id: string;
    account_id: string;
    email: string;
    payment_status: number;
    memo: string | null;
}

export default function Mapping() {
    const { data: accounts, mutate: mutateAccounts } = useSWR<Account[]>('accounts', api.getAccounts);
    const { data: members, mutate: mutateMembers } = useSWR<Member[]>('members', api.getMembers);
    const { data: services } = useSWR<any[]>('services', api.getServices);

    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [accountForm, setAccountForm] = useState<Partial<Account>>({});

    const [isMemberOpen, setIsMemberOpen] = useState(false);
    const [memberForm, setMemberForm] = useState<Partial<Member>>({});
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    // Group accounts by google_account
    const groupedAccounts = accounts?.reduce((acc, account) => {
        const group = account.google_account || 'Unassigned';
        if (!acc[group]) acc[group] = [];
        acc[group].push(account);
        return acc;
    }, {} as Record<string, Account[]>) || {};

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (accountForm.id) {
            await api.updateAccount(accountForm);
        } else {
            await api.createAccount(accountForm);
        }
        setIsAccountOpen(false);
        mutateAccounts();
    };

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (memberForm.id) {
            await api.updateMember({ ...memberForm, account_id: selectedAccountId });
        } else {
            await api.createMember({ ...memberForm, account_id: selectedAccountId });
        }
        setIsMemberOpen(false);
        mutateMembers();
    };

    const togglePaymentStatus = async (member: Member) => {
        await api.updateMember({ ...member, payment_status: member.payment_status ? 0 : 1 });
        mutateMembers();
    };

    const deleteAccount = async (id: string) => {
        if (confirm('確定要刪除此帳號及所有關聯成員嗎？')) {
            await api.deleteAccount(id);
            mutateAccounts();
            mutateMembers();
        }
    };

    const deleteMember = async (id: string) => {
        if (confirm('確定要移除此成員嗎？')) {
            await api.deleteMember(id);
            mutateMembers();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-neutral-900 p-6 border border-neutral-800 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-50">訂閱關係與帳戶</h2>
                    <p className="text-neutral-400 mt-1">管理 Google 帳號、Apple ID 與群組成員列表。</p>
                </div>

                <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setAccountForm({ balance: 0, start_date: new Date().toISOString().split('T')[0] })} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            新增帳號
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-neutral-50">
                        <DialogHeader>
                            <DialogTitle>新增/編輯帳號</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAccountSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Google 帳號 (家庭管理員)</Label>
                                <Input value={accountForm.google_account || ''} onChange={e => setAccountForm({ ...accountForm, google_account: e.target.value })} className="bg-neutral-950 border-neutral-800" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Apple ID (付款帳號)</Label>
                                <Input value={accountForm.apple_id || ''} onChange={e => setAccountForm({ ...accountForm, apple_id: e.target.value })} className="bg-neutral-950 border-neutral-800" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>訂閱服務</Label>
                                    <Select value={accountForm.service_id} onValueChange={v => setAccountForm({ ...accountForm, service_id: v })}>
                                        <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue placeholder="請選擇..." /></SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800">
                                            {services?.map(s => <SelectItem key={s.id} value={s.id} className="text-neutral-50">{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>初始餘額</Label>
                                    <Input type="number" step="0.01" value={accountForm.balance || ''} onChange={e => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) })} className="bg-neutral-950 border-neutral-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>開始扣款日 (每月週期)</Label>
                                <Input type="date" value={accountForm.start_date?.split('T')[0] || ''} onChange={e => setAccountForm({ ...accountForm, start_date: e.target.value })} className="bg-neutral-950 border-neutral-800" required />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">儲存帳號</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {!accounts && <div className="text-neutral-500">讀取關係資料中...</div>}

            {Object.entries(groupedAccounts).map(([googleAccount, groupAccounts]) => (
                <div key={googleAccount} className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-2">
                        <h3 className="text-xl font-semibold text-neutral-200">
                            {googleAccount}
                        </h3>
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10">群組分類</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {groupAccounts.map(account => (
                            <Card key={account.id} className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden flex flex-col">
                                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {account.apple_id}
                                            </CardTitle>
                                            <CardDescription className="text-neutral-400 mt-1">
                                                Service: {account.service_name || 'None'}
                                            </CardDescription>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-2xl font-bold font-mono text-neutral-50 flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors" title="Click to update balance" onClick={() => {
                                                const newBal = prompt('Update Balance:', account.balance.toString());
                                                if (newBal !== null) {
                                                    api.updateAccount({ ...account, balance: parseFloat(newBal) }).then(() => mutateAccounts());
                                                }
                                            }}>
                                                <span className="text-sm font-normal text-neutral-500">{account.currency || '$'}</span>
                                                {account.balance.toFixed(2)}
                                            </div>
                                            <span className="text-xs flex gap-2 items-center text-neutral-500 mt-0.5 whitespace-nowrap overflow-hidden">
                                                <span className="bg-neutral-800 px-1 py-0.5 rounded text-[10px]">每月 {account.start_date ? new Date(account.start_date).getDate() : '?'} 日扣款</span>
                                                {(account.balance / (account.base_price || 1)).toFixed(1)} 個月可用
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 px-4 py-2 border-t border-neutral-800/50 bg-neutral-950/20">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">管理成員</span>
                                        <Dialog open={isMemberOpen && selectedAccountId === account.id} onOpenChange={(open) => {
                                            if (!open) setIsMemberOpen(false);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-7 px-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10" onClick={() => {
                                                    setSelectedAccountId(account.id);
                                                    setMemberForm({ payment_status: 0 });
                                                    setIsMemberOpen(true);
                                                }}>
                                                    <UserPlus className="w-3 h-3 mr-1" /> 新增
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[400px] bg-neutral-900 border-neutral-800 text-neutral-50">
                                                <DialogHeader>
                                                    <DialogTitle>新增成員</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleMemberSubmit} className="space-y-4 pt-4">
                                                    <div className="space-y-2">
                                                        <Label>電子郵件 (Email)</Label>
                                                        <Input value={memberForm.email || ''} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} required className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>備註 (選填)</Label>
                                                        <Input value={memberForm.memo || ''} onChange={e => setMemberForm({ ...memberForm, memo: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                                    </div>
                                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">儲存成員</Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="space-y-2">
                                        {members?.filter(m => m.account_id === account.id).length === 0 && (
                                            <div className="text-sm text-neutral-600 italic py-2">目前沒有成員。</div>
                                        )}
                                        {members?.filter(m => m.account_id === account.id).map(member => (
                                            <div key={member.id} className="group flex justify-between items-center p-2 rounded-md hover:bg-neutral-800/60 transition-colors border border-transparent hover:border-neutral-700/50">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <button onClick={() => togglePaymentStatus(member)} className={`flex-shrink-0 transition-colors ${member.payment_status ? 'text-emerald-500 hover:text-emerald-400' : 'text-neutral-600 hover:text-neutral-500'}`}>
                                                        {member.payment_status ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                    </button>
                                                    <div className="flex flex-col truncate">
                                                        <span className="text-sm font-medium text-neutral-200 truncate">{member.email}</span>
                                                        {member.memo && <span className="text-xs text-neutral-500 truncate">{member.memo}</span>}
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteMember(member.id)} className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter className="p-3 border-t border-neutral-800 flex justify-end bg-neutral-900">
                                    <Button variant="ghost" size="sm" onClick={() => deleteAccount(account.id)} className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 text-xs">
                                        刪除帳號與成員
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
