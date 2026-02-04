# Project Overview

This is a **monorepo** project managed by [Turborepo](https://turbo.build/repo). It uses [Bun](https://bun.sh/) as the package manager and runtime.

## Architecture

The project is structured into applications and shared packages:

### Applications (`apps/`)

*   **`web`**: A Frontend application built with **Vue 3**, **Vite**, **Pinia**, and **Vue Router**.
    *   Uses **Vitest** for unit testing and **Playwright** for E2E testing.
    *   Linting provided by **ESLint** and **Oxlint**.
*   **`api`**: A backend application built with **ElysiaJS**, running on the Bun runtime.

### Packages (`packages/`)

*   **`eslint-config`**: Shared ESLint configurations.
*   **`typescript-config`**: Shared TypeScript configurations (`tsconfig.json`).

## Building and Running

### Prerequisite

Ensure you have **Bun** installed.

### Key Commands

Run these commands from the root directory:

*   **Install Dependencies**:
    ```bash
    bun install
    ```

*   **Development Server** (runs all apps in parallel):
    ```bash
    bun run dev
    ```

*   **Build** (builds all apps and packages):
    ```bash
    bun run build
    ```

*   **Lint**:
    ```bash
    bun run lint
    ```

*   **Type Check**:
    ```bash
    bun run check-types
    ```

### App-Specific Commands

You can also run commands specifically for a workspace:

**Web App (`apps/web`):**
```bash
cd apps/web
bun run dev          # Start vite dev server
bun run test:unit    # Run Vitest unit tests
bun run test:e2e     # Run Playwright E2E tests
```

**API App (`apps/api`):**
```bash
cd apps/api
bun run dev          # Start Elysia server
```

## Development Conventions

*   **Language**: The entire codebase is written in **TypeScript**.
*   **Formatting**: **Prettier** is used for code formatting.
*   **Linting**: The project uses **ESLint** and **Oxlint** (specifically in `apps/web`) to enforce code quality.
*   **Package Management**: All dependencies are managed via **Bun**.
