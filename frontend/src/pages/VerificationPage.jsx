import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch, getCurrentUser } from '../lib/api';
import { addLocalNotification } from '../lib/notifications';

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
          isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-200 bg-[#fbfefc]'
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
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-white p-6 text-center">
              <div className="mx-auto mb-3 h-11 w-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6h2v6h10v-6zm-7-2V3l-4 4h3v4h2V7h3l-4-4z" />
                </svg>
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-emerald-900">Drag &amp; drop or browse</p>
              <p className="mt-2 text-sm sm:text-base text-gray-600">Upload clear photo of required document</p>
              <p className="mt-1 text-sm text-gray-500">JPEG, PNG or PDF, Max size: 5MB</p>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onFileChange} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
}

export default function VerificationPage() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documents, setDocuments] = useState({ idCard: null, propertyCertificate: null });
  const [previews, setPreviews] = useState({ idCard: null, propertyCertificate: null });
  const [draggingDoc, setDraggingDoc] = useState('');

  useEffect(() => {
    setRole(searchParams.get('role') || 'TENANT');
  }, [searchParams]);

  const isTenant = role === 'TENANT';
  const isOwner = role === 'OWNER';

  const setFileForType = (file, documentType) => {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, WebP or PDF files are allowed');
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
    const docType = documentType === 'idCard' ? 'NATIONAL_ID' : 'PROOF_OF_OWNERSHIP';

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

      if (isOwner) {
        if (!documents.idCard || !documents.propertyCertificate) {
          setError('Please upload both ID and property ownership document');
          setLoading(false);
          return;
        }
      } else if (!documents.idCard) {
        setError('Please upload your ID card');
        setLoading(false);
        return;
      }

      const payload = [];
      if (documents.idCard) {
        const d = await handleUpload(user, 'idCard', documents.idCard);
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
    ? 'Upload your identity and ownership proof documents.'
    : 'Upload a valid ID document to get started.';

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      {/* Unified registration header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Rent Nao" className="h-10 w-10 rounded-md object-cover border border-emerald-100" />
            <span className="text-3xl font-extrabold text-emerald-800 tracking-tight">Rent Nao</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="text-gray-700 hover:text-emerald-700 transition">Home</Link>
            <Link to="/listings" className="text-gray-700 hover:text-emerald-700 transition">Find Property</Link>
            <Link to="/owner-dashboard/create-listing" className="text-gray-700 hover:text-emerald-700 transition">List Property</Link>
            <Link to="/services" className="text-gray-700 hover:text-emerald-700 transition">Services</Link>
          </nav>

          <div className="flex items-center gap-2">
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
        </div>
      </header>

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
              <p className="text-emerald-800 font-semibold text-sm mb-2 text-right">Step 2 of 2</p>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full w-[75%] bg-emerald-600 rounded-full" />
              </div>
              <div className="mt-2 flex justify-between">
                <StepPill number={1} label="Details" />
                <StepPill number={2} label="Preferences" />
                <StepPill number={3} label="Finish" active />
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
                      For proof of identity, upload a clear photo of your NID, passport, or driving license (front and back).
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <UploadCard
                    title="Identity Document"
                    description="Required for all users."
                    file={documents.idCard}
                    preview={previews.idCard}
                    isDragging={draggingDoc === 'idCard'}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggingDoc('idCard');
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
                      setFileForType(file, 'idCard');
                    }}
                    onFileChange={(e) => handleFileChange(e, 'idCard')}
                    onRemove={() => {
                      setDocuments((p) => ({ ...p, idCard: null }));
                      setPreviews((p) => ({ ...p, idCard: null }));
                    }}
                  />
                </div>

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

                <p className="mt-4 text-sm sm:text-base text-emerald-800 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
                  </svg>
                  Your documents are <span className="font-semibold">secure &amp; verified only once.</span>
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to={isTenant ? '/tenant-registration' : '/owner-registration'}
                    className="h-11 rounded-xl border border-emerald-200 bg-white text-emerald-700 font-semibold text-base flex items-center justify-center hover:bg-emerald-50 transition"
                  >
                    ← Back
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-xl bg-emerald-700 text-white font-semibold text-base hover:bg-emerald-800 transition disabled:opacity-50"
                  >
                    {loading ? 'Uploading...' : 'Finish →'}
                  </button>
                </div>

                <p className="mt-4 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                  </svg>
                  Your information is safe &amp; secure with us
                </p>
              </div>

              <div className="hidden lg:block rounded-xl overflow-hidden border border-emerald-100 bg-white">
                <VerificationIllustration />
              </div>
            </div>
          </form>
        </div>

        <div className="mt-5 rounded-xl border border-emerald-100 bg-white px-4 py-3 text-emerald-800 text-sm flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
          </svg>
          Your documents are secure &amp; verified only once.
        </div>
      </main>
    </div>
  );
}
