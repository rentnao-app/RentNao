# Rent Nao — Frontend

Rental property platform frontend built with React 19, Vite, and Tailwind CSS.

## Current Handoff Docs

- See `FRONTEND_HANDOFF_REMAINING_WORK.md` for the latest backend comparison, route status, and prioritized remaining work for frontend contributors.
- See `API_GAP_REPORT.md` for endpoint-level gap matrix.

## Quick Start

```bash
cd Prototype/frontend
npm install
cp .env.example .env   # or create .env with VITE_API_URL
npm run dev             # starts at http://localhost:5173
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL (e.g. `http://localhost:3000`) |
| `VITE_LISTING_ACCESS_FEE` | No | BDT amount for listing access unlock (default: 50) |

## Tech Stack

- **React 19** with functional components and hooks
- **Vite 7** for dev server and bundling
- **Tailwind CSS 3** for styling
- **React Router 6** for client-side routing
- **react-hot-toast** for notifications
- **Leaflet + react-leaflet** for maps

## Project Structure

```
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Router + route definitions
├── index.css                # Tailwind imports + global styles
├── lib/
│   └── api.js               # API client, auth token management
├── components/
│   ├── ProtectedRoute.jsx   # Auth guard for protected routes
│   ├── ChatBubble.jsx
│   ├── ImageGallery.jsx
│   ├── ImageUploader.jsx
│   ├── MapPicker.jsx
│   ├── MapView.jsx
│   ├── NotificationBell.jsx
│   ├── ReviewCard.jsx
│   ├── ReviewForm.jsx
│   ├── SearchFilterPanel.jsx
│   └── StarRating.jsx
└── pages/
    ├── HomePage.jsx
    ├── SignUp.jsx
    ├── LogIn.jsx
    ├── TenantRegistrationPage.jsx
    ├── OwnerRegistrationPage.jsx
    ├── VerificationPage.jsx
    ├── VerificationHoldingPage.jsx
    ├── TenantDashboard.jsx
    ├── OwnerDashboard.jsx
    ├── AdminDashboard.jsx
    ├── ListingPage.jsx
    ├── ListingDetailsPage.jsx
    ├── CreateListingPage.jsx
    ├── MyPropertiesPage.jsx
    ├── MyApplicationsPage.jsx
    ├── IncomingRequestsPage.jsx
    ├── MyRentalsPage.jsx
    ├── WishlistPage.jsx
    ├── ChatPage.jsx
    ├── NotificationsPage.jsx
    ├── PublicProfilePage.jsx
    ├── AccountSettingsPage.jsx
    ├── AboutPage.jsx
    ├── TermsPage.jsx
    ├── FAQPage.jsx
    └── NotFoundPage.jsx
```

## Authentication

Authentication uses JWT tokens stored in `localStorage`. The central API client is in `src/lib/api.js`.

### Key functions in `lib/api.js`

- `apiFetch(path, options)` — Wrapper around `fetch` that auto-attaches the `Authorization: Bearer <token>` header. All API calls should use this.
- `setAuthSession({ accessToken, refreshToken, user })` — Stores tokens after login/signup.
- `clearAuthSession()` — Removes all stored tokens.
- `getCurrentUser()` — Returns the stored user object (parsed from localStorage).
- `getAccessToken()` — Returns the raw JWT string.
- `isLoggedIn()` — Returns `true` if an access token exists.
- `logout()` — Clears session and redirects to `/login`.

### Auth flow

