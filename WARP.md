# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This repository contains a small full-stack TypeScript application split into two Node-based projects:

- `backend/`: Express + TypeScript REST API backed by MongoDB and JWT-based authentication.
- `frontend/`: React + TypeScript application bootstrapped with Vite, using React Router and React Query.

The backend exposes authentication and user endpoints; the frontend consumes them via an Axios client configured with a `VITE_API_URL` base URL and a bearer token stored in `localStorage`.

## How to Run and Build

All commands below are run from the project root unless otherwise noted.

### Backend (Express API)

From `backend/`:

- Install dependencies:
  - `cd backend && npm install`
- Start in development mode (reload on changes):
  - `cd backend && npm run dev`
- Start API in development mode with relaxed CORS for API tools (e.g. Postman):
  - `cd backend && npm run dev:api`
- Build TypeScript to JavaScript (`dist/`):
  - `cd backend && npm run build`
- Run the built server:
  - `cd backend && npm start`
- Kill stray Node processes on Windows (used by this project):
  - `cd backend && npm run kill`

**Environment variables expected by the backend:**

- `MONGO_URI`: MongoDB connection string used by `connectDB` in `src/config/db.ts`.
- `JWT_SECRET`: Secret key for signing and verifying JWTs in `src/utils/jwt.ts` and `src/middleware/auth.ts`.
- `FRONTEND_URL`: Allowed frontend origin for CORS in `src/config/cors.ts`.

For local development, set `FRONTEND_URL` to the frontend dev server origin (for example, `http://localhost:5173`). When running `npm run dev:api` the CORS whitelist is expanded to allow requests without an `Origin` header (useful for tools like Postman).

### Frontend (React + Vite)

From `frontend/`:

- Install dependencies:
  - `cd frontend && npm install`
- Start development server:
  - `cd frontend && npm run dev`
- Build for production:
  - `cd frontend && npm run build`
- Lint the codebase:
  - `cd frontend && npm run lint`
- Preview the production build locally:
  - `cd frontend && npm run preview`

**Environment variables expected by the frontend:**

- `VITE_API_URL`: Base URL for Axios in `src/config/axios.ts` (e.g. the backend’s origin).

The frontend stores the authentication token returned from `POST /auth/login` under the `localStorage` key `AUTH_TOKEN`; the Axios client automatically attaches it as a `Bearer` token on subsequent requests.

### Testing

There are currently no test scripts defined in either `backend/package.json` or `frontend/package.json`. If you add a test runner (e.g. Vitest, Jest), also add the appropriate `test` and single-test commands here for future Warp usage.

## Backend Architecture

### Entry point and server setup

- `backend/src/index.ts` is the Node entry point. It reads `PORT` from the environment (defaulting to `4000`) and calls `server.listen(port, ...)`.
- `backend/src/server.ts` is responsible for:
  - Connecting to MongoDB via `connectDB` from `src/config/db.ts`.
  - Creating the Express app instance.
  - Applying CORS middleware with `corsConfig` from `src/config/cors.ts`.
  - Enabling JSON body parsing.
  - Mounting the main router from `src/router.ts` at the root path (`/`).

### Configuration

- `src/config/db.ts`
  - Exposes `connectDB`, which validates `MONGO_URI`, connects via Mongoose, and logs connection details.
  - Exits the process early with a readable error if `MONGO_URI` is missing or the connection fails.
- `src/config/cors.ts`
  - Exports `corsConfig`, a `CorsOptions` object.
  - Builds a whitelist from `process.env.FRONTEND_URL` and, when the process is started with the `--api` flag (via `npm run dev:api`), also allows requests without an origin (for API tools).
  - Rejects non-whitelisted origins with a CORS error.

### Routing and request lifecycle

