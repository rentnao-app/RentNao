import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch, getCurrentUser } from '../lib/api';
import { addLocalNotification } from '../lib/notifications';
import { getAcceptValue, isAllowedFileByMimeAndExtension, KYC_UPLOAD_MIMES } from '../lib/fileValidation';

function VerificationIllustration() {
  return (
    <svg viewBox="0 0 280 260" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eef9f2" />
          <stop offset="100%" stopColor="#dff4e6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="280" height="260" rx="18" fill="url(#vbg)" />
      <ellipse cx="140" cy="225" rx="110" ry="18" fill="#b7e5c4" opacity="0.6" />

      <rect x="120" y="90" width="95" height="120" rx="10" fill="#ffffff" stroke="#5bb27a" strokeWidth="4" />
      <rect x="133" y="104" width="28" height="28" rx="6" fill="#d8efe1" />
      <circle cx="147" cy="117" r="8" fill="#3fa36a" />
      <rect x="168" y="108" width="36" height="6" rx="3" fill="#b6d9c2" />
      <rect x="168" y="118" width="32" height="6" rx="3" fill="#c9e4d2" />
      <rect x="133" y="140" width="70" height="6" rx="3" fill="#c9e4d2" />
      <rect x="133" y="151" width="62" height="6" rx="3" fill="#d9ebdf" />

      <path d="M220 168l28 10v18c0 18-13 31-28 36-15-5-28-18-28-36v-18l28-10z" fill="#2f9d62" />
      <path d="M208 198l8 8 17-17" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      <ellipse cx="88" cy="185" rx="22" ry="8" fill="#f0c768" />
      <ellipse cx="75" cy="198" rx="18" ry="7" fill="#f3d27f" />
      <ellipse cx="100" cy="202" rx="18" ry="7" fill="#e7bb58" />
    </svg>
  );
}

function StepPill({ number, label, active }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-5 w-5 rounded-full text-[10px] font-semibold flex items-center justify-center ${
          active ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {number}
      </span>
      <span className={`text-xs ${active ? 'text-emerald-700 font-semibold' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

function getDashboardPath(role) {
  if (role === 'OWNER') return '/owner-dashboard';
  if (role === 'ADMIN') return '/admin-dashboard';
  return '/tenant-dashboard';
}

function UploadCard({
  title,
  description,
  file,
  preview,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
  onRemove,
}) {
  const isImagePreview = preview?.startsWith('data:image');

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4">
      <h3 className="text-lg sm:text-xl font-semibold text-emerald-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{description}</p>

      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`mt-4 rounded-xl border-2 border-dashed p-4 sm:p-5 transition ${
          isDragging ? 'border-gray-400 bg-gray-100' : 'border-gray-300 bg-gray-50/70'
        }`}
      >
        {file ? (
          <div className="text-center">
            {isImagePreview ? (
              <img src={preview} alt={title} className="max-h-52 mx-auto rounded-lg border border-emerald-100 mb-3" />
            ) : (
              <div className="mx-auto mb-3 w-full max-w-sm rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-left">
                <p className="text-sm font-semibold text-emerald-800">PDF selected</p>
                <p className="text-xs text-gray-600 mt-1 break-all">{file.name}</p>
              </div>
            )}
            <p className="text-sm text-gray-700">{file.name}</p>
            <button type="button" onClick={onRemove} className="mt-2 text-sm font-medium text-red-600 hover:text-red-700">
              Remove file
            </button>
          </div>
        ) : (
          <label className="block cursor-pointer">
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-center">
              <div className="mx-auto mb-3 h-11 w-11 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6h2v6h10v-6zm-7-2V3l-4 4h3v4h2V7h3l-4-4z" />
                </svg>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-emerald-900">Drag &amp; drop or browse</p>
              <p className="mt-2 text-sm sm:text-base text-gray-600">Upload clear photo of required document</p>
              <p className="mt-1 text-sm text-gray-500">JPEG, PNG or PDF, Max size: 5MB</p>
            </div>
            <input type="file" accept={getAcceptValue(KYC_UPLOAD_MIMES)} onChange={onFileChange} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}

export default function VerificationPage() {
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documents, setDocuments] = useState({ nidFront: null, nidBack: null, propertyCertificate: null });
  const [previews, setPreviews] = useState({ nidFront: null, nidBack: null, propertyCertificate: null });
  const [showNidBackUpload, setShowNidBackUpload] = useState(false);
  const [draggingDoc, setDraggingDoc] = useState('');

  useEffect(() => {
    setRole(searchParams.get('role') || 'TENANT');
  }, [searchParams]);

  const isTenant = role === 'TENANT';
  const isOwner = role === 'OWNER';

  const setFileForType = (file, documentType) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }

    if (!isAllowedFileByMimeAndExtension(file, KYC_UPLOAD_MIMES)) {
      setError('Only JPG, JPEG, PNG, or PDF files are allowed, and the file extension must match the file type');
      return;
    }

    if (file.type === 'application/pdf') {
      setPreviews((prev) => ({ ...prev, [documentType]: 'data:application/pdf;base64,' }));
      setDocuments((prev) => ({ ...prev, [documentType]: file }));
      setError('');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviews((prev) => ({ ...prev, [documentType]: reader.result }));
    reader.readAsDataURL(file);

    setDocuments((prev) => ({ ...prev, [documentType]: file }));
    setError('');
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files?.[0];
    setFileForType(file, documentType);
  };

  const handleUpload = async (user, documentType, file) => {
    if (!file) return null;
    const docType = documentType === 'propertyCertificate' ? 'PROOF_OF_OWNERSHIP' : 'NATIONAL_ID';

    const uploadRes = await apiFetch(`/users/${user.userId}/verification/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentType: docType,
        fileName: file.name,
        mimeType: file.type,
      }),
    });

    const uploadBody = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(uploadBody.error || 'Failed to get upload URL');

    const { uploadUrl, fileKey } = uploadBody?.data || {};
    if (!uploadUrl || !fileKey) throw new Error('Invalid upload URL response');

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!putRes.ok) throw new Error(`Failed to upload ${file.name}`);

    return {
      documentType: docType,
      filePath: fileKey,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = getCurrentUser();
      if (!user?.userId) throw new Error('Please login first');

      if (!documents.nidFront) {
        setError('Please upload the front side of your NID');
        setLoading(false);
        return;
      }

      if (isOwner && !documents.propertyCertificate) {
        setError('Please upload your property ownership document');
        setLoading(false);
        return;
      }

      const payload = [];
      if (documents.nidFront) {
        const d = await handleUpload(user, 'nidFront', documents.nidFront);
        if (d) payload.push(d);
      }
      if (documents.nidBack) {
        const d = await handleUpload(user, 'nidBack', documents.nidBack);
        if (d) payload.push(d);
      }
      if (isOwner && documents.propertyCertificate) {
        const d = await handleUpload(user, 'propertyCertificate', documents.propertyCertificate);
        if (d) payload.push(d);
      }

      const submitRes = await apiFetch(`/users/${user.userId}/verification/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: payload }),
      });

      const submitBody = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) throw new Error(submitBody.error || 'Failed to submit verification');

      addLocalNotification({
        title: 'Verification Submitted',
        message: 'Your KYC documents were submitted for admin review.',
        url: '/verification-holding',
        type: 'KYC',
      });
      setSuccess('Documents uploaded successfully!');
      setTimeout(() => {
        window.location.href = '/verification-holding';
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  const headerSubtitle = isOwner
    ? 'Upload your NID and proof of ownership. A second NID image is optional if the back side is separate.'
    : 'Upload your NID. Add a second image only if the back side is separate.';

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      {/* Unified registration header */}
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Rent Nao" className="h-10 w-10 rounded-md object-cover border border-emerald-100" />
            <span className="text-xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight leading-none">Rent Nao</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="text-gray-700 hover:text-emerald-700 transition">Home</Link>
            <Link to="/listings" className="text-gray-700 hover:text-emerald-700 transition">Find Property</Link>
            <Link to="/owner-dashboard/create-listing" className="text-gray-700 hover:text-emerald-700 transition">List Property</Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-700 transition">Services</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 transition"
            >
              Sign Up
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 transition"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="verification-mobile-nav"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-[#1e4732]/45 backdrop-blur-[3px] motion-reduce:backdrop-blur-none animate-mobile-nav-backdrop motion-reduce:animate-none motion-reduce:opacity-100"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="verification-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-mobile-nav-title"
            className="relative z-[110] flex h-full w-[min(20rem,88vw)] max-w-sm flex-col bg-white shadow-[-12px_0_40px_rgba(30,71,50,0.12)] border-l border-[#dceadf] animate-mobile-nav-drawer motion-reduce:animate-none motion-reduce:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#eef4ef]">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-lg object-cover border border-green-100 shrink-0" />
                <p id="verification-mobile-nav-title" className="font-semibold text-[#1e4732] text-sm tracking-tight truncate">
                  Rent Nao
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition shrink-0"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-1" aria-label="Mobile">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[#2f8444] bg-[#eef7ef]"
              >
                Home
              </Link>
              <Link
                to="/listings"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                Find Property
              </Link>
              <Link
                to="/owner-dashboard/create-listing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                List Property
              </Link>
              <Link
                to="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                Services
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-gray-800 hover:bg-gray-50 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 mx-1 rounded-xl bg-[#2f8444] hover:bg-[#256c38] text-white text-center text-[15px] font-semibold py-3.5 shadow-sm transition"
              >
                Sign Up
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">
                {isOwner ? 'Verify Owner Identity' : 'Verify Your Identity'}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">{headerSubtitle}</p>
            </div>

            <div className="w-full md:w-56">
              <p className="text-emerald-800 font-semibold text-sm mb-2 text-right">Document upload</p>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full bg-emerald-600 ${documents.nidBack ? 'w-full' : documents.nidFront ? 'w-2/3' : 'w-1/3'}`} />
              </div>
              <div className="mt-2 flex justify-between">
                <StepPill number={1} label="Front" active={!documents.nidFront} />
                <StepPill number={2} label="Back" active={Boolean(documents.nidFront) && !documents.nidBack} />
                <StepPill number={3} label="Submit" active={Boolean(documents.nidFront) && Boolean(documents.nidBack)} />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-5 items-stretch">
              <div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-emerald-700">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-emerald-900">
                      Upload NID / Passport / Driving License
                    </h2>
                    <p className="mt-1 text-sm sm:text-base text-gray-600 leading-relaxed">
                      For proof of identity, upload a clear NID photo. If the back side is separate, add a second upload. A single photocopy showing both sides is also acceptable.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <UploadCard
                    title="NID front side"
                    description="Required for all users. If both sides are on one page, upload that here."
                    file={documents.nidFront}
                    preview={previews.nidFront}
                    isDragging={draggingDoc === 'nidFront'}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggingDoc('nidFront');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDraggingDoc('');
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingDoc('');
                      const file = e.dataTransfer.files?.[0];
                      setFileForType(file, 'nidFront');
                    }}
                    onFileChange={(e) => handleFileChange(e, 'nidFront')}
                    onRemove={() => {
                      setDocuments((p) => ({ ...p, nidFront: null }));
                      setPreviews((p) => ({ ...p, nidFront: null }));
                    }}
                  />
                </div>

                {showNidBackUpload || documents.nidBack ? (
                  <div className="mt-4">
                    <UploadCard
                      title="NID backside (optional)"
                      description="Use this only if the back side is in a separate image."
                      file={documents.nidBack}
                      preview={previews.nidBack}
                      isDragging={draggingDoc === 'nidBack'}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDraggingDoc('nidBack');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDraggingDoc('');
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDraggingDoc('');
                        const file = e.dataTransfer.files?.[0];
                        setFileForType(file, 'nidBack');
                      }}
                      onFileChange={(e) => handleFileChange(e, 'nidBack')}
                      onRemove={() => {
                        setDocuments((p) => ({ ...p, nidBack: null }));
                        setPreviews((p) => ({ ...p, nidBack: null }));
                      }}
                    />
                  </div>
                ) : null}

                {documents.nidFront && !showNidBackUpload && !documents.nidBack ? (
                  <button
                    type="button"
                    onClick={() => setShowNidBackUpload(true)}
                    className="mt-4 inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    Add backside upload
                  </button>
                ) : null}

                {isOwner && (
                  <div className="mt-4">
                    <UploadCard
                      title="Property Ownership Document"
                      description="Upload property certificate, deed, or tax document."
                      file={documents.propertyCertificate}
                      preview={previews.propertyCertificate}
                      isDragging={draggingDoc === 'propertyCertificate'}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDraggingDoc('propertyCertificate');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDraggingDoc('');
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDraggingDoc('');
                        const file = e.dataTransfer.files?.[0];
                        setFileForType(file, 'propertyCertificate');
                      }}
                      onFileChange={(e) => handleFileChange(e, 'propertyCertificate')}
                      onRemove={() => {
                        setDocuments((p) => ({ ...p, propertyCertificate: null }));
                        setPreviews((p) => ({ ...p, propertyCertificate: null }));
                      }}
                    />
                  </div>
                )}

                <p className="mt-4 text-sm sm:text-base text-emerald-800 flex items-start sm:items-center gap-2 leading-relaxed">
                  <svg className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
                  </svg>
                  <span>
                    Your documents are <span className="font-semibold">secure &amp; verified only once.</span>
                  </span>
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to={isTenant ? '/tenant-registration' : '/owner-registration'}
                    className="h-11 rounded-xl border border-emerald-200 bg-white text-emerald-700 font-semibold text-base flex items-center justify-center hover:bg-emerald-50 transition"
                  >
                    Back
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-xl bg-emerald-700 text-white font-semibold text-base hover:bg-emerald-800 transition disabled:opacity-50"
                  >
                    {loading ? 'Uploading...' : 'Finish'}
                  </button>
                </div>

              </div>

              <div className="block rounded-2xl sm:rounded-3xl lg:rounded-xl overflow-hidden border border-emerald-100 bg-white max-w-[360px] sm:max-w-[420px] lg:max-w-none mx-auto lg:mx-0">
                <VerificationIllustration />
              </div>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}

