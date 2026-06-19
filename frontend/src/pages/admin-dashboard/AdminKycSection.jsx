import { useTranslation } from '../../lib/i18n';
import { formatDate, statusTone, toLabel } from './adminDashboardUtils';

export default function AdminKycSection({
  submissionStatusFilter,
  setSubmissionStatusFilter,
  kycSubmissions,
  selectedSubmission,
  selectedSubmissionDetails,
  selectingSubmissionId,
  handleSelectSubmission,
  handleReviewSubmission,
  busy,
}) {
  const { t } = useTranslation();

  const statusOptions = [
    { value: 'SUBMITTED', label: t('admin.kyc.submitted') },
    { value: 'UNDER_REVIEW', label: t('admin.kyc.underReview') },
    { value: 'APPROVED', label: t('admin.kyc.approved') },
    { value: 'REJECTED', label: t('admin.kyc.rejected') },
  ];

  return (
    <section className="mt-0 grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.kyc.submissionStatus')}
          </label>
          <select
            value={submissionStatusFilter}
            onChange={(e) => setSubmissionStatusFilter(e.target.value)}
            className="w-full max-w-md rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 md:w-auto"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-4">
        <h3 className="mb-3 text-lg font-bold text-slate-900">{t('admin.kyc.title')}</h3>
        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {kycSubmissions.length === 0 ? (
            <p className="rounded-xl bg-slate-50 py-8 text-center text-sm text-slate-500">{t('admin.kyc.empty')}</p>
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
                      {toLabel(submission.status, t)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{toLabel(submission.userRole, t)}</p>
                <p className="text-xs text-slate-500">{formatDate(submission.submittedAt, t)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
        {selectedSubmissionDetails ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">{t('admin.kyc.reviewTitle')}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(selectedSubmissionDetails.status)}`}>
                {toLabel(selectedSubmissionDetails.status, t)}
              </span>
            </div>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                <span className="font-semibold">{t('admin.kyc.name')}</span>{' '}
                {selectedSubmissionDetails.displayName || selectedSubmissionDetails.userEmail}
              </p>
              <p>
                <span className="font-semibold">{t('admin.kyc.email')}</span>{' '}
                {selectedSubmissionDetails.userEmail || t('admin.labels.na')}
              </p>
              <p>
                <span className="font-semibold">{t('admin.kyc.phone')}</span>{' '}
                {selectedSubmissionDetails.userPhone || t('admin.labels.na')}
              </p>
              <p>
                <span className="font-semibold">{t('admin.kyc.role')}</span> {toLabel(selectedSubmissionDetails.userRole, t)}
              </p>
            </div>

            <div className="space-y-3">
              {(selectedSubmissionDetails.documents || []).map((doc) => (
                <div key={doc.documentId} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{toLabel(doc.documentType, t)}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(doc.verificationStatus)}`}>
                      {toLabel(doc.verificationStatus, t)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {doc.fileName || t('admin.kyc.unnamedFile')}
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
                        {t('admin.kyc.openDocument')}
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
                {t('admin.kyc.approve')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleReviewSubmission('REJECTED')}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {t('admin.kyc.reject')}
              </button>
            </div>
          </>
        ) : (
          <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-base font-medium text-slate-600">{t('admin.kyc.selectPrompt')}</p>
          </div>
        )}
      </section>
    </section>
  );
}
