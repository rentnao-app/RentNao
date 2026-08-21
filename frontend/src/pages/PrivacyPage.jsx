import StaticPageShell, {
  LegalRelatedLinks,
  LegalSectionList,
  StaticPageHero,
} from '../components/StaticPageShell';
import { useTranslation } from '../lib/i18n';

export default function PrivacyPage() {
  const { messages } = useTranslation();
  const copy = messages.privacy;

  return (
    <StaticPageShell
      backLabel={copy.back}
      navLinks={[
        { to: '/terms', label: copy.nav.terms },
        { to: '/cookies', label: copy.nav.cookies },
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
          { to: '/cookies', label: copy.related.cookies },
          { to: '/terms', label: copy.related.terms },
          { to: '/contact', label: copy.related.contact },
        ]}
      />
    </StaticPageShell>
  );
}
