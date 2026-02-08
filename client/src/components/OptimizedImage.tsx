/**
 * Optimized Image Component
 * 
 * Lazy loading images with native browser support.
 */

import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    fallback?: string;
    aspectRatio?: string;
}

export function OptimizedImage({
    src,
    alt,
    fallback,
    aspectRatio,
    className = '',
    ...props
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Reset states when src changes
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            {/* Placeholder while loading */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-void-800 animate-pulse" />
            )}

            <img
                ref={imgRef}
                src={hasError && fallback ? fallback : src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                {...props}
            />
        </div>
    );
}

export default OptimizedImage;
