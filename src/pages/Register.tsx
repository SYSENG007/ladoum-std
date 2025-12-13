import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InvitationService } from '../services/InvitationService';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Key, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.jpg';
import type { Invitation } from '../types/auth';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { signUpWithEmail, signInWithGoogle, loading, error, clearError } = useAuth();

    const [step, setStep] = useState<'code' | 'details'>('code');
    const [invitationCode, setInvitationCode] = useState(searchParams.get('code') || '');
    const [validatedInvitation, setValidatedInvitation] = useState<Invitation | null>(null);

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [validatingCode, setValidatingCode] = useState(false);

    // Auto-validate code from URL
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl) {
            validateInvitationCode(codeFromUrl);
        }
    }, [searchParams]);

    const validateInvitationCode = async (code: string) => {
        if (!code || code.length < 6) {
            setLocalError('Veuillez entrer un code d\'invitation valide');
            return;
        }

        setValidatingCode(true);
        setLocalError(null);

        try {
            const result = await InvitationService.validateCode(code);

            if (result.valid && result.invitation) {
                setValidatedInvitation(result.invitation);
                setEmail(result.invitation.email);
                setStep('details');
            } else {
                setLocalError(result.error || 'Code d\'invitation invalide');
            }
        } catch (err) {
            setLocalError('Erreur lors de la validation du code');
        } finally {
            setValidatingCode(false);
        }
    };

    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        validateInvitationCode(invitationCode);
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

        if (!validatedInvitation) {
            setLocalError('Code d\'invitation manquant');
            return;
        }

        try {
            // Inscription avec code d'invitation
            await signUpWithEmail(email, password, displayName, validatedInvitation.code);

            // Marquer l'invitation comme utilisée
            await InvitationService.markAsUsed(validatedInvitation.id);

            navigate('/onboarding');
        } catch (err: any) {
            // L'erreur est gérée dans le context
        }
    };

    const handleGoogleRegister = async () => {
        if (!validatedInvitation) {
            setLocalError('Veuillez d\'abord valider votre code d\'invitation');
            return;
        }

        setLocalError(null);
        clearError();

        try {
            await signInWithGoogle();

            // Marquer l'invitation comme utilisée
            await InvitationService.markAsUsed(validatedInvitation.id);

            navigate('/onboarding');
        } catch (err: any) {
            // L'erreur est gérée dans le context
        }
    };

    const displayError = localError || error;

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
                        {step === 'code' ? 'Entrez votre code d\'invitation' : 'Complétez votre profil'}
                    </p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className={`flex items-center gap-2 ${step === 'code' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'code' ? 'bg-emerald-100' : validatedInvitation ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                                {validatedInvitation ? <CheckCircle className="w-5 h-5" /> : '1'}
                            </div>
                            <span className="text-sm font-medium">Code</span>
                        </div>
                        <div className="w-8 h-0.5 bg-slate-200"></div>
                        <div className={`flex items-center gap-2 ${step === 'details' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                2
                            </div>
                            <span className="text-sm font-medium">Détails</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {displayError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{displayError}</p>
                        </div>
                    )}

                    {/* Step 1: Invitation Code */}
                    {step === 'code' && (
                        <form onSubmit={handleCodeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Code d'invitation
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={invitationCode}
                                        onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all uppercase tracking-wider font-mono"
                                        placeholder="XXXXXXXX"
                                        maxLength={8}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Vous devez avoir reçu ce code par email
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-3"
                                disabled={validatingCode || invitationCode.length < 6}
                            >
                                {validatingCode ? 'Validation...' : 'Valider le code'}
                            </Button>
                        </form>
                    )}

                    {/* Step 2: Registration Details */}
                    {step === 'details' && (
                        <>
                            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-emerald-800 font-medium">Code validé !</p>
                                    <p className="text-emerald-700">Email: {validatedInvitation?.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nom complet
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder="Votre nom"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Email associé à votre invitation
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder="Min. 6 caractères"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Confirmer le mot de passe
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder="Confirmez votre mot de passe"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full py-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Création...' : 'Créer mon compte'}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-slate-500">ou</span>
                                </div>
                            </div>

                            {/* Google Register */}
                            <button
                                onClick={handleGoogleRegister}
                                disabled={loading}
                                className="w-full py-3 px-4 border border-slate-200 rounded-lg flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <span className="text-slate-700 font-medium">Continuer avec Google</span>
                            </button>
                        </>
                    )}

                    {/* Login Link */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Vous avez déjà un compte ?{' '}
                        <Link
                            to="/login"
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            Se connecter
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    © 2024 Ladoum STD. Tous droits réservés.
                </p>
            </div>
        </div>
    );
};
