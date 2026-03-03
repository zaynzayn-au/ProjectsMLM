import { ipcMain, dialog, BrowserWindow, Notification } from 'electron';
import * as db from './database';
import { scanProject, calculateOverallProgress, STAGE_ORDER, ScanResult } from './scanner';
import { startPolling, stopPolling, stopAllPolling, isPolling, setPollingCallback } from './watcher';

function getMainWindow(): BrowserWindow | null {
    const wins = BrowserWindow.getAllWindows();
    return wins.length > 0 ? wins[0] : null;
}

function performScan(projectId: string): { overallProgress: number; scanResult: ScanResult } | null {
    const project = db.getProjectById(projectId);
    if (!project) return null;

    const maxDepth = parseInt(db.getSetting('max_scan_depth') || '5', 10);
    const previousStages = db.getPreviousStages(projectId);
    const scanResult = scanProject(project.path, maxDepth);
    const overallProgress = calculateOverallProgress(scanResult);

    // Save stages
    for (const stage of STAGE_ORDER) {
        const r = scanResult[stage];
        db.upsertStage(projectId, stage, r.status, r.progress, JSON.stringify(r.signals));
    }

    // Update project last_scanned
    db.updateProjectScanned(projectId);

    // Save history
    const snapshot: Record<string, { status: string; progress: number }> = {};
    for (const stage of STAGE_ORDER) {
        snapshot[stage] = { status: scanResult[stage].status, progress: scanResult[stage].progress };
    }
    db.addScanHistory(projectId, overallProgress, JSON.stringify(snapshot));

    // Check for stage completions and create notifications
    const notificationsEnabled = db.getSetting('notifications_enabled') === 'true';
    if (notificationsEnabled && previousStages.length > 0) {
        for (const stage of STAGE_ORDER) {
            const prev = previousStages.find((s: any) => s.stage === stage);
            const curr = scanResult[stage];
            if (prev && prev.status !== 'completed' && curr.status === 'completed') {
                const stageLabel = stage.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                db.addNotification(projectId, project.name, 'stage_completed', `${stageLabel} 已完成`, `项目 "${project.name}" 的 ${stageLabel} 阶段已完成 ✅`);

                if (Notification.isSupported()) {
                    new Notification({ title: `${stageLabel} 完成`, body: `项目 "${project.name}" 的 ${stageLabel} 阶段已完成` }).show();
                }

                const win = getMainWindow();
                if (win) win.webContents.send('notification:new', { projectId, stage, type: 'stage_completed' });
            }
        }
    }

    return { overallProgress, scanResult };
}

export function registerIpcHandlers(): void {
    // Set up polling callback
    setPollingCallback((projectId: string) => {
        const result = performScan(projectId);
        if (result) {
            const win = getMainWindow();
            if (win) win.webContents.send('scan:update', { projectId, ...result });
        }
    });

    // --- Projects ---
    ipcMain.handle('project:add', async () => {
        const win = getMainWindow();
        if (!win) return null;

        const result = await dialog.showOpenDialog(win, {
            properties: ['openDirectory'],
            title: '选择项目文件夹',
            buttonLabel: '添加项目'
        });

        if (result.canceled || result.filePaths.length === 0) return null;

        const dirPath = result.filePaths[0];
        const name = dirPath.split('/').pop() || 'Unknown';

        try {
            const id = db.addProject(name, dirPath);
            const scanResult = performScan(id);
            const project = db.getProjectById(id);
            return { ...project, overall_progress: scanResult?.overallProgress || 0 };
        } catch (err: any) {
            if (err.message?.includes('UNIQUE')) return { error: '该项目已添加' };
            throw err;
        }
    });

    ipcMain.handle('project:remove', (_event, id: string) => {
        stopPolling(id);
        db.removeProject(id);
        return true;
    });

    ipcMain.handle('project:list', () => {
        return db.getProjects();
    });

    ipcMain.handle('project:detail', (_event, id: string) => {
        const project = db.getProjectById(id);
        if (!project) return null;
        const stages = db.getStages(id);
        return { ...project, stages };
    });

    ipcMain.handle('project:scan', (_event, id: string) => {
        const result = performScan(id);
        if (!result) return null;
        const project = db.getProjectById(id);
        const stages = db.getStages(id);
        return { ...project, stages, overall_progress: result.overallProgress };
    });

    ipcMain.handle('project:history', (_event, id?: string) => {
        return db.getScanHistory(id);
    });

    // --- Polling ---
    ipcMain.handle('polling:start', (_event, id: string) => {
        const intervalSec = parseInt(db.getSetting('polling_interval') || '60', 10);
        startPolling(id, intervalSec * 1000);
        return true;
    });

    ipcMain.handle('polling:stop', (_event, id: string) => {
        stopPolling(id);
        return true;
    });

    ipcMain.handle('polling:status', (_event, id: string) => {
        return isPolling(id);
    });

    ipcMain.handle('polling:stopAll', () => {
        stopAllPolling();
        return true;
    });

    // --- Settings ---
    ipcMain.handle('settings:get', (_event, key: string) => db.getSetting(key));
    ipcMain.handle('settings:set', (_event, key: string, value: string) => { db.setSetting(key, value); return true; });
    ipcMain.handle('settings:getAll', () => db.getAllSettings());

    // --- Notifications ---
    ipcMain.handle('notifications:list', () => db.getNotifications());
    ipcMain.handle('notifications:read', (_event, id: number) => { db.markNotificationRead(id); return true; });
    ipcMain.handle('notifications:clear', () => { db.clearNotifications(); return true; });
    ipcMain.handle('notifications:unreadCount', () => db.getUnreadCount());
}
