import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch, isLoggedIn, logout } from '../lib/api';
import NotificationBell from '../components/NotificationBell';

const ONBOARDING_OPTIONS = ['AUTH_PENDING', 'PROFILE_PENDING', 'COMPLETED'];
const ROLE_OPTIONS = ['TENANT', 'OWNER', 'ADMIN'];
const KYC_OVERRIDE_OPTIONS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

const LISTING_STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_PAYMENT', label: 'Pending payment' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'UNLISTED', label: 'Unlisted' },
  { value: 'EXPIRED', label: 'Expired' },
];

const parseFeePolicies = (body) => body?.data?.feePolicies || body?.data?.items || body?.feePolicies || [];

const feeFormulaLabel = (policy) => {
  const parts = [];
  if (policy.fixedAmount != null && policy.fixedAmount !== '') {
    parts.push(`Fixed ${policy.fixedAmount}`);
  }
  if (policy.percentage != null && policy.percentage !== '') {
    const base = policy.percentBaseField || 'base';
    parts.push(`${policy.percentage}% of ${base}`);
  }
  if (policy.minAmount != null && policy.minAmount !== '') {
    parts.push(`Min ${policy.minAmount}`);
  }
  if (policy.maxAmount != null && policy.maxAmount !== '') {
    parts.push(`Max ${policy.maxAmount}`);
  }
  return parts.length ? parts.join(' + ') : 'No formula';
};

function Icon({ path, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
    </svg>
  );
}

