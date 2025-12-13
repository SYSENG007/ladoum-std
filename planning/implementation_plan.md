# Implementation Plan - Ladoum Manager MVP

## Goal Description
Develop a **mobile-first, offline-first** application for managing a Ladoum sheep farm. The app will centralize herd information, aid in breeding/nutrition decisions, and structure daily tasks.
The UI will be inspired by **monday.com** (clean, board-like, modern) and functionality by **Farmbrite**.

## User Review Required
> [!IMPORTANT]
> **Tech Stack Decision**: The PRD mentions "Android mobile app (React Native or Flutter)". To allow for rapid development, immediate visual feedback, and robust offline capabilities within this coding environment, I propose building a **Progressive Web App (PWA)** using **React + Vite**.
> - **Why**: PWAs can be installed on Android devices, work offline, and offer a native-like experience. This ensures we can iterate on the UI/UX immediately.
> - **Future**: This codebase can be wrapped in Capacitor later to generate a true APK if strictly necessary, but a PWA is the fastest path to MVP.

## Proposed Architecture

### Tech Stack
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Variables for theming) - *Strict adherence to monday.com aesthetics*
- **State/Data**: React Context + IDB (IndexedDB wrapper) for offline persistence
- **Charts**: Recharts (for growth and performance graphs)
- **Icons**: Lucide React

### Design System (Monday-inspired)
We will build a lightweight internal design system:
- **Colors**: Vibrant status colors (Green/Done, Red/Stuck, Orange/Working), clean whites/grays.
- **Typography**: Modern sans-serif (Inter).
- **Components**:
    - `BoardCard`: For displaying items in a grid/list.
    - `StatusBadge`: Pill-shaped, colored status indicators.
    - `DashboardWidget`: Container for KPIs and Charts.
    - `MobileNav`: Bottom navigation bar for primary modules.

### Data Model (Core Entities)
- **Animal**: ID, Name, Photo, DOB, Gender, Status, Pedigree.
- **Measurement**: Date, AnimalID, Weight, LCS, HG, TP.
- **Task**: Title, DueDate, Status, Assignee, RelatedAnimalID.
- **Event**: Reproduction events (Mating, Check, Birth).

## Proposed Changes

### Project Structure
#### [NEW] /src
- **components/**: Reusable UI components.
- **pages/**: Main route views (Dashboard, Animals, Tasks).
- **context/**: Data providers (FarmContext, OfflineContext).
- **styles/**: Global CSS and variables.
- **types/**: TypeScript interfaces.
- **utils/**: Helper functions (dates, math).

### Key Modules
1.  **Dashboard**: The landing page. Widgets for "Total Animals", "Tasks Today". Graphs for "Weight Gain".
2.  **Animals**: List view (searchable). Detail view with tabs (Summary, Measurements, Pedigree).
3.  **Tasks**: List of to-dos. Simple calendar integration.

## Verification Plan

### Automated Tests
- We will use the browser preview to verify the UI responsiveness.
- We will verify offline capabilities by simulating "Offline Mode" in the browser dev tools.

### Manual Verification
- **UI Check**: Does it look like monday.com? (Clean, colorful, organized).
- **Flow Check**: Can I create an animal? Can I add a weight? Does it update the graph?
- **Offline Check**: Does data persist after a reload?
