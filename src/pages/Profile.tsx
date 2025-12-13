import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserService } from '../services/UserService';
import { FarmService } from '../services/FarmService';
import { InvitationService } from '../services/InvitationService';
import { AccountService } from '../services/AccountService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
    Mail,
    Phone,
    LogOut,
    Building2,
    Copy,
    Check,
    ChevronRight,
    Bell,
    Settings,
    Shield,
    Users,
    UserPlus,
    Crown,
    Briefcase,
    Wrench,
    X,
    Edit2,
    Save,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import type { Farm, FarmMember } from '../types/farm';
import type { Invitation } from '../types/auth';
import clsx from 'clsx';

type StaffRole = 'manager' | 'worker';

const roleLabels: Record<StaffRole, { label: string; icon: React.ElementType; color: string }> = {
    manager: { label: 'Manager', icon: Briefcase, color: 'text-blue-600 bg-blue-100' },
    worker: { label: 'Employé', icon: Wrench, color: 'text-slate-600 bg-slate-100' },
};

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user, userProfile, logout, refreshUserProfile } = useAuth();
    const { refreshData } = useData();

    const [farms, setFarms] = useState<Farm[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [farmMembers, setFarmMembers] = useState<FarmMember[]>([]);
    const [loading, setLoading] = useState(false);

    // Staff management
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [staffEmail, setStaffEmail] = useState('');
    const [staffName, setStaffName] = useState('');
    const [staffRole, setStaffRole] = useState<StaffRole>('worker');
    const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Edit profile
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    // Delete account
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Charger les fermes et membres
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const userFarms = await FarmService.getByUserId(user.uid);
                setFarms(userFarms);

                // Charger les membres de la ferme active
                if (userProfile?.activeFarmId) {
                    const activeFarm = userFarms.find(f => f.id === userProfile.activeFarmId);
                    if (activeFarm?.members) {
                        setFarmMembers(activeFarm.members);
                    }
                }

                // Charger les invitations
                const userInvitations = await InvitationService.getByInviter(user.uid);
                setInvitations(userInvitations);
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };
        loadData();
    }, [user, userProfile?.activeFarmId]);

    // Set edit form values
    useEffect(() => {
        if (userProfile) {
            setEditName(userProfile.displayName || '');
            setEditPhone(userProfile.phone || '');
        }
    }, [userProfile]);

    const handleSwitchFarm = async (farmId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await UserService.setActiveFarm(user.uid, farmId);
            await refreshUserProfile();
            await refreshData();
        } catch (err) {
            console.error('Error switching farm:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteStaff = async () => {
        if (!user || !staffEmail || !userProfile?.activeFarmId) return;
        setLoading(true);
        try {
            const invitation = await InvitationService.create(
                staffEmail,
                user.uid,
                userProfile.activeFarmId,
                staffRole
            );
            setNewInviteCode(invitation.code);
            setInvitations(prev => [...prev, invitation]);
            setStaffEmail('');
            setStaffName('');
            setShowAddStaff(false);
        } catch (err) {
            console.error('Error creating invitation:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await UserService.update(user.uid, {
                displayName: editName,
                phone: editPhone,
            });
            await refreshUserProfile();
            setIsEditingProfile(false);
        } catch (err) {
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyInviteCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (!user || deleteConfirmText !== 'SUPPRIMER') return;

        setDeletingAccount(true);
        try {
            const result = await AccountService.deleteAccount(user.uid);
            if (result.success) {
                navigate('/login');
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error('Error deleting account:', err);
            alert('Une erreur est survenue lors de la suppression du compte');
        } finally {
            setDeletingAccount(false);
            setShowDeleteModal(false);
        }
    };

    const activeFarm = farms.find(f => f.id === userProfile?.activeFarmId);
    const isOwner = activeFarm?.ownerId === user?.uid;
    const pendingInvitations = invitations.filter(i => !i.usedAt);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Mon Profil</h1>
                <p className="text-slate-500">Gérez votre compte et votre équipe</p>
            </div>

            {/* User Info Card */}
            <Card className="p-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {isEditingProfile ? (
                        <div className="flex-1 space-y-3">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Votre nom"
                            />
                            <input
                                type="tel"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Téléphone"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                                    <Save className="w-4 h-4 mr-1" />
                                    Enregistrer
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => setIsEditingProfile(false)}>
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {userProfile?.displayName || 'Utilisateur'}
                                </h2>
                                {isOwner && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">
                                        <Crown className="w-3 h-3" />
                                        Propriétaire
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                                <Mail className="w-4 h-4" />
                                <span>{user?.email}</span>
                            </div>
                            {userProfile?.phone && (
                                <div className="flex items-center gap-2 text-slate-500 mt-1">
                                    <Phone className="w-4 h-4" />
                                    <span>{userProfile.phone}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {!isEditingProfile && (
                        <Button variant="secondary" size="sm" onClick={() => setIsEditingProfile(true)}>
                            <Edit2 className="w-4 h-4 mr-1" />
                            Modifier
                        </Button>
                    )}
                </div>
            </Card>

            {/* Active Farm Card */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Bergerie Active</h3>
                    {farms.length > 1 && (
                        <span className="text-sm text-slate-500">
                            {farms.length} bergeries
                        </span>
                    )}
                </div>

                {activeFarm ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{activeFarm.name}</h4>
                                {activeFarm.location && (
                                    <p className="text-sm text-slate-500">{activeFarm.location}</p>
                                )}
                            </div>
                            <span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded-full font-medium">
                                Active
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500">Aucune bergerie configurée</p>
                )}

                {/* Other Farms */}
                {farms.filter(f => f.id !== userProfile?.activeFarmId).length > 0 && (
                    <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-slate-700">Autres bergeries</h4>
                        {farms
                            .filter(f => f.id !== userProfile?.activeFarmId)
                            .map(farm => (
                                <button
                                    key={farm.id}
                                    onClick={() => handleSwitchFarm(farm.id)}
                                    disabled={loading}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                                >
                                    <Building2 className="w-5 h-5 text-slate-400" />
                                    <span className="flex-1 text-left font-medium text-slate-700">
                                        {farm.name}
                                    </span>
                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            ))}
                    </div>
                )}
            </Card>

            {/* Staff Management - Only for owners/managers */}
            {isOwner && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Équipe</h3>
                        </div>
                        <Button size="sm" onClick={() => setShowAddStaff(true)}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Ajouter
                        </Button>
                    </div>

                    {/* New Invite Code Alert */}
                    {newInviteCode && (
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <p className="text-sm text-emerald-700 mb-2 font-medium">
                                ✅ Invitation créée ! Partagez ce code :
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-white rounded-lg font-mono text-lg tracking-wider text-center border border-emerald-200">
                                    {newInviteCode}
                                </code>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => copyInviteCode(newInviteCode)}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-emerald-600 mt-2">
                                Ce code expire dans 7 jours
                            </p>
                            <button
                                onClick={() => setNewInviteCode(null)}
                                className="text-xs text-slate-500 hover:text-slate-700 mt-2"
                            >
                                Fermer
                            </button>
                        </div>
                    )}

                    {/* Add Staff Form */}
                    {showAddStaff && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-slate-900">
                                    Inviter un membre
                                </h4>
                                <button onClick={() => setShowAddStaff(false)}>
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={staffEmail}
                                        onChange={(e) => setStaffEmail(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="email@exemple.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Nom (optionnel)</label>
                                    <input
                                        type="text"
                                        value={staffName}
                                        onChange={(e) => setStaffName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Nom de l'employé"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-2">Rôle</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.entries(roleLabels) as [StaffRole, typeof roleLabels[StaffRole]][]).map(([role, info]) => (
                                            <button
                                                key={role}
                                                onClick={() => setStaffRole(role)}
                                                className={clsx(
                                                    "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                                    staffRole === role
                                                        ? "border-emerald-500 bg-emerald-50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                <info.icon className={clsx("w-5 h-5", staffRole === role ? "text-emerald-600" : "text-slate-400")} />
                                                <span className={clsx("font-medium", staffRole === role ? "text-emerald-700" : "text-slate-600")}>
                                                    {info.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleInviteStaff}
                                    disabled={loading || !staffEmail}
                                    className="w-full"
                                >
                                    Créer l'invitation
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Current Team Members */}
                    <div className="space-y-2">
                        {/* Owner */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-medium">
                                {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-900">{userProfile?.displayName}</p>
                                <p className="text-xs text-slate-500">{user?.email}</p>
                            </div>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                Propriétaire
                            </span>
                        </div>

                        {/* Other members */}
                        {farmMembers.filter(m => m.userId !== user?.uid).map(member => {
                            const roleInfo = roleLabels[member.role as StaffRole] || roleLabels.worker;
                            return (
                                <div
                                    key={member.id || member.userId}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200"
                                >
                                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium">
                                        {member.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{member.name || 'Membre'}</p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                    <span className={clsx("px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1", roleInfo.color)}>
                                        <roleInfo.icon className="w-3 h-3" />
                                        {roleInfo.label}
                                    </span>
                                </div>
                            );
                        })}

                        {/* No members message */}
                        {farmMembers.filter(m => m.userId !== user?.uid).length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">
                                Vous êtes seul dans cette bergerie
                            </p>
                        )}
                    </div>

                    {/* Pending Invitations */}
                    {pendingInvitations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">
                                Invitations en attente ({pendingInvitations.length})
                            </h4>
                            <div className="space-y-2">
                                {pendingInvitations.map(invitation => (
                                    <div
                                        key={invitation.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                                    >
                                        <Mail className="w-5 h-5 text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-700">
                                                {invitation.email}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Code: {invitation.code}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => copyInviteCode(invitation.code)}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <Copy className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Quick Links */}
            <Card className="divide-y divide-slate-100">
                <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span className="flex-1 text-left font-medium text-slate-700">
                        Paramètres
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <span className="flex-1 text-left font-medium text-slate-700">
                        Notifications
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <span className="flex-1 text-left font-medium text-slate-700">
                        Sécurité
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
            </Card>

            {/* Logout */}
            <Button
                variant="danger"
                className="w-full"
                onClick={handleLogout}
            >
                <LogOut className="w-5 h-5 mr-2" />
                Se déconnecter
            </Button>

            {/* Delete Account */}
            <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                Supprimer mon compte
            </button>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Supprimer le compte
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Cette action est irréversible
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                            <p className="font-medium mb-2">Toutes vos données seront supprimées :</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Vos fermes et animaux</li>
                                <li>Vos tâches et inventaire</li>
                                <li>Vos transactions</li>
                                <li>Votre profil et compte</li>
                            </ul>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="SUPPRIMER"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                }}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'SUPPRIMER' || deletingAccount}
                            >
                                {deletingAccount ? 'Suppression...' : 'Supprimer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
