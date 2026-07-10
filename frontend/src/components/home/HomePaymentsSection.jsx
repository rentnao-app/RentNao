import { useMemo } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, Menu, Phone, Shield, TrendingUp, Wallet, Zap } from 'lucide-react';
import { aosFadeLeft, aosFadeUp, aosStagger } from '../../lib/aos';
import { homeSectionContentMt, homeSectionInner, homeSectionPy } from './homeLayout';
import { useTranslation } from '../../lib/i18n';

const CHART_HEIGHTS = [45, 55, 35, 75, 50, 85, 65];
const CHART_HIGHLIGHT_INDEX = 5;

function MonthlyIncomeChart({ months, incomeTitle, incomeChange }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0e241c] px-3.5 py-3.5 sm:px-4 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-white sm:text-sm">{incomeTitle}</p>
        <span className="text-[11px] font-bold text-[#57e089] sm:text-xs">{incomeChange}</span>
      </div>

      <div className="mt-3 flex h-[4.75rem] items-end justify-between gap-1.5 sm:h-[5rem]">
        {CHART_HEIGHTS.map((height, index) => {
          const highlighted = index === CHART_HIGHLIGHT_INDEX;

          return (
            <div key={months[index]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className={`w-full max-w-[1.35rem] rounded-t-[7px] transition-colors ${
                  highlighted ? 'bg-[#57e089] shadow-[0_0_12px_rgba(87,224,137,0.35)]' : 'bg-[#2f6b50]'
                }`}
                style={{ height: `${height}%` }}
                aria-hidden
              />
              <span
                className={`text-[9px] font-medium sm:text-[10px] ${
                  highlighted ? 'text-[#8fdcb0]' : 'text-[#6b8f7a]'
                }`}
              >
                {months[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div className="flex items-center justify-between px-3.5 pt-2 text-[10px] font-semibold text-white/90 sm:px-4 sm:pt-2.5">
      <span>9:41</span>
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="flex gap-0.5">
          {[0, 1, 2, 3].map((bar) => (
            <span
              key={bar}
              className="w-[3px] rounded-sm bg-white/85"
              style={{ height: `${6 + bar * 2}px` }}
            />
          ))}
        </span>
        <svg className="h-3 w-3 text-white/85" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C7.03 3 3 7.03 3 12h2a7 7 0 0 1 7-7V3zm0 4a5 5 0 0 0-5 5h2a3 3 0 0 1 3-3V7zm0 4a1 1 0 0 0-1 1h2a1 1 0 0 0-1-1v-2z" />
        </svg>
        <span className="h-2.5 w-5 rounded-[3px] border border-white/70 p-[1px]">
          <span className="block h-full w-[70%] rounded-[2px] bg-white/85" />
        </span>
      </div>
    </div>
  );
}

function WalletActionButton({ label, type }) {
  const iconClassName = 'h-4 w-4 text-white';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm sm:h-11 sm:w-11 sm:rounded-[0.95rem]">
        {type === 'in' ? (
          <ArrowDown className={iconClassName} strokeWidth={2.25} aria-hidden />
        ) : type === 'out' ? (
          <ArrowUp className={iconClassName} strokeWidth={2.25} aria-hidden />
        ) : (
          <Menu className={iconClassName} strokeWidth={2.25} aria-hidden />
        )}
      </span>
      <span className="text-[9px] font-medium text-white/88 sm:text-[10px]">{label}</span>
    </div>
  );
}

function PaymentFeatureIcon({ icon }) {
  const className = 'h-4 w-4 text-white sm:h-[1.125rem] sm:w-[1.125rem]';

  switch (icon) {
    case 'zap':
      return <Zap className={className} strokeWidth={2} aria-hidden />;
    case 'phone':
      return <Phone className={className} strokeWidth={2} aria-hidden />;
    case 'trend':
      return <TrendingUp className={className} strokeWidth={2} aria-hidden />;
    case 'shield':
      return <Shield className={className} strokeWidth={2} aria-hidden />;
    case 'wallet':
      return <Wallet className={className} strokeWidth={2} aria-hidden />;
    default:
      return null;
  }
}

function PaymentFeatureCard({ icon, title, description }) {
  return (
    <article className="flex items-start gap-2.5 rounded-xl border border-[#dfece4] bg-white p-3 shadow-[0_1px_2px_rgba(42,125,79,0.04)] sm:gap-3 sm:rounded-2xl sm:p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2A7D4F] sm:h-10 sm:w-10">
        <PaymentFeatureIcon icon={icon} />
      </div>
      <div className="min-w-0 pt-0.5">
        <h3 className="text-sm font-bold leading-snug text-brand-ink sm:text-[0.9375rem]">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-brand-muted sm:text-sm">{description}</p>
      </div>
    </article>
  );
}

function PaymentFlowPills({ steps }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-2.5">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2 sm:gap-2.5">
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold sm:px-3.5 sm:py-2 sm:text-sm ${
              step.active
                ? 'bg-[#2A7D4F] text-white shadow-[0_4px_14px_-4px_rgba(42,125,79,0.45)]'
                : 'border border-[#2A7D4F]/20 bg-[#E8F4EE] text-[#2A7D4F]'
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#2A7D4F]/50 sm:block" strokeWidth={2} aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WalletPhoneMockup({ t }) {
  const months = useMemo(
    () => [
      t('home.paymentsChartDec'),
      t('home.paymentsChartJan'),
      t('home.paymentsChartFeb'),
      t('home.paymentsChartMar'),
      t('home.paymentsChartApr'),
      t('home.paymentsChartMay'),
      t('home.paymentsChartJun'),
    ],
    [t]
  );

  const transactions = useMemo(
    () => [
      {
        title: t('home.paymentsMockTxn1Title'),
        amount: t('home.paymentsMockTxn1Amount'),
        date: t('home.paymentsMockTxnDate'),
        status: t('home.paymentsMockCompleted'),
        tone: 'success',
      },
      {
        title: t('home.paymentsMockTxn2Title'),
        amount: t('home.paymentsMockTxn2Amount'),
        date: t('home.paymentsMockTxnDate'),
        status: t('home.paymentsMockCompleted'),
        tone: 'success',
      },
      {
        title: t('home.paymentsMockTxn3Title'),
        amount: t('home.paymentsMockTxn3Amount'),
        date: t('home.paymentsMockTxnDate'),
        status: t('home.paymentsMockPending'),
        tone: 'pending',
      },
    ],
    [t]
  );

  const walletActions = useMemo(
    () => [
      { label: t('home.paymentsMockCashIn'), type: 'in' },
      { label: t('home.paymentsMockCashOut'), type: 'out' },
      { label: t('home.paymentsMockHistory'), type: 'history' },
    ],
    [t]
  );

  return (
    <div className="mx-auto w-full max-w-[17rem] shrink-0 sm:max-w-[18rem] lg:mx-0 lg:max-w-[19rem]">
      <div className="rounded-[2rem] border-[6px] border-[#0a1712] bg-[#0a1712] p-1.5 shadow-[0_24px_60px_-18px_rgba(10,23,18,0.65)] sm:rounded-[2.25rem] sm:border-[7px] sm:p-2">
        <div className="overflow-hidden rounded-[1.35rem] bg-[#0b1f18] sm:rounded-[1.5rem]">
          <PhoneStatusBar />

          <div className="space-y-2.5 px-3 pb-3 pt-0.5 sm:space-y-3 sm:px-3.5 sm:pb-3.5">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3d9460] via-[#2f8444] to-[#256c38] px-3.5 pb-4 pt-3.5 text-white shadow-[0_10px_24px_-8px_rgba(47,132,68,0.55)] sm:px-4 sm:pb-4 sm:pt-4">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#7fd4a0]/18 blur-2xl" aria-hidden />
              <div className="pointer-events-none absolute right-1 top-1 h-16 w-16 rounded-full bg-[#9ae0b8]/22" aria-hidden />

              <p className="relative text-[10px] font-medium text-white/78 sm:text-[11px]">{t('home.paymentsMockBalanceLabel')}</p>
              <p className="relative mt-0.5 text-[1.45rem] font-bold leading-none tracking-tight sm:text-[1.6rem]">
                {t('home.paymentsMockBalance')}
              </p>

              <div className="relative mt-4 flex items-start gap-4 sm:gap-5">
                {walletActions.map((action) => (
                  <WalletActionButton key={action.label} label={action.label} type={action.type} />
                ))}
              </div>
            </div>

            <MonthlyIncomeChart
              months={months}
              incomeTitle={t('home.paymentsMockIncomeTitle')}
              incomeChange={t('home.paymentsMockIncomeChange')}
            />

            <div className="rounded-xl border border-white/[0.06] bg-[#102820] px-3.5 py-3 sm:px-4 sm:py-3.5">
              <p className="text-xs font-bold text-white sm:text-sm">{t('home.paymentsMockRecentTitle')}</p>
              <ul className="mt-2 divide-y divide-white/[0.08]">
                {transactions.map((txn) => (
                  <li key={txn.title} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        txn.tone === 'success' ? 'bg-[#1a3d2e] text-[#6ee7a0]' : 'bg-[#3d2a14] text-[#fbbf24]'
                      }`}
                    >
                      {txn.tone === 'success' ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" aria-hidden />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-white sm:text-xs">{txn.title}</p>
                      <p className="text-[9px] text-white/45 sm:text-[10px]">{txn.date}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-bold text-white sm:text-xs">{txn.amount}</p>
                      <p
                        className={`text-[9px] font-semibold sm:text-[10px] ${
                          txn.tone === 'success' ? 'text-[#6ee7a0]' : 'text-[#fbbf24]'
                        }`}
                      >
                        {txn.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePaymentsSection() {
  const { t } = useTranslation();

  const flowSteps = useMemo(
    () => [
      { id: 'tenant', label: t('home.paymentsFlow1'), active: false },
      { id: 'wallet', label: t('home.paymentsFlow2'), active: true },
      { id: 'owner', label: t('home.paymentsFlow3'), active: false },
    ],
    [t]
  );

  const features = useMemo(
    () => [
      {
        id: 'auto',
        icon: 'zap',
        title: t('home.paymentsFeature1Title'),
        description: t('home.paymentsFeature1Desc'),
      },
      {
        id: 'reminders',
        icon: 'phone',
        title: t('home.paymentsFeature2Title'),
        description: t('home.paymentsFeature2Desc'),
      },
      {
        id: 'history',
        icon: 'trend',
        title: t('home.paymentsFeature3Title'),
        description: t('home.paymentsFeature3Desc'),
      },
      {
        id: 'secure',
        icon: 'shield',
        title: t('home.paymentsFeature4Title'),
        description: t('home.paymentsFeature4Desc'),
      },
      {
        id: 'topup',
        icon: 'wallet',
        title: t('home.paymentsFeature5Title'),
        description: t('home.paymentsFeature5Desc'),
      },
    ],
    [t]
  );

  return (
    <section
      className={`bg-[#fafcfb] ${homeSectionPy}`}
      aria-labelledby="home-payments-heading"
    >
      <div className={homeSectionInner}>
        <header className="mx-auto max-w-2xl text-center" {...aosFadeUp()}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A7D4F] sm:text-[0.8125rem]">
            {t('home.paymentsEyebrow')}
          </p>
          <h2
            id="home-payments-heading"
            className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight text-brand-ink sm:text-3xl lg:text-[2rem]"
          >
            {t('home.paymentsTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">{t('home.paymentsSubtitle')}</p>
        </header>

        <div className={`flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-20 xl:gap-24 ${homeSectionContentMt}`}>
          <div className="w-full min-w-0 max-w-[24rem] sm:max-w-[27rem] lg:shrink-0" {...aosFadeUp(80)}>
            <PaymentFlowPills steps={flowSteps} />

            <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
              {features.map((feature, index) => (
                <div key={feature.id} {...aosFadeUp(aosStagger(index, 50))}>
                  <PaymentFeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </div>
              ))}
            </div>
          </div>

          <div {...aosFadeLeft(140)}>
            <WalletPhoneMockup t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}
