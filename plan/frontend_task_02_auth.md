# Frontend Task: Authentication UI & Integration

> **Objective**: Implement Login/Signup UI and integrate with Supabase Auth.

## 1. Setup Supabase Auth
- **Client Initialization**: Ensure `supabaseClient.js` is correctly configured for Auth.
- **Auth Context (`contexts/AuthContext.jsx`)**:
    - Create a Context Provider to manage `session` and `user` state.
    - Use `supabase.auth.getSession()` on mount and `supabase.auth.onAuthStateChange()` for updates.
    - Provide `signIn`, `signUp`, `signOut` functions via Context.

## 2. UI Implementation
- **Pages**:
    - `pages/Login.jsx`: Email/Password input form.
    - `pages/Signup.jsx`: Email/Password input form (simple).
- **Components**:
    - Update `Header.jsx`:
        - If logged in: Show "Profile" (or Avatar) and "Logout" button.
        - If logged out: Show "Login" button.
- **Routing (`App.jsx`)**:
    - Implement `ProtectedRoute` component to wrap private routes (e.g., `/my-list`, `/my-memo`).
    - Redirect unauthenticated users to `/login`.

## 3. Integration & Testing
- **API Calls**:
    - Update API client (`axios` interceptor or helper) to include `Authorization: Bearer <token>` header in requests.
    - Token should be retrieved from the current session.
- **Verification**:
    - Test Sign Up -> Login -> Access Private Route -> Logout flow.

## Reference
- See `plan/member_management_plan.md` for full context.
