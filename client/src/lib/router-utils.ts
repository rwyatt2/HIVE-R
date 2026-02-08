/**
 * Router Utilities
 * 
 * Prefetching helpers for route code splitting.
 */

// Map routes to their module imports for prefetching
const routeModules: Record<string, () => Promise<unknown>> = {
    '/': () => import('../pages/LandingPage'),
    '/app': () => import('../App'),
    '/dashboard': () => import('../pages/DashboardPage'),
    '/billing': () => import('../pages/BillingPage'),
    '/organization': () => import('../pages/OrganizationPage'),
    '/settings': () => import('../pages/SettingsPage'),
    '/docs': () => import('../components/Docs'),
};

// Cache for prefetched routes
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's code chunk.
 * Call this on hover/focus of navigation links.
 */
export function prefetchRoute(path: string): void {
    // Normalize path
    const parts = path.split('?');
    const route = parts[0] ?? path;

    // Skip if already prefetched
    if (prefetchedRoutes.has(route)) return;

    // Find matching route module
    const moduleLoader = routeModules[route];
    if (moduleLoader) {
        prefetchedRoutes.add(route);
        // Start loading the chunk (fire and forget)
        moduleLoader().catch(() => {
            // Remove from cache on error so it can retry
            prefetchedRoutes.delete(route);
        });
    }
}

/**
 * Prefetch multiple routes at once.
 * Useful for prefetching likely next routes.
 */
export function prefetchRoutes(paths: string[]): void {
    paths.forEach(prefetchRoute);
}

/**
 * Check if a route has been prefetched.
 */
export function isRoutePrefetched(path: string): boolean {
    const parts = path.split('?');
    return prefetchedRoutes.has(parts[0] ?? path);
}
