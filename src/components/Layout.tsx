import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, CreditCard, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const navigation = [
        { name: '綜合儀表板', href: '/', icon: Home },
        { name: '訂閱關係對應', href: '/mapping', icon: Users },
        { name: '服務與定價管理', href: '/services', icon: Settings },
        { name: '批次禮品卡加值', href: '/recharge', icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 flex">
            {/* Sidebar (Desktop) */}
            <div className="w-64 bg-neutral-900 border-r border-neutral-800 hidden md:flex flex-col flex-shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tight">
                        Subscription Master
                    </h1>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold',
                                    isActive
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800'
                                )}
                            >
                                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-6 border-t border-neutral-800/50 bg-neutral-950/20">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-black text-center">Version 1.0 Pro Max</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50">
                    <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Sub Master
                    </h1>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-neutral-400 hover:text-white transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Mobile Drawer Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-[100] md:hidden">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-0 bottom-0 w-72 bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="p-6 flex justify-between items-center border-b border-neutral-800/50">
                                <h2 className="font-black text-neutral-300 tracking-wider">選單</h2>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-neutral-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="flex-1 px-4 py-6 space-y-3">
                                {navigation.map((item) => {
                                    const isActive = location.pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 text-sm font-bold',
                                                isActive
                                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                                    : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800'
                                            )}
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="p-6 border-t border-neutral-800/50 bg-neutral-950/20">
                                <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-black text-center">Version 1.0 Pro Max</p>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
