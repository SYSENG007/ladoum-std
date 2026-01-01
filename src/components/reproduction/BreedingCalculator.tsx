import React, { useState, useMemo } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import {
    Calculator,
    Calendar,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Ruler,
    Activity,
    ExternalLink,
    Info,
    HelpCircle
} from 'lucide-react';
import { simulateBreeding } from '../../utils/breedingRules';
import type { BreedingSimulationResult } from '../../types/breeding';
import { getLatestMeasurements } from '../../utils/morphometrics';
import clsx from 'clsx';

export const BreedingCalculator: React.FC = () => {
    const { animals, loading } = useAnimals();
    const [sireId, setSireId] = useState('');
    const [damId, setDamId] = useState('');
    const [result, setResult] = useState<BreedingSimulationResult | null>(null);

    // Filter active males and females
    const sires = useMemo(() =>
        animals.filter(a => a.gender === 'Male' && a.status === 'Active'),
        [animals]
    );

    const dams = useMemo(() =>
        animals.filter(a => a.gender === 'Female' && a.status === 'Active'),
        [animals]
    );

    // Calculate pedigree completeness
    const pedigreeCompleteness = useMemo(() => {
        const animalsWithPedigree = animals.filter(a => a.sireId || a.damId);
        return animals.length > 0
            ? (animalsWithPedigree.length / animals.length) * 100
            : 0;
    }, [animals]);

    const calculate = () => {
        if (!sireId || !damId) return;

        const sire = animals.find(a => a.id === sireId);
        const dam = animals.find(a => a.id === damId);

        if (!sire || !dam) return;

        // V1.1: Use expert system
        const simulationResult = simulateBreeding(sire, dam, animals);
        setResult(simulationResult);
    };

    const getRecommendationBadge = () => {
        if (!result) return null;

        const variants = {
            'Excellent': { variant: 'success' as const, label: 'Excellent choix', icon: CheckCircle },
            'Good': { variant: 'info' as const, label: 'Bon choix', icon: TrendingUp },
            'Caution': { variant: 'warning' as const, label: 'Prudence', icon: AlertTriangle },
            'NotRecommended': { variant: 'error' as const, label: 'Déconseillé', icon: AlertTriangle },
            'InsufficientData': { variant: 'warning' as const, label: 'Données insuffisantes', icon: HelpCircle }
        };

        const config = variants[result.globalScore.recommendation];
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    const getStatusBadge = () => {
        if (!result) return null;

        const variants = {
            'RELIABLE': { variant: 'success' as const, label: 'Fiable' },
            'LOW_CONFIDENCE': { variant: 'warning' as const, label: 'Indicatif' },
            'NOT_COMPUTABLE': { variant: 'error' as const, label: 'Non calculable' }
        };

        const { variant, label } = variants[result.globalScore.status];
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
                <div className="p-3 bg-primary-50 rounded-2xl text-primary-600">
                    <Calculator className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Simulateur d'Accouplement V1.1</h3>
                    <p className="text-sm text-slate-500">Analyse génétique et morphométrique avec système expert.</p>
                </div>
            </div>

            {/* Pedigree Warning */}
            {pedigreeCompleteness < 30 && animals.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 mb-1">
                            Pedigrees incomplets ({pedigreeCompleteness.toFixed(0)}%)
                        </h4>
                        <p className="text-sm text-amber-800 mb-2">
                            Seulement {animals.filter(a => a.sireId || a.damId).length} sur {animals.length} animaux ont des informations de pedigree (père/mère).
                            Le calcul de consanguinité sera imprécis.
                        </p>
                        <p className="text-sm text-amber-700">
                            💡 <strong>Solution:</strong> Renseignez les parents de chaque animal dans leur fiche
                            pour obtenir des scores de compatibilité précis.
                        </p>
                    </div>
                </div>
            )}

            {/* Selection */}
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

            {/* Warning for missing measurements */}
            {sireId && damId && (() => {
                const sire = animals.find(a => a.id === sireId);
                const dam = animals.find(a => a.id === damId);
                if (!sire || !dam) return null;

                const sireMeasurements = getLatestMeasurements(sire);
                const damMeasurements = getLatestMeasurements(dam);
                const missingMeasurements = [];

                if (!sireMeasurements) missingMeasurements.push({ animal: sire, role: 'Père' });
                if (!damMeasurements) missingMeasurements.push({ animal: dam, role: 'Mère' });

                if (missingMeasurements.length > 0) {
                    return (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-amber-900 mb-2">
                                        ⚠️ Mesures manquantes pour prédictions précises
                                    </p>
                                    <p className="text-xs text-amber-700 mb-3">
                                        Les prédictions morphométriques nécessitent les mesures HG, LCS et TP.
                                    </p>
                                    <div className="space-y-2">
                                        {missingMeasurements.map(({ animal, role }) => (
                                            <div key={animal.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-amber-100">
                                                <div className="flex items-center gap-2">
                                                    <Ruler className="w-4 h-4 text-amber-600" />
                                                    <span className="text-sm text-slate-700">
                                                        <strong>{animal.name}</strong> ({role}) - Jamais mesuré(e)
                                                    </span>
                                                </div>
                                                <Link
                                                    to={`/herd/${animal.id}`}
                                                    className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                                >
                                                    Ajouter mesures
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* NOT_COMPUTABLE Case */}
                    {result.globalScore.status === 'NOT_COMPUTABLE' ? (
                        <div className="text-center p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h4 className="font-bold text-slate-700 mb-2">Score non calculable</h4>
                            <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                                {result.globalScore.explanation}
                            </p>
                            {getStatusBadge()}
                        </div>
                    ) : (
                        <>
                            {/* Global Score */}
                            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-primary-700">Score Global</span>
                                        {getStatusBadge()}
                                    </div>
                                    {getRecommendationBadge()}
                                </div>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-5xl font-bold text-primary-900">
                                        {result.globalScore.value || '?'}
                                    </span>
                                    <span className="text-xl text-primary-600 mb-2">/100</span>
                                </div>

                                {/* Confidence Bar */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-primary-700">Confiance</span>
                                        <span className="font-medium text-primary-900">
                                            {Math.round(result.globalScore.confidence * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                                        <div
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-500",
                                                result.globalScore.status === 'RELIABLE' ? 'bg-green-500' :
                                                    result.globalScore.status === 'LOW_CONFIDENCE' ? 'bg-amber-500' :
                                                        'bg-red-500'
                                            )}
                                            style={{ width: `${result.globalScore.confidence * 100}%` }}
                                        />
                                    </div>
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
                                        {result.inbreeding.coefficient !== null ? (
                                            <>
                                                <span className="text-lg font-bold text-slate-900">
                                                    {(result.inbreeding.coefficient * 100).toFixed(1)}%
                                                </span>
                                                <Badge variant={
                                                    result.inbreeding.riskLevel === 'Low' ? 'success' :
                                                        result.inbreeding.riskLevel === 'Medium' ? 'warning' : 'error'
                                                }>
                                                    {result.inbreeding.riskLevel === 'Low' ? 'Faible' :
                                                        result.inbreeding.riskLevel === 'Medium' ? 'Moyen' : 'Élevé'}
                                                </Badge>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-lg text-slate-400">Non calculable</span>
                                                <Badge variant="warning">
                                                    {result.inbreeding.availableGenerations}/{result.inbreeding.requiredGenerations} gén.
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        <span className="text-xs font-medium text-slate-600">Mise bas prévue</span>
                                    </div>
                                    <span className="text-lg font-bold text-slate-900">
                                        {result.expectedDueDate.toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            </div>

                            {/* Morphometric Predictions */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Ruler className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Prédictions Morphométriques</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {/* HG */}
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 mb-1">Hauteur (HG)</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {result.morphometrics.hg.mean?.toFixed(0) || '?'} cm
                                        </p>
                                        {result.morphometrics.hg.mean !== null && (
                                            <>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    [{result.morphometrics.hg.min?.toFixed(0)} - {result.morphometrics.hg.max?.toFixed(0)}]
                                                </p>
                                                <div className="flex items-center justify-center gap-1 mt-2">
                                                    <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary-600"
                                                            style={{ width: `${result.morphometrics.hg.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {Math.round(result.morphometrics.hg.confidence * 100)}%
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* LCS */}
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 mb-1">Longueur (LCS)</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {result.morphometrics.lcs.mean?.toFixed(0) || '?'} cm
                                        </p>
                                        {result.morphometrics.lcs.mean !== null && (
                                            <>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    [{result.morphometrics.lcs.min?.toFixed(0)} - {result.morphometrics.lcs.max?.toFixed(0)}]
                                                </p>
                                                <div className="flex items-center justify-center gap-1 mt-2">
                                                    <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary-600"
                                                            style={{ width: `${result.morphometrics.lcs.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {Math.round(result.morphometrics.lcs.confidence * 100)}%
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* TP */}
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 mb-1">Poitrine (TP)</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {result.morphometrics.tp.mean?.toFixed(0) || '?'} cm
                                        </p>
                                        {result.morphometrics.tp.mean !== null && (
                                            <>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    [{result.morphometrics.tp.min?.toFixed(0)} - {result.morphometrics.tp.max?.toFixed(0)}]
                                                </p>
                                                <div className="flex items-center justify-center gap-1 mt-2">
                                                    <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary-600"
                                                            style={{ width: `${result.morphometrics.tp.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {Math.round(result.morphometrics.tp.confidence * 100)}%
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expert Rules Applied */}
                            {result.expertRules.length > 0 && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Analyse Expert</span>
                                    </div>
                                    <div className="space-y-2">
                                        {result.expertRules.map((rule) => (
                                            <div
                                                key={rule.ruleId}
                                                className={clsx(
                                                    "text-xs p-2 rounded-lg flex items-start gap-2",
                                                    rule.impact === 'BLOCKING' && "bg-red-100 text-red-700",
                                                    rule.impact === 'WARNING' && "bg-amber-100 text-amber-700",
                                                    rule.impact === 'INFO' && "bg-blue-100 text-blue-700"
                                                )}
                                            >
                                                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                                                <span>{rule.explanation}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Warnings */}
                            {result.warnings.length > 0 && (
                                <div className="space-y-2">
                                    {result.warnings.map((warning, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-2 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200"
                                        >
                                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <span className="text-amber-800">{warning}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Success Message */}
                            {result.globalScore.recommendation === 'Excellent' && (
                                <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Excellent choix génétique</p>
                                        <p className="mt-1 text-xs">
                                            Faible consanguinité et bon potentiel morphométrique.
                                            Progéniture attendue au-dessus de la moyenne du troupeau.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </Card>
    );
};
