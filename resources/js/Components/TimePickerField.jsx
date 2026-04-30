import { useEffect, useRef } from 'react';
import { TimepickerUI } from 'timepicker-ui';

export default function TimePickerField({ value, onChange, className = '' }) {
    const inputRef = useRef(null);
    const pickerRef = useRef(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!inputRef.current) return undefined;

        const picker = new TimepickerUI(inputRef.current, {
            clock: { type: '24h', incrementMinutes: 15, incrementHours: 1 },
            ui: {
                mode: 'compact-wheel',
                theme: 'basic',
                mobile: true,
                editable: false,
                clearButton: false,
            },
            callbacks: {
                onConfirm: () => {
                    const selected = picker.getValue();
                    if (typeof selected === 'string' && selected.length >= 5) {
                        onChangeRef.current(selected.slice(0, 5));
                    }
                },
            },
        });

        picker.create();
        pickerRef.current = picker;

        if (value) {
            picker.setValue(String(value).slice(0, 5));
        }

        return () => {
            picker.destroy();
            pickerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const picker = pickerRef.current;
        if (!picker || !value) return;
        const next = String(value).slice(0, 5);
        if (typeof picker.getValue === 'function' && picker.getValue() !== next) {
            picker.setValue(next);
        }
    }, [value]);

    return (
        <input
            ref={inputRef}
            type="text"
            value={value || ''}
            readOnly
            onChange={() => {}}
            className={`schedule-timepicker-input w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface focus:ring-2 focus:ring-surface-tint ${className}`.trim()}
        />
    );
}
