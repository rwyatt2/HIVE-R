import * as React from "react"
import { cn } from "../../lib/utils"
import { SideNav } from "./side-nav"
import { TopNav } from "./top-nav"

interface LayoutShellProps {
    children: React.ReactNode
    sidebarProps?: React.ComponentProps<typeof SideNav>
    noScroll?: boolean
}

export function LayoutShell({ children, sidebarProps, noScroll = false }: LayoutShellProps) {
    const [collapsed, setCollapsed] = React.useState(false)
    const [mobileOpen, setMobileOpen] = React.useState(false)

    // Handle props
    const isCollapsed = sidebarProps?.collapsed ?? collapsed
    const onToggle = sidebarProps?.onToggle ?? (() => setCollapsed(prev => !prev))

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-background font-sans text-foreground p-3 md:p-4 gap-3 md:gap-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 bg-neural-mesh pointer-events-none" />
            <div className="absolute inset-0 z-0 gradient-mesh opacity-30 pointer-events-none" />

            {/* Sidebar (Desktop) */}
            <div className="hidden md:flex h-full shrink-0 z-40">
                <SideNav
                    {...sidebarProps}
                    collapsed={isCollapsed}
                    onToggle={onToggle}
                    // Defaults if not provided
                    onNavigate={sidebarProps?.onNavigate || (() => { })}
                    currentSessionId={sidebarProps?.currentSessionId || null}
                    sessions={sidebarProps?.sessions || []}
                    onNewSession={sidebarProps?.onNewSession || (() => { })}
                    onSelectSession={sidebarProps?.onSelectSession || (() => { })}
                    onDeleteSession={sidebarProps?.onDeleteSession || (() => { })}
                />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-[280px] z-50">
                        <SideNav
                            {...sidebarProps}
                            collapsed={false}
                            onToggle={() => setMobileOpen(false)}
                            onNavigate={(path) => {
                                sidebarProps?.onNavigate?.(path)
                                setMobileOpen(false)
                            }}
                            currentSessionId={sidebarProps?.currentSessionId || null}
                            sessions={sidebarProps?.sessions || []}
                            onNewSession={() => {
                                sidebarProps?.onNewSession?.()
                                setMobileOpen(false)
                            }}
                            onSelectSession={(id) => {
                                sidebarProps?.onSelectSession?.(id)
                                setMobileOpen(false)
                            }}
                            onDeleteSession={(id) => {
                                sidebarProps?.onDeleteSession?.(id)
                                setMobileOpen(false)
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 transition-all duration-300">
                <TopNav onMenuClick={() => setMobileOpen(true)} />

                <main className={cn(
                    "flex-1 relative",
                    !noScroll && "overflow-y-auto overflow-x-hidden p-6 md:p-8 scrollbar-custom",
                    noScroll && "overflow-hidden"
                )}>
                    <div className={cn(
                        "h-full",
                        !noScroll && "container max-w-7xl mx-auto space-y-8 animate-fade-in"
                    )}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
