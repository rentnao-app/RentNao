# Frontend Testing Guide — Manual Test Checklist

Use this guide to test frontend flows in the browser.  
**Prerequisites:** Backend on `http://localhost:3000`, frontend `npm run dev`.

**API paths have no `/api` prefix.** Example: `POST /requests`, not `POST /api/requests`. Chat routes are **`/chats`** and **`/chats/:conversationId`**, not `/chat`. Full route list: `README.md` and `src/App.jsx`.

---

## 1. Public pages (no login)

### HomePage (`/`)

| Step | Action | Expect |
|------|--------|--------|
| 1.1 | Open `/` | Figma-style hero, featured listings, why/comparison/payments/CTA, footer |
| 1.2 | Use the search bar (area / type / budget), click **Search** | Navigate to `/listings` with query params |
| 1.3 | Check listing cards | First property image when the API returns images; otherwise placeholder |
| 1.4 | Footer legal links | `/about`, `/terms`, `/faq`, `/privacy`, `/contact` as implemented |

### Listings browse (`/listings`)

| Step | Action | Expect |
|------|--------|--------|
| 2.1 | Open `/listings` | List of active listings; SearchFilterPanel at top (area, min/max rent, rooms, type, sort) |
| 2.2 | Change filters, submit | URL/request includes params; list updates (if backend supports) |
| 2.3 | If **not** logged in | No heart icon on cards (or hearts don’t toggle) |
| 2.4 | Log in as tenant, return to `/listings` | Heart icon on each card; first image on cards when available; owner rating if API returns it |

### Listing detail (`/listings/:id`)

| Step | Action | Expect |
|------|--------|--------|
| 3.1 | Open any listing e.g. `/listings/1` | ImageGallery (or placeholder if no images), stats row, property info, sidebar |
| 3.2 | Not logged in | “Log In to Apply” in sidebar; no wishlist heart in stats row |
| 3.3 | Logged in, no access | “Unlock address & map for X BDT” block; “Unlock contact (X BDT)” in Contact Owner; owner name may link to profile |
| 3.4 | Click **Unlock** | Wallet/fee flow (listing unlock via properties/wallet APIs — no `/api` prefix) |
| 3.5 | After access (or if backend says hasAccess) | MapView (if lat/lng), address in Property Information, full contact, “Message Owner” button |
| 3.6 | Logged-in tenant: click **Apply for this Listing** | POST `/requests`; toast success/error |
| 3.7 | Logged in: click heart in stats row | Add/remove wishlist (POST/DELETE `/wishlists`); toast; heart fills/unfills |
| 3.8 | Click **Message Owner** (with access) | POST `/conversations`, then navigate to `/chats/:conversationId` |
| 3.9 | Click owner name (when link present) | Go to `/profile/:userId` |

### Static & 404

| Step | Action | Expect |
|------|--------|--------|
| 4.1 | Open `/about` | About content |
| 4.2 | Open `/terms` | Terms content |
| 4.3 | Open `/faq` | FAQ content |
| 4.4 | Open `/not-a-real-route` | 404 page with “Back to Home” |

---

## 2. Auth & account

### Sign up / Log in

| Step | Action | Expect |
|------|--------|--------|
| 5.1 | Sign up (fill form, submit) | Account created; redirect to role selection or dashboard |
| 5.2 | Log in | Session; redirect to tenant/owner dashboard or home |

### Account settings (`/account`)

| Step | Action | Expect |
|------|--------|--------|
| 6.1 | Open `/account` (logged in) | Profile form; owner/tenant fields depending on role |
| 6.2 | Edit and save | PATCH/POST to profile endpoints; success/error feedback |

---

## 3. Tenant flow

### Tenant dashboard (`/tenant-dashboard`)

