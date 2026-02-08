/**
 * Skip Navigation Link
 * 
 * Allows keyboard users to skip to main content.
 */

export function SkipNav() {
    return (
        <a
            href="#main-content"
            className="
                fixed top-0 left-0 z-[10000] 
                px-4 py-2 bg-electric-violet text-white font-medium
                rounded-br-lg shadow-lg
                transform -translate-y-full focus:translate-y-0
                transition-transform duration-200
                outline-none focus:ring-2 focus:ring-white
            "
        >
            Skip to main content
        </a>
    );
}

export default SkipNav;
