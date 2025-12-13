import React, { useState, useMemo } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
    Calculator,
    Calendar,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Ruler,
    Activity
} from 'lucide-react';
import {
    calculateInbreedingCoefficient,
    getInbreedingRisk,
    findCommonAncestors
} from '../../utils/genetics';
import {
    predictOffspringMorphometrics,
    scoreMorphometricCompatibility
} from '../../utils/morphometrics';
import type { BreedingCompatibility, Animal } from '../../types';

interface SimulationResult extends BreedingCompatibility {
    sire: Animal;
    dam: Animal;
    dueDate: string;
}

export const BreedingCalculator: React.FC = () => {
    const { animals, loading } = useAnimals();
    const [sireId, setSireId] = useState('');
    const [damId, setDamId] = useState('');
    const [result, setResult] = useState<SimulationResult | null>(null);

    // Filter active males and females
    const sires = useMemo(() =>
        animals.filter(a => a.gender === 'Male' && a.status === 'Active'),
        [animals]
    );

    const dams = useMemo(() =>
        animals.filter(a => a.gender === 'Female' && a.status === 'Active'),
        [animals]
    );

    const calculate = () => {
        if (!sireId || !damId) return;

        const sire = animals.find(a => a.id === sireId);
        const dam = animals.find(a => a.id === damId);

        if (!sire || !dam) return;

        // Calculate inbreeding coefficient
        const inbreedingCoefficient = calculateInbreedingCoefficient(sireId, damId, animals);
        const inbreedingRisk = getInbreedingRisk(inbreedingCoefficient);

        // Find common ancestors
        const commonAncestors = findCommonAncestors(sireId, damId, animals);

        // Calculate morphometric predictions
        const morphometricPrediction = predictOffspringMorphometrics(sire, dam, animals);
        const morphometricScore = scoreMorphometricCompatibility(sire, dam, animals);

        // Calculate overall score (0-100)
        // Penalize for inbreeding, reward for morphometric potential
        const inbreedingPenalty = inbreedingCoefficient * 50;
        const overallScore = Math.round(
            (morphometricScore * 0.6) +
            ((100 - inbreedingPenalty) * 0.4)
        );

        // Determine recommendation
        let recommendation: 'Excellent' | 'Good' | 'Caution' | 'NotRecommended';
        if (overallScore >= 85 && inbreedingRisk === 'Low') {
            recommendation = 'Excellent';
        } else if (overallScore >= 70 && inbreedingRisk !== 'High') {
            recommendation = 'Good';
        } else if (overallScore >= 50 || inbreedingRisk === 'Medium') {
            recommendation = 'Caution';
        } else {
            recommendation = 'NotRecommended';
        }

        // Due date: Today + 150 days (sheep gestation)
        const today = new Date();
        const due = new Date(today.setDate(today.getDate() + 150));
        const dueDate = due.toLocaleDateString('fr-FR');

        setResult({
            sire,
            dam,
            overallScore,
            inbreedingCoefficient,
            inbreedingRisk,
            morphometricScore,
            morphometricPrediction,
            commonAncestors,
            recommendation,
            dueDate
        });
    };

    const getRecommendationBadge = () => {
        if (!result) return null;

        const variants = {
            'Excellent': { variant: 'success' as const, label: 'Excellent choix' },
            'Good': { variant: 'info' as const, label: 'Bon choix' },
            'Caution': { variant: 'warning' as const, label: 'Prudence' },
            'NotRecommended': { variant: 'error' as const, label: 'Déconseillé' }
        };

        const { variant, label } = variants[result.recommendation];
        return <Badge variant={variant}>{label}</Badge>;
    };

    if (loading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                    <Calculator className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Simulateur d'Accouplement</h3>
                    <p className="text-sm text-slate-500">Analyse génétique et morphométrique réelle.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Père (Sire)</label>
                    <select
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                        value={sireId}
                        onChange={(e) => { setSireId(e.target.value); setResult(null); }}
                    >
                        <option value="">Sélectionner un mâle</option>
                        {sires.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.tagId})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mère (Dam)</label>
                    <select
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
                        value={damId}
                        onChange={(e) => { setDamId(e.target.value); setResult(null); }}
                    >
                        <option value="">Sélectionner une femelle</option>
                        {dams.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.name} ({d.tagId})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <Button
                onClick={calculate}
                disabled={!sireId || !damId}
                className="w-full mb-6"
            >
                Lancer la simulation
            </Button>

            {result && (
                <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-primary-700">Score Global</span>
                            {getRecommendationBadge()}
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-primary-900">{result.overallScore}</span>
                            <span className="text-lg text-primary-600 mb-1">/100</span>
                        </div>
                        <div className="mt-2 h-2 bg-primary-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                                style={{ width: `${result.overallScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Inbreeding */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-600">Consanguinité</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-slate-900">
                                    {(result.inbreedingCoefficient * 100).toFixed(1)}%
                                </span>
                                <Badge variant={
                                    result.inbreedingRisk === 'Low' ? 'success' :
                                        result.inbreedingRisk === 'Medium' ? 'warning' : 'error'
                                }>
                                    {result.inbreedingRisk === 'Low' ? 'Faible' :
                                        result.inbreedingRisk === 'Medium' ? 'Moyen' : 'Élevé'}
                                </Badge>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-600">Mise bas prévue</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900">{result.dueDate}</span>
                        </div>
                    </div>

                    {/* Morphometric Predictions */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Ruler className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">Prédictions Morphométriques</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">Hauteur (HG)</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {result.morphometricPrediction.predictedHG} cm
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <TrendingUp className={`w-3 h-3 ${result.morphometricPrediction.comparedToHerdAverage.hg >= 0
                                            ? 'text-green-500' : 'text-red-500'
                                        }`} />
                                    <span className={`text-xs ${result.morphometricPrediction.comparedToHerdAverage.hg >= 0
                                            ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {result.morphometricPrediction.comparedToHerdAverage.hg >= 0 ? '+' : ''}
                                        {result.morphometricPrediction.comparedToHerdAverage.hg}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">Longueur (LCS)</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {result.morphometricPrediction.predictedLCS} cm
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <TrendingUp className={`w-3 h-3 ${result.morphometricPrediction.comparedToHerdAverage.lcs >= 0
                                            ? 'text-green-500' : 'text-red-500'
                                        }`} />
                                    <span className={`text-xs ${result.morphometricPrediction.comparedToHerdAverage.lcs >= 0
                                            ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {result.morphometricPrediction.comparedToHerdAverage.lcs >= 0 ? '+' : ''}
                                        {result.morphometricPrediction.comparedToHerdAverage.lcs}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">Poitrine (TP)</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {result.morphometricPrediction.predictedTP} cm
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <TrendingUp className={`w-3 h-3 ${result.morphometricPrediction.comparedToHerdAverage.tp >= 0
                                            ? 'text-green-500' : 'text-red-500'
                                        }`} />
                                    <span className={`text-xs ${result.morphometricPrediction.comparedToHerdAverage.tp >= 0
                                            ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {result.morphometricPrediction.comparedToHerdAverage.tp >= 0 ? '+' : ''}
                                        {result.morphometricPrediction.comparedToHerdAverage.tp}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {result.inbreedingRisk === 'High' && (
                        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Risque de consanguinité élevé</p>
                                <p className="mt-1">Ce croisement présente un risque élevé.
                                    {result.commonAncestors.length > 0 &&
                                        ` ${result.commonAncestors.length} ancêtre(s) commun(s) détecté(s).`
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {result.recommendation === 'Excellent' && (
                        <div className="flex items-start gap-2 text-xs text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Excellent choix génétique</p>
                                <p className="mt-1">Faible consanguinité et bon potentiel morphométrique.
                                    Progéniture attendue au-dessus de la moyenne du troupeau.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
