export default function Icon({ name, filled = false, className = '', size = 'text-xl' }) {
    return (
        <span
            className={`material-symbols-outlined ${size} ${className}`}
            style={filled ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
            {name}
        </span>
    );
}
