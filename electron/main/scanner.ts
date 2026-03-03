import * as fs from 'fs';
import * as path from 'path';

export type Stage = 'ui_design' | 'frontend' | 'backend' | 'integration' | 'git' | 'database' | 'deployment';
export type StageStatus = 'pending' | 'in_progress' | 'completed';

export interface ScanSignal {
    name: string;
    detected: boolean;
    detail: string;
}

export interface StageResult {
    status: StageStatus;
    progress: number;
    signals: ScanSignal[];
}

export type ScanResult = Record<Stage, StageResult>;

const SKIP_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '__pycache__', '.next',
    'vendor', '.cache', '.parcel-cache', 'coverage', '.turbo',
    '.vscode', '.idea', 'target', 'bin', 'obj', '.nuxt', '.output',
    '.svelte-kit', 'venv', '.venv', 'env'
]);

interface FileEntry { name: string; relPath: string; ext: string; }
interface DirEntry { name: string; relPath: string; }

interface CollectedData {
    files: FileEntry[];
    dirs: DirEntry[];
    rootItems: Set<string>;
    packageJson: any | null;
}

function collectFiles(dirPath: string, basePath: string, maxDepth: number, data: CollectedData, depth: number = 0): void {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.relative(basePath, fullPath);

        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            data.dirs.push({ name: entry.name, relPath });
            if (depth === 0) data.rootItems.add(entry.name);
            collectFiles(fullPath, basePath, maxDepth, data, depth + 1);
        } else {
            const ext = path.extname(entry.name).toLowerCase();
            data.files.push({ name: entry.name, relPath, ext });
            if (depth === 0) data.rootItems.add(entry.name);
        }
    }
}

