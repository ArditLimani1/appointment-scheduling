import { useMemo } from 'react';
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import Icon from '@/Components/Icon';

const defaultButtonClass = (btnPad, compact) =>
    `relative flex w-full ${compact ? '' : 'min-h-[2.75rem] '}cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 ${btnPad} text-left text-sm leading-5 text-on-surface transition-colors focus:outline-none focus-visible:border-on-surface/20 focus-visible:ring-2 focus-visible:ring-on-surface/10 data-[hover]:border-slate-300`;

const defaultPanelClass =
    'z-[100] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0';

/**
 * Custom listbox for filter bars — native <select> dropdown panels cannot be styled in most browsers.
 * Pass `groups` instead of `options` for category headings (e.g. business type).
 */
export default function FilterListbox({
    label,
    value,
    onChange,
    options,
    groups,
    placeholder = '—',
    minWidthClass = 'min-w-[160px]',
    showLabel = true,
    compact = false,
    buttonClassName,
    panelClassName,
    wrapperClassName,
    groupHeadingClassName = 'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/90',
    optionClassName = 'group cursor-pointer px-3 py-2 text-sm text-on-surface data-[focus]:bg-slate-50 data-[selected]:font-semibold data-[selected]:text-on-surface',
}) {
    const flatOptions = useMemo(() => {
        if (groups?.length) {
            return groups.flatMap((g) => g.options);
        }
        return options ?? [];
    }, [groups, options]);

    const selected = flatOptions.find((o) => o.value === value);
    const display = selected?.label ?? placeholder;
    const btnPad = compact ? 'py-2' : 'py-2.5';

    const buttonCls = buttonClassName ?? defaultButtonClass(btnPad, compact);
    const panelCls = panelClassName ?? defaultPanelClass;

    const defaultWrapper = `flex flex-1 flex-col ${compact ? 'gap-1' : 'gap-1.5'} ${minWidthClass}`;

    return (
        <div className={wrapperClassName ?? defaultWrapper}>
            <Listbox value={value} onChange={onChange}>
                {showLabel && label ? (
                    <Label className="ml-1 block text-[10px] font-bold uppercase tracking-widest text-outline">
                        {label}
                    </Label>
                ) : null}
                <div className="relative">
                    <ListboxButton className={buttonCls}>
                        <span className="block truncate">{display}</span>
                        <Icon name="expand_more" size="text-base" className="shrink-0 text-outline" />
                    </ListboxButton>
                    <ListboxOptions portal anchor="bottom start" transition className={panelCls}>
                        {groups?.length
                            ? groups.map((group) => (
                                  <div key={group.name}>
                                      <div className={groupHeadingClassName}>{group.name}</div>
                                      {group.options.map((opt) => (
                                          <ListboxOption
                                              key={opt.value === '' ? '__empty' : String(opt.value)}
                                              value={opt.value}
                                              className={optionClassName}
                                          >
                                              <span className="block truncate">{opt.label}</span>
                                          </ListboxOption>
                                      ))}
                                  </div>
                              ))
                            : flatOptions.map((opt) => (
                                  <ListboxOption
                                      key={opt.value === '' ? '__empty' : String(opt.value)}
                                      value={opt.value}
                                      className={optionClassName}
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