| Step | Action | Expect |
|------|--------|--------|
| 7.1 | Log in as **tenant**, open `/tenant-dashboard` | Teal theme; welcome card; NotificationBell in header |
| 7.2 | Click **Browse Listings** | `/listings` |
| 7.3 | Click **My Applications** | `/tenant-dashboard/applications` |
| 7.4 | Click **My Rentals** | `/dashboard/rentals` |
| 7.5 | Click **Wishlist** | `/tenant-dashboard/wishlist` |
| 7.6 | Click **Chat** | `/chats` |
| 7.7 | Click **Profile** | `/account` |

### My Applications (`/tenant-dashboard/applications`)

| Step | Action | Expect |
|------|--------|--------|
| 8.1 | Open page | List from `GET /requests/mine`; each card shows listing, status |
| 8.2 | Click **Withdraw** on pending | POST `/requests/:id/withdraw`; card updates |
| 8.3 | Click **Confirm Move-in** on accepted | POST `/rentals/:id/confirm`; toast/card update |

### Wishlist (`/tenant-dashboard/wishlist`)

| Step | Action | Expect |
|------|--------|--------|
| 9.1 | Open page | List from `GET /wishlists`; grid of listing cards |
| 9.2 | Click a card | Go to listing detail |
| 9.3 | Click remove on a listing | DELETE `/wishlists/:listingId`; card removed |

---

## 4. Owner flow

### Owner dashboard (`/owner-dashboard`)

| Step | Action | Expect |
|------|--------|--------|
| 10.1 | Log in as **owner**, open `/owner-dashboard` | NotificationBell in header; cards for My Properties, Create Listing, Tenant Requests, Payments, My Rentals, Messages, Profile |
| 10.2 | **Tenant Requests** | `/owner-dashboard/requests` |
| 10.3 | **My Rentals** | `/dashboard/rentals` |
| 10.4 | **Messages** | `/chats` |

### Create listing (`/owner-dashboard/create-listing`)

| Step | Action | Expect |
|------|--------|--------|
| 11.1 | Open page | Form: property type, size, area, **address**, **MapPicker**, rent, availability |
| 11.2 | Click map | Pin placed; lat/lng stored |
| 11.3 | Submit form | POST `/users/owner/listings` with `address`, `exact_lat`, `exact_lng` |
| 11.4 | After success | “Listing created” section with **ImageUploader**; add photos (POST `/properties/:id/images`); “Done — My Properties” link |

### Incoming requests (`/owner-dashboard/requests`)

| Step | Action | Expect |
|------|--------|--------|
| 12.1 | Open page | List from `GET /requests/incoming`; grouped by listing |
| 12.2 | **Accept** on a request | POST `/requests/:id/accept` |
| 12.3 | **Reject** on a request | POST `/requests/:id/reject` |

### My properties (`/owner-dashboard/my-properties`)

| Step | Action | Expect |
|------|--------|--------|
| 13.1 | Open page | List from `GET /users/owner/properties`; links to edit/detail as implemented |

---

## 5. Shared (tenant & owner)

### My Rentals (`/dashboard/rentals`)

| Step | Action | Expect |
|------|--------|--------|
| 14.1 | Open page (tenant or owner) | List from `GET /rentals/mine`; active vs past rentals |
| 14.2 | **Mark Complete** on active | POST `/rentals/:id/complete` |
| 14.3 | **Leave Review** on completed | ReviewForm modal; submit POST `/reviews` |
| 14.4 | If reviews exist | Loaded via `GET /reviews/rental/:rentalId`; ReviewCard list |

---

## 6. Chat

### Chat page (`/chats`, `/chats/:conversationId`)

| Step | Action | Expect |
|------|--------|--------|
| 15.1 | Open `/chats` (logged in) | Left: conversation list (`GET /conversations`); right: “Select a conversation” or messages |
| 15.2 | Click a conversation | Right panel loads messages (`GET /conversations/:id/messages`); input at bottom |
| 15.3 | Send a message | POST `/conversations/:id/messages`; message appears (WebSocket `/ws` if connected) |
| 15.4 | Start from listing detail | “Message Owner” → POST `/conversations` → redirect to `/chats/:conversationId` |

