/**
 * Password Strength Indicator
 * 
 * Visual component showing password strength with:
 * - 4-segment strength meter
 * - Requirements checklist
 * - Real-time validation
 */

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
    password: string;
    showRequirements?: boolean;
}

interface PasswordRequirement {
    label: string;
    met: boolean;
}

export function usePasswordStrength(password: string) {
    return useMemo(() => {
        const requirements: PasswordRequirement[] = [
            { label: 'At least 8 characters', met: password.length >= 8 },
            { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
            { label: 'One number', met: /[0-9]/.test(password) },
            { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        ];

        const metCount = requirements.filter(r => r.met).length;

        let strength: 'weak' | 'fair' | 'good' | 'strong';
        let color: string;

        if (metCount <= 1) {
            strength = 'weak';
            color = 'bg-red-500';
        } else if (metCount === 2) {
            strength = 'fair';
            color = 'bg-orange-500';
        } else if (metCount === 3) {
            strength = 'good';
            color = 'bg-yellow-500';
        } else {
            strength = 'strong';
            color = 'bg-emerald-500';
        }

        const isValid = requirements.slice(0, 3).every(r => r.met); // First 3 are required

        return { requirements, metCount, strength, color, isValid };
    }, [password]);
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
    const { requirements, metCount, strength, color } = usePasswordStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Strength meter */}
            <div className="space-y-1.5">
                <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < metCount ? color : 'bg-white/10'
                                }`}
                        />
                    ))}
                </div>
                <p className={`text-xs font-medium capitalize ${strength === 'weak' ? 'text-red-400' :
                        strength === 'fair' ? 'text-orange-400' :
                            strength === 'good' ? 'text-yellow-400' :
                                'text-emerald-400'
                    }`}>
                    {strength} password
                </p>
            </div>

            {/* Requirements checklist */}
            {showRequirements && (
                <ul className="space-y-1">
                    {requirements.map((req, i) => (
                        <li
                            key={i}
                            className={`flex items-center gap-2 text-xs transition-colors ${req.met ? 'text-emerald-400' : 'text-starlight-500'
                                }`}
                        >
                            {req.met ? (
                                <Check className="w-3.5 h-3.5" />
                            ) : (
                                <X className="w-3.5 h-3.5" />
                            )}
                            {req.label}
                            {i < 3 && <span className="text-starlight-600 text-[10px]">(required)</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
