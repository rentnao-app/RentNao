# RentNao frontend

React 19 + Vite 7 SPA (tenant / owner / admin). Tailwind CSS 3, react-router-dom **7**, EN/BN i18n, Google Maps (not Leaflet).

Agent context: [`../CLAUDE.md`](../CLAUDE.md). Routes are defined in `src/App.jsx`.

## Quick start

From the **repository root**:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Dev server: http://localhost:5173

Start backend + Docker infra first (`../backend/README.md`). Vite proxies `/auth`, `/properties`, `/notifications`, `/wishlists`, `/requests`, `/wallet`, `/users`, `/conversations`, `/admin`, `/testimonials`, `/deals`, `/health`, `/ws` to `http://localhost:3000`.

`[vite] http proxy error` + `ECONNREFUSED` = API not running.

### Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Prod yes; dev optional | API origin. Dev prefers same-origin + proxy. Prod: `https://api.rentnao.co` |
| `VITE_GOOGLE_AUTH_URL` | For Google login | e.g. `http://localhost:3000/auth/google` |
| `VITE_GOOGLE_MAPS_API_KEY` | For maps | Maps JavaScript API. Restrict to `http://localhost:5173/*` and `https://rentnao.co/*` |

`VITE_*` is **inlined at build time**. Changing a GitHub secret does not update production until the frontend image is rebuilt.

`.env.example` still lists unused `VITE_SUPABASE_*` keys — ignore them.

## Tech stack

- React 19, Vite 7, Tailwind 3
- react-router-dom 7
- react-hot-toast, AOS, lucide-react
- Google Maps JS (`src/lib/googleMaps.js`, `MapPicker`, `MapView`)
- i18n: `src/lib/i18n/` (EN + BN)

## Auth

JWT in `localStorage` via `src/lib/api.js`.

- `apiFetch(path, options)` — attach Bearer token. Paths have **no `/api` prefix**.
- `setAuthSession` / `clearAuthSession` / `getCurrentUser` / `logout`

`ProtectedRoute` takes `requiredRole`: `TENANT`, `OWNER`, `ADMIN`, or `null` (any logged-in user).

## Route map

| Path | Page | Guard |
|------|------|-------|
| `/` | HomePage | Public |
| `/signup`, `/login` | Auth | Public |
| `/forgot-password`, `/reset-password` | Password | Public |
| `/auth-verification`, `/auth/phone-setup`, `/auth/callback` | Auth extras | Public |
| `/tenant-registration`, `/owner-registration` | Role signup | Public |
| `/verification`, `/verification-holding` | KYC | Public |
| `/listings`, `/browse` | ListingPage | Public |
| `/listings/:id` | ListingDetailsPage | Public |
| `/profile/:userId` | PublicProfilePage | Public |
| `/about`, `/terms`, `/privacy`, `/cookies`, `/contact` | Legal | Public |
| `/faq`, `/careers`, `/blogs`, `/blogs/:slug` | Content | Public |
| `/service`, `/services` | ServicesPage | Public |
| `/review`, `/reviews` | ReviewPage | Public |
| `/tenant-dashboard` | TenantDashboard | TENANT |
| `/tenant-dashboard/applications` | MyApplicationsPage | TENANT |
| `/tenant-dashboard/wishlist` | WishlistPage | TENANT |
| `/owner-dashboard` | OwnerDashboard | OWNER |
| `/owner-dashboard/my-properties` | MyPropertiesPage | OWNER |
| `/owner-dashboard/my-properties/:propertyId/edit` | OwnerPropertyEditPage | OWNER |
| `/owner-dashboard/create-listing` | CreateListingPage | OWNER |
| `/owner-dashboard/requests` | IncomingRequestsPage | OWNER |
| `/dashboard/rentals` | MyRentalsPage | Any auth |
| `/notifications` | NotificationsPage | Any auth |
| `/chats`, `/chats/:conversationId` | Chat | Any auth |
| `/admin-dashboard` | AdminDashboard | ADMIN |
| `/admin-dashboard/topup-approvals` | AdminTopupApprovalsPage | ADMIN |
| `/account` | AccountSettingsPage | Any auth |
| `/wallet` | WalletPage | Any auth |
| `/dev/arefin-test` | Dev rent-deed test | Dev + auth |
| `*` | NotFoundPage | Public |

Chat is **`/chats`**, not `/chat`.

## Project structure

```text
src/
├── main.jsx
├── App.jsx                      # All routes
├── lib/
│   ├── api.js                   # Fetch + session
│   ├── googleMaps.js            # Maps loader + gm_authFailure
│   └── i18n/                    # EN/BN
├── components/
│   ├── ProtectedRoute.jsx
│   ├── MapPicker.jsx / MapView.jsx
│   └── home/                    # Homepage sections
├── hooks/
├── pages/
│   ├── admin-dashboard/
│   └── …
└── index.css
```

## Components (selected)

| Component | Purpose |
|-----------|---------|
| `ProtectedRoute` | Session + optional role |
| `MapPicker` / `MapView` | Google Maps pin / display |
| `ListingCard` | Browse cards |
| `ImageGallery` / `ImageUploader` | Property media |
| `NotificationBell` | Header notifications |
| `SiteFooter` | Footer + legal links |

## Scripts

```bash
npm run dev          # :5173
npm run build
npm run preview
npm run lint
npm run dev:roles    # admin :5173, owner :5174, tenant :5175
```

## Maps

If the map shows Google’s gray “Oops! Something went wrong” overlay, the **key was rejected** (invalid, billing, or referrer). Check Cloud Console and that `VITE_GOOGLE_MAPS_API_KEY` was present at image build time. `window.gm_authFailure` is handled in `googleMaps.js`.

## Further reading

- Root + local Docker: [`../README.md`](../README.md)
- Manual QA: [`TESTING_GUIDE.md`](TESTING_GUIDE.md)
