# Agent Rules & Operational Notes

## Build & Verification

- `pnpm build` — Next.js production build
- `pnpm dev` — Start dev server
- `pnpm lint` — ESLint check
- No explicit typecheck script; `pnpm build` catches TypeScript errors.

## Security Hardening

### Role Change Audit Guarantee

Every `profiles.role` mutation is now logged by the DB itself:

- `private.audit_role_change()` — AFTER UPDATE OF role trigger on `public.profiles`
- Fires for direct table updates, RPC calls, and API route changes
- Captures: actor_user_id, target_user_id, old_role, new_role, actor_email, target_email
- IP and user-agent are not captured at the DB level; they are considered bonus API metadata

### Preferred Mutation Path

App code should call the RPC instead of updating `profiles.role` directly:

```sql
SELECT private.change_user_role(
  target_user_id := '<uuid>',
  new_role       := 'admin'
);
```

The RPC enforces:
1. `private.is_super_admin()`
2. Not a self-role change
3. `auth.jwt()->>'aal' = 'aal2'` (MFA required)
4. Role is one of `user`, `admin`, `super_admin`

The BEFORE UPDATE trigger (`trg_profiles_protect_fields`) is defense-in-depth and repeats these checks.

### MFA Operational Requirements

1. Enable MFA in the Supabase Auth dashboard.
2. Keep at least **two** super_admin accounts with MFA enrolled to avoid lockout.
3. The mobile admin nav includes an MFA link; the desktop nav always has one.
4. If a role-change API call returns the MFA error, the admin users page toast now contains a clickable link to `/admin/security/mfa`.

## Emergency Bootstrap SQL

**Use only when all super_admins are locked out (e.g., lost MFA device).**

Run in the Supabase SQL Editor as `postgres` or service_role:

```sql
-- 1. Identify the user you want to promote
SELECT id, email FROM auth.users WHERE email = 'trusted@example.com';

-- 2. Ensure they have a profiles row
INSERT INTO public.profiles (id, email, role, full_name)
VALUES (
  '<uuid-from-step-1>',
  'trusted@example.com',
  'user',
  'Trusted Admin'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Promote to super_admin
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = '<uuid-from-step-1>';

-- 4. Verify
SELECT id, email, role FROM public.profiles WHERE id = '<uuid-from-step-1>';
```

**Access control:**
- This SQL must never be stored in the repo with real UUIDs.
- Only project owners / infrastructure admins should have `postgres` or service-role access.
- After recovery, immediately enroll MFA on the new super_admin account.

## Service Role Usage Review

Before deploying to production, verify:

- No client-side code sends the `service_role` key.
- Server-side `createAdminClient()` is only used in API routes and never forwarded to the browser.
- The `admin_role_audit_log` has no INSERT policy for authenticated/anon (SELECT-only for super_admins).
- Direct `profiles` updates by service_role bypass the BEFORE UPDATE trigger's MFA check; use service_role only for non-sensitive operations or maintenance.
