import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-violet/40 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_0_24px_rgba(99,102,241,0.22)] hover:shadow-[0_0_36px_rgba(99,102,241,0.32)] hover:-translate-y-0.5",
                secondary:
                    "bg-white/[0.04] border border-white/[0.1] text-starlight-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15]",
                ghost:
                    "bg-transparent text-starlight-400 hover:text-white hover:bg-white/[0.06]",
                destructive:
                    "bg-reactor-red text-white hover:bg-reactor-red/90 shadow-sm",
                outline:
                    "border border-white/[0.1] bg-transparent text-white hover:bg-white/[0.06] hover:border-white/[0.15]",
                link:
                    "text-electric-violet underline-offset-4 hover:underline p-0 h-auto",
                gradient:
                    "bg-hero-gradient text-white shadow-[0_0_24px_rgba(99,102,241,0.22)] hover:shadow-[0_0_36px_rgba(99,102,241,0.32)] hover:-translate-y-0.5",
                honey:
                    "bg-honey-gradient text-white shadow-[0_0_20px_rgba(245,158,11,0.22)] hover:shadow-[0_0_30px_rgba(245,158,11,0.32)] hover:-translate-y-0.5",
                glass:
                    "bg-void-900/40 backdrop-blur-xl border border-white/10 text-white hover:border-white/[0.15]",
                google:
                    "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-sm",
            },
            size: {
                default: "h-12 px-6 py-3",
                sm: "h-9 px-4 text-xs rounded-lg",
                lg: "h-14 px-8 text-base rounded-xl",
                icon: "h-10 w-10 rounded-lg p-0",
                "icon-sm": "h-9 w-9 rounded-lg p-0 text-xs",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
