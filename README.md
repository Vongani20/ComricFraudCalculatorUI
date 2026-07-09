# Comric Fraud Calculator UI

React frontend for the Comric Fraud Calculator backend API.

## Stack

- React 19 + TypeScript
- Vite 6
- React Router

## API specification coverage

| Screen | Backend endpoint |
|--------|------------------|
| Dashboard | `GET /api/v1/dashboard/stats` |
| Fraud Signals | `GET /api/v1/fraud-signals` |
| HR Events | `GET/POST /api/v1/hr-events` |
| MNO Events | `GET/POST /api/v1/mno-events` |
| ID Lookup | `POST /api/v1/lookup/id-check` |
| Activity Log | `GET /api/v1/activity-log` |

## Development

1. Start the backend at `http://localhost:5267` with dev auth enabled (`LocalDevelopment:UseDevAuth: true`).
2. Install dependencies and run the UI:

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the backend.

### Dev authentication

The UI sends `Authorization: Bearer dev-token` automatically. Switch tenants from the sidebar (Vodacom / MTN).

## Build

```bash
npm run build
```
