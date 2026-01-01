import React, { useState, useMemo } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Grid3X3, ArrowUpDown, Filter, Info, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { simulateBreeding } from '../../utils/breedingRules';
import type { BreedingSimulationResult } from '../../types/breeding';
import type { Animal } from '../../types';

type SortCriteria = 'score' | 'confidence' | 'inbreeding' | 'hg' | 'lcs' | 'tp';

interface MatrixCell {
    sireId: string;
    damId: string;
    simulation: BreedingSimulationResult;
}

export const MatrixBreedingSimulator: React.FC = () => {
    const { animals, loading } = useAnimals();
    const [sortBy, setSortBy] = useState<SortCriteria>('score');
    const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
    const [showReliableOnly, setShowReliableOnly] = useState(false);

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

    // Calculate compatibility matrix V1.1
    const matrix = useMemo(() => {
        const result: MatrixCell[][] = [];

        for (const sire of sires) {
            const row: MatrixCell[] = [];
            for (const dam of dams) {
                const simulation = simulateBreeding(sire, dam, animals);

                row.push({
                    sireId: sire.id,
                    damId: dam.id,
                    simulation
                });
            }
            result.push(row);
        }

        return result;
    }, [sires, dams, animals]);

    // Get best combinations
    const bestCombinations = useMemo(() => {
        const allCells = matrix.flat();

        // Filter by reliability if requested
        let filtered = showReliableOnly
            ? allCells.filter(c => c.simulation.globalScore.status === 'RELIABLE')
            : allCells.filter(c => c.simulation.globalScore.value !== null);

        return filtered.sort((a, b) => {
            const aScore = a.simulation.globalScore.value || 0;
            const bScore = b.simulation.globalScore.value || 0;
            const aConfidence = a.simulation.globalScore.confidence;
            const bConfidence = b.simulation.globalScore.confidence;
            const aCOI = a.simulation.inbreeding.coefficient || 1;
            const bCOI = b.simulation.inbreeding.coefficient || 1;

            switch (sortBy) {
                case 'score':
                    return bScore - aScore;
                case 'confidence':
                    return bConfidence - aConfidence;
                case 'inbreeding':
                    return aCOI - bCOI;
                case 'hg':
                    return (b.simulation.morphometrics.hg.mean || 0) - (a.simulation.morphometrics.hg.mean || 0);
                case 'lcs':
                    return (b.simulation.morphometrics.lcs.mean || 0) - (a.simulation.morphometrics.lcs.mean || 0);
                case 'tp':
                    return (b.simulation.morphometrics.tp.mean || 0) - (a.simulation.morphometrics.tp.mean || 0);
                default:
                    return bScore - aScore;
            }
        }).slice(0, 10);
    }, [matrix, sortBy, showReliableOnly]);

    const getCellColor = (cell: MatrixCell): string => {
        if (cell.simulation.globalScore.value === null) {
            return 'bg-slate-100 text-slate-400';
        }

        const score = cell.simulation.globalScore.value;
        const status = cell.simulation.globalScore.status;

        // Color based on score and reliability
        if (status === 'RELIABLE') {
            if (score >= 85) return 'bg-green-100 text-green-800 border-green-300';
            if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-300';
            if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-300';
            return 'bg-red-100 text-red-800 border-red-300';
        } else {
            // Low confidence - pastel colors
            if (score >= 85) return 'bg-green-50 text-green-700 border-green-200';
            if (score >= 70) return 'bg-blue-50 text-blue-700 border-blue-200';
            if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
            return 'bg-red-50 text-red-700 border-red-200';
        }
    };

    const getCellDisplay = (cell: MatrixCell): string => {
        if (cell.simulation.globalScore.value === null) {
            return '?';
        }
        return cell.simulation.globalScore.value.toString();
    };

    if (loading) {
        return (
            <Card>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                    <div className="grid grid-cols-4 gap-2">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className="h-16 bg-slate-200 rounded"></div>
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
                    <Grid3X3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">Pas assez d'animaux</p>
                    <p className="text-sm text-slate-500">
                        Il faut au moins 1 mâle et 1 femelle actifs pour la simulation matricielle.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pedigree Warning */}
            {pedigreeCompleteness < 30 && animals.length > 0 && (
                <Card>
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-900 mb-1">
                                Pedigrees incomplets ({pedigreeCompleteness.toFixed(0)}%)
                            </h4>
                            <p className="text-sm text-amber-800 mb-2">
                                Seulement {animals.filter(a => a.sireId || a.damId).length} sur {animals.length} animaux ont des informations de pedigree.
                                Cela empêche le calcul précis de la consanguinité.
                            </p>
                            <p className="text-sm text-amber-700">
                                💡 <strong>Solution:</strong> Renseignez les parents de chaque animal dans leur fiche pour obtenir des scores de compatibilité précis.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Controls */}
            <Card>
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                            <Grid3X3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Matrice de Compatibilité V1.1</h3>
                            <p className="text-xs text-slate-500">
                                {sires.length} mâles × {dams.length} femelles = {sires.length * dams.length} combinaisons
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="w-4 h-4 text-slate-500" />
                            <select
                                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortCriteria)}
                            >
                                <option value="score">Score global</option>
                                <option value="confidence">Confiance</option>
                                <option value="inbreeding">Consanguinité</option>
                                <option value="hg">HG prédit</option>
                                <option value="lcs">LCS prédit</option>
                                <option value="tp">TP prédit</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showReliableOnly}
                                onChange={(e) => setShowReliableOnly(e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            <Filter className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-700">Fiable uniquement</span>
                        </label>
                    </div>
                </div>
            </Card>

            {/* Matrix */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="p-2 text-xs font-medium text-slate-500 text-left sticky left-0 bg-white z-10">
                                    Père \ Mère
                                </th>
                                {dams.map(dam => (
                                    <th key={dam.id} className="p-2 text-xs font-medium text-slate-700 text-center min-w-[80px]">
                                        <div className="truncate" title={dam.name}>
                                            {dam.name}
                                        </div>
                                        <div className="text-slate-500 font-normal">
                                            {dam.tagId}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row, sireIdx) => (
                                <tr key={sires[sireIdx].id}>
                                    <td className="p-2 text-sm font-medium text-slate-700 sticky left-0 bg-white z-10">
                                        <div className="truncate" title={sires[sireIdx].name}>
                                            {sires[sireIdx].name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {sires[sireIdx].tagId}
                                        </div>
                                    </td>
                                    {row.map((cell, damIdx) => (
                                        <td key={`${sireIdx}-${damIdx}`} className="p-1">
                                            <button
                                                onClick={() => setSelectedCell(cell)}
                                                className={clsx(
                                                    "w-full h-16 rounded-lg border-2 transition-all",
                                                    "hover:scale-105 hover:shadow-md",
                                                    "flex flex-col items-center justify-center gap-1",
                                                    getCellColor(cell),
                                                    selectedCell?.sireId === cell.sireId &&
                                                    selectedCell?.damId === cell.damId &&
                                                    "ring-2 ring-primary-500"
                                                )}
                                                title={
                                                    cell.simulation.globalScore.value !== null
                                                        ? `Score: ${cell.simulation.globalScore.value}, Status: ${cell.simulation.globalScore.status}`
                                                        : 'Données insuffisantes'
                                                }
                                            >
                                                <span className="text-xl font-bold">
                                                    {getCellDisplay(cell)}
                                                </span>
                                                {cell.simulation.globalScore.value !== null && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="h-1 w-8 bg-white/30 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-current"
                                                                style={{ width: `${cell.simulation.globalScore.confidence * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] opacity-75">
                                                            {Math.round(cell.simulation.globalScore.confidence * 100)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                        <span className="font-medium text-slate-700">Légende:</span>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                            <span className="text-slate-600">Excellent (≥85)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                            <span className="text-slate-600">Bon (70-84)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-amber-100 border-2 border-amber-300 rounded"></div>
                            <span className="text-slate-600">Prudence (50-69)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                            <span className="text-slate-600">Déconseillé (&lt;50)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-100 border-2 border-slate-300 rounded flex items-center justify-center">
                                <HelpCircle className="w-3 h-3 text-slate-400" />
                            </div>
                            <span className="text-slate-600">Non calculable</span>
                        </div>
                        <div className="ml-4 text-slate-500">
                            <Info className="w-4 h-4 inline mr-1" />
                            Couleurs pâles = confiance limitée
                        </div>
                    </div>
                </div>
            </Card>

            {/* Top 10 */}
            <Card>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    Top 10 Combinaisons
                    {showReliableOnly && <Badge variant="info">Fiables uniquement</Badge>}
                </h3>
                <div className="space-y-3">
                    {bestCombinations.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p>Aucune combinaison {showReliableOnly ? 'fiable' : 'calculable'}</p>
                            <p className="text-sm mt-1">
                                {showReliableOnly
                                    ? 'Décochez "Fiable uniquement" pour voir toutes les combinaisons'
                                    : 'Renseignez les pedigrees et mesures pour obtenir des résultats'}
                            </p>
                        </div>
                    ) : (
                        bestCombinations.map((cell, index) => {
                            const sire = animals.find(a => a.id === cell.sireId)!;
                            const dam = animals.find(a => a.id === cell.damId)!;

                            return (
                                <div
                                    key={`${cell.sireId}-${cell.damId}`}
                                    onClick={() => setSelectedCell(cell)}
                                    className={clsx(
                                        "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                        "hover:shadow-md",
                                        selectedCell?.sireId === cell.sireId && selectedCell?.damId === cell.damId
                                            ? "border-primary-500 bg-primary-50"
                                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full font-bold">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">
                                                {sire.name} × {dam.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {sire.tagId} × {dam.tagId}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-sm text-slate-500">Score</div>
                                            <div className="text-xl font-bold text-slate-900">
                                                {cell.simulation.globalScore.value || '?'}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm text-slate-500">COI</div>
                                            <div className="text-sm font-medium text-slate-700">
                                                {cell.simulation.inbreeding.coefficient !== null
                                                    ? `${(cell.simulation.inbreeding.coefficient * 100).toFixed(1)}%`
                                                    : 'N/A'}
                                            </div>
                                        </div>

                                        <Badge variant={
                                            cell.simulation.globalScore.status === 'RELIABLE' ? 'success' :
                                                cell.simulation.globalScore.status === 'LOW_CONFIDENCE' ? 'warning' :
                                                    'error'
                                        }>
                                            {cell.simulation.globalScore.status === 'RELIABLE' ? 'Fiable' :
                                                cell.simulation.globalScore.status === 'LOW_CONFIDENCE' ? 'Indicatif' :
                                                    'Non calculable'}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* Selected Cell Details */}
            {selectedCell && (() => {
                const sire = animals.find(a => a.id === selectedCell.sireId)!;
                const dam = animals.find(a => a.id === selectedCell.damId)!;
                const sim = selectedCell.simulation;

                return (
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900">
                                Détails: {sire.name} × {dam.name}
                            </h3>
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                ✕
                            </button>
                        </div>

                        {sim.globalScore.status === 'NOT_COMPUTABLE' ? (
                            <div className="text-center p-8 bg-slate-50 rounded-xl">
                                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-600 font-medium mb-2">Données insuffisantes</p>
                                <p className="text-sm text-slate-500">{sim.globalScore.explanation}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 bg-primary-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary-700">Score Global</span>
                                        <Badge variant={
                                            sim.globalScore.recommendation === 'Excellent' ? 'success' :
                                                sim.globalScore.recommendation === 'Good' ? 'info' :
                                                    sim.globalScore.recommendation === 'Caution' ? 'warning' : 'error'
                                        }>
                                            {sim.globalScore.recommendation === 'Excellent' ? 'Excellent' :
                                                sim.globalScore.recommendation === 'Good' ? 'Bon' :
                                                    sim.globalScore.recommendation === 'Caution' ? 'Prudence' :
                                                        sim.globalScore.recommendation === 'NotRecommended' ? 'Déconseillé' :
                                                            'Données insuffisantes'}
                                        </Badge>
                                    </div>
                                    <div className="text-3xl font-bold text-primary-900 mt-2">
                                        {sim.globalScore.value || '?'}/100
                                    </div>
                                    <div className="text-xs text-primary-700 mt-1">
                                        Confiance: {Math.round(sim.globalScore.confidence * 100)}%
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs text-slate-600 mb-1">Consanguinité</div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {sim.inbreeding.coefficient !== null
                                            ? `${(sim.inbreeding.coefficient * 100).toFixed(1)}%`
                                            : 'N/A'}
                                    </div>
                                    <Badge variant={
                                        sim.inbreeding.riskLevel === 'Low' ? 'success' :
                                            sim.inbreeding.riskLevel === 'Medium' ? 'warning' :
                                                sim.inbreeding.riskLevel === 'High' ? 'error' : 'warning'
                                    } className="mt-2">
                                        {sim.inbreeding.riskLevel === 'Low' ? 'Faible' :
                                            sim.inbreeding.riskLevel === 'Medium' ? 'Moyen' :
                                                sim.inbreeding.riskLevel === 'High' ? 'Élevé' : 'Inconnu'}
                                    </Badge>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs text-slate-600 mb-1">Mise bas prévue</div>
                                    <div className="text-lg font-bold text-slate-900">
                                        {sim.expectedDueDate.toLocaleDateString('fr-FR')}
                                    </div>
                                </div>

                                <div className="col-span-2 bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs text-slate-600 mb-3">Prédictions Morphométriques</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center">
                                            <div className="text-xs text-slate-500">HG</div>
                                            <div className="text-xl font-bold text-slate-900">
                                                {sim.morphometrics.hg.mean?.toFixed(0) || '?'}
                                            </div>
                                            {sim.morphometrics.hg.mean !== null && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {Math.round(sim.morphometrics.hg.confidence * 100)}%
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-slate-500">LCS</div>
                                            <div className="text-xl font-bold text-slate-900">
                                                {sim.morphometrics.lcs.mean?.toFixed(0) || '?'}
                                            </div>
                                            {sim.morphometrics.lcs.mean !== null && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {Math.round(sim.morphometrics.lcs.confidence * 100)}%
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-slate-500">TP</div>
                                            <div className="text-xl font-bold text-slate-900">
                                                {sim.morphometrics.tp.mean?.toFixed(0) || '?'}
                                            </div>
                                            {sim.morphometrics.tp.mean !== null && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {Math.round(sim.morphometrics.tp.confidence * 100)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {sim.warnings.length > 0 && (
                                    <div className="col-span-2 space-y-2">
                                        {sim.warnings.map((warning, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <span className="text-amber-800">{warning}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                );
            })()}
        </div>
    );
};
