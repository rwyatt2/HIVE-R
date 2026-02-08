/**
 * Contrast Dev Tool
 * 
 * Development tool for checking color contrast (only visible in dev mode).
 */

import { useState } from 'react';
import { Eye, Check, X as XIcon } from 'lucide-react';
import { checkContrast, auditColorPalette } from '../lib/contrastChecker';

export function ContrastDevTool() {
    const [isOpen, setIsOpen] = useState(false);
    const [foreground, setForeground] = useState('#f1f5f9');
    const [background, setBackground] = useState('#0f172a');
    const [isLargeText, setIsLargeText] = useState(false);

    // Only show in development
    if (import.meta.env.PROD) return null;

    const result = checkContrast(foreground, background, isLargeText);
    const auditResults = auditColorPalette();

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-[9999] p-3 bg-void-800 border border-white/10 rounded-full shadow-lg hover:bg-void-700 transition-colors"
                title="Contrast Checker"
            >
                <Eye className="w-5 h-5 text-starlight-300" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-[9999] w-80 bg-void-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Contrast Checker
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-starlight-400 hover:text-white">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Color Inputs */}
            <div className="p-3 space-y-3">
                <div className="flex gap-3">
                    <label className="flex-1">
                        <span className="text-xs text-starlight-400 block mb-1">Foreground</span>
                        <input
                            type="color"
                            value={foreground}
                            onChange={e => setForeground(e.target.value)}
                            className="w-full h-8 rounded cursor-pointer"
                        />
                    </label>
                    <label className="flex-1">
                        <span className="text-xs text-starlight-400 block mb-1">Background</span>
                        <input
                            type="color"
                            value={background}
                            onChange={e => setBackground(e.target.value)}
                            className="w-full h-8 rounded cursor-pointer"
                        />
                    </label>
                </div>

                <label className="flex items-center gap-2 text-sm text-starlight-300">
                    <input
                        type="checkbox"
                        checked={isLargeText}
                        onChange={e => setIsLargeText(e.target.checked)}
                        className="rounded"
                    />
                    Large text (18pt+ or 14pt+ bold)
                </label>

                {/* Preview */}
                <div
                    className="p-4 rounded-lg text-center"
                    style={{ background, color: foreground, fontSize: isLargeText ? '18pt' : '14px' }}
                >
                    Sample Text
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-void-800 rounded p-2">
                        <div className="text-lg font-bold text-white">{result.ratio.toFixed(1)}:1</div>
                        <div className="text-xs text-starlight-400">Ratio</div>
                    </div>
                    <div className={`rounded p-2 ${result.passesAA ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        <div className="text-lg">{result.passesAA ? <Check className="w-5 h-5 mx-auto text-emerald-400" /> : <XIcon className="w-5 h-5 mx-auto text-red-400" />}</div>
                        <div className="text-xs text-starlight-400">AA</div>
                    </div>
                    <div className={`rounded p-2 ${result.passesAAA ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        <div className="text-lg">{result.passesAAA ? <Check className="w-5 h-5 mx-auto text-emerald-400" /> : <XIcon className="w-5 h-5 mx-auto text-red-400" />}</div>
                        <div className="text-xs text-starlight-400">AAA</div>
                    </div>
                </div>
            </div>

            {/* Audit Results */}
            <details className="border-t border-white/10">
                <summary className="p-3 text-sm text-starlight-300 cursor-pointer hover:bg-void-800">
                    Palette Audit
                </summary>
                <div className="p-3 pt-0 space-y-1 max-h-40 overflow-y-auto">
                    {auditResults.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-starlight-400">{r.name}</span>
                            <span className={`flex items-center gap-1 ${r.passesAA ? 'text-emerald-400' : 'text-red-400'}`}>
                                {r.ratio} {r.passesAA ? '✓' : '✗'}
                            </span>
                        </div>
                    ))}
                </div>
            </details>
        </div>
    );
}

export default ContrastDevTool;
