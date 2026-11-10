# Shop App

Shop management for repair shops, sold as a subscription. Three levels of access:

- **Platform owner** sells subscriptions and sees each shop's plan, status and seats.
- **Shop admin** is the subscriber and manages the shop's team and roles.
- **Team members** get one role each; the role decides what they can see and do.

This repository currently holds **build slice 1, Foundation**. The full plan is in the build brief (twelve slices).

## What works in this slice

- Google sign-in (Firebase Authentication).
- Create a shop. The server creates the shop on a trial, the four default roles (shop admin, service writer, technician, parts manager), the first member, an audit log entry, and sets the user's `shopId` and `roleId` on their sign-in token.
- App shell with the shop menu (filtered by role) and the platform owner menu.
- Team and roles page showing the permission sheet (read-only for now).
- Platform owner page listing shops.
- Every other menu item opens a placeholder naming the slice that builds it.

## Security model

- Everything a shop owns lives under `shops/{shopId}`.
- `shopId`, `roleId` and `superAdmin` are custom claims set only by server code. The browser cannot change them.
- `firestore.rules` is default-deny. A user reaches only the shop in their token; a past-due shop is read-only; a suspended or cancelled shop is locked.
- Shop creation, membership, plan, status, seats and the audit log are written by the server only.
- The shop admin role cannot be edited or deleted, so a shop cannot lock itself out.
- The platform owner sees subscription facts, not shop records.
- Hiding a menu item is for convenience. The rules and server routes are the protection.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Firebase values.
2. In the Firebase console, enable Google as a sign-in provider and create a Firestore database.
3. Deploy the rules: `npx firebase deploy --only firestore:rules --project <your-project>`.
4. `npm install`, then `npm run dev`.
5. To make yourself the platform owner, sign in once, then run `node scripts/set-super-admin.mjs you@example.com` and sign in again.

Do not edit rules in the Firebase console; change `firestore.rules` here so the tests keep covering them.

## Checks

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (rule tests are skipped without the emulator) |
| `npm run test:rules` | Security rule tests in the Firestore emulator (needs Java) |
| `npm run build` | Production build |

GitHub Actions runs all five on every push.
