import toast from 'react-hot-toast';
import { Icon } from './AdminUi';
import {
  KYC_OVERRIDE_OPTIONS,
  ONBOARDING_OPTIONS,
  ROLE_OPTIONS,
  formatDate,
  getUserContact,
  getUserEmail,
  roleTone,
  toLabel,
} from './adminDashboardUtils';

export default function AdminUsersSection({
  users,
  selectedUser,
  selectedUserDetails,
  selectingUserId,
  busy,
  search,
  roleFilter,
  roleEdit,
  onboardingEdit,
  kycOverrideEdit,
  setSearch,
  setRoleFilter,
  setRoleEdit,
  setOnboardingEdit,
  setKycOverrideEdit,
  handleSelectUser,
  handleUserPatch,
  handleDeleteUser,
  handleHardDeleteUser,
  handleRestoreUser,
}) {
  return (
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
                onClick={() => handleHardDeleteUser(selectedUser)}
                className="rounded-xl bg-rose-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Hard Delete User
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
}
