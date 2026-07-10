import { Link } from 'react-router-dom';
import { aosFadeUp, aosStagger } from '../lib/aos';
import { useFooterAos } from '../hooks/useHomeAos';
import { useTranslation } from '../lib/i18n';

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61591516107861',
  linkedin: 'https://www.linkedin.com/company/rent-nao-limited/',
};

function FooterLink({ to, href, children, external = false }) {
  const className =
    'inline-block text-sm text-[#5f6f68] transition hover:text-[#1a4728] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A7D4F]';

  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

function FooterNavColumn({ title, children, aosDelay = 0 }) {
  return (
    <div {...aosFadeUp(aosDelay)}>
      <h3 className="text-sm font-semibold text-[#1a1f1c]">{title}</h3>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function FooterNavItem({ children }) {
  return <li>{children}</li>;
}

function SocialIconButton({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#cfdad4] text-[#5f6f68] transition hover:border-[#2A7D4F] hover:text-[#1a4728] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A7D4F]"
    >
      {children}
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 9.5V7.75c0-.69.56-1.25 1.25-1.25H16V4h-2.01c-2.07 0-3.49 1.27-3.49 3.61v1.89H9v2.75h1.5V20h3v-7.75h2.54l.46-2.75H13.5z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.5 8.75h3v10.5h-3V8.75zM8 4a1.75 1.75 0 110 3.5A1.75 1.75 0 018 4zm4.25 4.75h2.88v1.43h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v5.64h-3v-5c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.91 1.29-1.91 2.62v5.1h-3V8.75z" />
    </svg>
  );
}

export default function SiteFooter() {
  const { t } = useTranslation();
  useFooterAos();

  return (
    <footer className="border-t border-[#e8eeeb] bg-[#f7faf8] text-[#1a1f1c]">
      <div className="mx-auto max-w-home px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:gap-x-12 lg:gap-y-10">
          <div className="sm:col-span-2 lg:col-span-1" {...aosFadeUp(0)}>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A7D4F]"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dfece4] bg-white shadow-sm">
                <img
                  src="/tab-image.png"
                  alt=""
                  className="h-7 w-7 object-contain"
                  draggable={false}
                />
              </span>
              <span className="text-lg font-bold tracking-tight text-[#1a1f1c]">RentNao</span>
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
