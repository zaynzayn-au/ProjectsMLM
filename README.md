# ProjectsMLM

Real-time Project Intelligence and Workflow Tracker for Mac.

A native macOS desktop application that tracks project development progress across seven stages, featuring recursive file scanning, automatic polling, persistent SQLite storage, and a beautiful glassmorphism UI.

## Features

- 📊 **7-Stage Progress Tracking** – Visualize project development stages
- 🔍 **Recursive File Scanning** – Automatic deep scanning of project directories
- ⚡ **Real-time Watching** – Automatic polling for file changes
- 💾 **Persistent Storage** – SQLite-based data persistence
- 🎨 **Glassmorphism UI** – Modern, sleek design with blur effects
- 🔎 **Search & Filter** – Quickly find projects and files

## Tech Stack

- **Electron** + **React** + **TypeScript**
- **Vite** (via electron-vite)
- **sql.js** for SQLite
- **Tailwind CSS** for styling
- **Motion** (Framer Motion) for animations

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
npm run package
```
