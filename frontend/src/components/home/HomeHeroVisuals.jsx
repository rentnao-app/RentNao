/** Right-column hero — separate mobile vs desktop image layouts. */

const HERO_BUILDING_MAIN = '/hero-building-1.png';
const HERO_BUILDING_OVERLAP = '/hero-interior-1.png';

function KycBadge({ t, compact = false }) {
  return (
    <div
      className={`absolute inline-flex items-center rounded-full bg-white/90 font-semibold text-gray-800 shadow-sm backdrop-blur-md ${
        compact
          ? 'right-3 top-3 gap-1.5 px-2.5 py-1 text-[10px]'
          : 'right-4 top-4 gap-2 px-3.5 py-2 text-xs'
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ${
          compact ? 'h-4 w-4' : 'h-5 w-5'
        }`}
      >
        <svg className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2l7 3v6c0 5-3.4 9.7-7 11-3.6-1.3-7-6-7-11V5l7-3zm-1 13l5-5-1.4-1.4L11 12.2l-1.6-1.6L8 12l3 3z" />
        </svg>
      </span>
      {t('home.kycSecured')}
    </div>
  );
}

function HeroVisualsMobile({ t }) {
  return (
    <div className="mx-auto mb-2 w-full max-w-[21rem] px-2 sm:max-w-md sm:px-0 lg:hidden">
      <div className="relative">
        <div className="relative overflow-hidden rounded-2xl shadow-[0_16px_40px_-14px_rgba(15,23,42,0.25)]">
          <img
            src={HERO_BUILDING_MAIN}
            alt={t('home.heroPhotoPrimaryAlt')}
            className="aspect-[16/11] w-full object-cover"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <KycBadge t={t} compact />
        </div>

        <div className="relative z-10 -mt-14 ml-3 w-[52%] max-w-[10.5rem] overflow-hidden rounded-xl shadow-[0_12px_28px_-8px_rgba(15,23,42,0.3)] ring-[3px] ring-white sm:-mt-16 sm:ml-4 sm:max-w-[11.5rem]">
          <img
            src={HERO_BUILDING_OVERLAP}
            alt={t('home.heroPhotoSecondaryAlt')}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

function HeroVisualsDesktop({ t }) {
  return (
    <div className="relative mx-auto hidden w-full max-w-[25rem] lg:block">
      <div className="relative pb-10">
        <div className="relative ml-auto w-[92%] overflow-hidden rounded-[1.35rem] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.28)]">
          <img
            src={HERO_BUILDING_MAIN}
            alt={t('home.heroPhotoPrimaryAlt')}
            className="aspect-[5/4] w-full object-cover"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <KycBadge t={t} />
        </div>

        <div className="absolute -bottom-2 -left-6 z-10 w-[min(56%,12.5rem)] overflow-hidden rounded-[1.125rem] shadow-[0_18px_44px_-12px_rgba(15,23,42,0.34)]">
          <img
            src={HERO_BUILDING_OVERLAP}
            alt={t('home.heroPhotoSecondaryAlt')}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

export default function HomeHeroVisuals({ t }) {
  return (
    <>
      <HeroVisualsMobile t={t} />
      <HeroVisualsDesktop t={t} />
    </>
  );
}
