import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Project, ViewType, AppNotification, AppSettings } from '../types';

interface AppState {
    view: ViewType;
    setView: (v: ViewType) => void;
    projects: Project[];
    loadProjects: () => Promise<void>;
    selectedProjectId: string | null;
    setSelectedProjectId: (id: string | null) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    notifications: AppNotification[];
    unreadCount: number;
    loadNotifications: () => Promise<void>;
    settings: AppSettings;
    loadSettings: () => Promise<void>;
    refreshing: boolean;
}

const defaultSettings: AppSettings = {
    polling_enabled: 'false',
    polling_interval: '60',
    max_scan_depth: '5',
    notifications_enabled: 'true',
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [view, setView] = useState<ViewType>('dashboard');
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [refreshing, setRefreshing] = useState(false);

    const loadProjects = useCallback(async () => {
        setRefreshing(true);
        try {
            const data = await window.api.getProjects();
            setProjects(data);
        } catch (err) {
            console.error('Failed to load projects:', err);
        }
        setRefreshing(false);
    }, []);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await window.api.getNotifications();
            setNotifications(data);
            const count = await window.api.getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    }, []);

    const loadSettings = useCallback(async () => {
        try {
            const data = await window.api.getSettings();
            setSettings(data);
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadProjects();
        loadNotifications();
        loadSettings();
    }, [loadProjects, loadNotifications, loadSettings]);

    // Listen for scan updates
    useEffect(() => {
        const unsub = window.api.onScanUpdate(() => {
            loadProjects();
        });
        return unsub;
    }, [loadProjects]);

    // Listen for new notifications
    useEffect(() => {
        const unsub = window.api.onNotification(() => {
            loadNotifications();
        });
        return unsub;
    }, [loadNotifications]);

    return (
        <AppContext.Provider value={{
            view, setView, projects, loadProjects,
            selectedProjectId, setSelectedProjectId,
            searchQuery, setSearchQuery,
            notifications, unreadCount, loadNotifications,
            settings, loadSettings, refreshing,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp(): AppState {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
