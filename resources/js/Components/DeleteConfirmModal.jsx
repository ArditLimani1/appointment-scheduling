import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';

const deleteAlertTextClass =
    'rounded-xl border border-error/30 bg-error-container/40 px-3 py-2.5 text-center text-xs font-medium leading-relaxed text-error';

export default function DeleteConfirmModal({ show, onClose, onConfirm, title, message, notice, error, confirmActions, onCancel, cancelLabel }) {
    const t = useT();
    const handleCancel = onCancel ?? onClose;
    const useChoices = Array.isArray(confirmActions) && confirmActions.length > 0;
    const cancelText = cancelLabel ?? t('components.delete_modal.cancel');
    const hasAlerts = Boolean(notice || error);

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm" zIndexClass="z-[100]">
            <div className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container mx-auto mb-4">
                    <Icon name="delete" size="text-xl" className="text-error" />
                </div>
                <h3 className="text-center text-base font-bold text-on-surface mb-1">{title}</h3>
                <p className={`text-center text-sm text-on-surface-variant ${hasAlerts ? 'mb-3' : 'mb-6'}`}>{message}</p>
                {hasAlerts ? (
                    <div className="mb-6 flex flex-col gap-3">
                        {notice ? <p className={deleteAlertTextClass}>{notice}</p> : null}
                        {error ? <p className={deleteAlertTextClass}>{error}</p> : null}
                    </div>
                ) : null}
                {useChoices ? (
                    <div className="flex flex-col gap-2">
                        {confirmActions.map((action, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={action.onClick}
                                className={
                                    action.variant === 'outline'
                                        ? 'rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors'
                                        : 'rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-on-error hover:opacity-90 transition-opacity'
                                }
                            >
                                {action.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="mt-1 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button type="button" onClick={handleCancel} className="flex-1 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                            {cancelText}
                        </button>
                        <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-on-error hover:opacity-90 transition-opacity">
                            {t('components.delete_modal.confirm')}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
