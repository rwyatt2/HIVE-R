import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <div className="relative group">
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-lg border border-white/10 bg-void-800/60 px-4 py-3 text-sm text-white ring-offset-background transition-all duration-200",
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        "placeholder:text-starlight-500",
                        "hover:border-white/15",
                        "focus-visible:outline-none focus-visible:border-electric-violet/50 focus-visible:ring-2 focus-visible:ring-electric-violet/30 focus-visible:ring-offset-0",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {/* Hexagonal corner accent on focus */}
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-hive-indigo rounded-tr-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
