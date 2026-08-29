/**
 * Per-employee calendar colours, ported 1:1 from the web's
 * `resources/js/utils/employeeCalendarColor.js` so a staff member is the same
 * colour in both apps. There is no DB column — assignment is roster order by id.
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

export interface EmployeeColor {
  swatch: string;
  bg: string;
  border: string;
  text: string;
}

function rgbaFromHex(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const PALETTE: EmployeeColor[] = [...CORE_COLORS, ...EXTRA_COLORS].map((hex) => ({
  swatch: hex,
  // Same colour family with a light tint: clean UI + stronger category recognition.
  bg: rgbaFromHex(hex, 0.18),
  border: hex,
  text: '#111827',
}));

export type EmployeeColorMap = Map<number, EmployeeColor>;

export function buildEmployeeColorMap(employees: { id: number }[] | undefined | null): EmployeeColorMap {
  const map: EmployeeColorMap = new Map();
  if (!Array.isArray(employees)) return map;

  [...employees]
    .filter((e) => e != null && Number.isFinite(Number(e.id)))
    .sort((a, b) => Number(a.id) - Number(b.id))
    .forEach((e, index) => {
      map.set(Number(e.id), PALETTE[index % PALETTE.length]);
    });

  return map;
}

export function getEmployeeSlotStyles(
  map: EmployeeColorMap | undefined,
  employeeId: number | string | null | undefined,
): EmployeeColor {
  const id = Number(employeeId);
  if (!Number.isFinite(id)) return PALETTE[0];
  return map?.get(id) ?? PALETTE[0];
}
