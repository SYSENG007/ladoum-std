import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Star, Plus, Crown, Wrench, Mail, MoreVertical, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InviteMemberModal } from '../../components/staff/InviteMemberModal';
import { StaffService } from '../../services/StaffService';
import { AttendanceService } from '../../services/AttendanceService';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import type { FarmMember } from '../../types/farm';
import type { StaffInvitation, Attendance } from '../../types/staff';
import clsx from 'clsx';

type TabType = 'members' | 'attendance' | 'planning' | 'performance';

export const Staff: React.FC = () => {
    const { currentFarm } = useFarm();
    const { user, userProfile } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('members');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [members, setMembers] = useState<FarmMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<StaffInvitation[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    // Check if current user can manage staff (based on their role in farm members)
    const currentUserMember = currentFarm?.members?.find(m => m.userId === user?.uid);
    const canManageStaff = currentUserMember?.role === 'owner' || currentUserMember?.role === 'manager' || currentFarm?.ownerId === user?.uid;

    useEffect(() => {
        loadData();
    }, [currentFarm?.id]);

    const loadData = async () => {
        if (!currentFarm?.id) return;
        setLoading(true);

        try {
            // Load members from farm
            setMembers(currentFarm.members || []);

            // Load pending invitations
            const invitations = await StaffService.getPendingInvitations(currentFarm.id);
            setPendingInvitations(invitations);

            // Load today's attendance
            const today = new Date().toISOString().split('T')[0];
            const attendance = await AttendanceService.getByFarmAndDateRange(currentFarm.id, today, today);
            setTodayAttendance(attendance);
        } catch (err) {
            console.error('Error loading staff data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!user || !userProfile || !currentFarm) return;

        try {
            await AttendanceService.checkIn(user.uid, userProfile.displayName || 'Membre', currentFarm.id);
            await loadData();
        } catch (err: any) {
            alert(err.message || 'Erreur lors du pointage');
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
            case 'manager': return <Crown className="w-4 h-4 text-blue-500" />;
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
                                activeTab === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
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
                        {/* Active Members */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map((member, idx) => (
                                <Card key={member.userId || idx} className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">
                                            {member.displayName?.charAt(0) || 'M'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 truncate">{member.displayName}</h3>
                                                {getRoleIcon(member.role)}
                                            </div>
                                            <p className="text-sm text-slate-500">{getRoleLabel(member.role)}</p>
                                            <p className="text-xs text-slate-400 mt-1">{member.email}</p>
                                            {member.canAccessFinances && member.role === 'manager' && (
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
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                                        <Mail className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{invitation.displayName}</p>
                                                        <p className="text-sm text-slate-500">{invitation.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded">
                                                        {invitation.role === 'manager' ? 'Manager' : 'Employé'}
                                                    </span>
                                                    <button
                                                        onClick={() => StaffService.extendInvitation(invitation.id)}
                                                        className="text-xs text-emerald-600 hover:underline"
                                                    >
                                                        Renvoyer
                                                    </button>
                                                    <button
                                                        onClick={() => StaffService.cancelInvitation(invitation.id).then(loadData)}
                                                        className="text-xs text-red-600 hover:underline"
                                                    >
                                                        Annuler
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
                                                    attendance.status === 'present' ? "bg-emerald-500" :
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
        </div>
    );
};

export default Staff;
