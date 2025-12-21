# Ladoum STD - Design Coherence & Principles Guide

This document establishes the core parameters to ensure UI coherence across the application. It complements the `BRAND_BOOK.md` by focusing on execution rules and consistency check.
*Inspiration Sources: Material Design 2 (Color System), Monday.com (Status Logic).*

## 1. Core Design Philosophy
*Target Aesthetic: Premium, Natural, Soft (Modern Logiciel Métier)*

- **Clarity First**: Data must be legible. Use "Slate" neutrals to reduce eye strain.
- **Nature Inspired**: Use "Emerald" green sparingly but consistently for primary actions and positive states.
- **Soft Geometry**: Avoid sharp corners. Everything is rounded to convey organic friendliness.
- **Vibrant Statuses**: Use highly saturated colors for status indicators to make workflow state instantly recognizable (Monday.com inspired).

## 2. Coherence Parameters

### A. Shape & Geometry (The "Radius" Rule)
*Current Status: Code uses `rounded-xl` (12px), Brand Book suggests `rounded-3xl` (24px).*

**Recommendation: Standardize on `rounded-xl` for better density.**
- **Cards**: `rounded-xl` (Matches current code `Card.tsx`)
- **Buttons**: `rounded-xl` (Matches current code `Button.tsx`)
- **Inputs**: `rounded-xl`
- **Modals**: `rounded-2xl` (Slightly friendlier for large overlays)

**Parameter to Watch**: Ensure NO element uses default (sharp) corners or `rounded-sm`.

### B. Depth & Elevation (Shadows)
Use shadows to create hierarchy, not decoration.

- **Level 1 (Base)**: No shadow, `border border-slate-100`. (Cards in lists)
- **Level 2 (Lifted)**: `shadow-sm`, `border border-slate-100`. (Clickable cards, Widgets)
- **Level 3 (Floating)**: `shadow-lg`, `shadow-emerald-100/50`. (Sticky actions, active states)

**Parameter to Watch**: Avoid using pure black shadows. Use colored shadows (e.g., `shadow-emerald-200`) for a premium "glassy" feel.

### C. Color System & Accessibility (Material Inspired)
We follow the "Color Role" model to ensure accessible contrast.

#### Roles
1. **Primary**: `bg-primary-600` (Emerald) - Used for key actions.
2. **Surface**: `bg-white` - Used for components (Cards, Sheets).
3. **Background**: `bg-slate-50` - Used for the page backdrop behind content.
4. **Error**: `bg-red-50` (Surface) / `text-red-600` (Content) - For critical issues.

#### "On" Colors (Accessibility)
Rules for text/icons placed *on top* of distinct surfaces:
- **On Primary**: MUST be `text-white`. Never dark text.
- **On Surface**: `text-slate-900` (High Emphasis), `text-slate-500` (Medium Emphasis).
- **On Background**: `text-slate-700` (Body), `text-slate-500` (Meta).

### D. Status Color Logic (Monday.com Inspired)
Colors map strictly to workflow states.

| State | Color Family | Meaning |
|-------|--------------|---------|
| **Done / Success** | **Emerald** (Green) | Item completed, Transaction in, Healthy. |
| **Working / Pending** | **Amber** (Yellow/Orange) | Task in progress, Heat pending, Transaction pending. |
| **Stuck / Error** | **Red** (Rose) | Blocked task, Transaction out/expense, Medical issue. |
| **Info / Neutral** | **Blue** / **Slate** | Draft, Future scheduled, General info. |

### E. Typography Hierarchy
Adhere strictly to the scale to prevent "visual noise".

- **Page Title**: `text-2xl font-bold text-slate-900`
- **Section/Card Title**: `text-lg font-bold text-slate-900`
- **Subtitle/Description**: `text-sm text-slate-500` (Crucial for "Softness")
- **Body Text**: `text-sm text-slate-700`
- **Labels/Meta**: `text-xs font-medium text-slate-500`

### F. Spacing & Density
- **Padding**:
  - Cards: `p-6` (Desktop), `p-4` (Mobile).
  - Page Container: `max-w-7xl mx-auto p-4 md:p-8`.
- **Gaps**:
  - Section spacing: `space-y-6` (24px).
  - Item spacing: `gap-4` (16px).

## 3. Component styling checklist

| Component | Style Rules |
|-----------|-------------|
| **Card** | `bg-white border border-slate-100 shadow-sm rounded-xl` |
| **Button** | `h-10 px-4 rounded-xl font-medium shadow-sm` |
| **Input** | `border-slate-200 focus:ring-emerald-500 rounded-xl` |
| **Badge** | `rounded-full px-2.5 py-0.5 text-xs font-medium` |
| **Icon** | `w-5 h-5` (standard) or `w-4 h-4` (secondary) |

## 4. Execution Strategy for Coherence

1. **Audit Radius**: Standardize on `rounded-xl`.
2. **Audit "On" Colors**: Check all Primary Buttons have `text-white`. Check all Cards have `text-slate-900` titles.
3. **Status Audit**: Ensure "Stuck/Error" is always Red and "Done/Success" is always Green/Emerald.
4. **Empty States**: Ensure every list/module has a friendly empty state with an icon and a clear CTA.
