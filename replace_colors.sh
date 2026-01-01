#!/bin/bash

# Bulk Color Replacement Script
# Replaces emerald colors with navy/slate equivalents

echo "🎨 Replacing emerald colors with navy/slate..."

# Navigate to src directory
cd "$(dirname "$0")/src"

# Replace emerald-500 with slate-800 (primary color)
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-500/slate-800/g' {} +

# Replace emerald-600 with slate-900 (darker variant)
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-600/slate-900/g' {} +

# Replace emerald-700 with slate-900
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-700/slate-900/g' {} +

# Replace emerald-400 with slate-600 (lighter variant)  
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-400/slate-600/g' {} +

# Replace emerald-300 with slate-500
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-300/slate-500/g' {} +

# Replace emerald-200 with slate-400
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-200/slate-400/g' {} +

# Replace emerald-100 with slate-200 (light backgrounds)
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-100/slate-200/g' {} +

# Replace emerald-50 with slate-100 (very light backgrounds)
find . -name "*.tsx" -type f -exec sed -i '' 's/emerald-50/slate-100/g' {} +

echo "✅ Color replacement complete!"
echo "📊 Running quick count..."
echo "Remaining emerald references:"
grep -r "emerald-" . --include="*.tsx" | wc -l

echo "🔄 Dev server will auto-reload"
