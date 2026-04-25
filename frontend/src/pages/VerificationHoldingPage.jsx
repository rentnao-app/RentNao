import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, clearAuthSession, getCurrentUser } from '../lib/api';

function normalizeStatus(status) {
  return String(status || 'PENDING').toUpperCase();
}

function getStatusMeta(status) {
  const key = normalizeStatus(status);
  const map = {
    PENDING: {
      label: 'Pending',
      chip: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-400',
    },
    DRAFT: {
      label: 'Draft',
      chip: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    SUBMITTED: {
      label: 'Submitted',
      chip: 'bg-sky-50 text-sky-800 border-sky-200',
      dot: 'bg-sky-500',
    },
    UNDER_REVIEW: {
      label: 'Under review',
      chip: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-400',
    },
    APPROVED: {
      label: 'Verified',
      chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    ACCEPTED: {
      label: 'Verified',
      chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Rejected',
      chip: 'bg-red-50 text-red-800 border-red-200',
      dot: 'bg-red-500',
    },
  };
  return map[key] || map.PENDING;
}

/** @returns {'verified' | 'rejected' | 'processing' | 'idle'} */
function getSubmissionPhase(submissionStatus, hasSubmission) {
  if (!hasSubmission) return 'idle';
  const key = normalizeStatus(submissionStatus);
  if (key === 'APPROVED' || key === 'ACCEPTED') return 'verified';
  if (key === 'REJECTED') return 'rejected';
  return 'processing';
}

function dashboardPathForRole(role) {
  if (role === 'OWNER') return '/owner-dashboard';
  if (role === 'TENANT') return '/tenant-dashboard';
  if (role === 'ADMIN') return '/admin-dashboard';
  return '/';
}

function DocumentTypeLabel(type) {
  const value = String(type || '').toUpperCase();
  if (value === 'NATIONAL_ID') return 'NID / Passport / Driving License';
  if (value === 'PROOF_OF_OWNERSHIP') return 'Property Ownership Certificate';
  return 'Document';
}

function StatusChip({ status }) {
  const meta = getStatusMeta(status);
  const key = normalizeStatus(status);
  const pulse = key === 'PENDING' || key === 'UNDER_REVIEW' || key === 'SUBMITTED' || key === 'DRAFT';
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${meta.chip}`}>
      <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot} ${pulse ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  );
}

export default function VerificationHoldingPage() {
  const [documents, setDocuments] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewedAt, setReviewedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = useMemo(() => getCurrentUser(), []);
  const dashboardHref = dashboardPathForRole(user?.role);

  const fetchDocuments = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.userId) {
        window.location.href = '/login';
        return;
      }

      const res = await apiFetch(`/users/${currentUser.userId}/verification/submission-status`);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const submission = data?.data?.currentSubmission || null;
        setDocuments(submission?.documents || []);
        setSubmissionStatus(submission?.status || '');
        setRejectionReason(submission?.rejectionReason || '');
        setReviewedAt(submission?.reviewedAt || '');
      } else {
        setError('Could not fetch your documents');
      }
    } catch {
      setError('An error occurred while fetching verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    window.location.href = '/login';
  };

  const hasSubmission = Boolean(submissionStatus || documents.length > 0);
  const phase = getSubmissionPhase(submissionStatus, hasSubmission);
  const currentSubmissionMeta = getStatusMeta(submissionStatus || 'PENDING');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full border-2 border-emerald-200 border-t-emerald-700 animate-spin" aria-hidden />
          <p className="text-sm text-gray-600">Checking your verification status...</p>
        </div>
      </div>
    );
  }

  const heroByPhase = {
    verified: {
      wrap: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50/90 shadow-md shadow-emerald-900/5',
      title: "You're verified",
      subtitle:
        'Your identity documents were approved. You can use the full dashboard and features your role allows.',
      icon: (
        <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-4 ring-emerald-100">
          <svg className="h-8 w-8 sm:h-9 sm:w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
    },
    processing: {
      wrap: 'border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/50 shadow-sm',
      title: 'Verification in process',
      subtitle:
        'Our team is reviewing your submission. This page updates automatically; you can refresh anytime.',
      icon: (
        <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-4 ring-amber-50">
          <svg className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
          </svg>
        </div>
      ),
    },
    rejected: {
      wrap: 'border-red-200/90 bg-gradient-to-br from-red-50/80 via-white to-white shadow-sm',
      title: 'Verification not approved',
      subtitle:
        'Please read the note below and submit updated documents. We are here to help you complete verification.',
      icon: (
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700 ring-4 ring-red-50">
          <svg className="h-7 w-7 sm:h-8 sm:w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
      ),
    },
    idle: {
      wrap: 'border-emerald-100 bg-gradient-to-r from-white via-white to-emerald-50/80 shadow-sm',
      title: 'Complete verification',
      subtitle: 'Upload your documents to start the review process. We will notify you when verification is complete.',
      icon: (
        <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50">
          <svg className="h-7 w-7 sm:h-8 sm:w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
          </svg>
        </div>
      ),
    },
  };

  const hero = heroByPhase[phase];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <header className="bg-white border-b border-emerald-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.jpg" alt="Rent Nao" className="h-9 w-9 sm:h-10 sm:w-10 rounded-md object-cover border border-emerald-100 shrink-0" />
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-800 tracking-tight truncate">Rent Nao</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:text-red-700 transition px-1 shrink-0"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <section className={`rounded-2xl border p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8 ${hero.wrap}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 min-w-0">
              {hero.icon}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-[1.75rem] xl:text-4xl font-bold text-gray-900 tracking-tight">{hero.title}</h1>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">{hero.subtitle}</p>
                {phase === 'verified' && reviewedAt && (
                  <p className="mt-2 text-xs sm:text-sm text-emerald-800/90 font-medium">
                    Approved on {new Date(reviewedAt).toLocaleString()}
                  </p>
                )}
                {phase === 'rejected' && rejectionReason && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-white/80 px-3 py-3 sm:px-4 text-sm text-red-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">Reason</p>
                    <p className="leading-relaxed">{rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap lg:flex-col lg:items-stretch xl:flex-row xl:items-center shrink-0 w-full lg:w-auto lg:min-w-[200px]">
              {hasSubmission && (
                <div className="rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm px-4 py-3 shadow-sm">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Submission status</p>
                  <StatusChip status={submissionStatus || 'PENDING'} />
                </div>
              )}
              {phase === 'verified' && (
                <Link
                  to={dashboardHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-800 transition text-center w-full sm:w-auto"
                >
                  Go to dashboard
                  <span aria-hidden>-></span>
                </Link>
              )}
              {phase === 'idle' && (
                <Link
                  to="/verification"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition w-full sm:w-auto text-center"
                >
                  Upload documents
                </Link>
              )}
              {phase === 'rejected' && (
                <Link
                  to="/verification"
                  className="inline-flex items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 transition w-full sm:w-auto text-center"
                >
                  Update &amp; resubmit
                </Link>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 sm:mt-5 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm" role="alert">
              {error}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(260px,22rem)] gap-6 lg:gap-8">
          <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-5 sm:p-6 order-2 xl:order-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Submitted documents</h2>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition self-start sm:self-auto"
              >
                Refresh
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 text-center">
                <p className="text-gray-600 mb-4 text-sm sm:text-base">You haven&apos;t uploaded any documents for this submission yet.</p>
                <Link
                  to="/verification"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3 text-sm sm:text-base transition w-full max-w-xs mx-auto"
                >
                  Upload documents
                </Link>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Document list">
                {documents.map((doc) => {
                  const docId = doc.document_id || doc.documentId;
                  const status = doc.verification_status || doc.verificationStatus || 'PENDING';
                  const uploadedAt = doc.uploaded_at || doc.uploadedAt;

                  return (
                    <li
                      key={docId}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 hover:bg-emerald-50/50 transition p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                          {DocumentTypeLabel(doc.document_type || doc.documentType)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded {uploadedAt ? new Date(uploadedAt).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        <StatusChip status={status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[44px] rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Refresh status
              </button>
              <Link
                to="/verification"
                className="min-h-[44px] rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition flex items-center justify-center text-center"
              >
                Re-upload
              </Link>
            </div>
          </section>

          <aside className="rounded-2xl border border-emerald-100 bg-white shadow-sm p-5 sm:p-6 order-1 xl:order-2">
            <div
              className={`rounded-xl border p-4 sm:p-5 mb-5 ${
                phase === 'verified'
                  ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60'
                  : phase === 'rejected'
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-emerald-100 bg-emerald-50/60'
              }`}
            >
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-600 font-semibold">Overview</p>
              <p className="text-sm text-gray-800 mt-2 leading-relaxed">
                {phase === 'verified' && (
                  <>
                    Status: <span className="font-bold text-emerald-800">Verified</span>
                    <span className="block mt-1 text-xs text-gray-600">Your KYC submission was approved. You can explore the app from your dashboard.</span>
                  </>
                )}
                {phase === 'processing' && (
                  <>
                    Status: <span className="font-bold text-amber-900">{currentSubmissionMeta.label}</span>
                    <span className="block mt-1 text-xs text-gray-600">Verification is in process. Typical review time is 24-48 hours.</span>
                  </>
                )}
                {phase === 'rejected' && (
                  <>
                    Status: <span className="font-bold text-red-800">Not approved</span>
                    <span className="block mt-1 text-xs text-gray-600">Update your documents and submit again from the verification page.</span>
                  </>
                )}
                {phase === 'idle' && (
                  <>
                    Status: <span className="font-bold text-gray-800">No submission yet</span>
                    <span className="block mt-1 text-xs text-gray-600">Start by uploading the required documents.</span>
                  </>
                )}
              </p>
            </div>

            {phase === 'verified' ? (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-3">What you can do now</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Access your full dashboard and account features for your role.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Listings, applications, and payments work according to your verification level.
                  </li>
                </ul>
              </>
            ) : phase === 'rejected' ? (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Next steps</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    Review the rejection reason above (if provided).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    Prepare clearer scans or the correct document types.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    Use <strong className="font-semibold text-gray-800">Re-upload</strong> on this page or go to the verification form.
                  </li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-3">What happens next?</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    The admin team reviews your submitted documents.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    Verification usually takes 24 to 48 hours.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    You will be notified when the decision is made.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    After approval, this page will show <strong className="font-semibold text-gray-800">Verified</strong>.
                  </li>
                </ul>
              </>
            )}

            <div className="mt-6 rounded-xl border border-emerald-100 bg-gray-50/80 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-emerald-900">
                <svg className="w-5 h-5 shrink-0 sm:mt-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                </svg>
                <p className="text-xs sm:text-sm font-medium leading-relaxed">Your documents are encrypted and handled securely.</p>
              </div>
            </div>
          </aside>
        </div>

        <div
          className={`mt-6 sm:mt-8 rounded-xl border px-4 py-3.5 text-sm flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left ${
            phase === 'verified'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-emerald-100 bg-white text-emerald-800'
          }`}
        >
          {phase === 'verified' ? (
            <>
              <svg className="w-5 h-5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">Verified - thank you for completing identity verification.</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0 text-emerald-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
              </svg>
              <span>Your documents are secure and reviewed in order of submission.</span>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


