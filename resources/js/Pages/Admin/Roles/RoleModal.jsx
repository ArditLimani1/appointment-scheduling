import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';

export default function RoleModal({ show, onClose, editing, permissionGroups }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        permissions: [],
    });

    useEffect(() => {
        if (show) {
            if (editing) {
                setData({
                    name: editing.name,
                    permissions: editing.permissions || [],
                });
            } else {
                reset();
            }
        }
    }, [show, editing?.id]);

    const togglePermission = (value) => {
        setData(
            'permissions',
            data.permissions.includes(value)
                ? data.permissions.filter((p) => p !== value)
                : [...data.permissions, value],
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.roles.update', editing.id), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('admin.roles.store'), {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    const inputClass =
        'w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all';

    const groupTitleClass = 'text-xs font-bold uppercase tracking-widest text-outline mt-4 first:mt-0 mb-2';

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-on-surface">
                            {editing ? 'Edit role' : 'Create role'}
                        </h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                            Name the role and choose what this person can access. Staff with any admin capability can
                            open the dashboard; other sections follow the boxes you select.
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

                <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                        Role name <span className="text-error">*</span>
                    </label>
                    <input
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. Business manager"
                        autoFocus
                        required
                    />
                    <InputError message={errors.name} className="mt-1" />
                </div>

                <div className="mt-5">
                    <p className="text-sm font-medium text-on-surface mb-2">Permissions</p>
                    <InputError message={errors.permissions} className="mb-2" />

                    <p className={groupTitleClass}>Admin panel</p>
                    <div className="flex flex-col gap-2">
                        {permissionGroups.admin.map((p) => (
                            <label
                                key={p.value}
                                className="flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/50 px-3 py-2.5 cursor-pointer hover:bg-surface-container-low transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    className="mt-0.5 rounded border-outline-variant text-on-surface focus:ring-on-primary-container/30"
                                    checked={data.permissions.includes(p.value)}
                                    onChange={() => togglePermission(p.value)}
                                />
                                <span className="text-sm text-on-surface leading-snug">{p.label}</span>
                            </label>
                        ))}
                    </div>

                    <p className={groupTitleClass}>Employee workspace</p>
                    <div className="flex flex-col gap-2">
                        {permissionGroups.employee.map((p) => (
                            <label
                                key={p.value}
                                className="flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/50 px-3 py-2.5 cursor-pointer hover:bg-surface-container-low transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    className="mt-0.5 rounded border-outline-variant text-on-surface focus:ring-on-primary-container/30"
                                    checked={data.permissions.includes(p.value)}
                                    onChange={() => togglePermission(p.value)}
                                />
                                <span className="text-sm text-on-surface leading-snug">{p.label}</span>
                            </label>
                        ))}
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
                        {processing ? 'Saving...' : editing ? 'Save changes' : 'Create role'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
