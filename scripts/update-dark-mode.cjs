#!/usr/bin/env node

/**
 * Bulk update dark mode classes in component files
 */

const fs = require('fs');
const path = require('path');

const replacements = [
    // Input/Select borders and backgrounds
    {
        from: /className="([^"]*?)border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent([^"]*?)"/g,
        to: 'className="$1bg-surface-input border border-border-default text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-emerald-500 focus:border-transparent$2"'
    },
    // Labels
    {
        from: /className="([^"]*?)text-sm font-medium text-slate-700([^"]*?)"/g,
        to: 'className="$1text-sm font-medium text-text-secondary$2"'
    },
    // Headings (h2, h3)
    {
        from: /className="([^"]*?)text-slate-900([^"]*?)"/g,
        to: 'className="$1text-text-primary$2"'
    },
    // Muted text
    {
        from: /className="([^"]*?)text-slate-500([^"]*?)"/g,
        to: 'className="$1text-text-muted$2"'
    },
    // Icon colors
    {
        from: /className="([^"]*?)text-slate-400([^"]*?)"/g,
        to: 'className="$1text-text-muted$2"'
    },
    // Hover backgrounds
    {
        from: /className="([^"]*?)hover:bg-slate-100([^"]*?)"/g,
        to: 'className="$1hover:bg-overlay-hover$2"'
    },
];

const files = [
    'src/components/herd/AddAnimalModal.tsx',
    'src/components/herd/EditAnimalModal.tsx',
    'src/components/tasks/AddTaskModal.tsx',
    'src/components/inventory/AddInventoryModal.tsx',
    'src/components/inventory/EditInventoryModal.tsx',
    'src/components/staff/InviteMemberModal.tsx',
    'src/components/ui/QuantityDialog.tsx',
];

let totalReplacements = 0;

files.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let fileReplacements = 0;

    replacements.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
            fileReplacements += matches.length;
            content = content.replace(from, to);
        }
    });

    if (fileReplacements > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${filePath}: ${fileReplacements} replacements`);
        totalReplacements += fileReplacements;
    } else {
        console.log(`⏭️  ${filePath}: no changes needed`);
    }
});

console.log(`\n🎉 Total replacements: ${totalReplacements}`);
