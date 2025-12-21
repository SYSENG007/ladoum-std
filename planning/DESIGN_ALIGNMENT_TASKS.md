# Design Alignment Tasks
*Actionable checklist to implement the Design Coherence Guide (v1.1)*

## 1. Global & Configuration
Refine the foundation to enforce the "Soft/Nature" aesthetic.

- [ ] **Tailwind Config**: standardizes `borderRadius` tokens.
  - *Action*: Update `theme.extend.borderRadius` to explicitly map `xl` (0.75rem/12px) as the default "standard".
- [ ] **Background Color**: Change global default background.
  - *Action*: Update `index.css` or `App.tsx` wrapper to use `bg-slate-50` (or `bg-[#F0F3FF]` Monday-like light blue) instead of white/gray.

## 2. Component Refactoring
Ensure reusable components match the rules strictly.

- [ ] **Card Component**:
  - [ ] Enforce `rounded-xl`.
  - [ ] Enforce `shadow-sm` (Level 2 Elevation).
  - [ ] Enforce `border-slate-100`.
- [ ] **Button Component**:
  - [ ] Verify `primary` variant uses `text-white` (On Primary rule).
  - [ ] Verify `rounded-xl` matches Card radius.
- [ ] **Badge/Status Component**:
  - [ ] Audit colors to match Monday.com logic (Green=Done, Amber=Working, Red=Stuck).

## 3. Module Audits & Updates
Apply "Status Logic" and "Typography" rules to specific pages.

### A. Marketplace (`Marketplace.tsx`)
- [ ] **Status Badges**:
    - "Available" → Green (Success/Ready).
    - "Reserved" → Amber (Working/Pending).
    - "Sold" → Red (Stuck/Gone) or Slate (Final). *Recommendation: Red for 'Sold' fits Monday's 'Stuck' logic (item no longer actionable).*
- [ ] **Card Layout**: Ensure listings use standard `Card` padding/radius.

### B. Accounting (`Accounting.tsx`)
- [ ] **Transaction Types**:
    - "Income" → Green (Positive).
    - "Expense" → Red (Negative/Out).
- [ ] **Table Styling**: Ensure rows have comfortable padding (`py-3`) and generally softer borders.

### C. Teleconsultation (`Teleconsultation.tsx`)
- [ ] **Appointment Status**:
    - "Scheduled/Upcoming" → Amber (Pending).
    - "Completed" → Green (Done).
    - "Cancelled" → Red (Stuck/Error).

## 4. Typography & "On" Colors Audit
- [ ] **Header Inspection**: Check all `<h1>` tags are `text-2xl font-bold text-slate-900`.
- [ ] **Subtitle Inspection**: Check all descriptions are `text-sm text-slate-500`.
- [ ] **Contrast Verification**: Ensure no grey text is placed on grey backgrounds (use `text-slate-900` on `bg-slate-100` surfaces).

## 5. Clean Up
- [ ] **Remove Hardcoded Styles**: Search for arbitrary classes like `rounded-[10px]` or `bg-[#123456]` and replace with design system tokens.
