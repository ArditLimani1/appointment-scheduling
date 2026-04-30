import { useEffect, useMemo, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';
import { TimepickerUI } from 'timepicker-ui';
import 'timepicker-ui/index.css';

function normalizeHm(value) {
    if (!value) return '';
    const raw = String(value).trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return '';
    const h = Math.max(0, Math.min(23, parseInt(match[1], 10)));
    const m = Math.max(0, Math.min(59, parseInt(match[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function TimeInputPicker({
    value,
    onChange,
    className = '',
    ariaLabel,
    disabled = false,
}) {
    const { localeBcp47, locale } = usePage().props;
    const inputRef = useRef(null);
    const pickerRef = useRef(null);
    const isSq = String(localeBcp47 || locale || '').toLowerCase().startsWith('sq');

    const options = useMemo(
        () => ({
            ui: {
                theme: 'basic',
                mobile: true,
                cssClass: 'app-timepicker',
            },
            clock: {
                type: '24h',
            },
            labels: isSq
                ? {
                    ok: 'Ruaj',
                    cancel: 'Anulo',
                    clear: 'Pastro',
                    time: 'Zgjidh orën',
                    mobileTime: 'Vendos orën',
                    mobileHour: 'Ora',
                    mobileMinute: 'Minuta',
                }
                : {
                    ok: 'Save',
                    cancel: 'Cancel',
                    clear: 'Clear',
                    time: 'Select time',
                    mobileTime: 'Enter time',
                    mobileHour: 'Hour',
                    mobileMinute: 'Minute',
                },
        }),
        [isSq],
    );

    useEffect(() => {
        if (!inputRef.current || disabled) return undefined;

        const picker = new TimepickerUI(inputRef.current, options);
        picker.create();

        const syncValue = () => {
            const next = normalizeHm(picker.getValue()?.time);
            if (next) onChange(next);
        };

        picker.on('confirm', syncValue);
        pickerRef.current = picker;

        return () => {
            picker.destroy({ keepInputValue: true });
            pickerRef.current = null;
        };
    }, [disabled, onChange, options]);

    useEffect(() => {
        if (!pickerRef.current || disabled) return;
        const next = normalizeHm(value);
        if (!next) return;
        pickerRef.current.setValue(next, true);
    }, [value, disabled]);

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={normalizeHm(value)}
                onChange={(e) => onChange(normalizeHm(e.target.value))}
                onFocus={() => pickerRef.current?.open()}
                aria-label={ariaLabel}
                disabled={disabled}
                className={`${className} pr-9`}
            />
            <button
                type="button"
                onClick={() => pickerRef.current?.open()}
                disabled={disabled}
                className="absolute inset-y-0 right-2 inline-flex items-center text-on-surface-variant"
                tabIndex={-1}
                aria-hidden="true"
            >
                <Icon name="schedule" size="text-base" />
            </button>
        </div>
    );
}
