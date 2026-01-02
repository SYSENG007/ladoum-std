import React from 'react';
import { Utensils, Droplets, Zap, Edit } from 'lucide-react';
import { Card } from '../ui/Card';
import type { NutritionPlan } from '../../types';

interface NutritionSummaryCardProps {
    plan?: NutritionPlan;
}

export const NutritionSummaryCard: React.FC<NutritionSummaryCardProps> = ({ plan }) => {
    if (!plan) return null;

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-600">
                    <Utensils className="w-5 h-5" />
                    <h3 className="font-bold text-slate-900">Nutrition</h3>
                </div>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                    <Edit className="w-4 h-4" />
                </button>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-amber-600">
                        <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{plan.name}</p>
                        <p className="text-xs text-slate-500">{plan.items.length} ingrédients</p>
                    </div>
                    <div className="ml-auto text-xl font-bold text-slate-900">
                        {plan.items.reduce((acc, item) => acc + item.quantity, 0)} kg/j
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Protéine</p>
                    <p className="font-bold text-slate-900">16%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
                        <Zap className="w-3 h-3" />
                        <span>Énergie</span>
                    </div>
                    <p className="font-bold text-slate-900">1.7 UFL</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
                        <Droplets className="w-3 h-3" />
                        <span>Eau</span>
                    </div>
                    <p className="font-bold text-slate-900">85 L</p>
                </div>
            </div>
        </Card>
    );
};
