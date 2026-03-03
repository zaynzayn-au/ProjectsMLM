import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import ActivityView from './components/ActivityView';
import SettingsView from './components/SettingsView';
import { useApp } from './contexts/AppContext';

export default function App() {
    const { view, selectedProjectId } = useApp();

    const renderContent = () => {
        if (view === 'dashboard') {
            return selectedProjectId ? <ProjectDetail /> : <Dashboard />;
        }
        if (view === 'activity') return <ActivityView />;
        if (view === 'settings') return <SettingsView />;
        return <Dashboard />;
    };

    return (
        <div className="flex h-screen w-full bg-[#f6f6f8] text-slate-900 overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
