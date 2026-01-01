#!/bin/bash

# Automated Color Palette Migration Script
# Replaces hardcoded slate/blue colors with teal primary colors

echo "🎨 Migrating to Teal Palette..."

cd "$(dirname "$0")/src"

# Replace bg-slate-800 (dark backgrounds) with bg-primary-600
find . -name "*.tsx" -type f -exec sed -i '' 's/bg-slate-800/bg-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/dark:bg-slate-800/dark:bg-primary-600/g' {} +

# Replace bg-blue-500 (accent colors) with bg-primary-DEFAULT  
find . -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-500/bg-primary-500/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/text-blue-500/text-primary-500/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/text-blue-600/text-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/border-blue-500/border-primary-500/g' {} +

# Replace bg-blue-100/200 (light accents) with secondary
find . -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-100/bg-secondary-100/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/text-blue-700/text-primary-700/g' {} +

# Replace indigo (if any) with primary
find . -name "*.tsx" -type f -exec sed -i '' 's/bg-indigo-600/bg-primary-600/g' {} +
find . -name "*.tsx" -type f -exec sed -i '' 's/text-indigo-600/text-primary-600/g' {} +

echo "✅ Color migration complete!"
echo "📊 Summary of changes:"
echo ""
echo "Replaced colors:"
echo "  • bg-slate-800 → bg-primary-600 (dark backgrounds)"
echo "  • bg-blue-500 → bg-primary-500 (accents)"
echo "  • bg-blue-100 → bg-secondary-100 (light accents)"
echo ""
echo "🔄 Dev server will auto-reload"
