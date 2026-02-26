import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
    id: string;
    name: string;
    base_price: number;
    currency: string;
    cycle: 'monthly' | 'yearly';
    next_price: number | null;
    effective_date: string | null;
}

export default function Services() {
    const { data: services, mutate } = useSWR<Service[]>('services', api.getServices);
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);

    const [formData, setFormData] = useState<Partial<Service>>({
        name: '',
        base_price: 0,
        currency: 'HKD',
        cycle: 'monthly',
        next_price: null,
        effective_date: null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            await api.updateService({ ...formData, id: editing.id });
        } else {
            await api.createService(formData);
        }
        setIsOpen(false);
        setEditing(null);
        mutate();
    };

    const handleDelete = async (id: string) => {
        if (confirm('確定要刪除此服務嗎？')) {
            await api.deleteService(id);
            mutate();
        }
    };

    const openEdit = (service: Service) => {
        setEditing(service);
        setFormData(service);
        setIsOpen(true);
    };

    const openNew = () => {
        setEditing(null);
        setFormData({ name: '', base_price: 0, currency: 'HKD', cycle: 'monthly', next_price: null, effective_date: null });
        setIsOpen(true);
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-cyan-900/20 to-neutral-900 border border-neutral-800/80 p-8 shadow-2xl backdrop-blur-xl flex justify-between items-center">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">服務與定價維護</h2>
                    <p className="text-neutral-400 mt-2 text-sm font-medium">管理訂閱服務及未來價格調整計畫，精準掌控成本。</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew} className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl h-12 px-6 shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02]">
                            <Plus className="w-5 h-5 mr-2" />
                            新增服務
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px] bg-neutral-900/90 backdrop-blur-3xl text-neutral-50 border-neutral-800/80 rounded-2xl shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{editing ? '編輯服務' : '新增服務'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">服務名稱</Label>
                                <Input id="name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="bg-neutral-950/50 border-neutral-800 focus:border-blue-500/50 rounded-xl h-12 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="base_price" className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">基礎價格</Label>
                                <Input id="base_price" type="number" step="0.01" value={formData.base_price || ''} onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) })} required className="bg-neutral-950/50 border-neutral-800 focus:border-blue-500/50 rounded-xl h-12 transition-all font-mono" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">幣種</Label>
                                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                        <SelectTrigger className="bg-neutral-950/50 border-neutral-800 focus:ring-blue-500/50 rounded-xl h-12 transition-all"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50 rounded-xl shadow-2xl">
                                            {['HKD', 'TWD', 'TRY', 'ARS', 'USD'].map(c => (
                                                <SelectItem key={c} value={c} className="cursor-pointer hover:bg-neutral-800 rounded-lg">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">計費週期</Label>
                                    <Select value={formData.cycle} onValueChange={(v: 'monthly' | 'yearly') => setFormData({ ...formData, cycle: v })}>
                                        <SelectTrigger className="bg-neutral-950/50 border-neutral-800 focus:ring-blue-500/50 rounded-xl h-12 transition-all"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50 rounded-xl shadow-2xl">
                                            <SelectItem value="monthly" className="cursor-pointer hover:bg-neutral-800 rounded-lg">每月 (Monthly)</SelectItem>
                                            <SelectItem value="yearly" className="cursor-pointer hover:bg-neutral-800 rounded-lg">每年 (Yearly)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="border border-neutral-800/60 bg-neutral-950/30 p-5 rounded-2xl space-y-4">
                                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                    未來價格調整 (選填)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="next_price" className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">新價格</Label>
                                        <Input id="next_price" type="number" step="0.01" value={formData.next_price || ''} onChange={e => setFormData({ ...formData, next_price: e.target.value ? parseFloat(e.target.value) : null })} className="bg-neutral-900 border-neutral-800/50 focus:border-blue-500/50 rounded-xl h-11 transition-all font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="effective_date" className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">生效日期</Label>
                                        <Input id="effective_date" type="date" value={formData.effective_date?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, effective_date: e.target.value })} className="bg-neutral-900 border-neutral-800/50 focus:border-blue-500/50 rounded-xl h-11 transition-all" />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl h-12 text-md font-bold text-white shadow-lg transition-all">{editing ? '儲存變更' : '建立服務'}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-3xl border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500"></div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-neutral-950/60">
                            <TableRow className="border-neutral-800/80 hover:bg-transparent">
                                <TableHead className="text-neutral-400 font-semibold tracking-wider pl-6 pt-4 pb-4">服務名稱</TableHead>
                                <TableHead className="text-neutral-400 font-semibold tracking-wider">當前價格</TableHead>
                                <TableHead className="text-neutral-400 font-semibold tracking-wider">週期</TableHead>
                                <TableHead className="text-neutral-400 font-semibold tracking-wider">未來調整計畫</TableHead>
                                <TableHead className="text-right text-neutral-400 font-semibold tracking-wider pr-6">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services === undefined && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-neutral-500">
                                        <div className="animate-pulse">讀取服務資料中...</div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {services?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-neutral-500">尚未設定任何服務，點擊「新增服務」開始。</TableCell>
                                </TableRow>
                            )}
                            {services?.map((service) => (
                                <TableRow key={service.id} className="border-neutral-800/60 hover:bg-neutral-800/40 transition-colors group">
                                    <TableCell className="font-bold text-neutral-200 pl-6">{service.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-neutral-500 text-xs">{service.currency}</span>
                                            <span className="font-mono text-lg font-bold text-neutral-100 drop-shadow-sm">{service.base_price.toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold shadow-inner ${service.cycle === 'yearly'
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                            {service.cycle === 'yearly' ? '每年 (Yearly)' : '每月 (Monthly)'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {service.next_price && service.effective_date ? (
                                            <div className="flex flex-col gap-1 p-2 bg-neutral-950/50 rounded-lg border border-neutral-800/50 inline-block">
                                                <span className="text-orange-400 font-black font-mono text-sm leading-none flex items-center gap-1">
                                                    <span className="opacity-50 text-xs font-sans">➔</span> {service.currency} {service.next_price.toFixed(2)}
                                                </span>
                                                <span className="text-neutral-500 text-[10px] uppercase font-semibold tracking-wider">
                                                    生效日: {new Date(service.effective_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-600 block pl-4">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(service)} className="h-9 w-9 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="h-9 w-9 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
