import { Link } from 'react-router-dom';
import { Icon } from './AdminUi';

export default function AdminSidebar({
  sideMenuItems,
  activeSection,
  setActiveSection,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  onLogout,
}) {
  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 flex h-screen w-[min(270px,88vw)] max-w-[270px] flex-col overflow-y-auto overscroll-contain border-l border-[#dceadf] bg-[#f7fbf8] transition-transform duration-200 ease-out lg:left-0 lg:right-auto lg:border-l-0 lg:border-r lg:translate-x-0 ${
        mobileDrawerOpen ? 'translate-x-0 shadow-[-4px_0_24px_rgba(30,71,50,0.08)]' : 'translate-x-full lg:shadow-none'
      }`}
    >
      <div className="border-b border-[#dceadf]/80 bg-white/90 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl p-1.5 -m-1.5 transition hover:bg-emerald-50/60"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <img
            src="/logo.jpg"
            alt="Rent Nao"
            className="h-10 w-10 shrink-0 rounded-xl border border-emerald-100/80 object-cover shadow-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight tracking-tight text-[#2f8444] sm:text-[1.05rem]">
              Rent Nao
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600/80">
              Admin
            </p>
          </div>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Menu</p>
        <nav className="space-y-1" aria-label="Admin sidebar">
          {sideMenuItems.map((item) => {
            const isActive = item.to
              ? typeof window !== 'undefined' && window.location.pathname.startsWith(item.to)
              : activeSection === item.key;
            const itemClass = `group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              isActive
                ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-emerald-200/60'
                : 'text-gray-700 hover:bg-white/90 hover:text-emerald-900'
            }`;
            const iconClass = `grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
              isActive
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-white/80 text-gray-500 ring-1 ring-gray-200/80 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-100'
            }`;

            if (item.to) {
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={itemClass}
                >
                  <span className={iconClass}>
                    <Icon className="h-4 w-4" path={item.icon} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveSection(item.key);
                  setMobileDrawerOpen(false);
                }}
                className={itemClass}
              >
                <span className={iconClass}>
                  <Icon className="h-4 w-4" path={item.icon} />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-[#dceadf] bg-white/40 px-3 py-4 sm:px-4">
        <button
          type="button"
          onClick={() => {
            setMobileDrawerOpen(false);
            onLogout();
          }}
          className="w-full rounded-xl border border-red-100 bg-red-50/90 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-200 hover:bg-red-100"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
