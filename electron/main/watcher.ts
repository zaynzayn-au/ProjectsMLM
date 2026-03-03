const pollingTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

type PollCallback = (projectId: string) => void;
let pollCallback: PollCallback | null = null;

export function setPollingCallback(cb: PollCallback): void {
    pollCallback = cb;
}

export function startPolling(projectId: string, intervalMs: number): void {
    stopPolling(projectId);
    if (!pollCallback) return;
    const cb = pollCallback;
    const timer = setInterval(() => cb(projectId), intervalMs);
    pollingTimers.set(projectId, timer);
}

export function stopPolling(projectId: string): void {
    const timer = pollingTimers.get(projectId);
    if (timer) {
        clearInterval(timer);
        pollingTimers.delete(projectId);
    }
}

export function stopAllPolling(): void {
    for (const timer of pollingTimers.values()) clearInterval(timer);
    pollingTimers.clear();
}

export function isPolling(projectId: string): boolean {
    return pollingTimers.has(projectId);
}

export function getPollingIds(): string[] {
    return Array.from(pollingTimers.keys());
}
