# Système d'Invitation - Ladoum STD

## Vue d'ensemble

Le système d'invitation permet de contrôler qui peut créer un compte sur l'application. Actuellement configuré en **mode invitation uniquement**.

## Fonctionnement

### 1. Création d'une invitation

Un propriétaire de ferme peut inviter des employés depuis la page **Profil** :

1. Cliquer sur "Ajouter" dans la section Équipe
2. Entrer l'email de la personne à inviter
3. Choisir le rôle (Manager ou Employé)
4. Cliquer sur "Créer l'invitation"

**Ce qui se passe :**
- Un code d'invitation unique de 8 caractères est généré (ex: `A7B3C9D2`)
- Le code est valide pendant 7 jours
- Un email est automatiquement ouvert avec le code et le lien d'inscription
- L'invitation est enregistrée dans Firebase

### 2. Inscription avec code

La personne invitée reçoit un email contenant :
- Un code d'invitation (ex: `A7B3C9D2`)
- Un lien direct vers la page d'inscription avec le code pré-rempli

**Processus d'inscription :**

**Étape 1 : Validation du code**
- L'utilisateur entre son code d'invitation
- Le système vérifie :
  - ✅ Le code existe
  - ✅ Le code n'a pas déjà été utilisé
  - ✅ Le code n'a pas expiré

**Étape 2 : Création du compte**
- L'email est pré-rempli (celui de l'invitation)
- L'utilisateur entre son nom et mot de passe
- Possibilité de s'inscrire avec Google

### 3. Gestion des invitations

Dans la page **Profil**, section "Invitations en attente" :

**Actions disponibles :**
- 📋 **Copier le code** : Copie le code d'invitation dans le presse-papiers
- 🔗 **Copier le lien** : Copie le lien d'inscription complet
- 📧 **Renvoyer l'email** : Ouvre à nouveau le client email avec le message

## Configuration

### Changer le mode d'authentification

Fichier : `src/config/app.ts`

```typescript
export const AppConfig = {
    // Mode invitation (actuel)
    authMode: 'invitation' as 'invitation' | 'open',
    
    // Pour passer en mode ouvert (n'importe qui peut s'inscrire)
    // authMode: 'open' as 'invitation' | 'open',
};
```

### Durée de validité

Par défaut, les invitations expirent après **7 jours**.

Pour modifier :
```typescript
export const AppConfig = {
    invitationExpiryDays: 14, // 14 jours au lieu de 7
};
```

## Structure des données

### Invitation (Firestore)

Collection : `invitations`

```typescript
{
    id: string;                    // ID auto-généré
    email: string;                 // Email de la personne invitée
    code: string;                  // Code unique (8 caractères)
    invitedBy: string;            // ID de l'utilisateur qui a créé l'invitation
    farmId?: string;              // ID de la ferme (optionnel)
    role?: 'owner' | 'manager' | 'worker'; // Rôle assigné
    createdAt: string;            // Date de création (ISO)
    expiresAt: string;            // Date d'expiration (ISO)
    usedAt?: string;              // Date d'utilisation (ISO) - undefined si non utilisé
}
```

## Envoi d'emails

### Implémentation actuelle

Pour l'instant, le système **ouvre le client email par défaut** (Gmail, Outlook, etc.) avec un brouillon pré-rempli.

### Implémentation future (emails automatiques)

Pour envoyer de vrais emails automatiquement :

1. **Configurer Firebase Cloud Functions**
2. **Choisir un service d'email** :
   - SendGrid
   - Mailgun
   - Resend
   - AWS SES

3. **Créer une Cloud Function** :

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(functions.config().sendgrid.key);

export const sendInvitationEmail = functions.https.onCall(async (data) => {
    const { email, code, inviterName, farmName } = data;
    
    const msg = {
        to: email,
        from: 'noreply@ladoum-std.com',
        subject: 'Invitation à rejoindre Ladoum STD',
        html: `
            <h1>Vous êtes invité !</h1>
            <p>${inviterName} vous invite à rejoindre ${farmName}.</p>
            <p>Votre code : <strong>${code}</strong></p>
            <a href="https://app.ladoum-std.com/register?code=${code}">
                Créer mon compte
            </a>
        `
    };
    
    await sendgrid.send(msg);
});
```

4. **Mettre à jour EmailService** :

```typescript
// src/services/EmailService.ts
async sendInvitationEmail(email, code, inviterName, farmName) {
    const sendEmail = httpsCallable(functions, 'sendInvitationEmail');
    await sendEmail({ email, code, inviterName, farmName });
}
```

## Sécurité

### Règles Firestore

```javascript
// firestore.rules
match /invitations/{invitationId} {
    // Lecture : seulement par le créateur
    allow read: if request.auth != null && 
                   resource.data.invitedBy == request.auth.uid;
    
    // Création : utilisateurs authentifiés uniquement
    allow create: if request.auth != null;
    
    // Mise à jour : seulement pour marquer comme utilisé
    allow update: if request.auth != null && 
                     request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['usedAt']);
    
    // Suppression : seulement par le créateur
    allow delete: if request.auth != null && 
                     resource.data.invitedBy == request.auth.uid;
}
```

## FAQ

### Que se passe-t-il si le code expire ?

L'utilisateur ne pourra pas s'inscrire avec ce code. Le propriétaire devra créer une nouvelle invitation.

### Peut-on réutiliser un code ?

Non, chaque code ne peut être utilisé qu'une seule fois.

### Combien d'invitations peut-on créer ?

Il n'y a pas de limite. Vous pouvez créer autant d'invitations que nécessaire.

### Comment supprimer une invitation ?

Pour l'instant, les invitations ne peuvent pas être supprimées manuellement. Elles expirent automatiquement après 7 jours.

### Que faire si l'email ne s'envoie pas ?

Actuellement, le système ouvre votre client email. Assurez-vous d'avoir un client email configuré (Gmail, Outlook, etc.). Sinon, copiez le lien d'inscription et envoyez-le manuellement.

## Roadmap

- [ ] Envoi automatique d'emails via Cloud Functions
- [ ] Templates d'emails personnalisables
- [ ] Suppression manuelle d'invitations
- [ ] Statistiques d'utilisation des invitations
- [ ] Invitations par SMS
- [ ] Invitations multi-fermes
