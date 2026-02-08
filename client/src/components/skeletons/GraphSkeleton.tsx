/**
 * Graph Skeleton
 * 
 * Loading placeholder for ReactFlow graph.
 */

export function GraphSkeleton() {
    return (
        <div className="w-full h-full bg-void-950 flex items-center justify-center" aria-label="Loading graph">
            <div className="relative w-full max-w-2xl aspect-video">
                {/* Animated nodes */}
                {[
                    { top: '10%', left: '20%', delay: '0s' },
                    { top: '30%', left: '60%', delay: '0.1s' },
                    { top: '60%', left: '30%', delay: '0.2s' },
                    { top: '70%', left: '70%', delay: '0.3s' },
                    { top: '40%', left: '45%', delay: '0.15s' },
                ].map((pos, i) => (
                    <div
                        key={i}
                        className="absolute w-24 h-16 rounded-xl bg-void-800/50 border border-white/[0.06] animate-pulse"
                        style={{
                            top: pos.top,
                            left: pos.left,
                            animationDelay: pos.delay,
                        }}
                    />
                ))}
                {/* Connecting lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <line x1="25%" y1="20%" x2="62%" y2="35%" stroke="currentColor" strokeWidth="1" className="text-white/20" />
                    <line x1="35%" y1="65%" x2="50%" y2="45%" stroke="currentColor" strokeWidth="1" className="text-white/20" />
                    <line x1="72%" y1="75%" x2="50%" y2="45%" stroke="currentColor" strokeWidth="1" className="text-white/20" />
                </svg>
            </div>
        </div>
    );
}

export default GraphSkeleton;
