import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import {
    LayoutDashboard,
    Hexagon,
    Puzzle,
    Plus,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    BookOpen
} from "lucide-react"

interface SideNavProps {
    collapsed: boolean
    onToggle: () => void
    onNavigate: (path: string) => void
    activePath?: string
    sessions: { id: string, name?: string, preview?: string, updatedAt?: string }[]
    currentSessionId: string | null
    onNewSession: () => void
    onSelectSession: (id: string) => void
    onDeleteSession?: (id: string) => void
    hideSessions?: boolean
}

export function SideNav({
    collapsed,
    onToggle,
    onNavigate,
    activePath = "dashboard",
    sessions = [],
    currentSessionId,
    onNewSession,
    onSelectSession,
    hideSessions = false
}: SideNavProps) {
    return (
        <div
            className={cn(
                "relative flex flex-col h-screen bg-background/95 backdrop-blur-xl border-r border-border transition-all duration-300 z-40",
                collapsed ? "w-[80px]" : "w-[280px]"
            )}
        >
            {/* ── Logo Area ── */}
            <div className="flex items-center justify-between h-[72px] pl-8 pr-5 py-4 border-b border-border shrink-0 relative">
                <button
                    className="flex items-center gap-3 min-w-0 hover:opacity-90 transition"
                    onClick={() => onNavigate('/')}
                    aria-label="Go to landing page"
                >
                    <div className="relative">
                        <Hexagon
                            className="w-8 h-8 text-foreground fill-foreground/10"
                            strokeWidth={1.5}
                        />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight text-foreground">
                            HIVE-R
                        </span>
                    )}
                </button>

                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg",
                        collapsed && "opacity-0 pointer-events-none"
                    )}
                    onClick={onToggle}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>

                {/* Always-available toggle when collapsed */}
                {collapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground shadow-sm"
                        onClick={onToggle}
                        aria-label="Expand sidebar"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* ── Main Navigation ── */}
            <div className={cn("flex-1 py-6 pr-6 overflow-y-auto min-h-0", collapsed ? "pl-5" : "pl-8")}>
                {/* Platform Section */}
                <div className="mb-6">
                    {!collapsed && (
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 pl-2">
                            Platform
                        </h4>
                    )}
                    <nav className="space-y-1">
                        <NavItem
                            icon={Hexagon}
                            label="Studio"
                            active={activePath === 'studio'}
                            collapsed={collapsed}
                            onClick={() => onNavigate('/app')}
                        />
                        <NavItem
                            icon={LayoutDashboard}
                            label="Dashboard"
                            active={activePath === 'dashboard'}
                            collapsed={collapsed}
                            onClick={() => onNavigate('/dashboard')}
                        />
                        <NavItem
                            icon={Puzzle}
                            label="Plugins"
                            active={activePath === 'plugins'}
                            collapsed={collapsed}
                            onClick={() => onNavigate('/plugins')}
                        />
                        <NavItem
                            icon={BookOpen}
                            label="Docs"
                            active={activePath === 'docs'}
                            collapsed={collapsed}
                            onClick={() => onNavigate('/docs')}
                        />
                        
                    </nav>
                </div>

                {!hideSessions && (
                    <>
                        {/* Divider */}
                        {!collapsed && <div className="mx-1 my-6 h-px bg-border" />}

                        {/* Sessions Section */}
                        <div>
                            {!collapsed && (
                                <div className="flex items-center justify-between mb-4 pl-2">
                                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Sessions
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                                        onClick={onNewSession}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <nav className="space-y-1">
                                {sessions.length === 0 && !collapsed && (
                                    <p className="text-xs text-muted-foreground py-3 pl-8 pr-4">No sessions yet</p>
                                )}
                                {sessions.map(session => (
                                    <NavItem
                                        key={session.id}
                                        icon={MessageCircle}
                                        label={session.name || "New Session"}
                                        active={currentSessionId === session.id}
                                        collapsed={collapsed}
                                        onClick={() => onSelectSession(session.id)}
                                    />
                                ))}
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

interface NavItemProps {
    icon: React.ElementType
    label: string
    active?: boolean
    collapsed?: boolean
    onClick?: () => void
}

function NavItem({ icon: Icon, label, active, collapsed, onClick }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative w-full flex items-center h-10 pl-3 pr-3 gap-3 rounded-md transition-all duration-200",
                active
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                collapsed && "justify-center pl-0 pr-0 gap-0 min-w-0"
            )}
        >
            <Icon className={cn(
                "w-4 h-4 shrink-0 flex-none",
                active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )} />
            {!collapsed && (
                <span className="truncate text-sm">{label}</span>
            )}
        </button>
    )
}
