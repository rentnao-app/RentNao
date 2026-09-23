import StaticPageShell, {
  LegalRelatedLinks,
  LegalSectionList,
  StaticPageHero,
} from '../components/StaticPageShell';
import { useTranslation } from '../lib/i18n';

export default function TermsPage() {
  const { messages } = useTranslation();
  const copy = messages.terms;

  return (
    <StaticPageShell
      backLabel={copy.back}
      navLinks={[
        { to: '/privacy', label: copy.nav.privacy },
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
          { to: '/privacy', label: copy.related.privacy },
          { to: '/cookies', label: copy.related.cookies },
          { to: '/contact', label: copy.related.contact },
        ]}
      />
    </StaticPageShell>
  );
}
