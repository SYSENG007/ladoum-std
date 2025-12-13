# Configuration de l'envoi d'emails automatique avec Resend

## Étape 1: Créer un compte Resend (GRATUIT)

1. Allez sur [resend.com](https://resend.com)
2. Cliquez sur "Sign Up" (Inscription)
3. Créez votre compte (gratuit, 100 emails/jour)

## Étape 2: Obtenir votre clé API

1. Une fois connecté, allez dans **API Keys**
2. Cliquez sur **"Create API Key"**
3. Donnez un nom (ex: "Ladoum STD Production")
4. Sélectionnez les permissions: **"Sending access"**
5. Cliquez sur **"Add"**
6. **COPIEZ LA CLÉ** (elle commence par `re_...`)
   - ⚠️ Vous ne pourrez plus la voir après!

## Étape 3: Configurer Firebase Cloud Functions

### 3.1 Installer Firebase CLI (si pas déjà fait)

```bash
npm install -g firebase-tools
```

### 3.2 Se connecter à Firebase

```bash
firebase login
```

### 3.3 Configurer les variables d'environnement

```bash
# Dans le dossier functions/
cd functions

# Créer le fichier .env.local
cp .env.example .env.local

# Éditer .env.local et remplacer:
# RESEND_API_KEY=your_resend_api_key_here
# par votre vraie clé API
```

### 3.4 Déployer la Cloud Function

```bash
# Depuis la racine du projet
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## Étape 4: Vérifier le domaine d'envoi (Optionnel mais recommandé)

Par défaut, les emails seront envoyés depuis `onboarding@resend.dev`.

Pour utiliser votre propre domaine (ex: `noreply@ladoum-std.com`):

1. Dans Resend, allez dans **Domains**
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine (ex: `ladoum-std.com`)
4. Suivez les instructions pour ajouter les enregistrements DNS
5. Une fois vérifié, mettez à jour `functions/src/index.ts`:

```typescript
from: 'Ladoum STD <noreply@votre-domaine.com>',
```

## Étape 5: Tester l'envoi d'emails

1. Allez dans votre app
2. Créez une invitation
3. Vérifiez que l'email est bien reçu

### En cas de problème:

**Vérifier les logs Firebase:**
```bash
firebase functions:log
```

**Tester localement:**
```bash
cd functions
npm run serve
```

## Configuration pour la production

### Variables d'environnement Firebase

Pour la production, configurez les variables via Firebase:

```bash
firebase functions:config:set resend.api_key="votre_cle_api"
firebase functions:config:set app.url="https://votre-app.web.app"
```

Puis mettez à jour `functions/src/index.ts`:

```typescript
const resend = new Resend(functions.config().resend.api_key);
const baseUrl = functions.config().app.url;
```

## Coûts

### Resend - Plan Gratuit
- ✅ **100 emails/jour** (3000/mois)
- ✅ Gratuit à vie
- ✅ Pas de carte bancaire requise

### Firebase Cloud Functions
- ✅ **2 millions d'appels/mois gratuits**
- ✅ Largement suffisant pour vos besoins
- Coût après: ~0.40$/million d'appels

**Total estimé pour 100 invitations/mois: 0€**

## Dépannage

### "Error: unauthenticated"
→ L'utilisateur doit être connecté pour envoyer des invitations

### "Error: invalid-argument"
→ Vérifiez que tous les champs (email, code, nom) sont remplis

### "Resend error: Invalid API key"
→ Vérifiez que votre clé API est correcte dans `.env.local`

### "Email not received"
→ Vérifiez les spams
→ Vérifiez les logs Firebase: `firebase functions:log`

## Support

- Documentation Resend: https://resend.com/docs
- Documentation Firebase Functions: https://firebase.google.com/docs/functions
