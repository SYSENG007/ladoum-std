/**
 * Configuration de l'application
 */

export const AppConfig = {
    /**
     * Mode d'authentification
     * - 'invitation': Les utilisateurs doivent avoir un code d'invitation pour s'inscrire
     * - 'open': N'importe qui peut créer un compte sans invitation
     */
    authMode: 'invitation' as 'invitation' | 'open',

    /**
     * Durée de validité des invitations (en jours)
     */
    invitationExpiryDays: 7,

    /**
     * Nom de l'application
     */
    appName: 'Ladoum STD',

    /**
     * Version de l'application
     */
    version: '1.0.0',
};

/**
 * Vérifie si le mode invitation est activé
 */
export const isInvitationModeEnabled = () => {
    return AppConfig.authMode === 'invitation';
};

/**
 * Vérifie si le mode ouvert est activé
 */
export const isOpenModeEnabled = () => {
    return AppConfig.authMode === 'open';
};
