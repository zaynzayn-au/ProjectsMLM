import { Bell, Check, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';

interface Props {
    onClose: () => void;
}

export default function NotificationPanel({ onClose }: Props) {
    const { notifications, loadNotifications } = useApp();

    const handleMarkRead = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        await window.api.markNotificationRead(id);
        await loadNotifications();
    };

    const handleClear = async () => {
        await window.api.clearNotifications();
        await loadNotifications();
    };

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 z-50 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Bell className="size-4 text-blue-600" />
                        <span className="text-sm font-bold text-slate-900">通知</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {notifications.length > 0 && (
                            <button onClick={handleClear} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="清除全部">
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="size-3.5" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                            <Bell className="size-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">暂无通知</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors flex gap-3 ${n.read ? 'opacity-60' : ''}`}
                            >
                                <div className={`size-2 rounded-full shrink-0 mt-1.5 ${n.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                    <p className="text-[9px] text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                                </div>
                                {!n.read && (
                                    <button onClick={(e) => handleMarkRead(n.id, e)} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors shrink-0" title="标记已读">
                                        <Check className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </>
    );
}
