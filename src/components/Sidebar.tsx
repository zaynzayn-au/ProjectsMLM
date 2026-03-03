import { LayoutDashboard, Activity, Settings, Layers } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { ViewType } from '../types';

const NAV_ITEMS: { icon: any; view: ViewType; label: string }[] = [
    { icon: LayoutDashboard, view: 'dashboard', label: 'Dashboard' },
    { icon: Activity, view: 'activity', label: 'Activity' },
    { icon: Settings, view: 'settings', label: 'Settings' },
];

export default function Sidebar() {
    const { view, setView, setSelectedProjectId } = useApp();

    const handleNavClick = (v: ViewType) => {
        setView(v);
        if (v !== 'dashboard') setSelectedProjectId(null);
    };

    return (
        <nav className="w-[72px] border-r border-slate-200/50 bg-white/50 backdrop-blur-xl flex flex-col items-center py-6 gap-6 z-50 shrink-0">
            {/* Top spacing for Mac traffic lights */}
            <div className="h-6 shrink-0" />

            {/* Logo */}
            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 mb-2">
                <Layers className="size-5" />
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-3 w-full items-center">
                {NAV_ITEMS.map(({ icon: Icon, view: v, label }) => (
                    <button
                        key={v}
                        onClick={() => handleNavClick(v)}
                        title={label}
                        className={`size-11 rounded-xl flex items-center justify-center transition-all duration-200
              ${view === v
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                            }`}
                    >
                        <Icon className="size-[18px]" />
                    </button>
                ))}
            </div>

            {/* Version badge at bottom */}
            <div className="mt-auto">
                <span className="text-[8px] font-bold text-slate-300 tracking-wider">v1.0</span>
            </div>
        </nav>
    );
}
