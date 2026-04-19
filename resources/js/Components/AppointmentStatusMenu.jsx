import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';

const STATUS_META = [
    {
        value: 'pending',
        trigger: 'bg-amber-50 text-amber-950 ring-amber-200/90 hover:bg-amber-100/90',
        itemIdle: 'text-amber-950',
        dot: 'bg-amber-500',
    },
    {
        value: 'confirmed',
        trigger: 'bg-emerald-50 text-emerald-950 ring-emerald-200/90 hover:bg-emerald-100/90',
        itemIdle: 'text-emerald-950',
        dot: 'bg-emerald-500',
    },
    {
        value: 'cancelled',
        trigger: 'bg-red-50 text-red-950 ring-red-200/90 hover:bg-red-100/90',
        itemIdle: 'text-red-950',
        dot: 'bg-red-500',
    },
];

function optionFor(status) {
    return STATUS_META.find((o) => o.value === status) || STATUS_META[0];
}

export default function AppointmentStatusMenu({ status, onChange }) {
    const t = useT();
    const current = optionFor(status);

    return (
        <Menu as="div" className="relative inline-block text-left">
            <MenuButton className={`inline-flex min-w-[10rem] max-w-full items-center justify-between gap-2 rounded-full px-3.5 py-2 text-left text-[11px] font-bold uppercase tracking-wider shadow-sm ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-on-surface/25 ${current.trigger}`}>
                <span className="truncate">{t(`common.status.${current.value}`)}</span>
                <Icon name="expand_more" size="text-lg" className="shrink-0 opacity-60" />
            </MenuButton>
            <MenuItems
                modal={false}
                portal
                anchor="bottom start"
                transition
                className="z-[200] w-56 rounded-2xl bg-white p-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.18)] ring-1 ring-slate-200/90 [--anchor-gap:6px] transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0"
            >
                {STATUS_META.map((opt) => (
                    <MenuItem key={opt.value}>
                        {({ focus }) => (
                            <button
                                type="button"
                                onClick={() => onChange(opt.value)}
                                className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors last:mb-0 ${focus ? 'bg-slate-50' : ''} ${opt.itemIdle} ${status === opt.value ? 'bg-slate-50 ring-1 ring-inset ring-slate-200' : ''}`}
                            >
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ${opt.dot}`} aria-hidden />
                                <span className="flex-1">{t(`common.status.${opt.value}`)}</span>
                                {status === opt.value && <Icon name="check" size="text-lg" className="shrink-0 text-on-surface" />}
                            </button>
                        )}
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
}
