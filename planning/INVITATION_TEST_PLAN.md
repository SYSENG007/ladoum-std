# ✅ Plan de Tests - Système d'Invitation

**Date:** 2025-12-21  
**Version:** 2.0 (Améliorée)

---

## 🎯 Objectifs des Tests

1. Vérifier tous les flux d'invitation
2. Tester le rate limiting
3. Valider les nouvelles fonctionnalités (SMS, Stats, Prolongation)
4. S'assurer de la compatibilité multi-devices
5. Confirmer l'UX optimale

---

## ✅ Tests Fonctionnels

### Groupe 1: Création d'Invitation

#### Test 1.1: Création basique (Employé)
- [ ] Se connecter en tant que propriétaire/manager
- [ ] Aller sur page Staff
- [ ] Cliquer "Inviter"
- [ ] Remplir: Email, Nom, Rôle = Employé
- [ ] Submit
- [ ] **Attendu:** Invitation créée, modal de partage affiché

#### Test 1.2: Création Manager avec accès finances
- [ ] Créer invitation Rôle = Manager
- [ ] Cocher "Accès finances"
- [ ] Submit
- [ ] **Attendu:** Invitation créée avec permissions

#### Test 1.3: Validation formulaire
- [ ] Essayer soumettre formulaire vide
- [ ] **Attendu:** Messages de validation
- [ ] Email invalide
- [ ] **Attendu:** Erreur "Email invalide"

#### Test 1.4: Rate Limiting
- [ ] Créer 9 invitations rapidement
- [ ] **Attendu:** Warning visible "1 invitation restante"
- [ ] Créer 10ème invitation
- [ ] **Attendu:** Succès
- [ ] Essayer créer 11ème
- [ ] **Attendu:** Erreur "Limite atteinte"

---

### Groupe 2: Partage d'Invitation

#### Test 2.1: Partage WhatsApp (Mobile)
- [ ] Sur téléphone, créer invitation
- [ ] Cliquer "WhatsApp"
- [ ] **Attendu:** App WhatsApp s'ouvre
- [ ] **Attendu:** Message pré-rempli avec format optimisé
- [ ] Vérifier emojis, structure, lien cliquable

#### Test 2.2: Partage SMS (Mobile)
- [ ] Sur téléphone, créer invitation
- [ ] Cliquer "SMS"
- [ ] **Attendu:** App SMS s'ouvre
- [ ] **Attendu:** Message court, lien cliquable

#### Test 2.3: Partage SMS (Desktop)
- [ ] Sur ordinateur, créer invitation
- [ ] Cliquer "Copier SMS"
- [ ] **Attendu:** Message copié dans clipboard
- [ ] **Attendu:** Feedback visuel "Copié"

#### Test 2.4: Copier lien
- [ ] Créer invitation
- [ ] Cliquer "Copier lien"
- [ ] **Attendu:** Lien copié
- [ ] Coller dans navigateur
- [ ] **Attendu:** Lien valide `/join?token=xxx`

#### Test 2.5: Email manuel
- [ ] Créer invitation
- [ ] Cliquer "Email"
- [ ] **Attendu:** Client email s'ouvre
- [ ] **Attendu:** Destinataire, sujet, corps pré-remplis

---

### Groupe 3: Acceptation d'Invitation (Non connecté)

####Test 3.1: Flux complet nouveau utilisateur
- [ ] Recevoir lien d'invitation
- [ ] Cliquer lien (navigateur privé)
- [ ] **Attendu:** Page `/join` avec infos ferme
- [ ] Cliquer "Créer un compte"
- [ ] **Attendu:** Redirection vers `/register?token=xxx`
- [ ] Remplir formulaire inscription
- [ ] Submit
- [ ] **Attendu:** Compte créé, redirection dashboard
- [ ] Vérifier rôle assigné
- [ ] Vérifier dans Staff de la ferme

#### Test 3.2: Inscription Google avec token
- [ ] Recevoir lien
- [ ] Cliquer lien
- [ ] Cliquer "Continuer avec Google"
- [ ] **Attendu:** Popup Google
- [ ] Choisir compte Gmail
- [ ] **Attendu:** Compte créé + ferme assignée

