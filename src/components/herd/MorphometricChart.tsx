import React from 'react';
import type { Measurement } from '../../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';

interface MorphometricChartProps {
    measurements: Measurement[];
}

export const MorphometricChart: React.FC<MorphometricChartProps> = ({ measurements }) => {
    if (!measurements || measurements.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center text-slate-400">
                Pas de données de croissance disponibles.
            </Card>
        );
    }

    return (
        <Card className="h-[400px]">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Courbes de Croissance</h3>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={measurements}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="weight" name="Poids (kg)" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="height_hg" name="Hauteur (cm)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="length_lcs" name="Longueur (cm)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="chest_tp" name="Poitrine (cm)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