function getDeps(pkg: any): Record<string, string> {
    if (!pkg) return {};
    return { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
}

function makeResult(signals: ScanSignal[]): StageResult {
    const detected = signals.filter(s => s.detected).length;
    const progress = Math.round((detected / signals.length) * 100);
    let status: StageStatus = 'pending';
    if (detected >= 3) status = 'completed';
    else if (detected >= 1) status = 'in_progress';
    return { status, progress, signals };
}

function checkUIDesign(data: CollectedData): StageResult {
    const deps = getDeps(data.packageJson);
    const designExts = new Set(['.fig', '.sketch', '.xd', '.psd', '.ai']);
    const assetExts = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico']);

    return makeResult([
        { name: '设计源文件', detected: data.files.some(f => designExts.has(f.ext)), detail: 'Figma / Sketch / XD / PSD 文件' },
        { name: '设计目录', detected: data.dirs.some(d => ['design', 'designs', 'mockups', 'wireframes', 'ui'].includes(d.name.toLowerCase())), detail: 'design/ , mockups/ 等目录' },
        { name: '素材资源', detected: data.files.filter(f => assetExts.has(f.ext)).length >= 3, detail: 'SVG / PNG / JPG 素材 (≥3)' },
        { name: 'CSS 框架', detected: !!(deps['tailwindcss'] || deps['styled-components'] || deps['sass'] || deps['less'] || deps['@emotion/react'] || deps['@chakra-ui/react']), detail: 'TailwindCSS / Styled Components 等' },
        { name: '样式表文件', detected: data.files.filter(f => ['.css', '.scss', '.less', '.styl'].includes(f.ext)).length >= 2, detail: 'CSS / SCSS / Less 文件 (≥2)' },
    ]);
}

function checkFrontend(data: CollectedData): StageResult {
    const deps = getDeps(data.packageJson);
    const componentExts = new Set(['.tsx', '.jsx', '.vue', '.svelte']);

    return makeResult([
        { name: '前端框架', detected: !!(deps['react'] || deps['vue'] || deps['@angular/core'] || deps['svelte'] || deps['next'] || deps['nuxt'] || deps['solid-js']), detail: 'React / Vue / Angular / Svelte' },
        { name: '组件文件', detected: data.files.filter(f => componentExts.has(f.ext)).length >= 3, detail: 'TSX / JSX / Vue 组件 (≥3)' },
        { name: '路由配置', detected: !!(deps['react-router'] || deps['react-router-dom'] || deps['vue-router'] || deps['@angular/router'] || data.dirs.some(d => ['pages', 'app', 'routes'].includes(d.name))), detail: 'Router 或 pages/ 目录' },
        { name: '状态管理', detected: !!(deps['redux'] || deps['@reduxjs/toolkit'] || deps['zustand'] || deps['pinia'] || deps['vuex'] || deps['recoil'] || deps['jotai'] || deps['mobx']), detail: 'Redux / Zustand / Pinia 等' },
        { name: '页面视图', detected: data.dirs.some(d => ['pages', 'views', 'screens', 'app'].includes(d.name)) && data.files.filter(f => componentExts.has(f.ext)).length >= 5, detail: 'pages/ 或 views/ 目录' },
    ]);
}

function checkBackend(data: CollectedData): StageResult {
    const deps = getDeps(data.packageJson);
    const hasPython = data.files.some(f => f.name === 'requirements.txt' || f.name === 'main.py' || f.name === 'app.py' || f.name === 'manage.py');
    const hasGo = data.files.some(f => f.name === 'go.mod' || f.name === 'main.go');
    const hasRust = data.files.some(f => f.name === 'Cargo.toml');
    const hasJava = data.files.some(f => f.name === 'pom.xml' || f.name === 'build.gradle');

    return makeResult([
        { name: '服务端框架', detected: !!(deps['express'] || deps['@nestjs/core'] || deps['fastify'] || deps['koa'] || deps['hapi'] || hasPython || hasGo || hasRust || hasJava), detail: 'Express / NestJS / Django / Flask / Go' },
        { name: '路由/控制器', detected: data.dirs.some(d => ['routes', 'controllers', 'handlers', 'api', 'routers'].includes(d.name)), detail: 'routes/ / controllers/ 目录' },
        { name: '中间件', detected: data.dirs.some(d => ['middleware', 'middlewares', 'guards', 'interceptors'].includes(d.name)) || data.files.some(f => f.name.includes('middleware')), detail: 'middleware/ 目录' },
        { name: 'API 文档', detected: data.files.some(f => f.name.includes('swagger') || f.name.includes('openapi') || f.name.endsWith('.yaml') || f.name.endsWith('.yml')), detail: 'Swagger / OpenAPI 文档' },
        { name: '服务层', detected: data.dirs.some(d => ['services', 'service', 'utils', 'helpers', 'lib'].includes(d.name)) && data.files.filter(f => ['.ts', '.js', '.py', '.go', '.rs', '.java'].includes(f.ext)).length >= 5, detail: 'services/ 或 utils/ 目录' },
    ]);
}

function checkIntegration(data: CollectedData): StageResult {
    const deps = getDeps(data.packageJson);
    const envContent = data.files.filter(f => f.name.startsWith('.env')).length > 0;

    return makeResult([
        { name: 'HTTP 客户端', detected: !!(deps['axios'] || deps['got'] || deps['superagent'] || deps['node-fetch'] || deps['ky'] || data.files.some(f => f.name.includes('fetch') || f.name.includes('client') || f.name.includes('api'))), detail: 'Axios / Fetch 封装' },
        { name: '环境配置', detected: envContent, detail: '.env 配置文件' },
        { name: '共享类型', detected: data.dirs.some(d => ['types', 'interfaces', 'shared', 'common', 'dto'].includes(d.name)) || data.files.some(f => f.name.includes('types') || f.name.includes('interface')), detail: 'types/ 或 shared/ 目录' },
        { name: 'API 服务层', detected: data.files.some(f => /^(api|client|fetcher|request|http)\.(ts|js|tsx|jsx)$/.test(f.name)), detail: 'api.ts / client.ts 等' },
        { name: '集成/E2E测试', detected: data.files.some(f => f.name.includes('.integration.') || f.name.includes('.e2e.') || f.name.includes('cypress') || f.name.includes('playwright')) || data.dirs.some(d => ['e2e', 'cypress', 'playwright', '__tests__'].includes(d.name)), detail: '集成测试或 E2E 测试' },
    ]);
}

function checkGit(data: CollectedData, projectPath: string): StageResult {
    const gitDir = path.join(projectPath, '.git');
    const hasGit = fs.existsSync(gitDir);

    let hasRemote = false;
    let hasBranches = false;
    let hasHistory = false;

    if (hasGit) {
        try { hasRemote = fs.existsSync(path.join(gitDir, 'config')) && fs.readFileSync(path.join(gitDir, 'config'), 'utf-8').includes('[remote'); } catch { }
        try { const heads = fs.readdirSync(path.join(gitDir, 'refs', 'heads')); hasBranches = heads.length >= 1; } catch { }
        try { hasHistory = fs.existsSync(path.join(gitDir, 'logs', 'HEAD')); } catch { }
    }

    return makeResult([
        { name: 'Git 初始化', detected: hasGit, detail: '.git 目录' },
        { name: '.gitignore', detected: data.files.some(f => f.name === '.gitignore'), detail: '.gitignore 配置' },
        { name: '远程仓库', detected: hasRemote, detail: 'Git remote 已配置' },
        { name: '分支管理', detected: hasBranches, detail: 'Git 分支' },
        { name: '提交历史', detected: hasHistory, detail: 'Git commit 日志' },
    ]);
}

function checkDatabase(data: CollectedData): StageResult {
    const deps = getDeps(data.packageJson);

    return makeResult([
        { name: 'ORM / 数据驱动', detected: !!(deps['prisma'] || deps['@prisma/client'] || deps['mongoose'] || deps['pg'] || deps['mysql2'] || deps['sequelize'] || deps['typeorm'] || deps['knex'] || deps['drizzle-orm'] || deps['better-sqlite3']), detail: 'Prisma / Mongoose / TypeORM 等' },
        { name: 'Schema / 迁移', detected: data.dirs.some(d => ['prisma', 'migrations', 'migration', 'drizzle'].includes(d.name)) || data.files.some(f => f.ext === '.sql' || f.name.includes('schema') || f.name.includes('migration')), detail: 'Schema / Migration 文件' },
        { name: 'Model 定义', detected: data.dirs.some(d => ['models', 'entities', 'entity', 'schemas'].includes(d.name)), detail: 'models/ 或 entities/ 目录' },
        { name: 'Seed 数据', detected: data.dirs.some(d => ['seeds', 'seeders', 'fixtures'].includes(d.name)) || data.files.some(f => f.name.includes('seed')), detail: 'seeds/ 或 seed 文件' },
        { name: '数据库配置', detected: data.files.some(f => f.name.includes('database') || f.name.includes('db.config') || f.name.includes('ormconfig') || f.name.includes('knexfile')), detail: 'database.yml / db.config 等' },
    ]);
}

function checkDeployment(data: CollectedData): StageResult {
    const scripts = data.packageJson?.scripts || {};

    return makeResult([
        { name: 'Docker', detected: data.files.some(f => f.name === 'Dockerfile' || f.name === 'docker-compose.yml' || f.name === 'docker-compose.yaml' || f.name === '.dockerignore'), detail: 'Dockerfile / docker-compose' },
        { name: 'CI/CD', detected: data.dirs.some(d => d.relPath === '.github' || d.relPath.startsWith('.github/workflows')) || data.files.some(f => f.name === '.gitlab-ci.yml' || f.name === 'Jenkinsfile' || f.name === '.circleci'), detail: 'GitHub Actions / GitLab CI' },
        { name: '平台配置', detected: data.files.some(f => ['vercel.json', 'netlify.toml', 'fly.toml', 'railway.json', 'render.yaml', 'Procfile', 'app.yaml'].includes(f.name)), detail: 'Vercel / Netlify / Fly.io 等' },
        { name: '构建脚本', detected: !!(scripts['build'] && scripts['start']), detail: 'package.json 中的 build + start' },
        { name: '环境管理', detected: data.files.some(f => f.name === '.env.example' || f.name === '.env.production' || f.name === '.env.staging') || data.files.some(f => f.name.toLowerCase().includes('deploy') && (f.ext === '.md' || f.ext === '.txt')), detail: '.env.example / .env.production' },
    ]);
}

export function scanProject(projectPath: string, maxDepth: number = 5): ScanResult {
    const data: CollectedData = { files: [], dirs: [], rootItems: new Set(), packageJson: null };
    collectFiles(projectPath, projectPath, maxDepth, data, 0);

    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try { data.packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')); } catch { }
    }

    return {
        ui_design: checkUIDesign(data),
        frontend: checkFrontend(data),
        backend: checkBackend(data),
        integration: checkIntegration(data),
        git: checkGit(data, projectPath),
        database: checkDatabase(data),
        deployment: checkDeployment(data),
    };
}

export function calculateOverallProgress(result: ScanResult): number {
    const values = Object.values(result);
    const total = values.reduce((acc, r) => acc + r.progress, 0);
    return Math.round(total / values.length);
}

export const STAGE_ORDER: Stage[] = ['ui_design', 'frontend', 'backend', 'integration', 'git', 'database', 'deployment'];
