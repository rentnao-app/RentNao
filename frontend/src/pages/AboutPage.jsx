import { Link, useNavigate } from 'react-router-dom';
import BrandLogoLink from '../components/BrandLogoLink';
import { isLoggedIn } from '../lib/api';

export default function AboutPage() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogoLink />
          {loggedIn ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <nav className="flex gap-6">
              <Link to="/listings" className="text-sm text-gray-600 hover:text-teal-700">Listings</Link>
              <Link to="/login" className="text-sm text-gray-600 hover:text-teal-700">Log In</Link>
              <Link to="/signup" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Sign Up</Link>
            </nav>
          )}
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 mb-3">About us</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">About Rent Nao</h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Rent Nao is a digital platform built to transform the way people rent spaces in Bangladesh &mdash;
            whether it&apos;s a home, office, or commercial property.
          </p>
        </header>

        <section className="space-y-4 text-gray-600 leading-relaxed mb-12">
          <p>
            Finding a place to live or run a business has traditionally been time-consuming, uncertain, and inefficient.
            People often rely on physical searching, &ldquo;To-Let&rdquo; signs, or brokers, while property owners
            struggle with unreliable tenants, vacancy losses, and a lack of trust.
          </p>
          <p>
            Rent Nao solves these problems by creating a fast, trusted, and fully digital rental experience.
          </p>
        </section>

        <Section title="What We Do">
          <p>
            We connect property owners and tenants directly through a seamless online platform where everything can be
            managed in one place.
          </p>
          <BulletList
            items={[
              <>
                <strong className="font-semibold text-gray-800">Property owners</strong> can list their properties
                easily, find verified tenants, and manage listings without spending on promotions.
              </>,
              <>
                <strong className="font-semibold text-gray-800">Tenants</strong> can explore verified properties with
                complete details, including images, videos, 3D walkthroughs, and exact locations.
              </>,
            ]}
          />
          <p>
            Every user on Rent Nao goes through a verification process using valid identity documents to ensure safety,
            trust, and transparency across the platform.
          </p>
        </Section>

        <Section title="A Smarter Rental Experience">
          <p>Rent Nao is designed to reduce friction at every step of the rental journey:</p>
          <BulletList
            items={[
              'Instant connection between tenants and owners',
              'Direct in-platform communication',
              'Real-time availability and transparency',
              'Public ratings and reviews to maintain quality',
            ]}
          />
          <p>We aim to minimize unnecessary hassle and make renting faster, simpler, and more reliable.</p>
        </Section>

        <Section title="Fintech-Enabled Ecosystem">
          <p>
            Rent Nao goes beyond property discovery. We are building a fintech-powered rental ecosystem where:
          </p>
          <BulletList
            items={[
              'Tenants can pay rent automatically through a secure wallet',
              'Owners receive payments without delays or follow-ups',
              'Users can easily cash in and cash out funds',
              'Every transaction is recorded, transparent, and secure',
            ]}
          />
          <p>This transforms renting into a smooth, trackable, and efficient financial experience.</p>
        </Section>

        <Section title="Our Vision">
          <p>
            Our vision is to become the default digital infrastructure for renting spaces across Bangladesh &mdash; from
            residential homes to commercial properties.
          </p>
          <p>
            We are not just a rental service. We are building a complete rental ecosystem that combines technology,
            trust, and financial solutions to redefine how people access and manage space.
          </p>
        </Section>

        <section className="my-12 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 mb-2">Our mission</p>
          <p className="text-lg sm:text-xl font-semibold text-gray-900 leading-snug">
            To eliminate the struggle, uncertainty, and inefficiency of renting by making it fast, trusted, and
            completely digital.
          </p>
        </section>

        <Section title="Why Rent Nao?">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {[
              'Verified users only',
              'No unnecessary middlemen',
              'Fast and simple process',
              'Transparent and secure system',
              'Built for both tenants and property owners',
            ].map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-gray-800">{reason}</span>
              </li>
            ))}
          </ul>
        </Section>

        <p className="mt-10 text-center text-lg font-semibold text-gray-900">
          Rent Nao is where renting becomes simple, trusted, and digital.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/listings"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition"
          >
            Browse Listings
          </Link>
          <Link
            to="/services"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-emerald-200 bg-white text-emerald-800 font-semibold hover:bg-emerald-50 transition"
          >
            See our services
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="mt-1 space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}


