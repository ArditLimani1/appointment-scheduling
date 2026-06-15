import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';

const STATUS_META = [
    {
        value: 'pending',
        trigger:
            'bg-surface-container-highest text-on-surface-variant ring-outline-variant/50 hover:bg-surface-container-high',
        itemIdle: 'text-on-surface-variant',
        dot: 'bg-surface-container-highest ring-1 ring-inset ring-outline-variant/70',
    },
    {
        value: 'confirmed',
        trigger: 'bg-tertiary-fixed text-on-tertiary-fixed ring-on-tertiary-fixed/20 hover:opacity-90',
        itemIdle: 'text-on-tertiary-fixed',
        dot: 'bg-tertiary-fixed',
    },
    {
        value: 'cancelled',
        trigger: 'bg-error-container text-on-error-container ring-error/20 hover:bg-error-container/80',
        itemIdle: 'text-on-error-container',
        dot: 'bg-error ring-1 ring-inset ring-error/40',
    },
];

function optionFor(status) {
    return STATUS_META.find((o) => o.value === status) || STATUS_META[0];
}

export default function AppointmentStatusMenu({ status, onChange, layout = 'inline' }) {
    const t = useT();
    const current = optionFor(status);
    const handleChange = (nextValue) => {
        if (nextValue === status) {
            return;
        }

        onChange(nextValue);
    };

    const blockLayout = layout === 'block';

    return (
        <Menu
            as="div"
            className={
                blockLayout
                    ? 'relative block w-full min-w-0 max-w-full text-left'
                    : 'relative inline-block text-left'
            }
        >
            <MenuButton
                className={`inline-flex max-w-full items-center justify-between gap-2 rounded-full px-3.5 py-2 text-left text-[11px] font-bold uppercase tracking-wider shadow-sm ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-on-surface/25 ${current.trigger} ${
                    blockLayout ? 'w-full min-w-0' : 'min-w-[10rem]'
                }`}
            >
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
                                onClick={() => handleChange(opt.value)}
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
