export const DEFAULT_EMPLOYEE_START = '09:00';
export const DEFAULT_EMPLOYEE_END = '17:00';
export const DEFAULT_EMPLOYEE_BREAK = { start_time: '12:00', end_time: '13:00' };

export function defaultEmployeeScheduleDay(dayOfWeek) {
    const isWeekday = dayOfWeek >= 0 && dayOfWeek <= 4;

    return {
        day_of_week: dayOfWeek,
        is_active: isWeekday,
        start_time: DEFAULT_EMPLOYEE_START,
        end_time: DEFAULT_EMPLOYEE_END,
        breaks: isWeekday ? [{ ...DEFAULT_EMPLOYEE_BREAK }] : [],
    };
}

export function buildEmployeeScheduleDays(raw) {
    return Array.from({ length: 7 }, (_, i) => {
        const existing = (raw ?? []).find((s) => Number(s.day_of_week) === i);

        if (existing) {
            return {
                day_of_week: i,
                is_active: existing.is_active ?? false,
                start_time: existing.start_time ? String(existing.start_time).slice(0, 5) : DEFAULT_EMPLOYEE_START,
                end_time: existing.end_time ? String(existing.end_time).slice(0, 5) : DEFAULT_EMPLOYEE_END,
                breaks: (existing.breaks ?? []).map((b) => ({
                    start_time: String(b.start_time).slice(0, 5),
                    end_time: String(b.end_time).slice(0, 5),
                })),
            };
        }

        return defaultEmployeeScheduleDay(i);
    });
}
