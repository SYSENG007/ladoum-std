# Ladoum STD - Brand Book

> Guide complet d'identité visuelle et système de design de l'application de gestion d'élevage Ladoum.

---

## 🎨 Palette de Couleurs

### Couleur Primaire — Emerald (Vert Émeraude)
La couleur signature de Ladoum STD, évoquant nature, croissance et confiance.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#ecfdf5` | Arrière-plans subtils |
| `primary-100` | `#d1fae5` | Hover léger |
| `primary-200` | `#a7f3d0` | Bordures actives |
| `primary-300` | `#6ee7b7` | Indicateurs |
| `primary-400` | `#34d399` | Éléments secondaires |
| `primary-500` | `#10b981` | Boutons secondaires |
| **`primary-600`** | **`#059669`** | **Couleur principale** |
| `primary-700` | `#047857` | Hover boutons |
| `primary-800` | `#065f46` | Texte sur fond clair |
| `primary-900` | `#064e3b` | Accentuation forte |

### Couleur Neutre — Slate (Gris Ardoise)
Pour le texte, les bordures et les arrière-plans.

| Token | Hex | Usage |
|-------|-----|-------|
| `slate-50` | `#f8fafc` | Background principal |
| `slate-100` | `#f1f5f9` | Bordures cartes |
| `slate-200` | `#e2e8f0` | Dividers, bordures input |
| `slate-400` | `#94a3b8` | Texte secondaire |
| `slate-500` | `#64748b` | Texte tertiaire |
| `slate-700` | `#334155` | Corps de texte |
| `slate-900` | `#0f172a` | Titres |

### Couleurs Sémantiques

| Couleur | Usage | Classes Tailwind |
|---------|-------|------------------|
| 🔴 **Rouge** | Erreurs, alertes stock | `red-500`, `red-100` |
| 🟡 **Ambre** | Avertissements, en cours | `amber-500`, `amber-100` |
| 🔵 **Bleu** | Information, mâles | `blue-600`, `blue-100` |
| 💗 **Rose** | Reproduction, femelles | `pink-500`, `pink-100` |
| 💜 **Violet** | Premium, certifications Elite | `purple-600`, `purple-100` |

---

## 🔤 Typographie

### Police Principale — Poppins

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

font-family: 'Poppins', sans-serif;
```

### Échelle Typographique

| Usage | Classe Tailwind | Poids |
|-------|-----------------|-------|
| Titre page | `text-2xl font-bold` | 700 |
| Titre section | `text-lg font-bold` | 700 |
| Sous-titre | `text-base font-semibold` | 600 |
| Corps | `text-sm font-normal` | 400 |
| Label | `text-xs font-medium uppercase` | 500 |
| Caption | `text-[10px] text-slate-400` | 400 |

---

## 📐 Espacements & Rayons

### Border Radius

| Token | Taille | Usage |
|-------|--------|-------|
| `rounded-lg` | 0.5rem | Inputs, boutons petits |
| `rounded-xl` | 0.75rem | Boutons, badges |
| `rounded-2xl` | 1rem | Cards secondaires |
| **`rounded-3xl`** | **1.5rem** | **Cards principales** |
| `rounded-full` | 100% | Avatars, badges circulaires |

### Shadows

```css
/* Standard Card */
shadow-sm border border-slate-100

/* Hover State */
shadow-md

/* Floating elements (FAB, modals) */
shadow-lg
```

---

## 🧱 Composants UI

### Card
```tsx
<Card className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
```
- Fond blanc pur
- Bordure subtile `slate-100`
- Coins très arrondis `rounded-3xl`
- Ombre légère avec hover `shadow-md`

### Bouton Principal
```tsx
<Button variant="primary">
  bg-primary-600 text-white hover:bg-primary-700
  shadow-sm shadow-primary-200
  rounded-xl px-4 py-2
```

### Bouton Secondaire
```tsx
<Button variant="secondary">
  bg-white text-slate-700 border border-slate-200
  hover:bg-slate-50
```

### Input
```tsx
<input className="
  w-full px-4 py-3 
  rounded-xl 
  border border-slate-200 
  focus:ring-2 focus:ring-emerald-500 focus:border-transparent
" />
```

### Badge de Certification

| Niveau | Couleur Gradient | Icône |
|--------|------------------|-------|
| Bronze | orange-100 → orange-200 | Shield |
| Silver | slate-100 → slate-300 | Medal |
| Gold | yellow-100 → yellow-300 | Award |
| Platinum | cyan-50 → cyan-200 | Star |
| Elite | purple-100 → purple-300 | Crown |

---

## 📱 Layout Patterns

### Desktop
- **Sidebar** : 256px (64px collapsed) | Fixed left
- **Main Content** : `max-w-7xl mx-auto` avec padding `p-8`
- **Grid** : `grid-cols-3` pour KPIs, flex row pour sections

### Mobile
- **Header** : Titre + Avatar + Notifications
- **Bottom Nav** : Fixed bottom avec FAB central (vert émeraude)
- **Cards** : Full width avec `rounded-xl`

---

## ✨ Animations & Transitions

```css
/* Standard Transition */
transition-all duration-200

/* Slow Transition (Sidebar) */
transition-all duration-300

/* Hover Scale */
hover:scale-105 transition-transform

/* Loading Spinner */
animate-spin border-emerald-500 border-t-transparent
```

---

## 🎯 Principes de Design

1. **Clarté** — Hiérarchie visuelle claire, espaces blancs généreux
2. **Douceur** — Coins arrondis, ombres subtiles, transitions fluides
3. **Nature** — Palette verte évoquant l'agriculture et la croissance
4. **Professionalisme** — Design épuré inspiré de monday.com et outils SaaS modernes
5. **Accessibilité** — Contrastes respectant WCAG, tailles touch-friendly

---

## 📁 Structure Assets

```
src/
├── assets/
│   └── logo.jpg          # Logo Ladoum STD
├── components/ui/
│   ├── Button.tsx        # Boutons avec variants
│   ├── Card.tsx          # Cartes principales
│   └── CertificationBadge.tsx
└── index.css             # Import Poppins + base styles
```

---

## 🖼️ Logo

- **Format** : JPEG (logo.jpg)
- **Usage sidebar** : 32x32px avec `rounded-lg`
- **Usage header** : Initiales de la ferme dans cercle vert

---

*Ladoum STD — Gestion intelligente de votre élevage Ladoum*
