import React, { useState } from 'react';
import { X, Mail, User, Crown, Wrench, DollarSign, Link, Copy, Check, MessageCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Button } from '../ui/Button';
import { StaffService } from '../../services/StaffService';
import { RateLimitService } from '../../services/RateLimitService';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import type { StaffInvitation } from '../../types/staff';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { currentFarm } = useFarm();
    const { user, userProfile } = useAuth();
    const { isMobile } = useDeviceType();

    const [formData, setFormData] = useState({
        email: '',
        displayName: '',
        role: 'worker' as 'manager' | 'worker',
        canAccessFinances: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
    const [copied, setCopied] = useState(false);

    const getInviteLink = () => {
        if (!invitation) return '';
        return `${window.location.origin}/join?token=${invitation.token}`;
    };

    const getInviteMessage = () => {
        if (!invitation) return '';
        const roleText = invitation.role === 'manager' ? 'Manager' : 'Employé';

        return `🐑 *Invitation Ladoum STD*

Bonjour ${invitation.displayName},

${invitation.inviterName} vous invite à rejoindre *${invitation.farmName}* en tant que ${roleText}.

👉 Créer mon compte:
${getInviteLink()}

📱 Code: ${invitation.token}

✅ Valable 7 jours`;
    };

    const getSMSMessage = () => {
        if (!invitation) return '';
        // Short message for SMS (max 160 chars recommended)
        const tokenShort = invitation.token.substring(0, 8); // First 8 chars
        return `Ladoum STD - ${invitation.inviterName} vous invite. Lien: ${getInviteLink()} Code: ${tokenShort}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!currentFarm || !user || !userProfile) {
                throw new Error('Données utilisateur manquantes');
            }

            // Check rate limit
            const rateCheck = RateLimitService.canCreateInvitation(user.uid);
            if (!rateCheck.allowed) {
                const resetTime = rateCheck.resetAt?.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
                throw new Error(`Limite atteinte (10 invitations/heure). Réessayez après ${resetTime}.`);
            }

            const result = await StaffService.inviteMember({
                farmId: currentFarm.id,
                farmName: currentFarm.name,
                email: formData.email,
                displayName: formData.displayName,
                role: formData.role,
                permissions: {
                    canAccessFinances: formData.role === 'manager' ? formData.canAccessFinances : false,
                    canManageAnimals: formData.role === 'manager',
                    canManageTasks: true,
                    canManageInventory: formData.role === 'manager',
                    canManageStaff: false,
                    canViewReports: true
                },
                invitedBy: user.uid,
                inviterName: userProfile.displayName || 'Propriétaire'
            });

            // Record this invitation for rate limiting
            RateLimitService.recordInvitation(user.uid);

            setInvitation(result);
        } catch (err: any) {
            console.error('Error inviting member:', err);
            setError(err.message || 'Erreur lors de la création de l\'invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getInviteLink());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = getInviteLink();
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareEmail = () => {
        const subject = encodeURIComponent(`Invitation à rejoindre ${invitation?.farmName} sur Ladoum STD`);
        const body = encodeURIComponent(getInviteMessage());
        window.open(`mailto:${invitation?.email}?subject=${subject}&body=${body}`, '_blank');
    };

    const handleShareWhatsApp = () => {
        const text = encodeURIComponent(getInviteMessage());
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleShareSMS = () => {
        const message = getSMSMessage();
        if (isMobile) {
            // Open native SMS app on mobile
            window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
        } else {
            // On desktop, copy message to clipboard
            navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        if (invitation) {
            onSuccess();
        }
        onClose();
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            email: '',
            displayName: '',
            role: 'worker',
            canAccessFinances: false
        });
        setInvitation(null);
        setError(null);
        setCopied(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {invitation ? 'Partager l\'invitation' : 'Inviter un membre'}
                                </h2>
                                <p className="text-sm text-emerald-100">
                                    {invitation ? 'Envoyez le lien au nouveau membre' : 'Ajoutez un collaborateur à votre bergerie'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {invitation ? (
                    /* Share Options */
                    <div className="p-6 space-y-5">
                        {/* Success Message */}
                        <div className="text-center">
                            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Link className="w-7 h-7 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Invitation créée !</h3>
                            <p className="text-sm text-text-muted mt-1">
                                Pour <strong>{invitation.displayName}</strong> ({invitation.role === 'manager' ? 'Manager' : 'Employé'})
                            </p>
                        </div>

                        {/* Invite Link */}
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xs text-text-muted mb-2">Lien d'invitation</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={getInviteLink()}
                                    className="flex-1 bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 truncate"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className={`p-2 rounded-lg transition-colors ${copied
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                        }`}
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            {copied && (
                                <p className="text-xs text-emerald-600 mt-2 text-center">✓ Lien copié !</p>
                            )}
                        </div>

                        {/* Share Buttons */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-text-secondary text-center">Partager via</p>

                            <div className="grid grid-cols-2 gap-3">
                                {/* WhatsApp - Most popular, first position */}
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all bg-green-50/50"
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-xs font-medium text-green-700">WhatsApp</span>
                                </button>

                                {/* SMS - Second most popular */}
                                <button
                                    onClick={handleShareSMS}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all bg-blue-50/50"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-medium text-blue-700">{isMobile ? 'SMS' : 'Copier SMS'}</span>
                                </button>

                                {/* Copy */}
                                <button
                                    onClick={handleCopyLink}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                                >
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Copy className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">Copier lien</span>
                                </button>

                                {/* Email */}
                                <button
                                    onClick={handleShareEmail}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                                >
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">Email</span>
                                </button>
                            </div>
                        </div>

                        {/* Expiry Notice */}
                        <p className="text-xs text-center text-text-muted">
                            Ce lien expire dans 7 jours
                        </p>

                        {/* Done Button */}
                        <Button onClick={handleClose} className="w-full">
                            Terminé
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Rate Limit Info */}
                        {user && (() => {
                            const status = RateLimitService.getStatus(user.uid);
                            if (status.count > 0) {
                                const remaining = status.limit - status.count;
                                const color = remaining <= 2 ? 'amber' : 'blue';
                                return (
                                    <div className={`bg-${color}-50 border border-${color}-200 px-4 py-3 rounded-xl`}>
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
                                            <div className="text-xs text-${color}-700">
                                                <p className="font-medium">Limite : {remaining} invitation{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''} cette heure</p>
                                                {status.resetAt && (
                                                    <p className="mt-1">Réinitialisation à {status.resetAt.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="membre@email.com"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Nom complet <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                <input
                                    type="text"
                                    required
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Prénom Nom"
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-3">
                                Rôle <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'manager', canAccessFinances: false })}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${formData.role === 'manager'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <Crown className={`w-6 h-6 mb-2 ${formData.role === 'manager' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    <p className={`font-semibold ${formData.role === 'manager' ? 'text-emerald-700' : 'text-slate-700'}`}>
                                        Manager
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">Gère le staff et les tâches</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'worker', canAccessFinances: false })}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${formData.role === 'worker'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <Wrench className={`w-6 h-6 mb-2 ${formData.role === 'worker' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    <p className={`font-semibold ${formData.role === 'worker' ? 'text-emerald-700' : 'text-slate-700'}`}>
                                        Employé
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">Exécute les tâches</p>
                                </button>
                            </div>
                        </div>

                        {/* Finance Access (only for managers) */}
                        {formData.role === 'manager' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.canAccessFinances}
                                        onChange={(e) => setFormData({ ...formData, canAccessFinances: e.target.checked })}
                                        className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-amber-600" />
                                        <div>
                                            <p className="font-medium text-amber-800">Accès aux données financières</p>
                                            <p className="text-xs text-amber-600">Voir les revenus, dépenses et transactions</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleClose}
                                className="flex-1"
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={loading}
                            >
                                {loading ? 'Création...' : 'Créer l\'invitation'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
