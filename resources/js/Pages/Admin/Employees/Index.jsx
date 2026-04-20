import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import { useT } from '@/i18n/useT';
import EmployeeModal from './EmployeeModal';

export default function Index({ employees, services, businessRoles = [], businessOwnerId }) {
    const t = useT();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (emp) => { setEditing(emp); setShowModal(true); };

    const confirmDelete = () => {
        router.delete(route('admin.employees.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    const toggleEmployeeActive = (employee) => {
        router.patch(route('admin.employees.update', employee.id), {
            name: employee.name,
            email: employee.email,
            phone: employee.phone ?? null,
            title: employee.title ?? null,
            is_active: !employee.is_active,
            service_ids: employee.services?.map(s => s.id) ?? [],
            business_role_id: employee.business_role_id ?? null,
        });
    };

    return (
        <AdminLayout>
            <Head title={t('admin.employees.head_title')} />

            <PageHeader
                title={t('admin.employees.title')}
                description={t('admin.employees.description')}
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> {t('admin.employees.add_employee')}
                </button>
            </PageHeader>

            <div className="min-w-0 bg-surface-container-lowest overflow-hidden rounded-2xl ring-1 ring-slate-100 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 bg-white px-4 py-4 sm:px-6 md:px-8">
                    <h3 className="font-headline text-base font-bold text-on-surface">{t('admin.employees.team_title')}</h3>
                    <p className="text-xs text-on-surface-variant">
                        {employees.length === 1
                            ? t('admin.employees.count_one')
                            : t('admin.employees.count_many', { count: employees.length })}
                    </p>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="people" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4">{t('admin.employees.empty')}</p>
                        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity">
                            <Icon name="add" size="text-base" /> {t('admin.employees.add_first')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 border-b border-slate-50 bg-white p-4 md:hidden">
                            {employees.map((emp) => {
                                const isOwner = businessOwnerId != null && emp.id === businessOwnerId;
                                return (
                                    <article
                                        key={emp.id}
                                        className={`rounded-2xl border border-outline-variant/35 p-4 shadow-sm ${
                                            emp.is_active ? 'bg-surface-container-low/50' : 'bg-slate-200/50 opacity-80'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-headline text-sm font-bold text-on-surface">{emp.name}</p>
                                            {isOwner ? (
                                                <span className="inline-flex items-center rounded-full bg-primary-container/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface">
                                                    {t('admin.employees.owner_badge')}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 break-words text-sm text-on-surface-variant">{emp.email}</p>
                                        <div className="mt-2 grid gap-1 text-sm text-on-surface-variant">
                                            <p>
                                                <span className="font-semibold text-outline">{t('admin.employees.th_title')}: </span>
                                                {emp.title || '—'}
                                            </p>
                                            <p>
                                                <span className="font-semibold text-outline">{t('admin.employees.th_role')}: </span>
                                                {isOwner ? t('admin.employees.owner_account') : (emp.business_role?.name ?? t('admin.employees.role_default'))}
                                            </p>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{t('admin.employees.th_services')}</p>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {emp.services?.length > 0 ? (
                                                    emp.services.map((s) => (
                                                        <span
                                                            key={s.id}
                                                            className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant"
                                                        >
                                                            {s.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-outline">—</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between border-t border-outline-variant/25 pt-3">
                                            <span className="text-xs font-bold uppercase tracking-wide text-outline">{t('admin.employees.th_status')}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleEmployeeActive(emp)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emp.is_active ? 'bg-on-surface' : 'bg-surface-container-highest'}`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emp.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>
                                        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-outline-variant/25 pt-3">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(emp)}
                                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest sm:flex-none"
                                            >
                                                <Icon name="edit" size="text-lg" />
                                                {t('admin.employees.edit_title')}
                                            </button>
                                            {!isOwner ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(emp)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-950 transition-colors hover:bg-red-100/90"
                                                >
                                                    <Icon name="delete" size="text-lg" />
                                                    {t('admin.employees.delete_title')}
                                                </button>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                                            {t('admin.employees.th_name')}
                                        </th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">{t('admin.employees.th_email')}</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">{t('admin.employees.th_title')}</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">{t('admin.employees.th_role')}</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">{t('admin.employees.th_services')}</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">{t('admin.employees.th_status')}</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">{t('admin.employees.th_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {employees.map((emp) => {
                                        const isOwner = businessOwnerId != null && emp.id === businessOwnerId;
                                        return (
                                        <tr key={emp.id} className={`transition-colors ${emp.is_active ? 'hover:bg-slate-50/50' : 'bg-slate-200/70 opacity-50 hover:opacity-70'}`}>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-headline font-bold text-on-surface text-sm">{emp.name}</p>
                                                    {isOwner && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-container/40 text-on-surface text-[10px] font-bold uppercase tracking-wide">
                                                            {t('admin.employees.owner_badge')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">{emp.email}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">{emp.title || '—'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">
                                                    {isOwner ? t('admin.employees.owner_account') : (emp.business_role?.name ?? t('admin.employees.role_default'))}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {emp.services?.length > 0 ? emp.services.map(s => (
                                                        <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                                                            {s.name}
                                                        </span>
                                                    )) : <span className="text-xs text-outline">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleEmployeeActive(emp)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emp.is_active ? 'bg-on-surface' : 'bg-surface-container-highest'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emp.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(emp)}
                                                        className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                        title={t('admin.employees.edit_title')}
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    {!isOwner && (
                                                        <button
                                                            onClick={() => setDeleteTarget(emp)}
                                                            className="p-2 text-outline hover:text-error transition-colors rounded-lg hover:bg-error-container"
                                                            title={t('admin.employees.delete_title')}
                                                        >
                                                            <Icon name="delete" size="text-[18px]" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-4 py-4 sm:px-6 md:px-8">
                            <p className="text-sm text-on-surface-variant">
                                {t('admin.employees.showing')}{' '}
                                <span className="font-bold text-on-surface">{employees.length}</span>{' '}
                                {employees.length === 1
                                    ? t('admin.employees.employee_word_one')
                                    : t('admin.employees.employee_word_other')}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title={t('admin.employees.delete_confirm_title')}
                message={deleteTarget ? t('admin.employees.delete_confirm_message', { name: deleteTarget.name }) : ''}
            />

            <EmployeeModal
                show={showModal}
                onClose={() => setShowModal(false)}
                editing={editing}
                services={services}
                businessRoles={businessRoles}
                businessOwnerId={businessOwnerId}
            />
        </AdminLayout>
    );
}
