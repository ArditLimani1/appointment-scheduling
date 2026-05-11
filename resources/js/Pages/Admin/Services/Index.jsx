import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import { useT } from '@/i18n/useT';
import ServiceModal from './ServiceModal';

export default function Index({ services, sharedResources = [] }) {
    const { auth } = usePage().props;
    const t = useT();
    const currencySymbol = auth.business?.currency_symbol ?? '€';
    const usesSharedResources = auth.business?.uses_shared_resources !== false;

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState(null);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (svc) => { setEditing(svc); setShowModal(true); };

    const requestDelete = (svc) => {
        setShowModal(false);
        setEditing(null);
        setDeleteError(null);
        setDeleteTarget(svc);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }
        const id = deleteTarget.id;
        router.delete(route('admin.services.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleteError(null);
            },
            onError: (errors) => {
                const raw = errors.service ?? errors.message;
                const msg = Array.isArray(raw) ? raw[0] : raw;
                setDeleteError(msg ? String(msg) : null);
            },
        });
    };

    const toggleActive = (svc) => {
        router.patch(route('admin.services.update', svc.id), {
            name: svc.name,
            duration: svc.duration,
            price: svc.price,
            is_active: !svc.is_active,
            is_popular: svc.is_popular,
        });
    };

    return (
        <AdminLayout>
            <Head title={t('admin.services.head_title')} />

            <PageHeader
                title={t('admin.services.title')}
                description={t('admin.services.description')}
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> {t('admin.services.add_service')}
                </button>
            </PageHeader>

            <div className="min-w-0 bg-surface-container-lowest overflow-hidden rounded-2xl ring-1 ring-slate-100 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 bg-white px-4 py-4 sm:px-6 md:px-8">
                    <h3 className="font-headline text-base font-bold text-on-surface">{t('admin.services.offerings_title')}</h3>
                    <p className="text-xs text-on-surface-variant">
                        {services.length === 1
                            ? t('admin.services.count_one')
                            : t('admin.services.count_many', { count: services.length })}
                    </p>
                </div>

                {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="work_outline" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4">{t('admin.services.empty')}</p>
                        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity">
                            <Icon name="add" size="text-base" /> {t('admin.services.add_first')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 border-b border-slate-50 bg-white p-4 md:hidden">
                            {services.map((svc) => (
                                <article
                                    key={svc.id}
                                    className="rounded-2xl border border-outline-variant/35 bg-surface-container-low/50 p-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-headline text-sm font-bold text-on-surface">
                                                {svc.name}
                                                {svc.is_popular ? (
                                                    <span className="ml-2 align-middle rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-secondary-container">
                                                        {t('admin.services.popular')}
                                                    </span>
                                                ) : null}
                                            </p>
                                            {svc.description ? (
                                                <p className="mt-1 text-xs text-on-surface-variant">{svc.description}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                                            <Icon name="schedule" size="text-sm" />
                                            <span className="font-semibold text-on-surface">
                                                {svc.duration} {t('admin.services.min_suffix')}
                                            </span>
                                        </span>
                                        <span className="font-headline text-base font-extrabold tabular-nums text-on-surface">
                                            {Number(svc.price).toFixed(2)} {currencySymbol}
                                        </span>
                                    </div>
                                    {usesSharedResources ? (
                                        <div className="mt-2 text-xs text-on-surface-variant">
                                            <span className="font-bold uppercase tracking-wider text-outline">{t('admin.services.th_resources')}: </span>
                                            {svc.shared_resources?.length ? (
                                                <ul className="mt-1 list-inside list-disc space-y-0.5">
                                                    {svc.shared_resources.map((r) => (
                                                        <li key={r.id}>{r.name}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span>{t('admin.services.resources_empty')}</span>
                                            )}
                                        </div>
                                    ) : null}
                                    <div className="mt-3 flex items-center justify-between border-t border-outline-variant/25 pt-3">
                                        <span className="text-xs font-bold uppercase tracking-wide text-outline">{t('admin.services.th_status')}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(svc)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${svc.is_active ? 'bg-on-surface' : 'bg-surface-container-highest'}`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${svc.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                                            />
                                        </button>
                                    </div>
                                    <div className="mt-3 mx-auto w-full max-w-[19rem] border-t border-outline-variant/25 pt-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(svc)}
                                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-container-high px-3 py-2.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-highest sm:text-sm"
                                            >
                                                <Icon name="edit" size="text-lg" className="shrink-0" />
                                                <span className="truncate">{t('admin.services.edit_title')}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => requestDelete(svc)}
                                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-950 transition-colors hover:bg-red-100/90 sm:text-sm"
                                            >
                                                <Icon name="delete" size="text-lg" className="shrink-0" />
                                                <span className="truncate">{t('admin.services.delete_title')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <div className="hidden overflow-x-auto px-4 sm:px-6 md:block md:px-8">
                            <table className={`w-full border-collapse text-left ${usesSharedResources ? 'min-w-[820px]' : 'min-w-[640px]'}`}>
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline min-w-0">
                                            {t('admin.services.th_name')}
                                        </th>
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center whitespace-nowrap w-28">
                                            {t('admin.services.th_duration')}
                                        </th>
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline whitespace-nowrap w-28">
                                            {t('admin.services.th_price')}
                                        </th>
                                        {usesSharedResources && (
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline min-w-[10rem] max-w-xs">
                                            {t('admin.services.th_resources')}
                                        </th>
                                        )}
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center w-24">
                                            {t('admin.services.th_status')}
                                        </th>
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right w-28">
                                            {t('admin.services.th_actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {services.map((svc) => (
                                        <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 sm:px-5 py-5 min-w-0">
                                                <p className="font-headline font-bold text-on-surface text-sm">
                                                    {svc.name}
                                                    {svc.is_popular && (
                                                        <span className="ml-2 rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container uppercase tracking-wide align-middle">
                                                            {t('admin.services.popular')}
                                                        </span>
                                                    )}
                                                </p>
                                                {svc.description && (
                                                    <p className="text-xs text-on-surface-variant mt-0.5">{svc.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-5 py-5 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium tabular-nums">
                                                    {svc.duration} {t('admin.services.min_suffix')}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-5 py-5">
                                                <span className="font-headline font-extrabold text-on-surface text-base tabular-nums">
                                                    {Number(svc.price).toFixed(2)} {currencySymbol}
                                                </span>
                                            </td>
                                            {usesSharedResources && (
                                            <td className="px-4 sm:px-5 py-5 align-middle">
                                                {svc.shared_resources?.length ? (
                                                    <ul className="space-y-1 text-xs text-on-surface my-0">
                                                        {svc.shared_resources.map((r) => (
                                                            <li key={r.id} className="leading-snug">
                                                                {r.name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-xs text-on-surface-variant">{t('admin.services.resources_empty')}</span>
                                                )}
                                            </td>
                                            )}
                                            <td className="px-4 sm:px-5 py-5">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(svc)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${svc.is_active ? 'bg-on-surface' : 'bg-surface-container-highest'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${svc.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-5 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(svc)}
                                                        className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                        title={t('admin.services.edit_title')}
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => requestDelete(svc)}
                                                        className="p-2 text-outline hover:text-error transition-colors rounded-lg hover:bg-error-container"
                                                        title={t('admin.services.delete_title')}
                                                    >
                                                        <Icon name="delete" size="text-[18px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-4 py-4 sm:px-6 md:px-8">
                            <p className="text-sm text-on-surface-variant">
                                {t('admin.services.showing')}{' '}
                                <span className="font-bold text-on-surface">{services.length}</span>{' '}
                                {services.length === 1
                                    ? t('admin.services.service_word_one')
                                    : t('admin.services.service_word_other')}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {deleteTarget ? (
                <DeleteConfirmModal
                    show
                    onClose={() => {
                        setDeleteTarget(null);
                        setDeleteError(null);
                    }}
                    onConfirm={confirmDelete}
                    title={t('admin.services.delete_confirm_title')}
                    message={t('admin.services.delete_confirm_message', { name: deleteTarget.name })}
                    error={deleteError}
                />
            ) : null}

            {showModal ? (
                <ServiceModal
                    show
                    onClose={() => {
                        setShowModal(false);
                        setEditing(null);
                    }}
                    editing={editing}
                    currencySymbol={currencySymbol}
                    sharedResources={sharedResources}
                />
            ) : null}
        </AdminLayout>
    );
}
