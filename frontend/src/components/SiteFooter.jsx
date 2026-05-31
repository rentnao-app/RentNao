import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="bg-teal-900 text-teal-200 py-6">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-4 md:gap-5">
        <div className="text-xs sm:text-sm leading-relaxed">
          <p className="font-semibold text-teal-100">Contact:</p>
          <p className="mt-1">
            <svg className="mr-2 inline-block h-3.5 w-3.5 text-white align-middle" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6.62 10.79a15.54 15.54 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.11.37 2.3.56 3.58.56a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.28.19 2.47.56 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
            </svg>
            <span className="align-middle">+8801766886915</span>
          </p>
          <p className="mt-1">
            <svg className="mr-2 inline-block h-3.5 w-3.5 text-white align-middle" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2zm0 2l8 5 8-5H4z" />
            </svg>
            <span className="align-middle">Email: samiuz2001@gmail.com</span>
          </p>
          <p className="mt-1">
            <svg className="mr-2 inline-block h-4 w-4 text-white align-middle" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
            </svg>
            <span className="align-middle">Address: 41/9, A, Chan Mia Housing, Mohammadpur, Dhaka - 1207</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <p className="text-xs sm:text-sm">&copy; Copyright 2026 Rent Nao Limited. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-xs sm:text-sm">
            <Link to="/about" className="hover:text-white transition">
              About
            </Link>
            <Link to="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link to="/faq" className="hover:text-white transition">
              FAQ
            </Link>
            <Link to="/services" className="hover:text-white transition">
              Services
            </Link>
            <Link to="/review" className="hover:text-white transition">
              Reviews
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
