# Guide Rapide - Inviter un Employé

## Étapes pour inviter un employé

### 1. Accéder à la page Profil
- Cliquez sur votre avatar en haut à droite
- Sélectionnez "Profil"

### 2. Créer une invitation
- Dans la section "Équipe", cliquez sur **"Ajouter"**
- Remplissez le formulaire :
  - **Email** : L'adresse email de votre employé
  - **Nom** (optionnel) : Le nom de l'employé
  - **Rôle** : 
    - **Manager** : Peut gérer les animaux, tâches et voir les rapports
    - **Employé** : Peut voir et mettre à jour les animaux et tâches
- Cliquez sur **"Créer l'invitation"**

### 3. Envoyer l'invitation
Après la création, vous verrez une alerte verte avec :
- Le code d'invitation (ex: `A7B3C9D2`)
- Un bouton **"Copier le lien d'inscription"**

**Option 1 : Email automatique (recommandé)**
- Votre client email s'ouvrira automatiquement
- Un brouillon d'email sera pré-rempli avec :
  - Le code d'invitation
  - Le lien d'inscription direct
- Vérifiez le message et envoyez-le

**Option 2 : Copier et envoyer manuellement**
- Cliquez sur "Copier le lien d'inscription"
- Envoyez le lien par WhatsApp, SMS ou autre moyen

### 4. L'employé s'inscrit
Votre employé recevra un email ou message avec :
1. Un code d'invitation unique
2. Un lien vers la page d'inscription

Il devra :
1. Cliquer sur le lien (ou aller sur `/register`)
2. Entrer le code d'invitation
3. Créer son compte avec nom et mot de passe

### 5. Gérer les invitations en attente
Dans la section "Invitations en attente", vous pouvez :
- 📋 **Copier le code** : Pour le partager manuellement
- 🔗 **Copier le lien** : Pour l'envoyer par message
- 📧 **Renvoyer l'email** : Si l'employé n'a pas reçu le premier

## Points importants

✅ **Le code expire après 7 jours** - Créez une nouvelle invitation si nécessaire

✅ **Un code = un seul compte** - Chaque code ne peut être utilisé qu'une fois

✅ **L'email doit correspondre** - L'employé doit utiliser l'email exact de l'invitation

✅ **Pas de limite** - Vous pouvez créer autant d'invitations que nécessaire

## Problèmes courants

### "L'email ne s'ouvre pas"
- Assurez-vous d'avoir un client email configuré (Gmail, Outlook, etc.)
- Sinon, utilisez l'option "Copier le lien" et envoyez-le manuellement

### "Le code ne fonctionne pas"
- Vérifiez que le code n'a pas expiré (7 jours)
- Vérifiez qu'il n'a pas déjà été utilisé
- Créez une nouvelle invitation si nécessaire

### "L'employé ne trouve pas l'email"
- Vérifiez les spams/courrier indésirable
- Utilisez "Renvoyer l'email" dans les invitations en attente
- Ou copiez et envoyez le lien directement

## Configuration avancée

Pour changer le mode d'authentification (réservé aux développeurs) :

Fichier : `src/config/app.ts`

```typescript
export const AppConfig = {
    // Mode actuel : invitation obligatoire
    authMode: 'invitation',
    
    // Pour autoriser l'inscription libre
    // authMode: 'open',
};
```

---

**Besoin d'aide ?** Consultez le fichier `INVITATION_SYSTEM.md` pour plus de détails techniques.
