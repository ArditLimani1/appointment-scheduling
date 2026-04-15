import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import ResourceModal from './ResourceModal';

export default function Index({ resources }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const openCreate = () => {
        setEditing(null);
        setShowModal(true);
    };
    const openEdit = (r) => {
        setEditing(r);
        setShowModal(true);
    };

    const confirmDelete = () => {
        router.delete(route('admin.shared-resources.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    return (
        <AdminLayout>
            <Head title="Shared resources" />

            <PageHeader
                title="Shared resources"
                description="Rooms, devices, and other shared capacity that services can require when booking."
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> Add resource
                </button>
            </PageHeader>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">Resources</h3>
                    <p className="text-xs text-on-surface-variant">
                        {resources.length} resource{resources.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {resources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="meeting_room" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4">No shared resources yet.</p>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity"
                        >
                            <Icon name="add" size="text-base" /> Add first resource
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto px-4 sm:px-6 md:px-8">
                        <table className="w-full min-w-[480px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline min-w-0">
                                        Name
                                    </th>
                                    <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center w-32">
                                        Capacity
                                    </th>
                                    <th className="px-4 sm:px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right w-28">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {resources.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 sm:px-5 py-5 min-w-0">
                                            <p className="font-headline font-bold text-on-surface text-sm">{r.name}</p>
                                        </td>
                                        <td className="px-4 sm:px-5 py-5 text-center">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium tabular-nums">
                                                {r.capacity}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-5 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(r)}
                                                    className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                    title="Edit"
                                                >
                                                    <Icon name="edit" size="text-[18px]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(r)}
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
                )}
            </div>

            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete resource?"
                message={`"${deleteTarget?.name}" will be removed. You cannot delete a resource that is still referenced by appointments.`}
            />

            <ResourceModal show={showModal} onClose={() => setShowModal(false)} editing={editing} />
        </AdminLayout>
    );
}
