import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import ServiceModal from './ServiceModal';

export default function Index({ services, sharedResources = [] }) {
    const { auth } = usePage().props;
    const currencySymbol = auth.business?.currency_symbol ?? '€';

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (svc) => { setEditing(svc); setShowModal(true); };

    const confirmDelete = () => {
        router.delete(route('admin.services.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    const toggleActive = (svc) => {
        router.patch(route('admin.services.update', svc.id), {
            name: svc.name,
            duration: svc.duration,
            price: svc.price,
            is_active: !svc.is_active,
            is_popular: svc.is_popular,
            icon: svc.icon,
        });
    };

    return (
        <AdminLayout>
            <Head title="Services" />

            <PageHeader
                title="Services"
                description="Manage your business service offerings. Define durations, pricing, and availability."
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> Add Service
                </button>
            </PageHeader>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">Active Offerings</h3>
                    <p className="text-xs text-on-surface-variant">
                        {services.length} service{services.length !== 1 ? 's' : ''} total
                    </p>
                </div>

                {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="work_outline" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4">No services yet.</p>
                        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity">
                            <Icon name="add" size="text-base" /> Add First Service
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto px-4 sm:px-6 md:px-8">
                            <table className="w-full min-w-[640px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline min-w-0">
                                            Service Name
                                        </th>
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center whitespace-nowrap w-28">
                                            Duration
                                        </th>
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline whitespace-nowrap w-28">
                                            Price
                                        </th>
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center w-24">
                                            Status
                                        </th>
                                        <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right w-28">
                                            Actions
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
                                                            Popular
                                                        </span>
                                                    )}
                                                </p>
                                                {svc.description && (
                                                    <p className="text-xs text-on-surface-variant mt-0.5">{svc.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-5 py-5 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium tabular-nums">
                                                    {svc.duration} min
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-5 py-5">
                                                <span className="font-headline font-extrabold text-on-surface text-base tabular-nums">
                                                    {Number(svc.price).toFixed(2)} {currencySymbol}
                                                </span>
                                            </td>
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
                                                        title="Edit"
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(svc)}
                                                        className="p-2 text-outline hover:text-error transition-colors rounded-lg hover:bg-error-container"
                                                        title="Delete"
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
                        <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                            <p className="text-sm text-on-surface-variant">
                                Showing <span className="font-bold text-on-surface">{services.length}</span> service{services.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Service?"
                message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
            />

            <ServiceModal
                show={showModal}
                onClose={() => setShowModal(false)}
                editing={editing}
                currencySymbol={currencySymbol}
                sharedResources={sharedResources}
            />
        </AdminLayout>
    );
}
