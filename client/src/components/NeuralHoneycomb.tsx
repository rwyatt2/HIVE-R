import React, { useEffect, useRef, useState } from 'react';

let nhInstanceCounter = 0;
let nhActiveGeneration = 0;
const NH_GLOBAL_KEY = "__honeycombActive";

declare global {
    interface Window {
        __honeycombActive?: number;
        __hivePageId?: string;
    }
}

interface Pulse {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    angle: number; // Current movement direction in radians
    speed: number;
    history: { x: number; y: number }[];
    hue: number;
}

export const NeuralHoneycomb: React.FC<{ staticMode?: boolean }> = ({ staticMode = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;
        const runId = "pre-fix";
        const logVersion = "nh_v4_parallax_snap";
        const instanceId = ++nhInstanceCounter;
        const pageId = window.__hivePageId || "unknown";
        const generation = ++nhActiveGeneration;
        let lastMouseLog = 0;
        let lastRenderLog = 0;
        let skippedFrames = 0;
        let isActive = true;
        if (window[NH_GLOBAL_KEY]) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "I", location: 'NeuralHoneycomb.tsx:init', message: 'nh_global_block', data: { instanceId, existing: window[NH_GLOBAL_KEY] }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            return;
        }
        window[NH_GLOBAL_KEY] = instanceId;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "A", location: 'NeuralHoneycomb.tsx:init', message: 'nh_init', data: { instanceId, generation, pageId, logVersion, staticMode, dpr: window.devicePixelRatio, visibility: document.visibilityState }, timestamp: Date.now() }) }).catch(() => { });
        // #endregion

        // Configuration
        const HEX_SIZE = 100; // Even larger honeycombs (was 60, requested larger)
        const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
        const HEX_HEIGHT = 2 * HEX_SIZE;
        const ROW_HEIGHT = 1.5 * HEX_SIZE;
        const PULSE_COUNT = 30; // More pulses for larger grid
        const PULSE_SPEED_BASE = 2.5;
        const TAIL_LENGTH = 25;

        // State
        let width = 0;
        let height = 0;
        let frame = 0;
        
        // Lighting state (lerped mouse)
        let lightX = window.innerWidth / 2;
        let lightY = window.innerHeight / 2;
        const targetLight = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // Pulses
        const pulses: Pulse[] = [];

        // Resize handler (rAF-throttled to prevent resize storm flicker)
        let resizeRaf: number | null = null;
        let pendingSize: { w: number; h: number } | null = null;
        const applyResize = () => {
            if (!pendingSize) {
                resizeRaf = null;
                return;
            }
            const nextW = pendingSize.w;
            const nextH = pendingSize.h;
            const deltaW = Math.abs(nextW - width);
            const deltaH = Math.abs(nextH - height);
            if (deltaW < 2 && deltaH < 2) {
                resizeRaf = null;
                return;
            }
            width = nextW;
            height = nextH;
            canvas.width = width;
            canvas.height = height;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "B", location: 'NeuralHoneycomb.tsx:resize', message: 'nh_resize', data: { instanceId, width, height, canvasWidth: canvas.width, canvasHeight: canvas.height, deltaW, deltaH, dpr: window.devicePixelRatio }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
            resizeRaf = null;
        };
        const handleResize = () => {
            pendingSize = { w: window.innerWidth, h: window.innerHeight };
            if (resizeRaf !== null) return;
            resizeRaf = requestAnimationFrame(applyResize);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        const handleVisibility = () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "K", location: 'NeuralHoneycomb.tsx:visibility', message: 'nh_visibility', data: { instanceId, pageId, visibility: document.visibilityState, hasFocus: document.hasFocus() }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // Mouse move handler (throttled via rAF to prevent UI thrash)
        let mouseRaf: number | null = null;
        let pendingMouse: { x: number; y: number } | null = null;
        const handleMouseMove = (e: MouseEvent) => {
            pendingMouse = { x: e.clientX, y: e.clientY };
            if (mouseRaf !== null) return;
            mouseRaf = requestAnimationFrame(() => {
                if (pendingMouse) {
                    targetLight.x = pendingMouse.x;
                    targetLight.y = pendingMouse.y;
                }
                const now = Date.now();
                if (now - lastMouseLog > 500) {
                    lastMouseLog = now;
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "C", location: 'NeuralHoneycomb.tsx:mousemove', message: 'nh_mouse_rAF', data: { instanceId, pageId, x: targetLight.x, y: targetLight.y }, timestamp: now }) }).catch(() => { });
                    // #endregion
                }
                mouseRaf = null;
            });
        };
        if (!staticMode) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        // Helper: Snap to nearest grid vertex
        const snapToVertex = (x: number, y: number) => {
            const r = Math.floor(Math.random() * (height / ROW_HEIGHT));
            const q = Math.floor(Math.random() * (width / HEX_WIDTH));
            
            const cx = q * HEX_WIDTH + ((r % 2) * HEX_WIDTH / 2);
            const cy = r * ROW_HEIGHT;
            
            const vIndex = Math.floor(Math.random() * 6);
            const angleRad = (Math.PI / 180) * (30 + 60 * vIndex);
            
            return {
                x: cx + HEX_SIZE * Math.cos(angleRad),
                y: cy + HEX_SIZE * Math.sin(angleRad),
                angle: (Math.PI / 180) * (30 + 60 * Math.floor(Math.random() * 6))
            };
        };

        // Initialize pulses
        for (let i = 0; i < PULSE_COUNT; i++) {
            const start = snapToVertex(0, 0);
            pulses.push({
                x: start.x,
                y: start.y,
                targetX: start.x, 
                targetY: start.y,
                angle: start.angle,
                speed: PULSE_SPEED_BASE + Math.random(),
                history: [],
                hue: 270 
            });
        }

        // Animation Loop
        const targetFps = 30;
        const frameInterval = 1000 / targetFps;
        let lastTime = 0;

        const drawFrame = (time: number) => {
            if (generation !== nhActiveGeneration) {
                isActive = false;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "H", location: 'NeuralHoneycomb.tsx:render', message: 'nh_generation_block', data: { instanceId, generation, activeGeneration: nhActiveGeneration }, timestamp: Date.now() }) }).catch(() => { });
                // #endregion
                return;
            }
            if (!isActive) return;
            const renderStart = performance.now();
            if (!staticMode && time - lastTime < frameInterval) {
                skippedFrames += 1;
                animationId = requestAnimationFrame(drawFrame);
                return;
            }
            lastTime = time;
            frame++;

            // Update lighting (Lerp)
            lightX += (targetLight.x - lightX) * 0.1;
            lightY += (targetLight.y - lightY) * 0.1;

            // Parallax offset (snap to whole pixels to avoid shimmer/flicker)
            const parallaxXRaw = (lightX - width / 2) * 0.01;
            const parallaxYRaw = (lightY - height / 2) * 0.01;
            const parallaxX = Math.round(parallaxXRaw);
            const parallaxY = Math.round(parallaxYRaw);

            // Clear Background
            ctx.fillStyle = '#07070a';
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.translate(-parallaxX, -parallaxY);

            // Draw Grid
            ctx.lineWidth = 1.5;
            
            const startRow = -2;
            const endRow = Math.ceil(height / ROW_HEIGHT) + 2;
            const startCol = -2;
            const endCol = Math.ceil(width / HEX_WIDTH) + 2;
            const hexCount = (endRow - startRow) * (endCol - startCol);
            let drawnHexes = 0;
            let minOpacity = 1;
            let maxOpacity = 0;

            for (let r = startRow; r < endRow; r++) {
                for (let q = startCol; q < endCol; q++) {
                    const cx = q * HEX_WIDTH + ((r % 2) * HEX_WIDTH / 2);
                    const cy = r * ROW_HEIGHT;

                    // Breathing effect
                    const noise = Math.sin(q * 0.5 + frame * 0.01) * Math.cos(r * 0.5 + frame * 0.015);
                    const breathingScale = 1 + noise * 0.03;
                    
                    // "Flashlight" effect: almost invisible base, strong reveal near mouse
                    const baseOpacity = 0.005; // Even more subtle base
                    
                    const dist = Math.hypot(cx - lightX, cy - lightY);
                    const lightRadius = 700; // Focused flashlight beam
                    
                    // Sharper falloff for spotlight effect
                    const proximity = Math.max(0, 1 - dist / lightRadius);
                    const lightIntensity = Math.pow(proximity, 3); // Higher power = quicker falloff = less distraction
                    
                    const finalOpacity = baseOpacity + lightIntensity * 0.3; // Less maximum brightness
                    
                    // Organic gradient interpolation based on position
                    // We can use (cx + cy) / (width + height) for a diagonal gradient
                    // Purple: 139, 92, 246 (#8B5CF6)
                    // Honey: 245, 158, 11 (#F59E0B)
                    
                    const normalizedPos = (cx + cy) / (width + height);
                    const rColor = 139 + (245 - 139) * normalizedPos;
                    const gColor = 92 + (158 - 92) * normalizedPos;
                    const bColor = 246 + (11 - 246) * normalizedPos;

                    drawnHexes += 1;
                    if (finalOpacity < minOpacity) minOpacity = finalOpacity;
                    if (finalOpacity > maxOpacity) maxOpacity = finalOpacity;
                    ctx.strokeStyle = `rgba(${Math.round(rColor)}, ${Math.round(gColor)}, ${Math.round(bColor)}, ${finalOpacity})`;
                    ctx.beginPath();
                    const currentRadius = HEX_SIZE * breathingScale;
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 180) * (30 + 60 * i);
                        const vx = cx + currentRadius * Math.cos(angle);
                        const vy = cy + currentRadius * Math.sin(angle);
                        if (i === 0) ctx.moveTo(vx, vy);
                        else ctx.lineTo(vx, vy);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }

            // Update and Draw Pulses
            let pulsesDrawn = 0;
            pulses.forEach(p => {
                const dx = Math.cos(p.angle) * p.speed;
                const dy = Math.sin(p.angle) * p.speed;
                p.x += dx;
                p.y += dy;

                const distToTarget = Math.hypot(p.targetX - p.x, p.targetY - p.y);
                
                if (distToTarget < p.speed) {
                    p.x = p.targetX;
                    p.y = p.targetY;
                    
                    const turn = Math.random() < 0.5 ? 60 : -60;
                    const newAngleDeg = ((p.angle * 180 / Math.PI) + turn);
                    p.angle = (Math.PI / 180) * newAngleDeg;
                    
                    p.targetX = p.x + HEX_SIZE * Math.cos(p.angle);
                    p.targetY = p.y + HEX_SIZE * Math.sin(p.angle);
                    
                    if (p.targetX < -50 || p.targetX > width + 50 || p.targetY < -50 || p.targetY > height + 50) {
                        const start = snapToVertex(Math.random() * width, Math.random() * height);
                        p.x = start.x;
                        p.y = start.y;
                        p.targetX = p.x;
                    }
                }

                p.history.push({ x: p.x, y: p.y });
                if (p.history.length > TAIL_LENGTH) {
                    p.history.shift();
                }

                // Tail drawing removed as requested (purple lines shooting through)
                /*
                if (p.history.length > 1) {
                    const tailGradient = ctx.createLinearGradient(
                        p.history[0].x, p.history[0].y,
                        p.x, p.y
                    );
                    tailGradient.addColorStop(0, 'rgba(192, 132, 252, 0)');
                    tailGradient.addColorStop(1, 'rgba(192, 132, 252, 0.5)'); // More subtle tail
                    
                    ctx.beginPath();
                    ctx.moveTo(p.history[0].x, p.history[0].y);
                    for (let i = 1; i < p.history.length; i++) {
                        ctx.lineTo(p.history[i].x, p.history[i].y);
                    }
                    ctx.strokeStyle = tailGradient;
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
                */

                const distToLight = Math.hypot(p.x - lightX, p.y - lightY);
                // Reveal pulses only when inside or near the flashlight beam
                const proximity = Math.max(0, 1 - distToLight / 800); 
                const bloomSize = 2 + proximity * 4;
                const alpha = proximity * 0.9; // Hide pulses in the dark

                if (alpha > 0.01) {
                    pulsesDrawn += 1;
                    // Draw core
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw Bloom (Glow) - Optimized
                    // Using simple arc with low alpha for bloom effect is much faster than gradients or shadowBlur
                    ctx.fillStyle = `rgba(192, 132, 252, ${alpha * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, bloomSize * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.restore();
            if (time - lastRenderLog > 1000) {
                lastRenderLog = time;
                const renderMs = performance.now() - renderStart;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "D", location: 'NeuralHoneycomb.tsx:render', message: 'nh_render', data: { instanceId, pageId, logVersion, frame, skippedFrames, renderMs, width, height, hexCount, drawnHexes, minOpacity, maxOpacity, pulseCount: PULSE_COUNT, pulsesDrawn, lightX, lightY, parallaxXRaw, parallaxYRaw, parallaxX, parallaxY, visibility: document.visibilityState, hasFocus: document.hasFocus() }, timestamp: Date.now() }) }).catch(() => { });
                // #endregion
                skippedFrames = 0;
            }
            if (!staticMode) {
                animationId = requestAnimationFrame(drawFrame);
            }
        };

        let animationId = 0;
        if (staticMode) {
            drawFrame(0);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "N", location: 'NeuralHoneycomb.tsx:static', message: 'nh_static_draw', data: { instanceId, pageId }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
        } else {
            animationId = requestAnimationFrame(drawFrame);
        }

        return () => {
            isActive = false;
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (mouseRaf !== null) {
                cancelAnimationFrame(mouseRaf);
            }
            if (resizeRaf !== null) {
                cancelAnimationFrame(resizeRaf);
            }
            cancelAnimationFrame(animationId);
            if (window[NH_GLOBAL_KEY] === instanceId) {
                delete window[NH_GLOBAL_KEY];
            }
            if (generation === nhActiveGeneration) {
                nhActiveGeneration = 0;
            }
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/6cb4e89b-0acc-42d2-af40-20ee67361666', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, hypothesisId: "H", location: 'NeuralHoneycomb.tsx:cleanup', message: 'nh_cleanup', data: { instanceId, generation }, timestamp: Date.now() }) }).catch(() => { });
            // #endregion
        };
    }, []);

    // Return ONLY the fixed canvas. UI should be handled by the parent.
    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 block w-full h-full pointer-events-none z-0" 
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
        />
    );
};
