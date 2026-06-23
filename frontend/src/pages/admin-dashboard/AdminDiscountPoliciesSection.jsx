import { useTranslation } from '../../lib/i18n';
import { ROLE_OPTIONS, formatBdt, formatFeePercent, toLabel } from './adminDashboardUtils';

export default function AdminDiscountPoliciesSection({
  discountCodeFilter,
  setDiscountCodeFilter,
  discountFeeCodeFilter,
  setDiscountFeeCodeFilter,
  discountActiveFilter,
  setDiscountActiveFilter,
  discountForm,
  setDiscountForm,
  discountBusy,
  discountError,
  discountLoading,
  discountPolicies,
  handleCreateDiscountPolicy,
  handleEditDiscountPolicy,
  handleToggleDiscountPolicy,
}) {
  const { t } = useTranslation();

  const typeLabel = (value) => (value === 'PERCENTAGE' ? t('admin.discounts.percentLabel') : t('admin.discounts.fixedLabel'));

  const renderDiscountValue = (policy) => {
    if (policy.discountType === 'PERCENTAGE') {
      return t('admin.discounts.percentOfBase', { pct: formatFeePercent(policy.percentage, t) });
    }
    return formatBdt(policy.fixedAmount, t);
  };

  const renderBounds = (policy) => {
    const min = policy.minAmount != null ? formatBdt(policy.minAmount, t) : t('admin.discounts.noMin');
    const max = policy.maxAmount != null ? formatBdt(policy.maxAmount, t) : t('admin.discounts.noMax');
    return t('admin.discounts.boundsRange', { min, max });
  };

  const renderCaps = (policy) => {
    const total = policy.maxRedemptionsTotal != null ? policy.maxRedemptionsTotal : t('admin.discounts.noCap');
    const perUser = policy.maxRedemptionsPerUser != null ? policy.maxRedemptionsPerUser : t('admin.discounts.noCap');
    return t('admin.discounts.capsSummary', { total, perUser });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('admin.discounts.title')}</h2>
          <p className="text-sm text-slate-500">{t('admin.discounts.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={discountCodeFilter}
            onChange={(e) => setDiscountCodeFilter(e.target.value)}
            placeholder={t('admin.discounts.filterByDiscountCode')}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="text"
            value={discountFeeCodeFilter}
            onChange={(e) => setDiscountFeeCodeFilter(e.target.value)}
            placeholder={t('admin.discounts.filterByFeeCode')}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={discountActiveFilter}
            onChange={(e) => setDiscountActiveFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">{t('admin.discounts.all')}</option>
            <option value="active">{t('admin.discounts.active')}</option>
            <option value="inactive">{t('admin.discounts.inactive')}</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleCreateDiscountPolicy} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t('admin.discounts.createTitle')}</h3>
            <p className="text-xs text-slate-500">{t('admin.discounts.createSubtitle')}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
            {t('admin.discounts.requiredHint')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <label className="flex flex-col gap-2 xl:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.discountCode')}</span>
            <input
              type="text"
              placeholder="WELCOME10"
              value={discountForm.code}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, code: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.feePolicyCode')}</span>
            <input
              type="text"
              placeholder="LISTING_CREATE"
              value={discountForm.feePolicyCode}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, feePolicyCode: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.type')}</span>
            <select
              value={discountForm.discountType}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, discountType: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="PERCENTAGE">{t('admin.discounts.percentage')}</option>
              <option value="FIXED">{t('admin.discounts.fixed')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.effectiveFrom')}</span>
            <input
              type="datetime-local"
              value={discountForm.effectiveFrom}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.activeState')}</span>
            <div className="flex h-[42px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={discountForm.isActive}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              <span>{t('admin.discounts.activeOnCreate')}</span>
            </div>
          </label>

          <div className="xl:col-span-12">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.fixedAmount')}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountForm.fixedAmount}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, fixedAmount: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.percent')}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountForm.percentage}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, percentage: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.minimum')}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountForm.minAmount}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, minAmount: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.maximum')}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discountForm.maxAmount}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.totalCap')}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={discountForm.maxRedemptionsTotal}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, maxRedemptionsTotal: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.perUserCap')}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={discountForm.maxRedemptionsPerUser}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, maxRedemptionsPerUser: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('admin.discounts.eligibleRole')}</span>
                <select
                  value={discountForm.eligibleRole}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, eligibleRole: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">{t('admin.discounts.allRoles')}</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {toLabel(role, t)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex items-end xl:col-span-12 xl:justify-end">
            <button
              type="submit"
              disabled={discountBusy}
              className="w-full rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50 md:w-auto"
            >
              {t('admin.discounts.createButton')}
            </button>
          </div>
        </div>
      </form>

      {discountError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {discountError}
        </div>
      ) : null}

      {discountLoading ? (
        <p className="text-sm text-slate-500">{t('admin.discounts.loading')}</p>
      ) : discountPolicies.length === 0 ? (
        <p className="text-sm text-slate-500">{t('admin.discounts.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 pr-4">{t('admin.discounts.tableCode')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableFeeCode')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableType')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableValue')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableBounds')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableCaps')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableRole')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableStatus')}</th>
                <th className="py-2 pr-4">{t('admin.discounts.tableEffectiveFrom')}</th>
                <th className="py-2">{t('admin.discounts.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {discountPolicies.map((policy) => (
                <tr key={policy.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 font-semibold text-slate-900">{policy.code}</td>
                  <td className="py-3 pr-4 text-slate-700">{policy.feePolicyCode}</td>
                  <td className="py-3 pr-4 text-slate-700">{typeLabel(policy.discountType)}</td>
                  <td className="py-3 pr-4 text-slate-700">{renderDiscountValue(policy)}</td>
                  <td className="py-3 pr-4 text-slate-700">{renderBounds(policy)}</td>
                  <td className="py-3 pr-4 text-slate-700">{renderCaps(policy)}</td>
                  <td className="py-3 pr-4 text-slate-700">{policy.eligibleRole ? toLabel(policy.eligibleRole, t) : t('admin.discounts.roleAll')}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        policy.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {policy.isActive ? t('admin.discounts.active') : t('admin.discounts.inactive')}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {policy.effectiveFrom ? new Date(policy.effectiveFrom).toLocaleString() : t('admin.labels.na')}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={discountBusy}
                        onClick={() => handleEditDiscountPolicy(policy)}
                        className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                      >
                        {t('admin.discounts.edit')}
                      </button>
                      <button
                        type="button"
                        disabled={discountBusy}
                        onClick={() => handleToggleDiscountPolicy(policy)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                          policy.isActive ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {policy.isActive ? t('admin.discounts.deactivate') : t('admin.discounts.activate')}
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
}