#### Test 3.3: Lookup manuel (email + token)
- [ ] Aller sur `/register`
- [ ] Sélectionner "Employé" mode
- [ ] Entrer email de l'invitation
- [ ] Entrer token
- [ ] Continuer inscription
- [ ] **Attendu:** Association correcte

---

### Groupe 4: Acceptation (Utilisateur connecté)

#### Test 4.1: Email matching
- [ ] Se connecter avec compte existant (même email que invitation)
- [ ] Cliquer lien d'invitation
- [ ] **Attendu:** Page Join avec "Accepter l'invitation"
- [ ] Cliquer "Accepter"
- [ ] **Attendu:** Ajouté à la ferme, redirection

#### Test 4.2: Email mismatch
- [ ] Se connecter avec compte A
- [ ] Cliquer lien pour invitation email B
- [ ] **Attendu:** Message "Vous devez vous déconnecter"
- [ ] Bouton "Se déconnecter"
- [ ] Cliquer
- [ ] **Attendu:** Déconnexion, affichage boutons inscription

#### Test 4.3: Déjà membre
- [ ] Accepter une invitation
- [ ] Cliquer à nouveau sur le même lien
- [ ] **Attendu:** Message "Vous êtes déjà membre"
- [ ] Bouton vers dashboard

---

### Groupe 5: Gestion des Invitations

#### Test 5.1: Liste invitations en attente
- [ ] Sur page Staff, section "Invitations en attente"
- [ ] **Attendu:** Liste des invitations pending
- [ ] Vérifier affichage: nom, email, rôle, temps restant

#### Test 5.2: Indicateur temps restant
- [ ] Créer invitation
- [ ] Vérifier badge temps
- [ ] **Attendu:** Badge vert si > 3 jours
- [ ] Créer invitation et modifier expiresAt (< 3 jours)
- [ ] **Attendu:** Badge orange
- [ ] Modifier expiresAt (< 1 jour)
- [ ] **Attendu:** Badge rouge

#### Test 5.3: Renvoyer invitation
- [ ] Sur invitation pending, cliquer "Renvoyer"
- [ ] **Attendu:** Modal de partage s'ouvre
- [ ] Partager via une méthode
- [ ] **Attendu:** Fermeture modal

#### Test 5.4: Prolonger invitation (< 2 jours)
- [ ] Créer invitation et modifier expiresAt (demain)
- [ ] **Attendu:** Bouton "Prolonger" visible
- [ ] Cliquer "Prolonger"
- [ ] **Attendu:** Toast "Invitation prolongée de 7 jours"
- [ ] Vérifier nouveau temps restant (+7 jours)

#### Test 5.5: Annuler invitation
- [ ] Cliquer "Annuler" sur une invitation
- [ ] **Attendu:** Dialogue de confirmation
- [ ] Confirmer
- [ ] **Attendu:** Toast "Invitation annulée"
- [ ] **Attendu:** Invitation retirée de la liste

---

### Groupe 6: Dashboard Statistiques

#### Test 6.1: Affichage stats
- [ ] Créer plusieurs invitations (acceptées + pending)
- [ ] Sur page Staff
- [ ] **Attendu:** 4 cards de stats visibles:
  - Cette semaine
  - En attente
  - Taux de conversion
  - Expirent bientôt

#### Test 6.2: Calculs corrects
- [ ] Créer 10 invitations cette semaine
- [ ] Accepter 7
- [ ] **Attendu:** "Cette semaine: 10 (7 acceptées)"
- [ ] **Attendu:** "En attente: 3"
- [ ] **Attendu:** "Taux conversion: 70%"

#### Test 6.3: Invitations expirant bientôt
- [ ] Créer invitation expirant demain
- [ ] **Attendu:** Card "Expirent bientôt: 1"
- [ ] **Attendu:** Badge rouge

---

### Groupe 7: Cas d'Erreur

#### Test 7.1: Token invalide
- [ ] Aller sur `/join?token=INVALID123`
- [ ] **Attendu:** Message "Invitation invalide ou expirée"

#### Test 7.2: Token expiré
- [ ] Créer invitation et modifier expiresAt (hier)
- [ ] Cliquer lien
- [ ] **Attendu:** Message "Invitation expirée"