- `src/router.ts` defines the HTTP routing layer using `express.Router()`:
  - `POST /auth/register`
    - Validates `handle`, `name`, `email`, and `password` via `express-validator`.
    - Delegates to `createAcount` in `src/handlers/index.ts`.
  - `POST /auth/login`
    - Validates `email` and `password`.
    - Delegates to `login` in `src/handlers/index.ts`.
  - `GET /user`
    - Protected by the `authenticate` middleware in `src/middleware/auth.ts`.
    - Delegates to `getUser` in `src/handlers/index.ts`.
  - Both auth routes share the `handleInputErrors` middleware from `src/middleware/validation.ts` to return validation failures as `400` responses.

### Handlers

All handlers live in `src/handlers/index.ts`:

- `createAcount`
  - Checks for existing users by `email` and by a slugified `handle` (using `slug`), returning `409` conflicts on duplicates.
  - Hashes the plaintext password using `hashPassword` from `src/utils/auth.ts`.
  - Assigns a normalized, slugified handle to the user.
  - Persists the `User` document via the Mongoose model and returns a `201` status on success.
- `login`
  - Relies on `express-validator` results from the route definition; early-returns `400` on validation errors.
  - Looks up the user by `email`; returns `404` if not found.
  - Uses `checkPassword` from `src/utils/auth.ts` to compare the submitted password with the stored hash; returns `401` on mismatch.
  - Generates a JWT using `generateJWT` from `src/utils/jwt.ts` with the user’s `_id` as the payload, then returns the token.
- `getUser`
  - Assumes `authenticate` has attached a `user` object to the request and returns it as JSON.

### Middleware

- `src/middleware/validation.ts`
  - `handleInputErrors` runs `validationResult` from `express-validator` and, if any validation issues are present, returns a `400` with the error array; otherwise it calls `next()`.
- `src/middleware/auth.ts`
  - Extends `Express.Request` globally to include an optional `user?: IUser` property.
  - `authenticate` middleware:
    - Reads the `Authorization` header, expecting a `Bearer <token>` format.
    - Verifies the token with `jwt.verify` using `process.env.JWT_SECRET`.
    - Looks up the user by the embedded `id` and attaches the user (without password) to `req.user`.
    - Returns `401` when the header or token is missing, `404` if the user does not exist, and `500` on token verification errors.

### Data and utilities

- `src/models/User.ts`
  - Defines the `IUser` TypeScript interface and the Mongoose schema/model for users.
  - Ensures `handle` and `email` are unique, lowercased (for `handle`), and trimmed.
- `src/utils/auth.ts`
  - `hashPassword` uses `bcrypt` with a salt rounds value of `10`.
  - `checkPassword` compares a plaintext password with a hashed value.
- `src/utils/jwt.ts`
  - `generateJWT` signs a payload with `JWT_SECRET` and a long-lived expiration (`180d`).

### TypeScript configuration

- `backend/tsconfig.json`:
  - Compiles from `src/` to `dist/` targeting modern Node (`es2020`, `module` = `CommonJS`).
  - Enables `esModuleInterop` to allow default imports of CommonJS modules.

## Frontend Architecture

### Application bootstrap

- `frontend/src/main.tsx`
  - Creates a `QueryClient` from React Query and wraps the app with `QueryClientProvider`.
  - Renders the application’s routing tree provided by `frontend/src/router.tsx`.
  - Includes `ReactQueryDevtools` for debugging queries.

### Routing and layouts

- `frontend/src/router.tsx`
  - Wraps routes in `<BrowserRouter>` and defines two main route groups:
    - `AuthLayout` (`src/layouts/AuthLayoutFixed.tsx`) for `/auth/login` and `/auth/register`.
    - `AppLayout` (`src/layouts/AppLayout.tsx`) for the authenticated `admin` area.
  - Routes:
    - `/auth/login` → `LoginView`.
    - `/auth/register` → `RegisterView`.
    - `/admin` (index) → `LinkTreeView`.
    - `/admin/profile` → `ProfileView`.
- `frontend/src/layouts/AuthLayoutFixed.tsx`
  - Provides a fixed auth layout with the logo and an `<Outlet>` where auth views render.
  - Mounts a `Toaster` from `sonner` for toast notifications.