---

## 7. Notifications

### NotificationBell (header on dashboards)

| Step | Action | Expect |
|------|--------|--------|
| 16.1 | Log in, open any dashboard | Bell icon in header; unread count badge if `GET /notifications/unread-count` returns > 0 |
| 16.2 | Click bell | Dropdown with recent notifications (`GET /notifications?limit=5`); “View All” link |

### Notifications page (`/notifications`)

| Step | Action | Expect |
|------|--------|--------|
| 17.1 | Open `/notifications` | Full list (`GET /notifications?limit=50`); read/unread styling |
| 17.2 | Click **Mark all as read** | PATCH `/notifications/read-all`; list updates |

---

## 8. Public profile

### Public profile (`/profile/:userId`)

| Step | Action | Expect |
|------|--------|--------|
| 18.1 | Open e.g. `/profile/<owner-user-id>` (from listing detail owner link) | `GET /users/:userId/profile`; username, role, member since; rating breakdown; review count; list of ReviewCards |

---

## 9. Admin flow

### Admin dashboard (`/admin-dashboard`)

| Step | Action | Expect |
|------|--------|--------|
| 19.1 | Log in as **admin** | RentNao header; NotificationBell; stats; Pending Payments section |
| 19.2 | **Pending Payments** | Table from `GET /admin/payments/pending`; Confirm / Reject per row |
| 19.3 | **Confirm** a payment | POST `/admin/payments/:id/confirm`; row removed |
| 19.4 | **Reject** a payment | POST `/admin/payments/:id/reject`; row removed |
| 19.5 | Unverified users | List, select user, review documents; Approve/Reject user; Accept/Reject document (existing behavior) |

---

## 10. Components in use (sanity check)

| Component | Where used | Quick check |
|-----------|------------|-------------|
| **StarRating** | ReviewForm, ReviewCard, ListingDetailsPage (owner rating) | Stars render; clickable in form |
| **ReviewForm** | MyRentalsPage (Leave Review) | Modal opens; submit sends review |
| **ReviewCard** | MyRentalsPage, PublicProfilePage | Review text, stars, reviewer, date |
| **MapPicker** | CreateListingPage | Map loads; click sets pin |
| **MapView** | ListingDetailsPage (with access) | Read-only map with one pin |
| **ImageUploader** | CreateListingPage (after create) | Upload/delete images for property |
| **ImageGallery** | ListingDetailsPage | Main image + thumbnails; click to change |
| **NotificationBell** | TenantDashboard, OwnerDashboard, AdminDashboard | Bell in header; dropdown |
| **ChatBubble** | ChatPage | Message bubbles left/right, timestamp |
| **SearchFilterPanel** | ListingPage | Area, rent, rooms, type, sort; submit updates list |

---

## Quick smoke test (minimal path)

1. **Home** → Search → **Listings** → open one **Listing detail**.
2. **Sign up / Log in** as tenant → **Tenant dashboard** → **My Applications**, **Wishlist**, **Chat**.
3. Log in as owner → **Owner dashboard** → **Create listing** (form + map + image upload after create) → **Incoming requests**.
4. **My Rentals** (as tenant or owner) → Mark complete → Leave review.
5. Open **Listing detail** → Unlock (modal) → Apply → Wishlist heart → Message Owner → **Chat**.
6. **Notifications** bell → **Notifications** page → Mark all read.
7. **Profile** link from listing → **Public profile**.
8. Log in as admin → **Admin dashboard** → Pending Payments → Confirm/Reject.
9. **About**, **Terms**, **FAQ**; then open invalid URL → **404**.

If any step fails, check **Network** tab for the API call (status code and response). Backend may not implement all endpoints yet; frontend will show toasts or inline errors.
