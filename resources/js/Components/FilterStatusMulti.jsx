import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import Icon from '@/Components/Icon';

/**
 * Multi-select status filter (appointments / calendar).
 * @param {{ label: string, value: string[], onChange: (next: string[]) => void, options: { value: string, label: string }[], minWidthClass?: string }} props
 */
export default function FilterStatusMulti({ label, value, onChange, options, minWidthClass = 'min-w-[160px]' }) {
    const selected = Array.isArray(value) ? value : [];

    const toggle = (optValue) => {
        if (selected.includes(optValue)) {
            if (selected.length <= 1) {
                return;
            }
            onChange(selected.filter((s) => s !== optValue));
        } else {
            onChange([...selected, optValue]);
        }
    };

    const summary =
        selected.length === options.length
            ? 'All statuses'
            : selected
                  .map((v) => options.find((o) => o.value === v)?.label)
                  .filter(Boolean)
                  .join(', ') || 'Select statuses';

    return (
        <div className={`flex flex-col gap-1.5 ${minWidthClass}`}>
            <Popover className="relative">
                <span className="ml-1 block text-[10px] font-bold uppercase tracking-widest text-outline">{label}</span>
                <PopoverButton className="relative flex min-h-[2.75rem] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm leading-5 text-on-surface transition-colors focus:outline-none focus-visible:border-on-surface/20 focus-visible:ring-2 focus-visible:ring-on-surface/10 data-[hover]:border-slate-300">
                    <span className="block truncate">{summary}</span>
                    <Icon name="expand_more" size="text-base" className="shrink-0 text-outline" />
                </PopoverButton>
                <PopoverPanel
                    portal
                    anchor="bottom start"
                    transition
                    className="z-[100] mt-1 w-[var(--button-width)] min-w-[200px] rounded-xl border border-slate-100 bg-white py-2 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                    <ul className="max-h-60 overflow-auto px-1">
                        {options.map((opt) => {
                            const checked = selected.includes(opt.value);
                            return (
                                <li key={opt.value}>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 text-on-surface focus:ring-on-primary-container/30"
                                            checked={checked}
                                            onChange={() => toggle(opt.value)}
                                        />
                                        <span className="font-medium">{opt.label}</span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </PopoverPanel>
            </Popover>
        </div>
    );
}