- `frontend/src/layouts/AppLayout.tsx`
  - Uses React Query’s `useQuery` to call `getUser` from `src/api/DevTreeAPI.ts`.
  - While loading, shows a basic loading state; on error, redirects to `/auth/login`.
  - On success, renders the main `DevTree` component with the fetched `User` data.

### API integration

- `frontend/src/config/axios.ts`
  - Creates an Axios instance with:
    - `baseURL` from `import.meta.env.VITE_API_URL`.
    - Default `Content-Type: application/json` header.
  - Request interceptor:
    - Reads `AUTH_TOKEN` from `localStorage`.
    - If present, sets `Authorization: Bearer <token>` on outgoing requests.
- `frontend/src/api/DevTreeAPI.ts`
  - Exposes `getUser`, which calls `GET /user` using the above Axios instance and returns a typed `User`.
  - On Axios errors with a response, throws an `Error` with the backend-provided `error` message for the caller to handle.

### Views and components

- `frontend/src/views/LoginView.tsx`
  - Uses `react-hook-form` to manage the login form.
  - On submit, posts credentials to `/auth/login` via the shared Axios instance.
  - On success, saves the returned JWT into `localStorage` under `AUTH_TOKEN`.
  - On backend error, displays a toast with the error message.
- `frontend/src/views/RegisterView.tsx`
  - Uses `react-hook-form` for registration, including:
    - Basic required-field validation for name, email, handle, and password.
    - Password length validation and password confirmation via `watch`.
  - On submit, posts to `/auth/register`; on success, shows a success toast and resets the form; on error, shows a toast with the backend message.
- `frontend/src/views/ProfileView.tsx`
  - Placeholder form for editing profile information (handle, description, image upload). Submission and change handlers are currently stubs.
- `frontend/src/views/LinkTreeView.tsx`
  - Placeholder view for the main link tree configuration area.
- `frontend/src/components/DevTree.tsx`
  - Authenticated shell for the admin area:
    - Renders header with logo and a “Cerrar Sesión” button stub.
    - Includes `NavigationTabs` for switching between `Links` and `Mi Perfil` routes.
    - Displays an `<Outlet>` for the active nested route and a side panel placeholder.
    - Shows a link labeled `Visitar Mi Perfil: /{handle}`, using the `handle` from the `User` object.
- `frontend/src/components/NavigationTabs.tsx`
  - Centralizes the definition of primary app tabs (`/admin`, `/admin/profile`).
  - Uses both a `<select>` (mobile) and a tabbed navigation bar (desktop), with active-tab styling based on `location.pathname`.
- `frontend/src/components/ErrorMessage.tsx`
  - Simple presentational component used by forms to display validation messages.

### Types and configuration

- `frontend/src/types/index.ts`
  - Defines `User`, `RegisterForm`, and `LoginForm` types shared across views and API code.
- `frontend/vite.config.ts`
  - Basic Vite configuration using the React SWC plugin.
- TypeScript is configured via a project reference setup (`tsconfig.json` referencing `tsconfig.app.json` and `tsconfig.node.json`).

## Cross-Cutting Concerns and Conventions

- Authentication is JWT-based end-to-end:
  - Backend issues tokens via `generateJWT` and protects routes via `authenticate`.
  - Frontend persists tokens in `localStorage` under `AUTH_TOKEN` and attaches them automatically via Axios interceptors.
- CORS is tightly coupled to the `FRONTEND_URL` and the `--api` flag. When debugging CORS issues, check:
  - That `FRONTEND_URL` matches the exact origin of the frontend (including protocol and port).
  - Whether the backend was started with `npm run dev` or `npm run dev:api`.
- Error messaging between backend and frontend is primarily string-based:
  - Backend typically responds with `{ error: string }` on auth failures.
  - Frontend error handling expects this shape when displaying toasts or raising errors from API utilities.
