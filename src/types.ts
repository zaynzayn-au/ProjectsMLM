export type Stage = 'ui_design' | 'frontend' | 'backend' | 'integration' | 'git' | 'database' | 'deployment';
export type StageStatus = 'pending' | 'in_progress' | 'completed';
export type ViewType = 'dashboard' | 'activity' | 'settings';

export interface ScanSignal {
    name: string;
    detected: boolean;
    detail: string;
}

export interface StageData {
    project_id: string;
    stage: Stage;
    status: StageStatus;
    progress: number;
    details: string; // JSON string of ScanSignal[]
    updated_at: number;
}

export interface Project {
    id: string;
    name: string;
    path: string;
    color: string;
    created_at: number;
    last_scanned: number | null;
    overall_progress: number;
    completed_stages: number;
    active_stages: number;
    stages?: StageData[];
}

export interface ScanHistoryRecord {
    id: number;
    project_id: string;
    project_name: string;
    overall_progress: number;
    stage_snapshot: string; // JSON
    scanned_at: number;
}

export interface AppNotification {
    id: number;
    project_id: string | null;
    project_name: string;
    type: string;
    title: string;
    message: string;
    read: number;
    created_at: number;
}

export interface AppSettings {
    polling_enabled: string;
    polling_interval: string;
    max_scan_depth: string;
    notifications_enabled: string;
}

declare global {
    interface Window {
        api: {
            addProject: () => Promise<Project | null>;
            removeProject: (id: string) => Promise<boolean>;
            getProjects: () => Promise<Project[]>;
            getProjectDetail: (id: string) => Promise<(Project & { stages: StageData[] }) | null>;
            scanProject: (id: string) => Promise<any>;
            getHistory: (id?: string) => Promise<ScanHistoryRecord[]>;
            startPolling: (id: string) => Promise<boolean>;
            stopPolling: (id: string) => Promise<boolean>;
            getPollingStatus: (id: string) => Promise<boolean>;
            stopAllPolling: () => Promise<boolean>;
            getSetting: (key: string) => Promise<string | undefined>;
            setSetting: (key: string, value: string) => Promise<boolean>;
            getSettings: () => Promise<AppSettings>;
            getNotifications: () => Promise<AppNotification[]>;
            markNotificationRead: (id: number) => Promise<boolean>;
            clearNotifications: () => Promise<boolean>;
            getUnreadCount: () => Promise<number>;
            onScanUpdate: (callback: (data: any) => void) => () => void;
            onNotification: (callback: (data: any) => void) => () => void;
        };
    }
}
