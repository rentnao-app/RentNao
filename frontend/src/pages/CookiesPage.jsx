import StaticPageShell, {
  LegalRelatedLinks,
  LegalSectionList,
  StaticPageHero,
} from '../components/StaticPageShell';
import { useTranslation } from '../lib/i18n';

export default function CookiesPage() {
  const { messages } = useTranslation();
  const copy = messages.cookies;

  return (
    <StaticPageShell
      backLabel={copy.back}
      navLinks={[
        { to: '/privacy', label: copy.nav.privacy },
        { to: '/terms', label: copy.nav.terms },
        { to: '/contact', label: copy.nav.contact },
      ]}
    >
      <StaticPageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.intro}
        lastUpdated={copy.lastUpdated}
      />
      <LegalSectionList sections={copy.sections} />
      <LegalRelatedLinks
        links={[
          { to: '/privacy', label: copy.related.privacy },
          { to: '/terms', label: copy.related.terms },
          { to: '/contact', label: copy.related.contact },
        ]}
      />
    </StaticPageShell>
  );
}
