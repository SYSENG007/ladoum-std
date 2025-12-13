import React, { useState, useEffect } from 'react';
import {
    Activity, Heart, DollarSign, Calendar,
    Syringe, Baby, Stethoscope, ClipboardList
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useTasks } from '../../hooks/useTasks';
import { AccountingService } from '../../services/AccountingService';
import type { Animal, HealthRecord, ReproductionRecord, TransactionRecord, Task, Transaction } from '../../types';

interface TimelineTabProps {
    animal: Animal;
}

type TimelineEvent =
    | { kind: 'Health'; data: HealthRecord }
    | { kind: 'Reproduction'; data: ReproductionRecord }
    | { kind: 'Transaction'; data: TransactionRecord }
    | { kind: 'AccountingTransaction'; data: Transaction }
    | { kind: 'Task'; data: Task };

export const TimelineTab: React.FC<TimelineTabProps> = ({ animal }) => {
    const { tasks } = useTasks();
    const [accountingTransactions, setAccountingTransactions] = useState<Transaction[]>([]);

    // Fetch accounting transactions linked to this animal
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const transactions = await AccountingService.getByAnimal(animal.id);
                setAccountingTransactions(transactions);
            } catch (err) {
                console.error('Failed to fetch animal transactions:', err);
            }
        };
        fetchTransactions();
    }, [animal.id]);

    // Get tasks linked to this animal
    const animalTasks = tasks.filter(t => t.animalId === animal.id);

    // 1. Aggregate Events - now including accounting transactions
    const events: TimelineEvent[] = [
        ...(animal.healthRecords || []).map(r => ({ kind: 'Health', data: r } as const)),
        ...(animal.reproductionRecords || []).map(r => ({ kind: 'Reproduction', data: r } as const)),
        ...(animal.transactions || []).map(r => ({ kind: 'Transaction', data: r } as const)),
        ...accountingTransactions.map(t => ({ kind: 'AccountingTransaction', data: t } as const)),
        ...animalTasks.map(t => ({ kind: 'Task', data: t } as const)),
    ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

    // 2. Calculate Stats - include accounting transactions in investment
    const totalIllnesses = (animal.healthRecords || []).filter(r => r.type === 'Treatment').length;
    const totalOffspring = (animal.reproductionRecords || [])
        .filter(r => r.type === 'Birth')
        .reduce((acc, r) => acc + (r.outcome?.includes('Jumeaux') ? 2 : 1), 0);

    // Calculate total investment from both sources
    const legacyPurchasePrice = (animal.transactions || []).find(t => t.type === 'Purchase')?.amount || 0;
    const accountingExpenses = accountingTransactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, t) => acc + t.amount, 0);
    const totalInvestment = legacyPurchasePrice + accountingExpenses;

    // Helper for icons and colors
    const getEventStyle = (event: TimelineEvent) => {
        switch (event.kind) {
            case 'Health':
                return {
                    icon: event.data.type === 'Vaccination' ? Syringe : Stethoscope,
                    color: 'bg-red-100 text-red-600',
                    border: 'border-red-200'
                };
            case 'Reproduction':
                return {
                    icon: event.data.type === 'Birth' ? Baby : Heart,
                    color: 'bg-pink-100 text-pink-600',
                    border: 'border-pink-200'
                };
            case 'Transaction':
                return {
                    icon: DollarSign,
                    color: event.data.type === 'Sale' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600',
                    border: event.data.type === 'Sale' ? 'border-green-200' : 'border-amber-200'
                };
            case 'AccountingTransaction':
                return {
                    icon: DollarSign,
                    color: event.data.type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600',
                    border: event.data.type === 'Income' ? 'border-green-200' : 'border-orange-200'
                };
            case 'Task':
                return {
                    icon: ClipboardList,
                    color: event.data.status === 'Done' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600',
                    border: event.data.status === 'Done' ? 'border-blue-200' : 'border-slate-200'
                };
        }
    };

    return (
        <div className="space-y-8">
            {/* Life Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card noPadding className="p-4 flex items-center gap-4 bg-red-50 border-red-100">
                    <div className="p-3 bg-white rounded-full shadow-sm text-red-500">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-red-600 font-medium">Santé</p>
                        <p className="text-2xl font-bold text-red-900">{totalIllnesses} <span className="text-sm font-normal">Traitements</span></p>
                    </div>
                </Card>
                <Card noPadding className="p-4 flex items-center gap-4 bg-pink-50 border-pink-100">
                    <div className="p-3 bg-white rounded-full shadow-sm text-pink-500">
                        <Baby className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-pink-600 font-medium">Reproduction</p>
                        <p className="text-2xl font-bold text-pink-900">{totalOffspring} <span className="text-sm font-normal">Descendants</span></p>
                    </div>
                </Card>
                <Card noPadding className="p-4 flex items-center gap-4 bg-emerald-50 border-emerald-100">
                    <div className="p-3 bg-white rounded-full shadow-sm text-emerald-500">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-emerald-600 font-medium">Investissement</p>
                        <p className="text-2xl font-bold text-emerald-900">{totalInvestment.toLocaleString()} <span className="text-sm font-normal">FCFA</span></p>
                    </div>
                </Card>
            </div>

            {/* Timeline */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Chronologie des Événements</h3>
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-8">
                    {events.map((event, idx) => {
                        const style = getEventStyle(event);
                        const Icon = style.icon;

                        return (
                            <div key={idx} className="relative pl-8">
                                {/* Dot */}
                                <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${style.color}`}>
                                    <Icon className="w-3 h-3" />
                                </div>

                                {/* Content */}
                                <Card className={`border ${style.border}`} noPadding>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="neutral" className={style.color}>
                                                    {event.kind === 'Task' ? event.data.status : event.data.type}
                                                </Badge>
                                                <span className="text-sm text-slate-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {event.data.date}
                                                </span>
                                            </div>
                                            {event.kind === 'Transaction' && (
                                                <span className={`font-bold ${event.data.type === 'Sale' ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {event.data.type === 'Sale' ? '+' : '-'}{event.data.amount.toLocaleString()} FCFA
                                                </span>
                                            )}
                                            {event.kind === 'Task' && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${event.data.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                    event.data.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {event.data.priority === 'High' ? 'Haute' : event.data.priority === 'Medium' ? 'Moyenne' : 'Basse'}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-slate-900 font-medium mb-1">
                                            {event.kind === 'Health' ? event.data.description :
                                                event.kind === 'Reproduction' ? (event.data.notes || event.data.outcome) :
                                                    event.kind === 'Task' ? event.data.title :
                                                        event.kind === 'AccountingTransaction' ? event.data.description :
                                                            event.data.notes}
                                        </p>

                                        {/* Specific Details */}
                                        {event.kind === 'Reproduction' && event.data.mateId && (
                                            <p className="text-sm text-slate-500">Partenaire: ID #{event.data.mateId}</p>
                                        )}
                                        {event.kind === 'Transaction' && (
                                            <p className="text-sm text-slate-500">Tiers: {event.data.party}</p>
                                        )}
                                        {event.kind === 'Health' && event.data.performer && (
                                            <p className="text-sm text-slate-500">Par: {event.data.performer}</p>
                                        )}
                                        {event.kind === 'Task' && event.data.description && (
                                            <p className="text-sm text-slate-500">{event.data.description}</p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        );
                    })}

                    {events.length === 0 && (
                        <div className="pl-8 text-slate-500 italic">Aucun événement enregistré.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
