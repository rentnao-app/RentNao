import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';

/** Default size for main headers (wide mark + wordmark). */
export const BRAND_LOGO_IMG_CLASS =
  'h-8 w-auto max-w-[min(100%,9.5rem)] object-contain object-left sm:h-9 md:h-10 sm:max-w-[12rem] md:max-w-[14rem]';

/** Smaller mark for mobile drawers / compact rows. */
export const BRAND_LOGO_IMG_CLASS_COMPACT = 'h-8 w-auto max-w-[10rem] object-contain object-left sm:h-9 sm:max-w-[11rem]';

/**
 * Primary home link in the top-left of every page. Uses `/icon.png` (full wordmark in asset).
 */
export default function BrandLogoLink({ className = '', imgClassName, src = '/icon.png', onClick }) {
  const { t } = useTranslation();

  return (
    <Link
      to="/"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${className}`.trim()}
      aria-label={t('brand.homeAriaLabel')}
    >
      <img src={src} alt="" draggable={false} className={imgClassName ?? BRAND_LOGO_IMG_CLASS} />
    </Link>
  );
}
