/**
 * TopNav — Studio Top Navigation
 * 
 * Uses the same design system as the landing page NavBar
 */

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { SearchInput } from "../ui/search-input"
import { Bell, Menu, Hexagon, Settings, LogOut } from "lucide-react"
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
        <div className="sticky top-0 left-0 right-0 z-30 flex items-center h-[72px] px-5 md:px-8 bg-void-900/70 backdrop-blur-xl border-b border-white/6">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-4 min-w-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-10 w-10 text-starlight-400 hover:text-white hover:bg-white/6 rounded-lg"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {showLogo && (
                    <div className="flex items-center gap-2.5 md:hidden">
                        {/* Hexagon Logo - same as landing page */}
                        <div className="relative">
                            <Hexagon
                                className="w-8 h-8 text-electric-violet fill-electric-violet/10"
                                strokeWidth={1.5}
                            />
                            <Hexagon
                                className="absolute inset-0 w-8 h-8 text-electric-violet/60 m-auto scale-50"
                                strokeWidth={2}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Center - Search (shared SearchInput: same design system as landing/Input, icon never overlaps text) */}
            <div className="flex-1 flex justify-center px-4 md:px-10 min-w-0">
                <div className="hidden md:block w-full max-w-lg">
                    <SearchInput
                        placeholder="Search agents, tasks, or docs..."
                        aria-label="Search agents, tasks, or docs"
                    />
                </div>
            </div>

            {/* Right - Actions & Profile (breathing room from edge) */}
            <div className="relative flex items-center gap-4 ml-4 shrink-0" ref={menuRef}>
                {isDemo && (
                    <span className="hidden md:inline-flex items-center rounded-full border border-honey/30 bg-honey/10 px-3 py-1 text-xs font-semibold text-honey">
                        Demo Mode
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 min-w-10 rounded-lg text-starlight-400 hover:text-white hover:bg-white/6"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-honey rounded-full ring-2 ring-void-950 shrink-0" aria-hidden />
                </Button>

                <div className="h-6 w-px bg-white/10 hidden md:block" />

                <Button
                    variant="ghost"
                    className={cn(
                        "gap-3.5 pl-3 pr-5 h-11 rounded-full min-w-0",
                        "border border-white/10 hover:border-white/20",
                        "hover:bg-white/6 transition-all"
                    )}
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                >
                    <div className="w-8 h-8 shrink-0 rounded-full bg-linear-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10">
                        <span className="text-xs font-semibold">
                            {(user?.email?.charAt(0) || "U").toUpperCase()}
                        </span>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-white truncate">
                        {user?.email?.split("@")[0] || "Founder"}
                    </span>
                </Button>

                {menuOpen && (
                    <div
                        role="menu"
                        aria-label="Profile menu"
                        className="absolute right-5 md:right-8 top-[72px] mt-2 w-56 rounded-2xl border border-white/10 bg-void-900/95 backdrop-blur-xl shadow-2xl p-2 z-40"
                    >
                        <button
                            role="menuitem"
                            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-starlight-300 hover:text-white hover:bg-white/6 transition"
                            onClick={() => {
                                navigate("/settings")
                                setMenuOpen(false)
                            }}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </button>
                        <div className="my-2 h-px bg-white/6" />
                        <button
                            role="menuitem"
                            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-reactor-red hover:bg-reactor-red/10 transition"
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
