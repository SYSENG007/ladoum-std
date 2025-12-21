# 🏗️ Architecture Multi-Utilisateurs - Refonte Fermes

**Date:** 2025-12-21  
**Objectif:** Refonte complète pour supporter plusieurs utilisateurs par ferme avec permissions granulaires

---

## 🎯 Vision Architecturale

### Principe Central
**UNE ferme = PLUSIEURS utilisateurs avec des rôles différents**

- **1 Propriétaire (Owner)** - Créateur de la ferme, droits admin complets
- **N Managers** - Peuvent gérer certains aspects selon permissions
- **N Employés (Workers)** - Accès limité selon permissions

---

## 📊 Structure de Données

### 1. Collection `users` (Inchangée)
```typescript
{
  id: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  phone?: string;
  farmId: string;          // Ferme principale (peut avoir accès à plusieurs)
  role: 'owner' | 'manager' | 'worker';  // Role dans la ferme principale
  onboardingCompleted: boolean;
  createdAt: string;
}
```

### 2. Collection `farms` (Simplifiée)
```typescript
{
  id: string;
  name: string;
  location?: string;
  ownerId: string;         // UID du propriétaire
  memberIds: string[];     // ARRAY des UIDs de TOUS les membres (owner inclus)
  settings: FarmSettings;
  createdAt: string;
  updatedAt: string;
}
```

**IMPORTANT:** On supprime `members: FarmMember[]` du document farm principal car :
- Limite de taille document Firestore (1MB)
- Problèmes de permissions d'écriture
- Difficile à synchroniser

### 3. Nouvelle Sous-Collection `farms/{farmId}/members`
```typescript
{
  id: string;              // = userId
  userId: string;          // Firebase Auth UID
  displayName: string;
  email: string;
  role: 'owner' | 'manager' | 'worker';
  
  // Permissions granulaires
  permissions: {
    canAccessFinances: boolean;
    canManageAnimals: boolean;
    canManageTasks: boolean;
    canManageInventory: boolean;
    canManageStaff: boolean;  // Inviter/retirer des membres
    canViewReports: boolean;
  };
  
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  invitedBy?: string;      // UID de celui qui a invité
}
```

**Avantages:**
- ✅ Pas de limite de taille
- ✅ Permissions Firestore plus simples
- ✅ Chaque membre = 1 document = queries efficaces
- ✅ Synchronisation automatique avec `memberIds`

---

## 🔒 Règles Firestore (Nouvelles)

### farms/{farmId}
```javascript
match /farms/{farmId} {
  // Lire si membre de la ferme
  allow read: if isAuthenticated() && 
                 request.auth.uid in resource.data.memberIds;
  
  // Créer si authentifié (création par owner)
  allow create: if isAuthenticated();
  
  // Modifier/Supprimer si owner
  allow update, delete: if isAuthenticated() && 
                           resource.data.ownerId == request.auth.uid;
}
```

### farms/{farmId}/members/{userId}
```javascript
match /farms/{farmId}/members/{userId} {
  // Lire si membre de cette ferme
  allow read: if isAuthenticated() && 
                 request.auth.uid in get(/databases/$(database)/documents/farms/$(farmId)).data.memberIds;
  
  // Créer/Modifier si:
  // 1. Owner de la ferme, OU
  // 2. Staff manager avec permission, OU  
  // 3. Utilisateur lui-même (pour son propre profil)
  allow create, update: if isAuthenticated() && (
    get(/databases/$(database)/documents/farms/$(farmId)).data.ownerId == request.auth.uid ||
    (userId == request.auth.uid && request.resource.data.status == 'pending') ||
    hasStaffPermission(farmId, request.auth.uid, 'canManageStaff')
  );
  
  // Supprimer si owner
  allow delete: if isAuthenticated() && 
                   get(/databases/$(database)/documents/farms/$(farmId)).data.ownerId == request.auth.uid;
}
```

### animals, tasks, etc.
```javascript
match /animals/{animalId} {
  // Lire si membre de la ferme
  allow read: if isAuthenticated() && 
                 request.auth.uid in get(/databases/$(database)/documents/farms/$(resource.data.farmId)).data.memberIds;
  
  // Créer/Modifier si membre avec permission
  allow create, update: if isAuthenticated() && 
                           hasFarmPermission(resource.data.farmId, request.auth.uid, 'canManageAnimals');
  
  // Supprimer si owner ou manager avec permission
  allow delete: if isAuthenticated() && (
    get(/databases/$(database)/documents/farms/$(resource.data.farmId)).data.ownerId == request.auth.uid ||
    hasFarmPermission(resource.data.farmId, request.auth.uid, 'canManageAnimals')
  );
}
```

---

## 🔄 Flux d'Invitation (Nouveau)

### Étape 1: Créer Invitation
```typescript
// Owner/Manager crée une invitation
await StaffService.inviteMember({
  farmId: 'farm123',
  email: 'user@example.com',
  displayName: 'Jean Dupont',
  role: 'worker',
  permissions: {
    canAccessFinances: false,
    canManageAnimals: true,
    canManageTasks: true,
    // ... autres permissions
  }
});

// Crée document dans `invitations` collection
```

