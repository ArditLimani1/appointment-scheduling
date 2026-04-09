/**
 * Per-employee calendar colors (no DB column). Inline hex for Tailwind-independent scanning.
 * Palette order = nicest first; assignment uses roster order so small teams get the best colors.
 */

const PALETTE = [
    { swatch: '#2563eb', bg: '#dbeafe', border: '#1d4ed8', text: '#1e3a8a' },
    { swatch: '#0891b2', bg: '#cffafe', border: '#0e7490', text: '#164e63' },
    { swatch: '#4f46e5', bg: '#e0e7ff', border: '#4338ca', text: '#312e81' },
    { swatch: '#059669', bg: '#d1fae5', border: '#047857', text: '#064e3b' },
    { swatch: '#0d9488', bg: '#ccfbf1', border: '#0f766e', text: '#134e4a' },
    { swatch: '#7c3aed', bg: '#ede9fe', border: '#5b21b6', text: '#4c1d95' },
    { swatch: '#d97706', bg: '#fef3c7', border: '#b45309', text: '#78350f' },
    { swatch: '#ca8a04', bg: '#fef9c3', border: '#a16207', text: '#713f12' },
    { swatch: '#ea580c', bg: '#ffedd5', border: '#c2410c', text: '#7c2d12' },
    { swatch: '#dc2626', bg: '#fee2e2', border: '#b91c1c', text: '#7f1d1d' },
    { swatch: '#c026d3', bg: '#fae8ff', border: '#a21caf', text: '#701a75' },
    { swatch: '#db2777', bg: '#fce7f3', border: '#be185d', text: '#831843' },
];

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
