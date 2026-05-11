# Authentication

This document covers the complete authentication system used in Zivana web — how magic links work, why the implicit flow was chosen, how sessions are managed, and how auth checks are implemented across the portal and admin panel.

---

## Overview

Zivana uses **passwordless magic link authentication** powered by Supabase. There are no passwords. A user enters their email, receives a link, clicks it, and is signed in. The link works on any browser and any device.

There are two types of authenticated users:

| Type | How they sign in | Where they land |
|---|---|---|
| Contributors | Magic link via `/contribute/signin` | `/contribute/dashboard` |
| Core team members | Magic link via `/contribute/signin` | `/contribute/dashboard` then switch to `/admin/dashboard` |

Core team members sign in as contributors first. The admin panel is accessed via the **Admin panel** switch button that appears in the contributor portal for users whose email exists in the `core_team` table.

---

## Why implicit flow

Supabase supports two auth flows for magic links:

**PKCE flow (default in `@supabase/ssr`)** — generates a code verifier stored in the browser's local storage at the time the magic link is requested. The callback route exchanges the code for a session. The code verifier must exist in the same browser that requested the link. Opening the link on a different browser or device fails with an expired or invalid link error.

**Implicit flow** — the magic link delivers the session token directly in the URL fragment (`#access_token=...`). The client-side callback page reads the fragment and exchanges it for a session. No browser-specific state is required. The link works on any browser, any device, any profile.

Zivana uses the **implicit flow** because contributors and core team members frequently open magic links on mobile devices after requesting them on desktop, or in different browsers. PKCE would make this impossible and create a frustrating user experience.

**Critical:** The `@supabase/ssr` package forces PKCE regardless of configuration. The browser client in this project uses `@supabase/supabase-js` directly to preserve implicit flow. Never replace `lib/supabase/client.ts` with a `createBrowserClient` from `@supabase/ssr`.

---

## The magic link flow step by step

1. User visits /contribute/signin
2. User enters their email and submits the form
3. signInWithOtp() is called with emailRedirectTo: window.location.origin + '/auth/callback'
4. Supabase sends a magic link email via Brevo SMTP
5. User clicks the link in their email
6. Browser opens /auth/callback#access_token=...&refresh_token=...
7. The callback page runs on the client
8. A 500ms delay allows Supabase to process the URL fragment
9. supabase.auth.getSession() reads the fragment and establishes a session
11. Session is stored in localStorage
12. User is redirected to /contribute/dashboard

---

## Sending the magic link

The sign in form in `app/contribute/signin/page.tsx` calls `signInWithOtp`:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    shouldCreateUser: true,
  },
})
```

`shouldCreateUser: true` means a new Supabase auth user is created automatically if the email does not exist yet. This supports the registration flow where a contributor registers their details first and then signs in for the first time.

`window.location.origin` is used instead of a hardcoded URL so the redirect works correctly on the preview deployment as well as production.

---

## The callback page

`app/auth/callback/page.tsx` is a client component that handles the token exchange:

```typescript
'use client'

useEffect(() => {
  const handleCallback = async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.replace('/contribute/dashboard')
      return
    }
    setErrorMsg('Sign in link is invalid or has expired.')
    setChecking(false)
  }

  // Also listen for auth state change as a parallel path
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        router.replace('/contribute/dashboard')
      }
    }
  )

  handleCallback()
}, [router])
```

The 500ms delay is intentional. It allows the Supabase client to finish processing the URL fragment before `getSession()` is called. Without the delay `getSession()` sometimes returns null even when the token is present in the fragment.

---

## Session management

Sessions are stored in `localStorage` by the Supabase client. The session includes an `access_token` (JWT) and a `refresh_token`. The access token expires after 1 hour by default. The Supabase client automatically refreshes the session using the refresh token when the access token nears expiry.

The root middleware at `proxy.ts` calls `updateSession()` on every request to keep the server-side session in sync with the client-side session via cookies. This ensures server components can read the authenticated user.

---

## Checking authentication in components

### In client components

```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  router.push('/contribute/signin')
  return
}
```

Use `getUser()` not `getSession()` for security checks. `getUser()` makes a network request to verify the JWT with Supabase's servers. `getSession()` reads from local storage and can return a stale or forged session.

### In server components

```typescript
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
const { data: { user } } = await supabase.auth.getUser()
```

---

## Admin panel access check

The admin panel does not have a separate sign in flow. Core team members sign in the same way as contributors. The admin switch button appears in the contributor portal sidebar only for users whose `user_id` exists in the `core_team` table with `is_active = true`.

The check runs in `components/portal/AdminSwitchButton.tsx`:

```typescript
const { data } = await supabase
  .from('core_team')
  .select('id, role')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()

if (data) setIsCoreTeam(true)
```

If a non-core-team user navigates directly to `/admin/dashboard`, the `AdminSidebar` component runs the same check and redirects them to `/contribute/dashboard` immediately.

---

## Sign out

Sign out is handled in both the contributor sidebar and the admin sidebar:

```typescript
const supabase = createClient()
await supabase.auth.signOut()
router.push('/contribute/signin')
```

Signing out clears the session from localStorage and invalidates the refresh token on Supabase's servers.

---

## Magic link email template

The magic link email is sent by Supabase via Brevo SMTP. The template is configured in the Supabase dashboard under **Authentication** then **Email Templates** then **Magic Link**.

The template uses `{{ .ConfirmationURL }}` as the link target. This delivers the token in the URL fragment which is required for the implicit flow. Do not change this to `token_hash` — that switches to server-side verification which reintroduces the cross-browser limitation.

The sender name is **Zivana Network** and the sender email is `hello@zivana.network`. This matches the sender name used in all other Zivana transactional emails to avoid confusion.

---

## Supabase redirect URL configuration

The following URLs must be listed under **Authentication** then **URL Configuration** then **Redirect URLs** in the Supabase dashboard:

https://zivana.network/**

https://zivana-web-git-develop-abdulrahman-abdulbasit-adiguns-projects.vercel.app/**

http://localhost:3000/**

The `/**` wildcard covers all preview deployment URLs. Without these entries Supabase rejects the `emailRedirectTo` parameter and the magic link fails.

---

## Adding a new authenticated route

If you add a new page that requires authentication:

1. Add an auth check at the top of the `useEffect` load function
2. Redirect to `/contribute/signin` if no user is found
3. If the page is admin-only also check for core team membership using the `is_core_team_member()` security definer function or by querying the `core_team` table
4. Wrap the component in `<Suspense>` if it uses `useSearchParams()`

Example pattern:

```typescript
useEffect(() => {
  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/contribute/signin')
      return
    }
    // fetch your data here
  }
  load()
}, [router])
```