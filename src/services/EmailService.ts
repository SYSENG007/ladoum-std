/**
 * Service d'envoi d'emails d'invitation
 * 
 * Note: Pour l'instant, ce service génère un lien d'invitation.
 * Pour envoyer de vrais emails, vous devrez:
 * 1. Configurer Firebase Cloud Functions
 * 2. Utiliser un service comme SendGrid, Mailgun, ou Resend
 * 3. Créer un template d'email HTML
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
     * Génère le contenu de l'email d'invitation
     */
    generateInvitationEmailContent(code: string, inviterName: string, farmName?: string): string {
        const link = this.generateInvitationLink(code);

        return `
Bonjour,

${inviterName} vous invite à rejoindre ${farmName ? `la ferme "${farmName}"` : 'son élevage'} sur Ladoum STD.

Votre code d'invitation : ${code}

Pour créer votre compte, cliquez sur le lien ci-dessous :
${link}

Ce code est valable pendant 7 jours.

Cordialement,
L'équipe Ladoum STD
        `.trim();
    },

    /**
     * Ouvre le client email avec un brouillon pré-rempli
     */
    openEmailClient(email: string, code: string, inviterName: string, farmName?: string): void {
        const subject = encodeURIComponent('Invitation à rejoindre Ladoum STD');
        const body = encodeURIComponent(this.generateInvitationEmailContent(code, inviterName, farmName));

        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    },

    /**
     * TODO: Envoyer un vrai email via Cloud Function
     * 
     * Cette fonction devra être implémentée côté serveur (Firebase Cloud Functions)
     * pour envoyer de vrais emails via un service tiers.
     */
    async sendInvitationEmail(
        email: string,
        code: string,
        inviterName: string,
        farmName?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // TODO: Appeler une Cloud Function qui envoie l'email
            // const response = await fetch('https://your-cloud-function-url/sendInvitation', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email, code, inviterName, farmName })
            // });

            // Pour l'instant, on ouvre juste le client email
            this.openEmailClient(email, code, inviterName, farmName);

            return { success: true };
        } catch (error) {
            console.error('Error sending invitation email:', error);
            return {
                success: false,
                error: 'Erreur lors de l\'envoi de l\'email'
            };
        }
    }
};
