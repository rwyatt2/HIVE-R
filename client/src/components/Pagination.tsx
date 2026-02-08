/**
 * Pagination UI Component
 * 
 * Navigation controls for paginated data.
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    /** Current page (0-indexed) */
    page: number;
    /** Total number of items */
    total: number;
    /** Items per page */
    limit: number;
    /** Has next page */
    hasNext: boolean;
    /** Has previous page */
    hasPrev: boolean;
    /** Callback for page change */
    onPageChange: (page: number) => void;
    /** Optional: Show page numbers */
    showPageNumbers?: boolean;
    /** Optional: className */
    className?: string;
}

export function Pagination({
    page,
    total,
    limit,
    hasNext,
    hasPrev,
    onPageChange,
    showPageNumbers = true,
    className = '',
}: PaginationProps) {
    const totalPages = Math.ceil(total / limit);
    const startItem = page * limit + 1;
    const endItem = Math.min((page + 1) * limit, total);

    if (total === 0) return null;

    return (
        <div className={`flex items-center justify-between gap-4 ${className}`}>
            {/* Item count */}
            <div className="text-sm text-starlight-400">
                Showing <span className="font-medium text-white">{startItem}</span>
                {' - '}
                <span className="font-medium text-white">{endItem}</span>
                {' of '}
                <span className="font-medium text-white">{total}</span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => onPageChange(0)}
                    disabled={!hasPrev}
                    className="p-2 rounded-lg text-starlight-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="First page"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrev}
                    className="p-2 rounded-lg text-starlight-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page indicator */}
                {showPageNumbers && (
                    <div className="px-3 py-1.5 text-sm">
                        <span className="font-medium text-white">{page + 1}</span>
                        <span className="text-starlight-400"> / {totalPages}</span>
                    </div>
                )}

                {/* Next page */}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNext}
                    className="p-2 rounded-lg text-starlight-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                    onClick={() => onPageChange(totalPages - 1)}
                    disabled={!hasNext}
                    className="p-2 rounded-lg text-starlight-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Last page"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default Pagination;
