import React, { useState } from 'react';
import { Calendar, Clock, MessageCircle, CreditCard, Play, Check, X, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ConsultationService } from '../../services/ConsultationService';
import type { Consultation } from '../../types/consultation';
import clsx from 'clsx';

interface ConsultationCardProps {
    consultation: Consultation;
    animalNames?: string[];
    onUpdate?: () => void;
}

export const ConsultationCard: React.FC<ConsultationCardProps> = ({
    consultation,
    animalNames = [],
    onUpdate
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(false);

    const getStatusBadge = () => {
        switch (consultation.status) {
            case 'Scheduled':
                return <Badge variant="info">Programmée</Badge>;
            case 'InProgress':
                return <Badge variant="warning">En cours</Badge>;
            case 'Completed':
                return <Badge variant="success">Terminée</Badge>;
            case 'Cancelled':
                return <Badge variant="error">Annulée</Badge>;
        }
    };

    const getPaymentBadge = () => {
        switch (consultation.paymentStatus) {
            case 'Paid':
                return <Badge variant="success" className="text-xs">Payé</Badge>;
            case 'Pending':
                return <Badge variant="warning" className="text-xs">En attente</Badge>;
            case 'Refunded':
                return <Badge variant="neutral" className="text-xs">Remboursé</Badge>;
        }
    };

    const getTypeLabel = () => {
        switch (consultation.type) {
            case 'Health': return 'Santé';
            case 'Reproduction': return 'Reproduction';
            case 'Nutrition': return 'Nutrition';
        }
    };

    const getTypeColor = () => {
        switch (consultation.type) {
            case 'Health': return 'text-red-600 bg-red-50';
            case 'Reproduction': return 'text-purple-600 bg-purple-50';
            case 'Nutrition': return 'text-green-600 bg-green-50';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleStatusChange = async (newStatus: 'InProgress' | 'Completed' | 'Cancelled') => {
        setLoading(true);
        setShowMenu(false);
        try {
            await ConsultationService.updateStatus(consultation.id, newStatus);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Erreur lors de la mise à jour du statut');
        } finally {
            setLoading(false);
        }
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    return (
        <div className="relative">
            <Link to={`/teleconsultation/${consultation.id}`}>
                <Card className={clsx(
                    "hover:shadow-lg transition-shadow duration-200 cursor-pointer",
                    loading && "opacity-50"
                )}>
                    <div className="flex gap-4">
                        {/* Type icon */}
                        <div className={clsx('p-3 rounded-xl h-fit', getTypeColor())}>
                            <MessageCircle className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-900">
                                        Consultation {getTypeLabel()}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        Dr. {consultation.veterinarianName || 'Vétérinaire'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge()}
                                        {getPaymentBadge()}
                                    </div>
                                    {/* Action Menu Button */}
                                    {consultation.status !== 'Completed' && consultation.status !== 'Cancelled' && (
                                        <button
                                            onClick={handleMenuClick}
                                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Animals */}
                            {animalNames.length > 0 && (
                                <p className="text-sm text-slate-600 mb-2">
                                    🐑 {animalNames.join(', ')}
                                </p>
                            )}

                            {/* Meta info */}
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(consultation.scheduledDate)}</span>
                                </div>
                                {consultation.scheduledTime && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{consultation.scheduledTime}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 ml-auto">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="font-medium">{consultation.amount?.toLocaleString() || 0} FCFA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </Link>

            {/* Action Menu Dropdown */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => handleActionClick(e, () => setShowMenu(false))}
                    />
                    <div className="absolute right-4 top-16 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20 min-w-48">
                        {consultation.status === 'Scheduled' && (
                            <button
                                onClick={(e) => handleActionClick(e, () => handleStatusChange('InProgress'))}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 text-sm"
                            >
                                <Play className="w-4 h-4 text-blue-600" />
                                <span className="text-slate-700">Démarrer la consultation</span>
                            </button>
                        )}
                        {consultation.status === 'InProgress' && (
                            <button
                                onClick={(e) => handleActionClick(e, () => handleStatusChange('Completed'))}
                                className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 text-sm"
                            >
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-slate-700">Terminer la consultation</span>
                            </button>
                        )}
                        {(consultation.status === 'Scheduled' || consultation.status === 'InProgress') && (
                            <button
                                onClick={(e) => handleActionClick(e, () => handleStatusChange('Cancelled'))}
                                className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm border-t border-slate-100"
                            >
                                <X className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">Annuler la consultation</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
