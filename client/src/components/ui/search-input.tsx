/**
 * SearchInput — Shared search field with left icon
 *
 * Uses the same design tokens as Input (hive-border, hive-surface, hive-indigo focus).
 * Icon lives in its own flex column so placeholder/text never overlaps the icon.
 * Use everywhere (Studio TopNav, landing, etc.) for consistent styling.
 */

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "../../lib/utils"

export interface SearchInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    containerClassName?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, containerClassName, ...props }, ref) => {
        return (
            <div
                className={cn(
                    "flex w-full items-center rounded-lg border border-white/10 bg-void-800/60 transition-all h-11",
                    "hover:border-white/[0.15]",
                    "focus-within:border-electric-violet/50 focus-within:ring-1 focus-within:ring-electric-violet/30 focus-within:ring-offset-0",
                    containerClassName
                )}
            >
                {/* Icon in fixed-width column so input text can never overlap */}
                <span
                    className="flex w-12 min-w-12 shrink-0 items-center justify-center text-starlight-500"
                    aria-hidden
                >
                    <Search className="h-4 w-4" />
                </span>
                <input
                    type="search"
                    ref={ref}
                    className={cn(
                        "flex-1 min-w-0 h-full py-3 pl-2 pr-4 bg-transparent border-0 text-sm text-white placeholder:text-starlight-500 outline-none focus:ring-0",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    {...props}
                />
            </div>
        )
    }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
