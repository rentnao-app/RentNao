import NotificationBell from '../../components/NotificationBell';
import BrandLogoLink from '../../components/BrandLogoLink';
import { Icon } from './AdminUi';

export default function AdminHeader({ onToggleMenu }) {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
      <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">
          <BrandLogoLink className="min-w-0 shrink-0" />

          <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-2 md:gap-3.5">
            <NotificationBell />
            <div
              className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-xs font-semibold text-white shadow-sm sm:h-9 sm:w-9 sm:text-sm"
              title="Admin"
            >
              A
            </div>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 lg:hidden"
              aria-label="Open menu"
              onClick={onToggleMenu}
            >
              <Icon className="h-4 w-4" path="M4 7h16M4 12h16M4 17h16" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
