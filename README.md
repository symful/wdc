# StudiKu - WDC Productivity Dashboard

StudiKu is a high-performance productivity dashboard designed for students and academic management. It features a modern UI, real-time tracking, and functional scheduling logic.

## Features

- **Advanced Analytics Dashboard**: Real-time summary of study hours, task completion, and academic focus intensity via a dynamic heatmap.
- **Project Scheduling (Kanban & Grid)**:
    - **Draggable Kanban Board** for task management with deadline urgency tracking and weighted task priority.
    - **Dynamic Time-Block Grid** for weekly scheduling with optimization logic to organize your week.
- **Focus Timer**: Log dedicated study sessions for specific courses with confidence-level tracking to measure learning efficiency.
- **Premium Aesthetics**: Built with Tailwind CSS v4's architecture, utilizing glassmorphism, pulse animations, and custom gradients.
- **Performance Optimized**: Built with lazy loading and skeleton screens for instantaneous sub-module transitions.

## Technical Architecture

This project follows a pure frontend philosophy:

1. **Frontend Only**: No backend server or traditional database is required. State is persisted client-side using Zustand with persistence middleware.
2. **CDN-First Strategy**: 
    - Almost all runtime libraries (React, React Router, Lucide, Zustand, etc.) are served via CDNs (esm.sh) to ensure minimum bundle size.
    - Vite is configured with `resolve.alias` to map standard imports directly to their respective CDN URLs during both development and build.
3. **Optimized Build**:
    - **TypeScript**: Full type safety across all components and stores.
    - **SWC**: Used for extremely fast builds and HMR.
    - **Tailwind CSS v4**: Implemented via the latest `@tailwindcss/vite` plugin for a modern CSS architecture.
4. **Developer Experience**:
    - All runtime dependencies are listed in `devDependencies` in `package.json` to provide local linting support and TypeScript definitions, while actual production code runs via CDN.

## Getting Started

Ensure you have Node.js installed, then run:

```bash
# Install toolchain
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Repository Structure

- `/src/features/`: Component-based feature implementation (Analytics, Schedule, Tasks, Study).
- `/src/store/`: Zustand state management with persistence.
- `/src/components/ui/`: Reusable primitive components (Modals, Skeletons).
- `/src/styles/`: Global Tailwind v4 architecture and custom themes.

---
Built for WDC UDINUS.