1. User signs up via `POST /auth/register` or logs in via `POST /auth/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. Frontend stores these via `setAuthSession()`
4. All subsequent API calls go through `apiFetch()` which attaches the token
5. `ProtectedRoute` component checks auth + role before rendering protected pages

## Route Map

| Path | Component | Auth | Role |
|------|-----------|------|------|
| `/` | HomePage | No | — |
| `/signup` | SignUp | No | — |
| `/login` | LogIn | No | — |
| `/tenant-registration` | TenantRegistrationPage | No | — |
| `/owner-registration` | OwnerRegistrationPage | No | — |
| `/verification` | VerificationPage | No | — |
| `/verification-holding` | VerificationHoldingPage | No | — |
| `/about` | AboutPage | No | — |
| `/terms` | TermsPage | No | — |
| `/faq` | FAQPage | No | — |
| `/listings` | ListingPage | No | — |
| `/listings/:id` | ListingDetailsPage | No | — |
| `/profile/:userId` | PublicProfilePage | No | — |
| `/tenant-dashboard` | TenantDashboard | Yes | TENANT |
| `/tenant-dashboard/applications` | MyApplicationsPage | Yes | TENANT |
| `/tenant-dashboard/wishlist` | WishlistPage | Yes | TENANT |
| `/owner-dashboard` | OwnerDashboard | Yes | OWNER |
| `/owner-dashboard/my-properties` | MyPropertiesPage | Yes | OWNER |
| `/owner-dashboard/create-listing` | CreateListingPage | Yes | OWNER |
| `/owner-dashboard/requests` | IncomingRequestsPage | Yes | OWNER |
| `/dashboard/rentals` | MyRentalsPage | Yes | Any |
| `/chat` | ChatPage | Yes | Any |
| `/chat/:conversationId` | ChatPage | Yes | Any |
| `/notifications` | NotificationsPage | Yes | Any |
| `/admin-dashboard` | AdminDashboard | Yes | ADMIN |
| `/account` | AccountSettingsPage | Yes | Any |
| `*` | NotFoundPage | No | — |

## Backend API Endpoints

All API calls go to `VITE_API_URL` without any `/api` prefix (e.g. `apiFetch('/auth/login')`).

### Implemented in Backend (working)

- `POST /auth/register` — Sign up
- `POST /auth/login` — Sign in
- `POST /auth/logout` — Sign out
- `POST /auth/verify-email` — Email verification
- `POST /auth/verify-phone` — Phone verification
- `POST /auth/resend-verification` — Resend verification
- `POST /auth/password-reset/request` — Request password reset
- `POST /auth/password-reset/confirm` — Confirm password reset
- `GET /admin/stats` — Dashboard statistics
- `GET /admin/users` — List users (with optional role filter)
- `GET /admin/users/:userId` — User details + documents
- `POST /admin/users/:userId/approve` — Approve user
- `POST /admin/users/:userId/reject` — Reject user
- `POST /admin/documents/:documentId/accept` — Accept document
- `POST /admin/documents/:documentId/reject` — Reject document
- `PATCH /users/:userId/profile` — Create/update profile
- `GET /users/:userId/profile-status` — Check profile completion
- `POST /users/:userId/verification/upload-url` — Get presigned upload URL
- `POST /users/:userId/verification/submit` — Submit verification documents
- `GET /users/:userId/verification/submission-status` — Check verification status

### Pending Backend Implementation (frontend is ready, will show empty states)

These endpoints are called by the frontend but do not exist in the backend yet. The frontend handles 404s gracefully — pages render with empty data or show appropriate messages.

- `GET /listings` — Browse listings with filters
- `GET /listings/:id` — Single listing details
- `POST /users/owner/listings` — Create a listing
- `GET /users/owner/properties` — Owner's properties
- `GET/POST/DELETE /wishlists` — Wishlist management
- `GET /payments/check-access/:listingId` — Check listing access
- `POST /payments/listing-access` — Submit listing access payment
- `GET/POST /admin/payments/pending` — Admin payment management
- `POST /admin/payments/:id/confirm|reject` — Admin payment actions
- `GET/POST /conversations` — Chat conversations
- `GET/POST /conversations/:id/messages` — Chat messages
- `GET/POST /requests` — Tenant request management
- `POST /requests/:id/accept|reject|withdraw` — Request actions
- `GET /rentals/mine` — User's rentals
- `POST /rentals/:id/complete|confirm` — Rental actions
- `GET/POST /reviews` — Reviews
- `GET /reviews/rental/:id` — Reviews for a rental
- `GET /notifications` — User notifications
- `GET /notifications/unread-count` — Unread count
- `PATCH /notifications/read-all` — Mark all read
- `GET /auth/me` — Current user info
- `PATCH /auth/profile` — Update user profile
- `GET/PATCH /users/owner-profile` — Owner profile
- `GET/PATCH /users/tenant-profile` — Tenant profile
- `POST/DELETE /properties/:id/images` — Property image management
- `GET /users/:userId/profile` — Public profile

## Components Reference

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | HOC that checks JWT validity and user role before rendering |
| `SearchFilterPanel` | Filter bar for listings (area, rent range, rooms, type, sort) |
| `ImageGallery` | Displays property images with thumbnail navigation |
| `ImageUploader` | Upload/delete property images (used after creating a listing) |
| `MapPicker` | Interactive Leaflet map for selecting coordinates |
| `MapView` | Read-only Leaflet map showing a single marker |
| `NotificationBell` | Header bell icon with dropdown, polls every 30s |
| `ChatBubble` | Single message bubble (left/right based on sender) |
| `ReviewForm` | Star rating + text form for submitting reviews |
| `ReviewCard` | Display a single review with stars and metadata |
| `StarRating` | Reusable star display (read-only or interactive) |

## Development Notes

- **No Supabase dependency** — The project previously used Supabase for auth. It has been fully migrated to a custom JWT backend. The `@supabase/supabase-js` package has been removed.
- **Chat polling** — Real-time chat uses 5-second polling instead of WebSockets. This is a temporary solution; the backend should implement WebSocket support in the future.
- **Notification polling** — NotificationBell polls every 30 seconds. Same WebSocket note applies.
- **Graceful degradation** — Pages calling unimplemented backend endpoints will show empty states rather than crashing. Check the browser console/network tab if data isn't appearing.

## Scripts

```bash
npm run dev       # Start dev server (port 5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # Run ESLint
```
aaaaaa