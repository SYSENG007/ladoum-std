"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInvitationEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const resend_1 = require("resend");
// Initialize Resend with API key from environment
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
/**
 * Cloud Function to send invitation emails via Resend
 */
exports.sendInvitationEmail = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'L\'utilisateur doit être authentifié pour envoyer des invitations.');
    }
    const { email, code, inviterName, farmName } = data;
    // Validate input
    if (!email || !code || !inviterName) {
        throw new functions.https.HttpsError('invalid-argument', 'Email, code et nom de l\'inviteur sont requis.');
    }
    try {
        // Generate invitation link
        const baseUrl = process.env.APP_URL || 'https://ladoum-std.web.app';
        const invitationLink = `${baseUrl}/register?code=${code}`;
        // Send email via Resend
        const { data: emailData, error } = await resend.emails.send({
            from: 'Ladoum STD <onboarding@ladoum-std.com>', // TODO: Replace with your verified domain
            to: [email],
            subject: 'Invitation à rejoindre Ladoum STD',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation Ladoum STD</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                🐑 Ladoum STD
                            </h1>
                            <p style="margin: 10px 0 0; color: #d1fae5; font-size: 14px;">
                                Gestion intelligente d'élevage
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Vous êtes invité !
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Bonjour,
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                <strong>${inviterName}</strong> vous invite à rejoindre ${farmName ? `la ferme <strong>"${farmName}"</strong>` : 'son élevage'} sur Ladoum STD.
                            </p>

                            <!-- Code Box -->
                            <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                                <p style="margin: 0 0 10px; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Votre code d'invitation
                                </p>
                                <p style="margin: 0; color: #047857; font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 4px;">
                                    ${code}
                                </p>
                            </div>

                            <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Pour créer votre compte, cliquez sur le bouton ci-dessous :
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${invitationLink}" style="display: inline-block; padding: 16px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                    Créer mon compte
                                </a>
                            </div>

                            <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Ou copiez ce lien dans votre navigateur :<br>
                                <a href="${invitationLink}" style="color: #10b981; word-break: break-all;">
                                    ${invitationLink}
                                </a>
                            </p>

                            <!-- Warning -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    ⚠️ <strong>Important :</strong> Ce code est valable pendant 7 jours.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                                Cordialement,<br>
                                L'équipe Ladoum STD
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Ladoum STD. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        });
        if (error) {
            console.error('Resend error:', error);
            throw new functions.https.HttpsError('internal', `Erreur lors de l'envoi de l'email: ${error.message}`);
        }
        console.log('Email sent successfully:', emailData);
        return {
            success: true,
            messageId: emailData === null || emailData === void 0 ? void 0 : emailData.id,
            message: 'Email d\'invitation envoyé avec succès'
        };
    }
    catch (error) {
        console.error('Error sending invitation email:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erreur lors de l\'envoi de l\'email');
    }
});
//# sourceMappingURL=index.js.map