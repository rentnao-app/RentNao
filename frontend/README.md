# Rent Nao — Frontend

Rental property platform frontend built with React 19, Vite, and Tailwind CSS.

## Quick Start

From the **repository root**:

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` and set at least `VITE_API_URL` to your backend base URL (for example `http://localhost:3000`). For Google sign-in, set `VITE_GOOGLE_AUTH_URL` to the backend initiate route (for example `http://localhost:3000/auth/google`).

```bash
npm run dev
```

Dev server: `http://localhost:5173`

Ensure Postgres/Redis/MinIO (and the API) are running per the root `README.md` before exercising full flows.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL (no `/api` prefix on paths) |
| `VITE_GOOGLE_AUTH_URL` | For Google login | Backend URL that starts the OAuth flow |
| `VITE_LISTING_ACCESS_FEE` | No | BDT amount for listing access unlock (default: 50) |

The committed `.env.example` may contain legacy keys; the variables above are what the app relies on today.

## Tech Stack

- **React 19** with functional components and hooks
- **Vite 7** for dev server and bundling
- **Tailwind CSS 3** for styling
- **React Router 6** for client-side routing
- **react-hot-toast** for notifications
- **Leaflet + react-leaflet** for maps

## Project Structure

```text
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Router + route definitions
├── index.css                # Tailwind imports + global styles
├── lib/
│   ├── api.js               # API client, auth token management
│   ├── phone.js             # Bangladesh phone validation / formatting
│   ├── wishlist.js          # Wishlist helpers
│   ├── requests.js          # Rental request helpers
│   ├── notifications.js     # Notification helpers
│   ├── publicProfiles.js    # Public profile helpers
│   └── fileValidation.js    # Upload validation helpers
├── components/
│   ├── ProtectedRoute.jsx
│   ├── SiteFooter.jsx
│   ├── GoogleAuthButton.jsx
│   ├── FeatureUnavailablePage.jsx
│   ├── WishlistHeartButton.jsx
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
    ├── admin-dashboard/     # Admin dashboard sections (KYC, users, listings, fees, …)
    ├── HomePage.jsx
    ├── SignUp.jsx
    ├── LogIn.jsx
    ├── ForgotPasswordPage.jsx
    ├── ResetPasswordPage.jsx
    ├── AuthVerificationPage.jsx
    ├── GoogleAuthCallbackPage.jsx
    ├── OAuthPhoneSetupPage.jsx
    ├── TenantRegistrationPage.jsx
    ├── OwnerRegistrationPage.jsx
    ├── VerificationPage.jsx
    ├── VerificationHoldingPage.jsx
    ├── TenantDashboard.jsx
    ├── OwnerDashboard.jsx
    ├── MyPropertiesPage.jsx
    ├── OwnerPropertyEditPage.jsx
    ├── CreateListingPage.jsx
    ├── IncomingRequestsPage.jsx
    ├── MyApplicationsPage.jsx
    ├── WishlistPage.jsx
    ├── MyRentalsPage.jsx
    ├── ListingPage.jsx
    ├── ListingDetailsPage.jsx
    ├── PublicProfilePage.jsx
    ├── NotificationsPage.jsx
    ├── WalletPage.jsx
    ├── AccountSettingsPage.jsx
    ├── AdminDashboard.jsx
    ├── AdminTopupApprovalsPage.jsx
    ├── AboutPage.jsx
    ├── TermsPage.jsx
    ├── FAQPage.jsx
    ├── ServicesPage.jsx
    └── NotFoundPage.jsx
```

## Authentication

Authentication uses JWT tokens stored in `localStorage`. The central API client is in `src/lib/api.js`.

### Key functions in `lib/api.js`

- `apiFetch(path, options)` — Wrapper around `fetch` that attaches `Authorization: Bearer <token>` when a session exists. Prefer this for all API calls.
- `setAuthSession({ accessToken, refreshToken, user })` — Stores tokens after login/signup.
- `clearAuthSession()` — Removes stored session data.
- `getCurrentUser()` — Parsed user object from storage.
- `getAccessToken()` — Raw JWT string.
- `isLoggedIn()` — Whether an access token is present.
- `logout()` — Clears session and redirects to `/login`.

### Auth flow (high level)

