import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import {
    LayoutDashboard,
    Settings,
    Hexagon,
    Puzzle,
    LogOut,
    Plus,
    MessageCircle,
    ChevronLeft,
    ChevronRight
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
}

export function SideNav({
    collapsed,
    onToggle,
    onNavigate,
    activePath = "dashboard",
    sessions = [],
    currentSessionId,
    onNewSession,
    onSelectSession
}: SideNavProps) {
    return (
        <div
            className={cn(
                "relative flex flex-col h-screen bg-hive-bg-dark/95 backdrop-blur-2xl border-r border-hive-border-subtle transition-all duration-300 z-40",
                collapsed ? "w-[80px]" : "w-[280px]"
            )}
        >
            {/* ── Logo Area ── */}
            <div className="flex items-center justify-between h-[72px] px-5 border-b border-hive-border-subtle">
                <div className="flex items-center gap-2.5">
                    {/* Hexagon Logo - same as landing page */}
                    <div className="relative">
                        <Hexagon
                            className="w-8 h-8 text-hive-indigo fill-hive-indigo/10"
                            strokeWidth={1.5}
                        />
                        <Hexagon
                            className="absolute inset-0 w-8 h-8 text-hive-indigo/60 m-auto scale-50"
                            strokeWidth={2}
                        />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight text-hive-text-primary">
                            HIVE<span className="text-hive-indigo">-R</span>
                        </span>
                    )}
                </div>

                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-lg"
                    onClick={onToggle}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            {/* ── Main Navigation ── */}
            <div className="flex-1 py-4 px-3 overflow-y-auto">
                {/* Platform Section */}
                <div className="mb-6">
                    {!collapsed && (
                        <h4 className="text-xs font-medium text-hive-text-tertiary uppercase tracking-wider mb-3 px-3">
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
                            icon={Settings}
                            label="Settings"
                            active={activePath === 'settings'}
                            collapsed={collapsed}
                            onClick={() => onNavigate('/settings')}
                        />
                    </nav>
                </div>

                {/* Divider */}
                {!collapsed && <div className="mx-3 my-6 h-px bg-hive-border-subtle" />}

                {/* Sessions Section */}
                <div>
                    {!collapsed && (
                        <div className="flex items-center justify-between mb-4 px-3">
                            <h4 className="text-xs font-medium text-hive-text-tertiary uppercase tracking-wider">
                                Sessions
                            </h4>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-lg"
                                onClick={onNewSession}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <nav className="space-y-1">
                        {sessions.length === 0 && !collapsed && (
                            <p className="text-xs text-hive-text-tertiary py-2 px-3">No sessions yet</p>
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
            </div>

            {/* ── Footer ── */}
            <div className="p-3 border-t border-hive-border-subtle">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full h-11 justify-start text-hive-text-secondary hover:text-hive-error hover:bg-hive-error/10 transition-all rounded-lg px-3",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <LogOut className={cn("h-[18px] w-[18px]", !collapsed && "mr-3")} />
                    {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
                </Button>
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
                "relative w-full flex items-center h-12 px-4 gap-4 rounded-lg transition-all duration-200",
                active
                    ? "text-hive-text-primary bg-hive-surface/30"
                    : "text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/30",
                collapsed && "justify-center px-0 gap-0"
            )}
        >
            <Icon className={cn(
                "w-5 h-5 shrink-0 flex-none",
                active && "text-hive-indigo"
            )} />
            {!collapsed && (
                <>
                    <span className="truncate text-sm font-medium">{label}</span>
                    {/* Active indicator - honey bar like landing page */}
                    {active && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-hive-honey rounded-l-full" />
                    )}
                </>
            )}
        </button>
    )
}
