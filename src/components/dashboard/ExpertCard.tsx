import React, { useMemo } from 'react';
import { CertificationBadge } from '../ui/CertificationBadge';
import clsx from 'clsx';
import type { Animal } from '../../types';

interface ExpertCardProps {
    animals: Animal[];
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ animals }) => {
    // Calculate real certification progress
    const certificationStats = useMemo(() => {
        const totalAnimals = animals.length;
        const certifiedAnimals = animals.filter(a => a.certification).length;
        const eliteAnimals = animals.filter(a => a.certification?.level === 'Elite').length;
        const goldAnimals = animals.filter(a => a.certification?.level === 'Gold').length;

        // Calculate progress to Elite (need 80% certified, 50% Gold or higher)
        const certificationRate = totalAnimals > 0 ? (certifiedAnimals / totalAnimals) * 100 : 0;
        const goldRate = totalAnimals > 0 ? ((goldAnimals + eliteAnimals) / totalAnimals) * 100 : 0;

        // Progress is average of both metrics
        const progress = Math.min(((certificationRate * 0.6) + (goldRate * 0.4)), 100);

        // Determine current level
        let currentLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite' = 'Bronze';
        if (progress >= 90) currentLevel = 'Elite';
        else if (progress >= 75) currentLevel = 'Platinum';
        else if (progress >= 50) currentLevel = 'Gold';
        else if (progress >= 25) currentLevel = 'Silver';

        return {
            progress: Math.round(progress),
            currentLevel,
            certificationRate: Math.round(certificationRate),
            goldRate: Math.round(goldRate)
        };
    }, [animals]);

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-1">Niveau {certificationStats.currentLevel}</h3>
                        <p className="text-slate-400 text-sm">Bergerie Certifiée</p>
                    </div>
                    <CertificationBadge level={certificationStats.currentLevel} size="lg" className="shadow-lg shadow-yellow-900/20" />
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">
                                {certificationStats.currentLevel === 'Elite' ? 'Niveau Maximum Atteint!' : 'Progression vers Elite'}
                            </span>
                            <span className="font-bold text-yellow-400">{certificationStats.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                                style={{ width: `${certificationStats.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className={clsx(
                                "w-2 h-2 rounded-full",
                                certificationStats.certificationRate >= 80 ? "bg-green-500" : "bg-amber-500"
                            )} />
                            <span>Certifiés: {certificationStats.certificationRate}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={clsx(
                                "w-2 h-2 rounded-full",
                                certificationStats.goldRate >= 50 ? "bg-green-500" : "bg-amber-500"
                            )} />
                            <span>Gold+: {certificationStats.goldRate}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
