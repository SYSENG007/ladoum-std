import React, { useState, useMemo } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { Grid3X3, ArrowUpDown, Filter, Info, TrendingUp, AlertTriangle, Ruler, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import {
    calculateInbreedingCoefficient,
    getInbreedingRisk
} from '../../utils/genetics';
import {
    predictOffspringMorphometrics,
    scoreMorphometricCompatibility,
    getLatestMeasurements
} from '../../utils/morphometrics';
import type { Animal, BreedingCompatibility } from '../../types';

type SortCriteria = 'score' | 'inbreeding' | 'hg' | 'lcs' | 'tp';

interface MatrixCell extends BreedingCompatibility {
    sireId: string;
    damId: string;
}

export const MatrixBreedingSimulator: React.FC = () => {
    const { animals, loading } = useAnimals();
    const [sortBy, setSortBy] = useState<SortCriteria>('score');
    const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
    const [showLowRiskOnly, setShowLowRiskOnly] = useState(false);

    const sires = useMemo(() =>
        animals.filter(a => a.gender === 'Male' && a.status === 'Active'),
        [animals]
    );

    const dams = useMemo(() =>
        animals.filter(a => a.gender === 'Female' && a.status === 'Active'),
        [animals]
    );

    // Calculate compatibility matrix (memoized for performance)
    const matrix = useMemo(() => {
        const result: MatrixCell[][] = [];

        for (const sire of sires) {
            const row: MatrixCell[] = [];
            for (const dam of dams) {
                const inbreedingCoefficient = calculateInbreedingCoefficient(sire.id, dam.id, animals);
                const inbreedingRisk = getInbreedingRisk(inbreedingCoefficient);
                const morphometricPrediction = predictOffspringMorphometrics(sire, dam, animals);
                const morphometricScore = scoreMorphometricCompatibility(sire, dam, animals);

                const inbreedingPenalty = inbreedingCoefficient * 50;
                const overallScore = Math.round(
                    (morphometricScore * 0.6) + ((100 - inbreedingPenalty) * 0.4)
                );

                let recommendation: BreedingCompatibility['recommendation'];
                if (overallScore >= 85 && inbreedingRisk === 'Low') {
                    recommendation = 'Excellent';
                } else if (overallScore >= 70 && inbreedingRisk !== 'High') {
                    recommendation = 'Good';
                } else if (overallScore >= 50 || inbreedingRisk === 'Medium') {
                    recommendation = 'Caution';
                } else {
                    recommendation = 'NotRecommended';
                }

                row.push({
                    sireId: sire.id,
                    damId: dam.id,
                    overallScore,
                    inbreedingCoefficient,
                    inbreedingRisk,
                    morphometricScore,
                    morphometricPrediction,
                    commonAncestors: [],
                    recommendation
                });
            }
            result.push(row);
        }

        return result;
    }, [sires, dams, animals]);

    // Get best combinations based on sort criteria
    const bestCombinations = useMemo(() => {
        const allCells = matrix.flat();

        let filtered = showLowRiskOnly
            ? allCells.filter(c => c.inbreedingRisk === 'Low')
            : allCells;

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return b.overallScore - a.overallScore;
                case 'inbreeding':
                    return a.inbreedingCoefficient - b.inbreedingCoefficient;
                case 'hg':
                    return b.morphometricPrediction.predictedHG - a.morphometricPrediction.predictedHG;
                case 'lcs':
                    return b.morphometricPrediction.predictedLCS - a.morphometricPrediction.predictedLCS;
                case 'tp':
                    return b.morphometricPrediction.predictedTP - a.morphometricPrediction.predictedTP;
                default:
                    return 0;
            }
        }).slice(0, 10);
    }, [matrix, sortBy, showLowRiskOnly]);

    const getCellColor = (cell: MatrixCell): string => {
        if (cell.recommendation === 'Excellent') return 'bg-green-500';
        if (cell.recommendation === 'Good') return 'bg-green-300';
        if (cell.recommendation === 'Caution') return 'bg-amber-400';
        return 'bg-red-400';
    };

    const getAnimalById = (id: string): Animal | undefined =>
        animals.find(a => a.id === id);

    if (loading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    <div className="grid grid-cols-6 gap-2">
                        {Array(36).fill(0).map((_, i) => (
                            <div key={i} className="h-10 bg-slate-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    if (sires.length === 0 || dams.length === 0) {
        return (
            <Card>
                <div className="text-center py-12">
                    <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">
                        Ajoutez des mâles et femelles pour voir la matrice de compatibilité.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Grid3X3 className="w-5 h-5 text-primary-600" />
                        <h3 className="font-bold text-slate-900">Simulation Matricielle</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="w-4 h-4 text-slate-500" />
                            <select
                                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortCriteria)}
                            >
                                <option value="score">Trier par score global</option>
                                <option value="inbreeding">Trier par consanguinité</option>
                                <option value="hg">Trier par HG prédit</option>
                                <option value="lcs">Trier par LCS prédit</option>
                                <option value="tp">Trier par TP prédit</option>
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={showLowRiskOnly}
                                onChange={(e) => setShowLowRiskOnly(e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <Filter className="w-4 h-4" />
                            Faible risque seulement
                        </label>
                    </div>
                </div>
            </Card>

            {/* Matrix Grid */}
            <Card>
                <h4 className="font-medium text-slate-700 mb-4">Matrice de Compatibilité</h4>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-xs font-medium text-slate-500">
                                    Mâle ↓ / Femelle →
                                </th>
                                {dams.map(dam => (
                                    <th key={dam.id} className="p-2 text-center">
                                        <div className="text-xs font-medium text-slate-700 truncate max-w-[80px]">
                                            {dam.name}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row, sireIndex) => (
                                <tr key={sires[sireIndex].id}>
                                    <td className="p-2 text-sm font-medium text-slate-700">
                                        {sires[sireIndex].name}
                                    </td>
                                    {row.map((cell, damIndex) => (
                                        <td key={dams[damIndex].id} className="p-1">
                                            <button
                                                onClick={() => setSelectedCell(cell)}
                                                className={clsx(
                                                    "w-full h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-105",
                                                    getCellColor(cell),
                                                    selectedCell?.sireId === cell.sireId &&
                                                    selectedCell?.damId === cell.damId &&
                                                    "ring-2 ring-primary-600 ring-offset-2"
                                                )}
                                            >
                                                {cell.overallScore}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span>Excellent</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-300"></div>
                        <span>Bon</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-amber-400"></div>
                        <span>Prudence</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-400"></div>
                        <span>Déconseillé</span>
                    </div>
                </div>
            </Card>

            {/* Best Combinations */}
            <Card>
                <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    Top 10 Combinaisons
                </h4>
                <div className="space-y-2">
                    {bestCombinations.map((cell, index) => {
                        const sire = getAnimalById(cell.sireId);
                        const dam = getAnimalById(cell.damId);
                        if (!sire || !dam) return null;

                        return (
                            <div
                                key={`${cell.sireId}-${cell.damId}`}
                                onClick={() => setSelectedCell(cell)}
                                className={clsx(
                                    "flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors",
                                    selectedCell?.sireId === cell.sireId &&
                                        selectedCell?.damId === cell.damId
                                        ? "border-primary-300 bg-primary-50"
                                        : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                                )}
                            >
                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-900 truncate">{sire.name}</span>
                                        <span className="text-slate-400">×</span>
                                        <span className="font-medium text-slate-900 truncate">{dam.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span>HG: {cell.morphometricPrediction.predictedHG}cm</span>
                                        <span>LCS: {cell.morphometricPrediction.predictedLCS}cm</span>
                                        <span>TP: {cell.morphometricPrediction.predictedTP}cm</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-slate-900">{cell.overallScore}</div>
                                    <Badge variant={
                                        cell.inbreedingRisk === 'Low' ? 'success' :
                                            cell.inbreedingRisk === 'Medium' ? 'warning' : 'error'
                                    }>
                                        COI: {(cell.inbreedingCoefficient * 100).toFixed(1)}%
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Selected Cell Details */}
            {selectedCell && (
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="w-5 h-5 text-primary-600" />
                        <h4 className="font-medium text-slate-700">Détails de la Combinaison</h4>
                    </div>

                    {(() => {
                        const sire = getAnimalById(selectedCell.sireId);
                        const dam = getAnimalById(selectedCell.damId);
                        if (!sire || !dam) return null;

                        return (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                    <img
                                        src={sire.photoUrl}
                                        alt={sire.name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{sire.name}</p>
                                        <p className="text-sm text-slate-500">{sire.tagId} • Père</p>
                                    </div>
                                    <span className="text-2xl text-slate-300">×</span>
                                    <div className="flex-1 text-right">
                                        <p className="font-bold text-slate-900">{dam.name}</p>
                                        <p className="text-sm text-slate-500">{dam.tagId} • Mère</p>
                                    </div>
                                    <img
                                        src={dam.photoUrl}
                                        alt={dam.name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-pink-200"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                                        <p className="text-xs text-slate-500 mb-1">Score Global</p>
                                        <p className="text-2xl font-bold text-primary-600">{selectedCell.overallScore}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                                        <p className="text-xs text-slate-500 mb-1">Consanguinité</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {(selectedCell.inbreedingCoefficient * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                                        <p className="text-xs text-slate-500 mb-1">HG Prédit</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {selectedCell.morphometricPrediction.predictedHG}
                                            <span className="text-sm font-normal text-slate-500"> cm</span>
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                                        <p className="text-xs text-slate-500 mb-1">LCS Prédit</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {selectedCell.morphometricPrediction.predictedLCS}
                                            <span className="text-sm font-normal text-slate-500"> cm</span>
                                        </p>
                                    </div>
                                </div>

                                {selectedCell.inbreedingRisk === 'High' && (
                                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                        <div className="text-sm text-red-700">
                                            <p className="font-medium">Attention: Risque de consanguinité élevé</p>
                                            <p className="mt-1">Ce croisement n'est pas recommandé en raison d'ancêtres communs proches.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </Card>
            )}
        </div>
    );
};
