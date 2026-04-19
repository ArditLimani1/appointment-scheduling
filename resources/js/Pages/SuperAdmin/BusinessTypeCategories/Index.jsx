import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';

export default function BusinessTypeCategoriesIndex({ categories }) {
    const [editing, setEditing] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const form = useForm({ name: '', sort_order: 0 });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.setData({ name: '', sort_order: 0 });
        setShowModal(true);
    };

    const openEdit = (c) => {
        setEditing(c);
        form.setData({ name: c.name, sort_order: c.sort_order ?? 0 });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); form.reset(); form.clearErrors(); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            form.put(route('super-admin.business-type-categories.update', editing.id), { onSuccess: closeModal });
        } else {
            form.post(route('super-admin.business-type-categories.store'), { onSuccess: closeModal });
        }
    };

    const confirmDelete = () => {
        router.delete(route('super-admin.business-type-categories.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    return (
        <SuperAdminLayout>
            <Head title="Categories" />

            <PageHeader
                title="Categories"
                description="Top-level groups that organise business types in the platform."
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> Add Category
                </button>
            </PageHeader>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">All Categories</h3>
                    <p className="text-xs text-on-surface-variant">
                        {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total
                    </p>
                </div>

                {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="category" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4">No categories yet.</p>
                        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity">
                            <Icon name="add" size="text-base" /> Add First Category
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Name</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Sort Order</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Business Types</th>
                                    <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categories.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-headline font-bold text-on-surface text-sm">{c.name}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center text-sm text-on-surface-variant tabular-nums">{c.sort_order}</td>
                                        <td className="px-8 py-5 text-center text-sm text-on-surface-variant tabular-nums">{c.business_types_count}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                    title="Edit"
                                                >
                                                    <Icon name="edit" size="text-[18px]" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(c)}
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

            <Modal show={showModal} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="font-headline text-lg font-bold text-on-surface mb-4">
                        {editing ? 'Edit Category' : 'New Category'}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-outline">Name</label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                autoFocus
                                className="mt-1 w-full rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-on-surface"
                            />
                            {form.errors.name && <p className="text-xs text-error mt-1">{form.errors.name}</p>}
                        </div>

                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-outline">Sort Order</label>
                            <input
                                type="number"
                                value={form.data.sort_order}
                                onChange={(e) => form.setData('sort_order', e.target.value)}
                                className="mt-1 w-full rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-on-surface"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={closeModal} className="flex-1 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={form.processing} className="flex-1 rounded-xl bg-on-surface px-4 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity">
                            {editing ? 'Save' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <DeleteConfirmModal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete category?"
                message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
            />
        </SuperAdminLayout>
    );
}
