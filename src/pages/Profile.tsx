import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserService } from '../services/UserService';
import { FarmService } from '../services/FarmService';
import { StaffService } from '../services/StaffService';
import { AccountService } from '../services/AccountService';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { InviteMemberModal } from '../components/staff/InviteMemberModal';
import {
    Mail,
    Phone,
    LogOut,
    Building2,
    ChevronRight,
    Bell,
    Settings,
    Shield,
    Users,
    UserPlus,
    Crown,
    Briefcase,
    Wrench,
    Edit2,
    Save,
    Trash2,
    AlertTriangle,
    Share2,
    Copy,
    X
} from 'lucide-react';
import type { Farm, FarmMember } from '../types/farm';
import type { StaffInvitation } from '../types/staff';
import clsx from 'clsx';

type StaffRole = 'manager' | 'worker';

const roleLabels: Record<StaffRole, { label: string; icon: React.ElementType; color: string }> = {
    manager: { label: 'Manager', icon: Briefcase, color: 'text-blue-600 bg-blue-100' },
    worker: { label: 'Employé', icon: Wrench, color: 'text-slate-600 bg-slate-100' },
};

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user, userProfile, logout, refreshUserProfile } = useAuth();
    useData(); // Keep hook for context but data refresh handled elsewhere

    const [farms, setFarms] = useState<Farm[]>([]);
    const [farmMembers, setFarmMembers] = useState<FarmMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<StaffInvitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [shareInvitation, setShareInvitation] = useState<StaffInvitation | null>(null);

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
                // Try to load user's farms
                try {
                    const userFarms = await FarmService.getByUserId(user.uid);
                    setFarms(userFarms);
                } catch (farmError: any) {
                    // If permission error, silently continue (user might not have farms yet)
                    if (farmError.code !== 'permission-denied') {
                        console.error('Error loading farms:', farmError);
                    }
                }

                // Charger les membres de la bergerie
                if (userProfile?.farmId) {
                    const activeFarm = farms.find(f => f.id === userProfile.farmId);
                    if (activeFarm?.members) {
                        setFarmMembers(activeFarm.members);
                    }

                    // Charger les invitations en attente (only for owners)
                    try {
                        const invitations = await StaffService.getPendingInvitations(userProfile.farmId);
                        setPendingInvitations(invitations);
                    } catch (invError: any) {
                        // Silently ignore if user doesn't have permission (not owner)
                        if (invError.code !== 'permission-denied') {
                            console.error('Error loading invitations:', invError);
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };
        loadData();
    }, [user, userProfile?.farmId]);

    // Set edit form values
    useEffect(() => {
        if (userProfile) {
            setEditName(userProfile.displayName || '');
            setEditPhone(userProfile.phone || '');
        }
    }, [userProfile]);

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
                // Success - user is now logged out automatically
                console.log('Account deleted successfully');
                // Close modal and they'll be redirected by auth context
                setShowDeleteModal(false);
            } else {
                // Show error - keep modal open
                setDeletingAccount(false);

                // Check if it's the reauthentication error
                if (result.message.includes('déconnecter puis vous reconnecter') ||
                    result.message.includes('recent')) {
                    // Show in modal with logout button
                    const shouldLogout = window.confirm(
                        `Pour des raisons de sécurité, vous devez vous reconnecter récemment avant de supprimer votre compte.\n\nVoulez-vous vous déconnecter maintenant pour vous reconnecter ?`
                    );
                    if (shouldLogout) {
                        setShowDeleteModal(false);
                        await logout();
                        navigate('/login');
                    }
                } else {
                    // Other errors
                    alert(result.message);
                    setShowDeleteModal(false);
                }
            }
        } catch (err: any) {
            console.error('Error deleting account:', err);
            alert(`Une erreur est survenue: ${err.message || 'Erreur inconnue'}`);
            setDeletingAccount(false);
            setShowDeleteModal(false);
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

    const activeFarm = farms.find(f => f.id === userProfile?.farmId);
    const isOwner = activeFarm?.ownerId === user?.uid;

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
            </Card>

            {/* Staff Management */}
            {isOwner && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-700" />
                            <h3 className="text-lg font-semibold text-slate-900">Équipe</h3>
                        </div>
                        <Button size="sm" onClick={() => setShowInviteModal(true)}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Inviter
                        </Button>
                    </div>

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
                                        className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-amber-400 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {invitation.displayName}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {invitation.email} • {invitation.role === 'manager' ? 'Manager' : 'Employé'}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => setShareInvitation(invitation)}
                                                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                                                    >
                                                        <Share2 className="w-3 h-3" />
                                                        Partager
                                                    </button>
                                                    <span className="text-slate-300">•</span>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`Voulez-vous vraiment annuler l'invitation pour ${invitation.displayName} ?`)) {
                                                                try {
                                                                    await StaffService.cancelInvitation(invitation.id);
                                                                    setPendingInvitations(prev => prev.filter(i => i.id !== invitation.id));
                                                                } catch (err) {
                                                                    console.error('Error canceling invitation:', err);
                                                                    alert('Erreur lors de l\'annulation');
                                                                }
                                                            }
                                                        }}
                                                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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

            {/* Invite Member Modal */}
            <InviteMemberModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={() => {
                    setShowInviteModal(false);
                    // Reload invitations
                    if (userProfile?.farmId) {
                        StaffService.getPendingInvitations(userProfile.farmId).then(setPendingInvitations);
                    }
                }}
            />

            {/* Share Invitation Modal */}
            {shareInvitation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShareInvitation(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Partager l'invitation</h3>
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
                                    alert('Lien copié !');
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
