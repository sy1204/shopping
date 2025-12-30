# Backend Task: Authentication Implementation

> **Objective**: Secure the API and Database using Supabase Auth and RLS.

## 1. Database Migration (Supabase)
- **Modify `subscriptions` Table**:
    - Add `user_id` column (UUID, Foreign Key to `auth.users.id`).
    - Update existing records (if any) to a default user or handle migration strategy.
- **Enable RLS (Row Level Security)**:
    - **`subscriptions`**: Allow SELECT/INSERT/UPDATE/DELETE only if `auth.uid() = user_id`.
    - **`products` & `product_links`**:
        - SELECT: Allow public access (`true`).
        - INSERT/UPDATE: Allow only authenticated users.
- **SQL Script**: Save the migration SQL in a file (e.g., `migrations/01_auth_setup.sql`) for reference.

## 2. API Security (Express Middleware)
- **Create Middleware (`middleware/auth.js`)**:
    - Extract `Bearer Token` from Authorization header.
    - Verify token using Supabase Client (`supabase.auth.getUser(token)`).
    - If valid, attach `user` object to `req`.
    - If invalid, return 401 Unauthorized.
- **Apply Middleware**:
    - Apply to routes in `routes/subscription.js`.
    - Modify `GET /api/subscriptions` to filter results by `req.user.id`.
    - Modify `POST /api/subscriptions` to inject `req.user.id` into the insert payload.

## Reference
- See `plan/member_management_plan.md` for full context.
