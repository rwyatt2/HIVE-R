/**
 * TopNav — Studio Top Navigation
 * 
 * Uses the same design system as the landing page NavBar
 */

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { User, Bell, Search, Menu, Hexagon } from "lucide-react"

interface TopNavProps {
    onMenuClick?: () => void
    showLogo?: boolean
}

export function TopNav({ onMenuClick, showLogo = false }: TopNavProps) {
    return (
        <div className="sticky top-0 left-0 right-0 z-30 flex items-center h-[72px] px-4 md:px-6 bg-hive-bg-dark/80 backdrop-blur-xl border-b border-hive-border-subtle">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-10 w-10 text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-lg"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {showLogo && (
                    <div className="flex items-center gap-2.5 md:hidden">
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
                    </div>
                )}
            </div>

            {/* Center - Search */}
            <div className="flex-1 flex justify-center px-4 md:px-8">
                <div className="relative w-full max-w-lg hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-hive-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search agents, tasks, or docs..."
                        className="w-full h-11 pl-10 pr-4 rounded-lg bg-hive-surface/30 border border-hive-border-subtle focus:border-hive-indigo/50 focus:ring-1 focus:ring-hive-indigo/30 text-sm transition-all outline-none text-hive-text-primary placeholder:text-hive-text-tertiary"
                    />
                </div>
            </div>

            {/* Right - Actions & Profile */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 text-hive-text-secondary hover:text-hive-text-primary hover:bg-hive-surface/50 rounded-lg"
                >
                    <Bell className="h-[18px] w-[18px]" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-hive-honey rounded-full ring-2 ring-hive-bg-dark" />
                </Button>

                <div className="h-6 w-px bg-hive-border-subtle mx-1 hidden md:block" />

                <Button
                    variant="ghost"
                    className={cn(
                        "gap-3 pl-2 pr-4 h-11 rounded-full",
                        "border border-hive-border-subtle hover:border-hive-indigo/30",
                        "hover:bg-hive-surface/30 transition-all"
                    )}
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-gradient flex items-center justify-center text-sm font-bold text-white ring-2 ring-hive-indigo/30">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="hidden md:block text-sm font-medium text-hive-text-primary">Founder</span>
                </Button>
            </div>
        </div>
    )
}
