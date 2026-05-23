import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiFetch, getCurrentUser, logout } from "../lib/api";
import AppHeader from "../components/AppHeader";
import { listTenantRequests } from "../lib/requests";
import { fetchNotifications } from "../lib/notifications";

function toLabel(value) {
  if (value == null || value === "") return "N/A";
  const map = {
    BELOW_20K: "Below 20K",
    RANGE_20K_40K: "20K - 40K",
    RANGE_40K_60K: "40K - 60K",
    RANGE_60K_100K: "60K - 100K",
    RANGE_100K_200K: "100K - 200K",
    ABOVE_200K: "Above 200K",
    SELF_EMPLOYED: "Self Employed",
    UNDER_REVIEW: "Under Review",
  };
  return map[value] || String(value).replaceAll("_", " ");
}

function budgetFromIncomeRange(incomeRange) {
  const map = {
    BELOW_20K: "BDT 20,000",
    RANGE_20K_40K: "BDT 40,000",
    RANGE_40K_60K: "BDT 60,000",
    RANGE_60K_100K: "BDT 100,000",
    RANGE_100K_200K: "BDT 200,000",
    ABOVE_200K: "BDT 300,000+",
  };
  return map[incomeRange] || "BDT 50,000";
}

function formatBdt(n) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(Number(n));
  } catch {
    return `BDT ${Number(n).toLocaleString()}`;
  }
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function SidebarItem({ to, label, icon, active, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        active
          ? "bg-emerald-100 text-emerald-800 font-medium"
          : "text-gray-700 hover:bg-emerald-50/80"
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
          active ? "bg-emerald-200 text-emerald-700" : "bg-white text-gray-500"
        }`}
      >
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

export default function TenantDashboard() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [tenantRequests, setTenantRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const menuItems = [
    {
      label: "Dashboard",
      to: "/tenant-dashboard",
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z" />
        </svg>
      ),
    },
    {
      label: "My Applications",
      to: "/tenant-dashboard/applications",
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Saved Properties",
      to: "/tenant-dashboard/wishlist",
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21l-1.45-1.32C5.4 15.04 2 12.03 2 8.5A4.5 4.5 0 0 1 6.5 4 5.3 5.3 0 0 1 12 7.09 5.3 5.3 0 0 1 17.5 4 4.5 4.5 0 0 1 22 8.5c0 3.53-3.4 6.54-8.55 11.18z" />
        </svg>
      ),
    },
    {
      label: "Rental requests",
      to: "/tenant-dashboard/applications",
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
        </svg>
      ),
    },
    {
      label: "Profile",
      to: "/account",
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.01-8 4.5V21h16v-2.5C20 16.01 16.42 14 12 14z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      to: "/account",
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94L14.4 2.7a.5.5 0 0 0-.49-.4h-3.82a.5.5 0 0 0-.49.4L9.25 5.32c-.57.23-1.11.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.52.4 1.06.71 1.63.94l.35 2.62a.5.5 0 0 0 .49.4h3.82a.5.5 0 0 0 .49-.4l.35-2.62c.57-.23 1.11-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 1 1 3.5-3.5A3.5 3.5 0 0 1 12 15.5z" />
        </svg>
      ),
    },
    {
      label: "Support",
      to: "/faq",
      icon: (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm.1 15.5a1.4 1.4 0 1 1 1.4-1.4 1.4 1.4 0 0 1-1.4 1.4zM14.2 11c-.9.7-1.4 1.1-1.4 2v.3h-1.6v-.4c0-1.4.8-2.1 1.7-2.8.7-.5 1.2-.9 1.2-1.5a1.7 1.7 0 0 0-3.3-.6l-1.6-.4a3.3 3.3 0 1 1 6.5 1c0 1.4-.8 2-1.5 2.4z" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const stored = getCurrentUser();
        if (stored) {
          setUser(stored);
        }
        const localUserId = stored?.userId || stored?.user_id || stored?.id;

        const profilePromise =
          localUserId != null
            ? apiFetch(`/users/${localUserId}/profile-status`).then(async (res) => {
                if (!res.ok) return null;
                return res.json().catch(() => null);
              })
            : Promise.resolve(null);

        const wishlistPromise = apiFetch("/wishlists").then(async (res) => {
          if (!res.ok) return null;
          return res.json().catch(() => null);
        });

        const requestsPromise = listTenantRequests().catch(() => ({ items: [] }));
        const notificationsPromise = fetchNotifications({ limit: 5 }).catch(() => ({ items: [] }));
        const paymentsPromise = apiFetch("/wallet/transactions?page=1&limit=5")
          .then(async (res) => {
            if (!res.ok) return [];
            const body = await res.json().catch(() => ({}));
            return body?.data?.transactions || [];
          })
          .catch(() => []);
        const [profileJson, wishlistJson, requestsState, notificationState, payments] = await Promise.all([
          profilePromise,
          wishlistPromise,
          requestsPromise,
          notificationsPromise,
          paymentsPromise,
        ]);
        if (cancelled) return;

        if (profileJson?.data) {
          const profile = profileJson.data;
          setUser((prev) => ({
            ...prev,
            role: profile.role || prev?.role,
            onboardingStatus: profile.onboardingStatus || prev?.onboardingStatus,
            kycVerificationStatus: profile.kycVerificationStatus || prev?.kycVerificationStatus,
            contactEmail: profile.contactEmail || prev?.contactEmail,
            contactPhone: profile.contactPhone || prev?.contactPhone,
            profile: profile.profile || prev?.profile,
          }));
        }

        const list =
          wishlistJson?.data?.items ?? wishlistJson?.data ?? wishlistJson?.wishlist ?? [];
        setWishlistCount(Array.isArray(list) ? list.length : 0);
        setTenantRequests(Array.isArray(requestsState?.items) ? requestsState.items : []);
        setNotifications(Array.isArray(notificationState?.items) ? notificationState.items : []);
        setTransactions(Array.isArray(payments) ? payments : []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const welcomeName = useMemo(() => {
    return (
      user?.profile?.firstName ||
      user?.username ||
      user?.contactEmail?.split("@")?.[0] ||
      user?.contact_email?.split("@")?.[0] ||
      "Tenant"
    );
  }, [user]);

  const incomeRangeFromProfile = useMemo(() => {
    const p = user?.profile;
    return p?.incomeRange ?? p?.income_range ?? null;
  }, [user]);

  const monthlyBudgetFromDb = useMemo(() => {
    if (incomeRangeFromProfile == null || incomeRangeFromProfile === "") return null;
    return budgetFromIncomeRange(incomeRangeFromProfile);
  }, [incomeRangeFromProfile]);

  const pendingRequests = useMemo(
    () => tenantRequests.filter((item) => item?.requestStatus === "PENDING"),
    [tenantRequests]
  );
  const pendingOwnerRequests = pendingRequests;
  const recentRequests = useMemo(() => tenantRequests.slice(0, 4), [tenantRequests]);
  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f7f3]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-gray-800">
      <AppHeader variant="wide" />

      <div className="mx-auto max-w-[1500px] lg:flex">
        {/* Sidebar - desktop only; primary nav is in AppHeader on smaller screens */}
        <aside className="hidden lg:block lg:w-72 shrink-0 border-r border-emerald-100 bg-[#f4f8f5]">
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to !== "/" && location.pathname.startsWith(item.to));

              return (
                <SidebarItem
                  key={item.label}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={isActive}
                />
              );
            })}
          </nav>

          <div className="px-4 pb-5">
            <button
              onClick={logout}
              className="w-full rounded-xl bg-red-50 text-red-600 border border-red-100 py-2.5 text-sm font-semibold hover:bg-red-100 transition"
            >
              Logout
            </button>

            {/* Clean minimal helper card instead of image */}
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Profile Status</p>
              <p className="mt-1 text-sm font-medium text-gray-800">
                {toLabel(user?.kycVerificationStatus)}
              </p>
              <div className="mt-3 h-2 rounded-full bg-emerald-100">
                <div className="h-2 w-2/3 rounded-full bg-emerald-600" />
              </div>
              <p className="mt-2 text-xs text-gray-500">Keep profile updated for better matches.</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7">
          {/* Welcome + stats */}
          <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-white via-white to-emerald-50 shadow-sm p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900">
              Welcome, {welcomeName}!
            </h1>
            <p className="mt-1.5 text-gray-600 text-sm sm:text-base">
              Find the best properties matched to your preferences.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white border border-emerald-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 11.5L12 4l9 7.5v8a2 2 0 0 1-2 2h-5v-7H10v7H5a2 2 0 0 1-2-2v-8z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {pendingRequests.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">Pending rental requests</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-emerald-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 rounded-xl bg-rose-100 text-rose-500 items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21l-1.45-1.32C5.4 15.04 2 12.03 2 8.5A4.5 4.5 0 0 1 6.5 4 5.3 5.3 0 0 1 12 7.09 5.3 5.3 0 0 1 17.5 4 4.5 4.5 0 0 1 22 8.5c0 3.53-3.4 6.54-8.55 11.18z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {wishlistCount} {wishlistCount === 1 ? "Saved Listing" : "Saved Listings"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">From your wishlist</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-emerald-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 rounded-xl bg-amber-100 text-amber-600 items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.999 1.5a10.5 10.5 0 1 0 10.5 10.5A10.513 10.513 0 0 0 12 1.5zm.75 16.5h-1.5v-1.5h1.5zm1.38-5.51-.67.69a1.95 1.95 0 0 0-.56 1.32v.25h-1.5v-.33a2.9 2.9 0 0 1 .85-2.07l.88-.88a1.32 1.32 0 1 0-2.26-.94H9.4a2.82 2.82 0 1 1 5.64.08 2.59 2.59 0 0 1-.91 1.89z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {monthlyBudgetFromDb ? `${monthlyBudgetFromDb} / mo` : "Not set"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {monthlyBudgetFromDb
                        ? `Income range (profile): ${toLabel(incomeRangeFromProfile)}`
                        : "Set your income range in account settings to see a rent budget."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main grid */}
          <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5 lg:gap-x-6">
            <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-4 sm:p-5 lg:col-span-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Rental Requests</h2>
                  <p className="text-gray-500 mt-1 text-xs sm:text-sm">Your request history and current statuses.</p>
                </div>
                <Link to="/tenant-dashboard/applications" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
                  View all
                </Link>
              </div>

              <div className="space-y-3">
                {recentRequests.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                    No rental requests yet. Browse listings to send your first request.
                  </p>
                ) : (
                  recentRequests.map((req) => (
                    <div key={req.requestId} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">Listing #{req.listingId}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {req.listing?.areaName ? String(req.listing.areaName).replaceAll("_", " ") : "Area not specified"}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          req.requestStatus === "PENDING"
                            ? "bg-amber-100 text-amber-900"
                            : req.requestStatus === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                        }`}>
                          {req.requestStatus}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-gray-900">Recent Notifications</h3>
                  <Link to="/notifications" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition">
                    Open inbox
                  </Link>
                </div>
                {recentNotifications.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-sm text-gray-500">
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recentNotifications.map((item) => (
                      <li key={item.id} className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                        <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="truncate text-xs text-gray-500">{item.message || "No details"}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to="/listings"
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-sm font-semibold transition"
                >
                  Browse Listings
                </Link>
                <Link
                  to="/tenant-dashboard/wishlist"
                  className="rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition"
                >
                  Open Wishlist
                </Link>
              </div>
            </div>

            <aside className="space-y-4 lg:col-span-5">
              <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
                  <h2 className="text-lg font-bold text-gray-900">Pending owner requests</h2>
                  <Link to="/tenant-dashboard/applications" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                    View all
                  </Link>
                </div>
                <div className="p-3 sm:p-4">
                  {pendingOwnerRequests.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                      No pending owner responses.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {pendingOwnerRequests.slice(0, 5).map((item) => (
                        <li key={item.requestId} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                          <p className="truncate text-sm font-semibold text-gray-900">Listing #{item.listingId}</p>
                          <p className="mt-1 text-xs text-gray-500">{item.listing?.areaName ? String(item.listing.areaName).replaceAll("_", " ") : "Area not specified"}</p>
                          <p className="mt-1 text-xs text-amber-700 font-medium">Waiting for owner review</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
                  <h2 className="text-lg font-bold text-gray-900">Recent payments</h2>
                  <Link to="/wallet" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                    View all
                  </Link>
                </div>
                <div className="p-3 sm:p-4">
                  {transactions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                      No wallet activity yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {transactions.map((txn) => (
                        <li key={txn.transactionId || txn.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{txn.description || txn.type || "Transaction"}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{txn.type} - {txn.status || "-"}</p>
                            <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(txn.createdAt)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                            txn.direction === "CREDIT"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                          }`}>
                            {txn.direction === "CREDIT" ? "+" : "-"}
                            {formatBdt(txn.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}


