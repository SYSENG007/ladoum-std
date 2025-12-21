# Invitation System Refactor - Deployment Checklist

## Pre-Deployment Checklist

- [ ] All code changes reviewed
- [ ] No TypeScript/lint errors
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Database backup created (optional but recommended)

---

## Deployment Steps

### 1. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

**Expected Output:**
```
✔ Deploy complete!
```

**Wait Time:** 5-10 minutes for indexes to build

**Verify:** 
- Go to Firebase Console → Firestore → Indexes
- Check that 3 new "invitations" indexes are building/complete:
  - `token + status` (Collection Group)
  - `status + expiresAt` (Collection Group)
  - `farmId + createdAt` (Collection)

---

### 2. Test Migration Script (Dry Run)

```bash
npx tsx scripts/migrate-invitations-to-subcollection.ts --dry-run
```

**Expected Output:**
```
🔍 DRY RUN MODE - No changes will be made
📊 Found X invitation(s) to migrate
...
✨ Script completed
```

**Review:** Check the output to ensure all invitations are accounted for

---

### 3. Execute Migration

```bash
npx tsx scripts/migrate-invitations-to-subcollection.ts --execute
```

**Expected Output:**
```
⚠️  EXECUTION MODE - Changes will be written to database
Proceed with migration? (yes/no): yes
...
✅ MIGRATION COMPLETE!
```

**Verify:**
- Check Firebase Console → Firestore
- Navigate to `farms/{farmId}/invitations`
- Confirm invitations exist in new location
- Old invitations should have `migrated: true` field

---

### 4. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔ Deploy complete!
```

**Test:**
- Use Firebase Console → Firestore → Rules
- Click "Rules Playground"
- Test scenarios:
  - Farm member can read invitations
  - Non-member cannot read invitations
  - Public can read by token (collection group)

---

### 5. Test Application

#### Test Scenario 1: Create Invitation

1. Login as farm owner
2. Go to Staff page
3. Click "Inviter un membre"
4. Fill form and submit
5. Verify invitation appears in list
6. **Check Firestore:** `farms/{farmId}/invitations/{id}` exists

**Expected Result:** ✅ Invitation created successfully

---

#### Test Scenario 2: Accept Invitation (New User)

1. Copy invitation link
2. Open in incognito window
3. Click "Créer un compte"
4. Fill registration form
5. Submit
6. **Check Firestore:**
   - `farms/{farmId}/invitations/{id}` → `status: 'accepted'`
   - `farms/{farmId}/members/{userId}` → exists
   - `users/{userId}` → `farmId` set

**Expected Result:** ✅ User registered and joined farm

---

#### Test Scenario 3: Accept Invitation (Existing User)

1. Copy invitation link  
2. Login as existing user (matching email)
3. Visit invitation link
4. Click "Accepter l'invitation"
5. **Check Firestore:** Same as Scenario 2

**Expected Result:** ✅ User joined farm

---

#### Test Scenario 4: Email Mismatch

1. Copy invitation for alice@example.com
2. Login as bob@example.com
3. Visit invitation link
4. **Expected:** "Email mismatch" screen with logout button

**Expected Result:** ✅ Cannot accept with wrong email

---

#### Test Scenario 5: Expired Invitation

1. Create invitation
2. In Firestore Console, set `expiresAt` to past date
3. Visit invitation link
4. **Expected:** "Cette invitation a expiré"

**Expected Result:** ✅ Expired invitation rejected

---

## Post-Deployment Monitoring

### Day 1 (First 24 hours)

- [ ] Monitor Firebase Console → Firestore → Usage
- [ ] Check for spike in read/write operations
- [ ] Review Firebase Console → Authentication → Users
- [ ] Verify new user registrations via invitation
- [ ] Check application error logs
- [ ] Monitor user feedback/support requests

### Week 1

- [ ] Review invitation conversion rate (target >80%)
- [ ] Check for any permission errors in logs
- [ ] Verify all old invitations migrated correctly
- [ ] Test share features (WhatsApp, SMS, Email)
- [ ] Collect user feedback on new flow

### Week 2+

- [ ] Delete old root collection invitations (optional)
- [ ] Remove backward compatibility code (optional)
- [ ] Update documentation
- [ ] Plan next phase enhancements

---

## Troubleshooting

### Issue: "Missing index" error

**Symptom:** Error when querying invitations by token

**Solution:**
```bash
# Check index status
firebase firestore:indexes

# Redeploy indexes
firebase deploy --only firestore:indexes
```

---

### Issue: "Permission denied" error

**Symptom:** Cannot read/create invitations

**Solution:**
1. Check Firestore rules deployed correctly
2. Verify user is farm member
3. Test rules in Firebase Console playground

---

### Issue: Migration failed

**Symptom:** Error during migration script execution

**Solution:**
1. Check error message in console
2. Verify Firestore permissions
3. Re-run migration (idempotent - safe to retry)
4. Contact support if persistent

---

### Issue: User cannot accept invitation

**Symptom:** Error when clicking "Accept"

**Checklist:**
- [ ] Invitation status is 'pending'
- [ ] Invitation not expired
- [ ] User email matches invitation email
- [ ] Indexes are built (wait 10 min)
- [ ] Security rules deployed

---

## Rollback Procedure

If critical issues arise:

### 1. Revert Security Rules
```bash
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### 2. Revert Application Code
```bash
git revert <commit-hash>
git push origin main
```

### 3. Restore Old Invitations (if needed)
Old invitations remain in root collection with `migrated: true`. They can be unmarked and used again if necessary.

---

## Success Criteria

✅ All indexes built successfully  
✅ Migration completed without errors  
✅ Security rules deployed  
✅ New invitations created in `farms/{farmId}/invitations`  
✅ Users can accept invitations (new & existing)  
✅ Email mismatch handled correctly  
✅ No permission errors in logs  
✅ Invitation conversion rate >80%  

---

## Support Contacts

**Technical Issues:** Check Firebase Console logs  
**User Issues:** Monitor app error logging  
**Questions:** Refer to [Implementation Walkthrough](file:///Users/aboubacrydiallo/.gemini/antigravity/brain/8ccd1476-5b4f-43e5-8173-fccbbc603b4b/implementation_walkthrough.md)

---

**Last Updated:** 2025-12-21  
**Status:** Ready for Deployment
