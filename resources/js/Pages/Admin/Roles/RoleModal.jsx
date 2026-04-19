import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import { useT } from '@/i18n/useT';

export default function RoleModal({ show, onClose, editing, permissionGroups }) {
    const t = useT();
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
                            {editing ? t('admin.roles.modal.edit_title') : t('admin.roles.modal.add_title')}
                        </h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                            {t('admin.roles.modal.intro')}
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
                        {t('admin.roles.modal.name_label')} <span className="text-error">*</span>
                    </label>
                    <input
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={inputClass}
                        autoFocus
                        required
                    />
                    <InputError message={errors.name} className="mt-1" />
                </div>

                <div className="mt-5">
                    <p className="text-sm font-medium text-on-surface mb-2">{t('admin.roles.modal.permissions')}</p>
                    <InputError message={errors.permissions} className="mb-2" />

                    <p className={groupTitleClass}>{t('admin.roles.modal.group_admin')}</p>
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

                    <p className={groupTitleClass}>{t('admin.roles.modal.group_employee')}</p>
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
                        {t('admin.roles.modal.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {processing
                            ? t('admin.roles.modal.saving')
                            : editing
                              ? t('admin.roles.modal.save_changes')
                              : t('admin.roles.modal.submit_create')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
