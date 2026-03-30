import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';

export default function DeleteConfirmModal({ show, onClose, onConfirm, title, message }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container mx-auto mb-4">
                    <Icon name="delete" size="text-xl" className="text-error" />
                </div>
                <h3 className="text-center text-base font-bold text-on-surface mb-1">{title}</h3>
                <p className="text-center text-sm text-on-surface-variant mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-on-error hover:opacity-90 transition-opacity">
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
}
