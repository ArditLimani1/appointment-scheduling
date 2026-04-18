import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import FilterListbox from '@/Components/FilterListbox';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function ServiceModal({ show, onClose, editing, currencySymbol, sharedResources = [] }) {
    const { data, setData, post, put, processing, errors, reset, transform } = useForm({
        name: '',
        duration: 30,
        price: '',
        description: '',
        is_active: true,
        is_popular: false,
        resources: [],
    });

    transform((form) => ({
        ...form,
        resources: (form.resources || [])
            .filter((r) => r.resource_id !== '' && r.resource_id != null)
            .map((r) => ({
                resource_id: Number(r.resource_id),
                quantity: Math.max(1, parseInt(r.quantity, 10) || 1),
            })),
    }));

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
                    resources:
                        editing.shared_resources?.map((r) => ({
                            resource_id: r.id,
                            quantity: r.pivot?.quantity ?? 1,
                        })) ?? [],
                });
            } else {
                reset();
            }
        }
    }, [show, editing?.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.services.update', editing.id), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('admin.services.store'), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    const inputClass =
        'w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all';

    const resourceListboxButtonClass =
        'relative flex w-full min-h-[2.75rem] cursor-pointer items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-left text-sm text-on-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-on-primary-container/30 data-[hover]:border-outline';

    const resourceListboxPanelClass =
        'z-[100] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border border-outline-variant bg-surface-container-low py-1 shadow-lg ring-1 ring-black/5 outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0';

    const resourceListboxOptionClass =
        'group cursor-pointer px-3 py-2.5 text-sm text-on-surface data-[focus]:bg-surface-container-high data-[selected]:bg-on-surface/10 data-[selected]:font-medium';

    const rows = data.resources || [];

    const addResourceRow = () => {
        setData('resources', [...rows, { resource_id: '', quantity: 1 }]);
    };

    const removeResourceRow = (idx) => {
        const next = [...rows];
        next.splice(idx, 1);
        setData('resources', next);
    };

    const updateResourceRow = (idx, field, value) => {
        const next = [...rows];
        next[idx] = { ...next[idx], [field]: value };
        setData('resources', next);
    };

    const selectableForRow = (idx) => {
        const chosenElsewhere = new Set(
            rows.map((r, i) => (i !== idx && r.resource_id ? Number(r.resource_id) : null)).filter(Boolean),
        );
        return sharedResources.filter((s) => !chosenElsewhere.has(s.id));
    };

    const resourceListboxOptionsForRow = (idx, row) => {
        const pool = selectableForRow(idx);
        const currentId = row.resource_id ? Number(row.resource_id) : null;
        if (currentId && !pool.some((s) => s.id === currentId)) {
            const extra = sharedResources.find((s) => s.id === currentId);
            if (extra) {
                pool.push(extra);
            }
        }
        return [
            { value: '', label: 'Select…' },
            ...pool.map((s) => ({ value: s.id, label: s.name })),
        ];
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-on-surface">{editing ? 'Edit Service' : 'Add Service'}</h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                            {editing ? 'Update the service details below.' : 'Create a new service offering'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        <Icon name="close" size="text-xl" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            Service Name <span className="text-error">*</span>
                        </label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={inputClass}
                            placeholder="e.g., Haircut"
                            autoFocus
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            Duration (minutes) <span className="text-error">*</span>
                        </label>
                        <input
                            type="number"
                            min="5"
                            value={data.duration}
                            onChange={(e) => setData('duration', parseInt(e.target.value, 10))}
                            className={inputClass}
                            required
                        />
                        <InputError message={errors.duration} className="mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            Price ({currencySymbol}) <span className="text-error">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            className={inputClass}
                            placeholder="15.00"
                            required
                        />
                        <InputError message={errors.price} className="mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            Description <span className="text-xs text-on-surface-variant font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={2}
                            className={`${inputClass} resize-none`}
                            placeholder="Brief description shown in the table..."
                        />
                    </div>

                    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low/40 p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div>
                                <p className="text-sm font-medium text-on-surface">Shared resources</p>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    Optional. When set, bookings only succeed when enough capacity is free for each
                                    resource.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addResourceRow}
                                disabled={sharedResources.length === 0}
                                className="flex shrink-0 items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                            >
                                <Icon name="add" size="text-sm" /> Add resource
                            </button>
                        </div>
                        {sharedResources.length === 0 ? (
                            <p className="text-xs text-on-surface-variant">
                                Create shared resources under <strong>Resources</strong> in the sidebar to attach them
                                here.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {rows.length === 0 && (
                                    <p className="text-xs text-on-surface-variant">No resources attached.</p>
                                )}
                                {rows.map((row, idx) => {
                                    const listboxOptions = resourceListboxOptionsForRow(idx, row);
                                    const listboxValue =
                                        row.resource_id === '' || row.resource_id == null
                                            ? ''
                                            : Number(row.resource_id);
                                    return (
                                        <div key={idx} className="flex flex-wrap items-end gap-2">
                                            <div className="min-w-[180px] flex-1">
                                                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                                                    Resource
                                                </label>
                                                <FilterListbox
                                                    showLabel={false}
                                                    placeholder="Select…"
                                                    value={listboxValue}
                                                    onChange={(v) =>
                                                        updateResourceRow(
                                                            idx,
                                                            'resource_id',
                                                            v === '' || v == null ? '' : Number(v),
                                                        )
                                                    }
                                                    options={listboxOptions}
                                                    minWidthClass="min-w-0 w-full"
                                                    wrapperClassName="w-full gap-1"
                                                    buttonClassName={resourceListboxButtonClass}
                                                    panelClassName={resourceListboxPanelClass}
                                                    optionClassName={resourceListboxOptionClass}
                                                />
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                                                    Qty
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={row.quantity}
                                                    onChange={(e) =>
                                                        updateResourceRow(
                                                            idx,
                                                            'quantity',
                                                            parseInt(e.target.value, 10) || 1,
                                                        )
                                                    }
                                                    className={inputClass}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeResourceRow(idx)}
                                                className="mb-0.5 p-2 text-outline hover:text-error rounded-lg hover:bg-error-container/30"
                                                title="Remove"
                                            >
                                                <Icon name="close" size="text-lg" />
                                            </button>
                                        </div>
                                    );
                                })}
                                <InputError message={errors.resources} className="mt-1" />
                                {rows.map((_, idx) => (
                                    <InputError key={`qe-${idx}`} message={errors[`resources.${idx}.resource_id`]} />
                                ))}
                                {rows.map((_, idx) => (
                                    <InputError key={`qq-${idx}`} message={errors[`resources.${idx}.quantity`]} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={data.is_popular}
                                onChange={(e) => setData('is_popular', e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="peer h-5 w-9 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-on-surface peer-checked:after:translate-x-full" />
                        </label>
                        <span className="text-sm text-on-surface">Mark as Popular</span>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : editing ? 'Save Changes' : 'Add Service'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
