import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Users, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StaffService } from '../services/StaffService';
import { FarmService } from '../services/FarmService';
import { UserService } from '../services/UserService';
import { useAuth } from '../context/AuthContext';
import type { StaffInvitation } from '../types/staff';

type JoinState =
    | 'loading'
    | 'error'
    | 'not_logged_in'
    | 'email_mismatch'     // Logged in user email doesn't match invitation
    | 'already_member'
    | 'has_own_farm'       // User already owns/belongs to another farm
    | 'ready_to_accept'
    | 'accepting'
    | 'success';

export const Join: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, userProfile, logout, loading: authLoading, refreshUserProfile } = useAuth();

    const rawToken = searchParams.get('token') || searchParams.get('code') || '';
    const token = rawToken ? decodeURIComponent(rawToken) : '';

    const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
    const [state, setState] = useState<JoinState>('loading');
    const [error, setError] = useState<string | null>(null);
    const [existingFarmName, setExistingFarmName] = useState<string>('');

    // Load invitation and determine state
    useEffect(() => {
        // Don't evaluate user state while auth is still loading
        // This prevents showing "not_logged_in" while waiting for Firebase auth
        if (authLoading) {
            console.log('[Join] Auth loading, waiting...');
            return;
        }

        console.log('[Join] Auth ready, user:', user?.uid, 'userProfile:', userProfile?.id);
        loadInvitationAndCheckState();
    }, [token, user, userProfile, authLoading]);

    const loadInvitationAndCheckState = async () => {
        console.log('[Join] Loading invitation, token:', token?.slice(0, 8) + '...');

        if (!token) {
            setError('Lien d\'invitation invalide');
            setState('error');
            return;
        }

        try {
            // 1. Load invitation
            const inv = await StaffService.getByToken(token);

            if (!inv) {
                setError('Cette invitation a expiré ou n\'existe plus');
                setState('error');
                return;
            }

            setInvitation(inv);
            console.log('[Join] Invitation loaded:', inv.farmName, 'for:', inv.email);

            // 2. Check if user is logged in
            if (!user || !userProfile) {
                console.log('[Join] User not logged in');
                setState('not_logged_in');
                return;
            }

            const userEmail = user.email?.toLowerCase() || '';
            const invitedEmail = inv.email.toLowerCase();

            // 3. Check email match
            if (userEmail !== invitedEmail) {
                console.log('[Join] Email mismatch:', userEmail, 'vs', invitedEmail);
                setState('email_mismatch');
                return;
            }

            // 4. Check if already member of this farm
            // Don't fetch farm data (would cause permission error if user not yet member)
            // Instead, check user's profile farmId
            if (userProfile.farmId === inv.farmId) {
                console.log('[Join] User already member of farm:', inv.farmId);
                setState('already_member');
                return;
            }

            // 5. Check if user has their own farm (multi-farm conflict)
            if (userProfile.farmId && userProfile.farmId !== inv.farmId) {
                // User belongs to a different farm
                // Try to get their current farm to check if they're the owner
                try {
                    const currentFarm = await FarmService.getById(userProfile.farmId);
                    if (currentFarm) {
                        // Check if user is owner of their current farm
                        const isOwner = currentFarm.ownerId === user.uid;
                        if (isOwner) {
                            console.log('[Join] User already owns a farm:', currentFarm.name);
                            setExistingFarmName(currentFarm.name);
                            setState('has_own_farm');
                            return;
                        }
                        // If just a member (not owner), we can switch their farm
                    }
                } catch (farmError) {
                    // If we can't read their current farm (shouldn't happen), continue anyway
                    console.warn('[Join] Could not read current farm:', farmError);
                }
            }

            // 6. Ready to accept
            console.log('[Join] Ready to accept invitation');
            setState('ready_to_accept');

        } catch (err) {
            console.error('[Join] Error:', err);
            setError('Erreur lors du chargement de l\'invitation');
            setState('error');
        }
    };

    const handleAccept = async () => {
        if (!invitation || !user || !userProfile) return;

        setState('accepting');
        setError(null);

        try {
            // Verify email one more time for security
            if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
                setError('L\'email ne correspond pas à l\'invitation');
                setState('ready_to_accept');
                return;
            }

            console.log('[Join] Step 1: Mark invitation as accepted');
            // Mark invitation as accepted FIRST
            await StaffService.acceptInvitation(invitation.id, user.uid);

            console.log('[Join] Step 2: Update user profile with farm');
            // Update user's farm (this they CAN do - their own profile)
            await UserService.setFarm(user.uid, invitation.farmId, invitation.role);
            if (!userProfile.onboardingCompleted) {
                await UserService.completeOnboarding(user.uid);
            }

            console.log('[Join] Step 3: Try to add member to farm');
            // Try to add to farm - this might fail due to permissions
            // but that's OK, we'll add a background process to handle this
            try {
                await FarmService.addMember(invitation.farmId, {
                    userId: user.uid,
                    displayName: userProfile.displayName || invitation.displayName,
                    email: invitation.email,
                    role: invitation.role,
                    canAccessFinances: invitation.canAccessFinances,
                    status: 'active',
                    joinedAt: new Date().toISOString()
                });
                console.log('[Join] Successfully added to farm members');
            } catch (farmError: any) {
                // If we can't add to farm (permission issue), that's OK
                // The user profile is updated, and they'll have access once farm syncs
                console.warn('[Join] Could not add to farm members (will sync later):', farmError.message);
            }

            console.log('[Join] Step 4: Refresh user profile in context');
            // CRITICAL: Refresh the user profile in context so routing works correctly
            await refreshUserProfile();

            setState('success');

            // Redirect to dashboard after 1 second
            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (err: any) {
            console.error('[Join] Error accepting invitation:', err);
            if (err.message?.includes('already a member')) {
                setState('already_member');
            } else {
                setError(err.message || 'Erreur lors de l\'acceptation de l\'invitation');
                setState('ready_to_accept');
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        // After logout, the useEffect will trigger and set state to 'not_logged_in'
    };

    // ============================================
    // RENDER STATES
    // ============================================

    // Loading
    if (state === 'loading') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Chargement de l'invitation...</p>
                </div>
            </div>
        );
    }

    // Error
    if (state === 'error') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invitation invalide</h1>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={() => navigate('/login')}>
                        Retour à la connexion
                    </Button>
                </div>
            </div>
        );
    }

    // Email Mismatch - Different user logged in
    if (state === 'email_mismatch') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Compte différent</h1>
                    <p className="text-slate-500 mb-4">
                        Vous êtes connecté en tant que <strong className="text-slate-700">{user?.email}</strong>.
                    </p>
                    <p className="text-slate-500 mb-6">
                        Cette invitation est destinée à <strong className="text-emerald-600">{invitation?.email}</strong>.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={handleLogout} className="w-full">
                            <LogOut className="w-4 h-4 mr-2" />
                            Se déconnecter pour continuer
                        </Button>
                        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                            Revenir au tableau de bord
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Already member
    if (state === 'already_member') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Déjà membre !</h1>
                    <p className="text-slate-500 mb-6">
                        Vous faites déjà partie de <strong>{invitation?.farmName}</strong>.
                    </p>
                    <Button onClick={() => navigate('/')}>
                        Aller au tableau de bord
                    </Button>
                </div>
            </div>
        );
    }

    // Has own farm (multi-farm conflict)
    if (state === 'has_own_farm') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Vous avez déjà une bergerie</h1>
                    <p className="text-slate-500 mb-4">
                        Vous êtes propriétaire de <strong className="text-slate-700">{existingFarmName}</strong>.
                    </p>
                    <p className="text-slate-500 mb-6">
                        Pour rejoindre <strong className="text-emerald-600">{invitation?.farmName}</strong>,
                        vous devez d'abord transférer ou supprimer votre bergerie actuelle.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate('/profile')} className="w-full">
                            Gérer ma bergerie
                        </Button>
                        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                            Annuler
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Success
    if (state === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Bienvenue !</h1>
                    <p className="text-slate-500 mb-4">
                        Vous avez rejoint <strong>{invitation?.farmName}</strong> avec succès.
                    </p>
                    <p className="text-sm text-slate-400">Redirection en cours...</p>
                </div>
            </div>
        );
    }

    // Not logged in - show options
    if (state === 'not_logged_in') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invitation reçue !</h1>
                    <p className="text-slate-500 mb-6">
                        <strong>{invitation?.inviterName}</strong> vous invite à rejoindre
                        <strong> {invitation?.farmName}</strong> en tant que
                        <strong> {invitation?.role === 'manager' ? 'Manager' : 'Employé'}</strong>.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate(`/register?token=${token}`)} className="w-full">
                            Créer un compte
                        </Button>
                        <Button onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/join?token=${token}`)}`)} variant="outline" className="w-full">
                            J'ai déjà un compte
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Ready to accept (and handling 'accepting' state)
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Rejoindre {invitation?.farmName}</h1>
                    <p className="text-slate-500">
                        <strong>{invitation?.inviterName}</strong> vous invite à rejoindre cette bergerie.
                    </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500">Rôle attribué</span>
                        <span className="font-semibold text-slate-900">
                            {invitation?.role === 'manager' ? 'Manager' : 'Employé'}
                        </span>
                    </div>
                    {invitation?.role === 'manager' && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Accès finances</span>
                            <span className={`font-semibold ${invitation?.canAccessFinances ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {invitation?.canAccessFinances ? 'Oui' : 'Non'}
                            </span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <Button onClick={handleAccept} disabled={state === 'accepting'} className="w-full">
                        {state === 'accepting' ? 'Acceptation en cours...' : 'Accepter l\'invitation'}
                    </Button>
                    <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                        Annuler
                    </Button>
                </div>
            </div>
        </div>
    );
};
