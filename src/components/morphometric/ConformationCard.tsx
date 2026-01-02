/**
 * ConformationCard - Central morphological analysis card
 * Displays score gauge, radar chart, and auto-generated summary
 */

import React from 'react';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { AlertTriangle } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import { MorphometricRadar } from './MorphometricRadar';
import type { MorphometricScore, HerdStatistics } from '../../types/morphometric';
import type { Animal } from '../../types';
import { getLatestMeasurements } from '../../utils/morphometrics';

interface ConformationCardProps {
    score: MorphometricScore;
    animal: Animal;
    herdStats: HerdStatistics;
}

export const ConformationCard: React.FC<ConformationCardProps> = ({
    score,
    animal,
    herdStats,
}) => {
    const latestMeasurements = getLatestMeasurements(animal);

    // Prepare data for radar
    const animalData = {
        mass: latestMeasurements?.hg || null, // TODO: fix to use weight
        height: latestMeasurements?.hg || null,
        length: latestMeasurements?.lcs || null,
        chest: latestMeasurements?.tp || null,
    };

    return (
        <Card className="h-full">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="p-2 bg-primary-100 text-primary-600 rounded-lg">📊</span>
                    Conformation Morphologique
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    Analyse comparative basée sur les mesures du troupeau
                </p>
            </div>

            {/* Low confidence warning */}
            {score.confidence < 0.5 && (
                <Alert variant="warning" className="mb-6">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium">Données insuffisantes pour un scoring fiable</p>
                            <p className="text-xs mt-1">
                                Complétez les mesures morphométriques (poids, hauteur, longueur, poitrine)
                                pour obtenir un score avec plus de confiance.
                            </p>
                        </div>
                    </div>
                </Alert>
            )}

            {/* Main visualization: Gauge + Radar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Left: Score Gauge */}
                <div className="flex items-center justify-center py-6">
                    <ScoreGauge
                        score={score.globalScore}
                        classification={score.classification}
                        confidence={score.confidence}
                    />
                </div>

                {/* Right: Radar Chart */}
                <div className="h-[280px]">
                    <MorphometricRadar
                        animalData={animalData}
                        herdAverage={herdStats.mean}
                    />
                </div>
            </div>

            {/* Auto-generated summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Synthèse Morphologique
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                    {score.summary}
                </p>
            </div>

            {/* Confidence indicator note */}
            {score.confidence < 0.8 && score.confidence >= 0.5 && (
                <p className="text-xs text-slate-500 mt-4 italic">
                    Score calculé avec un indice de confiance de {(score.confidence * 100).toFixed(0)}%
                    ({Math.round(score.confidence * 4)}/4 mesures disponibles)
                </p>
            )}
        </Card>
    );
};
