# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a client-side JavaScript application that runs directly in the browser - no build tools or package managers are required.

**To run the application:**
- Open `index.html` directly in a web browser
- Use a local development server like `python -m http.server 8000` or `npx serve .` for better development experience

**No build, lint, or test commands** - this is a static HTML/CSS/JS application.

## Architecture Overview

This is a **modular client-side dashboard** for a furniture manufacturing order management system (WoodCraft). The application is built with vanilla JavaScript using a module pattern.

### Core Architecture

**Main Application Module (`main.js`):**
- Entry point that orchestrates all other modules
- Handles device detection (mobile/tablet/desktop)
- Manages global event listeners and application lifecycle
- Provides development helpers in localhost environment

**Module System:**
The application uses a custom module initialization system where each module exports functions to `window`:
- `window.tableModule` - Table display and pagination
- `window.filtersModule` - Search and filtering functionality  
- `window.popupsModule` - Modal dialogs and forms

**Initialization Order:**
1. Demo data loading (`demo-data.js`)
2. Modal system (`popups.js`)  
3. Table functionality (`table.js`)
4. Filters and search (`filters.js`)

### Key Modules

**Table Module (`table.js`):**
- Renders both desktop table and mobile card views
- Handles sorting, pagination, and responsive display
- Manages order actions (view, edit, duplicate, archive)
- Exports to CSV functionality

**Filters Module (`filters.js`):**
- Search functionality with debounced input
- Status, project, and date range filtering
- Real-time statistics updates
- Active filter indicators

**Popups Module (`popups.js`):**
- Modal dialog management
- Order creation and editing forms
- Confirmation dialogs and notifications
- Form validation and dirty state tracking

**Demo Data (`demo-data.js`):**
- Complete mock dataset for furniture orders
- Helper functions for data manipulation
- Status management and statistics

### UI Framework

**Responsive Design:**
- Mobile-first approach with breakpoints at 768px and 1024px
- Dynamic CSS classes added to body: `.mobile`, `.tablet`, `.desktop`
- Separate rendering paths for mobile cards vs desktop tables

**Status System:**
Orders have 4 states: `draft`, `submitted`, `approved`, `revision`
Each status has specific UI styling and available actions.

### Key Patterns

**Global Function Access:**
All user-facing functions are attached to `window` for HTML onclick handlers:
```javascript
window.viewOrder = (id) => window.popupsModule?.viewOrder(id);
window.sortTable = (column) => window.tableModule?.sortTable(column);
```

**Module Communication:**
Modules communicate through the global `window` object and shared data structures.

**Error Handling:**
- Global error handlers for uncaught exceptions
- Graceful degradation when modules fail to load
- Retry mechanisms for data loading

### Development Notes

- All text is in Russian (furniture industry client application)
- Uses Font Awesome for icons
- No external CSS frameworks - custom CSS with CSS Grid and Flexbox
- Performance monitoring for long tasks and memory usage
- Accessibility features included (skip links, ARIA labels, keyboard navigation)

### Data Flow

1. `demo-data.js` loads mock data
2. `filters.js` processes and filters the data  
3. `table.js` renders the filtered results
4. User interactions trigger updates through the module system

This is a **mockup/prototype** application demonstrating order management UI patterns for a CNC furniture manufacturing workflow.