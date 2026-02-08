// import * as React from "react"
// import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { User, Bell, Search, Menu } from "lucide-react"

interface TopNavProps {
    onMenuClick?: () => void
    showLogo?: boolean
}

export function TopNav({ onMenuClick, showLogo = false }: TopNavProps) {
    return (
        <div className="sticky top-0 left-0 right-0 z-30 flex items-center h-[72px] px-6 glass border-b border-glass-10">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>

                {showLogo && (
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="flex items-center justify-center w-8 h-8 bg-electric-gradient rounded-lg clip-path-hexagon">
                            <span className="text-white font-bold">H</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Center - Search (Optional) or Breadcrumbs */}
            <div className="flex-1 px-4 md:px-8">
                <div className="relative max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search agents, tasks, or docs..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-void-900/50 border border-input focus:border-electric-violet focus:ring-1 focus:ring-electric-violet/50 text-sm transition-all outline-none text-starlight-50 placeholder:text-starlight-700"
                    />
                </div>
            </div>

            {/* Right - Actions & Profile */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative text-starlight-400 hover:text-starlight-50">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-electric-violet rounded-full animate-pulse" />
                </Button>
                <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />
                <Button variant="ghost" className="gap-2 pl-2 pr-4 rounded-full border border-transparent hover:border-border hover:bg-void-800/50">
                    <div className="w-8 h-8 rounded-full bg-electric-gradient flex items-center justify-center text-white ring-2 ring-void-950">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">Founder</span>
                </Button>
            </div>
        </div>
    )
}
