import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Service d'envoi d'emails d'invitation via Firebase Cloud Functions + Resend
 */
export const EmailService = {
    /**
     * Génère un lien d'invitation
     */
    generateInvitationLink(code: string): string {
        const baseUrl = window.location.origin;
        return `${baseUrl}/register?code=${code}`;
    },

    /**
     * Copie le lien d'invitation dans le presse-papiers
     */
    async copyInvitationLink(code: string): Promise<void> {
        const link = this.generateInvitationLink(code);
        await navigator.clipboard.writeText(link);
    },

    /**
     * Envoie un email d'invitation via Cloud Function + Resend
     */
    async sendInvitationEmail(
        email: string,
        code: string,
        inviterName: string,
        farmName?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const sendEmail = httpsCallable(functions, 'sendInvitationEmail');

            const result = await sendEmail({
                email,
                code,
                inviterName,
                farmName
            });

            const data = result.data as { success: boolean; message?: string };

            if (data.success) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: data.message || 'Erreur lors de l\'envoi de l\'email'
                };
            }
        } catch (error: any) {
            console.error('Error sending invitation email:', error);
            return {
                success: false,
                error: error.message || 'Erreur lors de l\'envoi de l\'email'
            };
        }
    }
};
