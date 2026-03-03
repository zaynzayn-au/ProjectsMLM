import { useState, useEffect } from 'react';
import { Timer, Bell, FolderSearch, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';

export default function SettingsView() {
    const { settings, loadSettings, projects, loadProjects } = useApp();
    const [pollingEnabled, setPollingEnabled] = useState(false);
    const [pollingInterval, setPollingInterval] = useState(60);
    const [maxDepth, setMaxDepth] = useState(5);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setPollingEnabled(settings.polling_enabled === 'true');
        setPollingInterval(parseInt(settings.polling_interval || '60', 10));
        setMaxDepth(parseInt(settings.max_scan_depth || '5', 10));
        setNotificationsEnabled(settings.notifications_enabled === 'true');
    }, [settings]);

    const saveSetting = async (key: string, value: string) => {
        setSaving(true);
        await window.api.setSetting(key, value);
        await loadSettings();
        setSaving(false);
    };

    const togglePolling = async () => {
        const newVal = !pollingEnabled;
        setPollingEnabled(newVal);
        await saveSetting('polling_enabled', String(newVal));

        if (newVal) {
            for (const p of projects) await window.api.startPolling(p.id);
        } else {
            await window.api.stopAllPolling();
        }
    };

    const updateInterval = async (val: number) => {
        setPollingInterval(val);
        await saveSetting('polling_interval', String(val));
        // Restart polling with new interval
        if (pollingEnabled) {
            await window.api.stopAllPolling();
            for (const p of projects) await window.api.startPolling(p.id);
        }
    };

    const updateDepth = async (val: number) => {
        setMaxDepth(val);
        await saveSetting('max_scan_depth', String(val));
    };

    const toggleNotifications = async () => {
        const newVal = !notificationsEnabled;
        setNotificationsEnabled(newVal);
        await saveSetting('notifications_enabled', String(newVal));
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-slate-900 mb-1">设置</h1>
                <p className="text-slate-500 text-sm">Settings / Preferences</p>
            </div>

            <div className="space-y-6">
                {/* Polling Settings */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Timer className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900">自动轮询</h2>
                            <p className="text-xs text-slate-400">定时自动扫描项目文件夹的变化</p>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm font-medium text-slate-700">启用自动轮询</span>
                        <button onClick={togglePolling}
                            className={`w-11 h-6 rounded-full transition-colors relative ${pollingEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`size-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${pollingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Interval */}
                    <div className="py-3 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">轮询间隔</span>
                            <span className="text-sm font-black text-blue-600">{pollingInterval}秒</span>
                        </div>
                        <input type="range" min={10} max={300} step={10} value={pollingInterval}
                            onChange={e => updateInterval(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600" />
                        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                            <span>10秒</span><span>60秒 (推荐)</span><span>300秒</span>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex gap-2">
                            <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-blue-700 space-y-1">
                                <p><strong>使用说明：</strong>开启后，程序会按设定间隔自动扫描所有已添加的项目文件夹。</p>
                                <p>• 推荐间隔：<strong>60秒</strong>，平衡实时性与系统性能</p>
                                <p>• 最短 10 秒，防止过于频繁的扫描影响性能</p>
                                <p>• 应用最小化或在后台时，轮询照常运行</p>
                                <p>• 大型项目（10000+ 文件）建议适当增大间隔</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                        <div className="flex gap-2">
                            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-amber-700">
                                <p><strong>注意事项：</strong>轮询扫描在主进程中运行，不会阻塞 UI。但递归扫描大目录可能占用一定 CPU，请根据项目大小合理调整间隔。</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Scan Settings */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FolderSearch className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900">扫描设置</h2>
                            <p className="text-xs text-slate-400">控制递归扫描的深度</p>
                        </div>
                    </div>

                    <div className="py-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">最大递归深度</span>
                            <span className="text-sm font-black text-emerald-600">{maxDepth} 层</span>
                        </div>
                        <input type="range" min={2} max={10} step={1} value={maxDepth}
                            onChange={e => updateDepth(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                        <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                            <span>2 层 (快速)</span><span>5 层 (推荐)</span><span>10 层 (深度)</span>
                        </div>
                    </div>
                </motion.div>

                {/* Notification Settings */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Bell className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900">通知设置</h2>
                            <p className="text-xs text-slate-400">阶段完成时的系统通知</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <span className="text-sm font-medium text-slate-700">阶段完成通知</span>
                        <button onClick={toggleNotifications}
                            className={`w-11 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`size-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-400">当某个开发阶段从"进行中"变为"已完成"时，推送 macOS 系统通知</p>
                </motion.div>
            </div>
        </div>
    );
}
