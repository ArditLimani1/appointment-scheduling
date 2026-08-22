import { todayYmd } from '@/utils/calendarNavigation';

/**
 * Elapsed days fall out of the calendar view. A range that is entirely in the past
 * (reached by explicit back-navigation) is left intact — otherwise there would be
 * nothing to navigate back to.
 *
 * @param {string[]} columnDates YYYY-MM-DD, ascending
 * @param {string} [todayStr] YYYY-MM-DD
 * @returns {string[]}
 */
export function trimPastColumnDates(columnDates, todayStr = todayYmd()) {
    if (!Array.isArray(columnDates) || columnDates.length === 0) {
        return [];
    }
    const remaining = columnDates.filter((d) => d >= todayStr);
    return remaining.length > 0 ? remaining : columnDates;
}
