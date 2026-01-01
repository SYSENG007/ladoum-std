#!/bin/bash

# Migration Script: Teal → Navy/Tan/Gold Design System
# This script helps identify components using old color references

echo "🎨 Design System Migration Analysis"
echo "===================================="
echo ""

# Colors to search for (old teal/mint references that should be reviewed)
echo "📊 Searching for potential color migration points..."
echo ""

# Search for hardcoded teal references
echo "1️⃣  Old Teal Primary (#26524A) references:"
grep -r "#26524A" src/ --include="*.tsx" --include="*.ts" --include="*.css" | wc -l | xargs echo "   Found: "

# Search for hardcoded mint references  
echo "2️⃣  Old Mint Secondary (#B0D1CB) references:"
grep -r "#B0D1CB" src/ --include="*.tsx" --include="*.ts" --include="*.css" | wc -l | xargs echo "   Found: "

# Search for blue gradient usage (commonly used for headers)
echo "3️⃣  Blue gradient references (should use primary navy):"
grep -r "from-blue-" src/ --include="*.tsx" | wc -l | xargs echo "   Found: "

# Search for Poppins font references (should use Montserrat/Open Sans)
echo "4️⃣  Poppins font references (should update to Montserrat/Open Sans):"
grep -r "font-sans" src/ --include="*.tsx" | wc -l | xargs echo "   Found: "

echo ""
echo "🔍 Detailed Analysis:"
echo "--------------------"
echo ""

# Show specific files with blue gradients
echo "Files using blue gradients (review for primary navy):"
grep -l "from-blue-" src/**/*.tsx 2>/dev/null | head -10

echo ""
echo "✅ Next Steps:"
echo "1. Review files above"
echo "2. Update blue gradients to use 'from-primary-600 to-primary-700'"
echo "3. Verify focus rings use 'focus:ring-accent-500' (gold)"
echo "4. Check card backgrounds use 'bg-neutral-white' or 'bg-secondary-50'"
echo "5. Update headings to use 'font-heading' class"
echo ""
echo "📝 Tailwind config has been updated with new colors!"
echo "   - primary: Navy (#1F3C4F)"
echo "   - secondary: Tan (#D6C2A9)" 
echo "   - accent: Gold (#E5A832)"
echo "   - neutral: Off-white (#F9F9F9) & Grey (#5A5A5A)"
