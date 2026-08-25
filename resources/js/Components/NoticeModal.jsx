import Modal from '@/Components/Modal';
import Icon from '@/Components/Icon';
import { useT } from '@/i18n/useT';

export default function NoticeModal({ show, title, body, onClose, icon = 'info' }) {
    const t = useT();

    return (
        <Modal show={show} onClose={onClose} maxWidth="md" zIndexClass="z-[110]">
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
                        <Icon name={icon} size="text-xl" className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-extrabold text-on-surface">{title}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{body}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-on-surface px-6 py-2.5 text-sm font-bold text-surface hover:opacity-90 transition-opacity"
                    >
                        {t('common.actions.close')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
