import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface QuantityDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    initialQuantity?: number;
    unit?: string;
    action: 'add' | 'remove';
    onConfirm: (quantity: number) => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const QuantityDialog: React.FC<QuantityDialogProps> = ({
    isOpen,
    title,
    message,
    initialQuantity = 1,
    unit = '',
    action,
    onConfirm,
    onCancel,
    confirmText = 'Confirmer',
    cancelText = 'Annuler'
}) => {
    const [quantity, setQuantity] = useState(initialQuantity);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset quantity when dialog opens
    useEffect(() => {
        if (isOpen) {
            setQuantity(initialQuantity);
            // Focus input after a short delay to allow render
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, initialQuantity]);

    // Handle escape key
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
            if (e.key === 'Enter' && isOpen) {
                handleConfirm();
            }
        };

        document.addEventListener('keydown', handleKeys);
        return () => document.removeEventListener('keydown', handleKeys);
    }, [isOpen, quantity]); // Re-bind if quantity changes? No, handleConfirm uses current render's closure? No, simplistic.

    // Better to use a stable handler or refs if complex, but simple Enter logic works if deps are right.
    // Actually, the useEffect closure captures 'quantity' from the render where it was created.
    // So we need 'quantity' in dependency array for the Enter key to see the updated value.

    const handleConfirm = () => {
        if (quantity > 0) {
            onConfirm(quantity);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-600">{message}</p>

                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="number"
                            min="1"
                            step="any"
                            value={quantity}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setQuantity(isNaN(val) ? 0 : val);
                            }}
                            className="flex-1 text-center text-2xl font-bold py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                        {unit && (
                            <span className="text-lg font-medium text-slate-500 min-w-[3rem]">
                                {unit}
                            </span>
                        )}
                    </div>
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
                        variant={action === 'remove' ? 'danger' : 'primary'}
                        onClick={handleConfirm}
                        className="flex-1"
                        disabled={quantity <= 0}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
