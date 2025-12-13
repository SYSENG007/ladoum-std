import React, { useState } from 'react';
import { Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import clsx from 'clsx';

export type ExportType = 'animals' | 'tasks' | 'transactions' | 'inventory' | 'report';

interface ExportButtonProps {
    onExport: (type: ExportType) => void;
    types?: ExportType[];
    label?: string;
    loading?: boolean;
    className?: string;
}

const exportLabels: Record<ExportType, string> = {
    animals: 'Animaux',
    tasks: 'Tâches',
    transactions: 'Transactions',
    inventory: 'Inventaire',
    report: 'Rapport mensuel',
};

export const ExportButton: React.FC<ExportButtonProps> = ({
    onExport,
    types = ['animals', 'tasks', 'transactions', 'inventory'],
    label = 'Exporter',
    loading = false,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Si un seul type, bouton simple
    if (types.length === 1) {
        return (
            <Button
                variant="secondary"
                icon={Download}
                onClick={() => onExport(types[0])}
                disabled={loading}
                className={className}
            >
                {loading ? 'Export...' : label}
            </Button>
        );
    }

    return (
        <div className={clsx("relative", className)}>
            <Button
                variant="secondary"
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className="flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                {loading ? 'Export...' : label}
                <ChevronDown className={clsx(
                    "w-4 h-4 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-2">
                        {types.map(type => (
                            <button
                                key={type}
                                onClick={() => {
                                    onExport(type);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                                {exportLabels[type]}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// Hook pour faciliter l'utilisation
export const useExport = () => {
    const [loading, setLoading] = useState(false);

    const handleExport = async (
        _type: ExportType,
        exportFn: () => void | Promise<void>
    ) => {
        setLoading(true);
        try {
            await exportFn();
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setLoading(false);
        }
    };

    return { loading, handleExport };
};
