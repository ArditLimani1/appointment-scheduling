import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function ServiceModal({ show, onClose, editing, currencySymbol }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        duration: 30,
        price: '',
        description: '',
        is_active: true,
        is_popular: false,
        icon: '',
    });

    useEffect(() => {
        if (show) {
            if (editing) {
                setData({
                    name: editing.name,
                    duration: editing.duration,
                    price: editing.price,
                    description: editing.description || '',
                    is_active: editing.is_active,
                    is_popular: editing.is_popular,
                    icon: editing.icon ?? '',
                });
            } else {
                reset();
            }
        }
    }, [show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.services.update', editing.id), {
                onSuccess: () => { onClose(); reset(); },
            });
        } else {
            post(route('admin.services.store'), {
                onSuccess: () => { onClose(); reset(); },
            });
        }
    };

    const inputClass = "w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all";

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={handleSubmit} className="p-6">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-on-surface">{editing ? 'Edit Service' : 'Add Service'}</h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">{editing ? 'Update the service details below.' : 'Create a new service offering'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors">
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
                    <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={processing} className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50">
                        {processing ? 'Saving...' : (editing ? 'Save Changes' : 'Add Service')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
