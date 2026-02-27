import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Plus, UserPlus, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react';
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

    const getTodayString = () => new Date().toISOString().split('T')[0];

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
        <div className="space-y-6 md:space-y-10 max-w-7xl mx-auto pb-10 px-0 sm:px-4">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-emerald-900/40 via-teal-900/20 to-neutral-900 border border-neutral-800/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 md:w-64 h-48 md:h-64 bg-emerald-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 md:w-64 h-48 md:h-64 bg-teal-500/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">訂閱關係對應</h2>
                    <p className="text-neutral-400 mt-2 text-xs md:text-sm font-medium">管理 Apple ID、獨立服務、與成員的繳費關係。</p>
                </div>

                <Dialog open={isAccountOpen} onOpenChange={setIsAccountOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setAccountForm({ balance: 0, start_date: getTodayString() })} className="w-full md:w-auto relative z-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl h-11 md:h-12 px-6 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02]">
                            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                            新增帳號
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[92vw] max-w-[450px] bg-neutral-900/90 backdrop-blur-3xl text-neutral-50 border-neutral-800/80 rounded-2xl shadow-2xl p-5 md:p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{accountForm.id ? '編輯帳號' : '新增帳號'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAccountSubmit} className="space-y-4 md:space-y-5 pt-4">
                            <div className="space-y-1.5 md:space-y-2">
                                <Label className="text-[10px] md:text-sm text-neutral-400 font-semibold uppercase tracking-wider">Google 帳號 (家庭管理員)</Label>
                                <Input value={accountForm.google_account || ''} onChange={e => setAccountForm({ ...accountForm, google_account: e.target.value })} className="bg-neutral-950/50 border-neutral-800 focus:border-emerald-500/50 rounded-xl h-11 md:h-12 transition-all font-mono text-xs md:text-sm" required />
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <Label className="text-[10px] md:text-sm text-neutral-400 font-semibold uppercase tracking-wider">Apple ID (付款帳號)</Label>
                                <Input value={accountForm.apple_id || ''} onChange={e => setAccountForm({ ...accountForm, apple_id: e.target.value })} className="bg-neutral-950/50 border-neutral-800 focus:border-emerald-500/50 rounded-xl h-11 md:h-12 transition-all font-mono text-xs md:text-sm" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 md:gap-5">
                                <div className="space-y-1.5 md:space-y-2">
                                    <Label className="text-[10px] md:text-sm text-neutral-400 font-semibold uppercase tracking-wider">訂閱服務</Label>
                                    <Select value={accountForm.service_id} onValueChange={v => setAccountForm({ ...accountForm, service_id: v })}>
                                        <SelectTrigger className="bg-neutral-950/50 border-neutral-800 focus:ring-emerald-500/50 rounded-xl h-11 md:h-12 transition-all text-xs"><SelectValue placeholder="選擇..." /></SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50 rounded-xl shadow-2xl">
                                            {services?.map(s => <SelectItem key={s.id} value={s.id} className="cursor-pointer hover:bg-neutral-800 rounded-lg text-xs md:text-sm">{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <Label className="text-[10px] md:text-sm text-neutral-400 font-semibold uppercase tracking-wider">初始餘額</Label>
                                    <Input type="number" step="0.01" value={accountForm.balance || ''} onChange={e => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) })} className="bg-neutral-950/50 border-neutral-800 focus:border-emerald-500/50 rounded-xl h-11 md:h-12 transition-all font-mono text-xs md:text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <Label className="text-[10px] md:text-sm text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-emerald-500" /> 每月扣款始日
                                </Label>
                                <Input type="date" value={accountForm.start_date?.split('T')[0] || ''} onChange={e => setAccountForm({ ...accountForm, start_date: e.target.value })} className="bg-neutral-950/50 border-neutral-800 focus:border-emerald-500/50 rounded-xl h-11 md:h-12 transition-all text-xs" required />
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl h-11 md:h-12 text-sm md:text-md font-bold text-white shadow-lg transition-all transform hover:scale-[1.02]">儲存帳號</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {!accounts && <div className="text-neutral-500 text-center animate-pulse">讀取關係資料中...</div>}

            {Object.entries(groupedAccounts).map(([googleAccount, groupAccounts]) => (
                <div key={googleAccount} className="space-y-4 md:space-y-6">
                    <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-3">
                        <h3 className="text-xl md:text-2xl font-bold text-neutral-100 tracking-tight drop-shadow-sm truncate">
                            {googleAccount}
                        </h3>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-bold tracking-wider text-[10px]">群組</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                        {groupAccounts.map(account => {
                            const serviceName = services?.find(s => s.id === account.service_id)?.name || '未指定服務';
                            return (
                                <Card key={account.id} className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/60 shadow-xl overflow-hidden relative group hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>

                                    <CardHeader className="pb-4 relative z-10 border-b border-neutral-800/50 bg-neutral-950/40 px-5">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0 pr-2">
                                                <CardTitle className="text-lg md:text-xl font-bold text-white flex items-center gap-2 drop-shadow-md truncate">
                                                    {account.apple_id}
                                                </CardTitle>
                                                <CardDescription className="text-emerald-400 font-medium mt-1 flex items-center gap-1.5 text-xs">
                                                    <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                                    {serviceName}
                                                </CardDescription>
                                            </div>
                                            <div className="text-right flex flex-col items-end shrink-0">
                                                <div className="text-[10px] text-neutral-500 font-semibold tracking-wider font-mono">{account.currency || '$'}</div>
                                                <div className="text-xl md:text-2xl font-black text-neutral-100 font-mono drop-shadow-sm cursor-pointer hover:text-emerald-400 transition-colors" title="Click to update balance" onClick={() => {
                                                    const newBal = prompt('Update Balance:', account.balance.toString());
                                                    if (newBal !== null) {
                                                        api.updateAccount({ ...account, balance: parseFloat(newBal) }).then(() => mutateAccounts());
                                                    }
                                                }}>
                                                    {typeof account.balance === 'number' ? account.balance.toFixed(2) : '0.00'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex gap-2 items-center text-[10px] text-neutral-500 font-medium">
                                            <span className="bg-neutral-800 px-1.5 py-0.5 rounded">每月 {account.start_date ? new Date(account.start_date).getDate() : '?'} 日扣款</span>
                                            <span className="bg-emerald-500/5 text-emerald-500/80 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                                {typeof account.balance === 'number' && typeof account.base_price === 'number' && account.base_price > 0
                                                    ? (account.balance / account.base_price).toFixed(1)
                                                    : '0.0'} 個月可用
                                            </span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex-1 px-5 py-3 relative z-10 bg-neutral-900/20">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">管理成員</span>
                                            <Dialog open={isMemberOpen && selectedAccountId === account.id} onOpenChange={(open) => {
                                                if (!open) setIsMemberOpen(false);
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => {
                                                        setSelectedAccountId(account.id);
                                                        setMemberForm({ payment_status: 0 });
                                                        setIsMemberOpen(true);
                                                    }}>
                                                        <UserPlus className="w-3.5 h-3.5 mr-1" /> 新增
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="w-[92vw] max-w-[400px] bg-neutral-900/90 backdrop-blur-3xl border-neutral-800/80 text-neutral-50 rounded-2xl shadow-2xl p-5 md:p-6">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-bold">新增成員</DialogTitle>
                                                    </DialogHeader>
                                                    <form onSubmit={handleMemberSubmit} className="space-y-4 md:space-y-5 pt-4">
                                                        <div className="space-y-1.5 md:space-y-2">
                                                            <Label className="text-[10px] md:text-xs text-neutral-400 font-semibold uppercase tracking-wider">電子郵件 (Email)</Label>
                                                            <Input value={memberForm.email || ''} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} required className="bg-neutral-950/50 border-neutral-800 focus:border-emerald-500/50 rounded-xl h-11 md:h-12 transition-all font-mono text-xs md:text-sm" />
                                                        </div>
                                                        <div className="space-y-1.5 md:space-y-2">
                                                            <Label className="text-[10px] md:text-xs text-neutral-400 font-semibold uppercase tracking-wider">備註 (選填)</Label>
                                                            <Input value={memberForm.memo || ''} onChange={e => setMemberForm({ ...memberForm, memo: e.target.value })} className="bg-neutral-950/50 border-neutral-800 focus:border-emerald-500/50 rounded-xl h-11 md:h-12 transition-all text-xs" />
                                                        </div>
                                                        <div className="flex items-center space-x-2 pt-2">
                                                            <input
                                                                type="checkbox"
                                                                id="payment_status"
                                                                checked={memberForm.payment_status === 1}
                                                                onChange={e => setMemberForm({ ...memberForm, payment_status: e.target.checked ? 1 : 0 })}
                                                                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-neutral-900 cursor-pointer accent-emerald-500"
                                                            />
                                                            <Label htmlFor="payment_status" className="cursor-pointer font-medium text-xs md:text-sm text-neutral-300 hover:text-white transition-colors">初始狀態為「已繳費」</Label>
                                                        </div>
                                                        <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl h-11 md:h-12 text-sm md:text-md font-bold text-white shadow-lg transition-all transform hover:scale-[1.02]">儲存成員</Button>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                            {members?.filter(m => m.account_id === account.id).length === 0 && (
                                                <div className="text-[10px] text-neutral-500 text-center py-4 bg-neutral-950/30 rounded-lg border border-neutral-800/50 font-medium">目前無附屬成員</div>
                                            )}
                                            {members?.filter(m => m.account_id === account.id).map(member => (
                                                <div key={member.id} className="group flex justify-between items-center py-2 px-3 bg-neutral-950/50 rounded-lg border border-neutral-800/50 hover:border-emerald-500/30 hover:bg-neutral-900/80 transition-all">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <button onClick={() => togglePaymentStatus(member)} className={`flex-shrink-0 transition-colors ${member.payment_status ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-neutral-600 hover:text-neutral-500'}`}>
                                                            {member.payment_status ? <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" /> : <Circle className="w-5 h-5" />}
                                                        </button>
                                                        <div className="flex flex-col truncate">
                                                            <span className="text-xs font-bold text-neutral-200 truncate font-mono tracking-tighter">{member.email}</span>
                                                            {member.memo && <span className="text-[9px] text-neutral-500 truncate">{member.memo}</span>}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteMember(member.id)} className="opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all p-1.5 shrink-0 ml-1">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-4 border-t border-neutral-800/50 flex justify-between bg-neutral-950/60 backdrop-blur-md relative z-10">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setAccountForm({ ...account });
                                            setIsAccountOpen(true);
                                        }} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-[10px] md:text-xs font-bold tracking-wider">
                                            編輯設定
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => deleteAccount(account.id)} className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] md:text-xs font-bold tracking-wider">
                                            刪除帳號組
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ))
            }
        </div >
    );
}
