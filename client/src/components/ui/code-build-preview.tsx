import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Layers, FileCode, CheckCircle2 } from "lucide-react";

interface CodeBuildPreviewProps {
    className?: string;
    stage?: "planning" | "coding" | "review" | "deploy" | "complete";
}

export function CodeBuildPreview({ className, stage = "coding" }: CodeBuildPreviewProps) {
    const [activeLayer, setActiveLayer] = useState(0);

    // Simulate layer building
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveLayer((prev) => (prev + 1) % 4);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const layers = [
        { id: 1, color: "bg-void-800", label: "Infrastructure" },
        { id: 2, color: "bg-void-700", label: "Database" },
        { id: 3, color: "bg-void-600", label: "API Logic" },
        { id: 4, color: "bg-electric-violet/20", label: "Frontend UI", border: "border-electric-violet" },
    ];

    return (
        <div className={cn("relative w-64 h-48 perspective-1000", className)}>
            <div className="absolute inset-0 flex items-center justify-center transform preserve-3d rotate-x-12 rotate-y-12 rotate-z-2">
                {/* Base Plate */}
                <div className="absolute w-40 h-40 bg-void-950 border border-white/10 rounded-lg transform translate-z-[-20px] shadow-2xl opacity-50" />

                {/* Layers */}
                {layers.map((layer, index) => (
                    <div
                        key={layer.id}
                        className={cn(
                            "absolute w-32 h-32 rounded-lg border border-white/5 transition-all duration-700 ease-out flex items-center justify-center backdrop-blur-sm",
                            layer.color,
                            layer.border,
                            index <= activeLayer ? "opacity-100 translate-z-[${index * 20}px]" : "opacity-0 translate-z-0"
                        )}
                        style={{
                            transform: `translateZ(${index * 15}px) translateY(${-index * 2}px)`,
                            opacity: index <= activeLayer ? 1 : 0,
                            transitionDelay: `${index * 200}ms`
                        }}
                    >
                        {index === 3 && <FileCode className="w-8 h-8 text-electric-violet animate-pulse" />}

                        {/* Layer Label */}
                        <div className="absolute -right-24 text-xs font-mono text-starlight-400 bg-black/50 px-2 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
                            {layer.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Badge */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                {stage === 'complete' ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Layers className="w-4 h-4 text-electric-violet animate-spin-slow" />}
                <span className="text-xs font-medium text-starlight-50">
                    {stage === 'complete' ? 'Build Complete' : 'Constructing...'}
                </span>
            </div>
        </div>
    );
}
