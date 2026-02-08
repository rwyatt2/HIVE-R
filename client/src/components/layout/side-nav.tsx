import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import {
    LayoutDashboard,
    Users,
    Settings,
    MessageSquare,
    Package,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Plus
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
                "relative flex flex-col h-screen glass border-r border-glass-10 transition-all duration-300 z-40",
                collapsed ? "w-[80px]" : "w-[280px]"
            )}
        >
            {/* Logo Area */}
            <div className="flex items-center h-[72px] px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center bg-electric-gradient rounded-lg clip-path-hexagon shadow-neon-violet">
                        <span className="text-white font-bold text-lg">H</span>
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-xl tracking-tight text-white">
                            HIVE<span className="text-electric-violet">-R</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="px-2 mb-2">
                    {!collapsed && <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Platform</h4>}
                    <nav className="space-y-1">
                        <NavItem icon={LayoutDashboard} label="Dashboard" active={activePath === 'dashboard'} collapsed={collapsed} onClick={() => onNavigate('dashboard')} />
                        <NavItem icon={Users} label="Agents" active={activePath === 'agents'} collapsed={collapsed} onClick={() => onNavigate('agents')} />
                        <NavItem icon={Package} label="Plugins" active={activePath === 'plugins'} collapsed={collapsed} onClick={() => onNavigate('plugins')} />
                        <NavItem icon={Settings} label="Settings" active={activePath === 'settings'} collapsed={collapsed} onClick={() => onNavigate('settings')} />
                    </nav>
                </div>

                {/* Sessions / History */}
                <div className="mt-8 px-2">
                    {!collapsed && (
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sessions</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNewSession}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <nav className="space-y-1">
                        {sessions.map(session => (
                            <NavItem
                                key={session.id}
                                icon={MessageSquare}
                                label={session.name || "New Session"}
                                active={currentSessionId === session.id}
                                collapsed={collapsed}
                                onClick={() => onSelectSession(session.id)}
                            />
                        ))}
                    </nav>
                </div>
            </div>

            {/* Footer / User */}
            <div className="p-4 border-t border-white/5">
                <Button
                    variant="ghost"
                    className={cn("w-full justify-start text-muted-foreground hover:text-destructive", collapsed && "justify-center")}
                >
                    <LogOut className="h-5 w-5 mr-2" />
                    {!collapsed && "Sign Out"}
                </Button>
            </div>

            {/* Collapse Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background shadow-md z-50 text-muted-foreground"
                onClick={onToggle}
            >
                {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>
        </div>
    )
}

interface NavItemProps {
    icon: React.ElementType
    label: string
    active?: boolean
    collapsed?: boolean
    onClick?: () => void
    variant?: "default" | "ghost"
}

function NavItem({ icon: Icon, label, active, collapsed, onClick }: NavItemProps) {
    return (
        <Button
            variant={active ? "default" : "ghost"}
            className={cn(
                "w-full justify-start transition-all duration-200",
                active ? "bg-electric-violet/10 text-electric-violet hover:bg-electric-violet/20" : "text-starlight-400 hover:text-starlight-50",
                collapsed && "justify-center px-0"
            )}
            onClick={onClick}
        >
            <Icon className={cn("h-5 w-5", !collapsed && "mr-3", active && "text-electric-violet")} />
            {!collapsed && <span className="truncate">{label}</span>}
            {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-electric-violet shadow-neon-violet" />
            )}
        </Button>
    )
}
