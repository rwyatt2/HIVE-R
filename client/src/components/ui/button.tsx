import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-indigo-gradient text-white shadow-neon-indigo/50 hover:shadow-neon-indigo hover:scale-[1.02] hover:tracking-wide",
                secondary:
                    "border-2 border-hive-indigo bg-transparent text-hive-indigo hover:bg-hive-indigo-muted hover:scale-[1.02]",
                ghost:
                    "bg-transparent text-hive-text-secondary hover:bg-hive-indigo-muted hover:text-hive-text-primary",
                destructive:
                    "bg-hive-error text-white hover:bg-hive-error/90 shadow-sm",
                outline:
                    "border border-hive-border bg-transparent text-hive-text-primary hover:bg-hive-surface hover:border-hive-border-light",
                link:
                    "text-hive-indigo underline-offset-4 hover:underline p-0 h-auto",
                gradient:
                    "bg-hero-gradient text-white shadow-lg hover:shadow-neon-indigo hover:scale-[1.02]",
                honey:
                    "bg-honey-gradient text-white shadow-lg hover:shadow-neon-honey hover:scale-[1.02]",
                glass:
                    "glass text-hive-text-primary hover:border-hive-border-bright",
                google:
                    "bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-sm",
            },
            size: {
                default: "h-12 px-6 py-3",
                sm: "h-9 px-4 text-xs rounded-md",
                lg: "h-14 px-8 text-base rounded-lg",
                icon: "h-10 w-10 rounded-lg p-0",
                "icon-sm": "h-8 w-8 rounded-md p-0 text-xs",
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
