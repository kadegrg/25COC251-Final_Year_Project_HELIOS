# 25COC251 Final Year Project Coursework

This repository contains my coursework submission for 25COC251 Final Year Project at Loughborough University.  
Final mark: Awaiting Mark/100

HELIOS is a full-stack web application for inventory and access management, combining a TypeScript/Express backend API with a React frontend to support secure authentication, permissions-driven workflows, and operational stock management features.

## Project Summary

The project implements an inventory-focused platform with a modular architecture across backend and frontend codebases. The backend provides REST-style API endpoints, request context handling, security middleware, rate limiting, site-aware context resolution, and plugin route support. It is structured into domain modules including authentication, IAM, inventory, MFA, password, sessions, and audit. The frontend uses React with routed pages and API hooks to deliver user-facing workflows such as login, password reset, dashboard views, IAM management, inventory structure, stock movements, transfers, adjustments, and plugin pages. Data fetching is organised through React Query, and state is managed where needed with Zustand.

## Main Features

- Secure API foundation with Helmet, CORS controls, cookie parsing, global error handling, and API rate limiting.
- Authentication and identity flows, including password reset and MFA/WebAuthn-related backend modules.
- Inventory operations support through dedicated frontend pages and backend module structure (stock movements, transfers, adjustments, and inventory structure).

## Skills Demonstrated

This coursework helped develop skills in:

- Full-stack TypeScript application design across separate frontend and backend services.
- Secure web application engineering (authentication, middleware layering, and request protection patterns).
- Modular software architecture using domain-based modules, reusable hooks, and API abstraction layers.

## Files

| File | Description |
|---|---|
| `README.md` | Repository overview and coursework context. |
| `helios-backend/src/app.ts` | Express app composition, middleware pipeline, API routing, plugin route mounting, and global handlers. |
| `helios-backend/src/server.ts` | Backend server entry point and runtime start-up wiring. |
| `helios-backend/src/routes/index.ts` | Main API route aggregation for versioned backend endpoints. |
| `helios-backend/src/modules/auth/` | Authentication-related backend domain logic and endpoints. |
| `helios-backend/src/modules/inventory/` | Core inventory domain implementation on the backend. |
| `helios-frontend/src/router.tsx` | Frontend route configuration and page-level navigation structure. |
| `helios-frontend/src/App.tsx` | Root React application setup with router and React Query provider. |
| `helios-frontend/src/hooks/` | Frontend data-access hooks for adjustments, IAM, plugins, inventory structure, stock movements, transfers, and related features. |
| `helios-frontend/src/pages/` | User-facing page implementations for authentication, dashboard, IAM, inventory, transfers, stock movements, adjustments, and plugins. |

## Technologies / Tools

- TypeScript
- Node.js
- Express
- PostgreSQL (`pg`)
- React
- React Router
- TanStack React Query
- Vite
- Zustand
- Zod
- Vitest
- ESLint / Prettier

## Notes

- The repository is split into two main applications: `helios-backend` and `helios-frontend`.
- Backend code indicates a strong emphasis on security and operational safeguards (rate limiting, headers, structured error handling, and context middleware).
- A plugin-oriented extension mechanism is present in the backend (`/api/v1/plugins`), suggesting support for feature extensibility.
- As this is a coursework submission, the included file list is intentionally selective and highlights only key implementation areas.