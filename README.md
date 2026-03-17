# ontime! - Gamified Academic Portal

## Table of Contents

- [Description](#description)
- [Feature Overview & Usage](#feature-overview--usage)
- [Getting Started](#getting-started)
- [Technical Architecture](#technical-architecture)
- [Repository Structure](#repository-structure)

## Description

![ontime! logo](/Users/hafizfs/Documents/comp_repo/wdc/public/branding/logo.webp)

**ontime!** is a high-performance, gamified productivity and task management
website designed specifically for students and academic management. It
transforms mundane task tracking and study sessions into an engaging, RPG-like
experience. Featuring a modern, premium UI with real-time tracking, it motivates
users to stay on top of their academic responsibilities through experience
points (XP), levels, and dynamic visual feedback.

## Feature Overview & Usage

- **Watchlist**:
  - Centralized dashboard to view urgent tasks, upcoming classes, and recent
    notifications.
  - Generate AI-assisted study plans and seamlessly synchronize deadlines with
    Google Calendar.
    ![Watchlist Overview](/Users/hafizfs/Documents/comp_repo/wdc/assets/recordings/watchlist_record_1773711660905.webp)

- **Study Manager**:
  - Manage course schedules with a dynamic time-block grid and optimization
    logic.
  - Track detailed topics and confidence levels for each academic course.
    ![Study Manager](/Users/hafizfs/Documents/comp_repo/wdc/assets/recordings/study_manager_record_1773711785833.webp)

- **Skill Tree**:
  - Visualize your academic curriculum as an RPG-style Skill Tree.
  - Expand and navigate interconnected courses and prerequisites dynamically.
    ![Skill Tree](/Users/hafizfs/Documents/comp_repo/wdc/assets/recordings/skill_tree_record_1773713051868.webp)

- **Task Board**:
  - A dynamic, masonry-grid "Bounty Board" replacing traditional Kanban boards.
  - Tasks are categorized by rarity (Legendary, Rare, Common) with animated
    urgency indicators (glowing borders for critical deadlines).
  - Expandable mission cards reveal strategic tips based on task type
    (Assignment, Quiz, Exam).
  - Satisfying gamified completion animations (CLEARED stamp) before moving
    tasks to the Archive view.
    ![Task Board Overview](/Users/hafizfs/Documents/comp_repo/wdc/assets/recordings/task_board_record_1773713745568.webp)

- **Study Arena (Focus Timer)**:
  - Log dedicated study sessions for specific courses with focus tracking.
  - Measure learning efficiency and gain XP based on session quality.
    ![Study Arena Focus](/Users/hafizfs/Documents/comp_repo/wdc/assets/recordings/study_arena_record_1773715804503.webp)

- **Guild Hall (P2P Group Chat)**:
  - **Zero-Persistence**: Real-time serverless communication using PeerJS.
  - **Secure Room Management**: Dynamic Host/Client architecture with kick,
    rename, and admin promotion capabilities.
  - **Seamless Joining**: Join via Invite Links or integrated QR Code scanning.
    ![Guild Hall Chat](/Users/hafizfs/Documents/comp_repo/wdc/assets/recordings/guild_hall_record_1773717084267.webp)

- **Player Profile**:
  - Real-time summary of your academic progress, current level, and total XP.
  - Interactive charts displaying 14-day study streaks and task completion
    rates.
  - **PDF Semester Report**: Generate a professionally formatted PDF report
    containing semester summaries, task audits, and study history.
    ![Player Profile Analytics](/Users/hafizfs/Documents/comp_repo/wdc/assets/recordings/player_profile_record_1773717229010.webp)

- **Premium Aesthetics**:
  - Built with Tailwind CSS v4's architecture, utilizing glassmorphism, pulse
    animations, and curated accessible color palettes.
  - Fully responsive, mobile-first design (Handheld HUD) with seamless switching
    between visually stunning Light and Dark modes.

## Getting Started

Ensure you have Node.js installed, then run the following commands to set up the
project locally:

```bash
# Install toolchain and dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technical Architecture

This project follows a pure frontend philosophy, optimized for speed and
reliability:

1. **Frontend Only**: No backend server or traditional database is required.
   State is persisted client-side using Zustand with persistence middleware.
2. **CDN-First Strategy**:
   - Almost all runtime libraries (React, React Router, Lucide, Zustand, PeerJS,
     jspdf, etc.) are served via CDNs (esm.sh) to ensure minimum bundle size and
     maximum delivery speed.
   - Vite is configured with `resolve.alias` to map standard imports directly to
     their respective CDN URLs during both development and build.
3. **Optimized Build**:
   - **TypeScript**: Full type safety across all components and stores.
   - **SWC**: Used for extremely fast builds and Hot Module Replacement (HMR).
   - **Tailwind CSS v4**: Implemented via the latest `@tailwindcss/vite` plugin
     for a modern and highly efficient CSS architecture.
4. **Developer Experience**:
   - All runtime dependencies are listed in `devDependencies` in `package.json`
     to provide local linting support and TypeScript definitions, while actual
     production code runs via CDN.

## Repository Structure

- `/src/features/`: Component-based feature implementation (Analytics, Profile,
  Tasks/MissionBoard, Study, Chat).
- `/src/store/`: Zustand state management with local persistence capabilities.
- `/src/components/ui/`: Reusable primitive components (Modals, Skeletons,
  Notifications).
- `/src/styles/`: Global Tailwind v4 architecture and custom themes/CSS
  variables.

---

Built by Crownless Monarch for WDC iFest14 UDINUS
