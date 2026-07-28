import { Link } from 'react-router-dom';
import { aosFadeUp, aosStagger } from '../lib/aos';
import { useFooterAos } from '../hooks/useHomeAos';
import { useTranslation } from '../lib/i18n';

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-emerald-400 hover:text-emerald-950 hover:ring-emerald-300/60"
    >
      {children}
    </a>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link to={link.to} className="text-sm text-emerald-50/85 transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const { t } = useTranslation();
  useFooterAos();

  const productLinks = [
    { to: '/listings', label: t('footer.browseProperties') },
    { to: '/owner-dashboard/create-listing', label: t('footer.listProperty') },
    { to: '/verification', label: t('footer.verification') },
    { to: '/wallet', label: t('footer.wallet') },
  ];

  const companyLinks = [
    { to: '/about', label: t('footer.aboutUs') },
    { to: '/about', label: t('footer.careers') },
    { to: '/review', label: t('footer.reviews') },
    { to: '/about', label: t('footer.contact') },
  ];

  const resourceLinks = [
    { to: '/faq', label: t('footer.blog') },
    { to: '/faq', label: t('footer.faq') },
    { to: '/faq', label: t('footer.helpCenter') },
    { to: '/services', label: t('footer.services') },
  ];

  const legalLinks = [
    { to: '/terms', label: t('footer.privacyPolicy') },
    { to: '/terms', label: t('footer.termsOfUse') },
    { to: '/terms', label: t('footer.cookiePolicy') },
  ];

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#0f2e22] via-[#1a4d38] to-[#2f8444] text-emerald-50">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(110, 231, 183, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(52, 211, 153, 0.25), transparent 40%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-400" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              <img src="/icon.png" alt="" className="h-10 w-auto max-w-[11rem] brightness-0 invert" draggable={false} />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-100/90">{t('footer.tagline')}</p>

            <div className="mt-6 space-y-2.5 text-sm text-emerald-50/90">
              <p className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6.62 10.79a15.54 15.54 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.11.37 2.3.56 3.58.56a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.28.19 2.47.56 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
                </svg>
                <span>+8801766886915</span>
              </p>
              <p className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2zm0 2l8 5 8-5H4z" />
                </svg>
                <span>hello@rentnao.com</span>
              </p>
              <p className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
                </svg>
                <span>{t('footer.addressValue')}</span>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <SocialIcon href="https://facebook.com" label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://twitter.com" label="Twitter">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://instagram.com" label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <FooterColumn title={t('footer.product')} links={productLinks} />
          <FooterColumn title={t('footer.company')} links={companyLinks} />
          <div className="space-y-8">
            <FooterColumn title={t('footer.resources')} links={resourceLinks} />
            <FooterColumn title={t('footer.legal')} links={legalLinks} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-emerald-100/80 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <p>{t('footer.copyright')}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/terms" className="transition hover:text-white">
              {t('footer.privacyShort')}
            </Link>
            <Link to="/terms" className="transition hover:text-white">
              {t('footer.termsShort')}
            </Link>
            <Link to="/terms" className="transition hover:text-white">
              {t('footer.cookiesShort')}
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#5f6f68]">{t('footer.description')}</p>

            <div className="mt-5 flex items-center gap-3.5">
              <SocialIconButton href={SOCIAL_LINKS.facebook} label={t('footer.socialFacebook')}>
                <FacebookIcon />
              </SocialIconButton>
              <SocialIconButton href={SOCIAL_LINKS.linkedin} label={t('footer.socialLinkedIn')}>
                <LinkedInIcon />
              </SocialIconButton>
            </div>
          </div>

          <FooterNavColumn title={t('footer.platform')} aosDelay={aosStagger(1, 70)}>
            <FooterNavItem>
              <FooterLink to="/listings">{t('footer.browseListings')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/services">{t('footer.services')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/faq">{t('footer.faq')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/review">{t('footer.reviews')}</FooterLink>
            </FooterNavItem>
          </FooterNavColumn>

          <FooterNavColumn title={t('footer.company')} aosDelay={aosStagger(2, 70)}>
            <FooterNavItem>
              <FooterLink to="/about">{t('footer.about')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/careers">{t('footer.careers')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/blogs">{t('footer.blogs')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink href="mailto:samiuz2001@gmail.com">{t('footer.contact')}</FooterLink>
            </FooterNavItem>
          </FooterNavColumn>

          <FooterNavColumn title={t('footer.legal')} aosDelay={aosStagger(3, 70)}>
            <FooterNavItem>
              <FooterLink to="/terms">{t('footer.termsOfService')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/terms">{t('footer.privacyPolicy')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/terms">{t('footer.cookiePolicy')}</FooterLink>
            </FooterNavItem>
          </FooterNavColumn>
        </div>

        <div
          className="mt-12 flex flex-col gap-3 border-t border-[#e3ebe6] pt-8 text-sm text-[#6b7f74] sm:flex-row sm:items-center sm:justify-between"
          {...aosFadeUp(120)}
        >
          <p>{t('footer.copyright')}</p>
          <p>{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
