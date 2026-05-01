import Icon from '@/Components/Icon';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'admin-layout:workspace';

function detectFromRoute() {
    try {
        const name = route().current();
        if (!name) return null;
        if (name.startsWith('employee.')) return 'employee';
        if (name.startsWith('admin.')) return 'admin';
        return null;
    } catch {
        return null;
    }
}

export function useWorkspace() {
    const fromRoute = detectFromRoute();

    const [workspace, setWorkspace] = useState(() => {
        if (fromRoute) return fromRoute;
        if (typeof window === 'undefined') return 'admin';
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === 'employee' ? 'employee' : 'admin';
    });

    useEffect(() => {
        if (fromRoute && fromRoute !== workspace) {
            setWorkspace(fromRoute);
        }
    }, [fromRoute, workspace]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, workspace);
    }, [workspace]);

    return [workspace, setWorkspace];
}

export default function WorkspaceTabs({ workspace, onChange, labels, defaultRoutes }) {
    const tabs = [
        { value: 'admin', label: labels.admin, icon: 'admin_panel_settings' },
        { value: 'employee', label: labels.employee, icon: 'badge' },
    ];

    const handleSelect = (value) => {
        if (value === workspace) return;
        const target = defaultRoutes?.[value];
        if (target) {
            try {
                router.visit(route(target));
                return;
            } catch {
                // fall through
            }
        }
        onChange(value);
    };

    return (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-1">
            {tabs.map((tab) => {
                const isSelected = workspace === tab.value;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleSelect(tab.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                            isSelected
                                ? 'bg-primary-container text-white shadow-md'
                                : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                        }`}
                    >
                        <Icon name={tab.icon} filled={isSelected} size="text-base" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