### Étape 2: Utilisateur Accepte
```typescript
// A. Nouvel utilisateur - Clique lien → Register
// Crée compte Firebase Auth
await createUserWithEmailAndPassword(auth, email, password);

// B. Utilisateur existant - Clique lien → Login  
await signInWithEmailAndPassword(auth, email, password);

// Continue dans les deux cas...
```

### Étape 3: Acceptation Automatique
```typescript
// Dans AuthContext ou Join page
const invitation = await StaffService.getByToken(token);

// 1. Créer profil user si nouveau
await UserService.create(userId, email, displayName);

// 2. Créer membre dans sous-collection farms/{farmId}/members
await setDoc(doc(db, `farms/${invitation.farmId}/members`, userId), {
  userId,
  displayName,
  email,
  role: invitation.role,
  permissions: invitation.permissions,
  status: 'active',
  joinedAt: new Date().toISOString(),
  invitedBy: invitation.invitedBy
});

// 3. Ajouter userId dans farm.memberIds (atomic)
await updateDoc(doc(db, 'farms', invitation.farmId), {
  memberIds: arrayUnion(userId)
});

// 4. Mettre à jour profil user
await UserService.setFarm(userId, invitation.farmId, invitation.role);
await UserService.completeOnboarding(userId);

// 5. Marquer invitation acceptée
await StaffService.acceptInvitation(invitation.id, userId);
```

**Résultat:**
- ✅ User dans `farms/{farmId}/members/{userId}` → Peut lire ferme
- ✅ userId dans `farm.memberIds` → Permissions Firestore OK
- ✅ User profile a `farmId` → Context charge correctement

---

## 📝 Services à Modifier

### FarmService
```typescript
// Nouvelle méthode
async addMemberToSubcollection(
  farmId: string,
  userId: string,
  memberData: FarmMemberData
): Promise<void> {
  const batch = writeBatch(db);
  
  // 1. Créer membre dans sous-collection
  const memberRef = doc(db, `farms/${farmId}/members`, userId);
  batch.set(memberRef, memberData);
  
  // 2. Ajouter userId dans farm.memberIds
  const farmRef = doc(db, 'farms', farmId);
  batch.update(farmRef, {
    memberIds: arrayUnion(userId),
    updatedAt: new Date().toISOString()
  });
  
  await batch.commit();
}

// Nouvelle méthode get members
async getMembers(farmId: string): Promise<FarmMember[]> {
  const snapshot = await getDocs(
    collection(db, `farms/${farmId}/members`)
  );
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FarmMember[];
}
```

### FarmContext
```typescript
const loadFarm = async () => {
  if (!userProfile?.farmId) return;
  
  try {
    // Charger farm
    const farm = await FarmService.getById(userProfile.farmId);
    setCurrentFarm(farm);
    
    // Charger membres depuis sous-collection
    const members = await FarmService.getMembers(userProfile.farmId);
    setFarmMembers(members);
    
  } catch (err) {
    console.error('Error loading farm:', err);
  }
};
```

---

## 🚀 Plan de Migration

### Phase 1: Préparation (Sans Breaking Changes)
- [ ] Créer nouveaux services avec sous-collection
- [ ] Ajouter `memberIds` aux farms existantes
- [ ] Tester en parallèle avec ancien système

### Phase 2: Migration Données  
- [ ] Script pour copier `farm.members` → `farms/{id}/members/*`
- [ ] Script pour peupler `farm.memberIds`
- [ ] Vérification intégrité données

### Phase 3: Mise à Jour Code
- [ ] Modifier AuthContext pour utiliser sous-collection
- [ ] Modifier FarmService
- [ ] Modifier FarmContext  
- [ ] Modifier tous les composants utilisant members

### Phase 4: Règles Firestore
- [ ] Déployer nouvelles règles
- [ ] Tester permissions
- [ ] Monitorer erreurs

### Phase 5: Cleanup
- [ ] Supprimer ancien code `farm.members`
- [ ] Supprimer anciens services
- [ ] Documentation

---

## ✅ Avantages de Cette Architecture

### Permissions
- ✅ Simples et cohérentes
- ✅ Basées sur `memberIds` array
- ✅ Granulaires par ressource

### Performance
- ✅ Pas de limite taille document
- ✅ Queries efficaces sur membres
- ✅ Indexation automatique

### Scalabilité
- ✅ Support illimité de membres
- ✅ Permissions évolutives
- ✅ Facile à étendre

### Maintenabilité
- ✅ Structure claire
- ✅ Séparation farm / members
- ✅ Facile à débugger

---

## 🎯 Prochaines Étapes

1. **Validation de l'architecture** - Votre approbation
2. **Création des services** - Nouveaux FarmMemberService
3. **Migration données** - Script automatisé
4. **Tests** - Validation complète
5. **Déploiement** - Mise en production

---

**Cette architecture résout TOUS les problèmes de permissions actuels** 🎉

Qu'en pensez-vous ? Voulez-vous que je commence l'implémentation ?
