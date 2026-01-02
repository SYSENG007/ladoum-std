import React, { useMemo } from 'react';
import type { Measurement } from '../../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card } from '../ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MorphometricChartProps {
    measurements: Measurement[];
    herdAverages?: {
        weight?: number;
        height_hg?: number;
        length_lcs?: number;
        chest_tp?: number;
    };
}

// Format date to French format
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Custom tooltip with formatted values
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
                <p className="text-sm font-semibold text-slate-900 mb-2">{formatDate(label)}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-600">{entry.name}:</span>
                        <span className="font-semibold text-slate-900">{entry.value.toFixed(1)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const MorphometricChart: React.FC<MorphometricChartProps> = ({ measurements, herdAverages }) => {
    // Calculate growth trend - use SORTED measurements for accurate trend
    const growthTrend = useMemo(() => {
        if (!measurements || measurements.length < 2) return null;

        // Sort by date to ensure first/last are chronologically correct
        const sortedMeasurements = [...measurements].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const first = sortedMeasurements[0];
        const last = sortedMeasurements[sortedMeasurements.length - 1];

        const weightChange = last.weight - first.weight;
        const hgChange = last.height_hg - first.height_hg;

        return {
            weight: weightChange,
            height_hg: hgChange,
            isGrowing: weightChange > 0 && hgChange > 0
        };
    }, [measurements]);

    if (!measurements || measurements.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center text-slate-400">
                Pas de données de croissance disponibles.
            </Card>
        );
    }

    // Format data with French dates for display - SORT CHRONOLOGICALLY FIRST
    const formattedData = measurements
        .slice() // Create copy to avoid mutating original
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort oldest to newest
        .map(m => ({
            ...m,
            displayDate: formatDate(m.date)
        }));

    return (
        <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Courbes de Croissance</h3>
                {growthTrend && (
                    <div className="flex items-center gap-2 text-sm">
                        {growthTrend.isGrowing ? (
                            <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-green-700 font-medium">
                                    +{growthTrend.weight.toFixed(1)} kg, +{growthTrend.height_hg.toFixed(1)} cm
                                </span>
                            </>
                        ) : growthTrend.weight < 0 ? (
                            <>
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <span className="text-red-700 font-medium">
                                    {growthTrend.weight.toFixed(1)} kg, {growthTrend.height_hg.toFixed(1)} cm
                                </span>
                            </>
                        ) : (
                            <>
                                <Minus className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600 font-medium">Stable</span>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                        {/* Herd average reference lines */}
                        {herdAverages?.weight && (
                            <ReferenceLine
                                y={herdAverages.weight}
                                stroke="#059669"
                                strokeDasharray="5 5"
                                strokeOpacity={0.3}
                                label={{ value: 'Moy.', position: 'right', fill: '#059669', fontSize: 10 }}
                            />
                        )}
                        {herdAverages?.height_hg && (
                            <ReferenceLine
                                y={herdAverages.height_hg}
                                stroke="#3b82f6"
                                strokeDasharray="5 5"
                                strokeOpacity={0.3}
                            />
                        )}

                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: '12px' }}
                            iconType="circle"
                        />
                        <Line
                            type="monotone"
                            dataKey="weight"
                            name="Poids (kg)"
                            stroke="#059669"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="height_hg"
                            name="Hauteur (cm)"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="length_lcs"
                            name="Longueur (cm)"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="chest_tp"
                            name="Poitrine (cm)"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
