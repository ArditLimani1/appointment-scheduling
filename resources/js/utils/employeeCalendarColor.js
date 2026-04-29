/**
 * Per-employee calendar colors (no DB column). Inline hex for Tailwind-independent scanning.
 * Palette order = nicest first; assignment uses roster order so small teams get the best colors.
 */

const CORE_COLORS = [
    '#4F46E5', // Indigo
    '#059669', // Green
    '#DC2626', // Red
    '#D97706', // Orange
    '#0284C7', // Blue
    '#7C3AED', // Purple
    '#DB2777', // Pink
    '#0F766E', // Teal
    '#65A30D', // Lime
    '#92400E', // Brown
];

const EXTRA_COLORS = [
    '#6366F1', // Soft indigo
    '#10B981', // Soft green
    '#F43F5E', // Rose
    '#F59E0B', // Amber
    '#38BDF8', // Light blue
    '#A78BFA', // Light purple
    '#F472B6', // Soft pink
    '#2DD4BF', // Light teal
    '#A3E635', // Light lime
    '#B45309', // Soft brown
];

function hexToRgb(hex) {
    const normalized = String(hex).replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return { r: 79, g: 70, b: 229 };
    }
    const value = parseInt(normalized, 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
}

function rgbaFromHex(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PALETTE = [...CORE_COLORS, ...EXTRA_COLORS].map((hex) => ({
    swatch: hex,
    // Same color family with a light tint: clean UI + stronger category recognition.
    bg: rgbaFromHex(hex, 0.18),
    border: hex,
    text: '#111827',
}));

/**
 * @param {Array<{ id: number }>} employees
 * @returns {Map<number, { swatch: string, bg: string, border: string, text: string }>}
 */
export function buildEmployeeColorMap(employees) {
    const map = new Map();
    if (!Array.isArray(employees)) {
        return map;
    }
    const sorted = [...employees]
        .filter((e) => e != null && Number.isFinite(Number(e.id)))
        .sort((a, b) => Number(a.id) - Number(b.id));

    sorted.forEach((e, idx) => {
        map.set(Number(e.id), PALETTE[idx % PALETTE.length]);
    });

    return map;
}

/**
 * @param {Map<number, { swatch: string, bg: string, border: string, text: string }>} map
 * @param {number|string|null|undefined} employeeId
 */
export function getEmployeeSlotStyles(map, employeeId) {
    const id = Number(employeeId);
    if (!Number.isFinite(id)) {
        return PALETTE[0];
    }
    if (map && map.has(id)) {
        return map.get(id);
    }
    return PALETTE[0];
}
