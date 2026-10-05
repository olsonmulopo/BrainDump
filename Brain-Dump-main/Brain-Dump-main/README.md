# Brain Dump 🧠 : A Visual Operating System

Brain Dump is a spatial workspace and visual operating system built to help you organize files, manage time, and stay productive. Instead of locking users into rigid folders or linear lists, Brain Dump provides an infinite canvas where modular productivity "Apps" can be freely placed, nested, and connected.

---

## 🤖 AI Assistant Context (READ FIRST)
**To any AI coding assistant reading this repository:** 
Do not treat this as a standard linear "to-do list" or "file explorer" application. 

**Core Identity & Architecture:**
* **Paradigm:** This is a **Visual Operating System** and a spatial canvas. Everything is a node or a modular "App" placed on an X/Y coordinate plane. 
* **The Canvas:** The core UI is an infinite, zoomable, and pannable grid canvas. Users can add "Rooms" (tabs) for different contexts. 
* **Modular Apps (Widgets):** Functionality is highly componentized. Users drag and drop mini-apps onto the board. When writing new features or modifying state, ensure it adheres to this modular, drag-and-drop spatial paradigm.
* **Key Use Cases:** Spatial file organization, visual planners, embedded calendars, time-blocking, and nested sub-boards.

---

## 🌟 Core Features

Brain Dump acts as a host environment for various productivity primitives. The current modular "Apps" available on the canvas include:

### 🗂️ Spatial File & Data Organization
* **Folder App:** A designated box to cleanly drop, store, and organize files.
* **File App:** Upload and attach documents directly to the canvas.
* **Table App:** Lightweight data spreadsheets.
* **Image & Link Apps:** Add visual photos, graphics, web links, and rich previews.
* **Board App:** Create nested sub-canvases (boards within boards) for infinite depth.
* **Column App:** Vertical containers to structure unstructured widgets.

### ⏱️ Time Management & Planners
* **Calendar App:** Comprehensive month, week, and deadline planner.
* **Timer App:** Integrated task clocks and focus countdowns (Pomodoro).
* **Time Tracker:** Global time-tracking overhead.

### 📝 Notes & Ideation
* **Note App:** Rich text editor with checklists.
* **MD (Markdown) App:** Visual markdown editor with invisible commands.
* **Task App:** Spatial to-do checklists.
* **Sketch App:** Freehand pen drawing directly on the grid.
* **Title App:** Large board headings to separate spatial zones.

## 🛠️ Technical Overview
* **Architecture:** Canvas-based rendering with zoom/pan functionality (`Fit View`, `100%`).
* **Grid System:** Supports Canvas Settings like Grid snapping and Background adjustments.
* **Data Persistence:** Supports local state, Google Sign-in for cloud syncing, and manual data Export.

## 🚀 Getting Started

*(Note to developer: Add your standard installation steps here based on your package.json, e.g., npm install, npm run dev)*

```bash
# Clone the repository
git clone [https://github.com/yourusername/brain-dump.git](https://github.com/yourusername/brain-dump.git)

# Install dependencies
npm install

# Start the development server
npm run dev
