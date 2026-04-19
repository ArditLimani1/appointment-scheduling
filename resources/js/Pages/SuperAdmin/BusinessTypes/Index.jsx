import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteConfirmModal from '@/Components/DeleteConfirmModal';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';

export default function BusinessTypesIndex({ types, categories, filters }) {
    const [editing, setEditing] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const filterForm = useForm({
        search: filters.search ?? '',
        category_id: filters.category_id ?? '',
    });

    const form = useForm({
        business_type_category_id: '',
        name: '',
        sort_order: 0,
        is_active: true,
    });

    const submitFilter = (e) => {
        e.preventDefault();
        filterForm.get(route('super-admin.business-types.index'), { preserveState: true, replace: true });
    };

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.setData({
            business_type_category_id: categories[0]?.id ?? '',
            name: '',
            sort_order: 0,
            is_active: true,
        });
        setShowModal(true);
    };

    const openEdit = (t) => {
        setEditing(t);
        form.setData({
            business_type_category_id: t.business_type_category_id,
            name: t.name,
            sort_order: t.sort_order ?? 0,
            is_active: !!t.is_active,
        });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); form.reset(); form.clearErrors(); };

    const submit = (e) => {
        e.preventDefault();
        if (editing) {
            form.put(route('super-admin.business-types.update', editing.id), { onSuccess: closeModal });
        } else {
            form.post(route('super-admin.business-types.store'), { onSuccess: closeModal });
        }
    };

    const confirmDelete = () => {
        router.delete(route('super-admin.business-types.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    return (
        <SuperAdminLayout>
            <Head title="Business Types" />

            <PageHeader
                title="Business Types"
                description="The specific business types tenants pick when they register."
            >
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> Add Type
                </button>
            </PageHeader>

            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                <div className="px-8 py-5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 bg-white">
                    <form onSubmit={submitFilter} className="flex flex-wrap gap-3 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-[220px]">
                            <Icon name="search" size="text-base" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                            <input
                                type="text"
                                value={filterForm.data.search}
                                onChange={(e) => filterForm.setData('search', e.target.value)}
                                placeholder="Search by name"
                                className="w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface placeholder-outline focus:outline-none focus:border-on-surface"
                            />
                        </div>
                        <select
                            value={filterForm.data.category_id}
                            onChange={(e) => filterForm.setData('category_id', e.target.value)}
                            className="bg-surface border border-outline-variant rounded-lg text-sm text-on-surface px-3 py-2 focus:outline-none focus:border-on-surface"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="submit" className="rounded-xl bg-on-surface px-4 py-2 text-sm font-bold text-surface hover:opacity-90 transition-opacity">
                            Filter
                        </button>
                    </form>
                    <p className="text-xs text-on-surface-variant">
                        {types.total} type{types.total !== 1 ? 's' : ''} total
                    </p>
                </div>

                {types.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="business_center" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant">No business types match your filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Name</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Category</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Sort</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Businesses</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {types.data.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="font-headline font-bold text-on-surface text-sm">{t.name}</p>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-on-surface-variant">{t.category?.name ?? '—'}</td>
                                            <td className="px-8 py-5 text-center text-sm text-on-surface-variant tabular-nums">{t.sort_order}</td>
                                            <td className="px-8 py-5 text-center text-sm text-on-surface tabular-nums">{t.businesses_count}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${t.is_active ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                                        {t.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(t)}
                                                        className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                        title="Edit"
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(t)}
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

                        {types.links && types.last_page > 1 && (
                            <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                                <p className="text-sm text-on-surface-variant">
                                    Page <span className="font-bold text-on-surface">{types.current_page}</span> of {types.last_page}
                                </p>
                                <div className="flex gap-1">
                                    {types.links.map((link, i) => (
                                        <Link
                                            key={i}
                                            href={link.url ?? '#'}
                                            preserveState
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${link.active ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-surface-container'} ${!link.url && 'opacity-40 pointer-events-none'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Modal show={showModal} onClose={closeModal} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="font-headline text-lg font-bold text-on-surface mb-4">
                        {editing ? 'Edit Business Type' : 'New Business Type'}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-outline">Category</label>
                            <select
                                value={form.data.business_type_category_id}
                                onChange={(e) => form.setData('business_type_category_id', e.target.value)}
                                className="mt-1 w-full rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-on-surface"
                            >
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {form.errors.business_type_category_id && <p className="text-xs text-error mt-1">{form.errors.business_type_category_id}</p>}
                        </div>

                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-outline">Name</label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
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

                        <label className="flex items-center gap-2 text-sm text-on-surface">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                className="rounded border-outline-variant text-on-surface focus:ring-on-surface"
                            />
                            Active
                        </label>
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
                title="Delete business type?"
                message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
            />
        </SuperAdminLayout>
    );
}
