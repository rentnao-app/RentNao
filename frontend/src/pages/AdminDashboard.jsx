import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch, isLoggedIn, logout } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import AdminDashboardSection from './admin-dashboard/AdminDashboardSection';
import AdminDiscountPoliciesSection from './admin-dashboard/AdminDiscountPoliciesSection';
import AdminFeePoliciesSection from './admin-dashboard/AdminFeePoliciesSection';
import AdminHeader from './admin-dashboard/AdminHeader';
import AdminKycSection from './admin-dashboard/AdminKycSection';
import AdminListingsSection from './admin-dashboard/AdminListingsSection';
import AdminPlaceholderSection from './admin-dashboard/AdminPlaceholderSection';
import AdminSidebar from './admin-dashboard/AdminSidebar';
import AdminUsersSection from './admin-dashboard/AdminUsersSection';
import {
  normalizeUser,
  parseFeePolicies,
  toIsoString,
  toLabel,
} from './admin-dashboard/adminDashboardUtils';

export default function AdminDashboard() {
  const { t } = useTranslation();
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const isInitialLoad = useRef(true);
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
  const [discountPolicies, setDiscountPolicies] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountCodeFilter, setDiscountCodeFilter] = useState('');
  const [discountFeeCodeFilter, setDiscountFeeCodeFilter] = useState('');
  const [discountActiveFilter, setDiscountActiveFilter] = useState('all');
  const [discountBusy, setDiscountBusy] = useState(false);
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
  const [discountForm, setDiscountForm] = useState({
    code: '',
    feePolicyCode: '',
    discountType: 'PERCENTAGE',
    fixedAmount: '',
    percentage: '',
    minAmount: '',
    maxAmount: '',
    maxRedemptionsTotal: '',
    maxRedemptionsPerUser: '',
    eligibleRole: '',
    effectiveFrom: '',
    isActive: true,
  });

  const loadDashboard = useCallback(async () => {
    const initial = isInitialLoad.current;
    if (initial) {
      setLoading(true);
    } else {
      setUsersRefreshing(true);
    }
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
      if (debouncedSearch.trim()) usersQuery.set('search', debouncedSearch.trim());

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
      setError(t('admin.toasts.loadFailed'));
    } finally {
      if (initial) {
        isInitialLoad.current = false;
        setLoading(false);
      } else {
        setUsersRefreshing(false);
      }
    }
  }, [roleFilter, debouncedSearch, submissionStatusFilter, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

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
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.loadListingsFailed'));
      setListings(body?.data?.items || []);
      setListingsPagination(body?.data?.pagination || null);
    } catch (e) {
      toast.error(e.message || t('admin.toasts.loadListingsFailed'));
      setListings([]);
      setListingsPagination(null);
    } finally {
      setListingsLoading(false);
    }
  }, [listingsPage, listingStatusFilter, t]);

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
        throw new Error(body?.error || t('admin.toasts.loadFeePoliciesFailed'));
      }
      setFeePolicies(parseFeePolicies(body));
    } catch (e) {
      setFeePolicies([]);
      setFeeError(e.message || t('admin.toasts.loadFeePoliciesFailed'));
    } finally {
      setFeeLoading(false);
    }
  }, [feeCodeFilter, feeActiveFilter, t]);

  useEffect(() => {
    if (activeSection === 'fees') {
      loadFeePolicies();
    }
  }, [activeSection, loadFeePolicies]);

  const loadDiscountPolicies = useCallback(async () => {
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const query = new URLSearchParams({ page: '1', limit: '100' });
      if (discountCodeFilter.trim()) query.set('code', discountCodeFilter.trim().toUpperCase());
      if (discountFeeCodeFilter.trim()) query.set('feePolicyCode', discountFeeCodeFilter.trim().toUpperCase());
      if (discountActiveFilter === 'active') query.set('isActive', 'true');
      if (discountActiveFilter === 'inactive') query.set('isActive', 'false');

      const res = await apiFetch(`/admin/discount-policies?${query.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || t('admin.toasts.loadDiscountPoliciesFailed'));
      }
      setDiscountPolicies(body?.data?.discountPolicies || []);
    } catch (e) {
      setDiscountPolicies([]);
      setDiscountError(e.message || t('admin.toasts.loadDiscountPoliciesFailed'));
    } finally {
      setDiscountLoading(false);
    }
  }, [discountCodeFilter, discountFeeCodeFilter, discountActiveFilter, t]);

  useEffect(() => {
    if (activeSection === 'discounts') {
      loadDiscountPolicies();
    }
  }, [activeSection, loadDiscountPolicies]);

  const handleSelectUser = async (user) => {
    setSelectingUserId(user.user_id);
    setError('');

    try {
      const res = await apiFetch(`/admin/users/${user.user_id}`);
      if (!res.ok) throw new Error(t('admin.toasts.loadUserFailed'));
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
      toast.error(err?.message || t('admin.toasts.loadUserFailed'));
    } finally {
      setSelectingUserId(null);
    }
  };

  const handleSelectListing = async (item) => {
    setSelectingListingId(item.listingId);
    try {
      const res = await apiFetch(`/admin/listings/${item.listingId}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.loadListingFailed'));
      setSelectedListingDetails(body?.data || null);
      setActiveSection('listings');
    } catch (e) {
      toast.error(e.message || t('admin.toasts.loadListingFailed'));
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
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.updateFailed'));
      toast.success(successMessage);
      await loadDashboard();
      if (selectedUser) {
        await handleSelectUser(selectedUser);
      }
    } catch (e) {
      toast.error(e.message || t('admin.toasts.operationFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm(t('admin.prompts.softDeleteConfirm'))) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.deleteFailed'));
      toast.success(t('admin.toasts.userSoftDeleted'));
      await loadDashboard();
      setSelectedUser(null);
      setSelectedUserDetails(null);
    } catch (e) {
      toast.error(e.message || t('admin.toasts.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleHardDeleteUser = async (user) => {
    const label = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.contact_email || user?.user_id;
    const confirmText = prompt(t('admin.prompts.hardDeleteConfirm', { label })) || '';
    if (confirmText !== 'DELETE') return;

    setBusy(true);
    try {
      const res = await apiFetch(`/admin/users/${user.user_id}/hard-delete`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.hardDeleteFailed'));
      toast.success(t('admin.toasts.userPermanentlyDeleted'));
      await loadDashboard();
      setSelectedUser(null);
      setSelectedUserDetails(null);
    } catch (e) {
      toast.error(e.message || t('admin.toasts.hardDeleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreUser = async (userId) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/admin/users/${userId}/restore`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || t('admin.toasts.restoreFailed'));
      toast.success(t('admin.toasts.userRestored'));
      await loadDashboard();
      if (selectedUser) {
        await handleSelectUser(selectedUser);
      }
    } catch (e) {
      toast.error(e.message || t('admin.toasts.restoreFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleSelectSubmission = async (submission) => {
    setSelectingSubmissionId(submission.submissionId);
    try {
      const res = await apiFetch(`/admin/kyc/submissions/${submission.submissionId}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.loadSubmissionFailed'));
      setSelectedSubmission(submission);
      setSelectedSubmissionDetails(body?.data || null);
      setActiveSection('reports');
    } catch (e) {
      toast.error(e.message || t('admin.toasts.loadSubmissionFailed'));
    } finally {
      setSelectingSubmissionId(null);
    }
  };

  const handleReviewSubmission = async (decision) => {
    if (!selectedSubmissionDetails?.submissionId) return;
    const rejectionReason =
      decision === 'REJECTED'
        ? prompt(t('admin.prompts.rejectionReason')) || ''
        : undefined;
    if (decision === 'REJECTED' && rejectionReason.trim().length < 10) {
      toast.error(t('admin.toasts.rejectionReasonMin'));
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
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.reviewFailed'));
      toast.success(t('admin.toasts.submissionReviewed', { decision: toLabel(decision, t).toLowerCase() }));
      await loadDashboard();
      setSelectedSubmission(null);
      setSelectedSubmissionDetails(null);
    } catch (e) {
      toast.error(e.message || t('admin.toasts.reviewFailed'));
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
        throw new Error(t('admin.toasts.codeNameFeeRequired'));
      }
      if (hasPercent && !feeForm.percentBaseField.trim()) {
        throw new Error(t('admin.toasts.baseFieldRequired'));
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
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.createFeePolicyFailed'));

      toast.success(body?.message || t('admin.toasts.feePolicyCreated'));
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
      toast.error(e.message || t('admin.toasts.createFeePolicyFailed'));
    } finally {
      setFeeBusy(false);
    }
  };

  const handleCreateDiscountPolicy = async (event) => {
    event.preventDefault();
    setDiscountBusy(true);
    try {
      if (!discountForm.code.trim() || !discountForm.feePolicyCode.trim()) {
        throw new Error(t('admin.toasts.discountCodesRequired'));
      }

      const hasFixed = discountForm.fixedAmount !== '';
      const hasPercent = discountForm.percentage !== '';

      if (discountForm.discountType === 'FIXED' && !hasFixed) {
        throw new Error(t('admin.toasts.fixedAmountRequired'));
      }
      if (discountForm.discountType === 'PERCENTAGE' && !hasPercent) {
        throw new Error(t('admin.toasts.percentageRequired'));
      }
      if (discountForm.discountType === 'FIXED' && hasPercent) {
        throw new Error(t('admin.toasts.percentageNotAllowedFixed'));
      }
      if (discountForm.discountType === 'PERCENTAGE' && hasFixed) {
        throw new Error(t('admin.toasts.fixedNotAllowedPercentage'));
      }

      const minAmount = discountForm.minAmount !== '' ? Number(discountForm.minAmount) : null;
      const maxAmount = discountForm.maxAmount !== '' ? Number(discountForm.maxAmount) : null;
      if (minAmount != null && maxAmount != null && minAmount > maxAmount) {
        throw new Error(t('admin.toasts.minGreaterThanMax'));
      }

      const payload = {
        code: discountForm.code.trim().toUpperCase(),
        feePolicyCode: discountForm.feePolicyCode.trim().toUpperCase(),
        discountType: discountForm.discountType,
        fixedAmount: hasFixed ? Number(discountForm.fixedAmount) : undefined,
        percentage: hasPercent ? Number(discountForm.percentage) : undefined,
        minAmount: minAmount ?? undefined,
        maxAmount: maxAmount ?? undefined,
        maxRedemptionsTotal: discountForm.maxRedemptionsTotal !== '' ? Number(discountForm.maxRedemptionsTotal) : undefined,
        maxRedemptionsPerUser: discountForm.maxRedemptionsPerUser !== '' ? Number(discountForm.maxRedemptionsPerUser) : undefined,
        eligibleRole: discountForm.eligibleRole || undefined,
        effectiveFrom: toIsoString(discountForm.effectiveFrom),
        effectiveTo: null,
        isActive: discountForm.isActive,
      };

      const res = await apiFetch('/admin/discount-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.createDiscountPolicyFailed'));

      toast.success(body?.message || t('admin.toasts.discountPolicyCreated'));
      setDiscountForm({
        code: '',
        feePolicyCode: '',
        discountType: 'PERCENTAGE',
        fixedAmount: '',
        percentage: '',
        minAmount: '',
        maxAmount: '',
        maxRedemptionsTotal: '',
        maxRedemptionsPerUser: '',
        eligibleRole: '',
        effectiveFrom: '',
        isActive: true,
      });
      await loadDiscountPolicies();
    } catch (e) {
      toast.error(e.message || t('admin.toasts.createDiscountPolicyFailed'));
    } finally {
      setDiscountBusy(false);
    }
  };

  const handleToggleDiscountPolicy = async (policy) => {
    setDiscountBusy(true);
    try {
      const action = policy.isActive ? 'deactivate' : 'activate';
      const res = await apiFetch(`/admin/discount-policies/${policy.id}/${action}`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.policyUpdateFailed'));
      toast.success(body?.message || (action === 'activate' ? t('admin.toasts.policyActivated') : t('admin.toasts.policyDeactivated')));
      await loadDiscountPolicies();
    } catch (e) {
      toast.error(e.message || t('admin.toasts.policyUpdateFailed'));
    } finally {
      setDiscountBusy(false);
    }
  };

  const handleEditDiscountPolicy = async (policy) => {
    const fixedRaw = prompt(t('admin.prompts.updateFixedAmount'), String(policy.fixedAmount ?? ''));
    if (fixedRaw === null) return;
    const percentageRaw = prompt(t('admin.prompts.updatePercentage'), String(policy.percentage ?? ''));
    if (percentageRaw === null) return;
    const minRaw = prompt(t('admin.prompts.updateMinAmount'), String(policy.minAmount ?? ''));
    if (minRaw === null) return;
    const maxRaw = prompt(t('admin.prompts.updateMaxAmount'), String(policy.maxAmount ?? ''));
    if (maxRaw === null) return;
    const totalCapRaw = prompt(t('admin.prompts.updateTotalCap'), String(policy.maxRedemptionsTotal ?? ''));
    if (totalCapRaw === null) return;
    const perUserCapRaw = prompt(t('admin.prompts.updatePerUserCap'), String(policy.maxRedemptionsPerUser ?? ''));
    if (perUserCapRaw === null) return;
    const roleRaw = prompt(t('admin.prompts.updateEligibleRole'), String(policy.eligibleRole ?? ''));
    if (roleRaw === null) return;

    const toNumberOrNull = (value) => {
      if (value.trim() === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : NaN;
    };

    const fixedAmount = toNumberOrNull(fixedRaw);
    const percentage = toNumberOrNull(percentageRaw);
    const minAmount = toNumberOrNull(minRaw);
    const maxAmount = toNumberOrNull(maxRaw);
    const maxRedemptionsTotal = toNumberOrNull(totalCapRaw);
    const maxRedemptionsPerUser = toNumberOrNull(perUserCapRaw);

    if ([fixedAmount, percentage, minAmount, maxAmount, maxRedemptionsTotal, maxRedemptionsPerUser].some((v) => Number.isNaN(v))) {
      toast.error(t('admin.toasts.numericInputsInvalid'));
      return;
    }

    if (policy.discountType === 'FIXED' && fixedAmount == null) {
      toast.error(t('admin.toasts.fixedAmountRequired'));
      return;
    }

    if (policy.discountType === 'PERCENTAGE' && percentage == null) {
      toast.error(t('admin.toasts.percentageRequired'));
      return;
    }

    if (typeof minAmount === 'number' && typeof maxAmount === 'number' && minAmount > maxAmount) {
      toast.error(t('admin.toasts.minGreaterThanMax'));
      return;
    }

    const normalizedRole = roleRaw.trim().toUpperCase();
    const eligibleRole = normalizedRole ? normalizedRole : null;

    setDiscountBusy(true);
    try {
      const patchPayload = {
        fixedAmount,
        percentage,
        minAmount,
        maxAmount,
        maxRedemptionsTotal,
        maxRedemptionsPerUser,
        eligibleRole,
      };
      const res = await apiFetch(`/admin/discount-policies/${policy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.updateDiscountPolicyFailed'));
      toast.success(body?.message || t('admin.toasts.discountPolicyUpdated'));
      await loadDiscountPolicies();
    } catch (e) {
      toast.error(e.message || t('admin.toasts.updateDiscountPolicyFailed'));
    } finally {
      setDiscountBusy(false);
    }
  };

  const handleToggleFeePolicy = async (policy) => {
    setFeeBusy(true);
    try {
      const action = policy.isActive ? 'deactivate' : 'activate';
      const res = await apiFetch(`/admin/fee-policies/${policy.id}/${action}`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.policyUpdateFailed'));
      toast.success(body?.message || (action === 'activate' ? t('admin.toasts.policyActivated') : t('admin.toasts.policyDeactivated')));
      await loadFeePolicies();
    } catch (e) {
      toast.error(e.message || t('admin.toasts.policyUpdateFailed'));
    } finally {
      setFeeBusy(false);
    }
  };

  const handleEditFeePolicy = async (policy) => {
    const name = prompt(t('admin.prompts.updateFeeName'), policy.name || '');
    if (name === null) return;

    const fixedRaw = prompt(t('admin.prompts.updateFixedAmount'), String(policy.fixedAmount ?? ''));
    if (fixedRaw === null) return;
    const percentageRaw = prompt(t('admin.prompts.updatePercentage'), String(policy.percentage ?? ''));
    if (percentageRaw === null) return;
    const baseFieldRaw = prompt(t('admin.prompts.updateBaseField'), String(policy.percentBaseField ?? ''));
    if (baseFieldRaw === null) return;
    const minRaw = prompt(t('admin.prompts.updateMinAmount'), String(policy.minAmount ?? ''));
    if (minRaw === null) return;
    const maxRaw = prompt(t('admin.prompts.updateMaxAmount'), String(policy.maxAmount ?? ''));
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
      toast.error(t('admin.toasts.numericInputsInvalid'));
      return;
    }
    if (typeof minAmount === 'number' && typeof maxAmount === 'number' && minAmount > maxAmount) {
      toast.error(t('admin.toasts.minGreaterThanMax'));
      return;
    }
    if (typeof percentage === 'number' && !baseFieldRaw.trim()) {
      toast.error(t('admin.toasts.baseFieldRequired'));
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
      if (!res.ok) throw new Error(body?.error || t('admin.toasts.updateFeePolicyFailed'));
      toast.success(body?.message || t('admin.toasts.feePolicyUpdated'));
      await loadFeePolicies();
    } catch (e) {
      toast.error(e.message || t('admin.toasts.updateFeePolicyFailed'));
    } finally {
      setFeeBusy(false);
    }
  };

  const sideMenuItems = useMemo(
    () => [
      {
        key: 'dashboard',
        label: t('admin.sidebar.dashboard'),
        icon: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9.5z',
      },
      {
        key: 'listings',
        label: t('admin.sidebar.properties'),
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        key: 'users',
        label: t('admin.sidebar.users'),
        icon: 'M17 20h5v-1a4 4 0 00-5.546-3.69M9 20H2v-1a4 4 0 015.546-3.69M16 6a4 4 0 11-8 0 4 4 0 018 0z',
      },
      {
        key: 'fees',
        label: t('admin.sidebar.payments'),
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        key: 'discounts',
        label: t('admin.sidebar.discounts'),
        icon: 'M12 3v3m6.364 1.636l-2.121 2.121M21 12h-3M17.657 17.657l-2.121-2.121M12 21v-3M8.464 16.536l-2.121 2.121M3 12h3M6.343 6.343l2.121 2.121',
      },
      {
        key: 'topup-approvals',
        label: t('admin.sidebar.topupApprovals'),
        to: '/admin-dashboard/topup-approvals',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        key: 'reports',
        label: t('admin.sidebar.reports'),
        icon: 'M9 17v-6a1 1 0 011-1h8m-6 6h6m-6-3h4M4 7h4M4 11h2M4 15h1M4 5h16',
      },
      {
        key: 'settings',
        label: t('admin.sidebar.settings'),
        icon: 'M10.325 4.317a1 1 0 011.35-.936l1.06.396a1 1 0 00.95-.106l.985-.574a1 1 0 011.366.366l.5.866a1 1 0 00.79.49l1.145.15a1 1 0 01.878 1.12l-.1 1.11a1 1 0 00.287.829l.79.79a1 1 0 010 1.414l-.79.79a1 1 0 00-.287.829l.1 1.11a1 1 0 01-.878 1.12l-1.146.15a1 1 0 00-.789.49l-.5.866a1 1 0 01-1.366.366l-.985-.574a1 1 0 00-.95-.106l-1.06.396a1 1 0 01-1.35-.936l-.086-1.148a1 1 0 00-.522-.795l-.94-.542a1 1 0 01-.366-1.366l.574-.985a1 1 0 00.106-.95l-.396-1.06a1 1 0 01.936-1.35l1.148-.086a1 1 0 00.795-.522l.542-.94z',
      },
      {
        key: 'account',
        label: t('admin.sidebar.account'),
        to: '/account',
        icon: 'M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z',
      },
    ],
    [t]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f3]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-700" />
          <p className="text-sm font-medium text-gray-600">{t('admin.loading')}</p>
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

        <AdminSidebar
          sideMenuItems={sideMenuItems}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          mobileDrawerOpen={mobileDrawerOpen}
          setMobileDrawerOpen={setMobileDrawerOpen}
          onLogout={logout}
        />

        <div className="min-w-0">
          <AdminHeader onToggleMenu={() => setMobileDrawerOpen((v) => !v)} />

          <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            {error ? (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                <span className="text-sm font-medium">{error}</span>
                <button type="button" onClick={() => setError('')} className="text-lg font-bold leading-none">
                  x
                </button>
              </div>
            ) : null}

            {activeSection === 'dashboard' ? (
              <AdminDashboardSection
                stats={stats}
                kycSubmissions={kycSubmissions}
                selectingListingId={selectingListingId}
                onSelectListing={handleSelectListing}
                onSectionChange={setActiveSection}
                onCloseMobile={() => setMobileDrawerOpen(false)}
                analyticsTab={analyticsTab}
                setAnalyticsTab={setAnalyticsTab}
              />
            ) : null}
            {activeSection === 'users' ? (
              <AdminUsersSection
                users={users}
                selectedUser={selectedUser}
                selectedUserDetails={selectedUserDetails}
                selectingUserId={selectingUserId}
                busy={busy}
                usersRefreshing={usersRefreshing}
                search={search}
                roleFilter={roleFilter}
                roleEdit={roleEdit}
                onboardingEdit={onboardingEdit}
                kycOverrideEdit={kycOverrideEdit}
                setSearch={setSearch}
                setRoleFilter={setRoleFilter}
                setRoleEdit={setRoleEdit}
                setOnboardingEdit={setOnboardingEdit}
                setKycOverrideEdit={setKycOverrideEdit}
                handleSelectUser={handleSelectUser}
                handleUserPatch={handleUserPatch}
                handleDeleteUser={handleDeleteUser}
                handleHardDeleteUser={handleHardDeleteUser}
                handleRestoreUser={handleRestoreUser}
              />
            ) : null}
            {activeSection === 'reports' ? (
              <AdminKycSection
                submissionStatusFilter={submissionStatusFilter}
                setSubmissionStatusFilter={setSubmissionStatusFilter}
                kycSubmissions={kycSubmissions}
                selectedSubmission={selectedSubmission}
                selectedSubmissionDetails={selectedSubmissionDetails}
                selectingSubmissionId={selectingSubmissionId}
                handleSelectSubmission={handleSelectSubmission}
                handleReviewSubmission={handleReviewSubmission}
                busy={busy}
              />
            ) : null}
            {activeSection === 'listings' ? (
              <AdminListingsSection
                listings={listings}
                listingsPagination={listingsPagination}
                listingsLoading={listingsLoading}
                listingsPage={listingsPage}
                setListingsPage={setListingsPage}
                listingStatusFilter={listingStatusFilter}
                setListingStatusFilter={setListingStatusFilter}
                selectedListingDetails={selectedListingDetails}
                selectingListingId={selectingListingId}
                handleSelectListing={handleSelectListing}
              />
            ) : null}
            {activeSection === 'fees' ? (
              <AdminFeePoliciesSection
                feeCodeFilter={feeCodeFilter}
                setFeeCodeFilter={setFeeCodeFilter}
                feeActiveFilter={feeActiveFilter}
                setFeeActiveFilter={setFeeActiveFilter}
                feeForm={feeForm}
                setFeeForm={setFeeForm}
                feeBusy={feeBusy}
                feeError={feeError}
                feeLoading={feeLoading}
                feePolicies={feePolicies}
                handleCreateFeePolicy={handleCreateFeePolicy}
                handleEditFeePolicy={handleEditFeePolicy}
                handleToggleFeePolicy={handleToggleFeePolicy}
              />
            ) : null}
            {activeSection === 'discounts' ? (
              <AdminDiscountPoliciesSection
                discountCodeFilter={discountCodeFilter}
                setDiscountCodeFilter={setDiscountCodeFilter}
                discountFeeCodeFilter={discountFeeCodeFilter}
                setDiscountFeeCodeFilter={setDiscountFeeCodeFilter}
                discountActiveFilter={discountActiveFilter}
                setDiscountActiveFilter={setDiscountActiveFilter}
                discountForm={discountForm}
                setDiscountForm={setDiscountForm}
                discountBusy={discountBusy}
                discountError={discountError}
                discountLoading={discountLoading}
                discountPolicies={discountPolicies}
                handleCreateDiscountPolicy={handleCreateDiscountPolicy}
                handleEditDiscountPolicy={handleEditDiscountPolicy}
                handleToggleDiscountPolicy={handleToggleDiscountPolicy}
              />
            ) : null}
            {activeSection === 'settings'
              ? (
                <AdminPlaceholderSection
                  title={t('admin.settings.title')}
                  description={t('admin.settings.description')}
                />
              )
              : null}
          </main>
        </div>
      </div>
    </div>
  );
}