#### Test 7.3: Invitation déjà acceptée
- [ ] Accepter invitation
- [ ] Essayer réutiliser le token
- [ ] **Attendu:** Message approprié

#### Test 7.4: Email déjà utilisé
- [ ] Créer invitation pour email@test.com
- [ ] Créer compte avec cet email (sans invitation)
- [ ] Essayer utiliser l'invitation
- [ ] **Attendu:** Gestion gracieuse

---

## 📱 Tests Multi-Devices

### Mobile (iOS)
- [ ] Safari iPhone - Créer invitation
- [ ] Safari iPhone - Accepter invitation
- [ ] WhatsApp - Partage
- [ ] SMS - Partage
- [ ] Responsive UI

### Mobile (Android)
- [ ] Chrome Android - Créer invitation
- [ ] Chrome Android - Accepter invitation
- [ ] WhatsApp - Partage
- [ ] SMS - Partage
- [ ] Responsive UI

### Tablette
- [ ] iPad Safari - Flux complet
- [ ] Android Tablet - Flux complet

### Desktop
- [ ] Chrome - Flux complet
- [ ] Safari - Flux complet
- [ ] Firefox - Flux complet
- [ ] Edge - Flux complet

---

## 🎨 Tests UI/UX

### Cohérence Visuelle
- [ ] Couleurs cohérentes (emerald, amber, slate)
- [ ] Icônes appropriées
- [ ] Espacements uniformes
- [ ] Typographie cohérente

### Animations
- [ ] Transitions modales
- [ ] Hover effects
- [ ] Loading states
- [ ] Toast notifications

### Accessibilité
- [ ] Toutes les images ont alt text
- [ ] Contraste suffisant (WCAG AA)
- [ ] Navigation au clavier
- [ ] Screen reader friendly

---

## ⚡ Tests de Performance

### Temps de Chargement
- [ ] Page Staff charge en < 2s
- [ ] Dashboard stats calcule en < 500ms
- [ ] Création invitation < 1s

### Réactivité
- [ ] Pas de lag lors du scroll
- [ ] Animations fluides (60fps)
- [ ] Pas de freeze UI

---

## 🔒 Tests de Sécurité

### Rate Limiting
- [ ] Limite de 10/heure fonctionne
- [ ] Reset après 1 heure
- [ ] Pas de contournement client-side

### Validation
- [ ] Tokens valides uniquement
- [ ] Email format validé
- [ ] XSS protection
- [ ] Firestore rules respectées

---

## 📊 Checklist Finale

### Fonctionnalités Core
- [x] Création invitation: ✅
- [x] Partage WhatsApp: ✅
- [x] Partage SMS: ✅
- [x] Acceptation non connecté: ✅
- [x] Acceptation connecté: ✅
- [x] Rate limiting: ✅
- [x] Dashboard stats: ✅
- [x] Prolongation auto: ✅
- [x] Messages d'erreur clairs: ✅

### Build & Déploiement
- [x] Build production réussi: ✅
- [ ] Tests manuels passés
- [ ] Aucun bug bloquant
- [ ] Documentation à jour
- [ ] Ready for staging

---

## 🐛 Bugs Identifiés

### Critiques
*Aucun*

### Non-critiques
*À compléter après tests utilisateurs*

---

## 📝 Notes de Test

**Tester avec:**
- 3-5 utilisateurs réels
- Données réelles (vraies invitations)
- Connexions réelles (vrai WhatsApp, SMS)

**Observer:**
- Où les utilisateurs hésitent
- Quels messages sont confus
- Quelles étapes sont difficiles

**Recueillir:**
- Feedback verbal
- Temps pour compléter chaque tâche
- Taux de réussite par scénario

---

## ✅ Validation Finale

**Critères de succès:**
- [ ] 100% des tests fonctionnels passent
- [ ] 0 bug critique
- [ ] Satisfait sur 3+ navigateurs desktop
- [ ] Satisfait sur 2+ devices mobiles
- [ ] 3+ utilisateurs beta satisfaits (>7/10)
- [ ] Build de production OK
- [ ] Performance acceptable

**Si tous les critères sont remplis:**
→ **PRÊT POUR PRODUCTION** 🚀

---

**Prochain Jalon:** Déploiement en production
