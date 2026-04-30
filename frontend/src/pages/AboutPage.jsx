import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f4f8f5]">
      <header className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-[#2f8444] tracking-tight">
            Rent Nao
          </Link>
          <nav className="flex gap-4 sm:gap-6">
            <Link to="/listings" className="text-sm text-gray-600 hover:text-[#2f8444] transition">Listings</Link>
            <Link to="/services" className="text-sm text-gray-600 hover:text-[#2f8444] transition">Services</Link>
            <Link to="/signup" className="text-sm font-semibold text-[#2f8444] hover:text-[#256c38] transition">Sign Up</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-[#2f8444] via-[#2a7a3f] to-[#1f5f31] text-white px-5 py-7 sm:px-8 sm:py-10 shadow-[0_24px_50px_rgba(31,95,49,0.24)]">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                About Rent Nao
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Renting spaces in Bangladesh, made digital, trusted, and fast.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-emerald-50/90 max-w-2xl leading-relaxed">
                Rent Nao is a digital platform built to transform the way people rent spaces in Bangladesh - whether
                it is a home, office, or commercial property.
              </p>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <svg className="h-40 w-40 text-white/90" viewBox="0 0 120 120" fill="none" aria-hidden>
                <path d="M18 58L60 26L102 58V98C102 101.314 99.3137 104 96 104H74V74H46V104H24C20.6863 104 18 101.314 18 98V58Z" fill="currentColor" fillOpacity="0.95" />
                <path d="M10 60L60 18L110 60" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="86" cy="52" r="8" fill="#C7EBD0" fillOpacity="0.9" />
              </svg>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            Finding a place to live or run a business has traditionally been time-consuming, uncertain, and inefficient.
            People often rely on physical searching, To-let signs, or brokers, while property owners struggle with
            unreliable tenants, vacancy losses, and lack of trust.
          </p>
          <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">
            Rent Nao solves these problems by creating a fast, trusted, and fully digital rental experience.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2f8444]">What We Do</h2>
          <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
            We connect property owners and tenants directly through a seamless online platform where everything can be
            managed in one place.
          </p>
          <ul className="mt-4 space-y-3 text-sm sm:text-base text-gray-700">
            <li>- Property owners can list their properties easily, find verified tenants, and manage listings without spending on promotions.</li>
            <li>- Tenants can explore verified properties with complete details including images, videos, 3D walkthroughs, and exact locations.</li>
          </ul>
          <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">
            Every user on Rent Nao goes through a verification process using real-time valid documents to ensure safety,
            trust, and transparency across the platform.
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">A Smarter Rental Experience</h3>
            <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
              Rent Nao is designed to reduce friction at every step of the rental journey:
            </p>
            <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-700">
              <li>- Instant connection between tenants and owners</li>
              <li>- Direct in-platform communication</li>
              <li>- Real-time availability and transparency</li>
              <li>- Public ratings and reviews to maintain quality</li>
            </ul>
            <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">
              We aim to minimize unnecessary hassle and make renting faster, simpler, and more reliable.
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">Fintech-Enabled Ecosystem</h3>
            <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
              Rent Nao goes beyond just property discovery. We are building a fintech-powered rental ecosystem where:
            </p>
            <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-700">
              <li>- Tenants can pay rent automatically through a secure wallet</li>
              <li>- Owners receive payments without delays or follow-ups</li>
              <li>- Users can easily cash in and cash out funds</li>
              <li>- Transactions are recorded, transparent, and secure</li>
            </ul>
            <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">
              This transforms renting into a smooth, trackable, and efficient financial experience.
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2f8444]">Our Vision</h2>
          <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
            Our vision is to become the default digital infrastructure for renting spaces across Bangladesh - from residential homes
            to commercial properties.
          </p>
          <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
            We are not just a rental service. We are building a complete rental ecosystem that combines technology, trust,
            and financial solutions to redefine how people access and manage space.
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">Our Mission</h3>
            <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
              To eliminate the struggle, uncertainty, and inefficiency of renting by making it fast, trusted, and completely digital.
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#2f8444]">Why Rent Nao?</h3>
            <ul className="mt-3 space-y-2 text-sm sm:text-base text-gray-700">
              <li>- Verified users only</li>
              <li>- No unnecessary middlemen</li>
              <li>- Fast and simple process</li>
              <li>- Transparent and secure system</li>
              <li>- Built for both tenants and property owners</li>
            </ul>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7 text-center">
          <p className="text-base sm:text-lg font-semibold text-[#1f5f31]">
            Rent Nao is where renting becomes simple, trusted, and digital.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center justify-center rounded-xl bg-[#2f8444] px-5 py-3 text-sm font-semibold text-white hover:bg-[#256c38] transition w-full sm:w-auto"
            >
              Browse Listings
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-[#2f8444] bg-white px-5 py-3 text-sm font-semibold text-[#2f8444] hover:bg-emerald-50 transition w-full sm:w-auto"
            >
              Create Account
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}


