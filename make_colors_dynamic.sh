#!/bin/bash

# Smart Color Replacement Script
# Replaces hardcoded colors with dynamic tokens while preserving semantics

echo "🎨 Starting Smart Color Replacement..."
echo ""

cd "$(dirname "$0")/src"

# PHASE 1: Dark Backgrounds (Accents & Cards)
echo "📦 Phase 1: Dark backgrounds..."
find . -name "*.tsx" -type f -exec sed -i '' 's/from-slate-900 to-slate-800/from-primary-700 to-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/from-slate-800 to-slate-900/from-primary-600 to-primary-700/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/ bg-slate-600/ bg-primary-500/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/ bg-slate-700/ bg-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"bg-slate-700/"bg-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"bg-slate-800/"bg-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"bg-slate-900/"bg-primary-700/g' {} +

# PHASE 2: Avatar backgrounds  
echo "👤 Phase 2: Avatar backgrounds..."
find . -name "*.tsx" -type f -exec sed -i '' 's/ bg-slate-400 / bg-primary-500 /g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"bg-slate-400"/"bg-primary-500"/g' {} +

# PHASE 3: Light accent backgrounds
echo "🎨 Phase 3: Light accent backgrounds..."
find . -name "*.tsx" -type f -exec sed -i '' 's/ bg-blue-50 / bg-secondary-50 /g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"bg-blue-50"/"bg-secondary-50"/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/ bg-blue-100 / bg-secondary-100 /g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"bg-blue-100"/"bg-secondary-100"/g' {} +

# PHASE 4: Emphasized text colors
echo "📝 Phase 4: Text colors..."
find . -name "*.tsx" -type f -exec sed -i '' 's/ text-blue-600/ text-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/ text-blue-700/ text-primary-700/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"text-blue-600"/"text-primary-600"/g' {} +

# PHASE 5: Border colors
echo "🔲 Phase 5: Border colors..."
find . -name "*.tsx" -type f -exec sed -i '' 's/ border-blue-500/ border-primary-500/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/ border-slate-400/ border-primary-400/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"border-blue-500"/"border-primary-500"/g' {} +

# PHASE 6: Blue accent backgrounds
echo "🔵 Phase 6: Blue accent replacements..."
find . -name "*.tsx" -type f -exec sed -i '' 's/ bg-blue-500/ bg-primary-500/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/"bg-blue-500"/"bg-primary-500"/g' {} +

echo ""
echo "✅ Automated replacement complete!"
echo ""
echo "📊 Checking results..."
echo "Remaining bg-slate-[6-9]00: $(grep -r 'bg-slate-[6-9]00' . --include="*.tsx" | wc -l)"
echo "Remaining bg-blue-500: $(grep -r 'bg-blue-500' . --include="*.tsx" | wc -l)"
echo ""
echo "🔄 Dev server will auto-reload"