1. User registers or logs in (email, phone, or Google, depending on flow).
2. Backend returns `{ accessToken, refreshToken, user }` (shape may vary by endpoint).
3. Frontend stores the session via `setAuthSession()`.
4. Subsequent calls use `apiFetch()`.
5. `ProtectedRoute` enforces authentication and, where configured, role checks.

## Route Map

Routes are defined in `App.jsx`. `ProtectedRoute` takes `requiredRole` of `TENANT`, `OWNER`, `ADMIN`, or `null` (any authenticated user).

| Path | Component | Protected | Role |
|------|-----------|-----------|------|
| `/` | HomePage | No | — |
| `/signup` | SignUp | No | — |
| `/login` | LogIn | No | — |
| `/forgot-password` | ForgotPasswordPage | No | — |
| `/reset-password` | ResetPasswordPage | No | — |
| `/auth-verification` | AuthVerificationPage | No | — |
| `/auth/phone-setup` | OAuthPhoneSetupPage | No | — |
| `/auth/callback` | GoogleAuthCallbackPage | No | — |
| `/tenant-registration` | TenantRegistrationPage | No | — |
| `/owner-registration` | OwnerRegistrationPage | No | — |
| `/verification` | VerificationPage | No | — |
| `/verification-holding` | VerificationHoldingPage | No | — |
| `/about` | AboutPage | No | — |
| `/terms` | TermsPage | No | — |
| `/faq` | FAQPage | No | — |
| `/service`, `/services` | ServicesPage | No | — |
| `/listings` | ListingPage | No | — |
| `/listings/:id` | ListingDetailsPage | No | — |
| `/profile/:userId` | PublicProfilePage | No | — |
| `/tenant-dashboard` | TenantDashboard | Yes | TENANT |
| `/tenant-dashboard/applications` | MyApplicationsPage | Yes | TENANT |
| `/tenant-dashboard/wishlist` | WishlistPage | Yes | TENANT |
| `/owner-dashboard` | OwnerDashboard | Yes | OWNER |
| `/owner-dashboard/my-properties` | MyPropertiesPage | Yes | OWNER |
| `/owner-dashboard/my-properties/:propertyId/edit` | OwnerPropertyEditPage | Yes | OWNER |
| `/owner-dashboard/create-listing` | CreateListingPage | Yes | OWNER |
| `/owner-dashboard/requests` | IncomingRequestsPage | Yes | OWNER |
| `/dashboard/rentals` | MyRentalsPage | Yes | Any |
| `/notifications` | NotificationsPage | Yes | Any |
| `/admin-dashboard` | AdminDashboard | Yes | ADMIN |
| `/admin-dashboard/topup-approvals` | AdminTopupApprovalsPage | Yes | ADMIN |
| `/account` | AccountSettingsPage | Yes | Any |
| `/wallet` | WalletPage | Yes | Any |
| `*` | NotFoundPage | No | — |

## Backend API

All requests use `VITE_API_URL` as the origin; paths are appended without an `/api` prefix (for example `apiFetch('/auth/login', …)`).

Authoritative route and schema documentation for the backend lives at **`/docs`** (Scalar) and **`/openapi.json`** when the API is running—for example `http://localhost:3000/docs` in local development.

## Components Reference

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | Guards routes by session and optional `requiredRole` |
| `SiteFooter` | Global footer (contact and links) |
| `GoogleAuthButton` | Starts Google OAuth via configured backend URL |
| `FeatureUnavailablePage` | Placeholder when a feature is not wired up |
| `WishlistHeartButton` | Toggle wishlist state on a listing |
| `SearchFilterPanel` | Filters for listing browse (area, rent, rooms, type, sort) |
| `ImageGallery` | Property images with thumbnail navigation |
| `ImageUploader` | Upload flow for property images |
| `MapPicker` | Interactive map for choosing coordinates |
| `MapView` | Read-only map with a marker |
| `NotificationBell` | Header bell with dropdown |
| `ReviewForm` / `ReviewCard` / `StarRating` | Reviews UI |

## Development Notes

- **JWT backend** — Auth targets the Hono API; use `api.js` for all authenticated calls.
- **Polling** — Some UI (for example notifications) may poll the API; prefer tightening intervals or moving to push only when the backend supports it.
- **Empty or error states** — Many pages handle failed or empty API responses without crashing; use the network tab when debugging missing data.

## Scripts

```bash
npm run dev       # Dev server (port 5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Further reading

- Root overview and Docker workflow: `../README.md`
- Manual test ideas: `TESTING_GUIDE.md`
