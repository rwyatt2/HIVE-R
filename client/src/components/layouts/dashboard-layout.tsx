import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface DashboardLayoutProps {
    children: ReactNode;
    sidebar?: ReactNode;
    header?: ReactNode;
    className?: string;
}

export function DashboardLayout({
    children,
    sidebar,
    header,
    className,
}: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-background gradient-mesh">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                {sidebar && (
                    <aside className="w-64 border-r border-border/50 backdrop-blur-xl bg-background-elevated/30 flex-shrink-0">
                        <div className="h-full overflow-y-auto scrollbar-custom p-4">
                            {sidebar}
                        </div>
                    </aside>
                )}

                {/* Main content area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    {header && (
                        <header className="border-b border-border/50 backdrop-blur-xl bg-background-elevated/30">
                            <div className="h-16 px-6 flex items-center">{header}</div>
                        </header>
                    )}

                    {/* Main content */}
                    <main
                        className={cn(
                            "flex-1 overflow-y-auto scrollbar-custom p-6",
                            className
                        )}
                    >
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
