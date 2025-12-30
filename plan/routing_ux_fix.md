# Routing & Auth UX Improvement Plan

## Goal
Change the application flow so the main URL (`/`) is accessible to everyone. Users should only be prompted to login when they explicitly choose to, or when accessing protected features.

## Proposed Changes

### Frontend (`price-tracker`)
#### [MODIFY] [App.jsx](file:///c:/Users/User/workspace/shopping/price-tracker/src/App.jsx)
- Remove `ProtectedRoute` wrapper from the `/` route.
- Redirect `*` to `/` (keep as involves).

#### [MODIFY] [Dashboard.jsx](file:///c:/Users/User/workspace/shopping/price-tracker/src/Dashboard.jsx)
- Update Header:
    - If `user` is present, show "Logout" and User Email.
    - If `user` is null, show "Login" / "Signup" buttons.
- Update Data Fetching:
    - If `!user`, either fetch nothing (show welcome message) or fetch public sample data. (For now, likely fetch nothing and show "Login to see your items").
    - Ensure `fetchProducts` doesn't crash if 401 is returned (though public API might allow read-only or empty).
- Update Interactions:
    - Search/Add/Edit Memo: Prompt for login if `!user`.

## Verification Plan
1.  **Local Test**: Sign out and visit `/`. Should see Dashboard with Login button.
2.  **Navigation**: Click Login -> Go to Login Page.
3.  **Deployment**: Push to Vercel.
