import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    /** Width of the skeleton (CSS value) */
    width?: string | number;
    /** Height of the skeleton (CSS value) */
    height?: string | number;
    /** Make the skeleton circular */
    circle?: boolean;
    /** Disable animation (respects prefers-reduced-motion by default) */
    animate?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Skeleton loading placeholder component
 * Respects prefers-reduced-motion accessibility setting
 */
export function Skeleton({
    width,
    height,
    circle = false,
    animate = true,
    className = '',
    style,
    ...props
}: SkeletonProps) {
    const baseClasses = 'bg-gray-200';
    const animationClasses = animate ? 'animate-pulse motion-reduce:animate-none' : '';
    const shapeClasses = circle ? 'rounded-full' : 'rounded-lg';

    const computedStyle = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
    };

    return (
        <div
            className={`${baseClasses} ${animationClasses} ${shapeClasses} ${className}`}
            style={computedStyle}
            aria-hidden="true"
            {...props}
        />
    );
}

/**
 * Common skeleton patterns for reuse
 */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height={16}
                    width={i === lines - 1 ? '75%' : '100%'}
                />
            ))}
        </div>
    );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
    return <Skeleton width={size} height={size} circle />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`p-4 border border-gray-200 rounded-xl ${className}`}>
            <Skeleton height={160} className="mb-4" />
            <Skeleton height={20} width="60%" className="mb-2" />
            <SkeletonText lines={2} />
            <div className="flex gap-2 mt-4">
                <Skeleton height={24} width={60} />
                <Skeleton height={24} width={80} />
            </div>
        </div>
    );
}

export function SkeletonProjectCard() {
    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Image placeholder */}
            <Skeleton height={200} className="w-full" />

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <Skeleton height={24} width="80%" className="mb-2" />

                {/* Location */}
                <Skeleton height={16} width="50%" className="mb-3" />

                {/* Tags */}
                <div className="flex gap-2 mb-3">
                    <Skeleton height={24} width={70} />
                    <Skeleton height={24} width={90} />
                </div>

                {/* Host info */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <SkeletonAvatar size={32} />
                    <Skeleton height={16} width={100} />
                </div>
            </div>
        </div>
    );
}

export function SkeletonList({ count = 5, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <SkeletonAvatar size={48} />
                    <div className="flex-1">
                        <Skeleton height={18} width="40%" className="mb-2" />
                        <Skeleton height={14} width="70%" />
                    </div>
                </div>
            ))}
        </div>
    );
}
