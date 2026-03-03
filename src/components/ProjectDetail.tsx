import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Palette, Code2, Database, GitBranch, Rocket, Server, Workflow, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import type { Stage, StageData, ScanSignal } from '../types';

const STAGE_CONFIG: Record<Stage, { icon: any; label: string; desc: string }> = {
    ui_design: { icon: Palette, label: 'UI Design', desc: 'Figma, Sketch 设计资源' },
    frontend: { icon: Code2, label: 'Frontend', desc: 'React, Vue 前端组件' },
    backend: { icon: Server, label: 'Backend', desc: 'API, 服务端逻辑' },
    integration: { icon: Workflow, label: 'Integration', desc: 'API 连接, 前后端联调' },
    git: { icon: GitBranch, label: 'Git Flow', desc: '版本控制, 分支管理' },
    database: { icon: Database, label: 'Data Storage', desc: 'Schema, 模型, 数据库配置' },
    deployment: { icon: Rocket, label: 'Deployment', desc: 'Docker, CI/CD, 部署' },
};

const STAGE_ORDER: Stage[] = ['ui_design', 'frontend', 'backend', 'integration', 'git', 'database', 'deployment'];

export default function ProjectDetail() {
    const { selectedProjectId, setSelectedProjectId, loadProjects } = useApp();
    const [project, setProject] = useState<any>(null);
    const [scanning, setScanning] = useState(false);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);

    const loadDetail = async () => {
        if (!selectedProjectId) return;
        const data = await window.api.getProjectDetail(selectedProjectId);
        setProject(data);
    };

    useEffect(() => { loadDetail(); }, [selectedProjectId]);

    // Listen for scan updates
    useEffect(() => {
        const unsub = window.api.onScanUpdate((data: any) => {
            if (data.projectId === selectedProjectId) loadDetail();
        });
        return unsub;
    }, [selectedProjectId]);

    const handleScan = async () => {
        if (!selectedProjectId) return;
        setScanning(true);
        await window.api.scanProject(selectedProjectId);
        await loadDetail();
        await loadProjects();
        setScanning(false);
    };

    if (!project) return null;

    const stages: StageData[] = project.stages || [];
    const overallProgress = stages.length > 0
        ? Math.round(stages.reduce((a: number, s: StageData) => a + s.progress, 0) / 7)
        : 0;

    return (
        <div className="max-w-5xl mx-auto pb-16">
            {/* Back + Actions */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setSelectedProjectId(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    返回总览
                </button>
                <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={`size-4 ${scanning ? 'animate-spin' : ''}`} />
                    {scanning ? '扫描中...' : '刷新扫描'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Overview */}
                <div className="lg:col-span-1">
                    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full" />
                        <span className="text-[9px] font-bold text-blue-600 tracking-widest uppercase mb-1 block">Project Overview</span>
                        <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">{project.name}</h1>
                        <p className="text-slate-500 text-xs font-mono mb-6 break-all">{project.path}</p>

                        {/* Progress Ring */}
                        <div className="flex items-center gap-5 mb-6">
                            <div className="relative size-20">
                                <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="#3b82f6" strokeWidth="6"
                                        strokeDasharray={`${2 * Math.PI * 34}`}
                                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - overallProgress / 100)}`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-blue-600">{overallProgress}%</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">总进度</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {stages.filter((s: StageData) => s.status === 'completed').length}/7 阶段完成
                                </p>
                            </div>
                        </div>

                        {project.last_scanned && (
                            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                                最近扫描: {new Date(project.last_scanned).toLocaleString('zh-CN')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Stages */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-serif text-2xl font-bold text-slate-900">Development Workflow</h2>
                    </div>

                    <div className="space-y-3">
                        {STAGE_ORDER.map((stageKey, i) => {
                            const stageData = stages.find((s: StageData) => s.stage === stageKey);
                            const config = STAGE_CONFIG[stageKey];
                            const Icon = config.icon;
                            const status = stageData?.status || 'pending';
                            const progress = stageData?.progress || 0;
                            const isCompleted = status === 'completed';
                            const isInProgress = status === 'in_progress';
                            const expanded = expandedStage === stageKey;

                            let signals: ScanSignal[] = [];
                            try { signals = stageData?.details ? JSON.parse(stageData.details) : []; } catch { }

                            return (
                                <motion.div
                                    key={stageKey}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${isCompleted ? 'border-emerald-100 shadow-sm' :
                                            isInProgress ? 'border-blue-200 shadow-md shadow-blue-100/50' :
                                                'border-slate-100 opacity-60'}`}
                                >
                                    <div
                                        className="p-4 flex items-center gap-4 cursor-pointer"
                                        onClick={() => setExpandedStage(expanded ? null : stageKey)}
                                    >
                                        <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-50 text-emerald-600' :
                                                isInProgress ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' :
                                                    'bg-slate-100 text-slate-400'}`}>
                                            <Icon className="size-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h3 className="font-bold text-slate-900 text-sm">{config.label}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-600">{progress}%</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isCompleted ? 'bg-emerald-50 text-emerald-600' :
                                                            isInProgress ? 'bg-blue-50 text-blue-600' :
                                                                'bg-slate-100 text-slate-400'}`}>
                                                        {status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : '待开始'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400">{config.desc}</p>

                                            {(isCompleted || isInProgress) && (
                                                <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1 }}
                                                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {signals.length > 0 && (
                                            expanded ? <ChevronDown className="size-4 text-slate-400 shrink-0" /> : <ChevronRight className="size-4 text-slate-400 shrink-0" />
                                        )}
                                    </div>

                                    {/* Expanded Signals */}
                                    <AnimatePresence>
                                        {expanded && signals.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-100 bg-slate-50/50"
                                            >
                                                <div className="p-4 space-y-2">
                                                    {signals.map((sig, j) => (
                                                        <div key={j} className="flex items-center gap-3 text-xs">
                                                            <div className={`size-2 rounded-full shrink-0 ${sig.detected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                            <span className={`font-medium ${sig.detected ? 'text-slate-700' : 'text-slate-400'}`}>{sig.name}</span>
                                                            <span className="text-slate-400 text-[10px] ml-auto">{sig.detail}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
