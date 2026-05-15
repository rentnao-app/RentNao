import { feeFormulaParts } from './adminDashboardUtils';

export default function AdminFeePoliciesSection({
  feeCodeFilter,
  setFeeCodeFilter,
  feeActiveFilter,
  setFeeActiveFilter,
  feeForm,
  setFeeForm,
  feeBusy,
  feeError,
  feeLoading,
  feePolicies,
  handleCreateFeePolicy,
  handleEditFeePolicy,
  handleToggleFeePolicy,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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

      <form onSubmit={handleCreateFeePolicy} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Create fee policy</h3>
            <p className="text-xs text-slate-500">Define the base cost, percentage component, and schedule in one place.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
            Required fields are labeled
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <label className="flex flex-col gap-2 xl:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Code</span>
            <input
              type="text"
              placeholder="LISTING_CREATE"
              value={feeForm.code}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, code: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Policy name</span>
            <input
              type="text"
              placeholder="Listing creation fee"
              value={feeForm.name}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, name: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Currency</span>
            <input
              type="text"
              placeholder="BDT"
              value={feeForm.currency}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, currency: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Effective from</span>
            <input
              type="datetime-local"
              value={feeForm.effectiveFrom}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Active state</span>
            <div className="flex h-[42px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={feeForm.isActive}
                onChange={(e) => setFeeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              <span>Active on create</span>
            </div>
          </label>

          <div className="xl:col-span-12">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
              <label className="flex flex-col gap-2 xl:col-span-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Fixed amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={feeForm.fixedAmount}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, fixedAmount: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Percent</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={feeForm.percentage}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, percentage: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Percent base field</span>
                <input
                  type="text"
                  placeholder="rent"
                  value={feeForm.percentBaseField}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, percentBaseField: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Minimum</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={feeForm.minAmount}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, minAmount: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Maximum</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={feeForm.maxAmount}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
          </div>

          <div className="flex items-end xl:col-span-12 xl:justify-end">
            <button
              type="submit"
              disabled={feeBusy}
              className="w-full rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50 md:w-auto"
            >
              Create fee policy
            </button>
          </div>
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
              {feePolicies.map((policy) => {
                const formulaParts = feeFormulaParts(policy);

                return (
                  <tr key={policy.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      <div>{policy.code}</div>
                      <div className="mt-1 text-xs font-normal text-slate-500">{policy.currency}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{policy.version}</td>
                    <td className="py-3 pr-4 text-slate-700">{policy.name}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      <div className="flex flex-wrap gap-2">
                        {formulaParts.length > 0 ? (
                          formulaParts.map((part) => (
                            <div
                              key={`${policy.id}-${part.label}`}
                              className={`rounded-2xl border px-3 py-2 ${part.tone}`}
                            >
                              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{part.label}</div>
                              <div className="text-xs font-medium leading-5">{part.value}</div>
                            </div>
                          ))
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">No formula</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          policy.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {policy.effectiveFrom ? new Date(policy.effectiveFrom).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={feeBusy}
                          onClick={() => handleEditFeePolicy(policy)}
                          className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={feeBusy}
                          onClick={() => handleToggleFeePolicy(policy)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                            policy.isActive ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {policy.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
