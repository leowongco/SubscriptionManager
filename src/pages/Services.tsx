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
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-neutral-900 p-6 border border-neutral-800 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-50">服務與定價維護</h2>
                    <p className="text-neutral-400 mt-1">管理訂閱服務及未來價格調整計畫。</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            新增服務
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-neutral-50 border-neutral-800">
                        <DialogHeader>
                            <DialogTitle>{editing ? '編輯服務' : '新增服務'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">服務名稱</Label>
                                <Input id="name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="bg-neutral-950 border-neutral-800" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="base_price">基礎價格</Label>
                                <Input id="base_price" type="number" step="0.01" value={formData.base_price || ''} onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) })} required className="bg-neutral-950 border-neutral-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>幣種</Label>
                                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                        <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                                            <SelectItem value="HKD">HKD</SelectItem>
                                            <SelectItem value="TWD">TWD</SelectItem>
                                            <SelectItem value="TRY">TRY</SelectItem>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>計費週期</Label>
                                    <Select value={formData.cycle} onValueChange={(v: 'monthly' | 'yearly') => setFormData({ ...formData, cycle: v })}>
                                        <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-50">
                                            <SelectItem value="monthly">每月 (Monthly)</SelectItem>
                                            <SelectItem value="yearly">每年 (Yearly)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="border-t border-neutral-800 pt-4 mt-2 space-y-4">
                                <h4 className="text-sm font-medium text-blue-400">未來價格調整 (選填)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="next_price">新價格</Label>
                                        <Input id="next_price" type="number" step="0.01" value={formData.next_price || ''} onChange={e => setFormData({ ...formData, next_price: e.target.value ? parseFloat(e.target.value) : null })} className="bg-neutral-950 border-neutral-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="effective_date">生效日期</Label>
                                        <Input id="effective_date" type="date" value={formData.effective_date?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, effective_date: e.target.value })} className="bg-neutral-950 border-neutral-800" />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">{editing ? '儲存變更' : '建立服務'}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-lg">
                <Table>
                    <TableHeader className="bg-neutral-950/50">
                        <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
                            <TableHead className="text-neutral-400">服務名稱</TableHead>
                            <TableHead className="text-neutral-400">當前價格</TableHead>
                            <TableHead className="text-neutral-400">週期</TableHead>
                            <TableHead className="text-neutral-400">未來調整計畫</TableHead>
                            <TableHead className="text-right text-neutral-400">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!services && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">讀取資料中...</TableCell>
                            </TableRow>
                        )}
                        {services?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">尚未設定任何服務。</TableCell>
                            </TableRow>
                        )}
                        {services?.map((service) => (
                            <TableRow key={service.id} className="border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>
                                    <span className="text-neutral-300">{service.currency}</span> <span className="font-bold">{service.base_price.toFixed(2)}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-semibold text-neutral-300">
                                        {service.cycle}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {service.next_price && service.effective_date ? (
                                        <div className="flex flex-col text-sm">
                                            <span className="text-orange-400 font-medium">➔ {service.currency} {service.next_price.toFixed(2)}</span>
                                            <span className="text-neutral-500 text-xs">生效日: {new Date(service.effective_date).toLocaleDateString()}</span>
                                        </div>
                                    ) : (
                                        <span className="text-neutral-600">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(service)} className="text-neutral-400 hover:text-blue-400 hover:bg-blue-400/10">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)} className="text-neutral-400 hover:text-red-400 hover:bg-red-400/10">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
