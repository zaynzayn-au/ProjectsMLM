import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import type { Project, Stage } from '../types';

const STAGE_LABELS: Record<Stage, string> = {
    ui_design: 'UI设计', frontend: '前端', backend: '后端',
    integration: '连调', git: 'Git', database: '数据库', deployment: '部署',
};

interface Props {
    project: Project;
    index: number;
}

export default function ProjectCard({ project, index }: Props) {
    const { setSelectedProjectId, setView, loadProjects } = useApp();
    const [scanning, setScanning] = useState(false);

    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setScanning(true);
        await window.api.scanProject(project.id);
        await loadProjects();
        setScanning(false);
    };

    const handleClick = () => {
        setView('dashboard');
        setSelectedProjectId(project.id);
    };

    const progress = project.overall_progress || 0;
    const isCompleted = progress >= 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={handleClick}
            className="bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-3xl p-5 flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group min-h-[260px]"
        >
            {/* Top Row */}
            <div className="flex justify-between items-start mb-5">
                <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="font-serif font-bold text-lg">{project.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="刷新扫描"
                    >
                        <RefreshCw className={`size-3.5 ${scanning ? 'animate-spin' : ''}`} />
                    </button>
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {isCompleted ? 'Completed' : 'Active'}
                    </span>
                </div>
            </div>

            {/* Project Name */}
            <h3 className="font-serif text-xl font-bold text-slate-900 mb-1 line-clamp-1">{project.name}</h3>
            <p className="text-slate-400 text-[10px] font-mono line-clamp-1 mb-5">{project.path}</p>

            {/* Progress */}
            <div className="mt-auto">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500">研发总进度</span>
                    <span className="text-xl font-black text-blue-600">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                </div>

                {/* Stage Tags */}
                <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-50 text-emerald-600 flex items-center gap-1">
                        <div className="size-1.5 rounded-full bg-emerald-500" />
                        {project.completed_stages || 0} 完成
                    </span>
                    {(project.active_stages || 0) > 0 && (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-amber-50 text-amber-600 flex items-center gap-1">
                            <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {project.active_stages} 进行中
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
