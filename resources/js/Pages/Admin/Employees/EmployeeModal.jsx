import { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import FilterListbox from '@/Components/FilterListbox';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import { useT } from '@/i18n/useT';

export default function EmployeeModal({ show, onClose, editing, services, businessRoles = [], businessOwnerId }) {
    const t = useT();
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        title: '',
        is_active: true,
        service_ids: [],
        business_role_id: '',
    });

    useEffect(() => {
        if (show) {
            if (editing) {
                setData({
                    name: editing.name,
                    email: editing.email,
                    password: '',
                    phone: editing.phone || '',
                    title: editing.title || '',
                    is_active: editing.is_active,
                    service_ids: editing.services?.map(s => s.id) || [],
                    business_role_id: editing.business_role_id != null ? String(editing.business_role_id) : '',
                });
            } else {
                reset();
            }
        }
    }, [show, editing?.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.employees.update', editing.id), {
                onSuccess: () => { onClose(); reset(); },
            });
        } else {
            post(route('admin.employees.store'), {
                onSuccess: () => { onClose(); reset(); },
            });
        }
    };

    const inputClass = "w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all";

    const roleListboxButtonClass =
        'relative flex w-full min-h-[2.75rem] cursor-pointer items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-left text-sm text-on-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-on-primary-container/30 data-[hover]:border-outline';
    const roleListboxPanelClass =
        'z-[100] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-outline-variant bg-surface-container-low py-1 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0';
    const roleListboxOptionClass =
        'group cursor-pointer px-3 py-2.5 text-sm text-on-surface data-[focus]:bg-surface-container-high data-[selected]:bg-on-surface/10 data-[selected]:font-medium';

    const roleOptions = useMemo(
        () => [
            { value: '', label: t('admin.employees.modal.default_role_option') },
            ...businessRoles.map((r) => ({ value: String(r.id), label: r.name })),
        ],
        [businessRoles, t],
    );

    const assignedServicesLabel = useMemo(() => {
        if (!services?.length || data.service_ids.length === 0) {
            return t('admin.employees.modal.select_services');
        }
        const selected = services.filter((s) => data.service_ids.some((id) => Number(id) === Number(s.id)));
        if (selected.length <= 2) {
            return selected.map((s) => s.name).join(', ');
        }
        return t('admin.employees.modal.services_selected', { count: selected.length });
    }, [services, data.service_ids, t]);

    const editingOwner = editing && businessOwnerId != null && editing.id === businessOwnerId;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={handleSubmit} className="flex max-h-[min(100dvh-1.5rem,56rem)] flex-col sm:max-h-[min(92vh,56rem)]">
                <div className="flex items-start justify-between border-b border-outline-variant/30 px-4 py-4 sm:px-6 sm:py-5">
                    <div>
                        <h2 className="text-lg font-bold text-on-surface">{editing ? t('admin.employees.modal.edit_title') : t('admin.employees.modal.add_title')}</h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">{editing ? t('admin.employees.modal.edit_sub') : t('admin.employees.modal.add_sub')}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <Icon name="close" size="text-xl" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">{t('admin.employees.modal.full_name')} <span className="text-error">*</span></label>
                        <input value={data.name} onChange={e => setData('name', e.target.value)} className={`${inputClass} text-base sm:text-sm`} autoFocus required />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">{t('admin.employees.modal.email')} <span className="text-error">*</span></label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className={`${inputClass} text-base sm:text-sm`} required />
                        <InputError message={errors.email} className="mt-1" />
                    </div>
                    <div className="flex min-h-0 flex-col sm:h-full">
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            {t('admin.employees.modal.password')}
                            {!editing && <span className="text-error"> *</span>}
                        </label>
                        {editing && (
                            <p className="text-xs text-on-surface-variant mb-1.5 leading-snug">
                                {t('admin.employees.modal.password_keep_hint')}
                            </p>
                        )}
                        <div className="mt-auto">
                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className={`${inputClass} text-base sm:text-sm`} required={!editing} />
                            <InputError message={errors.password} className="mt-1" />
                        </div>
                    </div>
                    <div className="flex min-h-0 flex-col sm:h-full">
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            {t('admin.employees.modal.phone')}{' '}
                            <span className="text-xs text-on-surface-variant font-normal">{t('admin.employees.modal.optional')}</span>
                        </label>
                        <div className="mt-auto">
                            <input type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} className={`${inputClass} text-base sm:text-sm`} />
                        </div>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            {t('admin.employees.modal.job_title')}{' '}
                            <span className="text-xs text-on-surface-variant font-normal">{t('admin.employees.modal.optional')}</span>
                        </label>
                        <input value={data.title} onChange={e => setData('title', e.target.value)} className={`${inputClass} text-base sm:text-sm`} />
                    </div>
                    {!editingOwner && (
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                {t('admin.employees.modal.access_role')}{' '}
                                <span className="text-xs text-on-surface-variant font-normal">{t('admin.employees.modal.optional')}</span>
                            </label>
                            <FilterListbox
                                showLabel={false}
                                placeholder=""
                                value={data.business_role_id === '' || data.business_role_id == null ? '' : String(data.business_role_id)}
                                onChange={(v) =>
                                    setData('business_role_id', v === '' || v == null ? '' : String(v))
                                }
                                options={roleOptions}
                                minWidthClass="min-w-0 w-full"
                                wrapperClassName="w-full gap-1"
                                buttonClassName={roleListboxButtonClass}
                                panelClassName={roleListboxPanelClass}
                                optionClassName={roleListboxOptionClass}
                            />
                            <p className="text-xs text-on-surface-variant mt-1.5">
                                {t('admin.employees.modal.roles_help')}
                            </p>
                            <InputError message={errors.business_role_id} className="mt-1" />
                        </div>
                    )}
                    {editingOwner && (
                        <div className="sm:col-span-2 rounded-xl border border-outline-variant/50 bg-surface-container-low/40 px-4 py-3">
                            <p className="text-sm font-medium text-on-surface">{t('admin.employees.modal.owner_banner_title')}</p>
                            <p className="text-xs text-on-surface-variant mt-1">
                                {t('admin.employees.modal.owner_banner_body')}
                            </p>
                        </div>
                    )}
                    </div>

                    {services?.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-on-surface mb-2">{t('admin.employees.modal.assigned_services')}</label>
                            <Listbox
                                value={data.service_ids}
                                onChange={(ids) => setData('service_ids', ids)}
                                multiple
                            >
                                <div className="relative">
                                    <ListboxButton
                                        className={`${inputClass} flex cursor-pointer items-center justify-between gap-2 text-left text-base sm:text-sm`}
                                    >
                                        <span className={`block min-h-[1.25rem] truncate ${data.service_ids.length === 0 ? 'text-on-surface-variant/60' : ''}`}>
                                            {assignedServicesLabel}
                                        </span>
                                        <Icon name="expand_more" size="text-[20px]" className="shrink-0 text-on-surface-variant" />
                                    </ListboxButton>
                                    <ListboxOptions
                                        portal
                                        anchor="bottom start"
                                        transition
                                        className="z-[100] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-outline-variant bg-surface-container-low py-1 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                                    >
                                        {services.map((s) => (
                                            <ListboxOption
                                                key={s.id}
                                                value={s.id}
                                                className="group flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-on-surface data-[focus]:bg-surface-container-high data-[selected]:bg-on-surface/10"
                                            >
                                                <span
                                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-outline-variant group-data-[selected]:border-on-surface group-data-[selected]:bg-on-surface"
                                                    aria-hidden
                                                >
                                                    <Icon
                                                        name="check"
                                                        size="text-[10px]"
                                                        className="text-surface opacity-0 group-data-[selected]:opacity-100"
                                                    />
                                                </span>
                                                <span className="truncate">{s.name}</span>
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </div>
                            </Listbox>
                        </div>
                    )}

                    <div className="mt-4 flex items-center gap-3">
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="peer sr-only" />
                            <div className="peer h-5 w-9 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-on-surface peer-checked:after:translate-x-full" />
                        </label>
                        <span className="text-sm text-on-surface">{t('admin.employees.modal.active_account')}</span>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-outline-variant/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
                    <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                        {t('admin.employees.modal.cancel')}
                    </button>
                    <button type="submit" disabled={processing} className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50">
                        {processing ? t('admin.employees.modal.saving') : (editing ? t('admin.employees.modal.save_changes') : t('admin.employees.modal.submit_add'))}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
