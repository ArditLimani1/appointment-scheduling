/** @param {string} ymd */
export function shiftCalendarAnchor(ymd, view, direction) {
    const [y, m, d] = String(ymd).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (view === 'day') {
        dt.setDate(dt.getDate() + direction);
    } else {
        dt.setDate(dt.getDate() + 7 * direction);
    }
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function todayYmd() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
