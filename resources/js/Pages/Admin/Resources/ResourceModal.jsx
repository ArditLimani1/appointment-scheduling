import { useEffect, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import { useT } from '@/i18n/useT';

function firstError(val) {
    if (val == null || val === '') {
        return '';
    }
    return Array.isArray(val) ? val[0] : val;
}

export default function ResourceModal({ show, onClose, editing }) {
    const t = useT();
    const { data, setData, reset } = useForm({
        name: '',
        capacity: '1',
    });
    const { errors: pageErrors = {} } = usePage().props;
    const [capacityError, setCapacityError] = useState('');
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (show) {
            setCapacityError('');
            if (editing) {
                setData({
                    name: editing.name,
                    capacity: String(editing.capacity ?? ''),
                });
            } else {
                reset();
                setData({ name: '', capacity: '1' });
            }
        }
    }, [show, editing?.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setCapacityError('');
        const raw = String(data.capacity ?? '').trim();
        const cap = parseInt(raw, 10);
        if (raw === '' || !Number.isFinite(cap) || cap < 1) {
            setCapacityError(t('admin.shared_resources.modal.capacity_invalid'));
            return;
        }

        const payload = { name: data.name.trim(), capacity: cap };
        const onSuccess = () => {
            onClose();
            reset();
        };

        setPending(true);
        const opts = {
            preserveScroll: true,
            onSuccess,
            onFinish: () => setPending(false),
            onError: () => setPending(false),
        };

        if (editing) {
            router.put(route('admin.shared-resources.update', editing.id), payload, opts);
        } else {
            router.post(route('admin.shared-resources.store'), payload, opts);
        }
    };

    const inputClass =
        'w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-on-primary-container/30 transition-all';

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={handleSubmit} className="p-6">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-on-surface">
                            {editing ? t('admin.shared_resources.modal.edit_title') : t('admin.shared_resources.modal.add_title')}
                        </h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                            {t('admin.shared_resources.modal.intro')}
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
                            {t('admin.shared_resources.modal.name_label')} <span className="text-error">*</span>
                        </label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={inputClass}
                            autoFocus
                            required
                        />
                        <InputError message={firstError(pageErrors.name)} className="mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1.5">
                            {t('admin.shared_resources.modal.capacity_label')} <span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={data.capacity}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '') {
                                    setData('capacity', '');
                                    setCapacityError('');
                                    return;
                                }
                                if (/^\d+$/.test(v)) {
                                    setData('capacity', v);
                                    setCapacityError('');
                                }
                            }}
                            className={inputClass}
                        />
                        <p className="text-xs text-on-surface-variant mt-1">
                            {t('admin.shared_resources.modal.capacity_help')}
                        </p>
                        <InputError message={capacityError || firstError(pageErrors.capacity)} className="mt-1" />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                        {t('admin.shared_resources.modal.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={pending}
                        className="rounded-xl bg-on-surface px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {pending
                            ? t('admin.shared_resources.modal.saving')
                            : editing
                              ? t('admin.shared_resources.modal.save_changes')
                              : t('admin.shared_resources.modal.submit_add')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
