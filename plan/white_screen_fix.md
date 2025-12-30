# White Screen Fix Plan

## Goal
Fix the "white screen of death" issue where the React app renders nothing. This is caused by `AuthContext` blocking rendering while in `loading` state, combined with potential Supabase initialization failures.

## Diagnosis
- **Symptom**: Blank page, no errors in console.
- **Cause**: `AuthContext.jsx` renders `{!loading && children}`. If `loading` is true (initial state), nothing renders. If Supabase connection fails or hangs (likely due to missing/wrong `.env` vars in Vercel), it never sets `loading` to false.

## Proposed Changes

### Frontend (`price-tracker`)
#### [MODIFY] [contexts/AuthContext.jsx](file:///c:/Users/User/workspace/shopping/price-tracker/src/contexts/AuthContext.jsx)
- Add a timeout or error handling to `getSession`.
- If env vars are missing, log an error and set loading to false (to at least show *something*).

#### [MODIFY] [App.jsx](file:///c:/Users/User/workspace/shopping/price-tracker/src/App.jsx)
- Add a visual "Loading..." indicator so the user knows the app is initializing, not broken.

## Verification Plan
1.  **Local Test**: Manipulate `.env` to break Supabase connection and verify the app shows an error or loading state instead of blank screen.
2.  **Deployment**: Push changes and verify on Vercel.
