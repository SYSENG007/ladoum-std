import React from 'react';
import { Utensils, AlertTriangle, Package } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { NutritionPlan } from '../../types';

interface NutritionTabProps {
    plan?: NutritionPlan;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({ plan }) => {
    if (!plan) {
        return (
            <Card className="p-8 text-center text-slate-500 border-dashed">
                <div className="flex flex-col items-center gap-3">
                    <Utensils className="w-12 h-12 text-slate-300" />
                    <p>Aucun plan de nutrition assigné.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-slate-100 border-slate-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-tan-50 rounded-2xl text-navy-600">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-emerald-900 mb-1">{plan.name}</h3>
                        <p className="text-slate-900 text-sm">{plan.notes}</p>
                    </div>
                </div>
            </Card>

            <h3 className="text-lg font-bold text-slate-900">Ration Journalière</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {plan.items.map((item, index) => (
                    <Card key={index} className="flex items-center gap-4 p-4" noPadding>
                        <div className="p-3 bg-tan-50 rounded-2xl text-navy-600">
                            <Package className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <h4 className="font-bold text-slate-900">Aliment #{item.inventoryItemId}</h4>
                                <Badge variant="info">{item.frequency}</Badge>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-slate-900">{item.quantity}</span>
                                <span className="text-slate-500 font-medium">{item.unit}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl text-amber-800 text-sm border border-amber-100">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Vérifiez le stock d'aliments. Certains éléments pourraient être bientôt épuisés.</p>
            </div>
        </div>
    );
};
