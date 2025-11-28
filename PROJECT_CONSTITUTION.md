# PROJECT CONSTITUTION
 
## 1. General Information
 
- **Project**: pbc-red-forge
- **Purpose**: frontend single-page application (SPA) based on Vite + React + TypeScript + shadcn/ui.
- **Production build output**: `dist` directory in the project root.

## 2. Technology Stack

- **Bundler**: Vite
- **Language**: TypeScript
- **UI library**: React
- **Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer

## 3. Repository Structure (Baseline)

- `src/` — application source code (components, pages, routing, hooks, utilities).
- `public/` — static assets.
- `dist/` — production build output (created by `npm run build`).
- `package.json` — scripts, dependencies, and project metadata.
- `vite.config.*` — Vite configuration.
- `tailwind.config.*` — Tailwind CSS configuration.

## 4. Local Development

All commands are executed from the project root directory `pbc-red-forge`.

- **Install dependencies**:
  - `npm install`

- **Run dev server** (development):
  - `npm run dev`

- **Build production bundle**:
  - `npm run build`

- **Preview production build locally**:
  - `npm run preview`

## 5. Git Workflow

Local workflow before pushing changes to the remote repository:

1. Check repository status:
   - `git status`
2. Add all modified files:
   - `git add .`
3. Commit changes with a message:
   - `git commit -m "feat: new implement"`
4. Push changes to the remote repository (branch `main`):
   - `git push`

## 6. Server Update and Build

On the deployment server the project is located at:

- `/mnt/d/pbc.red/public_html/pbc-red-forge`

The command for updating the code and rebuilding the project on the server can be executed from any directory:

- `cd /mnt/d/pbc.red/public_html/pbc-red-forge && git pull origin main && npm install && npm run build`

This command:

1. Changes directory to the project root.
2. Pulls the latest changes from the `main` branch of the remote repository.
3. Updates dependencies.
4. Builds the production bundle into the `dist` directory.
