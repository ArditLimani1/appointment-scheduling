import { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';

export default function Index({ services }) {
    const { auth } = usePage().props;
    const currencySymbol = auth.business?.currency_symbol ?? '€';

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        duration: 30,
        price: '',
        description: '',
        is_active: true,
        is_popular: false,
        icon: 'content_cut',
    });

    const openCreate = () => { reset(); setEditing(null); setShowModal(true); };

    const openEdit = (svc) => {
        setEditing(svc);
        setData({
            name: svc.name,
            duration: svc.duration,
            price: svc.price,
            description: svc.description || '',
            is_active: svc.is_active,
            is_popular: svc.is_popular,
            icon: svc.icon || 'content_cut',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.services.update', editing.id), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post(route('admin.services.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

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

    const inputClass = "w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all";

    return (
        <AdminLayout>
            <Head title="Services" />

            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Services</h1>
                    <p className="mt-1.5 text-sm text-on-surface-variant max-w-lg">
                        Manage your business service offerings. Define durations, pricing, and availability.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> Add Service
                </button>
            </div>

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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Service Name</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Duration</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Price</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {services.map((svc) => (
                                        <tr key={svc.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
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

                                            <td className="px-8 py-5 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                                                    <Icon name="schedule" size="text-sm" />
                                                    {svc.duration} min
                                                </span>
                                            </td>

                                            <td className="px-8 py-5">
                                                <span className="font-headline font-extrabold text-on-surface text-base">
                                                    {currencySymbol}{Number(svc.price).toFixed(2)}
                                                </span>
                                            </td>

                                            <td className="px-8 py-5">
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

                                            <td className="px-8 py-5 text-right">
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

            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm">
                <div className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container mx-auto mb-4">
                        <Icon name="delete" size="text-xl" className="text-error" />
                    </div>
                    <h3 className="text-center text-base font-bold text-on-surface mb-1">Delete Service?</h3>
                    <p className="text-center text-sm text-on-surface-variant mb-6">
                        <span className="font-medium">"{deleteTarget?.name}"</span> will be permanently removed. This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                            Cancel
                        </button>
                        <button onClick={confirmDelete} className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-on-error hover:opacity-90 transition-opacity">
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-on-surface">{editing ? 'Edit Service' : 'Add Service'}</h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">{editing ? 'Update the service details below.' : 'Create a new service offering'}</p>
                        </div>
                        <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors">
                            <Icon name="close" size="text-xl" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Service Name <span className="text-error">*</span></label>
                            <input value={data.name} onChange={e => setData('name', e.target.value)} className={inputClass} placeholder="e.g., Haircut" autoFocus required />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Duration (minutes) <span className="text-error">*</span></label>
                            <input type="number" min="5" value={data.duration} onChange={e => setData('duration', parseInt(e.target.value))} className={inputClass} required />
                            <InputError message={errors.duration} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Price ({currencySymbol}) <span className="text-error">*</span></label>
                            <input type="number" step="0.01" min="0" value={data.price} onChange={e => setData('price', e.target.value)} className={inputClass} placeholder="15.00" required />
                            <InputError message={errors.price} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Description <span className="text-xs text-on-surface-variant font-normal">(optional)</span></label>
                            <textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Brief description shown in the table..." />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" checked={data.is_popular} onChange={e => setData('is_popular', e.target.checked)} className="peer sr-only" />
                                <div className="peer h-5 w-9 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-on-surface peer-checked:after:translate-x-full" />
                            </label>
                            <span className="text-sm text-on-surface">Mark as Popular</span>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50">
                            {processing ? 'Saving...' : (editing ? 'Save Changes' : 'Add Service')}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
