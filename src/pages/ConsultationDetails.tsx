import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Video, Calendar, User, CreditCard,
    MessageCircle, FileText, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
    ConsultationChat,
    ConsultationReportView,
    PaymentModal
} from '../components/teleconsultation';
import { ConsultationService } from '../services/ConsultationService';
import { VeterinarianService } from '../services/VeterinarianService';
import { AnimalService } from '../services/AnimalService';
import { TaskService } from '../services/TaskService';
import type {
    Consultation,
    ConsultationMessage,
    ConsultationReport,
    Veterinarian,
    FollowUpTask,
    PaymentMethod
} from '../types/consultation';
import type { Animal } from '../types';
import clsx from 'clsx';

export const ConsultationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [veterinarian, setVeterinarian] = useState<Veterinarian | null>(null);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [messages, setMessages] = useState<ConsultationMessage[]>([]);
    const [report, setReport] = useState<ConsultationReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chat' | 'animals' | 'report'>('chat');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [tasksCreated, setTasksCreated] = useState(false);

    // Current user info (would come from auth context)
    const currentUserId = 'current-user-id';
    const currentUserRole: 'Farmer' | 'Vet' = 'Farmer';
    const currentUserName = 'Utilisateur';

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const consultationData = await ConsultationService.getById(id);
            if (consultationData) {
                setConsultation(consultationData);

                // Load related data in parallel
                const [vetData, messagesData, reportData, allAnimals] = await Promise.all([
                    consultationData.veterinarianId
                        ? VeterinarianService.getById(consultationData.veterinarianId)
                        : null,
                    ConsultationService.getMessages(id),
                    ConsultationService.getReport(id),
                    AnimalService.getAll()
                ]);

                setVeterinarian(vetData);
                setMessages(messagesData);
                setReport(reportData);
                setAnimals(allAnimals.filter(a => consultationData.animalIds.includes(a.id)));
            }
        } catch (error) {
            console.error('Failed to load consultation:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (content: string, type: 'text' | 'image' | 'video', mediaUrl?: string) => {
        if (!id) return;
        try {
            await ConsultationService.addMessage({
                consultationId: id,
                senderId: currentUserId,
                senderName: currentUserName,
                senderRole: currentUserRole,
                type,
                content,
                mediaUrl,
                timestamp: new Date().toISOString()
            });
            // Reload messages
            const updatedMessages = await ConsultationService.getMessages(id);
            setMessages(updatedMessages);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handlePayment = async (_method: PaymentMethod) => {
        if (!id) return;
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            await ConsultationService.updatePayment(id, 'Paid');
            await loadData();
        } catch (error) {
            console.error('Payment failed:', error);
            throw error;
        }
    };

    const handleCreateTasks = async (followUpTasks: FollowUpTask[]) => {
        try {
            for (const task of followUpTasks) {
                await TaskService.add({
                    title: task.title,
                    date: task.dueDate,
                    status: 'Todo',
                    priority: 'High',
                    type: 'Health',
                    animalId: task.animalId,
                    description: task.description
                });
            }
            setTasksCreated(true);
        } catch (error) {
            console.error('Failed to create tasks:', error);
        }
    };

    const handleCancelConsultation = async () => {
        if (!id || !confirm('Êtes-vous sûr de vouloir annuler cette consultation ?')) return;
        try {
            await ConsultationService.cancel(id);
            await loadData();
        } catch (error) {
            console.error('Failed to cancel:', error);
        }
    };

    const handleStartConsultation = async () => {
        if (!id) return;
        try {
            await ConsultationService.updateStatus(id, 'InProgress');
            await loadData();
        } catch (error) {
            console.error('Failed to start:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadge = () => {
        if (!consultation) return null;
        switch (consultation.status) {
            case 'Scheduled':
                return <Badge variant="info" className="text-sm">Programmée</Badge>;
            case 'InProgress':
                return <Badge variant="warning" className="text-sm">En cours</Badge>;
            case 'Completed':
                return <Badge variant="success" className="text-sm">Terminée</Badge>;
            case 'Cancelled':
                return <Badge variant="neutral" className="text-sm">Annulée</Badge>;
        }
    };

    const getTypeLabel = () => {
        if (!consultation) return '';
        switch (consultation.type) {
            case 'Health': return 'Santé';
            case 'Reproduction': return 'Reproduction';
            case 'Nutrition': return 'Nutrition';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!consultation) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Consultation introuvable</h3>
                <Link to="/teleconsultation">
                    <Button variant="secondary" icon={ArrowLeft}>Retour</Button>
                </Link>
            </div>
        );
    }

    const isChatEnabled = consultation.status === 'InProgress';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/teleconsultation">
                    <Button variant="secondary" icon={ArrowLeft} size="sm">Retour</Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-900">
                            Consultation {getTypeLabel()}
                        </h1>
                        {getStatusBadge()}
                    </div>
                    <p className="text-sm text-slate-500">
                        {formatDate(consultation.scheduledDate)}
                        {consultation.scheduledTime && ` à ${consultation.scheduledTime}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {consultation.status === 'Scheduled' && (
                        <>
                            <Button
                                variant="secondary"
                                icon={XCircle}
                                onClick={handleCancelConsultation}
                            >
                                Annuler
                            </Button>
                            <Button
                                icon={Video}
                                onClick={handleStartConsultation}
                            >
                                Démarrer
                            </Button>
                        </>
                    )}
                    {consultation.paymentStatus === 'Pending' && consultation.status !== 'Cancelled' && (
                        <Button
                            icon={CreditCard}
                            onClick={() => setShowPaymentModal(true)}
                        >
                            Payer {consultation.amount.toLocaleString()} FCFA
                        </Button>
                    )}
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Info cards */}
                <div className="space-y-4">
                    {/* Veterinarian */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Vétérinaire
                        </h3>
                        {veterinarian ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={veterinarian.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(veterinarian.name)}&background=6366f1&color=fff`}
                                    alt={veterinarian.name}
                                    className="w-12 h-12 rounded-xl object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-slate-900">{veterinarian.name}</p>
                                    <p className="text-sm text-slate-500">
                                        {veterinarian.specialty === 'General' ? 'Généraliste' : veterinarian.specialty}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500">Non assigné</p>
                        )}
                    </Card>

                    {/* Animals */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Animaux concernés ({animals.length})
                        </h3>
                        <div className="space-y-2">
                            {animals.map(animal => (
                                <Link
                                    key={animal.id}
                                    to={`/herd/${animal.id}`}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <img
                                        src={animal.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(animal.name)}&background=10b981&color=fff`}
                                        alt={animal.name}
                                        className="w-10 h-10 rounded-lg object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{animal.name}</p>
                                        <p className="text-xs text-slate-500">{animal.tagId}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>

                    {/* Payment status */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Paiement
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-900">
                                {consultation.amount.toLocaleString()} FCFA
                            </span>
                            {consultation.paymentStatus === 'Paid' ? (
                                <Badge variant="success">Payé</Badge>
                            ) : consultation.paymentStatus === 'Pending' ? (
                                <Badge variant="warning">En attente</Badge>
                            ) : (
                                <Badge variant="neutral">Remboursé</Badge>
                            )}
                        </div>
                        {consultation.paymentMethod && (
                            <p className="text-sm text-slate-500 mt-2">
                                Via {consultation.paymentMethod === 'MobileMoney' ? 'Mobile Money' : 'Carte bancaire'}
                            </p>
                        )}
                    </Card>
                </div>

                {/* Right: Chat / Report */}
                <div className="lg:col-span-2">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={clsx(
                                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                activeTab === 'chat'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            )}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('animals')}
                            className={clsx(
                                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                activeTab === 'animals'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            )}
                        >
                            <User className="w-4 h-4" />
                            Historique
                        </button>
                        <button
                            onClick={() => setActiveTab('report')}
                            className={clsx(
                                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                activeTab === 'report'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            )}
                        >
                            <FileText className="w-4 h-4" />
                            Compte rendu
                        </button>
                    </div>

                    {/* Tab content */}
                    {activeTab === 'chat' && (
                        <div>
                            {consultation.status === 'Scheduled' && (
                                <Card className="mb-4 bg-blue-50 border-blue-200">
                                    <div className="flex items-center gap-3 text-blue-700">
                                        <Calendar className="w-5 h-5" />
                                        <p className="text-sm">
                                            Le chat sera disponible une fois la consultation démarrée.
                                        </p>
                                    </div>
                                </Card>
                            )}
                            <ConsultationChat
                                messages={messages}
                                currentUserId={currentUserId}
                                currentUserRole={currentUserRole}
                                currentUserName={currentUserName}
                                onSendMessage={handleSendMessage}
                                disabled={!isChatEnabled}
                            />
                        </div>
                    )}

                    {activeTab === 'animals' && (
                        <Card>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                Historique des animaux
                            </h3>
                            {animals.map(animal => (
                                <div key={animal.id} className="mb-6 last:mb-0">
                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                                        <img
                                            src={animal.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(animal.name)}&background=10b981&color=fff`}
                                            alt={animal.name}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                        <div>
                                            <p className="font-semibold text-slate-900">{animal.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {animal.gender === 'Male' ? 'Mâle' : 'Femelle'} • {animal.breed}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500">Poids:</span>
                                            <span className="ml-2 font-medium">{animal.weight} kg</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Taille:</span>
                                            <span className="ml-2 font-medium">{animal.height} cm</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">TP:</span>
                                            <span className="ml-2 font-medium">{animal.chestGirth} cm</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">LCS:</span>
                                            <span className="ml-2 font-medium">{animal.length} cm</span>
                                        </div>
                                    </div>
                                    {animal.healthRecords && animal.healthRecords.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <p className="text-sm text-slate-500 mb-2">Derniers soins:</p>
                                            <div className="space-y-1">
                                                {animal.healthRecords.slice(-3).map(record => (
                                                    <div key={record.id} className="text-sm flex justify-between">
                                                        <span className="text-slate-700">{record.description}</span>
                                                        <span className="text-slate-400">{record.date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </Card>
                    )}

                    {activeTab === 'report' && (
                        report ? (
                            <ConsultationReportView
                                report={report}
                                onCreateTasks={handleCreateTasks}
                                tasksCreated={tasksCreated}
                            />
                        ) : (
                            <Card className="text-center py-12 border-dashed">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                                    Pas encore de compte rendu
                                </h3>
                                <p className="text-slate-500">
                                    Le compte rendu sera disponible après la consultation
                                </p>
                            </Card>
                        )
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={consultation.amount}
                onPayment={handlePayment}
            />
        </div>
    );
};
