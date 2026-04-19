export default function NiterminLogo({ variant = 'lockup', className = '', markClassName = '', wordClassName = '', dotClassName = '' }) {
    if (variant === 'mark') {
        return (
            <svg
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
                aria-hidden="true"
            >
                <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
                    <circle cx="32" cy="32" r="27" />
                    <line x1="20" y1="46" x2="44" y2="18" />
                    <line x1="32" y1="11" x2="32" y2="14" />
                    <line x1="32" y1="50" x2="32" y2="53" />
                </g>
            </svg>
        );
    }

    return (
        <span className={`inline-flex items-center gap-3 ${className}`}>
            <svg
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                className={markClassName || 'h-9 w-9 text-on-surface'}
                aria-hidden="true"
            >
                <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
                    <circle cx="32" cy="32" r="27" />
                    <line x1="20" y1="46" x2="44" y2="18" />
                    <line x1="32" y1="11" x2="32" y2="14" />
                    <line x1="32" y1="50" x2="32" y2="53" />
                </g>
            </svg>
            <span className={wordClassName || 'text-lg font-semibold tracking-tight text-on-surface'}>
                nitermin<span className={dotClassName || 'text-on-surface-variant'}>.</span>
            </span>
        </span>
    );
}
