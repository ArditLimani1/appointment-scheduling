import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import Icon from '@/Components/Icon';

/**
 * Custom listbox for filter bars — native <select> dropdown panels cannot be styled in most browsers.
 */
export default function FilterListbox({ label, value, onChange, options, minWidthClass = 'min-w-[160px]' }) {
    const selected = options.find((o) => o.value === value);
    const display = selected?.label ?? '—';

    return (
        <div className={`flex-1 ${minWidthClass}`}>
            <Listbox value={value} onChange={onChange}>
                <Label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-1">{label}</Label>
                <div className="relative">
                    <ListboxButton className="relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left text-sm text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-on-primary-container/20 data-[hover]:border-slate-200">
                        <span className="block truncate">{display}</span>
                        <Icon name="expand_more" size="text-[20px]" className="shrink-0 text-outline" />
                    </ListboxButton>
                    <ListboxOptions
                        portal
                        anchor="bottom start"
                        transition
                        className="z-[100] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        {options.map((opt) => (
                            <ListboxOption
                                key={opt.value === '' ? '__empty' : String(opt.value)}
                                value={opt.value}
                                className="group cursor-pointer px-3 py-2 text-sm text-on-surface data-[focus]:bg-slate-50 data-[selected]:font-semibold data-[selected]:text-on-surface"
                            >
                                <span className="block truncate">{opt.label}</span>
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>
        </div>
    );
}
