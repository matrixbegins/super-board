import type { PageMetadata, ConsoleLogEntry } from '../types';

let consoleLogs: ConsoleLogEntry[] = [];
let originalConsole: {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
  info: typeof console.info;
} | null = null;

const MAX_LOGS = 50;

export function startConsoleCapture(): void {
  if (originalConsole) return;

  originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  const levels = ['log', 'warn', 'error', 'info'] as const;
  for (const level of levels) {
    const original = originalConsole[level];
    console[level] = (...args: any[]) => {
      consoleLogs.push({
        level,
        message: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
        timestamp: new Date().toISOString(),
      });
      if (consoleLogs.length > MAX_LOGS) {
        consoleLogs = consoleLogs.slice(-MAX_LOGS);
      }
      original.apply(console, args);
    };
  }
}

export function stopConsoleCapture(): void {
  if (originalConsole) {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    originalConsole = null;
  }
  consoleLogs = [];
}

function parseBrowser(ua: string): string {
  if (ua.includes('Firefox/')) {
    const m = ua.match(/Firefox\/([\d.]+)/);
    return `Firefox ${m?.[1] ?? ''}`;
  }
  if (ua.includes('Edg/')) {
    const m = ua.match(/Edg\/([\d.]+)/);
    return `Edge ${m?.[1] ?? ''}`;
  }
  if (ua.includes('Chrome/')) {
    const m = ua.match(/Chrome\/([\d.]+)/);
    return `Chrome ${m?.[1] ?? ''}`;
  }
  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const m = ua.match(/Version\/([\d.]+)/);
    return `Safari ${m?.[1] ?? ''}`;
  }
  return 'Unknown';
}

function parseOS(ua: string): string {
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    return m ? `macOS ${m[1]!.replace(/_/g, '.')}` : 'macOS';
  }
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

export function captureMetadata(
  customData?: Record<string, string>,
): PageMetadata {
  const ua = navigator.userAgent;
  return {
    url: window.location.href,
    browser: parseBrowser(ua),
    os: parseOS(ua),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screenResolution: {
      width: screen.width,
      height: screen.height,
    },
    timestamp: new Date().toISOString(),
    consoleLogs: [...consoleLogs],
    userAgent: ua,
    customData,
  };
}
