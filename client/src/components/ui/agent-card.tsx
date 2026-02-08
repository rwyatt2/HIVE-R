// import * as React from "react"
import { cn } from "../../lib/utils"
import { Card, CardHeader, CardContent, CardFooter } from "./card"
import { Badge } from "./badge"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface AgentCardProps {
    name: string
    role: string
    description?: string
    status: "idle" | "active" | "error" | "completed"
    icon: LucideIcon
    progress?: number
    className?: string
}

export function AgentCard({
    name,
    role,
    description,
    status,
    icon: Icon,
    progress,
    className
}: AgentCardProps) {
    // const statusColors = {
    //     idle: "bg-muted text-muted-foreground",
    //     active: "bg-primary text-primary-foreground animate-pulse",
    //     error: "bg-destructive text-destructive-foreground",
    //     completed: "bg-success text-success-foreground"
    // }

    const borderColor = {
        idle: "border-border",
        active: "border-primary/50 shadow-glow-sm",
        error: "border-destructive/50",
        completed: "border-success/50"
    }

    return (
        <Card variant="glass" className={cn("relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02]", borderColor[status], className)}>
            {status === 'active' && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shimmer" />
            )}

            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={cn("p-2 rounded-lg bg-background-elevated/50 backdrop-blur-sm border border-white/5", status === 'active' ? 'text-primary' : 'text-muted-foreground')}>
                    <Icon size={24} />
                </div>
                <div className="flex flex-col">
                    <h3 className="font-semibold text-foreground">{name}</h3>
                    <span className="text-xs text-muted-foreground">{role}</span>
                </div>
                <div className="ml-auto">
                    <Badge variant={status === 'active' ? 'default' : status === 'error' ? 'destructive' : status === 'completed' ? 'success' : 'secondary'} className="capitalize">
                        {status}
                    </Badge>
                </div>
            </CardHeader>

            {description && (
                <CardContent className="pb-4">
                    <p className="text-sm text-foreground-muted line-clamp-2">{description}</p>
                </CardContent>
            )}

            {progress !== undefined && (
                <CardFooter className="pt-0">
                    <div className="w-full h-1.5 bg-background-elevated rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
