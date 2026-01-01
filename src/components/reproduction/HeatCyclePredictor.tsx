import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Calendar, Clock, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import {
    predictNextHeat,
    getReproductiveStatus,
    formatReproductiveStatus,
    getStatusColor
} from '../../utils/heatPrediction';
import type { Animal } from '../../types';

interface HeatCyclePredictorProps {
    animal: Animal;
    compact?: boolean;
}

export const HeatCyclePredictor: React.FC<HeatCyclePredictorProps> = ({ animal, compact = false }) => {
    if (animal.gender !== 'Female') {
        return null;
    }

    const prediction = predictNextHeat(animal);
    const status = getReproductiveStatus(animal);
    const statusColor = getStatusColor(status);

    if (!prediction) {
        // Check if animal is pregnant to show appropriate message
        const isPregnant = status === 'Pregnant';

        return (
            <Card>
                <div className="text-center py-6 text-slate-500">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    {isPregnant ? (
                        <>
                            <p className="text-sm font-medium text-slate-700">Animal gestante</p>
                            <p className="text-xs mt-1">Les prédictions de chaleurs reprendront après la mise bas.</p>
                        </>
                    ) : (
                        <p className="text-sm">Pas assez de données pour prédire les chaleurs.</p>
                    )}
                </div>
            </Card>
        );
    }

    const daysUntilHeat = Math.ceil(
        (new Date(prediction.nextHeatDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const isInWindow = daysUntilHeat <= 2 && daysUntilHeat >= -2;
    const isUpcoming = daysUntilHeat > 0 && daysUntilHeat <= 5;

    if (compact) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-medium text-slate-700">Cycle Reproducteur</span>
                    </div>
                    <Badge variant={statusColor as any}>
                        {formatReproductiveStatus(status)}
                    </Badge>
                </div>

                {status !== 'Pregnant' && (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">Prochaines chaleurs</p>
                            <p className="text-lg font-bold text-slate-900">
                                {new Date(prediction.nextHeatDate).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </p>
                        </div>
                        {isInWindow && (
                            <Badge variant="warning">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Période active
                            </Badge>
                        )}
                        {isUpcoming && !isInWindow && (
                            <Badge variant="info">
                                Dans {daysUntilHeat}j
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-pink-50 rounded-2xl text-pink-600">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Prédiction des Chaleurs</h3>
                    <p className="text-sm text-slate-500">{animal.name}</p>
                </div>
            </div>

            {/* Current Status */}
            <div className="p-4 bg-slate-50 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Statut actuel</span>
                    <Badge variant={statusColor as any} className="text-sm">
                        {formatReproductiveStatus(status)}
                    </Badge>
                </div>
            </div>

            {status === 'Pregnant' ? (
                <div className="p-4 bg-secondary-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-primary-700">
                        Cette brebis est gestante. Les prédictions de chaleurs reprendront après la mise bas.
                    </p>
                </div>
            ) : (
                <>
                    {/* Next Heat Date */}
                    <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-4 mb-4 border border-pink-200">
                        <p className="text-sm text-pink-700 mb-2">Prochaine chaleur prédite</p>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-pink-900">
                                {new Date(prediction.nextHeatDate).toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </span>
                            {isInWindow && (
                                <Badge variant="warning" className="mb-1">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    En cours
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Surveillance Window */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                            <p className="text-xs text-slate-500 mb-1">Début surveillance</p>
                            <p className="font-bold text-slate-900">
                                {new Date(prediction.windowStart).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </p>
                        </div>
                        <div className="p-3 bg-pink-50 rounded-xl text-center border-2 border-pink-200">
                            <p className="text-xs text-pink-600 mb-1">Date prévue</p>
                            <p className="font-bold text-pink-700">
                                {new Date(prediction.nextHeatDate).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                            <p className="text-xs text-slate-500 mb-1">Fin surveillance</p>
                            <p className="font-bold text-slate-900">
                                {new Date(prediction.windowEnd).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Cycle moyen</p>
                                <p className="font-bold text-slate-900">{prediction.averageCycleLength} jours</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Confiance</p>
                                <Badge variant={
                                    prediction.confidence === 'High' ? 'success' :
                                        prediction.confidence === 'Medium' ? 'warning' : 'neutral'
                                }>
                                    {prediction.confidence === 'High' ? 'Élevée' :
                                        prediction.confidence === 'Medium' ? 'Moyenne' : 'Faible'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {prediction.basedOnCycles > 0 && (
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Basé sur {prediction.basedOnCycles} cycle(s) enregistré(s)
                        </p>
                    )}
                </>
            )}
        </Card>
    );
};
