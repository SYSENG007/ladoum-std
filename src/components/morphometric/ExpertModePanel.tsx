/**
 * ExpertModePanel - Detailed technical breakdown for expert mode
 */

import React from 'react';
import { Card } from '../ui/Card';
import type { MorphometricScore } from '../../types/morphometric';

interface ExpertModePanelProps {
    score: MorphometricScore;
}

export const ExpertModePanel: React.FC<ExpertModePanelProps> = ({ score }) => {
    const metrics = [
        { name: 'Masse', data: score.breakdown.mass, weight: score.weights.mass },
        { name: 'Hauteur (HG)', data: score.breakdown.height, weight: score.weights.height },
        { name: 'Longueur (LCS)', data: score.breakdown.length, weight: score.weights.length },
        { name: 'Poitrine (TP)', data: score.breakdown.chest, weight: score.weights.chest },
        { name: 'Fonctionnel', data: score.breakdown.functional, weight: score.weights.functional },
    ];

    return (
        <Card>
            <div className="mb-4">
                <h4 className="text-lg font-bold text-slate-900">Mode Expert - Détails Techniques</h4>
                <p className="text-xs text-slate-500 mt-1">
                    Données statistiques avancées et méthodologie de calcul
                </p>
            </div>

            {/* Detailed metrics table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-slate-200">
                        <tr className="text-left">
                            <th className="pb-2 font-semibold text-slate-700">Métrique</th>
                            <th className="pb-2 font-semibold text-slate-700 text-right">Valeur</th>
                            <th className="pb-2 font-semibold text-slate-700 text-right">Z-Score</th>
                            <th className="pb-2 font-semibold text-slate-700 text-right">Percentile</th>
                            <th className="pb-2 font-semibold text-slate-700 text-right">Poids</th>
                            <th className="pb-2 font-semibold text-slate-700 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {metrics.map((metric) => (
                            <tr key={metric.name} className="hover:bg-slate-50">
                                <td className="py-2 font-medium text-slate-900">{metric.name}</td>
                                <td className="py-2 text-right text-slate-700">
                                    {metric.data?.available
                                        ? `${metric.data.value.toFixed(1)}`
                                        : '—'}
                                </td>
                                <td className="py-2 text-right font-mono text-slate-700">
                                    {metric.data?.available
                                        ? metric.data.zScore.toFixed(2)
                                        : '—'}
                                </td>
                                <td className="py-2 text-right text-slate-700">
                                    {metric.data?.available
                                        ? `${metric.data.percentile}e`
                                        : '—'}
                                </td>
                                <td className="py-2 text-right text-slate-700">
                                    {(metric.weight * 100).toFixed(0)}%
                                </td>
                                <td className="py-2 text-center">
                                    {metric.data?.available ? (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                            Disponible
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">
                                            Manquant
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Methodology explanation */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs space-y-2">
                <div>
                    <span className="font-semibold text-blue-900">Formule de calcul :</span>
                    <p className="text-blue-800 mt-1 font-mono">
                        Score = Σ(Z normalisé × poids) → ramené sur 100
                    </p>
                </div>

                <div>
                    <span className="font-semibold text-blue-900">Z-Score :</span>
                    <p className="text-blue-800 mt-1">
                        Nombre d'écarts-types par rapport à la moyenne du troupeau.
                        Z = (valeur - moyenne) / écart-type
                    </p>
                </div>

                <div>
                    <span className="font-semibold text-blue-900">Percentile :</span>
                    <p className="text-blue-800 mt-1">
                        Position de l'animal dans la distribution du troupeau (0-100).
                        Un percentile de 75 signifie que l'animal est meilleur que 75% du troupeau.
                    </p>
                </div>

                <div>
                    <span className="font-semibold text-blue-900">Indice de confiance :</span>
                    <p className="text-blue-800 mt-1">
                        {(score.confidence * 100).toFixed(0)}%
                        ({Object.values(score.breakdown).filter(v => v?.available).length}/4 mesures disponibles).
                        Plus cet indice est élevé, plus le score est fiable.
                    </p>
                </div>
            </div>
        </Card>
    );
};
