import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function EmployeeModal({ show, onClose, editing, services, businessRoles = [], businessOwnerId }) {
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
    }, [show]);

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

    const toggleService = (id) => {
        setData('service_ids', data.service_ids.includes(id)
            ? data.service_ids.filter(s => s !== id)
            : [...data.service_ids, id]);
    };

    const inputClass = "w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all";

    const editingOwner = editing && businessOwnerId != null && editing.id === businessOwnerId;

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={handleSubmit} className="p-6">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-on-surface">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">{editing ? 'Update employee details below.' : 'Add a new team member to your business.'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors">
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
                    {!editingOwner && (
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                Access role <span className="text-xs text-on-surface-variant font-normal">(optional)</span>
                            </label>
                            <select
                                value={data.business_role_id}
                                onChange={(e) => setData('business_role_id', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Default — full employee workspace only</option>
                                {businessRoles.map((r) => (
                                    <option key={r.id} value={String(r.id)}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-on-surface-variant mt-1.5">
                                Create roles under Roles &amp; permissions to give managers access to parts of the admin panel.
                            </p>
                            <InputError message={errors.business_role_id} className="mt-1" />
                        </div>
                    )}
                    {editingOwner && (
                        <div className="sm:col-span-2 rounded-xl border border-outline-variant/50 bg-surface-container-low/40 px-4 py-3">
                            <p className="text-sm font-medium text-on-surface">Business owner</p>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Admin access is always available. To appear on the booking page as staff, use{' '}
                                <strong>Configuration</strong> → <strong>I also work as staff</strong>.
                            </p>
                        </div>
                    )}
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
                    <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={processing} className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50">
                        {processing ? 'Saving...' : (editing ? 'Save Changes' : 'Add Employee')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