function StatCard({ title, value, accent = 'emerald', iconPath, footer }) {
  const iconShell = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  };

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="mt-1 truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{value}</p>
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${iconShell[accent] || iconShell.emerald}`}
        >
          <Icon path={iconPath} className="h-4 w-4" />
        </span>
      </div>
      {footer ? <div className="mt-3 border-t border-gray-100 pt-2.5">{footer}</div> : null}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingsPagination, setListingsPagination] = useState(null);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsPage, setListingsPage] = useState(1);
  const [listingStatusFilter, setListingStatusFilter] = useState('');
  const [selectedListingDetails, setSelectedListingDetails] = useState(null);
  const [selectingListingId, setSelectingListingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('SUBMITTED');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectingUserId, setSelectingUserId] = useState(null);
  const [selectingSubmissionId, setSelectingSubmissionId] = useState(null);
  const [roleEdit, setRoleEdit] = useState('TENANT');
  const [onboardingEdit, setOnboardingEdit] = useState('AUTH_PENDING');
  const [kycOverrideEdit, setKycOverrideEdit] = useState('PENDING');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [feePolicies, setFeePolicies] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState('');
  const [feeCodeFilter, setFeeCodeFilter] = useState('');
  const [feeActiveFilter, setFeeActiveFilter] = useState('all');
  const [feeBusy, setFeeBusy] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState('users');
  const [feeForm, setFeeForm] = useState({
    code: '',
    name: '',
    currency: 'BDT',
    fixedAmount: '',
    percentage: '',
    percentBaseField: 'rent',
    minAmount: '',
    maxAmount: '',
    effectiveFrom: '',
    isActive: true,
  });

  const normalizeUser = (u) => ({
    user_id: u?.user_id || u?.userId,
    role: u?.role,
    onboarding_status: u?.onboarding_status || u?.onboardingStatus,
    email: u?.email || u?.contact_email || u?.contactEmail || null,
    contact_email: u?.contact_email || u?.contactEmail,
    contact_phone: u?.contact_phone || u?.contactPhone,
    is_active: typeof u?.is_active === 'boolean' ? u.is_active : u?.isActive,
    created_at: u?.created_at || u?.createdAt,
  });

  const toLabel = (value) => {
    if (value == null || value === '') return 'N/A';
    return String(value)
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  const formatBdt = (n) => {
    if (n == null || Number.isNaN(Number(n))) return 'N/A';
    try {
      return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        maximumFractionDigits: 0,
      }).format(Number(n));
    } catch {
      return `${Number(n).toLocaleString()} BDT`;
    }
  };

  const getUserEmail = (user, details) =>
    user?.contact_email ||
    user?.email ||
    (details?.credentials || []).find((cred) => cred.identifierType === 'EMAIL')?.identifier ||
    'Not provided';

  const getUserContact = (user, details) =>
    user?.contact_phone ||
    (details?.credentials || []).find((cred) => cred.identifierType === 'PHONE')?.identifier ||
    'Not provided';

  const roleTone = (role) => {
    if (role === 'ADMIN') return 'bg-violet-100 text-violet-800';
    if (role === 'OWNER') return 'bg-cyan-100 text-cyan-800';
    return 'bg-emerald-100 text-emerald-800';
  };

  const statusTone = (status) => {
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-700';
    if (status === 'UNDER_REVIEW') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const listingStatusTone = (status) => {
    if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-800';
    if (status === 'RENTED') return 'bg-cyan-100 text-cyan-800';
    if (status === 'PENDING_PAYMENT') return 'bg-amber-100 text-amber-800';
    if (status === 'DRAFT') return 'bg-slate-100 text-slate-700';
    if (status === 'EXPIRED') return 'bg-rose-100 text-rose-800';
    if (status === 'UNLISTED') return 'bg-gray-100 text-gray-700';
    return 'bg-slate-100 text-slate-700';
  };

  const formatRelativeTime = (iso) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`;
    const d = Math.floor(h / 24);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  };

  const pctChange = (current, prev) => {
    const c = Number(current) || 0;
    const p = Number(prev) || 0;
    if (p <= 0) return c > 0 ? 100 : 0;
    return Math.round(((c - p) / p) * 1000) / 10;
  };

  const listingFeedBadge = (status) => {
    if (status === 'ACTIVE') return { label: 'Verified', className: 'bg-emerald-100 text-emerald-800' };
    if (status === 'PENDING_PAYMENT' || status === 'DRAFT')
      return { label: 'Under review', className: 'bg-sky-100 text-sky-800' };
    return { label: toLabel(status), className: listingStatusTone(status) };
  };

  const toIsoString = (value) => {
    if (!value) return new Date().toISOString();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (!isLoggedIn()) {
        window.location.href = '/login';
        return;
      }

      const usersQuery = new URLSearchParams();
      usersQuery.set('page', '1');
      usersQuery.set('limit', '50');
      if (roleFilter) usersQuery.set('role', roleFilter);
      if (search.trim()) usersQuery.set('search', search.trim());

      const kycQuery = new URLSearchParams();
      kycQuery.set('page', '1');
      kycQuery.set('limit', '50');
      if (submissionStatusFilter) kycQuery.set('status', submissionStatusFilter);

      const [statsRes, usersRes, kycRes] = await Promise.all([
        apiFetch('/admin/stats/overview'),
        apiFetch(`/admin/users?${usersQuery.toString()}`),
        apiFetch(`/admin/kyc/submissions?${kycQuery.toString()}`),
      ]);

      if (statsRes.ok) {
        const statsBody = await statsRes.json();
        setStats(statsBody?.data || null);
      } else {
        setStats(null);
      }

      if (usersRes.ok) {
        const usersBody = await usersRes.json();
        setUsers((usersBody?.data?.users || []).map(normalizeUser));
      } else {
        setUsers([]);
      }

      if (kycRes.ok) {
        const kycBody = await kycRes.json();
        setKycSubmissions(kycBody?.data?.submissions || []);
      } else {
        setKycSubmissions([]);
      }
    } catch {
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, submissionStatusFilter]);

  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(listingsPage));
      q.set('limit', '50');
      q.set('sortBy', 'createdAt');
      q.set('sortDir', 'desc');
      if (listingStatusFilter) q.set('listingStatus', listingStatusFilter);
      const res = await apiFetch(`/admin/listings?${q.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to load listings');
      setListings(body?.data?.items || []);
      setListingsPagination(body?.data?.pagination || null);
    } catch (e) {
      toast.error(e.message || 'Failed to load listings');
      setListings([]);
      setListingsPagination(null);
    } finally {
      setListingsLoading(false);
    }
  }, [listingsPage, listingStatusFilter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeSection === 'listings') {
      loadListings();
    }
  }, [activeSection, loadListings]);

  const loadFeePolicies = useCallback(async () => {
    setFeeLoading(true);
    setFeeError('');
    try {
      const query = new URLSearchParams({ page: '1', limit: '100' });
      if (feeCodeFilter.trim()) query.set('code', feeCodeFilter.trim().toUpperCase());
      if (feeActiveFilter === 'active') query.set('isActive', 'true');
      if (feeActiveFilter === 'inactive') query.set('isActive', 'false');

      const res = await apiFetch(`/admin/fee-policies?${query.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to load fee policies');
      }
      setFeePolicies(parseFeePolicies(body));
    } catch (e) {
      setFeePolicies([]);
      setFeeError(e.message || 'Failed to load fee policies');
    } finally {
      setFeeLoading(false);
    }
  }, [feeCodeFilter, feeActiveFilter]);

  useEffect(() => {
    if (activeSection === 'fees') {
      loadFeePolicies();
    }
  }, [activeSection, loadFeePolicies]);

  const handleSelectUser = async (user) => {
    setSelectingUserId(user.user_id);
    setError('');

    try {
      const res = await apiFetch(`/admin/users/${user.user_id}`);
      if (!res.ok) throw new Error('Failed to fetch user details');
      const body = await res.json();
      const normalizedDetailUser = normalizeUser(body?.data?.user || {});
      const mergedUser = { ...user, ...normalizedDetailUser };
      setSelectedUser(mergedUser);
      setSelectedUserDetails({
        ...(body?.data || {}),
        user: normalizedDetailUser,
      });
      setRoleEdit(mergedUser?.role || 'TENANT');
      setOnboardingEdit(mergedUser?.onboarding_status || 'AUTH_PENDING');
      setKycOverrideEdit('PENDING');
      setActiveSection('users');
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch user details');
    } finally {
      setSelectingUserId(null);
    }
  };

  const handleSelectListing = async (item) => {
    setSelectingListingId(item.listingId);
    try {
      const res = await apiFetch(`/admin/listings/${item.listingId}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to load listing');
      setSelectedListingDetails(body?.data || null);
      setActiveSection('listings');
    } catch (e) {
      toast.error(e.message || 'Failed to load listing');
    } finally {
      setSelectingListingId(null);
    }
  };

  const handleUserPatch = async (_userId, path, payload, successMessage) => {
    setBusy(true);
    try {
      const res = await apiFetch(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Update failed');
      toast.success(successMessage);
      await loadDashboard();
      if (selectedUser) {
        await handleSelectUser(selectedUser);
      }
    } catch (e) {
      toast.error(e.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Soft delete this user account?')) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Delete failed');
      toast.success('User soft-deleted');
      await loadDashboard();
      setSelectedUser(null);
      setSelectedUserDetails(null);
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreUser = async (userId) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/admin/users/${userId}/restore`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Restore failed');
      toast.success('User restored');
      await loadDashboard();
      if (selectedUser) {
        await handleSelectUser(selectedUser);
      }
    } catch (e) {
      toast.error(e.message || 'Restore failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectSubmission = async (submission) => {
    setSelectingSubmissionId(submission.submissionId);
    try {
      const res = await apiFetch(`/admin/kyc/submissions/${submission.submissionId}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to load submission');
      setSelectedSubmission(submission);
      setSelectedSubmissionDetails(body?.data || null);
      setActiveSection('reports');
    } catch (e) {
      toast.error(e.message || 'Failed to load submission');
    } finally {
      setSelectingSubmissionId(null);
    }
  };

  const handleReviewSubmission = async (decision) => {
    if (!selectedSubmissionDetails?.submissionId) return;
    const rejectionReason =
      decision === 'REJECTED'
        ? prompt('Rejection reason (minimum 10 chars):') || ''
        : undefined;
    if (decision === 'REJECTED' && rejectionReason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(
        `/admin/kyc/submissions/${selectedSubmissionDetails.submissionId}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, rejectionReason }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Review failed');
      toast.success(`Submission ${decision.toLowerCase()} successfully`);
      await loadDashboard();
      setSelectedSubmission(null);
      setSelectedSubmissionDetails(null);
    } catch (e) {
      toast.error(e.message || 'Review failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateFeePolicy = async (event) => {
    event.preventDefault();
    setFeeBusy(true);
    try {
      const hasFixed = feeForm.fixedAmount !== '';
      const hasPercent = feeForm.percentage !== '';

      if (!feeForm.code.trim() || !feeForm.name.trim() || (!hasFixed && !hasPercent)) {
        throw new Error('Code, name and at least one fee component are required');
      }
      if (hasPercent && !feeForm.percentBaseField.trim()) {
        throw new Error('Base field is required when percentage is set');
      }

      const payload = {
        code: feeForm.code.trim().toUpperCase(),
        name: feeForm.name.trim(),
        currency: feeForm.currency.trim().toUpperCase() || 'BDT',
        fixedAmount: hasFixed ? Number(feeForm.fixedAmount) : undefined,
        percentage: hasPercent ? Number(feeForm.percentage) : undefined,
        percentBaseField: hasPercent ? feeForm.percentBaseField.trim() : undefined,
        minAmount: feeForm.minAmount !== '' ? Number(feeForm.minAmount) : undefined,
        maxAmount: feeForm.maxAmount !== '' ? Number(feeForm.maxAmount) : undefined,
        effectiveFrom: toIsoString(feeForm.effectiveFrom),
        effectiveTo: null,
        isActive: feeForm.isActive,
      };

      const res = await apiFetch('/admin/fee-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to create fee policy');

      toast.success(body?.message || 'Fee policy created');
      setFeeForm({
        code: '',
        name: '',
        currency: 'BDT',
        fixedAmount: '',
        percentage: '',
        percentBaseField: 'rent',
        minAmount: '',
        maxAmount: '',
        effectiveFrom: '',
        isActive: true,
      });
      await loadFeePolicies();
    } catch (e) {
      toast.error(e.message || 'Failed to create fee policy');
    } finally {
      setFeeBusy(false);
    }
  };

  const handleToggleFeePolicy = async (policy) => {
    setFeeBusy(true);
    try {
      const action = policy.isActive ? 'deactivate' : 'activate';
      const res = await apiFetch(`/admin/fee-policies/${policy.id}/${action}`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed to ${action} policy`);
      toast.success(body?.message || `Policy ${action}d`);
      await loadFeePolicies();
    } catch (e) {
      toast.error(e.message || 'Policy update failed');
    } finally {
      setFeeBusy(false);
    }
  };

  const handleEditFeePolicy = async (policy) => {
    const name = prompt('Update fee policy name', policy.name || '');
    if (name === null) return;

    const fixedRaw = prompt('Update fixed amount (leave empty to clear)', String(policy.fixedAmount ?? ''));
    if (fixedRaw === null) return;
    const percentageRaw = prompt('Update percentage (leave empty to clear)', String(policy.percentage ?? ''));
    if (percentageRaw === null) return;
    const baseFieldRaw = prompt('Update percentage base field (e.g. rent)', String(policy.percentBaseField ?? ''));
    if (baseFieldRaw === null) return;
    const minRaw = prompt('Update min amount (leave empty to clear)', String(policy.minAmount ?? ''));
    if (minRaw === null) return;
    const maxRaw = prompt('Update max amount (leave empty to clear)', String(policy.maxAmount ?? ''));
    if (maxRaw === null) return;

    const toNumberOrNull = (value) => {
      if (value.trim() === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : NaN;
    };

    const fixedAmount = toNumberOrNull(fixedRaw);
    const percentage = toNumberOrNull(percentageRaw);
    const minAmount = toNumberOrNull(minRaw);
    const maxAmount = toNumberOrNull(maxRaw);

    if ([fixedAmount, percentage, minAmount, maxAmount].some((v) => Number.isNaN(v))) {
      toast.error('Numeric inputs must be valid numbers');
      return;
    }
    if (typeof minAmount === 'number' && typeof maxAmount === 'number' && minAmount > maxAmount) {
      toast.error('Min amount cannot be greater than max amount');
      return;
    }
    if (typeof percentage === 'number' && !baseFieldRaw.trim()) {
      toast.error('Base field is required when percentage is set');
      return;
    }

    setFeeBusy(true);
    try {
      const patchPayload = {
        name: name.trim(),
        fixedAmount,
        percentage,
        percentBaseField: baseFieldRaw.trim() || null,
        minAmount,
        maxAmount,
      };
      const res = await apiFetch(`/admin/fee-policies/${policy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to update fee policy');
      toast.success(body?.message || 'Fee policy updated');
      await loadFeePolicies();
    } catch (e) {
      toast.error(e.message || 'Failed to update fee policy');
    } finally {
      setFeeBusy(false);
    }
  };

  const sideMenuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9.5z',
    },
    {
      key: 'listings',
      label: 'Properties',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    {
      key: 'users',
      label: 'Users',
      icon: 'M17 20h5v-1a4 4 0 00-5.546-3.69M9 20H2v-1a4 4 0 015.546-3.69M16 6a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      key: 'fees',
      label: 'Payments',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      key: 'topup-approvals',
      label: 'Topup Approvals',
      to: '/admin-dashboard/topup-approvals',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'M9 17v-6a1 1 0 011-1h8m-6 6h6m-6-3h4M4 7h4M4 11h2M4 15h1M4 5h16',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'M10.325 4.317a1 1 0 011.35-.936l1.06.396a1 1 0 00.95-.106l.985-.574a1 1 0 011.366.366l.5.866a1 1 0 00.79.49l1.145.15a1 1 0 01.878 1.12l-.1 1.11a1 1 0 00.287.829l.79.79a1 1 0 010 1.414l-.79.79a1 1 0 00-.287.829l.1 1.11a1 1 0 01-.878 1.12l-1.146.15a1 1 0 00-.789.49l-.5.866a1 1 0 01-1.366.366l-.985-.574a1 1 0 00-.95-.106l-1.06.396a1 1 0 01-1.35-.936l-.086-1.148a1 1 0 00-.522-.795l-.94-.542a1 1 0 01-.366-1.366l.574-.985a1 1 0 00.106-.95l-.396-1.06a1 1 0 01.936-1.35l1.148-.086a1 1 0 00.795-.522l.542-.94z',
    },
    {
      key: 'account',
      label: 'Account',
      to: '/account',
      icon: 'M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z',
    },
  ];

  const renderDashboardSection = () => {
    const pendingCount = stats?.pendingVerificationCount ?? kycSubmissions.length;
    const userWeekPct = pctChange(stats?.usersCreatedLast7Days, stats?.usersCreatedPrev7Days);
    const listingWeekPct = pctChange(stats?.listingsCreatedLast7Days, stats?.listingsCreatedPrev7Days);
    const recentListingsFeed = stats?.recentListings || [];
    const recentPaymentsFeed = stats?.recentPayments || [];
    const recentUsersFeed = stats?.recentUsers || [];

    const displayUserName = (u) => {
      const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      if (n) return n;
      return u.contactEmail || u.contactPhone || u.userId || 'User';
    };

    const isJoinedThisWeek = (iso) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      return Date.now() - t < 7 * 24 * 60 * 60 * 1000;
    };

    return (
      <>
        <section className="mb-4 rounded-xl border border-gray-200/90 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-3.5">
          <h1 className="text-lg font-semibold tracking-tight text-[#1e4732] sm:text-xl">Welcome, Admin!</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-600 sm:text-sm">
            Manage listings, users, and keep track of platform activity.
          </p>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard
            title="Total Listings"
            value={(stats?.totalListings ?? 0).toLocaleString()}
            accent="emerald"
            iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
          <StatCard
            title="Total Users"
            value={(stats?.totalUsers ?? 0).toLocaleString()}
            accent="amber"
            iconPath="M17 20h5v-1a4 4 0 00-5.546-3.69M9 20H2v-1a4 4 0 015.546-3.69M16 6a4 4 0 11-8 0 4 4 0 018 0z"
          />
          <StatCard
            title="Total Earnings"
            value={formatBdt(stats?.totalEarningsBdt ?? 0)}
            accent="sky"
            iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <StatCard
            title="Pending Verifications"
            value={pendingCount.toLocaleString()}
            accent="rose"
            iconPath="M12 9v4m0 4h.01M10.29 3.86l-8 14A1 1 0 003.15 20h17.7a1 1 0 00.86-1.5l-8-14a1 1 0 00-1.72 0z"
            footer={
              <button
                type="button"
                onClick={() => {
                  setActiveSection('reports');
                  setMobileDrawerOpen(false);
                }}
                className="w-full rounded-lg bg-emerald-700 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Review
              </button>
            }
          />
        </section>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-12 xl:gap-5 xl:[&>section]:min-h-0">
          <section className="flex min-h-0 flex-col rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm sm:p-5 xl:col-span-7 xl:h-full xl:min-h-[22rem]">
            <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
              <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-gray-900">Recent Listings</h2>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('listings');
                  setMobileDrawerOpen(false);
                }}
                className="inline-flex shrink-0 items-center text-xs font-semibold leading-none text-emerald-700 hover:text-emerald-900 sm:text-sm"
              >
                View All {'->'}
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                {recentListingsFeed.length === 0 ? (
                  <p className="flex min-h-[12rem] flex-1 items-center justify-center rounded-lg bg-gray-50 px-2 py-7 text-center text-sm text-gray-500">
                    No listings yet.
                  </p>
                ) : (
                  recentListingsFeed.map((row) => {
                    const badge = listingFeedBadge(row.listingStatus);
                    return (
                      <div
                        key={row.listingId}
                        className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:flex-row sm:items-stretch sm:gap-4"
                      >
                        <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-gray-200 sm:aspect-auto sm:h-28 sm:w-36">
                          <img
                            src={row.imageUrl || '/hero-image.jpg'}
                            alt={row.title || 'Listing'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/hero-image.jpg';
                            }}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{row.title}</p>
                            <p className="mt-0.5 text-xs font-medium text-emerald-800 sm:text-sm">
                              {formatBdt(row.rent)} / month
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">{toLabel(row.areaName)}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                              {badge.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectListing({ listingId: row.listingId });
                                setMobileDrawerOpen(false);
                              }}
                              disabled={selectingListingId === row.listingId}
                              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                            >
                              {selectingListingId === row.listingId ? 'Loading...' : 'View Details'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm sm:p-5 xl:col-span-5 xl:h-full xl:min-h-[22rem]">
            <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
              <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-gray-900">New Users</h2>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('users');
                  setMobileDrawerOpen(false);
                }}
                className="inline-flex shrink-0 items-center text-xs font-semibold leading-none text-emerald-700 hover:text-emerald-900 sm:text-sm"
              >
                View All {'->'}
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              {recentUsersFeed.length === 0 ? (
                <p className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 py-7 text-center text-sm text-gray-500">
                  No users yet.
                </p>
              ) : (
                <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                  {recentUsersFeed.map((u) => {
                    const verified = u.kycVerificationStatus === 'APPROVED';
                    const isNew = isJoinedThisWeek(u.createdAt) && !verified;
                    return (
                      <li
                        key={u.userId}
                        className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 sm:gap-3 sm:p-3"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 sm:h-10 sm:w-10 sm:text-sm">
                          {(displayUserName(u).charAt(0) || '?').toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{displayUserName(u)}</p>
                          <p className="text-xs text-gray-500">
                            {u.role === 'OWNER' ? 'Property Owner' : u.role === 'TENANT' ? 'Tenant' : toLabel(u.role)}
                            {u.contactPhone ? ` - ${u.contactPhone}` : ''}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {verified ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 sm:text-[11px]">
                                Verified
                              </span>
                            ) : null}
                            {isNew ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 sm:text-[11px]">
                                New
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm sm:p-5 xl:col-span-7 xl:h-full xl:min-h-[22rem]">
            <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
              <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-gray-900">Recent Payments</h2>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('fees');
                  setMobileDrawerOpen(false);
                }}
                className="inline-flex shrink-0 items-center text-xs font-semibold leading-none text-emerald-700 hover:text-emerald-900 sm:text-sm"
              >
                View All {'->'}
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              {recentPaymentsFeed.length === 0 ? (
                <p className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 py-7 text-center text-sm text-gray-500">
                  No posted wallet transactions yet.
                </p>
              ) : (
                <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                  {recentPaymentsFeed.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{p.userLabel}</p>
                        <p className="truncate text-xs text-gray-500">{p.description || toLabel(p.type)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-gray-900">{formatBdt(p.amount)}</p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(p.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/[0.35] to-teal-50/[0.45] p-3.5 shadow-sm sm:p-5 xl:col-span-5 xl:h-full xl:min-h-[22rem]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/25 blur-2xl" />
            <div className="mb-3 flex min-h-10 shrink-0 items-center justify-between gap-3 sm:min-h-11">
              <h2 className="min-w-0 flex-1 truncate text-base font-bold leading-snug text-gray-900">System Analytics</h2>
              <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200/80 bg-white/90 px-2.5 py-1 text-xs font-semibold leading-none text-emerald-800 sm:text-sm">
                Past 7 days
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
                <div className="inline-flex shrink-0 rounded-xl border border-emerald-200/80 bg-white p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setAnalyticsTab('users')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      analyticsTab === 'users' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-emerald-50/70'
                    }`}
                  >
                    Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsTab('properties')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      analyticsTab === 'properties' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-emerald-50/70'
                    }`}
                  >
                    Properties
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-emerald-100/80 bg-white/90 px-3 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {analyticsTab === 'users' ? 'New registrations' : 'Listing activity'}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-[1.7rem]">
                      {analyticsTab === 'users'
                        ? (stats?.usersCreatedLast7Days ?? 0).toLocaleString()
                        : (stats?.listingsCreatedLast7Days ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      {analyticsTab === 'users'
                        ? `${(stats?.activeToday ?? 0).toLocaleString()} active users today`
                        : `${(stats?.activeListingsCount ?? 0).toLocaleString()} live listings`}
                    </p>
                    <div className="mt-auto flex h-12 shrink-0 items-end gap-0.5 pt-3 sm:h-14 sm:gap-1">
                      {[35, 50, 42, 68, 55, 72, 60].map((h, i) => (
                        <div
                          key={i}
                          className="min-w-0 flex-1 rounded-t bg-gradient-to-t from-emerald-500/80 to-emerald-300/80"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col justify-center rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2.5 text-right shadow-sm sm:max-w-[11rem] sm:self-stretch">
                    <p className="text-[11px] font-semibold text-emerald-800">
                      {analyticsTab === 'users'
                        ? `${userWeekPct >= 0 ? '+' : ''}${userWeekPct}% this week`
                        : `${listingWeekPct >= 0 ? '+' : ''}${listingWeekPct}% this week`}
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-900 sm:text-xl">
                      {analyticsTab === 'users'
                        ? (stats?.totalUsers ?? 0).toLocaleString()
                        : (stats?.activeListingsCount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-800">
                      {analyticsTab === 'users' ? 'Registered users' : 'Listed properties'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  };

  const renderUsersSection = () => (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-12">
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            type="text"
            placeholder="Search by email, phone, or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Users</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {users.length}
          </span>
        </div>
        <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1">
          {users.length === 0 ? (
            <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
              No users found.
            </p>
          ) : (
            users.map((user) => (
              <button
                key={user.user_id}
                type="button"
                onClick={() => handleSelectUser(user)}
                disabled={selectingUserId === user.user_id}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedUser?.user_id === user.user_id
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                } disabled:opacity-60`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.contact_email || user.contact_phone || user.user_id}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleTone(user.role)}`}>
                        {toLabel(user.role)}
                      </span>
                      <span className="text-xs text-slate-500">{toLabel(user.onboarding_status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Joined {formatDate(user.created_at)}</p>
                  </div>
                  {selectingUserId === user.user_id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-600" />
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
        {selectedUser && selectedUserDetails ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">User review panel</p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedUser.contact_email || selectedUser.contact_phone || selectedUser.user_id}
                </h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleTone(selectedUser.role)}`}>
                {toLabel(selectedUser.role)}
              </span>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-semibold text-slate-900">
                  {getUserEmail(selectedUser, selectedUserDetails)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Contact</p>
                <p className="text-sm font-semibold text-slate-900">
                  {getUserContact(selectedUser, selectedUserDetails)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Onboarding</p>
                <p className="text-sm font-semibold text-slate-900">
                  {toLabel(selectedUser.onboarding_status)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Joined</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(selectedUser.created_at)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Credentials</h3>
              {selectedUserDetails.credentials?.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No credentials found for this account.
                </div>
              ) : (
                <div className="space-y-2">
                  {(selectedUserDetails.credentials || []).map((cred) => (
                    <div
                      key={cred.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{cred.identifier}</p>
                        <p className="text-xs text-slate-500">{cred.identifierType}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          cred.verifiedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {cred.verifiedAt ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-800">Change role</label>
                <div className="flex gap-2">
                  <select
                    value={roleEdit}
                    onChange={(e) => setRoleEdit(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleUserPatch(
                        selectedUser.user_id,
                        `/admin/users/${selectedUser.user_id}/role`,
                        { role: roleEdit },
                        'Role updated'
                      )
                    }
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-800">Active status</label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    handleUserPatch(
                      selectedUser.user_id,
                      `/admin/users/${selectedUser.user_id}/active`,
                      { isActive: !selectedUser.is_active },
                      `User ${selectedUser.is_active ? 'deactivated' : 'activated'}`
                    )
                  }
                  className="w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Set {selectedUser.is_active ? 'Inactive' : 'Active'}
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-800">Onboarding status</label>
                <div className="flex gap-2">
                  <select
                    value={onboardingEdit}
                    onChange={(e) => setOnboardingEdit(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    {ONBOARDING_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleUserPatch(
                        selectedUser.user_id,
                        `/admin/users/${selectedUser.user_id}/onboarding-status`,
                        { onboardingStatus: onboardingEdit },
                        'Onboarding status updated'
                      )
                    }
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-800">KYC override</label>
                <div className="flex gap-2">
                  <select
                    value={kycOverrideEdit}
                    onChange={(e) => setKycOverrideEdit(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    {KYC_OVERRIDE_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const reason = prompt('Reason for KYC override (minimum 10 chars):') || '';
                      if (reason.trim().length < 10) {
                        toast.error('Reason must be at least 10 characters');
                        return;
                      }
                      handleUserPatch(
                        selectedUser.user_id,
                        `/admin/users/${selectedUser.user_id}/kyc-status`,
                        { kycVerificationStatus: kycOverrideEdit, reason },
                        'KYC status updated'
                      );
                    }}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDeleteUser(selectedUser.user_id)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Soft Delete User
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleRestoreUser(selectedUser.user_id)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Restore User
              </button>
            </div>
          </>
        ) : (
          <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <Icon
                className="mx-auto mb-3 h-10 w-10 text-slate-400"
                path="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0"
              />
              <p className="text-base font-medium text-slate-700">Select a user to review details</p>
            </div>
          </div>
        )}
      </section>
    </section>
  );

  const renderVerificationSection = () => (
    <section className="mt-0 grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Submission status
          </label>
          <select
            value={submissionStatusFilter}
            onChange={(e) => setSubmissionStatusFilter(e.target.value)}
            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 md:w-auto"
          >
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">KYC submissions</h3>
        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {kycSubmissions.length === 0 ? (
            <p className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-500">
              No submissions for this filter.
            </p>
          ) : (
            kycSubmissions.map((submission) => (
              <button
                key={submission.submissionId}
                type="button"
                onClick={() => handleSelectSubmission(submission)}
                disabled={selectingSubmissionId === submission.submissionId}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedSubmission?.submissionId === submission.submissionId
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                } disabled:opacity-60`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{submission.userEmail}</p>
                  {selectingSubmissionId === submission.submissionId ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-600" />
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(submission.status)}`}>
                      {toLabel(submission.status)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{toLabel(submission.userRole)}</p>
                <p className="text-xs text-slate-500">{formatDate(submission.submittedAt)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
        {selectedSubmissionDetails ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">Submission review</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(selectedSubmissionDetails.status)}`}>
                {toLabel(selectedSubmissionDetails.status)}
              </span>
            </div>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                <span className="font-semibold">User:</span> {selectedSubmissionDetails.userEmail}
              </p>
              <p>
                <span className="font-semibold">Role:</span> {toLabel(selectedSubmissionDetails.userRole)}
              </p>
            </div>

            <div className="space-y-3">
              {(selectedSubmissionDetails.documents || []).map((doc) => (
                <div key={doc.documentId} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{toLabel(doc.documentType)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(doc.verificationStatus)}`}>
                      {toLabel(doc.verificationStatus)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {doc.fileName || 'Unnamed file'}
                    {doc.mimeType ? ` - ${doc.mimeType}` : ''}
                  </p>
                  {doc.signedUrl ? (
                    <div className="mt-2">
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Open document
                      </a>
                      {String(doc.mimeType || '').startsWith('image/') ? (
                        <img
                          src={doc.signedUrl}
                          alt={doc.fileName || doc.documentType}
                          className="mt-3 max-h-72 w-full max-w-md rounded-lg border border-slate-200 object-contain"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleReviewSubmission('APPROVED')}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Approve Submission
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleReviewSubmission('REJECTED')}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Reject Submission
              </button>
            </div>
          </>
        ) : (
          <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-base font-medium text-slate-600">Select a KYC submission to review.</p>
          </div>
        )}
      </section>
    </section>
  );

  const renderListingsSection = () => {
    const totalPages = listingsPagination?.totalPages ?? 1;
    const canPrev = listingsPage > 1;
    const canNext = listingsPage < totalPages;

    return (
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">Listings</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {listingsPagination?.total ?? listings.length}
            </span>
          </div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <select
            value={listingStatusFilter}
            onChange={(e) => {
              setListingStatusFilter(e.target.value);
              setListingsPage(1);
            }}
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            {LISTING_STATUS_FILTERS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Page {listingsPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={!canPrev || listingsLoading}
                onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={!canNext || listingsLoading}
                onClick={() => setListingsPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {listingsLoading && listings.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600" />
              </div>
            ) : null}
            {!listingsLoading && listings.length === 0 ? (
              <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">No listings found.</p>
            ) : null}
            {listings.map((item) => (
              <button
                key={item.listingId}
                type="button"
                onClick={() => handleSelectListing(item)}
                disabled={selectingListingId === item.listingId}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedListingDetails?.listingId === item.listingId
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                } disabled:opacity-60`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-800">{formatBdt(item.rent)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {toLabel(item.areaName)} - {item.roomCount} bed - {formatDate(item.listingStartDate)}
                    </p>
                  </div>
                  {selectingListingId === item.listingId ? (
                    <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-b-2 border-emerald-600" />
                  ) : (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${listingStatusTone(item.listingStatus)}`}>
                      {toLabel(item.listingStatus)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
          {selectedListingDetails ? (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Listing detail</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedListingDetails.title}</h2>
                  <p className="mt-1 font-semibold text-emerald-800">{formatBdt(selectedListingDetails.rent)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listingStatusTone(selectedListingDetails.listingStatus)}`}>
                    {toLabel(selectedListingDetails.listingStatus)}
                  </span>
                  {selectedListingDetails.listingStatus === 'ACTIVE' ? (
                    <Link
                      to={`/listings/${selectedListingDetails.listingId}`}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-800"
                    >
                      Public page
                    </Link>
                  ) : null}
                </div>
              </div>

              <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selectedListingDetails.description}</p>

              <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Property ID</p>
                  <p className="break-all text-sm font-semibold text-slate-900">{selectedListingDetails.propertyId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Listing ID</p>
                  <p className="break-all text-sm font-semibold text-slate-900">{selectedListingDetails.listingId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Area</p>
                  <p className="text-sm font-semibold text-slate-900">{toLabel(selectedListingDetails.areaName)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Size (sq ft)</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedListingDetails.propertySizeSqft}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rooms / baths / balcony</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedListingDetails.roomCount} / {selectedListingDetails.bathroomCount} / {selectedListingDetails.balconyCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Intended tenant</p>
                  <p className="text-sm font-semibold text-slate-900">{toLabel(selectedListingDetails.intendedTenantType)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Listing period</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDate(selectedListingDetails.listingStartDate)}
                    {selectedListingDetails.listingEndDate ? ` -> ${formatDate(selectedListingDetails.listingEndDate)}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedListingDetails.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Building</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedListingDetails.buildingFloors} fl - {toLabel(selectedListingDetails.buildingFacing)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Lift / generator / guard</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedListingDetails.hasLift ? 'Yes' : 'No'} / {selectedListingDetails.hasGenerator ? 'Yes' : 'No'} /{' '}
                    {selectedListingDetails.hasSecurityGuard ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-emerald-900">Location & owner (admin)</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-600">Address</p>
                    <p className="text-sm font-medium text-slate-900">{selectedListingDetails.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Coordinates</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedListingDetails.exactLat != null && selectedListingDetails.exactLng != null
                        ? `${selectedListingDetails.exactLat}, ${selectedListingDetails.exactLng}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Owner email</p>
                    <p className="text-sm font-medium text-slate-900">{selectedListingDetails.ownerContact?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Owner phone</p>
                    <p className="text-sm font-medium text-slate-900">{selectedListingDetails.ownerContact?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Images</h3>
                {(selectedListingDetails.images || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No images uploaded.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(selectedListingDetails.images || []).map((img) =>
                      img.url ? (
                        <a
                          key={img.imageId}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-xl border border-slate-200 shadow-sm"
                        >
                          <img src={img.url} alt={img.fileName || ''} className="h-36 w-48 object-cover" />
                          {img.isPrimary ? (
                            <span className="block bg-slate-900/80 px-2 py-1 text-center text-[10px] font-semibold text-white">
                              Primary
                            </span>
                          ) : null}
                        </a>
                      ) : (
                        <div key={img.imageId} className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-xs text-slate-500">
                          {img.fileName || img.imageId} (URL unavailable)
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <div className="text-center px-4">
                <Icon
                  className="mx-auto mb-3 h-10 w-10 text-slate-400"
                  path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
                <p className="text-base font-medium text-slate-700">Select a listing to view full details</p>
                <p className="mt-2 text-sm text-slate-500">Includes address, coordinates, and owner contact for moderation.</p>
              </div>
            </div>
          )}
        </section>
      </section>
    );
  };

  const renderFeePoliciesSection = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fee policies</h2>
          <p className="text-sm text-slate-500">Manage listing and unlock fee policies.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={feeCodeFilter}
            onChange={(e) => setFeeCodeFilter(e.target.value)}
            placeholder="Filter by code"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={feeActiveFilter}
            onChange={(e) => setFeeActiveFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleCreateFeePolicy} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-12">
        <input
          type="text"
          placeholder="Code (e.g. LISTING_CREATE)"
          value={feeForm.code}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, code: e.target.value }))}
          className="md:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="text"
          placeholder="Policy name"
          value={feeForm.name}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, name: e.target.value }))}
          className="md:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Fixed amount"
          value={feeForm.fixedAmount}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, fixedAmount: e.target.value }))}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Percent"
          value={feeForm.percentage}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, percentage: e.target.value }))}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="text"
          placeholder="Percent base field (e.g. rent)"
          value={feeForm.percentBaseField}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, percentBaseField: e.target.value }))}
          className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Min amount"
          value={feeForm.minAmount}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, minAmount: e.target.value }))}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Max amount"
          value={feeForm.maxAmount}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <input
          type="datetime-local"
          value={feeForm.effectiveFrom}
          onChange={(e) => setFeeForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
          className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
        />
        <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={feeForm.isActive}
            onChange={(e) => setFeeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          Active on create
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={feeBusy}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            Create fee policy
          </button>
        </div>
      </form>

      {feeError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{feeError}</div>
      ) : null}

      {feeLoading ? (
        <p className="text-sm text-slate-500">Loading fee policies...</p>
      ) : feePolicies.length === 0 ? (
        <p className="text-sm text-slate-500">No fee policies found for selected filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Formula</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Effective from</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feePolicies.map((policy) => (
                <tr key={policy.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-semibold text-slate-900">{policy.code}</td>
                  <td className="py-2 pr-4 text-slate-700">{policy.version}</td>
                  <td className="py-2 pr-4 text-slate-700">{policy.name}</td>
                  <td className="py-2 pr-4 text-slate-700">
                    {feeFormulaLabel(policy)} {policy.currency}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        policy.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {policy.effectiveFrom ? new Date(policy.effectiveFrom).toLocaleString() : 'N/A'}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={feeBusy}
                        onClick={() => handleEditFeePolicy(policy)}
                        className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={feeBusy}
                        onClick={() => handleToggleFeePolicy(policy)}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
                          policy.isActive ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {policy.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderPlaceholder = (title, description) => (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <p className="mt-4 text-sm text-slate-500">
        This section is now clickable from the drawer. You can connect it to dedicated APIs/components when ready.
      </p>
    </section>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f3]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-700" />
          <p className="text-sm font-medium text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f7f3] text-gray-800">
      <div className="mx-auto w-full max-w-[1440px] lg:pl-[270px]">
        {mobileDrawerOpen ? (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 right-0 z-40 flex h-screen w-[min(270px,88vw)] max-w-[270px] flex-col overflow-y-auto overscroll-contain border-l border-[#dceadf] bg-[#f7fbf8] transition-transform duration-200 ease-out lg:left-0 lg:right-auto lg:border-l-0 lg:border-r lg:translate-x-0 ${
            mobileDrawerOpen ? 'translate-x-0 shadow-[-4px_0_24px_rgba(30,71,50,0.08)]' : 'translate-x-full lg:shadow-none'
          }`}
        >
          <div className="border-b border-[#dceadf]/80 bg-white/90 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl p-1.5 -m-1.5 transition hover:bg-emerald-50/60"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <img
                src="/logo.jpg"
                alt="Rent Nao"
                className="h-10 w-10 shrink-0 rounded-xl border border-emerald-100/80 object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight tracking-tight text-[#2f8444] sm:text-[1.05rem]">
                  Rent Nao
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600/80">
                  Admin
                </p>
              </div>
            </Link>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Menu</p>
            <nav className="space-y-1" aria-label="Admin sidebar">
              {sideMenuItems.map((item) => {
                const isActive = item.to
                  ? typeof window !== 'undefined' && window.location.pathname.startsWith(item.to)
                  : activeSection === item.key;
                const itemClass = `group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-emerald-200/60'
                    : 'text-gray-700 hover:bg-white/90 hover:text-emerald-900'
                }`;
                const iconClass = `grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white/80 text-gray-500 ring-1 ring-gray-200/80 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-100'
                }`;
                if (item.to) {
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={itemClass}
                    >
                      <span className={iconClass}>
                        <Icon className="h-4 w-4" path={item.icon} />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.key);
                      setMobileDrawerOpen(false);
                    }}
                    className={itemClass}
                  >
                    <span className={iconClass}>
                      <Icon className="h-4 w-4" path={item.icon} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-[#dceadf] bg-white/40 px-3 py-4 sm:px-4">
            <button
              type="button"
              onClick={() => {
                setMobileDrawerOpen(false);
                logout();
              }}
              className="w-full rounded-xl border border-red-100 bg-red-50/90 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-6">
              <div className="flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">
                <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5" onClick={() => setMobileDrawerOpen(false)}>
                  <img
                    src="/logo.jpg"
                    alt="Rent Nao"
                    className="h-8 w-8 shrink-0 rounded-md border border-green-100 object-cover sm:h-9 sm:w-9"
                  />
                  <span className="truncate text-base font-semibold text-[#2f8444] sm:text-xl sm:tracking-tight">Rent Nao</span>
                </Link>

                <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-2 md:gap-3.5">
                  <NotificationBell />
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-xs font-semibold text-white shadow-sm sm:h-9 sm:w-9 sm:text-sm"
                    title="Admin"
                  >
                    A
                  </div>
                  <button
                    type="button"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 lg:hidden"
                    aria-label="Open menu"
                    onClick={() => setMobileDrawerOpen((v) => !v)}
                  >
                    <Icon className="h-4 w-4" path="M4 7h16M4 12h16M4 17h16" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            {error ? (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                <span className="text-sm font-medium">{error}</span>
                <button type="button" onClick={() => setError('')} className="text-lg font-bold leading-none">
                  Ã—
                </button>
              </div>
            ) : null}

            {activeSection === 'dashboard' ? renderDashboardSection() : null}
            {activeSection === 'users' ? renderUsersSection() : null}
            {activeSection === 'reports' ? renderVerificationSection() : null}
            {activeSection === 'listings' ? renderListingsSection() : null}
            {activeSection === 'fees' ? renderFeePoliciesSection() : null}
            {activeSection === 'settings'
              ? renderPlaceholder('Settings', 'Configure platform-level admin preferences and permissions.')
              : null}
          </main>
        </div>
      </div>
    </div>
  );
}


