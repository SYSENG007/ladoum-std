import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'default'
}) => {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {variant === 'danger' && (
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Message */}
                <div className="p-6">
                    <p className="text-slate-600">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-0">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        className="flex-1"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
