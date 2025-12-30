# Deployment Preparation Plan

## Goal
Prepare the Frontend (`price-tracker`) for deployment to Vercel by replacing hardcoded API URLs with environment variables.

## User Review Required
No major design changes. Just configuration externalization.

## Proposed Changes

### Frontend (`price-tracker`)
#### [MODIFY] [Dashboard.jsx](file:///c:/Users/User/workspace/shopping/price-tracker/src/Dashboard.jsx)
- Replace `const API_BASE_URL = 'http://localhost:3001/api';` with:
- `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';`

#### [NEW] [.env](file:///c:/Users/User/workspace/shopping/price-tracker/.env)
- Add `VITE_API_URL=http://localhost:3001/api` (Already created, just appending if missing).

## Verification Plan
1.  **Local Test**: Run `npm run dev` and ensure frontend still connects to local backend.
2.  **Build Test**: Run `npm run build` to ensure no build errors.
