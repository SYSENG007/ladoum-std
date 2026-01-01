import React from 'react';
import { X, Calendar, Heart, Baby, AlertTriangle, CheckCircle, HeartPulse, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { CalendarEvent } from './HeatCalendar';

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event }) => {
    if (!isOpen || !event) return null;

    const getEventIcon = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'heat': return HeartPulse;
            case 'mating': return Heart;
            case 'birth': return Baby;
            case 'abortion': return AlertTriangle;
            case 'ultrasound': return CheckCircle;
            case 'birth_prediction': return Calendar;
            default: return Calendar;
        }
    };

    const getEventTitle = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'heat': return 'Chaleur Prédite';
            case 'mating': return 'Saillie Enregistrée';
            case 'birth': return 'Mise-bas';
            case 'abortion': return 'Avortement';
            case 'ultrasound': return 'Échographie';
            case 'birth_prediction': return 'Mise-bas Prévue';
            default: return 'Événement';
        }
    };

    const getEventColor = (type: CalendarEvent['type']) => {
        switch (type) {
            case 'heat': return 'pink';
            case 'mating': return 'purple';
            case 'birth': return 'green';
            case 'abortion': return 'red';
            case 'ultrasound': return 'blue';
            case 'birth_prediction': return 'orange';
            default: return 'slate';
        }
    };

    const Icon = getEventIcon(event.type);
    const color = getEventColor(event.type);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-primary-600 rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className={`bg-gradient-to-r from-${color}-500 to-${color}-600 p-6 flex items-center justify-between rounded-t-2xl`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{getEventTitle(event.type)}</h2>
                            <p className="text-sm text-white/80">
                                {new Date(event.date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Animal Info */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                        <img
                            src={event.animal.photoUrl}
                            alt={event.animal.name}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white">{event.animal.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {event.animal.tagId} • {event.animal.breed}
                            </p>
                        </div>
                    </div>

                    {/* Event-specific details */}
                    <div className="space-y-3">
                        {/* Mating: Show partner */}
                        {event.type === 'mating' && event.mate && (
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                                    Partenaire
                                </label>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {event.mate.name} ({event.mate.tagId})
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Birth: Show offspring count */}
                        {event.type === 'birth' && event.record?.offspringCount && (
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                                    Nombre d'agneaux
                                </label>
                                <Badge variant="success" className="text-sm">
                                    {event.record.offspringCount} agneau{event.record.offspringCount > 1 ? 'x' : ''}
                                </Badge>
                            </div>
                        )}

                        {/* Birth: Show outcome */}
                        {event.type === 'birth' && event.record?.outcome && (
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                                    Détails
                                </label>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{event.record.outcome}</p>
                            </div>
                        )}

                        {/* Ultrasound: Show result */}
                        {event.type === 'ultrasound' && event.record?.ultrasoundResult && (
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                                    Résultat
                                </label>
                                <Badge variant={event.record.ultrasoundResult === 'Positive' ? 'success' : 'warning'}>
                                    {event.record.ultrasoundResult === 'Positive' ? '✅ Gestante' : '❌ Non gestante'}
                                </Badge>
                            </div>
                        )}

                        {/* Heat Prediction: Show window */}
                        {event.type === 'heat' && event.prediction && (
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                                    Fenêtre de surveillance
                                </label>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {new Date(event.prediction.windowStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    {' - '}
                                    {new Date(event.prediction.windowEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Confiance: {event.prediction.confidence}%
                                </p>
                            </div>
                        )}

                        {/* Birth Prediction: Show window */}
                        {event.type === 'birth_prediction' && event.gestationPrediction && (
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                                    Fenêtre de mise-bas (±5 jours)
                                </label>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {new Date(event.gestationPrediction.windowStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    {' - '}
                                    {new Date(event.gestationPrediction.windowEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {event.gestationPrediction.daysRemaining} jours restants
                                </p>
                            </div>
                        )}

                        {/* Notes */}
                        {event.record?.notes && (
                            <div>
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                                    Notes
                                </label>
                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                                    {event.record.notes}
                                </p>
                            </div>
                        )}

                        {/* Window indicator */}
                        {event.isInWindow && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                    Date prévue exacte - Surveillance recommandée
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Fermer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
