import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import type { ScanHistoryRecord } from '../types';

export default function ActivityView() {
    const { projects } = useApp();
    const [history, setHistory] = useState<ScanHistoryRecord[]>([]);
    const [filterProject, setFilterProject] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        setLoading(true);
        const id = filterProject === 'all' ? undefined : filterProject;
        const data = await window.api.getHistory(id);
        setHistory(data);
        setLoading(false);
    };

    useEffect(() => { loadHistory(); }, [filterProject]);

    // Listen for updates
    useEffect(() => {
        const unsub = window.api.onScanUpdate(() => loadHistory());
        return unsub;
    }, [filterProject]);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - d.getTime();

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
        return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-slate-900 mb-1">活动时间线</h1>
                <p className="text-slate-500 text-sm">Activity / Scan History Timeline</p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-6">
                <Filter className="size-4 text-slate-400" />
                <select
                    value={filterProject}
                    onChange={e => setFilterProject(e.target.value)}
                    className="bg-white/80 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-300"
                >
                    <option value="all">所有项目</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <span className="text-xs text-slate-400">{history.length} 条记录</span>
            </div>

            {/* Timeline */}
            {loading ? (
                <div className="text-center py-20 text-slate-400 text-sm">加载中...</div>
            ) : history.length === 0 ? (
                <div className="text-center py-20">
                    <Clock className="size-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">暂无扫描记录</p>
                    <p className="text-slate-300 text-xs mt-1">添加项目并扫描后，历史记录将显示在此处</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200" />

                    <div className="space-y-4">
                        {history.map((record, i) => {
                            let snapshot: Record<string, { status: string; progress: number }> = {};
                            try { snapshot = JSON.parse(record.stage_snapshot); } catch { }
                            const completedCount = Object.values(snapshot).filter(s => s.status === 'completed').length;

                            return (
                                <motion.div
                                    key={record.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex gap-4 relative"
                                >
                                    {/* Dot */}
                                    <div className="size-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center shrink-0 z-10">
                                        <TrendingUp className="size-4 text-blue-500" />
                                    </div>

                                    {/* Content */}
                                    <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-4 flex-1 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-sm text-slate-900">{record.project_name}</h3>
                                            <span className="text-[10px] text-slate-400">{formatTime(record.scanned_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-blue-600">{record.overall_progress}%</span>
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${record.overall_progress}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">{completedCount}/7</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
