import { useState } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import NotificationPanel from './NotificationPanel';

export default function Topbar() {
    const { searchQuery, setSearchQuery, unreadCount } = useApp();
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    return (
        <header
            className="flex items-center justify-between px-8 py-5 border-b border-slate-200/50 bg-white/30 backdrop-blur-md sticky top-0 z-40 shrink-0 drag-region"
        >
            <div className="no-drag">
                <h2 className="text-xl font-black tracking-tighter text-slate-900">ProjectsMLM</h2>
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-blue-600/60">
                    Real-time Project Intelligence
                </p>
            </div>

            <div className="flex items-center gap-4 no-drag">
                {/* Search */}
                <div className={`flex items-center bg-white/80 border rounded-full px-3.5 py-1.5 gap-2 transition-all duration-200 ${searchFocused ? 'border-blue-300 shadow-md shadow-blue-100/50 w-64' : 'border-slate-200 shadow-sm w-48'}`}>
                    <Search className="size-3.5 text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="搜索项目..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="bg-transparent border-none outline-none text-xs font-medium text-slate-700 placeholder:text-slate-400 w-full"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                            <X className="size-3" />
                        </button>
                    )}
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="size-9 flex items-center justify-center rounded-full hover:bg-slate-200/50 transition-colors relative"
                    >
                        <Bell className="size-[18px] text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 size-2 bg-blue-600 rounded-full animate-pulse" />
                        )}
                    </button>

                    {showNotifications && (
                        <NotificationPanel onClose={() => setShowNotifications(false)} />
                    )}
                </div>

                {/* Avatar */}
                <div className="size-9 rounded-full border-2 border-blue-600/20 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">U</span>
                </div>
            </div>
        </header>
    );
}
