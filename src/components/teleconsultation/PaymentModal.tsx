import React, { useState } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { PaymentMethod } from '../../types/consultation';
import clsx from 'clsx';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    onPayment: (method: PaymentMethod) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    amount,
    onPayment
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handlePayment = async () => {
        if (!selectedMethod) return;

        setProcessing(true);
        setError(null);

        try {
            await onPayment(selectedMethod);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setSelectedMethod(null);
            }, 2000);
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setProcessing(false);
        }
    };

    const paymentMethods = [
        {
            id: 'MobileMoney' as PaymentMethod,
            name: 'Mobile Money',
            description: 'Orange Money, Wave, Free Money',
            icon: Smartphone,
            color: 'orange'
        },
        {
            id: 'Card' as PaymentMethod,
            name: 'Carte Bancaire',
            description: 'Visa, Mastercard',
            icon: CreditCard,
            color: 'blue'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold">Paiement de la Consultation</h2>
                    <p className="text-primary-100 mt-1">Sélectionnez votre mode de paiement</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Amount display */}
                    <div className="text-center mb-6 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-1">Montant à payer</p>
                        <p className="text-3xl font-bold text-slate-900">
                            {amount.toLocaleString()} <span className="text-lg">FCFA</span>
                        </p>
                    </div>

                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Paiement Réussi!</h3>
                            <p className="text-slate-500">Votre paiement a été confirmé.</p>
                        </div>
                    ) : (
                        <>
                            {/* Error message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {/* Payment methods */}
                            <div className="space-y-3 mb-6">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={clsx(
                                            'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                                            selectedMethod === method.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        <div className={clsx(
                                            'p-3 rounded-xl',
                                            method.color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'
                                        )}>
                                            <method.icon className={clsx(
                                                'w-6 h-6',
                                                method.color === 'orange' ? 'text-orange-600' : 'text-blue-600'
                                            )} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-slate-900">{method.name}</p>
                                            <p className="text-sm text-slate-500">{method.description}</p>
                                        </div>
                                        <div className={clsx(
                                            'w-5 h-5 rounded-full border-2 transition-all',
                                            selectedMethod === method.id
                                                ? 'border-primary-500 bg-primary-500'
                                                : 'border-slate-300'
                                        )}>
                                            {selectedMethod === method.id && (
                                                <CheckCircle className="w-full h-full text-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={onClose}
                                    className="flex-1"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handlePayment}
                                    disabled={!selectedMethod || processing}
                                    className="flex-1"
                                >
                                    {processing ? 'Traitement...' : 'Payer'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
