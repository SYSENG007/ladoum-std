import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Star, Plus, Crown, Wrench, Mail, MoreVertical, Check, Copy, Share2, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InviteMemberModal } from '../../components/staff/InviteMemberModal';
import { InvitationStats } from '../../components/staff/InvitationStats';
import { MigrationHelper } from '../../components/staff/MigrationHelper';
import { StaffService } from '../../services/StaffService';
import { FarmMemberService } from '../../services/FarmMemberService';
import { AttendanceService } from '../../services/AttendanceService';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { FarmMember } from '../../types/farm';
import type { StaffInvitation, Attendance } from '../../types/staff';
import clsx from 'clsx';

type TabType = 'members' | 'attendance' | 'planning' | 'performance';

export const Staff: React.FC = () => {
    const { currentFarm } = useFarm();
    const { user, userProfile } = useAuth();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<TabType>('members');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [members, setMembers] = useState<FarmMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<StaffInvitation[]>([]);
    const [allInvitations, setAllInvitations] = useState<StaffInvitation[]>([]); // For stats
    const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [shareInvitation, setShareInvitation] = useState<StaffInvitation | null>(null);

    // Check if current user can manage staff (based on their role)
    const currentUserMember = members.find(m => m.userId === user?.uid);
    const canManageStaff = currentUserMember?.permissions.canManageStaff || currentFarm?.ownerId === user?.uid;

    useEffect(() => {
        loadData();
    }, [currentFarm?.id]);

    const loadData = async () => {
        if (!currentFarm?.id) {
            console.log('[Staff] No farm ID, skipping load');
            return;
        }

        setLoading(true);

        try {
            console.log('[Staff] Loading data for farm:', currentFarm.id);

            // Load members from subcollection
            const farmMembers = await FarmMemberService.getMembers(currentFarm.id);
            console.log('[Staff] Loaded members:', farmMembers.length, farmMembers);
            setMembers(farmMembers);

            // Load pending invitations
            const invitations = await StaffService.getPendingInvitations(currentFarm.id);
            console.log('[Staff] Loaded invitations:', invitations.length);
            setPendingInvitations(invitations);

            // Load all invitations for stats
            const all = await StaffService.getAllInvitations(currentFarm.id);
            setAllInvitations(all);

            // Load today's attendance
            const today = new Date().toISOString().split('T')[0];
            const attendance = await AttendanceService.getByFarmAndDateRange(currentFarm.id, today, today);
            setTodayAttendance(attendance);

            console.log('[Staff] Data loaded successfully');
        } catch (err: any) {
            console.error('[Staff] Error loading staff data:', err);
            console.error('[Staff] Error details:', err.message, err.code);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!user || !userProfile || !currentFarm) return;

        try {
            await AttendanceService.checkIn(user.uid, userProfile.displayName || 'Membre', currentFarm.id);
            await loadData();
            toast.success('Pointage arrivée enregistré');
        } catch (err: any) {
            toast.error(err.message || 'Erreur lors du pointage');
        }
    };

    const handleCheckOut = async (attendanceId: string) => {
        try {
            await AttendanceService.checkOut(attendanceId);
            await loadData();
        } catch (err) {
            console.error('Error checking out:', err);
        }
    };

    const tabs = [
        { id: 'members' as TabType, label: 'Membres', icon: Users, count: members.length },
        { id: 'attendance' as TabType, label: 'Présences', icon: Clock, count: todayAttendance.length },
        { id: 'planning' as TabType, label: 'Planning', icon: Calendar },
        { id: 'performance' as TabType, label: 'Performances', icon: Star },
    ];

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-amber-500" />;
            case 'manager': return <Crown className="w-4 h-4 text-primary-500" />;
            default: return <Wrench className="w-4 h-4 text-slate-400" />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'owner': return 'Propriétaire';
            case 'manager': return 'Manager';
            default: return 'Employé';
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Expiré', color: 'bg-red-100 text-red-700 border-red-200' };
        if (diffDays === 0) return { text: 'Expire aujourd\'hui', color: 'bg-red-100 text-red-700 border-red-200' };
        if (diffDays === 1) return { text: 'Expire demain', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        if (diffDays <= 3) return { text: `Expire dans ${diffDays} jours`, color: 'bg-orange-100 text-orange-700 border-orange-200' };
        return { text: `Expire dans ${diffDays} jours`, color: 'bg-slate-200 text-slate-900 border-primary-400' };
    };

    const myTodayAttendance = todayAttendance.find(a => a.memberId === user?.uid);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion du Personnel</h1>
                    <p className="text-slate-500">Équipe de {currentFarm?.name || 'la bergerie'}</p>
                </div>
                <div className="flex gap-3">
                    {/* Quick Check-in Button */}
                    {!myTodayAttendance ? (
                        <Button onClick={handleCheckIn} variant="outline">
                            <Clock className="w-4 h-4 mr-2" />
                            Pointer Arrivée
                        </Button>
                    ) : !myTodayAttendance.checkOut ? (
                        <Button onClick={() => handleCheckOut(myTodayAttendance.id)} variant="outline">
                            <Check className="w-4 h-4 mr-2" />
                            Pointer Départ
                        </Button>
                    ) : null}

                    {canManageStaff && (
                        <Button onClick={() => setShowInviteModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Inviter
                        </Button>
                    )}
                </div>
            </div>

            {/* Migration Helper */}
            <MigrationHelper />

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 flex-shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all text-sm",
                            activeTab === tab.id
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={clsx(
                                "text-xs px-1.5 py-0.5 rounded-full",
                                activeTab === tab.id ? "bg-slate-200 text-slate-900" : "bg-slate-200 text-slate-600"
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'members' && (
                    <div className="space-y-4">
                        {/* Invitation Stats Dashboard */}
                        {canManageStaff && allInvitations.length > 0 && (
                            <InvitationStats invitations={allInvitations} />
                        )}

                        {/* Active Members */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map((member, idx) => (
                                <Card key={member.userId || idx} className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">
                                            {member.displayName?.charAt(0) || 'M'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 truncate">{member.displayName}</h3>
                                                {getRoleIcon(member.role)}
                                            </div>
                                            <p className="text-sm text-slate-500">{getRoleLabel(member.role)}</p>
                                            <p className="text-xs text-slate-400 mt-1">{member.email}</p>
                                            {member.permissions.canAccessFinances && member.role === 'manager' && (
                                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-2">
                                                    💰 Accès finances
                                                </span>
                                            )}
                                        </div>
                                        {canManageStaff && member.role !== 'owner' && (
                                            <button className="p-2 hover:bg-slate-100 rounded-lg">
                                                <MoreVertical className="w-4 h-4 text-slate-400" />
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pending Invitations */}
                        {pendingInvitations.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                    Invitations en attente
                                </h3>
                                <div className="space-y-3">
                                    {pendingInvitations.map(invitation => (
                                        <Card key={invitation.id} className="p-4 bg-amber-50 border-amber-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                                        <Mail className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-medium text-slate-900">{invitation.displayName}</p>
                                                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                                                                {invitation.role === 'manager' ? 'Manager' : 'Employé'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm text-slate-500">{invitation.email}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded border ${getTimeRemaining(invitation.expiresAt).color}`}>
                                                                {getTimeRemaining(invitation.expiresAt).text}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Extend button for invitations expiring soon */}
                                                    {(() => {
                                                        const now = new Date();
                                                        const expiry = new Date(invitation.expiresAt);
                                                        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                                                        if (daysUntilExpiry <= 2 && daysUntilExpiry >= 0) {
                                                            return (
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            if (!currentFarm?.id) return;
                                                                            await StaffService.extendInvitation(currentFarm.id, invitation.id);
                                                                            toast.success('Invitation prolongée de 7 jours');
                                                                            loadData();
                                                                        } catch (err) {
                                                                            toast.error('Erreur lors de la prolongation');
                                                                            console.error(err);
                                                                        }
                                                                    }}
                                                                    className="text-xs text-primary-600 hover:underline font-medium"
                                                                    title="Prolonger de 7 jours"
                                                                >
                                                                    Prolonger
                                                                </button>
                                                            );
                                                        }
                                                        return null;
                                                    })()}

                                                    <button
                                                        onClick={() => setShareInvitation(invitation)}
                                                        className="text-xs text-slate-900 hover:underline font-medium"
                                                    >
                                                        Renvoyer
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (!currentFarm?.id) return;
                                                            if (window.confirm(
                                                                `Annuler l'invitation de ${invitation.displayName} ?\n\nL'invitation sera marquée comme annulée mais conservée dans l'historique.`
                                                            )) {
                                                                StaffService.cancelInvitation(currentFarm.id, invitation.id)
                                                                    .then(() => {
                                                                        toast.success('Invitation annulée');
                                                                        loadData();
                                                                    })
                                                                    .catch((err) => {
                                                                        toast.error('Erreur lors de l\'annulation');
                                                                        console.error(err);
                                                                    });
                                                            }
                                                        }}
                                                        className="text-xs text-orange-600 hover:underline font-medium"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                if (!currentFarm?.id) return;
                                                                await StaffService.deleteInvitation(currentFarm.id, invitation.id);
                                                                toast.success('Invitation supprimée');
                                                                loadData();
                                                            } catch (err) {
                                                                toast.error('Erreur lors de la suppression');
                                                                console.error(err);
                                                            }
                                                        }}
                                                        className="text-xs text-red-600 hover:underline font-medium"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {members.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-600 mb-2">Aucun membre</h3>
                                <p className="text-slate-400 mb-4">Invitez des collaborateurs pour gérer votre bergerie</p>
                                {canManageStaff && (
                                    <Button onClick={() => setShowInviteModal(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Inviter un membre
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="space-y-4">
                        <Card className="p-4">
                            <h3 className="font-semibold text-slate-900 mb-4">Présences du jour</h3>
                            {todayAttendance.length > 0 ? (
                                <div className="space-y-3">
                                    {todayAttendance.map(attendance => (
                                        <div key={attendance.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx(
                                                    "w-3 h-3 rounded-full",
                                                    attendance.status === 'present' ? "bg-primary-600" :
                                                        attendance.status === 'late' ? "bg-amber-500" : "bg-red-500"
                                                )} />
                                                <span className="font-medium">{attendance.memberName}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                {attendance.checkIn && (
                                                    <span>Arrivée: {new Date(attendance.checkIn).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}</span>
                                                )}
                                                {attendance.checkOut && (
                                                    <span>Départ: {new Date(attendance.checkOut).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-400 text-center py-8">Aucun pointage aujourd'hui</p>
                            )}
                        </Card>
                    </div>
                )}

                {activeTab === 'planning' && (
                    <Card className="p-6">
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-600 mb-2">Planning à venir</h3>
                            <p className="text-slate-400">Le calendrier de planification sera disponible prochainement</p>
                        </div>
                    </Card>
                )}

                {activeTab === 'performance' && (
                    <Card className="p-6">
                        <div className="text-center py-12">
                            <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-600 mb-2">Suivi des performances</h3>
                            <p className="text-slate-400">Les métriques de performance seront disponibles prochainement</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Invite Modal */}
            <InviteMemberModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={loadData}
            />

            {/* Share Invitation Modal */}
            {shareInvitation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Renvoyer l'invitation</h3>
                            <button onClick={() => setShareInvitation(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            Invitation pour <strong>{shareInvitation.displayName}</strong> ({shareInvitation.email})
                        </p>

                        <div className="bg-slate-50 p-3 rounded-lg mb-4 font-mono text-xs break-all">
                            {`${window.location.origin}/join?token=${shareInvitation.token}`}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/join?token=${shareInvitation.token}`);
                                    toast.success('Lien copié !');
                                }}
                                className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                <Copy className="w-5 h-5" />
                                <span>Copier</span>
                            </button>
                            <button
                                onClick={() => {
                                    const msg = encodeURIComponent(`Bonjour ${shareInvitation.displayName}, vous êtes invité(e) à rejoindre ${shareInvitation.farmName} sur Ladoum STD. Cliquez ici : ${window.location.origin}/join?token=${shareInvitation.token}`);
                                    window.open(`https://wa.me/?text=${msg}`, '_blank');
                                }}
                                className="flex items-center justify-center gap-2 p-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                                <span>WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
