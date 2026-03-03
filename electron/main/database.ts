import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: SqlJsDatabase;
let dbPath: string;

function saveDb(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export async function initDatabase(): Promise<void> {
  dbPath = path.join(app.getPath('userData'), 'projectsmlm.db');
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3b82f6',
      created_at INTEGER NOT NULL,
      last_scanned INTEGER
    );
    CREATE TABLE IF NOT EXISTS stages (
      project_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      details TEXT,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (project_id, stage)
    );
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      overall_progress INTEGER NOT NULL,
      stage_snapshot TEXT NOT NULL,
      scanned_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT,
      project_name TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  // Default settings
  const insertSetting = 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)';
  db.run(insertSetting, ['polling_enabled', 'false']);
  db.run(insertSetting, ['polling_interval', '60']);
  db.run(insertSetting, ['max_scan_depth', '5']);
  db.run(insertSetting, ['notifications_enabled', 'true']);
  saveDb();
}

export function closeDatabase(): void {
  if (db) { saveDb(); db.close(); }
}

function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runSql(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDb();
}

// --- Projects ---
export function addProject(name: string, dirPath: string): string {
  const id = crypto.randomUUID();
  const now = Date.now();
  runSql('INSERT INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)', [id, name, dirPath, now]);
  return id;
}

export function removeProject(id: string): void {
  runSql('DELETE FROM stages WHERE project_id = ?', [id]);
  runSql('DELETE FROM scan_history WHERE project_id = ?', [id]);
  runSql('DELETE FROM notifications WHERE project_id = ?', [id]);
  runSql('DELETE FROM projects WHERE id = ?', [id]);
}

export function getProjects(): any[] {
  return queryAll(`
    SELECT p.*,
      COALESCE((SELECT CAST(AVG(CASE WHEN s.progress > 0 THEN s.progress ELSE 0 END) AS INTEGER) FROM stages s WHERE s.project_id = p.id), 0) as overall_progress,
      (SELECT COUNT(*) FROM stages s WHERE s.project_id = p.id AND s.status = 'completed') as completed_stages,
      (SELECT COUNT(*) FROM stages s WHERE s.project_id = p.id AND s.status = 'in_progress') as active_stages
    FROM projects p ORDER BY p.created_at DESC
  `);
}

export function getProjectById(id: string): any {
  return queryOne('SELECT * FROM projects WHERE id = ?', [id]);
}

export function updateProjectScanned(id: string): void {
  runSql('UPDATE projects SET last_scanned = ? WHERE id = ?', [Date.now(), id]);
}

// --- Stages ---
export function upsertStage(projectId: string, stage: string, status: string, progress: number, details: string): void {
  const now = Date.now();
  const existing = queryOne('SELECT 1 FROM stages WHERE project_id = ? AND stage = ?', [projectId, stage]);
  if (existing) {
    runSql('UPDATE stages SET status = ?, progress = ?, details = ?, updated_at = ? WHERE project_id = ? AND stage = ?', [status, progress, details, now, projectId, stage]);
  } else {
    runSql('INSERT INTO stages (project_id, stage, status, progress, details, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [projectId, stage, status, progress, details, now]);
  }
}

export function getStages(projectId: string): any[] {
  return queryAll(`SELECT * FROM stages WHERE project_id = ? ORDER BY CASE stage
    WHEN 'ui_design' THEN 1 WHEN 'frontend' THEN 2 WHEN 'backend' THEN 3
    WHEN 'integration' THEN 4 WHEN 'git' THEN 5 WHEN 'database' THEN 6
    WHEN 'deployment' THEN 7 END`, [projectId]);
}

export function getPreviousStages(projectId: string): any[] {
  return queryAll('SELECT * FROM stages WHERE project_id = ?', [projectId]);
}

// --- Scan History ---
export function addScanHistory(projectId: string, overallProgress: number, stageSnapshot: string): void {
  runSql('INSERT INTO scan_history (project_id, overall_progress, stage_snapshot, scanned_at) VALUES (?, ?, ?, ?)', [projectId, overallProgress, stageSnapshot, Date.now()]);
}

export function getScanHistory(projectId?: string, limit: number = 50): any[] {
  if (projectId) {
    return queryAll(`SELECT sh.*, p.name as project_name FROM scan_history sh JOIN projects p ON p.id = sh.project_id WHERE sh.project_id = ? ORDER BY sh.scanned_at DESC LIMIT ?`, [projectId, limit]);
  }
  return queryAll(`SELECT sh.*, p.name as project_name FROM scan_history sh JOIN projects p ON p.id = sh.project_id ORDER BY sh.scanned_at DESC LIMIT ?`, [limit]);
}

// --- Settings ---
export function getSetting(key: string): string | undefined {
  const row = queryOne('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  runSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export function getAllSettings(): Record<string, string> {
  const rows = queryAll('SELECT key, value FROM settings');
  const result: Record<string, string> = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

// --- Notifications ---
export function addNotification(projectId: string | null, projectName: string, type: string, title: string, message: string): void {
  runSql('INSERT INTO notifications (project_id, project_name, type, title, message, created_at) VALUES (?, ?, ?, ?, ?, ?)', [projectId, projectName, type, title, message, Date.now()]);
}

export function getNotifications(limit: number = 30): any[] {
  return queryAll('SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?', [limit]);
}

export function markNotificationRead(id: number): void {
  runSql('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
}

export function clearNotifications(): void {
  runSql('DELETE FROM notifications');
}

export function getUnreadCount(): number {
  const row = queryOne('SELECT COUNT(*) as count FROM notifications WHERE read = 0');
  return row?.count || 0;
}
