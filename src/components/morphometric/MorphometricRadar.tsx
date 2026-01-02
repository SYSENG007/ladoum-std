/**
 * MorphometricRadar - 5-axis radar chart for morphological comparison
 */

import React, { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface MorphometricRadarProps {
    animalData: {
        mass: number | null;
        height: number | null;
        length: number | null;
        chest: number | null;
        functional?: number | null;
    };
    herdAverage: {
        mass: number;
        height: number;
        length: number;
        chest: number;
        functional?: number;
    };
}

export const MorphometricRadar: React.FC<MorphometricRadarProps> = ({
    animalData,
    herdAverage,
}) => {
    const data = useMemo(() => {
        // Normalize values to 0-100 scale for better visualization
        const normalize = (value: number | null, avg: number): number => {
            if (value === null) return 0;
            // Show as percentage of average (100 = average, >100 = above average)
            return (value / avg) * 100;
        };

        return [
            {
                metric: 'Masse',
                animal: normalize(animalData.mass, herdAverage.mass),
                troupeau: 100, // Average is always 100
                fullMark: 150,
            },
            {
                metric: 'Hauteur',
                animal: normalize(animalData.height, herdAverage.height),
                troupeau: 100,
                fullMark: 150,
            },
            {
                metric: 'Longueur',
                animal: normalize(animalData.length, herdAverage.length),
                troupeau: 100,
                fullMark: 150,
            },
            {
                metric: 'Poitrine',
                animal: normalize(animalData.chest, herdAverage.chest),
                troupeau: 100,
                fullMark: 150,
            },
        ];
    }, [animalData, herdAverage]);

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 150]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />

                    {/* Herd average (gray line) */}
                    <Radar
                        name="Moyenne troupeau"
                        dataKey="troupeau"
                        stroke="#94a3b8"
                        fill="#94a3b8"
                        fillOpacity={0.2}
                        strokeWidth={2}
                    />

                    {/* Animal (green line) */}
                    <Radar
                        name="Animal"
                        dataKey="animal"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.4}
                        strokeWidth={3}
                    />

                    <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        iconType="circle"
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                        formatter={(value: number) => `${value.toFixed(0)}%`}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
