import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    animated,
}: EdgeProps) {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isGradient = data?.variant === 'gradient';
    const strokeColor = isGradient ? '#22c55e' : '#6366F1'; // Green for handoffs, Violet for standard

    return (
        <>
            {/* Base Path (Dim) */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 2,
                    stroke: 'rgba(255, 255, 255, 0.1)', // border-white/10 equivalent
                }}
            />

            {/* Animated Packet Path (Overlay) */}
            {animated && (
                <path
                    id={id}
                    style={{
                        ...style,
                        strokeWidth: 2,
                        stroke: strokeColor,
                        strokeDasharray: '10 10',
                        fill: 'none',
                    }}
                    d={edgePath}
                    className="animate-dash"
                />
            )}

            {/* Optional: Glowing Particle Effect if needed in future, using <circle> along path */}
        </>
    );
}
