import { contextBridge, ipcRenderer } from 'electron';

const api = {
    // Projects
    addProject: (): Promise<any> => ipcRenderer.invoke('project:add'),
    removeProject: (id: string): Promise<boolean> => ipcRenderer.invoke('project:remove', id),
    getProjects: (): Promise<any[]> => ipcRenderer.invoke('project:list'),
    getProjectDetail: (id: string): Promise<any> => ipcRenderer.invoke('project:detail', id),
    scanProject: (id: string): Promise<any> => ipcRenderer.invoke('project:scan', id),
    getHistory: (id?: string): Promise<any[]> => ipcRenderer.invoke('project:history', id),

    // Polling
    startPolling: (id: string): Promise<boolean> => ipcRenderer.invoke('polling:start', id),
    stopPolling: (id: string): Promise<boolean> => ipcRenderer.invoke('polling:stop', id),
    getPollingStatus: (id: string): Promise<boolean> => ipcRenderer.invoke('polling:status', id),
    stopAllPolling: (): Promise<boolean> => ipcRenderer.invoke('polling:stopAll'),

    // Settings
    getSetting: (key: string): Promise<string | undefined> => ipcRenderer.invoke('settings:get', key),
    setSetting: (key: string, value: string): Promise<boolean> => ipcRenderer.invoke('settings:set', key, value),
    getSettings: (): Promise<Record<string, string>> => ipcRenderer.invoke('settings:getAll'),

    // Notifications
    getNotifications: (): Promise<any[]> => ipcRenderer.invoke('notifications:list'),
    markNotificationRead: (id: number): Promise<boolean> => ipcRenderer.invoke('notifications:read', id),
    clearNotifications: (): Promise<boolean> => ipcRenderer.invoke('notifications:clear'),
    getUnreadCount: (): Promise<number> => ipcRenderer.invoke('notifications:unreadCount'),

    // Event listeners
    onScanUpdate: (callback: (data: any) => void): (() => void) => {
        const handler = (_event: any, data: any) => callback(data);
        ipcRenderer.on('scan:update', handler);
        return () => ipcRenderer.removeListener('scan:update', handler);
    },
    onNotification: (callback: (data: any) => void): (() => void) => {
        const handler = (_event: any, data: any) => callback(data);
        ipcRenderer.on('notification:new', handler);
        return () => ipcRenderer.removeListener('notification:new', handler);
    }
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
