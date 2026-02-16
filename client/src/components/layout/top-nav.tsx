/**
 * TopNav — Studio Top Navigation
 * 
 * Enterprise Minimal Design System
 */

import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { SearchInput } from "../ui/search-input"
import { Bell, Menu, Hexagon, Settings, LogOut, ChevronLeft } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"

interface TopNavProps {
    onMenuClick?: () => void
    showLogo?: boolean
    isDemo?: boolean
}

export function TopNav({ onMenuClick, showLogo = false, isDemo = false }: TopNavProps) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!menuRef.current) return
            if (!menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    const handleLogout = async () => {
        await logout()
        navigate("/login")
    }

    return (
        <div className="sticky top-0 left-0 right-0 z-30 flex items-center h-[72px] px-5 md:px-8 bg-background/95 backdrop-blur-xl border-b border-border">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-4 min-w-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {showLogo && (
                    <div className="flex items-center gap-2.5 md:hidden">
                        <div className="relative">
                            <Hexagon
                                className="w-8 h-8 text-foreground fill-foreground/10"
                                strokeWidth={1.5}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Center - Search */}
            <div className="flex-1 flex justify-center px-4 md:px-10 min-w-0">
                <div className="hidden md:block w-full max-w-lg">
                    <SearchInput
                        placeholder="Search agents, tasks, or docs..."
                        aria-label="Search agents, tasks, or docs"
                    />
                </div>
            </div>

            {/* Right - Actions & Profile */}
            <div className="relative flex items-center gap-4 ml-4 shrink-0" ref={menuRef}>
                {isDemo && (
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to landing
                        </Link>
                        <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                            Demo Mode
                        </span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 min-w-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-background shrink-0" aria-hidden />
                </Button>

                <div className="h-6 w-px bg-border hidden md:block" />

                <Button
                    variant="ghost"
                    className={cn(
                        "gap-3.5 pl-3 pr-5 h-11 rounded-full min-w-0",
                        "border border-border hover:bg-secondary transition-all"
                    )}
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                >
                    <div className="w-8 h-8 shrink-0 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                        <span className="text-xs font-semibold">
                            {(user?.email?.charAt(0) || "U").toUpperCase()}
                        </span>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-foreground truncate">
                        {user?.email?.split("@")[0] || "Founder"}
                    </span>
                </Button>

                {menuOpen && (
                    <div
                        role="menu"
                        aria-label="Profile menu"
                        className="absolute right-0 top-[60px] mt-2 w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 z-40"
                    >
                        <button
                            role="menuitem"
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary transition"
                            onClick={() => {
                                navigate("/settings")
                                setMenuOpen(false)
                            }}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </button>
                        <div className="my-1 h-px bg-border" />
                        <button
                            role="menuitem"
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 transition"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
