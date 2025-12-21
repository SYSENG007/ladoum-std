#!/bin/bash

# Deployment Script for Invitation System Refactor
# This script guides you through deploying all changes safely

set -e  # Exit on error

echo "============================================="
echo "  Invitation System Refactor Deployment"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Firebase CLI
echo -e "${YELLOW}[Step 1/6]${NC} Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found${NC}"
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
    echo -e "${GREEN}✅ Firebase CLI installed${NC}"
else
    echo -e "${GREEN}✅ Firebase CLI found${NC}"
fi
echo ""

# Step 2: Login to Firebase
echo -e "${YELLOW}[Step 2/6]${NC} Checking Firebase authentication..."
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✅ Already logged in to Firebase${NC}"
else
    echo "Logging in to Firebase..."
    firebase login
fi
echo ""

# Step 3: Deploy Firestore Indexes
echo -e "${YELLOW}[Step 3/6]${NC} Deploying Firestore indexes..."
echo "This will create 3 new collection group indexes for invitations."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase deploy --only firestore:indexes
    echo -e "${GREEN}✅ Indexes deployed${NC}"
    echo -e "${YELLOW}⏳ Indexes are building... This may take 5-10 minutes${NC}"
    echo "Check status at: https://console.firebase.google.com/project/_/firestore/indexes"
else
    echo -e "${RED}❌ Skipped indexes deployment${NC}"
    exit 1
fi
echo ""

# Step 4: Test Migration (Dry Run)
echo -e "${YELLOW}[Step 4/6]${NC} Testing migration script (dry-run)..."
read -p "Run migration dry-run? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx tsx scripts/migrate-invitations-to-subcollection.ts --dry-run
    echo -e "${GREEN}✅ Dry run complete${NC}"
    echo ""
    read -p "Execute actual migration? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️  This will migrate all invitations to the new structure${NC}"
        npx tsx scripts/migrate-invitations-to-subcollection.ts --execute
        echo -e "${GREEN}✅ Migration complete${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipped migration execution${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipped migration${NC}"
fi
echo ""

# Step 5: Deploy Security Rules
echo -e "${YELLOW}[Step 5/6]${NC} Deploying Firestore security rules..."
echo "This will update rules to support farm-scoped invitations."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase deploy --only firestore:rules
    echo -e "${GREEN}✅ Security rules deployed${NC}"
else
    echo -e "${RED}❌ Skipped rules deployment${NC}"
    exit 1
fi
echo ""

# Step 6: Summary
echo -e "${YELLOW}[Step 6/6]${NC} Deployment Summary"
echo "============================================="
echo -e "${GREEN}✅ Firestore indexes deployed${NC}"
echo -e "${GREEN}✅ Security rules updated${NC}"
echo -e "${GREEN}✅ Migration completed${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for indexes to finish building (5-10 min)"
echo "2. Test invitation creation in the app"
echo "3. Test invitation acceptance (new & existing users)"
echo "4. Monitor Firebase Console for errors"
echo ""
echo "Rollback if needed:"
echo "  git checkout HEAD~1 firestore.rules"
echo "  firebase deploy --only firestore:rules"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
