# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start       # Dev server on http://localhost:3000 (hot-reload)
npm run build   # Production build in /build
npm test        # Run tests in interactive watch mode
npm test -- --watchAll=false  # Run tests once (CI mode)
npm test -- --testPathPattern=App  # Run a single test file
```

Linting is handled automatically by `react-scripts` (no separate lint command).

## Architecture

**Stack:** React 18 + TypeScript, Create React App, Material UI, Axios

**Purpose:** Network topology dashboard showing servers and their connected WebSocket users in real time.

**Data flow:**
1. `Communication.tsx` (the only page) initializes with a host from `utils/server.ts` / `.env`
2. Fetches `GET {host}/ws-session/all` via Axios to get session data
3. Transforms raw sessions into `Server[]` (each server has `User[]`)
4. Passes the list to `ServerUserNetwork` for visualization
5. Clicking a server bubble opens a MUI modal listing that server's users

**Key data shapes:**
```ts
interface Server { id: string; users: User[] }
interface User { name: string; lastSeen: string; isOnline: boolean }
```

**Environment:**
- `REACT_APP_SERVER_URL` in `.env` sets the backend IP (e.g. `10.0.0.16`)
- The host becomes `http://{REACT_APP_SERVER_URL}:8000`
- Users can override the host at runtime via an input field in `Communication.tsx`

**Component map:**
- `src/pages/communication/Communication.tsx` — main page, data fetching, host management
- `src/components/ServerUserNetwork/` — circular bubble visualization, modal on click
- `src/components/SelectBox/` — protocol selector component (currently unused)
- `src/utils/server.ts` — `getHost()` helper reading the env var

**Styling:** mix of CSS modules (one `.css` per component) and inline styles; no theme/design-token system.

**State:** local React hooks only (`useState`, `useEffect`, `useCallback`); no global state library.
