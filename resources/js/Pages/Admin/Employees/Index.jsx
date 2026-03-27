import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';

export default function Index({ employees, services }) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        title: '',
        is_active: true,
        service_ids: [],
    });

    const openCreate = () => { reset(); setEditing(null); setShowModal(true); };

    const openEdit = (emp) => {
        setEditing(emp);
        setData({
            name: emp.name,
            email: emp.email,
            password: '',
            phone: emp.phone || '',
            title: emp.title || '',
            is_active: emp.is_active,
            service_ids: emp.services?.map(s => s.id) || [],
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.employees.update', editing.id), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        } else {
            post(route('admin.employees.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const confirmDelete = () => {
        router.delete(route('admin.employees.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    const toggleActive = (emp) => {
        router.patch(route('admin.employees.update', emp.id), {
            name: emp.name,
            email: emp.email,
            is_active: !emp.is_active,
        });
    };

    const toggleService = (id) => {
        setData('service_ids', data.service_ids.includes(id)
            ? data.service_ids.filter(s => s !== id)
            : [...data.service_ids, id]);
    };

    const inputClass = "w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all";

    return (
        <AdminLayout>
            <Head title="Employees" />

            {/* Page header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Employees</h1>
                    <p className="mt-1.5 text-sm text-on-surface-variant max-w-lg">
                        Manage your team members. Assign services and control their access and availability.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-surface hover:opacity-90 transition-all active:scale-95 shadow-sm shrink-0"
                >
                    <Icon name="add_circle" size="text-lg" /> Add Employee
                </button>
            </div>

            {/* Table card */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                {/* Card header */}
                <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h3 className="font-headline font-bold text-base text-on-surface">Team Members</h3>
                    <p className="text-xs text-on-surface-variant">
                        {employees.length} employee{employees.length !== 1 ? 's' : ''} total
                    </p>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <Icon name="people" size="text-5xl" className="text-outline mb-3" />
                        <p className="text-sm text-on-surface-variant mb-4">No employees yet.</p>
                        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2 text-sm font-semibold text-surface hover:opacity-90 transition-opacity">
                            <Icon name="add" size="text-base" /> Add First Employee
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Name</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Email</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Title</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">Services</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-center">Status</th>
                                        <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Name */}
                                            <td className="px-8 py-5">
                                                <p className="font-headline font-bold text-on-surface text-sm">{emp.name}</p>
                                            </td>

                                            {/* Email */}
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">{emp.email}</p>
                                            </td>

                                            {/* Title */}
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-on-surface-variant">{emp.title || '—'}</p>
                                            </td>

                                            {/* Services */}
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {emp.services?.length > 0 ? emp.services.map(s => (
                                                        <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                                                            {s.name}
                                                        </span>
                                                    )) : <span className="text-xs text-outline">—</span>}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(emp)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emp.is_active ? 'bg-on-surface' : 'bg-surface-container-highest'}`}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emp.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(emp)}
                                                        className="p-2 text-outline hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                                                        title="Edit"
                                                    >
                                                        <Icon name="edit" size="text-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(emp)}
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

                        {/* Footer */}
                        <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
                            <p className="text-sm text-on-surface-variant">
                                Showing <span className="font-bold text-on-surface">{employees.length}</span> employee{employees.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Delete confirmation modal */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm">
                <div className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container mx-auto mb-4">
                        <Icon name="delete" size="text-xl" className="text-error" />
                    </div>
                    <h3 className="text-center text-base font-bold text-on-surface mb-1">Delete Employee?</h3>
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

            {/* Add / Edit Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-on-surface">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">{editing ? 'Update employee details below.' : 'Add a new team member to your business.'}</p>
                        </div>
                        <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors">
                            <Icon name="close" size="text-xl" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Full Name <span className="text-error">*</span></label>
                            <input value={data.name} onChange={e => setData('name', e.target.value)} className={inputClass} placeholder="John Doe" autoFocus required />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Email <span className="text-error">*</span></label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className={inputClass} placeholder="john@example.com" required />
                            <InputError message={errors.email} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                Password {editing ? <span className="text-xs text-on-surface-variant font-normal">(leave blank to keep)</span> : <span className="text-error">*</span>}
                            </label>
                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className={inputClass} placeholder="••••••••" required={!editing} />
                            <InputError message={errors.password} className="mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Phone <span className="text-xs text-on-surface-variant font-normal">(optional)</span></label>
                            <input type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} className={inputClass} placeholder="+1 555 000 0000" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-on-surface mb-1.5">Job Title <span className="text-xs text-on-surface-variant font-normal">(optional)</span></label>
                            <input value={data.title} onChange={e => setData('title', e.target.value)} className={inputClass} placeholder="e.g., Barber, Nail Technician" />
                        </div>
                    </div>

                    {services?.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-on-surface mb-2">Assigned Services</label>
                            <div className="flex flex-wrap gap-2">
                                {services.map(s => (
                                    <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                                            data.service_ids.includes(s.id)
                                                ? 'bg-on-surface text-surface border-on-surface'
                                                : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-on-surface-variant'
                                        }`}
                                    >
                                        {data.service_ids.includes(s.id) && <Icon name="check" size="text-xs" className="mr-1 inline" />}
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex items-center gap-3">
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="peer sr-only" />
                            <div className="peer h-5 w-9 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-on-surface peer-checked:after:translate-x-full" />
                        </label>
                        <span className="text-sm text-on-surface">Active account</span>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing} className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50">
                            {processing ? 'Saving...' : (editing ? 'Save Changes' : 'Add Employee')}
                        </button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
