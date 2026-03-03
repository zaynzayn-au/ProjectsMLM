import { useState } from 'react';
import { Plus, FolderOpen, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import ProjectCard from './ProjectCard';

type Filter = 'all' | 'active' | 'completed';

export default function Dashboard() {
    const { projects, searchQuery, loadProjects } = useApp();
    const [filter, setFilter] = useState<Filter>('all');
    const [adding, setAdding] = useState(false);

    const filteredProjects = projects
        .filter(p => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q);
            }
            return true;
        })
        .filter(p => {
            if (filter === 'active') return p.overall_progress < 100;
            if (filter === 'completed') return p.overall_progress >= 100;
            return true;
        });

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.overall_progress < 100).length,
        avgProgress: projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.overall_progress, 0) / projects.length) : 0,
    };

    const handleAdd = async () => {
        setAdding(true);
        try {
            const result = await window.api.addProject();
            if (result && !('error' in result)) {
                await loadProjects();
            } else if (result && 'error' in result) {
                alert(result.error);
            }
        } catch (err) {
            console.error(err);
        }
        setAdding(false);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-slate-900 mb-1">持续追踪的项目进展</h1>
                <p className="text-slate-500 text-sm">Dashboard / Continuous Project Tracking</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: '总项目', value: stats.total, icon: FolderOpen, color: 'blue' },
                    { label: '活跃中', value: stats.active, icon: Zap, color: 'amber' },
                    { label: '平均进度', value: `${stats.avgProgress}%`, icon: CheckCircle2, color: 'emerald' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl p-4 flex items-center gap-4"
                    >
                        <div className={`size-10 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-600`}>
                            <Icon className="size-5" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-slate-900">{value}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 mb-6">
                {(['all', 'active', 'completed'] as Filter[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${filter === f
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                : 'bg-white/60 text-slate-500 hover:bg-white hover:text-slate-900'
                            }`}
                    >
                        {f === 'all' ? '全部' : f === 'active' ? '活跃' : '已完成'}
                    </button>
                ))}
                <span className="text-xs text-slate-400 ml-2">{filteredProjects.length} 个项目</span>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project, i) => (
                    <ProjectCard key={project.id} project={project} index={i} />
                ))}

                {/* Add Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: filteredProjects.length * 0.05 }}
                    onClick={handleAdd}
                    disabled={adding}
                    className="bg-transparent border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[260px] disabled:opacity-50"
                >
                    <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Plus className="size-6" />
                    </div>
                    <span className="font-bold text-sm mb-0.5">{adding ? '选择文件夹...' : '开启新篇章'}</span>
                    <span className="text-[11px]">在这里添加您的下一个创新项目</span>
                </motion.button>
            </div>
        </div>
    );
}
