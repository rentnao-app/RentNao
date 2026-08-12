import { Link } from 'react-router-dom';
import { aosFadeUp, aosStagger } from '../lib/aos';
import { useFooterAos } from '../hooks/useHomeAos';
import { useTranslation } from '../lib/i18n';

const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61591516107861',
  linkedin: 'https://www.linkedin.com/company/rent-nao-limited/',
  instagram: 'https://www.instagram.com/rentnaolimited?igsh=N2Nqb3k3ZGc3cnVn',
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
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#2A7D4F]">{title}</h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#cfe0d6] bg-white/70 text-[#5f6f68] transition hover:border-[#2A7D4F] hover:bg-white hover:text-[#1a4728] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A7D4F]"
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

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-8.001 3.999 3.999 0 010 8.001zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z" />
    </svg>
  );
}

export default function SiteFooter() {
  const { t } = useTranslation();
  useFooterAos();

  return (
    <footer className="border-t border-[#b8d4c8] bg-gradient-to-b from-[#e4efe8] via-[#d4e8de] to-[#c0d9ce] text-[#1a1f1c]">
      <div className="mx-auto max-w-home px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))] lg:gap-x-10 lg:gap-y-10">
          <div className="sm:col-span-2 lg:col-span-1" {...aosFadeUp(0)}>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A7D4F]"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dfece4] bg-white shadow-sm">
                <img
                  src="/tab-image.png"
                  alt=""
                  className="h-7 w-7 object-contain"
                  draggable={false}
                />
              </span>
              <span className="text-xl font-bold tracking-tight text-[#1a4728]">RentNao</span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#5f6f68]">{t('footer.description')}</p>

            <div className="mt-6 flex items-center gap-3">
              <SocialIconButton href={SOCIAL_LINKS.facebook} label={t('footer.socialFacebook')}>
                <FacebookIcon />
              </SocialIconButton>
              <SocialIconButton href={SOCIAL_LINKS.linkedin} label={t('footer.socialLinkedIn')}>
                <LinkedInIcon />
              </SocialIconButton>
              <SocialIconButton href={SOCIAL_LINKS.instagram} label={t('footer.socialInstagram')}>
                <InstagramIcon />
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
              <FooterLink to="/contact">{t('footer.contact')}</FooterLink>
            </FooterNavItem>
          </FooterNavColumn>

          <FooterNavColumn title={t('footer.legal')} aosDelay={aosStagger(3, 70)}>
            <FooterNavItem>
              <FooterLink to="/terms">{t('footer.termsOfService')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/privacy">{t('footer.privacyPolicy')}</FooterLink>
            </FooterNavItem>
            <FooterNavItem>
              <FooterLink to="/cookies">{t('footer.cookiePolicy')}</FooterLink>
            </FooterNavItem>
          </FooterNavColumn>
        </div>

        <div
          className="mt-12 flex flex-col gap-2 border-t border-[#aec9bc] pt-7 text-xs text-[#5f6f68] sm:flex-row sm:items-center sm:justify-between sm:text-sm"
          {...aosFadeUp(120)}
        >
          <p>{t('footer.copyright')}</p>
          <p className="text-[#5f6f68]">{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
