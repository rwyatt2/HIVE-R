/**
 * Frontend Logger
 * Structured logging for client-side code
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: Record<string, unknown>;
    userAgent?: string;
    url?: string;
}

class FrontendLogger {
    private isDevelopment = import.meta.env.DEV;
    private logBuffer: LogEntry[] = [];
    private maxBufferSize = 100;

    private createEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            data,
            userAgent: navigator.userAgent,
            url: window.location.href,
        };
    }

    private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
        const entry = this.createEntry(level, message, data);

        // Add to buffer
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }

        // Console in development only
        if (this.isDevelopment) {
            const style = this.getConsoleStyle(level);
            // eslint-disable-next-line no-console
            console.log(`%c[${level.toUpperCase()}]%c ${message}`, style, 'color: inherit', data || '');
        }

        // Send errors to backend in production
        if (!this.isDevelopment && level === 'error') {
            this.sendToBackend(entry);
        }
    }

    private getConsoleStyle(level: LogLevel): string {
        const styles: Record<LogLevel, string> = {
            debug: 'color: #6b7280; font-weight: bold',
            info: 'color: #3b82f6; font-weight: bold',
            warn: 'color: #f59e0b; font-weight: bold',
            error: 'color: #ef4444; font-weight: bold',
        };
        return styles[level];
    }

    private async sendToBackend(entry: LogEntry) {
        try {
            await fetch('/api/logs/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            });
        } catch {
            // Fail silently
        }
    }

    debug(message: string, data?: Record<string, unknown>) {
        this.log('debug', message, data);
    }

    info(message: string, data?: Record<string, unknown>) {
        this.log('info', message, data);
    }

    warn(message: string, data?: Record<string, unknown>) {
        this.log('warn', message, data);
    }

    error(message: string, error?: Error, data?: Record<string, unknown>) {
        this.log('error', message, {
            ...data,
            error: error
                ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                }
                : undefined,
        });
    }

    getRecentLogs(): LogEntry[] {
        return [...this.logBuffer];
    }

    clear() {
        this.logBuffer = [];
    }
}

export const logger = new FrontendLogger();
