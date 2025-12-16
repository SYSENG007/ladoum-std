import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StaffService } from '../services/StaffService';
import { FarmService } from '../services/FarmService';
import { useAuth } from '../context/AuthContext';
import type { StaffInvitation } from '../types/staff';

export const Join: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, userProfile } = useAuth();

    const token = searchParams.get('token');

    const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isAlreadyMember, setIsAlreadyMember] = useState(false);

    useEffect(() => {
        loadInvitation();
    }, [token]);

    const loadInvitation = async () => {
        if (!token) {
            setError('Lien d\'invitation invalide');
            setLoading(false);
            return;
        }

        try {
            const inv = await StaffService.getByToken(token);
            if (!inv) {
                setError('Cette invitation a expiré ou n\'existe plus');
            } else {
                setInvitation(inv);

                // Check if user is already a member of this farm
                if (user) {
                    const farm = await FarmService.getById(inv.farmId);
                    if (farm?.members.some(m => m.userId === user.uid)) {
                        setIsAlreadyMember(true);
                    }
                }
            }
        } catch (err) {
            setError('Erreur lors du chargement de l\'invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!invitation || !user || !userProfile) return;

        setAccepting(true);
        setError(null);

        try {
            // Add user to farm
            await FarmService.addMember(invitation.farmId, {
                userId: user.uid,
                displayName: userProfile.displayName || invitation.displayName,
                email: invitation.email,
                role: invitation.role,
                canAccessFinances: invitation.canAccessFinances,
                status: 'active',
                joinedAt: new Date().toISOString()
            });

            // Mark invitation as accepted
            await StaffService.acceptInvitation(invitation.id, user.uid);

            setSuccess(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            console.error('Error accepting invitation:', err);
            // Check if it's "already member" error
            if (err.message?.includes('already a member')) {
                setIsAlreadyMember(true);
                setError(null);
            } else {
                setError(err.message || 'Erreur lors de l\'acceptation de l\'invitation');
            }
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Chargement de l'invitation...</p>
                </div>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
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

    if (isAlreadyMember) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
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

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
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

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invitation reçue !</h1>
                    <p className="text-slate-500 mb-6">
                        <strong>{invitation?.inviterName}</strong> vous invite à rejoindre
                        <strong> {invitation?.farmName}</strong> en tant que
                        <strong> {invitation?.role === 'manager' ? 'Manager' : 'Employé'}</strong>.
                    </p>
                    <p className="text-sm text-slate-400 mb-6">
                        Connectez-vous ou créez un compte pour accepter l'invitation.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/join?token=${token}`)}`)} className="w-full">
                            Se connecter
                        </Button>
                        <Button onClick={() => navigate(`/register?redirect=${encodeURIComponent(`/join?token=${token}`)}`)} variant="outline" className="w-full">
                            Créer un compte
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
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
                    <Button onClick={handleAccept} disabled={accepting} className="w-full">
                        {accepting ? 'Acceptation en cours...' : 'Accepter l\'invitation'}
                    </Button>
                    <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                        Annuler
                    </Button>
                </div>
            </div>
        </div>
    );
};
