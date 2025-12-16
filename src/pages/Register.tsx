import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StaffService } from '../services/StaffService';
import { FarmService } from '../services/FarmService';
import { UserService } from '../services/UserService';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, CheckCircle, Users, Building2 } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { auth } from '../lib/firebase';
import type { StaffInvitation } from '../types/staff';

type RegistrationMode = 'choice' | 'owner' | 'staff';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { signUpWithEmail, signInWithGoogle, loading, error, clearError, refreshUserProfile } = useAuth();

    // Check if coming from an invitation - token can be direct (?token=xxx) or in redirect param
    const tokenDirect = searchParams.get('token');
    const redirectParam = searchParams.get('redirect');
    const tokenFromRedirect = redirectParam?.includes('token=')
        ? new URLSearchParams(redirectParam.split('?')[1]).get('token')
        : null;
    const invitationToken = tokenDirect || tokenFromRedirect;

    const [mode, setMode] = useState<RegistrationMode>(invitationToken ? 'staff' : 'choice');
    const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
    const [loadingInvitation, setLoadingInvitation] = useState(!!invitationToken);
    const [searchingByEmail, setSearchingByEmail] = useState(false);
    const [lookupEmail, setLookupEmail] = useState('');
    const [lookupToken, setLookupToken] = useState('');

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Load invitation if token provided
    useEffect(() => {
        if (invitationToken) {
            loadInvitation(invitationToken);
        }
    }, [invitationToken]);

    const loadInvitation = async (token: string) => {
        setLoadingInvitation(true);
        try {
            const inv = await StaffService.getByToken(token);
            if (inv) {
                setInvitation(inv);
                setEmail(inv.email);
                setDisplayName(inv.displayName);
                setMode('staff');
            } else {
                setLocalError('Cette invitation a expiré ou n\'existe plus');
                setMode('choice');
            }
        } catch (err) {
            setLocalError('Erreur lors du chargement de l\'invitation');
            setMode('choice');
        } finally {
            setLoadingInvitation(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();

        // Validations
        if (!displayName || !email || !password || !confirmPassword) {
            setLocalError('Veuillez remplir tous les champs');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            setLocalError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        try {
            // Create account (no invitation code needed for new system)
            await signUpWithEmail(email, password, displayName, '');

            if (mode === 'staff' && invitation) {
                // Staff flow: join existing farm, skip onboarding
                const userId = auth.currentUser?.uid;

                if (userId) {
                    // Add user to farm
                    await FarmService.addMember(invitation.farmId, {
                        userId,
                        displayName,
                        email: invitation.email,
                        role: invitation.role,
                        canAccessFinances: invitation.canAccessFinances,
                        status: 'active',
                        joinedAt: new Date().toISOString()
                    });

                    // Mark invitation as accepted
                    await StaffService.acceptInvitation(invitation.id, userId);

                    // Set user's farm and mark onboarding complete (staff doesn't need onboarding)
                    await UserService.setFarm(userId, invitation.farmId, invitation.role);
                    await UserService.completeOnboarding(userId);

                    // Refresh profile and go to dashboard
                    await refreshUserProfile();
                    navigate('/');
                }
            } else {
                // Owner flow: go to onboarding to create farm
                navigate('/onboarding');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
        }
    };

    const handleGoogleRegister = async () => {
        setLocalError(null);
        clearError();

        try {
            await signInWithGoogle();

            if (mode === 'staff' && invitation) {
                // Staff flow: join existing farm
                const userId = auth.currentUser?.uid;
                const userEmail = auth.currentUser?.email;
                const userName = auth.currentUser?.displayName;

                if (userId) {
                    await FarmService.addMember(invitation.farmId, {
                        userId,
                        displayName: userName || invitation.displayName,
                        email: userEmail || invitation.email,
                        role: invitation.role,
                        canAccessFinances: invitation.canAccessFinances,
                        status: 'active',
                        joinedAt: new Date().toISOString()
                    });

                    await StaffService.acceptInvitation(invitation.id, userId);
                    await UserService.setFarm(userId, invitation.farmId, invitation.role);
                    await UserService.completeOnboarding(userId);
                    await refreshUserProfile();
                    navigate('/');
                }
            } else {
                navigate('/onboarding');
            }
        } catch (err: any) {
            console.error('Google registration error:', err);
        }
    };

    const displayError = localError || error;

    if (loadingInvitation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Chargement de l'invitation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 overflow-hidden">
                        <img src={logo} alt="Ladoum STD" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
                    <p className="text-slate-500 mt-1">
                        {mode === 'choice' && 'Choisissez votre type de compte'}
                        {mode === 'owner' && 'Créez votre bergerie'}
                        {mode === 'staff' && invitation && `Rejoindre ${invitation.farmName}`}
                    </p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                    {/* Error Message */}
                    {displayError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{displayError}</p>
                        </div>
                    )}

                    {/* Mode Choice */}
                    {mode === 'choice' && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('owner')}
                                className="w-full p-5 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                        <Building2 className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Je crée ma bergerie</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Vous êtes propriétaire et souhaitez gérer votre propre élevage
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMode('staff')}
                                className="w-full p-5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">J'ai reçu une invitation</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Un propriétaire m'a invité à rejoindre sa bergerie
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <p className="text-center text-sm text-slate-400 mt-4">
                                Si vous avez reçu un lien d'invitation, cliquez dessus directement
                            </p>
                        </div>
                    )}

                    {/* Staff Mode: No invitation yet - Email + Token lookup form */}
                    {mode === 'staff' && !invitation && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Mail className="w-7 h-7 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700">Vérifier mon invitation</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Entrez votre email et le code reçu dans le message
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={lookupEmail}
                                        onChange={(e) => setLookupEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="votre@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Code d'invitation</label>
                                <input
                                    type="text"
                                    value={lookupToken}
                                    onChange={(e) => setLookupToken(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider"
                                    placeholder="Code reçu dans le message"
                                />
                                <p className="text-xs text-slate-400 mt-1">Le code se trouve dans le lien d'invitation</p>
                            </div>

                            <Button
                                onClick={async () => {
                                    if (!lookupEmail || !lookupToken) {
                                        setLocalError('Veuillez remplir tous les champs');
                                        return;
                                    }
                                    setSearchingByEmail(true);
                                    setLocalError(null);
                                    try {
                                        // Verify token directly (most secure)
                                        const inv = await StaffService.getByToken(lookupToken);
                                        if (inv && inv.email.toLowerCase() === lookupEmail.toLowerCase()) {
                                            setInvitation(inv);
                                            setEmail(inv.email);
                                            setDisplayName(inv.displayName);
                                        } else if (inv) {
                                            setLocalError('L\'email ne correspond pas \u00e0 cette invitation');
                                        } else {
                                            setLocalError('Code d\'invitation invalide ou expiré');
                                        }
                                    } catch (err) {
                                        setLocalError('Erreur lors de la vérification');
                                    } finally {
                                        setSearchingByEmail(false);
                                    }
                                }}
                                className="w-full"
                                disabled={searchingByEmail || !lookupEmail || !lookupToken}
                            >
                                {searchingByEmail ? 'Vérification...' : 'Vérifier mon invitation'}
                            </Button>

                            <div className="text-center">
                                <button
                                    onClick={() => setMode('choice')}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                >
                                    ← Retour au choix
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Staff Mode: Has invitation */}
                    {mode === 'staff' && invitation && (
                        <>
                            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div className="flex items-center gap-2 text-emerald-800">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Invitation valide</span>
                                </div>
                                <p className="text-sm text-emerald-700 mt-1">
                                    Rejoindre <strong>{invitation.farmName}</strong> en tant que <strong>{invitation.role === 'manager' ? 'Manager' : 'Employé'}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Votre nom"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Min. 6 caractères"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Confirmez"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full py-3" disabled={loading}>
                                    {loading ? 'Création...' : 'Créer mon compte'}
                                </Button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-500">ou</span></div>
                            </div>

                            <button
                                onClick={handleGoogleRegister}
                                disabled={loading}
                                className="w-full py-3 px-4 border border-slate-200 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-slate-700 font-medium">Continuer avec Google</span>
                            </button>
                        </>
                    )}

                    {/* Owner Mode */}
                    {mode === 'owner' && (
                        <>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Votre nom"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="votre@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Min. 6 caractères"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Confirmez"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full py-3" disabled={loading}>
                                    {loading ? 'Création...' : 'Créer mon compte'}
                                </Button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-500">ou</span></div>
                            </div>

                            <button
                                onClick={handleGoogleRegister}
                                disabled={loading}
                                className="w-full py-3 px-4 border border-slate-200 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-slate-700 font-medium">Continuer avec Google</span>
                            </button>

                            <button
                                onClick={() => setMode('choice')}
                                className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700"
                            >
                                ← Retour au choix
                            </button>
                        </>
                    )}

                    {/* Login Link */}
                    {mode !== 'choice' && (
                        <p className="text-center text-sm text-slate-500 mt-6">
                            Vous avez déjà un compte ?{' '}
                            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Se connecter
                            </Link>
                        </p>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    © 2024 Ladoum STD. Tous droits réservés.
                </p>
            </div>
        </div>
    );
};
