import React from 'react';
import { FileText, Pill, Calendar, CheckCircle, User } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { ConsultationReport, FollowUpTask } from '../../types/consultation';
import clsx from 'clsx';

interface ConsultationReportViewProps {
    report: ConsultationReport;
    onCreateTasks?: (tasks: FollowUpTask[]) => void;
    tasksCreated?: boolean;
}

export const ConsultationReportView: React.FC<ConsultationReportViewProps> = ({
    report,
    onCreateTasks,
    tasksCreated = false
}) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-50 rounded-xl">
                        <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Compte Rendu</h3>
                        <p className="text-sm text-slate-500">
                            Dr. {report.veterinarianName} • {formatDate(report.createdAt)}
                        </p>
                    </div>
                </div>
                <Badge variant="success">Complet</Badge>
            </div>

            {/* Diagnosis */}
            <Card>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-600" />
                    Diagnostic
                </h4>
                <p className="text-slate-700 leading-relaxed">{report.diagnosis}</p>
            </Card>

            {/* Recommendations */}
            <Card>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Recommandations
                </h4>
                <ul className="space-y-2">
                    {report.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                            <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 rounded-full text-sm font-medium shrink-0">
                                {idx + 1}
                            </span>
                            <span>{rec}</span>
                        </li>
                    ))}
                </ul>
            </Card>

            {/* Prescriptions */}
            {report.prescriptions.length > 0 && (
                <Card>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Prescriptions
                    </h4>
                    <div className="space-y-3">
                        {report.prescriptions.map((prescription, idx) => (
                            <div
                                key={idx}
                                className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="font-medium text-blue-900">
                                        {prescription.medicationName}
                                    </span>
                                    <Badge variant="info" className="text-xs">
                                        {prescription.duration}
                                    </Badge>
                                </div>
                                <p className="text-sm text-blue-700">
                                    {prescription.dosage} • {prescription.frequency}
                                </p>
                                {prescription.notes && (
                                    <p className="text-xs text-blue-600 mt-1 italic">
                                        {prescription.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Follow-up Tasks */}
            {report.followUpTasks.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            Tâches de Suivi
                        </h4>
                        {!tasksCreated && onCreateTasks && (
                            <button
                                onClick={() => onCreateTasks(report.followUpTasks)}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Créer les tâches
                            </button>
                        )}
                        {tasksCreated && (
                            <Badge variant="success" className="text-xs">
                                Tâches créées
                            </Badge>
                        )}
                    </div>
                    <div className="space-y-2">
                        {report.followUpTasks.map((task, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                            >
                                <div className={clsx(
                                    'w-2 h-2 rounded-full',
                                    tasksCreated ? 'bg-green-500' : 'bg-purple-400'
                                )} />
                                <div className="flex-1">
                                    <p className="font-medium text-purple-900">{task.title}</p>
                                    <p className="text-sm text-purple-700">{task.description}</p>
                                </div>
                                <span className="text-sm text-purple-600 font-medium">
                                    {formatDate(task.dueDate)}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
