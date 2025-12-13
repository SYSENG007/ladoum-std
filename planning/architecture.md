# Architecture & File Structure - Ladoum STD

## 1. Technical Architecture

We are building a **Progressive Web App (PWA)** with a "Local-First" (Offline-First) architecture.

### Tech Stack
-   **Frontend Framework**: React 18 (via Vite)
-   **Language**: TypeScript
-   **Styling**: Vanilla CSS with CSS Variables (for the Monday.com design system) + Tailwind Utility Classes (via `clsx`/`tailwind-merge` for component variants).
-   **Routing**: React Router DOM v6.

### Data Layer (Offline-First)
Instead of fetching data from a remote API every time, the app talks directly to a **local database** inside the browser.
-   **Database**: IndexedDB (via `idb` library).
-   **State Management**: React Context (`DatabaseContext`) acts as the bridge between the UI and IndexedDB.
-   **Sync Strategy**: Currently local-only. Future phases will implement a "Sync Engine" to push local changes to a cloud server when online.

**Data Flow:**
`UI Component` -> `useDatabase()` -> `DatabaseContext` -> `IndexedDB`

## 2. File Structure

The project follows a feature-based and component-based structure inside `/src`.

```
/src
├── /components         # Reusable UI building blocks
│   ├── /ui             # Atomic components (Button, Card, Badge)
│   ├── /dashboard      # Dashboard-specific widgets (StatCard, GrowthChart)
│   └── Layout.tsx      # Main app shell (Header + Bottom Nav)
│
├── /context            # Global state providers
│   └── DatabaseContext.tsx  # Handles all data CRUD operations
│
├── /pages              # Main route views
│   ├── Dashboard.tsx   # Home screen with KPIs
│   ├── Animals.tsx     # List of animals
│   ├── AnimalDetail.tsx# Individual animal profile
│   └── Tasks.tsx       # Task management board
│
├── /types              # TypeScript definitions
│   └── index.ts        # Shared interfaces (Animal, Task, Measurement)
│
├── /utils              # Helper functions
│   └── db.ts           # Database initialization and schema
│
├── App.tsx             # Route definitions
├── main.tsx            # Entry point
└── index.css           # Global styles & Design System variables
```

## 3. Key Design Decisions

-   **Mobile-First**: The `Layout.tsx` is designed with a bottom navigation bar, standard for mobile apps, rather than a sidebar.
-   **Monday.com Aesthetic**: We use a specific color palette defined in `index.css` (`--color-primary`, `--color-success`, etc.) to mimic the clean, professional look of Monday.com.
-   **Performance**: By using IndexedDB, the app loads instantly because it doesn't wait for network requests.
