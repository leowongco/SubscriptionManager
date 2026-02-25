import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Relationship Mapping', href: '/mapping', icon: Users },
        { name: 'Service Manager', href: '/services', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-neutral-900 border-r border-neutral-800 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
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
                                    'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium',
                                    isActive
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="md:hidden h-16 border-b border-neutral-800 flex items-center px-4 bg-neutral-900">
                    <h1 className="text-lg font-bold">Subscription Master</h1>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
