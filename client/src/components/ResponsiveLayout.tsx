import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileNav, BottomNav } from './MobileNav';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
    showNav?: boolean;
}

export function ResponsiveLayout({ children, showNav = true }: ResponsiveLayoutProps) {
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'sm';

    return (
        <div className={`app-layout app-layout--${breakpoint}`}>
            {showNav && (
                <>
                    <MobileNav />
                    <BottomNav />
                </>
            )}

            <main className={isMobile ? 'pb-20 pt-16' : ''}>
                {children}
            </main>
        </div>
    );
}

// Responsive container with max-width constraints
export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl ${className}`}>
            {children}
        </div>
    );
}

// Responsive grid that adapts to screen size
export function ResponsiveGrid({
    children,
    cols = { sm: 1, md: 2, lg: 3, xl: 4 },
    gap = 4,
    className = '',
}: {
    children: React.ReactNode;
    cols?: { sm?: number; md?: number; lg?: number; xl?: number };
    gap?: number;
    className?: string;
}) {
    const colClasses = [
        `grid-cols-${cols.sm ?? 1}`,
        cols.md ? `md:grid-cols-${cols.md}` : '',
        cols.lg ? `lg:grid-cols-${cols.lg}` : '',
        cols.xl ? `xl:grid-cols-${cols.xl}` : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={`grid gap-${gap} ${colClasses} ${className}`}>
            {children}
        </div>
    );
}

// Show/hide based on breakpoint
export function ShowOnMobile({ children }: { children: React.ReactNode }) {
    const breakpoint = useBreakpoint();
    if (breakpoint !== 'sm') return null;
    return <>{children}</>;
}

export function HideOnMobile({ children }: { children: React.ReactNode }) {
    const breakpoint = useBreakpoint();
    if (breakpoint === 'sm') return null;
    return <>{children}</>;
}

export function ShowOnDesktop({ children }: { children: React.ReactNode }) {
    const breakpoint = useBreakpoint();
    if (breakpoint === 'sm' || breakpoint === 'md') return null;
    return <>{children}</>;
}
