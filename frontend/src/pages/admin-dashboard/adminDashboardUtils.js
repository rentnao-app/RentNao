export const ONBOARDING_OPTIONS = ['AUTH_PENDING', 'PROFILE_PENDING', 'UNDER_REVIEW', 'COMPLETED'];
export const ROLE_OPTIONS = ['TENANT', 'OWNER', 'ADMIN'];
export const KYC_OVERRIDE_OPTIONS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export const LISTING_STATUS_FILTERS = [
  { value: '', labelKey: 'admin.filters.listingStatus.all' },
  { value: 'DRAFT', labelKey: 'admin.filters.listingStatus.DRAFT' },
  { value: 'PENDING_PAYMENT', labelKey: 'admin.filters.listingStatus.PENDING_PAYMENT' },
  { value: 'ACTIVE', labelKey: 'admin.filters.listingStatus.ACTIVE' },
  { value: 'RENTED', labelKey: 'admin.filters.listingStatus.RENTED' },
  { value: 'UNLISTED', labelKey: 'admin.filters.listingStatus.UNLISTED' },
  { value: 'EXPIRED', labelKey: 'admin.filters.listingStatus.EXPIRED' },
];

export const normalizeUser = (u) => ({
  user_id: u?.user_id || u?.userId,
  role: u?.role,
  onboarding_status: u?.onboarding_status || u?.onboardingStatus,
  email: u?.email || u?.contact_email || u?.contactEmail || null,
  contact_email: u?.contact_email || u?.contactEmail,
  contact_phone: u?.contact_phone || u?.contactPhone,
  is_active: typeof u?.is_active === 'boolean' ? u.is_active : u?.isActive,
  created_at: u?.created_at || u?.createdAt,
});

export const toLabel = (value, t) => {
  if (value == null || value === '') return t ? t('admin.labels.na') : 'N/A';
  if (t) {
    const translated = t(`admin.labels.enum.${value}`);
    if (translated !== `admin.labels.enum.${value}`) return translated;
  }
  return String(value)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatDate = (value, t) => {
  if (!value) return t ? t('admin.labels.na') : 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t ? t('admin.labels.na') : 'N/A';
  return date.toLocaleDateString();
};

export const formatBdt = (n, t) => {
  if (n == null || Number.isNaN(Number(n))) return t ? t('admin.labels.na') : 'N/A';
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

export const formatFeePercent = (value, t) => {
  if (value == null || value === '') return t ? t('admin.labels.na') : 'N/A';
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return t ? t('admin.labels.na') : 'N/A';
  const trimmed = Number(numberValue.toFixed(2));
  return `${trimmed}%`;
};

export const feeFormulaParts = (policy, t) => {
  const parts = [];
  const labelFixed = t ? t('admin.fees.formulaFixed') : 'Fixed';
  const labelPercent = t ? t('admin.fees.formulaPercent') : 'Percent';
  const labelBounds = t ? t('admin.fees.formulaBounds') : 'Bounds';
  const noMin = t ? t('admin.fees.noMin') : 'No min';
  const noMax = t ? t('admin.fees.noMax') : 'No max';

  if (policy.fixedAmount != null && policy.fixedAmount !== '') {
    parts.push({
      label: labelFixed,
      value: formatBdt(policy.fixedAmount, t),
      tone: 'bg-sky-50 text-sky-700 border-sky-100',
    });
  }

  if (policy.percentage != null && policy.percentage !== '') {
    const base = policy.percentBaseField || 'base';
    parts.push({
      label: labelPercent,
      value: t
        ? t('admin.fees.formulaPercentOf', { pct: formatFeePercent(policy.percentage, t), base })
        : `${formatFeePercent(policy.percentage, t)} of ${base}`,
      tone: 'bg-violet-50 text-violet-700 border-violet-100',
    });
  }

  const hasBounds =
    (policy.minAmount != null && policy.minAmount !== '') ||
    (policy.maxAmount != null && policy.maxAmount !== '');
  if (hasBounds) {
    const min =
      policy.minAmount != null && policy.minAmount !== '' ? formatBdt(policy.minAmount, t) : noMin;
    const max =
      policy.maxAmount != null && policy.maxAmount !== '' ? formatBdt(policy.maxAmount, t) : noMax;
    parts.push({
      label: labelBounds,
      value: t ? t('admin.fees.boundsRange', { min, max }) : `${min} to ${max}`,
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    });
  }

  return parts;
};

export const parseFeePolicies = (body) => body?.data?.feePolicies || body?.data?.items || body?.feePolicies || [];

export const getUserEmail = (user, details, t) => {
  const fallback = t ? t('admin.labels.notProvided') : 'Not provided';
  return (
    user?.contact_email ||
    user?.email ||
    (details?.credentials || []).find((cred) => cred.identifierType === 'EMAIL')?.identifier ||
    fallback
  );
};

export const getUserContact = (user, details, t) => {
  const fallback = t ? t('admin.labels.notProvided') : 'Not provided';
  return (
    user?.contact_phone ||
    (details?.credentials || []).find((cred) => cred.identifierType === 'PHONE')?.identifier ||
    fallback
  );
};

export const roleTone = (role) => {
  if (role === 'ADMIN') return 'bg-violet-100 text-violet-800';
  if (role === 'OWNER') return 'bg-cyan-100 text-cyan-800';
  return 'bg-emerald-100 text-emerald-800';
};

export const statusTone = (status) => {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'REJECTED') return 'bg-rose-100 text-rose-700';
  if (status === 'UNDER_REVIEW') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

export const listingStatusTone = (status) => {
  if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-800';
  if (status === 'RENTED') return 'bg-cyan-100 text-cyan-800';
  if (status === 'PENDING_PAYMENT') return 'bg-amber-100 text-amber-800';
  if (status === 'DRAFT') return 'bg-slate-100 text-slate-700';
  if (status === 'EXPIRED') return 'bg-rose-100 text-rose-800';
  if (status === 'UNLISTED') return 'bg-gray-100 text-gray-700';
  return 'bg-slate-100 text-slate-700';
};

export const formatRelativeTime = (iso, t) => {
  if (!iso) return '';
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const diff = Date.now() - time;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t ? t('admin.labels.justNow') : 'Just now';
  if (m < 60) return t ? t('admin.labels.minAgo', { count: m }) : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) {
    return t
      ? t(h === 1 ? 'admin.labels.hourAgo' : 'admin.labels.hoursAgo', { count: h })
      : `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  const d = Math.floor(h / 24);
  return t
    ? t(d === 1 ? 'admin.labels.dayAgo' : 'admin.labels.daysAgo', { count: d })
    : `${d} day${d === 1 ? '' : 's'} ago`;
};

export const pctChange = (current, prev) => {
  const c = Number(current) || 0;
  const p = Number(prev) || 0;
  if (p <= 0) return c > 0 ? 100 : 0;
  return Math.round(((c - p) / p) * 1000) / 10;
};

export const listingFeedBadge = (status, t) => {
  if (status === 'ACTIVE') {
    return {
      label: t ? t('admin.labels.feedBadge.verified') : 'Verified',
      className: 'bg-emerald-100 text-emerald-800',
    };
  }
  if (status === 'PENDING_PAYMENT' || status === 'DRAFT') {
    return {
      label: t ? t('admin.labels.feedBadge.underReview') : 'Under review',
      className: 'bg-sky-100 text-sky-800',
    };
  }
  return { label: toLabel(status, t), className: listingStatusTone(status) };
};

export const toIsoString = (value) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};
